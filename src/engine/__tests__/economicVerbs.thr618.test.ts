/**
 * Tests: THR-618 P4 divine economic verbs — reveal_vein / guide_caravan /
 * sour_mine graph-executor cases.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps } from '../graphOpExecutor';
import { readResources } from '../resourceEconomy';
import {
  LOC_REVEAL_VEIN_QUANTITY,
  LOC_GUIDE_CARAVAN_VOLUME_DELTA,
  LOC_SOUR_MINE_STOCK_DELTA,
} from '../../data/location-action-constants';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import type { GraphOpContext } from '../../types/graphOp';

const ctx = (targetId: string): GraphOpContext => ({
  actorId: 'asc', targetId, locationId: targetId, tick: 50,
});

function addTown(graph: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  graph.addNode({
    id, type: 'location', name: `Town ${id}`,
    properties: { terrain: 'hills', locationSubtype: 'town', hexCol: 0, hexRow: 0, ...props },
  });
}

describe('THR-618 divine economic verbs', () => {
  it('reveal_vein surfaces a terrain-appropriate non-staple deposit', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a');
    const { results } = executeGraphOps(graph, [{ op: 'reveal_vein', nodeId: '$target' }], ctx('a'));
    expect(results[0].success).toBe(true);
    const resources = readResources(graph.getNode('a')!.properties);
    const ids = Object.keys(resources);
    expect(ids.length).toBe(1);
    expect(resources[ids[0]].quantity).toBe(LOC_REVEAL_VEIN_QUANTITY);
  });

  it('guide_caravan boosts, protects, and refreshes every touching route', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a'); addTown(graph, 'b');
    graph.addEdge({
      id: 'r1', source: 'a', target: 'b', type: 'trades_with',
      properties: { volume: 2, goodsType: 'grain', threatened: true, threatenedSinceTick: 10, lastTraded: 1 },
    });
    const { results } = executeGraphOps(graph, [{ op: 'guide_caravan', nodeId: '$target' }], ctx('a'));
    expect(results[0].success).toBe(true);
    const route = graph.getEdgesByType('trades_with')[0];
    expect(route.properties.volume).toBe(2 + LOC_GUIDE_CARAVAN_VOLUME_DELTA);
    expect(route.properties.threatened).toBe(false);
    expect(route.properties.lastTraded).toBe(50);
  });

  it('sour_mine drains non-staple deposits but never touches staples', () => {
    const graph = new WorldGraph();
    addTown(graph, 'a', {
      resources: {
        iron_ore: { resourceId: 'iron_ore', quantity: 60 },
        grain: { resourceId: 'grain', quantity: 40 },
      },
    });
    const { results } = executeGraphOps(graph, [{ op: 'sour_mine', nodeId: '$target' }], ctx('a'));
    expect(results[0].success).toBe(true);
    const resources = readResources(graph.getNode('a')!.properties);
    expect(resources.iron_ore.quantity).toBe(60 - LOC_SOUR_MINE_STOCK_DELTA);
    expect(resources.grain.quantity).toBe(40); // staples untouched
  });

  it('the three templates are registered, ascendant-only, and beat-granted (never starter)', async () => {
    const { ASCENDANT_MILESTONE_BEATS } = await import('../../data/ascendant-milestone-beats');
    const granted = new Set(ASCENDANT_MILESTONE_BEATS.flatMap((b) => b.grantsActionIds ?? []));
    for (const id of ['loc.reveal_vein', 'loc.guide_caravan', 'loc.sour_mine']) {
      const t = getUnifiedTemplateById(id);
      expect(t, id).toBeDefined();
      expect(t!.actorAffinities).toEqual(['ascendant']);
      expect(t!.starter).not.toBe(true);
      expect(granted.has(id), `${id} beat-granted`).toBe(true);
    }
  });
});
