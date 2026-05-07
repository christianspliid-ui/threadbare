import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import {
  getGatedDownstream,
  getGatingPrerequisites,
  getEnabledTemplates,
  getSpawnSources,
  getTemplatesSpawnedFrom,
  isTemplateUnlocked,
} from '../encounterTemplateGraph';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeTemplateNode(id: string, templateId: string) {
  return {
    id,
    type: 'encounter_template' as const,
    name: `Template ${id}`,
    properties: { template_id: templateId, category: 'social', rarity_tier: 1, intrinsic_tier: 'shaping' },
  };
}

function makeLocationNode(id: string) {
  return { id, type: 'location' as const, name: `Location ${id}`, properties: {} };
}

function makeEdge(id: string, source: string, target: string, type: string) {
  return { id, type: type as any, source, target, properties: {} };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getGatedDownstream', () => {
  it('returns templates unlocked by completing the source', () => {
    const graph = new WorldGraph();
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    graph.addNode(makeTemplateNode('t2', 'enc-002'));
    graph.addNode(makeTemplateNode('t3', 'enc-003'));
    graph.addEdge(makeEdge('e1', 't1', 't2', 'gates_to'));
    graph.addEdge(makeEdge('e2', 't1', 't3', 'gates_to'));

    const downstream = getGatedDownstream(graph, 't1');
    const ids = downstream.map(n => n.id);
    expect(ids).toContain('t2');
    expect(ids).toContain('t3');
    expect(ids).not.toContain('t1');
  });

  it('returns empty when node has no outgoing gates_to edges', () => {
    const graph = new WorldGraph();
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    expect(getGatedDownstream(graph, 't1')).toEqual([]);
  });
});

describe('getGatingPrerequisites', () => {
  it('returns prerequisites that must complete before target is eligible', () => {
    const graph = new WorldGraph();
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    graph.addNode(makeTemplateNode('t2', 'enc-002'));
    graph.addNode(makeTemplateNode('t3', 'enc-003'));
    graph.addEdge(makeEdge('e1', 't1', 't3', 'gates_to'));
    graph.addEdge(makeEdge('e2', 't2', 't3', 'gates_to'));

    const prereqs = getGatingPrerequisites(graph, 't3');
    const ids = prereqs.map(n => n.id);
    expect(ids).toContain('t1');
    expect(ids).toContain('t2');
  });

  it('returns empty for a template with no prerequisites', () => {
    const graph = new WorldGraph();
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    expect(getGatingPrerequisites(graph, 't1')).toEqual([]);
  });
});

describe('getEnabledTemplates', () => {
  it('returns templates softly enabled by the source', () => {
    const graph = new WorldGraph();
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    graph.addNode(makeTemplateNode('t2', 'enc-002'));
    graph.addEdge(makeEdge('e1', 't1', 't2', 'enables'));

    const enabled = getEnabledTemplates(graph, 't1');
    expect(enabled.map(n => n.id)).toEqual(['t2']);
  });

  it('returns empty when there are no enables edges', () => {
    const graph = new WorldGraph();
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    expect(getEnabledTemplates(graph, 't1')).toEqual([]);
  });
});

describe('getSpawnSources / getTemplatesSpawnedFrom', () => {
  it('getSpawnSources returns the nodes a template spawns from', () => {
    const graph = new WorldGraph();
    const loc = makeLocationNode('loc-1');
    graph.addNode(loc);
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    graph.addEdge(makeEdge('e1', 't1', 'loc-1', 'spawns_from'));

    const sources = getSpawnSources(graph, 't1');
    expect(sources.map(n => n.id)).toEqual(['loc-1']);
  });

  it('getTemplatesSpawnedFrom returns templates that spawn from a given node', () => {
    const graph = new WorldGraph();
    graph.addNode(makeLocationNode('loc-1'));
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    graph.addNode(makeTemplateNode('t2', 'enc-002'));
    graph.addEdge(makeEdge('e1', 't1', 'loc-1', 'spawns_from'));
    graph.addEdge(makeEdge('e2', 't2', 'loc-1', 'spawns_from'));

    const templates = getTemplatesSpawnedFrom(graph, 'loc-1');
    const ids = templates.map(n => n.id);
    expect(ids).toContain('t1');
    expect(ids).toContain('t2');
  });
});

describe('isTemplateUnlocked', () => {
  it('returns true when a template has no prerequisites', () => {
    const graph = new WorldGraph();
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    expect(isTemplateUnlocked(graph, 't1', new Set())).toBe(true);
  });

  it('returns false when prerequisites are not in completedTemplateIds', () => {
    const graph = new WorldGraph();
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    graph.addNode(makeTemplateNode('t2', 'enc-002'));
    graph.addEdge(makeEdge('e1', 't1', 't2', 'gates_to'));

    expect(isTemplateUnlocked(graph, 't2', new Set())).toBe(false);
    expect(isTemplateUnlocked(graph, 't2', new Set(['enc-001']))).toBe(true);
  });

  it('requires all prerequisites, not just one', () => {
    const graph = new WorldGraph();
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    graph.addNode(makeTemplateNode('t2', 'enc-002'));
    graph.addNode(makeTemplateNode('t3', 'enc-003'));
    graph.addEdge(makeEdge('e1', 't1', 't3', 'gates_to'));
    graph.addEdge(makeEdge('e2', 't2', 't3', 'gates_to'));

    expect(isTemplateUnlocked(graph, 't3', new Set(['enc-001']))).toBe(false);
    expect(isTemplateUnlocked(graph, 't3', new Set(['enc-001', 'enc-002']))).toBe(true);
  });

  it('returns false when a prerequisite node has no template_id', () => {
    const graph = new WorldGraph();
    // Malformed prerequisite node with no template_id
    graph.addNode({ id: 'bad', type: 'encounter_template', name: 'bad', properties: {} });
    graph.addNode(makeTemplateNode('t2', 'enc-002'));
    graph.addEdge(makeEdge('e1', 'bad', 't2', 'gates_to'));

    expect(isTemplateUnlocked(graph, 't2', new Set(['anything']))).toBe(false);
  });
});
