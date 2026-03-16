"use client";

import { GoogleGenAI } from "@google/genai";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import {
  base64ToUint8,
  computePeakAbs,
  computeRms,
  computeZeroCrossingRate,
  downsampleBuffer,
  extractMimeSampleRate,
  floatTo16BitPCM,
  setTracksEnabled,
  uint8ToBase64,
} from "@/lib/live/audio";
import {
  DEFAULT_GEMINI_LIVE_MODEL,
  LIVE_API_VERSION,
  MASTER_CHADY_LIVE_CONFIG,
} from "@/lib/live/masterChady";
import { fetchTeaData, resolveBrewTimerSeconds } from "@/lib/live/tea";
import type {
  BrewContext,
  EphemeralTokenResponse,
  LiveSession,
  LiveTransportDiagnostics,
  PresenceState,
  TeaSessionSummary,
} from "@/lib/live/types";

const TARGET_INPUT_RATE = 16000;
const SNAP_COOLDOWN_MS = 900;
const OPENING_GREETING_PROMPT =
  "Begin the ceremony now. Greet the user as Master Chady in a calm, warm, wise tone and ask what tea they are preparing today.";

function getPresenceState(params: {
  hasMediaAccess: boolean;
  isAiSpeaking: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isProcessing: boolean;
}): PresenceState {
  const { hasMediaAccess, isAiSpeaking, isConnected, isConnecting, isProcessing } = params;

  if (isAiSpeaking) return "speaking";
  if (isConnecting || isProcessing) return "processing";
  if (isConnected || hasMediaAccess) return "listening";
  return "idle";
}

function getSessionCopy(params: {
  error: string;
  hasMediaAccess: boolean;
  hasStartedSession: boolean;
  isAiSpeaking: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isProcessing: boolean;
}) {
  const {
    error,
    hasMediaAccess,
    hasStartedSession,
    isAiSpeaking,
    isConnected,
    isConnecting,
    isProcessing,
  } = params;

  if (error) return error;
  if (!hasStartedSession) return "Begin the ceremony to wake Master Chady and the ambient tea room.";
  if (isAiSpeaking) return "Master Chady is speaking. You can interrupt naturally at any time.";
  if (isConnecting) return "Opening the live tea channel for Master Chady.";
  if (isProcessing) return "Master Chady is watching the tea table and preparing the next step.";
  if (isConnected) return "Speak to Master Chady and show the tea table when prompted.";
  if (hasMediaAccess) return "Tea space is ready. Tap Start Session to begin the ceremony.";
  return "Open the camera or microphone to invite Master Chady to the table.";
}

function formatLiveCloseReason(event: CloseEvent) {
  const reason = event.reason?.trim();
  const code = event.code;

  if (code === 1008) {
    return reason
      ? `Live session closed by Gemini policy (${code}): ${reason}`
      : `Live session closed by Gemini policy (${code}).`;
  }

  if (reason) {
    return `Live session closed (${code}): ${reason}`;
  }

  return `Live session closed unexpectedly (${code}).`;
}

function parseFunctionArgs(args: unknown) {
  if (args && typeof args === "object" && !Array.isArray(args)) {
    return args as Record<string, unknown>;
  }

  if (typeof args === "string") {
    try {
      const parsed = JSON.parse(args) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }

  return {};
}

type UseLiveSessionOptions = {
  hasStartedSession: boolean;
  onBackgroundMusicChange: (params: { searchQuery?: string; vibe?: string }) => {
    id: string;
    label: string;
  };
  onBackgroundMusicToggle: () => boolean;
  onBrewTimerStart: (seconds: number) => void;
  onSessionEnded: (summary: TeaSessionSummary) => void;
};

export function useLiveSession({
  hasStartedSession,
  onBackgroundMusicChange,
  onBackgroundMusicToggle,
  onBrewTimerStart,
  onSessionEnded,
}: UseLiveSessionOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [audioVolume, setAudioVolume] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasMediaAccess, setHasMediaAccess] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [brewContext, setBrewContext] = useState<BrewContext | null>(null);
  const [isBrewDrawerVisible, setIsBrewDrawerVisible] = useState(false);
  const [error, setError] = useState("");
  const [transportDiagnostics, setTransportDiagnostics] = useState<LiveTransportDiagnostics>({
    audioChunksSent: 0,
    cameraFacingMode: "unknown",
    lastVideoFrameAt: null,
    lastVideoFrameSize: null,
    videoFramesSent: 0,
  });

  const sessionRef = useRef<LiveSession | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const captureContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const playbackCursorRef = useRef(0);
  const speakingTimeoutRef = useRef<number | null>(null);
  const processingTimeoutRef = useRef<number | null>(null);
  const openingGreetingTimeoutRef = useRef<number | null>(null);
  const isAiSpeakingRef = useRef(false);
  const isMicEnabledRef = useRef(false);
  const isCameraEnabledRef = useRef(false);
  const transportReadyRef = useRef(false);
  const reconnectingRef = useRef(false);
  const connectionVersionRef = useRef(0);
  const isToolCallPendingRef = useRef(false);
  const sessionStartedAtRef = useRef<number | null>(null);
  const latestBrewContextRef = useRef<BrewContext | null>(null);
  const lastSnapDetectedAtRef = useRef(0);
  const previousAudioPeakRef = useRef(0);
  const previousAudioRmsRef = useRef(0);
  const audioChunksSentRef = useRef(0);
  const videoFramesSentRef = useRef(0);
  const cameraFacingModeRef = useRef("unknown");

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);


  const syncMicState = useCallback((enabled: boolean) => {
    isMicEnabledRef.current = enabled;
    setIsMicEnabled(enabled);
  }, []);

  const syncCameraState = useCallback((enabled: boolean) => {
    isCameraEnabledRef.current = enabled;
    setIsCameraEnabled(enabled);
  }, []);

  const clearSpeakingSoon = useCallback((delayMs = 420) => {
    if (speakingTimeoutRef.current) {
      window.clearTimeout(speakingTimeoutRef.current);
    }
    speakingTimeoutRef.current = window.setTimeout(() => {
      setIsAiSpeaking(false);
    }, delayMs);
  }, []);

  const clearProcessingSoon = useCallback((delayMs = 900) => {
    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current);
    }
    processingTimeoutRef.current = window.setTimeout(() => {
      setIsProcessing(false);
    }, delayMs);
  }, []);

  const showBrewDrawer = useCallback((nextContext: BrewContext) => {
    setBrewContext(nextContext);
    latestBrewContextRef.current = nextContext;
    setIsBrewDrawerVisible(true);
  }, []);

  const syncTransportDiagnostics = useCallback((nextState: Partial<LiveTransportDiagnostics>) => {
    startTransition(() => {
      setTransportDiagnostics((current) => ({
        ...current,
        ...nextState,
      }));
    });
  }, []);

  const syncCameraFacingMode = useCallback(
    (facingMode?: string) => {
      const nextFacingMode = facingMode?.trim() || "unknown";
      cameraFacingModeRef.current = nextFacingMode;
      syncTransportDiagnostics({ cameraFacingMode: nextFacingMode });
    },
    [syncTransportDiagnostics],
  );

  const handleDetectedSnap = useCallback(() => {
    const now = Date.now();
    if (now - lastSnapDetectedAtRef.current < SNAP_COOLDOWN_MS) {
      return;
    }

    lastSnapDetectedAtRef.current = now;
    onBackgroundMusicToggle();
  }, [onBackgroundMusicToggle]);

  const sendOpeningGreeting = useCallback(
    (session: LiveSession, connectionVersion: number, attempt = 0) => {
      if (connectionVersionRef.current !== connectionVersion) {
        return;
      }

      if (!transportReadyRef.current) {
        if (attempt >= 12) {
          return;
        }

        openingGreetingTimeoutRef.current = window.setTimeout(() => {
          sendOpeningGreeting(session, connectionVersion, attempt + 1);
        }, 160);
        return;
      }

      try {
        setIsProcessing(true);
        session.sendClientContent({
          turnComplete: true,
          turns: [
            {
              parts: [{ text: OPENING_GREETING_PROMPT }],
              role: "user",
            },
          ],
        });
        clearProcessingSoon(2200);
      } catch (sendError) {
        console.error("Failed to send Master Chady opening greeting", sendError);
      }
    },
    [clearProcessingSoon],
  );

  const updateBrewContextForTimer = useCallback(
    (params: { seconds: number; teaName?: string }) => {
      const { seconds, teaName } = params;
      const existingContext = latestBrewContextRef.current;
      const hasNamedTea = typeof teaName === "string" && teaName.trim().length > 0;
      const requestedTeaName = hasNamedTea ? teaName.trim() : undefined;

      const isSameTea =
        existingContext && requestedTeaName
          ? existingContext.teaName.trim().toLowerCase() === requestedTeaName.toLowerCase()
          : Boolean(existingContext && !requestedTeaName);

      const baseContext =
        existingContext && isSameTea
          ? existingContext
          : fetchTeaData(requestedTeaName ?? existingContext?.teaName ?? "House Tea");

      const nextContext: BrewContext = {
        ...baseContext,
        brewSeconds: seconds,
        currentInfusion: Math.max(1, existingContext && isSameTea ? existingContext.currentInfusion + 1 : 1),
      };

      showBrewDrawer(nextContext);
      return nextContext;
    },
    [showBrewDrawer],
  );

  const playPcmChunk = useCallback(
    (base64Data: string, mimeType?: string) => {
      const bytes = base64ToUint8(base64Data);
      const sampleRate = extractMimeSampleRate(mimeType);

      if (!playbackContextRef.current) {
        playbackContextRef.current = new AudioContext({ sampleRate });
      }

      const playbackContext = playbackContextRef.current;
      const byteLength = bytes.byteLength - (bytes.byteLength % 2);
      const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, byteLength / 2);
      const float = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i += 1) {
        float[i] = pcm[i] / 0x8000;
      }
      const chunkRms = computeRms(float);
      const nextAudioVolume = 1 + Math.min(1.4, chunkRms * 8);
      startTransition(() => {
        setAudioVolume(nextAudioVolume);
      });

      const audioBuffer = playbackContext.createBuffer(1, float.length, sampleRate);
      audioBuffer.copyToChannel(float, 0);

      const source = playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(playbackContext.destination);

      const startAt = Math.max(playbackContext.currentTime, playbackCursorRef.current);
      source.start(startAt);
      playbackCursorRef.current = startAt + audioBuffer.duration;
      source.onended = () => {
        if (playbackCursorRef.current <= playbackContext.currentTime + 0.05) {
          startTransition(() => {
            setAudioVolume(1);
          });
          clearSpeakingSoon(280);
        }
      };

      setIsProcessing(false);
      setIsAiSpeaking(true);
      clearSpeakingSoon(700);
    },
    [clearSpeakingSoon],
  );

  const stopAndResetAudioGraph = useCallback(async () => {
    processorNodeRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    silentGainRef.current?.disconnect();

    processorNodeRef.current = null;
    sourceNodeRef.current = null;
    silentGainRef.current = null;

    if (captureContextRef.current && captureContextRef.current.state !== "closed") {
      await captureContextRef.current.close();
    }

    if (playbackContextRef.current && playbackContextRef.current.state !== "closed") {
      await playbackContextRef.current.close();
    }

    captureContextRef.current = null;
    playbackContextRef.current = null;
    playbackCursorRef.current = 0;
  }, []);

  const attachMediaStream = useCallback(async (stream: MediaStream) => {
    if (!cameraVideoRef.current) {
      return;
    }

    cameraVideoRef.current.srcObject = stream;

    try {
      await cameraVideoRef.current.play();
    } catch {
      // Autoplay can still be blocked until a user gesture.
    }
  }, []);

  const ensureMediaStream = useCallback(async () => {
    setError("");

    if (micStreamRef.current) {
      const liveTracks = micStreamRef.current.getTracks().filter((track) => track.readyState === "live");
      if (liveTracks.length > 0) {
        setHasMediaAccess(true);
        syncCameraFacingMode(micStreamRef.current.getVideoTracks()[0]?.getSettings().facingMode);
        await attachMediaStream(micStreamRef.current);
        return micStreamRef.current;
      }

      micStreamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: { ideal: "environment" } },
      });

      micStreamRef.current = stream;
      setHasMediaAccess(true);
      syncMicState(stream.getAudioTracks().some((track) => track.enabled));
      syncCameraState(stream.getVideoTracks().some((track) => track.enabled));
      syncCameraFacingMode(stream.getVideoTracks()[0]?.getSettings().facingMode);
      await attachMediaStream(stream);
      return stream;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Microphone and camera access were denied. Please enable permissions and try again.";
      setError(message);
      setHasMediaAccess(false);
      return null;
    }
  }, [attachMediaStream, syncCameraFacingMode, syncCameraState, syncMicState]);

  const stopMediaStream = useCallback(() => {
    if (micStreamRef.current) {
      for (const track of micStreamRef.current.getTracks()) {
        track.stop();
      }
      micStreamRef.current = null;
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }

    setHasMediaAccess(false);
    syncMicState(false);
    syncCameraState(false);
    syncCameraFacingMode("unknown");
  }, [syncCameraFacingMode, syncCameraState, syncMicState]);

  const fetchEphemeralToken = useCallback(async () => {
    const response = await fetch("/api/live/token", {
      method: "POST",
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as EphemeralTokenResponse | null;
    if (!response.ok) {
      throw new Error(payload?.error || "Failed to create a Gemini Live auth token.");
    }

    if (!payload?.token) {
      throw new Error("The token endpoint did not return a Gemini Live auth token.");
    }

    return payload.token;
  }, []);

  const disconnect = useCallback(async () => {
    connectionVersionRef.current += 1;
    transportReadyRef.current = false;
    isToolCallPendingRef.current = false;
    latestBrewContextRef.current = null;
    previousAudioPeakRef.current = 0;
    previousAudioRmsRef.current = 0;
    audioChunksSentRef.current = 0;
    videoFramesSentRef.current = 0;

    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (openingGreetingTimeoutRef.current) {
      window.clearTimeout(openingGreetingTimeoutRef.current);
      openingGreetingTimeoutRef.current = null;
    }

    try {
      sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true });
    } catch {
      // If the transport already closed, the stream-end signal is not needed.
    }

    sessionRef.current?.close();
    sessionRef.current = null;

    await stopAndResetAudioGraph();

    if (speakingTimeoutRef.current) {
      window.clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }

    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
    setAudioVolume(1);
    setIsProcessing(false);
  }, [stopAndResetAudioGraph]);

  const finalizeSession = useCallback(
    (reason: string) => {
      const startedAt = sessionStartedAtRef.current ?? Date.now();
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

      onSessionEnded({
        durationSeconds,
        reason,
        teaName: latestBrewContextRef.current?.teaName,
      });
    },
    [onSessionEnded],
  );

  const endSession = useCallback(async () => {
    await disconnect();
    stopMediaStream();
    setIsBrewDrawerVisible(false);
    setBrewContext(null);
  }, [disconnect, stopMediaStream]);

  const closeTeaSession = useCallback(
    async (reason: string) => {
      await endSession();
      finalizeSession(reason);
    },
    [endSession, finalizeSession],
  );

  const startCaptureStreaming = useCallback(
    (session: LiveSession) => {
      if (!micStreamRef.current) return;

      const captureContext = new AudioContext();
      captureContextRef.current = captureContext;

      const sourceNode = captureContext.createMediaStreamSource(micStreamRef.current);
      const processor = captureContext.createScriptProcessor(2048, 1, 1);
      const silentGain = captureContext.createGain();
      silentGain.gain.value = 0;

      sourceNodeRef.current = sourceNode;
      processorNodeRef.current = processor;
      silentGainRef.current = silentGain;

      processor.onaudioprocess = (event) => {
        if (!isMicEnabledRef.current || !transportReadyRef.current || isToolCallPendingRef.current) {
          return;
        }

        const channelData = event.inputBuffer.getChannelData(0);
        const rms = computeRms(channelData);
        if (rms > 0.018 && !isAiSpeakingRef.current) {
          setIsProcessing(true);
          clearProcessingSoon(1050);
        }

        const peak = computePeakAbs(channelData);
        const zeroCrossingRate = computeZeroCrossingRate(channelData);
        const crestFactor = peak / Math.max(rms, 0.0001);
        const previousRms = previousAudioRmsRef.current;
        const previousPeak = previousAudioPeakRef.current;
        const isSharpTransient =
          peak > 0.2 &&
          rms > 0.012 &&
          rms < 0.18 &&
          crestFactor > 4.2 &&
          zeroCrossingRate > 0.06 &&
          previousRms < 0.035 &&
          peak > previousPeak * 1.7;

        previousAudioRmsRef.current = rms;
        previousAudioPeakRef.current = peak;

        if (!isAiSpeakingRef.current && isSharpTransient) {
          handleDetectedSnap();
        }

        const downsampled = downsampleBuffer(channelData, captureContext.sampleRate, TARGET_INPUT_RATE);
        const pcm16 = floatTo16BitPCM(downsampled);
        const chunk = uint8ToBase64(new Uint8Array(pcm16.buffer));
        audioChunksSentRef.current += 1;

        try {
          session.sendRealtimeInput({
            audio: {
              data: chunk,
              mimeType: `audio/pcm;rate=${TARGET_INPUT_RATE}`,
            },
          });
          if (audioChunksSentRef.current % 12 === 0) {
            syncTransportDiagnostics({ audioChunksSent: audioChunksSentRef.current });
          }
        } catch (error) {
          transportReadyRef.current = false;
          console.error("Failed to send Gemini Live audio chunk", error);
          setError((current) => current || "Audio stream interrupted. Please reconnect.");
          void disconnect();
        }
      };

      sourceNode.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(captureContext.destination);
    },
    [clearProcessingSoon, disconnect, handleDetectedSnap, syncTransportDiagnostics],
  );

  const handleFunctionCalls = useCallback(
    (functionCalls: Array<any>) => {
      if (functionCalls.length === 0) {
        return;
      }

      isToolCallPendingRef.current = true;
      const functionResponses: Array<{
        id?: string;
        name: string;
        response: Record<string, unknown>;
      }> = [];

      for (const call of functionCalls) {
        if (call?.name === "getTeaProfile") {
          const args = parseFunctionArgs(call?.args);
          const teaNameRaw = args.teaName;

          if (typeof teaNameRaw !== "string" || teaNameRaw.trim().length === 0) {
            functionResponses.push({
              id: call?.id,
              name: "getTeaProfile",
              response: {
                error: "Missing teaName. Ask the user to confirm the tea before giving brew guidance.",
                status: "missing_tea_name",
              },
            });
            continue;
          }

          const teaName = teaNameRaw.trim();
          const teaProfile = fetchTeaData(teaName);
          const currentTea = latestBrewContextRef.current;
          const nextTeaProfile: BrewContext = {
            ...teaProfile,
            currentInfusion:
              currentTea?.teaName.trim().toLowerCase() === teaProfile.teaName.trim().toLowerCase()
                ? currentTea.currentInfusion
                : 0,
          };

          showBrewDrawer(nextTeaProfile);
          functionResponses.push({
            id: call?.id,
            name: "getTeaProfile",
            response: nextTeaProfile,
          });
          continue;
        }

        if (call?.name === "start_brew_timer") {
          const args = parseFunctionArgs(call?.args);
          const teaNameRaw = args.teaName;
          const secondsRaw = Number(args.seconds);
          const teaName = typeof teaNameRaw === "string" ? teaNameRaw : undefined;
          const seconds = teaName
            ? fetchTeaData(teaName).brewSeconds
            : resolveBrewTimerSeconds(undefined, Number.isFinite(secondsRaw) ? secondsRaw : undefined);
          const nextBrewContext = updateBrewContextForTimer({ seconds, teaName });

          onBrewTimerStart(seconds);
          functionResponses.push({
            id: call?.id,
            name: "start_brew_timer",
            response: {
              currentInfusion: nextBrewContext?.currentInfusion ?? 1,
              seconds,
              status: "started",
              teaName: nextBrewContext?.teaName ?? teaName ?? "Current tea",
            },
          });
          continue;
        }

        if (call?.name === "change_background_music") {
          const args = parseFunctionArgs(call?.args);
          const searchQueryRaw = args.search_query;
          const vibeRaw = args.vibe;
          const track = onBackgroundMusicChange({
            searchQuery: typeof searchQueryRaw === "string" ? searchQueryRaw : undefined,
            vibe: typeof vibeRaw === "string" ? vibeRaw : undefined,
          });

          functionResponses.push({
            id: call?.id,
            name: "change_background_music",
            response: {
              status: "changed",
              trackId: track.id,
              trackLabel: track.label,
            },
          });
          continue;
        }

        if (call?.name === "toggle_music") {
          const isMusicEnabled = onBackgroundMusicToggle();

          functionResponses.push({
            id: call?.id,
            name: "toggle_music",
            response: {
              isPlaying: isMusicEnabled,
              status: isMusicEnabled ? "playing" : "stopped",
            },
          });
          continue;
        }

        if (call?.name === "end_tea_session") {
          const args = parseFunctionArgs(call?.args);
          const reasonRaw = args.reason;
          const reason =
            typeof reasonRaw === "string" && reasonRaw.trim().length > 0
              ? reasonRaw.trim()
              : "Master Chady ended the tea ceremony.";

          functionResponses.push({
            id: call?.id,
            name: "end_tea_session",
            response: {
              reason,
              status: "ended",
            },
          });

          window.setTimeout(() => {
            void closeTeaSession(reason);
          }, 120);
        }
      }

      if (functionResponses.length === 0) {
        isToolCallPendingRef.current = false;
        return;
      }

      try {
        sessionRef.current?.sendToolResponse({ functionResponses });
      } catch (error) {
        console.error("Failed to send Gemini Live tool response", error);
        setError("Failed to send tool response for Master Chady.");
      } finally {
        isToolCallPendingRef.current = false;
      }
    },
    [
      closeTeaSession,
      onBackgroundMusicChange,
      onBackgroundMusicToggle,
      onBrewTimerStart,
      showBrewDrawer,
      updateBrewContextForTimer,
    ],
  );

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) {
      return;
    }

    transportReadyRef.current = false;
    isToolCallPendingRef.current = false;
    latestBrewContextRef.current = null;
    previousAudioPeakRef.current = 0;
    previousAudioRmsRef.current = 0;
    audioChunksSentRef.current = 0;
    videoFramesSentRef.current = 0;
    setError("");
    syncTransportDiagnostics({
      audioChunksSent: 0,
      cameraFacingMode: cameraFacingModeRef.current,
      lastVideoFrameAt: null,
      lastVideoFrameSize: null,
      videoFramesSent: 0,
    });

    if (sessionRef.current || captureContextRef.current || playbackContextRef.current) {
      await disconnect();
    }

    const stream = await ensureMediaStream();
    if (!stream) {
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setError("No microphone was found for the live session.");
      return;
    }

    if (!audioTracks.some((track) => track.enabled)) {
      setTracksEnabled(audioTracks, true);
      syncMicState(true);
    }

    setIsConnecting(true);
    setIsProcessing(true);

    try {
      const ephemeralToken = await fetchEphemeralToken();
      const ai = new GoogleGenAI({
        apiKey: ephemeralToken,
        httpOptions: { apiVersion: LIVE_API_VERSION },
      });
      const nextVersion = connectionVersionRef.current + 1;
      connectionVersionRef.current = nextVersion;
      sessionStartedAtRef.current = Date.now();

      const session = await ai.live.connect({
        model: DEFAULT_GEMINI_LIVE_MODEL,
        config: MASTER_CHADY_LIVE_CONFIG,
        callbacks: {
          onopen: () => {
            if (connectionVersionRef.current !== nextVersion) return;
            transportReadyRef.current = true;
            isToolCallPendingRef.current = false;
            setIsConnected(true);
            setIsConnecting(false);
            setIsProcessing(false);
            setError("");
          },
          onmessage: (message: any) => {
            if (connectionVersionRef.current !== nextVersion) return;
            handleFunctionCalls(message?.toolCall?.functionCalls ?? []);

            const parts = message?.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts) {
              const inline = part?.inlineData ?? part?.inline_data;
              const data = inline?.data;
              if (data) {
                const mimeType = inline?.mimeType ?? inline?.mime_type;
                playPcmChunk(data, mimeType);
              }
            }

            if (message?.serverContent?.turnComplete) {
              clearSpeakingSoon(280);
              clearProcessingSoon(220);
            }
          },
          onerror: (evt: ErrorEvent) => {
            if (connectionVersionRef.current !== nextVersion) return;
            transportReadyRef.current = false;
            isToolCallPendingRef.current = false;
            const errorMessage =
              evt.message ||
              (evt.error instanceof Error ? evt.error.message : "") ||
              "Live connection error occurred.";
            console.error("Gemini Live connection error", evt);
            setError(errorMessage);
            setIsConnecting(false);
            setIsConnected(false);
            setIsAiSpeaking(false);
            setIsProcessing(false);
            sessionRef.current = null;
            void stopAndResetAudioGraph();
          },
          onclose: (evt: CloseEvent) => {
            if (connectionVersionRef.current !== nextVersion) return;
            transportReadyRef.current = false;
            isToolCallPendingRef.current = false;
            console.warn("Gemini Live connection closed", {
              code: evt.code,
              reason: evt.reason,
              wasClean: evt.wasClean,
            });
            setIsConnecting(false);
            setIsConnected(false);
            setIsProcessing(false);
            setError((current) => current || formatLiveCloseReason(evt));
            clearSpeakingSoon(120);
            sessionRef.current = null;
            void stopAndResetAudioGraph();
          },
        },
      });

      if (connectionVersionRef.current !== nextVersion) {
        (session as LiveSession).close();
        return;
      }

      sessionRef.current = session as LiveSession;
      startCaptureStreaming(session as LiveSession);
      sendOpeningGreeting(session as LiveSession, nextVersion);
    } catch (err) {
      transportReadyRef.current = false;
      const message =
        err instanceof Error
          ? err.message
          : `Failed to connect to Gemini Live using ${DEFAULT_GEMINI_LIVE_MODEL}.`;
      setError(message);
      setIsConnecting(false);
      setIsConnected(false);
      setIsProcessing(false);
    }
  }, [
    clearProcessingSoon,
    clearSpeakingSoon,
    disconnect,
    ensureMediaStream,
    fetchEphemeralToken,
    handleFunctionCalls,
    isConnected,
    isConnecting,
    playPcmChunk,
    sendOpeningGreeting,
    startCaptureStreaming,
    stopAndResetAudioGraph,
    syncTransportDiagnostics,
    syncMicState,
  ]);

  const handleMicToggle = useCallback(async () => {
    const hadStream = Boolean(micStreamRef.current);
    const stream = await ensureMediaStream();
    if (!stream) {
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setError("No microphone was found on this device.");
      return;
    }

    if (!hadStream || (!isConnected && !isConnecting)) {
      setTracksEnabled(audioTracks, true);
      syncMicState(true);
      await connect();
      return;
    }

    const nextEnabled = !isMicEnabledRef.current;
    setTracksEnabled(audioTracks, nextEnabled);
    syncMicState(nextEnabled);

    if (!nextEnabled) {
      setIsProcessing(false);
    }
  }, [connect, ensureMediaStream, isConnected, isConnecting, syncMicState]);

  const handleCameraToggle = useCallback(async () => {
    const hadStream = Boolean(micStreamRef.current);
    const stream = await ensureMediaStream();
    if (!stream) {
      return;
    }

    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      setError("No camera was found on this device.");
      return;
    }

    if (!hadStream) {
      setTracksEnabled(videoTracks, true);
      syncCameraState(true);
      syncCameraFacingMode(videoTracks[0]?.getSettings().facingMode);

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        setTracksEnabled(audioTracks, false);
        syncMicState(false);
      }
      return;
    }

    const nextEnabled = !isCameraEnabledRef.current;
    setTracksEnabled(videoTracks, nextEnabled);
    syncCameraState(nextEnabled);
    syncCameraFacingMode(videoTracks[0]?.getSettings().facingMode);
  }, [ensureMediaStream, syncCameraFacingMode, syncCameraState, syncMicState]);

  const reconnect = useCallback(async () => {
    if (reconnectingRef.current || isConnecting) {
      return;
    }

    reconnectingRef.current = true;
    try {
      await disconnect();
      await connect();
    } finally {
      reconnectingRef.current = false;
    }
  }, [connect, disconnect, isConnecting]);

  useEffect(() => {
    return () => {
      void disconnect().finally(() => {
        stopMediaStream();
        if (openingGreetingTimeoutRef.current) {
          window.clearTimeout(openingGreetingTimeoutRef.current);
        }
      });
    };
  }, [disconnect, stopMediaStream]);

  useEffect(() => {
    if (!isConnected || !sessionRef.current) {
      return;
    }

    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
    }

    frameIntervalRef.current = window.setInterval(() => {
      if (!isCameraEnabledRef.current || !transportReadyRef.current || isToolCallPendingRef.current) {
        return;
      }

      const video = cameraVideoRef.current;
      const canvas = frameCanvasRef.current;
      const session = sessionRef.current;

      if (!video || !canvas || !session || video.readyState < 2) {
        return;
      }

      const width = Math.max(video.videoWidth || 320, 640);
      const height = Math.max(video.videoHeight || 180, 360);
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.drawImage(video, 0, 0, width, height);
      const frameDataUrl = canvas.toDataURL("image/jpeg", 0.82);
      const frameBase64 = frameDataUrl.replace(/^data:image\/jpeg;base64,/, "");
      videoFramesSentRef.current += 1;
      const sentAt = Date.now();

      try {
        session.sendRealtimeInput({
          video: {
            data: frameBase64,
            mimeType: "image/jpeg",
          },
        });
        syncTransportDiagnostics({
          lastVideoFrameAt: sentAt,
          lastVideoFrameSize: { height, width },
          videoFramesSent: videoFramesSentRef.current,
        });
      } catch (error) {
        transportReadyRef.current = false;
        console.error("Failed to send Gemini Live video frame", error);
        setError("Video frame streaming interrupted.");
        void disconnect();
      }
    }, 700);

    return () => {
      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [disconnect, isConnected]);

  const presenceState = getPresenceState({
    hasMediaAccess,
    isAiSpeaking,
    isConnected,
    isConnecting,
    isProcessing,
  });

  const sessionCopy = getSessionCopy({
    error,
    hasMediaAccess,
    hasStartedSession,
    isAiSpeaking,
    isConnected,
    isConnecting,
    isProcessing,
  });

  return {
    audioVolume,
    brewContext,
    cameraVideoRef,
    closeTeaSession,
    connect,
    endSession,
    error,
    frameCanvasRef,
    handleCameraToggle,
    handleMicToggle,
    hasMediaAccess,
    isAiSpeaking,
    isBrewDrawerVisible,
    isCameraEnabled,
    isConnected,
    isConnecting,
    isMicEnabled,
    isProcessing,
    presenceState,
    reconnect,
    sessionCopy,
    transportDiagnostics,
  };
}
