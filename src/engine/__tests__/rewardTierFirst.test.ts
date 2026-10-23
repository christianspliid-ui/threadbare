/**
 * The tier-first reward draw — Game Design Laws 1–3 (`Docs/game-design/laws.md`).
 *
 * The property under test is "the curve is the rate": a tier's share of draws is
 * its share of the curve, whatever the pool holds. The old flat draw multiplied the
 * curve into every item's weight, so the tier with the most items won.
 */
import { describe, it, expect } from 'vitest';
import {
  drawTierFirst,
  drawSeededReward,
  TIER_CURVE_CRITICAL_SUCCESS,
  TIER_CURVE_SUCCESS,
  TIER_CURVE_FAILURE,
  TIER_CURVE_CRITICAL_FAILURE,
  type PoolEntry,
} from '../rewardPool';
import { WorldGraph } from '../graph';
import type { AttachmentTier } from '../../types/attachments';
import { readLuckState } from '../luck';
import { LEGENDARY_DEADLINE_MAX_WINS } from '../../data/luck-constants';

const STEPS = 20_000;

function pool(counts: Partial<Record<AttachmentTier, number>>): PoolEntry[] {
  const out: PoolEntry[] = [];
  for (const [tier, n] of Object.entries(counts)) {
    for (let i = 0; i < (n ?? 0); i++) out.push({ nodeId: `t${tier}_${i}`, weight: 1, tier: Number(tier) });
  }
  return out;
}

/** Share of an evenly spaced roll sweep that lands in each tier. */
function tierShares(entries: PoolEntry[], curve: Record<AttachmentTier, number>): Record<number, number> {
  const hits: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (let i = 0; i < STEPS; i++) {
    const pick = drawTierFirst(entries, curve, (i + 0.5) / STEPS);
    if (pick) hits[pick.tier]++;
  }
  for (const t of [1, 2, 3, 4]) hits[t] /= STEPS;
  return hits;
}

describe('drawTierFirst — the curve is the rate (Laws 1, 2)', () => {
  it('lands each tier at its curve share, however many items each tier holds', () => {
    const shares = tierShares(pool({ 1: 50, 2: 20, 3: 6, 4: 1 }), TIER_CURVE_SUCCESS);
    for (const t of [1, 2, 3, 4] as AttachmentTier[]) {
      expect(shares[t]).toBeCloseTo(TIER_CURVE_SUCCESS[t], 3);
    }
  });

  it('adding common items does not move the Legendary rate', () => {
    const few = tierShares(pool({ 1: 5, 2: 5, 3: 5, 4: 1 }), TIER_CURVE_CRITICAL_SUCCESS);
    const many = tierShares(pool({ 1: 500, 2: 5, 3: 5, 4: 1 }), TIER_CURVE_CRITICAL_SUCCESS);
    expect(many[4]).toBeCloseTo(few[4], 6);
    expect(many[4]).toBeCloseTo(TIER_CURVE_CRITICAL_SUCCESS[4], 3);
  });

  it('every outcome curve says its percentages outright — each sums to 1', () => {
    for (const curve of [TIER_CURVE_CRITICAL_SUCCESS, TIER_CURVE_SUCCESS, TIER_CURVE_FAILURE, TIER_CURVE_CRITICAL_FAILURE]) {
      const sum = curve[1] + curve[2] + curve[3] + curve[4];
      expect(sum).toBeCloseTo(1, 6);
    }
  });

  it('never deals Legendary on a failure curve', () => {
    const shares = tierShares(pool({ 1: 3, 2: 3, 3: 3, 4: 3 }), TIER_CURVE_FAILURE);
    expect(shares[4]).toBe(0);
  });
});

describe('drawTierFirst — an empty tier falls down (Law 3)', () => {
  it('hands an empty tier\'s share to the tier below, never to the rarest tier', () => {
    const shares = tierShares(pool({ 1: 4, 2: 4, 4: 1 }), TIER_CURVE_SUCCESS);
    expect(shares[3]).toBe(0);
    expect(shares[2]).toBeCloseTo(TIER_CURVE_SUCCESS[2] + TIER_CURVE_SUCCESS[3], 3);
    expect(shares[4]).toBeCloseTo(TIER_CURVE_SUCCESS[4], 3);
  });

  it('climbs only when nothing below is eligible', () => {
    const only = pool({ 3: 2 });
    for (const roll of [0, 0.3, 0.6, 0.99]) {
      expect(drawTierFirst(only, TIER_CURVE_SUCCESS, roll)?.tier).toBe(3);
    }
  });

  it('returns null for an empty pool and survives an all-zero curve', () => {
    expect(drawTierFirst([], TIER_CURVE_SUCCESS, 0.5)).toBeNull();
    expect(drawTierFirst(pool({ 2: 1 }), { 1: 0, 2: 0, 3: 0, 4: 0 }, 0.5)?.tier).toBe(2);
  });
});

describe('drawTierFirst — inside a tier and forcing', () => {
  it('picks inside the tier by weight', () => {
    const entries: PoolEntry[] = [
      { nodeId: 'heavy', weight: 3, tier: 1 },
      { nodeId: 'light', weight: 1, tier: 1 },
    ];
    let heavy = 0;
    for (let i = 0; i < STEPS; i++) if (drawTierFirst(entries, TIER_CURVE_SUCCESS, (i + 0.5) / STEPS)?.nodeId === 'heavy') heavy++;
    expect(heavy / STEPS).toBeCloseTo(0.75, 2);
  });

  it('honours a forced tier only when the pool holds it', () => {
    expect(drawTierFirst(pool({ 1: 3, 4: 1 }), TIER_CURVE_SUCCESS, 0.01, 4)?.tier).toBe(4);
    expect(drawTierFirst(pool({ 1: 3 }), TIER_CURVE_SUCCESS, 0.01, 4)?.tier).toBe(1);
  });

  it('is deterministic — the same roll gives the same pick', () => {
    const entries = pool({ 1: 7, 2: 4, 3: 2, 4: 1 });
    for (const roll of [0.05, 0.42, 0.97]) {
      expect(drawTierFirst(entries, TIER_CURVE_SUCCESS, roll)).toEqual(drawTierFirst(entries, TIER_CURVE_SUCCESS, roll));
    }
  });
});

describe('drawTierFirst — the kind comes up at the recipe\'s share (THR-1997, Law 2)', () => {
  // As the assembler builds it: every entry weighs its kind's share times the tier weight.
  const TIER_WEIGHT = TIER_CURVE_SUCCESS[1];
  function twoKinds(): PoolEntry[] {
    const out: PoolEntry[] = [];
    for (let i = 0; i < 9; i++) out.push({ nodeId: `item_${i}`, weight: 0.2 * TIER_WEIGHT, tier: 1, category: 'possession' });
    out.push({ nodeId: 'cond_0', weight: 0.8 * TIER_WEIGHT, tier: 1, category: 'condition' });
    return out;
  }

  it('9 items against 1 at shares 0.2 / 0.8 give 20% / 80%', () => {
    const entries = twoKinds();
    let cond = 0;
    for (let i = 0; i < STEPS; i++) if (drawTierFirst(entries, TIER_CURVE_SUCCESS, (i + 0.5) / STEPS)?.nodeId === 'cond_0') cond++;
    expect(Math.abs(cond / STEPS - 0.8)).toBeLessThanOrEqual(0.005);
  });

  it('picks the item by weight inside the kind', () => {
    const entries: PoolEntry[] = [
      { nodeId: 'a', weight: 3, tier: 1, category: 'possession' },
      { nodeId: 'b', weight: 1, tier: 1, category: 'possession' },
    ];
    let a = 0;
    for (let i = 0; i < STEPS; i++) if (drawTierFirst(entries, TIER_CURVE_SUCCESS, (i + 0.5) / STEPS)?.nodeId === 'a') a++;
    expect(a / STEPS).toBeCloseTo(0.75, 2);
  });

  it('leaves the tier mix alone — the kind roll spends no extra value', () => {
    const tagged = pool({ 1: 6, 2: 3, 3: 2, 4: 1 }).map((e, i) => ({ ...e, category: i % 2 ? 'condition' : 'possession' }));
    const shares = tierShares(tagged, TIER_CURVE_SUCCESS);
    for (const t of [1, 2, 3, 4] as AttachmentTier[]) expect(shares[t]).toBeCloseTo(TIER_CURVE_SUCCESS[t], 3);
  });

  it('switch off reproduces today\'s pick for every roll', () => {
    const tagged = [...twoKinds(), ...pool({ 2: 4, 3: 2, 4: 1 }).map(e => ({ ...e, category: 'possession' }))];
    const untagged = tagged.map(({ category: _c, ...rest }) => rest);
    for (let i = 0; i < STEPS; i++) {
      const roll = (i + 0.5) / STEPS;
      expect(drawTierFirst(tagged, TIER_CURVE_SUCCESS, roll, undefined, false))
        .toEqual(drawTierFirst(untagged, TIER_CURVE_SUCCESS, roll));
    }
  });
});

// ─── The hidden Legendary deadline through the one draw path ────────────

function luckWorld(threadFrom: string | null): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc_player', type: 'actor', name: 'Player God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'asc_rival', type: 'actor', name: 'Rival God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  if (threadFrom) graph.addEdge({ id: `thread_${threadFrom}`, source: threadFrom, target: 'hero', type: 'thread', properties: {} });
  for (let i = 0; i < 40; i++) {
    graph.addNode({ id: `blade_${String(i).padStart(2, '0')}`, type: 'artifact', name: `Blade ${i}`, properties: { subcategory: 'arms', tier: 1, tags: ['weapon'] } });
  }
  graph.addNode({ id: 'crown_legend', type: 'artifact', name: 'Legendary Crown', properties: { subcategory: 'vestments', tier: 4, tags: ['weapon'] } });
  return graph;
}

/** Wins until the Legendary first arrives, or Infinity if it never did. */
function winsToLegendary(graph: WorldGraph, playerAscendantId: string | undefined, maxWins: number): number {
  for (let tick = 1; tick <= maxWins; tick++) {
    const draw = drawSeededReward(graph, {
      recipe: { categoryWeights: { possession: 1 } },
      outcomeType: 'success',
      seed: 1234,
      tick: tick * 1000,
      actorId: 'hero',
      templateId: 'test_template',
      playerAscendantId,
    });
    if (draw.isBadOutcome) continue;
    if (draw.drawnTemplateId === 'crown_legend') return tick;
  }
  return Infinity;
}

describe('the hidden Legendary deadline (Laws 3, 5)', () => {
  it('guarantees a protected mortal a Legendary by the deadline', () => {
    // Bad-outcome flips skip a win, so allow for the ~5% of draws that flip.
    const graph = luckWorld('asc_player');
    expect(winsToLegendary(graph, 'asc_player', Math.ceil(LEGENDARY_DEADLINE_MAX_WINS * 1.2))).toBeLessThanOrEqual(Math.ceil(LEGENDARY_DEADLINE_MAX_WINS * 1.2));
    expect(readLuckState(graph.getNode('hero')).legendaryCycle).toBe(1);
  });

  it('protects only the player\'s own mortals — a rival\'s thread or no ascendant leaves plain luck', () => {
    const rival = luckWorld('asc_rival');
    winsToLegendary(rival, 'asc_player', 20);
    expect(readLuckState(rival.getNode('hero'))).toEqual({ bagDraws: 0, winsSinceLegendary: 0, legendaryCycle: 0 });

    const unprotected = luckWorld('asc_player');
    winsToLegendary(unprotected, undefined, 20);
    expect(readLuckState(unprotected.getNode('hero')).winsSinceLegendary).toBe(0);
  });
});
