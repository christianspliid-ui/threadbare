# Culture Pass 2: Cultural Traits + Narrative Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire culture content into agents (via traits) and into the narrative engine (via tension scoring and cultural voice), so cultures are mechanically and narratively visible.

**Architecture:** Three layers: (1) extend trait system with `cultural` category + trait instantiation from seeds, (2) add cultural tension scoring to the narrative context builder, (3) enrich the NarrativeContext with cultural voice intensity and insider beat availability.

**Tech Stack:** TypeScript, Vitest, existing graph/trait/narrative engines

---

## Scope

From the Culture Bounded Context design (§2, §5, §8), Pass 2 covers:

1. **`cultural` trait category** — 7th trait category with strength-gating
2. **Trait instantiation from seeds** — culture → formative + behavioral traits on agents at seeding
3. **Cultural strength-gated domain contributions** — behavioral traits scale with culturalStrength
4. **Cultural tension scoring in context builder** — 4 tension types (mismatch, conquest, dual, fanaticism)
5. **Cultural voice enrichment in NarrativeContext** — culturalStrength, culturalTension, insider beat availability
6. **Insider beat detection** — which culture-gated beats can fire for a given agent+location

**Not in scope (Pass 3):** cultural drift, conquest dynamics, location historical/current dual-layer changes, artifact cultural resonance modifiers.

---

### Task 1: Extend TraitCategory with `cultural`

**Files:**
- Modify: `src/types/traits.ts:8` (TraitCategory union)
- Modify: `src/types/traits.ts:30-42` (TraitDefinitionProperties — add optional `strengthThresholds`)
- Test: `src/types/__tests__/traits-cultural.test.ts` (new)

**Step 1: Write the failing test**

Create `src/types/__tests__/traits-cultural.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { TraitCategory, TraitDefinitionProperties } from '../traits';

describe('cultural trait category', () => {
  it('accepts cultural as a valid TraitCategory', () => {
    const cat: TraitCategory = 'cultural';
    expect(cat).toBe('cultural');
  });

  it('TraitDefinitionProperties supports strengthThresholds', () => {
    const def: TraitDefinitionProperties = {
      subcategory: 'cultural',
      description: 'Test cultural trait',
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { iron: 2 },
      tags: ['test'],
      flavorText: 'Test',
      strengthThresholds: {
        fanatical: 'Extreme expression',
        strong: 'Clear expression',
        fading: 'Faint expression',
        silent: 'Dormant',
      },
    };
    expect(def.subcategory).toBe('cultural');
    expect(def.strengthThresholds?.fanatical).toBe('Extreme expression');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/traits-cultural.test.ts`
Expected: FAIL — `cultural` not assignable to `TraitCategory`, `strengthThresholds` not in type

**Step 3: Write minimal implementation**

In `src/types/traits.ts`:

1. Add `'cultural'` to TraitCategory:
```typescript
export type TraitCategory = 'innate' | 'mastery' | 'reputation' | 'scar' | 'condition' | 'destiny' | 'cultural';
```

2. Import `CulturalStrengthRange` from culture-content and add optional field:
```typescript
import type { CulturalStrengthRange } from '../data/culture-content';

// In TraitDefinitionProperties, add:
  strengthThresholds?: Partial<Record<CulturalStrengthRange, string>>;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/traits-cultural.test.ts`
Expected: PASS

**Step 5: Run full suite to check no regressions**

Run: `npx vitest run`
Expected: All existing tests pass (cultural is additive to the union)

**Step 6: Commit**

```bash
git add src/types/traits.ts src/types/__tests__/traits-cultural.test.ts
git commit -m "feat(culture): add cultural trait category with strengthThresholds"
```

---

### Task 2: Create culturalTraits engine — instantiate traits from seeds

**Files:**
- Create: `src/engine/culturalTraits.ts`
- Test: `src/engine/__tests__/culturalTraits.test.ts` (new)

This module converts culture-content.ts trait seeds into real graph nodes (trait definitions) and assigns them to agents via `has_trait` edges.

**Step 1: Write the failing tests**

Create `src/engine/__tests__/culturalTraits.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  instantiateFormativeTraits,
  instantiateBehavioralTraits,
  grantFormativeTraits,
  grantBehavioralTraits,
  getEffectiveCulturalContributions,
} from '../culturalTraits';
import type { CultureIdentity } from '../../types/culture';

const TEST_IDENTITY: CultureIdentity = {
  foundationBias: 'chaos',
  veneratedSpheres: ['force'],
  primaryBiome: 'grassland',
  socialStructure: 'Fluid hierarchy',
  accountability: 'Personal honor',
  behavioralKeywords: ['storm-born'],
  materialVocabulary: ['horsehair'],
  metaphorPalette: ['the sea of grass'],
  formativeTraitSeedIds: ['weapon_mastery', 'battle_tactics'],
  behavioralTraitSeedIds: ['challenge_compulsion', 'glory_seeking'],
};

describe('culturalTraits', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  describe('instantiateFormativeTraits', () => {
    it('creates trait definition nodes from seed IDs', () => {
      const ids = instantiateFormativeTraits(graph, TEST_IDENTITY.formativeTraitSeedIds);
      expect(ids.length).toBe(2);
      for (const id of ids) {
        const node = graph.getNode(id);
        expect(node).toBeDefined();
        expect(node!.type).toBe('trait');
        const props = node!.properties as any;
        expect(props.subcategory).toBe('innate');
      }
    });

    it('is idempotent — does not duplicate nodes', () => {
      instantiateFormativeTraits(graph, TEST_IDENTITY.formativeTraitSeedIds);
      instantiateFormativeTraits(graph, TEST_IDENTITY.formativeTraitSeedIds);
      const nodes = graph.getNodesByType('trait');
      const formative = nodes.filter(n => (n.properties as any).subcategory === 'innate'
        && (n.properties as any).culturalOrigin === true);
      expect(formative.length).toBe(2);
    });
  });

  describe('instantiateBehavioralTraits', () => {
    it('creates trait definition nodes with cultural category', () => {
      const ids = instantiateBehavioralTraits(graph, TEST_IDENTITY.behavioralTraitSeedIds);
      expect(ids.length).toBe(2);
      for (const id of ids) {
        const node = graph.getNode(id);
        expect(node).toBeDefined();
        const props = node!.properties as any;
        expect(props.subcategory).toBe('cultural');
        expect(props.strengthThresholds).toBeDefined();
      }
    });
  });

  describe('grantFormativeTraits', () => {
    it('assigns formative traits to an actor via has_trait edges', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
      const traitIds = instantiateFormativeTraits(graph, TEST_IDENTITY.formativeTraitSeedIds);
      grantFormativeTraits(graph, 'actor_1', traitIds, 0);
      const edges = graph.getOutgoingEdges('actor_1', 'has_trait');
      expect(edges.length).toBe(2);
      expect(edges.every(e => (e.properties as any).source === 'cultural_formative')).toBe(true);
    });
  });

  describe('grantBehavioralTraits', () => {
    it('assigns behavioral traits to an actor', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
      const traitIds = instantiateBehavioralTraits(graph, TEST_IDENTITY.behavioralTraitSeedIds);
      grantBehavioralTraits(graph, 'actor_1', traitIds, 0);
      const edges = graph.getOutgoingEdges('actor_1', 'has_trait');
      expect(edges.length).toBe(2);
      expect(edges.every(e => (e.properties as any).source === 'cultural_behavioral')).toBe(true);
    });
  });

  describe('getEffectiveCulturalContributions', () => {
    it('scales behavioral trait contributions by cultural strength', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
      graph.addNode({ id: 'culture_0', type: 'actor', name: 'Test Culture', properties: { actorType: 'culture' } });
      graph.addEdge({
        id: 'e_belongs', source: 'actor_1', target: 'culture_0',
        type: 'belongs_to', properties: { culturalStrength: 0.5 },
      });
      const traitIds = instantiateBehavioralTraits(graph, ['challenge_compulsion']);
      grantBehavioralTraits(graph, 'actor_1', traitIds, 0);
      const contributions = getEffectiveCulturalContributions(graph, 'actor_1');
      // challenge_compulsion has iron: 2 — at strength 0.5, effective = 1.0
      expect(contributions.iron).toBeCloseTo(1.0, 1);
    });

    it('returns full contributions at strength 1.0', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
      graph.addNode({ id: 'culture_0', type: 'actor', name: 'Test Culture', properties: { actorType: 'culture' } });
      graph.addEdge({
        id: 'e_belongs', source: 'actor_1', target: 'culture_0',
        type: 'belongs_to', properties: { culturalStrength: 1.0 },
      });
      const traitIds = instantiateBehavioralTraits(graph, ['challenge_compulsion']);
      grantBehavioralTraits(graph, 'actor_1', traitIds, 0);
      const contributions = getEffectiveCulturalContributions(graph, 'actor_1');
      expect(contributions.iron).toBeCloseTo(2.0, 1);
    });

    it('returns zero contributions below silent threshold', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
      graph.addNode({ id: 'culture_0', type: 'actor', name: 'Test Culture', properties: { actorType: 'culture' } });
      graph.addEdge({
        id: 'e_belongs', source: 'actor_1', target: 'culture_0',
        type: 'belongs_to', properties: { culturalStrength: 0.1 },
      });
      const traitIds = instantiateBehavioralTraits(graph, ['challenge_compulsion']);
      grantBehavioralTraits(graph, 'actor_1', traitIds, 0);
      const contributions = getEffectiveCulturalContributions(graph, 'actor_1');
      // Below 0.3 = silent = zero
      expect(contributions.iron ?? 0).toBe(0);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/culturalTraits.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `src/engine/culturalTraits.ts`:

```typescript
/**
 * Cultural Trait Instantiation and Contribution Scaling.
 *
 * Converts culture-content.ts trait seeds into real graph nodes (trait definitions)
 * and assigns them to agents. Behavioral traits scale with cultural strength.
 *
 * Source: Docs/plans/2026-03-06-culture-bounded-context-design.md §2
 */

import type { WorldGraph } from './graph';
import type { TraitDefinitionProperties, TraitAssignmentProperties, DomainContributions, ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import { getFormativeTraitSeed, getBehavioralTraitSeed } from '../data/culture-content';

// ─── Constants ──────────────────────────────────────────────────

/** Cultural strength thresholds for behavioral trait scaling */
export const CULTURAL_STRENGTH_THRESHOLDS = {
  fanatical: 0.8,
  strong: 0.5,
  fading: 0.3,
  silent: 0.0,
} as const;

// ─── Trait Node Instantiation ───────────────────────────────────

/**
 * Create trait definition nodes from formative seed IDs.
 * Formative traits use the 'innate' category (permanent cultural skills).
 * Idempotent — skips if node already exists.
 */
export function instantiateFormativeTraits(
  graph: WorldGraph,
  seedIds: string[],
): string[] {
  const createdIds: string[] = [];
  for (const seedId of seedIds) {
    const nodeId = `trait_formative_${seedId}`;
    if (graph.getNode(nodeId)) {
      createdIds.push(nodeId);
      continue;
    }
    const seed = getFormativeTraitSeed(seedId);
    if (!seed) continue;

    const props: TraitDefinitionProperties = {
      subcategory: 'innate',
      description: seed.description,
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: seed.domainContributions,
      tags: [...seed.tags, 'cultural_formative'],
      flavorText: seed.description,
      culturalOrigin: true,
    } as TraitDefinitionProperties & { culturalOrigin: boolean };

    graph.addNode({
      id: nodeId,
      type: 'trait',
      name: seed.name,
      properties: props as unknown as Record<string, unknown>,
    });
    createdIds.push(nodeId);
  }
  return createdIds;
}

/**
 * Create trait definition nodes from behavioral seed IDs.
 * Behavioral traits use the 'cultural' category (strength-gated).
 * Idempotent — skips if node already exists.
 */
export function instantiateBehavioralTraits(
  graph: WorldGraph,
  seedIds: string[],
): string[] {
  const createdIds: string[] = [];
  for (const seedId of seedIds) {
    const nodeId = `trait_behavioral_${seedId}`;
    if (graph.getNode(nodeId)) {
      createdIds.push(nodeId);
      continue;
    }
    const seed = getBehavioralTraitSeed(seedId);
    if (!seed) continue;

    const props: TraitDefinitionProperties & { strengthThresholds: typeof seed.strengthThresholds } = {
      subcategory: 'cultural',
      description: seed.description,
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: seed.domainContributions,
      tags: [...seed.tags, 'cultural_behavioral'],
      flavorText: seed.description,
      strengthThresholds: seed.strengthThresholds,
    };

    graph.addNode({
      id: nodeId,
      type: 'trait',
      name: seed.name,
      properties: props as unknown as Record<string, unknown>,
    });
    createdIds.push(nodeId);
  }
  return createdIds;
}

// ─── Trait Assignment ───────────────────────────────────────────

/**
 * Grant formative traits to an actor (permanent, not strength-gated).
 */
export function grantFormativeTraits(
  graph: WorldGraph,
  actorId: string,
  traitNodeIds: string[],
  tick: number,
): void {
  for (const traitId of traitNodeIds) {
    const edgeId = `e.has_trait.${actorId}.${traitId}`;
    // Skip if already assigned
    const existing = graph.getOutgoingEdges(actorId, 'has_trait').find(e => e.target === traitId);
    if (existing) continue;

    const assignment: TraitAssignmentProperties = {
      level: 1,
      acquiredTick: tick,
      lastReinforcedTick: tick,
      source: 'cultural_formative',
      visibility: 'public',
    };

    graph.addEdge({
      id: edgeId,
      source: actorId,
      target: traitId,
      type: 'has_trait',
      properties: assignment as unknown as Record<string, unknown>,
    });
  }
}

/**
 * Grant behavioral traits to an actor (strength-gated via cultural strength).
 */
export function grantBehavioralTraits(
  graph: WorldGraph,
  actorId: string,
  traitNodeIds: string[],
  tick: number,
): void {
  for (const traitId of traitNodeIds) {
    const edgeId = `e.has_trait.${actorId}.${traitId}`;
    const existing = graph.getOutgoingEdges(actorId, 'has_trait').find(e => e.target === traitId);
    if (existing) continue;

    const assignment: TraitAssignmentProperties = {
      level: 1,
      acquiredTick: tick,
      lastReinforcedTick: tick,
      source: 'cultural_behavioral',
      visibility: 'public',
    };

    graph.addEdge({
      id: edgeId,
      source: actorId,
      target: traitId,
      type: 'has_trait',
      properties: assignment as unknown as Record<string, unknown>,
    });
  }
}

// ─── Strength-Gated Contributions ───────────────────────────────

/**
 * Get an actor's max cultural strength (from belongs_to edges).
 */
export function getActorCulturalStrength(graph: WorldGraph, actorId: string): number {
  const edges = graph.getOutgoingEdges(actorId, 'belongs_to');
  if (edges.length === 0) return 0;
  return Math.max(...edges.map(e => (e.properties as any).culturalStrength ?? 0));
}

/**
 * Get the strength range label for a given cultural strength value.
 */
export function getStrengthRange(strength: number): 'fanatical' | 'strong' | 'fading' | 'silent' {
  if (strength >= CULTURAL_STRENGTH_THRESHOLDS.fanatical) return 'fanatical';
  if (strength >= CULTURAL_STRENGTH_THRESHOLDS.strong) return 'strong';
  if (strength >= CULTURAL_STRENGTH_THRESHOLDS.fading) return 'fading';
  return 'silent';
}

/**
 * Compute effective domain contributions from cultural behavioral traits,
 * scaled by the actor's cultural strength.
 *
 * Formative traits are NOT scaled (they're permanent innate skills).
 * Only 'cultural' category traits are scaled.
 * Below 'silent' threshold (0.3), behavioral traits contribute 0.
 */
export function getEffectiveCulturalContributions(
  graph: WorldGraph,
  actorId: string,
): DomainContributions {
  const strength = getActorCulturalStrength(graph, actorId);
  const range = getStrengthRange(strength);

  // Silent = no behavioral trait contributions
  if (range === 'silent') return {};

  const result: Record<string, number> = {};
  const traitEdges = graph.getOutgoingEdges(actorId, 'has_trait');

  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;

    const props = traitNode.properties as any;
    // Only scale 'cultural' category traits
    if (props.subcategory !== 'cultural') continue;

    const contributions = props.domainContributions as DomainContributions | undefined;
    if (!contributions) continue;

    const assignment = edge.properties as any as TraitAssignmentProperties;

    for (const domain of REACH_DOMAINS) {
      const base = contributions[domain] ?? 0;
      if (base > 0) {
        // Scale by cultural strength
        result[domain] = (result[domain] ?? 0) + base * assignment.level * strength;
      }
    }
  }

  return result as DomainContributions;
}
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/culturalTraits.test.ts`
Expected: PASS (all 8 tests)

**Step 5: Commit**

```bash
git add src/engine/culturalTraits.ts src/engine/__tests__/culturalTraits.test.ts
git commit -m "feat(culture): cultural trait instantiation and strength-gated contributions"
```

---

### Task 3: Wire cultural trait granting into worldSeed

**Files:**
- Modify: `src/engine/worldSeed.ts` — add trait instantiation + granting after culture assignment
- Test: `src/engine/__tests__/worldSeed.test.ts` — add 3 tests

**Step 1: Write the failing tests**

Add to `src/engine/__tests__/worldSeed.test.ts`:

```typescript
describe('seedWorld cultural traits', () => {
  it('creates formative trait definition nodes in the graph', () => {
    const { graph } = seedWorld(testCosmology, testTiles, 42);
    const traitNodes = graph.getNodesByType('trait');
    const formative = traitNodes.filter(n =>
      (n.properties as any).subcategory === 'innate'
      && n.id.startsWith('trait_formative_'));
    expect(formative.length).toBeGreaterThan(0);
  });

  it('creates behavioral trait definition nodes in the graph', () => {
    const { graph } = seedWorld(testCosmology, testTiles, 42);
    const traitNodes = graph.getNodesByType('trait');
    const behavioral = traitNodes.filter(n =>
      (n.properties as any).subcategory === 'cultural'
      && n.id.startsWith('trait_behavioral_'));
    expect(behavioral.length).toBeGreaterThan(0);
  });

  it('grants cultural traits to individual actors with culture', () => {
    const { graph, individualIds } = seedWorld(testCosmology, testTiles, 42);
    // Find individuals with culture
    const withCulture = individualIds.filter(id =>
      graph.getOutgoingEdges(id, 'belongs_to').length > 0
    );
    expect(withCulture.length).toBeGreaterThan(0);
    // At least some should have cultural traits
    const withTraits = withCulture.filter(id =>
      graph.getOutgoingEdges(id, 'has_trait').length > 0
    );
    expect(withTraits.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/worldSeed.test.ts`
Expected: FAIL — no trait nodes created yet

**Step 3: Write implementation**

In `src/engine/worldSeed.ts`:

1. Add imports:
```typescript
import {
  instantiateFormativeTraits,
  instantiateBehavioralTraits,
  grantFormativeTraits,
  grantBehavioralTraits,
} from './culturalTraits';
```

2. After `assignCulturesToActors(...)`, add a new section:

```typescript
  // ── Cultural trait instantiation + granting ──────────────────
  // For each culture, instantiate its trait seed definitions as graph nodes
  // Then grant to all actors that belong to that culture
  for (const cultureId of cultureIds) {
    const cultureNode = graph.getNode(cultureId);
    if (!cultureNode) continue;
    const identity = cultureNode.properties.cultureIdentity as CultureIdentity | undefined;
    if (!identity) continue;

    const formativeIds = instantiateFormativeTraits(graph, identity.formativeTraitSeedIds);
    const behavioralIds = instantiateBehavioralTraits(graph, identity.behavioralTraitSeedIds);

    // Find all actors belonging to this culture
    const belongEdges = graph.getEdgesByType('belongs_to')
      .filter(e => e.target === cultureId);

    for (const edge of belongEdges) {
      const actorNode = graph.getNode(edge.source);
      if (!actorNode || actorNode.type !== 'actor') continue;
      const actorType = actorNode.properties.actorType as string;
      if (actorType !== 'individual' && actorType !== 'faction') continue;

      grantFormativeTraits(graph, edge.source, formativeIds, 0);
      grantBehavioralTraits(graph, edge.source, behavioralIds, 0);
    }
  }
```

3. Add import for CultureIdentity:
```typescript
import type { CultureIdentity } from '../types/culture';
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/worldSeed.test.ts`
Expected: PASS (all tests including 3 new ones)

**Step 5: Commit**

```bash
git add src/engine/worldSeed.ts src/engine/__tests__/worldSeed.test.ts
git commit -m "feat(culture): grant cultural traits to actors at world seeding"
```

---

### Task 4: Create culturalTension module — tension scoring for context builder

**Files:**
- Create: `src/engine/culturalTension.ts`
- Test: `src/engine/__tests__/culturalTension.test.ts` (new)

**Step 1: Write the failing tests**

Create `src/engine/__tests__/culturalTension.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  detectCulturalMismatch,
  detectDualCultureTension,
  detectCulturalFanaticism,
  computeCulturalTensionScore,
  type CulturalTension,
} from '../culturalTension';

describe('culturalTension', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    // Two cultures
    graph.addNode({ id: 'culture_0', type: 'actor', name: 'Desert Warriors', properties: { actorType: 'culture' } });
    graph.addNode({ id: 'culture_1', type: 'actor', name: 'Forest Scholars', properties: { actorType: 'culture' } });
    // A location with culture_0 as current
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Oasis Town', properties: { terrain: 'desert' } });
    graph.addEdge({ id: 'e_loc_c0', source: 'loc_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 1.0, cultureLayer: 'current' } });
  });

  describe('detectCulturalMismatch', () => {
    it('returns mismatch when actor culture differs from location culture', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Scholar', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c1', source: 'actor_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.7 } });
      graph.addEdge({ id: 'e_a1_loc', source: 'actor_1', target: 'loc_1', type: 'located_at', properties: {} });

      const result = detectCulturalMismatch(graph, 'actor_1');
      expect(result).toBeDefined();
      expect(result!.type).toBe('mismatch');
      expect(result!.cultureIds).toContain('culture_1');
    });

    it('returns undefined when actor shares location culture', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Local', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.7 } });
      graph.addEdge({ id: 'e_a1_loc', source: 'actor_1', target: 'loc_1', type: 'located_at', properties: {} });

      expect(detectCulturalMismatch(graph, 'actor_1')).toBeUndefined();
    });
  });

  describe('detectDualCultureTension', () => {
    it('returns dual tension for balanced dual-culture actors', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Hybrid', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.5 } });
      graph.addEdge({ id: 'e_a1_c1', source: 'actor_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.4 } });

      const result = detectDualCultureTension(graph, 'actor_1');
      expect(result).toBeDefined();
      expect(result!.type).toBe('dual');
      expect(result!.cultureIds.length).toBe(2);
    });

    it('returns undefined for single-culture actors', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Mono', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.8 } });

      expect(detectDualCultureTension(graph, 'actor_1')).toBeUndefined();
    });
  });

  describe('detectCulturalFanaticism', () => {
    it('returns fanaticism for strength >= 0.8 encountering different culture', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Zealot', properties: { actorType: 'individual' } });
      graph.addNode({ id: 'actor_2', type: 'actor', name: 'Other', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.85 } });
      graph.addEdge({ id: 'e_a2_c1', source: 'actor_2', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.6 } });

      const result = detectCulturalFanaticism(graph, 'actor_1', 'actor_2');
      expect(result).toBeDefined();
      expect(result!.type).toBe('fanaticism');
    });

    it('returns undefined when neither actor is fanatical', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Normal', properties: { actorType: 'individual' } });
      graph.addNode({ id: 'actor_2', type: 'actor', name: 'Other', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.5 } });
      graph.addEdge({ id: 'e_a2_c1', source: 'actor_2', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.5 } });

      expect(detectCulturalFanaticism(graph, 'actor_1', 'actor_2')).toBeUndefined();
    });
  });

  describe('computeCulturalTensionScore', () => {
    it('returns combined score from all tension types', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Hybrid Zealot', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.5 } });
      graph.addEdge({ id: 'e_a1_c1', source: 'actor_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.45 } });
      graph.addEdge({ id: 'e_a1_loc', source: 'actor_1', target: 'loc_1', type: 'located_at', properties: {} });

      const { score, tensions } = computeCulturalTensionScore(graph, 'actor_1');
      expect(score).toBeGreaterThan(0);
      expect(tensions.length).toBeGreaterThan(0);
    });

    it('returns 0 for cultureless actors', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Wanderer', properties: { actorType: 'individual' } });
      const { score, tensions } = computeCulturalTensionScore(graph, 'actor_1');
      expect(score).toBe(0);
      expect(tensions.length).toBe(0);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/culturalTension.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `src/engine/culturalTension.ts`:

```typescript
/**
 * Cultural Tension Detection.
 *
 * Detects 4 types of cultural tension for narrative context scoring:
 * - mismatch: actor's culture differs from location's current culture
 * - conquest: location's historical culture differs from current
 * - dual: actor has two cultures at similar strength
 * - fanaticism: actor with strength >= 0.8 encounters different culture
 *
 * Source: Docs/plans/2026-03-06-culture-bounded-context-design.md §8
 */

import type { WorldGraph } from './graph';

// ─── Types ──────────────────────────────────────────────────────

export interface CulturalTension {
  type: 'mismatch' | 'conquest' | 'dual' | 'fanaticism';
  cultureIds: string[];
  severity: number;
}

// ─── Constants ──────────────────────────────────────────────────

export const CULTURAL_TENSION_SCORES = {
  mismatch: 3,
  conquest: 4,
  dual: 2,
  fanaticism: 3,
} as const;

const DUAL_CULTURE_THRESHOLD = 0.15; // max diff between strengths to count as "balanced"
const FANATICISM_THRESHOLD = 0.8;

// ─── Helpers ────────────────────────────────────────────────────

function getActorCultureEdges(graph: WorldGraph, actorId: string) {
  return graph.getOutgoingEdges(actorId, 'belongs_to')
    .filter(e => {
      const node = graph.getNode(e.target);
      return node?.type === 'actor' && (node.properties as any).actorType === 'culture';
    });
}

function getLocationCultureIds(graph: WorldGraph, locationId: string, layer?: 'historical' | 'current'): string[] {
  return graph.getOutgoingEdges(locationId, 'belongs_to')
    .filter(e => {
      const node = graph.getNode(e.target);
      if (!node || node.type !== 'actor' || (node.properties as any).actorType !== 'culture') return false;
      if (layer) return (e.properties as any).cultureLayer === layer;
      return true;
    })
    .map(e => e.target);
}

function getActorLocationId(graph: WorldGraph, actorId: string): string | undefined {
  const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
  if (locEdges.length > 0) return locEdges[0].target;
  // Also check contains edges (worldSeed uses 'contains' for placement)
  const containEdges = graph.getEdgesByType('contains')
    .filter(e => e.properties && Object.keys(e.properties).length === 0)
    .filter(e => e.source === actorId || e.target === actorId);
  // Not reliable — fall back
  return undefined;
}

// ─── Detection Functions ────────────────────────────────────────

/**
 * Detect cultural mismatch between an actor and their current location.
 */
export function detectCulturalMismatch(
  graph: WorldGraph,
  actorId: string,
): CulturalTension | undefined {
  const actorCultures = getActorCultureEdges(graph, actorId);
  if (actorCultures.length === 0) return undefined;

  // Find actor's location
  const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
  if (locEdges.length === 0) return undefined;
  const locationId = locEdges[0].target;

  const locationCurrentCultures = getLocationCultureIds(graph, locationId, 'current');
  if (locationCurrentCultures.length === 0) return undefined;

  const actorCultureIds = actorCultures.map(e => e.target);
  const overlap = actorCultureIds.some(id => locationCurrentCultures.includes(id));

  if (!overlap) {
    return {
      type: 'mismatch',
      cultureIds: [...actorCultureIds, ...locationCurrentCultures],
      severity: CULTURAL_TENSION_SCORES.mismatch,
    };
  }

  return undefined;
}

/**
 * Detect conquest tension at a location (historical != current culture).
 */
export function detectConquestTension(
  graph: WorldGraph,
  locationId: string,
): CulturalTension | undefined {
  const historical = getLocationCultureIds(graph, locationId, 'historical');
  const current = getLocationCultureIds(graph, locationId, 'current');

  if (historical.length === 0 || current.length === 0) return undefined;

  const mismatch = !historical.some(h => current.includes(h));
  if (mismatch) {
    return {
      type: 'conquest',
      cultureIds: [...historical, ...current],
      severity: CULTURAL_TENSION_SCORES.conquest,
    };
  }

  return undefined;
}

/**
 * Detect dual-culture internal tension for an actor with two similar-strength cultures.
 */
export function detectDualCultureTension(
  graph: WorldGraph,
  actorId: string,
): CulturalTension | undefined {
  const cultureEdges = getActorCultureEdges(graph, actorId);
  if (cultureEdges.length < 2) return undefined;

  // Sort by strength descending
  const sorted = cultureEdges
    .map(e => ({ id: e.target, strength: (e.properties as any).culturalStrength ?? 0 }))
    .sort((a, b) => b.strength - a.strength);

  const diff = sorted[0].strength - sorted[1].strength;
  if (diff <= DUAL_CULTURE_THRESHOLD) {
    return {
      type: 'dual',
      cultureIds: sorted.map(s => s.id),
      severity: CULTURAL_TENSION_SCORES.dual,
    };
  }

  return undefined;
}

/**
 * Detect fanaticism tension when an actor with strength >= 0.8 encounters a different culture.
 */
export function detectCulturalFanaticism(
  graph: WorldGraph,
  actorId: string,
  targetId?: string,
): CulturalTension | undefined {
  const actorCultures = getActorCultureEdges(graph, actorId);
  const maxStrength = Math.max(0, ...actorCultures.map(e => (e.properties as any).culturalStrength ?? 0));

  if (maxStrength < FANATICISM_THRESHOLD) return undefined;

  // Need a target with a different culture
  if (!targetId) return undefined;
  const targetCultures = getActorCultureEdges(graph, targetId);
  if (targetCultures.length === 0) return undefined;

  const actorCultureIds = new Set(actorCultures.map(e => e.target));
  const targetCultureIds = targetCultures.map(e => e.target);
  const differentCulture = targetCultureIds.some(id => !actorCultureIds.has(id));

  if (differentCulture) {
    return {
      type: 'fanaticism',
      cultureIds: [...actorCultureIds, ...targetCultureIds],
      severity: CULTURAL_TENSION_SCORES.fanaticism,
    };
  }

  return undefined;
}

/**
 * Compute total cultural tension score for an actor, collecting all applicable tensions.
 */
export function computeCulturalTensionScore(
  graph: WorldGraph,
  actorId: string,
  targetId?: string,
): { score: number; tensions: CulturalTension[] } {
  const tensions: CulturalTension[] = [];

  const mismatch = detectCulturalMismatch(graph, actorId);
  if (mismatch) tensions.push(mismatch);

  const dual = detectDualCultureTension(graph, actorId);
  if (dual) tensions.push(dual);

  if (targetId) {
    const fanaticism = detectCulturalFanaticism(graph, actorId, targetId);
    if (fanaticism) tensions.push(fanaticism);
  }

  // Check location conquest tension
  const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
  if (locEdges.length > 0) {
    const conquest = detectConquestTension(graph, locEdges[0].target);
    if (conquest) tensions.push(conquest);
  }

  const score = tensions.reduce((sum, t) => sum + t.severity, 0);
  return { score, tensions };
}
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/culturalTension.test.ts`
Expected: PASS (all 8 tests)

**Step 5: Commit**

```bash
git add src/engine/culturalTension.ts src/engine/__tests__/culturalTension.test.ts
git commit -m "feat(culture): cultural tension detection (mismatch, conquest, dual, fanaticism)"
```

---

### Task 5: Wire cultural tension into contextBuilder

**Files:**
- Modify: `src/engine/contextBuilder.ts` — add cultural tension to `rankObjects`
- Modify: `src/types/narrative.ts` — add cultural fields to NarrativeContext
- Test: `src/engine/__tests__/contextBuilder.test.ts` — add 3 tests

**Step 1: Write the failing tests**

Add to `src/engine/__tests__/contextBuilder.test.ts`:

```typescript
describe('cultural tension in ranking', () => {
  it('includes culturalTension in NarrativeContext when actor has cultural mismatch', () => {
    // Set up actor with culture_1 at location with culture_0
    const graph = new WorldGraph();
    // ... (set up cultures, actor, location per test fixture pattern)
    // Build context and verify culturalTension is populated
    const ctx = buildNarrativeContext(event, graph);
    expect(ctx.culturalTension).toBeDefined();
  });

  it('includes culturalStrength in NarrativeContext', () => {
    const ctx = buildNarrativeContext(event, graph);
    expect(typeof ctx.culturalStrength).toBe('number');
  });

  it('cultural tension boosts relevance score of nearby objects', () => {
    // Verify rankObjects returns higher scores for culturally-tense scenarios
  });
});
```

The subagent implementing this task should write full test fixtures matching existing contextBuilder test patterns.

**Step 2: Write implementation**

In `src/types/narrative.ts`, extend `NarrativeContext`:

```typescript
export interface NarrativeContext {
  event: NarrativeEvent;
  archetype?: string;
  contextObjects: ContextObject[];
  historicalFragments: string[];
  oppositionSummary: OppositionSummary;
  culturalStrength: number;           // 0-1, how strongly to apply cultural voice
  culturalTension?: {
    type: 'mismatch' | 'conquest' | 'dual' | 'fanaticism';
    cultureIds: string[];
    severity: number;
  };
}
```

In `src/engine/contextBuilder.ts`, in `buildNarrativeContext`:

1. Import `computeCulturalTensionScore` and `getActorCulturalStrength`
2. After building the opposition summary, compute cultural tension
3. Add the cultural fields to the returned NarrativeContext
4. In `rankObjects`, add cultural tension score as a bonus to relevance

**Step 3: Run tests**

Run: `npx vitest run src/engine/__tests__/contextBuilder.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/types/narrative.ts src/engine/contextBuilder.ts src/engine/__tests__/contextBuilder.test.ts
git commit -m "feat(culture): wire cultural tension scoring into narrative context builder"
```

---

### Task 6: Create insiderBeatDetection module

**Files:**
- Create: `src/engine/insiderBeatDetection.ts`
- Test: `src/engine/__tests__/insiderBeatDetection.test.ts` (new)

**Step 1: Write the failing tests**

```typescript
describe('insiderBeatDetection', () => {
  it('returns beats matching actor culture tags above min strength', () => {
    // Actor with force-culture at strength 0.6
    // Should match Blood Oath Challenge (requires force, min 0.5)
    const beats = getAvailableInsiderBeats(graph, 'actor_1');
    expect(beats.length).toBeGreaterThan(0);
    expect(beats.some(b => b.id === 'blood_oath_challenge')).toBe(true);
  });

  it('returns empty for cultureless actors', () => {
    const beats = getAvailableInsiderBeats(graph, 'cultureless_actor');
    expect(beats.length).toBe(0);
  });

  it('respects minimum strength threshold', () => {
    // Actor with culture at 0.3 — should not match beats requiring 0.5+
    const beats = getAvailableInsiderBeats(graph, 'weak_culture_actor');
    const highThreshold = beats.filter(b => b.minStrength > 0.3);
    expect(highThreshold.length).toBe(0);
  });
});
```

**Step 2: Write implementation**

Create `src/engine/insiderBeatDetection.ts`:

- `getAvailableInsiderBeats(graph, actorId)` — walks actor's culture edges, gets culture identity, matches insider beats by tags + strength threshold
- Returns `InsiderBeat[]` from culture-content.ts

**Step 3: Run tests, commit**

```bash
git add src/engine/insiderBeatDetection.ts src/engine/__tests__/insiderBeatDetection.test.ts
git commit -m "feat(culture): insider beat detection based on culture tags and strength"
```

---

### Task 7: Wire insider beats into NarrativeContext

**Files:**
- Modify: `src/types/narrative.ts` — add `availableInsiderBeats` to NarrativeContext
- Modify: `src/engine/contextBuilder.ts` — call insiderBeatDetection in buildNarrativeContext
- Test: `src/engine/__tests__/contextBuilder.test.ts` — add 2 tests

**Step 1: Write tests, then implementation**

Add `availableInsiderBeats: InsiderBeatSummary[]` to NarrativeContext:

```typescript
export interface InsiderBeatSummary {
  beatId: string;
  name: string;
  minStrength: number;
}
```

In `buildNarrativeContext`, after cultural tension computation:
```typescript
const availableBeats = getAvailableInsiderBeats(graph, event.actorId);
// Map to summaries
```

**Step 2: Run tests, commit**

```bash
git add src/types/narrative.ts src/engine/contextBuilder.ts src/engine/__tests__/contextBuilder.test.ts
git commit -m "feat(culture): wire insider beat detection into narrative context"
```

---

### Task 8: Integration test — full cultural pipeline

**Files:**
- Create: `src/engine/__tests__/culture-pass2-integration.test.ts`

**Step 1: Write integration test**

```typescript
describe('Culture Pass 2 integration', () => {
  it('full pipeline: seed world → traits granted → tension scored → beats available', () => {
    const { graph, individualIds, cultureIds } = seedWorld(cosmology, tiles, 42);

    // 1. Cultures exist
    expect(cultureIds.length).toBeGreaterThanOrEqual(2);

    // 2. Cultural trait nodes exist
    const traitNodes = graph.getNodesByType('trait');
    const culturalTraits = traitNodes.filter(n =>
      (n.properties as any).subcategory === 'cultural');
    expect(culturalTraits.length).toBeGreaterThan(0);

    // 3. Some actors have has_trait edges for cultural traits
    const withCulture = individualIds.filter(id =>
      graph.getOutgoingEdges(id, 'belongs_to').length > 0);
    const withTraits = withCulture.filter(id =>
      graph.getOutgoingEdges(id, 'has_trait').some(e =>
        e.target.startsWith('trait_behavioral_') || e.target.startsWith('trait_formative_')));
    expect(withTraits.length).toBeGreaterThan(0);

    // 4. Cultural tension can be computed
    const { computeCulturalTensionScore } = await import('../culturalTension');
    for (const actorId of withCulture.slice(0, 3)) {
      const { score } = computeCulturalTensionScore(graph, actorId);
      expect(typeof score).toBe('number');
    }
  });

  it('deterministic — same seed produces same cultural traits', () => {
    const r1 = seedWorld(cosmology, tiles, 99);
    const r2 = seedWorld(cosmology, tiles, 99);
    const traits1 = r1.graph.getNodesByType('trait').map(n => n.id).sort();
    const traits2 = r2.graph.getNodesByType('trait').map(n => n.id).sort();
    expect(traits1).toEqual(traits2);
  });
});
```

**Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (existing + ~30 new)

**Step 3: Commit**

```bash
git add src/engine/__tests__/culture-pass2-integration.test.ts
git commit -m "test(culture): Pass 2 integration tests — full pipeline verification"
```

---

### Task 9: Documentation updates

**Files:**
- Modify: `CLAUDE.md` — changelog + project status
- Obsidian MCP: Update Culture Generator.md, create Cultural Traits.md, update Index.md
- Notion: Update backlog

Use the `gamedocumenter` skill workflow. Add entries for:

1. New `cultural` trait category
2. culturalTraits.ts engine module
3. culturalTension.ts engine module
4. insiderBeatDetection.ts module
5. NarrativeContext cultural enrichment
6. Integration tests

Update CLAUDE.md project status:
- "Culture Pass 2 (Cultural Traits + Narrative Integration): ✅ Complete"
- Update engine stats

**Commit:**

```bash
git add CLAUDE.md
git commit -m "docs: update project status for culture Pass 2 completion"
```
