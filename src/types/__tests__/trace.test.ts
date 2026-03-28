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
  it('TRACE_CATEGORIES has 37 categories', () => {
    expect(TRACE_CATEGORIES).toHaveLength(37);
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
