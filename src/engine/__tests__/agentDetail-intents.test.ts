import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentInfoCard } from '../agentDetail';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';

// ─── Helpers ─────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

/** Add a minimal agent threaded to the ascendant */
function addAgent(
  graph: WorldGraph,
  agentId: string,
  ascendantId: string,
): void {
  graph.addNode({
    id: agentId,
    type: 'actor',
    name: 'Test Agent',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 5, gold: 3, shadow: 2, veil: 1, heart: 1, eye: 1, stone: 1, star: 1, flesh: 1 },
      axiologicalProfile: { loyalty_ambition: 0.7 },
    },
  });
  graph.addNode({ id: ascendantId, type: 'actor', name: 'Ascendant', properties: { actorType: 'individual' } });
  graph.addEdge({
    id: `thread_${agentId}`,
    source: ascendantId,
    target: agentId,
    type: 'thread',
    properties: { tier: 2 },
  });
}

/** Add a pursues edge + ambition node for a given template */
function addPursues(
  graph: WorldGraph,
  agentId: string,
  templateId: string,
  priority: 'primary' | 'secondary',
  completedMilestones: string[] = [],
): void {
  const template = AMBITION_TEMPLATES.find(t => t.id === templateId);
  const ambitionNodeId = `ambition.${templateId}`;
  if (!graph.getNode(ambitionNodeId)) {
    graph.addNode({
      id: ambitionNodeId,
      type: 'ambition',
      name: template?.displayName ?? templateId,
      properties: {
        templateId,
        displayName: template?.displayName ?? templateId,
        category: template?.category ?? 'survival',
        reachAffinity: template?.reachAffinity ?? {},
        totalMilestones: template?.milestones.length ?? 0,
      },
    });
  }
  graph.addEdge({
    id: `pursues_${agentId}_${templateId}`,
    source: agentId,
    target: ambitionNodeId,
    type: 'pursues',
    properties: {
      priority,
      status: 'active',
      assignedTick: 1,
      completedMilestones,
    },
  });
}

// ─── Tests ────────────────────────────────────────────────────────

describe('getAgentInfoCard — intent aggregation', () => {
  const AGENT_ID = 'agent.test';
  const ASC_ID = 'asc.test';
  const TEMPLATE_ID = AMBITION_TEMPLATES[0].id;

  it('returns no intents when agent has no pursues edges', () => {
    const graph = makeGraph();
    addAgent(graph, AGENT_ID, ASC_ID);

    const card = getAgentInfoCard(graph, AGENT_ID, ASC_ID, 'intimate');
    expect(card).not.toBeNull();
    expect(card!.intents).toBeUndefined();
    expect(card!.primaryIntentSummary).toBeUndefined();
  });

  it('populates intents for active pursues edges', () => {
    const graph = makeGraph();
    addAgent(graph, AGENT_ID, ASC_ID);
    addPursues(graph, AGENT_ID, TEMPLATE_ID, 'primary');

    const card = getAgentInfoCard(graph, AGENT_ID, ASC_ID, 'intimate');
    expect(card!.intents).toHaveLength(1);
    expect(card!.intents![0].templateId).toBe(TEMPLATE_ID);
    expect(card!.intents![0].priority).toBe('primary');
  });

  it('sorts primary before secondary', () => {
    const graph = makeGraph();
    addAgent(graph, AGENT_ID, ASC_ID);

    const t1 = AMBITION_TEMPLATES[0].id;
    const t2 = AMBITION_TEMPLATES[1]?.id ?? AMBITION_TEMPLATES[0].id;

    // Add secondary first, then primary — result should be sorted
    addPursues(graph, AGENT_ID, t1, 'secondary');
    if (t2 !== t1) {
      addPursues(graph, AGENT_ID, t2, 'primary');
      const card = getAgentInfoCard(graph, AGENT_ID, ASC_ID, 'intimate');
      expect(card!.intents![0].priority).toBe('primary');
      expect(card!.intents![1].priority).toBe('secondary');
    }
  });

  it('does not include inactive (completed/abandoned) pursues edges', () => {
    const graph = makeGraph();
    addAgent(graph, AGENT_ID, ASC_ID);

    const ambitionNodeId = `ambition.${TEMPLATE_ID}.done`;
    const template = AMBITION_TEMPLATES.find(t => t.id === TEMPLATE_ID);
    graph.addNode({
      id: ambitionNodeId,
      type: 'ambition',
      name: template?.displayName ?? TEMPLATE_ID,
      properties: { templateId: TEMPLATE_ID },
    });
    graph.addEdge({
      id: `pursues_${AGENT_ID}_done`,
      source: AGENT_ID,
      target: ambitionNodeId,
      type: 'pursues',
      properties: {
        priority: 'primary',
        status: 'completed',
        assignedTick: 1,
        completedMilestones: [],
      },
    });

    const card = getAgentInfoCard(graph, AGENT_ID, ASC_ID, 'intimate');
    expect(card!.intents).toBeUndefined();
  });

  it('counts completedMilestones correctly', () => {
    const graph = makeGraph();
    addAgent(graph, AGENT_ID, ASC_ID);

    const template = AMBITION_TEMPLATES[0];
    const completedIds = template.milestones.slice(0, 1).map(m => m.id);
    addPursues(graph, AGENT_ID, template.id, 'primary', completedIds);

    const card = getAgentInfoCard(graph, AGENT_ID, ASC_ID, 'intimate');
    expect(card!.intents![0].completedMilestones).toBe(1);
    expect(card!.intents![0].requiredMilestones).toBe(template.completion.requires);
  });

  it('populates primaryIntentSummary from primary intent', () => {
    const graph = makeGraph();
    addAgent(graph, AGENT_ID, ASC_ID);
    addPursues(graph, AGENT_ID, TEMPLATE_ID, 'primary');

    const card = getAgentInfoCard(graph, AGENT_ID, ASC_ID, 'intimate');
    expect(card!.primaryIntentSummary).toBeDefined();
    expect(card!.primaryIntentSummary!.displayName).toBe(AMBITION_TEMPLATES[0].displayName);
    expect(card!.primaryIntentSummary!.category).toBe(AMBITION_TEMPLATES[0].category);
  });

  it('detects reactive trigger on reactive templates', () => {
    const graph = makeGraph();
    addAgent(graph, AGENT_ID, ASC_ID);

    // Find a reactive template (has triggerEvent)
    const reactiveTemplate = AMBITION_TEMPLATES.find(t => 'triggerEvent' in t);
    if (!reactiveTemplate) return; // skip if no reactive templates loaded

    addPursues(graph, AGENT_ID, reactiveTemplate.id, 'primary');

    const card = getAgentInfoCard(graph, AGENT_ID, ASC_ID, 'intimate');
    expect(card!.intents![0].reactiveTrigger).toBeTruthy();
  });
});
