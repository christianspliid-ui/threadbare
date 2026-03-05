# Phase 2B: Dream Interface & Divine Toolkit — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Dream Interface (visualize actor intentions, manipulate selection probabilities) and the Divine Toolkit (8 intervention types with sphere affinities, alignment cost multipliers, and detection risk), so the player can influence agent decisions by spending Influence Essence.

**Architecture:** The Dream Interface hooks into the existing `runSelectionPipeline()` by accepting optional `DivineInfluence` modifiers that adjust candidate probabilities *after* top-N selection but *before* the final probabilistic pick. The Divine Toolkit provides 8 intervention types, each with a sphere affinity, tier requirement, base cost, and detection risk. Costs are modified by an alignment multiplier (how well the nudge matches the actor's axiological profile) and a tier modifier (actor type scale). All engine code is pure TypeScript with no React.

**Tech Stack:** TypeScript, Vitest, existing WorldGraph/agent/influence APIs from Phase 1 + Phase 2A.

**Existing code to build on:**
- `src/types/agent.ts` — `ActionCandidate`, `AxiologicalProfile`, `ValuePair`, `SelectionConfig`, `SelectionResult`
- `src/engine/agentSelection.ts` — `runSelectionPipeline()`, `scoreByGoalAlignment()`, `selectTopN()`, `probabilisticSelect()`, `assignProbabilities()` (internal)
- `src/types/influence.ts` (from Phase 2A) — `EssencePool`, `InfluenceTier`, `TIER_NAMES`
- `src/engine/influence.ts` (from Phase 2A) — `canAfford()`, `spendEssence()`, `getInfluenceTier()`
- `src/types/graph.ts` — `GraphNode`, `GraphEdge`, `EdgeType` (`worships`, `avatar_of`, `aligned_with`)
- `src/engine/graph.ts` — `WorldGraph` class

**Dependency order:**
```
Task 1: Dream/Toolkit type definitions
  ↓
Task 2: Alignment cost calculator
  ↓
Task 3: Dream Interface (probability manipulation)
  ↓
Task 4: Divine Toolkit (8 intervention types)
  ↓
Task 5: Integration test
```

---

## Conventions (same as Phase 1 & 2A)

- **Tests** go in `src/engine/__tests__/<module>.test.ts`
- **IDs** use prefixes: `actor_`, `edge_`, `loc_`, etc.
- **No classes** in engine modules — export pure functions
- **All engine code** is deterministic when given a seed/roll parameter
- **Imports** use `type` keyword for type-only imports

---

### Task 1: Dream Interface & Divine Toolkit Type Definitions

**Files:**
- Create: `src/types/dream.ts`
- Modify: `src/types/agent.ts` (add `DivineInfluence` to `SelectionResult`)

**Step 1: Write the failing test**

Create `src/engine/__tests__/dream.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  DreamManipulation,
  ManipulationType,
  InterventionType,
  InterventionDefinition,
  AlignmentFactor,
  TierModifier,
  InterventionCost,
  InterventionResult,
  DivineInfluence,
} from '../../types/dream';
import {
  MANIPULATION_DEFINITIONS,
  INTERVENTION_DEFINITIONS,
  TIER_MODIFIERS,
} from '../../types/dream';

describe('Dream & Toolkit type definitions', () => {
  it('exports all 6 manipulation types with correct properties', () => {
    const types: ManipulationType[] = [
      'whisper', 'inspire', 'suppress', 'reshape', 'implant', 'command',
    ];
    for (const t of types) {
      const def = MANIPULATION_DEFINITIONS[t];
      expect(def).toBeDefined();
      expect(def.minTier).toBeGreaterThanOrEqual(1);
      expect(def.minTier).toBeLessThanOrEqual(4);
      expect(def.baseCost).toBeGreaterThan(0);
      expect(typeof def.probabilityEffect).toBe('string');
    }
  });

  it('exports all 8 intervention types with sphere affinities', () => {
    const types: InterventionType[] = [
      'dream', 'persuade', 'deceive', 'intimidate',
      'inspire_intervention', 'coincidence', 'omen', 'afflict_bless',
    ];
    for (const t of types) {
      const def = INTERVENTION_DEFINITIONS[t];
      expect(def).toBeDefined();
      expect(def.sphereAffinities.length).toBeGreaterThan(0);
      expect(def.detectionRisk).toBeGreaterThanOrEqual(0);
      expect(def.detectionRisk).toBeLessThanOrEqual(1);
    }
  });

  it('exports tier modifiers for all actor types', () => {
    expect(TIER_MODIFIERS.individual).toBe(1.0);
    expect(TIER_MODIFIERS.group).toBe(1.5);
    expect(TIER_MODIFIERS.faction).toBe(2.0);
    expect(TIER_MODIFIERS.culture).toBe(3.0);
    expect(TIER_MODIFIERS.god).toBe(10.0);
  });

  it('DivineInfluence interface has correct shape', () => {
    const influence: DivineInfluence = {
      manipulations: [],
      interventionHistory: [],
    };
    expect(influence.manipulations).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/dream.test.ts`
Expected: FAIL — module `../../types/dream` does not exist

**Step 3: Write the type definitions**

Create `src/types/dream.ts`:

```typescript
import type { SphereName } from './index';
import type { ValuePair, ActionCandidate } from './agent';
import type { InfluenceTier } from './influence';
import type { ActorType } from './graph';

// ─── Dream Interface: Manipulation Types ─────────────────────────

/** The 6 ways a player can manipulate an actor's intention probabilities */
export type ManipulationType =
  | 'whisper'    // +10-15% to existing intention
  | 'inspire'    // +25-30% to existing intention
  | 'suppress'   // -20% to existing intention
  | 'reshape'    // morph intention into a variant
  | 'implant'    // insert new intention from valid pool
  | 'command';   // force specific action

/** How the manipulation affects probabilities */
export type ProbabilityEffect =
  | 'boost_small'    // whisper: +0.10 to +0.15
  | 'boost_large'    // inspire: +0.25 to +0.30
  | 'reduce'         // suppress: -0.20
  | 'replace'        // reshape: swap target for variant
  | 'inject'         // implant: add candidate at 0.30
  | 'override';      // command: set to 1.0

export interface ManipulationDefinition {
  type: ManipulationType;
  minTier: InfluenceTier;       // minimum influence tier required
  baseCost: number;             // base essence cost (of matching sphere)
  probabilityEffect: ProbabilityEffect;
  riskLevel: number;            // 0.0-1.0 detection risk
  description: string;
}

/** A player-issued manipulation targeting a specific candidate */
export interface DreamManipulation {
  type: ManipulationType;
  targetCandidateIndex: number;  // index into the candidates array
  sphereCost: SphereName;        // which sphere's essence to spend
  /** For reshape: the replacement candidate */
  reshapeTo?: ActionCandidate;
  /** For implant: the new candidate to inject */
  implantCandidate?: ActionCandidate;
}

// ─── Divine Toolkit: Intervention Types ──────────────────────────

/** The 8 divine intervention types */
export type InterventionType =
  | 'dream'              // manipulate step-6 probabilities during sleep
  | 'persuade'           // add temporary goal alignment
  | 'deceive'            // inject false information
  | 'intimidate'         // amplify survival instinct
  | 'inspire_intervention' // boost personality weight for traits
  | 'coincidence'        // alter environmental prerequisites
  | 'omen'               // plant symbolic event biasing interpretation
  | 'afflict_bless';     // apply temporary condition trait

export interface InterventionDefinition {
  type: InterventionType;
  sphereAffinities: SphereName[];  // spheres this pairs well with
  baseCost: number;
  detectionRisk: number;           // 0.0-1.0 base detection probability
  minTier: InfluenceTier;
  description: string;
  /** Which pipeline step this intervention targets */
  pipelineStep: 'scoring' | 'personality' | 'topN' | 'probability' | 'environment' | 'condition';
}

// ─── Cost Calculation Types ──────────────────────────────────────

/** How well the intended action aligns with the actor's values */
export type AlignmentFactor = {
  value: number;    // 1.0 = aligned, 2.0 = neutral, 3.0-5.0 = against
  label: 'aligned' | 'neutral' | 'against';
};

/** Scale modifier based on the target actor's type */
export type TierModifier = Record<Exclude<ActorType, 'ascendant'>, number>;

/** Full computed cost of an intervention or manipulation */
export interface InterventionCost {
  baseCost: number;
  alignmentFactor: number;
  tierModifier: number;
  finalCost: number;          // baseCost * alignmentFactor * tierModifier
  sphere: SphereName;
  affordable: boolean;
}

/** Result of executing an intervention */
export interface InterventionResult {
  success: boolean;
  essenceSpent: Record<SphereName, number>;
  detected: boolean;           // was the intervention detected?
  detectedBy: 'mortal' | 'rival' | 'both' | 'none';
  narrativeHook?: string;      // template key for prose engine
}

// ─── Integration with Agent Selection ────────────────────────────

/** Divine influence state passed into the selection pipeline */
export interface DivineInfluence {
  manipulations: DreamManipulation[];
  interventionHistory: Array<{
    type: InterventionType;
    tick: number;
    detected: boolean;
  }>;
}

// ─── Constants ───────────────────────────────────────────────────

export const MANIPULATION_DEFINITIONS: Record<ManipulationType, ManipulationDefinition> = {
  whisper: {
    type: 'whisper',
    minTier: 1,
    baseCost: 1,
    probabilityEffect: 'boost_small',
    riskLevel: 0.0,
    description: 'Nudge probability of an existing intention (+10-15%)',
  },
  inspire: {
    type: 'inspire',
    minTier: 2,
    baseCost: 2,
    probabilityEffect: 'boost_large',
    riskLevel: 0.1,
    description: 'Boost an intention significantly (+25-30%)',
  },
  suppress: {
    type: 'suppress',
    minTier: 2,
    baseCost: 2,
    probabilityEffect: 'reduce',
    riskLevel: 0.1,
    description: 'Reduce probability of an intention (-20%)',
  },
  reshape: {
    type: 'reshape',
    minTier: 3,
    baseCost: 3,
    probabilityEffect: 'replace',
    riskLevel: 0.3,
    description: 'Morph an intention into a variation',
  },
  implant: {
    type: 'implant',
    minTier: 3,
    baseCost: 5,
    probabilityEffect: 'inject',
    riskLevel: 0.5,
    description: 'Insert a new intention the actor was not considering',
  },
  command: {
    type: 'command',
    minTier: 4,
    baseCost: 8,
    probabilityEffect: 'override',
    riskLevel: 0.8,
    description: 'Force a specific action regardless of motivation',
  },
};

export const INTERVENTION_DEFINITIONS: Record<InterventionType, InterventionDefinition> = {
  dream: {
    type: 'dream',
    sphereAffinities: ['mind', 'spirit'],
    baseCost: 1,
    detectionRisk: 0.1,
    minTier: 1,
    description: 'Manipulate selection probabilities during sleep',
    pipelineStep: 'probability',
  },
  persuade: {
    type: 'persuade',
    sphereAffinities: ['spirit', 'mind'],
    baseCost: 2,
    detectionRisk: 0.2,
    minTier: 1,
    description: 'Add temporary goal alignment toward desired action',
    pipelineStep: 'scoring',
  },
  deceive: {
    type: 'deceive',
    sphereAffinities: ['mind', 'entropy'],
    baseCost: 2,
    detectionRisk: 0.3,
    minTier: 2,
    description: 'Inject false information into world-model',
    pipelineStep: 'scoring',
  },
  intimidate: {
    type: 'intimidate',
    sphereAffinities: ['force', 'entropy'],
    baseCost: 2,
    detectionRisk: 0.3,
    minTier: 2,
    description: 'Amplify survival instinct toward/away from action',
    pipelineStep: 'topN',
  },
  inspire_intervention: {
    type: 'inspire_intervention',
    sphereAffinities: ['life', 'spirit'],
    baseCost: 2,
    detectionRisk: 0.1,
    minTier: 1,
    description: 'Boost personality weight for specific trait expressions',
    pipelineStep: 'personality',
  },
  coincidence: {
    type: 'coincidence',
    sphereAffinities: ['time', 'entropy'],
    baseCost: 4,
    detectionRisk: 0.6,
    minTier: 3,
    description: 'Alter environmental prerequisites',
    pipelineStep: 'environment',
  },
  omen: {
    type: 'omen',
    sphereAffinities: ['spirit', 'time'],
    baseCost: 2,
    detectionRisk: 0.2,
    minTier: 2,
    description: 'Plant symbolic event biasing actor interpretation',
    pipelineStep: 'personality',
  },
  afflict_bless: {
    type: 'afflict_bless',
    sphereAffinities: ['life', 'energy'],
    baseCost: 3,
    detectionRisk: 0.5,
    minTier: 2,
    description: 'Apply temporary condition trait',
    pipelineStep: 'condition',
  },
};

export const TIER_MODIFIERS: TierModifier = {
  individual: 1.0,
  group: 1.5,
  faction: 2.0,
  culture: 3.0,
  god: 10.0,
};
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/dream.test.ts`
Expected: PASS — all 4 tests green

**Step 5: Commit**

```bash
git add src/types/dream.ts src/engine/__tests__/dream.test.ts
git commit -m "feat: add Dream Interface and Divine Toolkit type definitions"
```

---

### Task 2: Alignment Cost Calculator

**Files:**
- Create: `src/engine/dream.ts`
- Test: `src/engine/__tests__/dream.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/dream.test.ts`:

```typescript
import {
  computeAlignmentFactor,
  computeInterventionCost,
} from '../dream';
import type { AxiologicalProfile } from '../../types/agent';
import type { EssencePool } from '../../types/influence';
import { createEmptyEssencePool } from '../influence';

describe('computeAlignmentFactor', () => {
  const profile: AxiologicalProfile = {
    ambition_contentment: 0.8,    // strongly ambitious
    courage_prudence: 0.6,        // fairly courageous
    cruelty_compassion: -0.5,     // compassionate
    cunning_honesty: -0.3,        // fairly honest
    devotion_independence: 0.2,
    loyalty_treachery: 0.4,
    tradition_innovation: -0.1,
    dominance_humility: 0.3,
    wrath_patience: -0.2,
    greed_generosity: -0.4,
  };

  it('returns aligned (1.0) when action motivations match actor values', () => {
    // Action driven by ambition (profile = +0.8) and courage (profile = +0.6)
    const factor = computeAlignmentFactor(
      profile,
      ['ambition_contentment', 'courage_prudence'],
    );
    expect(factor.label).toBe('aligned');
    expect(factor.value).toBeCloseTo(1.0, 1);
  });

  it('returns neutral (2.0) when motivations are weakly held', () => {
    // Action driven by values the actor barely holds
    const factor = computeAlignmentFactor(
      profile,
      ['tradition_innovation'],  // profile = -0.1 (weak)
    );
    expect(factor.label).toBe('neutral');
    expect(factor.value).toBeCloseTo(2.0, 0);
  });

  it('returns against (3.0-5.0) when action opposes actor values', () => {
    // Action driven by greed but actor is generous (-0.4)
    // "Greed" is the left pole → positive alignment means greedy
    // Actor has -0.4 → compassionate/generous side
    // If the action says "be greedy" but actor is generous, that's opposing
    const factor = computeAlignmentFactor(
      profile,
      ['greed_generosity', 'cruelty_compassion'],  // actor opposes both left poles
    );
    expect(factor.label).toBe('against');
    expect(factor.value).toBeGreaterThanOrEqual(3.0);
    expect(factor.value).toBeLessThanOrEqual(5.0);
  });
});

describe('computeInterventionCost', () => {
  it('computes final cost as baseCost × alignment × tierModifier', () => {
    const pool: EssencePool = {
      ...createEmptyEssencePool(),
      force: 50,
    };
    const cost = computeInterventionCost({
      baseCost: 2,
      sphere: 'force',
      alignmentFactor: 1.5,
      actorType: 'faction',  // 2.0x
      pool,
    });
    // 2 * 1.5 * 2.0 = 6.0
    expect(cost.finalCost).toBeCloseTo(6.0);
    expect(cost.affordable).toBe(true);
  });

  it('marks as unaffordable when pool is insufficient', () => {
    const pool: EssencePool = {
      ...createEmptyEssencePool(),
      mind: 2,
    };
    const cost = computeInterventionCost({
      baseCost: 3,
      sphere: 'mind',
      alignmentFactor: 2.0,
      actorType: 'individual',  // 1.0x
      pool,
    });
    // 3 * 2.0 * 1.0 = 6.0, but pool only has 2
    expect(cost.finalCost).toBeCloseTo(6.0);
    expect(cost.affordable).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/dream.test.ts`
Expected: FAIL — `computeAlignmentFactor` and `computeInterventionCost` not found

**Step 3: Write the implementation**

Create `src/engine/dream.ts`:

```typescript
/**
 * Dream Interface & Divine Toolkit — cost calculation and probability manipulation.
 *
 * The Dream Interface lets the player manipulate an actor's action selection
 * probabilities. The Divine Toolkit provides 8 intervention types that hook
 * into different stages of the selection pipeline.
 */
import type { AxiologicalProfile, ValuePair, ActionCandidate } from '../types/agent';
import type { ActorType } from '../types/graph';
import type { SphereName } from '../types/index';
import type { EssencePool } from '../types/influence';
import type {
  AlignmentFactor,
  InterventionCost,
  DreamManipulation,
  ManipulationType,
  MANIPULATION_DEFINITIONS as ManipDefs,
  TIER_MODIFIERS as TierMods,
} from '../types/dream';
import {
  MANIPULATION_DEFINITIONS,
  TIER_MODIFIERS,
} from '../types/dream';

// ─── Alignment Cost Calculator ───────────────────────────────────

/**
 * Compute how well a set of action motivations aligns with an actor's
 * axiological profile. Returns an alignment factor used as a cost multiplier.
 *
 * Logic:
 * - For each motivation ValuePair, the action implicitly pushes toward the
 *   LEFT pole (positive direction). The actor's profile value tells us their
 *   stance: positive = aligned with left pole, negative = opposed.
 * - Average the profile values for the given motivations.
 * - Map average to alignment factor:
 *     avg >= 0.3  → aligned (1.0)
 *     avg >= -0.2 → neutral (2.0)
 *     avg < -0.2  → against (3.0 to 5.0, scaled by magnitude)
 */
export function computeAlignmentFactor(
  profile: AxiologicalProfile,
  motivations: ValuePair[],
): AlignmentFactor {
  if (motivations.length === 0) {
    return { value: 2.0, label: 'neutral' };
  }

  const sum = motivations.reduce((s, m) => s + (profile[m] ?? 0), 0);
  const avg = sum / motivations.length;

  if (avg >= 0.3) {
    return { value: 1.0, label: 'aligned' };
  }
  if (avg >= -0.2) {
    return { value: 2.0, label: 'neutral' };
  }
  // Against: scale from 3.0 (avg = -0.2) to 5.0 (avg = -1.0)
  // Linear interpolation: factor = 3.0 + (|avg| - 0.2) * (2.0 / 0.8)
  const magnitude = Math.abs(avg);
  const factor = 3.0 + (magnitude - 0.2) * 2.5;
  return { value: Math.min(5.0, factor), label: 'against' };
}

/**
 * Compute the full cost of an intervention or manipulation.
 * finalCost = baseCost × alignmentFactor × tierModifier
 */
export function computeInterventionCost(params: {
  baseCost: number;
  sphere: SphereName;
  alignmentFactor: number;
  actorType: Exclude<ActorType, 'ascendant'>;
  pool: EssencePool;
}): InterventionCost {
  const tierMod = TIER_MODIFIERS[params.actorType] ?? 1.0;
  const finalCost = params.baseCost * params.alignmentFactor * tierMod;

  return {
    baseCost: params.baseCost,
    alignmentFactor: params.alignmentFactor,
    tierModifier: tierMod,
    finalCost,
    sphere: params.sphere,
    affordable: params.pool[params.sphere] >= finalCost,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/dream.test.ts`
Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add src/engine/dream.ts src/engine/__tests__/dream.test.ts
git commit -m "feat: add alignment cost calculator for divine interventions"
```

---

### Task 3: Dream Interface — Probability Manipulation

**Files:**
- Modify: `src/engine/dream.ts` (add manipulation functions)
- Test: `src/engine/__tests__/dream.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/dream.test.ts`:

```typescript
import {
  applyDreamManipulations,
  validateManipulation,
} from '../dream';
import type { ActionCandidate } from '../../types/agent';
import type { DreamManipulation } from '../../types/dream';
import type { InfluenceTier } from '../../types/influence';

describe('validateManipulation', () => {
  it('rejects manipulation when actor tier is below minimum', () => {
    const result = validateManipulation('inspire', 1 as InfluenceTier); // inspire needs tier 2
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('tier');
  });

  it('accepts manipulation when actor tier meets minimum', () => {
    const result = validateManipulation('inspire', 2 as InfluenceTier);
    expect(result.valid).toBe(true);
  });

  it('accepts whisper at tier 1', () => {
    const result = validateManipulation('whisper', 1 as InfluenceTier);
    expect(result.valid).toBe(true);
  });

  it('requires tier 4 for command', () => {
    expect(validateManipulation('command', 3 as InfluenceTier).valid).toBe(false);
    expect(validateManipulation('command', 4 as InfluenceTier).valid).toBe(true);
  });
});

describe('applyDreamManipulations', () => {
  function makeCandidates(): ActionCandidate[] {
    return [
      { templateId: 'march', targetId: 'loc_1', domain: 'iron', score: 10, motivations: ['ambition_contentment', 'courage_prudence'], probability: 0.60 },
      { templateId: 'ally', targetId: 'actor_2', domain: 'heart', score: 5, motivations: ['loyalty_treachery'], probability: 0.25 },
      { templateId: 'train', targetId: 'loc_1', domain: 'iron', score: 3, motivations: ['tradition_innovation'], probability: 0.15 },
    ];
  }

  it('whisper boosts target probability by 0.10-0.15 and renormalizes', () => {
    const candidates = makeCandidates();
    const manipulation: DreamManipulation = {
      type: 'whisper',
      targetCandidateIndex: 1,  // boost "ally" from 0.25
      sphereCost: 'spirit',
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    // "ally" should be boosted, all should still sum to ~1.0
    const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);
    expect(result[1].probability!).toBeGreaterThan(0.25);
  });

  it('suppress reduces target probability by 0.20 and renormalizes', () => {
    const candidates = makeCandidates();
    const manipulation: DreamManipulation = {
      type: 'suppress',
      targetCandidateIndex: 0,  // suppress "march" from 0.60
      sphereCost: 'force',
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);
    expect(result[0].probability!).toBeLessThan(0.60);
  });

  it('inspire boosts target probability by 0.25-0.30 and renormalizes', () => {
    const candidates = makeCandidates();
    const manipulation: DreamManipulation = {
      type: 'inspire',
      targetCandidateIndex: 2,  // boost "train" from 0.15
      sphereCost: 'force',
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);
    expect(result[2].probability!).toBeGreaterThan(0.15);
  });

  it('command overrides target to 1.0 and zeros others', () => {
    const candidates = makeCandidates();
    const manipulation: DreamManipulation = {
      type: 'command',
      targetCandidateIndex: 1,
      sphereCost: 'spirit',
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    expect(result[1].probability).toBeCloseTo(1.0, 2);
    expect(result[0].probability).toBeCloseTo(0.0, 2);
    expect(result[2].probability).toBeCloseTo(0.0, 2);
  });

  it('implant injects a new candidate and renormalizes', () => {
    const candidates = makeCandidates();
    const newCandidate: ActionCandidate = {
      templateId: 'pray', targetId: 'loc_1', domain: 'veil',
      score: 0, motivations: ['devotion_independence'], probability: 0,
    };
    const manipulation: DreamManipulation = {
      type: 'implant',
      targetCandidateIndex: -1,  // ignored for implant
      sphereCost: 'spirit',
      implantCandidate: newCandidate,
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    expect(result.length).toBe(4);
    const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);
    const implanted = result.find(c => c.templateId === 'pray');
    expect(implanted).toBeDefined();
    expect(implanted!.probability!).toBeGreaterThan(0);
  });

  it('reshape replaces the target candidate with a variant', () => {
    const candidates = makeCandidates();
    const variant: ActionCandidate = {
      templateId: 'march_negotiate', targetId: 'loc_1', domain: 'heart',
      score: 10, motivations: ['ambition_contentment', 'cunning_honesty'], probability: 0,
    };
    const manipulation: DreamManipulation = {
      type: 'reshape',
      targetCandidateIndex: 0,
      sphereCost: 'mind',
      reshapeTo: variant,
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    expect(result.length).toBe(3);
    expect(result[0].templateId).toBe('march_negotiate');
    const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/dream.test.ts`
Expected: FAIL — `applyDreamManipulations` and `validateManipulation` not found

**Step 3: Write the implementation**

Append to `src/engine/dream.ts`:

```typescript
import type { InfluenceTier } from '../types/influence';
import type { DreamManipulation } from '../types/dream';

// ─── Manipulation Validation ─────────────────────────────────────

export function validateManipulation(
  type: ManipulationType,
  actorTier: InfluenceTier,
): { valid: boolean; reason?: string } {
  const def = MANIPULATION_DEFINITIONS[type];
  if (actorTier < def.minTier) {
    return {
      valid: false,
      reason: `${type} requires influence tier ${def.minTier}, actor is at tier ${actorTier}`,
    };
  }
  return { valid: true };
}

// ─── Probability Manipulation ────────────────────────────────────

/**
 * Apply dream manipulations to a set of candidates with assigned probabilities.
 * Returns a new array with adjusted probabilities that sum to 1.0.
 *
 * Manipulation effects:
 * - whisper: +0.12 to target (midpoint of 0.10-0.15)
 * - inspire: +0.275 to target (midpoint of 0.25-0.30)
 * - suppress: -0.20 from target
 * - reshape: replace target candidate with variant, keep probability
 * - implant: inject new candidate at 0.30, compress others
 * - command: set target to 1.0, zero others
 */
export function applyDreamManipulations(
  candidates: ActionCandidate[],
  manipulations: DreamManipulation[],
): ActionCandidate[] {
  let result = candidates.map(c => ({ ...c }));

  for (const manip of manipulations) {
    switch (manip.type) {
      case 'whisper': {
        const boost = 0.12;
        result = applyBoost(result, manip.targetCandidateIndex, boost);
        break;
      }
      case 'inspire': {
        const boost = 0.275;
        result = applyBoost(result, manip.targetCandidateIndex, boost);
        break;
      }
      case 'suppress': {
        const reduction = -0.20;
        result = applyBoost(result, manip.targetCandidateIndex, reduction);
        break;
      }
      case 'reshape': {
        if (manip.reshapeTo && manip.targetCandidateIndex >= 0 && manip.targetCandidateIndex < result.length) {
          const oldProb = result[manip.targetCandidateIndex].probability ?? 0;
          result[manip.targetCandidateIndex] = { ...manip.reshapeTo, probability: oldProb };
        }
        break;
      }
      case 'implant': {
        if (manip.implantCandidate) {
          const injectedProb = 0.30;
          // Compress existing probabilities to make room
          const compressionFactor = 1.0 - injectedProb;
          result = result.map(c => ({
            ...c,
            probability: (c.probability ?? 0) * compressionFactor,
          }));
          result.push({ ...manip.implantCandidate, probability: injectedProb });
        }
        break;
      }
      case 'command': {
        result = result.map((c, i) => ({
          ...c,
          probability: i === manip.targetCandidateIndex ? 1.0 : 0.0,
        }));
        break;
      }
    }
  }

  return result;
}

/**
 * Apply a probability boost/reduction to a specific candidate
 * and renormalize so all probabilities sum to 1.0.
 */
function applyBoost(
  candidates: ActionCandidate[],
  targetIndex: number,
  delta: number,
): ActionCandidate[] {
  if (targetIndex < 0 || targetIndex >= candidates.length) return candidates;

  const result = candidates.map((c, i) => {
    if (i === targetIndex) {
      const newProb = Math.max(0, (c.probability ?? 0) + delta);
      return { ...c, probability: newProb };
    }
    return { ...c };
  });

  // Renormalize
  const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
  if (total === 0) {
    // Edge case: everything zeroed out — distribute equally
    const equal = 1.0 / result.length;
    return result.map(c => ({ ...c, probability: equal }));
  }

  return result.map(c => ({
    ...c,
    probability: (c.probability ?? 0) / total,
  }));
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/dream.test.ts`
Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add src/engine/dream.ts src/engine/__tests__/dream.test.ts
git commit -m "feat: add Dream Interface probability manipulation engine"
```

---

### Task 4: Divine Toolkit — Intervention Execution

**Files:**
- Modify: `src/engine/dream.ts` (add intervention functions)
- Test: `src/engine/__tests__/dream.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/dream.test.ts`:

```typescript
import {
  executeIntervention,
  computeDetection,
} from '../dream';
import type { InterventionType } from '../../types/dream';
import { createEmptyEssencePool } from '../influence';

describe('computeDetection', () => {
  it('returns detected=false when roll exceeds detection risk', () => {
    // dream has detectionRisk: 0.1
    const result = computeDetection('dream', 0, 0.5); // roll 0.5 > 0.1
    expect(result.detected).toBe(false);
    expect(result.detectedBy).toBe('none');
  });

  it('returns mortal detection when roll is below base risk', () => {
    const result = computeDetection('coincidence', 0, 0.1); // risk 0.6, roll 0.1
    expect(result.detected).toBe(true);
    expect(result.detectedBy).toBe('mortal');
  });

  it('increases detection risk with frequency bonus', () => {
    // dream base risk = 0.1, with 5 prior interventions in region: +0.05 each = +0.25
    // adjusted risk = 0.35, roll 0.3 < 0.35 → detected
    const result = computeDetection('dream', 5, 0.3);
    expect(result.detected).toBe(true);
  });

  it('caps detection probability at 0.95', () => {
    // Even with huge frequency, can't reach 1.0
    const result = computeDetection('dream', 100, 0.96);
    expect(result.detected).toBe(false); // 0.96 > 0.95 cap
  });
});

describe('executeIntervention', () => {
  it('spends essence and returns success when affordable', () => {
    const pool = { ...createEmptyEssencePool(), mind: 20 };
    const result = executeIntervention({
      interventionType: 'dream',
      sphere: 'mind',
      baseCost: 1,
      alignmentFactor: 1.0,
      actorType: 'individual',
      pool,
      detectionRoll: 0.99, // won't be detected
    });
    expect(result.success).toBe(true);
    expect(result.essenceSpent.mind).toBeCloseTo(1.0);
    expect(result.detected).toBe(false);
  });

  it('fails without spending essence when unaffordable', () => {
    const pool = { ...createEmptyEssencePool(), force: 0.5 };
    const result = executeIntervention({
      interventionType: 'intimidate',
      sphere: 'force',
      baseCost: 2,
      alignmentFactor: 2.0,
      actorType: 'faction',  // 2.0x → total: 2*2*2 = 8
      pool,
      detectionRoll: 0.5,
    });
    expect(result.success).toBe(false);
    expect(result.essenceSpent.force).toBe(0);
  });

  it('generates narrativeHook matching intervention type', () => {
    const pool = { ...createEmptyEssencePool(), spirit: 50 };
    const result = executeIntervention({
      interventionType: 'omen',
      sphere: 'spirit',
      baseCost: 2,
      alignmentFactor: 1.0,
      actorType: 'individual',
      pool,
      detectionRoll: 0.99,
    });
    expect(result.success).toBe(true);
    expect(result.narrativeHook).toContain('omen');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/dream.test.ts`
Expected: FAIL — `executeIntervention` and `computeDetection` not found

**Step 3: Write the implementation**

Append to `src/engine/dream.ts`:

```typescript
import type {
  InterventionType,
  InterventionResult,
} from '../types/dream';
import { INTERVENTION_DEFINITIONS } from '../types/dream';
import { canAfford, spendEssence } from './influence';

// ─── Detection System ────────────────────────────────────────────

/**
 * Compute whether an intervention was detected.
 *
 * detectionRisk = min(0.95, baseRisk + frequencyBonus)
 * frequencyBonus = priorInterventionsInRegion * 0.05
 *
 * @param interventionType - The type of intervention performed
 * @param priorInterventions - Number of prior interventions in this region
 * @param roll - Deterministic roll [0, 1) for testing
 */
export function computeDetection(
  interventionType: InterventionType,
  priorInterventions: number,
  roll: number,
): { detected: boolean; detectedBy: 'mortal' | 'rival' | 'both' | 'none' } {
  const def = INTERVENTION_DEFINITIONS[interventionType];
  const frequencyBonus = priorInterventions * 0.05;
  const adjustedRisk = Math.min(0.95, def.detectionRisk + frequencyBonus);

  if (roll >= adjustedRisk) {
    return { detected: false, detectedBy: 'none' };
  }

  // For now, detected interventions are mortal-detected.
  // Rival detection will be added in Phase 2C (stealth system).
  return { detected: true, detectedBy: 'mortal' };
}

// ─── Intervention Execution ──────────────────────────────────────

/**
 * Execute a divine intervention: compute cost, spend essence, check detection.
 * Returns the result with success/failure, essence spent, and detection info.
 */
export function executeIntervention(params: {
  interventionType: InterventionType;
  sphere: SphereName;
  baseCost: number;
  alignmentFactor: number;
  actorType: Exclude<ActorType, 'ascendant'>;
  pool: EssencePool;
  /** Number of prior interventions in the region (for detection scaling) */
  priorInterventions?: number;
  /** Deterministic roll [0, 1) for detection — omit for random */
  detectionRoll?: number;
}): InterventionResult {
  const cost = computeInterventionCost({
    baseCost: params.baseCost,
    sphere: params.sphere,
    alignmentFactor: params.alignmentFactor,
    actorType: params.actorType,
    pool: params.pool,
  });

  // Build empty spent record
  const essenceSpent: Record<SphereName, number> = {
    force: 0, matter: 0, energy: 0, life: 0,
    mind: 0, spirit: 0, time: 0, entropy: 0,
  };

  if (!cost.affordable) {
    return {
      success: false,
      essenceSpent,
      detected: false,
      detectedBy: 'none',
    };
  }

  // Spend essence
  essenceSpent[params.sphere] = cost.finalCost;

  // Check detection
  const roll = params.detectionRoll ?? Math.random();
  const detection = computeDetection(
    params.interventionType,
    params.priorInterventions ?? 0,
    roll,
  );

  // Generate narrative hook
  const narrativeHook = `intervention_${params.interventionType}_${params.sphere}`;

  return {
    success: true,
    essenceSpent,
    detected: detection.detected,
    detectedBy: detection.detectedBy,
    narrativeHook,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/dream.test.ts`
Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add src/engine/dream.ts src/engine/__tests__/dream.test.ts
git commit -m "feat: add Divine Toolkit intervention execution with detection"
```

---

### Task 5: Integration Test — Pipeline with Divine Influence

**Files:**
- Create: `src/engine/__tests__/dream-integration.test.ts`

This test verifies the full flow: build a graph with an ascendant + influenced actor → compute alignment cost → apply dream manipulation → run selection → execute intervention.

**Step 1: Write the integration test**

Create `src/engine/__tests__/dream-integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { runSelectionPipeline, probabilisticSelect } from '../agentSelection';
import {
  computeAlignmentFactor,
  computeInterventionCost,
  applyDreamManipulations,
  validateManipulation,
  executeIntervention,
} from '../dream';
import { createEmptyEssencePool } from '../influence';
import type { ActionCandidate, AxiologicalProfile } from '../../types/agent';
import type { DreamManipulation } from '../../types/dream';
import type { InfluenceTier } from '../../types/influence';

describe('Dream Interface + Agent Selection integration', () => {
  function buildScenario() {
    const graph = new WorldGraph();

    // Create ascendant
    graph.addNode({
      id: 'actor_ascendant_1',
      type: 'actor',
      name: 'The Verdant One',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { force: 0.05, matter: 0.05, energy: 0.10, life: 0.35, mind: 0.10, spirit: 0.25, time: 0.05, entropy: 0.05 },
      },
    });

    // Create an influenced actor (Thane Volkar)
    const profile: AxiologicalProfile = {
      ambition_contentment: 0.7,
      courage_prudence: 0.6,
      cruelty_compassion: -0.3,
      cunning_honesty: 0.1,
      devotion_independence: 0.4,
      loyalty_treachery: 0.5,
      tradition_innovation: -0.2,
      dominance_humility: 0.5,
      wrath_patience: 0.2,
      greed_generosity: -0.1,
    };

    graph.addNode({
      id: 'actor_volkar',
      type: 'actor',
      name: 'Thane Volkar',
      properties: {
        actorType: 'individual',
        axiologicalProfile: profile,
      },
    });

    // Create worships edge (tier 2 = devoted)
    graph.addEdge({
      id: 'edge_worship_1',
      source: 'actor_volkar',
      target: 'actor_ascendant_1',
      type: 'worships',
      properties: {
        tier: 2,
        influence: 50,
        since: 0,
      },
    });

    return { graph, profile };
  }

  it('full flow: validate → cost → manipulate → select', () => {
    const { graph, profile } = buildScenario();

    // 1. Build candidates (what Volkar is considering)
    const candidates: ActionCandidate[] = [
      { templateId: 'march_fortress', targetId: 'loc_1', domain: 'iron', score: 10,
        motivations: ['ambition_contentment', 'courage_prudence'], probability: 0.60 },
      { templateId: 'strengthen_alliance', targetId: 'actor_2', domain: 'heart', score: 5,
        motivations: ['loyalty_treachery', 'tradition_innovation'], probability: 0.25 },
      { templateId: 'train_recruits', targetId: 'loc_1', domain: 'iron', score: 3,
        motivations: ['tradition_innovation'], probability: 0.15 },
    ];

    // 2. Validate: can we use "inspire" at tier 2?
    const validation = validateManipulation('inspire', 2 as InfluenceTier);
    expect(validation.valid).toBe(true);

    // 3. Compute alignment cost for boosting "strengthen_alliance"
    //    Motivations: loyalty (+0.5) and tradition (-0.2) → avg = 0.15 → neutral-ish
    const alignment = computeAlignmentFactor(
      profile,
      ['loyalty_treachery', 'tradition_innovation'],
    );
    // avg = (0.5 + (-0.2)) / 2 = 0.15 → below 0.3 threshold → neutral
    expect(alignment.label).toBe('neutral');

    // 4. Compute full cost
    const pool = { ...createEmptyEssencePool(), spirit: 20 };
    const cost = computeInterventionCost({
      baseCost: 2,
      sphere: 'spirit',
      alignmentFactor: alignment.value,
      actorType: 'individual',
      pool,
    });
    // 2 * 2.0 * 1.0 = 4.0
    expect(cost.finalCost).toBeCloseTo(4.0);
    expect(cost.affordable).toBe(true);

    // 5. Apply dream manipulation: inspire "strengthen_alliance"
    const manipulation: DreamManipulation = {
      type: 'inspire',
      targetCandidateIndex: 1,
      sphereCost: 'spirit',
    };
    const adjusted = applyDreamManipulations(candidates, [manipulation]);

    // "strengthen_alliance" probability should have increased
    expect(adjusted[1].probability!).toBeGreaterThan(0.25);
    // Still sums to 1.0
    const total = adjusted.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);

    // 6. Probabilistic select with deterministic roll that picks "strengthen_alliance"
    // After inspire, candidate 1 should be boosted. Use a roll that falls in its range.
    const selectedWithBoost = probabilisticSelect(adjusted, 0.65);
    // The boosted candidate should have a decent chance of being selected
    // (exact result depends on renormalized values)
    expect(selectedWithBoost).toBeDefined();
  });

  it('intervention execution: spend essence and check detection', () => {
    const pool = { ...createEmptyEssencePool(), spirit: 20 };

    const result = executeIntervention({
      interventionType: 'dream',
      sphere: 'spirit',
      baseCost: 1,
      alignmentFactor: 1.0,
      actorType: 'individual',
      pool,
      priorInterventions: 0,
      detectionRoll: 0.99,  // won't be detected
    });

    expect(result.success).toBe(true);
    expect(result.essenceSpent.spirit).toBeCloseTo(1.0);
    expect(result.detected).toBe(false);
    expect(result.narrativeHook).toContain('dream');
  });

  it('command overrides selection to force a specific action', () => {
    const candidates: ActionCandidate[] = [
      { templateId: 'march', targetId: 'loc_1', domain: 'iron', score: 10, motivations: ['ambition_contentment'], probability: 0.70 },
      { templateId: 'retreat', targetId: 'loc_2', domain: 'iron', score: 2, motivations: ['courage_prudence'], probability: 0.20 },
      { templateId: 'pray', targetId: 'loc_1', domain: 'veil', score: 1, motivations: ['devotion_independence'], probability: 0.10 },
    ];

    // Command: force "retreat" (index 1) regardless of probability
    const commandManip: DreamManipulation = {
      type: 'command',
      targetCandidateIndex: 1,
      sphereCost: 'force',
    };

    const adjusted = applyDreamManipulations(candidates, [commandManip]);
    expect(adjusted[1].probability).toBeCloseTo(1.0);

    // Any roll should select "retreat"
    const selected = probabilisticSelect(adjusted, 0.5);
    expect(selected.templateId).toBe('retreat');
  });
});
```

**Step 2: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/dream-integration.test.ts`
Expected: PASS — all 3 integration tests green

**Step 3: Run full test suite**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run`
Expected: All existing Phase 1 tests + Phase 2A tests + Phase 2B tests pass (0 failures)

**Step 4: Commit**

```bash
git add src/engine/__tests__/dream-integration.test.ts
git commit -m "feat: add Dream Interface and Divine Toolkit integration tests"
```

---

## Summary

| Task | Files | Tests | What it builds |
|------|-------|-------|---------------|
| 1 | `src/types/dream.ts` | 4 | Type definitions: 6 manipulation types, 8 intervention types, cost types, constants |
| 2 | `src/engine/dream.ts` | 4 | Alignment cost calculator: `computeAlignmentFactor()`, `computeInterventionCost()` |
| 3 | `src/engine/dream.ts` | 7 | Dream probability manipulation: `validateManipulation()`, `applyDreamManipulations()` |
| 4 | `src/engine/dream.ts` | 4 | Divine Toolkit execution: `computeDetection()`, `executeIntervention()` |
| 5 | integration test | 3 | Full pipeline: graph → alignment → manipulate → select → intervene |
| **Total** | **3 files** | **~22 tests** | |

**Exports from this phase:**
- Types: `DreamManipulation`, `ManipulationType`, `InterventionType`, `InterventionDefinition`, `AlignmentFactor`, `InterventionCost`, `InterventionResult`, `DivineInfluence`
- Constants: `MANIPULATION_DEFINITIONS`, `INTERVENTION_DEFINITIONS`, `TIER_MODIFIERS`
- Functions: `computeAlignmentFactor()`, `computeInterventionCost()`, `validateManipulation()`, `applyDreamManipulations()`, `computeDetection()`, `executeIntervention()`

**Phase 2C depends on:** `computeDetection()` (expands to rival detection), `InterventionResult.detected` (feeds stealth system), `INTERVENTION_DEFINITIONS.detectionRisk` (base probabilities)
