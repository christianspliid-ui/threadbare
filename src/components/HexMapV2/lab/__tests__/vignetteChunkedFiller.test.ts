import { describe, expect, it } from 'vitest';
import { TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS, TERRAIN_TEXTURE_PREVIEW_HEXES } from '../terrainTextureLabPresets';
import { resolveAllHexFiller, resolveHexFiller } from '../vignette/VignetteResolver';
import { createVignetteInstanceMaterial } from '../vignette/VignetteInstanceMaterial';
import { FILLER_PROFILE_TERRAIN_TYPES } from '../vignette/FillerProfiles';
import { getTerrainTextureLabHexCenter } from '../terrainTextureLabLayout';
import * as THREE from 'three';

describe('VignetteResolver', () => {
  it('only resolves hexes with filler profiles (forest + swamp)', () => {
    const results = resolveAllHexFiller(TERRAIN_TEXTURE_PREVIEW_HEXES, [], 42);
    const resolvedTypes = new Set(results.map(r => r.terrainType));
    expect(resolvedTypes.has('temperate_forest')).toBe(true);
    expect(resolvedTypes.has('swamp')).toBe(true);
    expect(resolvedTypes.has('grassland')).toBe(false);
    expect(resolvedTypes.has('mountains')).toBe(false);
  });

  it('produces deterministic output for the same seed', () => {
    const hexes = TERRAIN_TEXTURE_PREVIEW_HEXES.filter(h => h.terrainKey === 'temperate_forest');
    const first = resolveAllHexFiller(hexes, [], 42);
    const second = resolveAllHexFiller(hexes, [], 42);
    expect(second.length).toBe(first.length);
    for (let i = 0; i < first.length; i++) {
      expect(second[i]!.instances.length).toBe(first[i]!.instances.length);
      expect(second[i]!.instances[0]).toEqual(first[i]!.instances[0]);
    }
  });

  it('produces different output for different seeds', () => {
    const hexes = TERRAIN_TEXTURE_PREVIEW_HEXES.filter(h => h.terrainKey === 'temperate_forest');
    const result42 = resolveAllHexFiller(hexes, [], 42);
    const result99 = resolveAllHexFiller(hexes, [], 99);
    const someInstancesDiffer = result42.some((r, i) =>
      r.instances[0]?.x !== result99[i]?.instances[0]?.x,
    );
    expect(someInstancesDiffer).toBe(true);
  });

  it('scales instance count proportionally with densityScale', () => {
    const hexes = TERRAIN_TEXTURE_PREVIEW_HEXES.filter(h => h.terrainKey === 'temperate_forest');
    const sparse = resolveAllHexFiller(hexes, [], 42, 0.35);
    const dense = resolveAllHexFiller(hexes, [], 42, 1.4);
    const sparseTotal = sparse.reduce((s, r) => s + r.instances.length, 0);
    const denseTotal = dense.reduce((s, r) => s + r.instances.length, 0);
    expect(denseTotal).toBeGreaterThan(sparseTotal);
  });

  it('respects hard_keepout zones — no instance lands inside the zone', () => {
    const hex = TERRAIN_TEXTURE_PREVIEW_HEXES.find(h => h.terrainKey === 'temperate_forest')!;
    const center = getTerrainTextureLabHexCenter(hex.col, hex.row);
    const keepoutRadius = 30;
    const zone = {
      id: 'test-keepout',
      hexId: hex.id,
      slot: 'CENTER' as const,
      mode: 'hard_keepout' as const,
      center,
      radius: keepoutRadius,
    };
    const result = resolveHexFiller(hex, [zone], 42);
    const insideKeepout = result.instances.some(inst => {
      const dx = inst.x - center.x;
      const dy = inst.y - center.y;
      return Math.sqrt(dx * dx + dy * dy) < keepoutRadius;
    });
    expect(insideKeepout).toBe(false);
  });

  it('caps instances at SCATTER_MAX_INSTANCES_PER_BATCH', () => {
    const hexes = TERRAIN_TEXTURE_PREVIEW_HEXES.filter(h =>
      FILLER_PROFILE_TERRAIN_TYPES.has(h.terrainKey),
    );
    const results = resolveAllHexFiller(hexes, [], 42, 1.6);
    const max = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.SCATTER_MAX_INSTANCES_PER_BATCH;
    for (const r of results) {
      expect(r.instances.length).toBeLessThanOrEqual(max);
    }
  });

  it('emits a trace with correct type and hexId', () => {
    const hex = TERRAIN_TEXTURE_PREVIEW_HEXES.find(h => h.terrainKey === 'temperate_forest')!;
    const result = resolveHexFiller(hex, [], 42);
    expect(result.trace.type).toBe('vignette.resolve');
    expect(result.trace.hexId).toBe(hex.id);
    expect(result.trace.fillerInstanceCount).toBe(result.instances.length);
  });
});

describe('VignetteInstanceMaterial', () => {
  it('returns a ShaderMaterial with required uniform keys', () => {
    const color = new THREE.Color(0x44aa22);
    const mat = createVignetteInstanceMaterial(color);
    expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
    expect(mat.uniforms.uBaseColor).toBeDefined();
    expect(mat.uniforms.uRememberedTint).toBeDefined();
    expect(mat.uniforms.uRememberedMix).toBeDefined();
    expect(mat.uniforms.uHoverColor).toBeDefined();
  });

  it('sets uBaseColor from the provided color', () => {
    const color = new THREE.Color(0.2, 0.5, 0.1);
    const mat = createVignetteInstanceMaterial(color);
    expect(mat.uniforms.uBaseColor.value.r).toBeCloseTo(color.r);
    expect(mat.uniforms.uBaseColor.value.g).toBeCloseTo(color.g);
    expect(mat.uniforms.uBaseColor.value.b).toBeCloseTo(color.b);
  });

  it('uses REMEMBERED_TINT_MIX constant for uRememberedMix', () => {
    const mat = createVignetteInstanceMaterial(new THREE.Color());
    expect(mat.uniforms.uRememberedMix.value).toBe(
      TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.REMEMBERED_TINT_MIX,
    );
  });
});
