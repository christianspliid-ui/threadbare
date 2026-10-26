/**
 * THR-2042 — a faction's commission pays the member who takes it up.
 * Plan: Docs/plans/2026-10-25-thr-2042-faction-commission-pay.md § Done when.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  openCommissionsOf,
  takeUpCommission,
  lapseCommissions,
  readFactionCommissions,
} from '../factionCommissions';
import { COMMISSION_MEANS_PAY, COMMISSION_QUEST_COST } from '../../types/factionAction';
import { EDGE_SCHEMA } from '../../types/edgeSchema';
import { meansChangeSentence, buildMeansChange } from '../mortalMeans';
import { COMMISSION_CAUSE_LINE } from '../../data/mortal-means-constants';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';

const FACTION = 'faction_guild';
const MEMBER = 'agent_kael';

function world(opts: { memberWealth?: number; memberTier?: string; purse?: number } = {}): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: FACTION, name: 'Civic Guard', type: 'actor',
    properties: { actorType: 'faction', factionDefId: 'civic_guard', wealth: opts.purse ?? 20 },
  });
  g.addNode({
    id: MEMBER, name: 'Kael Thornweaver', type: 'actor',
    properties: {
      actorType: 'individual',
      wealth: opts.memberWealth ?? 30,
      ...(opts.memberTier ? { spotlightTier: opts.memberTier } : {}),
    },
  });
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

const wealthOf = (g: WorldGraph, id: string) => g.getNode(id)!.properties.wealth as number;

describe('takeUpCommission', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });

  it('a decider member takes the oldest open posting: Means paid, posting taken, one took_up edge', () => {
    const g = world();
    const older = post(g, 5);
    const newer = post(g, 8);
    const taken = takeUpCommission({ graph: g }, MEMBER, FACTION, 10);

    expect(taken?.commissionId).toBe(older);
    expect(wealthOf(g, MEMBER)).toBe(30 + COMMISSION_MEANS_PAY);
    expect(g.getNode(MEMBER)!.properties.lastWealthReason).toBe('commission');

    const posting = g.getNode(older)!.properties;
    expect(posting.status).toBe('taken');
    expect(posting.claimed).toBe(true);
    expect(posting.takenTick).toBe(10);
    expect(posting.escrow).toBe(0);
    expect(posting.escrowPaid).toBe(COMMISSION_QUEST_COST);

    const edges = g.getIncomingEdges(older, 'took_up');
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe(MEMBER);
    // Passes EDGE_SCHEMA: endpoint types and required props.
    const schema = EDGE_SCHEMA.took_up;
    expect(g.getNode(edges[0].source)!.type).toBe(schema.sourceNodeType);
    expect(g.getNode(edges[0].target)!.type).toBe(schema.targetNodeType);
    for (const key of schema.requiredProperties ?? []) expect(edges[0].properties).toHaveProperty(key);

    expect(openCommissionsOf(g, FACTION, 10).map(n => n.id)).toEqual([newer]);
    const trace = getTraces().find(t => t.category === 'economy.commission') as unknown as Record<string, unknown>;
    expect(trace).toMatchObject({ action: 'taken', commissionId: older, agentId: MEMBER, escrow: COMMISSION_QUEST_COST });
  });

  it('a non-decider member takes nothing', () => {
    const g = world({ memberTier: 'ambient' });
    const id = post(g, 5);
    expect(takeUpCommission({ graph: g }, MEMBER, FACTION, 10)).toBeNull();
    expect(g.getNode(id)!.properties.status).toBe('open');
    expect(g.getIncomingEdges(id, 'took_up')).toHaveLength(0);
    expect(wealthOf(g, MEMBER)).toBe(30);
  });

  it('a completion with no open posting takes nothing', () => {
    const g = world();
    expect(takeUpCommission({ graph: g }, MEMBER, FACTION, 10)).toBeNull();
    expect(wealthOf(g, MEMBER)).toBe(30);
  });

  it('a non-member is never handed a faction id, and an unknown agent takes nothing', () => {
    const g = world();
    post(g, 5);
    expect(takeUpCommission({ graph: g }, 'agent_nobody', FACTION, 10)).toBeNull();
  });

  it('an expired posting is not taken', () => {
    const g = world();
    post(g, 5, 3);
    expect(takeUpCommission({ graph: g }, MEMBER, FACTION, 10)).toBeNull();
  });

  it('a Magnate at 100 leaves the posting open for the next member', () => {
    const g = world({ memberWealth: 100 });
    const id = post(g, 5);
    expect(takeUpCommission({ graph: g }, MEMBER, FACTION, 10)).toBeNull();
    expect(g.getNode(id)!.properties.status).toBe('open');
    expect(g.getNode(id)!.properties.escrow).toBe(COMMISSION_QUEST_COST);
    expect(g.getIncomingEdges(id, 'took_up')).toHaveLength(0);
  });

  it('a posting already taken is never taken twice', () => {
    const g = world();
    const id = post(g, 5);
    takeUpCommission({ graph: g }, MEMBER, FACTION, 10);
    expect(takeUpCommission({ graph: g }, MEMBER, FACTION, 11)).toBeNull();
    expect(g.getIncomingEdges(id, 'took_up')).toHaveLength(1);
  });
});

describe('lapseCommissions', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });

  it('refunds the escrow to the purse exactly once', () => {
    const g = world({ purse: 20 });
    const id = post(g, 5);
    expect(lapseCommissions({ graph: g }, 34)).toBe(0);
    expect(lapseCommissions({ graph: g }, 35)).toBe(1);
    expect(wealthOf(g, FACTION)).toBe(20 + COMMISSION_QUEST_COST);
    expect(g.getNode(id)!.properties.status).toBe('lapsed');
    expect(lapseCommissions({ graph: g }, 36)).toBe(0);
    expect(wealthOf(g, FACTION)).toBe(20 + COMMISSION_QUEST_COST);
    const trace = getTraces().find(t => t.category === 'economy.commission') as unknown as Record<string, unknown>;
    expect(trace).toMatchObject({ action: 'lapsed', commissionId: id, escrow: COMMISSION_QUEST_COST });
  });

  it('a taken posting never lapses', () => {
    const g = world({ purse: 20 });
    post(g, 5);
    takeUpCommission({ graph: g }, MEMBER, FACTION, 10);
    expect(lapseCommissions({ graph: g }, 100)).toBe(0);
    expect(wealthOf(g, FACTION)).toBe(20);
  });

  it('a posting made before THR-2042 (no escrow, no status) lapses with nothing refunded', () => {
    const g = world({ purse: 20 });
    const id = post(g, 5);
    delete g.getNode(id)!.properties.escrow;
    delete g.getNode(id)!.properties.status;
    expect(lapseCommissions({ graph: g }, 40)).toBe(1);
    expect(wealthOf(g, FACTION)).toBe(20);
  });
});

describe('readFactionCommissions', () => {
  it('derives takenBy from the took_up edge', () => {
    const g = world();
    const a = post(g, 5);
    const b = post(g, 6);
    takeUpCommission({ graph: g }, MEMBER, FACTION, 10);
    expect(readFactionCommissions(g, FACTION)).toEqual([
      { id: a, status: 'taken', escrow: 0, createdTick: 5, expiryTick: 35, takenBy: MEMBER, takenTick: 10 },
      { id: b, status: 'open', escrow: COMMISSION_QUEST_COST, createdTick: 6, expiryTick: 36 },
    ]);
  });
});

describe('the Means sentence cause', () => {
  const inside = { wealthBefore: 30, wealthAfter: 36, bandBefore: 'Getting by', bandAfter: 'Getting by' } as const;
  const crossing = { wealthBefore: 38, wealthAfter: 44, bandBefore: 'Getting by', bandAfter: 'Comfortable' } as const;

  it('without a cause the text is unchanged', () => {
    expect(meansChangeSentence('Kael Thornweaver', inside).detail).toBe('Kael Thornweaver comes away a little richer.');
    expect(meansChangeSentence('Kael Thornweaver', crossing).detail).toBe('Kael Thornweaver is now Comfortable.');
    expect(meansChangeSentence(undefined, inside).detail).toBe('They come away a little richer.');
  });

  it('with the commission cause the detail names it', () => {
    expect(meansChangeSentence('Kael Thornweaver', inside, COMMISSION_CAUSE_LINE).detail)
      .toBe('Kael Thornweaver comes away a little richer — a commission their faction paid for.');
    const change = buildMeansChange('id', MEMBER, 'Kael Thornweaver',
      { ...crossing, amount: 6, reason: 'commission' } as never, MEMBER, { cause: COMMISSION_CAUSE_LINE });
    expect(change.title).toBe('Better off');
    expect(change.detail).toBe('Kael Thornweaver is now Comfortable — a commission their faction paid for.');
  });
});
