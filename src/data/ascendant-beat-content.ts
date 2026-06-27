/**
 * Ascendant Beats — content + tunables (THR-500)
 *
 * The cadence constants (NFP #1 — every magic number is a named constant) plus the
 * Director's beat catalogue: the scripted spine and the cadence-gated pool.
 *
 * FOUNDATION SCOPE (THR-500): the spine here is a minimal, turn-gated placeholder
 * that proves the Director schedules beats; the pool is intentionally empty. The
 * full, prose-rich spine (Beats 0–4) and the starter pool library are authored in
 * the follow-up content issues (plan §4.1–§4.3). Keeping the catalogue here means
 * "what fires when" is a single, tunable authoring surface.
 */

import type { BeatDefinition, BeatKind } from '../types/ascendantBeat';

// ─── Cadence constants (NFP #1) ──────────────────────────────────────────────

/** Cadence between pool beats, in turns. */
export const BEAT_BASE_INTERVAL = 9;
/** Seeded jitter applied to the interval (± this many turns). */
export const BEAT_INTERVAL_JITTER = 2;
/** Hard floor between any two beats, in turns. */
export const BEAT_MIN_GAP = 4;
/** Max simultaneously offered beats (max-one-pending invariant). */
export const BEAT_MAX_PENDING = 1;
/** Earliest turn each spine beat may fire. */
export const SPINE_TRIGGER_TURNS: readonly number[] = [0, 2, 4, 6, 8];
/** Pool-draw mix weights by beat kind. */
export const BEAT_KIND_WEIGHTS: Partial<Record<BeatKind, number>> = {
  introduction: 3,
  investment: 4,
  selection: 1,
  delivery: 2,
};
/**
 * Initial `lastBeatTurn`. Lower than any real turn so the cadence gate never
 * blocks the very first pool beat purely because of init state; the spine carries
 * the opening and updates `lastBeatTurn` on every offer regardless.
 */
export const BEAT_INIT_LAST_BEAT_TURN = 0;

// ─── The scripted spine (FOUNDATION placeholder — full authoring in follow-ups) ─

/**
 * Ordered spine beats. The Director offers each in turn once its trigger is
 * satisfied, advancing the cursor. These foundation entries use pure turn-gated
 * triggers so the Director demonstrably fires regardless of seed/map; the
 * narrative content + the `first_bonded` / `settlement_visited` triggers for the
 * real opening land in the spine-authoring issue (plan §4.1).
 */
export const ASCENDANT_SPINE: readonly BeatDefinition[] = [
  {
    beatId: 'beat.spine.opening',
    kind: 'spine',
    trigger: { kind: 'turn', minTurn: SPINE_TRIGGER_TURNS[0] },
    grantsActionIds: ['bind_thread_agent', 'observe_agent'],
  },
  {
    beatId: 'beat.spine.the_seat',
    kind: 'spine',
    trigger: { kind: 'turn', minTurn: SPINE_TRIGGER_TURNS[1] },
    grantsActionIds: ['bind_thread_location'],
  },
  {
    beatId: 'beat.spine.thing_left_behind',
    kind: 'spine',
    trigger: { kind: 'turn', minTurn: SPINE_TRIGGER_TURNS[2] },
    grantsActionIds: [],
  },
];

// ─── The pool (FOUNDATION: empty — starter library lands in THR-509 / content) ─

/** Cadence-gated pool beats. Empty in the foundation; the Director skips
 *  ('empty_pool') until content issues populate it. */
export const ASCENDANT_BEAT_POOL: readonly BeatDefinition[] = [];
