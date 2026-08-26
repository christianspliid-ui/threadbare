// @vitest-environment jsdom
/**
 * The Whisper's reveal, rendered — THR-1179 (workstream C, UI pillar).
 *
 * Browser-verify substitution. `preview_start` is refused in unattended runs
 * ("Dev servers can't be started from unattended sessions"), which shuts the
 * Playwright route too since it presumes a running server — impediments #546,
 * #574, and again on this run. The sanctioned replacement is a jsdom render of
 * the real component: assert the DOM for every face the change produces, plus
 * absence where the line must not render.
 *
 * `whisperReveal.test.ts` proves the sentence reaches the panel *model*. This
 * proves the model reaches the *screen* — the failure between them is silent and
 * has precedent in this very component (THR-970: `delta` was added "for the pip
 * row" and nothing rendered it for two tickets).
 *
 * Ticket: THR-1179 · Plan: `Docs/plans/2026-08-18-thr-1178-nudge-library-completion.md`
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

const WHISPER: StepNudge = {
  id: 'whisper_card',
  name: 'Listen ahead',
  essenceCost: 1,
  forecastDelta: 0,
  reveals: 'next_step_demand',
  effectLine: 'You hear what is coming.',
};

const STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'The vault door has not moved in a hundred years.',
  nudges: [WHISPER],
};

/** The step being revealed. `shadow` so the reveal is unmistakable in the DOM. */
const NEXT_STEP: ActionStep = {
  reach: 'shadow',
  duration: { min: 1, max: 2 },
  difficulty: 0.8,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'Someone is already inside.',
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.whisper_encounter',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Darkhollow Vault',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  steps: [STEP, NEXT_STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: { initiation: 'A door.', success: 'It moves.', failure: 'It does not.' },
};

/** A pool holding only `force`, mirroring the sibling suites' fixture. */
function buildState(): Partial<GameState> {
  return {
    essencePool: { force: 5 } as unknown as GameState['essencePool'],
    unlockedActionIds: [],
  };
}

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.thief', type: 'actor', name: 'Sera Vance',
    properties: { actorType: 'individual' },
  });
  graph.addNode({ id: 'loc.vault', type: 'location', name: 'Darkhollow Vault', properties: {} });
  return graph;
}

function action(activeNudges: string[]): UnifiedAction {
  return {
    actionId: 'ua_whisper_1',
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
    activeNudges,
  } as unknown as UnifiedAction;
}

function renderShell(activeNudges: string[]) {
  const phase = buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: action(activeNudges),
    step: STEP,
    graph: buildGraph(),
    gameState: buildState() as GameState,
  })!;
  render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
  return phase;
}

describe('NudgePhaseShell — the Whisper reveal on screen (THR-1179)', () => {
  it('paints the revealed demand into the test panel', () => {
    const phase = renderShell([WHISPER.id]);

    const reveal = phase.testPanel.factors.find((f) => f.id === 'reveal:next_step_demand');
    expect(reveal, 'fixture produced no reveal line to render').toBeDefined();
    // The sentence itself, in the DOM — not the model field that feeds it.
    expect(screen.getByText(reveal!.text)).toBeTruthy();
    expect(reveal!.text).toContain('shadow');
  });

  it('paints nothing when the Whisper was not committed', () => {
    // The falsifying twin. Without it, a shell that rendered every derived line
    // unconditionally would satisfy the assertion above while giving the reveal
    // away to players who never paid for it.
    const phase = renderShell([]);

    expect(phase.testPanel.factors.some((f) => f.id === 'reveal:next_step_demand')).toBe(false);
    expect(screen.queryByText(/What comes after this/)).toBeNull();
  });

  it('shows no digit anywhere in the rendered panel (UI Law 13/14)', () => {
    // The law binds the surface *as composed*, so this reads the painted text
    // rather than the derivation. The difficulty being revealed is 0.8; if any
    // part of the chain leaked it, it would surface here.
    renderShell([WHISPER.id]);

    const revealed = screen.getByText(/What comes after this/);
    expect(revealed.textContent ?? '').not.toMatch(/[0-9]/);
  });
});
