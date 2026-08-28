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
  LAIR_REINFESTATION_SPHERE_THRESHOLD,
  LAIR_UPGRADE_MIN_TICKS,
  LAIR_LEGENDARY_MIN_TICKS,
  LAIR_REINFESTATION_MIN_TICKS,
  LAIR_ADJACENT_SPAWN_CHANCE,
} from '../lairEscalation';
import type { GameState } from '../../types/gameState';
import type { HexTile } from '../../types/index';
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
    /**
     * Accrued score in the lair's dominant sphere — what reinfestation actually reads
     * since THR-1319. These fixtures used to put the score on a companion hex *node*
     * built by `addHexNode`, which is a shape no generated world contains: the gate
     * read undefined → 0 → blocked, so the passing tests were describing a branch that
     * could not fire in any real world. The score belongs on the lair because that is
     * the entity escalation aims its sphere pressure at.
     */
    sphereScore?: number;
  } = {},
): void {
  const sphere = opts.dominantSphere ?? 'force';
  graph.addNode({
    id,
    type: 'location',
    name: `Cleared Lair ${id}`,
    properties: {
      locationSubtype: 'cleared_lair',
      lairTier: 'minor',
      spawnedAtTick: 0,
      lastEscalationTick: 0,
      dominantSphere: sphere,
      hexCol: opts.hexCol ?? 5,
      hexRow: opts.hexRow ?? 5,
      clearedAtTick: opts.clearedAtTick ?? 0,
      dangerZone: 'wilderness',
      sphereAffinity: {
        scores: {
          force: 0, matter: 0, energy: 0, life: 0,
          mind: 0, spirit: 0, time: 0, entropy: 0,
          [sphere]: opts.sphereScore ?? 0,
        },
        progress: {},
      },
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

    // Cleared lair still steeped in the sphere that birthed it
    addClearedLairNode(graph, 'cleared_0', {
      clearedAtTick: 0, // elapsed = tick >= LAIR_REINFESTATION_MIN_TICKS
      dominantSphere: 'force',
      hexCol: 5,
      hexRow: 5,
      sphereScore: LAIR_REINFESTATION_SPHERE_THRESHOLD,
    });

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

    // Barely steeped — one under the bar, so this asserts the threshold and not
    // merely the absence of any score at all.
    addClearedLairNode(graph, 'cleared_0', {
      clearedAtTick: 0,
      dominantSphere: 'force',
      hexCol: 3,
      hexRow: 3,
      sphereScore: LAIR_REINFESTATION_SPHERE_THRESHOLD - 1,
    });

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
      sphereScore: LAIR_REINFESTATION_SPHERE_THRESHOLD + 10,
    });

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
      sphereScore: LAIR_REINFESTATION_SPHERE_THRESHOLD + 20,
    });

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

  /** The six neighbours of (20,20). 20 is even, so this is the even-column offset set. */
  const NEIGHBOURS_OF_20_20: Array<[number, number]> = [
    [19, 20], [21, 20], [20, 19], [20, 21], [19, 21], [21, 21],
  ];

  function landTile(col: number, row: number, terrain = 'grassland'): HexTile {
    return {
      coord: { col, row },
      geoParams: { elevation: 0.4, temperature: 0.5, moisture: 0.5 },
      terrain,
      dangerLevel: 0.5,
    } as HexTile;
  }

  /**
   * Build a lair at (20,20) with all six neighbours present on the map.
   *
   * `state.tiles` is what the phase actually reads — a generated world has no
   * hex *location nodes* at all (THR-995), so a fixture that supplied only
   * those would pass while production stayed dead. The hex nodes are added
   * alongside to exercise the optional zone overlay; they carry no
   * `dangerZone`, which the phase treats as eligible (fail-soft).
   */
  function makeSpawnFixture(seed: number): { graph: WorldGraph; state: GameState } {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL * 4;

    addLairNode(graph, 'lair_spawn_src', {
      lairTier: 'minor',
      spawnedAtTick: tick - 5, // recent, won't upgrade — just spawns
      dominantSphere: 'entropy',
      hexCol: 20,
      hexRow: 20,
      dangerZone: 'wilderness',
    });

    for (const [col, row] of NEIGHBOURS_OF_20_20) {
      addHexNode(graph, `hex_${col}_${row}`, col, row);
    }

    const tiles = [
      landTile(20, 20),
      ...NEIGHBOURS_OF_20_20.map(([col, row]) => landTile(col, row)),
    ];

    return {
      graph,
      state: makeMinimalState({ graph, tick, seed, pendingSpherePressures: [], tiles }),
    };
  }

  function adjacentLairs(graph: WorldGraph): Array<{ col: number; row: number }> {
    return graph
      .getNodesByType('location')
      .filter(n => n.properties.locationSubtype === 'lair' && n.id.startsWith('lair_adj_'))
      .map(n => ({ col: n.properties.hexCol as number, row: n.properties.hexRow as number }));
  }

  /**
   * The regression test for THR-995. This is the assertion the old
   * `not.toThrow()` test could not make: before the source lair was excluded
   * from the separation check, `spawnAdjacentLair` had no reachable call site,
   * so this expected exactly zero and passed against a dead feature.
   *
   * Seed 2026 at tick 100 draws 0.097 / 0.195 / 0.308 / 0.011 / 0.253 / 0.811,
   * so neighbours 0 and 3 clear LAIR_ADJACENT_SPAWN_CHANCE.
   */
  it('spawns an adjacent lair on a neighbour hex the PRNG selects', () => {
    const { graph, state } = makeSpawnFixture(2026);

    phaseLairEscalation(state);

    expect(adjacentLairs(graph)).toEqual([{ col: 19, row: 20 }]);
  });

  /**
   * Falsifies "the fix simply deleted the guard". Neighbour 3 at (20,21) also
   * clears the probability roll, but by the time it is considered the lair just
   * spawned at (19,20) sits 2 hexes away — inside ADJACENT_SPAWN_MIN_SEPARATION
   * of 3 — so one source cannot pack its own ring in a single escalation.
   */
  it('separation still blocks a second spawn in the same ring', () => {
    const { graph, state } = makeSpawnFixture(2026);

    phaseLairEscalation(state);

    expect(adjacentLairs(graph)).toHaveLength(1);
  });

  /**
   * The other half of the falsification: separation must still bite against a
   * *different* lair. The blocker sits at (19,21), one hex from both rolled
   * neighbours, and is heartland so it does not run step 4 itself.
   */
  it('separation still blocks spawning near another lair', () => {
    const { graph, state } = makeSpawnFixture(2026);

    addLairNode(graph, 'lair_blocker', {
      lairTier: 'minor',
      spawnedAtTick: (state.tick as number) - 5,
      dominantSphere: 'entropy',
      hexCol: 19,
      hexRow: 21,
      dangerZone: 'heartland',
    });

    phaseLairEscalation(state);

    expect(adjacentLairs(graph)).toEqual([]);
  });

  it('does not spawn when no neighbour clears the probability roll', () => {
    // Seed 42 at tick 100 draws 0.865 / 0.918 / 0.816 / 0.515 / 0.714 / 0.687 —
    // all above LAIR_ADJACENT_SPAWN_CHANCE.
    const { graph, state } = makeSpawnFixture(42);

    phaseLairEscalation(state);

    expect(adjacentLairs(graph)).toEqual([]);
  });

  /**
   * The map is `state.tiles`, not hex location nodes. A world with no tiles has
   * no neighbours to spawn onto, however the roll lands — this is the shape a
   * generated world presented to the old `findHexNode` lookup, which is why the
   * feature stayed dead in production even with the separation guard fixed.
   */
  it('does not spawn onto a hex that is not on the map', () => {
    const { graph, state } = makeSpawnFixture(2026);
    (state as { tiles: HexTile[] }).tiles = [];

    phaseLairEscalation(state);

    expect(adjacentLairs(graph)).toEqual([]);
  });

  it('does not spawn onto water', () => {
    const { graph, state } = makeSpawnFixture(2026);
    (state as { tiles: HexTile[] }).tiles = state.tiles.map(t =>
      t.coord.col === 19 && t.coord.row === 20
        ? ({ ...t, terrain: 'lake' } as HexTile)
        : t,
    );

    phaseLairEscalation(state);

    // (19,20) is water, so the first rolled neighbour is skipped. (20,21) also
    // clears the roll and is now unblocked, since nothing spawned at (19,20).
    expect(adjacentLairs(graph)).toEqual([{ col: 20, row: 21 }]);
  });

  it('does not spawn from a heartland lair even when the roll clears', () => {
    const { graph, state } = makeSpawnFixture(2026);
    graph.updateNode('lair_spawn_src', {
      properties: {
        ...graph.getNode('lair_spawn_src')!.properties,
        dangerZone: 'heartland',
      },
    });

    phaseLairEscalation(state);

    expect(adjacentLairs(graph)).toEqual([]);
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

// ─── Test 8.5: Lair naming (THR-1312) ────────────────────────────────────────

/**
 * The escalation writer used to stamp `Lair (spawned t${tick})`, which meant two
 * lairs spawned on the same tick were *the same string* on a player-facing surface.
 *
 * The persistence tests below are the "cleared_lair keeps its identity" done-when.
 * They are behavioural rather than a code-reading claim: reinfestation rewrites the
 * whole property bag, so "it happens not to touch `name` today" is exactly the kind
 * of thing that silently stops being true.
 */
describe('phaseLairEscalation — lair naming', () => {
  const SEEDED_PLACEHOLDER = /^Lair \d/;
  const ESCALATION_PLACEHOLDER = /^Lair \(spawned/;

  it('names an adjacent spawn instead of stamping the tick', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL * 4;

    addLairNode(graph, 'lair_spawn_src', {
      lairTier: 'minor',
      spawnedAtTick: tick - 5,
      dominantSphere: 'entropy',
      hexCol: 20,
      hexRow: 20,
      dangerZone: 'wilderness',
    });

    const neighbours: Array<[number, number]> = [
      [19, 20], [21, 20], [20, 19], [20, 21], [19, 21], [21, 21],
    ];
    for (const [col, row] of neighbours) addHexNode(graph, `hex_${col}_${row}`, col, row);

    const tile = (col: number, row: number): HexTile => ({
      coord: { col, row },
      geoParams: { elevation: 0.4, temperature: 0.5, moisture: 0.5 },
      terrain: 'dense_forest',
      dangerLevel: 0.5,
    } as HexTile);

    const state = makeMinimalState({
      graph,
      tick,
      seed: 2026, // the seed Test 7 pins as producing exactly one adjacent spawn
      pendingSpherePressures: [],
      tiles: [tile(20, 20), ...neighbours.map(([c, r]) => tile(c, r))],
    });

    phaseLairEscalation(state);

    const spawned = graph
      .getNodesByType('location')
      .filter(n => n.id.startsWith('lair_adj_'));

    // Anti-vacuous guard: the name assertions below hold trivially on zero spawns.
    expect(spawned.length).toBeGreaterThan(0);
    for (const node of spawned) {
      expect(node.name).not.toMatch(ESCALATION_PLACEHOLDER);
      expect(node.name).not.toMatch(SEEDED_PLACEHOLDER);
      expect((node.name as string).trim().length).toBeGreaterThan(0);
    }
  });

  it('a reinfested lair keeps the name it was cleared under', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL;

    addClearedLairNode(graph, 'cleared_named', {
      clearedAtTick: 0,
      dominantSphere: 'force',
      hexCol: 5,
      hexRow: 5,
      sphereScore: LAIR_REINFESTATION_SPHERE_THRESHOLD,
    });
    graph.updateNode('cleared_named', { name: 'The Choking Snare' });

    const state = makeMinimalState({ graph, tick, seed: 42, pendingSpherePressures: [] });

    phaseLairEscalation(state);

    const lair = graph.getNode('cleared_named');
    // The transition must actually have happened, or the name check proves nothing.
    expect(lair?.properties.locationSubtype).toBe('lair');
    expect(lair?.name).toBe('The Choking Snare');
  });

  it('a lair that survives escalation keeps its name', () => {
    const graph = new WorldGraph();
    const tick = LAIR_ESCALATION_INTERVAL * 2;

    addLairNode(graph, 'lair_named', {
      lairTier: 'minor',
      spawnedAtTick: tick - LAIR_UPGRADE_MIN_TICKS, // old enough to upgrade tier
      dominantSphere: 'force',
      hexCol: 40,
      hexRow: 40,
      dangerZone: 'wilderness',
    });
    graph.updateNode('lair_named', { name: 'Blackleaf Thicket' });

    const state = makeMinimalState({ graph, tick, seed: 42, pendingSpherePressures: [] });

    phaseLairEscalation(state);

    const lair = graph.getNode('lair_named');
    // A tier upgrade is the property rewrite most likely to clobber a name.
    expect(lair?.properties.lairTier).toBe('major');
    expect(lair?.name).toBe('Blackleaf Thicket');
  });
});

// ─── Test 9: Export constants ──────────────────────────────────────────────────

describe('phaseLairEscalation — exported constants', () => {
  it('exports all required LAIR_* constants', () => {
    expect(LAIR_ESCALATION_INTERVAL).toBe(25);
    expect(LAIR_SPHERE_PRESSURE_EMISSION).toBeGreaterThan(0);
    expect(LAIR_REINFESTATION_SPHERE_THRESHOLD).toBeGreaterThan(0);
    expect(LAIR_UPGRADE_MIN_TICKS).toBeGreaterThan(0);
    expect(LAIR_LEGENDARY_MIN_TICKS).toBeGreaterThan(LAIR_UPGRADE_MIN_TICKS);
    expect(LAIR_REINFESTATION_MIN_TICKS).toBeGreaterThan(0);
    expect(LAIR_ADJACENT_SPAWN_CHANCE).toBeGreaterThan(0);
    expect(LAIR_ADJACENT_SPAWN_CHANCE).toBeLessThan(1);
  });
});
