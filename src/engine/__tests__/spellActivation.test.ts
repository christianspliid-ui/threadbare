import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { checkPrerequisites, payCosts } from '../spellActivation';
import { decayConditions } from '../conditionDecay';
import { CONDITION_DURATIONS } from '../../data/condition-trait-content';
import type { SpellTemplate } from '../../types/effects';

// ─── Helpers ────────────────────────────────────────────────────────

function makeSpell(prereqs: SpellTemplate['prerequisites']): SpellTemplate {
  return {
    id: 'test-spell',
    name: 'Test Spell',
    tier: 'common',
    tags: [],
    sphereAffinity: 'force',
    flavorText: '',
    mechanicalSummary: '',
    prerequisites: prereqs,
    effects: [],
    cost: { type: 'essence', amount: 1 },
    cooldownTicks: 5,
    targeting: { mode: 'self' },
  };
}

function makeGraph(traitNodeId: string, traitName: string, traitTags: string[] = []) {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent_1', type: 'actor', name: 'Test Agent', properties: {} });
  graph.addNode({
    id: traitNodeId,
    type: 'trait',
    name: traitName,
    properties: { name: traitName, tags: traitTags },
  });
  graph.addEdge({
    id: 'e_trait',
    type: 'has_trait',
    source: 'agent_1',
    target: traitNodeId,
    properties: { level: 1 },
  });
  return graph;
}

// ─── checkPrerequisites — culture trait gating ───────────────────────

describe('checkPrerequisites culture trait gating', () => {
  it('matches on trait node ID', () => {
    const graph = makeGraph('trait.culture.culture_0', 'Daru', ['Daru']);
    const spell = makeSpell({ requiredTraits: ['trait.culture.culture_0'] });
    const result = checkPrerequisites(graph, 'agent_1', spell);
    expect(result.met).toBe(true);
  });

  it('matches on trait name (backward compat)', () => {
    const graph = makeGraph('trait.culture.culture_0', 'Daru', []);
    const spell = makeSpell({ requiredTraits: ['Daru'] });
    const result = checkPrerequisites(graph, 'agent_1', spell);
    expect(result.met).toBe(true);
  });

  it('matches on trait tag', () => {
    const graph = makeGraph('trait.culture.culture_0', 'Daru', ['nomadic', 'Daru']);
    const spell = makeSpell({ requiredTraits: ['nomadic'] });
    const result = checkPrerequisites(graph, 'agent_1', spell);
    expect(result.met).toBe(true);
  });

  it('fails when agent lacks required trait', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'agent_1', type: 'actor', name: 'Test Agent', properties: {} });
    const spell = makeSpell({ requiredTraits: ['trait.culture.culture_0'] });
    const result = checkPrerequisites(graph, 'agent_1', spell);
    expect(result.met).toBe(false);
    expect(result.reason).toContain('Missing required trait');
  });

  it('passes when no requiredTraits are specified', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'agent_1', type: 'actor', name: 'Test Agent', properties: {} });
    const spell = makeSpell({});
    const result = checkPrerequisites(graph, 'agent_1', spell);
    expect(result.met).toBe(true);
  });
});

// THR-1572 review — a condition_inflict price bears the condition's own term.
describe('payCosts condition_inflict carries the condition term', () => {
  it('an Exhausted price wears off through decayConditions; a row-less price stays indefinite', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'agent_1', type: 'actor', name: 'Test Agent', properties: {} });
    payCosts(graph, 'agent_1', { type: 'condition_inflict', template: 'exhausted' }, 100);
    payCosts(graph, 'agent_1', { type: 'condition_inflict', template: 'paranoia_whispers' }, 100);
    const bearing = (target: string) => graph.getEdgesByType('has_trait')
      .filter(e => e.source === 'agent_1' && e.target === target);
    expect(bearing('trait.condition.exhausted')[0]?.properties.ticksRemaining)
      .toBe(CONDITION_DURATIONS['trait.condition.exhausted']);
    expect(bearing('trait.condition.paranoia_whispers')[0]?.properties.ticksRemaining).toBeUndefined();
    for (let t = 1; t <= CONDITION_DURATIONS['trait.condition.exhausted']; t++) decayConditions(graph, 100 + t);
    expect(bearing('trait.condition.exhausted')).toHaveLength(0);
    expect(bearing('trait.condition.paranoia_whispers')).toHaveLength(1);
  });
});
