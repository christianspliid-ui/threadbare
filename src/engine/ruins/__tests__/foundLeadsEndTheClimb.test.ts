/**
 * A lead ends where the site's road ends (THR-1702,
 * `Docs/plans/2026-10-05-thr-1702-found-leads-end-the-climb.md`).
 *
 *   - `delveRoadOf` answers now / later / never for every site the visit admits.
 *   - A `located` lead on a never-site is *spent*: the lead pass stops pulling it, a
 *     survey stops refreshing it (`already_found`), and `phaseClueDecay` turns it into a
 *     known place (`knows_of.foundTick`, sheet "found it") and emits `ruins.lead_found`.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { delveRoadOf } from '../delveVariant';
import { isLeadSpent } from '../leadVisit';
import { phaseClueDecay } from '../clueLifecycle';
import { recordPlaceFound } from '../../strategicGraphOps';
import { heldLeadRuinIds } from '../../strategicActionCandidates';
import { collectKnownPlaces, KNOWN_PLACE_FOUND_LINE } from '../../agentDetail';
import { getUndertakingObjectType } from '../../../data/undertaking-objects';
import { RUINED_SETTLEMENT_DELVE_DECAY_TICKS } from '../../../data/strategic-action-constants';
import { CLUE_DECAY_CHECK_INTERVAL } from '../constants';
import { clearTraces, enableTracing, getTraces } from '../../traceBuffer';
import type { GameState } from '../../../types/gameState';
import type { CluePrecision } from '../../../types/knowledge';

const ACTOR = 'actor_holder';
const WONDER = 'site_wonder';
const ELDER = 'site_elder';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ACTOR, name: 'Holder', type: 'actor', properties: { actorType: 'individual' } });
  graph.addNode({
    id: WONDER, name: 'Luminous Anvil Bower', type: 'location',
    properties: { locationSubtype: 'glowcap_hollow', hexCol: 10, hexRow: 10 },
  });
  graph.addNode({
    id: ELDER, name: 'The Sunken Vault', type: 'location',
    properties: { locationSubtype: 'elder_ruin', locationType: 'elder_ruin', hexCol: 20, hexRow: 20, ruinMagnitude: 0.5 },
  });
  return graph;
}

function holdLead(graph: WorldGraph, siteId: string, precision: CluePrecision, tick = 10): string {
  const id = `lead_${siteId}_${tick}`;
  graph.addEdge({
    id, source: ACTOR, target: siteId, type: 'knows_clue_of',
    properties: { magnitude: 0.5, precision, source: 'tavern_rumor', discoveredTick: tick, consumed: false },
  });
  return id;
}

function stateAt(graph: WorldGraph, tick: number): GameState {
  return { graph, tick, seed: 42 } as unknown as GameState;
}

function survey(graph: WorldGraph, siteId: string, tick: number): void {
  const type = getUndertakingObjectType('location')!;
  const observe = type.verbs.observe as (ctx: unknown) => unknown;
  observe({
    state: { graph, tick } as unknown as GameState,
    graph, actorId: ACTOR, handle: { kind: 'node', nodeId: siteId }, tick, outcome: 'success',
  });
}

const traces = () => getTraces() as unknown as ReadonlyArray<Record<string, unknown>>;

describe('delveRoadOf — now / later / never', () => {
  const tick = 100;
  it.each([
    ['an elder ruin', { locationType: 'elder_ruin' }, 'now'],
    ['a fresh mortal ruin', { locationSubtype: 'ruins', ruinedTick: tick - 1 }, 'later'],
    ['a settled mortal ruin', { locationSubtype: 'ruins', ruinedTick: tick - RUINED_SETTLEMENT_DELVE_DECAY_TICKS }, 'now'],
    ['a worldgen ruins with no ruinedTick', { locationSubtype: 'ruins' }, 'never'],
    ['a shipwreck', { locationSubtype: 'shipwreck' }, 'never'],
    ['a healing spring', { locationSubtype: 'healing_spring' }, 'never'],
  ] as const)('%s → %s', (_label, props, road) => {
    expect(delveRoadOf(props as Record<string, unknown>, tick)).toBe(road);
  });
});

describe('isLeadSpent', () => {
  it('is true only for an unconsumed located lead on a never-site', () => {
    const graph = world();
    const spent = holdLead(graph, WONDER, 'located');
    const elder = holdLead(graph, ELDER, 'located');
    expect(isLeadSpent(graph, graph.getEdge(spent)!, 50)).toBe(true);
    expect(isLeadSpent(graph, graph.getEdge(elder)!, 50)).toBe(false);

    graph.getEdge(spent)!.properties.consumed = true;
    expect(isLeadSpent(graph, graph.getEdge(spent)!, 50)).toBe(false);
  });

  it('a narrowed lead on a wonder still has rungs to climb', () => {
    const graph = world();
    const id = holdLead(graph, WONDER, 'narrowed');
    expect(isLeadSpent(graph, graph.getEdge(id)!, 50)).toBe(false);
  });

  it('a lead whose site is gone is left to decay, not spent', () => {
    const graph = world();
    const id = holdLead(graph, WONDER, 'located');
    graph.removeNode(WONDER);
    const edge = { id, source: ACTOR, target: WONDER, type: 'knows_clue_of' as const, properties: { precision: 'located' } };
    expect(isLeadSpent(graph, edge, 50)).toBe(false);
  });
});

describe('the lead pass leaves a spent lead out', () => {
  it('drops a located wonder lead and keeps a narrowed lead on the same wonder', () => {
    const spentWorld = world();
    holdLead(spentWorld, WONDER, 'located');
    holdLead(spentWorld, ELDER, 'narrowed', 5);
    expect(heldLeadRuinIds(spentWorld, ACTOR, 50)).toEqual([ELDER]);

    const liveWorld = world();
    holdLead(liveWorld, WONDER, 'narrowed');
    expect(heldLeadRuinIds(liveWorld, ACTOR, 50)).toEqual([WONDER]);
  });
});

describe('the survey reader refuses already_found', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });

  it('a spent lead is not refreshed', () => {
    const graph = world();
    const id = holdLead(graph, WONDER, 'located', 10);
    survey(graph, WONDER, 40);

    expect(graph.getEdge(id)!.properties.discoveredTick).toBe(10);
    expect(traces().some(t => t.category === 'ruins.clue_sharpened')).toBe(false);
    const reader = traces().find(t => t.category === 'undertaking_reader' && t.reader === 'clue');
    expect(reader?.refused).toBe('already_found');
  });

  it('a place already found writes no new lead', () => {
    const graph = world();
    expect(recordPlaceFound(graph, ACTOR, WONDER, 30).success).toBe(true);
    survey(graph, WONDER, 40);

    expect(graph.getOutgoingEdges(ACTOR, 'knows_clue_of')).toHaveLength(0);
    const reader = traces().find(t => t.category === 'undertaking_reader' && t.reader === 'clue');
    expect(reader?.refused).toBe('already_found');
  });

  it('a found elder ruin still yields a lead — its road is open', () => {
    const graph = world();
    recordPlaceFound(graph, ACTOR, ELDER, 30);
    survey(graph, ELDER, 40);
    expect(graph.getOutgoingEdges(ACTOR, 'knows_clue_of').filter(e => e.target === ELDER)).toHaveLength(1);
  });
});

describe('phaseClueDecay turns a spent lead into a known place', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  const tick = CLUE_DECAY_CHECK_INTERVAL * 5;

  it('creates knows_of.foundTick, removes the lead, emits ruins.lead_found', () => {
    const graph = world();
    const id = holdLead(graph, WONDER, 'located', 10);
    phaseClueDecay(stateAt(graph, tick));

    expect(graph.getEdge(id)).toBeUndefined();
    const known = graph.getOutgoingEdges(ACTOR, 'knows_of').filter(e => e.target === WONDER);
    expect(known).toHaveLength(1);
    expect(known[0].properties).toMatchObject({ fromSurvey: true, convergedTick: tick, foundTick: tick });

    const found = traces().filter(t => t.category === 'ruins.lead_found');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      knowerId: ACTOR, targetRuinId: WONDER, siteClass: 'wonder', knowsOf: 'created', heldTicks: tick - 10,
    });
  });

  it('stamps an existing knows_of without touching its other properties', () => {
    const graph = world();
    graph.addEdge({
      id: 'known_before', source: ACTOR, target: WONDER, type: 'knows_of',
      properties: { fromClue: true, convergedTick: 3 },
    });
    holdLead(graph, WONDER, 'located', 10);
    phaseClueDecay(stateAt(graph, tick));

    expect(graph.getEdge('known_before')!.properties).toEqual({ fromClue: true, convergedTick: 3, foundTick: tick });
    expect(graph.getOutgoingEdges(ACTOR, 'knows_of')).toHaveLength(1);
    expect(traces().find(t => t.category === 'ruins.lead_found')).toMatchObject({ knowsOf: 'stamped' });
  });

  it('leaves a located elder-ruin lead alone — the delve can still take it', () => {
    const graph = world();
    const id = holdLead(graph, ELDER, 'located', tick - 5);
    phaseClueDecay(stateAt(graph, tick));
    expect(graph.getEdge(id)).toBeDefined();
    expect(traces().some(t => t.category === 'ruins.lead_found')).toBe(false);
  });

  it('settles a spent lead even while a visit is pending', () => {
    const graph = world();
    const id = holdLead(graph, WONDER, 'located', 10);
    graph.getEdge(id)!.properties.pendingVisitDueTick = tick + 20;
    phaseClueDecay(stateAt(graph, tick));
    expect(graph.getEdge(id)).toBeUndefined();
  });
});

describe('a later lead on a place already found does not restart the climb', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });

  it('is not pulled, not refreshed by a survey, and the sweep removes it with no second find', () => {
    const graph = world();
    holdLead(graph, WONDER, 'located', 10);
    phaseClueDecay(stateAt(graph, CLUE_DECAY_CHECK_INTERVAL * 2));
    expect(traces().filter(t => t.category === 'ruins.lead_found')).toHaveLength(1);

    // A rumour hands the same mortal a fresh lead on the place they already found.
    const rumour = holdLead(graph, WONDER, 'vague', 30);
    expect(heldLeadRuinIds(graph, ACTOR, 35)).toEqual([]);

    survey(graph, WONDER, 35);
    expect(graph.getEdge(rumour)!.properties.precision).toBe('vague');
    expect(graph.getEdge(rumour)!.properties.discoveredTick).toBe(30);
    const reader = traces().filter(t => t.category === 'undertaking_reader' && t.reader === 'clue').at(-1);
    expect(reader?.refused).toBe('already_found');

    phaseClueDecay(stateAt(graph, CLUE_DECAY_CHECK_INTERVAL * 4));
    expect(graph.getEdge(rumour)).toBeUndefined();
    expect(traces().filter(t => t.category === 'ruins.lead_found')).toHaveLength(1);
    expect(collectKnownPlaces(graph, ACTOR)[0].lead).toBe(KNOWN_PLACE_FOUND_LINE);
  });
});

describe('the sheet names a found place "found it"', () => {
  it('reads knows_of.foundTick; a live lead on the place still wins', () => {
    const graph = world();
    recordPlaceFound(graph, ACTOR, WONDER, 30);
    expect(collectKnownPlaces(graph, ACTOR)).toEqual([
      { id: WONDER, name: 'Luminous Anvil Bower', lead: KNOWN_PLACE_FOUND_LINE },
    ]);
    expect(KNOWN_PLACE_FOUND_LINE).toBe('found it');

    holdLead(graph, WONDER, 'narrowed', 40);
    expect(collectKnownPlaces(graph, ACTOR)[0].lead).toBe('has a lead on it');
  });
});
