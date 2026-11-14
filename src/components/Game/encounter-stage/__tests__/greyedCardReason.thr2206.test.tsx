// @vitest-environment jsdom
/**
 * THR-2206 — a greyed card says which pool is short and how fast it refills
 * (plan `2026-11-13-thr-2201-make-the-purse-bite.md` slice B, PC-1).
 *
 * The Done-when's pin: a dimmed card's reason names the same pool its
 * `shortSphere` reports — on the engine model, after the hook's live dimming,
 * and on the rendered face. Also pins the exact player-facing strings and the
 * two price-hover lines.
 */

import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup, renderHook, act } from '@testing-library/react';
import { useNudgeHand } from '../useNudgeHand';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { ActionStep, StepNudge, UnifiedAction, UnifiedActionTemplate } from '../../../../types/unifiedAction';
import { SPHERE_NAMES } from '../../../../types/index';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import {
  essenceShortReason,
  nudgeCostNote,
  nudgeShortSphere,
} from '../../../../engine/views/stage/buildNudgePhaseModel';
import { readEssenceRefill } from '../../../../engine/views/essenceRefill';
import { sphereWord } from '../../../../data/essence-format';
import { NUDGE_BLOCKED_REASONS } from '../../../../data/nudge-stage-content';
import { NudgePhaseShell } from '../shells/NudgePhaseShell';

const ORDER: StepNudge = { id: 'nothing_breaks', name: 'Nothing Breaks Tonight', sphere: 'order', essenceCost: 3, forecastDelta: 0.05, effectLine: 'The night holds.' };
const MIND: StepNudge = { id: 'count_the_cost', name: 'Count What It Costs', sphere: 'mind', essenceCost: 3, forecastDelta: 0.05, effectLine: 'She reckons it.' };
const MIND_SMALL: StepNudge = { id: 'tally', name: 'A Quiet Tally', sphere: 'mind', essenceCost: 2, forecastDelta: 0.03, effectLine: 'She counts twice.' };
const COMMON: StepNudge = { id: 'steady_hands', name: 'Steady Hands', essenceCost: 4, forecastDelta: 0.05, effectLine: 'Her hands stop shaking.' };

function step(nudges: StepNudge[]): ActionStep {
  return {
    reach: 'shadow', duration: { min: 1, max: 2 }, difficulty: 0.5, onSuccess: [], onFailure: [],
    failBehavior: 'continue_weakened', narrativeTemplate: 'The ledger is open.', purposeLine: 'Balance the ledger',
    nudges,
  } as ActionStep;
}

function template(s: ActionStep): UnifiedActionTemplate {
  return {
    id: 'test.greyed_reason', rarityTier: 1, intrinsicTier: 'background', name: 'The Ledger', reach: 'shadow',
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
  actionId: 'ua_reason', actorId: 'agent.clerk', templateId: 'test.greyed_reason', targetId: 'loc.hall',
  scale: 'local', source: 'agent', startTick: 3, currentStep: 0, stepProgress: 0, stepDuration: 2,
  resolved: false, stepOutcomes: [],
} as unknown as UnifiedAction;

function godState(g: WorldGraph, mind: number, spirit: number): GameState {
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 30;
  pool.mind = mind;
  pool.spirit = spirit;
  return {
    graph: g, ascendantId: 'asc', essencePool: pool, unlockedActionIds: [],
    ascendantIdentity: { sphereAlignment: { primary: 'mind', secondary: 'spirit' }, hungerId: 'hunger.witness' },
  } as unknown as GameState;
}

afterEach(cleanup);

describe('THR-2206 · the greyed reason words', () => {
  it('reads the plan\'s exact strings, and the bare form when no refill band is known', () => {
    expect(essenceShortReason('mind', true, 'slow')).toBe('Not enough Mind — refills slowly');
    expect(essenceShortReason('mind', false, 'steady')).toBe('Not enough in your spheres — Mind refills steadily');
    expect(essenceShortReason('mind', true, undefined)).toBe('Not enough Mind');
    expect(essenceShortReason('mind', false, undefined)).toBe('Not enough in your spheres — Mind pays first');
    expect(essenceShortReason('chaos', true, 'drains')).toBe('Not enough Chaos — drains');
  });

  it('the price hover lines', () => {
    expect(nudgeCostNote({}, 'mind')).toBe('Paid from your own spheres, Mind first.');
    expect(nudgeCostNote({ sphere: 'mind', discounted: true }, 'mind')).toBe('One less: Mind is yours.');
    expect(nudgeCostNote({ sphere: 'order', discounted: false }, 'mind')).toBeUndefined();
    expect(nudgeCostNote({}, undefined)).toBeUndefined();
  });

  it('the short pool is the card\'s sphere, else the primary', () => {
    expect(nudgeShortSphere({ sphere: 'order' }, 'mind')).toBe('order');
    expect(nudgeShortSphere({}, 'mind')).toBe('mind');
    expect(nudgeShortSphere({}, undefined)).toBeUndefined();
  });
});

describe('THR-2206 · a dimmed card\'s reason names the pool `shortSphere` reports', () => {
  it('on the engine model and the rendered face', () => {
    const s = step([ORDER, MIND, COMMON]);
    const g = graph();
    const state = godState(g, 1, 1); // Mind (2 after discount) and the common card (4) are short
    const phase = buildNudgePhaseModel({ template: template(s), activeAction: ACTION, step: s, graph: g, gameState: state })!;
    const byId = new Map(phase.cards.map((c) => [c.id, c]));
    const bands = readEssenceRefill(g, 'asc').spheres;

    const mind = byId.get(MIND.id)!;
    const common = byId.get(COMMON.id)!;
    expect(mind.state).toBe('dimmed');
    expect(common.state).toBe('dimmed');
    expect(mind.shortSphere).toBe('mind');
    expect(common.shortSphere).toBe('mind');
    expect(mind.blockedReason).toBe(essenceShortReason('mind', true, bands.mind?.band));
    expect(common.blockedReason).toBe(essenceShortReason('mind', false, bands.mind?.band));
    for (const card of [mind, common]) {
      expect(card.blockedReason).toContain(sphereWord(card.shortSphere!));
      expect(card.blockedReason).not.toBe(NUDGE_BLOCKED_REASONS.essence_unavailable);
    }
    expect(mind.blockedReason!.startsWith('Not enough Mind')).toBe(true);
    expect(common.blockedReason!.startsWith('Not enough in your spheres')).toBe(true);
    // A lit card carries no shortSphere.
    expect(byId.get(ORDER.id)?.shortSphere).toBeUndefined();

    // The hover lines ride the models.
    expect(common.costNote).toBe('Paid from your own spheres, Mind first.');
    expect(mind.costNote).toBe('One less: Mind is yours.');
    expect(byId.get(ORDER.id)?.costNote).toBeUndefined();

    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    expect(screen.getByTestId(`nudge-card-reason-${MIND.id}`).textContent).toBe(mind.blockedReason);
    expect(screen.getByTestId(`nudge-card-reason-${COMMON.id}`).textContent).toBe(common.blockedReason);
  });

  it('after the hand\'s live remainder greys a card', () => {
    const s = step([MIND, MIND_SMALL]);
    const g = graph();
    // Mind pays 2 + 1 = 3 for both; 2.5 covers either but not both.
    const phase = buildNudgePhaseModel({ template: template(s), activeAction: ACTION, step: s, graph: g, gameState: godState(g, 2.5, 1) })!;
    const { result } = renderHook(({ p }) => useNudgeHand(p), { initialProps: { p: phase } });
    const small = () => result.current.cards.find((c) => c.id === MIND_SMALL.id)!;
    expect(small().state).toBe('playable');
    expect(small().shortSphere).toBeUndefined();
    act(() => result.current.toggle(MIND.id));
    expect(small().state).toBe('dimmed');
    expect(small().shortSphere).toBe('mind');
    expect(small().blockedReason!.startsWith('Not enough Mind')).toBe(true);
  });

  it('a run with no identity keeps the generic reason and no shortSphere', () => {
    const s = step([ORDER, MIND, COMMON]);
    const g = graph();
    const legacy = { ...godState(g, 0.5, 0.5), ascendantIdentity: undefined } as unknown as GameState;
    // Starve every pool so something dims on the whole-pool rules.
    for (const k of Object.keys(legacy.essencePool!)) (legacy.essencePool as Record<string, number>)[k] = 0.1;
    const phase = buildNudgePhaseModel({ template: template(s), activeAction: ACTION, step: s, graph: g, gameState: legacy })!;
    const dimmed = phase.cards.filter((c) => c.state === 'dimmed' && c.blockedCode === 'essence_unavailable');
    expect(dimmed.length).toBeGreaterThan(0);
    for (const card of dimmed) {
      expect(card.shortSphere).toBeUndefined();
      expect(card.blockedReason).toBe(NUDGE_BLOCKED_REASONS.essence_unavailable);
    }
  });
});
