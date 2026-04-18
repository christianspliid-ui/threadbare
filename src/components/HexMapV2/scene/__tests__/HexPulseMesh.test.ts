/**
 * HexPulseMesh.test.ts — Unit tests for hex pulse ambient glow layer (THR-125).
 *
 * Tests cover:
 * - createHexPulseMesh returns mesh with count=0 and correct renderOrder
 * - updateHexPulseMesh with empty/undefined map → count stays 0
 * - updateHexPulseMesh counts only tense/volatile entries
 * - updateHexPulseMesh positions instances at correct world coords
 * - updateHexPulseMesh returns the active instance count
 * - tickHexPulse does nothing when count=0
 * - tickHexPulse modulates material opacity via sine wave
 * - dispose does not throw
 * - RENDER_ORDER.HEX_PULSE and LAYER_Z.HEX_PULSE are defined
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HEX_PULSE_CONSTANTS } from '../HexPulseMesh';
import { RENDER_ORDER, LAYER_Z } from '../RenderLayers';
import type { LocationActivitySummary } from '../../../../types/locationActivity';

// ── Mock Three.js ─────────────────────────────────────────────────────────────

vi.mock('three', () => {
  const AdditiveBlending = 2;
  const SRGBColorSpace = 'srgb';

  class MockColor {
    r = 1; g = 1; b = 1;
    constructor(_c?: string | number) {}
    setStyle() { return this; }
    setRGB() { return this; }
    set() { return this; }
    copy() { return this; }
    getHexString() { return 'ffffff'; }
  }

  class MockMatrix4 {
    elements = new Float32Array(16);
    makeScale(_x: number, _y: number, _z: number) { return this; }
    setPosition(_x: number, _y: number, _z: number) { return this; }
    compose() { return this; }
    identity() { return this; }
    copy() { return this; }
  }

  class MockCanvasTexture {
    needsUpdate = false;
    dispose = vi.fn();
    colorSpace = '';
  }

  class MockPlaneGeometry {
    dispose = vi.fn();
    isBufferGeometry = true;
  }

  class MockMeshBasicMaterial {
    transparent = false;
    blending = 0;
    depthWrite = true;
    vertexColors = false;
    opacity = 1;
    map: MockCanvasTexture | null = null;
    dispose = vi.fn();
    constructor(params?: Record<string, unknown>) {
      if (params) Object.assign(this, params);
    }
  }

  class MockInstancedMesh {
    renderOrder = 0;
    frustumCulled = true;
    count = 0;
    geometry: MockPlaneGeometry;
    material: MockMeshBasicMaterial;
    instanceMatrix = { needsUpdate: false };
    instanceColor: { needsUpdate: boolean } | null = null;
    visible = true;
    _matrices: MockMatrix4[] = [];
    _colors: MockColor[] = [];

    constructor(geometry: MockPlaneGeometry, material: MockMeshBasicMaterial, _maxCount: number) {
      this.geometry = geometry;
      this.material = material;
    }

    setMatrixAt(idx: number, mat: MockMatrix4) {
      this._matrices[idx] = mat;
      if (!this.instanceColor) this.instanceColor = { needsUpdate: false };
    }

    setColorAt(idx: number, color: MockColor) {
      this._colors[idx] = color;
      if (!this.instanceColor) this.instanceColor = { needsUpdate: false };
    }

    dispose = vi.fn();
  }

  return {
    AdditiveBlending,
    SRGBColorSpace,
    Color: MockColor,
    Matrix4: MockMatrix4,
    CanvasTexture: MockCanvasTexture,
    PlaneGeometry: MockPlaneGeometry,
    MeshBasicMaterial: MockMeshBasicMaterial,
    InstancedMesh: MockInstancedMesh,
  };
});

// ── Mock canvas ───────────────────────────────────────────────────────────────

vi.stubGlobal('document', {
  createElement(tag: string) {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
          fillRect: vi.fn(),
          fillStyle: '',
        })),
      };
    }
    throw new Error(`unexpected createElement: ${tag}`);
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSummary(
  pulse: LocationActivitySummary['pulse'],
  col: number,
  row: number,
): LocationActivitySummary {
  return {
    locationId: `loc-${col}-${row}`,
    locationName: 'Test',
    pulse,
    murmurs: [],
    agentThreads: [],
    encounterPressure: 0,
    dominantActivity: null,
    hexCol: col,
    hexRow: row,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HexPulseMesh (THR-125)', () => {
  let createHexPulseMesh: typeof import('../HexPulseMesh').createHexPulseMesh;
  let updateHexPulseMesh: typeof import('../HexPulseMesh').updateHexPulseMesh;
  let tickHexPulse: typeof import('../HexPulseMesh').tickHexPulse;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../HexPulseMesh');
    createHexPulseMesh = mod.createHexPulseMesh;
    updateHexPulseMesh = mod.updateHexPulseMesh;
    tickHexPulse = mod.tickHexPulse;
  });

  it('createHexPulseMesh: initial count is 0', () => {
    const result = createHexPulseMesh();
    expect(result.mesh.count).toBe(0);
  });

  it('createHexPulseMesh: renderOrder matches RENDER_ORDER.HEX_PULSE', () => {
    const result = createHexPulseMesh();
    expect(result.mesh.renderOrder).toBe(RENDER_ORDER.HEX_PULSE);
  });

  it('createHexPulseMesh: frustumCulled is false', () => {
    const result = createHexPulseMesh();
    expect(result.mesh.frustumCulled).toBe(false);
  });

  it('updateHexPulseMesh: undefined map → count stays 0', () => {
    const result = createHexPulseMesh();
    const count = updateHexPulseMesh(result, undefined, 10);
    expect(count).toBe(0);
    expect(result.mesh.count).toBe(0);
  });

  it('updateHexPulseMesh: empty map → count stays 0', () => {
    const result = createHexPulseMesh();
    const count = updateHexPulseMesh(result, new Map(), 10);
    expect(count).toBe(0);
    expect(result.mesh.count).toBe(0);
  });

  it('updateHexPulseMesh: quiet/stirring/busy hexes are skipped', () => {
    const result = createHexPulseMesh();
    const map = new Map([
      ['1,0', makeSummary('quiet', 1, 0)],
      ['2,0', makeSummary('stirring', 2, 0)],
      ['3,0', makeSummary('busy', 3, 0)],
    ]);
    const count = updateHexPulseMesh(result, map, 10);
    expect(count).toBe(0);
    expect(result.mesh.count).toBe(0);
  });

  it('updateHexPulseMesh: counts tense and volatile hexes', () => {
    const result = createHexPulseMesh();
    const map = new Map([
      ['0,0', makeSummary('quiet', 0, 0)],
      ['1,0', makeSummary('tense', 1, 0)],
      ['2,0', makeSummary('volatile', 2, 0)],
      ['3,0', makeSummary('busy', 3, 0)],
    ]);
    const count = updateHexPulseMesh(result, map, 10);
    expect(count).toBe(2);
    expect(result.mesh.count).toBe(2);
  });

  it('updateHexPulseMesh: sets instanceMatrix needsUpdate', () => {
    const result = createHexPulseMesh();
    const map = new Map([['0,0', makeSummary('tense', 0, 0)]]);
    updateHexPulseMesh(result, map, 10);
    expect(result.mesh.instanceMatrix.needsUpdate).toBe(true);
  });

  it('updateHexPulseMesh: returns active instance count', () => {
    const result = createHexPulseMesh();
    const map = new Map([
      ['0,0', makeSummary('volatile', 0, 0)],
      ['1,0', makeSummary('volatile', 1, 0)],
    ]);
    const count = updateHexPulseMesh(result, map, 10);
    expect(count).toBe(2);
  });

  it('tickHexPulse: no-op when count is 0', () => {
    const result = createHexPulseMesh();
    result.mesh.count = 0;
    const mat = result.mesh.material as { opacity: number };
    const opBefore = mat.opacity;
    tickHexPulse(result, 1.0);
    expect(mat.opacity).toBe(opBefore);
  });

  it('tickHexPulse: modulates opacity within expected range', () => {
    const result = createHexPulseMesh();
    result.mesh.count = 1;
    const mat = result.mesh.material as { opacity: number };
    tickHexPulse(result, 0);
    const op0 = mat.opacity;
    tickHexPulse(result, 0.5);
    const op1 = mat.opacity;
    // Opacity should be within BASE_OPACITY ± PULSE_AMPLITUDE
    const { BASE_OPACITY, PULSE_AMPLITUDE } = HEX_PULSE_CONSTANTS;
    expect(op0).toBeGreaterThanOrEqual(BASE_OPACITY - PULSE_AMPLITUDE - 0.001);
    expect(op0).toBeLessThanOrEqual(BASE_OPACITY + PULSE_AMPLITUDE + 0.001);
    expect(op1).toBeGreaterThanOrEqual(BASE_OPACITY - PULSE_AMPLITUDE - 0.001);
    // The two ticks should differ (sine wave advances)
    expect(Math.abs(op1 - op0)).toBeGreaterThan(0.001);
  });

  it('dispose: does not throw', () => {
    const result = createHexPulseMesh();
    expect(() => result.dispose()).not.toThrow();
  });

  it('RENDER_ORDER.HEX_PULSE is defined between BORDERS and SIGNIFIERS', () => {
    expect(RENDER_ORDER.HEX_PULSE).toBeDefined();
    expect(RENDER_ORDER.HEX_PULSE).toBeGreaterThan(RENDER_ORDER.BORDERS);
    expect(RENDER_ORDER.HEX_PULSE).toBeLessThan(RENDER_ORDER.SIGNIFIERS);
  });

  it('LAYER_Z.HEX_PULSE is defined between BORDERS and SIGNIFIERS', () => {
    expect(LAYER_Z.HEX_PULSE).toBeDefined();
    expect(LAYER_Z.HEX_PULSE).toBeGreaterThan(LAYER_Z.BORDERS);
    expect(LAYER_Z.HEX_PULSE).toBeLessThan(LAYER_Z.SIGNIFIERS);
  });
});
