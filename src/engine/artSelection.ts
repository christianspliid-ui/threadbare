/**
 * Art Selection Engine — tag-matched image selection from pre-baked library.
 *
 * Scores library images against request tags by overlap count.
 * Ties broken by seeded PRNG for determinism.
 */

export interface ArtAsset {
  /** Unique asset ID */
  id: string;
  /** Path to the image file (relative to public/) */
  path: string;
  /** Mood/emotional tags for matching */
  tags: readonly string[];
}

const FALLBACK_ART: ArtAsset = {
  id: 'fallback',
  path: '/art/meeting/fallback.webp',
  tags: [],
};

/**
 * Select the best-matching art asset for the given mood tags.
 * Scores by tag overlap count. Ties broken deterministically via seed.
 */
export function selectArt(
  library: readonly ArtAsset[],
  requestTags: readonly string[],
  seed: number,
): ArtAsset {
  if (library.length === 0) return FALLBACK_ART;

  const tagSet = new Set(requestTags);
  let bestScore = -1;
  let bestIdx = 0;

  for (let i = 0; i < library.length; i++) {
    let score = 0;
    for (const tag of library[i].tags) {
      if (tagSet.has(tag)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    } else if (score === bestScore) {
      // Deterministic tie-break: hash index with seed
      const h = ((seed * 2654435761) ^ (i * 2246822519)) >>> 0;
      const hBest = ((seed * 2654435761) ^ (bestIdx * 2246822519)) >>> 0;
      if (h > hBest) {
        bestIdx = i;
      }
    }
  }

  return library[bestIdx];
}
