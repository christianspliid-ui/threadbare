import { TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS } from '../terrainTextureLabPresets';

export type LodTier = 'continental' | 'regional' | 'local';

export interface LodState {
  tier: LodTier;
  fillerVisible: boolean;
  shaderOctaveCount: number;
}

export class VignetteLodController {
  private prevTier: LodTier | null = null;

  evaluate(zoom: number): LodState {
    const fillerVisible = zoom >= TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.FILLER_HIDE_ZOOM_THRESHOLD;
    const reducedOctaves = zoom < TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.SHADER_REDUCED_OCTAVE_ZOOM_THRESHOLD;

    let tier: LodTier;
    if (zoom < 2) {
      tier = 'continental';
    } else if (!fillerVisible) {
      tier = 'regional';
    } else {
      tier = 'local';
    }

    if (tier !== this.prevTier) {
      this.prevTier = tier;
      if (import.meta.env.DEV) {
        console.debug('[vignette.lod]', {
          tier,
          zoom: zoom.toFixed(2),
          fillerVisible,
          shaderOctaveCount: reducedOctaves
            ? TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LOD_SHADER_OCTAVE_COUNT_REDUCED
            : TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LOD_SHADER_OCTAVE_COUNT_FULL,
        });
      }
    }

    return {
      tier,
      fillerVisible,
      shaderOctaveCount: reducedOctaves
        ? TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LOD_SHADER_OCTAVE_COUNT_REDUCED
        : TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LOD_SHADER_OCTAVE_COUNT_FULL,
    };
  }
}
