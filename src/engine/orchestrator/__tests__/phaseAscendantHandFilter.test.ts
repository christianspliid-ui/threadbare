import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { WorldGraph } from '../../graph';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { phaseAscendantHandFilter } from '../phaseAscendantHandFilter';
import type { GameState } from '../../../types/gameState';
import type { UnifiedAction, UnifiedActionTemplate } from '../../../types/unifiedAction';

function makeTemplate(
  id: string,
  overrides: Partial<UnifiedActionTemplate> = {},
): UnifiedActionTemplate {
  return {
    id,
    rarityTier: 1,
    intrinsicTier: 'background',
    name: id,
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: 0.2,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 1,
    actorAffinities: ['ascendant'],
    targetCategories: ['actor'],
    motivations: ['mercy_ruthlessness'],
    narrativeTemplates: {
      initiation: 'init',
      success: 'success',
      failure: 'fail',
    },
    ...overrides,
  };
}

function makeState(
  graph: WorldGraph,
  encounterTemplateId: string,
  action: UnifiedAction,
  essenceForce: number,
): GameState {
  return {
    tick: 40,
    graph,
    ascendantId: 'asc',
    ascendantIdentity: null,
    essencePool: {
      force: essenceForce,
      spirit: 5,
      matter: 0,
      energy: 0,
      life: 0,
      mind: 0,
      time: 0,
      entropy: 0,
      chaos: 0,
      order: 0,
      light: 0,
      darkness: 0,
    },
    encounterNotifications: [{
      id: 'notif-1',
      agentId: 'actor-1',
      agentName: 'Actor',
      courtPosition: 'retinue',
      encounterId: encounterTemplateId,
      encounterName: 'Encounter',
      sourceSystem: 'unified_action',
      kind: 'encounter',
      stepIndex: 0,
      actionId: action.actionId,
      prose: 'prose',
      choices: [],
      createdTick: 40,
      autoResolveTick: null,
      viewed: true,
      resolved: false,
    }],
    unifiedActions: [action],
  } as unknown as GameState;
}

describe('phaseAscendantHandFilter', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('emits hand_filtered traces with partition counts', () => {
    const encounterTemplateId = UNIFIED_ACTION_TEMPLATES[0].id;
    const graph = new WorldGraph();
    graph.addNode({
      id: 'asc',
      type: 'actor',
      name: 'Ascendant',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'force', secondary: 'spirit' },
      },
    });
    graph.addNode({ id: 'actor-1', type: 'actor', name: 'Actor', properties: { actorType: 'individual' } });
    graph.addNode({
      id: 'loc-1',
      type: 'location',
      name: 'Shrine',
      properties: { sphereAlignment: 'spirit' },
    });
    graph.addEdge({ id: 'thread-1', source: 'asc', target: 'actor-1', type: 'thread', properties: { tier: 2 } });
    graph.addEdge({ id: 'located-1', source: 'actor-1', target: 'loc-1', type: 'located_at', properties: {} });

    const action: UnifiedAction = {
      actionId: 'ua-1',
      actorId: 'actor-1',
      templateId: encounterTemplateId,
      targetId: 'actor-1',
      scale: 'local',
      source: 'player',
      startTick: 39,
      currentStep: 0,
      stepProgress: 0,
      stepDuration: 1,
      resolved: false,
      stepOutcomes: [],
    };

    const deck = [
      makeTemplate('t.playable', { essenceCost: 1, sphereAffinity: 'force' }),
      makeTemplate('t.dimmed', { essenceCost: 9, sphereAffinity: 'force' }),
    ];

    const state = makeState(graph, encounterTemplateId, action, 4);
    const stats = phaseAscendantHandFilter(state, deck);
    const traces = getTraces().filter((trace) => trace.category === 'hand_filtered');

    expect(stats.filteredCount).toBe(1);
    expect(traces).toHaveLength(1);
    expect((traces[0] as { playableCount: number }).playableCount).toBe(1);
    expect((traces[0] as { dimmedCount: number }).dimmedCount).toBe(1);
    expect((traces[0] as { hiddenCount: number }).hiddenCount).toBe(0);
  });

  it('recomputes when scene-state inputs change (essence + place sphere)', () => {
    const encounterTemplateId = UNIFIED_ACTION_TEMPLATES[0].id;
    const graph = new WorldGraph();
    graph.addNode({
      id: 'asc',
      type: 'actor',
      name: 'Ascendant',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'spirit', secondary: 'force' },
      },
    });
    graph.addNode({ id: 'actor-1', type: 'actor', name: 'Actor', properties: { actorType: 'individual' } });
    graph.addNode({
      id: 'loc-1',
      type: 'location',
      name: 'Shrine',
      properties: { sphereAlignment: 'spirit' },
    });
    graph.addEdge({ id: 'thread-1', source: 'asc', target: 'actor-1', type: 'thread', properties: { tier: 2 } });
    graph.addEdge({ id: 'located-1', source: 'actor-1', target: 'loc-1', type: 'located_at', properties: {} });

    const action: UnifiedAction = {
      actionId: 'ua-1',
      actorId: 'actor-1',
      templateId: encounterTemplateId,
      targetId: 'actor-1',
      scale: 'local',
      source: 'player',
      startTick: 39,
      currentStep: 0,
      stepProgress: 0,
      stepDuration: 1,
      resolved: false,
      stepOutcomes: [],
    };

    const deck = [
      makeTemplate('loc.consecrate', {
        essenceCost: 2,
        sphereAffinity: 'spirit',
        targetCategories: ['location'],
      }),
      makeTemplate('t.force', { essenceCost: 3, sphereAffinity: 'force' }),
    ];

    const first = makeState(graph, encounterTemplateId, action, 4);
    phaseAscendantHandFilter(first, deck);

    graph.updateNode('loc-1', { properties: { sphereAlignment: 'force' } });
    const second = makeState(graph, encounterTemplateId, action, 1);
    phaseAscendantHandFilter(second, deck);

    const traces = getTraces().filter((trace) => trace.category === 'hand_filtered');
    expect(traces).toHaveLength(2);
    expect((traces[0] as { playableCount: number }).playableCount).toBe(2);
    expect((traces[1] as { playableCount: number }).playableCount).toBe(0);
    expect((traces[1] as { dimmedCount: number }).dimmedCount).toBe(2);
  });
});

