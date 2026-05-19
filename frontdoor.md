# Frontdoor

Lead generation and website automation pipeline. Finds small businesses with outdated or absent websites, analyzes what they have (or don't), generates beautiful demo Next.js sites tailored to each business, and uses those demos themselves as the sales pitch. Businesses pay via Stripe to convert their demo into a production deployment on their own domain.

## Current immediate priority

**Build one impressive template before further pipeline automation.** Frontdoor's differentiation against Wix-style competitors is design taste and per-business intelligence, not template volume. The active Phase 0.5 work is producing a single beautiful, motion-rich Next.js landing page that we'd be proud to send to any prospect. Phase 1 scraping work is paused until that template exists. The rest of the architecture depends on having a template worth automating around — and if the template isn't unmistakably good, no amount of variety covers for it.

## Strategy

### What makes Frontdoor different from Wix-style competitors

| | Wix and similar | Frontdoor |
|---|---|---|
| Who designs the site | The user | Frontdoor (auto-selected per business) |
| Template quality | Generic, broad-appeal | Tightly designed, motion-rich, modern |
| Personalization | User picks from a list | Claude makes structural design choices per business |
| User effort | Hours of work | None — they just review and approve |
| Brand-aware | No | Yes (extracts and preserves existing brand for outdated-website leads) |

The competitive moat is **taste plus intelligence**. The taste lives in the template; the intelligence lives in how Claude makes structural decisions based on the business's category, reviews, photos, and existing brand.

### Outreach model: hybrid demo-first with embedded survey

Cold email links to a generated demo (not a survey form). The demo page itself embeds a short survey: "Want me to tailor this? Tell me your goals and I'll regenerate." This:

- Preserves the wow factor of seeing your business reflected back at you, beautifully presented
- Gates personalization behind demonstrated interest (only people who actually viewed the demo see the survey)
- Captures qualification signal cheaply (people who fill out the survey are pre-qualified)
- Doesn't burn the initial pitch on people who'd never have replied anyway

Rejected alternatives: survey-first outreach (kills the wow factor, low cold-completion rates), and sending fully functional finished sites (high ghosting/theft risk).

### Lead types and sequencing

Frontdoor supports two distinct lead types, implemented in sequence:

**Outdated-website leads (Phase 0–1, active):** businesses with a real but low-quality website — slow, ugly, broken, neglected, or visually aged. These convert better because:
- They've already decided they need a website (paid for one before)
- They have visible pain ("your site loads in 8 seconds and doesn't work on mobile")
- They have budget signal
- We can preserve their existing brand (logo, colors, voice) while fixing what's broken
- The before/after pitch is visceral: "here's your site today, here's what I made for you"

**No-website leads (Phase 7+, later):** businesses with no website at all or with dead/parked domains. Lower conversion expectation but larger addressable market. Will use category defaults and mine Google reviews and photos for personality signals.

Sequencing isn't exclusion — both belong in Frontdoor's vision. But outdated-website-first is the higher-leverage starting point.

## Pipeline

```
Google Maps scrape
  → existing-site analysis (Claude with vision, for outdated-website leads)
  → quality scoring + lead classification
  → operator approve / reject
  → Level 2 demo generation (Sonnet — content + structural decisions)
  → deploy to <slug>.frontdoor-demos.com
  → outreach email with demo link
  → prospect views demo, optionally submits embedded survey
  → optional regeneration with explicit preferences
  → Stripe payment
  → production deployment on customer-owned Vercel + custom domain
```

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Database | Postgres — Docker locally, Neon in production |
| ORM | Prisma 7 with `@prisma/adapter-pg` driver adapter |
| AI default | Sonnet 4.6 for content generation; Haiku 4.5 for extraction; Opus 4.7 reserved for hardest tasks |
| Payments | Stripe one-time Checkout |
| Demo hosting | Single centralized `frontdoor-demos` Vercel project, subdomains per lead |
| Production hosting | Per-customer Vercel project after payment (Phase 2 concern) |
| Scraping | Google Places Text Search API |
| Styling | Tailwind CSS v4 |

## Runtime AI generation — Level 2

Per-demo generation operates at "Level 2": Claude returns JSON containing **both content and structural decisions** (layout variant, palette, section order, motion intensity, component variant selections). The template engine renders those decisions against a library of pre-built variants.

This sits between:
- Level 1 (content-only) — feels templated, Wix-like
- Level 3 (runtime code generation) — too risky, hard to validate, security and performance concerns
- Level 4 (component composition from a registry) — possible Phase 2+, out of scope now

The output space is large enough that demos feel custom; bounded enough that we can validate and debug.

## Cost model

| Stage | Cost per lead | Notes |
|---|---|---|
| Google Places scrape | ~$0.005 | API call |
| Existing-site analysis (outdated-website leads) | ~$0.03 | Sonnet with vision, one call |
| Lead scoring | ~$0.001 | Haiku, batch API |
| Demo generation | ~$0.07 | Sonnet + prompt caching enabled |
| Vercel demo hosting | $0 | Free tier on subdomain |
| Email send | ~$0.001 | Cheap email service |
| **Total per lead** | **~$0.10** | Before conversion |

Cost ceilings:
- Per-demo Anthropic spend: under $0.10 with caching enabled
- Phase 0–1 monthly Anthropic budget: under $100
- Vercel free tier as long as possible

Bigger cost levers than compute: deliverability/email reputation, time spent reviewing demos, and conversion rate.

## Data model

Five tables: `Lead`, `ScrapeJob`, `DemoSite`, `Payment`, `Deployment`.

### Unified Lead model

A single `Lead` table handles both lead types via a `leadType` enum (`OUTDATED_WEBSITE` | `NO_WEBSITE`). Type-specific fields are nullable. Avoids the complexity of separate tables while keeping per-type data structured.

**Common fields:** `googlePlaceId` (unique), `businessName`, `category`, `city`, `phone`, `status`, `leadType`, `score`, `scoreReasoning` (JSONB), `demoUrl`.

**Outdated-website-specific (nullable):** `existingSiteUrl`, `existingSiteQualityScore`, `existingSiteAnalysisJson` — Claude-extracted brand voice, color palette, logo URL, services, current pain points, what to preserve.

**No-website-specific (nullable, Phase 7+):** `categoryProfile`, `personalitySignals`.

### Lead status machine

Enforced in `lib/utils/statusMachine.ts`. The same status flow applies to both lead types. Existing-site analysis happens within the scoring step, not as a new state.

```
scraped → scored → approved → demo_generated → contacted → interested → paid → deployed
                ↘ rejected (terminal, reachable from any pre-deployed step)
```

### Other tables

**ScrapeJob** — tracks a scrape run. Fields: `query`, `filters` (JSONB), `status` (`pending → running → completed | failed`), `totalFound`, `totalImported`.

**DemoSite** — generated site content. Fields: `slug` (unique), `contentJson` (Claude's Level 2 output), `templateUsed`, `templateVariant`, `vercelPreviewUrl`, `status` (`generating | ready | failed`), `expiresAt`.

**Payment** — Stripe transaction. Fields: `stripeSessionId`, `amount`, `status` (`pending | succeeded | failed | refunded`).

**Deployment** — production deploy record. Fields: `vercelProjectId`, `customDomain`, `domainStatus`, `deploymentStatus`, `productionUrl`.

## Demo gating

Demos use **real business data** — name, scraped Google Place photos, services, location, real Google reviews with attribution. The wow comes from seeing your business reflected back at you, beautifully presented.

**Functional elements are gated** to prevent ghosting (prospects taking the design without paying):
- Contact forms show "Active on launch"
- Click-to-call is visual-only
- Booking widgets are designed but non-functional ("Live in 24 hours after signup")
- The site lives on our subdomain, not their domain — they can't repoint a domain at it

Demo URLs expire after ~30 days unless the lead converts.

## Directory layout

```
app/                    Next.js routes and pages
app/api/                API route handlers
app/generated/prisma/   Generated Prisma client (gitignored, build artifact)
lib/                    Server-side business logic
lib/prisma.ts           Prisma singleton (import this everywhere)
lib/scraper/            Google Places scraping — googlePlaces.ts, index.ts
lib/scoring/            Lead scoring + existing-site analysis (Phase 2 — not yet built)
lib/generation/         Claude Level 2 demo generation (Phase 4 — not yet built)
lib/vercel/             Vercel deploy API client (Phase 5 — not yet built)
lib/stripe/             Stripe client and webhook helpers (Phase 5 — not yet built)
lib/utils/              statusMachine, slugify, formatters
components/             React components
components/ui/          Reusable primitives
components/dashboard/   Dashboard-specific components (Phase 3 — not yet built)
templates/              Demo site templates and variants (Phase 0.5 — active priority)
types/                  Shared TypeScript types (re-exports Prisma enums + custom types)
scripts/                CLI runners — tsx only, never ts-node
prisma/                 schema.prisma, migrations/, seed.ts
```

## What's been built

### Phase 0 — Foundation (complete)

- Prisma schema with all five tables and six enums
- `lib/prisma.ts` singleton with `PrismaPg` driver adapter
- `lib/utils/statusMachine.ts` — full transition map, `canTransition`, `assertTransition`, `nextStatuses`
- `types/index.ts` — shared types including `ScoreReasoningEntry`, `LeadWithRelations`, `PaginatedResponse`, `ApiError`
- Docker Compose for local Postgres
- `prisma/seed.ts` — five demo leads across different statuses
- `app/page.tsx` redirects to `/dashboard`

### Phase 0.5 — Template design (active priority)

The single most important Phase 0.5 deliverable: one beautiful, motion-rich Next.js landing page template. Designed in `templates/`. Used as the visual foundation that the Phase 4 generation pipeline will populate with per-business content and structural decisions.

### Phase 1 — Scraping (paused)

Foundations exist; full pipeline paused until Phase 0.5 is complete.

- `lib/scraper/googlePlaces.ts` — paginated Places Text Search, 20 results/page, 150ms between pages
- `lib/scraper/index.ts` — `createScrapeJob` and `runScrapeJob` (full lifecycle: pending → running → completed/failed, deduplication by `googlePlaceId`, bulk insert)
- `lib/scraper/types.ts` — `ScraperOptions`, `RawBusiness`, `ScrapeResult`
- `POST /api/scrape` — creates ScrapeJob, returns `202 { jobId }`, runs scrape via `next/server.after()`
- `GET /api/scrape/status/[jobId]` — polling endpoint for job progress
- `scripts/scrape-manual.ts` — CLI runner (`npx tsx scripts/scrape-manual.ts "query"`)

### Phases 2–7 — Not yet built

| Phase | Work |
|---|---|
| 2 — Analysis + scoring | `lib/scoring/` — existing-site analysis for outdated-website leads (Claude with vision), website quality scoring, lead scoring |
| 3 — Dashboard | Lead table, approve/reject actions, scrape launcher UI, demo review |
| 4 — Demo generation | `lib/generation/` — Sonnet generates Level 2 JSON, template engine renders to deployed subdomain |
| 5 — Stripe + deploy | Checkout session, webhook, `lib/vercel/` production deploy to customer-owned Vercel |
| 6 — Hardening | Auth (`DASHBOARD_PASSWORD`), error handling, rate limiting |
| 7 — No-website lead expansion | Category defaults, review mining, photo mining, second pipeline branch |

## Key architectural decisions

Formal ADRs live in `library/projects/frontdoor/decisions/` in the Obsidian library vault.

| ADR | Decision | Why |
|---|---|---|
| [0001](library/projects/frontdoor/decisions/0001-prisma-driver-adapter.md) | Prisma 7 + `@prisma/adapter-pg` | Same client works against local Docker and Neon production; schema has no embedded secrets |
| [0002](library/projects/frontdoor/decisions/0002-lead-status-machine.md) | FSM for lead status in `statusMachine.ts` | Prevents silent invalid transitions; drives conditional UI without duplicating logic |
| [0003](library/projects/frontdoor/decisions/0003-async-scrape-after-polling.md) | `next/server.after()` + polling | No queue infrastructure; survives Vercel's 10s function timeout; simple for a solo-operator tool |
| [0004](library/projects/frontdoor/decisions/0004-tiered-claude-models.md) | Haiku for scoring, Opus for generation | **To be superseded by ADR-0010** — original reasoning preserved as record |
| [0005](library/projects/frontdoor/decisions/0005-json-fields-reasoning-filters.md) | JSONB for `scoreReasoning` and `filters` | Schema evolves without migrations; no join needed on lead fetch; Postgres JSONB for future queries |
| [0006](library/projects/frontdoor/decisions/0006-hybrid-demo-first-outreach.md) | Hybrid demo-first outreach with embedded survey | Preserves wow factor; gates personalization behind demonstrated interest |
| [0007](library/projects/frontdoor/decisions/0007-demo-gating-centralized-hosting.md) | Demo gating + centralized subdomain hosting | Real data for wow, gated functionality prevents ghosting, centralized hosting is cheap and manageable |
| [0008](library/projects/frontdoor/decisions/0008-two-lead-types-unified-model.md) | Two lead types on a unified Lead model, outdated-website first | Pipeline branches diverge in data-gathering, converge in generation; better demo quality and conversion |
| [0009](library/projects/frontdoor/decisions/0009-level-2-runtime-generation.md) | Level 2 runtime generation (structural decisions + content) | Custom-feeling demos without runtime code-gen risks; no runtime MCP |
| [0010](library/projects/frontdoor/decisions/0010-sonnet-default-caching-batching.md) | Sonnet 4.6 as runtime default, caching mandatory, batching for non-urgent work | Supersedes 0004; ~$0.07 per demo with caching; well within budget |

## Pipeline evolution — open ideas

`library/projects/frontdoor/notes/scout-pipeline-shape.md` sketches an enrichment step that would sit between scraping and scoring:

```
Google Maps → Brave Search (find related web presence) → Firecrawl scrape → Claude scoring
```

This adds signal quality for scoring — particularly useful for identifying "weak website" leads that technically have a site but a very poor one. Not yet implemented; Brave Search is not yet installed. Firecrawl MCP is available globally as of 2026-05-04. The existing-site analysis step in Phase 2 may partly cover this need.

## Dev setup

```bash
# Start Postgres
docker compose up -d

# Install deps
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start dev server
npm run dev
```

Copy `.env.example` to `.env.local` and fill in API keys before running. Required for scraping: `DATABASE_URL`, `GOOGLE_PLACES_API_KEY`. Required for full pipeline: `ANTHROPIC_API_KEY`, `VERCEL_API_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

## Conventions

- Import Prisma client from `@/app/generated/prisma/client`, not `@prisma/client`
- DB singleton: `import { prisma } from '@/lib/prisma'`
- API route params are `Promise<{...}>` — always `await params` before destructuring
- Use `Response.json()` not `NextResponse.json()`
- Scripts: `tsx` only, `dotenv/config` as first import, wrap in `async function main()`
- Use `Prisma.JsonNull` (not plain `null`) when clearing JSONB fields
- All status changes must call `assertTransition(from, to)` before writing to DB
- Default runtime AI model: Sonnet 4.6 via `ANTHROPIC_MODEL`. Reserve Opus for hardest tasks only.
- Prompt caching mandatory on all runtime generation calls — system prompts and template structure are cached prefixes.
- Never attach MCP servers to runtime API calls. MCP is dev-time only.
