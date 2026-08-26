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

/** The artifact's iron bonus — the fixture's delta-bearing line, THR-977. */
const RUSTED_KEY_IRON_BONUS = 0.06;

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.thief',
    type: 'actor',
    name: 'Sera Vance',
    properties: { actorType: 'individual' },
  });
  graph.addNode({ id: 'loc.vault', type: 'location', name: 'Darkhollow Vault', properties: {} });
  // A carried artifact, so the fixture holds a line that genuinely contributes
  // to the odds. Before THR-977 the derived skill line filled that role — but
  // it was filling it with absolute capability, which is the defect that ticket
  // fixed. Without a real contributor here both arms below go vacuous.
  graph.addNode({
    id: 'item.rusted_key',
    type: 'artifact',
    name: 'the Rusted Key',
    properties: { reachBonus: { iron: RUSTED_KEY_IRON_BONUS } },
  });
  graph.addEdge({
    id: 'e.carry',
    source: 'agent.thief',
    target: 'item.rusted_key',
    type: 'possesses',
    properties: {},
  });
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

  it('the equipment line is the delta-bearing one; authored and skill lines carry none', () => {
    // Pins WHICH lines populate each arm above, so a future adapter change that
    // silently drops every delta cannot leave both arms vacuously passing.
    const phase = renderShell();
    const byId = new Map(phase.testPanel.factors.map((f) => [f.id, f]));

    expect(byId.get('authored:0')?.delta).toBeUndefined();
    // THR-977 — the skill line moved from the delta-bearing arm to this one.
    // Capability is not an effect on the odds, so it states no contribution at
    // all rather than a zero one, and the pip row draws nothing.
    expect(byId.get('skill:iron')).toBeDefined();
    expect(byId.get('skill:iron')?.delta).toBeUndefined();
    // Literal expected value, not the constant under test on both sides: the
    // carried artifact contributes 0.06 to the iron roll and says so in pips.
    expect(byId.get('equipment:item.rusted_key')?.delta).toBeCloseTo(0.06, 5);
  });

  it('the skill line renders its sentence while drawing no pip row (THR-977)', () => {
    // The regression this ticket exists to prevent, stated directly: measured
    // 2026-08-02, `skill:stone` drew "Fated, 2 of 5" — the top odds tier — off
    // an ~0.85 capability, indistinguishable from the genuine contribution line
    // beside it. The sentence must survive; only the odds claim goes.
    renderShell();

    expect(screen.getByTestId('nudge-factor-skill:iron')).toBeTruthy();
    expect(screen.queryByTestId('nudge-factor-pips-skill:iron')).toBeNull();

    // Falsification twin: the assertion above must be capable of failing, so
    // pin that a pip row IS drawn for the line that legitimately has one.
    expect(screen.getByTestId('nudge-factor-pips-equipment:item.rusted_key')).toBeTruthy();

    // And the capability still reaches the player — through the word, which is
    // why dropping the pips loses nothing (`deriveSkillLine`'s own contract).
    expect(screen.getByTestId('nudge-factor-skill:iron').textContent).toContain('Sera Vance');
  });
});
