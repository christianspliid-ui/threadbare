---
phase: 12-conflict-destruction
plan: "06"
subsystem: engine
tags: [battle, aftermath, destruction, refugees, sphere-pressure, power-vacuum, seeded-prng]

# Dependency graph
requires:
  - phase: 12-conflict-destruction/12-04
    provides: battle resolution + spotlight system
  - phase: 12-conflict-destruction/12-05
    provides: siege resolution system
provides:
  - Destruction severity calculation (minor/major/total) from momentum + quintessence
  - Aftermath consequences applied on battle/siege resolution
  - Refugee generation at neighboring settlements after major/total defeats
  - Sphere pressure applied to defeated settlement at 1x/2x/3x by severity
  - Power vacuum — controls edges removed after total destruction
  - Commander fate: retreat/capture/kill by seeded PRNG + severity
  - army.aftermath.refugees encounter template (Heart + Gold 2-step)
affects: [12-conflict-destruction, 13-aftermath-display, sphere-pipeline, encounter-system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sphere pressure injected into state.pendingSpherePressures for consumption by phaseSpherePressure
    - Refugee counter stored as pendingRefugeeCount on settlement node (lightweight, no new node type)
    - Power vacuum via edge removal (controls/controlled_by) — no new state field
    - generateRefugeeEncounters is a pure side-effect function that returns generated IDs

key-files:
  created: []
  modified:
    - src/engine/battleAftermath.ts
    - src/engine/__tests__/battleAftermath.test.ts
    - src/data/army-encounter-content.ts

key-decisions:
  - "Refugee count stored as pendingRefugeeCount on settlement node property — no new graph node type required"
  - "Sphere pressure added to state.pendingSpherePressures via mutation (same pattern as phaseControlEffects)"
  - "Power vacuum only applied on total destruction (attacker victory) — major does not vacate control"
  - "army.aftermath.refugees uses 'aftermath' category in ArmyEncounterMeta — new category added to type"
  - "Battle hex found via victor army's located_at edge; falls back to settlement's located_at for siege aftermath"

patterns-established:
  - "Aftermath side-effects (refugees, sphere, vacuum) modeled as helper functions called from applyAftermath"
  - "Sphere pressure from battle aftermath uses source 'environmental' to distinguish from divine actions"

requirements-completed: [TB-073]

# Metrics
duration: 15min
completed: 2026-03-29
---

# Phase 12 Plan 06: Destruction and Aftermath Consequences Summary

**Scaled aftermath system: minor/major/total destruction with trade disruption, sublocation removal, refugee waves, sphere pressure, power vacuum, and seeded commander fate**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-29T22:50:00Z
- **Completed:** 2026-03-29T21:03:19Z
- **Tasks:** 6 (Tasks 1-4 extended existing impl, Task 5 tests, Task 6 verification)
- **Files modified:** 3

## Accomplishments

- Extended `battleAftermath.ts` with refugee generation, sphere pressure injection, and power vacuum logic — the three features missing from the initial M2-06 implementation
- Added `army.aftermath.refugees` encounter template (Heart to welcome + Gold to resettle, 2-step) to `army-encounter-content.ts`
- Added 16 new tests: 4 for `generateRefugeeEncounters`, 2 for power vacuum, 3 for refugee integration in `applyAftermath`, 2 for sphere pressure — all passing (30 total in suite)

## Task Commits

1. **Tasks 1-4: Aftermath extensions + refugee template** - `f725841` (feat)
2. **Task 5: Tests** - `01cef49` (test)

## Files Created/Modified

- `src/engine/battleAftermath.ts` — Added `generateRefugeeEncounters()`, `buildSpherePressureEvents()`, `applyPowerVacuum()`, sphere pressure constants, wired into `applyAftermath()`
- `src/engine/__tests__/battleAftermath.test.ts` — Added 16 new tests for refugees, sphere pressure, power vacuum
- `src/data/army-encounter-content.ts` — Added `REFUGEE_AFTERMATH_TEMPLATE` (army.aftermath.refugees), extended `ArmyEncounterMeta` category type with 'aftermath'

## Decisions Made

- Refugee count stored as `pendingRefugeeCount` property on the settlement node rather than creating new graph nodes — lightweight, no new node type, readable in debug panel
- Sphere pressure uses existing `state.pendingSpherePressures` pipeline (same as `phaseControlEffects`) with source `'environmental'` to distinguish from divine actions
- Power vacuum only triggers on `total` destruction + `attacker_victory` — major defeat leaves factional control intact
- Battle hex resolved via victor army's `located_at` edge, with fallback to settlement's `located_at` for siege aftermath

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Implemented features absent from initial M2-06 commit**
- **Found during:** Task 1 (aftermath engine review)
- **Issue:** The M2-06 commit (on this branch) implemented severity calculation, commander fate, sublocation/prosperity/trade effects, but omitted refugees, sphere pressure, and power vacuum entirely
- **Fix:** Implemented all three missing features as plan specified; added constants SPHERE_PRESSURE_MINOR/MAJOR/TOTAL_MULTIPLIER, AFTERMATH_BASE_SPHERE_PRESSURE; wired into applyAftermath()
- **Files modified:** src/engine/battleAftermath.ts, src/data/army-encounter-content.ts
- **Verification:** 30/30 tests pass, full test suite 7023/7023 pass, vite build succeeds
- **Committed in:** f725841

---

**Total deviations:** 1 auto-fixed (missing critical functionality from prior partial implementation)
**Impact on plan:** All three features were must-haves per plan truths. No scope creep.

## Issues Encountered

The `battleAftermath.ts` file already existed from an earlier milestone commit (9e3f82a / M2-06) but was missing refugees, sphere pressure, and power vacuum — the plan's must_haves included these but they weren't implemented. Extended rather than rewrote.

## Next Phase Readiness

- All plan 06 must_haves satisfied: DestructionSeverity, severity calculation, all three severity tiers implemented, commander fate, refugees, sphere pressure, power vacuum, DestructionTrace emitted
- `generateRefugeeEncounters` exported as required by plan artifacts
- Ready for plan 07 (if one exists) or phase completion

## Self-Check: PASSED

All files found:
- FOUND: src/engine/battleAftermath.ts
- FOUND: src/engine/__tests__/battleAftermath.test.ts
- FOUND: src/data/army-encounter-content.ts

All commits found:
- FOUND: f725841 (feat - aftermath extensions)
- FOUND: 01cef49 (test - new tests)

---
*Phase: 12-conflict-destruction*
*Completed: 2026-03-29*
