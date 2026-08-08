/**
 * THR-1025: the `$actor` scene-targeting sentinel.
 *
 * `$actor` is the established reference token everywhere else in the codebase
 * (`resolveRef` in `src/types/graphOp.ts` maps it for every GraphOp), and content
 * authored `targetAgentId: '$actor'` on aftermath effects accordingly. But
 * `bindAftermathSceneTargets` knew only `$target` and `$cast:`, so `$actor` passed
 * through unbound and was consumed downstream as a literal node id — producing
 * `Source node not found: $actor` 51 times in a 900-tick seed-42 medium run, once per
 * step of every encounter seeded by one of the three affected slice reactions.
 *
 * Covers:
 *  - bindAftermathSceneTargets: $actor binds to action.actorId, kind-matched, fail-soft
 *  - encounter_seed end-to-end: the planted seed carries a real id, never the token
 *  - evaluateEncounterSeeds: a seed pointed at a node that does not exist is discarded
 *    rather than spawned as a phantom action
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  applyEncounterAftermathReaction,
  bindAftermathSceneTargets,
} from '../encounterAftermath';
import { evaluateEncounterSeeds } from '../encounterSeeding';
import { createSimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  PendingEncounterSeed,
  UnifiedAction,
} from '../../types/unifiedAction';

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual', reputationScore: 0.5 } });
  graph.addNode({ id: 'actor-victim', type: 'actor', name: 'Victim', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'faction-guild', type: 'actor', name: 'Guild', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'loc-town', type: 'location', name: 'Town', properties: { hexCol: 1, hexRow: 1 } });
  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
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
  } as unknown as GameState;
}

function makeAction(opts?: { actorId?: string; targetId?: string }): UnifiedAction {
  const actorId = opts?.actorId ?? 'actor-hero';
  return {
    actionId: 'ua_test', actorId, templateId: 'enc.test',
    targetId: opts?.targetId ?? actorId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as unknown as UnifiedAction;
}

// ─── bindAftermathSceneTargets ─────────────────────────────────────────────────

describe('bindAftermathSceneTargets — $actor', () => {
  it('binds $actor on targetAgentId to the acting agent', () => {
    const graph = buildState().graph;
    const effect = {
      kind: 'hidden_mark', targetAgentId: '$actor', category: 'betrayal', severity: 0.5, label: 'x',
    } as unknown as EncounterAftermathReactionEffect;

    const bound = bindAftermathSceneTargets(
      effect,
      makeAction({ actorId: 'actor-hero', targetId: 'actor-victim' }),
      graph,
    ) as unknown as { targetAgentId: string };

    // The pre-fix behaviour was the literal token surviving this call.
    expect(bound.targetAgentId).toBe('actor-hero');
    expect(bound.targetAgentId).not.toBe('$actor');
  });

  it('resolves $actor and $target to different agents on the same effect vocabulary', () => {
    const graph = buildState().graph;
    const action = makeAction({ actorId: 'actor-hero', targetId: 'actor-victim' });

    const actorEffect = bindAftermathSceneTargets(
      { kind: 'hidden_mark', targetAgentId: '$actor', category: 'betrayal', severity: 0.5, label: 'x' } as unknown as EncounterAftermathReactionEffect,
      action, graph,
    ) as unknown as { targetAgentId: string };
    const targetEffect = bindAftermathSceneTargets(
      { kind: 'hidden_mark', targetAgentId: '$target', category: 'betrayal', severity: 0.5, label: 'x' } as unknown as EncounterAftermathReactionEffect,
      action, graph,
    ) as unknown as { targetAgentId: string };

    expect(actorEffect.targetAgentId).toBe('actor-hero');
    expect(targetEffect.targetAgentId).toBe('actor-victim');
  });

  it('leaves $actor in place on a kind-mismatched field (fail-soft, NFP #4)', () => {
    const graph = buildState().graph;
    // targetFactionId expects a faction; the actor is an individual, so the bind must not fire.
    const effect = {
      kind: 'faction_reputation', targetFactionId: '$actor', delta: 0.1,
    } as unknown as EncounterAftermathReactionEffect;

    const bound = bindAftermathSceneTargets(effect, makeAction(), graph) as unknown as { targetFactionId: string };
    expect(bound.targetFactionId).toBe('$actor');
  });

  it('leaves $actor in place when there is no action to bind against', () => {
    const graph = buildState().graph;
    const effect = {
      kind: 'hidden_mark', targetAgentId: '$actor', category: 'betrayal', severity: 0.5, label: 'x',
    } as unknown as EncounterAftermathReactionEffect;

    const bound = bindAftermathSceneTargets(effect, undefined, graph) as unknown as { targetAgentId: string };
    expect(bound.targetAgentId).toBe('$actor');
  });
});

// ─── encounter_seed end-to-end ─────────────────────────────────────────────────

describe('encounter_seed — $actor reaches the seed as a real node id', () => {
  it('plants a seed carrying the acting agent id, not the literal token', () => {
    const state = buildState();
    const runtime = createSimulationRuntime();
    const reaction = {
      id: 'test.reaction.seed_on_actor',
      label: 'Watch them go',
      effects: [
        {
          kind: 'encounter_seed',
          templateId: 'encounter.slice.swindler_found',
          targetAgentId: '$actor',
          delayTicks: 5,
          seedLabel: 'The man who sold the paper is still working.',
        },
      ],
    } as unknown as EncounterAftermathReaction;

    const { state: next } = applyEncounterAftermathReaction(
      state, makeAction({ actorId: 'actor-hero', targetId: 'actor-victim' }), reaction, 10, runtime,
    );

    const seeds = next.pendingEncounterSeeds ?? [];
    expect(seeds).toHaveLength(1);
    // This is the assertion that fails pre-fix: the seed carried the string '$actor',
    // which evaluateEncounterSeeds then used as the spawned action's actorId.
    expect(seeds[0].targetAgentId).toBe('actor-hero');
    expect(seeds[0].targetAgentId).not.toBe('$actor');
  });
});

// ─── evaluateEncounterSeeds guard ──────────────────────────────────────────────

describe('evaluateEncounterSeeds — orphaned-target guard', () => {
  function seedFor(targetAgentId: string): PendingEncounterSeed {
    return {
      seedId: 'seed_test_1',
      sourceEncounterId: 'enc.test',
      sourceReactionId: 'r1',
      templateId: 'encounter.slice.swindler_found',
      targetAgentId,
      eligibleAfterTick: 10,
      priority: 1,
      seedLabel: 'a thread',
      plantedTick: 5,
    } as unknown as PendingEncounterSeed;
  }

  it('discards a seed whose target is not a live node instead of spawning a phantom action', () => {
    const state = buildState();
    state.pendingEncounterSeeds = [seedFor('$actor')];
    const runtime = createSimulationRuntime();

    const next = evaluateEncounterSeeds(state, 12, () => 0.5, runtime);

    // No action spawned onto the phantom id, and the seed is consumed rather than retried.
    expect(next.unifiedActions.some(a => a.actorId === '$actor')).toBe(false);
    expect(next.pendingEncounterSeeds ?? []).toHaveLength(0);
    expect(next.tickEvents.some(e => e.id === 'seed_test_1_orphaned')).toBe(true);
  });

  it('still spawns normally for a seed whose target is a live node', () => {
    const state = buildState();
    state.pendingEncounterSeeds = [seedFor('actor-hero')];
    const runtime = createSimulationRuntime();

    const next = evaluateEncounterSeeds(state, 12, () => 0.5, runtime);

    expect(next.tickEvents.some(e => e.id === 'seed_test_1_orphaned')).toBe(false);
    expect(next.pendingEncounterSeeds ?? []).toHaveLength(0);
  });
});
