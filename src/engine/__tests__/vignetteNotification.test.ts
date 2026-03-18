import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  classifyVignetteTier,
  gatherVignetteNotifications,
  isAgentBonded,
  VIGNETTE_MAX_PER_TICK,
  VIGNETTE_QUEST_PRIORITY_THRESHOLD,
} from '../vignetteNotification';
import { setDivineAttention } from '../divineAttention';
import type { DivineAttention } from '../divineAttention';

// --- Helpers ---

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'ascendant.1', type: 'actor', name: 'The Watcher', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'agent.1', type: 'actor', name: 'Alice', properties: {} });
  g.addNode({ id: 'agent.2', type: 'actor', name: 'Bob', properties: {} });
  g.addNode({ id: 'agent.3', type: 'actor', name: 'Carol', properties: {} });
  g.addNode({ id: 'loc.1', type: 'location', name: 'Iron Keep', properties: {} });
  return g;
}

function bondAgent(graph: WorldGraph, agentId: string): void {
  graph.addEdge({
    id: `edge.${agentId}.worships`,
    source: agentId,
    target: 'ascendant.1',
    type: 'worships',
    properties: { tier: 2, ticksAtCurrentTier: 5, establishedTick: 0, totalEssenceSpent: 10, maintenanceCurrent: true, readBackstoryTier: 0 },
  });
}

// --- Tests ---

describe('isAgentBonded', () => {
  it('returns false for unbonded agent', () => {
    const g = makeGraph();
    expect(isAgentBonded(g, 'agent.1')).toBe(false);
  });

  it('returns true for bonded agent', () => {
    const g = makeGraph();
    bondAgent(g, 'agent.1');
    expect(isAgentBonded(g, 'agent.1')).toBe(true);
  });

  it('returns false for missing agent', () => {
    const g = makeGraph();
    expect(isAgentBonded(g, 'nonexistent')).toBe(false);
  });
});

describe('classifyVignetteTier', () => {
  it('returns Tier 1 for hard+ threat with bonded agent', () => {
    const g = makeGraph();
    bondAgent(g, 'agent.1');
    expect(classifyVignetteTier(g, 'agent.1', 'enc.1', 'hard', 0)).toBe(1);
    expect(classifyVignetteTier(g, 'agent.1', 'enc.1', 'deadly', 0)).toBe(1);
  });

  it('returns Tier 1 for high quest priority regardless of bond', () => {
    const g = makeGraph();
    expect(classifyVignetteTier(g, 'agent.1', 'enc.1', 'trivial', VIGNETTE_QUEST_PRIORITY_THRESHOLD)).toBe(1);
  });

  it('returns Tier 1 for focused divine attention', () => {
    const g = makeGraph();
    setDivineAttention(g, 'agent.1', { level: 'focused', costDiscount: 0, efficiencyBoost: 0.4 });
    expect(classifyVignetteTier(g, 'agent.1', 'enc.1', 'trivial', 0)).toBe(1);
  });

  it('returns Tier 1 for attuned divine attention', () => {
    const g = makeGraph();
    setDivineAttention(g, 'agent.1', { level: 'attuned', costDiscount: 0.3, efficiencyBoost: 0 });
    expect(classifyVignetteTier(g, 'agent.1', 'enc.1', 'trivial', 0)).toBe(1);
  });

  it('returns Tier 2 for scried agent', () => {
    const g = makeGraph();
    setDivineAttention(g, 'agent.1', { level: 'scried', costDiscount: 0, efficiencyBoost: 0, expiresAtTick: 100 });
    expect(classifyVignetteTier(g, 'agent.1', 'enc.1', 'trivial', 0)).toBe(2);
  });

  it('returns Tier 2 for moderate threat with bonded agent', () => {
    const g = makeGraph();
    bondAgent(g, 'agent.1');
    expect(classifyVignetteTier(g, 'agent.1', 'enc.1', 'moderate', 0)).toBe(2);
  });

  it('returns Tier 3 for trivial threat with unbonded agent', () => {
    const g = makeGraph();
    expect(classifyVignetteTier(g, 'agent.1', 'enc.1', 'trivial', 0)).toBe(3);
  });
});

describe('gatherVignetteNotifications', () => {
  it('classifies a batch of encounter events', () => {
    const g = makeGraph();
    bondAgent(g, 'agent.1');

    const notifications = gatherVignetteNotifications(g, [
      { agentId: 'agent.1', encounterId: 'enc.1', stepId: 's1', locationId: 'loc.1', threatRating: 'hard', questPriority: 0 },
      { agentId: 'agent.2', encounterId: 'enc.2', stepId: 's1', locationId: 'loc.1', threatRating: 'trivial', questPriority: 0 },
    ]);

    expect(notifications).toHaveLength(2);
    expect(notifications[0].tier).toBe(1);
    expect(notifications[1].tier).toBe(3);
  });

  it('enforces VIGNETTE_MAX_PER_TICK by demoting excess Tier 1 to Tier 2', () => {
    const g = makeGraph();
    // Add extra agents for > MAX_PER_TICK tier 1 events
    g.addNode({ id: 'agent.4', type: 'actor', name: 'Dave', properties: {} });
    g.addNode({ id: 'agent.5', type: 'actor', name: 'Eve', properties: {} });
    bondAgent(g, 'agent.1');
    bondAgent(g, 'agent.2');
    bondAgent(g, 'agent.3');
    bondAgent(g, 'agent.4');
    bondAgent(g, 'agent.5');

    const events = [
      { agentId: 'agent.1', encounterId: 'enc.1', stepId: 's1', locationId: 'loc.1', threatRating: 'deadly' as const, questPriority: 5 },
      { agentId: 'agent.2', encounterId: 'enc.2', stepId: 's1', locationId: 'loc.1', threatRating: 'hard' as const, questPriority: 3 },
      { agentId: 'agent.3', encounterId: 'enc.3', stepId: 's1', locationId: 'loc.1', threatRating: 'hard' as const, questPriority: 2 },
      { agentId: 'agent.4', encounterId: 'enc.4', stepId: 's1', locationId: 'loc.1', threatRating: 'hard' as const, questPriority: 1 },
      { agentId: 'agent.5', encounterId: 'enc.5', stepId: 's1', locationId: 'loc.1', threatRating: 'hard' as const, questPriority: 0.5 },
    ];

    const notifications = gatherVignetteNotifications(g, events);
    const tier1 = notifications.filter(n => n.tier === 1);
    const tier2 = notifications.filter(n => n.tier === 2);

    expect(tier1.length).toBe(VIGNETTE_MAX_PER_TICK);
    expect(tier2.length).toBe(2);
  });
});
