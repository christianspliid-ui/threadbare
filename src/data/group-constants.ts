/**
 * Group (Company) Constants — THR-74
 *
 * Every tunable number for the group/company layer lives here (NFP #1).
 * Changing group feel = changing a number in this file, never rewriting logic.
 *
 * Player-facing vocabulary note: the word is **company** (or the generated proper
 * name). "Party" is an internal `groupType` value only and must never reach prose
 * or UI — see THR-734 for the UL entries.
 */

// ─── Membership ──────────────────────────────────────────────────────

/** Hard cap on members in one company. */
export const GROUP_MAX_MEMBERS = 10;

/** Below this an active company auto-dissolves (reason `undersize`). */
export const GROUP_MIN_MEMBERS = 2;

// ─── Formation ───────────────────────────────────────────────────────

/** Per-tick formation roll for an eligible colocated set. */
export const GROUP_FORMATION_BASE_CHANCE = 0.04;

/** Formation roll multiplier when the candidate set stands at a tavern. */
export const GROUP_FORMATION_TAVERN_MULT = 2.0;

/** Minimum pairwise compatibility score required to enter a forming set. */
export const GROUP_FORMATION_COMPAT_MIN = 0.35;

/**
 * Minimum eligible colocated agents before the scan considers a location at all.
 *
 * Tuned down from the plan's proposed 3 against the 30-tick CLI smoke
 * (`--seed 42 --map medium`): only ~17 spotlight individuals hold a position at
 * once, spread across 650+ locations, so no location ever reached three and the
 * scan examined zero candidate sets. Two is also the floor that makes sense —
 * it equals {@link GROUP_MIN_MEMBERS}, so every set the scan looks at is one that
 * could actually become a company.
 */
export const GROUP_FORMATION_MIN_COLOCATED = 2;

// ─── Movement decision modes ─────────────────────────────────────────

/** Leader's vote weight in `party`-mode movement aggregation. */
export const GROUP_LEADER_VOTE_WEIGHT = 1.5;

/** Injected score weight of the faction objective for `faction_band` companies. */
export const GROUP_FACTION_OBJECTIVE_WEIGHT = 2.5;

/** Personal-vs-chosen candidate score gap that registers as dissent. */
export const GROUP_DISSENT_MARGIN = 0.25;

// ─── Cohesion deltas ─────────────────────────────────────────────────

/** Cohesion delta applied per registered dissent. */
export const GROUP_DISSENT_COHESION_HIT = -0.04;

/** Starting cohesion before formation-quality adjustment. */
export const GROUP_COHESION_START_BASE = 0.55;

/** Company encounter success (clean/critical). */
export const GROUP_COHESION_SUCCESS_DELTA = 0.06;

/** Company encounter failure / critical failure. */
export const GROUP_COHESION_FAILURE_DELTA = -0.08;

/** Positive member-to-member social encounter. */
export const GROUP_COHESION_SOCIAL_DELTA = 0.03;

/** A member died. */
export const GROUP_COHESION_DEATH_DELTA = -0.15;

// ─── Cohesion thresholds (prose-state ladder) ────────────────────────
//
// UI reads *states*, never numbers: bound / holding / frayed / breaking.
// DebugPanel is the one place numbers are shown.

/** Below this the fray-state drama pool activates (prose state `frayed`). */
export const GROUP_FRAY_THRESHOLD = 0.4;

/** Below this dissolution triggers; between it and fray the state reads `breaking`. */
export const GROUP_DISSOLUTION_THRESHOLD = 0.15;

/** At or above this the prose state is `bound` and the resolution bonus applies. */
export const GROUP_COHESION_BOUND_THRESHOLD = 0.75;

// ─── Resolution ──────────────────────────────────────────────────────

/** Extra additive resolution bonus on company steps at `bound` cohesion. */
export const GROUP_BOUND_RESOLUTION_BONUS = 0.03;

/** Assist bonus contributed per qualifying non-acting member. */
export const GROUP_ASSIST_PER_MEMBER = 0.05;

/** Assist bonus cap per step, regardless of member count. */
export const GROUP_ASSIST_CAP = 0.15;

/** Member tier in the step's Reach required to qualify as an assist. */
export const GROUP_ASSIST_MIN_TIER = 2;

// ─── The Parting (threaded-company dissolution moment) ────────────────

/**
 * Event-feed significance of an authored Parting moment. Higher than the generic
 * 0.55 company-event weight because a threaded company's end is a story beat the
 * player should not miss.
 */
export const GROUP_PARTING_EVENT_SIGNIFICANCE = 0.72;

// ─── The Shared Spoils / Old Wounds (threaded-company fray moment) ─────

/**
 * Event-feed significance of an authored fray moment. Above the generic 0.55
 * company-event weight — a threaded company's turn toward breaking is a story beat
 * — but below The Parting's 0.72, because a fraying can still be mended (Bless this
 * Company, a shared success) where a Parting is final.
 */
export const GROUP_FRAY_EVENT_SIGNIFICANCE = 0.6;

// ─── Divine actions (THR-74 UATs) ────────────────────────────────────

/** Bless this Company — immediate cohesion boost. */
export const BLESS_COMPANY_COHESION_DELTA = 0.2;

/** Bless this Company — dispute-suppression window (24 ticks = 2 in-game days). */
export const BLESS_COMPANY_DURATION_TICKS = 24;

/** Draw Together — convergence-pressure window on the chosen agents' candidates. */
export const DRAW_TOGETHER_DURATION_TICKS = 36;

/** Draw Together — injected candidate-score weight toward the convergence point. */
export const DRAW_TOGETHER_PULL_WEIGHT = 2.0;

/**
 * Draw Together — radius (in hexes) around the anchor within which scattered
 * threaded mortals are pulled. Set one hex past the agent decision spatial-query
 * range (MAX_AWARENESS_HOPS 5 + edge bonus 1 + margin 1 = 7) so a pulled mortal
 * can still perceive candidate encounters toward the convergence hex as they close
 * in — a pull beyond an agent's awareness horizon would bias nothing it can see.
 */
export const DRAW_TOGETHER_RADIUS_HEXES = 8;

/**
 * Draw Together — the ascendant needs at least this many living threaded mortals
 * before the gathering-bonds milestone unlocks the verb. Two is the floor for a
 * company, so this is the first moment "draw them together" has raw material.
 */
export const DRAW_TOGETHER_MIN_THREADED_FOR_UNLOCK = 2;
