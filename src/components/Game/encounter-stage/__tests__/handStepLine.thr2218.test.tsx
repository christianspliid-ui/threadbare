// @vitest-environment jsdom
/**
 * THR-2218 — the hand bar says which step the cards land on, in the tracker's
 * words, before Play. Cards always count for the current step.
 */

import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { ActionStep, StepNudge, UnifiedAction, UnifiedActionTemplate } from '../../../../types/unifiedAction';
import { SPHERE_NAMES } from '../../../../types/index';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { nudgeHandStepLine } from '../../../../data/nudge-stage-content';
import { NudgePhaseShell } from '../shells/NudgePhaseShell';

const CARD: StepNudge = { id: 'steady_hands', name: 'Steady Hands', essenceCost: 2, forecastDelta: 0.05, effectLine: 'Her hands stop shaking.' };

function step(nudges: StepNudge[]): ActionStep {
  return {
    reach: 'iron', duration: { min: 1, max: 2 }, difficulty: 0.5, onSuccess: [], onFailure: [],
    failBehavior: 'continue_weakened', narrativeTemplate: 'The steel is cooling.', purposeLine: 'Temper the blade',
    nudges,
  } as ActionStep;
}

function template(steps: ActionStep[]): UnifiedActionTemplate {
  return {
    id: 'test.hand_step', rarityTier: 1, intrinsicTier: 'background', name: 'Flawed Steel', reach: 'iron',
    crudType: 'read', scale: 'local', steps, apCost: 1, actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'The forge is hot.', success: 'It holds.', failure: 'It cracks.' },
  } as UnifiedActionTemplate;
}

function setup(currentStep: number) {
  const g = new WorldGraph();
  g.addNode({ id: 'agent.smith', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  g.addNode({ id: 'loc.forge', type: 'location', name: 'The Forge', properties: {} });
  g.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } } as never);
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 30;
  const state = { graph: g, ascendantId: 'asc', essencePool: pool, unlockedActionIds: [] } as unknown as GameState;
  const s = step([CARD]);
  const action = {
    actionId: 'ua_steel', actorId: 'agent.smith', templateId: 'test.hand_step', targetId: 'loc.forge',
    scale: 'local', source: 'agent', startTick: 3, currentStep, stepProgress: 0, stepDuration: 2,
    resolved: false, stepOutcomes: currentStep > 0 ? ['success'] : [],
  } as unknown as UnifiedAction;
  return buildNudgePhaseModel({ template: template([s, s]), activeAction: action, step: s, graph: g, gameState: state })!;
}

afterEach(cleanup);

describe('THR-2218 · the hand says which step it plays into', () => {
  it('the words reuse the tracker and stay silent on a one-step chapter', () => {
    expect(nudgeHandStepLine(1, 2)).toBe('These cards go to step 1 of 2.');
    expect(nudgeHandStepLine(1, 1)).toBeNull();
    expect(nudgeHandStepLine(3, 2)).toBeNull();
  });

  it('renders on the hand bar for the current step', () => {
    const first = setup(0);
    expect(first.cards.length).toBeGreaterThan(0);
    const { unmount } = render(<NudgePhaseShell phase={first} onCommit={() => {}} totalSteps={2} />);
    expect(screen.getByTestId('nudge-hand-step').textContent).toBe('These cards go to step 1 of 2.');
    unmount();

    render(<NudgePhaseShell phase={setup(1)} onCommit={() => {}} totalSteps={2} />);
    expect(screen.getByTestId('nudge-hand-step').textContent).toBe('These cards go to step 2 of 2.');
  });

  it('a host that passes no step count shows nothing', () => {
    render(<NudgePhaseShell phase={setup(0)} onCommit={() => {}} />);
    expect(screen.queryByTestId('nudge-hand-step')).toBeNull();
  });
});
