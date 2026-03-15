import Image from "next/image";
import Link from "next/link";

type ChaGatherLogoProps = {
  href?: string;
  showWordmark?: boolean;
};

export default function ChaGatherLogo({ href = "/", showWordmark = true }: ChaGatherLogoProps) {
  const content = (
    <>
      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/25 bg-zinc-900/70 shadow-[0_0_30px_rgba(251,191,36,0.18)] backdrop-blur-xl">
        <Image
          alt="ChaGather logo"
          className="h-full w-full object-cover"
          height={40}
          priority
          src="/logo.png"
          width={40}
        />
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
