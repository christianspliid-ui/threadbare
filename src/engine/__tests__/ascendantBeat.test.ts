import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseAscendantBeatDirector,
  createInitialAscendantBeatState,
  isTriggerSatisfied,
  drawFromPool,
  resolveAscendantBeat,
  resolvePendingBeat,
  forceOfferBeatById,
  bindBeatSubject,
  resolveReachSignatureGrant,
  isBeatEligible,
} from '../ascendantBeat';
import type { ReachDomain } from '../../types/traits';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { ALL_DELIVERY_BEATS } from '../deliveryBeatAdapter';
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

describe('resolvePendingBeat — running-sim resolve path (THR-517)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  /** Build a GameState with the named beat already offered (pending) + an unlock set. */
  function pendingState(beatId: string, tick = 5, unlocked: readonly string[] = []): GameState {
    const offered = forceOfferBeatById(createInitialAscendantBeatState(), beatId, tick)!.next;
    const s = directorState(tick, offered);
    (s as { unlockedActionIds?: readonly string[] }).unlockedActionIds = unlocked;
    return s;
  }

  it('grants all of a non-selection beat, clears pending, records history + emits traces', () => {
    // beat.spine.opening grants bind_thread_agent + observe_agent
    const result = resolvePendingBeat(pendingState('beat.spine.opening', 5));
    expect(result.resolved).toBe(true);
    expect(result.state.unlockedActionIds).toEqual(
      expect.arrayContaining(['bind_thread_agent', 'observe_agent']),
    );
    expect(result.state.ascendantBeats?.pending).toBeNull();
    expect(result.state.ascendantBeats?.history).toHaveLength(1);
    expect(result.state.ascendantBeats?.history[0].grantedActionIds).toEqual([
      'bind_thread_agent',
      'observe_agent',
    ]);
    expect(result.state.ascendantBeats?.history[0].outcome).toBe('received');

    const cats = getTraces().map(t => t.category);
    expect(cats).toContain('action.unlock.granted');
    expect(cats).toContain('ascendant.beat.resolved');
  });

  it('selection beat: no choice is a no-op; a valid choice grants exactly that one', () => {
    // beat.pool.select.first_true_gift offers [bind_thread_agent, bind_thread_location, action.imbue]
    const state = pendingState('beat.pool.select.first_true_gift', 12);

    const noChoice = resolvePendingBeat(state);
    expect(noChoice.resolved).toBe(false);
    expect(noChoice.state.ascendantBeats?.pending).not.toBeNull(); // still pending — player must choose

    const chosen = resolvePendingBeat(state, { chosenActionId: 'action.imbue' });
    expect(chosen.resolved).toBe(true);
    expect(chosen.grantedActionIds).toEqual(['action.imbue']);
    expect(chosen.state.unlockedActionIds).toEqual(['action.imbue']);
    expect(chosen.state.ascendantBeats?.history[0].outcome).toBe('chosen');
  });

  it('selection beat rejects a choice outside the offered options', () => {
    const bad = resolvePendingBeat(
      pendingState('beat.pool.select.first_true_gift', 12),
      { chosenActionId: 'not.an.option' },
    );
    expect(bad.resolved).toBe(false);
    expect(bad.state.ascendantBeats?.pending).not.toBeNull();
  });

  it('does not duplicate an already-unlocked grant', () => {
    const result = resolvePendingBeat(pendingState('beat.spine.opening', 5, ['bind_thread_agent']));
    const count = (result.state.unlockedActionIds ?? []).filter(id => id === 'bind_thread_agent').length;
    expect(count).toBe(1);
  });

  it('no-ops cleanly when nothing is pending', () => {
    const state = directorState(3, createInitialAscendantBeatState());
    const result = resolvePendingBeat(state);
    expect(result.resolved).toBe(false);
    expect(result.beatId).toBeNull();
    expect(result.state).toBe(state);
  });

  it('fail-soft: an unknown pending beat clears + emits a missing_template skip (never wedges)', () => {
    const offered = forceOfferBeatById(createInitialAscendantBeatState(), 'beat.spine.opening', 5)!.next;
    const corrupted: AscendantBeatState = {
      ...offered,
      pending: { ...offered.pending!, beatId: 'beat.gone.missing' },
    };
    clearTraces();
    const result = resolvePendingBeat(directorState(5, corrupted));
    expect(result.resolved).toBe(false);
    expect(result.state.ascendantBeats?.pending).toBeNull(); // cleared, not wedged
    const skip = getTraces().find(t => t.category === 'ascendant.beat.skipped') as
      | { reason?: string } | undefined;
    expect(skip?.reason).toBe('missing_template');
  });

  it('fail-soft: a template-backed beat whose templateId fails the resolver is skipped', () => {
    // Delivery beats carry a templateId; simulate a missing source template via the resolver.
    if (ALL_DELIVERY_BEATS.length === 0) return; // no branching catalogue → nothing to assert
    const deliveryId = ALL_DELIVERY_BEATS[0].beatId;
    const state = pendingState(deliveryId, 20);
    clearTraces();
    const result = resolvePendingBeat(state, {}, () => false);
    expect(result.resolved).toBe(false);
    expect(result.state.ascendantBeats?.pending).toBeNull();
    const skip = getTraces().find(t => t.category === 'ascendant.beat.skipped') as
      | { reason?: string } | undefined;
    expect(skip?.reason).toBe('missing_template');
  });
});

describe('introduction-group binding + template aftermath (THR-522)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  function graphWithGroups(n: number): WorldGraph {
    const g = new WorldGraph();
    g.addNode({ id: 'asc-1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    for (let i = 0; i < n; i++) {
      const actorType = i % 2 === 0 ? 'culture' : 'faction';
      g.addNode({ id: `group-${i}`, type: 'actor', name: `Group ${i}`, properties: { actorType } });
    }
    return g;
  }

  const introBeat: BeatDefinition = {
    beatId: 'beat.pool.intro.first_stirring',
    kind: 'introduction',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'unintroduced_group' },
    templateId: 'beat.pool.intro.first_stirring',
  };

  it('bindBeatSubject picks the first un-introduced group; non-intro beats bind nothing', () => {
    const state = directorState(30, createInitialAscendantBeatState(), graphWithGroups(2));
    expect(bindBeatSubject(introBeat, state)).toEqual(['group-0']);
    // An investment beat (different eligibility) binds nothing.
    const investBeat: BeatDefinition = {
      beatId: 'b.invest', kind: 'investment', trigger: { kind: 'cadence' },
      eligibility: { kind: 'unthreaded_target' },
    };
    expect(bindBeatSubject(investBeat, state)).toEqual([]);
  });

  it('bindBeatSubject excludes a group already introduced in history', () => {
    const beats: AscendantBeatState = {
      spineCursor: -1, pending: null, lastBeatTurn: 0,
      history: [
        { beatId: 'x', kind: 'introduction', resolvedTurn: 1, outcome: 'ok', grantedActionIds: [], seededNodeIds: [], boundNodeIds: ['group-0'] },
      ],
    };
    const state = directorState(30, beats, graphWithGroups(2));
    expect(bindBeatSubject(introBeat, state)).toEqual(['group-1']);
  });

  it('a force-offered introduction beat carries the bound subject into PendingBeat.boundNodeIds', () => {
    const state = directorState(30, createInitialAscendantBeatState(), graphWithGroups(2));
    const offered = forceOfferBeatById(createInitialAscendantBeatState(), introBeat.beatId, 30, state);
    expect(offered!.next.pending?.boundNodeIds).toEqual(['group-0']);
  });

  it('resolution records the bound subject in the BeatRecord so later draws exclude it', () => {
    const graph = graphWithGroups(2);
    const offered = forceOfferBeatById(
      createInitialAscendantBeatState(), introBeat.beatId, 30,
      directorState(30, createInitialAscendantBeatState(), graph),
    )!.next;
    const state = directorState(30, offered, graph);
    const result = resolvePendingBeat(state);
    expect(result.resolved).toBe(true);
    expect(result.state.ascendantBeats?.history[0].boundNodeIds).toEqual(['group-0']);
    // The next bind now skips group-0.
    expect(bindBeatSubject(introBeat, result.state)).toEqual(['group-1']);
  });

  // ── Concern #1: matched-template aftermath runs on resolution ──────────────
  const aftermathTemplate = {
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: '', changes: [],
        reactions: [{
          id: 'rx-beat-aftermath', label: 'x',
          effects: [{ kind: 'unlock_action', actionId: 'beat.aftermath.extra' }],
        }],
      },
    },
  } as unknown as UnifiedActionTemplate;

  function pendingAftermathState(beatId: string, tick: number): GameState {
    const base = buildAftermathState();
    const offered = forceOfferBeatById(createInitialAscendantBeatState(), beatId, tick)!.next;
    return { ...base, tick, ascendantBeats: offered } as GameState;
  }

  it('runs the matched template aftermath (unlock_action) on resolution when runtime + provider supplied', () => {
    const runtime = createSimulationRuntime();
    const provider = (id: string) =>
      id === 'beat.pool.invest.the_worthy_mortal' ? aftermathTemplate : undefined;
    const result = resolvePendingBeat(
      pendingAftermathState('beat.pool.invest.the_worthy_mortal', 30),
      { runtime, templateProvider: provider },
    );
    expect(result.resolved).toBe(true);
    // Descriptor grant + template-aftermath unlock both applied.
    expect(result.state.unlockedActionIds).toEqual(
      expect.arrayContaining(['bind_thread_agent', 'beat.aftermath.extra']),
    );
  });

  it('documented fallback: without a runtime, template aftermath does NOT run (grant-only)', () => {
    const provider = (id: string) =>
      id === 'beat.pool.invest.the_worthy_mortal' ? aftermathTemplate : undefined;
    const result = resolvePendingBeat(
      pendingAftermathState('beat.pool.invest.the_worthy_mortal', 30),
      { templateProvider: provider }, // no runtime
    );
    expect(result.resolved).toBe(true);
    expect(result.state.unlockedActionIds).toContain('bind_thread_agent');
    expect(result.state.unlockedActionIds).not.toContain('beat.aftermath.extra');
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

describe('reach-signature acquisition beats (THR-523)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  function graphWithAscendant(affinities: Partial<Record<ReachDomain, number>>): WorldGraph {
    const g = new WorldGraph();
    g.addNode({
      id: 'asc-1',
      type: 'actor',
      name: 'God',
      properties: { actorType: 'ascendant', domainAffinities: affinities },
    });
    return g;
  }

  /** Build a GameState with `beatId` pending, an ascendant carrying `affinities`, + an unlock set. */
  function pendingWithAscendant(
    beatId: string,
    affinities: Partial<Record<ReachDomain, number>>,
    unlocked: readonly string[] = [],
    tick = 8,
  ): GameState {
    const graph = graphWithAscendant(affinities);
    const offered = forceOfferBeatById(
      createInitialAscendantBeatState(), beatId, tick,
      directorState(tick, createInitialAscendantBeatState(), graph),
    )!.next;
    const s = directorState(tick, offered, graph);
    (s as { unlockedActionIds?: readonly string[] }).unlockedActionIds = unlocked;
    return s;
  }

  describe('resolveReachSignatureGrant — per-run primary/secondary ranking', () => {
    it('picks the highest-affinity reach signature for primary, second-highest for secondary', () => {
      const state = directorState(8, undefined, graphWithAscendant({ iron: 5, gold: 3, stone: 2 }));
      expect(resolveReachSignatureGrant(state, 'primary')).toBe('invest.iron.warhost');
      expect(resolveReachSignatureGrant(state, 'secondary')).toBe('invest.gold.patronage_network');
    });

    it('breaks affinity ties deterministically by REACH_DOMAINS order', () => {
      // iron precedes gold in REACH_DOMAINS, so equal affinity → iron primary, gold secondary.
      const state = directorState(8, undefined, graphWithAscendant({ gold: 3, iron: 3 }));
      expect(resolveReachSignatureGrant(state, 'primary')).toBe('invest.iron.warhost');
      expect(resolveReachSignatureGrant(state, 'secondary')).toBe('invest.gold.patronage_network');
    });

    it('fail-soft: a single-domain ascendant has no secondary; no ascendant → null', () => {
      const single = directorState(8, undefined, graphWithAscendant({ veil: 4 }));
      expect(resolveReachSignatureGrant(single, 'primary')).toBe('invest.veil.rend_the_gate');
      expect(resolveReachSignatureGrant(single, 'secondary')).toBeNull();
      // No ascendant node in the graph → both slots null.
      const none = directorState(8, undefined, new WorldGraph());
      expect(resolveReachSignatureGrant(none, 'primary')).toBeNull();
    });
  });

  describe('resolvePendingBeat — dynamic signature grant', () => {
    it('Beat 4 grants the chosen god-path AND the primary-reach signature', () => {
      const state = pendingWithAscendant('beat.spine.a_path_opens', { veil: 5, heart: 3 });
      const result = resolvePendingBeat(state, { chosenActionId: 'divine.dream' });
      expect(result.resolved).toBe(true);
      // Both the selected god-path and the run's primary (veil) signature land.
      expect(result.grantedActionIds).toEqual(
        expect.arrayContaining(['divine.dream', 'invest.veil.rend_the_gate']),
      );
      expect(result.state.unlockedActionIds).toEqual(
        expect.arrayContaining(['divine.dream', 'invest.veil.rend_the_gate']),
      );
      // The un-chosen god-paths and the secondary signature are NOT granted here.
      expect(result.state.unlockedActionIds).not.toContain('divine.omen');
      expect(result.state.unlockedActionIds).not.toContain('invest.heart.sworn_oath');
    });

    it('the reach-signature pool beat grants the secondary-reach signature', () => {
      const state = pendingWithAscendant('beat.pool.invest.reach_signature', { veil: 5, heart: 3 });
      const result = resolvePendingBeat(state);
      expect(result.resolved).toBe(true);
      expect(result.state.unlockedActionIds).toContain('invest.heart.sworn_oath');
      expect(result.state.unlockedActionIds).not.toContain('invest.veil.rend_the_gate');
    });

    it('fail-soft: no signature grant when the ascendant has no reach for the slot', () => {
      // Single-domain ascendant → no secondary; the pool beat resolves as a clean no-op grant.
      const state = pendingWithAscendant('beat.pool.invest.reach_signature', { veil: 5 });
      const result = resolvePendingBeat(state);
      expect(result.resolved).toBe(true);
      expect(result.state.unlockedActionIds ?? []).not.toContain('invest.veil.rend_the_gate');
    });
  });

  describe('isBeatEligible — unacquired_reach_signature predicate', () => {
    const beat: BeatDefinition = {
      beatId: 'beat.pool.invest.reach_signature',
      kind: 'investment',
      trigger: { kind: 'cadence' },
      eligibility: { kind: 'unacquired_reach_signature' },
      grantsReachSignature: 'secondary',
    };

    it('is eligible while any in-domain signature is unlearned, retires once all are', () => {
      const graph = graphWithAscendant({ iron: 5, gold: 3 });
      const none = directorState(30, undefined, graph);
      expect(isBeatEligible(beat, none)).toBe(true);

      const one = directorState(30, undefined, graph);
      (one as { unlockedActionIds?: readonly string[] }).unlockedActionIds = ['invest.iron.warhost'];
      expect(isBeatEligible(beat, one)).toBe(true); // gold still unlearned

      const both = directorState(30, undefined, graph);
      (both as { unlockedActionIds?: readonly string[] }).unlockedActionIds = [
        'invest.iron.warhost', 'invest.gold.patronage_network',
      ];
      expect(isBeatEligible(beat, both)).toBe(false);
    });

    it('fail-soft: ineligible when there is no ascendant to acquire for', () => {
      expect(isBeatEligible(beat, directorState(30, undefined, new WorldGraph()))).toBe(false);
    });
  });
});
