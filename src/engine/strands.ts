/**
 * Strand Data Extractors
 *
 * Pure functions that extract strand data (psyche aspects) from graph state for a specific agent.
 * Each strand represents a different dimension of an agent's consciousness and situation.
 *
 * The six strands are:
 * - Presence: Where the agent is and their domain mastery
 * - Desires: What they want (greed/generosity, cruelty/compassion, wrath/patience)
 * - Bonds: Their relationships and allegiances
 * - Ambitions: Their goals and drive (ambition, dominance, courage)
 * - Beliefs: Their principles (tradition, cunning, devotion)
 * - Fears: Their shadows (derived from strong opposing values)
 */

import type { WorldGraph } from './graph';
import type { ValuePair, AxiologicalProfile } from '../types/agent';
import type { ReachDomain } from '../types/traits';

// ============================================================================
// TYPES
// ============================================================================

export interface ValueInsight {
  valuePair: ValuePair;
  value: number;
  label: string;
  description: string;
}

export interface RelationshipInfo {
  targetId: string;
  targetName: string;
  sentiment: number; // -1 to 1
  strength: number; // 0 to 1
  basis: string; // 'friendship', 'rivalry', etc.
}

export interface FactionInfo {
  id: string;
  name: string;
  role: string;
}

export interface DomainRank {
  domain: string;
  score: number;
}

export interface PresenceStrandData {
  strandName: 'Presence';
  locationName: string;
  locationId: string;
  topDomains: DomainRank[]; // top 3 by score
  companions: Array<{ id: string; name: string }>; // other actors at same location
}

export interface DesiresStrandData {
  strandName: 'Desires';
  insights: ValueInsight[]; // from greed_generosity, cruelty_compassion, wrath_patience
}

export interface BondsStrandData {
  strandName: 'Bonds';
  relationships: RelationshipInfo[]; // from relates_to edges
  factions: FactionInfo[]; // from member_of edges
  insights: ValueInsight[]; // from loyalty_treachery, devotion_independence
}

export interface AmbitionsStrandData {
  strandName: 'Ambitions';
  insights: ValueInsight[]; // from ambition_contentment, dominance_humility, courage_prudence
}

export interface BeliefsStrandData {
  strandName: 'Beliefs';
  insights: ValueInsight[]; // from tradition_innovation, cunning_honesty, devotion_independence
}

export interface FearsStrandData {
  strandName: 'Fears';
  insights: ValueInsight[]; // derived from shadow side of strong values (|v| > 0.3)
}

export type StrandData =
  | PresenceStrandData
  | DesiresStrandData
  | BondsStrandData
  | AmbitionsStrandData
  | BeliefsStrandData
  | FearsStrandData;

// ============================================================================
// CONSTANTS
// ============================================================================

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

const FEAR_DESCRIPTIONS: Record<ValuePair, [string, string]> = {
  ambition_contentment: ['Fears irrelevance and failure', 'Fears being forced to strive'],
  courage_prudence: ['Fears showing weakness', 'Fears reckless consequences'],
  cruelty_compassion: ['Fears vulnerability', 'Fears becoming heartless'],
  cunning_honesty: ['Fears being outwitted', 'Fears having to deceive'],
  devotion_independence: ['Fears abandonment by their cause', 'Fears losing freedom'],
  loyalty_treachery: ['Fears betrayal by those they trust', 'Fears being bound by loyalty'],
  tradition_innovation: ['Fears the loss of the old ways', 'Fears stagnation'],
  dominance_humility: ['Fears losing control', 'Fears being forced to dominate'],
  wrath_patience: ['Fears being powerless to act', 'Fears losing their temper'],
  greed_generosity: ['Fears poverty and scarcity', 'Fears becoming selfish'],
};

// Strand categorizations
const DESIRES_PAIRS: ValuePair[] = [
  'greed_generosity',
  'cruelty_compassion',
  'wrath_patience',
];

const BONDS_PAIRS: ValuePair[] = ['loyalty_treachery', 'devotion_independence'];

const AMBITIONS_PAIRS: ValuePair[] = [
  'ambition_contentment',
  'dominance_humility',
  'courage_prudence',
];

const BELIEFS_PAIRS: ValuePair[] = [
  'tradition_innovation',
  'cunning_honesty',
  'devotion_independence',
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get intensity label based on absolute value
 * Intensity: |v| > 0.7 = "Deeply", > 0.3 = "Notably", else "Slightly"
 */
function getIntensity(absValue: number): string {
  if (absValue > 0.7) return 'Deeply';
  if (absValue > 0.3) return 'Notably';
  return 'Slightly';
}

/**
 * Extract a single value insight from axiological profile
 */
function extractInsight(profile: AxiologicalProfile, valuePair: ValuePair): ValueInsight {
  const value = profile[valuePair];
  const absValue = Math.abs(value);
  const [positiveLabel, negativeLabel] = VALUE_LABELS[valuePair];
  const label = value >= 0 ? positiveLabel : negativeLabel;
  const intensity = getIntensity(absValue);
  const description = `${intensity} ${label.toLowerCase()}`;

  return {
    valuePair,
    value,
    label,
    description,
  };
}

/**
 * Extract multiple value insights, sorted by |value| descending
 */
function extractInsights(
  profile: AxiologicalProfile,
  valuePairs: ValuePair[]
): ValueInsight[] {
  const insights = valuePairs.map(pair => extractInsight(profile, pair));
  insights.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return insights;
}

/**
 * Get axiological profile from agent node, with fallback to zeros
 */
function getAxiologicalProfile(graph: WorldGraph, agentId: string): AxiologicalProfile {
  const agent = graph.getNode(agentId);
  if (!agent) {
    return {
      ambition_contentment: 0,
      courage_prudence: 0,
      cruelty_compassion: 0,
      cunning_honesty: 0,
      devotion_independence: 0,
      loyalty_treachery: 0,
      tradition_innovation: 0,
      dominance_humility: 0,
      wrath_patience: 0,
      greed_generosity: 0,
    };
  }

  const profile = agent.properties.axiologicalProfile as AxiologicalProfile | undefined;
  return (
    profile || {
      ambition_contentment: 0,
      courage_prudence: 0,
      cruelty_compassion: 0,
      cunning_honesty: 0,
      devotion_independence: 0,
      loyalty_treachery: 0,
      tradition_innovation: 0,
      dominance_humility: 0,
      wrath_patience: 0,
      greed_generosity: 0,
    }
  );
}

/**
 * Get domain capabilities from agent node, with fallback to zeros
 */
function getDomainCapabilities(graph: WorldGraph, agentId: string): Record<string, number> {
  const agent = graph.getNode(agentId);
  if (!agent) return {};

  const caps = agent.properties.domainCapabilities as Record<string, number> | undefined;
  return caps || {};
}

// ============================================================================
// STRAND EXTRACTORS
// ============================================================================

/**
 * Extract Presence strand: location, domain mastery, companions
 */
export function getPresenceStrand(graph: WorldGraph, agentId: string): PresenceStrandData {
  const agent = graph.getNode(agentId);
  if (!agent) {
    return {
      strandName: 'Presence',
      locationName: '',
      locationId: '',
      topDomains: [],
      companions: [],
    };
  }

  const locationId = (agent.properties.locationId as string) || '';
  let locationName = '';

  if (locationId) {
    const locationNode = graph.getNode(locationId);
    locationName = locationNode?.name || '';
  }

  // Get domain capabilities and sort for top 3
  const capabilities = getDomainCapabilities(graph, agentId);
  const topDomains: DomainRank[] = Object.entries(capabilities)
    .map(([domain, score]) => ({ domain, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Find companions at same location
  const companions: Array<{ id: string; name: string }> = [];
  if (locationId) {
    const locatedAtEdges = graph.getIncomingEdges(locationId, 'located_at');
    for (const edge of locatedAtEdges) {
      const companion = graph.getNode(edge.source);
      if (companion && edge.source !== agentId) {
        companions.push({
          id: companion.id,
          name: companion.name,
        });
      }
    }
  }

  return {
    strandName: 'Presence',
    locationName,
    locationId,
    topDomains,
    companions,
  };
}

/**
 * Extract Desires strand: greed/generosity, cruelty/compassion, wrath/patience
 */
export function getDesiresStrand(graph: WorldGraph, agentId: string): DesiresStrandData {
  const profile = getAxiologicalProfile(graph, agentId);
  const insights = extractInsights(profile, DESIRES_PAIRS);

  return {
    strandName: 'Desires',
    insights,
  };
}

/**
 * Extract Bonds strand: relationships, factions, loyalty/treachery & devotion/independence
 */
export function getBondsStrand(graph: WorldGraph, agentId: string): BondsStrandData {
  const profile = getAxiologicalProfile(graph, agentId);

  // Extract relationships from relates_to edges
  const relationships: RelationshipInfo[] = [];
  const relatesEdges = graph.getOutgoingEdges(agentId, 'relates_to');
  for (const edge of relatesEdges) {
    const targetNode = graph.getNode(edge.target);
    if (targetNode) {
      relationships.push({
        targetId: targetNode.id,
        targetName: targetNode.name,
        sentiment: (edge.properties.sentiment as number) || 0,
        strength: (edge.properties.strength as number) || 0,
        basis: (edge.properties.basis as string) || '',
      });
    }
  }

  // Sort relationships by strength descending
  relationships.sort((a, b) => b.strength - a.strength);

  // Extract faction membership from member_of edges
  const factions: FactionInfo[] = [];
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  for (const edge of memberEdges) {
    const factionNode = graph.getNode(edge.target);
    if (factionNode) {
      factions.push({
        id: factionNode.id,
        name: factionNode.name,
        role: (edge.properties.role as string) || '',
      });
    }
  }

  // Extract bond-relevant values
  const insights = extractInsights(profile, BONDS_PAIRS);

  return {
    strandName: 'Bonds',
    relationships,
    factions,
    insights,
  };
}

/**
 * Extract Ambitions strand: ambition/contentment, dominance/humility, courage/prudence
 */
export function getAmbitionsStrand(graph: WorldGraph, agentId: string): AmbitionsStrandData {
  const profile = getAxiologicalProfile(graph, agentId);
  const insights = extractInsights(profile, AMBITIONS_PAIRS);

  return {
    strandName: 'Ambitions',
    insights,
  };
}

/**
 * Extract Beliefs strand: tradition/innovation, cunning/honesty, devotion/independence
 */
export function getBeliefsStrand(graph: WorldGraph, agentId: string): BeliefsStrandData {
  const profile = getAxiologicalProfile(graph, agentId);
  const insights = extractInsights(profile, BELIEFS_PAIRS);

  return {
    strandName: 'Beliefs',
    insights,
  };
}

/**
 * Extract Fears strand: shadow side of strong values (|v| > 0.3)
 *
 * Fears are derived from ALL value pairs, not just those in other strands.
 * If a value is strong (|v| > 0.3), we generate a fear from its shadow side.
 */
export function getFearsStrand(graph: WorldGraph, agentId: string): FearsStrandData {
  const profile = getAxiologicalProfile(graph, agentId);
  const insights: ValueInsight[] = [];

  // Check all value pairs
  const allPairs: ValuePair[] = [
    'ambition_contentment',
    'courage_prudence',
    'cruelty_compassion',
    'cunning_honesty',
    'devotion_independence',
    'loyalty_treachery',
    'tradition_innovation',
    'dominance_humility',
    'wrath_patience',
    'greed_generosity',
  ];

  for (const valuePair of allPairs) {
    const value = profile[valuePair];
    const absValue = Math.abs(value);

    // Only include if strong (|v| > 0.3)
    if (absValue <= 0.3) continue;

    const [positiveFear, negativeFear] = FEAR_DESCRIPTIONS[valuePair];
    const description = value >= 0 ? positiveFear : negativeFear;

    insights.push({
      valuePair,
      value,
      label: description.startsWith('Fears') ? 'Fear' : 'Fear',
      description,
    });
  }

  // Sort by absolute value descending
  insights.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return {
    strandName: 'Fears',
    insights,
  };
}
