/**
 * THR-1144 — `membership_change`: one person joins, leaves, or moves rank in a faction.
 *
 * Covers the write (all three ops, idempotence, sentinels, clamping, chronicle),
 * every fail-soft row of the plan doc's table, and — the half that matters — the
 * **reader**: the `faction_rank:` predicate, dead since it was written, now gating
 * a real aftermath effect on a rank this vocabulary can actually produce.
 *
 * ## Falsification
 *
 * Three guards here were falsified before being trusted, because each asserts
 * something a plausible implementation gets wrong silently:
 *
 *  • `describe('the reader — faction_rank: actually gates')` is falsified **both
 *    ways**, which is the whole reason it exists. THR-805 found this gate dead:
 *    `buildPredicateContext` read `agentNode.properties.factionRank`, which nothing
 *    writes, so every `faction_rank:` predicate was permanently false. A test that
 *    only asserted "below-rank agent is blocked" would have passed against that
 *    dead gate — a gate that never passes is not a gate. So the at-rank arm is the
 *    load-bearing one: reverting the context builder to the node property makes it
 *    fail. Both arms run the same effect through the same real dispatcher, with
 *    only the rank differing.
 *  • `'rank_delta clamps at FACTION_RANK_MAX'` — removing the `Math.min` lets rank
 *    run past the top of the scale the predicate reads, which would make
 *    `faction_rank:` thresholds unreachable-by-being-always-true.
 *  • `'join is idempotent'` — dropping the existing-member check produces a second
 *    `member_of` edge for one membership, which every downstream reader
 *    (`graphQueries`, `socialLeverage`, `agentDetail`) would then double-count.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import {
  joinFaction, leaveFaction, adjustMemberRank, findMembershipEdge, resolveFactionNodeId,
} from '../factionMembership';
import { buildPredicateContext, evaluatePredicate } from '../effects/effectPredicates';
import { FACTION_RANK_MAX } from '../../data/agent-behavior-constants';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

/**
 * A hero, two factions, and a bystander who already belongs to one of them.
 *
 * `faction-guild` uses `actor` + `actorType: 'faction'` — the representation the
 * world seed actually writes, and the one the `member_of` edge schema declares
 * (its target is typed `actor`). `faction-order` is a bare `faction` node, the
 * shape several fixtures and the codex use. Both are here on purpose: a helper
 * that recognised only one of them would silently no-op on half the world.
 */
function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'Maret',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'actor-sworn', type: 'actor', name: 'Dellin',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'faction-guild', type: 'actor', name: "Masons' Guild",
    properties: { actorType: 'faction' },
  });
  graph.addNode({
    // `'faction'` is deliberately off the `NodeType` union — that is the point of
    // this fixture. Several shipped fixtures and the codex construct faction nodes
    // this way, so the helper has to tolerate it; the cast records that the shape
    // is non-canonical rather than pretending the union contains it.
    id: 'faction-order', type: 'faction' as GraphNode['type'], name: 'The Grey Order',
    properties: {},
  });
  graph.addNode({ id: 'loc-hall', type: 'location', name: 'Guild Hall', properties: { hexCol: 0, hexRow: 0 } });

  // Dellin is already a rank-and-file member of the guild.
  graph.addEdge({
    id: 'member_actor-sworn_faction-guild',
    source: 'actor-sworn', target: 'faction-guild', type: 'member_of',
    properties: { role: 'member', rank: 0.2, joinedTick: 0, reputation: 0.3 },
  });

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
  } as unknown as GameState;
}

function makeAction(over: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: 'actor-hero', templateId: 'enc.guild_recruitment',
    targetId: 'actor-hero', scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
    ...over,
  } as UnifiedAction;
}

function apply(
  state: GameState,
  effects: EncounterAftermathReactionEffect[],
  runtime: SimulationRuntime,
  action: UnifiedAction = makeAction(),
  tick = 50,
) {
  const reaction = {
    id: 'rx-recruit', label: 'They Offer You the Apron', effects,
  } as EncounterAftermathReaction;
  return applyEncounterAftermathReaction(state, action, reaction, tick, runtime);
}

const memberEdge = (state: GameState, agentId: string, factionId: string) =>
  findMembershipEdge(state.graph, agentId, factionId);

const rankOf = (state: GameState, agentId: string, factionId: string) =>
  memberEdge(state, agentId, factionId)?.properties?.rank as number | undefined;

/**
 * Filter traces by category through a widened accessor.
 *
 * `aftermath_effect_skipped_by_when` / `_when_passed` are emitted by the real
 * dispatcher but are not members of the `TraceEntry` category union — a
 * pre-existing gap (`encounterAftermath.ts` carries its own type errors on those
 * two emits). Comparing through `string` keeps this file from adding to the
 * red baseline while still asserting on the traces the engine actually emits.
 */
const tracesOfCategory = (category: string) =>
  getTraces().filter(t => (t as unknown as { category: string }).category === category);

// ═══════════════════════════════════════════════════════════════════
// The write
// ═══════════════════════════════════════════════════════════════════

describe('membership_change — the write', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('join makes a non-member a member', () => {
    const state = buildState();
    expect(memberEdge(state, 'actor-hero', 'faction-guild')).toBeUndefined();

    const result = apply(state, [{
      kind: 'membership_change', factionId: 'faction-guild', op: 'join',
    }], runtime);

    const edge = memberEdge(result.state, 'actor-hero', 'faction-guild');
    expect(edge).toBeDefined();
    expect(edge!.properties.rank).toBe(0);
    expect(edge!.properties.joinedTick).toBe(50);
    expect(edge!.properties.role).toBe('member');
    expect(result.mutationSummary.touchedWorld).toBe(true);
  });

  it('join works on a bare `faction` node as well as the seeded actor shape', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'membership_change', factionId: 'faction-order', op: 'join',
    }], runtime);
    expect(memberEdge(result.state, 'actor-hero', 'faction-order')).toBeDefined();
  });

  it('join is idempotent — an existing member is left exactly as they are', () => {
    const state = buildState();
    const before = memberEdge(state, 'actor-sworn', 'faction-guild')!;
    const beforeRank = before.properties.rank;
    const beforeJoined = before.properties.joinedTick;

    const result = apply(state, [{
      kind: 'membership_change', targetAgentId: 'actor-sworn',
      factionId: 'faction-guild', op: 'join',
    }], runtime);

    const edges = result.state.graph.getOutgoingEdges('actor-sworn', 'member_of')
      .filter(e => e.target === 'faction-guild');
    expect(edges).toHaveLength(1);
    // Untouched — not merely "one edge", but the *same* edge, so a re-run of an
    // encounter cannot quietly reset someone's seniority to zero.
    expect(edges[0].properties.rank).toBe(beforeRank);
    expect(edges[0].properties.joinedTick).toBe(beforeJoined);

    const skipped = getTraces().filter(t =>
      t.category === 'encounter_aftermath_effect'
      && (t as unknown as { failReason?: string }).failReason === 'already_member');
    expect(skipped).toHaveLength(1);
  });

  it('leave removes the membership edge', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'membership_change', targetAgentId: 'actor-sworn',
      factionId: 'faction-guild', op: 'leave',
    }], runtime);
    expect(memberEdge(result.state, 'actor-sworn', 'faction-guild')).toBeUndefined();
  });

  it('rank_delta moves an existing member up the scale', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'membership_change', targetAgentId: 'actor-sworn',
      factionId: 'faction-guild', op: 'rank_delta', rankDelta: 0.3,
    }], runtime);
    expect(rankOf(result.state, 'actor-sworn', 'faction-guild')).toBeCloseTo(0.5, 5);
  });

  it('rank_delta moves a member down, and floors at 0', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'membership_change', targetAgentId: 'actor-sworn',
      factionId: 'faction-guild', op: 'rank_delta', rankDelta: -5,
    }], runtime);
    // Demoted, not expelled — leaving is a different verb, and a floor of 0 keeps
    // the demoted member gateable by `faction_rank:0`.
    expect(rankOf(result.state, 'actor-sworn', 'faction-guild')).toBe(0);
    expect(memberEdge(result.state, 'actor-sworn', 'faction-guild')).toBeDefined();
  });

  it('rank_delta clamps at FACTION_RANK_MAX', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'membership_change', targetAgentId: 'actor-sworn',
      factionId: 'faction-guild', op: 'rank_delta', rankDelta: 99,
    }], runtime);
    expect(rankOf(result.state, 'actor-sworn', 'faction-guild')).toBe(FACTION_RANK_MAX);
  });

  it('binds $cast: on targetAgentId and $target on factionId', () => {
    const state = buildState();
    const action = makeAction({
      targetId: 'faction-guild',
      supportBindings: [{ key: 'recruit', nodeId: 'actor-hero' }],
    } as unknown as Partial<UnifiedAction>);

    const result = apply(state, [{
      kind: 'membership_change',
      targetAgentId: '$cast:recruit',
      factionId: '$target',
      op: 'join',
    }], runtime, action);

    expect(memberEdge(result.state, 'actor-hero', 'faction-guild')).toBeDefined();
  });

  it('emits an aftermath_membership_change trace naming the move', () => {
    const state = buildState();
    apply(state, [{
      kind: 'membership_change', factionId: 'faction-guild', op: 'join',
    }], runtime);

    const traces = getTraces().filter(t => t.category === 'aftermath_membership_change');
    expect(traces).toHaveLength(1);
    const t = traces[0] as unknown as { op?: string; factionId?: string; summary?: string };
    expect(t.op).toBe('join');
    expect(t.factionId).toBe('faction-guild');
    expect(t.summary).toContain('Maret');
    expect(t.summary).toContain("Masons' Guild");
  });

  it('chronicle:true reaches BOTH event feeds; the default stays quiet', () => {
    const loud = apply(buildState(), [{
      kind: 'membership_change', factionId: 'faction-guild', op: 'join', chronicle: true,
    }], runtime);
    expect(loud.state.tickEvents.filter(e => e.type === 'faction_member_joined')).toHaveLength(1);
    // `recentEvents` is the load-bearing half: `tickEvents` is per-tick and gone
    // next tick, so a chronicle flag that only wrote there would announce nothing
    // to the chronicle or notification surfaces. Caught exactly that way in a CLI
    // run before this guard existed.
    expect(loud.state.recentEvents.filter(e => e.type === 'faction_member_joined')).toHaveLength(1);

    const quiet = apply(buildState(), [{
      kind: 'membership_change', factionId: 'faction-guild', op: 'join',
    }], runtime);
    expect(quiet.state.tickEvents.filter(e => e.type === 'faction_member_joined')).toHaveLength(0);
    expect(quiet.state.recentEvents.filter(e => e.type === 'faction_member_joined')).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Fail-soft
// ═══════════════════════════════════════════════════════════════════

describe('membership_change — fail-soft', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  const failReasonOf = () => {
    const t = getTraces().find(x =>
      x.category === 'encounter_aftermath_effect'
      && (x as unknown as { effectKind?: string }).effectKind === 'membership_change'
      && (x as unknown as { success?: boolean }).success === false);
    return (t as unknown as { failReason?: string } | undefined)?.failReason;
  };

  it('an unknown faction no-ops with a trace, never a throw', () => {
    const state = buildState();
    expect(() => apply(state, [{
      kind: 'membership_change', factionId: 'faction-nope', op: 'join',
    }], runtime)).not.toThrow();
    expect(failReasonOf()).toBe('faction_not_found');
  });

  it('a node that exists but is not a faction is refused', () => {
    const state = buildState();
    apply(state, [{
      kind: 'membership_change', factionId: 'loc-hall', op: 'join',
    }], runtime);
    expect(failReasonOf()).toBe('faction_not_found');
  });

  it('leave on a non-member no-ops', () => {
    const state = buildState();
    apply(state, [{
      kind: 'membership_change', factionId: 'faction-guild', op: 'leave',
    }], runtime);
    expect(failReasonOf()).toBe('not_a_member');
  });

  it('rank_delta on a non-member no-ops rather than inventing a membership', () => {
    const state = buildState();
    apply(state, [{
      kind: 'membership_change', factionId: 'faction-guild', op: 'rank_delta', rankDelta: 0.5,
    }], runtime);
    expect(failReasonOf()).toBe('not_a_member');
    expect(memberEdge(state, 'actor-hero', 'faction-guild')).toBeUndefined();
  });

  it('rank_delta with no delta authored is refused as an authoring slip', () => {
    const state = buildState();
    apply(state, [{
      kind: 'membership_change', targetAgentId: 'actor-sworn',
      factionId: 'faction-guild', op: 'rank_delta',
    }], runtime);
    expect(failReasonOf()).toBe('no_rank_delta');
    expect(rankOf(state, 'actor-sworn', 'faction-guild')).toBe(0.2);
  });

  it('an unresolvable sentinel leaves the effect inert', () => {
    const state = buildState();
    // `$target` on an action whose target is an agent, not a faction — the
    // sentinel does not bind, the literal string survives, and the handler
    // refuses it rather than writing a dangling edge.
    apply(state, [{
      kind: 'membership_change', factionId: '$target', op: 'join',
    }], runtime, makeAction({ targetId: 'actor-sworn' }));
    expect(failReasonOf()).toBe('faction_not_found');
  });
});

// ═══════════════════════════════════════════════════════════════════
// The reader — this is the half THR-805 found missing
// ═══════════════════════════════════════════════════════════════════

describe('the reader — faction_rank: actually gates', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('reads rank off the member_of edge, not the never-written node property', () => {
    const state = buildState();
    const ctx = buildPredicateContext(state.graph, 'actor-sworn');
    expect(ctx.factionRank).toBe(0.2);
    // The old reader would have produced 0 here — the whole dead-gate mechanism.
    expect(ctx.factionRank).not.toBe(0);
  });

  it('takes the highest rank across several memberships', () => {
    const state = buildState();
    joinFaction(state.graph, 'actor-sworn', 'faction-order', 10);
    adjustMemberRank(state.graph, 'actor-sworn', 'faction-order', 0.7);
    expect(buildPredicateContext(state.graph, 'actor-sworn').factionRank).toBeCloseTo(0.7, 5);
  });

  it('coerces a non-numeric rank to 0 rather than NaN-poisoning the comparison', () => {
    const state = buildState();
    state.graph.addEdge({
      id: 'member_actor-hero_faction-order', source: 'actor-hero', target: 'faction-order',
      type: 'member_of', properties: { role: 'army', rank: 'war_chief', joinedTick: 0 },
    });
    const ctx = buildPredicateContext(state.graph, 'actor-hero');
    expect(ctx.factionRank).toBe(0);
    expect(evaluatePredicate('faction_rank:0.5', ctx)).toBe(false);
  });

  it('parses a fractional threshold — the scale member_of.rank actually uses', () => {
    const state = buildState();
    const ctx = buildPredicateContext(state.graph, 'actor-sworn'); // rank 0.2
    expect(evaluatePredicate('faction_rank:0.1', ctx)).toBe(true);
    expect(evaluatePredicate('faction_rank:0.5', ctx)).toBe(false);
  });

  // ── The falsification pair ───────────────────────────────────────
  //
  // Same effect, same dispatcher, same predicate — only the rank differs. Both
  // arms must hold: the blocked arm alone would pass against the dead gate.

  it('BLOCKS a below-rank agent — the effect does not fire', () => {
    const state = buildState(); // Dellin is rank 0.2
    const result = apply(state, [{
      kind: 'membership_change', targetAgentId: 'actor-sworn',
      factionId: 'faction-order', op: 'join',
      when: 'faction_rank:0.6',
    }], runtime);

    expect(memberEdge(result.state, 'actor-sworn', 'faction-order')).toBeUndefined();
    const skipped = tracesOfCategory('aftermath_effect_skipped_by_when');
    expect(skipped).toHaveLength(1);
    expect((skipped[0] as unknown as { predicate?: string }).predicate).toBe('faction_rank:0.6');
  });

  it('ADMITS an at-rank agent — the effect fires', () => {
    const state = buildState();
    // Promote Dellin over the threshold *through the new write path*, so the
    // write and its gate are proven to share one scale rather than two.
    adjustMemberRank(state.graph, 'actor-sworn', 'faction-guild', 0.5); // 0.2 → 0.7

    const result = apply(state, [{
      kind: 'membership_change', targetAgentId: 'actor-sworn',
      factionId: 'faction-order', op: 'join',
      when: 'faction_rank:0.6',
    }], runtime);

    expect(memberEdge(result.state, 'actor-sworn', 'faction-order')).toBeDefined();
    expect(tracesOfCategory('aftermath_effect_skipped_by_when')).toHaveLength(0);
    expect(tracesOfCategory('aftermath_effect_when_passed')).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// The helpers, direct
// ═══════════════════════════════════════════════════════════════════

describe('factionMembership helpers', () => {
  it('joinFaction reports already_member without mutating', () => {
    const state = buildState();
    const r = joinFaction(state.graph, 'actor-sworn', 'faction-guild', 99);
    expect(r.changed).toBe(false);
    expect(r.reason).toBe('already_member');
    expect(rankOf(state, 'actor-sworn', 'faction-guild')).toBe(0.2);
  });

  it('leaveFaction reports the rank it removed', () => {
    const state = buildState();
    const r = leaveFaction(state.graph, 'actor-sworn', 'faction-guild');
    expect(r.changed).toBe(true);
    expect(r.oldRank).toBe(0.2);
  });

  it('adjustMemberRank reports both ends of the move', () => {
    const state = buildState();
    const r = adjustMemberRank(state.graph, 'actor-sworn', 'faction-guild', 0.25);
    expect(r.oldRank).toBe(0.2);
    expect(r.newRank).toBeCloseTo(0.45, 5);
  });

  // ── Definition-id resolution ─────────────────────────────────────
  //
  // Authored content names the *definition* id (`'mercenary_company'`), while
  // `factionSeeding` keys the node `faction_def_<definitionId><chapterSuffix>`.
  // Without this resolution the primitive would be unusable from exactly the
  // content that wants it most — and the failure would be a silent no-op.

  it('resolves an authored definition id to the seeded faction node', () => {
    const state = buildState();
    state.graph.addNode({
      id: 'faction_def_masons', type: 'actor', name: 'Masons of the North',
      properties: { actorType: 'faction', factionDefId: 'masons' },
    });

    const r = joinFaction(state.graph, 'actor-hero', 'masons', 5);
    expect(r.changed).toBe(true);
    expect(memberEdge(state, 'actor-hero', 'faction_def_masons')).toBeDefined();
  });

  it('prefers the chapter the agent already belongs to, else picks deterministically', () => {
    const state = buildState();
    for (const suffix of ['_b', '_a', '_c']) {
      state.graph.addNode({
        id: `faction_def_masons${suffix}`, type: 'actor', name: `Masons ${suffix}`,
        properties: { actorType: 'faction', factionDefId: 'masons' },
      });
    }
    // No existing membership → lowest id wins, so two runs of the same seed
    // cannot disagree about which chapter someone joined.
    expect(joinFaction(state.graph, 'actor-hero', 'masons', 5).changed).toBe(true);
    expect(memberEdge(state, 'actor-hero', 'faction_def_masons_a')).toBeDefined();

    // Dellin is already in chapter _c; his promotion lands there, not in _a.
    state.graph.addEdge({
      id: 'member_actor-sworn_faction_def_masons_c',
      source: 'actor-sworn', target: 'faction_def_masons_c', type: 'member_of',
      properties: { role: 'member', rank: 0.1, joinedTick: 0 },
    });
    const bump = adjustMemberRank(state.graph, 'actor-sworn', 'masons', 0.2);
    expect(bump.changed).toBe(true);
    expect(rankOf(state, 'actor-sworn', 'faction_def_masons_c')).toBeCloseTo(0.3, 5);
  });

  it('an explicit node id still wins over the definition scan', () => {
    const state = buildState();
    state.graph.addNode({
      id: 'faction_def_masons', type: 'actor', name: 'Masons',
      properties: { actorType: 'faction', factionDefId: 'faction-guild' },
    });
    // 'faction-guild' is both a real node id and (contrived) a factionDefId here.
    // The node id must win, or an explicit authored id could be redirected.
    expect(resolveFactionNodeId(state.graph, 'faction-guild')).toBe('faction-guild');
  });

  it('a missing agent is refused by every op', () => {
    const state = buildState();
    expect(joinFaction(state.graph, 'nobody', 'faction-guild', 1).reason).toBe('agent_not_found');
    expect(leaveFaction(state.graph, 'nobody', 'faction-guild').reason).toBe('agent_not_found');
    expect(adjustMemberRank(state.graph, 'nobody', 'faction-guild', 1).reason).toBe('agent_not_found');
  });
});
