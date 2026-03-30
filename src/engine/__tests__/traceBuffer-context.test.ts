/**
 * Test trace instrumentation for context builder.
 * Verifies that buildNarrativeContext emits context_harvest traces.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  enableTracing,
  disableTracing,
  clearTraces,
  getTraces,
  getTracesForAgent,
} from '../traceBuffer';
import { buildNarrativeContext } from '../contextBuilder';
import type { NarrativeEvent } from '../../types/narrative';
import type { ContextHarvestTrace } from '../../types/trace';

function createTestGraph() {
  const graph = new WorldGraph();

  // ─── Locations ──────────────────────────────────────────────────────

  graph.addNode({ id: 'loc-1', type: 'location', name: 'Iron Gate', properties: { locationType: 'hex' } });
  graph.addNode({ id: 'loc-2', type: 'location', name: 'Salt Marsh', properties: { locationType: 'hex' } });
  graph.addNode({ id: 'loc-3', type: 'location', name: 'Far Tower', properties: { locationType: 'hex' } });

  // Adjacency edges
  graph.addEdge({ id: 'adj-1-2a', source: 'loc-1', target: 'loc-2', type: 'adjacent', properties: {} });
  graph.addEdge({ id: 'adj-1-2b', source: 'loc-2', target: 'loc-1', type: 'adjacent', properties: {} });
  graph.addEdge({ id: 'adj-2-3a', source: 'loc-2', target: 'loc-3', type: 'adjacent', properties: {} });
  graph.addEdge({ id: 'adj-2-3b', source: 'loc-3', target: 'loc-2', type: 'adjacent', properties: {} });

  // ─── Actors ─────────────────────────────────────────────────────────

  graph.addNode({
    id: 'actor-1',
    type: 'actor',
    name: 'Kaelen',
    properties: { actorType: 'individual', narrativeArchetype: 'tragic_hero' },
  });
  graph.addEdge({ id: 'loc-act1', source: 'actor-1', target: 'loc-1', type: 'located_at', properties: {} });

  graph.addNode({
    id: 'actor-2',
    type: 'actor',
    name: 'Mira',
    properties: { actorType: 'individual', narrativeArchetype: 'seeker' },
  });
  graph.addEdge({ id: 'loc-act2', source: 'actor-2', target: 'loc-2', type: 'located_at', properties: {} });

  // ─── Artifacts ──────────────────────────────────────────────────────

  graph.addNode({
    id: 'art-1',
    type: 'artifact',
    name: 'Thornblade',
    properties: {},
  });
  graph.addEdge({ id: 'poss-act1-art1', source: 'actor-1', target: 'art-1', type: 'possesses', properties: {} });

  // ─── Factions ───────────────────────────────────────────────────────

  graph.addNode({
    id: 'fac-1',
    type: 'actor',
    name: 'Iron Brotherhood',
    properties: { actorType: 'faction' },
  });
  graph.addEdge({ id: 'member-act1-fac1', source: 'actor-1', target: 'fac-1', type: 'member_of', properties: {} });

  // ─── Cosmology ──────────────────────────────────────────────────────

  graph.addNode({
    id: 'sphere-force',
    type: 'cosmology',
    name: 'Force',
    properties: { sphereType: 'creation', sphereName: 'Force' },
  });
  graph.addEdge({ id: 'align-act1-force', source: 'actor-1', target: 'sphere-force', type: 'aligned_with', properties: {} });

  // Foundation sphere nodes
  graph.addNode({
    id: 'cosmo-chaos',
    type: 'cosmology',
    name: 'Chaos',
    properties: { sphereType: 'foundation', sphereName: 'Chaos' },
  });
  graph.addEdge({ id: 'align-act1-chaos', source: 'actor-1', target: 'cosmo-chaos', type: 'aligned_with', properties: {} });

  return graph;
}

describe('traceBuffer-context: Context Harvest Instrumentation', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('should emit context_harvest trace when buildNarrativeContext builds context for notable event', () => {
    const graph = createTestGraph();
    const event: NarrativeEvent = {
      tick: 10,
      type: 'challenge',
      tier: 'notable',
      actorId: 'actor-1',
      targetId: 'actor-2',
      sphere: 'Life',
    };

    buildNarrativeContext(event, graph);

    const traces = getTraces();
    const harvestTrace = traces.find(
      (t) => t.category === 'context_harvest'
    ) as ContextHarvestTrace | undefined;

    expect(harvestTrace).toBeDefined();
    expect(harvestTrace?.tick).toBe(10);
    expect(harvestTrace?.category).toBe('context_harvest');
    expect(harvestTrace?.agentId).toBe('actor-1');
    expect(harvestTrace?.harvestedCount).toBeGreaterThanOrEqual(0);
    expect(harvestTrace?.oppositionTension).toBeGreaterThanOrEqual(0);
    expect(harvestTrace?.summary).toBeDefined();
    expect(
      harvestTrace?.summary?.toLowerCase()
    ).toMatch(/harvest|select|context/i);
  });

  it('should include top ranked objects in trace', () => {
    const graph = createTestGraph();
    const event: NarrativeEvent = {
      tick: 20,
      type: 'opportunity',
      tier: 'chronicle',
      actorId: 'actor-1',
      targetId: 'actor-2',
      sphere: 'Force',
    };

    buildNarrativeContext(event, graph);

    const traces = getTraces();
    const harvestTrace = traces.find(
      (t) => t.category === 'context_harvest'
    ) as ContextHarvestTrace | undefined;

    expect(harvestTrace).toBeDefined();
    expect(Array.isArray(harvestTrace?.rankedTop)).toBe(true);
    expect(harvestTrace?.rankedTop).toHaveLength(
      Math.min(harvestTrace?.rankedTop?.length ?? 0, 5)
    );

    // Each ranked object should have required fields
    harvestTrace?.rankedTop?.forEach((obj) => {
      expect(obj.nodeId).toBeDefined();
      expect(obj.name).toBeDefined();
      expect(typeof obj.score).toBe('number');
      expect(obj.score).toBeGreaterThanOrEqual(0);
    });
  });

  it('should include selected object IDs in trace', () => {
    const graph = createTestGraph();
    const event: NarrativeEvent = {
      tick: 30,
      type: 'adversary_conflict',
      tier: 'chronicle',
      actorId: 'actor-1',
      targetId: 'actor-2',
      sphere: 'Mind',
    };

    buildNarrativeContext(event, graph);

    const traces = getTraces();
    const harvestTrace = traces.find(
      (t) => t.category === 'context_harvest'
    ) as ContextHarvestTrace | undefined;

    expect(harvestTrace).toBeDefined();
    expect(Array.isArray(harvestTrace?.selectedIds)).toBe(true);
    // Selected IDs should be subset of or equal to ranked objects
    harvestTrace?.selectedIds?.forEach((id) => {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  it('should not emit trace when tracing disabled', () => {
    disableTracing();

    const graph = createTestGraph();
    const event: NarrativeEvent = {
      tick: 40,
      type: 'challenge',
      tier: 'notable',
      actorId: 'actor-1',
      targetId: 'actor-2',
      sphere: 'Energy',
    };

    buildNarrativeContext(event, graph);

    const traces = getTraces();
    const harvestTrace = traces.find((t) => t.category === 'context_harvest');

    expect(harvestTrace).toBeUndefined();
  });

  it('should filter traces by agent ID', () => {
    const graph = createTestGraph();

    // Build context for actor-1
    const event1: NarrativeEvent = {
      tick: 50,
      type: 'challenge',
      tier: 'notable',
      actorId: 'actor-1',
      targetId: 'actor-2',
      sphere: 'Life',
    };
    buildNarrativeContext(event1, graph);

    // Build context for actor-2
    const event2: NarrativeEvent = {
      tick: 51,
      type: 'challenge',
      tier: 'notable',
      actorId: 'actor-2',
      targetId: 'actor-1',
      sphere: 'Spirit',
    };
    buildNarrativeContext(event2, graph);

    const actor1Traces = getTracesForAgent('actor-1');
    const actor2Traces = getTracesForAgent('actor-2');

    expect(actor1Traces.length).toBeGreaterThan(0);
    expect(actor2Traces.length).toBeGreaterThan(0);
    expect(actor1Traces.every((t) => t.agentId === 'actor-1')).toBe(true);
    expect(actor2Traces.every((t) => t.agentId === 'actor-2')).toBe(true);
  });

  it('should have opposition tension >= 0', () => {
    const graph = createTestGraph();
    const event: NarrativeEvent = {
      tick: 60,
      type: 'challenge',
      tier: 'chronicle',
      actorId: 'actor-1',
      targetId: 'actor-2',
      sphere: 'Entropy',
    };

    buildNarrativeContext(event, graph);

    const traces = getTraces();
    const harvestTrace = traces.find(
      (t) => t.category === 'context_harvest'
    ) as ContextHarvestTrace | undefined;

    expect(harvestTrace?.oppositionTension).toBeDefined();
    expect(harvestTrace?.oppositionTension).toBeGreaterThanOrEqual(0);
  });

  it('should skip pipeline for routine events and not emit trace', () => {
    clearTraces();

    const graph = createTestGraph();
    const event: NarrativeEvent = {
      tick: 70,
      type: 'challenge',
      tier: 'routine',
      actorId: 'actor-1',
      targetId: 'actor-2',
      sphere: 'Time',
    };

    buildNarrativeContext(event, graph);

    const traces = getTraces();
    // Routine events return early and should not emit any trace
    const harvestTraces = traces.filter((t) => t.category === 'context_harvest');

    expect(harvestTraces).toHaveLength(0);
  });
});
