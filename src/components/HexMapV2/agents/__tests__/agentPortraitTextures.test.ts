/**
 * agentPortraitTextures.test.ts — Unit tests for agent texture builders.
 *
 * Mocks canvas and THREE.CanvasTexture so tests run in jsdom without WebGL.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock Image (not available in jsdom without full browser context)
// Setting .src triggers onerror immediately — simulates a failed image load
vi.stubGlobal('Image', class {
  crossOrigin = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';

  get src() { return this._src; }
  set src(val: string) {
    this._src = val;
    // Immediately trigger error in test environment (no real network/image loading)
    if (this.onerror) {
      // Use microtask to allow the onload/onerror handlers to be assigned first
      Promise.resolve().then(() => { if (this.onerror) this.onerror(); });
    }
  }
});

// Mock document.createElement to return a minimal canvas stub
vi.stubGlobal('document', {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          save: vi.fn(),
          restore: vi.fn(),
          scale: vi.fn(),
          fill: vi.fn(),
          fillStyle: '',
          globalAlpha: 1,
          beginPath: vi.fn(),
          arc: vi.fn(),
          clip: vi.fn(),
          closePath: vi.fn(),
          drawImage: vi.fn(),
          stroke: vi.fn(),
          strokeStyle: '',
          lineWidth: 0,
        }),
      };
    }
    return null;
  },
});

// Mock THREE.CanvasTexture to avoid GPU operations
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three');
  class CanvasTextureMock {
    needsUpdate = false;
    isTexture = true;
    uuid = 'mock-uuid';
    constructor(_canvas: unknown) {}
    dispose() {}
  }
  return {
    ...actual,
    CanvasTexture: CanvasTextureMock,
  };
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('buildFactionDotTexture', () => {
  let buildFactionDotTexture: (factionColor: string, size?: number) => THREE.CanvasTexture;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../agentPortraitTextures');
    buildFactionDotTexture = mod.buildFactionDotTexture;
  });

  it('returns a valid object (CanvasTexture mock)', () => {
    const tex = buildFactionDotTexture('#e53e3e');
    expect(tex).toBeDefined();
    expect(tex).not.toBeNull();
  });

  it('sets needsUpdate = true on the returned texture', () => {
    const tex = buildFactionDotTexture('#3182ce');
    expect(tex.needsUpdate).toBe(true);
  });

  it('accepts an optional size parameter', () => {
    expect(() => buildFactionDotTexture('#805ad5', 128)).not.toThrow();
  });
});

describe('buildRetinueDotTexture', () => {
  let buildRetinueDotTexture: (factionColor: string, size?: number) => THREE.CanvasTexture;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../agentPortraitTextures');
    buildRetinueDotTexture = mod.buildRetinueDotTexture;
  });

  it('creates a gold-bordered dot texture (returns valid object)', () => {
    const tex = buildRetinueDotTexture('#e53e3e');
    expect(tex).toBeDefined();
    expect(tex).not.toBeNull();
  });

  it('sets needsUpdate = true', () => {
    const tex = buildRetinueDotTexture('#3182ce');
    expect(tex.needsUpdate).toBe(true);
  });
});

describe('buildFactionDotTextureCache', () => {
  let buildFactionDotTextureCache: (factionColors: string[]) => Map<number, THREE.CanvasTexture>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../agentPortraitTextures');
    buildFactionDotTextureCache = mod.buildFactionDotTextureCache;
  });

  it('returns a Map', () => {
    const colors = ['#e53e3e', '#3182ce', '#805ad5', '#d53f8c', '#00b5d8', '#dd6b20'];
    const cache = buildFactionDotTextureCache(colors);
    expect(cache).toBeInstanceOf(Map);
  });

  it('creates one texture per faction color', () => {
    const colors = ['#e53e3e', '#3182ce', '#805ad5', '#d53f8c', '#00b5d8', '#dd6b20'];
    const cache = buildFactionDotTextureCache(colors);
    expect(cache.size).toBe(6);
  });

  it('keys are faction indices 0-5', () => {
    const colors = ['#e53e3e', '#3182ce', '#805ad5', '#d53f8c', '#00b5d8', '#dd6b20'];
    const cache = buildFactionDotTextureCache(colors);
    for (let i = 0; i < 6; i++) {
      expect(cache.has(i)).toBe(true);
    }
  });
});

describe('loadPortraitTexture', () => {
  let loadPortraitTexture: (url: string, ringColor: string, isRetinue: boolean) => Promise<THREE.CanvasTexture>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../agentPortraitTextures');
    loadPortraitTexture = mod.loadPortraitTexture;
  });

  it('returns a Promise', () => {
    const result = loadPortraitTexture('/portraits/test.png', '#e53e3e', false);
    expect(result).toBeInstanceOf(Promise);
    // Prevent unhandled promise rejection
    result.catch(() => {});
  });

  it('falls back to dot texture on load error (fail-soft)', async () => {
    // Image loading will fail in jsdom — should resolve with a fallback texture
    const result = await loadPortraitTexture('/portraits/nonexistent.png', '#e53e3e', false);
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
  });
});
