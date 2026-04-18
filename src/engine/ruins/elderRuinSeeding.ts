/**
 * Elder Ruin Density Pass — seeds `elder_ruin` location nodes into the world
 * graph at game-init time, after settlements are placed.
 *
 * Placement rules (per design doc §Worldgen density):
 *   - Only within hexes assigned to a historical culture's territory
 *   - Excludes hexes that already have settlement-family locations
 *   - Province role (capital / heartland / borderland) governs density roll
 *   - Magnitude is biased toward saga scale near capital-zone hexes
 *   - Archetype (vault / temple / battlefield) is weighted-randomly stamped
 *   - Per-hex ruin cap enforced (1 standard, up to 3 at capital zones)
 *
 * NFP #1 Tunability: all thresholds import from ruins/constants.ts
 * NFP #3 Determinism: all rolls use mulberry32(seed + PASS_SEED_ELDER_RUINS)
 * NFP #4 Fail-soft: missing region data → hex skipped silently
 */

import { mulberry32 } from '../../lib/prng';
import { PASS_SEED_ELDER_RUINS } from '../worldgen/constants';
import {
  PROVINCE_ROLE_CAPITAL,
  PROVINCE_ROLE_HEARTLAND,
} from '../worldgen/types';
import {
  RUIN_DENSITY_WILDERNESS,
  RUIN_DENSITY_CAPITAL,
  RUIN_MAX_PER_HEX_STANDARD,
  RUIN_MAX_PER_HEX_CAPITAL,
  RUIN_MAGNITUDE_MINOR_MAX,
  RUIN_MAGNITUDE_MAJOR_MAX,
  RUIN_SAGA_CAPITAL_BIAS,
} from './constants';
import { pickRuinArchetype } from '../../content/ruins/archetypes';
import type { WorldGraph } from '../graph';
import type { HexTile, SphereName } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import { emitTrace } from '../traceBuffer';
import { seedHexSphereAffinity } from '../sphereAffinity';

// ─── Settlement exclusion ─────────────────────────────────────────────────────

/** Location subtypes that block ruin placement on their hex. */
const SETTLEMENT_BLOCKING_SUBTYPES = new Set([
  'capital', 'city', 'town', 'hamlet', 'village',
  'fort', 'castle', 'camp',
]);

// ─── Water terrain check ──────────────────────────────────────────────────────

const WATER_TERRAINS = new Set([
  'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast',
  'lake', 'river', 'reef',
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Derive the dominant sphere from hex terrain affinity. Falls back to 'force'. */
function getDominantSphere(terrain: string): SphereName {
  const affinity = seedHexSphereAffinity(terrain);
  let best: SphereName = 'force';
  let bestScore = -1;
  for (const sphere of SPHERE_NAMES) {
    const score = affinity.scores[sphere] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = sphere;
    }
  }
  return best;
}

/** Derive delve scale from magnitude using design-doc thresholds. */
function magnitudeToScale(magnitude: number): 'minor' | 'major' | 'saga' {
  if (magnitude <= RUIN_MAGNITUDE_MINOR_MAX) return 'minor';
  if (magnitude <= RUIN_MAGNITUDE_MAJOR_MAX) return 'major';
  return 'saga';
}

/** Look up the historical culture ID for a region (if any). */
function getHistoricalCultureForRegion(
  graph: WorldGraph,
  regionId: string,
): string | null {
  const edges = graph.getOutgoingEdges(regionId);
  for (const edge of edges) {
    if (edge.type === 'belongs_to' && edge.properties?.cultureLayer === 'historical') {
      return edge.target as string;
    }
  }
  return null;
}

/** Get the primary sphere alignment from a historical culture actor node, or null. */
function getCultureSphereAlignment(
  graph: WorldGraph,
  cultureId: string,
): SphereName | null {
  const node = graph.getNode(cultureId);
  if (!node) return null;
  const identity = node.properties?.cultureIdentity as { veneratedSpheres?: SphereName[] } | undefined;
  const sphere = identity?.veneratedSpheres?.[0];
  return sphere ?? null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Seed elder ruins into the world graph based on historical culture territory.
 *
 * Must be called after:
 *   - worldSeed (settlements + historical cultures + territory assignment)
 *   - seedMonsterLairs (no dependency, but matches call-order convention)
 *
 * @param graph         - World graph to mutate (ruins added as location nodes)
 * @param tiles         - HexTile array with regionId stamped by worldSeed
 * @param seed          - World seed for deterministic PRNG
 * @param cols          - Grid column count (for tile-index calculation)
 * @param provinceRoles - Uint8Array mapping tile-index → province role
 */
export function seedElderRuins(
  graph: WorldGraph,
  tiles: HexTile[],
  seed: number,
  cols: number,
  provinceRoles: Uint8Array,
): void {
  const rng = mulberry32(seed + PASS_SEED_ELDER_RUINS);

  // ── Build historical territory set ─────────────────────────────────────────
  // Traverse belongs_to edges with cultureLayer='historical' to collect region IDs.
  const historicalRegionIds = new Set<string>();
  for (const edge of graph.getEdgesByType('belongs_to')) {
    if (edge.properties?.cultureLayer === 'historical') {
      historicalRegionIds.add(edge.source as string);
    }
  }

  // ── Build settlement hex exclusion set ─────────────────────────────────────
  const settlementHexKeys = new Set<string>();
  for (const node of graph.getNodesByType('location')) {
    const subtype = node.properties?.locationSubtype as string | undefined;
    if (!subtype || !SETTLEMENT_BLOCKING_SUBTYPES.has(subtype)) continue;
    const col = node.properties?.hexCol as number | undefined;
    const row = node.properties?.hexRow as number | undefined;
    if (col !== undefined && row !== undefined) {
      settlementHexKeys.add(`${col},${row}`);
    }
  }

  // ── Placement loop ─────────────────────────────────────────────────────────
  let ruinIndex = 0;
  const ruinsPerHex = new Map<string, number>();
  const byArchetype: Record<string, number> = { vault: 0, temple: 0, battlefield: 0 };
  const byMagnitude: Record<string, number> = { minor: 0, major: 0, saga: 0 };
  const bySphere: Record<string, number> = {};
  let historicalCultureBoostedHexes = 0;

  for (const tile of tiles) {
    const { col, row } = tile.coord;

    // Skip water
    if (WATER_TERRAINS.has(tile.terrain)) {
      rng(); // consume to keep downstream deterministic
      continue;
    }

    // Skip if not in historical territory
    const regionId = tile.regionId;
    if (!regionId || !historicalRegionIds.has(regionId)) {
      rng();
      continue;
    }

    // Skip if hex has a settlement
    const hexKey = `${col},${row}`;
    if (settlementHexKeys.has(hexKey)) {
      rng();
      continue;
    }

    // Province role determines density
    const idx = col + row * cols;
    const role = provinceRoles[idx] ?? PROVINCE_ROLE_HEARTLAND;
    const isCapitalZone = role === PROVINCE_ROLE_CAPITAL;
    const density = isCapitalZone ? RUIN_DENSITY_CAPITAL : RUIN_DENSITY_WILDERNESS;

    // Per-hex cap check
    const currentCount = ruinsPerHex.get(hexKey) ?? 0;
    const maxCount = isCapitalZone ? RUIN_MAX_PER_HEX_CAPITAL : RUIN_MAX_PER_HEX_STANDARD;
    if (currentCount >= maxCount) {
      rng();
      continue;
    }

    // Roll for placement
    const roll = rng();
    if (roll >= density) continue;

    // ── Magnitude ────────────────────────────────────────────────────────────
    // Capital zones are biased toward higher-magnitude (saga-eligible) ruins.
    let magnitude: number;
    if (isCapitalZone) {
      // Shift base up by capital bias, then add noise
      magnitude = Math.min(1.0, 0.4 + rng() * RUIN_SAGA_CAPITAL_BIAS + rng() * 0.3);
      historicalCultureBoostedHexes++;
    } else {
      // Non-capital: mostly minor/major range
      magnitude = rng() * 0.9;
    }
    // Round to 2 decimal places (worldgen assigns magnitudes at 2-decimal precision)
    magnitude = Math.round(magnitude * 100) / 100;

    const delveScale = magnitudeToScale(magnitude);

    // ── Sphere alignment ──────────────────────────────────────────────────────
    // Prefer historical culture's sphere; fall back to terrain affinity.
    const histCultureId = getHistoricalCultureForRegion(graph, regionId);
    const sphereAlignment: SphereName =
      (histCultureId ? getCultureSphereAlignment(graph, histCultureId) : null)
      ?? getDominantSphere(tile.terrain);

    // ── Archetype ─────────────────────────────────────────────────────────────
    const archetype = pickRuinArchetype(rng());

    // ── Create ruin node ──────────────────────────────────────────────────────
    const ruinId = `elder_ruin_${ruinIndex}`;
    graph.addNode({
      id: ruinId,
      type: 'location',
      name: `${archetype.charAt(0).toUpperCase() + archetype.slice(1)} Ruin`,
      properties: {
        locationType: 'elder_ruin',
        locationSubtype: 'elder_ruin',
        hexCol: col,
        hexRow: row,
        terrain: tile.terrain,
        ruinMagnitude: magnitude,
        sphereAlignment,
        originCultureId: histCultureId ?? null,
        delveScale,
        ageState: 'lost',
        discovered: false,
        undelved: true,
        archetype,
      },
    });

    ruinsPerHex.set(hexKey, currentCount + 1);
    byArchetype[archetype] = (byArchetype[archetype] ?? 0) + 1;
    byMagnitude[delveScale] = (byMagnitude[delveScale] ?? 0) + 1;
    bySphere[sphereAlignment] = (bySphere[sphereAlignment] ?? 0) + 1;
    ruinIndex++;
  }

  // ── Emit density trace ────────────────────────────────────────────────────
  emitTrace({
    category: 'ruins.density_seeded',
    tick: 0,
    totalCount: ruinIndex,
    byArchetype,
    byMagnitude,
    bySphere,
    historicalCultureBoostedHexes,
    summary: `Elder ruins seeded: ${ruinIndex} total (vault:${byArchetype.vault} temple:${byArchetype.temple} battlefield:${byArchetype.battlefield})`,
  });
}
