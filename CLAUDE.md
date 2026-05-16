@AGENTS.md
@.claude/rules/typescript.md

# Frontdoor

Lead generation and website automation pipeline. Scrapes Google Maps for small businesses without websites, scores them with Claude, lets the operator approve leads, generates demo Next.js sites, and deploys them to Vercel. Businesses pay via Stripe to get a production deployment with a custom domain.

## Architecture overview

```
Google Maps scrape → Claude scoring → manual approval → Claude site generation
→ /preview/[slug] demo → outreach → Stripe payment → Vercel production deploy
```

## MCP servers and tooling

### Frontend components — use 21st-dev first

Always query the **21st-dev** MCP server before writing UI components from scratch. Triggers:
- Building a new component (button, modal, form, card, table, etc.)
- Restyling or restructuring an existing component
- User describes a UI element they want built

Workflow: query 21st-dev → adapt the result to fit the project's conventions (Tailwind v4, existing component patterns in `components/ui/`) → only write from scratch if 21st-dev returns nothing usable.

### Knowledge base — vault MCP servers

Two vault MCP servers are available globally:
- **`mind`** — original thinking, decisions, journal entries
- **`library`** — reference material, including `library/projects/frontdoor/`

Before significant architectural changes, check `library/projects/frontdoor/decisions/` for relevant ADRs. When project history or past reasoning matters, query both vaults — `library` for documented decisions, `mind` for raw thinking that may not have made it into formal notes.

#### Ideas folder — `library/projects/frontdoor/ideas/`

This folder contains exploratory notes, design sketches, and synthesis docs from conversations and research that haven't yet been promoted to formal ADRs. Examples include pipeline shape proposals, tooling evaluations (e.g. Firecrawl, Brave Search), business model variations, and architecture explorations.

**Always check `library/projects/frontdoor/ideas/` before:**
- Proposing a pipeline change or new pipeline step
- Evaluating a new external service or tool
- Making a recommendation about scout, generation, or deployment flow
- Suggesting alternatives to anything that looks "decided" — there may be prior context

If a relevant idea note exists, reference it explicitly and build on it rather than starting from scratch. If a decision in an idea note has matured into something stable and worth locking in, suggest promoting it to an ADR.

#### ADR workflow

After completing a phase milestone or making a *non-obvious* technical decision, ask if I want to write an ADR to `library/projects/frontdoor/decisions/`. ADRs are short markdown files following the format `NNNN-kebab-case-slug.md`, capturing the decision, alternatives considered, and tradeoffs.

*Non-obvious* means: the decision had multiple reasonable alternatives, will be hard to reverse later, or required real tradeoff thinking. Not "I named this variable X."

Use `_template.md` as the starting structure, found at `library/projects/frontdoor/decisions/_template.md`.

**Whenever a new ADR is created, also update `library/projects/frontdoor/decisions/0000-index.md`** to:
- Add a `[[NNNN-kebab-case-slug]]` link to the new ADR
- Include a one-sentence summary of the decision
- Maintain the existing ordering and grouping conventions in the index

Also add genuine inline `[[wikilinks]]` from the new ADR to any prior ADRs it depends on, supersedes, or is constrained by. Don't force connections that aren't real.

## Tech stack

- **Next.js 16** (App Router, TypeScript) — `app/` at root, no `src/`
- **Prisma 7** with `@prisma/adapter-pg` driver adapter — client at `app/generated/prisma/client`
- **Postgres** — Docker locally (`frontdoor:frontdoor@localhost:5432/frontdoor`), Neon in prod
- **Anthropic Claude API** — scoring uses `claude-haiku-4-5-20251001`, generation uses `claude-opus-4-6`
- **Vercel API** — preview deployments for demos, production deployments on payment
- **Stripe** — one-time Checkout session, webhook triggers final deployment
- **Tailwind CSS v4**

## Data model

Five tables: `Lead`, `ScrapeJob`, `DemoSite`, `Payment`, `Deployment`.

**Lead status machine** (enforced in `lib/utils/statusMachine.ts`):
```
scraped → scored → approved → demo_generated → contacted → interested → paid → deployed
                ↘ rejected (terminal)
```

## Key conventions

### Prisma 7 usage
- Import client from `@/app/generated/prisma/client` (not `@prisma/client`)
- Instantiate with `new PrismaClient({ adapter })` where adapter is `new PrismaPg({ connectionString })`
- Use `Prisma.JsonNull` for nullable JSON fields set to null (not plain `null`)
- Schema has no `url`/`directUrl` in datasource — those live in `prisma.config.ts`
- Run scripts with `tsx`, not `ts-node`

### API routes
- Params are `Promise<{...}>` — always `await params` before destructuring
- Use `Response.json()` for responses (not `NextResponse.json()`)
- Import `NextRequest` from `next/server` when you need `request.nextUrl` or cookies

### Imports
- Path alias `@/` maps to the project root
- Prisma client: `@/app/generated/prisma/client`
- Shared types: `@/types`
- DB singleton: `@/lib/prisma`
- Status machine: `@/lib/utils/statusMachine`

### File locations
```
app/                    Next.js routes and pages
app/api/                API route handlers
app/generated/prisma/   Generated Prisma client (gitignored)
lib/                    Server-side business logic
lib/scraper/            Google Places scraping
lib/scoring/            Claude lead scoring
lib/generation/         Claude demo site generation
lib/vercel/             Vercel deploy API client
lib/stripe/             Stripe client and webhook helpers
lib/utils/              Shared utilities (statusMachine, slugify, formatters)
components/             React components
components/ui/          Reusable primitives
components/dashboard/   Dashboard-specific components
types/                  Shared TypeScript types
scripts/                CLI runners (tsx, never ts-node)
prisma/                 Schema, migrations, seed
```

## Build phases

- **Phase 0** ✅ Foundation — schema, Docker, seed, lib/prisma.ts, statusMachine
- **Phase 1** Scraping — Google Places API client, ScrapeJob lifecycle, API routes
- **Phase 2** Scoring — Claude scoring pipeline
- **Phase 3** Dashboard UI — lead table, approve/reject, scrape launcher
- **Phase 4** Demo generation — Claude → JSON → /preview/[slug]
- **Phase 5** Stripe + deploy — Checkout, webhook, Vercel production deploy
- **Phase 6** Hardening — error handling, auth, rate limiting

## Environment variables

See `.env.example` for the full list. Key ones:
- `DATABASE_URL` — Postgres connection string
- `ANTHROPIC_API_KEY` — Claude API
- `GOOGLE_PLACES_API_KEY` — scraping
- `VERCEL_API_TOKEN` — deployment
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — payments
- `DASHBOARD_PASSWORD` — simple single-user auth (Phase 6)
