/**
 * minimapState — whether the minimap is open, and what `__DEBUG.getMapChrome().minimap`
 * reports (THR-1901, plan THR-1878 D10; THR-1831 § 2).
 *
 * - **Default:** open when the map canvas is at least `MINIMAP_AUTO_OPEN_MIN_CANVAS_PX`
 *   wide at first mount (open at 2560×1440, folded into the fifth control button at
 *   1920×1080). It never auto-folds afterwards (a docked Inspector still leaves room).
 * - **The player's choice wins:** once toggled, kept in `localStorage`
 *   (`MINIMAP_OPEN_STORAGE_KEY`), read and written inside try/catch (fail-soft: a blocked
 *   store falls back to the canvas-width default).
 *
 * The status record is debug read-out only (like the place-icon fallbacks list); nothing
 * in play reads it.
 */
import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { HexMapV2Handle } from '../HexMapV2';

/** Open by default at this canvas width and wider (THR-1819: 1740 px at 1440p, 1260 px at 1080p). */
export const MINIMAP_AUTO_OPEN_MIN_CANVAS_PX = 1400;
/** Where the player's open/folded choice is kept. */
export const MINIMAP_OPEN_STORAGE_KEY = 'tb.map.minimapOpen';

export type MinimapOpenSource = 'default' | 'player';

export interface MinimapStatus {
  open: boolean;
  source: MinimapOpenSource;
  /** The view rectangle in minimap px, or null while folded or before the camera is set up. */
  viewRect: { x: number; y: number; w: number; h: number } | null;
}

let status: MinimapStatus = { open: false, source: 'default', viewRect: null };

/** `__DEBUG.getMapChrome().minimap`. */
export function getMinimapStatus(): MinimapStatus {
  return { ...status, viewRect: status.viewRect ? { ...status.viewRect } : null };
}

export function setMinimapViewRect(rect: MinimapStatus['viewRect']): void {
  status = { ...status, viewRect: rect };
}

/** The player's kept choice, or null (none yet, or storage unavailable). */
export function readStoredMinimapOpen(): boolean | null {
  try {
    const raw = globalThis.localStorage?.getItem(MINIMAP_OPEN_STORAGE_KEY);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

export function writeStoredMinimapOpen(open: boolean): void {
  try {
    globalThis.localStorage?.setItem(MINIMAP_OPEN_STORAGE_KEY, String(open));
  } catch {
    // Storage blocked: the choice lasts this session only.
  }
}

/** The default for a canvas this wide. */
export function minimapDefaultOpen(canvasWidthPx: number): boolean {
  return canvasWidthPx >= MINIMAP_AUTO_OPEN_MIN_CANVAS_PX;
}

/**
 * Open state for the map's minimap. Until the player has chosen, the default is decided once,
 * from the canvas width the camera first reports.
 */
export function useMinimapOpen(hexMapRef: RefObject<HexMapV2Handle>): { open: boolean; toggle: () => void } {
  const [stored] = useState(readStoredMinimapOpen);
  const [open, setOpen] = useState<boolean>(stored ?? false);
  const [source, setSource] = useState<MinimapOpenSource>(stored === null ? 'default' : 'player');

  useEffect(() => {
    if (source === 'player') return;
    const handle = hexMapRef.current;
    if (!handle) return;
    let decided = false;
    let unsubscribe: (() => void) | null = null;
    unsubscribe = handle.subscribeCamera(({ viewport }) => {
      if (decided || !viewport || viewport.w <= 0) return;
      decided = true;
      setOpen(minimapDefaultOpen(viewport.w));
      unsubscribe?.();
    });
    if (decided) unsubscribe();
    return () => unsubscribe?.();
    // Decided once per mount; the player's toggle ends the default for good.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hexMapRef]);

  useEffect(() => {
    status = { ...status, open, source, viewRect: open ? status.viewRect : null };
  }, [open, source]);

  const toggle = useCallback(() => {
    setOpen(prev => {
      const next = !prev;
      writeStoredMinimapOpen(next);
      return next;
    });
    setSource('player');
  }, []);

  return { open, toggle };
}
