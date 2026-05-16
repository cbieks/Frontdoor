# Frontdoor

Lead generation and website automation pipeline. Finds small businesses without websites, scores them with Claude, lets an operator approve leads, generates demo sites, and deploys them to production after payment.

## Pipeline

```
Google Maps scrape
  → Claude scoring (Haiku)
  → operator approve / reject
  → Claude demo site generation (Opus)
  → /preview/[slug] demo page
  → outreach email
  → Stripe payment
  → Vercel production deployment + custom domain
```

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Database | Postgres — Docker locally, Neon in production |
| ORM | Prisma 7 with `@prisma/adapter-pg` driver adapter |
| AI | Claude API — Haiku for scoring, Opus for generation |
| Payments | Stripe one-time Checkout |
| Deployments | Vercel API |
| Scraping | Google Places Text Search API |
| Styling | Tailwind CSS v4 |

## Data model

Five tables: `Lead`, `ScrapeJob`, `DemoSite`, `Payment`, `Deployment`.

**Lead status machine** — enforced in `lib/utils/statusMachine.ts`:

```
scraped → scored → approved → demo_generated → contacted → interested → paid → deployed
                ↘ rejected (terminal, reachable from any pre-deployed step)
```

**Lead** — one row per business. Key fields: `googlePlaceId` (unique), `status`, `score`, `scoreReasoning` (JSONB), `demoUrl`.

**ScrapeJob** — tracks a scrape run. Fields: `query`, `filters` (JSONB), `status` (`pending → running → completed | failed`), `totalFound`, `totalImported`.

**DemoSite** — generated site content. Fields: `slug` (unique), `contentJson`, `templateUsed`, `vercelPreviewUrl`, `status` (`generating | ready | failed`).

**Payment** — Stripe transaction. Fields: `stripeSessionId`, `amount`, `status` (`pending | succeeded | failed | refunded`).

**Deployment** — production deploy record. Fields: `vercelProjectId`, `customDomain`, `domainStatus`, `deploymentStatus`, `productionUrl`.

## Directory layout

```
app/                    Next.js routes and pages
app/api/                API route handlers
app/generated/prisma/   Generated Prisma client (gitignored, build artifact)
lib/                    Server-side business logic
lib/prisma.ts           Prisma singleton (import this everywhere)
lib/scraper/            Google Places scraping — googlePlaces.ts, index.ts
lib/scoring/            Claude lead scoring (Phase 2 — not yet built)
lib/generation/         Claude demo site generation (Phase 4 — not yet built)
lib/vercel/             Vercel deploy API client (Phase 5 — not yet built)
lib/stripe/             Stripe client and webhook helpers (Phase 5 — not yet built)
lib/utils/              statusMachine, slugify, formatters
components/             React components
components/ui/          Reusable primitives
components/dashboard/   Dashboard-specific components (Phase 3 — not yet built)
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

### Phase 1 — Scraping (in progress)

- `lib/scraper/googlePlaces.ts` — paginated Places Text Search, 20 results/page, 150ms between pages
- `lib/scraper/index.ts` — `createScrapeJob` and `runScrapeJob` (full lifecycle: pending → running → completed/failed, deduplication by `googlePlaceId`, bulk insert)
- `lib/scraper/types.ts` — `ScraperOptions`, `RawBusiness`, `ScrapeResult`
- `POST /api/scrape` — creates ScrapeJob, returns `202 { jobId }`, runs scrape via `next/server.after()`
- `GET /api/scrape/status/[jobId]` — polling endpoint for job progress
- `scripts/scrape-manual.ts` — CLI runner (`npx tsx scripts/scrape-manual.ts "query"`)

### Phases 2–6 — Not yet built

| Phase | Work |
|---|---|
| 2 — Scoring | `lib/scoring/` — Haiku-powered batch scoring, updates `Lead.score` and `scoreReasoning` |
| 3 — Dashboard | Lead table, approve/reject actions, scrape launcher UI |
| 4 — Demo generation | `lib/generation/` — Opus generates site JSON, `/preview/[slug]` renders it |
| 5 — Stripe + deploy | Checkout session, webhook, `lib/vercel/` production deploy |
| 6 — Hardening | Auth (`DASHBOARD_PASSWORD`), error handling, rate limiting |

## Key architectural decisions

Formal ADRs live in `library/projects/frontdoor/decisions/` in the Obsidian library vault.

| ADR | Decision | Why |
|---|---|---|
| [0001](library/projects/frontdoor/decisions/0001-prisma-driver-adapter.md) | Prisma 7 + `@prisma/adapter-pg` | Same client works against local Docker and Neon production; schema has no embedded secrets |
| [0002](library/projects/frontdoor/decisions/0002-lead-status-machine.md) | FSM for lead status in `statusMachine.ts` | Prevents silent invalid transitions; drives conditional UI without duplicating logic |
| [0003](library/projects/frontdoor/decisions/0003-async-scrape-after-polling.md) | `next/server.after()` + polling | No queue infrastructure; survives Vercel's 10s function timeout; simple for a solo-operator tool |
| [0004](library/projects/frontdoor/decisions/0004-tiered-claude-models.md) | Haiku for scoring, Opus for generation | ~15x cost difference; Haiku is sufficient for bulk classification, Opus for customer-facing output |
| [0005](library/projects/frontdoor/decisions/0005-json-fields-reasoning-filters.md) | JSONB for `scoreReasoning` and `filters` | Schema evolves without migrations; no join needed on lead fetch; Postgres JSONB for future queries |

## Pipeline evolution — open ideas

`library/projects/frontdoor/notes/scout-pipeline-shape.md` sketches an enrichment step that would sit between scraping and scoring:

```
Google Maps → Brave Search (find related web presence) → Firecrawl scrape → Claude scoring
```

This adds signal quality for scoring — particularly useful for identifying "weak website" leads that technically have a site but a very poor one. Not yet implemented; Brave Search is not yet installed. Firecrawl MCP is available globally as of 2026-05-04.

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
