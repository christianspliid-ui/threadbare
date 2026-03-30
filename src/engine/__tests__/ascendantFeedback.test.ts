import { describe, it, expect } from 'vitest';
import { applyAscendantFeedback } from '../ascendantFeedback';
import { WorldGraph } from '../graph';

function createTestGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'god.test',
    type: 'actor',
    name: 'Test God',
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      interventionHistory: {},
    },
  });
  return graph;
}

describe('applyAscendantFeedback', () => {
  it('increments interventionHistory count for intervention type', () => {
    const graph = createTestGraph();
    applyAscendantFeedback(graph, 'god.test', 'persuade', 'mind');
    const node = graph.getNode('god.test');
    const history = node?.properties?.interventionHistory as Record<string, number>;
    expect(history['persuade']).toBe(1);
  });

  it('increments interventionHistory count on successive calls', () => {
    const graph = createTestGraph();
    applyAscendantFeedback(graph, 'god.test', 'persuade', 'mind');
    applyAscendantFeedback(graph, 'god.test', 'persuade', 'mind');
    applyAscendantFeedback(graph, 'god.test', 'intimidate', 'force');
    const node = graph.getNode('god.test');
    const history = node?.properties?.interventionHistory as Record<string, number>;
    expect(history['persuade']).toBe(2);
    expect(history['intimidate']).toBe(1);
  });

  it('handles missing interventionHistory gracefully', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'god.test',
      type: 'actor',
      name: 'Test God',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      },
    });

    applyAscendantFeedback(graph, 'god.test', 'dream', 'spirit');
    const node = graph.getNode('god.test');
    const history = node?.properties?.interventionHistory as Record<string, number>;
    expect(history['dream']).toBe(1);
  });

  it('handles nonexistent ascendant gracefully', () => {
    const graph = createTestGraph();
    // Should not throw or crash
    expect(() => {
      applyAscendantFeedback(graph, 'god.nonexistent', 'persuade', 'mind');
    }).not.toThrow();
  });

  it('tracks multiple intervention types independently', () => {
    const graph = createTestGraph();
    const interventionTypes: Array<['persuade' | 'deceive' | 'intimidate' | 'inspire_intervention' | 'coincidence' | 'omen' | 'afflict_bless' | 'dream', any]> = [
      ['persuade', 'mind'],
      ['deceive', 'shadow'],
      ['intimidate', 'force'],
      ['dream', 'spirit'],
      ['persuade', 'mind'],
    ];

    for (const [type, sphere] of interventionTypes) {
      applyAscendantFeedback(graph, 'god.test', type, sphere);
    }

    const node = graph.getNode('god.test');
    const history = node?.properties?.interventionHistory as Record<string, number>;
    expect(history['persuade']).toBe(2);
    expect(history['deceive']).toBe(1);
    expect(history['intimidate']).toBe(1);
    expect(history['dream']).toBe(1);
  });
});
