/**
 * DominionLensLayer.ts — the Dominion lens on the hex map (THR-1750 § U1).
 *
 * Three parts, in one group named `'dominion_lens'`:
 * - **Dim** — near-black hex plates over ground that is not the god's: Touched
 *   lightly, Foreign more, Hostile most plus a faint diagonal hatch. Lightness, never
 *   a hue (THR-1766: a sphere wash erases the lowlands). One InstancedMesh per dimmed
 *   band, so each band's alpha is a material constant, plus one for the hatch.
 * - **Glow** — Sovereign hexes only, an additive radial glow in the god's sphere
 *   colour (the `HexPulseMesh` pattern). The only hue in the lens.
 * - **Frontier** — a gold line on every edge from turf to non-turf land, thicker
 *   where it meets Hostile (`BorderMesh`'s edge helpers).
 *
 * Built when the lens is switched on and disposed when it is switched off — never
 * hidden by alpha — so toggling changes only the lens. Fog (order 13) covers it.
 *
 * NFP #1: every alpha, width and colour is in `dominion-ui-content.ts`.
 * NFP #4: an empty VM builds an empty group; nothing here throws on missing data.
 */

import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS, buildHexGeometry } from './HexFillMesh';
import { buildThickEdge, getEdgePoints } from './BorderMesh';
import type { DominionLensVM } from '../../../engine/dominionViewModels';
import type { DominionBand } from '../../../data/dominion-content';
import {
  DOMINION_DIM_BY_BAND,
  DOMINION_DIM_COLOR,
  DOMINION_HATCH_ALPHA,
  DOMINION_HATCH_SPACING_PX,
  DOMINION_GLOW_ALPHA,
  DOMINION_FRONTIER_WIDTH,
  DOMINION_FRONTIER_HOSTILE_WIDTH_MULT,
} from '../../../data/dominion-ui-content';

/** The scene-graph name of the lens group — what `snapshotScene().layersActive` lists. */
export const DOMINION_LENS_LAYER_NAME = 'dominion_lens';

/** Frontier gold — `--accent-gold`, reserved for the frontier on the map (THR-1831). */
const FRONTIER_COLOR = '#d4a040';
/** Fallback glow colour when the god has no sphere (never expected). */
const GLOW_FALLBACK_COLOR = '#d4a040';
/** Glow quad size as a fraction of hex diameter. */
const GLOW_SCALE_FRACTION = 1.1;
/** Hatch texture size in px (power of two). */
const HATCH_TEXTURE_SIZE = 64;

export interface DominionLensLayer {
  group: THREE.Group;
  counts: { dimmed: number; hatched: number; glowing: number; frontierEdges: number; hostileEdges: number };
  dispose(): void;
}

function cssVarColor(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

function hatchTexture(): THREE.CanvasTexture | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = HATCH_TEXTURE_SIZE;
    canvas.height = HATCH_TEXTURE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = 1;
    for (let o = -HATCH_TEXTURE_SIZE; o < HATCH_TEXTURE_SIZE * 2; o += DOMINION_HATCH_SPACING_PX) {
      ctx.beginPath();
      ctx.moveTo(o, 0);
      ctx.lineTo(o + HATCH_TEXTURE_SIZE, HATCH_TEXTURE_SIZE);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  } catch {
    return null;
  }
}

function glowTexture(): THREE.CanvasTexture | null {
  try {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  } catch {
    return null;
  }
}

const _m = new THREE.Matrix4();

function instanced(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  keys: readonly string[],
  z: number,
  scale: number,
  renderOrder: number,
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, keys.length));
  mesh.count = keys.length;
  mesh.renderOrder = renderOrder;
  mesh.frustumCulled = false;
  keys.forEach((key, i) => {
    const [col, row] = key.split(',').map(Number);
    const wp = hexToWorld({ col, row }, HEX_CONSTANTS.HEX_SIZE);
    _m.makeScale(scale, scale, 1);
    _m.setPosition(wp.x, wp.y, z);
    mesh.setMatrixAt(i, _m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/** Build the lens group from its prepared view model. */
export function createDominionLensLayer(vm: DominionLensVM): DominionLensLayer {
  const group = new THREE.Group();
  group.name = DOMINION_LENS_LAYER_NAME;
  const disposables: Array<{ dispose(): void }> = [];
  const size = HEX_CONSTANTS.HEX_SIZE;

  // ── Dim, one mesh per dimmed band ──
  const byBand = new Map<DominionBand, string[]>();
  for (const h of vm.hexes) {
    if (DOMINION_DIM_BY_BAND[h.band] <= 0) continue;
    const list = byBand.get(h.band) ?? [];
    list.push(h.key);
    byBand.set(h.band, list);
  }
  const hexGeo = buildHexGeometry(size);
  disposables.push(hexGeo);
  let dimmed = 0;
  for (const [band, keys] of byBand) {
    const mat = new THREE.MeshBasicMaterial({
      color: DOMINION_DIM_COLOR,
      transparent: true,
      opacity: DOMINION_DIM_BY_BAND[band],
      depthWrite: false,
    });
    disposables.push(mat);
    group.add(instanced(hexGeo, mat, keys, LAYER_Z.DOMINION_DIM, 1, RENDER_ORDER.DOMINION_DIM));
    dimmed += keys.length;
  }

  // ── Hostile hatch ──
  const hostile = byBand.get('hostile') ?? [];
  let hatched = 0;
  const hatch = hostile.length > 0 ? hatchTexture() : null;
  if (hatch) {
    hatch.wrapS = THREE.RepeatWrapping;
    hatch.wrapT = THREE.RepeatWrapping;
    const mat = new THREE.MeshBasicMaterial({
      map: hatch,
      color: '#000000',
      transparent: true,
      opacity: DOMINION_HATCH_ALPHA,
      depthWrite: false,
    });
    disposables.push(hatch, mat);
    group.add(instanced(hexGeo, mat, hostile, LAYER_Z.DOMINION_DIM, 1, RENDER_ORDER.DOMINION_DIM));
    hatched = hostile.length;
  }

  // ── Sovereign glow ──
  const sovereign = vm.hexes.filter(h => h.band === 'sovereign').map(h => h.key);
  let glowing = 0;
  const glow = sovereign.length > 0 ? glowTexture() : null;
  if (glow) {
    const color = vm.godSphere ? cssVarColor(`--sphere-${vm.godSphere}-bright`, GLOW_FALLBACK_COLOR) : GLOW_FALLBACK_COLOR;
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      map: glow,
      color: new THREE.Color(color),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: DOMINION_GLOW_ALPHA,
    });
    disposables.push(glow, geo, mat);
    group.add(instanced(geo, mat, sovereign, LAYER_Z.DOMINION_GLOW, size * 2 * GLOW_SCALE_FRACTION, RENDER_ORDER.DOMINION_GLOW));
    glowing = sovereign.length;
  }

  // ── Frontier ──
  const plain: number[] = [];
  const thick: number[] = [];
  let hostileEdges = 0;
  for (const e of vm.edges) {
    const [col, row] = e.key.split(',').map(Number);
    const centre = hexToWorld({ col, row }, size);
    const { start, end } = getEdgePoints(centre, e.dir, size);
    const half = (DOMINION_FRONTIER_WIDTH / 2) * (e.meetsHostile ? DOMINION_FRONTIER_HOSTILE_WIDTH_MULT : 1);
    buildThickEdge(start.x, start.y, end.x, end.y, half, LAYER_Z.DOMINION_FRONTIER, e.meetsHostile ? thick : plain);
    if (e.meetsHostile) hostileEdges++;
  }
  for (const positions of [plain, thick]) {
    if (positions.length === 0) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.MeshBasicMaterial({ color: FRONTIER_COLOR, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide });
    disposables.push(geo, mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = RENDER_ORDER.DOMINION_FRONTIER;
    mesh.frustumCulled = false;
    group.add(mesh);
  }

  return {
    group,
    counts: { dimmed, hatched, glowing, frontierEdges: vm.edges.length, hostileEdges },
    dispose() {
      for (const d of disposables) {
        try { d.dispose(); } catch { /* already gone */ }
      }
    },
  };
}
