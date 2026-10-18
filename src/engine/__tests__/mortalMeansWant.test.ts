/**
 * THR-1952 (mortal wealth S2) — the Means want and its one board term.
 *
 * Plan: Docs/plans/2026-10-15-thr-1936-mortal-wealth.md § Systems design 4–5.
 * The rule is the THR-1865 decision's: poverty pulls a mortal toward paying work, a
 * Generous lean softens the pull, a Greedy lean adds to it, and a rich mortal who is
 * not greedy turns away. The multiplier touches only *what* is on the board — never
 * the forecast or the window (Law 20).
 */
import { describe, it, expect } from 'vitest';
import {
  computeMeansWant,
  describeDeciderMeans,
  isEarningCell,
  meansCellCost,
  meansCellKey,
  readMeansWant,
  templatePaysActor,
} from '../mortalMeans';
import { scoreUnifiedBoard } from '../decisionBoard';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import {
  MEANS_CELL_COST_ENABLED,
  MEANS_RICH_DAMPEN,
  MEANS_WANT_WEIGHT,
} from '../../data/mortal-means-constants';

describe('computeMeansWant', () => {
  it('pulls hardest at 0 Means and not at all from Comfortable up', () => {
    expect(computeMeansWant(0, 0).want).toBeCloseTo(1, 10);
    expect(computeMeansWant(20, 0).want).toBeCloseTo(0.5, 10);
    expect(computeMeansWant(40, 0).want).toBe(0);
    expect(computeMeansWant(50, 0).want).toBe(0);
  });

  it('softens for the Generous and adds for the Greedy', () => {
    expect(computeMeansWant(0, 1).want).toBeCloseTo(0.5, 10);
    expect(computeMeansWant(50, -1).want).toBeCloseTo(0.5, 10);
    expect(computeMeansWant(0, -1).want).toBeCloseTo(1.5, 10);
  });

  it('turns a rich mortal who is not greedy away from coin work, but not a greedy one', () => {
    expect(computeMeansWant(70, 0).want).toBeCloseTo(-MEANS_RICH_DAMPEN, 10);
    expect(computeMeansWant(70, -1).want).toBeCloseTo(0.5, 10);
  });

  it('spans the plan multiplier range 0.82 … 1.9', () => {
    expect(computeMeansWant(70, 0).multiplier).toBeCloseTo(1 - MEANS_WANT_WEIGHT * MEANS_RICH_DAMPEN, 10);
    expect(computeMeansWant(0, -1).multiplier).toBeCloseTo(1.9, 10);
  });

  it('reads a missing or non-finite lean as 0', () => {
    expect(computeMeansWant(20, Number.NaN).want).toBeCloseTo(0.5, 10);
  });

  it('adds nothing for an unaffordable founding while founding costs are off', () => {
    if (MEANS_CELL_COST_ENABLED) return;
    expect(computeMeansWant(20, 0, true).want).toBeCloseTo(0.5, 10);
    expect(computeMeansWant(20, 0, true).unafforded).toBe(false);
  });
});

describe('earning cells and founding costs', () => {
  it('keys a cell as variant × object type', () => {
    expect(meansCellKey({ cellVariant: 'use', objectTypeId: 'location' })).toBe('use×location');
    expect(meansCellKey({})).toBeNull();
    expect(meansCellKey(undefined)).toBeNull();
  });

  it('counts draw yield, trade, tolls, freeholds and claiming a town as paying work', () => {
    expect(isEarningCell({ cellVariant: 'use', objectTypeId: 'location' })).toBe(true);
    expect(isEarningCell({ cellVariant: 'use', objectTypeId: 'route' })).toBe(true);
    expect(isEarningCell({ cellVariant: 'control:claim', objectTypeId: 'location' })).toBe(true);
    expect(isEarningCell({ cellVariant: 'control:seize', objectTypeId: 'route' })).toBe(true);
    expect(isEarningCell({ cellVariant: 'create', objectTypeId: 'location' })).toBe(false);
  });

  it('charges nothing while founding costs are off', () => {
    if (MEANS_CELL_COST_ENABLED) return;
    expect(meansCellCost({ cellVariant: 'create', objectTypeId: 'location' })).toBe(0);
  });
});

describe('templatePaysActor', () => {
  it('derives paying work from the outcome table, and memoizes it per session', () => {
    const cache = new Map<string, boolean>();
    expect(templatePaysActor('encounter.pickpocket', cache, getUnifiedTemplateById)).toBe(true);
    expect(templatePaysActor('encounter.market_haggle', cache, getUnifiedTemplateById)).toBe(false);
    expect(templatePaysActor('no.such.template', cache, getUnifiedTemplateById)).toBe(false);
    expect(cache.get('encounter.pickpocket')).toBe(true);
    // A second read never consults the lookup.
    expect(templatePaysActor('encounter.pickpocket', cache, () => { throw new Error('re-read'); })).toBe(true);
  });

  it('does not count a table that pays a cast member and not the actor', () => {
    expect(templatePaysActor('reputation.gold.the_merchants_favor', new Map(), getUnifiedTemplateById)).toBe(false);
  });
});

// ─── The board term ─────────────────────────────────────────────

function graphWith(wealth: number | undefined, lean = 0) {
  const node = {
    id: 'm1', type: 'actor', name: 'Kael',
    properties: {
      actorType: 'individual',
      ...(wealth === undefined ? {} : { wealth }),
      axiologicalProfile: { asceticism_extravagance: lean },
    },
  };
  return {
    getNode: (id: string) => (id === 'm1' ? node : null),
    getOutgoingEdges: () => [],
    getIncomingEdges: () => [],
    getNodesByType: (type: string) => (type === 'actor' ? [node] : []),
  } as never;
}

const enc = (templateId: string, valuePerTick = 0.4) => ({
  entry: { templateId },
  valuePerTick,
  desireMultiplier: 1,
  engagementFit: 0.9,
  engagementForecast: 0.6,
}) as never;

describe('scoreUnifiedBoard — the Means multiplier on paying work', () => {
  const pays = (id: string) => id === 'enc.pays';

  it('lifts a paying encounter for a poor mortal and leaves the rest alone', () => {
    const board = scoreUnifiedBoard({
      graph: graphWith(0), agentId: 'm1', tick: 1,
      encounterCandidates: [enc('enc.pays'), enc('enc.plain')],
      strategicCandidates: [],
      paysActor: pays,
    });
    const paying = board.entries.find(e => e.id === 'enc.pays')!;
    const plain = board.entries.find(e => e.id === 'enc.plain')!;
    expect(board.meansWant?.want).toBeCloseTo(1, 10);
    expect(paying.meansMultiplier).toBeCloseTo(1 + MEANS_WANT_WEIGHT, 10);
    expect(paying.meansEarning).toBe(true);
    expect(paying.score).toBeCloseTo(plain.score * (1 + MEANS_WANT_WEIGHT), 10);
    expect(plain.meansMultiplier).toBeUndefined();
  });

  it('never touches the forecast or the window (Law 20)', () => {
    const poor = scoreUnifiedBoard({
      graph: graphWith(0), agentId: 'm1', tick: 1,
      encounterCandidates: [enc('enc.pays')], strategicCandidates: [], paysActor: pays,
    }).entries[0];
    const rich = scoreUnifiedBoard({
      graph: graphWith(45), agentId: 'm1', tick: 1,
      encounterCandidates: [enc('enc.pays')], strategicCandidates: [], paysActor: pays,
    }).entries[0];
    expect(poor.forecast).toBe(rich.forecast);
    expect(poor.forecastFit).toBe(rich.forecastFit);
    expect(rich.meansMultiplier).toBe(1);
  });

  it('turns a rich, ungreedy mortal away from paying work', () => {
    const entry = scoreUnifiedBoard({
      graph: graphWith(70), agentId: 'm1', tick: 1,
      encounterCandidates: [enc('enc.pays')], strategicCandidates: [], paysActor: pays,
    }).entries[0];
    expect(entry.meansMultiplier).toBeCloseTo(1 - MEANS_WANT_WEIGHT * MEANS_RICH_DAMPEN, 10);
  });

  it('carries no want for a node that is not a mortal, and no term without a paysActor reader', () => {
    const empty = { getNode: () => null, getOutgoingEdges: () => [] } as never;
    const board = scoreUnifiedBoard({
      graph: empty, agentId: 'x', tick: 1,
      encounterCandidates: [enc('enc.pays')], strategicCandidates: [], paysActor: pays,
    });
    expect(board.meansWant).toBeUndefined();
    expect(board.entries[0].meansMultiplier).toBeUndefined();
    const noReader = scoreUnifiedBoard({
      graph: graphWith(0), agentId: 'm1', tick: 1,
      encounterCandidates: [enc('enc.pays')], strategicCandidates: [],
    });
    expect(noReader.entries[0].meansEarning).toBeUndefined();
  });
});

describe('the debug reads', () => {
  it('reads the want a mortal would carry onto a board', () => {
    expect(readMeansWant(graphWith(20), 'm1')?.want).toBeCloseTo(0.5, 10);
    expect(readMeansWant(graphWith(20), 'nobody')).toBeNull();
  });

  it('lists deciders poorest first for the Economy tab', () => {
    const node = {
      id: 'd1', type: 'actor', name: 'Ilse',
      properties: { actorType: 'individual', wealth: 12 },
    };
    const rich = { id: 'd2', type: 'actor', name: 'Bram', properties: { actorType: 'individual', wealth: 64 } };
    const crowd = { id: 'f1', type: 'actor', name: 'Guild', properties: { actorType: 'faction', wealth: 90 } };
    const nodes = [rich, node, crowd];
    const graph = {
      getNode: (id: string) => nodes.find(n => n.id === id) ?? null,
      getOutgoingEdges: () => [], getIncomingEdges: () => [],
      getNodesByType: (t: string) => (t === 'actor' ? nodes : []),
    } as never;
    const rows = describeDeciderMeans(graph);
    expect(rows.map(r => r.agentId)).toEqual(['d1', 'd2']);
    expect(rows[0]).toMatchObject({ band: 'Destitute', want: expect.any(Number), multiplier: expect.any(Number) });
    expect(rows[1].band).toBe('Wealthy');
  });
});
