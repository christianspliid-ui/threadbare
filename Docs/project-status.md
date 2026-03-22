# Project Status

> Updated 2026-03-20. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Hex Map V2** — Three.js-based hex map renderer (8-phase milestone).

**Recent completions:**
- ✅ Phase 6 Plan 03: Agent rendering system (2026-03-22) — Three-tier sprite system (portrait/dot/continental), faction-color rings, retinue gold borders, RING layout via getRingSlotOffset, async portrait loading with fail-soft fallback. 41 tests.
- ✅ Phase 5 Plan 04: Remaining terrain signifier art (2026-03-22) — Production SVG paths for all highland, desert, cold, volcanic, and special terrain types. 28 direct + 6 fallback = all 33 land TerrainTypes covered. Phase 5 complete.
- ✅ Phase 5 Plans 01-03: Signifier system scaffold, composition resolver, lowland + forest terrain art (2026-03-22).
- ✅ Phase 4 Plans 01-03: Regions, borders, HTML label overlay (2026-03-22). Phase 4 complete.

**Up next:**
- Phase 6 Plan 04: Agent animation (bezier hop, movement trails, indicators)

**Latest implementation:** Phase 6 Plan 03 (2026-03-22) — Agent rendering system. Three-tier sprite groups (portrait at k≥15, dot at k≥5, continental retinue at k≥1.5). Faction heraldic colors, retinue gold rings, RING layout, async portrait textures with fail-soft fallback.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
