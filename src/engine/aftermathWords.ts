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
import type { EncounterAftermathConceptRef } from '../types/unifiedAction';

// ─── Reach vocabulary ────────────────────────────────────────────────

/**
 * Reach → display name. Same set the Codex draws (`components/Codex/codexRegistry.ts`);
 * duplicated as data rather than imported because the engine must not depend on a
 * component module.
 */
export const REACH_DISPLAY_NAMES: Record<string, string> = {
  iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil',
  heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star',
  flesh: 'Flesh', time: 'Time', life: 'Life',
};

/** True when `raw` names one of the reaches the tooltip registry can resolve. */
export function isReachName(raw: string): raw is ReachDomain {
  return Object.prototype.hasOwnProperty.call(REACH_DISPLAY_NAMES, raw);
}

/** Reach → display name, falling back to a humanised form of an unknown key. */
export function reachDisplayName(raw: string): string {
  return REACH_DISPLAY_NAMES[raw] ?? humanizeKeySegment(raw);
}

/** Tooltip concept id for a reach, or undefined when the word is not a reach. */
export function reachTooltipId(raw: string): string | undefined {
  return isReachName(raw) ? `reach.${raw}` : undefined;
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

// ─── Key humanising ──────────────────────────────────────────────────

/** `witness_story_followed` → `witness story followed`. */
export function humanizeKeySegment(raw: string): string {
  return raw.replace(/[-_]+/g, ' ').trim();
}

/**
 * A reputation tally key, resolved into something a mortal can read.
 *
 * Two shapes exist in production and both are handled:
 *
 * - `<reach>.positive` / `<reach>.negative` — the typed `ReputationTallyKey`
 *   (`types/agent.ts`). Renders as the reach's name plus what the tally is
 *   counting, and carries the `reach.*` tooltip id so the word is explainable.
 * - `<namespace>.<authored_key>` — a free-form authored tally
 *   (`ac.guild_work`, `army.command.banner_up`). The namespace is engine
 *   bookkeeping and is dropped; the tail is humanised.
 *
 * Fail-soft (NFP #4): an unrecognised key is humanised whole rather than
 * thrown away — a strange phrase beats a missing sentence.
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

  // Free-form authored key: drop the namespace, humanise what is left.
  const meaningful = segments.length > 1 ? segments.slice(1).join(' ') : key;
  return { phrase: `record of ${humanizeKeySegment(meaningful)}` };
}

// ─── Derived aftermath sentences ─────────────────────────────────────

/** A derived sentence plus the game concepts it names. */
export interface DerivedSentence {
  readonly detail: string;
  readonly concepts: readonly EncounterAftermathConceptRef[];
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
}): DerivedSentence {
  const name = reachDisplayName(args.domain);
  const word = magnitudeWord(args.applied, GROWTH_MAGNITUDE_BANDS);
  const tierClause = args.tierCrossed ? ' The work crossed into a new tier of mastery.' : '';
  return {
    detail: `${args.actorName}'s ${name} grew ${word}.${tierClause}`,
    concepts: [{ text: name, tooltipId: reachTooltipId(args.domain) }],
  };
}

/** A trait the encounter granted. The trait name is a concept the chip can explain. */
export function traitGrantedSentence(args: {
  readonly actorName: string;
  readonly traitLabel: string;
}): DerivedSentence {
  // A trait is a concept, not an entity with art — it takes emphasis and a
  // tooltip where one resolves, never an entity tile that would be a guess.
  return {
    detail: `${args.actorName} came away carrying ${args.traitLabel}.`,
    concepts: [{ text: args.traitLabel }],
  };
}

/**
 * Personal reputation. `flavour` distinguishes the three producers that all move
 * the same quantity — the authored shift, the branch checkpoint's judgement, and
 * the residual the snapshot diff catches — without any of them printing a delta.
 */
export function reputationSentence(args: {
  readonly actorName: string;
  readonly delta: number;
  readonly flavour: 'authored' | 'branch' | 'residual';
}): DerivedSentence {
  const word = magnitudeWord(args.delta, REPUTATION_MAGNITUDE_BANDS);
  const verb = directionWord(args.delta, 'rose', 'fell');
  const tail = args.flavour === 'branch'
    ? ' as the checkpoint\'s judgement landed'
    : '';
  return {
    detail: `${args.actorName}'s standing ${verb} ${word}${tail}.`,
    concepts: [{ text: 'standing', tooltipId: 'ui.reputation' }],
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
}): DerivedSentence {
  const rankChanged = args.beforeRole !== args.afterRole;
  const concepts: EncounterAftermathConceptRef[] = [{
    text: args.factionName,
    entityId: args.factionId,
    visualKind: 'faction',
    visualName: args.factionName,
  }];

  if (Math.abs(args.delta) <= 0) {
    // Rank moved without the score moving — say the thing that actually changed.
    return {
      detail: `${args.factionName} now names ${args.actorName} ${humanizeKeySegment(args.afterRole ?? 'a member')}.`,
      concepts,
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
  };
}

/** A reputation tally deepening or thinning. This is the `star.positive` site. */
export function reputationTallySentence(args: {
  readonly actorName: string;
  readonly key: string;
  readonly delta: number;
}): DerivedSentence {
  const { phrase, concept } = describeTallyKey(args.key);
  const word = magnitudeWord(args.delta, TALLY_MAGNITUDE_BANDS);
  const verb = directionWord(args.delta, 'deepened', 'thinned');
  return {
    detail: `${args.actorName}'s ${phrase} ${verb} ${word}.`,
    concepts: concept ? [concept] : [],
  };
}

/** A clearance gate changing state. States are already words; they only need casing. */
export function gateStateSentence(args: {
  readonly beforeState: string;
  readonly afterState: string;
}): DerivedSentence {
  return {
    detail: `The gate shifted from ${humanizeKeySegment(args.beforeState)} to ${humanizeKeySegment(args.afterState)}.`,
    concepts: [],
  };
}

/** A follow-on tag the gate leaves behind. */
export function gateFollowOnSentence(tag: string): DerivedSentence {
  return {
    detail: `The gate leaves behind ${humanizeKeySegment(tag.replace(/^#/, ''))}.`,
    concepts: [],
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
}): DerivedSentence {
  return {
    detail: args.gained
      ? `${args.actorName} gained ${args.rewardName}.`
      : `${args.actorName} came away marked by ${args.rewardName}.`,
    concepts: [{
      text: args.rewardName,
      entityId: args.rewardId,
      visualKind: 'artifact',
      visualName: args.rewardName,
    }],
  };
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
