---
phase: 08-integration
plan: "02"
subsystem: worldgen + v1-cleanup
tags: [integration, v1-deletion, fantasy-overlay, worldgen, documentation]
dependency_graph:
  requires: [08-01]
  provides: [v1-hexmap-deleted, fantasy-overlay-pass, wgen-14]
  affects: [App.tsx, generateWorld, hexGrid, CLAUDE.md, ui-patterns.md, changelog.md, project-status.md]
tech_stack:
  added: []
  patterns: [tdd-red-green, sphere-biome-overlay, fail-soft-null-guard]
key_files:
  created:
    - src/engine/worldgen/passes/pass10-fantasyOverlay.ts
    - src/engine/worldgen/__tests__/fantasyOverlay.test.ts
  modified:
    - src/engine/worldgen/constants.ts
    - src/engine/hexGrid.ts
    - src/App.tsx
    - src/components/Game/__tests__/GameView-interaction.test.tsx
    - src/components/Game/__tests__/GameView-debug.test.tsx
    - src/components/Game/__tests__/GameView-progressive.test.tsx
    - CLAUDE.md
    - Docs/ui-patterns.md
    - Docs/changelog.md
    - Docs/project-status.md
  deleted:
    - src/components/HexMap/ (entire directory — 11 components + 10 tests = 21 files)
decisions:
  - "PASS_SEED_FANTASY=70109 (next prime after PASS_SEED_VALIDATION=70099) — maintains independent PRNG stream per pass"
  - "OVERLAY_CHANCE=0.12 noise floor threshold — 12% of hexes are eligible for overlay transformation; most hexes unaffected"
  - "woodland is not a valid TerrainType — replaced with light_forest in both overlay rules and tests"
  - "GameView tests required HexMapV2 mock (vi.mock) to prevent canvas init failure in jsdom environment"
  - "OverlayMode type and overlayMode state removed from App.tsx — HexMapV2 does not accept this prop"
metrics:
  duration: "~9 minutes"
  completed: "2026-03-22"
  tasks_completed: 2
  files_modified: 11
  files_deleted: 21
  files_created: 2
requirements: [INTG-06, WGEN-14]
---

# Phase 8 Plan 02: V1 Deletion, Fantasy Overlay, and Documentation Cleanup Summary

TDD-implemented sphere-driven biome overlay pass (WGEN-14) + complete deletion of 21 V1 SVG hex map files + App.tsx worldgen screen migrated to HexMapV2 + all project documentation cleaned of V1 references.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | WGEN-14 fantasy overlay + V1 deletion + App.tsx update | 393e801 | 29 files (11 components deleted, 10 tests deleted, 6 new/modified) |
| 2 | Documentation cleanup — remove V1 references from all docs | 43bd6dc | CLAUDE.md, Docs/ui-patterns.md, Docs/changelog.md, Docs/project-status.md |

## What Was Built

**Task 1 — Fantasy overlay pass + V1 deletion:**

- `pass10-fantasyOverlay.ts`: `runFantasyOverlayPass()` iterates terrain array using fractalNoise with `PASS_SEED_FANTASY` offset. Eleven `OVERLAY_RULES` map sphere-to-terrain transforms (entropy→dead_forest, life→tropical_forest, energy→volcano, force→mountains). `FANTASY_OVERLAY_CONSTANTS` exports SPHERE_THRESHOLD=0.65, OVERLAY_CHANCE=0.12, NOISE_SCALE=0.08.
- `fantasyOverlay.test.ts`: 8 TDD tests covering high-entropy transform (temperate_forest→dead_forest), high-life transform (light_forest→tropical_forest), balanced no-op, null no-op, undefined no-op, and two determinism checks.
- `constants.ts`: Added `PASS_SEED_FANTASY=70109` (prime after PASS_SEED_VALIDATION=70099).
- `hexGrid.ts`: Renamed `_cosmology` to `cosmology`; wired `runFantasyOverlayPass()` between `pipeline.run()` and `toHexTilesFromContext()`.
- Deleted `src/components/HexMap/` entirely (22 files across components and tests).
- `App.tsx`: Replaced `HexMap` import with `HexMapV2` default import; removed `OverlayMode` type import and `overlayMode` state; replaced `<HexMap>` in worldgen screen with `<HexMapV2>` (no `overlayMode` prop).
- GameView test files: Added `vi.mock('../../HexMapV2/HexMapV2')` to all 3 test files to prevent canvas initialization errors in jsdom.

**Task 2 — Documentation cleanup:**

- `CLAUDE.md`: Updated `?view=game` row description, removed V1 freeze note, updated Rejected Approaches entry to 'deleted in Phase 8', updated Project Status section.
- `Docs/ui-patterns.md`: Removed "V1 SVG hex map is frozen" note from Section 9.
- `Docs/changelog.md`: Prepended Phase 8 Plan 02 entry.
- `Docs/project-status.md`: Reflected Phase 8 Integration as complete; updated recent completions.

## Verification

- `src/components/HexMap/` directory does NOT exist
- `grep -r "components/HexMap" src/` returns only HexMapV2 matches (no V1 dead imports)
- `npx tsc --noEmit` exits with 0 errors
- `npm test -- --run src/engine/worldgen/__tests__/fantasyOverlay.test.ts` passes (8/8 tests)
- `npm test -- --run src/components/Game/__tests__/` passes (13/13 GameView tests)
- `grep -c "V1 SVG.*stopped|V1 hex map.*stopped|old SVG hex map|hex map is frozen" CLAUDE.md STYLE.md Docs/ui-patterns.md` returns zero matches

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing validation] `woodland` is not a valid TerrainType**
- **Found during:** Writing overlay rules and test in Task 1
- **Issue:** The plan's overlay rules and test specified `woodland` as a terrain type, but TerrainType does not include it
- **Fix:** Used `light_forest` (semantically equivalent available terrain) in both the overlay rules and the test
- **Files modified:** src/engine/worldgen/passes/pass10-fantasyOverlay.ts, src/engine/worldgen/__tests__/fantasyOverlay.test.ts

**2. [Rule 1 - Bug] `OverlayMode` import was unused after HexMap removal**
- **Found during:** Updating App.tsx in Task 1
- **Issue:** App.tsx imported OverlayMode from types and had `overlayMode` state — both unused after switching to HexMapV2
- **Fix:** Removed OverlayMode import and overlayMode state from App.tsx
- **Files modified:** src/App.tsx

## Self-Check: PASSED

Files confirmed to exist:
- src/engine/worldgen/passes/pass10-fantasyOverlay.ts
- src/engine/worldgen/__tests__/fantasyOverlay.test.ts

Files confirmed to NOT exist:
- src/components/HexMap/ (directory deleted)

Commits confirmed:
- 393e801 — feat(08-02): V1 HexMap deleted, WGEN-14 fantasy overlay, App.tsx updated
- 43bd6dc — docs(08-02): remove all V1 SVG hex map references from project docs
