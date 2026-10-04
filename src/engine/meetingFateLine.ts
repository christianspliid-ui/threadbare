/**
 * meetingFateLine — THR-1714 (show the roll).
 *
 * Every Meet The First reveal opens with one fate line: what the hand made the
 * odds, then what fate did with the lean. The cold playtest's round 2 found all
 * three testers misreading the nudge model at exactly this moment — "the outcome
 * matched a card I didn't pick" is the design working about two times in five
 * (fate writes the other pole on a bad band), and the surface never said so.
 *
 * This module picks and fills the line. It *reads* a resolved outcome and never
 * feeds back into one: no rng, no state, no graph. The words live in
 * `meeting-narrative-prose.ts`; the forecast words in `nudge-stage-content.ts`;
 * the pole words are the axis's own sheet words from `axisRegistry.ts`.
 *
 * Plan: `Docs/plans/2026-10-03-thr-1714-show-the-roll.md` § E2.
 */

import type { ValuePair } from '../types/agent';
import type { BondOutcome, FormativeOutcome } from '../types/meetingEncounter';
import type { ForecastTier } from '../types/resolution';
import type { StepOutcome } from '../types/unifiedAction';
import { getAxisByValuePair } from '../types/axisRegistry';
import {
  FATE_ANSWER_BY_BAND,
  MEETING_FATE_LINE_BOND_CLAUSES,
  MEETING_FATE_LINE_FORECAST_CLAUSES,
  MEETING_FATE_LINE_FORMATIVE_CLAUSES,
  type FateAnswer,
  type FateLeanState,
} from '../data/meeting-narrative-prose';
import { MEETING_POLE_SHIFT_BY_BAND } from '../data/meeting-nudge-constants';
import {
  DERIVED_FACTOR_ACTOR_FALLBACK,
  FORECAST_TIER_WORDS,
  NUDGE_LEAN_TAG,
} from '../data/nudge-stage-content';

export type { FateAnswer, FateLeanState };

/** Suffix on a fate-line key whose outcome predates the forecast fields. */
export const FATE_LINE_NO_FORECAST_SUFFIX = '.noforecast';

/** Prefix on a bond fate-line key, so the two tables never share a key. */
const BOND_KEY_PREFIX = 'bond.';

export interface FateLine {
  /**
   * Stable key — `${leanState}.${fateAnswer}`, or `bond.${leanState}.${fateAnswer}`,
   * with {@link FATE_LINE_NO_FORECAST_SUFFIX} when the forecast clause was dropped.
   * Recorded on the trace and the debug snapshot; never shown.
   */
  readonly key: string;
  /** The filled sentence pair the reveal renders. Empty ⇒ render nothing. */
  readonly text: string;
}

/** The two words of a value axis, pole `a` first. */
export interface PoleWords {
  readonly a: string;
  readonly b: string;
}

let warnedUnknownBand = false;

/**
 * Which fate clause a band reads as. Total over `StepOutcome` through the table;
 * a band outside it (a future ladder value) reads by the sign of its pole shift
 * and warns once, rather than rendering a blank.
 */
export function fateAnswerForBand(band: StepOutcome): FateAnswer {
  const answer = FATE_ANSWER_BY_BAND[band];
  if (answer) return answer;
  if (!warnedUnknownBand) {
    warnedUnknownBand = true;
    console.warn(`[meetingFateLine] band '${band}' has no fate answer — reading it by its pole shift`);
  }
  return (MEETING_POLE_SHIFT_BY_BAND[band] ?? 0) >= 0 ? 'with' : 'turned';
}

/** `courage_prudence` → `Courage` / `Prudence`. The fallback when no reach axis owns a pair. */
function splitValuePairWords(valuePair: ValuePair): PoleWords {
  const [a = '', b = ''] = String(valuePair).split('_');
  const cap = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);
  return { a: cap(a), b: cap(b) };
}

/**
 * The words a meeting test's two poles are read as. Pole `a` is the virtue (the
 * positive direction of `AxiologicalProfile`), pole `b` the vice — the same
 * words the agent sheet shows. A pair no reach axis owns (`courage_prudence`)
 * falls back to its own key's halves, capitalised; never the raw key.
 */
export function poleWordsFor(valuePair: ValuePair): PoleWords {
  const axis = getAxisByValuePair(valuePair);
  if (axis) return { a: axis.virtue.word, b: axis.vice.word };
  return splitValuePairWords(valuePair);
}

/** `Leans Brave` for a card that argues for a pole; `undefined` for one that does not. */
export function leanTagFor(
  valuePair: ValuePair | undefined,
  poleLean: 'a' | 'b' | undefined,
): string | undefined {
  if (!valuePair || !poleLean) return undefined;
  const word = poleWordsFor(valuePair)[poleLean];
  return word ? NUDGE_LEAN_TAG.replace('{word}', word) : undefined;
}

function fill(template: string, tokens: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => tokens[key] ?? match);
}

/** Forecast clause, or `undefined` when the outcome carries no forecast. */
function forecastClause(
  leanState: FateLeanState,
  base: ForecastTier | undefined,
  hand: ForecastTier | undefined,
): string | undefined {
  if (!base || !hand) return undefined;
  return fill(MEETING_FATE_LINE_FORECAST_CLAUSES[leanState], {
    hand: FORECAST_TIER_WORDS[hand] ?? hand,
    base: FORECAST_TIER_WORDS[base] ?? base,
  });
}

/**
 * Join the clauses and refuse to ship a brace. A `{token}` that survived filling
 * would be a broken line in the game's first five minutes (Law 43); suppressing
 * it is the fail-soft path, and the unit test is what keeps it from happening.
 */
function assemble(key: string, clauses: ReadonlyArray<string | undefined>): FateLine {
  const text = clauses.filter((c): c is string => !!c).join(' ');
  return { key, text: /[{}]/.test(text) ? '' : text };
}

function displayName(name: string): string {
  return name.trim() ? name : DERIVED_FACTOR_ACTOR_FALLBACK;
}

/** What a formative hand argued for. */
export function formativeLeanState(o: Pick<FormativeOutcome, 'playedNudgeIds' | 'netLean'>): FateLeanState {
  if (o.playedNudgeIds.length === 0) return 'silent';
  return o.netLean === 'none' ? 'odds_only' : 'leaned';
}

/**
 * The fate line for a resolved formative test.
 *
 * A leaned hand reads "with you" or "against you"; a silent or odds-only hand
 * reads "fate chose alone", naming the pole fate wrote. The answer column comes
 * from the band, but on the leaned row it is checked against the pole actually
 * written — if a retuned shift table ever wrote the leaned pole on a band that
 * reads "turned", the line follows the written pole rather than lie.
 */
export function selectFormativeFateLine(o: FormativeOutcome, agentName: string): FateLine {
  const leanState = formativeLeanState(o);
  const words = poleWordsFor(o.valuePair);
  let answer = fateAnswerForBand(o.band);

  if (leanState === 'leaned' && o.netLean !== 'none') {
    const wentWith = o.writtenPole === o.netLean;
    const readsWith = answer === 'with' || answer === 'half';
    if (wentWith !== readsWith) answer = wentWith ? 'with' : 'turned';
  }

  const leaned = o.netLean === 'none' ? words[o.writtenPole] : words[o.netLean];
  const other = o.netLean === 'b' ? words.a : words.b;
  const row = leanState === 'leaned' ? 'leaned' : 'alone';
  const fate = fill(MEETING_FATE_LINE_FORMATIVE_CLAUSES[row][answer], {
    name: displayName(agentName),
    leaned,
    other,
    written: words[o.writtenPole],
  });

  const forecast = forecastClause(leanState, o.baseForecastTier, o.handForecastTier);
  const key = `${leanState}.${answer}${forecast ? '' : FATE_LINE_NO_FORECAST_SUFFIX}`;
  return assemble(key, [forecast, fate]);
}

/**
 * The fate line for the bond test. The bond has no poles, so any played card is
 * a leaned hand and an empty one is silence.
 */
export function selectBondFateLine(o: BondOutcome, _agentName: string): FateLine {
  const leanState: 'leaned' | 'silent' = o.playedNudgeIds.length > 0 ? 'leaned' : 'silent';
  const answer = fateAnswerForBand(o.band);
  const fate = MEETING_FATE_LINE_BOND_CLAUSES[leanState][answer];
  const forecast = forecastClause(leanState, o.baseForecastTier, o.handForecastTier);
  const key = `${BOND_KEY_PREFIX}${leanState}.${answer}${forecast ? '' : FATE_LINE_NO_FORECAST_SUFFIX}`;
  return assemble(key, [forecast, fate]);
}
