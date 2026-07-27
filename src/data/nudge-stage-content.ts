/**
 * Nudge stage display content — THR-775 (WS2 interface).
 *
 * Every player-facing word the nudge stage renders lives here (NFP #1): the
 * forecast tier words, the motive chips, the dimmed-card reasons, and the rider
 * labels. Changing how the stage *reads* is changing a string in this file,
 * never editing a component.
 *
 * **Words only.** The stage never renders a probability, a difficulty number, or
 * a forecast delta (ruling 6). The numerals exist in the stage model for the
 * designer view alone. Difficulty words come from `DIFFICULTY_WORD_BANDS`
 * (`nudge-constants.ts`) — the runtime band table — not from here.
 *
 * Plan: `Docs/plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md` § WS2
 */

import type { ForecastTier } from '../types/traces/encounter-traces';
import type { MotiveSource } from '../engine/encounters/motiveClassifier';
import type { NudgeBlockedCode } from '../engine/encounters/nudges';
import type { NudgeRider } from '../types/unifiedAction';

/**
 * Forecast tier → the single word the player reads. This *is* the probability
 * surface: no percentage, no bar, no numeral ever renders beside it.
 */
export const FORECAST_TIER_WORDS: Readonly<Record<ForecastTier, string>> = {
  doomed: 'Doomed',
  perilous: 'Perilous',
  uncertain: 'Uncertain',
  favorable: 'Favorable',
  fated: 'Fated',
};

/** Motive chip copy — why this mortal is standing here (`classifyMotive`). */
export const MOTIVE_CHIP_LABELS: Readonly<Record<MotiveSource, string>> = {
  choice: 'BY CHOICE',
  mission: 'A MISSION',
  chance: 'CHANCE',
  divine: "THE GOD'S HAND",
};

/**
 * Fallback motive sentence per source, used when the encounter authored none.
 * Second person singular is deliberate — the player is the god being addressed.
 */
export const MOTIVE_FALLBACK_SENTENCES: Readonly<Record<MotiveSource, string>> = {
  choice: 'They came here wanting this.',
  mission: 'They were sent, and they came.',
  chance: 'They were simply here when it started.',
  divine: 'Your hand set this in motion.',
};

/**
 * Why a dimmed card cannot be played. Only `essence_unavailable` reaches the
 * player stage — the other codes are withheld (ruling 4) and read in the
 * designer view, where the full lexicon is still wanted.
 */
export const NUDGE_BLOCKED_REASONS: Readonly<Record<NudgeBlockedCode, string>> = {
  essence_unavailable: 'Not enough essence',
  sphere_locked: 'Sphere beyond your reach',
  unlock_missing: 'Not yet yours to give',
  trait_missing: 'They do not carry this',
};

/** Rider display names — designer view only; riders never announce themselves. */
export const NUDGE_RIDER_LABELS: Readonly<Record<NudgeRider, string>> = {
  no_crit_fail: 'No catastrophe',
  floor_at_cost: 'Floors at a cost',
};

/** Cost rendered in words. A free card says so rather than showing a zero. */
export const NUDGE_FREE_COST_LABEL = 'Free';

/** Heading above the hand. */
export const NUDGE_HAND_HEADING = 'What you can do';

/** The commit verb — the player never "attacks", they let the world resolve. */
export const NUDGE_COMMIT_LABEL = 'Let fate decide';

/** Shown in place of the hand when every authored card is withheld. */
export const NUDGE_EMPTY_HAND_LINE = 'Nothing here answers to you. Let it play out.';

/**
 * How long the pre-roll rejection toast lives. Long enough to read, short
 * enough that it is gone before the next encounter surfaces.
 */
export const NUDGE_REJECT_TOAST_MS = 6000;
