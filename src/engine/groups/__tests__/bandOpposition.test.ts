/**
 * Band opposition — pairing and consequences (THR-731 PR 2).
 *
 * PR 1 put bands in the world; this is what makes meeting one cost something. The
 * tests lock the four decisions that separate a live contest from a dormant one:
 * who gets paired (and who deliberately does not), that a dissolved opponent
 * degrades to the uncontested path instead of blocking it, that both sides price a
 * step with company math, and that the consequences land where the plan says.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { UnifiedAction } from '../../../types/unifiedAction';
import {
  collectBandOppositions,
  findOpposingBand,
  synthesizeBandCounter,
  applyContestConsequences,
  contestedOutcomeFor,
  counterTemplateFor,
  resetBandCounterIds,
  BAND_COUNTER_TEMPLATES,
} from '../bandOpposition';
import { detectContestations } from '../../contestation';
import { getGroupCohesion } from '../groupQueries';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import {
  GROUP_COHESION_CONTEST_WON_DELTA,
  GROUP_COHESION_CONTEST_LOST_DELTA,
} from '../../../data/group-constants';

// ─── Fixture ────────────────────────────────────────────────────

function makeState(graph: WorldGraph, tick = 40): GameState {
  return { graph, tick, seed: 42, tickEvents: [] } as unknown as GameState;
}

function addLocation(graph: WorldGraph, id: string, col: number, row: number): void {
  graph.addNode({
    id, type: 'location', name: id,
    properties: { locationType: 'settlement', hexCol: col, hexRow: row },
  });
}

/**
 * A group standing at `locationId` with `size` living members.
 *
 * `bandRole` present ⇒ the node is a band (`isBandNode` keys on `groupType`
 * `faction_band` plus the role), absent ⇒ an ordinary company.
 */
function addGroup(
  graph: WorldGraph,
  id: string,
  locationId: string,
  size: number,
  opts: { bandRole?: string; bandFactionId?: string; cohesion?: number } = {},
): void {
  graph.addNode({
    id, type: 'actor', name: `Group ${id}`,
    properties: {
      actorType: 'group',
      groupType: opts.bandRole ? 'faction_band' : 'party',
      groupStatus: 'active',
      cohesion: opts.cohesion ?? 0.6,
      ...(opts.bandRole ? { bandRole: opts.bandRole } : {}),
      ...(opts.bandFactionId ? { bandFactionId: opts.bandFactionId } : {}),
    },
  });
  for (let i = 0; i < size; i++) {
    const memberId = `${id}.m${i}`;
    graph.addNode({
      id: memberId, type: 'actor', name: `${id} member ${i}`,
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: `mem.${memberId}`, source: memberId, target: id, type: 'member_of',
      properties: { role: i === 0 ? 'leader' : 'member', rank: 0, joinedTick: 0 },
    });
    graph.addEdge({
      id: `at.${memberId}`, source: memberId, target: locationId,
      type: 'located_at', properties: {},
    });
  }
  // Leadership is an edge, not a property — `getGroupLeader` reads `commanded_by`.
  graph.addEdge({
    id: `cmd.${id}`, source: id, target: `${id}.m0`,
    type: 'commanded_by', properties: {},
  });
  graph.updateNode(id, {
    properties: {
      ...graph.getNode(id)!.properties,
      roster: Array.from({ length: size }, (_, i) => `${id}.m${i}`),
    },
  });
}

function makeAction(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_1',
    actorId: 'co.m0',
    templateId: 'encounter.sunken_vault',
    targetId: 'loc.hall',
    scale: 'personal',
    source: 'agent',
    startTick: 30,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: false,
    stepOutcomes: [],
    ...overrides,
  } as UnifiedAction;
}

/** A world with one company and one foreign band standing on the same hex. */
function confrontationWorld(): { graph: WorldGraph; state: GameState } {
  const graph = new WorldGraph();
  addLocation(graph, 'loc.hall', 3, 3);
  addGroup(graph, 'co', 'loc.hall', 3);
  addGroup(graph, 'band', 'loc.hall', 3, { bandRole: 'defender', bandFactionId: 'f.knives' });
  return { graph, state: makeState(graph) };
}

// ─── Discovery ──────────────────────────────────────────────────

describe('findOpposingBand', () => {
  it('finds a foreign band sharing the company hex', () => {
    const { graph } = confrontationWorld();
    expect(findOpposingBand(graph, makeAction(), 'co')?.id).toBe('band');
  });

  it('resolves hex, not location node — a band in the yard still opposes one in the hall', () => {
    const graph = new WorldGraph();
    addLocation(graph, 'loc.hall', 3, 3);
    // Second location node, same hex coordinates.
    addLocation(graph, 'loc.yard', 3, 3);
    addGroup(graph, 'co', 'loc.hall', 3);
    addGroup(graph, 'band', 'loc.yard', 3, { bandRole: 'defender', bandFactionId: 'f.knives' });

    expect(findOpposingBand(graph, makeAction(), 'co')?.id).toBe('band');
  });

  it('ignores a band on a different hex', () => {
    const graph = new WorldGraph();
    addLocation(graph, 'loc.hall', 3, 3);
    addLocation(graph, 'loc.far', 9, 9);
    addGroup(graph, 'co', 'loc.hall', 3);
    addGroup(graph, 'band', 'loc.far', 3, { bandRole: 'defender', bandFactionId: 'f.knives' });

    expect(findOpposingBand(graph, makeAction(), 'co')).toBeUndefined();
  });

  it('honours a seeded opposingGroupId over colocation', () => {
    const { graph } = confrontationWorld();
    const action = makeAction({ opposingGroupId: 'band' });
    expect(findOpposingBand(graph, action, 'co')?.id).toBe('band');
  });

  it('degrades to uncontested when the seeded band has dissolved (fail-soft row 1)', () => {
    const { graph } = confrontationWorld();
    graph.updateNode('band', {
      properties: { ...graph.getNode('band')!.properties, groupStatus: 'disbanded' },
    });
    const action = makeAction({ opposingGroupId: 'band' });
    expect(findOpposingBand(graph, action, 'co')).toBeUndefined();
  });

  it('degrades to uncontested when the band emptied out', () => {
    const { graph } = confrontationWorld();
    for (let i = 0; i < 3; i++) {
      const m = graph.getNode(`band.m${i}`)!;
      graph.updateNode(m.id, { properties: { ...m.properties, deceased: true } });
    }
    expect(findOpposingBand(graph, makeAction(), 'co')).toBeUndefined();
  });

  it('does not set a faction band against its own faction band', () => {
    const graph = new WorldGraph();
    addLocation(graph, 'loc.hall', 3, 3);
    addGroup(graph, 'co', 'loc.hall', 3, { bandRole: 'defender', bandFactionId: 'f.knives' });
    addGroup(graph, 'band', 'loc.hall', 3, { bandRole: 'raider', bandFactionId: 'f.knives' });

    expect(findOpposingBand(graph, makeAction(), 'co')).toBeUndefined();
  });
});

// ─── Synthesis ──────────────────────────────────────────────────

describe('synthesizeBandCounter', () => {
  beforeEach(() => resetBandCounterIds());

  it('answers with the counter template for the band role', () => {
    const { graph } = confrontationWorld();
    const counter = synthesizeBandCounter(makeAction(), graph.getNode('band')!, 'co', graph)!;

    expect(counter.templateId).toBe(BAND_COUNTER_TEMPLATES.defender);
    expect(counter.counterToActionId).toBe('ua_1');
    expect(counter.opposingGroupId).toBe('co');
    // The actor is a person, never the positionless group node.
    expect(counter.actorId).toBe('band.m0');
    // Same target — the fight is over the same thing.
    expect(counter.targetId).toBe('loc.hall');
  });

  it('falls back to band.defend for an unrecognized role (fail-soft row 3)', () => {
    expect(counterTemplateFor('quartermaster')).toBe(BAND_COUNTER_TEMPLATES.defender);
    expect(counterTemplateFor('raider')).toBe(BAND_COUNTER_TEMPLATES.raider);
  });
});

describe('collectBandOppositions', () => {
  beforeEach(() => resetBandCounterIds());

  it('pairs a company action against a colocated band', () => {
    const { state } = confrontationWorld();
    const oppositions = collectBandOppositions([makeAction()], state);

    expect(oppositions).toHaveLength(1);
    expect(oppositions[0].initiatorGroupId).toBe('co');
    expect(oppositions[0].bandGroupId).toBe('band');
  });

  it('never lets a band fight two companies in one tick', () => {
    const { graph, state } = confrontationWorld();
    addGroup(graph, 'co2', 'loc.hall', 3);

    const oppositions = collectBandOppositions(
      [makeAction(), makeAction({ actionId: 'ua_2', actorId: 'co2.m0' })],
      state,
    );

    expect(oppositions).toHaveLength(1);
  });

  it('does not spawn a counter for a counter', () => {
    const { state } = confrontationWorld();
    const counter = makeAction({ actionId: 'ua_c', actorId: 'band.m0', counterToActionId: 'ua_1' });
    expect(collectBandOppositions([counter], state)).toHaveLength(0);
  });

  it('leaves an ungrouped actor uncontested', () => {
    const { graph, state } = confrontationWorld();
    graph.addNode({ id: 'solo', type: 'actor', name: 'Solo', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'at.solo', source: 'solo', target: 'loc.hall', type: 'located_at', properties: {} });

    expect(collectBandOppositions([makeAction({ actorId: 'solo' })], state)).toHaveLength(0);
  });
});

// ─── Detection ──────────────────────────────────────────────────

describe('detectContestations — group-opposition pass', () => {
  it('emits a pair with the initiator attacking and the band defending', () => {
    const pairs = detectContestations([], [], [{
      initiatorActionId: 'ua_1',
      counterActionId: 'ua_band_counter_1',
      targetId: 'loc.hall',
      initiatorGroupId: 'co',
      bandGroupId: 'band',
    }]);

    expect(pairs).toHaveLength(1);
    expect(pairs[0].attackerActionId).toBe('ua_1');
    expect(pairs[0].defenderActionId).toBe('ua_band_counter_1');
    expect(pairs[0].groupOpposition).toEqual({
      initiatorGroupId: 'co', bandGroupId: 'band',
    });
  });

  it('gives an authored contestsWith pair the stronger claim on a contested action', () => {
    const a = makeAction({ actionId: 'ua_a', templateId: 't.a' });
    const b = makeAction({ actionId: 'ua_b', templateId: 't.b' });
    const templates = [
      { id: 't.a', contestsWith: ['t.b'], steps: [], scale: 'personal' },
      { id: 't.b', steps: [], scale: 'personal' },
    ] as never;

    // The group pass claims ua_a first, so the template contest cannot re-pair it.
    const pairs = detectContestations([a, b], templates, [{
      initiatorActionId: 'ua_a',
      counterActionId: 'ua_band_counter_9',
      targetId: 'loc.hall',
      initiatorGroupId: 'co',
      bandGroupId: 'band',
    }]);

    expect(pairs).toHaveLength(1);
    expect(pairs[0].defenderActionId).toBe('ua_band_counter_9');
  });

  it('leaves the ordinary contestsWith path untouched when no group opposition exists', () => {
    expect(detectContestations([], [])).toEqual([]);
  });
});

// ─── Consequences ───────────────────────────────────────────────

describe('applyContestConsequences', () => {
  beforeEach(() => { clearTraces(); enableTracing(); resetBandCounterIds(); });
  afterEach(() => disableTracing());

  function opposition(state: GameState) {
    const action = makeAction();
    const counter = synthesizeBandCounter(action, state.graph.getNode('band')!, 'co', state.graph)!;
    return { initiator: action, counter, initiatorGroupId: 'co', bandGroupId: 'band' };
  }

  it('swings cohesion toward the winner and away from the loser', () => {
    const { graph, state } = confrontationWorld();
    const before = { co: getGroupCohesion(graph.getNode('co')), band: getGroupCohesion(graph.getNode('band')) };

    // rng high enough to skip the casualty roll.
    const result = applyContestConsequences(state, opposition(state), 'success', 'failure', () => 0.99)!;

    expect(result.winnerGroupId).toBe('co');
    expect(getGroupCohesion(graph.getNode('co'))).toBeCloseTo(before.co + GROUP_COHESION_CONTEST_WON_DELTA, 5);
    expect(getGroupCohesion(graph.getNode('band'))).toBeCloseTo(before.band + GROUP_COHESION_CONTEST_LOST_DELTA, 5);
    expect(result.casualtyId).toBeUndefined();
  });

  it('kills a losing-side member on a decisive loss when the roll lands', () => {
    const { graph, state } = confrontationWorld();
    const result = applyContestConsequences(state, opposition(state), 'success', 'failure', () => 0)!;

    expect(result.casualtyId).toBeDefined();
    expect(graph.getNode(result.casualtyId!)!.properties.deceased).toBe(true);
    // Never the leader while anyone else stands — a headless band is a different story.
    expect(result.casualtyId).not.toBe('band.m0');
  });

  it('writes a standing rivalry both ways, once', () => {
    const { graph, state } = confrontationWorld();
    const opp = opposition(state);

    const first = applyContestConsequences(state, opp, 'success', 'failure', () => 0.99)!;
    expect(first.grudgeWritten).toBe(true);
    expect(graph.getOutgoingEdges('co', 'hostile_to').map(e => e.target)).toContain('band');
    expect(graph.getOutgoingEdges('band', 'hostile_to').map(e => e.target)).toContain('co');

    const second = applyContestConsequences(state, opp, 'success', 'failure', () => 0.99)!;
    expect(second.grudgeWritten).toBe(false);
  });

  it('mutual failure costs no cohesion and takes no life, but still makes enemies', () => {
    const { graph, state } = confrontationWorld();
    const before = getGroupCohesion(graph.getNode('co'));

    const result = applyContestConsequences(state, opposition(state), 'failure', 'failure', () => 0);

    expect(result).toBeUndefined();
    expect(getGroupCohesion(graph.getNode('co'))).toBe(before);
    expect(graph.getOutgoingEdges('co', 'hostile_to').map(e => e.target)).toContain('band');
    expect(graph.getNode('band.m1')!.properties.deceased).toBeUndefined();
  });

  it('emits one group_contested trace carrying both sides and the verdict', () => {
    const { state } = confrontationWorld();
    applyContestConsequences(state, opposition(state), 'failure', 'success', () => 0.99);

    const traces = getTraces().filter(t => t.category === 'group_contested');
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({
      initiatorGroupId: 'co',
      bandGroupId: 'band',
      verdict: 'band_won',
      winnerGroupId: 'band',
      loserGroupId: 'co',
    });
  });
});

// ─── Outcome band ───────────────────────────────────────────────

describe('contestedOutcomeFor', () => {
  it('gives the contested outcome band its first production producer', () => {
    // `contested_won`/`contested_lost` shipped with TB-044, carried display strings
    // in ChapterView and a playerReceipts severity mapping — and had zero producers
    // until group contests. Losing a fight must not read as merely failing.
    expect(contestedOutcomeFor('success')).toBe('contested_won');
    expect(contestedOutcomeFor('failure')).toBe('contested_lost');
  });
});
