import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { devPlaceAvatarAtSettlement } from '../gameInit';
import { MEETING_SETTLED_LOCATION_SUBTYPES } from '../meetingEncounter';
import type { GameState } from '../../types/gameState';

/**
 * THR-874. The `?view=game&firstunmet` dev entry only reaches the Meet-The-First
 * beat if the avatar stands somewhere the auto-trigger accepts. Unbonding The
 * First is necessary but not sufficient — the ascendant starts at `loc.start`,
 * a `shrine`, which is deliberately outside the settled allowlist.
 */

/** Minimal graph: ascendant ← avatar_of ← avatar, avatar located_at the start shrine. */
function buildGraph(opts: { withSettlement: boolean; withAvatar?: boolean }) {
  const graph = new WorldGraph();

  graph.addNode({ id: 'asc', type: 'actor', name: 'The Witness', properties: { actorType: 'ascendant' } });

  graph.addNode({
    id: 'loc.start',
    type: 'location',
    name: 'Sacred Grove',
    properties: { locationType: 'sacred', locationSubtype: 'shrine' },
  });

  if (opts.withAvatar !== false) {
    graph.addNode({ id: 'avatar', type: 'actor', name: 'Avatar', properties: { actorType: 'individual', locationId: 'loc.start' } });
    graph.addEdge({ id: 'e_avatar_of', source: 'avatar', target: 'asc', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'e_avatar_loc', source: 'avatar', target: 'loc.start', type: 'located_at', properties: {} });
  }

  if (opts.withSettlement) {
    graph.addNode({
      id: 'loc.village',
      type: 'location',
      name: 'Ashenmoor',
      properties: { locationType: 'settlement', locationSubtype: 'village' },
    });
  }

  return graph;
}

function asState(graph: WorldGraph): GameState {
  return { graph, ascendantId: 'asc' } as unknown as GameState;
}

describe('devPlaceAvatarAtSettlement (THR-874)', () => {
  it('moves the avatar off the start shrine onto a settled location', () => {
    const graph = buildGraph({ withSettlement: true });

    // Guard: the starting subtype really is outside the allowlist, so this test
    // cannot pass by the avatar already standing somewhere acceptable.
    expect(MEETING_SETTLED_LOCATION_SUBTYPES).not.toContain('shrine');

    const moved = devPlaceAvatarAtSettlement(asState(graph));

    expect(moved).toBe('loc.village');
    const located = graph.getOutgoingEdges('avatar', 'located_at');
    expect(located).toHaveLength(1);
    expect(located[0].target).toBe('loc.village');
    expect(graph.getNode('avatar')!.properties.locationId).toBe('loc.village');
  });

  it('lands the avatar on a subtype the meeting auto-trigger accepts', () => {
    const graph = buildGraph({ withSettlement: true });
    const moved = devPlaceAvatarAtSettlement(asState(graph));

    const subtype = graph.getNode(moved!)!.properties.locationSubtype as string;
    expect(MEETING_SETTLED_LOCATION_SUBTYPES).toContain(subtype);
  });

  it('is fail-soft when no settled location exists — avatar unchanged, no throw', () => {
    const graph = buildGraph({ withSettlement: false });

    expect(devPlaceAvatarAtSettlement(asState(graph))).toBeNull();
    expect(graph.getOutgoingEdges('avatar', 'located_at')[0].target).toBe('loc.start');
  });

  it('is fail-soft when the ascendant has no avatar', () => {
    const graph = buildGraph({ withSettlement: true, withAvatar: false });
    expect(devPlaceAvatarAtSettlement(asState(graph))).toBeNull();
  });

  it('is idempotent — a second call leaves exactly one located_at edge', () => {
    const graph = buildGraph({ withSettlement: true });

    devPlaceAvatarAtSettlement(asState(graph));
    const second = devPlaceAvatarAtSettlement(asState(graph));

    expect(second).toBe('loc.village');
    expect(graph.getOutgoingEdges('avatar', 'located_at')).toHaveLength(1);
  });
});
