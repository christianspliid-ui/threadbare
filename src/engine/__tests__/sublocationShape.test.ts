/**
 * THR-1183 — sublocations reach the graph in one node shape, and every reader asks the
 * same question about it.
 *
 * The defect these tests pin: sublocations used to be minted two ways
 * (`sublocation.ts` → `type: 'location'` + `parentLocationId`;
 * `strategicGraphOps.createSublocation` → `type: 'sublocation'`), so a
 * `getNodesByType('location')` sweep missed every strategic sublocation and a
 * `getNodesByType('sublocation')` sweep missed every canonical one — each shape half
 * visible, in complementary halves.
 *
 * The tally test below is the one that would have caught it: it counts *both* shapes in
 * one graph and asserts the sweep finds all of them. A test that counted only the shape
 * we kept would pass under the bug and is vacuous by construction.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { createSublocation } from '../strategicGraphOps';
import { checkDissolutions } from '../sublocation';
import {
  isSublocationNode,
  isPlaceTierLocation,
  getSublocationNodes,
  getPlaceTierLocations,
  resolveToParentLocation,
  LEGACY_SUBLOCATION_NODE_TYPE,
} from '../sublocationShape';

/** A place-tier location: no `parentLocationId`. */
function addParentLocation(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Location ${id}`,
    properties: { hexCol: 4, hexRow: 7, regionId: 'region.north' },
  });
}

/** The canonical sublocation shape, as `sublocation.ts` mints it. */
function addCanonicalSublocation(graph: WorldGraph, id: string, parentId: string): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Canonical ${id}`,
    properties: {
      sublocationTypeId: 'sublocation-type.tavern',
      parentLocationId: parentId,
      hexCol: 4,
      hexRow: 7,
    },
  });
}

/** The legacy shape — no longer written, still readable out of a saved world. */
function addLegacySublocation(graph: WorldGraph, id: string, parentId: string): void {
  graph.addNode({
    id,
    type: LEGACY_SUBLOCATION_NODE_TYPE,
    name: `Legacy ${id}`,
    properties: {
      sublocationTypeId: 'sublocation-type.warehouse',
      parentLocationId: parentId,
      hexCol: 4,
      hexRow: 7,
    },
  });
}

describe('THR-1183 — one sublocation mint shape', () => {
  describe('createSublocation mints the canonical shape', () => {
    it('produces a `location` node, not a `sublocation` node', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      graph.addNode({ id: 'actor.merchant', type: 'actor', name: 'Merchant', properties: {} });

      const result = createSublocation(
        graph, 'loc.haven', 'actor.merchant', 'Goldvein Warehouse',
        'sublocation-type.warehouse', 12,
      );

      expect(result.success).toBe(true);
      const node = graph.getNode(result.createdId!);
      expect(node?.type).toBe('location');
      // The discriminator, not the type literal, is what marks the tier.
      expect(node?.properties.parentLocationId).toBe('loc.haven');
      expect(node?.properties.sublocationTypeId).toBe('sublocation-type.warehouse');
    });

    it('is visible to a plain getNodesByType(\'location\') sweep', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      graph.addNode({ id: 'actor.merchant', type: 'actor', name: 'Merchant', properties: {} });
      const result = createSublocation(
        graph, 'loc.haven', 'actor.merchant', 'Goldvein Warehouse',
        'sublocation-type.warehouse', 12,
      );

      const ids = graph.getNodesByType('location').map(n => n.id);
      // Before THR-1183 this sweep returned only ['loc.haven'] — the strategic
      // sublocation existed and no location sweep in the codebase could see it.
      expect(ids).toContain(result.createdId!);
      expect(ids).toContain('loc.haven');
    });
  });

  describe('the dissolution sweep now reaches strategic sublocations without crashing', () => {
    // Unifying the mint shape brought `createSublocation`'s nodes into
    // `checkDissolutions`' sweep for the first time and the loop threw on the first one,
    // crashing the tick — because that writer never wrote `persistence`, a *required*
    // field of `SublocationProperties`. The omission was real all along; the old node
    // type merely hid it. Both halves are pinned here.

    it('createSublocation writes the required persistence field', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      graph.addNode({ id: 'actor.merchant', type: 'actor', name: 'Merchant', properties: {} });

      const result = createSublocation(
        graph, 'loc.haven', 'actor.merchant', 'Goldvein Warehouse',
        'sublocation-type.warehouse', 12,
      );

      expect(graph.getNode(result.createdId!)?.properties.persistence).toEqual({ type: 'permanent' });
    });

    it('checkDissolutions survives a sublocation with no persistence at all', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      // A node from a saved world written before the field was set — the shape that
      // crashed the tick loop. Fail-soft (NFP #4): skipped, never thrown on.
      graph.addNode({
        id: 'sub.persistenceless',
        type: 'location',
        name: 'Persistenceless',
        properties: { sublocationTypeId: 'sublocation-type.warehouse', parentLocationId: 'loc.haven' },
      });

      expect(() => checkDissolutions(graph, 40)).not.toThrow();
      // Treated as permanent — refusing to dissolve is the recoverable direction.
      expect(checkDissolutions(graph, 40)).toEqual([]);
      expect(graph.getNode('sub.persistenceless')).toBeDefined();
    });
  });

  describe('the sweep finds every tier member, whatever shape it arrived in', () => {
    it('getSublocationNodes counts canonical AND legacy in one graph', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      addParentLocation(graph, 'loc.reach');
      addCanonicalSublocation(graph, 'sub.tavern', 'loc.haven');
      addCanonicalSublocation(graph, 'sub.shrine', 'loc.reach');
      addLegacySublocation(graph, 'sub.legacy', 'loc.haven');

      const found = getSublocationNodes(graph).map(n => n.id).sort();

      // Both shapes present in the same world — the tally that makes this non-vacuous.
      expect(found).toEqual(['sub.legacy', 'sub.shrine', 'sub.tavern']);
      // And the two single-type sweeps each miss a member, which is the whole defect.
      expect(graph.getNodesByType(LEGACY_SUBLOCATION_NODE_TYPE).map(n => n.id)).toEqual(['sub.legacy']);
    });

    it('getPlaceTierLocations excludes sublocations of both shapes', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      addCanonicalSublocation(graph, 'sub.tavern', 'loc.haven');
      addLegacySublocation(graph, 'sub.legacy', 'loc.haven');

      expect(getPlaceTierLocations(graph).map(n => n.id)).toEqual(['loc.haven']);
    });

    it('the two sweeps partition the location tier with no overlap and no gap', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      addCanonicalSublocation(graph, 'sub.tavern', 'loc.haven');
      addLegacySublocation(graph, 'sub.legacy', 'loc.haven');

      const subs = getSublocationNodes(graph).map(n => n.id);
      const places = getPlaceTierLocations(graph).map(n => n.id);

      expect(subs.filter(id => places.includes(id))).toEqual([]);
      expect([...subs, ...places].sort()).toEqual(['loc.haven', 'sub.legacy', 'sub.tavern']);
    });
  });

  describe('isSublocationNode — the single discriminator', () => {
    it('accepts the canonical shape', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      addCanonicalSublocation(graph, 'sub.tavern', 'loc.haven');
      expect(isSublocationNode(graph.getNode('sub.tavern'))).toBe(true);
      expect(isPlaceTierLocation(graph.getNode('sub.tavern'))).toBe(false);
    });

    it('accepts the legacy shape, so a saved world degrades to visible not invisible', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      addLegacySublocation(graph, 'sub.legacy', 'loc.haven');
      expect(isSublocationNode(graph.getNode('sub.legacy'))).toBe(true);
    });

    it('rejects a place-tier location', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      expect(isSublocationNode(graph.getNode('loc.haven'))).toBe(false);
      expect(isPlaceTierLocation(graph.getNode('loc.haven'))).toBe(true);
    });

    it('rejects non-location nodes and missing nodes', () => {
      const graph = new WorldGraph();
      graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: { parentLocationId: 'loc.haven' } });
      // An actor carrying the property is still not a place — the type is checked too.
      expect(isSublocationNode(graph.getNode('actor.a'))).toBe(false);
      expect(isSublocationNode(undefined)).toBe(false);
      expect(isPlaceTierLocation(undefined)).toBe(false);
    });

    it('does not accept the fixture-only spellings no writer emits', () => {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'sub.fake', type: 'location', name: 'Fake',
        properties: { locationSubtype: 'sublocation', locationType: 'sublocation' },
      });
      // Both spellings appear in old test fixtures and in no production writer.
      // Accepting them would let a fixture define the shape (see the module doc).
      expect(isSublocationNode(graph.getNode('sub.fake'))).toBe(false);
    });
  });

  describe('resolveToParentLocation', () => {
    it('resolves both shapes up to the same parent', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      addCanonicalSublocation(graph, 'sub.tavern', 'loc.haven');
      addLegacySublocation(graph, 'sub.legacy', 'loc.haven');

      expect(resolveToParentLocation(graph, graph.getNode('sub.tavern'))?.id).toBe('loc.haven');
      expect(resolveToParentLocation(graph, graph.getNode('sub.legacy'))?.id).toBe('loc.haven');
    });

    it('returns a place-tier location unchanged', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      expect(resolveToParentLocation(graph, graph.getNode('loc.haven'))?.id).toBe('loc.haven');
    });

    it('returns undefined for a dangling or missing parent, and never throws', () => {
      const graph = new WorldGraph();
      addCanonicalSublocation(graph, 'sub.orphan', 'loc.gone');
      graph.addNode({
        id: 'sub.rootless', type: LEGACY_SUBLOCATION_NODE_TYPE, name: 'Rootless',
        properties: { sublocationTypeId: 'sublocation-type.warehouse' },
      });

      expect(resolveToParentLocation(graph, graph.getNode('sub.orphan'))).toBeUndefined();
      expect(resolveToParentLocation(graph, graph.getNode('sub.rootless'))).toBeUndefined();
      expect(resolveToParentLocation(graph, undefined)).toBeUndefined();
    });

    it('reaches the parent\'s regionId — the read that silently returned null before', () => {
      const graph = new WorldGraph();
      addParentLocation(graph, 'loc.haven');
      addCanonicalSublocation(graph, 'sub.tavern', 'loc.haven');

      // phaseDetectionPressure resolves an agent's location to a region this way. The
      // old `node.type === 'sublocation'` test skipped the resolve for this shape and
      // then read regionId off the sublocation, which carries none.
      expect(graph.getNode('sub.tavern')?.properties.regionId).toBeUndefined();
      expect(resolveToParentLocation(graph, graph.getNode('sub.tavern'))?.properties.regionId)
        .toBe('region.north');
    });
  });
});
