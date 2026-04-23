import { TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS } from '../terrainTextureLabPresets';

export interface FillerProfile {
  id: string;
  modelUrls: string[];
  modelWeights: number[];
  densityFree: number;
  densitySoft: number;
  minSpacingFractionFree: number;
  minSpacingFractionSoft: number;
  scaleMinFree: number;
  scaleMaxFree: number;
  scaleMinSoft: number;
  scaleMaxSoft: number;
}

const C = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS;

export const FILLER_PROFILES: Record<string, FillerProfile> = {
  temperate_forest: {
    id: 'temperate_forest',
    modelUrls: [
      '/models/deciduous-oak.glb',
      '/models/deciduous-elm.glb',
      '/models/deciduous-birch.glb',
    ],
    modelWeights: [1, 1, 1],
    densityFree: C.FOREST_FREE_DENSITY_PER_HEX,
    densitySoft: C.FOREST_SOFT_DENSITY_PER_HEX,
    minSpacingFractionFree: C.FOREST_FREE_MIN_SPACING_FRACTION,
    minSpacingFractionSoft: C.FOREST_SOFT_MIN_SPACING_FRACTION,
    scaleMinFree: C.FOREST_FREE_SCALE_MIN,
    scaleMaxFree: C.FOREST_FREE_SCALE_MAX,
    scaleMinSoft: C.FOREST_SOFT_SCALE_MIN,
    scaleMaxSoft: C.FOREST_SOFT_SCALE_MAX,
  },
  light_forest: {
    id: 'light_forest',
    modelUrls: [
      '/models/deciduous-oak.glb',
      '/models/deciduous-elm.glb',
      '/models/deciduous-birch.glb',
    ],
    modelWeights: [1, 1, 2],
    densityFree: C.SCATTER_DENSITY_LIGHT_FOREST_FREE,
    densitySoft: C.SCATTER_DENSITY_LIGHT_FOREST_SOFT,
    minSpacingFractionFree: C.FOREST_FREE_MIN_SPACING_FRACTION,
    minSpacingFractionSoft: C.FOREST_SOFT_MIN_SPACING_FRACTION,
    scaleMinFree: C.FOREST_FREE_SCALE_MIN * 0.8,
    scaleMaxFree: C.FOREST_FREE_SCALE_MAX * 0.85,
    scaleMinSoft: C.FOREST_SOFT_SCALE_MIN * 0.8,
    scaleMaxSoft: C.FOREST_SOFT_SCALE_MAX * 0.85,
  },
  swamp: {
    id: 'swamp',
    modelUrls: [
      '/models/deciduous-elm.glb',
      '/models/deciduous-birch.glb',
    ],
    modelWeights: [2, 1],
    densityFree: C.SCATTER_DENSITY_SWAMP_FREE,
    densitySoft: C.SCATTER_DENSITY_SWAMP_SOFT,
    minSpacingFractionFree: C.FOREST_FREE_MIN_SPACING_FRACTION,
    minSpacingFractionSoft: C.FOREST_SOFT_MIN_SPACING_FRACTION,
    scaleMinFree: C.FOREST_FREE_SCALE_MIN * 0.85,
    scaleMaxFree: C.FOREST_FREE_SCALE_MAX * 0.9,
    scaleMinSoft: C.FOREST_SOFT_SCALE_MIN * 0.85,
    scaleMaxSoft: C.FOREST_SOFT_SCALE_MAX * 0.9,
  },
};

export const FILLER_PROFILE_TERRAIN_TYPES: Set<string> = new Set(Object.keys(FILLER_PROFILES));

export function getFillerProfile(terrainType: string): FillerProfile | null {
  return FILLER_PROFILES[terrainType] ?? null;
}

export function weightedModelUrl(profile: FillerProfile, rng: () => number): string {
  const totalWeight = profile.modelWeights.reduce((sum, w) => sum + w, 0);
  let pick = rng() * totalWeight;
  for (let i = 0; i < profile.modelUrls.length; i++) {
    pick -= profile.modelWeights[i] ?? 1;
    if (pick <= 0) return profile.modelUrls[i] ?? profile.modelUrls[0]!;
  }
  return profile.modelUrls[profile.modelUrls.length - 1]!;
}
