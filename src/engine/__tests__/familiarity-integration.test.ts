/**
 * Familiarity Integration Tests
 *
 * Verifies that familiarityMap is initialized, populated, and updated
 * through the game lifecycle.
 *
 * Since the game starts with no threads (alpha), tests manually create
 * a thread edge to exercise the familiarity pipeline.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick, phaseFamiliarityGain } from '../orchestrator';
import { getTraces, clearTraces, enableTracing } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import { FAMILIARITY_GAINS } from '../../types/familiarity';
import { getFamiliarity } from '../familiarity';

describe('familiarity integration', () => {
  let state: GameState;
  let testRetinueMemberId: string;

  beforeEach(() => {
    clearTraces();
    enableTracing();
    const result = initializeGameState(
      {
        title: 'Test Ascendant',
        sphereAlignment: { primary: 'force', secondary: 'matter' },
      },
      'Test Avatar',
      {
        foundationChaos: 0.5,
        foundationLight: 0.5,
        creationSpheres: {
          force: 0.3,
          matter: 0.3,
          energy: 0.15,
          life: 0.15,
          mind: 0,
          spirit: 0,
          time: 0,
          entropy: 0,
        },
      },
      42,
      20,
      15,
    );
    state = result.state;

    // Manually create a thread edge to an NPC and place them at the avatar's hex.
    // Game starts with no threads; this simulates establishing one.
    const avatarEdges = state.graph.getIncomingEdges(state.ascendantId, 'avatar_of');
    const avatarId = avatarEdges[0].source;
    const avatarLocEdges = state.graph.getOutgoingEdges(avatarId, 'located_at');
    const avatarLocationId = avatarLocEdges[0].target;

    // Find an NPC individual to thread
    const allNodes = state.graph.getNodesByType('actor');
    const individual = allNodes.find(
      n => n.properties?.actorType === 'individual' && n.id !== avatarId,
    );
    if (!individual) throw new Error('No NPC individual found in test world');
    testRetinueMemberId = individual.id;

    // Create thread edge
    state.graph.addEdge({
      id: `edge_thread_test_${testRetinueMemberId}`,
      source: state.ascendantId,
      target: testRetinueMemberId,
      type: 'thread',
      properties: { tier: 1, devotion: 50 },
    });

    // Set initial familiarity (normally done at thread creation time)
    state.familiarityMap.set(testRetinueMemberId, FAMILIARITY_GAINS.worship_tier_1);

    // Move the NPC to the avatar's location
    state.graph.updateNode(testRetinueMemberId, { properties: { locationId: avatarLocationId } });
    const memberLocEdges = state.graph.getOutgoingEdges(testRetinueMemberId, 'located_at');
    for (const edge of memberLocEdges) {
      state.graph.removeEdge(edge.id);
    }
    state.graph.addEdge({
      id: `edge_retinue_at_avatar_hex_${testRetinueMemberId}`,
      source: testRetinueMemberId,
      target: avatarLocationId,
      type: 'located_at',
      properties: {},
    });
  });

  it('initializes familiarity map in GameState', () => {
    expect(state.familiarityMap).toBeDefined();
    expect(state.familiarityMap instanceof Map).toBe(true);
  });

  it('game starts with empty familiarity map (no initial threads)', () => {
    // Re-init without our manual thread setup
    const result = initializeGameState(
      {
        title: 'Test Ascendant',
        sphereAlignment: { primary: 'force', secondary: 'matter' },
      },
      'Test Avatar',
      {
        foundationChaos: 0.5,
        foundationLight: 0.5,
        creationSpheres: {
          force: 0.3,
          matter: 0.3,
          energy: 0.15,
          life: 0.15,
          mind: 0,
          spirit: 0,
          time: 0,
          entropy: 0,
        },
      },
      42,
      20,
      15,
    );
    expect(result.state.familiarityMap.size).toBe(0);
    expect(result.state.graph.getEdgesByType('thread').length).toBe(0);
  });

  it('threaded retinue member has correct familiarity', () => {
    const familiarity = getFamiliarity(state.familiarityMap, testRetinueMemberId);
    expect(familiarity).toBe(FAMILIARITY_GAINS.worship_tier_1);
  });

  it('proximity phase increases familiarity for agents in avatar hex', () => {
    const oldFamiliarity = getFamiliarity(state.familiarityMap, testRetinueMemberId);
    expect(oldFamiliarity).toBe(0.3); // Initial thread tier

    // Run the proximity phase directly (avoids movement phase relocating the NPC)
    const partial = phaseFamiliarityGain(state);
    const newMap = partial.familiarityMap!;

    const newFamiliarity = getFamiliarity(newMap, testRetinueMemberId);
    // Should be 0.3 + 0.01 (proximity gain)
    expect(newFamiliarity).toBeCloseTo(0.3 + FAMILIARITY_GAINS.proximity, 5);
  });

  it('familiarity gain emits trace', () => {
    clearTraces();
    // Run the proximity phase directly
    phaseFamiliarityGain(state);

    const traces = getTraces();
    const familiarityTraces = traces.filter((t: any) => t.category === 'familiarity_change');

    // Should have at least one familiarity_change trace for our test agent
    const agentTrace = familiarityTraces.find((t: any) => t.actorId === testRetinueMemberId) as any;
    expect(agentTrace).toBeDefined();
    expect(agentTrace.category).toBe('familiarity_change');
    expect(agentTrace.source).toBe('proximity');
    expect(agentTrace.oldFamiliarity).toBe(0.3);
    expect(agentTrace.newFamiliarity).toBeCloseTo(0.31, 5);
    expect(agentTrace.levelChanged).toBe(false); // 0.3→0.31 doesn't cross threshold
  });

  it('familiarity threshold crossing emits levelChanged flag', () => {
    const map = new Map(state.familiarityMap);
    map.set(testRetinueMemberId, 0.35); // Just below "known" threshold
    state.familiarityMap = map;

    // Run proximity phase (0.01 gain → 0.36, still below 0.4 "known" threshold)
    clearTraces();
    phaseFamiliarityGain(state);
    let traces = getTraces();
    const trace1 = traces.find((t: any) => t.category === 'familiarity_change' && t.actorId === testRetinueMemberId) as any;
    expect(trace1?.levelChanged).toBe(false); // 0.35→0.36

    // Bump to 0.39, then proximity gain should cross to 0.40 (known threshold)
    state.familiarityMap.set(testRetinueMemberId, 0.39);
    clearTraces();
    phaseFamiliarityGain(state);
    traces = getTraces();
    const trace2 = traces.find((t: any) => t.category === 'familiarity_change' && t.actorId === testRetinueMemberId) as any;
    expect(trace2).toBeDefined();
    expect(trace2?.oldFamiliarity).toBeCloseTo(0.39, 5);
    expect(trace2?.newFamiliarity).toBeCloseTo(0.40, 5);
    expect(trace2?.levelChanged).toBe(true);
    expect(trace2?.newLevel).toBe('known');
  });

  it('agents in avatar hex gain proximity familiarity', () => {
    // Retinue member is already at avatar's hex from beforeEach
    expect(getFamiliarity(state.familiarityMap, testRetinueMemberId)).toBe(0.3);

    // Run proximity phase directly
    const partial = phaseFamiliarityGain(state);
    const newMap = partial.familiarityMap!;

    // Should now be at 0.31 (0.3 + 0.01 proximity)
    expect(getFamiliarity(newMap, testRetinueMemberId)).toBeCloseTo(0.31, 5);
  });
});
