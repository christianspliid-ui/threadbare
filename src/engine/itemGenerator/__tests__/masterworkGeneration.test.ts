/**
 * A masterwork is made with an idea (THR-1570) — the mint, the christening seam and the
 * template carve.
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Done when, rows 2
 * and 4. The christening arms drive the **multi-tick completion arm**
 * (`advanceStrategicProjects` → `executeInstantMutation` → `christenCompletedWork`),
 * because the instant arm never christens and a test that completes instantly proves
 * nothing about the name (plan § Notes for the executor).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { advanceStrategicProjects } from '../../strategicActionLifecycle';
import { masterworkBand, mintMasterwork } from '../../strategicGraphOps';
import { graphContentCatalogs } from '../../contentQuery';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { mulberry32 } from '../../../lib/prng';
import { ARTIFACT_STORIED_TRAIT_ID } from '../../../data/artifact-trait-content';
import { contentKindsForId } from '../../../data/content-objects';
import type { GameState } from '../../../types/gameState';
import type { StrategicProjectRuntime } from '../../../types/strategicAction';
import type { GeneratedItemProvenance } from '../types';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'smith', type: 'actor', name: 'Tamsin Weir', properties: { actorType: 'individual', gender: 'female', domainCapabilities: { iron: 95, gold: 95, shadow: 95, veil: 95, heart: 95, eye: 95, stone: 95, star: 95 } } });
  graph.addNode({ id: 'company', type: 'actor', name: 'The Free Company', properties: { actorType: 'faction', factionDefId: 'mercenary_company' } });
  graph.addEdge({ id: 'member_smith', source: 'smith', target: 'company', type: 'member_of', properties: { rank: 0.5 } });
  graph.addNode({ id: 'saltmere', type: 'location', name: 'Saltmere', properties: { locationSubtype: 'town', hexCol: 4, hexRow: 4 } });
  graph.addEdge({ id: 'at_smith', source: 'smith', target: 'saltmere', type: 'located_at', properties: {} });
  return graph;
}

function state(graph: WorldGraph, projects: StrategicProjectRuntime[]): GameState {
  return {
    tick: 10, seed: 42, graph, tickEvents: [], recentEvents: [], chronicleEntries: [],
    ascendantId: 'ascendant', unifiedActions: [], actionsInProgress: [],
    strategicState: { projects, controls: [], history: [] },
  } as unknown as GameState;
}

describe('mintMasterwork with the item generator (THR-1570)', () => {
  it('mints a gen_masterwork_* item with effects, a core-grown name, a maker and a story', () => {
    const graph = world();
    const r = mintMasterwork(graph, 'smith', 'masterwork', 12, 2, { worldSeed: 42, outcomeBand: 'success' });
    expect(r.success).toBe(true);
    expect(r.createdId).toBe('gen_masterwork_smith_12');
    const node = graph.getNode(r.createdId!)!;
    expect(node.properties.origin).toBe('generated');
    expect((node.properties.effects as unknown[]).length).toBeGreaterThan(0);
    expect(node.name).not.toMatch(/masterwork/i);
    expect(node.properties.craftedBy).toBe('smith');
    expect(String(node.properties.flavorText)).toContain('Tamsin Weir');
    const g = node.properties.generated as GeneratedItemProvenance;
    expect(g.origin).toBe('masterwork');
    expect(g.band).toBe(2);
    expect(g.seedKey).toBe('gen_item:42:masterwork:smith:12');
    // Held by its maker, born Storied at level 1.
    expect(graph.getEdge('possesses_smith_gen_masterwork_smith_12')).toBeDefined();
    expect((graph.getEdge(`e.has_trait.${r.createdId}.${ARTIFACT_STORIED_TRAIT_ID}`)?.properties as { level?: number }).level ?? 1).toBe(1);
    // Named as an Item by the registry.
    expect(contentKindsForId(r.createdId!).map(k => k.id)).toContain('item_template');
  });

  it('a critical success makes a Mythic thing; nothing makes a Legendary', () => {
    expect(masterworkBand('critical_success', 2)).toBe(3);
    expect(masterworkBand('success', 2)).toBe(2);
    expect(masterworkBand(undefined, 2)).toBe(2);
    expect(masterworkBand('critical_success', 4)).toBe(3);
    const graph = world();
    const r = mintMasterwork(graph, 'smith', 'masterwork', 13, 2, { worldSeed: 42, outcomeBand: 'critical_success' });
    expect((graph.getNode(r.createdId!)!.properties.generated as GeneratedItemProvenance).band).toBe(3);
  });

  it('without a world seed it writes exactly the plain masterwork it always has', () => {
    const graph = world();
    const r = mintMasterwork(graph, 'smith', 'blade', 12);
    expect(r.createdId).toBe('artifact_masterwork_smith_12');
    const node = graph.getNode(r.createdId!)!;
    expect(node.properties.effects).toEqual([]);
    expect(node.properties.origin).toBeUndefined();
  });

  it('is deterministic: the same seed, maker and tick make the same thing', () => {
    const a = world(); const b = world();
    mintMasterwork(a, 'smith', 'masterwork', 20, 2, { worldSeed: 7 });
    mintMasterwork(b, 'smith', 'masterwork', 20, 2, { worldSeed: 7 });
    const na = a.getNode('gen_masterwork_smith_20')!; const nb = b.getNode('gen_masterwork_smith_20')!;
    expect(na.name).toBe(nb.name);
    expect(JSON.stringify(na.properties)).toBe(JSON.stringify(nb.properties));
  });

  it("a second masterwork in the same world leans to a different idea (the world's own repeat decay)", () => {
    const graph = world();
    const ids: string[] = [];
    for (let t = 30; t < 36; t++) ids.push(mintMasterwork(graph, 'smith', 'masterwork', t, 2, { worldSeed: 42 }).createdId!);
    const cores = ids.map(id => (graph.getNode(id)!.properties.generated as GeneratedItemProvenance).coreId);
    expect(new Set(cores).size).toBeGreaterThan(1);
    const names = ids.map(id => graph.getNode(id)!.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('the name survives christening, on both mint paths (multi-tick arm)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  const paths: Array<[string, Partial<StrategicProjectRuntime>]> = [
    ['strategic_craft_masterwork', { templateId: 'strategic_craft_masterwork' }],
    ['cell.create.item', { templateId: 'cell.create.item', objectTypeId: 'item', objectHandle: { kind: 'node', nodeId: 'saltmere' } as StrategicProjectRuntime['objectHandle'] }],
  ];

  for (const [label, over] of paths) {
    it(`${label}: node name = item.generated name = christenedName`, () => {
      const graph = world();
      const project = {
        projectId: `proj_${label}`, actorId: 'smith', ambitionId: 'ambition_forge', verb: 'create',
        behaviorFamily: 'builder', targetNodeId: 'saltmere', progress: 7, progressRequired: 8,
        startedTick: 2, lastProgressTick: 9, status: 'active',
        ...over,
      } as StrategicProjectRuntime;
      // A cell rolls at its checkpoints and may halt; drive it tick by tick, as the
      // world would, until it completes (bounded).
      const s = state(graph, [project]);
      // A master smith (every reach 95), so the checkpoint rolls land.
      const rng = mulberry32(42);
      let result = advanceStrategicProjects(s, graph, 10, rng);
      for (let tick = 11; tick < 200 && result.strategicState.projects[0].status === 'active'; tick++) {
        s.strategicState = result.strategicState;
        (s as { tick: number }).tick = tick;
        result = advanceStrategicProjects(s, graph, tick, rng);
      }

      const traces = getTraces();
      const generated = traces.filter(t => t.category === 'item.generated') as unknown as { itemId: string; name: string }[];
      const fallbacks = traces.filter(t => t.category === 'item.generate_fallback');
      expect(fallbacks, 'the generator never gave up').toEqual([]);
      expect(generated, `${label} minted one generated item`).toHaveLength(1);
      const node = graph.getNode(generated[0].itemId)!;
      expect(node.name).toBe(generated[0].name);

      const completion = traces.find(t => t.category === 'strategic_project_progress' && (t as { status?: string }).status === 'completed') as { christenedName?: string } | undefined;
      expect(completion?.christenedName).toBe(generated[0].name);
      expect(result.strategicState.projects[0].status).toBe('completed');
    });
  }
});

describe('instances are not templates (the carve)', () => {
  it('a reward draw on a world holding a masterwork never offers the masterwork', () => {
    const graph = world();
    const plain = mintMasterwork(graph, 'smith', 'blade', 12).createdId!;
    const generated = mintMasterwork(graph, 'smith', 'masterwork', 13, 2, { worldSeed: 42 }).createdId!;
    graph.addNode({ id: 'reward_test_charm', type: 'artifact', name: 'Test Charm', properties: { tier: 1, subcategory: 'relics_talismans', tags: ['#trinket'], mechanicalSummary: '', lossCondition: 'stealable' } });
    const offered = graphContentCatalogs(graph).candidates('item_template').map(c => c.id);
    expect(offered).toContain('reward_test_charm');
    expect(offered).not.toContain(plain);
    expect(offered).not.toContain(generated);
  });
});
