/**
 * Rival-influence marker adapter tests (THR-66, THR-621).
 *
 * The point of interest: the original `sponsors_scheme` input **cannot fire**,
 * because rivals are not graph nodes and `graph.addEdge` throws on an unknown
 * source node. The layer rendered nothing until THR-621 gave it a second input
 * that reads the essence-source bag instead. These tests pin both paths — the
 * live one by behavior, the dead one by construction.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { RivalDefinition } from '../../types/rival';
import { buildRivalInfluenceMarkers } from '../rivalInfluenceMarkers';

const RIVAL_ID = 'rival.ashen';

function makeRival(id = RIVAL_ID): RivalDefinition {
  return {
    id,
    name: 'The Ashen',
    sphereAlignment: {} as RivalDefinition['sphereAlignment'],
    behavior: 'subtle',
    oppositionStrength: 0.7,
    description: 'test rival',
    primarySphere: 'darkness',
    secondarySphere: 'mind',
  };
}

function graphWithSource(
  props: Record<string, unknown>,
  hex: { col: number; row: number } = { col: 4, row: 7 },
): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'shrine-1',
    type: 'location',
    name: 'Ashfall Shrine',
    properties: { hexCol: hex.col, hexRow: hex.row, essenceSource: props },
  });
  return graph;
}

describe('buildRivalInfluenceMarkers — essence-source drains (THR-621)', () => {
  it('marks the hex of a source a known rival is contesting', () => {
    const graph = graphWithSource({
      kind: 'shrine',
      sanctity: 0.5,
      tier: 'contested',
      contestedBy: RIVAL_ID,
    });
    const markers = buildRivalInfluenceMarkers(graph, [makeRival()]);

    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      col: 4,
      row: 7,
      rivalId: RIVAL_ID,
      targetId: 'shrine-1',
      reason: 'source_contested',
    });
  });

  it('distinguishes a desecrated source from a merely contested one', () => {
    const graph = graphWithSource({
      kind: 'shrine',
      sanctity: 0,
      tier: 'desecrated',
      contestedBy: RIVAL_ID,
      desecrated: true,
    });
    expect(buildRivalInfluenceMarkers(graph, [makeRival()])[0].reason).toBe('source_desecrated');
  });

  it('emits nothing for an uncontested source, or a drainer that is not a known rival', () => {
    const clean = graphWithSource({ kind: 'shrine', sanctity: 0.9, tier: 'flowering' });
    expect(buildRivalInfluenceMarkers(clean, [makeRival()])).toEqual([]);

    const stranger = graphWithSource({
      kind: 'shrine',
      sanctity: 0.5,
      tier: 'contested',
      contestedBy: 'rival.unknown',
    });
    expect(buildRivalInfluenceMarkers(stranger, [makeRival()])).toEqual([]);
  });

  it('fail-softs on a host with no hex coordinates', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'floating',
      type: 'location',
      name: 'floating',
      properties: {
        essenceSource: { kind: 'shrine', sanctity: 0.5, tier: 'contested', contestedBy: RIVAL_ID },
      },
    });
    expect(buildRivalInfluenceMarkers(graph, [makeRival()])).toEqual([]);
  });

  it('returns an empty list when there are no rivals at all', () => {
    const graph = graphWithSource({
      kind: 'shrine',
      sanctity: 0.5,
      tier: 'contested',
      contestedBy: RIVAL_ID,
    });
    expect(buildRivalInfluenceMarkers(graph, [])).toEqual([]);
  });
});

describe('buildRivalInfluenceMarkers — the sponsors_scheme path is dead by construction', () => {
  it('cannot bind a sponsors_scheme edge, because rivals are not graph nodes', () => {
    // This is the reason the layer rendered nothing before THR-621: the scheme
    // `materialize` move attempts exactly this addEdge and the throw is swallowed
    // by its fail-soft catch. Pinned so the day rivals become nodes, this fails
    // loudly and the second marker input can be revisited.
    const graph = graphWithSource({ kind: 'shrine', sanctity: 0.9, tier: 'flowering' });
    expect(() =>
      graph.addEdge({
        id: 'edge_sponsors_scheme_test',
        source: RIVAL_ID, // not a node
        target: 'shrine-1',
        type: 'sponsors_scheme',
        properties: {},
      }),
    ).toThrow(/Source node not found/);
  });

  it('reads the edge when the rival *is* a node, and drain markers win the hex', () => {
    const graph = graphWithSource({
      kind: 'shrine',
      sanctity: 0.5,
      tier: 'contested',
      contestedBy: RIVAL_ID,
    });
    graph.addNode({ id: RIVAL_ID, type: 'actor', name: 'The Ashen', properties: {} });
    graph.addEdge({
      id: 'edge_sponsors_scheme_test',
      source: RIVAL_ID,
      target: 'shrine-1',
      type: 'sponsors_scheme',
      properties: {},
    });

    // One marker, not two: the hex is de-duped and the live drain is the stronger
    // signal, so it is the one that survives.
    const markers = buildRivalInfluenceMarkers(graph, [makeRival()]);
    expect(markers).toHaveLength(1);
    expect(markers[0].reason).toBe('source_contested');
  });
});
