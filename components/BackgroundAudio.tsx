"use client";

import { useEffect, useMemo, useRef } from "react";

type BackgroundAudioProps = {
  isEnabled: boolean;
  isSessionActive: boolean;
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
  videoId,
  volume,
}: BackgroundAudioProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const src = useMemo(() => {
    const params = new URLSearchParams({
      autoplay: isSessionActive && isEnabled ? "1" : "0",
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
  }, [isEnabled, isSessionActive, videoId]);

  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame || !isSessionActive) {
      return;
    }

    const timeout = window.setTimeout(() => {
      postCommand(frame, "setVolume", [volume]);
      if (isEnabled) {
        postCommand(frame, "unMute");
        postCommand(frame, "playVideo");
      } else {
        postCommand(frame, "mute");
        postCommand(frame, "pauseVideo");
      }
    }, 900);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isEnabled, isSessionActive, src, videoId, volume]);

  if (!isSessionActive) {
    return null;
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed bottom-0 left-0 h-0 w-0 overflow-hidden opacity-0">
      <iframe
        allow="autoplay; encrypted-media"
        className="h-0 w-0 border-0"
        ref={iframeRef}
        src={src}
        title="ChaGather background audio"
      />
    </div>
  );
}
