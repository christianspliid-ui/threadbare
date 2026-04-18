/**
 * THR-167: faction_reputation_gain aftermath effect + tally key validation.
 *
 * Test cases per plan doc §6:
 * 1. faction_reputation_gain grows member_of.reputation and fires faction_reputation trace.
 * 2. Gain crossing a rank tier sets promotionPending: true on the edge.
 * 3. Invalid tally key emits aftermath_invalid_tally_key and does NOT mutate reputationTallies.
 * 4. Valid tally key writes through (no regression on existing content).
 * 5. Rate limit: 51st invalid key in one tick emits a rate-limited summary trace, not a per-key trace.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction, INVALID_TALLY_KEY_TRACE_RATE_LIMIT } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function buildState(tick = 50): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'faction.adventuring-guild', type: 'actor', name: 'Adventurers Guild', properties: { actorType: 'faction', actorStatus: 'active' } });
  // member_of edge with a known factionDefId so rank tiers are available
  graph.addEdge({
    id: 'hero_guild_member',
    source: 'agent-hero',
    target: 'faction.adventuring-guild',
    type: 'member_of',
    properties: {
      factionDefId: 'adventuring_guild',
      reputation: 0.1,
      role: 'journeyman',
    },
  });
  return {
    tick, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
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

function makeAction(actorId = 'agent-hero'): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId: 'enc.test', targetId: actorId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  };
}

function makeReaction(effects: EncounterAftermathReactionEffect[]): EncounterAftermathReaction {
  return { id: 'rx-test', label: 'Test Reaction', effects } as EncounterAftermathReaction;
}

function apply(state: GameState, reaction: EncounterAftermathReaction, runtime: SimulationRuntime, tick?: number) {
  return applyEncounterAftermathReaction(state, makeAction(), reaction, tick ?? state.tick, runtime);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('faction_reputation_gain effect', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('grows member_of.reputation and fires faction_reputation trace', () => {
    const state = buildState(50);
    const result = apply(state, makeReaction([{
      kind: 'faction_reputation_gain',
      factionId: 'faction.adventuring-guild',
      amount: 0.15,
    }]), runtime, 50);

    const edge = result.state.graph.getAllEdges().find(
      e => e.source === 'agent-hero' && e.target === 'faction.adventuring-guild' && e.type === 'member_of',
    );
    expect(edge?.properties?.reputation).toBeCloseTo(0.25, 5);

    const traces = getTraces();
    expect(traces.some(t => t.category === 'faction_reputation')).toBe(true);
    expect(traces.some(t => t.category === 'encounter_aftermath_effect' && (t as { effectKind?: string }).effectKind === 'faction_reputation_gain' && (t as { success?: boolean }).success === true)).toBe(true);
  });

  it('sets promotionPending when gain crosses a rank tier boundary', () => {
    // adventuring_guild: journeyman 0.0, sergeant 0.3 — start at 0.25, gain 0.1 → crosses 0.3
    const state = buildState(51);
    const edge = state.graph.getAllEdges().find(e => e.type === 'member_of');
    expect(edge).toBeDefined();
    edge!.properties = { ...edge!.properties, reputation: 0.25 };

    const result = apply(state, makeReaction([{
      kind: 'faction_reputation_gain',
      factionId: 'faction.adventuring-guild',
      amount: 0.1,
    }]), runtime, 51);

    const updatedEdge = result.state.graph.getAllEdges().find(
      e => e.source === 'agent-hero' && e.target === 'faction.adventuring-guild' && e.type === 'member_of',
    );
    expect(updatedEdge?.properties?.rankChanged ?? updatedEdge?.properties?.promotionPending).toBeTruthy();
    const traces = getTraces();
    const factionTrace = traces.find(t => t.category === 'faction_reputation') as Record<string, unknown> | undefined;
    expect(factionTrace?.rankChanged).toBe(true);
  });
});

describe('reputation_tally key validation', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('invalid key emits aftermath_invalid_tally_key and does NOT write to reputationTallies', () => {
    const state = buildState(52);
    const node = state.graph.getNode('agent-hero')!;
    node.properties.reputationTallies = {};

    apply(state, makeReaction([{
      kind: 'reputation_tally',
      key: 'bf.master_craft',
      delta: 1,
    }]), runtime, 52);

    // Tally must not have been written
    expect((node.properties.reputationTallies as Record<string, number>)['bf.master_craft']).toBeUndefined();
    // Invalid-key trace must have been emitted
    const traces = getTraces();
    expect(traces.some(t => t.category === 'aftermath_invalid_tally_key')).toBe(true);
    const invalidTrace = traces.find(t => t.category === 'aftermath_invalid_tally_key') as Record<string, unknown> | undefined;
    expect(invalidTrace?.key).toBe('bf.master_craft');
    expect(invalidTrace?.suggestedReplacement).toContain('faction_reputation_gain');
  });

  it('valid key writes through without emitting invalid_tally_key trace', () => {
    const state = buildState(53);
    const node = state.graph.getNode('agent-hero')!;
    node.properties.reputationTallies = {};

    apply(state, makeReaction([{
      kind: 'reputation_tally',
      key: 'iron.positive',
      delta: 2,
    }]), runtime, 53);

    expect((node.properties.reputationTallies as Record<string, number>)['iron.positive']).toBe(2);
    const traces = getTraces();
    expect(traces.some(t => t.category === 'aftermath_invalid_tally_key')).toBe(false);
  });

  it('rate limit: 51st invalid key emits rate-limited summary, not a per-key trace', () => {
    const state = buildState(99);
    const node = state.graph.getNode('agent-hero')!;
    node.properties.reputationTallies = {};

    for (let i = 0; i < INVALID_TALLY_KEY_TRACE_RATE_LIMIT + 1; i++) {
      apply(state, makeReaction([{
        kind: 'reputation_tally',
        key: 'bf.master_craft',
        delta: 1,
      }]), runtime, 99);
    }

    const traces = getTraces();
    const perKeyTraces = traces.filter(t => t.category === 'aftermath_invalid_tally_key');
    const rateLimitedTraces = traces.filter(t => t.category === 'aftermath_invalid_tally_key_rate_limited');

    expect(perKeyTraces.length).toBe(INVALID_TALLY_KEY_TRACE_RATE_LIMIT);
    expect(rateLimitedTraces.length).toBe(1);
  });
});
