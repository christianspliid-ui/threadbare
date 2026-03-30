/**
 * Familiarity Integration Tests
 *
 * Verifies that familiarityMap is initialized, populated, and updated
 * through the game lifecycle.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick } from '../orchestrator';
import { getTraces, clearTraces, enableTracing } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import { FAMILIARITY_GAINS } from '../../types/familiarity';
import { getFamiliarity } from '../familiarity';

describe('familiarity integration', () => {
  let state: GameState;

  beforeEach(() => {
    clearTraces();
    enableTracing();
    const result = initializeGameState(
      {
        title: 'Test Ascendant',
        sphereAlignment: { force: 0.5, matter: 0.5 },
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

    // Ensure at least one retinue member is co-located with the avatar.
    // World generation doesn't guarantee this, so we move a retinue member into the avatar's hex.
    const avatarEdges = state.graph.getIncomingEdges(state.ascendantId, 'avatar_of');
    if (avatarEdges.length > 0) {
      const avatarId = avatarEdges[0].source;
      const avatarLocEdges = state.graph.getOutgoingEdges(avatarId, 'located_at');
      if (avatarLocEdges.length > 0) {
        const avatarLocationId = avatarLocEdges[0].target;
        const threadEdges = state.graph.getEdgesByType('thread');
        if (threadEdges.length > 0) {
          const retinueMemberId = threadEdges[0].target;
          // Update retinue member's locationId property to point to the avatar's location
          state.graph.updateNode(retinueMemberId, { properties: { locationId: avatarLocationId } });
          // Also update the located_at edge to point to the avatar's location
          const retinueMemberLocEdges = state.graph.getOutgoingEdges(retinueMemberId, 'located_at');
          for (const edge of retinueMemberLocEdges) {
            state.graph.removeEdge(edge.id);
          }
          state.graph.addEdge({
            id: `edge_retinue_at_avatar_hex_${retinueMemberId}`,
            source: retinueMemberId,
            target: avatarLocationId,
            type: 'located_at',
            properties: {},
          });
        }
      }
    }
  });

  it('initializes familiarity map in GameState', () => {
    expect(state.familiarityMap).toBeDefined();
    expect(state.familiarityMap instanceof Map).toBe(true);
  });

  it('initial retinue members start at recognised (0.3)', () => {
    const threadEdges = state.graph.getEdgesByType('thread');
    expect(threadEdges.length).toBeGreaterThan(0);

    for (const edge of threadEdges) {
      const retinueMemberId = edge.target;
      const familiarity = getFamiliarity(state.familiarityMap, retinueMemberId);
      // Thread tier 1 should grant FAMILIARITY_GAINS.worship_tier_1 = 0.3
      expect(familiarity).toBe(FAMILIARITY_GAINS.worship_tier_1);
    }
  });

  it('proximity tick increases familiarity for agents in avatar hex', () => {
    // Find a retinue member that is in the same hex as the avatar
    const avatarEdges = state.graph.getIncomingEdges(state.ascendantId, 'avatar_of');
    expect(avatarEdges.length).toBeGreaterThan(0);
    const avatarId = avatarEdges[0].source;
    const locEdges = state.graph.getOutgoingEdges(avatarId, 'located_at');
    expect(locEdges.length).toBeGreaterThan(0);
    const avatarLocation = state.graph.getNode(locEdges[0].target);
    const avatarHexCol = avatarLocation?.properties?.hexCol as number;
    const avatarHexRow = avatarLocation?.properties?.hexRow as number;

    const threadEdges = state.graph.getEdgesByType('thread');
    const inHexRetinueMember = threadEdges.find(edge => {
      const memberId = edge.target;
      const member = state.graph.getNode(memberId);
      const locationId = member?.properties?.locationId as string | undefined;
      if (!locationId) return false;
      const location = state.graph.getNode(locationId);
      return location?.properties?.hexCol === avatarHexCol && location?.properties?.hexRow === avatarHexRow;
    });
    expect(inHexRetinueMember).toBeDefined();

    const retinueMemberId = inHexRetinueMember!.target;
    const oldFamiliarity = getFamiliarity(state.familiarityMap, retinueMemberId);
    expect(oldFamiliarity).toBe(0.3); // Initial thread tier

    // Run 1 tick (should add proximity familiarity)
    const newState = runTick(state);

    const newFamiliarity = getFamiliarity(newState.familiarityMap, retinueMemberId);
    // Should be 0.3 + 0.01 (proximity gain)
    expect(newFamiliarity).toBeCloseTo(0.3 + FAMILIARITY_GAINS.proximity, 5);
  });

  it('familiarity gain emits trace', () => {
    const threadEdges = state.graph.getEdgesByType('thread');
    expect(threadEdges.length).toBeGreaterThan(0);

    clearTraces();
    // Run 1 tick to trigger proximity gain
    const newState = runTick(state);

    const traces = getTraces();
    const familiarityTraces = traces.filter((t: any) => t.category === 'familiarity_change');

    // Should have at least one familiarity_change trace
    expect(familiarityTraces.length).toBeGreaterThan(0);

    // Verify structure of a familiarity trace
    const trace = familiarityTraces[0] as any;
    expect(trace.category).toBe('familiarity_change');
    expect(trace.source).toBe('proximity');
    expect(trace.oldFamiliarity).toBe(0.3);
    expect(trace.newFamiliarity).toBeCloseTo(0.31, 5);
    expect(trace.levelChanged).toBe(false); // 0.3→0.31 doesn't cross threshold
  });

  it('familiarity threshold crossing emits levelChanged flag', () => {
    // Find a retinue member in the avatar's hex (same approach as proximity test)
    const avatarEdges = state.graph.getIncomingEdges(state.ascendantId, 'avatar_of');
    const avatarId = avatarEdges[0].source;
    const locEdges = state.graph.getOutgoingEdges(avatarId, 'located_at');
    const avatarLocation = state.graph.getNode(locEdges[0].target);
    const avatarHexCol = avatarLocation?.properties?.hexCol as number;
    const avatarHexRow = avatarLocation?.properties?.hexRow as number;
    const threadEdges = state.graph.getEdgesByType('thread');
    const inHexRetinueMember = threadEdges.find(edge => {
      const memberId = edge.target;
      const member = state.graph.getNode(memberId);
      const locationId = member?.properties?.locationId as string | undefined;
      if (!locationId) return false;
      const location = state.graph.getNode(locationId);
      return location?.properties?.hexCol === avatarHexCol && location?.properties?.hexRow === avatarHexRow;
    });
    expect(inHexRetinueMember).toBeDefined();
    const retinueMemberId = inHexRetinueMember!.target;

    const map = new Map(state.familiarityMap);
    map.set(retinueMemberId, 0.35); // Just below "known" threshold
    state.familiarityMap = map;

    // Run a tick (proximity gain of 0.01 will push it to 0.36 - still below)
    clearTraces();
    let newState = runTick(state);
    let traces = getTraces();
    const trace1 = traces.find((t: any) => t.category === 'familiarity_change' && t.actorId === retinueMemberId) as any;
    expect(trace1?.levelChanged).toBe(false); // 0.35→0.36

    // Bump to 0.39, then tick should cross to 0.40 (known threshold)
    newState.familiarityMap.set(retinueMemberId, 0.39);
    clearTraces();
    newState = runTick(newState);
    traces = getTraces();
    const familiarityTraces2 = traces.filter((t: any) => t.category === 'familiarity_change');
    expect(familiarityTraces2.length).toBeGreaterThan(0);
    const trace2 = familiarityTraces2.find((t: any) => t.actorId === retinueMemberId) as any;
    expect(trace2?.oldFamiliarity).toBeCloseTo(0.39, 5);
    expect(trace2?.newFamiliarity).toBeCloseTo(0.40, 5);
    expect(trace2?.levelChanged).toBe(true);
    expect(trace2?.newLevel).toBe('known');
  });

  it('agents in avatar hex gain proximity familiarity', () => {
    const threadEdges = state.graph.getEdgesByType('thread');
    expect(threadEdges.length).toBeGreaterThan(0);

    // Get avatar's hex position to determine which retinue members are in it
    const avatarEdges = state.graph.getIncomingEdges(state.ascendantId, 'avatar_of');
    expect(avatarEdges.length).toBeGreaterThan(0);

    const avatarId = avatarEdges[0].source;
    const locEdges = state.graph.getOutgoingEdges(avatarId, 'located_at');
    expect(locEdges.length).toBeGreaterThan(0);

    const avatarLocation = state.graph.getNode(locEdges[0].target);
    const avatarHex = {
      col: avatarLocation?.properties?.hexCol as number,
      row: avatarLocation?.properties?.hexRow as number,
    };

    // Find retinue members in the same hex as avatar
    const retinueInHex = [];
    for (const edge of threadEdges) {
      const memberId = edge.target;
      const member = state.graph.getNode(memberId);
      const locationId = member?.properties?.locationId as string | undefined;
      if (locationId) {
        const location = state.graph.getNode(locationId);
        if (location?.properties?.hexCol === avatarHex.col && location?.properties?.hexRow === avatarHex.row) {
          retinueInHex.push(memberId);
        }
      }
    }

    expect(retinueInHex.length).toBeGreaterThan(0);

    // All retinue members in avatar's hex should start at 0.3
    for (const id of retinueInHex) {
      expect(getFamiliarity(state.familiarityMap, id)).toBe(0.3);
    }

    // Run 1 tick
    const newState = runTick(state);

    // All in-hex retinue members should now be at 0.31 (0.3 + 0.01 proximity)
    for (const id of retinueInHex) {
      expect(getFamiliarity(newState.familiarityMap, id)).toBeCloseTo(0.31, 5);
    }
  });
});
