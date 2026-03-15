import Link from "next/link";
import ChaGatherLogo from "../components/ChaGatherLogo";

const featureCards = [
  {
    blurb: "Natural two-way speech with Gemini Live and interruption-friendly responses.",
    icon: "◉",
    title: "Native audio conversation",
  },
  {
    blurb: "1 FPS front camera frames give tea-table awareness while the UI stays calm.",
    icon: "◌",
    title: "Vision-aware guidance",
  },
  {
    blurb: "Instant brewing context (temperature, ratio, TCM benefits) via structured tea tools.",
    icon: "◐",
    title: "Brew intelligence",
  },
];

const flow = ["Open /live", "Grant mic + camera", "Speak naturally", "Get brew insights"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(132,204,22,0.14),transparent_24%),linear-gradient(180deg,#09090b_0%,#111116_52%,#09090b_100%)]" />
        <div className="absolute left-0 top-24 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />
      </div>

      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-12 pt-6 md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <ChaGatherLogo href="/" />
          <span className="rounded-full border border-amber-200/15 bg-amber-300/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-amber-100/90 backdrop-blur-xl">
            Gemini Live Agent Challenge
          </span>
        </header>

        <div className="grid flex-1 gap-8 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">Traditional Gongfu tea master × ambient multimodal AI</p>
            <h1 className="mt-4 max-w-3xl text-4xl leading-tight text-zinc-50 md:text-6xl">
              Calm, responsive tea guidance without a crowded interface.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300">
              ChaGather is designed for voice-first tea rituals. The live page keeps visual noise low while Gemini Live listens,
              sees your setup, and responds with grounded brewing advice.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200"
                href="/live"
              >
                Enter /live Session
              </Link>
              <span className="text-sm text-zinc-400">Works on desktop and mobile. Add to home screen for PWA use.</span>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <p className="text-xs uppercase tracking-[0.26em] text-zinc-400">Live session flow</p>
            <div className="mt-5 rounded-3xl border border-white/10 bg-zinc-950/45 p-5">
              <div className="flex items-end justify-between gap-2">
                {flow.map((label, index) => (
                  <div key={label} className="flex flex-1 flex-col items-center gap-2 text-center">
                    <div className={`w-full rounded-t-xl ${index === 0 ? "h-8" : index === 1 ? "h-11" : index === 2 ? "h-14" : "h-10"} bg-gradient-to-t from-amber-300/30 to-lime-300/25`} />
                    <p className="text-[11px] text-zinc-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {featureCards.map((item) => (
                <article className="rounded-2xl border border-white/10 bg-white/5 p-4" key={item.title}>
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-100/90">{item.icon} {item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{item.blurb}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
