import { TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS } from '../terrainTextureLabPresets';
import type { ResolvedHexFiller } from './VignetteResolver';

interface HexCenter {
  x: number;
  y: number;
}

/**
 * Filters filler specs to the top-N highest-priority hexes.
 * Priority = proximity to scene center * landmark-presence bonus.
 * Hexes beyond the cap are omitted from the returned array — they simply
 * won't have filler instances built, rather than being built and hidden.
 */
export function scoreAndCapFillerChunks(
  specs: ResolvedHexFiller[],
  hexCenters: Map<string, HexCenter>,
  sceneCenterX: number,
  sceneCenterY: number,
  landmarkHexIds: Set<string>,
  maxChunks: number = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.PRIORITY_MAX_FILLER_CHUNKS,
): ResolvedHexFiller[] {
  if (specs.length <= maxChunks) return specs;

  const distances = specs.map(spec => {
    const c = hexCenters.get(spec.hexId);
    if (!c) return 0;
    return Math.hypot(c.x - sceneCenterX, c.y - sceneCenterY);
  });

  const maxDist = Math.max(...distances, 1);

  const scored = specs.map((spec, i) => {
    const distNorm = distances[i] / maxDist;
    const inverseDistanceWeight = 1 - distNorm * TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.PRIORITY_DISTANCE_FALLOFF;
    const landmarkWeight = landmarkHexIds.has(spec.hexId)
      ? TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.PRIORITY_LANDMARK_WEIGHT
      : 1;
    return { spec, score: inverseDistanceWeight * landmarkWeight };
  });

  scored.sort((a, b) => b.score - a.score);

  if (import.meta.env.DEV) {
    console.debug('[vignette.priority]', {
      total: specs.length,
      cap: maxChunks,
      kept: scored.slice(0, maxChunks).map(s => ({
        hexId: s.spec.hexId,
        score: s.score.toFixed(3),
        hasLandmark: landmarkHexIds.has(s.spec.hexId),
      })),
      dropped: scored.slice(maxChunks).map(s => s.spec.hexId),
    });
  }

  return scored.slice(0, maxChunks).map(s => s.spec);
}
