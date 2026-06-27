/**
 * LocationIconMesh.test.ts — Unit tests for the location icon mesh factory.
 *
 * Mocks document.createElement (canvas) and THREE.CanvasTexture so tests run
 * in jsdom without requiring a full WebGL context.
 *
 * Tests:
 * - createLocationIconMesh returns THREE.Group with renderOrder === RENDER_ORDER.LOCATIONS (8)
 * - Returns empty group when locations array is empty
 * - Skips locations with unknown locationType (fail-soft)
 * - Adds extra ring sprite for capital locations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { RENDER_ORDER } from '../RenderLayers';

// ── Mocks ──────────────────────────────────────────────────────────────────

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
          strokeStyle: '',
          lineWidth: 0,
          beginPath: vi.fn(),
          arc: vi.fn(),
          stroke: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          closePath: vi.fn(),
        }),
      };
    }
    return null;
  },
});

// Mock Path2D (not available in jsdom)
vi.stubGlobal('Path2D', class {
  constructor(_d?: string) {}
});

// Mock THREE.CanvasTexture to avoid GPU operations
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three');
  class CanvasTextureMock {
    needsUpdate = false;
    constructor(_canvas: unknown) {}
  }
  return {
    ...actual,
    CanvasTexture: CanvasTextureMock,
  };
});

// ── Tests ──────────────────────────────────────────────────────────────────

import type { LocationNode } from '../LocationIconMesh';

describe('createLocationIconMesh', () => {
  let createLocationIconMesh: (locations: LocationNode[]) => THREE.Group;
  let LOCATION_ICON_Z: number;
  let LOCATION_ICON_THRESHOLD: number;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../LocationIconMesh');
    createLocationIconMesh = mod.createLocationIconMesh;
    LOCATION_ICON_Z = mod.LOCATION_ICON_Z;
    LOCATION_ICON_THRESHOLD = mod.LOCATION_ICON_THRESHOLD;
  });

  it('returns THREE.Group with renderOrder === RENDER_ORDER.LOCATIONS (8)', () => {
    const group = createLocationIconMesh([]);
    expect(group).toBeInstanceOf(THREE.Group);
    expect(group.renderOrder).toBe(RENDER_ORDER.LOCATIONS);
    expect(group.renderOrder).toBe(9);
  });

  it('returns empty group when locations array is empty', () => {
    const group = createLocationIconMesh([]);
    expect(group.children).toHaveLength(0);
  });

  it('adds sprites for valid location types', () => {
    const locations: LocationNode[] = [
      { locationType: 'city', hexCol: 5, hexRow: 3, name: 'Silverkeep' },
      { locationType: 'town', hexCol: 2, hexRow: 7, name: 'Millhaven' },
    ];
    const group = createLocationIconMesh(locations);
    // Each non-capital location creates exactly 1 sprite
    expect(group.children.length).toBeGreaterThanOrEqual(2);
  });

  it('skips locations with unknown locationType (fail-soft)', () => {
    const locations: LocationNode[] = [
      { locationType: 'unknown_type_xyz', hexCol: 1, hexRow: 1, name: 'Ghost' },
    ];
    expect(() => createLocationIconMesh(locations)).not.toThrow();
    const group = createLocationIconMesh(locations);
    // Unknown type skipped — no sprites added
    expect(group.children).toHaveLength(0);
  });

  it('adds extra ring sprite for capital locations', () => {
    const locations: LocationNode[] = [
      { locationType: 'capital', hexCol: 10, hexRow: 10, name: 'The Capital', isCapital: true },
    ];
    const group = createLocationIconMesh(locations);
    // capital gets icon sprite + red ring sprite = at least 2 children
    expect(group.children.length).toBeGreaterThanOrEqual(2);
  });

  it('adds an extra seat marker sprite for the home seat (THR-502)', () => {
    const plain: LocationNode[] = [
      { locationType: 'town', hexCol: 4, hexRow: 4, name: 'Hearthold' },
    ];
    const seat: LocationNode[] = [
      { locationType: 'town', hexCol: 4, hexRow: 4, name: 'Hearthold', isHomeSeat: true },
    ];
    const plainGroup = createLocationIconMesh(plain);
    const seatGroup = createLocationIconMesh(seat);
    // The seat gets its base icon plus a seat marker overlay → one extra child.
    expect(seatGroup.children.length).toBe(plainGroup.children.length + 1);
  });

  it('does not throw building the seat marker texture (crown path)', () => {
    const seat: LocationNode[] = [
      { locationType: 'capital', hexCol: 1, hexRow: 1, name: 'Throne', isCapital: true, isHomeSeat: true },
    ];
    expect(() => createLocationIconMesh(seat)).not.toThrow();
  });
});

describe('LOCATION_ICON_Z', () => {
  let LOCATION_ICON_Z: number;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../LocationIconMesh');
    LOCATION_ICON_Z = mod.LOCATION_ICON_Z;
  });

  it('is 0.08 (above SIGNIFIER_Z=0.07)', () => {
    expect(LOCATION_ICON_Z).toBe(0.08);
  });
});

describe('LOCATION_ICON_THRESHOLD', () => {
  let LOCATION_ICON_THRESHOLD: number;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../LocationIconMesh');
    LOCATION_ICON_THRESHOLD = mod.LOCATION_ICON_THRESHOLD;
  });

  it('is 5 (visible at regional zoom)', () => {
    expect(LOCATION_ICON_THRESHOLD).toBe(5);
  });
});
