/**
 * Tests: Economic Power phase (THR-617) — monopoly resolution, sphere drift,
 * and the faction economic gold term.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { phaseEconomicPower } from '../economicPower';
import { computeRawScore } from '../../domainCapability';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import {
  ECON_POWER_SCAN_INTERVAL_TICKS,
  ECON_SPHERE_DRIFT_PER_TICK,
  ECON_FACTION_POWER_WEIGHT,
  SCARCITY_ARC_UNREST_DELTA,
} from '../../../data/economic-power-config';
import type { GameState } from '../../../types/gameState';
import type { PhaseContext } from '../../phaseRegistry';

const SCAN = ECON_POWER_SCAN_INTERVAL_TICKS;
const ctx = {} as PhaseContext;

function makeState(tick: number, graph: WorldGraph): GameState {
  return {
    tick, seed: 42, graph, tickEvents: [], chronicleEntries: [], pendingSpherePressures: [],
  } as unknown as GameState;
}

function addTown(graph: WorldGraph, id: string, name: string, props: Record<string, unknown> = {}): void {
  graph.addNode({
    id, type: 'location', name,
    properties: { terrain: 'plains', locationSubtype: 'town', hexCol: 0, hexRow: 0, ...props },
  });
}

function addFaction(graph: WorldGraph, id: string, name = `Faction ${id}`): void {
  graph.addNode({ id, type: 'actor', name, properties: { actorType: 'faction' } });
}

function control(graph: WorldGraph, factionId: string, locId: string): void {
  graph.addEdge({ id: `c_${factionId}_${locId}`, source: factionId, target: locId, type: 'controls', properties: {} });
}

const ironBag = { iron_ore: { resourceId: 'iron_ore', quantity: 50 } };

describe('phaseEconomicPower (THR-617)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('does nothing off the scan cadence', () => {
    const graph = new WorldGraph();
    const result = phaseEconomicPower(makeState(SCAN + 1, graph), ctx);
    expect(result).toEqual({});
  });

  it('establishes a monopoly at the control fraction and narrates it through the chronicle', () => {
    const graph = new WorldGraph();
    addFaction(graph, 'f1', 'The Iron Ring');
    addTown(graph, 'a', 'Amine', { resources: ironBag });
    addTown(graph, 'b', 'Bmine', { resources: ironBag });
    addTown(graph, 'c', 'Cmine', { resources: ironBag });
    control(graph, 'f1', 'a');
    control(graph, 'f1', 'b'); // 2/3 = 0.67 ≥ 0.6

    const result = phaseEconomicPower(makeState(SCAN, graph), ctx);

    expect(graph.getNode('f1')!.properties.monopolies).toEqual(['iron_ore']);
    expect(result.chronicleEntries?.length).toBeGreaterThan(0);
    expect(result.tickEvents?.length).toBeGreaterThan(0);
    const traces = getTraces() as unknown as Array<Record<string, unknown>>;
    const transition = traces.find((t) => t.category === 'monopoly_transition');
    expect(transition).toMatchObject({ factionId: 'f1', resourceId: 'iron_ore', transition: 'established' });
  });

  it('breaks a monopoly when control drops, and stays quiet below thresholds', () => {
    const graph = new WorldGraph();
    addFaction(graph, 'f1', 'The Iron Ring');
    addTown(graph, 'a', 'Amine', { resources: ironBag });
    addTown(graph, 'b', 'Bmine', { resources: ironBag });
    addTown(graph, 'c', 'Cmine', { resources: ironBag });
    control(graph, 'f1', 'a'); // 1/3 — below fraction
    graph.getNode('f1')!.properties.monopolies = ['iron_ore']; // previously held

    phaseEconomicPower(makeState(SCAN, graph), ctx);

    expect(graph.getNode('f1')!.properties.monopolies).toEqual([]);
    const traces = getTraces() as unknown as Array<Record<string, unknown>>;
    expect(traces.find((t) => t.category === 'monopoly_transition')).toMatchObject({ transition: 'broken' });

    // Single-location resources can never be monopolies.
    clearTraces();
    const g2 = new WorldGraph();
    addFaction(g2, 'f1');
    addTown(g2, 'only', 'Only Mine', { resources: ironBag });
    control(g2, 'f1', 'only');
    phaseEconomicPower(makeState(SCAN, g2), ctx);
    expect(g2.getNode('f1')!.properties.monopolies ?? []).toEqual([]);
  });

  it('action-written monopolyControlledBy counts toward the control fraction', () => {
    const graph = new WorldGraph();
    addFaction(graph, 'f1');
    addTown(graph, 'a', 'Amine', { resources: ironBag, monopolyControlledBy: 'f1' });
    addTown(graph, 'b', 'Bmine', { resources: ironBag, monopolyControlledBy: 'f1' });
    addTown(graph, 'c', 'Cmine', { resources: ironBag });

    phaseEconomicPower(makeState(SCAN, graph), ctx);
    expect(graph.getNode('f1')!.properties.monopolies).toEqual(['iron_ore']);
  });

  it('sustained flows drift endpoint sphere pressure toward the cargo affinity', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford');
    addTown(graph, 'b', 'Bmark');
    graph.addEdge({
      id: 'r1', source: 'a', target: 'b', type: 'trades_with',
      properties: { volume: 2, goodsType: 'grain', manifest: { goods: ['grain'], totalValue: 1, carriesStaple: true } },
    });

    const result = phaseEconomicPower(makeState(SCAN, graph), ctx);
    const pressures = result.pendingSpherePressures ?? [];
    expect(pressures).toHaveLength(2); // both endpoints
    expect(pressures[0]).toMatchObject({
      sphere: 'life', // grain's affinity
      source: 'environmental',
      magnitude: ECON_SPHERE_DRIFT_PER_TICK * SCAN,
    });
  });

  it('a scarce staple opens an arc, advances per scan, raises unrest, and seeds interventions', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford', {
      resources: { grain: { resourceId: 'grain', quantity: 2, stockTier: 'scarce' } },
    });
    graph.addNode({ id: 'ag1', type: 'actor', name: 'Local', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_ag1', source: 'ag1', target: 'a', type: 'located_at', properties: {} });

    // Scan 1: arc opens at shortage.
    let state = makeState(SCAN, graph);
    let result = phaseEconomicPower(state, ctx);
    expect((graph.getNode('a')!.properties.scarcityArc as { phase: string }).phase).toBe('shortage');

    // Scan 2: shortage -> hoarding (mct intervention seed).
    state = makeState(SCAN * 2, graph);
    result = phaseEconomicPower(state, ctx);
    expect((graph.getNode('a')!.properties.scarcityArc as { phase: string }).phase).toBe('hoarding');
    expect(result.pendingEncounterSeeds?.[0]?.encounterFamily).toBe('mct.quest');

    // Scan 3: hoarding -> unrest (+unrest, cg seed).
    state = makeState(SCAN * 3, graph);
    result = phaseEconomicPower(state, ctx);
    expect((graph.getNode('a')!.properties.unrest as number)).toBe(SCARCITY_ARC_UNREST_DELTA);
    expect(result.pendingEncounterSeeds?.[0]?.encounterFamily).toBe('cg.quest');

    // Scan 4: unrest -> flashpoint (+more unrest, embargo template seed, chronicle beat).
    state = makeState(SCAN * 4, graph);
    result = phaseEconomicPower(state, ctx);
    expect((graph.getNode('a')!.properties.scarcityArc as { phase: string }).phase).toBe('flashpoint');
    expect(result.pendingEncounterSeeds?.[0]?.templateId).toBe('encounter_route_embargo');
    expect(result.chronicleEntries?.some((c) => c.title.startsWith('Flashpoint'))).toBe(true);
  });

  it('recovery past unrest dissolves the arc with a cool-failure scar', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford', {
      resources: { grain: { resourceId: 'grain', quantity: 60, stockTier: 'surplus' } },
      scarcityArc: { resourceId: 'grain', phase: 'unrest', sinceTick: 0 },
    });
    const result = phaseEconomicPower(makeState(SCAN, graph), ctx);
    expect(graph.getNode('a')!.properties.scarcityArc).toBeUndefined();
    expect(result.chronicleEntries?.some((c) => c.prose.includes('Half-averted'))).toBe(true);
  });

  it('the faction economic gold term raises capability with holdings prosperity', () => {
    const graph = new WorldGraph();
    addFaction(graph, 'f_rich');
    addFaction(graph, 'f_poor');
    addTown(graph, 'rich_town', 'Richton', { prosperity: 80 });
    control(graph, 'f_rich', 'rich_town');

    const rich = computeRawScore(graph, 'f_rich', 'gold');
    const poor = computeRawScore(graph, 'f_poor', 'gold');
    expect(rich).toBeCloseTo(poor + 0.8 * ECON_FACTION_POWER_WEIGHT, 5);
  });
});
