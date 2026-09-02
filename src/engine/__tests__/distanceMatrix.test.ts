// @vitest-lane heavy — builds four generated worlds, one per map preset; 10–84 s on CI run 33653898091 (THR-1384)
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
import { initializeGameState, MAP_SIZE_PRESETS, type MapSizePreset } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { getPlaceTierLocations, isSublocationNode } from '../sublocationShape';

// --- Helpers ---

function loc(id: string): GraphNode {
  return { id, type: 'location', name: id, properties: {} };
}

function actor(id: string): GraphNode {
  return { id, type: 'actor', name: id, properties: {} };
}

/**
 * The canonical sublocation shape (THR-1183): `type: 'location'` discriminated by
 * `parentLocationId`, not by a node type or a subtype string.
 */
function sublocation(id: string, parentLocationId: string): GraphNode {
  return { id, type: 'location', name: id, properties: { parentLocationId } };
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

  it('truncates at MAX_DISTANCE_MATRIX_SIZE, indexing the first N by insertion order', () => {
    // THR-1346: this replaces `expect(MAX_DISTANCE_MATRIX_SIZE).toBe(1200)`, which put
    // the constant on both sides of the assertion and so could not fail. It pinned the
    // number, not the behaviour, and passed for the entire life of the overflow it was
    // nominally guarding. Assert what truncation actually *does* instead.
    const graph = new WorldGraph();
    const total = MAX_DISTANCE_MATRIX_SIZE + 5;
    for (let i = 0; i < total; i++) graph.addNode(loc(`L${i}`));

    const matrix = buildDistanceMatrix(graph);

    expect(matrix.locationCount).toBe(MAX_DISTANCE_MATRIX_SIZE);
    // The first N are in…
    expect(matrix.distances.has('L0')).toBe(true);
    // …and everything past the cap is out, reading as unreachable rather than as an error.
    expect(matrix.distances.has(`L${total - 1}`)).toBe(false);
    expect(getDistance(matrix, `L${total - 1}`, 'L0')).toBe(Infinity);
  });

  describe('sublocation rows (THR-1346)', () => {
    it('excludes sublocations from the index', () => {
      // A settlement with a room inside it. The room is reached via parentLocationId,
      // never via `adjacent` — so it has nothing to contribute to a hop matrix.
      const graph = new WorldGraph();
      graph.addNode(loc('town'));
      graph.addNode(loc('village'));
      graph.addEdge(adjacent('town', 'village'));
      graph.addNode(sublocation('town.tavern', 'town'));

      const matrix = buildDistanceMatrix(graph);

      expect(matrix.locationCount).toBe(2);
      expect(matrix.distances.has('town')).toBe(true);
      expect(matrix.distances.has('village')).toBe(true);
      expect(matrix.distances.has('town.tavern')).toBe(false);
      // The place tier is unaffected by the sublocation's presence.
      expect(getDistance(matrix, 'town', 'village')).toBe(1);
    });

    it('excluding a sublocation is behaviour-neutral for an agent standing there', () => {
      // The whole safety argument for THR-1346 in one assertion. Before the change a
      // sublocation *was* indexed, and — because zero sublocations carry an `adjacent`
      // edge on any generated preset — its row was always exactly `{self: 0}`. Both live
      // consumers (`findVisibleAgents`, `deriveAmbitionTarget`) read a row and derive
      // "which OTHER locations are near me", so a self-only row and a missing row are
      // the same answer. This pins that equivalence rather than trusting the prose.
      const graph = new WorldGraph();
      graph.addNode(loc('town'));
      graph.addNode(sublocation('town.tavern', 'town'));

      const matrix = buildDistanceMatrix(graph);
      const row = matrix.distances.get('town.tavern');

      // What the consumers would compute from the row they now get (undefined)…
      const othersFromMissingRow = row
        ? [...row.keys()].filter((id) => id !== 'town.tavern')
        : [];
      // …and what they would have computed from the self-only row they used to get.
      const selfOnlyRow = new Map<string, number>([['town.tavern', 0]]);
      const othersFromSelfOnlyRow = [...selfOnlyRow.keys()].filter(
        (id) => id !== 'town.tavern',
      );

      expect(othersFromMissingRow).toEqual(othersFromSelfOnlyRow);
      expect(othersFromMissingRow).toEqual([]);
    });

    it('still indexes a location whose parentLocationId is absent', () => {
      // Guard against over-eager exclusion: only a `parentLocationId` makes a node a
      // sublocation. A plain location must not be dropped because it sits on a hex.
      const graph = new WorldGraph();
      graph.addNode(loc('waypoint'));

      const matrix = buildDistanceMatrix(graph);

      expect(matrix.distances.has('waypoint')).toBe(true);
    });
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

describe('distanceMatrix — generated worlds (THR-1346)', () => {
  // Every assertion above this line runs on a hand-built graph, and a fixture supplies
  // its own location count — which is exactly how a cap overflow hid for the whole life
  // of TB-088's cap. `MAX_DISTANCE_MATRIX_SIZE` is a claim about *real presets*, so it
  // can only be falsified by generating real presets.
  const presets: MapSizePreset[] = ['medium', 'large', 'epic'];

  function generate(preset: MapSizePreset) {
    const archetype = generateArchetypes(4, 42)[0];
    const { cols, rows } = MAP_SIZE_PRESETS[preset];
    const { state } = initializeGameState(
      archetype,
      'MatrixProbe',
      createBalancedCosmology(),
      42,
      cols,
      rows,
    );
    return state.graph;
  }

  for (const preset of presets) {
    it(`${preset}: every place-tier location is indexed, with headroom under the cap`, () => {
      const graph = generate(preset);
      const placeTier = getPlaceTierLocations(graph);
      const matrix = buildDistanceMatrix(graph);

      // The preset must fit. If this fails, the world outgrew the cap and agents at the
      // unindexed locations are silently generating no social encounters — raise the cap
      // deliberately and re-measure the table in distanceMatrix.ts, do not relax this.
      expect(placeTier.length).toBeLessThan(MAX_DISTANCE_MATRIX_SIZE);

      // Nothing at the place tier was dropped.
      expect(matrix.locationCount).toBe(placeTier.length);
      for (const node of placeTier) {
        expect(matrix.distances.has(node.id)).toBe(true);
      }
    }, 300_000);

    it(`${preset}: sublocations are excluded, and they are what used to overflow the cap`, () => {
      const graph = generate(preset);
      const allLocationNodes = graph.getNodesByType('location');
      const subs = allLocationNodes.filter((n) => isSublocationNode(n));
      const matrix = buildDistanceMatrix(graph);

      // The tier really is mixed under `getNodesByType('location')` — if this ever goes
      // to zero the exclusion has become a no-op and the test below proves nothing.
      expect(subs.length).toBeGreaterThan(0);
      for (const sub of subs) {
        expect(matrix.distances.has(sub.id)).toBe(false);
      }

      // The behaviour-neutrality argument, re-checked against the real world rather than
      // asserted from the fixture: no sublocation carries an `adjacent` edge, so none of
      // them ever had anything but a self-only row to lose.
      const subsWithAdjacent = subs.filter(
        (s) =>
          graph.getOutgoingEdges(s.id, 'adjacent').length > 0 ||
          graph.getIncomingEdges(s.id, 'adjacent').length > 0,
      );
      expect(subsWithAdjacent).toEqual([]);
    }, 300_000);
  }

  it('large: the pre-THR-1346 index would have truncated real settlements', () => {
    // The regression this ticket actually fixed, pinned so a future widening of the
    // index back to `getNodesByType('location')` fails loudly instead of quietly
    // costing `large` its social encounters. `?view=game&seeded` derives a `large` map.
    const graph = generate('large');
    const allLocationNodes = graph.getNodesByType('location');
    const placeTier = getPlaceTierLocations(graph);

    expect(allLocationNodes.length).toBeGreaterThan(MAX_DISTANCE_MATRIX_SIZE);

    const wouldHaveBeenIndexed = new Set(
      allLocationNodes.slice(0, MAX_DISTANCE_MATRIX_SIZE).map((n) => n.id),
    );
    const truncatedPlaceTier = placeTier.filter((n) => !wouldHaveBeenIndexed.has(n.id));
    expect(truncatedPlaceTier.length).toBeGreaterThan(0);

    // …and none of them are truncated now.
    const matrix = buildDistanceMatrix(graph);
    for (const node of truncatedPlaceTier) {
      expect(matrix.distances.has(node.id)).toBe(true);
    }
  }, 300_000);
});
