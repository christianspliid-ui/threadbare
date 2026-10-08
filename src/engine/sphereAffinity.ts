/**
 * SphereAffinity — Entity seeding and accessor functions.
 *
 * Provides functions to seed sphere affinity on all entity graph nodes
 * during game initialization. All entities are seeded before the first tick.
 *
 * Design doc: Docs/plans/2026-03-28-world-soul-connection-design.md
 */

import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { GraphNode } from '../types/graph';
import {
  type SphereAffinity,
  createDefaultSphereAffinity,
  getTerrainSphereScores,
  ARCHETYPE_SPHERE_BONUS_PRIMARY,
  ARCHETYPE_SPHERE_BONUS_SECONDARY,

  LOCATION_TYPE_BONUS,
  LOCATION_SPHERE_TABLE,
  MAX_SPHERE_SCORE,
} from '../types/sphereAffinity';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { HexTile } from '../types/index';
import type { WorldGraph } from './graph';
import type { CultureIdentity } from '../types/culture';
import type { SphereSeedKind, SphereSeedRoute } from '../types/traces/sphere-traces';
import {
  type FactionSphereAggregate,
  FACTION_SPHERE_AGGREGATE_MIN_MEMBERS,
  SPHERE_SEED_TRACE_SUMMARY_ONLY_AT_INIT,
} from '../types/sphereAffinity';
import { getActorCultures, getFactionMembers } from './graphQueries';
import { isPlaceNode } from './sublocationShape';
import { emitTrace } from './traceBuffer';

// ─── Accessor ────────────────────────────────────────────────────

/**
 * Type-safe accessor for sphere affinity on any graph node.
 * Returns undefined if the node has no sphereAffinity property.
 */
export function getNodeSphereAffinity(node: GraphNode): SphereAffinity | undefined {
  return node.properties.sphereAffinity as SphereAffinity | undefined;
}

// ─── Hex Seeding ─────────────────────────────────────────────────

/**
 * Seed sphere affinity for a hex node from its terrain type.
 * Uses TERRAIN_SPHERE_TABLE lookup → getTerrainSphereScores for full coverage.
 * All non-specified spheres remain at 0.
 */
export function seedHexSphereAffinity(terrainType: string): SphereAffinity {
  const base = createDefaultSphereAffinity();
  const terrainScores = getTerrainSphereScores(terrainType);
  for (const [sphere, score] of Object.entries(terrainScores)) {
    base.scores[sphere as SphereName] = score as number;
  }
  return base;
}

// ─── Agent Seeding ────────────────────────────────────────────────

/**
 * Seed sphere affinity for an agent from their sphereAlignment (CosmologyProfile).
 * Primary sphere (highest weight) gets ARCHETYPE_SPHERE_BONUS_PRIMARY (+2).
 * Secondary sphere (second highest) gets ARCHETYPE_SPHERE_BONUS_SECONDARY (+1).
 * Scores are clamped to MAX_SPHERE_SCORE.
 *
 * If no sphereAlignment provided (e.g., faction with no cosmology), returns defaults.
 */
export function seedAgentSphereAffinity(
  sphereAlignment: Record<string, number> | undefined
): SphereAffinity {
  const base = createDefaultSphereAffinity();
  if (!sphereAlignment) return base;

  // Sort by weight descending, filter out zero-weight spheres
  const sorted = Object.entries(sphereAlignment)
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length > 0) {
    const primarySphere = sorted[0][0] as SphereName;
    base.scores[primarySphere] = Math.min(ARCHETYPE_SPHERE_BONUS_PRIMARY, MAX_SPHERE_SCORE);
  }
  if (sorted.length > 1) {
    const secondarySphere = sorted[1][0] as SphereName;
    base.scores[secondarySphere] = Math.min(ARCHETYPE_SPHERE_BONUS_SECONDARY, MAX_SPHERE_SCORE);
  }
  return base;
}

// ─── Location Seeding ─────────────────────────────────────────────

/**
 * Seed sphere affinity for a location node from:
 * 1. Its hex's sphere affinity (passed through directly)
 * 2. Location type bonus from LOCATION_SPHERE_TABLE (additive)
 *
 * Scores are clamped to MAX_SPHERE_SCORE.
 */
export function seedLocationSphereAffinity(
  hexAffinity: SphereAffinity,
  locationSubtype?: string
): SphereAffinity {
  const base = createDefaultSphereAffinity();
  for (const sphere of SPHERE_NAMES) {
    base.scores[sphere] = hexAffinity.scores[sphere];
  }
  // Add location-type sphere bonus from table
  if (locationSubtype) {
    const typeScores = LOCATION_SPHERE_TABLE[locationSubtype];
    if (typeScores) {
      for (const [sphere, score] of Object.entries(typeScores)) {
        base.scores[sphere as SphereName] = Math.min(
          base.scores[sphere as SphereName] + (score as number),
          MAX_SPHERE_SCORE
        );
      }
    }
  }
  return base;
}

// ─── Agent Decision Sphere Influence ─────────────────────────────

/** Weight of sphere-derived axiological adjustment applied to agent's profile */
export const SPHERE_DECISION_WEIGHT = 0.15;

/** Describes a sphere's axiological influence: which pair and which direction */
export interface SphereAxiologicalMapping {
  /** The ValuePair to shift */
  pair: ValuePair;
  /** +1 = shift toward first pole (virtue); -1 = shift toward second pole (flaw) */
  direction: 1 | -1;
}

/**
 * Maps each sphere to its axiological influence direction.
 * Force → courage (valor) over prudence; Time → prudence over courage; etc.
 */
export const SPHERE_AXIOLOGICAL_MAP: Record<SphereName, SphereAxiologicalMapping> = {
  // Foundation Spheres
  chaos:   { pair: 'courage_prudence',    direction: +1 as 1 },  // Boldness, risk-taking
  order:   { pair: 'courage_prudence',    direction: -1 as -1 }, // Caution, measured action
  light:   { pair: 'honesty_cunning',     direction: +1 as 1 },  // Transparency, revelation
  darkness:{ pair: 'honesty_cunning',     direction: -1 as -1 }, // Concealment, subtlety
  // Creation Spheres
  force:   { pair: 'courage_prudence',    direction: +1 as 1 },  // Bold, assertive
  matter:  { pair: 'loyalty_ambition',    direction: +1 as 1 },  // Order over freedom
  energy:  { pair: 'loyalty_ambition',    direction: -1 as -1 }, // Freedom over order
  life:    { pair: 'mercy_ruthlessness',  direction: +1 as 1 },  // Compassion, preservation
  mind:    { pair: 'honesty_cunning',     direction: +1 as 1 },  // Knowledge, transparency
  spirit:  { pair: 'honesty_cunning',     direction: -1 as -1 }, // Intuition, hidden truth
  time:    { pair: 'courage_prudence',    direction: -1 as -1 }, // Patient, measured
  entropy: { pair: 'mercy_ruthlessness',  direction: -1 as -1 }, // Ruthlessness, consumption
};

/**
 * Find the sphere with the highest score on an affinity object.
 * Returns null if all scores are zero (fail-soft).
 * Deterministic: iterates SPHERE_NAMES in order; first maximum wins.
 */
export function getDominantSphere(affinity: SphereAffinity): SphereName | null {
  let maxScore = 0;
  let dominant: SphereName | null = null;
  for (const sphere of SPHERE_NAMES) {
    if (affinity.scores[sphere] > maxScore) {
      maxScore = affinity.scores[sphere];
      dominant = sphere;
    }
  }
  return dominant;
}

/**
 * Apply a sphere-derived axiological shift to a profile.
 * Adds `direction * SPHERE_DECISION_WEIGHT` to the mapped pair, clamped to [-1, 1].
 * Returns a new profile object — does not mutate the input.
 */
export function applyAxiologicalShift(
  profile: AxiologicalProfile,
  mapping: SphereAxiologicalMapping,
): AxiologicalProfile {
  const current = profile[mapping.pair] ?? 0;
  const shifted = Math.max(-1, Math.min(1, current + mapping.direction * SPHERE_DECISION_WEIGHT));
  return { ...profile, [mapping.pair]: shifted };
}

// ─── Seeding every node (THR-1768) ───────────────────────────────
//
// Plan doc: Docs/plans/2026-10-06-thr-1768-sphere-score-seeding.md. The Dominion read
// multiplies an object's sphere scores by the god's; before this the god had no bag,
// every mortal was all-zero, factions were never aggregated and half the places minted
// after worldgen carried nothing. These helpers give every one of them a bag.

/**
 * True only for a well-formed bag — both `scores` and `progress` objects. A missing,
 * `null` or legacy bare-string `sphereAffinity` fails, and is what the backfill seeds.
 */
export function isValidSphereAffinity(value: unknown): value is SphereAffinity {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.scores === 'object' && v.scores !== null &&
    typeof v.progress === 'object' && v.progress !== null
  );
}

function isSphereName(value: unknown): value is SphereName {
  return typeof value === 'string' && (SPHERE_NAMES as readonly string[]).includes(value);
}

/**
 * A bag from a ranked sphere list: `[0]` gets ARCHETYPE_SPHERE_BONUS_PRIMARY, `[1]`
 * ARCHETYPE_SPHERE_BONUS_SECONDARY. Names that are not spheres are ignored; a repeat of
 * the first collapses into it (the primary is never lowered).
 */
export function seedFromRankedSpheres(spheres: readonly unknown[]): SphereAffinity {
  const base = createDefaultSphereAffinity();
  const ranked: SphereName[] = [];
  for (const s of spheres) {
    if (isSphereName(s) && !ranked.includes(s)) ranked.push(s);
    if (ranked.length === 2) break;
  }
  if (ranked[0]) base.scores[ranked[0]] = Math.min(ARCHETYPE_SPHERE_BONUS_PRIMARY, MAX_SPHERE_SCORE);
  if (ranked[1]) base.scores[ranked[1]] = Math.min(ARCHETYPE_SPHERE_BONUS_SECONDARY, MAX_SPHERE_SCORE);
  return base;
}

/** Which census row a node counts under. */
export function sphereSeedKindOf(node: GraphNode): SphereSeedKind {
  if (node.type === 'location' || (node.type as string) === 'sublocation') {
    return isPlaceNode(node) ? 'sublocation' : 'place';
  }
  if (node.type !== 'actor') return 'other';
  switch (node.properties.actorType) {
    case 'ascendant':
    case 'god':
      return 'ascendant';
    case 'individual':
      return 'individual';
    case 'culture':
      return 'culture';
    case 'faction':
      return 'faction';
    default:
      return 'other';
  }
}

function veneratedSpheresOf(node: GraphNode | undefined): readonly SphereName[] {
  const identity = node?.properties.cultureIdentity as CultureIdentity | undefined;
  const spheres = identity?.veneratedSpheres;
  return Array.isArray(spheres) ? spheres : [];
}

/**
 * The seed for an actor node, by `actorType`:
 * - ascendant / god → its `sphereAlignment` primary, secondary (D6);
 * - individual → the strongest `belongs_to` culture's venerated spheres (D1; ties keep
 *   edge order, which the graph stores deterministically);
 * - culture → its own venerated spheres;
 * - anything else (faction, group, company, army) → zeros; factions are read through
 *   their derived aggregate (D3).
 */
export function seedActorSphereAffinity(
  graph: WorldGraph,
  node: GraphNode,
): { affinity: SphereAffinity; route: SphereSeedRoute } {
  const kind = sphereSeedKindOf(node);
  if (kind === 'ascendant') {
    const alignment = node.properties.sphereAlignment as { primary?: unknown; secondary?: unknown } | undefined;
    const affinity = seedFromRankedSpheres([alignment?.primary, alignment?.secondary]);
    const seeded = SPHERE_NAMES.some(s => affinity.scores[s] > 0);
    return { affinity, route: seeded ? 'alignment' : 'none' };
  }
  if (kind === 'individual') {
    let best: { culture: GraphNode; strength: number } | undefined;
    for (const c of getActorCultures(graph, node.id)) {
      if (veneratedSpheresOf(c.culture).length === 0) continue;
      if (!best || c.strength > best.strength) best = c;
    }
    if (!best) return { affinity: createDefaultSphereAffinity(), route: 'none' };
    return { affinity: seedFromRankedSpheres(veneratedSpheresOf(best.culture)), route: 'culture' };
  }
  if (kind === 'culture') {
    const spheres = veneratedSpheresOf(node);
    if (spheres.length === 0) return { affinity: createDefaultSphereAffinity(), route: 'none' };
    return { affinity: seedFromRankedSpheres(spheres), route: 'culture' };
  }
  return { affinity: createDefaultSphereAffinity(), route: 'none' };
}

/** `"col,row"` → terrain, built once per sweep. */
export function buildTileTerrainIndex(tiles: readonly HexTile[] | undefined): Map<string, string> {
  const index = new Map<string, string>();
  for (const t of tiles ?? []) index.set(`${t.coord.col},${t.coord.row}`, t.terrain);
  return index;
}

/**
 * The seed for a location node, either tier: its hex's terrain (the tile under
 * `hexCol`/`hexRow`, else the node's own `terrain`, else — for a sublocation — its
 * parent's bag), plus LOCATION_SPHERE_TABLE for `locationType ?? locationSubtype`, plus
 * LOCATION_TYPE_BONUS in its own declared sphere (a lair's `dominantSphere`, an elder
 * ruin's `sphereAlignment`; D4). Capped at MAX_SPHERE_SCORE. Matches world init's
 * values for every node init already seeded.
 */
export function seedPlaceSphereAffinity(
  graph: WorldGraph,
  node: GraphNode,
  terrainByHex: ReadonlyMap<string, string>,
): { affinity: SphereAffinity; route: SphereSeedRoute } {
  const p = node.properties;
  let route: SphereSeedRoute = 'none';
  let hexAffinity = createDefaultSphereAffinity();
  const col = p.hexCol as number | undefined;
  const row = p.hexRow as number | undefined;
  const terrain = (col !== undefined && row !== undefined ? terrainByHex.get(`${col},${row}`) : undefined)
    ?? (typeof p.terrain === 'string' ? p.terrain : undefined);
  if (terrain) {
    hexAffinity = seedHexSphereAffinity(terrain);
    route = 'terrain';
  } else if (typeof p.parentLocationId === 'string') {
    const parent = graph.getNode(p.parentLocationId);
    const parentBag = parent ? getNodeSphereAffinity(parent) : undefined;
    if (isValidSphereAffinity(parentBag)) {
      for (const s of SPHERE_NAMES) hexAffinity.scores[s] = parentBag.scores[s] ?? 0;
      route = 'parent';
    }
  }
  const tableKey = (p.locationType as string | undefined) ?? (p.locationSubtype as string | undefined);
  const affinity = seedLocationSphereAffinity(hexAffinity, tableKey);
  const declared = p.dominantSphere ?? p.sphereAlignment;
  if (isSphereName(declared)) {
    affinity.scores[declared] = Math.min(affinity.scores[declared] + LOCATION_TYPE_BONUS, MAX_SPHERE_SCORE);
    route = 'declared';
  }
  return { affinity, route };
}

/** One census row. */
export interface SphereSeedCensusRow {
  total: number;
  seeded: number;
  unseeded: number;
  nonInteger: number;
  byRoute: Record<string, number>;
}

/** Bags written / found, per node kind. */
export type SphereSeedCensus = Record<SphereSeedKind, SphereSeedCensusRow>;

const CENSUS_KINDS: readonly SphereSeedKind[] = ['ascendant', 'individual', 'culture', 'faction', 'place', 'sublocation', 'other'];

function emptyCensus(): SphereSeedCensus {
  const c = {} as SphereSeedCensus;
  for (const k of CENSUS_KINDS) c[k] = { total: 0, seeded: 0, unseeded: 0, nonInteger: 0, byRoute: {} };
  return c;
}

function nonZeroScores(a: SphereAffinity): Partial<Record<SphereName, number>> {
  const out: Partial<Record<SphereName, number>> = {};
  for (const s of SPHERE_NAMES) if (a.scores[s]) out[s] = a.scores[s];
  return out;
}

/**
 * Every location node (both tiers) and actor node, place tier first so a sublocation
 * can fall back on a parent seeded in the same sweep.
 */
function sweepNodes(graph: WorldGraph): GraphNode[] {
  const locations = graph.getNodesByType('location');
  return [
    ...locations.filter(n => !isPlaceNode(n)),
    ...locations.filter(n => isPlaceNode(n)),
    ...graph.getNodesByType('actor'),
  ];
}

/**
 * Seed every location and actor node whose `sphereAffinity` is missing, `null` or
 * malformed (D2). A valid bag is never touched — a lair escalated to 9 stays 9, and
 * pressure history is never overwritten. Runs at the end of world init and as the
 * first statement of `phaseSpherePressure` (before the pressure's own fail-soft could
 * write a zero bag the sweep would then mistake for seeded).
 *
 * Traces: one `sphere_seeded` per node when `tick > 0`; at init (`tick === 0`) one
 * summary entry instead (SPHERE_SEED_TRACE_SUMMARY_ONLY_AT_INIT). Fail-soft per node.
 */
export function backfillSphereAffinity(
  graph: WorldGraph,
  tiles: readonly HexTile[] | undefined,
  tick: number,
): { seeded: number; counts: Record<string, number> } {
  const terrainByHex = buildTileTerrainIndex(tiles);
  const counts: Record<string, number> = {};
  let seeded = 0;
  const perNode = tick > 0 || !SPHERE_SEED_TRACE_SUMMARY_ONLY_AT_INIT;
  for (const node of sweepNodes(graph)) {
    try {
      if (isValidSphereAffinity(node.properties.sphereAffinity)) continue;
      const kind = sphereSeedKindOf(node);
      const { affinity, route } = node.type === 'actor'
        ? seedActorSphereAffinity(graph, node)
        : seedPlaceSphereAffinity(graph, node, terrainByHex);
      graph.updateNode(node.id, { properties: { sphereAffinity: affinity } });
      seeded++;
      const key = `${kind}:${route}`;
      counts[key] = (counts[key] ?? 0) + 1;
      if (perNode) {
        emitTrace({
          category: 'sphere_seeded',
          tick,
          entityId: node.id,
          kind,
          route,
          scores: nonZeroScores(affinity),
          summary: `${node.name ?? node.id} seeded (${kind}, ${route})`,
        });
      }
    } catch {
      // Fail-soft: one malformed node never stops the sweep or the tick.
    }
  }
  if (!perNode && seeded > 0) {
    emitTrace({
      category: 'sphere_seeded',
      tick,
      entityId: null,
      kind: 'summary',
      route: 'summary',
      counts,
      summary: `${seeded} sphere bags seeded at world init`,
    });
  }
  return { seeded, counts };
}

/**
 * How the bags stand, per node kind — total, seeded, unseeded, nodes carrying a
 * non-integer score, and the route each seeded node's seed rule takes today (re-derived,
 * not stored: a pressure-grown bag still reports the route of its origin). Read-only.
 */
export function computeSphereSeedCensus(
  graph: WorldGraph,
  tiles?: readonly HexTile[],
): SphereSeedCensus {
  const census = emptyCensus();
  const terrainByHex = buildTileTerrainIndex(tiles);
  for (const node of sweepNodes(graph)) {
    const row = census[sphereSeedKindOf(node)];
    row.total++;
    const bag = node.properties.sphereAffinity;
    if (!isValidSphereAffinity(bag)) {
      row.unseeded++;
      continue;
    }
    row.seeded++;
    if (SPHERE_NAMES.some(s => !Number.isInteger(bag.scores[s] ?? 0))) row.nonInteger++;
    const route = node.type === 'actor'
      ? seedActorSphereAffinity(graph, node).route
      : seedPlaceSphereAffinity(graph, node, terrainByHex).route;
    row.byRoute[route] = (row.byRoute[route] ?? 0) + 1;
  }
  return census;
}

/** Equal score records (missing reads as zero). */
function sameScores(a: Record<string, number> | undefined, b: Record<SphereName, number>): boolean {
  if (!a) return false;
  return SPHERE_NAMES.every(s => (a[s] ?? 0) === b[s]);
}

/**
 * Each faction's derived `sphereAggregate`: per sphere, the rounded mean of its
 * individual members' scores (D3; a mean, not a sum, so a faction of 40 stays on a
 * person's 0–10 scale). Writes only when the scores or member count changed. Returns
 * how many factions were written, so the caller knows whether the world moved.
 */
export function computeFactionSphereAggregates(graph: WorldGraph, tick: number): number {
  let written = 0;
  for (const faction of graph.getNodesByType('actor')) {
    if (faction.properties.actorType !== 'faction') continue;
    try {
      const members = getFactionMembers(graph, faction.id).filter(m =>
        m.properties.actorType === 'individual' && isValidSphereAffinity(m.properties.sphereAffinity),
      );
      const scores = createDefaultSphereAffinity().scores;
      if (members.length > 0 && members.length >= FACTION_SPHERE_AGGREGATE_MIN_MEMBERS) {
        for (const s of SPHERE_NAMES) {
          let sum = 0;
          for (const m of members) sum += (m.properties.sphereAffinity as SphereAffinity).scores[s] ?? 0;
          scores[s] = Math.round(sum / members.length);
        }
      }
      const prior = faction.properties.sphereAggregate as FactionSphereAggregate | undefined;
      if (prior && sameScores(prior.scores, scores) && prior.memberCount === members.length) continue;
      const aggregate: FactionSphereAggregate = { scores, memberCount: members.length, computedTick: tick };
      graph.updateNode(faction.id, { properties: { sphereAggregate: aggregate } });
      written++;
    } catch {
      // Fail-soft: skip this faction, keep the phase running.
    }
  }
  return written;
}

/**
 * A faction's sphere scores as readers should see them: its own `sphereAffinity`
 * (birth seed, pressure landings) plus its derived `sphereAggregate`, capped at
 * MAX_SPHERE_SCORE. Either part missing or malformed reads as zeros.
 */
export function getFactionSphereScores(node: GraphNode | undefined): Record<SphereName, number> {
  const out = createDefaultSphereAffinity().scores;
  if (!node) return out;
  const own = node.properties.sphereAffinity;
  const ownScores = isValidSphereAffinity(own) ? own.scores : undefined;
  const agg = node.properties.sphereAggregate as FactionSphereAggregate | undefined;
  const aggScores = agg && typeof agg.scores === 'object' && agg.scores !== null ? agg.scores : undefined;
  for (const s of SPHERE_NAMES) {
    const v = (Number(ownScores?.[s]) || 0) + (Number(aggScores?.[s]) || 0);
    out[s] = Math.min(Math.max(0, v), MAX_SPHERE_SCORE);
  }
  return out;
}
