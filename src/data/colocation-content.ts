/**
 * Colocation Detection Content Data
 *
 * Base discovery chances and stat modifier weights for agent-pair detection.
 */

/** Base discovery chance per tick for agents in the same hex (different locations) */
export const ENCOUNTER_BASE_CHANCE_HEX = 0.05;

/** Base discovery chance per tick for agents at the same location */
export const ENCOUNTER_BASE_CHANCE_LOCATION = 0.10;

/** Base discovery chance per tick for agents at the same sublocation */
export const ENCOUNTER_BASE_CHANCE_SUBLOCATION = 0.20;

// THR-1576: both weights multiply a **reach share** (0–1, `computeReachShare`), not the
// raw capability. At the old 0.15 × raw (≈ 10–40) half of all capable pairs sat at the
// floor or the ceiling. Re-tuned on `npm run census:colocation` (seeds 42 / 99, medium,
// 60 ticks): capable pairs now spread p10/p50/p90 ≈ 0.05/0.18/0.55 with ≤ 7% pinned,
// and the world's expected detections per tick stay within ±10% of the old rate.
// Eye outweighs Shadow on purpose: noticing someone beside you is the default, and a
// symmetric pair cancels to the base chance and halves the rate.

/** Eye reach-share bonus weight (higher Eye = more perceptive) */
export const EYE_PERCEPTION_WEIGHT = 0.8;

/** Shadow reach-share penalty weight (higher Shadow = stealthier) */
export const SHADOW_STEALTH_WEIGHT = 0.4;

/** Minimum detection chance (always some chance of encounter) */
export const DETECTION_CHANCE_FLOOR = 0.01;

/** Maximum detection chance (never guaranteed) */
export const DETECTION_CHANCE_CEILING = 0.95;

/** Event significance for colocation detection events */
export const COLOCATION_EVENT_SIGNIFICANCE = 0.6;
