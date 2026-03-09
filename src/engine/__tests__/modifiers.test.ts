import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getFloor, collectModifiers, getModifiedValue } from '../modifiers';
import { ATTRIBUTE_FLOORS, DEFAULT_FLOOR } from '../../types/modifiers';
import { WorldGraph } from '../graph';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';

describe('getFloor', () => {
  it('returns defined floor for los_range', () => {
    expect(getFloor('los_range')).toBe(0);
  });

  it('returns DEFAULT_FLOOR for unknown attribute', () => {
    expect(getFloor('unknown_attr')).toBe(DEFAULT_FLOOR);
  });
});

describe('collectModifiers', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('returns empty array for nonexistent node', () => {
    expect(collectModifiers(graph, 'no-such-node', 'los_range')).toEqual([]);
  });

  it('collects modifier from outgoing has_trait edge', () => {
    graph.addNode({ id: 'agent1', type: 'actor', name: 'Kael', properties: {} });
    graph.addNode({ id: 'trait1', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({
      id: 'e1', source: 'agent1', target: 'trait1', type: 'has_trait',
      properties: { modifiers: { los_range: 1 } },
    });
    const mods = collectModifiers(graph, 'agent1', 'los_range');
    expect(mods).toHaveLength(1);
    expect(mods[0].delta).toBe(1);
    expect(mods[0].edgeType).toBe('has_trait');
    expect(mods[0].sourceName).toBe('Eagle-Eyed');
  });

  it('collects modifiers from multiple edges', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 't1', type: 'trait', name: 'T1', properties: {} });
    graph.addNode({ id: 't2', type: 'trait', name: 'T2', properties: {} });
    graph.addEdge({
      id: 'e1', source: 'a1', target: 't1', type: 'has_trait',
      properties: { modifiers: { los_range: 1 } },
    });
    graph.addEdge({
      id: 'e2', source: 'a1', target: 't2', type: 'has_trait',
      properties: { modifiers: { los_range: -1 } },
    });
    const mods = collectModifiers(graph, 'a1', 'los_range');
    expect(mods).toHaveLength(2);
  });

  it('ignores edges without matching attribute', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 't1', type: 'trait', name: 'T1', properties: {} });
    graph.addEdge({
      id: 'e1', source: 'a1', target: 't1', type: 'has_trait',
      properties: { modifiers: { action_cost: -1 } },
    });
    expect(collectModifiers(graph, 'a1', 'los_range')).toEqual([]);
  });

  it('ignores edges with no modifiers property', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 't1', type: 'trait', name: 'T1', properties: {} });
    graph.addEdge({
      id: 'e1', source: 'a1', target: 't1', type: 'has_trait', properties: {},
    });
    expect(collectModifiers(graph, 'a1', 'los_range')).toEqual([]);
  });

  it('collects terrain modifier via located_at edge', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'loc1', type: 'location', name: 'Mountain Pass', properties: { terrain: 'mountains' } });
    graph.addEdge({
      id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {},
    });
    const mods = collectModifiers(graph, 'a1', 'los_range');
    expect(mods).toHaveLength(1);
    expect(mods[0].delta).toBe(2);
    expect(mods[0].sourceName).toBe('terrain:mountains');
  });

  it('collects modifier from incoming edge', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'spell1', type: 'trait', name: 'FarSight', properties: {} });
    graph.addEdge({
      id: 'e1', source: 'spell1', target: 'a1', type: 'blessed',
      properties: { modifiers: { los_range: 2 } },
    });
    const mods = collectModifiers(graph, 'a1', 'los_range');
    expect(mods).toHaveLength(1);
    expect(mods[0].delta).toBe(2);
    expect(mods[0].sourceName).toBe('FarSight');
  });
});

describe('getModifiedValue', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => {
    disableTracing();
  });

  it('returns baseValue when no modifiers exist', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: {} });
    expect(getModifiedValue(graph, 'a1', 'los_range', 0)).toBe(0);
  });

  it('adds modifier delta to base value', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 't1', type: 'trait', name: 'Eagle', properties: {} });
    graph.addEdge({
      id: 'e1', source: 'a1', target: 't1', type: 'has_trait',
      properties: { modifiers: { los_range: 1 } },
    });
    expect(getModifiedValue(graph, 'a1', 'los_range', 0)).toBe(1);
  });

  it('sums multiple modifiers', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 't1', type: 'trait', name: 'T1', properties: {} });
    graph.addNode({ id: 'loc1', type: 'location', name: 'Mtns', properties: { terrain: 'mountains' } });
    graph.addEdge({
      id: 'e1', source: 'a1', target: 't1', type: 'has_trait',
      properties: { modifiers: { los_range: 1 } },
    });
    graph.addEdge({
      id: 'e2', source: 'a1', target: 'loc1', type: 'located_at', properties: {},
    });
    // Trait +1 + mountains +2 = 3
    expect(getModifiedValue(graph, 'a1', 'los_range', 0)).toBe(3);
  });

  it('clamps to floor', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 't1', type: 'trait', name: 'Blind', properties: {} });
    graph.addEdge({
      id: 'e1', source: 'a1', target: 't1', type: 'has_trait',
      properties: { modifiers: { los_range: -5 } },
    });
    // base 0 + (-5) = -5, but floor is 0
    expect(getModifiedValue(graph, 'a1', 'los_range', 0)).toBe(0);
  });

  it('combines trait and terrain modifiers', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 't1', type: 'trait', name: 'NightBlind', properties: {} });
    graph.addNode({ id: 'loc1', type: 'location', name: 'Swamp', properties: { terrain: 'swamp' } });
    graph.addEdge({
      id: 'e1', source: 'a1', target: 't1', type: 'has_trait',
      properties: { modifiers: { los_range: -1 } },
    });
    graph.addEdge({
      id: 'e2', source: 'a1', target: 'loc1', type: 'located_at', properties: {},
    });
    // NightBlind -1 + swamp -1 = -2, floor at 0
    expect(getModifiedValue(graph, 'a1', 'los_range', 0)).toBe(0);
  });

  it('returns baseValue for nonexistent node', () => {
    expect(getModifiedValue(graph, 'nope', 'los_range', 3)).toBe(3);
  });

  it('emits trace when tick is provided', () => {
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 't1', type: 'trait', name: 'Eagle', properties: {} });
    graph.addEdge({
      id: 'e1', source: 'a1', target: 't1', type: 'has_trait',
      properties: { modifiers: { los_range: 1 } },
    });
    getModifiedValue(graph, 'a1', 'los_range', 0, 5);
    const traces = getTraces().filter(t => t.category === 'modifier_resolution');
    expect(traces).toHaveLength(1);
    expect(traces[0].category).toBe('modifier_resolution');
  });
});
