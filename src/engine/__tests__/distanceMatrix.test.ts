import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  buildDistanceMatrix,
  getDistance,
  addLocation,
  removeLocation,
  MAX_DISTANCE_MATRIX_SIZE,
} from '../distanceMatrix';
import type { GraphNode, GraphEdge } from '../../types/graph';

// --- Helpers ---

function loc(id: string): GraphNode {
  return { id, type: 'location', name: id, properties: {} };
}

function actor(id: string): GraphNode {
  return { id, type: 'actor', name: id, properties: {} };
}

function adjacent(source: string, target: string): GraphEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    type: 'adjacent',
    properties: {},
  };
}

// --- Tests ---

describe('distanceMatrix', () => {
  it('empty graph returns empty matrix', () => {
    const graph = new WorldGraph();
    const matrix = buildDistanceMatrix(graph);

    expect(matrix.locationCount).toBe(0);
    expect(matrix.distances.size).toBe(0);
    expect(matrix.builtAtTick).toBe(0);
  });

  it('single location has self-distance 0', () => {
    const graph = new WorldGraph();
    graph.addNode(loc('hex-1'));

    const matrix = buildDistanceMatrix(graph);

    expect(matrix.locationCount).toBe(1);
    expect(getDistance(matrix, 'hex-1', 'hex-1')).toBe(0);
  });

  it('linear chain A-B-C computes correct distances', () => {
    const graph = new WorldGraph();
    graph.addNode(loc('A'));
    graph.addNode(loc('B'));
    graph.addNode(loc('C'));
    graph.addEdge(adjacent('A', 'B'));
    graph.addEdge(adjacent('B', 'C'));

    const matrix = buildDistanceMatrix(graph);

    expect(getDistance(matrix, 'A', 'B')).toBe(1);
    expect(getDistance(matrix, 'B', 'A')).toBe(1);
    expect(getDistance(matrix, 'A', 'C')).toBe(2);
    expect(getDistance(matrix, 'C', 'A')).toBe(2);
    expect(getDistance(matrix, 'B', 'C')).toBe(1);
    expect(getDistance(matrix, 'C', 'B')).toBe(1);
  });

  it('disconnected locations return Infinity', () => {
    const graph = new WorldGraph();
    graph.addNode(loc('island-1'));
    graph.addNode(loc('island-2'));

    const matrix = buildDistanceMatrix(graph);

    expect(matrix.locationCount).toBe(2);
    expect(getDistance(matrix, 'island-1', 'island-2')).toBe(Infinity);
    expect(getDistance(matrix, 'island-2', 'island-1')).toBe(Infinity);
    // Self-distance still works
    expect(getDistance(matrix, 'island-1', 'island-1')).toBe(0);
  });

  it('addLocation updates matrix correctly', () => {
    const graph = new WorldGraph();
    graph.addNode(loc('A'));
    graph.addNode(loc('B'));
    graph.addEdge(adjacent('A', 'B'));

    const matrix = buildDistanceMatrix(graph);
    expect(matrix.locationCount).toBe(2);

    // Add C connected to B
    graph.addNode(loc('C'));
    graph.addEdge(adjacent('B', 'C'));
    addLocation(matrix, graph, 'C');

    expect(matrix.locationCount).toBe(3);
    expect(getDistance(matrix, 'C', 'C')).toBe(0);
    expect(getDistance(matrix, 'B', 'C')).toBe(1);
    expect(getDistance(matrix, 'C', 'B')).toBe(1);
    expect(getDistance(matrix, 'A', 'C')).toBe(2);
    expect(getDistance(matrix, 'C', 'A')).toBe(2);
  });

  it('removeLocation cleans up rows and columns', () => {
    const graph = new WorldGraph();
    graph.addNode(loc('A'));
    graph.addNode(loc('B'));
    graph.addNode(loc('C'));
    graph.addEdge(adjacent('A', 'B'));
    graph.addEdge(adjacent('B', 'C'));

    const matrix = buildDistanceMatrix(graph);
    expect(matrix.locationCount).toBe(3);

    removeLocation(matrix, 'B');

    expect(matrix.locationCount).toBe(2);
    // B is gone from all lookups
    expect(getDistance(matrix, 'B', 'A')).toBe(Infinity);
    expect(getDistance(matrix, 'A', 'B')).toBe(Infinity);
    // A and C still have their own self-distance
    expect(getDistance(matrix, 'A', 'A')).toBe(0);
    expect(getDistance(matrix, 'C', 'C')).toBe(0);
    // A↔C was only reachable through B, so now A→C in the matrix
    // is stale (still shows 2) — but B's column is removed
    // The matrix reflects the snapshot at build time; removal just
    // cleans up the removed node's entries.
  });

  it('getDistance with missing ID returns Infinity', () => {
    const graph = new WorldGraph();
    graph.addNode(loc('A'));

    const matrix = buildDistanceMatrix(graph);

    expect(getDistance(matrix, 'A', 'nonexistent')).toBe(Infinity);
    expect(getDistance(matrix, 'nonexistent', 'A')).toBe(Infinity);
    expect(getDistance(matrix, 'nope', 'also-nope')).toBe(Infinity);
  });

  it('only location nodes are included — actors are ignored', () => {
    const graph = new WorldGraph();
    graph.addNode(loc('hex-1'));
    graph.addNode(loc('hex-2'));
    graph.addNode(actor('warrior'));
    graph.addEdge(adjacent('hex-1', 'hex-2'));

    const matrix = buildDistanceMatrix(graph);

    expect(matrix.locationCount).toBe(2);
    expect(matrix.distances.has('warrior')).toBe(false);
    expect(getDistance(matrix, 'hex-1', 'hex-2')).toBe(1);
  });

  it('bidirectional traversal via incoming edges works', () => {
    // Only add edge in one direction: A → B. BFS should still find B → A = 1.
    const graph = new WorldGraph();
    graph.addNode(loc('A'));
    graph.addNode(loc('B'));
    graph.addEdge(adjacent('A', 'B')); // only A→B edge

    const matrix = buildDistanceMatrix(graph);

    // A→B via outgoing
    expect(getDistance(matrix, 'A', 'B')).toBe(1);
    // B→A via incoming edge traversal
    expect(getDistance(matrix, 'B', 'A')).toBe(1);
  });

  it('MAX_DISTANCE_MATRIX_SIZE caps the number of indexed locations', () => {
    // TB-088: Raised from 500 to 1200 to cover large/epic map presets
    expect(MAX_DISTANCE_MATRIX_SIZE).toBe(1200);
  });

  it('diamond graph computes shortest paths', () => {
    //   A
    //  / \
    // B   C
    //  \ /
    //   D
    const graph = new WorldGraph();
    graph.addNode(loc('A'));
    graph.addNode(loc('B'));
    graph.addNode(loc('C'));
    graph.addNode(loc('D'));
    graph.addEdge(adjacent('A', 'B'));
    graph.addEdge(adjacent('A', 'C'));
    graph.addEdge(adjacent('B', 'D'));
    graph.addEdge(adjacent('C', 'D'));

    const matrix = buildDistanceMatrix(graph);

    // A→D should be 2 (via B or C), not 3
    expect(getDistance(matrix, 'A', 'D')).toBe(2);
    expect(getDistance(matrix, 'D', 'A')).toBe(2);
    expect(getDistance(matrix, 'B', 'C')).toBe(2);
  });
});
