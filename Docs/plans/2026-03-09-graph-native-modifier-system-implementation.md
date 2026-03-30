# Graph-Native Modifier System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a general-purpose attribute modifier system where any graph edge can contribute numeric modifiers to any node property, with LOS range as the first consumer.

**Architecture:** A single pure function `getModifiedValue(graph, nodeId, attribute, baseValue)` walks all edges touching a node, sums `edge.properties.modifiers[attribute]` values, and clamps to a per-attribute floor. Terrain modifiers use a special `located_at` lookup path. New trace category `modifier_resolution` provides debug visibility.

**Tech Stack:** TypeScript, Vitest, React (DebugPanel renderer only)

**Design doc:** `Docs/plans/2026-03-09-graph-native-modifier-system-design.md`

---

### Task 1: Modifier Types & Constants

**Files:**
- Create: `src/types/modifiers.ts`
- Modify: `src/types/trace.ts` (add ModifierResolutionTrace to union)
- Test: `src/types/__tests__/modifiers.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/modifiers.test.ts
import { describe, it, expect } from 'vitest';
import {
  ATTRIBUTE_FLOORS,
  DEFAULT_FLOOR,
} from '../modifiers';
import type { ModifierSource, ModifierResolutionTrace } from '../modifiers';

describe('modifier types and constants', () => {
  it('exports ATTRIBUTE_FLOORS with los_range floor at 0', () => {
    expect(ATTRIBUTE_FLOORS.los_range).toBe(0);
  });

  it('exports DEFAULT_FLOOR as -Infinity', () => {
    expect(DEFAULT_FLOOR).toBe(-Infinity);
  });

  it('ModifierSource has required fields', () => {
    const source: ModifierSource = {
      edgeId: 'e.has_trait.1',
      edgeType: 'has_trait',
      sourceName: 'Eagle-Eyed',
      delta: 1,
    };
    expect(source.delta).toBe(1);
    expect(source.edgeType).toBe('has_trait');
  });

  it('ModifierResolutionTrace has required fields', () => {
    const trace: ModifierResolutionTrace = {
      id: 0,
      tick: 1,
      timestamp: Date.now(),
      category: 'modifier_resolution',
      summary: 'los_range: 0 + 1 = 1',
      nodeId: 'actor.1',
      attribute: 'los_range',
      baseValue: 0,
      modifiers: [{ edgeId: 'e.1', edgeType: 'has_trait', sourceName: 'Eagle-Eyed', delta: 1 }],
      finalValue: 1,
    };
    expect(trace.category).toBe('modifier_resolution');
    expect(trace.finalValue).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/modifiers.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/types/modifiers.ts
import type { TraceBase } from './trace';
import type { EdgeType } from './graph';

/** A single modifier contribution from one edge */
export interface ModifierSource {
  edgeId: string;
  edgeType: EdgeType | string;
  sourceName: string;
  delta: number;
}

/** Per-attribute minimum values to prevent degenerate states */
export const ATTRIBUTE_FLOORS: Record<string, number> = {
  los_range: 0,         // always see own hex
  action_cost: 1,       // minimum 1 essence
  domain_capability: 0, // can't go negative
};

/** Default floor for attributes not in ATTRIBUTE_FLOORS */
export const DEFAULT_FLOOR = -Infinity;

/** Trace: modifier resolution breakdown */
export interface ModifierResolutionTrace extends TraceBase {
  category: 'modifier_resolution';
  nodeId: string;
  attribute: string;
  baseValue: number;
  modifiers: ModifierSource[];
  finalValue: number;
}
```

Then update `src/types/trace.ts`:
- Add `import type { ModifierResolutionTrace } from './modifiers';`
- Add `| ModifierResolutionTrace` to the `TraceEntry` union (after `InterventionEffectTrace`)
- Add `'modifier_resolution'` to `TRACE_CATEGORIES` array

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/modifiers.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/types/modifiers.ts src/types/__tests__/modifiers.test.ts src/types/trace.ts
git commit -m "feat: add modifier system types, constants, and trace category"
```

---

### Task 2: Terrain Modifier Content Data

**Files:**
- Create: `src/data/terrain-modifiers.ts`
- Test: `src/data/__tests__/terrain-modifiers.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/terrain-modifiers.test.ts
import { describe, it, expect } from 'vitest';
import { TERRAIN_MODIFIERS, getTerrainModifiers } from '../terrain-modifiers';
import type { TerrainType } from '../../types';

describe('terrain-modifiers', () => {
  it('exports TERRAIN_MODIFIERS record', () => {
    expect(TERRAIN_MODIFIERS).toBeDefined();
    expect(typeof TERRAIN_MODIFIERS).toBe('object');
  });

  it('dense_forest reduces los_range by 1', () => {
    expect(TERRAIN_MODIFIERS.dense_forest?.los_range).toBe(-1);
  });

  it('mountains increase los_range by 2', () => {
    expect(TERRAIN_MODIFIERS.mountains?.los_range).toBe(2);
  });

  it('grassland has no los modifiers', () => {
    expect(TERRAIN_MODIFIERS.grassland).toBeUndefined();
  });

  it('getTerrainModifiers returns modifiers for known terrain', () => {
    const mods = getTerrainModifiers('dense_forest');
    expect(mods).toEqual({ los_range: -1 });
  });

  it('getTerrainModifiers returns empty object for unknown terrain', () => {
    const mods = getTerrainModifiers('grassland');
    expect(mods).toEqual({});
  });

  it('all terrain keys are valid TerrainType values', () => {
    const validTerrains: TerrainType[] = [
      'ocean', 'coastal_shallows', 'lake', 'river',
      'grassland', 'farmland', 'savanna', 'steppe',
      'deciduous_forest', 'dense_forest', 'taiga', 'jungle',
      'swamp', 'bog', 'hills', 'mountains', 'plateau', 'badlands',
      'forested_hills_evergreen', 'forested_hills_deciduous', 'forested_hills_jungle',
      'great_home_trees', 'broken_lands', 'desert', 'tundra', 'glacier', 'volcanic',
    ];
    for (const key of Object.keys(TERRAIN_MODIFIERS)) {
      expect(validTerrains).toContain(key);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/terrain-modifiers.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/data/terrain-modifiers.ts
/**
 * Terrain-based attribute modifiers.
 *
 * Applied when an agent is located_at a location with a matching terrain type.
 * Only terrains that actually modify attributes are listed — absence means no modifier.
 */
import type { TerrainType } from '../types';

/** Terrain → attribute → delta. Only non-zero entries present. */
export const TERRAIN_MODIFIERS: Partial<Record<TerrainType, Record<string, number>>> = {
  // Dense vegetation blocks line of sight
  dense_forest:               { los_range: -1 },
  jungle:                     { los_range: -1 },
  great_home_trees:           { los_range: -1 },
  forested_hills_jungle:      { los_range: -1 },

  // Elevation grants vision
  mountains:                  { los_range: 2 },
  hills:                      { los_range: 1 },
  plateau:                    { los_range: 1 },
  forested_hills_evergreen:   { los_range: 0 }, // elevation + forest cancel out
  forested_hills_deciduous:   { los_range: 0 }, // elevation + forest cancel out

  // Fog/mist blocks vision
  swamp:                      { los_range: -1 },
  bog:                        { los_range: -1 },

  // Extreme conditions
  glacier:                    { los_range: 1 },  // flat + reflective
  volcanic:                   { los_range: -1 }, // smoke/haze
};

/** Get modifiers for a terrain type. Returns empty object if none. */
export function getTerrainModifiers(terrain: TerrainType): Record<string, number> {
  return TERRAIN_MODIFIERS[terrain] ?? {};
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/terrain-modifiers.test.ts`
Expected: PASS (7 tests)

**Step 5: Commit**

```bash
git add src/data/terrain-modifiers.ts src/data/__tests__/terrain-modifiers.test.ts
git commit -m "feat: add terrain modifier content data for LOS"
```

---

### Task 3: Core Modifier Engine

**Files:**
- Create: `src/engine/modifiers.ts`
- Test: `src/engine/__tests__/modifiers.test.ts`

This is the heart of the system: `collectModifiers` and `getModifiedValue`.

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/modifiers.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { collectModifiers, getModifiedValue, getFloor } from '../modifiers';
import { WorldGraph } from '../graph';
import { ATTRIBUTE_FLOORS, DEFAULT_FLOOR } from '../../types/modifiers';

function buildTestGraph(): { graph: WorldGraph; agentId: string } {
  const graph = new WorldGraph();
  const agentId = 'actor.agent1';
  graph.addNode({ id: agentId, type: 'actor', name: 'Scout', properties: { actorType: 'individual' } });
  return { graph, agentId };
}

describe('getFloor', () => {
  it('returns defined floor for known attributes', () => {
    expect(getFloor('los_range')).toBe(0);
  });

  it('returns DEFAULT_FLOOR for unknown attributes', () => {
    expect(getFloor('some_custom_attribute')).toBe(DEFAULT_FLOOR);
  });
});

describe('collectModifiers', () => {
  it('returns empty array when no edges have modifiers', () => {
    const { graph, agentId } = buildTestGraph();
    const result = collectModifiers(graph, agentId, 'los_range');
    expect(result).toEqual([]);
  });

  it('collects modifiers from has_trait edges', () => {
    const { graph, agentId } = buildTestGraph();
    // Add trait definition node
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    // Add has_trait edge with modifiers
    graph.addEdge({
      id: 'e.trait.eagle',
      source: agentId,
      target: 'trait.eagle',
      type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });

    const result = collectModifiers(graph, agentId, 'los_range');
    expect(result).toHaveLength(1);
    expect(result[0].delta).toBe(1);
    expect(result[0].sourceName).toBe('Eagle-Eyed');
    expect(result[0].edgeType).toBe('has_trait');
  });

  it('collects modifiers from multiple edges', () => {
    const { graph, agentId } = buildTestGraph();
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addNode({ id: 'trait.blind', type: 'trait', name: 'Night Blind', properties: {} });
    graph.addEdge({
      id: 'e.trait.eagle', source: agentId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });
    graph.addEdge({
      id: 'e.trait.blind', source: agentId, target: 'trait.blind', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: -1 } },
    });

    const result = collectModifiers(graph, agentId, 'los_range');
    expect(result).toHaveLength(2);
  });

  it('ignores edges without modifiers property', () => {
    const { graph, agentId } = buildTestGraph();
    graph.addNode({ id: 'trait.brave', type: 'trait', name: 'Brave', properties: {} });
    graph.addEdge({
      id: 'e.trait.brave', source: agentId, target: 'trait.brave', type: 'has_trait',
      properties: { level: 1 }, // no modifiers
    });

    const result = collectModifiers(graph, agentId, 'los_range');
    expect(result).toEqual([]);
  });

  it('ignores modifiers for different attributes', () => {
    const { graph, agentId } = buildTestGraph();
    graph.addNode({ id: 'trait.strong', type: 'trait', name: 'Strong', properties: {} });
    graph.addEdge({
      id: 'e.trait.strong', source: agentId, target: 'trait.strong', type: 'has_trait',
      properties: { level: 1, modifiers: { domain_capability: 2 } }, // not los_range
    });

    const result = collectModifiers(graph, agentId, 'los_range');
    expect(result).toEqual([]);
  });

  it('collects terrain modifiers via located_at lookup', () => {
    const { graph, agentId } = buildTestGraph();
    const locId = 'loc.forest';
    graph.addNode({ id: locId, type: 'location', name: 'Dark Forest', properties: { terrain: 'dense_forest', hexCol: 5, hexRow: 5 } });
    graph.addEdge({
      id: 'e.loc', source: agentId, target: locId, type: 'located_at', properties: {},
    });

    const result = collectModifiers(graph, agentId, 'los_range');
    expect(result).toHaveLength(1);
    expect(result[0].delta).toBe(-1);
    expect(result[0].sourceName).toContain('dense_forest');
    expect(result[0].edgeType).toBe('located_at');
  });

  it('collects modifiers from incoming edges too', () => {
    const { graph, agentId } = buildTestGraph();
    // A blessing edge where the source is a god, target is the agent
    graph.addNode({ id: 'god.1', type: 'actor', name: 'Sun God', properties: { actorType: 'god' } });
    graph.addEdge({
      id: 'e.bless', source: 'god.1', target: agentId, type: 'blessed',
      properties: { modifiers: { los_range: 2 } },
    });

    const result = collectModifiers(graph, agentId, 'los_range');
    expect(result).toHaveLength(1);
    expect(result[0].delta).toBe(2);
    expect(result[0].sourceName).toBe('Sun God');
  });
});

describe('getModifiedValue', () => {
  it('returns base value when no modifiers exist', () => {
    const { graph, agentId } = buildTestGraph();
    const result = getModifiedValue(graph, agentId, 'los_range', 0);
    expect(result).toBe(0);
  });

  it('adds modifier to base value', () => {
    const { graph, agentId } = buildTestGraph();
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({
      id: 'e.trait.eagle', source: agentId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });

    expect(getModifiedValue(graph, agentId, 'los_range', 0)).toBe(1);
  });

  it('sums multiple modifiers', () => {
    const { graph, agentId } = buildTestGraph();
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addNode({ id: 'trait.farsight', type: 'trait', name: 'Far Sight', properties: {} });
    graph.addEdge({
      id: 'e.t1', source: agentId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });
    graph.addEdge({
      id: 'e.t2', source: agentId, target: 'trait.farsight', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 2 } },
    });

    expect(getModifiedValue(graph, agentId, 'los_range', 0)).toBe(3);
  });

  it('clamps to attribute floor', () => {
    const { graph, agentId } = buildTestGraph();
    graph.addNode({ id: 'trait.blind', type: 'trait', name: 'Totally Blind', properties: {} });
    graph.addEdge({
      id: 'e.t1', source: agentId, target: 'trait.blind', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: -5 } },
    });

    // los_range floor is 0
    expect(getModifiedValue(graph, agentId, 'los_range', 1)).toBe(0);
  });

  it('works with terrain modifiers', () => {
    const { graph, agentId } = buildTestGraph();
    graph.addNode({ id: 'loc.mountain', type: 'location', name: 'Peak', properties: { terrain: 'mountains', hexCol: 1, hexRow: 1 } });
    graph.addEdge({
      id: 'e.loc', source: agentId, target: 'loc.mountain', type: 'located_at', properties: {},
    });

    // mountains give +2 los_range
    expect(getModifiedValue(graph, agentId, 'los_range', 0)).toBe(2);
  });

  it('combines trait and terrain modifiers', () => {
    const { graph, agentId } = buildTestGraph();
    // Eagle-Eyed trait (+1)
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({
      id: 'e.trait', source: agentId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });
    // Dense forest terrain (-1)
    graph.addNode({ id: 'loc.forest', type: 'location', name: 'Dark Forest', properties: { terrain: 'dense_forest', hexCol: 1, hexRow: 1 } });
    graph.addEdge({
      id: 'e.loc', source: agentId, target: 'loc.forest', type: 'located_at', properties: {},
    });

    // 0 (base) + 1 (eagle) + (-1) (forest) = 0
    expect(getModifiedValue(graph, agentId, 'los_range', 0)).toBe(0);
  });

  it('returns base when node does not exist', () => {
    const graph = new WorldGraph();
    expect(getModifiedValue(graph, 'nonexistent', 'los_range', 5)).toBe(5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/modifiers.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/engine/modifiers.ts
/**
 * Graph-Native Modifier Engine.
 *
 * Collects numeric modifiers from all edges touching a node and sums them.
 * Any edge can carry `modifiers?: Record<string, number>` in its properties.
 * Special handling for `located_at` edges: looks up terrain modifiers from
 * the target location's terrain type.
 */

import type { WorldGraph } from './graph';
import type { ModifierSource } from '../types/modifiers';
import { ATTRIBUTE_FLOORS, DEFAULT_FLOOR } from '../types/modifiers';
import { getTerrainModifiers } from '../data/terrain-modifiers';
import type { TerrainType } from '../types';
import { emitTrace } from './traceBuffer';

/** Get the floor value for an attribute. */
export function getFloor(attribute: string): number {
  return ATTRIBUTE_FLOORS[attribute] ?? DEFAULT_FLOOR;
}

/**
 * Collect all modifier sources for a given attribute on a node.
 * Walks outgoing + incoming edges, reads `modifiers[attribute]` from edge properties.
 * For `located_at` edges, also checks terrain modifiers on the target location.
 */
export function collectModifiers(
  graph: WorldGraph,
  nodeId: string,
  attribute: string,
): ModifierSource[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const sources: ModifierSource[] = [];

  // Collect from outgoing edges
  const outgoing = graph.getOutgoingEdges(nodeId);
  for (const edge of outgoing) {
    // Check edge.properties.modifiers
    const mods = edge.properties.modifiers as Record<string, number> | undefined;
    if (mods && typeof mods[attribute] === 'number') {
      const targetNode = graph.getNode(edge.target);
      sources.push({
        edgeId: edge.id,
        edgeType: edge.type,
        sourceName: targetNode?.name ?? edge.target,
        delta: mods[attribute],
      });
    }

    // Special case: located_at → look up terrain modifiers
    if (edge.type === 'located_at') {
      const loc = graph.getNode(edge.target);
      if (loc && loc.type === 'location') {
        const terrain = loc.properties.terrain as TerrainType | undefined;
        if (terrain) {
          const terrainMods = getTerrainModifiers(terrain);
          if (typeof terrainMods[attribute] === 'number') {
            sources.push({
              edgeId: edge.id,
              edgeType: 'located_at',
              sourceName: `terrain:${terrain}`,
              delta: terrainMods[attribute],
            });
          }
        }
      }
    }
  }

  // Collect from incoming edges
  const incoming = graph.getIncomingEdges(nodeId);
  for (const edge of incoming) {
    const mods = edge.properties.modifiers as Record<string, number> | undefined;
    if (mods && typeof mods[attribute] === 'number') {
      const sourceNode = graph.getNode(edge.source);
      sources.push({
        edgeId: edge.id,
        edgeType: edge.type,
        sourceName: sourceNode?.name ?? edge.source,
        delta: mods[attribute],
      });
    }
  }

  return sources;
}

/**
 * Get the final modified value for an attribute on a node.
 * base + sum(modifiers) clamped to floor.
 */
export function getModifiedValue(
  graph: WorldGraph,
  nodeId: string,
  attribute: string,
  baseValue: number,
  tick?: number,
): number {
  const modifiers = collectModifiers(graph, nodeId, attribute);

  if (modifiers.length === 0) return baseValue;

  const totalDelta = modifiers.reduce((sum, m) => sum + m.delta, 0);
  const floor = getFloor(attribute);
  const finalValue = Math.max(floor, baseValue + totalDelta);

  // Emit trace if tracing enabled
  if (tick !== undefined) {
    emitTrace({
      tick,
      category: 'modifier_resolution',
      agentId: nodeId,
      summary: `${attribute}: ${baseValue} ${totalDelta >= 0 ? '+' : ''}${totalDelta} = ${finalValue}`,
      nodeId,
      attribute,
      baseValue,
      modifiers,
      finalValue,
    });
  }

  return finalValue;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/modifiers.test.ts`
Expected: PASS (14 tests)

**Step 5: Commit**

```bash
git add src/engine/modifiers.ts src/engine/__tests__/modifiers.test.ts
git commit -m "feat: core modifier engine — collectModifiers + getModifiedValue"
```

---

### Task 4: Integrate Modifiers into Visibility System

**Files:**
- Modify: `src/engine/visibility.ts` (use `getModifiedValue` instead of static constants)
- Test: `src/engine/__tests__/visibility-modifiers.test.ts` (new integration test)

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/visibility-modifiers.test.ts
import { describe, it, expect } from 'vitest';
import { collectLOSSources } from '../visibility';
import { WorldGraph } from '../graph';
import { AVATAR_SIGHT_RANGE, AGENT_SIGHT_RANGE } from '../../types/visibility';

function buildModifierTestGraph(avatarCol: number, avatarRow: number): {
  graph: WorldGraph;
  ascendantId: string;
  avatarId: string;
} {
  const graph = new WorldGraph();
  const ascendantId = 'asc.1';
  const avatarId = 'avatar.1';
  const locId = 'loc.start';

  graph.addNode({ id: ascendantId, type: 'actor', name: 'TestGod', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: avatarId, type: 'actor', name: 'TestAvatar', properties: { actorType: 'individual' } });
  graph.addNode({
    id: locId, type: 'location', name: 'Start',
    properties: { hexCol: avatarCol, hexRow: avatarRow, locationType: 'settlement', terrain: 'grassland' },
  });
  graph.addEdge({ id: 'e.avatar_of', source: avatarId, target: ascendantId, type: 'avatar_of', properties: {} });
  graph.addEdge({ id: 'e.located_at', source: avatarId, target: locId, type: 'located_at', properties: {} });

  return { graph, ascendantId, avatarId };
}

describe('visibility with modifiers', () => {
  it('avatar LOS uses base AVATAR_SIGHT_RANGE when no modifiers', () => {
    const { graph, ascendantId } = buildModifierTestGraph(5, 7);
    const sources = collectLOSSources(graph, ascendantId, []);
    expect(sources[0].range).toBe(AVATAR_SIGHT_RANGE);
  });

  it('trait modifier increases avatar LOS range', () => {
    const { graph, ascendantId, avatarId } = buildModifierTestGraph(5, 7);
    // Give avatar Eagle-Eyed trait
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({
      id: 'e.trait.eagle', source: avatarId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 2 } },
    });

    const sources = collectLOSSources(graph, ascendantId, []);
    expect(sources[0].range).toBe(AVATAR_SIGHT_RANGE + 2);
  });

  it('terrain modifier affects avatar LOS range', () => {
    const { graph, ascendantId } = buildModifierTestGraph(5, 7);
    // Change location terrain to dense_forest (-1 LOS)
    graph.updateNode('loc.start', { properties: { terrain: 'dense_forest' } });

    const sources = collectLOSSources(graph, ascendantId, []);
    // AVATAR_SIGHT_RANGE (0) + (-1) = -1, floored at 0
    expect(sources[0].range).toBe(0);
  });

  it('terrain + trait modifiers combine for avatar', () => {
    const { graph, ascendantId, avatarId } = buildModifierTestGraph(5, 7);
    // Mountains terrain (+2)
    graph.updateNode('loc.start', { properties: { terrain: 'mountains' } });
    // Eagle-Eyed trait (+1)
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({
      id: 'e.trait.eagle', source: avatarId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });

    const sources = collectLOSSources(graph, ascendantId, []);
    // 0 (base) + 2 (mountains) + 1 (eagle) = 3
    expect(sources[0].range).toBe(3);
  });

  it('retinue agent LOS uses modifier system', () => {
    const { graph, ascendantId } = buildModifierTestGraph(5, 7);
    // Add a retinue agent with a trait
    const agentId = 'agent.scout';
    const agentLocId = 'loc.outpost';
    graph.addNode({ id: agentId, type: 'actor', name: 'Scout', properties: { actorType: 'individual' } });
    graph.addNode({ id: agentLocId, type: 'location', name: 'Outpost', properties: { hexCol: 10, hexRow: 3, terrain: 'hills' } });
    graph.addEdge({ id: 'e.worship', source: agentId, target: ascendantId, type: 'worships', properties: { tier: 2, devotion: 50 } });
    graph.addEdge({ id: 'e.loc_agent', source: agentId, target: agentLocId, type: 'located_at', properties: {} });
    // Give agent Far Sight trait (+2)
    graph.addNode({ id: 'trait.farsight', type: 'trait', name: 'Far Sight', properties: {} });
    graph.addEdge({
      id: 'e.trait.farsight', source: agentId, target: 'trait.farsight', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 2 } },
    });

    const sources = collectLOSSources(graph, ascendantId, []);
    // Agent source should be: AGENT_SIGHT_RANGE (0) + 2 (farsight) + 1 (hills terrain) = 3
    const agentSource = sources.find(s => s.hexCol === 10 && s.hexRow === 3);
    expect(agentSource).toBeDefined();
    expect(agentSource!.range).toBe(AGENT_SIGHT_RANGE + 2 + 1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/visibility-modifiers.test.ts`
Expected: FAIL — avatar LOS still uses static constant, so trait test fails

**Step 3: Modify visibility.ts to use getModifiedValue**

In `src/engine/visibility.ts`, add import at top:

```typescript
import { getModifiedValue } from './modifiers';
```

Then modify `collectLOSSources` in three places:

1. **Avatar source** (~line 99-104): Change from:
```typescript
sources.push({
  hexCol: avatarPos.col,
  hexRow: avatarPos.row,
  range: AVATAR_SIGHT_RANGE,
});
```
To:
```typescript
const avatarLOS = getModifiedValue(graph, avatarId, 'los_range', AVATAR_SIGHT_RANGE);
sources.push({
  hexCol: avatarPos.col,
  hexRow: avatarPos.row,
  range: avatarLOS,
});
```

Where `avatarId` is the avatar node ID already available (the `avatarEdges[0].source` from line 98 area — you'll need to extract it to a variable available at push time). Specifically, refactor to capture the avatarId:

After line 36 (`const avatarId = avatarEdges[0].source;`), pass it through. Actually, looking at the code more carefully:

- `getAvatarHexPosition` already finds the avatarId but doesn't return it
- We need to either: (a) make collectLOSSources find the avatarId itself, or (b) create a helper

The simplest change: in `collectLOSSources`, find the avatar ID the same way `getAvatarHexPosition` does, then use it for `getModifiedValue`. Here's the refactored avatar block:

```typescript
// Avatar
const avatarPos = getAvatarHexPosition(graph, ascendantId);
if (avatarPos) {
  // Find avatar node ID for modifier lookup
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  const avatarId = avatarEdges.length > 0 ? avatarEdges[0].source : null;
  const avatarLOS = avatarId
    ? getModifiedValue(graph, avatarId, 'los_range', AVATAR_SIGHT_RANGE)
    : AVATAR_SIGHT_RANGE;
  sources.push({
    hexCol: avatarPos.col,
    hexRow: avatarPos.row,
    range: avatarLOS,
  });
}
```

2. **Retinue agent source** (~line 148-154): Change from:
```typescript
sources.push({
  hexCol: agentHex.col,
  hexRow: agentHex.row,
  range: AGENT_SIGHT_RANGE,
});
```
To:
```typescript
const agentLOS = getModifiedValue(graph, agentId, 'los_range', AGENT_SIGHT_RANGE);
sources.push({
  hexCol: agentHex.col,
  hexRow: agentHex.row,
  range: agentLOS,
});
```

3. **Scry targets** (~line 158-163): Scry targets are hex coordinates, not agent nodes, so they stay as `SCRY_SIGHT_RANGE` (no node to look up modifiers on). No change needed here.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/visibility-modifiers.test.ts`
Expected: PASS (5 tests)

Also verify existing visibility tests still pass:

Run: `npx vitest run src/engine/__tests__/visibility.test.ts`
Expected: PASS (all existing tests unchanged — they use no modifiers so getModifiedValue returns base)

**Step 5: Commit**

```bash
git add src/engine/visibility.ts src/engine/__tests__/visibility-modifiers.test.ts
git commit -m "feat: integrate modifier system into visibility LOS calculation"
```

---

### Task 5: Debug Panel Trace Renderer

**Files:**
- Modify: `src/components/Game/DebugPanel.tsx` (add ModifierResolutionDetail + switch case)
- Test: `src/components/Game/__tests__/DebugPanel-modifiers.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/Game/__tests__/DebugPanel-modifiers.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { ModifierResolutionTrace } from '../../../types/modifiers';

// We test the trace renderer indirectly by checking it renders modifier data
// Import the DebugPanel and check it renders modifier traces
describe('DebugPanel modifier trace rendering', () => {
  it('ModifierResolutionTrace has correct category literal', () => {
    const trace: ModifierResolutionTrace = {
      id: 1,
      tick: 5,
      timestamp: Date.now(),
      category: 'modifier_resolution',
      agentId: 'actor.1',
      summary: 'los_range: 0 + 2 = 2',
      nodeId: 'actor.1',
      attribute: 'los_range',
      baseValue: 0,
      modifiers: [
        { edgeId: 'e.1', edgeType: 'has_trait', sourceName: 'Eagle-Eyed', delta: 1 },
        { edgeId: 'e.2', edgeType: 'located_at', sourceName: 'terrain:mountains', delta: 1 },
      ],
      finalValue: 2,
    };
    expect(trace.category).toBe('modifier_resolution');
    expect(trace.modifiers).toHaveLength(2);
    expect(trace.attribute).toBe('los_range');
  });
});
```

**Step 2: Run test to verify it passes** (this is a type/shape test — it should already pass with Task 1 types)

Run: `npx vitest run src/components/Game/__tests__/DebugPanel-modifiers.test.tsx`
Expected: PASS

**Step 3: Add renderer to DebugPanel.tsx**

In `src/components/Game/DebugPanel.tsx`:

1. Add import at top:
```typescript
import type { ModifierResolutionTrace } from '../../types/modifiers';
```

2. Add case to `TraceDetailRenderer` switch (before `default:`):
```typescript
case 'modifier_resolution':
  return <ModifierResolutionDetail trace={trace as ModifierResolutionTrace} />;
```

3. Add renderer component (place it near the other detail renderers):
```typescript
const ModifierResolutionDetail = React.memo(function ModifierResolutionDetail({ trace }: { trace: ModifierResolutionTrace }) {
  return (
    <div style={DETAIL_AREA_STYLE}>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Attribute</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.attribute}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Base</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.baseValue}</div>
      </div>
      {trace.modifiers.map((mod, idx) => (
        <div key={idx} style={DETAIL_ROW_STYLE}>
          <div style={DETAIL_LABEL_STYLE}>{mod.sourceName}</div>
          <div style={DETAIL_VALUE_STYLE}>
            {mod.delta >= 0 ? '+' : ''}{mod.delta} ({mod.edgeType})
          </div>
        </div>
      ))}
      <div style={{ ...DETAIL_ROW_STYLE, borderTop: '1px solid #555', paddingTop: '4px', marginTop: '4px' }}>
        <div style={DETAIL_LABEL_STYLE}>Final</div>
        <div style={{ ...DETAIL_VALUE_STYLE, fontWeight: 'bold' }}>{trace.finalValue}</div>
      </div>
    </div>
  );
});
```

**Step 4: Run type check to verify**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Game/DebugPanel.tsx src/components/Game/__tests__/DebugPanel-modifiers.test.tsx
git commit -m "feat: add modifier resolution trace renderer to debug panel"
```

---

### Task 6: LOS-Modifying Trait Content Data

**Files:**
- Create: `src/data/trait-modifiers.ts`
- Test: `src/data/__tests__/trait-modifiers.test.ts`

These are the initial trait definitions that carry `modifiers` on their `has_trait` edge templates, proving the system works end-to-end.

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/trait-modifiers.test.ts
import { describe, it, expect } from 'vitest';
import { LOS_TRAIT_DEFINITIONS, getLOSTraitModifiers } from '../trait-modifiers';

describe('LOS trait definitions', () => {
  it('exports at least 3 LOS-modifying trait definitions', () => {
    expect(LOS_TRAIT_DEFINITIONS.length).toBeGreaterThanOrEqual(3);
  });

  it('each definition has required fields', () => {
    for (const def of LOS_TRAIT_DEFINITIONS) {
      expect(def.traitId).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(typeof def.modifiers.los_range).toBe('number');
      expect(def.description).toBeTruthy();
    }
  });

  it('Eagle-Eyed grants +1 los_range', () => {
    const eagle = LOS_TRAIT_DEFINITIONS.find(d => d.traitId === 'trait.innate.eagle-eyed');
    expect(eagle).toBeDefined();
    expect(eagle!.modifiers.los_range).toBe(1);
  });

  it('Night Blind gives -1 los_range', () => {
    const blind = LOS_TRAIT_DEFINITIONS.find(d => d.traitId === 'trait.scar.night-blind');
    expect(blind).toBeDefined();
    expect(blind!.modifiers.los_range).toBe(-1);
  });

  it('Far Sight grants +2 los_range', () => {
    const far = LOS_TRAIT_DEFINITIONS.find(d => d.traitId === 'trait.mastery.far-sight');
    expect(far).toBeDefined();
    expect(far!.modifiers.los_range).toBe(2);
  });

  it('getLOSTraitModifiers returns modifiers for known trait', () => {
    const mods = getLOSTraitModifiers('trait.innate.eagle-eyed');
    expect(mods).toEqual({ los_range: 1 });
  });

  it('getLOSTraitModifiers returns empty for unknown trait', () => {
    const mods = getLOSTraitModifiers('trait.nonexistent');
    expect(mods).toEqual({});
  });

  it('trait IDs follow naming convention', () => {
    for (const def of LOS_TRAIT_DEFINITIONS) {
      expect(def.traitId).toMatch(/^trait\.\w+\.\w[\w-]*$/);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/trait-modifiers.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/data/trait-modifiers.ts
/**
 * Trait definitions that carry attribute modifiers.
 *
 * These define which traits grant modifiers when assigned via has_trait edges.
 * The modifiers record is copied to the has_trait edge properties at assignment time.
 */

import type { TraitCategory } from '../types/traits';

export interface TraitModifierDefinition {
  traitId: string;
  name: string;
  category: TraitCategory;
  description: string;
  modifiers: Record<string, number>;
}

export const LOS_TRAIT_DEFINITIONS: TraitModifierDefinition[] = [
  {
    traitId: 'trait.innate.eagle-eyed',
    name: 'Eagle-Eyed',
    category: 'innate',
    description: 'Born with exceptional visual acuity. Sees further than most.',
    modifiers: { los_range: 1 },
  },
  {
    traitId: 'trait.scar.night-blind',
    name: 'Night Blind',
    category: 'scar',
    description: 'A wound or curse has dimmed their sight. Struggles to see beyond arm\'s reach.',
    modifiers: { los_range: -1 },
  },
  {
    traitId: 'trait.mastery.far-sight',
    name: 'Far Sight',
    category: 'mastery',
    description: 'Years of training or magical attunement grant vision across great distances.',
    modifiers: { los_range: 2 },
  },
  {
    traitId: 'trait.condition.fog-touched',
    name: 'Fog-Touched',
    category: 'condition',
    description: 'A lingering miasma clings to them, clouding their perception.',
    modifiers: { los_range: -1 },
  },
  {
    traitId: 'trait.innate.mountain-born',
    name: 'Mountain-Born',
    category: 'innate',
    description: 'Raised among peaks, accustomed to reading distant horizons.',
    modifiers: { los_range: 1 },
  },
];

/** Lookup modifiers for a trait by ID. Returns empty record if not found. */
export function getLOSTraitModifiers(traitId: string): Record<string, number> {
  const def = LOS_TRAIT_DEFINITIONS.find(d => d.traitId === traitId);
  return def?.modifiers ?? {};
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/trait-modifiers.test.ts`
Expected: PASS (8 tests)

**Step 5: Commit**

```bash
git add src/data/trait-modifiers.ts src/data/__tests__/trait-modifiers.test.ts
git commit -m "feat: add LOS-modifying trait definitions content data"
```

---

### Task 7: Full Integration Test

**Files:**
- Create: `src/engine/__tests__/modifier-system-integration.test.ts`

This test proves the entire pipeline: trait assignment → modifier collection → visibility LOS → hex state.

**Step 1: Write the integration test**

```typescript
// src/engine/__tests__/modifier-system-integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { collectLOSSources, recalcVisibility } from '../visibility';
import { getModifiedValue, collectModifiers } from '../modifiers';
import { visKey, AVATAR_SIGHT_RANGE } from '../../types/visibility';
import type { VisibilityMap } from '../../types/visibility';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';

function buildFullTestGraph(): {
  graph: WorldGraph;
  ascendantId: string;
  avatarId: string;
} {
  const graph = new WorldGraph();
  const ascendantId = 'asc.1';
  const avatarId = 'avatar.1';
  const locId = 'loc.start';

  graph.addNode({ id: ascendantId, type: 'actor', name: 'TestGod', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: avatarId, type: 'actor', name: 'TestAvatar', properties: { actorType: 'individual' } });
  graph.addNode({
    id: locId, type: 'location', name: 'Mountain Peak',
    properties: { hexCol: 5, hexRow: 5, locationType: 'settlement', terrain: 'mountains' },
  });
  graph.addEdge({ id: 'e.avatar_of', source: avatarId, target: ascendantId, type: 'avatar_of', properties: {} });
  graph.addEdge({ id: 'e.located_at', source: avatarId, target: locId, type: 'located_at', properties: {} });

  return { graph, ascendantId, avatarId };
}

describe('modifier system integration', () => {
  it('full pipeline: trait + terrain → LOS → visibility', () => {
    const { graph, ascendantId, avatarId } = buildFullTestGraph();

    // Give avatar Eagle-Eyed (+1 LOS)
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({
      id: 'e.trait.eagle', source: avatarId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });

    // Avatar at mountains (+2 terrain) with Eagle-Eyed (+1 trait)
    // Total LOS = 0 (base) + 2 (mountains) + 1 (eagle) = 3
    const sources = collectLOSSources(graph, ascendantId, []);
    expect(sources[0].range).toBe(3);

    // Run visibility on 11x11 grid
    const prev: VisibilityMap = new Map();
    const next = recalcVisibility(prev, sources, graph, 1, 11, 11);

    // Avatar at (5,5) with range 3 should see hexes within distance 3
    expect(next.get(visKey(5, 5))?.state).toBe('visible');
    expect(next.get(visKey(5, 4))?.state).toBe('visible'); // 1 away
    expect(next.get(visKey(5, 2))?.state).toBe('visible'); // 3 away
    // Hex 4 away should be unexplored
    expect(next.get(visKey(5, 1))?.state).toBe('unexplored');
  });

  it('negative modifier floors at 0 LOS', () => {
    const { graph, ascendantId, avatarId } = buildFullTestGraph();

    // Override to dense_forest terrain (-1)
    graph.updateNode('loc.start', { properties: { terrain: 'dense_forest' } });

    // Give Night Blind scar (-1)
    graph.addNode({ id: 'trait.blind', type: 'trait', name: 'Night Blind', properties: {} });
    graph.addEdge({
      id: 'e.trait.blind', source: avatarId, target: 'trait.blind', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: -1 } },
    });

    // 0 (base) + (-1 forest) + (-1 blind) = -2, floored at 0
    const val = getModifiedValue(graph, avatarId, 'los_range', AVATAR_SIGHT_RANGE);
    expect(val).toBe(0);

    const sources = collectLOSSources(graph, ascendantId, []);
    expect(sources[0].range).toBe(0);
  });

  it('modifier traces are emitted when enabled', () => {
    enableTracing();
    clearTraces();

    const { graph, avatarId } = buildFullTestGraph();
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({
      id: 'e.trait.eagle', source: avatarId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });

    getModifiedValue(graph, avatarId, 'los_range', 0, 1);

    const traces = getTraces();
    const modTraces = traces.filter(t => t.category === 'modifier_resolution');
    expect(modTraces.length).toBeGreaterThanOrEqual(1);

    disableTracing();
    clearTraces();
  });

  it('works with multiple modifier sources simultaneously', () => {
    const { graph, ascendantId, avatarId } = buildFullTestGraph();

    // Mountains terrain (+2) — already set in buildFullTestGraph
    // Eagle-Eyed trait (+1)
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({
      id: 'e.trait.eagle', source: avatarId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });
    // Blessing from god (+2)
    graph.addNode({ id: 'god.sun', type: 'actor', name: 'Sun God', properties: { actorType: 'god' } });
    graph.addEdge({
      id: 'e.bless', source: 'god.sun', target: avatarId, type: 'blessed',
      properties: { modifiers: { los_range: 2 } },
    });

    // Total: 0 (base) + 2 (mountains) + 1 (eagle) + 2 (blessing) = 5
    const modifiers = collectModifiers(graph, avatarId, 'los_range');
    expect(modifiers).toHaveLength(3);
    expect(getModifiedValue(graph, avatarId, 'los_range', 0)).toBe(5);
  });
});
```

**Step 2: Run integration test**

Run: `npx vitest run src/engine/__tests__/modifier-system-integration.test.ts`
Expected: PASS (4 tests)

**Step 3: Run full test suite to verify no regressions**

Run: `npx vitest run`
Expected: All existing tests pass. Specifically verify:
- `src/engine/__tests__/visibility.test.ts` — all pass (no modifiers = base values)
- `src/types/__tests__/visibility.test.ts` — all pass (constants unchanged)

**Step 4: Commit**

```bash
git add src/engine/__tests__/modifier-system-integration.test.ts
git commit -m "test: full modifier system integration tests"
```

---

### Task 8: Documentation & Backlog Updates

**Files:**
- Modify: `CLAUDE.md` (project status + changelog)
- Update: Obsidian vault (new system note, update Index.md)
- Update: Notion backlog (mark complete, add item/spell system task)

**Step 1: Use gamedocumenter skill**

Invoke the `gamedocumenter` skill to update all three documentation layers:

1. **CLAUDE.md** — Add to changelog + project status:
   - Graph-Native Modifier System: complete
   - New files: types/modifiers.ts, engine/modifiers.ts, data/terrain-modifiers.ts, data/trait-modifiers.ts
   - Tests: ~40 new tests across 6 test files
   - LOS now dynamic per-agent (traits + terrain + blessings)

2. **Obsidian** — Create `Systems/Graph-Native Modifier System.md`:
   - Core concept: `getModifiedValue` pure function
   - Edge modifier sources (has_trait, located_at/terrain, blessed, etc.)
   - ATTRIBUTE_FLOORS + floor system
   - Trace category: modifier_resolution
   - Links to: [[Trait System]], [[Fog of War]], [[Debug Trace Panel]]

3. **Notion backlog** — Mark modifier system complete, add new task:
   - "Item & Spell System" — `possesses` and `affected_by` edge types, inventory model, spell effects, modifier integration
   - Priority: next after modifier system

**Step 2: Commit documentation**

```bash
git add CLAUDE.md
git commit -m "docs: graph-native modifier system complete"
```

---

## Summary

| Task | Files | Tests | Description |
|------|-------|-------|-------------|
| 1 | types/modifiers.ts, types/trace.ts | 4 | Types, constants, trace category |
| 2 | data/terrain-modifiers.ts | 7 | Terrain LOS modifier content |
| 3 | engine/modifiers.ts | 14 | Core engine: collectModifiers + getModifiedValue |
| 4 | engine/visibility.ts | 5 | Integrate modifiers into LOS calculation |
| 5 | components/Game/DebugPanel.tsx | 1 | Trace renderer for modifier resolution |
| 6 | data/trait-modifiers.ts | 8 | LOS-modifying trait content definitions |
| 7 | integration test | 4 | End-to-end: trait+terrain → LOS → visibility |
| 8 | docs | 0 | CLAUDE.md, Obsidian, Notion updates |
| **Total** | **~12 files** | **~43 tests** | |
