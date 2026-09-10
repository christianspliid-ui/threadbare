// src/engine/__tests__/seedLivingWorld.test.ts
//
// THR-1437 — the seeded world holds objects and relationships on tick 0.
//
// Every count here is measured on a *generated* world (`initializeGameState` at the
// small preset), never a fixture: the defect this ticket closes was that the real
// seeder produced none of these edges, and a fixture that hands itself the edges would
// verify its own fiction.

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { ROUTE_IDENTITY_SUBTYPE } from '../../data/strategic-action-constants';
import { getLocationNodes } from '../sublocationShape';
import { isArmyGroupNode } from '../groupShape';
import { holdsMotive } from '../undertakingMotive';
import { writeGrudge } from '../grievance/grudgeEdge';
import { _resetNpcCounter } from '../npcSeeding';
import {
  retargetTerritoryByProvince,
  type LivingWorldContext,
} from '../seedLivingWorld';
import { LIVING_WORLD_DEFAULTS } from '../../data/worldgen-living-constants';

const SEED = 42;

function buildSmallWorld(seed = SEED) {
  // `npcCounter` is module-level and increments across every `seedNpcsAtLocations`
  // call in a process (the orchestrator resets it per playthrough for the same
  // reason). Two worlds built back to back in one test file would otherwise differ
  // by NPC id alone — a property of the harness, not of the seeder.
  _resetNpcCounter();
  const archetype = generateArchetypes(4, seed)[0];
  return initializeGameState(
    archetype,
    'T',
    createBalancedCosmology(),
    seed,
    MAP_SIZE_PRESETS.small.cols,
    MAP_SIZE_PRESETS.small.rows,
  );
}

/**
 * Rebuild the seeder's context from the generated graph — the same inputs
 * `seedLivingWorld` was handed, recovered rather than invented.
 */
function contextFrom(graph: WorldGraph, seed = SEED): LivingWorldContext {
  const locationIds = getLocationNodes(graph).map(n => n.id);
  const individualIds = graph.getNodesByType('actor')
    .filter(n => /^ind_\d+$/.test(n.id)).map(n => n.id);
  const factionIds = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction' && /^faction_\d+$/.test(n.id))
    .map(n => n.id);
  const factionDefIds = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction' && n.id.startsWith('faction_def_'))
    .map(n => n.id);

  const locationCultureMap = new Map<string, { cultureId: string; role: number }>();
  for (const edge of graph.getEdgesByType('belongs_to')) {
    if (edge.properties.cultureLayer !== 'current') continue;
    const source = graph.getNode(edge.source);
    if (source?.type !== 'location') continue;
    if (typeof source.properties.parentLocationId === 'string') continue; // Place tier
    locationCultureMap.set(edge.source, { cultureId: edge.target, role: 0 });
  }
  const cultureIds = [...new Set([...locationCultureMap.values()].map(v => v.cultureId))].sort();

  return { seed, locationIds, individualIds, factionIds, factionDefIds, cultureIds, locationCultureMap };
}

function controlsMap(graph: WorldGraph): Map<string, string> {
  const out = new Map<string, string>();
  for (const edge of graph.getEdgesByType('controls')) out.set(edge.id, edge.source);
  return out;
}

describe('seedLivingWorld — counts on a generated small world (THR-1437)', () => {
  const { state } = buildSmallWorld();
  const graph = state.graph;
  const ctx = contextFrom(graph);
  const protagonists = graph.getNodesByType('actor').filter(n => /^ind_\d+$/.test(n.id));

  it('mints at least one Route identity node (W3)', () => {
    const routes = graph.getNodesByType('location')
      .filter(n => n.properties.locationSubtype === ROUTE_IDENTITY_SUBTYPE);
    const lanes = graph.getEdgesByType('trades_with');
    console.log(`[THR-1437] trades_with edges ${lanes.length} · route identity nodes ${routes.length}`);
    expect(lanes.length).toBeGreaterThanOrEqual(1);
    expect(routes.length).toBeGreaterThanOrEqual(1);
  });

  it('mints at least one freehold — an `owns` edge from a mortal to a Place (W4)', () => {
    const owns = graph.getEdgesByType('owns');
    console.log(`[THR-1437] owns edges ${owns.length}`);
    expect(owns.length).toBeGreaterThanOrEqual(1);
    // Every seeded holding points at a Place (a location carrying a parent), not a
    // settlement — a protagonist holds a granary, never a town.
    for (const edge of owns) {
      const target = graph.getNode(edge.target);
      expect(typeof target?.properties.parentLocationId).toBe('string');
    }
  });

  it('gives every seeded protagonist something to carry (W5)', () => {
    expect(protagonists.length).toBeGreaterThanOrEqual(LIVING_WORLD_DEFAULTS.WORLDGEN_POSSESSIONS_PER_SPOTLIGHT);
    const without = protagonists.filter(p => graph.getOutgoingEdges(p.id, 'possesses').length === 0);
    console.log(`[THR-1437] protagonists ${protagonists.length} · without a possession ${without.length}`);
    expect(without).toEqual([]);
  });

  it('reports the seeded quarrel count (W6) — the constant is reported, never moved to make it fire', () => {
    const hostile = graph.getEdgesByType('hostile_to');
    const seeded = hostile.filter(e => e.properties.cause === 'old_quarrel');
    console.log(
      `[THR-1437] hostile_to edges ${hostile.length} (old_quarrel ${seeded.length})`
      + ` at WORLDGEN_QUARREL_SENTIMENT_MAX=${LIVING_WORLD_DEFAULTS.WORLDGEN_QUARREL_SENTIMENT_MAX}`,
    );
    expect(hostile.length).toBeGreaterThanOrEqual(0);
  });

  it('mints a mark wherever a culture holds two protagonists (W7)', () => {
    const cultureOf = (actorId: string): string | undefined => {
      const locId = graph.getNode(actorId)?.properties.locationId as string | undefined;
      return locId ? ctx.locationCultureMap.get(locId)?.cultureId : undefined;
    };
    const perCulture = new Map<string, number>();
    for (const p of protagonists) {
      const cultureId = cultureOf(p.id);
      if (cultureId) perCulture.set(cultureId, (perCulture.get(cultureId) ?? 0) + 1);
    }
    const eligible = [...perCulture.values()].filter(n => n >= 2).length;
    const marks = graph.getEdgesByType('knows_secret_of');
    console.log(`[THR-1437] cultures with ≥2 protagonists ${eligible} · knows_secret_of ${marks.length}`);
    if (eligible > 0) expect(marks.length).toBeGreaterThanOrEqual(1);
  });

  it('musters a garrison at each culture capital, beside the two mercenary hosts (W8)', () => {
    const armies = graph.getNodesByType('actor').filter(isArmyGroupNode);
    const capitals = new Set<string>();
    for (const [locId, { cultureId }] of ctx.locationCultureMap) {
      if (graph.getNode(locId)?.properties.locationSubtype === 'capital') capitals.add(cultureId);
    }
    const captains = graph.getNodesByType('actor').filter(n => n.id.startsWith('agent_garrison_'));
    console.log(
      `[THR-1437] armies ${armies.length} · cultures with a capital ${capitals.size}`
      + ` · garrison captains ${captains.length}`,
    );
    // Two mercenary companies are seeded upstream; each garrison adds one host, except
    // where one faction already holds a tick-0 host (the army id is faction-scoped).
    expect(armies.length).toBeGreaterThan(2);
    expect(armies.length).toBeLessThanOrEqual(2 + capitals.size);
    expect(captains.length).toBeGreaterThanOrEqual(1);
    // A captain is a protagonist: spotlight tier plus capabilities.
    for (const captain of captains) {
      expect(captain.properties.spotlightTier).toBe('spotlight');
      expect(captain.properties.domainCapabilities).toBeDefined();
      expect(graph.getOutgoingEdges(captain.id, 'member_of').length).toBe(1);
    }
  });

  it('leaves every cultured Location held within its own culture (W2, province mode)', () => {
    const homeCultureOf = (factionId: string): string | undefined => {
      const homeId = graph.getNode(factionId)?.properties.homeLocationId as string | undefined;
      return homeId ? ctx.locationCultureMap.get(homeId)?.cultureId : undefined;
    };
    const genericHolderPerCulture = new Map<string, Set<string>>();
    const offenders: string[] = [];

    for (const [locId, { cultureId }] of ctx.locationCultureMap) {
      for (const edge of graph.getIncomingEdges(locId, 'controls')) {
        if (ctx.factionDefIds.includes(edge.source)) {
          const home = homeCultureOf(edge.source);
          if (home !== undefined && home !== cultureId) offenders.push(`${locId}<-${edge.source}`);
          continue;
        }
        const set = genericHolderPerCulture.get(cultureId) ?? new Set<string>();
        set.add(edge.source);
        genericHolderPerCulture.set(cultureId, set);
      }
    }

    expect(offenders).toEqual([]);
    // A culture's ground that no definition faction reaches falls to exactly one
    // generic faction — the round-robin over cultures, not over locations.
    for (const [cultureId, holders] of genericHolderPerCulture) {
      expect(`${cultureId}:${holders.size}`).toBe(`${cultureId}:1`);
    }
  });

  it('holds every cultured Location under its own culture’s Realm (THR-1155)', () => {
    // Before THR-1155 this asserted that the retarget pass moved a Location off the
    // round-robin holder worldgen had stamped. There is no round-robin any more: the
    // Realm mint writes territory by culture in the first place, so what is left to
    // assert is the invariant the retarget used to reach — and that the pass, run a
    // second time over its own output, is a fixed point rather than a shuffle.
    const offenders: string[] = [];
    for (const [locId, { cultureId }] of ctx.locationCultureMap) {
      for (const edge of graph.getIncomingEdges(locId, 'controls')) {
        if (ctx.factionDefIds.includes(edge.source)) continue; // a guild home — its own rule
        const holderCulture = graph.getNode(edge.source)?.properties.cultureId;
        if (holderCulture !== undefined && holderCulture !== cultureId) {
          offenders.push(`${locId}<-${edge.source}`);
        }
      }
    }
    expect(offenders).toEqual([]);

    const before = controlsMap(graph);
    const changed = retargetTerritoryByProvince(graph, ctx, LIVING_WORLD_DEFAULTS);
    console.log(`[THR-1155] re-running the territory pass moved ${changed} edges`);
    expect(changed).toBe(0);
    expect([...controlsMap(graph).entries()].sort()).toEqual([...before.entries()].sort());
  });
});

describe('seedLivingWorld — determinism (THR-1437)', () => {
  it('same seed twice → identical node and edge id sets', () => {
    const a = buildSmallWorld().state.graph;
    const b = buildSmallWorld().state.graph;

    const nodeIds = (g: WorldGraph) => g.getAllNodes().map((n: GraphNode) => n.id).sort();
    const edgeIds = (g: WorldGraph) => g.getAllEdges().map(e => e.id).sort();

    expect(nodeIds(a)).toEqual(nodeIds(b));
    expect(edgeIds(a)).toEqual(edgeIds(b));
  });
});

describe('seedLivingWorld — a seeded quarrel reads as rivalry, never grudge (W6)', () => {
  it('licenses rivalry and withholds the plot', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'b', type: 'actor', name: 'B', properties: { actorType: 'individual' } });
    expect(writeGrudge(graph, 'a', 'b', 0, 'old_quarrel')).toBe(true);

    expect(holdsMotive(graph, 'a', 'b', 'rivalry')).toBe(true);
    expect(holdsMotive(graph, 'a', 'b', 'grudge')).toBe(false);
    expect(holdsMotive(graph, 'b', 'a', 'rivalry')).toBe(true);
    expect(holdsMotive(graph, 'b', 'a', 'grudge')).toBe(false);
  });

  it('every seeded quarrel in a generated world reads the same way', () => {
    const graph = buildSmallWorld().state.graph;
    const seeded = graph.getEdgesByType('hostile_to').filter(e => e.properties.cause === 'old_quarrel');
    for (const edge of seeded) {
      expect(holdsMotive(graph, edge.source, edge.target, 'rivalry')).toBe(true);
      expect(holdsMotive(graph, edge.source, edge.target, 'grudge')).toBe(false);
    }
  });
});
