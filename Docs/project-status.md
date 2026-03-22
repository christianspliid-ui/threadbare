# Project Status

> Updated 2026-03-20. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Hex Map V2** — Three.js-based hex map renderer (8-phase milestone).

**Recent completions:**
- ✅ Phase 4 Plan 03: HTML Label Overlay (2026-03-22) — RAF-driven kingdom/barony/geographic/river labels over Three.js canvas, AABB collision detection, zoom-tier filtering, cartographic halo style. Phase 4 complete.
- ✅ Phase 4 Plan 02: Political regions + border mesh (2026-03-22) — barony/kingdom assignment, red quad-strip borders, capital dot markers wired into HexMapV2.
- ✅ Phase 4 Plan 01: Geographic region detection (2026-03-22) — Dijkstra flood fill, watershed detection, RegionData types.

**Up next:**
- Phase 5: Terrain signifiers (hex icons, biome markers)

**Latest implementation:** Phase 4 Plan 03 (2026-03-22) — Full label overlay system operational. Kingdom/barony/geographic/river labels render with proper typography, dark-text-with-halo, and zoom-tier visibility. Phase 4 Regions & Borders complete.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
