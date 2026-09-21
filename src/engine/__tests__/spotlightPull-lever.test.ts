/**
 * Spotlight pull — the lever off (THR-1348).
 *
 * Own file because the constant is mocked at module scope: with
 * `SPOTLIGHT_AMBITION_PULL_ENABLED = false` a strategic assignment to a silenced
 * holder changes no tier and demotes nobody — today's behaviour byte for byte — but
 * traces `refused: disabled` so the census can see the lever rather than mistake
 * it for an empty world.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';

vi.mock('../../data/agent-behavior-constants', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../data/agent-behavior-constants')>();
  return { ...orig, SPOTLIGHT_AMBITION_PULL_ENABLED: false };
});

import {
  pullHolderIntoSpotlight,
  readSpotlightLedger,
  flushSpotlightPullTrace,
  resetSpotlightPullTrace,
  SPOTLIGHT_PULLED_TICK_KEY,
} from '../spotlightPull';
import { AMBITION_KIND_KEY, AMBITION_KIND_TEMPLATE } from '../ambitionShape';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import type { SpotlightPullTrace } from '../../types/trace';

const STRATEGIC = 'ambition_dominate_trade';

beforeEach(() => { resetSpotlightPullTrace(); clearTraces(); enableTracing(); });
afterEach(() => { flushSpotlightPullTrace(); disableTracing(); clearTraces(); });

describe('SPOTLIGHT_AMBITION_PULL_ENABLED = false', () => {
  it('refuses with reason disabled, moves nobody, and traces the refusal', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'h', type: 'actor', name: 'h', properties: { actorType: 'individual', spotlightTier: 'ambient', npcRole: 'merchant' } });
    g.addNode({ id: 's', type: 'actor', name: 's', properties: { actorType: 'individual', spotlightTier: 'spotlight', domainCapabilities: { iron: 40 } } });
    g.addNode({ id: `ambition.${STRATEGIC}`, type: 'ambition', name: STRATEGIC, properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE, templateId: STRATEGIC } });
    g.addEdge({ id: 'p', source: 'h', target: `ambition.${STRATEGIC}`, type: 'pursues', properties: { status: 'active', priority: 'primary' } });

    expect(pullHolderIntoSpotlight(g, 'h', STRATEGIC, 9, { rng: () => 0.5 })).toEqual({ pulled: false, reason: 'disabled' });
    expect(g.getNode('h')!.properties.spotlightTier).toBe('ambient');
    expect(g.getNode('h')!.properties[SPOTLIGHT_PULLED_TICK_KEY]).toBeUndefined();
    expect(g.getNode('s')!.properties.spotlightTier).toBe('spotlight');

    expect(readSpotlightLedger(g).refused).toEqual([{ id: 'h', reason: 'disabled', tick: 9 }]);
    flushSpotlightPullTrace();
    const trace = getTraces().find(t => t.category === 'spotlight_pull') as unknown as SpotlightPullTrace;
    expect(trace.refused).toEqual([{ agentId: 'h', templateId: STRATEGIC, reason: 'disabled' }]);
    expect(trace.pulled).toEqual([]);
  });
});
