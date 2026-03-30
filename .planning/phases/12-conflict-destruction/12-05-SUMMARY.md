---
phase: 12-conflict-destruction
plan: 05
subsystem: engine
tags: [siege, battle, encounter, graph, regional-encounters, pacing, fortification]

requires:
  - phase: 12-04
    provides: BattleState, battleResolution, army colocation detection

provides:
  - generateRegionalEncounters: proximity-based encounter hooks for siege pull mechanics
  - applyBreachFortificationReduction: settlement fortification multiplier reduction on breach
  - Siege detection in phaseBattleDetection: army-at-hostile-settlement creates siege node
  - siege-encounter-content.ts: 7 spotlight templates + 5 regional encounter templates
  - siegeRegionalEncounters.test.ts: 6 tests with zero deferred todos

affects: [orchestrator, encounter-progression, siege-tick, settlement-aftermath]

tech-stack:
  added: []
  patterns:
    - "Proximity-based encounter generation via hexDistance + SIEGE_REGIONAL_ENCOUNTER_RANGE"
    - "Per-siege deduplication via siegeRegionalEncountersSent string[] on node properties"
    - "Capability-based encounter routing: faction alignment checked first, then Shadow/Heart domainCapabilities"
    - "Fortification multiplier stored as fortificationMultiplier on settlement node for dynamic reduction"

key-files:
  created:
    - src/data/siege-encounter-content.ts
    - src/engine/__tests__/siegeRegionalEncounters.test.ts
  modified:
    - src/engine/siegeResolution.ts
    - src/engine/battleResolution.ts
    - src/types/battle.ts

key-decisions:
  - "generateRegionalEncounters emits traces (not encounter nodes) — encounter dispatch deferred to encounter system when templates wire in"
  - "Deduplication stored on siege node properties (siegeRegionalEncountersSent) not in separate state — survives tick cycle"
  - "Siege detection in phaseBattleDetection checks both co-located location nodes and hex-itself-as-settlement via locationSubtype field"
  - "selectRegionalEncounterType checks faction alignment before capabilities — allied defender/attacker takes priority over capability match"

patterns-established:
  - "Siege spotlight phases: opening (0-3), early (4-10), middle (11-20), crescendo (21+) — tied to getSiegePhase()"
  - "Fortification reduction: stored as fortificationMultiplier property on settlement node, initialized lazily from getFortificationModifier()"

requirements-completed: [TB-073]

duration: 15min
completed: 2026-03-29
---

# Phase 12 Plan 05: Siege Resolution Summary

**Siege regional encounter generation with faction-aware proximity dispatch, accelerating pacing, settlement fortification breach reduction, and 7 siege spotlight + 5 regional encounter templates**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-29T20:45:00Z
- **Completed:** 2026-03-29T20:51:00Z
- **Tasks:** 7 (tasks 1+2+3+4 bundled, task 5, task 6, task 7)
- **Files modified:** 5 (3 modified, 2 created; plus Plan 04 backfill of 3 files)

## Accomplishments
- Implemented `generateRegionalEncounters` in `siegeResolution.ts`: finds actors within `SIEGE_REGIONAL_ENCOUNTER_RANGE` hexes, filters by faction alignment and domain capabilities, deduplicates per actor per siege, emits `siege_regional_encounter` traces
- Added `applyBreachFortificationReduction` for `siege_breach` spotlight consequences
- Extended `phaseBattleDetection` with hostile-settlement detection: army at hex with a settlement controlled by a different faction triggers `createSiegeNode`
- Created `siege-encounter-content.ts` with 7 spotlight templates (all siege phases) and 5 regional encounter templates
- Replaced 6 deferred `.todo` test stubs in `siegeRegionalEncounters.test.ts` with 6 real passing tests

## Task Commits

1. **Tasks 1-4: Siege engine (constants, regional encounters, detection, breach)** - `20a0c18` (feat)
2. **Task 5: Siege encounter content** - `72300b4` (feat)
3. **Task 6: Regional encounter tests** - `3985e4a` (test)
4. **Task 7: Pre-commit verification** — all checks passed inline (npm test, tsc, vite build)
5. **Plan 04 backfill: battleSpotlights + battle-spotlight-content** - `e7909f9` (feat)

## Files Created/Modified
- `src/engine/siegeResolution.ts` — Added `generateRegionalEncounters`, `applyBreachFortificationReduction`, `selectRegionalEncounterType`; wired `generateRegionalEncounters` into `tickSiege`; imported `hexDistance`, `SIEGE_REGIONAL_ENCOUNTER_RANGE`, `BREACH_FORTIFICATION_REDUCTION`
- `src/engine/battleResolution.ts` — Extended `phaseBattleDetection` with army-at-hostile-settlement siege creation; imported `createSiegeNode`
- `src/types/battle.ts` — Already complete from prior work (all siege constants present)
- `src/data/siege-encounter-content.ts` — New: 7 spotlight templates + 5 regional templates with TypeScript interfaces
- `src/engine/__tests__/siegeRegionalEncounters.test.ts` — New: 6 passing tests replacing deferred todos

## Decisions Made
- `generateRegionalEncounters` emits traces rather than creating encounter nodes directly — actual encounter spawning wires through the encounter system when spotlight templates get integrated; traces document the intent and are inspectable
- Deduplication is tracked in `siegeRegionalEncountersSent: string[]` on the siege node's properties — this persists across ticks and survives the tick loop without additional state management
- Faction alignment checked before capability in `selectRegionalEncounterType`: allied_defender and allied_attacker take priority; Shadow/Heart capabilities only apply to neutral actors
- Fortification multiplier reduction stored as `fortificationMultiplier` on the settlement node — lazily initialized from `getFortificationModifier()` if not already set

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan 04 artifacts missing from commit history**
- **Found during:** Task 2 (linter auto-added imports to battleResolution.ts)
- **Issue:** battleResolution.ts referenced `selectSpotlight`, `hasThreadToBattle` (battleSpotlights.ts) and `BATTLE_SPOTLIGHT_TEMPLATES` (battle-spotlight-content.ts) — these Plan 04 artifacts existed on disk but were untracked
- **Fix:** Added `battleSpotlights.ts`, `battle-spotlight-content.ts`, `battleSpotlights.test.ts` to a backfill commit
- **Files modified:** src/engine/battleSpotlights.ts, src/data/battle-spotlight-content.ts, src/engine/__tests__/battleSpotlights.test.ts
- **Verification:** `npm test` — all 7012 tests pass; `tsc --noEmit` clean; `vite build` succeeds
- **Committed in:** `e7909f9` (separate backfill commit, clearly labeled)

---

**Total deviations:** 1 auto-fixed (1 blocking — missing Plan 04 artifacts)
**Impact on plan:** Backfill necessary for build cleanliness. No scope creep.

## Issues Encountered
- `traceBuffer` exports `getTraces()` and `clearTraces()` (not `getTraceBuffer()` / `clearTraceBuffer()`) — corrected in test file immediately

## Next Phase Readiness
- Siege pacing, starvation, regional encounters, and fortification breach are all implemented and tested
- `generateRegionalEncounters` produces traces; next step is wiring those traces into actual encounter node spawning via the encounter progression system
- `applyBreachFortificationReduction` is callable from spotlight resolution when the spotlight system integrates with siege

---
*Phase: 12-conflict-destruction*
*Completed: 2026-03-29*
