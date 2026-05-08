import type { ReachDomain } from '../traits';

export type EncounterChoiceCost =
  | 'small_breath'
  | 'fuller_breath'
  | 'deep_draught';

export type EncounterOutcomeBand =
  | 'critical_fail'
  | 'fail'
  | 'fail_forward'
  | 'success'
  | 'critical_success';

export type ForecastTier =
  | 'doomed'
  | 'perilous'
  | 'uncertain'
  | 'favorable'
  | 'fated';

export type DriftThresholdBand = 'soft' | 'banner' | 'becoming';
export type DetectionThresholdBand = 'notice' | 'turn' | 'encounter';
export type SpotlightTrigger = 'world_handoff' | 'manual_select' | 'beat_advancement';
export type ArchetypePole = 'virtue' | 'flaw';

export interface ChoiceResolvedTrace {
  category: 'choice_resolved';
  tick: number;
  encounterId: string;
  beatIndex: number;
  agentId: string;
  reach: ReachDomain;
  cost: EncounterChoiceCost;
  probabilityTilt: number;
  driftMagnitude: number;
  moralAxisPole: ArchetypePole;
  consumesItem?: string;
  outcomeBand: EncounterOutcomeBand;
  rolledD100: number;
  effectiveProbability: number;
}

export interface ForecastComputedTrace {
  category: 'forecast_computed';
  tick: number;
  encounterId: string;
  beatIndex: number;
  baseProbability: number;
  modifiers: Array<{ source: string; delta: number }>;
  finalTier: ForecastTier;
  factors: string[];
}

export interface HandFilteredTrace {
  category: 'hand_filtered';
  tick: number;
  encounterId: string;
  totalDeckSize: number;
  playableCount: number;
  dimmedCount: number;
  hiddenCount: number;
  rarePulses: string[];
}

export interface DriftThresholdCrossedTrace {
  category: 'drift_threshold_crossed';
  tick: number;
  agentId: string;
  axisId: string;
  fromPosition: number;
  toPosition: number;
  thresholdCrossed: DriftThresholdBand;
  pole: ArchetypePole;
}

export interface DetectionThresholdCrossedTrace {
  category: 'detection_threshold_crossed';
  tick: number;
  regionId: string;
  fromPressure: number;
  toPressure: number;
  thresholdCrossed: DetectionThresholdBand;
}

export interface ItemConsumedByChoiceTrace {
  category: 'item_consumed_by_choice';
  tick: number;
  encounterId: string;
  beatIndex: number;
  agentId: string;
  itemId: string;
}

export interface SpotlightChangedTrace {
  category: 'spotlight_changed';
  tick: number;
  fromAgentId?: string;
  toAgentId: string;
  trigger: SpotlightTrigger;
}

export interface CallbackEligibilityComputedTrace {
  category: 'callback_eligibility_computed';
  tick: number;
  encounterId: string;
  beatIndex: number;
  agentId: string;
  authorPinnedCount: number;
  graphDerivedCount: number;
  selectedEventIds: string[];
}

export type EncounterExperienceTraceEntry =
  | ChoiceResolvedTrace
  | ForecastComputedTrace
  | HandFilteredTrace
  | DriftThresholdCrossedTrace
  | DetectionThresholdCrossedTrace
  | ItemConsumedByChoiceTrace
  | SpotlightChangedTrace
  | CallbackEligibilityComputedTrace;
