/**
 * NPC Seeding — creates ambient NPC actor nodes at locations during world generation.
 *
 * Each settlement/temple/outpost/wilderness location is populated with background
 * characters appropriate to its subtype. These NPCs start at the 'ambient' SpotlightTier
 * and may be promoted to 'notable' or 'spotlight' through play.
 *
 * Design doc: NPC Framework v1
 * NFP: Tunability (caps from NPC_CONSTANTS), Determinism (passed-in RNG),
 *      Fail-soft (skip unknown subtypes), Inspectability (NpcSeededTrace).
 */

import type { WorldGraph } from './graph';
import {
  LOCATION_ROLE_ROSTERS,
  NPC_NAME_POOL,
  NPC_CONSTANTS,
  NPC_ROLE_SUBLOCATION_MAP,
} from '../types/npc';
import type { SublocationProperties } from '../types/sublocation';
import type { CultureIdentity } from '../types/culture';
import { pickCulturalName } from '../data/culture-name-pools';

// ─── Trace types ─────────────────────────────────────────────────────────────

export interface NpcSeededTrace {
  type: 'npc_seeded';
  actorId: string;
  locationId: string;
  role: string;
  factionId: string | null;
  tick: 0;
}

export interface SeedNpcsResult {
  npcIds: string[];
  traces: NpcSeededTrace[];
}

// ─── Subtype mappings ─────────────────────────────────────────────────────────

/** Map from locationSubtype → roster key in LOCATION_ROLE_ROSTERS. null = no NPCs. */
const SUBTYPE_TO_ROSTER_KEY: Record<string, string | null> = {
  hamlet: 'hamlet',
  town: 'town',
  city: 'city',
  temple: 'temple',
  shrine: 'temple',
  military_outpost: 'military_outpost',
  wilderness: 'wilderness',
  landmark: 'wilderness',
  lair: null,
  ruin: null,
};

/** Population caps per roster key. */
const ROSTER_KEY_TO_CAP: Record<string, number> = {
  hamlet: NPC_CONSTANTS.MAX_NPCS_HAMLET,
  town: NPC_CONSTANTS.MAX_NPCS_TOWN,
  city: NPC_CONSTANTS.MAX_NPCS_CITY,
  temple: 3,
  military_outpost: 3,
  wilderness: 2,
};

// ─── NPC counter (module-level, increments across all seedNpcsAtLocations calls) ──

let npcCounter = 0;

// Exported for test reset if needed; not part of the public API.
export function _resetNpcCounter(): void {
  npcCounter = 0;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Seed ambient NPCs at the given list of location IDs.
 *
 * @param graph            The world graph to mutate.
 * @param locationIds      IDs of location nodes to populate.
 * @param rng              Seeded PRNG for deterministic generation.
 * @param factionLocationMap  Optional map of locationId → factionId. When present,
 *                            NPCs at mapped locations also get a member_of edge.
 */
export function seedNpcsAtLocations(
  graph: WorldGraph,
  locationIds: string[],
  rng: () => number,
  factionLocationMap?: Map<string, string>,
): SeedNpcsResult {
  const npcIds: string[] = [];
  const traces: NpcSeededTrace[] = [];
  const usedNpcNames = new Set<string>();

  for (const locationId of locationIds) {
    const locationNode = graph.getNode(locationId);
    if (!locationNode) continue;

    const subtype = (locationNode.properties.locationSubtype as string | undefined) ?? '';

    // Resolve roster key — undefined means unknown subtype, null means skip
    const rosterKey =
      subtype in SUBTYPE_TO_ROSTER_KEY ? SUBTYPE_TO_ROSTER_KEY[subtype] : null;
    if (rosterKey === null) continue;

    const roster = LOCATION_ROLE_ROSTERS[rosterKey];
    if (!roster || roster.length === 0) continue;

    const cap = ROSTER_KEY_TO_CAP[rosterKey] ?? 0;
    if (cap === 0) continue;

    // Find the culture for this location (prefer cultureLayer === 'current')
    const cultureEdges = graph.getOutgoingEdges(locationId, 'belongs_to');
    let cultureId: string | null = null;
    for (const edge of cultureEdges) {
      const layer = edge.properties.cultureLayer as string | undefined;
      if (layer === 'current') {
        cultureId = edge.target;
        break;
      }
    }
    // Fallback: any belongs_to edge if no 'current' layer found
    if (cultureId === null && cultureEdges.length > 0) {
      cultureId = cultureEdges[0].target;
    }

    // Faction for this location (optional)
    const factionId = factionLocationMap?.get(locationId) ?? null;

    // Build sublocation type → instance ID map for this location (fast lookup).
    // ensureSublocations() has already run before NPC seeding, so nodes exist.
    const sublocationByType = new Map<string, string>();
    for (const edge of graph.getOutgoingEdges(locationId, 'contains')) {
      const child = graph.getNode(edge.target);
      if (!child || child.type !== 'location') continue;
      const childProps = child.properties as Partial<SublocationProperties>;
      if (childProps.sublocationTypeId && childProps.parentLocationId === locationId) {
        sublocationByType.set(childProps.sublocationTypeId, child.id);
      }
    }

    let count = 0;
    for (const entry of roster) {
      if (count >= cap) break;
      if (rng() > entry.chance) continue;

      const id = `npc_${npcCounter++}`;

      // Culture-aware naming: resolve identity from the location's culture node
      let npcName: string;
      if (cultureId !== null) {
        const cultureNode = graph.getNode(cultureId);
        const identity = cultureNode?.properties.cultureIdentity as CultureIdentity | undefined;
        npcName = pickCulturalName(
          identity?.foundationBias ?? '',
          identity?.veneratedSpheres[0] ?? '',
          rng,
          usedNpcNames,
        );
      } else {
        npcName = pickCulturalName('', '', rng, usedNpcNames);
      }
      const name = npcName;

      // ── Create actor node ─────────────────────────────────────────────────
      graph.addNode({
        id,
        type: 'actor',
        name,
        properties: {
          actorType: 'individual',
          spotlightTier: 'ambient' as const,
          npcRole: entry.role,
          importance: 0,
          sphereAffinity: null,
        },
      });

      // ── located_at edge — prefer role's home sublocation, fallback to location ──
      const preferredSublocationTypeId = NPC_ROLE_SUBLOCATION_MAP[entry.role];
      const placementId =
        (preferredSublocationTypeId && sublocationByType.get(preferredSublocationTypeId))
        ?? locationId;

      graph.addEdge({
        id: `${id}_located_at_${placementId}`,
        source: id,
        target: placementId,
        type: 'located_at',
        properties: {},
      });

      // ── belongs_to culture edge ───────────────────────────────────────────
      if (cultureId !== null) {
        graph.addEdge({
          id: `edge_culture_${id}_${cultureId}`,
          source: id,
          target: cultureId,
          type: 'belongs_to',
          properties: { culturalStrength: 1.0 },
        });
      }

      // ── member_of faction edge (if location is mapped to a faction) ───────
      if (factionId !== null) {
        graph.addEdge({
          id: `${id}_member_of_${factionId}`,
          source: id,
          target: factionId,
          type: 'member_of',
          properties: {
            role: entry.role,
            rank: 0.1,
            joinedTick: 0,
          },
        });
      }

      npcIds.push(id);
      traces.push({
        type: 'npc_seeded',
        actorId: id,
        locationId,
        role: entry.role,
        factionId,
        tick: 0,
      });

      count++;
    }
  }

  return { npcIds, traces };
}
