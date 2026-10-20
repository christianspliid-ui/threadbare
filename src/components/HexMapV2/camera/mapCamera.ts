/**
 * mapCamera.ts — the map's camera commands behind one object (THR-1900, plan THR-1878 D6–D9).
 *
 * HexMapV2 owns one controller per mount and exposes its methods on the map handle, so every
 * "show me" (the control cluster, the map keys, the seat button, the eye icons, the Stage's
 * "Show on map", the Inspector's "Show on map") moves the camera the same way:
 *
 * - `focusOn(hex)` — centre at `FOCUS_ZOOM` (D7), eased.
 * - `zoomBy(factor)` — × factor around the canvas centre, eased, clamped to the camera's limits.
 * - `showKnownLand()` — fit the explored hexes (D8's `fitKnownLand`); the whole grid with fog off.
 * - `panBy(dx, dy)` — arrow keys, a share of the canvas.
 * - `applyOpening(first, seat)` — the opening view, applied with no animation (D8).
 * - `lookAt(point, animate)` — the minimap (THR-1901, D10): centre on a world point at the
 *   current zoom, eased on a click, at once while the view rectangle is dragged.
 *
 * Every programmatic jump emits `ui_map_camera_jump` (pans do not: they are a drag by keyboard).
 * `subscribe` lets the control cluster read the zoom without re-rendering the map host.
 *
 * NFP #4: every method is a no-op until d3-zoom is attached; nothing throws.
 */
import * as d3 from 'd3';
import type { HexCoord } from '../../../types';
import type { VisibilityMap } from '../../../types/visibility';
import type { MapCameraJumpReason } from '../../../types/traces/ui-traces';
import { emitTrace } from '../../../engine/traceBuffer';
import { hexKey } from '../../../lib/hexKey';
import { hexToWorld, worldToHex } from '../../../lib/worldPosition';
import { HEX_CONSTANTS } from '../scene/HexFillMesh';
import { CAMERA_CONSTANTS } from './D3ZoomCamera';
import { animateCameraTo } from './CameraAnimator';
import {
  clampZoom,
  computeOpeningView,
  fitKnownLand,
  gridView,
  panView,
  viewOfTransform,
  zoomStepView,
  type CameraView,
  type OpeningCentre,
} from './cameraFraming';

/** The camera's zoom and its limits, as the control cluster reads them. */
export interface MapCameraState {
  k: number;
  minK: number;
  maxK: number;
  /**
   * THR-1901 — the view now: the world point at the canvas centre (y-up) and the canvas
   * size in CSS px, so the minimap can draw the view rectangle (`w / k` world units wide).
   * Null until d3-zoom is attached.
   */
  viewport: MapViewport | null;
}

/** The camera's centre (world units, y-up), zoom and canvas size (CSS px). */
export interface MapViewport {
  x: number;
  y: number;
  k: number;
  w: number;
  h: number;
}

export interface MapCameraDeps {
  canvas: () => HTMLCanvasElement | null;
  zoom: () => d3.ZoomBehavior<HTMLCanvasElement, unknown> | null;
  visibilityMap: () => VisibilityMap | undefined;
  fogEnabled: () => boolean;
  /** The game tick, for traces. */
  tick: () => number;
  grid: () => { cols: number; rows: number };
}

export interface MapCamera {
  focusOn(hex: HexCoord, reason?: MapCameraJumpReason): void;
  /** False when the step would not move (already at the limit). */
  zoomBy(factor: number): boolean;
  showKnownLand(): void;
  panBy(dx: number, dy: number): void;
  /** THR-1901 — centre on a world point (y-up) at the current zoom; eased unless `animate` is false. */
  lookAt(point: { x: number; y: number }, animate: boolean): void;
  applyOpening(firstHex: HexCoord | null, seatHex: HexCoord | null): { k: number; centredOn: OpeningCentre } | null;
  getOpening(): { k: number; centredOn: OpeningCentre } | null;
  getState(): MapCameraState;
  /** Calls `listener` now and after every zoom event; returns the unsubscribe. */
  subscribe(listener: (state: MapCameraState) => void): () => void;
  /** HexMapV2 calls this from its zoom listener. */
  notify(): void;
}

/**
 * Register a d3-zoom listener that reports the zoom k, **seeded from the transform actually
 * applied** at the moment it registers (D8: the labels' zoom state used to start at
 * `DEFAULT_ZOOM` until the first zoom event, so the opening frame drew the wrong tier).
 */
export function onZoomK(
  zoom: d3.ZoomBehavior<HTMLCanvasElement, unknown>,
  canvas: HTMLCanvasElement,
  namespace: string,
  onK: (k: number) => void,
): void {
  zoom.on(`zoom.${namespace}`, (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => onK(event.transform.k));
  onK(d3.zoomTransform(canvas).k);
}

export function createMapCamera(deps: MapCameraDeps): MapCamera {
  const listeners = new Set<(state: MapCameraState) => void>();
  let opening: { k: number; centredOn: OpeningCentre } | null = null;

  function attached(): { canvas: HTMLCanvasElement; zoom: d3.ZoomBehavior<HTMLCanvasElement, unknown> } | null {
    const canvas = deps.canvas();
    const zoom = deps.zoom();
    return canvas && zoom ? { canvas, zoom } : null;
  }

  function limits(): [number, number] {
    const zoom = deps.zoom();
    if (!zoom) return [CAMERA_CONSTANTS.ABSOLUTE_MIN_ZOOM, CAMERA_CONSTANTS.MAX_ZOOM];
    const [minK, maxK] = zoom.scaleExtent();
    return [minK, maxK];
  }

  function getState(): MapCameraState {
    const canvas = deps.canvas();
    const [minK, maxK] = limits();
    if (!canvas || !deps.zoom()) return { k: CAMERA_CONSTANTS.DEFAULT_ZOOM, minK, maxK, viewport: null };
    const view = viewOfTransform(d3.zoomTransform(canvas));
    return {
      k: view.k,
      minK,
      maxK,
      viewport: { x: view.x, y: view.y, k: view.k, w: canvas.clientWidth, h: canvas.clientHeight },
    };
  }

  function trace(reason: MapCameraJumpReason, k: number, target: string | null): void {
    emitTrace({
      tick: deps.tick(),
      category: 'ui_map_camera_jump',
      reason,
      k,
      target,
      summary: `ui_map_camera_jump: ${reason} → k ${Math.round(k * 100) / 100}${target ? ` at ${target}` : ''}`,
    });
  }

  function centreKey(view: CameraView): string {
    const hex = worldToHex(view.x, view.y, HEX_CONSTANTS.HEX_SIZE);
    return hexKey(hex.col, hex.row);
  }

  function moveTo(view: CameraView, duration?: number): boolean {
    const a = attached();
    if (!a) return false;
    animateCameraTo(a.canvas, a.zoom, view.x, view.y, view.k, duration);
    return true;
  }

  return {
    focusOn(hex, reason = 'focus') {
      const [minK, maxK] = limits();
      const k = clampZoom(CAMERA_CONSTANTS.FOCUS_ZOOM, minK, maxK);
      const { x, y } = hexToWorld(hex, HEX_CONSTANTS.HEX_SIZE);
      if (moveTo({ x, y, k })) trace(reason, k, hexKey(hex.col, hex.row));
    },

    zoomBy(factor) {
      const a = attached();
      if (!a) return false;
      const [minK, maxK] = limits();
      const view = viewOfTransform(d3.zoomTransform(a.canvas));
      const next = zoomStepView(view, factor, minK, maxK);
      if (Math.abs(next.k - view.k) < 1e-9) return false;
      moveTo(next);
      trace('zoom_step', next.k, null);
      return true;
    },

    showKnownLand() {
      const a = attached();
      if (!a) return;
      const [minK, maxK] = limits();
      const { clientWidth: w, clientHeight: h } = a.canvas;
      const { cols, rows } = deps.grid();
      const view = (deps.fogEnabled() ? fitKnownLand(deps.visibilityMap(), w, h, minK, maxK) : null)
        ?? gridView(cols, rows, w, h, minK, maxK);
      moveTo(view);
      trace('known_land', view.k, centreKey(view));
    },

    panBy(dx, dy) {
      const a = attached();
      if (!a) return;
      const view = viewOfTransform(d3.zoomTransform(a.canvas));
      moveTo(panView(view, dx, dy, a.canvas.clientWidth, a.canvas.clientHeight), CAMERA_CONSTANTS.PAN_DURATION_MS);
    },

    lookAt(point, animate) {
      const a = attached();
      if (!a) return;
      const k = d3.zoomTransform(a.canvas).k;
      if (animate) {
        moveTo({ x: point.x, y: point.y, k });
        trace('minimap', k, centreKey({ x: point.x, y: point.y, k }));
        return;
      }
      // A drag: follow the pointer this frame, cutting any eased move still running.
      const sel = d3.select(a.canvas);
      sel.interrupt();
      sel.call(a.zoom.transform, d3.zoomIdentity.translate(-point.x * k, point.y * k).scale(k));
    },

    applyOpening(firstHex, seatHex) {
      const a = attached();
      if (!a) return null;
      const [minK, maxK] = limits();
      const { cols, rows } = deps.grid();
      const view = computeOpeningView({
        firstHex,
        seatHex,
        visibilityMap: deps.visibilityMap(),
        fogEnabled: deps.fogEnabled(),
        cols,
        rows,
        canvasW: a.canvas.clientWidth,
        canvasH: a.canvas.clientHeight,
        minK,
        maxK,
      });
      // No animation (D8): applied synchronously, so the first frame is the opening frame.
      d3.select(a.canvas).call(
        a.zoom.transform,
        d3.zoomIdentity.translate(-view.x * view.k, view.y * view.k).scale(view.k),
      );
      opening = { k: view.k, centredOn: view.centredOn };
      trace('opening', view.k, centreKey(view));
      return opening;
    },

    getOpening: () => opening,
    getState,

    subscribe(listener) {
      listeners.add(listener);
      listener(getState());
      return () => {
        listeners.delete(listener);
      };
    },

    notify() {
      if (listeners.size === 0) return;
      const state = getState();
      for (const listener of listeners) listener(state);
    },
  };
}
