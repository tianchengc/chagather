"use client";

import { GoogleGenAI, Modality } from "@google/genai";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ChaGatherLogo from "./ChaGatherLogo";

type LiveSession = {
  sendRealtimeInput: (params: {
    audio?: Blob;
    media?: { data: string; mimeType: string };
    video?: Blob;
    audioStreamEnd?: boolean;
    activityStart?: Record<string, never>;
    activityEnd?: Record<string, never>;
  }) => void;
  sendToolResponse: (params: {
    functionResponses:
      | {
          id?: string;
          name: string;
          response: Record<string, unknown>;
        }
      | Array<{
          id?: string;
          name: string;
          response: Record<string, unknown>;
        }>;
  }) => void;
  close: () => void;
};

type BrewContext = {
  ratio: string;
  tcmBenefit: string;
  teaName: string;
  temperature: string;
};

type PresenceState = "idle" | "listening" | "processing" | "speaking";

type IconProps = {
  className?: string;
};

const TARGET_INPUT_RATE = 16000;
const DEFAULT_OUTPUT_RATE = 24000;

function MicIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </svg>
  );
}

function MicOffIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m4 4 16 16" />
      <path d="M9 5.2A3 3 0 0 1 15 6v4.2" />
      <path d="M15 15.4A3 3 0 0 1 9 13V9.6" />
      <path d="M5 11a7 7 0 0 0 11.3 5.5" />
      <path d="M19 11a7 7 0 0 1-1.2 3.9" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </svg>
  );
}

function CameraIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M4 7a2 2 0 0 1 2-2h8.5l2 2H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function CameraOffIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m4 4 16 16" />
      <path d="M6.8 6H14l2 2H18a2 2 0 0 1 2 2v5.2" />
      <path d="M10.8 10.9A3.5 3.5 0 0 1 15.1 15" />
      <path d="M4 8.8V18a2 2 0 0 0 2 2h11.2" />
    </svg>
  );
}

function EndSessionIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m8 8 8 8" />
      <path d="m16 8-8 8" />
    </svg>
  );
}

function base64ToUint8(base64: string) {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

function downsampleBuffer(
  buffer: Float32Array,
  sourceRate: number,
  targetRate: number,
) {
  if (targetRate >= sourceRate) {
    return buffer;
  }

  const ratio = sourceRate / targetRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accum += buffer[i];
      count += 1;
    }

    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, input[i]));
    output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return output;
}

function extractMimeSampleRate(mimeType?: string) {
  if (!mimeType) return DEFAULT_OUTPUT_RATE;
  const match = mimeType.match(/rate=(\d+)/i);
  return match ? Number(match[1]) : DEFAULT_OUTPUT_RATE;
}

function computeRms(input: Float32Array) {
  let sum = 0;
  for (let i = 0; i < input.length; i += 1) {
    sum += input[i] * input[i];
  }
  return Math.sqrt(sum / input.length);
}

function setTracksEnabled(tracks: MediaStreamTrack[], enabled: boolean) {
  for (const track of tracks) {
    track.enabled = enabled;
  }
}

function fetchTeaData(teaName: string) {
  const normalized = teaName.trim().toLowerCase();
  const profiles: Record<string, { temperature: string; ratio: string; tcmBenefit: string }> = {
    tieguanyin: {
      temperature: "95°C",
      ratio: "5g to 100ml",
      tcmBenefit: "Warms the stomach and supports digestion",
    },
    "da hong pao": {
      temperature: "100°C",
      ratio: "6g to 110ml",
      tcmBenefit: "Grounding warmth and post-meal comfort",
    },
    shoumei: {
      temperature: "90°C",
      ratio: "4g to 120ml",
      tcmBenefit: "Gentle cooling balance and throat soothing",
    },
  };

  return (
    profiles[normalized] ?? {
      temperature: "95°C",
      ratio: "5g to 100ml",
      tcmBenefit: "Warms the stomach",
    }
  );
}

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
  isAiSpeaking: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isProcessing: boolean;
}) {
  const { error, hasMediaAccess, isAiSpeaking, isConnected, isConnecting, isProcessing } = params;

  if (error) return error;
  if (isAiSpeaking) return "The tea master is speaking. You can interrupt naturally at any time.";
  if (isConnecting) return "Opening the live tea channel.";
  if (isProcessing) return "The tea master is considering what the tea table just revealed.";
  if (isConnected) return "Speak naturally. The live session is listening.";
  if (hasMediaAccess) return "Tea space is open. Tap the microphone to begin the live ceremony.";
  return "Open the camera or microphone to wake the ambient tea space.";
}

type LiveAgentSessionProps = {
  onExit?: () => void;
};

export default function LiveAgentSession({ onExit }: LiveAgentSessionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasMediaAccess, setHasMediaAccess] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [brewContext, setBrewContext] = useState<BrewContext | null>(null);
  const [isBrewDrawerVisible, setIsBrewDrawerVisible] = useState(false);
  const [error, setError] = useState("");

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
  const brewDrawerTimeoutRef = useRef<number | null>(null);
  const brewDrawerCleanupRef = useRef<number | null>(null);
  const isAiSpeakingRef = useRef(false);
  const isMicEnabledRef = useRef(false);
  const isCameraEnabledRef = useRef(false);
  const transportReadyRef = useRef(false);
  const reconnectingRef = useRef(false);
  const connectionVersionRef = useRef(0);

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
    if (brewDrawerTimeoutRef.current) {
      window.clearTimeout(brewDrawerTimeoutRef.current);
    }
    if (brewDrawerCleanupRef.current) {
      window.clearTimeout(brewDrawerCleanupRef.current);
    }

    setBrewContext(nextContext);
    setIsBrewDrawerVisible(true);

    brewDrawerTimeoutRef.current = window.setTimeout(() => {
      setIsBrewDrawerVisible(false);
      brewDrawerCleanupRef.current = window.setTimeout(() => {
        setBrewContext(null);
      }, 380);
    }, 5000);
  }, []);

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
      // Autoplay can still be blocked in some browsers until a user gesture.
    }
  }, []);

  const ensureMediaStream = useCallback(async () => {
    setError("");

    if (micStreamRef.current) {
      const liveTracks = micStreamRef.current.getTracks().filter((track) => track.readyState === "live");
      if (liveTracks.length > 0) {
        setHasMediaAccess(true);
        await attachMediaStream(micStreamRef.current);
        return micStreamRef.current;
      }

      micStreamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });

      micStreamRef.current = stream;
      setHasMediaAccess(true);
      syncMicState(stream.getAudioTracks().some((track) => track.enabled));
      syncCameraState(stream.getVideoTracks().some((track) => track.enabled));
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
  }, [attachMediaStream, syncCameraState, syncMicState]);

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
  }, [syncCameraState, syncMicState]);

  const disconnect = useCallback(async () => {
    connectionVersionRef.current += 1;
    transportReadyRef.current = false;

    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
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
    setIsProcessing(false);
  }, [stopAndResetAudioGraph]);

  const endSession = useCallback(async () => {
    await disconnect();
    stopMediaStream();
    setIsBrewDrawerVisible(false);
  }, [disconnect, stopMediaStream]);

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
        if (!isMicEnabledRef.current || !transportReadyRef.current) {
          return;
        }

        const channelData = event.inputBuffer.getChannelData(0);
        if (computeRms(channelData) > 0.018 && !isAiSpeakingRef.current) {
          setIsProcessing(true);
          clearProcessingSoon(1050);
        }

        const downsampled = downsampleBuffer(channelData, captureContext.sampleRate, TARGET_INPUT_RATE);
        const pcm16 = floatTo16BitPCM(downsampled);
        const chunk = new Blob([pcm16.buffer], {
          type: `audio/pcm;rate=${TARGET_INPUT_RATE}`,
        });

        try {
          session.sendRealtimeInput({ audio: chunk });
        } catch {
          transportReadyRef.current = false;
          setError("Audio stream interrupted. Please reconnect.");
          void disconnect();
        }
      };

      sourceNode.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(captureContext.destination);
    },
    [clearProcessingSoon, disconnect],
  );

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) {
      return;
    }

    transportReadyRef.current = false;
    setError("");

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

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Missing NEXT_PUBLIC_GEMINI_API_KEY in environment variables.");
      return;
    }

    setIsConnecting(true);
    setIsProcessing(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const nextVersion = connectionVersionRef.current + 1;
      connectionVersionRef.current = nextVersion;

      const session = await ai.live.connect({
        model: "gemini-live-2.5-flash-native-audio",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction:
            "You are a master Gongfu tea sommelier. Speak calmly, concisely, and with a grounded, peaceful tone.",
          tools: [
            {
              functionDeclarations: [
                {
                  name: "getTeaProfile",
                  description:
                    "Fetches the optimal water temperature, leaf ratio, and TCM properties for a specific tea.",
                  parametersJsonSchema: {
                    type: "object",
                    properties: {
                      teaName: {
                        type: "string",
                        description: "Name of the tea, e.g. Tieguanyin",
                      },
                    },
                    required: ["teaName"],
                    additionalProperties: false,
                    $schema: "http://json-schema.org/draft-07/schema#",
                  },
                },
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            if (connectionVersionRef.current !== nextVersion) return;
            transportReadyRef.current = true;
            setIsConnected(true);
            setIsConnecting(false);
            setIsProcessing(false);
            setError("");
          },
          onmessage: (message: any) => {
            if (connectionVersionRef.current !== nextVersion) return;
            const functionCalls = message?.toolCall?.functionCalls ?? [];
            for (const call of functionCalls) {
              if (call?.name !== "getTeaProfile") {
                continue;
              }

              const teaNameRaw = call?.args?.teaName;
              const teaName = typeof teaNameRaw === "string" ? teaNameRaw : "Tieguanyin";
              const teaProfile = fetchTeaData(teaName);

              showBrewDrawer({
                teaName,
                ...teaProfile,
              });

              try {
                sessionRef.current?.sendToolResponse({
                  functionResponses: [
                    {
                      id: call?.id,
                      name: "getTeaProfile",
                      response: {
                        teaName,
                        ...teaProfile,
                      },
                    },
                  ],
                });
              } catch {
                setError("Failed to send tool response for the tea profile.");
              }
            }

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
            setError(evt.message || "Live connection error occurred.");
            setIsConnecting(false);
            setIsConnected(false);
            setIsAiSpeaking(false);
            setIsProcessing(false);
            sessionRef.current = null;
            void stopAndResetAudioGraph();
          },
          onclose: () => {
            if (connectionVersionRef.current !== nextVersion) return;
            transportReadyRef.current = false;
            setIsConnecting(false);
            setIsConnected(false);
            setIsProcessing(false);
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
    } catch (err) {
      transportReadyRef.current = false;
      const message = err instanceof Error ? err.message : "Failed to connect to Gemini Live.";
      setError(message);
      setIsConnecting(false);
      setIsConnected(false);
      setIsProcessing(false);
    }
  }, [
    clearProcessingSoon,
    clearSpeakingSoon,
    ensureMediaStream,
    isConnected,
    isConnecting,
    disconnect,
    playPcmChunk,
    showBrewDrawer,
    startCaptureStreaming,
    stopAndResetAudioGraph,
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
  }, [ensureMediaStream, syncCameraState, syncMicState]);

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

        if (brewDrawerTimeoutRef.current) {
          window.clearTimeout(brewDrawerTimeoutRef.current);
        }
        if (brewDrawerCleanupRef.current) {
          window.clearTimeout(brewDrawerCleanupRef.current);
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
      if (!isCameraEnabledRef.current || !transportReadyRef.current) {
        return;
      }

      const video = cameraVideoRef.current;
      const canvas = frameCanvasRef.current;
      const session = sessionRef.current;

      if (!video || !canvas || !session) {
        return;
      }

      if (video.readyState < 2) {
        return;
      }

      const width = video.videoWidth || 320;
      const height = video.videoHeight || 180;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.drawImage(video, 0, 0, width, height);
      const frameDataUrl = canvas.toDataURL("image/jpeg", 0.75);
      const frameBase64 = frameDataUrl.replace(/^data:image\/jpeg;base64,/, "");

      try {
        session.sendRealtimeInput({
          media: {
            data: frameBase64,
            mimeType: "image/jpeg",
          },
        });
      } catch {
        transportReadyRef.current = false;
        setError("Video frame streaming interrupted.");
        void disconnect();
      }
    }, 1000);

    return () => {
      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [isConnected]);

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
    isAiSpeaking,
    isConnected,
    isConnecting,
    isProcessing,
  });

  const orbOuterClass =
    presenceState === "speaking"
      ? "border-amber-100/25 bg-gradient-to-br from-amber-300/25 via-amber-200/15 to-lime-300/20 shadow-[0_0_80px_rgba(251,191,36,0.28)] animate-[pulse_900ms_ease-in-out_infinite]"
      : presenceState === "processing"
        ? "border-amber-200/30 bg-amber-200/8 shadow-[0_0_70px_rgba(251,191,36,0.18)] animate-[pulse_3.8s_ease-in-out_infinite]"
        : presenceState === "listening"
          ? "border-amber-200/35 bg-transparent shadow-[0_0_50px_rgba(251,191,36,0.16)]"
          : "border-zinc-400/15 bg-zinc-900/20 shadow-[0_0_30px_rgba(0,0,0,0.25)]";

  const orbCoreClass =
    presenceState === "speaking"
      ? "bg-[radial-gradient(circle_at_30%_30%,rgba(255,251,235,0.98),transparent_18%),linear-gradient(145deg,rgba(251,191,36,0.96),rgba(132,204,22,0.72))] shadow-[0_0_80px_rgba(251,191,36,0.5)] animate-[pulse_850ms_ease-in-out_infinite]"
      : presenceState === "processing"
        ? "bg-[radial-gradient(circle_at_35%_30%,rgba(255,251,235,0.92),transparent_20%),radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.55),rgba(120,53,15,0.22)_70%)] shadow-[0_0_60px_rgba(251,191,36,0.32)] animate-[pulse_4s_ease-in-out_infinite]"
        : presenceState === "listening"
          ? "bg-[radial-gradient(circle_at_35%_30%,rgba(255,251,235,0.88),transparent_18%),radial-gradient(circle_at_50%_55%,rgba(251,191,36,0.34),rgba(24,24,27,0.14)_72%)] shadow-[0_0_45px_rgba(251,191,36,0.22)]"
          : "bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.16),transparent_16%),radial-gradient(circle_at_50%_55%,rgba(63,63,70,0.55),rgba(24,24,27,0.3)_72%)] shadow-[0_0_30px_rgba(0,0,0,0.22)]";

  return (
    <section className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <video
          ref={cameraVideoRef}
          autoPlay
          className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${
            hasMediaAccess && isCameraEnabled
              ? "scale-[1.04] opacity-80"
              : "scale-[1.02] opacity-0"
          }`}
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-zinc-950/45" />
        <div className="absolute inset-0 backdrop-blur-2xl bg-zinc-950/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(251,191,36,0.16),transparent_28%),radial-gradient(circle_at_78%_16%,rgba(132,204,22,0.12),transparent_24%),radial-gradient(circle_at_center,transparent_18%,rgba(9,9,11,0.35)_58%,rgba(9,9,11,0.78)_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-6 py-8 md:px-10 md:py-10">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <ChaGatherLogo href="/" showWordmark={false} />
            {onExit ? (
              <button
                className="rounded-full border border-white/10 bg-zinc-950/40 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-zinc-300 backdrop-blur-xl transition hover:border-amber-200/20 hover:text-amber-100"
                onClick={onExit}
                type="button"
              >
                Back Home
              </button>
            ) : (
              <Link
                className="rounded-full border border-white/10 bg-zinc-950/40 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-zinc-300 backdrop-blur-xl transition hover:border-amber-200/20 hover:text-amber-100"
                href="/"
              >
                Back Home
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/40 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400 backdrop-blur-xl">
            <span
              className={`h-2 w-2 rounded-full ${
                error
                  ? "bg-red-300"
                  : isAiSpeaking
                    ? "bg-lime-300"
                    : isProcessing || isConnecting
                      ? "bg-amber-300"
                      : hasMediaAccess
                        ? "bg-amber-100"
                        : "bg-zinc-500"
              }`}
            />
            Ambient Tea Session
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className={`relative flex h-72 w-72 items-center justify-center rounded-full border ${orbOuterClass} md:h-80 md:w-80`}>
            <div className="absolute inset-5 rounded-full border border-white/8" />
            <div className={`relative flex h-40 w-40 items-center justify-center rounded-full md:h-48 md:w-48 ${orbCoreClass}`}>
              <div className="space-y-2 text-center">
                <p className="text-[11px] uppercase tracking-[0.34em] text-zinc-950/70">
                  Presence
                </p>
                <p className="text-lg font-semibold text-zinc-950">
                  {presenceState === "speaking"
                    ? "Speaking"
                    : presenceState === "processing"
                      ? "Processing"
                      : presenceState === "listening"
                        ? "Listening"
                        : "Stillness"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 max-w-xl space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">
              Invisible UI • Native Audio • Vision-Aware Presence
            </p>
            <p
              className={`text-sm leading-relaxed md:text-base ${
                error ? "text-red-100" : "text-zinc-300"
              }`}
            >
              {sessionCopy}
            </p>
            {error ? (
              <div className="flex justify-center">
                <button
                  className="rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-amber-100 transition hover:border-amber-200/35 hover:bg-amber-300/15"
                  onClick={() => void reconnect()}
                  type="button"
                >
                  {isConnecting ? "Reconnecting" : "Reconnect Live Session"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-32 z-20 flex justify-center px-4">
          {brewContext ? (
            <div
              className={`pointer-events-auto w-full max-w-md rounded-[1.75rem] border border-white/10 bg-zinc-950/60 p-4 text-left text-zinc-100 shadow-[0_24px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all duration-300 ${
                isBrewDrawerVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-amber-100/90">
                    Brewing Context
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-zinc-50">{brewContext.teaName}</h2>
                </div>
                <div className="rounded-full border border-amber-200/15 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                  5s
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                    Water
                  </p>
                  <p className="mt-2 text-lg font-semibold text-amber-100">
                    {brewContext.temperature}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                    Ratio
                  </p>
                  <p className="mt-2 text-lg font-semibold text-lime-100">
                    {brewContext.ratio}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                {brewContext.tcmBenefit}
              </p>
            </div>
          ) : null}
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-zinc-950/50 px-3 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <button
              aria-label={isMicEnabled ? "Mute microphone" : "Enable microphone and connect"}
              className={`flex h-14 w-14 items-center justify-center rounded-full border transition ${
                isMicEnabled
                  ? "border-amber-200/25 bg-amber-300/14 text-amber-100"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-amber-200/20 hover:text-amber-100"
              }`}
              onClick={() => void handleMicToggle()}
              type="button"
            >
              {isMicEnabled ? (
                <MicIcon className="h-6 w-6" />
              ) : (
                <MicOffIcon className="h-6 w-6" />
              )}
            </button>

            <button
              aria-label={isCameraEnabled ? "Disable camera" : "Enable camera"}
              className={`flex h-14 w-14 items-center justify-center rounded-full border transition ${
                isCameraEnabled
                  ? "border-lime-200/25 bg-lime-300/14 text-lime-100"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-lime-200/20 hover:text-lime-100"
              }`}
              onClick={() => void handleCameraToggle()}
              type="button"
            >
              {isCameraEnabled ? (
                <CameraIcon className="h-6 w-6" />
              ) : (
                <CameraOffIcon className="h-6 w-6" />
              )}
            </button>

            <button
              aria-label="End session"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-red-300/20 bg-red-300/12 text-red-100 transition hover:border-red-300/35 hover:bg-red-300/18"
              onClick={() => void endSession()}
              type="button"
            >
              <EndSessionIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <canvas ref={frameCanvasRef} className="hidden" />
    </section>
  );
}
