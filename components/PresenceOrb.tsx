"use client";

import type { PresenceState } from "@/lib/live/types";

type PresenceOrbProps = {
  presenceState: PresenceState;
};

function getPresenceLabel(presenceState: PresenceState) {
  if (presenceState === "speaking") return "Speaking";
  if (presenceState === "processing") return "Observing";
  if (presenceState === "listening") return "Listening";
  return "Resting";
}

function getAuraClass(presenceState: PresenceState) {
  if (presenceState === "speaking") {
    return "opacity-100 scale-100 shadow-[0_0_120px_rgba(226,205,168,0.34)]";
  }
  if (presenceState === "processing") {
    return "opacity-90 scale-[0.98] shadow-[0_0_90px_rgba(181,208,195,0.26)]";
  }
  if (presenceState === "listening") {
    return "opacity-80 scale-[0.96] shadow-[0_0_70px_rgba(181,208,195,0.18)]";
  }
  return "opacity-70 scale-[0.94] shadow-[0_0_48px_rgba(8,14,11,0.22)]";
}

function getSpiritClass(presenceState: PresenceState) {
  if (presenceState === "speaking") {
    return "from-[#fff6e6] via-[#d9eadb] to-[#6a8c7c] animate-[pulse_1s_ease-in-out_infinite]";
  }
  if (presenceState === "processing") {
    return "from-[#f5efe2] via-[#b9d2c6] to-[#446657] animate-[pulse_3.6s_ease-in-out_infinite]";
  }
  if (presenceState === "listening") {
    return "from-[#efe7d8] via-[#adcabf] to-[#365447]";
  }
  return "from-[#ddd6c8] via-[#8ea99e] to-[#2a4036]";
}

export default function PresenceOrb({ presenceState }: PresenceOrbProps) {
  return (
    <div className="relative flex h-[22rem] w-[18rem] items-center justify-center md:h-[25rem] md:w-[20rem]">
      <div
        className={`absolute inset-4 rounded-[48%] bg-[radial-gradient(circle_at_top,rgba(247,232,205,0.32),transparent_34%),radial-gradient(circle_at_bottom,rgba(181,208,195,0.2),transparent_48%)] blur-2xl transition duration-700 ${getAuraClass(
          presenceState,
        )}`}
      />
      <div className="absolute inset-x-8 bottom-10 top-8 rounded-[45%] border border-cha-green-light/14 bg-cha-green-dark/18 backdrop-blur-[28px]" />
      <div className="absolute top-9 h-28 w-28 rounded-full border border-cha-cream/14 bg-[radial-gradient(circle_at_35%_30%,rgba(255,248,236,0.9),transparent_30%),radial-gradient(circle,rgba(240,214,171,0.24),transparent_68%)] blur-sm" />

      <div className="relative flex flex-col items-center">
        <div
          className={`relative h-24 w-24 rounded-full bg-gradient-to-b ${getSpiritClass(
            presenceState,
          )} shadow-[0_12px_40px_rgba(7,14,10,0.3)]`}
        >
          <div className="absolute inset-x-5 top-7 h-1.5 rounded-full bg-cha-green-dark/45 blur-[1px]" />
          <div className="absolute left-7 top-10 h-1.5 w-1.5 rounded-full bg-cha-green-dark/60" />
          <div className="absolute right-7 top-10 h-1.5 w-1.5 rounded-full bg-cha-green-dark/60" />
          <div className="absolute inset-x-8 top-[3.3rem] h-4 rounded-b-full border-b border-cha-green-dark/40" />
        </div>

        <div
          className={`relative mt-[-0.35rem] h-48 w-40 rounded-[46%_46%_38%_38%] bg-gradient-to-b ${getSpiritClass(
            presenceState,
          )} shadow-[0_18px_60px_rgba(7,14,10,0.34)]`}
        >
          <div className="absolute inset-x-7 top-8 h-24 rounded-[50%] border border-cha-cream/12 bg-[linear-gradient(180deg,rgba(13,25,20,0.08),rgba(13,25,20,0.22))]" />
          <div className="absolute left-[-1.4rem] top-10 h-24 w-12 rounded-[60%_40%_70%_45%] bg-gradient-to-b from-cha-cream/35 to-cha-green-light/10 blur-[1px]" />
          <div className="absolute right-[-1.4rem] top-10 h-24 w-12 rounded-[40%_60%_45%_70%] bg-gradient-to-b from-cha-cream/35 to-cha-green-light/10 blur-[1px]" />
          <div className="absolute inset-x-11 bottom-5 h-16 rounded-[50%] bg-[linear-gradient(180deg,rgba(247,232,205,0.26),rgba(181,208,195,0.06))]" />
        </div>

        <div className="mt-5 text-center">
          <p className="text-[11px] uppercase tracking-[0.34em] text-cha-green-light/70">
            Master Chady
          </p>
          <p className="mt-2 font-serif text-3xl text-cha-cream">{getPresenceLabel(presenceState)}</p>
          <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-cha-cream/64">
            A quiet tea spirit holding the room with steady attention.
          </p>
        </div>
      </div>
    </div>
  );
}
