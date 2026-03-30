# Avatar Tick-Based Movement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace instant avatar teleportation with the existing tick-based movement system so the avatar moves hex-by-hex like any other agent, with route visualization on the hex map.

**Architecture:** The avatar is already an `actorType: 'individual'` node, and `phaseMovement` already iterates all individuals. We just need to: (1) set a `MovementState` on the avatar when the player picks a destination instead of teleporting, (2) let the existing tick loop advance it, (3) add route visualization to the hex map. The avatar's candidate-generation logic (motivation, re-evaluation) is skipped — the player is the decision-maker.

**Tech Stack:** React, TypeScript, Vitest, SVG (hex map rendering)

**Design doc:** `Docs/plans/2026-03-16-avatar-tick-movement-design.md`

---

### Task 1: Rewrite `moveAvatarToHex` to set MovementState instead of teleporting

**Files:**
- Modify: `src/engine/avatarMove.ts` (full rewrite)
- Test: `src/engine/__tests__/avatarMove.test.ts`

**Step 1: Update the existing test file**

Read `src/engine/__tests__/avatarMove.test.ts` first. Then rewrite the tests. The new function signature changes to accept `graph`, `ascendantId`, `targetHex`, and `currentTick`. Tests should verify:

```typescript
import { moveAvatarToHex } from '../avatarMove';
import { createGraph } from '../graph';
import type { MovementState } from '../../types/movement';

// Helper: build a minimal graph with avatar at loc.start, target at loc.end,
// with an 'adjacent' edge between them.
function buildTestGraph() {
  const graph = createGraph();
  graph.addNode({ id: 'asc.1', type: 'ascendant', name: 'God', properties: {} });
  graph.addNode({ id: 'avatar.1', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'e.avatar_of', source: 'avatar.1', target: 'asc.1', type: 'avatar_of', properties: {} });

  graph.addNode({ id: 'loc.start', type: 'location', name: 'Start', properties: { hexCol: 0, hexRow: 0, terrain: 'grassland', locationType: 'wilderness' } });
  graph.addNode({ id: 'loc.end', type: 'location', name: 'End', properties: { hexCol: 1, hexRow: 0, terrain: 'grassland', locationType: 'wilderness' } });
  graph.addEdge({ id: 'e.adj', source: 'loc.start', target: 'loc.end', type: 'adjacent', properties: {} });
  graph.addEdge({ id: 'e.adj.rev', source: 'loc.end', target: 'loc.start', type: 'adjacent', properties: {} });
  graph.addEdge({ id: 'e.loc', source: 'avatar.1', target: 'loc.start', type: 'located_at', properties: {} });

  return graph;
}

describe('moveAvatarToHex (tick-based)', () => {
  it('sets MovementState on avatar node with path to target', () => {
    const graph = buildTestGraph();
    const result = moveAvatarToHex(graph, 'asc.1', { col: 1, row: 0 }, 0);
    expect(result).toBe(true); // path found
    const avatar = graph.getNode('avatar.1')!;
    const ms = avatar.properties.movementState as MovementState;
    expect(ms.destinationId).toBe('loc.end');
    expect(ms.movementQueue).toEqual(['loc.end']);
    expect(ms.ticksAccumulated).toBe(0);
  });

  it('returns false when no path exists (impassable)', () => {
    const graph = buildTestGraph();
    // Make destination ocean (impassable)
    graph.updateNode('loc.end', { properties: { ...graph.getNode('loc.end')!.properties, terrain: 'ocean' } });
    const result = moveAvatarToHex(graph, 'asc.1', { col: 1, row: 0 }, 0);
    expect(result).toBe(false);
  });

  it('does NOT change located_at edge (avatar stays put until ticks advance)', () => {
    const graph = buildTestGraph();
    moveAvatarToHex(graph, 'asc.1', { col: 1, row: 0 }, 0);
    const locEdges = graph.getOutgoingEdges('avatar.1', 'located_at');
    expect(locEdges[0].target).toBe('loc.start'); // Still at start
  });

  it('creates transient location if no location at target hex', () => {
    const graph = buildTestGraph();
    // Remove end location, add a hex with no location
    graph.removeNode('loc.end');
    // Need a mid-node with adjacent edges for pathfinding — skip, test the transient creation separately
    const result = moveAvatarToHex(graph, 'asc.1', { col: 99, row: 99 }, 0);
    expect(result).toBe(false); // No path to nonexistent hex
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/avatarMove.test.ts`
Expected: FAIL — the old `moveAvatarToHex` has different signature (no `currentTick`, returns `void`)

**Step 3: Rewrite `src/engine/avatarMove.ts`**

```typescript
/**
 * Avatar Movement Handler (Tick-Based)
 *
 * Sets up a MovementState on the avatar so the tick loop advances it
 * like any other agent. Does NOT teleport — the avatar stays at its
 * current location until ticks execute the path.
 */

import type { WorldGraph } from './graph';
import type { HexCoord } from '../types';
import type { MovementState } from '../types/movement';
import { findShortestPath } from './pathfinding';
import { computeEdgeCost } from './movementCost';
import { initMovementState } from './movementExecution';

/**
 * Plan avatar movement to a target hex.
 * Finds the shortest path and sets a MovementState on the avatar node.
 * Returns true if a valid path was found, false otherwise.
 *
 * The avatar does NOT move immediately — movement executes via phaseMovement ticks.
 */
export function moveAvatarToHex(
  graph: WorldGraph,
  ascendantId: string,
  targetHex: HexCoord,
  currentTick: number,
): boolean {
  // Find avatar via incoming avatar_of edge
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  if (avatarEdges.length === 0) return false;
  const avatarId = avatarEdges[0].source;

  // Get current location
  const locEdges = graph.getOutgoingEdges(avatarId, 'located_at');
  if (locEdges.length === 0) return false;
  const currentLocId = locEdges[0].target;

  // Find or create target location
  let targetLocId: string | null = null;
  const allLocations = graph.getNodesByType('location');
  for (const loc of allLocations) {
    const hexCol = loc.properties.hexCol as number | undefined;
    const hexRow = loc.properties.hexRow as number | undefined;
    if (hexCol === targetHex.col && hexRow === targetHex.row) {
      targetLocId = loc.id;
      break;
    }
  }

  // If no location exists, create a transient one
  if (!targetLocId) {
    targetLocId = `loc.transient.${targetHex.col}.${targetHex.row}`;
    if (!graph.getNode(targetLocId)) {
      graph.addNode({
        id: targetLocId,
        type: 'location',
        name: `Wilderness (${targetHex.col}, ${targetHex.row})`,
        properties: {
          hexCol: targetHex.col,
          hexRow: targetHex.row,
          locationType: 'wilderness',
        },
      });
    }
  }

  // Already there
  if (currentLocId === targetLocId) return false;

  // Find shortest path
  const pathResult = findShortestPath(graph, avatarId, currentLocId, targetLocId);
  if (!pathResult || pathResult.path.length === 0) return false;

  // Compute first edge cost
  const firstEdgeCost = computeEdgeCost(graph, avatarId, currentLocId, pathResult.path[0]).totalCost;

  // Initialize movement state
  const movementState: MovementState = initMovementState(
    targetLocId,
    pathResult.path,
    firstEdgeCost,
    currentTick,
  );

  // Set on avatar node
  const avatarNode = graph.getNode(avatarId)!;
  graph.updateNode(avatarId, {
    properties: { ...avatarNode.properties, movementState },
  });

  return true;
}

/**
 * Get the avatar's current movement state, if any.
 */
export function getAvatarMovementState(
  graph: WorldGraph,
  ascendantId: string,
): MovementState | null {
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  if (avatarEdges.length === 0) return null;
  const avatarId = avatarEdges[0].source;
  const avatarNode = graph.getNode(avatarId);
  if (!avatarNode) return null;
  return (avatarNode.properties.movementState as MovementState) ?? null;
}

/**
 * Clear the avatar's movement state (cancel movement).
 */
export function clearAvatarMovement(
  graph: WorldGraph,
  ascendantId: string,
): void {
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  if (avatarEdges.length === 0) return;
  const avatarId = avatarEdges[0].source;
  const avatarNode = graph.getNode(avatarId);
  if (!avatarNode) return;
  const { movementState: _, ...rest } = avatarNode.properties;
  graph.updateNode(avatarId, { properties: rest });
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/avatarMove.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/avatarMove.ts src/engine/__tests__/avatarMove.test.ts
git commit -m "feat(movement): rewrite moveAvatarToHex to set MovementState instead of teleporting"
```

---

### Task 2: Exclude avatar from autonomous re-evaluation in `phaseMovement`

The avatar should be ticked (movement advanced) but should NOT have its destination re-evaluated by the AI candidate system. The player controls where the avatar goes.

**Files:**
- Modify: `src/engine/phaseMovement.ts:48-50` (add avatar exclusion from re-evaluation, but still tick movement)
- Test: `src/engine/__tests__/phaseMovement.test.ts`

**Step 1: Write the failing test**

Add a test to the existing test file:

```typescript
it('ticks avatar movement but does not re-evaluate destination', () => {
  // Setup: avatar with active movementState pointing to a destination
  // After phaseMovement, the avatar's movement should advance (ticksAccumulated++)
  // but the destination should NOT change even if better candidates exist
});
```

The test should:
1. Create a graph with an avatar that has a MovementState with a queue
2. Run `phaseMovement`
3. Verify the avatar's ticksAccumulated incremented (movement processed)
4. Verify the avatar's destinationId did NOT change (no re-evaluation)

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/phaseMovement.test.ts`

**Step 3: Modify `phaseMovement.ts`**

At the top of the `for (const actor of agents)` loop (line ~52), identify if this actor is the avatar. If it is, only tick its movement — skip the candidate re-evaluation and mid-path re-evaluation blocks.

```typescript
// At the start of the for loop, after getting actorId:
const isAvatar = graph.getOutgoingEdges(actorId, 'avatar_of').length > 0;
```

Then guard the re-evaluation sections:
- Mid-path re-evaluation (lines ~84-143): wrap in `if (!isAvatar) { ... }`
- Case 2 destination re-evaluation (lines ~147-239): wrap in `if (!isAvatar) { continue; }` at the top

The avatar's movement queue still gets ticked by the Case 1 block (lines ~59-65).

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/phaseMovement.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/phaseMovement.ts src/engine/__tests__/phaseMovement.test.ts
git commit -m "feat(movement): tick avatar movement but skip autonomous re-evaluation"
```

---

### Task 3: Update `useViewNavigation` to use tick-based movement

**Files:**
- Modify: `src/components/Game/hooks/useViewNavigation.ts:116-130`

**Step 1: No new test needed** — this is a React hook wiring change. The behavior is: clicking a hex in move mode calls the new `moveAvatarToHex` (with `currentTick`), and move mode turns off.

**Step 2: Update `handleHexClickMove`**

The current code (line 116-130) calls `moveAvatarToHex(gameState.graph, gameState.ascendantId, coord)` and then immediately recalculates visibility. The new version:

1. Calls `moveAvatarToHex(gameState.graph, gameState.ascendantId, coord, gameState.tick)` — adds `currentTick` param
2. Does NOT recalculate visibility (avatar hasn't moved yet — it's just planned)
3. Still calls `setMoveMode(false)`
4. Triggers a re-render so the route visualization appears

```typescript
const handleHexClickMove = useCallback((coord: { col: number; row: number }) => {
  if (moveMode) {
    const success = moveAvatarToHex(gameState.graph, gameState.ascendantId, coord, gameState.tick);
    if (success) {
      setGameState(prev => ({ ...prev })); // Force re-render to show route
    }
    setMoveMode(false);
  } else {
    handleHexClick(coord);
  }
}, [moveMode, gameState.graph, gameState.ascendantId, gameState.tick, handleHexClick, setGameState]);
```

**Step 3: Ensure visibility recalculation happens on actual movement**

The visibility recalc should happen when the avatar actually moves (during tick processing), not when the route is planned. Check `src/engine/orchestrator.ts` — if `phaseMovement` emits an `agent_movement` event for the avatar, and the orchestrator already recalcs visibility after phases, this may be handled. If not, add visibility recalc after movement ticks.

Read `src/engine/orchestrator.ts` to verify. The orchestrator likely calls `recalcVisibility` after all phases. If it does, no change needed.

**Step 4: Run build**

Run: `npx tsc --noEmit`
Expected: PASS (the new signature adds a required param, so check all call sites compile)

**Step 5: Commit**

```bash
git add src/components/Game/hooks/useViewNavigation.ts
git commit -m "feat(movement): wire tick-based avatar movement in useViewNavigation"
```

---

### Task 4: Add route visualization to HexMap

This task adds two new visual layers to the hex map:
1. **Target hex indicator** — dashed ring + translucent fill on the destination hex
2. **Route path** — marching-dot polyline through intermediate hex centers

**Files:**
- Modify: `src/components/HexMap/HexMap.tsx` — add new props, CSS animations, and SVG overlays
- Modify: `src/components/HexMap/HexTile.tsx` — add target hex styling (similar to isAvatarHex)
- Modify: `src/components/Game/GameView.tsx` — pass route data to HexMap
- Modify: `src/components/Game/hooks/useAvatarData.ts` — compute route hex coords from MovementState

**Step 1: Add route computation to `useAvatarData`**

Add a new return field `avatarRoute` that extracts the planned path hex coordinates from the avatar's MovementState. This is the data the HexMap needs to render the route.

```typescript
// In useAvatarData.ts, add:
import { getAvatarMovementState } from '../../../engine/avatarMove';

// In the hook body:
const avatarMovementState = getAvatarMovementState(graph, ascendantId);

const avatarRoute = useMemo(() => {
  if (!avatarMovementState || avatarMovementState.movementQueue.length === 0) return null;
  // Extract hex coords for each node in the movement queue
  const routeHexes: { col: number; row: number }[] = [];
  for (const nodeId of avatarMovementState.movementQueue) {
    const node = graph.getNode(nodeId);
    if (node && node.properties.hexCol != null && node.properties.hexRow != null) {
      routeHexes.push({ col: node.properties.hexCol as number, row: node.properties.hexRow as number });
    }
  }
  return routeHexes.length > 0 ? routeHexes : null;
}, [avatarMovementState, graph]);

// Also extract the target hex (last in route):
const avatarTargetHex = avatarRoute ? avatarRoute[avatarRoute.length - 1] : null;

// Add to return: avatarRoute, avatarTargetHex
```

**Step 2: Pass route data through GameView to HexMap**

In `GameView.tsx`, destructure `avatarRoute` and `avatarTargetHex` from `useAvatarData` and pass them as new props to the `HexMap` component.

**Step 3: Add target hex indicator to `HexTile.tsx`**

Add a new prop `isTargetHex?: boolean` alongside `isAvatarHex`. When true, render:

```tsx
{isTargetHex && sphereColor && (
  <>
    <polygon points={points} fill={sphereColor} opacity={0.12} />
    <polygon
      points={points}
      fill="none"
      stroke={sphereColor}
      strokeWidth={2.5}
      strokeDasharray="8,4"
      className="target-dash"
    />
  </>
)}
```

Add this to all the render paths where `isAvatarHex` appears (visible land, visible water, remembered).

**Step 4: Add route polyline to `HexMap.tsx`**

Add new props to `HexMapProps`:

```typescript
avatarRoute?: { col: number; row: number }[];
avatarTargetHex?: { col: number; row: number };
```

Add CSS animations alongside the existing `avatar-breathe`:

```css
@keyframes target-march {
  to { stroke-dashoffset: -16; }
}
@keyframes route-march {
  to { stroke-dashoffset: -12; }
}
.target-dash {
  animation: target-march 1.5s linear infinite;
}
.route-dots {
  animation: route-march 0.8s linear infinite;
}
```

After the hex tile rendering loop, add a route overlay SVG group:

```tsx
{avatarRoute && avatarRoute.length > 1 && avatarPos && (
  <polyline
    points={[avatarPos, ...avatarRoute.slice(0, -1)]
      .map(h => { const p = hexToPixel(h, hexSize); return `${p.x},${p.y}`; })
      .join(' ')}
    fill="none"
    stroke={sphereColor}
    strokeWidth={2}
    strokeDasharray="4,6"
    strokeLinecap="round"
    className="route-dots"
    opacity={0.5}
  />
)}
```

Pass `isTargetHex` to each `HexTileComponent`:

```typescript
const isTarget = avatarTargetHex?.col === tile.coord.col && avatarTargetHex?.row === tile.coord.row;
// Pass as prop: isTargetHex={isTarget}
```

**Step 5: Run build and visual verification**

Run: `npx tsc --noEmit`
Then: `npm run dev` — manually verify the route appears when you click Move + hex.

**Step 6: Commit**

```bash
git add src/components/HexMap/HexMap.tsx src/components/HexMap/HexTile.tsx src/components/Game/GameView.tsx src/components/Game/hooks/useAvatarData.ts
git commit -m "feat(hex-map): add route visualization with target hex indicator and dotted path"
```

---

### Task 5: Handle visibility recalculation on avatar movement ticks

When the avatar actually moves to a new hex (via tick), visibility needs to be recalculated so fog-of-war updates.

**Files:**
- Read first: `src/engine/orchestrator.ts` — check if visibility recalc already happens after phases
- Possibly modify: `src/engine/orchestrator.ts` or the component that processes tick results

**Step 1: Read the orchestrator**

Check how phases are called and whether visibility is recalculated after `phaseMovement`. If the orchestrator already handles this, no changes needed for this task.

**Step 2: If needed, add avatar movement detection**

After `phaseMovement` runs, check if any `agent_movement` event was emitted for the avatar, and recalc visibility. This ensures the fog-of-war reveals new hexes as the avatar traverses the route.

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit if changes were needed**

```bash
git add src/engine/orchestrator.ts
git commit -m "fix(visibility): recalculate fog-of-war when avatar moves via tick"
```

---

### Task 6: Final integration test and cleanup

**Files:**
- Test: `src/engine/__tests__/avatarMove.test.ts` — add integration test
- Clean up: `Design/movement-indicator-mockups.html` — keep for reference
- Clean up: `.claude/launch.json` — remove mockups server entry

**Step 1: Write integration test**

Test the full flow: set movement state → run phaseMovement → verify avatar moves one step:

```typescript
it('full flow: moveAvatarToHex + phaseMovement ticks avatar to destination', () => {
  const graph = buildTestGraph(); // avatar at loc.start, adjacent to loc.end (grassland)
  // Plan movement
  moveAvatarToHex(graph, 'asc.1', { col: 1, row: 0 }, 0);
  // Run one tick — grassland base cost is 1 tick, so avatar should arrive
  const state = { graph, tick: 1, ascendantId: 'asc.1', tickEvents: [], /* ... */ };
  phaseMovement(state);
  // Verify avatar moved
  const locEdges = graph.getOutgoingEdges('avatar.1', 'located_at');
  expect(locEdges[0].target).toBe('loc.end');
});
```

**Step 2: Run all tests**

Run: `npm test`
Expected: All pass

**Step 3: Run build**

Run: `npx vite build`
Expected: Clean build

**Step 4: Clean up launch.json**

Remove the `mockups` server entry from `.claude/launch.json`.

**Step 5: Commit**

```bash
git add -A
git commit -m "test(movement): add avatar tick-movement integration test; clean up mockup artifacts"
```

---

## Execution Notes

- **Key insight:** `phaseMovement` already iterates the avatar (it's `actorType: 'individual'`). We just need to (a) skip the AI re-evaluation for the avatar and (b) set the initial `MovementState` from the UI instead of from candidate generation.
- **Risk area:** The visibility recalculation (Task 5). Currently it happens in `handleHexClickMove` after teleporting. With tick-based movement, it needs to happen per-tick when the avatar actually transitions hexes. Read the orchestrator carefully.
- **Testing strategy:** Unit tests for the rewritten `moveAvatarToHex`, behavior test for avatar exclusion from re-evaluation, integration test for the full flow. Visual verification for the route overlay (no automated test for SVG animations).
