# Project Status

> Updated 2026-03-22. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Phase 8 Integration complete.** The Hex Map V2 milestone (8 phases) is finished. HexMapV2 (Three.js InstancedMesh) is the sole hex renderer. The V1 SVG hex map has been deleted.

**Recent completions:**
- ✅ High mountain ridgeline fix (2026-03-23) — Ridge overlay switched from additive to max()-blend, RIDGE_PEAK_ELEVATION 0.90→0.97. high_mountains now form narrow linear peak lines along mountain range spines instead of wide blobs.
- ✅ Configurable map size (2026-03-23) — MAP_SIZE_PRESETS (small 20x15, medium 32x24, large 48x36, epic 64x48). "Realm Size" picker on worldgen screen. Default increased 20x15→32x24 for region/kingdom development. 5,796 tests pass.
- ✅ Phase 8 Plan 04: INTG-06 gap closure — final 10 test failures fixed (2026-03-23) — TRAIL_HISTORY_TICKS constant mismatch, traceBuffer range assertion, content-layer1 timeouts, familiarity test setup, MandateTracker pip regression, CoastlineMesh debug artifacts. 5,793 tests pass. npm test exits 0.
- ✅ Phase 8 Plan 03: INTG-06 test gap closure (2026-03-23) — 14 test failures fixed: canvas mock, ElevationTicks rewrite (Mesh/plateau/quad geometry), terrainPalette count 30→32, coastline shallowWidth 0.19→0.28, stale V1 MovementTrails test deleted.
- ✅ Phase 8 Plan 02: V1 SVG hex map deleted, WGEN-14 fantasy overlay pass (2026-03-22).
- ✅ Phase 8 Plan 01: HexMapV2 integration into GameView (2026-03-22).

**Latest implementation:** Phase 8 Plan 04 (2026-03-23) — INTG-06 fully resolved. All 5,793 tests pass. Phase 8 Integration COMPLETE.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
