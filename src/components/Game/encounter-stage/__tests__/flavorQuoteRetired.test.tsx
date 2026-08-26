// @vitest-environment jsdom
/**
 * The flavor quote is retired. THR-1224 took it off the face; THR-1225 took the
 * field itself.
 *
 * Prose Doctrine v2 § *Retired by name* strikes "the flavor quote", and
 * `NudgePhaseShell` was the only surface that ever drew `StepNudge.fiction`.
 *
 * **What this test is now for has changed, and the change is the point.** Under
 * THR-1224 the field still held real text and the face drew none of it, so the
 * retirement was *behavioural* and needed a render to prove. Its second arm
 * pinned where the retirement happened, and said in as many words that if a
 * later change stripped `fiction` from the adapter, that arm was what would
 * notice. THR-1225 is that change — the arm did its job and is gone with the
 * field.
 *
 * The retirement is now **structural**: `StepNudge.fiction`,
 * `EncounterStageNudgeCardModel.fiction` and `NudgeCardMember.quote` do not
 * exist, so a quote cannot creep back onto a card without a type error first.
 * What survives here is the half a type cannot check — that the hand still
 * renders its surviving anatomy, and that removing the field left no blank
 * element holding its old space.
 *
 * **Asserted in both directions.** Every absence assertion is paired with the
 * presence of the card's surviving anatomy on the same render: a test that only
 * proves something is absent cannot tell "the quote was removed" from "the card
 * did not render at all", and the second reading passes just as green while the
 * hand is broken.
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

const NUDGES: StepNudge[] = [
  {
    id: 'steady_hand',
    name: 'Steady The Hand',
    essenceCost: 1,
    forecastDelta: 0.08,
    effectLine: 'Steadier than she was.',
  },
  {
    id: 'force_it',
    name: 'Throw Full Weight',
    essenceCost: 1,
    forecastDelta: 0.05,
    effectLine: 'The bar gives where her shoulder meets it.',
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
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.flavor_quote_retired',
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
  actionId: 'ua_flavor_quote',
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

/**
 * The two `GameState` fields `buildNudgePhaseModel` actually reads.
 *
 * Widened through `unknown` rather than asserted straight to `GameState`: the
 * partial genuinely does not overlap the full type, and a direct `as` is the
 * cast that hides an invented member. Naming the shape first keeps the fixture
 * honest about which two fields it is standing in for.
 */
const PARTIAL_STATE: Pick<GameState, 'essencePool' | 'unlockedActionIds'> = {
  essencePool: { force: 5 } as unknown as GameState['essencePool'],
  unlockedActionIds: [],
};

function buildPhase() {
  return buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: ACTION,
    step: STEP,
    graph: buildGraph(),
    gameState: PARTIAL_STATE as unknown as GameState,
  })!;
}

function renderShell() {
  const phase = buildPhase();
  render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
  return phase;
}

// ─── Tests ────────────────────────────────────────────────────────

describe('NudgePhaseShell — the flavor quote is retired (THR-1224, THR-1225)', () => {
  it('renders the hand with its surviving anatomy', () => {
    const phase = renderShell();

    // Presence first: without this the structural assertions below are vacuous —
    // an empty hand trivially carries no retired field.
    expect(phase.cards.length, 'fixture produced no cards').toBeGreaterThan(0);
    for (const card of phase.cards) {
      expect(screen.getByText(card.name), `card ${card.id} did not render`).toBeTruthy();
      expect(screen.getByText(card.effectLine), `effect line for ${card.id}`).toBeTruthy();
    }
  });

  it('exposes no fiction- or quote-shaped key on any card model', () => {
    // The field is gone from the type, so a reintroduction is a compile error
    // first. This is the runtime backstop for the one route that would not be:
    // an adapter spreading an untyped object onto the card model.
    const phase = buildPhase();
    expect(phase.cards.length, 'fixture produced no cards').toBeGreaterThan(0);
    for (const card of phase.cards) {
      const keys = Object.keys(card);
      expect(keys, `card ${card.id} carries a retired field`).not.toContain('fiction');
      expect(keys, `card ${card.id} carries a retired field`).not.toContain('fictionBySetting');
      expect(keys, `card ${card.id} carries a retired field`).not.toContain('quote');
    }
  });

  it('draws no empty italic paragraph where the quote used to sit', () => {
    // The failure mode a naive removal produces: the `<p>` stays and renders
    // blank, which holds the card's footer spacing and looks like a layout bug
    // rather than a retired field.
    renderShell();
    const italics = [...document.querySelectorAll('p')].filter(
      (node) => (node.textContent ?? '').trim() === '',
    );
    expect(italics, 'an empty paragraph survived the quote').toHaveLength(0);
  });
});
