/**
 * portraitCompositor.test.ts — Unit tests for canvas portrait compositor.
 *
 * Mocks Image and document.createElement to run in Node/jsdom without a browser.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  composePortrait,
  composePortraitCircular,
  createPortraitCache,
  PORTRAIT_FULL_WIDTH,
  PORTRAIT_FULL_HEIGHT,
} from '../portraitCompositor';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockCtx = {
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  clip: vi.fn(),
  drawImage: vi.fn(),
  closePath: vi.fn(),
  canvas: { width: 512, height: 640, toDataURL: () => 'data:image/png;base64,mock' },
};

const mockCanvas = {
  width: 512,
  height: 640,
  getContext: () => mockCtx,
  toDataURL: () => 'data:image/png;base64,mock',
};

vi.stubGlobal('document', {
  createElement: (_tag: string) => ({ ...mockCanvas, getContext: () => mockCtx }),
});

// Mock Image: src setter triggers onload asynchronously (simulates successful load)
vi.stubGlobal('Image', class {
  width = 512;
  height = 640;
  crossOrigin = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';

  get src() { return this._src; }
  set src(val: string) {
    this._src = val;
    // Trigger onload via microtask — allows handlers to be assigned first
    Promise.resolve().then(() => { if (this.onload) this.onload(); });
  }
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('portraitCompositor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constants', () => {
    it('exports default dimensions', () => {
      expect(PORTRAIT_FULL_WIDTH).toBe(512);
      expect(PORTRAIT_FULL_HEIGHT).toBe(640);
    });
  });

  describe('createPortraitCache', () => {
    it('returns an object with get and clear methods', () => {
      const cache = createPortraitCache();
      expect(typeof cache.getComposed).toBe('function');
      expect(typeof cache.getCircular).toBe('function');
      expect(typeof cache.clear).toBe('function');
    });

    it('clear empties the cache without error', () => {
      const cache = createPortraitCache();
      cache.clear();
    });

    it('getComposed returns a promise', () => {
      const cache = createPortraitCache();
      const result = cache.getComposed('origin.ancient-scholar', 'mind');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {});
    });

    it('getCircular returns a promise', () => {
      const cache = createPortraitCache();
      const result = cache.getCircular('origin.ancient-scholar', 'mind');
      expect(result).toBeInstanceOf(Promise);
      result.catch(() => {});
    });

    it('returns the same promise result on repeated calls (cache hit)', async () => {
      const cache = createPortraitCache();
      const result1 = await cache.getComposed('origin.ancient-scholar', 'spirit');
      const result2 = await cache.getComposed('origin.ancient-scholar', 'spirit');
      // Both calls should resolve to the same cached canvas instance
      expect(result1).toBe(result2);
    });

    it('clear allows fresh composition after clearing', async () => {
      const cache = createPortraitCache();
      const result1 = await cache.getComposed('origin.ancient-scholar', 'force');
      cache.clear();
      const result2 = await cache.getComposed('origin.ancient-scholar', 'force');
      // After clear, a new canvas is created — should NOT be the same reference
      expect(result1).not.toBe(result2);
    });
  });

  describe('composePortrait', () => {
    it('returns an HTMLCanvasElement (mock) on success', async () => {
      const result = await composePortrait('origin.ancient-scholar', 'mind');
      expect(result).not.toBeNull();
      expect(result).toBeDefined();
    });

    it('calls drawImage twice (portrait layer + frame layer)', async () => {
      vi.clearAllMocks();
      await composePortrait('origin.ancient-scholar', 'mind');
      expect(mockCtx.drawImage).toHaveBeenCalledTimes(2);
    });

    it('accepts custom width and height', async () => {
      const result = await composePortrait('origin.ancient-scholar', 'energy', 256, 320);
      expect(result).not.toBeNull();
    });

    it('works with all sphere types', async () => {
      const spheres = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'] as const;
      for (const sphere of spheres) {
        const result = await composePortrait('origin.ancient-scholar', sphere);
        expect(result).not.toBeNull();
      }
    });
  });

  describe('composePortraitCircular', () => {
    it('returns an HTMLCanvasElement (mock) on success', async () => {
      const result = await composePortraitCircular('origin.ancient-scholar', 'mind');
      expect(result).not.toBeNull();
      expect(result).toBeDefined();
    });

    it('uses arc + clip for circular masking', async () => {
      vi.clearAllMocks();
      await composePortraitCircular('origin.ancient-scholar', 'mind');
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.clip).toHaveBeenCalled();
    });

    it('accepts custom diameter', async () => {
      const result = await composePortraitCircular('origin.ancient-scholar', 'life', 64);
      expect(result).not.toBeNull();
    });
  });
});
