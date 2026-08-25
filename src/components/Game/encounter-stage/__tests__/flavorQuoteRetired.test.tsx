// @vitest-environment jsdom
/**
 * The flavor quote is retired from the card face. THR-1224.
 *
 * Prose Doctrine v2 § *Retired by name* strikes "the flavor quote", and
 * `NudgePhaseShell` was the only surface that ever drew `StepNudge.fiction` —
 * so this is the whole of the retirement's observable behaviour.
 *
 * **Asserted in both directions, in one render.** A test that only proves the
 * fiction is absent cannot tell "the quote was removed" from "the card did not
 * render at all", and the second reading would pass just as green while the
 * hand was broken. So every arm below pairs the absence with the presence of
 * the card's surviving anatomy — name, effect line, odds — on the same card.
 *
 * `fiction` is deliberately still *populated* on the fixture, and still carried
 * through the phase model. That is the point of the test: the field holds real
 * text and the face draws none of it. Emptying the corpus's ~150 strings edits
 * the same files as the doctrine-v2 rewrite (THR-1223), so it rides a deferral;
 * until then this is what stops the quote from creeping back onto a card.
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

/**
 * Two cards, both carrying fiction — one distinctive enough that a substring
 * search cannot collide with any other string the shell draws.
 */
const FICTION_ONE = 'The tremor in her fingers stops between one breath and the next.';
const FICTION_TWO = 'Zarquon marmalade cartwheels through the vestibule.';

const NUDGES: StepNudge[] = [
  {
    id: 'steady_hand',
    name: 'Steady The Hand',
    essenceCost: 1,
    forecastDelta: 0.08,
    fiction: FICTION_ONE,
    effectLine: 'Steadier than she was.',
  },
  {
    id: 'force_it',
    name: 'Throw Full Weight',
    essenceCost: 1,
    forecastDelta: 0.05,
    fiction: FICTION_TWO,
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

describe('NudgePhaseShell — the flavor quote is retired (THR-1224)', () => {
  it('renders the hand, and draws no card fiction anywhere in it', () => {
    const phase = renderShell();

    // Presence first: without this the absence assertions below are vacuous —
    // an empty document trivially contains no fiction.
    expect(phase.cards.length, 'fixture produced no cards').toBeGreaterThan(0);
    for (const card of phase.cards) {
      expect(screen.getByText(card.name), `card ${card.id} did not render`).toBeTruthy();
      expect(screen.getByText(card.effectLine), `effect line for ${card.id}`).toBeTruthy();
    }

    // Absence, over the whole rendered tree rather than one node — a quote
    // moved to a different element would still be a rendered quote.
    for (const fiction of [FICTION_ONE, FICTION_TWO]) {
      expect(screen.queryByText(fiction), `fiction rendered: "${fiction}"`).toBeNull();
      expect(document.body.textContent).not.toContain(fiction);
    }
  });

  it('still carries fiction on the phase model — the face is what changed', () => {
    // Pins WHERE the retirement happened. If a later change strips `fiction`
    // from the adapter instead, the test above would keep passing for a reason
    // it does not state, and this arm is what notices.
    const phase = buildPhase();
    expect(phase.cards.map((card) => card.fiction)).toEqual([FICTION_ONE, FICTION_TWO]);
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
