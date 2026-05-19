---
description: Use when working on lib/generation/, templates/, or any code that touches the Level 2 JSON schema. Defines the contract between lead data, the Claude API call, and the template renderer.
user-invocable: false
---

# Frontdoor Generation Schema Skill

## When to load this skill

Load this skill whenever working on any of the following:
- `lib/generation/` — building or modifying the demo generation module
- The generation prompt sent to Claude at runtime
- `templates/` — building or modifying the demo site template
- Any code that reads or renders the Level 2 JSON output
- Any code that maps lead data to generation inputs

This skill defines the contract between three things: the lead data going in,
the Claude API call in the middle, and the template renderer on the other side.
All three must agree on the schema defined here. Never drift from it without
updating all three simultaneously.

Use `checklist.md` in this folder to verify generation work is complete.

---

## Overview: what Level 2 generation means

Claude's runtime API call returns a single JSON object containing two things:

1. **Structural decisions** — which layout, palette, sections, motion, and
   component variants to use. Claude is making design choices here, not you.
2. **Content** — the actual copy, headlines, service descriptions, testimonials,
   stats. Claude is writing for this specific business.

The template engine reads this JSON and renders the site. It never makes
layout decisions itself — those all come from Claude's JSON.

---

## The complete schema

This is the exact shape Claude must return. Every key listed as required must
be present. Optional keys may be omitted; the template uses sensible defaults.

```typescript
type GenerationOutput = {

  // ─── Structural decisions ──────────────────────────────────────────────────

  layout: "bold-action" | "refined-editorial" | "minimal-professional"
  // bold-action: large type, high contrast, strong CTAs. Trades, urgent services.
  // refined-editorial: generous whitespace, serif accents, gallery-forward.
  //   Salons, spas, boutique services.
  // minimal-professional: clean grid, muted palette, credential-forward.
  //   Lawyers, accountants, consultants.

  colorSource: "extracted" | "predefined"
  // extracted: used for outdated-website leads where we scraped real brand colors
  // predefined: used for no-website leads, maps to a named palette below

  palette: ExtractedPalette | PredefinedPalette
  // See palette types below

  motionIntensity: "none" | "subtle" | "moderate" | "high"
  // none: static, no animation. Lawyers, medical, conservative industries.
  // subtle: fade-ins, gentle transitions. Most professional services.
  // moderate: staggered reveals, parallax hero. Most trades and SMBs.
  // high: bold entrances, counter animations, strong scroll effects.
  //   Trades wanting to project energy and speed.

  sectionOrder: SectionKey[]
  // Ordered array of sections to include. Claude decides which sections are
  // relevant for this business and what order makes narrative sense.
  // Hero must always be first. CTA must always be last.
  // All other sections are optional and order is Claude's call.
  // Valid section keys: "hero" | "trust" | "services" | "process" |
  //                     "gallery" | "testimonials" | "cta"

  heroVariant: "centered-statement" | "split-with-image" | "split-with-stats"
  // centered-statement: full-width headline, subhead, single CTA. Clean.
  // split-with-image: headline left, hero image right. Image-forward businesses.
  // split-with-stats: headline left, 3 stat counters right.
  //   Businesses with strong numbers (years in business, jobs done, rating).

  serviceCardStyle: "icon-bordered" | "image-top" | "minimal-list"
  // icon-bordered: icon + title + description in a bordered card.
  // image-top: photo above text, good when services have visual differentiation.
  // minimal-list: text-only, clean. Professional services.

  // ─── Content ───────────────────────────────────────────────────────────────

  businessMeta: {
    name: string            // Exact business name from Google Places
    category: string        // e.g. "Plumbing", "Hair Salon", "Family Law"
    city: string            // e.g. "Portland, OR"
    logoUrl?: string        // Scraped from existing site if available
    phone?: string          // Displayed (not click-to-call in demo mode)
    address?: string        // Displayed in footer
  }

  hero: {
    headline: string        // Max 8 words. Strong, specific, not generic.
    subhead: string         // 1-2 sentences. What they do and for whom.
    ctaText: string         // Button label. e.g. "Get a Free Quote", "Book Now"
    stats?: Array<{         // Only include if heroVariant is "split-with-stats"
      value: string         // e.g. "500+", "15 Years", "4.9★"
      label: string         // e.g. "Jobs Completed", "In Business", "Google Rating"
    }>                      // Max 3 stats.
  }

  trust?: {                 // Include if the business has strong credibility signals
    badges: Array<{
      text: string          // e.g. "Licensed & Insured", "BBB Accredited",
                            //   "Family Owned Since 2008"
    }>                      // Max 4 badges. Only include verifiable claims.
  }

  services: {
    intro?: string          // Optional 1-sentence section intro
    items: Array<{
      title: string         // Service name. Max 4 words.
      description: string   // 1-2 sentences. Specific, not generic.
      imageUrl?: string     // Only populate if serviceCardStyle is "image-top"
                            //   and a relevant Google Place photo exists
    }>                      // Min 3, max 8 services.
  }

  process?: {               // Include for trades and service businesses.
                            // Skip for retail, galleries, professional services
                            //   where "how it works" is obvious.
    heading: string         // e.g. "How It Works", "Our Process", "What to Expect"
    steps: Array<{
      number: string        // "01", "02", "03"
      title: string         // Max 4 words
      description: string   // 1 sentence
    }>                      // Min 3, max 5 steps.
  }

  gallery?: {               // Include if Google Place photos exist and are strong.
                            // Skip if photos are low quality or irrelevant.
    heading: string
    photos: Array<{
      url: string           // Google Place photo URL
      alt: string           // Descriptive alt text for the image
    }>                      // Min 3, max 9 photos. Use a 3-column grid.
  }

  testimonials?: {          // Include if Google reviews are available and
                            //   specific (not just "Great service!").
    items: Array<{
      quote: string         // Exact text from Google review. Max 40 words.
                            //   Truncate with "..." if longer.
      author: string        // Reviewer first name only. e.g. "Sarah M."
      rating: number        // Star rating (1-5)
    }>                      // Min 2, max 4 testimonials.
  }

  cta: {
    heading: string         // e.g. "Ready to Get Started?", "Let's Talk"
    subhead: string         // 1 sentence reinforcing the value proposition
    ctaText: string         // Button label. Can be same as hero CTA or different.
    secondaryText?: string  // e.g. "No commitment required" or "Free estimates"
  }

}
```

---

## Palette types

```typescript
// Used when colorSource is "extracted" (outdated-website leads)
type ExtractedPalette = {
  source: "extracted"
  primary: string           // Hex. Dominant brand color from existing site.
  secondary: string         // Hex. Supporting brand color.
  accent: string            // Hex. CTA and highlight color. High contrast with primary.
  reasoning: string         // 1 sentence: where these colors came from.
                            //   e.g. "Extracted from logo and nav bar on existing site."
}

// Used when colorSource is "predefined" (no-website leads)
type PredefinedPalette = {
  source: "predefined"
  name: "warm-trade"
    | "cool-professional"
    | "neutral-minimal"
    | "bold-energy"
    | "soft-wellness"
  // warm-trade: deep orange/amber primary, dark charcoal secondary.
  //   Plumbers, electricians, HVAC, contractors.
  // cool-professional: navy primary, slate secondary, gold accent.
  //   Lawyers, accountants, financial services.
  // neutral-minimal: warm gray primary, off-white secondary, black accent.
  //   Consultants, architects, designers.
  // bold-energy: electric blue or green primary, near-black secondary.
  //   Gyms, auto shops, high-energy service businesses.
  // soft-wellness: dusty rose or sage primary, cream secondary, terracotta accent.
  //   Salons, spas, yoga studios, wellness businesses.
}
```

---

## Layout routing rules

Claude should use these as strong defaults, not rigid rules. Override with
good reason based on the specific business's personality signals.

| Business category | Default layout | Default palette (no-website) | Default motion |
|---|---|---|---|
| Trades (plumber, electrician, HVAC, contractor) | bold-action | warm-trade | moderate or high |
| Auto (mechanic, detailing, tires) | bold-action | bold-energy | moderate |
| Salon / spa / wellness | refined-editorial | soft-wellness | subtle |
| Restaurant / food | refined-editorial | warm-trade | subtle |
| Legal / financial / accounting | minimal-professional | cool-professional | none or subtle |
| Medical / dental / therapy | minimal-professional | neutral-minimal | subtle |
| Retail / boutique | refined-editorial | neutral-minimal | subtle |
| Gym / fitness | bold-action | bold-energy | high |
| Cleaning / landscaping | bold-action | warm-trade | moderate |
| Consulting / design | minimal-professional | neutral-minimal | subtle |

---

## Input: what Claude receives for generation

### For outdated-website leads

```typescript
type OutdatedWebsiteLeadInput = {
  leadType: "OUTDATED_WEBSITE"
  googlePlacesData: {
    name: string
    category: string
    city: string
    phone?: string
    address?: string
    rating?: number
    reviewCount?: number
    photos: string[]        // Array of Google Place photo URLs
    reviews: Array<{
      text: string
      rating: number
      authorName: string
    }>
  }
  existingSiteAnalysis: {   // Extracted by Claude in the scoring step
    brandVoice: string      // e.g. "casual and friendly", "formal and credential-forward"
    extractedColors: {
      primary: string       // Hex
      secondary: string     // Hex
      accent: string        // Hex
    }
    logoUrl?: string
    services: string[]      // List of services found on existing site
    painPoints: string[]    // e.g. ["loads slowly", "no mobile version", "outdated design"]
    whatToPreserve: string  // e.g. "strong emphasis on family-owned history since 1987"
  }
}
```

### For no-website leads (Phase 7)

```typescript
type NoWebsiteLeadInput = {
  leadType: "NO_WEBSITE"
  googlePlacesData: {
    name: string
    category: string
    city: string
    phone?: string
    address?: string
    rating?: number
    reviewCount?: number
    photos: string[]
    reviews: Array<{
      text: string
      rating: number
      authorName: string
    }>
  }
  categoryProfile: string   // Industry-derived defaults
  personalitySignals: string // Extracted from reviews and photos
}
```

---

## Rules for Claude Code when working in this area

### Building `lib/generation/`

- The runtime API call must return the exact schema above — no extra keys,
  no missing required keys. Build a Zod schema that validates the response
  before passing it to the template engine.
- The system prompt and template structure (section definitions, valid variant
  names, palette definitions) are the cached prefix. Every lead's generation
  call shares this prefix. Use the standard `anthropic.messages.create()`
  call and mark the cached blocks with `cache_control: { type: "ephemeral" }`
  on the final content block of each section that should be cached. The
  legacy `anthropic.beta.promptCaching.messages.create()` namespace is no
  longer used.
- Use `ANTHROPIC_MODEL` env var for the model — never hardcode a model string.
- If Claude returns invalid JSON or a schema validation failure, log the raw
  response and throw — do not attempt to silently fix or guess at the intent.

### Building `templates/`

- The template renderer is the consumer of this schema. It must handle every
  valid variant for every structural decision key.
- Optional sections (`trust`, `process`, `gallery`, `testimonials`) must be
  completely absent from the rendered output if their key is missing from the
  JSON — not rendered as empty.
- Demo mode vs. live mode: the template reads a `DEMO_MODE` environment flag.
  In demo mode: contact forms are non-functional ("Active on launch"),
  phone numbers display only (no `href="tel:"`), booking widgets render as
  designed but non-interactive.
- Never hardcode business-specific content in the template. Everything comes
  from the JSON.

### Schema changes

If a structural change to this schema is needed:
1. Update this skill file first
2. Update the generation prompt in `lib/generation/`
3. Update the Zod validation schema in `lib/generation/`
4. Update the template renderer in `templates/`
5. All four must change together. A partial update will cause a runtime mismatch.

Run `checklist.md` in this folder after any schema change to verify all sync
points were updated.

---

## Example: complete valid output

This is what a correct Claude response looks like for a plumbing company
with an outdated website. Use this as a reference when writing tests or
evaluating generation quality.

```json
{
  "layout": "bold-action",
  "colorSource": "extracted",
  "palette": {
    "source": "extracted",
    "primary": "#1B4F8A",
    "secondary": "#0D1B2A",
    "accent": "#F4A623",
    "reasoning": "Blue extracted from logo and nav bar; amber from CTA buttons on existing site."
  },
  "motionIntensity": "moderate",
  "sectionOrder": ["hero", "trust", "services", "process", "testimonials", "cta"],
  "heroVariant": "split-with-stats",
  "serviceCardStyle": "icon-bordered",
  "businessMeta": {
    "name": "Morrison Plumbing",
    "category": "Plumbing",
    "city": "Portland, OR",
    "phone": "503-555-0142",
    "address": "2847 SE Division St, Portland, OR 97202"
  },
  "hero": {
    "headline": "Portland's Trusted Plumbing Experts",
    "subhead": "Licensed plumbers serving Portland homeowners since 2003. Fast response, fair pricing, guaranteed work.",
    "ctaText": "Get a Free Quote",
    "stats": [
      { "value": "20+", "label": "Years in Business" },
      { "value": "2,400+", "label": "Jobs Completed" },
      { "value": "4.9★", "label": "Google Rating" }
    ]
  },
  "trust": {
    "badges": [
      { "text": "Licensed & Insured" },
      { "text": "Family Owned Since 2003" },
      { "text": "Same-Day Service Available" },
      { "text": "100% Satisfaction Guarantee" }
    ]
  },
  "services": {
    "intro": "From emergency repairs to full remodels, we handle it all.",
    "items": [
      {
        "title": "Emergency Repairs",
        "description": "Burst pipes, leaks, or no hot water — we respond fast, day or night."
      },
      {
        "title": "Drain Cleaning",
        "description": "Slow or blocked drains cleared completely, not just temporarily."
      },
      {
        "title": "Water Heater Service",
        "description": "Installation, repair, and replacement of all water heater types."
      },
      {
        "title": "Bathroom Remodels",
        "description": "Full plumbing for new bathrooms or complete remodel projects."
      }
    ]
  },
  "process": {
    "heading": "How It Works",
    "steps": [
      { "number": "01", "title": "Call or Request Online", "description": "Tell us what's happening and we'll schedule a same-day visit when possible." },
      { "number": "02", "title": "We Diagnose the Problem", "description": "Our licensed plumber assesses the issue and gives you a clear, upfront quote." },
      { "number": "03", "title": "Work Gets Done Right", "description": "We fix it properly, clean up, and don't leave until you're satisfied." }
    ]
  },
  "testimonials": {
    "items": [
      {
        "quote": "Morrison came out same day for a burst pipe. Professional, fast, and the price was exactly what they quoted.",
        "author": "Karen T.",
        "rating": 5
      },
      {
        "quote": "Have used them twice now. Honest about what needs fixing and what doesn't. Rare to find that.",
        "author": "David M.",
        "rating": 5
      }
    ]
  },
  "cta": {
    "heading": "Ready to Get It Fixed?",
    "subhead": "Portland homeowners have trusted Morrison Plumbing for over 20 years.",
    "ctaText": "Get a Free Quote",
    "secondaryText": "No call-out fee for estimates"
  }
}
```