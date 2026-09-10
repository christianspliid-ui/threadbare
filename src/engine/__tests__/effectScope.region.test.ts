/**
 * A `'region'`-scoped effect lands on the caster's Area (THR-1155).
 *
 * The fixture is built so the *old* answer and the *new* answer disagree, which is the
 * only way this test can fail if the radius approximation ever comes back: a hex two
 * steps from the caster that belongs to a different Area must be excluded, and a hex
 * five steps away — outside the old radius-4 disc — that shares the caster's Area must
 * be included. A grid where membership and distance happened to agree would pass
 * against either implementation and prove nothing.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { resolveScope } from '../effectScope';
import type { AreaProjection } from '../areaProjection';
import { hexKey } from '../../lib/hexKey';
import type { HexCoord } from '../../types';

/** The caster's Area: a long east–west band. */
const HOME_HEXES: HexCoord[] = [
  { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 },
  { col: 3, row: 0 }, { col: 4, row: 0 }, { col: 5, row: 0 },
];
/** The neighbouring Area: immediately north of the caster, two steps away. */
const NEIGHBOUR_HEXES: HexCoord[] = [
  { col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 },
];

function projection(): AreaProjection {
  const hexAreaId = new Map<string, string>();
  for (const h of HOME_HEXES) hexAreaId.set(hexKey(h.col, h.row), 'region_0');
  for (const h of NEIGHBOUR_HEXES) hexAreaId.set(hexKey(h.col, h.row), 'region_1');
  return {
    areas: [
      { id: 'region_0', name: 'The Long Reach', featureType: 'plains', hexes: HOME_HEXES, center: { col: 2, row: 0 } },
      { id: 'region_1', name: 'The Near Moor', featureType: 'wetland', hexes: NEIGHBOUR_HEXES, center: { col: 1, row: 2 } },
    ],
    hexAreaId,
  };
}

/** An agent standing on a hex, through the `located_at` → location → hex chain. */
function putAgent(graph: WorldGraph, id: string, col: number, row: number): void {
  const locId = `loc_${col}_${row}`;
  if (!graph.getNode(locId)) {
    graph.addNode({
      id: locId, type: 'location', name: `Place ${col},${row}`,
      properties: { hexCol: col, hexRow: row, locationSubtype: 'hamlet' },
    });
  }
  graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual' } });
  graph.addEdge({ id: `edge_at_${id}`, source: id, target: locId, type: 'located_at', properties: {} });
}

describe("effect scope 'region' — real Area membership", () => {
  afterEach(() => vi.restoreAllMocks());

  it('affects the caster’s whole Area and nobody outside it', () => {
    const graph = new WorldGraph();
    putAgent(graph, 'caster', 0, 0);
    putAgent(graph, 'far_same_area', 5, 0);   // 5 steps away, same Area — old disc missed it
    putAgent(graph, 'near_other_area', 0, 2); // 2 steps away, other Area — old disc included it

    const result = resolveScope(graph, { scope: 'region', regionId: 'self_region' }, 'caster', undefined, projection());

    expect(result.affectedAgents).toContain('caster');
    expect(result.affectedAgents).toContain('far_same_area');
    expect(result.affectedAgents).not.toContain('near_other_area');
    expect(result.affectedHexes).toHaveLength(HOME_HEXES.length);
    expect(result.truncated).toBe(false);
  });

  it('resolves to nothing — loudly — when handed no Area partition', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const graph = new WorldGraph();
    putAgent(graph, 'caster', 0, 0);
    putAgent(graph, 'near_other_area', 0, 2);

    const result = resolveScope(graph, { scope: 'region', regionId: 'self_region' }, 'caster');

    // Not the radius fallback: `near_other_area` sits inside the old radius-4 disc, so
    // a silent revert to it would put that agent in the result.
    expect(result.affectedAgents).toEqual([]);
    expect(result.affectedHexes).toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('resolves to nothing on a hex with no Area', () => {
    const graph = new WorldGraph();
    putAgent(graph, 'caster', 40, 40); // off the partition entirely
    const result = resolveScope(graph, { scope: 'region', regionId: 'self_region' }, 'caster', undefined, projection());
    expect(result.affectedAgents).toEqual([]);
  });
});
