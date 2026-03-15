import { describe, it, expect } from 'vitest';
import { evaluateGraphCondition, evaluateAmbitionProgress } from '../ambitionLifecycle';
import type { AmbitionTemplate, ActiveAmbition, GraphCondition } from '../../types/ambition';
import { WorldGraph } from '../graph';

// --- Graph helpers ---

function makeTestGraph() {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'actor1',
    type: 'actor',
    name: 'Test Actor',
    properties: {
      actorType: 'individual',
      domainCapabilities: {
        iron: 5, gold: 3, shadow: 2, veil: 1, heart: 4,
        eye: 2, stone: 3, star: 1, flesh: 2,
      },
    },
  });

  graph.addNode({ id: 'trait_ambitious', type: 'trait', name: 'ambitious', properties: {} });
  graph.addEdge({ id: 'e_trait1', source: 'actor1', target: 'trait_ambitious', type: 'has_trait', properties: {} });

  graph.addNode({ id: 'loc1', type: 'location', name: 'The Forge', properties: { locationType: 'settlement' } });
  graph.addEdge({ id: 'e_loc', source: 'actor1', target: 'loc1', type: 'located_at', properties: {} });

  graph.addNode({ id: 'region1', type: 'location', name: 'Northern Wastes', properties: { regionTag: 'northern_wastes' } });
  graph.addEdge({ id: 'e_region', source: 'region1', target: 'loc1', type: 'contains', properties: {} });

  graph.addNode({ id: 'actor2', type: 'actor', name: 'Bond Partner', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'e_bond', source: 'actor1', target: 'actor2', type: 'relates_to', properties: { basis: 'ally' } });

  return graph;
}

// --- evaluateGraphCondition ---

describe('evaluateGraphCondition', () => {
  it('agent_reach_above: true when agent meets threshold', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'agent_reach_above', reach: 'iron', threshold: 4 };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(true);
  });

  it('agent_reach_above: false when agent below threshold', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'agent_reach_above', reach: 'iron', threshold: 10 };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(false);
  });

  it('agent_reach_below: true when agent at or below threshold', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'agent_reach_below', reach: 'star', threshold: 1 };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(true);
  });

  it('agent_has_bonds: true when sufficient bonds exist', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'agent_has_bonds', basis: 'ally', minCount: 1 };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(true);
  });

  it('agent_has_bonds: false when insufficient bonds', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'agent_has_bonds', basis: 'ally', minCount: 5 };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(false);
  });

  it('agent_has_trait: true when actor has the trait', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'agent_has_trait', trait: 'ambitious' };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(true);
  });

  it('agent_has_trait: false when actor lacks the trait', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'agent_has_trait', trait: 'cowardly' };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(false);
  });

  it('agent_lacks_trait: true when actor does not have the trait', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'agent_lacks_trait', trait: 'cowardly' };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(true);
  });

  it('agent_controls_location: true when actor controls matching type', () => {
    const graph = makeTestGraph();
    graph.addEdge({ id: 'e_ctrl', source: 'actor1', target: 'loc1', type: 'controls', properties: {} });
    const cond: GraphCondition = { type: 'agent_controls_location', locationType: 'settlement' };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(true);
  });

  it('target_agent_eliminated: true when target node missing', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'target_agent_eliminated', targetRef: 'nonexistent' };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(true);
  });

  it('target_agent_eliminated: false for $-prefixed symbolic refs', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'target_agent_eliminated', targetRef: '$betrayer' };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(false);
  });

  it('agent_in_region: true when actor in matching region', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'agent_in_region', region: 'Northern Wastes' };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(true);
  });

  it('agent_not_in_region: false when actor is in the region', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'agent_not_in_region', region: 'Northern Wastes' };
    expect(evaluateGraphCondition(cond, graph, 'actor1')).toBe(false);
  });

  it('returns false for nonexistent actor', () => {
    const graph = makeTestGraph();
    const cond: GraphCondition = { type: 'agent_reach_above', reach: 'iron', threshold: 1 };
    expect(evaluateGraphCondition(cond, graph, 'nobody')).toBe(false);
  });
});

// --- evaluateAmbitionProgress ---

describe('evaluateAmbitionProgress', () => {
  const makeTemplate = (overrides: Partial<AmbitionTemplate> = {}): AmbitionTemplate => ({
    id: 'test-ambition',
    displayName: 'Test Ambition',
    category: 'mastery',
    reachFloors: {},
    requiredTraits: [],
    blockingTraits: [],
    sphereAffinities: [],
    bondModifiers: [],
    boostingTraits: [],
    reachAffinity: {},
    milestones: [
      {
        id: 'wealth',
        condition: { type: 'agent_reach_above', reach: 'gold', threshold: 2 },
        prose: ['Gained wealth.'],
      },
      {
        id: 'strength',
        condition: { type: 'agent_reach_above', reach: 'iron', threshold: 4 },
        prose: ['Gained strength.'],
      },
    ],
    completion: { requires: 2, of: 2 },
    abandonmentTriggers: [],
    abandonmentCooldown: 5,
    selectionProse: [],
    milestoneProse: {},
    completionProse: [],
    abandonmentProse: [],
    ...overrides,
  });

  const makeActive = (overrides: Partial<ActiveAmbition> = {}): ActiveAmbition => ({
    templateId: 'test-ambition',
    priority: 'primary',
    status: 'active',
    assignedTick: 0,
    completedMilestones: [],
    ...overrides,
  });

  it('completes when all milestones are met', () => {
    const graph = makeTestGraph(); // actor1 has gold:3 (>=2), iron:5 (>=4)
    const template = makeTemplate();
    const active = makeActive();

    const result = evaluateAmbitionProgress(template, active, graph, 'actor1');
    expect(result.status).toBe('completed');
    expect(result.completedMilestones).toContain('wealth');
    expect(result.completedMilestones).toContain('strength');
  });

  it('stays active when not enough milestones met', () => {
    const graph = makeTestGraph();
    const template = makeTemplate({ completion: { requires: 3, of: 3 } });
    const active = makeActive();

    const result = evaluateAmbitionProgress(template, active, graph, 'actor1');
    expect(result.status).toBe('active');
    expect(result.completedMilestones).toContain('wealth');
    expect(result.completedMilestones).toContain('strength');
  });

  it('abandons when abandonment trigger fires', () => {
    const graph = makeTestGraph();
    const template = makeTemplate({
      abandonmentTriggers: [
        { condition: { type: 'agent_reach_below', reach: 'star', threshold: 1 } },
      ],
    });
    const active = makeActive();

    const result = evaluateAmbitionProgress(template, active, graph, 'actor1', 50);
    expect(result.status).toBe('abandoned');
    expect(result.resolvedTick).toBe(50);
  });

  it('abandonment takes priority over milestones', () => {
    const graph = makeTestGraph();
    const template = makeTemplate({
      abandonmentTriggers: [
        { condition: { type: 'agent_reach_below', reach: 'star', threshold: 1 } },
      ],
    });
    const active = makeActive();

    const result = evaluateAmbitionProgress(template, active, graph, 'actor1');
    expect(result.status).toBe('abandoned');
    expect(result.completedMilestones).toEqual([]);
  });

  it('preserves already completed milestones', () => {
    const graph = makeTestGraph();
    const template = makeTemplate({ completion: { requires: 3, of: 3 } });
    const active = makeActive({ completedMilestones: ['wealth'] });

    const result = evaluateAmbitionProgress(template, active, graph, 'actor1');
    expect(result.completedMilestones).toContain('wealth');
    expect(result.completedMilestones).toContain('strength');
  });

  it('returns active with empty milestones when nothing is met', () => {
    const graph = makeTestGraph();
    const template = makeTemplate({
      milestones: [
        {
          id: 'impossible',
          condition: { type: 'agent_reach_above', reach: 'iron', threshold: 999 },
          prose: ['Impossible.'],
        },
      ],
    });
    const active = makeActive();

    const result = evaluateAmbitionProgress(template, active, graph, 'actor1');
    expect(result.status).toBe('active');
    expect(result.completedMilestones).toEqual([]);
  });
});
