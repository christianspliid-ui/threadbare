---
name: testing-patterns
description: >
  Use when writing tests for engine or HexMapV2 changes, especially when modifications cross
  module boundaries. Triggers on "write tests", "contract test", "integration test",
  "movement test", "hexmap test", "regression test", or when implementing changes that touch
  3+ files across src/engine/ and src/components/. Also load when reviewing test coverage
  or diagnosing why a change broke downstream systems.
---

# Testing Patterns — Domain Context

> Load this skill when writing or reviewing tests for engine or HexMapV2 changes. The root CLAUDE.md has the rules; this skill has the maps, examples, and checklists.

## The Core Problem This Skill Solves

Each engine module has decent unit tests in isolation. But changes break things because **no tests verify the contracts between modules**. A change to `computeEdgeCost` affects pathfinding → movement → animation → trails, but only pathfinding has tests. The downstream systems break silently.

This skill teaches you to write **contract tests** that catch these integration failures, and gives you the dependency map to know which contracts to verify for any given change.

## Movement/HexMap Dependency Map

When you change a module on the left, you must verify all modules it feeds into on the right:

```
computeEdgeCost ──→ findShortestPath ──→ initMovementState ──→ tickMovement
       │                    │                    │                    │
       │                    │                    │                    ├──→ phaseMovement (orchestrator)
       │                    │                    │                    ├──→ MovementHistoryEntry
       │                    │                    │                    │         │
       │                    │                    │                    │         └──→ MovementTrailMesh
       │                    │                    │                    │
       │                    │                    │                    └──→ HexMapV2 agent props
       │                    │                    │                              │
       │                    │                    │                              ├──→ agentAnimationState
       │                    │                    │                              └──→ AgentSpriteMesh
       │                    │                    │
       │                    │                    └──→ roadHexQueue (new) ──→ road animation mode
       │                    │
       │                    └──→ RoadSegmentInfo[] ──→ roadHexQueue population
       │
       └──→ movementCandidates ──→ phaseAgentDecision

generateRoadEdges ──→ road graph edges ──→ findShortestPath (road edge scan)
                                        └──→ extractRoadPaths ──→ RoadMesh (renderer)
```

**Read this map when deciding which contract tests to write or update.**

## Contract Test Pattern

A contract test connects two real modules — no mocks at the boundary:

```typescript
// File: src/engine/__tests__/contracts/pathfinding-to-movement.contract.test.ts

import { describe, test, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { findShortestPath } from '../pathfinding';
import { initMovementState } from '../movementExecution';
import { tickMovement } from '../movementExecution';
import { computeEdgeCost } from '../movementCost';

describe('Contract: pathfinding → movementExecution', () => {
  // Build a REAL graph — not a mock, not a 2-node stub
  function buildTestGraph(): WorldGraph {
    const graph = new WorldGraph();
    // Add 10+ locations with real terrain, real adjacency, real roads
    // This should resemble a small but realistic portion of the game map
    // ...
    return graph;
  }

  test('pathfinding output produces valid movement state that ticks correctly', () => {
    const graph = buildTestGraph();
    const agentId = 'agent_test';
    // Add agent to graph...

    const pathResult = findShortestPath(graph, agentId, 'loc_start', 'loc_end');
    expect(pathResult).not.toBeNull();

    const firstEdgeCost = computeEdgeCost(graph, agentId, 'loc_start', pathResult!.path[0]);
    const state = initMovementState('loc_end', pathResult!.path, firstEdgeCost.totalCost, 0);

    // Tick until arrival — should never produce corrupt state
    let current = state;
    let ticks = 0;
    const MAX_TICKS = 100; // Safety valve
    while (current.movementQueue.length > 0 && ticks < MAX_TICKS) {
      const result = tickMovement(graph, agentId, current, ticks);
      current = result.updatedState;
      ticks++;
    }

    expect(current.movementQueue).toHaveLength(0);
    expect(ticks).toBeLessThan(MAX_TICKS); // Did not timeout
  });

  test('road path produces valid roadHexQueue with correct hex coordinates', () => {
    // When road-aware pathfinding is implemented:
    // Verify RoadSegmentInfo hexPath entries are valid hex coords
    // Verify reversed hexPath is correct when traversing opposite direction
  });
});
```

## Contract Test File Convention

Place contract tests in `__tests__/contracts/` within the domain directory:

```
src/engine/__tests__/contracts/
  pathfinding-to-movement.contract.test.ts
  decision-to-movement.contract.test.ts
  road-network-to-pathfinding.contract.test.ts
  movement-to-animation.contract.test.ts

src/components/HexMapV2/__tests__/contracts/
  movement-state-to-trail.contract.test.ts
  movement-state-to-agent-sprite.contract.test.ts
```

The `.contract.` in the filename makes them easy to run as a group: `npm test -- --grep "contract"`.

## Known Coverage Gaps (Priority Order)

These are the highest-risk untested boundaries. Address them opportunistically when working in related code:

### Critical (breaks are silent and hard to diagnose)

1. **`MovementTrailMesh` has zero tests.** Any change to `MovementHistoryEntry` format, trail segment creation, or faction color lookup breaks trail rendering with no test failure. Write basic tests: history entries produce trail segments, faction colors resolve, fade timing matches constants.

2. **Orchestrator doesn't test movement phases.** The 42K-line orchestrator has 19 tests — none run a full tick with agent movement. Add: "agent with movement queue advances after tick", "agent arrives and enters decision phase", "10-tick journey completes correctly."

3. **`movement-integration.test.ts` is `describe.skip`.** 10 tests written for the old movement pipeline, never rewritten for `phaseAgentDecision`. Either rewrite for current architecture or delete. Skipped tests are worse than no tests — they imply coverage that doesn't exist.

### High (breaks are visible but root cause is obscure)

4. **No contract: `phaseAgentDecision` → `phaseMovement`.** Decision creates `MovementState`, movement ticks it. If decision produces state that movement can't tick (e.g., empty queue but non-empty destination), the agent freezes. Test the handoff.

5. **No contract: movement state → animation.** `HexMapV2.tsx` detects hex changes by diffing agent props. If `MovementState` shape changes break the diff logic, agents stop animating. Test: movement state transition produces detectable hex change in agent props.

6. **Road network → pathfinding is mock-isolated.** `roadNetwork.test.ts` mocks `findHexPath` entirely. Real road generation + real pathfinding are never tested together. A bug in hex path format would pass road tests and fail pathfinding.

### Medium (breaks are caught by visual QA but waste time)

7. **No PRNG seed in phase tests.** `phaseMovement.test.ts` and `phaseAgentDecision.test.ts` don't seed the PRNG. Non-deterministic tests hide ordering-dependent bugs that appear only on certain seeds.

8. **Only tiny test graphs.** All movement tests use 2–5 node graphs. The real map is ~320 hexes with ~250 nodes. At minimum, one test per system should use a 20+ node graph to catch topology edge cases.

## Anti-Patterns to Watch For

### ❌ Mocking the module you're testing against

```typescript
// BAD: road network tests mock findHexPath
vi.mock('../pathfinding', () => ({
  findHexPath: vi.fn().mockReturnValue({ path: [...], totalCost: 10 }),
}));
// This test proves roadNetwork works with FAKE pathfinding.
// It does NOT prove it works with REAL pathfinding.
```

**Fix:** Keep the mock test for unit coverage, but add a contract test that uses real `findHexPath`. Both tests serve different purposes.

### ❌ Hand-building state objects instead of using factory functions

```typescript
// BAD: hand-crafting MovementState in tests
const state: MovementState = {
  destinationId: 'loc_b',
  movementQueue: ['loc_b'],
  ticksAccumulated: 0,
  currentEdgeCost: 2,
  lastDecisionTick: 0,
  movementHistory: [],
};
// If MovementState gains new required fields, this test still compiles
// but produces an incomplete object that masks bugs.
```

**Fix:** Always use `initMovementState()` to create test state. If the factory doesn't support your test case, extend the factory — don't bypass it.

### ❌ Testing animation timing without engine timing context

```typescript
// BAD: testing animation in isolation
test('hop takes 800ms', () => {
  const anim = startMoveAnimation(agentId, fromHex, toHex, 0);
  expect(anim.duration).toBe(800);
});
// This proves the constant is set. It does NOT prove the animation
// timing is compatible with the engine tick rate.
```

**Fix:** Contract test: "engine tick produces hex change → animation system creates valid hop → hop duration is compatible with tick interval."

## Checklist: Before Submitting Engine/HexMap Changes

Run through this before marking a task as done:

- [ ] All unit tests pass (`npm test`)
- [ ] Type check clean (`npx tsc --noEmit`)
- [ ] Contract tests pass for affected boundaries (`npm test -- --grep "contract"`)
- [ ] If phase ordering changed → orchestrator integration test exists and passes
- [ ] If `MovementState` changed → verified all 15 consumer files handle new shape (see blast radius in road-aware-movement design doc)
- [ ] If HexMapV2 data flow changed → visual verification at `?view=game&seeded` at all zoom tiers
- [ ] No new `describe.skip` blocks added without a tracking issue in BACKLOG.md
- [ ] No new `vi.mock` at integration boundaries without a corresponding contract test
- [ ] PRNG is seeded in all new movement/decision tests
