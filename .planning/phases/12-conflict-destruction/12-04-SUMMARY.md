---
phase: 12-conflict-destruction
plan: "04"
subsystem: battle-system
tags: [battle, spotlight, threads, momentum, narrative]
dependency_graph:
  requires: [12-02, 12-03]
  provides: [battleSpotlights, battle-spotlight-content, thresholdsFired, BattleTrace-events]
  affects: [battleResolution, orchestrator]
tech_stack:
  added: []
  patterns:
    - "Seeded PRNG for spotlight template selection (mulberry32)"
    - "Thread-based POV filtering via graph edge traversal"
    - "Threshold deduplication via thresholdsFired string array"
    - "Circular import prevention: condition helpers inline in content module"
key_files:
  created:
    - src/engine/battleSpotlights.ts
    - src/data/battle-spotlight-content.ts
    - src/engine/__tests__/battleSpotlights.test.ts
  modified:
    - src/types/battle.ts
    - src/engine/battleResolution.ts
    - src/engine/siegeResolution.ts
decisions:
  - "Condition helper functions inlined in battle-spotlight-content.ts to prevent circular import with battleSpotlights.ts"
  - "BattleTrace events renamed to started/resolved/spotlight_spawned/momentum_shift per plan spec"
  - "Chronicle-only battles (no thread) use simple PRNG roll; threaded battles use full selectSpotlight pipeline"
  - "Threshold spotlights tracked in thresholdsFired on BattleState — prevents repeat fires across battle duration"
metrics:
  duration_minutes: 12
  completed_date: "2026-03-29"
  tasks_completed: 9
  files_changed: 6
---

# Phase 12 Plan 04: Battle Spotlight System Summary

Battle spotlight system: thread-based POV filtering, 9 spotlight templates with conditions, seeded PRNG selection, and momentum trace events (started/spotlight_spawned/momentum_shift/resolved).

## What Was Built

### `src/engine/battleSpotlights.ts`
Three exported functions for the spotlight pipeline:
- `hasThreadToBattle(state, battleNodeId)`: checks if ascendant has `thread` edges to any battle participant or their commanders. Returns false → chronicle-only battle.
- `getEligibleSpotlights(state, battleNodeId)`: filters BATTLE_SPOTLIGHT_TEMPLATES by condition functions and thresholdsFired set.
- `selectSpotlight(state, battleNodeId)`: seeded PRNG selection from eligible templates (mulberry32, same seed formula as tickBattle).

### `src/data/battle-spotlight-content.ts`
9 `SpotlightTemplate` entries covering the full narrative range:
1. `commander_peril` — attacker's commander in danger (momentum < -3)
2. `turning_point` — knife-edge balance (|momentum| < 2)
3. `moral_dilemma` — victory possible, sacrifice required (threshold)
4. `betrayal` — treachery in ranks during balance (threshold)
5. `artifact_activation` — bonded artifact present (threshold)
6. `third_army` — new force joined this tick
7. `divine_counterstrike` — rival ascendant invested
8. `last_stand` — army below 20% quintessence (threshold)
9. `champion_duel` — both commanders Iron Tier 5+ (threshold)

Each template has `momentumOnSuccess`/`momentumOnFailure` read by `tickBattle`.

### `src/types/battle.ts`
Added `thresholdsFired: string[]` to `BattleState` — prevents threshold spotlights from firing more than once per battle.

### `src/engine/battleResolution.ts`
- `tickBattle` now calls `hasThreadToBattle` and `selectSpotlight`
- Thread-connected battles: spotlight system drives momentum shifts
- Chronicle-only battles: simple PRNG roll (attacker/defender gain, 40/40/20 split)
- Emits separate traces: `spotlight_spawned`, `momentum_shift`, `battle_tick`
- `createBattleNode` emits event `started` (was `battle_started`)
- `resolveBattle` emits event `resolved` (was `battle_resolved`)

## Tests

`src/engine/__tests__/battleSpotlights.test.ts` — 16 tests:
- `hasThreadToBattle`: 6 tests (no threads, unrelated thread, direct army thread, commander thread, no ascendantId)
- `getEligibleSpotlights`: 5 tests (missing battle, condition filtering, thresholdsFired dedup)
- `selectSpotlight`: 4 tests (null when none eligible, single result, deterministic PRNG, tick variance)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Circular import between battleSpotlights.ts and battle-spotlight-content.ts**
- **Found during:** Task 3 (creating battleSpotlights.ts)
- **Issue:** battle-spotlight-content.ts imported helpers from battleSpotlights.ts, and battleSpotlights.ts imported BATTLE_SPOTLIGHT_TEMPLATES from battle-spotlight-content.ts — mutual import cycle
- **Fix:** Inlined condition helper functions in battle-spotlight-content.ts; removed exports from battleSpotlights.ts
- **Files modified:** src/engine/battleSpotlights.ts, src/data/battle-spotlight-content.ts
- **Commit:** 456b3f4

**2. [Rule 2 - Missing] Three separate BattleTrace events per spec**
- **Found during:** Task 7 (trace review)
- **Issue:** Plan spec required distinct `started`, `spotlight_spawned`, `momentum_shift`, `resolved` events. Existing code used `battle_started`, `battle_resolved`, and single combined trace
- **Fix:** Renamed events to spec names; split tick trace into three separate emits
- **Files modified:** src/engine/battleResolution.ts
- **Commit:** 456b3f4

## Self-Check

**Files exist:**
- `src/engine/battleSpotlights.ts` — FOUND (committed in e7909f9)
- `src/data/battle-spotlight-content.ts` — FOUND (committed in 456b3f4)
- `src/engine/__tests__/battleSpotlights.test.ts` — FOUND (committed in e7909f9)
- `src/types/battle.ts` — FOUND (thresholdsFired added)

**Tests:** 7012 passing, 0 failing

**Self-Check: PASSED**
