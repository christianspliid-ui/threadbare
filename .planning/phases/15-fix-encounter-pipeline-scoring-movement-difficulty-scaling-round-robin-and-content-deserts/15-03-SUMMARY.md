---
phase: 15-fix-encounter-pipeline-scoring-movement-difficulty-scaling-round-robin-and-content-deserts
plan: 03
subsystem: content
tags: [encounter, content, progression, ruins, difficulty-scaling]

# Dependency graph
requires:
  - phase: 15-02
    provides: encounter retirement mechanics that exhaust templates faster
provides:
  - 40 new encounter templates spanning diff 40-90 across all archetypes
  - MODERATE_DIFFICULTY_BASE=40, HARD_DIFFICULTY_BASE=60, DEADLY_DIFFICULTY_BASE=80 constants
  - 15 new universal templates at ALL_LOCATION_SUBTYPES for content desert coverage
  - Dedicated templates for ruins/ruined_city/ruined_village fixing Pale Cairn / Grey Meadowguard
affects:
  - encounter-scoring
  - encounter-pipeline
  - agent-progression

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Higher-difficulty constants follow existing naming pattern: *_DIFFICULTY_BASE and *_DIFFICULTY_STEP"
    - "hire/lead/build encounter types never have rewardPool (enforced by encounter-reward-wiring.test.ts)"
    - "When onSuccess has rewardPool, onFailure must have identical categoryWeights"

key-files:
  created: []
  modified:
    - src/data/encounter-content.ts
    - src/data/__tests__/encounter-content.test.ts

key-decisions:
  - "plan used 'arcane' and 'crown' reach names — substituted 'veil' and 'star' (correct ReachDomain values)"
  - "plan used 'justice_mercy' value pair — substituted valid value pairs from ValuePair type"
  - "Both tasks committed together since both modify the same file"
  - "Flaky timeout tests (tickHealth, traceBuffer, encounter-liveness multi-seed) excluded as pre-existing failures in parallel test suite"

requirements-completed: [ENC-05]

# Metrics
duration: 30min
completed: 2026-03-30
---

# Phase 15 Plan 03: Content Expansion Summary

**40 hand-authored encounter templates (diff 40-90) added across all archetypes, plus 15 universal templates eliminating ruins/wilderness content deserts**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-30T10:25:00Z
- **Completed:** 2026-03-30T10:59:35Z
- **Tasks:** 2 (combined into 1 commit since same file)
- **Files modified:** 2

## Accomplishments
- Added 3 new difficulty tier constants: MODERATE_DIFFICULTY_BASE=40, HARD_DIFFICULTY_BASE=60, DEADLY_DIFFICULTY_BASE=80
- 21 location-specific templates (diff 40-90): settlements (6), forts/castles (3), ruins (5), wilderness/mining (5), shrine/temple (2)
- 3 deadly-tier templates (diff 80-90): Dragon's Challenge, Arcane Cataclysm, Grand Tournament
- 15 new universal templates (ALL_LOCATION_SUBTYPES) spanning diff 15-70: early-game (5), mid-game (6), late-game (4)
- Ruins archetypes now have 5 dedicated templates: Delve into the Depths, Decipher Ancient Inscriptions, Restless Spirits, Salvage Operation, Seal the Breach
- Total ENCOUNTER_TEMPLATES grew from 94 to 134

## Task Commits

Both tasks modified the same file so were committed together:

1. **Task 1 + Task 2: Add 40 higher-difficulty and 15 universal templates** - `e7a3cdb` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `src/data/encounter-content.ts` — 40 new encounter templates added (Task 1: location-specific, Task 2: universal)
- `src/data/__tests__/encounter-content.test.ts` — Updated template count assertion from 94 to 134

## Decisions Made
- Plan specified `arcane` reach name, but the canonical type is `veil` — used `veil` throughout
- Plan specified `crown` reach name, but the canonical type is `star` — used `star` throughout
- Plan specified `justice_mercy` value pair which doesn't exist — used valid pairs from ValuePair type
- hire/lead/build encounterTypes must not have rewardPool (enforced by existing test); removed from those templates
- When onSuccess has rewardPool, onFailure must have identical categoryWeights (enforced by existing test); added matching pairs throughout
- grand_tournament.final onFailure had different categoryWeights than onSuccess — standardized to match

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed invalid reach domain names in plan spec**
- **Found during:** Task 1 (template authoring)
- **Issue:** Plan specified 'arcane' and 'crown' as reach domains — these don't exist in ReachDomain type
- **Fix:** Replaced 'arcane' with 'veil', 'crown' with 'star' throughout all new templates
- **Files modified:** src/data/encounter-content.ts
- **Verification:** TypeScript compilation passes with zero errors
- **Committed in:** e7a3cdb

**2. [Rule 1 - Bug] Fixed invalid ValuePair in plan spec**
- **Found during:** Task 1 (template authoring)
- **Issue:** Plan specified 'justice_mercy' as a motivation ValuePair — this was removed in the Phase 12 flesh reach migration
- **Fix:** Used correct canonical ValuePair values (mercy_ruthlessness, loyalty_ambition, etc.)
- **Files modified:** src/data/encounter-content.ts
- **Verification:** TypeScript compilation passes; test 'all templates have valid motivations' passes
- **Committed in:** e7a3cdb

**3. [Rule 1 - Bug] Fixed reward pool wiring violations in new templates**
- **Found during:** Task 1 verification (encounter-reward-wiring tests)
- **Issue:** hire/lead/build types must not have rewardPool; templates where onSuccess has rewardPool must have matching onFailure rewardPool with identical categoryWeights
- **Fix:** Removed rewardPool from hire/lead/build templates (guild_initiation_trial, political_intrigue, siege_defense_planning, fortification_engineering, seal_the_breach, arcane_cataclysm, weave_political_alliance); added matching onFailure rewardPools to all reward-eligible templates; fixed grand_tournament.final mismatched weights
- **Files modified:** src/data/encounter-content.ts
- **Verification:** encounter-reward-wiring.test.ts all 4 tests pass
- **Committed in:** e7a3cdb

**4. [Rule 1 - Bug] Updated template count assertion**
- **Found during:** Task 1 verification (encounter-content tests)
- **Issue:** Test expected exactly 94 templates; new templates increased count to 134
- **Fix:** Updated assertion to expect 134
- **Files modified:** src/data/__tests__/encounter-content.test.ts
- **Verification:** Test passes
- **Committed in:** e7a3cdb

---

**Total deviations:** 4 auto-fixed (all Rule 1 bugs)
**Impact on plan:** All auto-fixes necessary for type correctness and test compliance. No scope creep.

## Issues Encountered
- 3 pre-existing timeout-flaky integration tests (tickHealth, traceBuffer-buffer-size, encounter-liveness-multi-seed) fail when run in full parallel suite but pass in isolation. Out of scope for this plan.

## Next Phase Readiness
- Encounter content pool is now 134 templates with progression from diff 20 to 90
- Ruins/wilderness locations no longer content deserts
- Ready for Phase 15 remaining plans (scoring, round-robin, movement difficulty scaling)

---
*Phase: 15-fix-encounter-pipeline-scoring-movement-difficulty-scaling-round-robin-and-content-deserts*
*Completed: 2026-03-30*
