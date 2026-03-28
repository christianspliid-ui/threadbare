---
phase: 10-sphere-affinity
plan: 03
subsystem: engine
tags: [sphere-affinity, pressure-sources, control-effects, doom, mandate]

# Dependency graph
requires:
  - phase: 10-sphere-affinity/10-02
    provides: phaseSpherePressure consuming pendingSpherePressures, SpherePressureEvent type, constants
provides:
  - phaseControlEffects: pushes SpherePressureEvent per tick for active sphere-tagged effects
  - phaseDoom: pushes entropy SpherePressureEvent on all location nodes on tier escalation
  - phaseMandate: pushes SpherePressureEvent on ascendant on milestone/completion
affects: [10-sphere-affinity/10-04, 10-sphere-affinity/10-05, engine-phases, world-soul]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - phaseDoom and phaseMandate extracted from orchestrator.ts into separate files
    - orchestrator.ts re-exports both for backward compatibility with existing tests
    - Fail-soft: no targetNodeId on control effect = no pressure; no targetSphere on mandate = no pressure
    - Doom pushes entropy on ALL location nodes on tier escalation (world-wide pressure burst)

key-files:
  created:
    - src/engine/phaseDoom.ts
    - src/engine/phaseMandate.ts
  modified:
    - src/engine/phaseControlEffects.ts
    - src/engine/orchestrator.ts

key-decisions:
  - "Control effect sphere derived from perTickCost keys (non-zero entries) — semantically correct: what you pay to maintain is what you channel"
  - "targetNodeId required for control effect pressure — hex col/row alone insufficient since graph uses location node IDs; fail-soft skip when absent"
  - "Doom entropy pressure on ALL location nodes — doom is a world-wide force, not a local event"
  - "phaseMandate uses mandateDefinition.targetSphere — only sphere_dominance mandates have this field; narrative/graph_state mandates produce no pressure"
  - "phaseDoom/phaseMandate extracted from orchestrator.ts to separate files; orchestrator re-exports for backward compat"

# Metrics
duration: 10min
completed: 2026-03-28
---

# Phase 10 Plan 03: Sphere Pressure Upstream Wiring (Control Effects, Doom, Mandate) Summary

**Control effects push per-tick sphere pressure, doom bursts entropy on tier escalation, and mandate milestones/completion push targeted sphere pressure on the ascendant**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-28T17:49:41Z
- **Completed:** 2026-03-28T18:00:00Z
- **Tasks:** 2
- **Files modified:** 4 (2 modified, 2 created)

## Accomplishments

- `phaseControlEffects.ts`: Adds sphere pressure accumulation — each active effect that successfully ticks pushes `CONTROL_PRESSURE_PER_TICK=1` pressure for each non-zero sphere in `perTickCost` onto the effect's `targetNodeId`. Fail-soft: no `targetNodeId` → skip.
- `phaseDoom.ts`: New file extracted from orchestrator.ts. On doom tier escalation, pushes `DOOM_PRESSURE_PER_TIER=4` entropy pressure on every location node in the graph (world-wide cosmic corruption burst).
- `phaseMandate.ts`: New file extracted from orchestrator.ts. On stage milestone advance, pushes `MANDATE_PRESSURE_MILESTONE=2` on the ascendant; on completion, pushes `MANDATE_PRESSURE_COMPLETION=5`. Uses `mandateDefinition.targetSphere`; fail-soft: no sphere → no pressure.
- `orchestrator.ts`: Removed inline `phaseDoom` and `phaseMandate` function bodies. Imports both from new files for internal `runTick` use; re-exports both for backward compatibility with existing tests.
- All 21 orchestrator tests pass, all 56 relevant phase tests pass, no new regressions.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire control effects phase** - `1a57710` (feat)
2. **Task 2: Wire doom and mandate phases** - `f848c95` (feat)

## Files Created/Modified

- `src/engine/phaseControlEffects.ts` — Added SpherePressureEvent import, pressures accumulator, step 3h push per active effect tick, pendingSpherePressures in return
- `src/engine/phaseDoom.ts` — New file: phaseDoom with doom clock advance, doom_escalation event, entropy pressure burst on all location nodes on tier escalation
- `src/engine/phaseMandate.ts` — New file: phaseMandate with mandate evaluation, stage advance, milestone/completion sphere pressure on ascendant, mandate_progress event
- `src/engine/orchestrator.ts` — Removed advanceDoomClock, evaluateMandate, advanceMandateStage imports; removed inline phaseDoom/phaseMandate bodies; imports+re-exports both from new files

## Decisions Made

- Control effect sphere derived from `perTickCost` keys rather than a dedicated `sphereAffinity` field — the plan referenced `effect.sphereAffinity` but this field doesn't exist on `ControlEffect`. Using `perTickCost` keys is semantically equivalent: the spheres you pay to maintain are the spheres the effect channels.
- Doom pushes entropy on ALL location nodes (not just doom-affected hexes) — doom's archetype description implies world-wide escalation; there is no "doom corruption region" data in the current DoomClockState.
- Mandate pressure targets the `ascendantId` node — mandate is a personal covenant between player and divine mandate, so the pressure applies to the player's agent node.
- Both phases extracted from orchestrator.ts for clean module boundaries; orchestrator re-exports for backward compat.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ControlEffect has no sphereAffinity field**
- **Found during:** Task 1 (reading ControlEffect type definition)
- **Issue:** Plan action referenced `effect.sphereAffinity` and `effect.targetHexId`, neither of which exist on the `ControlEffect` interface
- **Fix:** Used `effect.perTickCost` key iteration to derive sphere(s); used `effect.targetNodeId` as `targetEntityId`. Both are semantically correct. Added fail-soft skip when `targetNodeId` is absent.
- **Files modified:** src/engine/phaseControlEffects.ts
- **Committed in:** 1a57710

**2. [Rule 1 - Bug] phaseDoom and phaseMandate are in orchestrator.ts, not separate files**
- **Found during:** Task 2 (checking file existence)
- **Issue:** Plan listed `src/engine/phaseDoom.ts` and `src/engine/phaseMandate.ts` as files to modify, but they didn't exist — the functions were inline in orchestrator.ts
- **Fix:** Created the separate files with the full extracted+wired implementations; updated orchestrator.ts to import for internal use and re-export for backward compat
- **Files modified:** src/engine/orchestrator.ts (plus created 2 new files)
- **Committed in:** f848c95

---

**Total deviations:** 2 auto-fixed (both Rule 1 — missing field / missing files)
**Impact on plan:** Both necessary to complete the work. No scope creep.

## Self-Check: PASSED

Files created:
- [x] `src/engine/phaseDoom.ts` — FOUND
- [x] `src/engine/phaseMandate.ts` — FOUND

Files modified:
- [x] `src/engine/phaseControlEffects.ts` — FOUND
- [x] `src/engine/orchestrator.ts` — FOUND

Commits:
- [x] `1a57710` — feat(10-03): wire control effects phase
- [x] `f848c95` — feat(10-03): wire doom and mandate phases

Verification:
- [x] `npx tsc --noEmit` — CLEAN
- [x] `npm test` — 6704 pass, 21 pre-existing failures (no new regressions)
- [x] `npx vite build` — BUILD SUCCEEDED

---
*Phase: 10-sphere-affinity*
*Completed: 2026-03-28*
