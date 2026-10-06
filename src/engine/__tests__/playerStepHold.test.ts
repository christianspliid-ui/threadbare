/**
 * THR-1730 — a minimised pause-tier step waits for its god.
 *
 * Plan: Docs/plans/2026-10-04-thr-1730-minimised-step-waits.md (Done-when:
 * unit tests — a live hold freezes progress; commit releases and the step
 * resolves after its remaining ticks; step_changed / thread_not_pause /
 * missing thread each release and progress the same tick; no hold is
 * byte-identical to today).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { PlayerHoldReleasedTrace } from '../../types/trace';
import { WorldGraph } from '../graph';
import {
  isPlayerHoldLive,
  playerHoldReleaseReason,
  progressActionsWithPlayerHolds,
  releasePlayerHold,
  setPlayerHold,
} from '../playerStepHold';
import {
  advanceStep,
  completeUnifiedAction,
  isStepComplete,
  progressUnifiedAction,
} from '../unifiedActionLifecycle';
import { phaseUnifiedActionProgress } from '../unifiedActionResolution';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';

function makeGraph(attentionMode: 'pause' | 'auto_resolve' | null, courtPosition = 'the_first'): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc_1', type: 'actor', name: 'The God', properties: {} });
  g.addNode({ id: 'agent_1', type: 'actor', name: 'Thessa', properties: {} });
  if (attentionMode !== null) {
    g.addEdge({
      id: 'thread_1', source: 'asc_1', target: 'agent_1', type: 'thread',
      properties: {
        courtPosition,
        tier: 1,
        attentionMode,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 0,
        maintenanceCurrent: true,
        readBackstoryTier: 0,
      } as unknown as Record<string, unknown>,
    });
  }
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
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 3,
    stepOutcomes: [],
    choiceHistory: [],
    ...overrides,
  } as unknown as UnifiedAction;
}

const TEMPLATE_2_STEP = {
  id: 'encounter.test-multi',
  steps: [
    { reach: 'shadow', duration: { min: 2, max: 2 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
    { reach: 'iron', duration: { min: 2, max: 2 }, difficulty: 0.4, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
  ],
} as unknown as UnifiedActionTemplate;

function releaseTraces(): PlayerHoldReleasedTrace[] {
  return getTraces().filter(t => t.category === 'encounter.player_hold_released') as PlayerHoldReleasedTrace[];
}

describe('playerStepHold (THR-1730)', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  describe('set / release', () => {
    it('setPlayerHold pins the current step and is idempotent per step', () => {
      const held = setPlayerHold(action({ currentStep: 1 }), 10);
      expect(held.playerHold).toEqual({ stepIndex: 1, sinceTick: 10 });
      expect(setPlayerHold(held, 20)).toBe(held);
    });

    it('releasePlayerHold drops the field, and is the identity without one', () => {
      const plain = action();
      expect(releasePlayerHold(plain)).toBe(plain);
      const released = releasePlayerHold(setPlayerHold(plain, 0));
      expect('playerHold' in released).toBe(false);
    });
  });

  describe('liveness', () => {
    it('a hold on a pause-mode thread at the current step is live', () => {
      const g = makeGraph('pause');
      const held = setPlayerHold(action(), 0);
      expect(playerHoldReleaseReason(held, g, 50)).toBeNull();
      expect(isPlayerHoldLive(held, g, 5000)).toBe(true);
    });

    it('no hold is never live', () => {
      expect(isPlayerHoldLive(action(), makeGraph('pause'), 0)).toBe(false);
    });

    it('names why a hold is dead', () => {
      const held = setPlayerHold(action(), 0);
      expect(playerHoldReleaseReason(held, makeGraph('auto_resolve'), 1)).toBe('thread_not_pause');
      expect(playerHoldReleaseReason(held, makeGraph(null), 1)).toBe('thread_not_pause');
      expect(playerHoldReleaseReason(held, makeGraph('pause', 'dormant'), 1)).toBe('thread_not_pause');
      expect(playerHoldReleaseReason({ ...held, currentStep: 1 }, makeGraph('pause'), 1)).toBe('step_changed');
      expect(playerHoldReleaseReason({ ...held, resolved: true }, makeGraph('pause'), 1)).toBe('resolved');
    });
  });

  describe('Phase 1 — progressActionsWithPlayerHolds', () => {
    it('an action with no hold progresses exactly as progressUnifiedAction', () => {
      const plain = action();
      const [out] = progressActionsWithPlayerHolds([plain], makeGraph('pause'), 3);
      expect(out).toEqual(progressUnifiedAction(plain));
      expect(releaseTraces()).toHaveLength(0);
    });

    it('a live hold freezes stepProgress however long the world runs', () => {
      const g = makeGraph('pause');
      let actions = [setPlayerHold(action({ stepProgress: 2, stepDuration: 3 }), 0)];
      for (let tick = 1; tick <= 100; tick++) actions = progressActionsWithPlayerHolds(actions, g, tick);
      expect(actions[0].stepProgress).toBe(2);
      expect(isStepComplete(actions[0])).toBe(false);
      expect(actions[0].playerHold).toBeDefined();
    });

    it('after a commit releases it, the step resolves after its remaining ticks', () => {
      const g = makeGraph('pause');
      let actions = [setPlayerHold(action({ stepProgress: 1, stepDuration: 3 }), 0)];
      for (let tick = 1; tick <= 10; tick++) actions = progressActionsWithPlayerHolds(actions, g, tick);
      actions = actions.map(releasePlayerHold); // commit
      actions = progressActionsWithPlayerHolds(actions, g, 11);
      expect(isStepComplete(actions[0])).toBe(false);
      actions = progressActionsWithPlayerHolds(actions, g, 12);
      expect(isStepComplete(actions[0])).toBe(true);
    });

    it.each([
      ['step_changed', makeGraph('pause'), { currentStep: 1 }],
      ['thread_not_pause', makeGraph('auto_resolve'), {}],
      ['thread_not_pause', makeGraph(null), {}],
    ] as const)('a %s hold releases and progresses the same tick', (reason, g, patch) => {
      const held = { ...setPlayerHold(action({ stepProgress: 1 }), 4), ...patch } as UnifiedAction;
      const [out] = progressActionsWithPlayerHolds([held], g, 9);
      expect(out.playerHold).toBeUndefined();
      expect(out.stepProgress).toBe(2);
      const traces = releaseTraces();
      expect(traces).toHaveLength(1);
      expect(traces[0].reason).toBe(reason);
      expect(traces[0].heldTicks).toBe(5);
    });

    it('switching the thread to Lives on releases on the next tick', () => {
      const g = makeGraph('pause');
      let actions = [setPlayerHold(action(), 0)];
      actions = progressActionsWithPlayerHolds(actions, g, 1);
      expect(actions[0].playerHold).toBeDefined();
      g.updateEdge('thread_1', {
        properties: { ...g.getEdge('thread_1')!.properties, attentionMode: 'auto_resolve' },
      });
      actions = progressActionsWithPlayerHolds(actions, g, 2);
      expect(actions[0].playerHold).toBeUndefined();
      expect(releaseTraces()[0].reason).toBe('thread_not_pause');
    });
  });

  describe('E4 — the hold never carries into the next step', () => {
    it('advanceStep strips it on a step advance', () => {
      const held = setPlayerHold(action(), 0);
      const next = advanceStep(held, 'success', TEMPLATE_2_STEP, () => 0.5);
      expect(next.currentStep).toBe(1);
      expect(next.playerHold).toBeUndefined();
    });

    it('advanceStep strips it on the final step', () => {
      const held = setPlayerHold(action({ currentStep: 1 }), 0);
      const done = advanceStep(held, 'success', TEMPLATE_2_STEP, () => 0.5);
      expect(done.resolved).toBe(true);
      expect(done.playerHold).toBeUndefined();
    });

    it('completeUnifiedAction strips it', () => {
      expect(completeUnifiedAction(setPlayerHold(action(), 0), 'failure').playerHold).toBeUndefined();
    });
  });

  describe('phaseUnifiedActionProgress honours a live hold', () => {
    it('a held step at the edge of completing does not complete', () => {
      const g = makeGraph('pause');
      const held = setPlayerHold(action({ stepProgress: 2, stepDuration: 3 }), 0);
      const state = { tick: 7, graph: g, unifiedActions: [held], tickEvents: [] } as unknown as GameState;
      const out = phaseUnifiedActionProgress(state, [TEMPLATE_2_STEP], () => 0.5);
      const after = out.unifiedActions?.find(a => a.actionId === 'ua_1');
      expect(after?.stepProgress).toBe(2);
      expect(after?.resolved).toBe(false);
      expect(after?.stepOutcomes).toEqual([]);
    });
  });
});
