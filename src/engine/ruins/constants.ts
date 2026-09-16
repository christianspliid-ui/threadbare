/**
 * Tunable constants for the Ruins Layer (THR-149).
 * All magic numbers live here — changing game feel = changing a number.
 */

import type { AttentionTier } from '../../types/attention';
import type { CluePrecision, ClueSource } from '../../types/knowledge';

// ── Clue decay ───────────────────────────────────────────────────────────────

/**
 * TTL in ticks for vague-precision clues.
 *
 * 30, not 20 (THR-1506): the quest-hook sweep runs every
 * `RUIN_QUEST_GENERATION_INTERVAL_TICKS` (30) and `clue_decay` runs *before*
 * `ruin_quest_hooks` in the same tick, so at TTL 20 a rumour heard in the first
 * ten ticks after a sweep expired before the next one could read it — a third
 * of all vague clues died unseen by construction. One posting interval means
 * every rumour lives to be read at least once.
 */
export const CLUE_MAX_AGE_TICKS_VAGUE = 30;
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
//
// Read by the rumour sweep (`clueRumors.ts`, THR-1506). The ruins design meant
// these to drive four clue-bearing encounters (`ruins.glossed_tome`,
// `ruins.drunk_cartographer`, …) that were never authored, so until THR-1506
// nothing read them and no organic clue ever reached a ruin.

/** Base probability of spawning a clue from a library encounter */
export const CLUE_SPAWN_LIBRARY_BASE = 0.6;
/** Base probability of spawning a clue from a tavern encounter */
export const CLUE_SPAWN_TAVERN_BASE = 0.35;
/** Base probability of spawning a clue from a treasure-map encounter (no organic producer yet) */
export const CLUE_SPAWN_TREASURE_MAP_BASE = 0.9;
/** Base probability of spawning a clue from a spy-debrief encounter */
export const CLUE_SPAWN_SPY_DEBRIEF_BASE = 0.5;

// ── Clue lead strength (THR-1506) ────────────────────────────────────────────
//
// What a `knows_clue_of` edge's `magnitude` measures: the *strength of the lead*,
// by precision — not the size of the ruin. Before THR-1506 the aftermath path
// wrote `ruinMagnitude` here while the strategic path (`spawnClue`) wrote a lead
// strength, and `getEvidenceStrength` summed the two as one unit. Under the old
// semantics a minor ruin's single lead (≤ 0.33) could never clear
// `CLUE_QUEST_THRESHOLD`, so the entry-tier contract `ag.quest.ruin_delve` was
// unreachable by construction and only lost-city contracts could ever post.
//
// A vague lead is exactly the threshold: a guild posts on one rumour. That is
// the cheap step by design — the delve itself still needs a `located` clue
// (`delveVariant.ts` admission scan), so observe → clue → delve stays a climb.

/** Lead strength written for a `vague` clue — one rumour meets `CLUE_QUEST_THRESHOLD`. */
export const CLUE_LEAD_STRENGTH_VAGUE = 0.5;
/** Lead strength written for a `narrowed` clue. */
export const CLUE_LEAD_STRENGTH_NARROWED = 0.75;
/** Lead strength written for a `located` clue. */
export const CLUE_LEAD_STRENGTH_LOCATED = 1.0;

export const CLUE_LEAD_STRENGTH_BY_PRECISION: Readonly<Record<CluePrecision, number>> = {
  vague: CLUE_LEAD_STRENGTH_VAGUE,
  narrowed: CLUE_LEAD_STRENGTH_NARROWED,
  located: CLUE_LEAD_STRENGTH_LOCATED,
};

// ── Clue rumour sweep (THR-1506) ─────────────────────────────────────────────
//
// The organic feed: every `CLUE_RUMOR_INTERVAL_TICKS`, each settlement owning a
// rumour-bearing place rolls `base × CLUE_RUMOR_SWEEP_SCALE` for a `vague` clue
// about its nearest ruin within `CLUE_RUMOR_RUIN_RADIUS` hexes. Calibrated on
// seed 42 / medium: 38 settlements own an inn, 8 a tavern, 3 a library — at
// scale 0.1 that is ~1.4 expected rumours per sweep before the cap, ~20 per
// 175-tick run, against 0 organic quest hooks before this phase existed.

/** Ticks between rumour sweeps. Matches `CLUE_DECAY_CHECK_INTERVAL` so a rumour's age is whole sweeps. */
export const CLUE_RUMOR_INTERVAL_TICKS = 10;
/** Multiplier on a place's per-encounter base probability to get its per-sweep probability. */
export const CLUE_RUMOR_SWEEP_SCALE = 0.1;
/** Max hex distance from a settlement to the ruin its rumour points at — rumours are local. */
export const CLUE_RUMOR_RUIN_RADIUS = 6;
/** Global cap on rumours per sweep, so a large map is not a flood of leads. */
export const CLUE_RUMOR_MAX_PER_SWEEP = 3;

/**
 * Which places carry rumours, and which base probability each reads. A
 * settlement rolls once, on the strongest place it owns (`findRumorSourceAt`).
 */
export const CLUE_RUMOR_PLACE_SOURCES: ReadonlyArray<{
  placeTypeId: string;
  source: ClueSource;
  base: number;
}> = [
  { placeTypeId: 'sublocation-type.library',             source: 'library_research', base: CLUE_SPAWN_LIBRARY_BASE },
  { placeTypeId: 'sublocation-type.archive',             source: 'library_research', base: CLUE_SPAWN_LIBRARY_BASE },
  { placeTypeId: 'sublocation-type.spy-network',         source: 'spy_debrief',      base: CLUE_SPAWN_SPY_DEBRIEF_BASE },
  { placeTypeId: 'sublocation-type.intelligence-bureau', source: 'spy_debrief',      base: CLUE_SPAWN_SPY_DEBRIEF_BASE },
  { placeTypeId: 'sublocation-type.tavern',              source: 'tavern_rumor',     base: CLUE_SPAWN_TAVERN_BASE },
  { placeTypeId: 'sublocation-type.inn',                 source: 'tavern_rumor',     base: CLUE_SPAWN_TAVERN_BASE },
];

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

// ── Ruin transformation multipliers (THR-153) ────────────────────────────────

/** Multiplier on base elder-essence reward when the ruin is transformed (full reward). */
export const TRANSFORMED_ELDER_ESSENCE_MULTIPLIER = 1.0;
/** Multiplier when the ruin is consumed (scar outcome — half reward). */
export const CONSUMED_ELDER_ESSENCE_MULTIPLIER = 0.5;
/** Multiplier when the consequence roll is catastrophic (quarter reward for closure). */
export const CATASTROPHIC_ELDER_ESSENCE_MULTIPLIER = 0.25;
/** Ticks a "Haunted by Scar" condition lingers on the delve agent after a consumed outcome. */
export const SCAR_CONDITION_ATTACH_DURATION = 40;

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
/**
 * The one faction definition whose halls commission ruin delves (THR-1026).
 *
 * Ruled 2026-09-11: an expedition into a ruin is what an adventurers' guild
 * exists to commission, and the three quest templates are that guild's by voice
 * and id (`ag.quest.ruin_delve`, `ag.senior.deep_expedition`, `ag.elite.lost_city`).
 * Widening the posting phase without re-authoring them would put the wrong
 * guild's words on the notice board.
 *
 * This is deliberately narrower than the *hall* predicate — THR-818 opened the
 * Guild Postings surface to all twelve definitions' halls, and that stands. What
 * this constant governs is who *posts*, not who has a board. Other factions'
 * halls show a board that says so, until a faction-specific quest kind gives
 * them something of their own to post.
 */
export const RUIN_QUEST_POSTING_FACTION_DEF_ID = 'adventuring_guild';
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
