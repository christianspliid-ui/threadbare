# Project Status

> Updated 2026-03-20. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Hex Map V2** — Three.js-based hex map renderer (8-phase milestone). **V1 SVG hex map is frozen** — all development targets V2 only (`?view=hexv2`).

**Recent completions:**
- ✅ Phase 8 Plan 01: HexMapV2 integration into GameView (2026-03-22) — Three.js renderer replaces SVG HexMap in `?view=game`; WorldGenResult data threaded through; graph-to-AgentRenderData + LocationNode adapters; fog toggle wired. Requirements INTG-01..05 complete.
- ✅ Phase 7 Plan 01: Fog & Zoom pure logic modules (2026-03-22) — ZoomVisibilityMatrix (16-layer visibility matrix, 4 zoom tiers, fade alpha) + FogCulling (color override, layer gating, BFS visibility). 83 tests. Requirements FOG-01..06 + ZOOM-01..04 complete.
- ✅ Phase 6 Plan 04: Agent animation + HexMapV2 wiring (2026-03-22) — bezier hop (800ms + 150ms settle bounce), 6 activity icons, 5 event indicators, movement trails (2s fade), all render-loop integrated. Phase 6 complete.
- ✅ Phase 6 Plan 03: Agent rendering system (2026-03-22) — Three-tier sprite system (portrait/dot/continental), faction-color rings, retinue gold borders. 41 tests.

**Up next:**
- Phase 8 Plan 02: Documentation cleanup and V1 removal

**Latest implementation:** Phase 8 Plan 01 (2026-03-22) — HexMapV2 drop-in replacement for HexMap in GameView. WorldGenResult (riverPaths, lakeIds, regionData) flows from gameInit through useSimulation to HexMapV2 props. Agent and location adapters build render data from world graph.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
