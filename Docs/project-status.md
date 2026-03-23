# Project Status

> Updated 2026-03-22. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Phase 8 Integration complete.** The Hex Map V2 milestone (8 phases) is finished. HexMapV2 (Three.js InstancedMesh) is the sole hex renderer. The V1 SVG hex map has been deleted.

**Recent completions:**
- ✅ Phase 8 Plan 03: INTG-06 test gap closure (2026-03-23) — 14 test failures fixed: canvas mock, ElevationTicks rewrite (Mesh/plateau/quad geometry), terrainPalette count 30→32, coastline shallowWidth 0.19→0.28, stale V1 MovementTrails test deleted.
- ✅ Phase 8 Plan 02: V1 SVG hex map deleted, WGEN-14 fantasy overlay pass (2026-03-22) — 22 V1 files deleted, sphere-driven biome transformation pass implemented with 8 TDD tests, App.tsx worldgen screen updated to HexMapV2, all documentation cleaned up.
- ✅ Phase 8 Plan 01: HexMapV2 integration into GameView (2026-03-22) — Three.js renderer replaces SVG HexMap in `?view=game`; WorldGenResult data threaded through; graph-to-AgentRenderData + LocationNode adapters; fog toggle wired.
- ✅ Phase 07.1 Plan 01: Stencil coastline clipping (2026-03-22) — GPU stencil-buffer clips coastal land hexes to organic shoreline; land/water InstancedMesh split; fog routing via globalToMeshMap.
- ✅ Phase 6 complete: Agent rendering, animation, location icons, all wired to HexMapV2.

**Latest implementation:** Phase 8 Plan 03 (2026-03-23) — INTG-06 test gap closure. 5,792 tests pass. Phase 8 Integration proceeding.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
