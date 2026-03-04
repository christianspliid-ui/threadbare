import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getRegions,
  getLocationsInRegion,
  getSubLocations,
  getActorsAtLocation,
  getViewAtLevel,
} from '../viewLevel';

describe('View Level Manager', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();

    // World
    graph.addNode({ id: 'world', type: 'location', name: 'The World', properties: { locationType: 'world' } });

    // Regions
    graph.addNode({ id: 'region.north', type: 'location', name: 'Northern Wastes', properties: { locationType: 'region' } });
    graph.addNode({ id: 'region.south', type: 'location', name: 'Sunlands', properties: { locationType: 'region' } });
    graph.addEdge({ id: 'e.w.rn', source: 'world', target: 'region.north', type: 'contains', properties: {} });
    graph.addEdge({ id: 'e.w.rs', source: 'world', target: 'region.south', type: 'contains', properties: {} });

    // Locations in region
    graph.addNode({ id: 'loc.irongate', type: 'location', name: 'Iron Gate', properties: { locationType: 'location' } });
    graph.addNode({ id: 'loc.village', type: 'location', name: 'Oakvale', properties: { locationType: 'location' } });
    graph.addEdge({ id: 'e.rn.ig', source: 'region.north', target: 'loc.irongate', type: 'contains', properties: {} });
    graph.addEdge({ id: 'e.rn.v', source: 'region.north', target: 'loc.village', type: 'contains', properties: {} });

    // Sub-locations
    graph.addNode({ id: 'sub.market', type: 'location', name: 'Marketplace', properties: { locationType: 'sub_location' } });
    graph.addNode({ id: 'sub.temple', type: 'location', name: 'Temple', properties: { locationType: 'sub_location' } });
    graph.addEdge({ id: 'e.ig.m', source: 'loc.irongate', target: 'sub.market', type: 'contains', properties: {} });
    graph.addEdge({ id: 'e.ig.t', source: 'loc.irongate', target: 'sub.temple', type: 'contains', properties: {} });

    // Actor at location
    graph.addNode({ id: 'actor.thorin', type: 'actor', name: 'Thorin', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.thorin.loc', source: 'actor.thorin', target: 'loc.irongate', type: 'located_at', properties: {} });
  });

  it('gets all regions', () => {
    const regions = getRegions(graph);
    expect(regions).toHaveLength(2);
  });

  it('gets locations in a region', () => {
    const locs = getLocationsInRegion(graph, 'region.north');
    expect(locs).toHaveLength(2);
    expect(locs.map(l => l.id)).toContain('loc.irongate');
  });

  it('gets sub-locations for a location', () => {
    const subs = getSubLocations(graph, 'loc.irongate');
    expect(subs).toHaveLength(2);
  });

  it('gets actors at a location', () => {
    const actors = getActorsAtLocation(graph, 'loc.irongate');
    expect(actors).toHaveLength(1);
    expect(actors[0].id).toBe('actor.thorin');
  });

  it('getViewAtLevel returns structured data for region view', () => {
    const view = getViewAtLevel(graph, 'region', 'region.north');
    expect(view.locations).toHaveLength(2);
    expect(view.name).toBe('Northern Wastes');
  });
});
