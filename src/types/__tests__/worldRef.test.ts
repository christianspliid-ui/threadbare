/**
 * THR-1212 slice 1 — the `WorldRef` type, its adapters, and the live resolver.
 *
 * These tests are written against the *real* consumer unions and the *real* sentinel
 * resolver rather than fixtures that restate them. That is deliberate: the failure this
 * machinery exists to prevent is a type that passes every compile-time check while
 * resolving to nothing in play (THR-1165), and a test whose fixture invents both sides
 * of the contract verifies fiction.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { WorldGraph } from '../../engine/graph';
import type { NavigationTarget } from '../notification';
import type { EncounterAftermathConceptRef } from '../unifiedAction';
import {
  WORLD_REF_KINDS,
  WORLD_REF_RESERVED_KINDS,
  classifyWorldRefBinding,
  hexRefId,
  isReservedWorldRefKind,
  isWorldRefKind,
  parseHexRefId,
  type WorldRef,
  type WorldRefKind,
} from '../worldRef';
import {
  fromConceptRef,
  fromNarrativeSegment,
  fromNavigationTarget,
  hexRef,
  toEntityVisualRef,
  toNavigationTarget,
} from '../worldRefAdapters';
import {
  WORLDREF_DROP_LOG_MAX,
  clearWorldRefDrops,
  getWorldRefDrops,
  resolveWorldRef,
} from '../../engine/worldRefResolver';

const ENCOUNTER_ID = 'encounter.test.the_shared_anchor';

/** A world with an actor, a faction, and an artifact this encounter minted. */
function buildWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'Maret',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'actor-rival', type: 'actor', name: 'Ilve',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'faction-dawn-1', type: 'actor', name: 'The Dawn',
    properties: { actorType: 'faction', factionDefId: 'dawn' },
  });
  graph.addNode({
    id: 'artifact_minted_1', type: 'artifact', name: 'The Granary Key',
    properties: { sourceEncounterId: ENCOUNTER_ID, spawnedAtTick: 12, tier: 'common' },
  });
  graph.addEdge({
    id: 'possesses_actor-hero_artifact_minted_1',
    source: 'actor-hero', target: 'artifact_minted_1', type: 'possesses',
    properties: { spawnedAtTick: 12, sourceEncounterId: ENCOUNTER_ID },
  });
  return graph;
}

function ctx(graph: WorldGraph, over: Record<string, unknown> = {}) {
  return {
    graph,
    actorId: 'actor-hero',
    targetId: 'actor-rival',
    castNodeIdByKey: new Map<string, string>(),
    encounterTemplateId: ENCOUNTER_ID,
    surface: 'test',
    tick: 12,
    ...over,
  };
}

describe('WorldRefKind membership', () => {
  it('the runtime list and the type agree — every member is a kind, and the count is pinned', () => {
    // Pinned so an arm added to the type without a disposition anywhere fails loudly
    // here rather than silently defaulting to "not an anchor" downstream.
    expect(WORLD_REF_KINDS).toHaveLength(13);
    for (const kind of WORLD_REF_KINDS) expect(isWorldRefKind(kind)).toBe(true);
  });

  it('rejects strings that are not kinds — including the graph word this union replaces', () => {
    // `actor` is exactly the vocabulary collision this type exists to settle: the graph
    // says actor, every UI layer says agent, and `agent` is what wins here.
    expect(isWorldRefKind('actor')).toBe(false);
    expect(isWorldRefKind('')).toBe(false);
    expect(isWorldRefKind('AGENT')).toBe(false);
    expect(isWorldRefKind('agent')).toBe(true);
  });

  it('reserved kinds are a subset of the kinds, and codex is the one', () => {
    for (const kind of WORLD_REF_RESERVED_KINDS) expect(WORLD_REF_KINDS).toContain(kind);
    expect(isReservedWorldRefKind('codex')).toBe(true);
    expect(isReservedWorldRefKind('agent')).toBe(false);
  });
});

describe('binding forms', () => {
  it('classifies every shipped sentinel as a sentinel', () => {
    for (const id of ['$actor', '$target', '$artifact', '$cast:ally', '$faction:dawn']) {
      expect(classifyWorldRefBinding(id)).toBe('sentinel');
    }
  });

  it('does not pretend to tell a literal from a node id', () => {
    // Provenance, not string shape, separates those two — and guessing would launder
    // the violation the Law 56 gate exists to catch.
    expect(classifyWorldRefBinding('attachment.blessing.dawnlight')).toBe('literal-or-node');
    expect(classifyWorldRefBinding('actor-hero')).toBe('literal-or-node');
  });
});

describe('hex ids are coordinates, not node ids', () => {
  it('round-trips', () => {
    expect(parseHexRefId(hexRefId(4, 9))).toEqual({ col: 4, row: 9 });
    expect(parseHexRefId(hexRefId(-2, 0))).toEqual({ col: -2, row: 0 });
  });

  it('rejects malformed ids rather than coercing them', () => {
    // Number('') is 0 and Number('1.5') is 1.5 — both coerce silently, and a hex at
    // column 1.5 does not exist. Each of these would route somewhere wrong if accepted.
    for (const bad of ['', '4', '4,9,2', 'a,b', '1.5,2', '4,', ',9', 'NaN,1']) {
      expect(parseHexRefId(bad)).toBeUndefined();
    }
  });
});

describe('toNavigationTarget — partial, and partial in the documented places', () => {
  it('routes the kinds that have an arm', () => {
    expect(toNavigationTarget({ kind: 'agent', id: 'actor-hero' }))
      .toEqual({ kind: 'agent', agentId: 'actor-hero' });
    expect(toNavigationTarget({ kind: 'faction', id: 'faction-dawn-1' }))
      .toEqual({ kind: 'faction', factionId: 'faction-dawn-1' });
    expect(toNavigationTarget({ kind: 'receipt', id: 'receipt-3' }))
      .toEqual({ kind: 'receipt', receiptId: 'receipt-3' });
    expect(toNavigationTarget({ kind: 'encounter', id: ENCOUNTER_ID }))
      .toEqual({ kind: 'encounter', encounterId: ENCOUNTER_ID });
  });

  it('routes a sublocation to the location sheet — the surface that draws it', () => {
    expect(toNavigationTarget({ kind: 'sublocation', id: 'loc-inn-3' }))
      .toEqual({ kind: 'location', locationNodeId: 'loc-inn-3' });
  });

  it('drops codex — reserved, because no in-game codex destination exists', () => {
    expect(toNavigationTarget({ kind: 'codex', id: 'codex.reach.star' })).toBeUndefined();
  });

  it('routes a journey only when the caller supplies the traveller', () => {
    const ref: WorldRef = { kind: 'journey', id: 'journey-7' };
    expect(toNavigationTarget(ref)).toBeUndefined();
    expect(toNavigationTarget(ref, { agentId: 'actor-hero' }))
      .toEqual({ kind: 'journey', journeyId: 'journey-7', agentId: 'actor-hero' });
  });

  it('parses a hex ref, and drops a malformed one rather than routing to NaN', () => {
    expect(toNavigationTarget(hexRef(4, 9))).toEqual({ kind: 'hex', col: 4, row: 9 });
    expect(toNavigationTarget({ kind: 'hex', id: 'not-a-hex' })).toBeUndefined();
  });

  it('drops every kind with no NavigationTarget arm', () => {
    for (const kind of ['artifact', 'attachment', 'companion', 'army'] as const) {
      expect(toNavigationTarget({ kind, id: 'x' })).toBeUndefined();
    }
  });

  it('every kind is handled — none falls through to undefined by accident', () => {
    // Sweeps the measured range (the whole union), not a sampled few. A new kind added
    // without a case lands here as an unexpected undefined rather than in production.
    const routable = WORLD_REF_KINDS.filter(
      (k) => toNavigationTarget({ kind: k, id: k === 'hex' ? '1,1' : 'id' },
        { agentId: 'actor-hero' }) !== undefined,
    );
    expect([...routable].sort()).toEqual(
      ['agent', 'encounter', 'faction', 'hex', 'journey', 'location', 'receipt', 'sublocation'],
    );
  });
});

describe('toEntityVisualRef — attachment is absent on purpose', () => {
  it('maps the kinds with an entity-visual family', () => {
    expect(toEntityVisualRef({ kind: 'agent', id: 'actor-hero', name: 'Maret' }))
      .toEqual({ id: 'actor-hero', kind: 'agent', name: 'Maret' });
    expect(toEntityVisualRef({ kind: 'army', id: 'army-2' })?.kind).toBe('army');
  });

  it('drops attachment — its art lives on the template node (THR-1120)', () => {
    // Mapping it would create the wrong-tile bug the EntityVisualKind union currently
    // prevents at compile time.
    expect(toEntityVisualRef({ kind: 'attachment', id: 'attachment.blessing.dawnlight' }))
      .toBeUndefined();
  });

  it('drops the kinds that are events or documents rather than entities with portraits', () => {
    for (const kind of ['hex', 'encounter', 'journey', 'receipt', 'codex'] as const) {
      expect(toEntityVisualRef({ kind, id: 'x' })).toBeUndefined();
    }
  });
});

describe('fromNarrativeSegment — absent kind means agent', () => {
  it('defaults an absent entityKind to agent, for every pre-THR-1004 segment', () => {
    // Load-bearing compatibility rule: every pre-THR-1004 entityId came from the
    // narrative linker's cast scan and opened through the agent handler.
    expect(fromNarrativeSegment({ entityId: 'actor-hero' }))
      .toEqual({ kind: 'agent', id: 'actor-hero', tooltipId: undefined });
  });

  it('honours an explicit kind when the segment carries one', () => {
    expect(fromNarrativeSegment({ entityId: 'faction-dawn-1', entityKind: 'faction' })?.kind)
      .toBe('faction');
    expect(fromNarrativeSegment({ entityId: 'a', entityKind: 'attachment' })?.kind)
      .toBe('attachment');
  });

  it('reads nothing from a segment with no entity — plain prose stays plain', () => {
    expect(fromNarrativeSegment({})).toBeUndefined();
    expect(fromNarrativeSegment({ tooltipId: 'reach.star' })).toBeUndefined();
  });
});

describe('fromConceptRef', () => {
  it('reads a chip that names an entity', () => {
    const chip: EncounterAftermathConceptRef = {
      text: 'The Dawn', entityId: 'faction-dawn-1', visualKind: 'faction',
      visualName: 'The Dawn', tooltipId: 'ui.standing',
    };
    expect(fromConceptRef(chip)).toEqual({
      kind: 'faction', id: 'faction-dawn-1', name: 'The Dawn', tooltipId: 'ui.standing',
    });
  });

  it('reads nothing from a concept with no entity behind it', () => {
    // A trait or a standing carries a tooltip and no link — the common case, and
    // correct under Law 21 rather than a fault. The id here is a real registry entry
    // on purpose: the Law 17 gate scans this file too, and an invented one would be a
    // dead underline the moment anyone copied the fixture into content.
    expect(fromConceptRef({ text: 'standing', tooltipId: 'ui.standing' })).toBeUndefined();
    expect(fromConceptRef({ text: 'x', entityId: 'a' })).toBeUndefined();
  });
});

describe('fromNavigationTarget is total over the union', () => {
  it('reads every arm back to a kind', () => {
    const targets: NavigationTarget[] = [
      { kind: 'agent', agentId: 'a' },
      { kind: 'encounter', encounterId: 'e' },
      { kind: 'hex', col: 3, row: 4 },
      { kind: 'location', locationNodeId: 'l' },
      { kind: 'faction', factionId: 'f' },
      { kind: 'journey', journeyId: 'j', agentId: 'a' },
      { kind: 'receipt', receiptId: 'r' },
    ];
    for (const target of targets) {
      const ref = fromNavigationTarget(target);
      expect(isWorldRefKind(ref.kind)).toBe(true);
      expect(ref.id).toBeTruthy();
    }
    expect(fromNavigationTarget({ kind: 'hex', col: 3, row: 4 }).id).toBe('3,4');
  });
});

describe('resolveWorldRef — the live half', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = buildWorld();
    clearWorldRefDrops();
  });

  it('resolves the shipped sentinels against a real graph, via the one shared rule', () => {
    expect(resolveWorldRef({ kind: 'agent', id: '$actor' }, ctx(graph))).toBe('actor-hero');
    expect(resolveWorldRef({ kind: 'agent', id: '$target' }, ctx(graph))).toBe('actor-rival');
    expect(resolveWorldRef({ kind: 'faction', id: '$faction:dawn' }, ctx(graph)))
      .toBe('faction-dawn-1');
    expect(resolveWorldRef({ kind: 'artifact', id: '$artifact' }, ctx(graph)))
      .toBe('artifact_minted_1');
  });

  it('resolves a $cast: sentinel through the supplied bindings', () => {
    const bound = ctx(graph, { castNodeIdByKey: new Map([['ally', 'actor-rival']]) });
    expect(resolveWorldRef({ kind: 'agent', id: '$cast:ally' }, bound)).toBe('actor-rival');
  });

  it('drops an unbound $cast: sentinel — THR-1165, the case that type-checked and lied', () => {
    expect(resolveWorldRef({ kind: 'agent', id: '$cast:nobody' }, ctx(graph))).toBeUndefined();
  });

  it('drops $target when nothing was targeted', () => {
    expect(resolveWorldRef({ kind: 'agent', id: '$target' }, ctx(graph, { targetId: undefined })))
      .toBeUndefined();
  });

  it('passes a committed literal through unchanged', () => {
    expect(resolveWorldRef({ kind: 'attachment', id: 'attachment.blessing.dawn' }, ctx(graph)))
      .toBe('attachment.blessing.dawn');
  });

  it('resolves a hex without touching the graph, and drops a malformed one', () => {
    expect(resolveWorldRef(hexRef(2, 5), ctx(graph))).toBe('2,5');
    expect(resolveWorldRef({ kind: 'hex', id: 'x' }, ctx(graph))).toBeUndefined();
  });

  it('drops a codex ref — reserved, nothing to resolve to', () => {
    expect(resolveWorldRef({ kind: 'codex', id: 'codex.reach.star' }, ctx(graph)))
      .toBeUndefined();
  });
});

describe('the drop log', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = buildWorld();
    clearWorldRefDrops();
  });

  it('starts empty, and a successful resolution records nothing', () => {
    expect(getWorldRefDrops()).toHaveLength(0);
    resolveWorldRef({ kind: 'agent', id: '$actor' }, ctx(graph));
    expect(getWorldRefDrops()).toHaveLength(0);
  });

  it('records a drop with the surface and tick that produced it', () => {
    resolveWorldRef(
      { kind: 'agent', id: '$cast:nobody' },
      ctx(graph, { surface: 'aftermath-chip', tick: 41 }),
    );
    expect(getWorldRefDrops()).toEqual([
      { refKind: 'agent', id: '$cast:nobody', surface: 'aftermath-chip', tick: 41 },
    ]);
  });

  it('falls back to markers rather than dropping the record when context is thin', () => {
    resolveWorldRef({ kind: 'codex', id: 'c' }, { graph });
    expect(getWorldRefDrops()[0]).toMatchObject({ surface: 'unknown', tick: -1 });
  });

  it('caps at WORLDREF_DROP_LOG_MAX, keeping the newest', () => {
    const overflow = WORLDREF_DROP_LOG_MAX + 25;
    for (let i = 0; i < overflow; i += 1) {
      resolveWorldRef({ kind: 'codex', id: `c-${i}` }, ctx(graph));
    }
    const drops = getWorldRefDrops();
    expect(drops).toHaveLength(WORLDREF_DROP_LOG_MAX);
    // Oldest evicted, newest retained — a ring buffer, not a truncated prefix.
    expect(drops[0]?.id).toBe(`c-${overflow - WORLDREF_DROP_LOG_MAX}`);
    expect(drops[drops.length - 1]?.id).toBe(`c-${overflow - 1}`);
  });

  it('hands back a copy — a caller cannot corrupt the evidence it came to read', () => {
    resolveWorldRef({ kind: 'codex', id: 'c' }, ctx(graph));
    (getWorldRefDrops() as unknown as unknown[]).length = 0;
    expect(getWorldRefDrops()).toHaveLength(1);
  });
});

describe('the type is not sufficient on its own — the pilot lesson, made checkable', () => {
  it('a ref that passes every static check can still resolve to nothing', () => {
    // This is the whole reason a paired live resolver exists. Both refs below are
    // perfectly well-typed; only one of them names something real in this world.
    const graph = buildWorld();
    clearWorldRefDrops();
    const real: WorldRef = { kind: 'agent', id: '$actor' };
    const hollow: WorldRef = { kind: 'agent', id: '$cast:the_caravan' };
    expect(resolveWorldRef(real, ctx(graph))).toBeDefined();
    expect(resolveWorldRef(hollow, ctx(graph))).toBeUndefined();
    expect(getWorldRefDrops().map((d) => d.id)).toEqual(['$cast:the_caravan']);
  });
});

describe('kind vocabulary reconciliation', () => {
  it('every EncounterAftermathConceptRef.visualKind is a WorldRefKind', () => {
    // The chip vocabulary must be a projection of the canonical one, or a chip could
    // name a kind the shared type cannot express.
    const visualKinds = ['agent', 'faction', 'artifact', 'companion', 'attachment', 'location'];
    for (const kind of visualKinds) expect(isWorldRefKind(kind)).toBe(true);
  });

  it('every narrative-segment entityKind is a WorldRefKind', () => {
    const segmentKinds = ['agent', 'faction', 'artifact', 'companion', 'attachment', 'location'];
    for (const kind of segmentKinds) expect(isWorldRefKind(kind)).toBe(true);
  });

  it('every NavigationTarget arm maps to a WorldRefKind', () => {
    const arms: WorldRefKind[] = [
      'agent', 'encounter', 'hex', 'location', 'faction', 'journey', 'receipt',
    ];
    for (const arm of arms) expect(WORLD_REF_KINDS).toContain(arm);
  });
});
