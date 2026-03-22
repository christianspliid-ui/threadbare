# Project Status

> Updated 2026-03-20. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Hex Map V2** — Three.js-based hex map renderer (8-phase milestone).

**Recent completions:**
- ✅ Phase 6 Plan 01: Location rendering pipeline (2026-03-22) — 17 LocationType registry, CanvasTexture cache, LocationIconMesh at renderOrder=8, LocationLabelOverlay with importance-based fonts (capital 13px/700, city/town 11px/400, small 9px/400), COMP-05 RING slot multi-occupant extension. 26 tests.
- ✅ Phase 6 Plan 03: Agent rendering system (2026-03-22) — Three-tier sprite system (portrait/dot/continental), faction-color rings, retinue gold borders, RING layout via getRingSlotOffset, async portrait loading with fail-soft fallback. 41 tests.
- ✅ Phase 5 Plans 01-04: Signifier system scaffold, composition resolver, all terrain art. Phase 5 complete.
- ✅ Phase 4 Plans 01-03: Regions, borders, HTML label overlay. Phase 4 complete.

**Up next:**
- Phase 6 Plan 02: Location icon production art
- Phase 6 Plan 04: Agent animation (bezier hop, movement trails, indicators)

**Latest implementation:** Phase 6 Plan 01 (2026-03-22) — Location rendering pipeline: registry → texture cache → sprites → labels. COMP-05 RING slot supports unlimited agents per hex with sequential ringIndex.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
