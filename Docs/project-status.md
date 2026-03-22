# Project Status

> Updated 2026-03-22. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Phase 8 Integration complete.** The Hex Map V2 milestone (8 phases) is finished. HexMapV2 (Three.js InstancedMesh) is the sole hex renderer. The V1 SVG hex map has been deleted.

**Recent completions:**
- ✅ Phase 8 Plan 02: V1 SVG hex map deleted, WGEN-14 fantasy overlay pass (2026-03-22) — 22 V1 files deleted, sphere-driven biome transformation pass implemented with 8 TDD tests, App.tsx worldgen screen updated to HexMapV2, all documentation cleaned up. Requirements INTG-06 + WGEN-14 complete.
- ✅ Phase 8 Plan 01: HexMapV2 integration into GameView (2026-03-22) — Three.js renderer replaces SVG HexMap in `?view=game`; WorldGenResult data threaded through; graph-to-AgentRenderData + LocationNode adapters; fog toggle wired. Requirements INTG-01..05 complete.
- ✅ Phase 07.1 Plan 01: Stencil coastline clipping (2026-03-22) — GPU stencil-buffer clips coastal land hexes to organic shoreline; land/water InstancedMesh split; fog routing via globalToMeshMap. Requirement WATR-01 complete.
- ✅ Phase 7 Plan 01: Fog & Zoom pure logic modules (2026-03-22) — ZoomVisibilityMatrix (16-layer visibility matrix, 4 zoom tiers, fade alpha) + FogCulling (color override, layer gating, BFS visibility). 83 tests.
- ✅ Phase 6 complete: Agent rendering, animation, location icons, all wired to HexMapV2.

**Latest implementation:** Phase 8 Plan 02 (2026-03-22) — V1 HexMap/ directory deleted; pass10-fantasyOverlay wired into generateWorld(); WGEN-14 fantasy overlay transforms sphere-high biomes to magical variants.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
