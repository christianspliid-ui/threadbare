import { describe, it, expect, beforeEach } from 'vitest';
import { processSocialOutcome } from '../socialOutcome';
import type { SocialOutcomeResult } from '../socialOutcome';
import { WorldGraph } from '../graph';
import type { EncounterProgress } from '../../types/encounter';
import { getTrust } from '../trustMechanics';
import {
  SOCIAL_COOPERATE_TRUST_BONUS,
  SOCIAL_DESTRUCTIVE_TRUST_PENALTY,
  AGREEMENT_DEFAULT_TICKS,
} from '../../data/agent-behavior-constants';

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'agent-a', type: 'actor', name: 'Agent A', properties: { actorType: 'individual' } });
  g.addNode({ id: 'agent-b', type: 'actor', name: 'Agent B', properties: { actorType: 'individual' } });
  return g;
}

function addRelatesTo(
  g: WorldGraph,
  source: string,
  target: string,
  trust: number,
): void {
  g.addEdge({
    id: `edge-${source}-${target}`,
    source,
    target,
    type: 'relates_to',
    properties: { trust, sentiment: 0, strength: 0.5, basis: 'kinship' },
  });
}

function makeProgress(overrides: Partial<EncounterProgress> = {}): EncounterProgress {
  return {
    encounterId: 'social.forge_alliance',
    actorId: 'agent-a',
    targetAgentId: 'agent-b',
    currentEncounterIndex: 1,
    history: [
      { encounterId: 'forge_alliance.overture', success: true, tick: 5 },
      { encounterId: 'forge_alliance.pact', success: true, tick: 7 },
    ],
    status: 'completed',
    startedTick: 5,
    ...overrides,
  };
}

describe('socialOutcome', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = makeGraph();
  });

  // ── Not a social encounter ──

  describe('non-social encounters', () => {
    it('returns isSocial=false when no targetAgentId', () => {
      const progress = makeProgress({ targetAgentId: undefined });
      const result = processSocialOutcome(graph, progress, true, 10);
      expect(result.isSocial).toBe(false);
      expect(result.trustDelta).toBe(0);
    });
  });

  // ── Trust changes ──

  describe('trust changes', () => {
    it('applies cooperative trust bonus on successful cooperative encounter', () => {
      const progress = makeProgress({ encounterId: 'social.forge_alliance' });
      const result = processSocialOutcome(graph, progress, true, 10);

      expect(result.isSocial).toBe(true);
      expect(result.trustDelta).toBe(SOCIAL_COOPERATE_TRUST_BONUS);

      // Trust should be set on the newly created edge
      const trust = getTrust(graph, 'agent-a', 'agent-b');
      expect(trust).toBe(SOCIAL_COOPERATE_TRUST_BONUS);
    });

    it('applies destructive trust penalty on successful destructive encounter', () => {
      const progress = makeProgress({ encounterId: 'social.challenge_duel' });
      const result = processSocialOutcome(graph, progress, true, 10);

      expect(result.trustDelta).toBe(SOCIAL_DESTRUCTIVE_TRUST_PENALTY);
      const trust = getTrust(graph, 'agent-a', 'agent-b');
      expect(trust).toBe(SOCIAL_DESTRUCTIVE_TRUST_PENALTY);
    });

    it('applies small trust penalty on failure', () => {
      const progress = makeProgress({
        encounterId: 'social.forge_alliance',
        status: 'abandoned',
      });
      const result = processSocialOutcome(graph, progress, false, 10);

      expect(result.trustDelta).toBeCloseTo(SOCIAL_DESTRUCTIVE_TRUST_PENALTY * 0.3);
    });

    it('updates existing relates_to edge trust', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0.3);
      const progress = makeProgress({ encounterId: 'social.forge_alliance' });
      processSocialOutcome(graph, progress, true, 10);

      const trust = getTrust(graph, 'agent-a', 'agent-b');
      expect(trust).toBeCloseTo(0.3 + SOCIAL_COOPERATE_TRUST_BONUS);
    });

    it('creates relates_to edge if none exists', () => {
      const progress = makeProgress({ encounterId: 'social.forge_alliance' });
      processSocialOutcome(graph, progress, true, 10);

      // Edge should now exist
      const outgoing = graph.getOutgoingEdges('agent-a', 'relates_to');
      expect(outgoing.length).toBe(1);
      expect(outgoing[0].target).toBe('agent-b');
    });

    it('clamps trust to [-1, 1]', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0.98);
      const progress = makeProgress({ encounterId: 'social.forge_alliance' });
      processSocialOutcome(graph, progress, true, 10);

      const trust = getTrust(graph, 'agent-a', 'agent-b');
      expect(trust).toBeLessThanOrEqual(1);
    });
  });

  // ── Agreement creation ──

  describe('agreement creation', () => {
    it('creates agreement on successful forge_alliance', () => {
      const progress = makeProgress({ encounterId: 'social.forge_alliance' });
      const result = processSocialOutcome(graph, progress, true, 10);

      expect(result.agreementType).toBe('pact');
      expect(result.agreementEdgeId).toBeDefined();

      // Verify agreement properties on the edge
      const edge = graph.getEdge(result.agreementEdgeId!);
      expect(edge).toBeDefined();
      expect(edge!.properties.agreementType).toBe('pact');
      expect(edge!.properties.ticksRemaining).toBe(AGREEMENT_DEFAULT_TICKS);
      expect(edge!.properties.fulfillmentCondition).toBe('Maintain mutual aid and cooperation');
      expect(edge!.properties.agreementCreatedTick).toBe(10);
    });

    it('creates bargain agreement on successful negotiate_deal', () => {
      const progress = makeProgress({ encounterId: 'social.negotiate_deal' });
      const result = processSocialOutcome(graph, progress, true, 10);

      expect(result.agreementType).toBe('bargain');
    });

    it('creates oath agreement on successful establish_patronage', () => {
      const progress = makeProgress({ encounterId: 'social.establish_patronage' });
      const result = processSocialOutcome(graph, progress, true, 10);

      expect(result.agreementType).toBe('oath');
    });

    it('creates debt agreement on successful political_leverage', () => {
      const progress = makeProgress({ encounterId: 'social.political_leverage' });
      const result = processSocialOutcome(graph, progress, true, 10);

      expect(result.agreementType).toBe('debt');
    });

    it('does not create agreement on failed encounter', () => {
      const progress = makeProgress({
        encounterId: 'social.forge_alliance',
        status: 'abandoned',
      });
      const result = processSocialOutcome(graph, progress, false, 10);

      expect(result.agreementType).toBeUndefined();
      expect(result.agreementEdgeId).toBeUndefined();
    });

    it('does not create agreement for non-agreement encounters', () => {
      const progress = makeProgress({ encounterId: 'social.persuade' });
      const result = processSocialOutcome(graph, progress, true, 10);

      expect(result.agreementType).toBeUndefined();
      expect(result.agreementEdgeId).toBeUndefined();
      // But trust should still be updated
      expect(result.trustDelta).toBe(SOCIAL_COOPERATE_TRUST_BONUS);
    });

    it('updates existing edge with agreement properties', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0.4);
      const progress = makeProgress({ encounterId: 'social.forge_alliance' });
      const result = processSocialOutcome(graph, progress, true, 10);

      const edge = graph.getEdge(result.agreementEdgeId!);
      expect(edge!.properties.agreementType).toBe('pact');
      // Original properties should be preserved
      expect(edge!.properties.basis).toBe('kinship');
      // Strength should be bumped
      expect(edge!.properties.strength).toBe(0.7); // 0.5 + 0.2
    });

    it('strength caps at 1.0 on agreement creation', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0.4);
      // Set strength to 0.95
      const edge = graph.getOutgoingEdges('agent-a', 'relates_to')[0];
      graph.updateEdge(edge.id, { properties: { ...edge.properties, strength: 0.95 } });

      const progress = makeProgress({ encounterId: 'social.forge_alliance' });
      processSocialOutcome(graph, progress, true, 10);

      const updated = graph.getOutgoingEdges('agent-a', 'relates_to')[0];
      expect(updated.properties.strength).toBe(1);
    });
  });

  // ── Fail-soft ──

  describe('fail-soft behavior', () => {
    it('handles missing target agent gracefully', () => {
      graph.removeNode('agent-b');
      graph.addNode({ id: 'agent-b', type: 'actor', name: 'Agent B', properties: {} });
      graph.removeNode('agent-b');

      const progress = makeProgress();
      const result = processSocialOutcome(graph, progress, true, 10);

      expect(result.isSocial).toBe(true);
      expect(result.trustDelta).toBe(0);
    });
  });
});
