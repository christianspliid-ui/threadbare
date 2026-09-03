import { describe, it, expect } from 'vitest';
import {
  applyChainStageCompletion,
  CHAIN_COMPLETION_CAPABILITY_BONUS,
  classifyChainStage,
  ENCOUNTER_CHAINS,
  getChainProgress,
  isChainStageUnlocked,
  MAX_ACTIVE_CHAINS,
} from '../encounterChains';
import type { ChainProgress } from '../encounterChains';
import { WorldGraph } from '../graph';
import { getAnyEncounterById } from '../../data/encounter-content';

function emptyProgress(): ChainProgress {
  return { completed: {} };
}

function makeGraphWithAgent(agentId = 'agent_chain_test'): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: agentId,
    type: 'actor',
    name: 'Chain Test Agent',
    properties: { actorType: 'individual' },
  });
  return graph;
}

describe('classifyChainStage', () => {
  const scholarsPath = ENCOUNTER_CHAINS.find(c => c.id === 'chain.scholars_path')!;
  // stages: ['encounter.knowledge_test', 'encounter.forbidden_tome', 'encounter.arcane_duel']

  it('returns false/false for an unknown template', () => {
    expect(classifyChainStage('nonexistent_template_xyz', emptyProgress())).toEqual({
      isChainStage: false,
      isFinalChainStage: false,
    });
  });

  it('returns true/false for stage 0 with empty progress', () => {
    expect(classifyChainStage(scholarsPath.stages[0], emptyProgress())).toEqual({
      isChainStage: true,
      isFinalChainStage: false,
    });
  });

  it('returns false/false for stage 1 when stage 0 not yet completed', () => {
    expect(classifyChainStage(scholarsPath.stages[1], emptyProgress())).toEqual({
      isChainStage: false,
      isFinalChainStage: false,
    });
  });

  it('returns true/false for mid-chain stage when previous stage completed', () => {
    const progress: ChainProgress = {
      completed: { 'chain.scholars_path': 0 }, // completed stage 0
    };
    expect(classifyChainStage(scholarsPath.stages[1], progress)).toEqual({
      isChainStage: true,
      isFinalChainStage: false,
    });
  });

  it('returns true/true for final stage when penultimate stage completed', () => {
    const finalStage = scholarsPath.stages[scholarsPath.stages.length - 1];
    const progress: ChainProgress = {
      completed: { 'chain.scholars_path': scholarsPath.stages.length - 2 },
    };
    expect(classifyChainStage(finalStage, progress)).toEqual({
      isChainStage: true,
      isFinalChainStage: true,
    });
  });

  it('returns false/false when chain already fully completed', () => {
    const firstStage = scholarsPath.stages[0];
    const progress: ChainProgress = {
      completed: { 'chain.scholars_path': scholarsPath.stages.length - 1 },
    };
    // stage 0 is done — no longer the "next" stage
    expect(classifyChainStage(firstStage, progress)).toEqual({
      isChainStage: false,
      isFinalChainStage: false,
    });
  });

  it('respects MAX_ACTIVE_CHAINS cap for new chains', () => {
    const riseChain = ENCOUNTER_CHAINS.find(c => c.id === 'chain.rise_through_ranks')!;
    const merchantChain = ENCOUNTER_CHAINS.find(c => c.id === 'chain.merchants_gambit')!;

    // Fill MAX_ACTIVE_CHAINS slots with already-started chains (scholars + rise)
    const progress: ChainProgress = {
      completed: {
        'chain.scholars_path': 0,
        'chain.rise_through_ranks': 0,
      },
    };
    expect(Object.keys(progress.completed).length).toBe(MAX_ACTIVE_CHAINS);

    // merchant chain stage 0 would start a new chain — should be blocked
    expect(classifyChainStage(merchantChain.stages[0], progress)).toEqual({
      isChainStage: false,
      isFinalChainStage: false,
    });
  });

  it('does not cap already-started chains at MAX_ACTIVE_CHAINS', () => {
    const riseChain = ENCOUNTER_CHAINS.find(c => c.id === 'chain.rise_through_ranks')!;

    // Two chains started → cap applies to NEW chains, not continuation
    const progress: ChainProgress = {
      completed: {
        'chain.scholars_path': 0,
        'chain.rise_through_ranks': 0, // started, not at next stage yet
      },
    };
    // rise stage 1 continues an already-started chain — allowed even at cap
    expect(classifyChainStage(riseChain.stages[1], progress)).toEqual({
      isChainStage: true,
      isFinalChainStage: false,
    });
  });
});

// ─── THR-803 regression: the chain vocabulary and the write path ────

describe('chain stage ids resolve to real templates (THR-803)', () => {
  // The defect this guards: stages were authored as bare keys (`knowledge_test`)
  // while every real template is `encounter.knowledge_test`. Because consumers look
  // up `entry.templateId` — the prefixed id — no lookup ever matched, so the gate
  // silently passed everything and the bonus was always 0. A chain naming a
  // non-existent template is inert in exactly that undetectable way.
  it('every stage of every chain names a template that exists', () => {
    const unresolved: string[] = [];
    for (const chain of ENCOUNTER_CHAINS) {
      for (const stageId of chain.stages) {
        if (!getAnyEncounterById(stageId)) unresolved.push(`${chain.id}:${stageId}`);
      }
    }
    expect(unresolved).toEqual([]);
  });
});

describe('applyChainStageCompletion (THR-803 write path)', () => {
  const scholars = ENCOUNTER_CHAINS.find(c => c.id === 'chain.scholars_path')!;

  it('a stage-1 template is drawable only after stage 0 is recorded complete', () => {
    const agentId = 'agent_chain_test';
    const graph = makeGraphWithAgent(agentId);
    const agent = () => graph.getNode(agentId)!;

    // Before: stage 1 is gated shut, stage 0 is open.
    expect(isChainStageUnlocked(scholars.stages[1], getChainProgress(agent().properties))).toBe(false);
    expect(isChainStageUnlocked(scholars.stages[0], getChainProgress(agent().properties))).toBe(true);

    // Resolving stage 0 records progress...
    const result = applyChainStageCompletion(graph, agentId, scholars.stages[0], 10);
    expect(result.advanced).toBe(true);

    // ...which is what actually opens the gate. This is the assertion that would
    // have failed for the entire life of the subsystem before THR-803: nothing
    // wrote chainProgress, so this stayed false forever.
    expect(isChainStageUnlocked(scholars.stages[1], getChainProgress(agent().properties))).toBe(true);
    // Stage 2 is still shut — one stage opens at a time.
    expect(isChainStageUnlocked(scholars.stages[2], getChainProgress(agent().properties))).toBe(false);
  });

  it('writes chainProgress onto the agent node', () => {
    const agentId = 'agent_chain_test';
    const graph = makeGraphWithAgent(agentId);

    expect(graph.getNode(agentId)!.properties.chainProgress).toBeUndefined();
    applyChainStageCompletion(graph, agentId, scholars.stages[0], 5);

    expect(graph.getNode(agentId)!.properties.chainProgress).toEqual({
      completed: { 'chain.scholars_path': 0 },
    });
  });

  it('no-ops for a template in no chain, and for a stage out of order', () => {
    const agentId = 'agent_chain_test';
    const graph = makeGraphWithAgent(agentId);

    expect(applyChainStageCompletion(graph, agentId, 'encounter.not_in_any_chain', 1).advanced).toBe(false);
    // Stage 2 without stage 0/1 must not leapfrog the chain.
    expect(applyChainStageCompletion(graph, agentId, scholars.stages[2], 1).advanced).toBe(false);
    expect(graph.getNode(agentId)!.properties.chainProgress).toBeUndefined();
  });

  it('grants the completion capability bonus once, on the final stage only', () => {
    const agentId = 'agent_chain_test';
    const graph = makeGraphWithAgent(agentId);
    const masteryEdges = () =>
      // THR-1395: the definition is shared per chain (`trait.experience.chain.<id>`);
      // the bearing — and so the once-only guarantee — is this agent's own edge.
      graph.getOutgoingEdges(agentId, 'has_trait')
        .filter(e => e.target.startsWith('trait.experience.chain.'));

    applyChainStageCompletion(graph, agentId, scholars.stages[0], 1);
    applyChainStageCompletion(graph, agentId, scholars.stages[1], 2);
    expect(masteryEdges()).toHaveLength(0); // mid-chain: no bonus yet

    const final = applyChainStageCompletion(graph, agentId, scholars.stages[2], 3);
    expect(final.completedChainIds).toEqual(['chain.scholars_path']);
    expect(masteryEdges()).toHaveLength(1);
    expect(masteryEdges()[0].properties.level).toBe(CHAIN_COMPLETION_CAPABILITY_BONUS);

    // Re-entrant call must not stack the boost.
    applyChainStageCompletion(graph, agentId, scholars.stages[2], 4);
    expect(masteryEdges()).toHaveLength(1);
  });

  // THR-1395 moved chain mastery to one shared definition per chain. The per-(chain, agent)
  // node id used to make both of these true for free; now the edge has to carry them, so
  // both are worth pinning: two finishers share one node, and neither collides with the
  // other's edge (the edge id used to be derived from the node id alone).
  it('shares one chain-mastery definition between two agents who both finish', () => {
    const graph = makeGraphWithAgent('agent_a');
    graph.addNode({
      id: 'agent_b', type: 'actor', name: 'Second Finisher',
      properties: { actorType: 'individual' },
    });

    for (const agentId of ['agent_a', 'agent_b']) {
      scholars.stages.forEach((stage, i) => {
        applyChainStageCompletion(graph, agentId, stage, i + 1);
      });
    }

    const masteryNodes = graph.getNodesByType('trait')
      .filter(n => n.id.startsWith('trait.experience.chain.'));
    expect(masteryNodes).toHaveLength(1);

    for (const agentId of ['agent_a', 'agent_b']) {
      const edges = graph.getOutgoingEdges(agentId, 'has_trait')
        .filter(e => e.target === masteryNodes[0].id);
      expect(edges).toHaveLength(1);
      expect(edges[0].properties.level).toBe(CHAIN_COMPLETION_CAPABILITY_BONUS);
    }
  });

  it('does not re-grant the bonus to a bearer holding the legacy per-bearer mastery node', () => {
    const agentId = 'agent_legacy';
    const graph = makeGraphWithAgent(agentId);
    const legacyId = `chain_mastery_${scholars.id}_${agentId}`;
    graph.addNode({
      id: legacyId, type: 'trait', name: 'Chain Mastery (legacy)',
      properties: { subcategory: 'experience', tags: ['experience', 'chain'] },
    });
    graph.addEdge({
      id: `edge_${legacyId}`, source: agentId, target: legacyId, type: 'has_trait',
      properties: {
        level: CHAIN_COMPLETION_CAPABILITY_BONUS, acquiredTick: 1,
        lastReinforcedTick: 1, source: 'chain_completion', visibility: 'discoverable',
      },
    });

    scholars.stages.forEach((stage, i) => {
      applyChainStageCompletion(graph, agentId, stage, i + 1);
    });

    // Still exactly one bearing, still the legacy one — no second, shared-shape grant.
    const edges = graph.getOutgoingEdges(agentId, 'has_trait');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(legacyId);
  });

  it('fail-soft: a missing agent node does not throw', () => {
    const graph = new WorldGraph();
    expect(() => applyChainStageCompletion(graph, 'ghost', scholars.stages[0], 1)).not.toThrow();
    expect(applyChainStageCompletion(graph, 'ghost', scholars.stages[0], 1).advanced).toBe(false);
  });
});
