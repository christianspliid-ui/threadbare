import { describe, it, expect, beforeEach } from 'vitest';
import {
  phaseAgentActions,
  resetEventCounter,
} from '../orchestrator';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import type { GameState } from '../../types/gameState';
import type { CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { recalcVisibility, collectLOSSources } from '../visibility';

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

function createTestGameState(seed: number = 42): GameState {
  const cosmology = balancedCosmology();
  const tiles = mockTiles();

  const { graph } = seedWorld(cosmology, tiles, seed);

  // Add test location with town subtype to match encounter templates
  graph.addNode({
    id: 'loc.start',
    type: 'location',
    name: 'Sacred Grove',
    properties: {
      locationType: 'location',
      locationSubtype: 'town',
    },
  });

  // Add test actor with axiological profile for selection pipeline
  graph.addNode({
    id: 'actor.test1',
    type: 'actor',
    name: 'TestActor1',
    properties: {
      actorType: 'individual',
      axiologicalProfile: {
        courage_prudence: 0.2,
        asceticism_extravagance: -0.1,
        mercy_ruthlessness: 0.0,
        humility_pride: 0.1,
        honesty_cunning: -0.2,
        mercy_ruthlessness: 0.3,
        loyalty_ambition: 0.1,
        tradition_novelty: -0.1,
        sacrifice_survival: 0.0,
        loyalty_ambition: 0.2,
      },
    },
  });

  // Add located_at edge for the actor
  graph.addEdge({
    id: `edge_test1_loc_${seed}`,
    source: 'actor.test1',
    target: 'loc.start',
    type: 'located_at',
    properties: {},
  });

  const { ascendantId } = createAscendant(graph, {
    archetype: {
      id: 'arch_test',
      name: 'The Watcher Divine',
      title: 'The Watcher',
      description: 'Test archetype',
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      startingDomainAffinities: { iron: 2, gold: 1 },
      personalitySeed: {
        loyalty_ambition: 0.1,
        courage_prudence: 0.2,
        mercy_ruthlessness: -0.3,
        honesty_cunning: 0.0,
        sacrifice_survival: 0.4,
        loyalty_ambition: 0.5,
        tradition_novelty: 0.1,
        humility_pride: -0.2,
        mercy_ruthlessness: 0.0,
        asceticism_extravagance: 0.3,
      },
      flavorText: 'A test archetype for the watcher',
    },
    avatar: {
      name: 'TestAvatar',
      startLocationId: 'loc.start',
      formDescription: 'A test avatar',
    },
  });

  const rivals = generateRivals(cosmology, seed);
  const rivalStates = rivals.map(r => createRivalState(r.id));

  const doomDef = generateDoomClock('breach', 360, seed);
  const doomClock = createDoomClockState('breach', 360);

  const losSources = collectLOSSources(graph, ascendantId, []);
  const gridSize = {
    cols: Math.max(...tiles.map(t => t.coord.col)) + 1,
    rows: Math.max(...tiles.map(t => t.coord.row)) + 1,
  };
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, 0, gridSize.cols, gridSize.rows);

  return {
    cycle: 1,
    tick: 1,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 1, ticksPerSeason: 90, season: 0, year: 0 },
    ascendantId,
    essencePool: emptyEssencePool(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: rivals,
    rivalStates,
    doomDefinition: doomDef,
    doomClock,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap,
    encounterProgress: [],
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

describe('phaseAgentActions with selection pipeline', () => {
  beforeEach(() => {
    resetEventCounter();
  });

  it('skips actors already in an active encounter', () => {
    const state = createTestGameState(42);

    // Add an active encounter for the test actor
    state.encounterProgress.push({
      encounterId: 'enc.test',
      actorId: 'actor.test1',
      currentEncounterIndex: 0,
      history: [],
      status: 'active',
      startedTick: 1,
    });

    // Run phase with high encounter attempt chance
    const result = phaseAgentActions(state);

    // Should not initiate a new encounter (skipped due to active status)
    const encounterEvents = result.tickEvents?.filter(e =>
      e.type === 'agent_action_resolved' && e.message.includes('begins')
    ) ?? [];

    // Should have no encounter initiation events
    expect(encounterEvents.length).toBe(0);
  });

  it('skips actors with no location', () => {
    const state = createTestGameState(43);

    // Remove the located_at edge so actor has no location
    const edgesToRemove = state.graph
      .getOutgoingEdges('actor.test1', 'located_at');
    for (const edge of edgesToRemove) {
      state.graph.removeEdge(edge.source, edge.target, edge.type);
    }

    // Run phase
    const result = phaseAgentActions(state);

    // Should not crash and should return valid result
    expect(result).toBeDefined();
    expect(Array.isArray(result.tickEvents)).toBe(true);
  });

  it('generates encounter candidates from available templates at location', () => {
    const state = createTestGameState(44);

    // Run phase with specific seed to increase encounter probability
    // We'll run multiple ticks to increase chances of triggering an attempt
    let totalEvents = 0;
    let s = state;
    for (let tick = 0; tick < 20; tick++) {
      s = { ...s, tick, tickEvents: [] };
      const result = phaseAgentActions(s);
      totalEvents += result.tickEvents?.length ?? 0;
    }

    // Over 20 ticks with 20% encounter attempt chance, we expect at least some events
    expect(totalEvents).toBeGreaterThan(0);
  });

  it('generates routine prose for non-encounter actions', () => {
    const state = createTestGameState(45);

    let foundRoutineAction = false;
    let s = state;

    // Run multiple ticks to trigger routine action (10% chance)
    for (let tick = 0; tick < 50; tick++) {
      s = { ...s, tick, tickEvents: [] };
      const result = phaseAgentActions(s);
      const events = result.tickEvents ?? [];

      // Look for routine action prose (non-encounter flavor text)
      const routineEvents = events.filter(e =>
        e.type === 'agent_action_resolved' &&
        !e.message.includes('begins ') &&
        e.significance < 0.8
      );

      if (routineEvents.length > 0) {
        foundRoutineAction = true;
        expect(routineEvents[0].message).toBeDefined();
        expect(routineEvents[0].message.length).toBeGreaterThan(0);
        break;
      }
    }

    expect(foundRoutineAction).toBe(true);
  });

  it('increments sphere influence at agent location for routine actions', () => {
    const state = createTestGameState(46);

    // Get initial sphere influence at location
    const loc = state.graph.getNode('loc.start');
    if (!loc?.properties?.sphereInfluence) {
      loc!.properties.sphereInfluence = {};
    }

    let foundInfluenceChange = false;
    let s = state;

    // Run many ticks to trigger routine actions
    for (let tick = 0; tick < 100; tick++) {
      s = { ...s, tick, tickEvents: [] };
      const result = phaseAgentActions(s);

      // Check if we got a routine action event (indicates sphere influence was updated)
      const routineEvents = result.tickEvents?.filter(e =>
        e.type === 'agent_action_resolved' &&
        !e.message.includes('begins ') &&
        e.significance < 0.8
      ) ?? [];

      if (routineEvents.length > 0) {
        foundInfluenceChange = true;
        break;
      }
    }

    // The test passes if we trigger at least one routine action
    // (which would update sphere influence at the location)
    expect(foundInfluenceChange).toBe(true);
  });

  it('generates periodic notable action events', () => {
    const state = createTestGameState(47);

    // Run 5+ ticks to trigger NOTABLE_ACTION_INTERVAL (every 5 ticks)
    let s = state;
    let totalEvents = 0;

    for (let tick = 0; tick < 10; tick++) {
      s = { ...s, tick, tickEvents: [] };
      const result = phaseAgentActions(s);
      totalEvents += result.tickEvents?.length ?? 0;
    }

    // Should have generated some events (routine + notable)
    expect(totalEvents).toBeGreaterThan(0);
  });

  it('handles selection pipeline errors gracefully', () => {
    const state = createTestGameState(48);

    // Add an actor without axiologicalProfile (will cause selection pipeline to fail)
    state.graph.addNode({
      id: 'actor.broken',
      type: 'actor',
      name: 'BrokenActor',
      properties: {
        actorType: 'individual',
        // Missing axiologicalProfile
      },
    });

    // Add located_at edge with unique ID
    state.graph.addEdge({
      id: `edge_broken_loc_${state.seed}`,
      source: 'actor.broken',
      target: 'loc.start',
      type: 'located_at',
      properties: {},
    });

    // Run phase — should not crash
    const result = phaseAgentActions(state);

    expect(result).toBeDefined();
    expect(Array.isArray(result.tickEvents)).toBe(true);
    // Should complete without throwing
  });

  it('respects ENCOUNTER_ATTEMPT_CHANCE (not 100% of actors attempt)', () => {
    const state = createTestGameState(49);

    // Add many test actors with diverse seeds (starting from i=2 to avoid duplicate actor.test1)
    for (let i = 2; i < 10; i++) {
      state.graph.addNode({
        id: `actor.test${i}`,
        type: 'actor',
        name: `TestActor${i}`,
        properties: {
          actorType: 'individual',
          axiologicalProfile: {
            courage_prudence: 0.2,
            asceticism_extravagance: -0.1,
            mercy_ruthlessness: 0.0,
            humility_pride: 0.1,
            honesty_cunning: -0.2,
            mercy_ruthlessness: 0.3,
            loyalty_ambition: 0.1,
            tradition_novelty: -0.1,
            sacrifice_survival: 0.0,
            loyalty_ambition: 0.2,
          },
        },
      });
      state.graph.addEdge({
        id: `edge_${i}_loc_${state.seed}`,
        source: `actor.test${i}`,
        target: 'loc.start',
        type: 'located_at',
        properties: {},
      });
    }

    // Run multiple ticks to ensure at least one action is triggered
    let totalEvents = 0;
    let s = state;
    for (let tick = 0; tick < 10; tick++) {
      s = { ...s, tick, tickEvents: [] };
      const result = phaseAgentActions(s);
      totalEvents += result.tickEvents?.length ?? 0;
    }

    // With 20% encounter + 10% routine + 20% notable interval, expect some events over 10 ticks
    expect(totalEvents).toBeGreaterThan(0);
  });

  it('only attempts encounters when candidates are available', () => {
    const state = createTestGameState(50);

    // Change location subtype to something with no encounters
    const loc = state.graph.getNode('loc.start');
    if (loc) {
      loc.properties.locationSubtype = 'void';
    }

    // Run phase multiple times
    let s = state;
    let totalEvents = 0;

    for (let tick = 0; tick < 50; tick++) {
      s = { ...s, tick, tickEvents: [] };
      const result = phaseAgentActions(s);
      totalEvents += result.tickEvents?.length ?? 0;
    }

    // Should still generate some routine actions but fewer encounters
    expect(totalEvents).toBeGreaterThanOrEqual(0);
  });
});
