/**
 * THR-1389 — the single-source run prices every destination exactly as the
 * per-destination run does, and the per-destination run still prices exactly as the
 * pre-THR-1389 implementation did.
 *
 * `legacyFindShortestPath` below is the shipped algorithm before this change, copied
 * verbatim in its relaxation and reconstruction (linear-scan frontier, early exit at the
 * destination). It is the reference the new heap-based core is pinned to: same edges,
 * same `computeEdgeCost`, same road discount — a cost mismatch anywhere is a regression.
 *
 * The graph is a hand-built fixture with adjacency, a contained sublocation, a major
 * road and a trail, so every relaxation branch of the core is exercised; the seeded-world
 * equality lives in the heavy lane (`pathfindingSingleSource.heavy.test.ts`).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { findShortestPath, findAllShortestPaths } from '../pathfinding';
import { computeEdgeCost } from '../movementCost';
import { ROAD_MAJOR_COST_MULTIPLIER, ROAD_TRAIL_COST_MULTIPLIER, MIN_EDGE_COST } from '../../data/movement-content';

const AGENT = 'actor_walker';

function addLoc(g: WorldGraph, id: string, terrain: string, extra: Record<string, unknown> = {}): void {
  g.addNode({ id, name: id, type: 'location', properties: { terrain, locationType: 'town', hexCol: 0, hexRow: 0, ...extra } });
}
function adj(g: WorldGraph, a: string, b: string): void {
  g.addEdge({ id: `adj_${a}_${b}`, source: a, target: b, type: 'adjacent', properties: {} });
}
function road(g: WorldGraph, a: string, b: string, roadType: 'major' | 'trail', totalCost: number): void {
  g.addEdge({ id: `road_${a}_${b}`, source: a, target: b, type: 'road', properties: { roadType, totalCost, hexPath: [{ col: 0, row: 0 }, { col: 1, row: 0 }] } });
}

/** A ring of towns with a shortcut road, a trail, a contained room and an island. */
function fixture(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: AGENT, name: 'Walker', type: 'actor', properties: { actorType: 'individual' } });
  for (const [id, terrain] of [['a', 'plains'], ['b', 'forest'], ['c', 'hills'], ['d', 'plains'], ['e', 'mountains'], ['island', 'plains']] as const) addLoc(g, id, terrain);
  adj(g, 'a', 'b'); adj(g, 'b', 'c'); adj(g, 'c', 'd'); adj(g, 'd', 'e'); adj(g, 'e', 'a');
  road(g, 'a', 'd', 'major', 4);    // a shortcut that beats a→b→c→d on foot (discounted to the edge floor)
  road(g, 'e', 'c', 'trail', 2);    // reverse-direction road read via incoming edges, cheaper than c→d→e
  g.addNode({ id: 'room', name: 'room', type: 'location', properties: { terrain: 'plains', parentLocationId: 'c', locationSubtype: 'granary' } });
  g.addEdge({ id: 'contains_c_room', source: 'c', target: 'room', type: 'contains', properties: {} });
  return g;
}

/** The pre-THR-1389 algorithm, verbatim in its relaxation (kept as the reference). */
function legacyFindShortestPath(graph: WorldGraph, agentId: string, startId: string, endId: string): { path: string[]; totalCost: number } | null {
  if (startId === endId) return { path: [], totalCost: 0 };
  const startNode = graph.getNode(startId); const endNode = graph.getNode(endId);
  if (!startNode || !endNode || startNode.type !== 'location' || endNode.type !== 'location') return null;
  const distance = new Map<string, number>([[startId, 0]]);
  const parent = new Map<string, string>();
  const unvisited = new Set<string>([startId]);
  const roadCost = (e: { properties: Record<string, unknown> }): number | null => {
    const t = e.properties.totalCost; const rt = e.properties.roadType; const hp = e.properties.hexPath as unknown[] | undefined;
    if (typeof t !== 'number' || !isFinite(t) || (rt !== 'major' && rt !== 'trail') || !hp || hp.length < 2) return null;
    return Math.max(MIN_EDGE_COST, t * (rt === 'major' ? ROAD_MAJOR_COST_MULTIPLIER : ROAD_TRAIL_COST_MULTIPLIER));
  };
  while (unvisited.size > 0) {
    let current: string | null = null; let minDist = Infinity;
    for (const id of unvisited) { const d = distance.get(id) ?? Infinity; if (d < minDist) { minDist = d; current = id; } }
    if (current === null || minDist === Infinity) break;
    if (current === endId) {
      const path: string[] = []; let cur = endId;
      while (parent.has(cur)) { path.unshift(cur); cur = parent.get(cur)!; }
      return { path, totalCost: distance.get(endId) ?? 0 };
    }
    unvisited.delete(current);
    for (const edge of [...graph.getOutgoingEdges(current, 'adjacent'), ...graph.getOutgoingEdges(current, 'contains')]) {
      const n = graph.getNode(edge.target); if (!n || n.type !== 'location') continue;
      const c = computeEdgeCost(graph, agentId, current, edge.target).totalCost; if (c === Infinity) continue;
      const nd = distance.get(current)! + c;
      if (nd < (distance.get(edge.target) ?? Infinity)) { distance.set(edge.target, nd); parent.set(edge.target, current); unvisited.add(edge.target); }
    }
    for (const edge of graph.getOutgoingEdges(current, 'road')) { const c = roadCost(edge); if (c === null) continue; const nd = distance.get(current)! + c; if (nd < (distance.get(edge.target) ?? Infinity)) { distance.set(edge.target, nd); parent.set(edge.target, current); unvisited.add(edge.target); } }
    for (const edge of graph.getIncomingEdges(current, 'road')) { const c = roadCost(edge); if (c === null) continue; const nd = distance.get(current)! + c; if (nd < (distance.get(edge.source) ?? Infinity)) { distance.set(edge.source, nd); parent.set(edge.source, current); unvisited.add(edge.source); } }
  }
  return null;
}

describe('single-source shortest paths (THR-1389)', () => {
  it('prices every reachable destination exactly as the per-destination run, and as the legacy algorithm', () => {
    const g = fixture();
    const all = findAllShortestPaths(g, AGENT, 'a');
    const destinations = ['b', 'c', 'd', 'e', 'room'];
    for (const id of destinations) {
      const one = findShortestPath(g, AGENT, 'a', id);
      const legacy = legacyFindShortestPath(g, AGENT, 'a', id);
      expect(one, id).not.toBeNull();
      expect(legacy, id).not.toBeNull();
      expect(all.get(id)?.totalCost, id).toBeCloseTo(one!.totalCost, 9);
      expect(one!.totalCost, id).toBeCloseTo(legacy!.totalCost, 9);
      expect(all.get(id)?.path, id).toEqual(one!.path);
    }
    expect(all.has('island')).toBe(false);
    expect(findShortestPath(g, AGENT, 'a', 'island')).toBeNull();
    expect(all.has('a')).toBe(false);
  });

  it('uses the major road when it beats walking, and carries the segment', () => {
    const g = fixture();
    const toD = findAllShortestPaths(g, AGENT, 'a').get('d')!;
    const walked = ['b', 'c'].reduce((sum, _, i, arr) => sum + computeEdgeCost(g, AGENT, i === 0 ? 'a' : arr[i - 1], arr[i]).totalCost, 0) + computeEdgeCost(g, AGENT, 'c', 'd').totalCost;
    expect(toD.totalCost).toBeLessThan(walked);
    expect(toD.path).toEqual(['d']);
    expect(toD.roadSegments?.[0]?.roadType).toBe('major');
  });

  it('reads a trail against its direction through the incoming road edges', () => {
    const g = fixture();
    const fromC = findAllShortestPaths(g, AGENT, 'c');
    expect(fromC.get('e')?.roadSegments?.[0]?.roadType).toBe('trail');
    expect(fromC.get('e')?.totalCost).toBeCloseTo(legacyFindShortestPath(g, AGENT, 'c', 'e')!.totalCost, 9);
  });

  it('returns an empty map from a non-location and never prices the start', () => {
    const g = fixture();
    expect(findAllShortestPaths(g, AGENT, AGENT).size).toBe(0);
    expect(findAllShortestPaths(g, AGENT, 'nowhere').size).toBe(0);
  });
});
