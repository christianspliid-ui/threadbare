/**
 * Banded creation effects — THR-1296 §3, slice 5.
 *
 * The band rule is where this can go quietly wrong, so it is tested twice over: once
 * as a pure function across all six `StepOutcome` values, and once end-to-end through
 * the graph. The two arms that matter are opposites that look alike:
 *
 * - `critical_failure` maps to the `halt` **effect** (`CHECKPOINT_EFFECT_BY_BAND`), and
 *   halt creates nothing. So a band rule written on the effect alone would make the one
 *   outcome whose whole job is to leave a mark the only one that never can. The test
 *   drives `halt` twice — once with band `failure` (creates nothing) and once with band
 *   `critical_failure` (creates the problem) — and asserts the verdict FLIPS on the
 *   band while the effect is held constant.
 * - The **neutrality** claim ("costs nothing on a template with no `creationEffects`")
 *   is worthless alone: a stub passes it. Every neutrality assertion here is paired
 *   with a positive control on the identical fixture.
 *
 * Idempotency gets a two-pass test for the same reason the loss report does: a
 * must-persist spawn with no authored key derives one, and a single-pass test would
 * pass just as well against a version that mints a fresh person every checkpoint.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type {
  StrategicActionTemplate,
  StrategicProjectRuntime,
  StrategicRuntimeState,
  UndertakingCheckpointEffect,
  UndertakingCreationEffects,
} from '../../../types/strategicAction';
import { STEP_OUTCOMES, type StepOutcome } from '../../../types/unifiedAction';
import { enableTracing, disableTracing, clearTraces } from '../../traceBuffer';
import {
  applyCreationEffects,
  selectCreationBand,
  derivedCreationCastKey,
} from '../creationEffects';
import { getMintQueue, mintNodeId } from '../mintInhabitant';
import { CHECKPOINT_EFFECT_BY_BAND } from '../../undertakingCheckpoints';

const HERO = 'actor-hero';
const SITE = 'loc-site';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: SITE, type: 'location', name: 'The Site',
    properties: { hexCol: 2, hexRow: 2 },
  });
  graph.addNode({
    id: HERO, type: 'actor', name: 'Hero', properties: { actorType: 'individual' },
  });
  graph.addEdge({
    id: 'e-hero-at', source: HERO, target: SITE, type: 'located_at', properties: {},
  });
  return graph;
}

function strategicState(): StrategicRuntimeState {
  return { projects: [], controls: [], history: [], bindings: [], mintQueue: [] };
}

function stateFor(graph: WorldGraph, ss: StrategicRuntimeState): GameState {
  return { graph, tick: 10, strategicState: ss } as unknown as GameState;
}

function project(over: Partial<StrategicProjectRuntime> = {}): StrategicProjectRuntime {
  return {
    projectId: 'proj-1',
    actorId: HERO,
    templateId: 'tpl-1',
    verb: 'establish',
    behaviorFamily: 'builder',
    targetNodeId: SITE,
    status: 'active',
    progress: 0,
    progressRequired: 3,
    startedTick: 0,
    checkpointIndex: 0,
    ...over,
  } as StrategicProjectRuntime;
}

function template(creationEffects?: UndertakingCreationEffects): StrategicActionTemplate {
  return { id: 'tpl-1', displayName: 'Raise the Hall', creationEffects } as StrategicActionTemplate;
}

/** One call, with the world and state the assertions then read. */
function fire(
  effects: UndertakingCreationEffects | undefined,
  band: StepOutcome,
  effect: UndertakingCheckpointEffect,
  over: Partial<StrategicProjectRuntime> = {},
) {
  const graph = world();
  const ss = strategicState();
  const state = stateFor(graph, ss);
  const result = applyCreationEffects({
    state, graph, project: project(over), template: template(effects), band, effect, tick: 10,
  });
  return { graph, ss, state, result };
}

const SPAWN_HALL = {
  kind: 'spawn_sublocation' as const,
  sublocationTypeId: 'chapterhouse',
  nameTemplate: 'The New Hall',
};
const SPAWN_STEWARD = {
  kind: 'spawn_npc' as const,
  role: 'steward',
  persistence: 'must-persist' as const,
};
const SPAWN_FACE = {
  kind: 'spawn_npc' as const,
  role: 'porter',
  persistence: 'scene-only' as const,
};

describe('selectCreationBand', () => {
  const all: UndertakingCreationEffects = {
    onAdvance: [SPAWN_HALL],
    onAtCost: [SPAWN_FACE],
    onCritFailure: [SPAWN_STEWARD],
  };

  it('routes every one of the six bands to exactly the authored list it should', () => {
    // Driven off the engine's own band→effect map rather than a hand-copied one, so
    // this cannot drift into asserting a mapping the checkpoint no longer uses.
    const seen: Record<StepOutcome, unknown> = {} as Record<StepOutcome, unknown>;
    for (const band of STEP_OUTCOMES) {
      seen[band] = selectCreationBand(all, band, CHECKPOINT_EFFECT_BY_BAND[band]);
    }
    expect(seen.critical_success).toEqual([SPAWN_HALL]);
    expect(seen.success).toEqual([SPAWN_HALL]);
    expect(seen.success_at_cost).toEqual([SPAWN_FACE]);
    expect(seen.critical_failure).toEqual([SPAWN_STEWARD]);
    // The two bands that halt without being catastrophic create nothing.
    expect(seen.near_miss).toBeNull();
    expect(seen.failure).toBeNull();
  });

  it('FLIPS on the band with the effect held constant — halt vs critical_failure', () => {
    // Both arms pass effect 'halt'. Only the band differs, and the answer must change,
    // which is precisely what a rule keyed on the effect alone could never do.
    expect(selectCreationBand(all, 'failure', 'halt')).toBeNull();
    expect(selectCreationBand(all, 'critical_failure', 'halt')).toEqual([SPAWN_STEWARD]);
  });

  it('returns null for an unauthored band rather than an empty list', () => {
    expect(selectCreationBand({ onAdvance: [SPAWN_HALL] }, 'success_at_cost', 'advance_at_cost'))
      .toBeNull();
  });

  it('returns null when the template authors no creation effects at all', () => {
    expect(selectCreationBand(undefined, 'success', 'advance')).toBeNull();
  });
});

describe('applyCreationEffects', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  // ─── Neutrality, each with a positive control on the same fixture ──

  it('is a no-op for a template with no creationEffects — and the SAME fixture creates once authored', () => {
    const before = world().getAllNodes().length;

    const neutral = fire(undefined, 'success', 'advance');
    expect(neutral.result).toEqual({ created: [], queued: [], refused: [] });
    expect(neutral.graph.getAllNodes()).toHaveLength(before);

    // Positive control: without this the assertion above holds for a stub.
    const acted = fire({ onAdvance: [SPAWN_HALL] }, 'success', 'advance');
    expect(acted.result.created).toHaveLength(1);
    expect(acted.graph.getAllNodes().length).toBeGreaterThan(before);
  });

  it('a halt creates nothing EVEN WITH onAdvance authored — and the same effects fire on advance', () => {
    const effects = { onAdvance: [SPAWN_HALL] };

    const halted = fire(effects, 'failure', 'halt');
    expect(halted.result.created).toEqual([]);
    expect(halted.graph.getNodesByType('location').filter(n => n.id !== SITE)).toHaveLength(0);

    const advanced = fire(effects, 'success', 'advance');
    expect(advanced.result.created).toHaveLength(1);
  });

  // ─── spawn_sublocation ────────────────────────────────────────────

  it('builds a sublocation hanging off the site, carrying its authored name', () => {
    const { graph, result } = fire({ onAdvance: [SPAWN_HALL] }, 'success', 'advance');
    expect(result.created).toHaveLength(1);
    const made = graph.getNode(result.created[0])!;
    expect(made.name).toBe('The New Hall');
    // THR-1183: the sublocation tier is a `location` node carrying `parentLocationId`.
    expect(made.type).toBe('location');
    expect(made.properties.parentLocationId).toBe(SITE);
  });

  it('names an unnamed creation through the work namer, never the raw type id', () => {
    // Restated in THR-1297 slice 4. This pin used to assert `name === 'shrine'` —
    // the raw `sublocationTypeId` reaching a player-facing surface as a place name,
    // which UI Law 14 and the plan's own fail-soft row both forbid ("never a
    // template id on a player surface"). An authored `nameTemplate` still wins; this
    // is only the *absence* case, and its new identity is "gets a real name".
    const { graph, result } = fire(
      { onAdvance: [{ kind: 'spawn_sublocation', sublocationTypeId: 'shrine' }] },
      'success', 'advance',
    );
    const name = graph.getNode(result.created[0])!.name;
    expect(name).not.toBe('shrine');
    expect(name.trim().length).toBeGreaterThan(0);
    expect(name).not.toMatch(/\{[a-zA-Z]+\}/);
    // Deterministic: the same creation names the same thing every run.
    const again = fire(
      { onAdvance: [{ kind: 'spawn_sublocation', sublocationTypeId: 'shrine' }] },
      'success', 'advance',
    );
    expect(again.graph.getNode(again.result.created[0])!.name).toBe(name);
  });

  // ─── spawn_npc: the persistence split ─────────────────────────────

  it('a must-persist spawn QUEUES a mint and writes no node yet', () => {
    const { graph, ss, result } = fire({ onAdvance: [SPAWN_STEWARD] }, 'success', 'advance');
    expect(result.queued).toHaveLength(1);
    expect(result.created).toEqual([]);
    expect(getMintQueue(ss)).toHaveLength(1);
    // The person is owed, not present — the valve bears them, within budget.
    expect(graph.getNode(result.queued[0])).toBeUndefined();
  });

  it('a scene-only spawn WRITES a walk-on now and queues nothing — the opposite arm', () => {
    const { graph, ss, result } = fire({ onAdvance: [SPAWN_FACE] }, 'success', 'advance');
    expect(result.created).toHaveLength(1);
    expect(result.queued).toEqual([]);
    expect(getMintQueue(ss)).toHaveLength(0);
    const made = graph.getNode(result.created[0])!;
    expect(made.properties.npcRole).toBe('porter');
    expect(made.properties.generatedBy).toBe('undertaking_creation_effect');
    // A walk-on still has to stand somewhere.
    expect(graph.getOutgoingEdges(made.id, 'located_at')[0]?.target).toBe(SITE);
  });

  it('a keyless must-persist spawn is idempotent across checkpoints — one steward, not one per band', () => {
    const graph = world();
    const ss = strategicState();
    const state = stateFor(graph, ss);
    const args = {
      state, graph, project: project(), template: template({ onAdvance: [SPAWN_STEWARD] }),
      band: 'success' as StepOutcome, effect: 'advance' as UndertakingCheckpointEffect, tick: 10,
    };

    applyCreationEffects(args);
    applyCreationEffects({ ...args, tick: 11 });
    applyCreationEffects({ ...args, tick: 12 });

    // A single-pass test would pass against a version that queues one per checkpoint.
    expect(getMintQueue(ss)).toHaveLength(1);
    expect(getMintQueue(ss)[0].castKey).toBe(derivedCreationCastKey('success', 'steward'));
  });

  it('an authored castKey wins over the derived one', () => {
    const { result, ss } = fire(
      { onAdvance: [{ ...SPAWN_STEWARD, castKey: '$chosen' }] }, 'success', 'advance',
    );
    expect(getMintQueue(ss)[0].castKey).toBe('$chosen');
    // The owed node id follows the authored key, not the derived one — which is what
    // makes an authored key addressable by everything downstream of the valve.
    expect(result.queued).toEqual([mintNodeId('proj-1', '$chosen')]);
    expect(result.queued[0]).not.toBe(
      mintNodeId('proj-1', derivedCreationCastKey('success', 'steward')),
    );
  });

  it('different bands derive different keys, so a failure\'s problem is not the success\'s reward', () => {
    expect(derivedCreationCastKey('success', 'steward'))
      .not.toBe(derivedCreationCastKey('critical_failure', 'steward'));
  });

  // ─── Fail-soft ────────────────────────────────────────────────────

  it('refuses cleanly when the undertaking has no resolvable site', () => {
    const { result, graph } = fire(
      { onAdvance: [SPAWN_HALL] }, 'success', 'advance',
      { targetNodeId: undefined, originLocationId: undefined },
    );
    expect(result.refused).toEqual(['no_site']);
    expect(result.created).toEqual([]);
    expect(graph.getNode(SITE)).toBeDefined(); // nothing was damaged on the way out
  });

  it('refuses cleanly when the site node has been removed since the project started', () => {
    const graph = world();
    const ss = strategicState();
    graph.removeNode(SITE);
    const result = applyCreationEffects({
      state: stateFor(graph, ss), graph, project: project(),
      template: template({ onAdvance: [SPAWN_HALL] }),
      band: 'success', effect: 'advance', tick: 10,
    });
    expect(result.refused).toEqual(['no_site']);
  });

  it('fires every effect in an authored list, mixing kinds', () => {
    const { result } = fire(
      { onAtCost: [SPAWN_HALL, SPAWN_FACE, SPAWN_STEWARD] }, 'success_at_cost', 'advance_at_cost',
    );
    expect(result.created).toHaveLength(2); // sublocation + walk-on
    expect(result.queued).toHaveLength(1);  // the must-persist steward
    expect(result.refused).toEqual([]);
  });
});
