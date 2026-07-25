/**
 * CompanyClusterMesh.test.ts — Unit tests for the company cluster layer (THR-74).
 *
 * Tests cover:
 * - createCompanyClusterMesh returns an empty group at RENDER_ORDER.COMPANY_CLUSTER
 * - rebuild adds a ring + glyph per company, positioned at the company's world coords
 * - threaded companies take the gold treatment; untethered take the neutral colour
 * - rebuild replaces prior marks (idempotent, no accumulation)
 * - rebuild([]) clears the group
 * - fail-soft: empty input never throws; dispose never throws
 * - RENDER_ORDER / LAYER_Z slots are defined
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  createCompanyClusterMesh,
  COMPANY_THREADED_COLOR,
  COMPANY_NEUTRAL_COLOR,
  type CompanyRenderData,
} from '../CompanyClusterMesh';
import { RENDER_ORDER, LAYER_Z } from '../RenderLayers';

function company(overrides: Partial<CompanyRenderData> = {}): CompanyRenderData {
  return {
    id: 'group-1',
    worldX: 12,
    worldY: -34,
    threaded: false,
    memberCount: 3,
    ...overrides,
  };
}

describe('CompanyClusterMesh', () => {
  it('creates an empty group at the company-cluster render order', () => {
    const layer = createCompanyClusterMesh();
    expect(layer.group).toBeInstanceOf(THREE.Group);
    expect(layer.group.renderOrder).toBe(RENDER_ORDER.COMPANY_CLUSTER);
    expect(layer.group.children.length).toBe(0);
    layer.dispose();
  });

  it('adds a ring + glyph per company, positioned at world coords', () => {
    const layer = createCompanyClusterMesh();
    layer.rebuild([company({ worldX: 5, worldY: -9 })]);
    // Two meshes per company: the enclosing ring and the central bond glyph.
    expect(layer.group.children.length).toBe(2);
    for (const child of layer.group.children) {
      expect(child).toBeInstanceOf(THREE.Mesh);
      expect(child.position.x).toBe(5);
      expect(child.position.y).toBe(-9);
      expect(child.position.z).toBeCloseTo(LAYER_Z.COMPANY_CLUSTER, 1);
    }
    layer.dispose();
  });

  it('uses the gold treatment for threaded companies and neutral otherwise', () => {
    const gold = new THREE.Color().setStyle(COMPANY_THREADED_COLOR, THREE.SRGBColorSpace);
    const neutral = new THREE.Color().setStyle(COMPANY_NEUTRAL_COLOR, THREE.SRGBColorSpace);

    const layer = createCompanyClusterMesh();
    layer.rebuild([
      company({ id: 'threaded', threaded: true }),
      company({ id: 'untethered', threaded: false }),
    ]);

    const colors = layer.group.children.map(
      c => ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).color.getHexString(),
    );
    expect(colors).toContain(gold.getHexString());
    expect(colors).toContain(neutral.getHexString());
    layer.dispose();
  });

  it('replaces prior marks on rebuild rather than accumulating', () => {
    const layer = createCompanyClusterMesh();
    layer.rebuild([company({ id: 'a' }), company({ id: 'b' })]);
    expect(layer.group.children.length).toBe(4); // 2 companies × (ring + glyph)
    layer.rebuild([company({ id: 'c' })]);
    expect(layer.group.children.length).toBe(2);
    layer.dispose();
  });

  it('clears the group on rebuild([]) and never throws on empty input', () => {
    const layer = createCompanyClusterMesh();
    layer.rebuild([company()]);
    expect(() => layer.rebuild([])).not.toThrow();
    expect(layer.group.children.length).toBe(0);
    layer.dispose();
  });

  it('dispose never throws, even before any rebuild', () => {
    const layer = createCompanyClusterMesh();
    expect(() => layer.dispose()).not.toThrow();
  });

  it('defines the render-order and z slots', () => {
    expect(RENDER_ORDER.COMPANY_CLUSTER).toBeGreaterThan(RENDER_ORDER.THREADS);
    expect(RENDER_ORDER.COMPANY_CLUSTER).toBeLessThan(RENDER_ORDER.AGENTS);
    expect(LAYER_Z.COMPANY_CLUSTER).toBeGreaterThan(LAYER_Z.THREADS);
    expect(LAYER_Z.COMPANY_CLUSTER).toBeLessThan(LAYER_Z.AGENTS);
  });
});
