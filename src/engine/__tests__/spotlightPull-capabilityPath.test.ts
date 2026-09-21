/**
 * Spotlight pull — the capability refusal (THR-1348).
 *
 * `hydrateToTier` generates capabilities for any role today, so a pulled mortal with
 * nothing to generate candidates from cannot be produced from content alone. The
 * refusal still exists because that is the lair-elite defect in another coat (a
 * decider that decides nothing, THR-1403), and a guard that cannot be exercised is
 * not evidence — so hydration is mocked to a no-op here and the arm proves the tier
 * is reverted, nobody is demoted, and the mark is cleared so the reason reads true.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';

vi.mock('../npcGraduation', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../npcGraduation')>();
  return { ...orig, hydrateToTier: vi.fn() };
});

import {
  pullHolderIntoSpotlight,
  readSpotlightLedger,
  flushSpotlightPullTrace,
  resetSpotlightPullTrace,
  SPOTLIGHT_PULLED_TICK_KEY,
  SPOTLIGHT_PULL_DEMOTED_ID_KEY,
} from '../spotlightPull';
import { AMBITION_KIND_KEY, AMBITION_KIND_TEMPLATE } from '../ambitionShape';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import type { SpotlightPullTrace } from '../../types/trace';

const STRATEGIC = 'ambition_dominate_trade';

beforeEach(() => { resetSpotlightPullTrace(); clearTraces(); enableTracing(); });
afterEach(() => { flushSpotlightPullTrace(); disableTracing(); clearTraces(); });

describe('a holder with no capability path', () => {
  it('is reverted, demotes nobody, and is refused no_capability_path', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'h', type: 'actor', name: 'h', properties: { actorType: 'individual', spotlightTier: 'notable' } });
    g.addNode({ id: 's', type: 'actor', name: 's', properties: { actorType: 'individual', spotlightTier: 'spotlight', domainCapabilities: { iron: 40 } } });
    g.addNode({ id: `ambition.${STRATEGIC}`, type: 'ambition', name: STRATEGIC, properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE, templateId: STRATEGIC } });
    g.addEdge({ id: 'p', source: 'h', target: `ambition.${STRATEGIC}`, type: 'pursues', properties: { status: 'active', priority: 'primary' } });

    expect(pullHolderIntoSpotlight(g, 'h', STRATEGIC, 4, { rng: () => 0.5 })).toEqual({ pulled: false, reason: 'no_capability_path' });

    const h = g.getNode('h')!.properties;
    expect(h.spotlightTier).toBe('notable');
    expect(h[SPOTLIGHT_PULLED_TICK_KEY]).toBeUndefined();
    expect(h[SPOTLIGHT_PULL_DEMOTED_ID_KEY]).toBeUndefined();
    expect(g.getNode('s')!.properties.spotlightTier).toBe('spotlight');

    const ledger = readSpotlightLedger(g);
    expect(ledger.pulled).toEqual([]);
    expect(ledger.refused).toEqual([{ id: 'h', reason: 'no_capability_path', tick: 4 }]);
    flushSpotlightPullTrace();
    const trace = getTraces().find(t => t.category === 'spotlight_pull') as unknown as SpotlightPullTrace;
    expect(trace.refused[0].reason).toBe('no_capability_path');
  });
});
