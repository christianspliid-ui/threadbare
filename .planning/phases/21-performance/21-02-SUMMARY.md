---
phase: 21-performance
plan: 02
subsystem: engine
tags: [encounter-cache, documentation, constants, cms-tunable]

# Dependency graph
requires:
  - phase: 21-performance-plan-01
    provides: seeded RNG + tick-local IDs (unrelated, same phase)
provides:
  - CACHE_REBUILD_THRESHOLD documented as design placeholder with rationale
  - Redundant import cleaned from encounterCache.ts
  - CMS tunable description updated to prevent developer confusion
affects: [encounterCache, agent-behavior-constants, cms-tunable]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Design-placeholder constants documented with explicit 'not yet wired' comment and reserved-for use case"

key-files:
  created: []
  modified:
    - src/data/agent-behavior-constants.ts
    - src/engine/encounterCache.ts
    - src/components/CMS/tunableConstants.ts

key-decisions:
  - "CACHE_REBUILD_THRESHOLD is a design placeholder — EncounterCacheManager never compares a dirty count against it; all rebuilds are per-location incremental"
  - "Removed the unused local import of CACHE_REBUILD_THRESHOLD from encounterCache.ts (re-export kept for consumers)"
  - "PERF-02 resolved as documentation-only: the conditional dirty-count logic does not yet exist, so profiling was not applicable"

patterns-established:
  - "When a constant is CMS-tunable but not wired to any logic, document it explicitly as a design placeholder rather than leaving the comment misleading"

requirements-completed: [PERF-02]

# Metrics
duration: 10min
completed: 2026-03-31
---

# Phase 21 Plan 02: CACHE_REBUILD_THRESHOLD Profiling Summary

**CACHE_REBUILD_THRESHOLD documented as a design placeholder — confirmed unused in conditional logic, redundant import removed from encounterCache.ts, CMS description updated**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-31T09:38:00Z
- **Completed:** 2026-03-31T09:48:44Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Confirmed via full-codebase grep that `CACHE_REBUILD_THRESHOLD` is never used in any conditional comparison anywhere in `src/` — it is exported and CMS-tunable but has no wiring to rebuild logic
- Updated the JSDoc comment on `CACHE_REBUILD_THRESHOLD` to document its design-placeholder status, the intended future use case (crossover point for dirty-count vs full-rebuild strategy), and an inline profiling note explaining why timing analysis was not applicable
- Removed the redundant local `import { CACHE_REBUILD_THRESHOLD }` from `encounterCache.ts` (the re-export block was kept for consumers; the local import was unused since the constant never appears in any class method or function body)
- Updated the CMS tunable description to append "(design placeholder — not yet wired to rebuild logic)" so developers opening the CMS panel are not misled into thinking changing the value has an effect

## Task Commits

Each task was committed atomically:

1. **Task 1: Investigate threshold usage, profile, and document rationale** - `d58347d` (docs)

**Plan metadata:** (see final commit)

## Files Created/Modified

- `src/data/agent-behavior-constants.ts` - Updated JSDoc on `CACHE_REBUILD_THRESHOLD` (lines 478-480) to 15-line design-placeholder comment with profiling rationale
- `src/engine/encounterCache.ts` - Removed unused local import of `CACHE_REBUILD_THRESHOLD` from the import block (re-export block unchanged)
- `src/components/CMS/tunableConstants.ts` - Updated description string and wiring label to note placeholder status

## Decisions Made

- PERF-02 resolved as documentation-only: profiling was not applicable because `EncounterCacheManager` rebuilds per-location (via `onLocationCreated`/`onLocationTypeChanged`) and maintains no global dirty count. Changing the threshold via CMS has zero behavioral effect in the current implementation.
- Redundant import removal applied under Rule 1 (auto-fix bug: unused import in the same file that re-exports the same symbol).
- The re-export in `encounterCache.ts` was kept because external consumers may import `CACHE_REBUILD_THRESHOLD` from `encounterCache` as part of the stable public API surface.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused local import of CACHE_REBUILD_THRESHOLD in encounterCache.ts**
- **Found during:** Task 1 (investigation of threshold usage)
- **Issue:** `encounterCache.ts` had both `export { CACHE_REBUILD_THRESHOLD }` and `import { CACHE_REBUILD_THRESHOLD }` at module scope, but the constant was never referenced inside any function or method body — the import was dead code
- **Fix:** Removed `CACHE_REBUILD_THRESHOLD` from the `import` block; the `export` block was left intact to preserve the public re-export surface
- **Files modified:** `src/engine/encounterCache.ts`
- **Verification:** `npx tsc --noEmit` passes; `encounterCache.test.ts` and `encounterScoring.test.ts` pass (69 tests)
- **Committed in:** `d58347d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - unused import removal)
**Impact on plan:** Necessary correctness fix. No scope creep. The plan itself anticipated finding the unused import (Plan Step 2 explicitly asked to clean up redundant import/export if present).

## Issues Encountered

- Pre-existing test failures in `traceBuffer-orchestrator.test.ts`, `visibility-integration.test.ts`, `encounter-liveness.contract.test.ts`, and `mutation-observability.contract.test.ts` were present before this plan's changes (confirmed by git status showing those test files as already modified by prior work). Not in scope for this plan.
- The encounterCache and encounterScoring tests (directly related to changed files) pass cleanly: 69/69.

## Next Phase Readiness

- PERF-02 complete. The constant is documented and a developer tuning encounter cache behavior now has the full context they need.
- Future work: when `EncounterCacheManager` gains a dirty-count accumulation strategy, the developer should wire the threshold comparison and remove the "design placeholder" notes.
- Plans 21-03 (PERF-03 code-splitting) can proceed independently.

---
*Phase: 21-performance*
*Completed: 2026-03-31*

## Self-Check: PASSED

- `src/data/agent-behavior-constants.ts` — FOUND
- `src/engine/encounterCache.ts` — FOUND
- `src/components/CMS/tunableConstants.ts` — FOUND
- `.planning/phases/21-performance/21-02-SUMMARY.md` — FOUND
- Commit `d58347d` — FOUND
