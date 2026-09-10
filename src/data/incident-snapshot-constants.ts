/**
 * Incident-snapshot constants (THR-1134).
 *
 * Every tunable the incident bundle and its flight recorder read lives here, so
 * changing what a snapshot carries is changing a number rather than editing a
 * module (NFP #1).
 *
 * Sizing rationale is measured, not guessed — seed 42 / medium / tick 100:
 * `recentEvents` is 26,486 bytes at 100 entries, so a 1000-entry ring is roughly
 * 260 KB, which is the dominant term in the incident tier and still comfortably
 * attachable to a chat message.
 */

/** Schema version a reader checks first. Bump when a section's shape changes. */
export const INCIDENT_BUNDLE_VERSION = 1;

/**
 * Tick events kept by the flight recorder, beyond `recentEvents`' own 100.
 *
 * 100 entries is three to five ticks of play; by the time a world looks wrong the
 * cause has usually rolled off. ~260 KB at the measured 26 KB per 100 entries.
 */
export const INCIDENT_EVENT_RING_SIZE = 1000;

/**
 * Per-tick census rows kept by the flight recorder (~40 KB).
 *
 * At twelve ticks to the day this is roughly twenty-five days of play — enough
 * for a growth curve to be visible as a line rather than guessed from one sample.
 */
export const INCIDENT_METRICS_RING_SIZE = 300;

/** Edge hops from a focus entity whose neighbour nodes are included. */
export const INCIDENT_NEIGHBOURHOOD_DEPTH = 1;

/** Cap on neighbour nodes gathered per focus entity. */
export const INCIDENT_NEIGHBOURHOOD_MAX_NODES = 60;

/** Encounter-timeline entries carried per focus actor. */
export const INCIDENT_TIMELINE_TAIL = 200;

/** Whether a caught crash raises the snapshot-prompt toast. */
export const INCIDENT_PROMPT_ON_CRASH = true;

/** Minimum ticks between crash prompts, so a crashing loop prompts once. */
export const INCIDENT_PROMPT_COOLDOWN_TICKS = 60;

/** Download-name stem. */
export const INCIDENT_FILENAME_PREFIX = 'threadbearer-snapshot';

/**
 * Above this serialized size the success toast adds a phrase warning the file may
 * be too large to attach. The figure never renders — Laws 13/14 keep numerals off
 * every player surface; this one lives in the file and on the ticket.
 */
export const INCIDENT_WORLD_TIER_WARN_BYTES = 8_000_000;
