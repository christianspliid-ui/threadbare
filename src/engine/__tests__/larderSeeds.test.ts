/**
 * THR-2040 — hunger's stories are planted: a town's famine or glut plants one of its
 * scenes for a resident (plan § Done when, first bullet).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseUnrest } from '../phaseUnrest';
import {
  plantLarderSeed,
  pickLarderRow,
  readLarder,
  setLarderSeedsEnabledOverride,
  LARDER_LAST_SEED_PROP,
  LARDER_LAST_FAMINE_SEED_PROP,
  LARDER_WAS_GLUT_PROP,
} from '../larderSeeds';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { LOCATION_TRAIT_IDS } from '../../data/location-trait-constants';
import { GRANARY_RIOT_TEMPLATE_ID } from '../../data/unrest-pressure-constants';
import {
  FAMINE_SEED_DAY,
  LARDER_SEED_COOLDOWN_DAYS,
  FAMINE_SEED_ROWS,
  PLENTY_SEED_ROWS,
} from '../../data/larder-seed-config';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { PendingEncounterSeed } from '../../types/unifiedAction';

const SCARCE_GRAIN = { grain: { resourceId: 'grain', quantity: 2, stockTier: 'scarce' } };
const GLUT = { foodSurplusDays: 3, foodBalance: 0.8 };
const FAMINE_IDS = new Set(FAMINE_SEED_ROWS.map(r => r.templateId));
const PLENTY_IDS = new Set(PLENTY_SEED_ROWS.map(r => r.templateId));

function addTown(graph: WorldGraph, id: string, props: Record<string, unknown> = {}): GraphNode {
  graph.addNode({
    id, type: 'location', name: `Town ${id}`,
    properties: { locationSubtype: 'town', prosperity: 40, populationHealth: 80, unrest: 0, hexCol: 0, hexRow: 0, ...props },
  });
  return graph.getNode(id)!;
}

function addMortal(graph: WorldGraph, id: string, at: string): void {
  graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual' } });
  graph.addEdge({ id: `la_${id}`, source: id, target: at, type: 'located_at', properties: {} });
}

function state(graph: WorldGraph, tick: number): GameState {
  return { tick, graph, seed: 1, pendingEncounterSeeds: [] } as unknown as GameState;
}

/** One larder call; returns the seeds it planted. */
function plant(graph: WorldGraph, town: GraphNode, tick: number, hungry: boolean, hungerDays: number, riot = false): PendingEncounterSeed[] {
  const seeds: PendingEncounterSeed[] = [];
  plantLarderSeed(state(graph, tick), town, hungry, hungerDays, riot, new Set(), seeds);
  return seeds;
}

const larderTraces = () => getTraces().filter(t => t.category === 'larder.seed') as unknown as Array<Record<string, unknown>>;

beforeEach(() => { enableTracing(); clearTraces(); setLarderSeedsEnabledOverride(null); });
afterEach(() => { disableTracing(); setLarderSeedsEnabledOverride(null); });

describe('readLarder', () => {
  it('famine is hunger; glut is a surplus run at the balance floor; missing food data is neither', () => {
    const graph = new WorldGraph();
    expect(readLarder(addTown(graph, 'a'), true).state).toBe('famine');
    expect(readLarder(addTown(graph, 'b', GLUT), false).state).toBe('glut');
    expect(readLarder(addTown(graph, 'c', { foodSurplusDays: 2, foodBalance: 0.9 }), false).state).toBeNull();
    expect(readLarder(addTown(graph, 'd', { foodSurplusDays: 5, foodBalance: 0.5 }), false).state).toBeNull();
    expect(readLarder(addTown(graph, 'e', { foodSurplusDays: '3', foodBalance: 0.9 }), false).state).toBeNull();
  });
});

describe('the famine trigger', () => {
  it(`plants on hungry day ${FAMINE_SEED_DAY} only, a famine row for a resident, in the riot's shape`, () => {
    const graph = new WorldGraph();
    const town = addTown(graph, 'a');
    addMortal(graph, 'm1', 'a');
    expect(plant(graph, town, 0, true, FAMINE_SEED_DAY - 1)).toHaveLength(0);
    expect(plant(graph, town, 2 * TICKS_PER_DAY, true, FAMINE_SEED_DAY + 1)).toHaveLength(0);
    const seeds = plant(graph, town, TICKS_PER_DAY, true, FAMINE_SEED_DAY);
    expect(seeds).toHaveLength(1);
    expect(seeds[0]).toMatchObject({ targetAgentId: 'm1', sourceEncounterId: 'larder', sourceReactionId: 'famine', seedLabel: 'Town a has gone hungry' });
    expect(FAMINE_IDS.has(seeds[0].templateId!)).toBe(true);
    expect(town.properties[LARDER_LAST_SEED_PROP]).toBe(TICKS_PER_DAY);
    expect(town.properties[LARDER_LAST_FAMINE_SEED_PROP]).toBe(TICKS_PER_DAY);
    expect(larderTraces()).toHaveLength(1);
    expect(larderTraces()[0]).toMatchObject({ state: 'famine', targetAgentId: 'm1' });
  });
});

describe('the glut trigger', () => {
  it("plants on a glut run's first day only", () => {
    const graph = new WorldGraph();
    const town = addTown(graph, 'a', GLUT);
    addMortal(graph, 'm1', 'a');
    const first = plant(graph, town, 0, false, 0);
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ sourceReactionId: 'glut', seedLabel: "Town a's granaries are full" });
    expect(PLENTY_IDS.has(first[0].templateId!)).toBe(true);
    expect(town.properties[LARDER_WAS_GLUT_PROP]).toBe(true);
    expect(town.properties[LARDER_LAST_FAMINE_SEED_PROP]).toBeUndefined();
    // Still glutted the next day (and past the cooldown): not a first day.
    expect(plant(graph, town, (LARDER_SEED_COOLDOWN_DAYS + 1) * TICKS_PER_DAY, false, 0)).toHaveLength(0);
    // The run ends, then a new one begins past the cooldown: plants again.
    town.properties.foodSurplusDays = 0;
    plant(graph, town, (LARDER_SEED_COOLDOWN_DAYS + 2) * TICKS_PER_DAY, false, 0);
    expect(town.properties[LARDER_WAS_GLUT_PROP]).toBe(false);
    town.properties.foodSurplusDays = 3;
    expect(plant(graph, town, (LARDER_SEED_COOLDOWN_DAYS + 3) * TICKS_PER_DAY, false, 0)).toHaveLength(1);
  });
});

describe('the guards', () => {
  it(`the cooldown blocks a second plant within ${LARDER_SEED_COOLDOWN_DAYS} days, and traces why`, () => {
    const graph = new WorldGraph();
    const town = addTown(graph, 'a');
    addMortal(graph, 'm1', 'a');
    expect(plant(graph, town, 0, true, FAMINE_SEED_DAY)).toHaveLength(1);
    // Fed, then hungry again inside the cooldown.
    expect(plant(graph, town, (LARDER_SEED_COOLDOWN_DAYS - 1) * TICKS_PER_DAY, true, FAMINE_SEED_DAY)).toHaveLength(0);
    expect(larderTraces().at(-1)).toMatchObject({ skipped: 'cooldown', templateId: null });
    expect(plant(graph, town, LARDER_SEED_COOLDOWN_DAYS * TICKS_PER_DAY, true, FAMINE_SEED_DAY)).toHaveLength(1);
  });

  it('a riot planted the same day blocks it', () => {
    const graph = new WorldGraph();
    const town = addTown(graph, 'a');
    addMortal(graph, 'm1', 'a');
    expect(plant(graph, town, 0, true, FAMINE_SEED_DAY, true)).toHaveLength(0);
    expect(larderTraces().at(-1)).toMatchObject({ skipped: 'riot' });
  });

  it('a scarcity-arc move within the cooldown blocks it', () => {
    const graph = new WorldGraph();
    const tick = 20 * TICKS_PER_DAY;
    const town = addTown(graph, 'a', { scarcityArc: { resourceId: 'grain', phase: 'shortage', sinceTick: 0, phaseSinceTick: tick - TICKS_PER_DAY } });
    addMortal(graph, 'm1', 'a');
    expect(plant(graph, town, tick, true, FAMINE_SEED_DAY)).toHaveLength(0);
    expect(larderTraces().at(-1)).toMatchObject({ skipped: 'scarcity_arc' });
    town.properties.scarcityArc = { resourceId: 'grain', phase: 'shortage', sinceTick: 0, phaseSinceTick: tick - LARDER_SEED_COOLDOWN_DAYS * TICKS_PER_DAY };
    expect(plant(graph, town, tick, true, FAMINE_SEED_DAY)).toHaveLength(1);
  });

  it('no resident: nothing planted, traced no_resident; no fitting row: traced no_row', () => {
    const graph = new WorldGraph();
    const town = addTown(graph, 'a');
    expect(plant(graph, town, 0, true, FAMINE_SEED_DAY)).toHaveLength(0);
    expect(larderTraces().at(-1)).toMatchObject({ skipped: 'no_resident', targetAgentId: null });
    expect(town.properties[LARDER_LAST_SEED_PROP]).toBeUndefined();

    addMortal(graph, 'm1', 'a');
    expect(pickLarderRow([{ templateId: 'encounter.no_such_scene', weight: 1 }], state(graph, 0), town, 0, 'm1')).toBeNull();
  });

  it("a Place-gated row is judged where the chosen resident stands, not anywhere in town (review gate)", () => {
    const graph = new WorldGraph();
    const town = addTown(graph, 'a', GLUT);
    graph.addNode({ id: 'a_tavern', type: 'location', name: 'Tavern', properties: { parentLocationId: 'a', sublocationTypeId: 'sublocation-type.tavern' } });
    graph.addNode({ id: 'a_market', type: 'location', name: 'Market', properties: { parentLocationId: 'a', sublocationTypeId: 'sublocation-type.market-district' } });
    addMortal(graph, 'm1', 'a_market');
    const tavernOnly = [{ templateId: 'tavern.drinking_contest', weight: 1 }];
    expect(pickLarderRow(tavernOnly, state(graph, 0), town, 0, 'm1')).toBeNull();
    addMortal(graph, 'm0', 'a_tavern');
    expect(pickLarderRow(tavernOnly, state(graph, 0), town, 0, 'm0')).toBe('tavern.drinking_contest');
    // In the planter, the market-standing resident is never handed the tavern scene.
    for (let d = 0; d < 40; d++) {
      const g2 = new WorldGraph();
      const t2 = addTown(g2, 'a', GLUT);
      g2.addNode({ id: 'a_market', type: 'location', name: 'Market', properties: { parentLocationId: 'a', sublocationTypeId: 'sublocation-type.market-district' } });
      addMortal(g2, 'm1', 'a_market');
      for (const s of plant(g2, t2, d * TICKS_PER_DAY, false, 0)) expect(s.templateId).not.toBe('tavern.drinking_contest');
    }
  });

  it('the kill switch plants nothing and traces disabled', () => {
    setLarderSeedsEnabledOverride(false);
    const graph = new WorldGraph();
    const town = addTown(graph, 'a');
    addMortal(graph, 'm1', 'a');
    expect(plant(graph, town, 0, true, FAMINE_SEED_DAY)).toHaveLength(0);
    expect(larderTraces().at(-1)).toMatchObject({ skipped: 'disabled' });
  });
});

describe('the pick', () => {
  it('is the same for the same town and tick, and spreads across rows over ticks', () => {
    const graph = new WorldGraph();
    const town = addTown(graph, 'a');
    addMortal(graph, 'm1', 'a');
    const s = state(graph, 0);
    expect(pickLarderRow(FAMINE_SEED_ROWS, s, town, 120, 'm1')).toBe(pickLarderRow(FAMINE_SEED_ROWS, s, town, 120, 'm1'));
    const seen = new Set<string | null>();
    for (let d = 0; d < 60; d++) seen.add(pickLarderRow(FAMINE_SEED_ROWS, s, town, d * TICKS_PER_DAY, 'm1'));
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});

describe('in the unrest daily pass', () => {
  it("a hungry town's second day plants one famine story beside nothing else", () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', { resources: SCARCE_GRAIN });
    addMortal(graph, 'm1', 'a');
    let r = phaseUnrest(state(graph, 0), { pressure: true });
    expect(r.pendingEncounterSeeds ?? []).toHaveLength(0);
    r = phaseUnrest(state(graph, TICKS_PER_DAY), { pressure: true });
    expect(r.pendingEncounterSeeds).toHaveLength(1);
    expect(r.pendingEncounterSeeds![0].sourceEncounterId).toBe('larder');
  });

  it('on the day a hungry town turns Lawless the riot plants and the larder waits', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', { resources: SCARCE_GRAIN, unrest: 55 });
    addMortal(graph, 'm1', 'a');
    phaseUnrest(state(graph, 0), { pressure: true });
    graph.addNode({ id: LOCATION_TRAIT_IDS.lawless, type: 'trait', name: 'lawless', properties: {} });
    graph.addEdge({ id: 'ht', source: 'a', target: LOCATION_TRAIT_IDS.lawless, type: 'has_trait', properties: {} });
    const r = phaseUnrest(state(graph, TICKS_PER_DAY), { pressure: true });
    expect(r.pendingEncounterSeeds).toHaveLength(1);
    expect(r.pendingEncounterSeeds![0].templateId).toBe(GRANARY_RIOT_TEMPLATE_ID);
    expect(larderTraces().at(-1)).toMatchObject({ skipped: 'riot' });
  });
});
