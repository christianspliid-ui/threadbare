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
  all_or_nothing: 'Widens both ends',
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

// ─── Derived factor lines (THR-892) ────────────────────────────────

/**
 * How a derived factor line reads, per modifier source and direction.
 *
 * **Canon rule 1 lives here.** Every template names its source *inside the
 * sentence* — "Sera Vance carries the Rusted Key" — never as a label beside a
 * number. That is why these are sentence templates rather than a `{label}:
 * {value}` pair: the key:value shape is the unfinished-UX pattern the project
 * rejects, and a table of half-sentences is the only way to keep it impossible.
 *
 * `{actor}` is the acting mortal's name, `{source}` the named cause. Both are
 * always substituted; a template referencing neither is legal (the rule line).
 *
 * Register is plain and descriptive on purpose — these sit under the prose, not
 * beside it, and a lyrical factor line competes with the scene for attention.
 */
export const DERIVED_FACTOR_SENTENCES: Readonly<
  Record<string, { readonly for: string; readonly against: string }>
> = {
  equipment: {
    for: '{actor} carries {source}.',
    against: '{source} hampers {actor}.',
  },
  trait: {
    for: '{actor} is {source}.',
    against: 'Being {source} tells against {actor}.',
  },
  terrain: {
    for: 'The {source} favours the attempt.',
    against: 'The {source} works against it.',
  },
  faction: {
    for: '{source} holds this ground.',
    against: '{source} holds this ground, and no friend of {actor}.',
  },
  sphere: {
    for: 'The {source} sphere runs with this.',
    against: 'The {source} sphere runs against this.',
  },
  effect: {
    for: '{source} steadies {actor}.',
    against: '{source} drags at {actor}.',
  },
  divine: {
    for: 'Your attention rests on {actor}.',
    against: 'Your attention weighs on {actor}.',
  },
  rule: {
    for: 'Something has bent the rules of this place.',
    against: 'Something has bent the rules of this place.',
  },
};

/**
 * The agent's own capability in the step's reach — the "first line" of the panel.
 *
 * `{word}` is the reach's tier word (`DOMAIN_WORD_SCALES`), `{reach}` the reach
 * itself. Rendered lowercase so the sentence reads as prose rather than as a
 * stat readout.
 */
export const DERIVED_SKILL_SENTENCE = '{actor} is {word} in {reach}.';

/** Stand-in when the acting node has no resolvable name (NFP #4, never throws). */
export const DERIVED_FACTOR_ACTOR_FALLBACK = 'The acting hand';
