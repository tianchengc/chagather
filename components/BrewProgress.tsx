"use client";

import { useEffect, useState } from "react";

type BrewProgressProps = {
  duration: number;
  infusion?: number;
  isActive: boolean;
  onComplete?: () => void;
  runId?: number;
  teaName?: string;
};

export default function BrewProgress({
  duration,
  infusion,
  isActive,
  onComplete,
  runId,
  teaName,
}: BrewProgressProps) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setRemaining(duration);
      return;
    }

    setRemaining(duration);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const nextRemaining = Math.max(duration - elapsedSeconds, 0);
      setRemaining(nextRemaining);

      if (nextRemaining === 0) {
        window.clearInterval(interval);
        onComplete?.();
      }
    }, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, [duration, isActive, onComplete, runId]);

  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  if (!isActive) {
    return null;
  }

  return (
    <div className="cha-surface w-full max-w-sm rounded-[1.75rem] p-4 text-left">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-cha-green-light/80">
            Brew Timer
          </p>
          <p className="mt-2 text-sm text-cha-cream/70">
            {teaName ? teaName : "Current tea"}
            {typeof infusion === "number" && infusion > 0 ? ` • Infusion #${infusion}` : ""}
          </p>
          <p className="mt-2 font-serif text-3xl text-cha-cream">{remaining}s</p>
        </div>
        <div className="h-14 w-14 rounded-full border border-cha-green-light/20 bg-cha-green-light/10 p-1">
          <div className="flex h-full w-full items-center justify-center rounded-full border border-cha-cream/10 bg-cha-green-dark/55 text-sm font-medium text-cha-green-light">
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-cha-green-dark/55">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cha-green-light via-cha-green-light to-cha-orange transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
