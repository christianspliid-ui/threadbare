/**
 * THR-1618 — The Builder's Legacy must not be complete before the player acts.
 *
 * Worldgen writes 1–2 `constructed_by` edges per location (166 on seed 42), and
 * the unscoped `edge_count` condition counted every one of them, so all three
 * stages (2 / 5 / 8 builds) were met at tick 0. The mandate now scopes its count
 * with `sinceMandateStart`: only edges stamped `properties.tick` at or after the
 * mandate's `assignedTick` count. Worldgen's edges carry no tick and are excluded.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createMandateState, evaluateMandate, evaluateCondition } from '../mandate';
import { createSublocation } from '../strategicGraphOps';
import { getLocationNodes } from '../sublocationShape';
import { WorldGraph } from '../graph';
import { MANDATE_TEMPLATES } from '../../data/mandate-content';
import type { MandateCondition, MandateDefinition } from '../../types/mandate';

const SEED = 42;
/** A world build is ~1–3 s; give it headroom over vitest's 5 s default. */
const WORLD_TIMEOUT_MS = 30_000;

const buildersLegacy = () =>
  MANDATE_TEMPLATES.find(t => t.id === 'mandate.builders_legacy') as unknown as MandateDefinition;

describe("THR-1618 — The Builder's Legacy scopes its build count to the mandate's start", () => {
  it('every stage condition opts into sinceMandateStart', () => {
    const mandate = buildersLegacy();
    expect(mandate).toBeTruthy();
    for (const stage of mandate.stages) {
      for (const c of stage.conditions) {
        expect(c.type).toBe('edge_count');
        expect(c.params.sinceMandateStart).toBe(true);
      }
    }
  });

  it('setup is unmet at t0 on a seeded world, and met after 2 new constructed_by edges', () => {
    const preset = MAP_SIZE_PRESETS.small;
    const archetype = generateArchetypes(4, SEED)[0];
    const { state } = initializeGameState(archetype, 'Builders', createBalancedCosmology(), SEED, preset.cols, preset.rows);
    const graph = state.graph;

    const worldgenEdges = graph.getAllEdges().filter(e => e.type === 'constructed_by');
    // The precondition that made the bug: worldgen alone clears the culmination bar.
    expect(worldgenEdges.length).toBeGreaterThanOrEqual(8);

    const mandate = buildersLegacy();
    const assignedTick = state.tick;
    let mstate = createMandateState(mandate.id, assignedTick);
    mstate = evaluateMandate(graph, mandate, mstate, state.ascendantId, assignedTick);
    expect(mstate.progress).toBe(0);

    // Two builds after the mandate starts, through the real runtime writer.
    const builder = graph.getNodesByType('actor').find(n => n.properties.actorType === 'individual');
    const places = getLocationNodes(graph);
    expect(builder).toBeTruthy();
    expect(places.length).toBeGreaterThanOrEqual(2);
    const buildTick = assignedTick + 1;
    const first = createSublocation(graph, places[0].id, builder!.id, 'Stonemason Yard', 'workshop', buildTick);
    expect(first.success).toBe(true);
    mstate = evaluateMandate(graph, mandate, mstate, state.ascendantId, buildTick);
    expect(mstate.progress).toBe(0);

    const second = createSublocation(graph, places[1].id, builder!.id, 'Watch Tower', 'workshop', buildTick);
    expect(second.success).toBe(true);
    mstate = evaluateMandate(graph, mandate, mstate, state.ascendantId, buildTick);
    expect(mstate.progress).toBe(1);
  }, WORLD_TIMEOUT_MS);
});

describe('edge_count scoping — unscoped conditions keep their behaviour', () => {
  function graphWith(ticks: Array<number | undefined>): WorldGraph {
    const g = new WorldGraph();
    g.addNode({ id: 'a', type: 'actor', name: 'Builder', properties: { actorType: 'individual' } });
    ticks.forEach((tick, i) => {
      g.addNode({ id: `loc.${i}`, type: 'location', name: `Loc ${i}`, properties: {} });
      g.addEdge({
        id: `cb.${i}`, source: `loc.${i}`, target: 'a', type: 'constructed_by',
        properties: tick === undefined ? {} : { tick },
      });
    });
    return g;
  }
  const cond = (scoped: boolean): MandateCondition => ({
    type: 'edge_count',
    description: 'test',
    params: scoped
      ? { edgeType: 'constructed_by', minCount: 2, sinceMandateStart: true }
      : { edgeType: 'constructed_by', minCount: 2 },
  });

  it('unscoped counts every edge, tick or not', () => {
    const g = graphWith([undefined, undefined]);
    expect(evaluateCondition(g, cond(false), 'asc', { assignedTick: 50 })).toBe(true);
  });

  it('scoped excludes tickless and pre-assignment edges, includes edges at or after assignment', () => {
    expect(evaluateCondition(graphWith([undefined, 10, 49]), cond(true), 'asc', { assignedTick: 50 })).toBe(false);
    expect(evaluateCondition(graphWith([undefined, 50, 51]), cond(true), 'asc', { assignedTick: 50 })).toBe(true);
  });
});
