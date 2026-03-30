import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';

describe('WorldGraph.getByTag', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: 'sword1', type: 'artifact', name: 'Iron Blade',
      properties: { tags: ['#iron', '#weapon', '#arms'] },
    });
    graph.addNode({
      id: 'shield1', type: 'artifact', name: 'Oaken Shield',
      properties: { tags: ['#iron', '#armor', '#vestments'] },
    });
    graph.addNode({
      id: 'potion1', type: 'artifact', name: 'Healing Draught',
      properties: { tags: ['#flesh', '#consumable', '#provisions'] },
    });
    graph.addNode({
      id: 'curse1', type: 'trait', name: 'Tomb Chill',
      properties: { tags: ['#curse', '#supernatural', '#heart'] },
    });
  });

  it('returns nodes matching a single tag', () => {
    const results = graph.getByTag(['#iron']);
    expect(results).toHaveLength(2);
    expect(results.map(n => n.id)).toContain('sword1');
    expect(results.map(n => n.id)).toContain('shield1');
  });

  it('returns nodes matching ALL specified tags (AND logic)', () => {
    const results = graph.getByTag(['#iron', '#weapon']);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('sword1');
  });

  it('returns empty array when no nodes match', () => {
    const results = graph.getByTag(['#nonexistent']);
    expect(results).toHaveLength(0);
  });

  it('filters by nodeType when provided', () => {
    const results = graph.getByTag(['#iron'], 'trait');
    expect(results).toHaveLength(0);
  });

  it('returns nodes across types when no type filter', () => {
    const results = graph.getByTag(['#heart']);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('curse1');
  });

  it('handles nodes without tags gracefully', () => {
    graph.addNode({
      id: 'plain1', type: 'actor', name: 'Nobody',
      properties: {},
    });
    const results = graph.getByTag(['#iron']);
    expect(results).toHaveLength(2); // unchanged
  });
});
