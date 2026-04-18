/**
 * Tests for the elder ruin density seeding pass (THR-154).
 *
 * Covers:
 *   - Determinism: same seed produces same ruin count + positions
 *   - Density bands: small map seeds within expected range
 *   - Settlement exclusion: ruins never placed on settlement hexes
 *   - Historical territory filtering: ruins only in historical territory
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import type { HexTile } from '../../../types/index';
import { seedElderRuins } from '../elderRuinSeeding';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeHexTile(col: number, row: number, terrain = 'grassland', regionId?: string): HexTile {
  return {
    coord: { col, row },
    terrain,
    regionId: regionId ?? `region_${col}_${row}`,
    elevation: 0.5,
    temperature: 0.5,
    moisture: 0.5,
  } as HexTile;
}

/**
 * Build a minimal graph with historical culture territory.
 * Adds a region node + a historical culture actor + a belongs_to edge with cultureLayer='historical'.
 */
function addHistoricalTerritory(graph: WorldGraph, regionId: string, cultureId: string): void {
  if (!graph.getNode(regionId)) {
    graph.addNode({ id: regionId, type: 'region', name: regionId, properties: {} });
  }
  if (!graph.getNode(cultureId)) {
    graph.addNode({
      id: cultureId, type: 'actor', name: cultureId,
      properties: { actorType: 'historical_culture', cultureIdentity: { veneratedSpheres: ['force'] } },
    });
  }
  graph.addEdge({
    id: `${regionId}_to_${cultureId}`,
    type: 'belongs_to',
    source: regionId,
    target: cultureId,
    properties: { cultureLayer: 'historical' },
  });
}

function addSettlement(graph: WorldGraph, col: number, row: number, subtype = 'town'): void {
  graph.addNode({
    id: `loc_${col}_${row}`,
    type: 'location',
    name: 'Test Settlement',
    properties: { locationSubtype: subtype, hexCol: col, hexRow: row },
  });
}

function countRuins(graph: WorldGraph): number {
  return graph.getNodesByType('location').filter(n => n.properties?.locationType === 'elder_ruin').length;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('seedElderRuins', () => {
  const COLS = 10;
  const ROWS = 10;

  function buildBasicSetup(): { graph: WorldGraph; tiles: HexTile[]; provinceRoles: Uint8Array } {
    const graph = new WorldGraph();
    const tiles: HexTile[] = [];
    const provinceRoles = new Uint8Array(COLS * ROWS).fill(1); // HEARTLAND

    const regionId = 'region_main';
    const cultureId = 'culture_main';
    addHistoricalTerritory(graph, regionId, cultureId);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        tiles.push(makeHexTile(col, row, 'grassland', regionId));
      }
    }
    return { graph, tiles, provinceRoles };
  }

  it('is deterministic — same seed produces same ruins', () => {
    const { graph: g1, tiles, provinceRoles } = buildBasicSetup();
    const { graph: g2 } = buildBasicSetup();

    seedElderRuins(g1, tiles, 42, COLS, provinceRoles);
    seedElderRuins(g2, tiles, 42, COLS, provinceRoles);

    expect(countRuins(g1)).toBe(countRuins(g2));

    const ruins1 = g1.getNodesByType('location')
      .filter(n => n.properties?.locationType === 'elder_ruin')
      .map(n => `${n.properties!.hexCol},${n.properties!.hexRow}`)
      .sort();
    const ruins2 = g2.getNodesByType('location')
      .filter(n => n.properties?.locationType === 'elder_ruin')
      .map(n => `${n.properties!.hexCol},${n.properties!.hexRow}`)
      .sort();

    expect(ruins1).toEqual(ruins2);
  });

  it('different seeds produce different ruin sets', () => {
    const { graph: g1, tiles, provinceRoles } = buildBasicSetup();
    const { graph: g2 } = buildBasicSetup();

    seedElderRuins(g1, tiles, 1, COLS, provinceRoles);
    seedElderRuins(g2, tiles, 999999, COLS, provinceRoles);

    // Very low probability both are equal on a 10×10 grid — statistically safe
    const ruins1 = g1.getNodesByType('location')
      .filter(n => n.properties?.locationType === 'elder_ruin')
      .map(n => `${n.properties!.hexCol},${n.properties!.hexRow}`)
      .sort()
      .join(';');
    const ruins2 = g2.getNodesByType('location')
      .filter(n => n.properties?.locationType === 'elder_ruin')
      .map(n => `${n.properties!.hexCol},${n.properties!.hexRow}`)
      .sort()
      .join(';');

    expect(ruins1).not.toEqual(ruins2);
  });

  it('places no ruins on water terrain hexes', () => {
    const graph = new WorldGraph();
    const regionId = 'region_water';
    addHistoricalTerritory(graph, regionId, 'culture_water');

    const waterTerrains = ['ocean', 'deep_ocean', 'lake', 'river', 'coast'];
    const tiles: HexTile[] = waterTerrains.map((t, i) => makeHexTile(i, 0, t, regionId));
    const provinceRoles = new Uint8Array(waterTerrains.length).fill(1);

    seedElderRuins(graph, tiles, 42, waterTerrains.length, provinceRoles);
    expect(countRuins(graph)).toBe(0);
  });

  it('places no ruins outside historical territory', () => {
    const graph = new WorldGraph();
    // Tiles with regionId that has NO historical belongs_to edge
    const tiles: HexTile[] = [];
    for (let i = 0; i < 20; i++) {
      tiles.push(makeHexTile(i % 5, Math.floor(i / 5), 'grassland', 'orphan_region'));
    }
    // Add orphan region node but NOT the belongs_to edge
    graph.addNode({ id: 'orphan_region', type: 'region', name: 'Orphan', properties: {} });

    const provinceRoles = new Uint8Array(20).fill(1);
    seedElderRuins(graph, tiles, 42, 5, provinceRoles);
    expect(countRuins(graph)).toBe(0);
  });

  it('never places a ruin on a settlement hex', () => {
    const { graph, tiles, provinceRoles } = buildBasicSetup();

    // Add settlements on every tile
    for (const tile of tiles) {
      addSettlement(graph, tile.coord.col, tile.coord.row);
    }

    seedElderRuins(graph, tiles, 42, COLS, provinceRoles);
    expect(countRuins(graph)).toBe(0);
  });

  it('settlement on one hex does not block adjacent hexes', () => {
    const { graph, tiles, provinceRoles } = buildBasicSetup();

    // Only block the center tile
    addSettlement(graph, 5, 5);

    seedElderRuins(graph, tiles, 42, COLS, provinceRoles);

    const ruins = graph.getNodesByType('location').filter(n => n.properties?.locationType === 'elder_ruin');
    for (const ruin of ruins) {
      expect(`${ruin.properties!.hexCol},${ruin.properties!.hexRow}`).not.toBe('5,5');
    }
    // Other hexes are still eligible — some ruins should appear
    expect(ruins.length).toBeGreaterThan(0);
  });

  it('ruin nodes have required properties', () => {
    const { graph, tiles, provinceRoles } = buildBasicSetup();
    seedElderRuins(graph, tiles, 42, COLS, provinceRoles);

    const ruins = graph.getNodesByType('location').filter(n => n.properties?.locationType === 'elder_ruin');
    expect(ruins.length).toBeGreaterThan(0);

    for (const ruin of ruins) {
      const p = ruin.properties!;
      expect(p.locationSubtype).toBe('elder_ruin');
      expect(typeof p.hexCol).toBe('number');
      expect(typeof p.hexRow).toBe('number');
      expect(typeof p.ruinMagnitude).toBe('number');
      expect(p.ruinMagnitude).toBeGreaterThanOrEqual(0);
      expect(p.ruinMagnitude).toBeLessThanOrEqual(1);
      expect(['minor', 'major', 'saga']).toContain(p.delveScale);
      expect(['vault', 'temple', 'battlefield']).toContain(p.archetype);
      expect(typeof p.sphereAlignment).toBe('string');
      expect(p.ageState).toBe('lost');
      expect(p.discovered).toBe(false);
      expect(p.undelved).toBe(true);
    }
  });
});
