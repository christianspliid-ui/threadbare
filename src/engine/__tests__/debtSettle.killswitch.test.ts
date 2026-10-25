/**
 * THR-2023 — the Done-when's falsifier: with `ENCOUNTER_DEBT_SETTLE_ENABLED = false` the debt
 * survives Debt Collection's success, and the effect no-ops with `reason: 'disabled'`.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../data/mortal-means-constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/mortal-means-constants')>()),
  ENCOUNTER_DEBT_SETTLE_ENABLED: false,
}));

const { WorldGraph } = await import('../graph');
const { settleDebt } = await import('../debtSettle');
const { instantiateAgreementReward } = await import('../rewardPool');
const { AGREEMENT_REWARD_TEMPLATES } = await import('../../data/agreement-reward-catalog');

describe('THR-2023 kill switch', () => {
  it('off, a debt owed to the creditor is not settled', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: { actorType: 'individual', wealth: 50 } });
    graph.addNode({ id: 'b', type: 'actor', name: 'B', properties: { actorType: 'individual', wealth: 50 } });
    const tpl = AGREEMENT_REWARD_TEMPLATES.find(t => t.id === 'agreement.debt.minor')!;
    const { edgeId } = instantiateAgreementReward(graph, 'b', 'a', tpl, 1)!;
    expect(settleDebt(graph, { creditorId: 'a', settlement: 'paid', tick: 2 })).toEqual({ settled: false, reason: 'disabled' });
    expect(graph.getEdge(edgeId)).toBeDefined();
    expect(graph.getNode('b')!.properties.wealth).toBe(50);
  });
});
