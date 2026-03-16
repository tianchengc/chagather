"use client";

type SessionSettingsProps = {
  activeTrackLabel: string;
  activeTrackId: string;
  isMusicEnabled: boolean;
  isTrackPickerOpen: boolean;
  musicVolume: number;
  onToggleTrackPicker: () => void;
  onTrackSelect: (trackId: string) => void;
  playbackError?: string;
  playbackState?: "idle" | "loading" | "playing" | "paused" | "error";
  onVolumeChange: (value: number) => void;
  tracks: Array<{ id: string; label: string }>;
};

export default function SessionSettings({
  activeTrackLabel,
  activeTrackId,
  isMusicEnabled,
  isTrackPickerOpen,
  musicVolume,
  onToggleTrackPicker,
  onTrackSelect,
  playbackError,
  playbackState,
  onVolumeChange,
  tracks,
}: SessionSettingsProps) {
  const statusLabel =
    playbackError || playbackState === "error"
      ? "Playback Error"
      : playbackState === "playing"
        ? "Soundscape is playing"
        : playbackState === "loading"
          ? "Soundscape is loading"
          : isMusicEnabled
            ? "Soundscape is starting"
            : "Soundscape is off";

  return (
    <div className="cha-surface w-full rounded-[1.5rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.28em] text-cha-green-light/62">
              Soundscape
            </p>
          </div>
          <p className="mt-2 font-serif text-2xl text-cha-cream">{activeTrackLabel}</p>
          <p className="mt-2 text-sm text-cha-cream/78">
            Controlled by the music note in Ceremony Controls. You can also snap your fingers to toggle it.
          </p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
            isMusicEnabled
              ? "border border-cha-green-light/24 bg-cha-green-light/12 text-cha-cream"
              : "border border-cha-cream/12 bg-cha-cream/5 text-cha-cream/56"
          }`}
        >
          {isMusicEnabled ? "Playing" : "Off"}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-cha-green-light/10 bg-cha-cream/5 px-3 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-cha-green-light/62">
            Current Status
          </p>
          <p className={`mt-2 text-sm font-medium ${playbackError ? "text-cha-orange" : "text-cha-cream"}`}>
            {statusLabel}
          </p>
          {playbackError ? (
            <p className="mt-2 text-xs leading-relaxed text-cha-orange/88">{playbackError}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-cha-green-light/62">
          <span>YouTube Tracks</span>
          <button
            className="rounded-full border border-cha-green-light/14 bg-cha-cream/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-cha-cream/72 transition hover:border-cha-green-light/24 hover:text-cha-cream"
            onClick={onToggleTrackPicker}
            type="button"
          >
            {isTrackPickerOpen ? "Hide Options" : "Choose Track"}
          </button>
        </div>
        {isTrackPickerOpen ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {tracks.map((track) => {
              const isActive = track.id === activeTrackId;
              return (
                <button
                  aria-pressed={isActive}
                  className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "border border-cha-green-light/24 bg-cha-green-light/12 text-cha-cream"
                      : "border border-cha-green-light/12 bg-cha-cream/5 text-cha-cream/70 hover:border-cha-green-light/24 hover:text-cha-cream"
                  }`}
                  key={track.id}
                  onClick={() => onTrackSelect(track.id)}
                  type="button"
                >
                  {track.label}
                </button>
              );
            })}
          </div>
        ) : null}
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
