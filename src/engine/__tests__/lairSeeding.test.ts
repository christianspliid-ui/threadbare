/**
 * Tests for monster lair seeding at worldgen.
 *
 * Plan: m2.5-01 Task 2
 * Covers: density by zone, separation, determinism, lair node properties.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  seedMonsterLairs,
  LAIR_SEEDING_CONSTANTS,
} from '../lairSeeding';
import type { HexTile } from '../../types/index';
import {
  PROVINCE_ROLE_CAPITAL,
  PROVINCE_ROLE_HEARTLAND,
  PROVINCE_ROLE_BORDERLAND,
} from '../worldgen/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a simple grid of land HexTiles.
 * All tiles are grassland unless overridden.
 */
function makeTiles(cols: number, rows: number): HexTile[] {
  const tiles: HexTile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland',
      });
    }
  }
  return tiles;
}

/**
 * Build a Uint8Array of province roles, all set to the given role.
 */
function makeRoles(cols: number, rows: number, role: number): Uint8Array {
  const arr = new Uint8Array(cols * rows);
  arr.fill(role);
  return arr;
}

/**
 * Count lair nodes in the graph.
 */
function countLairNodes(graph: WorldGraph): number {
  return graph.getNodesByType('location').filter(
    n => n.properties.locationSubtype === 'lair'
  ).length;
}

// ─── Test 1: All-capital province roles → 0 lairs ────────────────────────────

describe('seedMonsterLairs — capital zones', () => {
  it('produces zero lairs when all tiles are capital zone', () => {
    const cols = 10;
    const rows = 10;
    const graph = new WorldGraph();
    const tiles = makeTiles(cols, rows);
    const provinceRoles = makeRoles(cols, rows, PROVINCE_ROLE_CAPITAL);

    seedMonsterLairs(graph, provinceRoles, tiles, 42, cols);

    expect(countLairNodes(graph)).toBe(0);
  });
});

// ─── Test 2: Wilderness zones produce lairs ───────────────────────────────────

describe('seedMonsterLairs — wilderness zones', () => {
  it('produces lairs when tiles are wilderness zone', () => {
    const cols = 20;
    const rows = 20;
    const graph = new WorldGraph();
    const tiles = makeTiles(cols, rows);
    // No province role = wilderness (default 0 is capital but we'll use
    // a custom fill: all values above 2 are treated as wilderness by lairSeeding)
    // Actually wilderness = no province (role treated as undefined/null in lairSeeding)
    // We pass a roles array but mark all as BORDERLAND (role 2) since all wilderness
    // means we fill with values that the seeding treats as wilderness.
    // The lairSeeding maps: 0=capital, 1=heartland, 2=borderland, other=wilderness.
    // Let's use a Uint8Array with value 3 to represent wilderness.
    const provinceRoles = new Uint8Array(cols * rows);
    provinceRoles.fill(3); // 3 = wilderness (beyond the 0-2 province role range)

    seedMonsterLairs(graph, provinceRoles, tiles, 42, cols);

    const lairCount = countLairNodes(graph);
    const totalTiles = cols * rows;
    const expectedMin = totalTiles * LAIR_SEEDING_CONSTANTS.WILDERNESS_LAIR_DENSITY * 0.5;
    const expectedMax = totalTiles * LAIR_SEEDING_CONSTANTS.WILDERNESS_LAIR_DENSITY * 2.0;
    expect(lairCount).toBeGreaterThan(expectedMin);
    expect(lairCount).toBeLessThan(expectedMax);
  });

  it('produces more lairs for wilderness than borderland at same size', () => {
    const cols = 20;
    const rows = 20;

    const wildernessGraph = new WorldGraph();
    const wildernessRoles = new Uint8Array(cols * rows);
    wildernessRoles.fill(3); // wilderness
    seedMonsterLairs(wildernessGraph, wildernessRoles, makeTiles(cols, rows), 42, cols);
    const wildernessCount = countLairNodes(wildernessGraph);

    const borderlandGraph = new WorldGraph();
    const borderlandRoles = makeRoles(cols, rows, PROVINCE_ROLE_BORDERLAND);
    seedMonsterLairs(borderlandGraph, borderlandRoles, makeTiles(cols, rows), 42, cols);
    const borderlandCount = countLairNodes(borderlandGraph);

    expect(wildernessCount).toBeGreaterThan(borderlandCount);
  });
});

// ─── Test 3: MIN_LAIR_SEPARATION ─────────────────────────────────────────────

describe('seedMonsterLairs — separation constraint', () => {
  it('places no two lairs within MIN_LAIR_SEPARATION hexes of each other', () => {
    const cols = 20;
    const rows = 20;
    const graph = new WorldGraph();
    const tiles = makeTiles(cols, rows);
    const provinceRoles = new Uint8Array(cols * rows);
    provinceRoles.fill(3); // wilderness

    seedMonsterLairs(graph, provinceRoles, tiles, 42, cols);

    const lairNodes = graph.getNodesByType('location').filter(
      n => n.properties.locationSubtype === 'lair'
    );

    for (let i = 0; i < lairNodes.length; i++) {
      for (let j = i + 1; j < lairNodes.length; j++) {
        const a = lairNodes[i];
        const b = lairNodes[j];
        const colA = a.properties.hexCol as number;
        const rowA = a.properties.hexRow as number;
        const colB = b.properties.hexCol as number;
        const rowB = b.properties.hexRow as number;
        const manhattanDist = Math.abs(colA - colB) + Math.abs(rowA - rowB);
        expect(manhattanDist).toBeGreaterThanOrEqual(
          LAIR_SEEDING_CONSTANTS.MIN_LAIR_SEPARATION
        );
      }
    }
  });
});

// ─── Test 4: Lair node properties ────────────────────────────────────────────

describe('seedMonsterLairs — lair node properties', () => {
  it('every lair has locationSubtype=lair, lairTier=minor, and valid dominantSphere', () => {
    const cols = 20;
    const rows = 20;
    const graph = new WorldGraph();
    const tiles = makeTiles(cols, rows);
    const provinceRoles = new Uint8Array(cols * rows);
    provinceRoles.fill(3); // wilderness

    seedMonsterLairs(graph, provinceRoles, tiles, 42, cols);

    const lairNodes = graph.getNodesByType('location').filter(
      n => n.properties.locationSubtype === 'lair'
    );
    expect(lairNodes.length).toBeGreaterThan(0);

    const validSpheres = new Set([
      'force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy',
      'chaos', 'order', 'light', 'darkness',
    ]);

    for (const lair of lairNodes) {
      expect(lair.properties.locationSubtype).toBe('lair');
      expect(lair.properties.lairTier).toBe('minor');
      expect(lair.properties.dominantSphere).toBeTruthy();
      expect(validSpheres.has(lair.properties.dominantSphere as string)).toBe(true);
      expect(lair.properties.spawnedAtTick).toBe(0);
      expect(lair.properties.lastEscalationTick).toBe(0);
    }
  });

  it('every lair has hexCol and hexRow properties set', () => {
    const cols = 20;
    const rows = 20;
    const graph = new WorldGraph();
    const tiles = makeTiles(cols, rows);
    const provinceRoles = new Uint8Array(cols * rows);
    provinceRoles.fill(3); // wilderness

    seedMonsterLairs(graph, provinceRoles, tiles, 99, cols);

    const lairNodes = graph.getNodesByType('location').filter(
      n => n.properties.locationSubtype === 'lair'
    );
    expect(lairNodes.length).toBeGreaterThan(0);

    for (const lair of lairNodes) {
      expect(typeof lair.properties.hexCol).toBe('number');
      expect(typeof lair.properties.hexRow).toBe('number');
      expect((lair.properties.hexCol as number)).toBeGreaterThanOrEqual(0);
      expect((lair.properties.hexRow as number)).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── Test 5: dangerZone property ─────────────────────────────────────────────

describe('seedMonsterLairs — dangerZone property', () => {
  it('lairs in borderland zones have dangerZone=borderland', () => {
    const cols = 20;
    const rows = 20;
    const graph = new WorldGraph();
    const tiles = makeTiles(cols, rows);
    const provinceRoles = makeRoles(cols, rows, PROVINCE_ROLE_BORDERLAND);

    seedMonsterLairs(graph, provinceRoles, tiles, 42, cols);

    const lairNodes = graph.getNodesByType('location').filter(
      n => n.properties.locationSubtype === 'lair'
    );

    if (lairNodes.length > 0) {
      for (const lair of lairNodes) {
        expect(lair.properties.dangerZone).toBe('borderland');
      }
    }
  });

  it('lairs in heartland zones have dangerZone=heartland', () => {
    const cols = 30;
    const rows = 30;
    const graph = new WorldGraph();
    const tiles = makeTiles(cols, rows);
    const provinceRoles = makeRoles(cols, rows, PROVINCE_ROLE_HEARTLAND);

    seedMonsterLairs(graph, provinceRoles, tiles, 42, cols);

    const lairNodes = graph.getNodesByType('location').filter(
      n => n.properties.locationSubtype === 'lair'
    );

    if (lairNodes.length > 0) {
      for (const lair of lairNodes) {
        expect(lair.properties.dangerZone).toBe('heartland');
      }
    }
  });
});

// ─── Test 6: Determinism ─────────────────────────────────────────────────────

describe('seedMonsterLairs — determinism', () => {
  it('produces identical results with the same seed', () => {
    const cols = 20;
    const rows = 20;
    const tiles = makeTiles(cols, rows);
    const provinceRoles = new Uint8Array(cols * rows);
    provinceRoles.fill(3); // wilderness

    const graph1 = new WorldGraph();
    seedMonsterLairs(graph1, provinceRoles, tiles, 42, cols);

    const graph2 = new WorldGraph();
    seedMonsterLairs(graph2, provinceRoles, tiles, 42, cols);

    const lairs1 = graph1.getNodesByType('location')
      .filter(n => n.properties.locationSubtype === 'lair')
      .map(n => `${n.properties.hexCol},${n.properties.hexRow}`)
      .sort();

    const lairs2 = graph2.getNodesByType('location')
      .filter(n => n.properties.locationSubtype === 'lair')
      .map(n => `${n.properties.hexCol},${n.properties.hexRow}`)
      .sort();

    expect(lairs1).toEqual(lairs2);
  });

  it('produces different results with different seeds', () => {
    const cols = 20;
    const rows = 20;
    const tiles = makeTiles(cols, rows);
    const provinceRoles = new Uint8Array(cols * rows);
    provinceRoles.fill(3); // wilderness

    const graph1 = new WorldGraph();
    seedMonsterLairs(graph1, provinceRoles, tiles, 42, cols);

    const graph2 = new WorldGraph();
    seedMonsterLairs(graph2, provinceRoles, tiles, 99, cols);

    const lairs1 = graph1.getNodesByType('location')
      .filter(n => n.properties.locationSubtype === 'lair')
      .map(n => `${n.properties.hexCol},${n.properties.hexRow}`)
      .sort()
      .join('|');

    const lairs2 = graph2.getNodesByType('location')
      .filter(n => n.properties.locationSubtype === 'lair')
      .map(n => `${n.properties.hexCol},${n.properties.hexRow}`)
      .sort()
      .join('|');

    // Different seeds should produce different placements
    expect(lairs1).not.toEqual(lairs2);
  });
});

// ─── Test 7: Water tiles excluded ────────────────────────────────────────────

describe('seedMonsterLairs — water exclusion', () => {
  it('places no lairs on ocean/water tiles', () => {
    const cols = 10;
    const rows = 10;
    const graph = new WorldGraph();

    // All water tiles
    const tiles: HexTile[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        tiles.push({
          coord: { col, row },
          geoParams: { elevation: 0.1, temperature: 0.5, moisture: 0.9 },
          terrain: 'ocean',
        });
      }
    }

    const provinceRoles = new Uint8Array(cols * rows);
    provinceRoles.fill(3); // wilderness

    seedMonsterLairs(graph, provinceRoles, tiles, 42, cols);

    expect(countLairNodes(graph)).toBe(0);
  });
});

// ─── Test 8: LAIR_SEEDING_CONSTANTS exports ───────────────────────────────────

describe('LAIR_SEEDING_CONSTANTS', () => {
  it('exports all required density constants', () => {
    expect(LAIR_SEEDING_CONSTANTS.WILDERNESS_LAIR_DENSITY).toBeGreaterThan(0);
    expect(LAIR_SEEDING_CONSTANTS.BORDERLAND_LAIR_DENSITY).toBeGreaterThan(0);
    expect(LAIR_SEEDING_CONSTANTS.HEARTLAND_LAIR_DENSITY).toBeGreaterThanOrEqual(0);
    expect(LAIR_SEEDING_CONSTANTS.CAPITAL_LAIR_DENSITY).toBe(0);
    expect(LAIR_SEEDING_CONSTANTS.MIN_LAIR_SEPARATION).toBeGreaterThanOrEqual(1);
  });

  it('wilderness density > borderland density > heartland density', () => {
    expect(LAIR_SEEDING_CONSTANTS.WILDERNESS_LAIR_DENSITY)
      .toBeGreaterThan(LAIR_SEEDING_CONSTANTS.BORDERLAND_LAIR_DENSITY);
    expect(LAIR_SEEDING_CONSTANTS.BORDERLAND_LAIR_DENSITY)
      .toBeGreaterThan(LAIR_SEEDING_CONSTANTS.HEARTLAND_LAIR_DENSITY);
  });
});
