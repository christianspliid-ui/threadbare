import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import type { HexTile, TerrainType } from '../../../../types';
import type { RegionData } from '../../../../engine/regionTypes';
import { createBorderMesh } from '../BorderMesh';
import { createCapitalMarkers } from '../CapitalMarkers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTile(col: number, row: number, terrain: TerrainType = 'grassland'): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain,
  };
}

/** Build a minimal RegionData for testing */
function makeRegionData(
  hexBaronyId: Map<string, number>,
  hexKingdomId: Map<string, number>,
  baronies: RegionData['baronies'] = [],
  kingdoms: RegionData['kingdoms'] = [],
): RegionData {
  return {
    geographicRegions: [],
    baronies,
    kingdoms,
    labels: [],
    hexRegionId: new Map(),
    hexBaronyId,
    hexKingdomId,
  };
}

// ─── createBorderMesh Tests ───────────────────────────────────────────────────

describe('createBorderMesh', () => {
  it('returns an object with kingdomMesh and baronyMesh as THREE.Mesh instances', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0)];

    const hexBaronyId = new Map<string, number>([
      ['0,0', 0],
      ['1,0', 1],
    ]);
    const hexKingdomId = new Map<string, number>([
      ['0,0', 0],
      ['1,0', 0],
    ]);

    const regionData = makeRegionData(hexBaronyId, hexKingdomId);
    const result = createBorderMesh(regionData, tiles, 4);

    expect(result.kingdomMesh).toBeInstanceOf(THREE.Mesh);
    expect(result.baronyMesh).toBeInstanceOf(THREE.Mesh);
  });

  it('produces >0 vertices when two adjacent hexes belong to different baronies', () => {
    // 3x3 grid: left half barony 0, right half barony 1
    const cols = 3;
    const tiles: HexTile[] = [];
    const hexBaronyId = new Map<string, number>();
    const hexKingdomId = new Map<string, number>();

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push(makeTile(c, r));
        const baronyId = c < 2 ? 0 : 1;
        hexBaronyId.set(`${c},${r}`, baronyId);
        // same kingdom for all (barony border only, no kingdom border)
        hexKingdomId.set(`${c},${r}`, 0);
      }
    }

    const regionData = makeRegionData(hexBaronyId, hexKingdomId);
    const result = createBorderMesh(regionData, tiles, cols);

    const pos = result.baronyMesh.geometry.getAttribute('position');
    expect(pos).toBeDefined();
    expect(pos.count).toBeGreaterThan(0);
  });

  it('produces >0 vertices when two adjacent hexes belong to different kingdoms', () => {
    // 2 hexes, different kingdoms
    const cols = 2;
    const tiles = [makeTile(0, 0), makeTile(1, 0)];
    const hexBaronyId = new Map<string, number>([['0,0', 0], ['1,0', 1]]);
    const hexKingdomId = new Map<string, number>([['0,0', 0], ['1,0', 1]]);

    const regionData = makeRegionData(hexBaronyId, hexKingdomId);
    const result = createBorderMesh(regionData, tiles, cols);

    const pos = result.kingdomMesh.geometry.getAttribute('position');
    expect(pos).toBeDefined();
    expect(pos.count).toBeGreaterThan(0);
  });

  it('REGN-06: geographic-only differences produce zero border geometry (no barony/kingdom difference)', () => {
    // All hexes in same barony AND same kingdom — different geographic region doesn't matter
    const cols = 3;
    const tiles: HexTile[] = [];
    const hexBaronyId = new Map<string, number>();
    const hexKingdomId = new Map<string, number>();

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push(makeTile(c, r));
        hexBaronyId.set(`${c},${r}`, 0); // all same barony
        hexKingdomId.set(`${c},${r}`, 0); // all same kingdom
      }
    }

    const regionData = makeRegionData(hexBaronyId, hexKingdomId);
    const result = createBorderMesh(regionData, tiles, cols);

    // No borders between same-barony/same-kingdom hexes
    const baronyPos = result.baronyMesh.geometry.getAttribute('position');
    const kingdomPos = result.kingdomMesh.geometry.getAttribute('position');

    // Either no position attribute or 0 vertices
    const baronyVertices = baronyPos ? baronyPos.count : 0;
    const kingdomVertices = kingdomPos ? kingdomPos.count : 0;
    expect(baronyVertices).toBe(0);
    expect(kingdomVertices).toBe(0);
  });

  it('kingdom border geometry is separate from barony border geometry', () => {
    // Setup: hex 0,0 and 1,0 in different kingdoms; hex 2,0 in same kingdom as 1,0 but different barony
    const cols = 3;
    const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0)];
    const hexBaronyId = new Map<string, number>([['0,0', 0], ['1,0', 1], ['2,0', 2]]);
    const hexKingdomId = new Map<string, number>([['0,0', 0], ['1,0', 1], ['2,0', 1]]);

    const regionData = makeRegionData(hexBaronyId, hexKingdomId);
    const result = createBorderMesh(regionData, tiles, cols);

    // Both meshes are distinct objects
    expect(result.kingdomMesh).not.toBe(result.baronyMesh);
    expect(result.kingdomMesh.geometry).not.toBe(result.baronyMesh.geometry);
  });

  it('uses MeshBasicMaterial with color 0xC83030 on both meshes', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0)];
    const hexBaronyId = new Map<string, number>([['0,0', 0], ['1,0', 1]]);
    const hexKingdomId = new Map<string, number>([['0,0', 0], ['1,0', 0]]);

    const regionData = makeRegionData(hexBaronyId, hexKingdomId);
    const result = createBorderMesh(regionData, tiles, 2);

    expect(result.baronyMesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(result.kingdomMesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);

    const baronyColor = (result.baronyMesh.material as THREE.MeshBasicMaterial).color.getHex();
    const kingdomColor = (result.kingdomMesh.material as THREE.MeshBasicMaterial).color.getHex();
    expect(baronyColor).toBe(0xc83030);
    expect(kingdomColor).toBe(0xc83030);
  });

  it('hexes with no barony assignment are skipped (fail-soft)', () => {
    // Some hexes have no barony — should not throw
    const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0)];
    const hexBaronyId = new Map<string, number>([['0,0', 0]]); // only first hex assigned
    const hexKingdomId = new Map<string, number>([['0,0', 0]]);

    const regionData = makeRegionData(hexBaronyId, hexKingdomId);

    // Should not throw — fail-soft
    expect(() => createBorderMesh(regionData, tiles, 3)).not.toThrow();
  });
});

// ─── createCapitalMarkers Tests ───────────────────────────────────────────────

describe('createCapitalMarkers', () => {
  it('returns a THREE.Group', () => {
    const regionData = makeRegionData(new Map(), new Map(), [], []);
    const result = createCapitalMarkers(regionData);
    expect(result).toBeInstanceOf(THREE.Group);
  });

  it('returns empty group when no baronies exist', () => {
    const regionData = makeRegionData(new Map(), new Map(), [], []);
    const result = createCapitalMarkers(regionData);
    expect(result.children.length).toBe(0);
  });

  it('produces Points with position count matching number of capital hexes', () => {
    const baronies: RegionData['baronies'] = [
      {
        id: 0,
        cultureId: 'human',
        capitalHex: { col: 0, row: 0 },
        geographicRegionIds: [],
        hexes: [{ col: 0, row: 0 }],
        centroid: { col: 0, row: 0 },
        name: 'Barony A',
      },
      {
        id: 1,
        cultureId: 'elven',
        capitalHex: { col: 2, row: 0 },
        geographicRegionIds: [],
        hexes: [{ col: 2, row: 0 }],
        centroid: { col: 2, row: 0 },
        name: 'Barony B',
      },
    ];

    const kingdoms: RegionData['kingdoms'] = [
      {
        id: 0,
        cultureId: 'human',
        capitalHex: { col: 0, row: 0 },
        baronyIds: [0],
        centroid: { col: 0, row: 0 },
        name: 'Kingdom A',
      },
    ];

    const regionData = makeRegionData(new Map(), new Map(), baronies, kingdoms);
    const result = createCapitalMarkers(regionData);

    // Should produce at least one Points child
    const pointChildren = result.children.filter(c => c instanceof THREE.Points);
    expect(pointChildren.length).toBeGreaterThan(0);

    // Total points should equal number of baronies
    let totalPoints = 0;
    for (const child of pointChildren) {
      const pos = (child as THREE.Points).geometry.getAttribute('position');
      if (pos) totalPoints += pos.count;
    }
    expect(totalPoints).toBe(baronies.length);
  });

  it('uses PointsMaterial with sizeAttenuation: false', () => {
    const baronies: RegionData['baronies'] = [
      {
        id: 0,
        cultureId: 'human',
        capitalHex: { col: 0, row: 0 },
        geographicRegionIds: [],
        hexes: [{ col: 0, row: 0 }],
        centroid: { col: 0, row: 0 },
        name: 'Barony A',
      },
    ];

    const regionData = makeRegionData(new Map(), new Map(), baronies, []);
    const result = createCapitalMarkers(regionData);

    const pointsChild = result.children.find(c => c instanceof THREE.Points) as THREE.Points | undefined;
    expect(pointsChild).toBeDefined();
    const mat = pointsChild!.material as THREE.PointsMaterial;
    expect(mat).toBeInstanceOf(THREE.PointsMaterial);
    expect(mat.sizeAttenuation).toBe(false);
  });
});
