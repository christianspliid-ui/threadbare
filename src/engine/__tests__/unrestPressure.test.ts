/**
 * THR-1934 S1 — unrest as pressure: the target, the drift, hunger, Restless leaving,
 * the Lawless riot and half tax, and the Fortunes sentence.
 *
 * Plan: Docs/plans/2026-10-16-thr-1934-hunger-and-unrest.md § Done when (S1).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseUnrest } from '../phaseUnrest';
import { runUnrestPressure, UNREST_DRIFT_PER_TICK, FLEE_AMBITION_TEMPLATE_ID } from '../unrestPressure';
import {
  computeUnrestInputs,
  hungerTerm,
  povertyTerm,
  siegeTerm,
  sicknessTerm,
  contentmentTerm,
  targetOf,
  largestInput,
  readUnrestInputs,
} from '../unrestPressure/inputs';
import { isHungryToday } from '../unrestPressure/hunger';
import { homeIsRestless, unrestBand } from '../unrestPressure/bands';
import { pickLeaveDestination } from '../unrestPressure/leave';
import { describeUnrest } from '../unrestPressure/describe';
import { townTaxOf } from '../factionPurse/income';
import { fortunesSentence } from '../../data/fortunes-prose';
import { RELOCATION_INTENT_PROP } from '../relocationIntent';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import { LOCATION_TRAIT_IDS } from '../../data/location-trait-constants';
import { LAWLESS_TOWN_TAX_FACTOR } from '../../data/faction-purse-constants';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import {
  HUNGER_BASE,
  HUNGER_PER_DAY,
  HUNGER_MAX,
  POVERTY_MAX,
  SIEGE_PRESSURE,
  SIEGE_LINGER_DAYS,
  SICK_PRESSURE,
  PROSPERITY_CONTENT_RELIEF,
  RESTLESS_LEAVE_DAYS,
  UNREST_BAND_RESTLESS,
  GRANARY_RIOT_TEMPLATE_ID,
} from '../../data/unrest-pressure-constants';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';

const SCARCE_GRAIN = { grain: { resourceId: 'grain', quantity: 2, stockTier: 'scarce' } };
const ADEQUATE_GRAIN = { grain: { resourceId: 'grain', quantity: 20, stockTier: 'adequate' } };

function addTown(graph: WorldGraph, id: string, name: string, props: Record<string, unknown> = {}): GraphNode {
  graph.addNode({
    id, type: 'location', name,
    // prosperity 40: no poverty (pivot 35), no contentment (line 60).
    properties: { locationSubtype: 'town', prosperity: 40, populationHealth: 80, unrest: 0, hexCol: 0, hexRow: 0, ...props },
  });
  return graph.getNode(id)!;
}

function addTrait(graph: WorldGraph, locId: string, traitId: string): void {
  if (!graph.getNode(traitId)) graph.addNode({ id: traitId, type: 'trait', name: traitId, properties: {} });
  graph.addEdge({ id: `ht_${locId}_${traitId}`, source: locId, target: traitId, type: 'has_trait', properties: {} });
}

function addMortal(graph: WorldGraph, id: string, homeId: string, arrived: number): void {
  graph.addNode({
    id, type: 'actor', name: id,
    properties: { actorType: 'individual', residencePositionId: homeId, residenceArrivedTick: arrived },
  });
  graph.addEdge({ id: `la_${id}`, source: id, target: homeId, type: 'located_at', properties: {} });
}

function state(graph: WorldGraph, tick: number, extra: Partial<GameState> = {}): GameState {
  return { tick, graph, seed: 1, pendingEncounterSeeds: [], ...extra } as unknown as GameState;
}

/** Run the unrest phase over [from, to) ticks. */
function runTicks(graph: WorldGraph, from: number, to: number): void {
  for (let t = from; t < to; t++) phaseUnrest(state(graph, t), { pressure: true });
}

const unrestOf = (graph: WorldGraph, id: string) => graph.getNode(id)!.properties.unrest as number;

describe('unrest inputs (plan § Engine 1)', () => {
  it('each term follows its rule and cap', () => {
    expect(hungerTerm(0)).toBe(0);
    expect(hungerTerm(1)).toBe(HUNGER_BASE);
    expect(hungerTerm(3)).toBe(HUNGER_BASE + 2 * HUNGER_PER_DAY);
    expect(hungerTerm(1000)).toBe(HUNGER_MAX);
    expect(povertyTerm(undefined)).toBe(0);
    expect(povertyTerm(40)).toBe(0);
    expect(povertyTerm(0)).toBe(POVERTY_MAX);
    expect(siegeTerm(true, undefined, 100)).toBe(SIEGE_PRESSURE);
    expect(siegeTerm(false, 100, 100 + SIEGE_LINGER_DAYS * TICKS_PER_DAY)).toBe(SIEGE_PRESSURE);
    expect(siegeTerm(false, 100, 101 + SIEGE_LINGER_DAYS * TICKS_PER_DAY)).toBe(0);
    expect(sicknessTerm(undefined)).toBe(0); // missing health reads the 80 default
    expect(sicknessTerm(10)).toBe(SICK_PRESSURE);
    expect(contentmentTerm(80)).toBe(-PROSPERITY_CONTENT_RELIEF);
    expect(contentmentTerm(40)).toBe(0);
  });

  it('the target is the clamped sum; the largest input names the cause', () => {
    const graph = new WorldGraph();
    const town = addTown(graph, 'a', 'Aford', { prosperity: 10, deathSiteUnrestTarget: 4 });
    const inputs = computeUnrestInputs(town, 2, false, 0);
    expect(inputs.hunger).toBe(HUNGER_BASE + HUNGER_PER_DAY);
    expect(inputs.poverty).toBeCloseTo(15, 5);
    expect(inputs.deathSite).toBe(4);
    expect(targetOf(inputs)).toBeCloseTo(13 + 15 + 4, 5);
    expect(largestInput(inputs)).toBe('poverty');
    expect(targetOf({ hunger: 0, poverty: 0, siege: 0, sickness: 0, deathSite: 0, contentment: -10 })).toBe(0);
  });

  it('hunger reads stock tiers before the settlement economy and the food store after', () => {
    const graph = new WorldGraph();
    expect(isHungryToday(addTown(graph, 'a', 'A', { resources: SCARCE_GRAIN }))).toEqual({ hungry: true, source: 'stock_tier' });
    expect(isHungryToday(addTown(graph, 'b', 'B', { resources: ADEQUATE_GRAIN })).hungry).toBe(false);
    expect(isHungryToday(addTown(graph, 'c', 'C', { resources: SCARCE_GRAIN, foodStore: 5, foodBalance: -1 })))
      .toEqual({ hungry: false, source: 'settlement_economy' });
    expect(isHungryToday(addTown(graph, 'd', 'D', { foodStore: 0, foodBalance: -1 })).hungry).toBe(true);
  });
});

describe('the drift (plan § Engine 2)', () => {
  it('fed calms it: one scarce staple reaches Restless within 10 days, and adequate again falls below it within 10', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford', { resources: SCARCE_GRAIN });
    let reachedAt: number | null = null;
    for (let t = 0; t < 10 * TICKS_PER_DAY; t++) {
      phaseUnrest(state(graph, t), { pressure: true });
      if (reachedAt === null && unrestOf(graph, 'a') >= UNREST_BAND_RESTLESS) reachedAt = t;
    }
    expect(reachedAt).not.toBeNull();

    graph.getNode('a')!.properties.resources = ADEQUATE_GRAIN;
    const start = 10 * TICKS_PER_DAY;
    let fellAt: number | null = null;
    for (let t = start; t < start + 10 * TICKS_PER_DAY; t++) {
      phaseUnrest(state(graph, t), { pressure: true });
      if (fellAt === null && unrestOf(graph, 'a') < UNREST_BAND_RESTLESS) fellAt = t;
    }
    expect(fellAt).not.toBeNull();
    expect(graph.getNode('a')!.properties.hungerDays).toBe(0);
  });

  it('pushes fade: an Incite Unrest (+20) on a calm, fed town is back within 4 of its target in 5 days', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford', { resources: ADEQUATE_GRAIN });
    runTicks(graph, 0, TICKS_PER_DAY);
    graph.getNode('a')!.properties.unrest = unrestOf(graph, 'a') + 20;
    runTicks(graph, TICKS_PER_DAY, 6 * TICKS_PER_DAY);
    const target = graph.getNode('a')!.properties.unrestTarget as number;
    expect(Math.abs(unrestOf(graph, 'a') - target)).toBeLessThanOrEqual(4);
  });

  it('moves at most the drift per tick, clamps unclamped writes, and leaves non-settlements alone', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford', { unrest: 140 });
    graph.addNode({ id: 'wild', type: 'location', name: 'Wild', properties: { locationSubtype: 'wilderness', unrest: 50 } });
    phaseUnrest(state(graph, 0), { pressure: true });
    expect(unrestOf(graph, 'a')).toBe(100);
    phaseUnrest(state(graph, 1), { pressure: true });
    expect(unrestOf(graph, 'a')).toBeCloseTo(100 - UNREST_DRIFT_PER_TICK, 5);
    expect(graph.getNode('wild')!.properties.unrest).toBe(50);
  });

  it('a siege raises the target and the memory lingers', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford');
    graph.addNode({ id: 'siege1', type: 'actor', name: 'Siege', properties: { actorType: 'group', battleState: { battleType: 'siege', settlementId: 'a' } } });
    phaseUnrest(state(graph, 0), { pressure: true });
    expect(readUnrestInputs(graph.getNode('a'))?.siege).toBe(SIEGE_PRESSURE);
    expect(graph.getNode('a')!.properties.lastSiegeSeenTick).toBe(0);
    graph.removeNode('siege1');
    phaseUnrest(state(graph, TICKS_PER_DAY), { pressure: true });
    expect(readUnrestInputs(graph.getNode('a'))?.siege).toBe(SIEGE_PRESSURE);
  });
});

describe('Restless — people leave (plan § Engine 6)', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  function restlessWorld(): WorldGraph {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford', { resources: SCARCE_GRAIN, unrest: 35 });
    addTrait(graph, 'a', LOCATION_TRAIT_IDS.restless);
    addTown(graph, 'b', 'Bmere', { hexCol: 3, resources: ADEQUATE_GRAIN });   // fed, calm, near
    addTown(graph, 'c', 'Cwick', { hexCol: 1, resources: SCARCE_GRAIN });     // nearer, but hungry
    addTown(graph, 'd', 'Dholm', { hexCol: 2, resources: ADEQUATE_GRAIN });   // nearer and calm, but Restless
    addTrait(graph, 'd', LOCATION_TRAIT_IDS.restless);
    addTown(graph, 'e', 'Efar', { hexCol: 9, resources: ADEQUATE_GRAIN });    // fed but too far
    addMortal(graph, 'm.old', 'a', 0);
    addMortal(graph, 'm.new', 'a', 50);
    return graph;
  }

  it('picks the nearest fed, calm town within the radius', () => {
    const graph = restlessWorld();
    graph.getNode('c')!.properties.hungerDays = 2;
    expect(pickLeaveDestination({ graph }, graph.getNode('a')!)).toEqual({ id: 'b', distance: 3 });
  });

  it(`every ${RESTLESS_LEAVE_DAYS} Restless days the latest arrival leans away, and takes up Flee when hunger drives the town`, () => {
    const graph = restlessWorld();
    for (let day = 0; day < RESTLESS_LEAVE_DAYS; day++) runUnrestPressure(state(graph, day * TICKS_PER_DAY));
    const intent = graph.getNode('m.new')!.properties[RELOCATION_INTENT_PROP] as { destinationNodeId?: string; source?: string };
    expect(intent?.destinationNodeId).toBe('b');
    expect(intent?.source).toBe('unrest');
    expect(graph.getNode('m.old')!.properties[RELOCATION_INTENT_PROP]).toBeUndefined();
    expect(graph.getOutgoingEdges('m.new', 'pursues').some(e => e.target === `ambition.${FLEE_AMBITION_TEMPLATE_ID}`)).toBe(true);

    // Dholm is Restless too and loses its own person; read Aford's.
    const fromA = (t: { fromId?: string }) => t.fromId === 'a';
    const leaves = getTraces().filter(t => t.category === 'unrest.leave' && fromA(t as { fromId?: string }));
    expect(leaves).toHaveLength(1);
    expect(leaves[0]).toMatchObject({ fromId: 'a', toId: 'b', personMoved: false, leaningAgentId: 'm.new', fleeMinted: true });
    expect(getTraces().filter(t => t.category === 'unrest.leave.skipped' && fromA(t as { fromId?: string }))).toHaveLength(1);
  });

  it('never overwrites a live intent an encounter ending wrote; the next arrival leans instead', () => {
    const graph = restlessWorld();
    const aftermath = { destinationHex: { col: 9, row: 0 }, destinationNodeId: 'e', expiresAtTick: 1000, setAtTick: 0, source: 'aftermath' };
    graph.getNode('m.new')!.properties[RELOCATION_INTENT_PROP] = aftermath;
    for (let day = 0; day < RESTLESS_LEAVE_DAYS; day++) runUnrestPressure(state(graph, day * TICKS_PER_DAY));
    expect(graph.getNode('m.new')!.properties[RELOCATION_INTENT_PROP]).toEqual(aftermath);
    expect((graph.getNode('m.old')!.properties[RELOCATION_INTENT_PROP] as { destinationNodeId?: string })?.destinationNodeId).toBe('b');
  });

  it('with the settlement economy counting people, the two populations change by −1 / +1', () => {
    const graph = restlessWorld();
    graph.getNode('a')!.properties.population = 10;
    graph.getNode('b')!.properties.population = 5;
    for (let day = 0; day < RESTLESS_LEAVE_DAYS; day++) runUnrestPressure(state(graph, day * TICKS_PER_DAY));
    expect(graph.getNode('a')!.properties.population).toBe(9);
    expect(graph.getNode('b')!.properties.population).toBe(6);
  });

  it('nowhere to go: nobody leaves, and the trace says so', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford', { resources: SCARCE_GRAIN });
    addTrait(graph, 'a', LOCATION_TRAIT_IDS.restless);
    for (let day = 0; day < RESTLESS_LEAVE_DAYS; day++) runUnrestPressure(state(graph, day * TICKS_PER_DAY));
    expect(getTraces().filter(t => t.category === 'unrest.leave.none')).toHaveLength(1);
  });

  it('homeIsRestless reads the mortal\'s home trait (the mortal wealth S2 hook)', () => {
    const graph = restlessWorld();
    expect(homeIsRestless({ graph }, 'm.new')).toBe(true);
    addMortal(graph, 'm.b', 'b', 0);
    expect(homeIsRestless({ graph }, 'm.b')).toBe(false);
    expect(homeIsRestless({ graph }, 'nobody')).toBe(false);
  });
});

describe('Lawless (plan § Engine 8)', () => {
  it('a lawless town pays half the tax the same town pays untraited', () => {
    const graph = new WorldGraph();
    const town = addTown(graph, 'a', 'Aford', { prosperity: 50 });
    const plain = townTaxOf(town, graph);
    expect(plain).toBeGreaterThan(0);
    addTrait(graph, 'a', LOCATION_TRAIT_IDS.lawless);
    expect(townTaxOf(town, graph)).toBeCloseTo(plain * LAWLESS_TOWN_TAX_FACTOR, 10);
    // Without a graph the old value stands.
    expect(townTaxOf(town)).toBe(plain);
  });

  it('the day a hungry town turns Lawless, one granary riot is seeded (then a cooldown)', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford', { resources: SCARCE_GRAIN, unrest: 55 });
    addMortal(graph, 'm1', 'a', 0);
    let r = phaseUnrest(state(graph, 0), { pressure: true });
    expect(r.pendingEncounterSeeds ?? []).toHaveLength(0);

    addTrait(graph, 'a', LOCATION_TRAIT_IDS.lawless);
    r = phaseUnrest(state(graph, TICKS_PER_DAY), { pressure: true });
    expect(r.pendingEncounterSeeds).toHaveLength(1);
    expect(r.pendingEncounterSeeds![0]).toMatchObject({ templateId: GRANARY_RIOT_TEMPLATE_ID, targetAgentId: 'm1', sourceReactionId: 'lawless' });

    // Still lawless the next day: no second seed.
    r = phaseUnrest(state(graph, 2 * TICKS_PER_DAY), { pressure: true });
    expect(r.pendingEncounterSeeds ?? []).toHaveLength(0);
  });
});

describe('the Fortunes sentence (plan § Prose tables)', () => {
  it('a calm town is one plain sentence; a band names its largest input', () => {
    const graph = new WorldGraph();
    addTown(graph, 'calm', 'Millbrook', { prosperity: 45 });
    expect(fortunesSentence(graph, 'calm')?.text).toBe('Millbrook is modest and quiet.');

    addTown(graph, 'hungry', 'Millbrook', { prosperity: 25, resources: SCARCE_GRAIN });
    addTrait(graph, 'hungry', LOCATION_TRAIT_IDS.restless);
    runTicks(graph, 0, 1);
    graph.getNode('hungry')!.properties.unrest = 31;
    graph.getNode('hungry')!.properties.unrestTarget = 31;
    graph.getNode('hungry')!.properties.unrestInputs = { hunger: 25, poverty: 6, siege: 0, sickness: 0, deathSite: 0, contentment: 0 };
    expect(fortunesSentence(graph, 'hungry')?.text).toBe('Millbrook is struggling, and its people are restless with hunger.');

    addTown(graph, 'sieged', 'Ferris', { prosperity: 45, unrest: 52, unrestTarget: 52, unrestInputs: { hunger: 10, poverty: 0, siege: 30, sickness: 0, deathSite: 0, contentment: 0 } });
    addTrait(graph, 'sieged', LOCATION_TRAIT_IDS.restless);
    addTrait(graph, 'sieged', LOCATION_TRAIT_IDS.lawless);
    expect(fortunesSentence(graph, 'sieged')?.text).toBe('Ferris is modest, and its streets have turned lawless, with an army at the walls.');
  });

  it('a push larger than every input names no cause; no number ever appears', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford', { prosperity: 45, unrest: 40, unrestTarget: 5, unrestInputs: { hunger: 0, poverty: 0, siege: 0, sickness: 0, deathSite: 5, contentment: 0 } });
    addTrait(graph, 'a', LOCATION_TRAIT_IDS.restless);
    const s = fortunesSentence(graph, 'a')!;
    expect(s.text).toBe('Aford is modest, and its people are restless.');
    expect(s.text).not.toMatch(/\d/);
    expect(fortunesSentence(graph, 'nowhere')).toBeNull();
  });

  it('describeUnrest is what the debug bridge returns', () => {
    const graph = new WorldGraph();
    addTown(graph, 'loc.aford', 'Aford', { resources: SCARCE_GRAIN });
    runTicks(graph, 0, 1);
    const r = describeUnrest(graph, 'aford')!;
    expect(r.locationId).toBe('loc.aford');
    expect(r.inputs!.hunger).toBeGreaterThanOrEqual(0);
    expect(r.hungerDays).toBe(1);
    expect(r.band).toBe(unrestBand(r.unrest));
    expect(r.fortunes).toBe('Aford is modest and quiet.');
  });
});
