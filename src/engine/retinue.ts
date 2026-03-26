/**
 * Retinue Data Helpers — Pure functions that extract retinue data from the graph.
 *
 * The retinue is the list of all agents influenced by an ascendant (the player's god),
 * filtered to those with influence tier >= 1.
 */

import type { WorldGraph } from './graph';
import type { AxiologicalProfile } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { InfluenceTier, ThreadEdgeProperties } from '../types/influence';
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
