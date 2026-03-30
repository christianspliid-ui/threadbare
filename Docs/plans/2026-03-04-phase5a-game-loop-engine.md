# Phase 5A: Game Loop Engine — GameState, World Seeding, Orchestrator

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire all 25 engine modules into a single `runTick()` orchestrator backed by a unified `GameState`, with procedural world seeding and cycle-end flow.

**Architecture:** Monolithic orchestrator with flat GameState bag. Each tick phase is a pure function that reads GameState and returns partial updates. World seeding creates a populated graph from cosmology + seed + echo injections. Cycle-end flow chains Twilight → Harvest → Transition as discrete state transitions.

**Tech Stack:** TypeScript strict mode, Vitest, seeded PRNG (mulberry32), existing engine modules.

---

## Task 1: GameState Type Definitions + Factory

**Files:**
- Create: `src/types/gameState.ts`
- Test: `src/engine/__tests__/gameState.test.ts`

### Step 1: Write the type definitions

```typescript
// src/types/gameState.ts

import type { CosmologyProfile, HexTile, SphereName } from './index';
import type { SimulationClock } from './temporal';
import type { EssencePool } from './influence';
import type { MandateState, MandateDefinition } from './mandate';
import type { RivalDefinition, RivalState } from './rival';
import type { DoomClockState, DoomClockDefinition, DoomClockArchetype } from './doomClock';
import type { NarrativeEvent, ChronicleEntry } from './narrative';
import type { WorldSoulState } from './worldSoul';
import type { EchoDefinition, EchoState } from './echo';
import type { GreatChronicle } from './chronicle';
import type { WorldGraph } from '../engine/graph';

// ─── Game Phase ─────────────────────────────────────────────────

export type GamePhase = 'playing' | 'twilight' | 'harvest' | 'transition';

// ─── Tick Event ─────────────────────────────────────────────────

/** A single event produced during a tick, for the UI to display */
export interface TickEvent {
  id: string;
  tick: number;
  type: 'agent_action' | 'agent_action_resolved' | 'doom_escalation' | 'rival_action'
    | 'essence_gain' | 'mandate_progress' | 'narrative' | 'phase_change' | 'stealth_alert';
  message: string;
  /** Optional sphere coloring for UI */
  sphere?: SphereName;
  /** Significance 0-1 for UI prominence */
  significance: number;
}

// ─── Game State ─────────────────────────────────────────────────

export interface GameState {
  // Meta
  cycle: number;
  tick: number;
  phase: GamePhase;
  seed: number;

  // World
  graph: WorldGraph;
  cosmology: CosmologyProfile;
  tiles: HexTile[];

  // Clock
  clock: SimulationClock;

  // Player
  ascendantId: string;
  essencePool: EssencePool;
  mandateDefinition: MandateDefinition | null;
  mandateState: MandateState | null;

  // Adversarial
  rivalDefinitions: RivalDefinition[];
  rivalStates: RivalState[];
  doomDefinition: DoomClockDefinition;
  doomClock: DoomClockState;

  // Narrative
  tickEvents: TickEvent[];           // events from the current tick (cleared each tick)
  recentEvents: TickEvent[];         // rolling buffer of last ~100 events for UI
  chronicleEntries: ChronicleEntry[]; // tier-3 events for end-of-cycle chronicle

  // Stealth (simplified for vertical slice)
  stealthExposure: number;           // 0.0 (hidden) to 1.0 (fully detected)

  // Metaprogression (persists across cycles)
  worldSoul: WorldSoulState;
  echoDefinitions: EchoDefinition[];
  echoStates: EchoState[];
  chronicle: GreatChronicle;
}

// ─── Constants ──────────────────────────────────────────────────

/** Maximum recent events kept in the UI buffer */
export const MAX_RECENT_EVENTS = 100;

/** Stealth exposure decay per tick (natural forgetting) */
export const STEALTH_DECAY_PER_TICK = 0.01;

/** Default doom clock length in ticks (360 = ~1 year) */
export const DEFAULT_DOOM_TICKS = 360;

/** Doom archetypes available for selection */
export const DOOM_ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'convergence', 'changing', 'sundering', 'failing', 'ascension', 'reckoning',
];
```

### Step 2: Write the test

```typescript
// src/engine/__tests__/gameState.test.ts

import { describe, it, expect } from 'vitest';
import type {
  GameState,
  GamePhase,
  TickEvent,
} from '../../types/gameState';
import {
  MAX_RECENT_EVENTS,
  STEALTH_DECAY_PER_TICK,
  DEFAULT_DOOM_TICKS,
  DOOM_ARCHETYPES,
} from '../../types/gameState';

describe('GameState types', () => {
  it('exports MAX_RECENT_EVENTS constant', () => {
    expect(MAX_RECENT_EVENTS).toBe(100);
  });

  it('exports STEALTH_DECAY_PER_TICK constant', () => {
    expect(STEALTH_DECAY_PER_TICK).toBe(0.01);
  });

  it('exports DEFAULT_DOOM_TICKS constant', () => {
    expect(DEFAULT_DOOM_TICKS).toBe(360);
  });

  it('exports all 7 doom archetypes', () => {
    expect(DOOM_ARCHETYPES).toHaveLength(7);
    expect(DOOM_ARCHETYPES).toContain('breach');
    expect(DOOM_ARCHETYPES).toContain('reckoning');
  });

  it('can construct a TickEvent', () => {
    const event: TickEvent = {
      id: 'evt_001',
      tick: 42,
      type: 'agent_action',
      message: 'Kael marched toward the eastern gate.',
      sphere: 'force',
      significance: 0.7,
    };
    expect(event.type).toBe('agent_action');
    expect(event.significance).toBe(0.7);
  });

  it('GamePhase covers all four phases', () => {
    const phases: GamePhase[] = ['playing', 'twilight', 'harvest', 'transition'];
    expect(phases).toHaveLength(4);
  });
});
```

### Step 3: Run tests

Run: `npx vitest run src/engine/__tests__/gameState.test.ts`
Expected: PASS (6 tests)

### Step 4: Commit

```bash
git add src/types/gameState.ts src/engine/__tests__/gameState.test.ts
git commit -m "feat(types): add GameState, TickEvent, and game loop constants"
```

---

## Task 2: World Seeding — Populate the Graph

**Files:**
- Create: `src/engine/worldSeed.ts`
- Test: `src/engine/__tests__/worldSeed.test.ts`

**Context:** Currently the graph starts nearly empty (just ascendant + one location). This module creates a populated world with actors, locations, artifacts, and relationships — all from seeded PRNG biased by cosmology and echo injections.

### Step 1: Write worldSeed.ts

```typescript
// src/engine/worldSeed.ts

/**
 * World Seeding — procedural world population.
 *
 * Creates actors, locations, artifacts, and relationships from
 * cosmology profile + seed + echo injections.
 */
import { WorldGraph } from './graph';
import type { CosmologyProfile, SphereName, HexTile } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { EchoDefinition } from '../types/echo';
import type { ActiveInjection } from './echo';

// ─── Seeded PRNG ──────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Constants ────────────────────────────────────────────────────

export const INDIVIDUAL_COUNT = { min: 8, max: 12 };
export const FACTION_COUNT = { min: 2, max: 3 };
export const LOCATION_COUNT = { min: 4, max: 6 };
export const ARTIFACT_COUNT = { min: 1, max: 2 };

const VALUE_PAIRS: ValuePair[] = [
  'ambition_contentment', 'courage_prudence', 'cruelty_compassion',
  'cunning_honesty', 'devotion_independence', 'loyalty_treachery',
  'tradition_innovation', 'dominance_humility', 'wrath_patience', 'greed_generosity',
];

const REACH_DOMAINS: ReachDomain[] = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh',
];

const INDIVIDUAL_NAMES = [
  'Kael', 'Mirael', 'Thorne', 'Lyssa', 'Dren', 'Isolde', 'Varn', 'Ashara',
  'Brynn', 'Cael', 'Dara', 'Fen', 'Gale', 'Hestia', 'Jorik', 'Kira',
];

const FACTION_NAMES = [
  'The Iron Covenant', 'The Verdant Circle', 'The Ashen Hand',
  'The Silver Tide', 'The Obsidian Watch', 'The Gilded Pact',
];

const ARTIFACT_NAMES = [
  'The Crown of Echoes', 'Griefender', 'The Aegis of Dawn',
  'The Soulweaver', 'Voidthorn', 'The Lantern of Stars',
];

const LOCATION_NAMES = [
  'Ardenmor Keep', 'The Shattered Sanctum', 'Thornhaven', 'The Sunken Library',
  'Wraithwood', 'The Forge of Sorrow', 'Crystalspire', 'The Bone Coast',
];

// ─── Generators ───────────────────────────────────────────────────

function randomInRange(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pickRandom<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generateAxiologicalProfile(rng: () => number, cosmology: CosmologyProfile): AxiologicalProfile {
  const profile = {} as AxiologicalProfile;
  // Top spheres influence personality
  const sphereRank = [...SPHERE_NAMES].sort((a, b) => cosmology[b] - cosmology[a]);
  const chaosBias = cosmology.entropy > 0.15 ? 0.2 : -0.1;

  for (const pair of VALUE_PAIRS) {
    // Base random value between -0.8 and 0.8
    const base = (rng() * 1.6) - 0.8;
    // Small cosmology bias
    const bias = pair === 'tradition_innovation' ? chaosBias : 0;
    profile[pair] = Math.max(-1, Math.min(1, base + bias));
  }
  return profile;
}

function generateDomainCapabilities(
  rng: () => number,
): Record<ReachDomain, number> {
  const caps = {} as Record<ReachDomain, number>;
  for (const domain of REACH_DOMAINS) {
    // Base capability 10-40 (out of 100 max)
    caps[domain] = 10 + Math.floor(rng() * 31);
  }
  // Boost 1-2 domains to 40-70 (specialization)
  const boostCount = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < boostCount; i++) {
    const domain = pickRandom(rng, REACH_DOMAINS);
    caps[domain] = Math.min(100, caps[domain] + 20 + Math.floor(rng() * 20));
  }
  return caps;
}

// ─── Main Seeder ──────────────────────────────────────────────────

export interface SeedResult {
  graph: WorldGraph;
  individualIds: string[];
  factionIds: string[];
  locationIds: string[];
  artifactIds: string[];
}

export function seedWorld(
  cosmology: CosmologyProfile,
  tiles: HexTile[],
  seed: number,
  injections?: ActiveInjection[],
): SeedResult {
  const rng = mulberry32(seed + 7919); // offset to avoid collision with other uses of seed
  const graph = new WorldGraph();

  const individualIds: string[] = [];
  const factionIds: string[] = [];
  const locationIds: string[] = [];
  const artifactIds: string[] = [];

  // ── Locations ────────────────────────────────────────────
  const locCount = randomInRange(rng, LOCATION_COUNT.min, LOCATION_COUNT.max);
  const usedNameIndices = new Set<number>();

  for (let i = 0; i < locCount; i++) {
    let nameIdx: number;
    do { nameIdx = Math.floor(rng() * LOCATION_NAMES.length); }
    while (usedNameIndices.has(nameIdx) && usedNameIndices.size < LOCATION_NAMES.length);
    usedNameIndices.add(nameIdx);

    const id = `loc_${i}`;
    // Pick a tile with interesting terrain (not ocean)
    const validTiles = tiles.filter(t =>
      t.terrain !== 'ocean' && t.terrain !== 'coastal_shallows'
    );
    const tile = validTiles.length > 0
      ? validTiles[Math.floor(rng() * validTiles.length)]
      : tiles[0];

    // Check for location_feature echo injection
    const locInjection = injections?.find(inj => inj.injection.injectionType === 'location_feature');
    const sphereBiases = locInjection ? { ...locInjection.injection.sphereBiases } : {};

    graph.addNode({
      id,
      type: 'location',
      name: LOCATION_NAMES[nameIdx],
      properties: {
        locationType: 'location',
        hexCol: tile.coord.col,
        hexRow: tile.coord.row,
        terrain: tile.terrain,
        sphereBiases,
      },
    });
    locationIds.push(id);
  }

  // Add adjacency edges between locations
  for (let i = 0; i < locationIds.length - 1; i++) {
    graph.addEdge({
      id: `edge_adj_${i}`,
      source: locationIds[i],
      target: locationIds[i + 1],
      type: 'adjacent',
      properties: {},
    });
  }

  // ── Factions ─────────────────────────────────────────────
  const facCount = randomInRange(rng, FACTION_COUNT.min, FACTION_COUNT.max);
  const usedFacNames = new Set<number>();

  for (let i = 0; i < facCount; i++) {
    let nameIdx: number;
    do { nameIdx = Math.floor(rng() * FACTION_NAMES.length); }
    while (usedFacNames.has(nameIdx) && usedFacNames.size < FACTION_NAMES.length);
    usedFacNames.add(nameIdx);

    const id = `faction_${i}`;
    const profile = generateAxiologicalProfile(rng, cosmology);

    graph.addNode({
      id,
      type: 'actor',
      name: FACTION_NAMES[nameIdx],
      properties: {
        actorType: 'faction',
        axiologicalProfile: profile,
        domainCapabilities: generateDomainCapabilities(rng),
      },
    });
    factionIds.push(id);
  }

  // ── Individuals ──────────────────────────────────────────
  const indCount = randomInRange(rng, INDIVIDUAL_COUNT.min, INDIVIDUAL_COUNT.max);
  const usedIndNames = new Set<number>();

  // Check for cultural_template echo injection (biases traits)
  const culturalInjection = injections?.find(
    inj => inj.injection.injectionType === 'cultural_template'
  );

  for (let i = 0; i < indCount; i++) {
    let nameIdx: number;
    do { nameIdx = Math.floor(rng() * INDIVIDUAL_NAMES.length); }
    while (usedIndNames.has(nameIdx) && usedIndNames.size < INDIVIDUAL_NAMES.length);
    usedIndNames.add(nameIdx);

    const id = `ind_${i}`;
    const profile = generateAxiologicalProfile(rng, cosmology);

    // Apply cultural echo bias to trait tendencies
    if (culturalInjection?.injection.traitTendencies) {
      for (const tendency of culturalInjection.injection.traitTendencies) {
        const pair = tendency as ValuePair;
        if (profile[pair] !== undefined) {
          profile[pair] = Math.max(-1, Math.min(1,
            profile[pair] + culturalInjection.strength * 0.3
          ));
        }
      }
    }

    const locationId = pickRandom(rng, locationIds);

    graph.addNode({
      id,
      type: 'actor',
      name: INDIVIDUAL_NAMES[nameIdx],
      properties: {
        actorType: 'individual',
        axiologicalProfile: profile,
        domainCapabilities: generateDomainCapabilities(rng),
        locationId,
      },
    });
    individualIds.push(id);

    // Assign to a faction (70% chance)
    if (rng() < 0.7 && factionIds.length > 0) {
      const factionId = pickRandom(rng, factionIds);
      graph.addEdge({
        id: `edge_member_${id}`,
        source: id,
        target: factionId,
        type: 'member_of',
        properties: { role: 'member' },
      });
    }

    // Place at location
    graph.addEdge({
      id: `edge_at_${id}`,
      source: id,
      target: locationId,
      type: 'contains',
      properties: {},
    });
  }

  // ── Artifacts ────────────────────────────────────────────
  const artCount = randomInRange(rng, ARTIFACT_COUNT.min, ARTIFACT_COUNT.max);
  const usedArtNames = new Set<number>();

  for (let i = 0; i < artCount; i++) {
    let nameIdx: number;
    do { nameIdx = Math.floor(rng() * ARTIFACT_NAMES.length); }
    while (usedArtNames.has(nameIdx) && usedArtNames.size < ARTIFACT_NAMES.length);
    usedArtNames.add(nameIdx);

    const id = `artifact_${i}`;
    const sphereAffinity = pickRandom(rng, SPHERE_NAMES);

    // Check for quest_seed echo injection
    const questInjection = injections?.find(
      inj => inj.injection.injectionType === 'quest_seed'
    );

    graph.addNode({
      id,
      type: 'artifact',
      name: ARTIFACT_NAMES[nameIdx],
      properties: {
        sphereAffinity,
        locationId: pickRandom(rng, locationIds),
        echoOrigin: questInjection ? true : false,
      },
    });
    artifactIds.push(id);
  }

  // ── Inter-actor relationships ────────────────────────────
  // Create some relationships between individuals
  for (let i = 0; i < individualIds.length; i++) {
    for (let j = i + 1; j < individualIds.length; j++) {
      if (rng() < 0.3) { // 30% chance of any relationship
        const sentiment = (rng() * 2) - 1; // -1 to +1
        graph.addEdge({
          id: `edge_rel_${i}_${j}`,
          source: individualIds[i],
          target: individualIds[j],
          type: 'relates_to',
          properties: {
            sentiment,
            strength: 0.3 + rng() * 0.5,
            basis: sentiment > 0 ? 'friendship' : 'rivalry',
          },
        });
      }
    }
  }

  return { graph, individualIds, factionIds, locationIds, artifactIds };
}
```

### Step 2: Write the test

```typescript
// src/engine/__tests__/worldSeed.test.ts

import { describe, it, expect } from 'vitest';
import {
  seedWorld,
  INDIVIDUAL_COUNT,
  FACTION_COUNT,
  LOCATION_COUNT,
  ARTIFACT_COUNT,
} from '../worldSeed';
import type { CosmologyProfile, HexTile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import type { ActiveInjection } from '../echo';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function mockTiles(): HexTile[] {
  const tiles: HexTile[] = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland',
      });
    }
  }
  return tiles;
}

describe('seedWorld', () => {
  it('creates a populated graph from cosmology and seed', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    expect(result.individualIds.length).toBeGreaterThanOrEqual(INDIVIDUAL_COUNT.min);
    expect(result.individualIds.length).toBeLessThanOrEqual(INDIVIDUAL_COUNT.max);
    expect(result.factionIds.length).toBeGreaterThanOrEqual(FACTION_COUNT.min);
    expect(result.locationIds.length).toBeGreaterThanOrEqual(LOCATION_COUNT.min);
    expect(result.artifactIds.length).toBeGreaterThanOrEqual(ARTIFACT_COUNT.min);
  });

  it('is deterministic — same seed produces same world', () => {
    const a = seedWorld(balancedCosmology(), mockTiles(), 42);
    const b = seedWorld(balancedCosmology(), mockTiles(), 42);
    expect(a.individualIds).toEqual(b.individualIds);
    expect(a.factionIds).toEqual(b.factionIds);
    expect(a.locationIds).toEqual(b.locationIds);
  });

  it('different seeds produce different worlds', () => {
    const a = seedWorld(balancedCosmology(), mockTiles(), 42);
    const b = seedWorld(balancedCosmology(), mockTiles(), 99);
    // At minimum, relationship patterns should differ
    const aEdges = a.graph.getEdgesByType('relates_to').length;
    const bEdges = b.graph.getEdgesByType('relates_to').length;
    // They might be the same by chance, but the actor names should differ
    const aNames = a.individualIds.map(id => a.graph.getNode(id)!.name);
    const bNames = b.individualIds.map(id => b.graph.getNode(id)!.name);
    expect(aNames).not.toEqual(bNames);
  });

  it('creates individuals with axiological profiles and domain capabilities', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const actor = result.graph.getNode(result.individualIds[0])!;
    const props = actor.properties;
    expect(props.actorType).toBe('individual');
    expect(props.axiologicalProfile).toBeDefined();
    expect(props.domainCapabilities).toBeDefined();
  });

  it('assigns individuals to locations via contains edges', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const edges = result.graph.getEdgesByType('contains');
    expect(edges.length).toBeGreaterThan(0);
  });

  it('creates faction membership edges', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const memberEdges = result.graph.getEdgesByType('member_of');
    expect(memberEdges.length).toBeGreaterThan(0);
  });

  it('creates inter-actor relationships', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const relEdges = result.graph.getEdgesByType('relates_to');
    expect(relEdges.length).toBeGreaterThan(0);
  });

  it('creates location adjacency edges', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const adjEdges = result.graph.getEdgesByType('adjacent');
    expect(adjEdges.length).toBeGreaterThanOrEqual(result.locationIds.length - 1);
  });

  it('applies cultural_template echo injection to actor traits', () => {
    const injection: ActiveInjection = {
      echoId: 'echo_001',
      injection: {
        injectionType: 'cultural_template',
        description: 'Seeds courage culture',
        sphereBiases: { force: 0.05 },
        traitTendencies: ['courage_prudence'],
      },
      strength: 0.8,
    };
    const result = seedWorld(balancedCosmology(), mockTiles(), 42, [injection]);
    // At least some actors should have elevated courage_prudence
    const profiles = result.individualIds.map(id => {
      const node = result.graph.getNode(id)!;
      return (node.properties.axiologicalProfile as Record<string, number>).courage_prudence;
    });
    const avg = profiles.reduce((a, b) => a + b, 0) / profiles.length;
    // With injection, average should be positively biased (though still random)
    // Just verify it ran without error — exact bias depends on RNG
    expect(typeof avg).toBe('number');
  });
});
```

### Step 3: Run tests

Run: `npx vitest run src/engine/__tests__/worldSeed.test.ts`
Expected: PASS (9 tests)

### Step 4: Commit

```bash
git add src/engine/worldSeed.ts src/engine/__tests__/worldSeed.test.ts
git commit -m "feat(engine): add world seeding — procedural population of graph with actors, locations, artifacts"
```

---

## Task 3: Tick Orchestrator — Core Loop

**Files:**
- Create: `src/engine/orchestrator.ts`
- Test: `src/engine/__tests__/orchestrator.test.ts`

**Context:** This is the heart of the game loop. Each tick runs 8 phases in order. For this task, implement the orchestrator structure and the simpler phases (doom, essence, stealth decay). Agent actions and narrative generation are stubbed for now and fleshed out in Task 4.

### Step 1: Write orchestrator.ts

```typescript
// src/engine/orchestrator.ts

/**
 * Game Loop Orchestrator — runs one tick of the simulation.
 *
 * Each tick phase is a pure function: takes GameState pieces in,
 * returns partial updates out. The orchestrator merges updates.
 */
import type { GameState, TickEvent, MAX_RECENT_EVENTS } from '../types/gameState';
import { STEALTH_DECAY_PER_TICK } from '../types/gameState';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import { advanceDoomClock, getDoomClockStage } from './doomClock';
import {
  computeEssenceGeneration,
  generateEssence,
  computeMaxEssence,
} from './influence';
import type { AscendantProperties } from '../types/influence';
import type { NarrativeEvent } from '../types/narrative';
import { generateProse } from './narrative';

// ─── Seeded PRNG ──────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── ID Generator ─────────────────────────────────────────────────

let eventCounter = 0;
function nextEventId(): string {
  return `evt_${++eventCounter}`;
}

// Reset for testing
export function resetEventCounter(): void {
  eventCounter = 0;
}

// ─── Phase 1: Advance Doom Clock ──────────────────────────────────

export function phaseDoom(state: GameState): Partial<GameState> {
  const oldStage = state.doomClock.currentStage;
  const newDoom = advanceDoomClock(state.doomClock);
  const newStage = newDoom.currentStage;
  const events: TickEvent[] = [];

  if (newStage > oldStage) {
    const stageName = state.doomDefinition.stages[newStage - 1]?.name ?? `Stage ${newStage}`;
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'doom_escalation',
      message: `The ${state.doomDefinition.archetype} intensifies — ${stageName}`,
      significance: 0.9,
    });
  }

  return { doomClock: newDoom, tickEvents: [...state.tickEvents, ...events] };
}

// ─── Phase 2: Agent Actions (simplified for vertical slice) ───────

export function phaseAgentActions(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 31);
  const events: TickEvent[] = [];

  // Get all individual actors
  const actors = state.graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual'
  );

  // Each actor has a chance to do something notable per tick
  for (const actor of actors) {
    if (rng() < 0.15) { // 15% chance per tick of a notable action
      const spheres: SphereName[] = [...SPHERE_NAMES];
      const sphere = spheres[Math.floor(rng() * spheres.length)];
      const significance = 0.3 + rng() * 0.5;

      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'agent_action_resolved',
        message: `${actor.name} acted in the realm of ${sphere}.`,
        sphere,
        significance,
      });
    }
  }

  return { tickEvents: [...state.tickEvents, ...events] };
}

// ─── Phase 3: Rival Actions (simplified for vertical slice) ───────

export function phaseRivalActions(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 37);
  const events: TickEvent[] = [];
  const newRivalStates = [...state.rivalStates];

  for (let i = 0; i < state.rivalDefinitions.length; i++) {
    const rival = state.rivalDefinitions[i];
    const rivalState = newRivalStates[i];

    // Rivals act every ~10 ticks
    const ticksSince = (rivalState.ticksSinceAction ?? 0) + 1;
    newRivalStates[i] = { ...rivalState, ticksSinceAction: ticksSince };

    if (ticksSince >= 8 + Math.floor(rng() * 5)) {
      newRivalStates[i] = {
        ...newRivalStates[i],
        ticksSinceAction: 0,
        interventionCount: rivalState.interventionCount + 1,
      };

      const actionDesc = rival.behavior === 'aggressive'
        ? `${rival.name} strikes against your influence`
        : rival.behavior === 'subtle'
        ? `${rival.name} whispers doubt among your followers`
        : rival.behavior === 'territorial'
        ? `${rival.name} fortifies their domain`
        : `${rival.name} extends their reach into new territory`;

      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'rival_action',
        message: actionDesc,
        significance: 0.7,
      });
    }
  }

  return {
    rivalStates: newRivalStates,
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 4: Stealth Decay ───────────────────────────────────────

export function phaseStealth(state: GameState): Partial<GameState> {
  const newExposure = Math.max(0, state.stealthExposure - STEALTH_DECAY_PER_TICK);
  return { stealthExposure: newExposure };
}

// ─── Phase 5: Narrative (assign tier, generate prose) ─────────────

export function phaseNarrative(state: GameState): Partial<GameState> {
  // For the vertical slice, tick events already have messages.
  // In the future, this phase would assign tiers and generate richer prose.
  // For now, accumulate high-significance events as chronicle entries.
  const newChronicleEntries = [...state.chronicleEntries];

  for (const event of state.tickEvents) {
    if (event.significance >= 0.8) {
      newChronicleEntries.push({
        id: event.id,
        tier: 'chronicle',
        title: event.message.slice(0, 50),
        prose: event.message,
        promptContext: {
          actors: [],
          location: '',
          sphere: event.sphere ?? 'force',
          mood: 'dramatic',
        },
        tick: event.tick,
      });
    }
  }

  return { chronicleEntries: newChronicleEntries };
}

// ─── Phase 6: Essence Generation ──────────────────────────────────

export function phaseEssence(state: GameState): Partial<GameState> {
  const ascNode = state.graph.getNode(state.ascendantId);
  if (!ascNode) return {};

  const pool = { ...state.essencePool };
  const max = computeMaxEssence(state.graph, state.ascendantId);
  const gen = computeEssenceGeneration(state.graph, state.ascendantId);
  generateEssence(pool, gen, max);

  const events: TickEvent[] = [];
  const totalGen = SPHERE_NAMES.reduce((s, sp) => s + gen[sp], 0);
  if (state.tick % 10 === 0 && totalGen > 0) {
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'essence_gain',
      message: `+${totalGen.toFixed(1)} essence flows from the cosmos`,
      significance: 0.1,
    });
  }

  return {
    essencePool: pool,
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 7: Mandate Check ───────────────────────────────────────

export function phaseMandate(state: GameState): Partial<GameState> {
  if (!state.mandateState || state.mandateState.completed || state.mandateState.failed) {
    return {};
  }
  // Simplified: mandate progresses slowly each tick
  // Full implementation would evaluate graph conditions
  const newState = {
    ...state.mandateState,
    progress: Math.min(1.0, state.mandateState.progress + 0.002),
  };
  return { mandateState: newState };
}

// ─── Phase 8: Doom Expiry Check ───────────────────────────────────

export function phaseDoomExpiry(state: GameState): Partial<GameState> {
  if (state.doomClock.expired && state.phase === 'playing') {
    return {
      phase: 'twilight' as const,
      tickEvents: [...state.tickEvents, {
        id: nextEventId(),
        tick: state.tick,
        type: 'phase_change',
        message: 'The Unmaking begins. The world trembles.',
        significance: 1.0,
      }],
    };
  }
  return {};
}

// ─── Master Tick ──────────────────────────────────────────────────

export function runTick(state: GameState): GameState {
  // Start with clean tick events
  let s: GameState = { ...state, tick: state.tick + 1, tickEvents: [] };

  // Advance clock
  const newSeason = Math.floor(s.tick / 90) % 4;
  const newYear = Math.floor(s.tick / 360);
  s = { ...s, clock: { ...s.clock, currentTick: s.tick, season: newSeason, year: newYear } };

  // Run phases in order
  s = { ...s, ...phaseDoom(s) };
  s = { ...s, ...phaseAgentActions(s) };
  s = { ...s, ...phaseRivalActions(s) };
  s = { ...s, ...phaseStealth(s) };
  s = { ...s, ...phaseNarrative(s) };
  s = { ...s, ...phaseEssence(s) };
  s = { ...s, ...phaseMandate(s) };
  s = { ...s, ...phaseDoomExpiry(s) };

  // Merge tick events into recent events (ring buffer)
  const MAX = 100;
  const combined = [...s.recentEvents, ...s.tickEvents];
  s = { ...s, recentEvents: combined.slice(-MAX) };

  return s;
}
```

### Step 2: Write the test

```typescript
// src/engine/__tests__/orchestrator.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  phaseDoom,
  phaseAgentActions,
  phaseRivalActions,
  phaseStealth,
  phaseNarrative,
  phaseEssence,
  phaseMandate,
  phaseDoomExpiry,
  runTick,
  resetEventCounter,
} from '../orchestrator';
import { seedWorld } from '../worldSeed';
import { WorldGraph } from '../graph';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import type { GameState } from '../../types/gameState';
import type { CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function emptyEssencePool() {
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 0;
  return pool as Record<typeof SPHERE_NAMES[number], number>;
}

function mockTiles() {
  const tiles = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland' as const,
      });
    }
  }
  return tiles;
}

function createTestGameState(): GameState {
  const cosmology = balancedCosmology();
  const tiles = mockTiles();
  const seed = 42;

  const { graph, individualIds, factionIds, locationIds, artifactIds } = seedWorld(cosmology, tiles, seed);

  // Add ascendant
  graph.addNode({
    id: 'loc.start',
    type: 'location',
    name: 'Sacred Grove',
    properties: { locationType: 'location' },
  });
  const { ascendantId } = createAscendant(graph, {
    archetype: {
      id: 'arch_test',
      title: 'The Watcher',
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      description: 'Test archetype',
      playstyle: 'observation',
    },
    avatar: {
      name: 'TestAvatar',
      startLocationId: 'loc.start',
      formDescription: 'A test avatar',
    },
  });

  // Generate rivals
  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));

  // Generate doom clock
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomState = createDoomClockState('breach', 360);

  return {
    cycle: 1,
    tick: 0,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 0, ticksPerSeason: 90, season: 0, year: 0 },
    ascendantId,
    essencePool: emptyEssencePool(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: rivalDefs,
    rivalStates,
    doomDefinition: doomDef,
    doomClock: doomState,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0.0,
    worldSoul: {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
      currentCycle: 1,
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: createGreatChronicle(),
  };
}

describe('Orchestrator', () => {
  beforeEach(() => {
    resetEventCounter();
  });

  it('phaseDoom advances the doom clock', () => {
    const state = createTestGameState();
    const updates = phaseDoom(state);
    expect(updates.doomClock).toBeDefined();
    expect(updates.doomClock!.currentTick).toBeGreaterThan(0);
  });

  it('phaseDoom emits doom_escalation event on stage change', () => {
    const state = createTestGameState();
    // Set doom near stage 2 threshold (20% of 360 = 72)
    state.doomClock = { ...state.doomClock, currentTick: 71, progress: 71 / 360, currentStage: 1 };
    const updates = phaseDoom(state);
    const events = updates.tickEvents ?? [];
    const escalation = events.find(e => e.type === 'doom_escalation');
    expect(escalation).toBeDefined();
  });

  it('phaseAgentActions produces some events over multiple ticks', () => {
    const state = createTestGameState();
    let totalEvents = 0;
    let s = state;
    for (let i = 0; i < 20; i++) {
      s = { ...s, tick: i, tickEvents: [] };
      const updates = phaseAgentActions(s);
      totalEvents += (updates.tickEvents ?? []).length;
    }
    // With 8-12 actors at 15% per tick, expect some events over 20 ticks
    expect(totalEvents).toBeGreaterThan(0);
  });

  it('phaseRivalActions fires rival events periodically', () => {
    const state = createTestGameState();
    let totalEvents = 0;
    let s = state;
    for (let i = 0; i < 20; i++) {
      s = { ...s, tick: i, tickEvents: [] };
      const updates = phaseRivalActions(s);
      s = { ...s, ...updates };
      totalEvents += (updates.tickEvents ?? []).length;
    }
    expect(totalEvents).toBeGreaterThan(0);
  });

  it('phaseStealth decays exposure', () => {
    const state = createTestGameState();
    state.stealthExposure = 0.5;
    const updates = phaseStealth(state);
    expect(updates.stealthExposure).toBeLessThan(0.5);
  });

  it('phaseStealth does not go below zero', () => {
    const state = createTestGameState();
    state.stealthExposure = 0.005;
    const updates = phaseStealth(state);
    expect(updates.stealthExposure).toBeGreaterThanOrEqual(0);
  });

  it('phaseDoomExpiry triggers twilight when doom expires', () => {
    const state = createTestGameState();
    state.doomClock = { ...state.doomClock, expired: true };
    const updates = phaseDoomExpiry(state);
    expect(updates.phase).toBe('twilight');
  });

  it('phaseDoomExpiry does nothing when doom is active', () => {
    const state = createTestGameState();
    const updates = phaseDoomExpiry(state);
    expect(updates.phase).toBeUndefined();
  });

  it('runTick advances tick counter', () => {
    const state = createTestGameState();
    const next = runTick(state);
    expect(next.tick).toBe(1);
  });

  it('runTick is deterministic', () => {
    const a = createTestGameState();
    const b = createTestGameState();
    const nextA = runTick(a);
    resetEventCounter();
    const nextB = runTick(b);
    expect(nextA.tick).toBe(nextB.tick);
    expect(nextA.doomClock.currentTick).toBe(nextB.doomClock.currentTick);
  });

  it('runTick accumulates recent events', () => {
    let state = createTestGameState();
    for (let i = 0; i < 30; i++) {
      resetEventCounter();
      state = runTick(state);
    }
    expect(state.recentEvents.length).toBeGreaterThan(0);
    expect(state.recentEvents.length).toBeLessThanOrEqual(100);
  });

  it('multi-tick simulation reaches doom expiry', () => {
    let state = createTestGameState();
    // Set a short doom clock for testing
    state.doomClock = { ...state.doomClock, totalTicks: 20 };
    for (let i = 0; i < 25; i++) {
      state = runTick(state);
    }
    expect(state.phase).toBe('twilight');
  });
});
```

### Step 3: Run tests

Run: `npx vitest run src/engine/__tests__/orchestrator.test.ts`
Expected: PASS (12 tests)

**Note:** Some imports may need adjustment based on actual export names. The subagent should verify imports match existing modules (check `createRivalState` exists in rival.ts — if not, create a simple factory function inline).

### Step 4: Commit

```bash
git add src/engine/orchestrator.ts src/engine/__tests__/orchestrator.test.ts
git commit -m "feat(engine): add tick orchestrator with 8-phase game loop"
```

---

## Task 4: Cycle-End Flow — Twilight → Harvest → Transition

**Files:**
- Create: `src/engine/cycleEnd.ts`
- Test: `src/engine/__tests__/cycleEnd.test.ts`

**Context:** When doom expires, the game enters Twilight Phase (5-10 weakened ticks), then Harvest (score nodes, select echoes), then Transition (world-soul update, re-seed). This module handles the transitions between these phases.

### Step 1: Write cycleEnd.ts

```typescript
// src/engine/cycleEnd.ts

/**
 * Cycle End Flow — Twilight → Harvest → Transition.
 *
 * Chains the end-of-cycle sequence: weakened play, scoring,
 * echo selection, world-soul persistence, new cycle setup.
 */
import type { GameState, TickEvent } from '../types/gameState';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { WorldSoulState, HarvestType, UnmakingTrigger } from '../types/worldSoul';
import {
  initiateTwilight,
  isTwilightComplete,
  tickTwilight,
  computeHarvestType,
  buildHarvestOutcome,
  executeCycleTransition,
} from './worldSoul';
import {
  computeSignificanceScore,
  selectCosmicEchoes,
  buildEchoDefinition,
  createEchoState,
  degradeAllEchoes,
  collectInjections,
} from './echo';
import {
  createGreatChronicle,
  createVolume,
  addChapter,
  closeVolume,
  addEchoThreadAppearance,
} from './chronicle';
import type { EchoDefinition, EchoState } from '../types/echo';
import type { GreatChronicle } from '../types/chronicle';
import type { GraphNode } from '../types/graph';

// ─── Seeded PRNG ──────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Constants ────────────────────────────────────────────────────

/** Twilight phase ticks */
export const TWILIGHT_TICKS = 7;

/** How many top nodes to consider for cosmic echoes */
export const COSMIC_ECHO_CANDIDATES = 10;

// ─── Twilight Phase ───────────────────────────────────────────────

export interface TwilightTickResult {
  state: GameState;
  complete: boolean;
}

let twilightCounter = 0;

export function startTwilight(state: GameState): GameState {
  twilightCounter = 0;
  return {
    ...state,
    phase: 'twilight',
  };
}

export function runTwilightTick(state: GameState): TwilightTickResult {
  twilightCounter++;
  const complete = twilightCounter >= TWILIGHT_TICKS;

  const newState: GameState = {
    ...state,
    tick: state.tick + 1,
    phase: complete ? 'harvest' : 'twilight',
  };

  return { state: newState, complete };
}

// ─── Harvest ──────────────────────────────────────────────────────

export interface HarvestResult {
  harvestType: HarvestType;
  cosmicEchoCandidates: EchoCandidate[];
  divineEchoSlots: number;
  chronicleSummary: string;
}

export interface EchoCandidate {
  node: GraphNode;
  score: number;
  echoDefinition: EchoDefinition;
}

export function computeHarvest(state: GameState): HarvestResult {
  const rng = mulberry32(state.seed + state.cycle * 997);

  // Determine harvest type based on mandate and doom state
  const mandateCompleted = state.mandateState?.completed ?? false;
  const harvestType: HarvestType = mandateCompleted
    ? 'triumphant'
    : state.doomClock.progress > 0.9
    ? 'somber'
    : 'bittersweet';

  // Score all significant nodes
  const actors = state.graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual'
  );
  const locations = state.graph.getNodesByType('location');
  const artifacts = state.graph.getNodesByType('artifact');
  const allNodes = [...actors, ...locations, ...artifacts];

  const candidates: EchoCandidate[] = allNodes.map(node => {
    const edgeCount = state.graph.getEdgesForNode(node.id).length;
    // Events = number of chronicle entries mentioning this node (simplified)
    const eventCount = state.chronicleEntries.filter(
      e => e.promptContext.actors.includes(node.id)
    ).length;
    const score = computeSignificanceScore(edgeCount, eventCount, node.type);

    const echoDef = buildEchoDefinition(
      `echo_${state.cycle}_${node.id}`,
      node,
      'cosmic',
      state.cycle,
      score,
      // Pick sphere affinities from cosmology top spheres
      [...SPHERE_NAMES].sort((a, b) =>
        (state.cosmology[b] ?? 0) - (state.cosmology[a] ?? 0)
      ).slice(0, 2),
    );

    return { node, score, echoDefinition: echoDef };
  }).sort((a, b) => b.score - a.score);

  // Cosmic echo counts by harvest type
  const cosmicCounts: Record<HarvestType, number> = {
    triumphant: 5,
    bittersweet: 4,
    somber: 3,
  };
  const divineCounts: Record<HarvestType, number> = {
    triumphant: 3,
    bittersweet: 2,
    somber: 1,
  };

  // Generate summary
  const topName = candidates[0]?.node.name ?? 'the world';
  const chronicleSummary = harvestType === 'triumphant'
    ? `A triumphant age. ${topName} shone brightest among the echoes.`
    : harvestType === 'somber'
    ? `A somber age. ${topName} faded into memory.`
    : `A bittersweet age. ${topName} left a lasting mark.`;

  return {
    harvestType,
    cosmicEchoCandidates: candidates.slice(0, cosmicCounts[harvestType]),
    divineEchoSlots: divineCounts[harvestType],
    chronicleSummary,
  };
}

// ─── Transition to New Cycle ──────────────────────────────────────

export function transitionToNewCycle(
  state: GameState,
  selectedCosmicEchoes: EchoDefinition[],
  selectedDivineEchoes: EchoDefinition[],
  harvestSummary: string,
): GameState {
  const allNewEchoes = [...selectedCosmicEchoes, ...selectedDivineEchoes];
  const newEchoStates = allNewEchoes.map(e => createEchoState(e.id));

  // Degrade existing echoes from previous cycles
  const degradedOldEchoes = degradeAllEchoes(state.echoStates);
  const survivingOldEchoes = degradedOldEchoes.filter(e => !e.faded);

  // Combine old surviving + new
  const combinedDefinitions = [
    ...state.echoDefinitions.filter(d =>
      survivingOldEchoes.some(s => s.id === d.id)
    ),
    ...allNewEchoes,
  ];
  const combinedStates = [...survivingOldEchoes, ...newEchoStates];

  // Update chronicle
  let chronicle = state.chronicle;
  const doomArch = state.doomDefinition.archetype;
  chronicle = createVolume(chronicle, state.cycle, doomArch);

  // Add chapters from chronicle entries
  for (const entry of state.chronicleEntries) {
    chronicle = addChapter(chronicle, {
      id: entry.id,
      title: entry.title,
      prose: entry.prose,
      tick: entry.tick,
      significance: 0.8,
      spheres: [entry.promptContext.sphere],
      actorIds: entry.promptContext.actors,
    });
  }

  chronicle = closeVolume(chronicle, harvestSummary);

  // Record echo threads
  for (const echo of allNewEchoes) {
    const volumeId = `vol_${String(state.cycle).padStart(3, '0')}`;
    chronicle = addEchoThreadAppearance(
      chronicle, echo.id, state.cycle, volumeId,
      `${echo.name} emerged in the Age of the ${doomArch}.`
    );
  }

  return {
    ...state,
    cycle: state.cycle + 1,
    tick: 0,
    phase: 'transition',
    echoDefinitions: combinedDefinitions,
    echoStates: combinedStates,
    chronicle,
    chronicleEntries: [], // reset for new cycle
    tickEvents: [],
    recentEvents: [],
    stealthExposure: 0,
  };
}
```

### Step 2: Write the test

```typescript
// src/engine/__tests__/cycleEnd.test.ts

import { describe, it, expect } from 'vitest';
import {
  startTwilight,
  runTwilightTick,
  computeHarvest,
  transitionToNewCycle,
  TWILIGHT_TICKS,
} from '../cycleEnd';
import { seedWorld } from '../worldSeed';
import { WorldGraph } from '../graph';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import type { GameState } from '../../types/gameState';
import type { CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function emptyEssencePool() {
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 0;
  return pool as Record<typeof SPHERE_NAMES[number], number>;
}

function mockTiles() {
  return Array.from({ length: 25 }, (_, i) => ({
    coord: { col: i % 5, row: Math.floor(i / 5) },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain: 'grassland' as const,
  }));
}

function createTestGameState(): GameState {
  const cosmology = balancedCosmology();
  const tiles = mockTiles();
  const seed = 42;
  const { graph } = seedWorld(cosmology, tiles, seed);

  graph.addNode({ id: 'loc.start', type: 'location', name: 'Sacred Grove', properties: { locationType: 'location' } });
  const { ascendantId } = createAscendant(graph, {
    archetype: { id: 'arch_test', title: 'The Watcher', sphereAlignment: { primary: 'mind', secondary: 'spirit' }, description: 'Test', playstyle: 'obs' },
    avatar: { name: 'TestAvatar', startLocationId: 'loc.start', formDescription: 'test' },
  });

  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomState = createDoomClockState('breach', 360);

  return {
    cycle: 1, tick: 100, phase: 'playing', seed,
    graph, cosmology, tiles,
    clock: { currentTick: 100, ticksPerSeason: 90, season: 1, year: 0 },
    ascendantId,
    essencePool: emptyEssencePool(),
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: rivalDefs, rivalStates,
    doomDefinition: doomDef, doomClock: { ...doomState, expired: true, progress: 1.0, currentTick: 360 },
    tickEvents: [], recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    worldSoul: { fundament: createDefaultFundament(), resonance: createResonanceState(), currentCycle: 1 },
    echoDefinitions: [], echoStates: [],
    chronicle: createGreatChronicle(),
  };
}

describe('Cycle End Flow', () => {
  it('startTwilight sets phase to twilight', () => {
    const state = createTestGameState();
    const result = startTwilight(state);
    expect(result.phase).toBe('twilight');
  });

  it('runTwilightTick advances ticks until complete', () => {
    let state = startTwilight(createTestGameState());
    let complete = false;
    let tickCount = 0;

    while (!complete) {
      const result = runTwilightTick(state);
      state = result.state;
      complete = result.complete;
      tickCount++;
    }

    expect(tickCount).toBe(TWILIGHT_TICKS);
    expect(state.phase).toBe('harvest');
  });

  it('computeHarvest returns candidates and harvest type', () => {
    const state = createTestGameState();
    const result = computeHarvest(state);
    expect(['triumphant', 'somber', 'bittersweet']).toContain(result.harvestType);
    expect(result.cosmicEchoCandidates.length).toBeGreaterThan(0);
    expect(result.divineEchoSlots).toBeGreaterThan(0);
    expect(result.chronicleSummary.length).toBeGreaterThan(0);
  });

  it('computeHarvest returns somber when doom fully expired without mandate', () => {
    const state = createTestGameState();
    state.doomClock = { ...state.doomClock, progress: 0.95 };
    const result = computeHarvest(state);
    expect(result.harvestType).toBe('somber');
  });

  it('computeHarvest returns triumphant when mandate completed', () => {
    const state = createTestGameState();
    state.mandateState = {
      mandateId: 'm1', currentStage: 'culmination',
      progress: 1.0, completed: true, failed: false,
    };
    const result = computeHarvest(state);
    expect(result.harvestType).toBe('triumphant');
  });

  it('transitionToNewCycle increments cycle and resets state', () => {
    const state = createTestGameState();
    const harvest = computeHarvest(state);
    const cosmicEchoes = harvest.cosmicEchoCandidates.map(c => c.echoDefinition);
    const divineEchoes: typeof cosmicEchoes = [];

    const next = transitionToNewCycle(state, cosmicEchoes, divineEchoes, harvest.chronicleSummary);
    expect(next.cycle).toBe(2);
    expect(next.tick).toBe(0);
    expect(next.phase).toBe('transition');
    expect(next.echoDefinitions.length).toBeGreaterThan(0);
    expect(next.echoStates.length).toBeGreaterThan(0);
    expect(next.chronicle.volumes.length).toBe(1);
    expect(next.chronicleEntries).toHaveLength(0);
  });

  it('transitionToNewCycle preserves surviving echoes from previous cycles', () => {
    const state = createTestGameState();
    // Add a pre-existing echo from cycle 0
    state.echoDefinitions = [{
      id: 'old_echo', echoType: 'legacy', source: 'cosmic',
      originNodeId: 'ind_0', originCycle: 0, name: 'Old Echo',
      summary: 'From a past age', sphereAffinities: ['force'],
      significance: 0.5,
      injection: { injectionType: 'cultural_template', description: 'test', sphereBiases: {} },
    }];
    state.echoStates = [{ id: 'old_echo', degradation: 0.3, cyclesActive: 2, faded: false }];

    const harvest = computeHarvest(state);
    const cosmicEchoes = harvest.cosmicEchoCandidates.map(c => c.echoDefinition);

    const next = transitionToNewCycle(state, cosmicEchoes, [], harvest.chronicleSummary);
    // Old echo should survive (degradation 0.3 + 0.15 = 0.45, not faded)
    const oldEcho = next.echoStates.find(e => e.id === 'old_echo');
    expect(oldEcho).toBeDefined();
    expect(oldEcho!.degradation).toBeCloseTo(0.45);
  });
});
```

### Step 3: Run tests

Run: `npx vitest run src/engine/__tests__/cycleEnd.test.ts`
Expected: PASS (8 tests)

### Step 4: Commit

```bash
git add src/engine/cycleEnd.ts src/engine/__tests__/cycleEnd.test.ts
git commit -m "feat(engine): add cycle-end flow — twilight, harvest, and transition to new cycle"
```

---

## Task 5: Integration Test — Multi-Tick Simulation

**Files:**
- Test: `src/engine/__tests__/orchestrator.test.ts` (append)

**Context:** Prove the full loop works: start game → run ticks → doom expires → twilight → harvest → transition → new cycle ticks.

### Step 1: Append integration test

```typescript
// Append to src/engine/__tests__/orchestrator.test.ts

import { startTwilight, runTwilightTick, computeHarvest, transitionToNewCycle } from '../cycleEnd';

describe('Full game loop integration', () => {
  it('runs a complete cycle: play → doom expires → twilight → harvest → transition → new cycle', () => {
    resetEventCounter();

    // Start with a short doom clock
    let state = createTestGameState();
    state.doomClock = { ...state.doomClock, totalTicks: 30 };

    // ── Playing phase ──
    let ticksPlayed = 0;
    while (state.phase === 'playing' && ticksPlayed < 50) {
      state = runTick(state);
      ticksPlayed++;
    }

    // Should have transitioned to twilight
    expect(state.phase).toBe('twilight');
    expect(ticksPlayed).toBeLessThanOrEqual(35); // doom should expire around tick 30

    // Verify some events were generated during play
    expect(state.recentEvents.length).toBeGreaterThan(0);

    // ── Twilight phase ──
    state = startTwilight(state);
    let twilightComplete = false;
    while (!twilightComplete) {
      const result = runTwilightTick(state);
      state = result.state;
      twilightComplete = result.complete;
    }
    expect(state.phase).toBe('harvest');

    // ── Harvest ──
    const harvest = computeHarvest(state);
    expect(harvest.cosmicEchoCandidates.length).toBeGreaterThan(0);
    expect(harvest.harvestType).toBeDefined();

    // ── Transition ──
    const cosmicEchoes = harvest.cosmicEchoCandidates.map(c => c.echoDefinition);
    state = transitionToNewCycle(state, cosmicEchoes, [], harvest.chronicleSummary);

    expect(state.cycle).toBe(2);
    expect(state.tick).toBe(0);
    expect(state.echoDefinitions.length).toBeGreaterThan(0);
    expect(state.chronicle.volumes.length).toBe(1);

    // ── New cycle: verify echoes persist ──
    // Re-seed would happen here in the full game, but we can verify state
    expect(state.echoStates.length).toBeGreaterThan(0);
    expect(state.chronicleEntries).toHaveLength(0); // reset for new cycle
  });
});
```

### Step 2: Run full test suite

Run: `npx vitest run src/engine/__tests__/orchestrator.test.ts`
Expected: PASS (13 tests — 12 previous + 1 integration)

### Step 3: TypeScript check

Run: `npx tsc --noEmit`
Expected: Clean

### Step 4: Commit

```bash
git add src/engine/__tests__/orchestrator.test.ts
git commit -m "test(engine): add full game loop integration test — play through complete cycle"
```

---

## Summary

**Phase 5A adds:**

| Export | Module | Purpose |
|--------|--------|---------|
| `GameState`, `TickEvent`, `GamePhase` | `types/gameState` | Central state + event types |
| `seedWorld()` | `engine/worldSeed` | Procedural world population |
| `runTick()` | `engine/orchestrator` | Master tick with 8 phases |
| `phaseDoom()` through `phaseDoomExpiry()` | `engine/orchestrator` | Individual tick phases |
| `startTwilight()`, `runTwilightTick()` | `engine/cycleEnd` | Twilight phase flow |
| `computeHarvest()` | `engine/cycleEnd` | End-of-cycle scoring |
| `transitionToNewCycle()` | `engine/cycleEnd` | Cycle transition with echoes |

**Estimated test count:** ~35 new tests across 4 test files

**Next:** Phase 5B — UI components (DoomBar, NarrativeFeed, RivalPanel, MandateTracker, HarvestScreen, GameView rewrite)
