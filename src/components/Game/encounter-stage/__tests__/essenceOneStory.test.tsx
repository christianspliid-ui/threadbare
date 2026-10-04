// @vitest-environment jsdom
/**
 * THR-1706 — essence tells one story.
 *
 * Cold playtest round 2: three of three testers could not reconcile the
 * numbers. Two of the four causes are asserted here:
 *
 *  (4) A sphere-less card is billed to the god's primary sphere, and nothing on
 *      the card said so — "Spending '1 essence' on the Gold path took it from
 *      Life." The cost row now names the paying sphere, and the commit path
 *      bills the sphere the row named.
 *  (2) The hand's "essence left" line was all twelve pools summed (600), which
 *      matched no bar. It now counts down the paying sphere's own pool.
 *
 * Both arms are tested against the *real* builder and the *real* spend, so the
 * name on the card and the pool that is charged are proven to be one sphere
 * rather than two values that happen to agree in a fixture.
 */

import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
import { spendNudgeEssence, type EssencePool } from '../nudgeCommit';
import { budgetSphereRemaining } from '../useNudgeHand';

const NUDGES: StepNudge[] = [
  // Sphere-less: a Gold-path card with no sphere of its own.
  { id: 'count_the_coin', name: 'Count the coin', essenceCost: 2, forecastDelta: 0.05, effectLine: 'She knows the sum.' },
  // Sphere-gated: pays from its own pool, whatever the god's primary is.
  { id: 'lend_force', name: 'Lend force', essenceCost: 1, forecastDelta: 0.05, effectLine: 'Her arm is surer.', sphere: 'force' },
];

const STEP: ActionStep = {
  reach: 'gold',
  duration: { min: 1, max: 2 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'The ledger does not balance.',
  nudges: NUDGES,
  factorLines: [{ text: 'The ink is fresh.', polarity: 'for' }],
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.essence_one_story',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Unbalanced Ledger',
  reach: 'gold',
  crudType: 'read',
  scale: 'local',
  steps: [STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: { initiation: 'The ledger.', success: 'It balances.', failure: 'It does not.' },
};

const ACTION: UnifiedAction = {
  actionId: 'ua_essence_one_story',
  actorId: 'agent.clerk',
  templateId: TEMPLATE.id,
  targetId: 'loc.counting_house',
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
  graph.addNode({ id: 'agent.clerk', type: 'actor', name: 'Ivo Marr', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc.counting_house', type: 'location', name: 'Counting House', properties: {} });
  return graph;
}

const POOL = { life: 50, force: 50, darkness: 50 } as unknown as EssencePool;

function buildState(withIdentity: boolean): GameState {
  return {
    essencePool: { ...POOL },
    unlockedActionIds: [],
    ...(withIdentity
      ? {
          ascendantIdentity: {
            hungerId: 'hunger.witness',
            sphereAlignment: { primary: 'life', secondary: 'force' },
          },
        }
      : {}),
  } as unknown as GameState;
}

function buildPhase(withIdentity = true) {
  return buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: ACTION,
    step: STEP,
    graph: buildGraph(),
    gameState: buildState(withIdentity),
  })!;
}

describe('THR-1706 (4) — the cost row names the sphere that pays', () => {
  it('a sphere-less card names the primary; a gated card names its own sphere', () => {
    const phase = buildPhase();
    const byId = new Map(phase.cards.map((c) => [c.id, c]));
    expect(byId.get('count_the_coin')?.payingSphere).toBe('life');
    expect(byId.get('lend_force')?.payingSphere).toBe('force');
  });

  it('renders the paying sphere in words on each card face', () => {
    render(<NudgePhaseShell phase={buildPhase()} onCommit={() => {}} />);
    expect(screen.getByTestId('nudge-card-cost-sphere-count_the_coin').textContent).toBe('Life');
    expect(screen.getByTestId('nudge-card-cost-sphere-lend_force').textContent).toBe('Force');
  });

  it('the pool charged is the pool the card named', () => {
    const phase = buildPhase();
    const card = phase.cards.find((c) => c.id === 'count_the_coin')!;
    // The commit path's exact call: sphere-less request, `budgetSphere` first.
    const spend = spendNudgeEssence({ ...POOL }, [{ sphere: card.sphere, cost: card.essenceCost }], phase.budgetSphere!);
    expect(spend.ok).toBe(true);
    const drained = (Object.keys(POOL) as (keyof EssencePool)[]).filter((s) => spend.pool[s] < POOL[s]);
    expect(drained).toEqual([card.payingSphere]);
  });

  it('without a sphere identity, a sphere-less card names no payer (the legacy price-only row)', () => {
    const phase = buildPhase(false);
    expect(phase.cards.find((c) => c.id === 'count_the_coin')?.payingSphere).toBeUndefined();
    expect(phase.cards.find((c) => c.id === 'lend_force')?.payingSphere).toBe('force');
    expect(phase.budgetSphere).toBeUndefined();
  });
});

describe('THR-1706 (4) — a card never names one sphere and charges another', () => {
  // Review-gate round 1: priced against the pooled total, a Life-billed card
  // stayed playable with Life empty, and the commit spilled the cost onto Force.
  function buildLowPrimaryPhase() {
    return buildNudgePhaseModel({
      template: TEMPLATE,
      activeAction: ACTION,
      step: STEP,
      graph: buildGraph(),
      gameState: {
        ...buildState(true),
        essencePool: { life: 1, force: 50, darkness: 50 },
      } as unknown as GameState,
    })!;
  }

  it('a Life-billed card dims when Life cannot cover it, whatever the other pools hold', () => {
    render(<NudgePhaseShell phase={buildLowPrimaryPhase()} onCommit={() => {}} />);
    const card = screen.getByTestId('nudge-card-count_the_coin');
    expect(card.getAttribute('data-nudge-state')).toBe('dimmed');
    expect(card.getAttribute('data-nudge-blocked')).toBe('essence_unavailable');
    // The Force card pays from Force, which can cover it.
    expect(screen.getByTestId('nudge-card-lend_force').getAttribute('data-nudge-state')).toBe('playable');
  });
});

describe('THR-1706 (2) — the budget line is the paying sphere, not the grand total', () => {
  it('reads the primary pool and names it', () => {
    render(<NudgePhaseShell phase={buildPhase()} onCommit={() => {}} />);
    const line = screen.getByTestId('nudge-remaining-essence');
    expect(line.textContent).toBe('50 Life essence left');
    expect(line.getAttribute('data-budget-sphere')).toBe('life');
  });

  it('counts down only cards that bill that sphere', () => {
    const phase = buildPhase();
    expect(budgetSphereRemaining(phase, ['count_the_coin'])).toEqual({ sphere: 'life', remaining: 48 });
    // A Force card pays from Force — the Life line does not move.
    expect(budgetSphereRemaining(phase, ['lend_force'])).toEqual({ sphere: 'life', remaining: 50 });
  });

  it('moves as a Life-billed card is selected', () => {
    render(<NudgePhaseShell phase={buildPhase()} onCommit={() => {}} />);
    fireEvent.click(screen.getByTestId('nudge-card-count_the_coin'));
    expect(screen.getByTestId('nudge-remaining-essence').textContent).toBe('48 Life essence left');
  });

  it('falls back to the pooled total with no identity', () => {
    render(<NudgePhaseShell phase={buildPhase(false)} onCommit={() => {}} />);
    const line = screen.getByTestId('nudge-remaining-essence');
    expect(line.textContent).toBe('150 essence left');
    expect(line.getAttribute('data-budget-sphere')).toBeNull();
    // `within` keeps the import honest if the line ever grows children.
    expect(within(line).queryByText(/Life/)).toBeNull();
  });
});
