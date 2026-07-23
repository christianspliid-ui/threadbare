import type { SphereName } from './index';
import type { ReachDomain } from './traits';
import type { ValuePair } from './agent';
import type { ModifierResolutionTrace } from './modifiers';
import type { LapseReason } from './controlEffect';
import type { NarrativeLayer, StepOutcome, ActionScale, UnifiedActionOutcome } from './unifiedAction';
import type { OutcomeType } from './resolution';
import type { RarityTier } from './rarity';
import type {
  AttentionTier,
  EncounterPromotionTrace,
  CuratorDecisionTrace,
  AttentionPoolTrace,
  StoryBeatQueueTrace,
  ThreadStoryComposedTrace,
} from './attention';
import type { CourtPosition } from './influence';
import type { BeatKind, BeatTrigger } from './ascendantBeat';
import type { BehaviorFamily, StrategicVerb, StrategicExecutionMode } from './strategicAction';
import type { ComplicationSeverity } from './complication';
import type { SyllableTemplate } from './culture';
import type { ReliabilityBand } from '../engine/intelligence';
import type { MotiveReceipt } from './foreshadowing';
import type { IntelligenceCategory } from './unifiedAction';
import type { NarrativeEventType, NarrativeTier } from './narrative';
import type { ForeshadowingSignals } from './foreshadowing';
import type {
  FactionStirDissentTrace,
  FactionSuccessionTrace,
  FactionAnointSuccessorTrace,
  FactionWhisperLeaderTrace,
  FactionRecoverDoctrineTrace,
  FactionSurfaceDoubterTrace,
  FactionKindleCallingTrace,
  SchismPlantedTrace,
  SchismResolvedTrace,
  FactionReformedTrace,
} from './factionAction';

/** Known trace categories for filtering in debug panel */
export type TraceCategory =
  | 'action_selection' | 'narrative_generation' | 'context_harvest'
  | 'dilemma_resolution' | 'tick_summary' | 'encounter_resolution'
  | 'encounter_step_prose_recorded'
  | 'surface_fragments_bound'
  | 'familiarity_change' | 'movement' | 'intervention_effect'
  | 'action_execution' | 'modifier_resolution'
  | 'prosperity_tick' | 'wealth_delta' | 'econ_shock_seeded'
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
  | 'personality_trait_emerged'
  | 'personality_origin_seeded'
  | 'core_personality'
  | 'reaction_selected'
  | 'player_receipt'
  | 'rarity_graduation'
  | 'rarity_importance'
  | 'divine_proximity_phase'
  | 'divine_proximity_accumulation'
  | 'prose_rarity_bias'
  | 'encounter_promotion'
  | 'curator_decision'
  | 'attention_pool'
  | 'story_beat_queue'
  | 'thread_story_composed'
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
  | 'cli_auto_aftermath'
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
  | 'portfolio.unpinned'
  // Ruins layer traces (THR-149)
  | 'ruins.clue_discovered'
  | 'ruins.clue_consumed'
  | 'ruins.clue_decayed'
  | 'ruins.delve_admitted'
  | 'ruins.delve_blocked'
  | 'ruins.delve_beat'
  | 'ruins.delve_emergence'
  | 'ruins.delve_consequence'
  | 'ruins.ruin_transformed'
  | 'ruins.pop_stream'
  | 'ruins.pop_holder_changed'
  | 'ruins.pop_stream_decayed'
  | 'ruins.divine_mark_composed'
  | 'ruins.divine_mark_discovered'
  | 'ruins.clue_suppressed_no_eligible_recipient'
  | 'ruins.clue_receiver_selected'
  | 'ruins.density_seeded'
  // Ruins layer — delve variant traces (THR-152)
  | 'ruins.delve_start'
  | 'ruins.delve_tick'
  | 'ruins.delve_success'
  | 'ruins.delve_partial'
  | 'ruins.delve_fail'
  | 'ruins.delve_aborted'
  | 'ruins.schema_drift'
  // Ruins layer — transformation traces (THR-153)
  | 'ruins.elder_essence_awarded'
  | 'ruins.emergence_orphaned'
  // Ruins layer — quest hook traces (THR-156)
  | 'ruins.quest_hook_issued'
  | 'ruins.quest_hook_suppressed'
  // Siege attention tier traces (THR-18)
  | 'siege_spotlight_fired'
  | 'siege_regional_seeded'
  // Ambient agent phase profiling (THR-186)
  | 'tick_phase_profile'
  // Encounter cache rebuild tracking (THR-187)
  | 'encounter_cache_rebuild'
  // Tick-loop observability (THR-580)
  | 'tick_profile'
  | 'distance_matrix_rebuild'
  // Hex→actor index unresolved actors warning (THR-188)
  | 'engine_warning'
  // Effect shells (THR-53)
  | 'effect_shell'
  // Encounter foreshadowing traces (THR-389)
  | 'foreshadowing'
  // Composition phase runner (THR-225)
  | 'composition.phase_activated'
  | 'composition.failed'
  | 'composition.phase_eval_failed'
  // Composition dual-voice story-beat wiring (THR-254)
  | 'composition.story_beat_template_missing'
  // Encounter Experience traces (THR-339 wiring; emitters in Phase B modules)
  | 'choice_resolved'
  | 'forecast_computed'
  | 'hand_filtered'
  | 'drift_threshold_crossed'
  | 'axiological_mark_applied'
  | 'detection_threshold_crossed'
  | 'item_consumed_by_choice'
  | 'spotlight_changed'
  | 'callback_eligibility_computed'
  // Ascendant self-action effects (THR-399)
  | 'self_action'
  // Ascendant buff consumption (THR-416)
  | 'buff_consumed'
  // Location action expansion (THR-401)
  | 'location_action_resolved'
  | 'location_property_decay'
  | 'location_countdown_expired'
  | 'location_flag_consumed'
  // Faction governance verbs (THR-400)
  | 'faction_stir_dissent'
  | 'faction_whisper_leader'
  | 'faction_recover_doctrine'
  | 'faction_surface_doubter'
  // Schism — deferred faction-split divine action (THR-430)
  | 'schism_planted'
  | 'schism_resolved'
  | 'faction_reformed'
  // Faction succession (THR-432)
  | 'faction_succession'
  | 'faction_anoint_successor'
  // Faction internal-pressure resolver (THR-433)
  | 'faction_kindle_calling'
  // Survey people-layer prose composer (THR-415)
  | 'survey_prose_composed'
  // Mentor/apprentice lifecycle (THR-75)
  | 'mentorship_offered'
  | 'mentorship_started'
  | 'mentorship_lesson'
  | 'mentorship_graduated'
  | 'mentorship_surpassed'
  | 'mentorship_severed'
  // KPI harness (THR-457)
  | 'kpi'
  // Branching encounter curator boost (THR-452)
  | 'branching_curator_nudge'
  // Resolution input telemetry (THR-451)
  | 'resolution.input'
  // Doom identity milestone crossing (THR-293)
  | 'doom_milestone'
  // Outcome band prose selection (THR-460)
  | 'outcome_band_prose_selected'
  // Cool-failure story-artifact guarantee (THR-571 C1)
  | 'outcome_story_artifact'
  // Interaction-gated camera centering (THR-463)
  | 'camera_center'
  // Aspect apex milestone (THR-479)
  | 'aspect_attained'
  | 'aspect_echoed'
  // Ascendant Beats — Divine Cadence (THR-500)
  | 'ascendant.beat.scheduled'
  | 'ascendant.beat.offered'
  | 'ascendant.beat.skipped'
  | 'ascendant.beat.resolved'
  | 'ascendant.beat.seeded'
  | 'action.unlock.granted'
  // Ascendant expression cards (THR-508)
  | 'ascendant_expression'
  // Ascendant action primitives (THR-509) + chosen-faction consumer (THR-513)
  | 'ascendant_primitive'
  | 'chosen_faction_power'
  // Reach signature: Iron / Warhost (THR-550)
  | 'ascendant.signature.warhost'
  // Reach signature: Veil / Rend the Gate (THR-551)
  | 'ascendant.signature.rift'
  | 'ascendant.signature.rift_leak'
  // Reach signature: Stone / The Great Work (THR-552)
  | 'ascendant.signature.unique_location'
  // Encounter chapter archive (THR-603)
  | 'encounter.chapter_archived'
  // Mortal economy — resource stock tiers (THR-615)
  | 'resource_stock_tier_change'
  // Mortal economy — trade cargo manifests (THR-616)
  | 'route_cargo_assigned'
  // Player action progression — god-side capability growth (THR-613)
  | 'ascendant.progression.practice'
  | 'ascendant.progression.tier_up'
  | 'ascendant.progression.deepening_enqueued'
  | 'ascendant.progression.milestone_enqueued'
  | 'ascendant.progression.control_release'
  // Notable agendas — living world (THR-630)
  | 'notable.agenda_launched'
  | 'notable.agenda_phase_advanced'
  | 'notable.agenda_countered'
  | 'notable.agenda_completed'
  | 'notable.roster_scan'
  // Route events — cargo manifests materialize encounters (THR-669)
  | 'route_event_scan'
  | 'route_event_seeded'
  // Economic power — monopoly resolution + sphere drift (THR-617)
  | 'monopoly_transition'
  | 'economic_power_scan'
  | 'scarcity_arc_phase'
  // Companies — the group layer (THR-74)
  | 'group_phase'
  | 'group_formed'
  | 'group_dissolved';

export const TRACE_CATEGORIES: TraceCategory[] = [
  'action_selection', 'narrative_generation', 'context_harvest',
  'dilemma_resolution', 'tick_summary', 'encounter_resolution',
  'encounter_step_prose_recorded',
  'surface_fragments_bound',
  'familiarity_change', 'movement', 'intervention_effect',
  'action_execution', 'modifier_resolution',
  'prosperity_tick', 'wealth_delta', 'econ_shock_seeded',
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
  'divine_proximity_phase',
  'divine_proximity_accumulation',
  'prose_rarity_bias',
  'encounter_promotion',
  'curator_decision',
  'attention_pool',
  'story_beat_queue',
  'thread_story_composed',
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
  // Mortal economy — resource stock tiers (THR-615)
  'resource_stock_tier_change',
  // Mortal economy — trade cargo manifests (THR-616)
  'route_cargo_assigned',
  // Fix: three TraceEntry members that were defined but missing from this array (THR-111)
  'graph_op_execution',
  'choice_set_player_resolved',
  'choice_set_player_dismissed',
  // New encounter aftermath traces (THR-111)
  'cli_auto_aftermath',
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
  // Ruins layer (PR 1 — THR-149)
  'ruins.clue_discovered',
  'ruins.clue_consumed',
  'ruins.clue_decayed',
  'ruins.delve_admitted',
  'ruins.delve_blocked',
  'ruins.delve_beat',
  'ruins.delve_emergence',
  'ruins.delve_consequence',
  'ruins.ruin_transformed',
  'ruins.pop_stream',
  'ruins.pop_holder_changed',
  'ruins.pop_stream_decayed',
  'ruins.divine_mark_composed',
  'ruins.divine_mark_discovered',
  'ruins.clue_suppressed_no_eligible_recipient',
  'ruins.clue_receiver_selected',
  'ruins.density_seeded',
  // Delve variant traces (THR-152)
  'ruins.delve_start',
  'ruins.delve_tick',
  'ruins.delve_success',
  'ruins.delve_partial',
  'ruins.delve_fail',
  'ruins.delve_aborted',
  'ruins.schema_drift',
  // Transformation traces (THR-153)
  'ruins.elder_essence_awarded',
  'ruins.emergence_orphaned',
  // Quest hook traces (THR-156)
  'ruins.quest_hook_issued',
  'ruins.quest_hook_suppressed',
  // Siege attention tier traces (THR-18)
  'siege_spotlight_fired',
  'siege_regional_seeded',
  // Ambient agent phase profiling (THR-186)
  'tick_phase_profile',
  // Encounter cache rebuild tracking (THR-187)
  'encounter_cache_rebuild',
  // Tick-loop observability (THR-580)
  'tick_profile',
  'distance_matrix_rebuild',
  // Hex→actor index unresolved actors warning (THR-188)
  'engine_warning',
  // Effect shells (THR-53)
  'effect_shell',
  // Encounter foreshadowing traces (THR-389)
  'foreshadowing',
  // Composition phase runner (THR-225)
  'composition.phase_activated',
  'composition.failed',
  'composition.phase_eval_failed',
  // Composition dual-voice story-beat wiring (THR-254)
  'composition.story_beat_template_missing',
  // Encounter Experience traces (THR-339)
  'choice_resolved',
  'forecast_computed',
  'hand_filtered',
  'drift_threshold_crossed',
  'axiological_mark_applied',
  'detection_threshold_crossed',
  'item_consumed_by_choice',
  'spotlight_changed',
  'callback_eligibility_computed',
  // Ascendant self-action effects (THR-399)
  'self_action',
  // Ascendant buff consumption (THR-416)
  'buff_consumed',
  // Location action expansion (THR-401)
  'location_action_resolved',
  'location_property_decay',
  'location_countdown_expired',
  'location_flag_consumed',
  // Faction governance verbs (THR-400)
  'faction_stir_dissent',
  'faction_whisper_leader',
  'faction_recover_doctrine',
  'faction_surface_doubter',
  // Schism — deferred faction-split divine action (THR-430)
  'schism_planted',
  'schism_resolved',
  'faction_reformed',
  // Faction succession (THR-432)
  'faction_succession',
  'faction_anoint_successor',
  // Faction internal-pressure resolver (THR-433)
  'faction_kindle_calling',
  // Survey people-layer prose composer (THR-415)
  'survey_prose_composed',
  // Mentor/apprentice lifecycle (THR-75)
  'mentorship_offered',
  'mentorship_started',
  'mentorship_lesson',
  'mentorship_graduated',
  'mentorship_surpassed',
  'mentorship_severed',
  // KPI harness (THR-457)
  'kpi',
  // Branching encounter curator boost (THR-452)
  'branching_curator_nudge',
  // Resolution input telemetry (THR-451)
  'resolution.input',
  // Doom identity milestone crossing (THR-293)
  'doom_milestone',
  // Outcome band prose selection (THR-460)
  'outcome_band_prose_selected',
  // Cool-failure story-artifact guarantee (THR-571 C1)
  'outcome_story_artifact',
  // Interaction-gated camera centering (THR-463)
  'camera_center',
  // Aspect apex milestone (THR-479)
  'aspect_attained',
  'aspect_echoed',
  // Ascendant Beats — Divine Cadence (THR-500)
  'ascendant.beat.scheduled',
  'ascendant.beat.offered',
  'ascendant.beat.skipped',
  'ascendant.beat.resolved',
  'ascendant.beat.seeded',
  'action.unlock.granted',
  // Ascendant expression cards (THR-508)
  'ascendant_expression',
  // Ascendant action primitives (THR-509) + chosen-faction consumer (THR-513)
  'ascendant_primitive',
  'chosen_faction_power',
  // Emergent personality traits (THR-527)
  'personality_trait_emerged',
  // Origin-vignette birth seeding of the personality baseline (THR-561)
  'personality_origin_seeded',
  // Core personality foundation layer (THR-542)
  'core_personality',
  // Autonomous in-encounter choice (THR-530)
  'reaction_selected',
  // Divine Receipt — player action resolution feedback (THR-727)
  'player_receipt',
  // Reach signature: Iron / Warhost (THR-550)
  'ascendant.signature.warhost',
  // Reach signature: Veil / Rend the Gate (THR-551)
  'ascendant.signature.rift',
  'ascendant.signature.rift_leak',
  // Reach signature: Stone / The Great Work (THR-552)
  'ascendant.signature.unique_location',
  // Encounter chapter archive (THR-603)
  'encounter.chapter_archived',
  // Player action progression — god-side capability growth (THR-613)
  'ascendant.progression.practice',
  'ascendant.progression.tier_up',
  'ascendant.progression.deepening_enqueued',
  'ascendant.progression.milestone_enqueued',
  'ascendant.progression.control_release',
  // Notable agendas — living world (THR-630)
  'notable.agenda_launched',
  'notable.agenda_phase_advanced',
  'notable.agenda_countered',
  'notable.agenda_completed',
  'notable.roster_scan',
  // Route events (THR-669)
  'route_event_scan',
  'route_event_seeded',
  // Economic power (THR-617)
  'monopoly_transition',
  'economic_power_scan',
  'scarcity_arc_phase',
  // Companies — the group layer (THR-74)
  'group_phase',
  'group_formed',
  'group_dissolved',
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
  /** THR-31: present when the template is faction-scoped */
  factionId?: string;
  /** THR-31: number of voice-bible lexicon hits (for voice lint debugging) */
  voiceLintHits?: number;
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

/**
 * Trace: a prosperity swing large enough to be a shock planted themed scene seeds (THR-725).
 *
 * Emitted once per shock event — never once per planted seed — so trace volume scales with
 * how often the economy lurches, not with settlement count. Cause-agnostic: divine verbs,
 * battle aftermath, and any future cause all arrive through the same prosperity-delta test,
 * which is why `cause` is a coarse label rather than an action id.
 */
export interface EconShockSeededTrace extends TraceBase {
  category: 'econ_shock_seeded';
  locationId: string;
  /** Signed prosperity swing that tripped ECON_SHOCK_DELTA, on the 0–100 scale. */
  delta: number;
  polarity: 'boom' | 'bust';
  /** Templates the seeds will spawn, one per planted seed. */
  templateIds: string[];
  seedIds: string[];
  /** Agents the seeds were planted on. */
  targetAgentIds: string[];
  /** Coarse origin of the swing: a direct property write vs. a queued ProsperityShock. */
  cause: 'direct_write' | 'prosperity_shock' | 'mixed';
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
  /** Templates hidden by the reach gate (THR-503). Optional — older traces omit it. */
  filteredByReach?: number;
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
    /** THR-531: amplified personality alignment (axiologicalScore × PERSONALITY_SELECTION_WEIGHT)
     * that drives the desire multiplier. Higher = encounter matches the agent's dominant axes. */
    personalityBias?: number;
    /** THR-531: raw signed axiological alignment over the encounter's motivation pairs (pre-weight). */
    axiologicalScore?: number;
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
    /** Doom identity + omen bias applied for this encounter type (THR-81) */
    identityBiasBonus?: number;
    /** Novelty pressure multiplier (1.0 = no pressure, <1.0 = penalized by recency/quota). THR-453 */
    noveltyMultiplier?: number;
    /** Surface key used for novelty/recency tracking (templateId + sorted context axes). THR-475 */
    surfaceKey?: string;
    /** Signed economic-context term from settlement boom/bust × template-family affinity (THR-725). 0 in the neutral band. */
    economicContextBonus?: number;
  }>;
  selectedTemplateId: string | null;
  selectedLocationId: string | null;
  /** Surface key of the selected encounter (undefined when idle). THR-475 */
  selectedSurfaceKey?: string | null;
  /** Axis values that produced the selected surface key, for Debug Panel inspectability. THR-475 */
  selectedSurfaceAxes?: Partial<Record<'reachPrimary' | 'socialRole' | 'sublocationTypeId', string>>;
  /** Novelty multiplier applied to the selected encounter. THR-475 */
  selectedNoveltyMultiplier?: number | null;
  action: 'start_local' | 'queue_movement' | 'attempt_remote' | 'idle';
  /** True when novelty pressure changed which template was selected vs the pre-novelty winner. THR-453 */
  noveltyChangedSelection?: boolean;
  /** Template ID that would have won without novelty pressure (only set when noveltyChangedSelection=true). THR-453 */
  preNoveltyWinnerId?: string | null;
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
  layers?: readonly NarrativeLayer[];  // all layers revealed in this cast (multi-layer reveals)
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

/**
 * Trace: a `__DEBUG.tick(n)` batch advanced the sim (THR-689).
 * Exactly one entry per call — never one per tick, which would evict most of a run's
 * real traces from the 2000-entry ring buffer.
 */
export interface DebugTickBatchTrace extends TraceBase {
  category: 'debug_tick_batch';
  /** Ticks asked for, before clamping to DEBUG_TICK_MAX. */
  requested: number;
  /** Ticks actually advanced. */
  ticksRun: number;
  /** True when `requested` exceeded DEBUG_TICK_MAX. */
  capped: boolean;
  stoppedReason: 'completed' | 'capped' | 'phase_left_playing' | 'error';
  durationMs: number;
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

/** Trace: divine proximity phase summary emitted once per tick. */
export interface DivineProximityPhaseTrace extends TraceBase {
  category: 'divine_proximity_phase';
  ascendantCount: number;
  scanCount: number;
  accumulatedCount: number;
  skippedAscendantCount: number;
}

/** Trace: per-node divine proximity accumulation (capped per tick). */
export interface DivineProximityAccumulationTrace extends TraceBase {
  category: 'divine_proximity_accumulation';
  ascendantId: string;
  nodeId: string;
  nodeName: string;
  hexDistance: number;
  delta: number;
  newImportance: number;
  currentTier: RarityTier;
}

/** Trace: rarity floor elevated narrative tier classification */
export interface ProseRarityBiasTrace extends TraceBase {
  category: 'prose_rarity_bias';
  eventType: NarrativeEventType;
  subjectId?: string;
  rarityTier: number;
  baseTier: NarrativeTier;
  biasedTier: NarrativeTier;
  tags: string[];
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

/** Trace: headless aftermath reaction pick from CLI/debug bridge tooling. */
export interface CliAutoAftermathTrace extends TraceBase {
  category: 'cli_auto_aftermath';
  encounterId: string;
  actionId: string;
  reactionId: string;
  source: 'cli' | 'debug-bridge';
}

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
    | 'reputation_set' | 'apply_condition' | 'remove_condition' | 'condition_attachment'
    | 'grant_aspect' | 'signature_warhost';
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
  /** THR-31: present for faction-sourced seeds */
  sourceFactionId?: string;
  /** THR-31: human-readable cause, e.g. "betrayal follow-up" */
  reason?: string;
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
  /** THR-31: present for faction-sourced marks */
  sourceFactionId?: string;
}

/**
 * Trace: THR-571 C1 — a failure-band resolution left (or was guaranteed) a story artifact.
 * Emitted once per resolved failure/critical_failure action by the cool-failure post-pass.
 * `artifactKind` is the concrete persistence kind: an already-present complication/seed/mark,
 * or the fallback hidden mark the post-pass planted. `'none'` only appears on the fail-soft
 * path (artifact placement threw) — the failure still resolved, but left nothing.
 */
export interface OutcomeStoryArtifactTrace extends TraceBase {
  category: 'outcome_story_artifact';
  actionId: string;
  actorId: string;
  outcome: UnifiedActionOutcome;
  /** Whether the artifact was already present or planted as the guaranteed fallback. */
  source: 'existing' | 'fallback';
  artifactKind: 'complication' | 'seed' | 'mark' | 'none';
  /** Reference to the concrete artifact (markId, complication templateId, seed hook id). */
  refId?: string;
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
  referencedBy: 'scoring_boost' | 'prose_enrichment' | 'resolution_match' | 'difficulty_modifier' | 'aftermath_prose';
  /** Optional: templateId of the encounter involved (scoring / resolution / aftermath_prose). */
  templateId?: string;
  /** Optional: intelligence category (prose_enrichment / aftermath_prose). */
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

/** Trace: a `$target` / `$cast:` / `role:` aftermath sentinel rebound (THR-695, Slice B). */
export interface AftermathSentinelBoundTrace extends TraceBase {
  category: 'aftermath_sentinel_bound';
  actionId: string;
  effectKind: string;
  /** The effect field the sentinel appeared on (e.g. 'targetAgentId', 'withAgentId'). */
  field: string;
  /** '$target' | '$cast:<key>' | 'role:<key>' */
  sentinel: string;
  /** Resolved node id, or null when the sentinel could not be bound (effect will no-op). */
  resolvedNodeId: string | null;
}

/** Trace: a `bond_change` aftermath effect applied a sentiment/trust mutation (THR-695, Slice B). */
export interface BondChangeAppliedTrace extends TraceBase {
  category: 'bond_change_applied';
  actorId: string;
  withAgentId: string;
  sentimentBefore: number;
  sentimentAfter: number;
  created: boolean;
  reciprocal: boolean;
}

/** Trace: a family-only encounter seed resolved to a concrete template (THR-697, Slice D). */
export interface SeedFamilyMatchedTrace extends TraceBase {
  category: 'encounter_seed_family_matched';
  seedId: string;
  family: string;
  /** Number of eligible templates in the draw pool (after affinity + location filters). */
  candidateCount: number;
  resolvedTemplateId: string;
}

/** Trace: inherited scene context attached to a seeded encounter at spawn (THR-697, Slice D). */
export interface SeedContextInheritedTrace extends TraceBase {
  category: 'seed_context_inherited';
  seedId: string;
  /** Inherited target that survived graph re-validation, or null (fell back to self-target). */
  inheritedTargetId: string | null;
  /** Bindings that survived graph re-validation. */
  bindingCount: number;
  /** Bindings dropped because their node was gone at spawn. */
  droppedBindingCount: number;
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

/** Trace: encounter foreshadowing variant resolution + cache status (THR-389). */
export interface ForeshadowingTrace extends TraceBase {
  category: 'foreshadowing';
  agentId: string;
  encounterId: string;
  variantsConsidered: string[];
  variantPicked: string | null;
  signals: ForeshadowingSignals;
  interventionAttributionId: string | null;
  cacheHit: boolean;
}

/** Discriminated union of all trace types */
/**
 * Trace: an emergent personality trait crystallized (grant) or dissolved (release)
 * at the hysteresis thresholds (THR-527). `details` carries the axis id, pole word,
 * grant/release kind, live position, and the underlying ±1 profile value.
 */
export interface PersonalityTraitEmergedTrace extends TraceBase {
  category: 'personality_trait_emerged';
  actorId?: string;
  details?: Record<string, unknown>;
}

/**
 * Trace: an event in the **Core** personality foundation layer (THR-542). One
 * category covers all three Core mechanics, discriminated by `details.kind`:
 *
 *  - `seeded`    — a fresh Core baseline was drawn for an agent at birth.
 *  - `emerge` / `fade` — a continuum crossed (or fell back inside) an emergence
 *                  threshold (hysteresis), `details.continuumId` + `side` + `position`.
 *  - `bend`      — under low Quintessence, the Core nudged a coupled reach axis;
 *                  `details.reach` + `continuumId` + `nudge` + `quintessenceNorm`.
 *  - `unknown_continuum` — fail-soft: a stored Core value referenced no known
 *                  continuum and was skipped.
 *
 * The Core is character (who the agent is), kept distinct from the Quintessence
 * scalar (how bendable they are) — see `coreRegistry.ts` canon-safe framing.
 */
export interface CorePersonalityTrace extends TraceBase {
  category: 'core_personality';
  actorId?: string;
  details?: Record<string, unknown>;
}

/**
 * Trace: the origin-vignette birth-seeding pass drew pre-history vignettes and laid
 * their signed axis contributions onto agents' personality **baselines** (THR-561).
 *
 * Emitted as ONE aggregate entry per tick (never one-per-agent) — the bulk tick-1
 * seeding touches every mortal at once and a per-agent burst would wrap the 2000-entry
 * trace ring buffer (the buffer-overflow flakiness class — see `Docs/impediments.md`).
 * Per-agent provenance stays inspectable on `node.properties.originVignettes`.
 *
 * `details.kind` discriminates:
 *  - `seeded`        — `count` agents seeded this tick, `vignettesApplied` total draws.
 *  - `unknown_axis`  — fail-soft: `count` vignette contributions referenced an axis id
 *                      absent from the registry and were skipped.
 */
export interface PersonalityOriginSeededTrace extends TraceBase {
  category: 'personality_origin_seeded';
  actorId?: string;
  details?: Record<string, unknown>;
}

/**
 * Trace: a permanent formative mark moved an agent's moral **baseline** on one axis
 * (THR-529). Unlike `drift_threshold_crossed` (a held temporary drift band), this records
 * a permanent shift to the standing `AxiologicalProfile` value. Fields capture the reach,
 * the legacy ValuePair key mutated, the (clamped) signed magnitude, and the before/after
 * baseline on the ±1 axis scale.
 */
export interface AxiologicalMarkAppliedTrace extends TraceBase {
  category: 'axiological_mark_applied';
  agentId?: string;
  /** Reach whose axis was marked (e.g. 'iron'). */
  reach: string;
  /** Legacy `AxiologicalProfile` ValuePair storage key mutated (e.g. 'mercy_ruthlessness'). */
  valuePair: string;
  /** Signed magnitude actually applied after clamping to ±FORMATIVE_MARK_MAX_MAGNITUDE. */
  signedMagnitude: number;
  /** Baseline before the mark, on the ±1 axis scale. */
  previousBaseline: number;
  /** Baseline after the mark, clamped to [−1, +1]. */
  newBaseline: number;
  encounterId?: string;
  reactionId?: string;
}

/**
 * Context-fragment bindings for one encounter instantiation (THR-573).
 *
 * Emitted **once per encounter instantiation** that resolves ≥1 fragment slot — never
 * per step render and never per agent-tick, which would flood the ring buffer.
 * `surfaceKey` ties the prose identity back to the selection identity, so a trace reader
 * can confirm the scene the player read matches the surface the scorer picked.
 */
export interface SurfaceFragmentsBoundTrace extends TraceBase {
  category: 'surface_fragments_bound';
  templateId: string;
  surfaceKey: string;
  bindings: ReadonlyArray<{
    slot: string;
    axis: string;
    value: string;
    usedDefault: boolean;
  }>;
}

export type TraceEntry =
  | SurfaceFragmentsBoundTrace
  | PersonalityTraitEmergedTrace
  | PersonalityOriginSeededTrace
  | CorePersonalityTrace
  | AxiologicalMarkAppliedTrace
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
  | EconShockSeededTrace
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
  | DebugTickBatchTrace
  | RevelationTrace
  | InteractionDepthTrace
  | ReputationTraitTrace
  | GraphOpExecutionTrace
  | RarityGraduationTrace
  | RarityImportanceTrace
  | DivineProximityPhaseTrace
  | DivineProximityAccumulationTrace
  | ProseRarityBiasTrace
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
  | CliAutoAftermathTrace
  | EncounterAftermathAppliedTrace
  | EncounterAftermathEffectTrace
  | EncounterSeedPlantedTrace
  | EncounterSeedTriggeredTrace
  | HiddenMarkPlacedTrace
  | HiddenMarkRevealedTrace
  // Cool-failure story-artifact guarantee (THR-571 C1)
  | OutcomeStoryArtifactTrace
  | IntelligenceGrantedTrace
  | IntelligenceReferencedTrace
  | IntelligenceDecayedTrace
  | AuthoredAttachmentCreatedTrace
  // Complication outcome traces (THR-20)
  | ComplicationSelectionTrace
  // Encounter foreshadowing traces (THR-389)
  | ForeshadowingTrace
  // Multi-target aftermath traces (THR-114)
  | AftermathTargetResolvedTrace
  | FactionReputationChangedTrace
  | ReputationSetAppliedTrace
  | ConditionAppliedTrace
  | ConditionRemovedTrace
  | AftermathTargetInvalidTrace
  // Scene-targeting aftermath sentinels + bond_change (THR-695, Slice B)
  | AftermathSentinelBoundTrace
  | BondChangeAppliedTrace
  // Seed system v2: family matching + context inheritance (THR-697, Slice D)
  | SeedFamilyMatchedTrace
  | SeedContextInheritedTrace
  // Initiative traces (THR-51)
  | InitiativeStartedTrace
  | InitiativeCheckpointTrace
  | InitiativeCompletedTrace
  | InitiativeFailedTrace
  // Portfolio-pinning traces (THR-148)
  | PortfolioPinnedTrace
  | PortfolioUnpinnedTrace
  // Siege attention tier traces (THR-18)
  | SiegeSpotlightFiredTrace
  | SiegeRegionalSeededTrace
  // Ambient agent phase profiling (THR-186)
  | TickPhaseProfileTrace
  // Encounter cache rebuild tracking (THR-187)
  | EncounterCacheRebuildTrace
  // Tick-loop observability (THR-580)
  | TickProfileTrace
  | DistanceMatrixRebuildTrace
  // Hex→actor index engine warning (THR-188)
  | EngineWarningTrace
  // Effect shell traces (THR-53)
  | EffectShellFlipRevealedTrace
  | EffectShellGateTransitionTrace
  | EffectShellBandSelectedTrace
  | EffectShellDuplicatePolicyAppliedTrace
  // Composition phase runner traces (THR-225)
  | CompositionPhaseActivatedTrace
  | CompositionFailedTrace
  | CompositionPhaseEvalFailedTrace
  // Rival scheme traces (THR-66)
  | RivalSchemeLaunchedTrace
  | RivalSchemePhaseAdvancedTrace
  | RivalSchemeCounteredTrace
  | RivalSchemeCompletedTrace
  // Notable agenda traces (THR-630)
  | NotableAgendaLaunchedTrace
  | NotableAgendaPhaseAdvancedTrace
  | NotableAgendaCounteredTrace
  | NotableAgendaCompletedTrace
  | NotableRosterScanTrace
  // Route event traces (THR-669)
  | RouteEventScanTrace
  | RouteEventSeededTrace
  // Economic power traces (THR-617)
  | MonopolyTransitionTrace
  | EconomicPowerScanTrace
  | ScarcityArcPhaseTrace
  // Company traces (THR-74)
  | GroupPhaseTrace
  | GroupFormedTrace
  | GroupDissolvedTrace
  // Composition dual-voice story-beat wiring (THR-254)
  | CompositionStoryBeatTemplateMissingTrace
  // Encounter foreshadowing (THR-389)
  | ForeshadowingResolutionTrace
  // Ascendant buff consumption (THR-416)
  | BuffConsumedTrace
  // Faction governance verbs (THR-400)
  | FactionStirDissentTrace
  | FactionWhisperLeaderTrace
  | FactionRecoverDoctrineTrace
  | FactionSurfaceDoubterTrace
  // Schism — deferred faction-split divine action (THR-430)
  | SchismPlantedTrace
  | SchismResolvedTrace
  | FactionReformedTrace
  // Faction succession (THR-432)
  | FactionSuccessionTrace
  | FactionAnointSuccessorTrace
  // Faction internal-pressure resolver (THR-433)
  | FactionKindleCallingTrace
  // Branching encounter curator nudge (THR-452)
  | BranchingCuratorNudgeTrace
  // Resolution input telemetry (THR-451)
  | ResolutionInputTrace
  // Story-so-far digest (THR-455)
  | ThreadStoryComposedTrace
  // Event feed hygiene (THR-456)
  | ChronicleAggregatedTrace
  | NamingConstrainedRejectTrace
  | NamingFatalFallbackTrace
  | ProseRepetitionSkipTrace
  | ChronicleAggregateFailedTrace
  // Doom identity milestone (THR-293)
  | MilestoneTriggeredTrace
  // Outcome band prose selection (THR-460)
  | OutcomeBandProseSelectedTrace
  // Interaction-gated camera centering (THR-463)
  | CameraCenterTrace
  // Aspect apex milestone (THR-479)
  | AspectAttainedTrace
  | AspectEchoedTrace
  // Ascendant Beats — Divine Cadence (THR-500)
  | BeatScheduledTrace
  | BeatOfferedTrace
  | BeatSkippedTrace
  | BeatResolvedTrace
  | BeatSeededTrace
  | ActionUnlockGrantedTrace
  // Encounter chapter archive (THR-603)
  | ChapterArchivedTrace
  // Mortal economy — resource stock tiers (THR-615)
  | ResourceStockTierChangeTrace
  // Mortal economy — trade cargo manifests (THR-616)
  | RouteCargoAssignedTrace
  // Player action progression — god-side capability growth (THR-613)
  | PlayerPracticeTrace
  | PlayerTierUpTrace
  | DeepeningEnqueueTrace
  | MilestoneEnqueueTrace
  | ControlReleaseTrace
  // Divine Receipt — player action resolution feedback (THR-727)
  | PlayerReceiptTrace;

/**
 * Trace: a Divine Receipt was enqueued, acknowledged, a reaction applied, the queue
 * capped, or a fallback receipt built (THR-727). Player-scale (a handful per session),
 * so one trace per event — no aggregate batching (that rule is for all-agents phases).
 */
export interface PlayerReceiptTrace extends TraceBase {
  category: 'player_receipt';
  event: 'enqueued' | 'acknowledged' | 'reaction_applied' | 'queue_capped' | 'fallback_receipt';
  actionId: string;
  templateId: string;
  presentation: 'modal' | 'toast';
  band?: string;
  changeCount: number;
  /** Only present on `reaction_applied`. */
  reactionId?: string;
}

/** Trace: a location's resource crossed a stock tier boundary. THR-615 */
export interface ResourceStockTierChangeTrace extends TraceBase {
  category: 'resource_stock_tier_change';
  locationId: string;
  resourceId: string;
  /** Previous tier, or 'unset' on the first derivation for this resource. */
  fromTier: 'scarce' | 'adequate' | 'surplus' | 'unset';
  toTier: 'scarce' | 'adequate' | 'surplus';
  /** Normalized supply − demand balance that produced the new tier. */
  balance: number;
  /** Whether a threaded agent's home location produced a livelihood tug. */
  emittedTug: boolean;
}

/** Trace: a trade route was assigned (or refreshed) a cargo manifest. THR-616 */
export interface RouteCargoAssignedTrace extends TraceBase {
  category: 'route_cargo_assigned';
  /** The trades_with edge id. */
  edgeId: string;
  /** Endpoint node ids. */
  sourceId: string;
  targetId: string;
  /** Resource ids carried, highest value first. */
  goods: string[];
  /** Summed base value of the carried goods (route richness). */
  totalValue: number;
  /** Whether the manifest carries a staple. */
  carriesStaple: boolean;
}

/** Trace: a resolved encounter was distilled into a persistent Chapter Record. THR-603 */
export interface ChapterArchivedTrace extends TraceBase {
  category: 'encounter.chapter_archived';
  actionId: string;
  templateId: string;
  outcome: string; // UnifiedActionOutcome
  /** Whether the actor was threaded at resolution time. */
  threaded: boolean;
  /** Post-append archive size — surfaces eviction pressure (inspectability). */
  archiveSize: number;
}

/** Trace: the Director scheduled an ascendant beat to offer this turn. THR-500 */
export interface BeatScheduledTrace extends TraceBase {
  category: 'ascendant.beat.scheduled';
  turn: number;
  beatId: string;
  kind: BeatKind;
  trigger: BeatTrigger;
  poolSize: number;
  /**
   * Source `UnifiedActionTemplate` id the beat resolves into, when the beat
   * declares one. For `delivery` beats this is the wrapped branching-encounter
   * id (THR-506) — the trace then names the otherwise-unreachable content a
   * divine vision is hosting. Absent for beats with no bound template. */
  templateId?: string;
}

/** Trace: an ascendant beat was offered to the player. THR-500 */
export interface BeatOfferedTrace extends TraceBase {
  category: 'ascendant.beat.offered';
  turn: number;
  beatId: string;
  boundNodeIds: string[];
  /** Source template id (delivery beats: the wrapped branching encounter). THR-506 */
  templateId?: string;
}

/**
 * Trace: a beat was declined this turn — either the Director chose not to offer one
 * (`pending` / `cadence` / `empty_pool`), or the resolve path cleared a pending beat
 * whose definition/template could not be resolved (`missing_template`, THR-517).
 */
export interface BeatSkippedTrace extends TraceBase {
  category: 'ascendant.beat.skipped';
  turn: number;
  reason: 'pending' | 'cadence' | 'empty_pool' | 'missing_template';
  beatId?: string;
}

/** Trace: a pending ascendant beat resolved. THR-500 */
export interface BeatResolvedTrace extends TraceBase {
  category: 'ascendant.beat.resolved';
  turn: number;
  beatId: string;
  outcome: string;
  grantedActionIds: string[];
  seededNodeIds: string[];
}

/**
 * Trace: a spine beat seeded graph state on resolution (THR-520, plan §4.1). One
 * trace per seeding beat records what was minted/mutated — the `add_node`/`add_edge`
 * surface for the throne/artifact the onboarding promises. `failSoft` names the reason
 * a seed no-opped (e.g. no location to seat, no ascendant sphere) so a soft skip is
 * inspectable rather than silent.
 */
export interface BeatSeededTrace extends TraceBase {
  category: 'ascendant.beat.seeded';
  turn: number;
  beatId: string;
  /** The seed variant that ran (`home_seat` | `threaded_artifact`). */
  seed: string;
  /** Node ids created or designated by this seed (the throne location, the new artifact). */
  seededNodeIds: string[];
  /** Edge ids created by this seed (`thread` / `possesses` / `controls`). */
  seededEdgeIds: string[];
  /** Set when the seed soft-skipped; absent on success. */
  failSoft?: string;
}

/** Trace: an action was unlocked into the run-scoped unlock set. THR-500 */
export interface ActionUnlockGrantedTrace extends TraceBase {
  category: 'action.unlock.granted';
  turn: number;
  actionId: string;
  via: 'beat' | 'debug';
}

/**
 * Trace: the ascendant accrued reach practice from resolving an in-domain action
 * (THR-613, plan §3.1). `total` is the post-accrual `reachPractice[reach]` — the
 * additive raw-score term feeding Domain Capability. `delta` is this action's gain.
 */
export interface PlayerPracticeTrace extends TraceBase {
  category: 'ascendant.progression.practice';
  turn: number;
  reach: ReachDomain;
  delta: number;
  total: number;
}

/**
 * Trace: the ascendant's derived Domain Capability tier in a reach rose (THR-613,
 * plan §3.2). Emitted once per tier step when the progression phase advances the
 * snapshot and enqueues the matching Deepening beat.
 */
export interface PlayerTierUpTrace extends TraceBase {
  category: 'ascendant.progression.tier_up';
  turn: number;
  reach: ReachDomain;
  fromTier: number;
  toTier: number;
}

/**
 * Trace: a Deepening beat was enqueued (set `pending`) before the Beat Director ran,
 * preempting the cadence draw for that turn (THR-613, plan §3.2).
 */
export interface DeepeningEnqueueTrace extends TraceBase {
  category: 'ascendant.progression.deepening_enqueued';
  turn: number;
  reach: ReachDomain;
  beatId: string;
}

/**
 * Trace: a Milestone (breadth) beat was enqueued because the god's holdings crossed a
 * named threshold (THR-613, plan §4.2). Carries the counts that fired it so the
 * inspector can see *why* without re-deriving them — `sourceCount` / `floweringCount`
 * are the essence-source reads at enqueue time.
 */
export interface MilestoneEnqueueTrace extends TraceBase {
  category: 'ascendant.progression.milestone_enqueued';
  turn: number;
  beatId: string;
  sourceCount: number;
  floweringCount: number;
}

/**
 * Trace: a sustained control was released from the Covenants panel (THR-613, plan
 * §3.4). Declared with the progression trace family; emitted by the `release_control`
 * op in Slice 4.
 */
export interface ControlReleaseTrace extends TraceBase {
  category: 'ascendant.progression.control_release';
  turn: number;
  controlId: string;
  contested: boolean;
}

/** Trace: a mortal became an Aspect of the god (apex milestone grant). THR-479 */
export interface AspectAttainedTrace extends TraceBase {
  category: 'aspect_attained';
  ascendantId: string;
  mortalId: string;
  originEncounterId: string;
  sourceTier: number;
}

/** Trace: an Aspect's mortal body died — the bond persists as mythic echo. THR-479 */
export interface AspectEchoedTrace extends TraceBase {
  category: 'aspect_echoed';
  ascendantId: string;
  mortalId: string;
}

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

// ─── Siege Attention Tier Traces (THR-18) ────────────────────────────

/** Trace: siege spotlight fired — tier context for attention pipeline */
export interface SiegeSpotlightFiredTrace extends TraceBase {
  category: 'siege_spotlight_fired';
  siegeId: string;
  templateId: string;
  intrinsicTier: AttentionTier;
  effectiveTier: AttentionTier;
  courtPositionUsed: CourtPosition;
  bondedActorId: string | null;
}

/** Trace: siege regional encounter seeded for a nearby actor */
export interface SiegeRegionalSeededTrace extends TraceBase {
  category: 'siege_regional_seeded';
  siegeId: string;
  templateId: string;
  actorId: string;
  intrinsicTier: AttentionTier;
  effectiveTier: AttentionTier;
  triggerType: 'allied_defender' | 'allied_attacker' | 'shadow' | 'heart' | 'sabotage';
}

/**
 * Trace: per-tick aggregate profile.
 *
 * Originally introduced for O(N_all) phase optimizations (THR-186): emitted by
 * `effect_tick` / `familiarity_gain` / `mastery_decay` with actor-counter payloads.
 * Widened by THR-238 to also serve as the registry's per-phase profile trace —
 * registered phases emit `phase: <id>` with `durationMs` + `eventDelta`. The
 * actor-counter fields remain optional so legacy emitters keep their existing payload.
 */
export interface TickPhaseProfileTrace extends TraceBase {
  category: 'tick_phase_profile';
  /** Free-form phase id. Legacy values: 'effect_tick' | 'familiarity_gain' | 'mastery_decay'. */
  phase: string;
  // ── Legacy actor-counter payload (THR-186 emitters) ───────────────────────
  totalActors?: number;
  processedActors?: number;
  skippedActors?: number;
  // ── Registry payload (THR-238 emitters) ───────────────────────────────────
  /** Wall-clock duration of `phase.run` in milliseconds. */
  durationMs?: number;
  /** Number of `tickEvents` added by this phase. */
  eventDelta?: number;
}

/** Trace: encounter cache rebuilt from scratch (THR-187) */
export interface EncounterCacheRebuildTrace extends TraceBase {
  category: 'encounter_cache_rebuild';
  reason: 'initial' | 'structural_invalidation' | 'fallback_after_failed_update';
  locationCount: number;
  totalRebuildsThisSession: number;
  durationMs?: number;
}

/**
 * Trace: the distance matrix was rebuilt from scratch (THR-580).
 *
 * Mirrors `encounter_cache_rebuild` for the previously-dark distance matrix.
 * `buildDistanceMatrix` is O(L·(L+E)) BFS-per-location; if this fires most ticks
 * past the stall point, the driver is `structuralCacheVersion` over-invalidation
 * (see the load-bearing decision on structuralCacheVersion), not raw agent count.
 * Routes to the dedicated timing ring (profiling-gated), not the shared buffer.
 */
export interface DistanceMatrixRebuildTrace extends TraceBase {
  category: 'distance_matrix_rebuild';
  locationCount: number;
  totalRebuildsThisSession: number;
  durationMs?: number;
}

/**
 * Trace: per-tick rollup summarizing the whole `runTick` (THR-580).
 *
 * The "which tick got slow and why" record. Emitted once at the end of `runTick`
 * when profiling is enabled; routes to the dedicated timing ring. `slowestPhase`
 * is computed from the `tick_phase_profile` traces collected this tick.
 */
export interface TickProfileTrace extends TraceBase {
  category: 'tick_profile';
  /** Wall-clock for the whole runTick body, in milliseconds. */
  totalMs: number;
  /** Phases timed this tick (registered + inline). */
  phaseCount: number;
  /** Phase id with the maximum `durationMs` this tick. */
  slowestPhase: string;
  slowestPhaseMs: number;
  /** Actor-node count from the graph — the stall's independent variable. */
  agentCount: number;
  /** True if the encounter cache rebuilt this tick. */
  encounterCacheRebuilt: boolean;
  /** True if the distance matrix rebuilt this tick. */
  distanceMatrixRebuilt: boolean;
}

/** Trace: hex→actor index found actors whose location could not be resolved (THR-188). Rate-limited to once per session. */
export interface EngineWarningTrace extends TraceBase {
  category: 'engine_warning';
  source: 'hex_actor_index';
  unresolvedCount: number;
}

// ═══════════════════════════════════════════════════════════════════
// Effect Shell Traces (THR-53)
// ═══════════════════════════════════════════════════════════════════

import type {
  FlipTableState,
  DuplicateGainPolicy,
  ResultBandConfig,
} from './contentShells';
import type { ClearanceGateState } from './contentShells';

/** Trace: flip_table variant revealed */
export interface EffectShellFlipRevealedTrace extends TraceBase {
  category: 'effect_shell';
  subkind: 'flip_revealed';
  actorId: string;
  runtimeId: string;
  templateId: string;
  flipId: string;
  variantKey: string;
  previousState: FlipTableState;
  nextState: FlipTableState;
}

/** Trace: clearance_gate state transitioned */
export interface EffectShellGateTransitionTrace extends TraceBase {
  category: 'effect_shell';
  subkind: 'gate_transition';
  actorId: string;
  runtimeId: string;
  previousState: ClearanceGateState;
  nextState: ClearanceGateState;
  revealedSignals: readonly string[];
  followOnTagsAdded: readonly string[];
}

/** Trace: result band selected for an action resolution */
export interface EffectShellBandSelectedTrace extends TraceBase {
  category: 'effect_shell';
  subkind: 'band_selected';
  actorId: string;
  templateId: string;
  margin: number;
  selectedBandId: string;
  selectedOutcomeBand: ResultBandConfig['outcomeBand'];
}

/** Trace: duplicate-gain policy consulted at attachment grant time */
export interface EffectShellDuplicatePolicyAppliedTrace extends TraceBase {
  category: 'effect_shell';
  subkind: 'duplicate_policy_applied';
  actorId: string;
  templateId: string;
  policy: DuplicateGainPolicy;
  outcome: 'stacked' | 'refreshed' | 'flipped' | 'worsened' | 'ignored';
}

export type EffectShellTrace =
  | EffectShellFlipRevealedTrace
  | EffectShellGateTransitionTrace
  | EffectShellBandSelectedTrace
  | EffectShellDuplicatePolicyAppliedTrace;

// ═══════════════════════════════════════════════════════════════════
// Composition Phase Runner Traces (THR-225)
// ═══════════════════════════════════════════════════════════════════

/** Trace: a composition phase activated successfully */
export interface CompositionPhaseActivatedTrace extends TraceBase {
  category: 'composition.phase_activated';
  compositionId: string;
  phaseId: string;
  activatedNodes: string[];
  storyBeatQueued: boolean;
  voiceHint?: 'divine' | 'mortal';
  templateResolved: boolean;
}

/** Trace: phase story-beat template id not found in registry (fail-soft path) */
export interface CompositionStoryBeatTemplateMissingTrace extends TraceBase {
  category: 'composition.story_beat_template_missing';
  compositionId: string;
  phaseId: string;
  templateId: string;
}

/** Trace: a composition transitioned to failed status */
export interface CompositionFailedTrace extends TraceBase {
  category: 'composition.failed';
  compositionId: string;
  failingPhaseId?: string;
  reason: string;
}

/** Trace: phase predicate evaluation threw an error */
export interface CompositionPhaseEvalFailedTrace extends TraceBase {
  category: 'composition.phase_eval_failed';
  compositionId: string;
  phaseId: string;
  error: string;
}

// ─── Rival scheme traces (THR-66) ────────────────────────────────

/** Trace: a rival launched a multi-phase scheme. */
export interface RivalSchemeLaunchedTrace extends TraceBase {
  category: 'rival.scheme_launched';
  rivalId: string;
  compositionId: string;
  family: string;
  escalationTier: number;
  targetNodeId?: string;
}

/** Trace: a scheme phase activated and its concrete move fired. */
export interface RivalSchemePhaseAdvancedTrace extends TraceBase {
  category: 'rival.scheme_phase_advanced';
  rivalId: string;
  compositionId: string;
  phaseId: string;
  move: string;
  targetNodeId?: string;
}

/** Trace: the player countered a scheme (stalled it or failed it). */
export interface RivalSchemeCounteredTrace extends TraceBase {
  category: 'rival.scheme_countered';
  rivalId: string;
  compositionId: string;
  outcome: 'stalled' | 'failed';
  byActorId?: string;
}

/** Trace: a scheme ran all four phases to completion. */
export interface RivalSchemeCompletedTrace extends TraceBase {
  category: 'rival.scheme_completed';
  rivalId: string;
  compositionId: string;
}

// ═══════════════════════════════════════════════════════════════════
// Notable Agenda Traces (THR-630)
// ═══════════════════════════════════════════════════════════════════

/** Trace: a notable launched a four-phase agenda on the composition runner. */
export interface NotableAgendaLaunchedTrace extends TraceBase {
  category: 'notable.agenda_launched';
  notableId: string;
  compositionId: string;
  family: string;
  prominence: number;
  targetNodeId?: string;
}

/** Trace: an agenda phase activated and its concrete move fired. */
export interface NotableAgendaPhaseAdvancedTrace extends TraceBase {
  category: 'notable.agenda_phase_advanced';
  notableId: string;
  compositionId: string;
  phaseId: string;
  move: string;
  targetNodeId?: string;
}

/** Trace: the player countered an agenda (stalled it or failed it). */
export interface NotableAgendaCounteredTrace extends TraceBase {
  category: 'notable.agenda_countered';
  notableId: string;
  compositionId: string;
  outcome: 'stalled' | 'failed';
  byActorId?: string;
}

/** Trace: an agenda ran all four phases to completion. */
export interface NotableAgendaCompletedTrace extends TraceBase {
  category: 'notable.agenda_completed';
  notableId: string;
  compositionId: string;
}

/**
 * Trace: one aggregate roster-scan record per scan tick (never per-notable —
 * per-agent bursts flood the ring buffer).
 */
export interface NotableRosterScanTrace extends TraceBase {
  category: 'notable.roster_scan';
  candidatesScored: number;
  activeAgendas: number;
  launched: number;
  skippedThreaded: number;
}

// ═══════════════════════════════════════════════════════════════════
// Route Event Traces (THR-669)
// ═══════════════════════════════════════════════════════════════════

/** Trace: one aggregate route-event scan record per scan tick. */
export interface RouteEventScanTrace extends TraceBase {
  category: 'route_event_scan';
  routesScanned: number;
  eligibleRoutes: number;
  seedsPlanted: number;
}

/** Trace: a route event materialized into an encounter seed. */
export interface RouteEventSeededTrace extends TraceBase {
  category: 'route_event_seeded';
  routeEdgeId: string;
  eventKind: 'ambush' | 'toll' | 'embargo';
  templateId: string;
  targetAgentId: string;
}

// ═══════════════════════════════════════════════════════════════════
// Economic Power Traces (THR-617)
// ═══════════════════════════════════════════════════════════════════

/** Trace: a faction established or lost a resource monopoly. */
export interface MonopolyTransitionTrace extends TraceBase {
  category: 'monopoly_transition';
  factionId: string;
  resourceId: string;
  transition: 'established' | 'broken';
  controlFraction: number;
}

/** Trace: one aggregate economic-power scan record per scan tick. */
export interface EconomicPowerScanTrace extends TraceBase {
  category: 'economic_power_scan';
  monopoliesHeld: number;
  established: number;
  broken: number;
  flowsDrifted: number;
  scarcityArcsActive: number;
  scarcityArcTransitions: number;
}

/** Trace: a scarcity arc opened, advanced a phase, or dissolved. */
export interface ScarcityArcPhaseTrace extends TraceBase {
  category: 'scarcity_arc_phase';
  locationId: string;
  resourceId: string;
  phase: 'shortage' | 'hoarding' | 'unrest' | 'flashpoint' | 'recovered';
}

// ═══════════════════════════════════════════════════════════════════
// Encounter Foreshadowing Traces (THR-389)
// ═══════════════════════════════════════════════════════════════════

/** Trace: foreshadowing resolver ran for an (agentId, encounterId) pair */
export interface ForeshadowingResolutionTrace extends TraceBase {
  category: 'foreshadowing';
  agentId: string;
  encounterId: string;
  /** Variant IDs that satisfied all `when` predicates (empty in Phase 1). */
  variantsConsidered: string[];
  /** The variant picked, or null when the generic fallback was used. */
  variantPicked: string | null;
  signals: {
    intelligenceTier: 'unknown' | 'rumor' | 'briefed' | 'expert';
    topMotive: 'awareness' | 'visibility' | 'prereqs' | 'threat' | 'capability' | 'cooldown';
    dominantReach: ReachDomain;
  };
  interventionAttributionId: string | null;
  cacheHit: boolean;
  /** Populated only on resolver error (fail-soft path). */
  error?: string;
  /**
   * THR-631 Phase B: provenance of each composed clause when the receipt-driven
   * or composed-generic path rendered the prose, e.g.
   * ['knowledge:rumor', 'pull:ambition', 'expect:perilous/hedged'].
   */
  compositionKeys?: string[];
  /** THR-631 Phase B: the Motive Receipt consumed, or null on the generic path. */
  receipt?: MotiveReceipt | null;
}

// ═══════════════════════════════════════════════════════════════════
// Ascendant Self-Action Traces (THR-399)
// ═══════════════════════════════════════════════════════════════════

/** Trace: an ascendant self-action effect was applied */
export interface SelfActionTrace extends TraceBase {
  category: 'self_action';
  templateId: string;
  ascendantId: string;
  /** For Stillness: sphere that received essence, and how much. */
  essenceRegen?: { sphere: string; delta: number; newTotal: number };
  /** For Recede: the discount fraction stored as a buff. */
  discountStored?: number;
  /** For Focus: the tier boost stored as a buff. */
  tierBoostStored?: number;
  /** For Reveal: number of mortals affected on the avatar's hex. */
  mortalsAffected?: number;
  /** For Reveal: hex coordinates of the avatar. */
  revealHex?: { col: number; row: number };
}

/** Trace: Recede/Focus buff was consumed when the next non-self action fired (THR-416) */
export interface BuffConsumedTrace extends TraceBase {
  category: 'buff_consumed';
  ascendantId: string;
  /** Template ID of the action that consumed the buff. */
  consumingTemplateId: string;
  /** Discount fraction applied (0 if Recede was not active). */
  discountApplied: number;
  /** Tier boost applied (0 if Focus was not active). */
  tierBoostApplied: number;
  /** Essence cost after discount. */
  effectiveEssenceCost: number;
  /** Rarity tier after Focus boost. */
  effectiveRarityTier: number;
}

/** Trace: Survey people-layer prose band composed (THR-415) */
export interface SurveyProseComposedTrace extends TraceBase {
  category: 'revelation';
  type: 'survey_prose_composed';
  hexCol: number;
  hexRow: number;
  /** Mood bucket that fired, or 'none' if the hex had no location unrest data. */
  moodBucket: 'calm' | 'restless' | 'agitated' | 'boiling' | 'none';
  /** Number of factions that cleared SURVEY_FACTION_PRESENCE_MIN. */
  factionCount: number;
  /** Length of the composed prose band in characters; 0 means the TickEvent was skipped. */
  composedLength: number;
  /** Named mortals included in the people-layer clause (THR-440); 0 means the fallback fired. */
  namedMortalCount: number;
}

/** Trace: KPI snapshot emitted by CLI `kpi` command or `window.__DEBUG.getKpiReport()` (THR-457) */
export interface KpiSnapshotTrace extends TraceBase {
  category: 'kpi';
  report: import('../engine/kpi/gameplayKpi').GameplayKpiReport;
}

/** Emitted by branchingCurator.ts when a branching template's score is boosted (THR-452). */
export interface BranchingCuratorNudgeTrace extends TraceBase {
  category: 'branching_curator_nudge';
  agentId: string;
  templateId: string;
  /** Multiplier applied to the template's finalScore. */
  weight: number;
  cooldownTicks: number;
  /** THR-603: doom-phase generosity multiplier folded into `weight` this tick (1.0 = neutral). */
  curationPhaseMultiplier?: number;
}

/** Full resolution input payload emitted at every NPC action resolution (THR-451 Phase A). */
export interface ResolutionInputTrace extends TraceBase {
  category: 'resolution.input';
  actorId: string;
  templateId: string;
  scale: ActionScale;
  capability: number;
  /** Post-normalization, post-scale-offset difficulty fed to the resolver. */
  difficulty: number;
  /** Pre-scale-offset difficulty (after intel adjustment). */
  rawDifficulty: number;
  /** SCALE_DIFFICULTY_OFFSETS[scale] that was applied. */
  scaleOffsetApplied: number;
  sphereFactor: number;
  actionModifiers: number;
  influenceNudge: number;
  /** Effective probability after all floor adjustments. */
  probability: number;
  /** True if difficulty-cap floor fired (capable actors where cap ≥ scaleMinP). */
  scaleFloorApplied: boolean;
  /** True if probability post-process floor fired (incapable actors where cap < scaleMinP). */
  probabilityFloorApplied: boolean;
  roll: number;
  /** Final outcome after probability floor + scale-gated crit-failure downgrade. */
  outcome: OutcomeType;
  /**
   * THR-571: Raw resolver outcome BEFORE any floor upgrade or scale severity mapping.
   * Makes the exact outcome-ladder erasure the floor/gate used to perform observable forever.
   */
  rawOutcome?: OutcomeType;
  /** THR-571: Whether the raw roll classified as a critical (doubles) outcome, pre-erasure. */
  critClassification?: 'critical_success' | 'critical_failure' | 'none';
  /**
   * THR-571: True when the probability floor rewrote a sub-floor failure/critical_failure
   * into a floored success band (now success_at_cost, was 'success'). Distinct from
   * probabilityFloorApplied, which only reports that P itself was raised to the floor.
   */
  floorUpgradeApplied?: boolean;
}

// ─── THR-456: Event Feed Hygiene trace types ──────────────────────────────────

/** Trace: same-hex same-tick agent_encounter cluster collapsed into one event */
export interface ChronicleAggregatedTrace extends TraceBase {
  category: 'chronicle.aggregated';
  hexCoords: { col: number; row: number };
  memberCount: number;
  memberIds: string[];
  phraseId: string;
}

/** Trace: phonetic name candidate rejected by constraint (syllables/consonants/vowels) */
export interface NamingConstrainedRejectTrace extends TraceBase {
  category: 'naming.constrained_reject';
  cultureId: string;
  rejectedCandidate: string;
  reason: 'syllables' | 'consonants' | 'vowels';
  attempt: number;
}

/** Trace: all naming paths exhausted; using fixed canon fallback */
export interface NamingFatalFallbackTrace extends TraceBase {
  category: 'naming.fatal_fallback';
  cultureId: string;
  fallbackName: string;
}

/** Trace: phrase skipped in repetition guard; using least-recently-used alternative */
export interface ProseRepetitionSkipTrace extends TraceBase {
  category: 'prose.repetition_skip';
  phraseId: string;
  lastUseTick: number;
}

/** Trace: event aggregation threw; raw events returned unchanged */
export interface ChronicleAggregateFailedTrace extends TraceBase {
  category: 'chronicle.aggregate_failed';
  errorMessage: string;
}

/** Trace: doom identity milestone threshold crossed for the first time (THR-293) */
export interface MilestoneTriggeredTrace extends TraceBase {
  category: 'doom_milestone';
  archetype: import('./doomClock').DoomClockArchetype;
  label: string;
  threshold: number;
  progress: number;
}

/** Trace: enrichProse selected a band-flavored phrase for {outcome_phrase} or {q_flavor} (THR-460) */
export interface OutcomeBandProseSelectedTrace extends TraceBase {
  category: 'outcome_band_prose_selected';
  /** The outcome band that drove the selection (e.g. 'surge', 'catastrophe'). */
  band: string;
  /** The phraseId that was chosen from the pool. */
  phraseId: string;
  /** Which placeholder table was used. */
  phraseTable: 'outcome_phrase' | 'q_flavor';
}

/** Trace: camera center decision for interaction-gated follow mode (THR-463). */
export interface CameraCenterTrace extends TraceBase {
  category: 'camera_center';
  agentId: string;
  hexCol: number;
  hexRow: number;
  centered: boolean;
  reason: 'pending_encounter' | 'populated_arrival' | 'suppressed';
}

// ─── Companies — the group layer (THR-74) ────────────────────────────

/**
 * Trace: aggregate summary of `phaseGroups`, emitted **once per tick**.
 *
 * `phaseGroups` walks every active company, so per-company traces would flood the
 * ring buffer and evict semantic traces (the all-agents-phase rule). Per-company
 * detail belongs in `getGroups()` / the Companies tab, not here.
 */
export interface GroupPhaseTrace extends TraceBase {
  category: 'group_phase';
  /** Active companies at the start of the phase. */
  activeGroups: number;
  /** Companies that chose and applied a destination this tick. */
  movesExecuted: number;
  /** Dissent registrations across all companies this tick. */
  dissents: number;
  cohesionDeltasApplied: number;
  /** Members who evaluated leaving (whether or not they left). */
  leaveDecisions: number;
  /** Colocated candidate sets examined by the formation scan. */
  formationCandidateSets: number;
}

/** Trace: a company came into being. Event-scale — rare, one per formation. */
export interface GroupFormedTrace extends TraceBase {
  category: 'group_formed';
  groupId: string;
  groupType: 'party' | 'squad' | 'faction_band';
  name: string;
  memberIds: string[];
  cause: 'systemic' | 'seeking_companions' | 'draw_together';
  startingCohesion: number;
}

/** Trace: a company ended. The node persists as `disbanded` history. */
export interface GroupDissolvedTrace extends TraceBase {
  category: 'group_dissolved';
  groupId: string;
  reason: 'cohesion_floor' | 'goal_complete' | 'leader_death' | 'betrayal' | 'undersize';
  finalCohesion: number;
  ticksActive: number;
}
