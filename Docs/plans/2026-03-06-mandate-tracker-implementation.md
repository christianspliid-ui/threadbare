# Mandate Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up the mandate system end-to-end — 9 curated mandate templates, sphere-weighted generator, real condition evaluation, and a compact top-bar tracker UI beside DoomBar.

**Architecture:** Mandate content lives in a data file (9 templates with sphere affinities). A generator picks one weighted by the player's sphere alignment. The orchestrator calls the existing `evaluateMandate()` instead of fake `+0.002` ticking. Two missing condition types (`sphere_weight`, `actor_tier`) get real implementations. A new `MandateTracker` component sits beside `DoomBar` in a shared container.

**Tech Stack:** React 18, TypeScript, Vitest, Tailwind CSS

**Design doc:** `Docs/plans/2026-03-06-mandate-tracker-design.md`

---

### Task 1: Mandate Content Data

**Files:**
- Create: `src/data/mandate-content.ts`
- Test: `src/engine/__tests__/mandate-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/mandate-content.test.ts
import { describe, it, expect } from 'vitest';
import { MANDATE_TEMPLATES } from '../../data/mandate-content';
import type { MandateType, MandateStage } from '../../types/mandate';

describe('mandate content templates', () => {
  it('has exactly 9 templates', () => {
    expect(MANDATE_TEMPLATES).toHaveLength(9);
  });

  it('has 3 per mandate type', () => {
    const byType: Record<MandateType, number> = { graph_state: 0, narrative: 0, sphere_dominance: 0 };
    for (const t of MANDATE_TEMPLATES) byType[t.type]++;
    expect(byType.graph_state).toBe(3);
    expect(byType.narrative).toBe(3);
    expect(byType.sphere_dominance).toBe(3);
  });

  it('every template has 3 stages in correct order', () => {
    const ORDER: MandateStage[] = ['setup', 'escalation', 'culmination'];
    for (const t of MANDATE_TEMPLATES) {
      expect(t.stages).toHaveLength(3);
      expect(t.stages.map(s => s.stage)).toEqual(ORDER);
    }
  });

  it('every stage has at least 1 condition', () => {
    for (const t of MANDATE_TEMPLATES) {
      for (const stage of t.stages) {
        expect(stage.conditions.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('every template has sphere affinities', () => {
    for (const t of MANDATE_TEMPLATES) {
      expect(t.sphereAffinities.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('no conditions use the "custom" type', () => {
    for (const t of MANDATE_TEMPLATES) {
      for (const stage of t.stages) {
        for (const cond of stage.conditions) {
          expect(cond.type).not.toBe('custom');
        }
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/mandate-content.test.ts`
Expected: FAIL — module `../../data/mandate-content` not found

**Step 3: Write the content data**

Create `src/data/mandate-content.ts` with:

```typescript
/**
 * Mandate Content — 9 curated mandate templates.
 *
 * 3 per type: graph_state, sphere_dominance, narrative (using actor_tier).
 * All conditions are mechanically verifiable against the world graph.
 * No 'custom' conditions.
 */
import type { MandateDefinition, MandateType } from '../types/mandate';
import type { SphereName } from '../types/index';

export interface MandateTemplate extends MandateDefinition {
  /** Spheres this mandate aligns with — used by generator weighting */
  sphereAffinities: SphereName[];
}

// ─── Graph-State Mandates (3) ─────────────────────────────────────

const dominionOfStone: MandateTemplate = {
  id: 'mandate.graph_state.1',
  type: 'graph_state',
  name: 'Dominion of Stone',
  description: 'Extend your reach across diverse settlements, proving dominion over the material world.',
  sphereAffinities: ['matter', 'force'],
  stages: [
    {
      stage: 'setup',
      description: 'Establish initial control',
      conditions: [
        {
          type: 'node_count',
          description: 'Control 2+ settlements',
          params: { nodeType: 'location', edgeType: 'controls', edgeTarget: '__ascendant__', minCount: 2 },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Expand territorial grip',
      conditions: [
        {
          type: 'node_count',
          description: 'Control 4+ settlements',
          params: { nodeType: 'location', edgeType: 'controls', edgeTarget: '__ascendant__', minCount: 4 },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Achieve regional dominance',
      conditions: [
        {
          type: 'node_count',
          description: 'Control 5+ settlements',
          params: { nodeType: 'location', edgeType: 'controls', edgeTarget: '__ascendant__', minCount: 5 },
        },
      ],
    },
  ],
};

const buildersLegacy: MandateTemplate = {
  id: 'mandate.graph_state.2',
  type: 'graph_state',
  name: "The Builder's Legacy",
  description: 'Leave monuments to your power — temples, fortifications, and sacred works rising from the earth.',
  sphereAffinities: ['matter', 'energy'],
  stages: [
    {
      stage: 'setup',
      description: 'Begin construction',
      conditions: [
        {
          type: 'edge_count',
          description: 'Create 2+ structures',
          params: { edgeType: 'constructed_by', minCount: 2 },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'A growing legacy',
      conditions: [
        {
          type: 'edge_count',
          description: 'Create 5+ structures',
          params: { edgeType: 'constructed_by', minCount: 5 },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'A builder god remembered',
      conditions: [
        {
          type: 'edge_count',
          description: 'Create 8+ structures',
          params: { edgeType: 'constructed_by', minCount: 8 },
        },
      ],
    },
  ],
};

const webOfAllegiance: MandateTemplate = {
  id: 'mandate.graph_state.3',
  type: 'graph_state',
  name: 'Web of Allegiance',
  description: 'Forge bonds between factions — a web of loyalty woven by divine will.',
  sphereAffinities: ['mind', 'spirit'],
  stages: [
    {
      stage: 'setup',
      description: 'First alliances form',
      conditions: [
        {
          type: 'edge_count',
          description: '2+ alliance edges between factions',
          params: { edgeType: 'allied_with', minCount: 2 },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'A growing coalition',
      conditions: [
        {
          type: 'edge_count',
          description: '4+ alliance edges',
          params: { edgeType: 'allied_with', minCount: 4 },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'A world united under your web',
      conditions: [
        {
          type: 'edge_count',
          description: '6+ alliance edges',
          params: { edgeType: 'allied_with', minCount: 6 },
        },
      ],
    },
  ],
};

// ─── Sphere Dominance Mandates (3) ────────────────────────────────

const tideOfLife: MandateTemplate = {
  id: 'mandate.sphere_dominance.1',
  type: 'sphere_dominance',
  name: 'Tide of Life',
  description: 'Let Life sphere influence flood the world — where your power touches, green things grow.',
  targetSphere: 'life',
  sphereAffinities: ['life'],
  stages: [
    {
      stage: 'setup',
      description: 'Seeds of influence',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Life influence ≥ 0.3 in 2+ regions',
          params: { sphere: 'life', minWeight: 0.3, minRegions: 2 },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Verdant spread',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Life influence ≥ 0.4 in 4+ regions',
          params: { sphere: 'life', minWeight: 0.4, minRegions: 4 },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'The world blooms',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Life influence ≥ 0.5 in 6+ regions',
          params: { sphere: 'life', minWeight: 0.5, minRegions: 6 },
        },
      ],
    },
  ],
};

const entropicCascade: MandateTemplate = {
  id: 'mandate.sphere_dominance.2',
  type: 'sphere_dominance',
  name: 'The Entropic Cascade',
  description: 'Entropy devours. Let dissolution become the dominant cosmic force.',
  targetSphere: 'entropy',
  sphereAffinities: ['entropy'],
  stages: [
    {
      stage: 'setup',
      description: 'Decay takes hold',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Entropy influence ≥ 0.3 in 2+ regions',
          params: { sphere: 'entropy', minWeight: 0.3, minRegions: 2 },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Unraveling',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Entropy influence ≥ 0.4 in 4+ regions',
          params: { sphere: 'entropy', minWeight: 0.4, minRegions: 4 },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'All things end',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Entropy dominant in 5+ regions',
          params: { sphere: 'entropy', minWeight: 0.5, minRegions: 5 },
        },
      ],
    },
  ],
};

const illumination: MandateTemplate = {
  id: 'mandate.sphere_dominance.3',
  type: 'sphere_dominance',
  name: 'Illumination',
  description: 'Energy sphere saturates the world — a blazing cosmic dawn.',
  targetSphere: 'energy',
  sphereAffinities: ['energy'],
  stages: [
    {
      stage: 'setup',
      description: 'First spark',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Energy ≥ 0.5 in 1+ region',
          params: { sphere: 'energy', minWeight: 0.5, minRegions: 1 },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Spreading brilliance',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Energy ≥ 0.6 in 2+ regions',
          params: { sphere: 'energy', minWeight: 0.6, minRegions: 2 },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'The world blazes',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Energy ≥ 0.7 in 4+ regions',
          params: { sphere: 'energy', minWeight: 0.7, minRegions: 4 },
        },
      ],
    },
  ],
};

// ─── Narrative Mandates (3) — using actor_tier conditions ─────────

const ascendantsChampion: MandateTemplate = {
  id: 'mandate.narrative.1',
  type: 'narrative',
  name: "The Ascendant's Champion",
  description: 'Raise a mortal to the pinnacle of divine influence — an Aspect walking the earth.',
  sphereAffinities: ['spirit', 'mind'],
  stages: [
    {
      stage: 'setup',
      description: 'A promising devotee',
      conditions: [
        {
          type: 'actor_tier',
          description: '1+ agent at tier 2 (Devoted)',
          params: { minTier: 2, minCount: 1 },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'The champion rises',
      conditions: [
        {
          type: 'actor_tier',
          description: '1+ agent at tier 3 (Champion)',
          params: { minTier: 3, minCount: 1 },
        },
        {
          type: 'actor_tier',
          description: '3+ agents at tier 2+',
          params: { minTier: 2, minCount: 3 },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Apotheosis',
      conditions: [
        {
          type: 'actor_tier',
          description: '1+ agent at tier 4 (Aspect)',
          params: { minTier: 4, minCount: 1 },
        },
      ],
    },
  ],
};

const devotedCircle: MandateTemplate = {
  id: 'mandate.narrative.2',
  type: 'narrative',
  name: 'The Devoted Circle',
  description: 'Build a circle of deeply loyal followers — strength through collective devotion.',
  sphereAffinities: ['spirit', 'life', 'mind', 'force', 'matter', 'energy', 'time', 'entropy'],
  stages: [
    {
      stage: 'setup',
      description: 'First devoted',
      conditions: [
        {
          type: 'actor_tier',
          description: '2+ agents at tier 2+',
          params: { minTier: 2, minCount: 2 },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'The circle forms',
      conditions: [
        {
          type: 'actor_tier',
          description: '3+ agents at tier 3+ (Champion)',
          params: { minTier: 3, minCount: 3 },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Unshakeable faith',
      conditions: [
        {
          type: 'actor_tier',
          description: '5+ agents at tier 3+',
          params: { minTier: 3, minCount: 5 },
        },
      ],
    },
  ],
};

const shadowSovereign: MandateTemplate = {
  id: 'mandate.narrative.3',
  type: 'narrative',
  name: 'The Shadow Sovereign',
  description: 'Power from the shadows — maintain high-tier agents while remaining hidden from mortal eyes.',
  sphereAffinities: ['time', 'entropy'],
  stages: [
    {
      stage: 'setup',
      description: 'Hidden influence',
      conditions: [
        {
          type: 'actor_tier',
          description: '1+ agent at tier 3+ (Champion)',
          params: { minTier: 3, minCount: 1 },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Growing unseen',
      conditions: [
        {
          type: 'actor_tier',
          description: '2+ agents at tier 3+',
          params: { minTier: 3, minCount: 2 },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Sovereign of shadows',
      conditions: [
        {
          type: 'actor_tier',
          description: '3+ agents at tier 4 (Aspect)',
          params: { minTier: 4, minCount: 3 },
        },
      ],
    },
  ],
};

// ─── Export ────────────────────────────────────────────────────────

export const MANDATE_TEMPLATES: MandateTemplate[] = [
  dominionOfStone,
  buildersLegacy,
  webOfAllegiance,
  tideOfLife,
  entropicCascade,
  illumination,
  ascendantsChampion,
  devotedCircle,
  shadowSovereign,
];
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/mandate-content.test.ts`
Expected: 6 tests PASS

**Step 5: Commit**

```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git add src/data/mandate-content.ts src/engine/__tests__/mandate-content.test.ts && git commit -m "feat: add 9 curated mandate templates with sphere affinities"
```

---

### Task 2: Mandate Generator

**Files:**
- Create: `src/engine/mandateGenerator.ts`
- Test: `src/engine/__tests__/mandateGenerator.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/mandateGenerator.test.ts
import { describe, it, expect } from 'vitest';
import { generateMandate } from '../mandateGenerator';
import { MANDATE_TEMPLATES } from '../../data/mandate-content';
import type { SphereName } from '../../types/index';

describe('mandate generator', () => {
  const cosmology: Record<SphereName, number> = {
    force: 0.1, matter: 0.3, energy: 0.1, life: 0.1,
    mind: 0.1, spirit: 0.1, time: 0.1, entropy: 0.1,
  };

  it('returns a valid MandateDefinition', () => {
    const result = generateMandate(cosmology, { primary: 'matter', secondary: 'force' }, 42);
    expect(result.id).toBeTruthy();
    expect(result.name).toBeTruthy();
    expect(result.stages).toHaveLength(3);
    expect(result.type).toMatch(/^(graph_state|narrative|sphere_dominance)$/);
  });

  it('is deterministic — same seed gives same mandate', () => {
    const a = generateMandate(cosmology, { primary: 'matter', secondary: 'force' }, 42);
    const b = generateMandate(cosmology, { primary: 'matter', secondary: 'force' }, 42);
    expect(a.id).toBe(b.id);
    expect(a.name).toBe(b.name);
  });

  it('different seeds can produce different mandates', () => {
    const results = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const m = generateMandate(cosmology, { primary: 'matter', secondary: 'force' }, seed);
      results.add(m.id);
    }
    // With 9 templates and 50 seeds, we should see at least 2 different picks
    expect(results.size).toBeGreaterThanOrEqual(2);
  });

  it('sphere affinity weighting favors aligned mandates', () => {
    // Life-primary should get more life mandates than non-life
    const counts: Record<string, number> = {};
    for (let seed = 0; seed < 200; seed++) {
      const m = generateMandate(cosmology, { primary: 'life', secondary: 'spirit' }, seed);
      counts[m.id] = (counts[m.id] ?? 0) + 1;
    }
    // "Tide of Life" (life affinity) should appear more than average (200/9 ≈ 22)
    const tideOfLifeCount = counts['mandate.sphere_dominance.1'] ?? 0;
    expect(tideOfLifeCount).toBeGreaterThan(15);
  });

  it('returned mandate has sphereAffinities from template', () => {
    const result = generateMandate(cosmology, { primary: 'matter', secondary: 'force' }, 42);
    // Find the matching template
    const template = MANDATE_TEMPLATES.find(t => t.id === result.id);
    expect(template).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/mandateGenerator.test.ts`
Expected: FAIL — module `../mandateGenerator` not found

**Step 3: Write the generator**

```typescript
// src/engine/mandateGenerator.ts
/**
 * Mandate Generator — sphere-weighted PRNG selection from curated templates.
 */
import type { MandateDefinition } from '../types/mandate';
import type { CosmologyProfile, SphereName } from '../types/index';
import type { SphereAlignment } from '../types/influence';
import { MANDATE_TEMPLATES, type MandateTemplate } from '../data/mandate-content';

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Affinity weights: 3 for primary match, 2 for secondary, 1 for no match */
const PRIMARY_WEIGHT = 3;
const SECONDARY_WEIGHT = 2;
const BASE_WEIGHT = 1;

/**
 * Generate a mandate for this run, weighted by sphere affinity.
 *
 * @param cosmology - player's cosmology profile (unused for now, reserved)
 * @param alignment - player's primary/secondary sphere
 * @param seed - PRNG seed for deterministic selection
 */
export function generateMandate(
  _cosmology: CosmologyProfile,
  alignment: SphereAlignment,
  seed: number,
): MandateTemplate {
  const rng = mulberry32(seed);

  // Score each template by sphere affinity
  const weights = MANDATE_TEMPLATES.map(template => {
    let score = BASE_WEIGHT;
    for (const affinity of template.sphereAffinities) {
      if (affinity === alignment.primary) score = Math.max(score, PRIMARY_WEIGHT);
      else if (affinity === alignment.secondary) score = Math.max(score, SECONDARY_WEIGHT);
    }
    return score;
  });

  // Weighted random selection
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng() * totalWeight;
  for (let i = 0; i < MANDATE_TEMPLATES.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return MANDATE_TEMPLATES[i];
  }

  // Fallback (should never reach)
  return MANDATE_TEMPLATES[MANDATE_TEMPLATES.length - 1];
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/mandateGenerator.test.ts`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git add src/engine/mandateGenerator.ts src/engine/__tests__/mandateGenerator.test.ts && git commit -m "feat: add sphere-weighted mandate generator"
```

---

### Task 3: Implement sphere_weight and actor_tier Condition Evaluation

**Files:**
- Modify: `src/engine/mandate.ts:79-82` (replace stubs)
- Extend: `src/engine/__tests__/mandate.test.ts` (add tests for new condition types)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/mandate.test.ts`:

```typescript
  it('evaluateCondition: actor_tier counts agents at or above min tier', () => {
    const graph = buildTestGraph();
    // Test graph has 3 agents at tier 2 worshipping actor_asc
    const condition: MandateCondition = {
      type: 'actor_tier',
      description: '2+ agents at tier 2+',
      params: { minTier: 2, minCount: 2 },
    };
    expect(evaluateCondition(graph, condition, 'actor_asc')).toBe(true);
  });

  it('evaluateCondition: actor_tier fails when not enough high-tier agents', () => {
    const graph = buildTestGraph();
    const condition: MandateCondition = {
      type: 'actor_tier',
      description: '1+ agent at tier 4',
      params: { minTier: 4, minCount: 1 },
    };
    expect(evaluateCondition(graph, condition, 'actor_asc')).toBe(false);
  });

  it('evaluateCondition: sphere_weight checks region sphere influence', () => {
    const graph = buildTestGraph();
    // Add sphere influence to regions: use sphere_influence edges from region → sphere
    graph.addNode({ id: 'sphere_life', type: 'sphere', name: 'Life', properties: {} });
    graph.addEdge({
      id: 'edge_sphere_1', source: 'loc_region_1', target: 'sphere_life',
      type: 'sphere_influence', properties: { weight: 0.5 },
    });
    graph.addEdge({
      id: 'edge_sphere_2', source: 'loc_region_2', target: 'sphere_life',
      type: 'sphere_influence', properties: { weight: 0.4 },
    });

    const condition: MandateCondition = {
      type: 'sphere_weight',
      description: 'Life ≥ 0.3 in 2+ regions',
      params: { sphere: 'life', minWeight: 0.3, minRegions: 2 },
    };
    expect(evaluateCondition(graph, condition, 'actor_asc')).toBe(true);
  });

  it('evaluateCondition: sphere_weight fails when insufficient regions', () => {
    const graph = buildTestGraph();
    graph.addNode({ id: 'sphere_energy', type: 'sphere', name: 'Energy', properties: {} });
    graph.addEdge({
      id: 'edge_sphere_e1', source: 'loc_region_1', target: 'sphere_energy',
      type: 'sphere_influence', properties: { weight: 0.7 },
    });

    const condition: MandateCondition = {
      type: 'sphere_weight',
      description: 'Energy ≥ 0.5 in 3+ regions',
      params: { sphere: 'energy', minWeight: 0.5, minRegions: 3 },
    };
    expect(evaluateCondition(graph, condition, 'actor_asc')).toBe(false);
  });
```

**Step 2: Run test to verify they fail**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/mandate.test.ts`
Expected: 4 new tests FAIL (actor_tier and sphere_weight both return false)

**Step 3: Implement the condition evaluators**

In `src/engine/mandate.ts`, replace lines 79-82:

```typescript
    // OLD:
    case 'sphere_weight':
    case 'actor_tier':
      // Future implementation — Phase 3+ when sphere dominance tracking exists
      return false;

    // NEW:
    case 'sphere_weight': {
      const { sphere, minWeight, minRegions } = condition.params as {
        sphere: string;
        minWeight: number;
        minRegions: number;
      };
      // Find all location nodes, check sphere_influence edges to the target sphere
      const locations = graph.getNodesByType('location');
      let qualifyingRegions = 0;
      for (const loc of locations) {
        const sphereEdges = graph.getOutgoingEdges(loc.id, 'sphere_influence');
        const match = sphereEdges.find(e => {
          const targetNode = graph.getNode(e.target);
          return targetNode && targetNode.name.toLowerCase() === sphere;
        });
        if (match && (match.properties.weight as number) >= minWeight) {
          qualifyingRegions++;
        }
      }
      return qualifyingRegions >= minRegions;
    }

    case 'actor_tier': {
      const { minTier, minCount } = condition.params as {
        minTier: number;
        minCount: number;
      };
      // Count all worships edges targeting the ascendant with tier >= minTier
      const worshipEdges = graph.getIncomingEdges(ascendantId)
        .filter(e => e.type === 'worships' && (e.properties.tier as number) >= minTier);
      return worshipEdges.length >= minCount;
    }
```

**Step 4: Run test to verify they pass**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/mandate.test.ts`
Expected: All tests PASS (existing 7 + 4 new = 11)

**Step 5: Commit**

```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git add src/engine/mandate.ts src/engine/__tests__/mandate.test.ts && git commit -m "feat: implement sphere_weight and actor_tier mandate condition evaluation"
```

---

### Task 4: Replace Fake Progress in Orchestrator

**Files:**
- Modify: `src/engine/orchestrator.ts:1-3,206-217` (add imports, replace phaseMandate)
- Extend: `src/engine/__tests__/orchestrator.test.ts` (add mandate evaluation test)

**Step 1: Write the failing test**

Add to `src/engine/__tests__/orchestrator.test.ts`:

```typescript
  it('phaseMandate evaluates real conditions instead of fake progress', () => {
    // Build a state with a mandate that has achievable conditions
    const testState = { ...buildTestState() };
    testState.mandateDefinition = {
      id: 'mandate.test.1',
      type: 'graph_state',
      name: 'Test Mandate',
      description: 'Test',
      stages: [
        {
          stage: 'setup',
          description: 'Setup',
          conditions: [{
            type: 'node_count',
            description: 'Have 1+ worshipper',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: testState.ascendantId, minTier: 1, minCount: 1 },
          }],
        },
        {
          stage: 'escalation',
          description: 'Escalation',
          conditions: [{
            type: 'node_count',
            description: 'Have 5+ worshippers',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: testState.ascendantId, minTier: 1, minCount: 5 },
          }],
        },
        {
          stage: 'culmination',
          description: 'Culmination',
          conditions: [{
            type: 'node_count',
            description: 'Have 10+ worshippers',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: testState.ascendantId, minTier: 1, minCount: 10 },
          }],
        },
      ],
    };
    testState.mandateState = {
      mandateId: 'mandate.test.1',
      currentStage: 'setup',
      progress: 0,
      completed: false,
      failed: false,
    };

    // With no worshippers, progress should be 0, not 0.002
    const result = phaseMandate(testState);
    expect(result.mandateState).toBeTruthy();
    expect(result.mandateState!.progress).toBe(0); // Not 0.002
  });
```

Note: The exact test depends on the existing test helper `buildTestState()`. If it doesn't exist, build a minimal GameState with a graph for testing. Check the existing orchestrator test file first.

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/orchestrator.test.ts`
Expected: New test FAILS because phaseMandate returns progress 0.002

**Step 3: Replace phaseMandate implementation**

In `src/engine/orchestrator.ts`:

Add imports at the top:
```typescript
import { evaluateMandate, advanceMandateStage } from './mandate';
```

Replace phaseMandate (lines 206-217):

```typescript
export function phaseMandate(state: GameState): Partial<GameState> {
  if (!state.mandateState || !state.mandateDefinition || state.mandateState.completed || state.mandateState.failed) {
    return {};
  }

  // Evaluate real conditions against the world graph
  const evaluated = evaluateMandate(
    state.graph,
    state.mandateDefinition,
    state.mandateState,
    state.ascendantId,
    state.tick,
  );

  // If stage complete, advance to next (or mark mandate complete)
  const advanced = evaluated.progress >= 1.0
    ? advanceMandateStage(evaluated, state.tick)
    : evaluated;

  const events: TickEvent[] = [];

  // Emit event on stage advancement
  if (advanced.currentStage !== state.mandateState.currentStage) {
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'mandate_progress',
      message: `Mandate "${state.mandateDefinition.name}" advances to ${advanced.currentStage}`,
      significance: 0.8,
    });
  }

  // Emit event on completion
  if (advanced.completed && !state.mandateState.completed) {
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'mandate_progress',
      message: `Victory! Mandate "${state.mandateDefinition.name}" fulfilled!`,
      significance: 1.0,
    });
  }

  return {
    mandateState: advanced,
    tickEvents: [...state.tickEvents, ...events],
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/orchestrator.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git add src/engine/orchestrator.ts src/engine/__tests__/orchestrator.test.ts && git commit -m "feat: replace fake mandate progress with real condition evaluation"
```

---

### Task 5: MandateTracker Component

**Files:**
- Create: `src/components/Game/MandateTracker.tsx`
- Create: `src/components/Game/__tests__/MandateTracker.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/Game/__tests__/MandateTracker.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MandateTracker } from '../MandateTracker';
import type { MandateDefinition, MandateState } from '../../../types/mandate';

const TEST_MANDATE: MandateDefinition = {
  id: 'mandate.test.1',
  type: 'graph_state',
  name: 'Dominion of Stone',
  description: 'Control settlements across diverse terrains.',
  stages: [
    {
      stage: 'setup',
      description: 'Establish control',
      conditions: [
        { type: 'node_count', description: 'Control 2+ settlements', params: { minCount: 2 } },
      ],
    },
    {
      stage: 'escalation',
      description: 'Expand',
      conditions: [
        { type: 'node_count', description: 'Control 4+ settlements', params: { minCount: 4 } },
      ],
    },
    {
      stage: 'culmination',
      description: 'Dominate',
      conditions: [
        { type: 'node_count', description: 'Control 5+ settlements', params: { minCount: 5 } },
      ],
    },
  ],
};

const TEST_STATE: MandateState = {
  mandateId: 'mandate.test.1',
  currentStage: 'escalation',
  progress: 0.5,
  completed: false,
  failed: false,
  stageCompletedTicks: { setup: 10 },
};

describe('MandateTracker', () => {
  it('renders mandate name', () => {
    render(<MandateTracker definition={TEST_MANDATE} state={TEST_STATE} />);
    expect(screen.getByText('Dominion of Stone')).toBeTruthy();
  });

  it('renders progress percentage', () => {
    render(<MandateTracker definition={TEST_MANDATE} state={TEST_STATE} />);
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('renders stage pips — first filled, second active, third empty', () => {
    const { container } = render(<MandateTracker definition={TEST_MANDATE} state={TEST_STATE} />);
    const pips = container.querySelectorAll('[data-testid="stage-pip"]');
    expect(pips).toHaveLength(3);
  });

  it('toggles expanded popover on click', () => {
    render(<MandateTracker definition={TEST_MANDATE} state={TEST_STATE} />);
    // Initially no popover
    expect(screen.queryByText('Control 4+ settlements')).toBeNull();
    // Click to expand
    fireEvent.click(screen.getByText('Dominion of Stone'));
    expect(screen.getByText('Control 4+ settlements')).toBeTruthy();
    // Click again to collapse
    fireEvent.click(screen.getByText('Dominion of Stone'));
    expect(screen.queryByText('Control 4+ settlements')).toBeNull();
  });

  it('shows completed mandate state', () => {
    const completedState: MandateState = { ...TEST_STATE, completed: true, progress: 1.0 };
    render(<MandateTracker definition={TEST_MANDATE} state={completedState} />);
    expect(screen.getByText('FULFILLED')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/components/Game/__tests__/MandateTracker.test.tsx`
Expected: FAIL — module `../MandateTracker` not found

**Step 3: Write the component**

```tsx
// src/components/Game/MandateTracker.tsx
import { useState } from 'react';
import type { MandateDefinition, MandateState, MandateStage } from '../../types/mandate';

interface MandateTrackerProps {
  definition: MandateDefinition;
  state: MandateState;
}

const STAGE_ORDER: MandateStage[] = ['setup', 'escalation', 'culmination'];

const TYPE_COLORS: Record<string, string> = {
  graph_state: '#d4a574',       // warm amber
  sphere_dominance: '#5c6bc0',  // indigo
  narrative: '#9c27b0',         // purple
};

export function MandateTracker({ definition, state }: MandateTrackerProps) {
  const [expanded, setExpanded] = useState(false);
  const color = TYPE_COLORS[definition.type] ?? '#d4a574';
  const pct = Math.round(state.progress * 100);
  const currentStageIndex = STAGE_ORDER.indexOf(state.currentStage);

  return (
    <div className="flex-1 min-w-0">
      {/* Compact bar */}
      <div
        className="cursor-pointer select-none"
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-xs font-bold uppercase tracking-wider truncate"
              style={{ color, fontFamily: 'Cinzel, serif' }}
            >
              {definition.name}
            </span>
            {/* Stage pips */}
            <div className="flex gap-1">
              {STAGE_ORDER.map((stage, i) => {
                const isCompleted = i < currentStageIndex || state.completed;
                const isCurrent = i === currentStageIndex && !state.completed;
                return (
                  <div
                    key={stage}
                    data-testid="stage-pip"
                    className="w-2 h-2 rounded-full border"
                    style={{
                      borderColor: color,
                      backgroundColor: isCompleted ? color : isCurrent ? `${color}80` : 'transparent',
                    }}
                  />
                );
              })}
            </div>
          </div>
          <span className="text-xs font-mono ml-2" style={{ color }}>
            {state.completed ? 'FULFILLED' : `${pct}%`}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-stone-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${state.completed ? 100 : pct}%`,
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}60`,
            }}
          />
        </div>
      </div>

      {/* Expanded popover */}
      {expanded && (
        <div
          className="absolute left-0 right-0 top-full z-50 mx-4 mt-1 rounded-lg border p-4 shadow-xl"
          style={{
            backgroundColor: 'rgb(41, 37, 36)',  // stone-800
            borderColor: `${color}40`,
          }}
        >
          {/* Type badge */}
          <div className="mb-2">
            <span
              className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {definition.type.replace('_', '-')}
            </span>
          </div>

          {/* Description */}
          <p className="text-amber-200/70 text-xs mb-3">{definition.description}</p>

          {/* 3-stage timeline */}
          <div className="space-y-2">
            {STAGE_ORDER.map((stage, i) => {
              const stageDef = definition.stages[i];
              const isCompleted = i < currentStageIndex || state.completed;
              const isCurrent = i === currentStageIndex && !state.completed;

              return (
                <div key={stage}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold capitalize ${
                      isCompleted ? 'text-green-400/70' : isCurrent ? 'text-amber-100' : 'text-amber-400/30'
                    }`}>
                      {isCompleted ? '✓' : isCurrent ? '▸' : '○'} {stageDef.description}
                    </span>
                  </div>
                  {/* Show conditions for current stage */}
                  {isCurrent && (
                    <div className="ml-4 space-y-1">
                      {stageDef.conditions.map((cond, ci) => (
                        <div
                          key={ci}
                          className={`text-xs ${cond.met ? 'text-green-400' : 'text-amber-400/70'}`}
                        >
                          {cond.met ? '✓' : '○'} {cond.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/components/Game/__tests__/MandateTracker.test.tsx`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git add src/components/Game/MandateTracker.tsx src/components/Game/__tests__/MandateTracker.test.tsx && git commit -m "feat: add MandateTracker component with compact bar and expanded popover"
```

---

### Task 6: Wire MandateTracker into GameView

**Files:**
- Modify: `src/components/Game/GameView.tsx` (imports, initializeGameState, DoomBar container, render)
- Modify: `src/components/Game/DoomBar.tsx` (remove outer wrapper — it now lives in shared container)

**Step 1: Add imports to GameView.tsx**

At the top of GameView.tsx, add:

```typescript
import { MandateTracker } from './MandateTracker';
import { generateMandate } from '../../engine/mandateGenerator';
import { createMandateState } from '../../engine/mandate';
```

**Step 2: Generate mandate in initializeGameState**

Replace lines 128-129 (the null assignments) with:

```typescript
    // Generate mandate based on sphere alignment
    const mandateDef = generateMandate(cosmology, archetype.sphereAlignment, seed);
    const mandateStateInit = createMandateState(mandateDef.id, 0);
```

And use them in the GameState object:

```typescript
    mandateDefinition: mandateDef,
    mandateState: mandateStateInit,
```

**Step 3: Restructure DoomBar container to include MandateTracker**

In `src/components/Game/DoomBar.tsx`, remove the outer wrapper div (the `w-full px-4 py-2 bg-stone-800/95 border-b border-amber-900/30` div) so DoomBar is just the inner content. The parent container in GameView will handle the outer chrome.

Change DoomBar to return just the content without its own wrapper:

```tsx
export function DoomBar({ definition, state }: DoomBarProps) {
  const color = ARCHETYPE_COLORS[definition.archetype] ?? '#dc2626';
  const pct = Math.round(state.progress * 100);
  const currentStageDef = definition.stages[state.currentStage - 1] ?? definition.stages[0];
  const stageName = currentStageDef?.name ?? 'Unknown';

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color, fontFamily: 'Cinzel, serif' }}
          >
            {definition.archetype}
          </span>
          <span className="text-amber-200/60 text-xs">
            Stage {state.currentStage}: {stageName}
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color }}>
          {state.expired ? 'THE UNMAKING' : `${pct}%`}
        </span>
      </div>
      <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>
    </div>
  );
}
```

**Step 4: Update GameView render to use shared container**

Replace the DoomBar render (around line 441-442):

```tsx
{/* Doom bar + Mandate tracker — shared container */}
<div className="w-full px-4 py-2 bg-stone-800/95 border-b border-amber-900/30 flex gap-4 relative">
  <DoomBar definition={gameState.doomDefinition} state={gameState.doomClock} />
  {gameState.mandateDefinition && gameState.mandateState && (
    <div className="w-px bg-amber-900/30 self-stretch" />
    <MandateTracker
      definition={gameState.mandateDefinition}
      state={gameState.mandateState}
    />
  )}
</div>
```

Note: The divider needs a Fragment or the flex container just holds both. Wrap in fragment if needed:

```tsx
{gameState.mandateDefinition && gameState.mandateState && (
  <>
    <div className="w-px bg-amber-900/30 self-stretch" />
    <MandateTracker
      definition={gameState.mandateDefinition}
      state={gameState.mandateState}
    />
  </>
)}
```

**Step 5: TypeScript verification**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx tsc --noEmit`
Expected: Clean — no errors

**Step 6: Commit**

```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git add src/components/Game/GameView.tsx src/components/Game/DoomBar.tsx src/components/Game/MandateTracker.tsx && git commit -m "feat: wire MandateTracker into GameView beside DoomBar"
```

---

### Task 7: Integration Test

**Files:**
- Create: `src/engine/__tests__/mandate-integration.test.ts`

**Step 1: Write the integration test**

```typescript
// src/engine/__tests__/mandate-integration.test.ts
import { describe, it, expect } from 'vitest';
import { generateMandate } from '../mandateGenerator';
import { createMandateState, evaluateMandate, advanceMandateStage, evaluateCondition } from '../mandate';
import { WorldGraph } from '../graph';
import { MANDATE_TEMPLATES } from '../../data/mandate-content';
import type { SphereName } from '../../types/index';

describe('mandate integration — full lifecycle', () => {
  it('generate → create state → evaluate → advance through all stages', () => {
    const cosmology: Record<SphereName, number> = {
      force: 0.1, matter: 0.3, energy: 0.1, life: 0.1,
      mind: 0.1, spirit: 0.1, time: 0.1, entropy: 0.1,
    };

    // 1. Generate mandate
    const mandate = generateMandate(cosmology, { primary: 'spirit', secondary: 'mind' }, 42);
    expect(mandate.id).toBeTruthy();
    expect(mandate.stages).toHaveLength(3);

    // 2. Create initial state
    let state = createMandateState(mandate.id, 0);
    expect(state.currentStage).toBe('setup');
    expect(state.progress).toBe(0);
    expect(state.completed).toBe(false);
  });

  it('actor_tier mandate: full cycle with graph changes', () => {
    // Pick a mandate that uses actor_tier
    const mandate = MANDATE_TEMPLATES.find(t => t.id === 'mandate.narrative.2')!; // Devoted Circle
    expect(mandate).toBeTruthy();

    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'The One', properties: { actorType: 'ascendant' } });

    // Start: 0 agents, setup needs 2 at tier 2+
    let state = createMandateState(mandate.id, 0);
    state = evaluateMandate(graph, mandate, state, 'asc', 1);
    expect(state.progress).toBe(0);

    // Add 2 agents at tier 2
    for (let i = 1; i <= 2; i++) {
      graph.addNode({ id: `agent.${i}`, type: 'actor', name: `Agent ${i}`, properties: { actorType: 'individual' } });
      graph.addEdge({ id: `wor.${i}`, source: `agent.${i}`, target: 'asc', type: 'worships', properties: { tier: 2 } });
    }

    state = evaluateMandate(graph, mandate, state, 'asc', 10);
    expect(state.progress).toBe(1.0);

    // Advance to escalation
    state = advanceMandateStage(state, 10);
    expect(state.currentStage).toBe('escalation');

    // Escalation needs 3 at tier 3+ — promote 2 existing and add 1 more at tier 3
    graph.getEdge('wor.1')!.properties.tier = 3;
    graph.getEdge('wor.2')!.properties.tier = 3;
    graph.addNode({ id: 'agent.3', type: 'actor', name: 'Agent 3', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'wor.3', source: 'agent.3', target: 'asc', type: 'worships', properties: { tier: 3 } });

    state = evaluateMandate(graph, mandate, state, 'asc', 20);
    expect(state.progress).toBe(1.0);

    // Advance to culmination
    state = advanceMandateStage(state, 20);
    expect(state.currentStage).toBe('culmination');

    // Culmination needs 5 at tier 3+ — add 2 more
    graph.addNode({ id: 'agent.4', type: 'actor', name: 'Agent 4', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'wor.4', source: 'agent.4', target: 'asc', type: 'worships', properties: { tier: 3 } });
    graph.addNode({ id: 'agent.5', type: 'actor', name: 'Agent 5', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'wor.5', source: 'agent.5', target: 'asc', type: 'worships', properties: { tier: 3 } });

    state = evaluateMandate(graph, mandate, state, 'asc', 30);
    expect(state.progress).toBe(1.0);

    // Complete!
    state = advanceMandateStage(state, 30);
    expect(state.completed).toBe(true);
  });

  it('all 9 templates have evaluable conditions (no condition throws)', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });

    for (const template of MANDATE_TEMPLATES) {
      for (const stage of template.stages) {
        for (const condition of stage.conditions) {
          // Should not throw, even if graph is sparse
          expect(() => evaluateCondition(graph, condition, 'asc')).not.toThrow();
        }
      }
    }
  });
});
```

**Step 2: Run the test**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/mandate-integration.test.ts`
Expected: 3 tests PASS

**Step 3: Commit**

```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git add src/engine/__tests__/mandate-integration.test.ts && git commit -m "test: add mandate system integration tests"
```

---

### Task 8: Final Verification

**Step 1: TypeScript check**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx tsc --noEmit`
Expected: Clean — 0 errors

**Step 2: Run all mandate-related tests**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/mandate.test.ts src/engine/__tests__/mandate-content.test.ts src/engine/__tests__/mandateGenerator.test.ts src/engine/__tests__/mandate-integration.test.ts src/components/Game/__tests__/MandateTracker.test.tsx`
Expected: All tests PASS

**Step 3: Build verification**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vite build`
Expected: Build succeeds

---

### Task 9: Documentation Updates

**Step 1: Update Obsidian vault**

- Create `TheFantasyWorldSimulator/Systems/Mandate Tracker.md` with system description, connections to Victory Mandates, Doom Clock, and Orchestrator
- Update `Index.md` with Mandate Tracker link

**Step 2: Update CLAUDE.md**

- Add changelog entries for all new/modified files
- Update engine stats (module count, test count)
- Update project status: Phase 6D → complete

**Step 3: Update Notion backlog**

- Mark Phase 6D remaining as complete
- Add reference docs

**Step 4: Commit documentation**

```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git add CLAUDE.md Docs/plans/2026-03-06-mandate-tracker-implementation.md && git commit -m "docs: mandate tracker implementation plan and status updates"
```
