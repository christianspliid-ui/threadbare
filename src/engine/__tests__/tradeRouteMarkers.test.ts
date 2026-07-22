/**
 * Tests: trade-route map adapters (THR-670) — lines + per-hex tooltip index.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { buildTradeRouteLines, buildRouteTooltipsByHex } from '../tradeRouteMarkers';

function addTown(graph: WorldGraph, id: string, name: string, col: number, row: number): void {
  graph.addNode({
    id, type: 'location', name,
    properties: { terrain: 'plains', locationSubtype: 'town', hexCol: col, hexRow: row },
  });
}

function world(): WorldGraph {
  const g = new WorldGraph();
  addTown(g, 'a', 'Aford', 1, 1);
  addTown(g, 'b', 'Bmark', 4, 2);
  g.addEdge({
    id: 'r1', source: 'a', target: 'b', type: 'trades_with',
    properties: {
      volume: 3, goodsType: 'gemstones', threatened: true,
      manifest: { goods: ['gemstones', 'grain'], totalValue: 2.4, carriesStaple: true },
    },
  });
  return g;
}

describe('tradeRouteMarkers (THR-670)', () => {
  it('builds one line per route with cargo + threatened state', () => {
    const lines = buildTradeRouteLines(world());
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      from: { col: 1, row: 1 },
      to: { col: 4, row: 2 },
      volume: 3,
      threatened: true,
      goods: ['gemstones', 'grain'],
      carriesStaple: true,
    });
  });

  it('skips routes whose endpoints have no hex coords (fail-soft)', () => {
    const g = world();
    g.addNode({ id: 'c', type: 'location', name: 'Nowhere', properties: { terrain: 'plains' } });
    g.addEdge({ id: 'r2', source: 'a', target: 'c', type: 'trades_with', properties: { volume: 1 } });
    expect(buildTradeRouteLines(g)).toHaveLength(1);
  });

  it('indexes tooltips at BOTH endpoints, named from each side', () => {
    const byHex = buildRouteTooltipsByHex(world());
    expect(byHex.get('1,1')?.[0]).toMatchObject({ otherName: 'Bmark', carriesStaple: true, threatened: true });
    expect(byHex.get('4,2')?.[0]).toMatchObject({ otherName: 'Aford', goods: ['gemstones', 'grain'] });
  });

  it('legacy goodsType-only routes still carry a synthesized manifest', () => {
    const g = new WorldGraph();
    addTown(g, 'a', 'Aford', 0, 0);
    addTown(g, 'b', 'Bmark', 2, 0);
    g.addEdge({ id: 'r1', source: 'a', target: 'b', type: 'trades_with', properties: { volume: 2, goodsType: 'grain' } });
    const lines = buildTradeRouteLines(g);
    expect(lines[0].goods).toEqual(['grain']);
    expect(lines[0].carriesStaple).toBe(true);
  });
});
