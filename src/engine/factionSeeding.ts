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
 * @returns Object with the faction node ID and guild hall sublocation IDs
 */
export function seedFactionFromDefinition(
  graph: WorldGraph,
  definition: FactionDefinition,
  locationIds: readonly string[],
  seed: number,
): { factionId: string; guildHallIds: string[]; trace: FactionSeedTrace } {
  const rng = mulberry32(seed);
  const guildHallIds: string[] = [];

  // ── Find qualifying locations ──────────────────────────────────────
  const qualifying = findQualifyingLocations(graph, locationIds, definition);

  if (qualifying.length === 0) {
    // Fail-soft: no qualifying locations → skip faction creation
    const factionId = `faction_def_${definition.id}`;
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

  // Shuffle qualifying locations, take first N
  const shuffled = [...qualifying];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const selectedLocationIds = shuffled.slice(0, hallCount);

  // ── Create faction node ────────────────────────────────────────────
  const factionId = `faction_def_${definition.id}`;
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
    const hallId = `subloc.faction-hall-${definition.id}-${hallSuffix}`;

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
        id: `edge_faction_hall_${definition.id}_${edgeCounter}`,
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
 * @param graph - World graph (mutated in place)
 * @param definitions - Map of definition ID → FactionDefinition
 * @param locationIds - All location node IDs
 * @param seed - Base seed (each definition gets seed + hash offset)
 * @returns Array of { factionId, guildHallIds, trace } per definition
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
    // Each definition gets a distinct PRNG stream
    const defSeed = seed + offsetIndex * 7919; // prime spacing between streams
    const result = seedFactionFromDefinition(graph, definition, locationIds, defSeed);
    results.push(result);
    offsetIndex++;
  }

  return results;
}
