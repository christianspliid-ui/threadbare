---
phase: 20-wiring
plan: 02
subsystem: ui
tags: [tick-events, narrative-log, actor-id, chronicle, click-to-select]

# Dependency graph
requires:
  - phase: 20-wiring
    provides: "Phase 20 context: actorId field on TickEvent already declared as optional string"
provides:
  - "actorId populated on all engine TickEvents where originating agent is in scope"
  - "NarrativeLog Chronicle entries with actorId render as clickable buttons calling onSelectAgent"
affects: [chronicle-ui, narrative-log, tick-events, agent-selection]

# Tech tracking
tech-stack:
  added: []
  patterns: ["actorId: actor.id on events.push wherever agent loop variable is in scope"]

key-files:
  created:
    - src/components/Game/__tests__/NarrativeLog.test.tsx (5 new tests added)
  modified:
    - src/engine/phaseMovement.ts
    - src/engine/unifiedActionResolution.ts
    - src/engine/unifiedActionPhases.ts
    - src/engine/agentLifecycle.ts
    - src/engine/phaseColocationDetection.ts
    - src/engine/orchestrator.ts
    - src/components/Game/NarrativeLog.tsx
    - src/components/Game/GameView.tsx

key-decisions:
  - "dilemma_resolved uses event.actorId ?? actor.id — prefers the propagated actorId from agent_action_resolved source event, falls back to actor resolved by name matching"
  - "NarrativeLog renders actor-attributed entries as <button> elements, non-actor entries remain <div> — structural distinction, not just styling"
  - "System/global events (doom_escalation, mandate_progress, essence_gain, rival_action, settlement_tier_change, phase_error) intentionally left without actorId — no meaningful single actor to navigate to"

patterns-established:
  - "Actor event attribution: add actorId: actor.id to every events.push where the agent loop variable is in scope"
  - "Conditional element type: use ternary to render <button> vs <div> based on whether click handler is meaningful"

requirements-completed: [WIRE-03]

# Metrics
duration: 20min
completed: 2026-03-30
---

# Phase 20 Plan 02: actorId Attribution and NarrativeLog Click-to-Select Summary

**actorId added to 12 engine TickEvents across 6 files; NarrativeLog Chronicle entries are now clickable buttons when actorId is present, calling handleAgentSelect to navigate to the originating agent**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-30T23:12:00Z
- **Completed:** 2026-03-30T23:20:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- All agent-attributed engine TickEvents now carry actorId (phaseMovement, unifiedActionResolution, unifiedActionPhases, agentLifecycle, phaseColocationDetection, orchestrator)
- NarrativeLog accepts onSelectAgent prop; entries with actorId render as accessible button elements with cursor-pointer + hover effect
- GameView wired onSelectAgent={handleAgentSelect} to NarrativeLog — click in Chronicle navigates to agent
- 5 new tests verify click-to-select behavior including positive/negative cases and handler invocation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add actorId to all engine TickEvents where originating agent is known** - `b63d6b7` (feat)
2. **Task 2: Make NarrativeLog entries clickable when actorId is present** - `2c0646d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/engine/phaseMovement.ts` - agent_movement event now carries actorId
- `src/engine/unifiedActionResolution.ts` - tier_promotion + both agent_action_resolved variants carry actorId
- `src/engine/unifiedActionPhases.ts` - action-begins, routine, and notable events carry actorId
- `src/engine/agentLifecycle.ts` - agent_death and agent_birth events carry actorId
- `src/engine/phaseColocationDetection.ts` - agent_encounter event carries observer.id as actorId
- `src/engine/orchestrator.ts` - in-progress encounter step and dilemma_resolved events carry actorId
- `src/components/Game/NarrativeLog.tsx` - onSelectAgent prop, conditional button/div rendering, cursor-pointer hover
- `src/components/Game/GameView.tsx` - NarrativeLog receives onSelectAgent={handleAgentSelect}
- `src/components/Game/__tests__/NarrativeLog.test.tsx` - 5 new click-to-select tests added

## Decisions Made
- `dilemma_resolved` uses `event.actorId ?? actor.id` — prefers the propagated actorId from the source `agent_action_resolved` event, falls back to the actor resolved by name-matching. This is correct because after Task 1, all `agent_action_resolved` events carry actorId.
- NarrativeLog uses `<button>` vs `<div>` structural distinction (not just CSS) — ensures correct keyboard accessibility and tab order for clickable entries.
- System/global events intentionally left without actorId: doom_escalation, mandate_progress, essence_gain, rival_action, settlement_tier_change, phase_error — no meaningful single agent to navigate to.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `encounter-liveness.contract.test.ts` times out under heavy parallel test suite load (5s limit exceeded when all 492 test files run concurrently). This is pre-existing: test passes in isolation (both before and after my changes). Confirmed by running `git stash` + isolated run before and after. Not caused by this plan's changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- WIRE-03 complete: actorId attribution and click-to-navigate are fully wired
- Phase 20 plans 01 and 02 are both complete — phase 20 (Wiring) is done
- Phases 21 and 22 can proceed independently

---
*Phase: 20-wiring*
*Completed: 2026-03-30*
