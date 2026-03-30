---
phase: 15-fix-encounter-pipeline-scoring-movement-difficulty-scaling-round-robin-and-content-deserts
plan: "04"
subsystem: engine
tags: [agent-decision, encounter-pipeline, movement, content-desert, tdd]

# Dependency graph
requires:
  - phase: 15-03
    provides: difficulty scaling and round-robin mechanics in encounter pipeline

provides:
  - IDLE_FORCED_TRAVEL_THRESHOLD constant (10 ticks)
  - consecutiveIdleTicks tracking on agent node properties
  - Forced travel initiation from content desert locations
  - Fail-soft when no reachable location has content

affects: [encounter-pipeline, agent-decision, content-deserts, movement]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD Wave 0: test file created first with failing tests, implementation makes them pass"
    - "Content desert detection via idleReason === no_candidates_after_filter"
    - "Forced travel reuses findShortestPath + initMovementState pattern from queue_movement"

key-files:
  created:
    - src/engine/__tests__/phaseAgentDecision-forced-travel.test.ts
  modified:
    - src/data/agent-behavior-constants.ts
    - src/engine/phaseAgentDecision.ts

key-decisions:
  - "consecutiveIdleTicks incremented only in idle branch (not when agent is skipped or moving)"
  - "Forced travel only triggers for no_candidates_after_filter, not below_score_threshold — agents with poor scores but available content are NOT force-moved"
  - "Counter reset placed on all three non-idle decision paths: start_local/attempt_remote (familiarityRecord update), queue_movement (movementState update)"
  - "Test helper uses located_at edges (not contains) so agents are found by getAgentLocationId"
  - "void_no_content location type used in tests to guarantee no encounter templates and force idle path"

patterns-established:
  - "consecutiveIdleTicks pattern: increment on idle, reset to 0 on non-idle — tracks pure content desert tenure"

requirements-completed: [ENC-06]

# Metrics
duration: 8min
completed: 2026-03-30
---

# Phase 15 Plan 04: Content Desert Forced Travel Summary

**IDLE_FORCED_TRAVEL_THRESHOLD escape hatch: agents stuck 10+ idle ticks at content-empty locations automatically path to the nearest encounter-bearing location via findShortestPath**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T11:03:00Z
- **Completed:** 2026-03-30T11:11:32Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- IDLE_FORCED_TRAVEL_THRESHOLD = 10 constant added to agent-behavior-constants.ts (IDLE BEHAVIOR section)
- consecutiveIdleTicks property tracked on agent nodes, incrementing each idle tick and resetting on any encounter decision
- Forced travel triggers only when idleReason is no_candidates_after_filter (true content desert), not below_score_threshold (agent has poor capabilities)
- Forced travel uses identical pathfinding to queue_movement (findShortestPath with road-aware fallback)
- Fail-soft: agent stays idle when no reachable location has encounter entries — no crash
- 8 TDD tests pass covering all behavior scenarios

## Task Commits

Each task was committed atomically:

1. **Task 1: Create forced travel test file (Wave 0 RED)** - `66d16ee` (test)
2. **Task 2: Implement forced travel fallback and idle tick tracking** - `2d08604` (feat)

**Plan metadata:** (docs commit — see below)

_Note: Task 1 is TDD RED (failing tests), Task 2 is TDD GREEN (implementation passing all tests). Test file was also updated in Task 2 to fix located_at edge type and void_no_content location type._

## Files Created/Modified
- `src/engine/__tests__/phaseAgentDecision-forced-travel.test.ts` - 8 test cases for forced travel behavior
- `src/data/agent-behavior-constants.ts` - Added IDLE_FORCED_TRAVEL_THRESHOLD = 10 in IDLE BEHAVIOR section
- `src/engine/phaseAgentDecision.ts` - consecutiveIdleTicks tracking, forced travel fallback, counter reset on non-idle decisions

## Decisions Made
- Forced travel only triggers for `no_candidates_after_filter` not `below_score_threshold` — this ensures only genuine content deserts (zero cache entries) trigger the escape, not agents who have encounters available but score them too low
- Counter reset on queue_movement path required a separate `updateNode` call modification (the `start_local`/`attempt_remote` path had its own `updateNode` for familiarityRecord)
- Test helper uses `located_at` edges (source: agent, target: location) — the `contains` edge pattern in the original test file does NOT work with `getAgentLocationId` which only reads `located_at` edges
- `void_no_content` location type used in tests to guarantee empty encounter cache regardless of encounter-content.ts template assignments

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test helper used wrong edge type for agent location**
- **Found during:** Task 2 (test GREEN phase - tests failing with count=3 not incrementing)
- **Issue:** Plan's `addAgent` helper used `contains` edges (source: location, target: agent). `getAgentLocationId` only reads `located_at` outgoing edges (source: agent, target: location). Agents were being silently skipped by `if (!locationId) continue`
- **Fix:** Changed `addAgent` in test file to create `located_at` edges (source: agent, target: location)
- **Files modified:** src/engine/__tests__/phaseAgentDecision-forced-travel.test.ts
- **Verification:** All 8 tests pass
- **Committed in:** `2d08604` (Task 2 commit)

**2. [Rule 1 - Bug] Test location type 'wilderness' has encounter templates**
- **Found during:** Task 2 (incrementing test returned 0 instead of 4)
- **Issue:** `wilderness` type has many encounter templates in encounter-content.ts. Agents found encounters and took non-idle decisions, resetting counter to 0 instead of incrementing to 4
- **Fix:** Changed content-desert test locations to use `void_no_content` type which has no encounter templates
- **Files modified:** src/engine/__tests__/phaseAgentDecision-forced-travel.test.ts
- **Verification:** Increment test passes (3 → 4)
- **Committed in:** `2d08604` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bugs in test setup)
**Impact on plan:** Both fixes in test file only. Production implementation was correct as specified.

## Issues Encountered
None in production code. Test setup issues found and fixed (see Deviations above).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 content desert mechanisms are now complete: encounter retirement (P01), content expansion (P02), round-robin/difficulty scaling (P03), forced travel fallback (P04)
- Phase 15 is fully complete — encounter pipeline is fixed
- Phase 16 (Retinue sidebar expansion) can begin
