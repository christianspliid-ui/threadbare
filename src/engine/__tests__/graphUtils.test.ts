/**
 * Tests for graphUtils.ts — findAllPaths bounded graph traversal.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { findAllPaths, REPUTATION_WALK_MAX_NODES } from '../graphUtils';

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  // Simple diamond graph: A → B → D, A → C → D
  g.addNode({ id: 'A', type: 'actor', name: 'A', properties: {} });
  g.addNode({ id: 'B', type: 'actor', name: 'B', properties: {} });
  g.addNode({ id: 'C', type: 'actor', name: 'C', properties: {} });
  g.addNode({ id: 'D', type: 'actor', name: 'D', properties: {} });

  g.addEdge({ id: 'e1', source: 'A', target: 'B', type: 'relates_to', properties: {} });
  g.addEdge({ id: 'e2', source: 'B', target: 'D', type: 'relates_to', properties: {} });
  g.addEdge({ id: 'e3', source: 'A', target: 'C', type: 'relates_to', properties: {} });
  g.addEdge({ id: 'e4', source: 'C', target: 'D', type: 'relates_to', properties: {} });

  return g;
}

describe('findAllPaths', () => {
  it('finds both paths in a diamond graph', () => {
    const g = makeGraph();
    const paths = findAllPaths(g, 'A', 'D', 3);

    expect(paths).toHaveLength(2);
    expect(paths[0].hops).toBe(2);
    expect(paths[1].hops).toBe(2);

    const pathStrings = paths.map(p => p.nodeIds.join('→'));
    expect(pathStrings).toContain('A→B→D');
    expect(pathStrings).toContain('A→C→D');
  });

  it('respects maxHops limit', () => {
    const g = makeGraph();
    const paths = findAllPaths(g, 'A', 'D', 1);
    expect(paths).toHaveLength(0); // Need 2 hops, only 1 allowed
  });

  it('returns empty for missing source', () => {
    const g = makeGraph();
    const paths = findAllPaths(g, 'MISSING', 'D', 5);
    expect(paths).toEqual([]);
  });

  it('returns empty for missing target', () => {
    const g = makeGraph();
    const paths = findAllPaths(g, 'A', 'MISSING', 5);
    expect(paths).toEqual([]);
  });

  it('returns empty for source === target', () => {
    const g = makeGraph();
    const paths = findAllPaths(g, 'A', 'A', 5);
    expect(paths).toEqual([]);
  });

  it('filters by edge type', () => {
    const g = makeGraph();
    // Add a member_of edge A→D (direct, 1 hop)
    g.addEdge({ id: 'e5', source: 'A', target: 'D', type: 'member_of', properties: {} });

    // relates_to only → 2-hop paths
    const relatePaths = findAllPaths(g, 'A', 'D', 3, 'relates_to');
    expect(relatePaths).toHaveLength(2);
    expect(relatePaths[0].hops).toBe(2);

    // member_of only → 1-hop direct path
    const memberPaths = findAllPaths(g, 'A', 'D', 3, 'member_of');
    expect(memberPaths).toHaveLength(1);
    expect(memberPaths[0].hops).toBe(1);
  });

  it('follows bidirectional edges (incoming)', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'X', type: 'actor', name: 'X', properties: {} });
    g.addNode({ id: 'Y', type: 'actor', name: 'Y', properties: {} });
    // Edge goes Y → X, but we search X → Y (should traverse incoming edge)
    g.addEdge({ id: 'e1', source: 'Y', target: 'X', type: 'relates_to', properties: {} });

    const paths = findAllPaths(g, 'X', 'Y', 1);
    expect(paths).toHaveLength(1);
    expect(paths[0].nodeIds).toEqual(['X', 'Y']);
  });

  it('avoids cycles (no repeated nodes in a path)', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'A', type: 'actor', name: 'A', properties: {} });
    g.addNode({ id: 'B', type: 'actor', name: 'B', properties: {} });
    g.addNode({ id: 'C', type: 'actor', name: 'C', properties: {} });
    // Cycle: A → B → C → A, plus B → C (direct path A→B→C exists)
    g.addEdge({ id: 'e1', source: 'A', target: 'B', type: 'relates_to', properties: {} });
    g.addEdge({ id: 'e2', source: 'B', target: 'C', type: 'relates_to', properties: {} });
    g.addEdge({ id: 'e3', source: 'C', target: 'A', type: 'relates_to', properties: {} });

    const paths = findAllPaths(g, 'A', 'C', 5);
    // Should find A→B→C but not A→B→C→A→B→C (would revisit A)
    expect(paths.length).toBeGreaterThanOrEqual(1);
    for (const p of paths) {
      const unique = new Set(p.nodeIds);
      expect(unique.size).toBe(p.nodeIds.length); // No repeated nodes
    }
  });

  it('sorts paths shortest first', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'A', type: 'actor', name: 'A', properties: {} });
    g.addNode({ id: 'B', type: 'actor', name: 'B', properties: {} });
    g.addNode({ id: 'C', type: 'actor', name: 'C', properties: {} });
    // Direct: A→C (1 hop), Indirect: A→B→C (2 hops)
    g.addEdge({ id: 'e1', source: 'A', target: 'C', type: 'relates_to', properties: {} });
    g.addEdge({ id: 'e2', source: 'A', target: 'B', type: 'relates_to', properties: {} });
    g.addEdge({ id: 'e3', source: 'B', target: 'C', type: 'relates_to', properties: {} });

    const paths = findAllPaths(g, 'A', 'C', 3);
    expect(paths.length).toBeGreaterThanOrEqual(2);
    expect(paths[0].hops).toBeLessThanOrEqual(paths[1].hops);
  });

  it('returns empty for maxHops = 0', () => {
    const g = makeGraph();
    expect(findAllPaths(g, 'A', 'D', 0)).toEqual([]);
  });

  it('REPUTATION_WALK_MAX_NODES constant is 100', () => {
    expect(REPUTATION_WALK_MAX_NODES).toBe(100);
  });
});
