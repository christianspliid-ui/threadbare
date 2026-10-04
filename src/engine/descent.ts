// src/engine/descent.ts
// Pure readers of descent from a dead empire (THR-1658).
//
// Worldgen's past pass (`worldPast.ts` S1e) writes descent as a `backstoryStrata`
// entry `{ cultureId, relation: 'descent' }` on about a quarter of the mortals living
// on a dead empire's land. This module is the play-time side: who descends from whom,
// which land was the old empire's, and where its stones still stand. It reads only —
// nothing here writes the graph or draws from a PRNG.
//
// `historicalCultureOfRegion` is the *writer's own* predicate, lifted here so worldgen
// and every reader agree on what "the old land" is: `worldPast.ts` imports it.

import { hexDistance } from '../lib/hexMath';

/**
 * The slice of a graph these readers need. Structural, method syntax (bivariant) so
 * both `WorldGraph` and the minimal `ConditionGraph` view satisfy it.
 */
export interface DescentGraph {
  getNode(id: string): { id: string; type?: string; properties: Record<string, unknown> } | undefined;
  getOutgoingEdges(id: string, type?: string): ReadonlyArray<{ target: string; properties: Record<string, unknown> }>;
}

/** A graph that can also enumerate nodes by type — needed only to find ruins. */
export interface DescentRuinGraph extends DescentGraph {
  getNodesByType(type: string): ReadonlyArray<{ id: string; properties: Record<string, unknown> }>;
}

/**
 * How far up the Place → Location chain a hex lookup climbs. The position model is
 * three tiers deep, so this is slack; it bounds a `parentLocationId` cycle (NFP #4).
 */
const MAX_PARENT_WALK_DEPTH = 4;

/**
 * The dead empires a mortal descends from: the `cultureId` of every `backstoryStrata`
 * entry with `relation: 'descent'`, sorted and de-duplicated.
 *
 * Deliberately does **not** read `originCultureId` alone — that property is shared
 * with ruins and written by other paths; the stratum is the descent fact. Malformed or
 * missing strata read as no descent.
 */
export function getDescentCultureIds(node: { properties: Record<string, unknown> } | undefined): string[] {
  const strata = node?.properties.backstoryStrata;
  if (!Array.isArray(strata)) return [];
  const ids = new Set<string>();
  for (const s of strata) {
    if (!s || typeof s !== 'object') continue;
    const { cultureId, relation } = s as { cultureId?: unknown; relation?: unknown };
    if (relation === 'descent' && typeof cultureId === 'string' && cultureId) ids.add(cultureId);
  }
  return [...ids].sort();
}

/**
 * The dead empire whose land a region was: its `belongs_to` edge with
 * `cultureLayer: 'historical'`, lowest target id on a tie. The exact predicate
 * `worldPast.ts` S1e assigns descent with — the writer imports this function.
 */
export function historicalCultureOfRegion(graph: DescentGraph, regionId: string): string | undefined {
  return graph.getOutgoingEdges(regionId, 'belongs_to')
    .filter(e => (e.properties as Record<string, unknown> | undefined)?.cultureLayer === 'historical')
    .map(e => e.target)
    .sort()[0];
}

/** Elder ruins left by any of `cultureIds`, sorted by id. Empty set → none. */
export function ancestralRuinIds(graph: DescentRuinGraph, cultureIds: readonly string[]): string[] {
  if (cultureIds.length === 0) return [];
  const wanted = new Set(cultureIds);
  return graph.getNodesByType('location')
    .filter(n => n.properties.locationSubtype === 'elder_ruin'
      && typeof n.properties.originCultureId === 'string'
      && wanted.has(n.properties.originCultureId))
    .map(n => n.id)
    .sort();
}

/** A location's hex, climbing Place → Location when the Place carries none. */
export function locationHex(graph: DescentGraph, locationId: string | undefined): { col: number; row: number } | undefined {
  let currentId = locationId;
  for (let depth = 0; depth < MAX_PARENT_WALK_DEPTH; depth++) {
    if (!currentId) return undefined;
    const node = graph.getNode(currentId);
    if (!node) return undefined;
    const { hexCol, hexRow, parentLocationId } = node.properties;
    if (typeof hexCol === 'number' && typeof hexRow === 'number') return { col: hexCol, row: hexRow };
    currentId = typeof parentLocationId === 'string' ? parentLocationId : undefined;
  }
  return undefined;
}

/** The hex an agent stands on — `located_at` target, resolved up to a hex. */
export function agentHex(graph: DescentGraph, agentId: string): { col: number; row: number } | undefined {
  if (!graph.getNode(agentId)) return undefined;
  return locationHex(graph, graph.getOutgoingEdges(agentId, 'located_at')[0]?.target);
}

/**
 * *Walk the old stones*: the agent stands within `reachHexes` of an elder ruin of one
 * of its own dead empires. Every unresolvable input reads `false`.
 */
export function isAtAncestralRuin(graph: DescentRuinGraph, agentId: string, reachHexes: number): boolean {
  const cultures = getDescentCultureIds(graph.getNode(agentId));
  if (cultures.length === 0) return false;
  const here = agentHex(graph, agentId);
  if (!here) return false;
  return ancestralRuinIds(graph, cultures).some(ruinId => {
    const at = locationHex(graph, ruinId);
    return !!at && hexDistance(here, at) <= reachHexes;
  });
}

/**
 * *Take ground on the old land*: an `owns` edge acquired at or after `windowStartTick`
 * whose target is a Location or Place on a region that was one of the agent's dead
 * empires. `regionOf` resolves a location's region (the caller passes
 * `graphConditions.resolveRegionId`, kept out of this module to avoid an import cycle).
 *
 * An edge without a numeric `acquiredTick` (a pre-THR-1297 world) does not count; no
 * window reads `false` — some heirs already own old ground at t0, and without the
 * window the drive would be half done before it began.
 */
export function tookAncestralGround(
  graph: DescentGraph,
  agentId: string,
  windowStartTick: number | undefined,
  regionOf: (locationId: string) => string | undefined,
): boolean {
  if (typeof windowStartTick !== 'number') return false;
  const cultures = getDescentCultureIds(graph.getNode(agentId));
  if (cultures.length === 0) return false;
  const wanted = new Set(cultures);
  return graph.getOutgoingEdges(agentId, 'owns').some(edge => {
    const acquired = edge.properties.acquiredTick;
    if (typeof acquired !== 'number' || acquired < windowStartTick) return false;
    // A Location or a Place — both `type: 'location'` (THR-1183); the legacy
    // `sublocation` type is still accepted from saved worlds, as every reader does.
    const targetType = graph.getNode(edge.target)?.type;
    if (targetType !== 'location' && targetType !== 'sublocation') return false;
    const regionId = regionOf(edge.target);
    if (!regionId) return false;
    const empire = historicalCultureOfRegion(graph, regionId);
    return !!empire && wanted.has(empire);
  });
}
