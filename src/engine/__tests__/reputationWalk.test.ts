import { describe, it, expect, beforeEach } from 'vitest';
import {
  perceiveReputation,
  REPUTATION_MAX_HOPS,
  UNKNOWN_REPUTATION,
  SHADOW_DISTORTION_FACTOR,
  HEART_TRUST_FACTOR,
  FACTION_RANK_TRUST_BONUS,
} from '../reputationWalk';
import { WorldGraph } from '../graph';

/**
 * Helper: build a graph with agents and relates_to edges.
 * Agents have no traits by default (capability = sigmoid(0) ≈ 0.018).
 */
function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAgent(g: WorldGraph, id: string, name?: string): void {
  g.addNode({
    id,
    type: 'actor',
    name: name ?? id,
    properties: { actorType: 'individual' },
  });
}

function addRelatesTo(
  g: WorldGraph,
  source: string,
  target: string,
  trust: number,
  edgeId?: string,
): void {
  g.addEdge({
    id: edgeId ?? `edge-${source}-${target}`,
    source,
    target,
    type: 'relates_to',
    properties: { trust, sentiment: 0, strength: 0.5 },
  });
}

function addFactionMembership(
  g: WorldGraph,
  agentId: string,
  factionId: string,
  rank: number,
): void {
  // Ensure faction node exists
  if (!g.getNode(factionId)) {
    g.addNode({
      id: factionId,
      type: 'actor',
      name: factionId,
      properties: { actorType: 'faction' },
    });
  }
  g.addEdge({
    id: `member-${agentId}-${factionId}`,
    source: agentId,
    target: factionId,
    type: 'member_of',
    properties: { rank },
  });
}

function addTraitWithShadow(
  g: WorldGraph,
  agentId: string,
  shadowContribution: number,
): void {
  const traitId = `trait-shadow-${agentId}`;
  g.addNode({
    id: traitId,
    type: 'trait',
    name: 'Shadow Mastery',
    properties: {
      domainContributions: { shadow: shadowContribution },
    },
  });
  g.addEdge({
    id: `has-trait-${agentId}-shadow`,
    source: agentId,
    target: traitId,
    type: 'has_trait',
    properties: { level: 1 },
  });
}

function addTraitWithHeart(
  g: WorldGraph,
  agentId: string,
  heartContribution: number,
): void {
  const traitId = `trait-heart-${agentId}`;
  g.addNode({
    id: traitId,
    type: 'trait',
    name: 'Heart Mastery',
    properties: {
      domainContributions: { heart: heartContribution },
    },
  });
  g.addEdge({
    id: `has-trait-${agentId}-heart`,
    source: agentId,
    target: traitId,
    type: 'has_trait',
    properties: { level: 1 },
  });
}

describe('perceiveReputation', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = makeGraph();
  });

  it('returns direct trust for direct edge', () => {
    addAgent(graph, 'a');
    addAgent(graph, 'b');
    addRelatesTo(graph, 'a', 'b', 0.7);
    expect(perceiveReputation(graph, 'a', 'b')).toBe(0.7);
  });

  it('computes trust product for one-hop indirect path', () => {
    addAgent(graph, 'a');
    addAgent(graph, 'mid');
    addAgent(graph, 'b');
    addRelatesTo(graph, 'a', 'mid', 0.8);
    addRelatesTo(graph, 'mid', 'b', 0.5);
    // No direct edge a→b
    // Trust product = 0.8 * 0.5 = 0.4, plus some distortion
    const result = perceiveReputation(graph, 'a', 'b');
    // Should be close to 0.4 (with minor distortion from low shadow/heart)
    expect(result).toBeGreaterThan(0.3);
    expect(result).toBeLessThan(0.6);
  });

  it('applies Shadow distortion from high-shadow intermediary', () => {
    addAgent(graph, 'a');
    addAgent(graph, 'mid');
    addAgent(graph, 'b');
    addRelatesTo(graph, 'a', 'mid', 0.8);
    addRelatesTo(graph, 'mid', 'b', 0.5);

    // Give intermediary high Shadow capability
    addTraitWithShadow(graph, 'mid', 30); // High shadow → high distortion

    const result = perceiveReputation(graph, 'a', 'b');
    // Shadow distortion should shift the result
    // raw = 0.4, with positive distortion from shadow intermediary
    expect(result).not.toBeCloseTo(0.4, 1);
  });

  it('applies Heart resistance to reduce distortion', () => {
    addAgent(graph, 'a');
    addAgent(graph, 'mid');
    addAgent(graph, 'b');
    addRelatesTo(graph, 'a', 'mid', 0.8);
    addRelatesTo(graph, 'mid', 'b', 0.5);
    addTraitWithShadow(graph, 'mid', 30);

    // Without heart resistance
    const withoutHeart = perceiveReputation(graph, 'a', 'b');

    // Give source high Heart capability
    addTraitWithHeart(graph, 'a', 30);
    const withHeart = perceiveReputation(graph, 'a', 'b');

    // With heart, distortion should be reduced — result closer to raw 0.4
    const raw = 0.4;
    expect(Math.abs(withHeart - raw)).toBeLessThan(Math.abs(withoutHeart - raw));
  });

  it('returns UNKNOWN_REPUTATION when no path exists', () => {
    addAgent(graph, 'a');
    addAgent(graph, 'b');
    // No edges
    expect(perceiveReputation(graph, 'a', 'b')).toBe(UNKNOWN_REPUTATION);
  });

  it('picks highest absolute trust product among multiple paths', () => {
    addAgent(graph, 'a');
    addAgent(graph, 'mid1');
    addAgent(graph, 'mid2');
    addAgent(graph, 'b');
    // Path 1: a → mid1 → b, trust product = 0.3 * 0.3 = 0.09
    addRelatesTo(graph, 'a', 'mid1', 0.3);
    addRelatesTo(graph, 'mid1', 'b', 0.3);
    // Path 2: a → mid2 → b, trust product = 0.9 * 0.9 = 0.81
    addRelatesTo(graph, 'a', 'mid2', 0.9);
    addRelatesTo(graph, 'mid2', 'b', 0.9);

    const result = perceiveReputation(graph, 'a', 'b');
    // Should be based on path 2 (higher absolute product)
    expect(result).toBeGreaterThan(0.5);
  });

  it('applies faction rank bonus for shared factions', () => {
    addAgent(graph, 'a');
    addAgent(graph, 'mid');
    addAgent(graph, 'b');
    addRelatesTo(graph, 'a', 'mid', 0.8);
    addRelatesTo(graph, 'mid', 'b', 0.5);

    // Without faction membership
    const withoutFaction = perceiveReputation(graph, 'a', 'b');

    // Add shared faction with high rank
    addFactionMembership(graph, 'a', 'guild', 1);
    addFactionMembership(graph, 'mid', 'guild', 5);

    const withFaction = perceiveReputation(graph, 'a', 'b');

    // Faction bonus should increase the reputation
    expect(withFaction).toBeGreaterThan(withoutFaction);
  });

  it('returns UNKNOWN_REPUTATION for missing agent', () => {
    addAgent(graph, 'a');
    expect(perceiveReputation(graph, 'a', 'nonexistent')).toBe(UNKNOWN_REPUTATION);
  });

  it('returns UNKNOWN_REPUTATION for self-reputation', () => {
    addAgent(graph, 'a');
    expect(perceiveReputation(graph, 'a', 'a')).toBe(UNKNOWN_REPUTATION);
  });

  it('clamps result to [-1, 1]', () => {
    addAgent(graph, 'a');
    addAgent(graph, 'mid');
    addAgent(graph, 'b');
    addRelatesTo(graph, 'a', 'mid', 1.0);
    addRelatesTo(graph, 'mid', 'b', 1.0);

    // Give intermediary maximum shadow and shared faction with high rank
    addTraitWithShadow(graph, 'mid', 50);
    addFactionMembership(graph, 'a', 'guild', 1);
    addFactionMembership(graph, 'mid', 'guild', 10);

    const result = perceiveReputation(graph, 'a', 'b');
    expect(result).toBeLessThanOrEqual(1);
    expect(result).toBeGreaterThanOrEqual(-1);
  });
});
