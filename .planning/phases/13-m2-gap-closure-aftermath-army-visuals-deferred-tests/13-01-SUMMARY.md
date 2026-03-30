---
phase: 13-m2-gap-closure-aftermath-army-visuals-deferred-tests
plan: "01"
subsystem: engine/battleAftermath
tags: [battle, sphere-pressure, aftermath, testing]
dependency_graph:
  requires: []
  provides: [aftermath-sphere-pressure, refugee-trace-stub]
  affects: [pendingSpherePressures, battleAftermath.ts]
tech_stack:
  added: []
  patterns: [SpherePressureEvent push, isValidSphereAffinity inline guard, enableTracing for trace tests]
key_files:
  created: []
  modified:
    - src/engine/battleAftermath.ts
    - src/engine/__tests__/battleAftermath.test.ts
decisions:
  - "AFTERMATH_FALLBACK_SPHERE = 'force' (lowercase, matching SphereName type)"
  - "isValidSphereAffinity inlined in battleAftermath.ts — not exported from phaseSpherePressure.ts"
  - "Field battles without settlementId silently skip sphere pressure (fail-soft)"
  - "REFUGEE_GENERATION constants renamed to *_DEFERRED with @deprecated JSDoc"
  - "enableTracing/disableTracing required in trace capture tests — emitTrace no-ops when disabled"
metrics:
  duration: 10
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_modified: 2
---

# Phase 13 Plan 01: Aftermath Sphere Pressure Injection and Refugee Trace Stub Summary

Aftermath sphere pressure injection and refugee trace stub in applyAftermath, closing the engine gap where battles had no impact on the cosmic sphere balance.

## What Was Built

### Task 1: Aftermath sphere pressure injection (ae05be1)

Modified `src/engine/battleAftermath.ts`:

- Added `SpherePressureEvent` and `SphereAffinity` imports
- Added three new constants: `AFTERMATH_BASE_PRESSURE = 2`, `AFTERMATH_PRESSURE_MULTIPLIERS` (minor 1.0 / major 1.5 / total 2.0), `AFTERMATH_FALLBACK_SPHERE = 'force'`
- Renamed `REFUGEE_GENERATION_MAJOR` and `REFUGEE_GENERATION_TOTAL` to `*_DEFERRED` variants with `@deprecated` JSDoc
- Added sphere pressure logic in `applyAftermath` after commander fate: looks up victor army's faction, reads `sphereAffinity.scores`, finds dominant sphere, pushes a `SpherePressureEvent` to `state.pendingSpherePressures`
- Fail-soft: field battles without `settlementId` skip the pressure push entirely
- Updated `emitTrace` call to include `spherePressureApplied` and `refugeeEncountersGenerated: 0`

### Task 2: Tests for sphere pressure and refugee trace stub (ab7b5d1)

Added 7 new tests to `src/engine/__tests__/battleAftermath.test.ts`:

**describe('aftermath sphere pressure'):**
1. Pushes SpherePressureEvent for victor faction dominant sphere on siege aftermath
2. Scales pressure magnitude by severity — major uses 1.5 multiplier
3. Scales pressure magnitude by severity — total uses 2.0 multiplier
4. Falls back to force sphere when faction has all-zero affinity
5. Skips sphere pressure for field battles without settlementId (fail-soft)
6. Stalemate emits no sphere pressure

**describe('refugee trace stub'):**
7. emitTrace includes refugeeEncountersGenerated: 0

All 26 tests pass (19 existing + 7 new).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] isValidSphereAffinity not exported**
- **Found during:** Task 1
- **Issue:** `isValidSphereAffinity` is a private function in `phaseSpherePressure.ts` and not exported
- **Fix:** Inlined the guard check directly in `applyAftermath` using explicit property existence check
- **Files modified:** `src/engine/battleAftermath.ts`
- **Commit:** ae05be1

**2. [Rule 1 - Bug] enableTracing required for trace capture tests**
- **Found during:** Task 2 — refugee trace test failed because emitTrace is a no-op when disabled
- **Fix:** Added `enableTracing()` in `beforeEach` and `disableTracing()` in `afterEach` for the refugee trace stub describe block
- **Files modified:** `src/engine/__tests__/battleAftermath.test.ts`
- **Commit:** ab7b5d1

## Verification

- `npx vitest run src/engine/__tests__/battleAftermath.test.ts` — 26/26 tests pass
- `npx tsc --noEmit` — no type errors
- `npx vite build` — production build succeeds
- `grep REFUGEE_GENERATION_MAJOR[^_] battleAftermath.ts` — returns 0 matches (old constant gone)

## Self-Check: PASSED

Files verified:
- FOUND: src/engine/battleAftermath.ts
- FOUND: src/engine/__tests__/battleAftermath.test.ts

Commits verified:
- ae05be1 — feat(13-01): aftermath sphere pressure injection and refugee trace stub
- ab7b5d1 — test(13-01): add sphere pressure and refugee trace stub tests for battleAftermath
