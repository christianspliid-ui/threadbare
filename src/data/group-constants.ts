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

// ─── Seeking Companions (threaded-company formation moment) ───────────

/**
 * Event-feed significance of an authored Seeking Companions moment — a *threaded*
 * company's first setting-out. Above the generic 0.55 company-event weight (a
 * threaded company's founding is a story beat) and above the fray's 0.6 (a
 * beginning outweighs a wobble), but below The Parting's 0.72, because a founding
 * is a promise where a Parting is a reckoning.
 */
export const GROUP_SEEKING_EVENT_SIGNIFICANCE = 0.65;

/**
 * Starting-cohesion split that decides whether a Seeking Companions moment is told
 * in the **eager** register (kindred spirits, a quick clasp of hands) or the
 * **wary** one (strangers sizing each other up, a handshake more contract than
 * kinship). Set at the neutral start base so a company that formed above baseline
 * compatibility gathered eagerly, one at or below it warily.
 */
export const GROUP_SEEKING_EAGER_MIN_COHESION = GROUP_COHESION_START_BASE;

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

// ─── Reunite / Sunder (THR-732) ──────────────────────────────────────
//
// The god's two remaining company verbs, completing the triangle around companies:
// Draw Together *causes*, Bless *nurtures*, Reunite *remembers*, Sunder *breaks*.
// Both are timed windows on the company node in the `blessedUntilTick` mould — a
// timestamp written at cast and read by phase code already running, never a new
// system. Bless and Sunder windows may coexist: they pull opposite directions
// through independent reads, and that tug-of-war is deliberately left unresolved.

/**
 * Reunite — convergence + compatibility window on a disbanded company.
 *
 * Matches {@link DRAW_TOGETHER_DURATION_TICKS} because Reunite *consumes* that
 * verb's convergence machinery: the same `convergePullUntilTick` stamp, read by
 * the same `encounterScoring.computeConvergenceBonus`. A window shorter than the
 * pull it rides would leave mortals still walking toward a reunion the company
 * node had already stopped waiting for.
 */
export const REUNITE_DURATION_TICKS = 36;

/**
 * Reunite — compatibility bonus for a pair who both rode with the reuniting
 * company. Large relative to the 0.3 strangers-in-a-tavern baseline: shared
 * history is the strongest argument two people have for trying again, and it must
 * be able to carry a pair over {@link GROUP_FORMATION_COMPAT_MIN} on its own.
 */
export const REUNITE_COMPAT_BONUS = 0.3;

/** Sunder — amplification window. Matches Bless's duration; it is the counterpart. */
export const SUNDER_DURATION_TICKS = 24;

/**
 * Sunder — immediate cohesion hit at cast.
 *
 * Deliberately gentler than Bless's +0.2 boost: breaking should cost the god more
 * effort than mending, and a single cast must not by itself drop a healthy company
 * through the dissolution floor. The window, not the hit, is where Sunder does its
 * work.
 */
export const SUNDER_COHESION_DELTA = -0.15;

/**
 * Event-feed significance of a Reunite reunion — a company the player deliberately
 * called back into being. Above Seeking Companions' 0.65 (a return the god paid for
 * outweighs an organic founding) but below The Parting's 0.72, which stays the
 * loudest company beat because it is the only irreversible one.
 */
export const GROUP_REUNION_EVENT_SIGNIFICANCE = 0.7;

/**
 * Event-feed significance of a Reunite window closing unanswered. Set just above the
 * generic 0.55 company-event weight: the player spent essence on this and must learn
 * it did not take, but an absence should not shout as loudly as a return.
 */
export const GROUP_REUNION_LAPSE_EVENT_SIGNIFICANCE = 0.58;

/** Sunder — multiplier on each dissent's cohesion hit while the window is open. */
export const SUNDER_DISSENT_MULT = 2.0;

/**
 * Sunder — multiplier on a member's leave probability while the window is open.
 *
 * Note this bites only once the company is already below {@link GROUP_FRAY_THRESHOLD},
 * because that is the gate on which leave decisions are evaluated at all, and the
 * underlying rate is proportional to the shortfall *below* that line (a company at
 * or above it has a shortfall of zero, and doubling zero is zero). That is the
 * intended shape: Sunder cracks cohesion with its cast-time hit and then accelerates
 * the fall, rather than teleporting a bound company into mutiny.
 */
export const SUNDER_LEAVE_MULT = 2.0;

// ─── NPC bands (THR-731) ─────────────────────────────────────────────
//
// A band is an ordinary `faction_band` company whose members are a faction's own
// people — the opposition companies fight at their own scale. Bands fray, travel,
// and dissolve through the same `phaseGroups` machinery as any other company;
// the only additions here are *who* forms one and *why*.

/**
 * Ticks between band-formation sweeps — two in-game days (12 ticks/day).
 *
 * Must stay a multiple of `FACTION_ACTION_INTERVAL` (8): the sweep runs inside
 * `phaseFactionActions` *after* that phase's own interval gate, so a band forms
 * alongside the faction's other deliberate acts rather than between them. A value
 * coprime with 8 would silently alias to their LCM instead.
 */
export const BAND_SPAWN_INTERVAL = 24;

/** Per-sweep formation roll for an eligible faction. */
export const BAND_SPAWN_CHANCE = 0.15;

/** Concurrent live bands one faction may field. */
export const MAX_ACTIVE_BANDS_PER_FACTION = 2;

/** Members drawn into a spawned band, before {@link GROUP_MAX_MEMBERS} clamping. */
export const BAND_SIZE_MIN = 3;
export const BAND_SIZE_MAX = 6;

/**
 * Members a faction must have *left over* after fielding a band. A guild that
 * sends every last member out as a war party stops being a guild — this reserve
 * is what keeps the hall staffed and the faction's own loops alive.
 */
export const BAND_FACTION_MEMBER_RESERVE = 2;

/**
 * Starting cohesion for a band. Above {@link GROUP_COHESION_START_BASE} because a
 * band is assembled by a faction that already commands its members, not by
 * strangers converging on a tavern — but not so high that bands never fray.
 */
export const BAND_COHESION_START = 0.7;

// ─── Opposed engagements (THR-731 PR 2) ──────────────────────────────
//
// A band and a company that meet resolve as one contested pair on the shipped
// TB-044 machinery — two sides of one encounter, not a battle. Only the numbers
// below are new; the ladder, the rolls, and the outcome bands are all existing.

/**
 * Cohesion the winning side gains from a contested engagement.
 *
 * Smaller in magnitude than {@link GROUP_COHESION_CONTEST_LOST_DELTA} on purpose: coming
 * through together binds a company, but not as fast as a beating pulls it apart.
 */
export const GROUP_COHESION_CONTEST_WON_DELTA = 0.08;

/** Cohesion the losing side sheds from a contested engagement. */
export const GROUP_COHESION_CONTEST_LOST_DELTA = -0.12;

/**
 * Chance a *decisive* loss (critical band only) kills one of the losing side's
 * members. Gated on decisiveness rather than applied to every loss so that most
 * engagements leave people alive to carry a grudge — the standing rivalry is the
 * point, and a system that empties both rosters on contact never gets to tell it.
 */
export const BAND_CASUALTY_CHANCE = 0.35;
