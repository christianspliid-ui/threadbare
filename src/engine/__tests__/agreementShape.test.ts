/**
 * THR-1920 — encounter-granted debts count.
 *
 * The reward writer (`instantiateAgreementReward`) puts `agreement: true` + `agreementType` on
 * the edge; the readers used to want `agreement.type`. These tests go through the real reward
 * path with the real `agreement.debt.minor` template and assert every reader agrees.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { instantiateAgreementReward } from '../rewardPool';
import { getAgreementTemplate } from '../../data/agreement-reward-catalog';
import { readAgreement } from '../agreementShape';
import { countDebts, phaseEconomicTraits } from '../phaseEconomicTraits';
import { getAgentAttachments } from '../agentAttachments';
import { getTraitsForNode } from '../traits';
import { ECON_TRAIT_DEBT_LADEN_MIN_DEBTS } from '../../data/economic-trait-content';
import type { GameState } from '../../types/gameState';

const DEBT_LADEN = 'trait.condition.debt-laden';

function makeWorld(): WorldGraph {
  const graph = new WorldGraph();
  for (const id of ['debtor', 'creditor1', 'creditor2']) {
    graph.addNode({ id, type: 'actor', name: `Actor ${id}`, properties: { actorType: 'individual', wealth: 30 } });
  }
  return graph;
}

function state(graph: WorldGraph, tick: number): GameState {
  return {
    graph, tick, tickEvents: [], recentEvents: [], encounterProgress: [], unifiedActions: [], actionsInProgress: [],
  } as unknown as GameState;
}

function hasTrait(graph: WorldGraph, id: string, traitId: string): boolean {
  return getTraitsForNode(graph, id).some(e => e.target === traitId);
}

const debtTemplate = getAgreementTemplate('agreement.debt.minor')!;

describe('THR-1920: one agreement shape for every reader', () => {
  it('the catalog still carries the debt template the three encounters grant', () => {
    expect(debtTemplate.agreementType).toBe('debt');
  });

  it('readAgreement reads the flat reward shape and the nested fixture shape alike', () => {
    expect(readAgreement({ agreement: true, agreementType: 'debt', tier: 1, terms: 'owes', ticksRemaining: 5 }))
      .toMatchObject({ shape: 'flat', type: 'debt', tier: 1, terms: 'owes', ticksRemaining: 5 });
    expect(readAgreement({ agreement: { type: 'oath', tier: 2, terms: 'silence', ticksRemaining: null } }))
      .toMatchObject({ shape: 'nested', type: 'oath', tier: 2, terms: 'silence' });
    expect(readAgreement({ strength: 0.4 })).toBeNull();
    expect(readAgreement(undefined)).toBeNull();
  });

  it('a debt granted through the reward path counts once, for the debtor only', () => {
    const graph = makeWorld();
    const result = instantiateAgreementReward(graph, 'debtor', 'creditor1', debtTemplate, 10);
    expect(result).not.toBeNull();

    expect(countDebts(graph, 'debtor')).toBe(1);
    // The creditor holds the other end of the edge; it owes nothing.
    expect(countDebts(graph, 'creditor1')).toBe(0);
  });

  it('enough reward-path debts make the recipient debt-laden on the next economic-traits pass', () => {
    const graph = makeWorld();
    for (let i = 0; i < ECON_TRAIT_DEBT_LADEN_MIN_DEBTS; i++) {
      instantiateAgreementReward(graph, 'debtor', `creditor${(i % 2) + 1}`, debtTemplate, 10 + i);
    }
    expect(countDebts(graph, 'debtor')).toBe(ECON_TRAIT_DEBT_LADEN_MIN_DEBTS);

    phaseEconomicTraits(state(graph, 20));
    expect(hasTrait(graph, 'debtor', DEBT_LADEN)).toBe(true);
    expect(hasTrait(graph, 'creditor1', DEBT_LADEN)).toBe(false);

    // And the trait survives a second pass — it is no longer stripped by a zero count.
    phaseEconomicTraits(state(graph, 21));
    expect(hasTrait(graph, 'debtor', DEBT_LADEN)).toBe(true);
  });

  it('the attachments tab classifies a reward-path debt as a debt, not a pact', () => {
    const graph = makeWorld();
    instantiateAgreementReward(graph, 'debtor', 'creditor1', debtTemplate, 10);

    const entry = getAgentAttachments(graph, 'debtor').agreements[0];
    expect(entry).toBeDefined();
    expect(entry.subcategory).toBe('debt');
    expect(entry.agreementType).toBe('debt');
    expect(entry.name).toBe(debtTemplate.name);
    expect(entry.mechanicalSummary).toBe(debtTemplate.terms);
  });

  it('nested-shape debts keep their original either-direction count', () => {
    const graph = makeWorld();
    graph.addEdge({
      id: 'legacy', source: 'creditor1', target: 'debtor', type: 'relates_to',
      properties: { agreement: { type: 'debt', tier: 1, terms: 'owes gold' } },
    });
    expect(countDebts(graph, 'debtor')).toBe(1);
    expect(countDebts(graph, 'creditor1')).toBe(1);
  });
});
