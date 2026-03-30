# Phase 1: Core Logic & Graph Architecture — Implementation Plan

> **Status: ✅ COMPLETE** — Merged to `main` on 2026-03-04. 9 commits, 21 files, 2,274 lines added. 136 tests passing. Code-reviewed and approved.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the runtime simulation engine — the world graph, temporal controller, resolution system, agent action selection, view level manager, and trait system — so that a headless simulation can run: actors tick forward, select actions from their Maslow pipeline, resolve them via sigmoid/d100, mutate the graph, and accumulate traits.

**Architecture:** Everything is a graph node/edge. The `WorldGraph` is the central data structure. The `TemporalController` drives ticks. On each tick, actors with completed actions resolve via the `ResolutionEngine`, then the `AgentActionSelection` pipeline picks their next action. Traits propagate via graph edges. View levels are a query layer over the graph, not a separate data structure.

**Tech Stack:** TypeScript, Vitest for tests, no external graph library (keep it simple — adjacency maps). React + Tailwind for any UI (later phases). All engine code is pure functions or classes with no React dependency.

**Existing code to build on:**
- `src/types/index.ts` — SphereName, CosmologyProfile, HexCoord, TerrainType, HexTile
- `src/types/taxonomy.ts` — TaxonomyNode, TaxonomyEdge, TaxonomyGraph (cosmology-only graph; we'll build the runtime WorldGraph separately)
- `src/engine/cosmology.ts` — sphere utilities, presets
- `src/engine/terrain.ts` — biome classification
- `src/engine/taxonomy.ts` — cosmology graph loader/queries

**Dependency order (tasks build on each other):**
```
Task 1: WorldGraph Runtime (foundation for everything)
   ↓
Task 2: Trait System Runtime (traits are graph nodes/edges; needs WorldGraph)
   ↓
Task 3: Domain Capability Computation (walks traits on graph; needs Traits + WorldGraph)
   ↓
Task 4: Resolution System (uses domain capability; needs Task 3)
   ↓
Task 5: Temporal Controller (drives ticks, action progress; needs Task 4 for resolution)
   ↓
Task 6: Agent Action Selection (Maslow pipeline; needs all above)
   ↓
Task 7: View Level Manager (query layer; needs WorldGraph)
   ↓
Task 8: Integration test — headless simulation loop
```

**Conventions:**
- Engine code in `src/engine/` — pure TypeScript, no React imports
- Types in `src/types/` — shared type definitions
- Tests colocated as `src/engine/__tests__/<module>.test.ts`
- All IDs are `string` (prefixed: `actor.`, `trait.`, `loc.`, `artifact.`, etc.)
- Use `Map<string, T>` for O(1) lookups, not arrays

---

## Task 1: World Graph Runtime

The core data structure. A typed property graph with O(1) node/edge access, typed edges, and neighborhood queries. This is NOT the cosmology taxonomy graph — it's the runtime simulation graph where actors, locations, traits, artifacts, and relationships live.

**Files:**
- Create: `src/types/graph.ts`
- Create: `src/engine/graph.ts`
- Create: `src/engine/__tests__/graph.test.ts`

### Step 1: Write the type definitions

Create `src/types/graph.ts`:

```typescript
/**
 * World Graph type definitions.
 *
 * The world graph is the central data structure. All entities are nodes,
 * all relationships are typed directed edges with properties.
 */

/** Every node in the world graph has these fields */
export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  properties: Record<string, unknown>;
}

/** Typed node categories */
export type NodeType =
  | 'actor'           // individuals, groups, factions, cultures, gods
  | 'location'        // hexes, regions, sub-locations
  | 'trait'           // trait definitions (category: innate/mastery/scar/etc.)
  | 'artifact'        // common artifacts
  | 'artifact_legendary' // legendary artifacts (have own trait graph)
  | 'resource'        // steady or consumable resource nodes
  | 'action_template' // CRUD action definitions
  | 'event'           // resolved action records
  | 'cosmology';      // sphere/foundation nodes (imported from taxonomy)

/** Actor subtypes stored in properties.actorType */
export type ActorType = 'god' | 'ascendant' | 'faction' | 'culture' | 'group' | 'individual';

/** Every edge in the world graph */
export interface GraphEdge {
  id: string;
  source: string;     // source node ID
  target: string;     // target node ID
  type: EdgeType;
  properties: Record<string, unknown>;
}

/** Typed edge categories */
export type EdgeType =
  // Structural
  | 'contains'        // region contains location, location contains sub-location
  | 'adjacent'        // hex adjacency, region adjacency
  // Trait
  | 'has_trait'        // actor/location has trait (with level, tick, decay, etc.)
  // Possession
  | 'possesses'        // actor possesses common artifact
  | 'bonded_to'        // actor bonded to legendary artifact
  | 'controls'         // faction/actor controls resource
  // Social
  | 'relates_to'       // inter-actor relationship (sentiment, strength, basis)
  | 'member_of'        // individual is member of group/faction
  | 'worships'         // actor worships god/ascendant
  // Enchantment
  | 'enchanted'        // caster → target enchantment
  | 'warded'           // ritual site → location ward
  | 'cursed'           // source → target curse
  | 'blessed'          // source → target blessing
  // Location
  | 'located_at'       // actor is at location
  | 'avatar_of'        // avatar ↔ ascendant link
  // Action
  | 'performing'       // actor → action_template (in-progress action)
  // Cosmology
  | 'aligned_with';    // actor/location → sphere alignment

/** Result type for graph mutations */
export interface GraphMutation {
  type: 'add_node' | 'remove_node' | 'update_node' | 'add_edge' | 'remove_edge' | 'update_edge';
  nodeId?: string;
  edgeId?: string;
  data?: Partial<GraphNode> | Partial<GraphEdge>;
}
```

### Step 2: Write failing tests for WorldGraph core operations

Create `src/engine/__tests__/graph.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode, GraphEdge } from '../../types/graph';

describe('WorldGraph', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  describe('node operations', () => {
    it('adds and retrieves a node by ID', () => {
      const node: GraphNode = {
        id: 'actor.thorin',
        type: 'actor',
        name: 'Thorin',
        properties: { actorType: 'individual' },
      };
      graph.addNode(node);
      expect(graph.getNode('actor.thorin')).toEqual(node);
    });

    it('returns undefined for missing node', () => {
      expect(graph.getNode('nonexistent')).toBeUndefined();
    });

    it('removes a node and its connected edges', () => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: {} });
      graph.addNode({ id: 'b', type: 'actor', name: 'B', properties: {} });
      graph.addEdge({
        id: 'e1', source: 'a', target: 'b',
        type: 'relates_to', properties: {},
      });
      graph.removeNode('a');
      expect(graph.getNode('a')).toBeUndefined();
      expect(graph.getEdge('e1')).toBeUndefined();
    });

    it('updates node properties immutably', () => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: { hp: 10 } });
      graph.updateNode('a', { properties: { hp: 5 } });
      expect(graph.getNode('a')!.properties.hp).toBe(5);
    });

    it('queries nodes by type', () => {
      graph.addNode({ id: 'a1', type: 'actor', name: 'A1', properties: {} });
      graph.addNode({ id: 'a2', type: 'actor', name: 'A2', properties: {} });
      graph.addNode({ id: 'loc1', type: 'location', name: 'L1', properties: {} });
      expect(graph.getNodesByType('actor')).toHaveLength(2);
      expect(graph.getNodesByType('location')).toHaveLength(1);
    });

    it('throws on duplicate node ID', () => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: {} });
      expect(() =>
        graph.addNode({ id: 'a', type: 'actor', name: 'A2', properties: {} })
      ).toThrow();
    });
  });

  describe('edge operations', () => {
    beforeEach(() => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: {} });
      graph.addNode({ id: 'b', type: 'actor', name: 'B', properties: {} });
    });

    it('adds and retrieves an edge by ID', () => {
      const edge: GraphEdge = {
        id: 'e1', source: 'a', target: 'b',
        type: 'relates_to', properties: { sentiment: 'feared' },
      };
      graph.addEdge(edge);
      expect(graph.getEdge('e1')).toEqual(edge);
    });

    it('returns undefined for missing edge', () => {
      expect(graph.getEdge('nonexistent')).toBeUndefined();
    });

    it('removes an edge', () => {
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      graph.removeEdge('e1');
      expect(graph.getEdge('e1')).toBeUndefined();
    });

    it('queries outgoing edges', () => {
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      expect(graph.getOutgoingEdges('a')).toHaveLength(1);
      expect(graph.getOutgoingEdges('b')).toHaveLength(0);
    });

    it('queries incoming edges', () => {
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      expect(graph.getIncomingEdges('b')).toHaveLength(1);
      expect(graph.getIncomingEdges('a')).toHaveLength(0);
    });

    it('queries edges by type', () => {
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      graph.addEdge({ id: 'e2', source: 'a', target: 'b', type: 'has_trait', properties: {} });
      expect(graph.getEdgesByType('relates_to')).toHaveLength(1);
    });

    it('throws when adding edge with missing source/target node', () => {
      expect(() =>
        graph.addEdge({ id: 'e1', source: 'a', target: 'missing', type: 'relates_to', properties: {} })
      ).toThrow();
    });
  });

  describe('neighborhood queries', () => {
    beforeEach(() => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: {} });
      graph.addNode({ id: 'b', type: 'actor', name: 'B', properties: {} });
      graph.addNode({ id: 'c', type: 'actor', name: 'C', properties: {} });
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      graph.addEdge({ id: 'e2', source: 'a', target: 'c', type: 'member_of', properties: {} });
    });

    it('gets all edges for a node (incoming + outgoing)', () => {
      expect(graph.getAllEdgesForNode('a')).toHaveLength(2);
    });

    it('gets neighbors (connected node IDs)', () => {
      const neighbors = graph.getNeighborIds('a');
      expect(neighbors).toContain('b');
      expect(neighbors).toContain('c');
      expect(neighbors).toHaveLength(2);
    });

    it('gets outgoing neighbors filtered by edge type', () => {
      const members = graph.getOutgoingEdges('a', 'member_of');
      expect(members).toHaveLength(1);
      expect(members[0].target).toBe('c');
    });
  });

  describe('batch mutations', () => {
    it('applies a list of mutations atomically', () => {
      const mutations = [
        { type: 'add_node' as const, data: { id: 'x', type: 'actor' as const, name: 'X', properties: {} } },
        { type: 'add_node' as const, data: { id: 'y', type: 'actor' as const, name: 'Y', properties: {} } },
      ];
      graph.applyMutations(mutations);
      expect(graph.getNode('x')).toBeDefined();
      expect(graph.getNode('y')).toBeDefined();
    });
  });

  describe('stats', () => {
    it('reports node and edge counts', () => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: {} });
      graph.addNode({ id: 'b', type: 'actor', name: 'B', properties: {} });
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      const stats = graph.getStats();
      expect(stats.nodeCount).toBe(2);
      expect(stats.edgeCount).toBe(1);
    });
  });
});
```

### Step 3: Run tests to verify they fail

Run: `cd /path/to/project && npx vitest run src/engine/__tests__/graph.test.ts`
Expected: FAIL — `WorldGraph` module not found

### Step 4: Implement WorldGraph

Create `src/engine/graph.ts`:

```typescript
/**
 * WorldGraph — the runtime simulation graph.
 *
 * Typed property graph with O(1) node/edge access via Maps,
 * and adjacency index for fast neighborhood queries.
 */
import type { GraphNode, GraphEdge, GraphMutation, NodeType, EdgeType } from '../types/graph';

export class WorldGraph {
  private nodes = new Map<string, GraphNode>();
  private edges = new Map<string, GraphEdge>();

  // Adjacency indices for O(1) neighborhood queries
  private outgoing = new Map<string, Set<string>>(); // nodeId → Set<edgeId>
  private incoming = new Map<string, Set<string>>(); // nodeId → Set<edgeId>

  // --- Node operations ---

  addNode(node: GraphNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Duplicate node ID: ${node.id}`);
    }
    this.nodes.set(node.id, { ...node, properties: { ...node.properties } });
    this.outgoing.set(node.id, new Set());
    this.incoming.set(node.id, new Set());
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  removeNode(id: string): void {
    // Remove all connected edges first
    const allEdges = this.getAllEdgesForNode(id);
    for (const edge of allEdges) {
      this.removeEdge(edge.id);
    }
    this.nodes.delete(id);
    this.outgoing.delete(id);
    this.incoming.delete(id);
  }

  updateNode(id: string, updates: Partial<GraphNode>): void {
    const existing = this.nodes.get(id);
    if (!existing) throw new Error(`Node not found: ${id}`);
    this.nodes.set(id, {
      ...existing,
      ...updates,
      id: existing.id, // ID is immutable
      properties: updates.properties
        ? { ...existing.properties, ...updates.properties }
        : existing.properties,
    });
  }

  getNodesByType(type: NodeType): GraphNode[] {
    const result: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === type) result.push(node);
    }
    return result;
  }

  // --- Edge operations ---

  addEdge(edge: GraphEdge): void {
    if (this.edges.has(edge.id)) {
      throw new Error(`Duplicate edge ID: ${edge.id}`);
    }
    if (!this.nodes.has(edge.source)) {
      throw new Error(`Source node not found: ${edge.source}`);
    }
    if (!this.nodes.has(edge.target)) {
      throw new Error(`Target node not found: ${edge.target}`);
    }
    this.edges.set(edge.id, { ...edge, properties: { ...edge.properties } });
    this.outgoing.get(edge.source)!.add(edge.id);
    this.incoming.get(edge.target)!.add(edge.id);
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  removeEdge(id: string): void {
    const edge = this.edges.get(id);
    if (!edge) return;
    this.outgoing.get(edge.source)?.delete(id);
    this.incoming.get(edge.target)?.delete(id);
    this.edges.delete(id);
  }

  updateEdge(id: string, updates: Partial<GraphEdge>): void {
    const existing = this.edges.get(id);
    if (!existing) throw new Error(`Edge not found: ${id}`);
    this.edges.set(id, {
      ...existing,
      ...updates,
      id: existing.id,
      properties: updates.properties
        ? { ...existing.properties, ...updates.properties }
        : existing.properties,
    });
  }

  getOutgoingEdges(nodeId: string, edgeType?: EdgeType): GraphEdge[] {
    const edgeIds = this.outgoing.get(nodeId);
    if (!edgeIds) return [];
    const result: GraphEdge[] = [];
    for (const eid of edgeIds) {
      const edge = this.edges.get(eid)!;
      if (!edgeType || edge.type === edgeType) result.push(edge);
    }
    return result;
  }

  getIncomingEdges(nodeId: string, edgeType?: EdgeType): GraphEdge[] {
    const edgeIds = this.incoming.get(nodeId);
    if (!edgeIds) return [];
    const result: GraphEdge[] = [];
    for (const eid of edgeIds) {
      const edge = this.edges.get(eid)!;
      if (!edgeType || edge.type === edgeType) result.push(edge);
    }
    return result;
  }

  getAllEdgesForNode(nodeId: string): GraphEdge[] {
    return [
      ...this.getOutgoingEdges(nodeId),
      ...this.getIncomingEdges(nodeId),
    ];
  }

  getEdgesByType(type: EdgeType): GraphEdge[] {
    const result: GraphEdge[] = [];
    for (const edge of this.edges.values()) {
      if (edge.type === type) result.push(edge);
    }
    return result;
  }

  getNeighborIds(nodeId: string): string[] {
    const neighbors = new Set<string>();
    for (const edge of this.getOutgoingEdges(nodeId)) {
      neighbors.add(edge.target);
    }
    for (const edge of this.getIncomingEdges(nodeId)) {
      neighbors.add(edge.source);
    }
    return [...neighbors];
  }

  // --- Batch mutations ---

  applyMutations(mutations: GraphMutation[]): void {
    for (const mut of mutations) {
      switch (mut.type) {
        case 'add_node':
          this.addNode(mut.data as GraphNode);
          break;
        case 'remove_node':
          this.removeNode(mut.nodeId!);
          break;
        case 'update_node':
          this.updateNode(mut.nodeId!, mut.data as Partial<GraphNode>);
          break;
        case 'add_edge':
          this.addEdge(mut.data as GraphEdge);
          break;
        case 'remove_edge':
          this.removeEdge(mut.edgeId!);
          break;
        case 'update_edge':
          this.updateEdge(mut.edgeId!, mut.data as Partial<GraphEdge>);
          break;
      }
    }
  }

  // --- Stats ---

  getStats(): { nodeCount: number; edgeCount: number } {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
    };
  }
}
```

### Step 5: Run tests to verify they pass

Run: `cd /path/to/project && npx vitest run src/engine/__tests__/graph.test.ts`
Expected: ALL PASS

### Step 6: Commit

```bash
git add src/types/graph.ts src/engine/graph.ts src/engine/__tests__/graph.test.ts
git commit -m "feat: add WorldGraph runtime with typed property graph and adjacency indices"
```

---

## Task 2: Trait System Runtime

Trait definitions are nodes in the graph. Trait assignments are `has_trait` edges. This task implements: the trait type definitions, the assignment/removal logic, the decay engine, and the stacking rules.

**Depends on:** Task 1 (WorldGraph)

**Files:**
- Create: `src/types/traits.ts`
- Create: `src/engine/traits.ts`
- Create: `src/engine/__tests__/traits.test.ts`

**Reference:** `Docs/plans/2026-03-03-trait-system-design.md` (Section 2), `Docs/plans/2026-03-04-high-level-discovery-pass.md` (Section 7)

### Step 1: Write trait type definitions

Create `src/types/traits.ts`:

```typescript
/**
 * Trait System type definitions.
 *
 * Traits are graph-native: definitions are nodes (type: 'trait'),
 * assignments are 'has_trait' edges with level/decay/visibility properties.
 */

export type TraitCategory = 'innate' | 'mastery' | 'reputation' | 'scar' | 'condition' | 'destiny';

export type TraitVisibility = 'public' | 'discoverable' | 'divine_only';

/** The Nine Reaches — action domains */
export type ReachDomain =
  | 'iron' | 'gold' | 'shadow' | 'veil' | 'heart'
  | 'eye' | 'stone' | 'star' | 'flesh';

export const REACH_DOMAINS: ReachDomain[] = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh',
];

/** Domain contributions: how much a trait contributes to each Reach */
export type DomainContributions = Partial<Record<ReachDomain, number>>;

/** Properties stored on a trait definition node (node.properties) */
export interface TraitDefinitionProperties {
  subcategory: TraitCategory;
  description: string;
  importance: number;            // 0.0–1.0
  maxLevel: number;              // 1 for binary, 3 for scaled
  visibility: TraitVisibility;
  domainContributions: DomainContributions; // per-level contributions
  decayPeriod?: number;          // ticks between decay checks (mastery only)
  tags: string[];
  flavorText: string;
}

/** Properties stored on a has_trait edge (edge.properties) */
export interface TraitAssignmentProperties {
  level: number;
  acquiredTick: number;
  lastReinforcedTick: number;
  source: string;                // what caused acquisition
  visibility: TraitVisibility;
}
```

### Step 2: Write failing tests for trait operations

Create `src/engine/__tests__/traits.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  assignTrait,
  removeTrait,
  getTraitsForNode,
  reinforceTrait,
  processTraitDecay,
  getEffectiveDomainContributions,
} from '../traits';
import type { TraitDefinitionProperties, TraitAssignmentProperties } from '../../types/traits';

function makeTraitNode(id: string, overrides: Partial<TraitDefinitionProperties> = {}) {
  return {
    id,
    type: 'trait' as const,
    name: id,
    properties: {
      subcategory: 'mastery',
      description: 'test trait',
      importance: 0.5,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { iron: 2, flesh: 1 },
      decayPeriod: 90,
      tags: [],
      flavorText: 'test',
      ...overrides,
    } satisfies TraitDefinitionProperties,
  };
}

describe('Trait System', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({ id: 'actor.thorin', type: 'actor', name: 'Thorin', properties: { actorType: 'individual' } });
    graph.addNode(makeTraitNode('trait.battle_hardened'));
    graph.addNode(makeTraitNode('trait.lorekeeper', {
      subcategory: 'mastery',
      domainContributions: { eye: 2, veil: 1 },
      decayPeriod: 120,
    }));
    graph.addNode(makeTraitNode('trait.dragon_slayer', {
      subcategory: 'scar',
      maxLevel: 1,
      domainContributions: { iron: 2, star: 1 },
    }));
  });

  describe('assignTrait', () => {
    it('creates a has_trait edge with correct properties', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect(traits).toHaveLength(1);
      expect(traits[0].target).toBe('trait.battle_hardened');
      const props = traits[0].properties as TraitAssignmentProperties;
      expect(props.level).toBe(1);
      expect(props.acquiredTick).toBe(10);
    });

    it('does not create duplicate trait assignment', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 20, source: 'combat' });
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect(traits).toHaveLength(1);
    });
  });

  describe('reinforceTrait', () => {
    it('increases level up to maxLevel', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 50);
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect((traits[0].properties as TraitAssignmentProperties).level).toBe(2);
    });

    it('does not exceed maxLevel', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 50);
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 60);
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 70); // should not exceed 3
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect((traits[0].properties as TraitAssignmentProperties).level).toBe(3);
    });
  });

  describe('processTraitDecay', () => {
    it('decays mastery traits that have not been reinforced', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 10); // level 2
      // Decay at tick 110 (100 ticks later, decayPeriod = 90)
      processTraitDecay(graph, 'actor.thorin', 110);
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect((traits[0].properties as TraitAssignmentProperties).level).toBe(1);
    });

    it('removes trait when level decays to 0', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      processTraitDecay(graph, 'actor.thorin', 110);
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect(traits).toHaveLength(0);
    });

    it('does not decay scar traits', () => {
      assignTrait(graph, 'actor.thorin', 'trait.dragon_slayer', { tick: 10, source: 'event' });
      processTraitDecay(graph, 'actor.thorin', 500);
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect(traits).toHaveLength(1);
    });
  });

  describe('getEffectiveDomainContributions', () => {
    it('scales contributions by trait level', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 20); // level 2
      const contributions = getEffectiveDomainContributions(graph, 'actor.thorin');
      expect(contributions.iron).toBe(4); // 2 per level × 2
      expect(contributions.flesh).toBe(2); // 1 per level × 2
    });

    it('stacks contributions from multiple traits', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      assignTrait(graph, 'actor.thorin', 'trait.dragon_slayer', { tick: 15, source: 'event' });
      const contributions = getEffectiveDomainContributions(graph, 'actor.thorin');
      expect(contributions.iron).toBe(4); // 2 + 2
      expect(contributions.flesh).toBe(1); // 1 + 0
      expect(contributions.star).toBe(1); // 0 + 1
    });
  });

  describe('removeTrait', () => {
    it('removes the has_trait edge', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      removeTrait(graph, 'actor.thorin', 'trait.battle_hardened');
      expect(getTraitsForNode(graph, 'actor.thorin')).toHaveLength(0);
    });
  });
});
```

### Step 3: Run tests to verify they fail

Run: `npx vitest run src/engine/__tests__/traits.test.ts`
Expected: FAIL — module not found

### Step 4: Implement trait operations

Create `src/engine/traits.ts` — implement the functions to make all tests pass. Key logic:
- `assignTrait` — creates `has_trait` edge if not already present
- `reinforceTrait` — increments level, updates lastReinforcedTick
- `processTraitDecay` — for each mastery trait, check if `currentTick - lastReinforcedTick > decayPeriod`, reduce level, remove if 0
- `getEffectiveDomainContributions` — walk all `has_trait` edges, multiply domainContributions by level, sum
- `removeTrait` — delete the `has_trait` edge

### Step 5: Run tests to verify they pass

Run: `npx vitest run src/engine/__tests__/traits.test.ts`
Expected: ALL PASS

### Step 6: Commit

```bash
git add src/types/traits.ts src/engine/traits.ts src/engine/__tests__/traits.test.ts
git commit -m "feat: add trait system runtime with assignment, decay, and domain contributions"
```

---

## Task 3: Domain Capability Computation

The explainable sigmoid model. Walks the actor's graph neighborhood (traits, artifacts, enchantments, resources) to compute a raw score per Reach domain, applies the sigmoid curve, and maps to the 10-tier narrative lexicon.

**Depends on:** Task 1 (WorldGraph), Task 2 (Traits)

**Files:**
- Create: `src/engine/domainCapability.ts`
- Create: `src/engine/__tests__/domainCapability.test.ts`
- Update: `src/types/traits.ts` (add the 10-tier lexicon constants)

**Reference:** `Docs/plans/2026-03-04-disc13-domain-capability-and-resolution-design.md` (Sections 3, 4, 5)

### Step 1: Add narrative lexicon constants to types

Add to `src/types/traits.ts`:

```typescript
/** 10-tier narrative lexicon per domain */
export const NARRATIVE_LEXICON: Record<ReachDomain, string[]> = {
  iron:   ['Frail', 'Soft', 'Sturdy', 'Trained', 'Steeled', 'Tempered', 'Fearsome', 'Dread', 'Ruinous', 'Cataclysmic'],
  gold:   ['Destitute', 'Poor', 'Thrifty', 'Comfortable', 'Prosperous', 'Wealthy', 'Affluent', 'Magnate', 'Sovereign', 'Imperial'],
  shadow: ['Exposed', 'Clumsy', 'Cautious', 'Sly', 'Veiled', 'Shadowed', 'Masked', 'Spectral', 'Invisible', 'Void'],
  veil:   ['Mundane', 'Dull', 'Touched', 'Sensitive', 'Gifted', 'Adept', 'Arcane', 'Eldritch', 'Transcendent', 'Mythic'],
  heart:  ['Hollow', 'Cold', 'Warm', 'Kind', 'Devoted', 'Inspiring', 'Radiant', 'Luminous', 'Incandescent', 'Absolute'],
  eye:    ['Blind', 'Dim', 'Keen', 'Alert', 'Perceptive', 'Watchful', 'Prescient', 'Oracular', 'Omniscient', 'All-Seeing'],
  stone:  ['Rootless', 'Loose', 'Grounded', 'Settled', 'Rooted', 'Entrenched', 'Enduring', 'Immovable', 'Eternal', 'Primordial'],
  star:   ['Godless', 'Doubting', 'Pious', 'Faithful', 'Devoted', 'Blessed', 'Anointed', 'Exalted', 'Sacred', 'Divine'],
  flesh:  ['Frail', 'Weak', 'Hardy', 'Tough', 'Vigorous', 'Robust', 'Mighty', 'Titanic', 'Undying', 'Deathless'],
};
```

### Step 2: Write failing tests

Create `src/engine/__tests__/domainCapability.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { assignTrait, reinforceTrait } from '../traits';
import {
  computeRawScore,
  computeCapability,
  computeTier,
  getNarrativeLabel,
  computeFullProfile,
  getTopContributors,
} from '../domainCapability';

describe('Domain Capability', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    // Actor
    graph.addNode({ id: 'actor.thorin', type: 'actor', name: 'Thorin', properties: { actorType: 'individual' } });

    // Origin trait: Mountainborn (Iron +3, Gold +3, Stone +4, Star +2, Flesh +2, Heart +1, Eye +1)
    graph.addNode({
      id: 'trait.origin.mountainborn', type: 'trait', name: 'Mountainborn',
      properties: {
        subcategory: 'innate', maxLevel: 1, importance: 1.0, visibility: 'public',
        domainContributions: { iron: 3, gold: 3, stone: 4, star: 2, flesh: 2, heart: 1, eye: 1 },
        tags: [], flavorText: 'Born of the mountain.',
      },
    });
    assignTrait(graph, 'actor.thorin', 'trait.origin.mountainborn', { tick: 0, source: 'origin' });

    // Mastery trait: Battle-Hardened (Iron +2, Flesh +1 per level)
    graph.addNode({
      id: 'trait.mastery.battle_hardened', type: 'trait', name: 'Battle-Hardened',
      properties: {
        subcategory: 'mastery', maxLevel: 3, importance: 0.7, visibility: 'public',
        domainContributions: { iron: 2, flesh: 1 },
        decayPeriod: 90, tags: [], flavorText: 'Forged in battle.',
      },
    });
  });

  describe('computeRawScore', () => {
    it('sums trait contributions for a domain', () => {
      // Mountainborn contributes Iron +3
      const raw = computeRawScore(graph, 'actor.thorin', 'iron');
      expect(raw).toBe(3);
    });

    it('scales mastery trait contributions by level', () => {
      assignTrait(graph, 'actor.thorin', 'trait.mastery.battle_hardened', { tick: 10, source: 'combat' });
      reinforceTrait(graph, 'actor.thorin', 'trait.mastery.battle_hardened', 20);
      // Mountainborn Iron 3 + Battle-Hardened level 2 Iron 4 = 7
      const raw = computeRawScore(graph, 'actor.thorin', 'iron');
      expect(raw).toBe(7);
    });

    it('includes artifact contributions', () => {
      // Common artifact
      graph.addNode({
        id: 'artifact.war_axe', type: 'artifact', name: 'Fine War-Axe',
        properties: { domainContributions: { iron: 1 } },
      });
      graph.addEdge({
        id: 'e.possesses.axe', source: 'actor.thorin', target: 'artifact.war_axe',
        type: 'possesses', properties: {},
      });
      const raw = computeRawScore(graph, 'actor.thorin', 'iron');
      expect(raw).toBe(4); // 3 origin + 1 artifact
    });
  });

  describe('computeCapability', () => {
    it('returns a value between 0 and 1', () => {
      const cap = computeCapability(graph, 'actor.thorin', 'iron');
      expect(cap).toBeGreaterThan(0);
      expect(cap).toBeLessThan(1);
    });

    it('is higher for higher raw scores', () => {
      const baseCap = computeCapability(graph, 'actor.thorin', 'iron');
      assignTrait(graph, 'actor.thorin', 'trait.mastery.battle_hardened', { tick: 10, source: 'combat' });
      const boostedCap = computeCapability(graph, 'actor.thorin', 'iron');
      expect(boostedCap).toBeGreaterThan(baseCap);
    });
  });

  describe('computeTier', () => {
    it('returns a tier 1-10 from capability 0-1', () => {
      const tier = computeTier(0.55);
      expect(tier).toBeGreaterThanOrEqual(1);
      expect(tier).toBeLessThanOrEqual(10);
      expect(tier).toBe(6); // 0.55 → range 0.5–0.6 → tier 6
    });

    it('floor is tier 1', () => {
      expect(computeTier(0.0)).toBe(1);
    });

    it('ceiling is tier 10', () => {
      expect(computeTier(1.0)).toBe(10);
    });
  });

  describe('getNarrativeLabel', () => {
    it('returns domain-specific label for tier', () => {
      expect(getNarrativeLabel('iron', 5)).toBe('Steeled');
      expect(getNarrativeLabel('gold', 3)).toBe('Thrifty');
      expect(getNarrativeLabel('veil', 10)).toBe('Mythic');
    });
  });

  describe('computeFullProfile', () => {
    it('returns a profile for all 9 domains', () => {
      const profile = computeFullProfile(graph, 'actor.thorin');
      expect(Object.keys(profile)).toHaveLength(9);
      expect(profile.iron.rawScore).toBe(3);
      expect(profile.stone.rawScore).toBe(4);
    });
  });

  describe('getTopContributors', () => {
    it('returns the top N contributing factors sorted by magnitude', () => {
      assignTrait(graph, 'actor.thorin', 'trait.mastery.battle_hardened', { tick: 10, source: 'combat' });
      const top = getTopContributors(graph, 'actor.thorin', 'iron', 3);
      expect(top.length).toBeLessThanOrEqual(3);
      expect(top[0].contribution).toBeGreaterThanOrEqual(top[1]?.contribution ?? 0);
    });
  });
});
```

### Step 3: Run tests to verify they fail

Run: `npx vitest run src/engine/__tests__/domainCapability.test.ts`
Expected: FAIL

### Step 4: Implement domain capability computation

Create `src/engine/domainCapability.ts`. Key logic:
- `computeRawScore(graph, nodeId, domain)` — walk `has_trait` edges → sum domain contributions × level; walk `possesses`/`bonded_to` edges → sum artifact contributions; walk `controls` edges → sum resource contributions
- `computeCapability(graph, nodeId, domain)` — `sigmoid(rawScore, midpoint=10, k=0.4)` (tuned per the design doc)
- `computeTier(capability)` — `Math.min(10, Math.max(1, Math.ceil(capability * 10)))`
- `getNarrativeLabel(domain, tier)` — lookup in `NARRATIVE_LEXICON`
- `computeFullProfile(graph, nodeId)` — all 9 domains
- `getTopContributors(graph, nodeId, domain, n)` — return top N contributing sources with their names and contributions

### Step 5: Run tests to verify they pass

Run: `npx vitest run src/engine/__tests__/domainCapability.test.ts`
Expected: ALL PASS

### Step 6: Commit

```bash
git add src/engine/domainCapability.ts src/engine/__tests__/domainCapability.test.ts src/types/traits.ts
git commit -m "feat: add domain capability computation with sigmoid curve and narrative lexicon"
```

---

## Task 4: Resolution System

The unified resolution engine: compute probability from domain capability + sphere factor - difficulty + modifiers, clamp to [0.05, 0.95], roll d100, determine outcome (critical success / success / failure / critical failure), and produce structured results with narrative attribution.

**Depends on:** Task 3 (Domain Capability)

**Files:**
- Create: `src/types/resolution.ts`
- Create: `src/engine/resolution.ts`
- Create: `src/engine/__tests__/resolution.test.ts`

**Reference:** `Docs/plans/2026-03-04-disc13-domain-capability-and-resolution-design.md` (Section 7)

### Step 1: Write resolution type definitions

Create `src/types/resolution.ts`:

```typescript
import type { ReachDomain } from './traits';

export type ForecastTier = 'doomed' | 'perilous' | 'uncertain' | 'favorable' | 'fated';

export type OutcomeType = 'critical_success' | 'success' | 'failure' | 'critical_failure';

export interface ResolutionInput {
  actorId: string;
  domain: ReachDomain;
  difficulty: number;          // 0.0–1.0
  sphereFactor: number;        // 0.0–0.2
  actionModifiers: number;     // capped at ±0.20
  influenceNudge?: number;     // ±0.05 to ±0.20 from player
}

export interface FateForecast {
  probability: number;         // 0.05–0.95
  forecastTier: ForecastTier;
  topContributors: Array<{ name: string; contribution: number }>;
}

export interface ResolutionResult {
  outcome: OutcomeType;
  roll: number;                // 1–100
  probability: number;         // what was needed
  margin: number;              // how close (roll - threshold)
  marginalFactor?: string;     // narrative attribution for close outcomes
  forecast: FateForecast;
}

/** For contested actions: two independent rolls */
export interface ContestedResolutionResult {
  attacker: ResolutionResult;
  defender: ResolutionResult;
  contestOutcome: 'attacker_wins' | 'defender_wins' | 'stalemate' | 'mutual_failure';
}
```

### Step 2: Write failing tests

Create `src/engine/__tests__/resolution.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  computeProbability,
  classifyForecast,
  resolveAction,
  resolveContestedAction,
} from '../resolution';
import type { ResolutionInput } from '../../types/resolution';

describe('Resolution System', () => {
  describe('computeProbability', () => {
    it('clamps to [0.05, 0.95]', () => {
      expect(computeProbability(1.0, 0.2, 0.0, 0.2)).toBeLessThanOrEqual(0.95);
      expect(computeProbability(0.0, 0.0, 1.0, -0.2)).toBeGreaterThanOrEqual(0.05);
    });

    it('higher capability means higher probability', () => {
      const pLow = computeProbability(0.3, 0.0, 0.5, 0.0);
      const pHigh = computeProbability(0.7, 0.0, 0.5, 0.0);
      expect(pHigh).toBeGreaterThan(pLow);
    });

    it('higher difficulty means lower probability', () => {
      const pEasy = computeProbability(0.5, 0.0, 0.2, 0.0);
      const pHard = computeProbability(0.5, 0.0, 0.8, 0.0);
      expect(pEasy).toBeGreaterThan(pHard);
    });

    it('sphere factor boosts probability', () => {
      const pBase = computeProbability(0.5, 0.0, 0.5, 0.0);
      const pBoosted = computeProbability(0.5, 0.2, 0.5, 0.0);
      expect(pBoosted).toBeGreaterThan(pBase);
    });
  });

  describe('classifyForecast', () => {
    it('classifies probability ranges correctly', () => {
      expect(classifyForecast(0.10)).toBe('doomed');
      expect(classifyForecast(0.30)).toBe('perilous');
      expect(classifyForecast(0.50)).toBe('uncertain');
      expect(classifyForecast(0.70)).toBe('favorable');
      expect(classifyForecast(0.90)).toBe('fated');
    });
  });

  describe('resolveAction', () => {
    it('returns a valid outcome with deterministic roll', () => {
      const result = resolveAction(0.60, 45); // P=60%, roll=45 → success
      expect(result.outcome).toBe('success');
      expect(result.roll).toBe(45);
      expect(result.probability).toBe(0.60);
    });

    it('critical success when roll <= P * 10', () => {
      const result = resolveAction(0.60, 3); // P=60%, crit threshold=6
      expect(result.outcome).toBe('critical_success');
    });

    it('critical failure when roll >= 96', () => {
      const result = resolveAction(0.60, 98);
      expect(result.outcome).toBe('critical_failure');
    });

    it('failure when roll > P * 100', () => {
      const result = resolveAction(0.40, 55); // P=40%, roll=55 → failure
      expect(result.outcome).toBe('failure');
    });

    it('uses random roll when none provided', () => {
      const result = resolveAction(0.50);
      expect(result.roll).toBeGreaterThanOrEqual(1);
      expect(result.roll).toBeLessThanOrEqual(100);
    });
  });

  describe('resolveContestedAction', () => {
    it('returns contested outcome based on two independent rolls', () => {
      const result = resolveContestedAction(
        0.70, 30,  // attacker: P=70%, roll=30 → success
        0.40, 55,  // defender: P=40%, roll=55 → failure
      );
      expect(result.attacker.outcome).toBe('success');
      expect(result.defender.outcome).toBe('failure');
      expect(result.contestOutcome).toBe('attacker_wins');
    });

    it('stalemate when both succeed', () => {
      const result = resolveContestedAction(0.70, 30, 0.70, 30);
      expect(result.contestOutcome).toBe('stalemate');
    });

    it('mutual failure when both fail', () => {
      const result = resolveContestedAction(0.30, 80, 0.30, 80);
      expect(result.contestOutcome).toBe('mutual_failure');
    });
  });
});
```

### Step 3: Run tests to verify they fail

### Step 4: Implement resolution engine

Create `src/engine/resolution.ts`. Key functions:
- `computeProbability(capability, sphereFactor, difficulty, modifiers)` — `clamp(capability + sphereFactor - difficulty + modifiers, 0.05, 0.95)`
- `classifyForecast(p)` — Doomed/Perilous/Uncertain/Favorable/Fated based on P ranges
- `resolveAction(p, deterministicRoll?)` — roll d100, classify outcome (crit success ≤ P×10, success ≤ P×100, crit fail ≥ 96, else failure), compute margin
- `resolveContestedAction(pA, rollA, pD, rollD)` — two independent resolveAction calls, derive contest outcome from the 2×2 matrix

### Step 5: Run tests to verify they pass

### Step 6: Commit

```bash
git add src/types/resolution.ts src/engine/resolution.ts src/engine/__tests__/resolution.test.ts
git commit -m "feat: add unified resolution system with sigmoid probability, Fate Forecast, and contested actions"
```

---

## Task 5: Temporal Controller

The tick engine. Manages simulation time, advances in-progress actions, fires resolution when actions complete, manages action points, and handles speed controls. This is the simulation heartbeat.

**Depends on:** Task 1 (WorldGraph), Task 4 (Resolution)

**Files:**
- Create: `src/types/temporal.ts`
- Create: `src/engine/temporal.ts`
- Create: `src/engine/__tests__/temporal.test.ts`

**Reference:** `Docs/plans/2026-03-03-turn-economy-and-player-influence-design.md` (Sections 2, 3)

### Step 1: Write temporal type definitions

Create `src/types/temporal.ts`:

```typescript
import type { ActorType } from './graph';

export interface SimulationClock {
  currentTick: number;
  ticksPerSeason: number;      // ~90
  season: number;               // 0-3
  year: number;
}

export interface ActionInProgress {
  actionId: string;             // unique instance ID
  actorId: string;
  templateId: string;           // action template node ID
  targetId: string;             // target node ID
  domain: string;               // which Reach domain
  startTick: number;
  duration: number;             // total ticks to complete
  progress: number;             // current progress (0 to duration)
}

/** AP budgets by actor type (from design doc) */
export const BASE_AP: Record<ActorType, number> = {
  god: 1,
  ascendant: 2,
  faction: 3,
  culture: 2,
  group: 2,
  individual: 1,
};

export type SimulationSpeed = 0 | 1 | 2 | 3 | 5; // 0 = paused

export interface TickResult {
  tick: number;
  completedActions: string[];     // action IDs that resolved this tick
  newSeason: boolean;
}
```

### Step 2: Write failing tests

Create `src/engine/__tests__/temporal.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TemporalController } from '../temporal';
import { WorldGraph } from '../graph';

describe('TemporalController', () => {
  let graph: WorldGraph;
  let controller: TemporalController;

  beforeEach(() => {
    graph = new WorldGraph();
    controller = new TemporalController(graph);

    // Add a basic actor
    graph.addNode({
      id: 'actor.thorin', type: 'actor', name: 'Thorin',
      properties: { actorType: 'individual' },
    });
  });

  describe('clock', () => {
    it('starts at tick 0', () => {
      expect(controller.getClock().currentTick).toBe(0);
    });

    it('advances tick by 1', () => {
      controller.tick();
      expect(controller.getClock().currentTick).toBe(1);
    });

    it('tracks season changes', () => {
      for (let i = 0; i < 90; i++) controller.tick();
      expect(controller.getClock().season).toBe(1);
    });
  });

  describe('action management', () => {
    it('starts an action for an actor', () => {
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 7,
        progress: 0,
      });
      expect(controller.getActionsForActor('actor.thorin')).toHaveLength(1);
    });

    it('advances action progress each tick', () => {
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 7,
        progress: 0,
      });
      controller.tick();
      const actions = controller.getActionsForActor('actor.thorin');
      expect(actions[0].progress).toBe(1);
    });

    it('reports completed actions when progress reaches duration', () => {
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 3,
        progress: 0,
      });
      controller.tick(); // progress 1
      controller.tick(); // progress 2
      const result = controller.tick(); // progress 3 → completed
      expect(result.completedActions).toContain('act.1');
    });

    it('removes completed actions', () => {
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 1,
        progress: 0,
      });
      controller.tick();
      expect(controller.getActionsForActor('actor.thorin')).toHaveLength(0);
    });

    it('respects AP limits', () => {
      // Individual has 1 AP
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 7,
        progress: 0,
      });
      expect(() =>
        controller.startAction({
          actionId: 'act.2',
          actorId: 'actor.thorin',
          templateId: 'template.train',
          targetId: 'loc.barracks',
          domain: 'iron',
          startTick: 0,
          duration: 7,
          progress: 0,
        })
      ).toThrow(/AP/);
    });
  });

  describe('getAvailableAP', () => {
    it('returns base AP minus active actions', () => {
      expect(controller.getAvailableAP('actor.thorin')).toBe(1);
      controller.startAction({
        actionId: 'act.1',
        actorId: 'actor.thorin',
        templateId: 'template.march',
        targetId: 'loc.fortress',
        domain: 'iron',
        startTick: 0,
        duration: 7,
        progress: 0,
      });
      expect(controller.getAvailableAP('actor.thorin')).toBe(0);
    });
  });
});
```

### Step 3: Run tests to verify they fail

### Step 4: Implement TemporalController

Create `src/engine/temporal.ts`. A class that:
- Holds a `SimulationClock` and a `Map<string, ActionInProgress>` for active actions
- `tick()`: increment clock, advance all action progress counters, return list of completed actions
- `startAction(action)`: validate AP, add to active actions
- `getAvailableAP(actorId)`: base AP for actor type minus active action count
- Season changes every 90 ticks

### Step 5: Run tests to verify they pass

### Step 6: Commit

```bash
git add src/types/temporal.ts src/engine/temporal.ts src/engine/__tests__/temporal.test.ts
git commit -m "feat: add temporal controller with tick engine, action progress, and AP management"
```

---

## Task 6: Agent Action Selection (Maslow Pipeline)

The autonomous decision-making system. When an actor's action completes (AP frees up), this pipeline selects their next action. Six layers from survival to self-actualization, with probabilistic selection at the end.

**Depends on:** Task 1 (WorldGraph), Task 2 (Traits), Task 3 (Domain Capability)

**Files:**
- Create: `src/types/agent.ts`
- Create: `src/engine/agentSelection.ts`
- Create: `src/engine/__tests__/agentSelection.test.ts`

**Reference:** `Docs/plans/2026-03-04-high-level-discovery-pass.md` (DISC-03)

### Step 1: Write agent type definitions

Create `src/types/agent.ts`:

```typescript
import type { ReachDomain } from './traits';

/** Axiological value pairs (from the Axiological Motivation Engine design) */
export type ValuePair =
  | 'ambition_contentment'
  | 'courage_prudence'
  | 'cruelty_compassion'
  | 'cunning_honesty'
  | 'devotion_independence'
  | 'loyalty_treachery'
  | 'tradition_innovation'
  | 'dominance_humility'
  | 'wrath_patience'
  | 'greed_generosity';

/** Actor's axiological profile: each value from -1.0 (right pole) to +1.0 (left pole) */
export type AxiologicalProfile = Record<ValuePair, number>;

/** An action candidate generated by the pipeline */
export interface ActionCandidate {
  templateId: string;
  targetId: string;
  domain: ReachDomain;
  score: number;               // computed alignment score
  motivations: ValuePair[];    // which values drive this choice
  probability?: number;        // normalized probability (post top-N)
}

/** Configuration for the selection pipeline */
export interface SelectionConfig {
  topN: number;                // how many candidates to keep (3-5)
  survivalThreshold: number;   // threat level that triggers survival layer
}

/** Result of the selection pipeline */
export interface SelectionResult {
  selected: ActionCandidate;
  candidates: ActionCandidate[];  // the top-N candidates with probabilities
  wasSurvivalOverride: boolean;
}
```

### Step 2: Write failing tests

Create `src/engine/__tests__/agentSelection.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  filterAvailableActions,
  scoreByGoalAlignment,
  applyPersonalityWeights,
  selectTopN,
  probabilisticSelect,
  runSelectionPipeline,
} from '../agentSelection';
import type { ActionCandidate, AxiologicalProfile } from '../../types/agent';

describe('Agent Action Selection', () => {
  let graph: WorldGraph;

  const defaultProfile: AxiologicalProfile = {
    ambition_contentment: 0.7,
    courage_prudence: 0.3,
    cruelty_compassion: -0.5,
    cunning_honesty: 0.1,
    devotion_independence: -0.2,
    loyalty_treachery: -0.6,
    tradition_innovation: 0.0,
    dominance_humility: 0.4,
    wrath_patience: -0.3,
    greed_generosity: -0.4,
  };

  const mockCandidates: ActionCandidate[] = [
    { templateId: 'march', targetId: 'fort', domain: 'iron', score: 0, motivations: ['ambition_contentment', 'courage_prudence'] },
    { templateId: 'trade', targetId: 'market', domain: 'gold', score: 0, motivations: ['greed_generosity'] },
    { templateId: 'spy', targetId: 'rival', domain: 'shadow', score: 0, motivations: ['cunning_honesty'] },
    { templateId: 'pray', targetId: 'shrine', domain: 'star', score: 0, motivations: ['devotion_independence'] },
    { templateId: 'build', targetId: 'wall', domain: 'stone', score: 0, motivations: ['tradition_innovation'] },
  ];

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: 'actor.thorin', type: 'actor', name: 'Thorin',
      properties: {
        actorType: 'individual',
        axiologicalProfile: defaultProfile,
      },
    });
  });

  describe('scoreByGoalAlignment', () => {
    it('scores candidates based on axiological alignment', () => {
      const scored = scoreByGoalAlignment(mockCandidates, defaultProfile);
      // March uses ambition (0.7) + courage (0.3) → high alignment
      const march = scored.find(c => c.templateId === 'march')!;
      expect(march.score).toBeGreaterThan(0);
    });

    it('gives higher scores to actions matching dominant values', () => {
      const scored = scoreByGoalAlignment(mockCandidates, defaultProfile);
      const march = scored.find(c => c.templateId === 'march')!;
      const pray = scored.find(c => c.templateId === 'pray')!;
      // Ambition 0.7 > devotion -0.2 (independence), so march should score higher
      expect(march.score).toBeGreaterThan(pray.score);
    });
  });

  describe('selectTopN', () => {
    it('keeps only top N candidates by score', () => {
      const scored = mockCandidates.map((c, i) => ({ ...c, score: 5 - i }));
      const top = selectTopN(scored, 3);
      expect(top).toHaveLength(3);
      expect(top[0].score).toBeGreaterThanOrEqual(top[1].score);
    });
  });

  describe('probabilisticSelect', () => {
    it('selects from candidates with assigned probabilities', () => {
      const candidates: ActionCandidate[] = [
        { ...mockCandidates[0], score: 10, probability: 0.6 },
        { ...mockCandidates[1], score: 5, probability: 0.3 },
        { ...mockCandidates[2], score: 2, probability: 0.1 },
      ];
      const selected = probabilisticSelect(candidates, 0.5); // deterministic: 0.5 → first (0-0.6)
      expect(selected.templateId).toBe('march');
    });

    it('deterministic roll 0.9 selects the third candidate', () => {
      const candidates: ActionCandidate[] = [
        { ...mockCandidates[0], score: 10, probability: 0.5 },
        { ...mockCandidates[1], score: 5, probability: 0.3 },
        { ...mockCandidates[2], score: 2, probability: 0.2 },
      ];
      const selected = probabilisticSelect(candidates, 0.9); // 0.9 → third (0.8-1.0)
      expect(selected.templateId).toBe('spy');
    });
  });

  describe('runSelectionPipeline', () => {
    it('returns a selected action and candidate list', () => {
      const result = runSelectionPipeline(graph, 'actor.thorin', mockCandidates, { topN: 3, survivalThreshold: 0.8 });
      expect(result.selected).toBeDefined();
      expect(result.candidates.length).toBeLessThanOrEqual(3);
      expect(result.wasSurvivalOverride).toBe(false);
    });
  });
});
```

### Step 3: Run tests to verify they fail

### Step 4: Implement agent selection pipeline

Create `src/engine/agentSelection.ts`. Key functions:
- `scoreByGoalAlignment(candidates, profile)` — for each candidate, sum the axiological profile values for its motivation pairs (positive value = aligned)
- `applyPersonalityWeights(candidates, traitBiases)` — future extension point
- `selectTopN(candidates, n)` — sort by score descending, take top N
- `probabilisticSelect(candidates, deterministicRoll?)` — normalize scores to probabilities, weighted random selection
- `runSelectionPipeline(graph, actorId, candidates, config)` — orchestrate: score → top-N → probabilistic select

### Step 5: Run tests to verify they pass

### Step 6: Commit

```bash
git add src/types/agent.ts src/engine/agentSelection.ts src/engine/__tests__/agentSelection.test.ts
git commit -m "feat: add Maslow-inspired agent action selection pipeline"
```

---

## Task 7: View Level Manager

A query layer over the WorldGraph. Not a separate data structure — just functions that filter and group nodes by their containment hierarchy (World → Region → Location → Sub-location).

**Depends on:** Task 1 (WorldGraph)

**Files:**
- Create: `src/engine/viewLevel.ts`
- Create: `src/engine/__tests__/viewLevel.test.ts`

**Reference:** `Docs/plans/2026-03-04-high-level-discovery-pass.md` (DISC-14)

### Step 1: Write failing tests

Create `src/engine/__tests__/viewLevel.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getRegions,
  getLocationsInRegion,
  getSubLocations,
  getActorsAtLocation,
  getViewAtLevel,
} from '../viewLevel';

describe('View Level Manager', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();

    // World
    graph.addNode({ id: 'world', type: 'location', name: 'The World', properties: { locationType: 'world' } });

    // Regions
    graph.addNode({ id: 'region.north', type: 'location', name: 'Northern Wastes', properties: { locationType: 'region' } });
    graph.addNode({ id: 'region.south', type: 'location', name: 'Sunlands', properties: { locationType: 'region' } });
    graph.addEdge({ id: 'e.w.rn', source: 'world', target: 'region.north', type: 'contains', properties: {} });
    graph.addEdge({ id: 'e.w.rs', source: 'world', target: 'region.south', type: 'contains', properties: {} });

    // Locations in region
    graph.addNode({ id: 'loc.irongate', type: 'location', name: 'Iron Gate', properties: { locationType: 'location' } });
    graph.addNode({ id: 'loc.village', type: 'location', name: 'Oakvale', properties: { locationType: 'location' } });
    graph.addEdge({ id: 'e.rn.ig', source: 'region.north', target: 'loc.irongate', type: 'contains', properties: {} });
    graph.addEdge({ id: 'e.rn.v', source: 'region.north', target: 'loc.village', type: 'contains', properties: {} });

    // Sub-locations
    graph.addNode({ id: 'sub.market', type: 'location', name: 'Marketplace', properties: { locationType: 'sub_location' } });
    graph.addNode({ id: 'sub.temple', type: 'location', name: 'Temple', properties: { locationType: 'sub_location' } });
    graph.addEdge({ id: 'e.ig.m', source: 'loc.irongate', target: 'sub.market', type: 'contains', properties: {} });
    graph.addEdge({ id: 'e.ig.t', source: 'loc.irongate', target: 'sub.temple', type: 'contains', properties: {} });

    // Actor at location
    graph.addNode({ id: 'actor.thorin', type: 'actor', name: 'Thorin', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.thorin.loc', source: 'actor.thorin', target: 'loc.irongate', type: 'located_at', properties: {} });
  });

  it('gets all regions', () => {
    const regions = getRegions(graph);
    expect(regions).toHaveLength(2);
  });

  it('gets locations in a region', () => {
    const locs = getLocationsInRegion(graph, 'region.north');
    expect(locs).toHaveLength(2);
    expect(locs.map(l => l.id)).toContain('loc.irongate');
  });

  it('gets sub-locations for a location', () => {
    const subs = getSubLocations(graph, 'loc.irongate');
    expect(subs).toHaveLength(2);
  });

  it('gets actors at a location', () => {
    const actors = getActorsAtLocation(graph, 'loc.irongate');
    expect(actors).toHaveLength(1);
    expect(actors[0].id).toBe('actor.thorin');
  });

  it('getViewAtLevel returns structured data for region view', () => {
    const view = getViewAtLevel(graph, 'region', 'region.north');
    expect(view.locations).toHaveLength(2);
    expect(view.name).toBe('Northern Wastes');
  });
});
```

### Step 2: Run tests to verify they fail

### Step 3: Implement view level manager

Create `src/engine/viewLevel.ts`. Pure query functions:
- `getRegions(graph)` — get location nodes where `locationType === 'region'`
- `getLocationsInRegion(graph, regionId)` — follow `contains` edges from region
- `getSubLocations(graph, locationId)` — follow `contains` edges from location
- `getActorsAtLocation(graph, locationId)` — find `located_at` edges targeting this location
- `getViewAtLevel(graph, level, id)` — structured view combining the above

### Step 4: Run tests to verify they pass

### Step 5: Commit

```bash
git add src/engine/viewLevel.ts src/engine/__tests__/viewLevel.test.ts
git commit -m "feat: add view level manager with world/region/location/sub-location queries"
```

---

## Task 8: Integration Test — Headless Simulation Loop

Wire everything together. A single integration test that:
1. Creates a WorldGraph with actors, traits, locations
2. Starts actions via TemporalController
3. Ticks forward until an action completes
4. Resolves the action via ResolutionEngine
5. Applies graph mutations (trait gain from critical success)
6. Runs the AgentSelection pipeline to pick the actor's next action
7. Verifies the full loop works end-to-end

**Depends on:** All previous tasks

**Files:**
- Create: `src/engine/__tests__/integration.test.ts`
- Create: `src/engine/simulation.ts` (thin orchestrator)

### Step 1: Write the integration test

Create `src/engine/__tests__/integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { TemporalController } from '../temporal';
import { assignTrait } from '../traits';
import { computeCapability } from '../domainCapability';
import { computeProbability, resolveAction } from '../resolution';
import { runSelectionPipeline } from '../agentSelection';
import type { ActionCandidate, AxiologicalProfile } from '../../types/agent';

describe('Integration: Headless Simulation Loop', () => {
  it('runs a complete tick → resolve → select cycle', () => {
    // 1. Build world
    const graph = new WorldGraph();

    // Locations
    graph.addNode({ id: 'world', type: 'location', name: 'World', properties: { locationType: 'world' } });
    graph.addNode({ id: 'region.north', type: 'location', name: 'North', properties: { locationType: 'region' } });
    graph.addNode({ id: 'loc.fortress', type: 'location', name: 'Iron Gate', properties: { locationType: 'location', difficulty: 0.5 } });
    graph.addEdge({ id: 'e.w.rn', source: 'world', target: 'region.north', type: 'contains', properties: {} });
    graph.addEdge({ id: 'e.rn.f', source: 'region.north', target: 'loc.fortress', type: 'contains', properties: {} });

    // Actor with origin trait
    graph.addNode({ id: 'actor.thorin', type: 'actor', name: 'Thorin', properties: {
      actorType: 'individual',
      axiologicalProfile: {
        ambition_contentment: 0.7,
        courage_prudence: 0.5,
        cruelty_compassion: -0.3,
        cunning_honesty: 0.0,
        devotion_independence: -0.1,
        loyalty_treachery: -0.5,
        tradition_innovation: 0.2,
        dominance_humility: 0.4,
        wrath_patience: 0.1,
        greed_generosity: -0.2,
      } satisfies AxiologicalProfile,
    }});
    graph.addEdge({ id: 'e.thorin.loc', source: 'actor.thorin', target: 'loc.fortress', type: 'located_at', properties: {} });

    // Origin trait
    graph.addNode({
      id: 'trait.origin.mountainborn', type: 'trait', name: 'Mountainborn',
      properties: {
        subcategory: 'innate', maxLevel: 1, importance: 1.0, visibility: 'public',
        domainContributions: { iron: 3, gold: 3, stone: 4, star: 2, flesh: 2, heart: 1, eye: 1 },
        tags: [], flavorText: 'Born of the mountain.',
      },
    });
    assignTrait(graph, 'actor.thorin', 'trait.origin.mountainborn', { tick: 0, source: 'origin' });

    // 2. Start an action
    const controller = new TemporalController(graph);
    controller.startAction({
      actionId: 'act.siege.1',
      actorId: 'actor.thorin',
      templateId: 'template.siege',
      targetId: 'loc.fortress',
      domain: 'iron',
      startTick: 0,
      duration: 3,
      progress: 0,
    });

    // 3. Tick forward to completion
    controller.tick(); // progress 1
    controller.tick(); // progress 2
    const result = controller.tick(); // progress 3 → completed
    expect(result.completedActions).toContain('act.siege.1');

    // 4. Resolve the completed action
    const ironCapability = computeCapability(graph, 'actor.thorin', 'iron');
    expect(ironCapability).toBeGreaterThan(0);

    const probability = computeProbability(ironCapability, 0.05, 0.5, 0.0);
    const resolution = resolveAction(probability, 25); // deterministic roll = 25
    expect(['critical_success', 'success', 'failure', 'critical_failure']).toContain(resolution.outcome);

    // 5. If success, apply trait (simulate a scar trait gain)
    if (resolution.outcome === 'success' || resolution.outcome === 'critical_success') {
      graph.addNode({
        id: 'trait.scar.siege_veteran', type: 'trait', name: 'Siege Veteran',
        properties: {
          subcategory: 'scar', maxLevel: 1, importance: 0.6, visibility: 'public',
          domainContributions: { iron: 1, stone: 1 },
          tags: [], flavorText: 'Survived the siege of Iron Gate.',
        },
      });
      assignTrait(graph, 'actor.thorin', 'trait.scar.siege_veteran', { tick: 3, source: 'act.siege.1' });
    }

    // 6. Run selection pipeline for next action
    const nextCandidates: ActionCandidate[] = [
      { templateId: 'patrol', targetId: 'region.north', domain: 'iron', score: 0, motivations: ['courage_prudence'] },
      { templateId: 'trade', targetId: 'loc.fortress', domain: 'gold', score: 0, motivations: ['greed_generosity'] },
      { templateId: 'recruit', targetId: 'loc.fortress', domain: 'heart', score: 0, motivations: ['ambition_contentment', 'dominance_humility'] },
    ];

    const selectionResult = runSelectionPipeline(
      graph, 'actor.thorin', nextCandidates,
      { topN: 3, survivalThreshold: 0.8 },
    );
    expect(selectionResult.selected).toBeDefined();
    expect(selectionResult.candidates.length).toBeGreaterThan(0);

    // 7. Verify the graph has been mutated correctly
    const stats = graph.getStats();
    expect(stats.nodeCount).toBeGreaterThanOrEqual(5); // at least world, region, fortress, actor, 2 traits
  });
});
```

### Step 2: Run the integration test

Run: `npx vitest run src/engine/__tests__/integration.test.ts`
Expected: PASS (all prior tasks must be complete)

### Step 3: Create simulation orchestrator

Create `src/engine/simulation.ts` — a thin class that wires TemporalController + ResolutionEngine + AgentSelection into a `runTick()` method. This is the main simulation loop entry point.

```typescript
/**
 * Simulation orchestrator.
 * Wires the temporal controller, resolution engine, and agent selection
 * into a single runTick() method.
 */
import { WorldGraph } from './graph';
import { TemporalController } from './temporal';
import { computeCapability } from './domainCapability';
import { computeProbability, resolveAction } from './resolution';
import { processTraitDecay } from './traits';

export class Simulation {
  readonly graph: WorldGraph;
  readonly clock: TemporalController;

  constructor(graph: WorldGraph) {
    this.graph = graph;
    this.clock = new TemporalController(graph);
  }

  /**
   * Advance one tick.
   * Returns completed action IDs for the caller to handle
   * (resolution, agent selection, UI updates).
   */
  runTick() {
    const tickResult = this.clock.tick();

    // Process trait decay at season boundaries
    if (tickResult.newSeason) {
      const actors = this.graph.getNodesByType('actor');
      for (const actor of actors) {
        processTraitDecay(this.graph, actor.id, this.clock.getClock().currentTick);
      }
    }

    return tickResult;
  }
}
```

### Step 4: Run full test suite

Run: `npx vitest run`
Expected: ALL PASS across all test files

### Step 5: Commit

```bash
git add src/engine/__tests__/integration.test.ts src/engine/simulation.ts
git commit -m "feat: add integration test and simulation orchestrator wiring all Phase 1 systems"
```

---

## Post-Phase 1 Verification Checklist

After all 8 tasks are complete, verify:

- [ ] `npx vitest run` — all tests pass
- [ ] `npx tsc -b` — no TypeScript errors
- [ ] `npx eslint .` — no lint errors
- [ ] Integration test demonstrates: create graph → start action → tick → resolve → mutate → select next action
- [ ] No React imports in any `src/engine/` file (engine is UI-independent)
- [ ] All IDs use consistent prefix convention (`actor.`, `trait.`, `loc.`, `artifact.`, `act.`, `e.`)
- [ ] Notion backlog Phase 1 items checked off

---

## Appendix: File Map After Phase 1

```
src/
├── types/
│   ├── index.ts              (existing — hex, terrain, cosmology)
│   ├── taxonomy.ts           (existing — cosmology graph types)
│   ├── graph.ts              (NEW — WorldGraph node/edge types)
│   ├── traits.ts             (NEW — trait categories, domain contributions, lexicon)
│   ├── resolution.ts         (NEW — forecast, outcome, contested resolution types)
│   ├── temporal.ts           (NEW — clock, action-in-progress, AP)
│   └── agent.ts              (NEW — axiological profile, action candidates, selection)
├── engine/
│   ├── graph.ts              (NEW — WorldGraph class)
│   ├── traits.ts             (NEW — trait assignment, decay, contributions)
│   ├── domainCapability.ts   (NEW — sigmoid computation, lexicon lookup)
│   ├── resolution.ts         (NEW — probability, forecast, d100 resolution)
│   ├── temporal.ts           (NEW — TemporalController class)
│   ├── agentSelection.ts     (NEW — Maslow pipeline)
│   ├── viewLevel.ts          (NEW — view level queries)
│   ├── simulation.ts         (NEW — orchestrator)
│   ├── cosmology.ts          (existing)
│   ├── terrain.ts            (existing)
│   ├── taxonomy.ts           (existing)
│   └── __tests__/
│       ├── graph.test.ts           (NEW)
│       ├── traits.test.ts          (NEW)
│       ├── domainCapability.test.ts (NEW)
│       ├── resolution.test.ts      (NEW)
│       ├── temporal.test.ts        (NEW)
│       ├── agentSelection.test.ts  (NEW)
│       ├── viewLevel.test.ts       (NEW)
│       ├── integration.test.ts     (NEW)
│       ├── cosmology.test.ts       (existing)
│       ├── terrain.test.ts         (existing)
│       ├── taxonomy.test.ts        (existing)
│       └── ...
```
