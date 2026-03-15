/**
 * Tests for activity summary derivation.
 *
 * Sprint 5 — Task 5.2
 */

import { describe, it, expect } from 'vitest';
import { getActivitySummary } from '../activitySummary';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import { WorldGraph } from '../graph';

// ─── Helpers ────────────────────────────────────────────────────

function makeTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'test.action',
    name: 'Test Action',
    reach: 'iron',
    crudType: 'update',
    scale: 'personal',
    steps: [{
      reach: 'iron',
      duration: { min: 3, max: 3 },
      difficulty: 0.3,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: {
      initiation: 'begins',
      success: 'succeeds',
      failure: 'fails',
    },
    ...overrides,
  };
}

function makeAction(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'action-1',
    actorId: 'actor-1',
    templateId: 'test.action',
    targetId: 'loc-1',
    scale: 'personal',
    source: 'agent',
    startTick: 5,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 3,
    resolved: false,
    stepOutcomes: [],
    ...overrides,
  };
}

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Alice', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor-2', type: 'actor', name: 'Bob', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Market', properties: { locationType: 'town' } });
  return graph;
}

// ─── Tests ──────────────────────────────────────────────────────

describe('getActivitySummary', () => {
  it('returns null for idle actor', () => {
    const result = getActivitySummary('actor-1', [], [makeTemplate()], makeGraph());
    expect(result).toBeNull();
  });

  it('returns null for actor with only resolved actions', () => {
    const actions = [makeAction({ resolved: true })];
    const result = getActivitySummary('actor-1', actions, [makeTemplate()], makeGraph());
    expect(result).toBeNull();
  });

  it('returns summary for active single-step action', () => {
    const actions = [makeAction({ stepProgress: 1, stepDuration: 3 })];
    const templates = [makeTemplate()];

    const result = getActivitySummary('actor-1', actions, templates, makeGraph());
    expect(result).not.toBeNull();
    expect(result!.actionName).toBe('Test Action');
    expect(result!.stepLabel).toBe('1/3 ticks');
    expect(result!.progressFraction).toBeCloseTo(1 / 3);
    expect(result!.isContested).toBe(false);
  });

  it('returns step label for multi-step action', () => {
    const multiTemplate = makeTemplate({
      id: 'multi.step',
      name: 'Multi Step',
      steps: [
        { reach: 'iron', duration: { min: 2, max: 2 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
        { reach: 'gold', duration: { min: 2, max: 2 }, difficulty: 0.5, onSuccess: [], onFailure: [], failBehavior: 'continue_weakened' },
      ],
    });

    const actions = [makeAction({
      templateId: 'multi.step',
      currentStep: 1,
      stepProgress: 1,
      stepDuration: 2,
    })];

    const result = getActivitySummary('actor-1', actions, [multiTemplate], makeGraph());
    expect(result!.actionName).toBe('Multi Step');
    expect(result!.stepLabel).toBe('Step 2/2');
    // Overall: 1/2 (completed step 1) + (1/2) / 2 = 0.5 + 0.25 = 0.75
    expect(result!.progressFraction).toBeCloseTo(0.75);
  });

  it('indicates contestation when contestedWith is set', () => {
    const graph = makeGraph();
    const actions = [
      makeAction({ contestedWith: 'action-2' }),
      makeAction({ actionId: 'action-2', actorId: 'actor-2', templateId: 'test.action' }),
    ];

    const result = getActivitySummary('actor-1', actions, [makeTemplate()], graph);
    expect(result!.isContested).toBe(true);
    expect(result!.opponentName).toBe('Bob');
  });

  it('uses template ID as fallback name when template not found', () => {
    const actions = [makeAction({ templateId: 'unknown.template' })];
    const result = getActivitySummary('actor-1', actions, [], makeGraph());
    expect(result!.actionName).toBe('unknown.template');
  });

  it('handles zero stepDuration gracefully', () => {
    const actions = [makeAction({ stepProgress: 0, stepDuration: 0 })];
    const result = getActivitySummary('actor-1', actions, [makeTemplate()], makeGraph());
    expect(result!.progressFraction).toBe(0);
  });
});
