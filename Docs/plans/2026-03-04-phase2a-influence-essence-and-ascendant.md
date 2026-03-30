# Phase 2A: Influence Essence Economy & Ascendant Creation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the divine economy (sphere-typed Influence Essence with generation, spending, and pool management) and the Ascendant creation system (archetype drafting, avatar linking, identity drift tracking) so a player entity can exist in the graph and accumulate/spend resources.

**Architecture:** The Ascendant is an actor node (type: 'actor', actorType: 'ascendant') with an `avatar_of` edge to its avatar (type: 'actor', actorType: 'individual'). Influence Essence is stored as a property on the Ascendant node — a `Record<SphereName, number>` pool. Generation rates are computed each tick from graph queries (worshippers, places of power, sphere dominance). Influence relationships are `worships` edges with tier metadata. All engine code is pure TypeScript — no React.

**Tech Stack:** TypeScript, Vitest, existing WorldGraph/trait/temporal APIs from Phase 1.

**Existing code to build on:**
- `src/types/graph.ts` — GraphNode, GraphEdge, NodeType ('actor'), ActorType ('ascendant'), EdgeType ('worships', 'avatar_of', 'aligned_with', 'located_at')
- `src/types/index.ts` — SphereName, CosmologyProfile, SPHERE_NAMES
- `src/types/agent.ts` — AxiologicalProfile, ValuePair
- `src/types/traits.ts` — ReachDomain, DomainContributions
- `src/engine/graph.ts` — WorldGraph class (addNode, addEdge, getOutgoingEdges, getIncomingEdges, etc.)
- `src/engine/cosmology.ts` — createBalancedCosmology, normalizeCosmology, SPHERE_ALLIES, SPHERE_OPPOSITES
- `src/engine/traits.ts` — assignTrait, getTraitsForNode
- `src/engine/domainCapability.ts` — computeFullProfile

**Dependency order:**
```
Task 1: Influence types (foundation for everything in this plan)
   ↓
Task 2: Essence pool & generation engine (needs types)
   ↓
Task 3: Influence tier management (needs essence for maintenance)
   ↓
Task 4: Ascendant creation (needs influence types + tiers)
   ↓
Task 5: Integration test — Ascendant exists, generates essence, manages agents
```

**Conventions (same as Phase 1):**
- Engine code in `src/engine/` — pure TypeScript, no React imports
- Types in `src/types/` — shared type definitions
- Tests colocated as `src/engine/__tests__/<module>.test.ts`
- All IDs are `string` (prefixed: `asc.`, `avatar.`, `influence.`, etc.)
- Use `Map<string, T>` for O(1) lookups, not arrays

---

## Task 1: Influence & Ascendant Type Definitions

All the types that Phase 2A needs. No logic — just interfaces and constants.

**Files:**
- Create: `src/types/influence.ts`

### Step 1: Write the type definitions

Create `src/types/influence.ts`:

```typescript
/**
 * Influence & Ascendant type definitions.
 *
 * The player's Ascendant is a divine entity that accumulates sphere-typed
 * Influence Essence and spends it to manipulate actors in the world graph.
 */

import type { SphereName } from './index';
import type { AxiologicalProfile } from './agent';
import type { ReachDomain } from './traits';

// ─── Influence Essence ───────────────────────────────────────────────

/** Sphere-typed essence pool. Each sphere has its own balance. */
export type EssencePool = Record<SphereName, number>;

/** Per-tick generation rates by sphere. */
export type EssenceGeneration = Record<SphereName, number>;

/** How essence generation is distributed based on sphere alignment. */
export interface EssenceDistribution {
  /** Primary sphere gets this fraction (e.g., 0.35) */
  primaryFraction: number;
  /** Secondary sphere gets this fraction (e.g., 0.25) */
  secondaryFraction: number;
  /** Remaining 6 spheres split the rest equally */
}

/** Base generation rate: 1 essence per tick. */
export const BASE_ESSENCE_PER_TICK = 1.0;

/** Essence per worshipper per tick. */
export const ESSENCE_PER_WORSHIPPER = 0.1;

/** Essence bonus per controlled place of power per tick. */
export const ESSENCE_PER_PLACE_OF_POWER = 0.5;

/** Maximum essence pool scales with total influence level. */
export const BASE_MAX_ESSENCE = 50;
export const MAX_ESSENCE_PER_WORSHIPPER = 5;

// ─── Influence Tiers ─────────────────────────────────────────────────

/** Influence tier levels (0-4). Higher = deeper divine connection. */
export type InfluenceTier = 0 | 1 | 2 | 3 | 4;

/** Working names for each tier. */
export const TIER_NAMES: Record<InfluenceTier, string> = {
  0: 'Unaware',
  1: 'Touched',
  2: 'Devoted',
  3: 'Champion',
  4: 'Aspect',
};

/** Maintenance cost per tick per tier. */
export const TIER_MAINTENANCE: Record<InfluenceTier, number> = {
  0: 0,
  1: 0.5,
  2: 1.0,
  3: 2.0,
  4: 4.0,
};

/** Ticks of maintained influence needed to promote to each tier. */
export const TIER_PROMOTION_THRESHOLDS: Record<InfluenceTier, number> = {
  0: 0,    // automatic
  1: 0,    // immediate on recruitment (costs 5 essence)
  2: 30,   // ~1 month of maintained influence
  3: 90,   // ~1 season
  4: 180,  // ~2 seasons
};

/** Cost to recruit a new actor (establish Tier 1 influence). */
export const RECRUIT_COST = 5;

/** Cost to discover actors at current location. */
export const DISCOVER_COST = 1;

/** Cost to observe (reveal hidden properties). */
export const OBSERVE_COST = 0.5;

// ─── Influence Relationship Properties ───────────────────────────────

/**
 * Properties stored on 'worships' edges between actor → ascendant.
 * Tracks the influence relationship state.
 */
export interface InfluenceRelationshipProperties {
  tier: InfluenceTier;
  /** Ticks of continuous maintained influence at current tier. */
  ticksAtCurrentTier: number;
  /** Tick when this relationship was established. */
  establishedTick: number;
  /** Cumulative essence spent on this relationship. */
  totalEssenceSpent: number;
  /** Whether maintenance was paid this tick. */
  maintenanceCurrent: boolean;
}

// ─── Ascendant ───────────────────────────────────────────────────────

/** Sphere alignment for an Ascendant — primary and secondary. */
export interface SphereAlignment {
  primary: SphereName;
  secondary: SphereName;
}

/**
 * Properties stored on the Ascendant actor node (in node.properties).
 */
export interface AscendantProperties {
  actorType: 'ascendant';
  /** Primary and secondary sphere alignment. */
  sphereAlignment: SphereAlignment;
  /** Current essence pool. */
  essencePool: EssencePool;
  /** Maximum essence pool size (computed, cached). */
  maxEssence: number;
  /** The archetype chosen at creation. */
  archetypeId: string;
  /** Identity drift tracking: running tally of intervention types used. */
  interventionHistory: Record<string, number>;
  /** Avatar node ID. */
  avatarId: string;
}

/**
 * An Ascendant archetype offered during creation.
 * Generated from World-Soul state; player picks one.
 */
export interface AscendantArchetype {
  id: string;
  name: string;
  title: string;
  description: string;
  sphereAlignment: SphereAlignment;
  /** Starting domain affinities (which Reaches this god is good at). */
  startingDomainAffinities: Partial<Record<ReachDomain, number>>;
  /** Personality seed — initial axiological profile. */
  personalitySeed: AxiologicalProfile;
  /** Flavor text for the archetype. */
  flavorText: string;
}

/**
 * Avatar creation config.
 */
export interface AvatarConfig {
  name: string;
  /** Starting location node ID. */
  startLocationId: string;
  /** Avatar form flavor (e.g., "old wizard", "wandering shaman"). */
  formDescription: string;
}

/**
 * Full creation config passed to createAscendant().
 */
export interface AscendantCreationConfig {
  archetype: AscendantArchetype;
  avatar: AvatarConfig;
}
```

### Step 2: Run the build to verify types compile

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx tsc --noEmit`
Expected: PASS (no errors — these are just type definitions)

### Step 3: Commit

```bash
git add src/types/influence.ts
git commit -m "feat: add influence essence and ascendant type definitions"
```

---

## Task 2: Essence Pool & Generation Engine

The core economy: creating empty pools, computing per-tick generation from graph state, spending essence, and enforcing pool limits.

**Files:**
- Create: `src/engine/influence.ts`
- Create: `src/engine/__tests__/influence.test.ts`

### Step 1: Write failing tests for essence pool operations

Create `src/engine/__tests__/influence.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createEmptyEssencePool,
  computeEssenceGeneration,
  generateEssence,
  spendEssence,
  computeMaxEssence,
  canAfford,
} from '../influence';
import type { GraphNode, GraphEdge } from '../../types/graph';
import type { SphereAlignment, EssencePool } from '../../types/influence';
import { SPHERE_NAMES } from '../../types/index';

describe('Essence Pool', () => {
  it('createEmptyEssencePool returns all zeros', () => {
    const pool = createEmptyEssencePool();
    for (const sphere of SPHERE_NAMES) {
      expect(pool[sphere]).toBe(0);
    }
  });

  it('canAfford returns true when pool has enough', () => {
    const pool = createEmptyEssencePool();
    pool.life = 5;
    expect(canAfford(pool, 'life', 3)).toBe(true);
    expect(canAfford(pool, 'life', 5)).toBe(true);
    expect(canAfford(pool, 'life', 5.1)).toBe(false);
    expect(canAfford(pool, 'force', 1)).toBe(false);
  });

  it('spendEssence deducts from pool and returns true', () => {
    const pool = createEmptyEssencePool();
    pool.force = 10;
    const result = spendEssence(pool, 'force', 3);
    expect(result).toBe(true);
    expect(pool.force).toBe(7);
  });

  it('spendEssence returns false and does not deduct when insufficient', () => {
    const pool = createEmptyEssencePool();
    pool.force = 2;
    const result = spendEssence(pool, 'force', 5);
    expect(result).toBe(false);
    expect(pool.force).toBe(2);
  });
});

describe('Essence Generation', () => {
  let graph: WorldGraph;
  const ascendantId = 'asc.player';

  beforeEach(() => {
    graph = new WorldGraph();

    // Create ascendant node
    graph.addNode({
      id: ascendantId,
      type: 'actor',
      name: 'The Verdant One',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'life', secondary: 'spirit' } as SphereAlignment,
      },
    });
  });

  it('base generation distributes by sphere alignment', () => {
    const gen = computeEssenceGeneration(graph, ascendantId);
    // Primary sphere (life) gets the largest share
    expect(gen.life).toBeGreaterThan(gen.force);
    // Secondary sphere (spirit) gets second largest
    expect(gen.spirit).toBeGreaterThan(gen.force);
    // All spheres sum to BASE_ESSENCE_PER_TICK (1.0)
    const total = SPHERE_NAMES.reduce((sum, s) => sum + gen[s], 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('worshippers increase generation', () => {
    const baseGen = computeEssenceGeneration(graph, ascendantId);
    const baseTotal = SPHERE_NAMES.reduce((sum, s) => sum + baseGen[s], 0);

    // Add a worshipper
    graph.addNode({
      id: 'actor.worshipper1',
      type: 'actor',
      name: 'Faithful One',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'edge.worship1',
      source: 'actor.worshipper1',
      target: ascendantId,
      type: 'worships',
      properties: { tier: 1, ticksAtCurrentTier: 0, establishedTick: 0, totalEssenceSpent: 0, maintenanceCurrent: true },
    });

    const boostedGen = computeEssenceGeneration(graph, ascendantId);
    const boostedTotal = SPHERE_NAMES.reduce((sum, s) => sum + boostedGen[s], 0);
    expect(boostedTotal).toBeGreaterThan(baseTotal);
  });

  it('places of power increase generation', () => {
    const baseGen = computeEssenceGeneration(graph, ascendantId);
    const baseTotal = SPHERE_NAMES.reduce((sum, s) => sum + baseGen[s], 0);

    // Add a place of power controlled by the ascendant
    graph.addNode({
      id: 'loc.shrine',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'location', isPlaceOfPower: true },
    });
    graph.addEdge({
      id: 'edge.controls_shrine',
      source: ascendantId,
      target: 'loc.shrine',
      type: 'controls',
      properties: {},
    });

    const boostedGen = computeEssenceGeneration(graph, ascendantId);
    const boostedTotal = SPHERE_NAMES.reduce((sum, s) => sum + boostedGen[s], 0);
    expect(boostedTotal).toBeGreaterThan(baseTotal);
  });

  it('generateEssence adds to pool respecting max', () => {
    const pool = createEmptyEssencePool();
    const gen = computeEssenceGeneration(graph, ascendantId);
    const maxEssence = 50;

    generateEssence(pool, gen, maxEssence);

    // Pool should have some essence now
    const total = SPHERE_NAMES.reduce((sum, s) => sum + pool[s], 0);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(maxEssence);
  });

  it('generateEssence caps individual spheres at maxEssence', () => {
    const pool = createEmptyEssencePool();
    pool.life = 49;
    const gen = createEmptyEssencePool();
    gen.life = 5; // would push to 54

    generateEssence(pool, gen, 50);

    expect(pool.life).toBe(50);
  });

  it('computeMaxEssence scales with worshippers', () => {
    const base = computeMaxEssence(graph, ascendantId);
    expect(base).toBe(50); // BASE_MAX_ESSENCE with no worshippers

    graph.addNode({
      id: 'actor.w1',
      type: 'actor',
      name: 'W1',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'edge.w1',
      source: 'actor.w1',
      target: ascendantId,
      type: 'worships',
      properties: { tier: 1, ticksAtCurrentTier: 0, establishedTick: 0, totalEssenceSpent: 0, maintenanceCurrent: true },
    });

    const boosted = computeMaxEssence(graph, ascendantId);
    expect(boosted).toBe(55); // 50 + 5 per worshipper
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/influence.test.ts`
Expected: FAIL — module '../influence' not found

### Step 3: Write minimal implementation

Create `src/engine/influence.ts`:

```typescript
/**
 * Influence Essence economy engine.
 *
 * Manages the divine economy: essence pools, generation from graph state,
 * spending, and pool limits.
 */

import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { EssencePool, EssenceGeneration, SphereAlignment } from '../types/influence';
import {
  BASE_ESSENCE_PER_TICK,
  ESSENCE_PER_WORSHIPPER,
  ESSENCE_PER_PLACE_OF_POWER,
  BASE_MAX_ESSENCE,
  MAX_ESSENCE_PER_WORSHIPPER,
} from '../types/influence';
import type { WorldGraph } from './graph';

// ─── Pool Operations ─────────────────────────────────────────────────

/** Create an empty essence pool (all spheres at 0). */
export function createEmptyEssencePool(): EssencePool {
  const pool = {} as EssencePool;
  for (const sphere of SPHERE_NAMES) {
    pool[sphere] = 0;
  }
  return pool;
}

/** Check if a pool can afford a given cost in a specific sphere. */
export function canAfford(pool: EssencePool, sphere: SphereName, cost: number): boolean {
  return pool[sphere] >= cost;
}

/**
 * Spend essence from a pool. Returns true if successful, false if insufficient.
 * Mutates pool in place.
 */
export function spendEssence(pool: EssencePool, sphere: SphereName, cost: number): boolean {
  if (pool[sphere] < cost) return false;
  pool[sphere] -= cost;
  return true;
}

/**
 * Add generated essence to pool, capping each sphere at maxEssence.
 * Mutates pool in place.
 */
export function generateEssence(pool: EssencePool, generation: EssenceGeneration, maxEssence: number): void {
  for (const sphere of SPHERE_NAMES) {
    pool[sphere] = Math.min(pool[sphere] + generation[sphere], maxEssence);
  }
}

// ─── Generation Computation ──────────────────────────────────────────

/**
 * Distribute a total essence amount across spheres based on alignment.
 * Primary sphere: 35%, Secondary: 25%, remaining 6 split the rest (≈6.67% each).
 */
function distributeByAlignment(total: number, alignment: SphereAlignment): EssenceGeneration {
  const gen = createEmptyEssencePool();
  const primaryShare = total * 0.35;
  const secondaryShare = total * 0.25;
  const remainingShare = total * 0.40;
  const otherSpheres = SPHERE_NAMES.filter(
    (s) => s !== alignment.primary && s !== alignment.secondary
  );
  const perOther = remainingShare / otherSpheres.length;

  gen[alignment.primary] = primaryShare;
  gen[alignment.secondary] = secondaryShare;
  for (const s of otherSpheres) {
    gen[s] = perOther;
  }
  return gen;
}

/**
 * Compute per-tick essence generation for an Ascendant based on graph state.
 *
 * Sources:
 * 1. Base generation: 1.0 essence/tick distributed by sphere alignment
 * 2. Worshippers: +0.1 per worshipper (actors with 'worships' edge to ascendant)
 * 3. Places of power: +0.5 per controlled place of power
 */
export function computeEssenceGeneration(
  graph: WorldGraph,
  ascendantId: string
): EssenceGeneration {
  const node = graph.getNode(ascendantId);
  if (!node) throw new Error(`Ascendant node not found: ${ascendantId}`);

  const alignment = node.properties.sphereAlignment as SphereAlignment;
  if (!alignment) throw new Error(`Ascendant missing sphereAlignment: ${ascendantId}`);

  // 1. Base generation
  let totalRate = BASE_ESSENCE_PER_TICK;

  // 2. Worshipper bonus
  const worshipEdges = graph.getIncomingEdges(ascendantId, 'worships');
  totalRate += worshipEdges.length * ESSENCE_PER_WORSHIPPER;

  // 3. Places of power bonus
  const controlEdges = graph.getOutgoingEdges(ascendantId, 'controls');
  for (const edge of controlEdges) {
    const loc = graph.getNode(edge.target);
    if (loc && loc.properties.isPlaceOfPower) {
      totalRate += ESSENCE_PER_PLACE_OF_POWER;
    }
  }

  return distributeByAlignment(totalRate, alignment);
}

/**
 * Compute maximum essence pool size for an Ascendant.
 * BASE_MAX_ESSENCE + MAX_ESSENCE_PER_WORSHIPPER per worshipper.
 */
export function computeMaxEssence(graph: WorldGraph, ascendantId: string): number {
  const worshipEdges = graph.getIncomingEdges(ascendantId, 'worships');
  return BASE_MAX_ESSENCE + worshipEdges.length * MAX_ESSENCE_PER_WORSHIPPER;
}
```

### Step 4: Run tests to verify they pass

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/influence.test.ts`
Expected: PASS (all 8 tests)

### Step 5: Commit

```bash
git add src/engine/influence.ts src/engine/__tests__/influence.test.ts
git commit -m "feat: add essence pool management and generation engine"
```

---

## Task 3: Influence Tier Management

Track influence relationships (worships edges), handle tier promotion, maintenance deduction, and agent dropping with consequences.

**Files:**
- Modify: `src/engine/influence.ts` (add tier functions)
- Modify: `src/engine/__tests__/influence.test.ts` (add tier tests)

### Step 1: Write failing tests for tier management

Append to `src/engine/__tests__/influence.test.ts`:

```typescript
import {
  // ... existing imports ...
  getInfluenceTier,
  processInfluenceMaintenance,
  checkTierPromotion,
  dropAgent,
} from '../influence';
import { TIER_MAINTENANCE, TIER_PROMOTION_THRESHOLDS } from '../../types/influence';

describe('Influence Tier Management', () => {
  let graph: WorldGraph;
  const ascendantId = 'asc.player';
  const agentId = 'actor.agent1';

  beforeEach(() => {
    graph = new WorldGraph();

    graph.addNode({
      id: ascendantId,
      type: 'actor',
      name: 'The Verdant One',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'life', secondary: 'spirit' } as SphereAlignment,
        essencePool: createEmptyEssencePool(),
      },
    });

    graph.addNode({
      id: agentId,
      type: 'actor',
      name: 'Faithful Agent',
      properties: { actorType: 'individual' },
    });
  });

  it('getInfluenceTier returns 0 for unrelated actor', () => {
    expect(getInfluenceTier(graph, ascendantId, agentId)).toBe(0);
  });

  it('getInfluenceTier returns current tier from worships edge', () => {
    graph.addEdge({
      id: 'edge.worship1',
      source: agentId,
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 2,
        ticksAtCurrentTier: 15,
        establishedTick: 0,
        totalEssenceSpent: 20,
        maintenanceCurrent: true,
      },
    });
    expect(getInfluenceTier(graph, ascendantId, agentId)).toBe(2);
  });

  it('processInfluenceMaintenance deducts essence and increments ticks', () => {
    // Give ascendant some essence
    const pool = createEmptyEssencePool();
    pool.life = 10;
    graph.updateNode(ascendantId, { properties: { ...graph.getNode(ascendantId)!.properties, essencePool: pool } });

    // Create influence relationship at tier 1 (costs 0.5/tick)
    graph.addEdge({
      id: 'edge.worship1',
      source: agentId,
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 5,
        maintenanceCurrent: true,
      },
    });

    const result = processInfluenceMaintenance(graph, ascendantId, 1);

    // Should have paid maintenance
    expect(result.maintenancePaid).toContain(agentId);
    expect(result.maintenanceFailed).toHaveLength(0);

    // Edge should be updated
    const edge = graph.getIncomingEdges(ascendantId, 'worships')[0];
    expect(edge.properties.ticksAtCurrentTier).toBe(1);
    expect(edge.properties.maintenanceCurrent).toBe(true);
  });

  it('processInfluenceMaintenance marks failed when insufficient essence', () => {
    // Ascendant has no essence
    const pool = createEmptyEssencePool();
    graph.updateNode(ascendantId, { properties: { ...graph.getNode(ascendantId)!.properties, essencePool: pool } });

    graph.addEdge({
      id: 'edge.worship1',
      source: agentId,
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 10,
        establishedTick: 0,
        totalEssenceSpent: 5,
        maintenanceCurrent: true,
      },
    });

    const result = processInfluenceMaintenance(graph, ascendantId, 11);
    expect(result.maintenanceFailed).toContain(agentId);

    const edge = graph.getIncomingEdges(ascendantId, 'worships')[0];
    expect(edge.properties.maintenanceCurrent).toBe(false);
  });

  it('checkTierPromotion promotes when threshold met', () => {
    graph.addEdge({
      id: 'edge.worship1',
      source: agentId,
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 1,
        ticksAtCurrentTier: TIER_PROMOTION_THRESHOLDS[2], // exactly at threshold for tier 2
        establishedTick: 0,
        totalEssenceSpent: 20,
        maintenanceCurrent: true,
      },
    });

    const promoted = checkTierPromotion(graph, ascendantId);
    expect(promoted).toContain(agentId);

    const edge = graph.getIncomingEdges(ascendantId, 'worships')[0];
    expect(edge.properties.tier).toBe(2);
    expect(edge.properties.ticksAtCurrentTier).toBe(0); // reset after promotion
  });

  it('checkTierPromotion does not promote when maintenance failed', () => {
    graph.addEdge({
      id: 'edge.worship1',
      source: agentId,
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 999,
        establishedTick: 0,
        totalEssenceSpent: 20,
        maintenanceCurrent: false, // maintenance failed
      },
    });

    const promoted = checkTierPromotion(graph, ascendantId);
    expect(promoted).toHaveLength(0);
  });

  it('checkTierPromotion does not promote past tier 4', () => {
    graph.addEdge({
      id: 'edge.worship1',
      source: agentId,
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 4,
        ticksAtCurrentTier: 999,
        establishedTick: 0,
        totalEssenceSpent: 100,
        maintenanceCurrent: true,
      },
    });

    const promoted = checkTierPromotion(graph, ascendantId);
    expect(promoted).toHaveLength(0);
  });

  it('dropAgent removes worships edge and returns drop result', () => {
    graph.addEdge({
      id: 'edge.worship1',
      source: agentId,
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 2,
        ticksAtCurrentTier: 50,
        establishedTick: 0,
        totalEssenceSpent: 60,
        maintenanceCurrent: true,
      },
    });

    const result = dropAgent(graph, ascendantId, agentId, 100);

    expect(result.agentId).toBe(agentId);
    expect(result.tierWhenDropped).toBe(2);
    expect(result.narrativeConsequence).toBe('crisis_of_faith');

    // Worships edge should be removed
    const edges = graph.getIncomingEdges(ascendantId, 'worships');
    expect(edges).toHaveLength(0);
  });

  it('dropAgent assigns scar trait for tier 2+', () => {
    // Add the scar trait definition to the graph
    graph.addNode({
      id: 'trait.abandoned_by_divine',
      type: 'trait',
      name: 'Abandoned by the Divine',
      properties: {
        subcategory: 'scar',
        description: 'Once touched by divine purpose, now cast adrift.',
        importance: 0.7,
        maxLevel: 1,
        visibility: 'public',
        domainContributions: { heart: -0.5, star: -0.3 },
        tags: ['divine', 'abandonment'],
        flavorText: 'The silence where a god once whispered.',
      },
    });

    graph.addEdge({
      id: 'edge.worship1',
      source: agentId,
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 3,
        ticksAtCurrentTier: 90,
        establishedTick: 0,
        totalEssenceSpent: 200,
        maintenanceCurrent: true,
      },
    });

    const result = dropAgent(graph, ascendantId, agentId, 100);

    expect(result.tierWhenDropped).toBe(3);
    expect(result.narrativeConsequence).toBe('wild_card');
    expect(result.scarTraitAssigned).toBe(true);

    // Check that the scar trait was actually assigned
    const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
    const scarEdge = traitEdges.find((e) => e.target === 'trait.abandoned_by_divine');
    expect(scarEdge).toBeDefined();
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/influence.test.ts`
Expected: FAIL — functions not exported from '../influence'

### Step 3: Implement tier management functions

Append to `src/engine/influence.ts`:

```typescript
import {
  // ... existing imports ...
  TIER_MAINTENANCE,
  TIER_PROMOTION_THRESHOLDS,
  type InfluenceTier,
  type InfluenceRelationshipProperties,
} from '../types/influence';
import { assignTrait } from './traits';

// ─── Tier Queries ────────────────────────────────────────────────────

/** Get the current influence tier of an actor relative to an ascendant. Returns 0 if no relationship. */
export function getInfluenceTier(
  graph: WorldGraph,
  ascendantId: string,
  actorId: string
): InfluenceTier {
  const edges = graph.getOutgoingEdges(actorId, 'worships');
  const worshipEdge = edges.find((e) => e.target === ascendantId);
  if (!worshipEdge) return 0;
  return (worshipEdge.properties.tier as InfluenceTier) ?? 0;
}

// ─── Maintenance ─────────────────────────────────────────────────────

export interface MaintenanceResult {
  maintenancePaid: string[];
  maintenanceFailed: string[];
  totalEssenceSpent: number;
}

/**
 * Process maintenance for all of an ascendant's influenced actors.
 * Deducts essence from the ascendant's primary sphere for each agent.
 * Mutates graph edge properties and ascendant's essencePool.
 */
export function processInfluenceMaintenance(
  graph: WorldGraph,
  ascendantId: string,
  _currentTick: number
): MaintenanceResult {
  const ascendant = graph.getNode(ascendantId);
  if (!ascendant) throw new Error(`Ascendant not found: ${ascendantId}`);

  const pool = ascendant.properties.essencePool as EssencePool;
  const alignment = ascendant.properties.sphereAlignment as SphereAlignment;
  const primarySphere = alignment.primary;

  const worshipEdges = graph.getIncomingEdges(ascendantId, 'worships');
  const result: MaintenanceResult = {
    maintenancePaid: [],
    maintenanceFailed: [],
    totalEssenceSpent: 0,
  };

  for (const edge of worshipEdges) {
    const tier = edge.properties.tier as InfluenceTier;
    const cost = TIER_MAINTENANCE[tier];

    if (cost === 0 || canAfford(pool, primarySphere, cost)) {
      if (cost > 0) {
        spendEssence(pool, primarySphere, cost);
        result.totalEssenceSpent += cost;
      }

      graph.updateEdge(edge.id, {
        properties: {
          ...edge.properties,
          ticksAtCurrentTier: (edge.properties.ticksAtCurrentTier as number) + 1,
          totalEssenceSpent: (edge.properties.totalEssenceSpent as number) + cost,
          maintenanceCurrent: true,
        },
      });
      result.maintenancePaid.push(edge.source);
    } else {
      graph.updateEdge(edge.id, {
        properties: {
          ...edge.properties,
          maintenanceCurrent: false,
        },
      });
      result.maintenanceFailed.push(edge.source);
    }
  }

  // Write updated pool back
  graph.updateNode(ascendantId, {
    properties: { ...ascendant.properties, essencePool: pool },
  });

  return result;
}

// ─── Tier Promotion ──────────────────────────────────────────────────

/**
 * Check all influenced actors for tier promotion.
 * Promotes actors whose ticksAtCurrentTier meets the threshold for the next tier.
 * Returns list of promoted actor IDs.
 */
export function checkTierPromotion(graph: WorldGraph, ascendantId: string): string[] {
  const worshipEdges = graph.getIncomingEdges(ascendantId, 'worships');
  const promoted: string[] = [];

  for (const edge of worshipEdges) {
    const tier = edge.properties.tier as InfluenceTier;
    const ticks = edge.properties.ticksAtCurrentTier as number;
    const maintenanceCurrent = edge.properties.maintenanceCurrent as boolean;

    if (tier >= 4) continue; // can't promote past 4
    if (!maintenanceCurrent) continue; // must be current on maintenance

    const nextTier = (tier + 1) as InfluenceTier;
    const threshold = TIER_PROMOTION_THRESHOLDS[nextTier];

    if (ticks >= threshold) {
      graph.updateEdge(edge.id, {
        properties: {
          ...edge.properties,
          tier: nextTier,
          ticksAtCurrentTier: 0, // reset counter
        },
      });
      promoted.push(edge.source);
    }
  }

  return promoted;
}

// ─── Drop Agent ──────────────────────────────────────────────────────

export interface DropResult {
  agentId: string;
  tierWhenDropped: InfluenceTier;
  narrativeConsequence: 'minimal' | 'crisis_of_faith' | 'wild_card' | 'catastrophic_severance';
  scarTraitAssigned: boolean;
}

const DROP_CONSEQUENCES: Record<InfluenceTier, DropResult['narrativeConsequence']> = {
  0: 'minimal',
  1: 'minimal',
  2: 'crisis_of_faith',
  3: 'wild_card',
  4: 'catastrophic_severance',
};

/**
 * Drop an agent — remove the worships edge and apply consequences.
 * Higher-tier drops produce more dramatic narrative consequences.
 */
export function dropAgent(
  graph: WorldGraph,
  ascendantId: string,
  agentId: string,
  currentTick: number
): DropResult {
  const edges = graph.getIncomingEdges(ascendantId, 'worships');
  const worshipEdge = edges.find((e) => e.source === agentId);

  if (!worshipEdge) {
    return { agentId, tierWhenDropped: 0, narrativeConsequence: 'minimal', scarTraitAssigned: false };
  }

  const tier = worshipEdge.properties.tier as InfluenceTier;
  const consequence = DROP_CONSEQUENCES[tier];

  // Remove the relationship
  graph.removeEdge(worshipEdge.id);

  // Assign scar trait for tier 2+
  let scarAssigned = false;
  if (tier >= 2) {
    const scarTraitId = 'trait.abandoned_by_divine';
    const scarNode = graph.getNode(scarTraitId);
    if (scarNode) {
      assignTrait(graph, agentId, scarTraitId, { tick: currentTick, source: ascendantId });
      scarAssigned = true;
    }
  }

  return {
    agentId,
    tierWhenDropped: tier,
    narrativeConsequence: consequence,
    scarTraitAssigned: scarAssigned,
  };
}
```

### Step 4: Run tests to verify they pass

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/influence.test.ts`
Expected: PASS (all tests)

### Step 5: Commit

```bash
git add src/engine/influence.ts src/engine/__tests__/influence.test.ts
git commit -m "feat: add influence tier management, maintenance, and agent dropping"
```

---

## Task 4: Ascendant Creation

Generate archetypes, create the Ascendant + Avatar in the graph, wire them together.

**Files:**
- Create: `src/engine/ascendant.ts`
- Create: `src/engine/__tests__/ascendant.test.ts`

### Step 1: Write failing tests for ascendant creation

Create `src/engine/__tests__/ascendant.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  generateArchetypes,
  createAscendant,
} from '../ascendant';
import type { AscendantArchetype, AscendantCreationConfig, AvatarConfig, AscendantProperties } from '../../types/influence';
import { SPHERE_NAMES } from '../../types/index';

describe('Ascendant Archetype Generation', () => {
  it('generates the requested number of archetypes', () => {
    const archetypes = generateArchetypes(4, 42);
    expect(archetypes).toHaveLength(4);
  });

  it('each archetype has valid sphere alignment', () => {
    const archetypes = generateArchetypes(4, 42);
    for (const a of archetypes) {
      expect(SPHERE_NAMES).toContain(a.sphereAlignment.primary);
      expect(SPHERE_NAMES).toContain(a.sphereAlignment.secondary);
      expect(a.sphereAlignment.primary).not.toBe(a.sphereAlignment.secondary);
    }
  });

  it('each archetype has a personality seed with all 10 value pairs', () => {
    const archetypes = generateArchetypes(4, 42);
    for (const a of archetypes) {
      const keys = Object.keys(a.personalitySeed);
      expect(keys).toHaveLength(10);
      for (const val of Object.values(a.personalitySeed)) {
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('deterministic with same seed', () => {
    const a1 = generateArchetypes(4, 42);
    const a2 = generateArchetypes(4, 42);
    expect(a1).toEqual(a2);
  });

  it('different with different seed', () => {
    const a1 = generateArchetypes(4, 42);
    const a2 = generateArchetypes(4, 99);
    expect(a1).not.toEqual(a2);
  });
});

describe('Ascendant Creation', () => {
  let graph: WorldGraph;
  let archetype: AscendantArchetype;

  beforeEach(() => {
    graph = new WorldGraph();

    // Need a starting location
    graph.addNode({
      id: 'loc.start',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'location' },
    });

    archetype = generateArchetypes(1, 42)[0];
  });

  it('creates ascendant and avatar nodes in the graph', () => {
    const config: AscendantCreationConfig = {
      archetype,
      avatar: {
        name: 'The Wandering Sage',
        startLocationId: 'loc.start',
        formDescription: 'An old wizard with a gnarled staff',
      },
    };

    const result = createAscendant(graph, config);

    // Ascendant node exists
    const ascNode = graph.getNode(result.ascendantId);
    expect(ascNode).toBeDefined();
    expect(ascNode!.type).toBe('actor');
    expect((ascNode!.properties as AscendantProperties).actorType).toBe('ascendant');

    // Avatar node exists
    const avatarNode = graph.getNode(result.avatarId);
    expect(avatarNode).toBeDefined();
    expect(avatarNode!.type).toBe('actor');
    expect(avatarNode!.properties.actorType).toBe('individual');
  });

  it('wires avatar_of edge between avatar and ascendant', () => {
    const config: AscendantCreationConfig = {
      archetype,
      avatar: {
        name: 'The Wandering Sage',
        startLocationId: 'loc.start',
        formDescription: 'An old wizard',
      },
    };

    const result = createAscendant(graph, config);

    const avatarEdges = graph.getOutgoingEdges(result.avatarId, 'avatar_of');
    expect(avatarEdges).toHaveLength(1);
    expect(avatarEdges[0].target).toBe(result.ascendantId);
  });

  it('places avatar at starting location', () => {
    const config: AscendantCreationConfig = {
      archetype,
      avatar: {
        name: 'The Wandering Sage',
        startLocationId: 'loc.start',
        formDescription: 'An old wizard',
      },
    };

    const result = createAscendant(graph, config);

    const locEdges = graph.getOutgoingEdges(result.avatarId, 'located_at');
    expect(locEdges).toHaveLength(1);
    expect(locEdges[0].target).toBe('loc.start');
  });

  it('ascendant has empty essence pool and correct sphere alignment', () => {
    const config: AscendantCreationConfig = {
      archetype,
      avatar: {
        name: 'The Wandering Sage',
        startLocationId: 'loc.start',
        formDescription: 'An old wizard',
      },
    };

    const result = createAscendant(graph, config);
    const ascNode = graph.getNode(result.ascendantId)!;
    const props = ascNode.properties as AscendantProperties;

    expect(props.sphereAlignment).toEqual(archetype.sphereAlignment);
    expect(props.essencePool).toBeDefined();

    // All essence starts at 0
    for (const sphere of SPHERE_NAMES) {
      expect(props.essencePool[sphere]).toBe(0);
    }
  });

  it('ascendant has empty intervention history', () => {
    const config: AscendantCreationConfig = {
      archetype,
      avatar: {
        name: 'The Wandering Sage',
        startLocationId: 'loc.start',
        formDescription: 'An old wizard',
      },
    };

    const result = createAscendant(graph, config);
    const ascNode = graph.getNode(result.ascendantId)!;
    const props = ascNode.properties as AscendantProperties;

    expect(props.interventionHistory).toEqual({});
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/ascendant.test.ts`
Expected: FAIL — module '../ascendant' not found

### Step 3: Implement ascendant creation

Create `src/engine/ascendant.ts`:

```typescript
/**
 * Ascendant creation and archetype generation.
 *
 * The Ascendant is the player's divine entity. Created from a generated
 * archetype, it exists as an actor node in the graph with an avatar
 * (mortal individual) linked by avatar_of edge.
 */

import { SPHERE_NAMES, type SphereName } from '../types/index';
import type {
  AscendantArchetype,
  AscendantCreationConfig,
  AscendantProperties,
  SphereAlignment,
  EssencePool,
} from '../types/influence';
import { BASE_MAX_ESSENCE } from '../types/influence';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { WorldGraph } from './graph';
import { createEmptyEssencePool } from './influence';

// ─── Seeded PRNG (simple mulberry32) ─────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Archetype Names ─────────────────────────────────────────────────

const ARCHETYPE_TITLES: Record<SphereName, string[]> = {
  force: ['The Warlord Ascendant', 'The Iron Sovereign', 'The Storm Marshal'],
  matter: ['The Stone Architect', 'The Foundation Lord', 'The Earthshaper'],
  energy: ['The Flame Herald', 'The Lightning Weaver', 'The Radiant One'],
  life: ['The Verdant One', 'The Bloom Shepherd', 'The Lifebinder'],
  mind: ['The Dream Architect', 'The Thought Weaver', 'The Silent Oracle'],
  spirit: ['The Veil Walker', 'The Soul Shepherd', 'The Ethereal Guide'],
  time: ['The Chronicler', 'The Moment Keeper', 'The Tide Turner'],
  entropy: ['The Unraveler', 'The Ash Herald', 'The Void Whisperer'],
};

const VALUE_PAIRS: ValuePair[] = [
  'ambition_contentment',
  'courage_prudence',
  'cruelty_compassion',
  'cunning_honesty',
  'devotion_independence',
  'loyalty_treachery',
  'tradition_innovation',
  'dominance_humility',
  'wrath_patience',
  'greed_generosity',
];

// ─── Archetype Generation ────────────────────────────────────────────

/**
 * Generate a set of Ascendant archetypes for the player to choose from.
 * Deterministic given the same seed.
 */
export function generateArchetypes(count: number, seed: number): AscendantArchetype[] {
  const rng = mulberry32(seed);
  const archetypes: AscendantArchetype[] = [];

  // Shuffle spheres to pick distinct primaries
  const shuffled = [...SPHERE_NAMES].sort(() => rng() - 0.5);

  for (let i = 0; i < count; i++) {
    const primary = shuffled[i % shuffled.length];

    // Pick secondary: different from primary, prefer allies
    const candidates = SPHERE_NAMES.filter((s) => s !== primary);
    const secondary = candidates[Math.floor(rng() * candidates.length)];

    const alignment: SphereAlignment = { primary, secondary };

    // Generate personality seed
    const personalitySeed = {} as AxiologicalProfile;
    for (const pair of VALUE_PAIRS) {
      personalitySeed[pair] = (rng() * 2 - 1) * 0.6; // range [-0.6, 0.6] — moderate starting values
    }

    // Generate domain affinities (2-3 domains biased toward sphere)
    const domainAffinities: Partial<Record<ReachDomain, number>> = {};
    const domainCandidates = [...REACH_DOMAINS].sort(() => rng() - 0.5);
    const numDomains = 2 + Math.floor(rng() * 2); // 2-3 domains
    for (let d = 0; d < numDomains; d++) {
      domainAffinities[domainCandidates[d]] = 2 + Math.floor(rng() * 4); // raw score 2-5
    }

    const titles = ARCHETYPE_TITLES[primary];
    const title = titles[Math.floor(rng() * titles.length)];

    archetypes.push({
      id: `archetype.${primary}_${i}`,
      name: title,
      title,
      description: `A nascent deity aligned with ${primary} and ${secondary}.`,
      sphereAlignment: alignment,
      startingDomainAffinities: domainAffinities,
      personalitySeed,
      flavorText: `The cosmic currents of ${primary} and ${secondary} converge in this emerging divine presence.`,
    });
  }

  return archetypes;
}

// ─── Ascendant Creation ──────────────────────────────────────────────

export interface CreateAscendantResult {
  ascendantId: string;
  avatarId: string;
}

/**
 * Create an Ascendant and its Avatar in the world graph.
 *
 * Creates:
 * 1. Ascendant actor node with sphere alignment, empty essence pool, personality
 * 2. Avatar actor node (individual) at the starting location
 * 3. avatar_of edge (avatar → ascendant)
 * 4. located_at edge (avatar → starting location)
 */
export function createAscendant(
  graph: WorldGraph,
  config: AscendantCreationConfig
): CreateAscendantResult {
  const ascendantId = `asc.${config.archetype.id}`;
  const avatarId = `avatar.${config.archetype.id}`;

  const emptyPool: EssencePool = createEmptyEssencePool();

  const ascendantProperties: AscendantProperties = {
    actorType: 'ascendant',
    sphereAlignment: config.archetype.sphereAlignment,
    essencePool: emptyPool,
    maxEssence: BASE_MAX_ESSENCE,
    archetypeId: config.archetype.id,
    interventionHistory: {},
    avatarId,
  };

  // Create Ascendant node
  graph.addNode({
    id: ascendantId,
    type: 'actor',
    name: config.archetype.name,
    properties: ascendantProperties as unknown as Record<string, unknown>,
  });

  // Create Avatar node
  graph.addNode({
    id: avatarId,
    type: 'actor',
    name: config.avatar.name,
    properties: {
      actorType: 'individual',
      formDescription: config.avatar.formDescription,
      axiologicalProfile: config.archetype.personalitySeed,
    },
  });

  // Wire avatar_of edge
  graph.addEdge({
    id: `edge.avatar_of.${avatarId}`,
    source: avatarId,
    target: ascendantId,
    type: 'avatar_of',
    properties: {},
  });

  // Place avatar at starting location
  graph.addEdge({
    id: `edge.located_at.${avatarId}`,
    source: avatarId,
    target: config.avatar.startLocationId,
    type: 'located_at',
    properties: {},
  });

  return { ascendantId, avatarId };
}
```

### Step 4: Run tests to verify they pass

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/ascendant.test.ts`
Expected: PASS (all tests)

### Step 5: Commit

```bash
git add src/engine/ascendant.ts src/engine/__tests__/ascendant.test.ts
git commit -m "feat: add ascendant archetype generation and creation"
```

---

## Task 5: Integration Test — Ascendant Lifecycle

End-to-end test: create an Ascendant, generate essence over ticks, recruit an agent, process maintenance, promote tiers, drop an agent.

**Files:**
- Create: `src/engine/__tests__/influence-integration.test.ts`

### Step 1: Write the integration test

Create `src/engine/__tests__/influence-integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { Simulation } from '../simulation';
import { generateArchetypes, createAscendant } from '../ascendant';
import {
  computeEssenceGeneration,
  generateEssence,
  computeMaxEssence,
  processInfluenceMaintenance,
  checkTierPromotion,
  getInfluenceTier,
  dropAgent,
  spendEssence,
} from '../influence';
import type { AscendantProperties, EssencePool } from '../../types/influence';
import { SPHERE_NAMES } from '../../types/index';
import { RECRUIT_COST } from '../../types/influence';

describe('Ascendant Lifecycle Integration', () => {
  it('full lifecycle: create → generate → recruit → maintain → promote → drop', () => {
    const graph = new WorldGraph();

    // ── Setup world ──
    graph.addNode({
      id: 'loc.grove',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'location' },
    });

    // ── Create Ascendant ──
    const archetypes = generateArchetypes(4, 42);
    const { ascendantId, avatarId } = createAscendant(graph, {
      archetype: archetypes[0],
      avatar: {
        name: 'Elder Sage',
        startLocationId: 'loc.grove',
        formDescription: 'A weathered old wizard',
      },
    });

    // Verify creation
    expect(graph.getNode(ascendantId)).toBeDefined();
    expect(graph.getNode(avatarId)).toBeDefined();

    // ── Generate essence over 10 ticks ──
    const ascNode = graph.getNode(ascendantId)!;
    const pool = (ascNode.properties as AscendantProperties).essencePool;
    const maxEssence = computeMaxEssence(graph, ascendantId);

    for (let tick = 0; tick < 10; tick++) {
      const gen = computeEssenceGeneration(graph, ascendantId);
      generateEssence(pool, gen, maxEssence);
    }

    // Should have ~10 total essence (1.0 per tick × 10 ticks)
    const totalEssence = SPHERE_NAMES.reduce((sum, s) => sum + pool[s], 0);
    expect(totalEssence).toBeCloseTo(10.0, 1);

    // ── Recruit an agent ──
    graph.addNode({
      id: 'actor.warrior',
      type: 'actor',
      name: 'Thane Volkar',
      properties: { actorType: 'individual' },
    });

    // Spend recruit cost from primary sphere
    const alignment = (ascNode.properties as AscendantProperties).sphereAlignment;
    const canRecruit = spendEssence(pool, alignment.primary, RECRUIT_COST);
    expect(canRecruit).toBe(true);

    // Establish worships edge at tier 1
    graph.addEdge({
      id: 'edge.worship.warrior',
      source: 'actor.warrior',
      target: ascendantId,
      type: 'worships',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 0,
        establishedTick: 10,
        totalEssenceSpent: RECRUIT_COST,
        maintenanceCurrent: true,
      },
    });

    expect(getInfluenceTier(graph, ascendantId, 'actor.warrior')).toBe(1);

    // ── Process maintenance for 30 ticks (enough to promote to tier 2) ──
    for (let tick = 11; tick <= 40; tick++) {
      // Generate essence first
      const gen = computeEssenceGeneration(graph, ascendantId);
      generateEssence(pool, gen, computeMaxEssence(graph, ascendantId));

      // Write pool back to node
      graph.updateNode(ascendantId, {
        properties: { ...ascNode.properties, essencePool: pool },
      });

      // Process maintenance
      const maintResult = processInfluenceMaintenance(graph, ascendantId, tick);
      expect(maintResult.maintenanceFailed).toHaveLength(0);

      // Check for promotions
      checkTierPromotion(graph, ascendantId);
    }

    // After 30 ticks of tier 1, should be promoted to tier 2
    expect(getInfluenceTier(graph, ascendantId, 'actor.warrior')).toBe(2);

    // ── Drop the agent ──
    // First add the scar trait definition
    graph.addNode({
      id: 'trait.abandoned_by_divine',
      type: 'trait',
      name: 'Abandoned by the Divine',
      properties: {
        subcategory: 'scar',
        description: 'Once touched by divine purpose, now cast adrift.',
        importance: 0.7,
        maxLevel: 1,
        visibility: 'public',
        domainContributions: { heart: -0.5, star: -0.3 },
        tags: ['divine', 'abandonment'],
        flavorText: 'The silence where a god once whispered.',
      },
    });

    const dropResult = dropAgent(graph, ascendantId, 'actor.warrior', 41);
    expect(dropResult.tierWhenDropped).toBe(2);
    expect(dropResult.narrativeConsequence).toBe('crisis_of_faith');
    expect(dropResult.scarTraitAssigned).toBe(true);

    // Relationship should be gone
    expect(getInfluenceTier(graph, ascendantId, 'actor.warrior')).toBe(0);

    // Scar trait should be on the agent
    const traitEdges = graph.getOutgoingEdges('actor.warrior', 'has_trait');
    expect(traitEdges.some((e) => e.target === 'trait.abandoned_by_divine')).toBe(true);
  });
});
```

### Step 2: Run the integration test

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/influence-integration.test.ts`
Expected: PASS

### Step 3: Run full test suite to verify no regressions

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run`
Expected: ALL PASS (136 Phase 1 tests + new Phase 2A tests)

### Step 4: Commit

```bash
git add src/engine/__tests__/influence-integration.test.ts
git commit -m "feat: add ascendant lifecycle integration test"
```

---

## Summary

**Phase 2A delivers:**
- `src/types/influence.ts` — All influence & ascendant type definitions
- `src/engine/influence.ts` — Essence pool management, generation, maintenance, tier promotion, agent dropping
- `src/engine/ascendant.ts` — Archetype generation, ascendant + avatar creation
- 3 test files covering unit + integration tests

**What Phase 2B needs from this:**
- `EssencePool` and `spendEssence()` — for divine toolkit costs
- `getInfluenceTier()` — for tier-gating Dream Interface actions
- `AscendantProperties.interventionHistory` — for identity drift tracking
- `InfluenceRelationshipProperties` on worships edges — for per-agent state

**What Phase 2C needs from this:**
- `InfluenceTier` and maintenance tracking — for stealth/detection scaling
- `AscendantProperties.sphereAlignment` — for detection calculations
