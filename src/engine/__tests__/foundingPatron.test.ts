/**
 * THR-2008 — the founding patron (decided on THR-2006).
 * Spec: Docs/audits/2026-10-21-thr-2006-founding-patron.md § 4.
 *
 * A founding the mortal cannot pay is paid by the faction they rank highest in whose
 * purse covers it. Founding costs ship off, so the charge arms mock the constants
 * module with costs on; the pick and the board test are pure and need no mock.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../data/mortal-means-constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/mortal-means-constants')>();
  return { ...actual, MEANS_CELL_COST_ENABLED: true, FOUNDING_PATRON_ENABLED: true };
});

import { WorldGraph } from '../graph';
import { findFoundingPatron, isFoundingUnaffordable, chargeFoundingPatron } from '../foundingPatron';
import { chargeFoundingCost } from '../strategicActionLifecycle';
import { cellTemplateId } from '../../data/undertaking-cells';
import { MEANS_CELL_COST } from '../../data/mortal-means-constants';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import type { StrategicActionCandidate } from '../../types/strategicAction';

const FOUNDER = 'agent_founder';
const HIGH = 'faction_b';
const LOW = 'faction_a';
const TOWN_COST = MEANS_CELL_COST['create×location'];

function world(opts: { founderWealth: number; high: number; low: number; highRank?: number; lowRank?: number }): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: FOUNDER, name: 'Edda', type: 'actor', properties: { actorType: 'individual', wealth: opts.founderWealth } });
  g.addNode({ id: HIGH, name: 'House Ashfold', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: opts.high } });
  g.addNode({ id: LOW, name: 'Millbrook Miners', type: 'actor', properties: { actorType: 'faction', factionClass: 'guild', wealth: opts.low } });
  g.addEdge({ id: 'e_high', source: FOUNDER, target: HIGH, type: 'member_of', properties: { role: 'member', joinedTick: 0, rank: opts.highRank ?? 0.8 } });
  g.addEdge({ id: 'e_low', source: FOUNDER, target: LOW, type: 'member_of', properties: { role: 'member', joinedTick: 0, rank: opts.lowRank ?? 0.2 } });
  return g;
}

function townCandidate(): StrategicActionCandidate {
  return { templateId: cellTemplateId('create', 'location'), actorId: FOUNDER } as unknown as StrategicActionCandidate;
}

const wealthOf = (g: WorldGraph, id: string) => g.getNode(id)!.properties.wealth as number;

describe('findFoundingPatron', () => {
  it('picks the highest-ranked purse faction whose treasury covers the cost', () => {
    expect(findFoundingPatron(world({ founderWealth: 0, high: 100, low: 100 }), FOUNDER, 40)).toBe(HIGH);
  });

  it('skips a faction whose treasury is below the cost', () => {
    expect(findFoundingPatron(world({ founderWealth: 0, high: 39, low: 100 }), FOUNDER, 40)).toBe(LOW);
    expect(findFoundingPatron(world({ founderWealth: 0, high: 39, low: 39 }), FOUNDER, 40)).toBeNull();
  });

  it('skips a dissolved faction, which keeps its edges and treasury', () => {
    const g = world({ founderWealth: 0, high: 100, low: 100 });
    g.getNode(HIGH)!.properties.dissolved = true;
    expect(findFoundingPatron(g, FOUNDER, 40)).toBe(LOW);
  });

  it('breaks a rank tie by faction id', () => {
    const g = world({ founderWealth: 0, high: 100, low: 100, highRank: 0.5, lowRank: 0.5 });
    expect(findFoundingPatron(g, FOUNDER, 40)).toBe(LOW); // 'faction_a' < 'faction_b'
  });

  it('needs no patron for a free cell, and finds none for a mortal with no faction', () => {
    expect(findFoundingPatron(world({ founderWealth: 0, high: 100, low: 100 }), FOUNDER, 0)).toBeNull();
    const g = new WorldGraph();
    g.addNode({ id: FOUNDER, name: 'Edda', type: 'actor', properties: { actorType: 'individual', wealth: 0 } });
    expect(findFoundingPatron(g, FOUNDER, 40)).toBeNull();
  });
});

describe('isFoundingUnaffordable (the board)', () => {
  it('a founder who can pay is never dropped', () => {
    expect(isFoundingUnaffordable(world({ founderWealth: 50, high: 0, low: 0 }), FOUNDER, 50, 40, true)).toBe(false);
  });

  it('a founder who cannot pay stays on the board when a patron exists', () => {
    expect(isFoundingUnaffordable(world({ founderWealth: 10, high: 100, low: 0 }), FOUNDER, 10, 40, true)).toBe(false);
  });

  it('a founder who cannot pay is dropped when no patron exists, or the patron rule is off', () => {
    expect(isFoundingUnaffordable(world({ founderWealth: 10, high: 0, low: 0 }), FOUNDER, 10, 40, true)).toBe(true);
    expect(isFoundingUnaffordable(world({ founderWealth: 10, high: 100, low: 100 }), FOUNDER, 10, 40, false)).toBe(true);
  });
});

describe('chargeFoundingCost with founding costs on', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });

  it('the patron pays the whole cost and the founder pays nothing', () => {
    const g = world({ founderWealth: 10, high: 100, low: 100 });
    chargeFoundingCost(g, townCandidate(), 7);
    expect(wealthOf(g, FOUNDER)).toBe(10);
    expect(wealthOf(g, HIGH)).toBe(100 - TOWN_COST);
    expect(wealthOf(g, LOW)).toBe(100);
    const trace = getTraces().find(t => t.category === 'economy.founding.patron') as unknown as Record<string, unknown>;
    expect(trace).toMatchObject({ agentId: FOUNDER, patronId: HIGH, cost: TOWN_COST, templateId: townCandidate().templateId, tick: 7 });
  });

  it('a founder who can pay pays from their own Means, and no faction is charged', () => {
    const g = world({ founderWealth: 60, high: 100, low: 100 });
    chargeFoundingCost(g, townCandidate(), 7);
    expect(wealthOf(g, FOUNDER)).toBe(60 - TOWN_COST);
    expect(wealthOf(g, HIGH)).toBe(100);
    expect(getTraces().some(t => t.category === 'economy.founding.patron')).toBe(false);
  });

  it('with no patron at charge time, nobody is charged (fail-soft)', () => {
    const g = world({ founderWealth: 10, high: 5, low: 5 });
    chargeFoundingCost(g, townCandidate(), 7);
    expect(wealthOf(g, FOUNDER)).toBe(10);
    expect(wealthOf(g, HIGH)).toBe(5);
    expect(wealthOf(g, LOW)).toBe(5);
    expect(getTraces().some(t => t.category === 'economy.founding.patron')).toBe(false);
  });

  it('chargeFoundingPatron reports the treasury it moved, and null without a patron', () => {
    const g = world({ founderWealth: 0, high: 100, low: 0 });
    expect(chargeFoundingPatron(g, FOUNDER, 40)).toEqual({ patronId: HIGH, cost: 40, treasuryBefore: 100, treasuryAfter: 60 });
    expect(chargeFoundingPatron(g, FOUNDER, 80)).toBeNull();
  });
});
