import type { SphereName } from './index';
// THR-1065: these payload interfaces are `TraceEntry` members. Type-only and
// circular — they extend `TraceBase` declared here — which `import type` erases.
import type {
  ChoiceResolvedTrace,
  ForecastComputedTrace,
  HandFilteredTrace,
  DriftThresholdCrossedTrace,
  BranchDecidedTrace,
  DetectionThresholdCrossedTrace,
  ItemConsumedByChoiceTrace,
  SpotlightChangedTrace,
  CallbackEligibilityComputedTrace,
} from './traces/encounter-traces';
import type {
  MentorshipOfferedTrace,
  MentorshipStartedTrace,
  MentorshipLessonTrace,
  MentorshipGraduatedTrace,
  MentorshipSurpassedTrace,
  MentorshipSeveredTrace,
} from './traces/mentorship-traces';
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
import type { BehaviorFamily, DecisionFamily, StrategicVerb, StrategicExecutionMode, UndertakingHarmClass, UndertakingMomentClass } from './strategicAction';
import type { ComplicationSeverity } from './complication';
import type { SyllableTemplate } from './culture';
import type { ReliabilityBand } from '../engine/intelligence';
import type { MotiveReceipt } from './foreshadowing';
import type { IntelligenceCategory } from './unifiedAction';
import type { NarrativeEventType, NarrativeTier } from './narrative';
import type { ForeshadowingSignals } from './foreshadowing';
import type {
  FactionMemberWorkTrace,
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
  | 'doom_card' | 'mandate_checkpoint' | 'mandate_milestone_prose'
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
  | 'strategic_control_lifecycle'
  // Undertaking harm outcomes (THR-1298)
  | 'undertaking_outcome_event'
  | 'grievance_transition'
  | 'ambition_displaced'
  // Undertaking checkpoints (THR-1292)
  | 'undertaking_checkpoint'
  | 'undertaking_fork'
  // Follow affordance (THR-1299)
  | 'follow_change'
  // Moment queue lifecycle (THR-1299 slice 2)
  | 'moment_surface'
  // The calling (THR-1299 slice 5)
  | 'calling_change'
  // The one prioritization board (THR-1292 §4)
  | 'decision_board_comparison'
  | 'decision_board_error'
  // Omen agenda traces (THR-19)
  | 'omen_selection'
  | 'omen_beat'
  // Encounter aftermath traces (THR-111)
  | 'cli_auto_aftermath'
  | 'encounter_aftermath_applied'
  | 'encounter_aftermath_effect'
  | 'encounter_seed_planted'
  | 'encounter_seed_triggered'
  /** Auto-resolve deadline retiring an unattended notification (THR-1068). */
  | 'encounter_notification'
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
  // Reputation unification (THR-1206)
  | 'reputation_with_changed'
  | 'reputation_with_pruned'
  | 'reputation_set_applied'
  | 'condition_applied'
  | 'condition_removed'
  // Location conditions (THR-1143)
  | 'location_condition_applied'
  | 'aftermath_target_invalid'
  // Nudge card dispatch (THR-885)
  | 'nudge_cost_charged'
  | 'nudge_dispatch_failed'
  | 'nudge_attunement_unlock'
  // World-shaping aftermath traces (THR-115)
  | 'artifact_spawned'
  | 'omen_emitted'
  | 'omen_decayed'
  // The Compulsion — per-agent decision urges (THR-886)
  | 'compulsion_planted'
  | 'compulsion_decayed'
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
  // Encounter Experience traces (THR-339 wiring — emitters in Phase B modules)
  // The dash above was a semicolon until THR-928. A naive "read the union" scan
  // that delimits on the first `;` stopped here and reported the ~120 members
  // below as unregistered — which is how THR-928 came to be filed against
  // `forecast_computed`, a member present since 2026-05-07. Keep comments in
  // this union semicolon-free.
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
  // Off-screen guild work for ambient members (THR-815)
  | 'faction_member_work'
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
  // Army supply — provisions ride trade conduits (THR-626)
  | 'army_supply_scan'
  | 'army_supply_seeded'
  // Economic power — monopoly resolution + sphere drift (THR-617)
  | 'monopoly_transition'
  | 'economic_power_scan'
  | 'scarcity_arc_phase'
  // Companies — the group layer (THR-74)
  | 'group_phase'
  | 'group_formed'
  | 'group_dissolved'
  // NPC bands — companies get opposition their own size (THR-731)
  | 'band_spawned'
  | 'group_contested'
  // World-minted ambitions — events write mortal desire (THR-726)
  | 'ambition_minted'
  // Agent residence — origin + dwell, observed not written (THR-822)
  | 'agent_residence'
  // Nudge Model — WS0 engine substrate (THR-773)
  | 'nudge_played'
  | 'agent_broken'
  | 'agent_mended'
  // ─── Emitted-but-unregistered categories (THR-928) ────────────────────
  // Every category below is emitted by a live `emitTrace` call site and was
  // absent from this union, so the two vocabularies had silently diverged —
  // the THR-800 / THR-803 "two vocabularies that never intersected" shape.
  //
  // Being absent here is not cosmetic. `TRACE_CATEGORIES` seeds DebugPanel's
  // enabled-category set, and the panel filters on membership, so a category
  // missing from the pair was **invisible in the trace inspector** no matter
  // how faithfully it was emitted. That is an NFP #2 (inspectability) defect,
  // not a typing nicety.
  //
  // Three of these — graph_op_execution, choice_set_player_resolved and
  // choice_set_player_dismissed — already had a wired TraceEntry member and
  // already sat in TRACE_CATEGORIES, so their absence here made the
  // `TRACE_CATEGORIES: TraceCategory[]` annotation itself fail to typecheck.
  //
  // Membership predicate, re-runnable: any `category: '<literal>'` inside an
  // emitTrace call whose literal is not a member of this union. See the
  // regression gate in src/types/__tests__/trace-vocabulary.test.ts, which
  // fails if the set ever diverges again.
  | 'action'
  | 'aftermath_agent_relocation'
  | 'aftermath_invalid_tally_key'
  | 'aftermath_membership_change'
  | 'aftermath_reward_draw'
  | 'aftermath_reward_draw_empty'
  | 'aftermath_invalid_tally_key_rate_limited'
  | 'aftermath_sentinel_bound'
  | 'agent_validation'
  | 'ambition_progress'
  | 'bond_change_applied'
  | 'branch_decided'
  | 'chain_progress'
  | 'companion_departed'
  | 'companion_joined'
  | 'choice_set_player_dismissed'
  | 'choice_set_player_resolved'
  | 'complication_partial_progress'
  | 'consequence_applied'
  | 'death_site_spirit_pressure'
  | 'debug_tick_batch'
  | 'divine_premonition'
  | 'economic_trait_acquired'
  | 'economic_trait_lost'
  | 'effect_reaction'
  | 'encounter'
  | 'encounter_seed_family_matched'
  | 'encounter_trait'
  | 'faction_action'
  | 'faction_bonus'
  | 'faction_promotion'
  | 'faction_reputation'
  | 'faction_reputation_gain_error'
  | 'faction_reputation_trait'
  | 'graph_op_execution'
  | 'relocation_arrived'
  | 'relocation_expired'
  | 'reputation_walk'
  | 'seed_context_inherited'
  | 'social_encounter_generation'
  | 'social_outcome'
  | 'trust_change'
  // Dotted categories. Each already had a wired TraceEntry member and was still
  // absent from this union, so the emitted trace could never be selected in the
  // inspector. Found by the regression gate, not by hand — a first scan keyed on
  // /[a-z0-9_]+/ misses every dotted name, and the same omission is why these
  // outlived the 34 above.
  // Edge integrity (THR-1177)
  | 'edge_schema_refused'
  | 'chronicle.aggregated'
  | 'chronicle.aggregate_failed'
  | 'naming.constrained_reject'
  | 'rival.scheme_phase_advanced'
  // Effect vocabulary activation (THR-1239)
  | 'effect.event_raised'
  | 'effect.charge_spent'
  // Overlay / rule-override persistence (THR-1240)
  | 'effect.overlay_applied'
  | 'effect.overlay_expired'
  // Rule-override consumption at owning sites (THR-1241)
  | 'effect.rule_override_consumed'
  // Consolidation — the two primitives wired in stage 4 (THR-1242)
  | 'effect.suppressed'
  | 'effect.revealed'
  // The binder — scored cast/stage binding + persistence ledger (THR-1296)
  | 'binding_decision'
  | 'binding_severed'
  | 'binder_mint';

export const TRACE_CATEGORIES: TraceCategory[] = [
  'edge_schema_refused',
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
  'doom_card', 'mandate_checkpoint', 'mandate_milestone_prose',
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
  'strategic_control_lifecycle',
  'undertaking_outcome_event',
  'grievance_transition',
  'ambition_displaced',
  'undertaking_checkpoint',
  'undertaking_fork',
  'follow_change',
  'moment_surface',
  'calling_change',
  'decision_board_comparison',
  'decision_board_error',
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
  'encounter_notification',
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
  // Reputation unification (THR-1206)
  'reputation_with_changed',
  'reputation_with_pruned',
  'reputation_set_applied',
  'condition_applied',
  'condition_removed',
  // Location conditions (THR-1143)
  'location_condition_applied',
  'aftermath_target_invalid',
  // Nudge card dispatch (THR-885)
  'nudge_cost_charged',
  'nudge_dispatch_failed',
  'nudge_attunement_unlock',
  // World-shaping aftermath traces (THR-115)
  'artifact_spawned',
  'omen_emitted',
  'omen_decayed',
  // The Compulsion — per-agent decision urges (THR-886)
  'compulsion_planted',
  'compulsion_decayed',
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
  // Off-screen guild work for ambient members (THR-815)
  'faction_member_work',
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
  // Army supply (THR-626)
  'army_supply_scan',
  'army_supply_seeded',
  // Economic power (THR-617)
  'monopoly_transition',
  'economic_power_scan',
  'scarcity_arc_phase',
  // Companies — the group layer (THR-74)
  'group_phase',
  'group_formed',
  'group_dissolved',
  // NPC bands (THR-731)
  'band_spawned',
  'group_contested',
  // World-minted ambitions (THR-726)
  'ambition_minted',
  // Agent residence (THR-822)
  'agent_residence',
  // Nudge Model — WS0 engine substrate (THR-773)
  'nudge_played',
  'agent_broken',
  'agent_mended',
  // Emitted-but-unregistered categories (THR-928). Registering them here is what
  // makes them selectable — and therefore visible — in the DebugPanel trace
  // inspector. Until now each was emitted faithfully and then filtered out of
  // the panel, because DebugPanel seeds its enabled set from this array.
  'action',
  'aftermath_agent_relocation',
  'aftermath_invalid_tally_key',
  'aftermath_membership_change',
  'aftermath_reward_draw',
  'aftermath_reward_draw_empty',
  'aftermath_invalid_tally_key_rate_limited',
  'aftermath_sentinel_bound',
  'agent_validation',
  'ambition_progress',
  'bond_change_applied',
  'branch_decided',
  'chain_progress',
  'companion_departed',
  'companion_joined',
  'complication_partial_progress',
  'consequence_applied',
  'death_site_spirit_pressure',
  'debug_tick_batch',
  'divine_premonition',
  'economic_trait_acquired',
  'economic_trait_lost',
  'effect_reaction',
  'encounter',
  'encounter_seed_family_matched',
  'encounter_trait',
  'faction_action',
  'faction_bonus',
  'faction_promotion',
  'faction_reputation',
  'faction_reputation_gain_error',
  'faction_reputation_trait',
  'relocation_arrived',
  'relocation_expired',
  'reputation_walk',
  'seed_context_inherited',
  'social_encounter_generation',
  'social_outcome',
  'trust_change',
  'chronicle.aggregated',
  'chronicle.aggregate_failed',
  'naming.constrained_reject',
  'rival.scheme_phase_advanced',
  'effect.event_raised',
  'effect.charge_spent',
  'effect.overlay_applied',
  'effect.overlay_expired',
  'effect.rule_override_consumed',
  'effect.suppressed',
  'effect.revealed',
  // The binder (THR-1296)
  'binding_decision',
  'binding_severed',
  'binder_mint',
];

/** Base shape for all trace entries */
/**
 * Trace: a generic writer chokepoint refused an edge that violated EDGE_SCHEMA (THR-1177).
 *
 * Emitted from `graphOpExecutor.executeAddEdge` and
 * `strategicGraphOps.createRelationEdge` when the proposed edge's type is unregistered
 * or an endpoint's node type is not what the family declares. The write is refused
 * fail-soft — the op returns its failure shape and nothing throws (NFP #4).
 *
 * **Volume is a signal, not noise.** A healthy world emits ZERO of these: the
 * seed-42/medium/120-tick smoke asserts exactly that. A run that starts emitting them
 * means either content is authoring an edge shape the schema forbids, or a schema row
 * has drifted from a deliberate writer — the THR-1176 `belongs_to` case. Read the
 * `reason` to tell those apart: `unknown_type` is almost always content reaching for a
 * family nobody registered, while `source_type`/`target_type` is usually drift.
 */
export interface EdgeSchemaRefusedTrace extends TraceBase {
  category: 'edge_schema_refused';
  /** The edge family that was refused — may not be a registered EdgeType at all. */
  edgeType: string;
  /** Which chokepoint refused it, so the offending writer is one grep away. */
  chokepoint: 'graph_op_add_edge' | 'create_relation_edge';
  reason: 'unknown_type' | 'source_type' | 'target_type';
  sourceId: string;
  targetId: string;
  /** Resolved node types; `undefined` when the node did not exist. */
  sourceNodeType?: string;
  targetNodeType?: string;
}

// ─── Effect vocabulary activation (THR-1239) ────────────────────────
//
// Categories are dotted (`effect.*`), matching the `chronicle.*` / `naming.*` /
// `rival.*` precedent. They are deliberately NOT folded into `effect_reaction`:
// that category carries action-trigger firings, and an event *raise* is a
// different question ("did the production site fire at all?") from a reaction
// ("did an attachment respond?"). Answering the first from the second is exactly
// the confusion the raise sites were added to end.

/**
 * Trace: a production site raised an `EffectEvent` for an agent.
 *
 * `reactivesFired` is the payload the raise actually produced — a raise that
 * fires with `reactivesFired: 0` still proves the site is live, which is the
 * distinction a dead executor family could not previously be diagnosed against.
 */
export interface EffectEventRaisedTrace extends TraceBase {
  category: 'effect.event_raised';
  /** The `EffectEvent['type']` raised — e.g. 'entered_hex', 'combat_started'. */
  event: string;
  agentId: string;
  /** How many reactive effects the event triggered on this agent. */
  reactivesFired: number;
  /** The site that raised it, so the producer is one grep away. */
  site: string;
}

/** Trace: a `consumable_charge` charge was spent on a matching-reach step. */
export interface EffectChargeSpentTrace extends TraceBase {
  category: 'effect.charge_spent';
  attachmentId: string;
  attachmentName: string;
  /** Bearer of the attachment (the agent who completed the step). */
  agentId: string;
  /** Reach of the step that consumed the charge. */
  reach: string;
  chargesRemaining: number;
  /** True when this spend emptied the attachment and `destroyOnEmpty` is set. */
  destroyed: boolean;
}

/**
 * Trace: a terrain overlay or rule override was persisted, or expired off.
 *
 * These are the two halves of one lifecycle and share a shape deliberately — the
 * question a reader asks of the buffer is "what is currently in force on this hex
 * / this agent, and when does it lift?", which is answered by pairing an
 * `applied` against its `expired`. Splitting them into unrelated shapes would
 * make that pairing a join rather than a filter.
 *
 * `key` is the collection key, not the source: `hexKey(col, row)` for a terrain
 * overlay, the agent id for a rule override.
 */
export interface EffectOverlayTrace extends TraceBase {
  category: 'effect.overlay_applied' | 'effect.overlay_expired';
  kind: 'terrain' | 'rule';
  /** `hexKey(col,row)` for terrain, agent id for rule. */
  key: string;
  /** `TerrainOverlayType` for terrain, `RuleOverrideKey` for rule. */
  overlay: string;
  sourceAttachmentId: string;
  /** Ticks left at emit time; 0 on expiry, and on an overlay dropped fail-soft. */
  ticksRemaining: number;
}

/**
 * Trace: an owning site read a rule override that was NOT at its neutral value.
 *
 * Emitted from `ruleOverrideConsumers.ts` — the one read path stage 3 wires into
 * the eleven sites that own a `RuleOverrideKey`. Deliberately **only on a
 * non-neutral read**: every site reads its key unconditionally (that is what
 * makes the neutral safe to use without a null check), so tracing every read
 * would emit on the order of agents x keys x ticks and drown the buffer in
 * "nothing was in force". A reader asking "did this artifact do anything?" wants
 * the reads that changed an outcome, and those are exactly the ones here.
 *
 * `site` is the owning-site tag (`'movementCost'`, `'agentLifecycle.death'`, ...)
 * rather than a file path, so the trace survives a file move and answers "which
 * rule did this bend?" without a second lookup.
 */
export interface RuleOverrideConsumedTrace extends TraceBase {
  category: 'effect.rule_override_consumed';
  /** The `RuleOverrideKey` that was read. */
  key: string;
  agentId: string;
  /** Effective folded value at the moment of the read. */
  value: number | boolean | string;
  /** Owning-site tag, e.g. `'movementCost'`. */
  site: string;
}

/**
 * Trace: a `suppress` effect silenced an attachment (THR-1242).
 *
 * Emitted from `effectSuppression.applySuppressions`, the only writer of
 * `EffectRuntimeState.suppressed`. Silence is the hardest state to debug from
 * the outside — an effect that stops contributing looks identical to one that
 * was never wired — so this names the source that did it and when it lifts.
 *
 * Emitted on the transition only, not every tick the suppression holds: the
 * writer skips a target already suppressed to the same expiry, so a shroud worn
 * for twenty ticks produces one row rather than twenty.
 */
export interface EffectSuppressedTrace extends TraceBase {
  category: 'effect.suppressed';
  agentId: string;
  /** The attachment being silenced. */
  attachmentId: string;
  /** The attachment whose `suppress` effect did it. */
  sourceAttachmentId: string;
  /** The agent bearing that source — may differ from `agentId` under a radius scope. */
  sourceAgentId: string;
  /** Tick at which the silence lifts. */
  untilTick: number;
}

/**
 * Trace: a `reveal` effect lifted fog on arrival (THR-1242).
 *
 * Emitted from `phaseMovement` when a bearer's reveal radius stamps previously
 * unvisited locations into their exploration record. Absent when the radius
 * found nothing new, so a row here means the horizon actually moved — which is
 * the question a reader asks about a scrying lens.
 */
export interface EffectRevealedTrace extends TraceBase {
  category: 'effect.revealed';
  agentId: string;
  /** Hex radius the reveal reached. */
  range: number;
  /** How many locations became known that were not already. */
  revealedCount: number;
}

/** One scored row on the binder's board — reuse, modify, or the single mint row. */
export interface BindingDecisionRow {
  /** Candidate node id, or the literal `'mint'` for the mint row. */
  nodeId: string;
  /** Whether this row is the additive-modify variant of the candidate. */
  modified: boolean;
  score: number;
  castRoleFit: number;
  scarcity: number;
  storyTies: number;
  distance: number;
  identity: number;
  /** Present only when the row was excluded before scoring mattered. */
  vetoed?: 'identity_contradiction';
}

/**
 * Trace: the binder chose who fills a cast slot (THR-1296 §2).
 *
 * One per cast slot per bind pass, and — following `UndertakingCheckpointTrace`'s
 * stated emission rule — **emitted on refusals and deferrals too**. A slot that
 * bound nothing is exactly the case a reader needs to see; a trace that only
 * records successes cannot answer "why is this moment generic?", which is the
 * question this system exists to make answerable.
 *
 * `rows` is capped at `BINDER_MAX_CANDIDATE_ROWS` — the payload is a debugging
 * aid, not a ledger, and the ledger lives in `strategicState.bindings`.
 */
export interface BindingDecisionTrace extends TraceBase {
  category: 'binding_decision';
  projectId: string;
  castKey: string;
  stepIndex: number;
  mode: 'reuse' | 'modify' | 'mint' | 'deferred_awaiting_mint' | 'refused';
  winnerNodeId?: string;
  /** Why nothing bound, when `mode` is `'refused'`. */
  refusedReason?:
    | 'no_candidates'
    | 'all_vetoed'
    | 'mint_queue_full'
    | 'binder_error'
    /** The remote-anchor gate (THR-1296 §6) — refused at proposal, before any project exists. */
    | 'no_remote_anchor';
  rows: ReadonlyArray<BindingDecisionRow>;
  /** Rows considered before the trace cap — `rows.length` may be smaller. */
  rowsConsidered: number;
}

/**
 * Trace: a binding stopped being live (THR-1296 §4).
 *
 * `cause` names the reaper class, which is the whole point — before this, the
 * `removeNode` funnel was silent, so a siege razing a bound stage and a
 * housekeeping sweep dissolving one were indistinguishable from outside.
 */
export interface BindingSeveredTrace extends TraceBase {
  category: 'binding_severed';
  projectId: string;
  castKey: string;
  nodeId: string;
  /**
   * The first three mirror `UndertakingBindingBrokenCause` exactly — a severance
   * trace must be able to name every cause the ledger can record, or the two
   * vocabularies drift and the trace silently under-reports (the THR-928 shape).
   * The last two are trace-only: a seed drop and a deferred dissolution are events
   * worth seeing that do not leave a `broken` ledger record behind them.
   */
  cause:
    | 'node_removed'
    | 'deceased'
    | 'severed'
    | 'seed_drop'
    | 'dissolution_deferred';
  persistence: 'must-persist' | 'scene-only';
}

/**
 * Trace: the binder's mint valve moved (THR-1296 §5).
 *
 * One per queue event, so the whole life of a mint request is readable end to end —
 * `queued` when a bind asked for a person the world does not have, `minted` when the
 * lifecycle valve actually bore them, `refused` when the queue was full or the
 * placement had evaporated by the time the valve came round.
 *
 * `queueDepth` is on every entry on purpose. The budget (one per tick) is the
 * deliverable, not a dial to raise, so the number that says whether it is holding —
 * a queue that only grows — has to be visible without reconstructing it from a
 * count of `queued` minus `minted` across the ring.
 */
export interface BinderMintTrace extends TraceBase {
  category: 'binder_mint';
  projectId: string;
  castKey: string;
  outcome: 'queued' | 'minted' | 'refused';
  /** Why nothing was queued or born. */
  refusedReason?: 'queue_full' | 'placement_missing' | 'duplicate_request' | 'mint_error';
  role: string;
  /** The id the mint took (or would have taken) — `mint_<projectId>_<castKey>`. */
  nodeId?: string;
  /** Where they were born — stage or place tier. */
  placementNodeId?: string;
  /** Requests still owed after this event. */
  queueDepth: number;
  /** Ticks between the request and the birth — the valve's observed latency. */
  waitedTicks?: number;
}

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

/** Trace: a mandate stage transition resolved its narration (THR-1197). */
export interface MandateMilestoneProseTrace extends TraceBase {
  category: 'mandate_milestone_prose';
  mandateId: string;
  transition: string;
  /** False when no line was authored for this mandate and the fallback stood in. */
  authored: boolean;
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
  /** `'holding'` (THR-1297): that someone owns a place is a knowable fact about them. */
  facetType: 'value' | 'domain' | 'bond' | 'ambition' | 'disposition' | 'possession' | 'power' | 'condition' | 'agreement' | 'threat' | 'chronicle_event' | 'holding';
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
  /**
   * Why candidates were refused (THR-1297 §2), capped at
   * `STRATEGIC_BOARD_TRACE_REFUSAL_CAP`; `candidatesRejected` stays the exact count.
   *
   * Before this, refusals reached the outside world as a bare number, so every
   * generation gate — `no_valid_targets`, `no_eligible_apprentice`, and now
   * `no_motive`, whose fail-soft row reads "never a silent skip" — was invisible from
   * a trace dump. Optional because the field is additive over every existing emitter.
   *
   * Mutable rather than `ReadonlyArray` to match `topCandidateIds`/`ambitionIds`
   * above: every emitter casts an object literal to this type, and a readonly array
   * here makes the target un-assignable back to that literal, which turns a widely
   * used `as` into a "types do not sufficiently overlap" error at each call site.
   */
  refusals?: { templateId: string; reason: string }[];
}

/** Trace: strategic action started (instant or project) */
export interface StrategicActionStartedTrace extends TraceBase {
  category: 'strategic_action_started';
  actorId: string;
  candidateId: string;
  /**
   * The template this start came from, carried as its own field.
   *
   * `candidateId` embeds it (`strat_${templateId}_${targetId}_${tick}`) and every
   * template id itself contains underscores, so recovering the template from that
   * string is a parse that guesses where the id ends. The composition gate in
   * `scripts/undertaking-census.ts` counts *distinct templates started*, which is
   * a question about this field; asking it of a concatenation is how a gate ends
   * up measuring its own parser (NFP #2).
   */
  templateId: string;
  behaviorFamily: BehaviorFamily;
  verb: StrategicVerb;
  targetNodeId?: string;
  targetHex?: { col: number; row: number };
  executionMode: StrategicExecutionMode;
  /**
   * Who started it (THR-1300 slice 2). Absent or `'board'` is an organic start; a
   * `'review_lever'` start bypassed the gates in `bypassedGates` and is excluded from
   * the census, so a review session cannot masquerade as throughput.
   */
  startedBy?: 'board' | 'review_lever';
  /** The generation gates a review start skipped — always the closed list, named. */
  bypassedGates?: readonly string[];
}

/** Trace: multi-tick strategic project progress update */
export interface StrategicProjectProgressTrace extends TraceBase {
  category: 'strategic_project_progress';
  actorId: string;
  projectId: string;
  progress: number;
  progressRequired: number;
  status: 'active' | 'completed' | 'stalled' | 'failed';
  /**
   * The proper name a completed undertaking earned at christening (THR-1297 §5).
   *
   * Rides this trace rather than taking one of its own: the plan's tracing section
   * asks for additive payload on an existing interface, and `decisionBoardLiveness`
   * drains a per-tick ring buffer that a separate emission demonstrably overflowed
   * (impediment #822's class). Absent on every `status` but `completed`, and absent
   * there too whenever the undertaking produced no nameable node — most do not.
   *
   * Present, it is the only record of why a node's name changed mid-run, which is
   * what lets an inspector tell a christening from an ordinary rename (NFP #2).
   */
  christenedName?: string;
  /** The node the name above was written onto. */
  christenedNodeId?: string;
}

/**
 * Trace: a harm-carrying undertaking outcome was written as a graph event node
 * (THR-1298).
 *
 * This is the causal seam the reactive loop turns on — it is the record of *who did
 * what to whom*, emitted at the moment the harm becomes durable and before anything has
 * minted from it. An inspector reading a vendetta backwards lands here: the grievance's
 * `mintedByEventId` names the node this trace announced.
 *
 * Volume is bounded by harm outcomes, which are rare — most undertakings carry no
 * `harmClass` at all, so this stays far under the 1/tick budget rather than competing
 * with the per-tick categories that overflow the ring buffer.
 */
export interface UndertakingOutcomeEventTrace extends TraceBase {
  category: 'undertaking_outcome_event';
  projectId: string;
  harmClass: UndertakingHarmClass;
  culpritAgentId: string;
  /** Absent when no owner could be resolved — the harm still registers for witnesses. */
  victimAgentId?: string;
  harmMagnitude: number;
  chainDepth: number;
  /** Set when this outcome answers a standing grievance rather than opening one. */
  answersGrievance?: boolean;
}

/** Every state a grievance can move through (THR-1298 slice 5). */
export type GrievanceTransition =
  | 'minted'
  | 'heat_fed'
  | 'replaced'
  | 'demoted_to_grudge'
  | 'succeeded_to_bond'
  | 'reignited'
  | 'grudge_only'
  | 'chain_ended'
  // ── Closure doors (THR-1298 slice 6) ──
  //
  // Three ways an account closes, and they are deliberately three transitions rather
  // than one: `satisfied` is the victim getting what they wanted, `settled` is somebody
  // buying the quarrel off, and `suppressed_countermint` is the *other* party's harm
  // declining to become a vendetta because it was the answer rather than a fresh
  // injury. Collapsing them would make "why did this chain stop" unanswerable.
  | 'satisfied'
  | 'settled'
  | 'suppressed_countermint';

/**
 * Trace: a grievance changed state (THR-1298 slice 5).
 *
 * The reactive loop's whole causal story is *why this agent still wants this*, and
 * every answer to that is a transition here: it opened, another harm fed it, a worse
 * harm displaced it, it cooled into a grudge, or it passed to the dead victim's closest
 * bond. Without this trace the heat number on the edge is a value with no history, and
 * "why is everyone in this town pursuing revenge" has no read path (NFP #2).
 *
 * Volume is bounded by mint cadence (≥ 75 ticks) and the 15-tick decay pass, on which
 * only *crossing* the cool threshold emits — decay itself is silent. Comfortably under
 * the 1/tick budget.
 */
export interface GrievanceTransitionTrace extends TraceBase {
  category: 'grievance_transition';
  /** The agent holding (or about to hold) the grievance. */
  agentId: string;
  transition: GrievanceTransition;
  /** Absent when the harm named no hand — an unattributed loss mints no vendetta. */
  culpritAgentId?: string;
  /** Heat after the transition, when the grievance still exists. */
  heat?: number;
  /** Human-readable reason — the replacement's "names the turn" line, or a skip cause. */
  detail?: string;
}

/**
 * Trace: a vendetta took a full mortal's secondary want (THR-1383).
 *
 * Emitted once per displacement, from the mint-block gate in `ambitionTick`. The
 * `pursues` edge it closes carries `abandonedReason: 'displaced_by_grievance'`, but an
 * edge property is a value with no history — this is the read path for "why did Oswen
 * stop building the granary" (NFP #2). Volume is bounded by the mint cadence (one pass
 * per `MINT_LOOKBACK_TICKS`) and by one displacement per mortal per pass.
 */
export interface AmbitionDisplacedTrace extends TraceBase {
  category: 'ambition_displaced';
  /** The mortal whose want was set aside. */
  agentId: string;
  /** Template of the want that yielded its slot. */
  displacedTemplateId: string;
  /** Template of the vendetta that took it. */
  grievanceTemplateId: string;
  culpritAgentId: string;
  /** Magnitude of the founding harm — at or above `GRIEVANCE_DISPLACE_MIN_MAGNITUDE`. */
  harmMagnitude: number;
}

/**
 * Trace: one undertaking checkpoint resolved (THR-1292 §2).
 *
 * Emitted once per checkpoint *attempt*, including the deferred ones — a
 * checkpoint that never rolled because the actor was absent is exactly the thing
 * a tuning pass needs to see, and a trace that only fires on the rolls would hide
 * a stage nobody ever reaches (NFP #2).
 */
export interface UndertakingCheckpointTrace extends TraceBase {
  category: 'undertaking_checkpoint';
  actorId: string;
  projectId: string;
  templateId: string;
  checkpointIndex: number;
  reach: ReachDomain;
  /** Absent on a deferral — nothing was rolled */
  band?: StepOutcome;
  effect?: 'advance' | 'advance_at_cost' | 'halt';
  roll?: number;
  probability?: number;
  capability?: number;
  difficulty?: number;
  /** Inspire/sabotage riders and escalation stakes, folded into one additive term */
  modifiers?: number;
  /** Set when a review pin substituted this band after an honest roll (THR-1300 slice 2). */
  bandPinned?: StepOutcome;
  halts: number;
  atCost: boolean;
  progress: number;
  progressRequired: number;
  /** Set instead of the roll fields when the checkpoint could not resolve */
  deferred?: 'actor_absent' | 'actor_busy' | 'awaiting_mint';
  /**
   * Set instead of the roll fields when the checkpoint *ended* the undertaking
   * outright rather than deferring it — the actor node is gone, so there is
   * nothing to defer to and no retry coming.
   *
   * Deliberately not a fourth `deferred` member (THR-1297 slice 6): a deferral is
   * re-attempted on the next interval and this is terminal, so folding them into
   * one field would make the two indistinguishable in exactly the readout that
   * exists to tell outcomes apart. Before this field the row carried neither
   * `band` nor `deferred` and its summary rendered `undefined → undefined`; the
   * two-seed census counted 9 such rows on seed 99 and could only bucket them as
   * `unrecorded`.
   */
  ended?: 'actor_lost';
  presentation: 'interrupt' | 'badge' | 'none';
}

/**
 * Trace: the halt ratchet forced the abandon-or-escalate fork (THR-1292 §2).
 *
 * Carries every input to the weight, not just the verdict, because the fork is
 * first-guess calibration the plan explicitly invites retuning — and a verdict
 * without its terms cannot be retuned from a log (NFP #2).
 */
export interface UndertakingForkTrace extends TraceBase {
  category: 'undertaking_fork';
  actorId: string;
  projectId: string;
  escalationWeight: number;
  threshold: number;
  decision: 'abandon' | 'escalate';
  halts: number;
  ambitionActive: boolean;
  courage01: number;
  /** Abandon only — the §2.2 residue rule's input (`everInterrupted`) */
  visibleFailure?: boolean;
}

/**
 * Trace: the player changed who they are watching (THR-1299 slice 1).
 *
 * Four actions rather than two because follow state has two layers: `follow` /
 * `unfollow` move the explicit list, while `mute` / `unmute` move the negative
 * term that expresses un-following a **default**-followed agent. A trace that
 * collapsed them would make the most interesting question — did the player set
 * down a mortal the god had reached for? — unanswerable from the buffer.
 *
 * `source` distinguishes the two shipped affordances from an init seed and a
 * debug lever, so a constructed browser proof is never mistaken for play.
 */
export interface FollowChangeTrace extends TraceBase {
  category: 'follow_change';
  agentId: string;
  action: 'follow' | 'unfollow' | 'mute' | 'unmute';
  source: 'arc_panel' | 'encounter_ui' | 'init' | 'debug';
}

/**
 * Trace: one moment record moved through the queue (THR-1299 slice 2).
 *
 * `queued` fires once per record pushed; `dropped` when the cap evicts one that
 * nobody acknowledged; `opened` / `acknowledged` when a surface pops it and when
 * the player dismisses it. The four events together answer the one question the
 * checkpoint trace cannot — not *what presentation was computed* but *whether
 * anything ever showed it* — which is the exact gap `undertaking-checkpoint-events`
 * was registered LEAKED for.
 */
export interface MomentSurfaceTrace extends TraceBase {
  category: 'moment_surface';
  event: 'queued' | 'opened' | 'acknowledged' | 'dropped';
  projectId: string;
  actorId: string;
  momentClass: UndertakingMomentClass;
  presentation: 'interrupt' | 'badge' | 'none';
}

/**
 * Trace: a mortal's calling was derived or changed (THR-1299 slice 5).
 *
 * Carries both scores, because the hysteresis gate is first-guess calibration
 * the plan explicitly invites retuning — and a change without its margin cannot
 * be retuned from a log (NFP #2). `cause: 'initial'` is the first derivation,
 * which stamps a name without a change; the telemetry gate counts the rest.
 */
export interface CallingChangeTrace extends TraceBase {
  category: 'calling_change';
  agentId: string;
  fromTitleKey: string | null;
  toTitleKey: string;
  cause: 'ambition_change' | 'undertaking_complete' | 'tier_promotion' | 'initial';
  incumbentScore: number;
  challengerScore: number;
}

/**
 * Trace: what the one prioritization board would have chosen (THR-1292 §4).
 *
 * The cross-family comparison this records has **never been traced** — nothing
 * anywhere captured what the losing family's best score was, which is precisely
 * why the board must run in shadow before it decides anything. One of these per
 * agent decision while the mode is `'shadow'` or `'live'`.
 *
 * `agreement` compares the *family* the two paths picked, not the specific
 * candidate: the board is a redesign, so a divergence in which encounter is best
 * is uninteresting next to a divergence in whether an encounter should happen at
 * all. It is telemetry, never a gate — the cutover criteria are distributional
 * (see `BOARD_UNDERTAKING_SHARE_RANGE` and its siblings).
 */
export interface DecisionBoardComparisonTrace extends TraceBase {
  category: 'decision_board_comparison';
  agentId: string;
  mode: 'shadow' | 'live';
  /**
   * Under `'shadow'`, what the legacy contests decided this tick. Under `'live'`
   * (THR-1349 slice 3) the only legacy contest left is the encounter scorer's own
   * pick, so this is that pick — `'encounter'` with its template, or `'idle'` — and
   * `agreement` reads as the drift between the encounter scorer and the board.
   * Reported by the census, never gated.
   */
  legacyWinner: { family: DecisionFamily; id: string | null; score: number };
  /** The board’s top `BOARD_TRACE_TOP_N`, descending. */
  boardTop: ReadonlyArray<{
    family: DecisionFamily;
    id: string;
    score: number;
    evt: number;
    desireMultiplier: number;
    temperamentWeight: number;
    advanceProbability?: number;
    /** The ambition-centrality input to `desireMultiplier`; undertakings only. */
    ambitionBoost?: number;
  }>;
  /** Whether legacy and the board agree on the winning *family*. */
  agreement: boolean;
  /**
   * The board's verdict **after `BOARD_SCORE_FLOOR` is applied** — `'idle'` when
   * the board is empty *or* its best entry fails the floor. In `'live'` this is
   * what the agent then did.
   *
   * Carried as its own field rather than left to be re-derived from `boardTop[0]`
   * by every reader, because re-deriving it is exactly how the cutover gate went
   * blind: the balance-telemetry copy of this value omitted the floor and so
   * reported `idle 0.0%` on a run that idled 91.8% of the time (THR-1301).
   */
  boardFamily: DecisionFamily;
  encounterCandidates: number;
  undertakingCandidates: number;
}

/**
 * Trace: the board scorer threw and contributed nothing to this decision.
 *
 * Explicitly **not** the empty `catch` the legacy strategic path degrades
 * through. A shadow period that swallowed board throws would report perfect
 * agreement while measuring nothing, and the cutover gate would then be evaluated
 * against a board that never ran (NFP #2, NFP #4).
 */
export interface DecisionBoardErrorTrace extends TraceBase {
  category: 'decision_board_error';
  agentId: string;
  mode: 'shadow' | 'live';
  message: string;
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
  /**
   * Set when the change moved a holding through `src/engine/holdings.ts` (THR-1297).
   *
   * Additive on the existing category rather than a new one, deliberately: a holding
   * change IS a strategic world change, and a separate category would mean a reader
   * following ownership had two feeds to merge. `verb` here is the holdings verb, not
   * the `StrategicVerb` above — a seize and a grant are the same `control` verb to the
   * action layer and entirely different events to anyone asking who owns the place.
   */
  holdingTransfer?: {
    verb: 'grant' | 'transfer' | 'release' | 'raze';
    nodeId: string;
    fromActorId?: string;
    toActorId?: string;
  };
}

/**
 * Trace: a control stance ended, or a re-claim was refused by the post-collapse
 * cooldown (THR-1286).
 *
 * `collapsed` fires when neglect degrades a stance to 1 and the record + its
 * `controls` edge are retired; `reclaim_refused` fires when candidate generation
 * declines to re-propose a target the actor let collapse inside the cooldown;
 * `already_held` fires when generation declines a target the actor still actively
 * controls, whose claim could only fail `already_controls`.
 */
export interface StrategicControlLifecycleTrace extends TraceBase {
  category: 'strategic_control_lifecycle';
  actorId: string;
  targetNodeId: string;
  event: 'collapsed' | 'reclaim_refused' | 'already_held';
  /** Ticks remaining on the cooldown; only present on `reclaim_refused`. */
  cooldownRemaining?: number;
  /** Whether the dead `controls` edge was found and removed; only on `collapsed`. */
  edgeReleased?: boolean;
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
    | 'reputation_score' | 'reputation_tally'
    | 'recent_event' | 'encounter_seed' | 'hidden_mark' | 'intelligence'
    | 'reputation_set' | 'apply_condition' | 'remove_condition' | 'condition_attachment'
    | 'grant_aspect' | 'signature_warhost'
    | 'plant_compulsion'
    // THR-1142. Note this union is a *subset* of the live effect vocabulary and
    // has been since it was written — which is why nearly every case in
    // `encounterAftermath.ts` reaches for a cast to emit its trace. Kinds are
    // added here as their dispatchers learn to emit without one; the cast
    // ratchet (THR-1065) is what keeps that direction of travel.
    | 'agent_relocation'
    // THR-1144.
    | 'membership_change'
    // THR-1146.
    | 'reward_draw'
    // THR-1150 — added so this arm emits its four traces unlaundered. It is also
    // the arm that most needed checking: its "no member" no-op was silent, and the
    // trace that now reports it would otherwise have gone in behind a cast.
    | 'faction_reputation_gain'
    // THR-1206 — added here rather than cast at the call site, which is the
    // direction of travel this union's own note describes. Its arm emits four
    // traces (no-actor, no-counterparty, refused write, applied) and all four go
    // in unlaundered.
    | 'reputation_with';
  /** Kind-specific payload for inspection */
  effectDetail: Readonly<Record<string, unknown>>;
  success: boolean;
  failReason?: string;
  /** The entity this effect actually landed on (promoted from effectDetail for filter convenience). */
  effectiveTargetId?: string;
  /** Whether the actor fallback was used or a specific target was supplied. */
  effectiveTargetKind?: 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback';
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
  effectiveTargetKind: 'agent' | 'faction' | 'sublocation' | 'location' | 'actor_fallback';
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

/**
 * Trace: an `agent_relocation` aftermath effect sent someone somewhere (THR-1142).
 *
 * `mode: 'travel'` means an intent was written and the agent has NOT moved — they
 * walk there through the ordinary movement system. `expiresAtTick` is absent for
 * an instant move, which has nothing to expire.
 */
export interface AgentRelocationTrace extends TraceBase {
  category: 'aftermath_agent_relocation';
  /** Human-readable destination name, for reading the trace without a graph lookup. */
  destination: string;
  destinationNodeId?: string;
  destinationHex: { col: number; row: number };
  mode: 'travel' | 'instant';
  expiresAtTick?: number;
  templateId?: string;
  // Attribution back to the ending that sent them.
  encounterId?: string;
  actionId?: string;
  reactionId?: string;
  effectIndex?: number;
}

/**
 * Trace: a `membership_change` aftermath effect moved one person in, out, or up a
 * faction (THR-1144).
 *
 * `oldRank`/`newRank` are on the `member_of` edge's canonical 0–1 scale and are
 * both present only for `rank_delta`; `join` reports the rank it started someone
 * at, `leave` the rank they left with.
 */
export interface MembershipChangeTrace extends TraceBase {
  category: 'aftermath_membership_change';
  factionId: string;
  op: 'join' | 'leave' | 'rank_delta';
  oldRank?: number;
  newRank?: number;
  /** Role string on the edge after the write, when one was written. */
  role?: string;
  templateId?: string;
  // Attribution back to the ending that moved them.
  encounterId?: string;
  actionId?: string;
  reactionId?: string;
  effectIndex?: number;
}

/**
 * Trace: a `reward_draw` aftermath effect drew a random prize (THR-1146).
 *
 * `roll` and `poolSize` are both recorded because together they make the draw
 * *re-derivable*: the same seed key and the same pool reproduce the same prize,
 * so a surprising item is diagnosable from the trace alone rather than by
 * replaying the encounter.
 *
 * `isBadOutcome` marks the draw that flipped to the harmful table — a failure
 * band mostly hands out a wound, not a blade, and the trace should say which
 * table it read.
 */
export interface RewardDrawTrace extends TraceBase {
  category: 'aftermath_reward_draw';
  /** The drawn template, and the instance it became on the recipient. */
  drawnTemplateId: string;
  instanceId: string;
  templateName?: string;
  tier?: number;
  attachmentCategory?: string;
  poolSize: number;
  roll: number;
  isBadOutcome: boolean;
  /** Who received it — may differ from the actor when the effect names a target. */
  recipientId: string;
  templateId?: string;
  // Attribution back to the ending that paid out.
  encounterId?: string;
  actionId?: string;
  reactionId?: string;
  effectIndex?: number;
}

/**
 * Trace: a `reward_draw` matched nothing and paid out nothing (THR-1146).
 *
 * This is the THR-844 rot class caught at runtime. `check:encounter` fails an
 * empty recipe at authoring time, so a live one means either the world has not
 * seeded the catalog this recipe wants, or the recipe reached a world where its
 * category genuinely has no candidates. Fail-soft by contract (NFP #4): the
 * encounter proceeds, and this trace is the only evidence — which is why it
 * carries the whole recipe rather than a summary.
 */
export interface RewardDrawEmptyTrace extends TraceBase {
  category: 'aftermath_reward_draw_empty';
  /** The categories and tags that matched nothing — enough to fix the content from. */
  categoryWeights: Readonly<Record<string, number>>;
  tagFilters?: readonly string[];
  isBadOutcome: boolean;
  recipientId: string;
  templateId?: string;
  encounterId?: string;
  actionId?: string;
  reactionId?: string;
  effectIndex?: number;
}

/**
 * Trace: a travel intent ended (THR-1142) — the agent reached the destination, or
 * gave up when the TTL lapsed.
 *
 * `relocation_expired` is not an error: an intent is a lean on the movement
 * scoring, so a mortal with a better reason to stay legitimately never arrives.
 */
export interface RelocationResolvedTrace extends TraceBase {
  category: 'relocation_arrived' | 'relocation_expired';
  agentName?: string;
  destination: string;
  destinationHex: { col: number; row: number };
  /** Ticks between the intent being written and this resolution. */
  ticksTaken: number;
  templateId?: string;
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

/**
 * Trace: a `reputation_with` edge moved (THR-1206).
 *
 * Emitted on every edge-leg write, including the mint. `cause` carries the effect id,
 * the migration tag, or `'decay'` — a standing that changed with no story behind it is
 * the failure mode this field exists to make impossible to miss (NFP #2).
 *
 * The membership and bond legs keep their own traces (`faction_reputation_changed`,
 * the trust helpers), because they are separate stores with separate consumers; this
 * one covers only the edge the unification added.
 */
export interface ReputationWithChangedTrace extends TraceBase {
  category: 'reputation_with_changed';
  /** a — whose standing moved. */
  sourceId: string;
  /** b — with whom, or where. A sublocation target is already resolved to its place. */
  targetId: string;
  delta: number;
  newScore: number;
  cause: string;
}

/**
 * Trace: a `reputation_with` edge decayed back to neutral and was deleted (THR-1206).
 *
 * The deletion is the fade-out, and it is what keeps the family sparse — so the prune
 * is traced rather than silent, or a standing would vanish from the profile with
 * nothing in the causal trail saying when or why.
 */
export interface ReputationWithPrunedTrace extends TraceBase {
  category: 'reputation_with_pruned';
  sourceId: string;
  targetId: string;
  finalScore: number;
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
  targetKind: 'agent' | 'faction' | 'sublocation' | 'location';
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
  targetKind: 'agent' | 'faction' | 'sublocation' | 'location';
  conditionTraitId: string;
  removedCount: number;
  encounterId: string;
  reactionId: string;
}

/**
 * Trace: a condition landed on a **place** (THR-1143).
 *
 * Emitted *in addition to* `condition_applied`, not instead of it — the generic
 * trace keeps carrying every condition write so existing readers are untouched,
 * and this one exists so "what is happening to the world's places" is one
 * category filter rather than a predicate over a mixed stream. `carrierKind`
 * distinguishes a hex from a settlement, which the node id alone does not.
 */
export interface LocationConditionAppliedTrace extends TraceBase {
  category: 'location_condition_applied';
  locationId: string;
  locationName: string;
  /** `hex` when the node carries terrain, else the location subtype, else 'location'. */
  carrierKind: string;
  conditionTemplateId: string;
  /** Live decay counter written to the edge. 0 = indefinite (no `ticksRemaining` written). */
  ticksRemaining: number;
  encounterId: string;
  reactionId: string;
}

/**
 * Trace: a committed nudge card charged a non-essence cost (THR-885).
 *
 * One per channel per commit, not one per card — the channels are summed across
 * the hand before they are charged, so a per-card trace would report deltas that
 * were never individually applied.
 */
export interface NudgeCostChargedTrace extends TraceBase {
  category: 'nudge_cost_charged';
  encounterId: string;
  channel: 'detection' | 'doom';
  /** Delta actually applied after clamping — not necessarily the one requested. */
  appliedDelta: number;
  /** Detection channel only. */
  regionId?: string;
  fromPressure?: number;
  toPressure?: number;
  /** Doom channel only. */
  tickModifier?: number;
}

/**
 * Trace: a nudge card's grant or cost failed to apply (THR-885).
 *
 * Fail-soft evidence. A host API that throws must not take the step's outcome or
 * the rest of the hand with it, so the throw is caught and recorded here instead.
 */
export interface NudgeDispatchFailedTrace extends TraceBase {
  category: 'nudge_dispatch_failed';
  encounterId: string;
  channel: 'grants' | 'detection' | 'doom';
  failReason: string;
}

/**
 * Trace: a sphere crossed an attunement mark (THR-1180).
 *
 * One per crossing per sphere, ever — the crossing window is half-open
 * (`before < threshold <= after`), so the mark is reported by the phase that
 * reaches it and by no later phase. That is what makes this readable as a
 * progression log rather than a per-tick level reading.
 *
 * `unlockedCardIds` names what the mark puts within reach *in the library*, not
 * what this god gained: the identity floor still gates access, so a god without
 * the sphere crosses the mark and holds nothing new. Carrying the list anyway
 * is deliberate — an empty array here would read as a broken counter when the
 * real answer is a locked sphere.
 *
 * Named `nudge_attunement_unlock` rather than the plan's dotted
 * `nudge.attunement_unlock`: every category in this union is snake_case, and one
 * dotted stray would be invisible to the category filters (NFP #2).
 */
export interface NudgeAttunementUnlockTrace extends TraceBase {
  category: 'nudge_attunement_unlock';
  sphere: SphereName;
  /** The mark crossed — a row of `SPHERE_ATTUNEMENT_THRESHOLDS`. */
  threshold: number;
  /** Library members gated on exactly this (sphere, threshold). May be empty. */
  unlockedCardIds: string[];
  /** Lifetime essence earned in `sphere` after the crossing. */
  earnedTotal: number;
}

/**
 * Trace: The Compulsion planted a decision urge on one mortal (THR-886).
 *
 * Carries the bias map rather than a summary number, because "why did this agent
 * pick a duel?" is answerable only if the weight that tilted them is legible
 * (NFP #2). Keyed per mortal — `agentId` is the dreamer, not a bystander.
 */
export interface CompulsionPlantedTrace extends TraceBase {
  category: 'compulsion_planted';
  compulsionId: string;
  /** Authored weights before scaling — the thing an author can compare to their template. */
  encounterBias: Readonly<Record<string, number>>;
  expiresTick: number;
  sourceEncounterId: string;
  sourceReactionId: string;
}

/**
 * Trace: a planted compulsion lapsed or was evicted at the cap (THR-886).
 *
 * `failReason: 'cap_evicted'` distinguishes the two, mirroring how `omen_decayed`
 * reports the same distinction — an urge that expired did its job, one that was
 * evicted never got the chance.
 */
export interface CompulsionDecayedTrace extends TraceBase {
  category: 'compulsion_decayed';
  compulsionId: string;
  livedTicks: number;
  failReason?: 'cap_evicted';
}

/**
 * Trace: an agent's ambition advanced, resolved, was assigned — or could not be
 * evaluated at all (THR-1285).
 *
 * `ambition_progress` has been in `TRACE_CATEGORIES` since TB-062 with **no declared
 * payload**, so it was absent from the `TraceEntry` union and all three of
 * `ambitionTick`'s emit sites were type errors against `TraceEntryInput`, sitting in
 * the THR-489 baseline. Declaring the payload here is the same fix THR-1175 applied to
 * `secret_discovered` / `favor_created` a few interfaces up, and for the same reason:
 * it removes those three rather than adding a fourth for this ticket's tripwire, and
 * the next author to emit one gets checked instead of baselined.
 *
 * Fields are optional beyond `category` because the sites carry different subsets — a
 * milestone emits `result` + `milestones`, an assignment emits `templateId`, and the
 * unevaluable-ambition tripwire emits `ambitionNodeId` + `reason` with no template to
 * name. Narrowing further would mean widening the emit sites to satisfy the type,
 * which is how a payload interface ends up asserted past with `as` instead of used.
 */
/**
 * Trace: faction-scale world movement — army spawn/movement/attrition, battle and siege
 * resolution, faction ambitions, and the lair lifecycle (escalation, clearing,
 * reinfestation).
 *
 * `faction_ambition` has been in `TRACE_CATEGORIES` since TB-062 with **no declared
 * payload**, so it was absent from the `TraceEntry` union and all 35 of its emit sites
 * were type errors against `TraceEntryInput` — every one of them written as
 * `as Parameters<typeof emitTrace>[0]` to get past it, and every one sitting in the
 * THR-489 baseline. Declaring the payload here is the same fix THR-1175 applied to
 * `secret_discovered` / `favor_created` and THR-1174 to `ambition_progress`, for the
 * same reason: it removes those errors rather than adding two more for THR-1319's
 * clearing traces, and the next author to emit one gets checked instead of baselined.
 *
 * Fields are optional beyond `category` because the sites carry genuinely different
 * subsets — an army row names `armyId`, a battle row `battleId`, a lair row
 * `locationId` — and several carry nothing but the summary. Narrowing further would
 * mean widening 35 emit sites to satisfy the type, which is how a payload interface
 * ends up asserted past with `as` instead of used.
 */
export interface FactionAmbitionTrace extends TraceBase {
  category: 'faction_ambition';
  /** Faction the row is about, where one owns it. */
  factionId?: string;
  /** Army the row is about — spawn, movement, attrition, disband. */
  armyId?: string;
  /** Battle or siege the row is about. */
  battleId?: string;
  /** Location the row is about — the lair lifecycle rows use this. */
  locationId?: string;
  /** What happened, when the site distinguishes several outcomes. */
  result?: string;
}

export interface AmbitionProgressTrace extends TraceBase {
  category: 'ambition_progress';
  actorId?: string;
  /** The ambition template, when the row is about one. Absent on the tripwire. */
  templateId?: string;
  /** Graph node id of the ambition — the tripwire's subject. */
  ambitionNodeId?: string;
  /** What happened: milestone reached, ambition resolved, ambition assigned. */
  result?: string;
  /** Completed milestone ids at the time of the row. */
  milestones?: string[];
  /** Discriminates the tripwire row (`'skipped'`) from the progress rows. */
  event?: string;
  /** Why the ambition could not be evaluated — see `AmbitionSkipReason`. */
  reason?: string;
}

/**
 * Trace: a social-leverage edge was written, or was not (THR-1175).
 *
 * `secret_discovered` and `favor_created` have been in `TRACE_CATEGORIES` since
 * THR-30 with **no declared payload**, so they were absent from the `TraceEntry`
 * union and every one of their five emit sites was a type error against
 * `TraceEntryInput`. Six errors sat in the THR-489 baseline for it. Declaring the
 * payloads is the actual fix: it removes those six rather than adding a seventh
 * and eighth for this ticket's new refusal traces, and it means the next author
 * to emit one gets checked instead of baselined.
 *
 * Fields are optional beyond `category` because the five sites legitimately carry
 * different subsets — the orchestrator and `secretsFromResolution` emit success
 * only, the aftermath applier emits success *and* three failure shapes, and the
 * graph layer emits refusals that have no encounter around them at all. A
 * narrower type would have to be satisfied by widening the emit sites, which is
 * how a payload interface ends up asserted past with `as` instead of used.
 */
export interface SocialLeverageEdgeTrace extends TraceBase {
  category: 'secret_discovered' | 'favor_created';
  /** Encounter-scoped provenance, when the write came from an aftermath effect. */
  encounterId?: string;
  actionId?: string;
  reactionId?: string;
  effectIndex?: number;
  effectKind?: string;
  encounterContext?: string;
  /** Legacy sibling of `category`, still emitted by the orchestrator. */
  event?: string;
  success?: boolean;
  failReason?: string;
  /** `owes_favor` endpoints. */
  debtorId?: string;
  creditorId?: string;
  context?: string;
  /** `knows_secret_of` endpoints. */
  discovererId?: string;
  subjectId?: string;
  secretType?: string;
  source?: string;
  targetId?: string;
  magnitude?: number;
  /**
   * Endpoint-refusal detail (THR-1175). `refusedRole` says which end was wrong
   * and `foundNodeType`/`foundActorType` say what it actually was, because
   * "refused" on its own does not tell a content author what to change.
   */
  edgeType?: 'owes_favor' | 'knows_secret_of';
  refusedRole?: 'debtor' | 'creditor' | 'discoverer' | 'subject';
  refusedNodeId?: string;
  foundNodeType?: string;
  foundActorType?: string;
  debtorNodeType?: string;
  debtorActorType?: string;
  /** Whether the content named its debtor, or fell back to the action target. */
  debtorDeclared?: boolean;
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
  reason: 'target_node_missing' | 'target_kind_not_supported' | 'condition_template_missing' | 'no_actor_id' | 'participant_unresolved' | 'multiple_targets_specified'
    // THR-1206 — a `reputation_with` that named nobody to have standing with. The
    // target resolver falls back to the actor when no counterparty field is set, and
    // standing with yourself is not a thing, so the arm refuses loudly rather than
    // minting a self-edge no consumer can read.
    | 'no_counterparty';
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
  | SocialLeverageEdgeTrace
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
  | EdgeSchemaRefusedTrace
  // Effect vocabulary activation (THR-1239)
  | EffectEventRaisedTrace
  | EffectChargeSpentTrace
  | EffectOverlayTrace
  | RuleOverrideConsumedTrace
  | EffectSuppressedTrace
  | EffectRevealedTrace
  | BindingDecisionTrace
  | BindingSeveredTrace
  | BinderMintTrace
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
  | MandateMilestoneProseTrace
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
  | UndertakingOutcomeEventTrace
  | GrievanceTransitionTrace
  | AmbitionDisplacedTrace
  | UndertakingCheckpointTrace
  | UndertakingForkTrace
  | FollowChangeTrace
  | MomentSurfaceTrace
  | CallingChangeTrace
  | DecisionBoardComparisonTrace
  | DecisionBoardErrorTrace
  | StrategicWorldChangeTrace
  | StrategicControlLifecycleTrace
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
  | ReputationWithChangedTrace
  | ReputationWithPrunedTrace
  | ReputationSetAppliedTrace
  | ConditionAppliedTrace
  | LocationConditionAppliedTrace
  | ConditionRemovedTrace
  | AftermathTargetInvalidTrace
  // Nudge card dispatch (THR-885)
  | NudgeCostChargedTrace
  | NudgeDispatchFailedTrace
  | NudgeAttunementUnlockTrace
  | CompulsionPlantedTrace
  | CompulsionDecayedTrace
  | AmbitionProgressTrace
  | FactionAmbitionTrace
  // Scene-targeting aftermath sentinels + bond_change (THR-695, Slice B)
  | AftermathSentinelBoundTrace
  | BondChangeAppliedTrace
  | AgentRelocationTrace
  | MembershipChangeTrace
  | RewardDrawTrace
  | RewardDrawEmptyTrace
  | RelocationResolvedTrace
  // Companions (THR-1096)
  | CompanionJoinedTrace
  | CompanionDepartedTrace
  // Seed system v2: family matching + context inheritance (THR-697, Slice D)
  | SeedFamilyMatchedTrace
  | SeedContextInheritedTrace
  // (Initiative traces retired with the pipeline — THR-1292 §3)
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
  // Economic scheme family traces (THR-619)
  | RivalSchemeStockDrainedTrace
  | RivalSchemeRouteSeveredTrace
  | RivalSchemeSourceContestedTrace
  | RivalSchemeSourceDesecratedTrace
  // Notable agenda traces (THR-630)
  | NotableAgendaLaunchedTrace
  | NotableAgendaPhaseAdvancedTrace
  | NotableAgendaCounteredTrace
  | NotableAgendaCompletedTrace
  | NotableRosterScanTrace
  // Route event traces (THR-669)
  | RouteEventScanTrace
  | RouteEventSeededTrace
  // Army supply traces (THR-626)
  | ArmySupplyScanTrace
  | ArmySupplySeededTrace
  // Economic power traces (THR-617)
  | MonopolyTransitionTrace
  | EconomicPowerScanTrace
  | ScarcityArcPhaseTrace
  // Company traces (THR-74)
  | GroupPhaseTrace
  | GroupFormedTrace
  | GroupDissolvedTrace
  // NPC bands (THR-731)
  | BandSpawnedTrace
  | GroupContestedTrace
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
  // Off-screen guild work for ambient members (THR-815)
  | FactionMemberWorkTrace
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
  | PlayerReceiptTrace
  // World-minted ambitions (THR-726)
  | AmbitionMintedTrace
  // Agent residence (THR-822)
  | AgentResidenceTrace
  // Nudge Model — WS0 engine substrate (THR-773)
  | NudgePlayedTrace
  | AgentBrokenTrace
  | AgentMendedTrace
  // Nudge Model — WS6 Meet The First conversion (THR-868)
  | MeetingTestResolvedTrace
  | MeetingBondResolvedTrace
  // Retrofitted from the orphaned-payload set (THR-1065). Each declared a
  // `category` literal and an authored payload, but was never a union member —
  // so `trace.category === '<its literal>'` was a TS2367 "no overlap" error and
  // every consumer laundered it through `as string`.
  //
  // Named one-by-one rather than via the `EncounterExperienceTraceEntry` /
  // `MentorshipTraceEntry` aggregate aliases: the ratchet in
  // `src/types/__tests__/trace-vocabulary.test.ts` scans this declaration at
  // SOURCE level, deliberately, so an alias would satisfy the type checker while
  // leaving the gate unable to see which interfaces are covered.
  | TickHealthTrace
  | TickCrashTrace
  | SelfActionTrace
  | SurveyProseComposedTrace
  | KpiSnapshotTrace
  | ChoiceResolvedTrace
  | ForecastComputedTrace
  | HandFilteredTrace
  | DriftThresholdCrossedTrace
  | BranchDecidedTrace
  | DetectionThresholdCrossedTrace
  | ItemConsumedByChoiceTrace
  | SpotlightChangedTrace
  | CallbackEligibilityComputedTrace
  | MentorshipOfferedTrace
  | MentorshipStartedTrace
  | MentorshipLessonTrace
  | MentorshipGraduatedTrace
  | MentorshipSurpassedTrace
  | MentorshipSeveredTrace;

/**
 * `Omit` that distributes over a union instead of collapsing it (THR-1065).
 *
 * Plain `Omit<A | B, K>` is not a union of omits — it resolves `keyof (A | B)` to
 * the keys A and B *share*, producing ONE object type carrying only the common
 * fields. Applied to `TraceEntry` that means every category-specific field
 * (`encounterId`, `finalTier`, `channel`, …) becomes an excess property, and the
 * only way to emit a faithful payload is `as unknown as`. That is the mechanism
 * behind the 81 casts at emitTrace boundaries, and behind THR-1082 raising the
 * typecheck baseline rather than dropping fields from a trace.
 *
 * The naked type parameter is what makes the conditional distributive — this is
 * load-bearing, not stylistic. Inlining the body without `T extends unknown ?`
 * silently restores the collapse.
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * What a caller passes to `emitTrace` (THR-1065).
 *
 * `id` and `timestamp` are assigned by the buffer. `summary` is optional *here
 * and only here*: `normalizeTraceEntry` synthesizes one from `summary` →
 * `message` → `type:action` → `trace:<category>` before the entry is stored, so
 * the runtime has always tolerated its absence, while `TraceEntry` itself keeps
 * `summary` required for every reader. Requiring it at the input boundary would
 * force ~15 payload interfaces that never declared one to grow a field their
 * emit sites do not supply.
 */
type TraceInputOf<T> = T extends unknown
  ? Omit<T, 'id' | 'timestamp' | 'summary'> & { summary?: string }
  : never;

export type TraceEntryInput = TraceInputOf<TraceEntry>;

/**
 * Trace: residence observed across every individual actor this interval (THR-822).
 *
 * Emitted from `phaseAmbitionProgress`, which is an all-agents phase — so this is ONE
 * aggregate entry per tick, never one per agent. `moved + firstSightings` is the count
 * of actor nodes written this interval; a run where `moved` is persistently zero means
 * the world has gone static, and one where `noPosition` is large means agents are
 * losing their `located_at` edges.
 */
export interface AgentResidenceTrace extends TraceBase {
  category: 'agent_residence';
  /** Individual actors walked. */
  observed: number;
  /** Agents observed at a different position than last interval. */
  moved: number;
  /** Agents observed for the first time — origin recorded on this pass. */
  firstSightings: number;
  /** Agents still at the position they were last observed at. */
  unchanged: number;
  /** Agents with no `located_at` edge; left unrecorded rather than given a false arrival. */
  noPosition: number;
}

/**
 * Trace: the player committed a nudge into an attended encounter step (THR-773).
 *
 * Player-action-driven and therefore low volume — a handful per session, one
 * entry per play. This is *not* an all-agents phase, so the aggregate-batching
 * rule does not apply.
 */
export interface NudgePlayedTrace extends TraceBase {
  category: 'nudge_played';
  actionId: string;
  templateId: string;
  nudgeId: string;
  essenceSpent: number;
  forecastBefore: import('./traces/encounter-traces').ForecastTier;
  forecastAfter: import('./traces/encounter-traces').ForecastTier;
  /** Rider carried by this nudge, when it has one. */
  rider?: string;
}

/**
 * Trace: a mortal entered the broken state (THR-773).
 *
 * Fires on **transition only** — never per tick, never per agent per tick. The
 * quintessence phase reconciles every actor each tick; only the ones that
 * actually crossed emit.
 */
export interface AgentBrokenTrace extends TraceBase {
  category: 'agent_broken';
  agentId: string;
  /** Quintessence ratio at the moment of the crossing. */
  ratio: number;
  cause: string;
}

/** Trace: a broken mortal mended back into the story (THR-773). Transition-only. */
export interface AgentMendedTrace extends TraceBase {
  category: 'agent_mended';
  agentId: string;
  ticksBroken: number;
}

/**
 * Trace: a formative test's fate roll resolved during Meet The First (THR-868).
 *
 * Player-driven and once-per-game: at most `MEETING_FORMATIVE_TEST_COUNT` of
 * these ever exist in a run, so one entry per resolution — the aggregate-batching
 * rule governs all-agents tick phases, and the meeting is neither.
 *
 * `netLean` against `writtenPole` is the diagnostic that matters: the two
 * disagreeing is the design working (fate overrode the god's argument), and
 * `netLean: 'none'` on every entry across a session means the authored hands are
 * not carrying pole leans at all.
 */
export interface MeetingTestResolvedTrace extends TraceBase {
  category: 'meeting.test_resolved';
  /** Which formative test in the sequence (0-indexed). */
  testIndex: number;
  /** Converted dilemma template this test was drawn from. */
  templateId: string;
  valuePair: import('./agent').ValuePair;
  /** Pole lean of the played hand, before fate. */
  netLean: 'a' | 'b' | 'none';
  playedNudgeIds: string[];
  /** Resolved band on the shared six-value ladder. */
  band: import('./unifiedAction').StepOutcome;
  /** The pole the band actually wrote. */
  writtenPole: 'a' | 'b';
  /** Signed shift applied, relative to pole `a`. */
  shift: number;
  /** Erosion this band cost, before the floor clamp. 0 on non-scarring bands. */
  quintessenceErosion: number;
  essenceSpent: number;
}

/**
 * Trace: the bond test resolved, closing Meet The First (THR-868).
 *
 * Exactly one per completed meeting. `startingQuintessence` is the post-clamp
 * value actually written to the agent node — if it ever equals
 * `MEETING_QUINTESSENCE_FLOOR`, the floor did real work and the scar constants
 * are worth a look.
 */
export interface MeetingBondResolvedTrace extends TraceBase {
  category: 'meeting.bond_resolved';
  band: import('./unifiedAction').StepOutcome;
  /** awe | devotion | bargain | doubt | defiance */
  receptionId: string;
  playedNudgeIds: string[];
  /** Starting quintessence after scarring, post-floor. */
  startingQuintessence: number;
}

/**
 * Trace: the world minted ambitions from events this re-eval tick (THR-726).
 * ONE aggregate entry per tick — never per-agent (trace-volume rule) — so an
 * all-agents scan never floods the buffer.
 */
export interface AmbitionMintedTrace extends TraceBase {
  category: 'ambition_minted';
  /** Total ambitions minted across all agents this tick. */
  mintedCount: number;
  /** Count of mints by the originating event class. */
  byEventClass: Record<string, number>;
  /** Capped sample of agent ids that received a minted ambition. */
  sampleAgentIds: string[];
  /**
   * How many of this tick's mints were grievances rather than ordinary wants
   * (THR-1298). The ratio against `mintedCount` is the vendetta-monoculture reading the
   * plan's kill criterion is measured on.
   */
  grievanceCount?: number;
  /** Capped sample of the hands those grievances are held against. */
  sampleCulpritAgentIds?: string[];
  /** How many of this tick's grievance mints took a full mortal's secondary want (THR-1383). */
  displacedCount?: number;
}

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

// ─── Economic scheme family traces (THR-619) ─────────────────────

/** Trace: an economic scheme's `drain_stock` move soured a resource. */
export interface RivalSchemeStockDrainedTrace extends TraceBase {
  category: 'rival.scheme_stock_drained';
  rivalId: string;
  compositionId: string;
  targetNodeId: string;
  /** Which resource class was drained (the target's richest). */
  resourceId: string;
  quantityBefore: number;
  quantityAfter: number;
}

/**
 * Trace: an economic scheme's `sever_route` move cut trade conduits and blinded
 * the region (the Flow Web nervous-system coupling).
 */
export interface RivalSchemeRouteSeveredTrace extends TraceBase {
  category: 'rival.scheme_route_severed';
  rivalId: string;
  compositionId: string;
  targetNodeId: string;
  /** Trade partners whose `trades_with` conduit was cut. */
  severedPartnerIds: string[];
  /** Region whose intelligence went dark; absent when the target has no region. */
  region?: string;
  /** How many of the player's intelligence records lost reliability. */
  intelRecordsDegraded: number;
}

/**
 * Trace: a profane scheme's `contest_source` move opened a rival drain on one of
 * the player's essence sources (THR-621). The source flips to the `contested`
 * tier; the Defend leg is the counter.
 */
export interface RivalSchemeSourceContestedTrace extends TraceBase {
  category: 'rival.scheme_source_contested';
  rivalId: string;
  compositionId: string;
  /** Host node carrying the contested `essenceSource` bag. */
  targetNodeId: string;
  /** Source taxonomy row (`shrine`, `placeOfPower`, …). */
  sourceKind: string;
  /** Public tier the source held before the drain opened. */
  tierBefore: string;
  /** Essence per tick this drain redirects from the player at open. */
  drainPerTick: number;
}

/**
 * Trace: a profane scheme's `desecrate_source` move profaned a source the rival
 * had held for the whole arc (THR-621) — or found it warded and landed on
 * nothing, which is the Defend leg working.
 */
export interface RivalSchemeSourceDesecratedTrace extends TraceBase {
  category: 'rival.scheme_source_desecrated';
  rivalId: string;
  compositionId: string;
  targetNodeId: string;
  /** False when the player warded the source before the crack beat landed. */
  desecrated: boolean;
  /** Essence per tick now redirected from the player to this rival. */
  drainPerTick: number;
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

/**
 * Trace: one aggregate army-supply scan (THR-626). One per scan tick regardless
 * of army count — per-army detail rides `supplyLines`, which stays small because
 * armies are faction-scale and few.
 */
export interface ArmySupplyScanTrace extends TraceBase {
  category: 'army_supply_scan';
  armiesScanned: number;
  cutOff: number;
  strained: number;
  starving: number;
  seedsPlanted: number;
  supplyLines: ReadonlyArray<{
    armyId: string;
    hostId: string | null;
    hops: number | null;
    threatened: boolean;
    throughput: number;
    supplyBefore: number;
    supplyAfter: number;
    tier: 'supplied' | 'strained' | 'starving';
  }>;
}

/** Trace: a starving-army anomaly materialized into an encounter seed (THR-626). */
export interface ArmySupplySeededTrace extends TraceBase {
  category: 'army_supply_seeded';
  armyId: string;
  anomaly: 'forage' | 'mutiny' | 'siege_lifted';
  templateId: string;
  targetAgentId: string;
  supplyTier: 'supplied' | 'strained' | 'starving';
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
  /**
   * THR-728: True when the player safety floor rewrote a player cast's
   * failure/critical_failure into success_at_cost. Stacked after, and kept
   * distinct from, `floorUpgradeApplied` — that one reports an incapable actor
   * scraping through the scale floor, this one reports that a paid divine cast
   * cannot outright fail. Absent/false for every NPC resolution.
   */
  playerFloorApplied?: boolean;
  /**
   * THR-74: the company this step was resolved for, when the actor belongs to
   * one and the template is group-eligible. Present → `capability` above is the
   * *acting member's* capability, not the nominal actor's, and `actionModifiers`
   * includes the company's assist + cohesion bonus. Absent → an ordinary
   * individual resolution, unchanged.
   */
  groupId?: string;
  /** THR-74: the member substituted in for this step's reach. */
  actingMemberId?: string;
  /** THR-74: how many companions cleared the assist tier gate. */
  groupAssistCount?: number;
  /** THR-74: assist + cohesion bonus folded into `actionModifiers`. */
  groupBonus?: number;
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
  /** Threaded companies that crossed below the fray line and fired an authored moment this tick. */
  frayMomentsFired: number;
  /** Threaded companies whose founding fired a Seeking Companions moment this tick. */
  seekingMomentsFired: number;
  /** Companies re-formed under an open Reunite window this tick (THR-732). */
  reunionMomentsFired: number;
  /** Reunite windows that closed unanswered this tick (THR-732). */
  reunionLapsesFired: number;
}

/** Trace: a company came into being. Event-scale — rare, one per formation. */
export interface GroupFormedTrace extends TraceBase {
  category: 'group_formed';
  groupId: string;
  groupType: 'party' | 'squad' | 'faction_band';
  name: string;
  memberIds: string[];
  /** Mirrors `GroupFormationCause` (groupQueries.ts) — kept inline to avoid a types→engine import. */
  cause: 'systemic' | 'seeking_companions' | 'draw_together' | 'band_spawn' | 'reunite' | 'raised_warband';
  startingCohesion: number;
}

/**
 * Trace: a faction fielded an NPC band (THR-731). Event-scale — rare, one per
 * spawn, same class as `group_formed` (which also fires for the band's node).
 * This carries the *why*: which faction, in which role, answering what.
 */
export interface BandSpawnedTrace extends TraceBase {
  category: 'band_spawned';
  groupId: string;
  groupName: string;
  factionId: string;
  factionName: string;
  bandRole: 'raider' | 'defender';
  memberIds: string[];
  /** Members the faction still holds in reserve after fielding this band. */
  membersRemaining: number;
}

/**
 * Trace: a company and a band resolved as one contested pair (THR-731).
 *
 * Event-scale — one per engagement, not per tick. Carries both group ids and every
 * consequence applied, so "why did that company lose someone?" is answerable from
 * the trace alone without replaying the resolution.
 */
export interface GroupContestedTrace extends TraceBase {
  category: 'group_contested';
  initiatorActionId: string;
  /** Synthetic — the band's counter never enters `state.unifiedActions`. */
  counterActionId: string;
  initiatorGroupId: string;
  bandGroupId: string;
  verdict: 'initiator_won' | 'band_won' | 'mutual_failure';
  /** Absent on `mutual_failure`: nobody won, so nobody is the winner. */
  winnerGroupId?: string;
  loserGroupId?: string;
  winnerCohesionDelta: number;
  loserCohesionDelta: number;
  /** Set only when a decisive loss killed a member. */
  casualtyId?: string;
  /** False when the two groups already carried a standing rivalry. */
  grudgeWritten: boolean;
}

/** Trace: a company ended. The node persists as `disbanded` history. */
export interface GroupDissolvedTrace extends TraceBase {
  category: 'group_dissolved';
  groupId: string;
  reason: 'cohesion_floor' | 'goal_complete' | 'leader_death' | 'betrayal' | 'undersize';
  finalCohesion: number;
  ticksActive: number;
}

// ─── Companions (THR-1096) ──────────────────────────────────────

/** Trace: a companion joined a bearer's side. Raw contributions, never banded. */
export interface CompanionJoinedTrace extends TraceBase {
  category: 'companion_joined';
  bearerId: string;
  companionId: string;
  companionName: string;
  templateId: string;
  /** Encounter or action id that brought them. */
  source: string;
  /** Raw capability points — traces keep numbers. */
  contributions: Record<string, number>;
  /** Present for contracted companions only. */
  ticksRemaining?: number | null;
}

/** Trace: a companion left. Never silent — every departure has a named reason. */
export interface CompanionDepartedTrace extends TraceBase {
  category: 'companion_departed';
  bearerId: string;
  companionId: string;
  companionName: string;
  templateId: string;
  reason: 'contract_ended' | 'lured_away' | 'story' | 'bearer_missing';
  /** Ticks the companion spent at the bearer's side. */
  ticksAccompanied: number;
}
