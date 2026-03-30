# Phase 2C: Stealth / Detection System & Victory Mandates — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the two-audience detection model (mortal detection + rival god detection with tiered consequences) and the victory mandate system (graph-state, narrative, and sphere-dominance mandates with 3-stage structure), completing the Player & Divine Layer.

**Architecture:** The stealth system expands Phase 2B's `computeDetection()` into a full two-audience model: mortal detection tracks per-actor suspicion → realization → revelation, while rival detection tracks per-region noticed → identified → targeted. Victory mandates are graph queries evaluated each tick against configurable win conditions. All engine code is pure TypeScript with no React.

**Tech Stack:** TypeScript, Vitest, existing WorldGraph/influence/dream APIs from Phase 1 + 2A + 2B.

**Existing code to build on:**
- `src/engine/dream.ts` (Phase 2B) — `computeDetection()`, `executeIntervention()`, `InterventionResult`
- `src/types/dream.ts` (Phase 2B) — `InterventionType`, `INTERVENTION_DEFINITIONS`, `DivineInfluence`
- `src/types/influence.ts` (Phase 2A) — `InfluenceTier`, `TIER_NAMES`
- `src/engine/influence.ts` (Phase 2A) — `getInfluenceTier()`
- `src/types/graph.ts` — `GraphNode`, `GraphEdge`, `EdgeType`
- `src/engine/graph.ts` — `WorldGraph` class

**Dependency order:**
```
Task 1: Stealth type definitions
  ↓
Task 2: Mortal detection engine
  ↓
Task 3: Rival detection engine
  ↓
Task 4: Victory mandate types + evaluation
  ↓
Task 5: Integration test
```

---

## Conventions (same as prior phases)

- **Tests** go in `src/engine/__tests__/<module>.test.ts`
- **IDs** use prefixes: `actor_`, `edge_`, `loc_`, etc.
- **No classes** in engine modules — export pure functions
- **All engine code** is deterministic when given a seed/roll parameter
- **Imports** use `type` keyword for type-only imports

---

### Task 1: Stealth & Victory Mandate Type Definitions

**Files:**
- Create: `src/types/stealth.ts`
- Create: `src/types/mandate.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/stealth.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  MortalAwarenessLevel,
  RivalAwarenessLevel,
  MortalDetectionState,
  RivalDetectionState,
  DetectionEvent,
} from '../../types/stealth';
import {
  MORTAL_AWARENESS_THRESHOLDS,
  RIVAL_AWARENESS_THRESHOLDS,
} from '../../types/stealth';

describe('Stealth type definitions', () => {
  it('mortal awareness thresholds are ordered ascending', () => {
    expect(MORTAL_AWARENESS_THRESHOLDS.suspicion).toBeLessThan(
      MORTAL_AWARENESS_THRESHOLDS.realization,
    );
    expect(MORTAL_AWARENESS_THRESHOLDS.realization).toBeLessThan(
      MORTAL_AWARENESS_THRESHOLDS.revelation,
    );
  });

  it('rival awareness thresholds are ordered ascending', () => {
    expect(RIVAL_AWARENESS_THRESHOLDS.noticed).toBeLessThan(
      RIVAL_AWARENESS_THRESHOLDS.identified,
    );
    expect(RIVAL_AWARENESS_THRESHOLDS.identified).toBeLessThan(
      RIVAL_AWARENESS_THRESHOLDS.targeted,
    );
  });

  it('MortalDetectionState has correct shape', () => {
    const state: MortalDetectionState = {
      actorId: 'actor_1',
      suspicionScore: 0,
      awarenessLevel: 'unaware',
      detectionEvents: [],
    };
    expect(state.awarenessLevel).toBe('unaware');
  });

  it('RivalDetectionState has correct shape', () => {
    const state: RivalDetectionState = {
      rivalId: 'actor_rival_1',
      regionId: 'loc_region_1',
      scrutinyScore: 0,
      awarenessLevel: 'unaware',
      detectionEvents: [],
    };
    expect(state.awarenessLevel).toBe('unaware');
  });
});
```

Create `src/engine/__tests__/mandate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  MandateType,
  MandateStage,
  MandateDefinition,
  MandateState,
  MandateCondition,
} from '../../types/mandate';

describe('Mandate type definitions', () => {
  it('MandateDefinition has correct shape', () => {
    const mandate: MandateDefinition = {
      id: 'mandate_1',
      type: 'graph_state',
      name: 'Conquer the North',
      description: 'Your devoted actors control 5+ regions',
      stages: [
        { stage: 'setup', description: 'Establish first foothold', conditions: [] },
        { stage: 'escalation', description: 'Rivals react to expansion', conditions: [] },
        { stage: 'culmination', description: 'Final push for dominance', conditions: [] },
      ],
    };
    expect(mandate.stages.length).toBe(3);
    expect(mandate.type).toBe('graph_state');
  });

  it('MandateState tracks progress correctly', () => {
    const state: MandateState = {
      mandateId: 'mandate_1',
      currentStage: 'setup',
      progress: 0.0,
      completed: false,
      failed: false,
    };
    expect(state.currentStage).toBe('setup');
    expect(state.completed).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/stealth.test.ts src/engine/__tests__/mandate.test.ts`
Expected: FAIL — modules not found

**Step 3: Write the type definitions**

Create `src/types/stealth.ts`:

```typescript
import type { InterventionType } from './dream';

// ─── Mortal Detection ────────────────────────────────────────────

/** Mortal awareness escalation levels */
export type MortalAwarenessLevel =
  | 'unaware'       // no suspicion
  | 'suspicion'     // notices unusual coincidences — narrative flavor only
  | 'realization'   // recognizes a pattern — may resist future interventions
  | 'revelation';   // knows a god is acting — dramatic narrative beats

/** Per-actor mortal detection state */
export interface MortalDetectionState {
  actorId: string;
  suspicionScore: number;       // accumulated detection score (0.0+)
  awarenessLevel: MortalAwarenessLevel;
  detectionEvents: DetectionEvent[];
}

// ─── Rival God Detection ─────────────────────────────────────────

/** Rival god awareness escalation levels */
export type RivalAwarenessLevel =
  | 'unaware'       // rival hasn't noticed activity
  | 'noticed'       // rival detects activity in their sphere of interest
  | 'identified'    // rival identifies the player as the source
  | 'targeted';     // rival actively opposes the player

/** Per-rival-per-region detection state */
export interface RivalDetectionState {
  rivalId: string;
  regionId: string;
  scrutinyScore: number;        // accumulated rival scrutiny (0.0+)
  awarenessLevel: RivalAwarenessLevel;
  detectionEvents: DetectionEvent[];
}

// ─── Shared ──────────────────────────────────────────────────────

/** Record of a single detection event */
export interface DetectionEvent {
  tick: number;
  interventionType: InterventionType;
  scoreAdded: number;
  resultingLevel: MortalAwarenessLevel | RivalAwarenessLevel;
}

// ─── Constants ───────────────────────────────────────────────────

/** Suspicion score thresholds for mortal awareness transitions */
export const MORTAL_AWARENESS_THRESHOLDS = {
  suspicion: 3.0,    // score >= 3 → suspicion
  realization: 8.0,  // score >= 8 → realization
  revelation: 15.0,  // score >= 15 → revelation
} as const;

/** Scrutiny score thresholds for rival awareness transitions */
export const RIVAL_AWARENESS_THRESHOLDS = {
  noticed: 5.0,      // score >= 5 → noticed
  identified: 12.0,  // score >= 12 → identified
  targeted: 20.0,    // score >= 20 → targeted
} as const;

/** How much suspicion score each intervention type adds when detected */
export const DETECTION_SCORE_BY_TYPE: Record<InterventionType, number> = {
  dream: 0.5,
  persuade: 1.0,
  deceive: 1.5,
  intimidate: 1.5,
  inspire_intervention: 0.5,
  coincidence: 3.0,
  omen: 1.0,
  afflict_bless: 2.5,
};
```

Create `src/types/mandate.ts`:

```typescript
import type { SphereName } from './index';

// ─── Mandate Types ───────────────────────────────────────────────

/** The three mandate categories */
export type MandateType =
  | 'graph_state'        // achieve specific world configuration
  | 'narrative'          // trigger specific story beats
  | 'sphere_dominance';  // establish cosmic supremacy

/** The universal 3-stage structure */
export type MandateStage = 'setup' | 'escalation' | 'culmination';

/** A single condition that must be met */
export interface MandateCondition {
  type: 'node_count' | 'edge_count' | 'sphere_weight' | 'actor_tier' | 'custom';
  /** Human-readable description */
  description: string;
  /** Query parameters for graph evaluation */
  params: Record<string, unknown>;
  /** Is this condition currently met? (computed at evaluation time) */
  met?: boolean;
}

/** Stage definition within a mandate */
export interface MandateStageDefinition {
  stage: MandateStage;
  description: string;
  conditions: MandateCondition[];
}

/** Full mandate definition */
export interface MandateDefinition {
  id: string;
  type: MandateType;
  name: string;
  description: string;
  stages: [MandateStageDefinition, MandateStageDefinition, MandateStageDefinition];
  /** For sphere_dominance: which sphere must dominate */
  targetSphere?: SphereName;
  /** How many ticks before this mandate expires (optional time pressure) */
  tickLimit?: number;
}

/** Runtime state tracking for an active mandate */
export interface MandateState {
  mandateId: string;
  currentStage: MandateStage;
  progress: number;          // 0.0 - 1.0 within current stage
  completed: boolean;
  failed: boolean;
  /** Tick when the mandate was assigned */
  assignedTick?: number;
  /** Per-stage completion ticks */
  stageCompletedTicks?: Partial<Record<MandateStage, number>>;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/stealth.test.ts src/engine/__tests__/mandate.test.ts`
Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add src/types/stealth.ts src/types/mandate.ts src/engine/__tests__/stealth.test.ts src/engine/__tests__/mandate.test.ts
git commit -m "feat: add stealth detection and victory mandate type definitions"
```

---

### Task 2: Mortal Detection Engine

**Files:**
- Create: `src/engine/stealth.ts`
- Test: `src/engine/__tests__/stealth.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/stealth.test.ts`:

```typescript
import {
  createMortalDetectionState,
  processMortalDetection,
  getMortalAwarenessLevel,
  decayMortalSuspicion,
} from '../stealth';

describe('mortal detection engine', () => {
  it('createMortalDetectionState returns clean state', () => {
    const state = createMortalDetectionState('actor_1');
    expect(state.suspicionScore).toBe(0);
    expect(state.awarenessLevel).toBe('unaware');
    expect(state.detectionEvents.length).toBe(0);
  });

  it('processMortalDetection adds score and may escalate awareness', () => {
    let state = createMortalDetectionState('actor_1');

    // Dream detected: +0.5
    state = processMortalDetection(state, 'dream', 1);
    expect(state.suspicionScore).toBeCloseTo(0.5);
    expect(state.awarenessLevel).toBe('unaware');

    // Multiple coincidence detections push to suspicion (3.0 each, threshold at 3.0)
    state = processMortalDetection(state, 'coincidence', 2);
    expect(state.suspicionScore).toBeCloseTo(3.5); // 0.5 + 3.0
    expect(state.awarenessLevel).toBe('suspicion');
  });

  it('escalates through all levels with enough detections', () => {
    let state = createMortalDetectionState('actor_1');

    // Push past revelation threshold (15.0) with afflict_bless (2.5 each)
    for (let tick = 1; tick <= 7; tick++) {
      state = processMortalDetection(state, 'afflict_bless', tick);
    }
    // 7 × 2.5 = 17.5
    expect(state.suspicionScore).toBeCloseTo(17.5);
    expect(state.awarenessLevel).toBe('revelation');
    expect(state.detectionEvents.length).toBe(7);
  });

  it('getMortalAwarenessLevel returns correct level for score', () => {
    expect(getMortalAwarenessLevel(0)).toBe('unaware');
    expect(getMortalAwarenessLevel(2.9)).toBe('unaware');
    expect(getMortalAwarenessLevel(3.0)).toBe('suspicion');
    expect(getMortalAwarenessLevel(7.9)).toBe('suspicion');
    expect(getMortalAwarenessLevel(8.0)).toBe('realization');
    expect(getMortalAwarenessLevel(14.9)).toBe('realization');
    expect(getMortalAwarenessLevel(15.0)).toBe('revelation');
  });

  it('decayMortalSuspicion reduces score but not below zero', () => {
    let state = createMortalDetectionState('actor_1');
    state.suspicionScore = 5.0;
    state.awarenessLevel = 'suspicion';

    state = decayMortalSuspicion(state, 0.5);
    expect(state.suspicionScore).toBeCloseTo(4.5);

    // Decay a lot
    state = decayMortalSuspicion(state, 10.0);
    expect(state.suspicionScore).toBe(0);
    expect(state.awarenessLevel).toBe('unaware');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/stealth.test.ts`
Expected: FAIL — functions not found

**Step 3: Write the implementation**

Create `src/engine/stealth.ts`:

```typescript
/**
 * Stealth / Detection System — two-audience detection model.
 *
 * Mortal detection: per-actor suspicion tracking with escalation levels.
 * Rival detection: per-rival-per-region scrutiny tracking with escalation.
 */
import type { InterventionType } from '../types/dream';
import type {
  MortalAwarenessLevel,
  RivalAwarenessLevel,
  MortalDetectionState,
  RivalDetectionState,
  DetectionEvent,
} from '../types/stealth';
import {
  MORTAL_AWARENESS_THRESHOLDS,
  RIVAL_AWARENESS_THRESHOLDS,
  DETECTION_SCORE_BY_TYPE,
} from '../types/stealth';

// ─── Mortal Detection ────────────────────────────────────────────

export function createMortalDetectionState(actorId: string): MortalDetectionState {
  return {
    actorId,
    suspicionScore: 0,
    awarenessLevel: 'unaware',
    detectionEvents: [],
  };
}

/**
 * Compute the mortal awareness level from a suspicion score.
 */
export function getMortalAwarenessLevel(score: number): MortalAwarenessLevel {
  if (score >= MORTAL_AWARENESS_THRESHOLDS.revelation) return 'revelation';
  if (score >= MORTAL_AWARENESS_THRESHOLDS.realization) return 'realization';
  if (score >= MORTAL_AWARENESS_THRESHOLDS.suspicion) return 'suspicion';
  return 'unaware';
}

/**
 * Process a detected intervention for mortal awareness.
 * Adds the intervention's detection score and checks for escalation.
 */
export function processMortalDetection(
  state: MortalDetectionState,
  interventionType: InterventionType,
  tick: number,
): MortalDetectionState {
  const scoreAdded = DETECTION_SCORE_BY_TYPE[interventionType] ?? 1.0;
  const newScore = state.suspicionScore + scoreAdded;
  const newLevel = getMortalAwarenessLevel(newScore);

  const event: DetectionEvent = {
    tick,
    interventionType,
    scoreAdded,
    resultingLevel: newLevel,
  };

  return {
    ...state,
    suspicionScore: newScore,
    awarenessLevel: newLevel,
    detectionEvents: [...state.detectionEvents, event],
  };
}

/**
 * Decay mortal suspicion by a given amount (per-tick natural decay).
 * Score cannot go below 0. Awareness level recalculates.
 */
export function decayMortalSuspicion(
  state: MortalDetectionState,
  amount: number,
): MortalDetectionState {
  const newScore = Math.max(0, state.suspicionScore - amount);
  return {
    ...state,
    suspicionScore: newScore,
    awarenessLevel: getMortalAwarenessLevel(newScore),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/stealth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/stealth.ts src/engine/__tests__/stealth.test.ts
git commit -m "feat: add mortal detection engine with awareness escalation"
```

---

### Task 3: Rival Detection Engine

**Files:**
- Modify: `src/engine/stealth.ts` (add rival detection functions)
- Test: `src/engine/__tests__/stealth.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/stealth.test.ts`:

```typescript
import {
  createRivalDetectionState,
  processRivalDetection,
  getRivalAwarenessLevel,
  decayRivalScrutiny,
} from '../stealth';

describe('rival detection engine', () => {
  it('createRivalDetectionState returns clean state', () => {
    const state = createRivalDetectionState('actor_rival_1', 'loc_region_1');
    expect(state.scrutinyScore).toBe(0);
    expect(state.awarenessLevel).toBe('unaware');
  });

  it('processRivalDetection adds score based on intervention type', () => {
    let state = createRivalDetectionState('actor_rival_1', 'loc_region_1');

    // Coincidence detected by rival: +3.0
    state = processRivalDetection(state, 'coincidence', 1);
    expect(state.scrutinyScore).toBeCloseTo(3.0);
    expect(state.awarenessLevel).toBe('unaware'); // threshold is 5.0
  });

  it('escalates through rival awareness levels', () => {
    let state = createRivalDetectionState('actor_rival_1', 'loc_region_1');

    // Push past targeted (20.0): 8 × coincidence (3.0) = 24.0
    for (let tick = 1; tick <= 8; tick++) {
      state = processRivalDetection(state, 'coincidence', tick);
    }
    expect(state.scrutinyScore).toBeCloseTo(24.0);
    expect(state.awarenessLevel).toBe('targeted');
  });

  it('getRivalAwarenessLevel returns correct level for score', () => {
    expect(getRivalAwarenessLevel(0)).toBe('unaware');
    expect(getRivalAwarenessLevel(4.9)).toBe('unaware');
    expect(getRivalAwarenessLevel(5.0)).toBe('noticed');
    expect(getRivalAwarenessLevel(11.9)).toBe('noticed');
    expect(getRivalAwarenessLevel(12.0)).toBe('identified');
    expect(getRivalAwarenessLevel(19.9)).toBe('identified');
    expect(getRivalAwarenessLevel(20.0)).toBe('targeted');
  });

  it('decayRivalScrutiny reduces score but not below zero', () => {
    let state = createRivalDetectionState('actor_rival_1', 'loc_region_1');
    state.scrutinyScore = 10.0;
    state.awarenessLevel = 'noticed';

    state = decayRivalScrutiny(state, 6.0);
    expect(state.scrutinyScore).toBeCloseTo(4.0);
    expect(state.awarenessLevel).toBe('unaware');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/stealth.test.ts`
Expected: FAIL — rival functions not found

**Step 3: Write the implementation**

Append to `src/engine/stealth.ts`:

```typescript
// ─── Rival Detection ─────────────────────────────────────────────

export function createRivalDetectionState(
  rivalId: string,
  regionId: string,
): RivalDetectionState {
  return {
    rivalId,
    regionId,
    scrutinyScore: 0,
    awarenessLevel: 'unaware',
    detectionEvents: [],
  };
}

/**
 * Compute the rival awareness level from a scrutiny score.
 */
export function getRivalAwarenessLevel(score: number): RivalAwarenessLevel {
  if (score >= RIVAL_AWARENESS_THRESHOLDS.targeted) return 'targeted';
  if (score >= RIVAL_AWARENESS_THRESHOLDS.identified) return 'identified';
  if (score >= RIVAL_AWARENESS_THRESHOLDS.noticed) return 'noticed';
  return 'unaware';
}

/**
 * Process a detected intervention for rival awareness.
 * Uses the same per-type scores as mortal detection.
 */
export function processRivalDetection(
  state: RivalDetectionState,
  interventionType: InterventionType,
  tick: number,
): RivalDetectionState {
  const scoreAdded = DETECTION_SCORE_BY_TYPE[interventionType] ?? 1.0;
  const newScore = state.scrutinyScore + scoreAdded;
  const newLevel = getRivalAwarenessLevel(newScore);

  const event: DetectionEvent = {
    tick,
    interventionType,
    scoreAdded,
    resultingLevel: newLevel,
  };

  return {
    ...state,
    scrutinyScore: newScore,
    awarenessLevel: newLevel,
    detectionEvents: [...state.detectionEvents, event],
  };
}

/**
 * Decay rival scrutiny by a given amount (per-tick natural decay).
 */
export function decayRivalScrutiny(
  state: RivalDetectionState,
  amount: number,
): RivalDetectionState {
  const newScore = Math.max(0, state.scrutinyScore - amount);
  return {
    ...state,
    scrutinyScore: newScore,
    awarenessLevel: getRivalAwarenessLevel(newScore),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/stealth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/stealth.ts src/engine/__tests__/stealth.test.ts
git commit -m "feat: add rival detection engine with scrutiny escalation"
```

---

### Task 4: Victory Mandate Evaluation

**Files:**
- Create: `src/engine/mandate.ts`
- Test: `src/engine/__tests__/mandate.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/mandate.test.ts`:

```typescript
import {
  createMandateState,
  evaluateCondition,
  evaluateMandate,
  advanceMandateStage,
} from '../mandate';
import { WorldGraph } from '../graph';
import type { MandateDefinition, MandateCondition } from '../../types/mandate';

describe('mandate evaluation engine', () => {
  function buildTestGraph() {
    const graph = new WorldGraph();

    // Ascendant
    graph.addNode({ id: 'actor_asc', type: 'actor', name: 'The Verdant One', properties: { actorType: 'ascendant' } });

    // 3 regions controlled by devoted actors
    for (let i = 1; i <= 3; i++) {
      graph.addNode({ id: `loc_region_${i}`, type: 'location', name: `Region ${i}`, properties: { locationType: 'region' } });
      graph.addNode({ id: `actor_champion_${i}`, type: 'actor', name: `Champion ${i}`, properties: { actorType: 'individual' } });

      // Worships edge
      graph.addEdge({ id: `edge_worship_${i}`, source: `actor_champion_${i}`, target: 'actor_asc', type: 'worships', properties: { tier: 2 } });

      // Controls edge
      graph.addEdge({ id: `edge_control_${i}`, source: `actor_champion_${i}`, target: `loc_region_${i}`, type: 'controls', properties: {} });
    }

    return graph;
  }

  it('createMandateState returns initial state', () => {
    const state = createMandateState('mandate_1', 10);
    expect(state.currentStage).toBe('setup');
    expect(state.progress).toBe(0);
    expect(state.completed).toBe(false);
    expect(state.assignedTick).toBe(10);
  });

  it('evaluateCondition: node_count checks actor count with matching properties', () => {
    const graph = buildTestGraph();
    const condition: MandateCondition = {
      type: 'node_count',
      description: 'Have 3+ devoted champions',
      params: {
        nodeType: 'actor',
        edgeType: 'worships',
        edgeTarget: 'actor_asc',
        minTier: 2,
        minCount: 3,
      },
    };
    const result = evaluateCondition(graph, condition, 'actor_asc');
    expect(result).toBe(true);
  });

  it('evaluateCondition: node_count fails when count insufficient', () => {
    const graph = buildTestGraph();
    const condition: MandateCondition = {
      type: 'node_count',
      description: 'Have 5+ devoted champions',
      params: {
        nodeType: 'actor',
        edgeType: 'worships',
        edgeTarget: 'actor_asc',
        minTier: 2,
        minCount: 5,
      },
    };
    const result = evaluateCondition(graph, condition, 'actor_asc');
    expect(result).toBe(false);
  });

  it('evaluateMandate returns progress based on conditions met', () => {
    const graph = buildTestGraph();
    const mandate: MandateDefinition = {
      id: 'mandate_1',
      type: 'graph_state',
      name: 'Build a Cult',
      description: 'Establish 3 devoted champions',
      stages: [
        {
          stage: 'setup',
          description: 'Recruit first champion',
          conditions: [{
            type: 'node_count',
            description: 'Have 1+ worshipper',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: 'actor_asc', minTier: 1, minCount: 1 },
          }],
        },
        {
          stage: 'escalation',
          description: 'Expand the cult',
          conditions: [{
            type: 'node_count',
            description: 'Have 2+ devoted',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: 'actor_asc', minTier: 2, minCount: 2 },
          }],
        },
        {
          stage: 'culmination',
          description: 'Full cult established',
          conditions: [{
            type: 'node_count',
            description: 'Have 3+ devoted',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: 'actor_asc', minTier: 2, minCount: 3 },
          }],
        },
      ],
    };

    let state = createMandateState('mandate_1', 0);

    // All stages should be completable with our test graph (3 tier-2 worshippers)
    state = evaluateMandate(graph, mandate, state, 'actor_asc', 10);
    // Setup conditions met, should advance
    expect(state.currentStage).toBe('setup');
    // All setup conditions met → progress = 1.0 for this stage
    expect(state.progress).toBe(1.0);
  });

  it('advanceMandateStage moves to next stage', () => {
    let state = createMandateState('mandate_1', 0);
    state.progress = 1.0; // setup complete

    state = advanceMandateStage(state, 10);
    expect(state.currentStage).toBe('escalation');
    expect(state.progress).toBe(0);
    expect(state.stageCompletedTicks?.setup).toBe(10);
  });

  it('advanceMandateStage from culmination marks completed', () => {
    let state = createMandateState('mandate_1', 0);
    state.currentStage = 'culmination';
    state.progress = 1.0;

    state = advanceMandateStage(state, 50);
    expect(state.completed).toBe(true);
    expect(state.stageCompletedTicks?.culmination).toBe(50);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/mandate.test.ts`
Expected: FAIL — functions not found

**Step 3: Write the implementation**

Create `src/engine/mandate.ts`:

```typescript
/**
 * Victory Mandate Evaluation — graph-state condition checking
 * and 3-stage progression tracking.
 */
import type { WorldGraph } from './graph';
import type {
  MandateDefinition,
  MandateState,
  MandateStage,
  MandateCondition,
} from '../types/mandate';

const STAGE_ORDER: MandateStage[] = ['setup', 'escalation', 'culmination'];

/**
 * Create initial mandate state.
 */
export function createMandateState(mandateId: string, tick: number): MandateState {
  return {
    mandateId,
    currentStage: 'setup',
    progress: 0,
    completed: false,
    failed: false,
    assignedTick: tick,
    stageCompletedTicks: {},
  };
}

/**
 * Evaluate a single mandate condition against the graph.
 *
 * Supported condition types:
 * - node_count: count nodes with specific edges matching criteria
 * - edge_count: count edges of a type
 * - sphere_weight: check cosmology sphere dominance (future)
 * - actor_tier: check an actor's influence tier (future)
 * - custom: always false (placeholder for narrative mandates)
 */
export function evaluateCondition(
  graph: WorldGraph,
  condition: MandateCondition,
  ascendantId: string,
): boolean {
  switch (condition.type) {
    case 'node_count': {
      const { edgeType, edgeTarget, minTier, minCount } = condition.params as {
        nodeType: string;
        edgeType: string;
        edgeTarget: string;
        minTier?: number;
        minCount: number;
      };

      // Find all edges of the specified type pointing to the target
      const targetNode = graph.getNode(edgeTarget as string);
      if (!targetNode) return false;

      const incomingEdges = graph.getIncomingEdges(edgeTarget as string)
        .filter(e => e.type === edgeType);

      // Filter by tier if specified
      const qualifying = minTier != null
        ? incomingEdges.filter(e => (e.properties.tier as number) >= minTier)
        : incomingEdges;

      return qualifying.length >= (minCount as number);
    }

    case 'edge_count': {
      const { edgeType, minCount } = condition.params as {
        edgeType: string;
        minCount: number;
      };
      const allEdges = graph.getAllEdges().filter(e => e.type === edgeType);
      return allEdges.length >= minCount;
    }

    case 'sphere_weight':
    case 'actor_tier':
      // Future implementation — Phase 3+ when sphere dominance tracking exists
      return false;

    case 'custom':
      // Narrative mandates require event-driven evaluation, not graph queries
      return false;

    default:
      return false;
  }
}

/**
 * Evaluate a mandate's current stage conditions and update progress.
 * Progress = fraction of conditions met in the current stage.
 */
export function evaluateMandate(
  graph: WorldGraph,
  mandate: MandateDefinition,
  state: MandateState,
  ascendantId: string,
  _tick: number,
): MandateState {
  if (state.completed || state.failed) return state;

  const stageIndex = STAGE_ORDER.indexOf(state.currentStage);
  const stageDef = mandate.stages[stageIndex];
  if (!stageDef || stageDef.conditions.length === 0) {
    // No conditions = auto-complete stage
    return { ...state, progress: 1.0 };
  }

  const results = stageDef.conditions.map(c => evaluateCondition(graph, c, ascendantId));
  const metCount = results.filter(Boolean).length;
  const progress = metCount / stageDef.conditions.length;

  return { ...state, progress };
}

/**
 * Advance the mandate to the next stage when current stage progress = 1.0.
 * If advancing from culmination, marks the mandate as completed.
 */
export function advanceMandateStage(state: MandateState, tick: number): MandateState {
  const stageIndex = STAGE_ORDER.indexOf(state.currentStage);
  const completedTicks = { ...state.stageCompletedTicks, [state.currentStage]: tick };

  if (stageIndex >= STAGE_ORDER.length - 1) {
    // Completing culmination = mandate complete
    return {
      ...state,
      completed: true,
      stageCompletedTicks: completedTicks,
    };
  }

  return {
    ...state,
    currentStage: STAGE_ORDER[stageIndex + 1],
    progress: 0,
    stageCompletedTicks: completedTicks,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/mandate.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/mandate.ts src/engine/__tests__/mandate.test.ts
git commit -m "feat: add victory mandate evaluation engine with 3-stage progression"
```

---

### Task 5: Integration Test — Stealth + Mandates Combined

**Files:**
- Create: `src/engine/__tests__/stealth-mandate-integration.test.ts`

**Step 1: Write the integration test**

```typescript
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createMortalDetectionState,
  processMortalDetection,
  createRivalDetectionState,
  processRivalDetection,
} from '../stealth';
import {
  createMandateState,
  evaluateMandate,
  advanceMandateStage,
} from '../mandate';
import type { MandateDefinition } from '../../types/mandate';

describe('Stealth + Mandate integration', () => {
  function buildWorld() {
    const graph = new WorldGraph();

    graph.addNode({ id: 'actor_asc', type: 'actor', name: 'The Verdant One', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'actor_rival', type: 'actor', name: 'The Iron Judge', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'loc_north', type: 'location', name: 'Northern Reach', properties: { locationType: 'region' } });

    // 4 worshippers at various tiers
    for (let i = 1; i <= 4; i++) {
      graph.addNode({ id: `actor_agent_${i}`, type: 'actor', name: `Agent ${i}`, properties: { actorType: 'individual' } });
      graph.addEdge({ id: `edge_worship_${i}`, source: `actor_agent_${i}`, target: 'actor_asc', type: 'worships', properties: { tier: i <= 2 ? 2 : 3 } });
      graph.addEdge({ id: `edge_loc_${i}`, source: `actor_agent_${i}`, target: 'loc_north', type: 'located_at', properties: {} });
    }

    return graph;
  }

  it('heavy intervention use triggers both mortal and rival detection', () => {
    let mortalState = createMortalDetectionState('actor_agent_1');
    let rivalState = createRivalDetectionState('actor_rival', 'loc_north');

    // 5 coincidence interventions (3.0 each)
    for (let tick = 1; tick <= 5; tick++) {
      mortalState = processMortalDetection(mortalState, 'coincidence', tick);
      rivalState = processRivalDetection(rivalState, 'coincidence', tick);
    }

    // Mortal: 5 × 3.0 = 15.0 → revelation
    expect(mortalState.awarenessLevel).toBe('revelation');

    // Rival: 5 × 3.0 = 15.0 → identified (threshold 12.0, below targeted 20.0)
    expect(rivalState.awarenessLevel).toBe('identified');
  });

  it('mandate progresses through stages as graph conditions are met', () => {
    const graph = buildWorld();

    const mandate: MandateDefinition = {
      id: 'mandate_cult',
      type: 'graph_state',
      name: 'Build the Cult',
      description: 'Establish champions across the land',
      stages: [
        {
          stage: 'setup',
          description: 'Recruit worshippers',
          conditions: [{
            type: 'node_count',
            description: '2+ worshippers',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: 'actor_asc', minTier: 1, minCount: 2 },
          }],
        },
        {
          stage: 'escalation',
          description: 'Elevate champions',
          conditions: [{
            type: 'node_count',
            description: '2+ champions (tier 3)',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: 'actor_asc', minTier: 3, minCount: 2 },
          }],
        },
        {
          stage: 'culmination',
          description: 'Dominate the region',
          conditions: [{
            type: 'node_count',
            description: '4+ worshippers',
            params: { nodeType: 'actor', edgeType: 'worships', edgeTarget: 'actor_asc', minTier: 2, minCount: 4 },
          }],
        },
      ],
    };

    // Start at setup
    let state = createMandateState('mandate_cult', 0);

    // Evaluate setup: 4 worshippers at tier 2+ → meets "2+ worshippers" condition
    state = evaluateMandate(graph, mandate, state, 'actor_asc', 10);
    expect(state.progress).toBe(1.0);

    // Advance to escalation
    state = advanceMandateStage(state, 10);
    expect(state.currentStage).toBe('escalation');

    // Evaluate escalation: 2 agents at tier 3 → meets "2+ champions" condition
    state = evaluateMandate(graph, mandate, state, 'actor_asc', 20);
    expect(state.progress).toBe(1.0);

    // Advance to culmination
    state = advanceMandateStage(state, 20);
    expect(state.currentStage).toBe('culmination');

    // Evaluate culmination: 4 worshippers at tier 2+ → meets "4+ worshippers" condition
    state = evaluateMandate(graph, mandate, state, 'actor_asc', 30);
    expect(state.progress).toBe(1.0);

    // Complete!
    state = advanceMandateStage(state, 30);
    expect(state.completed).toBe(true);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/stealth-mandate-integration.test.ts`
Expected: PASS

**Step 3: Run full test suite**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run`
Expected: All Phase 1 + 2A + 2B + 2C tests pass (0 failures)

**Step 4: Commit**

```bash
git add src/engine/__tests__/stealth-mandate-integration.test.ts
git commit -m "feat: add stealth and mandate integration tests"
```

---

## Summary

| Task | Files | Tests | What it builds |
|------|-------|-------|---------------|
| 1 | `src/types/stealth.ts`, `src/types/mandate.ts` | 6 | Type defs: awareness levels, detection states, mandate structure |
| 2 | `src/engine/stealth.ts` | 5 | Mortal detection: suspicion tracking, awareness escalation, decay |
| 3 | `src/engine/stealth.ts` | 4 | Rival detection: scrutiny tracking, rival awareness escalation, decay |
| 4 | `src/engine/mandate.ts` | 5 | Mandate evaluation: condition checking, stage progression |
| 5 | integration test | 2 | Combined: heavy intervention → detection + mandate full lifecycle |
| **Total** | **4 files** | **~22 tests** | |

**Exports from this phase:**
- Types: `MortalAwarenessLevel`, `RivalAwarenessLevel`, `MortalDetectionState`, `RivalDetectionState`, `DetectionEvent`, `MandateType`, `MandateStage`, `MandateDefinition`, `MandateState`, `MandateCondition`
- Constants: `MORTAL_AWARENESS_THRESHOLDS`, `RIVAL_AWARENESS_THRESHOLDS`, `DETECTION_SCORE_BY_TYPE`
- Functions: `createMortalDetectionState()`, `processMortalDetection()`, `getMortalAwarenessLevel()`, `decayMortalSuspicion()`, `createRivalDetectionState()`, `processRivalDetection()`, `getRivalAwarenessLevel()`, `decayRivalScrutiny()`, `createMandateState()`, `evaluateCondition()`, `evaluateMandate()`, `advanceMandateStage()`

**Phase 3A depends on:** Rival detection (`processRivalDetection`, `RivalDetectionState`) feeds rival god AI decision-making. Mandate evaluation feeds doom clock interaction.
