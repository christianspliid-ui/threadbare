/**
 * MovementTrailMesh.test.ts — Unit tests for movement trail rendering.
 *
 * Tests cover:
 * - createMovementTrailMesh returns a Group with correct render order
 * - addTrailSegment adds a Line child with correct geometry positions
 * - addTrailSegment sets material color from factionColor
 * - addTrailSegment starts at TRAIL_OPACITY_MAX
 * - addTrailSegment stores startTime in userData
 * - updateTrails fades opacity over time
 * - updateTrails disposes expired segments (age >= TRAIL_FADE_DURATION)
 * - updateTrails skips non-Line children gracefully (fail-soft)
 * - updateTrails does nothing on empty group
 * - Multiple segments fade independently
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TRAIL_OPACITY_MAX, TRAIL_OPACITY_MIN } from '../../../../data/agent-visual-content';
import { RENDER_ORDER } from '../RenderLayers';

// ── Mock Three.js ─────────────────────────────────────────────────────────────
// MovementTrailMesh uses `instanceof THREE.Line` for the type guard in updateTrails.
// All class definitions must live INSIDE the vi.mock factory to avoid the hoisting
// "Cannot access before initialization" error. The factory runs before imports.
vi.mock('three', () => {
  class MockVector3 {
    x: number;
    y: number;
    z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  }

  class MockBufferGeometry {
    _points: MockVector3[] = [];
    dispose = vi.fn();
    setFromPoints(points: MockVector3[]) {
      this._points = [...points];
      return this;
    }
  }

  class MockMaterial {
    opacity = 1;
    transparent = false;
    depthWrite = true;
    dispose = vi.fn();
  }

  class MockLineBasicMaterial extends MockMaterial {
    color: string;
    constructor(params: { color?: string; transparent?: boolean; opacity?: number; depthWrite?: boolean } = {}) {
      super();
      this.color = params.color ?? '#ffffff';
      this.transparent = params.transparent ?? false;
      this.opacity = params.opacity ?? 1;
      this.depthWrite = params.depthWrite ?? true;
    }
  }

  class MockLine {
    geometry: MockBufferGeometry;
    material: MockLineBasicMaterial;
    renderOrder = 0;
    userData: Record<string, unknown> = {};
    constructor(geometry: MockBufferGeometry, material: MockLineBasicMaterial) {
      this.geometry = geometry;
      this.material = material;
    }
  }

  class MockGroup {
    children: unknown[] = [];
    renderOrder = 0;
    add(child: unknown) { this.children.push(child); }
    remove(child: unknown) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) this.children.splice(idx, 1);
    }
  }

  return {
    Vector3: MockVector3,
    BufferGeometry: MockBufferGeometry,
    LineBasicMaterial: MockLineBasicMaterial,
    Line: MockLine,
    Group: MockGroup,
    Material: MockMaterial,
  };
});

// Import after mock is registered
import {
  TRAIL_FADE_DURATION,
  createMovementTrailMesh,
  addTrailSegment,
  updateTrails,
  type TrailSegment,
} from '../MovementTrailMesh';
import * as THREE from 'three';

// ── Type aliases for mock internals ──────────────────────────────────────────
// We cast to these to inspect mock-specific fields (e.g. _points, dispose).

interface MockVector3Like { x: number; y: number; z: number }
interface MockGeometryLike { _points: MockVector3Like[]; dispose: ReturnType<typeof vi.fn> }
interface MockMaterialLike { color: string; opacity: number; transparent: boolean; depthWrite: boolean; dispose: ReturnType<typeof vi.fn> }
interface MockLineLike { geometry: MockGeometryLike; material: MockMaterialLike; renderOrder: number; userData: Record<string, unknown> }
interface MockGroupLike { children: unknown[]; renderOrder: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSegment(overrides: Partial<TrailSegment> = {}): TrailSegment {
  return {
    fromX: 0,
    fromY: 0,
    toX: 5,
    toY: 5,
    factionColor: '#ff0000',
    startTime: 1000,
    ...overrides,
  };
}

function groupChildren(group: THREE.Group): MockLineLike[] {
  return (group as unknown as MockGroupLike).children as MockLineLike[];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TRAIL_FADE_DURATION', () => {
  it('is 2000ms', () => {
    expect(TRAIL_FADE_DURATION).toBe(2000);
  });
});

describe('createMovementTrailMesh', () => {
  it('returns a Group', () => {
    const group = createMovementTrailMesh();
    expect(group).toBeInstanceOf(THREE.Group);
  });

  it('sets renderOrder to RENDER_ORDER.AGENTS', () => {
    const group = createMovementTrailMesh();
    expect(group.renderOrder).toBe(RENDER_ORDER.AGENTS);
    expect(group.renderOrder).toBe(10);
  });

  it('starts with no children', () => {
    const group = createMovementTrailMesh();
    expect(groupChildren(group).length).toBe(0);
  });
});

describe('addTrailSegment', () => {
  let group: THREE.Group;

  beforeEach(() => {
    group = createMovementTrailMesh();
  });

  it('adds exactly one Line child to the group', () => {
    addTrailSegment(group, makeSegment());
    expect(groupChildren(group).length).toBe(1);
    expect(groupChildren(group)[0]).toBeInstanceOf(THREE.Line);
  });

  it('geometry positions match fromX/fromY and toX/toY', () => {
    const segment = makeSegment({ fromX: 1, fromY: 2, toX: 7, toY: 8 });
    addTrailSegment(group, segment);
    const line = groupChildren(group)[0];
    const points = line.geometry._points;
    expect(points.length).toBe(2);
    expect(points[0].x).toBe(1);
    expect(points[0].y).toBe(2);
    expect(points[1].x).toBe(7);
    expect(points[1].y).toBe(8);
  });

  it('both geometry points share the same Z value (TRAIL_Z)', () => {
    addTrailSegment(group, makeSegment({ fromX: 0, fromY: 0, toX: 3, toY: 3 }));
    const line = groupChildren(group)[0];
    const points = line.geometry._points;
    expect(points[0].z).toBe(points[1].z);
    // TRAIL_Z = LAYER_Z.TRAILS = 0.085
    expect(points[0].z).toBeCloseTo(0.085, 5);
  });

  it('sets material color from factionColor', () => {
    addTrailSegment(group, makeSegment({ factionColor: '#00ff00' }));
    expect(groupChildren(group)[0].material.color).toBe('#00ff00');
  });

  it('starts material opacity at TRAIL_OPACITY_MAX', () => {
    addTrailSegment(group, makeSegment());
    expect(groupChildren(group)[0].material.opacity).toBe(TRAIL_OPACITY_MAX);
    expect(groupChildren(group)[0].material.opacity).toBe(0.8);
  });

  it('sets material transparent = true', () => {
    addTrailSegment(group, makeSegment());
    expect(groupChildren(group)[0].material.transparent).toBe(true);
  });

  it('sets material depthWrite = false', () => {
    addTrailSegment(group, makeSegment());
    expect(groupChildren(group)[0].material.depthWrite).toBe(false);
  });

  it('stores startTime in userData', () => {
    addTrailSegment(group, makeSegment({ startTime: 5000 }));
    expect(groupChildren(group)[0].userData.startTime).toBe(5000);
  });

  it('sets line renderOrder to RENDER_ORDER.AGENTS', () => {
    addTrailSegment(group, makeSegment());
    expect(groupChildren(group)[0].renderOrder).toBe(RENDER_ORDER.AGENTS);
  });

  it('adding multiple segments adds multiple children', () => {
    addTrailSegment(group, makeSegment({ startTime: 1000 }));
    addTrailSegment(group, makeSegment({ startTime: 2000 }));
    addTrailSegment(group, makeSegment({ startTime: 3000 }));
    expect(groupChildren(group).length).toBe(3);
  });
});

describe('updateTrails', () => {
  let performanceNowSpy: ReturnType<typeof vi.spyOn>;
  let now: number;

  beforeEach(() => {
    now = 10000;
    performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    performanceNowSpy.mockRestore();
  });

  it('does nothing on an empty group (no throw, no children added)', () => {
    const group = createMovementTrailMesh();
    expect(() => updateTrails(group)).not.toThrow();
    expect(groupChildren(group).length).toBe(0);
  });

  it('fades opacity to interpolated value at t=0.5 (halfway)', () => {
    const group = createMovementTrailMesh();
    const startTime = now - TRAIL_FADE_DURATION / 2;
    addTrailSegment(group, makeSegment({ startTime }));

    updateTrails(group);

    const line = groupChildren(group)[0];
    const expectedOpacity = TRAIL_OPACITY_MAX + (TRAIL_OPACITY_MIN - TRAIL_OPACITY_MAX) * 0.5;
    expect(line.material.opacity).toBeCloseTo(expectedOpacity, 5);
  });

  it('opacity at t=0.25 is closer to TRAIL_OPACITY_MAX than at t=0.75', () => {
    const groupA = createMovementTrailMesh();
    addTrailSegment(groupA, makeSegment({ startTime: now - TRAIL_FADE_DURATION * 0.25 }));
    updateTrails(groupA);
    const opacityA = groupChildren(groupA)[0].material.opacity;

    const groupB = createMovementTrailMesh();
    addTrailSegment(groupB, makeSegment({ startTime: now - TRAIL_FADE_DURATION * 0.75 }));
    updateTrails(groupB);
    const opacityB = groupChildren(groupB)[0].material.opacity;

    expect(opacityA).toBeGreaterThan(opacityB);
    expect(opacityA).toBeLessThanOrEqual(TRAIL_OPACITY_MAX);
    expect(opacityB).toBeGreaterThanOrEqual(TRAIL_OPACITY_MIN);
  });

  it('disposes and removes a segment exactly at TRAIL_FADE_DURATION age', () => {
    const group = createMovementTrailMesh();
    const startTime = now - TRAIL_FADE_DURATION;
    addTrailSegment(group, makeSegment({ startTime }));

    const line = groupChildren(group)[0];
    updateTrails(group);

    expect(groupChildren(group).length).toBe(0);
    expect(line.geometry.dispose).toHaveBeenCalledOnce();
    expect(line.material.dispose).toHaveBeenCalledOnce();
  });

  it('disposes and removes a segment older than TRAIL_FADE_DURATION', () => {
    const group = createMovementTrailMesh();
    const startTime = now - TRAIL_FADE_DURATION - 500;
    addTrailSegment(group, makeSegment({ startTime }));

    const line = groupChildren(group)[0];
    updateTrails(group);

    expect(groupChildren(group).length).toBe(0);
    expect(line.geometry.dispose).toHaveBeenCalledOnce();
    expect(line.material.dispose).toHaveBeenCalledOnce();
  });

  it('keeps a segment younger than TRAIL_FADE_DURATION', () => {
    const group = createMovementTrailMesh();
    addTrailSegment(group, makeSegment({ startTime: now - (TRAIL_FADE_DURATION - 100) }));

    updateTrails(group);

    expect(groupChildren(group).length).toBe(1);
  });

  it('skips non-Line children gracefully without throwing (fail-soft)', () => {
    const group = createMovementTrailMesh();
    // Inject a plain object that is not a THREE.Line instance
    const imposter = { userData: { startTime: now - TRAIL_FADE_DURATION - 1 } };
    (group as unknown as MockGroupLike).children.push(imposter);

    expect(() => updateTrails(group)).not.toThrow();
    // Non-Line child is NOT removed (instanceof guard skips it)
    expect(groupChildren(group).length).toBe(1);
  });

  it('multiple segments fade independently based on their own startTime', () => {
    const group = createMovementTrailMesh();

    // Segment A: 25% elapsed
    addTrailSegment(group, makeSegment({ factionColor: '#ff0000', startTime: now - TRAIL_FADE_DURATION * 0.25 }));
    // Segment B: 75% elapsed
    addTrailSegment(group, makeSegment({ factionColor: '#0000ff', startTime: now - TRAIL_FADE_DURATION * 0.75 }));

    updateTrails(group);

    const children = groupChildren(group);
    const opacityA = children[0].material.opacity;
    const opacityB = children[1].material.opacity;

    const expectedA = TRAIL_OPACITY_MAX + (TRAIL_OPACITY_MIN - TRAIL_OPACITY_MAX) * 0.25;
    const expectedB = TRAIL_OPACITY_MAX + (TRAIL_OPACITY_MIN - TRAIL_OPACITY_MAX) * 0.75;

    expect(opacityA).toBeCloseTo(expectedA, 5);
    expect(opacityB).toBeCloseTo(expectedB, 5);
    expect(opacityA).toBeGreaterThan(opacityB);
  });

  it('expired segment is removed while a fresh sibling survives', () => {
    const group = createMovementTrailMesh();

    addTrailSegment(group, makeSegment({ startTime: now - TRAIL_FADE_DURATION - 1 })); // expired
    addTrailSegment(group, makeSegment({ startTime: now - 100 }));                      // fresh

    updateTrails(group);

    expect(groupChildren(group).length).toBe(1);
    // Survivor should have high opacity (100ms of 2000ms elapsed = t≈0.05)
    const survivor = groupChildren(group)[0];
    expect(survivor.material.opacity).toBeGreaterThan(TRAIL_OPACITY_MIN);
    expect(survivor.material.opacity).toBeCloseTo(
      TRAIL_OPACITY_MAX + (TRAIL_OPACITY_MIN - TRAIL_OPACITY_MAX) * (100 / TRAIL_FADE_DURATION),
      4
    );
  });

  it('opacity decreases as time advances across multiple ticks', () => {
    const startTime = now;
    const opacities: number[] = [];

    // Simulate three successive time steps: t=0.2, t=0.5, t=0.8
    for (const t of [0.2, 0.5, 0.8]) {
      const group = createMovementTrailMesh();
      addTrailSegment(group, makeSegment({ startTime }));
      performanceNowSpy.mockReturnValue(startTime + TRAIL_FADE_DURATION * t);
      updateTrails(group);
      if (groupChildren(group).length > 0) {
        opacities.push(groupChildren(group)[0].material.opacity);
      }
    }

    expect(opacities.length).toBe(3);
    expect(opacities[0]).toBeGreaterThan(opacities[1]);
    expect(opacities[1]).toBeGreaterThan(opacities[2]);
  });
});
