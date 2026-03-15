"use client";

type PostSessionSummaryProps = {
  durationSeconds: number;
  onRestart: () => void;
  reason: string;
  teaName?: string;
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export default function PostSessionSummary({
  durationSeconds,
  onRestart,
  reason,
  teaName,
}: PostSessionSummaryProps) {
  return (
    <div className="cha-surface w-full max-w-[34rem] rounded-[1.8rem] p-6 text-left md:p-7">
      <p className="text-[10px] uppercase tracking-[0.3em] text-cha-green-light/62">
        Tea Session Complete
      </p>
      <h1 className="mt-3 max-w-md font-serif text-4xl text-cha-cream">
        The table returns to stillness.
      </h1>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-cha-cream/76">
        Master Chady has closed the ceremony. You can begin another session whenever
        you are ready for a new pour.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[0.82fr_0.95fr_1.2fr]">
        <div className="rounded-2xl border border-cha-green-light/10 bg-cha-cream/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cha-green-light/58">Duration</p>
          <p className="mt-2 font-serif text-2xl text-cha-orange">
            {formatDuration(durationSeconds)}
          </p>
        </div>
        <div className="rounded-2xl border border-cha-green-light/10 bg-cha-cream/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cha-green-light/58">Tea</p>
          <p className="mt-2 font-serif text-2xl text-cha-green-light">{teaName ?? "Observed tea"}</p>
        </div>
        <div className="rounded-2xl border border-cha-green-light/10 bg-cha-cream/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cha-green-light/58">Closure</p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-cha-cream/74">{reason}</p>
        </div>
      </div>

      <button
        className="mt-6 w-full rounded-full bg-cha-orange px-6 py-3 text-sm font-semibold text-cha-cream transition hover:bg-[#f17147] sm:w-auto"
        onClick={onRestart}
        type="button"
      >
        Begin New Tea Session
      </button>
    </div>
  );
}
