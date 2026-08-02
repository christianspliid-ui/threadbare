// @vitest-environment jsdom
/**
 * Factor-line magnitude pips — THR-970.
 *
 * The THR-890/THR-892 seam: `EncounterStageFactorLineModel.delta` was added
 * "for the pip row" and nothing ever rendered it. These tests assert the render,
 * and — the part that matters — assert it against BOTH sides of the model's
 * documented contract in one pass. A test that only proves pips *appear* cannot
 * tell "renders the delta" from "draws a row on every line", which is precisely
 * the failure the contract forbids ("absent means draw no pips, never draw zero
 * pips").
 *
 * The phase is built by the real `buildNudgePhaseModel` rather than hand-shaped,
 * so a change to which lines carry a delta breaks this test instead of sliding
 * past it.
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
import { NudgePhaseShell } from '../shells/NudgePhaseShell';

// ─── Fixtures ─────────────────────────────────────────────────────
// Deliberately minimal: one card so the hand renders, one authored factor line
// (never carries a delta, by the adapter's own rule) and the always-derived
// agent skill line (always does). That pairing is what makes the falsification
// twin below possible without mocking anything.

const NUDGES: StepNudge[] = [
  {
    id: 'steady_hand',
    name: 'Steady the hand',
    essenceCost: 1,
    forecastDelta: 0.08,
    fiction: 'The tremor in her fingers stops between one breath and the next.',
    effectLine: 'Steadier than she was.',
  },
];

const STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'The vault door has not moved in a hundred years.',
  nudges: NUDGES,
  // Authored lines are the delta-less half of the contract.
  factorLines: [{ text: 'The hinges were set by a careful hand.', polarity: 'against' }],
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.nudge_factor_pips',
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
  narrativeTemplates: {
    initiation: 'The vault door has not moved in a hundred years.',
    success: 'It moves.',
    failure: 'It does not move.',
  },
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

const ACTION: UnifiedAction = {
  actionId: 'ua_nudge_pips',
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

/** A pool holding only `force`, mirroring the sibling suite's fixture. */
function buildState(force = 3): Partial<GameState> {
  return {
    essencePool: { force } as unknown as GameState['essencePool'],
    unlockedActionIds: [],
  };
}

function buildPhase() {
  return buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: ACTION,
    step: STEP,
    graph: buildGraph(),
    gameState: buildState() as GameState,
  })!;
}

function renderShell() {
  const phase = buildPhase();
  render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
  return phase;
}

// ─── Tests ────────────────────────────────────────────────────────

describe('NudgePhaseShell — factor-line magnitude pips (THR-970)', () => {
  it('draws a pip row on a factor line that carries a delta', () => {
    const phase = renderShell();

    const withDelta = phase.testPanel.factors.filter((f) => f.delta !== undefined);
    expect(withDelta.length, 'fixture produced no delta-bearing factor line').toBeGreaterThan(0);

    for (const factor of withDelta) {
      const pips = screen.getByTestId(`nudge-factor-pips-${factor.id}`);
      // The row states its own reading — shape carries magnitude, and the
      // accessible label is the one place it is spelled out (THR-890).
      expect(pips.getAttribute('aria-label'), `factor ${factor.id}`).toBeTruthy();
      expect(pips.getAttribute('data-pip-tier'), `factor ${factor.id}`).toBeTruthy();
    }
  });

  it('draws nothing on a factor line with no delta — never an empty row', () => {
    const phase = renderShell();

    const withoutDelta = phase.testPanel.factors.filter((f) => f.delta === undefined);
    expect(withoutDelta.length, 'fixture produced no delta-less factor line').toBeGreaterThan(0);

    for (const factor of withoutDelta) {
      // The line itself still renders — this asserts the absence of the pips,
      // not the absence of the factor.
      expect(screen.getByTestId(`nudge-factor-${factor.id}`)).toBeTruthy();
      expect(
        screen.queryByTestId(`nudge-factor-pips-${factor.id}`),
        `factor ${factor.id} drew a pip row with no delta`,
      ).toBeNull();
    }
  });

  it('the authored line is the delta-less one and the derived skill line the delta-bearing one', () => {
    // Pins WHICH lines populate each arm above, so a future adapter change that
    // silently drops every delta cannot leave both arms vacuously passing.
    const phase = renderShell();
    const byId = new Map(phase.testPanel.factors.map((f) => [f.id, f]));

    expect(byId.get('authored:0')?.delta).toBeUndefined();
    expect(typeof byId.get('skill:iron')?.delta).toBe('number');
  });
});
