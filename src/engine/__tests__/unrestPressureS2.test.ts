/**
 * THR-1957 — hunger and unrest S2: a town on the edge turns to a better lord, a town
 * at the rising line throws off its holder, the gated popup, the chronicle lines, the
 * Fortunes On the edge forms and the Trouble lens Hunger mark.
 *
 * Plan: Docs/plans/2026-10-16-thr-1934-hunger-and-unrest.md § Engine 9–10, § Done when (S2).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseUnrest } from '../phaseUnrest';
import {
  buildTownView,
  defectionChoice,
  settlementHolders,
  townStanding,
  LAST_TURN_TICK_PROP,
  SIEGED_BY_PROP,
} from '../unrestPressure/defection';
import { applyRising, pickFounder, townResidents } from '../unrestPressure/rising';
import { godWatchesTown, WAS_ON_THE_EDGE_PROP } from '../unrestPressure/turns';
import { describeTownView } from '../unrestPressure/describe';
import { buildCrownWorld } from '../crown/eligibility';
import { residesIn, splinterFaction } from '../factionSplinter';
import { isEnemyFaction } from '../warAims/enemy';
import { fortunesSentence } from '../../data/fortunes-prose';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import { LOCATION_TRAIT_IDS, ON_THE_EDGE_ENTER, ON_THE_EDGE_RELEASE } from '../../data/location-trait-constants';
import { LOCATION_TRAIT_RULES } from '../phaseLocationTraits';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { ECONOMIC_CHRONICLE_TEMPLATES, ECONOMIC_CHRONICLE_SIGNIFICANCE } from '../../data/economic-chronicle-content';
import {
  DEFECTION_GRUDGE_SENTIMENT,
  DEFECTION_RELIEF,
  RISING_RELIEF,
  TOWN_TURN_COOLDOWN_DAYS,
} from '../../data/unrest-pressure-constants';
import { MEANS_BAND_PROP } from '../factionPurse';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';

const FED_GRAIN = { grain: { resourceId: 'grain', quantity: 20, stockTier: 'adequate' } };
const DAY = TICKS_PER_DAY * 10; // a day boundary (tick % 12 === 0)

function addTown(graph: WorldGraph, id: string, name: string, col: number, props: Record<string, unknown> = {}): GraphNode {
  graph.addNode({
    id, type: 'location', name,
    properties: { locationSubtype: 'town', prosperity: 40, populationHealth: 80, unrest: 0, hexCol: col, hexRow: 0, resources: FED_GRAIN, ...props },
  });
  return graph.getNode(id)!;
}

function addFaction(graph: WorldGraph, id: string, name: string, props: Record<string, unknown> = {}): void {
  graph.addNode({ id, type: 'actor', name, properties: { actorType: 'faction', factionType: 'political', ...props } });
}

function control(graph: WorldGraph, factionId: string, townId: string): void {
  graph.addEdge({ id: `ctl_${factionId}_${townId}`, source: factionId, target: townId, type: 'controls', properties: { establishedTick: 0 } });
}

function addTrait(graph: WorldGraph, locId: string, traitId: string): void {
  if (!graph.getNode(traitId)) graph.addNode({ id: traitId, type: 'trait', name: traitId, properties: {} });
  graph.addEdge({ id: `ht_${locId}_${traitId}`, source: locId, target: traitId, type: 'has_trait', properties: {} });
}

function addMortal(graph: WorldGraph, id: string, homeId: string, arrived: number, factionId?: string, rank = 0.2): void {
  graph.addNode({
    id, type: 'actor', name: id,
    properties: { actorType: 'individual', residencePositionId: homeId, residenceArrivedTick: arrived },
  });
  graph.addEdge({ id: `la_${id}`, source: id, target: homeId, type: 'located_at', properties: {} });
  if (factionId) {
    graph.addEdge({ id: `mo_${id}_${factionId}`, source: id, target: factionId, type: 'member_of', properties: { reputation: 0.6, rank, role: 'member', joinedTick: 0 } });
  }
}

function state(graph: WorldGraph, tick: number, extra: Partial<GameState> = {}): GameState {
  return {
    tick, graph, seed: 1, pendingEncounterSeeds: [], chronicleEntries: [], tickEvents: [],
    ascendantId: 'asc', dynamicFactionDefinitions: {}, ...extra,
  } as unknown as GameState;
}

/**
 * Ferris (held by a broke House Ashfold) on the edge; Saltmarch Hold, fed and solvent,
 * holds Millbrook three hexes away and keeps a hall in Ferris.
 */
function defectionWorld(opts: { holderBroke?: boolean; hall?: boolean } = {}) {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
  addFaction(graph, 'ashfold', 'House Ashfold', { [MEANS_BAND_PROP]: opts.holderBroke === false ? 'Comfortable' : 'Destitute' });
  addFaction(graph, 'saltmarch', 'Saltmarch Hold', { [MEANS_BAND_PROP]: 'Comfortable' });
  const ferris = addTown(graph, 'ferris', 'Ferris', 0, { unrest: 75, unrestTarget: 75, hungerDays: 4 });
  addTown(graph, 'millbrook', 'Millbrook', 3);
  control(graph, 'ashfold', 'ferris');
  control(graph, 'saltmarch', 'millbrook');
  if (opts.hall !== false) {
    graph.addEdge({ id: 'hall_saltmarch_ferris', source: 'saltmarch', target: 'ferris', type: 'located_at', properties: {} });
  }
  addTrait(graph, 'ferris', LOCATION_TRAIT_IDS.onTheEdge);
  addTrait(graph, 'ferris', LOCATION_TRAIT_IDS.lawless);
  return { graph, ferris };
}

beforeEach(() => { enableTracing(); clearTraces(); });
afterEach(() => { disableTracing(); });

describe('On the edge — the trait (plan § Engine 9)', () => {
  it('is a location-trait rule on unrest, entering at 70 and releasing at 55', () => {
    const rule = LOCATION_TRAIT_RULES.find(r => r.id === 'onTheEdge');
    expect(rule).toBeDefined();
    expect(rule!.traitId).toBe(LOCATION_TRAIT_IDS.onTheEdge);
    expect(rule!.input).toBe('unrest');
    expect(ON_THE_EDGE_ENTER).toBe(70);
    expect(ON_THE_EDGE_RELEASE).toBe(55);
  });
});

describe('the town view of a lord (plan § Engine 9)', () => {
  it('a fed, solvent neighbour with a hall in the town beats a broke holder by the margin', () => {
    const { graph, ferris } = defectionWorld();
    const holders = settlementHolders(graph);
    const view = buildTownView(buildCrownWorld(graph, DAY, null), holders, ferris)!;
    expect(view.holderId).toBe('ashfold');
    const best = view.candidates[0];
    expect(best.factionId).toBe('saltmarch');
    expect(best.standing).toBe(1);
    expect(best.fed).toBe(1);
    expect(best.solvent).toBe(1);
    expect(view.holder.solvent).toBe(0);
    expect(view.holder.fed).toBe(0); // its only town, Ferris, is hungry
    expect(defectionChoice(view)?.factionId).toBe('saltmarch');
  });

  it('a holder that feeds and pays keeps its town', () => {
    const { graph, ferris } = defectionWorld({ holderBroke: false, hall: false });
    ferris.properties.hungerDays = 0;
    const view = buildTownView(buildCrownWorld(graph, DAY, null), settlementHolders(graph), ferris)!;
    expect(defectionChoice(view)).toBeNull();
  });

  it('a lord whose army besieged the town lately stands at −1, hall or no hall', () => {
    const { graph, ferris } = defectionWorld();
    ferris.properties[SIEGED_BY_PROP] = { saltmarch: DAY - TICKS_PER_DAY };
    expect(townStanding(graph, ferris, 'saltmarch', DAY)).toBe(-1);
  });

  it('a real siege node stamps its besieger through the attacking army (review round 1)', () => {
    const { graph, ferris } = defectionWorld();
    graph.addNode({ id: 'army_s', type: 'actor', name: 'Host', properties: { actorType: 'group' } });
    graph.addEdge({ id: 'mo_army_s', source: 'army_s', target: 'saltmarch', type: 'member_of', properties: { reputation: 0.5, rank: 0, role: 'member', joinedTick: 0 } });
    graph.addNode({
      id: 'siege_1', type: 'actor', name: 'Siege of Ferris',
      properties: { actorType: 'group', battleState: { battleType: 'siege', settlementId: 'ferris', attackerArmyId: 'army_s', defenderArmyId: 'ferris' } },
    });
    ferris.properties[LAST_TURN_TICK_PROP] = DAY; // keep it from turning, so only the stamp is read
    phaseUnrest(state(graph, DAY), { pressure: true });
    expect(ferris.properties[SIEGED_BY_PROP]).toEqual({ saltmarch: DAY });
    expect(townStanding(graph, ferris, 'saltmarch', DAY)).toBe(-1);
  });

  it('__DEBUG.getTownView reads the same parts', () => {
    const { graph } = defectionWorld();
    const r = describeTownView(graph, DAY, 'Ferris')!;
    expect(r.holder).toBe('ashfold');
    expect(r.candidates.map(c => c.factionId)).toEqual(['saltmarch']);
  });
});

describe('defection (Done when S2: the fixture defects on the next daily pass)', () => {
  it('moves controls, writes the grudge and a revenge ambition naming the town, relief and cooldown', () => {
    const { graph, ferris } = defectionWorld();
    const out = phaseUnrest(state(graph, DAY), { pressure: true });

    const ctl = graph.getIncomingEdges('ferris', 'controls');
    expect(ctl.map(e => e.source)).toEqual(['saltmarch']);
    expect(ctl[0].properties).toMatchObject({ via: 'defection', takenFrom: 'ashfold', establishedTick: DAY });

    const grudge = graph.getOutgoingEdges('ashfold', 'relates_to').find(e => e.target === 'saltmarch')!;
    expect(grudge.properties.sentiment).toBeLessThanOrEqual(DEFECTION_GRUDGE_SENTIMENT);
    expect(grudge.properties.defectionTick).toBe(DAY);
    expect(isEnemyFaction(graph, 'ashfold', 'saltmarch')).toBe(true);

    const amb = graph.getNode(graph.getOutgoingEdges('ashfold', 'pursues')[0].target)!;
    expect(amb.properties).toMatchObject({ ambitionType: 'revenge', targetNodeId: 'ferris', grievanceSourceId: 'saltmarch' });

    expect(ferris.properties[LAST_TURN_TICK_PROP]).toBe(DAY);
    // The relief push lands on the number before the day's drift.
    expect(ferris.properties.unrest as number).toBeLessThanOrEqual(75 + DEFECTION_RELIEF + 1);

    expect(out.chronicleEntries?.some(e => e.title === 'A Town Turns' && e.prose.includes('Ferris'))).toBe(true);
    expect(getTraces().some(t => t.category === 'unrest.defect')).toBe(true);
  });

  it('a standing army that pursued the holder\'s old ambition is re-pointed at the revenge (review round 2)', () => {
    const { graph } = defectionWorld();
    graph.addNode({ id: 'amb_old', type: 'ambition', name: 'old', properties: { ambitionType: 'defensive_consolidation', targetNodeId: null } });
    graph.addEdge({ id: 'p_fac', source: 'ashfold', target: 'amb_old', type: 'pursues', properties: {} });
    graph.addNode({ id: 'army_h', type: 'actor', name: 'Host', properties: { actorType: 'group' } });
    graph.addEdge({ id: 'p_army', source: 'army_h', target: 'amb_old', type: 'pursues', properties: {} });
    phaseUnrest(state(graph, DAY), { pressure: true });
    expect(graph.getNode('amb_old')).toBeUndefined();
    const armyAmb = graph.getNode(graph.getOutgoingEdges('army_h', 'pursues')[0].target)!;
    expect(armyAmb.properties).toMatchObject({ ambitionType: 'revenge', grievanceSourceId: 'saltmarch', targetNodeId: 'ferris' });
  });

  it('the page names the holder the turn pass judged, not the influence ranking (review round 2)', () => {
    const { graph, ferris } = defectionWorld({ holderBroke: false, hall: false });
    ferris.properties.unrestHolderId = 'saltmarch';
    expect(fortunesSentence(graph, 'ferris')!.holder?.id).toBe('saltmarch');
    ferris.properties.unrestHolderId = null;
    expect(fortunesSentence(graph, 'ferris')!.band).toBe('on_the_edge_unheld');
  });

  it('a defection bumps the structural cache through the onStructure hook (THR-1155)', () => {
    const { graph } = defectionWorld();
    let bumps = 0;
    phaseUnrest(state(graph, DAY), { pressure: true, onStructure: () => { bumps += 1; } });
    expect(bumps).toBe(1);
  });

  it('a town on its turn cooldown is only weighed, never moved', () => {
    const { graph, ferris } = defectionWorld();
    ferris.properties[LAST_TURN_TICK_PROP] = DAY - (TOWN_TURN_COOLDOWN_DAYS - 1) * TICKS_PER_DAY;
    phaseUnrest(state(graph, DAY), { pressure: true });
    expect(graph.getIncomingEdges('ferris', 'controls').map(e => e.source)).toEqual(['ashfold']);
  });

  it('an unheld town on the edge never defects', () => {
    const { graph } = defectionWorld();
    for (const e of graph.getIncomingEdges('ferris', 'controls')) graph.removeEdge(e.id);
    phaseUnrest(state(graph, DAY), { pressure: true });
    expect(graph.getIncomingEdges('ferris', 'controls')).toEqual([]);
  });
});

describe('rising (plan § Engine 10)', () => {
  function risingWorld() {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    addFaction(graph, 'ashfold', 'House Ashfold');
    const ferris = addTown(graph, 'ferris', 'Ferris', 0, { unrest: 95, unrestTarget: 95 });
    control(graph, 'ashfold', 'ferris');
    return { graph, ferris };
  }

  it('resident members split off, take the town and are hostile to the old holder', () => {
    const { graph, ferris } = risingWorld();
    addMortal(graph, 'kael', 'ferris', 10, 'ashfold');
    addMortal(graph, 'thessa', 'ferris', 20, 'ashfold');
    addTown(graph, 'elsewhere', 'Elsewhere', 9);
    addMortal(graph, 'away', 'elsewhere', 5, 'ashfold');
    const r = applyRising(state(graph, DAY), ferris, 'ashfold');
    expect(r.path).toBe('split');
    expect(r.residentsMoved).toBe(2);
    const risen = r.newFactionId!;
    expect(graph.getIncomingEdges('ferris', 'controls').map(e => e.source)).toEqual([risen]);
    expect(graph.getIncomingEdges('ferris', 'controls')[0].properties).toMatchObject({ via: 'rising', takenFrom: 'ashfold' });
    expect(graph.getOutgoingEdges(risen, 'hostile_to').some(e => e.target === 'ashfold' && e.properties.reason === 'rising')).toBe(true);
    expect(graph.getOutgoingEdges('ashfold', 'hostile_to').some(e => e.target === risen)).toBe(true);
    expect(isEnemyFaction(graph, risen, 'ashfold')).toBe(true);
    expect(graph.getOutgoingEdges('kael', 'member_of').map(e => e.target)).toEqual([risen]);
    expect(graph.getOutgoingEdges('away', 'member_of').map(e => e.target)).toEqual(['ashfold']);
    expect(ferris.properties.unrest).toBe(95 + RISING_RELIEF);
    expect(ferris.properties[LAST_TURN_TICK_PROP]).toBe(DAY);
  });

  it('with no member resident, the highest-ranked resident is the founder', () => {
    const { graph } = risingWorld();
    addFaction(graph, 'guild', 'The Guild');
    addMortal(graph, 'early', 'ferris', 1);
    addMortal(graph, 'ranked', 'ferris', 50, 'guild', 0.9);
    expect(pickFounder(graph, townResidents(graph, 'ferris'))?.id).toBe('ranked');
    graph.removeNode('ranked');
    expect(pickFounder(graph, townResidents(graph, 'ferris'))?.id).toBe('early');
  });

  it('with no member resident, a resident founds a free town that takes the town', () => {
    const { graph, ferris } = risingWorld();
    addMortal(graph, 'early', 'ferris', 1);
    const r = applyRising(state(graph, DAY), ferris, 'ashfold');
    expect(r.failReason).toBeUndefined();
    expect(r.path).toBe('founded');
    const free = r.newFactionId!;
    expect(graph.getNode(free)?.name).toBe('The Free Town of Ferris');
    expect(graph.getIncomingEdges('ferris', 'controls').map(e => e.source)).toEqual([free]);
    expect(graph.getOutgoingEdges('early', 'member_of').some(e => e.target === free && e.properties.role === 'leader')).toBe(true);
    expect(isEnemyFaction(graph, free, 'ashfold')).toBe(true);
  });

  it('no resident at all: no rising, the town keeps its holder', () => {
    const { graph, ferris } = risingWorld();
    const r = applyRising(state(graph, DAY), ferris, 'ashfold');
    expect(r.path).toBe('none');
    expect(graph.getIncomingEdges('ferris', 'controls').map(e => e.source)).toEqual(['ashfold']);
  });

  it('the phase rises a held town at 90 and writes the chronicle line', () => {
    const { graph } = risingWorld();
    addMortal(graph, 'kael', 'ferris', 10, 'ashfold');
    const out = phaseUnrest(state(graph, DAY), { pressure: true });
    expect(graph.getIncomingEdges('ferris', 'controls')[0].source).not.toBe('ashfold');
    expect(out.chronicleEntries?.some(e => e.title === 'A Town Rises')).toBe(true);
    expect(getTraces().some(t => t.category === 'unrest.rising')).toBe(true);
  });
});

describe('the popup gate (plan § Event notifications)', () => {
  it('fires only for a threaded resident or the god\'s source at the town', () => {
    const { graph } = defectionWorld();
    addMortal(graph, 'kael', 'ferris', 10);
    const s = state(graph, DAY);
    expect(godWatchesTown(s, 'ferris')).toBe(false);
    graph.addEdge({ id: 'thr_kael', source: 'asc', target: 'kael', type: 'thread', properties: { courtPosition: 'champion' } });
    expect(godWatchesTown(s, 'ferris')).toBe(true);
  });

  it('the day a watched town enters On the edge, a popup and the chronicle line', () => {
    const { graph, ferris } = defectionWorld({ holderBroke: false, hall: false });
    ferris.properties.hungerDays = 0;
    addMortal(graph, 'kael', 'ferris', 10);
    graph.addEdge({ id: 'thr_kael', source: 'asc', target: 'kael', type: 'thread', properties: { courtPosition: 'champion' } });
    const out = phaseUnrest(state(graph, DAY), { pressure: true });
    const popup = out.tickEvents?.find(e => e.notification?.channel === 'popup');
    expect(popup?.notification?.popup?.title).toBe('Ferris is on the edge');
    expect(out.chronicleEntries?.some(e => e.title === 'A Town on the Edge')).toBe(true);
    expect(ferris.properties[WAS_ON_THE_EDGE_PROP]).toBe(true);
    // Entry only: the next day tells nothing new.
    const again = phaseUnrest(state(graph, DAY + TICKS_PER_DAY, { chronicleEntries: [], tickEvents: [] }), { pressure: true });
    expect(again.chronicleEntries?.some(e => e.title === 'A Town on the Edge') ?? false).toBe(false);
  });

  it('an unwatched town gets the chronicle line but no popup', () => {
    const { graph, ferris } = defectionWorld({ holderBroke: false, hall: false });
    ferris.properties.hungerDays = 0;
    const out = phaseUnrest(state(graph, DAY), { pressure: true });
    expect(out.tickEvents?.some(e => e.notification?.channel === 'popup') ?? false).toBe(false);
    expect(out.chronicleEntries?.some(e => e.title === 'A Town on the Edge')).toBe(true);
  });
});

describe('content (plan § Prose S2)', () => {
  it('four chronicle triggers, three variants for the told lines, the plan\'s weights', () => {
    for (const t of ['town_defects', 'town_rises', 'town_empties'] as const) {
      expect(ECONOMIC_CHRONICLE_TEMPLATES[t].length).toBe(3);
    }
    expect(ECONOMIC_CHRONICLE_TEMPLATES.town_on_the_edge).toEqual(['{flavor}']);
    expect(ECONOMIC_CHRONICLE_SIGNIFICANCE).toMatchObject({
      town_on_the_edge: 0.6, town_defects: 0.8, town_rises: 0.85, town_empties: 0.75,
    });
  });

  it('Fortunes names the holder a town on the edge may turn from, or says its people may leave', () => {
    const { graph } = defectionWorld();
    graph.getNode('ferris')!.properties.unrestInputs = { hunger: 40, poverty: 0, siege: 0, sickness: 0, deathSite: 0, contentment: 0 };
    const s = fortunesSentence(graph, 'ferris')!;
    expect(s.band).toBe('on_the_edge_held');
    expect(s.text).toBe('Ferris is modest, and it is on the edge of turning from House Ashfold with hunger.');
    expect(s.holder).toEqual({ id: 'ashfold', name: 'House Ashfold' });
    for (const e of graph.getIncomingEdges('ferris', 'controls')) graph.removeEdge(e.id);
    expect(fortunesSentence(graph, 'ferris')!.text).toBe('Ferris is modest, and its people are on the edge of leaving with hunger.');
  });
});

describe('the splinter helper and the resident_of selector', () => {
  it('residesIn resolves a Place residence to its town', () => {
    const graph = new WorldGraph();
    addTown(graph, 'ferris', 'Ferris', 0);
    graph.addNode({ id: 'inn', type: 'location', name: 'Inn', properties: { parentLocationId: 'ferris' } });
    addMortal(graph, 'kael', 'inn', 1);
    expect(residesIn(graph, 'kael', 'ferris')).toBe(true);
    expect(residesIn(graph, 'kael', 'inn')).toBe(false);
  });

  it('splinterFaction moves the chosen members and inherits relations', () => {
    const graph = new WorldGraph();
    addFaction(graph, 'a', 'A');
    addFaction(graph, 'c', 'C');
    graph.addEdge({ id: 'rel_a_c', source: 'a', target: 'c', type: 'relates_to', properties: { sentiment: 0.4 } });
    addTown(graph, 'ferris', 'Ferris', 0);
    addMortal(graph, 'm1', 'ferris', 1, 'a');
    const moved = splinterFaction(graph, {
      sourceFactionId: 'a', newFactionId: 'b', newFactionName: 'B',
      members: [{ id: 'm1', reputation: 0.6 }], reputationShare: 0.5, tick: 3,
    });
    expect(moved).toEqual(['m1']);
    expect(graph.getOutgoingEdges('m1', 'member_of').map(e => [e.target, e.properties.reputation, e.properties.rank, e.properties.role])).toEqual([['b', 0.3, 0.2, 'member']]);
    expect(graph.getOutgoingEdges('b', 'relates_to').map(e => e.target).sort()).toEqual(['a', 'c']);
  });
});
