# Frontdoor design context

This folder holds impeccable design context, one subfolder per design surface.
Each surface is a distinct design system (different register, brand, and goals),
so each gets its own `PRODUCT.md` and `DESIGN.md`.

`IMPECCABLE_CONTEXT_DIR` (set in `.claude/settings.json`) points at the surface
currently being worked on. Switch it when the focus changes.

| Surface | Folder | Register | Brand | Status |
|---|---|---|---|---|
| Marketing site | `website/` | brand | Frontdoor's own | context TBD (build first) |
| Internal dashboard | `dashboard/` | product | Frontdoor's own | context TBD |
| Demo templates | `templates/` | brand | per-business (extracted) | context written (seed) |

The website and dashboard share Frontdoor's own brand identity. The demo templates
deliberately wear each prospect's extracted brand instead, so they do not draw on
Frontdoor's own brand.

To create or refresh a surface's context: set `IMPECCABLE_CONTEXT_DIR` to its
folder, then run `/impeccable teach` (new surface) or `/impeccable document`
(existing code to scan).
