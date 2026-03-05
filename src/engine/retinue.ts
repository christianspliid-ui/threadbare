/**
 * Retinue Data Helpers — Pure functions that extract retinue data from the graph.
 *
 * The retinue is the list of all agents influenced by an ascendant (the player's god),
 * filtered to those with influence tier >= 1.
 */

import type { WorldGraph } from './graph';
import type { AxiologicalProfile } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { InfluenceTier, InfluenceRelationshipProperties } from '../types/influence';
import { TIER_NAMES } from '../types/influence';

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
}

/**
 * Query all influenced agents of an ascendant with tier >= 1.
 *
 * Returns agents sorted by:
 * 1. Tier descending (highest influence first)
 * 2. Name ascending (alphabetical as tiebreaker)
 */
export function getRetinueAgents(graph: WorldGraph, ascendantId: string): RetinueAgent[] {
  // Get all incoming 'worships' edges to the ascendant
  const worshipsEdges = graph.getIncomingEdges(ascendantId, 'worships');

  const retinueAgents: RetinueAgent[] = [];

  for (const edge of worshipsEdges) {
    const agentId = edge.source;
    const agentNode = graph.getNode(agentId);

    if (!agentNode) continue;

    // Get influence properties from the edge
    const influenceProps = edge.properties as unknown as InfluenceRelationshipProperties;
    const tier = influenceProps.tier as InfluenceTier;

    // Filter: only include tier >= 1 (exclude tier 0 "Unaware")
    if (tier === 0) continue;

    // Extract agent properties
    const agentProps = agentNode.properties as Record<string, unknown>;
    const locationId = agentProps.locationId as string | undefined;
    const profile = agentProps.axiologicalProfile as AxiologicalProfile;
    const domainCapabilities = agentProps.domainCapabilities as Record<ReachDomain, number>;

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
