/**
 * Rival Scheme Config — tunable constants for THR-66 rival activation.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Every number that governs how aggressive, fast, and
 * ambitious rival schemes are lives here. Changing rival feel = changing
 * a number, not rewriting logic (NFP #1).
 * ═══════════════════════════════════════════════════════════════════
 *
 * A rival scheme is a four-phase arc (rumor → materialization → response →
 * crack) that rides the shipped THR-225 composition phase runner. These
 * constants gate scheme selection, world-flag investment pacing, escalation,
 * and the counter-play loop. All are indexed by escalation tier (0..3) where
 * noted; tier is derived from doom stage + a player-advancement proxy.
 */

/** Max number of escalation tiers (0..RIVAL_MAX_ESCALATION_TIER inclusive). */
export const RIVAL_MAX_ESCALATION_TIER = 3;

/** Cap on simultaneously-active schemes per rival, by escalation tier. */
export const RIVAL_MAX_CONCURRENT_SCHEMES: readonly number[] = [1, 1, 2, 3];

/** Min ticks between a single rival's scheme launches. */
export const RIVAL_SCHEME_LAUNCH_COOLDOWN_TICKS = 24;

/**
 * Ticks of investment required to arm the next phase, by escalation tier.
 * Lower at higher tier = faster escalation (exit criterion 3).
 */
export const RIVAL_SCHEME_PHASE_INVEST_TICKS: readonly number[] = [14, 11, 8, 6];

/** Added delay when the player stalls a scheme once (counter-play). */
export const RIVAL_SCHEME_STALL_TICKS = 12;

/** Successful counters before a scheme fails outright. */
export const RIVAL_SCHEME_COUNTERS_TO_FAIL = 2;

/**
 * Probability a rival makes a cheap probe move (the old flat action) instead
 * of launching/advancing a scheme when otherwise eligible.
 */
export const RIVAL_SCHEME_PROBE_WEIGHT = 0.35;

/** Sphere-pressure delta each phase move pushes in the rival's primary sphere. */
export const RIVAL_SCHEME_SPHERE_PRESSURE_PER_PHASE = 0.04;

/** Multiplier on the crack (terminal) phase sphere pressure — the payoff beat hits harder. */
export const RIVAL_SCHEME_CRACK_PRESSURE_MULTIPLIER = 2.5;

/** Blend weights for the escalation tier (doom stage vs player-advancement proxy). */
export const RIVAL_ESCALATION_DOOM_WEIGHT = 0.6;
export const RIVAL_ESCALATION_ADVANCEMENT_WEIGHT = 0.4;

/** Hostility bump applied to a rival each time one of its scheme moves fires. */
export const RIVAL_SCHEME_HOSTILITY_PER_MOVE = 0.03;

// ─── Temper (THR-2185) ─────────────────────────────────────────────
// A rival's temper toward the god (`hostilityToPlayer`) starts at "hostile",
// rises with a cause, and cools back toward its start when nothing happens.

/** A new rival's temper ("hostile" on the `hostilityLabel` ladder), and the cooling floor. */
export const RIVAL_HOSTILITY_START = 0.3;

/**
 * The most a rival's own scheme beats can raise its temper: "aggressive", just short of
 * "wrathful" (0.75) and of the `> 0.7` line `selectRivalAction` reads. Only the god
 * breaking a scheme (`RIVAL_HOSTILITY_ON_COUNTER`) carries a rival past it, so a wrathful
 * rival always has the god's act behind it. Measured (THR-2185, warm-300 on
 * `?seeded&size=medium`): a rival runs several schemes in a warm-up and a beat lands about
 * once a day, so uncapped beats ratcheted every rival to 1.0 and cooling never got a quiet day.
 */
export const RIVAL_SCHEME_HOSTILITY_CEILING = 0.7;

/** Rise when the god breaks (stalls or fails) one of the rival's schemes. */
export const RIVAL_HOSTILITY_ON_COUNTER = 0.08;

/** Daily cooling on a day with no rise, floored at `RIVAL_HOSTILITY_START`. */
export const RIVAL_HOSTILITY_COOL_PER_DAY = 0.02;

/** Days without a rise before the panel's cause line says "and cooling". */
export const RIVAL_HOSTILITY_CAUSE_STALE_DAYS = 3;

// ─── Rebuke (THR-2209) ─────────────────────────────────────────────
// The god's answer to a rival's landed hand: a card played on the place it just
// pressed. Plan: Docs/plans/2026-11-13-thr-2202-give-both-clocks-a-verb.md, slice 3.

/** Up-front essence, charged to the primary pool (a `generic: true` card). */
export const RIVAL_REBUKE_COST = 3;

/** The card's one step difficulty. */
export const RIVAL_REBUKE_DIFFICULTY = 0.35;

/** Days after a rival's unabsorbed landing during which that place can be rebuked. */
export const RIVAL_REBUKE_WINDOW_DAYS = 3;

/** Days a rebuke tends the place, so a rival landing there is absorbed. */
export const RIVAL_REBUKE_HOLD_DAYS = 4;

/** The god's primary-sphere push back on the place on a clean landing (one probe's magnitude). */
export const RIVAL_REBUKE_PUSH = 4;

/** Temper rise on the rebuked rival: the same as breaking one of its schemes. */
export const RIVAL_REBUKE_TEMPER_RISE = RIVAL_HOSTILITY_ON_COUNTER;

/** Tier index (0-based, 0..RIVAL_MAX_ESCALATION_TIER) at or above which the more
 *  ambitious scheme families (territorial siege beats) unlock. */
export const RIVAL_SCHEME_AMBITIOUS_FAMILY_MIN_TIER = 1;

// ─── Economic family (THR-619) ─────────────────────────────────────
// The economic arc moves stocks and cuts conduits instead of spawning combat.
// These numbers are how hard a soured mine bites and how blind a severed route
// leaves the player. Raising them makes economic rivals nastier without touching
// any logic (NFP #1).

/**
 * Fraction of a resource's `quantity` a `drain_stock` move removes at the target
 * location. 0.35 is chosen to reliably push a mid-quantity resource down one
 * stock tier without instantly exhausting it — the mine sours, it does not vanish.
 */
export const RIVAL_SCHEME_STOCK_DRAIN_FRACTION = 0.35;

/** Floor a drained resource's quantity cannot fall below (never exhaust to zero). */
export const RIVAL_SCHEME_STOCK_DRAIN_FLOOR = 5;

/** Max `trades_with` conduits a single `sever_route` move cuts. */
export const RIVAL_SCHEME_MAX_ROUTES_SEVERED = 2;

/**
 * Reliability penalty applied to each of the player's intelligence records for
 * the severed region (the Flow Web nervous-system coupling). Large enough that a
 * `reliable` record (≥0.7) can be knocked into `uncertain` by a single cut —
 * economic attack blinds as well as impoverishes.
 */
export const RIVAL_SCHEME_ROUTE_CUT_INTEL_PENALTY = 0.25;

/**
 * Max locations scanned when testing whether the world has any resource stocks
 * (the economic family's eligibility gate). Bounds the per-launch cost on large
 * maps; the predicate short-circuits on the first stocked location anyway.
 */
export const RIVAL_SCHEME_STOCK_SCAN_CAP = 200;

// ─── Profane family (THR-621) ──────────────────────────────────────
// The profane arc goes after the player's essence sources directly: it opens a
// drain on a keystone holding and, if left unwarded, desecrates it outright.
// These numbers are how long the player has to notice and ward before the
// source is lost.

/**
 * Minimum escalation tier before a rival will reach for the player's essence
 * sources. Set above 0 deliberately: a tier-0 rival gnawing on the player's
 * economy from the first scheme launch reads as noise, not as escalation. The
 * profane arc is what a rival does once it has taken the player seriously.
 */
export const RIVAL_SCHEME_PROFANE_MIN_TIER = 1;
