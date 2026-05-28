# Generation Schema Checklist

Run this checklist when:
- `lib/generation/` is being built or modified
- `templates/` is being built or modified
- The generation schema in `SKILL.md` has changed
- A new layout variant, palette, section, or hero variant is being added

Mark each item complete before declaring the work done. If any item cannot
be checked, stop and resolve it — do not ship a partial implementation.

---

## API call structure

- [ ] Model is read from `ANTHROPIC_MODEL` env var — no hardcoded model string
- [ ] System prompt and template structure JSON are structured as the cached prefix
- [ ] Cached blocks are marked with `cache_control: { type: "ephemeral" }` on
      the standard `anthropic.messages.create()` call (no `beta.promptCaching` namespace)
- [ ] Batch API used for non-interactive generation (overnight scoring, bulk runs)
- [ ] Real-time path (survey-triggered regeneration) uses standard non-batch call
- [ ] No `mcp_servers` parameter on any runtime generation call

---

## Schema validation

- [ ] Zod schema in `lib/generation/` matches every key in `SKILL.md` exactly
- [ ] Required keys (`layout`, `colorSource`, `palette`, `motionIntensity`,
      `sectionOrder`, `heroVariant`, `serviceCardStyle`, `businessMeta`,
      `hero`, `services`, `cta`) throw on missing
- [ ] Optional keys (`trust`, `process`, `gallery`, `testimonials`,
      `hero.stats`, `businessMeta.logoUrl`, `businessMeta.phone`,
      `businessMeta.address`, `services.intro`, `cta.secondaryText`)
      have correct optional typing
- [ ] Raw Claude response is logged before Zod parse — not after
- [ ] Zod failure throws with the raw response included in the error message
- [ ] No silent correction of malformed responses — throw, log, stop

---

## Layout variants

- [ ] All three layouts handled in the template renderer:
  - [ ] `bold-action`
  - [ ] `refined-editorial`
  - [ ] `minimal-professional`
- [ ] Each layout has distinct visual treatment — not the same layout with
      different colors
- [ ] No layout-specific content hardcoded in the template — all content
      comes from the JSON

---

## Hero variants

- [ ] `centered-statement` renders without a stats block
- [ ] `split-with-image` renders with image on the correct side, no stats
- [ ] `split-with-stats` renders stats block and ONLY when `heroVariant`
      is `split-with-stats`
- [ ] Stats array is absent from generation output when variant is not
      `split-with-stats`

---

## Section ordering

- [ ] `sectionOrder` array drives render order — no hardcoded section sequence
      in the template
- [ ] Hero is always rendered first regardless of its position in the array
- [ ] CTA is always rendered last regardless of its position in the array
- [ ] Unknown section keys in `sectionOrder` are ignored gracefully, not thrown

---

## Optional sections

Each optional section must be completely absent from the rendered output
when its key is missing from the JSON — not rendered empty, not rendered
with placeholder content.

- [ ] `trust` — absent when key missing, rendered with badges when present
- [ ] `process` — absent when key missing, rendered with steps when present
- [ ] `gallery` — absent when key missing, rendered with photo grid when present
- [ ] `testimonials` — absent when key missing, rendered with quotes when present

---

## Palette handling

- [ ] `colorSource: "extracted"` renders from the four required slots
      `palette.primary`, `palette.accent`, `palette.background`,
      `palette.textPrimary` — these are always present
- [ ] Optional slots `palette.secondary` and `palette.link` are handled when
      present; `link` falls back to `accent` when absent
- [ ] Generation prompt composes the output palette from the (possibly sparse)
      scraped `existingSiteAnalysis.extractedColors` — deriving a missing accent,
      defaulting background to white and textPrimary to a high-contrast
      near-black — so the template never receives `undefined` for a core slot
- [ ] `colorSource: "predefined"` maps `palette.name` to the correct
      CSS design tokens
- [ ] All five predefined palettes have corresponding CSS token definitions:
  - [ ] `warm-trade`
  - [ ] `cool-professional`
  - [ ] `neutral-minimal`
  - [ ] `bold-energy`
  - [ ] `soft-wellness`
- [ ] Extracted palette hex values are sanitized before use (valid hex format)

---

## Motion intensity

- [ ] All four intensity levels handled by the template:
  - [ ] `none` — no animation classes applied
  - [ ] `subtle` — fade-in transitions only
  - [ ] `moderate` — staggered reveals, parallax hero
  - [ ] `high` — bold entrances, counter animations, scroll effects
- [ ] Motion classes are applied globally via a data attribute or CSS class
      on the root element — not per-section conditionals throughout the template

---

## Service card styles

- [ ] All three card styles handled:
  - [ ] `icon-bordered` — icon + title + description in bordered card
  - [ ] `image-top` — photo above text
  - [ ] `minimal-list` — text only, no card border
- [ ] `imageUrl` on service items only populated and rendered when
      `serviceCardStyle` is `image-top`

---

## Demo mode gating

- [ ] `DEMO_MODE` environment flag is read at runtime — not hardcoded
- [ ] In demo mode:
  - [ ] Contact forms render with "Active on launch" — not functional
  - [ ] Phone numbers display as text only — no `href="tel:"` attribute
  - [ ] Booking widgets render as designed but non-interactive
  - [ ] CTA buttons that would trigger contact show "Available on launch"
- [ ] In live mode (DEMO_MODE off or absent):
  - [ ] All of the above are fully functional
- [ ] Demo mode gating is in one place in the template — not scattered
      throughout multiple components

---

## Lead type routing

- [ ] `leadType: "OUTDATED_WEBSITE"` input includes `existingSiteAnalysis`
      and passes extracted colors into the generation prompt
- [ ] `leadType: "NO_WEBSITE"` input uses `categoryProfile` and
      `personalitySignals` — no `existingSiteAnalysis` block
- [ ] Generation prompt instructs Claude to set `colorSource: "extracted"`
      only when `existingSiteAnalysis.extractedColors` is present
- [ ] Generation prompt instructs Claude to set `colorSource: "predefined"`
      and pick a named palette when no extracted colors are available

---

## Schema sync check (run on every schema change)

When any key, variant, or type in the schema changes, all four of these
must be updated before the work is complete:

- [ ] `SKILL.md` — schema definition updated
- [ ] Generation prompt in `lib/generation/` — prompt updated to reflect change
- [ ] Zod schema in `lib/generation/` — validation updated to match
- [ ] Template renderer in `templates/` — render logic updated

If any of the four is not updated, stop. A partial schema update will cause
a runtime mismatch between what Claude returns and what the template expects.

---

## Final check before shipping

- [ ] Ran generation against the Morrison Plumbing example JSON in `SKILL.md`
      and the rendered output looks correct for all three layout variants
- [ ] Ran generation against a minimal valid JSON (only required keys,
      no optional sections) and the template renders without errors
- [ ] Zod schema rejects the Morrison Plumbing example with one required
      key removed (confirms validation is actually enforced)