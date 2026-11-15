/**
 * THR-2234 — the First's Apotheosis comes after the Ordeal: once per journey, between
 * the Ordeal and the Return. Other threaded mortals keep the tier-4 hold + re-offer rule.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { seedApotheosisEncounters, firstApotheosisStep, isFirstApotheosisPending } from '../aspects';
import { phaseJourneyBeat } from '../journeyEngine';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { BeatOutcome, StateSnapshot } from '../../types/journeyEngine';
import type { CampbellianPhase, ThreadEdgeProperties } from '../../types/influence';
import type { PendingEncounterSeed } from '../../types/unifiedAction';
import {
  ASPECT_ELIGIBILITY_TICKS,
  ASPECT_REOFFER_COOLDOWN_TICKS,
  APOTHEOSIS_ENCOUNTER_TEMPLATE_ID,
  FIRST_RETURN_APOTHEOSIS_WAIT_DOOM_CAP,
} from '../../data/aspect-content';
import { JOURNEY_BEAT_TEMPLATES } from '../../data/journey-content';

const ASC = 'asc.player';
const FIRST = 'actor.first';
const OTHER = 'actor.other';
const FIRST_THREAD = `thread_${ASC}_${FIRST}`;
const OTHER_THREAD = `thread_${ASC}_${OTHER}`;

const SNAPSHOT: StateSnapshot = {
  power: { primaryReachLevel: 20, totalTraits: 3, tierLevel: 4 },
  influence: { factionsLed: 0, locationsControlled: 0, agreementsForged: 0, enemiesMade: 0 },
  relationship: { threadTier: 4, interventionRatio: 0, attentionMode: 'pause' },
  ambition: { activeAmbitions: 1, completedMilestones: 0, failedAttempts: 0 },
};

function beat(phase: CampbellianPhase, tick: number): BeatOutcome {
  return { phase, tick, templateId: 't', variantKey: 'v', playerChoiceId: 'c', stateSnapshot: SNAPSHOT };
}

function baseThread(overrides: Partial<ThreadEdgeProperties> = {}): ThreadEdgeProperties {
  return {
    tier: 4,
    ticksAtCurrentTier: 0,
    establishedTick: 0,
    totalEssenceSpent: 0,
    maintenanceCurrent: true,
    readBackstoryTier: 0,
    attentionMode: 'pause',
    ...overrides,
  } as ThreadEdgeProperties;
}

function makeWorld(firstOverrides: Partial<ThreadEdgeProperties> = {}, withOther = false): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: FIRST,
    type: 'actor',
    name: 'Kael Thornweaver',
    properties: { actorType: 'individual', primaryReach: 'iron', domainCapabilities: { iron: 30 } },
  });
  graph.addNode({ id: 'loc_1', type: 'location', name: 'Test Village', properties: {} });
  graph.addEdge({ id: `${FIRST}_at_loc_1`, source: FIRST, target: 'loc_1', type: 'located_at', properties: {} });
  graph.addEdge({
    id: FIRST_THREAD,
    source: ASC,
    target: FIRST,
    type: 'thread',
    properties: baseThread({ courtPosition: 'the_first', storyPhase: 'call', beatHistory: [], ...firstOverrides }) as unknown as Record<string, unknown>,
  });
  if (withOther) {
    graph.addNode({ id: OTHER, type: 'actor', name: 'Mira Ashgrove', properties: { actorType: 'individual' } });
    graph.addEdge({ id: OTHER_THREAD, source: ASC, target: OTHER, type: 'thread', properties: baseThread() as unknown as Record<string, unknown> });
  }
  return graph;
}

function props(graph: WorldGraph, id: string): ThreadEdgeProperties {
  return graph.getEdge(id)!.properties as unknown as ThreadEdgeProperties;
}

function setFirst(graph: WorldGraph, patch: Partial<ThreadEdgeProperties>): void {
  Object.assign(graph.getEdge(FIRST_THREAD)!.properties, patch);
}

function seedState(graph: WorldGraph, tick: number, seeds: PendingEncounterSeed[] = [], actions: unknown[] = []): GameState {
  return { ascendantId: ASC, graph, tick, tickEvents: [], pendingEncounterSeeds: seeds, unifiedActions: actions } as unknown as GameState;
}

/** One seeding tick; returns which mortals got a premonition / an offer. */
function seedTick(graph: WorldGraph, tick: number) {
  const patch = seedApotheosisEncounters(seedState(graph, tick), tick);
  return {
    premonitions: (patch.tickEvents ?? []).map(e => e.actorId),
    offers: (patch.pendingEncounterSeeds ?? []).map(s => s.targetAgentId),
  };
}

describe("THR-2234 — the First's Apotheosis follows the Ordeal", () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { disableTracing(); });

  it('holding tier 4 for hundreds of ticks offers the First nothing before the Ordeal', () => {
    const graph = makeWorld({ storyPhase: 'road_of_trials', beatHistory: [beat('call', 10), beat('road_of_trials', 100)] });
    for (let tick = 0; tick < 500; tick++) {
      setFirst(graph, { ticksAtCurrentTier: tick });
      const r = seedTick(graph, tick);
      expect(r.offers).toEqual([]);
      expect(r.premonitions).toEqual([]);
    }
  });

  it('warns when the Crisis is answered, offers once after the Ordeal, and never again', () => {
    const graph = makeWorld({ storyPhase: 'crisis', beatHistory: [beat('call', 10), beat('crisis', 400)] });
    const premonitionTicks: number[] = [];
    const offerTicks: number[] = [];
    const ORDEAL_AT = 550;
    for (let tick = 401; tick < 1100; tick++) {
      setFirst(graph, { ticksAtCurrentTier: tick });
      if (tick === ORDEAL_AT) setFirst(graph, { storyPhase: 'ordeal', beatHistory: [...props(graph, FIRST_THREAD).beatHistory!, beat('ordeal', ORDEAL_AT)] });
      const r = seedTick(graph, tick);
      if (r.premonitions.includes(FIRST)) premonitionTicks.push(tick);
      if (r.offers.includes(FIRST)) offerTicks.push(tick);
    }
    expect(premonitionTicks).toEqual([401]);
    expect(offerTicks).toEqual([ORDEAL_AT]);
    expect(props(graph, FIRST_THREAD).apotheosisOfferedForJourney).toBe(true);
    expect(getTraces().filter(t => t.category === 'apotheosis.first_offer')).toHaveLength(1);
  });

  it('a First threaded after the Crisis is warned on the Ordeal tick and offered the next tick', () => {
    const graph = makeWorld({ storyPhase: 'ordeal', beatHistory: [beat('ordeal', 600)] });
    const first = seedTick(graph, 601);
    expect(first.premonitions).toEqual([FIRST]);
    expect(first.offers).toEqual([]);
    const second = seedTick(graph, 602);
    expect(second.offers).toEqual([FIRST]);
  });

  it('a second threaded tier-4 mortal is still offered at the hold and re-offered after the cooldown', () => {
    const graph = makeWorld({ storyPhase: 'road_of_trials', beatHistory: [beat('call', 1)] }, true);
    const otherOffers: number[] = [];
    for (let tick = 0; tick < ASPECT_ELIGIBILITY_TICKS + 2 * ASPECT_REOFFER_COOLDOWN_TICKS + 5; tick++) {
      Object.assign(graph.getEdge(OTHER_THREAD)!.properties, { ticksAtCurrentTier: tick });
      setFirst(graph, { ticksAtCurrentTier: tick });
      const r = seedTick(graph, tick);
      if (r.offers.includes(OTHER)) otherOffers.push(tick);
      expect(r.offers).not.toContain(FIRST);
    }
    expect(otherOffers).toEqual([
      ASPECT_ELIGIBILITY_TICKS,
      ASPECT_ELIGIBILITY_TICKS + ASPECT_REOFFER_COOLDOWN_TICKS,
      ASPECT_ELIGIBILITY_TICKS + 2 * ASPECT_REOFFER_COOLDOWN_TICKS,
    ]);
  });

  it('a First below tier 4 when the Ordeal is answered is never offered, and the Return still fires', () => {
    const graph = makeWorld({ tier: 3, storyPhase: 'ordeal', beatHistory: [beat('crisis', 400), beat('ordeal', 600)] });
    expect(firstApotheosisStep(props(graph, FIRST_THREAD))).toBe('pass');
    expect(seedTick(graph, 601).offers).toEqual([]);
    expect(props(graph, FIRST_THREAD).apotheosisPassedForJourney).toBe(true);
    // Promoted to tier 4 later: still no Apotheosis on this journey.
    setFirst(graph, { tier: 4, ticksAtCurrentTier: 500 });
    for (let tick = 602; tick < 900; tick++) {
      const r = seedTick(graph, tick);
      expect(r.offers).toEqual([]);
    }
    const ret = journeyTick(graph, 0.85);
    expect(returnFired(ret)).toBe(true);
  });

  it('a First made dormant mid-journey (no Return) falls back to the ordinary hold-and-cooldown rule', () => {
    const graph = makeWorld({ courtPosition: 'dormant', storyPhase: 'road_of_trials', beatHistory: [beat('call', 10)] });
    const offers: number[] = [];
    for (let tick = 0; tick <= ASPECT_ELIGIBILITY_TICKS; tick++) {
      setFirst(graph, { ticksAtCurrentTier: tick });
      if (seedTick(graph, tick).offers.includes(FIRST)) offers.push(tick);
    }
    expect(offers).toEqual([ASPECT_ELIGIBILITY_TICKS]);
  });

  it('after the Return, a former First is not offered under the old rule', () => {
    const graph = makeWorld({ courtPosition: 'retinue', storyPhase: 'return', returnEnding: 'loyal_ascension', beatHistory: [beat('ordeal', 600)] });
    for (let tick = 700; tick < 1000; tick++) {
      setFirst(graph, { ticksAtCurrentTier: tick });
      expect(seedTick(graph, tick).offers).toEqual([]);
    }
  });
});

// ─── The Return waits ─────────────────────────────────────────────────

const TOTAL = 1000;

function journeyTick(graph: WorldGraph, progress: number, seeds: PendingEncounterSeed[] = [], actions: unknown[] = []) {
  const currentTick = Math.round(progress * TOTAL);
  return phaseJourneyBeat({
    graph,
    ascendantId: ASC,
    doomClock: { currentTick, totalTicks: TOTAL, progress: currentTick / TOTAL, tickModifier: 1, lastStep: 1 },
    tick: currentTick,
    seed: 42,
    tickEvents: [],
    pendingEncounterSeeds: seeds,
    unifiedActions: actions,
    pendingVignettes: undefined,
  } as unknown as GameState, JOURNEY_BEAT_TEMPLATES);
}

function returnFired(patch: Partial<GameState>): boolean {
  return (patch.pendingVignettes ?? []).some(v => v.data.phase === 'return');
}

const SEED: PendingEncounterSeed = {
  seedId: 'apotheosis_seed', sourceEncounterId: 'system.apotheosis_eligibility', sourceReactionId: 'eligibility',
  templateId: APOTHEOSIS_ENCOUNTER_TEMPLATE_ID, targetAgentId: FIRST, eligibleAfterTick: 0, priority: 1.5,
  seedLabel: 'x', plantedTick: 0,
} as PendingEncounterSeed;

describe('THR-2234 — the Return waits for the Apotheosis', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { disableTracing(); });

  function offeredWorld() {
    return makeWorld({
      storyPhase: 'ordeal',
      beatHistory: [beat('crisis', 400), beat('ordeal', 600)],
      apotheosisOfferedForJourney: true,
      apotheosisOfferedTick: 610,
      apotheosisPremonitionTick: 401,
    });
  }

  it('does not fire while the Apotheosis is seeded or active, and fires the tick after it resolves', () => {
    const graph = offeredWorld();
    expect(returnFired(journeyTick(graph, 0.82, [SEED]))).toBe(false);
    const active = { id: 'ua_apo', templateId: APOTHEOSIS_ENCOUNTER_TEMPLATE_ID, actorId: FIRST, resolved: false };
    expect(returnFired(journeyTick(graph, 0.85, [], [active]))).toBe(false);
    expect(getTraces().filter(t => t.category === 'journey.return_waits').length).toBe(2);
    expect(returnFired(journeyTick(graph, 0.86, [], [{ ...active, resolved: true }]))).toBe(true);
  });

  it('waits while the offer is due but not yet seeded (Ordeal answered at tier 4)', () => {
    const graph = makeWorld({ storyPhase: 'ordeal', beatHistory: [beat('crisis', 400), beat('ordeal', 600)], apotheosisPremonitionTick: 401 });
    expect(isFirstApotheosisPending(seedState(graph, 800), graph.getEdge(FIRST_THREAD)!)).toBe(true);
    expect(returnFired(journeyTick(graph, 0.81))).toBe(false);
  });

  it('fires at the Doom cap regardless of an unresolved Apotheosis', () => {
    const graph = offeredWorld();
    const active = { id: 'ua_apo', templateId: APOTHEOSIS_ENCOUNTER_TEMPLATE_ID, actorId: FIRST, resolved: false };
    expect(returnFired(journeyTick(graph, FIRST_RETURN_APOTHEOSIS_WAIT_DOOM_CAP - 0.01, [], [active]))).toBe(false);
    expect(returnFired(journeyTick(graph, FIRST_RETURN_APOTHEOSIS_WAIT_DOOM_CAP, [], [active]))).toBe(true);
  });
});
