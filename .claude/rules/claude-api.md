---
paths:
  - "lib/generation/**/*.ts"
  - "lib/scoring/**/*.ts"
---

# Runtime Claude API conventions

## Model selection

- **Sonnet 4.6** (`claude-sonnet-4-6`) — default for generation. Set via `ANTHROPIC_MODEL`.
- **Haiku 4.5** (`claude-haiku-4-5-20251001`) — structured extraction, classification, parsing survey responses. Set via `ANTHROPIC_SCORING_MODEL`.
- **Opus 4.7** (`claude-opus-4-7`) — reserved for hardest tasks only (vision analysis on existing sites, hardest copywriting passes). Not the default.

## Call construction

- Prompt caching is mandatory — system prompts and template structure are identical across leads, perfect cache targets. Build cached prefixes into every multi-lead generation call.
- Use Batch API for any non-urgent workload (overnight scoring, bulk regeneration). Do NOT use for survey-triggered regeneration where real-time UX matters.
- Never attach MCP servers to runtime API calls.
- Default to Sonnet 4.6 via `ANTHROPIC_MODEL` for generation calls.
