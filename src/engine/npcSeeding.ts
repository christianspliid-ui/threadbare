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
import { getFactionMembershipEdges } from './graphQueries';
import { isLocationNode, resolveToParentLocation } from './sublocationShape';
import { GENOME_NPC_TOPUP_CAP, GENOME_NPC_PASS_PRIORITY } from './settlementGenome/constants';
import type { GenomeResult } from './settlementGenome/types';
import {
  LOCATION_ROLE_ROSTERS,
  NPC_NAME_POOL,
  NPC_CONSTANTS,
  NPC_ROLE_SUBLOCATION_MAP,
  NPC_ROLE_REACH_MAP,
  type NpcRole,
  type RoleReachAffinity,
} from '../types/npc';
import { FACTION_DEFINITIONS } from '../data/faction-definitions';
import type { GraphNode } from '../types/graph';
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
  /**
   * Which producer minted this NPC (THR-1347). `roster` is the per-tier
   * `LOCATION_ROLE_ROSTERS` draw; `genome` is the settlement's own authored roster.
   * Optional so saved traces from before THR-1347 still read as valid.
   */
  source?: 'roster' | 'genome';
  /** For `source: 'genome'`, the genome pass that named this role. */
  sourcePass?: string;
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

/**
 * Faction-routing weights for `pickFactionForNpc` (THR-816).
 *
 * Before THR-816 the pick was `factions.find(n => n.factionType === preferredType)` —
 * the *first* matching faction in graph insertion order absorbed every NPC of that
 * affinity. Six definitions declare `factionType: 'guild'` and ten NPC roles prefer
 * `'guild'`, so wherever guilds shared a location the same one won every time and the
 * rest were seeded zero members. `builders_fellowship` lost every contest on seed 42
 * and all ten `bf.*` templates were unreachable as a result. Nothing failed; the loser
 * was simply never picked — the same positional-exclusion shape as THR-814's cap-stage
 * defect, and invisible for the same reason: no gate reported the absence.
 *
 * The replacement scores every equal-type candidate on merit (role reach fit, read from
 * data that already exists — `NPC_ROLE_REACH_MAP` × `FactionDefinition.reachWeights`)
 * and subtracts a load term so a faction that has already absorbed a large share stops
 * out-competing its emptier peers. No RNG: the pick is a pure function of graph state,
 * so it stays reproducible under a fixed seed (NFP #3).
 */
const FACTION_FIT_PRIMARY_REACH_WEIGHT = 1.0;
const FACTION_FIT_SECONDARY_REACH_WEIGHT = 0.5;

/**
 * How strongly an already-populous faction is penalised, in fit-score units.
 *
 * Applied against the candidate's share of the members already held across the whole
 * equal-type bracket, so it is scale-free: it does nothing when membership is even and
 * grows toward this value as one faction approaches a monopoly. Raise it to spread
 * membership harder, lower it to let reach fit dominate. Tuned so a strong fit
 * (~1.2 for a primary-reach match) still wins early, while a faction holding most of
 * the bracket concedes to a comparable peer (NFP #1).
 */
const FACTION_FIT_LOAD_PENALTY = 0.6;

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

// ─── Shared minting path ──────────────────────────────────────────────────────

interface MintNpcInput {
  graph: WorldGraph;
  /** The settlement the NPC belongs to — where the trace and faction edge anchor. */
  locationId: string;
  role: NpcRole;
  cultureId: string | null;
  /** sublocationTypeId → instance id, for role-preferred placement. */
  sublocationByType: Map<string, string>;
  factionId: string | null;
  rng: () => number;
  usedNpcNames: Set<string>;
  source: 'roster' | 'genome';
  sourcePass?: string;
}

/**
 * Create one ambient NPC actor node with its placement, culture and faction edges.
 *
 * Extracted in THR-1347 because worldgen now seeds NPCs from two rosters — the per-tier
 * `LOCATION_ROLE_ROSTERS` draw and the settlement's own genome roster. Two call sites
 * hand-copying node shape is how the two producers drift into minting subtly different
 * actors; one function is how they cannot. Every NPC in a generated world is born here.
 */
function mintNpc(input: MintNpcInput): { id: string; trace: NpcSeededTrace } {
  const {
    graph, locationId, role, cultureId, sublocationByType,
    factionId, rng, usedNpcNames, source, sourcePass,
  } = input;

  const id = `npc_${npcCounter++}`;

  // Culture-aware naming: resolve identity + phonetic signature from culture node (THR-15)
  let name: string;
  if (cultureId !== null) {
    const cultureNode = graph.getNode(cultureId);
    const identity = cultureNode?.properties.cultureIdentity as CultureIdentity | undefined;
    const sig = cultureNode?.properties.culturePhoneticSignature as CulturePhoneticSignature | undefined;
    name = pickCulturalName(
      identity?.foundationBias ?? '',
      identity?.veneratedSpheres[0] ?? '',
      rng,
      usedNpcNames,
      sig,
      cultureId,
      0,
    );
  } else {
    name = pickCulturalName('', '', rng, usedNpcNames);
  }

  graph.addNode({
    id,
    type: 'actor',
    name,
    properties: {
      actorType: 'individual',
      spotlightTier: 'ambient' as const,
      npcRole: role,
      importance: 0,
      sphereAffinity: null,
      // Provenance, stamped on the node rather than left only in a returned trace
      // (NFP #2). Mirrors `genomeSourcePass` on sublocation nodes, and it is what makes
      // "did the genome roster reach this world?" a question a generated graph can
      // answer — the field this ticket exists to fix could not be asked that way.
      npcSource: source,
      ...(sourcePass ? { genomeSourcePass: sourcePass } : {}),
    },
  });

  // ── located_at edge — prefer role's home sublocation, fallback to location ──
  const preferredSublocationTypeId = NPC_ROLE_SUBLOCATION_MAP[role];
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
        role,
        rank: 0.1,
        joinedTick: 0,
        reputation: 0.12,
        factionDefId: factionNode?.properties.factionDefId as string | undefined,
        lastFactionActivityTick: 0,
      },
    });
  }

  return {
    id,
    trace: {
      type: 'npc_seeded',
      actorId: id,
      locationId,
      role,
      factionId,
      tick: 0,
      source,
      ...(sourcePass ? { sourcePass } : {}),
    },
  };
}

/** sublocationTypeId → instance id for one settlement, for role-preferred placement. */
function buildSublocationIndex(graph: WorldGraph, locationId: string): Map<string, string> {
  const byType = new Map<string, string>();
  for (const edge of graph.getOutgoingEdges(locationId, 'contains')) {
    const child = graph.getNode(edge.target);
    if (!child || child.type !== 'location') continue;
    const childProps = child.properties as Partial<SublocationProperties>;
    if (childProps.sublocationTypeId && childProps.parentLocationId === locationId) {
      byType.set(childProps.sublocationTypeId, child.id);
    }
  }
  return byType;
}

/** The culture a location belongs to, preferring the `current` layer. */
function resolveLocationCulture(graph: WorldGraph, locationId: string): string | null {
  const cultureEdges = graph.getOutgoingEdges(locationId, 'belongs_to');
  for (const edge of cultureEdges) {
    if ((edge.properties.cultureLayer as string | undefined) === 'current') return edge.target;
  }
  return cultureEdges.length > 0 ? cultureEdges[0].target : null;
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

    const cultureId = resolveLocationCulture(graph, locationId);

    // Faction for this location (optional)
    const factionId = factionLocationMap?.get(locationId) ?? null;

    // Build sublocation type → instance ID map for this location (fast lookup).
    // ensureSublocations() has already run before NPC seeding, so nodes exist.
    const sublocationByType = buildSublocationIndex(graph, locationId);

    let count = 0;
    for (const entry of roster) {
      if (count >= cap) break;
      if (rng() > entry.chance) continue;

      const { id, trace } = mintNpc({
        graph, locationId, role: entry.role, cultureId, sublocationByType,
        factionId, rng, usedNpcNames, source: 'roster',
      });

      npcIds.push(id);
      traces.push(trace);

      count++;
    }
  }

  return { npcIds, traces };
}

// ─── Genome top-up (THR-1347) ─────────────────────────────────────────────────

/** Tiers whose settlements run the genome and therefore carry an authored roster. */
const GENOME_TIERS = new Set(['hamlet', 'town', 'city', 'capital']);

/**
 * Index every settlement by the NPC roles already standing in it — counting NPCs placed
 * at one of its sublocations as standing in the settlement, since that is where a role
 * actually lives once `NPC_ROLE_SUBLOCATION_MAP` has had its say.
 */
function indexRolesBySettlement(graph: WorldGraph): Map<string, Set<string>> {
  const byLocation = new Map<string, Set<string>>();
  for (const actor of graph.getNodesByType('actor')) {
    if (actor.properties.actorType !== 'individual') continue;
    const role = actor.properties.npcRole as string | undefined;
    if (!role) continue;
    const edge = graph.getOutgoingEdges(actor.id, 'located_at')[0];
    if (!edge) continue;
    const placement = resolveToParentLocation(graph, graph.getNode(edge.target));
    if (!placement) continue;
    let roles = byLocation.get(placement.id);
    if (!roles) byLocation.set(placement.id, (roles = new Set()));
    roles.add(role);
  }
  return byLocation;
}

/**
 * Seed the roles a settlement's own genome authored and its generic roster missed.
 *
 * This is the live consumer `GenomeResult.npcs` never had (THR-1347). `runSettlementGenome`
 * builds an NPC roster across four of its five passes and slices it to `NPC_BUDGET`;
 * before this function that roster was stored on the location and read by nobody, so
 * `INFRASTRUCTURE_NPCS`, every sphere and reach menu's `npcRoles`, every culture
 * baseline's `npcRoles` and every archetype's `capstoneNpcs` were authored content that
 * could not reach a world. Measured on seed 42 / medium: 38 settlements authored 417
 * distinct roles, 232 of which had no matching NPC at their own settlement.
 *
 * **Additive by construction (NFP #6).** It runs *after* `seedNpcsAtLocations`, removes
 * nothing it produced, and skips any role already standing at the settlement — so the
 * two producers cannot double-seed a role at one place. Call it with its own PRNG stream
 * so the base roster's draw stays bit-identical to what it was before this existed.
 *
 * **Must run after the genome's second worldgen pass.** The eager pass runs upstream of
 * culture assignment and faction seeding, so the roster stored at that point is missing
 * both the `culture` and `reach` contributions — on seed 42 that is 286 of 497 authored
 * slots, the majority. Reading the eager result would consume the field while leaving
 * most of the content it names just as unreachable.
 *
 * Deterministic (NFP #3): selection is a pure function of graph state — pass priority,
 * then the genome's own insertion order — and RNG is drawn only for names.
 */
export function seedGenomeNpcsAtSettlements(
  graph: WorldGraph,
  locationIds: string[],
  rng: () => number,
): SeedNpcsResult {
  const npcIds: string[] = [];
  const traces: NpcSeededTrace[] = [];

  // Seed the name pool with the names already in the world so a top-up NPC does not
  // arrive sharing a name with the roster NPC standing next to it.
  const usedNpcNames = new Set<string>(
    graph.getNodesByType('actor')
      .filter(a => a.properties.actorType === 'individual')
      .map(a => a.name),
  );

  const rolesBySettlement = indexRolesBySettlement(graph);

  for (const locationId of locationIds) {
    const locationNode = graph.getNode(locationId);
    if (!locationNode || !isLocationNode(locationNode)) continue;

    const subtype = (locationNode.properties.locationSubtype as string | undefined) ?? '';
    if (!GENOME_TIERS.has(subtype)) continue;

    const cap = GENOME_NPC_TOPUP_CAP[subtype] ?? 0;
    if (cap === 0) continue;

    const genome = locationNode.properties.genomeResult as GenomeResult | undefined;
    if (!genome || genome.npcs.length === 0) continue;

    const standing = rolesBySettlement.get(locationId) ?? new Set<string>();

    // Distinct authored roles this settlement is missing, best-identity-first.
    const missing: { role: NpcRole; sourcePass: string; order: number }[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < genome.npcs.length; i++) {
      const entry = genome.npcs[i];
      if (standing.has(entry.role) || seen.has(entry.role)) continue;
      seen.add(entry.role);
      missing.push({ role: entry.role, sourcePass: entry.sourcePass, order: i });
    }
    if (missing.length === 0) continue;

    missing.sort((a, b) => {
      const pa = GENOME_NPC_PASS_PRIORITY[a.sourcePass] ?? 0;
      const pb = GENOME_NPC_PASS_PRIORITY[b.sourcePass] ?? 0;
      return pb - pa || a.order - b.order;
    });

    const cultureId = resolveLocationCulture(graph, locationId);
    const sublocationByType = buildSublocationIndex(graph, locationId);

    for (const pick of missing.slice(0, cap)) {
      const { id, trace } = mintNpc({
        graph,
        locationId,
        role: pick.role,
        cultureId,
        sublocationByType,
        // Faction membership is left to `assignFactionsToExistingNpcs`, which runs after
        // this and routes on merit — a genome NPC has no location→faction mapping of its
        // own to consult, and inventing one here would give it a second, unequal path.
        factionId: null,
        rng,
        usedNpcNames,
        source: 'genome',
        sourcePass: pick.sourcePass,
      });

      npcIds.push(id);
      traces.push(trace);
      standing.add(pick.role);
    }
    rolesBySettlement.set(locationId, standing);
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

    const hasDataDrivenFaction = getFactionMembershipEdges(graph, actor.id)
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

/**
 * How well a faction suits a role, from the role's reach affinity.
 *
 * Reads `FactionDefinition.reachWeights` — the same per-reach weighting the template
 * pool already uses — so a mason (stone primary) scores high against the Builders'
 * Fellowship (`stone: 0.9`) and low against the Arcane Circle (`stone: 0.1`).
 *
 * Fail-soft (NFP #4): an unmapped role, a faction node with no `factionDefId`, or a
 * definition that has since been removed all score 0 rather than throwing. A bracket
 * where every candidate scores 0 degrades to a pure least-populated pick, which is
 * still strictly better than the positional first-match it replaced.
 */
function factionReachFitScore(
  factionNode: GraphNode,
  affinity: RoleReachAffinity | undefined,
): number {
  if (!affinity) return 0;

  const factionDefId = factionNode.properties.factionDefId as string | undefined;
  const weights = factionDefId ? FACTION_DEFINITIONS.get(factionDefId)?.reachWeights : undefined;
  if (!weights) return 0;

  return (weights[affinity.primary] ?? 0) * FACTION_FIT_PRIMARY_REACH_WEIGHT
    + (weights[affinity.secondary] ?? 0) * FACTION_FIT_SECONDARY_REACH_WEIGHT;
}

/**
 * Choose which of a location's factions an NPC joins.
 *
 * Two stages. The **type bracket** is unchanged from before THR-816: the role's
 * `ROLE_FACTION_AFFINITY` list is walked in order and the first preferred type with any
 * candidate present wins, so a guard still prefers political/military over a guild.
 * What changed is stage two — within that bracket the pick is now scored rather than
 * `[0]`, on reach fit minus a load term (see `FACTION_FIT_LOAD_PENALTY`).
 *
 * Deterministic by construction: no RNG, and ties break on faction id so the result is
 * a pure function of graph state (NFP #3). Callers mutate the graph between calls, so
 * the load term reflects members added earlier in the same seeding pass — that is what
 * makes the distribution self-balancing rather than merely fairer at the first pick.
 */
function pickFactionForNpc(
  graph: WorldGraph,
  role: NpcRole,
  factionIds: string[],
): string | null {
  const factions = factionIds
    .map(factionId => graph.getNode(factionId))
    .filter((node): node is NonNullable<typeof node> => node != null);
  if (factions.length === 0) return null;

  // Stage 1 — type bracket. Preserves the pre-THR-816 preference ordering.
  const preferredTypes = ROLE_FACTION_AFFINITY[role] ?? [];
  let bracket: typeof factions | null = null;
  for (const preferredType of preferredTypes) {
    const matches = factions.filter(node => node.properties.factionType === preferredType);
    if (matches.length > 0) {
      bracket = matches;
      break;
    }
  }
  const candidates = bracket ?? factions;
  if (candidates.length === 1) return candidates[0].id;

  // Stage 2 — score on merit, penalised by the share of the bracket already held.
  const affinity = NPC_ROLE_REACH_MAP[role] as RoleReachAffinity | undefined;
  const memberCounts = candidates.map(
    node => graph.getIncomingEdges(node.id, 'member_of').length,
  );
  const bracketMembers = memberCounts.reduce((sum, n) => sum + n, 0);

  let bestId = candidates[0].id;
  let bestScore = -Infinity;
  for (let i = 0; i < candidates.length; i++) {
    const node = candidates[i];
    // +1 keeps the divisor non-zero when the whole bracket is still empty.
    const loadShare = memberCounts[i] / (bracketMembers + 1);
    const score = factionReachFitScore(node, affinity) - FACTION_FIT_LOAD_PENALTY * loadShare;

    if (score > bestScore || (score === bestScore && node.id < bestId)) {
      bestScore = score;
      bestId = node.id;
    }
  }

  return bestId;
}
