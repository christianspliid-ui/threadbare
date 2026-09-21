/**
 * THR-1479 — the appointment primitive's arithmetic and its scorer wire.
 *
 * Slack, the leave margin at the four axis corners (including the negative
 * corner the ruling asks for), the regime at each boundary, the pull's shape,
 * and — the one assertion the unit arms cannot make — that the pull actually
 * reaches `scoreAndSelect`. The relocation suite learned that the hard way: its
 * unit tests passed with the reader disconnected from the scorer, so this file
 * has an end-to-end arm too.
 *
 * ## Falsification
 *
 *  • `describe('the pull — wired into scoreAndSelect')`: reverting the
 *    `+ appointmentBonus` term in `encounterScoring.ts` fails "adds exactly
 *    W / (1 + dist) to the candidate at the place".
 *  • `describe('the regime')`: swapping the `<` for `<=` on the leave margin
 *    fails the boundary case at `slack === margin`.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  appointmentRegime,
  computeAppointmentPull,
  computeAppointmentSlack,
  leaveMargin,
  readPlantedAppointment,
  resolveAppointmentContext,
  describeAppointments,
  isAppointmentFavour,
  redeemAppointmentFavour,
  breakAppointmentFavour,
  writeAppointmentEvent,
  APPOINTMENT_FAVOUR_PROP,
  type AppointmentContext,
} from '../appointments';
import {
  APPOINTMENT_AMBITION_MARGIN_TICKS,
  APPOINTMENT_LEAVE_MARGIN_TICKS,
  APPOINTMENT_PRUDENCE_MARGIN_TICKS,
  APPOINTMENT_PULL_HORIZON_TICKS,
  APPOINTMENT_PULL_WEIGHT,
} from '../../data/movement-content';
import { scoreAndSelect } from '../encounterScoring';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ReachDomain } from '../../types/traits';
import type { ValuePair } from '../../types/agent';
import type { PendingEncounterSeed, PlantedAppointment } from '../../types/unifiedAction';

/**
 * A line of three towns joined by roads, so `findShortestPath` prices a real
 * journey rather than returning null:
 *
 *   loc-home (0,0) ── loc-mid (3,0) ── loc-far (6,0)
 *   loc-island (20,0) — no road, unreachable
 */
function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Maret', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor-stranger', type: 'actor', name: 'The Stranger', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-home', type: 'location', name: 'Home', properties: { hexCol: 0, hexRow: 0, locationSubtype: 'town', locationType: 'settlement' } });
  graph.addNode({ id: 'loc-mid', type: 'location', name: 'Midway', properties: { hexCol: 3, hexRow: 0, locationSubtype: 'hamlet', locationType: 'settlement' } });
  graph.addNode({ id: 'loc-far', type: 'location', name: 'The Crossroads', properties: { hexCol: 6, hexRow: 0, locationSubtype: 'camp', locationType: 'settlement' } });
  graph.addNode({ id: 'loc-island', type: 'location', name: 'Island', properties: { hexCol: 20, hexRow: 0, locationSubtype: 'town', locationType: 'settlement' } });
  graph.addEdge({ id: 'hero_loc', source: 'actor-hero', target: 'loc-home', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'r1', source: 'loc-home', target: 'loc-mid', type: 'adjacent', properties: { totalCost: 3 } });
  graph.addEdge({ id: 'r1b', source: 'loc-mid', target: 'loc-home', type: 'adjacent', properties: { totalCost: 3 } });
  graph.addEdge({ id: 'r2', source: 'loc-mid', target: 'loc-far', type: 'adjacent', properties: { totalCost: 3 } });
  graph.addEdge({ id: 'r2b', source: 'loc-far', target: 'loc-mid', type: 'adjacent', properties: { totalCost: 3 } });
  return graph;
}

function appointmentAt(locationId: string, dueTick: number, over: Partial<PlantedAppointment> = {}): PlantedAppointment {
  return {
    locationId,
    dueTick,
    windowTicks: 12,
    counterpartyId: 'actor-stranger',
    missed: { query: { kind: 'encounter_template', tags: ['#crossroads_debt'] }, seedLabel: 'the stranger collects' },
    ...over,
  };
}

function seedWith(appointment: PlantedAppointment | undefined, over: Partial<PendingEncounterSeed> = {}): PendingEncounterSeed {
  return {
    seedId: 'seed-1',
    sourceEncounterId: 'enc.crossroads',
    sourceReactionId: 'rx',
    templateId: 'encounter.slice.full_moon_collection',
    targetAgentId: 'actor-hero',
    eligibleAfterTick: appointment?.dueTick ?? 100,
    priority: 1,
    seedLabel: 'A promise made at the crossroads falls due at the full moon.',
    plantedTick: 10,
    ...(appointment ? { appointment } : {}),
    ...over,
  } as PendingEncounterSeed;
}

const NEUTRAL = { courage_prudence: 0, loyalty_ambition: 0 };

describe('readPlantedAppointment — shape-validating (fail-soft)', () => {
  it('reads a well-formed block', () => {
    expect(readPlantedAppointment(seedWith(appointmentAt('loc-far', 100)))).not.toBeNull();
  });
  it('reads a placeless seed as absent', () => {
    expect(readPlantedAppointment(seedWith(undefined))).toBeNull();
  });
  it('reads a malformed block on a saved world as absent rather than throwing', () => {
    const malformed = seedWith(undefined, { appointment: { locationId: '', dueTick: Number.NaN } as never });
    expect(readPlantedAppointment(malformed)).toBeNull();
    const noMissed = seedWith(undefined, { appointment: { locationId: 'loc-far', dueTick: 100, windowTicks: 12 } as never });
    expect(readPlantedAppointment(noMissed)).toBeNull();
  });
});

describe('the slack', () => {
  it('is due − now − travel on a priced path', () => {
    const graph = buildGraph();
    const slack = computeAppointmentSlack(graph, 'actor-hero', appointmentAt('loc-far', 100), 50)!;
    // The price is the pathfinder's (movement cost per hop, not the fixture's
    // edge property); what this asserts is the arithmetic over it.
    expect(slack.travelTicks).toBeGreaterThan(0);
    expect(Number.isFinite(slack.travelTicks)).toBe(true);
    expect(slack.slack).toBe(100 - 50 - slack.travelTicks);
    expect(slack.atPlace).toBe(false);
    expect(slack.placeHex).toEqual({ col: 6, row: 0 });
  });
  it('is −∞ when no road reaches the place', () => {
    const graph = buildGraph();
    const slack = computeAppointmentSlack(graph, 'actor-hero', appointmentAt('loc-island', 100), 50)!;
    expect(slack.slack).toBe(-Infinity);
    expect(slack.travelTicks).toBe(Infinity);
  });
  it('is hex-granular at the place: standing on its hex is being there', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'place-inn', type: 'location', name: 'The Inn', properties: { parentLocationId: 'loc-far', sublocationTypeId: 'inn' } });
    graph.removeEdge('hero_loc');
    graph.addEdge({ id: 'hero_loc2', source: 'actor-hero', target: 'place-inn', type: 'located_at', properties: {} });
    const slack = computeAppointmentSlack(graph, 'actor-hero', appointmentAt('loc-far', 100), 50)!;
    expect(slack.atPlace).toBe(true);
    expect(slack.travelTicks).toBe(0);
  });
  it('is null when the place has no hex (the world lost it)', () => {
    const graph = buildGraph();
    expect(computeAppointmentSlack(graph, 'actor-hero', appointmentAt('loc-gone', 100), 50)).toBeNull();
  });
});

describe('the leave margin — two existing axes, and the negative corner', () => {
  it('is the base at neutral', () => {
    expect(leaveMargin(NEUTRAL)).toBe(APPOINTMENT_LEAVE_MARGIN_TICKS);
  });
  it('a Watcher (full prudence) leaves earlier', () => {
    expect(leaveMargin({ courage_prudence: -1, loyalty_ambition: 0 }))
      .toBe(APPOINTMENT_LEAVE_MARGIN_TICKS + APPOINTMENT_PRUDENCE_MARGIN_TICKS);
  });
  it('a Renegade (full ambition) can choose to miss — the margin goes negative', () => {
    const margin = leaveMargin({ courage_prudence: 0, loyalty_ambition: -1 });
    expect(margin).toBe(APPOINTMENT_LEAVE_MARGIN_TICKS - APPOINTMENT_AMBITION_MARGIN_TICKS);
    expect(margin).toBeLessThan(0);
  });
  it('a prudent Renegade nets out', () => {
    expect(leaveMargin({ courage_prudence: -1, loyalty_ambition: -1 }))
      .toBe(APPOINTMENT_LEAVE_MARGIN_TICKS + APPOINTMENT_PRUDENCE_MARGIN_TICKS - APPOINTMENT_AMBITION_MARGIN_TICKS);
  });
  it('the positive poles add nothing (Vanguard, Sworn)', () => {
    expect(leaveMargin({ courage_prudence: 1, loyalty_ambition: 1 })).toBe(APPOINTMENT_LEAVE_MARGIN_TICKS);
  });
});

describe('the regime — each boundary', () => {
  const at = (slack: number, atPlace = false) =>
    ({ slack, travelTicks: 3, atPlace, placeHex: { col: 6, row: 0 } });
  const margin = 6;
  it('far above the horizon', () => {
    expect(appointmentRegime(at(APPOINTMENT_PULL_HORIZON_TICKS + 1), margin)).toBe('far');
  });
  it('leaning at the horizon and down to the margin', () => {
    expect(appointmentRegime(at(APPOINTMENT_PULL_HORIZON_TICKS), margin)).toBe('leaning');
    expect(appointmentRegime(at(margin), margin)).toBe('leaning');
  });
  it('departing strictly under the margin, while slack is non-negative', () => {
    expect(appointmentRegime(at(margin - 1), margin)).toBe('departing');
    expect(appointmentRegime(at(0), margin)).toBe('departing');
  });
  it('lost once slack is negative, including unreachable', () => {
    expect(appointmentRegime(at(-1), margin)).toBe('lost');
    expect(appointmentRegime(at(-Infinity), margin)).toBe('lost');
  });
  it('waiting at the place, whatever the slack', () => {
    expect(appointmentRegime(at(-5, true), margin)).toBe('waiting');
    expect(appointmentRegime(at(40, true), margin)).toBe('waiting');
  });
  it('a negative margin never departs — the mortal chooses to miss', () => {
    expect(appointmentRegime(at(0), -6)).toBe('leaning');
    expect(appointmentRegime(at(-1), -6)).toBe('lost');
  });
});

describe('resolveAppointmentContext — nearest-due with non-negative slack', () => {
  it('picks the nearest due that can still be kept, and reports its regime', () => {
    const graph = buildGraph();
    const state = { graph, pendingEncounterSeeds: [
      seedWith(appointmentAt('loc-far', 200), { seedId: 'later' }),
      seedWith(appointmentAt('loc-mid', 70), { seedId: 'sooner' }),
    ] };
    const ctx = resolveAppointmentContext(state, 'actor-hero', 50, NEUTRAL)!;
    expect(ctx.seed.seedId).toBe('sooner');
    expect(ctx.slack.travelTicks).toBeGreaterThan(0);
    expect(ctx.slack.slack).toBe(70 - 50 - ctx.slack.travelTicks);
    // One hop away: slack sits inside the 24-tick horizon and above the 6-tick margin.
    expect(ctx.slack.slack).toBeLessThanOrEqual(APPOINTMENT_PULL_HORIZON_TICKS);
    expect(ctx.slack.slack).toBeGreaterThanOrEqual(APPOINTMENT_LEAVE_MARGIN_TICKS);
    expect(ctx.regime).toBe('leaning');
  });
  it('falls back to the lost one when nothing can be kept', () => {
    const graph = buildGraph();
    const state = { graph, pendingEncounterSeeds: [seedWith(appointmentAt('loc-island', 100))] };
    expect(resolveAppointmentContext(state, 'actor-hero', 50, NEUTRAL)?.regime).toBe('lost');
  });
  it('is null for a mortal holding nothing', () => {
    expect(resolveAppointmentContext({ graph: buildGraph(), pendingEncounterSeeds: [] }, 'actor-hero', 50, NEUTRAL)).toBeNull();
  });
});

describe('the pull — shape and regime gating', () => {
  const ctx = (regime: AppointmentContext['regime']): AppointmentContext => ({
    seed: seedWith(appointmentAt('loc-far', 100)),
    appointment: appointmentAt('loc-far', 100),
    slack: { slack: 10, travelTicks: 6, atPlace: false, placeHex: { col: 6, row: 0 } },
    leaveMargin: 6,
    regime,
  });
  it('is W at the place and decays by hex distance', () => {
    expect(computeAppointmentPull(ctx('leaning'), 6, 0)).toBe(APPOINTMENT_PULL_WEIGHT);
    expect(computeAppointmentPull(ctx('departing'), 3, 0)).toBeCloseTo(APPOINTMENT_PULL_WEIGHT / 4);
  });
  it('is 0 outside the leaning and departing regimes, and for no context', () => {
    expect(computeAppointmentPull(ctx('far'), 6, 0)).toBe(0);
    expect(computeAppointmentPull(ctx('waiting'), 6, 0)).toBe(0);
    expect(computeAppointmentPull(ctx('lost'), 6, 0)).toBe(0);
    expect(computeAppointmentPull(null, 6, 0)).toBe(0);
    expect(computeAppointmentPull(ctx('leaning'), undefined, 0)).toBe(0);
  });
});

describe('the pull — wired into scoreAndSelect', () => {
  const entry = (id: string, locationId: string): EncounterCacheEntry => ({
    templateId: id, locationId, sublocationId: null, sublocationTypeId: null,
    reachPrimary: 'iron' as ReachDomain, reachSecondary: 'gold' as ReachDomain,
    threatRating: 'moderate' as never, encounterType: 'combat' as never,
    motivations: ['mercy_ruthlessness'] as ValuePair[],
    requiresPresence: true, remotePenalty: 0, questPriority: 1.0, isQuestEncounter: false,
    totalTickCost: 3, successRewardEstimate: 2.0,
    stepCount: 1, stepDifficulties: [0.5], stepReaches: ['iron'] as ReachDomain[],
  });

  it('adds exactly W / (1 + dist) to each candidate — the second term on the relocation channel', () => {
    const graph = buildGraph();
    const candidates = [entry('t-far', 'loc-far'), entry('t-mid', 'loc-mid')];
    const ctx: AppointmentContext = {
      seed: seedWith(appointmentAt('loc-far', 100)),
      appointment: appointmentAt('loc-far', 100),
      slack: { slack: 44, travelTicks: 6, atPlace: false, placeHex: { col: 6, row: 0 } },
      leaveMargin: 6,
      regime: 'leaning',
    };
    const without = scoreAndSelect(candidates, 'actor-hero', 'loc-home', graph, 50);
    const withPull = scoreAndSelect(candidates, 'actor-hero', 'loc-home', graph, 50,
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, ctx);
    const scoreOf = (r: ReturnType<typeof scoreAndSelect>, id: string) =>
      r.rankedCandidates.find(c => c.entry.templateId === id)!;
    expect(scoreOf(withPull, 't-far').appointmentBonus).toBeCloseTo(APPOINTMENT_PULL_WEIGHT);
    expect(scoreOf(withPull, 't-mid').appointmentBonus).toBeCloseTo(APPOINTMENT_PULL_WEIGHT / 4);
    expect(scoreOf(withPull, 't-far').finalScore - scoreOf(without, 't-far').finalScore)
      .toBeCloseTo(APPOINTMENT_PULL_WEIGHT, 5);
    expect(scoreOf(without, 't-far').appointmentBonus).toBe(0);
  });
});

describe('the promise edge and the Event kind', () => {
  it('redeems (removes) an appointment favour, and ignores an ordinary one', () => {
    const graph = buildGraph();
    graph.addEdge({ id: 'f-appt', source: 'actor-hero', target: 'actor-stranger', type: 'owes_favor',
      properties: { grantedTick: 1, [APPOINTMENT_FAVOUR_PROP]: { seedId: 'seed-1', locationId: 'loc-far', dueTick: 100 } } });
    graph.addEdge({ id: 'f-plain', source: 'actor-hero', target: 'actor-stranger', type: 'owes_favor', properties: { grantedTick: 1 } });
    expect(isAppointmentFavour(graph.getEdge('f-appt'))).toBe(true);
    expect(isAppointmentFavour(graph.getEdge('f-plain'))).toBe(false);
    expect(redeemAppointmentFavour(graph, 'f-plain')).toBe(false);
    expect(graph.getEdge('f-plain')).toBeDefined();
    expect(redeemAppointmentFavour(graph, 'f-appt')).toBe(true);
    expect(graph.getEdge('f-appt')).toBeUndefined();
    expect(redeemAppointmentFavour(graph, undefined)).toBe(false);
  });
  it('breaks an appointment favour in place — the sheet keeps reading it', () => {
    const graph = buildGraph();
    graph.addEdge({ id: 'f-appt', source: 'actor-hero', target: 'actor-stranger', type: 'owes_favor',
      properties: { grantedTick: 1, [APPOINTMENT_FAVOUR_PROP]: { seedId: 'seed-1', locationId: 'loc-far', dueTick: 100 } } });
    expect(breakAppointmentFavour(graph, 'f-appt', 120)).toBe(true);
    const edge = graph.getEdge('f-appt')!;
    expect(edge.properties.broken).toBe(true);
    expect(edge.properties.brokenTick).toBe(120);
    expect(isAppointmentFavour(edge)).toBe(true);
  });
  it('writes an Event node with both edges, and fails soft on a duplicate', () => {
    const graph = buildGraph();
    const id = writeAppointmentEvent(graph, { kind: 'appointment_kept', agentId: 'actor-hero', locationId: 'loc-far', tick: 100, seedId: 'seed-1' })!;
    const node = graph.getNode(id)!;
    expect(node.type).toBe('event');
    expect(node.properties.eventType).toBe('appointment_kept');
    expect(graph.getOutgoingEdges('actor-hero', 'participated_in').some(e => e.target === id)).toBe(true);
    expect(graph.getOutgoingEdges(id, 'occurred_at')[0]?.target).toBe('loc-far');
    // Same seed, same tick: a duplicate id is logged, not thrown.
    expect(() => writeAppointmentEvent(graph, { kind: 'appointment_kept', agentId: 'actor-hero', locationId: 'loc-far', tick: 100, seedId: 'seed-1' })).not.toThrow();
  });
});

describe('describeAppointments — the readout every surface reads', () => {
  it('names the place, the party, the regime and the broken flag', () => {
    const graph = buildGraph();
    graph.addEdge({ id: 'f-appt', source: 'actor-hero', target: 'actor-stranger', type: 'owes_favor',
      properties: { grantedTick: 1, broken: true, [APPOINTMENT_FAVOUR_PROP]: { seedId: 'seed-1', locationId: 'loc-far', dueTick: 100 } } });
    const state = { graph, tick: 50, pendingEncounterSeeds: [seedWith(appointmentAt('loc-far', 100, { favourEdgeId: 'f-appt' }))] };
    const [row] = describeAppointments(state, () => NEUTRAL);
    expect(row.placeName).toBe('The Crossroads');
    expect(row.counterpartyName).toBe('The Stranger');
    expect(row.slack).toBe(computeAppointmentSlack(graph, 'actor-hero', appointmentAt('loc-far', 100), 50)!.slack);
    expect(row.slack!).toBeGreaterThan(APPOINTMENT_PULL_HORIZON_TICKS);
    expect(row.regime).toBe('far');
    expect(row.broken).toBe(true);
    expect(describeAppointments(state, () => NEUTRAL, 'actor-stranger')).toEqual([]);
  });
});
