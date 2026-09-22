/**
 * A work whose payoff is a meeting (THR-1519, slice 3 of THR-1479).
 *
 * `create × Agreement` carries an `appointmentPayoff`; on completion the digger
 * plants an appointment with the mortal the secret was about, through slice 1's one
 * planter. Asserted on a small fixture that falsifies: the seed carries the
 * `appointment` block and the promise edge; a template without the payoff plants
 * nothing and the verb still mints a mark; an unplaced site refuses and plants
 * placeless; the resolution site is the undertaking's own.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { maybePlantAppointmentPayoff } from '../strategicActionLifecycle';
import { evaluateEncounterSeeds, seedQuerySite } from '../encounterSeeding';
import { evaluateGraphCondition } from '../graphConditions';
import { createSimulationRuntime } from '../simulationRuntime';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { isAppointmentFavour, readPlantedAppointment } from '../appointments';
import { getCellTemplate, UNDERTAKING_CELL_APPOINTMENTS } from '../../data/undertaking-cells';
import { getUndertakingObjectType } from '../../data/undertaking-objects';
import { UNDERTAKING_APPOINTMENT_DELAY_TICKS, UNDERTAKING_APPOINTMENT_SEED_PRIORITY } from '../../data/strategic-action-constants';
import { APPOINTMENT_WINDOW_TICKS } from '../../data/movement-content';
import type { GameState } from '../../types/gameState';
import type { StrategicActionCandidate } from '../../types/strategicAction';
import type { AppointmentPlantedTrace } from '../../types/trace';

const CELL = 'cell.create.agreement';

/**
 *   loc-town (4,0) — a `town`; the digger and the subject both stand here
 */
function buildState(opts: { subjectPlaced?: boolean } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Maret', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor-subject', type: 'actor', name: 'Odo the Factor', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-town', type: 'location', name: 'Ashford', properties: { hexCol: 4, hexRow: 0, locationSubtype: 'town', locationType: 'settlement' } });
  graph.addEdge({ id: 'hero_loc', source: 'actor-hero', target: 'loc-town', type: 'located_at', properties: {} });
  if (opts.subjectPlaced !== false) {
    graph.addEdge({ id: 'subject_loc', source: 'actor-subject', target: 'loc-town', type: 'located_at', properties: {} });
  }
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

function candidate(templateId: string, over: Partial<StrategicActionCandidate> = {}): StrategicActionCandidate {
  return {
    candidateId: 'cand_1', templateId, ambitionId: 'ambition_uncover_secrets', actorId: 'actor-hero',
    verb: 'create', executionMode: 'multi_tick_project', behaviorFamily: 'court-political',
    displayName: 'Dig up a secret', targetNodeId: 'actor-subject',
    ...over,
  } as StrategicActionCandidate;
}

describe('the appointment payoff (THR-1519)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('the cell carries the table row as its appointmentPayoff', () => {
    expect(getCellTemplate(CELL)?.appointmentPayoff).toEqual(UNDERTAKING_CELL_APPOINTMENTS[CELL]);
  });

  it('a completed create × Agreement plants an appointment with the subject at the place they stand, and writes the promise', () => {
    const state = buildState();
    expect(maybePlantAppointmentPayoff(state, candidate(CELL), 50)).toBe(true);

    const seeds = state.pendingEncounterSeeds!;
    expect(seeds).toHaveLength(1);
    const seed = seeds[0];
    const appointment = readPlantedAppointment(seed)!;
    expect(appointment).not.toBeNull();
    expect(appointment.locationId).toBe('loc-town');
    expect(appointment.counterpartyId).toBe('actor-subject');
    expect(appointment.dueTick).toBe(50 + UNDERTAKING_APPOINTMENT_DELAY_TICKS);
    expect(seed.eligibleAfterTick).toBe(appointment.dueTick);
    expect(appointment.windowTicks).toBe(APPOINTMENT_WINDOW_TICKS);
    expect(appointment.missed).toEqual(UNDERTAKING_CELL_APPOINTMENTS[CELL].missed);

    // The kept branch is the seed's own query; the seed is attributed to the work.
    expect(seed.query).toEqual(UNDERTAKING_CELL_APPOINTMENTS[CELL].meeting);
    expect(seed.templateId).toBeUndefined();
    expect(seed.targetAgentId).toBe('actor-hero');
    expect(seed.priority).toBe(UNDERTAKING_APPOINTMENT_SEED_PRIORITY);
    expect(seedQuerySite(seed)).toBe('undertaking_appointment');

    // The promise: an owes_favor edge of the appointment shape, digger → subject.
    const favour = state.graph.getEdge(appointment.favourEdgeId!)!;
    expect(isAppointmentFavour(favour)).toBe(true);
    expect(favour.source).toBe('actor-hero');
    expect(favour.target).toBe('actor-subject');
    expect(favour.properties.redeemed).toBe(false);
    expect(favour.properties.broken).toBe(false);

    const trace = getTraces().find(t => t.category === 'appointment_planted') as AppointmentPlantedTrace | undefined;
    expect(trace?.source).toBe('undertaking');
    expect(trace?.templateId).toBe(CELL);
    expect(trace?.refused).toBeUndefined();
  });

  it('a template without the payoff plants nothing — and the verb still mints a mark as today', () => {
    const state = buildState();
    expect(getCellTemplate('cell.use.agreement')?.appointmentPayoff).toBeUndefined();
    expect(maybePlantAppointmentPayoff(state, candidate('cell.use.agreement'), 50)).toBe(false);
    expect(state.pendingEncounterSeeds).toEqual([]);
    expect(getTraces().some(t => t.category === 'appointment_planted')).toBe(false);

    const agreement = getUndertakingObjectType('agreement')!;
    const create = agreement.verbs.create;
    expect(typeof create).toBe('function');
    const result = (create as (ctx: never) => { success: boolean; op: string })({
      state, graph: state.graph, actorId: 'actor-hero',
      handle: { kind: 'node', nodeId: 'actor-subject' }, targetNodeId: 'actor-subject', tick: 50,
    } as never);
    expect(result.success).toBe(true);
    expect(result.op).toBe('mint_leverage_mark');
    expect(state.graph.getOutgoingEdges('actor-hero', 'knows_secret_of').some(e => e.target === 'actor-subject')).toBe(true);
  });

  it('a subject with no place refuses place_unresolved and plants the meeting placeless — no promise edge', () => {
    const state = buildState({ subjectPlaced: false });
    expect(maybePlantAppointmentPayoff(state, candidate(CELL), 50)).toBe(true);
    const seed = state.pendingEncounterSeeds![0];
    expect(readPlantedAppointment(seed)).toBeNull();
    expect(seed.query).toEqual(UNDERTAKING_CELL_APPOINTMENTS[CELL].meeting);
    expect(state.graph.getOutgoingEdges('actor-hero', 'owes_favor')).toHaveLength(0);
    const trace = getTraces().find(t => t.category === 'appointment_planted') as AppointmentPlantedTrace | undefined;
    expect(trace?.refused).toBe('place_unresolved');
    expect(trace?.source).toBe('undertaking');
  });

  it('kept at a place the meeting family cannot fire at: the sequel withers, but the word was kept — promise redeemed, Event written, milestone counts', () => {
    // Measured on seed 42: three meetings kept at a ruin (the Forge of Sorrow) with
    // `#thieves_errand` gated to settlements — three dangling promises, zero kept
    // Events, before the withered path learned to record a kept appointment.
    const state = buildState();
    state.graph.updateNode('loc-town', { properties: { ...state.graph.getNode('loc-town')!.properties, locationSubtype: 'ruins' } });
    expect(maybePlantAppointmentPayoff(state, candidate(CELL), 50)).toBe(true);
    const seed = state.pendingEncounterSeeds![0];
    const appointment = readPlantedAppointment(seed)!;
    const runtime = createSimulationRuntime();

    const after = evaluateEncounterSeeds(state, appointment.dueTick, () => 0.5, runtime);
    expect(after.pendingEncounterSeeds!.some(s => s.seedId === seed.seedId)).toBe(false);
    expect(after.unifiedActions.some(a => a.spawnedFromSeedId === seed.seedId)).toBe(false);
    expect(after.graph.getEdge(appointment.favourEdgeId!)).toBeUndefined();
    const keptEvents = after.graph.getOutgoingEdges('actor-hero', 'participated_in')
      .filter(e => after.graph.getNode(e.target)?.properties.eventType === 'appointment_kept');
    expect(keptEvents).toHaveLength(1);
    expect(evaluateGraphCondition({ type: 'agent_kept_appointment', minCount: 1 }, after.graph, 'actor-hero')).toBe(true);
    const kept = getTraces().find(t => t.category === 'appointment_kept') as { resolvedTemplateId?: string } | undefined;
    expect(kept?.resolvedTemplateId).toMatch(/^withered:/);
  });

  it('a site that is not a mortal (a Location) makes the place the creditor', () => {
    const state = buildState();
    expect(maybePlantAppointmentPayoff(state, candidate(CELL, { targetNodeId: 'loc-town' }), 50)).toBe(true);
    const appointment = readPlantedAppointment(state.pendingEncounterSeeds![0])!;
    expect(appointment.locationId).toBe('loc-town');
    expect(appointment.counterpartyId).toBeUndefined();
    expect(state.graph.getEdge(appointment.favourEdgeId!)!.target).toBe('loc-town');
  });
});
