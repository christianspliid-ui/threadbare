/**
 * Opening coloration — the graph half (THR-1635).
 *
 * `resolveOpeningColoration` (fragmentResolution.ts) is a pure table lookup. This module
 * reads the facts it needs off the world graph for the scene an agent stands in: the town
 * (Location tier) whose culture the scene reads, that culture's foundation and variant
 * stamp, and the place's dominant sphere with its share. Shared by `gatherNarrativeContext`
 * (the render path) and the debug bridge (`getOpeningColoration`, `getColorationCensus`),
 * so the debug read and the prose can never disagree about a place.
 *
 * **Keyed on the town, never the actor.** A stranger in town reads the town's custom;
 * the actor's own culture is `{culture}`, a different token for a different question.
 *
 * Fail-soft throughout (NFP #4): every missing edge or property yields an absent field,
 * which the resolver turns into a `'none'` with its reason.
 */

import type { WorldGraph, GraphNode } from './graph';
import type { CultureIdentity } from '../types/culture';
import { getAgentLocation } from './graphQueries';
import { getLocationNodes, resolveToParentLocation } from './sublocationShape';
import { getNodeSphereAffinity, getDominantSphere } from './sphereAffinity';
import { readCultureCustomVariant } from './cultureGenerator';
import { resolveOpeningColoration, type OpeningColorationInput } from './fragmentResolution';
import { REACH_DOMAINS, type ReachDomain } from '../types/traits';
import { SPHERE_FACT_MIN_SHARE } from '../data/culture-sphere-lines';

/** The place facts for one location, minus the template's reach. */
export type PlaceColoration = Omit<OpeningColorationInput, 'reach'> & {
  /** The node the scene actually plays out in (may be a Place inside the town). */
  readonly locationId: string | null;
};

/** The culture holding a Location — its `belongs_to` edge with `cultureLayer: 'current'`. */
export function getCurrentCultureOf(graph: WorldGraph, locationId: string): GraphNode | undefined {
  const edge = graph
    .getOutgoingEdges(locationId, 'belongs_to')
    .find(e => (e.properties as { cultureLayer?: string } | undefined)?.cultureLayer === 'current');
  return edge ? graph.getNode(edge.target) : undefined;
}

/** Dominant sphere and its share of the node's total sphere score; nulls when it has none. */
export function sphereShareOf(node: GraphNode | undefined): { sphere: string | null; share: number | null } {
  const affinity = node ? getNodeSphereAffinity(node) : undefined;
  if (!affinity?.scores) return { sphere: null, share: null };
  const dominant = getDominantSphere(affinity);
  if (!dominant) return { sphere: null, share: null };
  const total = Object.values(affinity.scores).reduce((sum, v) => sum + (Number(v) || 0), 0);
  return { sphere: dominant, share: total > 0 ? affinity.scores[dominant] / total : null };
}

/**
 * Everything the resolver needs about the place `locationId` names.
 *
 * The culture is read at the Location tier — a mortal standing in a Place reads its
 * town's culture, and `{place}` names the town. The sphere is read on the node the scene
 * plays out in first, then its town, because a shrine can carry a stronger sphere than
 * the settlement around it.
 */
export function gatherPlaceColoration(graph: WorldGraph, locationId: string | null | undefined): PlaceColoration {
  const node = locationId ? graph.getNode(locationId) : undefined;
  if (!node) return { locationId: null };
  const town = resolveToParentLocation(graph, node);

  const culture = town ? getCurrentCultureOf(graph, town.id) : undefined;
  const identity = culture?.properties.cultureIdentity as CultureIdentity | undefined;

  const own = sphereShareOf(node);
  const sphere = own.sphere ? own : sphereShareOf(town);

  return {
    locationId: node.id,
    placeLocationId: town?.id ?? null,
    placeName: town?.name ?? null,
    ...(culture && identity
      ? {
          cultureId: culture.id,
          cultureName: culture.name,
          foundation: identity.foundationBias ?? null,
          demonym: identity.demonym ?? null,
          cultureVariant: readCultureCustomVariant(graph, culture.id) ?? null,
        }
      : {}),
    dominantSphere: sphere.sphere,
    sphereShare: sphere.share,
  };
}

/** {@link gatherPlaceColoration} for wherever an agent currently stands. */
export function gatherAgentPlaceColoration(graph: WorldGraph, agentId: string): PlaceColoration {
  return gatherPlaceColoration(graph, getAgentLocation(graph, agentId)?.id ?? null);
}

// ─── Debug reads (window.__DEBUG, THR-1635) ────────────────────────

/** Per-place readout: the facts and, per reach, which line an opening there would state. */
export interface OpeningColorationReadout {
  readonly locationId: string | null;
  readonly placeLocationId: string | null;
  readonly foundation: string | null;
  readonly cultureId: string | null;
  readonly customVariant: number | null;
  readonly dominantSphere: string | null;
  readonly sphereShare: number | null;
  readonly perReach: Readonly<
    Partial<Record<ReachDomain, { kind: 'culture' | 'sphere' | 'none'; reason: string; line: string }>>
  >;
}

/**
 * What an encounter opening at `locationId` would state, per reach. `line` is the table
 * line with `{demonym}`/`{place}` filled and `{actor}` left as a token.
 */
export function describeOpeningColoration(
  graph: WorldGraph,
  locationId: string | null | undefined,
  reaches: readonly ReachDomain[] = REACH_DOMAINS,
): OpeningColorationReadout {
  const place = gatherPlaceColoration(graph, locationId);
  const perReach: Partial<Record<ReachDomain, { kind: 'culture' | 'sphere' | 'none'; reason: string; line: string }>> = {};
  for (const reach of reaches) {
    const c = resolveOpeningColoration({ ...place, reach }, 'debug.getOpeningColoration');
    perReach[reach] = { kind: c.kind, reason: c.reason, line: c.text };
  }
  return {
    locationId: place.locationId,
    placeLocationId: place.placeLocationId ?? null,
    foundation: place.foundation ?? null,
    cultureId: place.cultureId ?? null,
    customVariant: place.cultureVariant ?? null,
    dominantSphere: place.dominantSphere ?? null,
    sphereShare: place.sphereShare ?? null,
    perReach,
  };
}

/** Place-tier census of what the coloration line can read, world-wide. */
export interface ColorationCensus {
  readonly locations: number;
  readonly withCulture: number;
  readonly withStrongSphere: number;
  readonly both: number;
  readonly neither: number;
  /** Living cultures (holding at least one Location as `current`), per foundation, with stamps. */
  readonly cultures: readonly { cultureId: string; name: string; foundation: string; customVariant: number | null; locations: number }[];
  /** Pairs of living same-foundation cultures that share a stamp (read the same customs). */
  readonly sharedStamps: readonly { foundation: string; customVariant: number; cultureIds: readonly string[] }[];
}

/**
 * Count place-tier Locations carrying a current culture and a dominant sphere at or
 * above `SPHERE_FACT_MIN_SHARE` — the plan's re-measure as one call.
 */
export function buildColorationCensus(graph: WorldGraph): ColorationCensus {
  const locations = getLocationNodes(graph);
  let withCulture = 0;
  let withStrongSphere = 0;
  let both = 0;
  const cultureLocations = new Map<string, number>();
  for (const location of locations) {
    const culture = getCurrentCultureOf(graph, location.id);
    const { share } = sphereShareOf(location);
    const hasCulture = !!culture;
    const strong = share != null && share >= SPHERE_FACT_MIN_SHARE;
    if (hasCulture) {
      withCulture++;
      cultureLocations.set(culture!.id, (cultureLocations.get(culture!.id) ?? 0) + 1);
    }
    if (strong) withStrongSphere++;
    if (hasCulture && strong) both++;
  }

  const cultures = [...cultureLocations.entries()]
    .map(([cultureId, count]) => {
      const node = graph.getNode(cultureId);
      const identity = node?.properties.cultureIdentity as CultureIdentity | undefined;
      return {
        cultureId,
        name: node?.name ?? cultureId,
        foundation: identity?.foundationBias ?? 'unknown',
        customVariant: readCultureCustomVariant(graph, cultureId) ?? null,
        locations: count,
      };
    })
    .sort((a, b) => a.cultureId.localeCompare(b.cultureId));

  const byStamp = new Map<string, string[]>();
  for (const c of cultures) {
    if (c.customVariant === null) continue;
    const key = `${c.foundation}#${c.customVariant}`;
    byStamp.set(key, [...(byStamp.get(key) ?? []), c.cultureId]);
  }
  const sharedStamps = [...byStamp.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, cultureIds]) => {
      const [foundation, variant] = key.split('#');
      return { foundation, customVariant: Number(variant), cultureIds };
    });

  return {
    locations: locations.length,
    withCulture,
    withStrongSphere,
    both,
    neither: locations.length - withCulture - withStrongSphere + both,
    cultures,
    sharedStamps,
  };
}
