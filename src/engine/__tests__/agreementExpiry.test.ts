/**
 * THR-1999 — agreement edges expire.
 *
 * A debt granted through the real reward path (`instantiateAgreementReward`, the real
 * `agreement.debt.minor` template, a 48-tick term) shows its remaining term on the sheet,
 * then is gone from the sheet and the ascendant bar once the expiry pass runs at the end of
 * its term.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { instantiateAgreementReward } from '../rewardPool';
import { getAgreementTemplate } from '../../data/agreement-reward-catalog';
import { expireAgreements } from '../agreementExpiry';
import { agreementTermRemaining, readAgreement } from '../agreementShape';
import { getAgentAttachments } from '../agentAttachments';
import { extractChips } from '../../components/Game/ascendant-bar/HooksBlock';
import type { GameState } from '../../types/gameState';

const debtTemplate = getAgreementTemplate('agreement.debt.minor')!;
const GRANT_TICK = 10;

function makeWorld(): WorldGraph {
  const graph = new WorldGraph();
  for (const id of ['debtor', 'creditor']) {
    graph.addNode({ id, type: 'actor', name: `Actor ${id}`, properties: { actorType: 'individual' } });
  }
  return graph;
}

function vowsAt(graph: WorldGraph, tick: number) {
  return extractChips({ graph, tick, ascendantId: 'debtor' } as unknown as GameState).vows;
}

/** Run the expiry pass once per tick, as the orchestrator does, from `from` to `to` inclusive. */
function tickExpiry(graph: WorldGraph, from: number, to: number): void {
  for (let t = from; t <= to; t++) expireAgreements(graph, t);
}

describe('THR-1999: agreement edges expire at the end of their term', () => {
  it('the minor debt template carries the 48-tick term this test relies on', () => {
    expect(debtTemplate.ticksRemaining).toBe(48);
  });

  it('a reward-path debt shows its remaining term, then is gone from the sheet and the bar after 48 ticks', () => {
    const graph = makeWorld();
    instantiateAgreementReward(graph, 'debtor', 'creditor', debtTemplate, GRANT_TICK);
    const term = debtTemplate.ticksRemaining!;

    // Twenty ticks in: still binding, and the sheet shows what is left, not the full term.
    tickExpiry(graph, GRANT_TICK + 1, GRANT_TICK + 20);
    const mid = getAgentAttachments(graph, 'debtor', GRANT_TICK + 20).agreements;
    expect(mid).toHaveLength(1);
    expect(mid[0].ticksRemaining).toBe(term - 20);
    expect(mid[0].totalTicks).toBe(term);
    expect(vowsAt(graph, GRANT_TICK + 20)).toHaveLength(1);

    // One tick before the end it still binds.
    tickExpiry(graph, GRANT_TICK + 21, GRANT_TICK + term - 1);
    expect(getAgentAttachments(graph, 'debtor', GRANT_TICK + term - 1).agreements[0].ticksRemaining).toBe(1);

    // At the end of the term the pass removes the edge: gone everywhere, tick or no tick.
    const removed = expireAgreements(graph, GRANT_TICK + term);
    expect(removed).toHaveLength(1);
    expect(removed[0]).toMatchObject({ sourceId: 'debtor', targetId: 'creditor', agreementType: 'debt' });
    expect(graph.getEdgesByType('relates_to').some(e => e.properties.agreement)).toBe(false);
    expect(getAgentAttachments(graph, 'debtor').agreements).toHaveLength(0);
    expect(getAgentAttachments(graph, 'creditor').agreements).toHaveLength(0);
    expect(vowsAt(graph, GRANT_TICK + term)).toHaveLength(0);
  });

  it('readers drop a term-ended debt even before the pass has run', () => {
    const graph = makeWorld();
    instantiateAgreementReward(graph, 'debtor', 'creditor', debtTemplate, GRANT_TICK);
    const end = GRANT_TICK + debtTemplate.ticksRemaining!;
    expect(getAgentAttachments(graph, 'debtor', end).agreements).toHaveLength(0);
    expect(vowsAt(graph, end)).toHaveLength(0);
  });

  it('permanent, nested and inactive-but-in-term agreements are left alone', () => {
    const graph = makeWorld();
    instantiateAgreementReward(graph, 'debtor', 'creditor', { ...debtTemplate, id: 'perm', ticksRemaining: null }, GRANT_TICK);
    graph.addEdge({
      id: 'nested', source: 'creditor', target: 'debtor', type: 'relates_to',
      properties: { agreement: { type: 'oath', tier: 1, terms: 'silence', ticksRemaining: 5 } },
    });
    graph.addEdge({
      id: 'inactive', source: 'debtor', target: 'creditor', type: 'relates_to',
      properties: { agreement: true, agreementType: 'pact', active: false, acquiredTick: GRANT_TICK, ticksRemaining: 500 },
    });
    graph.addEdge({ id: 'bond', source: 'debtor', target: 'creditor', type: 'relates_to', properties: { strength: 0.5 } });

    expect(expireAgreements(graph, GRANT_TICK + 400)).toHaveLength(0);
    expect(graph.getEdgesByType('relates_to')).toHaveLength(4);

    // The inactive pact's term still ends it.
    expect(expireAgreements(graph, GRANT_TICK + 500).map(r => r.edgeId)).toEqual(['inactive']);
  });

  it('agreementTermRemaining counts the flat term down and passes other shapes through', () => {
    const flat = readAgreement({ agreement: true, agreementType: 'debt', acquiredTick: 10, ticksRemaining: 48 })!;
    expect(agreementTermRemaining(flat, 30)).toBe(28);
    expect(agreementTermRemaining(flat, 100)).toBe(0);
    expect(agreementTermRemaining(flat)).toBe(48);
    const nested = readAgreement({ agreement: { type: 'oath', ticksRemaining: 5 } })!;
    expect(agreementTermRemaining(nested, 1000)).toBe(5);
  });
});
