import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import { getRelationship } from '../relationshipResolver';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeActorNode(id: string) {
  return {
    id,
    type: 'actor' as const,
    name: `Actor ${id}`,
    properties: { actorType: 'individual' },
  };
}

function makeRelationshipNode(id: string, a: string, b: string, arc: string, tensionDrift: number) {
  return {
    id,
    type: 'relationship' as const,
    name: `Rel ${id}`,
    properties: {
      participants: [a, b] as [string, string],
      arc,
      tension_axis: 'loyalty under strain',
      tension_drift: tensionDrift,
      history: [],
      last_invoked_tick: 0,
    },
  };
}

function makeRelatesTo(id: string, source: string, target: string, sentiment: number) {
  return { id, type: 'relates_to' as const, source, target, properties: { sentiment } };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getRelationship — relationship node lookup', () => {
  it('returns node data when a relationship node exists for the pair', () => {
    const graph = new WorldGraph();
    graph.addNode(makeActorNode('a1'));
    graph.addNode(makeActorNode('a2'));
    graph.addNode(makeRelationshipNode('r1', 'a1', 'a2', 'fraying', -0.4));

    const result = getRelationship(graph, 'a1', 'a2');
    expect(result.source).toBe('node');
    if (result.source === 'node') {
      expect(result.data.arc).toBe('fraying');
      expect(result.data.tension_drift).toBe(-0.4);
      expect(result.data.participants).toEqual(['a1', 'a2']);
    }
  });

  it('finds the node regardless of participant order', () => {
    const graph = new WorldGraph();
    graph.addNode(makeActorNode('a1'));
    graph.addNode(makeActorNode('a2'));
    graph.addNode(makeRelationshipNode('r1', 'a2', 'a1', 'improving', 0.6));

    const result = getRelationship(graph, 'a1', 'a2');
    expect(result.source).toBe('node');
  });
});

describe('getRelationship — relates_to edge fallback', () => {
  it('falls back to edge_sentiment when no relationship node exists', () => {
    const graph = new WorldGraph();
    graph.addNode(makeActorNode('a1'));
    graph.addNode(makeActorNode('a2'));
    graph.addEdge(makeRelatesTo('e1', 'a1', 'a2', 0.5));

    const result = getRelationship(graph, 'a1', 'a2');
    expect(result.source).toBe('edge_sentiment');
    if (result.source === 'edge_sentiment') {
      expect(result.arc).toBe('improving');
      expect(result.sentiment).toBe(0.5);
    }
  });

  it('checks incoming edges when no outgoing edge exists', () => {
    const graph = new WorldGraph();
    graph.addNode(makeActorNode('a1'));
    graph.addNode(makeActorNode('a2'));
    graph.addEdge(makeRelatesTo('e1', 'a2', 'a1', -0.5));

    const result = getRelationship(graph, 'a1', 'a2');
    expect(result.source).toBe('edge_sentiment');
    if (result.source === 'edge_sentiment') {
      expect(result.arc).toBe('fraying');
    }
  });

  it('maps sentiment values to arc labels correctly', () => {
    const graph = new WorldGraph();
    graph.addNode(makeActorNode('a'));
    graph.addNode(makeActorNode('b1'));
    graph.addNode(makeActorNode('b2'));
    graph.addNode(makeActorNode('b3'));
    graph.addNode(makeActorNode('b4'));

    graph.addEdge(makeRelatesTo('e1', 'a', 'b1', -1.0));  // severed
    graph.addEdge(makeRelatesTo('e2', 'a', 'b2', -0.5));  // fraying
    graph.addEdge(makeRelatesTo('e3', 'a', 'b3', 0.0));   // stable
    graph.addEdge(makeRelatesTo('e4', 'a', 'b4', 0.5));   // improving

    expect(getRelationship(graph, 'a', 'b1')).toMatchObject({ source: 'edge_sentiment', arc: 'severed' });
    expect(getRelationship(graph, 'a', 'b2')).toMatchObject({ source: 'edge_sentiment', arc: 'fraying' });
    expect(getRelationship(graph, 'a', 'b3')).toMatchObject({ source: 'edge_sentiment', arc: 'stable' });
    expect(getRelationship(graph, 'a', 'b4')).toMatchObject({ source: 'edge_sentiment', arc: 'improving' });
  });
});

describe('getRelationship — no data', () => {
  it('returns none when neither a relationship node nor a relates_to edge exists', () => {
    const graph = new WorldGraph();
    graph.addNode(makeActorNode('a1'));
    graph.addNode(makeActorNode('a2'));

    const result = getRelationship(graph, 'a1', 'a2');
    expect(result.source).toBe('none');
  });
});
