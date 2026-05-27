# Lead-Scoring Verification Checklist

Run through this list before marking any scoring work complete. The
skill contract is a multi-way agreement between this skill, the scoring
prompts, the inline TS guards, the database schema, and the generation
skill — all five must stay aligned.

## Contract sync

- [ ] `ScoreFactor` shape in `SKILL.md` matches the inline guard in `lib/scoring/`
- [ ] `ExistingSiteAnalysis` shape in `SKILL.md` matches the inline guard in `lib/scoring/`
- [ ] `ExistingSiteAnalysis` shape matches the `existingSiteAnalysis` input contract in the **generation-schema** skill — these are read/write opposites of the same JSON
- [ ] `Lead.existingSiteAnalysisJson` Prisma column exists and is `Json?`
- [ ] `Lead.scoreReasoning` Prisma column exists and is `Json?`
- [ ] `LeadType` Prisma enum has exactly `OUTDATED_WEBSITE` and `NO_WEBSITE`

## Routing

- [ ] `scoreLead(leadId)` dispatches by `lead.leadType` (not by `lead.website` presence — leadType is the source of truth)
- [ ] Both paths return either `{ score, reasoning, ... }` or `{ autoReject: { reason } }` — never both
- [ ] Caller transitions `scraped → scored` for any non-autoReject result
- [ ] Caller transitions `scored → rejected` when autoReject OR `score <= SCORING_REJECT_THRESHOLD`
- [ ] Both transitions go through `assertTransition` from `lib/utils/statusMachine.ts`

## Path A (no-website)

- [ ] Deterministic auto-reject runs before any LLM call: rating < 3.0, reviewCount > 2000, ghost-listing check
- [ ] Haiku call uses `process.env.ANTHROPIC_SCORING_MODEL` — no hardcoded model string
- [ ] System prompt block marked with `cache_control: { type: "ephemeral" }`
- [ ] User message contains only per-lead data, never instructions (those belong in the cached system prompt)
- [ ] Output validated against `ScoreFactor[]` shape before write

## Path B (outdated-website)

- [ ] Firecrawl call uses `formats: ["markdown", "html", "screenshot"]`
- [ ] Firecrawl failure returns `autoReject: { reason: "firecrawl-failed" }` — no Sonnet call attempted
- [ ] `classifyHtml(html)` runs before any Sonnet call
- [ ] `auto-reject-modern` verdict returns immediately with reason containing the modernSignals — no Sonnet call
- [ ] Sonnet call uses `process.env.ANTHROPIC_MODEL` — no hardcoded model string
- [ ] System prompt block marked with `cache_control: { type: "ephemeral" }`
- [ ] User message includes screenshot as an image content block, markdown extract as text, and the heuristic findings as structured text
- [ ] Output JSON validated against `ScoreFactor[]` AND `ExistingSiteAnalysis` shapes before write

## Heuristics

- [ ] Strong-modern signal list in `heuristics.ts` matches the list in `SKILL.md` exactly
- [ ] Strong-outdated signal list in `heuristics.ts` matches the list in `SKILL.md` exactly
- [ ] Verdict rule is `modernSignals.length >= 1 && outdatedSignals.length === 0` — anything else goes to vision
- [ ] Fixture file `heuristics.test-fixtures.ts` has at least one sample each for: clearly modern, clearly outdated, ambiguous

## Batch behavior

- [ ] `scoreLeadsBatch` uses `Promise.allSettled` — one lead failing must not kill the batch
- [ ] Concurrency capped at ~5 parallel Firecrawl calls (avoids burst rate-limits)
- [ ] Failed leads stay at `scraped` for retry — not auto-rejected on transient failure

## Operational

- [ ] `SCORING_REJECT_THRESHOLD` env var read with default 25
- [ ] No MCP servers attached to runtime API calls
- [ ] Firecrawl uses `@mendable/firecrawl-js` HTTP client, never the MCP server
- [ ] `cached_input_tokens > 0` after the second lead (verify caching is hitting in console)
