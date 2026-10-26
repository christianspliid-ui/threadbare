/**
 * useStageCamera — the map side of the Stage (THR-1892, plan THR-1877 § D5, § D6, § D9).
 *
 * `GameMap` runs this; the Stage never holds a map handle. When the Stage posts its focus
 * (`GameScreenState.stage.focus`, after the rails settle and the window is measured), the
 * map dims every hex but the lit one, rings the lit hex, and the camera eases the frame
 * into the window's centre — or cuts under reduced motion. The camera's result
 * (`cameraSettled`, its mode and zoom, the lit hex on screen) is written back, and the
 * panel enters on it.
 *
 * When the Stage closes the dim goes and **the camera never goes back** to where it was
 * before (THR-1829 § 5). But the window sat at the map's right edge, so a place left where
 * the Stage put it drifts the map to that edge, chapter after chapter (THR-2056, cold
 * playtest round 5). A place outside the visible map's middle third
 * (`STAGE_CLOSE_CENTRE_BAND_FRACTION`) is eased to the visible map's centre; one inside
 * it stays. The visible map is the canvas after the rails settle, so a docked Inspector
 * (a flex sibling) is already outside it.
 */
import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { HexMapV2Handle } from '../../HexMapV2/HexMapV2';
import { chooseStageFrame, chooseStageZoom, hexScreenWidth, recentreOnClose } from '../../HexMapV2/camera/stageCamera';
import { hexToWorld } from '../../../lib/worldPosition';
import { HEX_CONSTANTS } from '../../HexMapV2/scene/HexFillMesh';
import { STAGE_CLOSE_CENTRE_BAND_FRACTION, STAGE_DIM_FADE_MS, STAGE_LAYOUT_SETTLE_FRAMES } from '../../../data/stage-content';
import { isStageOpen, type StageCameraMode, type StageScreenState } from './stageState';

function parseKey(key: string | undefined): { col: number; row: number } | null {
  if (!key) return null;
  const [col, row] = key.split(',').map(Number);
  return Number.isFinite(col) && Number.isFinite(row) ? { col, row } : null;
}

export function useStageCamera(
  hexMapRef: RefObject<HexMapV2Handle>,
  stage: StageScreenState,
  setStage: Dispatch<SetStateAction<StageScreenState>>,
): void {
  const lastLit = useRef<{ key: string; instant: boolean } | null>(null);
  const focus = stage.focus;

  // ── The focus: dim, ring, camera; then report where it landed. ──
  useEffect(() => {
    if (!focus) return;
    const map = hexMapRef.current;
    // No map (another view level, WebGL lost): the Stage's timeout lets the panel in.
    if (!map) return;
    let cancelled = false;
    map.setStageFocus({ lit: focus.lit, options: focus.options, strength: focus.strength }, { fadeMs: focus.instant ? 0 : STAGE_DIM_FADE_MS });
    lastLit.current = focus.lit[0] ? { key: focus.lit[0], instant: focus.instant } : null;

    const settle = (mode: StageCameraMode) => {
      if (cancelled) return;
      const k = map.getCameraState().k;
      const at = parseKey(focus.lit[0]);
      const vp = at ? map.getViewportForHex(at.col, at.row) : null;
      setStage(prev => (prev.focus !== focus ? prev : {
        ...prev,
        cameraSettled: true,
        cameraMode: mode,
        cameraK: k,
        litHexScreen: vp ? { x: vp.x, y: vp.y, size: hexScreenWidth(k) } : null,
      }));
    };

    const w = focus.windowRect;
    if (focus.frame.length === 0 || w.w <= 0 || w.h <= 0) {
      settle('stayed');
      return () => { cancelled = true; };
    }
    const { k, minK, maxK } = map.getCameraState();
    // THR-1897 — a premonition frames its options too, when they all fit at k ≥ 5.
    const points = focus.frame.map(parseKey).filter((h): h is { col: number; row: number } => h !== null)
      .map(h => hexToWorld(h, HEX_CONSTANTS.HEX_SIZE));
    const fit = chooseStageFrame(points, chooseStageZoom(k, w.w, minK, maxK), { w: w.w, h: w.h }, minK);
    const frame = focus.frame.slice(0, Math.max(1, fit.framed));
    map.centerHexesAt(frame, { x: w.x + w.w / 2, y: w.y + w.h / 2 }, { zoom: fit.zoom, instant: focus.instant })
      .then(settle, () => settle('timed_out'));
    return () => { cancelled = true; };
  }, [focus, hexMapRef, setStage]);

  // ── THR-1897: the premonition option hovered or focused shows its ring. ──
  const hoveredOption = stage.hoveredOption;
  useEffect(() => {
    if (!focus) return;
    hexMapRef.current?.setStageOptionHover(hoveredOption);
  }, [focus, hoveredOption, hexMapRef]);

  // ── Close: the dim goes; a place outside the middle third is re-centred (THR-2056). ──
  const open = isStageOpen(stage);
  useEffect(() => {
    if (open) return;
    const map = hexMapRef.current;
    if (!map) return;
    map.setStageFocus(null);
    map.setStageOptionHover(null);
    const last = lastLit.current;
    lastLit.current = null;
    const at = parseKey(last?.key);
    if (!at || !last) return;
    let frames = STAGE_LAYOUT_SETTLE_FRAMES;
    let id = 0;
    const step = () => {
      if (--frames > 0) {
        id = requestAnimationFrame(step);
        return;
      }
      const rect = map.getCanvasRect();
      if (!rect) return;
      // Projected whether or not it is on the canvas: the returning rail may have covered it.
      const vp = map.projectHex(at.col, at.row);
      if (!vp) return;
      const target = recentreOnClose(vp, rect, STAGE_CLOSE_CENTRE_BAND_FRACTION);
      setStage(prev => (isStageOpen(prev) ? prev : { ...prev, closeCamera: { hex: last.key, recentred: target !== null } }));
      if (!target) return;
      void map.centerHexesAt([last.key], target, { zoom: map.getCameraState().k, instant: last.instant });
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [open, hexMapRef, setStage]);
}
