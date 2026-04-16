import { describe, it, expect } from 'vitest';
import type {
  TraceBase,
  ActionSelectionTrace,
  NarrativeGenerationTrace,
  ContextHarvestTrace,
  DilemmaResolutionTrace,
  TickSummaryTrace,
  TraceEntry,
  TraceCategory,
} from '../trace';
import { TRACE_CATEGORIES } from '../trace';

describe('TraceEntry types', () => {
  it('TRACE_CATEGORIES contains core categories', () => {
    expect(TRACE_CATEGORIES.length).toBeGreaterThan(0);
    expect(TRACE_CATEGORIES).toContain('action_selection');
    expect(TRACE_CATEGORIES).toContain('narrative_generation');
    expect(TRACE_CATEGORIES).toContain('context_harvest');
    expect(TRACE_CATEGORIES).toContain('dilemma_resolution');
    expect(TRACE_CATEGORIES).toContain('tick_summary');
    expect(TRACE_CATEGORIES).toContain('encounter_resolution');
    expect(TRACE_CATEGORIES).toContain('familiarity_change');
    expect(TRACE_CATEGORIES).toContain('intervention_effect');
    expect(TRACE_CATEGORIES).toContain('action_execution');
    expect(TRACE_CATEGORIES).toContain('modifier_resolution');
    expect(TRACE_CATEGORIES).toContain('prosperity_tick');
    expect(TRACE_CATEGORIES).toContain('wealth_delta');
    expect(TRACE_CATEGORIES).toContain('trade_route_volume_change');
    expect(TRACE_CATEGORIES).toContain('trade_route_dissolved');
    expect(TRACE_CATEGORIES).toContain('settlement_tier_change');
    expect(TRACE_CATEGORIES).toContain('target_action_filter');
    expect(TRACE_CATEGORIES).toContain('road_hex_transition');
    expect(TRACE_CATEGORIES).toContain('agent_reroute');
    expect(TRACE_CATEGORIES).toContain('doom_card');
    expect(TRACE_CATEGORIES).toContain('mandate_checkpoint');
    // Phase 11: agent revelation system
    expect(TRACE_CATEGORIES).toContain('agent_revelation');
    expect(TRACE_CATEGORIES).toContain('interaction_depth');
  });

  it('ActionSelectionTrace satisfies TraceEntry union', () => {
    const trace: TraceEntry = {
      id: 1,
      tick: 5,
      timestamp: Date.now(),
      category: 'action_selection',
      agentId: 'a1',
      summary: 'Kael chose RAID',
      stages: [{ stageName: 'goal_alignment', candidateIds: ['raid'], scores: [0.8] }],
      finalPick: {
        actionId: 'raid_01',
        actionName: 'RAID',
        score: 0.82,
        probability: 0.4,
        roll: 0.3,
      },
    };
    expect(trace.category).toBe('action_selection');
  });

  it('NarrativeGenerationTrace satisfies TraceEntry union', () => {
    const trace: TraceEntry = {
      id: 2,
      tick: 5,
      timestamp: Date.now(),
      category: 'narrative_generation',
      summary: 'Notable prose generated',
      tier: 'notable',
      finalProse: 'Kael struck with fury.',
      sphereWords: ['blazing', 'struck'],
      personalityClause: 'driven by loyalty',
    };
    expect(trace.category).toBe('narrative_generation');
  });

  it('ContextHarvestTrace satisfies TraceEntry union', () => {
    const trace: TraceEntry = {
      id: 3,
      tick: 5,
      timestamp: Date.now(),
      category: 'context_harvest',
      agentId: 'a1',
      summary: 'Context built',
      harvestedCount: 12,
      rankedTop: [{ nodeId: 'n1', name: 'Sword', score: 0.9 }],
      selectedIds: ['n1'],
      oppositionTension: 0.65,
    };
    expect(trace.category).toBe('context_harvest');
  });

  it('DilemmaResolutionTrace satisfies TraceEntry union', () => {
    const trace: TraceEntry = {
      id: 4,
      tick: 5,
      timestamp: Date.now(),
      category: 'dilemma_resolution',
      agentId: 'a1',
      summary: 'Dilemma resolved',
      targetId: 'a2',
      actorStrategy: 'tit-for-tat',
      targetStrategy: 'grudger',
      actorMove: 'cooperate',
      targetMove: 'cooperate',
      outcome: 'mutual_trust',
      stakes: 0.7,
      sentimentDelta: 0.15,
      reputationDeltas: { actor: 0.05, target: 0.05 },
    };
    expect(trace.category).toBe('dilemma_resolution');
  });

  it('TickSummaryTrace satisfies TraceEntry union', () => {
    const trace: TraceEntry = {
      id: 5,
      tick: 5,
      timestamp: Date.now(),
      category: 'tick_summary',
      summary: 'Tick 5 complete',
      phaseEventCounts: { agent_actions: 3 },
      agentsProcessed: 5,
      doomStage: 1,
      essenceTotal: 75,
      mandateProgress: 0.3,
    };
    expect(trace.category).toBe('tick_summary');
  });

  it('TRACE_CATEGORIES covers all TraceEntry union category values (no silent drift — THR-111)', () => {
    // Enumerate every category string that appears as a `category` field in the
    // TraceEntry discriminated union. Update this list whenever you add a new
    // TraceEntry subtype. The TraceCategory type annotation catches any misspelling
    // at compile time; the TRACE_CATEGORIES.includes() check catches omissions at
    // runtime (DebugPanel filter would hide the traces silently otherwise).
    const traceEntryCategories: TraceCategory[] = [
      // Core pipeline
      'action_selection', 'narrative_generation', 'context_harvest',
      'dilemma_resolution', 'tick_summary', 'encounter_resolution',
      'familiarity_change', 'movement', 'intervention_effect',
      'action_execution', 'modifier_resolution',
      // Economy
      'prosperity_tick', 'wealth_delta',
      'trade_route_volume_change', 'trade_route_dissolved',
      'settlement_tier_change',
      // Filtering & scoring
      'target_action_filter', 'encounter_awareness', 'faction_awareness',
      'encounter_cache', 'encounter_filter', 'idle_decision', 'encounter_scoring',
      // Movement & routing
      'hex_state', 'unrest_tick', 'saturation_tick',
      'economic_chronicle', 'road_hex_transition', 'agent_reroute',
      'return_resolution', 'ripple_consequence',
      // Control effects
      'control_effect',
      // Doom & mandate
      'doom_card', 'mandate_checkpoint',
      // Revelation system
      'revelation', 'agent_revelation', 'interaction_depth',
      // Reputation & rarity
      'reputation_trait', 'rarity_graduation', 'rarity_importance',
      // Attention tier
      'encounter_promotion', 'curator_decision', 'attention_pool', 'story_beat_queue',
      // Slot system
      'slot_overflow', 'slot_disposal', 'condition_overflow', 'slot_expansion',
      // Settlement genome
      'settlement_genome', 'settlement_reassessment', 'culture_generation', 'culture_sublocation',
      // Strategic actions
      'strategic_candidate_board', 'strategic_action_started',
      'strategic_project_progress', 'strategic_world_change',
      // Tick health
      'tick_health', 'tick_crash',
      // Graph ops (previously missing from TRACE_CATEGORIES — THR-111 fix)
      'graph_op_execution',
      // Choice set (previously missing from TRACE_CATEGORIES — THR-111 fix)
      'choice_set_player_resolved', 'choice_set_player_dismissed',
      // Omen agenda (THR-19)
      'omen_selection', 'omen_beat',
      // Encounter aftermath traces (THR-111)
      'encounter_aftermath_applied', 'encounter_aftermath_effect',
      'encounter_seed_planted', 'encounter_seed_triggered',
      'hidden_mark_placed', 'hidden_mark_revealed',
      'intelligence_granted', 'authored_attachment_created',
      // Complication outcome traces (THR-20)
      'complication_selection',
    ];
    for (const cat of traceEntryCategories) {
      expect(TRACE_CATEGORIES).toContain(cat);
    }
  });

  it('discriminated union narrows correctly on category', () => {
    const trace: TraceEntry = {
      id: 1,
      tick: 1,
      timestamp: Date.now(),
      category: 'action_selection',
      summary: 'test',
      stages: [],
      finalPick: { actionId: 'x', actionName: 'X', score: 0, probability: 0, roll: 0 },
    };
    if (trace.category === 'action_selection') {
      expect(trace.stages).toBeDefined();
      expect(trace.finalPick).toBeDefined();
    }
  });
});
