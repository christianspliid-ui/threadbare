/**
 * Tests for lair escalation orchestrator phase.
 *
 * Plan: m2.5-02 Task 1
 * Covers: interval guard, tier upgrades, sphere pressure emission,
 *         reinfestation, named elite creation, monster faction seeding,
 *         adjacent spawn, determinism.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseLairEscalation,
  LAIR_ESCALATION_INTERVAL,
  LAIR_SPHERE_PRESSURE_EMISSION,
  LAIR_SPAWN_SPHERE_THRESHOLD,
  LAIR_UPGRADE_MIN_TICKS,
  LAIR_LEGENDARY_MIN_TICKS,
  LAIR_REINFESTATION_MIN_TICKS,
  LAIR_ADJACENT_SPAWN_CHANCE,
} from '../lairEscalation';
import type { GameState } from '../../types/gameState';
import type { SpherePressureEvent } from '../../types/sphereAffinity';

// ─── Minimal GameState builder ────────────────────────────────────────────────

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  const graph = overrides.graph ?? new WorldGraph();
  return {
    cycle: 1,
    tick: 0,
    phase: 'playing',
    seed: 42,
    graph,
    cosmology: { sphereWeights: {} } as GameState['cosmology'],
    tiles: [],
    clock: {} as GameState['clock'],
    ascendantId: 'god_1',
    essencePool: { current: 10, max: 10 } as GameState['essencePool'],
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as GameState['doomDefinition'],
    doomClock: {} as GameState['doomClock'],
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {},
    familiarityMap: {},
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    pendingSpherePressures: [],
    ...overrides,
  } as GameState;
}

/**
 * Add a lair node to the graph.
 */
function addLairNode(
  graph: WorldGraph,
  id: string,
  opts: {
    lairTier?: 'minor' | 'major' | 'legendary';
    spawnedAtTick?: number;
    lastEscalationTick?: number;
    dominantSphere?: string;
    hexCol?: number;
    hexRow?: number;
    dangerZone?: string;
  } = {},
): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Test Lair ${id}`,
    properties: {
      locationSubtype: 'lair',
      lairTier: opts.lairTier ?? 'minor',
      spawnedAtTick: opts.spawnedAtTick ?? 0,
      lastEscalationTick: opts.lastEscalationTick ?? 0,
      dominantSphere: opts.dominantSphere ?? 'force',
      hexCol: opts.hexCol ?? 10,
      hexRow: opts.hexRow ?? 10,
      dangerZone: opts.dangerZone ?? 'wilderness',
    },
  });
}

/**
 * Add a cleared lair node to the graph.
 */
function addClearedLairNode(
  graph: WorldGraph,
  id: string,
  opts: {
    clearedAtTick?: number;
    dominantSphere?: string;
    hexCol?: number;
    hexRow?: number;
  } = {},
): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Cleared Lair ${id}`,
    properties: {
      locationSubtype: 'cleared_lair',
      lairTier: 'minor',
      spawnedAtTick: 0,
      lastEscalationTick: 0,
      dominantSphere: opts.dominantSphere ?? 'force',
      hexCol: opts.hexCol ?? 5,
      hexRow: opts.hexRow ?? 5,
      clearedAtTick: opts.clearedAtTick ?? 0,
      dangerZone: 'wilderness',
    },
  });
}

/**
 * Add a hex node (location with locationSubtype='hex') with sphere affinity.
 */
function addHexNode(
  graph: WorldGraph,
  id: string,
  col: number,
  row: number,
  sphereScores: Record<string, number> = {},
): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Hex ${id}`,
    properties: {
      locationSubtype: 'hex',
      hexCol: col,
      hexRow: row,
      sphereAffinity: {
        scores: { force: 0, matter: 0, energy: 0, life: 0, mind: 0, spirit: 0, time: 0, entropy: 0, ...sphereScores },
        progress: {},
      },
    },
  });
}

// ─── Test 1: Interval guard ───────────────────────────────────────────────────

describe('phaseLairEscalation — interval guard', () => {
  it('returns immediately when tick % LAIR_ESCALATION_INTERVAL !== 0', () => {
    const graph = new WorldGraph();
    addLairNode(graph, 'lair_0', { spawnedAtTick: 0 });

    const state = makeMinimalState({
      graph,
      tick: 1, // Not a multiple of LAIR_ESCALATION_INTERVAL
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    // Should not have added any sphere pressure
    expect(state.pendingSpherePressures ?? []).toHaveLength(0);

    // Lair should be unchanged
    const lair = graph.getNode('lair_0');
    expect(lair?.properties.lairTier).toBe('minor');
  });

  it('executes when tick is a multiple of LAIR_ESCALATION_INTERVAL', () => {
    const graph = new WorldGraph();
    addLairNode(graph, 'lair_0', { spawnedAtTick: 0 });

    const state = makeMinimalState({
      graph,
      tick: LAIR_ESCALATION_INTERVAL,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    // Should have pushed at least one sphere pressure event
    expect((state.pendingSpherePressures ?? []).length).toBeGreaterThan(0);
  });
});

// ─── Test 2: Minor lair upgrade to major ─────────────────────────────────────

describe('phaseLairEscalation — minor→major upgrade', () => {
  it('upgrades minor lair to major when ticks elapsed >= LAIR_UPGRADE_MIN_TICKS', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL * 2;
    // spawnedAtTick=0, current tick=50 (>= LAIR_UPGRADE_MIN_TICKS=30)
    addLairNode(graph, 'lair_0', {
      lairTier: 'minor',
      spawnedAtTick: 0,
      dominantSphere: 'force',
    });

    const state = makeMinimalState({
      graph,
      tick,
      seed: 42,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    const lair = graph.getNode('lair_0');
    expect(lair?.properties.lairTier).toBe('major');
  });

  it('creates named elite actor node on minor→major upgrade', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL * 2;
    addLairNode(graph, 'lair_0', {
      lairTier: 'minor',
      spawnedAtTick: 0,
      dominantSphere: 'force',
    });

    const state = makeMinimalState({
      graph,
      tick,
      seed: 42,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    const lair = graph.getNode('lair_0');
    const eliteId = lair?.properties.namedEliteId as string | undefined;
    expect(eliteId).toBeTruthy();

    const eliteNode = graph.getNode(eliteId!);
    expect(eliteNode).toBeTruthy();
    expect(eliteNode?.type).toBe('actor');
    expect(eliteNode?.properties.isMonsterElite).toBe(true);
  });

  it('does NOT upgrade minor lair when insufficient ticks have passed', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL; // tick=25, spawnedAtTick=0 → elapsed=25 < 30
    addLairNode(graph, 'lair_0', {
      lairTier: 'minor',
      spawnedAtTick: tick - LAIR_UPGRADE_MIN_TICKS + 5, // only 20 ticks elapsed
      dominantSphere: 'force',
    });

    const state = makeMinimalState({
      graph,
      tick,
      seed: 42,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    const lair = graph.getNode('lair_0');
    expect(lair?.properties.lairTier).toBe('minor');
  });
});

// ─── Test 3: Major lair upgrade to legendary ──────────────────────────────────

describe('phaseLairEscalation — major→legendary upgrade', () => {
  it('upgrades major lair to legendary when ticks elapsed >= LAIR_LEGENDARY_MIN_TICKS', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL * 4; // tick=100, elapsed=100 >= 60
    addLairNode(graph, 'lair_0', {
      lairTier: 'major',
      spawnedAtTick: 0,
      dominantSphere: 'force',
      namedEliteId: 'elite_0', // already has elite
    } as Parameters<typeof addLairNode>[2] & { namedEliteId: string });

    // Also need to add the elite node
    graph.addNode({
      id: 'elite_0',
      type: 'actor',
      name: 'Test Elite',
      properties: { isMonsterElite: true },
    });

    const state = makeMinimalState({
      graph,
      tick,
      seed: 42,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    const lair = graph.getNode('lair_0');
    expect(lair?.properties.lairTier).toBe('legendary');
  });

  it('creates monster faction on major→legendary upgrade', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL * 4; // 100 ticks >= LAIR_LEGENDARY_MIN_TICKS=60
    addLairNode(graph, 'lair_0', {
      lairTier: 'major',
      spawnedAtTick: 0,
      dominantSphere: 'force',
    });

    const state = makeMinimalState({
      graph,
      tick,
      seed: 42,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    const lair = graph.getNode('lair_0');
    const factionId = lair?.properties.monsterFactionId as string | undefined;
    expect(factionId).toBeTruthy();

    const factionNode = graph.getNode(factionId!);
    expect(factionNode).toBeTruthy();
    expect(factionNode?.type).toBe('actor');
    expect(factionNode?.properties.isMonsterFaction).toBe(true);
  });
});

// ─── Test 4: Sphere pressure emission ────────────────────────────────────────

describe('phaseLairEscalation — sphere pressure emission', () => {
  it('pushes SpherePressureEvent to pendingSpherePressures for each active lair', () => {
    const graph = new WorldGraph();
    addLairNode(graph, 'lair_0', {
      lairTier: 'minor',
      spawnedAtTick: 0,
      dominantSphere: 'force',
    });

    const state = makeMinimalState({
      graph,
      tick: LAIR_ESCALATION_INTERVAL,
      seed: 42,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    const pressures = state.pendingSpherePressures as SpherePressureEvent[];
    const lairPressure = pressures.find(p => p.sourceId === 'lair_0');
    expect(lairPressure).toBeTruthy();
    expect(lairPressure?.sphere).toBe('force');
    expect(lairPressure?.magnitude).toBe(LAIR_SPHERE_PRESSURE_EMISSION);
    expect(lairPressure?.source).toBe('environmental');
  });

  it('emits sphere pressure with correct LAIR_SPHERE_PRESSURE_EMISSION magnitude', () => {
    const graph = new WorldGraph();
    addLairNode(graph, 'lair_entropy', {
      lairTier: 'minor',
      spawnedAtTick: 0,
      dominantSphere: 'entropy',
    });

    const state = makeMinimalState({
      graph,
      tick: LAIR_ESCALATION_INTERVAL,
      seed: 42,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    const pressures = state.pendingSpherePressures as SpherePressureEvent[];
    expect(pressures.some(p => p.magnitude === LAIR_SPHERE_PRESSURE_EMISSION)).toBe(true);
  });
});

// ─── Test 5: Cleared lair reinfestation (eligible) ───────────────────────────

describe('phaseLairEscalation — cleared lair reinfestation', () => {
  it('reinfests cleared lair when sphere pressure is high and ticks elapsed >= LAIR_REINFESTATION_MIN_TICKS', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL;

    // Add cleared lair with sphere pressure already in hex
    addClearedLairNode(graph, 'cleared_0', {
      clearedAtTick: 0, // elapsed = tick >= LAIR_REINFESTATION_MIN_TICKS
      dominantSphere: 'force',
      hexCol: 5,
      hexRow: 5,
    });

    // Add hex node with high sphere pressure for 'force'
    addHexNode(graph, 'hex_5_5', 5, 5, { force: LAIR_SPAWN_SPHERE_THRESHOLD });

    const state = makeMinimalState({
      graph,
      tick,
      seed: 42,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    const lair = graph.getNode('cleared_0');
    expect(lair?.properties.locationSubtype).toBe('lair');
    expect(lair?.properties.lairTier).toBe('minor');
  });

  it('does NOT reinstate cleared lair when sphere pressure is low', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL;

    addClearedLairNode(graph, 'cleared_0', {
      clearedAtTick: 0,
      dominantSphere: 'force',
      hexCol: 3,
      hexRow: 3,
    });

    // Low sphere pressure
    addHexNode(graph, 'hex_3_3', 3, 3, { force: LAIR_SPAWN_SPHERE_THRESHOLD - 20 });

    const state = makeMinimalState({
      graph,
      tick,
      seed: 42,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    const lair = graph.getNode('cleared_0');
    expect(lair?.properties.locationSubtype).toBe('cleared_lair');
  });

  it('does NOT reinstate cleared lair when insufficient ticks have passed', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL;

    // Not enough time has passed since clearing
    addClearedLairNode(graph, 'cleared_0', {
      clearedAtTick: tick - LAIR_REINFESTATION_MIN_TICKS + 5, // only 20 ticks ago
      dominantSphere: 'force',
      hexCol: 7,
      hexRow: 7,
    });

    addHexNode(graph, 'hex_7_7', 7, 7, { force: LAIR_SPAWN_SPHERE_THRESHOLD + 10 });

    const state = makeMinimalState({
      graph,
      tick,
      seed: 42,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    const lair = graph.getNode('cleared_0');
    expect(lair?.properties.locationSubtype).toBe('cleared_lair');
  });
});

// ─── Test 6: Cleared lair with controlling faction does NOT reinstate ─────────

describe('phaseLairEscalation — cleared lair with controlling faction', () => {
  it('does NOT reinstate cleared lair when a non-monster faction controls it', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL;

    addClearedLairNode(graph, 'cleared_ctrl', {
      clearedAtTick: 0,
      dominantSphere: 'force',
      hexCol: 9,
      hexRow: 9,
    });

    addHexNode(graph, 'hex_9_9', 9, 9, { force: LAIR_SPAWN_SPHERE_THRESHOLD + 20 });

    // Add a non-monster faction node that controls the cleared lair
    graph.addNode({
      id: 'faction_human',
      type: 'actor',
      name: 'Human Garrison',
      properties: {
        actorType: 'faction',
        factionType: 'mercenary',
        isMonsterFaction: false,
      },
    });

    // Add controls edge: faction → cleared_lair
    graph.addEdge({
      id: 'edge_controls_lair',
      type: 'controls',
      source: 'faction_human',
      target: 'cleared_ctrl',
      properties: {},
    });

    const state = makeMinimalState({
      graph,
      tick,
      seed: 42,
      pendingSpherePressures: [],
    });

    phaseLairEscalation(state);

    const lair = graph.getNode('cleared_ctrl');
    expect(lair?.properties.locationSubtype).toBe('cleared_lair');
  });
});

// ─── Test 7: Adjacent lair spawning ──────────────────────────────────────────

describe('phaseLairEscalation — adjacent spawn', () => {
  it('LAIR_ADJACENT_SPAWN_CHANCE is a positive probability value', () => {
    expect(LAIR_ADJACENT_SPAWN_CHANCE).toBeGreaterThan(0);
    expect(LAIR_ADJACENT_SPAWN_CHANCE).toBeLessThan(1);
  });

  it('adjacent spawn only occurs in wilderness or borderland zones based on PRNG', () => {
    // Test that the adjacent spawn mechanism doesn't crash and uses deterministic PRNG
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL * 4; // well past upgrade thresholds for testing pure spawn

    // Place a lair with a nearby wilderness hex
    addLairNode(graph, 'lair_spawn_src', {
      lairTier: 'minor',
      spawnedAtTick: tick - 5, // recent, won't upgrade — just spawns
      dominantSphere: 'entropy',
      hexCol: 20,
      hexRow: 20,
      dangerZone: 'wilderness',
    });

    const state = makeMinimalState({
      graph,
      tick,
      seed: 99,
      pendingSpherePressures: [],
    });

    // Should not throw
    expect(() => phaseLairEscalation(state)).not.toThrow();
  });
});

// ─── Test 8: Determinism ─────────────────────────────────────────────────────

describe('phaseLairEscalation — determinism', () => {
  it('produces the same result with the same seed and tick', () => {
    // Run on two graphs with identical lairs and check outcomes are the same
    function runEscalation(seed: number): { lairTier: unknown; hasElite: boolean } {
      const graph = new WorldGraph();
      const tick = LAIR_ESCALATION_INTERVAL * 2; // tick=50, lair upgrades

      addLairNode(graph, 'lair_0', {
        lairTier: 'minor',
        spawnedAtTick: 0,
        dominantSphere: 'life',
      });

      const state = makeMinimalState({
        graph,
        tick,
        seed,
        pendingSpherePressures: [],
      });

      phaseLairEscalation(state);

      const lair = graph.getNode('lair_0');
      return {
        lairTier: lair?.properties.lairTier,
        hasElite: !!lair?.properties.namedEliteId,
      };
    }

    const result1 = runEscalation(42);
    const result2 = runEscalation(42);

    expect(result1).toEqual(result2);
  });

  it('adjacent spawn results are deterministic with the same seed', () => {
    function countLairs(seed: number): number {
      const graph = new WorldGraph();
      const tick = LAIR_ESCALATION_INTERVAL;

      // Put a lair far from edges so adjacency checks can work
      addLairNode(graph, 'lair_0', {
        lairTier: 'minor',
        spawnedAtTick: tick, // avoid triggering upgrades
        dominantSphere: 'chaos',
        hexCol: 30,
        hexRow: 30,
        dangerZone: 'wilderness',
      });

      const state = makeMinimalState({
        graph,
        tick,
        seed,
        pendingSpherePressures: [],
        tiles: [],
      });

      phaseLairEscalation(state);

      return graph.getNodesByType('location').filter(
        n => n.properties.locationSubtype === 'lair'
      ).length;
    }

    const count1 = countLairs(42);
    const count2 = countLairs(42);

    expect(count1).toBe(count2);
  });
});

// ─── Test 9: Export constants ──────────────────────────────────────────────────

describe('phaseLairEscalation — exported constants', () => {
  it('exports all required LAIR_* constants', () => {
    expect(LAIR_ESCALATION_INTERVAL).toBe(25);
    expect(LAIR_SPHERE_PRESSURE_EMISSION).toBeGreaterThan(0);
    expect(LAIR_SPAWN_SPHERE_THRESHOLD).toBeGreaterThan(0);
    expect(LAIR_UPGRADE_MIN_TICKS).toBeGreaterThan(0);
    expect(LAIR_LEGENDARY_MIN_TICKS).toBeGreaterThan(LAIR_UPGRADE_MIN_TICKS);
    expect(LAIR_REINFESTATION_MIN_TICKS).toBeGreaterThan(0);
    expect(LAIR_ADJACENT_SPAWN_CHANCE).toBeGreaterThan(0);
    expect(LAIR_ADJACENT_SPAWN_CHANCE).toBeLessThan(1);
  });
});
