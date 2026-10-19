/**
 * StageFocusLayer.ts — the map under the Stage (THR-1892, plan THR-1877 § D5).
 *
 * While a moment plays on the Stage the map is its backdrop: every hex except the lit one
 * is dimmed to the lens grammar's near-black, and the lit hex keeps its colour inside a
 * parchment ring with a soft glow. One group named `'stage_focus'`:
 *
 * - **Dim** — one InstancedMesh of hex plates over every tile but the lit ones, at
 *   `STAGE_MAP_DIM`, above agents, events and canvas labels (`RENDER_ORDER.STAGE_DIM`),
 *   below the fog. Lightness, never a hue.
 * - **Ring** — a parchment line on the lit hex's six edges (`--text-primary`, never gold:
 *   gold on the map is the Dominion frontier), above the fog so it shows in fog too.
 * - **Glow** — an additive radial glow in the ring's colour (the `HexPulseMesh` pattern).
 *
 * Built when the Stage opens and disposed when it closes — never hidden by alpha — so
 * the Stage changes nothing else on the map. `setProgress(t)` fades it in with the camera.
 *
 * NFP #1: every alpha, width and colour is in `stage-content.ts`.
 * NFP #4: an empty focus builds an empty dim; nothing here throws on missing data.
 */
import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS, buildHexGeometry } from './HexFillMesh';
import { buildThickEdge, getEdgePoints } from './BorderMesh';
import {
  STAGE_DIM_COLOR,
  STAGE_GLOW_ALPHA,
  STAGE_GLOW_SCALE_FRACTION,
  STAGE_RING_COLOR_FALLBACK,
  STAGE_RING_COLOR_VAR,
  STAGE_RING_WIDTH_FRACTION,
} from '../../../data/stage-content';

/** The scene-graph name — what `snapshotScene().layersActive` lists. */
export const STAGE_FOCUS_LAYER_NAME = 'stage_focus';

/** What the map shows under the Stage (`setStageFocus`). */
export interface StageMapFocus {
  /** The lit hexes, `col,row` (0 or 1 in S2). */
  lit: string[];
  /** Premonition places (S4); S2 passes none. */
  options: { hexKey: string; tone: 'whisper' | 'compulsion'; ringOnly: boolean; hovered: boolean }[];
  /** The dim's alpha (`STAGE_MAP_DIM`). */
  strength: number;
}

export interface StageFocusLayer {
  group: THREE.Group;
  counts: { lit: number; dimmed: number };
  strength: number;
  /** 0 → nothing drawn, 1 → the full dim, ring and glow. */
  setProgress(t: number): void;
  dispose(): void;
}

export function cssVarColor(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
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
    g.addColorStop(0.6, 'rgba(255,255,255,0.4)');
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

function parseKey(key: string): { col: number; row: number } | null {
  const [col, row] = key.split(',').map(Number);
  return Number.isFinite(col) && Number.isFinite(row) ? { col, row } : null;
}

/**
 * Build the layer. `tiles` is every hex on the map; the lit ones get no plate.
 */
export function createStageFocusLayer(focus: StageMapFocus, tiles: readonly { col: number; row: number }[]): StageFocusLayer {
  const group = new THREE.Group();
  group.name = STAGE_FOCUS_LAYER_NAME;
  const disposables: Array<{ dispose(): void }> = [];
  const size = HEX_CONSTANTS.HEX_SIZE;
  const litSet = new Set(focus.lit);
  const strength = Math.max(0, Math.min(1, focus.strength));

  // ── Dim: every hex but the lit ones ──
  const dimmed = tiles.filter(t => !litSet.has(`${t.col},${t.row}`));
  const hexGeo = buildHexGeometry(size);
  const dimMat = new THREE.MeshBasicMaterial({ color: STAGE_DIM_COLOR, transparent: true, opacity: 0, depthWrite: false, depthTest: false });
  disposables.push(hexGeo, dimMat);
  const dimMesh = new THREE.InstancedMesh(hexGeo, dimMat, Math.max(1, dimmed.length));
  dimMesh.count = dimmed.length;
  dimMesh.renderOrder = RENDER_ORDER.STAGE_DIM;
  dimMesh.frustumCulled = false;
  dimmed.forEach((t, i) => {
    const wp = hexToWorld({ col: t.col, row: t.row }, size);
    _m.makeScale(1, 1, 1);
    _m.setPosition(wp.x, wp.y, LAYER_Z.STAGE_DIM);
    dimMesh.setMatrixAt(i, _m);
  });
  dimMesh.instanceMatrix.needsUpdate = true;
  group.add(dimMesh);

  // ── Ring and glow on each lit hex ──
  const ringColor = new THREE.Color();
  ringColor.setStyle(cssVarColor(STAGE_RING_COLOR_VAR, STAGE_RING_COLOR_FALLBACK), THREE.SRGBColorSpace);
  const ringPositions: number[] = [];
  const lit = focus.lit.map(parseKey).filter((h): h is { col: number; row: number } => h !== null);
  const half = (size * STAGE_RING_WIDTH_FRACTION) / 2;
  for (const h of lit) {
    const centre = hexToWorld(h, size);
    for (let dir = 0; dir < 6; dir++) {
      const { start, end } = getEdgePoints(centre, dir, size);
      buildThickEdge(start.x, start.y, end.x, end.y, half, LAYER_Z.STAGE_RING, ringPositions);
    }
  }
  let ringMat: THREE.MeshBasicMaterial | null = null;
  if (ringPositions.length > 0) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(ringPositions, 3));
    ringMat = new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
    disposables.push(geo, ringMat);
    const mesh = new THREE.Mesh(geo, ringMat);
    mesh.renderOrder = RENDER_ORDER.STAGE_RING;
    mesh.frustumCulled = false;
    group.add(mesh);
  }

  let glowMat: THREE.MeshBasicMaterial | null = null;
  const glow = lit.length > 0 ? glowTexture() : null;
  if (glow) {
    const geo = new THREE.PlaneGeometry(1, 1);
    glowMat = new THREE.MeshBasicMaterial({ map: glow, color: ringColor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, opacity: 0 });
    disposables.push(glow, geo, glowMat);
    const mesh = new THREE.InstancedMesh(geo, glowMat, lit.length);
    mesh.renderOrder = RENDER_ORDER.STAGE_RING;
    mesh.frustumCulled = false;
    const scale = size * 2 * STAGE_GLOW_SCALE_FRACTION;
    lit.forEach((h, i) => {
      const wp = hexToWorld(h, size);
      _m.makeScale(scale, scale, 1);
      _m.setPosition(wp.x, wp.y, LAYER_Z.STAGE_RING);
      mesh.setMatrixAt(i, _m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  const layer: StageFocusLayer = {
    group,
    counts: { lit: lit.length, dimmed: dimmed.length },
    strength,
    setProgress(t: number) {
      const p = Math.max(0, Math.min(1, t));
      dimMat.opacity = strength * p;
      if (ringMat) ringMat.opacity = p;
      if (glowMat) glowMat.opacity = STAGE_GLOW_ALPHA * p;
    },
    dispose() {
      for (const d of disposables) {
        try { d.dispose(); } catch { /* already gone */ }
      }
    },
  };
  return layer;
}
