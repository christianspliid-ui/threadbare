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
   */
  entityKind?: 'agent' | 'faction' | 'artifact';
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
  /** Intervention type — supportive, coercive, or withdrawn. Drives choice glow color. */
  interventionType?: 'supportive' | 'coercive' | 'withdrawn';
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

export interface EncounterStageConsequenceChipModel {
  id: string;
  kind: EncounterStageConsequenceKind;
  /** Short kind tag drawn on the chip (PRIZE / TOLL / STANDING / WOUND / SEED). */
  kindLabel: string;
  /**
   * One sentence, pre-segmented so any named entity in it links to its page.
   * A sentence naming nothing linkable is a single plain segment — fail-open,
   * never a dead link.
   *
   * Always authored prose. The chip surface never prints a magnitude: a toll is
   * stated in words, per the nudge-model surface rules.
   */
  sentence: EncounterStageNarrativeParagraph;
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
  kind: 'agent' | 'faction' | 'artifact';
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
   * THR-775 — present only when the current step carries an authored nudge
   * hand. The stage branches on its presence: absent ⇒ the legacy
   * `authoredChoices` screen renders exactly as before.
   */
  nudgePhase?: EncounterStageNudgePhaseModel;
}
