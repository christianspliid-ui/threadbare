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
  type NpcRole,
} from '../types/npc';
import type { SublocationProperties } from '../types/sublocation';
import type { CultureIdentity, CulturePhoneticSignature } from '../types/culture';
import { pickCulturalName } from '../data/culture-name-pools';
import type { MemberOfEdgeProperties } from '../types/disposition';

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
  capital: 'capital',
  castle: 'capital',
  fort: 'military_outpost',
  camp: 'military_outpost',
  farmland: 'hamlet',
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
  capital: NPC_CONSTANTS.MAX_NPCS_CITY,
  temple: 3,
  military_outpost: 3,
  wilderness: 2,
};

const ROLE_FACTION_AFFINITY: Partial<Record<NpcRole, string[]>> = {
  guard: ['political', 'military'],
  guard_captain: ['political', 'military'],
  commander: ['military'],
  quartermaster: ['military', 'guild'],
  scout: ['military', 'guild'],
  noble: ['political'],
  steward: ['political'],
  herald: ['political'],
  attendant: ['political'],
  priest: ['religious'],
  acolyte: ['religious'],
  pilgrim: ['religious'],
  healer: ['religious', 'guild'],
  merchant: ['guild', 'criminal'],
  trader: ['guild'],
  clerk: ['guild'],
  appraiser: ['guild'],
  broker: ['guild', 'criminal'],
  scholar: ['guild', 'religious'],
  scribe: ['guild', 'religious'],
  librarian: ['guild', 'religious'],
  researcher: ['guild', 'religious'],
  smith: ['guild', 'military'],
  mason: ['guild'],
  brewer: ['guild'],
  innkeeper: ['guild', 'criminal'],
  lookout: ['criminal', 'military'],
  spy: ['criminal', 'political'],
  fence: ['criminal'],
  informant: ['criminal'],
  ranger: ['guild', 'military'],
  wanderer: ['guild'],
  elder: ['political', 'guild'],
};

const LEADERSHIP_REPUTATION_BY_ROLE: Partial<Record<NpcRole, number>> = {
  noble: 0.88,
  steward: 0.82,
  herald: 0.76,
  commander: 0.86,
  guard_captain: 0.74,
  priest: 0.72,
  merchant: 0.62,
  scholar: 0.62,
  smith: 0.58,
};

const LEADERSHIP_RANK_BY_ROLE: Partial<Record<NpcRole, number>> = {
  noble: 0.95,
  steward: 0.82,
  herald: 0.7,
  commander: 0.9,
  guard_captain: 0.76,
  priest: 0.7,
  merchant: 0.58,
  scholar: 0.58,
  smith: 0.52,
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

      // Culture-aware naming: resolve identity + phonetic signature from culture node (THR-15)
      let npcName: string;
      if (cultureId !== null) {
        const cultureNode = graph.getNode(cultureId);
        const identity = cultureNode?.properties.cultureIdentity as CultureIdentity | undefined;
        const sig = cultureNode?.properties.culturePhoneticSignature as CulturePhoneticSignature | undefined;
        npcName = pickCulturalName(
          identity?.foundationBias ?? '',
          identity?.veneratedSpheres[0] ?? '',
          rng,
          usedNpcNames,
          sig,
          cultureId,
          0,
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
        const factionNode = graph.getNode(factionId);
        graph.addEdge({
          id: `${id}_member_of_${factionId}`,
          source: id,
          target: factionId,
          type: 'member_of',
          properties: {
            role: entry.role,
            rank: 0.1,
            joinedTick: 0,
            reputation: 0.12,
            factionDefId: factionNode?.properties.factionDefId as string | undefined,
            lastFactionActivityTick: 0,
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

export function assignFactionsToExistingNpcs(
  graph: WorldGraph,
  locationFactionMap: Map<string, string[]>,
): void {
  if (locationFactionMap.size === 0) return;

  for (const actor of graph.getNodesByType('actor')) {
    if (actor.properties.actorType !== 'individual') continue;
    const npcRole = actor.properties.npcRole as NpcRole | undefined;
    if (!npcRole) continue;

    const hasDataDrivenFaction = graph.getOutgoingEdges(actor.id, 'member_of')
      .some(edge => (edge.properties.factionDefId as string | undefined) != null);
    if (hasDataDrivenFaction) continue;

    const locationEdge = graph.getOutgoingEdges(actor.id, 'located_at')[0];
    if (!locationEdge) continue;

    const locationNode = graph.getNode(locationEdge.target);
    const locationId = (locationNode?.properties.parentLocationId as string | undefined) ?? locationEdge.target;
    const factionIds = locationFactionMap.get(locationId) ?? [];
    if (factionIds.length === 0) continue;

    const factionId = pickFactionForNpc(graph, npcRole, factionIds);
    if (!factionId) continue;

    const factionNode = graph.getNode(factionId);
    if (!factionNode) continue;

    graph.addEdge({
      id: `${actor.id}_member_of_${factionId}`,
      source: actor.id,
      target: factionId,
      type: 'member_of',
      properties: {
        role: npcRole,
        rank: LEADERSHIP_RANK_BY_ROLE[npcRole] ?? 0.16,
        joinedTick: 0,
        reputation: LEADERSHIP_REPUTATION_BY_ROLE[npcRole] ?? 0.22,
        factionDefId: factionNode.properties.factionDefId as string | undefined,
        lastFactionActivityTick: 0,
      } satisfies MemberOfEdgeProperties,
    });
  }
}

function pickFactionForNpc(
  graph: WorldGraph,
  role: NpcRole,
  factionIds: string[],
): string | null {
  const preferredTypes = ROLE_FACTION_AFFINITY[role] ?? [];
  const factions = factionIds
    .map(factionId => graph.getNode(factionId))
    .filter((node): node is NonNullable<typeof node> => node != null);

  for (const preferredType of preferredTypes) {
    const match = factions.find(node => node.properties.factionType === preferredType);
    if (match) return match.id;
  }

  return factions[0]?.id ?? null;
}
