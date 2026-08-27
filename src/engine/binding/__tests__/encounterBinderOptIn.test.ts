/**
 * The encounter opt-in route — THR-1296 §7, slice 6.
 *
 * The load-bearing test in this file is the **golden test**: an un-migrated template
 * must resolve byte-identically whether or not a binder context is supplied. That is
 * the plan's own kill criterion — "if un-migrated templates move at all, stop and
 * surface" — because opportunistic migration is only opportunistic if the un-migrated
 * corpus is untouched.
 *
 * A golden test alone is not enough, and the second test in this file is why: a golden
 * test passes trivially if the route never fires at all. Every claim here is therefore
 * paired — the flagged template *does* move, the un-flagged one does not, and the two
 * assertions run against the same world.
 */
import { describe, expect, it } from 'vitest';
import type { GameState } from '../../../types/gameState';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import type {
  EncounterSupportActorSpec,
  EncounterSupportBundle,
} from '../../../types/encounter';
import type { UndertakingBindingRecord } from '../../../types/strategicAction';
import { WorldGraph } from '../../graph';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import {
  prepareEncounterSupportBundle,
  prepareEncounterSupportBundleForContext,
  type EncounterBinderContext,
} from '../../encounterSupportBundle';
import { createBindingIndex } from '../bindingRegistry';
import { buildRoleCensus } from '../roleCensus';

// ─── Fixtures ───────────────────────────────────────────────────────

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 12,
    seed: 42,
    graph,
    phase: 'playing',
    strategicState: { bindings: [] },
  } as unknown as GameState;
}

function makeBinderCtx(
  graph: WorldGraph,
  bindings: UndertakingBindingRecord[],
  actorId?: string,
): EncounterBinderContext {
  return {
    census: buildRoleCensus(graph),
    index: createBindingIndex(),
    bindings,
    actorId,
  };
}

const SURVIVOR_SPEC: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'survivor',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['mercenary', 'scout'],
  supportRole: 'fellow_survivor',
  spawnNpcRole: 'mercenary',
  spawnName: 'Ivo Renn',
};

const SCENE_ONLY_SPEC: EncounterSupportActorSpec = {
  ...SURVIVOR_SPEC,
  key: 'bystander',
  persistence: 'scene-only',
  supportRole: 'bystander',
};

function makeTemplate(
  id: string,
  bundle: EncounterSupportBundle,
  useScoredBinder: boolean,
): UnifiedActionTemplate {
  return { id, supportBundle: bundle, useScoredBinder } as unknown as UnifiedActionTemplate;
}

/**
 * A settlement with one culture and a caller-chosen population.
 *
 * `locals` are role-matching bodies already standing at the place — the candidates the
 * board scores and the legacy matcher would grab first.
 */
function makeWorld(locals: ReadonlyArray<{ id: string; role: string }>): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc_town',
    type: 'location',
    name: 'Marrowford',
    properties: { locationSubtype: 'town', hexCol: 3, hexRow: 4 },
  });
  graph.addNode({
    id: 'culture_1',
    type: 'actor',
    name: 'Border Culture',
    properties: { actorType: 'culture' },
  });
  graph.addEdge({
    id: 'loc_town_belongs_to_culture_1',
    source: 'loc_town',
    target: 'culture_1',
    type: 'belongs_to',
    properties: { cultureLayer: 'current', culturalStrength: 1 },
  });

  for (const local of locals) {
    graph.addNode({
      id: local.id,
      type: 'actor',
      name: local.id,
      properties: {
        actorType: 'individual',
        spotlightTier: 'ambient',
        npcRole: local.role,
        importance: 0,
        sphereAffinity: null,
      },
    });
    graph.addEdge({
      id: `${local.id}_located_at_loc_town`,
      source: local.id,
      target: 'loc_town',
      type: 'located_at',
      properties: {},
    });
  }
  return graph;
}

/** Everything the world is made of, order-independent — the golden snapshot. */
function worldFingerprint(graph: WorldGraph): string {
  const nodes = graph.getAllNodes()
    .map(n => `${n.id}|${n.type}|${n.name}|${JSON.stringify(n.properties)}`)
    .sort();
  const edges = graph.getAllEdges()
    .map(e => `${e.id}|${e.source}|${e.target}|${e.type}|${JSON.stringify(e.properties)}`)
    .sort();
  return JSON.stringify({ nodes, edges });
}

// ─── The golden test — the slice's kill criterion ────────────────────

describe('legacy path is untouched by the opt-in (golden)', () => {
  it('resolves an un-migrated template identically with and without a binder context', () => {
    const withoutGraph = makeWorld([{ id: 'npc_scout', role: 'scout' }]);
    const withGraph = makeWorld([{ id: 'npc_scout', role: 'scout' }]);
    const template = makeTemplate('encounter.test.unmigrated', [SURVIVOR_SPEC], false);

    const withoutState = makeState(withoutGraph);
    const withoutBindings = withoutState.strategicState!.bindings!;
    const legacy = prepareEncounterSupportBundle(withoutState, template, 'loc_town', 'loc_town');

    const withState = makeState(withGraph);
    const withBindings = withState.strategicState!.bindings!;
    const routed = prepareEncounterSupportBundle(
      withState, template, 'loc_town', 'loc_town',
      makeBinderCtx(withGraph, withBindings, 'npc_scout'),
    );

    expect(routed).toEqual(legacy);
    expect(worldFingerprint(withGraph)).toBe(worldFingerprint(withoutGraph));
    // An un-migrated template writes no ledger row from either call.
    expect(withBindings).toHaveLength(0);
    expect(withoutBindings).toHaveLength(0);
  });

  it('leaves an un-migrated template on the legacy path even when it would bind differently', () => {
    // The falsifier for the test above. A world where the board's answer and the legacy
    // matcher's answer are *different people*: `npc_bonded` shares the agent's faction
    // (a story tie the board scores) while `npc_first` is the body the legacy scan hits
    // first. If the flag ever leaked, this is the assertion that would break.
    const graph = makeWorld([
      { id: 'npc_first', role: 'scout' },
      { id: 'npc_bonded', role: 'scout' },
    ]);
    const state = makeState(graph);
    const template = makeTemplate('encounter.test.unmigrated', [SURVIVOR_SPEC], false);

    const bindings = state.strategicState!.bindings!;
    const result = prepareEncounterSupportBundle(
      state, template, 'loc_town', 'loc_town',
      makeBinderCtx(graph, bindings, 'npc_bonded'),
    );

    // The legacy matcher takes the first role match at the placement, and writes nothing
    // to the ledger — regardless of what the board would have preferred.
    expect(result).toHaveLength(1);
    expect(result[0].nodeId).toBe('npc_first');
    expect(bindings).toHaveLength(0);
  });
});

// ─── The migrated path ──────────────────────────────────────────────

describe('a migrated template routes through the board', () => {
  it('registers a must-persist binding in the ledger', () => {
    const graph = makeWorld([{ id: 'npc_scout', role: 'scout' }]);
    const state = makeState(graph);
    const template = makeTemplate('encounter.test.migrated', [SURVIVOR_SPEC], true);
    const bindings = state.strategicState!.bindings!;

    const result = prepareEncounterSupportBundle(
      state, template, 'loc_town', 'loc_town',
      makeBinderCtx(graph, bindings, 'npc_scout'),
    );

    expect(result).toHaveLength(1);
    expect(bindings).toHaveLength(1);
    expect(bindings[0]).toMatchObject({
      castKey: 'survivor',
      nodeId: result[0].nodeId,
      kind: 'actor',
      persistence: 'must-persist',
      status: 'live',
      boundAtTick: 12,
    });
    // Keyed by template + anchor, not by call — see the idempotency test below.
    expect(bindings[0].projectId).toBe('enc_encounter.test.migrated_loc_town');
  });

  it('does NOT register a scene-only binding', () => {
    // The paired negative arm. Without it, "must-persist registers" passes just as well
    // against an implementation that registers everything — which would make every
    // walk-on defer housekeeping forever.
    const graph = makeWorld([{ id: 'npc_scout', role: 'scout' }]);
    const state = makeState(graph);
    const template = makeTemplate('encounter.test.sceneonly', [SCENE_ONLY_SPEC], true);
    const bindings = state.strategicState!.bindings!;

    const result = prepareEncounterSupportBundle(
      state, template, 'loc_town', 'loc_town',
      makeBinderCtx(graph, bindings, 'npc_scout'),
    );

    expect(result).toHaveLength(1);
    expect(bindings).toHaveLength(0);
  });

  it('writes one ledger row however many times the encounter is offered', () => {
    // The unbounded-growth guard. `prepareEncounterSupportBundle` runs every time the
    // encounter is offered, so a per-call project id would append a row per offer and
    // grow `strategicState.bindings` without bound across a long run. A single-pass
    // test passes against exactly that implementation.
    const graph = makeWorld([{ id: 'npc_scout', role: 'scout' }]);
    const state = makeState(graph);
    const template = makeTemplate('encounter.test.migrated', [SURVIVOR_SPEC], true);
    const bindings = state.strategicState!.bindings!;
    const ctx = makeBinderCtx(graph, bindings, 'npc_scout');

    for (let i = 0; i < 5; i++) {
      prepareEncounterSupportBundle(state, template, 'loc_town', 'loc_town', ctx);
    }

    expect(bindings).toHaveLength(1);
  });

  it('falls back to the legacy path when no binder context is supplied', () => {
    // Fail-soft (NFP #4): the flag alone must never break a caller that has no runtime
    // — the debug tools and the CLI construct state without one.
    const graph = makeWorld([{ id: 'npc_scout', role: 'scout' }]);
    const state = makeState(graph);
    const template = makeTemplate('encounter.test.migrated', [SURVIVOR_SPEC], true);

    const result = prepareEncounterSupportBundle(state, template, 'loc_town', 'loc_town');

    expect(result).toHaveLength(1);
    expect(state.strategicState!.bindings).toHaveLength(0);
  });

  it('routes the SHIPPED exemplar, not just a synthetic template', () => {
    // Every other test in this file builds its own template, so all of them would keep
    // passing if `useScoredBinder` were never actually set on anything in the corpus.
    // This one reads the shipped template out of the registry, which is the only
    // assertion that can fail when the exemplar migration is reverted.
    const template = getUnifiedTemplateById('encounter.border.one_body_short');
    expect(template).toBeDefined();
    expect(template!.useScoredBinder).toBe(true);

    const graph = makeWorld([{ id: 'npc_scout', role: 'scout' }]);
    const state = makeState(graph);
    const bindings = state.strategicState!.bindings!;

    const result = prepareEncounterSupportBundle(
      state, template!, 'loc_town', 'loc_town',
      makeBinderCtx(graph, bindings, 'npc_scout'),
    );

    // `survivor` is the key the sequel binds against — the reason this template was
    // chosen as the exemplar. It must resolve, and it must leave a ledger row.
    expect(result.map(b => b.key)).toContain('survivor');
    const survivorRow = bindings.find(b => b.castKey === 'survivor');
    expect(survivorRow).toMatchObject({ persistence: 'must-persist', status: 'live' });
  });

  it('never materializes past a delivery gate the legacy path would honor', () => {
    // `pre-seeded` through the plain entry point may not make anybody. The board is told
    // so via `mintAvailable`, so it returns the best real candidate instead of a mint —
    // and if there is none, the spec goes unresolved rather than conjuring one.
    const preSeeded: EncounterSupportActorSpec = { ...SURVIVOR_SPEC, delivery: 'pre-seeded' };
    const template = makeTemplate('encounter.test.preseeded', [preSeeded], true);

    // Each arm gets its own empty world. Sharing one is not a shortcut: the permissive
    // arm *materializes* a survivor, and the strict arm would then find and reuse them
    // — reporting a pass for the wrong reason.
    const permissiveWorld = makeWorld([]);
    const permissiveState = makeState(permissiveWorld);
    const prepared = prepareEncounterSupportBundleForContext(
      permissiveState, template, 'loc_town', 'loc_town',
      makeBinderCtx(permissiveWorld, permissiveState.strategicState!.bindings!),
    );
    // `ForContext` *does* allow pre-seeded materialization — this arm proves the
    // permissive entry point still reaches the world through the board.
    expect(prepared.bindings).toHaveLength(1);

    const strictWorld = makeWorld([]);
    const strictState = makeState(strictWorld);
    const before = worldFingerprint(strictWorld);
    const strict = prepareEncounterSupportBundle(
      strictState, template, 'loc_town', 'loc_town',
      makeBinderCtx(strictWorld, strictState.strategicState!.bindings!),
    );
    expect(strict).toHaveLength(0);
    // Nobody was conjured on the way to that empty answer.
    expect(worldFingerprint(strictWorld)).toBe(before);
    expect(strictState.strategicState!.bindings).toHaveLength(0);
  });
});
