"use client";

type SessionSettingsProps = {
  isMusicEnabled: boolean;
  musicVolume: number;
  onToggleMusic: () => void;
  onVolumeChange: (value: number) => void;
};

export default function SessionSettings({
  isMusicEnabled,
  musicVolume,
  onToggleMusic,
  onVolumeChange,
}: SessionSettingsProps) {
  return (
    <div className="cha-surface w-full rounded-[1.5rem] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-cha-green-light/62">
            Session Sound
          </p>
          <p className="mt-2 text-sm text-cha-cream/78">
            Ambient music sits behind Master Chady&apos;s voice.
          </p>
        </div>
        <button
          className={`rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.24em] transition ${
            isMusicEnabled
              ? "border border-cha-green-light/24 bg-cha-green-light/12 text-cha-cream"
              : "border border-cha-green-light/14 bg-cha-cream/5 text-cha-cream/56"
          }`}
          onClick={onToggleMusic}
          type="button"
        >
          {isMusicEnabled ? "Music On" : "Music Off"}
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-cha-green-light/62">
          <span>Volume</span>
          <span>{musicVolume}%</span>
        </div>
        <input
          aria-label="Background music volume"
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-cha-green-dark/55 accent-cha-orange"
          max={100}
          min={0}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          type="range"
          value={musicVolume}
        />
      </div>
    </div>
  );
}
