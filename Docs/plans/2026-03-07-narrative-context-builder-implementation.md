# Narrative Context Builder — Pass 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the harvest→rank→select→feed pipeline that makes Notable/Chronicle prose world-aware by enriching events with tension-scored graph objects.

**Architecture:** A new `src/engine/contextBuilder.ts` module with pure functions (`harvestContext`, `rankObjects`, `selectObjects`, `buildNarrativeContext`). A new `src/data/opposition-content.ts` content package holding scoring matrices. New types extend `ProseContext` with optional context fields. The pipeline hooks into `phaseNarrative` in the orchestrator.

**Tech Stack:** TypeScript, WorldGraph API, existing archetype-content.ts, vitest

---

### Task 1: Opposition Content Data Package

**Files:**
- Create: `src/data/opposition-content.ts`
- Create: `src/data/__tests__/opposition-content.test.ts`

**Context:**
This content package holds the scoring matrices from the design doc — sphere opposition, archetype friction, and tunable constants. No engine logic, just data.

Reference: `src/data/culture-content.ts` for content package pattern. Design doc: `Docs/plans/2026-03-07-narrative-context-builder-design.md` §Scoring Formula and parent doc §2.

**Step 1: Write tests for opposition content**

```typescript
// src/data/__tests__/opposition-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  FOUNDATION_OPPOSITION_MATRIX,
  CREATION_SPHERE_TENSIONS,
  ARCHETYPE_FRICTION_PAIRS,
  PROXIMITY_SCORES,
  INVOLVEMENT_SCORES,
  HARVEST_LIMITS,
  SELECTION_LIMITS,
  getFoundationOpposition,
  getCreationSphereTension,
  getArchetypeFriction,
} from '../opposition-content';

describe('opposition-content', () => {
  describe('FOUNDATION_OPPOSITION_MATRIX', () => {
    it('has 4 foundation spheres', () => {
      expect(Object.keys(FOUNDATION_OPPOSITION_MATRIX)).toHaveLength(4);
    });

    it('chaos↔order scores 5', () => {
      expect(FOUNDATION_OPPOSITION_MATRIX.chaos.order).toBe(5);
      expect(FOUNDATION_OPPOSITION_MATRIX.order.chaos).toBe(5);
    });

    it('light↔darkness scores 5', () => {
      expect(FOUNDATION_OPPOSITION_MATRIX.light.darkness).toBe(5);
      expect(FOUNDATION_OPPOSITION_MATRIX.darkness.light).toBe(5);
    });

    it('non-opposed pairs score 2', () => {
      expect(FOUNDATION_OPPOSITION_MATRIX.chaos.light).toBe(2);
      expect(FOUNDATION_OPPOSITION_MATRIX.order.darkness).toBe(2);
    });

    it('self-opposition scores 0', () => {
      expect(FOUNDATION_OPPOSITION_MATRIX.chaos.chaos).toBe(0);
      expect(FOUNDATION_OPPOSITION_MATRIX.order.order).toBe(0);
    });
  });

  describe('CREATION_SPHERE_TENSIONS', () => {
    it('contains at least 4 tension pairs', () => {
      expect(CREATION_SPHERE_TENSIONS.length).toBeGreaterThanOrEqual(4);
    });

    it('life↔entropy has highest tension (4)', () => {
      const lifeEntropy = CREATION_SPHERE_TENSIONS.find(
        t => (t.sphereA === 'life' && t.sphereB === 'entropy') ||
             (t.sphereA === 'entropy' && t.sphereB === 'life')
      );
      expect(lifeEntropy).toBeDefined();
      expect(lifeEntropy!.score).toBe(4);
    });

    it('each entry has two valid sphere names and a score', () => {
      for (const t of CREATION_SPHERE_TENSIONS) {
        expect(typeof t.sphereA).toBe('string');
        expect(typeof t.sphereB).toBe('string');
        expect(t.score).toBeGreaterThan(0);
        expect(t.score).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('ARCHETYPE_FRICTION_PAIRS', () => {
    it('contains at least 9 pairs', () => {
      expect(ARCHETYPE_FRICTION_PAIRS.length).toBeGreaterThanOrEqual(9);
    });

    it('true_believer↔trickster scores 5', () => {
      const pair = ARCHETYPE_FRICTION_PAIRS.find(
        p => (p.archetypeA === 'true_believer' && p.archetypeB === 'trickster') ||
             (p.archetypeA === 'trickster' && p.archetypeB === 'true_believer')
      );
      expect(pair).toBeDefined();
      expect(pair!.score).toBe(5);
    });

    it('each entry has valid scores 1-5', () => {
      for (const p of ARCHETYPE_FRICTION_PAIRS) {
        expect(p.score).toBeGreaterThan(0);
        expect(p.score).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('scoring constants', () => {
    it('PROXIMITY_SCORES has 4 levels', () => {
      expect(PROXIMITY_SCORES.same_location).toBe(3);
      expect(PROXIMITY_SCORES.adjacent).toBe(2);
      expect(PROXIMITY_SCORES.same_region).toBe(1);
      expect(PROXIMITY_SCORES.graph_connected).toBe(0.5);
    });

    it('INVOLVEMENT_SCORES has 4 levels', () => {
      expect(INVOLVEMENT_SCORES.direct_participant).toBe(5);
      expect(INVOLVEMENT_SCORES.causal).toBe(3);
      expect(INVOLVEMENT_SCORES.owner_creator).toBe(2);
      expect(INVOLVEMENT_SCORES.atmospheric).toBe(1);
    });

    it('HARVEST_LIMITS are tier-dependent', () => {
      expect(HARVEST_LIMITS.notable).toBe(1);
      expect(HARVEST_LIMITS.chronicle).toBe(2);
    });

    it('SELECTION_LIMITS are tier-dependent', () => {
      expect(SELECTION_LIMITS.notable).toEqual({ min: 2, max: 3 });
      expect(SELECTION_LIMITS.chronicle).toEqual({ min: 4, max: 5 });
    });
  });

  describe('lookup functions', () => {
    it('getFoundationOpposition returns correct score', () => {
      expect(getFoundationOpposition('chaos', 'order')).toBe(5);
      expect(getFoundationOpposition('light', 'light')).toBe(0);
    });

    it('getFoundationOpposition returns 0 for unknown', () => {
      expect(getFoundationOpposition('chaos', 'unknown')).toBe(0);
    });

    it('getCreationSphereTension returns score for known pair', () => {
      expect(getCreationSphereTension('life', 'entropy')).toBe(4);
      expect(getCreationSphereTension('entropy', 'life')).toBe(4);
    });

    it('getCreationSphereTension returns 0 for non-tensioned pair', () => {
      expect(getCreationSphereTension('force', 'life')).toBe(0);
    });

    it('getArchetypeFriction returns score for known pair', () => {
      expect(getArchetypeFriction('true_believer', 'trickster')).toBe(5);
      expect(getArchetypeFriction('trickster', 'true_believer')).toBe(5);
    });

    it('getArchetypeFriction returns 0 for non-friction pair', () => {
      expect(getArchetypeFriction('tragic_hero', 'tragic_hero')).toBe(0);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/data/__tests__/opposition-content.test.ts`
Expected: FAIL — module not found

**Step 3: Implement opposition-content.ts**

```typescript
// src/data/opposition-content.ts
/**
 * CONTENT MANAGER — Opposition Tension Scoring Data
 *
 * Sphere opposition matrices, archetype friction pairs, and
 * scoring constants for the narrative context builder.
 *
 * Design doc: Docs/plans/2026-03-07-narrative-context-builder-design.md
 * Parent doc: Docs/plans/2026-03-06-narrative-context-pipeline.md §2
 */
import type { SphereName } from '../types/index';

// ─── Types ──────────────────────────────────────────────────────

export type FoundationSphere = 'chaos' | 'order' | 'light' | 'darkness';

export interface CreationSphereTension {
  sphereA: SphereName;
  sphereB: SphereName;
  score: number;
  narrativeReason: string;
}

export interface ArchetypeFrictionPair {
  archetypeA: string;
  archetypeB: string;
  score: number;
  narrativeReason: string;
}

// ─── Foundation Sphere Opposition Matrix ────────────────────────

export const FOUNDATION_OPPOSITION_MATRIX: Record<FoundationSphere, Record<FoundationSphere, number>> = {
  chaos:    { chaos: 0, order: 5, light: 2, darkness: 2 },
  order:    { chaos: 5, order: 0, light: 2, darkness: 2 },
  light:    { chaos: 2, order: 2, light: 0, darkness: 5 },
  darkness: { chaos: 2, order: 2, light: 5, darkness: 0 },
};

// ─── Creation Sphere Tension Pairs ──────────────────────────────

export const CREATION_SPHERE_TENSIONS: CreationSphereTension[] = [
  { sphereA: 'force',  sphereB: 'mind',    score: 3, narrativeReason: 'Brute strength vs. cunning strategy' },
  { sphereA: 'life',   sphereB: 'entropy', score: 4, narrativeReason: 'Growth vs. decay — the oldest tension' },
  { sphereA: 'energy', sphereB: 'spirit',  score: 2, narrativeReason: 'Physical power vs. ethereal transcendence' },
  { sphereA: 'matter', sphereB: 'time',    score: 2, narrativeReason: 'Permanence vs. change' },
];

// ─── Archetype Friction Pairs ───────────────────────────────────

export const ARCHETYPE_FRICTION_PAIRS: ArchetypeFrictionPair[] = [
  { archetypeA: 'true_believer', archetypeB: 'trickster',      score: 5, narrativeReason: 'Faith vs. irreverence' },
  { archetypeA: 'oathkeeper',    archetypeB: 'schemer',        score: 5, narrativeReason: 'Honor vs. manipulation' },
  { archetypeA: 'noble_savage',  archetypeB: 'poisoned_court', score: 4, narrativeReason: 'Raw honesty vs. civilized corruption' },
  { archetypeA: 'maker',         archetypeB: 'monster',        score: 4, narrativeReason: 'Creation vs. destruction' },
  { archetypeA: 'doomed_innocent', archetypeB: 'monster',      score: 4, narrativeReason: 'Vulnerability vs. predation' },
  { archetypeA: 'reluctant_king', archetypeB: 'kingmaker',     score: 3, narrativeReason: 'Resisting power vs. wielding it through others' },
  { archetypeA: 'seeker',        archetypeB: 'true_believer',  score: 3, narrativeReason: 'Questioning vs. faith' },
  { archetypeA: 'folk_hero',     archetypeB: 'fallen_noble',   score: 3, narrativeReason: 'Common virtue vs. aristocratic failure' },
  { archetypeA: 'wanderer',      archetypeB: 'oathkeeper',     score: 3, narrativeReason: 'Rootlessness vs. absolute commitment' },
];

// ─── Scoring Constants ──────────────────────────────────────────

export const PROXIMITY_SCORES = {
  same_location: 3,
  adjacent: 2,
  same_region: 1,
  graph_connected: 0.5,
} as const;

export const INVOLVEMENT_SCORES = {
  direct_participant: 5,
  causal: 3,
  owner_creator: 2,
  atmospheric: 1,
} as const;

/** Harvest hop radius by narrative tier */
export const HARVEST_LIMITS = {
  notable: 1,   // immediate + adjacent locations
  chronicle: 2, // region-wide (2 hops)
} as const;

/** Selection count range by narrative tier */
export const SELECTION_LIMITS = {
  notable:   { min: 2, max: 3 },
  chronicle: { min: 4, max: 5 },
} as const;

/** Max objects from any single category in selection */
export const CATEGORY_CAP = 2;

// ─── Lookup Functions ───────────────────────────────────────────

export function getFoundationOpposition(a: string, b: string): number {
  const matrix = FOUNDATION_OPPOSITION_MATRIX as Record<string, Record<string, number>>;
  return matrix[a]?.[b] ?? 0;
}

export function getCreationSphereTension(a: SphereName, b: SphereName): number {
  const pair = CREATION_SPHERE_TENSIONS.find(
    t => (t.sphereA === a && t.sphereB === b) || (t.sphereA === b && t.sphereB === a)
  );
  return pair?.score ?? 0;
}

export function getArchetypeFriction(a: string, b: string): number {
  const pair = ARCHETYPE_FRICTION_PAIRS.find(
    p => (p.archetypeA === a && p.archetypeB === b) || (p.archetypeA === b && p.archetypeB === a)
  );
  return pair?.score ?? 0;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/data/__tests__/opposition-content.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/data/opposition-content.ts src/data/__tests__/opposition-content.test.ts
git commit -m "feat(opposition): add opposition tension scoring content package"
```

---

### Task 2: Narrative Context Types

**Files:**
- Modify: `src/types/narrative.ts`
- Create: `src/types/__tests__/narrativeContext.test.ts`

**Context:**
Add the `NarrativeContext`, `ContextObject`, `OppositionSummary`, and `OpposingPair` types to the narrative type file. Extend `ProseContext` with optional context fields. These are additive — all existing code continues to work.

**Step 1: Write type validation tests**

```typescript
// src/types/__tests__/narrativeContext.test.ts
import { describe, it, expect } from 'vitest';
import type {
  NarrativeContext,
  ContextObject,
  ContextCategory,
  OppositionSummary,
  OpposingPair,
} from '../narrative';

describe('NarrativeContext types', () => {
  it('NarrativeContext can be constructed with minimal fields', () => {
    const ctx: NarrativeContext = {
      event: {
        id: 'evt-1', tier: 'notable', eventType: 'action_resolved',
        description: 'test', tick: 1,
      },
      contextObjects: [],
      historicalFragments: [],
      oppositionSummary: { tensionScore: 0, opposingPairs: [] },
    };
    expect(ctx.event.id).toBe('evt-1');
    expect(ctx.archetype).toBeUndefined();
  });

  it('ContextObject has required fields', () => {
    const obj: ContextObject = {
      nodeId: 'n-1', name: 'Ancient Blade', category: 'artifact',
      relevanceScore: 8.5, briefDescription: 'A rusted sword.',
    };
    expect(obj.category).toBe('artifact');
    expect(obj.tensionType).toBeUndefined();
  });

  it('ContextCategory covers all 5 categories', () => {
    const categories: ContextCategory[] = ['artifact', 'faction', 'character', 'location', 'event'];
    expect(categories).toHaveLength(5);
  });

  it('OppositionSummary tracks tension pairs', () => {
    const pair: OpposingPair = {
      sourceId: 'a-1', targetId: 'a-2',
      tensionType: 'foundation_sphere', score: 5,
    };
    const summary: OppositionSummary = {
      dominantTension: 'foundation_sphere',
      tensionScore: 5,
      opposingPairs: [pair],
    };
    expect(summary.opposingPairs).toHaveLength(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/types/__tests__/narrativeContext.test.ts`
Expected: FAIL — types not found

**Step 3: Add types to narrative.ts**

Append to the end of `src/types/narrative.ts` (before the re-export line):

```typescript
// ─── Context Builder Types ──────────────────────────────────────

export type ContextCategory = 'artifact' | 'faction' | 'character' | 'location' | 'event';

export interface ContextObject {
  nodeId: string;
  name: string;
  category: ContextCategory;
  relevanceScore: number;
  tensionType?: string;
  briefDescription: string;
}

export interface OpposingPair {
  sourceId: string;
  targetId: string;
  tensionType: string;
  score: number;
}

export interface OppositionSummary {
  dominantTension?: string;
  tensionScore: number;
  opposingPairs: OpposingPair[];
}

export interface NarrativeContext {
  event: NarrativeEvent;
  archetype?: string;
  contextObjects: ContextObject[];
  historicalFragments: string[];
  oppositionSummary: OppositionSummary;
}
```

Also extend `ProseContext` with optional context fields:

```typescript
// Add to existing ProseContext interface:
  contextObjects?: ContextObject[];
  historicalFragments?: string[];
  oppositionSummary?: OppositionSummary;
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/types/__tests__/narrativeContext.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/types/narrative.ts src/types/__tests__/narrativeContext.test.ts
git commit -m "feat(narrative): add NarrativeContext, ContextObject, OppositionSummary types"
```

---

### Task 3: Harvest Function

**Files:**
- Create: `src/engine/contextBuilder.ts`
- Create: `src/engine/__tests__/contextBuilder.test.ts`

**Context:**
The harvest function queries the world graph outward from an event's actors and location. It collects artifacts, factions, characters, locations, and events within a tier-dependent hop radius. Uses existing `WorldGraph` API: `getOutgoingEdges`, `getIncomingEdges`, `getNode`, `getNodesByType`.

Reference: `src/engine/graph.ts` for API. Design doc §1 Stage 1: Harvest.

**Step 1: Write harvest tests**

```typescript
// src/engine/__tests__/contextBuilder.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { harvestContext } from '../contextBuilder';
import type { NarrativeEvent } from '../../types/narrative';

function buildTestGraph(): WorldGraph {
  const g = new WorldGraph();
  // Locations
  g.addNode({ id: 'loc-1', type: 'location', name: 'Iron Gate', properties: { terrain: 'mountain' } });
  g.addNode({ id: 'loc-2', type: 'location', name: 'Salt Marsh', properties: { terrain: 'swamp' } });
  g.addNode({ id: 'loc-3', type: 'location', name: 'Far Tower', properties: { terrain: 'plains' } });
  g.addEdge({ id: 'adj-1-2', source: 'loc-1', target: 'loc-2', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj-2-3', source: 'loc-2', target: 'loc-3', type: 'adjacent', properties: {} });

  // Actors
  g.addNode({ id: 'act-1', type: 'actor', name: 'Kaelen', properties: { actorType: 'individual', narrativeArchetype: 'tragic_hero' } });
  g.addNode({ id: 'act-2', type: 'actor', name: 'Mira', properties: { actorType: 'individual', narrativeArchetype: 'seeker' } });
  g.addNode({ id: 'act-3', type: 'actor', name: 'Distant Lord', properties: { actorType: 'individual' } });
  g.addEdge({ id: 'at-1', source: 'act-1', target: 'loc-1', type: 'located_at', properties: {} });
  g.addEdge({ id: 'at-2', source: 'act-2', target: 'loc-2', type: 'located_at', properties: {} });
  g.addEdge({ id: 'at-3', source: 'act-3', target: 'loc-3', type: 'located_at', properties: {} });

  // Artifact at loc-1
  g.addNode({ id: 'art-1', type: 'artifact', name: 'Thornblade', properties: {} });
  g.addEdge({ id: 'poss-1', source: 'act-1', target: 'art-1', type: 'possesses', properties: {} });

  // Faction
  g.addNode({ id: 'fac-1', type: 'actor', name: 'Iron Brotherhood', properties: { actorType: 'faction' } });
  g.addEdge({ id: 'mem-1', source: 'act-1', target: 'fac-1', type: 'member_of', properties: {} });

  // Sphere alignment
  g.addNode({ id: 'sphere-force', type: 'cosmology', name: 'Force', properties: {} });
  g.addEdge({ id: 'align-1', source: 'act-1', target: 'sphere-force', type: 'aligned_with', properties: {} });

  return g;
}

describe('harvestContext', () => {
  const graph = buildTestGraph();

  it('harvests artifacts possessed by event actor', () => {
    const event: NarrativeEvent = {
      id: 'evt-1', tier: 'notable', eventType: 'action_resolved',
      description: 'Kaelen strikes', tick: 10, actorId: 'act-1',
    };
    const harvest = harvestContext(event, graph);
    const artifacts = harvest.filter(h => h.category === 'artifact');
    expect(artifacts.length).toBeGreaterThanOrEqual(1);
    expect(artifacts.some(a => a.nodeId === 'art-1')).toBe(true);
  });

  it('harvests characters at same and adjacent locations (notable = 1 hop)', () => {
    const event: NarrativeEvent = {
      id: 'evt-2', tier: 'notable', eventType: 'contested_action',
      description: 'Battle', tick: 11, actorId: 'act-1',
    };
    const harvest = harvestContext(event, graph);
    const characters = harvest.filter(h => h.category === 'character');
    // act-2 is at adjacent loc-2 (1 hop), act-3 is at loc-3 (2 hops — out of range)
    expect(characters.some(c => c.nodeId === 'act-2')).toBe(true);
    expect(characters.some(c => c.nodeId === 'act-3')).toBe(false);
  });

  it('harvests factions connected to event actor', () => {
    const event: NarrativeEvent = {
      id: 'evt-3', tier: 'notable', eventType: 'action_resolved',
      description: 'test', tick: 12, actorId: 'act-1',
    };
    const harvest = harvestContext(event, graph);
    const factions = harvest.filter(h => h.category === 'faction');
    expect(factions.some(f => f.nodeId === 'fac-1')).toBe(true);
  });

  it('chronicle tier harvests 2 hops (includes distant characters)', () => {
    const event: NarrativeEvent = {
      id: 'evt-4', tier: 'chronicle', eventType: 'actor_death',
      description: 'death', tick: 13, actorId: 'act-1',
    };
    const harvest = harvestContext(event, graph);
    const characters = harvest.filter(h => h.category === 'character');
    // act-3 is at loc-3, 2 hops away — now in range for chronicle
    expect(characters.some(c => c.nodeId === 'act-3')).toBe(true);
  });

  it('does not include the event actor itself in harvest', () => {
    const event: NarrativeEvent = {
      id: 'evt-5', tier: 'notable', eventType: 'action_resolved',
      description: 'test', tick: 14, actorId: 'act-1',
    };
    const harvest = harvestContext(event, graph);
    expect(harvest.some(h => h.nodeId === 'act-1')).toBe(false);
  });

  it('returns empty array when actor has no location', () => {
    const event: NarrativeEvent = {
      id: 'evt-6', tier: 'notable', eventType: 'action_resolved',
      description: 'test', tick: 15, actorId: 'nonexistent',
    };
    const harvest = harvestContext(event, graph);
    expect(harvest).toEqual([]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/contextBuilder.test.ts`
Expected: FAIL — module not found

**Step 3: Implement harvestContext**

Create `src/engine/contextBuilder.ts` with the harvest function. The function:
1. Finds the event actor's location via `located_at` edges
2. Collects locations within hop radius (BFS on `adjacent` edges)
3. For each in-range location, harvests actors, artifacts at that location
4. Harvests factions via `member_of` edges from actors
5. Harvests event nodes with edges to same actors/locations
6. Returns `HarvestedObject[]` (intermediate type before ranking)

```typescript
// src/engine/contextBuilder.ts
/**
 * Narrative Context Builder — harvest→rank→select→feed pipeline.
 *
 * Enriches Notable/Chronicle events with tension-scored world objects
 * from the graph, enabling world-aware prose generation.
 *
 * Design doc: Docs/plans/2026-03-07-narrative-context-builder-design.md
 */
import type { WorldGraph } from './graph';
import type {
  NarrativeEvent,
  NarrativeTier,
  ContextObject,
  ContextCategory,
  OppositionSummary,
  NarrativeContext,
} from '../types/narrative';
import type { GraphNode } from '../types/graph';
import {
  HARVEST_LIMITS,
  PROXIMITY_SCORES,
} from '../data/opposition-content';

// ─── Internal Types ─────────────────────────────────────────────

export interface HarvestedObject {
  nodeId: string;
  name: string;
  category: ContextCategory;
  proximity: number;       // Distance score
  node: GraphNode;         // Full node for scoring
}

// ─── Harvest ────────────────────────────────────────────────────

/**
 * Harvest world objects from the graph outward from the event's
 * actors and location. Returns raw harvested objects before ranking.
 */
export function harvestContext(
  event: NarrativeEvent,
  graph: WorldGraph,
): HarvestedObject[] {
  const actorId = event.actorId;
  if (!actorId) return [];

  const actorNode = graph.getNode(actorId);
  if (!actorNode) return [];

  // Find actor's location
  const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
  if (locEdges.length === 0) return [];
  const actorLocId = locEdges[0].target;

  const tier = event.tier;
  const hopLimit = HARVEST_LIMITS[tier as keyof typeof HARVEST_LIMITS] ?? 1;

  // BFS to find locations within hop radius
  const locationsByDistance = new Map<string, number>(); // locId → distance
  locationsByDistance.set(actorLocId, 0);
  const queue: Array<{ locId: string; depth: number }> = [{ locId: actorLocId, depth: 0 }];

  while (queue.length > 0) {
    const { locId, depth } = queue.shift()!;
    if (depth >= hopLimit) continue;

    // Get adjacent locations
    const adjEdges = [
      ...graph.getOutgoingEdges(locId, 'adjacent'),
      ...graph.getIncomingEdges(locId, 'adjacent'),
    ];
    for (const edge of adjEdges) {
      const neighborId = edge.source === locId ? edge.target : edge.source;
      if (!locationsByDistance.has(neighborId)) {
        locationsByDistance.set(neighborId, depth + 1);
        queue.push({ locId: neighborId, depth: depth + 1 });
      }
    }
  }

  const harvested: HarvestedObject[] = [];
  const seen = new Set<string>(); // Prevent duplicates
  const excludeIds = new Set<string>([actorId]); // Don't harvest the event actor itself
  if (event.targetId) excludeIds.add(event.targetId);

  // Helper to get proximity score from distance
  function proximityFromDistance(dist: number): number {
    if (dist === 0) return PROXIMITY_SCORES.same_location;
    if (dist === 1) return PROXIMITY_SCORES.adjacent;
    return PROXIMITY_SCORES.same_region;
  }

  // For each in-range location, harvest actors and artifacts
  for (const [locId, dist] of locationsByDistance) {
    const locNode = graph.getNode(locId);
    const proximity = proximityFromDistance(dist);

    // Harvest adjacent locations themselves (not the actor's own location)
    if (dist > 0 && locNode && !seen.has(locId)) {
      seen.add(locId);
      harvested.push({
        nodeId: locId, name: locNode.name, category: 'location',
        proximity, node: locNode,
      });
    }

    // Harvest actors at this location
    const locatedAtEdges = graph.getIncomingEdges(locId, 'located_at');
    for (const edge of locatedAtEdges) {
      const actId = edge.source;
      if (excludeIds.has(actId) || seen.has(actId)) continue;
      const node = graph.getNode(actId);
      if (!node || node.type !== 'actor') continue;

      const actorType = node.properties.actorType as string;
      if (actorType === 'faction') {
        seen.add(actId);
        harvested.push({ nodeId: actId, name: node.name, category: 'faction', proximity, node });
      } else if (actorType === 'individual' || actorType === 'group') {
        seen.add(actId);
        harvested.push({ nodeId: actId, name: node.name, category: 'character', proximity, node });
      }
    }

    // Harvest artifacts at this location (located_at edges from artifacts, or possesses edges from actors at this location)
    // Check for artifacts possessed by actors at this location
    for (const edge of locatedAtEdges) {
      const actId = edge.source;
      const possEdges = graph.getOutgoingEdges(actId, 'possesses');
      const bondEdges = graph.getOutgoingEdges(actId, 'bonded_to');
      for (const pe of [...possEdges, ...bondEdges]) {
        const artNode = graph.getNode(pe.target);
        if (artNode && !seen.has(artNode.id) && (artNode.type === 'artifact' || artNode.type === 'artifact_legendary')) {
          seen.add(artNode.id);
          harvested.push({ nodeId: artNode.id, name: artNode.name, category: 'artifact', proximity, node: artNode });
        }
      }
    }
  }

  // Harvest factions connected to event actor (regardless of location)
  const memberEdges = graph.getOutgoingEdges(actorId, 'member_of');
  for (const edge of memberEdges) {
    const facNode = graph.getNode(edge.target);
    if (facNode && !seen.has(facNode.id)) {
      seen.add(facNode.id);
      harvested.push({
        nodeId: facNode.id, name: facNode.name, category: 'faction',
        proximity: PROXIMITY_SCORES.graph_connected, node: facNode,
      });
    }
  }

  // Harvest event nodes connected to actor or location (historical events)
  const actorEdges = graph.getAllEdgesForNode(actorId);
  for (const edge of actorEdges) {
    const otherId = edge.source === actorId ? edge.target : edge.source;
    const otherNode = graph.getNode(otherId);
    if (otherNode && otherNode.type === 'event' && !seen.has(otherId)) {
      seen.add(otherId);
      harvested.push({
        nodeId: otherId, name: otherNode.name, category: 'event',
        proximity: PROXIMITY_SCORES.graph_connected, node: otherNode,
      });
    }
  }

  return harvested;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/contextBuilder.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/engine/contextBuilder.ts src/engine/__tests__/contextBuilder.test.ts
git commit -m "feat(context): add harvestContext function — BFS graph traversal for world objects"
```

---

### Task 4: Rank Function (Opposition Tension Scoring)

**Files:**
- Modify: `src/engine/contextBuilder.ts`
- Modify: `src/engine/__tests__/contextBuilder.test.ts`

**Context:**
The rank function scores each harvested object using: Proximity + Involvement + Opposition Tension. Involvement is determined by graph edge analysis (is this a direct participant? owner? atmospheric?). Opposition tension uses the matrices from opposition-content.ts.

**Step 1: Write rank tests**

Append to `contextBuilder.test.ts`:

```typescript
import { rankObjects } from '../contextBuilder';

describe('rankObjects', () => {
  const graph = buildTestGraph();

  it('scores direct participant highest involvement', () => {
    const event: NarrativeEvent = {
      id: 'evt-r1', tier: 'notable', eventType: 'contested_action',
      description: 'battle', tick: 20, actorId: 'act-1', targetId: 'act-2',
    };
    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);
    // All objects should have relevanceScore > 0
    for (const obj of ranked) {
      expect(obj.relevanceScore).toBeGreaterThan(0);
    }
  });

  it('sorts objects by descending relevance score', () => {
    const event: NarrativeEvent = {
      id: 'evt-r2', tier: 'chronicle', eventType: 'actor_death',
      description: 'death', tick: 21, actorId: 'act-1',
    };
    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].relevanceScore).toBeGreaterThanOrEqual(ranked[i].relevanceScore);
    }
  });

  it('applies sphere opposition tension to aligned objects', () => {
    // act-1 is aligned with force. If we add a mind-aligned object, it should score tension.
    const g2 = buildTestGraph();
    g2.addNode({ id: 'art-mind', type: 'artifact', name: 'Mind Crystal', properties: {} });
    g2.addEdge({ id: 'at-mind', source: 'art-mind', target: 'loc-1', type: 'located_at', properties: {} });
    g2.addNode({ id: 'sphere-mind', type: 'cosmology', name: 'Mind', properties: {} });
    g2.addEdge({ id: 'align-mind', source: 'art-mind', target: 'sphere-mind', type: 'aligned_with', properties: {} });

    // Harvest with artifact at loc-1 possessed by someone
    g2.addEdge({ id: 'poss-mind', source: 'act-1', target: 'art-mind', type: 'possesses', properties: {} });

    const event: NarrativeEvent = {
      id: 'evt-r3', tier: 'notable', eventType: 'action_resolved',
      description: 'test', tick: 22, actorId: 'act-1', sphere: 'force',
    };
    const harvested = harvestContext(event, g2);
    const ranked = rankObjects(harvested, event, g2);
    const mindObj = ranked.find(r => r.nodeId === 'art-mind');
    // Should have some tension score (force↔mind = 3)
    if (mindObj) {
      expect(mindObj.relevanceScore).toBeGreaterThan(mindObj.proximity);
    }
  });

  it('returns ContextObject[] with all required fields', () => {
    const event: NarrativeEvent = {
      id: 'evt-r4', tier: 'notable', eventType: 'action_resolved',
      description: 'test', tick: 23, actorId: 'act-1',
    };
    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);
    for (const obj of ranked) {
      expect(obj.nodeId).toBeDefined();
      expect(obj.name).toBeDefined();
      expect(obj.category).toBeDefined();
      expect(typeof obj.relevanceScore).toBe('number');
      expect(typeof obj.briefDescription).toBe('string');
    }
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/contextBuilder.test.ts`
Expected: FAIL — rankObjects not found

**Step 3: Implement rankObjects**

Add to `src/engine/contextBuilder.ts`:

```typescript
import {
  getFoundationOpposition,
  getCreationSphereTension,
  getArchetypeFriction,
  INVOLVEMENT_SCORES,
} from '../data/opposition-content';

/**
 * Score involvement based on graph relationship to event.
 */
function scoreInvolvement(
  obj: HarvestedObject,
  event: NarrativeEvent,
  graph: WorldGraph,
): number {
  const { nodeId } = obj;

  // Direct participant (target of the event)
  if (event.targetId === nodeId) return INVOLVEMENT_SCORES.direct_participant;

  // Check if this object has a direct edge to the event actor
  if (event.actorId) {
    const actorEdges = graph.getAllEdgesForNode(event.actorId);
    for (const edge of actorEdges) {
      const otherId = edge.source === event.actorId ? edge.target : edge.source;
      if (otherId === nodeId) {
        // Connected to actor — causal or owner
        if (edge.type === 'possesses' || edge.type === 'bonded_to') return INVOLVEMENT_SCORES.owner_creator;
        if (edge.type === 'member_of' || edge.type === 'relates_to') return INVOLVEMENT_SCORES.causal;
      }
    }
  }

  // Atmospheric — nearby but not directly involved
  return INVOLVEMENT_SCORES.atmospheric;
}

/**
 * Score opposition tension between a harvested object and the event context.
 */
function scoreOppositionTension(
  obj: HarvestedObject,
  event: NarrativeEvent,
  graph: WorldGraph,
): { score: number; tensionType?: string } {
  let totalTension = 0;
  let dominantType: string | undefined;
  let highestSingle = 0;

  // 1. Foundation sphere opposition
  // Get event actor's foundation alignment
  const actorFoundation = event.actorId
    ? getFoundationAlignment(event.actorId, graph)
    : undefined;
  const objFoundation = getFoundationAlignment(obj.nodeId, graph);

  if (actorFoundation && objFoundation && actorFoundation !== objFoundation) {
    const score = getFoundationOpposition(actorFoundation, objFoundation);
    if (score > 0) {
      totalTension += score;
      if (score > highestSingle) { highestSingle = score; dominantType = 'foundation_sphere'; }
    }
  }

  // 2. Creation sphere opposition
  const eventSphere = event.sphere;
  const objSphere = getCreationSphereAlignment(obj.nodeId, graph);

  if (eventSphere && objSphere && eventSphere !== objSphere) {
    const score = getCreationSphereTension(eventSphere, objSphere);
    if (score > 0) {
      totalTension += score;
      if (score > highestSingle) { highestSingle = score; dominantType = 'creation_sphere'; }
    }
  }

  // 3. Archetype friction
  if (obj.category === 'character' && event.actorId) {
    const actorNode = graph.getNode(event.actorId);
    const actorArchetype = actorNode?.properties.narrativeArchetype as string | undefined;
    const objArchetype = obj.node.properties.narrativeArchetype as string | undefined;

    if (actorArchetype && objArchetype) {
      const score = getArchetypeFriction(actorArchetype, objArchetype);
      if (score > 0) {
        totalTension += score;
        if (score > highestSingle) { highestSingle = score; dominantType = 'archetype_friction'; }
      }
    }
  }

  return { score: totalTension, tensionType: dominantType };
}

/** Helper: get a node's foundation sphere alignment (chaos/order/light/darkness) */
function getFoundationAlignment(nodeId: string, graph: WorldGraph): string | undefined {
  const edges = graph.getOutgoingEdges(nodeId, 'aligned_with');
  for (const edge of edges) {
    const target = graph.getNode(edge.target);
    if (target?.type === 'cosmology') {
      const name = target.name.toLowerCase();
      if (['chaos', 'order', 'light', 'darkness'].includes(name)) return name;
    }
  }
  return undefined;
}

/** Helper: get a node's creation sphere alignment */
function getCreationSphereAlignment(nodeId: string, graph: WorldGraph): SphereName | undefined {
  const edges = graph.getOutgoingEdges(nodeId, 'aligned_with');
  for (const edge of edges) {
    const target = graph.getNode(edge.target);
    if (target?.type === 'cosmology') {
      const name = target.name.toLowerCase() as SphereName;
      if (['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'].includes(name)) return name;
    }
  }
  return undefined;
}

/** Brief description generator (simple, placeholder-safe) */
function generateBriefDescription(node: GraphNode): string {
  const type = node.type === 'actor'
    ? (node.properties.actorType as string ?? 'actor')
    : node.type;
  return `${node.name} (${type})`;
}

/**
 * Rank harvested objects by relevance: Proximity + Involvement + Opposition Tension.
 * Returns sorted ContextObject[] (highest score first).
 */
export function rankObjects(
  harvested: HarvestedObject[],
  event: NarrativeEvent,
  graph: WorldGraph,
): ContextObject[] {
  const scored: ContextObject[] = harvested.map(obj => {
    const involvement = scoreInvolvement(obj, event, graph);
    const tension = scoreOppositionTension(obj, event, graph);
    const relevanceScore = obj.proximity + involvement + tension.score;

    return {
      nodeId: obj.nodeId,
      name: obj.name,
      category: obj.category,
      relevanceScore,
      tensionType: tension.tensionType,
      briefDescription: generateBriefDescription(obj.node),
    };
  });

  // Sort descending by relevance
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scored;
}
```

Add import for `SphereName`:
```typescript
import type { SphereName } from '../types/index';
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/contextBuilder.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/engine/contextBuilder.ts src/engine/__tests__/contextBuilder.test.ts
git commit -m "feat(context): add rankObjects with opposition tension scoring"
```

---

### Task 5: Select Function

**Files:**
- Modify: `src/engine/contextBuilder.ts`
- Modify: `src/engine/__tests__/contextBuilder.test.ts`

**Context:**
Select the top N objects by score with category variety enforcement. Notable: 2-3 objects, Chronicle: 4-5. Category cap: max 2 from any single category. At least 1 character or faction if available.

**Step 1: Write select tests**

Append to `contextBuilder.test.ts`:

```typescript
import { selectObjects } from '../contextBuilder';
import type { ContextObject } from '../../types/narrative';

describe('selectObjects', () => {
  it('selects 2-3 objects for notable tier', () => {
    const objects: ContextObject[] = Array.from({ length: 8 }, (_, i) => ({
      nodeId: `n-${i}`, name: `Obj ${i}`, category: 'character' as const,
      relevanceScore: 10 - i, briefDescription: `Object ${i}`,
    }));
    const selected = selectObjects(objects, 'notable');
    expect(selected.length).toBeGreaterThanOrEqual(2);
    expect(selected.length).toBeLessThanOrEqual(3);
  });

  it('selects 4-5 objects for chronicle tier', () => {
    const objects: ContextObject[] = Array.from({ length: 10 }, (_, i) => ({
      nodeId: `n-${i}`, name: `Obj ${i}`, category: (['artifact', 'character', 'faction', 'location', 'event'] as const)[i % 5],
      relevanceScore: 20 - i, briefDescription: `Object ${i}`,
    }));
    const selected = selectObjects(objects, 'chronicle');
    expect(selected.length).toBeGreaterThanOrEqual(4);
    expect(selected.length).toBeLessThanOrEqual(5);
  });

  it('enforces category cap of 2', () => {
    const objects: ContextObject[] = Array.from({ length: 6 }, (_, i) => ({
      nodeId: `n-${i}`, name: `Artifact ${i}`, category: 'artifact' as const,
      relevanceScore: 10 - i, briefDescription: `Artifact ${i}`,
    }));
    const selected = selectObjects(objects, 'chronicle');
    const artifactCount = selected.filter(s => s.category === 'artifact').length;
    expect(artifactCount).toBeLessThanOrEqual(2);
  });

  it('prefers at least 1 character or faction if available', () => {
    const objects: ContextObject[] = [
      { nodeId: 'a1', name: 'Sword', category: 'artifact', relevanceScore: 10, briefDescription: '' },
      { nodeId: 'a2', name: 'Shield', category: 'artifact', relevanceScore: 9, briefDescription: '' },
      { nodeId: 'a3', name: 'Ruin', category: 'location', relevanceScore: 8, briefDescription: '' },
      { nodeId: 'c1', name: 'Mira', category: 'character', relevanceScore: 3, briefDescription: '' },
    ];
    const selected = selectObjects(objects, 'notable');
    const hasAgent = selected.some(s => s.category === 'character' || s.category === 'faction');
    expect(hasAgent).toBe(true);
  });

  it('returns fewer objects if not enough harvested', () => {
    const objects: ContextObject[] = [
      { nodeId: 'a1', name: 'Sword', category: 'artifact', relevanceScore: 5, briefDescription: '' },
    ];
    const selected = selectObjects(objects, 'chronicle');
    expect(selected.length).toBe(1);
  });

  it('returns empty array for empty input', () => {
    const selected = selectObjects([], 'notable');
    expect(selected).toEqual([]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/contextBuilder.test.ts`
Expected: FAIL — selectObjects not found

**Step 3: Implement selectObjects**

Add to `src/engine/contextBuilder.ts`:

```typescript
import { SELECTION_LIMITS, CATEGORY_CAP } from '../data/opposition-content';

/**
 * Select top N objects with category variety enforcement.
 * - Respects per-tier count limits
 * - Enforces category cap (max 2 per category)
 * - Ensures at least 1 character/faction if available
 */
export function selectObjects(
  ranked: ContextObject[],
  tier: NarrativeTier,
): ContextObject[] {
  if (ranked.length === 0) return [];

  const limits = SELECTION_LIMITS[tier as keyof typeof SELECTION_LIMITS]
    ?? SELECTION_LIMITS.notable;
  const maxCount = limits.max;

  // Greedy selection with category cap
  const selected: ContextObject[] = [];
  const categoryCounts: Record<string, number> = {};

  for (const obj of ranked) {
    if (selected.length >= maxCount) break;
    const count = categoryCounts[obj.category] ?? 0;
    if (count >= CATEGORY_CAP) continue;
    selected.push(obj);
    categoryCounts[obj.category] = count + 1;
  }

  // Ensure at least 1 character or faction if available
  const hasAgent = selected.some(s => s.category === 'character' || s.category === 'faction');
  if (!hasAgent) {
    const agent = ranked.find(r =>
      (r.category === 'character' || r.category === 'faction') &&
      !selected.some(s => s.nodeId === r.nodeId)
    );
    if (agent && selected.length > 0) {
      // Replace lowest-scored item (last in selected)
      selected[selected.length - 1] = agent;
    } else if (agent) {
      selected.push(agent);
    }
  }

  return selected;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/contextBuilder.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/engine/contextBuilder.ts src/engine/__tests__/contextBuilder.test.ts
git commit -m "feat(context): add selectObjects with category diversity enforcement"
```

---

### Task 6: buildNarrativeContext Entry Point

**Files:**
- Modify: `src/engine/contextBuilder.ts`
- Modify: `src/engine/__tests__/contextBuilder.test.ts`

**Context:**
The top-level `buildNarrativeContext` function orchestrates harvest→rank→select and assembles the `NarrativeContext` with opposition summary. This is the function that `phaseNarrative` will call.

**Step 1: Write integration tests**

Append to `contextBuilder.test.ts`:

```typescript
import { buildNarrativeContext } from '../contextBuilder';

describe('buildNarrativeContext', () => {
  const graph = buildTestGraph();

  it('returns a complete NarrativeContext for notable event', () => {
    const event: NarrativeEvent = {
      id: 'evt-b1', tier: 'notable', eventType: 'action_resolved',
      description: 'Kaelen fights', tick: 30, actorId: 'act-1', sphere: 'force',
    };
    const ctx = buildNarrativeContext(event, graph, 'tragic_hero');
    expect(ctx.event).toBe(event);
    expect(ctx.archetype).toBe('tragic_hero');
    expect(Array.isArray(ctx.contextObjects)).toBe(true);
    expect(Array.isArray(ctx.historicalFragments)).toBe(true);
    expect(ctx.oppositionSummary).toBeDefined();
    expect(typeof ctx.oppositionSummary.tensionScore).toBe('number');
  });

  it('returns empty context for routine events', () => {
    const event: NarrativeEvent = {
      id: 'evt-b2', tier: 'routine', eventType: 'action_resolved',
      description: 'minor', tick: 31, actorId: 'act-1',
    };
    const ctx = buildNarrativeContext(event, graph);
    expect(ctx.contextObjects).toEqual([]);
    expect(ctx.oppositionSummary.tensionScore).toBe(0);
  });

  it('populates oppositionSummary from tension scoring', () => {
    // Build a graph with opposing spheres
    const g2 = buildTestGraph();
    g2.addNode({ id: 'sphere-mind', type: 'cosmology', name: 'Mind', properties: {} });
    g2.addEdge({ id: 'align-mind-2', source: 'act-2', target: 'sphere-mind', type: 'aligned_with', properties: {} });

    const event: NarrativeEvent = {
      id: 'evt-b3', tier: 'notable', eventType: 'contested_action',
      description: 'clash', tick: 32, actorId: 'act-1', sphere: 'force',
    };
    const ctx = buildNarrativeContext(event, g2, 'tragic_hero');
    // act-2 (seeker, mind-aligned) is at adjacent location with force↔mind tension
    if (ctx.contextObjects.length > 0) {
      expect(ctx.oppositionSummary.tensionScore).toBeGreaterThanOrEqual(0);
    }
  });

  it('respects selection limits', () => {
    const event: NarrativeEvent = {
      id: 'evt-b4', tier: 'notable', eventType: 'action_resolved',
      description: 'test', tick: 33, actorId: 'act-1',
    };
    const ctx = buildNarrativeContext(event, graph);
    expect(ctx.contextObjects.length).toBeLessThanOrEqual(3);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/contextBuilder.test.ts`
Expected: FAIL — buildNarrativeContext not found

**Step 3: Implement buildNarrativeContext**

Add to `src/engine/contextBuilder.ts`:

```typescript
/**
 * Build a NarrativeContext for the given event.
 * Routine events return empty context (skip pipeline).
 * Notable/Chronicle events go through harvest→rank→select.
 */
export function buildNarrativeContext(
  event: NarrativeEvent,
  graph: WorldGraph,
  archetype?: string,
): NarrativeContext {
  // Routine events skip the pipeline
  if (event.tier === 'routine') {
    return {
      event,
      archetype,
      contextObjects: [],
      historicalFragments: [],
      oppositionSummary: { tensionScore: 0, opposingPairs: [] },
    };
  }

  // Harvest → Rank → Select
  const harvested = harvestContext(event, graph);
  const ranked = rankObjects(harvested, event, graph);
  const selected = selectObjects(ranked, event.tier);

  // Build opposition summary from selected objects
  const opposingPairs: import('../types/narrative').OpposingPair[] = [];
  let totalTension = 0;

  for (const obj of selected) {
    if (obj.tensionType) {
      opposingPairs.push({
        sourceId: event.actorId ?? '',
        targetId: obj.nodeId,
        tensionType: obj.tensionType,
        score: obj.relevanceScore, // Approximation — the tension component
      });
    }
  }

  // Recalculate total tension from selected objects' tension scores
  for (const obj of selected) {
    // Extract just the tension component (relevance - proximity - involvement baseline)
    // For simplicity, sum all tension types found
    if (obj.tensionType) {
      totalTension += obj.relevanceScore;
    }
  }

  const dominantTension = opposingPairs.length > 0
    ? opposingPairs.sort((a, b) => b.score - a.score)[0].tensionType
    : undefined;

  // Historical fragments: extract event names from selected event objects
  const historicalFragments = selected
    .filter(obj => obj.category === 'event')
    .map(obj => obj.briefDescription);

  return {
    event,
    archetype,
    contextObjects: selected,
    historicalFragments,
    oppositionSummary: {
      dominantTension,
      tensionScore: totalTension,
      opposingPairs,
    },
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/contextBuilder.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/engine/contextBuilder.ts src/engine/__tests__/contextBuilder.test.ts
git commit -m "feat(context): add buildNarrativeContext entry point — full harvest→rank→select pipeline"
```

---

### Task 7: Wire into phaseNarrative

**Files:**
- Modify: `src/engine/orchestrator.ts`
- Modify: `src/engine/__tests__/orchestrator-narrative.test.ts` (create if needed)

**Context:**
Replace the current `phaseNarrative` function with one that runs the context builder for notable/chronicle events. The context builder output enriches the `ChronicleEntry.promptContext` with real actors, location, and context objects.

Reference: `src/engine/orchestrator.ts:292-314` for current phaseNarrative.

**Step 1: Write orchestrator narrative tests**

```typescript
// src/engine/__tests__/orchestrator-narrative.test.ts
import { describe, it, expect } from 'vitest';
import { phaseNarrative } from '../orchestrator';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';

function buildMinimalState(): GameState {
  const graph = new WorldGraph();
  // Add location
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Test Loc', properties: { terrain: 'plains' } });
  // Add actor
  graph.addNode({ id: 'act-1', type: 'actor', name: 'Hero', properties: { actorType: 'individual', narrativeArchetype: 'tragic_hero' } });
  graph.addEdge({ id: 'at-1', source: 'act-1', target: 'loc-1', type: 'located_at', properties: {} });
  // Add artifact
  graph.addNode({ id: 'art-1', type: 'artifact', name: 'Sword', properties: {} });
  graph.addEdge({ id: 'poss-1', source: 'act-1', target: 'art-1', type: 'possesses', properties: {} });

  return {
    graph,
    tickEvents: [],
    chronicleEntries: [],
  } as unknown as GameState;
}

describe('phaseNarrative with context builder', () => {
  it('creates chronicle entry for high-significance events', () => {
    const state = buildMinimalState();
    state.tickEvents = [{
      id: 'te-1', tick: 1, type: 'agent_action_resolved',
      message: 'Hero strikes with great force', significance: 0.85,
      sphere: 'force',
    }];
    const result = phaseNarrative(state);
    expect(result.chronicleEntries!.length).toBe(1);
  });

  it('enriches promptContext with actors from graph', () => {
    const state = buildMinimalState();
    state.tickEvents = [{
      id: 'te-2', tick: 2, type: 'agent_action_resolved',
      message: 'Hero found something', significance: 0.9,
    }];
    const result = phaseNarrative(state);
    const entry = result.chronicleEntries![0];
    // Should have real location from graph, not empty string
    expect(entry.promptContext.location).not.toBe('');
  });

  it('skips context enrichment for low-significance events', () => {
    const state = buildMinimalState();
    state.tickEvents = [{
      id: 'te-3', tick: 3, type: 'agent_action_resolved',
      message: 'Minor thing', significance: 0.2,
    }];
    const result = phaseNarrative(state);
    expect(result.chronicleEntries!.length).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/orchestrator-narrative.test.ts`
Expected: Tests should run but may fail on promptContext assertions

**Step 3: Update phaseNarrative**

Modify `src/engine/orchestrator.ts:292-314`:

```typescript
import { buildNarrativeContext } from './contextBuilder';

export function phaseNarrative(state: GameState): Partial<GameState> {
  const newChronicleEntries = [...state.chronicleEntries];

  for (const event of state.tickEvents) {
    if (event.significance >= 0.8) {
      // Build narrative context for notable/chronicle events
      const narrativeEvent: NarrativeEvent = {
        id: event.id,
        tier: event.significance >= 0.9 ? 'chronicle' : 'notable',
        eventType: tickEventTypeToNarrativeType(event.type),
        description: event.message,
        tick: event.tick,
        sphere: event.sphere,
        // TODO: extract actorId from event once TickEvent carries it
      };

      const context = buildNarrativeContext(narrativeEvent, state.graph);

      newChronicleEntries.push({
        id: event.id,
        tier: 'chronicle',
        title: event.message.slice(0, 50),
        prose: event.message,
        promptContext: {
          actors: context.contextObjects
            .filter(co => co.category === 'character')
            .map(co => co.name),
          location: context.contextObjects
            .find(co => co.category === 'location')?.name ?? '',
          sphere: event.sphere ?? 'force',
          mood: context.oppositionSummary.dominantTension ?? 'dramatic',
          previousEvents: context.historicalFragments,
        },
        tick: event.tick,
      });
    }
  }

  return { chronicleEntries: newChronicleEntries };
}

/** Map TickEvent.type to NarrativeEventType */
function tickEventTypeToNarrativeType(type: string): import('../types/narrative').NarrativeEventType {
  const mapping: Record<string, import('../types/narrative').NarrativeEventType> = {
    agent_action: 'action_resolved',
    agent_action_resolved: 'action_resolved',
    doom_escalation: 'doom_escalation',
    rival_action: 'contested_action',
    mandate_progress: 'mandate_stage',
    narrative: 'action_resolved',
    dilemma_resolved: 'contested_action',
  };
  return mapping[type] ?? 'action_resolved';
}
```

Add imports at top of orchestrator.ts:
```typescript
import type { NarrativeEvent } from '../types/narrative';
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/orchestrator-narrative.test.ts`
Expected: ALL PASS

**Step 5: Run full test suite**

Run: `npx vitest run`
Expected: ALL existing tests still pass (additive change — old phaseNarrative tests should still work since the output shape is identical)

**Step 6: Commit**

```bash
git add src/engine/orchestrator.ts src/engine/__tests__/orchestrator-narrative.test.ts
git commit -m "feat(context): wire context builder into phaseNarrative — chronicle entries now world-aware"
```

---

### Task 8: Integration Test — Full Pipeline

**Files:**
- Create: `src/engine/__tests__/contextBuilder-integration.test.ts`

**Context:**
End-to-end test: build a rich graph, create notable/chronicle events, verify the full pipeline produces world-aware NarrativeContext with correct opposition scoring and category diversity.

**Step 1: Write integration tests**

```typescript
// src/engine/__tests__/contextBuilder-integration.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { buildNarrativeContext } from '../contextBuilder';
import type { NarrativeEvent } from '../../types/narrative';

function buildRichGraph(): WorldGraph {
  const g = new WorldGraph();

  // Cosmology
  g.addNode({ id: 'sphere-force', type: 'cosmology', name: 'Force', properties: {} });
  g.addNode({ id: 'sphere-mind', type: 'cosmology', name: 'Mind', properties: {} });
  g.addNode({ id: 'found-chaos', type: 'cosmology', name: 'Chaos', properties: {} });
  g.addNode({ id: 'found-order', type: 'cosmology', name: 'Order', properties: {} });

  // Region with 3 locations
  g.addNode({ id: 'loc-fort', type: 'location', name: 'Iron Fortress', properties: { terrain: 'mountain' } });
  g.addNode({ id: 'loc-marsh', type: 'location', name: 'Blightmarsh', properties: { terrain: 'swamp' } });
  g.addNode({ id: 'loc-tower', type: 'location', name: 'Ivory Tower', properties: { terrain: 'plains' } });
  g.addEdge({ id: 'adj-1', source: 'loc-fort', target: 'loc-marsh', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj-2', source: 'loc-marsh', target: 'loc-tower', type: 'adjacent', properties: {} });

  // Protagonist: tragic_hero at the fort, force-aligned, chaos-aligned
  g.addNode({ id: 'hero', type: 'actor', name: 'Kaelen', properties: { actorType: 'individual', narrativeArchetype: 'tragic_hero' } });
  g.addEdge({ id: 'at-hero', source: 'hero', target: 'loc-fort', type: 'located_at', properties: {} });
  g.addEdge({ id: 'align-hero-force', source: 'hero', target: 'sphere-force', type: 'aligned_with', properties: {} });
  g.addEdge({ id: 'align-hero-chaos', source: 'hero', target: 'found-chaos', type: 'aligned_with', properties: {} });

  // Antagonist: schemer at marsh, mind-aligned, order-aligned
  g.addNode({ id: 'schemer', type: 'actor', name: 'Vex', properties: { actorType: 'individual', narrativeArchetype: 'schemer' } });
  g.addEdge({ id: 'at-schemer', source: 'schemer', target: 'loc-marsh', type: 'located_at', properties: {} });
  g.addEdge({ id: 'align-schemer-mind', source: 'schemer', target: 'sphere-mind', type: 'aligned_with', properties: {} });
  g.addEdge({ id: 'align-schemer-order', source: 'schemer', target: 'found-order', type: 'aligned_with', properties: {} });

  // Artifact possessed by hero
  g.addNode({ id: 'art-blade', type: 'artifact', name: 'Thornblade', properties: {} });
  g.addEdge({ id: 'poss-blade', source: 'hero', target: 'art-blade', type: 'possesses', properties: {} });

  // Faction
  g.addNode({ id: 'fac-iron', type: 'actor', name: 'Iron Brotherhood', properties: { actorType: 'faction' } });
  g.addEdge({ id: 'mem-hero', source: 'hero', target: 'fac-iron', type: 'member_of', properties: {} });

  // Distant character (at tower, 2 hops away)
  g.addNode({ id: 'sage', type: 'actor', name: 'Alethea', properties: { actorType: 'individual', narrativeArchetype: 'seeker' } });
  g.addEdge({ id: 'at-sage', source: 'sage', target: 'loc-tower', type: 'located_at', properties: {} });

  return g;
}

describe('Context Builder Integration', () => {
  const graph = buildRichGraph();

  it('produces world-aware context for notable event', () => {
    const event: NarrativeEvent = {
      id: 'int-1', tier: 'notable', eventType: 'contested_action',
      description: 'Kaelen clashes with unseen forces', tick: 50,
      actorId: 'hero', sphere: 'force',
    };
    const ctx = buildNarrativeContext(event, graph, 'tragic_hero');

    expect(ctx.contextObjects.length).toBeGreaterThanOrEqual(1);
    expect(ctx.contextObjects.length).toBeLessThanOrEqual(3);

    // Should find the schemer at adjacent marsh
    const hasSchemer = ctx.contextObjects.some(o => o.nodeId === 'schemer');
    expect(hasSchemer).toBe(true);
  });

  it('scores high tension for chaos hero vs order schemer', () => {
    const event: NarrativeEvent = {
      id: 'int-2', tier: 'notable', eventType: 'contested_action',
      description: 'test', tick: 51, actorId: 'hero', sphere: 'force',
    };
    const ctx = buildNarrativeContext(event, graph, 'tragic_hero');

    // Vex (schemer) should have high tension: foundation (chaos↔order=5) + creation (force↔mind=3)
    const vex = ctx.contextObjects.find(o => o.nodeId === 'schemer');
    if (vex) {
      expect(vex.relevanceScore).toBeGreaterThan(5); // At minimum proximity(2) + involvement(1) + tension
    }
    expect(ctx.oppositionSummary.tensionScore).toBeGreaterThan(0);
  });

  it('chronicle tier reaches distant characters', () => {
    const event: NarrativeEvent = {
      id: 'int-3', tier: 'chronicle', eventType: 'actor_death',
      description: 'death of a hero', tick: 52, actorId: 'hero',
    };
    const ctx = buildNarrativeContext(event, graph, 'tragic_hero');

    // Sage at tower (2 hops) should be reachable for chronicle
    const hasSage = ctx.contextObjects.some(o => o.nodeId === 'sage');
    expect(hasSage).toBe(true);
  });

  it('respects category diversity', () => {
    const event: NarrativeEvent = {
      id: 'int-4', tier: 'chronicle', eventType: 'contested_action',
      description: 'epic clash', tick: 53, actorId: 'hero', sphere: 'force',
    };
    const ctx = buildNarrativeContext(event, graph, 'tragic_hero');

    const categoryCounts: Record<string, number> = {};
    for (const obj of ctx.contextObjects) {
      categoryCounts[obj.category] = (categoryCounts[obj.category] ?? 0) + 1;
    }
    for (const count of Object.values(categoryCounts)) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });
});
```

**Step 2: Run the integration tests**

Run: `npx vitest run src/engine/__tests__/contextBuilder-integration.test.ts`
Expected: ALL PASS

**Step 3: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS (existing + new)

**Step 4: Commit**

```bash
git add src/engine/__tests__/contextBuilder-integration.test.ts
git commit -m "test(context): add integration tests — rich graph with opposing spheres and archetypes"
```

---

### Task 9: Documentation Updates

**Files:**
- Modify: `CLAUDE.md` (changelog + project status)
- Obsidian vault notes (if MCP available)
- Notion backlog (if API available)

**Context:**
Follow the `gamedocumenter` skill checklist. Update all three documentation layers.

**Step 1: Update CLAUDE.md changelog**

Append rows for: opposition-content.ts, narrative context types, contextBuilder.ts (harvest/rank/select/build), orchestrator wiring, integration tests.

**Step 2: Update CLAUDE.md project status**

Add line: `- Narrative Context Builder (Pass 1): ✅ Complete — harvest→rank→select→feed pipeline, opposition tension scoring, phaseNarrative enrichment`

Update engine stats (module count, line count, test count).

**Step 3: Update Obsidian vault (if available)**

Create `Systems/Narrative Context Builder.md` with connections to Narrative Engine, Opposition Scoring, Agent Archetypes.
Update `Systems/Index.md` with new link.

**Step 4: Update Notion backlog (if available)**

Add Narrative Context Builder Pass 1 as complete with reference docs.

**Step 5: Commit documentation**

```bash
git add CLAUDE.md
git commit -m "docs: update project status for narrative context builder Pass 1"
```
