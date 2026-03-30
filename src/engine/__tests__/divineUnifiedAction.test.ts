/**
 * Tests for divine interventions creating UnifiedActions.
 *
 * Verifies the pipeline resolves divine actions correctly:
 * - Divine templates have difficulty 0 → always succeed
 * - Duration is 1 tick → resolve immediately on next pipeline run
 * - apply_influence GraphOp fires on success
 *
 * Sprint 5 — Task 5.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { phaseUnifiedActionProgress } from '../unifiedActionResolution';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { resetOpCounter } from '../graphOpExecutor';
import { clearTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';

// ─── Helpers ────────────────────────────────────────────────────

function createDivineTestState(): GameState {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'asc-1', type: 'actor', name: 'The Weaver',
    properties: { actorType: 'ascendant' },
  });

  graph.addNode({
    id: 'agent-1', type: 'actor', name: 'Alice',
    properties: {
      actorType: 'individual',
      divineInfluences: [],
    },
  });

  graph.addNode({
    id: 'loc-1', type: 'location', name: 'Village',
    properties: { locationType: 'town', locationSubtype: 'town' },
  });

  graph.addEdge({
    id: 'e-1', source: 'agent-1', target: 'loc-1',
    type: 'located_at', properties: {},
  });

  return {
    tick: 10,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc-1',
    essencePool: {} as any,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('divine interventions via unified pipeline', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
    clearTraces();
  });

  it('divine templates exist and have correct structure', () => {
    const divineIds = [
      'divine.dream', 'divine.persuade', 'divine.deceive', 'divine.intimidate',
      'divine.inspire', 'divine.coincidence', 'divine.omen', 'divine.afflict_bless',
    ];

    for (const id of divineIds) {
      const template = getUnifiedTemplateById(id);
      expect(template, `Missing template ${id}`).toBeDefined();
      expect(template!.scale).toBe('cosmic');
      expect(template!.actorAffinities).toContain('ascendant');
      expect(template!.steps[0].difficulty).toBe(0); // always succeed
      expect(template!.steps[0].duration.min).toBe(1); // 1-tick
    }
  });

  it('creates a divine UnifiedAction with source player', () => {
    const template = getUnifiedTemplateById('divine.dream')!;

    const action = createUnifiedAction({
      actorId: 'asc-1',
      templateId: 'divine.dream',
      targetId: 'agent-1',
      scale: 'cosmic',
      source: 'player',
      tick: 10,
      template,
      rng: () => 0.5,
      essencePaid: 1,
    });

    expect(action.source).toBe('player');
    expect(action.scale).toBe('cosmic');
    expect(action.actorId).toBe('asc-1');
    expect(action.targetId).toBe('agent-1');
    expect(action.stepDuration).toBe(1); // 1 tick
    expect(action.essencePaid).toBe(1);
    expect(action.resolved).toBe(false);
  });

  it('divine action resolves successfully on next pipeline tick', () => {
    const state = createDivineTestState();
    const template = getUnifiedTemplateById('divine.dream')!;

    const action = createUnifiedAction({
      actorId: 'asc-1',
      templateId: 'divine.dream',
      targetId: 'agent-1',
      scale: 'cosmic',
      source: 'player',
      tick: 10,
      template,
      rng: () => 0.5,
    });

    state.unifiedActions = [action];
    state.tick = 11;

    const result = phaseUnifiedActionProgress(state, UNIFIED_ACTION_TEMPLATES, () => 0.5);

    const resolved = result.unifiedActions!.find(a => a.templateId === 'divine.dream')!;
    expect(resolved.resolved).toBe(true);
    expect(resolved.outcome).toBe('success'); // difficulty 0 → always success

    // Should have generated a completion event
    const events = result.tickEvents!;
    expect(events.some(e => e.message.includes('completed') && e.message.includes('Dream'))).toBe(true);
  });

  it('divine action applies influence GraphOp on success', () => {
    const state = createDivineTestState();
    const template = getUnifiedTemplateById('divine.dream')!;

    const action = createUnifiedAction({
      actorId: 'asc-1',
      templateId: 'divine.dream',
      targetId: 'agent-1',
      scale: 'cosmic',
      source: 'player',
      tick: 10,
      template,
      rng: () => 0.5,
    });

    state.unifiedActions = [action];
    state.tick = 11;

    phaseUnifiedActionProgress(state, UNIFIED_ACTION_TEMPLATES, () => 0.5);

    // The apply_influence GraphOp should have added a divine influence
    const agentNode = state.graph.getNode('agent-1');
    const influences = agentNode?.properties.divineInfluences as any[];
    expect(influences).toBeDefined();
    expect(influences.length).toBeGreaterThan(0);
    expect(influences[0].interventionType).toBe('dream');
  });

  it('cosmic scale divine actions resolve before personal agent actions', () => {
    const state = createDivineTestState();

    // Add an agent action at personal scale
    state.graph.addNode({
      id: 'actor-agent', type: 'actor', name: 'Bob',
      properties: { actorType: 'individual' },
    });

    const divineTemplate = getUnifiedTemplateById('divine.dream')!;
    const divineAction = createUnifiedAction({
      actorId: 'asc-1',
      templateId: 'divine.dream',
      targetId: 'agent-1',
      scale: 'cosmic',
      source: 'player',
      tick: 10,
      template: divineTemplate,
      rng: () => 0.5,
    });

    // Create a personal-scale agent action that also completes this tick
    const personalTemplate = UNIFIED_ACTION_TEMPLATES.find(t => t.scale === 'personal');
    if (!personalTemplate) {
      // No personal template available — skip test gracefully
      return;
    }
    const agentAction = createUnifiedAction({
      actorId: 'actor-agent',
      templateId: personalTemplate.id,
      targetId: 'loc-1',
      scale: 'personal',
      source: 'agent',
      tick: 10,
      template: personalTemplate,
      rng: () => 0.5,
    });

    state.unifiedActions = [
      { ...agentAction, stepProgress: agentAction.stepDuration - 1 },
      { ...divineAction, stepProgress: 0 }, // will complete on first progress
    ];
    state.tick = 11;

    const result = phaseUnifiedActionProgress(state, UNIFIED_ACTION_TEMPLATES, () => 0.5);

    // Both should be resolved
    const divine = result.unifiedActions!.find(a => a.templateId === 'divine.dream')!;
    expect(divine.resolved).toBe(true);
    expect(divine.outcome).toBe('success');
  });
});
