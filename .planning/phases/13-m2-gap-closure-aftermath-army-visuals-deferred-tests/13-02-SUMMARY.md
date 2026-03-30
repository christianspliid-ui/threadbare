---
phase: 13-m2-gap-closure-aftermath-army-visuals-deferred-tests
plan: "02"
subsystem: testing
tags: [battle, thread, spotlight, vitest, engine]

# Dependency graph
requires:
  - phase: 12-flesh-reach-migration-to-quintessence
    provides: graph edge types including 'thread' and 'commanded_by'
provides:
  - battleSpotlights.ts with hasThreadToBattle and selectSpotlight
  - 7 passing battle thread visibility tests (previously .todo)
affects: [battle-resolution, spotlight-encounters, thread-visibility]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WorldGraph class used directly in tests (not a hand-rolled mock interface)"
    - "mulberry32 PRNG helper in test file mirrors production algorithm for determinism testing"

key-files:
  created:
    - src/engine/battleSpotlights.ts
    - src/engine/__tests__/battleThreadVisibility.test.ts
  modified: []

key-decisions:
  - "WorldGraph class (src/engine/graph.ts) used as parameter type — matches existing engine import pattern from essenceIncome.ts"
  - "SPOTLIGHT_TEMPLATES pool starts with 3 templates (duel, heroic_stand, wall_breach) — content expansion deferred to future phases"
  - "Tests use WorldGraph directly for graph setup rather than a hand-rolled mock, providing accurate edge traversal behavior"

patterns-established:
  - "hasThreadToBattle pattern: traverse thread edges from ascendant, check Set intersection with participant IDs + commander IDs"
  - "selectSpotlight pattern: gate on hasThreadToBattle, filter by battleType/momentum/history, seeded index selection"

requirements-completed: [GAP-03, GAP-04]

# Metrics
duration: 2min
completed: 2026-03-30
---

# Phase 13 Plan 02: Battle Thread Visibility and Spotlight Selection Summary

**hasThreadToBattle and selectSpotlight implemented in battleSpotlights.ts, closing all 7 deferred .todo tests with deterministic PRNG-based spotlight selection gated on thread-of-fate connections**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-30T10:11:25Z
- **Completed:** 2026-03-30T10:12:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `src/engine/battleSpotlights.ts` with `hasThreadToBattle` and `selectSpotlight` functions
- `hasThreadToBattle` traverses `thread` edges from ascendant to find mortals, checks against both army nodes and their commanders via `commanded_by` edges
- `selectSpotlight` deterministically picks from eligible template pool using seeded PRNG (filters by battleType, momentum threshold, and spotlightHistory)
- Converted all 7 `.todo` test stubs to passing real tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create battleSpotlights.ts** - `dbd8f2d` (feat)
2. **Task 2: Convert 7 .todo tests to real tests** - `5fea8e2` (feat)

## Files Created/Modified
- `src/engine/battleSpotlights.ts` - hasThreadToBattle, selectSpotlight, SPOTLIGHT_TEMPLATES
- `src/engine/__tests__/battleThreadVisibility.test.ts` - 7 passing tests (was 7 .todo stubs)

## Decisions Made
- `WorldGraph` (the class from `src/engine/graph.ts`) used as the parameter type instead of an interface, matching the pattern established in `essenceIncome.ts`
- Tests use `WorldGraph` directly rather than a mock — gives accurate edge traversal behavior at low cost
- `mulberry32` PRNG helper duplicated in test file to match production algorithm for determinism testing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `battleSpotlights.ts` is ready to be wired into the battle orchestration phase for spotlight gating
- `SPOTLIGHT_TEMPLATES` pool can be expanded with additional templates in future phases
- Thread visibility check is now stable and tested — safe to depend on from battle tick logic

---
*Phase: 13-m2-gap-closure-aftermath-army-visuals-deferred-tests*
*Completed: 2026-03-30*
