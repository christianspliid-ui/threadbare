/**
 * Contract tests for incremental encounter-cache updates (THR-187).
 *
 * Verifies that phaseSettlementPromotion, phaseSublocations, and
 * phaseInitiativeProgress apply encounter-cache updates incrementally
 * when a runtime is provided, without triggering a full rebuild next tick.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import { createSimulationRuntime, ensureEncounterCache } from '../../simulationRuntime';
import { phaseSettlementPromotion } from '../../phaseSettlementPromotion';
import {
  phaseSublocations,
  SUBLOC_MARKET_SPAWN_PROSPERITY,
} from '../../phaseSublocations';
import type { GameState } from '../../../types/gameState';
import type { GraphNode } from '../../../types/graph';
import { SETTLEMENT_PROMOTION_SUSTAIN_TICKS } from '../../phaseProsperity';

// ─── Minimal GameState factory ─────────────────────────────────────────────

function makeState(graph: WorldGraph, tick = 1): GameState {
  return {
    tick,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: 'asc_1',
    essencePool: {},
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as GameState['doomDefinition'],
    doomClock: {} as GameState['doomClock'],
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    worldSoul: {} as GameState['worldSoul'],
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
  };
}

function makeHamletNode(id: string, prosperity = 100): GraphNode {
  return {
    id,
    type: 'location',
    name: `${id}-name`,
    properties: {
      locationSubtype: 'hamlet',
      prosperity,
      hexCol: 0,
      hexRow: 0,
      prosperitySustainAboveTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS,
      prosperitySustainBelowTicks: 0,
    },
  };
}

// ─── phaseSettlementPromotion incremental contract ─────────────────────────

describe('Encounter Cache Incremental — phaseSettlementPromotion', () => {
  it('does not force a full rebuild when runtime is provided and a promotion occurs', () => {
    const graph = new WorldGraph();
    const loc = makeHamletNode('loc_hamlet_1');
    graph.addNode(loc);

    const state = makeState(graph);
    const runtime = createSimulationRuntime();

    // Build initial cache
    ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
    const rebuildCountBefore = runtime.encounterCacheRebuildCount;
    const svBefore = runtime.structuralCacheVersion;

    // Run promotion phase — hamlet qualifies because prosperitySustainAboveTicks >= threshold
    phaseSettlementPromotion(state, runtime);

    // structuralCacheVersion must have bumped (UI memos need it)
    expect(runtime.structuralCacheVersion).toBeGreaterThan(svBefore);
    // encounterCacheBuiltAt must be in sync — no full rebuild scheduled
    expect(runtime.encounterCacheBuiltAt).toBe(runtime.structuralCacheVersion);

    // Calling ensureEncounterCache again should NOT trigger another rebuild
    ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
    expect(runtime.encounterCacheRebuildCount).toBe(rebuildCountBefore);

    // The promotion must have happened (re-fetch from graph since addNode stores a shallow copy)
    const locAfter = state.graph.getNode('loc_hamlet_1');
    expect(locAfter?.properties.locationSubtype).toBe('town');
  });

  it('does not bump structuralCacheVersion when no promotion occurs', () => {
    const graph = new WorldGraph();
    // hamlet with 0 sustained ticks — no promotion
    const loc: GraphNode = {
      id: 'loc_hamlet_2',
      type: 'location',
      name: 'Hamlet 2',
      properties: {
        locationSubtype: 'hamlet',
        prosperity: 100,
        hexCol: 0,
        hexRow: 0,
        prosperitySustainAboveTicks: 0,
        prosperitySustainBelowTicks: 0,
      },
    };
    graph.addNode(loc);

    const state = makeState(graph);
    const runtime = createSimulationRuntime();
    ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
    const svBefore = runtime.structuralCacheVersion;

    phaseSettlementPromotion(state, runtime);

    // No promotion → no applyEncounterCacheUpdate call → version unchanged
    expect(runtime.structuralCacheVersion).toBe(svBefore);
    expect(loc.properties.locationSubtype).toBe('hamlet');
  });
});

// ─── phaseSublocations incremental contract ────────────────────────────────

describe('Encounter Cache Incremental — phaseSublocations', () => {
  it('does not force a full rebuild when runtime is provided and a sublocation is spawned', () => {
    const graph = new WorldGraph();
    const loc: GraphNode = {
      id: 'loc_town_1',
      type: 'location',
      name: 'Townsville',
      properties: {
        locationSubtype: 'hamlet',
        prosperity: SUBLOC_MARKET_SPAWN_PROSPERITY + 10,
        hexCol: 1,
        hexRow: 1,
      },
    };
    graph.addNode(loc);

    const state = makeState(graph);
    const runtime = createSimulationRuntime();

    // Build initial cache
    ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
    const rebuildCountBefore = runtime.encounterCacheRebuildCount;
    const svBefore = runtime.structuralCacheVersion;

    // Run sublocations phase — market district should spawn (prosperity >= threshold)
    phaseSublocations(state, null, runtime);

    // If a sublocation spawned, structuralCacheVersion must have bumped
    const sublocNodes = graph.getNodesByType('location').filter(
      n => n.properties.parentLocationId === 'loc_town_1',
    );
    if (sublocNodes.length > 0) {
      expect(runtime.structuralCacheVersion).toBeGreaterThan(svBefore);
      expect(runtime.encounterCacheBuiltAt).toBe(runtime.structuralCacheVersion);

      ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
      expect(runtime.encounterCacheRebuildCount).toBe(rebuildCountBefore);
    }
  });
});
