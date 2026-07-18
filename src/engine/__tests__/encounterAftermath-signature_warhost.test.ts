/**
 * THR-550: Iron / Warhost reach-signature aftermath effect (`signature_warhost`).
 *
 * Covers: faction mobilization, force raised on the existing army node form,
 * sphere-power strength scaling (THR-548), the no-leader sentiment-shift fallback,
 * and fail-soft no-ops (missing / dissolved / non-faction target).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { WARHOST_BASE_STRENGTH } from '../../data/game-config';
import { SIGNATURE_SCALE_CEIL, SIGNATURE_SCALE_FLOOR } from '../../data/reach-signature-content';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, EncounterAftermathReactionEffect, UnifiedAction } from '../../types/unifiedAction';

/**
 * actor-hero is the ascendant firing the encounter; its primary sphere is `force`
 * at the requested score so strength scaling is deterministic in each test.
 */
function buildState(opts: { actorSphereScore?: number } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'Hero',
    properties: {
      actorType: 'individual',
      sphereAlignment: { primary: 'force' },
      sphereAffinity: { scores: { force: opts.actorSphereScore ?? 10 }, progress: {} },
    },
  });
  graph.addNode({ id: 'faction-iron', type: 'actor', name: 'Iron Legion', properties: { actorType: 'faction', actorStatus: 'active' } });
  graph.addNode({ id: 'loc-keep', type: 'location', name: 'Iron Keep', properties: {} });
  graph.addNode({ id: 'leader-1', type: 'actor', name: 'Warleader', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'leader_member', source: 'leader-1', target: 'faction-iron', type: 'member_of', properties: { reputation: 0.6, role: 'member', rank: 'member', joinedTick: 0 } });
  graph.addEdge({ id: 'leader_loc', source: 'leader-1', target: 'loc-keep', type: 'located_at', properties: {} });
  return {
    tick: 50, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'actor-hero', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as GameState;
}

function makeAction(actorId = 'actor-hero', templateId = 'enc.warhost'): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId, targetId: actorId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as UnifiedAction;
}

function makeReaction(effects: EncounterAftermathReactionEffect[]): EncounterAftermathReaction {
  return { id: 'rx-warhost', label: 'Warhost', effects } as EncounterAftermathReaction;
}

function apply(state: GameState, reaction: EncounterAftermathReaction, runtime: SimulationRuntime, tick = 50) {
  return applyEncounterAftermathReaction(state, makeAction(), reaction, tick, runtime);
}

describe('signature_warhost', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('mobilizes the faction and raises a force on the army node form when a leader is supplied', () => {
    const state = buildState({ actorSphereScore: 10 }); // max sphere → mult = SIGNATURE_SCALE_CEIL
    const reaction = makeReaction([{ kind: 'signature_warhost', factionId: 'faction-iron', leaderAgentId: 'leader-1' }]);
    const result = apply(state, reaction, runtime);

    const faction = result.state.graph.getNode('faction-iron')!;
    expect(faction.properties.mobilized).toBe(true);
    expect(faction.properties.mobilizedTick).toBe(50);
    // strength = scaledEffect(WARHOST_BASE_STRENGTH, SIGNATURE_SCALE_CEIL)
    expect(faction.properties.mobilizedStrength).toBeCloseTo(WARHOST_BASE_STRENGTH * SIGNATURE_SCALE_CEIL);

    // Force exists on the army node form: an actor node with armyState, member_of the faction.
    const armyMember = result.state.graph.getAllEdges()
      .find(e => e.type === 'member_of' && e.target === 'faction-iron'
        && (e.properties as { role?: string }).role === 'army');
    expect(armyMember).toBeDefined();
    const army = result.state.graph.getNode(armyMember!.source)!;
    expect(army.properties.actorType).toBe('group');
    expect(army.properties.warhost).toBe(true);
    expect((army.properties.armyState as { cohesion: number }).cohesion).toBe(60);
    // commanded_by → leader, located_at → leader's location
    expect(result.state.graph.getOutgoingEdges(army.id, 'commanded_by')[0]?.target).toBe('leader-1');
    expect(result.state.graph.getOutgoingEdges(army.id, 'located_at')[0]?.target).toBe('loc-keep');

    const trace = getTraces().find(t => t.category === 'ascendant.signature.warhost');
    expect(trace).toBeDefined();
    expect((trace as { success?: boolean }).success).toBe(true);
    expect((trace as { forceMode?: string }).forceMode).toBe('army');
  });

  it('scales force strength down at low sphere power (floor multiplier)', () => {
    const state = buildState({ actorSphereScore: 0 }); // no mastery → mult = SIGNATURE_SCALE_FLOOR
    const reaction = makeReaction([{ kind: 'signature_warhost', factionId: 'faction-iron', leaderAgentId: 'leader-1' }]);
    const result = apply(state, reaction, runtime);
    const faction = result.state.graph.getNode('faction-iron')!;
    expect(faction.properties.mobilizedStrength).toBeCloseTo(WARHOST_BASE_STRENGTH * SIGNATURE_SCALE_FLOOR);
  });

  it('honors an authored baseStrength override', () => {
    const state = buildState({ actorSphereScore: 0 }); // mult = floor (0.6)
    const reaction = makeReaction([{ kind: 'signature_warhost', factionId: 'faction-iron', baseStrength: 50, leaderAgentId: 'leader-1' }]);
    const result = apply(state, reaction, runtime);
    expect(result.state.graph.getNode('faction-iron')!.properties.mobilizedStrength).toBeCloseTo(50 * SIGNATURE_SCALE_FLOOR);
  });

  it('falls back to a rival-sentiment shift when no force can be raised', () => {
    const state = buildState();
    // Strip the leader so no commander is available.
    state.graph.removeNode('leader-1');
    // Add a rival the faction already dislikes.
    state.graph.addNode({ id: 'faction-rival', type: 'actor', name: 'Rival', properties: { actorType: 'faction', actorStatus: 'active' } });
    state.graph.addEdge({ id: 'iron_rival', source: 'faction-iron', target: 'faction-rival', type: 'relates_to', properties: { sentiment: -0.5, strength: 0.5 } });

    const reaction = makeReaction([{ kind: 'signature_warhost', factionId: 'faction-iron' }]);
    const result = apply(state, reaction, runtime);

    const faction = result.state.graph.getNode('faction-iron')!;
    expect(faction.properties.mobilized).toBe(true);
    // No warhost army node created.
    const army = result.state.graph.getAllEdges()
      .find(e => e.type === 'member_of' && e.target === 'faction-iron' && (e.properties as { role?: string }).role === 'army');
    expect(army).toBeUndefined();
    // Rival sentiment soured.
    const rivalEdge = result.state.graph.getOutgoingEdges('faction-iron', 'relates_to')[0];
    expect(rivalEdge.properties.sentiment as number).toBeCloseTo(-0.65);

    const trace = getTraces().find(t => t.category === 'ascendant.signature.warhost');
    expect((trace as { forceMode?: string }).forceMode).toBe('sentiment_fallback');
    expect((trace as { sentimentShiftedRelations?: number }).sentimentShiftedRelations).toBe(1);
  });

  it('no-ops on a dissolved faction (warn trace, no mobilization)', () => {
    const state = buildState();
    state.graph.getNode('faction-iron')!.properties.actorStatus = 'dissolved';
    const reaction = makeReaction([{ kind: 'signature_warhost', factionId: 'faction-iron', leaderAgentId: 'leader-1' }]);
    const result = apply(state, reaction, runtime);
    expect(result.state.graph.getNode('faction-iron')!.properties.mobilized).toBeUndefined();
    const trace = getTraces().find(t => t.category === 'ascendant.signature.warhost');
    expect((trace as { success?: boolean }).success).toBe(false);
    expect((trace as { failReason?: string }).failReason).toBe('faction_dissolved');
  });

  it('no-ops on a missing faction', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'signature_warhost', factionId: 'faction-nonexistent', leaderAgentId: 'leader-1' }]);
    const result = apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'ascendant.signature.warhost');
    expect((trace as { success?: boolean }).success).toBe(false);
    expect((trace as { failReason?: string }).failReason).toBe('faction_missing');
  });
});
