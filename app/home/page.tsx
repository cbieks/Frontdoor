import { DoorHero } from "@/components/marketing/DoorHero";
import { BeforeAfter } from "@/components/marketing/BeforeAfter";
import { CategoriesMarquee } from "@/components/marketing/CategoriesMarquee";
import { FAQ } from "@/components/marketing/FAQ";
import { Reveal } from "@/components/marketing/Reveal";

const STEPS = [
  {
    n: "01",
    title: "We find you. Or you find us.",
    body: "Either way, we start with your real business: your photos, reviews, and brand. The demo is the first move, before anyone signs anything.",
  },
  {
    n: "02",
    title: "We build your demo.",
    body: "Not a template. A real site made from your own photos, reviews, and brand, designed by us, not a drag-and-drop builder.",
  },
  {
    n: "03",
    title: "You approve it.",
    body: "Love it? Go live on your own domain in a day. Don't? Walk away. No commitment, no risk, nothing to install.",
  },
];

const INCLUDED = [
  "A custom site designed around your brand, not a template",
  "Your real reviews and photos, built right in",
  "Live on your own domain within 24 hours",
  "Hosting, updates, and changes handled for you",
  "Cancel anytime. The site is yours.",
];

export default function MarketingHome() {
  return (
    <main className="bg-paper text-ink">
      <DoorHero />

      {/* Bridge: speaks to the post-demo visitor. */}
      <section className="mx-auto max-w-4xl px-6 py-28 text-center sm:py-36">
        <Reveal>
          <p className="text-sm font-semibold tracking-[0.25em] text-clay">STEP INSIDE</p>
          <h2 className="mt-5 font-display text-[clamp(2rem,5.5vw,3.75rem)] font-bold leading-[1.02] text-ink">
            See what your website could be, before you pay a cent.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">
            No forms, no sales calls, no months of back-and-forth. We build a
            real demo of your site (your photos, your reviews, your brand),
            and you decide after. Here&apos;s the kind of before-and-after we mean.
          </p>
        </Reveal>
      </section>

      {/* Proof: the same business, transformed. */}
      <section className="mx-auto max-w-5xl px-6 pb-28 sm:pb-36">
        <Reveal className="mb-10 text-center">
          <h2 className="font-display text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-tight text-ink">
            The same business. A door people actually walk through.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <BeforeAfter />
          <p className="mt-5 text-center text-sm text-ink/60">
            Drag to compare. This is a sample, yours uses your real photos,
            reviews, and brand.
          </p>
        </Reveal>
      </section>

      {/* How it works: numbered editorial steps, not a card grid. */}
      <section className="border-y border-ink/10 bg-[oklch(0.95_0.014_75)]">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
          <Reveal>
            <h2 className="font-display text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-tight text-ink">
              How it works
            </h2>
          </Reveal>
          <div className="mt-14 flex flex-col divide-y divide-ink/10">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.08}>
                <div className="grid grid-cols-1 gap-3 py-9 sm:grid-cols-[auto_1fr] sm:gap-10">
                  <span className="font-display text-5xl font-bold leading-none text-clay/40 sm:text-6xl">
                    {step.n}
                  </span>
                  <div className="max-w-2xl">
                    <h3 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-lg leading-relaxed text-ink/70">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* The offer: one plain price, with a marquee of who we serve. */}
      <section id="offer" className="mx-auto max-w-6xl px-6 py-28 sm:py-36">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-[0.25em] text-clay">THE OFFER</p>
            <h2 className="mt-5 font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.0] text-ink">
              One price. Your whole front door.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/70">
              No tiers, no upsells, no surprise invoices. We build it, you approve
              it, and it goes live, or you pay nothing.
            </p>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="font-display text-6xl font-bold text-ink">$490</span>
              <span className="text-ink/60">to launch, then $50/mo</span>
            </div>
            <ul className="mt-8 space-y-3">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-ink/85">
                  <span
                    aria-hidden
                    className="mt-1 grid h-5 w-5 flex-none place-items-center rounded-full bg-clay text-xs text-paper"
                  >
                    ✓
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-clay px-8 py-4 text-base font-semibold text-paper shadow-[0_14px_44px_-14px_rgba(20,12,8,0.5)] transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-clay-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              See your demo
            </a>
          </Reveal>

          <Reveal delay={0.1}>
            <CategoriesMarquee />
          </Reveal>
        </div>
      </section>

      <FAQ />

      {/* Footer. Physical address + unsubscribe land here for CAN-SPAM at launch. */}
      <footer className="border-t border-ink/10 bg-night text-paper">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-14 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-display text-2xl tracking-tight">Frontdoor</span>
            <p className="mt-2 max-w-xs text-paper/60">
              Your website is your front door. We build the one worth walking
              through.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-paper/60 sm:items-end">
            <a href="#offer" className="hover:text-paper">
              The offer
            </a>
            <span>© {new Date().getFullYear()} Frontdoor</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
