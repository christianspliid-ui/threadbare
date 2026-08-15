// @vitest-environment jsdom
/**
 * The fate-alone stage — THR-1121.
 *
 * ## What this pins
 *
 * A step that authored **no** nudge hand and **no** choices used to be carried
 * by the generic supportive/coercive/withdrawn triple from
 * `generateInterventionChoices`, priced in essence and paying out in
 * `probabilityBoost` — the pre-nudge paid-RNG-modifier layer the Nudge Model
 * pivot rejects (THR-773/WS0). That producer is retired, so such a step now
 * renders the nudge stage with an empty hand: the moment is still framed, and
 * `Let fate decide` is the only move.
 *
 * Christian's finding, THR-974 verdict session (2026-08-15), on Swindler Found
 * step 2: *"this step 2 and the choices seem like legacy encounter design. am I
 * correct"* — and on the commit pair: *"i want something that fits what we do
 * now like the let fate decide button"*.
 *
 * ## Why jsdom rather than a browser capture
 *
 * This is the sanctioned browser-verify substitution for an unattended run
 * (`Browser-verify substitution: jsdom-render`). `preview_start` is refused in
 * scheduled sessions — *"Dev servers can't be started from unattended
 * sessions"* — which also shuts the Playwright route, since that presumes a
 * running server (impediments #546, #574). These assertions run against the
 * real `buildNudgePhaseModel` and the real `NudgePhaseShell`, so they are
 * evidence about the composed surface rather than about a mock of it.
 *
 * The phase is built by the production adapter for the same reason the sibling
 * suite does it: a change to what an empty hand produces must break this test
 * rather than slide past a hand-shaped fixture.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type {
  ActionStep,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { NudgePhaseShell } from '../shells/NudgePhaseShell';
import {
  NUDGE_COMMIT_LABEL,
  NUDGE_EMPTY_HAND_LINE,
} from '../../../../data/nudge-stage-content';

// ─── Fixtures ─────────────────────────────────────────────────────
// The point of the fixture is what it *lacks*: no `nudges` on the step. Nothing
// else here is load-bearing.

const STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'The vault door has not moved in a hundred years.',
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.fate_alone',
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

const ACTION: UnifiedAction = {
  actionId: 'ua_fate_alone',
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

function buildState(): Partial<GameState> {
  return {
    essencePool: { force: 3 } as unknown as GameState['essencePool'],
    unlockedActionIds: [],
  };
}

function buildFateAlonePhase(allowEmptyHand = true) {
  return buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: ACTION,
    step: STEP,
    graph: buildGraph(),
    gameState: buildState() as GameState,
    allowEmptyHand,
  });
}

// ─── Tests ────────────────────────────────────────────────────────

describe('fate-alone stage (THR-1121)', () => {
  /**
   * The falsification twin for every assertion below: without the flag the
   * adapter still bails, so the authored-choice templates that depend on the
   * choice screen are untouched by this change. A suite that only proved the
   * empty hand renders could not tell "fate-alone was added" from "the nudge
   * stage was made unconditional".
   */
  it('builds nothing without allowEmptyHand — the choice screen is untouched', () => {
    expect(buildFateAlonePhase(false)).toBeUndefined();
  });

  it('builds a phase with an empty hand when the step authored no nudges', () => {
    const phase = buildFateAlonePhase();
    expect(phase).toBeDefined();
    expect(phase!.cards).toEqual([]);
  });

  it('renders the empty-hand line and Let fate decide as the only move', () => {
    render(<NudgePhaseShell phase={buildFateAlonePhase()!} onCommit={() => {}} />);

    expect(screen.getByText(NUDGE_EMPTY_HAND_LINE)).toBeInTheDocument();
    expect(screen.getByTestId('nudge-commit')).toHaveTextContent(NUDGE_COMMIT_LABEL);

    // The retired pair, by name — the director's finding was about these words
    // being on screen, so their absence is the assertion.
    expect(screen.queryByText('Intervene')).toBeNull();
    expect(screen.queryByText('Resume')).toBeNull();
  });

  /**
   * Law 13/14 on the composed surface: magnitudes render as words, never
   * numerals. The retired stance set printed `+3% success` / `+15% success`
   * beside its choices; nothing on the fate-alone screen may print a percentage.
   * Scoped to a percent-shaped match rather than "any digit", because the step
   * counter ("1 of 2") and the essence pool are legitimately numeric.
   */
  it('prints no percentage anywhere on the stage', () => {
    const { container } = render(
      <NudgePhaseShell phase={buildFateAlonePhase()!} onCommit={() => {}} />,
    );
    expect(container.textContent).not.toMatch(/\d\s*%/);
  });

  /**
   * Committing an empty hand is the whole move, so it must reach the host with
   * an empty selection and a zero price — not be swallowed as "nothing
   * selected". This is the fate-alone path's equivalent of clicking a choice.
   */
  it('commits an empty hand at no cost', () => {
    const calls: Array<[string[], number]> = [];
    render(
      <NudgePhaseShell
        phase={buildFateAlonePhase()!}
        onCommit={(ids, cost) => calls.push([ids, cost])}
      />,
    );

    screen.getByTestId('nudge-commit').click();

    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toEqual([]);
    expect(calls[0][1]).toBe(0);
  });
});
