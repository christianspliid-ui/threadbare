import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { checkPrerequisites } from '../spellActivation';
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
