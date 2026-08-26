// src/data/strategic-action-constants.ts
//
// All tunable weights, caps, cooldowns, cadence, and catalyst constants
// for the ambition-driven strategic action system.
//
// NFP #1 (Tunability): Every magic number is a named constant.

// ─── Feature Gate ───────────────────────────────────────────────────

/** Rollout gate for safe A/B verification against encounter-only behavior */
export const ENABLE_STRATEGIC_ACTIONS = true;

// ─── Candidate Generation Caps ──────────────────────────────────────

/** Hard cap on proactive candidates generated per actor per tick */
export const STRATEGIC_MAX_CANDIDATES_PER_ACTOR = 12;

/** Prevent a single ambition from flooding the board */
export const STRATEGIC_MAX_CANDIDATES_PER_AMBITION = 5;

// ─── Scoring Weights ────────────────────────────────────────────────
// These sum > 1.0 intentionally — they are relative weights, not a partition.

/** Reward actions that materially reshape graph state */
export const STRATEGIC_WORLD_IMPACT_WEIGHT = 0.24;

/** Reward steps that unblock ambition progress */
export const STRATEGIC_BLOCKER_RELIEF_WEIGHT = 0.22;

/** Reward actions likely to seed follow-up encounters */
export const STRATEGIC_CATALYST_VALUE_WEIGHT = 0.16;

/** Reward actions that fit the actor's archetype and domain profile */
export const STRATEGIC_ROLE_FIT_WEIGHT = 0.12;

/** Penalize proactive steps that demand unattractive travel */
export const STRATEGIC_TRAVEL_PENALTY_WEIGHT = 0.14;

/** Penalize same-template spam in recent history and candidate boards */
export const STRATEGIC_VARIETY_PENALTY_WEIGHT = 0.18;

/** Elevate upkeep/contest actions when the actor risks losing control */
export const STRATEGIC_CONTROL_PRESSURE_WEIGHT = 0.20;

// ─── Project and Control Cadence ────────────────────────────────────

/** Baseline project advancement cadence before modifiers */
export const STRATEGIC_PROJECT_PROGRESS_PER_TICK = 1;

/** Fail-soft timeout for stalled multi-tick projects */
export const STRATEGIC_DEFAULT_PROJECT_TIMEOUT_TICKS = 18;

/** Window kept for player/debug strategic history summaries */
export const STRATEGIC_HISTORY_WINDOW_TICKS = 120;

/** Default chance for eligible completions to emit a follow-up encounter seed */
export const STRATEGIC_CATALYST_SEED_CHANCE = 0.65;

/** Ticks a planted catalyst seed waits before it may spawn (narrative pacing) */
export const STRATEGIC_CATALYST_SEED_DELAY_TICKS = 3;

/** Priority carried by catalyst seeds (1.0 = neutral) — a follow-up, not an interrupt */
export const STRATEGIC_CATALYST_SEED_PRIORITY = 0.6;

/** Ticks before unattended control states begin degrading */
export const STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS = 10;

/** Degradation rate per tick after grace period expires (0-1 scale) */
export const STRATEGIC_CONTROL_DEGRADATION_RATE = 0.05;

/**
 * Ticks an actor must wait before re-claiming a target whose control stance they
 * themselves let degrade to collapse (THR-1286).
 *
 * Without this, a collapsed stance was re-proposed every tick forever: the dead record
 * pinned `controlPressure` at its maximum, `claim_control` wrote no history so the
 * variety guard never saw it, and the stale `controls` edge made every re-claim fail
 * `already_controls` — a decision spent on a guaranteed no-op. Measured on seed 42 at
 * 150 ticks: 811 of 2053 spotlight decisions (39.5%) were `strategic_control`, and they
 * produced 17 successful claims.
 *
 * Sized against the neglect cycle it gates: grace (10) plus 1/`DEGRADATION_RATE` (20)
 * ticks is one full claim-to-collapse arc, so the cooldown makes losing a stance cost
 * roughly as long as holding it earned. Must stay below `STRATEGIC_HISTORY_WINDOW_TICKS`
 * — the collapse record the cooldown reads lives in that window and is pruned with it.
 */
export const STRATEGIC_CONTROL_RECLAIM_COOLDOWN_TICKS = 30;

// ─── Normalization ──────────────────────────────────────────────────

/** Score floor — strategic candidates below this are rejected */
export const STRATEGIC_SCORE_FLOOR = 0.08;

/** Normalization multiplier to bring strategic scores into encounter score range */
export const STRATEGIC_ENCOUNTER_SCORE_BRIDGE = 0.85;

// ─── Sacred routes (THR-1184) ───────────────────────────────────────

/**
 * Encounter templates a consecrated pilgrimage route unlocks at its destination.
 *
 * `strategic_establish_sacred_route` targets `['shrine', 'temple', 'town', 'city']`, but
 * every pilgrimage encounter is gated `['shrine', 'temple']` — so the two settlement
 * targets consecrated a route to a place that could never host the pilgrimage its own
 * completion prose promises ("Pilgrims will follow where the faithful walked first").
 * A location carrying an incoming `sacred_route` edge pools these regardless of subtype:
 * the eight ticks and 30 wealth buy the destination the encounter, which is the whole
 * fiction of the verb.
 *
 * Tunable (NFP #1): widening a route's payoff is editing this list, not the cache.
 * Ids are resolved through `getAnyEncounterById` and silently skipped when unknown,
 * so a retired template degrades to "no supplement" rather than breaking the pool.
 */
export const SACRED_ROUTE_DESTINATION_ENCOUNTER_IDS: readonly string[] = [
  'encounter.pilgrimage_trial',
];

/**
 * Edge types whose creation changes what encounters a location can host.
 *
 * Minting one of these must refresh the destination's encounter-cache entries, or the
 * new pool is invisible until some unrelated system happens to invalidate the cache.
 * Measured on seed 42 / medium at tick 120 before this wiring existed: four
 * `sacred_route` edges, of which exactly **one** destination had its pilgrimage pooled —
 * the other three sat inert behind a cache built before their route was minted, which is
 * the same "changes nothing" defect THR-1184 set out to fix, only harder to see.
 */
export const ENCOUNTER_POOL_INVALIDATING_EDGE_TYPES: ReadonlySet<string> = new Set([
  'sacred_route',
]);
