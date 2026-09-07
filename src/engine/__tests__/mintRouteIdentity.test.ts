/**
 * The route identity node is keyed on the lane's two ends, not on the origin hex and
 * tick (THR-1437). Before this, two lanes out of one capital on one tick — exactly
 * what worldgen seeds — collapsed into one node and one `location_already_exists`,
 * so the Route *objects* were one per culture while the lanes were all real.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { mintRouteIdentity } from '../tradeRouteOps';
import { ROUTE_IDENTITY_SUBTYPE } from '../../data/strategic-action-constants';

function town(g: WorldGraph, id: string, col: number, row: number): void {
  g.addNode({ id, name: id, type: 'location', properties: { locationSubtype: 'town', hexCol: col, hexRow: row } });
}

describe('mintRouteIdentity', () => {
  it('mints one identity node per lane, two lanes from one origin on one tick included', () => {
    const g = new WorldGraph();
    town(g, 'capital', 5, 5);
    town(g, 'east', 8, 5);
    town(g, 'west', 2, 5);
    const a = mintRouteIdentity(g, 'capital', 'east', 'e_east', 'worldgen', 0);
    const b = mintRouteIdentity(g, 'capital', 'west', 'e_west', 'worldgen', 0);
    expect([a, b].map(r => (r.success ? 'ok' : r.error))).toEqual(['ok', 'ok']);
    expect(a.createdId).not.toBe(b.createdId);
    for (const [id, target, edge] of [[a.createdId!, 'east', 'e_east'], [b.createdId!, 'west', 'e_west']] as const) {
      const node = g.getNode(id)!;
      expect(node.properties.locationSubtype).toBe(ROUTE_IDENTITY_SUBTYPE);
      expect(node.properties.routeSourceId).toBe('capital');
      expect(node.properties.routeTargetId).toBe(target);
      expect(node.properties.routeEdgeId).toBe(edge);
      expect(node.properties.hexCol).toBe(5);
    }
    // Deterministic: the same lane asked for twice is the same node, refused the second time.
    expect(mintRouteIdentity(g, 'capital', 'east', 'e_east', 'worldgen', 0).success).toBe(false);
  });

  it('refuses without an origin hex and leaves nothing behind', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'nowhere', name: 'Nowhere', type: 'location', properties: { locationSubtype: 'town' } });
    town(g, 'east', 8, 5);
    const r = mintRouteIdentity(g, 'nowhere', 'east', 'e', 'worldgen', 0);
    expect(r.success).toBe(false);
    expect(g.getNodesByType('location').filter(n => n.properties.locationSubtype === ROUTE_IDENTITY_SUBTYPE)).toEqual([]);
  });
});
