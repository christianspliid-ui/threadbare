/**
 * cameraFraming.ts — where the map camera looks, as pure functions (THR-1900,
 * plan `2026-10-14-thr-1878-map-lenses-and-chrome.md` D6–D8).
 *
 * - **Known land** — the world bounds of every hex whose visibility is not `unexplored`,
 *   and the zoom that fits them (`fitKnownLand`).
 * - **The opening view** — centred on the First at the known-land fit clamped to
 *   [OPENING_ZOOM_MIN, OPENING_ZOOM_MAX]; falls back to the seat, then the known land's
 *   centre, then (fog off or nothing known) the whole-grid fit, as before.
 * - **Zoom steps and limits** — one clamp, so the buttons, the keys and the debug bridge
 *   agree on when a limit is reached.
 *
 * World coordinates are Three.js y-up (`hexToWorld`). The d3 transform that centres a
 * world point (x, y) at scale k is `translate(-x·k, y·k).scale(k)` (see CameraAnimator.ts).
 *
 * NFP #3: every function is a pure function of its arguments — same visibility and canvas
 * size, same opening view.
 */
import type { HexCoord } from '../../../types';
import type { VisibilityMap } from '../../../types/visibility';
import { parseHexKey } from '../../../lib/hexKey';
import { hexToWorld } from '../../../lib/worldPosition';
import { HEX_CONSTANTS } from '../scene/HexFillMesh';
import { CAMERA_CONSTANTS, computeFitZoom } from './D3ZoomCamera';

/** An axis-aligned box in world units (y-up). */
export interface WorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** What the opening view centred on (`getMapChrome().opening.centredOn`). */
export type OpeningCentre = 'first' | 'seat' | 'land' | 'grid';

export interface CameraView {
  /** World point at the canvas centre. */
  x: number;
  y: number;
  k: number;
}

export interface OpeningView extends CameraView {
  centredOn: OpeningCentre;
}

/** A zoom within this much of a limit counts as at the limit (d3 transitions land on floats). */
export const ZOOM_LIMIT_EPSILON = 1e-3;

/** The hexes the god has seen — every visibility entry that is not `unexplored`. */
export function knownHexes(visibilityMap: VisibilityMap | undefined): HexCoord[] {
  if (!visibilityMap) return [];
  const out: HexCoord[] = [];
  for (const [key, vis] of visibilityMap) {
    if (vis.state === 'unexplored') continue;
    const { col, row } = parseHexKey(key);
    if (Number.isFinite(col) && Number.isFinite(row)) out.push({ col, row });
  }
  return out;
}

/**
 * World bounds of a set of hexes, padded by one hex radius on every side so the outer
 * hexes are drawn whole. Null for an empty set.
 */
export function boundsOfHexes(hexes: readonly HexCoord[]): WorldBounds | null {
  if (hexes.length === 0) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const hex of hexes) {
    const { x, y } = hexToWorld(hex, HEX_CONSTANTS.HEX_SIZE);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const pad = HEX_CONSTANTS.HEX_SIZE;
  return { minX: minX - pad, maxX: maxX + pad, minY: minY - pad, maxY: maxY + pad };
}

/** The centre of a bounds box. */
export function boundsCentre(b: WorldBounds): { x: number; y: number } {
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
}

/**
 * The zoom at which a bounds box fills the canvas at FIT_PADDING. Null for a degenerate
 * canvas (fail-soft: callers fall back).
 */
export function fitBoundsZoom(b: WorldBounds, canvasW: number, canvasH: number): number | null {
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  if (!(w > 0) || !(h > 0) || !(canvasW > 0) || !(canvasH > 0)) return null;
  return Math.min(
    (canvasW * CAMERA_CONSTANTS.FIT_PADDING) / w,
    (canvasH * CAMERA_CONSTANTS.FIT_PADDING) / h,
  );
}

/** Clamp a zoom to [min, max]. */
export function clampZoom(k: number, minK: number, maxK: number): number {
  return Math.max(minK, Math.min(maxK, k));
}

/** The whole-grid view: the grid's middle hex at the grid-fit zoom, clamped to the camera's limits. */
export function gridView(cols: number, rows: number, canvasW: number, canvasH: number, minK: number, maxK: number): CameraView {
  const centre = hexToWorld({ col: Math.floor(cols / 2), row: Math.floor(rows / 2) }, HEX_CONSTANTS.HEX_SIZE);
  const fitK = computeFitZoom(cols, rows, canvasW, canvasH);
  const k = fitK != null ? clampZoom(fitK, minK, maxK) : CAMERA_CONSTANTS.DEFAULT_ZOOM;
  return { x: centre.x, y: centre.y, k };
}

/**
 * "Show known land" (D6/D8): the explored hexes' bounds, centred, at their fit zoom clamped
 * only to the camera's own limits. Null when nothing is known (the caller falls back to the grid).
 */
export function fitKnownLand(
  visibilityMap: VisibilityMap | undefined,
  canvasW: number,
  canvasH: number,
  minK: number,
  maxK: number,
): CameraView | null {
  const bounds = boundsOfHexes(knownHexes(visibilityMap));
  if (!bounds) return null;
  const fitK = fitBoundsZoom(bounds, canvasW, canvasH);
  if (fitK == null) return null;
  const { x, y } = boundsCentre(bounds);
  return { x, y, k: clampZoom(fitK, minK, maxK) };
}

export interface OpeningViewInput {
  firstHex: HexCoord | null;
  seatHex: HexCoord | null;
  visibilityMap: VisibilityMap | undefined;
  fogEnabled: boolean;
  cols: number;
  rows: number;
  canvasW: number;
  canvasH: number;
  /** The camera's zoom limits (`zoom.scaleExtent()`). */
  minK: number;
  maxK: number;
}

/**
 * The opening view (D8). ZOOM-05's hero-local close-up is retired: the run opens on the
 * First with all known land in view.
 *
 * - Fog off, no visibility map, nothing known, or a degenerate canvas → the whole-grid fit
 *   (`centredOn: 'grid'`), as before ZOOM-05.
 * - Otherwise k = clamp(known-land fit, OPENING_ZOOM_MIN, OPENING_ZOOM_MAX), centred on the
 *   First, else the god's seat, else the known land's centre.
 */
export function computeOpeningView(input: OpeningViewInput): OpeningView {
  const { firstHex, seatHex, visibilityMap, fogEnabled, cols, rows, canvasW, canvasH, minK, maxK } = input;
  const grid = (): OpeningView => ({ ...gridView(cols, rows, canvasW, canvasH, minK, maxK), centredOn: 'grid' });
  if (!fogEnabled || !visibilityMap) return grid();

  const bounds = boundsOfHexes(knownHexes(visibilityMap));
  if (!bounds) return grid();
  const fitK = fitBoundsZoom(bounds, canvasW, canvasH);
  if (fitK == null) return grid();
  const k = clampZoom(
    clampZoom(fitK, CAMERA_CONSTANTS.OPENING_ZOOM_MIN, CAMERA_CONSTANTS.OPENING_ZOOM_MAX),
    minK,
    maxK,
  );

  if (firstHex) return { ...hexToWorld(firstHex, HEX_CONSTANTS.HEX_SIZE), k, centredOn: 'first' };
  if (seatHex) return { ...hexToWorld(seatHex, HEX_CONSTANTS.HEX_SIZE), k, centredOn: 'seat' };
  return { ...boundsCentre(bounds), k, centredOn: 'land' };
}

/** Where the camera is looking now, from a d3 transform (inverse of the centring math above). */
export function viewOfTransform(t: { x: number; y: number; k: number }): CameraView {
  return { x: -t.x / t.k, y: t.y / t.k, k: t.k };
}

/** Zoom limit flags for the control cluster (Law 25: disabled with a reason, never inert). */
export function zoomLimits(k: number, minK: number, maxK: number): { atMax: boolean; atMin: boolean } {
  return {
    atMax: k >= maxK - ZOOM_LIMIT_EPSILON,
    atMin: k <= minK + ZOOM_LIMIT_EPSILON,
  };
}

/** The view after one zoom step (× factor) around the canvas centre. */
export function zoomStepView(view: CameraView, factor: number, minK: number, maxK: number): CameraView {
  return { x: view.x, y: view.y, k: clampZoom(view.k * factor, minK, maxK) };
}

/**
 * The view after an arrow-key pan. `dx`, `dy` are shares of the canvas (+x right, +y up,
 * the way the arrow points), converted to world units at the current zoom.
 */
export function panView(view: CameraView, dx: number, dy: number, canvasW: number, canvasH: number): CameraView {
  return { x: view.x + (dx * canvasW) / view.k, y: view.y + (dy * canvasH) / view.k, k: view.k };
}
