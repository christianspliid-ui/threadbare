import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { TemporalController } from '../temporal';
import { assignTrait } from '../traits';
import { computeCapability } from '../domainCapability';
import { computeProbability, resolveAction } from '../resolution';
import { runSelectionPipeline } from '../agentSelection';
import type { ActionCandidate, AxiologicalProfile } from '../../types/agent';

describe('Integration: Headless Simulation Loop', () => {
  it('runs a complete tick → resolve → select cycle', () => {
    // 1. Build world
    const graph = new WorldGraph();

    // Locations
    graph.addNode({ id: 'world', type: 'location', name: 'World', properties: { locationType: 'world' } });
    graph.addNode({ id: 'region.north', type: 'location', name: 'North', properties: { locationType: 'region' } });
    graph.addNode({ id: 'loc.fortress', type: 'location', name: 'Iron Gate', properties: { locationType: 'location', difficulty: 0.5 } });
    graph.addEdge({ id: 'e.w.rn', source: 'world', target: 'region.north', type: 'contains', properties: {} });
    graph.addEdge({ id: 'e.rn.f', source: 'region.north', target: 'loc.fortress', type: 'contains', properties: {} });

    // Actor with origin trait
    graph.addNode({ id: 'actor.thorin', type: 'actor', name: 'Thorin', properties: {
      actorType: 'individual',
      axiologicalProfile: {
        loyalty_ambition: 0.7,
        courage_prudence: 0.5,
        mercy_ruthlessness: -0.3,
        honesty_cunning: 0.0,
        sacrifice_survival: -0.1,
        loyalty_ambition: -0.5,
        tradition_novelty: 0.2,
        preservation_transformation: 0.4,
        mercy_ruthlessness: 0.1,
        asceticism_extravagance: -0.2,
      } satisfies AxiologicalProfile,
    }});
    graph.addEdge({ id: 'e.thorin.loc', source: 'actor.thorin', target: 'loc.fortress', type: 'located_at', properties: {} });

    // Origin trait
    graph.addNode({
      id: 'trait.origin.mountainborn', type: 'trait', name: 'Mountainborn',
      properties: {
        subcategory: 'innate', maxLevel: 1, importance: 1.0, visibility: 'public',
        domainContributions: { iron: 3, gold: 3, stone: 4, star: 2, flesh: 2, heart: 1, eye: 1 },
        tags: [], flavorText: 'Born of the mountain.',
      },
    });
    assignTrait(graph, 'actor.thorin', 'trait.origin.mountainborn', { tick: 0, source: 'origin' });

    // 2. Start an action
    const controller = new TemporalController(graph);
    controller.startAction({
      actionId: 'act.siege.1',
      actorId: 'actor.thorin',
      templateId: 'template.siege',
      targetId: 'loc.fortress',
      domain: 'iron',
      startTick: 0,
      duration: 3,
      progress: 0,
    });

    // 3. Tick forward to completion
    controller.tick(); // progress 1
    controller.tick(); // progress 2
    const result = controller.tick(); // progress 3 → completed
    expect(result.completedActions).toContain('act.siege.1');

    // 4. Resolve the completed action
    const ironCapability = computeCapability(graph, 'actor.thorin', 'iron');
    expect(ironCapability).toBeGreaterThan(0);

    const probability = computeProbability(ironCapability, 0.05, 0.5, 0.0);
    const resolution = resolveAction(probability, 25); // deterministic roll = 25
    expect(['critical_success', 'success', 'failure', 'critical_failure']).toContain(resolution.outcome);

    // 5. If success, apply trait (simulate a scar trait gain)
    if (resolution.outcome === 'success' || resolution.outcome === 'critical_success') {
      graph.addNode({
        id: 'trait.scar.siege_veteran', type: 'trait', name: 'Siege Veteran',
        properties: {
          subcategory: 'scar', maxLevel: 1, importance: 0.6, visibility: 'public',
          domainContributions: { iron: 1, stone: 1 },
          tags: [], flavorText: 'Survived the siege of Iron Gate.',
        },
      });
      assignTrait(graph, 'actor.thorin', 'trait.scar.siege_veteran', { tick: 3, source: 'act.siege.1' });
    }

    // 6. Run selection pipeline for next action
    const nextCandidates: ActionCandidate[] = [
      { templateId: 'patrol', targetId: 'region.north', domain: 'iron', score: 0, motivations: ['courage_prudence'] },
      { templateId: 'trade', targetId: 'loc.fortress', domain: 'gold', score: 0, motivations: ['asceticism_extravagance'] },
      { templateId: 'recruit', targetId: 'loc.fortress', domain: 'heart', score: 0, motivations: ['loyalty_ambition', 'preservation_transformation'] },
    ];

    const selectionResult = runSelectionPipeline(
      graph, 'actor.thorin', nextCandidates,
      { topN: 3, survivalThreshold: 0.8 },
    );
    expect(selectionResult.selected).toBeDefined();
    expect(selectionResult.candidates.length).toBeGreaterThan(0);

    // 7. Verify the graph has been mutated correctly
    const stats = graph.getStats();
    expect(stats.nodeCount).toBeGreaterThanOrEqual(5); // at least world, region, fortress, actor, 2 traits
  });
});
