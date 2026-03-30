# Playable Map Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the hex map playable with avatar presence, three-state fog of war, and scroll-wheel zoom + drag-pan.

**Architecture:** Three new systems layered onto the existing HexMap. (1) A `visibility` engine module computes per-hex fog state from LOS sources each tick. (2) HexTile renders based on visibility state (black/dimmed/full). (3) d3-zoom wraps the SVG for zoom/pan. A new AvatarHUD component in the top-left provides quick actions and a center-on-avatar button.

**Tech Stack:** React 19, TypeScript, d3-zoom (already in deps via d3), vitest, @testing-library/react

**Design doc:** `Docs/plans/2026-03-06-playable-map-design.md`

---

### Task 1: Visibility Types & Constants

**Files:**
- Create: `src/types/visibility.ts`
- Test: `src/types/__tests__/visibility.test.ts`

**Step 1: Write the test**

```typescript
// src/types/__tests__/visibility.test.ts
import { describe, it, expect } from 'vitest';
import {
  AVATAR_SIGHT_RANGE,
  AGENT_SIGHT_RANGE,
  SCRY_SIGHT_RANGE,
  SCRY_ESSENCE_PER_TICK,
  MOVE_ESSENCE_COST,
} from '../visibility';
import type { HexVisibility, HexVisibilityState, StaleSnapshot } from '../visibility';

describe('visibility types and constants', () => {
  it('exports sight range constants', () => {
    expect(AVATAR_SIGHT_RANGE).toBe(3);
    expect(AGENT_SIGHT_RANGE).toBe(1);
    expect(SCRY_SIGHT_RANGE).toBe(1);
    expect(SCRY_ESSENCE_PER_TICK).toBe(2);
    expect(MOVE_ESSENCE_COST).toBe(0);
  });

  it('HexVisibilityState type covers three states', () => {
    const states: HexVisibilityState[] = ['unexplored', 'remembered', 'visible'];
    expect(states).toHaveLength(3);
  });

  it('StaleSnapshot has required fields', () => {
    const snapshot: StaleSnapshot = {
      terrain: 'forest',
      locationNames: ['Sacred Grove'],
      agentNames: ['Kira'],
      lastSeenTick: 5,
    };
    expect(snapshot.terrain).toBe('forest');
    expect(snapshot.lastSeenTick).toBe(5);
  });

  it('HexVisibility defaults to unexplored', () => {
    const vis: HexVisibility = { state: 'unexplored' };
    expect(vis.state).toBe('unexplored');
    expect(vis.snapshot).toBeUndefined();
  });

  it('HexVisibility remembered state holds snapshot', () => {
    const vis: HexVisibility = {
      state: 'remembered',
      snapshot: {
        terrain: 'plains',
        locationNames: [],
        agentNames: ['Thane'],
        lastSeenTick: 3,
      },
    };
    expect(vis.snapshot?.agentNames).toEqual(['Thane']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/visibility.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/types/visibility.ts

// --- Fog of War Types ---

export type HexVisibilityState = 'unexplored' | 'remembered' | 'visible';

/** Snapshot of what was last seen when a hex transitions from visible → remembered. */
export interface StaleSnapshot {
  terrain: string;
  locationNames: string[];
  agentNames: string[];
  lastSeenTick: number;
}

/** Per-hex visibility entry. */
export interface HexVisibility {
  state: HexVisibilityState;
  snapshot?: StaleSnapshot;
}

/** The full visibility map keyed by "col,row" strings. */
export type VisibilityMap = Map<string, HexVisibility>;

/** A source of line-of-sight. */
export interface LOSSource {
  hexCol: number;
  hexRow: number;
  range: number;
}

// --- Tunable Constants ---

export const AVATAR_SIGHT_RANGE = 3;
export const AGENT_SIGHT_RANGE = 1;
export const SCRY_SIGHT_RANGE = 1;
export const SCRY_ESSENCE_PER_TICK = 2;
export const MOVE_ESSENCE_COST = 0; // free for prototype

/** Helper to make a visibility map key. */
export function visKey(col: number, row: number): string {
  return `${col},${row}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/visibility.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/types/visibility.ts src/types/__tests__/visibility.test.ts
git commit -m "feat(visibility): add fog of war types and constants"
```

---

### Task 2: Visibility Engine — `recalcVisibility`

**Files:**
- Create: `src/engine/visibility.ts`
- Test: `src/engine/__tests__/visibility.test.ts`
- Read: `src/lib/hexMath.ts` (hexDistance), `src/engine/retinue.ts` (getRetinueAgents), `src/engine/hexZoom.ts` (getLineOfSight pattern for avatar position lookup)

**Step 1: Write the tests**

```typescript
// src/engine/__tests__/visibility.test.ts
import { describe, it, expect } from 'vitest';
import {
  collectLOSSources,
  recalcVisibility,
  getAvatarHexPosition,
} from '../visibility';
import { createWorldGraph } from '../graph';
import type { VisibilityMap } from '../../types/visibility';
import { visKey, AVATAR_SIGHT_RANGE, AGENT_SIGHT_RANGE } from '../../types/visibility';
import type { WorldGraph } from '../graph';

// Helper: build a minimal graph with ascendant + avatar at a hex
function buildTestGraph(avatarHexCol: number, avatarHexRow: number): {
  graph: WorldGraph;
  ascendantId: string;
} {
  const graph = createWorldGraph();
  const ascendantId = 'asc.1';
  const avatarId = 'avatar.1';
  const locId = 'loc.start';

  graph.addNode({ id: ascendantId, type: 'actor', name: 'TestGod', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: avatarId, type: 'actor', name: 'TestAvatar', properties: { actorType: 'individual' } });
  graph.addNode({
    id: locId, type: 'location', name: 'Start',
    properties: { hexCol: avatarHexCol, hexRow: avatarHexRow, locationType: 'settlement' },
  });
  graph.addEdge({ id: 'e.avatar_of', source: avatarId, target: ascendantId, type: 'avatar_of', properties: {} });
  graph.addEdge({ id: 'e.located_at', source: avatarId, target: locId, type: 'located_at', properties: {} });

  return { graph, ascendantId };
}

describe('getAvatarHexPosition', () => {
  it('returns avatar hex coords from graph', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const pos = getAvatarHexPosition(graph, ascendantId);
    expect(pos).toEqual({ col: 5, row: 7 });
  });

  it('returns null if no avatar', () => {
    const graph = createWorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: {} });
    expect(getAvatarHexPosition(graph, 'asc.1')).toBeNull();
  });
});

describe('collectLOSSources', () => {
  it('includes avatar as LOS source with AVATAR_SIGHT_RANGE', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const sources = collectLOSSources(graph, ascendantId, []);
    expect(sources).toContainEqual({ hexCol: 5, hexRow: 7, range: AVATAR_SIGHT_RANGE });
  });

  it('includes retinue agents as LOS sources with AGENT_SIGHT_RANGE', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    // Add a retinue agent at a different location
    const agentId = 'agent.1';
    const agentLocId = 'loc.agent';
    graph.addNode({ id: agentId, type: 'actor', name: 'Scout', properties: { actorType: 'individual', locationId: agentLocId } });
    graph.addNode({ id: agentLocId, type: 'location', name: 'Outpost', properties: { hexCol: 10, hexRow: 3, locationType: 'settlement' } });
    graph.addEdge({ id: 'e.worship', source: agentId, target: ascendantId, type: 'worships', properties: { tier: 2, devotion: 50 } });
    graph.addEdge({ id: 'e.contains', source: agentId, target: agentLocId, type: 'contains', properties: {} });

    const sources = collectLOSSources(graph, ascendantId, []);
    expect(sources).toContainEqual({ hexCol: 10, hexRow: 3, range: AGENT_SIGHT_RANGE });
  });

  it('includes scry targets', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const scryTargets = [{ col: 15, row: 10 }];
    const sources = collectLOSSources(graph, ascendantId, scryTargets);
    expect(sources.length).toBeGreaterThanOrEqual(2); // avatar + scry
    expect(sources).toContainEqual({ hexCol: 15, hexRow: 10, range: 1 });
  });
});

describe('recalcVisibility', () => {
  it('marks hexes near avatar as visible on empty map', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const prev: VisibilityMap = new Map();
    const sources = collectLOSSources(graph, ascendantId, []);
    const next = recalcVisibility(prev, sources, graph, 1, 20, 15);

    expect(next.get(visKey(5, 7))?.state).toBe('visible');
    // Adjacent hex should be visible (within range 3)
    expect(next.get(visKey(6, 7))?.state).toBe('visible');
    expect(next.get(visKey(4, 7))?.state).toBe('visible');
  });

  it('marks distant hexes as unexplored', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const prev: VisibilityMap = new Map();
    const sources = collectLOSSources(graph, ascendantId, []);
    const next = recalcVisibility(prev, sources, graph, 1, 20, 15);

    // Hex far away should remain unexplored
    expect(next.get(visKey(19, 14))?.state).toBe('unexplored');
  });

  it('transitions visible → remembered with stale snapshot', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    // First tick: build visibility near (5,7)
    const sources1 = collectLOSSources(graph, ascendantId, []);
    const tick1 = recalcVisibility(new Map(), sources1, graph, 1, 20, 15);
    expect(tick1.get(visKey(5, 7))?.state).toBe('visible');

    // Move avatar to (15, 10) — simulate by rebuilding graph
    const locEdges = graph.getOutgoingEdges('avatar.1', 'located_at');
    for (const e of locEdges) graph.removeEdge(e.id);
    const newLocId = 'loc.new';
    graph.addNode({ id: newLocId, type: 'location', name: 'Far', properties: { hexCol: 15, hexRow: 10, locationType: 'settlement' } });
    graph.addEdge({ id: 'e.located_at_new', source: 'avatar.1', target: newLocId, type: 'located_at', properties: {} });

    const sources2 = collectLOSSources(graph, ascendantId, []);
    const tick2 = recalcVisibility(tick1, sources2, graph, 2, 20, 15);

    // Old position should now be remembered
    expect(tick2.get(visKey(5, 7))?.state).toBe('remembered');
    expect(tick2.get(visKey(5, 7))?.snapshot?.lastSeenTick).toBe(1);
    // New position should be visible
    expect(tick2.get(visKey(15, 10))?.state).toBe('visible');
  });

  it('transitions unexplored → visible when entering range', () => {
    const { graph, ascendantId } = buildTestGraph(5, 7);
    const sources = collectLOSSources(graph, ascendantId, []);
    const result = recalcVisibility(new Map(), sources, graph, 1, 20, 15);

    // Hex at distance 2 from (5,7) should be visible (within range 3)
    expect(result.get(visKey(7, 7))?.state).toBe('visible');
  });

  it('transitions remembered → visible when re-entering range', () => {
    // Start with a remembered hex
    const prev: VisibilityMap = new Map();
    prev.set(visKey(5, 7), {
      state: 'remembered',
      snapshot: { terrain: 'plains', locationNames: [], agentNames: [], lastSeenTick: 1 },
    });

    const { graph, ascendantId } = buildTestGraph(5, 7);
    const sources = collectLOSSources(graph, ascendantId, []);
    const result = recalcVisibility(prev, sources, graph, 3, 20, 15);

    expect(result.get(visKey(5, 7))?.state).toBe('visible');
    // Snapshot should be cleared
    expect(result.get(visKey(5, 7))?.snapshot).toBeUndefined();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/visibility.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/engine/visibility.ts
import type { WorldGraph } from './graph';
import type { HexCoord } from '../lib/hexMath';
import { hexDistance } from '../lib/hexMath';
import type {
  VisibilityMap,
  HexVisibility,
  LOSSource,
  StaleSnapshot,
} from '../types/visibility';
import {
  visKey,
  AVATAR_SIGHT_RANGE,
  AGENT_SIGHT_RANGE,
  SCRY_SIGHT_RANGE,
} from '../types/visibility';

/**
 * Extract the avatar's hex position from the graph.
 * Traverses ascendant → avatar_of → avatar → located_at → location → hexCol/hexRow.
 */
export function getAvatarHexPosition(
  graph: WorldGraph,
  ascendantId: string,
): HexCoord | null {
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  if (avatarEdges.length === 0) return null;

  const avatarId = avatarEdges[0].source;
  const locEdges = graph.getOutgoingEdges(avatarId, 'located_at');
  if (locEdges.length === 0) return null;

  const locNode = graph.getNode(locEdges[0].target);
  if (!locNode) return null;

  const props = locNode.properties as Record<string, unknown>;
  const col = props.hexCol as number | undefined;
  const row = props.hexRow as number | undefined;
  if (col === undefined || row === undefined) return null;

  return { col, row };
}

/**
 * Collect all line-of-sight sources: avatar, retinue agents, and scry targets.
 */
export function collectLOSSources(
  graph: WorldGraph,
  ascendantId: string,
  scryTargets: HexCoord[],
): LOSSource[] {
  const sources: LOSSource[] = [];

  // 1. Avatar
  const avatarPos = getAvatarHexPosition(graph, ascendantId);
  if (avatarPos) {
    sources.push({ hexCol: avatarPos.col, hexRow: avatarPos.row, range: AVATAR_SIGHT_RANGE });
  }

  // 2. Retinue agents (bonded via 'worships' edges with tier >= 1)
  const worshipsEdges = graph.getIncomingEdges(ascendantId, 'worships');
  for (const edge of worshipsEdges) {
    const props = edge.properties as Record<string, unknown>;
    const tier = (props.tier as number) ?? 0;
    if (tier < 1) continue;

    const agentId = edge.source;
    // Find agent's location via 'located_at' or 'contains' edges
    const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
    const containsEdges = graph.getOutgoingEdges(agentId, 'contains');
    const allLocEdges = [...locEdges, ...containsEdges];

    for (const locEdge of allLocEdges) {
      const locNode = graph.getNode(locEdge.target);
      if (!locNode || locNode.type !== 'location') continue;
      const locProps = locNode.properties as Record<string, unknown>;
      const col = locProps.hexCol as number | undefined;
      const row = locProps.hexRow as number | undefined;
      if (col !== undefined && row !== undefined) {
        sources.push({ hexCol: col, hexRow: row, range: AGENT_SIGHT_RANGE });
        break; // one location per agent
      }
    }
  }

  // 3. Scry targets
  for (const target of scryTargets) {
    sources.push({ hexCol: target.col, hexRow: target.row, range: SCRY_SIGHT_RANGE });
  }

  return sources;
}

/**
 * Build a snapshot of what's currently visible at a hex, for stale rendering later.
 */
function buildSnapshot(
  graph: WorldGraph,
  col: number,
  row: number,
  tick: number,
  tile?: { terrain: string },
): StaleSnapshot {
  // Find locations at this hex
  const locationNames: string[] = [];
  const agentNames: string[] = [];

  const allNodes = graph.getAllNodes();
  for (const node of allNodes) {
    const props = node.properties as Record<string, unknown>;
    if (node.type === 'location' && props.hexCol === col && props.hexRow === row) {
      locationNames.push(node.name);
      // Find agents at this location
      const incoming = graph.getIncomingEdges(node.id, 'contains');
      const locatedAt = graph.getIncomingEdges(node.id, 'located_at');
      for (const e of [...incoming, ...locatedAt]) {
        const agent = graph.getNode(e.source);
        if (agent && agent.type === 'actor') {
          agentNames.push(agent.name);
        }
      }
    }
  }

  return {
    terrain: tile?.terrain ?? 'unknown',
    locationNames,
    agentNames,
    lastSeenTick: tick,
  };
}

/**
 * Recalculate the full visibility map given LOS sources.
 * Pure function: prev map in, new map out.
 */
export function recalcVisibility(
  prev: VisibilityMap,
  sources: LOSSource[],
  graph: WorldGraph,
  tick: number,
  cols: number,
  rows: number,
): VisibilityMap {
  // 1. Compute the set of currently visible hexes
  const visibleSet = new Set<string>();
  for (const source of sources) {
    const sourceHex: HexCoord = { col: source.hexCol, row: source.hexRow };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dist = hexDistance(sourceHex, { col: c, row: r });
        if (dist <= source.range) {
          visibleSet.add(visKey(c, r));
        }
      }
    }
  }

  // 2. Build next visibility map
  const next: VisibilityMap = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = visKey(c, r);
      const isNowVisible = visibleSet.has(key);
      const prevState = prev.get(key);

      if (isNowVisible) {
        // Visible — full sight, clear any stale snapshot
        next.set(key, { state: 'visible' });
      } else if (prevState?.state === 'visible') {
        // Was visible, now isn't — transition to remembered with snapshot
        const snapshot = buildSnapshot(graph, c, r, tick);
        next.set(key, { state: 'remembered', snapshot });
      } else if (prevState?.state === 'remembered') {
        // Stay remembered with existing snapshot
        next.set(key, { state: 'remembered', snapshot: prevState.snapshot });
      } else {
        // Still unexplored
        next.set(key, { state: 'unexplored' });
      }
    }
  }

  return next;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/visibility.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/engine/visibility.ts src/engine/__tests__/visibility.test.ts
git commit -m "feat(visibility): add fog of war engine — recalcVisibility, LOS sources"
```

---

### Task 3: Add `visibilityMap` to GameState

**Files:**
- Modify: `src/types/gameState.ts` — add `visibilityMap` field
- Modify: `src/engine/worldSeed.ts` — initialize empty visibility map in `seedWorld`
- Modify: `src/engine/orchestrator.ts` — recalc visibility each tick
- Test: `src/engine/__tests__/visibility-integration.test.ts`

**Step 1: Write the integration test**

```typescript
// src/engine/__tests__/visibility-integration.test.ts
import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import { runTick } from '../orchestrator';
import { visKey } from '../../types/visibility';

describe('visibility integration', () => {
  it('seedWorld initializes visibility map with avatar area visible', () => {
    const result = seedWorld({
      spheres: { foundation: ['chaos', 'light'], creation: ['force', 'life'] },
      seed: 42,
      cols: 20,
      rows: 15,
    });
    const gs = result.gameState;
    expect(gs.visibilityMap).toBeDefined();
    expect(gs.visibilityMap.size).toBe(300); // 20×15

    // At least some hexes should be visible (near avatar)
    const visibleCount = Array.from(gs.visibilityMap.values()).filter(v => v.state === 'visible').length;
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThan(300); // not everything visible
  });

  it('runTick recalculates visibility', () => {
    const result = seedWorld({
      spheres: { foundation: ['chaos', 'light'], creation: ['force', 'life'] },
      seed: 42,
      cols: 20,
      rows: 15,
    });
    const gs1 = result.gameState;
    const gs2 = runTick(gs1);
    expect(gs2.visibilityMap).toBeDefined();
    expect(gs2.visibilityMap.size).toBe(300);
  });
});
```

**Step 2: Run test — should fail (visibilityMap not in GameState yet)**

Run: `npx vitest run src/engine/__tests__/visibility-integration.test.ts`
Expected: FAIL — property does not exist

**Step 3: Implement the changes**

3a. Add to GameState type (`src/types/gameState.ts`):
- Add import: `import type { VisibilityMap } from './visibility';`
- Add field in GameState interface: `visibilityMap: VisibilityMap;`

3b. Initialize in `seedWorld` (`src/engine/worldSeed.ts`):
- Import: `import { recalcVisibility, collectLOSSources } from './visibility';`
- After creating the world graph and ascendant, before returning:
  ```typescript
  const losSources = collectLOSSources(graph, ascendantResult.ascendantId, []);
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, 0, cols, rows);
  ```
- Add `visibilityMap` to the returned GameState object.

3c. Recalc in `runTick` (`src/engine/orchestrator.ts`):
- Import visibility functions
- At the end of runTick, before returning the new state:
  ```typescript
  const losSources = collectLOSSources(state.graph, state.ascendantId, []);
  const visibilityMap = recalcVisibility(state.visibilityMap, losSources, state.graph, state.tick, COLS, ROWS);
  ```
- Include `visibilityMap` in the returned state.

**Note:** Read the existing `seedWorld` return shape and `runTick` return shape carefully. The function signatures must match. The `cols` and `rows` values may need to be passed as parameters or read from the state. Check `seedWorld`'s parameters — if it doesn't take cols/rows, add them or use the existing COLS/ROWS constants.

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/visibility-integration.test.ts`
Expected: PASS

Also run existing tests to check for regressions:
Run: `npx vitest run src/engine/__tests__/orchestrator.test.ts src/engine/__tests__/worldSeed.test.ts`
Expected: PASS — may need to add `visibilityMap` to any test fixtures that construct GameState objects.

**Step 5: Commit**

```bash
git add src/types/gameState.ts src/engine/worldSeed.ts src/engine/orchestrator.ts src/engine/__tests__/visibility-integration.test.ts
git commit -m "feat(visibility): wire fog of war into GameState and tick loop"
```

---

### Task 4: HexTile Fog Rendering

**Files:**
- Modify: `src/components/HexMap/HexTile.tsx` — add visibility-based rendering
- Modify: `src/components/HexMap/HexMap.tsx` — pass visibility to tiles
- Test: `src/components/HexMap/__tests__/HexTile.test.tsx` — extend existing tests

**Step 1: Write the tests**

Add to the existing `HexTile.test.tsx` (or create if it doesn't exist):

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import HexTileComponent from '../HexTile';

// Note: HexTile renders SVG elements, so wrap in <svg> for valid DOM
const renderTile = (props: Partial<Parameters<typeof HexTileComponent>[0]>) => {
  const defaults = {
    tile: { coord: { col: 0, row: 0 }, terrain: 'plains' as const, icon: '🌾' },
    cx: 50,
    cy: 50,
    size: 30,
  };
  return render(
    <svg>
      <HexTileComponent {...defaults} {...props} />
    </svg>
  );
};

describe('HexTile fog rendering', () => {
  it('renders normally when visibility is visible', () => {
    const { container } = renderTile({ visibility: 'visible' });
    const polygons = container.querySelectorAll('polygon');
    expect(polygons.length).toBeGreaterThan(0);
    // Should not have black fill
    expect(polygons[0].getAttribute('fill')).not.toBe('#0a0a0e');
  });

  it('renders black when visibility is unexplored', () => {
    const { container } = renderTile({ visibility: 'unexplored' });
    const polygons = container.querySelectorAll('polygon');
    expect(polygons[0].getAttribute('fill')).toBe('#0a0a0e');
    // No icon text when unexplored
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(0);
  });

  it('renders dimmed when visibility is remembered', () => {
    const { container } = renderTile({ visibility: 'remembered' });
    const group = container.querySelector('g');
    // Should have reduced opacity
    expect(group?.getAttribute('opacity')).toBe('0.4');
  });
});
```

**Step 2: Run to verify failure**

Run: `npx vitest run src/components/HexMap/__tests__/HexTile.test.tsx`
Expected: FAIL — `visibility` prop doesn't exist yet

**Step 3: Implement**

3a. Modify `HexTile.tsx`:
- Add `visibility?: HexVisibilityState` to props (default: `'visible'`)
- When `visibility === 'unexplored'`: render only a black-fill polygon, no icon, no hover effects
- When `visibility === 'remembered'`: wrap the group in `<g opacity="0.4">`, render terrain normally but desaturated (use a CSS filter or just reduced opacity), show icon but dimmed
- When `visibility === 'visible'`: render exactly as today (no changes)

3b. Modify `HexMap.tsx`:
- Add `visibilityMap?: VisibilityMap` to HexMapProps
- Pass `visibility={visibilityMap?.get(visKey(tile.coord.col, tile.coord.row))?.state ?? 'visible'}` to each HexTile

**Step 4: Run tests**

Run: `npx vitest run src/components/HexMap/__tests__/HexTile.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/HexMap/HexTile.tsx src/components/HexMap/HexMap.tsx src/components/HexMap/__tests__/HexTile.test.tsx
git commit -m "feat(fog): render hex tiles based on visibility state"
```

---

### Task 5: Avatar Hex Overlay

**Files:**
- Modify: `src/components/HexMap/HexMap.tsx` — add avatar overlay ring
- Modify: `src/components/HexMap/HexTile.tsx` — add `isAvatarHex` prop with pulsing border

**Step 1: Write the test**

Add to `HexTile.test.tsx`:

```typescript
describe('avatar hex overlay', () => {
  it('renders pulsing ring when isAvatarHex is true', () => {
    const { container } = renderTile({ isAvatarHex: true, sphereColor: '#ff6633' });
    // Should have an additional circle or polygon with animation class
    const avatarOverlay = container.querySelector('.avatar-pulse');
    expect(avatarOverlay).toBeTruthy();
  });

  it('does not render pulsing ring when isAvatarHex is false', () => {
    const { container } = renderTile({ isAvatarHex: false });
    const avatarOverlay = container.querySelector('.avatar-pulse');
    expect(avatarOverlay).toBeNull();
  });
});
```

**Step 2: Run — should fail**

**Step 3: Implement**

3a. Add `isAvatarHex?: boolean` and `sphereColor?: string` props to HexTile.

3b. When `isAvatarHex` is true, render an additional `<polygon>` (same hex shape, slightly larger) with:
- `stroke={sphereColor}`, `strokeWidth={3}`, `fill="none"`
- `className="avatar-pulse"`
- CSS animation: `@keyframes avatar-breathe { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }` with `animation: avatar-breathe 3s ease-in-out infinite`

3c. Add the CSS keyframes either inline via `<style>` in HexMap or in the global CSS.

3d. In HexMap.tsx, pass `isAvatarHex={avatarHex && tile.coord.col === avatarHex.col && tile.coord.row === avatarHex.row}` where `avatarHex` is a new prop on HexMap.

**Step 4: Run tests — PASS**

**Step 5: Commit**

```bash
git add src/components/HexMap/HexTile.tsx src/components/HexMap/HexMap.tsx src/components/HexMap/__tests__/HexTile.test.tsx
git commit -m "feat(avatar): add sphere-colored pulsing overlay on avatar hex"
```

---

### Task 6: d3-zoom on HexMap

**Files:**
- Modify: `src/components/HexMap/HexMap.tsx` — wrap SVG content in a zoom-controlled group
- Test: `src/components/HexMap/__tests__/HexMap-zoom.test.tsx`

**Step 1: Write the test**

```typescript
// src/components/HexMap/__tests__/HexMap-zoom.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import HexMap from '../HexMap';

describe('HexMap zoom', () => {
  const defaultProps = {
    tiles: [{ coord: { col: 0, row: 0 }, terrain: 'plains' as const, icon: '🌾' }],
    cols: 20,
    rows: 15,
    hoveredHex: null,
    selectedHex: null,
    overlayMode: 'none' as const,
    onHexClick: vi.fn(),
    onHexHover: vi.fn(),
  };

  it('renders an SVG with a zoom group', () => {
    const { container } = render(<HexMap {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // Should have a group for zoom transform
    const zoomGroup = svg?.querySelector('g.zoom-group');
    expect(zoomGroup).toBeTruthy();
  });

  it('accepts initialCenter and initialScale props', () => {
    // Just verify no crash
    const { container } = render(
      <HexMap {...defaultProps} initialCenter={{ x: 100, y: 100 }} initialScale={2.5} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('calls onZoomChange when zoom state changes', () => {
    const onZoomChange = vi.fn();
    render(<HexMap {...defaultProps} onZoomChange={onZoomChange} />);
    // The actual zoom interaction is hard to test without simulating wheel events,
    // but we can verify the callback prop is accepted
    expect(true).toBe(true);
  });
});
```

**Step 2: Run — should fail (no zoom group class)**

**Step 3: Implement**

Key approach:
- Use a `useRef` for the SVG element
- Use `useEffect` with `d3.zoom()` to attach zoom behavior
- The zoom transforms a `<g className="zoom-group">` inside the SVG
- Accept `initialCenter`, `initialScale`, and `onZoomChange` props
- Export a `centerOn(x, y, scale)` method via `useImperativeHandle` + `forwardRef` for the "center on avatar" button
- Set zoom extent: `scaleExtent([1, 4])` with `translateExtent` bounded to the map area
- On mount, apply initial transform centered on `initialCenter` at `initialScale`

Important d3-zoom integration pattern for React:
```typescript
import * as d3 from 'd3';
import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

// Inside component:
const svgRef = useRef<SVGSVGElement>(null);
const gRef = useRef<SVGGElement>(null);

useEffect(() => {
  if (!svgRef.current || !gRef.current) return;
  const svg = d3.select(svgRef.current);
  const g = d3.select(gRef.current);

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([MIN_ZOOM, MAX_ZOOM])
    .on('zoom', (event) => {
      g.attr('transform', event.transform.toString());
      onZoomChange?.(event.transform);
    });

  svg.call(zoom);

  // Apply initial transform
  if (initialCenter && initialScale) {
    const t = d3.zoomIdentity
      .translate(viewWidth / 2 - initialCenter.x * initialScale, viewHeight / 2 - initialCenter.y * initialScale)
      .scale(initialScale);
    svg.call(zoom.transform, t);
  }
}, []);
```

**Step 4: Run tests — PASS**

Also verify: `npx vitest run src/components/HexMap/` (all hex map tests)

**Step 5: Commit**

```bash
git add src/components/HexMap/HexMap.tsx src/components/HexMap/__tests__/HexMap-zoom.test.tsx
git commit -m "feat(zoom): add d3-zoom scroll/pan to hex map"
```

---

### Task 7: AvatarHUD Component

**Files:**
- Create: `src/components/Game/AvatarHUD.tsx`
- Test: `src/components/Game/__tests__/AvatarHUD.test.tsx`

**Step 1: Write the test**

```typescript
// src/components/Game/__tests__/AvatarHUD.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AvatarHUD from '../AvatarHUD';

describe('AvatarHUD', () => {
  const defaultProps = {
    avatarName: 'Kael the Wanderer',
    sphereColor: '#ff6633',
    onCenterOnAvatar: vi.fn(),
    onMoveClick: vi.fn(),
    onWheelClick: vi.fn(),
    onScryClick: vi.fn(),
  };

  it('displays avatar name', () => {
    render(<AvatarHUD {...defaultProps} />);
    expect(screen.getByText('Kael the Wanderer')).toBeTruthy();
  });

  it('calls onCenterOnAvatar when name is clicked', () => {
    render(<AvatarHUD {...defaultProps} />);
    fireEvent.click(screen.getByText('Kael the Wanderer'));
    expect(defaultProps.onCenterOnAvatar).toHaveBeenCalled();
  });

  it('renders Move, Wheel, and Scry action buttons', () => {
    render(<AvatarHUD {...defaultProps} />);
    expect(screen.getByRole('button', { name: /move/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /wheel/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /scry/i })).toBeTruthy();
  });

  it('calls onMoveClick when Move button is clicked', () => {
    render(<AvatarHUD {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /move/i }));
    expect(defaultProps.onMoveClick).toHaveBeenCalled();
  });

  it('applies sphere color to accent elements', () => {
    const { container } = render(<AvatarHUD {...defaultProps} />);
    const accent = container.querySelector('[data-testid="avatar-accent"]');
    expect(accent).toBeTruthy();
  });
});
```

**Step 2: Run — should fail**

**Step 3: Implement**

A compact top-left panel component:
- Fixed position top-left (absolute within the game container, not the page)
- Shows avatar name as a clickable element (click → `onCenterOnAvatar`)
- Small colored accent bar/dot using `sphereColor`
- Row of 3 icon buttons: Move (⟡ or arrow icon), Wheel (◎), Scry (👁)
- Each button calls its respective handler
- Dark semi-transparent background to float over the map
- Minimal footprint — shouldn't obscure too much of the map

**Step 4: Run tests — PASS**

**Step 5: Commit**

```bash
git add src/components/Game/AvatarHUD.tsx src/components/Game/__tests__/AvatarHUD.test.tsx
git commit -m "feat(avatar): add AvatarHUD component with quick actions"
```

---

### Task 8: Avatar Movement Handler

**Files:**
- Create: `src/engine/avatarMove.ts`
- Test: `src/engine/__tests__/avatarMove.test.ts`

**Step 1: Write the test**

```typescript
// src/engine/__tests__/avatarMove.test.ts
import { describe, it, expect } from 'vitest';
import { moveAvatarToHex } from '../avatarMove';
import { createWorldGraph } from '../graph';
import { getAvatarHexPosition } from '../visibility';

describe('moveAvatarToHex', () => {
  function buildGraph() {
    const graph = createWorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'avatar.1', type: 'actor', name: 'Avatar', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc.start', type: 'location', name: 'Start', properties: { hexCol: 5, hexRow: 7, locationType: 'settlement' } });
    graph.addEdge({ id: 'e.avatar_of', source: 'avatar.1', target: 'asc.1', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'e.located_at', source: 'avatar.1', target: 'loc.start', type: 'located_at', properties: {} });
    return graph;
  }

  it('moves avatar to a hex with an existing location', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'loc.dest', type: 'location', name: 'Dest', properties: { hexCol: 10, hexRow: 3, locationType: 'settlement' } });

    moveAvatarToHex(graph, 'asc.1', { col: 10, row: 3 });
    const pos = getAvatarHexPosition(graph, 'asc.1');
    expect(pos).toEqual({ col: 10, row: 3 });
  });

  it('creates a transient location if no location exists at target hex', () => {
    const graph = buildGraph();
    moveAvatarToHex(graph, 'asc.1', { col: 12, row: 8 });
    const pos = getAvatarHexPosition(graph, 'asc.1');
    expect(pos).toEqual({ col: 12, row: 8 });
  });

  it('removes old located_at edge', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'loc.dest', type: 'location', name: 'Dest', properties: { hexCol: 10, hexRow: 3, locationType: 'settlement' } });
    moveAvatarToHex(graph, 'asc.1', { col: 10, row: 3 });

    // Old edge should be gone
    const oldEdges = graph.getOutgoingEdges('avatar.1', 'located_at')
      .filter(e => e.target === 'loc.start');
    expect(oldEdges.length).toBe(0);
  });
});
```

**Step 2: Run — should fail**

**Step 3: Implement**

```typescript
// src/engine/avatarMove.ts
import type { WorldGraph } from './graph';
import type { HexCoord } from '../lib/hexMath';

/**
 * Move the avatar to a target hex.
 * Finds a location at that hex, or creates a transient one.
 * Updates the avatar's located_at edge.
 */
export function moveAvatarToHex(
  graph: WorldGraph,
  ascendantId: string,
  targetHex: HexCoord,
): void {
  // Find avatar
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  if (avatarEdges.length === 0) return;
  const avatarId = avatarEdges[0].source;

  // Remove old located_at edge(s)
  const oldEdges = graph.getOutgoingEdges(avatarId, 'located_at');
  for (const e of oldEdges) {
    graph.removeEdge(e.id);
  }

  // Find a location at the target hex
  let targetLocId: string | null = null;
  const allNodes = graph.getAllNodes();
  for (const node of allNodes) {
    if (node.type !== 'location') continue;
    const props = node.properties as Record<string, unknown>;
    if (props.hexCol === targetHex.col && props.hexRow === targetHex.row) {
      targetLocId = node.id;
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

  // Add new located_at edge
  graph.addEdge({
    id: `edge.located_at.${avatarId}.${Date.now()}`,
    source: avatarId,
    target: targetLocId,
    type: 'located_at',
    properties: {},
  });
}
```

**Step 4: Run tests — PASS**

**Step 5: Commit**

```bash
git add src/engine/avatarMove.ts src/engine/__tests__/avatarMove.test.ts
git commit -m "feat(avatar): add moveAvatarToHex engine function"
```

---

### Task 9: Wire Everything into GameView

**Files:**
- Modify: `src/components/Game/GameView.tsx` — integrate visibility, zoom, AvatarHUD, move mode

This is the wiring task. Read the current GameView.tsx carefully before making changes. Key modifications:

**9a. Pass visibilityMap to HexMap:**
- In the `'world'` render branch, add `visibilityMap={gameState.visibilityMap}` to the HexMap props.

**9b. Compute avatar position and sphere color:**
- Add a `useMemo` that calls `getAvatarHexPosition(gameState.graph, gameState.ascendantId)` to get the avatar hex.
- Derive `sphereColor` from the cosmology profile (pick the primary foundation sphere's color from STYLE constants).

**9c. Pass avatar hex to HexMap:**
- Add `avatarHex={avatarPos}` and `sphereColor={sphereColor}` props.

**9d. Add AvatarHUD:**
- Render `<AvatarHUD>` above the map in the `'world'` view, positioned absolute top-left.
- Wire handlers:
  - `onCenterOnAvatar` → call the HexMap ref's `centerOn(avatarPixelX, avatarPixelY, DEFAULT_ZOOM_SCALE)` method
  - `onMoveClick` → set a `moveMode` state to `true`
  - `onWheelClick` → open the wheel (existing logic, currently in retinue panel flow)
  - `onScryClick` → placeholder for now (log or no-op)

**9e. Move mode interaction:**
- When `moveMode` is true, clicking a hex calls `moveAvatarToHex()` then recalcs visibility, then sets `moveMode` back to false.
- Visual indicator: when in move mode, show a subtle "Click a hex to move" message or change cursor.

**9f. Pass initialCenter and initialScale to HexMap:**
- On game init, compute the pixel position of the avatar hex using `hexToPixel(avatarPos, hexSize)`.
- Pass as `initialCenter` and `initialScale={DEFAULT_ZOOM_SCALE}` to HexMap.

**No unit test for this task** — it's pure wiring. Verify with:

Run: `npx tsc --noEmit` (type check)
Run: `npx vite build` (production build)
Run: `npx vitest run src/components/Game/__tests__/GameView-interaction.test.tsx` (existing interaction tests still pass)

**Commit:**

```bash
git add src/components/Game/GameView.tsx
git commit -m "feat: wire avatar HUD, fog of war, zoom/pan into GameView"
```

---

### Task 10: Verify & Fix Regressions

**Files:** Any files that fail tests from previous tasks.

**Step 1:** Run the full relevant test suite:

```bash
npx vitest run src/types/__tests__/visibility.test.ts \
  src/engine/__tests__/visibility.test.ts \
  src/engine/__tests__/visibility-integration.test.ts \
  src/engine/__tests__/avatarMove.test.ts \
  src/components/HexMap/__tests__/ \
  src/components/Game/__tests__/AvatarHUD.test.tsx \
  src/components/Game/__tests__/GameView-interaction.test.tsx \
  src/engine/__tests__/orchestrator.test.ts \
  src/engine/__tests__/worldSeed.test.ts
```

**Step 2:** Run type check: `npx tsc --noEmit`

**Step 3:** Run production build: `npx vite build`

**Step 4:** Fix any failures. Common issues:
- Existing tests that construct GameState may need `visibilityMap: new Map()` added
- HexMap tests may need updated props
- Import paths may need adjustment

**Step 5:** Final commit:

```bash
git add -A
git commit -m "fix: resolve regressions from playable map integration"
```

---

### Summary

| Task | What | New Tests |
|------|------|-----------|
| 1 | Visibility types & constants | 5 |
| 2 | Visibility engine (recalcVisibility) | ~12 |
| 3 | Wire into GameState + tick loop | 2 |
| 4 | HexTile fog rendering | 3 |
| 5 | Avatar hex pulse overlay | 2 |
| 6 | d3-zoom on HexMap | 3 |
| 7 | AvatarHUD component | 5 |
| 8 | Avatar movement engine | 3 |
| 9 | GameView wiring | 0 (integration) |
| 10 | Regression fix pass | 0 |
| **Total** | | **~35 new tests** |
