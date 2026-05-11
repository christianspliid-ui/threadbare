/**
 * Foreshadowing resolver constants — tunable values for encounter foreshadowing (THR-389).
 * All magic numbers live here so game feel = changing a number, not rewriting logic (NFP #1).
 */

/** Maximum sentences in a foreshadowing variant. Authoring bound — truncated if exceeded. @range 3-6 */
export const FORESHADOWING_MAX_SENTENCES = 4;

/** Minimum sentences in a foreshadowing variant. Content-validation warning threshold. @range 1-3 */
export const FORESHADOWING_MIN_SENTENCES = 2;

/** Intelligence score below which tier resolves as 'unknown' (no reliable information). @range 0-20 */
export const INTEL_TIER_UNKNOWN_BELOW = 10;

/** Intelligence score below which tier resolves as 'rumor' (unreliable hearsay). @range 15-40 */
export const INTEL_TIER_RUMOR_BELOW = 30;

/** Intelligence score below which tier resolves as 'briefed' (reliable secondhand). >= → 'expert'. @range 50-80 */
export const INTEL_TIER_BRIEFED_BELOW = 70;

/** Ticks to look back when attributing player interventions to an encounter choice. @range 6-24 */
export const INTERVENTION_ATTRIBUTION_WINDOW = 12;

/** Per-session LRU cap on cached foreshadowing results. @range 128-512 */
export const FORESHADOWING_CACHE_MAX_ENTRIES = 256;
