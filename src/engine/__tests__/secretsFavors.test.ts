/**
 * Secrets & Favors System Tests — THR-30
 *
 * Covers:
 *   - generateSecret(): candidate selection, source quality scaling, fallback
 *   - createSecretEdge(): edge creation, duplicate cap, skip-on-revealed
 *   - createFavorEdge(): edge creation, cap enforcement
 *   - graphOpExecutor: reveal_secret, call_in_favor, plant_secret ops
 *   - computeInitialLeverage(): secret_bonus and favor_bonus contributions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateSecret, createSecretEdge, createFavorEdge } from '../secretGeneration';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import { computeInitialLeverage } from '../socialLeverage';
import {
  SECRET_LEVERAGE_MULTIPLIER,
  FAVOR_LEVERAGE_MULTIPLIER,
  MAX_SECRETS_PER_AGENT,
  MAX_FAVORS_PER_AGENT,
} from '../../types/secretsFavors';
import { mulberry32 } from '../../lib/prng';
import type { GraphNode } from '../../types/graph';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rng(seed = 42) { return mulberry32(seed); }

function makeActor(graph: WorldGraph, id: string, name = 'Actor'): GraphNode {
  graph.addNode({ id, type: 'actor', name, properties: {} });
  return graph.getNode(id)!;
}

function makeGraphOpContext(graph: WorldGraph, actorId: string, targetId: string) {
  return { actorId, targetId, locationId: 'loc_0', tick: 1, graph };
}

beforeEach(() => resetOpCounter());

// ─── generateSecret ───────────────────────────────────────────────────────────

describe('generateSecret', () => {
  it('falls back to hidden_weakness when no graph state provides candidates', () => {
    const graph = new WorldGraph();
    const node = makeActor(graph, 'agent_a', 'PlainAgent');
    const result = generateSecret(node, graph, 'tavern_gossip', rng());
    expect(result.secretType).toBe('hidden_weakness');
    expect(result.magnitude).toBeGreaterThan(0);
    expect(result.magnitude).toBeLessThanOrEqual(1);
  });

  it('uses confession quality multiplier (0.80) → higher magnitude than tavern_gossip', () => {
    const graph = new WorldGraph();
    const node = makeActor(graph, 'agent_b', 'Confessor');
    const r1 = generateSecret(node, graph, 'confession', mulberry32(1));
    const r2 = generateSecret(node, graph, 'tavern_gossip', mulberry32(1));
    // Same seed so same candidate selection — confession should produce higher magnitude
    expect(r1.magnitude).toBeGreaterThanOrEqual(r2.magnitude);
  });

  it('produces hidden_allegiance when agent has 2+ faction memberships', () => {
    const graph = new WorldGraph();
    const node = makeActor(graph, 'agent_c', 'DoubleAgent');
    graph.addNode({ id: 'faction_a', type: 'faction', name: 'Faction A', properties: {} });
    graph.addNode({ id: 'faction_b', type: 'faction', name: 'Faction B', properties: {} });
    graph.addEdge({ id: 'mem_1', type: 'member_of', source: 'agent_c', target: 'faction_a', properties: {} });
    graph.addEdge({ id: 'mem_2', type: 'member_of', source: 'agent_c', target: 'faction_b', properties: {} });

    // Run many seeds to confirm hidden_allegiance appears
    let found = false;
    for (let seed = 0; seed < 50; seed++) {
      const r = generateSecret(node, graph, 'confession', mulberry32(seed));
      if (r.secretType === 'hidden_allegiance') { found = true; break; }
    }
    expect(found).toBe(true);
  });

  it('clamps magnitude within [0.05, 1.0]', () => {
    const graph = new WorldGraph();
    const node = makeActor(graph, 'agent_d');
    for (let seed = 0; seed < 20; seed++) {
      const r = generateSecret(node, graph, 'spy_debrief', mulberry32(seed), 0.99);
      expect(r.magnitude).toBeGreaterThanOrEqual(0.05);
      expect(r.magnitude).toBeLessThanOrEqual(1.0);
    }
  });
});

// ─── createSecretEdge ─────────────────────────────────────────────────────────

describe('createSecretEdge', () => {
  it('creates a knows_secret_of edge and returns properties', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'disc', 'Discoverer');
    makeActor(graph, 'subj', 'Subject');
    const secret = generateSecret(graph.getNode('subj')!, graph, 'observation', rng());
    const result = createSecretEdge('disc', 'subj', secret, 'observation', 1, graph);
    expect(result).not.toBeUndefined();
    expect(result!.secretType).toBe(secret.secretType);
    expect(result!.revealed).toBe(false);
    const edges = graph.getOutgoingEdges('disc', 'knows_secret_of');
    expect(edges).toHaveLength(1);
  });

  it('returns undefined and skips creation when already at MAX_SECRETS_PER_AGENT', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'disc2', 'Disc2');
    makeActor(graph, 'subj2', 'Subj2');
    const secret = generateSecret(graph.getNode('subj2')!, graph, 'observation', rng());
    for (let i = 0; i < MAX_SECRETS_PER_AGENT; i++) {
      graph.addEdge({
        id: `secret_disc2_subj2_${i}_hidden_weakness`,
        type: 'knows_secret_of',
        source: 'disc2',
        target: 'subj2',
        properties: { revealed: false, magnitude: 0.3, secretType: 'hidden_weakness', discoveredTick: i, source: 'observation' },
      });
    }
    const result = createSecretEdge('disc2', 'subj2', secret, 'observation', 99, graph);
    expect(result).toBeUndefined();
  });
});

// ─── createFavorEdge ──────────────────────────────────────────────────────────

describe('createFavorEdge', () => {
  it('creates an owes_favor edge from debtor to creditor', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'debtor', 'Debtor');
    makeActor(graph, 'creditor', 'Creditor');
    const ok = createFavorEdge('debtor', 'creditor', 0.3, 'helped in crisis', 1, graph);
    expect(ok).toBe(true);
    const edges = graph.getOutgoingEdges('debtor', 'owes_favor');
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.redeemed).toBe(false);
    expect(edges[0].properties.context).toBe('helped in crisis');
  });

  it('returns false when at MAX_FAVORS_PER_AGENT', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'deb3', 'Deb3');
    makeActor(graph, 'cred3', 'Cred3');
    for (let i = 0; i < MAX_FAVORS_PER_AGENT; i++) {
      graph.addEdge({
        id: `favor_deb3_cred3_${i}`,
        type: 'owes_favor',
        source: 'deb3',
        target: 'cred3',
        properties: { magnitude: 0.2, context: 'test', grantedTick: i, redeemed: false, broken: false },
      });
    }
    const ok = createFavorEdge('deb3', 'cred3', 0.2, 'extra', 99, graph);
    expect(ok).toBe(false);
  });
});

// ─── graphOpExecutor: reveal_secret ───────────────────────────────────────────

describe('graphOpExecutor: reveal_secret', () => {
  it('marks the highest-magnitude unrevealed secret about target as revealed', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'holder', 'Holder');
    makeActor(graph, 'subject', 'Subject');
    graph.addEdge({ id: 'sec_low', type: 'knows_secret_of', source: 'holder', target: 'subject', properties: { magnitude: 0.2, revealed: false, secretType: 'hidden_weakness', discoveredTick: 1, source: 'observation' } });
    graph.addEdge({ id: 'sec_high', type: 'knows_secret_of', source: 'holder', target: 'subject', properties: { magnitude: 0.8, revealed: false, secretType: 'past_crime', discoveredTick: 1, source: 'spy_debrief' } });

    const result = executeGraphOps(
      graph,
      [{ op: 'reveal_secret', target: '$target' }],
      { actorId: 'holder', targetId: 'subject', locationId: 'loc', tick: 2 },
    );
    expect(result.allSucceeded).toBe(true);
    // High-magnitude edge should be revealed
    expect(graph.getEdge('sec_high')?.properties.revealed).toBe(true);
    expect(graph.getEdge('sec_low')?.properties.revealed).toBe(false);
  });

  it('fails gracefully when no unrevealed secrets exist', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'h2', 'H2');
    makeActor(graph, 's2', 'S2');
    const result = executeGraphOps(
      graph,
      [{ op: 'reveal_secret', target: '$target' }],
      { actorId: 'h2', targetId: 's2', locationId: 'loc', tick: 1 },
    );
    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].error).toContain('No unrevealed secrets');
  });

  it('fails when another agent holds the secret but the actor does not', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'actor_x', 'Actor');
    makeActor(graph, 'other_holder', 'OtherHolder');
    makeActor(graph, 'target_x', 'Target');
    // A secret exists, but it's held by other_holder — not by actor_x
    graph.addEdge({ id: 'sec_other', type: 'knows_secret_of', source: 'other_holder', target: 'target_x', properties: { magnitude: 0.7, revealed: false, secretType: 'past_crime', discoveredTick: 1, source: 'observation' } });

    const result = executeGraphOps(
      graph,
      [{ op: 'reveal_secret', target: '$target' }],
      { actorId: 'actor_x', targetId: 'target_x', locationId: 'loc', tick: 2 },
    );
    expect(result.allSucceeded).toBe(false);
    expect(graph.getEdge('sec_other')?.properties.revealed).toBe(false);
  });
});

// ─── graphOpExecutor: call_in_favor ───────────────────────────────────────────

describe('graphOpExecutor: call_in_favor', () => {
  it('redeems the best unredeemed favor the target owes', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'actor', 'Actor');
    makeActor(graph, 'debtor', 'Debtor');
    graph.addEdge({ id: 'fav_sm', type: 'owes_favor', source: 'debtor', target: 'actor', properties: { magnitude: 0.15, context: 'small help', grantedTick: 1, redeemed: false, broken: false } });
    graph.addEdge({ id: 'fav_big', type: 'owes_favor', source: 'debtor', target: 'actor', properties: { magnitude: 0.65, context: 'saved their life', grantedTick: 1, redeemed: false, broken: false } });

    const result = executeGraphOps(
      graph,
      [{ op: 'call_in_favor', target: '$target' }],
      { actorId: 'actor', targetId: 'debtor', locationId: 'loc', tick: 5 },
    );
    expect(result.allSucceeded).toBe(true);
    expect(graph.getEdge('fav_big')?.properties.redeemed).toBe(true);
    expect(graph.getEdge('fav_sm')?.properties.redeemed).toBe(false);
  });

  it('fails when target owes favor to a third party but not to the actor', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'actor_y', 'Actor');
    makeActor(graph, 'debtor_y', 'Debtor');
    makeActor(graph, 'third_party', 'ThirdParty');
    // Favor owed to third_party, not to actor_y
    graph.addEdge({ id: 'fav_third', type: 'owes_favor', source: 'debtor_y', target: 'third_party', properties: { magnitude: 0.5, context: 'old debt', grantedTick: 1, redeemed: false, broken: false } });

    const result = executeGraphOps(
      graph,
      [{ op: 'call_in_favor', target: '$target' }],
      { actorId: 'actor_y', targetId: 'debtor_y', locationId: 'loc', tick: 3 },
    );
    expect(result.allSucceeded).toBe(false);
    expect(graph.getEdge('fav_third')?.properties.redeemed).toBe(false);
  });
});

// ─── graphOpExecutor: plant_secret ────────────────────────────────────────────

describe('graphOpExecutor: plant_secret', () => {
  it('creates a knows_secret_of edge with planted=true', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'planter', 'Planter');
    makeActor(graph, 'victim', 'Victim');

    const result = executeGraphOps(
      graph,
      [{ op: 'plant_secret', source: '$actor', target: '$target', properties: { magnitude: 0.5, secretType: 'hidden_weakness' } }],
      { actorId: 'planter', targetId: 'victim', locationId: 'loc', tick: 3 },
    );
    expect(result.allSucceeded).toBe(true);
    const edges = graph.getOutgoingEdges('planter', 'knows_secret_of');
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.planted).toBe(true);
    expect(edges[0].properties.source).toBe('divine_revelation');
  });
});

// ─── computeInitialLeverage: secret_bonus + favor_bonus ───────────────────────

describe('computeInitialLeverage: secrets & favors', () => {
  it('adds secret_bonus to leverage when actor holds an unrevealed secret about target', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'actor_l', 'Actor');
    makeActor(graph, 'target_l', 'Target');
    // No secret: establish baseline
    const baseline = computeInitialLeverage(graph, 'actor_l', 'target_l').leverage;

    // Add an unrevealed secret with magnitude 0.6
    graph.addEdge({
      id: 'sec_test',
      type: 'knows_secret_of',
      source: 'actor_l',
      target: 'target_l',
      properties: { magnitude: 0.6, revealed: false, secretType: 'past_crime', discoveredTick: 1, source: 'spy_debrief' },
    });
    const withSecret = computeInitialLeverage(graph, 'actor_l', 'target_l').leverage;
    const expectedBonus = 0.6 * SECRET_LEVERAGE_MULTIPLIER;
    expect(withSecret).toBeCloseTo(baseline + expectedBonus, 3);
  });

  it('adds favor_bonus when target owes actor a favor', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'actor_f', 'Actor');
    makeActor(graph, 'target_f', 'Target');
    const baseline = computeInitialLeverage(graph, 'actor_f', 'target_f').leverage;

    graph.addEdge({
      id: 'fav_test',
      type: 'owes_favor',
      source: 'target_f',
      target: 'actor_f',
      properties: { magnitude: 0.4, context: 'helped', grantedTick: 1, redeemed: false, broken: false },
    });
    const withFavor = computeInitialLeverage(graph, 'actor_f', 'target_f').leverage;
    const expectedBonus = 0.4 * FAVOR_LEVERAGE_MULTIPLIER;
    expect(withFavor).toBeCloseTo(baseline + expectedBonus, 3);
  });

  it('does not add secret_bonus for already-revealed secrets', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'actor_r', 'Actor');
    makeActor(graph, 'target_r', 'Target');
    const baseline = computeInitialLeverage(graph, 'actor_r', 'target_r').leverage;

    graph.addEdge({
      id: 'sec_revealed',
      type: 'knows_secret_of',
      source: 'actor_r',
      target: 'target_r',
      properties: { magnitude: 0.8, revealed: true, secretType: 'past_crime', discoveredTick: 1, source: 'confession' },
    });
    const withRevealedSecret = computeInitialLeverage(graph, 'actor_r', 'target_r').leverage;
    expect(withRevealedSecret).toBeCloseTo(baseline, 3);
  });
});
