import Link from "next/link";
import ChaGatherLogo from "@/components/ChaGatherLogo";

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
    <main className="tea-page-background-soft min-h-screen text-cha-cream">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,14,0.08),rgba(10,18,14,0.22))]" />
        <div className="absolute left-0 top-24 h-80 w-80 rounded-full bg-cha-orange/10 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-cha-green-light/10 blur-3xl" />
      </div>

      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-12 pt-6 md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <ChaGatherLogo href="/" />
          <span className="rounded-full border border-cha-green-light/15 bg-cha-green-dark/30 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-cha-cream/78 backdrop-blur-xl">
            Gemini Live Agent Challenge
          </span>
        </header>

        <div className="grid flex-1 gap-8 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cha-green-light/58">
              Traditional Gongfu tea master × ambient multimodal AI
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-cha-cream md:text-6xl">
              Calm, responsive tea guidance without a crowded interface.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-cha-cream/74">
              ChaGather is designed for voice-first tea rituals. The live page keeps
              visual noise low while Gemini Live listens, sees your setup, and
              responds with grounded brewing advice.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                className="rounded-full bg-cha-orange px-6 py-3 text-sm font-semibold text-cha-cream transition hover:bg-[#f17147]"
                href="/live"
              >
                Enter /live Session
              </Link>
              <span className="text-sm text-cha-green-light/56">
                Works on desktop and mobile. Add to home screen for PWA use.
              </span>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <p className="text-xs uppercase tracking-[0.26em] text-cha-green-light/58">
              Live session flow
            </p>
            <div className="mt-5 rounded-3xl border border-cha-green-light/12 bg-cha-green-dark/28 p-5">
              <div className="flex items-end justify-between gap-2">
                {flow.map((label, index) => (
                  <div key={label} className="flex flex-1 flex-col items-center gap-2 text-center">
                    <div
                      className={`w-full rounded-t-xl ${
                        index === 0 ? "h-8" : index === 1 ? "h-11" : index === 2 ? "h-14" : "h-10"
                      } bg-gradient-to-t from-cha-orange/30 to-cha-green-light/30`}
                    />
                    <p className="text-[11px] text-cha-green-light/54">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {featureCards.map((item) => (
                <article
                  className="rounded-2xl border border-cha-green-light/10 bg-cha-cream/5 p-4"
                  key={item.title}
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-cha-green-light/82">
                    {item.icon} {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-cha-cream/72">
                    {item.blurb}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
