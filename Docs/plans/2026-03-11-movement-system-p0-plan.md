# Movement System P0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement graph-based movement with goal-directed pathfinding so agents make purposeful spatial decisions instead of random 2% migration hops.

**Architecture:** Movement is graph traversal. Every edge costs `BASE_EDGE_TRAVERSAL_COST + nodeTax`. Agents are always at a node (never in limbo). A new `phaseMovement` tick-loop phase replaces the migration logic in `phaseAgentLifecycle`. Movement candidates compete with local action candidates in the existing selection pipeline.

**Tech Stack:** TypeScript, Vitest, seeded PRNG (mulberry32), existing WorldGraph + agentSelection pipeline.

**Design doc:** `Docs/plans/2026-03-11-agent-visibility-movement-design.md`

**Scope:** P0 only — movement types, content data, pathfinding, movement candidate scoring, movement execution, tick loop integration. P1 (quest encounters, threat rating, colocation detection, hex rendering) and P2 (trails, ghost dots, AgentInfoCard) are separate follow-up plans.

---

### Task 1: Movement Types

**Files:**
- Create: `src/types/movement.ts`
- Test: `src/types/__tests__/movement.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/movement.test.ts
import { describe, it, expect } from 'vitest';
import {
  BASE_EDGE_TRAVERSAL_COST,
  DECISION_REEVALUATION_TICKS,
  TRAIL_HISTORY_TICKS,
  type MovementState,
  type MovementEdgeCost,
} from '../movement';

describe('movement types', () => {
  it('exports BASE_EDGE_TRAVERSAL_COST as 1', () => {
    expect(BASE_EDGE_TRAVERSAL_COST).toBe(1);
  });

  it('exports DECISION_REEVALUATION_TICKS as 4', () => {
    expect(DECISION_REEVALUATION_TICKS).toBe(4);
  });

  it('exports TRAIL_HISTORY_TICKS as 12', () => {
    expect(TRAIL_HISTORY_TICKS).toBe(12);
  });

  it('MovementState shape is assignable', () => {
    const state: MovementState = {
      destinationId: 'loc_market',
      movementQueue: ['hex_a_center', 'hex_a_b_border', 'hex_b_center'],
      ticksAccumulated: 0,
      currentEdgeCost: 2,
      lastDecisionTick: 10,
      movementHistory: [],
    };
    expect(state.movementQueue).toHaveLength(3);
  });

  it('MovementEdgeCost shape is assignable', () => {
    const cost: MovementEdgeCost = {
      baseCost: 1,
      terrainTax: 0.5,
      locationTax: 0,
      speedModifier: 0,
      totalCost: 1.5,
    };
    expect(cost.totalCost).toBe(1.5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/movement.test.ts`
Expected: FAIL — module `../movement` does not exist

**Step 3: Write minimal implementation**

```typescript
// src/types/movement.ts

// --- Tunable constants (P0 defaults, will move to content data in P1) ---

/** Base tick cost per graph edge traversal */
export const BASE_EDGE_TRAVERSAL_COST = 1;

/** Ticks between agent destination re-evaluation (~1 in-game day) */
export const DECISION_REEVALUATION_TICKS = 4;

/** Number of recent ticks shown as movement trail */
export const TRAIL_HISTORY_TICKS = 12;

// --- Types ---

/** Breakdown of tick cost to traverse one movement edge */
export interface MovementEdgeCost {
  /** Always BASE_EDGE_TRAVERSAL_COST */
  baseCost: number;
  /** Terrain type tax on hex edges (0 for plains, 1.5 for mountains) */
  terrainTax: number;
  /** Location/sublocation entry tax (property on the destination node) */
  locationTax: number;
  /** Speed modifier delta from traits/items/spells (negative = faster) */
  speedModifier: number;
  /** baseCost + terrainTax + locationTax + speedModifier, floored at 0.5 */
  totalCost: number;
}

/** Per-agent movement state stored on the agent's graph node properties */
export interface MovementState {
  /** Target node ID the agent is trying to reach */
  destinationId: string;
  /** Ordered list of node IDs still to visit (next = index 0) */
  movementQueue: string[];
  /** Ticks accumulated toward the current edge cost */
  ticksAccumulated: number;
  /** Total tick cost of the current edge being traversed */
  currentEdgeCost: number;
  /** Tick at which the agent last ran goal evaluation */
  lastDecisionTick: number;
  /** Circular buffer of recent node IDs for trail rendering (newest first) */
  movementHistory: MovementHistoryEntry[];
}

/** One entry in the movement trail history */
export interface MovementHistoryEntry {
  /** Node ID the agent was at */
  nodeId: string;
  /** Tick when the agent arrived at this node */
  tick: number;
  /** Hex coordinate for trail rendering (if applicable) */
  hexCol?: number;
  /** Hex coordinate for trail rendering (if applicable) */
  hexRow?: number;
}

/** A scored movement candidate that competes in the selection pipeline */
export interface MovementCandidate {
  /** Destination node ID */
  destinationId: string;
  /** Best action/encounter template available at destination */
  bestTemplateId: string;
  /** Raw axiological alignment score × questPriority */
  motivationPull: number;
  /** 1 / (1 + DISTANCE_DECAY_FACTOR × tickDistance) */
  distanceDecay: number;
  /** Composite movement score (motivationPull × distanceDecay) */
  score: number;
  /** Shortest-path tick cost to destination */
  tickDistance: number;
  /** The path (node IDs) to reach destination */
  path: string[];
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/movement.test.ts`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add src/types/movement.ts src/types/__tests__/movement.test.ts
git commit -m "feat(movement): add movement types and constants (DES-009 P0 Task 1)"
```

---

### Task 2: Movement Content Data

**Files:**
- Create: `src/data/movement-content.ts`
- Test: `src/data/__tests__/movement-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/movement-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  TERRAIN_MOVEMENT_TAX,
  DISTANCE_DECAY_FACTOR,
  LOCATION_TYPE_ENTRY_TAX,
} from '../movement-content';
import type { TerrainType, LocationSubtype } from '../../types';

describe('movement content data', () => {
  it('TERRAIN_MOVEMENT_TAX has entry for grassland (0)', () => {
    expect(TERRAIN_MOVEMENT_TAX['grassland']).toBe(0);
  });

  it('TERRAIN_MOVEMENT_TAX has entry for mountain (1.5)', () => {
    expect(TERRAIN_MOVEMENT_TAX['mountain']).toBe(1.5);
  });

  it('TERRAIN_MOVEMENT_TAX has entry for swamp (1)', () => {
    expect(TERRAIN_MOVEMENT_TAX['swamp']).toBe(1);
  });

  it('TERRAIN_MOVEMENT_TAX has entry for forest (0.5)', () => {
    expect(TERRAIN_MOVEMENT_TAX['forest']).toBe(0.5);
  });

  it('DISTANCE_DECAY_FACTOR is a positive number', () => {
    expect(DISTANCE_DECAY_FACTOR).toBeGreaterThan(0);
  });

  it('LOCATION_TYPE_ENTRY_TAX has entry for city', () => {
    expect(LOCATION_TYPE_ENTRY_TAX['city']).toBeDefined();
    expect(typeof LOCATION_TYPE_ENTRY_TAX['city']).toBe('number');
  });

  it('LOCATION_TYPE_ENTRY_TAX wilderness is 0', () => {
    expect(LOCATION_TYPE_ENTRY_TAX['wilderness']).toBe(0);
  });

  it('all terrain taxes are non-negative', () => {
    for (const [terrain, tax] of Object.entries(TERRAIN_MOVEMENT_TAX)) {
      expect(tax, `${terrain} tax should be >= 0`).toBeGreaterThanOrEqual(0);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/movement-content.test.ts`
Expected: FAIL — module `../movement-content` does not exist

**Step 3: Write minimal implementation**

```typescript
// src/data/movement-content.ts
/**
 * Movement content data — tunable constants for the movement system.
 *
 * Per §8.1 of DES-009: every multiplier, tax, and weight lives here,
 * not in engine logic. Engine reads these at resolution time.
 */

import type { TerrainType, LocationSubtype } from '../types';

// --- Terrain movement taxes (per hex edge, added to BASE_EDGE_TRAVERSAL_COST) ---

export const TERRAIN_MOVEMENT_TAX: Partial<Record<TerrainType, number>> = {
  // Easy terrain (0 tax)
  grassland: 0,
  plains: 0,
  steppe: 0,
  savanna: 0,
  floodplain: 0,
  coast: 0,
  oasis: 0,

  // Light terrain (+0.5 tax)
  forest: 0.5,
  light_forest: 0.5,
  tropical_forest: 0.5,
  evergreen_forest: 0.5,
  hills: 0.5,
  moor_bog: 0.5,
  tundra: 0.5,
  taiga: 0.5,

  // Moderate terrain (+1 tax)
  swamp: 1,
  desert: 1,
  rocky_desert: 1,
  sand_dunes: 1,
  dead_forest: 1,
  arctic: 1,
  snow_fields: 1,

  // Heavy terrain (+1.5 tax)
  mountain: 1.5,
  high_mountains: 1.5,
  volcano: 1.5,

  // Passable but costly (+0.5)
  mountain_pass: 0.5,

  // Water — not traversable on foot (Infinity signals impassable)
  ocean: Infinity,
  deep_ocean: Infinity,
  tropical_ocean: Infinity,
  reef: Infinity,
  lake: Infinity,
  great_lake: Infinity,
  river: Infinity,
};

// --- Location entry taxes (added when entering a location from hex center) ---

export const LOCATION_TYPE_ENTRY_TAX: Partial<Record<LocationSubtype, number>> = {
  wilderness: 0,
  hamlet: 0,
  village: 0,
  town: 0.5,
  city: 1,
  castle: 1,
  fortress: 1.5,
  shrine: 0,
  temple: 0.5,
  ruins: 0.5,
  cave: 0.5,
  mine: 0.5,
  camp: 0,
  market: 0,
  port: 0.5,
  crossroads: 0,
};

// --- Decision weights ---

/** How fast distance reduces destination value. Higher = more local-focused agents. */
export const DISTANCE_DECAY_FACTOR = 0.15;

/** Default location entry tax when type not found in LOCATION_TYPE_ENTRY_TAX */
export const DEFAULT_LOCATION_ENTRY_TAX = 0;

/** Minimum edge cost after all modifiers (never free movement) */
export const MIN_EDGE_COST = 0.5;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/movement-content.test.ts`
Expected: PASS (all 8 tests)

**Step 5: Commit**

```bash
git add src/data/movement-content.ts src/data/__tests__/movement-content.test.ts
git commit -m "feat(movement): add terrain taxes and decision weight content data (DES-009 P0 Task 2)"
```

---

### Task 3: Edge Cost Calculator

**Files:**
- Create: `src/engine/movementCost.ts`
- Test: `src/engine/__tests__/movementCost.test.ts`

**Context:** This module computes the tick cost to traverse a single edge in the movement graph. It reads terrain type from the hex tile, location entry tax from content data, and speed modifiers from the agent's trait edges.

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/movementCost.test.ts
import { describe, it, expect } from 'vitest';
import { computeEdgeCost } from '../movementCost';
import { WorldGraph } from '../graph';
import type { MovementEdgeCost } from '../../types/movement';

describe('computeEdgeCost', () => {
  it('returns base cost for plains hex with no modifiers', () => {
    const graph = new WorldGraph();
    // Source hex node (grassland)
    graph.addNode({
      id: 'hex_center_a',
      type: 'location',
      name: 'Plains Center',
      properties: { terrain: 'grassland', hexCol: 0, hexRow: 0, locationType: 'hex_center' },
    });
    // Destination hex node (grassland)
    graph.addNode({
      id: 'hex_center_b',
      type: 'location',
      name: 'Plains Center B',
      properties: { terrain: 'grassland', hexCol: 1, hexRow: 0, locationType: 'hex_center' },
    });
    // Agent node with no speed modifiers
    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Test Agent',
      properties: { actorType: 'individual' },
    });

    const cost = computeEdgeCost(graph, 'agent_1', 'hex_center_a', 'hex_center_b');
    expect(cost.baseCost).toBe(1);
    expect(cost.terrainTax).toBe(0);
    expect(cost.locationTax).toBe(0);
    expect(cost.speedModifier).toBe(0);
    expect(cost.totalCost).toBe(1);
  });

  it('adds terrain tax for mountain destination', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'hex_a',
      type: 'location',
      name: 'Mountain Center',
      properties: { terrain: 'mountain', hexCol: 0, hexRow: 0, locationType: 'hex_center' },
    });
    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Agent',
      properties: { actorType: 'individual' },
    });

    const cost = computeEdgeCost(graph, 'agent_1', 'hex_a', 'hex_a');
    // Terrain tax for mountain = 1.5
    expect(cost.terrainTax).toBe(1.5);
    expect(cost.totalCost).toBe(2.5);
  });

  it('adds location entry tax for city', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'hex_center',
      type: 'location',
      name: 'Center',
      properties: { terrain: 'grassland', hexCol: 0, hexRow: 0, locationType: 'hex_center' },
    });
    graph.addNode({
      id: 'loc_city',
      type: 'location',
      name: 'City',
      properties: { locationSubtype: 'city', locationType: 'location' },
    });
    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Agent',
      properties: { actorType: 'individual' },
    });

    const cost = computeEdgeCost(graph, 'agent_1', 'hex_center', 'loc_city');
    expect(cost.locationTax).toBe(1); // city entry tax
    expect(cost.totalCost).toBe(2); // 1 base + 1 city tax
  });

  it('floors total cost at MIN_EDGE_COST', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'hex_a',
      type: 'location',
      name: 'Plains',
      properties: { terrain: 'grassland', hexCol: 0, hexRow: 0, locationType: 'hex_center' },
    });
    // Agent with massive speed bonus
    graph.addNode({
      id: 'agent_fast',
      type: 'actor',
      name: 'Fast Agent',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'trait_speed',
      source: 'agent_fast',
      target: 'agent_fast',
      type: 'has_trait',
      properties: { traitId: 'fleet_footed', movement_speed: -5 },
    });

    const cost = computeEdgeCost(graph, 'agent_fast', 'hex_a', 'hex_a');
    expect(cost.speedModifier).toBe(-5);
    expect(cost.totalCost).toBe(0.5); // floored at MIN_EDGE_COST
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/movementCost.test.ts`
Expected: FAIL — `../movementCost` does not exist

**Step 3: Write minimal implementation**

```typescript
// src/engine/movementCost.ts
/**
 * Edge cost calculator for the movement graph.
 *
 * Reads terrain tax from content data, location tax from node properties,
 * and speed modifiers from agent's trait edges. Engine provides formula;
 * content provides numbers.
 */

import type { WorldGraph } from './graph';
import type { MovementEdgeCost } from '../types/movement';
import { BASE_EDGE_TRAVERSAL_COST } from '../types/movement';
import {
  TERRAIN_MOVEMENT_TAX,
  LOCATION_TYPE_ENTRY_TAX,
  DEFAULT_LOCATION_ENTRY_TAX,
  MIN_EDGE_COST,
} from '../data/movement-content';

/**
 * Compute the tick cost to traverse from sourceId to destId for a given agent.
 *
 * Reads:
 * - Terrain type from destination node's `terrain` property
 * - Location subtype from destination node's `locationSubtype` property
 * - Speed modifiers from agent's `has_trait` edges with `movement_speed` property
 */
export function computeEdgeCost(
  graph: WorldGraph,
  agentId: string,
  _sourceId: string,
  destId: string,
): MovementEdgeCost {
  const destNode = graph.getNode(destId);

  // Terrain tax: look up destination terrain in content data
  let terrainTax = 0;
  if (destNode?.properties?.terrain) {
    const terrain = destNode.properties.terrain as string;
    terrainTax = TERRAIN_MOVEMENT_TAX[terrain as keyof typeof TERRAIN_MOVEMENT_TAX] ?? 0;
  }

  // Location entry tax: look up destination location subtype in content data
  let locationTax = 0;
  if (destNode?.properties?.locationSubtype) {
    const subtype = destNode.properties.locationSubtype as string;
    locationTax =
      LOCATION_TYPE_ENTRY_TAX[subtype as keyof typeof LOCATION_TYPE_ENTRY_TAX] ??
      DEFAULT_LOCATION_ENTRY_TAX;
  }
  // Also check for explicit entryTax property on the node (overrides content default)
  if (destNode?.properties?.entryTax !== undefined) {
    locationTax = destNode.properties.entryTax as number;
  }

  // Speed modifiers: sum movement_speed from agent's trait edges
  let speedModifier = 0;
  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  for (const edge of traitEdges) {
    if (edge.properties?.movement_speed !== undefined) {
      speedModifier += edge.properties.movement_speed as number;
    }
  }

  // Total cost: base + taxes + modifiers, floored at MIN_EDGE_COST
  const rawTotal = BASE_EDGE_TRAVERSAL_COST + terrainTax + locationTax + speedModifier;
  const totalCost = Math.max(rawTotal, MIN_EDGE_COST);

  return {
    baseCost: BASE_EDGE_TRAVERSAL_COST,
    terrainTax,
    locationTax,
    speedModifier,
    totalCost,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/movementCost.test.ts`
Expected: PASS (all 4 tests)

**Step 5: Commit**

```bash
git add src/engine/movementCost.ts src/engine/__tests__/movementCost.test.ts
git commit -m "feat(movement): edge cost calculator with terrain/location/speed modifiers (DES-009 P0 Task 3)"
```

---

### Task 4: Pathfinding (Dijkstra)

**Files:**
- Create: `src/engine/pathfinding.ts`
- Test: `src/engine/__tests__/pathfinding.test.ts`

**Context:** Dijkstra's algorithm on the movement graph. Weighted edges where weight = `computeEdgeCost()`. Returns shortest path (node IDs) and total tick cost. Operates on `adjacent` and `contains` edges in the world graph. Impassable terrain (Infinity cost) is skipped.

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/pathfinding.test.ts
import { describe, it, expect } from 'vitest';
import { findShortestPath, type PathResult } from '../pathfinding';
import { WorldGraph } from '../graph';

function buildLinearGraph(): WorldGraph {
  const g = new WorldGraph();
  // 3 hex centers in a line: A -- B -- C
  g.addNode({ id: 'hex_a', type: 'location', name: 'A', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 0, hexRow: 0 } });
  g.addNode({ id: 'hex_b', type: 'location', name: 'B', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 1, hexRow: 0 } });
  g.addNode({ id: 'hex_c', type: 'location', name: 'C', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 2, hexRow: 0 } });
  // Bidirectional adjacency
  g.addEdge({ id: 'e_ab', source: 'hex_a', target: 'hex_b', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'e_ba', source: 'hex_b', target: 'hex_a', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'e_bc', source: 'hex_b', target: 'hex_c', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'e_cb', source: 'hex_c', target: 'hex_b', type: 'adjacent', properties: {} });
  // Agent
  g.addNode({ id: 'agent_1', type: 'actor', name: 'Agent', properties: { actorType: 'individual' } });
  return g;
}

describe('findShortestPath', () => {
  it('finds direct neighbor path (1 hop)', () => {
    const g = buildLinearGraph();
    const result = findShortestPath(g, 'agent_1', 'hex_a', 'hex_b');
    expect(result).not.toBeNull();
    expect(result!.path).toEqual(['hex_b']);
    expect(result!.totalCost).toBe(1); // 1 base, 0 terrain tax on grassland
  });

  it('finds 2-hop path', () => {
    const g = buildLinearGraph();
    const result = findShortestPath(g, 'agent_1', 'hex_a', 'hex_c');
    expect(result).not.toBeNull();
    expect(result!.path).toEqual(['hex_b', 'hex_c']);
    expect(result!.totalCost).toBe(2); // 2 × 1 base cost
  });

  it('returns null for unreachable destination', () => {
    const g = buildLinearGraph();
    g.addNode({ id: 'hex_isolated', type: 'location', name: 'Island', properties: { terrain: 'grassland', locationType: 'hex_center' } });
    const result = findShortestPath(g, 'agent_1', 'hex_a', 'hex_isolated');
    expect(result).toBeNull();
  });

  it('avoids impassable terrain (ocean)', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'hex_a', type: 'location', name: 'A', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 0, hexRow: 0 } });
    g.addNode({ id: 'hex_ocean', type: 'location', name: 'Ocean', properties: { terrain: 'ocean', locationType: 'hex_center', hexCol: 1, hexRow: 0 } });
    g.addNode({ id: 'hex_c', type: 'location', name: 'C', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 2, hexRow: 0 } });
    g.addEdge({ id: 'e1', source: 'hex_a', target: 'hex_ocean', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'e2', source: 'hex_ocean', target: 'hex_a', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'e3', source: 'hex_ocean', target: 'hex_c', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'e4', source: 'hex_c', target: 'hex_ocean', type: 'adjacent', properties: {} });
    g.addNode({ id: 'agent_1', type: 'actor', name: 'Agent', properties: { actorType: 'individual' } });

    // Only path to C goes through ocean — should be unreachable
    const result = findShortestPath(g, 'agent_1', 'hex_a', 'hex_c');
    expect(result).toBeNull();
  });

  it('prefers lower-cost terrain', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'start', type: 'location', name: 'Start', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 0, hexRow: 0 } });
    g.addNode({ id: 'mountain', type: 'location', name: 'Mountain', properties: { terrain: 'mountain', locationType: 'hex_center', hexCol: 1, hexRow: 0 } });
    g.addNode({ id: 'plains', type: 'location', name: 'Plains', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 0, hexRow: 1 } });
    g.addNode({ id: 'end', type: 'location', name: 'End', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 1, hexRow: 1 } });
    // Direct: start → mountain → end (cost 1 + 2.5 = 3.5)
    g.addEdge({ id: 'e1', source: 'start', target: 'mountain', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'e2', source: 'mountain', target: 'end', type: 'adjacent', properties: {} });
    // Detour: start → plains → end (cost 1 + 1 = 2)
    g.addEdge({ id: 'e3', source: 'start', target: 'plains', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'e4', source: 'plains', target: 'end', type: 'adjacent', properties: {} });
    g.addNode({ id: 'agent_1', type: 'actor', name: 'Agent', properties: { actorType: 'individual' } });

    const result = findShortestPath(g, 'agent_1', 'start', 'end');
    expect(result).not.toBeNull();
    expect(result!.path).toEqual(['plains', 'end']); // avoids mountain
    expect(result!.totalCost).toBe(2);
  });

  it('includes within-hex location navigation', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'hex_center', type: 'location', name: 'Center', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 0, hexRow: 0 } });
    g.addNode({ id: 'loc_city', type: 'location', name: 'City', properties: { locationSubtype: 'city', locationType: 'location' } });
    // contains = navigable edge within hex
    g.addEdge({ id: 'e_contains', source: 'hex_center', target: 'loc_city', type: 'contains', properties: {} });
    g.addEdge({ id: 'e_exit', source: 'loc_city', target: 'hex_center', type: 'contains', properties: {} });
    g.addNode({ id: 'agent_1', type: 'actor', name: 'Agent', properties: { actorType: 'individual' } });

    const result = findShortestPath(g, 'agent_1', 'hex_center', 'loc_city');
    expect(result).not.toBeNull();
    expect(result!.path).toEqual(['loc_city']);
    expect(result!.totalCost).toBe(2); // 1 base + 1 city entry tax
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/pathfinding.test.ts`
Expected: FAIL — `../pathfinding` does not exist

**Step 3: Write minimal implementation**

```typescript
// src/engine/pathfinding.ts
/**
 * Dijkstra's shortest-path on the movement graph.
 *
 * Traverses `adjacent` edges (hex-to-hex) and `contains` edges (within-hex).
 * Edge weight = computeEdgeCost(). Impassable edges (Infinity cost) are skipped.
 */

import type { WorldGraph } from './graph';
import { computeEdgeCost } from './movementCost';

export interface PathResult {
  /** Ordered node IDs to visit (does NOT include the start node) */
  path: string[];
  /** Total tick cost of the path */
  totalCost: number;
}

/** Edge types that form the navigable movement graph */
const MOVEMENT_EDGE_TYPES = ['adjacent', 'contains'] as const;

/**
 * Find the shortest path from startId to endId for a given agent.
 * Returns null if no path exists (unreachable or all paths go through impassable terrain).
 */
export function findShortestPath(
  graph: WorldGraph,
  agentId: string,
  startId: string,
  endId: string,
): PathResult | null {
  if (startId === endId) {
    return { path: [], totalCost: 0 };
  }

  // Dijkstra's algorithm
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();

  // Priority queue (simple array-based — fine for ~320 hexes + locations)
  const queue: Array<{ nodeId: string; cost: number }> = [];

  dist.set(startId, 0);
  queue.push({ nodeId: startId, cost: 0 });

  while (queue.length > 0) {
    // Extract minimum
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;

    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    if (current.nodeId === endId) break;

    // Explore neighbors via movement edges
    for (const edgeType of MOVEMENT_EDGE_TYPES) {
      const edges = graph.getOutgoingEdges(current.nodeId, edgeType);
      for (const edge of edges) {
        const neighborId = edge.target;
        if (visited.has(neighborId)) continue;

        // Skip non-location nodes (agents, traits, etc.)
        const neighborNode = graph.getNode(neighborId);
        if (!neighborNode || neighborNode.type !== 'location') continue;

        const edgeCost = computeEdgeCost(graph, agentId, current.nodeId, neighborId);
        if (!isFinite(edgeCost.totalCost)) continue; // impassable

        const newDist = (dist.get(current.nodeId) ?? Infinity) + edgeCost.totalCost;
        if (newDist < (dist.get(neighborId) ?? Infinity)) {
          dist.set(neighborId, newDist);
          prev.set(neighborId, current.nodeId);
          queue.push({ nodeId: neighborId, cost: newDist });
        }
      }
    }
  }

  // Reconstruct path
  if (!prev.has(endId) && startId !== endId) {
    return null; // unreachable
  }

  const path: string[] = [];
  let current = endId;
  while (current !== startId) {
    path.unshift(current);
    current = prev.get(current)!;
  }

  return {
    path,
    totalCost: dist.get(endId) ?? Infinity,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/pathfinding.test.ts`
Expected: PASS (all 6 tests)

**Step 5: Commit**

```bash
git add src/engine/pathfinding.ts src/engine/__tests__/pathfinding.test.ts
git commit -m "feat(movement): Dijkstra pathfinding on movement graph (DES-009 P0 Task 4)"
```

---

### Task 5: Movement Candidate Generation & Scoring

**Files:**
- Create: `src/engine/movementCandidates.ts`
- Test: `src/engine/__tests__/movementCandidates.test.ts`

**Context:** For a given agent at a given location, generate `MovementCandidate` entries for reachable destinations that have action/encounter templates. Score each by `motivationPull × distanceDecay`. These candidates then compete with local action candidates in the selection pipeline.

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/movementCandidates.test.ts
import { describe, it, expect } from 'vitest';
import { generateMovementCandidates, scoreMovementCandidate } from '../movementCandidates';
import { WorldGraph } from '../graph';
import type { AxiologicalProfile } from '../../types/agent';

// Minimal profile: all zeros except ambition=0.8
function testProfile(): AxiologicalProfile {
  return {
    ambition_contentment: 0.8,
    courage_prudence: 0.5,
    cruelty_compassion: 0,
    cunning_honesty: 0,
    devotion_independence: 0,
    loyalty_treachery: 0,
    tradition_innovation: 0,
    dominance_humility: 0,
    wrath_patience: 0,
    greed_generosity: 0,
  };
}

function buildTestGraph(): WorldGraph {
  const g = new WorldGraph();
  // Two hexes, each with a location
  g.addNode({ id: 'hex_a', type: 'location', name: 'Hex A', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 0, hexRow: 0 } });
  g.addNode({ id: 'hex_b', type: 'location', name: 'Hex B', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 1, hexRow: 0 } });
  g.addEdge({ id: 'adj_ab', source: 'hex_a', target: 'hex_b', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj_ba', source: 'hex_b', target: 'hex_a', type: 'adjacent', properties: {} });

  // Location with encounters at hex B
  g.addNode({ id: 'loc_b', type: 'location', name: 'Town B', properties: { locationSubtype: 'town', locationType: 'location' } });
  g.addEdge({ id: 'contains_b', source: 'hex_b', target: 'loc_b', type: 'contains', properties: {} });

  // Agent at hex_a
  g.addNode({ id: 'agent_1', type: 'actor', name: 'Agent', properties: { actorType: 'individual', archetypeId: 'warlord' } });
  g.addEdge({ id: 'loc_agent', source: 'agent_1', target: 'hex_a', type: 'located_at', properties: {} });

  return g;
}

describe('scoreMovementCandidate', () => {
  it('applies distance decay to motivation score', () => {
    const score = scoreMovementCandidate(0.8, 2); // motivationPull=0.8, tickDistance=2
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.8); // decay reduces it
  });

  it('nearby destination scores higher than distant', () => {
    const near = scoreMovementCandidate(0.8, 1);
    const far = scoreMovementCandidate(0.8, 10);
    expect(near).toBeGreaterThan(far);
  });

  it('high motivation overcomes distance', () => {
    const highMotivation = scoreMovementCandidate(5.0, 10); // quest priority inflated
    const lowMotivationNear = scoreMovementCandidate(0.5, 1);
    expect(highMotivation).toBeGreaterThan(lowMotivationNear);
  });
});

describe('generateMovementCandidates', () => {
  it('returns empty array when no reachable locations exist', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'hex_isolated', type: 'location', name: 'Isolated', properties: { terrain: 'grassland', locationType: 'hex_center' } });
    g.addNode({ id: 'agent', type: 'actor', name: 'Agent', properties: { actorType: 'individual' } });
    g.addEdge({ id: 'loc', source: 'agent', target: 'hex_isolated', type: 'located_at', properties: {} });

    const candidates = generateMovementCandidates(g, 'agent', 'hex_isolated', testProfile());
    expect(candidates).toEqual([]);
  });

  it('generates candidates for adjacent hex locations', () => {
    const g = buildTestGraph();
    const candidates = generateMovementCandidates(g, 'agent_1', 'hex_a', testProfile());
    // Should find hex_b and/or loc_b as destinations
    expect(candidates.length).toBeGreaterThan(0);
    const destIds = candidates.map(c => c.destinationId);
    expect(destIds).toContain('hex_b');
  });

  it('candidates have path and tickDistance', () => {
    const g = buildTestGraph();
    const candidates = generateMovementCandidates(g, 'agent_1', 'hex_a', testProfile());
    for (const c of candidates) {
      expect(c.path.length).toBeGreaterThan(0);
      expect(c.tickDistance).toBeGreaterThan(0);
      expect(c.score).toBeGreaterThanOrEqual(0);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/movementCandidates.test.ts`
Expected: FAIL — `../movementCandidates` does not exist

**Step 3: Write minimal implementation**

```typescript
// src/engine/movementCandidates.ts
/**
 * Generate and score movement candidates for an agent.
 *
 * Scans reachable locations in the movement graph, scores each by
 * motivationPull × distanceDecay, returns sorted candidates for the
 * selection pipeline.
 */

import type { WorldGraph } from './graph';
import type { AxiologicalProfile } from '../types/agent';
import type { MovementCandidate } from '../types/movement';
import { findShortestPath } from './pathfinding';
import { DISTANCE_DECAY_FACTOR } from '../data/movement-content';

/** Maximum tick distance to consider for movement candidates */
const MAX_CANDIDATE_DISTANCE = 40;

/**
 * Score a movement candidate: motivationPull × distanceDecay.
 *
 * P0: threat and social modifiers are not yet applied (deferred to P1).
 */
export function scoreMovementCandidate(
  motivationPull: number,
  tickDistance: number,
): number {
  const distanceDecay = 1 / (1 + DISTANCE_DECAY_FACTOR * tickDistance);
  return motivationPull * distanceDecay;
}

/**
 * Generate movement candidates for an agent at a given location.
 *
 * Finds all reachable location nodes within MAX_CANDIDATE_DISTANCE,
 * computes a motivation score for each based on the agent's axiological profile,
 * and returns scored MovementCandidate entries.
 *
 * P0: motivation is a simple heuristic based on location having encounters.
 * Full axiological scoring against encounter templates deferred to P1 integration.
 */
export function generateMovementCandidates(
  graph: WorldGraph,
  agentId: string,
  currentLocationId: string,
  profile: AxiologicalProfile,
): MovementCandidate[] {
  const candidates: MovementCandidate[] = [];

  // Gather all location nodes as potential destinations
  const allLocations = graph.getNodesByType('location');

  for (const loc of allLocations) {
    if (loc.id === currentLocationId) continue;

    // Find path
    const pathResult = findShortestPath(graph, agentId, currentLocationId, loc.id);
    if (!pathResult || pathResult.totalCost > MAX_CANDIDATE_DISTANCE) continue;
    if (pathResult.path.length === 0) continue;

    // P0 motivation heuristic: base pull of 0.5 for any reachable location
    // In P1 this will be replaced by axiological scoring against destination encounter templates
    const basePull = computeBasePull(graph, loc.id, profile);
    if (basePull <= 0) continue;

    const score = scoreMovementCandidate(basePull, pathResult.totalCost);

    candidates.push({
      destinationId: loc.id,
      bestTemplateId: '', // P0 placeholder — filled in P1 with encounter template scoring
      motivationPull: basePull,
      distanceDecay: 1 / (1 + DISTANCE_DECAY_FACTOR * pathResult.totalCost),
      score,
      tickDistance: pathResult.totalCost,
      path: pathResult.path,
    });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

/**
 * P0 motivation heuristic: locations with more outgoing edges (encounters, features)
 * score higher. Scaled by the agent's ambition (ambitious agents are more motivated to move).
 * This is a placeholder — P1 replaces with full axiological scoring of encounter templates.
 */
function computeBasePull(
  graph: WorldGraph,
  locationId: string,
  profile: AxiologicalProfile,
): number {
  // Locations that are hex centers get a base pull (agents want to explore)
  const node = graph.getNode(locationId);
  if (!node) return 0;

  // Skip non-hex-center locations for P0 (agents move hex-to-hex)
  const locType = node.properties?.locationType;
  if (locType !== 'hex_center') return 0;

  // Base pull: 0.3 + ambition bonus
  const ambitionBonus = Math.max(0, profile.ambition_contentment) * 0.4;
  return 0.3 + ambitionBonus;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/movementCandidates.test.ts`
Expected: PASS (all 6 tests)

**Step 5: Commit**

```bash
git add src/engine/movementCandidates.ts src/engine/__tests__/movementCandidates.test.ts
git commit -m "feat(movement): movement candidate generation and distance-decay scoring (DES-009 P0 Task 5)"
```

---

### Task 6: Movement Execution (Tick-Based)

**Files:**
- Create: `src/engine/movementExecution.ts`
- Test: `src/engine/__tests__/movementExecution.test.ts`

**Context:** Each tick, agents with a `movementQueue` accumulate ticks toward the current edge cost. When paid, they transition to the next node. The `located_at` edge is updated. Movement history is recorded.

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/movementExecution.test.ts
import { describe, it, expect } from 'vitest';
import {
  tickMovement,
  initMovementState,
  type MovementTickResult,
} from '../movementExecution';
import { WorldGraph } from '../graph';
import type { MovementState } from '../../types/movement';

function buildSimpleGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'hex_a', type: 'location', name: 'A', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 0, hexRow: 0 } });
  g.addNode({ id: 'hex_b', type: 'location', name: 'B', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 1, hexRow: 0 } });
  g.addEdge({ id: 'adj_ab', source: 'hex_a', target: 'hex_b', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj_ba', source: 'hex_b', target: 'hex_a', type: 'adjacent', properties: {} });
  // Agent at hex_a
  g.addNode({ id: 'agent_1', type: 'actor', name: 'Agent', properties: { actorType: 'individual' } });
  g.addEdge({ id: 'loc_edge', source: 'agent_1', target: 'hex_a', type: 'located_at', properties: {} });
  return g;
}

describe('initMovementState', () => {
  it('creates state with queue and zero accumulated ticks', () => {
    const state = initMovementState('hex_b', ['hex_b'], 1, 5);
    expect(state.destinationId).toBe('hex_b');
    expect(state.movementQueue).toEqual(['hex_b']);
    expect(state.ticksAccumulated).toBe(0);
    expect(state.currentEdgeCost).toBe(1);
    expect(state.lastDecisionTick).toBe(5);
    expect(state.movementHistory).toEqual([]);
  });
});

describe('tickMovement', () => {
  it('accumulates ticks toward edge cost', () => {
    const g = buildSimpleGraph();
    const mState: MovementState = {
      destinationId: 'hex_b',
      movementQueue: ['hex_b'],
      ticksAccumulated: 0,
      currentEdgeCost: 1, // 1 tick to traverse grassland
      lastDecisionTick: 0,
      movementHistory: [],
    };

    const result = tickMovement(g, 'agent_1', mState, 1);
    expect(result.moved).toBe(true);
    expect(result.arrivedAtDestination).toBe(true);
    expect(result.newLocationId).toBe('hex_b');
  });

  it('does not move when edge cost not yet paid', () => {
    const g = buildSimpleGraph();
    // Mountain hex costs 2.5 ticks
    g.updateNode('hex_b', { properties: { ...g.getNode('hex_b')!.properties, terrain: 'mountain' } });

    const mState: MovementState = {
      destinationId: 'hex_b',
      movementQueue: ['hex_b'],
      ticksAccumulated: 0,
      currentEdgeCost: 2.5,
      lastDecisionTick: 0,
      movementHistory: [],
    };

    const result = tickMovement(g, 'agent_1', mState, 1);
    expect(result.moved).toBe(false);
    expect(result.updatedState.ticksAccumulated).toBe(1);
  });

  it('records movement history on transition', () => {
    const g = buildSimpleGraph();
    const mState: MovementState = {
      destinationId: 'hex_b',
      movementQueue: ['hex_b'],
      ticksAccumulated: 0,
      currentEdgeCost: 1,
      lastDecisionTick: 0,
      movementHistory: [],
    };

    const result = tickMovement(g, 'agent_1', mState, 5);
    expect(result.updatedState.movementHistory).toHaveLength(1);
    expect(result.updatedState.movementHistory[0].nodeId).toBe('hex_b');
    expect(result.updatedState.movementHistory[0].tick).toBe(5);
  });

  it('updates located_at edge on transition', () => {
    const g = buildSimpleGraph();
    const mState: MovementState = {
      destinationId: 'hex_b',
      movementQueue: ['hex_b'],
      ticksAccumulated: 0,
      currentEdgeCost: 1,
      lastDecisionTick: 0,
      movementHistory: [],
    };

    tickMovement(g, 'agent_1', mState, 1);
    // Agent should now be located_at hex_b
    const locEdges = g.getOutgoingEdges('agent_1', 'located_at');
    expect(locEdges).toHaveLength(1);
    expect(locEdges[0].target).toBe('hex_b');
  });

  it('returns empty queue when path complete', () => {
    const g = buildSimpleGraph();
    const mState: MovementState = {
      destinationId: 'hex_b',
      movementQueue: ['hex_b'],
      ticksAccumulated: 0,
      currentEdgeCost: 1,
      lastDecisionTick: 0,
      movementHistory: [],
    };

    const result = tickMovement(g, 'agent_1', mState, 1);
    expect(result.updatedState.movementQueue).toEqual([]);
    expect(result.arrivedAtDestination).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/movementExecution.test.ts`
Expected: FAIL — `../movementExecution` does not exist

**Step 3: Write minimal implementation**

```typescript
// src/engine/movementExecution.ts
/**
 * Tick-based movement execution.
 *
 * Each tick, agents with a movementQueue accumulate ticks toward the current
 * edge cost. When paid, they transition to the next node. The located_at edge
 * is updated on the graph. Movement history is recorded for trail rendering.
 */

import type { WorldGraph } from './graph';
import type { MovementState, MovementHistoryEntry } from '../types/movement';
import { TRAIL_HISTORY_TICKS } from '../types/movement';
import { computeEdgeCost } from './movementCost';

export interface MovementTickResult {
  /** Whether the agent transitioned to a new node this tick */
  moved: boolean;
  /** Whether the agent reached its final destination */
  arrivedAtDestination: boolean;
  /** New location ID if moved, undefined otherwise */
  newLocationId?: string;
  /** Updated movement state */
  updatedState: MovementState;
}

/**
 * Create initial MovementState for an agent starting a journey.
 */
export function initMovementState(
  destinationId: string,
  path: string[],
  firstEdgeCost: number,
  currentTick: number,
): MovementState {
  return {
    destinationId,
    movementQueue: [...path],
    ticksAccumulated: 0,
    currentEdgeCost: firstEdgeCost,
    lastDecisionTick: currentTick,
    movementHistory: [],
  };
}

/**
 * Advance one tick of movement for an agent.
 *
 * If the agent has accumulated enough ticks, they transition to the next
 * node in the queue. The graph's located_at edge is updated.
 */
export function tickMovement(
  graph: WorldGraph,
  agentId: string,
  state: MovementState,
  currentTick: number,
): MovementTickResult {
  if (state.movementQueue.length === 0) {
    return { moved: false, arrivedAtDestination: true, updatedState: state };
  }

  // Accumulate 1 tick
  const newAccumulated = state.ticksAccumulated + 1;

  if (newAccumulated >= state.currentEdgeCost) {
    // Transition to next node
    const nextNodeId = state.movementQueue[0];
    const remainingQueue = state.movementQueue.slice(1);

    // Update located_at edge on the graph
    updateLocatedAt(graph, agentId, nextNodeId);

    // Record in movement history (newest first, capped at TRAIL_HISTORY_TICKS)
    const nextNode = graph.getNode(nextNodeId);
    const historyEntry: MovementHistoryEntry = {
      nodeId: nextNodeId,
      tick: currentTick,
      hexCol: nextNode?.properties?.hexCol as number | undefined,
      hexRow: nextNode?.properties?.hexRow as number | undefined,
    };
    const newHistory = [historyEntry, ...state.movementHistory].slice(0, TRAIL_HISTORY_TICKS);

    // Compute next edge cost if there are more nodes in queue
    let nextEdgeCost = 0;
    if (remainingQueue.length > 0) {
      const costResult = computeEdgeCost(graph, agentId, nextNodeId, remainingQueue[0]);
      nextEdgeCost = costResult.totalCost;
    }

    const updatedState: MovementState = {
      ...state,
      movementQueue: remainingQueue,
      ticksAccumulated: 0,
      currentEdgeCost: nextEdgeCost,
      movementHistory: newHistory,
    };

    return {
      moved: true,
      arrivedAtDestination: remainingQueue.length === 0,
      newLocationId: nextNodeId,
      updatedState,
    };
  }

  // Not enough ticks yet — keep accumulating
  return {
    moved: false,
    arrivedAtDestination: false,
    updatedState: {
      ...state,
      ticksAccumulated: newAccumulated,
    },
  };
}

/**
 * Update the agent's located_at edge to point to a new location.
 * Removes all existing located_at edges for this agent first.
 */
function updateLocatedAt(graph: WorldGraph, agentId: string, newLocationId: string): void {
  // Remove old located_at edges
  const oldEdges = graph.getOutgoingEdges(agentId, 'located_at');
  for (const edge of oldEdges) {
    graph.removeEdge(edge.id);
  }

  // Add new located_at edge
  graph.addEdge({
    id: `located_at_${agentId}_${newLocationId}`,
    source: agentId,
    target: newLocationId,
    type: 'located_at',
    properties: {},
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/movementExecution.test.ts`
Expected: PASS (all 6 tests)

**Step 5: Commit**

```bash
git add src/engine/movementExecution.ts src/engine/__tests__/movementExecution.test.ts
git commit -m "feat(movement): tick-based movement execution with located_at updates (DES-009 P0 Task 6)"
```

---

### Task 7: Movement Phase (Tick Loop Integration)

**Files:**
- Create: `src/engine/phaseMovement.ts`
- Test: `src/engine/__tests__/phaseMovement.test.ts`
- Modify: `src/engine/orchestrator.ts` (add phase call into `runTick`)
- Modify: `src/engine/agentLifecycle.ts` (remove migration logic)

**Context:** New `phaseMovement` function replaces the random migration in `phaseAgentLifecycle`. For each agent: if they have a `movementQueue`, tick their movement. If they don't (and it's time to re-evaluate), generate movement candidates and potentially start moving. This phase runs after agent actions but before narrative/essence phases.

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/phaseMovement.test.ts
import { describe, it, expect } from 'vitest';
import { phaseMovement } from '../phaseMovement';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { MovementState } from '../../types/movement';

function buildMinimalState(): GameState {
  const graph = new WorldGraph();

  // Two hexes
  graph.addNode({ id: 'hex_a', type: 'location', name: 'A', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 0, hexRow: 0 } });
  graph.addNode({ id: 'hex_b', type: 'location', name: 'B', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 1, hexRow: 0 } });
  graph.addEdge({ id: 'adj_ab', source: 'hex_a', target: 'hex_b', type: 'adjacent', properties: {} });
  graph.addEdge({ id: 'adj_ba', source: 'hex_b', target: 'hex_a', type: 'adjacent', properties: {} });

  // Ascendant (god) — should not move
  graph.addNode({ id: 'god_1', type: 'actor', name: 'Player God', properties: { actorType: 'god' } });

  // Agent with existing movement state
  graph.addNode({
    id: 'agent_moving',
    type: 'actor',
    name: 'Moving Agent',
    properties: {
      actorType: 'individual',
      movementState: {
        destinationId: 'hex_b',
        movementQueue: ['hex_b'],
        ticksAccumulated: 0,
        currentEdgeCost: 1,
        lastDecisionTick: 0,
        movementHistory: [],
      } satisfies MovementState,
    },
  });
  graph.addEdge({ id: 'loc_moving', source: 'agent_moving', target: 'hex_a', type: 'located_at', properties: {} });

  // Minimal GameState (only fields phaseMovement needs)
  return {
    graph,
    tick: 5,
    seed: 42,
    tickEvents: [],
  } as unknown as GameState;
}

describe('phaseMovement', () => {
  it('advances agents with existing movementQueue', () => {
    const state = buildMinimalState();
    const result = phaseMovement(state);

    // Agent should have moved to hex_b
    const agent = state.graph.getNode('agent_moving');
    const mState = agent?.properties?.movementState as MovementState | undefined;
    // After movement, queue should be empty (arrived)
    expect(mState?.movementQueue).toEqual([]);

    // located_at should point to hex_b
    const locEdges = state.graph.getOutgoingEdges('agent_moving', 'located_at');
    expect(locEdges[0].target).toBe('hex_b');
  });

  it('emits tick event on agent movement', () => {
    const state = buildMinimalState();
    const result = phaseMovement(state);
    const moveEvents = (result.tickEvents ?? []).filter(
      e => e.type === 'agent_movement'
    );
    expect(moveEvents.length).toBeGreaterThan(0);
  });

  it('does not move gods or ascendants', () => {
    const state = buildMinimalState();
    phaseMovement(state);
    // God should have no movementState
    const god = state.graph.getNode('god_1');
    expect(god?.properties?.movementState).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/phaseMovement.test.ts`
Expected: FAIL — `../phaseMovement` does not exist

**Step 3: Write minimal implementation**

```typescript
// src/engine/phaseMovement.ts
/**
 * Movement phase — runs once per tick for all mobile agents.
 *
 * For agents with a movementQueue: advance their movement.
 * For agents without a queue (and due for re-evaluation): generate candidates,
 * potentially start a new journey.
 *
 * Replaces the random migration logic from phaseAgentLifecycle.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { MovementState } from '../types/movement';
import { DECISION_REEVALUATION_TICKS } from '../types/movement';
import { tickMovement, initMovementState } from './movementExecution';
import { generateMovementCandidates } from './movementCandidates';
import { computeEdgeCost } from './movementCost';
import type { AxiologicalProfile } from '../types/agent';

/** Actor types that are mobile (can have movementState) */
const MOBILE_ACTOR_TYPES = ['individual'];

/** Minimum movement candidate score to start a journey */
const MOVEMENT_SCORE_THRESHOLD = 0.1;

let movementEventCounter = 0;

export function resetMovementEventCounter(): void {
  movementEventCounter = 0;
}

/**
 * Execute movement phase for all mobile agents.
 */
export function phaseMovement(state: GameState): Partial<GameState> {
  const { graph, tick } = state;
  const events: TickEvent[] = [];

  const actors = graph.getNodesByType('actor');

  for (const actor of actors) {
    // Skip non-mobile actors
    if (!MOBILE_ACTOR_TYPES.includes(actor.properties?.actorType as string)) continue;

    const movementState = actor.properties?.movementState as MovementState | undefined;

    if (movementState && movementState.movementQueue.length > 0) {
      // Agent is in transit — tick their movement
      const result = tickMovement(graph, actor.id, movementState, tick);

      // Update movement state on the node
      graph.updateNode(actor.id, {
        properties: {
          ...actor.properties,
          movementState: result.updatedState,
        },
      });

      if (result.moved) {
        movementEventCounter++;
        events.push({
          id: `move_${tick}_${movementEventCounter}`,
          tick,
          type: 'agent_movement' as TickEvent['type'],
          message: `${actor.name} moved to ${result.newLocationId}`,
          significance: 1,
        });
      }

      if (result.arrivedAtDestination) {
        // Clear movement state — agent will re-evaluate next cycle
        graph.updateNode(actor.id, {
          properties: {
            ...actor.properties,
            movementState: {
              ...result.updatedState,
              movementQueue: [],
            },
          },
        });
      }
    } else {
      // Agent is idle — check if it's time to evaluate movement
      const lastDecision = (movementState?.lastDecisionTick ?? 0);
      if (tick - lastDecision < DECISION_REEVALUATION_TICKS && tick > 0) continue;

      // Find agent's current location
      const locEdges = graph.getOutgoingEdges(actor.id, 'located_at');
      if (locEdges.length === 0) continue;
      const currentLocationId = locEdges[0].target;

      // Get agent's axiological profile (default to neutral if missing)
      const profile = (actor.properties?.axiologicalProfile as AxiologicalProfile) ??
        defaultProfile();

      // Generate movement candidates
      const candidates = generateMovementCandidates(
        graph, actor.id, currentLocationId, profile
      );

      if (candidates.length > 0 && candidates[0].score >= MOVEMENT_SCORE_THRESHOLD) {
        const best = candidates[0];
        const firstEdgeCost = computeEdgeCost(
          graph, actor.id, currentLocationId, best.path[0]
        ).totalCost;

        const newState = initMovementState(
          best.destinationId, best.path, firstEdgeCost, tick
        );

        // Preserve movement history from previous state
        if (movementState?.movementHistory) {
          newState.movementHistory = movementState.movementHistory;
        }

        graph.updateNode(actor.id, {
          properties: {
            ...actor.properties,
            movementState: newState,
          },
        });
      } else {
        // No good destination — update lastDecisionTick so we don't re-evaluate every tick
        graph.updateNode(actor.id, {
          properties: {
            ...actor.properties,
            movementState: {
              destinationId: '',
              movementQueue: [],
              ticksAccumulated: 0,
              currentEdgeCost: 0,
              lastDecisionTick: tick,
              movementHistory: movementState?.movementHistory ?? [],
            },
          },
        });
      }
    }
  }

  return { tickEvents: [...(state.tickEvents ?? []), ...events] };
}

function defaultProfile(): AxiologicalProfile {
  return {
    ambition_contentment: 0,
    courage_prudence: 0,
    cruelty_compassion: 0,
    cunning_honesty: 0,
    devotion_independence: 0,
    loyalty_treachery: 0,
    tradition_innovation: 0,
    dominance_humility: 0,
    wrath_patience: 0,
    greed_generosity: 0,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/phaseMovement.test.ts`
Expected: PASS (all 3 tests)

**Step 5: Wire into orchestrator**

Modify `src/engine/orchestrator.ts`:
- Add import: `import { phaseMovement } from './phaseMovement';`
- Add `'agent_movement'` to the TickEvent type union in `src/types/gameState.ts`
- In `runTick()`, add `phaseMovement` call after `phaseAgentActions` / `phaseEncounterProgression` but before `phaseNarrative`

Modify `src/engine/agentLifecycle.ts`:
- Remove the migration section (the block guarded by `MIGRATION_CHANCE` roll)
- Keep death and birth logic untouched

**Step 6: Run full test suite**

Run: `npm test`
Expected: All existing tests pass. New tests pass. Any test that relied on MIGRATION_CHANCE behavior may need updating.

**Step 7: Commit**

```bash
git add src/engine/phaseMovement.ts src/engine/__tests__/phaseMovement.test.ts src/engine/orchestrator.ts src/engine/agentLifecycle.ts src/types/gameState.ts
git commit -m "feat(movement): phaseMovement tick loop integration, replace random migration (DES-009 P0 Task 7)"
```

---

### Task 8: Integration Test

**Files:**
- Create: `src/engine/__tests__/movement-integration.test.ts`

**Context:** End-to-end test that verifies the full movement pipeline: agent starts at hex A, evaluates destinations, picks hex B, accumulates ticks, transitions, arrives. Uses seeded PRNG for determinism.

**Step 1: Write the integration test**

```typescript
// src/engine/__tests__/movement-integration.test.ts
import { describe, it, expect } from 'vitest';
import { phaseMovement, resetMovementEventCounter } from '../phaseMovement';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { MovementState } from '../../types/movement';
import type { AxiologicalProfile } from '../../types/agent';

function buildIntegrationGraph(): WorldGraph {
  const g = new WorldGraph();

  // 3x1 hex grid: A(grassland) — B(forest) — C(grassland)
  g.addNode({ id: 'hex_a', type: 'location', name: 'Plains A', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 0, hexRow: 0 } });
  g.addNode({ id: 'hex_b', type: 'location', name: 'Forest B', properties: { terrain: 'forest', locationType: 'hex_center', hexCol: 1, hexRow: 0 } });
  g.addNode({ id: 'hex_c', type: 'location', name: 'Plains C', properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 2, hexRow: 0 } });

  // Bidirectional adjacency
  g.addEdge({ id: 'adj_ab', source: 'hex_a', target: 'hex_b', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj_ba', source: 'hex_b', target: 'hex_a', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj_bc', source: 'hex_b', target: 'hex_c', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj_cb', source: 'hex_c', target: 'hex_b', type: 'adjacent', properties: {} });

  // Agent at hex_a with ambition
  const profile: AxiologicalProfile = {
    ambition_contentment: 0.8,
    courage_prudence: 0.5,
    cruelty_compassion: 0,
    cunning_honesty: 0,
    devotion_independence: 0,
    loyalty_treachery: 0,
    tradition_innovation: 0,
    dominance_humility: 0,
    wrath_patience: 0,
    greed_generosity: 0,
  };

  g.addNode({
    id: 'agent_1',
    type: 'actor',
    name: 'Kael the Wanderer',
    properties: { actorType: 'individual', axiologicalProfile: profile },
  });
  g.addEdge({ id: 'loc_1', source: 'agent_1', target: 'hex_a', type: 'located_at', properties: {} });

  return g;
}

describe('movement integration', () => {
  it('agent evaluates, picks destination, and moves over multiple ticks', () => {
    resetMovementEventCounter();
    const graph = buildIntegrationGraph();

    // Tick 0: agent should evaluate and pick a destination
    let state = { graph, tick: 0, seed: 42, tickEvents: [] } as unknown as GameState;
    let result = phaseMovement(state);

    const agent = graph.getNode('agent_1')!;
    const mState = agent.properties?.movementState as MovementState;
    expect(mState).toBeDefined();
    expect(mState.movementQueue.length).toBeGreaterThan(0);
    expect(mState.destinationId).toBeTruthy();

    // Simulate ticks until the agent arrives at its destination
    let arrived = false;
    for (let t = 1; t <= 20; t++) {
      state = { ...state, tick: t, tickEvents: [] };
      result = phaseMovement(state);
      const updated = graph.getNode('agent_1')!.properties?.movementState as MovementState;
      if (updated.movementQueue.length === 0 && updated.destinationId) {
        arrived = true;
        break;
      }
    }

    expect(arrived).toBe(true);

    // Agent should no longer be at hex_a
    const locEdges = graph.getOutgoingEdges('agent_1', 'located_at');
    expect(locEdges[0].target).not.toBe('hex_a');
  });

  it('movement is deterministic (same seed = same result)', () => {
    resetMovementEventCounter();
    const g1 = buildIntegrationGraph();
    const g2 = buildIntegrationGraph();

    // Run 5 ticks on both graphs
    for (let t = 0; t < 5; t++) {
      phaseMovement({ graph: g1, tick: t, seed: 42, tickEvents: [] } as unknown as GameState);
      resetMovementEventCounter();
      phaseMovement({ graph: g2, tick: t, seed: 42, tickEvents: [] } as unknown as GameState);
      resetMovementEventCounter();
    }

    const loc1 = g1.getOutgoingEdges('agent_1', 'located_at')[0].target;
    const loc2 = g2.getOutgoingEdges('agent_1', 'located_at')[0].target;
    expect(loc1).toBe(loc2);
  });

  it('movement history accumulates entries', () => {
    resetMovementEventCounter();
    const graph = buildIntegrationGraph();

    for (let t = 0; t <= 10; t++) {
      phaseMovement({ graph, tick: t, seed: 42, tickEvents: [] } as unknown as GameState);
    }

    const mState = graph.getNode('agent_1')!.properties?.movementState as MovementState;
    expect(mState.movementHistory.length).toBeGreaterThan(0);
    // Each entry should have a tick
    for (const entry of mState.movementHistory) {
      expect(entry.tick).toBeGreaterThanOrEqual(0);
      expect(entry.nodeId).toBeTruthy();
    }
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/engine/__tests__/movement-integration.test.ts`
Expected: PASS (all 3 tests)

**Step 3: Commit**

```bash
git add src/engine/__tests__/movement-integration.test.ts
git commit -m "test(movement): integration tests for full movement pipeline (DES-009 P0 Task 8)"
```

---

### Task 9: Verify & Cleanup

**Step 1: Run full test suite**

Run: `npm test`
Expected: ALL tests pass (existing + new). Zero regressions.

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: Zero type errors.

**Step 3: Run build**

Run: `npx vite build`
Expected: Successful production build.

**Step 4: Verify no hardcoded magic numbers**

Manually check: all movement-related constants live in `src/types/movement.ts` or `src/data/movement-content.ts`. No raw numbers in engine logic.

**Step 5: Update design doc status**

Edit `Docs/plans/2026-03-11-agent-visibility-movement-design.md` line 4:
```
**Status:** P0 implemented — P1 pending
```

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore(movement): P0 implementation complete, update design doc status (DES-009)"
```

---

## Summary

| Task | Module | Tests | What it does |
|------|--------|-------|-------------|
| 1 | `types/movement.ts` | 5 | Types: MovementState, MovementEdgeCost, MovementCandidate, constants |
| 2 | `data/movement-content.ts` | 8 | Content data: terrain taxes, location taxes, distance decay factor |
| 3 | `engine/movementCost.ts` | 4 | Edge cost calculator: base + terrain + location + speed modifiers |
| 4 | `engine/pathfinding.ts` | 6 | Dijkstra shortest-path on movement graph |
| 5 | `engine/movementCandidates.ts` | 6 | Generate & score movement candidates (motivationPull × distanceDecay) |
| 6 | `engine/movementExecution.ts` | 6 | Tick-based movement: accumulate, transition, update located_at |
| 7 | `engine/phaseMovement.ts` | 3 | Tick loop integration + remove old random migration |
| 8 | Integration test | 3 | End-to-end: evaluate → pick → move → arrive |
| 9 | Verification | — | Full suite, type check, build, cleanup |

**Total: 9 tasks, ~41 tests, 6 new modules, 2 modified modules.**
