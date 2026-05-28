"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";

const CTA_PRIMARY =
  "inline-flex items-center gap-2 rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)] transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-clay-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

// One clay door leaf with recessed panels, an amber handle, and an edge shadow
// that deepens toward the seam. `side` controls which edge the handle/shadow sit on.
function DoorLeaf({ side }: { side: "left" | "right" }) {
  const inner = side === "left" ? "right-[9%]" : "left-[9%]";
  const edge = side === "left" ? "right-0" : "left-0";
  const edgeShadow =
    side === "left"
      ? "linear-gradient(90deg, transparent, rgba(20,12,8,0.38))"
      : "linear-gradient(270deg, transparent, rgba(20,12,8,0.38))";

  return (
    <div
      className="relative h-full w-full"
      style={{
        background:
          "linear-gradient(170deg, oklch(0.52 0.14 41), oklch(0.40 0.12 39))",
      }}
    >
      <div
        className="absolute inset-x-[14%] top-[7%] h-[39%] rounded-[3px] border border-black/15"
        style={{ boxShadow: "inset 0 2px 10px rgba(0,0,0,0.28)" }}
      />
      <div
        className="absolute inset-x-[14%] bottom-[7%] h-[39%] rounded-[3px] border border-black/15"
        style={{ boxShadow: "inset 0 2px 10px rgba(0,0,0,0.28)" }}
      />
      <div
        className={`absolute top-1/2 ${inner} h-12 w-2 -translate-y-1/2 rounded-full`}
        style={{
          background: "oklch(0.82 0.13 78)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      />
      <div className={`absolute inset-y-0 ${edge} w-8`} style={{ background: edgeShadow }} />
    </div>
  );
}

export function DoorHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Smooth the raw scroll progress through a spring so transforms interpolate
  // every animation frame instead of stepping with the scroll event rate.
  // Trackpad / mouse-wheel scrolls fire at ~30–60 Hz with discrete deltas;
  // the spring fills the gaps and the motion reads as silk under any scroll
  // input. Tuned for tight tracking with no perceptible lag.
  const p = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 32,
    mass: 0.5,
    restDelta: 0.0005,
  });

  // Choreography of the scroll-through-the-door:
  //   p 0.00 – 0.20 :   stand outside, headline on closed doors
  //   p 0.20 – 0.34 :   intro headline fades; doors begin to crack
  //   p 0.28 – 0.72 :   doors open, scene pushes toward the viewer
  //   p 0.50 – 0.70 :   payoff headline + CTA emerge through the opening
  //   p 0.72 – 0.84 :   exterior wall dissolves once doors are off-screen
  // Wall must stay fully opaque while the doors are still moving — overlapping
  // a semi-opaque dark wall with the cream paper underneath reads as gray
  // bands flanking the doors. Keep the phases sequential, not crossfaded.
  const sceneScale = useTransform(p, [0, 1], [1, 2.7]);
  const wallOpacity = useTransform(p, [0.72, 0.84], [1, 0]);
  const leftX = useTransform(p, [0.28, 0.72], ["0%", "-118%"]);
  const rightX = useTransform(p, [0.28, 0.72], ["0%", "118%"]);
  const seamGlow = useTransform(p, [0.26, 0.62], [0, 1]);
  // Start exactly at 1.0 so the interior aligns to the doorway opening when
  // the doors are closed — otherwise it spills 3% past the panels as a halo.
  const interiorScale = useTransform(p, [0.3, 1], [1.0, 1.18]);

  const introOpacity = useTransform(p, [0.2, 0.34], [1, 0]);
  const introY = useTransform(p, [0.2, 0.34], [0, -40]);
  const topBarOpacity = useTransform(p, [0.32, 0.55], [1, 0]);
  const payoffOpacity = useTransform(p, [0.5, 0.7], [0, 1]);
  const payoffY = useTransform(p, [0.5, 0.7], [48, 0]);
  const cueOpacity = useTransform(p, [0, 0.1], [1, 0]);

  return (
    <section id="hero" ref={ref} className="relative h-[200vh] bg-paper">
      <div className="sticky top-0 h-screen overflow-hidden [perspective:1400px]">
        {/* Exterior wall: a dim porch at dusk, with two distant warm "lamps"
            drifting slowly behind the doors. `mix-blend-mode: screen` lets the
            lamps add light to the wall instead of reading as painted blobs;
            `isolation: isolate` keeps the blending contained to this layer so
            it doesn't bleed onto the doorway scene above. */}
        <motion.div
          aria-hidden
          className="absolute inset-0 overflow-hidden"
          style={{
            opacity: wallOpacity,
            background:
              "radial-gradient(125% 100% at 50% 38%, oklch(0.30 0.02 55), oklch(0.14 0.015 50) 72%)",
            isolation: "isolate",
          }}
        >
          <motion.div
            className="absolute -top-1/4 -left-1/4 h-[80vmax] w-[80vmax] rounded-full will-change-transform"
            style={{
              background:
                "radial-gradient(circle, oklch(0.62 0.14 62 / 0.42), transparent 62%)",
              mixBlendMode: "screen",
              filter: "blur(40px)",
            }}
            animate={{ x: [0, 80, -40, 0], y: [0, 60, 120, 0] }}
            transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-1/4 -right-1/4 h-[70vmax] w-[70vmax] rounded-full will-change-transform"
            style={{
              background:
                "radial-gradient(circle, oklch(0.55 0.16 38 / 0.36), transparent 60%)",
              mixBlendMode: "screen",
              filter: "blur(40px)",
            }}
            animate={{ x: [0, -60, 30, 0], y: [0, -40, -90, 0] }}
            transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* The doorway, scaled toward the viewer as you scroll. */}
        <motion.div
          className="absolute inset-0 grid place-items-center will-change-transform"
          style={{ scale: sceneScale }}
        >
          <div className="relative h-[86vh] w-[min(86vw,440px)]">
            {/* Frame molding behind the opening. */}
            <div
              className="absolute -inset-[3.4%] rounded-[8px]"
              style={{
                background:
                  "linear-gradient(180deg, oklch(0.48 0.13 41), oklch(0.36 0.11 39))",
                boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
              }}
            />

            {/* Interior light spilling through the opening, with two slow
                warm sunpatches drifting across the room — late-afternoon
                light catching different surfaces. Sits inside the opening
                so it scales with the doorway and stays bounded by it. */}
            <motion.div
              aria-hidden
              className="absolute inset-0 overflow-hidden"
              style={{
                scale: interiorScale,
                background:
                  "radial-gradient(90% 80% at 50% 42%, oklch(0.99 0.03 88), oklch(0.95 0.03 82) 52%, oklch(0.88 0.05 72))",
              }}
            >
              <motion.div
                className="absolute -top-[20%] left-0 h-[80%] w-[90%] rounded-full will-change-transform"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.90 0.09 68 / 0.55), transparent 62%)",
                  filter: "blur(30px)",
                }}
                animate={{ x: ["-10%", "20%", "-5%", "-10%"], y: ["0%", "25%", "55%", "0%"] }}
                transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-[15%] right-0 h-[70%] w-[80%] rounded-full will-change-transform"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.86 0.11 52 / 0.42), transparent 60%)",
                  filter: "blur(30px)",
                }}
                animate={{ x: ["0%", "-20%", "10%", "0%"], y: ["0%", "-30%", "-15%", "0%"] }}
                transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-1/2"
                style={{
                  background:
                    "linear-gradient(0deg, oklch(0.80 0.08 70 / 0.45), transparent)",
                }}
              />
            </motion.div>

            {/* Warm seam of light where the leaves meet. */}
            <motion.div
              aria-hidden
              className="absolute inset-y-0 left-1/2 w-[60%] -translate-x-1/2 blur-2xl"
              style={{
                opacity: seamGlow,
                background:
                  "radial-gradient(closest-side, oklch(0.92 0.1 80 / 0.9), transparent)",
              }}
            />

            {/* Door leaves. */}
            <motion.div
              className="absolute inset-y-0 left-0 w-1/2 origin-left overflow-hidden will-change-transform"
              style={{ x: leftX }}
            >
              <DoorLeaf side="left" />
            </motion.div>
            <motion.div
              className="absolute inset-y-0 right-0 w-1/2 origin-right overflow-hidden will-change-transform"
              style={{ x: rightX }}
            >
              <DoorLeaf side="right" />
            </motion.div>
          </div>
        </motion.div>

        {/* Top bar, fades as we cross the threshold. */}
        <motion.div
          className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10"
          style={{ opacity: topBarOpacity }}
        >
          <span className="font-display text-xl tracking-tight text-paper">Frontdoor</span>
          <a href="#offer" className="text-sm font-medium text-paper/80 hover:text-paper">
            See your demo
          </a>
        </motion.div>

        {/* Phase 1: outside, doors closed. */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-6 text-center"
          style={{ opacity: introOpacity, y: introY }}
        >
          <div className="max-w-4xl">
            <h1 className="font-display text-[clamp(2.6rem,9vw,6.5rem)] font-bold leading-[0.92] text-paper">
              Your website is
              <br />
              your front door.
            </h1>
            <p className="mx-auto mt-7 max-w-md text-lg text-paper/70">
              Right now, customers might be walking right past.
            </p>
          </div>
        </motion.div>

        {/* Phase 2: through the threshold. */}
        <motion.div
          className="absolute inset-0 z-10 grid place-items-center px-6 text-center"
          style={{ opacity: payoffOpacity, y: payoffY }}
        >
          <div className="max-w-3xl">
            <h2 className="font-display text-[clamp(2.2rem,6.5vw,5rem)] font-bold leading-[0.95] text-ink">
              Make a first impression
              <br />
              worth walking through.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-ink/70">
              We build one your customers actually trust. You just approve it.
            </p>
            <a href="#offer" className={`mt-9 ${CTA_PRIMARY}`}>
              See your demo
            </a>
          </div>
        </motion.div>

        {/* Scroll cue. */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-2 text-paper/60"
          style={{ opacity: cueOpacity }}
        >
          <span className="text-xs font-medium tracking-[0.25em]">SCROLL TO STEP INSIDE</span>
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="text-lg"
          >
            ↓
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
}
