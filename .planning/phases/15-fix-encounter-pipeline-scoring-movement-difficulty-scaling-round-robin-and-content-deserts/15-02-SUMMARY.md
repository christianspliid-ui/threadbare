---
phase: 15-fix-encounter-pipeline-scoring-movement-difficulty-scaling-round-robin-and-content-deserts
plan: 02
subsystem: engine
tags: [encounter, filter-pipeline, agent-decision, capability, familiarity, retirement]

# Dependency graph
requires:
  - phase: 15-fix-encounter-pipeline-scoring-movement-difficulty-scaling-round-robin-and-content-deserts
    provides: "15-01 scoring foundation, FamiliarityRecord type, encounterFilterPipeline.ts pipeline structure"
provides:
  - "MAX_COMPLETIONS_PER_TEMPLATE=5 constant — hard retirement after 5 attempts"
  - "OUTGROWTH_CAP_THRESHOLD=35 constant — capability gap threshold for outgrowth lock"
  - "OUTGROWTH_FILTER_ENABLED=true toggle — runtime switch for outgrowth behavior"
  - "filterByOutgrowth() function in encounterFilterPipeline.ts Stage 3b"
  - "Max completions pre-filter in phaseAgentDecision.ts between cooldown and scoring (C.1)"
affects:
  - "15-03 and beyond — encounter candidate pools now smaller for experienced agents"
  - "Agent travel behavior — agents forced to seek new encounters when local pool is retired"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Retirement via capability gap: capScaled - avgDifficulty >= threshold removes trivially easy encounters"
    - "Hard retirement via attempt count: completions < MAX_COMPLETIONS_PER_TEMPLATE pre-filter"
    - "Outgrowth filter accepts enabledOverride param for testing without mutating module constant"

key-files:
  created:
    - src/engine/__tests__/encounterFilterPipeline.test.ts
    - src/engine/encounterFilterPipeline.ts
  modified:
    - src/data/agent-behavior-constants.ts
    - src/engine/phaseAgentDecision.ts

key-decisions:
  - "filterByOutgrowth placed as Stage 3b (after chain prerequisites, before threat) — outgrown encounters stay filtered even if they pass threat check"
  - "Max completions filter uses famiarityRecord already maintained by B.1 tracking — no new data structure needed"
  - "filterByOutgrowth accepts enabledOverride optional param to allow toggle testing without module constant mutation"
  - "capScaled - avgDifficulty < OUTGROWTH_CAP_THRESHOLD: strict less-than means exactly-threshold encounters are filtered"
  - "Fail-soft: missing agent node returns all entries unchanged for both outgrowth and max completions filters"

patterns-established:
  - "Stage 3b pattern: outgrowth lock runs after prerequisites in same try/catch block chain"
  - "Pre-filter between pipeline stages: retirement filters sit between cooldown and scoring in phaseAgentDecision.ts"

requirements-completed: [ENC-03, ENC-04]

# Metrics
duration: 7min
completed: 2026-03-30
---

# Phase 15 Plan 02: Encounter Retirement — Max Completions and Outgrowth Lock Summary

**Two encounter retirement mechanisms: hard retirement after 5 completions per template and outgrowth lock removing trivially easy encounters when agent capability exceeds difficulty by 35+ points**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-30T10:36:10Z
- **Completed:** 2026-03-30T10:43:45Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 4

## Accomplishments
- Added `MAX_COMPLETIONS_PER_TEMPLATE=5`, `OUTGROWTH_CAP_THRESHOLD=35`, and `OUTGROWTH_FILTER_ENABLED=true` to agent-behavior-constants.ts
- Implemented `filterByOutgrowth()` in encounterFilterPipeline.ts: filters encounters where `capScaled - avgDifficulty >= OUTGROWTH_CAP_THRESHOLD`, with fail-soft for missing agents and a runtime toggle override parameter
- Wired outgrowth lock as Stage 3b in `runFilterPipeline()` after chain prerequisites
- Added max completions pre-filter (C.1) in `phaseAgentDecision.ts` between cooldown filter and scoring, using the existing `familiarityRecord.attemptCount` data structure
- 25 tests passing: 6 outgrowth lock tests, 4 MAX_COMPLETIONS_PER_TEMPLATE boundary tests, plus all existing pipeline tests

## Task Commits

1. **Task 1 (RED): Add failing tests** - `99ecdc9` (test)
2. **Task 1 (GREEN): Implement retirement mechanisms** - `2c9a61e` (feat)

## Files Created/Modified
- `src/data/agent-behavior-constants.ts` — Added ENCOUNTER RETIREMENT section with 3 new constants
- `src/engine/encounterFilterPipeline.ts` — Added `filterByOutgrowth()` function, Stage 3b wiring, re-exported new constants (file added to git tracking)
- `src/engine/phaseAgentDecision.ts` — Added MAX_COMPLETIONS_PER_TEMPLATE import, renamed `candidates` to `cooldownCandidates`, added C.1 max completions filter producing final `candidates`
- `src/engine/__tests__/encounterFilterPipeline.test.ts` — Added 10 new tests for outgrowth lock and max completions (file created, 25 tests total)

## Decisions Made
- Placed outgrowth as Stage 3b (after prerequisites) rather than Stage 4b (after threat): outgrown encounters should be retired regardless of threat tolerance — an overpowered agent shouldn't be offered trivial encounters even if they're within their threat band
- Max completions filter uses the existing `familiarityRecord.attemptCount` maintained by the B.1 familiarity tracking — no new state needed
- `filterByOutgrowth` accepts an optional `enabledOverride` boolean parameter to allow testing the disabled path without mutating `OUTGROWTH_FILTER_ENABLED` at module level

## Deviations from Plan

None - plan executed exactly as written. The implementation matched the action specification in the plan including filter placement, constant names, and fail-soft behavior.

## Issues Encountered
- Git stash operation during investigation caused vitest module cache to become stale — running `--no-cache` flag resolved apparent test failures that were actually cache artifacts
- `encounterFilterPipeline.ts` was previously untracked in git index despite existing in history via pack objects — the `git add` in the commit added it to tracking properly

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Encounter retirement is active: agents now retire templates after 5 completions and outgrow easy encounters
- Ready for Phase 15 Plan 03 (content deserts / born-later spawn improvements)
- Pre-existing test failures in encounterScoring.test.ts (wanderlust, from 15-01 RED), encounter-content.test.ts, encounter-reward-wiring.test.ts, and traceBuffer-integration.test.ts are out of scope for this plan

---
*Phase: 15-fix-encounter-pipeline-scoring-movement-difficulty-scaling-round-robin-and-content-deserts*
*Completed: 2026-03-30*
