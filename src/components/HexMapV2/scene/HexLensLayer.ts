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
import { MAP_MARKERS, LENS_BADGE_PX, type MapMarkerDef, type MapMarkerDraw, type MapMarkerKind, type ZoomBand } from '../../../data/map-markers';
import { DOMINION_DIM_COLOR, DOMINION_DIM_FOREIGN } from '../../../data/dominion-ui-content';
import { lensToneColor, LENS_FALLBACK_INK } from './lensInk';
import { buildMapIconTexture } from '../locations/locationIconTextures';
import { iconShape } from '../../shared/iconShape';
import { createTradeRouteLayer } from './TradeRouteMesh';

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

/** Badges drawn per hex along its lower edge; the hover lists every kind (THR-1898). NFP #1. */
export const LENS_BADGES_PER_HEX = 2;
/** Where badges sit: below the hex centre, and apart from each other, as shares of the hex radius. */
export const LENS_BADGE_DROP = 0.5;
export const LENS_BADGE_SPACING = 0.62;
/** A badge's world size before the first zoom update, as a share of the hex radius. */
export const LENS_BADGE_INITIAL_SCALE = 0.7;
/** The badge's ground: a dark disc with a ring in the mark's ink. */
export const LENS_BADGE_DISC = '#14100c';
export const LENS_BADGE_RING_WIDTH = 0.07;
/** Canvas size of a badge texture. */
export const LENS_BADGE_TEXTURE_SIZE = 128;
/** The carved icon's inset inside the badge disc. */
export const LENS_BADGE_ICON_INSET = 0.24;
/** The omen ring: dash, gap and opacity. */
export const LENS_OMEN_RING_DASH = 3;
export const LENS_OMEN_RING_GAP = 3;
export const LENS_OMEN_RING_OPACITY = 0.85;
/** THR-1955 — the embargoed road's dash, gap (world units) and opacity. */
export const LENS_EMBARGO_DASH = 6;
export const LENS_EMBARGO_GAP = 4;
export const LENS_EMBARGO_OPACITY = 0.95;
/** Bands that draw badges (Trouble's marks and Trade's mid-road badge). */
export const LENS_BADGE_BANDS: readonly ZoomBand[] = ['regional', 'heroLocal'];

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
  /** Badge slots per hex: how many badges a hex will draw, and how many it has drawn. */
  badgeSlots: Map<string, { total: number; used: number }>;
  def: MapMarkerDef | undefined;
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

// ── Carved badges (THR-1898) ──────────────────────────────────────────

/** One texture per icon and ink, built once and shared by every lens layer. */
const badgeTextureCache = new Map<string, THREE.CanvasTexture>();

function badgeTexture(icon: string, ink: string): THREE.CanvasTexture {
  const key = `${icon}|${ink}`;
  const hit = badgeTextureCache.get(key);
  if (hit) return hit;
  const tex = buildMapIconTexture(iconShape(icon), {
    size: LENS_BADGE_TEXTURE_SIZE,
    fill: ink,
    outline: LENS_BADGE_DISC,
    outlineWidthFraction: 0.02,
  }, {
    inset: LENS_BADGE_ICON_INSET,
    underlay: (ctx, size) => {
      const r = size / 2;
      const ring = size * LENS_BADGE_RING_WIDTH;
      ctx.beginPath();
      ctx.arc(r, r, r - ring / 2, 0, Math.PI * 2);
      ctx.fillStyle = LENS_BADGE_DISC;
      ctx.fill();
      ctx.lineWidth = ring;
      ctx.strokeStyle = ink;
      ctx.stroke();
    },
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  badgeTextureCache.set(key, tex);
  return tex;
}

/** The slot a badge takes on its hex, or null when the hex already shows LENS_BADGES_PER_HEX. */
function takeBadgeSlot(ctx: RenderCtx, hexKey: string): { x: number; y: number } | null {
  const p = worldOf(hexKey);
  if (!p) return null;
  const slot = ctx.badgeSlots.get(hexKey) ?? { total: 1, used: 0 };
  if (slot.used >= LENS_BADGES_PER_HEX) return null;
  const shown = Math.min(slot.total, LENS_BADGES_PER_HEX);
  const size = HEX_CONSTANTS.HEX_SIZE;
  const x = p.x + (slot.used - (shown - 1) / 2) * size * LENS_BADGE_SPACING;
  slot.used += 1;
  ctx.badgeSlots.set(hexKey, slot);
  return { x, y: p.y - size * LENS_BADGE_DROP };
}

/** A carved-icon badge sprite at a position, sized by the zoom update (screen-fixed). */
function addBadgeSprite(ctx: RenderCtx, kind: string, icon: string, ink: string, at: { x: number; y: number }): void {
  const mat = new THREE.SpriteMaterial({ map: badgeTexture(icon, ink), transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  const s = HEX_CONSTANTS.HEX_SIZE * LENS_BADGE_INITIAL_SCALE;
  sprite.scale.set(s, s, 1);
  sprite.position.set(at.x, at.y, LAYER_Z.LENS_MARKS);
  sprite.renderOrder = RENDER_ORDER.LENS_MARKS;
  sprite.raycast = noRaycast;
  sprite.userData.lensMark = kind;
  sprite.userData.lensBadge = true;
  ctx.group.add(sprite);
  ctx.disposables.push(mat);
}

/** Trouble's badge: the kind's carved icon on a dark disc ringed in the mark's ink. */
function drawCarvedBadge(mark: LensMark, ctx: RenderCtx): boolean {
  const icon = ctx.def?.icon;
  if (!icon) return drawBadge(mark, ctx);
  const at = takeBadgeSlot(ctx, mark.hexKey);
  if (!at) return true; // the hex already shows its badges; the hover lists this kind
  addBadgeSprite(ctx, mark.kind, icon, lensToneColor(mark.tone), at);
  return true;
}

/** The omen: a dotted ring round its reach, and its badge at the centre hex. */
function drawOmenRing(mark: LensMark, ctx: RenderCtx): boolean {
  const p = worldOf(mark.hexKey);
  if (!p) return false;
  const radius = Math.max(0, mark.radius ?? 1);
  // Hex centres sit HEX_SIZE·√3 apart; the ring runs half a hex beyond the outermost centre.
  const ringR = (radius + 0.5) * HEX_CONSTANTS.HEX_SIZE * Math.sqrt(3);
  const pts: THREE.Vector3[] = [];
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(p.x + Math.cos(a) * ringR, p.y + Math.sin(a) * ringR, LAYER_Z.LENS_ARROWS));
  }
  const color = new THREE.Color().setStyle(lensToneColor(mark.tone), THREE.SRGBColorSpace);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({
    color, dashSize: LENS_OMEN_RING_DASH, gapSize: LENS_OMEN_RING_GAP, transparent: true, opacity: LENS_OMEN_RING_OPACITY, depthTest: false,
  });
  const ring = new THREE.Line(geo, mat);
  ring.computeLineDistances();
  ring.renderOrder = RENDER_ORDER.LENS_ARROWS;
  ring.raycast = noRaycast;
  ring.userData.lensMark = mark.kind;
  ctx.group.add(ring);
  ctx.disposables.push(geo, mat);
  const icon = ctx.def?.icon;
  const at = icon ? takeBadgeSlot(ctx, mark.hexKey) : null;
  if (icon && at) addBadgeSprite(ctx, mark.kind, icon, lensToneColor(mark.tone), at);
  return true;
}

/** THR-1955 — an embargoed road: one dashed line in the embargo ink, end to end. */
function drawEmbargoedRoad(mark: LensMark, ctx: RenderCtx): boolean {
  const a = worldOf(mark.hexKey);
  const b = mark.toHexKey ? worldOf(mark.toHexKey) : null;
  if (!a || !b) return false;
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(a.x, a.y, LAYER_Z.LENS_ARROWS),
    new THREE.Vector3(b.x, b.y, LAYER_Z.LENS_ARROWS),
  ]);
  const color = new THREE.Color().setStyle(lensToneColor(mark.tone), THREE.SRGBColorSpace);
  const mat = new THREE.LineDashedMaterial({
    color, dashSize: LENS_EMBARGO_DASH, gapSize: LENS_EMBARGO_GAP, transparent: true, opacity: LENS_EMBARGO_OPACITY, depthTest: false,
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  line.renderOrder = RENDER_ORDER.LENS_ARROWS;
  line.raycast = noRaycast;
  line.userData.lensMark = mark.kind;
  line.userData.embargoed = true;
  ctx.group.add(line);
  ctx.disposables.push(geo, mat);
  const icon = ctx.def?.icon;
  if (icon) addBadgeSprite(ctx, mark.kind, icon, lensToneColor(mark.tone), { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  return true;
}

/** Trade's road: the route line (TradeRouteMesh, its look unchanged) and one badge mid-road. */
function drawRoad(mark: LensMark, ctx: RenderCtx): boolean {
  if (!mark.toHexKey) return false;
  if (mark.tone === 'embargoed') return drawEmbargoedRoad(mark, ctx);
  const [fc, fr] = mark.hexKey.split(',').map(Number);
  const [tc, tr] = mark.toHexKey.split(',').map(Number);
  if (![fc, fr, tc, tr].every(Number.isFinite)) return false;
  const routes = createTradeRouteLayer([{
    id: `${mark.hexKey}>${mark.toHexKey}`,
    from: { col: fc, row: fr },
    to: { col: tc, row: tr },
    volume: mark.weight ?? 1,
    threatened: mark.tone === 'threat',
    goods: [],
    carriesStaple: false,
  }]);
  routes.group.traverse(o => { o.raycast = noRaycast; });
  routes.group.userData.lensMark = mark.kind;
  ctx.group.add(routes.group);
  ctx.disposables.push(routes);
  const icon = ctx.def?.icon;
  const a = worldOf(mark.hexKey);
  const b = worldOf(mark.toHexKey);
  if (icon && a && b) {
    addBadgeSprite(ctx, mark.kind, icon, lensToneColor(mark.tone), { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  }
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
 * One renderer per draw kind (total). Plain-map draw kinds never reach a lens layer
 * and draw nothing.
 */
export const LENS_MARK_RENDERERS: Record<MapMarkerDraw, MarkRenderer | null> = {
  agentStep: drawAgentStep,
  arrow: drawArrow,
  badge: drawCarvedBadge,
  omenRing: drawOmenRing,
  road: drawRoad,
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

/**
 * Follow the zoom (THR-1898): lines and rings show in the bands their `MAP_MARKERS` row
 * sizes; badges show at regional and hero-local and keep `LENS_BADGE_PX` on screen
 * (world scale = px / k). Called on every zoom change.
 */
export function updateHexLensZoom(layer: Pick<HexLensLayer, 'group'>, band: ZoomBand, k: number): void {
  const badgeVisible = LENS_BADGE_BANDS.includes(band);
  const badgeWorld = k > 0 ? LENS_BADGE_PX / k : HEX_CONSTANTS.HEX_SIZE * LENS_BADGE_INITIAL_SCALE;
  for (const child of layer.group.children) {
    const kind = child.userData.lensMark as MapMarkerKind | undefined;
    if (!kind || !(kind in MAP_MARKERS)) continue;
    if (child.userData.lensBadge) {
      child.visible = badgeVisible;
      child.scale.set(badgeWorld, badgeWorld, 1);
      continue;
    }
    const def = MAP_MARKERS[kind];
    child.visible = def.sizePx === 'mesh' || def.sizePx[band] !== null;
  }
}

/** Build the lens group from its prepared view model. Never throws on missing data. */
/** Every land hex not in `lit`, as `col,row` keys — what a dim covers. */
export function dimKeysOf(tiles: readonly LensTile[], lit: ReadonlySet<string>): string[] {
  const keys: string[] = [];
  for (const t of tiles) {
    if (t.isWater) continue;
    const key = `${t.col},${t.row}`;
    if (!lit.has(key)) keys.push(key);
  }
  return keys;
}

/**
 * The lens grammar's dim-and-lit plate builder (THR-1878 § D3; generalised for THR-1914's
 * armed lighting, which imports it and never forks it): one InstancedMesh of hex plates
 * over `keys`, in Dominion's dim colour at `alpha`, at the lens dim's render slot, not
 * pickable. Adds the mesh to `group` and its geometry and material to `disposables`;
 * returns how many plates it drew.
 */
export function addLensDimPlates(
  group: THREE.Group,
  disposables: Array<{ dispose(): void }>,
  keys: readonly string[],
  alpha: number,
): number {
  if (keys.length === 0 || alpha <= 0) return 0;
  const geo = buildHexGeometry(HEX_CONSTANTS.HEX_SIZE);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color().setStyle(DOMINION_DIM_COLOR, THREE.SRGBColorSpace),
    transparent: true,
    opacity: alpha,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, keys.length);
  mesh.renderOrder = RENDER_ORDER.LENS_DIM;
  mesh.frustumCulled = false;
  mesh.raycast = noRaycast;
  const m = new THREE.Matrix4();
  let drawn = 0;
  for (const key of keys) {
    const p = worldOf(key);
    if (!p) continue;
    m.makeTranslation(p.x, p.y, LAYER_Z.LENS_DIM);
    mesh.setMatrixAt(drawn++, m);
  }
  mesh.count = drawn;
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);
  disposables.push(geo, mat);
  return drawn;
}

export function createHexLensLayer(vm: HexLensVM, tiles: readonly LensTile[]): HexLensLayer {
  const group = new THREE.Group();
  group.name = `${HEX_LENS_LAYER_PREFIX}${vm.lensId}`;
  const disposables: Array<{ dispose(): void }> = [];
  const agentStepIds = new Set<string>();
  const counts: HexLensLayer['counts'] = { dimmed: 0, marks: {} };
  const markFallbacks: string[] = [];

  // ── Dim: every land hex not lit ──
  counts.dimmed = addLensDimPlates(group, disposables, dimKeysOf(tiles, new Set(vm.lit)), LENS_DIM_ALPHA);

  // ── Marks ──
  const lookup = (kind: string) => (MAP_MARKERS as Record<string, MapMarkerDef | undefined>)[kind];
  // Badge slots: how many badges each hex will draw, so a lone badge sits centred.
  const badgeSlots = new Map<string, { total: number; used: number }>();
  for (const mark of vm.marks) {
    const draw = lookup(mark.kind)?.draw;
    if (draw !== 'badge' && draw !== 'omenRing') continue;
    const slot = badgeSlots.get(mark.hexKey) ?? { total: 0, used: 0 };
    slot.total += 1;
    badgeSlots.set(mark.hexKey, slot);
  }
  const ctx: RenderCtx = { group, disposables, agentStepIds, badgeSlots, def: undefined };
  for (const mark of vm.marks) {
    const def = lookup(mark.kind);
    ctx.def = def;
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
