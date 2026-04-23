import { describe, expect, it } from 'vitest';
import {
  buildTerrainTextureLabVignettePrototype,
} from '../terrainTextureLabVignettePrototype';
import {
  getDefaultTerrainTextureLabVignetteSettings,
  TERRAIN_TEXTURE_LAB_BUILTIN_MODELS,
  TERRAIN_TEXTURE_PREVIEW_HEXES,
} from '../terrainTextureLabPresets';

describe('terrainTextureLab vignette prototype', () => {
  it('creates deterministic forest vignette output for the same inputs', () => {
    const settings = getDefaultTerrainTextureLabVignetteSettings();
    const first = buildTerrainTextureLabVignettePrototype(
      TERRAIN_TEXTURE_PREVIEW_HEXES,
      TERRAIN_TEXTURE_LAB_BUILTIN_MODELS,
      settings,
      42,
      'forest-a',
    );
    const second = buildTerrainTextureLabVignettePrototype(
      TERRAIN_TEXTURE_PREVIEW_HEXES,
      TERRAIN_TEXTURE_LAB_BUILTIN_MODELS,
      settings,
      42,
      'forest-a',
    );

    expect(second).toEqual(first);
  });

  it('creates center keepout plus six soft-fill ring zones per targeted forest hex', () => {
    const settings = getDefaultTerrainTextureLabVignetteSettings();
    const result = buildTerrainTextureLabVignettePrototype(
      TERRAIN_TEXTURE_PREVIEW_HEXES,
      TERRAIN_TEXTURE_LAB_BUILTIN_MODELS,
      settings,
      42,
      'forest-a',
    );

    expect(result.summary.targetHexIds).toEqual(['forest-a']);
    expect(result.zoneRules).toHaveLength(7);
    expect(result.zoneRules.filter(zone => zone.mode === 'hard_keepout')).toHaveLength(1);
    expect(result.zoneRules.filter(zone => zone.mode === 'soft_fill')).toHaveLength(6);
    expect(result.slotAnchors.filter(anchor => anchor.occupied)).toHaveLength(1);
  });

  it('creates a clickable landmark plus nonzero filler for a forest vignette', () => {
    const settings = getDefaultTerrainTextureLabVignetteSettings();
    const result = buildTerrainTextureLabVignettePrototype(
      TERRAIN_TEXTURE_PREVIEW_HEXES,
      TERRAIN_TEXTURE_LAB_BUILTIN_MODELS,
      settings,
      42,
      'forest-a',
    );

    expect(result.clickTargets).toHaveLength(1);
    expect(result.clickTargets[0]?.hexId).toBe('forest-a');
    expect(result.clickTargets[0]?.modelId).toBe('builtin-village');
    expect(result.fillerDots.length).toBeGreaterThan(40);
    expect(result.autoPlacements.some(placement => placement.modelId === 'builtin-village')).toBe(true);
    // Filler trees are now rendered via ChunkedFillerLayer, not autoPlacements
    expect(result.autoPlacements.some(placement => /oak|elm|birch/.test(placement.modelId))).toBe(false);
  });

  it('can target all forest sample hexes when scope is widened', () => {
    const settings = {
      ...getDefaultTerrainTextureLabVignetteSettings(),
      scope: 'all_forests' as const,
    };
    const result = buildTerrainTextureLabVignettePrototype(
      TERRAIN_TEXTURE_PREVIEW_HEXES,
      TERRAIN_TEXTURE_LAB_BUILTIN_MODELS,
      settings,
      42,
      'grass-a',
    );

    expect(result.summary.targetHexIds).toEqual(['forest-a', 'forest-b']);
    expect(result.clickTargets).toHaveLength(2);
  });
});
