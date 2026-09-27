/**
 * THR-1616 — movement waypoints carry a registered subtype.
 *
 * `findOrCreateLocationAtHex` mints `loc.transient.<col>.<row>` Locations as actors
 * walk the hex grid. Before THR-1616 they had no `locationSubtype`, so ~95 per
 * medium world by t300 sat outside every world-object class. They now carry
 * `wilderness_waypoint`, in the `wild` class, and keep `locationType: 'wilderness'`
 * so the encounter cache (which reads `locationType` first) draws the same pool.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  findOrCreateLocationAtHex,
  WAYPOINT_LOCATION_SUBTYPE,
  WAYPOINT_LOCATION_ID_PREFIX,
} from '../hexMovementPath';
import { locationClassOf, LOCATION_SUBTYPES } from '../../data/world-objects';
import { locationTypeFromProperties } from '../encounterCache';

describe('movement waypoints (THR-1616)', () => {
  it('mints a waypoint with the registered subtype, in the wild class', () => {
    const graph = new WorldGraph();
    const id = findOrCreateLocationAtHex(graph, { col: 4, row: 7 }, 'grassland');
    expect(id).toBe(`${WAYPOINT_LOCATION_ID_PREFIX}4.7`);
    const node = graph.getNode(id)!;
    expect(node.properties.locationSubtype).toBe(WAYPOINT_LOCATION_SUBTYPE);
    expect(LOCATION_SUBTYPES).toContain(WAYPOINT_LOCATION_SUBTYPE);
    expect(locationClassOf(node.properties.locationSubtype as string)).toBe('wild');
  });

  it('keeps the wilderness encounter token', () => {
    const graph = new WorldGraph();
    const id = findOrCreateLocationAtHex(graph, { col: 1, row: 1 });
    expect(locationTypeFromProperties(graph.getNode(id)!.properties)).toBe('wilderness');
  });

  it('stamps a pre-THR-1616 waypoint (no subtype) when it is reused', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: `${WAYPOINT_LOCATION_ID_PREFIX}2.3`,
      type: 'location',
      name: 'Wilderness (2, 3)',
      properties: { hexCol: 2, hexRow: 3, locationType: 'wilderness' },
    });
    const id = findOrCreateLocationAtHex(graph, { col: 2, row: 3 });
    expect(id).toBe(`${WAYPOINT_LOCATION_ID_PREFIX}2.3`);
    expect(graph.getNode(id)!.properties.locationSubtype).toBe(WAYPOINT_LOCATION_SUBTYPE);
  });

  it('never restamps a real Location that shares the hex', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc.town',
      type: 'location',
      name: 'Town',
      properties: { hexCol: 5, hexRow: 5, locationSubtype: 'town' },
    });
    expect(findOrCreateLocationAtHex(graph, { col: 5, row: 5 })).toBe('loc.town');
    expect(graph.getNode('loc.town')!.properties.locationSubtype).toBe('town');
  });
});
