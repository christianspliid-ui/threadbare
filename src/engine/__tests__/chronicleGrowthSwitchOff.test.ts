/**
 * THR-1986 — with `CHRONICLE_THREADED_GROWTH_ONLY` off, the Chronicle takes every
 * growth line again (today's behaviour before the gate), and the fate-reveal
 * button reads "Go on".
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../data/chronicle-growth-content', async (orig) => ({
  ...(await orig<typeof import('../../data/chronicle-growth-content')>()),
  CHRONICLE_THREADED_GROWTH_ONLY: false,
}));

import { phaseNarrative } from '../orchestrator';
import { WorldGraph } from '../graph';
import { MEETING_FATE_REVEAL_CONTINUE } from '../../data/meeting-narrative-prose';
import type { GameState } from '../../types/gameState';

describe('Chronicle growth gate switched off', () => {
  it('a stranger\'s tier-up enters the Chronicle, still in words', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'oren', type: 'actor', name: 'Oren', properties: { actorType: 'individual' } });
    const state = {
      graph, ascendantId: 'asc', chronicleEntries: [], tick: 3,
      tickEvents: [{
        id: 'te-1', tick: 3, type: 'tier_promotion', message: 'Oren reached heart tier 4: "Warden"',
        significance: 0.8, actorId: 'oren', chronicleGate: 'threaded_only',
        playerProse: 'Oren is now steadfast in Heart and is called Warden.',
      }],
    } as unknown as GameState;
    const out = phaseNarrative(state);
    expect(out.chronicleEntries).toHaveLength(1);
    expect(out.chronicleEntries![0].prose).toBe('Oren is now steadfast in Heart and is called Warden.');
  });
});

describe('fate-reveal button (THR-1986)', () => {
  it('reads "Go on"', () => {
    expect(MEETING_FATE_REVEAL_CONTINUE).toBe('Go on');
  });
});
