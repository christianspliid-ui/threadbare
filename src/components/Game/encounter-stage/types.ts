import type { ThreadTier } from '../TieredEncounterModal';

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
}

export interface EncounterStageHistoryModel {
  stepId: string;
  stepLabel: string;
  status: 'resolved' | 'current' | 'future';
  afterimage?: string;
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
  aftermath?: EncounterStageAftermathModel;
}
