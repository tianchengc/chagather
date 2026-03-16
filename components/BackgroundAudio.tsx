"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MusicPlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

type BackgroundAudioProps = {
  isEnabled: boolean;
  isSessionActive: boolean;
  onPlaybackError?: (message: string) => void;
  onPlaybackStateChange?: (state: MusicPlaybackState) => void;
  videoId: string;
  volume: number;
};

function postCommand(
  frame: HTMLIFrameElement | null,
  func: string,
  args: unknown[] = [],
) {
  frame?.contentWindow?.postMessage(
    JSON.stringify({
      event: "command",
      func,
      args,
    }),
    "https://www.youtube.com",
  );
}

export default function BackgroundAudio({
  isEnabled,
  isSessionActive,
  onPlaybackError,
  onPlaybackStateChange,
  videoId,
  volume,
}: BackgroundAudioProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isFrameReady, setIsFrameReady] = useState(false);

  const src = useMemo(() => {
    const params = new URLSearchParams({
      autoplay: isEnabled ? "1" : "0",
      controls: "0",
      disablekb: "1",
      enablejsapi: "1",
      fs: "0",
      iv_load_policy: "3",
      loop: "1",
      modestbranding: "1",
      origin: typeof window !== "undefined" ? window.location.origin : "",
      playlist: videoId,
      playsinline: "1",
      rel: "0",
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [isEnabled, videoId]);

  useEffect(() => {
    setIsFrameReady(false);
  }, [src]);

  useEffect(() => {
    if (!isSessionActive) {
      onPlaybackStateChange?.("idle");
      onPlaybackError?.("");
      return;
    }

    if (!isFrameReady) {
      onPlaybackStateChange?.(isEnabled ? "loading" : "paused");
      return;
    }

    const frame = iframeRef.current;
    if (!frame) {
      onPlaybackError?.("The soundtrack player could not be initialized.");
      return;
    }

    onPlaybackError?.("");
    onPlaybackStateChange?.(isEnabled ? "loading" : "paused");

    const schedule = isEnabled ? [150, 600, 1500, 3000] : [100, 400];
    const timeouts = schedule.map((delayMs) =>
      window.setTimeout(() => {
        postCommand(frame, "setVolume", [volume]);
        if (isEnabled) {
          postCommand(frame, "unMute");
          postCommand(frame, "playVideo");
        } else {
          postCommand(frame, "mute");
          postCommand(frame, "pauseVideo");
        }
      }, delayMs),
    );

    const settleTimeout = window.setTimeout(() => {
      onPlaybackStateChange?.(isEnabled ? "playing" : "paused");
    }, isEnabled ? 900 : 250);

    return () => {
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
      window.clearTimeout(settleTimeout);
    };
  }, [isEnabled, isFrameReady, isSessionActive, onPlaybackError, onPlaybackStateChange, volume]);

  if (!isSessionActive) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-0 left-0 h-px w-px overflow-hidden opacity-0"
    >
      <iframe
        allow="autoplay; encrypted-media"
        className="h-px w-px border-0"
        key={videoId}
        onLoad={() => setIsFrameReady(true)}
        ref={iframeRef}
        src={src}
        title="ChaGather background audio"
      />
    </div>
  );
}
