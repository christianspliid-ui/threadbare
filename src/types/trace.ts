import type { SphereName } from './index';
import type { ModifierResolutionTrace } from './modifiers';

/** Base shape for all trace entries */
export interface TraceBase {
  id: number;
  tick: number;
  timestamp: number;
  category: string;
  agentId?: string;
  summary: string;
}

/** Stage snapshot for action selection pipeline */
export interface PipelineStageSnapshot {
  stageName: string;
  candidateIds: string[];
  scores: number[];
  notes?: string;
}

/** Trace: agent picks an action via 5-stage pipeline */
export interface ActionSelectionTrace extends TraceBase {
  category: 'action_selection';
  stages: PipelineStageSnapshot[];
  finalPick: {
    actionId: string;
    actionName: string;
    targetId?: string;
    targetName?: string;
    score: number;
    probability: number;
    roll: number;
  };
}

/** Trace: prose generated for a narrative event */
export interface NarrativeGenerationTrace extends TraceBase {
  category: 'narrative_generation';
  tier: 'routine' | 'notable' | 'chronicle';
  templateId?: string;
  sphereWords?: string[];
  personalityClause?: string;
  finalProse: string;
}

/** Trace: narrative context harvested for an event */
export interface ContextHarvestTrace extends TraceBase {
  category: 'context_harvest';
  harvestedCount: number;
  rankedTop: Array<{ nodeId: string; name: string; score: number }>;
  selectedIds: string[];
  oppositionTension: number;
}

/** Trace: 2×2 dilemma resolved between two agents */
export interface DilemmaResolutionTrace extends TraceBase {
  category: 'dilemma_resolution';
  targetId: string;
  actorStrategy: string;
  targetStrategy: string;
  actorMove: 'cooperate' | 'defect';
  targetMove: 'cooperate' | 'defect';
  outcome: string;
  stakes: number;
  sentimentDelta: number;
  reputationDeltas: { actor: number; target: number };
}

/** Trace: tick summary emitted at end of each tick */
export interface TickSummaryTrace extends TraceBase {
  category: 'tick_summary';
  phaseEventCounts: Record<string, number>;
  agentsProcessed: number;
  doomStage: number;
  essenceTotal: number;
  mandateProgress: number;
}

/** Trace: encounter step resolved */
export interface EncounterResolutionTrace extends TraceBase {
  category: 'encounter_resolution';
  encounterId: string;
  actorId: string;
  stepId: string;
  stepName: string;
  difficulty: number;
  capability: number;
  probability: number;
  roll: number;
  success: boolean;
  status: 'active' | 'completed' | 'abandoned' | 'initiated';
  traitChanges: string[];
}

/** Trace: familiarity gained with an actor */
export interface FamiliarityChangeTrace extends TraceBase {
  category: 'familiarity_change';
  actorId: string;
  actorName: string;
  source: 'worship_tier_1' | 'worship_tier_2' | 'worship_tier_3' | 'proximity' | 'scry' | 'narrative_contact' | 'dilemma';
  oldFamiliarity: number;
  newFamiliarity: number;
  levelChanged: boolean;
  newLevel?: string;
  amount: number;
  multiplier: number;
}

/** Trace: divine intervention effect applied to an agent */
export interface InterventionEffectTrace extends TraceBase {
  category: 'intervention_effect';
  interventionType: string;
  targetAgentId: string;
  targetAgentName: string;
  sphere: string;
  effects: string[];
  consequenceMessage: string;
  initialStrength?: number;
  maxDuration?: number;
}

/** Trace: CRUD action executed */
export interface ActionExecutionTrace extends TraceBase {
  category: 'action_execution';
  templateId: string;
  actorId: string;
  outcome: string;
  opsApplied: number;
  opsFailed: number;
  duration: number;
}

/** Trace: prosperity ticked for a settlement location */
export interface ProsperityTickTrace extends TraceBase {
  category: 'prosperity_tick';
  locationId: string;
  baseIncome: number;
  tradeBonus: number;
  disruptionPenalty: number;
  netDelta: number;
  previousProsperity: number;
  newProsperity: number;
  previousTier: string;
  newTier: string;
  tierChanged: boolean;
}

/** Trace: wealth delta applied to an actor */
export interface WealthDeltaTrace extends TraceBase {
  category: 'wealth_delta';
  actorId: string;
  previousWealth: number;
  delta: number;
  newWealth: number;
  reason: 'trade_success' | 'trade_failure' | 'route_control' | 'sublocation_income'
         | 'prosperous_home' | 'disruption' | 'agreement_broken'
         | 'mercenary_hire' | 'assassination_commission' | 'influence_purchase'
         | 'construction' | 'monopoly';
  sourceActionId?: string;
  sourceActorId?: string;
}

/** Trace: trade route volume changed */
export interface TradeRouteVolumeChangeTrace extends TraceBase {
  category: 'trade_route_volume_change';
  edgeId: string;
  sourceId: string;
  targetId: string;
  previousVolume: number;
  newVolume: number;
  cause: 'established' | 'expanded' | 'decayed' | 'disrupted' | 'taxed';
  causingActorId?: string;
  causingActionId?: string;
}

/** Trace: trade route removed after volume decayed to 0 */
export interface TradeRouteDissolvedTrace extends TraceBase {
  category: 'trade_route_dissolved';
  edgeId: string;
  sourceId: string;
  targetId: string;
  establishedTick: number;
  peakVolume: number;
  totalTicksActive: number;
  causeOfDeath: 'decay';
}

/** Trace: settlement changes tier (hamlet↔town↔city) via sustained prosperity */
export interface SettlementTierChangeTrace extends TraceBase {
  category: 'settlement_tier_change';
  locationId: string;
  locationName: string;
  previousSubtype: string;
  newSubtype: string;
  direction: 'promotion' | 'demotion';
  sustainedTicks: number;
  prosperity: number;
}

/** Trace: player target-action filter cascade (emitted once per getTargetActionSlots call) */
export interface TargetActionFilterTrace extends TraceBase {
  category: 'target_action_filter';
  targetNodeId: string;
  targetNodeType: string;
  targetSubtype: string | null;
  templatesConsidered: number;
  filteredByNodeType: number;
  filteredBySubtype: number;
  filteredByTraits: number;
  filteredBySphere: number;
  filteredByEssence: number;
  filteredByRange: number;
  slotsGenerated: number;
}

/** Discriminated union of all trace types */
export type TraceEntry =
  | ActionSelectionTrace
  | NarrativeGenerationTrace
  | ContextHarvestTrace
  | DilemmaResolutionTrace
  | TickSummaryTrace
  | EncounterResolutionTrace
  | FamiliarityChangeTrace
  | InterventionEffectTrace
  | ActionExecutionTrace
  | ModifierResolutionTrace
  | ProsperityTickTrace
  | WealthDeltaTrace
  | TradeRouteVolumeChangeTrace
  | TradeRouteDissolvedTrace
  | SettlementTierChangeTrace
  | TargetActionFilterTrace;

/** All known trace categories */
export const TRACE_CATEGORIES = [
  'action_selection',
  'narrative_generation',
  'context_harvest',
  'dilemma_resolution',
  'tick_summary',
  'encounter_resolution',
  'familiarity_change',
  'intervention_effect',
  'action_execution',
  'modifier_resolution',
  'prosperity_tick',
  'wealth_delta',
  'trade_route_volume_change',
  'trade_route_dissolved',
  'settlement_tier_change',
  'target_action_filter',
] as const;

export type TraceCategory = (typeof TRACE_CATEGORIES)[number];
