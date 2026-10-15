// @vitest-environment jsdom
/**
 * THR-1858 item 1 — a Chaos price lands on a pool the player can see.
 *
 * Warm round 2 (veteran): "The 'Chaos' price didn't reduce any pool I can see
 * (Entropy stayed at 40)." The hand footer counted only the budget sphere, and
 * nothing on the hand opened the Elder powers fold. Now the footer names every
 * paying sphere, and hovering a card lights (and unfolds) the row it draws from.
 * The fold's open-on-charge half is pinned in `ascendant-bar/__tests__/readableSpend.test.tsx`.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { ActionStep, UnifiedAction, UnifiedActionTemplate } from '../../../../types/unifiedAction';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { NudgePhaseShell } from '../shells/NudgePhaseShell';
import { payingSpheresRemaining } from '../useNudgeHand';
import type { EncounterStageNudgePhaseModel } from '../types';
import { getEssencePreviewSphere, resetEssencePreview } from '../../ascendant-bar/essenceDisplay';

afterEach(() => {
  cleanup();
  resetEssencePreview();
});

const STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'The vault door has not moved in a hundred years.',
  nudges: [
    { id: 'steady_hand', name: 'Steady the hand', essenceCost: 3, forecastDelta: 0.08, effectLine: 'Steadier.' },
  ],
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.elder_payer',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Darkhollow Vault',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  steps: [STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: { initiation: 'The door.', success: 'It moves.', failure: 'It does not.' },
};

const ACTION: UnifiedAction = {
  actionId: 'ua_elder_payer',
  actorId: 'agent.thief',
  templateId: TEMPLATE.id,
  targetId: 'loc.vault',
  scale: 'local',
  source: 'agent',
  startTick: 3,
  currentStep: 0,
  stepProgress: 0,
  stepDuration: 2,
  resolved: false,
  stepOutcomes: [],
};

/** A real phase, then a Mind budget and a second card paid from Chaos. */
function phaseWithChaosCard(): EncounterStageNudgePhaseModel {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent.thief', type: 'actor', name: 'Sera Vance', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc.vault', type: 'location', name: 'Darkhollow Vault', properties: {} });
  const base = buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: ACTION,
    step: STEP,
    graph,
    gameState: {
      essencePool: { mind: 51, chaos: 40 } as unknown as GameState['essencePool'],
      unlockedActionIds: [],
    } as unknown as GameState,
    allowEmptyHand: true,
  })!;
  const card = base.cards[0];
  return {
    ...base,
    budgetSphere: 'mind',
    budgetSphereEssence: 51,
    payingSphereEssence: { mind: 51, chaos: 40 },
    cards: [
      { ...card, payingSphere: 'mind' },
      { ...card, id: 'chaos_card', name: 'Unmake the lock', sphere: 'chaos', payingSphere: 'chaos', essenceCost: 4 },
    ],
  };
}

describe('THR-1858 — every paying sphere is on the footer', () => {
  it('payingSpheresRemaining lists the budget sphere first, then each other payer, net of the selection', () => {
    const phase = phaseWithChaosCard();
    expect(payingSpheresRemaining(phase, [])).toEqual([
      { sphere: 'mind', remaining: 51 },
      { sphere: 'chaos', remaining: 40 },
    ]);
    expect(payingSpheresRemaining(phase, ['chaos_card'])).toEqual([
      { sphere: 'mind', remaining: 51 },
      { sphere: 'chaos', remaining: 36 },
    ]);
  });

  it('the footer counts every paying sphere and moves the Chaos number when the Chaos card is staged', () => {
    render(<NudgePhaseShell phase={phaseWithChaosCard()} onCommit={() => {}} />);
    const footer = screen.getByTestId('nudge-remaining-essence');
    expect(footer.getAttribute('data-paying-spheres')).toBe('mind,chaos');
    expect(footer.textContent).toMatch(/51 Mind · 40 Chaos essence left/);
    fireEvent.click(screen.getByText('Unmake the lock'));
    expect(screen.getByTestId('nudge-remaining-essence').textContent).toMatch(/51 Mind · 36 Chaos essence left/);
  });

  it('hovering the Chaos card previews the Chaos pool (which opens the Elder fold)', () => {
    render(<NudgePhaseShell phase={phaseWithChaosCard()} onCommit={() => {}} />);
    const scopes = screen.getAllByTestId('nudge-card-essence-preview');
    const chaosScope = scopes.find((s) => s.getAttribute('data-preview-sphere') === 'chaos')!;
    expect(chaosScope).toBeTruthy();
    fireEvent.mouseEnter(chaosScope.firstElementChild!);
    expect(getEssencePreviewSphere()).toBe('chaos');
    fireEvent.mouseLeave(chaosScope.firstElementChild!);
    expect(getEssencePreviewSphere()).toBeNull();
  });
});
