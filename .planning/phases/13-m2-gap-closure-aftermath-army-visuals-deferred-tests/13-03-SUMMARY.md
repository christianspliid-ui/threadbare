---
phase: 13-m2-gap-closure-aftermath-army-visuals-deferred-tests
plan: "03"
subsystem: engine/siege
tags: [siege, encounters, tests, gap-closure]
dependency_graph:
  requires:
    - src/engine/siegeResolution.ts (existing siege infrastructure)
    - src/types/battle.ts (BattleState, SIEGE_REGIONAL_ENCOUNTER_RANGE)
    - src/engine/delivery.ts (hexDistance)
    - src/types/sphereAffinity.ts (SphereAffinity)
  provides:
    - generateRegionalEncounters function in siegeResolution.ts
    - SiegeRegionalEncounter interface
    - SiegeRegionalEncounterType union type
    - 6 passing tests in siegeRegionalEncounters.test.ts
  affects:
    - src/engine/siegeResolution.ts
    - src/engine/__tests__/siegeRegionalEncounters.test.ts
tech_stack:
  added: []
  patterns:
    - located_at edge traversal for actor hex position lookup
    - Direct hexCol/hexRow properties on location nodes (not via edges)
    - member_of edge traversal for faction allegiance
key_files:
  created:
    - src/engine/__tests__/siegeRegionalEncounters.test.ts
  modified:
    - src/engine/siegeResolution.ts
decisions:
  - Location nodes (settlements) store hexCol/hexRow as direct properties — not via located_at edges (which are actor-only per edge schema)
  - Actors store position via located_at edge to a location node with hexCol/hexRow
  - defenderArmyId in siege state must be an army node with a member_of edge to a faction — not the faction node itself
  - PRNG parameter accepted but unused — all eligible actors get encounters deterministically (NFP #3)
metrics:
  duration: 5
  completed_date: "2026-03-30"
  tasks: 2
  files: 2
---

# Phase 13 Plan 03: Siege Regional Encounter Generation Summary

**One-liner:** Implemented `generateRegionalEncounters` with range check, faction-based call_for_aid, sphere-based smuggle_supplies/negotiate_terms, deduplication, and battle exclusion — closing 6 deferred .todo tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Implement generateRegionalEncounters | d63be78 | src/engine/siegeResolution.ts |
| 2 | Convert 6 .todo tests to real tests | fd4721c | src/engine/__tests__/siegeRegionalEncounters.test.ts |

## What Was Built

### generateRegionalEncounters (siegeResolution.ts)

Added to the bottom of `siegeResolution.ts`:

- **SiegeRegionalEncounterType** — union of `call_for_aid | smuggle_supplies | negotiate_terms`
- **SiegeRegionalEncounter** — interface with `actorId`, `encounterType`, `siegeSettlementId`
- **generateRegionalEncounters** — scans all actor nodes within `SIEGE_REGIONAL_ENCOUNTER_RANGE` hexes of the siege settlement:
  - Gets settlement position from `hexCol`/`hexRow` directly on the location node
  - Gets actor position via `located_at` edge to a location node with `hexCol`/`hexRow`
  - Gets defender faction via `member_of` edge from `defenderArmyId`
  - Priority order: faction allegiance → Shadow score → Heart score
  - Skips armies (`armyState != null`), actors in battles (`battleState != null`), and already-encountered actors (`spotlightHistory`)

### Test Suite (siegeRegionalEncounters.test.ts)

Complete rewrite of the deferred stub file. 6 real tests:
1. No actors within range → empty result
2. Allied faction actor within range → `call_for_aid`
3. Shadow-capable (non-allied) actor → `smuggle_supplies`
4. Heart-capable (non-allied, no Shadow) actor → `negotiate_terms`
5. Actor in `spotlightHistory` → skipped (no duplicates)
6. Actor with `battleState` → excluded; non-battling actor still included

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Settlement position via located_at was wrong — location nodes use direct properties**
- **Found during:** Task 1 implementation + Task 2 test execution
- **Issue:** The plan's pseudo-code used `graph.getOutgoingEdges(settlementId, 'located_at')` to get settlement position, but settlement nodes are `location` type and the edge schema only allows `actor` sources for `located_at` edges. Location nodes store `hexCol`/`hexRow` as direct properties.
- **Fix:** Changed settlement position lookup to `graph.getNode(settlementId)?.properties.hexCol` directly. Actor position lookup (via `located_at` to hex nodes) is correct as-is.
- **Files modified:** `src/engine/siegeResolution.ts`, `src/engine/__tests__/siegeRegionalEncounters.test.ts`
- **Commit:** fd4721c (test fix), d63be78 amended in fd4721c (impl fix applied before test commit)

**2. [Rule 1 - Bug] defenderArmyId must be an army node, not a faction node**
- **Found during:** Task 2 test debugging
- **Issue:** Two tests passed `defenderArmyId: 'faction_defender'` directly, but the function traverses `getOutgoingEdges(defenderArmyId, 'member_of')` expecting the defender army to have a `member_of` edge to a faction. Faction nodes have no `member_of` edges of their own.
- **Fix:** Updated the two affected tests to create a `army_defender` node with a `member_of` edge to `faction_defender`, then set `defenderArmyId: 'army_defender'`.
- **Files modified:** `src/engine/__tests__/siegeRegionalEncounters.test.ts`
- **Commit:** fd4721c

## Self-Check: PASSED

Files exist:
- FOUND: src/engine/siegeResolution.ts
- FOUND: src/engine/__tests__/siegeRegionalEncounters.test.ts

Commits exist:
- FOUND: d63be78 (feat 13-03 implement generateRegionalEncounters)
- FOUND: fd4721c (test 13-03 convert 6 .todo tests)

Tests: 6/6 passing, 471 test files passing total, `npx tsc --noEmit` clean.
