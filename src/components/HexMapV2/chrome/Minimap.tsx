/**
 * Minimap — the whole world in small, above the map controls (THR-1901, plan THR-1878 D10;
 * THR-1831 § 2).
 *
 * - **Draws** (a 2D canvas at device pixel ratio, from `map.minimap`): each known hex in its
 *   terrain family's flat tone (the active palette's colour for the family's representative
 *   terrain), each uncharted in-grid hex in the map's own uncharted tone
 *   (`fogUnexploredFill.tint`), the First as a gold pip. **No lens**, ever.
 * - **The view** is an outlined rectangle on an SVG overlay, moved on every zoom event
 *   through the camera subscription, so a camera move never redraws the terrain.
 * - **Moving the view:** press outside the rectangle to centre the camera there (eased);
 *   press on the rectangle and drag to pan live.
 *
 * Fail-soft (NFP #4): an empty VM draws the frame in the uncharted tone; the rectangle
 * still draws once the camera reports a view.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { Panel } from '../../shared/Panel';
import { Tooltip } from '../../shared/Tooltip';
import { getUITooltip } from '../../../data/ui-content';
import { hexToWorld } from '../../../lib/worldPosition';
import { parseHexKey } from '../../../lib/hexKey';
import { HEX_CONSTANTS } from '../scene/HexFillMesh';
import { getActivePalette, onPaletteChange } from '../palette/activePalette';
import { resolveTerrainColorHex } from '../palette/colorUtils';
import {
  MINIMAP_FAMILY_REPRESENTATIVE,
  MINIMAP_UNCHARTED,
  type MinimapFamily,
  type MinimapVM,
} from '../../../engine/views/map/minimap';
import type { HexMapV2Handle } from '../HexMapV2';
import { computeMinimapLayout, minimapToWorld, viewRectOnMinimap, worldToMinimap, type MinimapLayout } from './minimapGeometry';
import { setMinimapViewRect } from './minimapState';

/** Minimap size (THR-1831 § 2). */
export const MINIMAP_W_PX = 240;
export const MINIMAP_H_PX = 180;
/** The First's gold pip, diameter in CSS px. */
export const MINIMAP_FIRST_PIP_PX = 6;
/** The view rectangle's outline width. */
const MINIMAP_VIEW_STROKE_PX = 1.5;
/** The First's pip — the gold of your own (Law 10). */
const MINIMAP_FIRST_PIP_TOKEN = '--accent-gold';
/** A dark ring round the pip so it reads on gold-ish land (desert, plains). */
const MINIMAP_FIRST_PIP_RING_TOKEN = '--bg-abyss';

/** A design token's value for the 2D canvas, which cannot read `var()` itself. */
function cssToken(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export interface MinimapProps {
  vm: MinimapVM;
  hexMapRef: RefObject<HexMapV2Handle>;
}

/** Each family's tone in the active palette (the minimap keeps no colour table). */
function familyTones(): Record<MinimapFamily, string> {
  const out = {} as Record<MinimapFamily, string>;
  for (const family of Object.keys(MINIMAP_FAMILY_REPRESENTATIVE) as MinimapFamily[]) {
    out[family] = resolveTerrainColorHex(MINIMAP_FAMILY_REPRESENTATIVE[family]);
  }
  return out;
}

function drawTerrain(canvas: HTMLCanvasElement, vm: MinimapVM, layout: MinimapLayout): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  canvas.width = Math.round(MINIMAP_W_PX * dpr);
  canvas.height = Math.round(MINIMAP_H_PX * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, MINIMAP_W_PX, MINIMAP_H_PX);

  const palette = getActivePalette();
  const uncharted = palette.fogUnexploredFill.tint;
  if (vm.cols === 0 || layout.scale === 0) {
    ctx.fillStyle = uncharted;
    ctx.fillRect(0, 0, MINIMAP_W_PX, MINIMAP_H_PX);
    return;
  }
  const tones = familyTones();
  // Cells overlap by a hair so no seam of the off-grid margin shows between them.
  const w = layout.cellW + 0.6;
  const h = layout.cellH + 0.6;
  for (let row = 0; row < vm.rows; row++) {
    for (let col = 0; col < vm.cols; col++) {
      const cell = vm.cells[row * vm.cols + col];
      if (cell === undefined) continue;
      const { x, y } = hexToWorld({ col, row }, HEX_CONSTANTS.HEX_SIZE);
      const p = worldToMinimap(layout, x, y);
      ctx.fillStyle = cell === MINIMAP_UNCHARTED ? uncharted : tones[cell];
      ctx.fillRect(p.x - w / 2, p.y - h / 2, w, h);
    }
  }

  if (vm.firstHex) {
    const { x, y } = hexToWorld(parseHexKey(vm.firstHex), HEX_CONSTANTS.HEX_SIZE);
    const p = worldToMinimap(layout, x, y);
    const r = MINIMAP_FIRST_PIP_PX / 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + 1, 0, Math.PI * 2);
    ctx.fillStyle = cssToken(MINIMAP_FIRST_PIP_RING_TOKEN, 'black');
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = cssToken(MINIMAP_FIRST_PIP_TOKEN, 'gold');
    ctx.fill();
  }
}

export const Minimap = memo(function Minimap({ vm, hexMapRef }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rectRef = useRef<SVGRectElement>(null);
  const viewRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragRef = useRef<{ pointerId: number; dx: number; dy: number } | null>(null);
  const [paletteId, setPaletteId] = useState(() => getActivePalette().id);

  const layout = useMemo(
    () => computeMinimapLayout(vm.cols, vm.rows, HEX_CONSTANTS.HEX_SIZE, MINIMAP_W_PX, MINIMAP_H_PX),
    [vm.cols, vm.rows],
  );

  useEffect(() => onPaletteChange(theme => setPaletteId(theme.id)), []);

  useEffect(() => {
    if (canvasRef.current) drawTerrain(canvasRef.current, vm, layout);
  }, [vm, layout, paletteId]);

  // The view rectangle follows the camera without re-rendering this component.
  useEffect(() => {
    const handle = hexMapRef.current;
    if (!handle) return;
    const unsubscribe = handle.subscribeCamera(({ viewport }) => {
      const el = rectRef.current;
      if (!viewport || !el || layout.scale === 0) return;
      const r = viewRectOnMinimap(layout, viewport);
      viewRectRef.current = r;
      setMinimapViewRect({ x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.w * 10) / 10, h: Math.round(r.h * 10) / 10 });
      el.setAttribute('x', String(r.x));
      el.setAttribute('y', String(r.y));
      el.setAttribute('width', String(Math.max(2, r.w)));
      el.setAttribute('height', String(Math.max(2, r.h)));
      el.style.visibility = 'visible';
    });
    return () => {
      unsubscribe();
      setMinimapViewRect(null);
    };
  }, [hexMapRef, layout]);

  const localPoint = (e: ReactPointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const map = hexMapRef.current;
    if (!map || layout.scale === 0) return;
    e.preventDefault();
    const p = localPoint(e);
    const r = viewRectRef.current;
    if (r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
      // On the rectangle: drag it, keeping the grab point under the pointer.
      dragRef.current = { pointerId: e.pointerId, dx: r.x + r.w / 2 - p.x, dy: r.y + r.h / 2 - p.y };
      e.currentTarget.setPointerCapture?.(e.pointerId);
      return;
    }
    map.lookAt(minimapToWorld(layout, p.x, p.y), true);
  }, [hexMapRef, layout]);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const p = localPoint(e);
    hexMapRef.current?.lookAt(minimapToWorld(layout, p.x + drag.dx, p.y + drag.dy), false);
  }, [hexMapRef, layout]);

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const tip = getUITooltip('ui.map.minimap');

  return (
    <Tooltip id="ui.map.minimap" label={tip?.label ?? 'Minimap'} desc={tip?.desc} focusable={false} fit>
      <Panel
        level="panel"
        material="glass"
        floating
        data-testid="map-minimap"
        aria-label="Minimap"
        role="img"
        style={{
          width: MINIMAP_W_PX,
          height: MINIMAP_H_PX,
          padding: 0,
          overflow: 'hidden',
          pointerEvents: 'auto',
          backgroundColor: 'var(--bg-abyss)',
        }}
      >
        <div
          data-testid="map-minimap-surface"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{ position: 'relative', width: MINIMAP_W_PX, height: MINIMAP_H_PX, cursor: 'pointer', touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            data-testid="map-minimap-canvas"
            style={{ position: 'absolute', inset: 0, width: MINIMAP_W_PX, height: MINIMAP_H_PX, display: 'block' }}
          />
          <svg
            width={MINIMAP_W_PX}
            height={MINIMAP_H_PX}
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
          >
            <rect
              ref={rectRef}
              data-testid="map-minimap-view"
              fill="none"
              stroke="var(--text-primary)"
              strokeWidth={MINIMAP_VIEW_STROKE_PX}
              style={{ visibility: 'hidden', cursor: 'grab' }}
            />
          </svg>
        </div>
      </Panel>
    </Tooltip>
  );
});
