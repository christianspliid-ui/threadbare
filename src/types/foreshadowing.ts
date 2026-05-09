import type { ReachDomain } from './traits';

export type ForeshadowingIntelligenceTier = 'unknown' | 'rumor' | 'briefed' | 'expert';

export type ForeshadowingTopMotive =
  | 'awareness'
  | 'visibility'
  | 'prereqs'
  | 'threat'
  | 'capability'
  | 'cooldown';

export type ForeshadowingInterventionKind =
  | 'whisper'
  | 'nudge'
  | 'vision'
  | 'omen'
  | 'affliction'
  | 'bless';

export interface ForeshadowingSignals {
  intelligenceTier: ForeshadowingIntelligenceTier;
  topMotive: ForeshadowingTopMotive;
  dominantReach: ReachDomain;
}

export interface EncounterForeshadowingVariantWhen {
  intelligenceTier?: ForeshadowingIntelligenceTier | ForeshadowingIntelligenceTier[];
  topMotive?: ForeshadowingTopMotive | ForeshadowingTopMotive[];
  dominantReach?: ReachDomain | ReachDomain[];
}

export interface EncounterForeshadowingVariant {
  id: string;
  when: EncounterForeshadowingVariantWhen;
  template: string;
}

export interface EncounterForeshadowingDefinition {
  variants: readonly EncounterForeshadowingVariant[];
  fallback: string;
}

export interface ForeshadowingInterventionAttribution {
  interventionId: string;
  interventionKind: ForeshadowingInterventionKind;
  tickPerformed: number;
  summary: string;
}

export interface ForeshadowingResult {
  prose: string;
  variantId: string | null;
  signals: ForeshadowingSignals;
  interventionAttribution: ForeshadowingInterventionAttribution | null;
  resolvedAtTick: number;
}

export interface ForeshadowingResolutionTrace {
  category: 'foreshadowing';
  tick: number;
  agentId: string;
  encounterId: string;
  variantsConsidered: string[];
  variantPicked: string | null;
  signals: ForeshadowingSignals;
  interventionAttributionId: string | null;
  cacheHit: boolean;
  summary: string;
}
