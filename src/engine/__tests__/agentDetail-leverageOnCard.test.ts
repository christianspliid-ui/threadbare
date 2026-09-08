/**
 * The leverage strand survives the **card builder** (THR-1439).
 *
 * `getAgentInfoCard` does not spread `AgentDetail` — it copies named fields onto a
 * fresh object, gating each by knowledge level. So a field the engine computes and the
 * builder forgets is `undefined` on the live sheet no matter how correct the engine is,
 * and no component test can see it: a test that hands `BondsTab` a card carrying
 * `leverage` verifies its own fixture, not the pipeline.
 *
 * That is exactly what happened here. The strand has been computed on `AgentDetail`
 * since THR-30 and its only renderers were the unmounted `AgentDetailPanel`
 * (impediment #981) and the debug tab, both of which read the detail directly — so
 * nothing had ever asked the builder for it, and the first version of THR-1439's rows
 * would have rendered nothing in the real app. This file is the seam that catches it.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentInfoCard } from '../agentDetail';
import { mintLeverageMark } from '../strategicGraphOps';

const AGENT = 'agent.hask';
const SUBJECT = 'agent.lirik';
const ASC = 'asc.test';

function world(): WorldGraph {
  const graph = new WorldGraph();
  for (const [id, name] of [[AGENT, 'Hask'], [SUBJECT, 'Lirik'], [ASC, 'Ascendant']] as const) {
    graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual' } });
  }
  // The card is threaded-only; without this the builder answers null.
  graph.addEdge({ id: `thread_${AGENT}`, source: ASC, target: AGENT, type: 'thread', properties: { tier: 2 } });
  return graph;
}

describe('getAgentInfoCard — the leverage strand reaches the card', () => {
  it('carries a held mark through to the card at `known`', () => {
    const graph = world();
    mintLeverageMark(graph, AGENT, SUBJECT, 'hidden_debt', 0.6, 5);

    const card = getAgentInfoCard(graph, AGENT, ASC, 'known');
    expect(card?.leverage?.secretsHeld.map(s => s.subjectName)).toEqual(['Lirik']);
  });

  it('carries the provenance the sheet says *taken from* on', () => {
    const graph = world();
    graph.addNode({ id: 'agent.vessa', type: 'actor', name: 'Vessa', properties: { actorType: 'individual' } });
    mintLeverageMark(graph, AGENT, SUBJECT, 'hidden_debt', 0.6, 5);
    const mark = graph.getEdgesByType('knows_secret_of')[0];
    graph.updateEdge(mark.id, {
      properties: { ...mark.properties, source: 'stolen', stolenFromId: 'agent.vessa', stolenTick: 9 },
    });

    const card = getAgentInfoCard(graph, AGENT, ASC, 'known');
    const held = card?.leverage?.secretsHeld[0];
    expect(held?.source).toBe('stolen');
    expect(held?.stolenFromName).toBe('Vessa');
  });

  it('carries a favour owed to them, with the context that says it was asked for', () => {
    const graph = world();
    graph.addEdge({
      id: 'owes_favor_1', source: SUBJECT, target: AGENT, type: 'owes_favor',
      properties: { magnitude: 0.5, context: 'called_in', grantedTick: 5, redeemed: false, broken: false },
    });

    const card = getAgentInfoCard(graph, AGENT, ASC, 'known');
    expect(card?.leverage?.favorsOwedToMe[0]?.counterpartyName).toBe('Lirik');
    expect(card?.leverage?.favorsOwedToMe[0]?.context).toBe('called_in');
  });

  it('is withheld from a stranger, and absent entirely when there is nothing to carry', () => {
    // Both absence arms, because a builder that always set the field would pass the
    // three presence assertions above.
    const withMark = world();
    mintLeverageMark(withMark, AGENT, SUBJECT, 'hidden_debt', 0.6, 5);
    expect(getAgentInfoCard(withMark, AGENT, ASC, 'stranger')?.leverage).toBeUndefined();

    expect(getAgentInfoCard(world(), AGENT, ASC, 'known')?.leverage).toBeUndefined();
  });
});
