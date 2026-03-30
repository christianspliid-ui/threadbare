import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { collectLOSSources, recalcVisibility } from '../visibility';
import { getModifiedValue, collectModifiers } from '../modifiers';
import { visKey, AVATAR_SIGHT_RANGE } from '../../types/visibility';
import type { VisibilityMap } from '../../types/visibility';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';

function buildFullTestGraph(): {
  graph: WorldGraph;
  ascendantId: string;
  avatarId: string;
} {
  const graph = new WorldGraph();
  const ascendantId = 'asc.1';
  const avatarId = 'avatar.1';
  const locId = 'loc.start';

  graph.addNode({ id: ascendantId, type: 'actor', name: 'TestGod', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: avatarId, type: 'actor', name: 'TestAvatar', properties: { actorType: 'individual' } });
  graph.addNode({
    id: locId, type: 'location', name: 'Mountain Peak',
    properties: { hexCol: 5, hexRow: 5, locationType: 'settlement', terrain: 'mountains' },
  });
  graph.addEdge({ id: 'e.avatar_of', source: avatarId, target: ascendantId, type: 'avatar_of', properties: {} });
  graph.addEdge({ id: 'e.located_at', source: avatarId, target: locId, type: 'located_at', properties: {} });

  return { graph, ascendantId, avatarId };
}

describe('modifier system integration', () => {
  it('full pipeline: trait + terrain → LOS → visibility', () => {
    const { graph, ascendantId, avatarId } = buildFullTestGraph();

    // Give avatar Eagle-Eyed (+1 LOS)
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({
      id: 'e.trait.eagle', source: avatarId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });

    // Avatar at mountains (+2 terrain) with Eagle-Eyed (+1 trait)
    // Total LOS = 0 (base) + 2 (mountains) + 1 (eagle) = 3
    const sources = collectLOSSources(graph, ascendantId, []);
    expect(sources[0].range).toBe(3);

    // Run visibility on 11x11 grid
    const prev: VisibilityMap = new Map();
    const next = recalcVisibility(prev, sources, graph, 1, 11, 11);

    // Avatar at (5,5) with range 3 should see hexes within distance 3
    expect(next.get(visKey(5, 5))?.state).toBe('visible');
    expect(next.get(visKey(5, 4))?.state).toBe('visible'); // 1 away
    expect(next.get(visKey(5, 2))?.state).toBe('visible'); // 3 away
    // Hex 4 away should be unexplored
    expect(next.get(visKey(5, 1))?.state).toBe('unexplored');
  });

  it('negative modifier floors at 0 LOS', () => {
    const { graph, ascendantId, avatarId } = buildFullTestGraph();

    // Override to dense_forest terrain (-1)
    graph.updateNode('loc.start', { properties: { terrain: 'dense_forest' } });

    // Give Night Blind scar (-1)
    graph.addNode({ id: 'trait.blind', type: 'trait', name: 'Night Blind', properties: {} });
    graph.addEdge({
      id: 'e.trait.blind', source: avatarId, target: 'trait.blind', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: -1 } },
    });

    // 0 (base) + (-1 forest) + (-1 blind) = -2, floored at 0
    const val = getModifiedValue(graph, avatarId, 'los_range', AVATAR_SIGHT_RANGE);
    expect(val).toBe(0);

    const sources = collectLOSSources(graph, ascendantId, []);
    expect(sources[0].range).toBe(0);
  });

  it('modifier traces are emitted when enabled', () => {
    enableTracing();
    clearTraces();

    const { graph, avatarId } = buildFullTestGraph();
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({
      id: 'e.trait.eagle', source: avatarId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });

    getModifiedValue(graph, avatarId, 'los_range', 0, 1);

    const traces = getTraces();
    const modTraces = traces.filter(t => t.category === 'modifier_resolution');
    expect(modTraces.length).toBeGreaterThanOrEqual(1);

    disableTracing();
    clearTraces();
  });

  it('works with multiple modifier sources simultaneously', () => {
    const { graph, ascendantId, avatarId } = buildFullTestGraph();

    // Mountains terrain (+2) — already set in buildFullTestGraph
    // Eagle-Eyed trait (+1)
    graph.addNode({ id: 'trait.eagle', type: 'trait', name: 'Eagle-Eyed', properties: {} });
    graph.addEdge({
      id: 'e.trait.eagle', source: avatarId, target: 'trait.eagle', type: 'has_trait',
      properties: { level: 1, modifiers: { los_range: 1 } },
    });
    // Blessing from god (+2)
    graph.addNode({ id: 'god.sun', type: 'actor', name: 'Sun God', properties: { actorType: 'god' } });
    graph.addEdge({
      id: 'e.bless', source: 'god.sun', target: avatarId, type: 'blessed',
      properties: { modifiers: { los_range: 2 } },
    });

    // Total: 0 (base) + 2 (mountains) + 1 (eagle) + 2 (blessing) = 5
    const modifiers = collectModifiers(graph, avatarId, 'los_range');
    expect(modifiers).toHaveLength(3);
    expect(getModifiedValue(graph, avatarId, 'los_range', 0)).toBe(5);
  });
});
