import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { runDivineProximityPhase } from '../orchestrator';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { DIVINE_PROXIMITY_TRACE_CAP } from '../../data/rarity-constants';

function makeState(graph: WorldGraph, ascendantId = 'asc.main', tick = 100): GameState {
  return {
    tick,
    ascendantId,
    graph,
  } as unknown as GameState;
}

function wireAscendant(graph: WorldGraph, ascendantId = 'asc.main', avatarId = 'avatar.main'): void {
  graph.addNode({
    id: ascendantId,
    type: 'ascendant',
    name: 'Ascendant',
    properties: {},
  });
  graph.addNode({
    id: avatarId,
    type: 'avatar',
    name: 'Avatar',
    properties: {},
  });
  graph.addEdge({
    id: `edge.avatar-of.${avatarId}`,
    type: 'avatar_of',
    source: avatarId,
    target: ascendantId,
    properties: {},
  });
}

describe('runDivineProximityPhase', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('accumulates importance inside radius and skips outside radius', () => {
    const graph = new WorldGraph();
    wireAscendant(graph);

    graph.addNode({
      id: 'loc.avatar',
      type: 'location',
      name: 'Avatar Location',
      properties: { hexCol: 0, hexRow: 0, locationType: 'settlement' },
    });
    graph.addEdge({
      id: 'edge.avatar.located',
      type: 'located_at',
      source: 'avatar.main',
      target: 'loc.avatar',
      properties: {},
    });

    graph.addNode({
      id: 'loc.near',
      type: 'location',
      name: 'Near Location',
      properties: { hexCol: 1, hexRow: 0, locationType: 'settlement' },
    });
    graph.addNode({
      id: 'loc.far',
      type: 'location',
      name: 'Far Location',
      properties: { hexCol: 10, hexRow: 10, locationType: 'settlement' },
    });

    graph.addNode({
      id: 'actor.near',
      type: 'actor',
      name: 'Near Actor',
      properties: { actorType: 'individual', rarityTier: 1, importance: 0 },
    });
    graph.addEdge({
      id: 'edge.actor.near.located',
      type: 'located_at',
      source: 'actor.near',
      target: 'loc.near',
      properties: {},
    });

    graph.addNode({
      id: 'actor.far',
      type: 'actor',
      name: 'Far Actor',
      properties: { actorType: 'individual', rarityTier: 1, importance: 0 },
    });
    graph.addEdge({
      id: 'edge.actor.far.located',
      type: 'located_at',
      source: 'actor.far',
      target: 'loc.far',
      properties: {},
    });

    const state = makeState(graph);
    const result = runDivineProximityPhase(state);

    const near = graph.getNode('actor.near');
    const far = graph.getNode('actor.far');
    expect(near?.properties.importance).toBeGreaterThan(0);
    expect(far?.properties.importance).toBe(0);
    expect(result.scanCount).toBeGreaterThan(0);
    expect(result.accumulatedCount).toBeGreaterThan(0);
  });

  it('skips ascendant when no hex can be resolved and bumps skipped counter', () => {
    const graph = new WorldGraph();
    wireAscendant(graph);
    const state = makeState(graph);

    const result = runDivineProximityPhase(state);
    expect(result.skippedAscendantCount).toBe(1);

    const phaseTrace = getTraces().find((t) => t.category === 'divine_proximity_phase') as any;
    expect(phaseTrace).toBeDefined();
    expect(phaseTrace.skippedAscendantCount).toBe(1);
    expect(phaseTrace.accumulatedCount).toBe(0);
  });

  it('caps per-node accumulation traces while keeping phase summary totals', () => {
    const graph = new WorldGraph();
    wireAscendant(graph);

    graph.addNode({
      id: 'loc.avatar',
      type: 'location',
      name: 'Avatar Location',
      properties: { hexCol: 0, hexRow: 0, locationType: 'settlement' },
    });
    graph.addEdge({
      id: 'edge.avatar.located',
      type: 'located_at',
      source: 'avatar.main',
      target: 'loc.avatar',
      properties: {},
    });

    for (let i = 0; i < DIVINE_PROXIMITY_TRACE_CAP + 8; i++) {
      const locId = `loc.cap.${i}`;
      const actorId = `actor.cap.${i}`;
      graph.addNode({
        id: locId,
        type: 'location',
        name: `Cap Location ${i}`,
        properties: { hexCol: 0, hexRow: 1, locationType: 'settlement' },
      });
      graph.addNode({
        id: actorId,
        type: 'actor',
        name: `Cap Actor ${i}`,
        properties: { actorType: 'individual', rarityTier: 1, importance: 0 },
      });
      graph.addEdge({
        id: `edge.cap.located.${i}`,
        type: 'located_at',
        source: actorId,
        target: locId,
        properties: {},
      });
    }

    const state = makeState(graph);
    const result = runDivineProximityPhase(state);

    const accumulationTraces = getTraces().filter((t) => t.category === 'divine_proximity_accumulation');
    expect(accumulationTraces.length).toBe(DIVINE_PROXIMITY_TRACE_CAP);
    expect(result.accumulatedCount).toBeGreaterThan(DIVINE_PROXIMITY_TRACE_CAP);

    const phaseTrace = getTraces().find((t) => t.category === 'divine_proximity_phase') as any;
    expect(phaseTrace).toBeDefined();
    expect(phaseTrace.accumulatedCount).toBe(result.accumulatedCount);
  });
});
