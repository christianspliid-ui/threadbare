/**
 * The verb × object-type registry (THR-1392 slice 1) — what every object type must
 * declare, and that its readers answer from the graph rather than from fiction.
 *
 * Each read below is exercised on a hand-built graph whose one relevant property is
 * the thing under test, and the missing-source arm is exercised too (a `tierOf` that
 * cannot answer must say so, not invent a number — the acceptance counts defaults).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../engine/graph';
import {
  UNDERTAKING_OBJECT_TYPES,
  HARM_ON_DESTROY,
  getUndertakingObjectType,
  enumerateObjectHandles,
  resolveObjectOwners,
  tierOfObject,
  objectPlaceNodeId,
} from '../undertaking-objects';
import {
  UNDERTAKING_VERB_VARIANTS,
  UNDERTAKING_VERBS,
  UNDERTAKING_VERB_PAYOFF,
  UNDERTAKING_VERB_DIFFICULTY,
  UNDERTAKING_VERB_DURATION,
  OWNERSHIP_BY_VERB,
  MOTIVE_GATED_VERBS,
  UNDERTAKING_DEFAULT_TIER,
  ROUTE_IDENTITY_SUBTYPE,
} from '../strategic-action-constants';
import { UNDERTAKING_TIER_PAYOFF_BANDS } from '../content-eval/undertakingConstants';

const TYPE_IDS = ['area', 'location', 'place', 'route', 'faction', 'company', 'army', 'network', 'companion', 'item', 'power', 'condition', 'agreement', 'standing'] as const;

describe('the object-type registry', () => {
  it('registers the fourteen catalogue kinds once each, with a shape, a lexicon and a harm class', () => {
    expect(UNDERTAKING_OBJECT_TYPES.map(t => t.id).sort()).toEqual([...TYPE_IDS].sort());
    for (const t of UNDERTAKING_OBJECT_TYPES) {
      expect(!!t.shape.nodeType !== !!t.shape.edgeType, `${t.id} is a node or an edge object, not both`).toBe(true);
      expect(t.lexicon.length).toBeGreaterThan(0);
      expect(HARM_ON_DESTROY[t.id]).toBe(t.harmOnDestroy);
    }
    expect(Object.keys(HARM_ON_DESTROY).sort()).toEqual([...TYPE_IDS].sort());
  });

  it('declares verbs only from the closed variant set, and every type that can be made can be unmade', () => {
    for (const t of UNDERTAKING_OBJECT_TYPES) {
      const declared = Object.keys(t.verbs);
      expect(declared.length, `${t.id} declares at least one verb`).toBeGreaterThan(0);
      for (const v of declared) expect(UNDERTAKING_VERB_VARIANTS, `${t.id}.${v}`).toContain(v);
      // The counter-play column: a kind with a create and no destroy was the no-destroy-no-kind rule.
      if (t.verbs.create && t.id !== 'route') expect(t.verbs.destroy, `${t.id} has a destroy`).toBeDefined();
    }
    // The route is the one exception, recorded on the grid: a blockade lifts (change:lower); tearing a route up is an open cell.
    expect(getUndertakingObjectType('route')!.verbs['change:lower']).toBeDefined();
  });

  it('keeps the verb tables inside the tier bands and the gate on the two counter-play verbs', () => {
    for (const v of UNDERTAKING_VERB_VARIANTS) {
      for (const tier of [1, 2, 3] as const) {
        const [lo, hi] = UNDERTAKING_TIER_PAYOFF_BANDS[tier];
        const payoff = UNDERTAKING_VERB_PAYOFF[v][tier - 1];
        expect(payoff, `${v} T${tier} payoff`).toBeGreaterThanOrEqual(lo);
        expect(payoff, `${v} T${tier} payoff`).toBeLessThanOrEqual(hi);
        expect(UNDERTAKING_VERB_DIFFICULTY[v][tier - 1]).toBeGreaterThan(0);
        expect(UNDERTAKING_VERB_DIFFICULTY[v][tier - 1]).toBeLessThan(1);
        expect(UNDERTAKING_VERB_DURATION[v][tier - 1]).toBeGreaterThanOrEqual(0);
      }
    }
    for (const gated of MOTIVE_GATED_VERBS) expect(OWNERSHIP_BY_VERB[gated]).toBe('other');
    expect(MOTIVE_GATED_VERBS).toEqual(['control:seize', 'change:lower', 'destroy']);
    expect(OWNERSHIP_BY_VERB['control:claim']).toBe('unowned');
    expect(UNDERTAKING_VERBS).toContain('control');
    expect(UNDERTAKING_VERB_VARIANTS).not.toContain('control');
  });
});

describe('the readers', () => {
  it('reads tiers off the object, and says so when the source is missing', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'town', name: 'Town', type: 'location', properties: { locationSubtype: 'town', hexCol: 0, hexRow: 0 } });
    g.addNode({ id: 'capital', name: 'Capital', type: 'location', properties: { locationSubtype: 'capital', hexCol: 5, hexRow: 0 } });
    g.addNode({ id: 'court', name: 'Court', type: 'location', properties: { parentLocationId: 'capital', sublocationTypeId: 'sublocation-type.court' } });
    g.addNode({ id: 'granary', name: 'Granary', type: 'location', properties: { parentLocationId: 'town', sublocationTypeId: 'granary' } });
    g.addNode({ id: 'oddroom', name: 'Odd', type: 'location', properties: { parentLocationId: 'town', sublocationTypeId: 'sublocation-type.no-such-type' } });
    g.addNode({ id: 'route', name: 'Saltway', type: 'location', properties: { locationSubtype: ROUTE_IDENTITY_SUBTYPE, routeSourceId: 'town', routeTargetId: 'capital' } });
    g.addNode({ id: 'chart', name: 'Chart', type: 'artifact', properties: { tier: 1 } });
    g.addNode({ id: 'relic', name: 'Relic', type: 'artifact', properties: { tier: 4 } });
    g.addNode({ id: 'untiered', name: 'Trinket', type: 'artifact', properties: {} });
    g.addNode({ id: 'holder', name: 'Holder', type: 'actor', properties: { actorType: 'individual' } });
    g.addNode({ id: 'subject', name: 'Subject', type: 'actor', properties: { actorType: 'individual' } });
    g.addEdge({ id: 'agreement', source: 'holder', target: 'subject', type: 'knows_secret_of', properties: { magnitude: 0.9, revealed: false, secretType: 'affair', discoveredTick: 0, source: 'observed' } });

    const tier = (typeId: typeof TYPE_IDS[number], handle: Parameters<typeof tierOfObject>[2]) =>
      tierOfObject(g, getUndertakingObjectType(typeId)!, handle);

    expect(tier('location', { kind: 'node', nodeId: 'town' })).toEqual({ tier: 2, defaulted: false });
    expect(tier('location', { kind: 'node', nodeId: 'capital' })).toEqual({ tier: 3, defaulted: false });
    expect(tier('place', { kind: 'node', nodeId: 'court' })).toEqual({ tier: 3, defaulted: false });
    expect(tier('place', { kind: 'node', nodeId: 'granary' })).toEqual({ tier: 1, defaulted: false });
    expect(tier('place', { kind: 'node', nodeId: 'oddroom' })).toEqual({ tier: UNDERTAKING_DEFAULT_TIER, defaulted: true });
    expect(tier('route', { kind: 'node', nodeId: 'route' })).toEqual({ tier: 2, defaulted: false }); // 5 hexes: > 3, ≤ 6
    expect(tier('item', { kind: 'node', nodeId: 'chart' })).toEqual({ tier: 1, defaulted: false });
    expect(tier('item', { kind: 'node', nodeId: 'relic' })).toEqual({ tier: 3, defaulted: false }); // 4 clamps to the ladder
    expect(tier('item', { kind: 'node', nodeId: 'untiered' })).toEqual({ tier: UNDERTAKING_DEFAULT_TIER, defaulted: true });
    expect(tier('agreement', { kind: 'edge', edgeId: 'agreement' })).toEqual({ tier: 3, defaulted: false });
    expect(tier('agreement', { kind: 'edge', edgeId: 'nope' })).toEqual({ tier: UNDERTAKING_DEFAULT_TIER, defaulted: true });
  });

  it('enumerates objects by shape — never holding faces, disbanded companies or revealed marks', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'a', name: 'A', type: 'actor', properties: { actorType: 'individual' } });
    g.addNode({ id: 'b', name: 'B', type: 'actor', properties: { actorType: 'individual' } });
    g.addNode({ id: 'chart', name: 'Chart', type: 'artifact', properties: { tier: 1 } });
    g.addNode({ id: 'face', name: 'Face', type: 'artifact', properties: { attachmentCategory: 'holding', holdingNodeId: 'shop' } });
    g.addNode({ id: 'band', name: 'Band', type: 'actor', properties: { actorType: 'group', groupKind: 'company' } });
    g.addNode({ id: 'gone', name: 'Gone', type: 'actor', properties: { actorType: 'group', groupKind: 'company', groupStatus: 'disbanded' } });
    g.addNode({ id: 'guild', name: 'Guild', type: 'actor', properties: { actorType: 'faction' } });
    g.addEdge({ id: 'm1', source: 'a', target: 'b', type: 'knows_secret_of', properties: { magnitude: 0.3, revealed: false, secretType: 'affair', discoveredTick: 0, source: 'observed' } });
    g.addEdge({ id: 'm2', source: 'b', target: 'a', type: 'knows_secret_of', properties: { magnitude: 0.3, revealed: true, secretType: 'affair', discoveredTick: 0, source: 'observed' } });

    const ids = (typeId: typeof TYPE_IDS[number]) =>
      enumerateObjectHandles(g, getUndertakingObjectType(typeId)!).map(h => (h.kind === 'node' ? h.nodeId : h.edgeId));

    expect(ids('item')).toEqual(['chart']);
    expect(ids('company')).toEqual(['band']);
    expect(ids('faction')).toEqual(['guild']);
    expect(ids('agreement')).toEqual(['m1']);
    expect(objectPlaceNodeId(g, { kind: 'edge', edgeId: 'm1' })).toBe('b');
  });

  it('reads owners through each type\'s own edges — possesses, commanded_by, and an edge\'s source', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'a', name: 'A', type: 'actor', properties: { actorType: 'individual' } });
    g.addNode({ id: 'b', name: 'B', type: 'actor', properties: { actorType: 'individual' } });
    g.addNode({ id: 'chart', name: 'Chart', type: 'artifact', properties: { tier: 1 } });
    g.addNode({ id: 'band', name: 'Band', type: 'actor', properties: { actorType: 'group', groupKind: 'company' } });
    g.addNode({ id: 'town', name: 'Town', type: 'location', properties: { locationSubtype: 'town', hexCol: 0, hexRow: 0 } });
    g.addEdge({ id: 'p', source: 'a', target: 'chart', type: 'possesses', properties: { active: true } });
    g.addEdge({ id: 'c', source: 'band', target: 'b', type: 'commanded_by', properties: {} });
    g.addEdge({ id: 'm', source: 'b', target: 'a', type: 'knows_secret_of', properties: { magnitude: 0.5, revealed: false, secretType: 'affair', discoveredTick: 0, source: 'observed' } });

    const owners = (typeId: typeof TYPE_IDS[number], handle: Parameters<typeof resolveObjectOwners>[2]) =>
      resolveObjectOwners(g, getUndertakingObjectType(typeId)!, handle);

    expect(owners('item', { kind: 'node', nodeId: 'chart' })).toEqual(['a']);
    expect(owners('company', { kind: 'node', nodeId: 'band' })).toEqual(['b']);
    expect(owners('agreement', { kind: 'edge', edgeId: 'm' })).toEqual(['b']);
    expect(owners('location', { kind: 'node', nodeId: 'town' })).toEqual([]);
  });
});
