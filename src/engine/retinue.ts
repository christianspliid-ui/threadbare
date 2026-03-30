/**
 * Retinue Data Helpers — Pure functions that extract retinue data from the graph.
 *
 * The retinue is the list of all agents influenced by an ascendant (the player's god),
 * filtered to those with influence tier >= 1.
 */

import type { WorldGraph } from './graph';
import type { AxiologicalProfile } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { InfluenceTier, ThreadEdgeProperties, CourtPosition } from '../types/influence';
import { TIER_NAMES } from '../types/influence';
import { getPortraitUrl } from '../data/portrait-assets';

/**
 * A single agent in the ascendant's retinue, with extracted data ready for UI rendering.
 */
export interface RetinueAgent {
  /** Agent node ID */
  id: string;

  /** Agent display name */
  name: string;

  /** Current influence tier (1-4, excluding 0) */
  tier: InfluenceTier;

  /** Human-readable tier name (e.g., "Touched", "Devoted") */
  tierName: string;

  /** Location node ID where agent is situated */
  locationId: string;

  /** Location display name */
  locationName: string;

  /** Agent's axiological profile */
  profile: AxiologicalProfile;

  /** Agent's domain capabilities (raw scores) */
  domainCapabilities: Record<ReachDomain, number>;

  /** Faction name if agent is a faction member, null otherwise */
  factionName: string | null;

  /** Agent's narrative archetype ID (e.g., 'tragic_hero', 'seeker') */
  archetypeId: string | null;

  /** Portrait image URL resolved from archetype, or null */
  portraitUrl: string | null;

  /** Agent's primary domain (highest capability) for visual coloring */
  primaryDomain: ReachDomain | null;

  /** Current activity label for sidebar display (e.g., "Idling", "Going to Thornwall", "Explore (2/3)") */
  activityLabel: string;

  /** Court position (the_first, retinue, watched) */
  courtPosition: import('../types/influence').CourtPosition | null;

  /** Attention mode — 'pause' interrupts the game, 'auto_resolve' does not */
  attentionMode: 'pause' | 'auto_resolve';

  /** Thread edge ID — needed for toggling attention mode */
  threadEdgeId: string;
}

/**
 * Query all influenced agents of an ascendant with tier >= 1.
 *
 * Returns agents sorted by:
 * 1. Tier descending (highest influence first)
 * 2. Name ascending (alphabetical as tiebreaker)
 */
export function getRetinueAgents(graph: WorldGraph, ascendantId: string): RetinueAgent[] {
  // Get all outgoing 'thread' edges from the ascendant (god→mortal)
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');

  const retinueAgents: RetinueAgent[] = [];

  for (const edge of threadEdges) {
    const agentId = edge.target;
    const agentNode = graph.getNode(agentId);

    if (!agentNode) continue;

    // Get influence properties from the edge
    const influenceProps = edge.properties as unknown as ThreadEdgeProperties;
    const tier = influenceProps.tier as InfluenceTier;

    // Filter: only include tier >= 1 (exclude tier 0 "Unaware")
    if (tier === 0) continue;

    // Extract agent properties
    const agentProps = agentNode.properties as Record<string, unknown>;
    const profile = agentProps.axiologicalProfile as AxiologicalProfile;
    const domainCapabilities = agentProps.domainCapabilities as Record<ReachDomain, number>;

    // Resolve location via located_at edge (authoritative), fallback to legacy property
    const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
    const locationId = locEdges.length > 0
      ? locEdges[0].target
      : (agentProps.locationId as string | undefined);

    // Look up location name
    let locationName = '(unknown)';
    if (locationId) {
      const locationNode = graph.getNode(locationId);
      if (locationNode) {
        locationName = locationNode.name;
      }
    }

    // Look up faction membership
    let factionName: string | null = null;
    const memberOfEdges = graph.getOutgoingEdges(agentId, 'member_of');
    if (memberOfEdges.length > 0) {
      // Take first faction membership (agents typically have at most one)
      const factionId = memberOfEdges[0].target;
      const factionNode = graph.getNode(factionId);
      if (factionNode) {
        factionName = factionNode.name;
      }
    }

    // Extract archetype and portrait (agents store archetype as 'narrativeArchetype')
    const archetypeId = (agentProps.narrativeArchetype as string) ?? null;
    const portraitUrl = getPortraitUrl(archetypeId ?? undefined);

    // Derive primary domain from highest capability
    let primaryDomain: ReachDomain | null = null;
    if (domainCapabilities) {
      let bestValue = -1;
      for (const [domain, value] of Object.entries(domainCapabilities)) {
        if (value > bestValue) {
          bestValue = value;
          primaryDomain = domain as ReachDomain;
        }
      }
    }

    retinueAgents.push({
      id: agentId,
      name: agentNode.name,
      tier,
      tierName: TIER_NAMES[tier],
      locationId: locationId || '(unknown)',
      locationName,
      profile,
      domainCapabilities,
      factionName,
      archetypeId,
      portraitUrl,
      primaryDomain,
      activityLabel: 'Idling',
      courtPosition: (influenceProps.courtPosition as import('../types/influence').CourtPosition) ?? null,
      attentionMode: (influenceProps.attentionMode as 'pause' | 'auto_resolve') ?? 'auto_resolve',
      threadEdgeId: edge.id,
    });
  }

  // Sort: tier descending, then name ascending
  retinueAgents.sort((a, b) => {
    // First by tier descending
    if (a.tier !== b.tier) {
      return b.tier - a.tier;
    }
    // Then by name ascending
    return a.name.localeCompare(b.name);
  });

  return retinueAgents;
}

// ─── ThreadedNodes — Full thread query for all node types ─────────────────────

/**
 * Category of a threaded node — one of 5 displayable entity types.
 */
export type ThreadCategory = 'agent' | 'location' | 'faction' | 'army' | 'artifact';

/**
 * Base fields shared by all threaded node entries.
 */
export interface ThreadedNodeBase {
  id: string;
  name: string;
  tier: InfluenceTier;
  tierName: string;
  category: ThreadCategory;
  threadEdgeId: string;
  attentionMode: 'pause' | 'auto_resolve';
  courtPosition: CourtPosition | null;
}

export interface ThreadedAgent extends ThreadedNodeBase {
  category: 'agent';
  locationId: string;
  locationName: string;
  activityLabel: string;
  portraitUrl: string | null;
  primaryDomain: ReachDomain | null;
  factionName: string | null;
}

export interface ThreadedLocation extends ThreadedNodeBase {
  category: 'location';
  hexCol: number;
  hexRow: number;
  prosperityLabel: string;
  controllingFaction: string | null;
}

export interface ThreadedFaction extends ThreadedNodeBase {
  category: 'faction';
  dominantSphere: string | null;
  territoryCount: number;
  memberCount: number;
}

export interface ThreadedArmy extends ThreadedNodeBase {
  category: 'army';
  size: number;
  objective: string;
  factionName: string | null;
  locationName: string;
}

export interface ThreadedArtifact extends ThreadedNodeBase {
  category: 'artifact';
  bearerName: string | null;
  locationName: string | null;
}

export type ThreadedNode =
  | ThreadedAgent
  | ThreadedLocation
  | ThreadedFaction
  | ThreadedArmy
  | ThreadedArtifact;

/**
 * Resolve the dominant sphere name for a faction from its territory sphere data.
 * Falls back to the faction node's own sphereAlignment or dominantSphere property.
 * Returns null if no sphere data is found.
 */
function resolveFactionDominantSphere(graph: WorldGraph, factionNodeId: string): string | null {
  // Check if the faction node has explicit sphere data
  const factionNode = graph.getNode(factionNodeId);
  if (!factionNode) return null;

  const props = factionNode.properties as Record<string, unknown>;

  // Try direct dominantSphere property
  if (typeof props.dominantSphere === 'string') {
    return props.dominantSphere;
  }

  // Try sphereAlignment (AscendantProperties pattern)
  const sphereAlignment = props.sphereAlignment as Record<string, string> | undefined;
  if (sphereAlignment?.primary) {
    return sphereAlignment.primary;
  }

  // Try sphereAffinity scores — find highest scoring sphere
  const sphereAffinity = props.sphereAffinity as { scores?: Record<string, number> } | undefined;
  if (sphereAffinity?.scores) {
    let bestSphere: string | null = null;
    let bestScore = -1;
    for (const [sphere, score] of Object.entries(sphereAffinity.scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestSphere = sphere;
      }
    }
    if (bestSphere && bestScore > 0) {
      return bestSphere;
    }
  }

  // Aggregate from territory: get outgoing 'controls' edges to location nodes
  const controlsEdges = graph.getOutgoingEdges(factionNodeId, 'controls');
  const sphereTally: Record<string, number> = {};

  for (const edge of controlsEdges) {
    const locNode = graph.getNode(edge.target);
    if (!locNode || locNode.type !== 'location') continue;

    const locProps = locNode.properties as Record<string, unknown>;
    const locSphereAffinity = locProps.sphereAffinity as { scores?: Record<string, number> } | undefined;
    if (!locSphereAffinity?.scores) continue;

    for (const [sphere, score] of Object.entries(locSphereAffinity.scores)) {
      if (score > 0) {
        sphereTally[sphere] = (sphereTally[sphere] ?? 0) + score;
      }
    }
  }

  let dominantSphere: string | null = null;
  let highestTotal = 0;
  for (const [sphere, total] of Object.entries(sphereTally)) {
    if (total > highestTotal) {
      highestTotal = total;
      dominantSphere = sphere;
    }
  }

  return dominantSphere;
}

/**
 * Derive prosperity label from a prosperity score (0-100).
 */
function deriveProsperityLabel(score: unknown): string {
  const num = typeof score === 'number' ? score : 0;
  if (num >= 70) return 'Prosperous';
  if (num >= 40) return 'Stable';
  if (num >= 10) return 'Struggling';
  return 'Destitute';
}

/**
 * Query all thread targets for an ascendant, categorized by node type.
 *
 * Returns all ThreadedNode entries with tier >= 1, sorted by:
 * 1. Tier descending (highest influence first)
 * 2. Name ascending (alphabetical as tiebreaker)
 *
 * Skips: tier 0, null nodes, god/culture/ascendant actor types, and
 * group actors without armyState.
 */
export function getThreadedNodes(graph: WorldGraph, ascendantId: string): ThreadedNode[] {
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  const results: ThreadedNode[] = [];

  for (const edge of threadEdges) {
    const targetNode = graph.getNode(edge.target);
    if (!targetNode) continue;

    const influenceProps = edge.properties as unknown as ThreadEdgeProperties;
    const tier = influenceProps.tier as InfluenceTier;

    // Exclude tier 0 (unaware)
    if (tier === 0) continue;

    const nodeProps = targetNode.properties as Record<string, unknown>;
    const tierName = TIER_NAMES[tier];
    const attentionMode = (influenceProps.attentionMode as 'pause' | 'auto_resolve') ?? 'auto_resolve';
    const courtPosition = (influenceProps.courtPosition as CourtPosition) ?? null;

    const base: ThreadedNodeBase = {
      id: targetNode.id,
      name: targetNode.name,
      tier,
      tierName,
      category: 'agent', // placeholder, overridden per branch
      threadEdgeId: edge.id,
      attentionMode,
      courtPosition,
    };

    // ── Classify by node type ──────────────────────────────────────

    if (targetNode.type === 'actor') {
      const actorType = nodeProps.actorType as string;

      if (actorType === 'individual') {
        // Agent
        const locEdges = graph.getOutgoingEdges(targetNode.id, 'located_at');
        const locationId = locEdges.length > 0
          ? locEdges[0].target
          : (nodeProps.locationId as string | undefined);

        let locationName = '(unknown)';
        if (locationId) {
          const locNode = graph.getNode(locationId);
          if (locNode) locationName = locNode.name;
        }

        const memberOfEdges = graph.getOutgoingEdges(targetNode.id, 'member_of');
        let factionName: string | null = null;
        if (memberOfEdges.length > 0) {
          const factionNode = graph.getNode(memberOfEdges[0].target);
          if (factionNode) factionName = factionNode.name;
        }

        const archetypeId = (nodeProps.narrativeArchetype as string) ?? null;
        const portraitUrl = getPortraitUrl(archetypeId ?? undefined);

        const domainCapabilities = nodeProps.domainCapabilities as Record<ReachDomain, number> | undefined;
        let primaryDomain: ReachDomain | null = null;
        if (domainCapabilities) {
          let bestValue = -1;
          for (const [domain, value] of Object.entries(domainCapabilities)) {
            if (value > bestValue) {
              bestValue = value;
              primaryDomain = domain as ReachDomain;
            }
          }
        }

        results.push({
          ...base,
          category: 'agent',
          locationId: locationId || '(unknown)',
          locationName,
          activityLabel: 'Idling',
          portraitUrl,
          primaryDomain,
          factionName,
        } as ThreadedAgent);

      } else if (actorType === 'faction') {
        // Faction
        const controlsEdges = graph.getOutgoingEdges(targetNode.id, 'controls');
        const territoryCount = controlsEdges.filter(e => {
          const n = graph.getNode(e.target);
          return n?.type === 'location';
        }).length;

        const memberEdges = graph.getIncomingEdges(targetNode.id, 'member_of');
        const memberCount = memberEdges.length;

        const dominantSphere = resolveFactionDominantSphere(graph, targetNode.id);

        results.push({
          ...base,
          category: 'faction',
          dominantSphere,
          territoryCount,
          memberCount,
        } as ThreadedFaction);

      } else if (actorType === 'group') {
        // Only include groups with armyState (armies)
        const armyState = nodeProps.armyState as { size?: number; objective?: string } | null | undefined;
        if (!armyState) continue; // skip non-army groups

        const locEdges = graph.getOutgoingEdges(targetNode.id, 'located_at');
        let locationName = '(unknown)';
        if (locEdges.length > 0) {
          const locNode = graph.getNode(locEdges[0].target);
          if (locNode) locationName = locNode.name;
        }

        const memberOfEdges = graph.getOutgoingEdges(targetNode.id, 'member_of');
        let factionName: string | null = null;
        if (memberOfEdges.length > 0) {
          const factionNode = graph.getNode(memberOfEdges[0].target);
          if (factionNode) factionName = factionNode.name;
        }

        results.push({
          ...base,
          category: 'army',
          size: armyState.size ?? 0,
          objective: armyState.objective ?? 'Standing',
          factionName,
          locationName,
        } as ThreadedArmy);

      }
      // Skip god, culture, ascendant actor types

    } else if (targetNode.type === 'location') {
      // Location
      const hexCol = (nodeProps.hexCol as number) ?? 0;
      const hexRow = (nodeProps.hexRow as number) ?? 0;
      const prosperityLabel = deriveProsperityLabel(nodeProps.prosperityScore);

      // Find controlling faction via incoming 'controls' edges from faction actors
      let controllingFaction: string | null = null;
      const controlledByEdges = graph.getIncomingEdges(targetNode.id, 'controls');
      for (const controlEdge of controlledByEdges) {
        const controllerNode = graph.getNode(controlEdge.source);
        if (
          controllerNode?.type === 'actor' &&
          (controllerNode.properties as Record<string, unknown>).actorType === 'faction'
        ) {
          controllingFaction = controllerNode.name;
          break;
        }
      }

      results.push({
        ...base,
        category: 'location',
        hexCol,
        hexRow,
        prosperityLabel,
        controllingFaction,
      } as ThreadedLocation);

    } else if (targetNode.type === 'artifact' || targetNode.type === 'artifact_legendary') {
      // Artifact — find bearer via possesses or bonded_to incoming edges
      let bearerName: string | null = null;
      let locationName: string | null = null;

      const possessesEdges = graph.getIncomingEdges(targetNode.id, 'possesses');
      if (possessesEdges.length > 0) {
        const bearerNode = graph.getNode(possessesEdges[0].source);
        if (bearerNode) bearerName = bearerNode.name;
      }

      if (!bearerName) {
        const bondedEdges = graph.getIncomingEdges(targetNode.id, 'bonded_to');
        if (bondedEdges.length > 0) {
          const bearerNode = graph.getNode(bondedEdges[0].source);
          if (bearerNode) bearerName = bearerNode.name;
        }
      }

      if (!bearerName) {
        // Check located_at for artifact location
        const locEdges = graph.getOutgoingEdges(targetNode.id, 'located_at');
        if (locEdges.length > 0) {
          const locNode = graph.getNode(locEdges[0].target);
          if (locNode) locationName = locNode.name;
        }
      }

      results.push({
        ...base,
        category: 'artifact',
        bearerName,
        locationName,
      } as ThreadedArtifact);

    }
    // Skip other node types (resource, action_template, event, cosmology, region, ambition)
  }

  // Sort: tier descending, then name ascending
  results.sort((a, b) => {
    if (a.tier !== b.tier) return b.tier - a.tier;
    return a.name.localeCompare(b.name);
  });

  return results;
}

/**
 * Group a flat ThreadedNode[] into a Record keyed by ThreadCategory.
 * Each category array maintains the sort order of the input.
 */
export function groupThreadedNodes(nodes: ThreadedNode[]): Record<ThreadCategory, ThreadedNode[]> {
  const groups: Record<ThreadCategory, ThreadedNode[]> = {
    agent: [],
    location: [],
    faction: [],
    army: [],
    artifact: [],
  };
  for (const node of nodes) {
    groups[node.category].push(node);
  }
  return groups;
}
