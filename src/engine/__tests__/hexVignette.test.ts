/**
 * Hex Vignette Engine Tests
 *
 * Tests for:
 * - Helper functions (temperature, moisture, population, direction bands)
 * - buildHexVignette pipeline (determinism, visibility, tier caps)
 */

import { describe, it, expect } from 'vitest';
import type { WorldGraph } from '../graph';
import { WorldGraph } from '../graph';
import type { HexTile, SphereName } from '../../types';
import {
  getTemperatureBand,
  getMoistureBand,
  getPopulationBand,
  getCompassDirection,
  buildHexVignette,
} from '../hexVignette';

// ─── Helper Function Tests ──────────────────────────────────────────

describe('getTemperatureBand', () => {
  it('returns frigid for temperature < 0.2', () => {
    expect(getTemperatureBand(0.0)).toBe('frigid');
    expect(getTemperatureBand(0.15)).toBe('frigid');
  });

  it('returns cold for temperature [0.2, 0.4)', () => {
    expect(getTemperatureBand(0.2)).toBe('cold');
    expect(getTemperatureBand(0.3)).toBe('cold');
    expect(getTemperatureBand(0.39)).toBe('cold');
  });

  it('returns temperate for temperature [0.4, 0.6)', () => {
    expect(getTemperatureBand(0.4)).toBe('temperate');
    expect(getTemperatureBand(0.5)).toBe('temperate');
  });

  it('returns warm for temperature [0.6, 0.8)', () => {
    expect(getTemperatureBand(0.6)).toBe('warm');
    expect(getTemperatureBand(0.7)).toBe('warm');
  });

  it('returns scorching for temperature >= 0.8', () => {
    expect(getTemperatureBand(0.8)).toBe('scorching');
    expect(getTemperatureBand(1.0)).toBe('scorching');
  });
});

describe('getMoistureBand', () => {
  it('returns arid for moisture < 0.2', () => {
    expect(getMoistureBand(0.0)).toBe('arid');
    expect(getMoistureBand(0.19)).toBe('arid');
  });

  it('returns dry for moisture [0.2, 0.4)', () => {
    expect(getMoistureBand(0.2)).toBe('dry');
    expect(getMoistureBand(0.3)).toBe('dry');
  });

  it('returns moderate for moisture [0.4, 0.6)', () => {
    expect(getMoistureBand(0.4)).toBe('moderate');
    expect(getMoistureBand(0.5)).toBe('moderate');
  });

  it('returns damp for moisture [0.6, 0.8)', () => {
    expect(getMoistureBand(0.6)).toBe('damp');
    expect(getMoistureBand(0.7)).toBe('damp');
  });

  it('returns saturated for moisture >= 0.8', () => {
    expect(getMoistureBand(0.8)).toBe('saturated');
    expect(getMoistureBand(1.0)).toBe('saturated');
  });
});

describe('getPopulationBand', () => {
  it('returns empty for 0 population', () => {
    expect(getPopulationBand(0)).toBe('empty');
  });

  it('returns sparse for 1-2 population', () => {
    expect(getPopulationBand(1)).toBe('sparse');
    expect(getPopulationBand(2)).toBe('sparse');
  });

  it('returns moderate for 3-5 population', () => {
    expect(getPopulationBand(3)).toBe('moderate');
    expect(getPopulationBand(4)).toBe('moderate');
    expect(getPopulationBand(5)).toBe('moderate');
  });

  it('returns bustling for 6+ population', () => {
    expect(getPopulationBand(6)).toBe('bustling');
    expect(getPopulationBand(10)).toBe('bustling');
  });
});

describe('getCompassDirection', () => {
  it('returns east for [337.5, 22.5)', () => {
    expect(getCompassDirection(0)).toBe('east');
    expect(getCompassDirection(22)).toBe('east');
    expect(getCompassDirection(338)).toBe('east');
  });

  it('returns northeast for [22.5, 67.5)', () => {
    expect(getCompassDirection(45)).toBe('northeast');
    expect(getCompassDirection(50)).toBe('northeast');
  });

  it('returns north for [67.5, 112.5)', () => {
    expect(getCompassDirection(90)).toBe('north');
    expect(getCompassDirection(100)).toBe('north');
  });

  it('normalizes negative angles', () => {
    expect(getCompassDirection(-90)).toBe('south'); // -90 + 360 = 270 = south
    expect(getCompassDirection(-45)).toBe('southeast'); // -45 + 360 = 315 = southeast
  });
});

// ─── buildHexVignette Tests ────────────────────────────────────────

/**
 * Test helper: create a minimal HexTile for testing
 */
function createTestTile(col: number, row: number): HexTile {
  return {
    coord: { col, row },
    geoParams: {
      elevation: 0.5,
      temperature: 0.5,
      moisture: 0.5,
    },
    terrain: 'grassland',
  };
}

/**
 * Test helper: create a minimal graph with a location at the given hex
 */
function createTestGraph(hexCol: number, hexRow: number): WorldGraph {
  const graph = new WorldGraph();

  // Create a location node
  graph.addNode({
    id: 'loc_1',
    type: 'location',
    name: 'Test Settlement',
    properties: {
      hexCol,
      hexRow,
      locationType: 'hamlet',
      sphereBiases: {
        force: 0.1,
        matter: 0.2,
        energy: 0.15,
        life: 0.25,
        mind: 0.1,
        spirit: 0.1,
        time: 0.05,
        entropy: 0.0,
      },
    },
  });

  return graph;
}

describe('buildHexVignette', () => {
  it('returns all tiers for visible hexes', () => {
    const graph = createTestGraph(5, 5);
    const tiles = [createTestTile(5, 5)];
    const hexCoord = { col: 5, row: 5 };

    const vignette = buildHexVignette(
      graph,
      tiles,
      hexCoord,
      'visible',
      null,
      new Map(),
      42,
    );

    expect(vignette.tier1).toBeTruthy();
    expect(typeof vignette.tier1).toBe('string');
    expect(vignette.tier1.length > 0).toBe(true);
    expect(vignette.tier2).toBeInstanceOf(Array);
    expect(vignette.tier3).toBeInstanceOf(Array);
    expect(vignette.clickTarget).toEqual(hexCoord);
  });

  it('is deterministic: same inputs produce same output', () => {
    const graph1 = createTestGraph(5, 5);
    const graph2 = createTestGraph(5, 5);
    const tiles = [createTestTile(5, 5)];
    const hexCoord = { col: 5, row: 5 };
    const famMap = new Map();
    const seed = 12345;

    const v1 = buildHexVignette(graph1, tiles, hexCoord, 'visible', null, famMap, seed);
    const v2 = buildHexVignette(graph2, tiles, hexCoord, 'visible', null, famMap, seed);

    expect(v1.tier1).toBe(v2.tier1);
    expect(v1.tier2).toEqual(v2.tier2);
    expect(v1.tier3).toEqual(v2.tier3);
  });

  it('differs for different seeds', () => {
    const graph1 = createTestGraph(5, 5);
    const graph2 = createTestGraph(5, 5);
    const tiles = [createTestTile(5, 5)];
    const hexCoord = { col: 5, row: 5 };
    const famMap = new Map();

    const v1 = buildHexVignette(graph1, tiles, hexCoord, 'visible', null, famMap, 42);
    const v2 = buildHexVignette(graph2, tiles, hexCoord, 'visible', null, famMap, 99);

    // Very unlikely tier1 is identical with different seeds
    expect(v1.tier1).not.toBe(v2.tier1);
  });

  it('applies remembered visibility transforms', () => {
    const graph = createTestGraph(5, 5);
    const tiles = [createTestTile(5, 5)];
    const hexCoord = { col: 5, row: 5 };

    const vignette = buildHexVignette(
      graph,
      tiles,
      hexCoord,
      'remembered',
      null,
      new Map(),
      42,
    );

    // Remembered visibility should wrap tier1 with "You recall: ..."
    expect(vignette.tier1).toMatch(/^You recall:/);
  });

  it('returns empty vignette for unexplored hexes', () => {
    const graph = createTestGraph(5, 5);
    const tiles = [createTestTile(5, 5)];
    const hexCoord = { col: 5, row: 5 };

    const vignette = buildHexVignette(
      graph,
      tiles,
      hexCoord,
      'unexplored',
      null,
      new Map(),
      42,
    );

    expect(vignette.tier1).toBe('');
    expect(vignette.tier2).toEqual([]);
    expect(vignette.tier3).toEqual([]);
  });

  it('caps tier2 at MAX_TIER2_SENTENCES', () => {
    const graph = new WorldGraph();

    // Add many locations to exceed cap
    for (let i = 0; i < 10; i++) {
      graph.addNode({
        id: `loc_${i}`,
        type: 'location',
        name: `Location ${i}`,
        properties: {
          hexCol: 5,
          hexRow: 5,
          locationType: 'hamlet',
          sphereBiases: { force: 0.1 },
        },
      });
    }

    const tiles = [createTestTile(5, 5)];
    const hexCoord = { col: 5, row: 5 };

    const vignette = buildHexVignette(
      graph,
      tiles,
      hexCoord,
      'visible',
      null,
      new Map(),
      42,
    );

    // tier2[0] is population phrase, tier2[1..N] are spotlights
    // MAX_TIER2_SENTENCES should apply
    expect(vignette.tier2.length).toBeLessThanOrEqual(3); // MAX_TIER2_SENTENCES = 3
  });

  it('caps tier3 at MAX_TIER3_SENTENCES', () => {
    const graph = createTestGraph(5, 5);

    // The pipeline can add culture + sphere + faction + encounter phrases
    // We just verify tier3 length is capped
    const tiles = [createTestTile(5, 5)];
    const hexCoord = { col: 5, row: 5 };

    const vignette = buildHexVignette(
      graph,
      tiles,
      hexCoord,
      'visible',
      null,
      new Map(),
      42,
    );

    expect(vignette.tier3.length).toBeLessThanOrEqual(4); // MAX_TIER3_SENTENCES = 4
  });
});
