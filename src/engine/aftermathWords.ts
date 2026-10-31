/**
 * THR-1004 — words, never numerals, for **engine-derived** aftermath sentences.
 *
 * The authored half of an ending has always been prose. The derived half was
 * not: growth, reputation, faction standing and reputation tallies were each
 * rendered with a debug-grade template literal that printed `toFixed(2)` and,
 * in the tally case, the raw internal key (`star.positive`). Those strings go
 * straight onto a mortal-facing chip, so the surface rule the whole game holds
 * — magnitudes are stated in words — was being broken at the source rather
 * than at the surface.
 *
 * This module owns that vocabulary. Two rules make it the *only* place the
 * question is answered:
 *
 * 1. **Every derived sentence is built here**, not in the resolution file. The
 *    resolver calls `growthSentence(...)` and friends; it never assembles a
 *    detail string of its own. That is what makes the numeral test in
 *    `__tests__/aftermathWords.test.ts` a real gate rather than a sample —
 *    it enumerates the production sentence builders, not a copy of them.
 * 2. **Numbers stay in traces.** Nothing here returns a digit. `magnitudeWord`
 *    bands a delta the way `difficultyWord` (`engine/encounters/nudges.ts`)
 *    and `getDomainWord` (`data/domain-words.ts`) already band theirs; the
 *    designer-facing number is still on the trace, untouched.
 *
 * Each builder also returns the **concepts** it named — the substrings that are
 * game concepts rather than prose — so the chip surface can honour the UI Law
 * (image, tooltip, link) without re-parsing English. See
 * `EncounterAftermathConceptRef` in `types/unifiedAction.ts`.
 *
 * NFP #1: every threshold below is a named constant. Changing how big "a
 * little" is means changing a number here, not rewriting a sentence.
 */

import type { ReachDomain } from '../types/traits';
import type { GraphNode } from '../types/graph';
import { TICKS_PER_DAY } from '../data/attention-constants';
// THR-1475: a condition's effect substrate. Both are plain records in a module
// that imports only types, so there is no cycle and no graph dependency — the
// derivation stays context-free, which is what lets the tooltip registry reach it.
import {
  CONDITION_DURATIONS,
  LOCATION_CONDITION_MOVEMENT_TAX,
  LOCATION_CONDITION_STEP_MODIFIER,
} from '../data/condition-trait-content';
import type {
  EncounterAftermathConceptRef,
  EncounterAftermathDirection,
  EncounterAftermathMagnitude,
  EncounterAftermathStoryWeight,
  StepOutcome,
  UnifiedActionOutcome,
} from '../types/unifiedAction';
import { STEP_OUTCOMES } from '../types/unifiedAction';

// ─── Reach vocabulary ────────────────────────────────────────────────

/**
 * Reach → display name. Same set the Codex draws (`components/Codex/codexRegistry.ts`);
 * duplicated as data rather than imported because the engine must not depend on a
 * component module.
 *
 * THR-1368: the `flesh` row is gone, together with the `reach.flesh` node and its six
 * edges in `world-model.json` — the two halves that THR-1359 correctly refused to
 * separate. This bag is keyed by world-model `reach.*` node suffix rather than by
 * `ReachDomain`, so the row and the node had to retire in one change or the surviving
 * half would point the mismatch the other way.
 *
 * `time` and `life` stay, and are deliberately *not* residue of the retired Reach: they
 * are display words for keys that have never had a `reach.*` node, already excluded from
 * `TOOLTIP_BACKED_REACHES` below so they draw no dead link. The `Record<string, string>`
 * annotation is what keeps them legal, and is therefore still correct rather than a
 * widening hole.
 */
export const REACH_DISPLAY_NAMES: Record<string, string> = {
  iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil',
  heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star',
  time: 'Time', life: 'Life',
};

/** True when `raw` names a reach this module has a display word for. */
export function isReachName(raw: string): raw is ReachDomain {
  return Object.prototype.hasOwnProperty.call(REACH_DISPLAY_NAMES, raw);
}

/**
 * The reaches the tooltip registry can actually resolve — the eight `reach.*`
 * nodes in `world-model.json` (THR-1033; nine until THR-1368 retired `reach.flesh`).
 *
 * This is deliberately *narrower* than `REACH_DISPLAY_NAMES`, which also holds
 * `time` and `life`. Those two have display words but no world-model node, so
 * `reach.time` / `reach.life` resolved to nothing while still being emitted as
 * concept ids — and a chip renders the "concept word" underline on the mere
 * *presence* of a tooltip id, so they drew a dead link that looked live (Law
 * 21). Fail-open is the designed state: a reach with no registry entry is
 * plain styled text, not an underline that explains nothing on hover.
 *
 * Pinned against the live resolver by `tooltipValidation.test.ts`, so this set
 * cannot drift away from the registry the way the implicit one did.
 */
export const TOOLTIP_BACKED_REACHES: readonly string[] = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star',
];

/** Reach → display name, falling back to a humanised form of an unknown key. */
export function reachDisplayName(raw: string): string {
  return REACH_DISPLAY_NAMES[raw] ?? humanizeKeySegment(raw);
}

/**
 * Tooltip concept id for a reach, or undefined when the registry cannot explain
 * it. An id that resolves to nothing is worse than no id at all — see
 * `TOOLTIP_BACKED_REACHES`.
 */
export function reachTooltipId(raw: string): string | undefined {
  return TOOLTIP_BACKED_REACHES.includes(raw) ? `reach.${raw}` : undefined;
}

// ─── Magnitude banding ───────────────────────────────────────────────

/** One rung of a magnitude ladder: the word used at or above `min`. */
export interface MagnitudeBand {
  readonly min: number;
  readonly word: string;
}

/**
 * Bands are read **highest-first**, so they are declared descending. A value
 * below every rung takes the last word — there is no "no change" rung, because
 * every call site has already filtered on an epsilon before building a sentence.
 */
function bandWord(value: number, bands: readonly MagnitudeBand[]): string {
  const magnitude = Math.abs(Number.isFinite(value) ? value : 0);
  for (const band of bands) {
    if (magnitude >= band.min) return band.word;
  }
  return bands[bands.length - 1].word;
}

/**
 * Reputation deltas live on a roughly 0–1 scale and land in the hundredths in
 * practice — Christian's screenshot showed `+0.050`, which is an *ordinary*
 * shift, not a negligible one. The ladder is tuned so that range reads as
 * "a little" rather than bottoming out.
 */
export const REPUTATION_MAGNITUDE_BANDS: readonly MagnitudeBand[] = [
  { min: 0.30, word: 'profoundly' },
  { min: 0.15, word: 'markedly' },
  { min: 0.05, word: 'noticeably' },
  { min: 0.01, word: 'a little' },
  { min: 0,    word: 'faintly' },
];

/** Capability growth per step is small by design — 0.04 is a normal tick of it. */
export const GROWTH_MAGNITUDE_BANDS: readonly MagnitudeBand[] = [
  { min: 0.50, word: 'in a leap' },
  { min: 0.20, word: 'sharply' },
  { min: 0.05, word: 'steadily' },
  { min: 0.01, word: 'a little' },
  { min: 0,    word: 'faintly' },
];

/** Tallies are whole counts — one encounter usually moves them by exactly one. */
export const TALLY_MAGNITUDE_BANDS: readonly MagnitudeBand[] = [
  { min: 5, word: 'sharply' },
  { min: 3, word: 'markedly' },
  { min: 2, word: 'further' },
  { min: 0, word: 'again' },
];

/** Band any delta with an explicit ladder. Exported for reuse and for the tests. */
export function magnitudeWord(value: number, bands: readonly MagnitudeBand[]): string {
  return bandWord(value, bands);
}

/**
 * THR-1082 — the same banding, kept as a number the surface can draw with.
 *
 * `magnitudeWord` spends the band on an English word and the rung is gone; a
 * delta cluster needs the rung itself. This returns it as an **ascending** index
 * — 0 is the faintest rung, `bands.length - 1` the strongest — which is the
 * reverse of the array's own order, since ladders are declared highest-first so
 * `bandWord` can read them top-down. The flip lives here, once, rather than in
 * every consumer that would otherwise have to remember which way the array runs.
 *
 * No numeral escapes: this is an index into a named ladder, not the delta. The
 * raw value stays on the trace, exactly as before (Law 13).
 */
export function magnitudeBandIndex(value: number, bands: readonly MagnitudeBand[]): number {
  const magnitude = Math.abs(Number.isFinite(value) ? value : 0);
  for (let i = 0; i < bands.length; i++) {
    if (magnitude >= bands[i].min) return bands.length - 1 - i;
  }
  return 0;
}

// ─── Delta cluster readings ──────────────────────────────────────────

/**
 * THR-1451 — band rung → triangles, for the growth ladder.
 *
 * The ladders are five rungs deep and the cluster draws three, so this is a
 * deliberate collapse rather than a mapping bug: the ladder stays full-depth as
 * *data* and only the drawn run is coarsened. Indexed by the **ascending** rung
 * `magnitudeBandIndex` returns — 0 is faintest.
 *
 * It lives here, beside the ladder it collapses, rather than in either component
 * that draws from it (UI Law 3, following THR-1426's `sustainFlowSpheres`). The
 * aftermath adapter's `DELTA_CLUSTER_BAND_MAP` sources its `growth` row from
 * this constant, so a retune of the collapse moves the ending and the mandate
 * sheet together instead of letting one drift behind the other.
 */
export const GROWTH_DELTA_CLUSTER_COLLAPSE: readonly number[] = [1, 1, 2, 3, 3];

/** The whole reading a `DeltaCluster` needs, with no numeral in it. */
export interface DeltaClusterReading {
  readonly direction: 'gain' | 'loss';
  readonly count: number;
  /** Words for the hover tier and the `aria-label` — the rung, spelled out. */
  readonly label: string;
}

/**
 * THR-1451 — a sphere delta as a delta-cluster reading.
 *
 * Law 15's rescope makes the delta cluster the sanctioned language for a
 * *realised state change*, which is what a sphere delta is — and it is
 * explicitly NOT what THR-1424's proportion ruling settles, as the pointer that
 * ticket left in `MandateDetail` says. So this is a conversion into an existing
 * language, not a drop.
 *
 * Returns `null` below the ladder's own epsilon: a delta that moved nothing says
 * so by drawing no cluster, never by drawing an empty one — the same contract
 * `OddsPips` keeps for a card that moves no odds.
 *
 * `noun` names what moved, so the label reads as a sentence a screen reader can
 * speak ("mind rose steadily") rather than a bare adverb.
 */
export function sphereDeltaReading(
  delta: number | undefined,
  noun: string,
): DeltaClusterReading | null {
  if (delta == null || !Number.isFinite(delta) || delta === 0) return null;
  const rung = magnitudeBandIndex(delta, GROWTH_MAGNITUDE_BANDS);
  const count = GROWTH_DELTA_CLUSTER_COLLAPSE[rung] ?? 1;
  const word = magnitudeWord(delta, GROWTH_MAGNITUDE_BANDS);
  const direction = delta > 0 ? 'gain' : 'loss';
  return {
    direction,
    count,
    label: `${noun} ${direction === 'gain' ? 'rose' : 'fell'} ${word}`,
  };
}

// ─── Counting ────────────────────────────────────────────────────────

/**
 * Small counts spelled out; anything past the ladder collapses to a word rather
 * than growing a numeral. The overview line is the only place this is used, and
 * it never has more than a handful of anything.
 */
export const COUNT_WORDS: readonly string[] = [
  'no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
];

/** Word above which a count stops being spelled out and becomes "many". */
export const COUNT_WORD_MANY = 'many';

export function countWord(n: number): string {
  const count = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  return COUNT_WORDS[count] ?? COUNT_WORD_MANY;
}

/**
 * A remaining term, in days rather than ticks (THR-1113; moved here THR-1143).
 *
 * Ticks are an engine unit with no player-facing display anywhere else in the game, so `48 ticks`
 * fails Law 14 as squarely as it fails Law 13. The conversion is the game's own — `TICKS_PER_DAY`,
 * twelve — and the count is spelled out, so no numeral escapes.
 *
 * **Why a real unit rather than a band.** The Law 13 amendment of 2026-08-12 is explicit that a
 * word ladder is the wrong answer to *"how much?"* — Christian's verdict on `grew steadily` was
 * *"how can a player use that word to gage anything"*. `four days` is not an adverb: it is a
 * quantity in a unit the player already reasons in, which is what the amendment asks for and what
 * banding this to `brief` / `lasting` would have thrown away.
 *
 * Above the spelled-count ladder the reading steps up to weeks rather than growing a numeral, so
 * an authored term of any length still renders in words.
 *
 * **Why it lives here rather than in the Codex** (THR-1143): it was written for an agreement's
 * term and was marked module-private, but a location condition's remaining season is the same
 * quantity asking the same question, and the location panel needed it. Copying would have made
 * two ladders for one reading — the drift UI Law 3 exists to prevent — so the ladder moved to the
 * module that already owns "band it at the source" and the Codex re-exports it.
 */
export function durationLabel(ticks: number): string {
  const days = Math.max(1, Math.round(ticks / TICKS_PER_DAY));
  if (days <= 9) return `${countWord(days)} day${days === 1 ? '' : 's'}`;
  const weeks = Math.max(1, Math.round(days / 7));
  return `${countWord(weeks)} week${weeks === 1 ? '' : 's'}`;
}

/**
 * An **elapsed** span — how long ago something happened, or how long it has been running
 * (THR-1425). The sibling of `durationLabel`, which reads a *term*.
 *
 * **Why a sibling rather than a second call to `durationLabel`.** The two answer different
 * questions and disagree at the bottom of the range. `durationLabel` floors to `one day`,
 * which is right for a term — an agreement with three ticks left is still meaningfully "a day"
 * of standing, and rounding it away would under-report a live commitment. For an elapsed span
 * that same floor states something false: a schism that reformed three ticks ago did **not**
 * reform `one day ago`, it reformed today. The floor is the whole difference, and it is a
 * reading decision, not a rounding detail — so it lives in one place rather than being
 * re-derived at each call site.
 *
 * **Why `less than a day` and not a band.** The Law 13 amendment of 2026-08-12 rules out
 * answering *"how much?"* with an adverb ladder — Christian's verdict on `grew steadily` was
 * *"how can a player use that word to gage anything"*. `less than a day` is not an adverb: it
 * is a bound stated in the same unit the rest of the ladder uses, so a player reads it against
 * `four days` on the next row without translating. It also composes into every phrasing the
 * call sites need without the function owning any of them — `${elapsedLabel(n)} ago`,
 * `held ${elapsedLabel(n)}`, `took ${elapsedLabel(n)} to resolve` all read as English at both
 * ends of the range. That is why there is one function here and not one per preposition:
 * the ladder is the reading, the preposition is the sentence's.
 *
 * Above a day it delegates, so there is exactly one days/weeks ladder in the codebase and a
 * retune of `TICKS_PER_DAY` moves both readings together (UI Law 3).
 */
export function elapsedLabel(ticks: number): string {
  const t = Number.isFinite(ticks) ? Math.max(0, Math.floor(ticks)) : 0;
  if (t < TICKS_PER_DAY) return 'less than a day';
  return durationLabel(t);
}

/** Years from which `pastSpanLabel` reads in decades (THR-1631). */
export const PAST_SPAN_DECADE_FROM_YEARS = 10;
/** Years from which `pastSpanLabel` reads in rounded centuries (THR-1631). */
export const PAST_SPAN_CENTURY_FROM_YEARS = 95;

/**
 * How long ago something in the world's past happened, in years (THR-1631 S1f) — the
 * years-scale sibling of `elapsedLabel`, which stops at weeks.
 *
 * One unit per reading, and always inside `countWord`, so no numeral escapes (Laws 13/14):
 * under ten years reads in years ("four years"), then decades ("two decades"), then rounded
 * centuries ("about four centuries" — "about" marks the rounding). Past nine centuries the
 * ladder has no word left and reads "many centuries". "Founded 456 years ago" becomes
 * "Founded about five centuries ago".
 */
export function pastSpanLabel(years: number): string {
  const y = Number.isFinite(years) ? Math.max(0, Math.round(years)) : 0;
  if (y < 1) return 'less than a year';
  if (y < PAST_SPAN_DECADE_FROM_YEARS) return `${countWord(y)} year${y === 1 ? '' : 's'}`;
  if (y < PAST_SPAN_CENTURY_FROM_YEARS) {
    const decades = Math.max(1, Math.round(y / 10));
    return decades === 1 ? 'a decade' : `${countWord(decades)} decades`;
  }
  const centuries = Math.max(1, Math.round(y / 100));
  if (centuries > 9) return 'many centuries';
  return centuries === 1 ? 'about a century' : `about ${countWord(centuries)} centuries`;
}

// ─── Condition effect readings ───────────────────────────────────────

/**
 * THR-1475 — what a condition *does*, in game words.
 *
 * ## The defect this closes
 *
 * Christian, on the THR-1220 slice: *"there is still no information on the tool
 * tips or click throughs on the scars describing their in game effect."* He was
 * right, and the cause is narrow. `SCAR · EXHAUSTED` hovers into
 * `resolveAttachmentTemplateTooltip`, which draws `plainRegisterBody` — the
 * template's `description`, *"Pushed beyond their limits. Everything takes more
 * effort."* That is a mood. The effect was sitting one field away the whole time
 * (`domainContributions: { iron: -0.04, eye: -0.04, stone: -0.04 }`) with **no
 * words-producer reading it**: THR-1122 correctly kept every numeral off the
 * tooltip, and the effect went out with the numbers rather than being restated
 * as words.
 *
 * ## Why a condition-scaled ladder and not `GROWTH_MAGNITUDE_BANDS`
 *
 * The growth ladder answers *"how fast is this rising?"* and bands 0.05 as
 * `steadily`, which is a rate word — wrong twice over for a condition, which is
 * a *standing* the bearer is under, not a motion. So this is its own ladder.
 *
 * Its rungs are calibrated against what the number actually does, because the
 * calibration note on the ticket asks for exactly that and forbids inflating.
 * `domainContributions` are **raw-score** terms walked by
 * `computeRawScore`, then put through `sigmoid(midpoint 10, k 0.4)`, whose
 * steepest slope is `k / 4 = 0.1` capability per raw point. So:
 *
 * | raw term | capability moved, at best |
 * |----------|---------------------------|
 * | 0.04     | under half a point in a hundred |
 * | 0.10     | about one point in a hundred     |
 * | 0.40     | about four                        |
 * | 1.00     | about ten                         |
 *
 * Every shipped condition sits in 0.04…0.10, so every one of them reads
 * **`slightly`** — and that is the honest word, not a ladder bottoming out. What
 * the upper rungs protect is the *next* author: a condition written at −0.5 is a
 * genuinely different animal, and must not still be described as slight. The
 * ladder is the tunable that keeps those two cases apart (NFP #1).
 *
 * A magnitude word is also not this reading's answer to *"how much?"* — the Law
 * 13 amendment of 2026-08-12 rules an adverb out for that. The term is, and it
 * is stated in days (`durationLabel`), a unit the player already reasons in.
 *
 * ## A place's condition reads from the tax, not from contributions
 *
 * `trait.condition.location.*` carries `domainContributions: {}` **on purpose** —
 * a place has no capability to move (THR-1143). A place's effect lives in one of
 * two other tables instead: `LOCATION_CONDITION_MOVEMENT_TAX` (what it costs to
 * reach, read by `movementCost.ts`) and `LOCATION_CONDITION_STEP_MODIFIER` (what
 * it costs to work in, read by `collectLocationConditionContributions`). This
 * derivation reads all three.
 *
 * A condition with no substrate at all gets **no line** rather than an invented
 * one — a chip must not promise what the engine cannot enact. THR-1483 emptied
 * `CONDITION_IDS_WITHOUT_EFFECT` by giving the last two holdouts real readers, so
 * nothing currently takes that branch; it stays because the honest answer to a
 * condition shipped ahead of its reader is silence, not a guess.
 */
export const CONDITION_MAGNITUDE_BANDS: readonly MagnitudeBand[] = [
  { min: 1.00, word: 'far' },
  { min: 0.40, word: 'markedly' },
  { min: 0.15, word: 'somewhat' },
  { min: 0,    word: 'slightly' },
];

/**
 * The same reading for a place, banded on the **movement multiplier** rather than
 * a raw-score term: ×8 is a closed pass, ×1.2 is a crowded street.
 */
export const CONDITION_TRAVEL_TAX_BANDS: readonly MagnitudeBand[] = [
  { min: 4,   word: 'far more' },
  { min: 1.5, word: 'more' },
  { min: 0,   word: 'a little more' },
];

/**
 * The reading for a place whose movement multiplier is **below one** (THR-790) —
 * today only *Welcoming*. One sentence, no ladder: a single sub-unity row does not
 * justify a band vocabulary, and a word invented for a rung nothing stands on is
 * the chip-that-promises-what-the-engine-cannot-enact failure.
 */
export const CONDITION_TRAVEL_CHEAPER_SENTENCE = 'Travel through here costs less.';

/**
 * The term for a condition whose duration nothing declares — neither the grant
 * nor `CONDITION_DURATIONS`. Honest about the gap rather than guessing a number
 * (NFP #4): it is still true that the state ends.
 */
export const CONDITION_TERM_UNKNOWN = 'until it lifts';

/** `Iron` · `Iron and Stone` · `Iron, Eye and Stone` — no serial comma. */
function andList(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** The whole reading a condition surface needs, with no numeral in it. */
export interface ConditionEffectReading {
  /** What it does: `Iron, Eye and Stone slightly lower.` */
  readonly effect: string;
  /** How long it holds: `Lasts about one day.` */
  readonly term: string;
  /** Both, as one line — what a tooltip appends and the sheet's Effect row draws. */
  readonly line: string;
}

/**
 * One direction's clause. The magnitude word comes from the **strongest** reach
 * in the group: a condition that takes 0.08 off one reach and 0.04 off another
 * is described by the bigger of the two rather than averaged into a reading
 * neither reach has.
 */
function reachClause(entries: readonly (readonly [string, number])[], rising: boolean): string | null {
  if (entries.length === 0) return null;
  const names = entries.map(([key]) => reachDisplayName(key));
  const strongest = Math.max(...entries.map(([, value]) => Math.abs(value)));
  const word = magnitudeWord(strongest, CONDITION_MAGNITUDE_BANDS);
  return `${andList(names)} ${word} ${rising ? 'higher' : 'lower'}`;
}

/**
 * The player-facing effect of a condition **template**, or `null` when the
 * template declares no effect for this derivation to read.
 *
 * @param node  a shipped `trait.condition.*` definition node
 * @param grant the bearer's edge state, when there is one. `totalTicks` is the
 *              granted *term* (`readEdgeDuration`), which wins over the
 *              template default — an encounter may pass a `durationOverride`,
 *              and the sheet must then say the term the bearer actually has.
 *              The *remaining* count is a different question and stays in the
 *              sheet's own Duration section.
 */
export function conditionEffectLine(
  node: GraphNode,
  grant?: { readonly totalTicks?: number | null },
): ConditionEffectReading | null {
  const props = node.properties as Record<string, unknown>;
  const contributions = (props.domainContributions ?? {}) as Record<string, unknown>;
  // THR-1483 — the two reach-shaped substrates, read together. A person's effect
  // lives in `domainContributions` (walked by `computeRawScore`); a place's lives
  // in `LOCATION_CONDITION_STEP_MODIFIER` (walked by
  // `collectLocationConditionContributions`), because a place has no capability of
  // its own to raise — what it has is an effect on work done there.
  //
  // Merging is safe because the two are disjoint by construction: every location
  // condition carries `domainContributions: {}`, and the step table is keyed only
  // by location-condition ids. `conditionEffectLine.test.ts` pins that disjointness
  // rather than trusting it, so a future condition carrying both fails there
  // instead of silently double-counting one reach here.
  const stepModifier = (LOCATION_CONDITION_STEP_MODIFIER[node.id] ?? {}) as Record<string, unknown>;
  const signed = [...Object.entries(contributions), ...Object.entries(stepModifier)].filter(
    (entry): entry is [string, number] =>
      typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] !== 0,
  );

  // Risers before fallers: a mixed condition (Terrified lifts Shadow and drops
  // Iron) reads better as what it gives before what it costs.
  const clauses = [
    reachClause(signed.filter(([, value]) => value > 0), true),
    reachClause(signed.filter(([, value]) => value < 0), false),
  ].filter((clause): clause is string => clause !== null);

  const reachSentence = clauses.length > 0 ? `${clauses.join(', and ')}.` : null;

  // The third substrate reads as its own sentence rather than folding into the
  // reach clause, because it answers a different question — what this place costs
  // to *reach*, not what it does to the work. Appended rather than used as a
  // fallback (THR-1483): no shipped condition carries both today, but a condition
  // that grew one would otherwise have its travel cost silently dropped, and a
  // surface that omits half an effect is the defect this whole derivation exists
  // to prevent.
  //
  // THR-790 — a multiplier *below* one is the same substrate read from the other
  // side: *Welcoming* is the first location condition that makes a place cheaper to
  // reach, and `movementCost.ts` compounds it exactly as it compounds a tax above
  // one. It gets its own sentence rather than a band word, because there is one
  // such row and "costs a little less" would be inventing a ladder nothing climbs.
  const tax = LOCATION_CONDITION_MOVEMENT_TAX[node.id];
  const travelSentence =
    typeof tax === 'number' && Number.isFinite(tax) && tax > 1
      ? `Travel through here costs ${magnitudeWord(tax, CONDITION_TRAVEL_TAX_BANDS)}.`
      : typeof tax === 'number' && Number.isFinite(tax) && tax > 0 && tax < 1
        ? CONDITION_TRAVEL_CHEAPER_SENTENCE
        : null;

  const effect = [reachSentence, travelSentence].filter(s => s !== null).join(' ');

  if (effect.length === 0) return null;

  const ticks = grant?.totalTicks ?? CONDITION_DURATIONS[node.id];
  const term =
    typeof ticks === 'number' && Number.isFinite(ticks) && ticks > 0
      ? `Lasts about ${durationLabel(ticks)}.`
      : `Lasts ${CONDITION_TERM_UNKNOWN}.`;

  return { effect, term, line: `${effect} ${term}` };
}

// ─── Key humanising ──────────────────────────────────────────────────

/** `witness_story_followed` → `witness story followed`. */
export function humanizeKeySegment(raw: string): string {
  return raw.replace(/[-_]+/g, ' ').trim();
}

/**
 * A reputation tally key, resolved into something a mortal can read.
 *
 * **One shape exists in production:** `<reach>.positive` / `<reach>.negative`, the
 * typed `ReputationTallyKey` (`types/agent.ts`). It renders as the reach's name plus
 * what the tally is counting, and carries the `reach.*` tooltip id so the word is
 * explainable.
 *
 * The free-form `<namespace>.<authored_key>` branch below (`ac.guild_work`,
 * `army.command.banner_up`) used to be the *other* production shape, and describing
 * it that way was this function's part in hiding THR-1206's leak: it rendered a
 * readable sentence for keys the aftermath handler had already refused to write, so
 * the surface looked healthy over 171 discarded writes. THR-1207 re-authored the last
 * of them and `TALLY_KEY_RATCHET` is empty, so no shipped content reaches that branch
 * any more.
 *
 * It stays as a **defensive fallback only** (NFP #4) — a saved world written before
 * the sweep still carries old keys in `reputationTallies`, and a strange phrase beats
 * a missing sentence. It is not an authoring surface: a new off-axis key fails
 * `check:encounter` and `tallyKeyCorpus.test.ts` before it can ever get here.
 */
export function describeTallyKey(key: string): {
  readonly phrase: string;
  readonly concept?: EncounterAftermathConceptRef;
} {
  const segments = key.split('.');
  const head = segments[0] ?? key;
  const tail = segments.slice(1).join('.');

  if (segments.length === 2 && isReachName(head) && (tail === 'positive' || tail === 'negative')) {
    const name = reachDisplayName(head);
    const phrase = tail === 'positive'
      ? `reputation for ${name}`
      : `ill repute in ${name}`;
    return {
      phrase,
      concept: { text: name, tooltipId: reachTooltipId(head) },
    };
  }

  // Defensive fallback for a key no current content authors — a pre-sweep saved
  // world, or an engine-side key. Drop the namespace, humanise what is left.
  const meaningful = segments.length > 1 ? segments.slice(1).join(' ') : key;
  return { phrase: `record of ${humanizeKeySegment(meaningful)}` };
}

// ─── Derived aftermath sentences ─────────────────────────────────────

/** A derived sentence plus the game concepts it names. */
export interface DerivedSentence {
  readonly detail: string;
  readonly concepts: readonly EncounterAftermathConceptRef[];
}

/**
 * THR-1082 — a derived sentence that also keeps the structure it was built from.
 *
 * Every builder below already knows the state noun, the direction and the band —
 * it computes all three and then spends them on an English sentence, leaving the
 * surface a finished string it cannot draw an icon or a cluster from. That is
 * why "Vara's Stone grew steadily" was unreadable: not because the words were
 * wrong, but because by the time the chip saw it, `Stone`, `up` and `rung 2` had
 * ceased to exist as data.
 *
 * So the builders return both halves. The sentence keeps being built and keeps
 * being shipped — on a derived chip it becomes the tooltip and the aria text —
 * which is what keeps THR-1004's numeral gate a real gate over one address
 * rather than a rule the new fields could quietly route around.
 */
export interface DerivedChange extends DerivedSentence {
  /** The one concept that *is* the changed state — drives the icon tile and the tag. */
  readonly stateNoun: EncounterAftermathConceptRef;
  readonly direction: EncounterAftermathDirection;
  /** Absent when the change has no scale (an item changing hands, a gate opening). */
  readonly magnitude?: EncounterAftermathMagnitude;
  /**
   * Whether this change is worth a sentence on screen. `incidental` renders as a
   * compact icon-first row; `beat` keeps its full chip. Only the producer can
   * tell the difference — a capability drifting up is incidental, the same
   * capability crossing a tier is a beat.
   */
  readonly storyWeight: EncounterAftermathStoryWeight;
}

/** Direction word for a signed delta, given the pair of verbs for this quantity. */
function directionWord(delta: number, rose: string, fell: string): string {
  return delta >= 0 ? rose : fell;
}

/**
 * Capability growth. `tierCrossed` is the *fact* that a tier turned over —
 * the tier numbers themselves are designer data and stay on the trace.
 */
export function growthSentence(args: {
  readonly actorName: string;
  readonly domain: string;
  readonly applied: number;
  readonly tierCrossed: boolean;
}): DerivedChange {
  const name = reachDisplayName(args.domain);
  const word = magnitudeWord(args.applied, GROWTH_MAGNITUDE_BANDS);
  const tierClause = args.tierCrossed ? ' The work crossed into a new tier of mastery.' : '';
  const noun: EncounterAftermathConceptRef = { text: name, tooltipId: reachTooltipId(args.domain) };
  return {
    detail: `${args.actorName}'s ${name} grew ${word}.${tierClause}`,
    concepts: [noun],
    stateNoun: noun,
    direction: 'gain',
    // `raw` rides along so a second growth in the same reach can re-band the
    // *total* rather than draw a second identical cluster (THR-1467).
    magnitude: {
      ladder: 'growth',
      band: magnitudeBandIndex(args.applied, GROWTH_MAGNITUDE_BANDS),
      raw: args.applied,
    },
    // A tier turning over is the one time this change is a story beat rather
    // than the drift that happens every single encounter — Christian's ruling
    // (2026-08-10) is that the drift itself takes the story's place on screen.
    storyWeight: args.tierCrossed ? 'beat' : 'incidental',
  };
}

/** A trait the encounter granted. The trait name is a concept the chip can explain. */
export function traitGrantedSentence(args: {
  readonly actorName: string;
  readonly traitLabel: string;
}): DerivedChange {
  // A trait is a concept, not an entity with art — it takes emphasis and a
  // tooltip where one resolves, never an entity tile that would be a guess.
  const noun: EncounterAftermathConceptRef = { text: args.traitLabel };
  return {
    detail: `${args.actorName} came away carrying ${args.traitLabel}.`,
    concepts: [noun],
    stateNoun: noun,
    direction: 'gain',
    // A trait has no ladder — it is held or it is not. Per the fail-soft table
    // that draws a single triangle: noun plus direction is legible with no scale.
    storyWeight: 'beat',
  };
}

/**
 * Personal reputation. `flavour` distinguishes the three producers that all move
 * the same quantity — the authored shift, the branch checkpoint's judgement, and
 * the residual the snapshot diff catches — without any of them printing a delta.
 *
 * THR-1789 — the noun is the mortal's name plus `reputation`, the word the
 * character sheet heads this same `reputationScore` with. It read `world
 * standing` (THR-1136), and warm round 1 asked "bonds with whom?" of six rows
 * that were all one mortal's own reputation: there is no counterparty, so the
 * honest noun names whose it is. With `actorId` the noun links to that mortal,
 * so a click opens the sheet that shows the word (Law 17). Faction standing
 * (`factionStandingSentence`) is untouched. `raw` rides along so the producer
 * can fold an encounter's reputation movements into one net change before it
 * bands (THR-1467's pattern).
 */
export function reputationSentence(args: {
  readonly actorName: string;
  readonly actorId?: string;
  readonly delta: number;
  readonly flavour: 'authored' | 'branch' | 'residual';
}): DerivedChange {
  const word = magnitudeWord(args.delta, REPUTATION_MAGNITUDE_BANDS);
  const verb = directionWord(args.delta, 'rose', 'fell');
  const tail = args.flavour === 'branch'
    ? ' as the checkpoint\'s judgement landed'
    : '';
  const text = `${args.actorName}'s reputation`;
  // THR-1033 / THR-1789 — `ui.reputation` is registered with `ui.standing`'s
  // copy under the sheet's heading word, so the hover says what the sheet says.
  const noun: EncounterAftermathConceptRef = args.actorId
    ? {
      text,
      tooltipId: 'ui.reputation',
      entityId: args.actorId,
      visualKind: 'agent',
      visualName: args.actorName,
    }
    : { text, tooltipId: 'ui.reputation' };
  return {
    detail: `${text} ${verb} ${word}${tail}.`,
    concepts: [noun],
    stateNoun: noun,
    direction: args.delta >= 0 ? 'gain' : 'loss',
    magnitude: {
      ladder: 'reputation',
      band: magnitudeBandIndex(args.delta, REPUTATION_MAGNITUDE_BANDS),
      raw: args.delta,
    },
    storyWeight: 'incidental',
  };
}

/** Standing inside one faction. The faction is an entity, so it gets a visual and a link. */
export function factionStandingSentence(args: {
  readonly actorName: string;
  readonly factionId: string;
  readonly factionName: string;
  readonly delta: number;
  readonly beforeRole?: string;
  readonly afterRole?: string;
}): DerivedChange {
  const rankChanged = args.beforeRole !== args.afterRole;
  const noun: EncounterAftermathConceptRef = {
    text: args.factionName,
    entityId: args.factionId,
    visualKind: 'faction',
    visualName: args.factionName,
  };
  const concepts: EncounterAftermathConceptRef[] = [noun];

  if (Math.abs(args.delta) <= 0) {
    // Rank moved without the score moving — say the thing that actually changed.
    return {
      detail: `${args.factionName} now names ${args.actorName} ${humanizeKeySegment(args.afterRole ?? 'a member')}.`,
      concepts,
      stateNoun: noun,
      // A title changing hands is not a magnitude — it is the thing itself.
      direction: 'gain',
      storyWeight: 'beat',
    };
  }

  const word = magnitudeWord(args.delta, REPUTATION_MAGNITUDE_BANDS);
  const verb = directionWord(args.delta, 'rose', 'fell');
  const rankClause = rankChanged
    ? ` ${args.factionName} now names them ${humanizeKeySegment(args.afterRole ?? 'a member')}.`
    : '';
  return {
    detail: `${args.actorName}'s standing with ${args.factionName} ${verb} ${word}.${rankClause}`,
    concepts,
    stateNoun: noun,
    direction: args.delta >= 0 ? 'gain' : 'loss',
    magnitude: { ladder: 'reputation', band: magnitudeBandIndex(args.delta, REPUTATION_MAGNITUDE_BANDS) },
    // A faction *renaming* you is a beat worth a sentence; the score drifting
    // under an unchanged title is the same incidental noise as reach growth.
    storyWeight: rankChanged ? 'beat' : 'incidental',
  };
}

/**
 * `reputationTallySentence` was retired by THR-1136 §5 — director ruling,
 * 2026-08-16: *"they are small and more systemic than telling the player
 * anything. they are noise"*.
 *
 * Reputation tallies (`ReputationTallies`, `<reach>.positive|negative`) are a
 * **system-visible** quantity now. They still move, still steer scoring and
 * gating, and still mint the Whispered/Known/Legendary traits at their
 * thresholds — and a minted trait is a real, sheet-visible change that reports
 * normally. What they no longer do is speak to the player directly, so the
 * producer that turned one into a chip sentence has no caller and is gone
 * rather than left green-but-dead. Its only production caller was the snapshot
 * diff in `unifiedActionResolution.ts`, deleted in the same change.
 *
 * `describeTallyKey` and `TALLY_MAGNITUDE_BANDS` below are deliberately kept.
 * §5 preserves tally inspectability *"in traces and the designer view"*, and
 * they are the only vocabulary that turns `star.positive` into words — deleting
 * them would make that preserved inspectability unimplementable.
 *
 * THR-1140 resolved the debt they briefly carried by building that designer
 * view rather than pruning them: the debug panel's **Tallies** tab
 * (`components/Game/debug/TalliesDebugTab.tsx`) is their production caller, and
 * it is where §5's preserved inspectability actually lives. Law 13 names the
 * designer view as a place numbers may be shown, so that tab prints the raw
 * value and resolves the key through `describeTallyKey` beside it.
 *
 * That tab is the sanctioned consumer; a *player-facing* tally chip is still
 * forbidden. The visibility-parity clause under Law 13 in
 * `Docs/design-system/laws.md` bars one until a tally gains a sheet surface.
 */

/** A clearance gate changing state. States are already words; they only need casing. */
export function gateStateSentence(args: {
  readonly beforeState: string;
  readonly afterState: string;
}): DerivedChange {
  const noun: EncounterAftermathConceptRef = { text: 'the gate' };
  return {
    detail: `The gate shifted from ${humanizeKeySegment(args.beforeState)} to ${humanizeKeySegment(args.afterState)}.`,
    concepts: [],
    stateNoun: noun,
    // A gate turning over neither costs nor grants — it changes what is
    // reachable, which is what PATH's `opens` direction is for.
    direction: 'opens',
    storyWeight: 'beat',
  };
}

/**
 * A reward changing hands, or a mark taken in its place.
 *
 * `rewardId` is the instantiated node — pass it and the chip gets the item's
 * own art and a link to its page. Omit it and the chip still draws a designed
 * fallback tile, which is the pre-THR-1004 behaviour and remains correct for a
 * reward that never became a node.
 */
export function rewardSentence(args: {
  readonly actorName: string;
  readonly rewardName: string;
  readonly rewardId?: string;
  readonly gained: boolean;
  /** THR-1672 — a book that taught its new holder a spell on the way in. */
  readonly learnedSpellName?: string;
}): DerivedChange {
  const noun: EncounterAftermathConceptRef = {
    text: args.rewardName,
    entityId: args.rewardId,
    visualKind: 'artifact',
    visualName: args.rewardName,
  };
  return {
    detail: args.gained
      ? `${args.actorName} gained ${args.rewardName}${args.learnedSpellName ? `, and learned ${args.learnedSpellName}` : ''}.`
      : `${args.actorName} came away marked by ${args.rewardName}.`,
    concepts: [noun],
    stateNoun: noun,
    direction: args.gained ? 'gain' : 'loss',
    // An item is held or it is not — no ladder, and none is wanted.
    storyWeight: 'beat',
  };
}

/**
 * THR-2095 — why a reward draw left a scar, keyed on the drawn template's tags.
 *
 * First matching row wins, so the order runs specific to general. Each row has a
 * won line and a lost line: a won step that still scars reads as a cost of winning
 * ("not cleanly"), never against the band's "went well". Short on purpose — the
 * chip's cause and change share a 15-word budget (`NUDGE_WORD_BUDGETS.chipSentence`).
 */
export const REWARD_HARM_CAUSE_LINES: readonly {
  readonly tag: string | null;
  readonly won: string;
  readonly lost: string;
}[] = [
  { tag: '#combat', won: 'Not cleanly: a blow landed in the struggle', lost: 'A blow landed as it went wrong' },
  { tag: '#disease', won: 'Not cleanly: something caught along the way', lost: 'Something caught as it went wrong' },
  { tag: '#curse', won: 'Not cleanly: something followed them out', lost: 'Something followed them out of it' },
  { tag: '#fear', won: 'Not cleanly: it shook them on the way', lost: 'It shook them as it went wrong' },
  { tag: '#reputation', won: 'Not cleanly: word of the methods spread', lost: 'Word of the failure spread' },
  { tag: '#physical', won: 'Not cleanly: the body paid for it', lost: 'The body paid for the failure' },
  { tag: '#wound', won: 'Not cleanly: the body paid for it', lost: 'The body paid for the failure' },
  { tag: null, won: 'It went well, but not cleanly', lost: 'It went wrong and left a mark' },
];

export function rewardHarmCauseClause(args: {
  readonly tags: readonly string[];
  readonly stepWon: boolean;
}): string {
  const row = REWARD_HARM_CAUSE_LINES.find(r => r.tag === null || args.tags.includes(r.tag))
    ?? REWARD_HARM_CAUSE_LINES[REWARD_HARM_CAUSE_LINES.length - 1];
  return args.stepWon ? row.won : row.lost;
}

/**
 * The ending's one-line overview. Counts are spelled out — "one reward, three
 * skill shifts" — because a numeral on this line is the same violation as a
 * numeral on a chip, and it was the line Christian quoted first.
 */
export function overviewHighlightPhrase(counts: {
  readonly traits: number;
  readonly rewards: number;
  readonly growth: number;
  readonly hooks: number;
}): string | null {
  const parts: string[] = [];
  if (counts.traits > 0) parts.push(`${countWord(counts.traits)} trait change${counts.traits === 1 ? '' : 's'}`);
  if (counts.rewards > 0) parts.push(`${countWord(counts.rewards)} reward${counts.rewards === 1 ? '' : 's'}`);
  if (counts.growth > 0) parts.push(`${countWord(counts.growth)} skill shift${counts.growth === 1 ? '' : 's'}`);
  if (counts.hooks > 0) parts.push(`${countWord(counts.hooks)} lasting consequence${counts.hooks === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(', ') : null;
}

// ─── Action outcome vocabulary ───────────────────────────────────────

/**
 * THR-571 U1's outcome lexicon, hoisted here by THR-1035 so it has one owner.
 *
 * These exact words were authored for the Chapter *detail* header and lived as a
 * component-local map in `ChapterView.tsx`. The Chapter *Ledger* row — the thing
 * you click to open that header — could not reach them, so it interpolated
 * `r.outcome` raw and put `success_at_cost` on a player surface (Law 14).
 *
 * Hoisting rather than re-authoring is deliberate on two counts. The row and the
 * header now say the same words about the same chapter, which a second parallel
 * vocabulary would have quietly broken; and this module already declares itself
 * the only place the "what word does a mortal see" question is answered (rule 1
 * at the top of this file). A third copy is what produced the bug.
 *
 * Typed as a total `Record` over the union on purpose: a new outcome band fails
 * the typecheck here instead of silently reaching a player surface as its key.
 */
/** THR-1964 — the one price word, shared by the phrase table and the ending sentence. */
export const PRICE_WORDS = 'at a price';

export const OUTCOME_PHRASES: Record<UnifiedActionOutcome, string> = {
  critical_success: 'a triumph',
  success: 'it held',
  success_at_cost: `won, ${PRICE_WORDS}`,
  contested_won: 'won, contested',
  contested_lost: 'lost, contested',
  failure: 'it faltered',
  critical_failure: 'it broke',
};

/** Warn-once memo, so an unknown band cannot flood the console per render. */
const warnedOutcomes = new Set<string>();

/** Test seam: clears the warn-once memo. */
export function resetOutcomeWarnings(): void {
  warnedOutcomes.clear();
}

/**
 * An outcome band as a player-facing phrase, or `null` when the chapter has not
 * resolved yet (an absent outcome is a real state, not a failure to resolve one).
 *
 * Law 14's fallback clause, exactly: a key the vocabulary cannot resolve renders
 * as its best plain-English form and warns once — **never** as the key. So an
 * outcome band added upstream without a phrase here degrades to
 * `success at cost` rather than `success_at_cost`, and says so in DEV.
 */
export function outcomePhrase(outcome?: string | null): string | null {
  if (!outcome) return null;

  const known = OUTCOME_PHRASES[outcome as UnifiedActionOutcome];
  if (known) return known;

  if (!warnedOutcomes.has(outcome)) {
    warnedOutcomes.add(outcome);
    if (import.meta.env?.DEV) {
      console.warn(
        `[aftermathWords] no phrase for outcome '${outcome}' — falling back to humanised text. Add it to OUTCOME_PHRASES.`,
      );
    }
  }
  return humanizeKeySegment(outcome);
}

// ─── The ending sentence and its cause (THR-1964) ────────────────────

/**
 * THR-1964 — the ending as a sentence: "Kael won Bridge Toll, at a price."
 *
 * `OUTCOME_PHRASES` is a label ("won, at a price", "it held"); a sentence needs a
 * verb and a tail around the encounter's name, so this is the same lexicon in
 * sentence shape rather than a second vocabulary — the price band reads the one
 * {@link PRICE_WORDS}. It replaced `describeActionOutcome`'s "completed at great
 * cost", which was a second word for an outcome the aftermath already called
 * "won, at a price".
 */
export const OUTCOME_SENTENCE_SHAPES: Record<UnifiedActionOutcome, { readonly verb: string; readonly tail: string }> = {
  critical_success: { verb: 'won', tail: ' outright' },
  success: { verb: 'won', tail: '' },
  success_at_cost: { verb: 'won', tail: `, ${PRICE_WORDS}` },
  contested_won: { verb: 'won', tail: ', contested' },
  contested_lost: { verb: 'lost', tail: ', contested' },
  failure: { verb: 'lost', tail: '' },
  critical_failure: { verb: 'lost', tail: ' badly' },
};

/** "{actor} won {encounter}, at a price" — the ending clause, without its stop, for a caller that appends. */
export function outcomeClause(actorName: string, templateName: string, outcome?: UnifiedActionOutcome): string {
  const shape = (outcome && OUTCOME_SENTENCE_SHAPES[outcome]) ?? OUTCOME_SENTENCE_SHAPES.failure;
  return `${actorName} ${shape.verb} ${templateName}${shape.tail}`;
}

/** "{actor} won {encounter}, at a price." — the full ending sentence, with its stop. */
export function outcomeSentence(actorName: string, templateName: string, outcome?: UnifiedActionOutcome): string {
  return `${outcomeClause(actorName, templateName, outcome)}.`;
}

/** THR-1964 — the deciding step's verb, by its band. */
export const CAUSE_STEP_VERBS: Record<StepOutcome, string> = {
  critical_success: 'shone',
  success: 'went well',
  success_at_cost: 'held',
  near_miss: 'nearly broke',
  failure: 'failed',
  critical_failure: 'broke badly',
};

/** The god clause when a hand was on the deciding step and the ending was won. */
export const CAUSE_GOD_HELD = 'your cards held it';
/** The god clause when a hand was on the deciding step and the ending was lost. */
export const CAUSE_GOD_COULD_NOT_SAVE = 'your cards could not save it';
/** The mortal-alone clause. `{name}` is the actor. */
export const CAUSE_ALONE = (actorName: string): string => `${actorName} faced it alone`;
/** The step's noun when it has no title of its own. `{reach}` is the Reach's player name. */
export const CAUSE_UNTITLED_STEP = (reachName: string): string => `The work on ${reachName}`;

/** Outcomes whose deciding step is the *worst* one — the step that cost or lost it. */
const CAUSE_READS_WORST: ReadonlySet<UnifiedActionOutcome> = new Set<UnifiedActionOutcome>([
  'success_at_cost', 'failure', 'critical_failure', 'contested_lost',
]);

/** Outcomes the god clause reads as lost. */
const CAUSE_LOST_OUTCOMES: ReadonlySet<UnifiedActionOutcome> = new Set<UnifiedActionOutcome>([
  'failure', 'critical_failure', 'contested_lost',
]);

/** One resolved step, as the cause line needs to see it. */
export interface CauseLineStep {
  readonly band: StepOutcome;
  /** The step's Reach key (`gold`, `iron` …). Named by its player name. */
  readonly reach?: string;
  /** A player-facing title of the step's own ("First exchange"), when it has one. */
  readonly title?: string;
  /** A nudge hand was committed, or essence spent, on this step. */
  readonly godTouched: boolean;
}

/**
 * Does a step's band agree with the ending it would be named as deciding? A
 * loss needs a step that missed (`near_miss` or worse); an at-cost win a step
 * that cost (`success_at_cost` or worse); a win a step that held
 * (`success_at_cost` or better).
 */
export function causeBandAgrees(outcome: UnifiedActionOutcome, band: StepOutcome): boolean {
  const rank = STEP_OUTCOMES.indexOf(band);
  if (rank < 0) return false;
  if (CAUSE_LOST_OUTCOMES.has(outcome)) return rank >= STEP_OUTCOMES.indexOf('near_miss');
  if (CAUSE_READS_WORST.has(outcome)) return rank >= STEP_OUTCOMES.indexOf('success_at_cost');
  return rank <= STEP_OUTCOMES.indexOf('success_at_cost');
}

/** Index of the deciding step: the last step holding the worst (or best) band. */
export function decidingStepIndex(
  outcome: UnifiedActionOutcome,
  steps: readonly CauseLineStep[],
): number {
  const readsWorst = CAUSE_READS_WORST.has(outcome);
  let chosen = -1;
  let chosenRank = readsWorst ? -1 : Number.POSITIVE_INFINITY;
  steps.forEach((step, index) => {
    const rank = STEP_OUTCOMES.indexOf(step.band);
    if (rank < 0) return;
    // `>=` / `<=` so a tie goes to the later step — the one the ending turned on last.
    if (readsWorst ? rank >= chosenRank : rank <= chosenRank) {
      chosen = index;
      chosenRank = rank;
    }
  });
  return chosen;
}

/**
 * THR-1964 — the aftermath's first line: what decided the ending.
 *
 * "Kael won Bridge Toll, at a price. The work on Gold nearly broke, and your
 * cards held it." The outcome sentence, then the deciding step — named by its
 * own title or its Reach, given its band's verb — and whose hand was on it.
 *
 * Pure and deterministic (no RNG). Fail-soft: no resolved steps, or a deciding
 * step with neither a title nor a Reach, returns the outcome sentence alone.
 * Never a raw band or a token (Law 14).
 */
export function buildAftermathCauseLine(args: {
  readonly actorName: string;
  readonly templateName: string;
  readonly outcome: UnifiedActionOutcome;
  readonly steps: readonly CauseLineStep[];
}): string {
  const lead = outcomeSentence(args.actorName, args.templateName, args.outcome);
  const index = decidingStepIndex(args.outcome, args.steps);
  if (index < 0) return lead;
  const step = args.steps[index];
  // A deciding step whose band contradicts the ending ("won, at a price" over a
  // step that went well — the price came from elsewhere, a fight broken off)
  // cannot be what decided it, so the line says only what is known.
  if (!causeBandAgrees(args.outcome, step.band)) return lead;
  const noun = step.title
    ? (step.reach ? `${step.title} on ${reachDisplayName(step.reach)}` : step.title)
    : (step.reach ? CAUSE_UNTITLED_STEP(reachDisplayName(step.reach)) : undefined);
  if (!noun) return lead;
  // A step that failed outright was not held by anyone's cards, even on an
  // ending that was won at a price; a near miss was (the ticket's example).
  const stepFailed = STEP_OUTCOMES.indexOf(step.band) >= STEP_OUTCOMES.indexOf('failure');
  const clause = step.godTouched
    ? (CAUSE_LOST_OUTCOMES.has(args.outcome) || stepFailed ? CAUSE_GOD_COULD_NOT_SAVE : CAUSE_GOD_HELD)
    : CAUSE_ALONE(args.actorName);
  return `${lead} ${noun} ${CAUSE_STEP_VERBS[step.band]}, and ${clause}.`;
}

/** The price row's id — stable, so a re-render never duplicates it. */
export const PRICE_ROW_ID = 'aftermath.price';
/** The price row's title. */
export const PRICE_ROW_TITLE = 'The price';

/**
 * THR-1964 — the price a `success_at_cost` ending always pays, named.
 *
 * A step that lands `success_at_cost` costs quintessence and half the growth
 * (`outcomeConsequences.ts`, charged per step); only the visible scar is chance. When no scar drew
 * and the change set states no loss, the price would otherwise go unnamed, so
 * this one derived row names it — in words, never the amount (Law IV). When a
 * loss row or a complication already names a price this returns null, which
 * keeps THR-978's no-double-report rule (`buildAftermathConsequences.ts`).
 */
export function priceRowFor(args: {
  readonly outcome?: UnifiedActionOutcome;
  readonly actorId: string;
  readonly actorName: string;
  readonly changes: readonly { readonly polarity: string }[];
  readonly drewComplication: boolean;
  /**
   * A resolved step landed `success_at_cost` — the band that actually charges
   * the price (`computeOutcomeConsequence` runs per step). An at-cost ending
   * reached any other way (a fight broken off with no roll, a weakened-continue
   * failure) paid nothing, so it names nothing.
   */
  readonly paidAtCostStep: boolean;
}): {
  readonly id: string;
  readonly kind: 'growth';
  readonly title: string;
  readonly polarity: 'loss';
  readonly actorId: string;
  readonly actorName: string;
} & DerivedChange | null {
  if (args.outcome !== 'success_at_cost') return null;
  if (!args.paidAtCostStep) return null;
  if (args.drewComplication) return null;
  // `mixed` draws as a cost chip too (`isCost`, buildAftermathConsequences.ts).
  if (args.changes.some(change => change.polarity === 'loss' || change.polarity === 'mixed')) return null;
  const noun: EncounterAftermathConceptRef = {
    text: args.actorName,
    entityId: args.actorId,
    visualKind: 'agent',
    visualName: args.actorName,
  };
  return {
    id: PRICE_ROW_ID,
    kind: 'growth',
    title: PRICE_ROW_TITLE,
    polarity: 'loss',
    actorId: args.actorId,
    actorName: args.actorName,
    detail: `It took something out of ${args.actorName}, and ${args.actorName} learned less from it than a clean win teaches.`,
    concepts: [noun],
    stateNoun: noun,
    direction: 'loss',
    storyWeight: 'beat',
  };
}

// ─── The rule, as a predicate ────────────────────────────────────────

/**
 * Any Arabic numeral. The words-never-numerals rule is stated as a regex so a
 * test can hold every derived sentence to it, and so a future producer that
 * reaches for `toFixed` fails a gate instead of a review.
 */
export const NUMERAL_PATTERN = /\d/;

/** True when a player-facing string contains a numeral it must not. */
export function containsNumeral(text: string): boolean {
  return NUMERAL_PATTERN.test(text);
}
