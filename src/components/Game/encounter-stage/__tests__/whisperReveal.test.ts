/**
 * The Whisper's test-panel reveal — THR-1179 (workstream C, UI pillar).
 *
 * The one card in the deck that buys a *line* rather than odds, and therefore
 * the only one whose liveness is a question about the panel model rather than
 * about the dispatcher. `nudgeTypeMechanics.test.ts` proves the sentence is
 * derived correctly; this proves it reaches the surface, which is a different
 * claim and the one that fails silently — a reveal derived into a variable
 * nobody reads renders exactly like a reveal that was never built.
 *
 * Ticket: THR-1179 · Plan: `Docs/plans/2026-08-18-thr-1178-nudge-library-completion.md`
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type {
  ActionStep,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';

const WHISPER: StepNudge = {
  id: 'whisper_card',
  name: 'Listen ahead',
  essenceCost: 1,
  forecastDelta: 0,
  reveals: 'next_step_demand',
  effectLine: 'You hear what is coming.',
};

const PLAIN: StepNudge = {
  id: 'plain_card',
  name: 'Steady the hand',
  essenceCost: 1,
  forecastDelta: 0.08,
  effectLine: 'Steadier than she was.',
};

const FIRST_STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'The door has not moved in a hundred years.',
  nudges: [WHISPER, PLAIN],
};

/** The step the Whisper is sold to reveal. A different reach, so it is legible. */
const SECOND_STEP: ActionStep = {
  reach: 'shadow',
  duration: { min: 1, max: 2 },
  difficulty: 0.8,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'Someone is already inside.',
};

function template(steps: UnifiedActionTemplate['steps']): UnifiedActionTemplate {
  return {
    id: 'test.whisper_encounter',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'The Darkhollow Vault',
    reach: 'iron',
    crudType: 'read',
    scale: 'local',
    steps,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'A door.', success: 'It moves.', failure: 'It does not.' },
  };
}

/** A pool holding only `force`, mirroring the sibling suites' fixture. */
function buildState(): Partial<GameState> {
  return {
    essencePool: { force: 5 } as unknown as GameState['essencePool'],
    unlockedActionIds: [],
  };
}

function graph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'agent.thief', type: 'actor', name: 'Sera Vance',
    properties: { actorType: 'individual' },
  });
  g.addNode({ id: 'loc.vault', type: 'location', name: 'Darkhollow Vault', properties: {} });
  return g;
}

function action(activeNudges: string[]): UnifiedAction {
  return {
    actionId: 'ua_whisper_1',
    actorId: 'agent.thief',
    templateId: 'test.whisper_encounter',
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

function panel(activeNudges: string[], steps: UnifiedActionTemplate['steps']) {
  const model = buildNudgePhaseModel({
    template: template(steps),
    activeAction: action(activeNudges),
    step: FIRST_STEP,
    graph: graph(),
    gameState: buildState() as GameState,
  });
  return model?.testPanel.factors ?? [];
}

const REVEAL_ID = 'reveal:next_step_demand';

describe('the Whisper reveal reaches the test panel (THR-1179)', () => {
  it('adds no line until the card is actually committed', () => {
    // The falsifying half. Without it, a panel that revealed unconditionally
    // would pass every assertion below while giving the reveal away for free —
    // which is the same card with its price removed.
    const factors = panel([], [FIRST_STEP, SECOND_STEP]);
    expect(factors.some((f) => f.id === REVEAL_ID)).toBe(false);
  });

  it('names the coming step’s reach once the Whisper is committed', () => {
    const factors = panel([WHISPER.id], [FIRST_STEP, SECOND_STEP]);
    const reveal = factors.find((f) => f.id === REVEAL_ID);
    expect(reveal, 'the committed Whisper should add its line').toBeDefined();
    expect(reveal!.text).toContain('shadow');
  });

  it('prints no digit on the panel, whatever the coming difficulty is', () => {
    // UI Law 13/14 on the surface as composed, not merely on the derivation:
    // the adapter enriches the text before it lands, so the check belongs here
    // as well as at the engine seam.
    const reveal = panel([WHISPER.id], [FIRST_STEP, SECOND_STEP])
      .find((f) => f.id === REVEAL_ID);
    expect(reveal!.text).not.toMatch(/[0-9]/);
  });

  it('draws no pips — the reveal moves no odds', () => {
    // A `delta` here would draw a pip row claiming the card improved the roll.
    // It did not; it told the player something.
    const reveal = panel([WHISPER.id], [FIRST_STEP, SECOND_STEP])
      .find((f) => f.id === REVEAL_ID);
    expect(reveal!.delta).toBeUndefined();
  });

  it('renders once even when two Whispers are committed', () => {
    const second: StepNudge = { ...WHISPER, id: 'whisper_card_2' };
    const model = buildNudgePhaseModel({
      template: template([{ ...FIRST_STEP, nudges: [WHISPER, second] }, SECOND_STEP]),
      activeAction: action([WHISPER.id, second.id]),
      step: { ...FIRST_STEP, nudges: [WHISPER, second] },
      graph: graph(),
      gameState: buildState() as GameState,
    });
    const reveals = (model?.testPanel.factors ?? []).filter((f) => f.id === REVEAL_ID);
    expect(reveals).toHaveLength(1);
  });

  it('says plainly that nothing follows when this is the last step', () => {
    const reveal = panel([WHISPER.id], [FIRST_STEP]).find((f) => f.id === REVEAL_ID);
    expect(reveal, 'the reveal is still worth its price on a final step').toBeDefined();
    expect(reveal!.text).not.toContain('shadow');
  });
});
