"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

// A 2010s template-built cafe website, layered with the actual hallmarks of
// a neglected small-biz site in 2024: clashing announcement bar, tilted
// "NEW!" badge, generic "As Seen In" press logos, Comic Sans testimonials,
// floating chat widget. The kind of site that doesn't scream "ancient" so
// much as "tired and overstuffed."
function SiteMockBefore() {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-white"
      style={{ fontFamily: "'Times New Roman', Times, serif", color: "#333" }}
    >
      {/* Utility contact bar */}
      <div className="flex items-center justify-between bg-[#2c3e50] px-4 py-1 text-[9px] text-white">
        <span>Phone: (555) 123-4567</span>
        <span>info@thedailygrindcafe.com</span>
        <span>Follow: f / ig / tw</span>
      </div>

      {/* Clashing red+yellow announcement bar */}
      <div
        className="px-4 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-yellow-200"
        style={{ background: "#dc2626", fontFamily: "Arial, sans-serif" }}
      >
        ★ Free Wi-Fi ★ Best Coffee In Town ★ Happy Hour 3-5pm Daily ★
      </div>

      {/* Logo + nav */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
        <span className="text-[18px] font-bold tracking-wide" style={{ color: "#2c3e50" }}>
          THE DAILY GRIND
        </span>
        <div
          className="flex items-center gap-3 text-[10px] uppercase"
          style={{ color: "#2c3e50", fontFamily: "Arial, sans-serif" }}
        >
          <span>Home</span>
          <span>Menu</span>
          <span>About</span>
          <span>Contact</span>
          <span
            className="rounded-sm px-2 py-1 text-white"
            style={{ background: "#3498db", fontFamily: "Arial, sans-serif" }}
          >
            Order Online
          </span>
        </div>
      </div>

      {/* Hero with stock-photo gradient + tilted NEW badge */}
      <div
        className="relative flex h-[120px] items-center justify-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #6b4423 0%, #3a2818 60%, #1f130b 100%)",
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative text-center text-white">
          <p
            className="text-[16px] font-bold uppercase tracking-wide"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            Welcome to The Daily Grind
          </p>
          <p className="mt-0.5 text-[10px]" style={{ fontFamily: "Arial, sans-serif" }}>
            Your neighborhood coffee shop since 2008
          </p>
          <div className="mt-2 flex justify-center gap-1.5">
            <span
              className="rounded-sm px-2.5 py-1 text-[9px] font-bold uppercase text-white"
              style={{ background: "#3498db", fontFamily: "Arial, sans-serif" }}
            >
              Order Now
            </span>
            <span
              className="rounded-sm border border-white px-2.5 py-1 text-[9px] font-bold uppercase text-white"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Reserve a Table
            </span>
          </div>
        </div>
        <div
          className="absolute right-3 top-3 rotate-12 rounded-sm px-2 py-1 text-[9px] font-bold uppercase text-white shadow-md"
          style={{ background: "#f59e0b", fontFamily: "Arial, sans-serif" }}
        >
          ★ New Menu! ★
        </div>
      </div>

      {/* "As Seen In" placeholder press row */}
      <div className="border-b border-gray-200 px-4 py-2">
        <p
          className="mb-1 text-center text-[8px] uppercase tracking-[0.2em] text-gray-500"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          As Seen In
        </p>
        <div className="grid grid-cols-4 gap-2">
          {["YELP", "TripAdvisor", "Local 9", "Spfld Times"].map((name) => (
            <div
              key={name}
              className="flex h-6 items-center justify-center border border-gray-300 bg-gray-50 text-[9px] font-bold text-gray-400"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* About paragraph */}
      <div className="px-4 py-2 text-center">
        <p className="text-[11px] font-bold uppercase" style={{ color: "#2c3e50" }}>
          About Us
        </p>
        <p className="mt-1 text-[10px] leading-snug" style={{ fontFamily: "Arial, sans-serif" }}>
          Welcome to The Daily Grind Cafe &amp; Bakery! We are a family-owned
          coffee shop serving fresh roasted coffee, homemade pastries, breakfast
          and lunch options. Stop in today!
        </p>
      </div>

      {/* Comic Sans testimonials in a yellow-bordered box */}
      <div
        className="mx-4 mb-2 rounded-sm border-2 border-yellow-400 bg-yellow-50 px-2 py-2 text-[10px]"
        style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
      >
        <p className="text-[11px] font-bold" style={{ color: "#dc2626" }}>
          What Customers Are Saying!!
        </p>
        <p className="mt-0.5 italic">&quot;Best coffee in town!! 5 stars!!&quot; - Mary K.</p>
        <p className="italic">&quot;Love the cinnamon rolls!!&quot; - Bob R.</p>
      </div>

      {/* Hours table */}
      <div
        className="mx-4 mb-2 border border-gray-300 text-[10px]"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <p
          className="bg-gray-100 px-2 py-1 font-bold uppercase"
          style={{ color: "#2c3e50" }}
        >
          Hours of Operation
        </p>
        <div className="px-2 py-1.5">
          <div className="flex justify-between">
            <span>Monday - Friday</span>
            <span>6:00 AM - 7:00 PM</span>
          </div>
          <div className="flex justify-between">
            <span>Saturday</span>
            <span>7:00 AM - 8:00 PM</span>
          </div>
          <div className="flex justify-between">
            <span>Sunday</span>
            <span>8:00 AM - 4:00 PM</span>
          </div>
        </div>
      </div>

      {/* Generic footer */}
      <div
        className="mt-auto border-t border-gray-200 bg-gray-50 px-4 py-2 text-center text-[9px] text-gray-500"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        © 2019 The Daily Grind Cafe &nbsp;|&nbsp; All Rights Reserved &nbsp;|&nbsp; Designed by SiteBuilder Pro
      </div>

      {/* Floating "Live Chat" widget — the auto-popup nobody asked for */}
      <div
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold text-white shadow-lg"
        style={{ background: "#16a34a", fontFamily: "Arial, sans-serif" }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        Live Chat
      </div>
    </div>
  );
}

// The Frontdoor rebuild for The Daily Grind: motion-rich, photographic,
// premium. Real cafe imagery + a deliberate set of motion points (hero photo
// drifts and slowly scales, each atmosphere photo has its own warm light
// drift on a different duration, primary CTA shimmers, star rating glows).
// Motion is the product's pitch — this mock is a UI boast.
function SiteMockAfter() {
  const heroPhotoUrl =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&auto=format&fit=crop";

  const signatureItems = [
    {
      name: "Single-origin pour-over",
      desc: "Ethiopian Yirgacheffe, brewed to order",
      price: "$5",
      from: "oklch(0.42 0.07 45)",
      to: "oklch(0.26 0.04 40)",
    },
    {
      name: "Brown butter croissant",
      desc: "Laminated dough, baked at 5am",
      price: "$4",
      from: "oklch(0.70 0.10 75)",
      to: "oklch(0.52 0.09 65)",
    },
    {
      name: "Smoked turkey & brie",
      desc: "On sourdough with apple butter",
      price: "$11",
      from: "oklch(0.58 0.11 50)",
      to: "oklch(0.40 0.08 45)",
    },
  ];

  // Each atmosphere photo has its own drift duration so the three never
  // line up — the row never reads as a synchronized animation.
  const atmospherePhotos = [
    {
      url: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&q=80&auto=format&fit=crop",
      fallback: "oklch(0.45 0.07 70)",
      duration: 14,
    },
    {
      url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&q=80&auto=format&fit=crop",
      fallback: "oklch(0.40 0.09 50)",
      duration: 19,
    },
    {
      url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80&auto=format&fit=crop",
      fallback: "oklch(0.50 0.08 80)",
      duration: 24,
    },
  ];

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ background: "oklch(0.97 0.012 75)" }}
    >
      {/* Top nav */}
      <div className="flex items-center justify-between px-5 py-3">
        <span
          className="text-[15px] font-bold tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: "oklch(0.24 0.02 55)",
          }}
        >
          The Daily Grind
        </span>
        <div
          className="flex items-center gap-3 text-[10px]"
          style={{ color: "oklch(0.24 0.02 55 / 0.7)" }}
        >
          <span>Menu</span>
          <span>Visit</span>
          <span
            className="rounded-full px-3 py-1 text-white"
            style={{ background: "oklch(0.56 0.15 42)" }}
          >
            Order ahead
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="grid grid-cols-2 gap-4 px-5 pt-3">
        <div>
          <p
            className="text-[11px] font-semibold tracking-[0.2em]"
            style={{ color: "oklch(0.56 0.15 42)" }}
          >
            ROASTED IN-HOUSE SINCE 2008
          </p>
          <p
            className="mt-2 text-[26px] font-bold leading-[0.95]"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.24 0.02 55)",
            }}
          >
            Coffee, light, and a window seat.
          </p>
          <div className="mt-3 flex items-center gap-2">
            {/* Primary CTA with a periodic shine sweep — feels premium
                without being a constant attention-grab. */}
            <span
              className="relative inline-block overflow-hidden rounded-full px-4 py-1.5 text-[10px] font-semibold text-white"
              style={{ background: "oklch(0.56 0.15 42)", isolation: "isolate" }}
            >
              <span className="relative z-10">See the menu</span>
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-1/3"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.35), transparent)",
                  left: "-40%",
                }}
                animate={{ x: ["0%", "420%"] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  repeatDelay: 2.4,
                  ease: "easeInOut",
                }}
              />
            </span>
            <span
              className="inline-block rounded-full px-4 py-1.5 text-[10px] font-semibold"
              style={{
                border: "1px solid oklch(0.24 0.02 55 / 0.25)",
                color: "oklch(0.24 0.02 55)",
              }}
            >
              Reserve a table
            </span>
          </div>
          <div
            className="mt-3 flex items-center gap-1 text-[10px]"
            style={{ color: "oklch(0.24 0.02 55 / 0.7)" }}
          >
            <motion.span
              style={{ color: "oklch(0.74 0.14 78)", display: "inline-block" }}
              animate={{
                filter: [
                  "drop-shadow(0 0 0px oklch(0.74 0.14 78 / 0))",
                  "drop-shadow(0 0 4px oklch(0.74 0.14 78 / 0.6))",
                  "drop-shadow(0 0 0px oklch(0.74 0.14 78 / 0))",
                ],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              ★★★★★
            </motion.span>
            <span>4.8 from 412 reviews</span>
          </div>
        </div>
        {/* Hero photo: real cafe image + a warm overlay tint + drifting light
            + slow ambient scale. Three motion layers stacked on a real photo
            so it reads as living atmosphere, not a static placeholder. */}
        <motion.div
          className="relative overflow-hidden rounded-lg will-change-transform"
          style={{
            backgroundColor: "oklch(0.46 0.09 42)",
            backgroundImage: `url(${heroPhotoUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            isolation: "isolate",
          }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Warm overlay tints the photo into the brand palette. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(150deg, oklch(0.20 0.05 40 / 0.15), oklch(0.10 0.03 30 / 0.35))",
            }}
          />
          <motion.div
            className="absolute -inset-1/4 rounded-full will-change-transform"
            style={{
              background:
                "radial-gradient(circle, oklch(0.82 0.13 78 / 0.5), transparent 65%)",
              mixBlendMode: "screen",
              filter: "blur(10px)",
            }}
            animate={{
              x: ["-25%", "20%", "-10%", "-25%"],
              y: ["-15%", "20%", "30%", "-15%"],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      {/* Signature menu — three editorial cards (photo + name + descriptor +
          price) instead of a marquee of anonymous swatches. */}
      <div className="mt-5 px-5">
        <div className="flex items-baseline justify-between">
          <p
            className="text-[10px] font-semibold tracking-[0.18em]"
            style={{ color: "oklch(0.56 0.15 42)" }}
          >
            ON THE MENU
          </p>
          <span
            className="text-[9px]"
            style={{ color: "oklch(0.24 0.02 55 / 0.6)" }}
          >
            See all →
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {signatureItems.map((item) => (
            <div key={item.name} className="flex gap-2.5">
              <div
                className="aspect-square w-12 shrink-0 rounded-md"
                style={{
                  background: `linear-gradient(135deg, ${item.from}, ${item.to})`,
                }}
              />
              <div className="min-w-0">
                <p
                  className="text-[11px] font-semibold leading-tight"
                  style={{ color: "oklch(0.24 0.02 55)" }}
                >
                  {item.name}
                </p>
                <p
                  className="mt-0.5 text-[9px] leading-tight"
                  style={{ color: "oklch(0.24 0.02 55 / 0.65)" }}
                >
                  {item.desc}
                </p>
                <p
                  className="mt-1 text-[10px] font-semibold"
                  style={{ color: "oklch(0.56 0.15 42)" }}
                >
                  {item.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visit us — address + hours on the left, atmosphere photo strip on
          the right. Fills the previously empty lower half of the mock. */}
      <div className="mt-5 grid grid-cols-5 gap-4 px-5">
        <div className="col-span-2">
          <p
            className="text-[10px] font-semibold tracking-[0.18em]"
            style={{ color: "oklch(0.56 0.15 42)" }}
          >
            VISIT US
          </p>
          <p
            className="mt-1.5 text-[15px] font-bold leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.24 0.02 55)",
            }}
          >
            412 Main St
          </p>
          <p
            className="text-[10px]"
            style={{ color: "oklch(0.24 0.02 55 / 0.7)" }}
          >
            Springfield, IL
          </p>
          <div
            className="mt-2 space-y-0.5 text-[9px]"
            style={{ color: "oklch(0.24 0.02 55 / 0.75)" }}
          >
            <div className="flex justify-between">
              <span>Mon-Fri</span>
              <span>6am-8pm</span>
            </div>
            <div className="flex justify-between">
              <span>Saturday</span>
              <span>7am-8pm</span>
            </div>
            <div className="flex justify-between">
              <span>Sunday</span>
              <span>8am-4pm</span>
            </div>
          </div>
        </div>
        <div className="col-span-3 grid grid-cols-3 gap-2">
          {atmospherePhotos.map((photo, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] overflow-hidden rounded-md"
              style={{
                backgroundColor: photo.fallback,
                backgroundImage: `url(${photo.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                isolation: "isolate",
              }}
            >
              {/* Each photo runs its own warm light drift on a different
                  duration so the row never reads as synchronized. */}
              <motion.div
                className="absolute -inset-1/4 rounded-full will-change-transform"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.85 0.10 75 / 0.4), transparent 65%)",
                  mixBlendMode: "screen",
                  filter: "blur(8px)",
                }}
                animate={{
                  x: ["-25%", "20%", "-25%"],
                  y: ["20%", "-15%", "20%"],
                }}
                transition={{
                  duration: photo.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="mt-5 px-5">
        <p
          className="text-[11px] italic leading-relaxed"
          style={{ color: "oklch(0.24 0.02 55 / 0.85)" }}
        >
          &ldquo;Best flat white in town and they remember my name. Worth the
          walk past three other coffee shops.&rdquo;
        </p>
        <p
          className="mt-1 text-[9px]"
          style={{ color: "oklch(0.24 0.02 55 / 0.6)" }}
        >
          Sarah M. · Verified Google Review
        </p>
      </div>

      {/* Footer — social + copyright. Address/hours/phone now live in the
          Visit Us section above, so the footer doesn't duplicate them. */}
      <div
        className="mt-auto flex items-center justify-between px-5 py-3 text-[9px]"
        style={{
          borderTop: "1px solid oklch(0.24 0.02 55 / 0.1)",
          color: "oklch(0.24 0.02 55 / 0.7)",
        }}
      >
        <span
          className="text-[11px] font-bold tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: "oklch(0.24 0.02 55)",
          }}
        >
          The Daily Grind
        </span>
        <span>© 2026 · Made with care in Springfield</span>
        <span>Instagram · Facebook · TikTok</span>
      </div>
    </div>
  );
}

export function BeforeAfter() {
  const [position, setPosition] = useState(45);
  const [dragging, setDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const moveTo = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, next)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    setHasInteracted(true);
    const onMove = (e: PointerEvent) => moveTo(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, moveTo]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    setHasInteracted(true);
    if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 4));
    if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 4));
  };

  const showPulse = !hasInteracted;

  return (
    <div>
      {/* External signage: pulled out of the mocks so neither site's header
          content gets obscured. Left/right placement maps to the universal
          comparison-slider convention. */}
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="rounded-full bg-ink/85 px-3 py-1.5 text-xs font-bold tracking-[0.2em] text-paper shadow-md">
          BEFORE
        </span>
        <span className="rounded-full bg-clay px-3 py-1.5 text-xs font-bold tracking-[0.2em] text-paper shadow-md">
          AFTER
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative aspect-[16/10] w-full select-none overflow-hidden rounded-2xl shadow-[0_40px_90px_-40px_rgba(20,12,8,0.5)] ring-1 ring-ink/10"
      >
        <div className="absolute inset-0">
          <SiteMockAfter />
        </div>
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <SiteMockBefore />
        </div>

        {/* Divider + handle */}
        <div
          className="absolute inset-y-0 w-0.5 bg-paper/90 shadow-[0_0_8px_rgba(20,12,8,0.3)]"
          style={{ left: `${position}%` }}
        >
          {/* Clay pulse ring draws attention to the handle until the user
              touches it; stops permanently after first interaction. */}
          {showPulse && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: "oklch(0.56 0.15 42 / 0.55)" }}
              animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <button
            type="button"
            aria-label="Drag to compare before and after"
            role="slider"
            aria-valuenow={Math.round(position)}
            aria-valuemin={0}
            aria-valuemax={100}
            onPointerDown={() => setDragging(true)}
            onKeyDown={onKeyDown}
            className={`absolute top-1/2 left-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-paper text-clay shadow-lg ring-1 ring-ink/10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay ${
              dragging ? "scale-110 cursor-ew-resize" : "cursor-grab hover:scale-105"
            }`}
          >
            <span className="text-lg leading-none">⇄</span>
          </button>
        </div>
      </div>
    </div>
  );
}
