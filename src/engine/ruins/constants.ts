/**
 * Tunable constants for the Ruins Layer (THR-149).
 * All magic numbers live here — changing game feel = changing a number.
 */

// ── Clue decay ───────────────────────────────────────────────────────────────

/** TTL in ticks for vague-precision clues */
export const CLUE_MAX_AGE_TICKS_VAGUE = 20;
/** TTL in ticks for narrowed-precision clues */
export const CLUE_MAX_AGE_TICKS_NARROWED = 40;
/** TTL in ticks for located-precision clues */
export const CLUE_MAX_AGE_TICKS_LOCATED = 80;
/** Ticks between clue-decay sweeps */
export const CLUE_DECAY_CHECK_INTERVAL = 10;

// ── Clue receiver-selection bias (Narrative Gravity Channel 1) ───────────────

/** Base receiverScore multiplier for story_beat-tier agents */
export const CLUE_BIAS_TIER_STORY_BEAT = 4.0;
/** Base receiverScore multiplier for shaping-tier agents */
export const CLUE_BIAS_TIER_SHAPING = 2.0;
/** Base receiverScore multiplier for background-tier agents */
export const CLUE_BIAS_TIER_BACKGROUND = 1.0;
/** Additive bonus for player-god-bonded agents */
export const CLUE_BIAS_BONDED_AGENT = 5.0;
/** Additive bonus for portfolio-pinned agents (gated on THR-148 prerequisite) */
export const CLUE_BIAS_PORTFOLIO_PINNED = 3.0;
/** Additive bonus for guild masters / lieutenants / ascendants */
export const CLUE_BIAS_FACTION_LEADER = 2.5;
/** Additive bonus when agent's primary sphere matches the ruin's sphere alignment */
export const CLUE_BIAS_SPHERE_MATCH = 1.5;
/** Additive bonus when agent's backstory-stratum ties to the originating culture */
export const CLUE_BIAS_CULTURE_BACKSTORY_TIE = 3.0;
/** Multiplier applied to agents who received a clue within the recent-clue window */
export const RECEIVER_RECENT_CLUE_PENALTY = 0.5;
/** Ticks within which a second clue receipt triggers the penalty */
export const RECEIVER_RECENT_CLUE_WINDOW_TICKS = 5;
/** Top N candidates considered in weighted-random receiver selection */
export const WEIGHTED_SELECTION_TOP_N = 5;

// ── Clue spawn ────────────────────────────────────────────────────────────────

/** Base probability of spawning a clue from a library encounter */
export const CLUE_SPAWN_LIBRARY_BASE = 0.6;
/** Base probability of spawning a clue from a tavern encounter */
export const CLUE_SPAWN_TAVERN_BASE = 0.35;
/** Base probability of spawning a clue from a treasure-map encounter */
export const CLUE_SPAWN_TREASURE_MAP_BASE = 0.9;
/** Base probability of spawning a clue from a spy-debrief encounter */
export const CLUE_SPAWN_SPY_DEBRIEF_BASE = 0.5;

// ── Delve admission and concurrency ──────────────────────────────────────────

/** Global saga-delve concurrency cap */
export const MAX_SAGA_DELVES_CONCURRENT = 1;
/** Global major-delve cap (also blocked while a saga is active) */
export const MAX_MAJOR_DELVES_CONCURRENT = 2;
/** Global minor-delve cap */
export const MAX_MINOR_DELVES_CONCURRENT = 3;
/** Ticks between admission retries for queued delves */
export const DELVE_ADMISSION_RETRY_INTERVAL = 5;
/** Max ticks a delve can sit queued before abandonment */
export const DELVE_ADMISSION_EXPIRY_TICKS = 40;
/** Ticks per beat for minor delves (2-beat compressed arc) */
export const DELVE_BEAT_DURATION_MINOR = 1;
/** Ticks per beat for major delves (5-beat arc) */
export const DELVE_BEAT_DURATION_MAJOR = 1;
/** Ticks per beat for saga delves (5-beat extended arc) */
export const DELVE_BEAT_DURATION_SAGA = 2;

// ── Delve consequence roll weights ───────────────────────────────────────────

/** Weight for Catastrophic outcome (~10%) */
export const DELVE_CONSEQUENCE_CATASTROPHIC_WEIGHT = 0.10;
/** Weight for Scarred outcome (~25%) */
export const DELVE_CONSEQUENCE_SCARRED_WEIGHT = 0.25;
/** Weight for Marked outcome (~35%) */
export const DELVE_CONSEQUENCE_MARKED_WEIGHT = 0.35;
/** Weight for Triumphant outcome (~20%) */
export const DELVE_CONSEQUENCE_TRIUMPHANT_WEIGHT = 0.20;
/** Weight for Transformed outcome (~10%) */
export const DELVE_CONSEQUENCE_TRANSFORMED_WEIGHT = 0.10;

// ── Emergence Dilemma ─────────────────────────────────────────────────────────

/** Ticks before the default emergence choice is highlighted in UI */
export const EMERGENCE_DECISION_HINT_TICKS = 3;
/** Ticks before the default emergence choice auto-fires (defaults to Let) */
export const EMERGENCE_DECISION_TIMEOUT_TICKS = 8;

// ── Place of Power streams ────────────────────────────────────────────────────

/** Minimum essence-per-tick from a PlaceOfPower */
export const POP_ESSENCE_PER_TICK_MIN = 1;
/** Maximum essence-per-tick from a PlaceOfPower */
export const POP_ESSENCE_PER_TICK_MAX = 3;
/** Ticks a holder can be absent before the stream dies */
export const POP_STREAM_DECAY_WINDOW_TICKS = 10;
/** ruinMagnitude × this = essence cost for the Claim emergence choice */
export const POP_CLAIM_COST_MULTIPLIER = 20;
/** Up-front essence cost for the Corrupt emergence choice */
export const POP_CORRUPT_UP_FRONT_COST = 4;
/** Fraction of the stream the god receives passively under Corrupt */
export const POP_CORRUPT_SIPHON_FRACTION = 0.33;

// ── Ruin worldgen density ─────────────────────────────────────────────────────

/** Per-hex probability for wilderness hexes inside a lost culture's territory */
export const RUIN_DENSITY_WILDERNESS = 0.15;
/** Per-hex probability for settlement hexes */
export const RUIN_DENSITY_SETTLEMENT = 0.10;
/** Per-hex probability for capital / dense-settlement hexes */
export const RUIN_DENSITY_CAPITAL = 0.35;
/** Max ruins per non-capital hex */
export const RUIN_MAX_PER_HEX_STANDARD = 1;
/** Max ruins per capital hex */
export const RUIN_MAX_PER_HEX_CAPITAL = 3;
/** Upper bound of ruinMagnitude for minor-scale ruins */
export const RUIN_MAGNITUDE_MINOR_MAX = 0.33;
/** Upper bound of ruinMagnitude for major-scale ruins */
export const RUIN_MAGNITUDE_MAJOR_MAX = 0.66;
/** Additional magnitude weight for ruins originating from culture capitals */
export const RUIN_SAGA_CAPITAL_BIAS = 0.4;
/** Probability that saga ruins are placed near high-density regions (vs pure territory) */
export const SAGA_RUIN_WORLDGEN_HIGH_DENSITY_BIAS = 0.6;
/** Max hex distance from a high-density region for the placement bias */
export const SAGA_RUIN_PROXIMITY_HEXES = 3;

// ── Narrative Gravity tier gates ─────────────────────────────────────────────

/** ruinMagnitude at or above which saga-tier rules apply */
export const SAGA_MAGNITUDE_THRESHOLD = 0.67;
/** Minimum AttentionTier a candidate must meet to receive a saga clue */
export const SAGA_CLUE_MIN_TIER = 'shaping' as const;

// ── Faction dossier propagation ───────────────────────────────────────────────

/** Ticks before a saga/major clue propagates from elite rank to lower ranks */
export const FACTION_DOSSIER_TIER_DELAY_TICKS = 20;
/** Ticks between faction quest postings for undelved ruins */
export const RUIN_QUEST_GENERATION_INTERVAL_TICKS = 30;
