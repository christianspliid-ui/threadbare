import { describe, it, expect, beforeEach } from 'vitest';
import { phaseColocationDetection, resetColocationEventCounter } from '../phaseColocationDetection';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';

function makeState(graph: WorldGraph, tick: number, seed: number): GameState {
  return {
    tick,
    seed,
    graph,
    tickEvents: [],
    ascendantId: 'god',
  } as unknown as GameState;
}

describe('phaseColocationDetection', () => {
  beforeEach(() => {
    resetColocationEventCounter();
  });

  it('emits no events when no agents share a location', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'loc1', type: 'location', name: 'Hex A', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'loc2', type: 'location', name: 'Hex B', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'a1', type: 'actor', name: 'Agent 1', properties: { actorType: 'individual', domainCapabilities: {} } });
    g.addNode({ id: 'a2', type: 'actor', name: 'Agent 2', properties: { actorType: 'individual', domainCapabilities: {} } });
    g.addEdge({ id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
    g.addEdge({ id: 'e2', source: 'a2', target: 'loc2', type: 'located_at', properties: {} });

    const state = makeState(g, 1, 42);
    const result = phaseColocationDetection(state);
    const newEvents = (result.tickEvents ?? []).filter(e => e.type === 'agent_encounter');
    expect(newEvents.length).toBe(0);
  });

  it('can detect agents at the same location', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'loc1', type: 'location', name: 'Market', properties: { locationType: 'location' } });
    g.addNode({ id: 'a1', type: 'actor', name: 'Alice', properties: { actorType: 'individual', domainCapabilities: { eye: 0.9 } } });
    g.addNode({ id: 'a2', type: 'actor', name: 'Bob', properties: { actorType: 'individual', domainCapabilities: { shadow: 0.1 } } });
    g.addEdge({ id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
    g.addEdge({ id: 'e2', source: 'a2', target: 'loc1', type: 'located_at', properties: {} });

    // Run many ticks with different seeds to get at least one detection
    let detected = false;
    for (let tick = 0; tick < 100; tick++) {
      resetColocationEventCounter();
      const state = makeState(g, tick, tick * 13);
      const result = phaseColocationDetection(state);
      const encounters = (result.tickEvents ?? []).filter(e => e.type === 'agent_encounter');
      if (encounters.length > 0) {
        detected = true;
        break;
      }
    }
    expect(detected).toBe(true);
  });

  it('uses seeded PRNG for deterministic detection', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'loc1', type: 'location', name: 'Market', properties: { locationType: 'location' } });
    g.addNode({ id: 'a1', type: 'actor', name: 'Alice', properties: { actorType: 'individual', domainCapabilities: { eye: 0.5 } } });
    g.addNode({ id: 'a2', type: 'actor', name: 'Bob', properties: { actorType: 'individual', domainCapabilities: { shadow: 0.5 } } });
    g.addEdge({ id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
    g.addEdge({ id: 'e2', source: 'a2', target: 'loc1', type: 'located_at', properties: {} });

    resetColocationEventCounter();
    const state1 = makeState(g, 5, 42);
    const result1 = phaseColocationDetection(state1);

    resetColocationEventCounter();
    const state2 = makeState(g, 5, 42);
    const result2 = phaseColocationDetection(state2);

    // Same seed + tick = same number of events
    expect(result1.tickEvents?.length).toBe(result2.tickEvents?.length);
  });

  it('sublocation tier has higher base chance than hex', () => {
    // This tests the getBaseChance logic indirectly through many iterations
    const gHex = new WorldGraph();
    gHex.addNode({ id: 'loc1', type: 'location', name: 'Hex A', properties: { locationType: 'hex_center' } });
    gHex.addNode({ id: 'a1', type: 'actor', name: 'A1', properties: { actorType: 'individual', domainCapabilities: {} } });
    gHex.addNode({ id: 'a2', type: 'actor', name: 'A2', properties: { actorType: 'individual', domainCapabilities: {} } });
    gHex.addEdge({ id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
    gHex.addEdge({ id: 'e2', source: 'a2', target: 'loc1', type: 'located_at', properties: {} });

    const gSub = new WorldGraph();
    gSub.addNode({ id: 'loc1', type: 'location', name: 'Tavern', properties: { locationType: 'sublocation' } });
    gSub.addNode({ id: 'a1', type: 'actor', name: 'A1', properties: { actorType: 'individual', domainCapabilities: {} } });
    gSub.addNode({ id: 'a2', type: 'actor', name: 'A2', properties: { actorType: 'individual', domainCapabilities: {} } });
    gSub.addEdge({ id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
    gSub.addEdge({ id: 'e2', source: 'a2', target: 'loc1', type: 'located_at', properties: {} });

    let hexDetections = 0;
    let subDetections = 0;
    const iterations = 500;

    for (let i = 0; i < iterations; i++) {
      resetColocationEventCounter();
      const hexState = makeState(gHex, i, i * 7);
      const hexResult = phaseColocationDetection(hexState);
      hexDetections += (hexResult.tickEvents ?? []).filter(e => e.type === 'agent_encounter').length;

      resetColocationEventCounter();
      const subState = makeState(gSub, i, i * 7);
      const subResult = phaseColocationDetection(subState);
      subDetections += (subResult.tickEvents ?? []).filter(e => e.type === 'agent_encounter').length;
    }

    // Sublocation should detect more often than hex
    expect(subDetections).toBeGreaterThan(hexDetections);
  });

  it('high Eye increases detection chance', () => {
    const gHighEye = new WorldGraph();
    gHighEye.addNode({ id: 'loc1', type: 'location', name: 'Market', properties: { locationType: 'location' } });
    gHighEye.addNode({ id: 'a1', type: 'actor', name: 'Eagle', properties: { actorType: 'individual', domainCapabilities: { eye: 1.0 } } });
    gHighEye.addNode({ id: 'a2', type: 'actor', name: 'Target', properties: { actorType: 'individual', domainCapabilities: {} } });
    gHighEye.addEdge({ id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
    gHighEye.addEdge({ id: 'e2', source: 'a2', target: 'loc1', type: 'located_at', properties: {} });

    const gLowEye = new WorldGraph();
    gLowEye.addNode({ id: 'loc1', type: 'location', name: 'Market', properties: { locationType: 'location' } });
    gLowEye.addNode({ id: 'a1', type: 'actor', name: 'Blind', properties: { actorType: 'individual', domainCapabilities: { eye: 0 } } });
    gLowEye.addNode({ id: 'a2', type: 'actor', name: 'Target', properties: { actorType: 'individual', domainCapabilities: {} } });
    gLowEye.addEdge({ id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
    gLowEye.addEdge({ id: 'e2', source: 'a2', target: 'loc1', type: 'located_at', properties: {} });

    let highEyeDetections = 0;
    let lowEyeDetections = 0;
    const iterations = 500;

    for (let i = 0; i < iterations; i++) {
      resetColocationEventCounter();
      const h = makeState(gHighEye, i, i * 11);
      const hResult = phaseColocationDetection(h);
      highEyeDetections += (hResult.tickEvents ?? []).filter(e => e.type === 'agent_encounter').length;

      resetColocationEventCounter();
      const l = makeState(gLowEye, i, i * 11);
      const lResult = phaseColocationDetection(l);
      lowEyeDetections += (lResult.tickEvents ?? []).filter(e => e.type === 'agent_encounter').length;
    }

    expect(highEyeDetections).toBeGreaterThan(lowEyeDetections);
  });
});
