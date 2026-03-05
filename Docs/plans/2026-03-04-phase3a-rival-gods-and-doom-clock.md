# Phase 3A: Rival God Generator & Doom Clock — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the rival god generation system (2-4 cosmic entities per run, derived from World-Soul state and player's sphere choices, with behavioral archetypes and scaling behavior) and the doom clock system (7 archetypes with thematic escalation tracks, variable run lengths, and narrative integration).

**Architecture:** Rival gods are actor nodes (actorType: 'god') generated at run start using a seeded PRNG. Each has a sphere alignment (opposed/orthogonal to player's), a behavioral archetype (aggressive/subtle/territorial/expansionist), and uses the same Divine Toolkit as the player. The doom clock is a state machine with 7 archetype templates, each defining a 5-stage escalation track that fires world events. Doom clock advancement is driven by tick count + rival actions + player progress.

**Tech Stack:** TypeScript, Vitest, existing WorldGraph/influence/dream/stealth APIs from prior phases.

**Existing code to build on:**
- `src/engine/graph.ts` — `WorldGraph`
- `src/types/graph.ts` — `GraphNode`, `ActorType` ('god'), `EdgeType`
- `src/types/index.ts` — `SphereName`, `SPHERE_NAMES`, `CosmologyProfile`
- `src/engine/cosmology.ts` — `SPHERE_ALLIES`, `SPHERE_OPPOSITES`, `createBalancedCosmology`
- `src/types/influence.ts` (Phase 2A) — `EssencePool`, `AscendantProperties`
- `src/engine/stealth.ts` (Phase 2C) — `processRivalDetection`, `RivalDetectionState`
- `src/types/agent.ts` — `AxiologicalProfile`, `ValuePair`

**Dependency order:**
```
Task 1: Rival god + doom clock type definitions
  ↓
Task 2: Rival god generator
  ↓
Task 3: Rival AI decision loop
  ↓
Task 4: Doom clock engine
  ↓
Task 5: Integration test
```

---

## Conventions (same as prior phases)

- **Tests** go in `src/engine/__tests__/<module>.test.ts`
- **IDs** use prefixes: `actor_rival_`, `doom_`
- **No classes** — export pure functions
- **Deterministic** with seed/roll parameters
- **Imports** use `type` keyword for type-only imports

---

### Task 1: Rival God & Doom Clock Type Definitions

**Files:**
- Create: `src/types/rival.ts`
- Create: `src/types/doomClock.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/rival.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  RivalArchetype,
  RivalBehavior,
  RivalDefinition,
  RivalState,
} from '../../types/rival';
import type {
  DoomClockArchetype,
  DoomClockStage,
  DoomClockDefinition,
  DoomClockState,
  DoomEscalationEvent,
} from '../../types/doomClock';
import {
  DOOM_CLOCK_ARCHETYPES,
  DOOM_STAGE_NAMES,
} from '../../types/doomClock';

describe('rival god type definitions', () => {
  it('RivalDefinition has correct shape', () => {
    const rival: RivalDefinition = {
      id: 'actor_rival_1',
      name: 'The Iron Judge',
      sphereAlignment: { force: 0.4, matter: 0.3, energy: 0.1, life: 0.05, mind: 0.05, spirit: 0.05, time: 0.025, entropy: 0.025 },
      behavior: 'aggressive',
      oppositionStrength: 0.8,
      description: 'A war-god who values order through might',
    };
    expect(rival.behavior).toBe('aggressive');
  });

  it('RivalState tracks activity correctly', () => {
    const state: RivalState = {
      rivalId: 'actor_rival_1',
      active: true,
      interventionCount: 0,
      agentsControlled: 0,
      regionsInfluenced: [],
      hostilityToPlayer: 0.5,
    };
    expect(state.active).toBe(true);
  });
});

describe('doom clock type definitions', () => {
  it('exports all 7 doom clock archetypes', () => {
    expect(DOOM_CLOCK_ARCHETYPES.length).toBe(7);
    const expected: DoomClockArchetype[] = [
      'breach', 'convergence', 'changing', 'sundering',
      'failing', 'ascension', 'reckoning',
    ];
    expect(DOOM_CLOCK_ARCHETYPES).toEqual(expected);
  });

  it('exports 5 doom stage names', () => {
    expect(DOOM_STAGE_NAMES.length).toBe(5);
  });

  it('DoomClockDefinition has correct shape', () => {
    const clock: DoomClockDefinition = {
      archetype: 'breach',
      totalTicks: 120,
      stages: [
        { stage: 1, name: 'Whispers', tickThreshold: 0.2, events: [] },
        { stage: 2, name: 'Cracks', tickThreshold: 0.4, events: [] },
        { stage: 3, name: 'Tremors', tickThreshold: 0.6, events: [] },
        { stage: 4, name: 'Breaking', tickThreshold: 0.8, events: [] },
        { stage: 5, name: 'The Breach', tickThreshold: 1.0, events: [] },
      ],
    };
    expect(clock.stages.length).toBe(5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/rival.test.ts`
Expected: FAIL — modules not found

**Step 3: Write the type definitions**

Create `src/types/rival.ts`:

```typescript
import type { CosmologyProfile, SphereName } from './index';
import type { AxiologicalProfile } from './agent';

/** Behavioral archetype for rival gods */
export type RivalBehavior =
  | 'aggressive'     // directly opposes player, attacks agents/places of power
  | 'subtle'         // undermines through deception, rarely detected
  | 'territorial'    // claims regions and defends them fiercely
  | 'expansionist';  // spreads influence widely, competes for worshippers

/** Full rival god definition (generated at run start) */
export interface RivalDefinition {
  id: string;
  name: string;
  sphereAlignment: CosmologyProfile;
  behavior: RivalBehavior;
  /** 0.0-1.0 how opposed this rival is to the player's goals */
  oppositionStrength: number;
  description: string;
  /** Generated axiological profile for decision-making */
  axiologicalProfile?: AxiologicalProfile;
  /** Primary and secondary sphere */
  primarySphere?: SphereName;
  secondarySphere?: SphereName;
}

/** Runtime state tracking for a rival god */
export interface RivalState {
  rivalId: string;
  active: boolean;
  interventionCount: number;
  agentsControlled: number;
  regionsInfluenced: string[];
  /** 0.0-1.0 how hostile this rival is toward the player currently */
  hostilityToPlayer: number;
  /** Ticks since last major action */
  ticksSinceAction?: number;
}

/** Rival archetype generation templates */
export type RivalArchetype = RivalBehavior;

/** Name fragments for procedural rival naming */
export const RIVAL_NAME_PREFIXES = [
  'The Iron', 'The Silent', 'The Burning', 'The Hollow',
  'The Crimson', 'The Pale', 'The Storm', 'The Bone',
  'The Veiled', 'The Shattered', 'The Crowned', 'The Blighted',
] as const;

export const RIVAL_NAME_SUFFIXES = [
  'Judge', 'Weaver', 'Tyrant', 'Prophet',
  'Shepherd', 'Warden', 'Harvester', 'Architect',
  'Wanderer', 'Oracle', 'Sentinel', 'Sovereign',
] as const;
```

Create `src/types/doomClock.ts`:

```typescript
/** The 7 doom clock archetypes */
export type DoomClockArchetype =
  | 'breach'       // outside force breaking through reality
  | 'convergence'  // all forces drawn to a single point
  | 'changing'     // new cosmic order replacing the old
  | 'sundering'    // world itself breaking apart
  | 'failing'      // core force of creation weakening
  | 'ascension'    // something approaching godhood
  | 'reckoning';   // past debts coming due

export const DOOM_CLOCK_ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'convergence', 'changing', 'sundering',
  'failing', 'ascension', 'reckoning',
];

/** 5-stage escalation (each archetype names them thematically) */
export const DOOM_STAGE_NAMES = [
  'Whispers', 'Signs', 'Tremors', 'Crisis', 'Culmination',
] as const;

/** An event fired at a doom clock stage transition */
export interface DoomEscalationEvent {
  id: string;
  description: string;
  /** Graph mutations to apply when this event fires */
  narrativeHook: string;
  /** Sphere this event is flavored by */
  sphere?: string;
}

/** A single escalation stage */
export interface DoomClockStage {
  stage: number;              // 1-5
  name: string;               // thematic name per archetype
  tickThreshold: number;      // 0.0-1.0 fraction of total ticks
  events: DoomEscalationEvent[];
}

/** Full doom clock definition for a run */
export interface DoomClockDefinition {
  archetype: DoomClockArchetype;
  totalTicks: number;         // total run length in ticks
  stages: [DoomClockStage, DoomClockStage, DoomClockStage, DoomClockStage, DoomClockStage];
}

/** Runtime doom clock state */
export interface DoomClockState {
  definitionArchetype: DoomClockArchetype;
  currentTick: number;
  totalTicks: number;
  currentStage: number;       // 1-5
  progress: number;           // 0.0-1.0 overall progress
  stageTransitions: number[]; // ticks at which each stage was entered
  expired: boolean;
  /** Accumulated acceleration/deceleration from player/rival actions */
  tickModifier: number;       // added to currentTick each real tick (default 1.0)
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/rival.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/rival.ts src/types/doomClock.ts src/engine/__tests__/rival.test.ts
git commit -m "feat: add rival god and doom clock type definitions"
```

---

### Task 2: Rival God Generator

**Files:**
- Create: `src/engine/rival.ts`
- Test: `src/engine/__tests__/rival.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/rival.test.ts`:

```typescript
import { generateRivals, createRivalState } from '../rival';
import type { CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

describe('rival god generator', () => {
  const playerAlignment: CosmologyProfile = {
    force: 0.05, matter: 0.05, energy: 0.10, life: 0.35,
    mind: 0.10, spirit: 0.25, time: 0.05, entropy: 0.05,
  };

  it('generates 2-4 rivals for a given seed', () => {
    const rivals = generateRivals(playerAlignment, 42);
    expect(rivals.length).toBeGreaterThanOrEqual(2);
    expect(rivals.length).toBeLessThanOrEqual(4);
  });

  it('generates deterministically for the same seed', () => {
    const a = generateRivals(playerAlignment, 42);
    const b = generateRivals(playerAlignment, 42);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].name).toBe(b[i].name);
      expect(a[i].behavior).toBe(b[i].behavior);
    }
  });

  it('generates different rivals for different seeds', () => {
    const a = generateRivals(playerAlignment, 42);
    const b = generateRivals(playerAlignment, 999);
    // At least one name should differ (extremely unlikely to be identical)
    const names_a = a.map(r => r.name).sort();
    const names_b = b.map(r => r.name).sort();
    expect(names_a).not.toEqual(names_b);
  });

  it('rival sphere alignment opposes or is orthogonal to player', () => {
    const rivals = generateRivals(playerAlignment, 42);
    for (const rival of rivals) {
      // Player is life/spirit dominant. Rival's top sphere should differ.
      const playerTop = SPHERE_NAMES.reduce((a, b) =>
        playerAlignment[a] > playerAlignment[b] ? a : b
      );
      const rivalTop = SPHERE_NAMES.reduce((a, b) =>
        rival.sphereAlignment[a] > rival.sphereAlignment[b] ? a : b
      );
      expect(rivalTop).not.toBe(playerTop);
    }
  });

  it('createRivalState returns clean initial state', () => {
    const state = createRivalState('actor_rival_1');
    expect(state.active).toBe(true);
    expect(state.interventionCount).toBe(0);
    expect(state.hostilityToPlayer).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/rival.test.ts`
Expected: FAIL — functions not found

**Step 3: Write the implementation**

Create `src/engine/rival.ts`:

```typescript
/**
 * Rival God Generator — procedural cosmic adversary creation.
 *
 * Generates 2-4 rival gods per run based on the player's sphere alignment
 * and a seed value (derived from World-Soul state in future phases).
 */
import type { CosmologyProfile, SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type {
  RivalDefinition,
  RivalState,
  RivalBehavior,
} from '../types/rival';
import { RIVAL_NAME_PREFIXES, RIVAL_NAME_SUFFIXES } from '../types/rival';

// ─── Seeded PRNG (same as ascendant.ts) ──────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BEHAVIORS: RivalBehavior[] = ['aggressive', 'subtle', 'territorial', 'expansionist'];

/**
 * Generate 2-4 rival gods for a run.
 *
 * Strategy:
 * 1. Determine count (2-4) from seed
 * 2. For each rival, pick spheres that oppose/are orthogonal to the player's dominant spheres
 * 3. Assign a behavioral archetype
 * 4. Generate a procedural name
 */
export function generateRivals(
  playerAlignment: CosmologyProfile,
  seed: number,
): RivalDefinition[] {
  const rng = mulberry32(seed);

  // Determine count: 2-4
  const count = 2 + Math.floor(rng() * 3); // 2, 3, or 4

  // Sort player spheres by weight (descending) to know what to oppose
  const playerSphereRank = [...SPHERE_NAMES].sort(
    (a, b) => playerAlignment[b] - playerAlignment[a],
  );
  const playerTopSpheres = playerSphereRank.slice(0, 2);
  const opposingSpheres = playerSphereRank.slice(-4); // bottom 4 are "opposed"

  const rivals: RivalDefinition[] = [];
  const usedPrefixes = new Set<number>();
  const usedSuffixes = new Set<number>();

  for (let i = 0; i < count; i++) {
    // Pick primary sphere from opposing/orthogonal pool
    const primaryIndex = Math.floor(rng() * opposingSpheres.length);
    const primary = opposingSpheres[primaryIndex];

    // Pick secondary from remaining non-player-top spheres
    const secondaryPool = SPHERE_NAMES.filter(
      s => s !== primary && !playerTopSpheres.includes(s),
    );
    const secondary = secondaryPool[Math.floor(rng() * secondaryPool.length)];

    // Build cosmology profile biased toward primary/secondary
    const profile = buildOpposingProfile(primary, secondary, rng);

    // Pick behavior
    const behavior = BEHAVIORS[Math.floor(rng() * BEHAVIORS.length)];

    // Generate name (avoid duplicates)
    let prefixIdx: number;
    do { prefixIdx = Math.floor(rng() * RIVAL_NAME_PREFIXES.length); }
    while (usedPrefixes.has(prefixIdx) && usedPrefixes.size < RIVAL_NAME_PREFIXES.length);
    usedPrefixes.add(prefixIdx);

    let suffixIdx: number;
    do { suffixIdx = Math.floor(rng() * RIVAL_NAME_SUFFIXES.length); }
    while (usedSuffixes.has(suffixIdx) && usedSuffixes.size < RIVAL_NAME_SUFFIXES.length);
    usedSuffixes.add(suffixIdx);

    const name = `${RIVAL_NAME_PREFIXES[prefixIdx]} ${RIVAL_NAME_SUFFIXES[suffixIdx]}`;

    rivals.push({
      id: `actor_rival_${i + 1}`,
      name,
      sphereAlignment: profile,
      behavior,
      oppositionStrength: 0.5 + rng() * 0.5,  // 0.5-1.0
      description: `A ${behavior} cosmic entity aligned with ${primary} and ${secondary}`,
      primarySphere: primary,
      secondarySphere: secondary,
    });
  }

  return rivals;
}

/**
 * Build a cosmology profile biased toward the given primary/secondary spheres.
 */
function buildOpposingProfile(
  primary: SphereName,
  secondary: SphereName,
  rng: () => number,
): CosmologyProfile {
  const profile: Record<string, number> = {};
  let remaining = 1.0;

  // Primary gets 30-45%
  const primaryWeight = 0.30 + rng() * 0.15;
  profile[primary] = primaryWeight;
  remaining -= primaryWeight;

  // Secondary gets 15-25%
  const secondaryWeight = 0.15 + rng() * 0.10;
  profile[secondary] = secondaryWeight;
  remaining -= secondaryWeight;

  // Distribute remainder across other spheres
  const others = SPHERE_NAMES.filter(s => s !== primary && s !== secondary);
  const shares: number[] = others.map(() => rng());
  const shareTotal = shares.reduce((s, v) => s + v, 0);
  others.forEach((sphere, i) => {
    profile[sphere] = (shares[i] / shareTotal) * remaining;
  });

  return profile as CosmologyProfile;
}

/**
 * Create initial runtime state for a rival god.
 */
export function createRivalState(rivalId: string): RivalState {
  return {
    rivalId,
    active: true,
    interventionCount: 0,
    agentsControlled: 0,
    regionsInfluenced: [],
    hostilityToPlayer: 0.5,
    ticksSinceAction: 0,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/rival.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/rival.ts src/engine/__tests__/rival.test.ts
git commit -m "feat: add procedural rival god generator"
```

---

### Task 3: Rival AI Decision Loop

**Files:**
- Modify: `src/engine/rival.ts` (add AI decision functions)
- Test: `src/engine/__tests__/rival.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/rival.test.ts`:

```typescript
import { selectRivalAction, updateRivalState } from '../rival';
import type { RivalDefinition, RivalState } from '../../types/rival';

describe('rival AI decision loop', () => {
  const rival: RivalDefinition = {
    id: 'actor_rival_1',
    name: 'The Iron Judge',
    sphereAlignment: { force: 0.35, matter: 0.25, energy: 0.10, life: 0.05, mind: 0.05, spirit: 0.05, time: 0.10, entropy: 0.05 },
    behavior: 'aggressive',
    oppositionStrength: 0.8,
    description: 'War god',
    primarySphere: 'force',
    secondarySphere: 'matter',
  };

  it('selectRivalAction returns an action based on behavior archetype', () => {
    const state: RivalState = {
      rivalId: 'actor_rival_1',
      active: true,
      interventionCount: 5,
      agentsControlled: 3,
      regionsInfluenced: ['loc_north'],
      hostilityToPlayer: 0.7,
      ticksSinceAction: 10,
    };

    const action = selectRivalAction(rival, state, 0.5);
    expect(action).toBeDefined();
    expect(action.type).toBeDefined();
    expect(['recruit', 'intervene', 'expand', 'attack', 'wait']).toContain(action.type);
  });

  it('aggressive rivals prefer attack/intervene actions', () => {
    const state: RivalState = {
      rivalId: 'actor_rival_1', active: true,
      interventionCount: 10, agentsControlled: 5,
      regionsInfluenced: ['loc_1', 'loc_2'],
      hostilityToPlayer: 0.9, ticksSinceAction: 5,
    };

    // Run multiple times with different rolls, count attack/intervene
    let aggressiveCount = 0;
    for (let i = 0; i < 10; i++) {
      const action = selectRivalAction(rival, state, i / 10);
      if (action.type === 'attack' || action.type === 'intervene') aggressiveCount++;
    }
    // Aggressive archetype should favor these at least 40% of the time
    expect(aggressiveCount).toBeGreaterThanOrEqual(4);
  });

  it('updateRivalState increments counters', () => {
    let state: RivalState = {
      rivalId: 'actor_rival_1', active: true,
      interventionCount: 0, agentsControlled: 0,
      regionsInfluenced: [], hostilityToPlayer: 0.5,
      ticksSinceAction: 0,
    };

    state = updateRivalState(state, { type: 'intervene', target: 'actor_1' });
    expect(state.interventionCount).toBe(1);
    expect(state.ticksSinceAction).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/rival.test.ts`
Expected: FAIL — functions not found

**Step 3: Write the implementation**

Append to `src/engine/rival.ts`:

```typescript
/** A rival god's chosen action for a tick */
export interface RivalAction {
  type: 'recruit' | 'intervene' | 'expand' | 'attack' | 'wait';
  target?: string;  // target node ID
}

/** Behavior-based action probability weights */
const BEHAVIOR_WEIGHTS: Record<RivalBehavior, Record<RivalAction['type'], number>> = {
  aggressive:    { recruit: 0.10, intervene: 0.25, expand: 0.10, attack: 0.45, wait: 0.10 },
  subtle:        { recruit: 0.20, intervene: 0.35, expand: 0.15, attack: 0.10, wait: 0.20 },
  territorial:   { recruit: 0.15, intervene: 0.20, expand: 0.30, attack: 0.20, wait: 0.15 },
  expansionist:  { recruit: 0.30, intervene: 0.15, expand: 0.35, attack: 0.10, wait: 0.10 },
};

const ACTION_TYPES: RivalAction['type'][] = ['recruit', 'intervene', 'expand', 'attack', 'wait'];

/**
 * Select a rival god's next action based on behavior archetype and current state.
 * Uses weighted random selection biased by the rival's behavior profile.
 *
 * @param deterministicRoll - [0, 1) for testing
 */
export function selectRivalAction(
  rival: RivalDefinition,
  state: RivalState,
  deterministicRoll?: number,
): RivalAction {
  const weights = BEHAVIOR_WEIGHTS[rival.behavior];
  const roll = deterministicRoll ?? Math.random();

  // Hostility bias: high hostility increases attack weight
  const adjustedWeights = { ...weights };
  if (state.hostilityToPlayer > 0.7) {
    adjustedWeights.attack += 0.15;
    adjustedWeights.wait = Math.max(0, adjustedWeights.wait - 0.15);
  }

  // Normalize
  const total = ACTION_TYPES.reduce((s, t) => s + adjustedWeights[t], 0);

  let cumulative = 0;
  for (const actionType of ACTION_TYPES) {
    cumulative += adjustedWeights[actionType] / total;
    if (roll < cumulative) {
      return { type: actionType };
    }
  }

  return { type: 'wait' };
}

/**
 * Update rival state after an action is taken.
 */
export function updateRivalState(
  state: RivalState,
  action: RivalAction,
): RivalState {
  const updated = { ...state, ticksSinceAction: 0 };

  switch (action.type) {
    case 'recruit':
      updated.agentsControlled++;
      break;
    case 'intervene':
      updated.interventionCount++;
      break;
    case 'expand':
      if (action.target && !updated.regionsInfluenced.includes(action.target)) {
        updated.regionsInfluenced = [...updated.regionsInfluenced, action.target];
      }
      break;
    case 'attack':
      updated.interventionCount++;
      updated.hostilityToPlayer = Math.min(1.0, updated.hostilityToPlayer + 0.05);
      break;
    case 'wait':
      break;
  }

  return updated;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/rival.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/rival.ts src/engine/__tests__/rival.test.ts
git commit -m "feat: add rival AI decision loop with behavior archetypes"
```

---

### Task 4: Doom Clock Engine

**Files:**
- Create: `src/engine/doomClock.ts`
- Create: `src/engine/__tests__/doomClock.test.ts`

**Step 1: Write the failing tests**

Create `src/engine/__tests__/doomClock.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  generateDoomClock,
  createDoomClockState,
  advanceDoomClock,
  getDoomClockStage,
  accelerateDoomClock,
  decelerateDoomClock,
} from '../doomClock';
import type { DoomClockArchetype } from '../../types/doomClock';

describe('doom clock generator', () => {
  it('generates a doom clock with 5 stages for any archetype', () => {
    const archetypes: DoomClockArchetype[] = [
      'breach', 'convergence', 'changing', 'sundering',
      'failing', 'ascension', 'reckoning',
    ];
    for (const archetype of archetypes) {
      const clock = generateDoomClock(archetype, 120, 42);
      expect(clock.stages.length).toBe(5);
      expect(clock.archetype).toBe(archetype);
      expect(clock.totalTicks).toBe(120);
    }
  });

  it('stage thresholds increase monotonically to 1.0', () => {
    const clock = generateDoomClock('breach', 120, 42);
    for (let i = 1; i < clock.stages.length; i++) {
      expect(clock.stages[i].tickThreshold).toBeGreaterThan(
        clock.stages[i - 1].tickThreshold,
      );
    }
    expect(clock.stages[4].tickThreshold).toBe(1.0);
  });
});

describe('doom clock state machine', () => {
  it('createDoomClockState returns initial state at stage 1', () => {
    const state = createDoomClockState('breach', 120);
    expect(state.currentStage).toBe(1);
    expect(state.currentTick).toBe(0);
    expect(state.progress).toBe(0);
    expect(state.expired).toBe(false);
  });

  it('advanceDoomClock increments tick and updates progress', () => {
    let state = createDoomClockState('breach', 100);
    state = advanceDoomClock(state);
    expect(state.currentTick).toBe(1);
    expect(state.progress).toBeCloseTo(0.01);
  });

  it('advanceDoomClock transitions stages at thresholds', () => {
    let state = createDoomClockState('breach', 100);
    // Advance to 20% (stage 2 threshold)
    for (let i = 0; i < 20; i++) {
      state = advanceDoomClock(state);
    }
    expect(state.currentStage).toBeGreaterThanOrEqual(2);
  });

  it('doom clock expires when tick reaches totalTicks', () => {
    let state = createDoomClockState('breach', 10);
    for (let i = 0; i < 10; i++) {
      state = advanceDoomClock(state);
    }
    expect(state.expired).toBe(true);
    expect(state.currentStage).toBe(5);
  });

  it('getDoomClockStage returns correct stage for progress', () => {
    expect(getDoomClockStage(0.0)).toBe(1);
    expect(getDoomClockStage(0.19)).toBe(1);
    expect(getDoomClockStage(0.20)).toBe(2);
    expect(getDoomClockStage(0.39)).toBe(2);
    expect(getDoomClockStage(0.40)).toBe(3);
    expect(getDoomClockStage(0.80)).toBe(5);
    expect(getDoomClockStage(1.0)).toBe(5);
  });

  it('accelerateDoomClock increases tick modifier', () => {
    let state = createDoomClockState('breach', 100);
    state = accelerateDoomClock(state, 0.5);
    expect(state.tickModifier).toBeCloseTo(1.5);

    // Advancing now should increment by 1.5
    state = advanceDoomClock(state);
    expect(state.currentTick).toBeCloseTo(1.5);
  });

  it('decelerateDoomClock decreases tick modifier (min 0.1)', () => {
    let state = createDoomClockState('breach', 100);
    state = decelerateDoomClock(state, 0.5);
    expect(state.tickModifier).toBeCloseTo(0.5);

    state = decelerateDoomClock(state, 10.0);
    expect(state.tickModifier).toBeCloseTo(0.1); // clamped
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/doomClock.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

Create `src/engine/doomClock.ts`:

```typescript
/**
 * Doom Clock Engine — thematic run timer with escalation stages.
 *
 * The doom clock provides time pressure and narrative structure.
 * 7 archetypes each have themed 5-stage escalation tracks.
 */
import type {
  DoomClockArchetype,
  DoomClockDefinition,
  DoomClockStage,
  DoomClockState,
  DoomEscalationEvent,
} from '../types/doomClock';

// ─── Stage Thresholds ────────────────────────────────────────────

/** Default stage thresholds (fraction of total ticks) */
const DEFAULT_THRESHOLDS = [0.20, 0.40, 0.60, 0.80, 1.0];

/** Archetype-specific stage names */
const ARCHETYPE_STAGE_NAMES: Record<DoomClockArchetype, [string, string, string, string, string]> = {
  breach:       ['Strange Whispers', 'Reality Cracks', 'The Thinning', 'Barriers Fail', 'The Breach'],
  convergence:  ['Distant Pull', 'Gathering Forces', 'The Drawing', 'Convergence Point', 'The Singularity'],
  changing:     ['Old Winds Die', 'New Powers Stir', 'The Turning', 'Power Shifts', 'The New Order'],
  sundering:    ['Hairline Fractures', 'Tremors', 'The Splitting', 'Lands Drift', 'The Sundering'],
  failing:      ['Waning Light', 'Creeping Entropy', 'The Dimming', 'Collapse Begins', 'The Failing'],
  ascension:    ['Mortal Spark', 'Growing Power', 'Threshold Nears', 'Divine Trial', 'The Ascension'],
  reckoning:    ['Old Debts Surface', 'Witnesses Gather', 'The Accounting', 'Judgment Begins', 'The Reckoning'],
};

// ─── Generator ───────────────────────────────────────────────────

/**
 * Generate a doom clock definition for a run.
 */
export function generateDoomClock(
  archetype: DoomClockArchetype,
  totalTicks: number,
  _seed: number,
): DoomClockDefinition {
  const stageNames = ARCHETYPE_STAGE_NAMES[archetype];

  const stages = DEFAULT_THRESHOLDS.map((threshold, i) => ({
    stage: i + 1,
    name: stageNames[i],
    tickThreshold: threshold,
    events: [{
      id: `doom_${archetype}_stage_${i + 1}`,
      description: `${stageNames[i]} — the ${archetype} intensifies`,
      narrativeHook: `doom_${archetype}_${i + 1}`,
    }] as DoomEscalationEvent[],
  })) as [DoomClockStage, DoomClockStage, DoomClockStage, DoomClockStage, DoomClockStage];

  return {
    archetype,
    totalTicks,
    stages,
  };
}

// ─── State Machine ───────────────────────────────────────────────

/**
 * Create initial doom clock state.
 */
export function createDoomClockState(
  archetype: DoomClockArchetype,
  totalTicks: number,
): DoomClockState {
  return {
    definitionArchetype: archetype,
    currentTick: 0,
    totalTicks,
    currentStage: 1,
    progress: 0,
    stageTransitions: [0], // stage 1 starts at tick 0
    expired: false,
    tickModifier: 1.0,
  };
}

/**
 * Get the doom clock stage (1-5) for a given progress value.
 */
export function getDoomClockStage(progress: number): number {
  for (let i = 0; i < DEFAULT_THRESHOLDS.length; i++) {
    if (progress < DEFAULT_THRESHOLDS[i]) return i + 1;
  }
  return 5;
}

/**
 * Advance the doom clock by one real tick (applying tickModifier).
 * Returns updated state with new progress, stage, and expiry check.
 */
export function advanceDoomClock(state: DoomClockState): DoomClockState {
  if (state.expired) return state;

  const newTick = state.currentTick + state.tickModifier;
  const clampedTick = Math.min(newTick, state.totalTicks);
  const newProgress = clampedTick / state.totalTicks;
  const newStage = getDoomClockStage(newProgress);
  const expired = clampedTick >= state.totalTicks;

  // Track stage transitions
  const transitions = [...state.stageTransitions];
  if (newStage > state.currentStage) {
    transitions.push(clampedTick);
  }

  return {
    ...state,
    currentTick: clampedTick,
    progress: newProgress,
    currentStage: newStage,
    stageTransitions: transitions,
    expired,
  };
}

/**
 * Accelerate the doom clock (rival actions, world events).
 */
export function accelerateDoomClock(state: DoomClockState, amount: number): DoomClockState {
  return {
    ...state,
    tickModifier: state.tickModifier + amount,
  };
}

/**
 * Decelerate the doom clock (player interventions). Minimum 0.1.
 */
export function decelerateDoomClock(state: DoomClockState, amount: number): DoomClockState {
  return {
    ...state,
    tickModifier: Math.max(0.1, state.tickModifier - amount),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/doomClock.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/doomClock.ts src/engine/__tests__/doomClock.test.ts
git commit -m "feat: add doom clock engine with 7 archetypes and stage escalation"
```

---

### Task 5: Integration Test — Rivals + Doom Clock

**Files:**
- Create: `src/engine/__tests__/rival-doom-integration.test.ts`

**Step 1: Write the integration test**

```typescript
import { describe, it, expect } from 'vitest';
import { generateRivals, createRivalState, selectRivalAction, updateRivalState } from '../rival';
import { generateDoomClock, createDoomClockState, advanceDoomClock, accelerateDoomClock } from '../doomClock';
import type { CosmologyProfile } from '../../types/index';

describe('Rival + Doom Clock integration', () => {
  const playerAlignment: CosmologyProfile = {
    force: 0.05, matter: 0.05, energy: 0.10, life: 0.35,
    mind: 0.10, spirit: 0.25, time: 0.05, entropy: 0.05,
  };

  it('full run simulation: rivals act and doom clock advances', () => {
    // Generate rivals
    const rivals = generateRivals(playerAlignment, 42);
    expect(rivals.length).toBeGreaterThanOrEqual(2);

    // Generate doom clock
    const doomDef = generateDoomClock('breach', 50, 42);
    let doomState = createDoomClockState('breach', 50);

    // Initialize rival states
    let rivalStates = rivals.map(r => createRivalState(r.id));

    // Simulate 50 ticks
    for (let tick = 0; tick < 50; tick++) {
      // Each rival acts
      for (let i = 0; i < rivals.length; i++) {
        const action = selectRivalAction(rivals[i], rivalStates[i], (tick * 7 + i * 13) % 100 / 100);
        rivalStates[i] = updateRivalState(rivalStates[i], action);

        // Aggressive rivals accelerate doom clock
        if (action.type === 'attack') {
          doomState = accelerateDoomClock(doomState, 0.02);
        }
      }

      // Advance doom clock
      doomState = advanceDoomClock(doomState);
    }

    // Doom clock should have expired (50 ticks, possibly accelerated)
    expect(doomState.expired).toBe(true);
    expect(doomState.currentStage).toBe(5);

    // Rivals should have accumulated activity
    for (const state of rivalStates) {
      expect(state.interventionCount + state.agentsControlled).toBeGreaterThan(0);
    }
  });
});
```

**Step 2: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/rival-doom-integration.test.ts`
Expected: PASS

**Step 3: Run full test suite**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run`
Expected: All tests pass (0 failures)

**Step 4: Commit**

```bash
git add src/engine/__tests__/rival-doom-integration.test.ts
git commit -m "feat: add rival god and doom clock integration test"
```

---

## Summary

| Task | Files | Tests | What it builds |
|------|-------|-------|---------------|
| 1 | `src/types/rival.ts`, `src/types/doomClock.ts` | 5 | Type defs: rival definition, behavior archetypes, doom archetypes, escalation stages |
| 2 | `src/engine/rival.ts` | 5 | Rival generator: procedural name/sphere/behavior generation from seed |
| 3 | `src/engine/rival.ts` | 3 | Rival AI: behavior-weighted action selection, state updates |
| 4 | `src/engine/doomClock.ts` | 7 | Doom clock: generation, state machine, acceleration/deceleration |
| 5 | integration test | 1 | Full sim: rivals act + doom clock advances over 50 ticks |
| **Total** | **4 files** | **~21 tests** | |

**Exports from this phase:**
- Types: `RivalBehavior`, `RivalDefinition`, `RivalState`, `RivalAction`, `DoomClockArchetype`, `DoomClockDefinition`, `DoomClockState`
- Constants: `DOOM_CLOCK_ARCHETYPES`, `RIVAL_NAME_PREFIXES/SUFFIXES`, `BEHAVIOR_WEIGHTS`
- Functions: `generateRivals()`, `createRivalState()`, `selectRivalAction()`, `updateRivalState()`, `generateDoomClock()`, `createDoomClockState()`, `advanceDoomClock()`, `getDoomClockStage()`, `accelerateDoomClock()`, `decelerateDoomClock()`

**Phase 3B depends on:** Doom clock stage transitions (trigger Chronicle-tier narrative entries). Rival names/descriptions (feed the prose engine).
