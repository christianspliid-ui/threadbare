/**
 * The registry reads the edges the world writes — THR-1436.
 *
 * Six object types read ownership through an edge the world never wrote, or ignored
 * the one it did, and their cells refused `no_owned_object` on every seed. Each read
 * below is falsified against the shape the *writer* produces — `accompanies` bearer →
 * companion (`companions.ts`), `has_trait` bearer → shared definition (THR-1395),
 * `relates_to` beside `reputation_with` (worldgen), a catalog template seeded as a
 * node — on a hand-built graph whose one relevant property is the thing under test,
 * with the negative arm beside it so a reader nobody calls goes red. The counts on a
 * generated world live in `undertakingOwnershipCensus.test.ts` (heavy lane).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { UndertakingObjectHandle } from '../../types/strategicAction';
import {
  getUndertakingObjectType,
  enumerateObjectHandles,
  resolveObjectOwners,
  tierOfObject,
  objectPlaceNodeId,
  isObjectOfType,
  ownershipCensus,
  CATALOG_TEMPLATE_IDS,
  type ObjectVerbContext,
  type ObjectVerbEntry,
} from '../../data/undertaking-objects';
import { REWARD_POSSESSIONS } from '../../data/reward-attachment-catalog';
import { UNDERTAKING_CELL_TEMPLATES } from '../../data/undertaking-cells';
import { CONDITION_ALLY_STANDING_MIN } from '../../data/strategic-action-constants';
import { evaluateMotiveGate } from '../undertakingMotive';

const COMPANION = getUndertakingObjectType('companion')!;
const CONDITION = getUndertakingObjectType('condition')!;
const STANDING = getUndertakingObjectType('standing')!;
const ITEM = getUndertakingObjectType('item')!;
const FACTION = getUndertakingObjectType('faction')!;

function mortal(g: WorldGraph, id: string): void {
  g.addNode({ id, name: id, type: 'actor', properties: { actorType: 'individual' } });
}

function ctx(graph: WorldGraph, actorId: string, handle: UndertakingObjectHandle): ObjectVerbContext {
  return {
    state: { tick: 1, effectStates: new Map() } as unknown as GameState,
    graph,
    actorId,
    handle,
    tick: 1,
  };
}

/** Invoke a completion semantic; a sustained-mode entry is not what these cells are. */
function call(entry: ObjectVerbEntry | undefined, c: ObjectVerbContext) {
  if (typeof entry !== 'function') throw new Error('expected a completion semantic');
  return entry(c);
}

const ids = (g: WorldGraph, type: typeof COMPANION) =>
  enumerateObjectHandles(g, type).map(h => (h.kind === 'node' ? h.nodeId : h.edgeId));

// ─── R2 — Companion through `accompanies` ───────────────────────────

describe('a companion is held by the mortal they walk beside', () => {
  it('reads the holder through `accompanies` (bearer → companion), and nobody without it', () => {
    const g = new WorldGraph();
    mortal(g, 'bearer');
    g.addNode({ id: 'comp', name: 'Comp', type: 'companion', properties: {} });
    expect(ids(g, COMPANION)).toEqual(['comp']);
    expect(resolveObjectOwners(g, COMPANION, { kind: 'node', nodeId: 'comp' })).toEqual([]);

    g.addEdge({ id: 'acc', source: 'bearer', target: 'comp', type: 'accompanies', properties: { sinceTick: 0, ticksRemaining: 10, totalTicks: 10, source: 'test' } });
    expect(resolveObjectOwners(g, COMPANION, { kind: 'node', nodeId: 'comp' })).toEqual(['bearer']);
  });
});

// ─── R3 — Condition: the borne edge, and the signed cure ────────────

function conditionWorld(): WorldGraph {
  const g = new WorldGraph();
  for (const id of ['healer', 'a', 'b']) mortal(g, id);
  g.addNode({ id: 'wound', name: 'Deep Wound', type: 'trait', properties: { subcategory: 'condition', tier: 2 } });
  g.addNode({ id: 'scar', name: 'Old Scar', type: 'trait', properties: { subcategory: 'scar' } });
  g.addNode({ id: 'spell', name: 'A Spell', type: 'trait', properties: { subcategory: 'spell' } });
  g.addEdge({ id: 'e_a', source: 'a', target: 'wound', type: 'has_trait', properties: {} });
  g.addEdge({ id: 'e_b', source: 'b', target: 'wound', type: 'has_trait', properties: {} });
  g.addEdge({ id: 'e_scar', source: 'b', target: 'scar', type: 'has_trait', properties: {} });
  g.addEdge({ id: 'e_spell', source: 'a', target: 'spell', type: 'has_trait', properties: {} });
  return g;
}

describe('a condition object is one mortal\'s bearing of it', () => {
  it('enumerates the borne edges to condition-class definitions, never the definitions or a spell', () => {
    const g = conditionWorld();
    expect(ids(g, CONDITION)).toEqual(['e_a', 'e_b', 'e_scar']);
    expect(isObjectOfType(g, CONDITION, { kind: 'edge', edgeId: 'e_spell' })).toBe(false);
    expect(isObjectOfType(g, CONDITION, { kind: 'node', nodeId: 'wound' })).toBe(false);
  });

  it('is held by the bearer, stands where the bearer stands, and tiers off the definition', () => {
    const g = conditionWorld();
    expect(resolveObjectOwners(g, CONDITION, { kind: 'edge', edgeId: 'e_a' })).toEqual(['a']);
    expect(objectPlaceNodeId(g, { kind: 'edge', edgeId: 'e_a' })).toBe('a');
    expect(tierOfObject(g, CONDITION, { kind: 'edge', edgeId: 'e_a' })).toEqual({ tier: 2, defaulted: false });
    expect(tierOfObject(g, CONDITION, { kind: 'edge', edgeId: 'e_scar' }).defaulted).toBe(true);
  });

  it('the cure removes exactly one bearer\'s edge — the shared definition and the other bearer keep theirs', () => {
    const g = conditionWorld();
    const result = call(CONDITION.verbs.destroy, ctx(g, 'healer', { kind: 'edge', edgeId: 'e_a' }));
    expect(result.success).toBe(true);
    expect(g.getEdge('e_a')).toBeUndefined();
    expect(g.getEdge('e_b')).toBeDefined();
    expect(g.getNode('wound')).toBeDefined();
    expect(ids(g, CONDITION)).toEqual(['e_b', 'e_scar']);
  });

  it('refuses a cure whose bearer is gone, and one that names no edge', () => {
    const g = conditionWorld();
    g.removeNode('a');
    expect(call(CONDITION.verbs.destroy, ctx(g, 'healer', { kind: 'edge', edgeId: 'e_a' })).success).toBe(false);
    expect(call(CONDITION.verbs.destroy, ctx(g, 'healer', { kind: 'node', nodeId: 'wound' })).success).toBe(false);
  });
});

describe('the cure is signed like the blessing', () => {
  const cure = UNDERTAKING_CELL_TEMPLATES.find(t => t.objectTypeId === 'condition' && t.cellVariant === 'destroy')!;
  const handle: UndertakingObjectHandle = { kind: 'edge', edgeId: 'e_a' };

  it('the cell is motive-gated, so the exemption is the only door for a friend', () => {
    expect(cure.motiveGate?.length).toBeGreaterThan(0);
  });

  it('an ally\'s cure passes the gate on the exemption, recorded as `ally`', () => {
    const g = conditionWorld();
    g.addEdge({ id: 'rep', source: 'healer', target: 'a', type: 'reputation_with', properties: { score: CONDITION_ALLY_STANDING_MIN } });
    expect(evaluateMotiveGate(g, 'healer', 'a', cure, handle)).toMatchObject({ allowed: true, exempt: 'ally', ownerCount: 1 });
  });

  it('a stranger\'s cure is refused — the bearer is owned, the healer has no reason', () => {
    const g = conditionWorld();
    expect(evaluateMotiveGate(g, 'healer', 'a', cure, handle)).toEqual({ allowed: false, ownerCount: 1 });
  });

  it('an enemy\'s cure (lifting their seal) passes on the motive, not the exemption', () => {
    const g = conditionWorld();
    g.addEdge({ id: 'h', source: 'healer', target: 'a', type: 'hostile_to', properties: { cause: 'covets' } });
    const verdict = evaluateMotiveGate(g, 'healer', 'a', cure, handle);
    expect(verdict.allowed).toBe(true);
    expect(verdict.exempt).toBeUndefined();
    expect(verdict.ownerId).toBe('a');
  });

  it('one\'s own wound is not a door — the exemption answers nothing for the bearer', () => {
    const g = conditionWorld();
    expect(CONDITION.gateExemption!.destroy!(g, 'a', handle)).toBeNull();
  });
});

// ─── R4 — Standing: one object per ordered pair ─────────────────────

describe('a standing is one ordered pair, the score winning over the seeded relationship', () => {
  function standingWorld(): WorldGraph {
    const g = new WorldGraph();
    for (const id of ['a', 'b']) mortal(g, id);
    g.addNode({ id: 'town', name: 'Town', type: 'location', properties: { locationSubtype: 'town', hexCol: 0, hexRow: 0 } });
    g.addNode({ id: 'wound', name: 'Wound', type: 'trait', properties: { subcategory: 'condition' } });
    g.addEdge({ id: 'r_ab', source: 'a', target: 'b', type: 'relates_to', properties: { sentiment: 0.8, basis: 'friendship', trust: 0.4 } });
    g.addEdge({ id: 's_ab', source: 'a', target: 'b', type: 'reputation_with', properties: { score: 0.9, lastChangedTick: 0 } });
    g.addEdge({ id: 'r_ba', source: 'b', target: 'a', type: 'relates_to', properties: { sentiment: -0.2, basis: 'rivalry', trust: -0.1 } });
    g.addEdge({ id: 'r_at', source: 'a', target: 'town', type: 'relates_to', properties: { sentiment: 0.5 } });
    g.addEdge({ id: 'r_aw', source: 'a', target: 'wound', type: 'relates_to', properties: { sentiment: 0.5 } });
    return g;
  }

  it('enumerates both edge types, one handle per ordered pair, never a pair with a non-party', () => {
    const g = standingWorld();
    expect(ids(g, STANDING)).toEqual(['r_at', 'r_ba', 's_ab']);
    expect(isObjectOfType(g, STANDING, { kind: 'edge', edgeId: 'r_ab' })).toBe(true);
    expect(isObjectOfType(g, STANDING, { kind: 'edge', edgeId: 'r_aw' })).toBe(false);
  });

  it('is held by the edge\'s source and tiers off the score, else the sentiment', () => {
    const g = standingWorld();
    expect(resolveObjectOwners(g, STANDING, { kind: 'edge', edgeId: 'r_ba' })).toEqual(['b']);
    expect(tierOfObject(g, STANDING, { kind: 'edge', edgeId: 's_ab' })).toEqual({ tier: 3, defaulted: false });
    expect(tierOfObject(g, STANDING, { kind: 'edge', edgeId: 'r_ba' })).toEqual({ tier: 1, defaulted: false });
    expect(tierOfObject(g, STANDING, { kind: 'edge', edgeId: 'r_at' })).toEqual({ tier: 2, defaulted: false });
  });
});

// ─── R5 — Item: a catalog template is not an object ─────────────────

describe('a catalog template is not an item; the instance minted from it is', () => {
  it('excludes the seeded template by id and admits an instance that spreads its properties', () => {
    const template = REWARD_POSSESSIONS[0];
    expect(CATALOG_TEMPLATE_IDS.has(template.id)).toBe(true);
    const g = new WorldGraph();
    g.addNode(template);
    g.addNode({ ...template, id: 'reward_instance_1' });
    expect(ids(g, ITEM)).toEqual(['reward_instance_1']);
  });
});

// ─── R1 — Faction: the leader, or nobody ────────────────────────────

describe('a faction is held by its leader, and a leaderless one by nobody', () => {
  it('declares its own reader and reads unowned with no members', () => {
    expect(FACTION.ownersOf).toBeDefined();
    expect(FACTION.ownedVia).toEqual([]);
    const g = new WorldGraph();
    g.addNode({ id: 'guild', name: 'Guild', type: 'actor', properties: { actorType: 'faction' } });
    expect(resolveObjectOwners(g, FACTION, { kind: 'node', nodeId: 'guild' })).toEqual([]);
    expect(ownershipCensus(g, FACTION, () => true)).toEqual({ objectTypeId: 'faction', objects: 1, owned: 0, ownedByDeciding: 0 });
  });
});

// ─── The census reader ──────────────────────────────────────────────

describe('the ownership census', () => {
  it('counts objects, owned objects, and those held by a deciding mortal — through the caller\'s predicate', () => {
    const g = new WorldGraph();
    mortal(g, 'bearer');
    mortal(g, 'idle');
    for (const id of ['c1', 'c2', 'c3']) g.addNode({ id, name: id, type: 'companion', properties: {} });
    g.addEdge({ id: 'a1', source: 'bearer', target: 'c1', type: 'accompanies', properties: { sinceTick: 0, ticksRemaining: 10, totalTicks: 10, source: 'test' } });
    g.addEdge({ id: 'a2', source: 'idle', target: 'c2', type: 'accompanies', properties: { sinceTick: 0, ticksRemaining: 10, totalTicks: 10, source: 'test' } });
    expect(ownershipCensus(g, COMPANION, n => n.id === 'bearer')).toEqual({ objectTypeId: 'companion', objects: 3, owned: 2, ownedByDeciding: 1 });
  });
});
