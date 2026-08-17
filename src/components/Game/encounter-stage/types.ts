import type { CourtPosition } from '../../../types/influence';
import type { ReachDomain } from '../../../types/traits';
import type { StepOutcome } from '../../../types/unifiedAction';
import type { SphereName } from '../../../types/index';
import type { ResolutionInput } from '../../../types/resolution';
import type { ForecastTier } from '../../../types/traces/encounter-traces';
import type { NudgeBlockedCode } from '../../../engine/encounters/nudges';
import type { NudgeCostChannelId } from '../../../data/nudge-card-display';
import type { MotiveSource } from '../../../engine/encounters/motiveClassifier';
import { isForceFullEncounterVisibility } from '../../../engine/debugVisibilityOverride';

export type ThreadTier = 'strong' | 'light' | 'watched';

/**
 * Map engine CourtPosition to UI thread tier.
 *
 * THR-880: while the force-full-visibility debug override is active, a
 * Watched agent's encounter renders through the same 'strong' path as The
 * First — otherwise the veil would still show the stripped-down Watched
 * screen even after the notification/choices override gave it full prose.
 */
export function courtPositionToThreadTier(pos: CourtPosition | null): ThreadTier {
  if (isForceFullEncounterVisibility() && pos && pos !== 'dormant') return 'strong';
  switch (pos) {
    case 'the_first': return 'strong';
    case 'retinue': return 'light';
    case 'watched': return 'watched';
    default: return 'watched';
  }
}

export type EncounterCastRole =
  | 'authority'
  | 'subject'
  | 'witness'
  | 'support'
  | 'location';

export type EncounterSignalVisibility = 'known' | 'hidden' | 'revealed';

export interface EncounterStageHeaderModel {
  title: string;
  subtitle?: string;
  locationLabel: string;
  urgencyLabel?: string;
  threatLabel: string;
  threadTier: ThreadTier;
  familyLabel?: string;
  // ─── Context strip (THR-636) — additive, all optional ───
  /** Focal agent name, promoted from a ghost subtitle to a primary element. */
  agentName?: string;
  /** Focal agent id — makes the character chip clickable to their detail surface. */
  focalActorId?: string;
  /** Portrait for the focal agent (null = gradient silhouette fallback). */
  portraitUrl?: string | null;
  /** Encounter hex — enables the "Show on map" camera-focus link; absent → link hidden. */
  hexCol?: number;
  hexRow?: number;
  /** Current step's reach, shown as a plain keyword chip. */
  reachLabel?: string;
}

export interface EncounterStageIllustrationModel {
  src: string;
  alt: string;
  caption?: string;
}

export interface EncounterStageSceneModel {
  situationProse: string;
  pressureProse: string;
  noticeLines: string[];
  stakesProse?: string;
  momentLine?: string;
}

export interface EncounterStageCastModel {
  id: string;
  name: string;
  role: EncounterCastRole;
  roleLabel?: string;
  description?: string;
  reused?: boolean;
  /**
   * THR-1041 — the graph node the support binding resolved to. Absent when the
   * bundle spec never bound (the world had nobody to reuse and nothing spawned),
   * in which case the chip renders as an unlinked name: the actor is still in
   * the prose, so hiding it would be worse than showing it inert.
   */
  nodeId?: string;
  /**
   * THR-1041 — portrait resolved by `resolveEntityVisual` **through the viewer's
   * knowledge gate** (Law 8). A stranger's face is withheld the same way it is
   * on every other surface; the chip falls back to the authored tile, never a
   * blank. Absent ⇒ no art tier resolved, which `EntityVisual` already handles.
   */
  portraitUrl?: string;
}

export interface EncounterStageFactionModel {
  id: string;
  label: string;
  pressure?: string;
}

export interface EncounterStageShellStateModel {
  shellType: string;
  state: string;
  stateLabel: string;
  stateHint?: string;
}

export interface EncounterStageSignalModel {
  id: string;
  label: string;
  visibility: EncounterSignalVisibility;
  observation: string;
  visibilityLabel?: string;
}

export interface EncounterStageNarrativeReference {
  id: string;
  label: string;
  detail: string;
  tone?: 'default' | 'accent' | 'warning';
}

export interface EncounterStageNarrativeSegment {
  text: string;
  referenceId?: string;
  emphasis?: 'default' | 'strong' | 'accent';
  /**
   * THR-971 — graph node id behind this segment's text, when one is known.
   * Present only on a linked segment whose entity resolved to a real node;
   * a renderer without it emphasises the name but does not make it clickable.
   */
  entityId?: string;
  /**
   * THR-1004 — tooltip concept id for this segment (`reach.star`, `ui.standing`).
   * The UI Law says a game concept carries its explanation where it is named;
   * a renderer without it draws plain text, never a dead affordance.
   */
  tooltipId?: string;
  /**
   * THR-1004 — what kind of thing `entityId` names, so the surface routes the
   * click to the right sheet. **Absent means "a person" for backward
   * compatibility**: every pre-THR-1004 `entityId` came from the narrative
   * linker's cast scan and was opened through the agent handler, so an absent
   * kind must keep meaning exactly that.
   *
   * THR-1120 — `attachment` names a granted condition/blessing/curse/power by
   * its **template** node id. See `EncounterAftermathConceptRef.visualKind` for
   * why a template rather than the granted instance.
   */
  entityKind?: 'agent' | 'faction' | 'artifact' | 'companion' | 'attachment';
}

export interface EncounterStageNarrativeParagraph {
  id: string;
  segments: EncounterStageNarrativeSegment[];
}

export interface EncounterStageChoiceModel {
  id: string;
  label: string;
  intent: string;
  targetLabel?: string;
  essenceCost: number;
  affordable: boolean;
  costLabel?: string;
  likelyBurden?: string;
  /**
   * Intervention type — supportive, coercive, or withdrawn. Drives choice glow
   * color **only**. THR-1048: never render this; it is an engine enum, and Law
   * 14 forbids it reaching the DOM. Read {@link stanceLabel} for the words.
   */
  interventionType?: 'supportive' | 'coercive' | 'withdrawn';
  /**
   * THR-1048 — what the god does, in words, for {@link interventionType}.
   *
   * Banded at the source by `engine/interventionStanceWords`, the way
   * `roleLabel` bands a cast member's `supportRole`, so a surface never has to
   * remember to resolve the enum. Absent means the producer tagged no stance
   * (authored choice cards carry their own prose instead) and the meta row
   * renders nothing — a designed empty, not a missing value.
   */
  stanceLabel?: string;
  /** God-voice quote revealed when choice is selected. */
  godVoice?: string;
  /** Probability boost (0.0–1.0) shown in choice meta. */
  probabilityBoost?: number;
}

export interface EncounterStageResolutionCheckModel {
  id: string;
  stepId: string;
  stepLabel: string;
  state: 'pending' | 'resolved';
  reach: ReachDomain;
  reachLabel: string;
  difficulty: number;
  difficultyLabel: string;
  capability: number;
  modifierTotal: number;
  probability: number;
  threshold: number;
  forecastLabel?: string;
  roll?: number;
  margin?: number;
  outcomeLabel?: string;
  nearMiss?: boolean;
  critLabel?: string;
}

export interface EncounterStageResolutionReadoutModel {
  heading: string;
  current?: EncounterStageResolutionCheckModel;
  previous: EncounterStageResolutionCheckModel[];
}

export interface EncounterStageHistoryModel {
  stepId: string;
  stepLabel: string;
  status: 'resolved' | 'current' | 'future';
  afterimage?: string;
  /** Complication prose and metadata for failure-tier steps (THR-20) */
  complication?: {
    prose: string;
    name: string;
    severity: 'minor' | 'standard' | 'severe';
    category: string;
  };
  // ─── Step-navigator replay (THR-636) — additive, resolved steps only ───
  /** Resolved-step outcome — drives the step-dot colour and replay verdict. */
  outcome?: StepOutcome;
  /** Plain band word for the outcome (e.g. "held", "broke"). */
  outcomeWord?: string;
  /** Reach tested on this step, plain keyword. */
  reachLabel?: string;
  /** Enriched narrative the player saw at this step's resolution (frozen replay record). */
  replayNarrative?: string;
  /** The god-action the player took on this step, if any. */
  choiceText?: string;
}

export interface EncounterStageFalloutModel {
  kind: 'reputation' | 'faction' | 'suspicion' | 'burden' | 'future_hook';
  label: string;
}

export interface EncounterStageAftermathChangeModel {
  id: string;
  kind: 'growth' | 'trait' | 'item' | 'reputation' | 'faction_reputation' | 'reputation_tally' | 'shell_state' | 'future_hook';
  title: string;
  detail: string;
  polarity: 'gain' | 'loss' | 'mixed' | 'info';
}

export interface EncounterStageAftermathMarkModel {
  id: string;
  label: string;
  iconGlyph?: string;
  tooltipLabel?: string;
  tooltipDesc?: string;
  tone?: 'gain' | 'loss' | 'warning' | 'info';
}

export interface EncounterStageAftermathActorModel {
  id: string;
  actorName: string;
  portraitUrl?: string | null;
  summaryLines: string[];
  marks?: EncounterStageAftermathMarkModel[];
}

export interface EncounterStageAftermathHighlightModel {
  id: string;
  title: string;
  detail: string;
  tone?: 'gain' | 'loss' | 'mixed' | 'info';
}

export interface EncounterStageAftermathReactionModel {
  id: string;
  label: string;
  intent?: string;
  disabled?: boolean;
  /**
   * THR-1084 — the label pre-segmented so any named entity in it links to its
   * page, exactly as the consequence chips beside it already do. Additive on
   * purpose (NFP #6): `label` stays the plain string, so the Gate Duty adapter
   * and the debug-bridge reaction listing keep working untouched, and a
   * renderer without segments draws the string as before.
   *
   * Absent ⇒ render `label`. A sentence naming nothing linkable still arrives
   * as a single plain segment — fail-open, never a dead link.
   */
  labelSegments?: EncounterStageNarrativeParagraph;
  /** As `labelSegments`, for `intent`. Absent ⇒ render `intent`. */
  intentSegments?: EncounterStageNarrativeParagraph;
}

/**
 * The consequence taxonomy the ending renders in (THR-971) — what you got, what
 * it cost, what it planted.
 *
 * These are **presentation** classes, not a new engine vocabulary: every kind
 * maps from an `EncounterAftermathChange.kind` that already exists, or from an
 * `encounter_seed` effect the encounter already declares. Authors never write a
 * consequence twice — see `buildAftermathConsequences.ts` for the mapping table
 * and why `toll` does not read the source the ticket originally named.
 *
 * `mark` is the fail-soft bucket: an unrecognised change kind lands here rather
 * than being dropped, because a consequence the screen does not admit is the
 * defect this taxonomy exists to kill.
 */
export type EncounterStageConsequenceKind =
  | 'prize'
  | 'standing'
  | 'toll'
  | 'wound'
  | 'seed'
  | 'mark';

export type EncounterStageConsequenceTone = 'gain' | 'loss' | 'seed' | 'info';

/**
 * THR-1082 — the four story-first categories the player actually reads.
 *
 * This is the *display* truth; `EncounterStageConsequenceKind` above stays the
 * wire truth and keeps its six members. Both survive on the model on purpose:
 * renaming the wire kinds would mean a big-bang sweep of every test fixture in
 * the aftermath suite for no gain, since the surface reads `category` and
 * nothing reads `mark` any more.
 *
 * Mirrors `EncounterAftermathCategory` (`types/unifiedAction.ts`), which is what
 * a producer declares. The adapter derives one when a producer declared none.
 */
export type EncounterStageConsequenceCategory = 'scar' | 'bond' | 'boon' | 'path';

/**
 * THR-1082 — the magnitude idiom: a small run of triangles, right-aligned.
 *
 * Replaces the adverb ("grew steadily") as the *headline* reading of how much
 * changed. The adverb is not deleted — it moves into `sentenceText`, which
 * becomes the chip's tooltip and aria text, so the word ladder still explains
 * itself on hover while the glance-level answer is visual.
 */
export interface EncounterStageConsequenceDeltaModel {
  /** `gain`/`loss` draw triangles; `opens` draws the scale-less PATH marker. */
  direction: 'gain' | 'loss' | 'opens';
  /** Triangles drawn — 1..`DELTA_CLUSTER_MAX`. Never 0: a change that happened draws at least one. */
  count: number;
  /**
   * The whole reading in words, for `aria-label` and the hover tier — "Stone
   * grew, a clear amount". Law 11: shape is the accessibility channel, colour
   * the secondary one, and every glyph row states its reading in words.
   */
  label: string;
}

export interface EncounterStageConsequenceChipModel {
  id: string;
  kind: EncounterStageConsequenceKind;
  /** Short kind tag drawn on the chip (PRIZE / TOLL / STANDING / WOUND / SEED). */
  kindLabel: string;
  /** THR-1082 — the story-first category the chip renders under. */
  category: EncounterStageConsequenceCategory;
  /** The category word drawn on the tag (SCAR / BOND / BOON / PATH). */
  categoryLabel: string;
  /**
   * THR-1136 — the registry id that explains `categoryLabel`.
   *
   * The four category words were explained only by the first-contact legend,
   * whose dismissal persists across sessions (Law 51) — so after "got it" there
   * was no way left to ask what BOON meant, on any ending, ever. Law 17's hover
   * tier is the standing answer; the legend teaches once, the tooltip explains
   * forever, and both read the same registry entry so there is no second copy
   * of the words.
   */
  categoryTooltipId: string;
  /**
   * THR-1082 — the changed state, named. `SCAR · TWISTED ANKLE`. Absent when no
   * producer declared a state noun, in which case the tag shows the category
   * alone — the designed fallback, never a blank and never "something".
   */
  nounLabel?: string;
  /**
   * THR-1122 — the registry id that explains `nounLabel`, when one exists.
   *
   * The noun is the chip's most concentrated concept word — `SCAR · WOUNDED`
   * names a condition and nothing else — and until this field it carried
   * neither its tooltip nor its link, because the sentence-decoration path only
   * ever reached words inside the prose. Law 17 holds on the surface as
   * composed, not on the prose alone.
   *
   * Carries whatever the producer declared (`ui.standing`) or, for a concept
   * naming an attachment template, the derived `attachment.*` id. The surface
   * still gates on `tooltipResolves` before drawing anything, so an id the
   * registry cannot answer stays plain text rather than becoming a dead
   * underline (Law 21).
   */
  nounTooltipId?: string;
  /**
   * THR-1153 — the graph object the noun *is*, so the noun can be reached and not
   * merely explained.
   *
   * Law 56's second clause requires a chip's referent to be an existing graph
   * object and the prose to name that object. THR-1122 gave the noun its hover
   * tier and stopped there, so a chip could declare `entityId` on its
   * `stateNoun` — twelve in the corpus do — and the noun still rendered as text
   * that goes nowhere, while a *decorated word inside the same sentence* clicked
   * through. The chip's most concentrated referent was its least reachable one.
   *
   * Carries the declaration verbatim: `entityId` is the node id the producer
   * named (an attachment's **template** node id for `attachment`, per THR-1120)
   * and `nounEntityKind` is its `visualKind`. Both optional and additive — a
   * chip that declares no anchor renders exactly as before (NFP #6) — and the
   * surface still routes through `openEntity`, so a kind this host cannot open
   * stays emphasised text rather than becoming a link to the wrong sheet
   * (Law 21).
   */
  nounEntityId?: string;
  /**
   * THR-1153 — kind of {@link nounEntityId}, routed by `openEntity`.
   *
   * Spelled as the same inline union the segment's `entityKind` uses rather than
   * imported from `NarrativeSegments`: this module is types-only and stays free
   * of component imports.
   */
  nounEntityKind?: 'agent' | 'faction' | 'artifact' | 'companion' | 'attachment';
  /** Icon-tile fallback glyph when neither an entity nor a reach resolves. */
  categoryGlyph: string;
  /**
   * THR-1082 — the reach whose glyph tiles this chip, when the changed state is
   * a reach. Drawn with `ReachIcon`, the encounter surface's own reach
   * vocabulary (Law 9: one icon vocabulary per element class).
   */
  reachDomain?: string;
  /**
   * One sentence, pre-segmented so any named entity in it links to its page.
   * A sentence naming nothing linkable is a single plain segment — fail-open,
   * never a dead link.
   *
   * The chip surface never prints a magnitude: a toll is stated in words, per
   * the nudge-model surface rules.
   */
  sentence: EncounterStageNarrativeParagraph;
  /**
   * THR-1082 — plain text of `sentence`, for the compact chip's hover tier and
   * aria text. The sentence is never destroyed, only demoted.
   */
  sentenceText: string;
  /**
   * THR-1082 — true when this change is incidental drift the engine noticed
   * rather than a beat the encounter meant. Compact chips draw the tag and the
   * cluster and *no sentence*, because "Vara's Stone grew steadily" on every
   * ending is what pushed the actual story off the screen (Christian, 2026-08-10).
   */
  compact: boolean;
  delta?: EncounterStageConsequenceDeltaModel;
  tone: EncounterStageConsequenceTone;
  /**
   * THR-1004 — the chip's entity image, per the UI Law. Present when the chip
   * names an entity the visual resolver could resolve (an item, a faction, an
   * agent); absent chips draw their kind tag alone, exactly as before.
   */
  icon?: EncounterStageConsequenceIconModel;
}

/**
 * THR-1004 — the entity a consequence chip names, in the shape `EntityVisual`
 * takes as its `entity` prop. Built by the adapter (which has the graph) so the
 * veil stays graph-free, the way it already resolves its illustration.
 */
export interface EncounterStageConsequenceIconModel {
  /** Stable id — graph lookup key when the entity is a node, gradient seed always. */
  entityId: string;
  kind: 'agent' | 'faction' | 'artifact' | 'companion';
  name: string;
  /** Art the adapter resolved, when any exists. Absent ⇒ the designed fallback tile. */
  src?: string;
}

export interface EncounterStageAftermathModel {
  title: string;
  overview: string;
  actorMoments?: EncounterStageAftermathActorModel[];
  highlights?: EncounterStageAftermathHighlightModel[];
  changes?: EncounterStageAftermathChangeModel[];
  /**
   * THR-971 — the mockup's chip taxonomy. When present the stage renders these
   * *instead of* `highlights` + `changes`: all three are built from the same
   * authored change set, so drawing them together would say everything twice.
   */
  consequences?: EncounterStageConsequenceChipModel[];
  reactionPrompt?: string;
  reactions?: EncounterStageAftermathReactionModel[];
}

// ─── Nudge phase (THR-775 / WS2) ──────────────────────────────────
//
// The nudge stage is opt-in per template: `nudgePhase` is present only when the
// action's current step carries an authored `nudges` hand. Templates with
// `authoredChoices` and no hand keep `choices` and the legacy screen, so the
// rollout is per-template and reversible (no flag day).

/**
 * How a nudge card renders, per the WS2 per-`NudgeBlockedCode` policy.
 *
 * - `playable` — affordable and unlocked; toggling it moves the forecast.
 * - `dimmed` — visible with its reason. **Only** `essence_unavailable` lands
 *   here: the player's budget changes inside one encounter as they toggle
 *   spends, so hiding unaffordable cards would make them flicker in and out.
 *
 * `sphere_locked` / `unlock_missing` are withheld from the player stage
 * entirely (ruling 4 — the replayability pool) and surface only in the
 * designer view. `trait_missing` is never rendered anywhere in the stage.
 */
export type NudgeCardState = 'playable' | 'dimmed';

/**
 * A non-essence price this card charges (THR-885 cost channels), already read
 * into display form by the adapter (THR-890). The magnitude renders as penalty
 * pips; the label states the price in words.
 */
export interface EncounterStageCostChannelModel {
  id: NudgeCostChannelId;
  icon: string;
  /** Plain-language price — never a numeral. */
  label: string;
  /**
   * Raw signed delta, for the penalty-pip row. Negative deltas are *relief*
   * (a card that calms the doom clock), which is why the label carries the
   * direction rather than the sign alone.
   */
  delta: number;
}

export interface EncounterStageNudgeCardModel {
  id: string;
  /**
   * Library card this option instances (THR-887). Carried so the commit path can
   * tally it for the twilight echo card, and — since THR-890 — so the card row
   * can print the family's keyword. Absent on a one-off authored option, which
   * renders chipless rather than inventing a type.
   */
  libraryCardId?: string;
  /**
   * Player-facing library keyword ("Boost", "Gambit"), derived from
   * {@link libraryCardId}. Absent ⇒ no chip.
   */
  keyword?: string;
  /** Single glyph drawn on the keyword chip. Present whenever `keyword` is. */
  keywordIcon?: string;
  name: string;
  /** Card body — a concrete, witnessed effect. */
  fiction: string;
  /** Player guidance, words only — never a number. */
  effectLine: string;
  /**
   * **Effective** essence price — after any sphere discount (THR-885).
   *
   * This is deliberately the discounted number rather than the authored one:
   * `buildNudgeHand` prices affordability off it and `totalNudgeCost` charges it,
   * so quoting the authored cost here would show a card dear and bill it cheap.
   */
  essenceCost: number;
  /** True when a sphere alignment brought {@link essenceCost} below the authored price. */
  discounted?: boolean;
  /** Cost rendered in words; absent on a free (trait) option. */
  costLabel?: string;
  /** Prices charged outside the essence pool. Empty ⇒ essence is the whole price. */
  costChannels?: EncounterStageCostChannelModel[];
  sphere?: SphereName;
  /** WS4 image-library tag. Absent ⇒ the fallback chain ends at EntityVisual. */
  imageTag?: string;
  state: NudgeCardState;
  /** Present only on a dimmed card. */
  blockedCode?: NudgeBlockedCode;
  /** Plain-language reason shown on a dimmed card. */
  blockedReason?: string;
  /** Rider name, when this card carries one — designer view only. */
  riderLabel?: string;
  /** Named forecast contribution. Designer view only; never rendered as a numeral. */
  forecastDelta: number;
}

/** A card the player stage withholds — designer view only. */
export interface EncounterStageWithheldNudgeModel {
  id: string;
  name: string;
  blockedCode: NudgeBlockedCode;
}

export interface EncounterStageMotiveModel {
  source: MotiveSource;
  /** Display chip — BY CHOICE / A MISSION / CHANCE / THE GOD'S HAND. */
  chipLabel: string;
  /** One authored sentence naming why this mortal is here. */
  sentence: string;
  /**
   * THR-972 — the motive as a line that *introduces* the scene, printed above the
   * opening prose rather than below it.
   *
   * Already substituted: `{actor}` and `{mission}` are resolved by the adapter, so
   * the shell renders this verbatim and a raw placeholder can never reach the
   * stage. Variant choice is a stable hash of the action id and step index
   * (`MOTIVE_INTRO_VARIANTS`), so re-opening an encounter never re-rolls its
   * opening line.
   *
   * Optional because a caller may build a motive without one — the meeting beats
   * carry no motive at all, and an absent intro renders nothing rather than a
   * blank line. {@link sentence} is retained alongside it for the motive
   * explainer modal, which still quotes the un-substituted fallback.
   */
  introLine?: string;
}

/**
 * Which way a factor line cuts.
 *
 * `neutral` is not a hedge — it is the honest reading of a line drawn from the
 * contract's `beat.forecast_factors`, a bare string tuple with no declared
 * sign, so claiming a polarity there would invent information the encounter
 * never stated. Two sources *do* carry a sign and never render neutral:
 * `ActionStep.factorLines`, where the author declares it (THR-820), and live
 * modifier-derived lines (`trait:*`, `nudge:*`), whose delta has one.
 */
export type FactorPolarity = 'for' | 'against' | 'neutral';

export interface EncounterStageFactorLineModel {
  id: string;
  text: string;
  polarity: FactorPolarity;
  /** Named modifier source (`trait:*` / `nudge:*`) when the line is live-derived. */
  source?: string;
  /**
   * THR-892 — the line's raw 0–1 forecast contribution, signed, for the pip row.
   *
   * Absent on any line with no measurable contribution: an authored static line,
   * a contract `forecast_factors` string, or a carryover line the author declared
   * without a delta. Absent means "draw no pips", never "draw zero pips" — a row
   * of empty slots would promise a magnitude the line does not have.
   */
  delta?: number;
}

export interface EncounterStageTestPanelModel {
  reach: ReachDomain;
  /**
   * Reach name, title-cased.
   *
   * THR-972 moved the panel's reach chip to the shared `ReachIcon` (the SVG icon
   * set), which draws the reach's own heraldic charge from {@link reach} alone —
   * so this label no longer renders as text beside it. It survives as the chip's
   * accessible name and title, which is what a glyph-only affordance owes.
   *
   * The tiered PNG (`/assets/reaches/iron-3.png`) this replaced carried a second
   * signal the SVG does not: the acting agent's *capability tier*. That is not
   * lost — the panel states it in words on its own derived factor line
   * ("Vara is skilled in iron"), which is where a capability claim belongs.
   */
  reachLabel: string;
  /**
   * ≤`REACH_PURPOSE_MAX_WORDS` (4) words, plain — what this step is testing.
   * Produced from `ActionStep.purposeLine` (THR-820). Absent on any step that
   * does not author one, which is every pre-nudge template.
   */
  purposeLine?: string;
  /** Difficulty as a word. The numeral never renders outside the designer view. */
  difficultyWord: string;
  /** Raw 0–1 difficulty — designer view only. */
  difficultyValue: number;
  factors: EncounterStageFactorLineModel[];
}

export interface EncounterStageForecastModel {
  tier: ForecastTier;
  /** The tier word — the only probability surface the player ever sees. */
  word: string;
  /** Raw probability — designer view only. */
  probability: number;
}

export interface EncounterStageNudgePhaseModel {
  actionId: string;
  templateId: string;
  stepIndex: number;
  motive?: EncounterStageMotiveModel;
  testPanel: EncounterStageTestPanelModel;
  /** Forecast with no nudges committed — the hand recomputes from here. */
  baseForecast: EncounterStageForecastModel;
  /**
   * Exact `forecastAction` inputs for the current step, with `actionModifiers`
   * holding everything *except* the nudge contribution. The hand adds the
   * selected deltas onto this and recomputes — the same pure engine call
   * resolution makes, so the word the player reads is the word they get.
   */
  forecastInput: ResolutionInput;
  /** Standing trait-variant contribution, already inside `forecastInput`. */
  traitModifierTotal: number;
  cards: EncounterStageNudgeCardModel[];
  /** Withheld by ruling 4 or trait gate — designer view only. */
  withheld: EncounterStageWithheldNudgeModel[];
  /** Ids already committed on this step (a re-opened stage restores them). */
  committedIds: string[];
  /** Essence the ascendant can spend right now. */
  availableEssence: number;
  /** Total essence the committed hand costs. */
  committedCost: number;
}

export interface EncounterStageModel {
  header: EncounterStageHeaderModel;
  illustration?: EncounterStageIllustrationModel;
  scene: EncounterStageSceneModel;
  narrative: {
    paragraphs: EncounterStageNarrativeParagraph[];
    references: EncounterStageNarrativeReference[];
  };
  cast: EncounterStageCastModel[];
  factions: EncounterStageFactionModel[];
  shellState?: EncounterStageShellStateModel;
  signals: EncounterStageSignalModel[];
  choices: EncounterStageChoiceModel[];
  falloutPreview: EncounterStageFalloutModel[];
  history: EncounterStageHistoryModel[];
  resourceSummary?: {
    quintessence?: number;
  };
  resolutionReadout?: EncounterStageResolutionReadoutModel;
  aftermath?: EncounterStageAftermathModel;
  /**
   * THR-775 — present when the current step carries an authored nudge hand.
   * The stage branches on its presence: absent ⇒ the `authoredChoices` screen
   * renders exactly as before.
   *
   * THR-1121 — **also present, with an empty `cards` array, when the step
   * authored neither a hand nor choices.** That is the fate-alone screen:
   * `Nothing here answers to you. Let it play out.` over the usual motive/test
   * framing, with `Let fate decide` as the only move. It exists because the
   * generic supportive/coercive/withdrawn stance triple that used to carry such
   * steps is retired, so `choices` is now empty for every unauthored step and
   * the absent branch would render a scene with nothing to do on it.
   *
   * So `nudgePhase` present no longer implies an authored hand — read `cards`
   * for that, not presence.
   */
  nudgePhase?: EncounterStageNudgePhaseModel;
}
