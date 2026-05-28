"use client";

import { useState } from "react";
import { motion } from "motion/react";

type QA = { question: string; answer: string };

const QUESTIONS: QA[] = [
  {
    question: "How does this actually work?",
    answer:
      "Three steps. We build a real demo of your site (your photos, reviews, and brand) with no forms or calls. You see it. If you like it, you pay $490 to launch and we get you live on your own domain within 24 hours. If you don't, walk away. No card on file, no contract.",
  },
  {
    question: "What's the catch? Why so cheap?",
    answer:
      "No catch. The demo is already built. Flipping it live is the easy part. We don't bill by the hour, we don't write the same site twice, and we keep prices simple: $490 to launch, $50/mo retainer for hosting, edits, and ongoing updates.",
  },
  {
    question: "What if I want changes after it's live?",
    answer:
      "Send us a note. Day-to-day edits (swap a photo, fix a typo, update your hours, add a service) are included in the $50/mo retainer. Bigger redesigns are separate, but the small stuff just gets done.",
  },
  {
    question: "What if I want UI tweaks after launch, like less motion, a different vibe, or a section moved?",
    answer:
      "Expected. First cuts rarely land perfectly. Tell us what's off (too much motion, too little, wrong palette, a section in the wrong order, the type feels stiff) and we tune it. Getting the site from “close” to “yes, that's me” is part of what you paid for. A completely different design direction is a separate quote, but tweaks to refine what we built are on us.",
  },
  {
    question: "Can you add bigger features later, like a chat widget or online ordering?",
    answer:
      "Yes. The $50/mo covers edits and content updates; new functionality is a separate quote. Quick adds (AI chat, third-party booking embeds, analytics, newsletter signup, custom integrations) usually take a few days. Bigger builds (anything that needs its own database or login system) are doable, but get scoped and priced individually so you know what you're paying for before we start.",
  },
  {
    question: "Do I own the site, or do you?",
    answer:
      "You do. The code, the content, and the domain are yours. We host on your behalf and handle updates, but if you ever leave, we hand the whole thing over. No hostage situation, no licensing trick.",
  },
  {
    question: "What about my existing domain and email?",
    answer:
      "We point the new site to your existing domain with no email disruption and no DNS surprises. If you don't have a domain yet, we'll register one for you at cost.",
  },
  {
    question: "Wait, did you build one without me asking?",
    answer:
      "Sometimes. We spot small businesses whose sites are quietly costing them customers and build a demo proactively. We'd rather show than pitch. Nothing is published, nothing is shared with anyone but you, and you owe nothing unless you say go. If you came to us first, we just skip the surprise and start the demo together.",
  },
  {
    question: "What if I don't like what you built?",
    answer:
      "Walk away. No contract, no card on file, no cancellation fee. Most of what we build lands close because we use your real brand. If it's not for you, no hard feelings.",
  },
];

function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function Item({
  question,
  answer,
  isOpen,
  onToggle,
}: QA & { isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className={`rounded-2xl border bg-paper transition-colors duration-300 ${
        isOpen
          ? "border-clay/30 shadow-[0_4px_24px_-8px_rgba(20,12,8,0.12)]"
          : "border-ink/10"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:p-6"
      >
        <span
          className={`text-base font-medium leading-snug transition-colors sm:text-lg ${
            isOpen ? "text-ink" : "text-ink/70"
          }`}
        >
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`flex-none transition-colors ${
            isOpen ? "text-clay" : "text-ink/40"
          }`}
        >
          <PlusIcon />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-base leading-relaxed text-ink/70 sm:px-6 sm:pb-6">
          {answer}
        </p>
      </motion.div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden border-y border-ink/10 bg-[oklch(0.95_0.014_75)] px-6 py-24 sm:py-32">
      {/* Faint clay glow behind the header — atmospheric tie-in to the door
          hero, kept subtle so it doesn't compete with the questions. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.56 0.15 42 / 0.12), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-semibold tracking-[0.25em] text-clay">
            QUESTIONS
          </p>
          <h2 className="mt-5 font-display text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-tight text-ink">
            What people ask before they say yes.
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {QUESTIONS.map((q, i) => (
            <Item
              key={q.question}
              question={q.question}
              answer={q.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
