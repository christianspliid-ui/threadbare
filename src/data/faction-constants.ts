/**
 * Faction constants — shared numeric tuning values.
 *
 * Extracted from faction-definitions.ts to break the circular import:
 *   faction-definitions.ts → *-definition.ts → faction-definitions.ts
 *
 * Import constants from HERE in individual faction definition files.
 * Import FACTION_DEFINITIONS (the array) from faction-definitions.ts.
 */

/** Base decay rate (overridable per faction definition) */
export const FACTION_REPUTATION_DECAY_PER_TICK = 0.003;

/** Reputation on joining (just above zero) */
export const FACTION_JOIN_STARTING_REPUTATION = 0.05;

/** Base reputation per completed quest step */
export const FACTION_QUEST_REPUTATION_GAIN = 0.04;

/** Bonus on full quest completion */
export const FACTION_QUEST_REPUTATION_BONUS_SUCCESS = 0.08;

/** Bonus reputation for passing promotion encounter */
export const FACTION_PROMOTION_REPUTATION_BOOST = 0.05;

/** Reputation at which membership becomes inert */
export const FACTION_EXPULSION_THRESHOLD = 0.0;

/** Minimum guild halls per faction instance */
export const FACTION_GUILD_HALL_COUNT_MIN = 3;

/** Maximum guild halls per faction instance */
export const FACTION_GUILD_HALL_COUNT_MAX = 5;

/** Reputation gain per completed quest step */
export const FACTION_REPUTATION_GAIN_PER_STEP = 0.04;

/** Extra reputation for completing all steps */
export const FACTION_REPUTATION_COMPLETION_BONUS = 0.08;

/** Minimum ticks between rank changes (prevents flicker at boundary) */
export const FACTION_RANK_CHANGE_COOLDOWN_TICKS = 5;

/** Roll margin for "promoted with complication" */
export const PROMOTION_PARTIAL_SUCCESS_MARGIN = 0.10;

/** Ticks before promotion encounter can reappear after failure */
export const PROMOTION_ENCOUNTER_COOLDOWN = 30;

/** Gold reward on promotion */
export const PROMOTION_REWARD_GOLD = 50;

/** AlertBar icon for faction events */
export const FACTION_ALERT_GLYPH = '⚜';

/** Amber/gold, Threadbare palette */
export const FACTION_ALERT_COLOR = '#D4A574';
