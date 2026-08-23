/**
 * THR-971 — map a resolved encounter's authored aftermath onto the mockup's
 * consequence chips: what you got, what it cost, what it planted.
 *
 * This module is deliberately pure and free of React, graph, and engine
 * imports. The taxonomy is the part that has to be *right*, so it is the part
 * that has to be cheap to test in isolation.
 *
 * ## The mapping is a re-presentation, never a second vocabulary
 *
 * Every chip is derived from something the encounter already declares:
 *
 * | Chip       | Source                                                        |
 * | ---------- | ------------------------------------------------------------- |
 * | `prize`    | `item` change, gained                                          |
 * | `standing` | `reputation` / `faction_reputation` / `reputation_tally`       |
 * | `toll`     | anything given up — a lost `item`, `growth`, or `shell_state`  |
 * | `wound`    | `trait` change that cost the bearer something                  |
 * | `seed`     | `future_hook` change **and** `encounter_seed` reaction effects |
 * | `mark`     | everything else (fail-soft)                                    |
 *
 * ## `toll` reads authored losses, never the quintessence event — settled, THR-978
 *
 * THR-971's taxonomy named `consequence.quintessenceEvent` as the toll source; this
 * module shipped reading the authored change set's losses instead, and THR-978 was
 * filed to decide whether to widen `UnifiedAction` to carry the Q event across.
 * **The verdict is that it should not be. The authored-loss mapping is the correct
 * source, permanently — this is a design rule now, not an unpaid debt.**
 *
 * `QuintessenceEvent` (`types/quintessence.ts`) carries exactly four fields:
 * `targetNodeId`, `delta`, `source`, `tick`. None of them is authored prose.
 *
 * - `delta` is a magnitude, and the nudge-model surface rules forbid rendering one.
 *   The type's own header says the same thing: "Displayed prose-only via IPK —
 *   never show numbers to player."
 * - `source` is a machine token (`'outcome_success_at_cost'`, …). Drawn on a chip
 *   that is a key:value label, which is unfinished UX rather than a sentence.
 * - `targetNodeId` and `tick` say nothing about a price.
 *
 * It also adds no information the chip cannot already see. `computeOutcomeConsequence`
 * derives the event purely from the outcome band — a reward on `critical_success`, a
 * penalty on `success_at_cost` and `critical_failure`, `null` on the other three — and
 * the ending already carries that band in `EncounterAftermathSummary.outcome` and
 * `narrativeTag`. The single thing the Q event adds is the magnitude, which is the one
 * part that may not be shown.
 *
 * So surfacing it would mean authoring a new (band × source) → sentence table: a second
 * vocabulary, which is precisely what the rule above forbids. On a `success_at_cost`
 * ending it would also double-report, since the authored change set has already stated
 * that price in words. Persisting the Q event onto `UnifiedAction` would be engine
 * surface widened to serve a display that must not exist.
 *
 * ## One genuine deviation from the ticket's stated sources
 *
 * **`seed` reads the resolved variant's reaction effects.** `encounter_seed`
 * is only expressible as an `EncounterAftermathReactionEffect`, so a planted
 * sequel is attached to a reaction rather than to the ending as a whole. A
 * variant offering one reaction therefore plants unconditionally; one
 * offering several plants conditionally on the pick. Both are surfaced the
 * same way, because "this ending sets X in motion" is true either way and
 * silence is the failure mode this ticket exists to fix.
 *
 * Nothing here prints a magnitude. Chip sentences are authored prose; a toll is
 * stated in words, per the nudge-model surface rules.
 *
 * ## The sentence was not always prose — THR-1004
 *
 * That last paragraph was true of this module and false of the game. Roughly
 * half the change set is **engine-derived** rather than authored, and those
 * producers used to hand over debug-grade template literals (`toFixed(2)`, the
 * raw tally key `star.positive`). This module rendered them faithfully, which
 * is how two decimal places reached a mortal-facing chip. The fix is at the
 * source — `engine/aftermathWords.ts` now owns every derived sentence — and the
 * job here is the other half of the UI Law: a game concept named on a chip
 * carries its **image**, its **tooltip**, and its **link** where a page exists.
 *
 * A producer declares what it named (`EncounterAftermathChange.concepts`)
 * rather than the surface guessing from English. `applyConceptDecorations`
 * attaches the tooltip/link; `resolveIcon` turns the first entity-bearing
 * concept into the chip's tile. Both are fail-open: an undecorated concept
 * still renders as text, and a chip with no resolvable entity draws its kind
 * tag alone, exactly as it did before.
 */

import type {
  EncounterAftermathChange,
  EncounterAftermathChangeKind,
  EncounterAftermathChangePolarity,
  EncounterAftermathConceptRef,
  EncounterAftermathReaction,
} from '../../../../types/unifiedAction';
// The bound lives with the component that draws the marks, so the adapter's
// clamp and the renderer's clamp cannot drift to different numbers.
import { DELTA_CLUSTER_MAX } from '../../../shared/DeltaCluster';
import type {
  EncounterStageConsequenceCategory,
  EncounterStageConsequenceChipModel,
  EncounterStageConsequenceDeltaModel,
  EncounterStageConsequenceIconModel,
  EncounterStageConsequenceKind,
  EncounterStageConsequenceTone,
  EncounterStageNarrativeParagraph,
  EncounterStageNarrativeSegment,
} from '../types';

/** Kind tag drawn on the chip. Uppercased at the data layer so the surface does not have to. */
export const CONSEQUENCE_KIND_LABELS: Record<EncounterStageConsequenceKind, string> = {
  prize: 'PRIZE',
  standing: 'STANDING',
  toll: 'TOLL',
  wound: 'WOUND',
  seed: 'SEED',
  mark: 'MARK',
};

// ─── THR-1082 — the four story-first categories ──────────────────────

/** The category word drawn on the tag. NFP #1: the vocabulary is data. */
export const CONSEQUENCE_CATEGORY_LABELS: Record<EncounterStageConsequenceCategory, string> = {
  scar: 'SCAR',
  bond: 'BOND',
  boon: 'BOON',
  path: 'PATH',
};

/**
 * Icon-tile fallback, drawn only when neither an entity nor a reach resolves.
 *
 * Keyed on the category union, so a fifth category added without a glyph is a
 * *type error* rather than a blank tile (Law 9 — a new card type without an icon
 * is a build failure, THR-890). Drawn from the card-glyph family already on the
 * encounter surfaces rather than a new set.
 */
export const CONSEQUENCE_CATEGORY_GLYPHS: Record<EncounterStageConsequenceCategory, string> = {
  scar: '✕',
  bond: '◈',
  boon: '✦',
  path: '◆',
};

/**
 * THR-1136 — the registry id that explains each category word.
 *
 * One derivation, read by both surfaces that draw the vocabulary: the
 * first-contact legend and the chip tag itself (Law 27 — one rule, one place).
 * The legend used to build this string inline in `EncounterVeil`, which is
 * exactly how the chip came to have no tooltip at all: the id existed, and the
 * only thing that knew how to spell it was the surface that was already
 * dismissable.
 */
export const CONSEQUENCE_CATEGORY_TOOLTIP_IDS: Record<EncounterStageConsequenceCategory, string> =
  {
    scar: 'ui.consequence.scar',
    bond: 'ui.consequence.bond',
    boon: 'ui.consequence.boon',
    path: 'ui.consequence.path',
  };

/**
 * THR-1136 — the order the ending reads its categories in.
 *
 * The legend's own story order: what it cost, who it changed, what was earned,
 * what it opened. Emission order used to reach the screen untouched, so a
 * two-of-each ending interleaved BOON/BOND/BOON/BOND and read as a shuffled
 * list rather than a told story.
 */
export const CONSEQUENCE_CATEGORY_ORDER: readonly EncounterStageConsequenceCategory[] = [
  'scar',
  'bond',
  'boon',
  'path',
];

/**
 * Band rung → triangles, per ladder.
 *
 * The ladders are 4–5 rungs deep and the display is three steps, so this is a
 * deliberate collapse, not a mapping bug: the ladders stay full-depth as *data*
 * (other systems band against them) and only the drawn cluster is coarsened.
 * Index is the **ascending** rung `magnitudeBandIndex` returns — 0 is faintest.
 */
export const DELTA_CLUSTER_BAND_MAP: Record<'growth' | 'reputation' | 'tally', readonly number[]> = {
  growth: [1, 1, 2, 3, 3],
  reputation: [1, 1, 2, 3, 3],
  tally: [1, 1, 2, 3],
};

/** Law 51 — the legend's dismissal outlives the session. */
export const CONSEQUENCE_LEGEND_STORE_KEY = 'threadbare.ui.consequenceLegendSeen';

/**
 * Words for how big a drawn cluster reads. Law 11 requires every glyph row to
 * state its reading in words; this is that reading, and it is deliberately
 * *coarser* than the five-rung ladder because it describes the cluster the
 * player can see, not the band the engine computed.
 */
export const DELTA_CLUSTER_WORDS: Record<number, string> = {
  1: 'a slight amount',
  2: 'a clear amount',
  3: 'a great amount',
};

/**
 * Fold a wire chip kind into its story category.
 *
 * The six display kinds were mechanical buckets; these four are what the change
 * means to the character. MARK has no successor by design — "everything else"
 * can never be story-legible, which is the whole reason it read as noise — so an
 * unclassifiable change folds by **polarity** instead, and can never land in a
 * fifth bucket.
 */
export function categoryForKind(
  kind: EncounterStageConsequenceKind,
  polarity: EncounterAftermathChangePolarity,
): EncounterStageConsequenceCategory {
  switch (kind) {
    case 'prize':
      return 'boon';
    case 'standing':
      return 'bond';
    case 'toll':
    case 'wound':
      return 'scar';
    case 'seed':
      return 'path';
    case 'mark':
    default:
      // The polarity rule inherits MARK's fail-soft duty.
      if (polarity === 'gain') return 'boon';
      if (isCost(polarity)) return 'scar';
      return 'path';
  }
}

/**
 * Derive the drawn cluster from a change's declared direction and magnitude.
 *
 * Returns `undefined` only when the producer declared no direction at all —
 * pre-THR-1082 authored content, which keeps rendering exactly as it did.
 *
 * Fail-soft (NFP #4): a change with a direction but *no* magnitude draws a
 * single triangle rather than nothing. That is the Eldritch Horror "impair"
 * case the design leans on — a noun plus a direction is legible with no scale,
 * and an item either changed hands or it did not.
 */
export function deltaClusterFor(
  change: EncounterAftermathChange,
  nounText: string | undefined,
): EncounterStageConsequenceDeltaModel | undefined {
  if (!change.direction) return undefined;

  if (change.direction === 'opens') {
    return {
      direction: 'opens',
      count: 1,
      label: nounText ? `${nounText} — a way opens` : 'A way opens',
    };
  }

  let count = 1;
  if (change.magnitude) {
    const map = DELTA_CLUSTER_BAND_MAP[change.magnitude.ladder];
    // Clamp rather than throw: a band index outside its ladder means a ladder
    // grew a rung without this map following, which must not blank the chip.
    const clamped = Math.max(0, Math.min(map.length - 1, Math.round(change.magnitude.band)));
    if (!Number.isFinite(change.magnitude.band) || change.magnitude.band !== clamped) {
      warnOnceOutOfRange(change.magnitude.ladder, change.magnitude.band);
    }
    count = map[clamped] ?? 1;
  }
  count = Math.max(1, Math.min(DELTA_CLUSTER_MAX, count));

  const verb = change.direction === 'gain' ? 'rose' : 'fell';
  const amount = DELTA_CLUSTER_WORDS[count] ?? DELTA_CLUSTER_WORDS[1];
  return {
    direction: change.direction,
    count,
    label: nounText ? `${nounText} ${verb}, ${amount}` : `${verb}, ${amount}`,
  };
}

/** One warning per ladder, not one per chip — a broken map must not flood the console. */
const warnedLadders = new Set<string>();
function warnOnceOutOfRange(ladder: string, band: number): void {
  if (warnedLadders.has(ladder)) return;
  warnedLadders.add(ladder);
  console.warn(
    `[consequence] magnitude band ${band} is outside the '${ladder}' cluster map; clamped. `
    + 'DELTA_CLUSTER_BAND_MAP has fallen behind its ladder in engine/aftermathWords.ts.',
  );
}

/** A change polarity that means the bearer gave something up. */
function isCost(polarity: EncounterAftermathChangePolarity): boolean {
  return polarity === 'loss' || polarity === 'mixed';
}

/**
 * The chip's colour — **one signal channel with the arrow, never a second one**
 * (THR-1205).
 *
 * Colour and cluster used to be derived from two independent authored fields,
 * `polarity` and `direction`, which are free to disagree — and on
 * `slice.kin.a_cooler_welcome` they did: `polarity: 'mixed'` painted the chip
 * red while `direction: 'gain'` drew an up arrow, so a bond the ending had
 * genuinely granted rendered as a red rise. The director's reading, verbatim:
 * *"it is red, and with a red arrow up, signifying bad? arrow up or down? i am
 * confused"*. Two channels that can contradict is not a content bug to fix
 * chip by chip — every `mixed`+`gain` chip renders that way by construction.
 *
 * So **direction wins wherever a direction exists**, and `polarity` survives
 * only as the tiebreak for direction-less chips (all pre-THR-1082 authored
 * content, which keeps rendering exactly as it did — NFP #6). A weaker-than-
 * hoped gain is a *smaller* green cluster, never a red one; when an ending
 * genuinely costs something as well as granting it, that is two chips, or the
 * cost stays in the band's prose. `deltaClusterFor` reads the same field, so
 * the pair cannot drift again — see the invariant test.
 *
 * Note this deliberately sits **above** the `toll`/`wound` rule: those kinds
 * only ever classify from a costing polarity, so a toll that declares a rise
 * is a contradiction of exactly the kind this function exists to make
 * unrepresentable, not a case to preserve.
 */
function toneFor(
  kind: EncounterStageConsequenceKind,
  change: EncounterAftermathChange,
): EncounterStageConsequenceTone {
  if (kind === 'seed') return 'seed';
  // `opens` has no gain/loss axis, so it falls through to the polarity rule.
  if (change.direction === 'gain') return 'gain';
  if (change.direction === 'loss') return 'loss';
  if (kind === 'toll' || kind === 'wound') return 'loss';
  if (change.polarity === 'gain') return 'gain';
  if (isCost(change.polarity)) return 'loss';
  return 'info';
}

/** Flatten a segmented sentence back to text, for the compact chip's hover tier. */
function paragraphText(paragraph: EncounterStageNarrativeParagraph): string {
  return paragraph.segments.map(s => s.text).join('');
}

/**
 * The tag's noun half, uppercased to sit beside the category word.
 *
 * Law 14: a key never reaches the player. The state noun arrives already
 * resolved through the engine's display vocabularies (`reachDisplayName`,
 * `describeTallyKey`), so this only cases it.
 */
function nounLabelFor(text: string | undefined): string | undefined {
  const trimmed = text?.trim();
  return trimmed ? trimmed.toUpperCase() : undefined;
}

/**
 * A reach state-noun tiles with the reach glyph rather than an entity picture.
 *
 * Detected from the declared `reach.*` tooltip id, not by matching the display
 * name against a word list — the producer already said what this concept is
 * (Law 2), so reading it back out of English would be exactly the guess that
 * law forbids.
 */
const REACH_TOOLTIP_PREFIX = 'reach.';
function reachDomainFor(concept: EncounterAftermathConceptRef | undefined): string | undefined {
  if (!concept?.tooltipId?.startsWith(REACH_TOOLTIP_PREFIX)) return undefined;
  return concept.tooltipId.slice(REACH_TOOLTIP_PREFIX.length) || undefined;
}

/**
 * THR-1122 — the tooltip id for a concept that named an attachment.
 *
 * A concept declaring `visualKind: 'attachment'` already carries the template's
 * node id in `entityId` (THR-1120), so the registry id is a mechanical function
 * of what the producer said — deriving it beats asking ~12 authored call sites
 * to repeat the id in a second field, where it would drift the first time a
 * template was renamed.
 *
 * The string is built, never resolved: this module is deliberately free of
 * engine imports (see the header), so it says which id *would* explain this
 * concept and the registry answers. A word whose id resolves to nothing is
 * drawn as plain text by `NarrativeSegments`, which gates its underline on
 * `tooltipResolves` — so an unshipped template cannot become a dead link.
 */
const ATTACHMENT_TOOLTIP_PREFIX = 'attachment.';
function attachmentTooltipIdFor(
  concept: EncounterAftermathConceptRef,
): string | undefined {
  if (concept.tooltipId) return concept.tooltipId;
  if (concept.visualKind !== 'attachment' || !concept.entityId) return undefined;
  return `${ATTACHMENT_TOOLTIP_PREFIX}${concept.entityId}`;
}

/**
 * Classify one authored change into its chip kind.
 *
 * Exported for direct unit testing: this table is the contract, and an
 * unrecognised kind must degrade to `mark` rather than vanish.
 */
export function classifyChangeKind(
  kind: EncounterAftermathChangeKind | string,
  polarity: EncounterAftermathChangePolarity,
): EncounterStageConsequenceKind {
  switch (kind) {
    case 'item':
      // An item that left the bearer's hands is a price, not a prize.
      return isCost(polarity) ? 'toll' : 'prize';
    case 'reputation':
    case 'faction_reputation':
    case 'reputation_tally':
      return 'standing';
    case 'trait':
      // A trait that cost something is a wound; one that did not is a mark on
      // the bearer — the same distinction the wound system draws (THR-117).
      return isCost(polarity) ? 'wound' : 'mark';
    case 'future_hook':
      return 'seed';
    case 'growth':
    case 'shell_state':
      return isCost(polarity) ? 'toll' : 'mark';
    default:
      // Fail-soft: an unknown kind is still a consequence and still renders.
      return 'mark';
  }
}

/**
 * Segment a chip sentence so named entities link.
 *
 * Injected rather than imported so this module stays pure — the adapter passes
 * a closure over `autoLinkNarrative` bound to the encounter's link entries.
 */
export type ChipSentenceLinker = (
  id: string,
  text: string,
) => EncounterStageConsequenceChipModel['sentence'];

/**
 * Resolve a change's declared entity concept into the chip's icon.
 *
 * Injected rather than imported for the same reason `link` is: this module must
 * stay free of graph and React imports. The adapter closes over the world graph
 * and the entity-visual resolver; a host that passes nothing simply gets chips
 * without icons, which is the fail-open behaviour (NFP #4).
 */
export type ChipIconResolver = (
  concept: EncounterAftermathConceptRef,
) => EncounterStageConsequenceIconModel | undefined;

export interface BuildAftermathConsequencesArgs {
  /** The authored change set the ending resolved to. */
  changes: readonly EncounterAftermathChange[];
  /**
   * Reactions offered by the resolved variant. Scanned for `encounter_seed`
   * effects — the only place a planted sequel is expressible.
   */
  reactions?: readonly EncounterAftermathReaction[];
  /** Enrich authored prose (placeholder expansion) before segmenting it. */
  enrich: (text: string) => string;
  /** Segment an enriched sentence into linkable parts. */
  link: ChipSentenceLinker;
  /** THR-1004 — resolve a named entity concept to its chip tile. */
  resolveIcon?: ChipIconResolver;
  /**
   * THR-1164 — turn a declared anchor into a node id in *this* world.
   *
   * Most anchors are literal and shared across every world (an attachment's
   * template node), but the ones that cannot be — a faction whose node is minted
   * per world, a cast actor, the acting agent — are authored as sentinels and
   * only the graph can say what they mean here. This adapter holds the graph;
   * the veil below it does not, and that division is the reason this arrives as
   * a callback rather than the module reaching for the world itself.
   *
   * When it returns `undefined` the anchor is **dropped** rather than passed
   * through: an unresolved `$actor` reaching the surface would render as a live
   * link to a node id that does not exist (Law 21). Dropping it returns the noun
   * to the plain-text tier it had before it declared anything (NFP #4).
   *
   * Omitting the callback entirely is different, and deliberately so — it means
   * *no resolution was attempted*, so every ref passes through exactly as
   * authored. That is what keeps a caller which never had sentinels (and every
   * existing test) rendering unchanged (NFP #6).
   */
  resolveAnchor?: (entityId: string) => string | undefined;
}

/**
 * A concept ref with its declared anchor resolved against the live world.
 *
 * Returns the ref unchanged when it declares no anchor or no resolver was given,
 * and strips `entityId` when the declaration resolves to nothing — never leaves
 * a sentinel in place, which is the one outcome that renders as a dead link.
 */
function resolveRefAnchor<T extends EncounterAftermathConceptRef>(
  ref: T | undefined,
  resolveAnchor: ((entityId: string) => string | undefined) | undefined,
): T | undefined {
  if (!ref?.entityId || !resolveAnchor) return ref;
  const resolved = resolveAnchor(ref.entityId);
  if (resolved === ref.entityId) return ref;
  if (resolved) return { ...ref, entityId: resolved };
  const { entityId: _dropped, ...rest } = ref;
  return rest as T;
}

/**
 * THR-1004 — decorate an already-linked sentence with the concepts its producer
 * declared, so every game concept on a chip carries its tooltip and its link.
 *
 * Runs *after* `link()` rather than instead of it: the narrative linker owns
 * cast and target names (which it finds by scanning), and the concept list owns
 * the derived vocabulary (reaches, standing, factions, rewards) that no scan
 * could find. A segment the linker already claimed is left alone — its entity
 * link is the richer one, and re-splitting it would drop that link.
 *
 * Matching is a plain first-occurrence substring search, not a regex: concept
 * text comes from the engine (a reach name, a faction name, an item name), so
 * it is literal by construction and a regex would only add escaping bugs.
 */
export function applyConceptDecorations(
  paragraph: EncounterStageNarrativeParagraph,
  concepts: readonly EncounterAftermathConceptRef[] | undefined,
): EncounterStageNarrativeParagraph {
  if (!concepts || concepts.length === 0) return paragraph;

  let segments: EncounterStageNarrativeSegment[] = [...paragraph.segments];

  for (const concept of concepts) {
    if (!concept.text) continue;
    // Nothing to draw — a concept with neither a tooltip nor a page would only
    // split a segment for no visible gain.
    if (!concept.tooltipId && !concept.entityId) continue;

    const next: EncounterStageNarrativeSegment[] = [];
    let placed = false;

    for (const segment of segments) {
      // Already decorated by the linker (or by an earlier concept) — leave it.
      if (placed || segment.referenceId || segment.entityId || segment.tooltipId) {
        next.push(segment);
        continue;
      }
      const at = segment.text.indexOf(concept.text);
      if (at < 0) {
        next.push(segment);
        continue;
      }
      const before = segment.text.slice(0, at);
      const after = segment.text.slice(at + concept.text.length);
      if (before) next.push({ ...segment, text: before });
      next.push({
        text: concept.text,
        emphasis: 'accent',
        tooltipId: attachmentTooltipIdFor(concept),
        entityId: concept.entityId,
        // Routes the click to the right sheet. Omitted when the concept names
        // no visual kind, which leaves the segment on the agent path — the
        // meaning an absent `entityKind` has always had.
        entityKind: concept.visualKind,
      });
      if (after) next.push({ ...segment, text: after });
      placed = true;
    }

    segments = next;
  }

  return { id: paragraph.id, segments };
}

/**
 * Rank two chips for the ending's reading order (THR-1136 §4).
 *
 * **Category first**, in `CONSEQUENCE_CATEGORY_ORDER` — the legend's own story
 * order, so the ending reads what it cost, who it changed, what was earned,
 * what it opened, rather than whatever order the change set happened to be
 * assembled in.
 *
 * **Magnitude second**, descending on the drawn cluster's `count`. That is the
 * magnitude the *player can see*, not the underlying band — sorting on a
 * quantity the surface never renders would produce an order nobody could read
 * back. A chip with no delta sorts last within its category: it has no size to
 * compare, and putting sizeless changes above sized ones would break the run of
 * the eye down the cluster column.
 *
 * **Emission order last**, as a stable tiebreak, so the result is fully
 * determined by the input (NFP #3) — `Array.prototype.sort` is only guaranteed
 * stable in ES2019+, and relying on that instead of an explicit index would
 * make the order an engine detail rather than a decision.
 *
 * Note this deliberately supersedes the old "seeds last" rule, which is now a
 * consequence rather than a special case: seeds are `path`, and `path` is last
 * in the category order.
 */
function compareChips(
  a: { chip: EncounterStageConsequenceChipModel; index: number },
  b: { chip: EncounterStageConsequenceChipModel; index: number },
): number {
  const categoryDelta =
    CONSEQUENCE_CATEGORY_ORDER.indexOf(a.chip.category)
    - CONSEQUENCE_CATEGORY_ORDER.indexOf(b.chip.category);
  if (categoryDelta !== 0) return categoryDelta;

  // Absent delta sorts after any present one; two absent deltas tie and fall
  // through to emission order.
  const aCount = a.chip.delta?.count;
  const bCount = b.chip.delta?.count;
  if (aCount !== bCount) {
    if (aCount === undefined) return 1;
    if (bCount === undefined) return -1;
    return bCount - aCount;
  }

  return a.index - b.index;
}

/**
 * Build the ending's consequence chips.
 *
 * Order is stable and meaningful: chips are grouped by story category
 * (scar → bond → boon → path) and sized within each group, magnitude
 * descending — see `compareChips`. Emission order survives only as the final
 * tiebreak, so the same change set always produces the same reading.
 */
export function buildAftermathConsequences(
  args: BuildAftermathConsequencesArgs,
): EncounterStageConsequenceChipModel[] {
  const { changes, reactions, enrich, link, resolveIcon, resolveAnchor } = args;
  const chips: EncounterStageConsequenceChipModel[] = [];

  for (const change of changes) {
    const kind = classifyChangeKind(change.kind, change.polarity);
    // THR-1082 — the producer's declared category wins; absent, it is derived
    // from the wire kind exactly as the display always did. That is what lets
    // every pre-existing authored change render unmodified (NFP #6).
    const category = change.category ?? categoryForKind(kind, change.polarity);
    const id = `consequence-${change.id}`;
    // THR-1004 — the UI Law. Concepts the producer declared get their tooltip
    // and their link in the sentence; the first that names an entity with art
    // becomes the chip's tile.
    //
    // THR-1082 — the cause clause leads when an author wrote one, because the
    // consequence must never appear divorced from what caused it. One sentence,
    // cause first: "Caught at the rail by a passing wanderer — Jorun walks with
    // her now."
    const causeClause = change.causeClause?.trim();
    const body = causeClause ? `${causeClause} — ${change.detail}` : change.detail;
    // THR-1164 — resolve declared anchors once, here, and use the resolved refs
    // for every tier below. Resolving per-consumer instead would let the tile and
    // the link disagree about what the chip points at.
    const stateNoun = resolveRefAnchor(change.stateNoun, resolveAnchor);
    const concepts = change.concepts?.map(c => resolveRefAnchor(c, resolveAnchor)!);
    const sentence = applyConceptDecorations(link(id, enrich(body)), concepts);
    // The state noun is the changed state itself and takes precedence for the
    // tile; `concepts` merely decorates the sentence, so it is the fallback.
    const iconConcept = (stateNoun?.visualKind ? stateNoun : undefined)
      ?? concepts?.find(c => c.visualKind);
    // THR-1205 — the noun is enriched like the sentence is, so it can name
    // *where* the state changed and not only *what* did.
    //
    // The director's second reading of the same chip: a BOND that says only
    // "A STANDING WELCOME" states a mechanic with no referent, and the place it
    // was granted at — the thing that makes the grant worth anything — was
    // reachable only by reading the flavour sentence underneath. *"the effect
    // … must be easily visible here. so e.g. improved reputation in sacred
    // grove (green arrow up)"*. An author can now write `a standing welcome at
    // {target}` and have the tag and the cluster label both say the place, the
    // way `detail` already could.
    //
    // Enriches only the *display* text: `iconConcept` still reads the raw ref,
    // so the tile and the link resolve off the declared anchor exactly as they
    // did (they route by `entityId`, never by this string). Identity for text
    // with no placeholders, so every existing noun is untouched (NFP #6).
    const nounText = stateNoun?.text ? enrich(stateNoun.text) : undefined;
    chips.push({
      id,
      kind,
      kindLabel: CONSEQUENCE_KIND_LABELS[kind],
      category,
      categoryLabel: CONSEQUENCE_CATEGORY_LABELS[category],
      categoryTooltipId: CONSEQUENCE_CATEGORY_TOOLTIP_IDS[category],
      nounLabel: nounLabelFor(nounText),
      // THR-1122 — the noun is a concept word and owes its hover tier. Derived
      // from the same declaration that already drives the tile, so no authored
      // change has to repeat itself.
      nounTooltipId: stateNoun ? attachmentTooltipIdFor(stateNoun) : undefined,
      // THR-1153 — Law 56's second clause: the noun *is* the referent, so it owes
      // the click tier and not only the hover tier THR-1122 gave it. Passed
      // through verbatim; the surface decides whether it can open the kind, which
      // is what keeps a kind this host cannot route (a `companion`) plain rather
      // than a link to the wrong sheet.
      nounEntityId: stateNoun?.entityId,
      nounEntityKind: stateNoun?.visualKind,
      categoryGlyph: CONSEQUENCE_CATEGORY_GLYPHS[category],
      reachDomain: reachDomainFor(stateNoun),
      sentence,
      sentenceText: paragraphText(sentence),
      // Incidental drift renders as tag + cluster with no sentence. An author
      // who wrote a cause clause meant it to be read, so it always overrides.
      compact: change.storyWeight === 'incidental' && !causeClause,
      delta: deltaClusterFor(change, nounText),
      tone: toneFor(kind, change),
      icon: iconConcept && resolveIcon ? resolveIcon(iconConcept) : undefined,
    });
  }

  // Seeds the encounter actually plants, read from the effects rather than
  // re-authored — so a planted sequel cannot silently go unmentioned.
  const seenSeedLabels = new Set<string>();
  for (const reaction of reactions ?? []) {
    for (const effect of reaction.effects ?? []) {
      if (effect.kind !== 'encounter_seed') continue;
      const label = effect.seedLabel?.trim();
      // A seed with no label has nothing to say to the player; skip rather than
      // render an empty chip.
      if (!label || seenSeedLabels.has(label)) continue;
      seenSeedLabels.add(label);
      const id = `consequence-seed-${reaction.id}-${seenSeedLabels.size}`;
      const sentence = link(id, enrich(label));
      chips.push({
        id,
        kind: 'seed',
        kindLabel: CONSEQUENCE_KIND_LABELS.seed,
        category: 'path',
        categoryLabel: CONSEQUENCE_CATEGORY_LABELS.path,
        categoryTooltipId: CONSEQUENCE_CATEGORY_TOOLTIP_IDS.path,
        categoryGlyph: CONSEQUENCE_CATEGORY_GLYPHS.path,
        sentence,
        sentenceText: paragraphText(sentence),
        // A planted sequel is authored prose — it is the one thing on the
        // surface that is purely story, so it always keeps its sentence.
        compact: false,
        delta: { direction: 'opens', count: 1, label: 'A way opens' },
        tone: 'seed',
      });
    }
  }

  return chips
    .map((chip, index) => ({ chip, index }))
    .sort(compareChips)
    .map((entry) => entry.chip);
}
