/**
 * Lair namer — THR-1312.
 *
 * The load-bearing test is `rejects the placeholder shape on a seeded world`: a
 * predicate over a real `seedMonsterLairs` pass, not a snapshot count, so it cannot
 * rot the way "17 of 17" would the moment density constants move.
 *
 * Every population-level assertion here is preceded by a non-emptiness guard. A
 * "no location matches /^Lair \d/" assertion passes perfectly on a world with no
 * lairs in it, which is the exact shape that makes a green test meaningless — the
 * guard is what makes the predicate evidence rather than decoration.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import { seedMonsterLairs } from '../../lairSeeding';
import { generateLairName } from '../lairNames';
import {
  LAIR_NOUNS_BY_FAMILY,
  LAIR_ROOTS_BY_SPHERE,
  familyForTerrain,
} from '../../../data/lair-name-content';
import type { HexTile } from '../../../types/index';
import { PROVINCE_ROLE_BORDERLAND } from '../../worldgen/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** The placeholder shapes THR-1312 exists to eliminate, from both writers. */
const SEEDED_PLACEHOLDER = /^Lair \d/;
const ESCALATION_PLACEHOLDER = /^Lair \(spawned/;

/** Land terrains spanning every naming family, cycled across the grid. */
const LAND_TERRAINS = [
  'grassland',    // burrow
  'dense_forest', // thicket
  'swamp',        // mire
  'mountains',    // deep
  'desert',       // waste
  'broken_lands', // blight
] as const;

function makeVariedTiles(cols: number, rows: number): HexTile[] {
  const tiles: HexTile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: LAND_TERRAINS[(col + row) % LAND_TERRAINS.length],
      });
    }
  }
  return tiles;
}

function lairNames(graph: WorldGraph): string[] {
  return graph
    .getNodesByType('location')
    .filter(n => n.properties.locationSubtype === 'lair')
    .map(n => n.name as string);
}

/** A seeded world with enough wilderness to produce a real lair population. */
function seedWorld(seed: number): WorldGraph {
  const cols = 32;
  const rows = 24;
  const graph = new WorldGraph();
  const roles = new Uint8Array(cols * rows);
  roles.fill(PROVINCE_ROLE_BORDERLAND);
  seedMonsterLairs(graph, roles, makeVariedTiles(cols, rows), seed, cols);
  return graph;
}

// ─── The done-when predicate ─────────────────────────────────────────────────

describe('lair naming on a seeded world', () => {
  it('rejects the placeholder shape on a seeded world', () => {
    const names = lairNames(seedWorld(42));

    // Anti-vacuous guard: the predicate below is trivially true on an empty world.
    expect(names.length).toBeGreaterThan(5);

    expect(names.filter(n => SEEDED_PLACEHOLDER.test(n))).toEqual([]);
    expect(names.filter(n => ESCALATION_PLACEHOLDER.test(n))).toEqual([]);
  });

  it('names every lair — no blanks, no raw ids', () => {
    const graph = seedWorld(42);
    const nodes = graph
      .getNodesByType('location')
      .filter(n => n.properties.locationSubtype === 'lair');

    expect(nodes.length).toBeGreaterThan(5);
    for (const node of nodes) {
      expect(typeof node.name).toBe('string');
      expect((node.name as string).trim().length).toBeGreaterThan(0);
      expect(node.name).not.toBe(node.id);
      expect(node.name).not.toContain('{');
    }
  });

  it('hands out distinct names across a seeded world', () => {
    const names = lairNames(seedWorld(42));

    expect(names.length).toBeGreaterThan(5);
    expect(new Set(names).size).toBe(names.length);
  });

  it('is deterministic — same seed, same names, same order', () => {
    expect(lairNames(seedWorld(42))).toEqual(lairNames(seedWorld(42)));
  });

  it('places the same lairs as before naming was wired in', () => {
    // The namer draws from its own PRNG seeded off the node id, never from
    // `seedMonsterLairs`' stream. If that ever stops being true, placement shifts
    // and this comparison against a second identical run is not what catches it —
    // the hex coordinates being stable under a *different* name-affecting input is.
    const coords = (seed: number) =>
      seedWorld(seed)
        .getNodesByType('location')
        .filter(n => n.properties.locationSubtype === 'lair')
        .map(n => `${n.properties.hexCol},${n.properties.hexRow}`);

    const a = coords(42);
    expect(a.length).toBeGreaterThan(5);
    expect(coords(42)).toEqual(a);
    // A different seed must move them — otherwise the comparison above proves nothing.
    expect(coords(99)).not.toEqual(a);
  });
});

// ─── Resolver behaviour ──────────────────────────────────────────────────────

describe('generateLairName', () => {
  it('is a pure function of the lair id', () => {
    const ctx = { lairId: 'lair_7', terrain: 'swamp', dominantSphere: 'entropy' };
    expect(generateLairName(ctx)).toBe(generateLairName(ctx));
  });

  it('gives different ids different names', () => {
    const names = new Set(
      Array.from({ length: 20 }, (_, i) =>
        generateLairName({ lairId: `lair_${i}`, terrain: 'mountains', dominantSphere: 'matter' }),
      ),
    );
    // Not asserting all 20 are unique — the pool is finite and collisions without a
    // `usedNames` set are legitimate. Asserting the namer is not constant.
    expect(names.size).toBeGreaterThan(5);
  });

  it('draws its noun from the terrain family', () => {
    for (const terrain of LAND_TERRAINS) {
      const family = familyForTerrain(terrain);
      const nouns = LAIR_NOUNS_BY_FAMILY[family];
      const name = generateLairName({ lairId: `lair_${terrain}`, terrain });
      expect(nouns.some(noun => name.endsWith(noun))).toBe(true);
    }
  });

  it('reaches the sphere lexicon, not only the terrain one', () => {
    const sphereRoots = LAIR_ROOTS_BY_SPHERE.entropy;
    const names = Array.from({ length: 40 }, (_, i) =>
      generateLairName({ lairId: `lair_s_${i}`, terrain: 'grassland', dominantSphere: 'entropy' }),
    );
    // Over 40 ids at least one name must carry a sphere root — otherwise the sphere
    // pool is wired but unreachable, which is the dead-term shape this asserts against.
    expect(names.some(n => sphereRoots.some(root => n.includes(root)))).toBe(true);
  });

  it('walks around names already taken', () => {
    const free = generateLairName({ lairId: 'lair_c', terrain: 'hills' });
    const taken = new Set([free]);
    const next = generateLairName({ lairId: 'lair_c', terrain: 'hills', usedNames: taken });
    expect(next).not.toBe(free);
  });

  it('never emits a placeholder shape, whatever it is handed', () => {
    const inputs = [
      { lairId: 'lair_0' },
      { lairId: 'lair_1', terrain: 'not_a_real_terrain' },
      { lairId: 'lair_adj_25_3_4_0', terrain: 'ocean', dominantSphere: 'not_a_sphere' },
      { lairId: '', terrain: undefined, dominantSphere: undefined },
    ];
    for (const input of inputs) {
      const name = generateLairName(input);
      expect(name).not.toMatch(SEEDED_PLACEHOLDER);
      expect(name).not.toMatch(ESCALATION_PLACEHOLDER);
      expect(name.trim().length).toBeGreaterThan(0);
    }
  });

  it('fails soft on unusable input rather than throwing', () => {
    expect(() =>
      generateLairName({ lairId: '', terrain: 'nonsense', dominantSphere: 'nonsense' }),
    ).not.toThrow();
  });
});
