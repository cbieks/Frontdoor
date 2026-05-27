---
name: lead-scoring
description: Use when working in lib/scoring/, the scrape→score pipeline, or any code that touches the lead-scoring JSON contract. Defines the contract between scoring inputs, the Claude/Firecrawl calls, and what generation later consumes as existingSiteAnalysisJson.
user-invocable: false
---

# Frontdoor Lead-Scoring Skill

## When to load this skill

Load this skill whenever working on any of the following:
- `lib/scoring/` — implementing or modifying the scoring layer
- The system prompts sent to Claude during scoring
- `existingSiteAnalysisJson` shape — read or write
- `scoreReasoning` shape — read or write
- Code that decides whether a lead is auto-rejected or pitchable
- The regex heuristic signal lists

This skill is the source of truth. The contract here must match the
`existingSiteAnalysis` input the generation prompt expects (see the
`generation-schema` skill's "Input: what Claude receives for generation"
section). Drift between the two breaks demo generation silently.

Use `checklist.md` in this folder to verify scoring work is complete.

---

## Overview: what scoring does

Scoring is the qualification gate between scrape and dashboard. It assigns
every newly inserted lead a `score` (0–100, the "outdated/opportunity" score),
writes a structured `scoreReasoning` array, and — for outdated-website
leads that pass the heuristic filter — produces `existingSiteAnalysisJson`
in the exact shape generation will read later.

Leads that score at or below `SCORING_REJECT_THRESHOLD` (default 25) are
auto-transitioned to `rejected` immediately. The dashboard hides rejected
by default; the data stays in the DB for tuning.

**Two routing paths**, dispatched by `lead.leadType`:

- `NO_WEBSITE` → Path A (Haiku on Google Places metadata, ~$0.002/lead)
- `OUTDATED_WEBSITE` → Path B (Firecrawl scrape, regex heuristic filter, then Sonnet vision when needed)

---

## Score scale

This is an **opportunity** score, not a quality-of-business score. High =
outdated and pitchable. Low = modern and pointless to pitch.

| Score | Meaning | Outcome |
|---|---|---|
| 0–25 | Modern, well-designed, well-maintained | **Auto-reject** (configurable threshold) |
| 26–50 | Mid — some outdated signals but not awful | Dashboard, flagged "borderline" |
| 51–80 | Clearly outdated, pitch-ready | Dashboard, prioritize |
| 81–100 | Severely outdated, ideal lead | Dashboard, top of list |

For `NO_WEBSITE` leads the scale represents "lead quality" rather than
"outdatedness" — high score = active, well-rated, the right size of business
to pitch.

---

## JSON contracts

### `ScoreFactor` — items in `scoreReasoning`

```typescript
type ScoreFactor = {
  factor: string                                  // short label, e.g. "Legacy CMS"
  impact: "positive" | "negative" | "neutral"     // direction relative to opportunity
  note: string                                    // 1 sentence explaining the specific evidence
}
```

`positive` = pushes the score up (more outdated, more pitchable).
`negative` = pushes the score down (more modern, less pitchable).
`neutral` = noted but not score-affecting.

### `ExistingSiteAnalysis` — populated for Path B only

**This must match the generation skill's input contract.** Generation reads
this directly. Any change here is a change there.

```typescript
type ExistingSiteAnalysis = {
  brandVoice: string                              // e.g. "casual and friendly", "formal and credential-forward"
  extractedColors: {                              // All optional — only what Firecrawl extracted
    primary?: string                              // Hex. Brand identity color (logo, headers)
    secondary?: string                            // Hex. Supporting brand color (when distinct from primary)
    accent?: string                               // Hex. CTA / highlight color
    background?: string                           // Hex. Page background — typically white
    textPrimary?: string                          // Hex. Body text color
    link?: string                                 // Hex. Anchor color
  }
  logoUrl?: string                                // Absolute URL when Firecrawl identified a logo
  services: string[]                              // Services found on the site, e.g. ["Emergency repair", "Installation"]
  painPoints: string[]                            // Specific issues with the current site, e.g. ["loads slowly", "no mobile version", "outdated typography"]
  whatToPreserve: string                          // 1 sentence — what about the brand to keep in the demo
}
```

**Source-of-truth split** (important):
- `extractedColors` and `logoUrl` come **exclusively from Firecrawl's `branding` format**. Their extractor runs the page through a real browser with computed styles and runs a constrained-selection LLM over the actual DOM image candidates. This is dramatically more reliable than asking Sonnet to identify these from a screenshot + markdown.
- `brandVoice`, `services`, `painPoints`, `whatToPreserve` come from Sonnet (the qualitative analysis it does well).
- The Sonnet system prompt explicitly tells it NOT to include colors or logoUrl in its response — those are stripped and replaced with Firecrawl values during the merge.

`whatToPreserve` is critical for the regenerated demo to feel like *their*
business, not a generic template. e.g. "Strong emphasis on family-owned
history since 1987 and same-day service guarantee."

### `HeuristicVerdict` — Stage 1 output

```typescript
type HeuristicFindings = {
  modernSignals: string[]                         // Strong-modern signals detected, e.g. ["nextjs", "tailwind density"]
  outdatedSignals: string[]                       // Strong-outdated signals, e.g. ["wp-twentytwelve", "no viewport"]
  freshness: {
    copyrightYear?: number                        // Most recent year found in copyright text
    hasMobileViewport: boolean                    // <meta name="viewport"> present
    hasHttps: boolean                             // Site served over HTTPS
  }
}

type HeuristicVerdict = {
  verdict: "auto-reject-modern" | "needs-vision"
  findings: HeuristicFindings
}
```

`auto-reject-modern` is emitted only when there is ≥1 strong-modern signal
AND zero strong-outdated signals. Anything else (any outdated signal at all,
or no strong signals in either direction) goes to `needs-vision`. The bias
is conservative: never lose a borderline lead to a heuristic false positive.

---

## Path A: no-website scoring

### Deterministic auto-reject (no LLM)

Reject before any API call if any of these are true:

- `rating !== null && rating < 3.0` — failing business
- `reviewCount !== null && reviewCount > 2000` — chain/franchise, not the SMB target
- `(reviewCount ?? 0) < 3 && photos.length === 0 && !regularOpeningHours` — ghost listing

`autoReject` is returned with a reason string; the caller transitions the
lead to `rejected` directly without writing a score.

### Haiku scoring inputs

The system prompt is **static and cached**. The user message contains the
per-lead data:

- `businessName`, `category`, `address`
- `rating`, `reviewCount`
- Whether photos are present (count, not the photos themselves)
- Whether hours are populated
- `editorialSummary` if present

### Output shape (Path A)

```typescript
{
  score: number               // 0–100
  reasoning: ScoreFactor[]    // 3–6 factors typical
}
```

No `existingSiteAnalysis` for Path A — there's no site to extract from.

---

## Path B: outdated-website scoring

### Step 1: Firecrawl scrape

Request:

```typescript
firecrawl.scrape(lead.website!, {
  formats: ["markdown", "html", "screenshot"],
})
```

Response provides `markdown`, `html`, `screenshot` (base64 PNG or URL).
On Firecrawl failure (timeout, 4xx/5xx, blocked by site), the lead is
returned with a `firecrawl-failed` autoReject reason — don't try to score
a site we couldn't read.

### Step 2: Regex heuristics

`classifyHtml(html)` returns `HeuristicVerdict`. Signal lists:

**Strong-modern signals** (each is a `modernSignals[]` entry if detected):

- `_next/static/` in HTML → `"nextjs"`
- `__nuxt` or `__NUXT__` → `"nuxt"`
- `_app/immutable/` → `"sveltekit"`
- `astro-island` → `"astro"`
- Tailwind class density: `>3` `className="...flex|grid|gap-|md:|lg:|hover:..."` matches per kB of body HTML → `"tailwind-density"`
- Copyright year is current year OR last year, AND viewport meta tag present, AND modern sans-serif fonts → `"modern-baseline"`

**Strong-outdated signals** (each is an `outdatedSignals[]` entry if detected):

- `/wp-content/themes/twenty(ten|eleven|twelve|thirteen|fourteen|fifteen)/` → `"wp-default-old-theme"`
- `wixstatic.com` + free-tier indicators → `"wix-free"`
- `static1.squarespace.com` with v6-era URL patterns → `"squarespace-old"`
- `index.php?option=com_` (Joomla) → `"joomla"`
- `/sites/default/files/` with Drupal 7 markers → `"drupal-7"`
- Missing `<meta name="viewport">` → `"no-viewport"`
- Copyright year more than 2 years out of date (or no copyright at all) → `"stale-copyright"`
- `jquery-1.` or `jquery-2.` script tag → `"old-jquery"`
- 3+ non-presentation `<table>` blocks inside `<body>` → `"table-layout"`
- `<font>` or `<center>` tags inside `<body>` → `"deprecated-html"`
- Site URL begins with `http://` and never redirects to HTTPS → `"no-https"`
- Body contains "Welcome to my new website" or similar placeholder cliches → `"placeholder-content"`

**Verdict rule:**

```
verdict = (modernSignals.length >= 1 && outdatedSignals.length === 0)
  ? "auto-reject-modern"
  : "needs-vision"
```

### Step 3: Sonnet vision (only if `verdict === "needs-vision"`)

System prompt is static and cached. User message includes:

- The Lead's businessName + category + city
- The markdown extract (truncated to ~6000 chars)
- The screenshot (image content block)
- The `HeuristicFindings` from Step 2 (so Sonnet sees what the regex layer detected and can weight accordingly)

Sonnet returns JSON:

```typescript
{
  score: number,
  reasoning: ScoreFactor[],
  existingSiteAnalysis: ExistingSiteAnalysis,
}
```

Parsed and validated by inline TS guards. If JSON is invalid, log and throw —
do not silently coerce.

### Auto-reject branches in Path B

1. Firecrawl failed → autoReject `"firecrawl-failed"`
2. Heuristic verdict `auto-reject-modern` → autoReject `"heuristic-modern: <signals>"` with the modernSignals list
3. Sonnet score ≤ `SCORING_REJECT_THRESHOLD` (default 25) → autoReject `"low-score"`

All three result in the lead transitioning `scraped → scored → rejected`.
The first two skip the Sonnet call entirely.

---

## Models

- **Path A**: Haiku 4.5 via `ANTHROPIC_SCORING_MODEL` env var (default `claude-haiku-4-5-20251001`)
- **Path B vision**: Sonnet 4.6 via `ANTHROPIC_MODEL` env var (default `claude-sonnet-4-6`)
- **Never hardcode model strings.** Pull from env.
- **Opus 4.7** is reserved for the hardest cases — generation copywriting passes
  and the worst outdated-site analyses. Not used in routine scoring.

## Caching

Mandatory per [.claude/rules/claude-api.md](../../rules/claude-api.md).
Both Path A and Path B system prompts are the same across every lead — perfect
cache targets. Mark the final block of the cached prefix with
`cache_control: { type: "ephemeral" }`.

Verify after a session: check the Anthropic console for `cached_input_tokens`
growing on the second lead and beyond.

---

## State machine integration

The status transitions for scoring outcomes:

- Success, score above threshold: `scraped → scored`
- Auto-rejected (any reason): `scraped → scored → rejected`

Both transitions go through `assertTransition` from
[lib/utils/statusMachine.ts](../../../lib/utils/statusMachine.ts). Never write
`status` directly without calling that first.

Failed scoring (Firecrawl crashed, parser error, network issue) keeps the
lead at `scraped`. The operator can re-trigger scoring later. Failed leads
do not move to `rejected` — `rejected` is reserved for explicit
"do not pursue" decisions.

---

## Schema changes

If a structural change to either contract is needed:

1. Update this skill file first
2. Update the prompt in `lib/scoring/prompts.ts`
3. Update the inline TypeScript guards in `lib/scoring/`
4. **If `ExistingSiteAnalysis` changes**: update the generation-schema skill's
   "Input: what Claude receives for generation" section AND the generation
   prompt — these consume the same JSON
5. Run `checklist.md` in this folder to verify all sync points

Skipping step 4 will cause generation to silently produce broken demos when
those fields are missing or shaped wrong.

---

## Rules for Claude Code when working in this area

- Never write `status` directly; always go through `assertTransition`
- Never call Firecrawl from a Server Component or inside an API route handler
  on the request path — scoring runs inside the `after()`-deferred job
- Never pull MCP servers into runtime — Firecrawl is called via its hosted
  HTTP API (`@mendable/firecrawl-js`), not the MCP server
- Throttle concurrent Firecrawl calls to ~5 parallel to avoid burst rate-limits
- `Promise.allSettled` over per-lead scoring; one failure must not kill the batch
