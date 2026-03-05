# Phase 4B: Echo System & Great Chronicle — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Echo System (three echo types — Legacy/Monument/Relic — with cosmic and divine selection pools, degradation across cycles, and world-generation injection hooks) and the Great Chronicle (structured volume/chapter/interlude/echo-thread format with cross-cycle narrative continuity).

**Architecture:** Echoes are typed metaprogression tokens derived from significant graph nodes at cycle end. Cosmic echoes are auto-selected by narrative significance score; divine echoes are player-chosen. Each echo injects thematic content into the next cycle's world generation (cultural templates, location features, quest seeds). Echoes degrade over cycles, eventually fading. The Great Chronicle is a persistent document structure (volumes → chapters → interludes → echo threads) that accumulates across an entire campaign, with each cycle producing one volume.

**Tech Stack:** TypeScript, Vitest, existing APIs from all prior phases.

**Existing code to build on:**
- `src/types/worldSoul.ts` (Phase 4A) — `WorldSoulState`, `HarvestOutcome`, `CycleTransition`, `HarvestType`, `HARVEST_ECHO_COUNTS`, `ResonanceMemory`
- `src/engine/worldSoul.ts` (Phase 4A) — `selectTopMemories()`, `degradeMemories()`, `pruneMemories()`
- `src/types/narrative.ts` (Phase 3B) — `ChronicleEntry`, `NarrativeEvent`, `ProseFragment`
- `src/types/doomClock.ts` (Phase 3A) — `DoomClockArchetype`
- `src/types/graph.ts` — `GraphNode`, `GraphEdge`, `NodeType`, `ActorType`
- `src/engine/graph.ts` — `WorldGraph`
- `src/types/index.ts` — `SphereName`, `SPHERE_NAMES`

**Dependency order:**
```
Task 1: Echo type definitions
  ↓
Task 2: Echo selection & scoring
  ↓
Task 3: Echo degradation & injection hooks
  ↓
Task 4: Great Chronicle structure & assembly
  ↓
Task 5: Integration test (multi-cycle echo lifecycle + chronicle)
```

---

## Conventions (same as prior phases)

- **Tests** go in `src/engine/__tests__/<module>.test.ts`
- **IDs** use prefixes: `echo_`, `vol_`, `chapter_`, etc.
- **No classes** in engine modules — export pure functions
- **All engine code** is deterministic when given a seed/roll parameter
- **Imports** use `type` keyword for type-only imports

---

## Task 1: Echo Type Definitions

**Files:**
- Create: `src/types/echo.ts`
- Create: `src/types/chronicle.ts`
- Test: `src/engine/__tests__/echo.test.ts`

### Step 1: Write the failing test

```typescript
// src/engine/__tests__/echo.test.ts
import { describe, it, expect } from 'vitest';
import {
  type EchoType,
  type EchoSource,
  type EchoDefinition,
  type EchoState,
  type EchoInjection,
  type InjectionType,
  ECHO_TYPES,
  ECHO_DEGRADATION_RATE,
  ECHO_FADE_THRESHOLD,
} from '../../types/echo';
import {
  type ChronicleVolume,
  type ChronicleChapter,
  type ChronicleInterlude,
  type EchoThread,
  type GreatChronicle,
} from '../../types/chronicle';

describe('echo types', () => {
  it('exports ECHO_TYPES', () => {
    expect(ECHO_TYPES).toEqual(['legacy', 'monument', 'relic']);
  });

  it('exports ECHO_DEGRADATION_RATE', () => {
    expect(ECHO_DEGRADATION_RATE).toBe(0.15);
  });

  it('exports ECHO_FADE_THRESHOLD', () => {
    expect(ECHO_FADE_THRESHOLD).toBe(0.9);
  });

  it('can construct an EchoDefinition for a legacy echo', () => {
    const echo: EchoDefinition = {
      id: 'echo_hero_001',
      echoType: 'legacy',
      source: 'cosmic',
      originNodeId: 'actor_hero',
      originCycle: 1,
      name: 'The Hero of Velanthos',
      summary: 'A champion who united the garden-priests against the breach.',
      sphereAffinities: ['life', 'spirit'],
      significance: 0.85,
      injection: {
        injectionType: 'cultural_template',
        description: 'Seeds myths of a unifying champion and descendant lineages with inherited devotion traits.',
        sphereBiases: { life: 0.05, spirit: 0.03 },
        traitTendencies: ['devotion_independence', 'courage_prudence'],
      },
    };
    expect(echo.echoType).toBe('legacy');
    expect(echo.injection.injectionType).toBe('cultural_template');
  });

  it('can construct an EchoDefinition for a monument echo', () => {
    const echo: EchoDefinition = {
      id: 'echo_temple_001',
      echoType: 'monument',
      source: 'divine',
      originNodeId: 'loc_temple',
      originCycle: 1,
      name: 'The Shattered Sanctum',
      summary: 'A temple that channeled spirit energy before the breach consumed it.',
      sphereAffinities: ['spirit'],
      significance: 0.7,
      injection: {
        injectionType: 'location_feature',
        description: 'Seeds a sacred ruin with spirit sphere bias and cultural place-memory.',
        sphereBiases: { spirit: 0.04 },
      },
    };
    expect(echo.echoType).toBe('monument');
  });

  it('can construct an EchoDefinition for a relic echo', () => {
    const echo: EchoDefinition = {
      id: 'echo_crown_001',
      echoType: 'relic',
      source: 'cosmic',
      originNodeId: 'artifact_crown',
      originCycle: 2,
      name: 'Griefender',
      summary: 'A blade forged in sorrow that cut through despair.',
      sphereAffinities: ['force', 'entropy'],
      significance: 0.9,
      injection: {
        injectionType: 'quest_seed',
        description: 'Seeds a discoverable artifact with modified trait graph and associated myths.',
        sphereBiases: { force: 0.03, entropy: 0.02 },
        traitTendencies: ['wrath_patience'],
      },
    };
    expect(echo.echoType).toBe('relic');
    expect(echo.injection.injectionType).toBe('quest_seed');
  });

  it('can construct an EchoState', () => {
    const state: EchoState = {
      id: 'echo_hero_001',
      degradation: 0.3,
      cyclesActive: 2,
      faded: false,
    };
    expect(state.faded).toBe(false);
  });
});

describe('chronicle types', () => {
  it('can construct a ChronicleChapter', () => {
    const chapter: ChronicleChapter = {
      id: 'chapter_001',
      title: 'The Siege of the Eastern Gate',
      prose: 'As entropy clawed at the foundations...',
      tick: 45,
      significance: 0.88,
      spheres: ['entropy', 'force'],
      actorIds: ['actor_hero', 'actor_villain'],
    };
    expect(chapter.significance).toBe(0.88);
  });

  it('can construct a ChronicleInterlude', () => {
    const interlude: ChronicleInterlude = {
      id: 'interlude_001',
      summary: 'In the weeks that followed, trade routes reopened and the harvest was bountiful.',
      tickRange: { start: 30, end: 44 },
      eventCount: 12,
    };
    expect(interlude.eventCount).toBe(12);
  });

  it('can construct an EchoThread', () => {
    const thread: EchoThread = {
      echoId: 'echo_crown_001',
      appearances: [
        { cycleNumber: 1, volumeId: 'vol_001', description: 'First forged in the Age of the Breach.' },
        { cycleNumber: 3, volumeId: 'vol_003', description: 'Appeared as a rusted relic in the Cycle of the Failing.' },
      ],
    };
    expect(thread.appearances).toHaveLength(2);
  });

  it('can construct a ChronicleVolume', () => {
    const volume: ChronicleVolume = {
      id: 'vol_001',
      cycleNumber: 1,
      title: 'The Age of the Breach',
      doomArchetype: 'breach',
      chapters: [],
      interludes: [],
      harvestSummary: 'The world ended in fire and chaos.',
    };
    expect(volume.doomArchetype).toBe('breach');
  });

  it('can construct a GreatChronicle', () => {
    const chronicle: GreatChronicle = {
      volumes: [],
      echoThreads: [],
    };
    expect(chronicle.volumes).toHaveLength(0);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npx vitest run src/engine/__tests__/echo.test.ts`
Expected: FAIL — modules not found

### Step 3: Write minimal implementation

```typescript
// src/types/echo.ts
import type { SphereName } from './index';
import type { ValuePair } from './agent';

// ── Echo Types ──────────────────────────────────────────────────

export const ECHO_TYPES = ['legacy', 'monument', 'relic'] as const;
export type EchoType = typeof ECHO_TYPES[number];

/** How the echo was selected */
export type EchoSource = 'cosmic' | 'divine';

/** Per-cycle degradation amount */
export const ECHO_DEGRADATION_RATE = 0.15;

/** Degradation level at which an echo fades permanently */
export const ECHO_FADE_THRESHOLD = 0.9;

// ── Injection ───────────────────────────────────────────────────

/** How an echo injects content into the next world */
export type InjectionType =
  | 'cultural_template'  // Legacy: myths, descendant lineages, NPC archetypes
  | 'location_feature'   // Monument: ruins, sacred/cursed sites, place-memories
  | 'quest_seed';        // Relic: discoverable items with trait graphs, associated myths

export interface EchoInjection {
  injectionType: InjectionType;
  /** Human-readable description of what this echo seeds */
  description: string;
  /** Sphere weight biases to apply during world generation */
  sphereBiases?: Partial<Record<SphereName, number>>;
  /** Trait tendencies to seed in descendant actors/cultures */
  traitTendencies?: ValuePair[];
}

// ── Echo Definition ─────────────────────────────────────────────

/** The full definition of an echo, created at harvest time */
export interface EchoDefinition {
  id: string;
  echoType: EchoType;
  source: EchoSource;
  /** The graph node this echo was derived from */
  originNodeId: string;
  /** Which cycle this echo was created in */
  originCycle: number;
  name: string;
  summary: string;
  sphereAffinities: SphereName[];
  /** 0.0–1.0 how significant the source event/node was */
  significance: number;
  injection: EchoInjection;
}

// ── Echo Runtime State ──────────────────────────────────────────

/** Per-echo state tracked across cycles */
export interface EchoState {
  id: string;
  /** 0.0–1.0 how degraded this echo is */
  degradation: number;
  /** How many cycles this echo has been active */
  cyclesActive: number;
  /** True when degradation >= ECHO_FADE_THRESHOLD */
  faded: boolean;
}
```

```typescript
// src/types/chronicle.ts
import type { SphereName } from './index';
import type { DoomClockArchetype } from './doomClock';

// ── Chronicle Chapter (from tier-3 entries) ─────────────────────

export interface ChronicleChapter {
  id: string;
  title: string;
  prose: string;
  /** The tick this chapter corresponds to */
  tick: number;
  significance: number;
  spheres: SphereName[];
  actorIds: string[];
}

// ── Interlude (compressed routine summaries) ────────────────────

export interface ChronicleInterlude {
  id: string;
  summary: string;
  tickRange: { start: number; end: number };
  /** How many routine events were compressed */
  eventCount: number;
}

// ── Echo Thread (cross-volume tracking) ─────────────────────────

export interface EchoThreadAppearance {
  cycleNumber: number;
  volumeId: string;
  description: string;
}

export interface EchoThread {
  echoId: string;
  appearances: EchoThreadAppearance[];
}

// ── Volume (one per cycle) ──────────────────────────────────────

export interface ChronicleVolume {
  id: string;
  cycleNumber: number;
  /** Named after the doom clock archetype, e.g. "The Age of the Breach" */
  title: string;
  doomArchetype: DoomClockArchetype;
  chapters: ChronicleChapter[];
  interludes: ChronicleInterlude[];
  harvestSummary: string;
}

// ── The Great Chronicle ─────────────────────────────────────────

export interface GreatChronicle {
  volumes: ChronicleVolume[];
  echoThreads: EchoThread[];
}
```

### Step 4: Run test to verify it passes

Run: `npx vitest run src/engine/__tests__/echo.test.ts`
Expected: PASS (all 11 tests)

### Step 5: Commit

```bash
git add src/types/echo.ts src/types/chronicle.ts src/engine/__tests__/echo.test.ts
git commit -m "feat(echo): add type definitions for Echo System and Great Chronicle"
```

---

## Task 2: Echo Selection & Scoring

**Files:**
- Create: `src/engine/echo.ts`
- Test: `src/engine/__tests__/echo.test.ts` (append)

### Step 1: Write the failing tests

```typescript
// Append to src/engine/__tests__/echo.test.ts

import {
  computeSignificanceScore,
  selectCosmicEchoes,
  buildEchoDefinition,
  createEchoState,
} from '../echo';
import type { GraphNode } from '../../types/graph';

describe('Echo selection & scoring', () => {
  const makeNode = (id: string, type: string, edgeCount: number, eventCount: number): {
    node: GraphNode;
    edgeCount: number;
    eventCount: number;
  } => ({
    node: {
      id,
      type: type as any,
      name: `Node ${id}`,
      properties: {},
    },
    edgeCount,
    eventCount,
  });

  it('computeSignificanceScore combines edge count and event participation', () => {
    const score = computeSignificanceScore(10, 5, 'actor');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('computeSignificanceScore gives higher scores for more edges', () => {
    const low = computeSignificanceScore(2, 3, 'actor');
    const high = computeSignificanceScore(20, 3, 'actor');
    expect(high).toBeGreaterThan(low);
  });

  it('computeSignificanceScore gives higher scores for more event participation', () => {
    const low = computeSignificanceScore(5, 1, 'actor');
    const high = computeSignificanceScore(5, 15, 'actor');
    expect(high).toBeGreaterThan(low);
  });

  it('computeSignificanceScore weights actors higher than locations', () => {
    const actor = computeSignificanceScore(5, 5, 'actor');
    const loc = computeSignificanceScore(5, 5, 'location');
    expect(actor).toBeGreaterThanOrEqual(loc);
  });

  it('selectCosmicEchoes picks top N by significance score', () => {
    const candidates = [
      { nodeId: 'a', score: 0.5 },
      { nodeId: 'b', score: 0.9 },
      { nodeId: 'c', score: 0.3 },
      { nodeId: 'd', score: 0.8 },
      { nodeId: 'e', score: 0.7 },
    ];
    const selected = selectCosmicEchoes(candidates, 3);
    expect(selected).toHaveLength(3);
    expect(selected[0].nodeId).toBe('b');
    expect(selected[1].nodeId).toBe('d');
    expect(selected[2].nodeId).toBe('e');
  });

  it('selectCosmicEchoes returns fewer if not enough candidates', () => {
    const candidates = [
      { nodeId: 'a', score: 0.5 },
    ];
    const selected = selectCosmicEchoes(candidates, 5);
    expect(selected).toHaveLength(1);
  });

  it('buildEchoDefinition creates a legacy echo from an actor node', () => {
    const echo = buildEchoDefinition(
      'echo_001',
      {
        id: 'actor_hero',
        type: 'actor',
        name: 'Velanthos',
        properties: { actorType: 'individual' },
      },
      'cosmic',
      1,
      0.85,
      ['life', 'spirit']
    );
    expect(echo.echoType).toBe('legacy');
    expect(echo.injection.injectionType).toBe('cultural_template');
    expect(echo.source).toBe('cosmic');
  });

  it('buildEchoDefinition creates a monument echo from a location node', () => {
    const echo = buildEchoDefinition(
      'echo_002',
      {
        id: 'loc_temple',
        type: 'location',
        name: 'The Shattered Sanctum',
        properties: {},
      },
      'divine',
      2,
      0.7,
      ['spirit']
    );
    expect(echo.echoType).toBe('monument');
    expect(echo.injection.injectionType).toBe('location_feature');
  });

  it('buildEchoDefinition creates a relic echo from an artifact node', () => {
    const echo = buildEchoDefinition(
      'echo_003',
      {
        id: 'artifact_sword',
        type: 'artifact',
        name: 'Griefender',
        properties: {},
      },
      'cosmic',
      1,
      0.9,
      ['force', 'entropy']
    );
    expect(echo.echoType).toBe('relic');
    expect(echo.injection.injectionType).toBe('quest_seed');
  });

  it('createEchoState returns fresh state with zero degradation', () => {
    const state = createEchoState('echo_001');
    expect(state.degradation).toBe(0);
    expect(state.cyclesActive).toBe(0);
    expect(state.faded).toBe(false);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npx vitest run src/engine/__tests__/echo.test.ts`
Expected: FAIL — `computeSignificanceScore` not found

### Step 3: Write minimal implementation

```typescript
// src/engine/echo.ts
import type { GraphNode, NodeType } from '../types/graph';
import type { SphereName } from '../types/index';
import type {
  EchoType,
  EchoSource,
  EchoDefinition,
  EchoState,
  EchoInjection,
  InjectionType,
} from '../types/echo';
import { ECHO_DEGRADATION_RATE, ECHO_FADE_THRESHOLD } from '../types/echo';

// ── Significance scoring ────────────────────────────────────────

/** Node type weight — actors are slightly more significant than locations/artifacts */
const NODE_TYPE_WEIGHT: Partial<Record<NodeType, number>> = {
  actor: 1.0,
  location: 0.85,
  artifact: 0.95,
  trait: 0.5,
};

/** Compute a 0–1 significance score for a graph node based on its connectivity
 *  and event participation. Uses a sigmoid-like formula. */
export function computeSignificanceScore(
  edgeCount: number,
  eventCount: number,
  nodeType: NodeType | string
): number {
  const typeWeight = NODE_TYPE_WEIGHT[nodeType as NodeType] ?? 0.5;
  // Raw score: weighted combination of edges and events
  const raw = (edgeCount * 0.4 + eventCount * 0.6) * typeWeight;
  // Sigmoid normalization: 2/(1+e^(-raw/5)) - 1, maps [0,∞) to [0,1)
  const normalized = 2 / (1 + Math.exp(-raw / 5)) - 1;
  return Math.max(0, Math.min(1, normalized));
}

// ── Cosmic echo selection ───────────────────────────────────────

export interface EchoCandidate {
  nodeId: string;
  score: number;
}

/** Select top N candidates by significance score, sorted descending */
export function selectCosmicEchoes(
  candidates: EchoCandidate[],
  count: number
): EchoCandidate[] {
  return [...candidates]
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// ── Echo building ───────────────────────────────────────────────

/** Map node type to echo type */
function nodeTypeToEchoType(nodeType: NodeType | string): EchoType {
  switch (nodeType) {
    case 'actor': return 'legacy';
    case 'location': return 'monument';
    case 'artifact': return 'relic';
    default: return 'legacy'; // fallback
  }
}

/** Map echo type to injection type */
function echoTypeToInjectionType(echoType: EchoType): InjectionType {
  switch (echoType) {
    case 'legacy': return 'cultural_template';
    case 'monument': return 'location_feature';
    case 'relic': return 'quest_seed';
  }
}

/** Build an EchoDefinition from a graph node */
export function buildEchoDefinition(
  echoId: string,
  node: GraphNode,
  source: EchoSource,
  originCycle: number,
  significance: number,
  sphereAffinities: SphereName[]
): EchoDefinition {
  const echoType = nodeTypeToEchoType(node.type);
  const injectionType = echoTypeToInjectionType(echoType);

  const sphereBiases: Partial<Record<SphereName, number>> = {};
  for (const s of sphereAffinities) {
    sphereBiases[s] = 0.03 + significance * 0.02; // 0.03–0.05 bias based on significance
  }

  const injection: EchoInjection = {
    injectionType,
    description: `Seeds ${injectionType.replace('_', ' ')} from ${node.name} (cycle ${originCycle}).`,
    sphereBiases,
  };

  return {
    id: echoId,
    echoType,
    source,
    originNodeId: node.id,
    originCycle,
    name: node.name,
    summary: `Echo of ${node.name} from cycle ${originCycle}.`,
    sphereAffinities,
    significance,
    injection,
  };
}

/** Create a fresh EchoState */
export function createEchoState(echoId: string): EchoState {
  return {
    id: echoId,
    degradation: 0,
    cyclesActive: 0,
    faded: false,
  };
}
```

### Step 4: Run test to verify it passes

Run: `npx vitest run src/engine/__tests__/echo.test.ts`
Expected: PASS (all 22 tests — 11 + 11)

### Step 5: Commit

```bash
git add src/engine/echo.ts src/engine/__tests__/echo.test.ts
git commit -m "feat(echo): add significance scoring, cosmic selection, and echo building"
```

---

## Task 3: Echo Degradation & Injection Hooks

**Files:**
- Modify: `src/engine/echo.ts` (append)
- Test: `src/engine/__tests__/echo.test.ts` (append)

### Step 1: Write the failing tests

```typescript
// Append to src/engine/__tests__/echo.test.ts

import {
  degradeEcho,
  degradeAllEchoes,
  isEchoFaded,
  pruneEchoes,
  collectInjections,
} from '../echo';
import { ECHO_DEGRADATION_RATE, ECHO_FADE_THRESHOLD } from '../../types/echo';
import type { EchoDefinition, EchoState } from '../../types/echo';

describe('Echo degradation & injection', () => {
  it('degradeEcho increases degradation by ECHO_DEGRADATION_RATE', () => {
    const state: EchoState = { id: 'e1', degradation: 0, cyclesActive: 0, faded: false };
    const degraded = degradeEcho(state);
    expect(degraded.degradation).toBeCloseTo(ECHO_DEGRADATION_RATE);
    expect(degraded.cyclesActive).toBe(1);
    expect(degraded.faded).toBe(false);
  });

  it('degradeEcho marks as faded when at threshold', () => {
    const state: EchoState = { id: 'e1', degradation: 0.8, cyclesActive: 5, faded: false };
    const degraded = degradeEcho(state);
    expect(degraded.degradation).toBeCloseTo(0.95);
    expect(degraded.faded).toBe(true);
  });

  it('degradeEcho caps degradation at 1.0', () => {
    const state: EchoState = { id: 'e1', degradation: 0.95, cyclesActive: 6, faded: true };
    const degraded = degradeEcho(state);
    expect(degraded.degradation).toBe(1.0);
  });

  it('degradeAllEchoes applies degradation to all states', () => {
    const states: EchoState[] = [
      { id: 'e1', degradation: 0.0, cyclesActive: 0, faded: false },
      { id: 'e2', degradation: 0.5, cyclesActive: 3, faded: false },
    ];
    const degraded = degradeAllEchoes(states);
    expect(degraded[0].degradation).toBeCloseTo(ECHO_DEGRADATION_RATE);
    expect(degraded[1].degradation).toBeCloseTo(0.65);
  });

  it('isEchoFaded returns true when degradation >= threshold', () => {
    expect(isEchoFaded({ id: 'e1', degradation: 0.9, cyclesActive: 6, faded: true })).toBe(true);
    expect(isEchoFaded({ id: 'e2', degradation: 0.5, cyclesActive: 3, faded: false })).toBe(false);
  });

  it('pruneEchoes removes faded echoes', () => {
    const states: EchoState[] = [
      { id: 'e1', degradation: 0.5, cyclesActive: 3, faded: false },
      { id: 'e2', degradation: 0.95, cyclesActive: 7, faded: true },
      { id: 'e3', degradation: 0.2, cyclesActive: 1, faded: false },
    ];
    const pruned = pruneEchoes(states);
    expect(pruned).toHaveLength(2);
    expect(pruned.find(e => e.id === 'e2')).toBeUndefined();
  });

  it('collectInjections gathers injection data from active (non-faded) echoes', () => {
    const definitions: EchoDefinition[] = [
      {
        id: 'e1', echoType: 'legacy', source: 'cosmic', originNodeId: 'a1',
        originCycle: 1, name: 'Hero', summary: 'A hero', sphereAffinities: ['life'],
        significance: 0.8,
        injection: { injectionType: 'cultural_template', description: 'Seeds hero culture', sphereBiases: { life: 0.05 } },
      },
      {
        id: 'e2', echoType: 'relic', source: 'divine', originNodeId: 'art1',
        originCycle: 1, name: 'Sword', summary: 'A sword', sphereAffinities: ['force'],
        significance: 0.9,
        injection: { injectionType: 'quest_seed', description: 'Seeds sword quest', sphereBiases: { force: 0.04 } },
      },
    ];
    const states: EchoState[] = [
      { id: 'e1', degradation: 0.3, cyclesActive: 2, faded: false },
      { id: 'e2', degradation: 0.95, cyclesActive: 7, faded: true },
    ];
    const injections = collectInjections(definitions, states);
    expect(injections).toHaveLength(1);
    expect(injections[0].echoId).toBe('e1');
    expect(injections[0].injection.injectionType).toBe('cultural_template');
    expect(injections[0].strength).toBeCloseTo(0.7); // 1 - degradation
  });
});
```

### Step 2: Run test to verify it fails

Run: `npx vitest run src/engine/__tests__/echo.test.ts`
Expected: FAIL — `degradeEcho` not found

### Step 3: Write minimal implementation

```typescript
// Append to src/engine/echo.ts

// ── Echo degradation ────────────────────────────────────────────

/** Degrade a single echo by one cycle step */
export function degradeEcho(state: EchoState): EchoState {
  const newDegradation = Math.min(1.0, state.degradation + ECHO_DEGRADATION_RATE);
  return {
    ...state,
    degradation: newDegradation,
    cyclesActive: state.cyclesActive + 1,
    faded: newDegradation >= ECHO_FADE_THRESHOLD,
  };
}

/** Degrade all echo states by one cycle */
export function degradeAllEchoes(states: EchoState[]): EchoState[] {
  return states.map(degradeEcho);
}

/** Check if an echo has faded */
export function isEchoFaded(state: EchoState): boolean {
  return state.degradation >= ECHO_FADE_THRESHOLD;
}

/** Remove faded echoes from the list */
export function pruneEchoes(states: EchoState[]): EchoState[] {
  return states.filter(s => !s.faded);
}

// ── Injection collection ────────────────────────────────────────

export interface ActiveInjection {
  echoId: string;
  injection: EchoInjection;
  /** Injection strength: 1.0 - degradation (how much influence this echo has) */
  strength: number;
}

/** Collect injection hooks from all active (non-faded) echoes.
 *  definitions and states must be indexed by the same echo IDs. */
export function collectInjections(
  definitions: EchoDefinition[],
  states: EchoState[]
): ActiveInjection[] {
  const stateMap = new Map(states.map(s => [s.id, s]));
  const result: ActiveInjection[] = [];

  for (const def of definitions) {
    const state = stateMap.get(def.id);
    if (!state || state.faded) continue;
    result.push({
      echoId: def.id,
      injection: def.injection,
      strength: 1.0 - state.degradation,
    });
  }

  return result;
}
```

### Step 4: Run test to verify it passes

Run: `npx vitest run src/engine/__tests__/echo.test.ts`
Expected: PASS (all 29 tests — 11 + 11 + 7)

### Step 5: Commit

```bash
git add src/engine/echo.ts src/engine/__tests__/echo.test.ts
git commit -m "feat(echo): add degradation, fading, pruning, and injection collection"
```

---

## Task 4: Great Chronicle Structure & Assembly

**Files:**
- Create: `src/engine/chronicle.ts`
- Test: `src/engine/__tests__/chronicle.test.ts`

### Step 1: Write the failing tests

```typescript
// src/engine/__tests__/chronicle.test.ts
import { describe, it, expect } from 'vitest';
import {
  createGreatChronicle,
  createVolume,
  addChapter,
  addInterlude,
  closeVolume,
  addEchoThreadAppearance,
  getVolumeTitle,
} from '../chronicle';
import type { GreatChronicle, ChronicleChapter, ChronicleInterlude } from '../../types/chronicle';

describe('Great Chronicle', () => {
  it('createGreatChronicle returns empty chronicle', () => {
    const c = createGreatChronicle();
    expect(c.volumes).toHaveLength(0);
    expect(c.echoThreads).toHaveLength(0);
  });

  it('getVolumeTitle generates doom-archetype-based title', () => {
    expect(getVolumeTitle('breach', 1)).toBe('Volume I: The Age of the Breach');
    expect(getVolumeTitle('failing', 3)).toBe('Volume III: The Age of the Failing');
    expect(getVolumeTitle('convergence', 2)).toBe('Volume II: The Age of the Convergence');
  });

  it('createVolume adds a new volume to the chronicle', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    expect(c.volumes).toHaveLength(1);
    expect(c.volumes[0].cycleNumber).toBe(1);
    expect(c.volumes[0].title).toBe('Volume I: The Age of the Breach');
    expect(c.volumes[0].chapters).toHaveLength(0);
  });

  it('addChapter appends a chapter to the latest volume', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    const chapter: ChronicleChapter = {
      id: 'ch_001',
      title: 'The Siege',
      prose: 'Fire rained down...',
      tick: 30,
      significance: 0.88,
      spheres: ['force', 'entropy'],
      actorIds: ['actor_a'],
    };
    c = addChapter(c, chapter);
    expect(c.volumes[0].chapters).toHaveLength(1);
    expect(c.volumes[0].chapters[0].title).toBe('The Siege');
  });

  it('addInterlude appends an interlude to the latest volume', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    const interlude: ChronicleInterlude = {
      id: 'int_001',
      summary: 'Trade routes reopened.',
      tickRange: { start: 10, end: 29 },
      eventCount: 8,
    };
    c = addInterlude(c, interlude);
    expect(c.volumes[0].interludes).toHaveLength(1);
  });

  it('closeVolume sets the harvest summary on the latest volume', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    c = closeVolume(c, 'The breach consumed all, yet seeds of order survived.');
    expect(c.volumes[0].harvestSummary).toBe('The breach consumed all, yet seeds of order survived.');
  });

  it('addEchoThreadAppearance creates a new thread if none exists', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    c = addEchoThreadAppearance(c, 'echo_001', 1, 'vol_001', 'First forged in the Age of the Breach.');
    expect(c.echoThreads).toHaveLength(1);
    expect(c.echoThreads[0].echoId).toBe('echo_001');
    expect(c.echoThreads[0].appearances).toHaveLength(1);
  });

  it('addEchoThreadAppearance appends to existing thread', () => {
    let c = createGreatChronicle();
    c = addEchoThreadAppearance(c, 'echo_001', 1, 'vol_001', 'First appearance.');
    c = addEchoThreadAppearance(c, 'echo_001', 3, 'vol_003', 'Appeared again as a ruin.');
    expect(c.echoThreads).toHaveLength(1);
    expect(c.echoThreads[0].appearances).toHaveLength(2);
  });

  it('supports multiple volumes across cycles', () => {
    let c = createGreatChronicle();
    c = createVolume(c, 1, 'breach');
    c = closeVolume(c, 'End of cycle 1.');
    c = createVolume(c, 2, 'failing');
    c = closeVolume(c, 'End of cycle 2.');
    expect(c.volumes).toHaveLength(2);
    expect(c.volumes[1].title).toBe('Volume II: The Age of the Failing');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npx vitest run src/engine/__tests__/chronicle.test.ts`
Expected: FAIL — module `../chronicle` not found

### Step 3: Write minimal implementation

```typescript
// src/engine/chronicle.ts
import type {
  GreatChronicle,
  ChronicleVolume,
  ChronicleChapter,
  ChronicleInterlude,
  EchoThread,
} from '../types/chronicle';
import type { DoomClockArchetype } from '../types/doomClock';

// ── Roman numerals for volume titles ────────────────────────────

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

function toRoman(n: number): string {
  return ROMAN[n - 1] ?? String(n);
}

/** Archetype names with proper capitalization */
function capitalizeArchetype(archetype: DoomClockArchetype): string {
  return archetype.charAt(0).toUpperCase() + archetype.slice(1);
}

// ── Chronicle assembly ──────────────────────────────────────────

/** Create an empty Great Chronicle */
export function createGreatChronicle(): GreatChronicle {
  return { volumes: [], echoThreads: [] };
}

/** Generate a volume title from doom archetype and cycle number */
export function getVolumeTitle(archetype: DoomClockArchetype, cycleNumber: number): string {
  return `Volume ${toRoman(cycleNumber)}: The Age of the ${capitalizeArchetype(archetype)}`;
}

/** Add a new volume for a cycle. Immutable. */
export function createVolume(
  chronicle: GreatChronicle,
  cycleNumber: number,
  doomArchetype: DoomClockArchetype
): GreatChronicle {
  const volume: ChronicleVolume = {
    id: `vol_${String(cycleNumber).padStart(3, '0')}`,
    cycleNumber,
    title: getVolumeTitle(doomArchetype, cycleNumber),
    doomArchetype,
    chapters: [],
    interludes: [],
    harvestSummary: '',
  };
  return { ...chronicle, volumes: [...chronicle.volumes, volume] };
}

/** Add a chapter to the latest volume. Immutable. */
export function addChapter(
  chronicle: GreatChronicle,
  chapter: ChronicleChapter
): GreatChronicle {
  if (chronicle.volumes.length === 0) return chronicle;
  const volumes = [...chronicle.volumes];
  const latest = { ...volumes[volumes.length - 1] };
  latest.chapters = [...latest.chapters, chapter];
  volumes[volumes.length - 1] = latest;
  return { ...chronicle, volumes };
}

/** Add an interlude to the latest volume. Immutable. */
export function addInterlude(
  chronicle: GreatChronicle,
  interlude: ChronicleInterlude
): GreatChronicle {
  if (chronicle.volumes.length === 0) return chronicle;
  const volumes = [...chronicle.volumes];
  const latest = { ...volumes[volumes.length - 1] };
  latest.interludes = [...latest.interludes, interlude];
  volumes[volumes.length - 1] = latest;
  return { ...chronicle, volumes };
}

/** Set the harvest summary on the latest volume. Immutable. */
export function closeVolume(
  chronicle: GreatChronicle,
  harvestSummary: string
): GreatChronicle {
  if (chronicle.volumes.length === 0) return chronicle;
  const volumes = [...chronicle.volumes];
  const latest = { ...volumes[volumes.length - 1] };
  latest.harvestSummary = harvestSummary;
  volumes[volumes.length - 1] = latest;
  return { ...chronicle, volumes };
}

/** Record an echo's appearance in a volume. Creates thread if it doesn't exist. Immutable. */
export function addEchoThreadAppearance(
  chronicle: GreatChronicle,
  echoId: string,
  cycleNumber: number,
  volumeId: string,
  description: string
): GreatChronicle {
  const threads = [...chronicle.echoThreads];
  const existingIdx = threads.findIndex(t => t.echoId === echoId);

  const appearance = { cycleNumber, volumeId, description };

  if (existingIdx >= 0) {
    const thread = { ...threads[existingIdx] };
    thread.appearances = [...thread.appearances, appearance];
    threads[existingIdx] = thread;
  } else {
    threads.push({ echoId, appearances: [appearance] });
  }

  return { ...chronicle, echoThreads: threads };
}
```

### Step 4: Run test to verify it passes

Run: `npx vitest run src/engine/__tests__/chronicle.test.ts`
Expected: PASS (all 9 tests)

### Step 5: Commit

```bash
git add src/engine/chronicle.ts src/engine/__tests__/chronicle.test.ts
git commit -m "feat(chronicle): add Great Chronicle assembly with volumes, chapters, interludes, echo threads"
```

---

## Task 5: Integration Test — Multi-Cycle Echo Lifecycle + Chronicle

**Files:**
- Test: `src/engine/__tests__/echo.test.ts` (append)

### Step 1: Write the integration test

```typescript
// Append to src/engine/__tests__/echo.test.ts

import {
  createGreatChronicle,
  createVolume,
  addChapter,
  addInterlude,
  closeVolume,
  addEchoThreadAppearance,
} from '../chronicle';
import type { GreatChronicle } from '../../types/chronicle';

describe('Echo + Chronicle integration: multi-cycle lifecycle', () => {
  it('simulates 3 cycles of echo creation, degradation, injection, and chronicle assembly', () => {
    // ── Setup ────────────────────────────────────────────────
    let echoDefinitions: EchoDefinition[] = [];
    let echoStates: EchoState[] = [];
    let chronicle: GreatChronicle = createGreatChronicle();

    // ── Cycle 1: Create echoes, start chronicle ─────────────
    chronicle = createVolume(chronicle, 1, 'breach');
    chronicle = addChapter(chronicle, {
      id: 'ch_001', title: 'The Fall of Ardenmor', prose: 'Darkness consumed...',
      tick: 30, significance: 0.9, spheres: ['entropy'], actorIds: ['actor_hero'],
    });
    chronicle = addInterlude(chronicle, {
      id: 'int_001', summary: 'Peace reigned briefly.', tickRange: { start: 1, end: 29 }, eventCount: 15,
    });
    chronicle = closeVolume(chronicle, 'The breach was sealed, but at great cost.');

    // Create 3 echoes from cycle 1
    const echoDef1 = buildEchoDefinition(
      'echo_001',
      { id: 'actor_hero', type: 'actor', name: 'Kael the Unbroken', properties: {} },
      'cosmic', 1, 0.92, ['force', 'life']
    );
    const echoDef2 = buildEchoDefinition(
      'echo_002',
      { id: 'loc_fortress', type: 'location', name: 'Ardenmor Keep', properties: {} },
      'cosmic', 1, 0.78, ['matter']
    );
    const echoDef3 = buildEchoDefinition(
      'echo_003',
      { id: 'artifact_shield', type: 'artifact', name: 'The Aegis of Dawn', properties: {} },
      'divine', 1, 0.85, ['spirit', 'force']
    );

    echoDefinitions.push(echoDef1, echoDef2, echoDef3);
    echoStates.push(
      createEchoState('echo_001'),
      createEchoState('echo_002'),
      createEchoState('echo_003')
    );

    // Record echo threads
    chronicle = addEchoThreadAppearance(chronicle, 'echo_001', 1, 'vol_001', 'Kael defended the breach.');
    chronicle = addEchoThreadAppearance(chronicle, 'echo_003', 1, 'vol_001', 'The Aegis was raised against the darkness.');

    expect(echoStates.every(s => s.degradation === 0)).toBe(true);

    // ── Cycle 2: Degrade, collect injections, add new echoes ──
    echoStates = degradeAllEchoes(echoStates);
    expect(echoStates[0].degradation).toBeCloseTo(0.15);
    expect(echoStates[0].faded).toBe(false);

    // Collect active injections
    let injections = collectInjections(echoDefinitions, echoStates);
    expect(injections).toHaveLength(3); // all still active

    // Verify injection strength reflects degradation
    expect(injections[0].strength).toBeCloseTo(0.85);

    // Chronicle cycle 2
    chronicle = createVolume(chronicle, 2, 'convergence');
    chronicle = addChapter(chronicle, {
      id: 'ch_002', title: 'The Gathering', prose: 'Forces aligned...',
      tick: 45, significance: 0.85, spheres: ['mind', 'spirit'], actorIds: ['actor_sage'],
    });
    chronicle = closeVolume(chronicle, 'All paths converged at the nexus.');

    // Echo thread continues
    chronicle = addEchoThreadAppearance(chronicle, 'echo_001', 2, 'vol_002',
      'Myths of Kael inspired a new order of defenders.');

    // Add new echo from cycle 2
    const echoDef4 = buildEchoDefinition(
      'echo_004',
      { id: 'actor_sage', type: 'actor', name: 'Mirael the Seer', properties: {} },
      'cosmic', 2, 0.88, ['mind', 'time']
    );
    echoDefinitions.push(echoDef4);
    echoStates.push(createEchoState('echo_004'));

    // ── Cycle 3: More degradation ───────────────────────────
    echoStates = degradeAllEchoes(echoStates);
    expect(echoStates[0].degradation).toBeCloseTo(0.30); // echo_001: 2 cycles
    expect(echoStates[3].degradation).toBeCloseTo(0.15); // echo_004: 1 cycle

    injections = collectInjections(echoDefinitions, echoStates);
    expect(injections).toHaveLength(4); // all still active at 0.30 max

    // Chronicle cycle 3
    chronicle = createVolume(chronicle, 3, 'failing');
    chronicle = closeVolume(chronicle, 'The world dimmed quietly.');

    // ── Cycle 4-7: Fast-forward degradation ─────────────────
    for (let cycle = 4; cycle <= 7; cycle++) {
      echoStates = degradeAllEchoes(echoStates);
    }
    // echo_001: degradation = 0.15 * 6 = 0.90 → faded!
    expect(echoStates[0].degradation).toBeCloseTo(0.90);
    expect(echoStates[0].faded).toBe(true);

    // echo_002: same age → also faded
    expect(echoStates[1].faded).toBe(true);

    // echo_003: same age → also faded
    expect(echoStates[2].faded).toBe(true);

    // echo_004: degradation = 0.15 * 5 = 0.75 → still active
    expect(echoStates[3].faded).toBe(false);

    // Prune faded echoes
    echoStates = pruneEchoes(echoStates);
    expect(echoStates).toHaveLength(1);
    expect(echoStates[0].id).toBe('echo_004');

    // Only echo_004 produces injections now
    injections = collectInjections(echoDefinitions, echoStates);
    expect(injections).toHaveLength(1);
    expect(injections[0].echoId).toBe('echo_004');
    expect(injections[0].strength).toBeCloseTo(0.25);

    // ── Verify chronicle structure ──────────────────────────
    expect(chronicle.volumes).toHaveLength(3);
    expect(chronicle.volumes[0].title).toBe('Volume I: The Age of the Breach');
    expect(chronicle.volumes[1].title).toBe('Volume II: The Age of the Convergence');
    expect(chronicle.volumes[2].title).toBe('Volume III: The Age of the Failing');

    expect(chronicle.echoThreads).toHaveLength(2); // echo_001 and echo_003
    const kaelThread = chronicle.echoThreads.find(t => t.echoId === 'echo_001');
    expect(kaelThread).toBeDefined();
    expect(kaelThread!.appearances).toHaveLength(2); // cycles 1 and 2

    // Verify chapters and interludes
    expect(chronicle.volumes[0].chapters).toHaveLength(1);
    expect(chronicle.volumes[0].interludes).toHaveLength(1);
    expect(chronicle.volumes[0].harvestSummary).toBe('The breach was sealed, but at great cost.');
  });
});
```

### Step 2: Run test to verify it passes

Run: `npx vitest run src/engine/__tests__/echo.test.ts`
Expected: PASS (all 30 tests — 11 + 11 + 7 + 1 integration)

### Step 3: Commit

```bash
git add src/engine/__tests__/echo.test.ts
git commit -m "test(echo): add integration test for multi-cycle echo lifecycle and chronicle assembly"
```

---

## Summary

**Phase 4B adds:**

| Export | Module | Purpose |
|--------|--------|---------|
| `EchoType`, `EchoSource`, `EchoDefinition` | `types/echo` | Echo identity types |
| `EchoState`, `EchoInjection`, `InjectionType` | `types/echo` | Echo runtime & injection types |
| `ECHO_TYPES`, `ECHO_DEGRADATION_RATE`, `ECHO_FADE_THRESHOLD` | `types/echo` | Echo constants |
| `ChronicleVolume`, `ChronicleChapter`, `ChronicleInterlude` | `types/chronicle` | Chronicle structure types |
| `EchoThread`, `GreatChronicle` | `types/chronicle` | Cross-cycle narrative types |
| `computeSignificanceScore()` | `engine/echo` | Node significance scoring |
| `selectCosmicEchoes()` | `engine/echo` | Auto-select top echoes |
| `buildEchoDefinition()` | `engine/echo` | Create echo from graph node |
| `createEchoState()` | `engine/echo` | Initialize echo state |
| `degradeEcho()`, `degradeAllEchoes()` | `engine/echo` | Per-cycle echo decay |
| `isEchoFaded()`, `pruneEchoes()` | `engine/echo` | Check/remove expired echoes |
| `collectInjections()` | `engine/echo` | Gather active injection hooks |
| `createGreatChronicle()` | `engine/chronicle` | Empty chronicle |
| `getVolumeTitle()` | `engine/chronicle` | Doom-archetype-based naming |
| `createVolume()`, `closeVolume()` | `engine/chronicle` | Volume lifecycle |
| `addChapter()`, `addInterlude()` | `engine/chronicle` | Add content to volumes |
| `addEchoThreadAppearance()` | `engine/chronicle` | Cross-volume echo tracking |

**This completes all implementation plans for The Fantasy World Simulator.** The full plan set covers:
- Phase 2A: Influence Essence Economy + Ascendant Creation
- Phase 2B: Dream Interface + Divine Toolkit
- Phase 2C: Stealth/Detection + Victory Mandates
- Phase 3A: Rival God Generator + Doom Clock
- Phase 3B: Narrative Prose Engine + Content Pipeline
- Phase 4A: World-Soul + Unmaking/Cycle Transition
- Phase 4B: Echo System + Great Chronicle
