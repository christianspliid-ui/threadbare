/**
 * Tunable constants for the Ruins Layer (THR-149).
 * All magic numbers live here — changing game feel = changing a number.
 */

import type { AttentionTier } from '../../types/attention';

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
/**
 * Ticks per beat for minor delves (2-beat compressed arc).
 * Both minor and major are 1 tick/beat — they differ in arc *length* (2 vs 5 beats),
 * not beat duration. Only saga beats are extended (2 ticks each).
 */
export const DELVE_BEAT_DURATION_MINOR = 1;
/** Ticks per beat for major delves (5-beat arc). Equal to minor by design — see comment above. */
export const DELVE_BEAT_DURATION_MAJOR = 1;
/** Ticks per beat for saga delves (5-beat extended arc — 10 ticks total) */
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

/** Fraction of the sphere-essence spent to initiate a delve that is refunded on abort (0–1) */
export const DELVE_ABORT_ESSENCE_REFUND_FRACTION = 0.5;

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
/** Upper bound of ruinMagnitude for minor-scale ruins (inclusive: <= 0.33 → minor) */
export const RUIN_MAGNITUDE_MINOR_MAX = 0.33;
/**
 * Upper bound of ruinMagnitude for major-scale ruins (inclusive: <= 0.66 → major).
 * Note: the range (0.66, 0.67) is a deliberate gap matching the v1.1 design doc table
 * (major: 0.34–0.66, saga: 0.67–1.0). Worldgen assigns magnitudes at 2-decimal precision,
 * so no ruin ever lands in this gap in practice. For runtime tier gates, use
 * SAGA_MAGNITUDE_THRESHOLD as the authoritative saga boundary.
 */
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
export const SAGA_CLUE_MIN_TIER: AttentionTier = 'shaping';

// ── Faction dossier propagation ───────────────────────────────────────────────

/** Ticks before a saga/major clue propagates from elite rank to lower ranks */
export const FACTION_DOSSIER_TIER_DELAY_TICKS = 20;
/** Ticks between faction quest postings for undelved ruins */
export const RUIN_QUEST_GENERATION_INTERVAL_TICKS = 30;

// ── Quest hook spawning (PR 8 — THR-156) ─────────────────────────────────────

/** Minimum evidenceStrength (sum of clue magnitudes) to trigger a quest hook */
export const CLUE_QUEST_THRESHOLD = 0.5;
/** Max hex distance from ruin to nearest Adventurer's Guild hall for a hook to fire */
export const GUILD_QUEST_RADIUS = 5;
/** Ticks between quest hook re-issuances for the same ruin (duplicate prevention) */
export const QUEST_HOOK_COOLDOWN_TICKS = 60;
/** questPriority boost applied to the matching template for Guild members when a hook is active */
export const QUEST_HOOK_PRIORITY_BOOST = 4.0;

// ── Perceive divine action essence costs ─────────────────────────────────────

/** Essence cost (Spirit) for divine.perceive.cast_attention */
export const PERCEIVE_CAST_ATTENTION_COST = 1;
/** Essence cost (Spirit) for divine.perceive.refine_the_hush — primary sphere */
export const PERCEIVE_REFINE_HUSH_COST_SPIRIT = 2;
/** Essence cost (Time) for divine.perceive.refine_the_hush — secondary sphere */
export const PERCEIVE_REFINE_HUSH_COST_TIME = 1;
/** Essence cost (Mind) for divine.perceive.listen_for_the_name — primary sphere */
export const PERCEIVE_LISTEN_NAME_COST_MIND = 1;
/** Essence cost (Star) for divine.perceive.listen_for_the_name — secondary sphere */
export const PERCEIVE_LISTEN_NAME_COST_STAR = 1;
/** Essence cost (Mind) for divine.perceive.read_the_threads — primary sphere */
export const PERCEIVE_READ_THREADS_COST_MIND = 1;
/** Essence cost (Time) for divine.perceive.read_the_threads — secondary sphere */
export const PERCEIVE_READ_THREADS_COST_TIME = 1;
/** Essence cost (Time) for divine.perceive.taste_the_wake — primary sphere */
export const PERCEIVE_TASTE_WAKE_COST_TIME = 2;
/** Essence cost (Spirit) for divine.perceive.taste_the_wake — secondary sphere */
export const PERCEIVE_TASTE_WAKE_COST_SPIRIT = 1;

// ── Relay divine action essence costs ────────────────────────────────────────

/** Essence cost (Mind) for divine.relay.compose_a_clue — primary sphere */
export const RELAY_COMPOSE_CLUE_COST_MIND = 1;
/** Essence cost (secondary sphere, matching clue alignment) for divine.relay.compose_a_clue */
export const RELAY_COMPOSE_CLUE_COST_SPHERE = 1;
/** Essence cost (Mind) for divine.relay.whisper_direction */
export const RELAY_WHISPER_DIRECTION_COST = 1;
