/**
 * Notable Agenda Constants — THR-630 (War Phase D, living world).
 *
 * All tunables for the non-military notable-agenda system (NFP #1).
 * Plan doc: Docs/plans/2026-07-05-autonomous-notables.md §A (notable agendas).
 */

/** Spotlight budget: max simultaneously active notable agendas world-wide. */
export const MAX_ACTIVE_NOTABLE_AGENDAS = 7;

/**
 * THR-1654: max simultaneously active *local* agendas world-wide — agendas of the seeded
 * settlement notables, counted separately from the leaders' `MAX_ACTIVE_NOTABLE_AGENDAS`
 * so a busy court never crowds a town's quarrel out, nor the reverse.
 */
export const MAX_ACTIVE_LOCAL_AGENDAS = 3;

/**
 * THR-1654: the families a local notable may pursue — each aimed at their own seeded
 * story (quarrel, holding, home), never at the nearest faction. `campaign` and
 * `succession` stay leader-only: a town notable raises no army and names no heir.
 */
export const LOCAL_AGENDA_FAMILY_IDS: readonly string[] = ['feud', 'claim', 'rite'];

// ── Prominence scoring (plan §A: scope·0.35 + power·0.25 + drive·0.20 + proximity·0.20) ──

/** Weight of scope (how much the notable's faction holds) in prominence. */
export const NOTABLE_PROMINENCE_WEIGHT_SCOPE = 0.35;

/** Weight of personal power (best domain capability) in prominence. */
export const NOTABLE_PROMINENCE_WEIGHT_POWER = 0.25;

/** Weight of drive (personality intensity) in prominence. */
export const NOTABLE_PROMINENCE_WEIGHT_DRIVE = 0.2;

/** Weight of proximity to the player's threads in prominence. */
export const NOTABLE_PROMINENCE_WEIGHT_PROXIMITY = 0.2;

/** Faction `controls` edge count at which the scope component saturates at 1. */
export const NOTABLE_SCOPE_CONTROLS_NORM = 20;

/** Hex distance at which the proximity component bottoms out at 0. */
export const NOTABLE_PROXIMITY_NORM_HEXES = 12;

// ── Agenda lifecycle pacing ──

/** Ticks of investment required to arm each successive agenda phase. */
export const NOTABLE_AGENDA_PHASE_INVEST_TICKS = 8;

/** Minimum ticks between agenda launches by the same notable. */
export const NOTABLE_AGENDA_LAUNCH_COOLDOWN_TICKS = 24;

/** Cadence (ticks) of the roster scan that considers new launches. */
export const NOTABLE_AGENDA_ROSTER_INTERVAL_TICKS = 12;

/** Player counters required to fail an agenda outright (first one stalls it). */
export const NOTABLE_AGENDA_COUNTERS_TO_FAIL = 2;

/** Ticks an agenda stalls after being countered once. */
export const NOTABLE_AGENDA_STALL_TICKS = 6;

/** Sphere pressure pushed per materialize/escalate phase move. */
export const NOTABLE_AGENDA_SPHERE_PRESSURE_PER_PHASE = 0.6;

/** Multiplier on the terminal (crack) phase's sphere pressure. */
export const NOTABLE_AGENDA_CRACK_PRESSURE_MULTIPLIER = 2;
