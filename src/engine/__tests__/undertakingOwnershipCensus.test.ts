// @vitest-lane heavy — builds a small world, drives it 20 ticks and reads the ownership census on it (THR-1436)
/**
 * The ownership census on a generated world — THR-1436's Done-when, falsified against
 * the world the writers actually make rather than a fixture that invents both sides.
 *
 * Every count below is recomputed independently of the registry (a raw edge walk with
 * the same predicate) and compared to what `enumerateObjectHandles` and
 * `resolveObjectOwners` answer, so a registry that reads the wrong edge, or none, goes
 * red on the real population: factions with a derivable leader, borne conditions,
 * seeded relationships, artifacts that are not catalog templates, and a route the cell
 * itself mints.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { isAutonomousDecisionActor } from '../strategicKindReachability';
import { getFactionLeaderId } from '../factionNetwork';
import { getLocationNodes } from '../sublocationShape';
import { resolveLocationToHex } from '../encounterAwareness';
import { hexDistance } from '../../lib/hexMath';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import { CONDITION_SUBCATEGORIES } from '../../data/world-objects';
import { ROUTE_IDENTITY_SUBTYPE } from '../../data/strategic-action-constants';
import {
  getUndertakingObjectType,
  enumerateObjectHandles,
  resolveObjectOwners,
  ownershipCensus,
  CATALOG_TEMPLATE_IDS,
  type ObjectVerbContext,
} from '../../data/undertaking-objects';

const SEED = 42;
const TICKS = 20;

function world(seed: number, ticks: number): GameState {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS.small;
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);
  for (let i = 0; i < ticks; i++) state = runTick(state, [], runtime);
  return state;
}

const state = world(SEED, TICKS);
const g = state.graph;

const handleIds = (typeId: Parameters<typeof getUndertakingObjectType>[0]) =>
  enumerateObjectHandles(g, getUndertakingObjectType(typeId)!).map(h => (h.kind === 'node' ? h.nodeId : h.edgeId)).sort();

describe(`the ownership census on seed ${SEED}, small, tick ${TICKS}`, () => {
  it('Faction — every faction with a derivable leader is owned by that leader, and only those', () => {
    const FACTION = getUndertakingObjectType('faction')!;
    const handles = enumerateObjectHandles(g, FACTION);
    expect(handles.length).toBeGreaterThan(0);
    let withLeader = 0;
    for (const h of handles) {
      const id = h.kind === 'node' ? h.nodeId : '';
      const leader = getFactionLeaderId(g, id);
      const owners = resolveObjectOwners(g, FACTION, h);
      if (leader) {
        withLeader += 1;
        expect(owners, `${id} is held by its leader`).toEqual([leader]);
      } else {
        expect(owners, `${id} has no leader and no holder`).toEqual([]);
      }
    }
    // The registry read `commanded_by` / `leads` before THR-1436, which no faction writer
    // produces at seeding — the population must not be all-unowned.
    expect(withLeader).toBeGreaterThan(0);
    expect(ownershipCensus(g, FACTION, isAutonomousDecisionActor).owned).toBe(withLeader);
  });

  it('Condition — objects are exactly the borne has_trait edges to condition-class definitions, each held by its bearer', () => {
    const CONDITION = getUndertakingObjectType('condition')!;
    const borne = g.getEdgesByType('has_trait').filter(e => {
      const def = g.getNode(e.target);
      return !!def && def.type === 'trait' && (CONDITION_SUBCATEGORIES as readonly string[]).includes(String(def.properties.subcategory));
    });
    expect(handleIds('condition')).toEqual(borne.map(e => e.id).sort());
    for (const e of borne) expect(resolveObjectOwners(g, CONDITION, { kind: 'edge', edgeId: e.id })).toEqual([e.source]);
    const census = ownershipCensus(g, CONDITION, isAutonomousDecisionActor);
    expect(census.owned).toBe(borne.length);
  });

  it('Standing — one object per ordered pair across reputation_with and relates_to, the score winning', () => {
    const STANDING = getUndertakingObjectType('standing')!;
    const party = (id: string) => { const n = g.getNode(id); return !!n && (n.type === 'actor' || n.type === 'location'); };
    const pairs = new Map<string, string>();
    for (const type of ['reputation_with', 'relates_to'] as const) {
      for (const e of g.getEdgesByType(type)) {
        if (!party(e.source) || !party(e.target)) continue;
        const key = `${e.source}→${e.target}`;
        if (!pairs.has(key)) pairs.set(key, e.id);
      }
    }
    expect(pairs.size).toBeGreaterThan(0);
    expect(handleIds('standing')).toEqual([...pairs.values()].sort());
    const census = ownershipCensus(g, STANDING, isAutonomousDecisionActor);
    expect(census.objects).toBe(pairs.size);
    expect(census.owned).toBe(pairs.size);
  });

  it('Item — no catalog template is an object; every non-template artifact that is not a holding face is', () => {
    const ids = handleIds('item');
    for (const id of ids) expect(CATALOG_TEMPLATE_IDS.has(id), `${id} is a catalog template`).toBe(false);
    const expected = g.getNodesByType('artifact')
      .filter(n => n.properties.attachmentCategory !== 'holding' && !CATALOG_TEMPLATE_IDS.has(n.id))
      .map(n => n.id).sort();
    expect(ids).toEqual(expected);
    // The templates are seeded — the exclusion is doing work, not passing on an empty set.
    expect(g.getNodesByType('artifact').filter(n => CATALOG_TEMPLATE_IDS.has(n.id)).length).toBeGreaterThan(0);
  });

  it('Route — the create cell mints the identity node the object is, and the route cells then enumerate it', () => {
    const ROUTE = getUndertakingObjectType('route')!;
    expect(handleIds('route')).toEqual([]);
    const actor = g.getNodesByType('actor').find(isAutonomousDecisionActor)!;
    const settlements = getLocationNodes(g).filter(n => resolveLocationToHex(g, n.id));
    let near: GraphNode | undefined;
    let far: GraphNode | undefined;
    outer: for (const a of settlements) {
      for (const b of settlements) {
        if (a.id === b.id) continue;
        const d = hexDistance(resolveLocationToHex(g, a.id)!, resolveLocationToHex(g, b.id)!);
        if (d >= 1 && d <= 3) { near = a; far = b; break outer; }
      }
    }
    expect(near && far).toBeTruthy();
    const ctx: ObjectVerbContext = {
      state, graph: g, actorId: actor.id, tick: state.tick,
      handle: { kind: 'node', nodeId: far!.id }, targetNodeId: far!.id, originLocationId: near!.id,
    };
    const create = ROUTE.verbs.create;
    if (typeof create !== 'function') throw new Error('create × Route is a completion semantic');
    const result = create(ctx);
    expect(result.success).toBe(true);
    const identity = g.getNode(result.createdId!);
    expect(identity?.type).toBe('location');
    expect(identity?.properties.locationSubtype).toBe(ROUTE_IDENTITY_SUBTYPE);
    expect(identity?.properties.routeSourceId).toBe(near!.id);
    expect(identity?.properties.routeTargetId).toBe(far!.id);
    expect(handleIds('route')).toEqual([identity!.id]);
  });
});
