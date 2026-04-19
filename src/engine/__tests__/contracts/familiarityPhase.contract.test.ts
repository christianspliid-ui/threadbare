/**
 * Contract test: familiarity phase determinism (THR-188).
 *
 * Verifies that phaseFamiliarityGain produces identical familiarityMap outputs
 * and trace streams across repeated invocations with the same seed and state.
 * Guards against the refactor (O(N_all) → O(N_hex)) introducing any
 * ordering or iteration non-determinism.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGameState } from '../../gameInit';
import { phaseFamiliarityGain } from '../../orchestrator';
import { getTraces, clearTraces, enableTracing } from '../../traceBuffer';
import type { GameState } from '../../../types/gameState';
import { FAMILIARITY_GAINS } from '../../../types/familiarity';

// ─── Test state setup ─────────────────────────────────────────────────────────

function buildState(): GameState {
  const result = initializeGameState(
    {
      title: 'Determinism Test',
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
    42,   // seed
    20,   // width
    15,   // height
  );

  const state = { ...result.state, doomIdentityMatrix: null };

  // Place an NPC at the avatar's hex so there's actual familiarity work to do
  const avatarEdges = state.graph.getIncomingEdges(state.ascendantId, 'avatar_of');
  const avatarId = avatarEdges[0]?.source;
  if (!avatarId) return state;

  const avatarLocEdges = state.graph.getOutgoingEdges(avatarId, 'located_at');
  const avatarLocationId = avatarLocEdges[0]?.target;
  if (!avatarLocationId) return state;

  const actors = state.graph.getNodesByType('actor');
  const npc = actors.find(n => n.properties?.actorType === 'individual' && n.id !== avatarId);
  if (!npc) return state;

  // Place NPC at avatar's location
  state.graph.updateNode(npc.id, { properties: { locationId: avatarLocationId } });
  const npcLocEdges = state.graph.getOutgoingEdges(npc.id, 'located_at');
  for (const edge of npcLocEdges) {
    state.graph.removeEdge(edge.id);
  }
  state.graph.addEdge({
    id: `contract_npc_at_avatar_${npc.id}`,
    source: npc.id,
    target: avatarLocationId,
    type: 'located_at',
    properties: {},
  });

  state.familiarityMap.set(npc.id, FAMILIARITY_GAINS.worship_tier_1);
  return state;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('familiarityPhase contract — determinism', () => {
  let state: GameState;

  beforeEach(() => {
    clearTraces();
    enableTracing();
    state = buildState();
  });

  it('produces identical familiarityMap on two calls with the same input state', () => {
    const partial1 = phaseFamiliarityGain(state);
    const partial2 = phaseFamiliarityGain(state);

    // Both maps must have the same size and same values for all keys
    expect(partial1.familiarityMap!.size).toBe(partial2.familiarityMap!.size);
    for (const [key, value] of partial1.familiarityMap!) {
      expect(partial2.familiarityMap!.get(key)).toBe(value);
    }
  });

  it('emits identical familiarity_change traces on two calls with the same input state', () => {
    clearTraces();
    phaseFamiliarityGain(state);
    const traces1 = getTraces().filter((t: any) => t.category === 'familiarity_change');

    clearTraces();
    phaseFamiliarityGain(state);
    const traces2 = getTraces().filter((t: any) => t.category === 'familiarity_change');

    expect(traces1.length).toBe(traces2.length);
    for (let i = 0; i < traces1.length; i++) {
      const t1 = traces1[i] as any;
      const t2 = traces2[i] as any;
      expect(t1.actorId).toBe(t2.actorId);
      expect(t1.oldFamiliarity).toBe(t2.oldFamiliarity);
      expect(t1.newFamiliarity).toBe(t2.newFamiliarity);
      expect(t1.source).toBe(t2.source);
    }
  });

  it('tick_phase_profile totalActors is stable across calls', () => {
    clearTraces();
    phaseFamiliarityGain(state);
    const profile1 = getTraces().find((t: any) => t.category === 'tick_phase_profile' && t.phase === 'familiarity_gain') as any;

    clearTraces();
    phaseFamiliarityGain(state);
    const profile2 = getTraces().find((t: any) => t.category === 'tick_phase_profile' && t.phase === 'familiarity_gain') as any;

    expect(profile1).toBeDefined();
    expect(profile2).toBeDefined();
    expect(profile1.totalActors).toBe(profile2.totalActors);
    expect(profile1.processedActors).toBe(profile2.processedActors);
    expect(profile1.skippedActors).toBe(profile2.skippedActors);
  });

  it('processedActors is much smaller than totalActors on a populated map', () => {
    clearTraces();
    phaseFamiliarityGain(state);
    const profile = getTraces().find((t: any) => t.category === 'tick_phase_profile' && t.phase === 'familiarity_gain') as any;

    expect(profile).toBeDefined();
    // On a 20x15 map with seed 42, there are many actors but only a tiny subset on the avatar's hex
    expect(profile.totalActors).toBeGreaterThan(5);
    // Only NPC placed on avatar's hex should be processed (plus any that happen to start there)
    expect(profile.processedActors).toBeLessThan(profile.totalActors);
  });
});
