/**
 * Display vocabulary for the ruins / delve surfaces (THR-1080).
 *
 * The three components under `src/components/ruins/` are all ordinary player
 * surfaces — `EmergenceDilemmaModal` and `DelveProgressPanel` mount from
 * `GameView`, `PlaceOfPowerInspector` from `LocationView` — and every one of
 * them was interpolating engine values straight into player-facing text: a raw
 * `DelveConsequenceRoll` enum, raw `DelveScale`, raw tick counts, truncated
 * entity ids, and an unevaluated cost formula.
 *
 * Law 14 does not merely ask that those read nicely today; it asks that an
 * unresolvable key render "as its best plain-English fallback and warn once,
 * never as the key". That is why these are functions over a map rather than
 * inline ternaries at the render site: a sixth `DelveConsequenceRoll` added
 * next year warns in the console and renders `Some New Fate`, instead of
 * printing `some_new_fate` into a modal header.
 *
 * **Durations are deliberately not defined here.** Tick countdowns on these
 * surfaces route through `getDurationWord` in `domain-words.ts`, the scale
 * THR-1070 landed for `EncounterVeil`. THR-1080's coordination block made the
 * two tickets mutex precisely so the game would not grow a second phrasing for
 * a wait; this module adopts that one rather than restating it.
 */

import type { DelveConsequenceRoll, DelveScale } from '../engine/ruins/delveTypes';
import { POP_ESSENCE_PER_TICK_MIN, POP_ESSENCE_PER_TICK_MAX } from '../engine/ruins/constants';

/**
 * Keys already warned about, so an unresolved value logs once per session
 * rather than once per render (Law 14: "warns once"). Module-scoped rather
 * than per-call so a re-render of the same modal stays quiet.
 */
const warnedKeys = new Set<string>();

/**
 * Law 14's fallback path: turn an unknown internal key into the most plausible
 * plain English and warn a developer, never leak the key itself. NFP #4 —
 * a vocabulary miss degrades the sentence, it never throws.
 */
function humanizeUnknownKey(vocabulary: string, key: string): string {
  const warnKey = `${vocabulary}:${key}`;
  if (!warnedKeys.has(warnKey)) {
    warnedKeys.add(warnKey);
    console.warn(
      `[ruin-words] ${vocabulary} has no entry for "${key}" — rendering a plain-English fallback. ` +
        `Add it to the vocabulary in src/data/ruin-words.ts.`,
    );
  }
  return key
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * What the ruin *became*, for a short header slot.
 *
 * Two of these deliberately do not echo their key. `transformed` → `Remade`
 * and `catastrophic` → `Undone` are the values that actually reach a player —
 * `transformed` is the only roll that permits Claim/Bargain/Corrupt, so it is
 * on screen for every consequential emergence. The other three are already the
 * right English word for their condition, and changing them for the sake of
 * differing from the key would be worse copy, not better.
 */
export const RUIN_FATE_WORDS: Record<DelveConsequenceRoll, string> = {
  catastrophic: 'Undone',
  scarred: 'Scarred',
  marked: 'Marked',
  triumphant: 'Triumphant',
  transformed: 'Remade',
};

/**
 * The same five fates as a clause completing "the ruin was ___", for the
 * disabled-card reason. A header noun and a mid-sentence predicate are
 * different grammatical shapes, so they are different vocabularies rather than
 * one map bent to serve both — the previous code used the bare enum for both
 * and read wrong in at least one of the two every time.
 */
export const RUIN_FATE_CLAUSES: Record<DelveConsequenceRoll, string> = {
  catastrophic: 'left undone',
  scarred: 'left scarred',
  marked: 'only marked',
  triumphant: 'won, but not remade',
  transformed: 'remade',
};

/** Delve size, as shown on the progress card's scale chip. */
export const DELVE_SCALE_WORDS: Record<DelveScale, string> = {
  minor: 'Minor',
  major: 'Major',
  saga: 'Saga',
};

export function getRuinFateWord(roll: DelveConsequenceRoll | string): string {
  return RUIN_FATE_WORDS[roll as DelveConsequenceRoll] ?? humanizeUnknownKey('RUIN_FATE_WORDS', String(roll));
}

export function getRuinFateClause(roll: DelveConsequenceRoll | string): string {
  return (
    RUIN_FATE_CLAUSES[roll as DelveConsequenceRoll] ??
    humanizeUnknownKey('RUIN_FATE_CLAUSES', String(roll)).toLowerCase()
  );
}

export function getDelveScaleWord(scale: DelveScale | string): string {
  return DELVE_SCALE_WORDS[scale as DelveScale] ?? humanizeUnknownKey('DELVE_SCALE_WORDS', String(scale));
}

/**
 * How strong a Place of Power's essence stream reads, as words.
 *
 * The live range is a three-value integer band — `POP_ESSENCE_PER_TICK_MIN` (1)
 * to `POP_ESSENCE_PER_TICK_MAX` (3), set in `ruinTransformation.ts` from the
 * ruin's magnitude — so three words is the whole scale, not a compression of
 * it. The inspector previously rendered `2 spirit / tick`, which is a raw
 * magnitude *and* a raw tick unit on a surface that is not persistent chrome,
 * so Law 13's ratified pool-balance exception does not reach it.
 *
 * Thresholds are derived from the engine constants rather than written as
 * literals, so widening the engine's range cannot silently strand a band
 * (NFP #1 — retuning stays a number change).
 */
export const STREAM_YIELD_WORDS = ['a trickle', 'a steady flow', 'a strong current'] as const;

export function getStreamYieldWord(essencePerTick: number): string {
  const span = Math.max(1, POP_ESSENCE_PER_TICK_MAX - POP_ESSENCE_PER_TICK_MIN);
  const offset = essencePerTick - POP_ESSENCE_PER_TICK_MIN;
  const ratio = offset / span;
  const band = Math.min(
    STREAM_YIELD_WORDS.length - 1,
    Math.max(0, Math.round(ratio * (STREAM_YIELD_WORDS.length - 1))),
  );
  return STREAM_YIELD_WORDS[band];
}
