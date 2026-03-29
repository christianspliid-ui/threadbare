import { describe, it, expect, beforeEach } from 'vitest';
import {
  initiateEncounter,
  resolveEncounter,
  advanceEncounter,
} from '../encounter';
import { phaseEncounterProgressionV2, resetEventCounter } from '../orchestrator';
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
import { getEncountersByLocationType } from '../../data/encounter-content';

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

  // Add ascendant
  graph.addNode({
    id: 'loc.start',
    type: 'location',
    name: 'Sacred Grove',
    properties: { locationSubtype: 'town' },
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
        tradition_novelty: 0.1,
        preservation_transformation: -0.2,
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
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, 1, gridSize.cols, gridSize.rows);

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

/** Find encounters available at a 'town' location type (used by tests). */
function getTestEncounters() {
  return getEncountersByLocationType('town');
}

describe('phaseEncounterProgressionV2 — retinue notifications', () => {
  beforeEach(() => {
    resetEventCounter();
  });

  function makeRetinueAgent(state: GameState, actorId: string) {
    state.graph.addEdge({
      source: state.ascendantId,
      target: actorId,
      type: 'thread',
      properties: { tier: 1 },
    });
  }

  it('retinue agent completing encounter gets toast notification with actorId', () => {
    const state = createTestGameState(100);
    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getTestEncounters();
    if (available.length === 0) return;

    makeRetinueAgent(state, actor.id);
    const enc = available[0];
    initiateEncounter(state, actor.id, enc.id, 1);
    state.tick = 100;

    const phaseResult = phaseEncounterProgressionV2(state);
    const encounterEvents = (phaseResult.tickEvents ?? []).filter(
      e => e.type === 'encounter_completed' || e.type === 'encounter_step_failure' || e.type === 'encounter_step_success'
    );

    expect(encounterEvents.length).toBeGreaterThanOrEqual(1);

    const retinueEvent = encounterEvents.find(e => e.actorId === actor.id);
    if (retinueEvent && (retinueEvent.type === 'encounter_completed' || retinueEvent.type === 'encounter_step_failure')) {
      expect(retinueEvent.notification).toBeDefined();
      expect(retinueEvent.notification?.channel).toBe('toast');
      expect(retinueEvent.actorId).toBe(actor.id);
    }
  });

  it('non-retinue agent completing encounter does NOT get notification', () => {
    const state = createTestGameState(102);
    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getTestEncounters();
    if (available.length === 0) return;

    const enc = available[0];
    initiateEncounter(state, actor.id, enc.id, 1);
    state.tick = 100;

    const phaseResult = phaseEncounterProgressionV2(state);
    const encounterEvents = (phaseResult.tickEvents ?? []).filter(
      e => e.type === 'encounter_completed' || e.type === 'encounter_step_failure' || e.type === 'encounter_step_success'
    );

    for (const ev of encounterEvents) {
      expect(ev.notification).toBeUndefined();
      expect(ev.actorId).toBeUndefined();
    }
  });

  it('retinue encounter completion message includes encounter name', () => {
    const state = createTestGameState(103);
    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getTestEncounters();
    if (available.length === 0) return;

    makeRetinueAgent(state, actor.id);
    const enc = available[0];
    initiateEncounter(state, actor.id, enc.id, 1);
    state.tick = 100;

    const phaseResult = phaseEncounterProgressionV2(state);
    const encounterEvents = (phaseResult.tickEvents ?? []).filter(
      e => (e.type === 'encounter_completed' || e.type === 'encounter_step_failure') && e.actorId === actor.id
    );

    for (const ev of encounterEvents) {
      expect(ev.message).toContain(enc.name);
    }
  });
});
