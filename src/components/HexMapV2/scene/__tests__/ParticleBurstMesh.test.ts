/**
 * ParticleBurstMesh.test.ts — Unit tests for particle burst effect.
 *
 * Tests cover:
 * - PARTICLE_CONSTANTS exports expected values (COUNT=16, LIFETIME_MS=800)
 * - spawnParticleBurst returns an ActiveBurst with points, startMs, directions, cx, cy
 * - spawnParticleBurst adds the points object to the scene
 * - spawnParticleBurst sets particle count to PARTICLE_CONSTANTS.COUNT
 * - directions Float32Array has COUNT*2 entries
 * - tickParticleBursts with elapsed > LIFETIME_MS removes burst and returns empty array
 * - tickParticleBursts with elapsed < LIFETIME_MS returns surviving burst with updated opacity
 * - tickParticleBursts updates particle positions (needsUpdate set)
 * - LAYER_Z.PARTICLE_BURST = 6.060 in RenderLayers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PARTICLE_CONSTANTS } from '../ParticleBurstMesh';
import { LAYER_Z } from '../RenderLayers';

// ── Mock Three.js ─────────────────────────────────────────────────────────────
// All class definitions inside the factory to avoid hoisting issues.
vi.mock('three', () => {
  class MockBufferAttribute {
    array: Float32Array;
    itemSize: number;
    needsUpdate = false;
    constructor(array: Float32Array, itemSize: number) {
      this.array = array;
      this.itemSize = itemSize;
    }
  }

  class MockBufferGeometry {
    attributes: Record<string, MockBufferAttribute> = {};
    dispose = vi.fn();
    setAttribute(name: string, attr: MockBufferAttribute) {
      this.attributes[name] = attr;
      return this;
    }
    getAttribute(name: string) {
      return this.attributes[name] ?? null;
    }
  }

  class MockColor {
    r: number; g: number; b: number;
    constructor(_color?: string) { this.r = 1; this.g = 1; this.b = 1; }
  }

  class MockPointsMaterial {
    color: MockColor;
    size: number;
    sizeAttenuation: boolean;
    transparent: boolean;
    opacity: number;
    blending: unknown;
    depthWrite: boolean;
    dispose = vi.fn();
    constructor(params: {
      color?: MockColor; size?: number; sizeAttenuation?: boolean;
      transparent?: boolean; opacity?: number; blending?: unknown; depthWrite?: boolean;
    } = {}) {
      this.color = params.color ?? new MockColor();
      this.size = params.size ?? 1;
      this.sizeAttenuation = params.sizeAttenuation ?? true;
      this.transparent = params.transparent ?? false;
      this.opacity = params.opacity ?? 1;
      this.blending = params.blending;
      this.depthWrite = params.depthWrite ?? true;
    }
  }

  class MockPoints {
    geometry: MockBufferGeometry;
    material: MockPointsMaterial;
    constructor(geometry: MockBufferGeometry, material: MockPointsMaterial) {
      this.geometry = geometry;
      this.material = material;
    }
  }

  class MockScene {
    children: unknown[] = [];
    add = vi.fn((obj: unknown) => { this.children.push(obj); });
    remove = vi.fn((obj: unknown) => {
      const idx = this.children.indexOf(obj);
      if (idx >= 0) this.children.splice(idx, 1);
    });
  }

  return {
    BufferGeometry: MockBufferGeometry,
    BufferAttribute: MockBufferAttribute,
    Float32BufferAttribute: MockBufferAttribute,
    Color: MockColor,
    PointsMaterial: MockPointsMaterial,
    Points: MockPoints,
    Scene: MockScene,
    AdditiveBlending: 2,
  };
});

// ── Mock worldPosition ────────────────────────────────────────────────────────
vi.mock('../../../../lib/worldPosition', () => ({
  hexToWorld: vi.fn(({ col, row }: { col: number; row: number }) => ({
    x: col * 10,
    y: row * 10,
  })),
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import * as THREE from 'three';
import { spawnParticleBurst, tickParticleBursts } from '../ParticleBurstMesh';

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeScene() {
  return new (THREE as unknown as { Scene: new () => { add: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn>; children: unknown[] } }).Scene();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PARTICLE_CONSTANTS', () => {
  it('COUNT equals 16', () => {
    expect(PARTICLE_CONSTANTS.COUNT).toBe(16);
  });

  it('LIFETIME_MS equals 800', () => {
    expect(PARTICLE_CONSTANTS.LIFETIME_MS).toBe(800);
  });

  it('EXPAND_RADIUS is positive', () => {
    expect(PARTICLE_CONSTANTS.EXPAND_RADIUS).toBeGreaterThan(0);
  });

  it('SPAWN_OPACITY is between 0 and 1', () => {
    expect(PARTICLE_CONSTANTS.SPAWN_OPACITY).toBeGreaterThan(0);
    expect(PARTICLE_CONSTANTS.SPAWN_OPACITY).toBeLessThanOrEqual(1);
  });
});

describe('LAYER_Z.PARTICLE_BURST', () => {
  it('equals 6.060', () => {
    expect(LAYER_Z.PARTICLE_BURST).toBe(6.060);
  });

  it('is between ARMIES and BATTLE_INDICATORS', () => {
    // PARTICLE_BURST = 6.060 sits between ARMIES (6.050) and BATTLE_INDICATORS (6.080)
    expect(LAYER_Z.PARTICLE_BURST).toBeGreaterThan(LAYER_Z.ARMIES);
    expect(LAYER_Z.PARTICLE_BURST).toBeLessThan(LAYER_Z.BATTLE_INDICATORS);
  });
});

describe('spawnParticleBurst', () => {
  let scene: ReturnType<typeof makeScene>;

  beforeEach(() => {
    scene = makeScene();
  });

  it('returns an ActiveBurst with expected shape', () => {
    const burst = spawnParticleBurst(scene as unknown as import('three').Scene, 3, 5, 10, '#7b5ea7', 1000);
    expect(burst).toBeDefined();
    expect(burst.points).toBeDefined();
    expect(burst.startMs).toBe(1000);
    expect(burst.directions).toBeInstanceOf(Float32Array);
    expect(typeof burst.cx).toBe('number');
    expect(typeof burst.cy).toBe('number');
  });

  it('adds points to the scene', () => {
    spawnParticleBurst(scene as unknown as import('three').Scene, 0, 0, 10, '#ffffff', 0);
    expect(scene.add).toHaveBeenCalledTimes(1);
    expect(scene.children).toHaveLength(1);
  });

  it('cx and cy come from hexToWorld', () => {
    const burst = spawnParticleBurst(scene as unknown as import('three').Scene, 3, 5, 10, '#ffffff', 0);
    // hexToWorld mock returns { x: col*10, y: row*10 }
    expect(burst.cx).toBe(30);
    expect(burst.cy).toBe(50);
  });

  it('directions has COUNT*2 entries', () => {
    const burst = spawnParticleBurst(scene as unknown as import('three').Scene, 0, 0, 10, '#ffffff', 0);
    expect(burst.directions).toHaveLength(PARTICLE_CONSTANTS.COUNT * 2);
  });

  it('position buffer has COUNT*3 entries', () => {
    const burst = spawnParticleBurst(scene as unknown as import('three').Scene, 0, 0, 10, '#ffffff', 0);
    const posAttr = (burst.points.geometry as unknown as { getAttribute: (n: string) => { array: Float32Array } }).getAttribute('position');
    expect(posAttr.array).toHaveLength(PARTICLE_CONSTANTS.COUNT * 3);
  });

  it('initial material opacity equals SPAWN_OPACITY', () => {
    const burst = spawnParticleBurst(scene as unknown as import('three').Scene, 0, 0, 10, '#ffffff', 0);
    const mat = burst.points.material as unknown as { opacity: number };
    expect(mat.opacity).toBeCloseTo(PARTICLE_CONSTANTS.SPAWN_OPACITY);
  });
});

describe('tickParticleBursts', () => {
  let scene: ReturnType<typeof makeScene>;

  beforeEach(() => {
    scene = makeScene();
  });

  it('removes expired burst (elapsed >= LIFETIME_MS) and returns empty array', () => {
    const burst = spawnParticleBurst(scene as unknown as import('three').Scene, 0, 0, 10, '#ffffff', 0);
    const result = tickParticleBursts(
      scene as unknown as import('three').Scene,
      [burst],
      PARTICLE_CONSTANTS.LIFETIME_MS + 1, // beyond lifetime
    );
    expect(result).toHaveLength(0);
    expect(scene.remove).toHaveBeenCalledWith(burst.points);
    // Geometry and material should be disposed
    expect((burst.points.geometry as unknown as { dispose: ReturnType<typeof vi.fn> }).dispose).toHaveBeenCalled();
    expect((burst.points.material as unknown as { dispose: ReturnType<typeof vi.fn> }).dispose).toHaveBeenCalled();
  });

  it('keeps burst alive when elapsed < LIFETIME_MS', () => {
    const burst = spawnParticleBurst(scene as unknown as import('three').Scene, 0, 0, 10, '#ffffff', 0);
    const halfLife = PARTICLE_CONSTANTS.LIFETIME_MS / 2;
    const result = tickParticleBursts(
      scene as unknown as import('three').Scene,
      [burst],
      halfLife,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(burst);
  });

  it('updates opacity proportional to (1 - t)', () => {
    const burst = spawnParticleBurst(scene as unknown as import('three').Scene, 0, 0, 10, '#ffffff', 0);
    const halfLife = PARTICLE_CONSTANTS.LIFETIME_MS / 2;
    tickParticleBursts(scene as unknown as import('three').Scene, [burst], halfLife);
    const mat = burst.points.material as unknown as { opacity: number };
    const expectedOpacity = PARTICLE_CONSTANTS.SPAWN_OPACITY * 0.5;
    expect(mat.opacity).toBeCloseTo(expectedOpacity, 5);
  });

  it('marks position attribute needsUpdate after tick', () => {
    const burst = spawnParticleBurst(scene as unknown as import('three').Scene, 0, 0, 10, '#ffffff', 0);
    tickParticleBursts(scene as unknown as import('three').Scene, [burst], PARTICLE_CONSTANTS.LIFETIME_MS * 0.3);
    const posAttr = (burst.points.geometry as unknown as { getAttribute: (n: string) => { needsUpdate: boolean } }).getAttribute('position');
    expect(posAttr.needsUpdate).toBe(true);
  });

  it('handles empty bursts array gracefully', () => {
    const result = tickParticleBursts(scene as unknown as import('three').Scene, [], 0);
    expect(result).toHaveLength(0);
    expect(scene.remove).not.toHaveBeenCalled();
  });

  it('removes burst exactly at t=1.0', () => {
    const burst = spawnParticleBurst(scene as unknown as import('three').Scene, 0, 0, 10, '#ffffff', 0);
    const result = tickParticleBursts(
      scene as unknown as import('three').Scene,
      [burst],
      PARTICLE_CONSTANTS.LIFETIME_MS,
    );
    expect(result).toHaveLength(0);
  });

  it('keeps multiple bursts at different ages', () => {
    const b1 = spawnParticleBurst(scene as unknown as import('three').Scene, 0, 0, 10, '#ff0000', 0);
    const b2 = spawnParticleBurst(scene as unknown as import('three').Scene, 1, 0, 10, '#00ff00', 400);
    // nowMs = 900: b1 elapsed=900 (>LIFETIME_MS=800) → expired; b2 elapsed=500 → alive
    const result = tickParticleBursts(scene as unknown as import('three').Scene, [b1, b2], 900);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(b2);
  });
});
