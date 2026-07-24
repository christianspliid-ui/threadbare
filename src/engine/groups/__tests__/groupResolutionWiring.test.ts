/**
 * Wiring tests for the company hook inside `resolveUncontestedStep` (THR-74, PR 2).
 *
 * PR 1 shipped `resolveGroupStep` as a producer with no call site — its interface
 * contract row was deliberately pinned PARTIAL. These tests are what un-pin it:
 * they assert the *call site* behaves, not just the helper. The failure they
 * exist to catch is the silent one — the hook gets refactored out and every
 * individual action still resolves perfectly, so nothing else goes red.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resolveUncontestedStep } from '../../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../../unifiedActionLifecycle';
import { WorldGraph } from '../../graph';
import { resetOpCounter } from '../../graphOpExecutor';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import { createGroup } from '../groupFormation';
import type { GameState } from '../../../types/gameState';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import { GROUP_ASSIST_PER_MEMBER } from '../../../data/group-constants';

const fixedRng = () => 0.5;

/**
 * Two-step iron/stone template carrying the 'group' affinity — i.e. exactly what
 * the eligibility sweep produces for a delve.
 */
function delveTemplate(over: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'encounter.test_delve',
    name: 'Test Delve',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'read',
    scale: 'local',
    apCost: 1,
    actorAffinities: ['individual', 'group'],
    steps: [{
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: 0.5,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
    ...over,
  } as UnifiedActionTemplate;
}

/**
 * Leader `a1` is weak at iron; companions `a2`/`a3` are strong at it. Any test
 * that sees the strong capability proves the substitution ran — the action's
 * actor is always `a1`.
 *
 * Values are *raw* domain scores, which `computeCapability` puts through a
 * sigmoid; the assertions below compare capabilities to each other rather than
 * to absolute thresholds, so they stay valid if that curve is ever retuned.
 */
function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc-1', type: 'location', name: 'The Deep', properties: {} });
  const caps: Record<string, number> = { a1: 1, a2: 30, a3: 30 };
  for (const [id, name] of [['a1', 'Kael'], ['a2', 'Lyra'], ['a3', 'Vorn']] as const) {
    graph.addNode({
      id, type: 'actor', name,
      properties: { actorType: 'individual', domainCapabilities: { iron: caps[id] } },
    });
    graph.addEdge({ id: `e-${id}`, source: id, target: 'loc-1', type: 'located_at', properties: {} });
  }
  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    agentKnowledge: new Map(), culturalInsightMap: new Map(),
    unifiedActions: [], effectStates: [], pendingQuintessenceEvents: [],
  } as unknown as GameState;
}

function formCompany(state: GameState, members: string[]): string {
  return createGroup(state, {
    members: members.map(id => state.graph.getNode(id)!),
    leaderId: members[0],
    locationId: 'loc-1',
    cause: 'systemic',
    groupType: 'party',
  })!.groupId;
}

function actionFor(actorId: string, template: UnifiedActionTemplate) {
  return createUnifiedAction({
    actorId, templateId: template.id, targetId: 'loc-1',
    scale: 'local', source: 'agent', tick: 0, template, rng: fixedRng,
  });
}

beforeEach(() => {
  resetUnifiedActionCounter();
  resetOpCounter();
  clearTraces();
});

/** Capability the weak leader resolves at with no company involved. */
function soloCapability(): number {
  const state = makeState();
  const template = delveTemplate();
  return resolveUncontestedStep(actionFor('a1', template), template, state, fixedRng).capability;
}

describe('company substitution inside resolveUncontestedStep', () => {
  it('substitutes the best member for the step reach', () => {
    const state = makeState();
    formCompany(state, ['a1', 'a2']);
    const template = delveTemplate();

    const result = resolveUncontestedStep(actionFor('a1', template), template, state, fixedRng);

    // a1 (the actor) is weak at iron; a2 is strong. Resolving above a1's own
    // ceiling is the substitution.
    expect(result.capability).toBeGreaterThan(soloCapability());
  });

  it('leaves a solo agent on the individual path', () => {
    const state = makeState();
    const template = delveTemplate();

    const result = resolveUncontestedStep(actionFor('a1', template), template, state, fixedRng);

    expect(result.capability).toBe(soloCapability());
  });

  it('does not substitute for a template lacking the group affinity', () => {
    const state = makeState();
    formCompany(state, ['a1', 'a2']);
    const soloOnly = delveTemplate({ actorAffinities: ['individual'] });

    const result = resolveUncontestedStep(actionFor('a1', soloOnly), soloOnly, state, fixedRng);

    // Company present, but the template was never opened to companies — the
    // leader answers for himself.
    expect(result.capability).toBe(soloCapability());
  });

  it('records the company on the resolution trace', () => {
    const state = makeState();
    const groupId = formCompany(state, ['a1', 'a2', 'a3']);
    const template = delveTemplate();

    enableTracing();
    try {
      resolveUncontestedStep(actionFor('a1', template), template, state, fixedRng);
    } finally {
      disableTracing();
    }

    const trace = getTraces().find(t => t.category === 'resolution.input') as
      | { groupId?: string; actingMemberId?: string; groupAssistCount?: number; groupBonus?: number }
      | undefined;

    expect(trace).toBeDefined();
    expect(trace!.groupId).toBe(groupId);
    // a2/a3 both hold iron 0.9; the tie breaks on id, so a2 acts and a3 assists.
    expect(trace!.actingMemberId).toBe('a2');
    expect(trace!.groupAssistCount).toBeGreaterThanOrEqual(1);
    expect(trace!.groupBonus).toBeGreaterThanOrEqual(GROUP_ASSIST_PER_MEMBER);
  });

  it('omits the company fields entirely for a solo resolution', () => {
    const state = makeState();
    const template = delveTemplate();

    enableTracing();
    try {
      resolveUncontestedStep(actionFor('a1', template), template, state, fixedRng);
    } finally {
      disableTracing();
    }

    const trace = getTraces().find(t => t.category === 'resolution.input') as
      | { groupId?: string; groupBonus?: number }
      | undefined;

    expect(trace).toBeDefined();
    expect(trace!.groupId).toBeUndefined();
    expect(trace!.groupBonus).toBeUndefined();
  });

  it('falls back to the individual path when the company has been emptied', () => {
    const state = makeState();
    const groupId = formCompany(state, ['a1', 'a2']);
    // Simulate the fail-soft row: membership is gone but the action still names
    // the company. Nothing may throw; the leader simply answers alone.
    for (const edge of state.graph.getIncomingEdges(groupId, 'member_of')) {
      state.graph.removeEdge(edge.id);
    }
    const template = delveTemplate();

    const result = resolveUncontestedStep(actionFor('a1', template), template, state, fixedRng);

    expect(result.capability).toBe(soloCapability());
  });
});
