import { describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { prepareDebugEncounterSpawn } from '../debugEncounterTools';
import { recordUnifiedActionNudgeMemory } from '../encounterChoiceMemory';
import { runTick, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { createSimulationRuntime } from '../simulationRuntime';
import { initializeGameState } from '../gameInit';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { GATE_DUTY_NUDGE_IDS } from '../../data/civic-guard-encounter-content';

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

/**
 * Commit a nudge card on gate duty's first step, the way the player's stage
 * does (THR-1123).
 *
 * Both writes matter and they answer different questions. `activeNudges` is what
 * the engine reads at resolution — `applyGateDutyBranchConsequences` keys the
 * step's consequences on the card played *now*. The choice-memory entry is what
 * the stage adapter reads *afterwards*, for the history afterimage and the
 * aftermath echo, once `activeNudges` has moved on to the next step.
 *
 * Driving from `GATE_DUTY_NUDGE_IDS` rather than a stance helper is the point of
 * the conversion: the card ids come from the template's own authored hand, so a
 * card renamed out from under this test fails it instead of silently resolving
 * to no branch.
 */
function commitFirstNudge(state: GameState, nudgeId: string): GameState {
  return {
    ...state,
    unifiedActions: state.unifiedActions.map(action => {
      if (action.templateId !== 'cg.quest.gate_duty') return action;
      const stepId = 'cg.quest.gate_duty.1';
      return recordUnifiedActionNudgeMemory(
        { ...action, activeNudges: [nudgeId] },
        0,
        stepId,
        [nudgeId],
        nudgeId,
        state.tick,
        0,
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

    // THR-1123 — the notification carries no choices at all: gate duty's moves
    // are authored `nudges` on the template's steps now, dealt by the nudge
    // stage. Driving from the template's own hand keeps this committing a card
    // the player can actually be shown.
    expect(prepared.notification?.choices).toEqual([]);
    const stepOneHand = UNIFIED_ACTION_TEMPLATES
      .find(t => t.id === 'cg.quest.gate_duty')?.steps[0];
    expect(stepOneHand && 'nudges' in stepOneHand ? stepOneHand.nudges : undefined)
      .toHaveLength(3);
    state = commitFirstNudge(state, GATE_DUTY_NUDGE_IDS[0].steady);

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
