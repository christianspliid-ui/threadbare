// @vitest-environment jsdom
/**
 * THR-2227 (plan THR-2204 slice 2) — the Apotheosis's line above its hand.
 *
 * The empty-purse case is built by the real `buildNudgePhaseModel` on a climax step
 * (one that fits its bare forecast) with an empty pool, so the line the shell draws
 * is the one the adapter decided. The arrival case's predicate (more than
 * `DEAL_HAND_MAX` cards) is pinned in `climaxFit.test.ts`; here the shell only has
 * to draw what the model carries.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { ActionStep, StepNudge, UnifiedAction, UnifiedActionTemplate } from '../../../../types/unifiedAction';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { NudgePhaseShell } from '../shells/NudgePhaseShell';
import { CLIMAX_BARE_FORECAST } from '../../../../data/nudge-constants';
import { NUDGE_EMPTY_HAND_LINE } from '../../../../data/nudge-stage-content';

const NUDGES: StepNudge[] = [
  { id: 'apo.mind', name: 'Count The Cost', sphere: 'mind', essenceCost: 2, forecastDelta: 0.07, effectLine: 'Show the price.' },
  { id: 'apo.life', name: 'One More Breath', sphere: 'life', essenceCost: 2, forecastDelta: 0.08, effectLine: 'Widen the body.' },
];

const STEP: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 3 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate: 'The doorway stands open.',
  nudges: NUDGES,
  fitBareForecast: CLIMAX_BARE_FORECAST,
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.climax_line',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Threshold',
  reach: 'star',
  crudType: 'read',
  scale: 'local',
  steps: [STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['sacrifice_survival'],
  narrativeTemplates: { initiation: 'A doorway.', success: 'Through.', failure: 'Closed.' },
};

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.first',
    type: 'actor',
    name: 'Kael Thornweaver',
    properties: { actorType: 'individual', gender: 'male' },
  });
  graph.addNode({ id: 'loc.shrine', type: 'location', name: 'Millbrook Shrine', properties: {} });
  return graph;
}

const ACTION: UnifiedAction = {
  actionId: 'ua_climax_line',
  actorId: 'agent.first',
  templateId: TEMPLATE.id,
  targetId: 'agent.first',
  scale: 'local',
  source: 'system',
  startTick: 361,
  currentStep: 0,
  stepProgress: 0,
  stepDuration: 2,
  resolved: false,
  stepOutcomes: [],
};

function buildPhase(pool: Record<string, number>) {
  return buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: ACTION,
    step: STEP,
    graph: buildGraph(),
    gameState: { essencePool: pool, unlockedActionIds: [] } as unknown as GameState,
  })!;
}

describe('NudgePhaseShell — the Apotheosis line (THR-2227)', () => {
  it('an empty purse reads a line naming the mortal, not the generic empty-hand line', () => {
    const phase = buildPhase({});
    expect(phase.climaxLine?.kind).toBe('empty_purse');
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    const line = screen.getByTestId('nudge-climax-line-empty_purse');
    expect(line.textContent).toBe('Your purse is empty. Kael Thornweaver stands in this doorway on his own.');
    expect(screen.queryByText(NUDGE_EMPTY_HAND_LINE)).toBeNull();
  });

  it('a purse that can pay draws no line on an ordinary-sized hand', () => {
    const phase = buildPhase({ mind: 30, life: 30 });
    expect(phase.climaxLine).toBeUndefined();
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    expect(screen.queryByTestId('nudge-climax-line-arrival')).toBeNull();
    expect(screen.queryByTestId('nudge-climax-line-empty_purse')).toBeNull();
  });

  it('draws the arrival line above the hand when the model carries it', () => {
    const phase = buildPhase({ mind: 30, life: 30 });
    const text = "A larger hand than any other chapter can give you. Some of it was earned in Kael Thornweaver's earlier chapters.";
    render(<NudgePhaseShell phase={{ ...phase, climaxLine: { kind: 'arrival', text } }} onCommit={() => {}} />);
    const line = screen.getByTestId('nudge-climax-line-arrival');
    expect(line.textContent).toBe(text);
    // Above the tray, in reading order (Law 1).
    const row = screen.getByTestId('nudge-card-row');
    expect(line.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
