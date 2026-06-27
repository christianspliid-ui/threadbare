import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseAscendantBeatDirector,
  createInitialAscendantBeatState,
  isTriggerSatisfied,
  drawFromPool,
  resolveAscendantBeat,
  forceOfferBeatById,
} from '../ascendantBeat';
import { ASCENDANT_SPINE } from '../../data/ascendant-beat-content';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { TRACE_CATEGORIES } from '../../types/trace';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState, BeatDefinition } from '../../types/ascendantBeat';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

// ─── Director fixtures ───────────────────────────────────────────────────────

function directorState(tick: number, beats: AscendantBeatState | undefined, graph?: WorldGraph): GameState {
  return {
    tick,
    seed: 42,
    ascendantId: 'asc-1',
    graph: graph ?? new WorldGraph(),
    ascendantBeats: beats,
  } as unknown as GameState;
}

// ─── Aftermath fixtures (mirrors encounterAftermath-*.test.ts) ───────────────

function buildAftermathState(unlocked?: readonly string[]): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Eira', properties: { actorType: 'individual' } });
  return {
    tick: 40,
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
    unlockedActionIds: unlocked,
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    encounterNotifications: [],
    clearanceGateStates: new Map(),
    archetypeDrift: [],
  } as unknown as GameState;
}

function makeAction(actorId = 'actor-1'): UnifiedAction {
  return {
    actionId: 'ua_unlock_test',
    actorId,
    templateId: 'encounter.test.unlock',
    targetId: actorId,
    scale: 'personal',
    source: 'agent',
    startTick: 1,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    stepOutcomes: [],
  };
}

function makeReaction(effect: EncounterAftermathReactionEffect): EncounterAftermathReaction {
  return { id: 'rx-unlock', label: 'Grant Boon', effects: [effect] };
}

describe('Ascendant Beat Director (THR-500)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('offers the first spine beat once its turn trigger is satisfied', () => {
    const result = phaseAscendantBeatDirector(directorState(1, createInitialAscendantBeatState()), () => 0.5);
    const beats = result.ascendantBeats;
    expect(beats?.pending?.beatId).toBe(ASCENDANT_SPINE[0].beatId);
    expect(beats?.spineCursor).toBe(1); // advanced past the offered beat
    expect(beats?.lastBeatTurn).toBe(1);

    const cats = getTraces().map(t => t.category);
    expect(cats).toContain('ascendant.beat.scheduled');
    expect(cats).toContain('ascendant.beat.offered');
  });

  it('no-ops while a beat is already pending (max-one-pending) and emits a skip', () => {
    const offered = phaseAscendantBeatDirector(
      directorState(1, createInitialAscendantBeatState()), () => 0.5,
    ).ascendantBeats!;
    clearTraces();

    const result = phaseAscendantBeatDirector(directorState(2, offered), () => 0.5);
    expect(result.ascendantBeats).toBeUndefined(); // returned {} — no state change

    const skip = getTraces().find(t => t.category === 'ascendant.beat.skipped') as
      | { reason?: string } | undefined;
    expect(skip?.reason).toBe('pending');
  });

  it('fail-softs to {} when ascendantBeats is uninitialized', () => {
    const result = phaseAscendantBeatDirector(directorState(5, undefined), () => 0.5);
    expect(result).toEqual({});
  });

  it('holds the spine until its trigger turn (no early offer)', () => {
    // Advance cursor to a beat gated at turn >= 2, then probe at turn 1.
    const beats: AscendantBeatState = { ...createInitialAscendantBeatState(), spineCursor: 1, lastBeatTurn: 0 };
    const result = phaseAscendantBeatDirector(directorState(1, beats), () => 0.5);
    expect(result.ascendantBeats).toBeUndefined();
  });

  it('isTriggerSatisfied: turn gate and first_bonded gate', () => {
    const plain = directorState(3, createInitialAscendantBeatState());
    expect(isTriggerSatisfied({ kind: 'turn', minTurn: 2 }, plain, 3)).toBe(true);
    expect(isTriggerSatisfied({ kind: 'turn', minTurn: 5 }, plain, 3)).toBe(false);

    // first_bonded false with no thread edge
    expect(isTriggerSatisfied({ kind: 'first_bonded' }, plain, 3)).toBe(false);

    // first_bonded true once a the_first thread edge exists
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc-1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'mortal-1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
    graph.addEdge({
      id: 'edge-thread-1', source: 'asc-1', target: 'mortal-1', type: 'thread',
      properties: { courtPosition: 'the_first', tier: 1 },
    });
    const bonded = directorState(3, createInitialAscendantBeatState(), graph);
    expect(isTriggerSatisfied({ kind: 'first_bonded' }, bonded, 3)).toBe(true);
  });

  it('drawFromPool is deterministic and weight-respecting', () => {
    const pool: BeatDefinition[] = [
      { beatId: 'a', kind: 'investment', trigger: { kind: 'cadence' } },
      { beatId: 'b', kind: 'investment', trigger: { kind: 'cadence' } },
    ];
    // equal kind weights (4 each) → total 8; roll = rng*8
    expect(drawFromPool(pool, () => 0.1)?.beatId).toBe('a'); // 0.8 < 4
    expect(drawFromPool(pool, () => 0.9)?.beatId).toBe('b'); // 7.2 > 4
    expect(drawFromPool([], () => 0.5)).toBeNull();
  });

  it('resolveAscendantBeat clears pending, appends history, emits resolved trace', () => {
    const offered = phaseAscendantBeatDirector(
      directorState(1, createInitialAscendantBeatState()), () => 0.5,
    ).ascendantBeats!;
    clearTraces();

    const resolved = resolveAscendantBeat(offered, {
      outcome: 'triumph',
      grantedActionIds: ['divine.dream'],
      turn: 3,
    });
    expect(resolved.pending).toBeNull();
    expect(resolved.history).toHaveLength(1);
    expect(resolved.history[0].outcome).toBe('triumph');
    expect(resolved.history[0].grantedActionIds).toEqual(['divine.dream']);

    const resolvedTrace = getTraces().find(t => t.category === 'ascendant.beat.resolved');
    expect(resolvedTrace).toBeDefined();
  });

  it('resolveAscendantBeat is a no-op when nothing is pending', () => {
    const beats = createInitialAscendantBeatState();
    expect(resolveAscendantBeat(beats, { outcome: 'x', turn: 1 })).toBe(beats);
  });
});

describe('forceOfferBeatById — debug fireBeat (THR-507)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('force-offers a spine beat headlessly and emits scheduled + offered traces', () => {
    const beats = createInitialAscendantBeatState();
    const result = forceOfferBeatById(beats, ASCENDANT_SPINE[0].beatId, 5);
    expect(result).not.toBeNull();
    expect(result!.next.pending?.beatId).toBe(ASCENDANT_SPINE[0].beatId);
    expect(result!.next.lastBeatTurn).toBe(5);
    const cats = getTraces().map(t => t.category);
    expect(cats).toContain('ascendant.beat.scheduled');
    expect(cats).toContain('ascendant.beat.offered');
  });

  it('advances the spine cursor only when firing the beat the cursor points at', () => {
    const atCursor = forceOfferBeatById(createInitialAscendantBeatState(), ASCENDANT_SPINE[0].beatId, 1);
    expect(atCursor!.next.spineCursor).toBe(1); // advanced past offered beat

    // Firing a later spine beat while the cursor is still at 0 must not corrupt the cursor.
    const aheadOfCursor = forceOfferBeatById(createInitialAscendantBeatState(), ASCENDANT_SPINE[2].beatId, 1);
    expect(aheadOfCursor!.next.pending?.beatId).toBe(ASCENDANT_SPINE[2].beatId);
    expect(aheadOfCursor!.next.spineCursor).toBe(0); // unchanged
  });

  it('returns null for an unknown beat id', () => {
    expect(forceOfferBeatById(createInitialAscendantBeatState(), 'beat.does.not.exist', 1)).toBeNull();
  });
});

describe('unlock_action aftermath effect (THR-500)', () => {
  let runtime: SimulationRuntime;

  beforeEach(() => {
    clearTraces();
    enableTracing();
    runtime = createSimulationRuntime();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('grows unlockedActionIds and emits action.unlock.granted', () => {
    const result = applyEncounterAftermathReaction(
      buildAftermathState(),
      makeAction(),
      makeReaction({ kind: 'unlock_action', actionId: 'invest.endow_artifact', revealStyle: 'card_flight' }),
      41,
      runtime,
    );
    expect(result.state.unlockedActionIds).toContain('invest.endow_artifact');
    expect(result.mutationSummary.touchedWorld).toBe(true);

    const grant = getTraces().find(t => t.category === 'action.unlock.granted') as
      | { actionId?: string; via?: string } | undefined;
    expect(grant?.actionId).toBe('invest.endow_artifact');
    expect(grant?.via).toBe('beat');
  });

  it('is idempotent — granting an already-unlocked action does not duplicate', () => {
    const result = applyEncounterAftermathReaction(
      buildAftermathState(['invest.endow_artifact']),
      makeAction(),
      makeReaction({ kind: 'unlock_action', actionId: 'invest.endow_artifact' }),
      41,
      runtime,
    );
    const count = (result.state.unlockedActionIds ?? []).filter(id => id === 'invest.endow_artifact').length;
    expect(count).toBe(1);
  });
});

describe('TRACE_CATEGORIES registration (THR-500)', () => {
  it('registers all five new beat trace categories', () => {
    for (const cat of [
      'ascendant.beat.scheduled',
      'ascendant.beat.offered',
      'ascendant.beat.skipped',
      'ascendant.beat.resolved',
      'action.unlock.granted',
    ]) {
      expect(TRACE_CATEGORIES).toContain(cat);
    }
  });
});
