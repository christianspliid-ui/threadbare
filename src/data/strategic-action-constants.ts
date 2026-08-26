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

/**
 * Default work an undertaking requires when its template authors no
 * `projectDuration` — i.e. the default `progressRequired`.
 *
 * Named for what it is since THR-1292: it was called
 * `STRATEGIC_DEFAULT_PROJECT_TIMEOUT_TICKS` while doing double duty as both the
 * work total and the abandonment timeout, and slice 3 split those. The timeout is
 * now `UNDERTAKING_TIMEOUT_TICKS`; this is work. The value is unchanged, and the
 * checkpoint cadence is pinned to it —
 * `UNDERTAKING_PROGRESS_PER_ADVANCE` × 3 checkpoints = 18.
 */
export const STRATEGIC_DEFAULT_PROJECT_WORK_TICKS = 18;

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

// ─── Undertaking Checkpoints (THR-1292 §2) ──────────────────────────
//
// Checkpoint dice replace passive per-tick progress: an undertaking advances
// because a roll said so, not because a tick elapsed. Every number below is the
// plan's first-guess calibration — retune against the §2 Done-when (non-zero
// halts on both seeds) and record the values used.

/** Ticks between checkpoint dice on an active undertaking */
export const UNDERTAKING_CHECKPOINT_INTERVAL_TICKS = 6;

/**
 * Progress granted per advancing checkpoint.
 *
 * Chosen for parity with the pre-checkpoint world: the default project runs 18
 * ticks at 1 progress/tick, so an always-succeeding agent still finishes in three
 * checkpoints. What changes is variance, not expected duration.
 */
export const UNDERTAKING_PROGRESS_PER_ADVANCE = 6;

/** Difficulty used when a template authors no `checkpointDifficulty` (doc 2 owns per-kind values) */
export const UNDERTAKING_DEFAULT_CHECKPOINT_DIFFICULTY = 0.45;

/** Critical success advances this many times the ordinary step (capped at completion) */
export const UNDERTAKING_CRIT_ADVANCE_MULTIPLIER = 2;

/** Accumulated halts that force the abandon-or-escalate fork */
export const UNDERTAKING_HALT_RATCHET_N = 3;

/** Ratchet points a critical failure adds (an ordinary halt adds 1) */
export const UNDERTAKING_CRIT_FAIL_RATCHET_WEIGHT = 2;

/** Fork weight baseline — the disposition to press on before anything is known about the agent */
export const UNDERTAKING_ESCALATE_BASE = 0.35;

/** Fork weight added while the driving `pursues` ambition edge is still live */
export const UNDERTAKING_ESCALATE_AMBITION_TERM = 0.25;

/** How hard the courage axis pushes the fork (applied to `courage01 − 0.5`) */
export const UNDERTAKING_ESCALATE_COURAGE_WEIGHT = 0.4;

/** Push toward abandon per halt accumulated beyond the ratchet threshold */
export const UNDERTAKING_ESCALATE_HALT_PRESSURE = 0.1;

/** Escalate at or above this weight; abandon below it */
export const UNDERTAKING_ESCALATE_THRESHOLD = 0.5;

/** Stakes raised on escalation — added to the undertaking's checkpoint difficulty */
export const UNDERTAKING_ESCALATE_DIFFICULTY_DELTA = 0.1;

/**
 * Fail-safe backstop replacing the flat 18-tick timeout.
 *
 * Halts now legitimately extend an undertaking's duration and the ratchet is the
 * *designed* exit, so a timeout tuned to the old passive cadence would fire on
 * healthy work. This one only catches undertakings the ratchet somehow never
 * reaches (an actor frozen absent, a deferral loop) — NFP #4, not game feel.
 */
export const UNDERTAKING_TIMEOUT_TICKS = 60;

/**
 * PRNG stream multiplier for checkpoint dice (NFP #3).
 *
 * Deliberately not 59 or 53: `seed + tick*59` already feeds three phases as
 * nominally-independent generators and 53 feeds two, so those streams are
 * correlated. That defect is pre-existing and not widened here.
 */
export const UNDERTAKING_CHECKPOINT_STREAM_MULTIPLIER = 97;

/** Consecutive absence deferrals that convert to one halt — neglect with teeth, no new movement AI */
export const UNDERTAKING_ABSENCE_DEFERRAL_LIMIT = 3;

/**
 * Default for `requiresLocation` when a template authors none.
 *
 * **The plan (§5) names `true` here; this is `false`, and the reversal is
 * measured.** The plan's stated reason for the conversion default is to *preserve
 * today's parallel behaviour* — and today an undertaking advances wherever its
 * owner happens to be standing, because nothing moves an agent toward its stage.
 * Moving them is explicitly docs 3/5 territory (binder and board), so with `true`
 * the gate has nothing to wait for.
 *
 * Measured on a 150-tick medium run before the flip: of 736 checkpoints on seed 42
 * only **50 rolled** — 686 deferred `actor_absent`; on seed 99, 15 of 668. A probe
 * at tick 80 found **0 of 45** active undertakings with their owner at the stage.
 * That is not the variance §2 designs for ("today's expected duration, now with
 * variance"); it is a system whose dice are 93–97% inert, whose undertakings die
 * of absence rather than of failure, and whose band table would ship untested in
 * the world.
 *
 * The gate itself is fully implemented and tested — only its *default* is off.
 * Doc 2 turns it on per-kind once doc 3's binder can bring an actor to a stage —
 * TODO(THR-1294), which carries the census above as its acceptance evidence.
 */
export const UNDERTAKING_DEFAULT_REQUIRES_LOCATION = false;

/** Default for `canRunBeside` when a template authors none (preserves pre-flag behavior) */
export const UNDERTAKING_DEFAULT_CAN_RUN_BESIDE = true;
