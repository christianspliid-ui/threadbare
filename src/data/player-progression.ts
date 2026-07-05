/**
 * Player Action Progression — tunable constants (THR-613, plan §3.5).
 *
 * God-side capability growth: the ascendant accrues `reachPractice` in its two
 * permanent reaches by resolving in-domain actions, feeding Domain Capability
 * through the same sigmoid as agents (`computeRawScore`). Crossing a Domain
 * Capability tier fires a Deepening beat through the shipped Ascendant Beat
 * Director (`pending` slot).
 *
 * All numbers here are tunable (NFP #1) and surfaced in the CMS constants
 * registry (`src/components/CMS/registry.ts`). Changing game feel = changing a
 * number, not rewriting logic.
 */

import type { ReachDomain } from '../types/traits';

/** Base reach-practice granted per resolved in-domain player action. */
export const PLAYER_PRACTICE_PER_ACTION = 0.4;

/**
 * Rate at which high capability damps further practice (0–1). Mirrors the agent
 * `DIMINISHING_RETURNS_FACTOR` for curve parity — "easy to start, hard to master".
 */
export const PLAYER_DIMINISHING_RETURNS_FACTOR = 0.7;

/**
 * Practice granted from shaping an in-domain encounter step via divine intervention.
 * Reserved for Slice 2 (encounter-shaping accrual); declared now so the accrual
 * surface is a single named constant.
 */
export const PLAYER_PRACTICE_ENCOUNTER_SHAPE = 0.4;

/**
 * Secondary reach accrues practice slower than the primary — identity has a lead
 * axis (plan §2.1). Applied as a multiplier when the resolved reach is the
 * ascendant's second-ranked affinity.
 */
export const SECONDARY_REACH_PRACTICE_MULT = 0.7;

/** Dedup cap: at most this many Deepening beats enqueue per tick (plan §3.2). */
export const DEEPENING_BEAT_MAX_PER_TICK = 1;

/**
 * Controlled essence sources that fire a breadth (milestone) beat (plan §3.5). The
 * Axis-B milestone fires the first tick the ascendant controls this many sources OR
 * holds a flowering source (Slice 2b; coordinates THR-611 source-tier transitions).
 */
export const MILESTONE_SOURCES_FOR_BEAT = 3;

/**
 * Deterministic id for the single Axis-B essence-source milestone beat (plan §4.2).
 * Enqueued directly by `phaseAscendantProgression`; content + presentation live in
 * `src/data/ascendant-milestone-beats.ts`. One id (not per-reach) — the milestone is
 * a portfolio-level breadth marker, orthogonal to the two permanent reaches.
 */
export const SOURCE_MILESTONE_BEAT_ID = 'beat.milestone.sources';

/**
 * Deterministic Deepening beat id for a reach. Slice 2 authors the matching
 * `UnifiedActionTemplate` content per reach (plan §4.1); Slice 1 enqueues by this id.
 */
export function deepeningBeatIdForReach(reach: ReachDomain): string {
  return `beat.deepening.${reach}`;
}
