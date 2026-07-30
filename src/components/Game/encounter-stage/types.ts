import type { CourtPosition } from '../../../types/influence';
import type { ReachDomain } from '../../../types/traits';
import type { StepOutcome } from '../../../types/unifiedAction';
import type { SphereName } from '../../../types/index';
import type { ResolutionInput } from '../../../types/resolution';
import type { ForecastTier } from '../../../types/traces/encounter-traces';
import type { NudgeBlockedCode } from '../../../engine/encounters/nudges';
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

export interface EncounterStageAftermathModel {
  title: string;
  overview: string;
  actorMoments?: EncounterStageAftermathActorModel[];
  highlights?: EncounterStageAftermathHighlightModel[];
  changes?: EncounterStageAftermathChangeModel[];
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

export interface EncounterStageNudgeCardModel {
  id: string;
  name: string;
  /** Card body — a concrete, witnessed effect. */
  fiction: string;
  /** Player guidance, words only — never a number. */
  effectLine: string;
  essenceCost: number;
  /** Cost rendered in words; absent on a free (trait) option. */
  costLabel?: string;
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
}

export interface EncounterStageTestPanelModel {
  reach: ReachDomain;
  reachLabel: string;
  /** Icon for the reach at the acting agent's tier. */
  reachIconUrl?: string;
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
