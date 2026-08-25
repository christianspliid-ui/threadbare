// @vitest-environment jsdom
/**
 * The attunement card reaches the rendered hand. THR-1180.
 *
 * The engine half is covered in `src/engine/__tests__/essenceEarned.test.ts`.
 * This file covers the half that engine test cannot see: that
 * `buildNudgePhaseModel` actually threads `GameState.essenceEarnedBySphere` into
 * `RepertoireContext`, and that the resulting card renders. A counter wired into
 * the tick loop but not into the adapter would pass every engine assertion and
 * still never deal a card — the LEAKED shape the interface map exists to catch.
 *
 * **Browser-verify substitution: jsdom-render — unattended run, no startable dev
 * server.** `preview_start` is refused in scheduled runs, which shuts the
 * Playwright route too (it presumes a running server). This asserts the rendered
 * DOM of the real `NudgePhaseShell` instead, in both directions: the authored
 * face is on screen once attuned, and absent when not.
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
import type { SphereName } from '../../../../types/index';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { NUDGE_CARD_LIBRARY, cardDisplayTitle } from '../../../../data/nudge-card-library';
import { NudgePhaseShell } from '../shells/NudgePhaseShell';

// The card under test is drawn from the shipped library, not invented: the point
// is that a *real* attunement member reaches the hand. Its id and mark are read
// off the corpus so the test follows the content rather than restating it.
const ATTUNED = NUDGE_CARD_LIBRARY.find(
  (m) => m.unlock?.kind === 'sphere_attunement' && m.sphere === 'chaos',
)!;
// Non-null: the first test asserts the member exists before anything else runs,
// so a corpus that lost it fails by name there rather than as a type error here.
const MARK = (ATTUNED.unlock as { threshold: number }).threshold;

const NUDGE: StepNudge = {
  id: 'attuned_swing',
  name: 'The wider swing',
  sphere: 'chaos' as SphereName,
  libraryCardId: ATTUNED.id,
  essenceCost: 1,
  forecastDelta: 0.1,
  fiction: 'The loose stone under his heel turns further than it should.',
  effectLine: 'Further either way.',
};

const STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'The ledge is narrower than it looked from below.',
  nudges: [NUDGE],
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.attunement_encounter',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Narrow Ledge',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  steps: [STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: {
    initiation: 'The ledge is narrower than it looked from below.',
    success: 'He crosses.',
    failure: 'He does not.',
  },
};

function graph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'agent.climber',
    type: 'actor',
    name: 'Odren Vask',
    properties: { actorType: 'individual' },
  });
  g.addNode({ id: 'loc.ledge', type: 'location', name: 'The Narrow Ledge', properties: {} });
  return g;
}

const ACTION: UnifiedAction = {
  actionId: 'ua_attune_1',
  actorId: 'agent.climber',
  templateId: TEMPLATE.id,
  targetId: 'loc.ledge',
  scale: 'local',
  source: 'agent',
  startTick: 3,
  currentStep: 0,
  stepProgress: 0,
  stepDuration: 2,
  resolved: false,
  stepOutcomes: [],
};

/** A chaos-primary god with `earned` lifetime essence drawn through chaos. */
function state(earned: number | undefined): GameState {
  return {
    // Enough chaos essence to pay — so a card that fails to appear failed on the
    // repertoire gate and not on affordability, which is the whole distinction.
    essencePool: { chaos: 5 } as unknown as GameState['essencePool'],
    unlockedActionIds: [],
    ascendantIdentity: { sphereAlignment: { primary: 'chaos', secondary: 'order' } },
    ...(earned === undefined ? {} : { essenceEarnedBySphere: { chaos: earned } }),
  } as unknown as GameState;
}

function phaseFor(earned: number | undefined) {
  return buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: ACTION,
    step: STEP,
    graph: graph(),
    gameState: state(earned),
  })!;
}

describe('attunement reaches the encounter stage', () => {
  it('the library actually ships a chaos attunement member to test with', () => {
    // Guards the whole file against going vacuous: every assertion below is
    // driven off `ATTUNED`, so a corpus that lost its chaos member would turn
    // this into a suite that tests nothing while still passing.
    expect(ATTUNED, 'no chaos attunement member in the library').toBeDefined();
    expect(MARK).toBeGreaterThan(0);
    // Renamed to imperative verb + noun by THR-1224 (doctrine v2 card-name
    // shape); the id is what stayed stable, which is the point of the rename.
    expect(cardDisplayTitle(ATTUNED)).toBe('Widen The Swing');
  });

  it('withholds the card below the mark', () => {
    const playable = phaseFor(MARK - 1).cards.filter((c) => c.state === 'playable');
    expect(playable.map((c) => c.id)).not.toContain('attuned_swing');
  });

  it('withholds the card with the counter absent — the legacy-save row', () => {
    const playable = phaseFor(undefined).cards.filter((c) => c.state === 'playable');
    expect(playable.map((c) => c.id)).not.toContain('attuned_swing');
  });

  it('deals the card at the mark — the counter reaches the adapter', () => {
    const playable = phaseFor(MARK).cards.filter((c) => c.state === 'playable');
    expect(playable.map((c) => c.id)).toContain('attuned_swing');
  });

  it('renders the attuned card on the stage, and does not render it unattuned', () => {
    // The rendered DOM, not the model: the adapter could thread the counter
    // correctly and the shell still drop the card, and a model-only assertion
    // would not know.
    const { unmount } = render(
      <NudgePhaseShell phase={phaseFor(MARK)} onCommit={() => {}} />,
    );
    expect(screen.getByText('The wider swing')).toBeInTheDocument();
    unmount();

    render(<NudgePhaseShell phase={phaseFor(MARK - 1)} onCommit={() => {}} />);
    expect(screen.queryByText('The wider swing')).not.toBeInTheDocument();
  });
});
