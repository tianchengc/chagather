"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { useBrewTimer } from "@/hooks/useBrewTimer";
import { useLiveSession } from "@/hooks/useLiveSession";
import { MUSIC_TRACKS } from "@/lib/live/musicCatalog";
import type { TeaSessionSummary } from "@/lib/live/types";
import BackgroundAudio from "./BackgroundAudio";
import BrewContextPanel from "./BrewContextPanel";
import BrewProgress from "./BrewProgress";
import ChaGatherLogo from "./ChaGatherLogo";
import PostSessionSummary from "./PostSessionSummary";
import PresenceOrb from "./PresenceOrb";
import SessionControls from "./SessionControls";
import SessionSettings from "./SessionSettings";

type LiveAgentSessionProps = {
  onExit?: () => void;
};

const SHOW_VISION_DEBUG = process.env.NEXT_PUBLIC_ENABLE_VISION_DEBUG === "true";

export default function LiveAgentSession({ onExit }: LiveAgentSessionProps) {
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<TeaSessionSummary | null>(null);
  const { brewTime, isBrewing, startBrewTimer, stopBrewTimer, timerRunId } = useBrewTimer();
  const {
    activeTrack,
    activeTrackId,
    changeMusic,
    handlePlaybackError,
    handlePlaybackStateChange,
    hasActivated,
    isMusicEnabled,
    isTrackPickerOpen,
    musicVolume,
    playbackError,
    playbackState,
    selectTrack,
    setIsTrackPickerOpen,
    setMusicVolume,
    startMusic,
    stopMusic,
    toggleMusic,
  } = useBackgroundMusic();

  const soundscapeTracks = Object.values(MUSIC_TRACKS).map((track) => ({
    id: track.id,
    label: track.label,
  }));

  const {
    brewContext,
    cameraVideoRef,
    closeTeaSession,
    connect,
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
  } = useLiveSession({
    hasStartedSession,
    onBackgroundMusicChange: changeMusic,
    onBackgroundMusicToggle: toggleMusic,
    onBrewTimerStart: startBrewTimer,
    onSessionEnded: (summary) => {
      void stopMusic();
      setSessionSummary(summary);
      setHasStartedSession(false);
    },
  });

  const handleStartSession = useCallback(async () => {
    setSessionSummary(null);
    setHasStartedSession(true);
    await startMusic();
    await connect();
  }, [connect, startMusic]);

  const handleReturnToTeaRoom = useCallback(() => {
    setSessionSummary(null);
    setHasStartedSession(false);
  }, []);

  const handleMicPrimaryAction = useCallback(async () => {
    if (!hasStartedSession && !isConnected && !isConnecting) {
      await handleStartSession();
      return;
    }

    await handleMicToggle();
  }, [handleMicToggle, handleStartSession, hasStartedSession, isConnected, isConnecting]);

  const handleEndSession = useCallback(async () => {
    await closeTeaSession("You ended the tea session manually.");
    await stopMusic();
    setHasStartedSession(false);
  }, [closeTeaSession, stopMusic]);

  const statusLabel = error
    ? "Session Alert"
    : isAiSpeaking
      ? "Master Chady Live"
      : isProcessing || isConnecting
        ? "Ceremony Warming"
        : isConnected
          ? "Tea Table Open"
          : "Ambient Tea Session";

  const showSummary = Boolean(sessionSummary) && !isConnected && !isConnecting;
  const showStartCard = !showSummary && !hasStartedSession && !isConnected && !isConnecting;
  const summaryData = showSummary ? sessionSummary : null;

  return (
    <section className="relative isolate min-h-screen overflow-hidden">
      <BackgroundAudio
        isEnabled={isMusicEnabled}
        isSessionActive={hasStartedSession || hasActivated}
        onPlaybackError={handlePlaybackError}
        onPlaybackStateChange={handlePlaybackStateChange}
        videoId={activeTrack.videoId}
        volume={musicVolume}
      />

      <div className="absolute inset-0">
        <video
          ref={cameraVideoRef}
          autoPlay
          className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${
            hasMediaAccess && isCameraEnabled
              ? transportDiagnostics.cameraFacingMode === "user"
                ? "[transform:scaleX(-1.04)] opacity-80"
                : "opacity-80"
              : transportDiagnostics.cameraFacingMode === "user"
                ? "[transform:scaleX(-1.02)] opacity-0"
                : "opacity-0"
          }`}
          muted
          playsInline
        />
        <div className="cha-ambient-blob cha-ambient-blob--amber left-[-8%] top-[10%] h-[28rem] w-[28rem]" />
        <div className="cha-ambient-blob cha-ambient-blob--sage right-[-6%] top-[14%] h-[30rem] w-[30rem]" />
        <div className="cha-ambient-blob cha-ambient-blob--forest bottom-[-12%] left-[18%] h-[24rem] w-[40rem]" />
        <div className="absolute inset-0 bg-cha-green-dark/30" />
        <div className="cha-ambient-wash absolute inset-0" />
        <div className="cha-ambient-veils" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(239,89,42,0.14),transparent_24%),radial-gradient(circle_at_78%_14%,rgba(181,208,195,0.16),transparent_26%),radial-gradient(circle_at_center,transparent_20%,rgba(16,32,25,0.38)_58%,rgba(8,14,11,0.68)_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-4 py-5 sm:px-5 sm:py-6 md:px-10 md:py-10">
        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ChaGatherLogo href="/" showWordmark={false} />
            {onExit ? (
              <button
                className="hidden rounded-full border border-cha-green-light/15 bg-cha-green-dark/30 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cha-cream/72 backdrop-blur-xl transition hover:border-cha-green-light/30 hover:text-cha-cream md:inline-flex"
                onClick={onExit}
                type="button"
              >
                Back Home
              </button>
            ) : (
              <Link
                className="hidden rounded-full border border-cha-green-light/15 bg-cha-green-dark/30 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cha-cream/72 backdrop-blur-xl transition hover:border-cha-green-light/30 hover:text-cha-cream md:inline-flex"
                href="/"
              >
                Back Home
              </Link>
            )}
          </div>

          <div className="status-pill flex max-w-[58vw] shrink-0 items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-cha-cream/66 md:max-w-none md:text-[11px] md:tracking-[0.22em]">
            <span
              className={`h-2 w-2 rounded-full ${
                error
                  ? "bg-cha-orange"
                  : isAiSpeaking
                    ? "bg-cha-green-light"
                    : isProcessing || isConnecting
                      ? "bg-cha-orange/90"
                      : hasMediaAccess
                        ? "bg-cha-cream"
                        : "bg-cha-green-light/35"
              }`}
            />
            <span className="md:hidden">{statusLabel}</span>
            <span className="hidden md:inline">{statusLabel}</span>
          </div>
        </div>

        <div
          className={`grid w-full flex-1 gap-8 pt-6 ${
            showSummary
              ? "max-w-5xl items-center pb-16 lg:grid-cols-1 lg:pt-12"
              : "max-w-6xl pb-56 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10 lg:pb-20 lg:pt-10"
          }`}
        >
          <div
            className={`grid min-w-0 gap-8 ${
              showSummary
                ? "justify-items-center xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center xl:gap-12"
                : "xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.75fr)] xl:items-center xl:gap-10"
            }`}
          >
            <div
              className={`order-2 flex min-w-0 flex-col items-center text-center xl:order-1 ${
                showSummary ? "xl:items-start xl:text-left" : "xl:items-start xl:text-left"
              }`}
            >
              <div className="flex w-full max-w-3xl flex-col items-center gap-4 px-1 xl:items-start xl:px-0">
                {summaryData ? (
                  <PostSessionSummary
                    durationSeconds={summaryData.durationSeconds}
                    onReturnToLobby={handleReturnToTeaRoom}
                    onRestart={() => void handleStartSession()}
                    reason={summaryData.reason}
                    teaName={summaryData.teaName}
                  />
                ) : null}

                {showStartCard ? (
                  <div className="cha-surface w-full max-w-2xl rounded-[1.9rem] p-5 text-left md:p-7">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-cha-green-light/80">
                      Start Session
                    </p>
                    <h1 className="mt-3 font-serif text-3xl text-cha-cream md:text-5xl">
                      Invite Master Chady to the tea table.
                    </h1>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-cha-cream/78 md:text-base">
                      Master Chady will greet the host, ask to see the teaware and dry leaves,
                      identify the tea, then guide the ceremony with brewing steps and live tea
                      answers.
                    </p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        className="rounded-full bg-cha-orange px-6 py-3 text-sm font-semibold text-cha-cream transition hover:bg-[#f17147]"
                        onClick={() => void handleStartSession()}
                        type="button"
                      >
                        Start Session
                      </button>
                      <p className="text-xs uppercase tracking-[0.24em] text-cha-green-light/54">
                        Music can play here even before you start a live session
                      </p>
                    </div>
                  </div>
                ) : null}

                {!showSummary ? (
                  <div className="w-full max-w-2xl space-y-3">
                    <p className="hidden text-xs uppercase tracking-[0.28em] text-cha-green-light/58 md:block">
                      Master Chady • Native Audio • Vision-Aware Ceremony Guide
                    </p>
                    <div className="cha-surface mx-auto w-full max-w-md rounded-3xl px-4 py-3 text-left md:hidden">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-cha-green-light/82">
                        Tea Master Status
                      </p>
                      <p
                        className={`mt-2 text-sm leading-relaxed ${
                          error ? "text-cha-orange" : "text-cha-cream/82"
                        }`}
                      >
                        {sessionCopy}
                      </p>
                    </div>
                    <p
                      className={`hidden text-sm leading-relaxed md:block md:text-base ${
                        error ? "text-cha-orange" : "text-cha-cream/78"
                      }`}
                    >
                      {sessionCopy}
                    </p>
                  </div>
                ) : null}

                {error && !showSummary ? (
                  <div className="flex justify-center xl:justify-start">
                    <button
                      className="rounded-full border border-cha-orange/30 bg-cha-orange/12 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-cha-cream transition hover:border-cha-orange/45 hover:bg-cha-orange/18"
                      onClick={() => void reconnect()}
                      type="button"
                    >
                      {isConnecting ? "Reconnecting" : "Reconnect Live Session"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="order-1 flex min-w-0 justify-center xl:order-2 xl:justify-end">
              <PresenceOrb presenceState={presenceState} />
            </div>
          </div>

          {!showSummary ? (
            <aside className="flex w-full min-w-0 flex-col gap-4 self-start justify-self-center lg:mt-8 lg:max-w-[320px] lg:justify-self-end">
              <div className="hidden lg:flex lg:flex-col lg:gap-2">
                <p className="px-1 text-[10px] uppercase tracking-[0.26em] text-cha-green-light/52">
                  Ceremony Controls
                </p>
                <SessionControls
                  isCameraEnabled={isCameraEnabled}
                  isMicEnabled={isMicEnabled}
                  isMusicEnabled={isMusicEnabled}
                  onCameraToggle={() => void handleCameraToggle()}
                  onEndSession={() => void handleEndSession()}
                  onMicToggle={() => void handleMicPrimaryAction()}
                  onMusicToggle={() => void toggleMusic()}
                />
              </div>

              {SHOW_VISION_DEBUG ? (
                <div className="cha-surface rounded-[1.5rem] p-4 text-left">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-cha-green-light/64">
                    Vision Link
                  </p>
                  <p className="mt-2 font-serif text-2xl text-cha-cream">
                    {transportDiagnostics.videoFramesSent > 0 ? "Streaming to Gemini" : "Waiting for frames"}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-cha-cream/68">
                    {transportDiagnostics.videoFramesSent > 0
                      ? `${transportDiagnostics.videoFramesSent} frames sent from the ${transportDiagnostics.cameraFacingMode} camera${
                          transportDiagnostics.lastVideoFrameSize
                            ? ` at ${transportDiagnostics.lastVideoFrameSize.width}x${transportDiagnostics.lastVideoFrameSize.height}`
                            : ""
                        }.`
                      : "Enable the camera and keep the tea table in view so Master Chady can read the package and study the leaves."}
                  </p>
                </div>
              ) : null}

              <SessionSettings
                activeTrackLabel={activeTrack.label}
                activeTrackId={activeTrackId}
                isMusicEnabled={isMusicEnabled}
                isTrackPickerOpen={isTrackPickerOpen}
                musicVolume={musicVolume}
                onToggleTrackPicker={() => setIsTrackPickerOpen((current) => !current)}
                onTrackSelect={selectTrack}
                playbackError={playbackError}
                playbackState={playbackState}
                onVolumeChange={setMusicVolume}
                tracks={soundscapeTracks}
              />
            </aside>
          ) : null}
        </div>

        {!showSummary ? (
          <>
            <div
              className={`pointer-events-none fixed inset-x-0 z-20 flex justify-center px-4 ${
                isBrewing ? "bottom-44 md:bottom-52" : "bottom-24 md:bottom-32"
              }`}
            >
              <BrewContextPanel
                brewContext={brewContext}
                isVisible={isBrewDrawerVisible}
              />
            </div>

            <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center px-4 md:bottom-32">
              <BrewProgress
                duration={brewTime}
                infusion={brewContext?.currentInfusion}
                isActive={isBrewing}
                onComplete={stopBrewTimer}
                runId={timerRunId}
                teaName={brewContext?.teaName}
              />
            </div>

            <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:hidden">
              <SessionControls
                isCameraEnabled={isCameraEnabled}
                isMicEnabled={isMicEnabled}
                isMusicEnabled={isMusicEnabled}
                onCameraToggle={() => void handleCameraToggle()}
                onEndSession={() => void handleEndSession()}
                onMicToggle={() => void handleMicPrimaryAction()}
                onMusicToggle={() => void toggleMusic()}
              />
            </div>
          </>
        ) : null}
      </div>

      <canvas ref={frameCanvasRef} className="hidden" />
    </section>
  );
}
