import Link from "next/link";

type ChaGatherLogoProps = {
  href?: string;
  showWordmark?: boolean;
};

export default function ChaGatherLogo({ href = "/", showWordmark = true }: ChaGatherLogoProps) {
  const content = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200/25 bg-zinc-900/70 shadow-[0_0_30px_rgba(251,191,36,0.18)] backdrop-blur-xl">
        <svg
          aria-hidden="true"
          className="h-6 w-6 text-amber-200"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
          viewBox="0 0 24 24"
        >
          <path d="M7 16h10" />
          <path d="M9 16c0-3.1 1.8-5.3 3-7.1" />
          <path d="M15 16c0-2.7-1.3-4.8-2.4-6.5" />
          <path d="M7.5 9.6c1.4-.5 2.6-.4 3.8.4" />
          <path d="M16.5 9.6c-1.3-.5-2.4-.4-3.6.3" />
          <path d="M6 18.5h12" />
        </svg>
      </span>
      {showWordmark ? (
        <span className="flex flex-col text-left leading-none">
          <span className="text-sm uppercase tracking-[0.28em] text-zinc-300">ChaGather</span>
          <span className="mt-1 text-[11px] tracking-[0.22em] text-amber-100/85">Ambient Tea AI</span>
        </span>
      ) : null}
    </>
  );

  return (
    <Link
      className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-zinc-950/40 px-3 py-2 backdrop-blur-xl transition hover:border-amber-200/20"
      href={href}
    >
      {content}
    </Link>
  );
}
