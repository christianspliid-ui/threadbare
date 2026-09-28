/**
 * THR-1605 S1 — the meeting comes to the player.
 *
 * `pickMeetingLocation` chooses the settlement nearest the avatar (preferring a
 * cultured one within MEETING_CULTURED_PREFERENCE_RADIUS), deterministically, and
 * returns null when no settlement exists. `isFirstBonded` is the single read of
 * "has the player met their First?".
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { isFirstBonded, isMeetTheFirstAvailable, pickMeetingLocation } from '../meetingEncounter';
import { MEETING_CULTURED_PREFERENCE_RADIUS } from '../../types/meetingEncounter';

function addLocation(
  graph: WorldGraph,
  id: string,
  subtype: string,
  col: number,
  row: number,
  extra: Record<string, unknown> = {},
) {
  graph.addNode({
    id,
    type: 'location',
    name: id,
    properties: { locationSubtype: subtype, hexCol: col, hexRow: row, ...extra },
  });
}

function addCulture(graph: WorldGraph, locationId: string, cultureId = 'culture.a') {
  if (!graph.getNode(cultureId)) {
    graph.addNode({ id: cultureId, type: 'actor', name: cultureId, properties: { actorType: 'culture' } });
  }
  graph.addEdge({
    id: `${locationId}_belongs_to_${cultureId}`,
    source: locationId,
    target: cultureId,
    type: 'belongs_to',
    properties: { cultureLayer: 'current' },
  });
}

/** Ascendant + avatar standing at a shrine at (0,0) — the real first-run start. */
function buildWorld() {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'avatar', type: 'actor', name: 'Avatar', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'avatar_of', source: 'avatar', target: 'asc', type: 'avatar_of', properties: {} });
  addLocation(graph, 'loc.start', 'shrine', 0, 0);
  graph.addEdge({ id: 'avatar_at', source: 'avatar', target: 'loc.start', type: 'located_at', properties: {} });
  return graph;
}

describe('pickMeetingLocation (THR-1605 S1)', () => {
  it('picks the nearest settlement, never the shrine the avatar stands on', () => {
    const graph = buildWorld();
    addLocation(graph, 'loc.far_town', 'town', 8, 0);
    addLocation(graph, 'loc.near_village', 'village', 2, 0);

    const pick = pickMeetingLocation(graph, 'asc');
    expect(pick).toEqual({ locationId: 'loc.near_village', hexDistance: 2, cultured: false });
  });

  it('ignores non-settled subtypes and Places (inner tier)', () => {
    const graph = buildWorld();
    addLocation(graph, 'loc.ruin', 'ruin', 1, 0);
    // A Place carries parentLocationId — never a meeting candidate, even with a settled subtype.
    addLocation(graph, 'place.market', 'town', 1, 0, { parentLocationId: 'loc.start' });
    addLocation(graph, 'loc.city', 'city', 5, 0);

    expect(pickMeetingLocation(graph, 'asc')?.locationId).toBe('loc.city');
  });

  it('prefers a cultured settlement within the preference radius over a nearer uncultured one', () => {
    const graph = buildWorld();
    addLocation(graph, 'loc.outpost', 'outpost', 1, 0);
    addLocation(graph, 'loc.cultured_town', 'town', 4, 0);
    addCulture(graph, 'loc.cultured_town');

    const pick = pickMeetingLocation(graph, 'asc');
    expect(pick).toEqual({ locationId: 'loc.cultured_town', hexDistance: 4, cultured: true });
  });

  it('takes the nearest when the only cultured settlement lies beyond the radius', () => {
    const graph = buildWorld();
    addLocation(graph, 'loc.outpost', 'outpost', 1, 0);
    addLocation(graph, 'loc.far_cultured', 'town', MEETING_CULTURED_PREFERENCE_RADIUS + 2, 0);
    addCulture(graph, 'loc.far_cultured');

    expect(pickMeetingLocation(graph, 'asc')?.locationId).toBe('loc.outpost');
  });

  it('breaks distance ties on node id, deterministically', () => {
    const graph = buildWorld();
    // Both 2 hexes from (0,0); insertion order deliberately reversed.
    addLocation(graph, 'loc.b_town', 'town', 2, 0);
    addLocation(graph, 'loc.a_town', 'town', 0, 2);

    expect(pickMeetingLocation(graph, 'asc')?.locationId).toBe('loc.a_town');
    expect(pickMeetingLocation(graph, 'asc')?.locationId).toBe('loc.a_town');
  });

  it('resolves an avatar standing at a Place up to its parent Location hex', () => {
    const graph = buildWorld();
    addLocation(graph, 'loc.east_town', 'town', 10, 0);
    addLocation(graph, 'loc.west_town', 'town', 0, 0);
    // The avatar stands in a Place with no hex of its own, inside the east town.
    graph.addNode({
      id: 'place.inn',
      type: 'location',
      name: 'Inn',
      properties: { locationSubtype: 'tavern', parentLocationId: 'loc.east_town' },
    });
    const [edge] = graph.getOutgoingEdges('avatar', 'located_at');
    graph.removeEdge(edge.id);
    graph.addEdge({ id: 'avatar_at_inn', source: 'avatar', target: 'place.inn', type: 'located_at', properties: {} });

    expect(pickMeetingLocation(graph, 'asc')?.locationId).toBe('loc.east_town');
  });

  it('returns null when no settlement exists (caller falls back to the avatar location)', () => {
    const graph = buildWorld();
    addLocation(graph, 'loc.ruin', 'ruin', 1, 0);
    expect(pickMeetingLocation(graph, 'asc')).toBeNull();
  });

  it('still picks a settlement when the avatar has no position (map-centre fallback)', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    addLocation(graph, 'loc.edge_town', 'town', 0, 0);
    addLocation(graph, 'loc.mid_town', 'town', 5, 5);
    addLocation(graph, 'loc.other_edge', 'town', 10, 10);

    expect(pickMeetingLocation(graph, 'asc')?.locationId).toBe('loc.mid_town');
  });
});

describe('isFirstBonded (THR-1605 S1)', () => {
  it('is false before the bond and true once a the_first thread exists', () => {
    const graph = buildWorld();
    expect(isFirstBonded(graph, 'asc')).toBe(false);
    expect(isMeetTheFirstAvailable(graph, 'asc', 0)).toBe(true);

    graph.addNode({ id: 'first', type: 'actor', name: 'First', properties: { actorType: 'individual' } });
    graph.addEdge({
      id: 'thread_first',
      source: 'asc',
      target: 'first',
      type: 'thread',
      properties: { courtPosition: 'the_first' },
    });
    expect(isFirstBonded(graph, 'asc')).toBe(true);
    expect(isMeetTheFirstAvailable(graph, 'asc', 0)).toBe(false);
  });

  it('ignores threads at other court positions', () => {
    const graph = buildWorld();
    graph.addNode({ id: 'other', type: 'actor', name: 'Other', properties: { actorType: 'individual' } });
    graph.addEdge({
      id: 'thread_other',
      source: 'asc',
      target: 'other',
      type: 'thread',
      properties: { courtPosition: 'champion' },
    });
    expect(isFirstBonded(graph, 'asc')).toBe(false);
  });
});
