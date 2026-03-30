import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { buildNarrativeContext } from '../contextBuilder';
import type { NarrativeEvent } from '../../types/narrative';

function buildRichGraph(): WorldGraph {
  const g = new WorldGraph();

  // Cosmology
  g.addNode({ id: 'sphere-force', type: 'cosmology', name: 'Force', properties: { sphereType: 'creation', sphereName: 'force' } });
  g.addNode({ id: 'sphere-mind', type: 'cosmology', name: 'Mind', properties: { sphereType: 'creation', sphereName: 'mind' } });
  g.addNode({ id: 'found-chaos', type: 'cosmology', name: 'Chaos', properties: { sphereType: 'foundation', sphereName: 'chaos' } });
  g.addNode({ id: 'found-order', type: 'cosmology', name: 'Order', properties: { sphereType: 'foundation', sphereName: 'order' } });

  // Region with 3 locations
  g.addNode({ id: 'loc-fort', type: 'location', name: 'Iron Fortress', properties: { terrain: 'mountain' } });
  g.addNode({ id: 'loc-marsh', type: 'location', name: 'Blightmarsh', properties: { terrain: 'swamp' } });
  g.addNode({ id: 'loc-tower', type: 'location', name: 'Ivory Tower', properties: { terrain: 'plains' } });
  g.addEdge({ id: 'adj-1', source: 'loc-fort', target: 'loc-marsh', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj-2', source: 'loc-marsh', target: 'loc-tower', type: 'adjacent', properties: {} });

  // Protagonist: tragic_hero at the fort, force-aligned, chaos-aligned
  g.addNode({ id: 'hero', type: 'actor', name: 'Kaelen', properties: { actorType: 'individual', narrativeArchetype: 'tragic_hero' } });
  g.addEdge({ id: 'at-hero', source: 'hero', target: 'loc-fort', type: 'located_at', properties: {} });
  g.addEdge({ id: 'align-hero-force', source: 'hero', target: 'sphere-force', type: 'aligned_with', properties: {} });
  g.addEdge({ id: 'align-hero-chaos', source: 'hero', target: 'found-chaos', type: 'aligned_with', properties: {} });

  // Antagonist: schemer at marsh, mind-aligned, order-aligned
  g.addNode({ id: 'schemer', type: 'actor', name: 'Vex', properties: { actorType: 'individual', narrativeArchetype: 'schemer' } });
  g.addEdge({ id: 'at-schemer', source: 'schemer', target: 'loc-marsh', type: 'located_at', properties: {} });
  g.addEdge({ id: 'align-schemer-mind', source: 'schemer', target: 'sphere-mind', type: 'aligned_with', properties: {} });
  g.addEdge({ id: 'align-schemer-order', source: 'schemer', target: 'found-order', type: 'aligned_with', properties: {} });

  // Artifact possessed by hero
  g.addNode({ id: 'art-blade', type: 'artifact', name: 'Thornblade', properties: {} });
  g.addEdge({ id: 'poss-blade', source: 'hero', target: 'art-blade', type: 'possesses', properties: {} });

  // Faction
  g.addNode({ id: 'fac-iron', type: 'actor', name: 'Iron Brotherhood', properties: { actorType: 'faction' } });
  g.addEdge({ id: 'mem-hero', source: 'hero', target: 'fac-iron', type: 'member_of', properties: {} });

  // Distant character (at tower, 2 hops away)
  g.addNode({ id: 'sage', type: 'actor', name: 'Alethea', properties: { actorType: 'individual', narrativeArchetype: 'seeker' } });
  g.addEdge({ id: 'at-sage', source: 'sage', target: 'loc-tower', type: 'located_at', properties: {} });

  return g;
}

describe('Context Builder Integration', () => {
  const graph = buildRichGraph();

  it('produces world-aware context for notable event', () => {
    const event: NarrativeEvent = {
      id: 'int-1', tier: 'notable', eventType: 'contested_action',
      description: 'Kaelen clashes with unseen forces', tick: 50,
      actorId: 'hero', sphere: 'force',
    };
    const ctx = buildNarrativeContext(event, graph, 'tragic_hero');

    expect(ctx.contextObjects.length).toBeGreaterThanOrEqual(1);
    expect(ctx.contextObjects.length).toBeLessThanOrEqual(3);

    // Should find the schemer at adjacent marsh
    const hasSchemer = ctx.contextObjects.some(o => o.nodeId === 'schemer');
    expect(hasSchemer).toBe(true);
  });

  it('scores high tension for chaos hero vs order schemer', () => {
    const event: NarrativeEvent = {
      id: 'int-2', tier: 'notable', eventType: 'contested_action',
      description: 'test', tick: 51, actorId: 'hero', sphere: 'force',
    };
    const ctx = buildNarrativeContext(event, graph, 'tragic_hero');

    // Vex (schemer) should have high tension: foundation (chaos↔order=5) + creation (force↔mind=3)
    const vex = ctx.contextObjects.find(o => o.nodeId === 'schemer');
    if (vex) {
      expect(vex.relevanceScore).toBeGreaterThan(5);
    }
    expect(ctx.oppositionSummary.tensionScore).toBeGreaterThan(0);
  });

  it('chronicle tier reaches distant characters', () => {
    const event: NarrativeEvent = {
      id: 'int-3', tier: 'chronicle', eventType: 'actor_death',
      description: 'death of a hero', tick: 52, actorId: 'hero',
    };
    const ctx = buildNarrativeContext(event, graph, 'tragic_hero');

    // Sage at tower (2 hops) should be reachable for chronicle
    const hasSage = ctx.contextObjects.some(o => o.nodeId === 'sage');
    expect(hasSage).toBe(true);
  });

  it('respects category diversity', () => {
    const event: NarrativeEvent = {
      id: 'int-4', tier: 'chronicle', eventType: 'contested_action',
      description: 'epic clash', tick: 53, actorId: 'hero', sphere: 'force',
    };
    const ctx = buildNarrativeContext(event, graph, 'tragic_hero');

    const categoryCounts: Record<string, number> = {};
    for (const obj of ctx.contextObjects) {
      categoryCounts[obj.category] = (categoryCounts[obj.category] ?? 0) + 1;
    }
    for (const count of Object.values(categoryCounts)) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });
});
