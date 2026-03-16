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

/** Eye domain bonus weight (higher Eye = more perceptive) */
export const EYE_PERCEPTION_WEIGHT = 0.15;

/** Shadow domain penalty weight (higher Shadow = stealthier) */
export const SHADOW_STEALTH_WEIGHT = 0.15;

/** Minimum detection chance (always some chance of encounter) */
export const DETECTION_CHANCE_FLOOR = 0.01;

/** Maximum detection chance (never guaranteed) */
export const DETECTION_CHANCE_CEILING = 0.95;

/** Event significance for colocation detection events */
export const COLOCATION_EVENT_SIGNIFICANCE = 0.6;
