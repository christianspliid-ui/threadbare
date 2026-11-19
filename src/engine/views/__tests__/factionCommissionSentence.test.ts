/**
 * THR-2043 — the faction sheet names its open commission, and the sentence goes when the
 * commission is taken or lapses (Law 56: the sentence is the state).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { Section } from '../../../types/detailPage';
import { composeSections } from '../../detailPageGenerator';
import { takeUpCommission, lapseCommissions } from '../../factionCommissions';
import { COMMISSION_QUEST_COST } from '../../../types/factionAction';
import { FACTION_LINES } from '../../../data/subject-sheet-words';

const FACTION = 'faction_guild';
const MEMBER = 'agent_kael';

function world(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: FACTION, name: 'Civic Guard', type: 'actor',
    properties: { actorType: 'faction', factionDefId: 'civic_guard', wealth: 60 },
  });
  g.addNode({ id: MEMBER, name: 'Kael', type: 'actor', properties: { actorType: 'individual', wealth: 30 } });
  g.addEdge({
    id: 'e_member', source: MEMBER, target: FACTION, type: 'member_of',
    properties: { role: 'member', joinedTick: 0, rank: 0.3, factionDefId: 'civic_guard' },
  });
  return g;
}

/** Post a commission the way `executeCommissionQuest` does. */
function post(g: WorldGraph, tick: number, expiry = 30): string {
  const id = `faction_quest_${FACTION}_${tick}`;
  g.addNode({
    id, type: 'event', name: 'Civic Guard Commission',
    properties: {
      eventType: 'faction_quest', factionId: FACTION, factionDefId: 'civic_guard',
      expiryTick: tick + expiry, escrow: COMMISSION_QUEST_COST, status: 'open',
      createdTick: tick, claimed: false,
    },
  });
  g.addEdge({
    id: `e_commissions_${FACTION}_${id}`, source: FACTION, target: id,
    type: 'commissions', properties: { expiryTick: tick + expiry },
  });
  return id;
}

function purseRow(g: WorldGraph, tick: number): Section | undefined {
  const state = { graph: g, tick, seed: 42, ascendantId: 'asc' } as unknown as GameState;
  return composeSections('faction', { nodeId: FACTION, pageKind: 'faction', graph: g, seed: 42, tick, state })
    .find(s => s.typeId === 'purse');
}

const text = (s: Section | undefined): string => (s && s.kind === 'prose' ? s.prose : '');

describe('the faction sheet names its open commission (THR-2043)', () => {
  it('no posting → no commission sentence', () => {
    expect(text(purseRow(world(), 10))).not.toContain(FACTION_LINES.openCommission);
  });

  it('an open posting shows one sentence on the purse row', () => {
    const g = world();
    post(g, 5);
    const row = purseRow(g, 10);
    expect(row?.kind).toBe('prose');
    expect(text(row)).toContain(FACTION_LINES.openCommission);
    expect(text(row).split(FACTION_LINES.openCommission).length).toBe(2);
  });

  it('the sentence goes once the commission is taken', () => {
    const g = world();
    post(g, 5);
    expect(takeUpCommission({ graph: g }, MEMBER, FACTION, 10)).not.toBeNull();
    expect(text(purseRow(g, 11))).not.toContain(FACTION_LINES.openCommission);
  });

  it('the sentence goes once the commission lapses', () => {
    const g = world();
    post(g, 5, 30);
    expect(lapseCommissions({ graph: g }, 40)).toBe(1);
    expect(text(purseRow(g, 40))).not.toContain(FACTION_LINES.openCommission);
  });

  it('a posting past its expiry tick reads as closed even before the lapse pass runs', () => {
    const g = world();
    post(g, 5, 30);
    expect(text(purseRow(g, 35))).not.toContain(FACTION_LINES.openCommission);
  });

  it('the sentence is short sheet words with no numeral', () => {
    expect(FACTION_LINES.openCommission.split(/\s+/).length).toBeLessThanOrEqual(15);
    expect(FACTION_LINES.openCommission).not.toMatch(/\d/);
  });
});
