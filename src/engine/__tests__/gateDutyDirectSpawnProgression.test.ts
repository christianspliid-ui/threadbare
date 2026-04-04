import { describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { EncounterInterventionChoice } from '../../types/encounterVisibility';
import { WorldGraph } from '../graph';
import { prepareDebugEncounterSpawn } from '../debugEncounterTools';
import { recordUnifiedActionChoiceMemory } from '../encounterChoiceMemory';
import { runTick, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { createSimulationRuntime } from '../simulationRuntime';
import { initializeGameState } from '../gameInit';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';

function addIndividual(
  graph: WorldGraph,
  id: string,
  name: string,
  properties: Record<string, unknown>,
  locationId: string,
): void {
  graph.addNode({
    id,
    type: 'actor',
    name,
    properties: {
      actorType: 'individual',
      spotlightTier: 'ambient',
      ...properties,
    },
  });
  graph.addEdge({
    id: `${id}_located_at_${locationId}`,
    source: id,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function makeGateDutyState(): GameState {
  const init = initializeGameState({
    name: 'Oracle',
    sphereAlignment: { primary: 'thread', secondary: 'winter' },
    title: 'Oracle',
    decreeNouns: [],
    themes: [],
    startingMutations: [],
  } as never, 'Oracle', { reachDomains: [], spheres: [] } as never, 42, 32, 24);
  const state = init.state;
  const { graph, ascendantId } = state;

  const hero = graph.getNodesByType('actor')
    .find(node => node.properties.actorType === 'individual');
  if (!hero) {
    throw new Error('Expected at least one individual actor in initialized state.');
  }

  if (!graph.getNode('loc_town')) {
    graph.addNode({
      id: 'loc_town',
      type: 'location',
      name: 'Mock Town',
      properties: { locationSubtype: 'town', hexCol: 10, hexRow: 10 },
    });
  }
  if (!graph.getNode('loc_gatehouse')) {
    graph.addNode({
      id: 'loc_gatehouse',
      type: 'location',
      name: 'North Gatehouse',
      properties: {
        locationSubtype: 'encounter_support',
        sublocationTypeId: 'sublocation-type.gatehouse',
        parentLocationId: 'loc_town',
        hexCol: 10,
        hexRow: 10,
        persistence: { type: 'permanent' },
      },
    });
  }
  if (!graph.getEdge('loc_town_contains_gatehouse')) {
    graph.addEdge({
      id: 'loc_town_contains_gatehouse',
      source: 'loc_town',
      target: 'loc_gatehouse',
      type: 'contains',
      properties: {},
    });
  }

  if (!graph.getNode('culture_1')) {
    graph.addNode({
      id: 'culture_1',
      type: 'actor',
      name: 'Town Culture',
      properties: { actorType: 'culture' },
    });
  }
  if (!graph.getEdge('loc_town_belongs_to_culture_1')) {
    graph.addEdge({
      id: 'loc_town_belongs_to_culture_1',
      source: 'loc_town',
      target: 'culture_1',
      type: 'belongs_to',
      properties: { cultureLayer: 'current', culturalStrength: 1.0 },
    });
  }

  if (!graph.getNode('faction_cg')) {
    graph.addNode({
      id: 'faction_cg',
      type: 'actor',
      name: 'Civic Guard',
      properties: { actorType: 'faction', factionDefId: 'civic_guard' },
    });
  }

  for (const edge of graph.getOutgoingEdges(hero.id, 'located_at')) {
    graph.removeEdge(edge.id);
  }
  graph.addEdge({
    id: `${hero.id}_located_at_loc_town`,
    source: hero.id,
    target: 'loc_town',
    type: 'located_at',
    properties: {},
  });

  addIndividual(graph, 'guard_1', 'Town Guard', { npcRole: 'guard' }, 'loc_gatehouse');
  addIndividual(graph, 'captain_1', 'Gate Captain', { npcRole: 'guard_captain' }, 'loc_gatehouse');

  const existingThread = graph.getOutgoingEdges(ascendantId, 'thread').find(edge => edge.target === hero.id);
  if (!existingThread) {
    graph.addEdge({
      id: `${ascendantId}_threads_${hero.id}`,
      source: ascendantId,
      target: hero.id,
      type: 'thread',
      properties: {
        courtPosition: 'the_first',
        attentionMode: 'pause',
        tier: 3,
      },
    });
  }

  return state;
}

function commitFirstChoice(state: GameState, choice: EncounterInterventionChoice): GameState {
  return {
    ...state,
    unifiedActions: state.unifiedActions.map(action => {
      if (action.templateId !== 'cg.quest.gate_duty') return action;
      const stepId = 'cg.quest.gate_duty.1';
      return recordUnifiedActionChoiceMemory(
        action,
        0,
        stepId,
        choice,
        state.tick,
        choice.essenceCost ?? 0,
      );
    }),
    encounterNotifications: (state.encounterNotifications ?? []).map(notification =>
      notification.encounterId === 'cg.quest.gate_duty'
        ? { ...notification, resolved: true }
        : notification,
    ),
  };
}

describe('Gate Duty direct debug spawn progression', () => {
  it('registers Gate Duty in the canonical unified template registry', () => {
    expect(UNIFIED_ACTION_TEMPLATES.some(template => template.id === 'cg.quest.gate_duty')).toBe(true);
  });

  it('advances to step 2 and emits a second-step notification after two ticks', () => {
    resetDecisionCache();
    resetEventCounter();

    let state = makeGateDutyState();
    const heroId = state.graph.getNodesByType('actor')
      .find(node => node.properties.actorType === 'individual')?.id;
    expect(heroId).toBeDefined();

    const prepared = prepareDebugEncounterSpawn(
      state,
      heroId!,
      'cg.quest.gate_duty',
      { courtPosition: 'the_first' },
    );

    expect(prepared.success).toBe(true);
    expect(prepared.unifiedAction).toBeDefined();
    expect(prepared.notification).toBeDefined();

    state = {
      ...state,
      unifiedActions: prepared.unifiedAction ? [prepared.unifiedAction] : [],
      clearanceGateStates: prepared.clearanceGateStates ?? state.clearanceGateStates,
      encounterNotifications: prepared.notification ? [{ ...prepared.notification, viewed: true }] : [],
    };

    const choice = prepared.notification?.choices[0];
    expect(choice).toBeDefined();
    state = commitFirstChoice(state, choice!);

    const runtime = createSimulationRuntime();
    state = runTick(state, [], runtime);
    state = runTick(state, [], runtime);

    const action = state.unifiedActions.find(candidate => candidate.templateId === 'cg.quest.gate_duty');
    expect(action).toBeDefined();
    expect(action?.resolved).toBe(false);
    expect(action?.currentStep).toBe(1);

    const stepTwoNotification = (state.encounterNotifications ?? []).find(notification =>
      notification.encounterId === 'cg.quest.gate_duty'
      && notification.stepIndex === 1
      && notification.resolved === false,
    );
    expect(stepTwoNotification).toBeDefined();
    expect(stepTwoNotification?.sourceSystem).toBe('unified_action');
  });
});
