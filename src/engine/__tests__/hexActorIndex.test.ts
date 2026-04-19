// src/engine/__tests__/hexActorIndex.test.ts
// Unit tests for buildHexActorIndex — seven cases from THR-188 §7.

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { buildHexActorIndex, getActorsOnHex, hexKey } from '../hexActorIndex';
import type { GraphNode } from '../../types/graph';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeActor(id: string, locationId?: string): GraphNode {
  return {
    id,
    type: 'actor',
    name: id,
    properties: { actorType: 'individual', ...(locationId ? { locationId } : {}) },
  };
}

function makeLocation(id: string, col: number, row: number): GraphNode {
  return {
    id,
    type: 'location',
    name: id,
    properties: { hexCol: col, hexRow: row },
  };
}

function makeSublocation(id: string, parentLocationId: string): GraphNode {
  return {
    id,
    type: 'sublocation',
    name: id,
    properties: { parentLocationId },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildHexActorIndex', () => {
  it('case 1: empty graph returns empty index', () => {
    const graph = new WorldGraph();
    const index = buildHexActorIndex(graph);

    expect(index.byHex.size).toBe(0);
    expect(index.totalActors).toBe(0);
    expect(index.unresolvedCount).toBe(0);
  });

  it('case 2: single actor on a location', () => {
    const graph = new WorldGraph();
    const loc = makeLocation('loc_1', 3, 5);
    const actor = makeActor('actor_1', 'loc_1');
    graph.addNode(loc);
    graph.addNode(actor);

    const index = buildHexActorIndex(graph);

    expect(index.totalActors).toBe(1);
    expect(index.unresolvedCount).toBe(0);

    const actors = getActorsOnHex(index, 3, 5);
    expect(actors).toEqual(['actor_1']);

    // Different hex returns empty
    expect(getActorsOnHex(index, 0, 0)).toEqual([]);
  });

  it('case 3: multiple actors on same hex preserve insertion order', () => {
    const graph = new WorldGraph();
    const loc = makeLocation('loc_1', 2, 4);
    graph.addNode(loc);
    // Add actors in a specific order — index must preserve it
    graph.addNode(makeActor('actor_a', 'loc_1'));
    graph.addNode(makeActor('actor_b', 'loc_1'));
    graph.addNode(makeActor('actor_c', 'loc_1'));

    const index = buildHexActorIndex(graph);

    expect(index.totalActors).toBe(3);
    expect(index.unresolvedCount).toBe(0);
    expect(getActorsOnHex(index, 2, 4)).toEqual(['actor_a', 'actor_b', 'actor_c']);
  });

  it('case 3b: same result on two consecutive calls (determinism)', () => {
    const graph = new WorldGraph();
    const loc = makeLocation('loc_1', 1, 1);
    graph.addNode(loc);
    graph.addNode(makeActor('actor_a', 'loc_1'));
    graph.addNode(makeActor('actor_b', 'loc_1'));

    const index1 = buildHexActorIndex(graph);
    const index2 = buildHexActorIndex(graph);

    expect(getActorsOnHex(index1, 1, 1)).toEqual(getActorsOnHex(index2, 1, 1));
  });

  it('case 4: actor on a sublocation resolves to parent location hex', () => {
    const graph = new WorldGraph();
    const loc = makeLocation('loc_1', 7, 2);
    const sub = makeSublocation('sub_1', 'loc_1');
    const actor = makeActor('actor_1', 'sub_1');
    graph.addNode(loc);
    graph.addNode(sub);
    graph.addNode(actor);

    const index = buildHexActorIndex(graph);

    expect(index.totalActors).toBe(1);
    expect(index.unresolvedCount).toBe(0);
    // Keyed on parent location's hex (7, 2), not on the sublocation id
    expect(getActorsOnHex(index, 7, 2)).toEqual(['actor_1']);
  });

  it('case 5: actor with missing locationId goes to unresolvedCount', () => {
    const graph = new WorldGraph();
    // Actor has no locationId property
    graph.addNode(makeActor('actor_no_loc'));

    const index = buildHexActorIndex(graph);

    expect(index.totalActors).toBe(1);
    expect(index.unresolvedCount).toBe(1);
    expect(index.byHex.size).toBe(0);
  });

  it('case 6: actor whose location lacks hexCol/hexRow goes to unresolvedCount', () => {
    const graph = new WorldGraph();
    // Location without hex coordinates
    graph.addNode({
      id: 'loc_no_hex',
      type: 'location',
      name: 'no-hex-loc',
      properties: {}, // no hexCol/hexRow
    });
    graph.addNode(makeActor('actor_1', 'loc_no_hex'));

    const index = buildHexActorIndex(graph);

    expect(index.totalActors).toBe(1);
    expect(index.unresolvedCount).toBe(1);
    expect(index.byHex.size).toBe(0);
  });

  it('case 7: non-individual actors are excluded from the index', () => {
    const graph = new WorldGraph();
    const loc = makeLocation('loc_1', 0, 0);
    graph.addNode(loc);
    // Individual actor — should be indexed
    graph.addNode(makeActor('actor_individual', 'loc_1'));
    // Army actor — should be excluded
    graph.addNode({
      id: 'actor_army',
      type: 'actor',
      name: 'army',
      properties: { actorType: 'army', locationId: 'loc_1' },
    });

    const index = buildHexActorIndex(graph);

    // Only individual is indexed
    expect(index.totalActors).toBe(1);
    expect(getActorsOnHex(index, 0, 0)).toEqual(['actor_individual']);
  });
});

describe('hexKey', () => {
  it('produces unique keys for different coordinates', () => {
    expect(hexKey(1, 2)).not.toBe(hexKey(2, 1));
    expect(hexKey(0, 0)).not.toBe(hexKey(1, 0));
  });

  it('produces stable string representation', () => {
    expect(hexKey(3, 5)).toBe('3,5');
  });
});

describe('getActorsOnHex', () => {
  it('returns empty array for hex with no actors', () => {
    const graph = new WorldGraph();
    const index = buildHexActorIndex(graph);
    expect(getActorsOnHex(index, 99, 99)).toEqual([]);
  });
});
