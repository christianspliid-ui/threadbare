import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getCompletedAmbitions, getAgentInfoCard } from '../agentDetail';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';
import {
  AMBITION_PRIMARY_INTERACTIONS,
  AMBITION_PRIMARY_KNOWLEDGE,
  AMBITION_SECONDARY_INTERACTIONS,
  COMPLETED_AMBITIONS_MAX_DISPLAY,
} from '../../types/agentKnowledge';

// ─── Helpers ─────────────────────────────────────────────────────

const AGENT_ID = 'agent.test';
const ASC_ID = 'asc.test';

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAgent(graph: WorldGraph): void {
  graph.addNode({
    id: AGENT_ID,
    type: 'actor',
    name: 'Test Agent',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 5, gold: 3, shadow: 2, veil: 1, heart: 1, eye: 1, stone: 1, star: 1 },
    },
  });
  graph.addNode({ id: ASC_ID, type: 'actor', name: 'Ascendant', properties: { actorType: 'individual' } });
  graph.addEdge({
    id: `thread_${AGENT_ID}`,
    source: ASC_ID,
    target: AGENT_ID,
    type: 'thread',
    properties: { tier: 2 },
  });
}

/** Add a pursues edge + ambition node with a given status and optional resolvedTick. */
function addPursues(
  graph: WorldGraph,
  templateId: string,
  status: 'active' | 'completed' | 'abandoned',
  resolvedTick?: number,
  keySuffix = templateId,
): void {
  const template = AMBITION_TEMPLATES.find(t => t.id === templateId);
  const ambitionNodeId = `ambition.${keySuffix}`;
  graph.addNode({
    id: ambitionNodeId,
    type: 'ambition',
    name: template?.displayName ?? templateId,
    properties: {
      templateId,
      displayName: template?.displayName ?? templateId,
      category: template?.category ?? 'survival',
    },
  });
  graph.addEdge({
    id: `pursues_${AGENT_ID}_${keySuffix}`,
    source: AGENT_ID,
    target: ambitionNodeId,
    type: 'pursues',
    properties: {
      priority: 'primary',
      status,
      assignedTick: 1,
      completedMilestones: [],
      ...(resolvedTick != null ? { resolvedTick } : {}),
    },
  });
}

// ─── getCompletedAmbitions ────────────────────────────────────────

describe('getCompletedAmbitions (THR-721)', () => {
  it('returns empty when the agent has no pursues edges', () => {
    const graph = makeGraph();
    addAgent(graph);
    expect(getCompletedAmbitions(graph, AGENT_ID)).toEqual([]);
  });

  it('returns only completed ambitions — excludes active and abandoned', () => {
    const graph = makeGraph();
    addAgent(graph);
    const t0 = AMBITION_TEMPLATES[0].id;
    const t1 = AMBITION_TEMPLATES[1]?.id ?? AMBITION_TEMPLATES[0].id;
    const t2 = AMBITION_TEMPLATES[2]?.id ?? AMBITION_TEMPLATES[0].id;
    addPursues(graph, t0, 'completed', 40, 'done');
    addPursues(graph, t1, 'active', undefined, 'active');
    addPursues(graph, t2, 'abandoned', 20, 'abandoned');

    const result = getCompletedAmbitions(graph, AGENT_ID);
    expect(result).toHaveLength(1);
    expect(result[0].ambitionId).toBe('ambition.done');
    expect(result[0].resolvedTick).toBe(40);
    expect(result[0].name).toBe(AMBITION_TEMPLATES[0].displayName);
  });

  it('sorts newest-first by resolvedTick', () => {
    const graph = makeGraph();
    addAgent(graph);
    const t = AMBITION_TEMPLATES[0].id;
    addPursues(graph, t, 'completed', 10, 'a');
    addPursues(graph, t, 'completed', 90, 'b');
    addPursues(graph, t, 'completed', 50, 'c');

    const ticks = getCompletedAmbitions(graph, AGENT_ID).map(a => a.resolvedTick);
    expect(ticks).toEqual([90, 50, 10]);
  });

  it('fail-soft: a completed edge missing resolvedTick is included and sorted last', () => {
    const graph = makeGraph();
    addAgent(graph);
    const t = AMBITION_TEMPLATES[0].id;
    addPursues(graph, t, 'completed', 30, 'withtick');
    addPursues(graph, t, 'completed', undefined, 'notick');

    const result = getCompletedAmbitions(graph, AGENT_ID);
    expect(result).toHaveLength(2);
    expect(result[0].resolvedTick).toBe(30);
    expect(result[1].resolvedTick).toBeUndefined();
  });

  it('caps the list at COMPLETED_AMBITIONS_MAX_DISPLAY, keeping the newest', () => {
    const graph = makeGraph();
    addAgent(graph);
    const t = AMBITION_TEMPLATES[0].id;
    const total = COMPLETED_AMBITIONS_MAX_DISPLAY + 5;
    for (let i = 0; i < total; i++) {
      addPursues(graph, t, 'completed', i, `c${i}`);
    }
    const result = getCompletedAmbitions(graph, AGENT_ID);
    expect(result).toHaveLength(COMPLETED_AMBITIONS_MAX_DISPLAY);
    // Newest kept: highest resolvedTick is total-1, oldest kept is total-MAX.
    expect(result[0].resolvedTick).toBe(total - 1);
    expect(result[result.length - 1].resolvedTick).toBe(total - COMPLETED_AMBITIONS_MAX_DISPLAY);
  });

  it('populates AgentInfoCardData.completedAmbitions', () => {
    const graph = makeGraph();
    addAgent(graph);
    addPursues(graph, AMBITION_TEMPLATES[0].id, 'completed', 12, 'done');

    const card = getAgentInfoCard(graph, AGENT_ID, ASC_ID, 'intimate');
    expect(card).not.toBeNull();
    expect(card!.completedAmbitions).toHaveLength(1);
    expect(card!.completedAmbitions![0].resolvedTick).toBe(12);
  });

  it('leaves completedAmbitions undefined when there are none', () => {
    const graph = makeGraph();
    addAgent(graph);
    const card = getAgentInfoCard(graph, AGENT_ID, ASC_ID, 'intimate');
    expect(card!.completedAmbitions).toBeUndefined();
  });
});

// ─── Gate-threshold locks ─────────────────────────────────────────

describe('ambition visibility thresholds (THR-721)', () => {
  it('primary ambition is revealed at first meaningful exposure', () => {
    expect(AMBITION_PRIMARY_INTERACTIONS).toBe(1);
    expect(AMBITION_PRIMARY_KNOWLEDGE).toBe('recognised');
  });

  it('secondary-ambition gate is unchanged (verdict 3)', () => {
    expect(AMBITION_SECONDARY_INTERACTIONS).toBe(4);
  });

  it('completed-ambitions display cap is stable', () => {
    expect(COMPLETED_AMBITIONS_MAX_DISPLAY).toBe(10);
  });
});
