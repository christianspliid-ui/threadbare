import { describe, expect, it } from 'vitest';
import {
  createTerrainTextureLabMaterial,
  TERRAIN_TEXTURE_LAB_FRAGMENT_SHADER,
  TERRAIN_TEXTURE_LAB_SHADER_CONSTANTS,
  TERRAIN_TEXTURE_LAB_VERTEX_SHADER,
} from '../terrainTextureLabShader';
import {
  getDefaultTerrainTextureLabConfigs,
  LAB_TERRAIN_ORDER,
  parseTerrainTextureLabConfigs,
  serializeTerrainTextureLabConfigs,
} from '../terrainTextureLabPresets';

describe('terrainTextureLab presets', () => {
  it('round-trips the default preset set through JSON serialization', () => {
    const defaults = getDefaultTerrainTextureLabConfigs();
    const parsed = parseTerrainTextureLabConfigs(serializeTerrainTextureLabConfigs(defaults));
    expect(parsed).toEqual(defaults);
  });

  it('defines a config for every lab terrain', () => {
    const defaults = getDefaultTerrainTextureLabConfigs();
    expect(Object.keys(defaults)).toEqual(LAB_TERRAIN_ORDER);
  });
});

describe('terrainTextureLab shader', () => {
  it('exposes the expected outline constant', () => {
    expect(TERRAIN_TEXTURE_LAB_SHADER_CONSTANTS.OUTLINE_COLOR).toBe('#D4A040');
  });

  it('includes instancing attributes in the vertex shader', () => {
    expect(TERRAIN_TEXTURE_LAB_VERTEX_SHADER).toContain('attribute vec3 aBaseColor');
    expect(TERRAIN_TEXTURE_LAB_VERTEX_SHADER).toContain('instanceMatrix');
  });

  it('includes recipe-specific noise helpers in the fragment shader', () => {
    expect(TERRAIN_TEXTURE_LAB_FRAGMENT_SHADER).toContain('ridgedFbm');
    expect(TERRAIN_TEXTURE_LAB_FRAGMENT_SHADER).toContain('cellular');
    expect(TERRAIN_TEXTURE_LAB_FRAGMENT_SHADER).toContain('rotate2d');
    expect(TERRAIN_TEXTURE_LAB_FRAGMENT_SHADER).toContain('getRecipePattern(p, warped)');
    expect(TERRAIN_TEXTURE_LAB_FRAGMENT_SHADER).toContain('uGlobalSeed');
  });

  it('creates a shader material with time and seed uniforms', () => {
    const material = createTerrainTextureLabMaterial();
    expect(material.uniforms.uTime.value).toBe(0);
    expect(material.uniforms.uGlobalSeed.value).toBe(42);
    material.dispose();
  });
});
