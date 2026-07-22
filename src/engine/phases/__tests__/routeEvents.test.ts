/**
 * Tests: Route Events phase (THR-669) — cargo manifests materialize into
 * encounter seeds. Eligibility, determinism, dedupe, caps, threatened
 * lifecycle, and template registration.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { phaseRouteEvents } from '../routeEvents';
import { mulberry32 } from '../../../lib/prng';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import {
  ROUTE_EVENT_SCAN_INTERVAL_TICKS,
  ROUTE_AMBUSH_RICHNESS_MIN,
  ROUTE_AMBUSH_CHANCE,
  ROUTE_TOLL_CHANCE,
  ROUTE_EMBARGO_CHANCE,
  ROUTE_THREATENED_CLEAR_TICKS,
  ROUTE_AMBUSH_TEMPLATE_ID,
  ROUTE_TOLL_TEMPLATE_ID,
  ROUTE_EMBARGO_TEMPLATE_ID,
  ROUTE_EVENT_MAX_SEEDS_PER_SCAN,
} from '../../../data/route-event-config';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import type { GameState } from '../../../types/gameState';
import type { PhaseContext } from '../../phaseRegistry';

const SCAN = ROUTE_EVENT_SCAN_INTERVAL_TICKS;
const ctx = {} as PhaseContext;

/** Find a seed whose FIRST roll at the scan tick passes (or fails) `chance`. */
function seedWhereFirstRoll(tick: number, chance: number, pass: boolean): number {
  for (let s = 1; s < 10_000; s++) {
    const roll = mulberry32(s + tick * 61)();
    if (pass ? roll < chance : roll >= chance) return s;
  }
  throw new Error('no seed found');
}

function makeState(tick: number, graph: WorldGraph, seed: number, extra: Partial<GameState> = {}): GameState {
  return { tick, seed, graph, pendingEncounterSeeds: [], ...extra } as unknown as GameState;
}

function addTown(graph: WorldGraph, id: string, name: string, extraProps: Record<string, unknown> = {}): void {
  graph.addNode({
    id, type: 'location', name,
    properties: { terrain: 'plains', locationSubtype: 'town', hexCol: 0, hexRow: 0, ...extraProps },
  });
}

function addAgent(graph: WorldGraph, id: string, locId: string): void {
  graph.addNode({ id, type: 'actor', name: `Agent ${id}`, properties: { actorType: 'individual' } });
  graph.addEdge({ id: `e_loc_${id}`, source: id, target: locId, type: 'located_at', properties: {} });
}

function addRoute(graph: WorldGraph, id: string, a: string, b: string, manifest: Record<string, unknown>): void {
  graph.addEdge({
    id, source: a, target: b, type: 'trades_with',
    properties: { volume: 2, goodsType: 'unknown', manifest },
  });
}

const richManifest = { goods: ['gemstones', 'pearls'], totalValue: ROUTE_AMBUSH_RICHNESS_MIN + 0.5, carriesStaple: false };
const poorManifest = { goods: ['timber'], totalValue: 0.5, carriesStaple: false };
const stapleManifest = { goods: ['grain'], totalValue: 1.0, carriesStaple: true };

describe('phaseRouteEvents (THR-669)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('does nothing off the scan cadence', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford'); addTown(graph, 'b', 'Bmark');
    addRoute(graph, 'r1', 'a', 'b', richManifest);
    addAgent(graph, 'ag1', 'a');
    const result = phaseRouteEvents(makeState(SCAN + 1, graph, 42), ctx);
    expect(result.pendingEncounterSeeds).toBeUndefined();
  });

  it('rich cargo plants an ambush seed and marks the route threatened', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford'); addTown(graph, 'b', 'Bmark');
    addRoute(graph, 'r1', 'a', 'b', richManifest);
    addAgent(graph, 'ag1', 'a');
    const seed = seedWhereFirstRoll(SCAN, ROUTE_AMBUSH_CHANCE, true);

    const result = phaseRouteEvents(makeState(SCAN, graph, seed), ctx);

    const seeds = result.pendingEncounterSeeds ?? [];
    expect(seeds).toHaveLength(1);
    expect(seeds[0].templateId).toBe(ROUTE_AMBUSH_TEMPLATE_ID);
    expect(seeds[0].targetAgentId).toBe('ag1');
    expect(graph.getEdgesByType('trades_with')[0].properties.threatened).toBe(true);

    const traces = getTraces() as unknown as Array<Record<string, unknown>>;
    expect(traces.filter((t) => t.category === 'route_event_seeded')).toHaveLength(1);
    expect(traces.filter((t) => t.category === 'route_event_scan')).toHaveLength(1);
  });

  it('a failed roll plants nothing (deterministic either way)', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford'); addTown(graph, 'b', 'Bmark');
    addRoute(graph, 'r1', 'a', 'b', richManifest);
    addAgent(graph, 'ag1', 'a');
    const seed = seedWhereFirstRoll(SCAN, ROUTE_AMBUSH_CHANCE, false);
    const result = phaseRouteEvents(makeState(SCAN, graph, seed), ctx);
    expect(result.pendingEncounterSeeds).toBeUndefined();
  });

  it('a threatened route is not re-ambushed, and the flag auto-clears after the horizon', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford'); addTown(graph, 'b', 'Bmark');
    addRoute(graph, 'r1', 'a', 'b', richManifest);
    addAgent(graph, 'ag1', 'a');
    const edge = graph.getEdgesByType('trades_with')[0];
    graph.updateEdge(edge.id, { properties: { ...edge.properties, threatened: true, threatenedSinceTick: 0 } });

    const seed = seedWhereFirstRoll(SCAN, ROUTE_AMBUSH_CHANCE, true);
    const early = phaseRouteEvents(makeState(SCAN, graph, seed), ctx);
    expect(early.pendingEncounterSeeds).toBeUndefined(); // still threatened, not eligible

    // Past the horizon the hygiene pass clears the flag (same scan then re-rolls).
    const lateTick = Math.ceil(ROUTE_THREATENED_CLEAR_TICKS / SCAN) * SCAN;
    phaseRouteEvents(makeState(lateTick, graph, 999_999), ctx);
    expect(graph.getEdgesByType('trades_with')[0].properties.threatened).toBe(false);
  });

  it('hostile endpoint controllers make a toll dispute eligible; friendly ones do not', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford'); addTown(graph, 'b', 'Bmark');
    graph.addNode({ id: 'f1', type: 'actor', name: 'F1', properties: { actorType: 'faction' } });
    graph.addNode({ id: 'f2', type: 'actor', name: 'F2', properties: { actorType: 'faction' } });
    graph.addEdge({ id: 'c1', source: 'f1', target: 'a', type: 'controls', properties: {} });
    graph.addEdge({ id: 'c2', source: 'f2', target: 'b', type: 'controls', properties: {} });
    addRoute(graph, 'r1', 'a', 'b', poorManifest);
    addAgent(graph, 'ag1', 'b');

    const seed = seedWhereFirstRoll(SCAN, ROUTE_TOLL_CHANCE, true);
    const friendly = phaseRouteEvents(makeState(SCAN, graph, seed), ctx);
    expect(friendly.pendingEncounterSeeds).toBeUndefined(); // no hostility yet

    graph.addEdge({ id: 'h1', source: 'f1', target: 'f2', type: 'hostile_to', properties: {} });
    const hostile = phaseRouteEvents(makeState(SCAN, graph, seed), ctx);
    expect(hostile.pendingEncounterSeeds?.[0]?.templateId).toBe(ROUTE_TOLL_TEMPLATE_ID);
  });

  it('staple cargo into a scarce endpoint makes an embargo eligible', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford');
    addTown(graph, 'b', 'Bmark', { resourceBalance: -0.5 });
    addRoute(graph, 'r1', 'a', 'b', stapleManifest);
    addAgent(graph, 'ag1', 'b');

    const seed = seedWhereFirstRoll(SCAN, ROUTE_EMBARGO_CHANCE, true);
    const result = phaseRouteEvents(makeState(SCAN, graph, seed), ctx);
    expect(result.pendingEncounterSeeds?.[0]?.templateId).toBe(ROUTE_EMBARGO_TEMPLATE_ID);

    // Well-fed endpoints: not eligible at all.
    const graph2 = new WorldGraph();
    addTown(graph2, 'a', 'Aford', { resourceBalance: 0.4 });
    addTown(graph2, 'b', 'Bmark', { resourceBalance: 0.4 });
    addRoute(graph2, 'r1', 'a', 'b', stapleManifest);
    addAgent(graph2, 'ag1', 'b');
    const none = phaseRouteEvents(makeState(SCAN, graph2, seed), ctx);
    expect(none.pendingEncounterSeeds).toBeUndefined();
  });

  it('a pending seed for the route dedupes further plants; no endpoint agent skips the route', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', 'Aford'); addTown(graph, 'b', 'Bmark');
    addRoute(graph, 'r1', 'a', 'b', richManifest);
    addAgent(graph, 'ag1', 'a');
    const seed = seedWhereFirstRoll(SCAN, ROUTE_AMBUSH_CHANCE, true);

    const withPending = makeState(SCAN, graph, seed, {
      pendingEncounterSeeds: [{
        seedId: `route_event_r1_${SCAN - SCAN}`, sourceEncounterId: 'route_event_phase',
        sourceReactionId: 'ambush', templateId: ROUTE_AMBUSH_TEMPLATE_ID, targetAgentId: 'ag1',
        eligibleAfterTick: 0, priority: 1, seedLabel: 'x', plantedTick: 0,
      }],
    });
    expect(phaseRouteEvents(withPending, ctx).pendingEncounterSeeds).toBeUndefined();

    const graph2 = new WorldGraph();
    addTown(graph2, 'a', 'Aford'); addTown(graph2, 'b', 'Bmark');
    addRoute(graph2, 'r1', 'a', 'b', richManifest);
    expect(phaseRouteEvents(makeState(SCAN, graph2, seed), ctx).pendingEncounterSeeds).toBeUndefined();
  });

  it('caps seeds per scan at ROUTE_EVENT_MAX_SEEDS_PER_SCAN', () => {
    const graph = new WorldGraph();
    // Many rich routes, each with its own agent; a seed that passes every roll
    // is unlikely, so drive chance-free by making rolls pass via high richness
    // and scanning enough routes with a first-roll-pass seed. Statistically we
    // just assert the cap is never exceeded.
    for (let i = 0; i < 12; i++) {
      addTown(graph, `a${i}`, `A${i}`); addTown(graph, `b${i}`, `B${i}`);
      addRoute(graph, `r${i}`, `a${i}`, `b${i}`, richManifest);
      addAgent(graph, `ag${i}`, `a${i}`);
    }
    const seed = seedWhereFirstRoll(SCAN, ROUTE_AMBUSH_CHANCE, true);
    const result = phaseRouteEvents(makeState(SCAN, graph, seed), ctx);
    expect((result.pendingEncounterSeeds ?? []).length).toBeLessThanOrEqual(ROUTE_EVENT_MAX_SEEDS_PER_SCAN);
  });

  it('the three route-event templates are registered under their catalyst ids', () => {
    for (const id of [ROUTE_AMBUSH_TEMPLATE_ID, ROUTE_TOLL_TEMPLATE_ID, ROUTE_EMBARGO_TEMPLATE_ID]) {
      const t = getUnifiedTemplateById(id);
      expect(t, id).toBeDefined();
      expect(t!.actorAffinities).toContain('individual');
    }
  });
});
