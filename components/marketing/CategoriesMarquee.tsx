"use client";

import { motion } from "motion/react";

const CATEGORIES = [
  "Restaurants",
  "Salons",
  "Cafés",
  "Barbershops",
  "Plumbers",
  "Med Spas",
  "Roofers",
  "Auto Shops",
  "Yoga Studios",
  "Dentists",
  "Florists",
  "Bakeries",
  "Pet Groomers",
  "Landscapers",
  "Caterers",
];

// CSS mask gradient instead of stacked vignette divs + per-frame opacity
// updates: one declaration, runs entirely on the compositor.
const MASK =
  "linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)";

// Vertical marquee of small-business categories — the "who we serve" beat
// inside the offer grid. Renders the list twice and translates by -50%
// for a seamless loop. The marketing site is a deliberate UI showcase, so
// motion plays for everyone — no prefers-reduced-motion gate.
export function CategoriesMarquee() {
  const doubled = [...CATEGORIES, ...CATEGORIES];

  return (
    <div
      aria-hidden
      className="relative h-[480px] overflow-hidden sm:h-[560px]"
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    >
      <motion.ul
        animate={{ y: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        className="flex flex-col text-center font-display font-light tracking-tight text-ink/80 will-change-transform"
      >
        {doubled.map((cat, i) => (
          <li
            key={`${cat}-${i}`}
            className="py-4 text-4xl sm:text-5xl lg:text-6xl"
          >
            {cat}
          </li>
        ))}
      </motion.ul>
    </div>
  );
}
