import { describe, expect, it } from 'vitest';
import {
  createTerrainTextureLabMaterial,
  TERRAIN_TEXTURE_LAB_FRAGMENT_SHADER,
  TERRAIN_TEXTURE_LAB_SHADER_CONSTANTS,
  TERRAIN_TEXTURE_LAB_VERTEX_SHADER,
} from '../terrainTextureLabShader';
import {
  getDefaultTerrainTextureLabViewSettings,
  getDefaultTerrainTextureLabConfigs,
  getDefaultTerrainTextureLabVignetteSettings,
  LAB_TERRAIN_ORDER,
  parseTerrainTextureLabConfigs,
  parseTerrainTextureLabVignetteSettings,
  parseTerrainTextureLabViewSettings,
  serializeTerrainTextureLabConfigs,
  serializeTerrainTextureLabVignetteSettings,
  serializeTerrainTextureLabViewSettings,
  TERRAIN_TEXTURE_LAB_BUILTIN_MODELS,
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

  it('round-trips the default view settings through JSON serialization', () => {
    const defaults = getDefaultTerrainTextureLabViewSettings();
    const parsed = parseTerrainTextureLabViewSettings(serializeTerrainTextureLabViewSettings(defaults));
    expect(parsed).toEqual(defaults);
  });

  it('round-trips the default vignette settings through JSON serialization', () => {
    const defaults = getDefaultTerrainTextureLabVignetteSettings();
    const parsed = parseTerrainTextureLabVignetteSettings(serializeTerrainTextureLabVignetteSettings(defaults));
    expect(parsed).toEqual(defaults);
  });

  it('exposes builtin lab models for quick placement testing', () => {
    expect(TERRAIN_TEXTURE_LAB_BUILTIN_MODELS.map(model => model.sourceUrl)).toEqual([
      '/models/city.glb',
      '/models/town.glb',
      '/models/village.glb',
      '/models/forest-city-vignette.glb',
      '/models/deciduous-oak.glb',
      '/models/deciduous-elm.glb',
      '/models/deciduous-birch.glb',
      '/models/mountain-temple.glb',
      '/models/cairn-stones.glb',
      '/models/rock-outcrop.glb',
    ]);
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
