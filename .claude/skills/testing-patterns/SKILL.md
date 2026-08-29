---
name: testing-patterns
description: >
  Use when writing tests for engine or HexMapV2 changes, especially when modifications cross
  module boundaries. Triggers on "write tests", "contract test", "integration test",
  "movement test", "hexmap test", "regression test", or when implementing changes that touch
  3+ files across src/engine/ and src/components/. Also load when reviewing test coverage
  or diagnosing why a change broke downstream systems.
last_validated_against: 2026-08-29
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

These are the highest-risk untested boundaries. Address them opportunistically when working in related code. **Verify a gap still exists before working it** — three of the original "Critical" entries were found already-closed by the 2026-08-29 round-4 audit (`MovementTrailMesh.test.ts` exists, `movement-integration.test.ts` runs un-skipped, `agent-decision-pipeline.contract.test.ts` exists in a 20-file contracts dir) and had been sending agents to write tests that already existed.

### Critical (breaks are silent and hard to diagnose)

1. **Orchestrator doesn't test movement phases.** The 3,973-line orchestrator has few integration tests — none run a full tick with agent movement. Add: "agent with movement queue advances after tick", "agent arrives and enters decision phase", "10-tick journey completes correctly."

### High (breaks are visible but root cause is obscure)

2. **No contract: movement state → animation.** `HexMapV2.tsx` detects hex changes by diffing agent props. If `MovementState` shape changes break the diff logic, agents stop animating. Test: movement state transition produces detectable hex change in agent props.

3. **Road network → pathfinding is mock-isolated.** `roadNetwork.test.ts` mocks `findHexPath` entirely. Real road generation + real pathfinding are never tested together. A bug in hex path format would pass road tests and fail pathfinding.

### Medium (breaks are caught by visual QA but waste time)

4. **No PRNG seed in phase tests.** `phaseMovement.test.ts` and `phaseAgentDecision.test.ts` don't seed the PRNG. Non-deterministic tests hide ordering-dependent bugs that appear only on certain seeds.

5. **Only tiny test graphs.** Most movement tests use 2–5 node graphs; the real map runs hundreds of place-tier locations (seed 42: small 131 … epic 791). At minimum, one test per system should use a 20+ node graph to catch topology edge cases.

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

### ❌ Probes and guards that cannot fail (vacuous verification)

The 2026-07-31 retro found 16 fresh instances of one shape: a check whose pass condition is
"no bad rows found", run against a population that is silently empty — so it passes when the
feature works, *and* passes when the feature is entirely disconnected.

```typescript
// BAD: passes vacuously when selector() matches nothing (impediment #241)
const bad = candidates.filter(selector).filter(isBroken);
expect(bad).toHaveLength(0);

// BAD: both sides authored by the test — cannot detect the wiring being dead (#288, #296)
expect(myLabelTable[key]).toBe(EXPECTED_LABELS[key]); // both defined in this test file

// BAD: the guard filters out its own population in the expression that tests it (#282)
```

**Fix — falsify the probe before trusting it:** first assert the population is non-empty
(`expect(candidates.filter(selector).length).toBeGreaterThan(0)`), then assert the property.
For a manual verification probe (CLI `eval`, `__DEBUG` query), make it fail once on purpose —
break the thing it checks, or query a known-bad row — before believing its PASS. A green
check you have never seen red proves only that the check ran. Related: assert against the
*production* export, never a fixture copy of it (a copied table verifies fiction), and pin
closed sets with `toEqual` on the real producer's output so a new member fails loud.

## Your test does not get a fresh module registry (THR-940)

Most tests now share a worker. `vitest.config.ts` runs the suite as three projects and the
big one — every node-environment test that does not mock modules, ~86% of the suite — sets
`isolate: false`, so the module graph is imported **once per worker** rather than once per
file. That is the whole speedup: a full run used to spend more time importing (`573s`) than
running tests (`341s`).

**Routing is automatic. You do not annotate anything.** `scripts/vitest-test-partition.ts`
scans every test file and routes it by two mechanical predicates: a non-node
`@vitest-environment` docblock sends it to the isolated `dom` project, and any use of
`vi.mock` / `vi.doMock` sends it to the isolated `node-isolated` project. Both are scanned
rather than inferred from paths, because the paths do not agree with reality — 68
node-environment tests live under `src/components/` and 6 jsdom tests live outside it.

What this changes for you, when you write a node test that does not mock:

- **Module-scope mutable state leaks between test files.** A module-level cache, counter, or
  registry populated by an earlier file is still populated when yours runs. This is the same
  hazard CLAUDE.md names under *Load-Bearing Architectural Decisions* — engine caches must be
  owned per session, not stored at module scope — and `isolate: false` is what makes it
  observable. If your test only passes alone, that is the finding, not an inconvenience:
  something outlives its session. Prefer a reset hook on the offending cache over a
  `beforeEach` that hides it.
- **`vi.mock` is not an option in the shared pool**, and adding one moves your file to the
  isolated project automatically. This matters because the failure it prevents is silent: with
  a shared registry the first importer of the real module wins and the mock never applies, so
  an assertion can **pass for the wrong reason** rather than crash (see
  `grantedTraitConsumers.test.ts`, THR-940).
- **A file that genuinely cannot be fixed cheaply may be pinned** via `ISOLATED_PINS` in the
  partition module — but only with an inline comment naming the observed failure and a
  Deferral issue tracking its removal (THR-949 holds the current two). An unexplained pin is
  indistinguishable from a test quietly opted out of the fast path.

`npm test` still runs all three projects as one command; the CI job name
`Test · Typecheck · Build` is a required status check and must not move.

## Checklist: Before Submitting Engine/HexMap Changes

> **This checklist covers test discipline only. The full pre-commit gate law is
> [`Docs/canon/verification-gates.md`](../../../Docs/canon/verification-gates.md)** — classify the
> diff first (`npm run classify:diff`); any `src/engine/` touch also owes the **30-tick CLI engine
> smoke** (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`); and the
> tree-diffing freshness gates (`check:generated-freshness`, `check:wiki-freshness:blocking`,
> a ratchet `--update`) run **last, after every closeout edit, immediately before `git push`**.
> Passing this checklist without that page's gates is not done.

Run through this before marking a task as done:

- [ ] All unit tests pass (`npm test`)
- [ ] Type check via `npm run check:typecheck` — **never `npx tsc --noEmit`**, which is a
      no-op here (the root `tsconfig.json` sets `files: []`, so it exits 0 unconditionally
      no matter how broken the code is; citing that exit 0 is gate theater, THR-686).
      `check:typecheck` is the same ratchet CI runs (THR-693): it compares the error count
      against `typecheck-baseline.json` and fails only on an **increase**, so a local pass
      means CI passes. The ~3529 pre-existing errors (THR-489) are not yours to fix. If you
      legitimately change the count, refresh with `npm run check:typecheck -- --update` and
      commit the baseline, saying why.
- [ ] Production build succeeds (`npx vite build`)
- [ ] Contract tests pass for affected boundaries (`npm test -- --grep "contract"`)
- [ ] If phase ordering changed → orchestrator integration test exists and passes
- [ ] If `MovementState` changed → verified all 15 consumer files handle new shape (see blast radius in road-aware-movement design doc)
- [ ] If HexMapV2 data flow changed → visual verification at `?view=game&seeded&size=medium` at all zoom tiers (bare `&seeded` derives the `large` map that stalls the tick loop — THR-162/163/164/165; see hexmap-layers)
- [ ] No new `describe.skip` blocks added without a tracking issue in Linear (Threadbare team)
- [ ] No new `vi.mock` at integration boundaries without a corresponding contract test
- [ ] PRNG is seeded in all new movement/decision tests
