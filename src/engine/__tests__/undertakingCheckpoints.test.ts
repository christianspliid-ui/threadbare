/**
 * Undertaking checkpoints — THR-1292 §2.
 *
 * The properties under test are the ones a later slice could break without any
 * other test noticing: the band table being *total*, the fork being rng-free and
 * reversible on its inputs, the gates deferring rather than halting, and — the
 * load-bearing one — the per-project PRNG stream being independent of resolution
 * order.
 */

import { describe, it, expect, vi } from 'vitest';
import { WorldGraph } from '../graph';

// Two fixture templates that author the §5 flags. No shipped template does — the
// flags are opt-in, and doc 2 assigns real per-kind values — so the gate tests
// would otherwise be testing a default rather than the gate. Only the one lookup
// is mocked; every other path stays real.
const STAGE_BOUND_ID = 'test_stage_bound_undertaking';
const SOLO_ID = 'test_solo_undertaking';

vi.mock('../strategicActionCandidates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../strategicActionCandidates')>();
  const base = actual.getStrategicTemplate('strategic_build_warehouse');
  return {
    ...actual,
    getStrategicTemplate: (id: string) => {
      if (id === STAGE_BOUND_ID) return { ...base, id, requiresLocation: true };
      if (id === SOLO_ID) return { ...base, id, canRunBeside: false };
      return actual.getStrategicTemplate(id);
    },
  };
});

import type { GameState } from '../../types/gameState';
import type { StrategicProjectRuntime } from '../../types/strategicAction';
import { STEP_OUTCOMES } from '../../types/unifiedAction';
import {
  CHECKPOINT_EFFECT_BY_BAND,
  checkpointRng,
  computeForkVerdict,
  pickPrimaryReach,
  resolveMomentPresentation,
  resolveUndertakingCheckpoint,
  classifyFailureResidue,
  defaultFollowedAgentIds,
} from '../undertakingCheckpoints';
import {
  UNDERTAKING_CHECKPOINT_INTERVAL_TICKS,
  UNDERTAKING_HALT_RATCHET_N,
  UNDERTAKING_ESCALATE_THRESHOLD,
  UNDERTAKING_ESCALATE_DIFFICULTY_DELTA,
  UNDERTAKING_ABSENCE_DEFERRAL_LIMIT,
  UNDERTAKING_PROGRESS_PER_ADVANCE,
} from '../../data/strategic-action-constants';

// ─── Fixtures ───────────────────────────────────────────────────────

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'ascendant', name: 'The God', type: 'actor',
    properties: { actorType: 'ascendant' },
  });
  graph.addNode({
    id: 'actor_1', name: 'Kael', type: 'actor',
    properties: {
      actorType: 'individual',
      domainCapabilities: { gold: 0.6, eye: 0.4 },
      axiologicalProfile: { courage_prudence: 0.5 },
    },
  });
  graph.addNode({
    id: 'actor_2', name: 'Bram', type: 'actor',
    properties: { actorType: 'individual', domainCapabilities: { gold: 0.6 } },
  });
  graph.addNode({
    id: 'loc_market', name: 'Market Square', type: 'location',
    properties: { locationSubtype: 'market', hexCol: 5, hexRow: 5 },
  });
  graph.addNode({
    id: 'loc_town', name: 'Millhaven', type: 'location',
    properties: { locationSubtype: 'town', hexCol: 7, hexRow: 5 },
  });
  graph.addEdge({ id: 'e_loc1', source: 'actor_1', target: 'loc_market', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'e_loc2', source: 'actor_2', target: 'loc_town', type: 'located_at', properties: {} });
  return graph;
}

function buildState(graph: WorldGraph, overrides: Partial<GameState> = {}): GameState {
  return {
    cycle: 1, tick: 10, phase: 'playing', seed: 42, graph,
    cosmology: { spheres: {} } as any,
    tiles: [], clock: { currentTick: 10 } as any,
    ascendantId: 'ascendant', ascendantIdentity: null,
    essencePool: {} as any, mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as any, doomClock: {} as any,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map() as any, familiarityMap: new Map() as any,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as any, echoDefinitions: [], echoStates: [], chronicle: {} as any,
    ...overrides,
  } as GameState;
}

function buildProject(overrides: Partial<StrategicProjectRuntime> = {}): StrategicProjectRuntime {
  return {
    projectId: 'proj_1',
    actorId: 'actor_1',
    templateId: 'strategic_build_warehouse',
    ambitionId: 'ambition_dominate_trade',
    verb: 'create',
    behaviorFamily: 'merchant-expansion',
    targetNodeId: 'loc_market',
    progress: 0,
    progressRequired: 18,
    startedTick: 0,
    lastProgressTick: 0,
    status: 'active',
    ...overrides,
  };
}

// ─── The band table ─────────────────────────────────────────────────

describe('CHECKPOINT_EFFECT_BY_BAND', () => {
  it('is total over StepOutcome — a new band cannot be added without deciding what it does', () => {
    // Read from the vocabulary, not from a hand-copied list. A test that re-typed
    // the six bands would agree with itself forever while a seventh band silently
    // fell through to `undefined` at runtime.
    for (const band of STEP_OUTCOMES) {
      expect(CHECKPOINT_EFFECT_BY_BAND[band], `band ${band} has no checkpoint effect`).toBeDefined();
    }
    expect(Object.keys(CHECKPOINT_EFFECT_BY_BAND).sort()).toEqual([...STEP_OUTCOMES].sort());
  });

  it('treats crits as intensifiers, not as separate outcomes (THR-1281 §5)', () => {
    expect(CHECKPOINT_EFFECT_BY_BAND.critical_success).toBe(CHECKPOINT_EFFECT_BY_BAND.success);
    expect(CHECKPOINT_EFFECT_BY_BAND.critical_failure).toBe(CHECKPOINT_EFFECT_BY_BAND.failure);
  });
});

// ─── Determinism (NFP #3) ───────────────────────────────────────────

describe('checkpoint PRNG stream', () => {
  it('is per-project, so resolution ORDER cannot perturb any undertaking’s draws', () => {
    // This is the property the plan singles out: the encounter path's known
    // order-coupling, deliberately not repeated. Two undertakings resolving on the
    // same tick must draw independently — swapping them, or adding a third, must
    // not move either one's roll.
    const a1 = Array.from({ length: 4 }, () => checkpointRng(42, 10, 'proj_a')());
    const b1 = Array.from({ length: 4 }, () => checkpointRng(42, 10, 'proj_b')());
    expect(a1).not.toEqual(b1);

    // Reproduce in the opposite order — identical, because neither stream ever saw
    // the other.
    const b2 = Array.from({ length: 4 }, () => checkpointRng(42, 10, 'proj_b')());
    const a2 = Array.from({ length: 4 }, () => checkpointRng(42, 10, 'proj_a')());
    expect(a2).toEqual(a1);
    expect(b2).toEqual(b1);
  });

  it('moves with seed and with tick', () => {
    expect(checkpointRng(42, 10, 'p')()).not.toBe(checkpointRng(43, 10, 'p')());
    expect(checkpointRng(42, 10, 'p')()).not.toBe(checkpointRng(42, 11, 'p')());
  });
});

// ─── Reach selection ────────────────────────────────────────────────

describe('pickPrimaryReach', () => {
  it('takes the heaviest reachProfile weight', () => {
    expect(pickPrimaryReach({ reachProfile: { gold: 0.3, eye: 0.9 } } as any)).toBe('eye');
  });

  it('falls back rather than throwing on a template with no usable profile', () => {
    // Fail-soft (NFP #4): an all-zero or missing profile is an authoring bug, and
    // it is reported through the trace's `reach` — but it never stops the tick.
    expect(() => pickPrimaryReach(undefined)).not.toThrow();
    expect(pickPrimaryReach({ reachProfile: {} } as any)).toBe(pickPrimaryReach(undefined));
    expect(pickPrimaryReach({ reachProfile: { gold: 0, eye: 0 } } as any)).toBe(pickPrimaryReach(undefined));
  });
});

// ─── The fork ───────────────────────────────────────────────────────

describe('computeForkVerdict', () => {
  it('is rng-free — the same inputs always give the same verdict', () => {
    const inputs = { halts: 3, ambitionActive: true, courage01: 0.5 };
    const runs = Array.from({ length: 5 }, () => computeForkVerdict(inputs));
    expect(new Set(runs.map(r => r.escalationWeight)).size).toBe(1);
    expect(new Set(runs.map(r => r.decision)).size).toBe(1);
  });

  it('escalates a brave agent still chasing the ambition, and abandons a timid one who is not', () => {
    // Both arms asserted: a one-armed test here would pass on a fork that always
    // returned the same answer.
    const brave = computeForkVerdict({ halts: UNDERTAKING_HALT_RATCHET_N, ambitionActive: true, courage01: 1 });
    expect(brave.decision).toBe('escalate');

    const timid = computeForkVerdict({ halts: UNDERTAKING_HALT_RATCHET_N, ambitionActive: false, courage01: 0 });
    expect(timid.decision).toBe('abandon');
  });

  it('pushes toward abandon as halts pile up past the ratchet', () => {
    const near = computeForkVerdict({ halts: UNDERTAKING_HALT_RATCHET_N, ambitionActive: true, courage01: 0.5 });
    const far = computeForkVerdict({ halts: UNDERTAKING_HALT_RATCHET_N + 4, ambitionActive: true, courage01: 0.5 });
    expect(far.escalationWeight).toBeLessThan(near.escalationWeight);
  });

  it('decides at the threshold, inclusive', () => {
    const at = computeForkVerdict({ halts: UNDERTAKING_HALT_RATCHET_N, ambitionActive: true, courage01: 0.5 });
    // The default terms land exactly on the threshold; the rule is escalate at-or-above.
    if (at.escalationWeight === UNDERTAKING_ESCALATE_THRESHOLD) {
      expect(at.decision).toBe('escalate');
    }
  });
});

describe('the halt ratchet', () => {
  it('replaces the checkpoint it trips on — an agent out of nerve gets no extra roll', () => {
    const graph = buildGraph();
    const state = buildState(graph);
    const project = buildProject({ halts: UNDERTAKING_HALT_RATCHET_N, progress: 6 });

    const result = resolveUndertakingCheckpoint(state, graph, project, 10);

    // Whichever way the fork fell, no roll happened: progress is untouched and no
    // `lastCheckpoint` band was recorded.
    expect(result.project.progress).toBe(6);
    expect(result.project.lastCheckpoint).toBeUndefined();
    expect(['continues', 'ended']).toContain(result.verdict);
  });

  it('escalating clears the halts, raises the stakes, and requests the doc-3 re-bind', () => {
    const graph = buildGraph();
    // A brave agent still pursuing its ambition escalates.
    //  takes a Partial<GraphNode>, not an updater. Passing a function
    // spreads its (zero) own properties, so the stamp silently does not apply and
    // the fixture quietly runs at the default courage — typecheck caught it, no
    // test could have.
    graph.updateNode('actor_1', { properties: { axiologicalProfile: { courage_prudence: 1 } } });
    graph.addNode({ id: 'ambition_dominate_trade', name: 'Trade', type: 'ambition', properties: {} });
    graph.addEdge({
      id: 'e_pursues', source: 'actor_1', target: 'ambition_dominate_trade',
      type: 'pursues', properties: {},
    });
    const state = buildState(graph);
    const project = buildProject({ halts: UNDERTAKING_HALT_RATCHET_N });

    const result = resolveUndertakingCheckpoint(state, graph, project, 10);

    expect(result.verdict).toBe('continues');
    expect(result.project.halts).toBe(0);
    expect(result.project.escalated).toBe(true);
    expect(result.project.rebindRequested).toBe(true);
    expect(result.project.checkpointDifficultyDelta).toBe(UNDERTAKING_ESCALATE_DIFFICULTY_DELTA);
  });

  it('forces abandon on a second trip, however brave the agent', () => {
    const graph = buildGraph();
    //  takes a Partial<GraphNode>, not an updater. Passing a function
    // spreads its (zero) own properties, so the stamp silently does not apply and
    // the fixture quietly runs at the default courage — typecheck caught it, no
    // test could have.
    graph.updateNode('actor_1', { properties: { axiologicalProfile: { courage_prudence: 1 } } });
    graph.addNode({ id: 'ambition_dominate_trade', name: 'Trade', type: 'ambition', properties: {} });
    graph.addEdge({
      id: 'e_pursues', source: 'actor_1', target: 'ambition_dominate_trade',
      type: 'pursues', properties: {},
    });
    const state = buildState(graph);
    // Same agent, same inputs — but already escalated once.
    const project = buildProject({ halts: UNDERTAKING_HALT_RATCHET_N, escalated: true });

    const result = resolveUndertakingCheckpoint(state, graph, project, 10);

    expect(result.verdict).toBe('ended');
    expect(result.project.status).toBe('failed');
    expect(result.project.failureReason).toBe('abandoned_after_halts');
  });
});

// ─── The gates (§5) ─────────────────────────────────────────────────

describe('per-verb gates', () => {
  // The gates are opt-in: `UNDERTAKING_DEFAULT_REQUIRES_LOCATION` ships `false`
  // (THR-1294 — nothing walks an agent to its stage yet, so `true` left 93–97% of
  // checkpoints unrolled), and `canRunBeside` defaults `true`. **No shipped
  // template authors either flag**, so these tests supply templates that do.
  //
  // Mocking the one registry lookup keeps the rest of the path real, and makes
  // the dependency explicit rather than riding a default that is going to change
  // under them: when doc 2 authors real per-kind values, the mock deletes and the
  // assertions stand.

  it('defers rather than halts when a stage-bound undertaking’s actor is away', () => {
    const graph = buildGraph();
    const state = buildState(graph);
    // actor_2 is at loc_town; the undertaking's stage is loc_market.
    const project = buildProject({ actorId: 'actor_2', templateId: STAGE_BOUND_ID, progress: 6 });

    const result = resolveUndertakingCheckpoint(state, graph, project, 10);

    expect(result.verdict).toBe('deferred');
    expect(result.project.progress).toBe(6);          // no advance
    expect(result.project.halts ?? 0).toBe(0);        // and no halt, on the first miss
    expect(result.project.deferrals).toBe(1);
    expect(result.project.nextCheckpointTick).toBe(10 + UNDERTAKING_CHECKPOINT_INTERVAL_TICKS);
  });

  it('converts a run of absences into one halt, then resets the streak', () => {
    const graph = buildGraph();
    const state = buildState(graph);
    let project = buildProject({
      actorId: 'actor_2',
      templateId: STAGE_BOUND_ID,
      deferrals: UNDERTAKING_ABSENCE_DEFERRAL_LIMIT - 1,
    });

    project = resolveUndertakingCheckpoint(state, graph, project, 10).project;

    expect(project.halts).toBe(1);
    expect(project.deferrals).toBe(0);
  });

  it('resolves a stage-bound undertaking normally when the actor stands at the stage', () => {
    const graph = buildGraph();
    const state = buildState(graph);
    const result = resolveUndertakingCheckpoint(state, graph, buildProject({ templateId: STAGE_BOUND_ID }), 10);

    expect(result.verdict).not.toBe('deferred');
    expect(result.project.checkpointIndex).toBe(1);
  });

  it('ignores the stage entirely on the shipped default — the flag is opt-in', () => {
    const graph = buildGraph();
    const state = buildState(graph);
    // Same absent actor as the first case, on a template authoring no flag.
    const result = resolveUndertakingCheckpoint(state, graph, buildProject({ actorId: 'actor_2' }), 10);

    expect(result.verdict).not.toBe('deferred');
  });

  it('defers a beside-forbidden undertaking while the actor is mid-encounter', () => {
    const graph = buildGraph();
    const state = buildState(graph, {
      unifiedActions: [{ actorId: 'actor_1', resolved: false } as any],
    });

    const result = resolveUndertakingCheckpoint(state, graph, buildProject({ templateId: SOLO_ID }), 10);

    expect(result.verdict).toBe('deferred');
    // A busy deferral is NOT neglect — the actor is doing something — so it must
    // not feed the absence counter that converts to halts.
    expect(result.project.deferrals ?? 0).toBe(0);
    expect(result.project.halts ?? 0).toBe(0);
  });

  it('reads the busy set and never writes it', () => {
    const graph = buildGraph();
    const before = graph.getOutgoingEdges('actor_1', 'located_at').length;
    const state = buildState(graph, {
      unifiedActions: [{ actorId: 'actor_1', resolved: false } as any],
    });

    // Default `canRunBeside: true` — the busy actor still resolves, which is the
    // "preserves today's parallel behaviour" conversion default, asserted.
    const result = resolveUndertakingCheckpoint(state, graph, buildProject(), 10);
    expect(result.verdict).not.toBe('deferred');

    // The gate is a read: the busy set and the actor are untouched (THR-1280
    // addendum — the busy gate is never written from here).
    expect(graph.getOutgoingEdges('actor_1', 'located_at').length).toBe(before);
    expect(state.unifiedActions[0].resolved).toBe(false);
  });
});

// ─── Cadence ────────────────────────────────────────────────────────

describe('cadence', () => {
  it('does nothing before the checkpoint is due', () => {
    const graph = buildGraph();
    const state = buildState(graph);
    const project = buildProject({ startedTick: 8, progress: 3 });

    const result = resolveUndertakingCheckpoint(state, graph, project, 10);

    expect(result.verdict).toBe('not_due');
    expect(result.project.progress).toBe(3);
    expect(result.project.checkpointIndex).toBeUndefined();
  });

  it('advances by a whole step, never a partial tick', () => {
    const graph = buildGraph();
    const state = buildState(graph);
    const result = resolveUndertakingCheckpoint(state, graph, buildProject(), 10);

    // Whatever the band, progress moved by 0, one step, or a doubled step.
    expect([0, UNDERTAKING_PROGRESS_PER_ADVANCE, UNDERTAKING_PROGRESS_PER_ADVANCE * 2])
      .toContain(result.project.progress);
  });

  it('fails clean rather than throwing when the actor is gone', () => {
    const graph = buildGraph();
    const state = buildState(graph);
    const project = buildProject({ actorId: 'nobody' });

    const result = resolveUndertakingCheckpoint(state, graph, project, 10);

    expect(result.verdict).toBe('ended');
    expect(result.project.failureReason).toBe('actor_lost');
  });
});

// ─── Moments and residue ────────────────────────────────────────────

describe('moment presentation', () => {
  it('interrupts only for followed agents', () => {
    const graph = buildGraph();
    const project = buildProject();

    const unfollowed = buildState(graph);
    expect(resolveMomentPresentation(unfollowed, graph, 'actor_1', 'completion', project)).toBe('badge');

    const followed = buildState(graph, { followedAgentIds: ['actor_1'] });
    expect(resolveMomentPresentation(followed, graph, 'actor_1', 'completion', project)).toBe('interrupt');
  });

  it('follows the threaded retinue even when followedAgentIds does not name them', () => {
    // The additive reading: threads are minted long after init, so an
    // authoritative snapshot would follow nobody for the whole run.
    const graph = buildGraph();
    graph.addEdge({ id: 'e_thread', source: 'ascendant', target: 'actor_1', type: 'thread', properties: {} });
    const state = buildState(graph, { followedAgentIds: [] });

    expect(resolveMomentPresentation(state, graph, 'actor_1', 'completion', buildProject())).toBe('interrupt');
    expect(defaultFollowedAgentIds(graph, 'ascendant')).toEqual(['actor_1']);
  });

  it('interrupts the first advance-at-cost and badges the rest', () => {
    const graph = buildGraph();
    const state = buildState(graph, { followedAgentIds: ['actor_1'] });

    expect(resolveMomentPresentation(state, graph, 'actor_1', 'at_cost', buildProject())).toBe('interrupt');
    expect(
      resolveMomentPresentation(state, graph, 'actor_1', 'at_cost', buildProject({ atCostMomentFired: true })),
    ).toBe('badge');
  });

  it('badges a founding even for a followed agent', () => {
    const graph = buildGraph();
    const state = buildState(graph, { followedAgentIds: ['actor_1'] });
    expect(resolveMomentPresentation(state, graph, 'actor_1', 'started', buildProject())).toBe('badge');
  });
});

describe('failure residue follows visibility (review ruling 2.2)', () => {
  it('a watched failure leaves a scar, an unwatched one leaves a chronicle line', () => {
    expect(classifyFailureResidue(buildProject({ everInterrupted: true }))).toBe('undertaking_failed_visible');
    expect(classifyFailureResidue(buildProject({ everInterrupted: false }))).toBe('undertaking_failed_clean');
    // Absent reads as never-watched — the THR-1281 Q5 case, no graph litter.
    expect(classifyFailureResidue(buildProject())).toBe('undertaking_failed_clean');
  });
});
