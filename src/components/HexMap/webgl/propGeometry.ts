/**
 * Procedural low-poly prop geometries for hex map decoration.
 * All geometry is generated at init time — no external models needed.
 */
import * as THREE from 'three';

// ── Tree geometry ───────────────────────────────────────────────────────────

/** Create a low-poly conifer tree (cone crown + cylinder trunk) */
export function createTreeGeometry(): THREE.BufferGeometry {
  // Crown: cone with 5 sides for low-poly look
  const crown = new THREE.ConeGeometry(0.06, 0.18, 5);
  crown.translate(0, 0.16, 0);

  // Trunk: thin cylinder
  const trunk = new THREE.CylinderGeometry(0.012, 0.018, 0.08, 4);
  trunk.translate(0, 0.04, 0);

  // Merge into single geometry
  const merged = new THREE.BufferGeometry();
  const crownMesh = new THREE.Mesh(crown);
  const trunkMesh = new THREE.Mesh(trunk);

  // Use BufferGeometryUtils-style merge
  crownMesh.updateMatrixWorld();
  trunkMesh.updateMatrixWorld();

  const geos = [crown, trunk];
  merged.copy(mergeGeometries(geos));
  return merged;
}

/** Create a broader deciduous tree (sphere crown + trunk) */
export function createDeciduousTreeGeometry(): THREE.BufferGeometry {
  const crown = new THREE.IcosahedronGeometry(0.08, 0);
  crown.translate(0, 0.16, 0);
  // Slightly squash vertically for rounder canopy
  const posAttr = crown.getAttribute('position');
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.setY(i, posAttr.getY(i) * 0.75 + 0.16 * 0.25);
  }

  const trunk = new THREE.CylinderGeometry(0.012, 0.018, 0.1, 4);
  trunk.translate(0, 0.05, 0);

  return mergeGeometries([crown, trunk]);
}

// ── Rock geometry ───────────────────────────────────────────────────────────

/** Create an irregular low-poly rock */
export function createRockGeometry(): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(0.04, 0);
  // Randomly perturb vertices for irregular shape
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const scale = 0.7 + Math.abs(Math.sin(i * 7.13)) * 0.6;
    pos.setX(i, pos.getX(i) * scale);
    pos.setY(i, Math.max(0, pos.getY(i) * 0.6)); // flatten bottom
    pos.setZ(i, pos.getZ(i) * scale);
  }
  geo.translate(0, 0.015, 0);
  geo.computeVertexNormals();
  return geo;
}

/** Create a larger boulder */
export function createBoulderGeometry(): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(0.07, 1);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const jitter = Math.sin(i * 3.7) * 0.15;
    pos.setX(i, pos.getX(i) * (0.8 + Math.abs(Math.sin(i * 5.1)) * 0.4));
    pos.setY(i, Math.max(0, pos.getY(i) * 0.5 + jitter * 0.1));
    pos.setZ(i, pos.getZ(i) * (0.8 + Math.abs(Math.cos(i * 4.3)) * 0.4));
  }
  geo.translate(0, 0.02, 0);
  geo.computeVertexNormals();
  return geo;
}

// ── Grass tuft geometry ─────────────────────────────────────────────────────

/** Create a small grass tuft (two crossed quads) */
export function createGrassTuftGeometry(): THREE.BufferGeometry {
  const h = 0.04;
  const w = 0.03;

  // Two crossed vertical quads
  const positions = new Float32Array([
    // Quad 1 (aligned to X)
    -w, 0, 0,   w, 0, 0,   w, h, 0,
    -w, 0, 0,   w, h, 0,  -w, h, 0,
    // Quad 2 (aligned to Z)
     0, 0, -w,  0, 0, w,   0, h, w,
     0, 0, -w,  0, h, w,   0, h, -w,
  ]);

  const normals = new Float32Array([
    0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1,
    1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geo;
}

// ── Merge helper ────────────────────────────────────────────────────────────

/** Simple geometry merge (positions + normals only, no indices) */
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // Convert indexed geometries to non-indexed first
  const nonIndexed = geometries.map(g => g.index ? g.toNonIndexed() : g);

  let totalVerts = 0;
  for (const g of nonIndexed) {
    totalVerts += g.getAttribute('position').count;
  }

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
