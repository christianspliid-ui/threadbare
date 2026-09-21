/**
 * THR-1479 — the appointment's lifecycle through the real planter and the real
 * seed evaluator: planted by an aftermath reaction, kept when the mortal stands on
 * the place's hex in the window, missed when the window closes without them,
 * converted placeless when the world loses the place, refused as a fourth.
 *
 * ## Falsification
 *
 *  • `kept fires only in the window AND on the hex`: removing the hex test in
 *    `evaluateEncounterSeeds`'s appointment arm makes the "absent in the window
 *    → waits" case fire instead of wait.
 *  • `missed converts and rewrites the seed`: removing the window test makes the
 *    mortal wait forever and the missed branch never fires.
 *  • `a fourth appointment is refused`: dropping the `APPOINTMENT_MAX_PER_MORTAL`
 *    check plants four.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { evaluateEncounterSeeds } from '../encounterSeeding';
import { rebindLocatedAt } from '../relocationIntent';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { isAppointmentFavour, readPlantedAppointment } from '../appointments';
import { validateEncounterSeedRefs } from '../nudgeGrantLiveness';
import { SLICE_TEMPLATE_IDS, SLICE_FULL_MOON_DELAY_TICKS, VERTICAL_SLICE_TEMPLATES } from '../../data/encounters/vertical-slice';
import { APPOINTMENT_MAX_PER_MORTAL, APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS, APPOINTMENT_WINDOW_TICKS } from '../../data/movement-content';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

/**
 *   loc-cross (0,0) — the crossroads, a `camp`; the actor starts here
 *   loc-town  (4,0) — a `town` four hexes east, joined by a road
 */
function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Maret', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor-stranger', type: 'actor', name: 'The Stranger', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-cross', type: 'location', name: 'The Crossroads', properties: { hexCol: 0, hexRow: 0, locationSubtype: 'camp', locationType: 'settlement' } });
  graph.addNode({ id: 'loc-town', type: 'location', name: 'Ashford', properties: { hexCol: 4, hexRow: 0, locationSubtype: 'town', locationType: 'settlement' } });
  graph.addEdge({ id: 'hero_loc', source: 'actor-hero', target: 'loc-cross', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'stranger_loc', source: 'actor-stranger', target: 'loc-cross', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'r1', source: 'loc-cross', target: 'loc-town', type: 'adjacent', properties: { totalCost: 4 } });
  graph.addEdge({ id: 'r1b', source: 'loc-town', target: 'loc-cross', type: 'adjacent', properties: { totalCost: 4 } });
  return {
    tick: 50, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
    pendingEncounterSeeds: [],
  } as unknown as GameState;
}

function makeAction(over: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: 'actor-hero', templateId: SLICE_TEMPLATE_IDS.crossroads,
    targetId: 'actor-hero', scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
    supportBindings: [{ key: 'stranger', nodeId: 'actor-stranger', kind: 'actor', delivery: 'summoned', persistence: 'must-persist', reused: false }],
    ...over,
  } as UnifiedAction;
}

const APPOINTMENT_SEED: EncounterAftermathReactionEffect = {
  kind: 'encounter_seed',
  templateId: SLICE_TEMPLATE_IDS.fullMoon,
  targetAgentId: '$actor',
  delayTicks: SLICE_FULL_MOON_DELAY_TICKS,
  seedLabel: 'A promise made at the crossroads falls due at the full moon.',
  inheritContext: true,
  appointment: {
    locationId: '$here',
    counterpartyId: '$cast:stranger',
    missed: {
      query: { kind: 'encounter_template', tags: ['#crossroads_debt'] },
      seedLabel: 'A promise broken at the crossroads has a way of finding the road.',
    },
  },
};

function plant(state: GameState, runtime: SimulationRuntime, effect: EncounterAftermathReactionEffect = APPOINTMENT_SEED, reactionId = 'rx-carry') {
  const reaction: EncounterAftermathReaction = { id: reactionId, label: 'Carry the promise', effects: [effect] } as EncounterAftermathReaction;
  return applyEncounterAftermathReaction(state, makeAction(), reaction, state.tick, runtime).state;
}

const rng = () => 0.5;

describe('the plant', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('binds $here and $cast:stranger, stores the absolute due tick, and writes the promise edge', () => {
    const state = plant(buildState(), runtime);
    const seed = state.pendingEncounterSeeds![0];
    const appointment = readPlantedAppointment(seed)!;
    expect(appointment.locationId).toBe('loc-cross');
    expect(appointment.counterpartyId).toBe('actor-stranger');
    expect(appointment.dueTick).toBe(50 + SLICE_FULL_MOON_DELAY_TICKS);
    expect(seed.eligibleAfterTick).toBe(appointment.dueTick);
    expect(appointment.windowTicks).toBe(APPOINTMENT_WINDOW_TICKS);
    const favour = state.graph.getEdge(appointment.favourEdgeId!)!;
    expect(isAppointmentFavour(favour)).toBe(true);
    expect(favour.source).toBe('actor-hero');
    expect(favour.target).toBe('actor-stranger');
    expect(getTraces().some(t => t.category === 'appointment_planted' && !(t as { refused?: string }).refused)).toBe(true);
  });

  it('plants placeless when the place sentinel cannot bind, and says why', () => {
    const state = plant(buildState(), runtime, {
      ...APPOINTMENT_SEED,
      appointment: { ...APPOINTMENT_SEED.appointment!, locationId: '$cast:nobody' },
    } as EncounterAftermathReactionEffect);
    const seed = state.pendingEncounterSeeds![0];
    expect(readPlantedAppointment(seed)).toBeNull();
    expect(state.graph.getEdgesByType('owes_favor')).toHaveLength(0);
    const trace = getTraces().find(t => t.category === 'appointment_planted') as { refused?: string } | undefined;
    expect(trace?.refused).toBe('place_unresolved');
  });

  it('refuses a fourth appointment, planting it placeless', () => {
    let state = buildState();
    for (let i = 0; i < APPOINTMENT_MAX_PER_MORTAL + 1; i++) {
      state = plant(state, runtime, APPOINTMENT_SEED, `rx-${i}`);
    }
    const placed = state.pendingEncounterSeeds!.filter(s => readPlantedAppointment(s) !== null);
    expect(placed).toHaveLength(APPOINTMENT_MAX_PER_MORTAL);
    expect(state.pendingEncounterSeeds).toHaveLength(APPOINTMENT_MAX_PER_MORTAL + 1);
    const refused = getTraces().filter(t => t.category === 'appointment_planted' && (t as { refused?: string }).refused === 'over_max');
    expect(refused).toHaveLength(1);
  });
});

describe('the evaluator — kept, missed, wait, place lost', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  function plantedAt50(): { state: GameState; dueTick: number } {
    const state = plant(buildState(), runtime);
    const dueTick = readPlantedAppointment(state.pendingEncounterSeeds![0])!.dueTick;
    return { state, dueTick };
  }

  it('before the due tick nothing happens', () => {
    const { state, dueTick } = plantedAt50();
    const next = evaluateEncounterSeeds(state, dueTick - 1, rng, runtime);
    expect(next.pendingEncounterSeeds).toHaveLength(1);
    expect(next.unifiedActions).toHaveLength(0);
  });

  it('kept: present on the hex in the window → the kept sequel fires at the place, the promise is redeemed, the Event kind records it', () => {
    const { state, dueTick } = plantedAt50();
    const favourId = readPlantedAppointment(state.pendingEncounterSeeds![0])!.favourEdgeId!;
    const next = evaluateEncounterSeeds(state, dueTick + 2, rng, runtime);
    expect(next.pendingEncounterSeeds).toHaveLength(0);
    expect(next.unifiedActions).toHaveLength(1);
    expect(next.unifiedActions[0].templateId).toBe(SLICE_TEMPLATE_IDS.fullMoon);
    expect(next.graph.getEdge(favourId)).toBeUndefined();
    expect(next.graph.getNodesByType('event').some(n => n.properties.eventType === 'appointment_kept')).toBe(true);
    expect(getTraces().some(t => t.category === 'appointment_kept')).toBe(true);
    expect(next.tickEvents.some(e => /keeps their word at The Crossroads/.test(e.message))).toBe(true);
  });

  it('wait: due, in the window, not there yet → the seed waits', () => {
    const { state, dueTick } = plantedAt50();
    rebindLocatedAt(state.graph, 'actor-hero', 'loc-town');
    const next = evaluateEncounterSeeds(state, dueTick + 2, rng, runtime);
    expect(next.pendingEncounterSeeds).toHaveLength(1);
    expect(readPlantedAppointment(next.pendingEncounterSeeds![0])).not.toBeNull();
    expect(next.unifiedActions).toHaveLength(0);
    expect(getTraces().some(t => t.category === 'appointment_missed' || t.category === 'appointment_kept')).toBe(false);
  });

  it('missed: the window closed without them → the seed becomes its missed branch, the promise is broken, the Event kind records it', () => {
    const { state, dueTick } = plantedAt50();
    const favourId = readPlantedAppointment(state.pendingEncounterSeeds![0])!.favourEdgeId!;
    rebindLocatedAt(state.graph, 'actor-hero', 'loc-town');
    const closedAt = dueTick + APPOINTMENT_WINDOW_TICKS + 1;
    const next = evaluateEncounterSeeds(state, closedAt, rng, runtime);
    expect(next.unifiedActions).toHaveLength(0);
    const converted = next.pendingEncounterSeeds![0];
    expect(readPlantedAppointment(converted)).toBeNull();
    expect(converted.templateId).toBeUndefined();
    expect(converted.query?.tags).toEqual(['#crossroads_debt']);
    expect(converted.seedLabel).toBe(APPOINTMENT_SEED.appointment!.missed.seedLabel);
    expect(converted.eligibleAfterTick).toBe(closedAt + APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS);
    expect(converted.missedAppointment).toEqual({ locationId: 'loc-cross', dueTick, reason: 'absent' });
    const favour = next.graph.getEdge(favourId)!;
    expect(favour.properties.broken).toBe(true);
    expect(next.graph.getNodesByType('event').some(n => n.properties.eventType === 'appointment_missed')).toBe(true);
    const trace = getTraces().find(t => t.category === 'appointment_missed') as { reason?: string; missedQuery?: string } | undefined;
    expect(trace?.reason).toBe('absent');
    expect(trace?.missedQuery).toContain('crossroads_debt');

    // …and the missed branch then fires wherever they stand, through the unchanged placeless path.
    const later = evaluateEncounterSeeds(next, converted.eligibleAfterTick, rng, runtime);
    expect(later.unifiedActions).toHaveLength(1);
    expect(later.unifiedActions[0].templateId).toBe(SLICE_TEMPLATE_IDS.fullMoonReckoning);
    expect(later.pendingEncounterSeeds).toHaveLength(0);
  });

  it('missed while the place is unreachable reads as unreachable', () => {
    const { state, dueTick } = plantedAt50();
    state.graph.removeEdge('r1');
    state.graph.removeEdge('r1b');
    rebindLocatedAt(state.graph, 'actor-hero', 'loc-town');
    const next = evaluateEncounterSeeds(state, dueTick + APPOINTMENT_WINDOW_TICKS + 1, rng, runtime);
    expect(next.pendingEncounterSeeds![0].missedAppointment?.reason).toBe('unreachable');
  });

  it('place lost: the world lost the place → the kept branch fires placeless and the promise is released, not broken', () => {
    const { state, dueTick } = plantedAt50();
    const favourId = readPlantedAppointment(state.pendingEncounterSeeds![0])!.favourEdgeId!;
    // Strip the crossroads of its hex: the settlement dissolved.
    state.graph.updateNode('loc-cross', { properties: { hexCol: undefined, hexRow: undefined } });
    rebindLocatedAt(state.graph, 'actor-hero', 'loc-town');
    const next = evaluateEncounterSeeds(state, dueTick + 1, rng, runtime);
    expect(next.unifiedActions).toHaveLength(1);
    expect(next.unifiedActions[0].templateId).toBe(SLICE_TEMPLATE_IDS.fullMoon);
    expect(next.graph.getEdge(favourId)).toBeUndefined();
    const trace = getTraces().find(t => t.category === 'appointment_missed') as { reason?: string } | undefined;
    expect(trace?.reason).toBe('place_lost');
  });
});

describe('the gate — both branches, or nothing ships', () => {
  const template = (effect: EncounterAftermathReactionEffect): UnifiedActionTemplate => ({
    id: 'fixture.appointment',
    name: 'Fixture',
    reach: 'heart',
    crudType: 'read',
    scale: 'local',
    apCost: 1,
    steps: [],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'fixture',
        changes: [],
        reactions: [{ id: 'fixture.rx', label: 'Fixture', intent: 'Fixture', effects: [effect] }],
      },
    },
  } as unknown as UnifiedActionTemplate);

  it('the shipped Crossroads passes', () => {
    const crossroads = VERTICAL_SLICE_TEMPLATES.find(t => t.id === SLICE_TEMPLATE_IDS.crossroads)!;
    expect(validateEncounterSeedRefs([crossroads]).dead).toEqual([]);
  });
  it('RED: an appointment with no missed branch is fatal', () => {
    const report = validateEncounterSeedRefs([template({
      ...APPOINTMENT_SEED,
      appointment: { locationId: '$here', missed: { seedLabel: 'x' } },
    } as EncounterAftermathReactionEffect)]);
    expect(report.dead.map(d => d.kind)).toEqual(['appointment_missing_branch']);
  });
  it('RED: a missed branch naming a dead template is fatal', () => {
    const report = validateEncounterSeedRefs([template({
      ...APPOINTMENT_SEED,
      appointment: { locationId: '$here', missed: { templateId: 'encounter.nope', seedLabel: 'x' } },
    } as EncounterAftermathReactionEffect)]);
    expect(report.dead.map(d => d.kind)).toEqual(['dead_template']);
  });
  it('RED: a missed branch whose query matches nothing is fatal', () => {
    const report = validateEncounterSeedRefs([template({
      ...APPOINTMENT_SEED,
      appointment: { locationId: '$here', missed: { query: { kind: 'encounter_template', tags: ['#no_such_family'] }, seedLabel: 'x' } },
    } as EncounterAftermathReactionEffect)]);
    expect(report.dead.map(d => d.kind)).toEqual(['empty_query']);
  });
});
