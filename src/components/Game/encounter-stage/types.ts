import type { CourtPosition } from '../../../types/influence';
import type { ReachDomain } from '../../../types/traits';
import type { StepOutcome } from '../../../types/unifiedAction';

export type ThreadTier = 'strong' | 'light' | 'watched';

/** Map engine CourtPosition to UI thread tier */
export function courtPositionToThreadTier(pos: CourtPosition | null): ThreadTier {
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
}
