/**
 * THR-2187 — falsification arm: with `CARD_LINES_ENABLED = false` a step
 * resolved with a played card freezes no `cardLines` (today's output).
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../data/nudge-constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/nudge-constants')>()),
  CARD_LINES_ENABLED: false,
}));

import { executeStepResult } from '../unifiedActionResolution';
import { createUnifiedAction } from '../unifiedActionLifecycle';
import { createSimulationRuntime } from '../simulationRuntime';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { StepProseRecord } from '../../types/stepProseRecord';
import type { StepNudge, UnifiedActionTemplate } from '../../types/unifiedAction';

describe('THR-2187 — kill switch off', () => {
  it('a played card freezes no cardLines', () => {
    const nudge = {
      id: 'n.press', name: 'Press The Odds', essenceCost: 1, forecastDelta: 0.1, fiction: '',
      effectLine: 'Widens the odds.', bandProse: { success: 'It held.', failure: 'Nothing gave.' },
    } as StepNudge;
    const template = {
      id: 'action.iron.thr2187_kill', rarityTier: 1, intrinsicTier: 'background', name: 'Kill Probe',
      reach: 'iron', crudType: 'update', scale: 'personal',
      steps: [{
        reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.3, narrativeTemplate: 'The probe leans in.',
        onSuccess: [], onFailure: [], failBehavior: 'continue', nudges: [nudge],
      }],
      apCost: 1, actorAffinities: ['individual'], motivations: ['courage_prudence'],
      narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
    } as unknown as UnifiedActionTemplate;
    const graph = new WorldGraph();
    graph.addNode({ id: 'agent-1', type: 'actor', name: 'Kael', properties: {} });
    const state = { tick: 5, graph, unifiedActions: [] } as unknown as GameState;
    const rng = () => 0.5;
    const action = {
      ...createUnifiedAction({
        actorId: 'agent-1', templateId: template.id, targetId: 'agent-1',
        scale: template.scale, source: 'agent', template, tick: state.tick, rng,
      }),
      activeNudges: ['n.press'],
    };
    const { updatedAction } = executeStepResult(
      action, template, 'failure', [], state, rng, state.tick,
      { capability: 60, probability: 0.5, roll: 40 }, createSimulationRuntime(),
    );
    const records = (updatedAction.stepProseHistory ?? []) as readonly StepProseRecord[];
    expect(records).toHaveLength(1);
    expect(records[0]).not.toHaveProperty('cardLines');
  });
});
