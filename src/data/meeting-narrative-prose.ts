/**
 * Hunger-variant god-voice prose for all Meeting beats.
 * Each template has a shared structure with Hunger-specific phrase slots.
 *
 * Register (THR-868 WS6): plain and descriptive — events, people, motivations. The
 * "web of fates / thread that hums / lives flicker at the edge of your sight" register
 * this file used to be written in is retired game-wide (Christian, 2026-07-30). The
 * hunger variants differ in the *motivation* they name, because naming what a mortal
 * wants is what the sensing beat is for. Enforced by
 * `src/data/__tests__/meetingProseRegister.test.ts` — zero vagueness-lexicon words.
 *
 * THR-1213: both hunger-keyed maps are total `Record<StoredHungerId, …>`, so
 * the key-set parity the register test used to assert at runtime is now a
 * compile-time fact — a missing or misspelled hunger is a build error.
 */

import type { StoredHungerId } from '../types/hunger';
import type { StepOutcome } from '../types/unifiedAction';

/** Beat 1 opening prose — what the god is looking for, per hunger. */
export const SENSING_OPENING_PROSE: Record<StoredHungerId, string> = {
  'hunger.gather':   'You look for the one who keeps taking people in. Three mortals come into focus.',
  'hunger.witness':  'You look for the one who has seen what the others walked past. Three mortals come into focus.',
  'hunger.preserve': 'You look for the one holding a line that is about to give. Three mortals come into focus.',
  'hunger.reshape':  'You look for the one who wants to be other than they are. Three mortals come into focus.',
  'hunger.reclaim':  'You look for the one carrying a loss they have not put down. Three mortals come into focus.',
  'hunger.consume':  'You look for the one who wants past all reason. Three mortals come into focus.',
  'hunger.sever':    'You look for the one with a tie they mean to cut. Three mortals come into focus.',
  'hunger.kindle':   'You look for the one with more fire in them than they have use for. Three mortals come into focus.',
  'hunger.bind':     'You look for the one who keeps reaching for other people. Three mortals come into focus.',
  'hunger.wander':   'You look for the one who cannot stay where they were born. Three mortals come into focus.',
  'hunger.haunt':    'You look for the one the dead have not finished with. Three mortals come into focus.',
  'hunger.illuminate': 'You look for the one who says out loud what the rest will not. Three mortals come into focus.',
};

/** Fallback if Hunger not found. */
export const SENSING_OPENING_FALLBACK = 'You look for the one worth your attention. Three mortals come into focus.';

/** Beat 1 focus prompt. */
export const SENSING_FOCUS_PROMPT = 'Click again to choose. Or look at another.';
export const SENSING_REST_PROMPT = 'Three lives are open to you. Which one do you watch?';

/** Beat 2 transition prose. */
export const TESTING_TRANSITION_IN = 'You keep your attention on them. A moment arrives that will settle part of who they become.';
export const TESTING_BETWEEN_DILEMMAS = 'Another moment comes.';

/**
 * Button that closes a formative test's fate reveal (THR-868).
 *
 * Deliberately not "Continue": the player is acknowledging what fate did, not
 * approving it. The register is plain and descriptive per the WS6 mandate.
 */
export const MEETING_FATE_REVEAL_CONTINUE = 'Let it stand';

/** Beat 3 transition prose. */
export const SPARK_TRANSITION_IN = 'They have changed, and they are open to you now. What do you give them?';

/** Beat 4 bond prose — Hunger-specific. */
export const BOND_PROSE: Record<StoredHungerId, string> = {
  'hunger.gather':   'You will shelter them. They are the first you take in.',
  'hunger.witness':  'You will watch over them. Their truth is the first you guard.',
  'hunger.preserve': 'You will hold them against what is coming. They are the first you keep.',
  'hunger.reshape':  'You will push them toward what they could be. They are the first you remake.',
  'hunger.reclaim':  'You will give back what was taken from them. They are the first you restore.',
  'hunger.consume':  'You will feed on their fire. They are the first to burn for you.',
  'hunger.sever':    'You will cut them loose from what holds them. They are the first you free.',
  'hunger.kindle':   'You will feed the fire in them. They are the first you set alight.',
  'hunger.bind':     'You will tie them to your design. They are the first bound to you.',
  'hunger.wander':   'You will set them on the road. They are the first to walk it for you.',
  'hunger.haunt':    'You will speak in their dreams. They are the first to hear you in the dark.',
  'hunger.illuminate': 'You will show them what the others cannot see. They are the first to carry your light.',
};

export const BOND_PROSE_FALLBACK = 'The bond holds. They are the first.';

/** Beat 4 release button text. */
export const BOND_RELEASE_TEXT = 'Let them walk.';

// ─── Fate line (THR-1714) ─────────────────────────────────────────
//
// Every meeting reveal opens with one fate line: what the hand made the odds,
// then what fate did with the lean. It is the narrator saying what happened —
// never a number (ruling 6, Law 13), and never a tutorial (THR-868 verdict 10).
// Selection is pure and lives in `src/engine/meetingFateLine.ts`; the words live
// here. `{hand}` / `{base}` are forecast words, `{name}` the candidate's name,
// `{leaned}` / `{other}` / `{written}` the axis's own sheet words. The candidate's
// gender is unknown to the line, so every clause names them and none uses a
// pronoun. Plan: `Docs/plans/2026-10-03-thr-1714-show-the-roll.md` § C1.

/** How fate answered the hand — the column a fate clause is read from. */
export type FateAnswer = 'with' | 'half' | 'turned_soft' | 'turned';

/** What the hand argued for — the row. */
export type FateLeanState = 'leaned' | 'odds_only' | 'silent';

/**
 * Which fate clause each band reads as. Total over `StepOutcome`, so changing
 * how a band *reads* is one row. `half` is authored though the tempered band is
 * unreachable in the meeting today (0 of 12,800 in the plan's census).
 */
export const FATE_ANSWER_BY_BAND: Readonly<Record<StepOutcome, FateAnswer>> = {
  critical_success: 'with',
  success: 'with',
  success_at_cost: 'half',
  near_miss: 'turned_soft',
  failure: 'turned',
  critical_failure: 'turned',
};

/** The forecast clause, by what the hand argued for. */
export const MEETING_FATE_LINE_FORECAST_CLAUSES: Readonly<Record<FateLeanState, string>> = {
  leaned: 'Your hand made it {hand}.',
  odds_only: 'Your hand made it {hand}, but leaned nowhere.',
  silent: 'You stayed silent. It stood {base}.',
};

/** The fate clause on a formative test. A hand that did not lean reads the `alone` row. */
export const MEETING_FATE_LINE_FORMATIVE_CLAUSES: Readonly<
  Record<'leaned' | 'alone', Readonly<Record<FateAnswer, string>>>
> = {
  leaned: {
    with: 'Fate went with you: {name} came out {leaned}.',
    half: 'Fate met you halfway: {name} came out {leaned}, at a cost.',
    turned_soft: 'Fate turned it, barely: {name} edged toward {other}.',
    turned: 'Fate turned against you: {name} came out {other}.',
  },
  alone: {
    with: 'Fate chose alone, and well: {name} came out {written}.',
    half: 'Fate chose alone: {name} came out {written}, at a cost.',
    turned_soft: 'Fate chose alone: {name} edged toward {written}.',
    turned: 'Fate chose alone, and hard: {name} came out {written}.',
  },
};

/** The fate clause on the bond test, which has no poles to name. */
export const MEETING_FATE_LINE_BOND_CLAUSES: Readonly<
  Record<'leaned' | 'silent', Readonly<Record<FateAnswer, string>>>
> = {
  leaned: {
    with: 'Fate went with you.',
    half: 'Fate met you halfway.',
    turned_soft: 'Fate turned it, barely.',
    turned: 'Fate turned against you.',
  },
  silent: {
    with: 'Fate answered alone, and kindly.',
    half: 'Fate answered alone, halfway.',
    turned_soft: 'Fate answered alone, coolly.',
    turned: 'Fate answered alone, and hard.',
  },
};
