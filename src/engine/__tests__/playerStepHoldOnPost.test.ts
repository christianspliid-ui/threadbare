/**
 * THR-2052 — a First's pause-tier step waits for its god from the moment its
 * beat is posted, not only once the veil is minimised. A step whose veil never
 * opened, or was replaced before it was set down, used to play out alone and
 * end in a "faced it alone" aftermath.
 */

import { describe, expect, it } from 'vitest';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { EncounterNotification } from '../../types/encounterVisibility';
import { WorldGraph } from '../graph';
import { holdStepsForPostedBeats, progressActionsWithPlayerHolds } from '../playerStepHold';

function makeGraph(attentionMode: 'pause' | 'auto_resolve'): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc_1', type: 'actor', name: 'The God', properties: {} });
  g.addNode({ id: 'agent_1', type: 'actor', name: 'Thessa', properties: {} });
  g.addEdge({
    id: 'thread_1', source: 'asc_1', target: 'agent_1', type: 'thread',
    properties: {
      courtPosition: 'the_first',
      tier: 1,
      attentionMode,
      ticksAtCurrentTier: 0,
      establishedTick: 0,
      totalEssenceSpent: 0,
      maintenanceCurrent: true,
      readBackstoryTier: 0,
    } as unknown as Record<string, unknown>,
  });
  return g;
}

function action(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_1',
    actorId: 'agent_1',
    templateId: 'encounter.test-multi',
    targetId: 'loc_1',
    scale: 'local',
    source: 'agent',
    startTick: 0,
    resolved: false,
    currentStep: 1,
    stepProgress: 1,
    stepDuration: 2,
    stepOutcomes: ['success'],
    choiceHistory: [],
    ...overrides,
  } as unknown as UnifiedAction;
}

function beat(overrides: Partial<EncounterNotification> = {}): EncounterNotification {
  return {
    id: 'enc_notif_agent_1_x_10',
    agentId: 'agent_1',
    agentName: 'Thessa',
    courtPosition: 'the_first',
    encounterId: 'encounter.test-multi',
    encounterName: 'Test',
    kind: 'encounter',
    sourceSystem: 'unified_action',
    actionId: 'ua_1',
    stepIndex: 1,
    prose: '',
    choices: [],
    createdTick: 10,
    autoResolveTick: null,
    viewed: false,
    resolved: false,
    ...overrides,
  } as unknown as EncounterNotification;
}

describe('THR-2052 — holdStepsForPostedBeats', () => {
  it('holds a pause-tier step the tick its beat is posted', () => {
    const graph = makeGraph('pause');
    const [held] = holdStepsForPostedBeats([action()], [beat()], graph, 10);
    expect(held.playerHold).toEqual({ stepIndex: 1, sinceTick: 10 });
  });

  it('a held step is still waiting after many ticks with no veil open', () => {
    const graph = makeGraph('pause');
    let actions = [...holdStepsForPostedBeats([action()], [beat()], graph, 10)];
    for (let tick = 11; tick < 40; tick++) actions = progressActionsWithPlayerHolds(actions, graph, tick);
    expect(actions[0].resolved).toBe(false);
    expect(actions[0].currentStep).toBe(1);
    expect(actions[0].stepOutcomes).toEqual(['success']);
  });

  it('leaves an auto_resolve beat (a deadline) alone', () => {
    const graph = makeGraph('auto_resolve');
    const actions = [action()];
    expect(holdStepsForPostedBeats(actions, [beat({ autoResolveTick: 18 })], graph, 10)).toBe(actions);
  });

  it('leaves a forced-full beat on an auto_resolve thread alone', () => {
    const graph = makeGraph('auto_resolve');
    const actions = [action()];
    expect(holdStepsForPostedBeats(actions, [beat()], graph, 10)).toBe(actions);
  });

  it('ignores aftermath beats and beats for a step the action has left', () => {
    const graph = makeGraph('pause');
    const actions = [action()];
    expect(holdStepsForPostedBeats(actions, [beat({ kind: 'aftermath' })], graph, 10)).toBe(actions);
    expect(holdStepsForPostedBeats(actions, [beat({ stepIndex: 0 })], graph, 10)).toBe(actions);
    expect(holdStepsForPostedBeats([action({ resolved: true })], [beat()], graph, 10)[0].playerHold).toBeUndefined();
  });

  it('keeps an existing hold on the same step (minimise first) and its sinceTick', () => {
    const graph = makeGraph('pause');
    const actions = [action({ playerHold: { stepIndex: 1, sinceTick: 4 } } as Partial<UnifiedAction>)];
    expect(holdStepsForPostedBeats(actions, [beat()], graph, 10)).toBe(actions);
  });

  it('never re-holds a step the player already decided when its beat is re-posted', () => {
    const graph = makeGraph('pause');
    const committedHand = [action({ activeNudges: [] } as Partial<UnifiedAction>)];
    expect(holdStepsForPostedBeats(committedHand, [beat()], graph, 70)).toBe(committedHand);
    const chosen = [action({ choiceHistory: [{ stepIndex: 1, stepId: 's2', choiceId: 'c', choiceText: 'Go', tick: 20 }] } as unknown as Partial<UnifiedAction>)];
    expect(holdStepsForPostedBeats(chosen, [beat()], graph, 70)).toBe(chosen);
    // A choice on an earlier step does not count for this one.
    const earlier = [action({ choiceHistory: [{ stepIndex: 0, stepId: 's1', choiceId: 'c', choiceText: 'Go', tick: 5 }] } as unknown as Partial<UnifiedAction>)];
    expect(holdStepsForPostedBeats(earlier, [beat()], graph, 70)[0].playerHold).toEqual({ stepIndex: 1, sinceTick: 70 });
  });

  it('returns the same array when nothing was posted', () => {
    const actions = [action()];
    expect(holdStepsForPostedBeats(actions, [], makeGraph('pause'), 10)).toBe(actions);
  });
});
