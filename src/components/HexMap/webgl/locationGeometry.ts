/**
 * Procedural 3D geometries for location/settlement overlays on the hex map.
 * Each location subtype gets a distinct low-poly silhouette.
 */
import * as THREE from 'three';
import type { LocationSubtype } from '../../../types';

// ── Location colors (NFP #1: Tunability) ────────────────────────────────────

export const LOCATION_COLORS: Partial<Record<LocationSubtype, string>> = {
  // Settlements — warm brick/wood tones (diorama palette)
  hamlet: '#c0a878',
  town: '#c8b088',
  city: '#d0b890',
  capital: '#e0c898',
  camp: '#b09868',
  farmland: '#90a868',

  // Fortifications — light stone grey
  castle: '#a8a8a8',
  fort: '#989898',
  tower: '#b0b0b0',

  // Sacred — bright gold/cream
  shrine: '#e0c070',
  temple: '#e8d088',

  // Industry
  mining: '#987858',

  // Ruins — weathered stone
  ruins: '#908880',
  ruined_tower: '#888888',
  ruined_city: '#908880',
  ruined_village: '#908880',

  // Special
  battleground: '#905050',
  oasis: '#60a878',
  unexplored_poi: '#a09088',
};

// ── Geometry builders ───────────────────────────────────────────────────────

/** Small house: box + pyramid roof */
function createHouseGeometry(width: number, height: number, roofHeight: number): THREE.BufferGeometry {
  const body = new THREE.BoxGeometry(width, height, width);
  body.translate(0, height / 2, 0);

  const roof = new THREE.ConeGeometry(width * 0.75, roofHeight, 4);
  roof.rotateY(Math.PI / 4);
  roof.translate(0, height + roofHeight / 2, 0);

  return mergeGeos([body, roof]);
}

/** Tower: tall cylinder + cone roof */
function createTowerGeometry(radius: number, height: number): THREE.BufferGeometry {
  const body = new THREE.CylinderGeometry(radius, radius * 1.1, height, 6);
  body.translate(0, height / 2, 0);

  const roof = new THREE.ConeGeometry(radius * 1.3, height * 0.3, 6);
  roof.translate(0, height + height * 0.15, 0);

  return mergeGeos([body, roof]);
}

/** Castle: central tower + 2 smaller flanking towers + wall */
function createCastleGeometry(): THREE.BufferGeometry {
  const mainTower = createTowerGeometry(0.08, 0.5);

  const leftTower = new THREE.CylinderGeometry(0.05, 0.06, 0.35, 5);
  leftTower.translate(-0.15, 0.175, 0);

  const rightTower = new THREE.CylinderGeometry(0.05, 0.06, 0.35, 5);
  rightTower.translate(0.15, 0.175, 0);

  const wall = new THREE.BoxGeometry(0.3, 0.2, 0.04);
  wall.translate(0, 0.1, 0.05);

  return mergeGeos([mainTower, leftTower, rightTower, wall]);
}

/** Shrine: small obelisk / standing stone */
function createShrineGeometry(): THREE.BufferGeometry {
  const stone = new THREE.CylinderGeometry(0.03, 0.05, 0.3, 5);
  stone.translate(0, 0.15, 0);

  const base = new THREE.CylinderGeometry(0.08, 0.09, 0.04, 6);
  base.translate(0, 0.02, 0);

  return mergeGeos([stone, base]);
}

/** Temple: wider building with columned front */
function createTempleGeometry(): THREE.BufferGeometry {
  const body = new THREE.BoxGeometry(0.25, 0.25, 0.2);
  body.translate(0, 0.125, 0);

  const roof = new THREE.ConeGeometry(0.2, 0.12, 4);
  roof.rotateY(Math.PI / 4);
  roof.translate(0, 0.31, 0);

  // Front columns
  const col1 = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 4);
  col1.translate(-0.08, 0.1, 0.12);
  const col2 = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 4);
  col2.translate(0.08, 0.1, 0.12);

  return mergeGeos([body, roof, col1, col2]);
}

/** Ruins: broken walls */
function createRuinsGeometry(): THREE.BufferGeometry {
  const wall1 = new THREE.BoxGeometry(0.15, 0.2, 0.03);
  wall1.translate(-0.05, 0.1, 0);

  const wall2 = new THREE.BoxGeometry(0.08, 0.12, 0.03);
  wall2.translate(0.08, 0.06, 0.06);

  const rubble = new THREE.IcosahedronGeometry(0.06, 0);
  rubble.translate(0.02, 0.03, -0.04);

  return mergeGeos([wall1, wall2, rubble]);
}

/** Mining: entrance arch + cart track */
function createMiningGeometry(): THREE.BufferGeometry {
  const arch = new THREE.TorusGeometry(0.08, 0.02, 4, 6, Math.PI);
  arch.rotateX(Math.PI / 2);
  arch.translate(0, 0.08, 0);

  const post1 = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 4);
  post1.translate(-0.08, 0.08, 0);
  const post2 = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 4);
  post2.translate(0.08, 0.08, 0);

  return mergeGeos([arch, post1, post2]);
}

/** Camp: tent shape (pyramid) */
function createCampGeometry(): THREE.BufferGeometry {
  const tent = new THREE.ConeGeometry(0.12, 0.18, 4);
  tent.rotateY(Math.PI / 4);
  tent.translate(0, 0.09, 0);
  return tent;
}

/** Battleground: crossed swords (simplified as an X of thin boxes) */
function createBattlegroundGeometry(): THREE.BufferGeometry {
  const sword1 = new THREE.BoxGeometry(0.02, 0.3, 0.01);
  sword1.rotateZ(Math.PI / 6);
  sword1.translate(-0.02, 0.12, 0);

  const sword2 = new THREE.BoxGeometry(0.02, 0.3, 0.01);
  sword2.rotateZ(-Math.PI / 6);
  sword2.translate(0.02, 0.12, 0);

  return mergeGeos([sword1, sword2]);
}

/** POI marker: diamond/gem shape */
function createPoiGeometry(): THREE.BufferGeometry {
  const top = new THREE.ConeGeometry(0.06, 0.12, 4);
  top.translate(0, 0.15, 0);

  const bottom = new THREE.ConeGeometry(0.06, 0.06, 4);
  bottom.rotateX(Math.PI);
  bottom.translate(0, 0.06, 0);

  return mergeGeos([top, bottom]);
}

// ── Geometry lookup ─────────────────────────────────────────────────────────

/** Get the 3D geometry for a location subtype. Returns null for wilderness/unknown. */
export function getLocationGeometry(subtype: LocationSubtype): THREE.BufferGeometry | null {
  switch (subtype) {
    case 'hamlet':
      return createHouseGeometry(0.1, 0.1, 0.08);
    case 'town':
      return createHouseGeometry(0.14, 0.15, 0.1);
    case 'city': {
      // Cluster of buildings
      const h1 = createHouseGeometry(0.12, 0.18, 0.1);
      const h2 = createHouseGeometry(0.09, 0.12, 0.08);
      h2.translate(0.14, 0, 0.05);
      const h3 = createHouseGeometry(0.08, 0.1, 0.07);
      h3.translate(-0.1, 0, 0.1);
      return mergeGeos([h1, h2, h3]);
    }
    case 'capital': {
      const castle = createCastleGeometry();
      const h1 = createHouseGeometry(0.1, 0.12, 0.08);
      h1.translate(0.2, 0, 0.1);
      const h2 = createHouseGeometry(0.08, 0.1, 0.06);
      h2.translate(-0.18, 0, 0.08);
      return mergeGeos([castle, h1, h2]);
    }
    case 'castle':
      return createCastleGeometry();
    case 'fort': {
      const tower = createTowerGeometry(0.06, 0.3);
      const wall1 = new THREE.BoxGeometry(0.2, 0.15, 0.03);
      wall1.translate(0.1, 0.075, 0);
      return mergeGeos([tower, wall1]);
    }
    case 'tower':
      return createTowerGeometry(0.05, 0.4);
    case 'shrine':
      return createShrineGeometry();
    case 'temple':
      return createTempleGeometry();
    case 'mining':
      return createMiningGeometry();
    case 'ruins':
    case 'ruined_village':
      return createRuinsGeometry();
    case 'ruined_tower': {
      const broken = createTowerGeometry(0.05, 0.2);
      // Slice off top irregularly by just using it shorter
      return broken;
    }
    case 'ruined_city': {
      const r1 = createRuinsGeometry();
      const r2 = createRuinsGeometry();
      r2.translate(0.15, 0, 0.08);
      return mergeGeos([r1, r2]);
    }
    case 'camp':
      return createCampGeometry();
    case 'farmland': {
      // Small fence + field markers
      const post1 = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 4);
      post1.translate(-0.08, 0.05, 0);
      const post2 = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 4);
      post2.translate(0.08, 0.05, 0);
      const rail = new THREE.BoxGeometry(0.18, 0.01, 0.01);
      rail.translate(0, 0.08, 0);
      return mergeGeos([post1, post2, rail]);
    }
    case 'battleground':
      return createBattlegroundGeometry();
    case 'oasis':
      return null; // oasis is a terrain type, not a structure
    case 'unexplored_poi':
      return createPoiGeometry();
    case 'wilderness':
      return null;
    default:
      return null;
  }
}

// ── Merge helper ────────────────────────────────────────────────────────────

function mergeGeos(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = geometries.map(g => g.index ? g.toNonIndexed() : g);
  let totalVerts = 0;
  for (const g of nonIndexed) totalVerts += g.getAttribute('position').count;

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  let offset = 0;

  for (const g of nonIndexed) {
    const pos = g.getAttribute('position');
    const norm = g.getAttribute('normal');
    for (let i = 0; i < pos.count; i++) {
      const idx = (offset + i) * 3;
      positions[idx] = pos.getX(i);
      positions[idx + 1] = pos.getY(i);
      positions[idx + 2] = pos.getZ(i);
      if (norm) {
        normals[idx] = norm.getX(i);
        normals[idx + 1] = norm.getY(i);
        normals[idx + 2] = norm.getZ(i);
      }
    }
    offset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return merged;
}
