/**
 * THR-1685 — the graph half of `anchorNameFor`: a person names itself, and
 * everything else (a place, a collective, a missing node) returns undefined so
 * the chip's noun keeps the scene's reading.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../../../engine/graph';
import { buildChipAnchorNameResolver } from '../chipCollaborators';

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'inspector', type: 'actor', name: 'Maud Harrow', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'guild', type: 'actor', name: 'the Masons', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'town', type: 'location', name: 'Ardenmor', properties: {} });
  return graph;
}

describe('buildChipAnchorNameResolver (THR-1685)', () => {
  const nameFor = buildChipAnchorNameResolver(buildGraph());

  it('names a person', () => {
    expect(nameFor('inspector')).toBe('Maud Harrow');
  });

  it('returns undefined for a place, a faction, and a node that does not exist', () => {
    expect(nameFor('town')).toBeUndefined();
    expect(nameFor('guild')).toBeUndefined();
    expect(nameFor('nobody')).toBeUndefined();
  });
});
