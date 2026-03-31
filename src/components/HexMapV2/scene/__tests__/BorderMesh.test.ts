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
  hexProvinceId: Map<string, number>,
  hexDomainId: Map<string, number>,
  provinces: RegionData['provinces'] = [],
  domains: RegionData['domains'] = [],
): RegionData {
  return {
    geographicRegions: [],
    provinces,
    domains,
    labels: [],
    hexRegionId: new Map(),
    hexProvinceId,
    hexDomainId,
  };
}

// ─── createBorderMesh Tests ───────────────────────────────────────────────────

describe('createBorderMesh', () => {
  it('returns an object with domainMesh and provinceMesh as THREE.Mesh instances', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0)];

    const hexProvinceId = new Map<string, number>([
      ['0,0', 0],
      ['1,0', 1],
    ]);
    const hexDomainId = new Map<string, number>([
      ['0,0', 0],
      ['1,0', 0],
    ]);

    const regionData = makeRegionData(hexProvinceId, hexDomainId);
    const result = createBorderMesh(regionData, tiles, 4);

    expect(result.domainMesh).toBeInstanceOf(THREE.Mesh);
    expect(result.provinceMesh).toBeInstanceOf(THREE.Mesh);
  });

  it('produces >0 vertices when two adjacent hexes belong to different provinces', () => {
    const cols = 3;
    const tiles: HexTile[] = [];
    const hexProvinceId = new Map<string, number>();
    const hexDomainId = new Map<string, number>();

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push(makeTile(c, r));
        const provinceId = c < 2 ? 0 : 1;
        hexProvinceId.set(`${c},${r}`, provinceId);
        hexDomainId.set(`${c},${r}`, 0); // same domain
      }
    }

    const regionData = makeRegionData(hexProvinceId, hexDomainId);
    const result = createBorderMesh(regionData, tiles, cols);

    const pos = result.provinceMesh.geometry.getAttribute('position');
    expect(pos).toBeDefined();
    expect(pos.count).toBeGreaterThan(0);
  });

  it('produces >0 vertices when two adjacent hexes belong to different domains', () => {
    const cols = 2;
    const tiles = [makeTile(0, 0), makeTile(1, 0)];
    const hexProvinceId = new Map<string, number>([['0,0', 0], ['1,0', 1]]);
    const hexDomainId = new Map<string, number>([['0,0', 0], ['1,0', 1]]);

    const regionData = makeRegionData(hexProvinceId, hexDomainId);
    const result = createBorderMesh(regionData, tiles, cols);

    const pos = result.domainMesh.geometry.getAttribute('position');
    expect(pos).toBeDefined();
    expect(pos.count).toBeGreaterThan(0);
  });

  it('REGN-06: geographic-only differences produce zero INTERNAL border geometry (no province/domain difference)', () => {
    const cols = 3;
    const tiles: HexTile[] = [];
    const hexProvinceId = new Map<string, number>();
    const hexDomainId = new Map<string, number>();

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push(makeTile(c, r));
        hexProvinceId.set(`${c},${r}`, 0); // all same province
        hexDomainId.set(`${c},${r}`, 0);   // all same domain
      }
    }

    const regionData = makeRegionData(hexProvinceId, hexDomainId);
    const result = createBorderMesh(regionData, tiles, cols);

    // No province borders (province borders are for different provinces within same domain)
    const provincePos = result.provinceMesh.geometry.getAttribute('position');
    const provinceVertices = provincePos ? provincePos.count : 0;
    expect(provinceVertices).toBe(0);

    // Domain border geometry will exist — the outer ring where the domain meets map edge.
    const domainPos = result.domainMesh.geometry.getAttribute('position');
    const domainVertices = domainPos ? domainPos.count : 0;
    expect(domainVertices).toBeGreaterThan(0);
  });

  it('domain border geometry is separate from province border geometry', () => {
    const cols = 3;
    const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0)];
    const hexProvinceId = new Map<string, number>([['0,0', 0], ['1,0', 1], ['2,0', 2]]);
    const hexDomainId = new Map<string, number>([['0,0', 0], ['1,0', 1], ['2,0', 1]]);

    const regionData = makeRegionData(hexProvinceId, hexDomainId);
    const result = createBorderMesh(regionData, tiles, cols);

    expect(result.domainMesh).not.toBe(result.provinceMesh);
    expect(result.domainMesh.geometry).not.toBe(result.provinceMesh.geometry);
  });

  it('uses MeshBasicMaterial on both meshes', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0)];
    const hexProvinceId = new Map<string, number>([['0,0', 0], ['1,0', 1]]);
    const hexDomainId = new Map<string, number>([['0,0', 0], ['1,0', 0]]);

    const regionData = makeRegionData(hexProvinceId, hexDomainId);
    const result = createBorderMesh(regionData, tiles, 2);

    expect(result.provinceMesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(result.domainMesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);
  });

  it('hexes with no province assignment are skipped (fail-soft)', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0)];
    const hexProvinceId = new Map<string, number>([['0,0', 0]]); // only first hex assigned
    const hexDomainId = new Map<string, number>([['0,0', 0]]);

    const regionData = makeRegionData(hexProvinceId, hexDomainId);
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

  it('returns empty group when no provinces exist', () => {
    const regionData = makeRegionData(new Map(), new Map(), [], []);
    const result = createCapitalMarkers(regionData);
    expect(result.children.length).toBe(0);
  });

  it('produces Points with position count matching number of capital hexes', () => {
    const provinces: RegionData['provinces'] = [
      {
        id: 0, cultureId: 'human', capitalHex: { col: 0, row: 0 },
        geographicRegionIds: [], hexes: [{ col: 0, row: 0 }],
        centroid: { col: 0, row: 0 }, name: 'Province A',
      },
      {
        id: 1, cultureId: 'elven', capitalHex: { col: 2, row: 0 },
        geographicRegionIds: [], hexes: [{ col: 2, row: 0 }],
        centroid: { col: 2, row: 0 }, name: 'Province B',
      },
    ];

    const domains: RegionData['domains'] = [
      {
        id: 0, cultureId: 'human', capitalHex: { col: 0, row: 0 },
        provinceIds: [0], centroid: { col: 0, row: 0 }, name: 'Domain A',
      },
    ];

    const regionData = makeRegionData(new Map(), new Map(), provinces, domains);
    const result = createCapitalMarkers(regionData);

    const pointChildren = result.children.filter(c => c instanceof THREE.Points);
    expect(pointChildren.length).toBeGreaterThan(0);

    let totalPoints = 0;
    for (const child of pointChildren) {
      const pos = (child as THREE.Points).geometry.getAttribute('position');
      if (pos) totalPoints += pos.count;
    }
    expect(totalPoints).toBe(provinces.length);
  });

  it('uses PointsMaterial with sizeAttenuation: false', () => {
    const provinces: RegionData['provinces'] = [
      {
        id: 0, cultureId: 'human', capitalHex: { col: 0, row: 0 },
        geographicRegionIds: [], hexes: [{ col: 0, row: 0 }],
        centroid: { col: 0, row: 0 }, name: 'Province A',
      },
    ];

    const regionData = makeRegionData(new Map(), new Map(), provinces, []);
    const result = createCapitalMarkers(regionData);

    const pointsChild = result.children.find(c => c instanceof THREE.Points) as THREE.Points | undefined;
    expect(pointsChild).toBeDefined();
    const mat = pointsChild!.material as THREE.PointsMaterial;
    expect(mat).toBeInstanceOf(THREE.PointsMaterial);
    expect(mat.sizeAttenuation).toBe(false);
  });
});
