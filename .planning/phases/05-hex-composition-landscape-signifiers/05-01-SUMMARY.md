---
phase: 05-hex-composition-landscape-signifiers
plan: 01
subsystem: ui
tags: [three-js, typescript, composition-system, signifiers, prng, terrain, hex-map]

# Dependency graph
requires:
  - phase: 01-renderer-foundation
    provides: RenderLayers.ts with RENDER_ORDER.SIGNIFIERS=7 constant
  - phase: 02-world-generation
    provides: TerrainType union in src/types/index.ts (33 land types)
provides:
  - compositionTypes.ts: HexSlot, FootprintSize, ZoomTier, SuppressRule, HexVisualManifest, CompositionResult types
  - compositionResolver.ts: resolveHexComposition pure function (slot assignment + suppression)
  - signifierRegistry.ts: SIGNIFIER_REGISTRY (28 terrain types with placeholder SVG paths), TERRAIN_SIGNIFIER_FALLBACK (6 types), getSignifierParams (deterministic per-hex params)
affects:
  - 05-02-PLAN: SignifierMesh rendering pipeline consumes compositionTypes + signifierRegistry
  - 05-03-PLAN: SVG art production populates signifierRegistry with production paths
  - 05-04-PLAN: Further art production
  - 06-locations-agents: resolveHexComposition is Phase-6-ready; COMP-05 (agent RING) will add to same system

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD (red → green) for pure-function modules"
    - "Slot-based composition: priority sort → slot assignment → suppression evaluation"
    - "Per-hex seeded PRNG via mulberry32 with col*374761393 + row*668265263 + seed*1274126177 hash"
    - "Terrain type fallback map for registry mismatches (NFP #1 tunability)"

key-files:
  created:
    - src/components/HexMapV2/signifiers/compositionTypes.ts
    - src/components/HexMapV2/signifiers/compositionResolver.ts
    - src/components/HexMapV2/signifiers/signifierRegistry.ts
    - src/components/HexMapV2/signifiers/__tests__/compositionResolver.test.ts
    - src/components/HexMapV2/signifiers/__tests__/signifierRegistry.test.ts
  modified: []

key-decisions:
  - "28 direct registry entries + 6 fallback = all 33 land TerrainType values covered (farmland->grassland, jungle->tropical_forest, evergreen_forest->boreal_forest, arctic->snow_fields, great_home_trees->dense_forest, oasis->savanna)"
  - "LART-22 hardened_clay absorbed into badlands (variants 3-4); LART-28 lava absorbed into volcano (variants 3-4) — no separate TerrainType exists for these"
  - "SIGNIFIER_JITTER_RANGE and SIGNIFIER_ROTATION_RANGE as named constants for tunability (NFP #1)"
  - "Placeholder SVG paths are simple geometric shapes — Plans 03+04 will replace with production hand-drawn art"
  - "resolveHexComposition is Phase-6-ready: unknown entityTypes pass through without error (NFP #4)"

patterns-established:
  - "Signifier registry keys use actual TerrainType names (not LART names)"
  - "LART name mismatches documented inline: light_forest=LART-05 woodland, desert=LART-19 sand_desert, volcano=LART-27+LART-28"
  - "Per-hex PRNG seed: (col * 374761393 + row * 668265263 + worldSeed * 1274126177) | 0 — same formula as existing volcanic placement"

requirements-completed: [COMP-01, COMP-02, COMP-03, COMP-04, LSIG-02, LSIG-03, LSIG-05]

# Metrics
duration: 6min
completed: 2026-03-22
---

# Phase 05 Plan 01: Hex Composition System and Signifier Registry Summary

**Slot-based composition resolver (priority → slot → suppression) and signifier registry covering all 33 land TerrainType values via 28 direct entries + 6 fallbacks, with deterministic per-hex PRNG params**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-22T12:29:40Z
- **Completed:** 2026-03-22T12:35:15Z
- **Tasks:** 2
- **Files modified:** 5 (5 created, 0 modified)

## Accomplishments

- Built `resolveHexComposition` pure function: sorts entities by priority, assigns preferred/fallback slots, evaluates suppression rules (`always`/`same-slot`/`footprint-overlap`)
- Built `SIGNIFIER_REGISTRY` with placeholder SVG paths for all 28 terrain types (correct variant counts per REQUIREMENTS.md LART IDs); badlands has 5 variants (LART-23 + LART-22 hardened_clay), volcano has 5 (LART-27 + LART-28 lava)
- Built `getSignifierParams` with deterministic mulberry32-based per-hex params: variantIndex, jitterX/Y (±10%), rotation (±15°)
- 17 unit tests pass: 7 for composition resolver, 10 for signifier registry

## Task Commits

Each task was committed atomically:

1. **Task 1: Composition types and resolver with tests** - `7fc0c47` (feat)
2. **Task 2: Signifier registry with terrain type reconciliation and seeded params** - `e62bd80` (feat)

## Files Created/Modified

- `src/components/HexMapV2/signifiers/compositionTypes.ts` — HexSlot, FootprintSize, ZoomTier, SuppressRule, HexVisualManifest, CompositionResult types
- `src/components/HexMapV2/signifiers/compositionResolver.ts` — resolveHexComposition pure function
- `src/components/HexMapV2/signifiers/signifierRegistry.ts` — SIGNIFIER_REGISTRY, TERRAIN_SIGNIFIER_FALLBACK, getSignifierParams, tunable constants
- `src/components/HexMapV2/signifiers/__tests__/compositionResolver.test.ts` — 7 tests
- `src/components/HexMapV2/signifiers/__tests__/signifierRegistry.test.ts` — 10 tests

## Decisions Made

- **Terrain type reconciliation:** 28 direct registry entries + 6 TERRAIN_SIGNIFIER_FALLBACK entries cover all 33 land TerrainType values. Six types (farmland, jungle, evergreen_forest, arctic, great_home_trees, oasis) have no LART requirement, so they fall back to closest visual cousin.
- **LART absorption:** LART-22 hardened_clay (no TerrainType) becomes badlands variants 3-4. LART-28 lava (no TerrainType) becomes volcano variants 3-4. This gives both 5 total variants as specified.
- **Placeholder art:** All `d` strings contain valid SVG path data (simple geometric shapes) satisfying the 0.2–0.7 opacity constraint. Plans 03–04 will replace with production hand-drawn art.
- **Phase-6-ready resolver:** `footprint-overlap` suppression rule is structurally present but falls back to same-slot logic; Phase 6 will add geometric footprint comparison when agents/locations are introduced.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 02 (SignifierMesh rendering pipeline) can now import `compositionTypes`, `compositionResolver`, and `signifierRegistry` directly
- Plans 03 and 04 (SVG art production) will replace placeholder `d` strings in `signifierRegistry.ts` with production hand-drawn paths
- The `resolveHexComposition` API is stable — Phase 6 locations/agents will add new HexVisualManifest entries without changing the resolver

---
*Phase: 05-hex-composition-landscape-signifiers*
*Completed: 2026-03-22*

## Self-Check: PASSED

- compositionTypes.ts: FOUND
- compositionResolver.ts: FOUND
- signifierRegistry.ts: FOUND
- 05-01-SUMMARY.md: FOUND
- Commit 7fc0c47 (Task 1): FOUND
- Commit e62bd80 (Task 2): FOUND
