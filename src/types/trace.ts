import type { SphereName } from './index';
import type { ReachDomain } from './traits';
import type { ValuePair } from './agent';
import type { ModifierResolutionTrace } from './modifiers';
import type { LapseReason } from './controlEffect';
import type { NarrativeLayer, StepOutcome } from './unifiedAction';
import type { RarityTier } from './rarity';
import type {
  EncounterPromotionTrace,
  CuratorDecisionTrace,
  AttentionPoolTrace,
  StoryBeatQueueTrace,
} from './attention';
import type { BehaviorFamily, StrategicVerb, StrategicExecutionMode } from './strategicAction';
import type { ComplicationSeverity } from './complication';
import type { SyllableTemplate } from './culture';
import type { ReliabilityBand } from '../engine/intelligence';
import type { IntelligenceCategory } from './unifiedAction';

/** Known trace categories for filtering in debug panel */
export type TraceCategory =
  | 'action_selection' | 'narrative_generation' | 'context_harvest'
  | 'dilemma_resolution' | 'tick_summary' | 'encounter_resolution'
  | 'familiarity_change' | 'movement' | 'intervention_effect'
  | 'action_execution' | 'modifier_resolution'
  | 'prosperity_tick' | 'wealth_delta'
  | 'trade_route_volume_change' | 'trade_route_dissolved'
  | 'settlement_tier_change' | 'target_action_filter'
  | 'hex_state' | 'unrest_tick' | 'saturation_tick'
  | 'economic_chronicle' | 'encounter_awareness' | 'faction_awareness'
  | 'encounter_cache' | 'encounter_filter' | 'idle_decision'
  | 'encounter_scoring' | 'road_hex_transition' | 'agent_reroute'
  | 'return_resolution' | 'ripple_consequence' | 'control_effect'
  | 'doom_card' | 'mandate_checkpoint'
  | 'revelation' | 'tick_health' | 'tick_crash'
  | 'agent_revelation' | 'interaction_depth'
  | 'faction_ambition'
  | 'reputation_trait'
  | 'rarity_graduation'
  | 'rarity_importance'
  | 'encounter_promotion'
  | 'curator_decision'
  | 'attention_pool'
  | 'story_beat_queue'
  | 'slot_overflow'
  | 'slot_disposal'
  | 'condition_overflow'
  | 'slot_expansion'
  | 'meeting_sensing'
  | 'meeting_testing'
  | 'meeting_spark'
  | 'meeting_bond'
  | 'settlement_genome'
  | 'settlement_reassessment'
  | 'culture_generation'
  | 'culture_sublocation'
  | 'culture_phonetic_signature_built'
  | 'phonetic_name_generated'
  | 'strategic_candidate_board'
  | 'strategic_action_started'
  | 'strategic_project_progress'
  | 'strategic_world_change'
  // Omen agenda traces (THR-19)
  | 'omen_selection'
  | 'omen_beat'
  // Encounter aftermath traces (THR-111)
  | 'encounter_aftermath_applied'
  | 'encounter_aftermath_effect'
  | 'encounter_seed_planted'
  | 'encounter_seed_triggered'
  | 'hidden_mark_placed'
  | 'hidden_mark_revealed'
  | 'intelligence_granted'
  | 'intelligence_referenced'
  | 'authored_attachment_created'
  // Complication outcome traces (THR-20)
  | 'complication_selection'
  // Multi-target aftermath traces (THR-114)
  | 'aftermath_target_resolved'
  | 'faction_reputation_changed'
  | 'reputation_set_applied'
  | 'condition_applied'
  | 'condition_removed'
  | 'aftermath_target_invalid'
  // World-shaping aftermath traces (THR-115)
  | 'artifact_spawned'
  | 'omen_emitted'
  | 'omen_decayed'
  | 'faction_splintered'
  | 'faction_absorbed'
  | 'faction_dissolved'
  | 'faction_war_declared'
  | 'faction_peace_forced'
  // Causation + conditional aftermath traces (THR-116)
  | 'causation_edge_created'
  | 'causation_edge_creation_skipped'
  | 'aftermath_effect_skipped_by_when'
  | 'aftermath_effect_when_passed'
  | 'thread_mutation_applied'
  | 'thread_mutation_skipped'
  // Intelligence reliability decay traces (THR-137)
  | 'intelligence_decayed'
  // Secrets & Favors traces (THR-30)
  | 'secret_discovered'
  | 'secret_revealed'
  | 'favor_created'
  | 'favor_redeemed'
  | 'favor_broken'
  | 'favor_tension'
  | 'secret_decayed'
  // Agent initiatives traces (THR-51)
  | 'initiative_started'
  | 'initiative_checkpoint'
  | 'initiative_completed'
  | 'initiative_failed'
  // Portfolio-pinning traces (THR-148)
  | 'portfolio.pinned'
  | 'portfolio.unpinned';

export const TRACE_CATEGORIES: TraceCategory[] = [
  'action_selection', 'narrative_generation', 'context_harvest',
  'dilemma_resolution', 'tick_summary', 'encounter_resolution',
  'familiarity_change', 'movement', 'intervention_effect',
  'action_execution', 'modifier_resolution',
  'prosperity_tick', 'wealth_delta',
  'trade_route_volume_change', 'trade_route_dissolved',
  'settlement_tier_change', 'target_action_filter',
  'hex_state', 'unrest_tick', 'saturation_tick',
  'economic_chronicle', 'encounter_awareness', 'faction_awareness',
  'encounter_cache', 'encounter_filter', 'idle_decision',
  'encounter_scoring', 'road_hex_transition', 'agent_reroute',
  'return_resolution', 'ripple_consequence', 'control_effect',
  'doom_card', 'mandate_checkpoint',
  'revelation', 'tick_health', 'tick_crash',
  'agent_revelation', 'interaction_depth',
  'faction_ambition',
  'reputation_trait',
  'rarity_graduation',
  'rarity_importance',
  'encounter_promotion',
  'curator_decision',
  'attention_pool',
  'story_beat_queue',
  'slot_overflow',
  'slot_disposal',
  'condition_overflow',
  'slot_expansion',
  'meeting_sensing',
  'meeting_testing',
  'meeting_spark',
  'meeting_bond',
  'settlement_genome',
  'settlement_reassessment',
  'culture_generation',
  'culture_sublocation',
  'culture_phonetic_signature_built',
  'phonetic_name_generated',
  'strategic_candidate_board',
  'strategic_action_started',
  'strategic_project_progress',
  'strategic_world_change',
  'omen_selection',
  'omen_beat',
  // Fix: three TraceEntry members that were defined but missing from this array (THR-111)
  'graph_op_execution',
  'choice_set_player_resolved',
  'choice_set_player_dismissed',
  // New encounter aftermath traces (THR-111)
  'encounter_aftermath_applied',
  'encounter_aftermath_effect',
  'encounter_seed_planted',
  'encounter_seed_triggered',
  'hidden_mark_placed',
  'hidden_mark_revealed',
  'intelligence_granted',
  'intelligence_referenced',
  'authored_attachment_created',
  // Complication outcome traces (THR-20)
  'complication_selection',
  // Multi-target aftermath traces (THR-114)
  'aftermath_target_resolved',
  'faction_reputation_changed',
  'reputation_set_applied',
  'condition_applied',
  'condition_removed',
  'aftermath_target_invalid',
  // World-shaping aftermath traces (THR-115)
  'artifact_spawned',
  'omen_emitted',
  'omen_decayed',
  'faction_splintered',
  'faction_absorbed',
  'faction_dissolved',
  'faction_war_declared',
  'faction_peace_forced',
  // Causation + conditional aftermath traces (THR-116)
  'causation_edge_created',
  'causation_edge_creation_skipped',
  'aftermath_effect_skipped_by_when',
  'aftermath_effect_when_passed',
  'thread_mutation_applied',
  'thread_mutation_skipped',
  // Intelligence reliability decay traces (THR-137)
  'intelligence_decayed',
  // Secrets & Favors traces (THR-30)
  'secret_discovered',
  'secret_revealed',
  'favor_created',
  'favor_redeemed',
  'favor_broken',
  'favor_tension',
  'secret_decayed',
  // Agent initiatives traces (THR-51)
  'initiative_started',
  'initiative_checkpoint',
  'initiative_completed',
  'initiative_failed',
  // Portfolio-pinning traces (THR-148)
  'portfolio.pinned',
  'portfolio.unpinned',
];

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
  culturalFlavorApplied?: boolean;
  finalProse: string;
  /** THR-86: structural shape chosen for routine prose */
  shape?: string;
  /** THR-86: placeholder names resolved via enrichProse */
  placeholdersResolved?: string[];
  /** THR-86: reason enrichProse was skipped for this routine event */
  fallbackReason?: 'no_graph' | 'no_actor_id';
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
  /** Summary of reward granted on completion (populated by encounter resolution) */
  rewardSummary?: string;
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

/** Trace: hex tile state ticked (decay or terrain transformation) */
export interface HexStateTickTrace extends TraceBase {
  category: 'hex_state';
  col: number;
  row: number;
  prevDivineInfluence: number;
  newDivineInfluence: number;
  prevCorruption: number;
  newCorruption: number;
  terrainChanged: boolean;
  prevTerrain?: string;
  newTerrain?: string;
}

/** Trace: unrest ticked for a settlement location */
export interface UnrestTickTrace extends TraceBase {
  category: 'unrest_tick';
  locationId: string;
  locationName: string;
  prevUnrest: number;
  newUnrest: number;
  decayApplied: number;
  prosperityDamper: number;
  thresholdsCrossed: string[];
}

/** Trace: magical saturation ticked for a location */
export interface MagicalSaturationTickTrace extends TraceBase {
  category: 'saturation_tick';
  locationId: string;
  prevSaturation: number;
  newSaturation: number;
  decayApplied: number;
}

/** Trace: economic chronicle entry generated */
export interface EconomicChronicleTrace extends TraceBase {
  category: 'economic_chronicle';
  trigger: string;
  templateIndex: number;
  significance: number;
  actorIds: string[];
}

/** Trace: per-reach encounter awareness computation */
export interface EncounterAwarenessTrace extends TraceBase {
  category: 'encounter_awareness';
  agentId: string;
  reach: ReachDomain;
  capability: number;
  hopsGranted: number;
  encountersVisible: number;
}

/** Trace: faction network intelligence added encounters */
export interface FactionAwarenessTrace extends TraceBase {
  category: 'faction_awareness';
  agentId: string;
  factionId: string;
  factionPrimaryReach: ReachDomain;
  agentRank: number;
  maxEntries: number;
  entriesAdded: number;
}

/** Trace: encounter cache update event */
export interface CacheUpdateTrace extends TraceBase {
  category: 'encounter_cache';
  event: string;
  locationId?: string;
  entriesAdded: number;
  entriesRemoved: number;
  totalEntries: number;
}

/** Trace: 5-stage filter pipeline results */
export interface FilterPipelineTrace extends TraceBase {
  category: 'encounter_filter';
  agentId: string;
  cacheSize: number;
  afterAwareness: number;
  afterVisibility: number;
  afterPrerequisites: number;
  afterThreat: number;
  afterCap: number;
}

/** Trace: agent movement transition or decision */
export interface MovementTrace extends TraceBase {
  category: 'movement';
  agentId: string;
  agentName: string;
  event: 'step' | 'arrive' | 'sublocation_enter' | 'sublocation_return' | 'reroute' | 'depart';
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId?: string;
  toLocationName?: string;
  destinationId?: string;
  destinationName?: string;
  sublocationId?: string;
  sublocationName?: string;
  encounterId?: string;
  queueLength?: number;
  /** For reroute: old destination vs new */
  oldDestinationId?: string;
  oldDestinationName?: string;
}

/** Trace: agent chose to idle — explains why no encounter was selected */
export interface IdleDecisionTrace extends TraceBase {
  category: 'idle_decision';
  agentId: string;
  agentName: string;
  locationId: string;
  /** Why the agent idled instead of acting */
  reason: 'no_candidates_after_filter' | 'no_candidates_after_cooldown' | 'below_score_threshold';
  /** Filter pipeline counts — how candidates were eliminated */
  filterPipeline: {
    cacheSize: number;
    afterAwareness: number;
    afterVisibility: number;
    afterPrerequisites: number;
    afterThreat: number;
    afterCap: number;
  };
  /** Candidates surviving filter but eliminated by cooldown */
  candidatesBeforeCooldown: number;
  candidatesAfterCooldown: number;
  /** Best score among surviving candidates (null if none survived) */
  bestScore: number | null;
  /** Threshold that bestScore failed to meet */
  scoreThreshold: number;
  /** What the agent chose to do while idle */
  idleAction: 'drift' | 'trivial_local' | 'stay';
  /** Drift target location (if idleAction === 'drift') */
  driftTargetId?: string;
  driftTargetName?: string;
}

/** Trace: encounter scoring and selection */
export interface ScoringTrace extends TraceBase {
  category: 'encounter_scoring';
  agentId: string;
  topCandidates: Array<{
    templateId: string;
    locationId: string;
    isLocal: boolean;
    valuePerTick: number;
    desireMultiplier: number;
    familiarityPenalty?: number;
    explorationBonus?: number;
    finalScore: number;
    travelCost: number;
    completionProb: number;
    resonance?: number;
    globalResonance?: number;
    worldSoulDrift?: Record<string, number>;
    chainBonus?: number;
    rarityMultiplier?: number;
    /** Role-reach affinity multiplier (1.0 = no match, >1.0 = role reach matches encounter) */
    roleAffinityMultiplier?: number;
    /** Phase 4: Expected utility from 5-tier outcome ladder */
    expectedUtility?: number;
    /** Phase 4: Push benefit estimate (Q spend for better odds) */
    pushBenefit?: number;
    /** Phase 4: Resist benefit estimate (downgrade protection) */
    resistBenefit?: number;
  }>;
  selectedTemplateId: string | null;
  selectedLocationId: string | null;
  action: 'start_local' | 'queue_movement' | 'attempt_remote' | 'idle';
}

/** Trace: agent advanced one hex along a road during movement */
export interface RoadHexTransitionTrace extends TraceBase {
  category: 'road_hex_transition';
  agentId: string;
  fromHex: { col: number; row: number };
  toHex: { col: number; row: number };
  roadType: 'major' | 'trail';
  /** Current hex index in the road path (e.g., 4 of 8) */
  hexProgress: number;
  /** Total hexes in the road segment */
  hexTotal: number;
  ticksAccumulated: number;
  hexCost: number;
}

/** Trace: agent rerouted mid-movement to a new destination */
export interface AgentRerouteTrace extends TraceBase {
  category: 'agent_reroute';
  agentId: string;
  oldDestinationId: string;
  newDestinationId: string;
  currentHexPosition: { col: number; row: number };
  reason: 'better_encounter' | 'target_invalid' | 'threat';
  oldScore: number;
  newScore: number;
}

/** Trace: Return convergence resolved for The First */
export interface ReturnResolutionTrace extends TraceBase {
  category: 'return_resolution';
  agentId: string;
  outcome: string;
  ordealOutcome: string;
  eligibleOutcomes: string[];
  scores: Record<string, number>;
}

/** Trace: ripple consequence applied to a connection */
export interface RippleConsequenceTrace extends TraceBase {
  category: 'ripple_consequence';
  sourceAgentId: string;
  returnOutcome: string;
  targetNodeId: string;
  targetName: string;
  targetType: string;
  consequence: string;
}

/** Trace: a doom card resolved into world-scale effects. */
export interface DoomCardTrace extends TraceBase {
  category: 'doom_card';
  stage: number;
  archetype: string;
  cardId: string;
  cardTitle: string;
  severity: number;
  effectType?: string;
  targetCount?: number;
}

/** Trace: a remembrance mandate checkpoint passed or missed. */
export interface MandateCheckpointTrace extends TraceBase {
  category: 'mandate_checkpoint';
  checkpointIndex: number;
  doomProgressThreshold: number;
  requiredPrimaryDelta: number;
  observedPrimaryDelta: number;
  passed: boolean;
  exceeded: boolean;
  counterOmensDelta: number;
  severityPenaltyDelta: number;
}

/** Trace: control effect ticked (per-tick drain, income, threshold check) */
export interface ControlEffectTickTrace extends TraceBase {
  category: 'control_effect';
  type: 'control_effect_tick';
  effectId: string;
  templateId: string;
  targetHex: { col: number; row: number };
  essenceDrained: Partial<Record<SphereName, number>>;
  essenceGenerated: Partial<Record<SphereName, number>>;
  thresholdChecked: boolean;
  thresholdPassed: boolean;
  active: boolean;
  ticksActive: number;
}

/** Trace: control effect lapsed (essence depleted, threshold failed, etc.) */
export interface ControlEffectLapseTrace extends TraceBase {
  category: 'control_effect';
  type: 'control_effect_lapsed';
  effectId: string;
  templateId: string;
  targetHex: { col: number; row: number };
  lapseReason: LapseReason;
  totalTicksActive: number;
  totalEssenceDrained: Partial<Record<SphereName, number>>;
}

/** Trace: control effect established after successful sustained action */
export interface ControlEffectEstablishedTrace extends TraceBase {
  category: 'control_effect';
  type: 'control_effect_established';
  effectId: string;
  templateId: string;
  ownerId: string;
  targetHex: { col: number; row: number };
  ritualEssenceInvested: number;
  encounterNodeId?: string;
}

/** Trace: narrative layer revealed on a hex via Find action */
export interface LayerRevealedTrace extends TraceBase {
  category: 'revelation';
  type: 'layer_revealed';
  hexCol: number;
  hexRow: number;
  layer: NarrativeLayer;
  revealedBy: string;  // action template ID or encounter ID
}

/** Trace: tick health check failed (structural problem detected post-tick) */
export interface TickHealthTrace extends TraceBase {
  category: 'tick_health';
  findings: Array<{
    check: string;
    severity: 'critical' | 'error' | 'warning';
    message: string;
    detail?: unknown;
  }>;
}

/** Trace: unhandled exception during tick execution (fail-soft: previous state returned) */
export interface TickCrashTrace extends TraceBase {
  category: 'tick_crash';
  type: 'tick_exception';
  error: string;
  stack?: string;
}

/** Trace: hidden sublocation discovered on a hex */
export interface HiddenSiteRevealedTrace extends TraceBase {
  category: 'revelation';
  type: 'hidden_site_revealed';
  hexCol: number;
  hexRow: number;
  sublocationId: string;
  sublocationName: string;
  hasElderMagic: boolean;
}

/** Trace: a specific agent knowledge facet revealed to the player */
export interface RevelationTrace extends TraceBase {
  category: 'agent_revelation';
  agentId: string;
  facetType: 'value' | 'domain' | 'bond' | 'ambition' | 'disposition' | 'possession' | 'power' | 'condition' | 'agreement' | 'threat' | 'chronicle_event';
  facetId: string;
  source: 'encounter_observation' | 'divine_action' | 'social_gossip' | 'faction_intel' | 'co_location' | 'public_event' | 'dilemma_witness' | 'first_sighting' | 'power_use_witnessed' | 'agreement_witnessed';
  interactionDepthBefore: number;
  interactionDepthAfter: number;
}

/** Trace: cumulative interaction depth updated for an agent */
export interface InteractionDepthTrace extends TraceBase {
  category: 'interaction_depth';
  agentId: string;
  source: 'dilemma' | 'encounter_observed' | 'divine_action' | 'social_encounter' | 'co_location' | 'faction_ambient';
  depthBefore: number;
  depthAfter: number;
}

/** Trace: a graph node graduated to a higher rarity tier */
export interface RarityGraduationTrace extends TraceBase {
  category: 'rarity_graduation';
  nodeId: string;
  nodeCategory: 'actor' | 'location' | 'sublocation' | 'attachment';
  previousTier: RarityTier;
  newTier: RarityTier;
  trigger: 'player_action' | 'organic_threshold' | 'story_event';
  cause: string;
}

/** Trace: importance accumulated on a graph node */
export interface RarityImportanceTrace extends TraceBase {
  category: 'rarity_importance';
  nodeId: string;
  nodeName: string;
  source: 'player_action' | 'encounter_resolved' | 'chronicle_reference' | 'divine_proximity' | 'sphere_event';
  delta: number;
  newImportance: number;
  currentTier: RarityTier;
}

/** Trace: settlement genome pipeline result at worldgen or reassessment */
export interface SettlementGenomeTrace extends TraceBase {
  category: 'settlement_genome';
  locationId: string;
  locationName: string;
  tier: string;
  cultureBias: string;
  cultureStrength: number;
  spheresAboveThreshold: { sphere: string; value: number }[];
  reachesAboveThreshold: { reach: string; value: number }[];
  position: 'heartland' | 'borderland';
  passContributions: {
    infrastructure: string[];
    culture: { substitutions: string[]; additions: string[] };
    sphere: string[];
    reach: string[];
    archetype: string[] | null;
  };
  archetypeMatch: string | null;
  totalSublocations: number;
  totalNpcs: number;
  npcBudgetUsed: number;
  npcBudgetMax: number;
}

/** Trace: settlement reassessment triggered by tier change, reach shift, etc. */
export interface SettlementReassessmentTrace extends TraceBase {
  category: 'settlement_reassessment';
  locationId: string;
  trigger: 'promotion' | 'demotion' | 'reach_threshold' | 'faction_change' | 'vitality_crisis';
  previousTier: string | null;
  newTier: string | null;
  sublocationsAdded: string[];
  sublocationsRuined: string[];
  archetypeChange: { from: string | null; to: string | null } | null;
}

// ═══════════════════════════════════════════════════════════════════
// Culture Phonetics Traces (THR-15)
// ═══════════════════════════════════════════════════════════════════

/** Trace: phonetic signature built for a culture at worldgen */
export interface CulturePhoneticSignatureBuiltTrace extends TraceBase {
  category: 'culture_phonetic_signature_built';
  cultureId: string;
  seedHash: number;
  vowelCount: number;
  onsetCount: number;
  codaCount: number;
  templates: SyllableTemplate[];
  personalRange: [number, number];
  settlementRange: [number, number];
}

/** Trace: phonetic generator produced a name */
export interface PhoneticNameGeneratedTrace extends TraceBase {
  category: 'phonetic_name_generated';
  cultureId: string;
  mode: 'personal' | 'settlement' | 'homeland';
  name: string;
  attemptsUsed: number;
}

/** Trace: culture identity generation and trait assignment */
export interface CultureGenerationTrace extends TraceBase {
  category: 'culture_generation';
  cultureId: string;
  demonym?: string;
  traitNodeId?: string;
  entityId?: string;
  edgeCulturalStrength?: number;
}

/** Trace: cultural sublocation creation or ruin */
export interface CultureSublocationTrace extends TraceBase {
  category: 'culture_sublocation';
  locationId: string;
  sublocationId: string;
  cultureId: string;
  tier: string;
  isSubstitution: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Strategic Action Traces
// ═══════════════════════════════════════════════════════════════════

/** Trace: strategic candidate board evaluated for an actor */
export interface StrategicCandidateBoardTrace extends TraceBase {
  category: 'strategic_candidate_board';
  actorId: string;
  ambitionIds: string[];
  candidatesGenerated: number;
  candidatesRejected: number;
  topCandidateIds: string[];
  chosenCandidateId: string | null;
  featureEnabled: boolean;
}

/** Trace: strategic action started (instant or project) */
export interface StrategicActionStartedTrace extends TraceBase {
  category: 'strategic_action_started';
  actorId: string;
  candidateId: string;
  behaviorFamily: BehaviorFamily;
  verb: StrategicVerb;
  targetNodeId?: string;
  targetHex?: { col: number; row: number };
  executionMode: StrategicExecutionMode;
}

/** Trace: multi-tick strategic project progress update */
export interface StrategicProjectProgressTrace extends TraceBase {
  category: 'strategic_project_progress';
  actorId: string;
  projectId: string;
  progress: number;
  progressRequired: number;
  status: 'active' | 'completed' | 'stalled' | 'failed';
}

/** Trace: strategic action produced a world graph change */
export interface StrategicWorldChangeTrace extends TraceBase {
  category: 'strategic_world_change';
  actorId: string;
  projectId?: string;
  verb: StrategicVerb;
  graphOps: string[];
  catalystSeeded: boolean;
  affectedNodeIds: string[];
}

// ═══════════════════════════════════════════════════════════════════
// Encounter Aftermath Traces (THR-111)
// ═══════════════════════════════════════════════════════════════════

/** Trace: encounter aftermath reaction applied — summary of all effects fired */
export interface EncounterAftermathAppliedTrace extends TraceBase {
  category: 'encounter_aftermath_applied';
  encounterId: string;
  actionId: string;
  actorId: string;
  reactionId: string;
  /** Category string for each effect in the reaction, in order */
  effectKinds: readonly string[];
}

/** Trace: single aftermath reaction effect applied (one per effect.kind in reaction.effects) */
export interface EncounterAftermathEffectTrace extends TraceBase {
  category: 'encounter_aftermath_effect';
  encounterId: string;
  actionId: string;
  reactionId: string;
  /** Index in reaction.effects array */
  effectIndex: number;
  effectKind:
    | 'reputation_score' | 'reputation_tally' | 'clearance_gate_tag'
    | 'recent_event' | 'encounter_seed' | 'hidden_mark' | 'intelligence'
    | 'reputation_set' | 'apply_condition' | 'remove_condition' | 'condition_attachment';
  /** Kind-specific payload for inspection */
  effectDetail: Readonly<Record<string, unknown>>;
  success: boolean;
  failReason?: string;
  /** The entity this effect actually landed on (promoted from effectDetail for filter convenience). */
  effectiveTargetId?: string;
  /** Whether the actor fallback was used or a specific target was supplied. */
  effectiveTargetKind?: 'agent' | 'faction' | 'sublocation' | 'actor_fallback';
}

/** Trace: encounter seed planted by aftermath reaction */
export interface EncounterSeedPlantedTrace extends TraceBase {
  category: 'encounter_seed_planted';
  seedId: string;
  targetAgentId: string;
  sourceEncounterId: string;
  sourceReactionId: string;
  templateId?: string;
  encounterFamily?: string;
  delayTicks: number;
  eligibleAfterTick: number;
  seedLabel: string;
  priority: number;
}

/** Trace: encounter seed consumed — fired into an action, used as a narrative beat, or discarded */
export interface EncounterSeedTriggeredTrace extends TraceBase {
  category: 'encounter_seed_triggered';
  seedId: string;
  targetAgentId: string;
  /** Ticks elapsed between seed.plantedTick and current tick */
  ticksBetweenPlantAndTrigger: number;
  /** templateId if fired, 'family:<name>' if family-only, 'none' if discarded */
  resolvedTemplateId: string;
  outcome: 'fired' | 'discarded';
  discardReason?: string;
}

/** Trace: hidden mark placed on an agent by aftermath reaction */
export interface HiddenMarkPlacedTrace extends TraceBase {
  category: 'hidden_mark_placed';
  markId: string;
  actorId: string;
  sourceEncounterId: string;
  sourceTemplateId: string;
  markCategory: string;
  severity: number;
  revealFamilies: readonly string[];
  label: string;
}

/** Trace: hidden mark revealed (consumed) by a matching encounter or action */
export interface HiddenMarkRevealedTrace extends TraceBase {
  category: 'hidden_mark_revealed';
  markId: string;
  actorId: string;
  /** templateId of the encounter or action that matched revealFamilies */
  revealedBy: string;
  ticksSincePlacement: number;
}

/** Trace: intelligence record granted to an agent by aftermath reaction */
export interface IntelligenceGrantedTrace extends TraceBase {
  category: 'intelligence_granted';
  recordId: string;
  agentId: string;
  sourceEncounterId: string;
  intelCategory: string;
  label: string;
  reliability: number;
  targetRegion?: string;
  targetEntityId?: string;
}

/** Trace: intelligence record referenced/used (non-destructive) — closes the grant→consume loop (THR-113) */
export interface IntelligenceReferencedTrace extends TraceBase {
  category: 'intelligence_referenced';
  recordId: string;
  agentId: string;
  /** Where the reference happened. */
  referencedBy: 'scoring_boost' | 'prose_enrichment' | 'resolution_match';
  /** Optional: templateId of the encounter involved (scoring/resolution only). */
  templateId?: string;
  /** Optional: intelligence category (prose_enrichment only). */
  intelCategory?: string;
}

/** Trace: intelligence record reliability decayed this tick (THR-137) */
export interface IntelligenceDecayedTrace extends TraceBase {
  category: 'intelligence_decayed';
  recordId: string;
  agentId: string;
  intelCategory: IntelligenceCategory;
  reliabilityBefore: number;
  reliabilityAfter: number;
  delta: number;
  /** Non-undefined only when the decay crossed a descriptor boundary. */
  crossedThreshold?: ReliabilityBand;
}

/** Trace: authored attachment created from encounter GraphOp, aftermath effect, or support bundle */
export interface AuthoredAttachmentCreatedTrace extends TraceBase {
  category: 'authored_attachment_created';
  sourceEncounterId: string;
  sourceTemplateId: string;
  ownerActorId: string;
  attachmentNodeId: string;
  attachmentName: string;
  /** Node category: possession / condition / agreement / etc. */
  attachmentCategory: string;
  origin: 'aftermath_effect' | 'step_graphop' | 'support_bundle';
}

// ═══════════════════════════════════════════════════════════════════
// Multi-Target Aftermath Traces (THR-114)
// ═══════════════════════════════════════════════════════════════════

/** Trace: aftermath effect target resolved — emitted once per effect, just after resolveAftermathTarget() */
export interface AftermathTargetResolvedTrace extends TraceBase {
  category: 'aftermath_target_resolved';
  encounterId: string;
  actionId: string;
  reactionId: string;
  effectIndex: number;
  effectKind: string;
  effectiveTargetId: string;
  effectiveTargetKind: 'agent' | 'faction' | 'sublocation' | 'actor_fallback';
}

/** Trace: faction node reputation changed by aftermath effect */
export interface FactionReputationChangedTrace extends TraceBase {
  category: 'faction_reputation_changed';
  factionId: string;
  previous: number;
  result: number;
  delta: number;
  /** Which effect kind caused the change */
  kind: 'reputation_score' | 'reputation_tally' | 'reputation_set';
  encounterId: string;
  reactionId: string;
}

/** Trace: reputation_set effect applied (absolute assignment) */
export interface ReputationSetAppliedTrace extends TraceBase {
  category: 'reputation_set_applied';
  targetId: string;
  targetKind: 'agent' | 'faction';
  value: number;
  previous: number;
  encounterId: string;
  reactionId: string;
}

/** Trace: apply_condition effect succeeded — has_trait edge added to graph */
export interface ConditionAppliedTrace extends TraceBase {
  category: 'condition_applied';
  targetId: string;
  targetKind: 'agent' | 'faction' | 'sublocation';
  conditionTraitId: string;
  durationTicks: number;
  intensity: number;
  encounterId: string;
  reactionId: string;
}

/** Trace: remove_condition effect ran (removedCount may be 0 if no matching edges found) */
export interface ConditionRemovedTrace extends TraceBase {
  category: 'condition_removed';
  targetId: string;
  targetKind: 'agent' | 'faction' | 'sublocation';
  conditionTraitId: string;
  removedCount: number;
  encounterId: string;
  reactionId: string;
}

/** Trace: aftermath effect target could not be resolved or effect kind does not support the target kind */
export interface AftermathTargetInvalidTrace extends TraceBase {
  category: 'aftermath_target_invalid';
  encounterId: string;
  reactionId: string;
  effectIndex: number;
  effectKind: string;
  attemptedTargetKind?: 'agent' | 'faction' | 'sublocation';
  attemptedTargetId?: string;
  reason: 'target_node_missing' | 'target_kind_not_supported' | 'condition_template_missing' | 'no_actor_id' | 'participant_unresolved' | 'multiple_targets_specified';
}

// ═══════════════════════════════════════════════════════════════════
// Complication Outcome Traces (THR-20)
// ═══════════════════════════════════════════════════════════════════

/** Trace: complication selector ran for a failure-tier step outcome */
export interface ComplicationSelectionTrace extends TraceBase {
  category: 'complication_selection';
  actionId: string;
  actorId: string;
  stepIndex: number;
  outcome: StepOutcome;
  severity: ComplicationSeverity;
  /** All candidates that passed requirement filtering, with their scores */
  candidates: ReadonlyArray<{ templateId: string; score: number }>;
  /** The templateId that was selected (or 'none' if pool was empty) */
  selected: string;
  /** Human-readable rationale string for the selection (e.g., 'omen_synergy,reach_affinity') */
  reason: string;
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
  | TargetActionFilterTrace
  | HexStateTickTrace
  | UnrestTickTrace
  | MagicalSaturationTickTrace
  | EconomicChronicleTrace
  | EncounterAwarenessTrace
  | FactionAwarenessTrace
  | CacheUpdateTrace
  | FilterPipelineTrace
  | ScoringTrace
  | MovementTrace
  | IdleDecisionTrace
  | RoadHexTransitionTrace
  | AgentRerouteTrace
  | ReturnResolutionTrace
  | RippleConsequenceTrace
  | DoomCardTrace
  | MandateCheckpointTrace
  | ControlEffectTickTrace
  | ControlEffectLapseTrace
  | ControlEffectEstablishedTrace
  | LayerRevealedTrace
  | HiddenSiteRevealedTrace
  | RevelationTrace
  | InteractionDepthTrace
  | ReputationTraitTrace
  | GraphOpExecutionTrace
  | RarityGraduationTrace
  | RarityImportanceTrace
  | EncounterPromotionTrace
  | CuratorDecisionTrace
  | AttentionPoolTrace
  | StoryBeatQueueTrace
  | SlotOverflowTrace
  | SlotDisposalTrace
  | ConditionOverflowTrace
  | SlotExpansionTrace
  | SettlementGenomeTrace
  | SettlementReassessmentTrace
  | CultureGenerationTrace
  | CultureSublocationTrace
  | CulturePhoneticSignatureBuiltTrace
  | PhoneticNameGeneratedTrace
  | StrategicCandidateBoardTrace
  | StrategicActionStartedTrace
  | StrategicProjectProgressTrace
  | StrategicWorldChangeTrace
  | ChoiceSetPlayerResolvedTrace
  | ChoiceSetPlayerDismissedTrace
  | OmenSelectionTrace
  | OmenBeatTrace
  // Encounter aftermath traces (THR-111)
  | EncounterAftermathAppliedTrace
  | EncounterAftermathEffectTrace
  | EncounterSeedPlantedTrace
  | EncounterSeedTriggeredTrace
  | HiddenMarkPlacedTrace
  | HiddenMarkRevealedTrace
  | IntelligenceGrantedTrace
  | IntelligenceReferencedTrace
  | IntelligenceDecayedTrace
  | AuthoredAttachmentCreatedTrace
  // Complication outcome traces (THR-20)
  | ComplicationSelectionTrace
  // Multi-target aftermath traces (THR-114)
  | AftermathTargetResolvedTrace
  | FactionReputationChangedTrace
  | ReputationSetAppliedTrace
  | ConditionAppliedTrace
  | ConditionRemovedTrace
  | AftermathTargetInvalidTrace
  // Initiative traces (THR-51)
  | InitiativeStartedTrace
  | InitiativeCheckpointTrace
  | InitiativeCompletedTrace
  | InitiativeFailedTrace
  // Portfolio-pinning traces (THR-148)
  | PortfolioPinnedTrace
  | PortfolioUnpinnedTrace;

/** Trace: reputation trait tally change, assignment, or removal */
export interface ReputationTraitTrace extends TraceBase {
  category: 'reputation_trait';
  agentId: string;
  reach: ReachDomain | 'power';
  polarity: 'positive' | 'negative' | 'renown';
  action: 'tally_increment' | 'trait_assigned' | 'trait_reinforced' | 'trait_removed' | 'trait_decayed';
  tallyValue?: number;
  traitLevel?: number;
  cause?: string;
}

/** Trace: batch graph operation execution result */
export interface GraphOpExecutionTrace extends TraceBase {
  category: 'graph_op_execution';
  ops: Array<{
    op: string;
    success: boolean;
    error?: string;
    createdId?: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════
// Slot System Traces
// ═══════════════════════════════════════════════════════════════════

/** Trace: possession deactivated because slot cap exceeded */
export interface SlotOverflowTrace extends TraceBase {
  category: 'slot_overflow';
  agentId: string;
  slotTag: string;
  currentCount: number;
  effectiveCap: number;
  deactivatedItemId: string;
  deactivatedItemName: string;
}

/** Trace: inactive overflow item disposed of (sold, gifted, offered, or dropped) */
export interface SlotDisposalTrace extends TraceBase {
  category: 'slot_disposal';
  agentId: string;
  slotTag: string;
  itemId: string;
  itemName: string;
  method: 'sell' | 'gift' | 'offer' | 'drop';
  recipientId?: string;
  reputationDelta?: number;
  wealthDelta?: number;
}

/** Trace: condition cap exceeded — overflow consequence triggered */
export interface ConditionOverflowTrace extends TraceBase {
  category: 'condition_overflow';
  agentId: string;
  conditionSlot: string;
  currentCount: number;
  cap: number;
  overflowEvent: 'incapacitation_check' | 'mortality_check' | 'corruption_check' | 'transcendence_check' | 'rejection';
  outcome: 'passed' | 'failed';
  consequenceTraitId?: string;
}

/** Trace: slot-expanding effect changed effective cap */
export interface SlotExpansionTrace extends TraceBase {
  category: 'slot_expansion';
  agentId: string;
  sourceItemId: string;
  targetSlot: string;
  bonusSlots: number;
  newEffectiveCap: number;
}

// ═══════════════════════════════════════════════════════════════════
// Choice Set Player Resolution Traces (THR-73)
// ═══════════════════════════════════════════════════════════════════

/** Trace: player confirmed a choice_set selection and consequences executed */
export interface ChoiceSetPlayerResolvedTrace extends TraceBase {
  category: 'choice_set_player_resolved';
  actorId: string;
  choiceId: string;
  selectedOptionId: string;
  consequenceCount: number;
}

/** Trace: player dismissed a choice_set modal (timeout or manual cancel, no consequences fired) */
export interface ChoiceSetPlayerDismissedTrace extends TraceBase {
  category: 'choice_set_player_dismissed';
  actorId: string;
  choiceId: string;
}


// ═══════════════════════════════════════════════════════════════════
// Omen Agenda Traces (THR-19)
// ═══════════════════════════════════════════════════════════════════

/** Trace: omen slot selection pipeline ran — which candidates scored and why */
export interface OmenSelectionTrace extends TraceBase {
  category: 'omen_selection';
  slot: 'primary' | 'secondary';
  candidates: Array<{ templateId: string; score: number }>;
  selected: string | null;
  reason: string;
}

/** Trace: omen beat emitted — atmospheric micro-event fired */
export interface OmenBeatTrace extends TraceBase {
  category: 'omen_beat';
  omenId: string;
  slot: 'primary' | 'secondary';
  prose: string;
}

// ─── Initiative Traces (THR-51) ──────────────────────────────────

/** Trace: agent starts a new initiative */
export interface InitiativeStartedTrace extends TraceBase {
  category: 'initiative_started';
  initiativeId: string;
  templateId: string;
  locationId: string;
  targetCompletionTick: number;
  finalScore: number;
  summary: string;
}

/** Trace: initiative checkpoint evaluation */
export interface InitiativeCheckpointTrace extends TraceBase {
  category: 'initiative_checkpoint';
  initiativeId: string;
  templateId: string;
  passed: boolean;
  checkpointIndex: number;
  summary: string;
}

/** Trace: initiative completed — outcomes applied */
export interface InitiativeCompletedTrace extends TraceBase {
  category: 'initiative_completed';
  initiativeId: string;
  templateId: string;
  locationId: string;
  summary: string;
}

/** Trace: initiative failed — condition triggered */
export interface InitiativeFailedTrace extends TraceBase {
  category: 'initiative_failed';
  initiativeId: string;
  templateId: string;
  locationId: string;
  reason: string;
  summary: string;
}

/** Trace: agent added to player's protagonist portfolio (THR-148) */
export interface PortfolioPinnedTrace extends TraceBase {
  category: 'portfolio.pinned';
  agentId: string;
  agentName: string;
  pinnedCount: number;
  summary: string;
}

/** Trace: agent removed from player's protagonist portfolio (THR-148) */
export interface PortfolioUnpinnedTrace extends TraceBase {
  category: 'portfolio.unpinned';
  agentId: string;
  agentName: string;
  pinnedCount: number;
  summary: string;
}
