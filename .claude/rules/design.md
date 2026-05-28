---
paths:
  - "templates/**"
  - "components/**"
  - "app/**/*.tsx"
  - "docs/design/**"
---

# Frontend & design conventions

All UI work (demo templates, components, pages, and Frontdoor's own marketing site
and dashboard) goes through the impeccable design stack. This is dev-time only:
never attach impeccable, 21st.dev, or any MCP to runtime generation (see
mcp-usage.md). Adopted in ADR-0014.

- **Design context is per surface.** `docs/design/{website,dashboard,templates}/`
  each hold a `PRODUCT.md` + `DESIGN.md`. The active surface is set by
  `IMPECCABLE_CONTEXT_DIR` in `.claude/settings.json` and loads at session start;
  switch it (and reload) when changing surface. Website and dashboard wear
  Frontdoor's own brand; demo templates wear each prospect's extracted brand.
- **Impeccable governs design quality.** The `impeccable` skill auto-loads on UI
  tasks. Use its commands (`shape`, `audit`, `critique`, `polish`, etc.) and follow
  its anti-slop laws: OKLCH, never `#000`/`#fff`, exponential ease-out (no bounce),
  no nested cards, no SaaS-landing cliches, **no em-dashes in user-facing copy**
  (they read as AI-written; use commas, parens, periods, or colons instead — em-dashes
  in code comments are fine), and the AI-slop test.
- **Components: 21st.dev first.** Query the 21st.dev Magic MCP for a starting point
  before writing a component from scratch, then adapt to Tailwind v4 and existing
  `components/ui/` patterns.
- **Animation: `motion` (Framer Motion).** Implement the schema's `motionIntensity`
  levels with impeccable's motion curves. Honor `prefers-reduced-motion` on demo
  templates (a customer's grandmother might view those) and the dashboard.
  **Exception: the marketing site (`app/home/**`, `components/marketing/**`) is a
  deliberate UI showcase and runs full motion for everyone** — do not add
  `useReducedMotion` gates there, since restraint reads as static rather than
  stellar and undermines the product's pitch.
- **QA gate.** Run `npx impeccable detect <path>` before considering UI work done,
  and resolve flagged anti-patterns. No API cost.
- **Demo templates** additionally follow the generation-schema skill (the Level 2
  JSON contract) and the demo-mode gating from ADR-0007.
