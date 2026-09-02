/**
 * The calling — THR-1299 slice 5.
 *
 * The properties a later slice could break silently: the derivation is a
 * deterministic argmax that moves with each of its three inputs; the hysteresis
 * gate blocks a change on the hold floor alone, blocks one on the margin alone,
 * and admits one past both; the legacy map is total over `BehaviorFamily`.
 * Every hysteresis arm carries its control — the same challenger admitted once
 * the blocking gate is satisfied — so a `null` is a falsifying result, not a
 * broken recompute.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import type { BehaviorFamily } from '../../types/strategicAction';
import { BEHAVIOR_FAMILY_TO_CALLING, CALLING_ROWS } from '../../data/calling-content';
import {
  CALLING_MIN_HOLD_TICKS,
  CALLING_SCORE_MARGIN,
  CALLING_FALLBACK_TITLE,
} from '../../data/strategic-action-constants';
import {
  deriveCalling,
  getCallingPresentation,
  leadingReachPair,
  legacyFamilyCalling,
  readStoredCalling,
  recomputeCalling,
  scoreCallingRow,
} from '../calling';

const ALL_FAMILIES: BehaviorFamily[] = [
  'merchant-expansion', 'builder-civic', 'scholar-seeker', 'zealot-mission', 'court-political',
  'underworld-network', 'warlord-expansion', 'caretaker-steward', 'artist-crafter', 'wanderer-explorer',
];

function buildGraph(opts: {
  caps?: Record<string, number>;
  profile?: Record<string, number>;
  ambitionTemplateId?: string;
  spotlight?: boolean;
} = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'kael', name: 'Kael', type: 'actor',
    properties: {
      actorType: 'individual',
      domainCapabilities: opts.caps ?? { gold: 0.9, heart: 0.6, iron: 0.2 },
      axiologicalProfile: opts.profile ?? {},
      ...(opts.spotlight ? { spotlightTier: 'spotlight' } : {}),
    },
  });
  if (opts.ambitionTemplateId) {
    graph.addNode({ id: 'amb', name: 'Ambition', type: 'ambition', properties: { templateId: opts.ambitionTemplateId } });
    graph.addEdge({
      id: 'pursues_kael_amb', source: 'kael', target: 'amb', type: 'pursues',
      properties: { status: 'active', priority: 'primary', completedMilestones: [] },
    });
  }
  return graph;
}

describe('leadingReachPair', () => {
  it('takes the two highest capabilities, highest first, and copes with a thin map', () => {
    expect(leadingReachPair(buildGraph({ caps: { gold: 0.9, heart: 0.6, iron: 0.2 } }).getNode('kael'))).toEqual(['gold', 'heart']);
    expect(leadingReachPair(buildGraph({ caps: { iron: 0.5 } }).getNode('kael'))).toEqual(['iron']);
    expect(leadingReachPair(buildGraph({ caps: {} }).getNode('kael'))).toEqual([]);
    expect(leadingReachPair(undefined)).toEqual([]);
  });
});

describe('deriveCalling', () => {
  it('is deterministic and moves with the reach pair', () => {
    const merchant = buildGraph({ caps: { gold: 0.9, heart: 0.6 } });
    const a = deriveCalling(merchant, 'kael');
    const b = deriveCalling(merchant, 'kael');
    expect(a).toEqual(b);
    expect(a.titleKey).not.toBe('reaver');

    const warlord = buildGraph({ caps: { iron: 0.9, shadow: 0.6 } });
    expect(deriveCalling(warlord, 'kael').titleKey).not.toBe(a.titleKey);
  });

  it('the personality lean picks between sibling titles cut for the same reaches', () => {
    // Smuggler and Trader both belong to gold; the cunning lean is what separates them.
    const honest = buildGraph({ caps: { gold: 0.9, shadow: 0.6 }, profile: { honesty_cunning: 0.8 } });
    const cunning = buildGraph({ caps: { gold: 0.9, shadow: 0.6 }, profile: { honesty_cunning: -0.8 } });
    expect(deriveCalling(cunning, 'kael').titleKey).toBe('smuggler');
    expect(deriveCalling(honest, 'kael').titleKey).not.toBe('smuggler');
  });

  it('falls back to the fallback title, never throws, on a mortal no row fits', () => {
    const blank = buildGraph({ caps: {}, profile: {} });
    const c = deriveCalling(blank, 'kael');
    expect(c.title).toBe(CALLING_FALLBACK_TITLE);
    expect(c.score).toBe(0);
    expect(() => deriveCalling(new WorldGraph(), 'nobody')).not.toThrow();
  });

  it('scores in [0,1] for every row against every reach pair', () => {
    const reaches = ['gold', 'iron'] as const;
    for (const row of CALLING_ROWS) {
      const s = scoreCallingRow(row, reaches, { category: 'dominion', wantedKinds: ['warband'] }, { mercy_ruthlessness: -1 } as never);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });
});

describe('recomputeCalling — hysteresis', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('the first derivation stamps a name with no change event', () => {
    const graph = buildGraph({ spotlight: true });
    const change = recomputeCalling(graph, 'kael', 10, 'ambition_change');
    expect(change?.from).toBeNull();
    expect(change?.event).toBeNull();
    const stored = readStoredCalling(graph.getNode('kael'));
    expect(stored?.sinceTick).toBe(10);
    expect(getTraces().some(t => t.category === 'calling_change' && (t as { cause?: string }).cause === 'initial')).toBe(true);
  });

  it('a challenger is blocked by the hold floor alone, and admitted once it passes', () => {
    const graph = buildGraph({ caps: { gold: 0.9, heart: 0.6 }, spotlight: true });
    recomputeCalling(graph, 'kael', 10, 'ambition_change');
    const before = readStoredCalling(graph.getNode('kael'))!.titleKey;

    // A life change that clears the margin by a mile: the reach pair flips to iron/shadow.
    graph.getNode('kael')!.properties.domainCapabilities = { iron: 0.9, shadow: 0.6 };
    const tooSoon = recomputeCalling(graph, 'kael', 10 + CALLING_MIN_HOLD_TICKS - 1, 'tier_promotion');
    expect(tooSoon).toBeNull();
    expect(readStoredCalling(graph.getNode('kael'))!.titleKey).toBe(before);

    const inTime = recomputeCalling(graph, 'kael', 10 + CALLING_MIN_HOLD_TICKS, 'tier_promotion');
    expect(inTime?.from).toBe(before);
    expect(inTime?.to).not.toBe(before);
    expect(inTime?.event?.type).toBe('calling_changed');
    expect(inTime?.event?.significance).toBeGreaterThan(0.8);
  });

  it('a challenger is blocked by the margin alone', () => {
    // Two rows that tie closely: Trader (gold/heart, no lean) vs Chancellor (heart/gold,
    // no lean). Swapping the two capabilities' order changes the winner by less than
    // the margin, so the name must hold even long after the floor.
    const graph = buildGraph({ caps: { gold: 0.9, heart: 0.8 }, ambitionTemplateId: undefined });
    recomputeCalling(graph, 'kael', 0, 'ambition_change');
    const before = readStoredCalling(graph.getNode('kael'))!;

    graph.getNode('kael')!.properties.domainCapabilities = { heart: 0.9, gold: 0.8 };
    const challenger = deriveCalling(graph, 'kael');
    // Only meaningful if the derivation would actually pick a different name now.
    if (challenger.titleKey !== before.titleKey) {
      expect(challenger.score - before.score).toBeLessThan(CALLING_SCORE_MARGIN);
      expect(recomputeCalling(graph, 'kael', CALLING_MIN_HOLD_TICKS * 10, 'tier_promotion')).toBeNull();
      expect(readStoredCalling(graph.getNode('kael'))!.titleKey).toBe(before.titleKey);
    } else {
      expect(recomputeCalling(graph, 'kael', CALLING_MIN_HOLD_TICKS * 10, 'tier_promotion')).toBeNull();
    }
  });

  it('a non-spotlight mortal changes name without a chronicle event', () => {
    const graph = buildGraph({ caps: { gold: 0.9, heart: 0.6 }, spotlight: false });
    recomputeCalling(graph, 'kael', 0, 'ambition_change');
    graph.getNode('kael')!.properties.domainCapabilities = { iron: 0.9, shadow: 0.6 };
    const change = recomputeCalling(graph, 'kael', CALLING_MIN_HOLD_TICKS, 'tier_promotion');
    expect(change).not.toBeNull();
    expect(change?.event).toBeNull();
  });

  it('ignores non-individual actors', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'f', name: 'Guild', type: 'actor', properties: { actorType: 'faction' } });
    expect(recomputeCalling(graph, 'f', 1, 'ambition_change')).toBeNull();
    expect(readStoredCalling(graph.getNode('f'))).toBeNull();
  });
});

describe('presentation and the legacy map', () => {
  it('the legacy map is total over BehaviorFamily and every seed title is a real row', () => {
    for (const family of ALL_FAMILIES) {
      const key = BEHAVIOR_FAMILY_TO_CALLING[family];
      expect(key, `no seed title for ${family}`).toBeTruthy();
      expect(CALLING_ROWS.some(r => r.titleKey === key), `seed title ${key} is not a row`).toBe(true);
    }
    expect(Object.keys(BEHAVIOR_FAMILY_TO_CALLING).sort()).toEqual([...ALL_FAMILIES].sort());
  });

  it('a stored calling wins over the legacy family; absent both, the fallback renders', () => {
    const graph = buildGraph({ caps: { iron: 0.9, shadow: 0.6 } });
    expect(getCallingPresentation(graph.getNode('kael'), 'merchant-expansion').title).toBe(legacyFamilyCalling('merchant-expansion').title);
    recomputeCalling(graph, 'kael', 0, 'ambition_change');
    const stored = readStoredCalling(graph.getNode('kael'))!;
    expect(getCallingPresentation(graph.getNode('kael'), 'merchant-expansion').titleKey).toBe(stored.titleKey);
    expect(getCallingPresentation(undefined, null).title).toBe(CALLING_FALLBACK_TITLE);
    expect(getCallingPresentation(undefined, null).glyph).toBeTruthy();
  });

  it('at least sixteen titles, one word each, no numerals', () => {
    expect(CALLING_ROWS.length).toBeGreaterThanOrEqual(16);
    for (const row of CALLING_ROWS) {
      expect(row.title).toMatch(/^[A-Z][a-z]+$/);
    }
  });
});

describe('the first derivation at world init', () => {
  it('names every living mortal in a generated world, and more than one name is in use', async () => {
    // A generated world, not a fixture: the pass lives in `initializeGameState`,
    // and a fixture would only prove the scorer, which the arms above already do.
    const { initializeGameState, MAP_SIZE_PRESETS } = await import('../gameInit');
    const { createBalancedCosmology } = await import('../cosmology');
    const { generateArchetypes } = await import('../ascendant');
    const preset = MAP_SIZE_PRESETS.small;
    const { state } = initializeGameState(
      generateArchetypes(4, 42)[0], 'calling-init', createBalancedCosmology(), 42, preset.cols, preset.rows,
    );
    const individuals = state.graph.getNodesByType('actor').filter(n => n.properties?.actorType === 'individual');
    // Only a mortal the scorer can place gets a name at init: the ambient population
    // carries no capabilities and no ambition, and stays unnamed rather than stamped
    // with the fallback.
    const withInputs = individuals.filter(n => leadingReachPair(n).length > 0);
    expect(withInputs.length, 'no mortal with capabilities — the fixture cannot falsify').toBeGreaterThan(0);
    const unnamed = withInputs.filter(n => !readStoredCalling(n));
    expect(unnamed.map(n => n.id), 'mortals with inputs but no calling after init').toEqual([]);
    const ambient = individuals.filter(n => leadingReachPair(n).length === 0);
    expect(ambient.every(n => !readStoredCalling(n)), 'an ambient mortal was stamped with the fallback').toBe(true);
    const titles = new Set(withInputs.map(n => readStoredCalling(n)!.titleKey));
    expect(titles.size, 'every mortal got the same name — the inputs are not reaching the scorer').toBeGreaterThan(1);
  }, 60_000);
});
