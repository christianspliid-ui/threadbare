/**
 * Agent Detail Aggregator — Combines graph data into a single AgentDetail object
 * for the AgentDetailPanel component.
 */

import type { WorldGraph } from './graph';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { InfluenceTier } from '../types/influence';
import { TIER_NAMES } from '../types/influence';
import { getArchetype, type NarrativeArchetype } from '../data/archetype-content';

const VALUE_LABELS: Record<ValuePair, [string, string]> = {
  ambition_contentment: ['Ambitious', 'Content'],
  courage_prudence: ['Courageous', 'Prudent'],
  cruelty_compassion: ['Cruel', 'Compassionate'],
  cunning_honesty: ['Cunning', 'Honest'],
  devotion_independence: ['Devoted', 'Independent'],
  loyalty_treachery: ['Loyal', 'Treacherous'],
  tradition_innovation: ['Traditional', 'Innovative'],
  dominance_humility: ['Dominant', 'Humble'],
  wrath_patience: ['Wrathful', 'Patient'],
  greed_generosity: ['Greedy', 'Generous'],
};

export interface TopValue {
  pair: ValuePair;
  value: number;
  label: string;
}

export interface BondSummary {
  targetId: string;
  targetName: string;
  sentiment: number;
  strength: number;
  basis: string;
}

export interface AgentDetail {
  id: string;
  name: string;
  tier: InfluenceTier;
  tierName: string;
  locationId: string;
  locationName: string;
  factionName: string | null;
  archetype: NarrativeArchetype | null;
  profile: AxiologicalProfile;
  domainCapabilities: Record<ReachDomain, number>;
  topValues: TopValue[];
  topBonds: BondSummary[];
}

function intensityPrefix(absVal: number): string {
  if (absVal >= 0.8) return 'Deeply ';
  if (absVal >= 0.5) return '';
  return 'Somewhat ';
}

export function getAgentDetail(
  graph: WorldGraph,
  agentId: string,
  ascendantId: string,
): AgentDetail | null {
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return null;

  const props = agentNode.properties as Record<string, unknown>;

  const worshipsEdges = graph.getOutgoingEdges(agentId, 'worships');
  const worshipEdge = worshipsEdges.find(e => e.target === ascendantId);
  if (!worshipEdge) return null;

  const tier = (worshipEdge.properties as Record<string, unknown>).tier as InfluenceTier;
  const profile = (props.axiologicalProfile as AxiologicalProfile) || {} as AxiologicalProfile;
  const domainCapabilities = (props.domainCapabilities as Record<ReachDomain, number>) || {} as Record<ReachDomain, number>;
  const locationId = (props.locationId as string) || '';

  let locationName = '(unknown)';
  if (locationId) {
    const locNode = graph.getNode(locationId);
    if (locNode) locationName = locNode.name;
  }

  let factionName: string | null = null;
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  if (memberEdges.length > 0) {
    const facNode = graph.getNode(memberEdges[0].target);
    if (facNode) factionName = facNode.name;
  }

  const archetypeId = props.narrativeArchetype as string | undefined;
  const archetype = archetypeId ? getArchetype(archetypeId) ?? null : null;

  const valuePairs = Object.keys(profile) as ValuePair[];
  const sortedValues = valuePairs
    .map(pair => ({ pair, value: profile[pair] }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 3);

  const topValues: TopValue[] = sortedValues.map(({ pair, value }) => {
    const absVal = Math.abs(value);
    const [leftLabel, rightLabel] = VALUE_LABELS[pair] || [pair, pair];
    const label = value >= 0
      ? `${intensityPrefix(absVal)}${leftLabel}`
      : `${intensityPrefix(absVal)}${rightLabel}`;
    return { pair, value, label };
  });

  const relEdges = graph.getOutgoingEdges(agentId, 'relationship');
  const bonds: BondSummary[] = relEdges
    .map(edge => {
      const rProps = edge.properties as Record<string, unknown>;
      const targetNode = graph.getNode(edge.target);
      return {
        targetId: edge.target,
        targetName: targetNode?.name ?? '(unknown)',
        sentiment: (rProps.sentiment as number) ?? 0,
        strength: (rProps.strength as number) ?? 0,
        basis: (rProps.basis as string) ?? 'unknown',
      };
    })
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);

  return {
    id: agentId,
    name: agentNode.name,
    tier,
    tierName: TIER_NAMES[tier] || 'Unknown',
    locationId,
    locationName,
    factionName,
    archetype,
    profile,
    domainCapabilities,
    topValues,
    topBonds: bonds,
  };
}
