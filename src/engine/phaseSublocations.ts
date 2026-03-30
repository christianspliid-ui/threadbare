/**
 * Phase: Gold Sublocations
 *
 * Manages conditional spawn and dissolution of Gold Reach sublocation types.
 * Each tick, settlement locations are inspected and missing conditional
 * sublocations are created (when predicate holds) or existing ones dissolved
 * (via checkDissolutions, which now evaluates conditional predicates).
 *
 * New sublocation types (System 5):
 *   market-district  — conditional: prosperity >= SUBLOC_MARKET_SPAWN_PROSPERITY
 *   mine             — conditional: has ore or stone resource
 *   harbor           — conditional: location is coastal
 *   warehouse        — conditional: guild at location has wealth >= GUILD_WAREHOUSE_THRESHOLD
 *   counting-house   — conditional: guild at location has wealth >= GUILD_COUNTING_HOUSE_THRESHOLD
 *   smugglers-den    — conditional: prosperity < SUBLOC_SMUGGLER_SPAWN_PROSPERITY
 *   caravan-rest     — conditional: trade route present at location
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 * System 5 — Gold Sublocations
 * NFP priorities: Tunability, Inspectability, Fail-soft
 */

import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import type { SublocationProperties } from '../types/sublocation';
import { evaluateConditionalPredicate, checkDissolutions } from './sublocation';
import { mulberry32 } from '../lib/prng';
import type { EncounterCacheManager } from './encounterCache';

// ─── Constants (System 5) ──────────────────────────────────────────────────

/** Prosperity threshold to spawn Market District */
export const SUBLOC_MARKET_SPAWN_PROSPERITY = 40;

/**
 * Prosperity threshold to dissolve Market District.
 * Lower than spawn threshold to provide hysteresis.
 */
export const SUBLOC_MARKET_DISSOLVE_PROSPERITY = 20;

/** Prosperity below which Smuggler's Den can appear */
export const SUBLOC_SMUGGLER_SPAWN_PROSPERITY = 30;

/** Bonus to trade action resolution at Market Districts */
export const SUBLOC_MARKET_TRADE_BONUS = 0.1;

/** Trade volume multiplier boost at Market Districts */
export const SUBLOC_MARKET_VOLUME_BONUS = 0.1;

/** Base resource units produced per mine per tick */
export const MINE_PRODUCTION_PER_TICK = 3;

// ─── Constants (System 3 — Guild thresholds, referenced here for sublocation spawn) ─

/** Guild wealth needed to spawn Warehouse sublocation */
export const GUILD_WAREHOUSE_THRESHOLD = 30;

/** Guild wealth needed to spawn Counting House sublocation */
export const GUILD_COUNTING_HOUSE_THRESHOLD = 50;

// ─── Sublocation type definitions ──────────────────────────────────────────

/**
 * Spawn condition and persistence predicate for each conditional Gold sublocation.
 *
 * spawnPredicate:   evaluated to decide whether to create the sublocation
 * dissolvePredicate: stored on the node's `persistence.predicate` field;
 *                    dissolution fires when this evaluates to false.
 *
 * Hysteresis: spawn and dissolve thresholds can differ (e.g. Market District).
 */
interface ConditionalSublocationSpec {
  /** Sublocation type node ID */
  sublocationTypeId: string;
  /** Display name */
  name: string;
  /** Axiological motivations for sublocation scoring */
  motivations: Array<{ left: string; right: string; weight: number }>;
  /** Predicate that must be TRUE to spawn this sublocation */
  spawnPredicate: string;
  /** Predicate stored on the node; dissolution fires when it evaluates to FALSE */
  dissolvePredicate: string;
  /** Which location subtypes can host this sublocation */
  eligibleSubtypes: string[];
}

const GOLD_SUBLOCATION_SPECS: ConditionalSublocationSpec[] = [
  {
    sublocationTypeId: 'sublocation-type.market-district',
    name: 'Market District',
    motivations: [
      { left: 'greed', right: 'generosity', weight: 0.7 },
      { left: 'cunning', right: 'honesty', weight: 0.5 },
    ],
    spawnPredicate: `prosperity >= ${SUBLOC_MARKET_SPAWN_PROSPERITY}`,
    dissolvePredicate: `prosperity >= ${SUBLOC_MARKET_DISSOLVE_PROSPERITY}`,
    eligibleSubtypes: ['hamlet', 'town', 'city', 'capital'],
  },
  {
    sublocationTypeId: 'sublocation-type.mine',
    name: 'Mine',
    motivations: [
      { left: 'duty', right: 'freedom', weight: 0.6 },
      { left: 'tradition', right: 'innovation', weight: 0.4 },
    ],
    spawnPredicate: 'has_resource:ore||has_resource:stone',
    dissolvePredicate: 'has_resource:ore||has_resource:stone',
    eligibleSubtypes: ['hamlet', 'town', 'city', 'capital', 'mining'],
  },
  {
    sublocationTypeId: 'sublocation-type.harbor',
    name: 'Harbor',
    motivations: [
      { left: 'ambition', right: 'contentment', weight: 0.6 },
      { left: 'greed', right: 'generosity', weight: 0.5 },
    ],
    spawnPredicate: 'is_coastal',
    dissolvePredicate: 'is_coastal',
    eligibleSubtypes: ['hamlet', 'town', 'city', 'capital'],
  },
  {
    sublocationTypeId: 'sublocation-type.warehouse',
    name: 'Warehouse',
    motivations: [
      { left: 'greed', right: 'generosity', weight: 0.6 },
      { left: 'cunning', right: 'honesty', weight: 0.4 },
    ],
    spawnPredicate: `guild_wealth >= ${GUILD_WAREHOUSE_THRESHOLD}`,
    dissolvePredicate: `guild_wealth >= ${GUILD_WAREHOUSE_THRESHOLD}`,
    eligibleSubtypes: ['hamlet', 'town', 'city', 'capital'],
  },
  {
    sublocationTypeId: 'sublocation-type.counting-house',
    name: 'Counting House',
    motivations: [
      { left: 'greed', right: 'generosity', weight: 0.8 },
      { left: 'cunning', right: 'honesty', weight: 0.6 },
    ],
    spawnPredicate: `guild_wealth >= ${GUILD_COUNTING_HOUSE_THRESHOLD}`,
    dissolvePredicate: `guild_wealth >= ${GUILD_COUNTING_HOUSE_THRESHOLD}`,
    eligibleSubtypes: ['town', 'city', 'capital'],
  },
  {
    sublocationTypeId: 'sublocation-type.smugglers-den',
    name: "Smuggler's Den",
    motivations: [
      { left: 'cunning', right: 'honesty', weight: 0.9 },
      { left: 'greed', right: 'generosity', weight: 0.7 },
    ],
    // Spawns below 30; dissolves above 40 (hysteresis gap: economic recovery)
    spawnPredicate: `prosperity < ${SUBLOC_SMUGGLER_SPAWN_PROSPERITY}`,
    dissolvePredicate: `prosperity < ${SUBLOC_MARKET_SPAWN_PROSPERITY}`,
    eligibleSubtypes: ['hamlet', 'town', 'city', 'capital'],
  },
  {
    sublocationTypeId: 'sublocation-type.caravan-rest',
    name: 'Caravan Rest',
    motivations: [
      { left: 'ambition', right: 'contentment', weight: 0.5 },
      { left: 'greed', right: 'generosity', weight: 0.4 },
    ],
    spawnPredicate: 'trade_route_present',
    dissolvePredicate: 'trade_route_present',
    eligibleSubtypes: ['hamlet', 'town', 'city', 'capital', 'camp'],
  },
];

// ─── Settlement subtypes that participate in sublocation evaluation ─────────

const SETTLEMENT_SUBTYPES = new Set([
  'hamlet', 'town', 'city', 'capital', 'mining', 'camp',
]);

// ─── Phase function ───────────────────────────────────────────────────────

/**
 * Evaluates conditional sublocation spawn and dissolution for all locations.
 *
 * Two passes each tick:
 * 1. Dissolution pass — calls checkDissolutions (now handles conditional predicates)
 * 2. Spawn pass — for each location, for each spec, spawn if predicate holds and
 *    no instance of that type already exists at this location.
 *
 * Idempotent: re-running on same state produces same result.
 * Fail-soft: missing node/property → skip, never throw.
 */
export function phaseSublocations(
  state: GameState,
  encounterCache?: EncounterCacheManager | null,
): Partial<GameState> {
  const { graph, tick, encounterProgress } = state;

  // ── Pass 1: Dissolution ─────────────────────────────────────────────────
  // checkDissolutions now evaluates conditional predicates and removes nodes
  // whose predicate evaluates to false.
  const dissolutions = checkDissolutions(graph, tick, encounterProgress);

  // Update encounter cache for dissolved sublocations
  if (encounterCache && dissolutions.length > 0) {
    for (const d of dissolutions) {
      encounterCache.onSublocationDestroyed(d.sublocationId, d.parentLocationId);
    }
  }

  // ── Pass 2: Spawn ───────────────────────────────────────────────────────
  const allLocations = graph.getNodesByType('location');

  for (const loc of allLocations) {
    const subtype = typeof loc.properties.locationSubtype === 'string'
      ? loc.properties.locationSubtype
      : '';

    if (!SETTLEMENT_SUBTYPES.has(subtype)) continue;

    for (const spec of GOLD_SUBLOCATION_SPECS) {
      if (!spec.eligibleSubtypes.includes(subtype)) continue;

      // Check if an instance of this type already exists at this location
      if (hasSublocationType(loc, spec.sublocationTypeId, graph)) continue;

      // Evaluate spawn predicate
      const shouldSpawn = evaluateConditionalPredicate(spec.spawnPredicate, loc.id, graph);
      if (!shouldSpawn) continue;

      // Create the conditional sublocation
      const instanceId = spawnConditionalSublocation(loc, spec, tick, graph);

      // Update encounter cache for newly spawned sublocation
      if (encounterCache && instanceId) {
        encounterCache.onSublocationCreated(graph, instanceId, loc.id);
      }
    }
  }

  return {};
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Returns true if the location already has a sublocation of the given type.
 */
function hasSublocationType(loc: GraphNode, sublocationTypeId: string, graph: WorldGraph): boolean {
  const containsEdges = graph.getOutgoingEdges(loc.id, 'contains');
  for (const edge of containsEdges) {
    const child = graph.getNode(edge.target);
    if (!child) continue;
    const props = child.properties as Partial<SublocationProperties>;
    if (props.sublocationTypeId === sublocationTypeId && props.parentLocationId === loc.id) {
      return true;
    }
  }
  return false;
}

/**
 * Spawns a conditional sublocation node at the given location.
 * Returns the instance ID on success, undefined on failure.
 * Fail-soft: any error → no-op, returns undefined.
 */
function spawnConditionalSublocation(
  loc: GraphNode,
  spec: ConditionalSublocationSpec,
  tick: number,
  graph: WorldGraph
): string | undefined {
  // Generate deterministic instance ID from location + type + tick
  const rng = mulberry32(hashString(loc.id + spec.sublocationTypeId + tick));
  const instanceSuffix = Math.floor(rng() * 1000000).toString(36);
  const instanceId = `${spec.sublocationTypeId}-instance-${instanceSuffix}`;

  // Defensive: skip if already exists (race condition guard)
  if (graph.getNode(instanceId)) return undefined;

  const properties: SublocationProperties = {
    sublocationTypeId: spec.sublocationTypeId,
    parentLocationId: loc.id,
    persistence: {
      type: 'conditional',
      predicate: spec.dissolvePredicate,
    },
  };

  const instanceNode: GraphNode = {
    id: instanceId,
    type: 'location',
    name: `${spec.name} (${loc.name})`,
    properties,
  };

  try {
    graph.addNode(instanceNode);

    const edgeId = `edge-subloc-cond-${loc.id}-${spec.sublocationTypeId}-${tick}`;
    graph.addEdge({
      id: edgeId,
      source: loc.id,
      target: instanceId,
      type: 'contains',
      properties: {},
    });

    return instanceId;
  } catch {
    // fail-soft: creation failed, continue
    return undefined;
  }
}

/** Simple string hash for deterministic seed generation. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
