/**
 * THR-2072 — `FACTION_BOUNTIES_ENABLED = false` restores today's behaviour: the old
 * target pick and `reward` stamp, no guard, no collection, no refund, no licence.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../types/factionAction', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../types/factionAction')>();
  return { ...actual, FACTION_BOUNTIES_ENABLED: false };
});

import { WorldGraph } from '../graph';
import { closeBounties, collectBounty } from '../factionBounties';
import { executeIssueBounty } from '../phaseFactionActions';
import type { GameState } from '../../types/gameState';

describe('THR-2072 switch off', () => {
  it('posts as before and collects and refunds nothing', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'f', name: 'Guild', type: 'actor', properties: { actorType: 'faction', wealth: 40 } });
    g.addNode({ id: 'r', name: 'Rebels', type: 'actor', properties: { actorType: 'faction' } });
    g.addNode({ id: 'h', name: 'Edda', type: 'actor', properties: { actorType: 'individual', wealth: 30 } });
    g.addEdge({ id: 'm', source: 'h', target: 'f', type: 'member_of', properties: { role: 'member', rank: 0.3, joinedTick: 0 } });
    // A faction target is still picked when the switch is off.
    g.addEdge({ id: 'hr', source: 'f', target: 'r', type: 'hostile_to', properties: {} });
    const state = { tick: 10, graph: g } as unknown as GameState;

    const record = executeIssueBounty(state, g.getNode('f')!, () => 0);
    const id = (record!.details as { bountyId: string }).bountyId;
    expect(g.getNode(id)!.properties.reward).toBe(10);
    expect(g.getNode(id)!.properties.escrow).toBeUndefined();
    // No one-per-target guard.
    expect(executeIssueBounty({ ...state, tick: 11 } as GameState, g.getNode('f')!, () => 0)).not.toBeNull();

    expect(collectBounty({ graph: g }, id, 'h', 12)).toBeNull();
    expect(closeBounties({ graph: g }, 500)).toBe(0);
    expect(g.getNode(id)!.properties.status).toBe('active');
  });
});
