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
import { TICKS_PER_DAY } from '../data/attention-constants';
import type {
  EncounterAftermathConceptRef,
  EncounterAftermathDirection,
  EncounterAftermathMagnitude,
  EncounterAftermathStoryWeight,
  UnifiedActionOutcome,
} from '../types/unifiedAction';

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

/** True when `raw` names a reach this module has a display word for. */
export function isReachName(raw: string): raw is ReachDomain {
  return Object.prototype.hasOwnProperty.call(REACH_DISPLAY_NAMES, raw);
}

/**
 * The reaches the tooltip registry can actually resolve — the nine `reach.*`
 * nodes in `world-model.json` (THR-1033).
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
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh',
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
    magnitude: { ladder: 'growth', band: magnitudeBandIndex(args.applied, GROWTH_MAGNITUDE_BANDS) },
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
 */
export function reputationSentence(args: {
  readonly actorName: string;
  readonly delta: number;
  readonly flavour: 'authored' | 'branch' | 'residual';
}): DerivedChange {
  const word = magnitudeWord(args.delta, REPUTATION_MAGNITUDE_BANDS);
  const verb = directionWord(args.delta, 'rose', 'fell');
  const tail = args.flavour === 'branch'
    ? ' as the checkpoint\'s judgement landed'
    : '';
  // THR-1033 — `ui.standing` is the id the registry actually holds. This read
  // `ui.reputation`, which has never existed in `ui-content.ts`, so every
  // STANDING chip in the game carried an unresolvable tooltip.
  //
  // THR-1136 — the noun names its *scope*. It read a bare `standing`, which is
  // the same word faction standing uses, so on an ending carrying both the two
  // chips rendered as `BOND · STANDING` twice with nothing saying whose regard
  // was moving. `factionStandingSentence` already solves its half by putting the
  // faction's name in the noun; this is the other half — the regard of the world
  // at large, which is exactly what the tally is *not* (see §5 of THR-1136).
  // Deliberately the ticket's own phrase rather than a coined term, so no new UL
  // entry is minted for a display word the glossary already covers under
  // `standing`.
  const noun: EncounterAftermathConceptRef = { text: 'world standing', tooltipId: 'ui.standing' };
  return {
    detail: `${args.actorName}'s standing in the world ${verb} ${word}${tail}.`,
    concepts: [noun],
    stateNoun: noun,
    direction: args.delta >= 0 ? 'gain' : 'loss',
    magnitude: { ladder: 'reputation', band: magnitudeBandIndex(args.delta, REPUTATION_MAGNITUDE_BANDS) },
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

/** A follow-on tag the gate leaves behind. */
export function gateFollowOnSentence(tag: string): DerivedChange {
  const label = humanizeKeySegment(tag.replace(/^#/, ''));
  return {
    detail: `The gate leaves behind ${label}.`,
    concepts: [],
    stateNoun: { text: label },
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
}): DerivedChange {
  const noun: EncounterAftermathConceptRef = {
    text: args.rewardName,
    entityId: args.rewardId,
    visualKind: 'artifact',
    visualName: args.rewardName,
  };
  return {
    detail: args.gained
      ? `${args.actorName} gained ${args.rewardName}.`
      : `${args.actorName} came away marked by ${args.rewardName}.`,
    concepts: [noun],
    stateNoun: noun,
    direction: args.gained ? 'gain' : 'loss',
    // An item is held or it is not — no ladder, and none is wanted.
    storyWeight: 'beat',
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
export const OUTCOME_PHRASES: Record<UnifiedActionOutcome, string> = {
  critical_success: 'a triumph',
  success: 'it held',
  success_at_cost: 'won, at a price',
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
