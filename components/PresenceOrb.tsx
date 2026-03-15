"use client";

import type { PresenceState } from "@/lib/live/types";

type PresenceOrbProps = {
  presenceState: PresenceState;
};

function getOrbOuterClass(presenceState: PresenceState) {
  if (presenceState === "speaking") {
    return "border-cha-cream/22 bg-[radial-gradient(circle_at_32%_30%,rgba(252,251,249,0.2),transparent_24%),linear-gradient(145deg,rgba(181,208,195,0.22),rgba(49,87,74,0.16))] shadow-[0_0_80px_rgba(181,208,195,0.24)] animate-[pulse_900ms_ease-in-out_infinite]";
  }
  if (presenceState === "processing") {
    return "border-cha-green-light/28 bg-cha-green-light/8 shadow-[0_0_70px_rgba(181,208,195,0.16)] animate-[pulse_3.8s_ease-in-out_infinite]";
  }
  if (presenceState === "listening") {
    return "border-cha-green-light/32 bg-transparent shadow-[0_0_50px_rgba(181,208,195,0.14)]";
  }
  return "border-cha-green-light/16 bg-cha-green-dark/12 shadow-[0_0_30px_rgba(11,21,17,0.22)]";
}

function getOrbCoreClass(presenceState: PresenceState) {
  if (presenceState === "speaking") {
    return "bg-[radial-gradient(circle_at_30%_30%,rgba(252,251,249,0.99),transparent_18%),linear-gradient(145deg,rgba(252,251,249,0.9),rgba(181,208,195,0.84)_55%,rgba(49,87,74,0.42))] shadow-[0_0_70px_rgba(181,208,195,0.34)] animate-[pulse_850ms_ease-in-out_infinite]";
  }
  if (presenceState === "processing") {
    return "bg-[radial-gradient(circle_at_35%_30%,rgba(252,251,249,0.94),transparent_20%),radial-gradient(circle_at_50%_50%,rgba(181,208,195,0.56),rgba(49,87,74,0.28)_70%)] shadow-[0_0_60px_rgba(181,208,195,0.26)] animate-[pulse_4s_ease-in-out_infinite]";
  }
  if (presenceState === "listening") {
    return "bg-[radial-gradient(circle_at_35%_30%,rgba(252,251,249,0.9),transparent_18%),radial-gradient(circle_at_50%_55%,rgba(181,208,195,0.38),rgba(49,87,74,0.2)_72%)] shadow-[0_0_45px_rgba(181,208,195,0.2)]";
  }
  return "bg-[radial-gradient(circle_at_35%_30%,rgba(252,251,249,0.7),transparent_16%),radial-gradient(circle_at_50%_55%,rgba(181,208,195,0.24),rgba(49,87,74,0.22)_72%)] shadow-[0_0_30px_rgba(11,21,17,0.18)]";
}

function getPresenceLabel(presenceState: PresenceState) {
  if (presenceState === "speaking") return "Speaking";
  if (presenceState === "processing") return "Processing";
  if (presenceState === "listening") return "Listening";
  return "Stillness";
}

export default function PresenceOrb({ presenceState }: PresenceOrbProps) {
  return (
    <div
      className={`relative flex h-72 w-72 items-center justify-center rounded-full border ${getOrbOuterClass(
        presenceState,
      )} md:h-80 md:w-80`}
    >
      <div className="absolute inset-5 rounded-full border border-cha-cream/28" />
      <div
        className={`relative flex h-40 w-40 items-center justify-center rounded-full md:h-48 md:w-48 ${getOrbCoreClass(
          presenceState,
        )}`}
      >
        <div className="space-y-2 text-center">
          <p className="text-[11px] uppercase tracking-[0.34em] text-cha-green-dark/70">
            Presence
          </p>
          <p className="font-serif text-2xl text-cha-green-dark">{getPresenceLabel(presenceState)}</p>
        </div>
      </div>
    </div>
  );
}
