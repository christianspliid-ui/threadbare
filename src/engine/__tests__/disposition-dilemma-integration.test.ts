/**
 * Phase B Integration Test — Dilemma Detection through Narrative Beat Generation.
 *
 * Tests the full flow: two agents interact in Iron domain (high stakes) →
 * dilemma detected → resolved with 2×2 matrix → effects applied to graph →
 * reputation updated → visible in agent detail.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  computeStakes,
  resolveDilemma,
  applyDilemmaEffects,
  logInteraction,
  updateReputation,
  decayReputation,
} from '../disposition';
import { getAgentDetail } from '../agentDetail';
import { DILEMMA_STAKES_THRESHOLD, DEFAULT_REPUTATION } from '../../types/disposition';
import type { InteractionRecord, DilemmaEvent } from '../../types/disposition';
import type { AxiologicalProfile } from '../../types/agent';

function makeProfile(overrides: Partial<AxiologicalProfile> = {}): AxiologicalProfile {
  const base: AxiologicalProfile = {
    loyalty_ambition: 0, courage_prudence: 0, mercy_ruthlessness: 0,
    honesty_cunning: 0, sacrifice_survival: 0, loyalty_ambition: 0,
    tradition_novelty: 0, humility_pride: 0, mercy_ruthlessness: 0, asceticism_extravagance: 0,
  };
  return { ...base, ...overrides };
}

function makeDomainCaps() {
  const caps: Record<string, number> = {};
  for (const d of ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh']) {
    caps[d] = 3;
  }
  return caps;
}

function buildTestWorld(): WorldGraph {
  const graph = new WorldGraph();

  // Ascendant
  graph.addNode({ id: 'asc', type: 'actor', name: 'The Dreamer', properties: { actorType: 'ascendant' } });

  // Two agents with strategies
  graph.addNode({
    id: 'agent.kael', type: 'actor', name: 'Kael',
    properties: {
      actorType: 'individual',
      axiologicalProfile: makeProfile({ courage_prudence: 0.7, loyalty_ambition: 0.5 }),
      domainCapabilities: makeDomainCaps(),
      locationId: 'loc.1',
      cooperationStrategy: 'tit-for-tat',
      reputationScore: 0.6,
    },
  });

  graph.addNode({
    id: 'agent.mara', type: 'actor', name: 'Mara',
    properties: {
      actorType: 'individual',
      axiologicalProfile: makeProfile({ honesty_cunning: -0.8, mercy_ruthlessness: -0.3 }),
      domainCapabilities: makeDomainCaps(),
      locationId: 'loc.1',
      cooperationStrategy: 'always-defect',
      reputationScore: 0.35,
    },
  });

  // Location
  graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashvale', properties: {} });

  // Worship edges (retinue membership)
  graph.addEdge({ id: 'w.k', source: 'agent.kael', target: 'asc', type: 'worships', properties: { tier: 2 } });
  graph.addEdge({ id: 'w.m', source: 'agent.mara', target: 'asc', type: 'worships', properties: { tier: 1 } });

  // Relationship edge between them
  graph.addEdge({
    id: 'rt.km', source: 'agent.kael', target: 'agent.mara',
    type: 'relates_to',
    properties: {
      sentiment: 0.1,
      strength: 0.3,
      interactionLog: [] as InteractionRecord[],
    },
  });

  return graph;
}

describe('Disposition Phase B Integration', () => {
  it('full dilemma flow: high-stakes Iron interaction → resolve → effects → agent detail', () => {
    const graph = buildTestWorld();

    // ─── Step 1: Compute stakes for an Iron domain interaction ───
    const stakes = computeStakes(
      'iron',                  // domain
      0.1,                     // sentiment (mild positive)
      false,                   // actor is faction leader
      false,                   // territory control at stake
    );

    // Iron domain contributes 0.4, other factors 0 → stakes = 0.4
    // With current constants, Iron alone = 0.4 which is below threshold 0.6
    // Let's verify and adjust: add extreme sentiment to push over threshold
    const highStakes = computeStakes(
      'iron',                  // domain: +0.4
      0.95,                    // extreme sentiment: +0.2
      true,                    // faction leader: +0.3
      false,                   // territory
    );
    expect(highStakes).toBeGreaterThanOrEqual(DILEMMA_STAKES_THRESHOLD);

    // ─── Step 2: Resolve dilemma ────────────────────────────────
    // Kael (tit-for-tat, no prior defection → cooperates), Mara (always-defect → defects)
    const dilemmaEvent = resolveDilemma(
      'agent.kael', 'agent.mara',
      'tit-for-tat', 'always-defect',
      [], [], // empty histories → first interaction
      5, 'iron_battle', highStakes,
    );
    expect(dilemmaEvent.outcome).toBe('betrayed');
    expect(dilemmaEvent.actorMove).toBe('cooperate');
    expect(dilemmaEvent.targetMove).toBe('defect');

    // ─── Step 3: Apply effects ──────────────────────────────────
    const effects = applyDilemmaEffects(dilemmaEvent.outcome);
    expect(effects.sentimentDelta).toBeLessThan(0); // betrayal hurts sentiment
    expect(effects.strengthDelta).toBeDefined();

    // ─── Step 4: Update relationship in graph ───────────────────
    const edge = graph.getOutgoingEdges('agent.kael', 'relates_to')
      .find(e => e.target === 'agent.mara')!;
    const edgeProps = edge.properties as Record<string, unknown>;

    // Apply sentiment change
    const oldSentiment = edgeProps.sentiment as number;
    edgeProps.sentiment = Math.max(-1, Math.min(1, oldSentiment + effects.sentimentDelta));
    expect(edgeProps.sentiment as number).toBeLessThan(oldSentiment);

    // Log the interaction
    const record: InteractionRecord = {
      tick: dilemmaEvent.tick,
      actorMove: dilemmaEvent.actorMove,
      targetMove: dilemmaEvent.targetMove,
      context: dilemmaEvent.context,
      stakes: 'high',
    };
    const log = (edgeProps.interactionLog as InteractionRecord[]) || [];
    log.push(record);
    edgeProps.interactionLog = log;

    // ─── Step 5: Update reputations ─────────────────────────────
    const kaelNode = graph.getNode('agent.kael')!;
    const maraNode = graph.getNode('agent.mara')!;

    // Kael cooperated → reputation goes up
    const kaelOldRep = kaelNode.properties.reputationScore as number;
    kaelNode.properties.reputationScore = updateReputation(kaelOldRep, 'cooperate');
    expect(kaelNode.properties.reputationScore as number).toBeGreaterThan(kaelOldRep);

    // Mara defected → reputation goes down
    const maraOldRep = maraNode.properties.reputationScore as number;
    maraNode.properties.reputationScore = updateReputation(maraOldRep, 'defect');
    expect(maraNode.properties.reputationScore as number).toBeLessThan(maraOldRep);

    // ─── Step 6: Verify agent detail reflects changes ───────────
    const kaelDetail = getAgentDetail(graph, 'agent.kael', 'asc')!;
    expect(kaelDetail.cooperationStrategy).toBe('tit-for-tat');
    expect(kaelDetail.reputationScore).toBeGreaterThan(0.6); // started at 0.6, cooperated
    expect(kaelDetail.recentInteractions).toHaveLength(1);
    expect(kaelDetail.recentInteractions[0].actorMove).toBe('cooperate');
    expect(kaelDetail.recentInteractions[0].targetMove).toBe('defect');

    const maraDetail = getAgentDetail(graph, 'agent.mara', 'asc')!;
    expect(maraDetail.cooperationStrategy).toBe('always-defect');
    expect(maraDetail.reputationScore).toBeLessThan(0.35); // started at 0.35, defected
  });

  it('reputation decay moves toward default over time', () => {
    let rep = 0.8;
    for (let i = 0; i < 50; i++) {
      rep = decayReputation(rep);
    }
    // After 50 ticks of decay, should be closer to 0.5 than we started
    expect(rep).toBeLessThan(0.8);
    expect(rep).toBeGreaterThan(DEFAULT_REPUTATION);

    let lowRep = 0.2;
    for (let i = 0; i < 50; i++) {
      lowRep = decayReputation(lowRep);
    }
    expect(lowRep).toBeGreaterThan(0.2);
    expect(lowRep).toBeLessThan(DEFAULT_REPUTATION);
  });

  it('mutual trust outcome improves relationship', () => {
    // Both always-cooperate → mutual trust
    const event = resolveDilemma(
      'a', 'b', 'always-cooperate', 'always-cooperate',
      [], [], 1, 'trade', 0.7,
    );
    expect(event.outcome).toBe('mutual_trust');

    const effects = applyDilemmaEffects('mutual_trust');
    expect(effects.sentimentDelta).toBeGreaterThan(0);
    expect(effects.strengthDelta).toBeGreaterThan(0);
  });

  it('all four dilemma outcomes are reachable', () => {
    // always-cooperate vs always-cooperate → mutual trust
    const e1 = resolveDilemma('a', 'b', 'always-cooperate', 'always-cooperate', [], [], 1, 'ctx', 0.7);
    expect(e1.outcome).toBe('mutual_trust');

    // always-cooperate vs always-defect → betrayed
    const e2 = resolveDilemma('a', 'b', 'always-cooperate', 'always-defect', [], [], 1, 'ctx', 0.7);
    expect(e2.outcome).toBe('betrayed');

    // always-defect vs always-cooperate → exploitation
    const e3 = resolveDilemma('a', 'b', 'always-defect', 'always-cooperate', [], [], 1, 'ctx', 0.7);
    expect(e3.outcome).toBe('exploitation');

    // always-defect vs always-defect → mutual distrust
    const e4 = resolveDilemma('a', 'b', 'always-defect', 'always-defect', [], [], 1, 'ctx', 0.7);
    expect(e4.outcome).toBe('mutual_distrust');
  });
});
