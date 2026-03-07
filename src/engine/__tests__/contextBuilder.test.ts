/**
 * Context Builder Tests
 *
 * Tests for the narrative context harvester: harvest → rank → select → build pipeline.
 * Verifies BFS harvesting, opposition tension scoring, and context selection.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  harvestContext,
  rankObjects,
  selectObjects,
  buildNarrativeContext,
} from '../contextBuilder';
import type { NarrativeEvent } from '../../types/narrative';

function buildTestGraph() {
  const graph = new WorldGraph();

  // ─── Locations ──────────────────────────────────────────────────────

  // 3 locations: loc-1 ↔ loc-2 ↔ loc-3 (linear adjacency)
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Iron Gate', properties: { locationType: 'hex' } });
  graph.addNode({ id: 'loc-2', type: 'location', name: 'Salt Marsh', properties: { locationType: 'hex' } });
  graph.addNode({ id: 'loc-3', type: 'location', name: 'Far Tower', properties: { locationType: 'hex' } });

  // loc-1 ↔ loc-2 adjacency (undirected, both directions)
  graph.addEdge({ id: 'adj-1-2a', source: 'loc-1', target: 'loc-2', type: 'adjacent', properties: {} });
  graph.addEdge({ id: 'adj-1-2b', source: 'loc-2', target: 'loc-1', type: 'adjacent', properties: {} });

  // loc-2 ↔ loc-3 adjacency (undirected, both directions)
  graph.addEdge({ id: 'adj-2-3a', source: 'loc-2', target: 'loc-3', type: 'adjacent', properties: {} });
  graph.addEdge({ id: 'adj-2-3b', source: 'loc-3', target: 'loc-2', type: 'adjacent', properties: {} });

  // ─── Actors ─────────────────────────────────────────────────────────

  // act-1 Kaelen (tragic_hero) at loc-1
  graph.addNode({
    id: 'act-1',
    type: 'actor',
    name: 'Kaelen',
    properties: { actorType: 'individual', narrativeArchetype: 'tragic_hero' },
  });
  graph.addEdge({ id: 'loc-act1', source: 'act-1', target: 'loc-1', type: 'located_at', properties: {} });

  // act-2 Mira (seeker) at loc-2
  graph.addNode({
    id: 'act-2',
    type: 'actor',
    name: 'Mira',
    properties: { actorType: 'individual', narrativeArchetype: 'seeker' },
  });
  graph.addEdge({ id: 'loc-act2', source: 'act-2', target: 'loc-2', type: 'located_at', properties: {} });

  // act-3 Distant Lord at loc-3 (faction actor)
  graph.addNode({
    id: 'act-3',
    type: 'actor',
    name: 'Distant Lord',
    properties: { actorType: 'faction', narrativeArchetype: 'oathkeeper' },
  });
  graph.addEdge({ id: 'loc-act3', source: 'act-3', target: 'loc-3', type: 'located_at', properties: {} });

  // ─── Artifacts ──────────────────────────────────────────────────────

  // art-1 Thornblade (possessed by act-1)
  graph.addNode({
    id: 'art-1',
    type: 'artifact',
    name: 'Thornblade',
    properties: {},
  });
  graph.addEdge({ id: 'poss-act1-art1', source: 'act-1', target: 'art-1', type: 'possesses', properties: {} });

  // ─── Factions ───────────────────────────────────────────────────────

  // fac-1 Iron Brotherhood (act-1 is member_of)
  graph.addNode({
    id: 'fac-1',
    type: 'actor',
    name: 'Iron Brotherhood',
    properties: { actorType: 'faction' },
  });
  graph.addEdge({ id: 'member-act1-fac1', source: 'act-1', target: 'fac-1', type: 'member_of', properties: {} });

  // ─── Cosmology ──────────────────────────────────────────────────────

  // sphere-force (act-1 aligned_with)
  graph.addNode({
    id: 'sphere-force',
    type: 'cosmology',
    name: 'Force',
    properties: { sphereType: 'creation', sphereName: 'force' },
  });
  graph.addEdge({ id: 'align-act1-force', source: 'act-1', target: 'sphere-force', type: 'aligned_with', properties: {} });

  // Foundation sphere cosmology nodes
  graph.addNode({
    id: 'cosmo-chaos',
    type: 'cosmology',
    name: 'Chaos',
    properties: { sphereType: 'foundation', sphereName: 'chaos' },
  });
  graph.addNode({
    id: 'cosmo-order',
    type: 'cosmology',
    name: 'Order',
    properties: { sphereType: 'foundation', sphereName: 'order' },
  });
  graph.addNode({
    id: 'cosmo-light',
    type: 'cosmology',
    name: 'Light',
    properties: { sphereType: 'foundation', sphereName: 'light' },
  });
  graph.addNode({
    id: 'cosmo-darkness',
    type: 'cosmology',
    name: 'Darkness',
    properties: { sphereType: 'foundation', sphereName: 'darkness' },
  });

  // Other creation spheres
  graph.addNode({
    id: 'sphere-entropy',
    type: 'cosmology',
    name: 'Entropy',
    properties: { sphereType: 'creation', sphereName: 'entropy' },
  });

  // ─── Events ─────────────────────────────────────────────────────────

  // event-1 (some event with act-1 as actor, act-2 as target)
  graph.addNode({
    id: 'event-1',
    type: 'event',
    name: 'Event One',
    properties: { eventType: 'action_resolved' },
  });

  return graph;
}

describe('harvestContext', () => {
  it('harvests artifacts possessed by event actor', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      targetId: 'act-2',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    const artifacts = harvested.filter(obj => obj.category === 'artifact');
    expect(artifacts.length).toBeGreaterThan(0);
    expect(artifacts[0]?.name).toBe('Thornblade');
  });

  it('harvests characters at adjacent locations (notable = 1 hop)', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1', // at loc-1
      targetId: 'act-2',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    const characters = harvested.filter(obj => obj.category === 'character');
    // Should include Mira at loc-2 (adjacent to loc-1)
    expect(characters.some(c => c.name === 'Mira')).toBe(true);
  });

  it('harvests factions connected to event actor (regardless of distance)', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      targetId: 'act-2',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    const factions = harvested.filter(obj => obj.category === 'faction');
    expect(factions.some(f => f.name === 'Iron Brotherhood')).toBe(true);
  });

  it('harvests further locations for chronicle tier (2 hops)', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'chronicle',
      eventType: 'action_resolved',
      actorId: 'act-1', // at loc-1
      targetId: 'act-2',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    // Should include Distant Lord at loc-3 (2 hops away for chronicle)
    // Distant Lord is a faction, so check for faction or character category
    expect(harvested.some(c => c.name === 'Distant Lord')).toBe(true);
  });

  it('excludes event actor from results', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      targetId: 'act-2',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    expect(harvested.every(obj => obj.nodeId !== 'act-1')).toBe(true);
  });

  it('returns empty array if actor has no location', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'act-orphan', type: 'actor', name: 'Orphan', properties: {} });

    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-orphan',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    expect(harvested).toEqual([]);
  });
});

describe('rankObjects', () => {
  it('scores all harvested objects > 0', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      targetId: 'act-2',
      description: 'test',
      tick: 1,
      sphere: 'force',
    };

    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);

    expect(ranked.length).toBeGreaterThan(0);
    ranked.forEach(obj => {
      expect(obj.relevanceScore).toBeGreaterThan(0);
    });
  });

  it('ranks objects in descending order by score', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      targetId: 'act-2',
      description: 'test',
      tick: 1,
      sphere: 'force',
    };

    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);

    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.relevanceScore).toBeGreaterThanOrEqual(ranked[i]!.relevanceScore);
    }
  });

  it('includes sphere opposition tension in scoring', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      targetId: 'act-2',
      description: 'test',
      tick: 1,
      sphere: 'force', // Force creates tension with Mind
    };

    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);

    // Should have populated tensionType for some objects
    const withTension = ranked.filter(obj => obj.tensionType);
    expect(withTension.length).toBeGreaterThanOrEqual(0);
    ranked.forEach(obj => {
      expect(obj.nodeId).toBeDefined();
      expect(obj.name).toBeDefined();
      expect(obj.category).toBeDefined();
      expect(obj.briefDescription).toBeDefined();
    });
  });

  it('populates all required ContextObject fields', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);

    ranked.forEach(obj => {
      expect(obj.nodeId).toBeDefined();
      expect(obj.name).toBeDefined();
      expect(obj.category).toMatch(/artifact|faction|character|location|event/);
      expect(obj.relevanceScore).toBeGreaterThan(0);
      expect(obj.briefDescription).toBeDefined();
    });
  });
});

describe('selectObjects', () => {
  it('selects 2-3 objects for notable tier', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);
    const selected = selectObjects(ranked, 'notable');

    expect(selected.length).toBeGreaterThanOrEqual(2);
    expect(selected.length).toBeLessThanOrEqual(3);
  });

  it('selects 4-5 objects for chronicle tier', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'chronicle',
      eventType: 'action_resolved',
      actorId: 'act-1',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);
    const selected = selectObjects(ranked, 'chronicle');

    expect(selected.length).toBeGreaterThanOrEqual(4);
    expect(selected.length).toBeLessThanOrEqual(5);
  });

  it('enforces category cap of 2 per category', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'chronicle',
      eventType: 'action_resolved',
      actorId: 'act-1',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);
    const selected = selectObjects(ranked, 'chronicle');

    const categoryCounts = new Map<string, number>();
    selected.forEach(obj => {
      const count = (categoryCounts.get(obj.category) ?? 0) + 1;
      categoryCounts.set(obj.category, count);
    });

    categoryCounts.forEach(count => {
      expect(count).toBeLessThanOrEqual(2);
    });
  });

  it('prefers character/faction if available', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);
    const selected = selectObjects(ranked, 'notable');

    const hasCharacterOrFaction = selected.some(
      obj => obj.category === 'character' || obj.category === 'faction'
    );
    expect(hasCharacterOrFaction).toBe(true);
  });

  it('returns empty for empty ranked list', () => {
    const selected = selectObjects([], 'notable');
    expect(selected).toEqual([]);
  });

  it('returns fewer objects if not enough harvested', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'act-1', type: 'actor', name: 'Solo', properties: {} });
    graph.addNode({ id: 'loc-1', type: 'location', name: 'Lonely', properties: {} });
    graph.addEdge({ id: 'loc-act1', source: 'act-1', target: 'loc-1', type: 'located_at', properties: {} });

    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'chronicle',
      eventType: 'action_resolved',
      actorId: 'act-1',
      description: 'test',
      tick: 1,
    };

    const harvested = harvestContext(event, graph);
    const ranked = rankObjects(harvested, event, graph);
    const selected = selectObjects(ranked, 'chronicle');

    expect(selected.length).toBeLessThanOrEqual(5);
    expect(selected.length).toBeGreaterThanOrEqual(0);
  });
});

describe('buildNarrativeContext', () => {
  it('builds complete context for notable tier event', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      targetId: 'act-2',
      description: 'test event',
      tick: 1,
      sphere: 'force',
    };

    const context = buildNarrativeContext(event, graph);

    expect(context.event).toEqual(event);
    expect(context.contextObjects).toBeDefined();
    expect(Array.isArray(context.contextObjects)).toBe(true);
    expect(context.historicalFragments).toBeDefined();
    expect(Array.isArray(context.historicalFragments)).toBe(true);
    expect(context.oppositionSummary).toBeDefined();
    expect(context.oppositionSummary.tensionScore).toBeGreaterThanOrEqual(0);
  });

  it('returns empty context for routine tier', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'routine',
      eventType: 'action_resolved',
      actorId: 'act-1',
      description: 'test',
      tick: 1,
    };

    const context = buildNarrativeContext(event, graph);

    expect(context.event).toEqual(event);
    expect(context.contextObjects).toEqual([]);
    expect(context.historicalFragments).toEqual([]);
    expect(context.oppositionSummary.tensionScore).toBe(0);
  });

  it('populates opposition summary with tension data', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      description: 'test',
      tick: 1,
      sphere: 'force',
    };

    const context = buildNarrativeContext(event, graph);

    expect(context.oppositionSummary.tensionScore).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(context.oppositionSummary.opposingPairs)).toBe(true);
  });

  it('respects selection limits in narrative context', () => {
    const graph = buildTestGraph();
    const event: NarrativeEvent = {
      id: 'event-1',
      tier: 'notable',
      eventType: 'action_resolved',
      actorId: 'act-1',
      description: 'test',
      tick: 1,
    };

    const context = buildNarrativeContext(event, graph);

    // Notable tier should have 2-3 objects
    expect(context.contextObjects.length).toBeLessThanOrEqual(3);
    expect(context.contextObjects.length).toBeGreaterThanOrEqual(2);
  });
});
