# Phase 4A: World-Soul & The Unmaking — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the World-Soul persistence layer (Fundament coefficient ledger + Resonance curated memories) and the Unmaking system (playable Twilight Phase with 3 triggers, free-but-weakened interventions, and the full cycle transition sequence from trigger through harvest).

**Architecture:** The World-Soul is a two-layer structure that persists across cycles. Layer 1 (Fundament) stores numerical balances on Foundation axes (Chaos↔Order, Light↔Darkness) and Creation Sphere weights, shifted by resolved actions and doom events. Layer 2 (Resonance) stores 5-10 curated memory fragments selected from Chronicle tier-3 entries. The Unmaking is a Twilight Phase (5-10 ticks) triggered by doom clock expiry, mandate completion, or player concession. During Twilight, interventions cost no Influence Essence but have reduced success probability. The cycle transition sequence handles echo selection, resonance capture, fundament update, and harvest summary.

**Tech Stack:** TypeScript, Vitest, existing APIs from all prior phases.

**Existing code to build on:**
- `src/types/index.ts` — `SphereName`, `SPHERE_NAMES`, `CosmologyProfile`
- `src/engine/cosmology.ts` — `createBalancedCosmology()`, `normalizeCosmology()`, `SPHERE_ALLIES`, `SPHERE_OPPOSITES`
- `src/types/doomClock.ts` (Phase 3A) — `DoomClockArchetype`, `DoomClockState`, `DOOM_CLOCK_ARCHETYPES`
- `src/engine/doomClock.ts` (Phase 3A) — `getDoomClockStage()`, doom state access
- `src/types/mandate.ts` (Phase 2C) — `MandateState`, `MandateStage`
- `src/types/narrative.ts` (Phase 3B) — `ChronicleEntry`, `NarrativeEvent`
- `src/types/influence.ts` (Phase 2A) — `EssencePool`
- `src/engine/influence.ts` (Phase 2A) — `spendEssence()`, `canAfford()`
- `src/engine/dream.ts` (Phase 2B) — `executeIntervention()`
- `src/types/graph.ts` — `GraphNode`, `GraphEdge`
- `src/engine/graph.ts` — `WorldGraph`

**Dependency order:**
```
Task 1: World-Soul type definitions
  ↓
Task 2: Fundament engine (coefficient ledger + blending)
  ↓
Task 3: Resonance engine (memory capture + selection)
  ↓
Task 4: Unmaking engine (Twilight Phase + transition sequence)
  ↓
Task 5: Integration test (full cycle: play → trigger → twilight → harvest)
```

---

## Conventions (same as prior phases)

- **Tests** go in `src/engine/__tests__/<module>.test.ts`
- **IDs** use prefixes: `actor_`, `edge_`, `loc_`, `memory_`, `cycle_`, etc.
- **No classes** in engine modules — export pure functions
- **All engine code** is deterministic when given a seed/roll parameter
- **Imports** use `type` keyword for type-only imports

---

## Task 1: World-Soul Type Definitions

**Files:**
- Create: `src/types/worldSoul.ts`
- Test: `src/engine/__tests__/worldSoul.test.ts`

### Step 1: Write the failing test

```typescript
// src/engine/__tests__/worldSoul.test.ts
import { describe, it, expect } from 'vitest';
import {
  type FoundationAxis,
  type FoundationBalances,
  type FundamentState,
  type ResonanceMemory,
  type MemoryType,
  type ResonanceState,
  type WorldSoulState,
  type FundamentShift,
  type ShiftSource,
  type UnmakingTrigger,
  type TwilightState,
  type HarvestOutcome,
  type HarvestType,
  type CycleTransition,
  FOUNDATION_AXES,
  DEFAULT_FOUNDATION_BALANCES,
  MAX_RESONANCE_MEMORIES,
  TWILIGHT_TICK_RANGE,
  HARVEST_ECHO_COUNTS,
} from '../../types/worldSoul';

describe('worldSoul types', () => {
  it('exports FOUNDATION_AXES', () => {
    expect(FOUNDATION_AXES).toEqual(['chaos_order', 'light_darkness']);
  });

  it('exports DEFAULT_FOUNDATION_BALANCES with neutral values', () => {
    expect(DEFAULT_FOUNDATION_BALANCES).toEqual({
      chaos_order: 0.0,
      light_darkness: 0.0,
    });
  });

  it('exports MAX_RESONANCE_MEMORIES', () => {
    expect(MAX_RESONANCE_MEMORIES).toBe(10);
  });

  it('exports TWILIGHT_TICK_RANGE', () => {
    expect(TWILIGHT_TICK_RANGE).toEqual({ min: 5, max: 10 });
  });

  it('exports HARVEST_ECHO_COUNTS for each harvest type', () => {
    expect(HARVEST_ECHO_COUNTS).toEqual({
      triumphant: { cosmic: 5, divine: 3 },
      somber: { cosmic: 3, divine: 1 },
      bittersweet: { cosmic: 4, divine: 2 },
    });
  });

  it('can construct a FundamentState', () => {
    const fundament: FundamentState = {
      foundations: { chaos_order: 0.3, light_darkness: -0.2 },
      sphereWeights: {
        force: 0.15, matter: 0.1, energy: 0.12, life: 0.18,
        mind: 0.1, spirit: 0.1, time: 0.1, entropy: 0.15,
      },
      cycleCount: 0,
    };
    expect(fundament.foundations.chaos_order).toBe(0.3);
    expect(fundament.cycleCount).toBe(0);
  });

  it('can construct a ResonanceMemory', () => {
    const memory: ResonanceMemory = {
      id: 'memory_001',
      cycleOrigin: 1,
      memoryType: 'sphere_dominance',
      spheres: ['life', 'darkness' as any], // Foundation names won't be SphereName
      summary: 'Necromantic cultures rose in the shadow of unchecked life magic.',
      significance: 0.85,
      degradation: 0,
    };
    expect(memory.memoryType).toBe('sphere_dominance');
    expect(memory.degradation).toBe(0);
  });

  it('can construct a TwilightState', () => {
    const twilight: TwilightState = {
      active: true,
      trigger: 'doom_expired',
      ticksRemaining: 7,
      totalTicks: 7,
      successPenalty: 0.3,
    };
    expect(twilight.active).toBe(true);
    expect(twilight.trigger).toBe('doom_expired');
  });

  it('can construct a WorldSoulState', () => {
    const soul: WorldSoulState = {
      fundament: {
        foundations: DEFAULT_FOUNDATION_BALANCES,
        sphereWeights: {
          force: 0.125, matter: 0.125, energy: 0.125, life: 0.125,
          mind: 0.125, spirit: 0.125, time: 0.125, entropy: 0.125,
        },
        cycleCount: 0,
      },
      resonance: {
        memories: [],
        maxMemories: MAX_RESONANCE_MEMORIES,
      },
    };
    expect(soul.fundament.cycleCount).toBe(0);
    expect(soul.resonance.memories).toHaveLength(0);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npx vitest run src/engine/__tests__/worldSoul.test.ts`
Expected: FAIL — module `../../types/worldSoul` not found

### Step 3: Write minimal implementation

```typescript
// src/types/worldSoul.ts
import type { SphereName } from './index';
import type { DoomClockArchetype } from './doomClock';
import type { ChronicleEntry } from './narrative';

// ── Foundation Axes ──────────────────────────────────────────────

/** The two opposed pairs of Foundation Spheres */
export const FOUNDATION_AXES = ['chaos_order', 'light_darkness'] as const;
export type FoundationAxis = typeof FOUNDATION_AXES[number];

/** Balances on each Foundation axis: -1.0 (first) to +1.0 (second) */
export type FoundationBalances = Record<FoundationAxis, number>;

export const DEFAULT_FOUNDATION_BALANCES: FoundationBalances = {
  chaos_order: 0.0,
  light_darkness: 0.0,
};

// ── Fundament (Layer 1) ─────────────────────────────────────────

/** The coefficient ledger — numerical world-state that persists across cycles */
export interface FundamentState {
  /** Foundation axis balances: -1.0 (chaos/light) to +1.0 (order/darkness) */
  foundations: FoundationBalances;
  /** Creation Sphere weights — how much each sphere exists in the cosmos. Sum to ~1.0 */
  sphereWeights: Record<SphereName, number>;
  /** Number of completed cycles */
  cycleCount: number;
}

/** What caused a Fundament shift */
export type ShiftSource =
  | 'resolved_action'
  | 'doom_escalation'
  | 'mandate_outcome'
  | 'rival_action'
  | 'twilight_event';

/** A single nudge to the Fundament */
export interface FundamentShift {
  source: ShiftSource;
  /** Which Foundation axis to shift, if any */
  foundationAxis?: FoundationAxis;
  /** How much to shift the axis: positive = toward second pole, negative = toward first */
  foundationDelta?: number;
  /** Sphere weight deltas — positive increases, negative decreases */
  sphereDeltas?: Partial<Record<SphereName, number>>;
}

// ── Resonance (Layer 2) ─────────────────────────────────────────

export const MAX_RESONANCE_MEMORIES = 10;

/** Categories of memory that inject thematic content */
export type MemoryType =
  | 'sphere_dominance'    // "Life+Darkness dominated" → necromantic cultures
  | 'great_conflict'      // Major contested resolution between powers
  | 'divine_intervention' // Dramatic god action that changed history
  | 'doom_scar'           // Negative memory from doom clock escalation
  | 'mandate_triumph'     // Positive memory from mandate completion
  | 'betrayal'            // Major betrayal or treachery event
  | 'sacrifice';          // Heroic sacrifice that altered outcomes

/** A single curated memory fragment from a previous cycle */
export interface ResonanceMemory {
  id: string;
  /** Which cycle this memory originated from */
  cycleOrigin: number;
  memoryType: MemoryType;
  /** Spheres associated with this memory */
  spheres: SphereName[];
  /** One-sentence narrative summary */
  summary: string;
  /** 0.0–1.0 how significant this event was */
  significance: number;
  /** 0.0–1.0 how degraded (each cycle adds degradation) */
  degradation: number;
  /** Optional reference to the Chronicle entry that spawned this */
  chronicleRef?: string;
}

/** The curated memory layer of the World-Soul */
export interface ResonanceState {
  memories: ResonanceMemory[];
  maxMemories: number;
}

// ── World-Soul Aggregate ────────────────────────────────────────

export interface WorldSoulState {
  fundament: FundamentState;
  resonance: ResonanceState;
}

// ── The Unmaking / Twilight Phase ───────────────────────────────

export const TWILIGHT_TICK_RANGE = { min: 5, max: 10 } as const;

/** What triggered the Unmaking */
export type UnmakingTrigger =
  | 'doom_expired'
  | 'mandate_complete'
  | 'player_concession';

/** Runtime state of the Twilight Phase */
export interface TwilightState {
  active: boolean;
  trigger: UnmakingTrigger;
  /** Ticks left in the Twilight Phase */
  ticksRemaining: number;
  /** Total ticks this Twilight Phase lasts */
  totalTicks: number;
  /** Probability penalty applied to all divine actions (0.0–1.0 reduces sigmoid output) */
  successPenalty: number;
}

// ── Harvest / Cycle Transition ──────────────────────────────────

export type HarvestType = 'triumphant' | 'somber' | 'bittersweet';

/** How many echoes survive in each harvest type */
export const HARVEST_ECHO_COUNTS: Record<HarvestType, { cosmic: number; divine: number }> = {
  triumphant: { cosmic: 5, divine: 3 },
  somber: { cosmic: 3, divine: 1 },
  bittersweet: { cosmic: 4, divine: 2 },
};

/** Summary of what was harvested at cycle end */
export interface HarvestOutcome {
  harvestType: HarvestType;
  trigger: UnmakingTrigger;
  /** Doom clock archetype that defined this cycle's flavor */
  doomArchetype: DoomClockArchetype;
  /** Fundament shifts applied during this cycle (for display) */
  totalShifts: FundamentShift[];
  /** Resonance memories captured from this cycle */
  capturedMemories: ResonanceMemory[];
  /** IDs of nodes selected as echoes */
  cosmicEchoIds: string[];
  divineEchoIds: string[];
  /** Updated World-Soul state after blending */
  updatedWorldSoul: WorldSoulState;
}

/** Full transition record for saving between cycles */
export interface CycleTransition {
  cycleNumber: number;
  harvest: HarvestOutcome;
  /** The complete World-Soul passed to the next cycle */
  nextWorldSoul: WorldSoulState;
}
```

### Step 4: Run test to verify it passes

Run: `npx vitest run src/engine/__tests__/worldSoul.test.ts`
Expected: PASS (all 8 tests)

### Step 5: Commit

```bash
git add src/types/worldSoul.ts src/engine/__tests__/worldSoul.test.ts
git commit -m "feat(worldSoul): add type definitions for World-Soul, Twilight, and Harvest"
```

---

## Task 2: Fundament Engine (Coefficient Ledger + Blending)

**Files:**
- Create: `src/engine/worldSoul.ts`
- Test: `src/engine/__tests__/worldSoul.test.ts` (append)

### Step 1: Write the failing tests

```typescript
// Append to src/engine/__tests__/worldSoul.test.ts

import {
  createDefaultFundament,
  applyFundamentShift,
  applyBatchShifts,
  blendFundaments,
  clampFoundations,
  normalizeSphereWeights,
} from '../worldSoul';

describe('Fundament engine', () => {
  it('createDefaultFundament returns neutral starting state', () => {
    const f = createDefaultFundament();
    expect(f.foundations.chaos_order).toBe(0.0);
    expect(f.foundations.light_darkness).toBe(0.0);
    expect(f.sphereWeights.force).toBe(0.125);
    expect(f.sphereWeights.entropy).toBe(0.125);
    expect(f.cycleCount).toBe(0);
  });

  it('applyFundamentShift nudges a Foundation axis', () => {
    const f = createDefaultFundament();
    const shifted = applyFundamentShift(f, {
      source: 'resolved_action',
      foundationAxis: 'chaos_order',
      foundationDelta: 0.05,
    });
    expect(shifted.foundations.chaos_order).toBeCloseTo(0.05);
    expect(shifted.foundations.light_darkness).toBe(0.0);
  });

  it('applyFundamentShift nudges sphere weights', () => {
    const f = createDefaultFundament();
    const shifted = applyFundamentShift(f, {
      source: 'doom_escalation',
      sphereDeltas: { entropy: 0.05, life: -0.05 },
    });
    expect(shifted.sphereWeights.entropy).toBeCloseTo(0.175);
    expect(shifted.sphereWeights.life).toBeCloseTo(0.075);
  });

  it('applyFundamentShift clamps Foundation axes to [-1, 1]', () => {
    const f = createDefaultFundament();
    f.foundations.chaos_order = 0.95;
    const shifted = applyFundamentShift(f, {
      source: 'mandate_outcome',
      foundationAxis: 'chaos_order',
      foundationDelta: 0.2,
    });
    expect(shifted.foundations.chaos_order).toBe(1.0);
  });

  it('applyBatchShifts applies multiple shifts in sequence', () => {
    const f = createDefaultFundament();
    const shifts = [
      { source: 'resolved_action' as const, foundationAxis: 'chaos_order' as const, foundationDelta: 0.1 },
      { source: 'resolved_action' as const, foundationAxis: 'chaos_order' as const, foundationDelta: 0.1 },
      { source: 'doom_escalation' as const, sphereDeltas: { entropy: 0.03 } },
    ];
    const result = applyBatchShifts(f, shifts);
    expect(result.foundations.chaos_order).toBeCloseTo(0.2);
    expect(result.sphereWeights.entropy).toBeCloseTo(0.155);
  });

  it('normalizeSphereWeights rescales to sum to 1.0', () => {
    const weights = {
      force: 0.2, matter: 0.2, energy: 0.2, life: 0.2,
      mind: 0.2, spirit: 0.2, time: 0.2, entropy: 0.2,
    };
    const normalized = normalizeSphereWeights(weights);
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
    expect(normalized.force).toBeCloseTo(0.125);
  });

  it('normalizeSphereWeights floors negative values to 0.01', () => {
    const weights = {
      force: -0.5, matter: 0.2, energy: 0.2, life: 0.2,
      mind: 0.2, spirit: 0.2, time: 0.2, entropy: 0.2,
    };
    const normalized = normalizeSphereWeights(weights);
    expect(normalized.force).toBeGreaterThanOrEqual(0.01);
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('blendFundaments weighted-averages two Fundaments', () => {
    const existing: FundamentState = {
      foundations: { chaos_order: 0.6, light_darkness: -0.4 },
      sphereWeights: {
        force: 0.2, matter: 0.1, energy: 0.1, life: 0.15,
        mind: 0.1, spirit: 0.1, time: 0.1, entropy: 0.15,
      },
      cycleCount: 3,
    };
    const current: FundamentState = {
      foundations: { chaos_order: -0.2, light_darkness: 0.8 },
      sphereWeights: {
        force: 0.1, matter: 0.15, energy: 0.15, life: 0.1,
        mind: 0.15, spirit: 0.1, time: 0.15, entropy: 0.1,
      },
      cycleCount: 3,
    };
    // blendWeight = 0.5 means equal mix
    const blended = blendFundaments(existing, current, 0.5);
    expect(blended.foundations.chaos_order).toBeCloseTo(0.2);
    expect(blended.foundations.light_darkness).toBeCloseTo(0.2);
    expect(blended.cycleCount).toBe(4); // incremented
  });

  it('blendFundaments respects blend weight', () => {
    const existing: FundamentState = {
      foundations: { chaos_order: 1.0, light_darkness: 0.0 },
      sphereWeights: {
        force: 0.125, matter: 0.125, energy: 0.125, life: 0.125,
        mind: 0.125, spirit: 0.125, time: 0.125, entropy: 0.125,
      },
      cycleCount: 1,
    };
    const current: FundamentState = {
      foundations: { chaos_order: 0.0, light_darkness: 0.0 },
      sphereWeights: {
        force: 0.125, matter: 0.125, energy: 0.125, life: 0.125,
        mind: 0.125, spirit: 0.125, time: 0.125, entropy: 0.125,
      },
      cycleCount: 1,
    };
    // blendWeight = 0.3 means 30% current, 70% existing
    const blended = blendFundaments(existing, current, 0.3);
    expect(blended.foundations.chaos_order).toBeCloseTo(0.7);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npx vitest run src/engine/__tests__/worldSoul.test.ts`
Expected: FAIL — `createDefaultFundament` not found in `../worldSoul`

### Step 3: Write minimal implementation

```typescript
// src/engine/worldSoul.ts
import type {
  FundamentState,
  FundamentShift,
  FoundationAxis,
  FoundationBalances,
} from '../types/worldSoul';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import { DEFAULT_FOUNDATION_BALANCES } from '../types/worldSoul';

// ── Fundament helpers ───────────────────────────────────────────

/** Create a perfectly neutral Fundament (all axes 0, equal sphere weights) */
export function createDefaultFundament(): FundamentState {
  const sphereWeights = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    sphereWeights[s] = 1.0 / SPHERE_NAMES.length; // 0.125
  }
  return {
    foundations: { ...DEFAULT_FOUNDATION_BALANCES },
    sphereWeights,
    cycleCount: 0,
  };
}

/** Clamp a Foundation axis value to [-1.0, 1.0] */
export function clampFoundations(balances: FoundationBalances): FoundationBalances {
  return {
    chaos_order: Math.max(-1, Math.min(1, balances.chaos_order)),
    light_darkness: Math.max(-1, Math.min(1, balances.light_darkness)),
  };
}

/** Normalize sphere weights: floor negatives to 0.01, then scale to sum to 1.0 */
export function normalizeSphereWeights(
  weights: Record<SphereName, number>
): Record<SphereName, number> {
  const floored = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    floored[s] = Math.max(0.01, weights[s]);
  }
  const sum = SPHERE_NAMES.reduce((acc, s) => acc + floored[s], 0);
  const normalized = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    normalized[s] = floored[s] / sum;
  }
  return normalized;
}

/** Apply a single shift to a Fundament (immutable — returns new state) */
export function applyFundamentShift(
  fundament: FundamentState,
  shift: FundamentShift
): FundamentState {
  const newFoundations = { ...fundament.foundations };
  if (shift.foundationAxis && shift.foundationDelta !== undefined) {
    newFoundations[shift.foundationAxis] += shift.foundationDelta;
  }

  const newWeights = { ...fundament.sphereWeights };
  if (shift.sphereDeltas) {
    for (const [sphere, delta] of Object.entries(shift.sphereDeltas)) {
      newWeights[sphere as SphereName] += delta!;
    }
  }

  return {
    foundations: clampFoundations(newFoundations),
    sphereWeights: newWeights, // normalization happens at blend time, not per-shift
    cycleCount: fundament.cycleCount,
  };
}

/** Apply multiple shifts in sequence */
export function applyBatchShifts(
  fundament: FundamentState,
  shifts: FundamentShift[]
): FundamentState {
  return shifts.reduce(
    (state, shift) => applyFundamentShift(state, shift),
    fundament
  );
}

/** Weighted-average blend of existing (persistent) and current (this cycle) Fundaments.
 *  blendWeight is the proportion of the CURRENT cycle (0.0 = all existing, 1.0 = all current).
 *  Increments cycleCount. Normalizes sphere weights. */
export function blendFundaments(
  existing: FundamentState,
  current: FundamentState,
  blendWeight: number
): FundamentState {
  const w = Math.max(0, Math.min(1, blendWeight));
  const ew = 1 - w;

  const foundations: FoundationBalances = {
    chaos_order: existing.foundations.chaos_order * ew + current.foundations.chaos_order * w,
    light_darkness: existing.foundations.light_darkness * ew + current.foundations.light_darkness * w,
  };

  const rawWeights = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    rawWeights[s] = existing.sphereWeights[s] * ew + current.sphereWeights[s] * w;
  }

  return {
    foundations: clampFoundations(foundations),
    sphereWeights: normalizeSphereWeights(rawWeights),
    cycleCount: existing.cycleCount + 1,
  };
}
```

### Step 4: Run test to verify it passes

Run: `npx vitest run src/engine/__tests__/worldSoul.test.ts`
Expected: PASS (all 16 tests — 8 from Task 1 + 8 from Task 2)

### Step 5: Commit

```bash
git add src/engine/worldSoul.ts src/engine/__tests__/worldSoul.test.ts
git commit -m "feat(worldSoul): add Fundament engine with shifts, clamping, normalization, blending"
```

---

## Task 3: Resonance Engine (Memory Capture & Selection)

**Files:**
- Modify: `src/engine/worldSoul.ts` (append)
- Test: `src/engine/__tests__/worldSoul.test.ts` (append)

### Step 1: Write the failing tests

```typescript
// Append to src/engine/__tests__/worldSoul.test.ts

import {
  createResonanceState,
  captureMemory,
  selectTopMemories,
  degradeMemories,
  pruneMemories,
} from '../worldSoul';
import type { ResonanceMemory, ResonanceState } from '../../types/worldSoul';
import { MAX_RESONANCE_MEMORIES } from '../../types/worldSoul';

describe('Resonance engine', () => {
  const makeMemory = (id: string, significance: number, degradation = 0): ResonanceMemory => ({
    id,
    cycleOrigin: 1,
    memoryType: 'great_conflict',
    spheres: ['force'],
    summary: `Memory ${id}`,
    significance,
    degradation,
  });

  it('createResonanceState returns empty state with correct max', () => {
    const r = createResonanceState();
    expect(r.memories).toHaveLength(0);
    expect(r.maxMemories).toBe(MAX_RESONANCE_MEMORIES);
  });

  it('captureMemory adds a memory to the state', () => {
    const r = createResonanceState();
    const m = makeMemory('memory_001', 0.9);
    const updated = captureMemory(r, m);
    expect(updated.memories).toHaveLength(1);
    expect(updated.memories[0].id).toBe('memory_001');
  });

  it('captureMemory replaces lowest significance when at max capacity', () => {
    let r = createResonanceState();
    // Fill to max
    for (let i = 0; i < MAX_RESONANCE_MEMORIES; i++) {
      r = captureMemory(r, makeMemory(`memory_${i}`, 0.3 + i * 0.05));
    }
    expect(r.memories).toHaveLength(MAX_RESONANCE_MEMORIES);
    // Add a high-significance memory
    const highMem = makeMemory('memory_high', 0.99);
    const updated = captureMemory(r, highMem);
    expect(updated.memories).toHaveLength(MAX_RESONANCE_MEMORIES);
    expect(updated.memories.find(m => m.id === 'memory_high')).toBeDefined();
    // Lowest significance memory should be gone
    expect(updated.memories.find(m => m.id === 'memory_0')).toBeUndefined();
  });

  it('captureMemory rejects memory below lowest existing when full', () => {
    let r = createResonanceState();
    for (let i = 0; i < MAX_RESONANCE_MEMORIES; i++) {
      r = captureMemory(r, makeMemory(`memory_${i}`, 0.5 + i * 0.05));
    }
    const lowMem = makeMemory('memory_low', 0.1);
    const updated = captureMemory(r, lowMem);
    expect(updated.memories.find(m => m.id === 'memory_low')).toBeUndefined();
  });

  it('selectTopMemories picks top N by effective significance', () => {
    const memories: ResonanceMemory[] = [
      makeMemory('a', 0.9, 0.0),  // effective: 0.9
      makeMemory('b', 0.8, 0.5),  // effective: 0.4
      makeMemory('c', 0.7, 0.0),  // effective: 0.7
      makeMemory('d', 0.6, 0.1),  // effective: 0.54
    ];
    const top2 = selectTopMemories(memories, 2);
    expect(top2).toHaveLength(2);
    expect(top2[0].id).toBe('a');
    expect(top2[1].id).toBe('c');
  });

  it('degradeMemories increases degradation by the given amount', () => {
    const memories: ResonanceMemory[] = [
      makeMemory('a', 0.9, 0.0),
      makeMemory('b', 0.8, 0.3),
    ];
    const degraded = degradeMemories(memories, 0.15);
    expect(degraded[0].degradation).toBeCloseTo(0.15);
    expect(degraded[1].degradation).toBeCloseTo(0.45);
  });

  it('degradeMemories caps degradation at 1.0', () => {
    const memories: ResonanceMemory[] = [makeMemory('a', 0.9, 0.95)];
    const degraded = degradeMemories(memories, 0.2);
    expect(degraded[0].degradation).toBe(1.0);
  });

  it('pruneMemories removes fully degraded memories', () => {
    const memories: ResonanceMemory[] = [
      makeMemory('a', 0.9, 0.5),
      makeMemory('b', 0.8, 1.0),
      makeMemory('c', 0.7, 0.99),
    ];
    const pruned = pruneMemories(memories);
    expect(pruned).toHaveLength(2);
    expect(pruned.find(m => m.id === 'b')).toBeUndefined();
  });
});
```

### Step 2: Run test to verify it fails

Run: `npx vitest run src/engine/__tests__/worldSoul.test.ts`
Expected: FAIL — `createResonanceState` not found in `../worldSoul`

### Step 3: Write minimal implementation

```typescript
// Append to src/engine/worldSoul.ts

import type {
  ResonanceMemory,
  ResonanceState,
} from '../types/worldSoul';
import { MAX_RESONANCE_MEMORIES } from '../types/worldSoul';

// ── Resonance helpers ───────────────────────────────────────────

/** Effective significance = raw significance × (1 - degradation) */
function effectiveSignificance(m: ResonanceMemory): number {
  return m.significance * (1 - m.degradation);
}

/** Create an empty Resonance state */
export function createResonanceState(): ResonanceState {
  return { memories: [], maxMemories: MAX_RESONANCE_MEMORIES };
}

/** Add a memory. If at capacity, replaces the lowest-effective-significance memory
 *  (only if the new memory is more significant). Immutable. */
export function captureMemory(
  state: ResonanceState,
  memory: ResonanceMemory
): ResonanceState {
  if (state.memories.length < state.maxMemories) {
    return { ...state, memories: [...state.memories, memory] };
  }
  // Find the lowest effective significance memory
  let lowestIdx = 0;
  let lowestSig = effectiveSignificance(state.memories[0]);
  for (let i = 1; i < state.memories.length; i++) {
    const sig = effectiveSignificance(state.memories[i]);
    if (sig < lowestSig) {
      lowestSig = sig;
      lowestIdx = i;
    }
  }
  // Only replace if new memory is more significant
  if (effectiveSignificance(memory) <= lowestSig) {
    return state;
  }
  const newMemories = [...state.memories];
  newMemories[lowestIdx] = memory;
  return { ...state, memories: newMemories };
}

/** Select top N memories by effective significance, sorted descending */
export function selectTopMemories(
  memories: ResonanceMemory[],
  count: number
): ResonanceMemory[] {
  return [...memories]
    .sort((a, b) => effectiveSignificance(b) - effectiveSignificance(a))
    .slice(0, count);
}

/** Increase degradation of all memories by given amount, cap at 1.0 */
export function degradeMemories(
  memories: ResonanceMemory[],
  amount: number
): ResonanceMemory[] {
  return memories.map(m => ({
    ...m,
    degradation: Math.min(1.0, m.degradation + amount),
  }));
}

/** Remove fully degraded memories (degradation >= 1.0) */
export function pruneMemories(memories: ResonanceMemory[]): ResonanceMemory[] {
  return memories.filter(m => m.degradation < 1.0);
}
```

**Note:** The new imports from `'../types/worldSoul'` should be merged with the existing import at the top of the file:

```typescript
import type {
  FundamentState,
  FundamentShift,
  FoundationAxis,
  FoundationBalances,
  ResonanceMemory,
  ResonanceState,
} from '../types/worldSoul';
import {
  DEFAULT_FOUNDATION_BALANCES,
  MAX_RESONANCE_MEMORIES,
} from '../types/worldSoul';
```

### Step 4: Run test to verify it passes

Run: `npx vitest run src/engine/__tests__/worldSoul.test.ts`
Expected: PASS (all 23 tests — 8 + 8 + 7)

### Step 5: Commit

```bash
git add src/engine/worldSoul.ts src/engine/__tests__/worldSoul.test.ts
git commit -m "feat(worldSoul): add Resonance engine with capture, selection, degradation, pruning"
```

---

## Task 4: Unmaking Engine (Twilight Phase & Transition Sequence)

**Files:**
- Modify: `src/engine/worldSoul.ts` (append)
- Test: `src/engine/__tests__/worldSoul.test.ts` (append)

### Step 1: Write the failing tests

```typescript
// Append to src/engine/__tests__/worldSoul.test.ts

import {
  initiateTwilight,
  tickTwilight,
  isTwilightComplete,
  computeHarvestType,
  computeSuccessPenalty,
  buildHarvestOutcome,
  executeCycleTransition,
} from '../worldSoul';
import type {
  TwilightState,
  WorldSoulState,
  HarvestType,
  FundamentState,
} from '../../types/worldSoul';
import { TWILIGHT_TICK_RANGE, HARVEST_ECHO_COUNTS } from '../../types/worldSoul';

describe('Unmaking engine', () => {
  // Helper: mulberry32 PRNG
  function mulberry32(seed: number): () => number {
    let s = seed | 0;
    return () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it('initiateTwilight creates a valid TwilightState from doom_expired', () => {
    const rng = mulberry32(42);
    const tw = initiateTwilight('doom_expired', rng);
    expect(tw.active).toBe(true);
    expect(tw.trigger).toBe('doom_expired');
    expect(tw.ticksRemaining).toBeGreaterThanOrEqual(TWILIGHT_TICK_RANGE.min);
    expect(tw.ticksRemaining).toBeLessThanOrEqual(TWILIGHT_TICK_RANGE.max);
    expect(tw.totalTicks).toBe(tw.ticksRemaining);
    expect(tw.successPenalty).toBeGreaterThan(0);
  });

  it('computeSuccessPenalty returns higher penalty for doom_expired', () => {
    const doomPen = computeSuccessPenalty('doom_expired');
    const mandPen = computeSuccessPenalty('mandate_complete');
    const concPen = computeSuccessPenalty('player_concession');
    expect(doomPen).toBeGreaterThan(mandPen);
    expect(concPen).toBeGreaterThan(mandPen);
    // All should be between 0 and 1
    expect(doomPen).toBeGreaterThan(0);
    expect(doomPen).toBeLessThan(1);
  });

  it('tickTwilight decrements ticks remaining', () => {
    const tw: TwilightState = {
      active: true,
      trigger: 'doom_expired',
      ticksRemaining: 5,
      totalTicks: 7,
      successPenalty: 0.3,
    };
    const next = tickTwilight(tw);
    expect(next.ticksRemaining).toBe(4);
    expect(next.active).toBe(true);
  });

  it('tickTwilight deactivates when ticks reach 0', () => {
    const tw: TwilightState = {
      active: true,
      trigger: 'doom_expired',
      ticksRemaining: 1,
      totalTicks: 7,
      successPenalty: 0.3,
    };
    const next = tickTwilight(tw);
    expect(next.ticksRemaining).toBe(0);
    expect(next.active).toBe(false);
  });

  it('isTwilightComplete returns true when ticks = 0', () => {
    const tw: TwilightState = {
      active: false,
      trigger: 'doom_expired',
      ticksRemaining: 0,
      totalTicks: 7,
      successPenalty: 0.3,
    };
    expect(isTwilightComplete(tw)).toBe(true);
  });

  it('computeHarvestType maps triggers correctly', () => {
    expect(computeHarvestType('mandate_complete')).toBe('triumphant');
    expect(computeHarvestType('doom_expired')).toBe('somber');
    expect(computeHarvestType('player_concession')).toBe('bittersweet');
  });

  it('buildHarvestOutcome returns correct echo counts for triumphant', () => {
    const worldSoul: WorldSoulState = {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
    };
    const candidateIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rng = mulberry32(99);
    const harvest = buildHarvestOutcome(
      'mandate_complete',
      'breach',
      [],
      [],
      candidateIds,
      worldSoul,
      worldSoul.fundament,
      rng
    );
    expect(harvest.harvestType).toBe('triumphant');
    expect(harvest.cosmicEchoIds).toHaveLength(HARVEST_ECHO_COUNTS.triumphant.cosmic);
    expect(harvest.divineEchoIds).toHaveLength(0); // divine echoes are player-chosen, stub returns empty
  });

  it('buildHarvestOutcome returns fewer cosmic echoes for somber', () => {
    const worldSoul: WorldSoulState = {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
    };
    const candidateIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rng = mulberry32(99);
    const harvest = buildHarvestOutcome(
      'doom_expired',
      'failing',
      [],
      [],
      candidateIds,
      worldSoul,
      worldSoul.fundament,
      rng
    );
    expect(harvest.harvestType).toBe('somber');
    expect(harvest.cosmicEchoIds).toHaveLength(HARVEST_ECHO_COUNTS.somber.cosmic);
  });

  it('executeCycleTransition produces a complete CycleTransition', () => {
    const worldSoul: WorldSoulState = {
      fundament: {
        foundations: { chaos_order: 0.5, light_darkness: -0.3 },
        sphereWeights: {
          force: 0.2, matter: 0.1, energy: 0.1, life: 0.15,
          mind: 0.1, spirit: 0.1, time: 0.1, entropy: 0.15,
        },
        cycleCount: 2,
      },
      resonance: createResonanceState(),
    };
    const currentFundament: FundamentState = {
      foundations: { chaos_order: -0.2, light_darkness: 0.6 },
      sphereWeights: {
        force: 0.1, matter: 0.15, energy: 0.15, life: 0.1,
        mind: 0.15, spirit: 0.1, time: 0.15, entropy: 0.1,
      },
      cycleCount: 2,
    };
    const rng = mulberry32(123);
    const transition = executeCycleTransition(
      worldSoul,
      currentFundament,
      'mandate_complete',
      'convergence',
      [],
      [],
      ['a', 'b', 'c', 'd', 'e', 'f'],
      0.4,
      0.15,
      rng
    );
    expect(transition.cycleNumber).toBe(3);
    expect(transition.harvest.harvestType).toBe('triumphant');
    expect(transition.nextWorldSoul.fundament.cycleCount).toBe(3);
    // Resonance memories should be degraded from existing + any captured
    expect(transition.nextWorldSoul.resonance).toBeDefined();
  });
});
```

### Step 2: Run test to verify it fails

Run: `npx vitest run src/engine/__tests__/worldSoul.test.ts`
Expected: FAIL — `initiateTwilight` not found

### Step 3: Write minimal implementation

```typescript
// Append to src/engine/worldSoul.ts

import type {
  TwilightState,
  UnmakingTrigger,
  HarvestType,
  HarvestOutcome,
  CycleTransition,
  WorldSoulState,
} from '../types/worldSoul';
import type { DoomClockArchetype } from '../types/doomClock';
import { TWILIGHT_TICK_RANGE, HARVEST_ECHO_COUNTS } from '../types/worldSoul';

// ── Unmaking / Twilight helpers ─────────────────────────────────

/** Success penalty by trigger type (higher = harder interventions) */
const TRIGGER_PENALTY: Record<UnmakingTrigger, number> = {
  doom_expired: 0.4,
  player_concession: 0.3,
  mandate_complete: 0.2,
};

export function computeSuccessPenalty(trigger: UnmakingTrigger): number {
  return TRIGGER_PENALTY[trigger];
}

/** Start a Twilight Phase. rng() returns [0,1). */
export function initiateTwilight(
  trigger: UnmakingTrigger,
  rng: () => number
): TwilightState {
  const range = TWILIGHT_TICK_RANGE.max - TWILIGHT_TICK_RANGE.min + 1;
  const ticks = TWILIGHT_TICK_RANGE.min + Math.floor(rng() * range);
  return {
    active: true,
    trigger,
    ticksRemaining: ticks,
    totalTicks: ticks,
    successPenalty: computeSuccessPenalty(trigger),
  };
}

/** Advance the Twilight Phase by one tick */
export function tickTwilight(state: TwilightState): TwilightState {
  const remaining = state.ticksRemaining - 1;
  return {
    ...state,
    ticksRemaining: remaining,
    active: remaining > 0,
  };
}

/** Check if the Twilight Phase is done */
export function isTwilightComplete(state: TwilightState): boolean {
  return state.ticksRemaining <= 0;
}

// ── Harvest ─────────────────────────────────────────────────────

export function computeHarvestType(trigger: UnmakingTrigger): HarvestType {
  switch (trigger) {
    case 'mandate_complete': return 'triumphant';
    case 'doom_expired': return 'somber';
    case 'player_concession': return 'bittersweet';
  }
}

/** Build the harvest outcome. Divine echoes are player-chosen (stub: empty array).
 *  Cosmic echoes are the top N candidate IDs by position in the array (stand-in for
 *  narrative significance scoring — will be replaced when scoring is implemented). */
export function buildHarvestOutcome(
  trigger: UnmakingTrigger,
  doomArchetype: DoomClockArchetype,
  totalShifts: FundamentShift[],
  capturedMemories: ResonanceMemory[],
  candidateEchoIds: string[],
  currentWorldSoul: WorldSoulState,
  currentFundament: FundamentState,
  rng: () => number
): HarvestOutcome {
  const harvestType = computeHarvestType(trigger);
  const echoCounts = HARVEST_ECHO_COUNTS[harvestType];

  // Cosmic echoes: take top N from candidates (proxy for significance scoring)
  const cosmicEchoIds = candidateEchoIds.slice(0, echoCounts.cosmic);

  // Divine echoes: empty — player picks these in the UI layer
  const divineEchoIds: string[] = [];

  // Blend the fundament
  const blendWeight = harvestType === 'triumphant' ? 0.5 : harvestType === 'somber' ? 0.3 : 0.4;
  const blendedFundament = blendFundaments(currentWorldSoul.fundament, currentFundament, blendWeight);

  const updatedWorldSoul: WorldSoulState = {
    fundament: blendedFundament,
    resonance: {
      ...currentWorldSoul.resonance,
      memories: [
        ...pruneMemories(degradeMemories(currentWorldSoul.resonance.memories, 0.15)),
        ...capturedMemories,
      ].slice(0, MAX_RESONANCE_MEMORIES),
    },
  };

  return {
    harvestType,
    trigger,
    doomArchetype,
    totalShifts,
    capturedMemories,
    cosmicEchoIds,
    divineEchoIds,
    updatedWorldSoul,
  };
}

/** Execute the full cycle transition sequence:
 *  1. Determine harvest type
 *  2. Degrade existing resonance memories
 *  3. Capture new memories
 *  4. Select cosmic echoes
 *  5. Blend fundaments
 *  6. Package into CycleTransition */
export function executeCycleTransition(
  existingWorldSoul: WorldSoulState,
  currentFundament: FundamentState,
  trigger: UnmakingTrigger,
  doomArchetype: DoomClockArchetype,
  totalShifts: FundamentShift[],
  newMemories: ResonanceMemory[],
  candidateEchoIds: string[],
  blendWeightOverride: number,
  degradationAmount: number,
  rng: () => number
): CycleTransition {
  const harvestType = computeHarvestType(trigger);
  const echoCounts = HARVEST_ECHO_COUNTS[harvestType];

  // 1. Degrade existing resonance memories
  const degraded = degradeMemories(existingWorldSoul.resonance.memories, degradationAmount);
  const surviving = pruneMemories(degraded);

  // 2. Merge in new memories (captured from this cycle's Chronicle)
  const allMemories = [...surviving, ...newMemories].slice(0, MAX_RESONANCE_MEMORIES);

  // 3. Select cosmic echoes
  const cosmicEchoIds = candidateEchoIds.slice(0, echoCounts.cosmic);

  // 4. Blend fundaments
  const blendedFundament = blendFundaments(
    existingWorldSoul.fundament,
    currentFundament,
    blendWeightOverride
  );

  // 5. Build next World-Soul
  const nextWorldSoul: WorldSoulState = {
    fundament: blendedFundament,
    resonance: {
      memories: allMemories,
      maxMemories: MAX_RESONANCE_MEMORIES,
    },
  };

  // 6. Package harvest
  const harvest: HarvestOutcome = {
    harvestType,
    trigger,
    doomArchetype,
    totalShifts,
    capturedMemories: newMemories,
    cosmicEchoIds,
    divineEchoIds: [], // player picks later
    updatedWorldSoul: nextWorldSoul,
  };

  return {
    cycleNumber: existingWorldSoul.fundament.cycleCount + 1,
    harvest,
    nextWorldSoul,
  };
}
```

**Note:** Merge the new type imports with existing imports at the top of the file:

```typescript
import type {
  FundamentState,
  FundamentShift,
  FoundationAxis,
  FoundationBalances,
  ResonanceMemory,
  ResonanceState,
  TwilightState,
  UnmakingTrigger,
  HarvestType,
  HarvestOutcome,
  CycleTransition,
  WorldSoulState,
} from '../types/worldSoul';
import type { DoomClockArchetype } from '../types/doomClock';
import {
  DEFAULT_FOUNDATION_BALANCES,
  MAX_RESONANCE_MEMORIES,
  TWILIGHT_TICK_RANGE,
  HARVEST_ECHO_COUNTS,
} from '../types/worldSoul';
```

### Step 4: Run test to verify it passes

Run: `npx vitest run src/engine/__tests__/worldSoul.test.ts`
Expected: PASS (all 33 tests — 8 + 8 + 7 + 10)

### Step 5: Commit

```bash
git add src/engine/worldSoul.ts src/engine/__tests__/worldSoul.test.ts
git commit -m "feat(worldSoul): add Unmaking engine with Twilight Phase, Harvest, and cycle transitions"
```

---

## Task 5: Integration Test — Full Cycle Lifecycle

**Files:**
- Test: `src/engine/__tests__/worldSoul.test.ts` (append)

### Step 1: Write the integration test

```typescript
// Append to src/engine/__tests__/worldSoul.test.ts

describe('World-Soul integration: full cycle lifecycle', () => {
  function mulberry32(seed: number): () => number {
    let s = seed | 0;
    return () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it('simulates a 3-cycle game with Fundament drift, memory accumulation, and degradation', () => {
    const rng = mulberry32(7777);

    // ── Cycle 0 setup ───────────────────────────────────────
    let worldSoul: WorldSoulState = {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
    };
    expect(worldSoul.fundament.cycleCount).toBe(0);
    expect(worldSoul.resonance.memories).toHaveLength(0);

    // ── Cycle 1: play, accumulate shifts, trigger mandate_complete ──
    let cycleFundament = { ...worldSoul.fundament };

    // Simulate resolved actions nudging toward Order and boosting Life
    const cycle1Shifts: FundamentShift[] = [
      { source: 'resolved_action', foundationAxis: 'chaos_order', foundationDelta: 0.1 },
      { source: 'resolved_action', foundationAxis: 'chaos_order', foundationDelta: 0.1 },
      { source: 'resolved_action', foundationAxis: 'light_darkness', foundationDelta: -0.05 },
      { source: 'resolved_action', sphereDeltas: { life: 0.03, entropy: -0.02 } },
      { source: 'doom_escalation', foundationAxis: 'chaos_order', foundationDelta: -0.05 },
      { source: 'doom_escalation', sphereDeltas: { entropy: 0.04 } },
    ];
    cycleFundament = applyBatchShifts(cycleFundament, cycle1Shifts);

    // Verify shifts accumulated correctly
    expect(cycleFundament.foundations.chaos_order).toBeCloseTo(0.15);
    expect(cycleFundament.foundations.light_darkness).toBeCloseTo(-0.05);

    // Simulate Twilight Phase from mandate completion
    const twilight1 = initiateTwilight('mandate_complete', rng);
    expect(twilight1.active).toBe(true);
    expect(twilight1.successPenalty).toBe(0.2); // lowest penalty

    // Tick through twilight
    let tw = twilight1;
    while (!isTwilightComplete(tw)) {
      tw = tickTwilight(tw);
    }
    expect(tw.active).toBe(false);

    // Create a memory from this cycle
    const cycle1Memory: ResonanceMemory = {
      id: 'memory_cycle1_a',
      cycleOrigin: 1,
      memoryType: 'mandate_triumph',
      spheres: ['life', 'spirit'],
      summary: 'The garden-priests of Velanthos achieved cosmic harmony.',
      significance: 0.85,
      degradation: 0,
    };

    // Execute transition
    const transition1 = executeCycleTransition(
      worldSoul,
      cycleFundament,
      'mandate_complete',
      'convergence',
      cycle1Shifts,
      [cycle1Memory],
      ['actor_hero', 'loc_temple', 'artifact_crown', 'actor_sage', 'loc_forest', 'actor_villain'],
      0.5,
      0.15,
      rng
    );

    expect(transition1.cycleNumber).toBe(1);
    expect(transition1.harvest.harvestType).toBe('triumphant');
    expect(transition1.harvest.cosmicEchoIds).toHaveLength(5); // triumphant = 5 cosmic
    worldSoul = transition1.nextWorldSoul;

    // Verify Fundament blended (not replaced)
    expect(worldSoul.fundament.cycleCount).toBe(1);
    expect(worldSoul.fundament.foundations.chaos_order).toBeGreaterThan(0);
    expect(worldSoul.fundament.foundations.chaos_order).toBeLessThan(0.15);

    // Verify memory was captured
    expect(worldSoul.resonance.memories).toHaveLength(1);
    expect(worldSoul.resonance.memories[0].id).toBe('memory_cycle1_a');

    // ── Cycle 2: doom_expired ending ────────────────────────
    cycleFundament = { ...worldSoul.fundament };
    const cycle2Shifts: FundamentShift[] = [
      { source: 'resolved_action', foundationAxis: 'light_darkness', foundationDelta: 0.3 },
      { source: 'doom_escalation', sphereDeltas: { entropy: 0.1, force: 0.05 } },
    ];
    cycleFundament = applyBatchShifts(cycleFundament, cycle2Shifts);

    const cycle2Memory: ResonanceMemory = {
      id: 'memory_cycle2_a',
      cycleOrigin: 2,
      memoryType: 'doom_scar',
      spheres: ['entropy', 'force'],
      summary: 'The breach consumed the eastern reaches.',
      significance: 0.92,
      degradation: 0,
    };

    const transition2 = executeCycleTransition(
      worldSoul,
      cycleFundament,
      'doom_expired',
      'breach',
      cycle2Shifts,
      [cycle2Memory],
      ['actor_a', 'actor_b', 'loc_c', 'artifact_d'],
      0.3, // somber = less current influence
      0.15,
      rng
    );

    expect(transition2.harvest.harvestType).toBe('somber');
    expect(transition2.harvest.cosmicEchoIds).toHaveLength(3); // somber = 3 cosmic
    worldSoul = transition2.nextWorldSoul;

    expect(worldSoul.fundament.cycleCount).toBe(2);
    // Cycle 1 memory should have been degraded by 0.15
    const cycle1Mem = worldSoul.resonance.memories.find(m => m.id === 'memory_cycle1_a');
    expect(cycle1Mem).toBeDefined();
    expect(cycle1Mem!.degradation).toBeCloseTo(0.15);
    // New memory should be present
    expect(worldSoul.resonance.memories.find(m => m.id === 'memory_cycle2_a')).toBeDefined();

    // ── Cycle 3: concession ending ──────────────────────────
    cycleFundament = { ...worldSoul.fundament };
    const cycle3Shifts: FundamentShift[] = [
      { source: 'resolved_action', foundationAxis: 'chaos_order', foundationDelta: -0.2 },
    ];
    cycleFundament = applyBatchShifts(cycleFundament, cycle3Shifts);

    const transition3 = executeCycleTransition(
      worldSoul,
      cycleFundament,
      'player_concession',
      'failing',
      cycle3Shifts,
      [],
      ['actor_x', 'actor_y', 'loc_z', 'artifact_w', 'actor_v'],
      0.4,
      0.15,
      rng
    );

    expect(transition3.harvest.harvestType).toBe('bittersweet');
    expect(transition3.harvest.cosmicEchoIds).toHaveLength(4); // bittersweet = 4 cosmic
    worldSoul = transition3.nextWorldSoul;

    expect(worldSoul.fundament.cycleCount).toBe(3);
    // Cycle 1 memory degradation: 0.15 + 0.15 = 0.30
    const c1Mem = worldSoul.resonance.memories.find(m => m.id === 'memory_cycle1_a');
    expect(c1Mem).toBeDefined();
    expect(c1Mem!.degradation).toBeCloseTo(0.30);
    // Cycle 2 memory degradation: 0.15
    const c2Mem = worldSoul.resonance.memories.find(m => m.id === 'memory_cycle2_a');
    expect(c2Mem).toBeDefined();
    expect(c2Mem!.degradation).toBeCloseTo(0.15);

    // Verify sphere weights still sum to ~1.0
    const weightSum = Object.values(worldSoul.fundament.sphereWeights)
      .reduce((a, b) => a + b, 0);
    expect(weightSum).toBeCloseTo(1.0);

    // Verify Foundation axes are within bounds
    expect(worldSoul.fundament.foundations.chaos_order).toBeGreaterThanOrEqual(-1);
    expect(worldSoul.fundament.foundations.chaos_order).toBeLessThanOrEqual(1);
    expect(worldSoul.fundament.foundations.light_darkness).toBeGreaterThanOrEqual(-1);
    expect(worldSoul.fundament.foundations.light_darkness).toBeLessThanOrEqual(1);
  });
});
```

### Step 2: Run test to verify it passes

Run: `npx vitest run src/engine/__tests__/worldSoul.test.ts`
Expected: PASS (all 34 tests — 8 + 8 + 7 + 10 + 1 integration)

### Step 3: Commit

```bash
git add src/engine/__tests__/worldSoul.test.ts
git commit -m "test(worldSoul): add integration test simulating 3-cycle game with drift, memory, and degradation"
```

---

## Summary

**Phase 4A adds:**

| Export | Module | Purpose |
|--------|--------|---------|
| `FoundationAxis`, `FoundationBalances`, `FundamentState` | `types/worldSoul` | Coefficient ledger types |
| `ResonanceMemory`, `MemoryType`, `ResonanceState` | `types/worldSoul` | Curated memory types |
| `WorldSoulState` | `types/worldSoul` | Aggregate World-Soul |
| `TwilightState`, `UnmakingTrigger` | `types/worldSoul` | Twilight Phase state |
| `HarvestType`, `HarvestOutcome`, `CycleTransition` | `types/worldSoul` | Cycle transition types |
| `FOUNDATION_AXES`, `DEFAULT_FOUNDATION_BALANCES` | `types/worldSoul` | Foundation constants |
| `MAX_RESONANCE_MEMORIES`, `TWILIGHT_TICK_RANGE` | `types/worldSoul` | Resonance/Twilight constants |
| `HARVEST_ECHO_COUNTS` | `types/worldSoul` | Echo allocation per harvest type |
| `createDefaultFundament()` | `engine/worldSoul` | Create neutral Fundament |
| `applyFundamentShift()`, `applyBatchShifts()` | `engine/worldSoul` | Shift coefficient ledger |
| `clampFoundations()`, `normalizeSphereWeights()` | `engine/worldSoul` | Value normalization |
| `blendFundaments()` | `engine/worldSoul` | Weighted-average cross-cycle blending |
| `createResonanceState()` | `engine/worldSoul` | Create empty Resonance |
| `captureMemory()` | `engine/worldSoul` | Add memory with capacity management |
| `selectTopMemories()` | `engine/worldSoul` | Rank memories by effective significance |
| `degradeMemories()`, `pruneMemories()` | `engine/worldSoul` | Cross-cycle memory decay |
| `initiateTwilight()` | `engine/worldSoul` | Start Twilight Phase |
| `tickTwilight()`, `isTwilightComplete()` | `engine/worldSoul` | Advance/check Twilight |
| `computeSuccessPenalty()`, `computeHarvestType()` | `engine/worldSoul` | Trigger → gameplay constants |
| `buildHarvestOutcome()` | `engine/worldSoul` | Build harvest summary |
| `executeCycleTransition()` | `engine/worldSoul` | Full transition sequence |

**Phase 4B depends on:** `WorldSoulState`, `ResonanceMemory`, `HarvestOutcome`, `CycleTransition`, `HARVEST_ECHO_COUNTS`, `selectTopMemories()`, `degradeMemories()` from this phase.
