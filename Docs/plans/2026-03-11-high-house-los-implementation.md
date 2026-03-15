# High House Line-of-Sight Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** High House agents permanently share line of sight with the player; sight ranges are modifier-aware and set to meaningful non-zero defaults.

**Architecture:** Bump three placeholder constants to real values; add a `ScryTarget` type that carries `agentId` alongside `HexCoord`; thread `agentId` through `getScryTargetHexes` → `collectLOSSources` so `getModifiedValue` can be called for scry agents the same way it already is for retinue agents.

**Tech Stack:** TypeScript, Vitest. No new dependencies.

---

### Task 1: Bump sight range constants and add `ScryTarget` type

**Files:**
- Modify: `src/types/visibility.ts`

**Step 1: Write the failing type-level test first**

Add to `src/types/__tests__/visibility.test.ts` (or create it if it doesn't exist — check first with `ls src/types/__tests__/`):

```ts
import { AVATAR_SIGHT_RANGE, AGENT_SIGHT_RANGE, SCRY_SIGHT_RANGE } from '../visibility';

describe('visibility constants', () => {
  it('AVATAR_SIGHT_RANGE is > 0', () => {
    expect(AVATAR_SIGHT_RANGE).toBeGreaterThan(0);
  });
  it('AGENT_SIGHT_RANGE is > 0', () => {
    expect(AGENT_SIGHT_RANGE).toBeGreaterThan(0);
  });
  it('SCRY_SIGHT_RANGE is > 0', () => {
    expect(SCRY_SIGHT_RANGE).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/types/__tests__/visibility.test.ts
```
Expected: 3 FAILs ("expected 0 to be greater than 0")

**Step 3: Apply changes to `src/types/visibility.ts`**

Add import at top of file:
```ts
import type { HexCoord } from './index';
```

Add new interface after the `LOSSource` interface:
```ts
/** An agent assigned to the Scry Court, carrying their agentId for modifier lookup. */
export interface ScryTarget {
  coord: HexCoord;
  agentId: string;
}
```

Change the three constants:
```ts
export const AVATAR_SIGHT_RANGE = 3;
export const AGENT_SIGHT_RANGE = 2;
export const SCRY_SIGHT_RANGE = 2;
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/types/__tests__/visibility.test.ts
```
Expected: 3 PASSes

**Step 5: Run the full test suite to catch any snapshot-hardcoded `range: 0` assertions**

```bash
npx vitest run src/engine/__tests__/visibility.test.ts src/engine/__tests__/visibility-modifiers.test.ts
```
Expected: Some failures — the existing tests that hardcode `range: 0` will break. Note which tests fail; they are fixed in Tasks 3 and 4.

**Step 6: Commit**

```bash
git add src/types/visibility.ts src/types/__tests__/visibility.test.ts
git commit -m "feat: add ScryTarget type and bump fog-of-war sight range constants"
```

---

### Task 2: Change `getScryTargetHexes` to return `ScryTarget[]`

**Files:**
- Modify: `src/engine/visibility.ts`

**Step 1: Write the failing test**

Add a new describe block to `src/engine/__tests__/visibility.test.ts`:

```ts
import { getScryTargetHexes } from '../visibility';
import { createScryState, initializeCourt, assignAgentToPosition } from '../scry';
import type { ScryTarget } from '../../types/visibility';

describe('getScryTargetHexes', () => {
  it('returns empty array when scry court is not initialized', () => {
    const { graph } = buildTestGraph(5, 7);
    const scryState = createScryState();
    const targets = getScryTargetHexes(scryState, graph);
    expect(targets).toHaveLength(0);
  });

  it('returns ScryTarget with coord and agentId for each assigned position', () => {
    const graph = new WorldGraph();

    // Set up agent at a known hex
    const agentId = 'agent.scout';
    const locId = 'loc.outpost';
    graph.addNode({ id: agentId, type: 'actor', name: 'Scout', properties: {} });
    graph.addNode({
      id: locId, type: 'location', name: 'Outpost',
      properties: { hexCol: 8, hexRow: 4, locationType: 'settlement' },
    });
    graph.addEdge({ id: 'e.located', source: agentId, target: locId, type: 'located_at', properties: {} });

    // Build scry state with the agent assigned
    let scryState = createScryState();
    scryState = initializeCourt(scryState, 'high_house');

    // Create a dummy title to satisfy assignAgentToPosition
    const dummyTitle = {
      id: 'title.test',
      name: 'The Watcher',
      rank: 'outer' as const,
      sphereAffinity: 'mind' as const,
      domainAffinity: 'eye' as const,
      bonuses: [],
      weaknesses: [],
      flavorText: '',
      generationSeed: { agentId, positionRank: 'outer' as const, structureType: 'high_house' as const, seed: 1 },
    };
    const outerPos = scryState.positions.find(p => p.rank === 'outer')!;
    scryState = assignAgentToPosition(scryState, outerPos.id, agentId, dummyTitle, 10, 1);

    const targets = getScryTargetHexes(scryState, graph);
    expect(targets).toHaveLength(1);
    expect(targets[0].agentId).toBe(agentId);
    expect(targets[0].coord).toEqual({ col: 8, row: 4 });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/__tests__/visibility.test.ts
```
Expected: FAIL — `targets[0].agentId` is `undefined` because the current return type is `HexCoord[]` not `ScryTarget[]`.

**Step 3: Change `getScryTargetHexes` in `src/engine/visibility.ts`**

Update the import at the top to include `ScryTarget`:
```ts
import type { VisibilityMap, LOSSource, HexVisibility, StaleSnapshot, ScryTarget } from '../types/visibility';
```
Remove `HexCoord` from that import if it was there (it comes from `'../types'` which stays).

Change the function signature and body:
```ts
export function getScryTargetHexes(scryState: ScryState, graph: WorldGraph): ScryTarget[] {
  const targets: ScryTarget[] = [];
  if (!scryState.initialized) return targets;

  for (const position of scryState.positions) {
    if (!position.assignedAgentId) continue;

    const agent = graph.getNode(position.assignedAgentId);
    if (!agent) continue;

    const locEdges = graph.getOutgoingEdges(position.assignedAgentId, 'located_at');
    if (locEdges.length === 0) continue;

    const loc = graph.getNode(locEdges[0].target);
    if (!loc || loc.type !== 'location') continue;

    const hexCol = loc.properties.hexCol as number | undefined;
    const hexRow = loc.properties.hexRow as number | undefined;
    if (hexCol !== undefined && hexRow !== undefined) {
      targets.push({ coord: { col: hexCol, row: hexRow }, agentId: position.assignedAgentId });
    }
  }

  return targets;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/engine/__tests__/visibility.test.ts
```
Expected: All visibility.test.ts tests pass (note: the `collectLOSSources` scry target test may still fail because it passes `HexCoord[]` — that's fixed in Task 3).

**Step 5: Commit**

```bash
git add src/engine/visibility.ts src/engine/__tests__/visibility.test.ts
git commit -m "feat: getScryTargetHexes returns ScryTarget[] preserving agentId"
```

---

### Task 3: Update `collectLOSSources` to accept `ScryTarget[]` and use modifier pipeline

**Files:**
- Modify: `src/engine/visibility.ts`

**Step 1: Write the failing test**

In `src/engine/__tests__/visibility-modifiers.test.ts`, replace the existing
`'collectLOSSources keeps scry targets at static range'` test with:

```ts
it('scry agent uses SCRY_SIGHT_RANGE as base (no modifiers)', () => {
  graph.addNode({ id: 'asc1', type: 'ascendant', name: 'Player God', properties: {} });
  graph.addNode({ id: 'agent1', type: 'actor', name: 'Watcher', properties: {} });
  // No trait, no terrain modifier — should use base SCRY_SIGHT_RANGE

  const scryTargets: ScryTarget[] = [{ coord: { col: 7, row: 7 }, agentId: 'agent1' }];
  const sources = collectLOSSources(graph, 'asc1', scryTargets);
  expect(sources).toHaveLength(1);
  expect(sources[0].range).toBe(SCRY_SIGHT_RANGE);
});

it('scry agent with Eagle-Eyed trait gets increased sight range', () => {
  graph.addNode({ id: 'asc1', type: 'ascendant', name: 'Player God', properties: {} });
  graph.addNode({ id: 'agent1', type: 'actor', name: 'Watcher', properties: {} });
  graph.addNode({ id: 'trait1', type: 'trait', name: 'Eagle-Eyed', properties: {} });
  graph.addEdge({
    id: 'e1', source: 'agent1', target: 'trait1',
    type: 'has_trait', properties: { modifiers: { los_range: 1 } },
  });

  const scryTargets: ScryTarget[] = [{ coord: { col: 7, row: 7 }, agentId: 'agent1' }];
  const sources = collectLOSSources(graph, 'asc1', scryTargets);
  expect(sources).toHaveLength(1);
  expect(sources[0].range).toBe(SCRY_SIGHT_RANGE + 1);
});
```

Add `ScryTarget` to the import at the top of the test file:
```ts
import type { ScryTarget } from '../../types/visibility';
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/__tests__/visibility-modifiers.test.ts
```
Expected: TypeScript error or runtime FAIL — `collectLOSSources` still expects `HexCoord[]`.

**Step 3: Update `collectLOSSources` in `src/engine/visibility.ts`**

Change the third parameter type:
```ts
export function collectLOSSources(
  graph: WorldGraph,
  ascendantId: string,
  scryTargets: ScryTarget[],
): LOSSource[] {
```

Change the scry targets loop at the bottom of the function:
```ts
  // Scry targets — modifier-aware, same pipeline as retinue agents
  for (const target of scryTargets) {
    sources.push({
      hexCol: target.coord.col,
      hexRow: target.coord.row,
      range: getModifiedValue(graph, target.agentId, 'los_range', SCRY_SIGHT_RANGE),
    });
  }
```

Remove the old comment "Scry targets use static range — no node ID for modifier resolution".

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/engine/__tests__/visibility-modifiers.test.ts
```
Expected: All visibility-modifiers tests pass.

**Step 5: Commit**

```bash
git add src/engine/visibility.ts src/engine/__tests__/visibility-modifiers.test.ts
git commit -m "feat: scry targets use modifier-aware LOS range via getModifiedValue"
```

---

### Task 4: Fix `orchestrator.ts` and update broken callers

**Files:**
- Modify: `src/engine/orchestrator.ts`
- Possibly check: `src/components/Game/hooks/useSimulation.ts`, `src/components/Game/hooks/useViewNavigation.ts`

**Step 1: Check compiler errors first**

```bash
npx tsc --noEmit
```
Expected: errors pointing at `runTick` parameter type and any `collectLOSSources` callsites that still pass `HexCoord[]`. Read the list carefully.

**Step 2: Update `runTick` signature in `src/engine/orchestrator.ts`**

Add import near the top:
```ts
import type { ScryTarget } from '../types/visibility';
```

Change the function signature (line ~960):
```ts
export function runTick(state: GameState, scryTargets: ScryTarget[] = []): GameState {
```

**Step 3: Check `useViewNavigation.ts`**

Open `src/components/Game/hooks/useViewNavigation.ts`. It calls:
```ts
const scryTargets = getScryTargetHexes(scryState, gameState.graph);
const losSources = collectLOSSources(gameState.graph, gameState.ascendantId, scryTargets);
```
Because `getScryTargetHexes` now returns `ScryTarget[]` and `collectLOSSources` now expects `ScryTarget[]`, this call chain already typechecks — no manual edit needed. TypeScript will confirm.

**Step 4: Run full type check**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

**Step 5: Run full test suite**

```bash
npx vitest run
```
Expected: All tests pass. (The `visibility-integration.test.ts` calls `runTick(gs1)` with no scry targets — the default `[]` still works because `ScryTarget[]` is assignable to the empty default.)

**Step 6: Commit**

```bash
git add src/engine/orchestrator.ts
git commit -m "fix: update runTick scryTargets param to ScryTarget[] for type safety"
```

---

### Task 5: Fix tests that hard-coded `range: 0`

**Files:**
- Modify: `src/engine/__tests__/visibility.test.ts`

**Step 1: Run the visibility tests to see what's still failing**

```bash
npx vitest run src/engine/__tests__/visibility.test.ts
```
Expected: The test `'includes scry targets'` fails with `received { hexCol: 15, hexRow: 10, range: 0 }` vs `expected { hexCol: 15, hexRow: 10, range: 2 }`.

Also the test `'With range 0, adjacent hexes are NOT visible'` / `'only the avatar's own hex is visible'` will now fail because `AVATAR_SIGHT_RANGE = 3` means adjacent hexes ARE visible. Update those expectations.

**Step 2: Fix `'includes scry targets'` test**

Find in `visibility.test.ts`:
```ts
it('includes scry targets', () => {
  const { graph, ascendantId } = buildTestGraph(5, 7);
  const scryTargets = [{ col: 15, row: 10 }];
  const sources = collectLOSSources(graph, ascendantId, scryTargets);
  expect(sources.length).toBeGreaterThanOrEqual(2); // avatar + scry
  expect(sources).toContainEqual({ hexCol: 15, hexRow: 10, range: 0 });
});
```

Replace with:
```ts
it('includes scry targets with modifier-aware range', () => {
  const { graph, ascendantId } = buildTestGraph(5, 7);
  // Add a scry agent node (no modifiers — should use base SCRY_SIGHT_RANGE)
  graph.addNode({ id: 'agent.scry', type: 'actor', name: 'Courtier', properties: {} });
  const scryTargets: ScryTarget[] = [{ coord: { col: 15, row: 10 }, agentId: 'agent.scry' }];
  const sources = collectLOSSources(graph, ascendantId, scryTargets);
  expect(sources.length).toBeGreaterThanOrEqual(2); // avatar + scry
  expect(sources).toContainEqual({ hexCol: 15, hexRow: 10, range: SCRY_SIGHT_RANGE });
});
```

Add `ScryTarget` and `SCRY_SIGHT_RANGE` to the imports at the top of `visibility.test.ts`:
```ts
import { visKey, AVATAR_SIGHT_RANGE, AGENT_SIGHT_RANGE, SCRY_SIGHT_RANGE } from '../../types/visibility';
import type { ScryTarget } from '../../types/visibility';
```

**Step 3: Fix tests that asserted range-0 behaviour**

Find tests with comments like `'With range 0, adjacent hexes are NOT visible'`. Update them to reflect the new `AVATAR_SIGHT_RANGE = 3` — nearby hexes ARE now visible. Replace:
```ts
// With range 0, adjacent hexes are NOT visible
expect(next.get(visKey(6, 7))?.state).toBe('unexplored');
expect(next.get(visKey(4, 7))?.state).toBe('unexplored');
```
With:
```ts
// With range 3, immediately adjacent hexes ARE visible
expect(next.get(visKey(6, 7))?.state).toBe('visible');
expect(next.get(visKey(4, 7))?.state).toBe('visible');
// But far hexes are still unexplored
expect(next.get(visKey(0, 0))?.state).toBe('unexplored');
```

Similarly update `'only the avatar\'s own hex is visible'` description to reflect actual range.

**Step 4: Run visibility tests**

```bash
npx vitest run src/engine/__tests__/visibility.test.ts
```
Expected: All pass.

**Step 5: Run full suite to confirm nothing else broke**

```bash
npx vitest run
```
Expected: All pass.

**Step 6: Commit**

```bash
git add src/engine/__tests__/visibility.test.ts
git commit -m "test: update visibility tests for non-zero sight ranges and ScryTarget type"
```

---

### Task 6: Final verification

**Step 1: Full type check + test run**

```bash
npx tsc --noEmit && npx vitest run
```
Expected: 0 type errors, all tests green.

**Step 2: Sanity-check the behaviour mentally**

Confirm the chain: `assignAgentToPosition` → `scryState.positions[i].assignedAgentId` set →
`getScryTargetHexes` returns `ScryTarget[]` with that agentId → `doTick` passes targets to
`runTick` → `collectLOSSources` calls `getModifiedValue(graph, agentId, 'los_range', 2)` →
`recalcVisibility` marks their hex + 2-hex radius as `visible` each tick.

**Step 3: Commit final state**

```bash
git add -A
git commit -m "feat: High House agents share line of sight with player (modifier-aware fog of war)"
```
