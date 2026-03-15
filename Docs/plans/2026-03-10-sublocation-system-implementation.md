# Sublocation System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the sublocation system so that encounters at a location are organized under sublocations, agents select sublocations based on axiological motivations, and the UI presents an agent-centric grouped view.

**Architecture:** Sublocation instances are lazy graph nodes created on-demand via `ensureSublocations()`. A 5-step selection pipeline (ensure → score → select sublocation → generate candidates → select encounter) replaces the current flat pipeline. The LocationView component is restructured to group encounters by sublocation card with agent-centric presentation. All changes are additive — existing templates work via fallback.

**Tech Stack:** TypeScript, React, Vitest, Vite. Graph engine (`WorldGraph`), seeded PRNG, axiological scoring.

**Design doc:** `Docs/plans/2026-03-10-sublocation-system-design.md`

---

## Task 1: Add Sublocation Types and Interfaces

**Files:**
- Modify: `src/types/encounter.ts` (add `sublocationTypes` field to `EncounterTemplate`)
- Create: `src/types/sublocation.ts` (new file for sublocation-specific types)
- Create: `src/types/__tests__/sublocation.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/sublocation.test.ts
import { describe, it, expect } from 'vitest';
import type {
  SublocationPersistence,
  SublocationProperties,
  TemporalTrigger,
  DivineOrigin,
} from '../sublocation';

describe('Sublocation types', () => {
  it('constructs a permanent sublocation', () => {
    const props: SublocationProperties = {
      sublocationTypeId: 'sublocation.temple-quarter',
      parentLocationId: 'loc.thornwall',
      persistence: { type: 'permanent' },
    };
    expect(props.persistence.type).toBe('permanent');
    expect(props.sublocationTypeId).toBe('sublocation.temple-quarter');
  });

  it('constructs a temporal sublocation with encounter_completed trigger', () => {
    const props: SublocationProperties = {
      sublocationTypeId: 'sublocation.moonlit-garden',
      parentLocationId: 'loc.thornwall',
      persistence: { type: 'temporal', dissolvesOn: 'encounter_completed' },
    };
    expect(props.persistence.type).toBe('temporal');
    if (props.persistence.type === 'temporal') {
      expect(props.persistence.dissolvesOn).toBe('encounter_completed');
    }
  });

  it('constructs a temporal sublocation with tick_expiry trigger', () => {
    const props: SublocationProperties = {
      sublocationTypeId: 'sublocation.war-camp',
      parentLocationId: 'loc.thornwall',
      persistence: {
        type: 'temporal',
        dissolvesOn: { type: 'tick_expiry', expiresAtTick: 50 },
      },
    };
    expect(props.persistence.type).toBe('temporal');
  });

  it('constructs a conditional sublocation', () => {
    const props: SublocationProperties = {
      sublocationTypeId: 'sublocation.barracks',
      parentLocationId: 'loc.thornwall',
      persistence: { type: 'conditional', predicate: 'faction_conflict_active' },
    };
    expect(props.persistence.type).toBe('conditional');
  });

  it('constructs a divine sublocation with origin metadata', () => {
    const origin: DivineOrigin = {
      creatorGodId: 'god.entropy',
      purpose: 'arrange_meeting',
      createdAtTick: 12,
    };
    const props: SublocationProperties = {
      sublocationTypeId: 'sublocation.moonlit-garden',
      parentLocationId: 'loc.thornwall',
      persistence: { type: 'temporal', dissolvesOn: 'encounter_completed' },
      divineOrigin: origin,
    };
    expect(props.divineOrigin?.creatorGodId).toBe('god.entropy');
    expect(props.divineOrigin?.purpose).toBe('arrange_meeting');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npx vitest run src/types/__tests__/sublocation.test.ts`
Expected: FAIL — cannot resolve `../sublocation`

**Step 3: Write minimal implementation**

```typescript
// src/types/sublocation.ts

/**
 * Sublocation system types.
 *
 * Sublocations are graph nodes (type: 'location') created lazily under
 * parent locations. They organize encounters spatially and give agents
 * a motivation-driven "place" choice before encounter selection.
 *
 * Design doc: Docs/plans/2026-03-10-sublocation-system-design.md
 */

// ── Persistence ─────────────────────────────────────────────

export type TemporalTrigger =
  | 'encounter_completed'
  | 'visited'
  | { type: 'tick_expiry'; expiresAtTick: number };

export type SublocationPersistence =
  | { type: 'permanent' }
  | { type: 'temporal'; dissolvesOn: TemporalTrigger }
  | { type: 'conditional'; predicate: string };

// ── Divine Origin ───────────────────────────────────────────

export interface DivineOrigin {
  creatorGodId: string;
  purpose: string;
  createdAtTick: number;
}

// ── Node Properties ─────────────────────────────────────────

/**
 * Properties stored on a sublocation GraphNode.
 * The node itself has `type: 'location'` and is distinguished by
 * having a `sublocationTypeId` property.
 */
export interface SublocationProperties {
  sublocationTypeId: string;
  parentLocationId: string;
  persistence: SublocationPersistence;
  divineOrigin?: DivineOrigin;
}

// ── Constants ───────────────────────────────────────────────

/** Purpose tags for divine sublocation creation. */
export const DIVINE_PURPOSES = [
  'arrange_meeting',
  'test_resolve',
  'offer_temptation',
  'reveal_truth',
  'stage_betrayal',
  'grant_sanctuary',
  'provoke_conflict',
  'bestow_vision',
] as const;

export type DivinePurpose = (typeof DIVINE_PURPOSES)[number];
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npx vitest run src/types/__tests__/sublocation.test.ts`
Expected: PASS — all 5 tests pass

**Step 5: Add `sublocationTypes` to EncounterTemplate**

Modify `src/types/encounter.ts` — add one optional field after line 117 (`locationTypes`):

```typescript
// In EncounterTemplate interface, after locationTypes:
  sublocationTypes?: string[];    // If present, used for sublocation-level filtering
```

**Step 6: Export from barrel**

Add to `src/types/index.ts`:
```typescript
export type {
  SublocationPersistence,
  SublocationProperties,
  TemporalTrigger,
  DivineOrigin,
  DivinePurpose,
} from './sublocation';
export { DIVINE_PURPOSES } from './sublocation';
```

**Step 7: Type-check**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
git add src/types/sublocation.ts src/types/__tests__/sublocation.test.ts src/types/encounter.ts src/types/index.ts
git commit -m "feat(types): add sublocation types, persistence model, and divine origin"
```

---

## Task 2: Implement `ensureSublocations` — Lazy Graph Node Creation

**Files:**
- Create: `src/engine/sublocation.ts`
- Create: `src/engine/__tests__/sublocation.test.ts`

**Context:** `ensureSublocations` checks if a location already has sublocation instances. If not, it reads the location's type, looks up which sublocation types that location type contains (via `contains_type` edges in world-model.json), and creates instance nodes with `contains` edges. Must be idempotent.

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/sublocation.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { ensureSublocations } from '../sublocation';
import type { GraphNode } from '../../types/graph';

function makeLocationNode(id: string, subtype: string): GraphNode {
  return {
    id,
    type: 'location',
    name: id,
    properties: { locationType: 'hex', locationSubtype: subtype },
  };
}

function makeSublocationTypeNode(id: string, name: string): GraphNode {
  return {
    id,
    type: 'location',
    name,
    properties: { category: 'sublocation-type' },
  };
}

function makeLocationTypeNode(id: string): GraphNode {
  return {
    id,
    type: 'location',
    name: id,
    properties: { category: 'location-type' },
  };
}

describe('ensureSublocations', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('creates sublocation instances for a location with mapped types', () => {
    // Setup: location-type "city" contains sublocation-types "temple-quarter" and "market-district"
    const locTypeNode = makeLocationTypeNode('location-type.city');
    const subType1 = makeSublocationTypeNode('sublocation-type.temple-quarter', 'Temple Quarter');
    const subType2 = makeSublocationTypeNode('sublocation-type.market-district', 'Market District');
    const location = makeLocationNode('loc.thornwall', 'city');

    graph.addNode(locTypeNode);
    graph.addNode(subType1);
    graph.addNode(subType2);
    graph.addNode(location);

    // Edges: location-type.city contains sublocation types
    graph.addEdge({ id: 'e1', source: locTypeNode.id, target: subType1.id, type: 'contains', properties: {} });
    graph.addEdge({ id: 'e2', source: locTypeNode.id, target: subType2.id, type: 'contains', properties: {} });

    const subs = ensureSublocations(graph, 'loc.thornwall');

    expect(subs).toHaveLength(2);
    expect(subs.map(s => s.properties.sublocationTypeId).sort()).toEqual([
      'sublocation-type.market-district',
      'sublocation-type.temple-quarter',
    ]);
    // Each sublocation has a contains edge from the location
    for (const sub of subs) {
      expect(sub.properties.parentLocationId).toBe('loc.thornwall');
      expect(sub.properties.persistence).toEqual({ type: 'permanent' });
      const edges = graph.getIncomingEdges(sub.id, 'contains');
      expect(edges.some(e => e.source === 'loc.thornwall')).toBe(true);
    }
  });

  it('is idempotent — second call returns same nodes without creating duplicates', () => {
    const locTypeNode = makeLocationTypeNode('location-type.city');
    const subType1 = makeSublocationTypeNode('sublocation-type.temple-quarter', 'Temple Quarter');
    const location = makeLocationNode('loc.thornwall', 'city');

    graph.addNode(locTypeNode);
    graph.addNode(subType1);
    graph.addNode(location);
    graph.addEdge({ id: 'e1', source: locTypeNode.id, target: subType1.id, type: 'contains', properties: {} });

    const first = ensureSublocations(graph, 'loc.thornwall');
    const second = ensureSublocations(graph, 'loc.thornwall');

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(first[0].id).toBe(second[0].id);
  });

  it('returns empty array for locations with no sublocation type mappings', () => {
    const locTypeNode = makeLocationTypeNode('location-type.wilderness');
    const location = makeLocationNode('loc.empty-field', 'wilderness');
    graph.addNode(locTypeNode);
    graph.addNode(location);

    const subs = ensureSublocations(graph, 'loc.empty-field');
    expect(subs).toHaveLength(0);
  });

  it('returns empty array for unknown location (fail-soft)', () => {
    const subs = ensureSublocations(graph, 'loc.nonexistent');
    expect(subs).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/sublocation.test.ts`
Expected: FAIL — cannot resolve `../sublocation`

**Step 3: Write minimal implementation**

```typescript
// src/engine/sublocation.ts
import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { SublocationProperties } from '../types/sublocation';

/**
 * Ensure sublocation instance nodes exist for a location.
 *
 * Reads the location's subtype, finds its location-type node in the graph,
 * follows `contains` edges to sublocation-type nodes, and creates instance
 * nodes for any types not yet instantiated at this location.
 *
 * Idempotent: safe to call multiple times for the same location.
 * Fail-soft: returns [] if location not found or has no sublocation mappings.
 */
export function ensureSublocations(
  graph: WorldGraph,
  locationId: string,
): GraphNode[] {
  const locationNode = graph.getNode(locationId);
  if (!locationNode) return [];

  // Check for existing sublocation instances
  const existingEdges = graph.getOutgoingEdges(locationId, 'contains');
  const existingSubs: GraphNode[] = [];
  for (const edge of existingEdges) {
    const node = graph.getNode(edge.target);
    if (node && node.properties.sublocationTypeId) {
      existingSubs.push(node);
    }
  }

  // Determine which sublocation types this location should have
  const subtype = (locationNode.properties.locationSubtype ??
    locationNode.properties.locationType) as string | undefined;
  if (!subtype) return existingSubs;

  const locTypeNodeId = `location-type.${subtype}`;
  const locTypeNode = graph.getNode(locTypeNodeId);
  if (!locTypeNode) return existingSubs;

  // Follow contains edges from location-type to sublocation-type nodes
  const typeEdges = graph.getOutgoingEdges(locTypeNodeId, 'contains');
  const sublocationTypeIds = new Set<string>();
  for (const edge of typeEdges) {
    const targetNode = graph.getNode(edge.target);
    if (targetNode && (targetNode.properties.category === 'sublocation-type' ||
        targetNode.id.startsWith('sublocation-type.'))) {
      sublocationTypeIds.add(targetNode.id);
    }
  }

  if (sublocationTypeIds.size === 0) return existingSubs;

  // Check which types already have instances at this location
  const existingTypeIds = new Set(
    existingSubs.map(s => s.properties.sublocationTypeId as string),
  );

  // Create missing instances
  for (const typeId of sublocationTypeIds) {
    if (existingTypeIds.has(typeId)) continue;

    const typeNode = graph.getNode(typeId);
    const instanceId = `${locationId}.${typeId.replace('sublocation-type.', '')}`;

    const props: SublocationProperties = {
      sublocationTypeId: typeId,
      parentLocationId: locationId,
      persistence: { type: 'permanent' },
    };

    const instanceNode: GraphNode = {
      id: instanceId,
      type: 'location',
      name: typeNode?.name ?? typeId.replace('sublocation-type.', '').replace(/-/g, ' '),
      properties: { ...props },
    };

    graph.addNode(instanceNode);
    graph.addEdge({
      id: `edge.contains.${locationId}.${instanceId}`,
      source: locationId,
      target: instanceId,
      type: 'contains',
      properties: {},
    });

    existingSubs.push(instanceNode);
  }

  return existingSubs;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/sublocation.test.ts`
Expected: PASS — all 4 tests pass

**Step 5: Type-check**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/engine/sublocation.ts src/engine/__tests__/sublocation.test.ts
git commit -m "feat(engine): implement ensureSublocations with lazy graph node creation"
```

---

## Task 3: Implement Sublocation Scoring Pipeline

**Files:**
- Modify: `src/engine/sublocation.ts` (add `scoreSublocations`, `selectSublocation`)
- Modify: `src/engine/__tests__/sublocation.test.ts` (add scoring tests)

**Context:** Score sublocations by how well their encounter types align with the agent's axiological motivations. Each sublocation type has `Hosts` edges to encounter types in the graph model. We compute motivation profiles from those encounter types and dot-product against the agent's axiological vector.

**Step 1: Write the failing tests**

Add to `src/engine/__tests__/sublocation.test.ts`:

```typescript
import { ensureSublocations, scoreSublocations, selectSublocation } from '../sublocation';
import type { AxiologicalProfile } from '../../types/agent';
import { createSeededRng } from '../prng';

// Helper to make an actor node with axiological profile
function makeActorNode(id: string, profile: Partial<AxiologicalProfile>): GraphNode {
  const fullProfile: AxiologicalProfile = {
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
    ...profile,
  };
  return {
    id,
    type: 'actor',
    name: id,
    properties: { actorType: 'individual', axiologicalProfile: fullProfile },
  };
}

describe('scoreSublocations', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('scores sublocations by motivation alignment with agent profile', () => {
    // Create a sublocation instance node
    const subNode: GraphNode = {
      id: 'loc.thornwall.temple-quarter',
      type: 'location',
      name: 'Temple Quarter',
      properties: {
        sublocationTypeId: 'sublocation-type.temple-quarter',
        parentLocationId: 'loc.thornwall',
        persistence: { type: 'permanent' },
      },
    };
    graph.addNode(subNode);

    // The sublocation type hosts encounter types with known motivations
    const subTypeNode: GraphNode = {
      id: 'sublocation-type.temple-quarter',
      type: 'location',
      name: 'Temple Quarter',
      properties: { category: 'sublocation-type', motivations: ['devotion_independence', 'courage_prudence'] },
    };
    graph.addNode(subTypeNode);

    // Agent with strong devotion
    const actor = makeActorNode('actor.kael', { devotion_independence: 0.8, courage_prudence: 0.5 });
    graph.addNode(actor);

    const scored = scoreSublocations(graph, 'actor.kael', [subNode]);
    expect(scored).toHaveLength(1);
    expect(scored[0].score).toBeGreaterThan(0);
    expect(scored[0].sublocationId).toBe('loc.thornwall.temple-quarter');
  });

  it('returns all sublocations with non-negative scores (never filters out)', () => {
    const sub1: GraphNode = {
      id: 'sub.a',
      type: 'location',
      name: 'A',
      properties: {
        sublocationTypeId: 'sublocation-type.temple-quarter',
        parentLocationId: 'loc.x',
        persistence: { type: 'permanent' },
        motivations: ['devotion_independence'],
      },
    };
    const sub2: GraphNode = {
      id: 'sub.b',
      type: 'location',
      name: 'B',
      properties: {
        sublocationTypeId: 'sublocation-type.market-district',
        parentLocationId: 'loc.x',
        persistence: { type: 'permanent' },
        motivations: ['greed_generosity'],
      },
    };
    graph.addNode(sub1);
    graph.addNode(sub2);

    // sublocation-type nodes with motivations
    graph.addNode({
      id: 'sublocation-type.temple-quarter',
      type: 'location',
      name: 'Temple Quarter',
      properties: { category: 'sublocation-type', motivations: ['devotion_independence'] },
    });
    graph.addNode({
      id: 'sublocation-type.market-district',
      type: 'location',
      name: 'Market District',
      properties: { category: 'sublocation-type', motivations: ['greed_generosity'] },
    });

    const actor = makeActorNode('actor.test', { devotion_independence: 0.9, greed_generosity: -0.5 });
    graph.addNode(actor);

    const scored = scoreSublocations(graph, 'actor.test', [sub1, sub2]);
    expect(scored).toHaveLength(2);
    // Temple quarter should score higher
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    expect(sorted[0].sublocationId).toBe('sub.a');
  });
});

describe('selectSublocation', () => {
  it('selects a sublocation via weighted random with seeded PRNG', () => {
    const scored = [
      { sublocationId: 'sub.a', score: 0.8 },
      { sublocationId: 'sub.b', score: 0.2 },
    ];
    const rng = createSeededRng(42);
    const result = selectSublocation(scored, rng);
    expect(['sub.a', 'sub.b']).toContain(result);
  });

  it('is deterministic — same seed gives same result', () => {
    const scored = [
      { sublocationId: 'sub.a', score: 0.6 },
      { sublocationId: 'sub.b', score: 0.4 },
    ];
    const r1 = selectSublocation(scored, createSeededRng(99));
    const r2 = selectSublocation(scored, createSeededRng(99));
    expect(r1).toBe(r2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/sublocation.test.ts`
Expected: FAIL — `scoreSublocations` and `selectSublocation` not exported

**Step 3: Implement scoring and selection**

Add to `src/engine/sublocation.ts`:

```typescript
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { SeededRng } from './prng';

// ── Scoring ─────────────────────────────────────────────────

export interface ScoredSublocation {
  sublocationId: string;
  score: number;
}

/**
 * Score sublocations by how well they align with an agent's axiological profile.
 *
 * For each sublocation, reads its type node's `motivations` property (a ValuePair[]),
 * then dot-products those motivation weights against the agent's axiological vector.
 * All sublocations are returned (never filtered) — scoring influences probability, not eligibility.
 */
export function scoreSublocations(
  graph: WorldGraph,
  actorId: string,
  sublocations: GraphNode[],
): ScoredSublocation[] {
  const actorNode = graph.getNode(actorId);
  if (!actorNode) return sublocations.map(s => ({ sublocationId: s.id, score: 0 }));

  const profile = actorNode.properties.axiologicalProfile as AxiologicalProfile | undefined;
  if (!profile) return sublocations.map(s => ({ sublocationId: s.id, score: 0 }));

  return sublocations.map(sub => {
    const typeId = sub.properties.sublocationTypeId as string;
    const typeNode = graph.getNode(typeId);

    // Read motivations from the sublocation type node
    const motivations = (typeNode?.properties.motivations ?? []) as ValuePair[];

    // Dot product: sum of profile values for each motivation
    let score = 0;
    for (const m of motivations) {
      score += profile[m] ?? 0;
    }

    // Normalize to [0, 1] range with a floor so even mismatched sublocations have a chance
    const normalized = Math.max(0.1, (score + motivations.length) / (2 * motivations.length || 1));

    return { sublocationId: sub.id, score: normalized };
  });
}

// ── Selection ───────────────────────────────────────────────

/**
 * Weighted random sublocation selection using seeded PRNG.
 *
 * Higher-scored sublocations are more likely to be chosen, but selection
 * is not deterministic for a given score distribution — only for a given seed.
 */
export function selectSublocation(
  scored: ScoredSublocation[],
  rng: SeededRng,
): string {
  if (scored.length === 0) throw new Error('selectSublocation called with empty list');
  if (scored.length === 1) return scored[0].sublocationId;

  const totalWeight = scored.reduce((sum, s) => sum + s.score, 0);
  const roll = rng() * totalWeight;

  let cumulative = 0;
  for (const s of scored) {
    cumulative += s.score;
    if (roll <= cumulative) return s.sublocationId;
  }

  // Fallback (should never reach here due to floating point)
  return scored[scored.length - 1].sublocationId;
}
```

**Note:** The implementing engineer should check the exact export of `createSeededRng` from `src/engine/prng.ts` and use the project's actual PRNG type name. Look for `SeededRng` or similar in the prng module and adjust the import.

**Step 4: Run test to verify it passes**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/sublocation.test.ts`
Expected: PASS — all tests pass

**Step 5: Type-check**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/engine/sublocation.ts src/engine/__tests__/sublocation.test.ts
git commit -m "feat(engine): implement sublocation scoring and weighted-random selection"
```

---

## Task 4: Integrate Sublocation Pipeline into Encounter Candidate Generation

**Files:**
- Modify: `src/engine/encounterCandidates.ts` (insert sublocation step)
- Modify: `src/engine/__tests__/encounterCandidates.test.ts` (add integration tests)
- Modify: `src/data/encounter-content.ts` (add `getEncountersBySublocationTypes` helper)

**Context:** The current pipeline is: get location → get subtype → get templates by location type → filter by threat → score. The new pipeline inserts sublocation selection between "get location" and "get templates": ensure sublocations → score → select → filter templates by sublocation type. Falls back to current behavior if no sublocations exist.

**Step 1: Add encounter content helper**

In `src/data/encounter-content.ts`, after `getEncountersByLocationType`:

```typescript
/**
 * Get encounter templates that match a sublocation's type.
 * Templates with `sublocationTypes` field are matched against the sublocation type ID.
 * Templates without `sublocationTypes` are included as fallback (matched against locationTypes).
 */
export function getEncountersBySublocationAndLocation(
  sublocationTypeId: string,
  locationType: string,
): EncounterTemplate[] {
  return ENCOUNTER_TEMPLATES.filter(t => {
    if (t.sublocationTypes && t.sublocationTypes.length > 0) {
      return t.sublocationTypes.includes(sublocationTypeId);
    }
    // Fallback: templates without sublocationTypes use locationTypes
    return t.locationTypes.includes(locationType);
  });
}
```

**Step 2: Write the failing integration test**

Add to `src/engine/__tests__/encounterCandidates.test.ts`:

```typescript
describe('generateEncounterCandidates with sublocations', () => {
  it('generates candidates scoped to selected sublocation when sublocations exist', () => {
    // Setup graph with location-type that has sublocation mappings
    // ... (build full graph with location type, sublocation types, contains edges,
    //      actor with axiological profile, encounter templates)
    // The test verifies that:
    // 1. ensureSublocations was called (sublocation nodes exist after call)
    // 2. Returned candidates come from the sublocation's encounter pool
    // 3. Each candidate has a sublocationId field set
  });

  it('falls back to flat behavior when location has no sublocation mappings', () => {
    // Setup graph with wilderness location (no sublocation types)
    // Verify candidates are generated as before, no sublocationId set
  });
});
```

**Note:** The implementing engineer should flesh out these tests based on the exact graph setup needed. Key assertions: candidates have `sublocationId` when sublocations exist, candidates don't when they don't.

**Step 3: Modify `generateEncounterCandidates`**

In `src/engine/encounterCandidates.ts`, modify the function to:
1. Call `ensureSublocations(graph, locationId)` first
2. If sublocations returned and non-empty: call `scoreSublocations` + `selectSublocation`
3. Get templates via `getEncountersBySublocationAndLocation(subTypeId, locationType)` for the selected sublocation
4. If no sublocations: proceed with current `getEncountersByLocationType(subtype)` logic unchanged
5. Add `sublocationId` to returned `ActionCandidate` objects when applicable

**Step 4: Run all encounter tests**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/encounterCandidates.test.ts`
Expected: PASS — existing tests still pass, new tests pass

**Step 5: Run full test suite**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npm test`
Expected: All ~2,389+ tests pass. No regressions.

**Step 6: Commit**

```bash
git add src/engine/encounterCandidates.ts src/engine/__tests__/encounterCandidates.test.ts src/data/encounter-content.ts
git commit -m "feat(engine): integrate sublocation selection into encounter candidate pipeline"
```

---

## Task 5: Implement Sublocation Dissolution

**Files:**
- Modify: `src/engine/sublocation.ts` (add `checkDissolutions`)
- Modify: `src/engine/__tests__/sublocation.test.ts` (add dissolution tests)

**Context:** Each tick, temporal and conditional sublocations are checked. Temporal sublocations with `encounter_completed` dissolve when no active encounters remain. `visited` dissolve after any agent visits. `tick_expiry` dissolve when `tick >= expiresAtTick`. On dissolution: active encounters get `status: 'abandoned'`, agents relocate to parent location, narrative event fires, node removed.

**Step 1: Write the failing tests**

```typescript
describe('checkDissolutions', () => {
  it('dissolves temporal sublocation on encounter_completed when no active encounters', () => {
    // Setup: sublocation with persistence.dissolvesOn: 'encounter_completed'
    // Agent at sublocation with completed encounter
    // Call checkDissolutions
    // Assert: sublocation node removed, agent relocated to parent, event returned
  });

  it('does not dissolve temporal sublocation if encounter still active', () => {
    // Setup: sublocation with agent mid-encounter
    // Assert: sublocation still exists after checkDissolutions
  });

  it('dissolves tick_expiry sublocation when tick >= expiresAtTick', () => {
    // Setup: sublocation with expiresAtTick: 20, current tick: 25
    // Assert: dissolved
  });

  it('leaves permanent sublocations untouched', () => {
    // Setup: permanent sublocation
    // Assert: still exists after checkDissolutions
  });

  it('relocates displaced agents to parent location', () => {
    // Setup: agent at sublocation that will dissolve
    // Assert: agent's located_at edge now points to parent location
  });
});
```

**Step 2: Implement `checkDissolutions`**

Add to `src/engine/sublocation.ts`:

```typescript
export interface DissolutionEvent {
  sublocationId: string;
  sublocationName: string;
  parentLocationId: string;
  displacedAgentIds: string[];
  abandonedEncounterIds: string[];
  reason: string;
}

export function checkDissolutions(
  graph: WorldGraph,
  encounterProgress: EncounterProgress[],
  tick: number,
): DissolutionEvent[] {
  // Implementation: iterate all sublocation instances, check persistence conditions,
  // dissolve matching ones, relocate agents, abandon encounters, return events
}
```

**Step 3: Run tests, verify pass**

**Step 4: Commit**

```bash
git add src/engine/sublocation.ts src/engine/__tests__/sublocation.test.ts
git commit -m "feat(engine): implement sublocation dissolution with agent relocation"
```

---

## Task 6: Create Divine Sublocation Action

**Files:**
- Modify: `src/engine/sublocation.ts` (add `createDivineSublocation`)
- Modify: `src/engine/__tests__/sublocation.test.ts`

**Context:** God action to spawn a themed sublocation at a location. Sets `divineOrigin` metadata, persistence (usually temporal), and adds graph node + edges.

**Step 1: Write tests**

```typescript
describe('createDivineSublocation', () => {
  it('creates a divine sublocation with origin metadata', () => {
    // Assert: node created with divineOrigin.creatorGodId, purpose, createdAtTick
    // Assert: persistence type matches input
    // Assert: contains edge from parent location
  });

  it('respects persistence type (temporal with encounter_completed)', () => {
    // Assert: persistence.dissolvesOn set correctly
  });
});
```

**Step 2: Implement**

```typescript
export function createDivineSublocation(
  graph: WorldGraph,
  params: {
    locationId: string;
    sublocationTypeId: string;
    godId: string;
    purpose: string;
    tick: number;
    persistence: SublocationPersistence;
    name?: string;
  },
): GraphNode {
  // Create node with divineOrigin metadata
  // Add contains edge
  // Return the created node
}
```

**Step 3: Run tests, type-check, commit**

```bash
git add src/engine/sublocation.ts src/engine/__tests__/sublocation.test.ts
git commit -m "feat(engine): implement divine sublocation creation god action"
```

---

## Task 7: Restructure LocationView to Agent-Centric Sublocation Cards

**Files:**
- Modify: `src/components/Game/LocationView.tsx` (restructure to sublocation cards)
- Modify: `src/index.css` (sublocation card styles — partially done, verify variables)

**Context:** The current LocationView shows agents (left) and encounters (right) in flat lists. The new layout groups everything by sublocation card. Active cards show agent rows with encounter progress (step dots). Empty sublocations collapse to muted rows. Divine sublocations get purple tint.

**Reference:** `Design/sublocation-wireframe.html` and `Design/style-tile.html` "Sublocation Cards" section.

**Step 1: Plan component structure**

```
LocationView
├─ LocationHeader (name, type, prose)
├─ SublocationCardList
│  ├─ SublocationCard (active: has agents)
│  │  ├─ CardHeader (name + persistence badge)
│  │  ├─ AgentRow[] (pip + name + encounter status + step dots)
│  │  └─ AvailableEncounterHint (muted "+ Encounter A, Encounter B")
│  └─ EmptySublocationRow[] (collapsed: name + badge only)
└─ NoSublocationsFlat (fallback: current flat layout for locations without sublocations)
```

**Step 2: Extract SublocationCard as a sub-component**

Either inline in LocationView.tsx or extract to `src/components/Game/SublocationCard.tsx`. Prefer inline first for simplicity, extract later if file grows beyond ~300 lines.

**Step 3: Implement the card rendering**

Key data flow:
1. `LocationView` receives `graph` prop
2. On mount/update: call `getSubLocations(graph, location.id)` from `viewLevel.ts`
3. For each sublocation: call `getActorsAtLocation(graph, sublocation.id)` to get agents
4. Cross-reference agents with `activeEncounters` prop to find their encounter progress
5. Sort: active sublocations first (by agent count desc), then empty

**Step 4: Implement step dots**

```tsx
function StepDots({ progress, template }: { progress: EncounterProgress; template: EncounterTemplate }) {
  return (
    <span className="step-dots">
      {template.steps.map((_, i) => (
        <span
          key={i}
          className={`step-dot ${
            i < progress.currentEncounterIndex ? 'done' :
            i === progress.currentEncounterIndex ? 'current' : 'pending'
          }`}
        />
      ))}
    </span>
  );
}
```

**Step 5: Implement persistence badge**

```tsx
function PersistenceBadge({ persistence }: { persistence: SublocationPersistence }) {
  const label = persistence.type;
  const isDivine = false; // set from divineOrigin prop
  return <span className={`persistence-badge ${label}`}>{label}</span>;
}
```

**Step 6: Implement divine card styling**

Cards with `divineOrigin` get className `sublocation-card divine` which applies the purple gradient from the CSS variables already in `index.css`.

**Step 7: Implement empty sublocation collapse**

Sublocations with zero agents render as a simple muted row: name + badge, no card chrome.

**Step 8: Verify visual output**

Run: `npx vite build` to ensure no compilation errors.
The user will need to run `npm run dev` on their machine to visually verify. Write a note in the commit about what to look for.

**Step 9: Commit**

```bash
git add src/components/Game/LocationView.tsx src/index.css
git commit -m "feat(ui): restructure LocationView to agent-centric sublocation cards

Visual reference: Design/sublocation-wireframe.html
Style reference: Design/style-tile.html → Sublocation Cards section

To verify: run npm run dev, navigate to any city location, confirm:
- Sublocation cards group agents + encounters
- Persistence badges (permanent/temporal/divine)
- Step dots show encounter progress
- Empty sublocations collapse to single row
- Divine sublocations have purple tint"
```

---

## Task 8: Add `sublocationTypes` to Existing Encounter Templates

**Files:**
- Modify: `src/data/encounter-content.ts` (add `sublocationTypes` field to ~10 templates)

**Context:** Add `sublocationTypes` to the existing encounter templates so they're properly routed to sublocations. This is a data task — each template gets a new optional array field mapping it to one or more sublocation types.

**Step 1: Map templates to sublocation types**

Based on the 7 sublocation types in the vault (temple-quarter, market-district, library, harbor, barracks, throne-room, dungeon) and the 10+ existing encounter templates:

| Template | sublocationTypes |
|----------|-----------------|
| The Deep Descent | `['sublocation-type.dungeon']` |
| Trial of Flame | `['sublocation-type.temple-quarter', 'sublocation-type.barracks']` |
| Healer's Oath | `['sublocation-type.temple-quarter']` |
| Diplomat's Maze | `['sublocation-type.throne-room']` |
| Starborn Vigil | `['sublocation-type.temple-quarter']` |
| Market Intrigue | `['sublocation-type.market-district']` |
| Relic Hunt | `['sublocation-type.dungeon', 'sublocation-type.library']` |
| Harvest Bounty | (no sublocationTypes — uses locationTypes fallback) |
| Bound Mastery | `['sublocation-type.library', 'sublocation-type.temple-quarter']` |
| War Trophy | `['sublocation-type.barracks']` |

**Step 2: Add the field to each template**

Add `sublocationTypes: [...]` after `locationTypes` in each template object. Templates without a clear sublocation mapping keep no `sublocationTypes` field (fallback behavior).

**Step 3: Run data tests**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npm test -- --grep "encounter"`
Expected: All encounter tests pass. Template structure tests may need updating if they assert exact field counts.

**Step 4: Commit**

```bash
git add src/data/encounter-content.ts
git commit -m "content: add sublocationTypes mappings to encounter templates"
```

---

## Task 9: Wire Sublocation Dissolution into Tick Loop

**Files:**
- Modify: the tick loop file (likely `src/engine/tick.ts` or `src/engine/gameLoop.ts` — engineer should locate)
- Add dissolution check call after encounter resolution phase

**Context:** `checkDissolutions` from Task 5 needs to run once per tick, after encounters are resolved but before the next selection round. The returned `DissolutionEvent[]` should be appended to the tick's event log for the narrative system.

**Step 1: Locate tick loop**

Search for `tick` function or `gameLoop` in `src/engine/`. The dissolution check goes after encounter advancement and before agent selection.

**Step 2: Add dissolution call**

```typescript
// After encounter resolution/advancement:
const dissolutions = checkDissolutions(state.graph, state.encounterProgress, state.tick);
for (const event of dissolutions) {
  // Append to event log / narrative events
  // Mark abandoned encounters in state.encounterProgress
}
```

**Step 3: Test with existing test suite**

Run: `npm test`
Expected: All tests pass. Dissolution has no effect on existing locations (no temporal sublocations in seed data).

**Step 4: Commit**

```bash
git add src/engine/tick.ts  # or wherever the tick loop lives
git commit -m "feat(engine): wire sublocation dissolution check into tick loop"
```

---

## Task 10: End-to-End Verification

**Files:**
- Create: `src/engine/__tests__/sublocation-integration.test.ts`

**Step 1: Write integration test**

```typescript
describe('sublocation system integration', () => {
  it('full pipeline: agent arrives at city → selects sublocation → gets encounter → resolves → UI data correct', () => {
    // 1. Build graph with city location + sublocation type mappings
    // 2. Add agent with axiological profile
    // 3. Call ensureSublocations → verify sublocation nodes created
    // 4. Call generateEncounterCandidates → verify candidates have sublocationId
    // 5. Simulate encounter initiation and one step resolution
    // 6. Call getSubLocations + getActorsAtLocation → verify UI data shape
  });

  it('fallback: wilderness location with no sublocation types → flat pipeline', () => {
    // Verify no sublocation nodes created, candidates have no sublocationId
  });

  it('divine sublocation lifecycle: create → agent encounters → dissolves', () => {
    // 1. Create divine sublocation
    // 2. Agent selects it (via scoring)
    // 3. Encounter completes
    // 4. checkDissolutions removes it
    // 5. Agent relocated to parent
  });
});
```

**Step 2: Run integration test**

Run: `cd /sessions/festive-gifted-keller/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/sublocation-integration.test.ts`
Expected: PASS

**Step 3: Run full suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Build check**

Run: `npx vite build`
Expected: Clean build

**Step 6: Final commit**

```bash
git add src/engine/__tests__/sublocation-integration.test.ts
git commit -m "test: add sublocation system integration tests"
```

---

## Task 11: Documentation

**Files:**
- Modify: `Docs/changelog.md`
- Modify: `Docs/project-status.md`
- Update Obsidian vault via MCP (if available)
- Update Notion backlog via MCP (if available)

**Use the `gamedocumenter` skill for this task.** Non-negotiable — same session.

**Changelog entries:**

```
| 2026-03-10 | src/types/sublocation.ts | Added sublocation types, persistence model, divine origin | Sublocation system implementation |
| 2026-03-10 | src/engine/sublocation.ts | Implemented ensureSublocations, scoring, selection, dissolution | Sublocation system implementation |
| 2026-03-10 | src/engine/encounterCandidates.ts | Integrated sublocation pipeline with fallback | Sublocation system implementation |
| 2026-03-10 | src/components/Game/LocationView.tsx | Restructured to agent-centric sublocation cards | Sublocation system implementation |
| 2026-03-10 | src/data/encounter-content.ts | Added sublocationTypes to encounter templates | Sublocation system implementation |
| 2026-03-10 | Design/style-tile.html | Added sublocation cards section, synced :root vars | Sublocation system implementation |
```
