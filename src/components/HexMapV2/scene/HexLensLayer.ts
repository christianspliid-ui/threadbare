/**
 * HexLensLayer — the one generic layer that draws every lens but Dominion (THR-1878 plan § D3).
 *
 * - **Dim.** One InstancedMesh over every land hex not in `vm.lit`, in Dominion's dim
 *   colour at Dominion's Foreign alpha — "one strength", so the value lives once
 *   (imported, never copied). Render order LENS_DIM, the Dominion dim's slot: only one
 *   lens draws at a time.
 * - **Marks.** Each `LensMark` is drawn by the renderer its `MAP_MARKERS` row names,
 *   from `LENS_MARK_RENDERERS` (total over the draw kinds). `agentStep` marks are not
 *   drawn here: the agent layer draws that mortal's own marker one step up (the host
 *   reads `agentStepIds`). A kind with no row, or a draw kind with no renderer, draws
 *   the neutral fallback badge in the lens ink and warns once (Law 58).
 * - **Fog covers it.** Every object sits below RENDER_ORDER.FOG; the VM keeps marks off
 *   unexplored hexes too.
 * - **Built on toggle, never alpha-hidden** (the THR-1750 rule): the host builds the
 *   layer when a hex lens is on and disposes it when it goes off.
 * - **Not pickable.** Every object's `raycast` is a no-op, so a click with a lens on
 *   reaches the same hex handler with the same coordinates as with no lens (D11).
 *
 * A new hex lens writes no code here: it adds marker rows and, at most, a draw kind.
 */
import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS, buildHexGeometry } from './HexFillMesh';
import type { HexLensVM, LensMark } from '../../../engine/views/lenses/lensTypes';
import { MAP_MARKERS, type MapMarkerDraw, type MapMarkerKind } from '../../../data/map-markers';
import { DOMINION_DIM_COLOR, DOMINION_DIM_FOREIGN } from '../../../data/dominion-ui-content';
import { lensToneColor, LENS_FALLBACK_INK } from './lensInk';

/** The one "not in focus" dim (THR-1830 § 1): Dominion's Foreign dim, by import. */
export const LENS_DIM_ALPHA = DOMINION_DIM_FOREIGN;

/** Dashed-arrow look (Threads' heading). NFP #1. */
export const LENS_ARROW_DASH = 6;
export const LENS_ARROW_GAP = 4;
export const LENS_ARROW_OPACITY = 0.9;
/** Arrowhead length and half-width, as a share of the hex radius. */
export const LENS_ARROW_HEAD_LEN = 0.45;
export const LENS_ARROW_HEAD_HALF_WIDTH = 0.25;
/** The fallback badge's radius, as a share of the hex radius. */
export const LENS_FALLBACK_BADGE_RADIUS = 0.22;

/** The scene-graph name prefix of a lens group — `snapshotScene().layersActive` lists `lens:<id>`. */
export const HEX_LENS_LAYER_PREFIX = 'lens:';

export interface HexLensLayer {
  group: THREE.Group;
  /** Agent ids the agent layer draws one step up (Threads' medallions). */
  agentStepIds: Set<string>;
  counts: { dimmed: number; marks: Partial<Record<MapMarkerKind | string, number>> };
  /** Mark kinds that drew the fallback badge (no MAP_MARKERS row, or no renderer). */
  markFallbacks: string[];
  dispose(): void;
}

/** Land tile shape the dim needs. */
export interface LensTile {
  col: number;
  row: number;
  isWater: boolean;
}

interface RenderCtx {
  group: THREE.Group;
  disposables: Array<{ dispose(): void }>;
  agentStepIds: Set<string>;
}

type MarkRenderer = (mark: LensMark, ctx: RenderCtx) => boolean;

const noRaycast = () => {};

function worldOf(key: string): { x: number; y: number } | null {
  const [col, row] = key.split(',').map(Number);
  if (!Number.isFinite(col) || !Number.isFinite(row)) return null;
  return hexToWorld({ col, row }, HEX_CONSTANTS.HEX_SIZE);
}

function drawArrow(mark: LensMark, ctx: RenderCtx): boolean {
  if (!mark.toHexKey) return false;
  const a = worldOf(mark.hexKey);
  const b = worldOf(mark.toHexKey);
  if (!a || !b) return false;
  const color = new THREE.Color().setStyle(lensToneColor(mark.tone), THREE.SRGBColorSpace);
  const size = HEX_CONSTANTS.HEX_SIZE;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const headLen = size * LENS_ARROW_HEAD_LEN;
  const tip = { x: b.x - ux * size * 0.3, y: b.y - uy * size * 0.3 };
  const base = { x: tip.x - ux * headLen, y: tip.y - uy * headLen };

  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(a.x, a.y, LAYER_Z.LENS_ARROWS),
    new THREE.Vector3(base.x, base.y, LAYER_Z.LENS_ARROWS),
  ]);
  const lineMat = new THREE.LineDashedMaterial({
    color, dashSize: LENS_ARROW_DASH, gapSize: LENS_ARROW_GAP, transparent: true, opacity: LENS_ARROW_OPACITY, depthTest: false,
  });
  const line = new THREE.Line(lineGeo, lineMat);
  line.computeLineDistances();
  line.renderOrder = RENDER_ORDER.LENS_ARROWS;
  line.raycast = noRaycast;
  line.userData.lensMark = mark.kind;

  const hw = size * LENS_ARROW_HEAD_HALF_WIDTH;
  const headGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(tip.x, tip.y, LAYER_Z.LENS_ARROWS),
    new THREE.Vector3(base.x - uy * hw, base.y + ux * hw, LAYER_Z.LENS_ARROWS),
    new THREE.Vector3(base.x + uy * hw, base.y - ux * hw, LAYER_Z.LENS_ARROWS),
  ]);
  const headMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: LENS_ARROW_OPACITY, depthTest: false, side: THREE.DoubleSide });
  const head = new THREE.Mesh(headGeo, headMat);
  head.renderOrder = RENDER_ORDER.LENS_ARROWS;
  head.raycast = noRaycast;
  head.userData.lensMark = mark.kind;

  ctx.group.add(line, head);
  ctx.disposables.push(lineGeo, lineMat, headGeo, headMat);
  return true;
}

function drawAgentStep(mark: LensMark, ctx: RenderCtx): boolean {
  if (!mark.agentId) return false;
  ctx.agentStepIds.add(mark.agentId);
  return true;
}

/** The neutral badge: a disc in the lens ink at the hex's lower edge. Also the fallback. */
function drawBadge(mark: LensMark, ctx: RenderCtx, color = lensToneColor(mark.tone)): boolean {
  const p = worldOf(mark.hexKey);
  if (!p) return false;
  const r = HEX_CONSTANTS.HEX_SIZE * LENS_FALLBACK_BADGE_RADIUS;
  const geo = new THREE.CircleGeometry(r, 20);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setStyle(color, THREE.SRGBColorSpace), transparent: true, opacity: 0.95, depthTest: false });
  const disc = new THREE.Mesh(geo, mat);
  disc.position.set(p.x, p.y - HEX_CONSTANTS.HEX_SIZE * 0.55, LAYER_Z.LENS_MARKS);
  disc.renderOrder = RENDER_ORDER.LENS_MARKS;
  disc.raycast = noRaycast;
  disc.userData.lensMark = mark.kind;
  ctx.group.add(disc);
  ctx.disposables.push(geo, mat);
  return true;
}

/**
 * One renderer per draw kind (total). `badge`, `omenRing` and `road` get their own
 * looks with Trouble and Trade (THR-1898); until then they draw the neutral badge.
 * Plain-map draw kinds never reach a lens layer and draw nothing.
 */
export const LENS_MARK_RENDERERS: Record<MapMarkerDraw, MarkRenderer | null> = {
  agentStep: drawAgentStep,
  arrow: drawArrow,
  badge: (m, c) => drawBadge(m, c),
  omenRing: (m, c) => drawBadge(m, c),
  road: (m, c) => drawBadge(m, c),
  portrait: null,
  dot: null,
  pip: null,
  medallion: null,
  sprite: null,
};

const warnedKinds = new Set<string>();
function warnOnce(kind: string, why: string): void {
  if (warnedKinds.has(kind)) return;
  warnedKinds.add(kind);
  console.warn(`[HexLensLayer] mark kind '${kind}' ${why}; drew the fallback badge (Law 58: add it to MAP_MARKERS)`);
}

/** Build the lens group from its prepared view model. Never throws on missing data. */
export function createHexLensLayer(vm: HexLensVM, tiles: readonly LensTile[]): HexLensLayer {
  const group = new THREE.Group();
  group.name = `${HEX_LENS_LAYER_PREFIX}${vm.lensId}`;
  const disposables: Array<{ dispose(): void }> = [];
  const agentStepIds = new Set<string>();
  const counts: HexLensLayer['counts'] = { dimmed: 0, marks: {} };
  const markFallbacks: string[] = [];

  // ── Dim: every land hex not lit ──
  const lit = new Set(vm.lit);
  const dimKeys: string[] = [];
  for (const t of tiles) {
    if (t.isWater) continue;
    const key = `${t.col},${t.row}`;
    if (!lit.has(key)) dimKeys.push(key);
  }
  if (dimKeys.length > 0) {
    const geo = buildHexGeometry(HEX_CONSTANTS.HEX_SIZE);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setStyle(DOMINION_DIM_COLOR, THREE.SRGBColorSpace),
      transparent: true,
      opacity: LENS_DIM_ALPHA,
      depthWrite: false,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, dimKeys.length);
    mesh.renderOrder = RENDER_ORDER.LENS_DIM;
    mesh.frustumCulled = false;
    mesh.raycast = noRaycast;
    const m = new THREE.Matrix4();
    dimKeys.forEach((key, i) => {
      const p = worldOf(key)!;
      m.makeTranslation(p.x, p.y, LAYER_Z.LENS_DIM);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    disposables.push(geo, mat);
    counts.dimmed = dimKeys.length;
  }

  // ── Marks ──
  const ctx: RenderCtx = { group, disposables, agentStepIds };
  for (const mark of vm.marks) {
    const def = (MAP_MARKERS as Record<string, (typeof MAP_MARKERS)[MapMarkerKind] | undefined>)[mark.kind];
    const renderer = def ? LENS_MARK_RENDERERS[def.draw] : null;
    let drawn = false;
    try {
      drawn = renderer ? renderer(mark, ctx) : false;
    } catch {
      drawn = false;
    }
    if (!def || !renderer) {
      warnOnce(mark.kind, def ? `has draw '${def.draw}' with no lens renderer` : 'has no MAP_MARKERS row');
      drawBadge(mark, ctx, LENS_FALLBACK_INK);
      if (!markFallbacks.includes(mark.kind)) markFallbacks.push(mark.kind);
      drawn = true;
    }
    if (drawn) counts.marks[mark.kind] = (counts.marks[mark.kind] ?? 0) + 1;
  }

  return {
    group,
    agentStepIds,
    counts,
    markFallbacks,
    dispose() {
      for (const d of disposables) d.dispose();
      group.clear();
    },
  };
}
