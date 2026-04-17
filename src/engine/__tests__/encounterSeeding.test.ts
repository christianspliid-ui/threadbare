import { describe, expect, it, vi, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { evaluateEncounterSeeds } from '../encounterSeeding';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import type { GameState } from '../../types/gameState';
import type { PendingEncounterSeed, EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

// Deterministic test RNG
function testRng(): () => number {
  let seed = 42;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function createMinimalGameState(overrides?: Partial<GameState>): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1',
    type: 'actor',
    name: 'Ashara',
    properties: { actorType: 'individual' },
  });

  return {
    tick: 20,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as never,
    tiles: [],
    clock: {} as never,
    ascendantId: 'asc-1',
    essencePool: {} as never,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as never,
    doomClock: {} as never,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as never,
    familiarityMap: {} as never,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    pendingEncounterSeeds: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    encounterNotifications: [],
    clearanceGateStates: new Map(),
    ...overrides,
  } as GameState;
}

function makeSeed(overrides?: Partial<PendingEncounterSeed>): PendingEncounterSeed {
  return {
    seedId: 'seed_test_1',
    sourceEncounterId: 'broker.quest.rival_shrine_betrayal',
    sourceReactionId: 'accept_react_spend_intelligence',
    encounterFamily: 'broker.quest',
    targetAgentId: 'actor-1',
    eligibleAfterTick: 30,
    priority: 1.0,
    seedLabel: 'Test encounter seed',
    plantedTick: 15,
    ...overrides,
  };
}

describe('evaluateEncounterSeeds', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
  });

  it('returns state unchanged when pendingEncounterSeeds is empty', () => {
    const state = createMinimalGameState({ pendingEncounterSeeds: [] });
    const result = evaluateEncounterSeeds(state, 50, testRng());
    expect(result).toBe(state);
  });

  it('returns state unchanged when pendingEncounterSeeds is undefined', () => {
    const state = createMinimalGameState({ pendingEncounterSeeds: undefined });
    const result = evaluateEncounterSeeds(state, 50, testRng());
    expect(result).toBe(state);
  });

  it('keeps seeds that are not yet eligible (tick < eligibleAfterTick)', () => {
    const seed = makeSeed({ eligibleAfterTick: 100 });
    const state = createMinimalGameState({ pendingEncounterSeeds: [seed] });
    const result = evaluateEncounterSeeds(state, 50, testRng());

    // No events should be emitted
    expect(result.tickEvents).toHaveLength(0);
    // Seed should remain pending
    expect(result.pendingEncounterSeeds).toHaveLength(1);
    expect(result.pendingEncounterSeeds![0].seedId).toBe('seed_test_1');
  });

  it('returns state identity when no seeds are eligible', () => {
    const seed = makeSeed({ eligibleAfterTick: 100 });
    const state = createMinimalGameState({ pendingEncounterSeeds: [seed] });
    const result = evaluateEncounterSeeds(state, 50, testRng());

    // When no eligible seeds, should return the original state object
    expect(result).toBe(state);
  });

  it('spawns a unified action when seed has templateId and template exists', () => {
    // Use a real template ID from the registry
    const seed = makeSeed({
      templateId: 'broker.quest.rival_shrine_betrayal',
      eligibleAfterTick: 20,
      encounterFamily: undefined,
    });
    const state = createMinimalGameState({ pendingEncounterSeeds: [seed] });
    const result = evaluateEncounterSeeds(state, 25, testRng());

    // Should have created an action
    expect(result.unifiedActions.length).toBeGreaterThan(0);
    const newAction = result.unifiedActions[result.unifiedActions.length - 1];
    expect(newAction.actorId).toBe('actor-1');
    expect(newAction.templateId).toBe('broker.quest.rival_shrine_betrayal');
    expect(newAction.source).toBe('system');

    // Seed should be consumed (removed from pending)
    expect(result.pendingEncounterSeeds).toHaveLength(0);

    // Should emit a spawn event
    const spawnEvent = result.tickEvents.find(e => e.id.includes('_spawned'));
    expect(spawnEvent).toBeDefined();
    expect(spawnEvent!.message).toContain('bears fruit');
    expect(spawnEvent!.actorId).toBe('actor-1');
  });

  it('keeps seed for next tick when agent is busy (has active action)', () => {
    const seed = makeSeed({
      templateId: 'broker.quest.rival_shrine_betrayal',
      eligibleAfterTick: 20,
      encounterFamily: undefined,
    });
    const busyAction: UnifiedAction = {
      actionId: 'ua_busy',
      actorId: 'actor-1',
      templateId: 'some.other.action',
      targetId: 'target-1',
      scale: 'personal',
      source: 'agent',
      startTick: 18,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 5,
      resolved: false,
      stepOutcomes: [],
    };
    const state = createMinimalGameState({
      pendingEncounterSeeds: [seed],
      unifiedActions: [busyAction],
    });
    const result = evaluateEncounterSeeds(state, 25, testRng());

    // Seed should remain pending (agent is busy)
    expect(result.pendingEncounterSeeds).toHaveLength(1);
    expect(result.pendingEncounterSeeds![0].seedId).toBe('seed_test_1');

    // No new actions spawned
    expect(result.unifiedActions).toHaveLength(1); // only the existing busy action
  });

  it('emits fail-soft event when seed has templateId but template not found', () => {
    const seed = makeSeed({
      templateId: 'nonexistent.template.id',
      eligibleAfterTick: 20,
      encounterFamily: undefined,
    });
    const state = createMinimalGameState({ pendingEncounterSeeds: [seed] });
    const result = evaluateEncounterSeeds(state, 25, testRng());

    // Seed should be consumed (fail-soft — removed, not retried)
    expect(result.pendingEncounterSeeds).toHaveLength(0);

    // Should emit an expired event
    const expiredEvent = result.tickEvents.find(e => e.id.includes('_expired'));
    expect(expiredEvent).toBeDefined();
    expect(expiredEvent!.message).toContain('withered');
    expect(expiredEvent!.significance).toBe(0.3);
  });

  it('emits narrative event when seed has encounterFamily only', () => {
    const seed = makeSeed({
      templateId: undefined,
      encounterFamily: 'broker.quest',
      eligibleAfterTick: 20,
    });
    const state = createMinimalGameState({ pendingEncounterSeeds: [seed] });
    const result = evaluateEncounterSeeds(state, 25, testRng());

    // Seed should be consumed
    expect(result.pendingEncounterSeeds).toHaveLength(0);

    // Should emit a family-ready event
    const familyEvent = result.tickEvents.find(e => e.id.includes('_family_ready'));
    expect(familyEvent).toBeDefined();
    expect(familyEvent!.message).toContain('broker.quest');
    expect(familyEvent!.message).toContain('stirring');
    expect(familyEvent!.significance).toBe(0.55);
    expect(familyEvent!.actorId).toBe('actor-1');
  });

  it('emits fail-soft expired event when seed has neither templateId nor family', () => {
    const seed = makeSeed({
      templateId: undefined,
      encounterFamily: undefined,
      eligibleAfterTick: 20,
    });
    const state = createMinimalGameState({ pendingEncounterSeeds: [seed] });
    const result = evaluateEncounterSeeds(state, 25, testRng());

    // Seed should be consumed
    expect(result.pendingEncounterSeeds).toHaveLength(0);

    // Should emit an expired event
    const expiredEvent = result.tickEvents.find(e => e.id.includes('_expired'));
    expect(expiredEvent).toBeDefined();
    expect(expiredEvent!.message).toContain('withered');
    expect(expiredEvent!.actorId).toBe('actor-1');
  });

  it('correctly partitions multiple seeds with mixed eligibility', () => {
    const eligibleFamilySeed = makeSeed({
      seedId: 'seed_eligible_family',
      encounterFamily: 'shadow.quest',
      templateId: undefined,
      eligibleAfterTick: 20,
    });
    const notYetEligibleSeed = makeSeed({
      seedId: 'seed_not_yet',
      eligibleAfterTick: 100,
    });
    const eligibleExpiredSeed = makeSeed({
      seedId: 'seed_eligible_expired',
      templateId: undefined,
      encounterFamily: undefined,
      eligibleAfterTick: 10,
    });

    const state = createMinimalGameState({
      pendingEncounterSeeds: [eligibleFamilySeed, notYetEligibleSeed, eligibleExpiredSeed],
    });
    const result = evaluateEncounterSeeds(state, 50, testRng());

    // Only the not-yet-eligible seed should remain
    expect(result.pendingEncounterSeeds).toHaveLength(1);
    expect(result.pendingEncounterSeeds![0].seedId).toBe('seed_not_yet');

    // Should have emitted events for both eligible seeds
    expect(result.tickEvents).toHaveLength(2);
    const familyEvent = result.tickEvents.find(e => e.id.includes('seed_eligible_family'));
    const expiredEvent = result.tickEvents.find(e => e.id.includes('seed_eligible_expired'));
    expect(familyEvent).toBeDefined();
    expect(expiredEvent).toBeDefined();
  });

  it('populates recentEvents alongside tickEvents', () => {
    const seed = makeSeed({
      templateId: undefined,
      encounterFamily: 'broker.quest',
      eligibleAfterTick: 20,
    });
    const state = createMinimalGameState({ pendingEncounterSeeds: [seed] });
    const result = evaluateEncounterSeeds(state, 25, testRng());

    expect(result.recentEvents).toHaveLength(1);
    expect(result.recentEvents[0].id).toContain('family_ready');
  });
});

describe('applyEncounterAftermathReaction with encounter_seed effect', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { runtime = createSimulationRuntime(); });
  it('plants a seed into pendingEncounterSeeds', () => {
    const state = createMinimalGameState({ pendingEncounterSeeds: [] });
    const action: UnifiedAction = {
      actionId: 'ua_test',
      actorId: 'actor-1',
      templateId: 'broker.quest.rival_shrine_betrayal',
      targetId: 'loc-1',
      scale: 'personal',
      source: 'agent',
      startTick: 10,
      currentStep: 1,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success', 'success'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'test_reaction',
      label: 'Test reaction with seed',
      effects: [
        {
          kind: 'encounter_seed',
          encounterFamily: 'broker.quest',
          delayTicks: 15,
          priority: 1.2,
          seedLabel: 'The rival shrine confrontation',
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 20, runtime);

    // Seed should be added
    expect(updated.pendingEncounterSeeds).toHaveLength(1);
    const seed = updated.pendingEncounterSeeds![0];
    expect(seed.seedId).toContain('ua_test');
    expect(seed.seedId).toContain('test_reaction');
    expect(seed.sourceEncounterId).toBe('broker.quest.rival_shrine_betrayal');
    expect(seed.sourceReactionId).toBe('test_reaction');
    expect(seed.encounterFamily).toBe('broker.quest');
    expect(seed.targetAgentId).toBe('actor-1');
    expect(seed.eligibleAfterTick).toBe(35); // tick 20 + 15 delay
    expect(seed.priority).toBe(1.2);
    expect(seed.seedLabel).toBe('The rival shrine confrontation');
    expect(seed.plantedTick).toBe(20);

    // Should also emit a planted narrative event
    const plantedEvent = updated.tickEvents.find(e => e.id.includes('_planted'));
    expect(plantedEvent).toBeDefined();
    expect(plantedEvent!.message).toContain('thread has been planted');
    expect(plantedEvent!.message).toContain('The rival shrine confrontation');
  });

  it('appends seeds to existing pendingEncounterSeeds', () => {
    const existingSeed: PendingEncounterSeed = {
      seedId: 'seed_existing',
      sourceEncounterId: 'some.encounter',
      sourceReactionId: 'some_reaction',
      encounterFamily: 'some.family',
      targetAgentId: 'actor-1',
      eligibleAfterTick: 50,
      priority: 1.0,
      seedLabel: 'Existing seed',
      plantedTick: 5,
    };
    const state = createMinimalGameState({ pendingEncounterSeeds: [existingSeed] });
    const action: UnifiedAction = {
      actionId: 'ua_test_2',
      actorId: 'actor-1',
      templateId: 'test.template',
      targetId: 'loc-1',
      scale: 'personal',
      source: 'agent',
      startTick: 10,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'reaction_new',
      label: 'New reaction',
      effects: [
        {
          kind: 'encounter_seed',
          encounterFamily: 'new.family',
          delayTicks: 10,
          seedLabel: 'New seed',
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 20, runtime);
    expect(updated.pendingEncounterSeeds).toHaveLength(2);
    expect(updated.pendingEncounterSeeds![0].seedId).toBe('seed_existing');
    expect(updated.pendingEncounterSeeds![1].seedLabel).toBe('New seed');
  });

  it('uses targetAgentId from effect when provided', () => {
    const state = createMinimalGameState({ pendingEncounterSeeds: [] });
    const action: UnifiedAction = {
      actionId: 'ua_target_test',
      actorId: 'actor-1',
      templateId: 'test.template',
      targetId: 'loc-1',
      scale: 'personal',
      source: 'agent',
      startTick: 10,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'reaction_target',
      label: 'Targeted reaction',
      effects: [
        {
          kind: 'encounter_seed',
          targetAgentId: 'actor-other',
          encounterFamily: 'test.family',
          delayTicks: 10,
          seedLabel: 'Targeted seed',
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 20, runtime);
    expect(updated.pendingEncounterSeeds![0].targetAgentId).toBe('actor-other');
  });

  it('defaults priority to 1.0 when not provided', () => {
    const state = createMinimalGameState({ pendingEncounterSeeds: [] });
    const action: UnifiedAction = {
      actionId: 'ua_priority_test',
      actorId: 'actor-1',
      templateId: 'test.template',
      targetId: 'loc-1',
      scale: 'personal',
      source: 'agent',
      startTick: 10,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'reaction_default_priority',
      label: 'Default priority reaction',
      effects: [
        {
          kind: 'encounter_seed',
          encounterFamily: 'test.family',
          delayTicks: 10,
          seedLabel: 'Default priority seed',
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 20, runtime);
    expect(updated.pendingEncounterSeeds![0].priority).toBe(1.0);
  });
});
