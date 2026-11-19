/**
 * THR-2042 — `FACTION_COMMISSIONS_ENABLED = false` restores today's behaviour: no
 * take-up, no Means, no edge, no lapse refund.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../types/factionAction', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../types/factionAction')>();
  return { ...actual, FACTION_COMMISSIONS_ENABLED: false };
});

import { WorldGraph } from '../graph';
import { takeUpCommission, lapseCommissions } from '../factionCommissions';
import { composeSections } from '../detailPageGenerator';
import { FACTION_LINES } from '../../data/subject-sheet-words';
import type { GameState } from '../../types/gameState';

describe('THR-2042 switch off', () => {
  it('takes nothing and refunds nothing', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'f', name: 'Guild', type: 'actor', properties: { actorType: 'faction', wealth: 10 } });
    g.addNode({ id: 'a', name: 'Kael', type: 'actor', properties: { actorType: 'individual', wealth: 30 } });
    g.addNode({
      id: 'q', name: 'Guild Commission', type: 'event',
      properties: { eventType: 'faction_quest', factionId: 'f', expiryTick: 30, escrow: 5, status: 'open', createdTick: 0 },
    });
    g.addEdge({ id: 'e', source: 'f', target: 'q', type: 'commissions', properties: { expiryTick: 30 } });

    expect(takeUpCommission({ graph: g }, 'a', 'f', 5)).toBeNull();
    expect(g.getNode('a')!.properties.wealth).toBe(30);
    expect(g.getIncomingEdges('q', 'took_up')).toHaveLength(0);
    expect(lapseCommissions({ graph: g }, 50)).toBe(0);
    expect(g.getNode('f')!.properties.wealth).toBe(10);
    expect(g.getNode('q')!.properties.status).toBe('open');
  });

  it('THR-2043: the faction sheet promises no pay while the switch is off', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'f', name: 'Guild', type: 'actor', properties: { actorType: 'faction', wealth: 10 } });
    g.addNode({
      id: 'q', name: 'Guild Commission', type: 'event',
      properties: { eventType: 'faction_quest', factionId: 'f', expiryTick: 30, escrow: 5, status: 'open', createdTick: 0 },
    });
    g.addEdge({ id: 'e', source: 'f', target: 'q', type: 'commissions', properties: { expiryTick: 30 } });
    const state = { graph: g, tick: 5, seed: 42, ascendantId: 'asc' } as unknown as GameState;
    const text = composeSections('faction', { nodeId: 'f', pageKind: 'faction', graph: g, seed: 42, tick: 5, state })
      .map(s => (s.kind === 'prose' ? s.prose : '')).join(' ');
    expect(text).not.toContain(FACTION_LINES.openCommission);
  });
});
