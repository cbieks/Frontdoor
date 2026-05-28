@AGENTS.md
@.claude/rules/typescript.md

# Frontdoor

Lead generation and website automation pipeline. Finds small businesses with outdated websites (and eventually those with no website), analyzes their existing brand and online presence, generates beautiful demo Next.js sites, and uses the demo itself as a sales tool. Businesses pay via Stripe to convert their demo into a production deployment with a custom domain.

## Current immediate priority

**Frontdoor's own marketing site + internal dashboard — the proving ground for the new UI design stack (impeccable + Framer Motion + 21st.dev; see [[0014]]).** Scraping → scoring → dashboard is wired end-to-end (Phases 1–3 done as of 2026-05-26). Before building the demo templates (Phase 0.5), validate the design tooling on Frontdoor's own surfaces: the marketing site (build from scratch, brand register) and the dashboard (polish the existing UI, product register). Both wear Frontdoor's own brand; the demo templates come after, with a validated stack. The Generate button stays 501 until templates exist. Per-surface design context lives in `docs/design/{website,dashboard,templates}/`, selected via `IMPECCABLE_CONTEXT_DIR`; the design workflow is in `.claude/rules/design.md`.

## Architecture overview

```
Google Maps scrape → leadType classification (at insert)
→ Path A (no-website): deterministic auto-reject + Haiku scoring
→ Path B (outdated-website): Firecrawl scrape + regex pre-filter + Sonnet qualitative
→ auto-reject below SCORING_REJECT_THRESHOLD; survivors visible in dashboard
→ Level 2 demo generation (structural decisions + content) [Phase 4]
→ demo deployed to <slug>.frontdoor-demos.com → outreach email
→ prospect views demo + optionally submits embedded survey
→ optional regeneration with explicit preferences → Stripe payment
→ production deployment on customer-owned Vercel + custom domain
```

## Lead targeting

Two lead types are supported, with sequencing:

- **Outdated-website leads** — businesses with a real but low-quality website (slow, ugly, broken, neglected, design clearly aged). Implemented first. Better demo quality (real brand data to work from), likely higher conversion, easier engineering (mining real data vs. synthesizing thin signal), and the strongest cold-email pitch ("here's your site → here's what I made for you").
- **No-website leads** — businesses with no website at all or with dead/parked domains. Deliberate later expansion. Will use category defaults plus mining of Google reviews and photos to compose initial demos.

Both lead types feed structured JSON into the same demo-generation step. Pipelines diverge in the data-gathering phase but converge at generation.

## Runtime AI generation — Level 2

Per-demo generation operates at "Level 2" on this spectrum:

| Level | Pattern | Frontdoor uses it? |
|---|---|---|
| 1 | Content-only — Claude returns text fields, template renders fixed structure | No (feels templated, Wix-like) |
| 2 | **Content + structural decisions** — Claude returns content AND layout variant, palette, section order, motion intensity, component variant selections | **Yes** |
| 3 | Runtime code generation — Claude returns React/JSX | No (too risky, hard to validate) |
| 4 | Component composition from a registry — Claude assembles a site from pre-vetted components | Possible Phase 2+, out of scope now |

The template engine renders Claude's JSON decisions against a library of pre-built variants. The output space is large enough that each demo feels custom; bounded enough that we can validate and debug results.

### Generation schema — always use the generation skill

When working in `lib/generation/`, `templates/`, or any code that touches
the Level 2 JSON schema, load `.claude/skills/generation-schema/SKILL.md`
before writing any code.

The skill defines the exact JSON contract between Claude and the template
engine — valid layouts, palettes, section keys, hero variants, and the
complete input/output types for both lead types. It also contains
`checklist.md`, which must be run before marking any generation or template
work complete. Following the skill is not optional — the schema is a
four-way contract between the skill, the generation prompt, the Zod
validator, and the template renderer. All four must stay in sync.

### Lead scoring — always use the lead-scoring skill

When working in `lib/scoring/`, the scrape→score pipeline, or any code
that touches the `ExistingSiteAnalysis` / `ScoreFactor` contract, load
`.claude/skills/lead-scoring/SKILL.md` first. The skill defines the
four-way contract (skill ↔ Sonnet prompt ↔ TS guards ↔ detail-page
renderer) and the source-of-truth split per [[0011]]: Firecrawl owns
logo + colors, Sonnet owns qualitative analysis.

### Default models and cost levers

Sonnet 4.6 default, Haiku for extraction, Opus reserved for hardest tasks only. Prompt caching mandatory; Batch API for non-urgent workloads. Estimated per-demo cost: ~$0.07 with caching. See `.claude/rules/claude-api.md` for full rules.

## MCP — dev-time only, never runtime

MCP servers are for Claude Code and similar dev-time tools — **never runtime**. See `.claude/rules/mcp-usage.md` for full rules including the 21st-dev UI component workflow.

### Knowledge base — Obsidian Vault MCP servers

Two vault MCP servers are available globally:
- **`mind`** — original thinking, decisions, journal entries
- **`library`** — reference material, including `library/projects/frontdoor/`

Before significant architectural changes, check `library/projects/frontdoor/decisions/` for relevant ADRs. When project history or past reasoning matters, query both vaults — `library` for documented decisions, `mind` for raw thinking that may not have made it into formal notes.

### Obsidian vault operations — always use the vault skill

Any time a task involves reading from or writing to the Obsidian library or mind vault, 
load and follow `.claude/skills/obsidian-vault/SKILL.md` before touching any vault tool.

Triggers — if the task mentions any of these, the skill applies:
- Reading or writing ADRs
- Updating the decisions index
- Reading from `library/projects/frontdoor/`
- Any use of the `library` or `mind` MCP tools

The skill defines exactly which tools to use and in what order. 
Following it is not optional — it exists specifically to prevent expensive read-modify-write cycles.

#### Ideas folder — `library/projects/frontdoor/ideas/`

This folder contains exploratory notes, design sketches, and synthesis docs from conversations and research that haven't yet been promoted to formal ADRs. Examples include pipeline shape proposals, tooling evaluations (e.g. Firecrawl, Brave Search), business model variations, and architecture explorations.

**Always check `library/projects/frontdoor/ideas/` before:**
- Proposing a pipeline change or new pipeline step
- Evaluating a new external service or tool
- Making a recommendation about scout, generation, or deployment flow
- Suggesting alternatives to anything that looks "decided" — there may be prior context

If a relevant idea note exists, reference it explicitly and build on it rather than starting from scratch. If a decision in an idea note has matured into something stable and worth locking in, suggest promoting it to an ADR.

### Vault maintenance — end-of-session sweep via `/sweep`

Vault maintenance is **not** automatic. When wrapping up a significant
coding session, run `/sweep`. It scans the conversation for ADR-worthy
decisions, captures deferred future-phase ideas as idea notes, patches
stale sections of `CLAUDE.md` / `frontdoor.md`, and updates or creates
rule files under `.claude/rules/` where conventions have drifted.

The full procedure (ADR criteria, idea-note triggers, doc-patch rules,
rule-file rules) lives in `.claude/skills/sweep/SKILL.md`. Do not
flag ADRs, write idea notes, or patch docs mid-session — that's `/sweep`'s
job.

#### ADR workflow

ADRs live in `library/projects/frontdoor/decisions/` following the format
`NNNN-kebab-case-slug.md`. Use `_template.md` as the starting structure.
Whenever a new ADR is created, update `0000-index.md` with a wikilink
and one-sentence summary.

Full criteria, drafting workflow, and approval process are defined in
`.claude/skills/sweep/SKILL.md`. Follow that skill — don't rely on
memory of these rules.

## Tech stack

- **Next.js 16** (App Router, TypeScript) — `app/` at root, no `src/`
- **Prisma 7** with `@prisma/adapter-pg` driver adapter — client at `app/generated/prisma/client`
- **Postgres** — Docker locally (`frontdoor:frontdoor@localhost:5432/frontdoor`), Neon in prod
- **Anthropic Claude API** — Sonnet 4.6 default, Haiku for extraction, Opus reserved for hardest tasks
- **Firecrawl** (`@mendable/firecrawl-js`) — hosted scrape API used by Path B scoring for HTML, screenshot, and the `branding` format (logo + CSS-extracted colors + fonts)
- **Vercel API** — demo deploys to `frontdoor-demos` project as subdomains; production deploys on payment
- **Stripe** — one-time Checkout session, webhook triggers final deployment
- **Tailwind CSS v4**
- **Framer Motion** (`motion`) — animation for demo templates and Frontdoor's own surfaces; maps to the schema's `motionIntensity` levels (dev-time UI stack per [[0014]])

## Data model

Five tables: `Lead`, `ScrapeJob`, `DemoSite`, `Payment`, `Deployment`.

### Lead model — unified across types

A single `Lead` table handles both lead types. The `leadType` enum (`OUTDATED_WEBSITE` | `NO_WEBSITE`) routes pipeline behavior; type-specific fields are nullable on the unified model. Avoids the complexity of separate tables while keeping per-type data structured.

Shared fields:
- `website` — null for no-website leads, populated for outdated-website
- `score` (Int?) — opportunity score 0–100 (high = outdated/pitchable per [[0011]])
- `scoreReasoning` (JSONB) — `ScoreFactor[]` from Sonnet
- `photosJson` (JSONB) — Google Place photo references
- `reviewsJson` (JSONB) — Google Place review records

Outdated-website-specific:
- `existingSiteAnalysisJson` (JSONB) — composite of Firecrawl-extracted `logoUrl` + `ExtractedColors` (per [[0012]]) plus Sonnet-produced `brandVoice` / `services` / `painPoints` / `whatToPreserve`. Schema lives in `types/scoring.ts`.

No-website-specific (Phase 7):
- `categoryProfile`, `personalitySignals` (when implemented)

### Lead status machine

Enforced in `lib/utils/statusMachine.ts`. The same status flow applies to both lead types. Existing-site analysis happens within the scoring step, not as a new state.

```
scraped → scored → approved → demo_generated → contacted → interested → paid → deployed
                ↘ rejected (terminal)
```

## Demo gating and hosting

Demos use **real business data** for maximum wow — name, scraped Google Place photos, services, location, real Google reviews with attribution. The pitch is "you, but beautiful."

**Functional elements are gated** to prevent ghosting:
- Contact forms show "Active on launch"
- Click-to-call is visual-only, not functional
- Booking widgets are designed but non-functional ("Live in 24 hours after signup")
- No customer-controlled domain pointing

**Hosted on `<business-slug>.frontdoor-demos.com`** — a single centralized Vercel project (`frontdoor-demos`) handles all demos as subdomains through Phase 1. Generated content gets pushed to a `frontdoor-demos-content` GitHub repo as new branches or folders per lead. Per-customer Vercel projects are a Phase 2 concern, post-conversion.

**Demo URLs expire after ~30 days** unless the lead converts.

## Key conventions

### File locations
```
app/                    Next.js routes and pages
app/api/                API route handlers
app/generated/prisma/   Generated Prisma client (gitignored)
lib/                    Server-side business logic
lib/scraper/            Google Places scraping
lib/scoring/            Claude lead scoring + existing-site analysis
lib/generation/         Claude demo site generation
lib/vercel/             Vercel deploy API client
lib/stripe/             Stripe client and webhook helpers
lib/utils/              Shared utilities (statusMachine, slugify, formatters)
components/             React components
components/ui/          Reusable primitives
components/dashboard/   Dashboard-specific components
templates/              Demo site template(s) — Phase 0.5 immediate priority
types/                  Shared TypeScript types
scripts/                CLI runners (tsx, never ts-node)
prisma/                 Schema, migrations, seed
docs/design/            Per-surface impeccable design context (website/dashboard/templates)
```

## Build phases

- **Phase 0** ✅ Foundation — schema, Docker, seed, lib/prisma.ts, statusMachine
- **Phase 0.5** 🎯 **Active priority** — Build one beautiful, motion-rich Next.js template. Designed to feel premium. Pipeline is now wired end-to-end through scoring; templates are the gating constraint on actually generating demos.
- **Phase 1** ✅ Scraping — Google Places v1 integration, pagination, dedup, `leadTypeFilter` with over-fetch ([[0013]])
- **Phase 2** ✅ Existing-site analysis + scoring — Path A (Haiku on Place metadata) + Path B (Firecrawl branding + regex pre-filter + Sonnet qualitative) per [[0011]]
- **Phase 3** ✅ Dashboard UI — leads table, type filter, show-rejected toggle, per-lead detail page with reasoning + brand analysis, scrape launcher form
- **Phase 4** Demo generation — Level 2 JSON pipeline → template variants → subdomain deploy (depends on Phase 0.5)
- **Phase 5** Stripe + production deploy — Checkout, webhook, customer-owned Vercel deploy
- **Phase 6** Hardening — error handling, auth, rate limiting
- **Phase 7** No-website lead expansion — category defaults, review/photo mining

## Environment variables

See `.env.example` for the full list. Key ones:
- `DATABASE_URL` — Postgres connection string
- `ANTHROPIC_API_KEY` — Claude API
- `ANTHROPIC_MODEL` — runtime default, set to `claude-sonnet-4-6`
- `ANTHROPIC_SCORING_MODEL` — set to `claude-haiku-4-5-20251001`
- `GOOGLE_PLACES_API_KEY` — scraping
- `FIRECRAWL_API_KEY` — Path B scraping (HTML + screenshot + branding)
- `SCORING_REJECT_THRESHOLD` — leads scored at or below this auto-reject (default 25)
- `VERCEL_API_TOKEN` — deployment
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — payments
- `DASHBOARD_PASSWORD` — simple single-user auth (Phase 6)