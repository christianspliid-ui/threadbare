/**
 * Threat Rating Content Data
 *
 * Tunable weights for hex threat computation.
 * Engine reads these at resolution time — never owns them.
 */

/** Weight of controlling faction's hostility in threat rating */
export const THREAT_FACTION_WEIGHT = 0.4;

/** Weight of hostile agents at location in threat rating */
export const THREAT_HOSTILE_AGENT_WEIGHT = 0.3;

/** Weight of average encounter difficulty in threat rating */
export const THREAT_ENCOUNTER_WEIGHT = 0.2;

/** Weight of culture misalignment in threat rating */
export const THREAT_CULTURE_WEIGHT = 0.1;

/** Hostility threshold above which a cooperation strategy is considered hostile */
export const HOSTILE_STRATEGY_THRESHOLD = 0.5;
