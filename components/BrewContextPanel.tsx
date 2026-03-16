"use client";

import type { BrewContext } from "@/lib/live/types";

type BrewContextPanelProps = {
  brewContext: BrewContext | null;
  isVisible: boolean;
};

export default function BrewContextPanel({
  brewContext,
  isVisible,
}: BrewContextPanelProps) {
  if (!brewContext) {
    return null;
  }

  return (
    <div
      className={`cha-surface pointer-events-auto w-full max-w-md rounded-[1.75rem] p-4 text-left text-cha-cream transition-all duration-300 sm:p-5 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cha-green-light/82">
            Brewing Context
          </p>
          <h2 className="mt-2 font-serif text-2xl text-cha-cream">{brewContext.teaName}</h2>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-cha-cream/56">
            {brewContext.currentInfusion > 0
              ? `Current Infusion #${brewContext.currentInfusion}`
              : "Ready for Infusion #1"}
          </p>
        </div>
        <div className="rounded-full border border-cha-green-light/18 bg-cha-green-light/12 px-3 py-1 text-xs text-cha-cream">
          Recommended {brewContext.brewSeconds}s
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cha-green-light/10 bg-cha-cream/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cha-green-light/56">Leaves</p>
          <p className="mt-2 text-sm font-semibold text-cha-cream">{brewContext.ratio}</p>
        </div>
        <div className="rounded-2xl border border-cha-green-light/10 bg-cha-cream/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cha-green-light/56">Water</p>
          <p className="mt-2 text-sm font-semibold text-cha-orange">{brewContext.temperature}</p>
        </div>
        <div className="rounded-2xl border border-cha-green-light/10 bg-cha-cream/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cha-green-light/56">Steep</p>
          <p className="mt-2 text-sm font-semibold text-cha-green-light">{brewContext.brewSeconds}s</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-cha-cream/72">{brewContext.tcmBenefit}</p>
    </div>
  );
}
