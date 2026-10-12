// THR-1815 — the mortal's card lists the domain the aftermath just named (PC-6).
//
// The aftermath says "crossed into a new tier" for whatever Reach grew; the info
// card lists only the top three. Both growth sites now record `lastTierCross` on
// the agent, and the card appends that domain — marked — while it is recent.

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentInfoCard, readRecentTierCross } from '../agentDetail';
import { recordTierCross } from '../capabilityGrowth';
import { RECENT_TIER_CROSS_WINDOW_TICKS } from '../../data/agent-behavior-constants';

const AGENT_ID = 'agent.mortal';
const ASC_ID = 'asc.test';

function makeWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: AGENT_ID,
    type: 'actor',
    name: 'Elara',
    properties: {
      actorType: 'individual',
      // iron > gold > shadow are the top three; veil sits fourth.
      domainCapabilities: { iron: 9, gold: 7, shadow: 5, veil: 3, heart: 1, eye: 1, stone: 1, star: 1 },
    },
  });
  graph.addNode({ id: ASC_ID, type: 'actor', name: 'Ascendant', properties: { actorType: 'individual' } });
  graph.addEdge({ id: `thread_${AGENT_ID}`, source: ASC_ID, target: AGENT_ID, type: 'thread', properties: { tier: 2 } });
  return graph;
}

function domainsAt(graph: WorldGraph, tick: number) {
  return getAgentInfoCard(graph, AGENT_ID, ASC_ID, 'known', 0, tick)?.domains ?? [];
}

describe('THR-1815 — recent tier crossing on the info card', () => {
  it('without a record, the card lists the top three and no fourth row', () => {
    const graph = makeWorld();
    const domains = domainsAt(graph, 100);
    expect(domains).toHaveLength(3);
    expect(domains.some(d => d.domain === 'veil')).toBe(false);
  });

  it('inside the window, a fourth-ranked crossed domain is appended and marked', () => {
    const graph = makeWorld();
    expect(recordTierCross(graph, AGENT_ID, 'veil', 100)).toBe(true);
    const domains = domainsAt(graph, 100 + RECENT_TIER_CROSS_WINDOW_TICKS);
    expect(domains).toHaveLength(4);
    // Appended, never swapped: the top three are unchanged and first.
    expect(domains.slice(0, 3).every(d => !d.recentTierCross)).toBe(true);
    expect(domains[3]).toMatchObject({ domain: 'veil', recentTierCross: true });
  });

  it('outside the window the card renders as before', () => {
    const graph = makeWorld();
    recordTierCross(graph, AGENT_ID, 'veil', 100);
    const domains = domainsAt(graph, 100 + RECENT_TIER_CROSS_WINDOW_TICKS + 1);
    expect(domains).toHaveLength(3);
    expect(domains.some(d => d.domain === 'veil')).toBe(false);
  });

  it('a crossing in a domain already shown adds no second row', () => {
    const graph = makeWorld();
    recordTierCross(graph, AGENT_ID, 'iron', 100);
    const domains = domainsAt(graph, 110);
    expect(domains).toHaveLength(3);
    expect(domains.filter(d => d.domain === 'iron')).toHaveLength(1);
  });

  it('at recognised (one domain shown) the crossed domain is still listed', () => {
    const graph = makeWorld();
    recordTierCross(graph, AGENT_ID, 'shadow', 100);
    const domains = getAgentInfoCard(graph, AGENT_ID, ASC_ID, 'recognised', 0, 101)?.domains ?? [];
    expect(domains.map(d => d.domain)).toEqual(['iron', 'shadow']);
  });

  it('fail-soft: a malformed, unknown-domain or future record reads as nothing', () => {
    expect(readRecentTierCross(undefined, 10)).toBeNull();
    expect(readRecentTierCross({ domain: 'veil' }, 10)).toBeNull();
    expect(readRecentTierCross({ domain: 'not_a_reach', tick: 5 }, 10)).toBeNull();
    expect(readRecentTierCross({ domain: 'veil', tick: 20 }, 10)).toBeNull();
    expect(readRecentTierCross({ domain: 'veil', tick: 5 }, 10)).toBe('veil');
  });

  it('recordTierCross on a missing agent records nothing', () => {
    const graph = makeWorld();
    expect(recordTierCross(graph, 'agent.nobody', 'veil', 1)).toBe(false);
  });
});
