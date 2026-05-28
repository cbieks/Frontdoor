<!-- SEED: the demo template is not built yet (Phase 0.5). This captures strategy and rules; re-run /impeccable document in scan mode once template code exists to extract real tokens and component snippets. -->
---
name: Frontdoor Demo Templates
description: Per-business demo landing pages, adaptive per category, unified by craft.
---

# Design System: Frontdoor Demo Templates

## 1. Overview

**Creative North Star: "The Best Version of This Business."**

Frontdoor demos are not one design reskinned per client. They are adaptive per
category: a spa, a plumber, and a law firm must feel like three genuinely
different sites, each built from that business's own extracted brand (logo,
colors, voice, photos, reviews). The look ranges widely on purpose. What never
varies is the craft: a shared quality bar and a strict set of anti-slop rules
that hold across every demo regardless of category.

The system is **generated and multi-variant**. Structure comes from a layout
variant (`bold-action`, `refined-editorial`, `minimal-professional`), chosen per
business; color comes from a **committed** strategy where the business's extracted
primary carries 30 to 60 percent of the surface; motion comes from one of four
intensity levels matched to the category. Because color and type are injected from
each business's real brand, this document specifies the **system and its rules**,
not a fixed palette or font.

This system explicitly rejects the Wix and Squarespace template look, the "AI-made"
tells (Inter or Geist by reflex, purple-to-blue gradients, gradient text, nested
cards, identical card grids, the hero-metric template), sameness across demos, and
the category reflex (guessable palette from the category alone). If a demo could be
mistaken for a kit, or for another Frontdoor demo, it has failed.

**Motion philosophy** (folded here, not a separate section): motion is keyed to
the chosen intensity level, but the curves and rules are universal. Ease out with
exponential curves (`ease-out-quart` `cubic-bezier(0.25, 1, 0.5, 1)`,
`ease-out-expo` `cubic-bezier(0.16, 1, 0.3, 1)`); never bounce or elastic.
Micro-interactions 150 to 300ms, entrances 300 to 500ms, exits at ~75 percent of
their entrance. Stagger list items 30 to 50ms each, capped in total. Animate
transform and opacity (plus bounded blur or filter where it genuinely lifts the
moment), never layout-driving properties. `prefers-reduced-motion` is honored
everywhere: motion degrades to a crossfade, function (progress, focus) is preserved.

**Key Characteristics:**
- Adaptive per category, unified by a shared quality bar (hybrid).
- Committed color: the extracted brand color is the star.
- Built from real business data; never invented, never generic.
- Premium and motion-rich, but accessible (WCAG AA) and gated for demo mode.

## 2. Colors

A **committed** strategy by default: one saturated brand color carries 30 to 60
percent of the surface, with tinted neutrals and a single accent supporting it.
Trust-sensitive categories in the `minimal-professional` layout (legal, medical,
financial) may dial toward restrained, demoting the brand color to a smaller
accent where credibility reads better than boldness. Specific values are resolved
**per business**, not fixed here.

### Primary
- **Extracted brand primary** (`[resolved per lead]`): the business's real brand
  color from Firecrawl branding extraction (`ExtractedPalette.primary`). It leads
  the surface. For no-website leads, a category-appropriate predefined palette
  (`warm-trade`, `cool-professional`, `neutral-minimal`, `bold-energy`,
  `soft-wellness`) stands in.

### Secondary (optional)
- **Extracted secondary** (`[resolved per lead]`): supporting brand color. Often
  absent on two-color brands; omit rather than invent one.

### Neutral
- **Background** (`[resolved per lead]`): page surface, usually near-white, tinted
  toward the brand hue.
- **Text primary** (`[resolved per lead]`): body text, high contrast against
  background.
- **Accent / link** (`[resolved per lead]`): CTA and anchor color; derived to
  contrast with primary when the source site lacked one.

### Named Rules
**The Extracted-Brand Rule.** The business's real color leads every demo. Never
impose a Frontdoor house palette over a brand we successfully extracted.

**The No-Pure-Black Rule.** Never `#000` or `#fff`. Tint every neutral toward the
brand hue (chroma 0.005 to 0.01). Prefer OKLCH; reduce chroma near the lightness
extremes.

**The Category-Reflex Ban.** Do not default a category to its training-data color
(plumber to blue, spa to sage, law to navy and gold). Start from the extracted
brand or a deliberately chosen palette, never the reflex.

## 3. Typography

Type direction is **per variant and per business**, not one global pairing:

- **`bold-action`**: a strong, confident sans with heavy display weights. Trades,
  auto, gyms, cleaning.
- **`refined-editorial`**: a serif (or high-contrast display) paired with a clean
  body sans; gallery-forward. Salons, spas, restaurants, boutiques.
- **`minimal-professional`**: a restrained, credible sans, tight scale. Legal,
  financial, medical, consulting.

Where the business's existing site exposes a distinctive face, use it as a hint
rather than defaulting to a generic system font.

**Character:** resolved per variant; always a deliberate pairing, never a single
font carrying the whole page.

### Hierarchy
- **Display** (`[per variant]`): hero headline; the largest typographic gesture.
- **Headline / Title** (`[per variant]`): section headers.
- **Body** (`[per variant]`, line length 65 to 75ch): running copy.
- **Label** (`[per variant]`): eyebrows, badges, small caps where used.

### Named Rules
**The Contrast Rule.** At least a 1.25 ratio between adjacent type-scale steps.
Flat hierarchies read as amateur.

**The No-Default-Face Rule.** Inter, Geist, Roboto, and Arial are forbidden as the
lazy choice, and so are the now-overused "tasteful" picks the detector also flags
(Fraunces, Plus Jakarta Sans, Space Grotesk). Sourcing strategy: reuse the
business's own extracted font when we have it; otherwise pick from a curated,
per-variant set that deliberately avoids the flagged faces. Build that curated set
when the template is built.

## 4. Elevation

Flat by default, layered by intent. Surfaces rest flat; elevation appears as a
response to state (hover, focus, active sheets) on a single consistent shadow
scale, never as random per-component decoration. The exact scale is resolved when
the template is built and may shift slightly by variant (editorial leans flatter,
bold-action permits more lift).

### Named Rules
**The Earned-Shadow Rule.** A shadow must signal state or real depth. Decorative
drop shadows and "dark glow" effects are prohibited.

## 5. Components

The component system is planned in the generation schema and **not yet built**
(Phase 0.5 / 4). Documented here as the target so variants stay on-system.

### Buttons
- One primary CTA per view; secondaries visually subordinate. Exponential ease-out
  on hover and press; no layout shift on press.

### Cards / Containers
- Use a card only when it is genuinely the best affordance. **Nested cards are
  always wrong.** Do not wrap everything in a container.

### Hero
- Three variants: `centered-statement`, `split-with-image`, `split-with-stats`.
  Stats appear only in the stats variant.

### Service blocks
- Three styles: `icon-bordered`, `image-top` (real Google Place photos),
  `minimal-list`. SVG icons only, never emoji.

### Sections
- `trust`, `process`, `gallery`, `testimonials`, `cta`, ordered per business.
  Optional sections are fully absent when not used, never rendered empty.

### Demo-mode gating (signature)
- Contact forms render but read "Active on launch"; phone numbers display without
  `tel:`; booking widgets are designed but inert ("Live in 24 hours after
  signup"). A slim, non-destructive preview ribbon may frame the demo as a preview
  rather than a watermark over the content.

## 6. Do's and Don'ts

### Do:
- **Do** lead with the business's extracted brand color (committed, 30 to 60
  percent of surface).
- **Do** make each category feel like a different site; vary layout, palette,
  density, and energy.
- **Do** keep at least a 1.25 type-scale contrast ratio and a deliberate
  display-plus-body pairing.
- **Do** ease out with exponential curves; keep micro-interactions 150 to 300ms;
  honor `prefers-reduced-motion`.
- **Do** hit WCAG 2.1 AA: verified contrast, visible focus, keyboard navigation,
  semantic HTML.
- **Do** gate functional elements visibly ("Active on launch").

### Don't:
- **Don't** ship the Wix or Squarespace template look, or anything that reads as
  from a kit.
- **Don't** build a SaaS marketing page: no three-tier pricing cards, "Trusted by"
  logo walls, product-screenshot mockups, icon-tile feature grids, or "free trial"
  copy. This is a local service business, not software.
- **Don't** use Inter, Geist, or Roboto by reflex, or a single font for the whole
  page.
- **Don't** use purple-to-blue gradients, gradient text, or gray text on colored
  backgrounds.
- **Don't** use colored side-stripe borders, nested cards, identical card grids,
  or the hero-metric template.
- **Don't** use bounce or elastic easing, or animate layout-driving properties.
- **Don't** let two demos look alike, and don't default a category to its reflex
  palette (plumber to blue, spa to sage, law to navy and gold).
- **Don't** use `#000` or `#fff`; never em dashes in demo copy.
