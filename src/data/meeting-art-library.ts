/**
 * Meeting Encounter Art Library — pre-baked abstract mood images.
 *
 * ART MANAGER: Add images to public/art/meeting/ and register them
 * here with emotional tags for the selection engine.
 */

import type { ArtAsset } from '../engine/artSelection';

/** Candidate vignette mood images (Step 1). */
export const CANDIDATE_ART: readonly ArtAsset[] = [];

/** Dilemma mood images (Step 2). */
export const DILEMMA_ART: readonly ArtAsset[] = [];

/** Spark/bond images (Step 3). One per Hunger. */
export const SPARK_ART: readonly ArtAsset[] = [];
