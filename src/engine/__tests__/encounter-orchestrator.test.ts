import { describe, it, expect, beforeEach } from 'vitest';
import {
  initiateEncounter,
  resolveEncounter,
  advanceEncounter,
} from '../encounter';
import { phaseEncounterProgressionV2, resetEventCounter } from '../orchestrator';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import type { GameState, TickEvent } from '../../types/gameState';
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

/** Find encounters available at a 'town' location type that are NOT unified templates.
 * phaseEncounterProgressionV2 skips encounters that are unified templates (handled by a separate phase).
 */
/**
 * Town encounters usable as legacy `encounterProgress` fixtures.
 *
 * This used to additionally filter to templates *absent* from the unified pool
 * (`getUnifiedTemplateById(e.id) === undefined`). Once the seed-system-v2
 * migration moved every template into `UNIFIED_ACTION_TEMPLATES`, that predicate
 * matched nothing — 74 town encounters, 0 survivors — and since each test in this
 * block opened with `if (available.length === 0) return;`, all three passed by
 * never executing a single assertion (found under THR-993). The filter is gone
 * and the early return is now an assertion, so an empty pool fails loudly
 * instead of silently greening the block.
 *
 * `initiateEncounter` drives the legacy path from any `ENCOUNTER_TEMPLATES`
 * entry regardless of unified-pool membership, which is what this block exercises.
 */
function getTestEncounters() {
  return getEncountersByLocationType('town');
}

/** Bound on how many phase calls a test will make waiting for an encounter to conclude. */
const MAX_PHASE_DRIVE_TICKS = 40;

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

  /**
   * THR-664 retired encounter toasts outright — an encounter's beats and its
   * conclusion surface as a badge on the agent's thread row, never in the global
   * queue ("activity about an entity renders on that entity's persistent card in
   * the Threads panel, not in a global transient queue"). So the retinue event
   * still carries `actorId` for the event log and the badge's navigation, and
   * carries **no** `notification` directive at all.
   *
   * This assertion is what keeps the toast from coming back: `routeNotifications`
   * skips any event without a directive (`if (!event.notification) continue`), so
   * re-adding one here is the single edit that would re-toast encounters.
   *
   * Until THR-993 this test asserted the opposite — `notification.channel === 'toast'`,
   * the pre-THR-664 contract — and passed anyway, because every assertion sat
   * behind an `if (retinueEvent && ...)` guard that stopped matching once the
   * directive was removed. Green on a dead contract. The guard is now an
   * assertion, so the test fails if the population it inspects is ever empty.
   */
  it('retinue agent completing encounter gets actorId but NO toast directive (THR-664)', () => {
    const state = createTestGameState(100);
    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getTestEncounters();
    expect(available.length).toBeGreaterThan(0);

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
    expect(retinueEvent).toBeDefined();
    expect(retinueEvent!.actorId).toBe(actor.id);
    expect(retinueEvent!.notification).toBeUndefined();

    // No encounter event of any kind raises a notification — the badge is the surface.
    for (const ev of encounterEvents) {
      expect(ev.notification).toBeUndefined();
    }
  });

  it('non-retinue agent completing encounter does NOT get notification', () => {
    const state = createTestGameState(102);
    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getTestEncounters();
    expect(available.length).toBeGreaterThan(0);

    const enc = available[0];
    initiateEncounter(state, actor.id, enc.id, 1);
    state.tick = 100;

    const phaseResult = phaseEncounterProgressionV2(state);
    const encounterEvents = (phaseResult.tickEvents ?? []).filter(
      e => e.type === 'encounter_completed' || e.type === 'encounter_step_failure' || e.type === 'encounter_step_success'
    );

    // Falsify the loop below — an empty array would satisfy it without asserting anything.
    expect(encounterEvents.length).toBeGreaterThanOrEqual(1);

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
    expect(available.length).toBeGreaterThan(0);

    makeRetinueAgent(state, actor.id);
    const enc = available[0];
    initiateEncounter(state, actor.id, enc.id, 1);

    // Only the terminal branches (completed / abandoned) name the encounter — the
    // mid-encounter branch reads "<agent> succeeded in their encounter". So drive
    // the phase until the encounter concludes rather than asserting on one call,
    // which lands mid-encounter and made this check vacuous.
    let encounterEvents: TickEvent[] = [];
    for (let i = 0; i < MAX_PHASE_DRIVE_TICKS && encounterEvents.length === 0; i++) {
      state.tick = 100 + i;
      const phaseResult = phaseEncounterProgressionV2(state);
      state.encounterProgress = phaseResult.encounterProgress ?? state.encounterProgress;
      state.tickEvents = phaseResult.tickEvents ?? state.tickEvents;
      encounterEvents = state.tickEvents.filter(
        e => (e.type === 'encounter_completed' || e.type === 'encounter_step_failure') && e.actorId === actor.id
      );
    }

    // Falsify the loop below — an empty array would satisfy it without asserting anything.
    expect(encounterEvents.length).toBeGreaterThanOrEqual(1);

    for (const ev of encounterEvents) {
      expect(ev.message).toContain(enc.name);
    }
  });
});
