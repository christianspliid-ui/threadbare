// @vitest-environment jsdom
/**
 * THR-2201 — the price a card shows, after the two purse rule fixes.
 *
 * Browser-verify substitution: jsdom-render — unattended run; the change is the
 * price text on a card and whether it is lit, so a render assertion on the real
 * `buildNudgePhaseModel` → `NudgePhaseShell` path is the stronger evidence (it
 * can also assert the absence of the old discount), per verification-gates.md.
 *
 * A Mind/Spirit god (bought points on the ascendant node) whose every pool holds
 * essence — the income floor's shape:
 *  - an Order card (unbought) shows its full price: the stray discount is gone;
 *  - a Mind card (bought) keeps its discount;
 *  - a sphere-less card is priced against Mind + Spirit only, so with those two
 *    nearly empty it is dimmed even though Order holds plenty.
 */

import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup, renderHook, act } from '@testing-library/react';
import { useNudgeHand } from '../useNudgeHand';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { ActionStep, StepNudge, UnifiedAction, UnifiedActionTemplate } from '../../../../types/unifiedAction';
import { SPHERE_NAMES } from '../../../../types/index';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { NudgePhaseShell } from '../shells/NudgePhaseShell';

const ORDER: StepNudge = { id: 'nothing_breaks', name: 'Nothing Breaks Tonight', sphere: 'order', essenceCost: 3, forecastDelta: 0.05, effectLine: 'The night holds.' };
const MIND: StepNudge = { id: 'count_the_cost', name: 'Count What It Costs', sphere: 'mind', essenceCost: 3, forecastDelta: 0.05, effectLine: 'She reckons it.' };
const COMMON: StepNudge = { id: 'steady_hands', name: 'Steady Hands', essenceCost: 4, forecastDelta: 0.05, effectLine: 'Her hands stop shaking.' };

function step(): ActionStep {
  return {
    reach: 'shadow', duration: { min: 1, max: 2 }, difficulty: 0.5, onSuccess: [], onFailure: [],
    failBehavior: 'continue_weakened', narrativeTemplate: 'The ledger is open.', purposeLine: 'Balance the ledger',
    nudges: [ORDER, MIND, COMMON],
  } as ActionStep;
}

function template(s: ActionStep): UnifiedActionTemplate {
  return {
    id: 'test.purse_bite', rarityTier: 1, intrinsicTier: 'background', name: 'The Ledger', reach: 'shadow',
    crudType: 'read', scale: 'local', steps: [s], apCost: 1, actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'The ledger is open.', success: 'It balances.', failure: 'It does not.' },
  } as UnifiedActionTemplate;
}

function graph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'agent.clerk', type: 'actor', name: 'Ines Marr', properties: { actorType: 'individual' } });
  g.addNode({ id: 'loc.hall', type: 'location', name: 'The Counting Hall', properties: {} });
  g.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant', spherePoints: { mind: 3, spirit: 2 } } } as never);
  return g;
}

const ACTION = {
  actionId: 'ua_purse', actorId: 'agent.clerk', templateId: 'test.purse_bite', targetId: 'loc.hall',
  scale: 'local', source: 'agent', startTick: 3, currentStep: 0, stepProgress: 0, stepDuration: 2,
  resolved: false, stepOutcomes: [],
} as unknown as UnifiedAction;

function godState(g: WorldGraph): GameState {
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 30;
  pool.mind = 2.5; // enough for the discounted Mind card (2), not for a 4-cost common card
  pool.spirit = 1;
  return {
    graph: g, ascendantId: 'asc', essencePool: pool, unlockedActionIds: [],
    ascendantIdentity: { sphereAlignment: { primary: 'mind', secondary: 'spirit' }, hungerId: 'hunger.witness' },
  } as unknown as GameState;
}

afterEach(cleanup);

describe('THR-2201 · the hand prices only the god\'s own spheres', () => {
  it('quotes full price on an unbought sphere, keeps the home discount, and dims a common card the home pools cannot cover', () => {
    const s = step();
    const g = graph();
    const phase = buildNudgePhaseModel({ template: template(s), activeAction: ACTION, step: s, graph: g, gameState: godState(g) })!;
    const byId = new Map(phase.cards.map((c) => [c.id, c]));

    expect(byId.get(ORDER.id)?.essenceCost).toBe(3);
    expect(byId.get(ORDER.id)?.discounted).toBe(false);
    expect(byId.get(MIND.id)?.essenceCost).toBe(2);
    expect(byId.get(MIND.id)?.discounted).toBe(true);
    expect(byId.get(COMMON.id)?.state).toBe('dimmed');
    expect(byId.get(COMMON.id)?.blockedCode).toBe('essence_unavailable');
    expect(phase.payableSpheres).toEqual(['mind', 'spirit']);
    // The pooled total stays the hook's overall guard (review finding, round 1).
    expect(phase.availableEssence).toBeCloseTo(2.5 + 1 + 30 * (SPHERE_NAMES.length - 2));

    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    const order = screen.getByTestId(`nudge-card-${ORDER.id}`).textContent ?? '';
    const mind = screen.getByTestId(`nudge-card-${MIND.id}`).textContent ?? '';
    // The face prints the price as essence pips (✦), one per essence.
    const pips = (text: string) => (text.match(/^✦+/u)?.[0] ?? '').length;
    expect(pips(order)).toBe(3); // full price — before THR-2201 the stray discount showed 2
    expect(pips(mind)).toBe(2);
  });

  it('selecting a home card leaves an unbought-sphere card its own pool can pay still playable', () => {
    const s = step();
    const g = graph();
    const phase = buildNudgePhaseModel({ template: template(s), activeAction: ACTION, step: s, graph: g, gameState: godState(g) })!;
    const { result } = renderHook(({ p }) => useNudgeHand(p), { initialProps: { p: phase } });
    const order = () => result.current.cards.find((c) => c.id === ORDER.id)!;
    expect(order().interactive).toBe(true);
    act(() => result.current.toggle(MIND.id));
    expect(result.current.selectedIds).toEqual([MIND.id]);
    // Order pays from Order (30); the 2-essence Mind card must not starve it.
    expect(order().interactive).toBe(true);
    expect(order().state).toBe('playable');
  });

  it('a run with no sphere identity keeps the whole-pool rules (no payableSpheres, the common card stays lit)', () => {
    const s = step();
    const g = graph();
    const legacy = { ...godState(g), ascendantIdentity: undefined } as unknown as GameState;
    const phase = buildNudgePhaseModel({ template: template(s), activeAction: ACTION, step: s, graph: g, gameState: legacy })!;
    expect(phase.payableSpheres).toBeUndefined();
    expect(phase.budgetSphere).toBeUndefined();
    // Priced against the whole pool, as the commit (no payableSpheres) will charge it.
    expect(phase.cards.find((c) => c.id === COMMON.id)?.state).toBe('playable');
  });
});
