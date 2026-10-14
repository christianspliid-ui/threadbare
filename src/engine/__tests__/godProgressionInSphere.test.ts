/**
 * THR-1811 — with `OFFERING_IN_SPHERE_ONLY` on, every offered card is sphereless or in
 * the god's two spheres (plan § Decided 1; measured 0.38 → 0.03 shared first-five buys).
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../data/god-progression-content', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/god-progression-content')>()),
  OFFERING_IN_SPHERE_ONLY: true,
}));

import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { offerableCards } from '../godProgression';

describe('THR-1811 — OFFERING_IN_SPHERE_ONLY', () => {
  it('offers only sphereless cards and cards in the primary or secondary', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'asc-1', type: 'actor', name: 'God',
      properties: { actorType: 'ascendant', domainAffinities: { heart: 4, stone: 3 }, sphereAlignment: { primary: 'life', secondary: 'spirit' } },
    });
    const state = { graph, ascendantId: 'asc-1', tick: 0, unlockedActionIds: [] } as unknown as GameState;
    const offer = offerableCards(state, 4);
    expect(offer.length).toBeGreaterThan(0);
    for (const t of offer) {
      expect([undefined, 'life', 'spirit']).toContain(t.sphereAffinity);
    }
  });
});
