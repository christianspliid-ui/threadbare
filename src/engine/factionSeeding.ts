/**
 * Faction Seeding — generic seeder that creates faction instances from FactionDefinition templates.
 *
 * Takes a FactionDefinition and places the faction + guild hall sublocations at qualifying
 * settlement locations. Uses the same patterns as guildSeeding.ts but driven by FactionDefinition
 * data rather than hardcoded guild types.
 *
 * Design doc: Docs/plans/2026-03-27-faction-vertical-slice-design.md — Phase 1
 * NFP: Tunability (hall count from constants), Determinism (seeded PRNG),
 *       Fail-soft (skip on no locations), Inspectability (seed trace).
 */

import type { WorldGraph } from './graph';
import type { FactionDefinition, FactionSeedTrace } from '../types/faction';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { AxiologicalProfile } from '../types/agent';
import { VALUE_PAIRS } from '../types/agent';
import {
  FACTION_GUILD_HALL_COUNT_MIN,
  FACTION_GUILD_HALL_COUNT_MAX,
} from '../data/faction-definitions';

// ─── PRNG (same mulberry32 used across all seeders) ─────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInRange(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Derive domain capabilities from faction definition reach weights.
 * Scales weights to 0–100 capability range.
 */
function deriveDomainCapabilities(
  reachWeights: Partial<Record<ReachDomain, number>>,
  rng: () => number,
): Record<ReachDomain, number> {
  const caps = {} as Record<ReachDomain, number>;
  for (const domain of REACH_DOMAINS) {
    const weight = reachWeights[domain] ?? 0.1;
    // Scale weight (0–1) to capability (10–80) with some PRNG jitter
    const base = Math.round(weight * 70 + 10);
    const jitter = Math.round((rng() - 0.5) * 10);
    caps[domain] = Math.max(5, Math.min(95, base + jitter));
  }
  return caps;
}

/**
 * Derive reach preferences from domain capabilities (normalized 0–1).
 */
function deriveReachPreferences(
  capabilities: Record<ReachDomain, number>,
): Record<ReachDomain, number> {
  const max = Math.max(...REACH_DOMAINS.map(d => capabilities[d]), 1);
  const prefs = {} as Record<ReachDomain, number>;
  for (const domain of REACH_DOMAINS) {
    prefs[domain] = capabilities[domain] / max;
  }
  return prefs;
}

/**
 * Generate an axiological profile biased toward the faction's nature.
 * Adventuring guilds: bias toward courage, curiosity, camaraderie.
 */
function generateFactionAxiologicalProfile(
  _definition: FactionDefinition,
  rng: () => number,
): AxiologicalProfile {
  const profile = {} as AxiologicalProfile;
  for (const pair of VALUE_PAIRS) {
    profile[pair] = (rng() * 1.6) - 0.8;
  }
  return profile;
}

// ─── Location Filtering ──────────────────────────────────────────────────

/**
 * Find qualifying locations for guild hall placement.
 * Primary: locations matching the definition's locationTypes.
 * Fallback: any location with a settlement (hamlet+).
 */
function findQualifyingLocations(
  graph: WorldGraph,
  locationIds: readonly string[],
  definition: FactionDefinition,
): string[] {
  const eligibleSubtypes = new Set(definition.locationTypes.map(String));

  // Primary: match locationTypes from definition
  const primary = locationIds.filter(id => {
    const node = graph.getNode(id);
    if (!node) return false;
    const subtype = node.properties.locationSubtype as string | undefined;
    return subtype != null && eligibleSubtypes.has(subtype);
  });

  if (primary.length > 0) return primary;

  // Fallback: any settlement (hamlet+)
  const settlementTypes = new Set(['hamlet', 'town', 'city', 'capital']);
  return locationIds.filter(id => {
    const node = graph.getNode(id);
    if (!node) return false;
    const subtype = node.properties.locationSubtype as string | undefined;
    return subtype != null && settlementTypes.has(subtype);
  });
}

// ─── Distance Utilities ──────────────────────────────────────────────────

/**
 * Find the pair of location IDs with maximum hex cube distance.
 *
 * Uses offset-to-axial conversion (odd-q) to compute cube distance.
 * O(n²) — only runs at seed time with ~10–30 qualifying locations.
 *
 * Exported for testing.
 */
export function findMaxDistancePair(
  graph: WorldGraph,
  ids: string[],
): [string, string] {
  if (ids.length < 2) return [ids[0], ids[0]];
  let bestA = ids[0], bestB = ids[1], bestDist = 0;
  for (let i = 0; i < ids.length; i++) {
    const a = graph.getNode(ids[i])?.properties;
    const colA = (a?.hexCol as number) ?? 0;
    const rowA = (a?.hexRow as number) ?? 0;
    // Offset (odd-q) to axial: q = col, r = row - (col - (col & 1)) / 2
    const qA = colA;
    const rA = rowA - (colA - (colA & 1)) / 2;
    for (let j = i + 1; j < ids.length; j++) {
      const b = graph.getNode(ids[j])?.properties;
      const colB = (b?.hexCol as number) ?? 0;
      const rowB = (b?.hexRow as number) ?? 0;
      const qB = colB;
      const rB = rowB - (colB - (colB & 1)) / 2;
      const dq = qA - qB;
      const dr = rA - rB;
      const ds = -dq - dr;
      const d = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
      if (d > bestDist) { bestDist = d; bestA = ids[i]; bestB = ids[j]; }
    }
  }
  return [bestA, bestB];
}

// ─── Main Seeder ─────────────────────────────────────────────────────────

/**
 * Seed a single faction instance from a FactionDefinition.
 *
 * Creates:
 * - One faction actor node with reachPreferences, domainCapabilities, etc.
 * - 3–5 guild hall sublocations at qualifying town/city/capital locations
 * - located_at edges (faction → each guild hall location)
 * - contains edges (location → guild hall sublocation)
 *
 * Does NOT pre-assign agents — they join through encounters during gameplay.
 *
 * @param graph - World graph (mutated in place)
 * @param definition - The faction template to instantiate
 * @param locationIds - All location node IDs
 * @param seed - Seed for deterministic PRNG (should be world seed + unique offset)
 * @param instanceSuffix - Optional suffix for multi-instance factions (e.g. '0', '1')
 * @param primaryLocationOverride - When provided, force this location as the primary hall location
 * @returns Object with the faction node ID and guild hall sublocation IDs
 */
export function seedFactionFromDefinition(
  graph: WorldGraph,
  definition: FactionDefinition,
  locationIds: readonly string[],
  seed: number,
  instanceSuffix?: string,
  primaryLocationOverride?: string,
): { factionId: string; guildHallIds: string[]; trace: FactionSeedTrace } {
  const rng = mulberry32(seed);
  const guildHallIds: string[] = [];
  const suffix = instanceSuffix ? `_${instanceSuffix}` : '';

  // ── Find qualifying locations ──────────────────────────────────────
  const qualifying = findQualifyingLocations(graph, locationIds, definition);

  if (qualifying.length === 0) {
    // Fail-soft: no qualifying locations → skip faction creation
    const factionId = `faction_def_${definition.id}${suffix}`;
    return {
      factionId,
      guildHallIds: [],
      trace: {
        tick: 0,
        category: 'faction_seed',
        factionId,
        definitionId: definition.id,
        guildHallCount: 0,
        locationIds: [],
        summary: `Skipped seeding '${definition.nameTemplate}': no qualifying locations`,
      },
    };
  }

  // ── Select guild hall locations ────────────────────────────────────
  const hallCount = Math.min(
    randomInRange(rng, FACTION_GUILD_HALL_COUNT_MIN, FACTION_GUILD_HALL_COUNT_MAX),
    qualifying.length,
  );

  // Shuffle qualifying locations (exclude primaryLocationOverride from shuffle pool to avoid duplication)
  const shufflePool = primaryLocationOverride
    ? qualifying.filter(id => id !== primaryLocationOverride)
    : [...qualifying];
  for (let i = shufflePool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shufflePool[i], shufflePool[j]] = [shufflePool[j], shufflePool[i]];
  }
  // Primary location first, then fill remaining halls from shuffled pool
  const remainingCount = Math.max(0, hallCount - (primaryLocationOverride ? 1 : 0));
  const selectedLocationIds = primaryLocationOverride
    ? [primaryLocationOverride, ...shufflePool.slice(0, remainingCount)]
    : shufflePool.slice(0, hallCount);

  // ── Create faction node ────────────────────────────────────────────
  const factionId = `faction_def_${definition.id}${suffix}`;
  const caps = deriveDomainCapabilities(definition.reachWeights, rng);
  const reachPrefs = deriveReachPreferences(caps);
  const profile = generateFactionAxiologicalProfile(definition, rng);

  // Use first guild hall location as home base
  const homeLocationId = selectedLocationIds[0];

  graph.addNode({
    id: factionId,
    type: 'actor',
    name: definition.nameTemplate,
    properties: {
      actorType: 'faction',
      factionType: definition.factionType,
      factionDefId: definition.id,
      axiologicalProfile: profile,
      domainCapabilities: caps,
      reachPreferences: reachPrefs,
      homeLocationId,
      wealth: 0,
      displaced: false,
    },
  });

  // ── Create guild halls at selected locations ───────────────────────
  let edgeCounter = 0;

  for (const locId of selectedLocationIds) {
    const location = graph.getNode(locId);
    const locName = location?.name ?? locId;

    // located_at edge: faction → location
    graph.addEdge({
      id: `edge_fdef_at_${factionId}_${edgeCounter}`,
      source: factionId,
      target: locId,
      type: 'located_at',
      properties: { role: 'guild_hall' },
    });

    // Guild Hall sublocation
    const hallSuffix = Math.floor(rng() * 1000000).toString(36);
    const hallId = `subloc.faction-hall-${definition.id}${suffix}-${hallSuffix}`;

    try {
      graph.addNode({
        id: hallId,
        type: 'location',
        name: `${definition.nameTemplate} Hall (${locName})`,
        properties: {
          sublocationTypeId: 'sublocation-type.faction-hall',
          parentLocationId: locId,
          factionId,
          factionDefId: definition.id,
          persistence: { type: 'permanent' },
        },
      });

      graph.addEdge({
        id: `edge_faction_hall_${definition.id}${suffix}_${edgeCounter}`,
        source: locId,
        target: hallId,
        type: 'contains',
        properties: {},
      });

      guildHallIds.push(hallId);
    } catch {
      // Fail-soft: sublocation creation failure does not crash seeding
    }

    edgeCounter++;
  }

  const trace: FactionSeedTrace = {
    tick: 0,
    category: 'faction_seed',
    factionId,
    definitionId: definition.id,
    guildHallCount: guildHallIds.length,
    locationIds: selectedLocationIds,
    summary: `Seeded '${definition.nameTemplate}' with ${guildHallIds.length} guild hall(s) at ${selectedLocationIds.length} location(s)`,
  };

  return { factionId, guildHallIds, trace };
}

/**
 * Seed all registered faction definitions.
 * Each definition gets its own PRNG stream offset from the base seed.
 *
 * Supports multi-instance definitions via `instanceCount > 1`. When combined
 * with `distanceConstrained: true`, instances are placed at maximum hex
 * distance from each other using findMaxDistancePair.
 *
 * @param graph - World graph (mutated in place)
 * @param definitions - Map of definition ID → FactionDefinition
 * @param locationIds - All location node IDs
 * @param seed - Base seed (each definition gets seed + hash offset)
 * @returns Array of { factionId, guildHallIds, trace } per instance
 */
export function seedAllFactions(
  graph: WorldGraph,
  definitions: ReadonlyMap<string, FactionDefinition>,
  locationIds: readonly string[],
  seed: number,
): Array<{ factionId: string; guildHallIds: string[]; trace: FactionSeedTrace }> {
  const results: Array<{ factionId: string; guildHallIds: string[]; trace: FactionSeedTrace }> = [];
  let offsetIndex = 0;

  for (const [_id, definition] of definitions) {
    const instanceCount = definition.instanceCount ?? 1;

    if (instanceCount <= 1) {
      // Single-instance: standard path (no suffix)
      const defSeed = seed + offsetIndex * 7919; // prime spacing between streams
      const result = seedFactionFromDefinition(graph, definition, locationIds, defSeed);
      results.push(result);
    } else {
      // Multi-instance path
      let distancePair: [string, string] | null = null;

      if (definition.distanceConstrained) {
        // Find qualifying locations for distance-based placement
        const qualifying = locationIds.filter(id => {
          const node = graph.getNode(id);
          if (!node) return false;
          const subtype = node.properties.locationSubtype as string | undefined;
          if (subtype != null && (definition.locationTypes as string[]).includes(subtype)) return true;
          // Fallback to any settlement
          const settlementTypes = new Set(['hamlet', 'town', 'city', 'capital']);
          return subtype != null && settlementTypes.has(subtype);
        });

        if (qualifying.length >= 2) {
          distancePair = findMaxDistancePair(graph, qualifying);
        }
      }

      for (let i = 0; i < instanceCount; i++) {
        // Each instance gets a distinct PRNG stream: defSeed + i * 7919
        const defSeed = seed + offsetIndex * 7919 + i * 7919;
        const primaryOverride = distancePair ? distancePair[i] : undefined;
        const result = seedFactionFromDefinition(
          graph,
          definition,
          locationIds,
          defSeed,
          String(i),
          primaryOverride,
        );
        results.push(result);
      }
    }

    offsetIndex++;
  }

  // ── Seed inter-faction dispositions ─────────────────────────────────
  // Create relates_to edges between factions based on definition.dispositions.
  // Only creates edges where both factions were successfully seeded.
  seedFactionDispositions(graph, definitions, results);

  return results;
}

// ─── Disposition Seeding ──────────────────────────────────────────────────

/**
 * Create relates_to edges between factions based on each definition's
 * dispositions map. Bidirectional: if A lists B, the edge goes A→B.
 * If B also lists A, a second edge B→A is created (may differ in magnitude).
 *
 * Deduplication: skips if an edge with basis 'faction_alignment' already
 * exists between the pair.
 */
function seedFactionDispositions(
  graph: WorldGraph,
  definitions: ReadonlyMap<string, FactionDefinition>,
  seedResults: ReadonlyArray<{ factionId: string }>,
): void {
  // Build defId → factionNodeId map (handles multi-instance by using first instance)
  const defIdToNodeId = new Map<string, string>();
  for (const result of seedResults) {
    // factionId format: faction_def_{defId} or faction_def_{defId}_{suffix}
    const match = result.factionId.match(/^faction_def_(.+?)(?:_\d+)?$/);
    if (match && !defIdToNodeId.has(match[1])) {
      defIdToNodeId.set(match[1], result.factionId);
    }
  }

  // Track created edges to avoid duplicates
  const createdEdges = new Set<string>();
  let edgeCounter = 0;

  for (const [defId, definition] of definitions) {
    if (!definition.dispositions) continue;

    const sourceNodeId = defIdToNodeId.get(defId);
    if (!sourceNodeId) continue;

    for (const [targetDefId, sentiment] of Object.entries(definition.dispositions)) {
      const targetNodeId = defIdToNodeId.get(targetDefId);
      if (!targetNodeId) continue;

      const edgeKey = `${sourceNodeId}->${targetNodeId}`;
      if (createdEdges.has(edgeKey)) continue;

      graph.addEdge({
        id: `edge_faction_disp_${edgeCounter}`,
        source: sourceNodeId,
        target: targetNodeId,
        type: 'relates_to',
        properties: {
          sentiment,
          trust: sentiment * 0.5,
          strength: Math.abs(sentiment) * 0.3,
          basis: 'faction_alignment',
        },
      });

      createdEdges.add(edgeKey);
      edgeCounter++;
    }
  }
}
