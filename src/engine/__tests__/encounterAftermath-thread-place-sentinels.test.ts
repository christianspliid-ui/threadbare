/**
 * THR-1446 — `$ascendant`, `$here`, and the bindability gate.
 *
 * The finding: the Consequence Draw weights `thread` ≥ 1 in **all eight reaches**, and
 * no authored encounter template could wire it in any of them. `thread_*` effects take a
 * literal `ascendantId` and `mortalId`; neither field was in `SCENE_SENTINEL_FIELDS`, and
 * the ascendant node id is minted per run as `asc.<archetypeId>`, so there was no literal
 * an author could ever write. The effect skipped with `thread_mutation_skipped`. `place`
 * had the sibling failure: it needs a location target, and `$target` binds a location only
 * when the *card* targets one — which a self-targeted encounter never does.
 *
 * Two of these tests are the ones that matter, and both are falsifiers rather than
 * confirmations (the standing vacuous-probe rule: a gate never shown failing on the shape
 * it exists to catch is not evidence):
 *
 *  - **the runtime falsifier** — the pre-THR-1446 authoring (`ascendantId: 'self'`,
 *    the shape `example.thread_bond_tested.ts` actually ships) still skips, proving the
 *    new binding is what makes the passing case pass;
 *  - **the gate falsifier** — a synthetic *unwirable* hand (`targetLocationId: '$target'`
 *    on an actor-targeting template) is refused, and the same effect authored with
 *    `$here` is accepted.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  applyEncounterAftermathReaction,
  bindAftermathSceneTargets,
} from '../encounterAftermath';
import { createSimulationRuntime } from '../simulationRuntime';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';
import { sentinelBindabilityViolations } from '../../data/content-eval/consequenceDraw';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

const ASCENDANT_ID = 'asc.archetype.chaos_0';
const AVATAR_ID = 'avatar.chaos';
const MORTAL_ID = 'actor-mortal';
const PLACE_ID = 'sub-shrine';
const LOCATION_ID = 'loc-town';

/**
 * A world in the shape the finding was measured against: an ascendant with no
 * `located_at` of its own (its avatar carries it — see `ascendant.ts`), the avatar
 * standing at a Place inside a Location, and one mortal the god already holds a thread to.
 */
function buildState(opts?: { withThread?: boolean }): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID, type: 'actor', name: 'The Unmade',
    properties: { actorType: 'ascendant', avatarId: AVATAR_ID },
  });
  graph.addNode({
    id: AVATAR_ID, type: 'actor', name: 'Kael',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: MORTAL_ID, type: 'actor', name: 'Bela',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: LOCATION_ID, type: 'location', name: 'Ashfell', properties: { hexCol: 1, hexRow: 1 },
  });
  graph.addNode({
    id: PLACE_ID, type: 'location', name: 'The Shrine',
    properties: { parentLocationId: LOCATION_ID },
  });
  graph.addEdge({
    id: 'edge.located_at.avatar', source: AVATAR_ID, target: PLACE_ID,
    type: 'located_at', properties: {},
  });
  if (opts?.withThread !== false) {
    graph.addEdge({
      id: 'edge.thread.1', source: ASCENDANT_ID, target: MORTAL_ID,
      type: 'thread', properties: { strength: 0.4 },
    });
  }
  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: ASCENDANT_ID, essencePool: {} as never,
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

/**
 * A **self-targeted** action — `targetId === actorId`, the shape the CLI measured on
 * `encounter.sharpen_blades` and `encounter.shrine_offering`, and the one that made
 * `place` unwirable.
 */
function selfTargetedAction(actorId: string): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId: 'encounter.test',
    targetId: actorId, scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as unknown as UnifiedAction;
}

function reactionWith(
  effects: readonly EncounterAftermathReactionEffect[],
): EncounterAftermathReaction {
  return {
    id: 'reaction-test', label: 'Test', prose: 'x', effects: [...effects],
  } as unknown as EncounterAftermathReaction;
}

/** A minimal template carrying the two fields the bindability gate reads. */
function templateTargeting(
  targetCategories: UnifiedActionTemplate['targetCategories'],
): UnifiedActionTemplate {
  return { id: 'encounter.test', targetCategories } as unknown as UnifiedActionTemplate;
}

// ─── Binder: $ascendant ────────────────────────────────────────────────────────

describe('bindAftermathSceneTargets — $ascendant (THR-1446)', () => {
  it('binds $ascendant on ascendantId from the scene refs, not from the action', () => {
    const state = buildState();
    const effect = {
      kind: 'thread_strengthen', ascendantId: '$ascendant', mortalId: '$actor', delta: 0.2,
    } as unknown as EncounterAftermathReactionEffect;

    const bound = bindAftermathSceneTargets(
      effect,
      selfTargetedAction(MORTAL_ID),
      state.graph,
      undefined,
      { ascendantId: ASCENDANT_ID },
    ) as unknown as Record<string, unknown>;

    expect(bound.ascendantId).toBe(ASCENDANT_ID);
    expect(bound.mortalId).toBe(MORTAL_ID);
  });

  it('leaves $ascendant unbound when no scene refs are supplied (fail-soft, NFP #4)', () => {
    const state = buildState();
    const effect = {
      kind: 'thread_strengthen', ascendantId: '$ascendant', mortalId: '$actor',
    } as unknown as EncounterAftermathReactionEffect;

    const bound = bindAftermathSceneTargets(
      effect, selfTargetedAction(MORTAL_ID), state.graph,
    ) as unknown as Record<string, unknown>;

    expect(bound.ascendantId).toBe('$ascendant');
  });

  it('refuses to bind a mortal to ascendantId — the kind check is the point', () => {
    const state = buildState();
    const effect = {
      kind: 'thread_strengthen', ascendantId: '$actor', mortalId: '$actor',
    } as unknown as EncounterAftermathReactionEffect;

    const bound = bindAftermathSceneTargets(
      effect, selfTargetedAction(MORTAL_ID), state.graph, undefined,
      { ascendantId: ASCENDANT_ID },
    ) as unknown as Record<string, unknown>;

    expect(bound.ascendantId).toBe('$actor');
  });

  it('refuses to bind the ascendant to mortalId — a god holds no thread to itself', () => {
    const state = buildState();
    const effect = {
      kind: 'thread_strengthen', ascendantId: '$ascendant', mortalId: '$actor',
    } as unknown as EncounterAftermathReactionEffect;

    // The *ascendant* is the actor here: a divine self-targeted encounter.
    const bound = bindAftermathSceneTargets(
      effect, selfTargetedAction(ASCENDANT_ID), state.graph, undefined,
      { ascendantId: ASCENDANT_ID },
    ) as unknown as Record<string, unknown>;

    expect(bound.ascendantId).toBe(ASCENDANT_ID);
    expect(bound.mortalId).toBe('$actor');
  });

  it('still binds $actor on the four pre-existing agent fields when the actor is the ascendant', () => {
    // NFP #6 guard: `mortal` is a *separate* kind, not a narrowing of `agent`. Had the
    // ascendant been excluded from `agent`, every divine encounter wiring `$actor` on
    // these fields would have silently stopped resolving.
    const state = buildState();
    for (const field of ['targetAgentId', 'withAgentId', 'counterpartyId', 'debtorAgentId']) {
      const bound = bindAftermathSceneTargets(
        { kind: 'hidden_mark', [field]: '$actor', category: 'betrayal', severity: 0.5, label: 'x' } as unknown as EncounterAftermathReactionEffect,
        selfTargetedAction(ASCENDANT_ID),
        state.graph,
        undefined,
        { ascendantId: ASCENDANT_ID },
      ) as unknown as Record<string, unknown>;
      expect(bound[field], `${field} must still bind $actor for an ascendant actor`).toBe(ASCENDANT_ID);
    }
  });
});

// ─── Binder: $here ─────────────────────────────────────────────────────────────

describe('bindAftermathSceneTargets — $here (THR-1446)', () => {
  it('binds $here on targetLocationId through the ascendant → avatar → place → parent walk', () => {
    const state = buildState();
    const effect = {
      kind: 'apply_condition', targetLocationId: '$here', conditionId: 'blessed',
    } as unknown as EncounterAftermathReactionEffect;

    const bound = bindAftermathSceneTargets(
      effect, selfTargetedAction(ASCENDANT_ID), state.graph, undefined,
      { ascendantId: ASCENDANT_ID },
    ) as unknown as Record<string, unknown>;

    // The avatar stands at a Place; a `location` field resolves up to its parent.
    expect(bound.targetLocationId).toBe(LOCATION_ID);
  });

  it('binds $here on targetSublocationId to the Place itself, not its parent', () => {
    const state = buildState();
    const effect = {
      kind: 'apply_condition', targetSublocationId: '$here', conditionId: 'blessed',
    } as unknown as EncounterAftermathReactionEffect;

    const bound = bindAftermathSceneTargets(
      effect, selfTargetedAction(ASCENDANT_ID), state.graph, undefined,
      { ascendantId: ASCENDANT_ID },
    ) as unknown as Record<string, unknown>;

    expect(bound.targetSublocationId).toBe(PLACE_ID);
  });

  it('binds $here for an ordinary mortal actor standing directly at a Location', () => {
    const state = buildState();
    state.graph.addEdge({
      id: 'edge.located_at.mortal', source: MORTAL_ID, target: LOCATION_ID,
      type: 'located_at', properties: {},
    });
    const bound = bindAftermathSceneTargets(
      { kind: 'apply_condition', targetLocationId: '$here', conditionId: 'blessed' } as unknown as EncounterAftermathReactionEffect,
      selfTargetedAction(MORTAL_ID), state.graph,
    ) as unknown as Record<string, unknown>;

    expect(bound.targetLocationId).toBe(LOCATION_ID);
  });

  it('leaves $here unbound when the actor is nowhere (fail-soft, NFP #4)', () => {
    const state = buildState();
    const bound = bindAftermathSceneTargets(
      { kind: 'apply_condition', targetLocationId: '$here', conditionId: 'blessed' } as unknown as EncounterAftermathReactionEffect,
      selfTargetedAction(MORTAL_ID), state.graph,
    ) as unknown as Record<string, unknown>;

    expect(bound.targetLocationId).toBe('$here');
  });

  it('refuses to bind $here to an agent field — a place is not a person', () => {
    const state = buildState();
    const bound = bindAftermathSceneTargets(
      { kind: 'hidden_mark', targetAgentId: '$here', category: 'betrayal', severity: 0.5, label: 'x' } as unknown as EncounterAftermathReactionEffect,
      selfTargetedAction(ASCENDANT_ID), state.graph,
    ) as unknown as Record<string, unknown>;

    expect(bound.targetAgentId).toBe('$here');
  });
});

// ─── The runtime demonstration, with its falsifier ─────────────────────────────

describe('thread_strengthen end-to-end (THR-1446)', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  it('lands in a trace when authored through $ascendant + $actor', () => {
    const state = buildState();
    const runtime = createSimulationRuntime();
    const reaction = reactionWith([
      { kind: 'thread_strengthen', ascendantId: '$ascendant', mortalId: '$actor', delta: 0.25, reason: 'kept the vow' } as unknown as EncounterAftermathReactionEffect,
    ]);

    applyEncounterAftermathReaction(
      state, selfTargetedAction(MORTAL_ID), reaction, 10, runtime,
    );

    const applied = getTraces().filter(t => t.category === 'thread_mutation_applied');
    expect(applied.length, 'the effect must land, not skip').toBe(1);

    const edge = state.graph.getOutgoingEdges(ASCENDANT_ID, 'thread')
      .find(e => e.target === MORTAL_ID);
    expect(edge?.properties.strength).toBeCloseTo(0.65, 5);
    expect(edge?.properties.lastReason).toBe('kept the vow');
  });

  it('FALSIFIER — the pre-THR-1446 authoring still skips, so the pass above is the sentinels', () => {
    // `example.thread_bond_tested.ts` ships exactly this: bare `'self'` / `'actor'`
    // literals under an `@ts-ignore`. They name no node, so the handler finds no edge.
    // If this ever goes green, the test above has stopped proving anything.
    const state = buildState();
    const runtime = createSimulationRuntime();
    const reaction = reactionWith([
      { kind: 'thread_strengthen', ascendantId: 'self', mortalId: 'actor', delta: 0.25 } as unknown as EncounterAftermathReactionEffect,
    ]);

    applyEncounterAftermathReaction(
      state, selfTargetedAction(MORTAL_ID), reaction, 10, runtime,
    );

    const skipped = getTraces().filter(t => t.category === 'thread_mutation_skipped');
    expect(skipped.length).toBe(1);
    expect(getTraces().filter(t => t.category === 'thread_mutation_applied')).toHaveLength(0);
  });

  it('skips fail-soft when the god holds no thread to that mortal yet', () => {
    // The handler's existing skip stays the fail-soft for a relationship that does not
    // exist — binding the ends does not invent the edge between them.
    const state = buildState({ withThread: false });
    const runtime = createSimulationRuntime();
    const reaction = reactionWith([
      { kind: 'thread_strengthen', ascendantId: '$ascendant', mortalId: '$actor', delta: 0.25 } as unknown as EncounterAftermathReactionEffect,
    ]);

    applyEncounterAftermathReaction(
      state, selfTargetedAction(MORTAL_ID), reaction, 10, runtime,
    );

    const skipped = getTraces().filter(t => t.category === 'thread_mutation_skipped');
    expect(skipped).toHaveLength(1);
    // The sentinels resolved — the skip names real ids, not the tokens.
    expect(String((skipped[0] as unknown as Record<string, unknown>).ascendantId)).toBe(ASCENDANT_ID);
    expect(String((skipped[0] as unknown as Record<string, unknown>).mortalId)).toBe(MORTAL_ID);
  });
});

// ─── The gate, with its falsifier ──────────────────────────────────────────────

describe('sentinelBindabilityViolations (THR-1446)', () => {
  it('FALSIFIER — refuses $actor on a location field, the silently-dead shape', () => {
    // An author reaching for "put the blessing on this place" and typing the sentinel
    // they already know. Pre-THR-1446 this passed every gate and no-opped at runtime:
    // the binder's kind check correctly refuses to bind a person to `targetLocationId`,
    // and nothing told the author.
    const problems = sentinelBindabilityViolations(
      templateTargeting(undefined),
      [{ kind: 'apply_condition', targetLocationId: '$actor', conditionId: 'blessed' } as unknown as EncounterAftermathReactionEffect],
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('$actor');
    expect(problems[0]).toContain('$here');
  });

  it('accepts the same effect once it is authored with $here', () => {
    const problems = sentinelBindabilityViolations(
      templateTargeting(undefined),
      [{ kind: 'apply_condition', targetLocationId: '$here', conditionId: 'blessed' } as unknown as EncounterAftermathReactionEffect],
    );
    expect(problems).toEqual([]);
  });

  it('FALSIFIER — refuses every sentinel but $ascendant on the divine end of a thread', () => {
    for (const sentinel of ['$actor', '$target', '$here', '$cast:priest']) {
      const problems = sentinelBindabilityViolations(
        templateTargeting(undefined),
        [{ kind: 'thread_strengthen', ascendantId: sentinel, mortalId: '$actor' } as unknown as EncounterAftermathReactionEffect],
      );
      expect(problems.length, `${sentinel} must be refused on ascendantId`).toBe(1);
      expect(problems[0]).toContain('no-ops silently');
    }
  });

  it('refuses $here and $ascendant on an agent field', () => {
    for (const sentinel of ['$here', '$ascendant']) {
      const problems = sentinelBindabilityViolations(
        templateTargeting(undefined),
        [{ kind: 'hidden_mark', targetAgentId: sentinel, category: 'betrayal', severity: 0.5, label: 'x' } as unknown as EncounterAftermathReactionEffect],
      );
      expect(problems.length, `${sentinel} must be refused on targetAgentId`).toBe(1);
    }
  });

  it('accepts the canonical thread authoring', () => {
    const problems = sentinelBindabilityViolations(
      templateTargeting(undefined),
      [{ kind: 'thread_strengthen', ascendantId: '$ascendant', mortalId: '$actor' } as unknown as EncounterAftermathReactionEffect],
    );
    expect(problems).toEqual([]);
  });

  it('says nothing about $target — what an encounter resolves against is a runtime fact', () => {
    // The load-bearing negative. An earlier cut of this gate ruled on `$target` using
    // the template's declared `targetCategories`, and reported 8 corpus violations of
    // which at least one was false: `encounter.slice.the_table_that_holds` declares no
    // categories (defaulting to `['actor']`) yet resolves against a town, which
    // `tableThatHolds-seedChain.test.ts` asserts. A gate that cries wolf is worse than
    // no gate, so `$target` is accepted on every field it could plausibly satisfy.
    for (const field of ['targetLocationId', 'targetSublocationId', 'targetAgentId', 'targetFactionId']) {
      const problems = sentinelBindabilityViolations(
        templateTargeting(undefined),
        [{ kind: 'apply_condition', [field]: '$target', conditionId: 'blessed' } as unknown as EncounterAftermathReactionEffect],
      );
      expect(problems, `$target on ${field} must not be reported`).toEqual([]);
    }
  });

  it('says nothing about literal node ids — a literal is not a sentinel', () => {
    const problems = sentinelBindabilityViolations(
      templateTargeting(undefined),
      [{ kind: 'apply_condition', targetLocationId: LOCATION_ID, conditionId: 'blessed' } as unknown as EncounterAftermathReactionEffect],
    );
    expect(problems).toEqual([]);
  });

  it('reports one problem per (kind, field, sentinel), not one per reachable face', () => {
    const bad = { kind: 'apply_condition', targetLocationId: '$actor', conditionId: 'blessed' } as unknown as EncounterAftermathReactionEffect;
    const problems = sentinelBindabilityViolations(templateTargeting(undefined), [bad, bad, bad]);
    expect(problems).toHaveLength(1);
  });
});
