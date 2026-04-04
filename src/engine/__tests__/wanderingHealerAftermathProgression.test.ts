import { describe, expect, it } from 'vitest';
import { initializeGameState } from '../gameInit';
import { prepareDebugEncounterSpawn } from '../debugEncounterTools';
import { recordUnifiedActionChoiceMemory } from '../encounterChoiceMemory';
import { runTick, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { createSimulationRuntime } from '../simulationRuntime';

function getAvatarId(state: ReturnType<typeof initializeGameState>['state']): string {
  const avatarEdge = state.graph.getIncomingEdges(state.ascendantId, 'avatar_of')[0];
  if (!avatarEdge) throw new Error('Expected initialized state to include an avatar_of edge.');
  return avatarEdge.source;
}

describe('wandering healer unified encounter', () => {
  it('uses @hero as the ascendant avatar and emits an aftermath notification after resolution', () => {
    resetDecisionCache();
    resetEventCounter();

    const init = initializeGameState({
      name: 'Oracle',
      sphereAlignment: { primary: 'thread', secondary: 'winter' },
      title: 'Oracle',
      decreeNouns: [],
      themes: [],
      startingMutations: [],
    } as never, 'Oracle', { reachDomains: [], spheres: [] } as never, 42, 32, 24);

    let state = init.state;
    const avatarId = getAvatarId(state);

    const prepared = prepareDebugEncounterSpawn(
      state,
      '@hero',
      'healer.quest.wandering_healer_shrine_access',
      { courtPosition: 'the_first' },
    );

    expect(prepared.success).toBe(true);
    expect(prepared.mode).toBe('unified');
    expect(prepared.agent?.id).toBe(avatarId);
    expect(prepared.unifiedAction).toBeDefined();
    expect(prepared.notification).toBeDefined();

    const choice = prepared.notification!.choices[0]!;
    state = {
      ...state,
      unifiedActions: prepared.unifiedAction ? [prepared.unifiedAction] : [],
      encounterNotifications: prepared.notification ? [{ ...prepared.notification, viewed: true, resolved: true }] : [],
    };

    state = {
      ...state,
      unifiedActions: state.unifiedActions.map(action =>
        recordUnifiedActionChoiceMemory(
          action,
          action.currentStep,
          `step-${action.currentStep + 1}`,
          choice,
          state.tick,
          choice.essenceCost ?? 0,
        )),
    };

    const runtime = createSimulationRuntime();
    for (let i = 0; i < 5; i += 1) {
      state = runTick(state, [], runtime);
      const aftermathNotification = (state.encounterNotifications ?? []).find(notification =>
        notification.encounterId === 'healer.quest.wandering_healer_shrine_access'
        && notification.kind === 'aftermath'
        && !notification.resolved,
      );
      if (aftermathNotification) {
        expect(aftermathNotification.actionId).toBe(state.unifiedActions[0]?.actionId);
        return;
      }
    }

    throw new Error('Expected wandering healer encounter to emit an unresolved aftermath notification.');
  });
});
