/**
 * THR-1901 — the minimap's geometry and its open/folded default (plan THR-1878 D10).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { hexToWorld } from '../../../../lib/worldPosition';
import { computeMinimapLayout, minimapToWorld, viewRectOnMinimap, worldToMinimap } from '../minimapGeometry';
import {
  MINIMAP_OPEN_STORAGE_KEY,
  minimapDefaultOpen,
  readStoredMinimapOpen,
  writeStoredMinimapOpen,
} from '../minimapState';

const HEX = 10;

describe('minimap geometry', () => {
  const layout = computeMinimapLayout(60, 40, HEX, 240, 180);

  it('fits the whole grid inside the panel with its aspect kept', () => {
    for (const [col, row] of [[0, 0], [59, 0], [0, 39], [59, 39], [30, 20]]) {
      const w = hexToWorld({ col, row }, HEX);
      const p = worldToMinimap(layout, w.x, w.y);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(240);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(180);
    }
    expect(layout.cellW / layout.cellH).toBeCloseTo(1.5 / Math.sqrt(3), 6);
  });

  it('a click maps back to the world point it shows', () => {
    const w = hexToWorld({ col: 17, row: 23 }, HEX);
    const p = worldToMinimap(layout, w.x, w.y);
    const back = minimapToWorld(layout, p.x, p.y);
    expect(back.x).toBeCloseTo(w.x, 6);
    expect(back.y).toBeCloseTo(w.y, 6);
  });

  it('the view rectangle is centred on the camera and shrinks as the camera zooms in', () => {
    const centre = hexToWorld({ col: 30, row: 20 }, HEX);
    const wide = viewRectOnMinimap(layout, { x: centre.x, y: centre.y, k: 2, w: 1260, h: 900 });
    const close = viewRectOnMinimap(layout, { x: centre.x, y: centre.y, k: 8, w: 1260, h: 900 });
    const c = worldToMinimap(layout, centre.x, centre.y);
    expect(wide.x + wide.w / 2).toBeCloseTo(c.x, 6);
    expect(wide.y + wide.h / 2).toBeCloseTo(c.y, 6);
    expect(close.w).toBeCloseTo(wide.w / 4, 6);
    expect(wide.w / wide.h).toBeCloseTo(1260 / 900, 6);
  });

  it('fails soft on an empty grid', () => {
    const empty = computeMinimapLayout(0, 0, HEX, 240, 180);
    expect(empty.scale).toBe(0);
    expect(minimapToWorld(empty, 10, 10)).toEqual({ x: 0, y: 0 });
  });
});

describe('minimap open state', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('falls back to the default when storage throws', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(readStoredMinimapOpen()).toBeNull();
    expect(() => writeStoredMinimapOpen(true)).not.toThrow();
  });

  it('opens by default on the 1440p canvas and folds on the 1080p one', () => {
    expect(minimapDefaultOpen(1740)).toBe(true);
    expect(minimapDefaultOpen(1260)).toBe(false);
    expect(minimapDefaultOpen(1400)).toBe(true);
  });

  it('keeps the player choice, and reads nothing before one is made', () => {
    expect(readStoredMinimapOpen()).toBeNull();
    writeStoredMinimapOpen(false);
    expect(readStoredMinimapOpen()).toBe(false);
    writeStoredMinimapOpen(true);
    expect(readStoredMinimapOpen()).toBe(true);
    expect(localStorage.getItem(MINIMAP_OPEN_STORAGE_KEY)).toBe('true');
  });
});
