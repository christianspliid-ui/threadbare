/**
 * THR-1928 — the row's spend seam. A lean writes once against the live state and spends
 * in the updater (THR-1783, `withEssenceSpend(…, 'crossroads')`), without a toast — the
 * row's held line is the acknowledgement. A refusal spends nothing and returns its words.
 * A lift clears the lean, refunds nothing and toasts.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../engine/intentionReading', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, canReadIntention: () => ({ readable: true, secret: false }) };
});

import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import { leanOnRoad, liftLean, type CrossroadsActsDeps } from '../useCrossroadsActs';
import { readCrossroadsLean } from '../../../../engine/crossroads';

const GOD = 'god';
const KAEL = 'ind_kael';

function makeDeps(pool = 10): { deps: CrossroadsActsDeps; get: () => GameState; toasts: unknown[] } {
  const g = new WorldGraph();
  g.addNode({ id: GOD, type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  g.addNode({
    id: KAEL, type: 'actor', name: 'Kael',
    properties: {
      actorType: 'individual',
      crossroads: { tick: 9, options: [
        { family: 'encounter', templateId: 'duel', targetId: null, score: 1, reach: 'iron' },
        { family: 'encounter', templateId: 'feast', targetId: null, score: 0.9, reach: 'gold' },
      ] },
    },
  });
  g.addEdge({ id: 'thr', source: GOD, target: KAEL, type: 'thread', properties: {} });
  let state = {
    tick: 10, graph: g, ascendantId: GOD,
    essencePool: { force: pool, life: pool, energy: pool, matter: pool, mind: pool, spirit: pool, time: pool, entropy: pool },
  } as unknown as GameState;
  const toasts: unknown[] = [];
  const ref = { current: state };
  const deps: CrossroadsActsDeps = {
    gameStateRef: ref,
    runtime: null,
    setGameState: (u) => { state = typeof u === 'function' ? (u as (p: GameState) => GameState)(state) : u; ref.current = state; },
    pushToast: (t) => { toasts.push(t); },
  };
  return { deps, get: () => state, toasts };
}

describe('the Crossroads spend seam (THR-1928)', () => {
  it('a lean writes the lean, spends its price in its sphere, and does not toast', () => {
    const { deps, get, toasts } = makeDeps();
    const r = leanOnRoad(deps, KAEL, 1, 'toward');
    expect(r.ok).toBe(true);
    const lean = readCrossroadsLean(get().graph.getNode(KAEL)?.properties.crossroadsLean);
    expect(lean).toMatchObject({ templateId: 'feast', direction: 'toward', sphere: 'life' });
    expect(get().essencePool.life).toBe(10 - (lean?.essencePaid ?? 0));
    expect(lean?.essencePaid).toBeGreaterThan(0);
    expect(toasts).toHaveLength(0);
  });

  it('a refusal spends nothing and returns its words', () => {
    const { deps, get } = makeDeps(0);
    const r = leanOnRoad(deps, KAEL, 1, 'toward');
    expect(r).toEqual({ ok: false, message: 'Not enough Life essence.' });
    expect(get().essencePool.life).toBe(0);
    expect(get().graph.getNode(KAEL)?.properties.crossroadsLean).toBeUndefined();
  });

  it('a road no longer in the reading is refused in words', () => {
    const { deps } = makeDeps();
    expect(leanOnRoad(deps, KAEL, 5, 'toward')).toEqual({ ok: false, message: 'Kael no longer weighs that road.' });
  });

  it('a lift clears the lean, refunds nothing and toasts', () => {
    const { deps, get, toasts } = makeDeps();
    leanOnRoad(deps, KAEL, 1, 'toward');
    const after = get().essencePool.life;
    expect(liftLean(deps, KAEL).ok).toBe(true);
    expect(get().graph.getNode(KAEL)?.properties.crossroadsLean).toBeUndefined();
    expect(get().essencePool.life).toBe(after);
    expect(toasts).toHaveLength(1);
    expect((toasts[0] as { message: string }).message).toBe('You lift your hand from Kael.');
  });
});
