// @vitest-environment jsdom
/**
 * The hand bar — THR-1732.
 *
 * Hands deal 4–8 cards and wrap at `CARDS_PER_ROW`, so a two-row hand is
 * ordinary, and two rows put the commit below the 1080 fold. The fix pins the
 * essence counter, the commit and the glyph legend into one sticky bar at the
 * bottom of the scrolling column. What jsdom can pin is the bar's *contents* and
 * its sticky declaration; whether sticky resolves in the real veil column is the
 * browser-verify Done-when, because the ancestors that could break it live in
 * `EncounterVeil` and the meeting beats, which this render cannot see.
 *
 * The phase comes from the real `buildNudgePhaseModel`, as in the sibling
 * suites, so an adapter change breaks these rather than sliding past them.
 *
 * Plan: `Docs/plans/2026-10-04-thr-1732-five-card-hand-fit.md`
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type {
  ActionStep,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import {
  CARDS_PER_ROW,
  HAND_BAR_FADE_PX,
  HAND_BAR_PAD_Y_PX,
  HAND_BAR_SKIRT_PX,
  NudgePhaseShell,
} from '../shells/NudgePhaseShell';

// ─── Fixtures ─────────────────────────────────────────────────────

const NUDGES: StepNudge[] = [
  {
    id: 'steady_hand',
    name: 'Steady the hand',
    essenceCost: 1,
    forecastDelta: 0.08,
    effectLine: 'Steadier than she was.',
  },
];

function buildStep(withNudges: boolean): ActionStep {
  return {
    reach: 'iron',
    duration: { min: 1, max: 2 },
    difficulty: 0.5,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    narrativeTemplate: 'The vault door has not moved in a hundred years.',
    ...(withNudges ? { nudges: NUDGES } : {}),
  };
}

function buildTemplate(step: ActionStep): UnifiedActionTemplate {
  return {
    id: 'test.hand_bar',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'The Darkhollow Vault',
    reach: 'iron',
    crudType: 'read',
    scale: 'local',
    steps: [step],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: {
      initiation: 'The vault door has not moved in a hundred years.',
      success: 'It moves.',
      failure: 'It does not move.',
    },
  };
}

const ACTION: UnifiedAction = {
  actionId: 'ua_hand_bar',
  actorId: 'agent.thief',
  templateId: 'test.hand_bar',
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

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.thief',
    type: 'actor',
    name: 'Sera Vance',
    properties: { actorType: 'individual' },
  });
  graph.addNode({ id: 'loc.vault', type: 'location', name: 'Darkhollow Vault', properties: {} });
  return graph;
}

function buildPhase(withNudges: boolean) {
  const step = buildStep(withNudges);
  return buildNudgePhaseModel({
    template: buildTemplate(step),
    activeAction: ACTION,
    step,
    graph: buildGraph(),
    gameState: {
      essencePool: { force: 3 } as unknown as GameState['essencePool'],
      unlockedActionIds: [],
    } as unknown as GameState,
    allowEmptyHand: true,
  })!;
}

// ─── Tests ────────────────────────────────────────────────────────

describe('hand bar (THR-1732)', () => {
  it('holds the commit, the essence counter and the glyph legend', () => {
    render(<NudgePhaseShell phase={buildPhase(true)} onCommit={() => {}} />);
    const bar = screen.getByTestId('nudge-hand-bar');

    expect(bar.contains(screen.getByTestId('nudge-commit'))).toBe(true);
    expect(bar.contains(screen.getByTestId('nudge-remaining-essence'))).toBe(true);
    expect(bar.contains(screen.getByTestId('nudge-glyph-legend'))).toBe(true);
  });

  /**
   * The falsification twin for the move: the counter and the legend must have
   * *left* the row above the cards, not been copied. Drawing them twice would
   * pass the containment test above while costing the hand the very height the
   * move was for.
   */
  it('draws the counter and the legend once — nothing left above the cards', () => {
    render(<NudgePhaseShell phase={buildPhase(true)} onCommit={() => {}} />);
    expect(screen.getAllByTestId('nudge-remaining-essence')).toHaveLength(1);
    expect(screen.getAllByTestId('nudge-glyph-legend')).toHaveLength(1);

    // Document order: the cards come before the bar, so the bar is under them.
    const row = screen.getByTestId('nudge-card-row');
    const bar = screen.getByTestId('nudge-hand-bar');
    expect(row.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('is the shell’s last child, so at max scroll it sits at its natural place', () => {
    render(<NudgePhaseShell phase={buildPhase(true)} onCommit={() => {}} />);
    const shell = screen.getByTestId('nudge-phase-shell');
    expect(shell.lastElementChild).toBe(screen.getByTestId('nudge-hand-bar'));
  });

  it('declares sticky at the bottom with the named padding and fade', () => {
    render(<NudgePhaseShell phase={buildPhase(true)} onCommit={() => {}} />);
    const bar = screen.getByTestId('nudge-hand-bar');
    expect(bar.style.position).toBe('sticky');
    expect(bar.style.bottom).toBe('0px');
    expect(bar.style.paddingTop).toBe(`${HAND_BAR_FADE_PX}px`);
    expect(bar.style.paddingBottom).toBe(`${HAND_BAR_PAD_Y_PX}px`);
    // The skirt covers the column's bottom padding the stuck bar rides above.
    expect(bar.style.boxShadow).toContain(`${HAND_BAR_SKIRT_PX}px`);
  });

  /** No `ResizeObserver` in jsdom ⇒ the documented fail-soft: "false". */
  it('reports no overflow when it cannot measure', () => {
    render(<NudgePhaseShell phase={buildPhase(true)} onCommit={() => {}} />);
    expect(screen.getByTestId('nudge-hand-bar').getAttribute('data-hand-overflow')).toBe('false');
  });

  it('keeps the commit and drops the legend on an empty hand', () => {
    render(<NudgePhaseShell phase={buildPhase(false)} onCommit={() => {}} />);
    const bar = screen.getByTestId('nudge-hand-bar');
    expect(bar.contains(screen.getByTestId('nudge-commit'))).toBe(true);
    expect(bar.contains(screen.getByTestId('nudge-remaining-essence'))).toBe(true);
    expect(screen.queryByTestId('nudge-glyph-legend')).toBeNull();
  });

  it('leaves the Law 33 row cap at four', () => {
    expect(CARDS_PER_ROW).toBe(4);
  });
});
