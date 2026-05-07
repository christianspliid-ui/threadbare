import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import { generateGraphEncounterCandidates } from '../generateEncounterCandidates';

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

describe('generateGraphEncounterCandidates — backward compat', () => {
  it('returns empty array when no encounter_template nodes exist (array-scored path)', () => {
    const graph = new WorldGraph();
    graph.addNode(makeLocationNode('loc-1'));

    const candidates = generateGraphEncounterCandidates(graph, 'loc-1');
    expect(candidates).toEqual([]);
  });

  it('returns empty when template nodes exist but none spawn from the location', () => {
    const graph = new WorldGraph();
    graph.addNode(makeLocationNode('loc-1'));
    graph.addNode(makeLocationNode('loc-2'));
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    graph.addEdge(makeEdge('e1', 't1', 'loc-2', 'spawns_from'));

    const candidates = generateGraphEncounterCandidates(graph, 'loc-1');
    expect(candidates).toEqual([]);
  });
});

describe('generateGraphEncounterCandidates — gate unlocking', () => {
  it('returns unlocked templates that spawn from the location', () => {
    const graph = new WorldGraph();
    graph.addNode(makeLocationNode('loc-1'));
    graph.addNode(makeTemplateNode('t1', 'enc-001'));
    graph.addEdge(makeEdge('e1', 't1', 'loc-1', 'spawns_from'));

    const candidates = generateGraphEncounterCandidates(graph, 'loc-1');
    expect(candidates).toHaveLength(1);
    expect(candidates[0].templateId).toBe('enc-001');
    expect(candidates[0].templateNodeId).toBe('t1');
    expect(candidates[0].spawnSourceId).toBe('loc-1');
  });

  it('excludes templates that are gated behind unfinished prerequisites', () => {
    const graph = new WorldGraph();
    graph.addNode(makeLocationNode('loc-1'));
    graph.addNode(makeTemplateNode('t1', 'enc-001')); // prerequisite
    graph.addNode(makeTemplateNode('t2', 'enc-002')); // gated
    graph.addEdge(makeEdge('e1', 't2', 'loc-1', 'spawns_from'));
    graph.addEdge(makeEdge('e2', 't1', 't2', 'gates_to'));

    // enc-001 not yet completed
    const candidatesLocked = generateGraphEncounterCandidates(graph, 'loc-1', new Set());
    expect(candidatesLocked).toHaveLength(0);

    // enc-001 completed — t2 unlocked
    const candidatesUnlocked = generateGraphEncounterCandidates(graph, 'loc-1', new Set(['enc-001']));
    expect(candidatesUnlocked).toHaveLength(1);
    expect(candidatesUnlocked[0].templateId).toBe('enc-002');
  });

  it('includes ungated templates alongside gated ones when prerequisites met', () => {
    const graph = new WorldGraph();
    graph.addNode(makeLocationNode('loc-1'));
    graph.addNode(makeTemplateNode('t1', 'enc-001')); // always available
    graph.addNode(makeTemplateNode('t2', 'enc-002')); // prerequisite
    graph.addNode(makeTemplateNode('t3', 'enc-003')); // gated on t2
    graph.addEdge(makeEdge('e1', 't1', 'loc-1', 'spawns_from'));
    graph.addEdge(makeEdge('e2', 't3', 'loc-1', 'spawns_from'));
    graph.addEdge(makeEdge('e3', 't2', 't3', 'gates_to'));

    const candidates = generateGraphEncounterCandidates(graph, 'loc-1', new Set(['enc-002']));
    const ids = candidates.map(c => c.templateId);
    expect(ids).toContain('enc-001');
    expect(ids).toContain('enc-003');
    expect(ids).not.toContain('enc-002');
  });

  it('skips nodes with missing template_id gracefully', () => {
    const graph = new WorldGraph();
    graph.addNode(makeLocationNode('loc-1'));
    graph.addNode({ id: 'bad', type: 'encounter_template', name: 'bad', properties: {} });
    graph.addEdge(makeEdge('e1', 'bad', 'loc-1', 'spawns_from'));

    const candidates = generateGraphEncounterCandidates(graph, 'loc-1');
    expect(candidates).toHaveLength(0);
  });
});
