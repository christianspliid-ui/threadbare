import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import { selectFirstScreenReveal, hasRivalActed, unreadChapterCount } from '../firstScreenReveal';

function makeState(opts: { bonded: boolean; rivalActed?: boolean; omen?: boolean }): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'mortal', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  if (opts.bonded) {
    graph.addEdge({
      id: 'e1', type: 'thread', source: 'asc', target: 'mortal',
      properties: { courtPosition: 'the_first' },
    });
  }
  return {
    graph,
    ascendantId: 'asc',
    rivalStates: [{
      rivalId: 'r1', active: true, interventionCount: opts.rivalActed ? 1 : 0,
      agentsControlled: 0, regionsInfluenced: [], hostilityToPlayer: 0,
    }],
    omenState: opts.omen ? { primary: { id: 'o' } } : undefined,
  } as unknown as GameState;
}

describe('selectFirstScreenReveal (THR-1648)', () => {
  it('hides every pressure surface before the bond, even when a rival has acted', () => {
    const r = selectFirstScreenReveal(makeState({ bonded: false, rivalActed: true, omen: true }));
    expect(r).toEqual({ bonded: false, doom: false, mandate: false, notables: false, rivals: false, omens: false });
  });

  it('shows doom, mandate and notables at the bond; rivals and omens wait for their first event', () => {
    const r = selectFirstScreenReveal(makeState({ bonded: true }));
    expect(r.doom && r.mandate && r.notables).toBe(true);
    expect(r.rivals).toBe(false);
    expect(r.omens).toBe(false);
  });

  it('shows rivals after the first rival action and omens with the first omen', () => {
    const r = selectFirstScreenReveal(makeState({ bonded: true, rivalActed: true, omen: true }));
    expect(r.rivals).toBe(true);
    expect(r.omens).toBe(true);
  });

  it('hasRivalActed counts a launched scheme as an action', () => {
    const s = makeState({ bonded: true });
    (s.rivalStates[0] as { lastSchemeLaunchTick?: number }).lastSchemeLaunchTick = 5;
    expect(hasRivalActed(s)).toBe(true);
  });
});

describe('unreadChapterCount (THR-1648)', () => {
  it('counts only chapters since the last open and never goes negative', () => {
    expect(unreadChapterCount(12, 0)).toBe(12);
    expect(unreadChapterCount(12, 12)).toBe(0);
    expect(unreadChapterCount(14, 12)).toBe(2);
    expect(unreadChapterCount(3, 12)).toBe(0);
  });
});
