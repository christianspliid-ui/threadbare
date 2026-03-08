/**
 * Agent Detail Aggregator — Combines graph data into a single AgentDetail object
 * for the AgentDetailPanel component.
 *
 * Task 5: Gated Agent Detail Aggregators
 * - getAgentDetail: Internal engine use (all data)
 * - getAgentInfoCard: Tier 2 UI (knowledge level filtered)
 * - getAgentFullProfile: Tier 3 UI (detailed profile, knowledge level filtered)
 */

import type { WorldGraph } from './graph';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { InfluenceTier } from '../types/influence';
import { TIER_NAMES } from '../types/influence';
import { getArchetype, type NarrativeArchetype } from '../data/archetype-content';
import type { CooperationStrategy, InteractionRecord } from '../types/disposition';
import { DEFAULT_REPUTATION } from '../types/disposition';
import type { KnowledgeLevel } from '../types/familiarity';
import { getDomainWord, getValueWord, getReputationWord, getBondStrengthWord } from '../data/domain-words';
import { generateQuotes, generateBackstory } from './profileGenerator';

// ─── Seeded PRNG ─────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Value Label Lookup ───────────────────────────────────────────

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
  cooperationStrategy: CooperationStrategy | null;
  reputationScore: number;
  recentInteractions: InteractionRecord[];
}

// ─── Familiarity-gated Info Card (Tier 2) ──────────────────────────

export interface AgentInfoCardData {
  id: string;
  name: string;
  locationName: string;
  primarySphere?: string;
  archetypeLabel?: string;
  factionName?: string;
  cultureName?: string;
  topValues?: { pair: ValuePair; word: string }[];
  domains?: { domain: ReachDomain; word: string }[];
  topBonds?: { name: string; strengthWord: string; sentiment: string }[];
  quotes?: string[];
  cooperationStrategy?: string;
  reputationWord?: string;
  backstoryParagraph1?: string;
  knowledgeLevel: KnowledgeLevel;
}

// ─── Familiarity-gated Full Profile (Tier 3) ──────────────────────

export interface AgentFullProfileData {
  quotes?: string[];
  backstoryParagraph1?: string;
  fullBackstory?: string;
  historyTimeline?: { tick: number; event: string }[];
  allTraits?: string[];
  dispositionRecord?: InteractionRecord[];
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

  // ─── Disposition data ───────────────────────────────────────────
  const cooperationStrategy = (props.cooperationStrategy as CooperationStrategy) ?? null;
  const reputationScore = (props.reputationScore as number) ?? DEFAULT_REPUTATION;

  // Gather interaction logs from all relates_to edges (both directions)
  const allInteractions: InteractionRecord[] = [];
  const outRelates = graph.getOutgoingEdges(agentId, 'relates_to');
  const inRelates = graph.getIncomingEdges(agentId, 'relates_to');

  for (const edge of [...outRelates, ...inRelates]) {
    const edgeProps = edge.properties as Record<string, unknown>;
    const log = edgeProps.interactionLog as InteractionRecord[] | undefined;
    if (log && Array.isArray(log)) {
      allInteractions.push(...log);
    }
  }

  // Sort by tick descending, take last 3
  allInteractions.sort((a, b) => b.tick - a.tick);
  const recentInteractions = allInteractions.slice(0, 3);

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
    cooperationStrategy,
    reputationScore,
    recentInteractions,
  };
}

// ─── Familiarity-gated Aggregators ──────────────────────────────────

/**
 * Get info card data for an agent, filtered by knowledge level.
 * Returns null if agent not found or has no worships edge to ascendant.
 */
export function getAgentInfoCard(
  graph: WorldGraph,
  agentId: string,
  ascendantId: string,
  knowledgeLevel: KnowledgeLevel,
): AgentInfoCardData | null {
  const detail = getAgentDetail(graph, agentId, ascendantId);
  if (!detail) return null;

  const agentNode = graph.getNode(agentId);
  if (!agentNode) return null;

  const primarySphere = (agentNode.properties as Record<string, unknown>).primarySphere as string | undefined;

  // Base card (always visible)
  const card: AgentInfoCardData = {
    id: detail.id,
    name: detail.name,
    locationName: detail.locationName,
    primarySphere,
    knowledgeLevel,
  };

  // Recognised+: archetype, faction, culture, 1 domain (vague), 1 value
  if (knowledgeLevel !== 'stranger') {
    if (detail.archetype) {
      card.archetypeLabel = detail.archetype.name;
    }
    if (detail.factionName) {
      card.factionName = detail.factionName;
    }

    // Top 1 value for recognised
    const valuesToShow = knowledgeLevel === 'recognised' ? detail.topValues.slice(0, 1) : detail.topValues;
    if (valuesToShow.length > 0) {
      card.topValues = valuesToShow.map(tv => ({
        pair: tv.pair,
        word: getValueWord(tv.pair, tv.value),
      }));
    }

    // Top 1 domain (vague) for recognised, top 3 for known+
    const domainCount = knowledgeLevel === 'recognised' ? 1 : 3;
    const sortedDomains = Object.entries(detail.domainCapabilities)
      .map(([domain, value]) => ({ domain: domain as ReachDomain, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, domainCount);

    if (sortedDomains.length > 0) {
      card.domains = sortedDomains.map(({ domain, value }) => ({
        domain,
        word: getDomainWord(domain, value),
      }));
    }
  }

  // Known+: key bonds
  if (knowledgeLevel !== 'stranger' && knowledgeLevel !== 'recognised') {
    if (detail.topBonds.length > 0) {
      card.topBonds = detail.topBonds.map(bond => ({
        name: bond.targetName,
        strengthWord: getBondStrengthWord(bond.strength),
        sentiment: bond.sentiment >= 0 ? 'positive' : 'negative',
      }));
    }
  }

  // Intimate+: full 9 domains, quotes, cooperation strategy, reputation
  if (knowledgeLevel === 'intimate' || knowledgeLevel === 'transparent') {
    // All 9 domains
    card.domains = Object.entries(detail.domainCapabilities)
      .map(([domain, value]) => ({
        domain: domain as ReachDomain,
        word: getDomainWord(domain as ReachDomain, value),
      }));

    // Generate quotes
    const dominantValueLabels = detail.topValues
      .slice(0, 3)
      .map(tv => getValueWord(tv.pair, tv.value));

    const prng = mulberry32(agentId.charCodeAt(0) ^ (agentId.length * 37));
    const quotes = generateQuotes(
      {
        archetypeId: detail.archetype?.id ?? 'sage',
        dominantValues: dominantValueLabels,
        primarySphere: primarySphere ?? 'eye',
        name: detail.name,
      },
      prng,
    );
    card.quotes = quotes;

    card.cooperationStrategy = detail.cooperationStrategy ?? undefined;
    card.reputationWord = getReputationWord(detail.reputationScore);
  }

  // Intimate+: backstory paragraph 1
  if (knowledgeLevel === 'intimate' || knowledgeLevel === 'transparent') {
    // Generate backstory
    const traitNames: string[] = []; // In full implementation, would extract from graph
    const bondNames = detail.topBonds.map(b => b.targetName);
    const cultureName = card.cultureName ?? 'The Forgotten Lands';

    const prng = mulberry32((agentId.charCodeAt(0) ^ 0xdeadbeef) * 17);
    const backstory = generateBackstory(
      {
        archetypeId: detail.archetype?.id ?? 'sage',
        cultureName,
        traitNames,
        bondNames,
        name: detail.name,
        primarySphere: primarySphere ?? 'eye',
      },
      prng,
    );

    const paragraphs = backstory.split('\n\n');
    card.backstoryParagraph1 = paragraphs[0];
  }

  return card;
}

/**
 * Get full profile data for an agent, filtered by knowledge level.
 * Returns undefined if knowledge level is below intimate.
 */
export function getAgentFullProfile(
  graph: WorldGraph,
  agentId: string,
  ascendantId: string,
  knowledgeLevel: KnowledgeLevel,
): AgentFullProfileData | undefined {
  // Only intimate+ can see full profile details
  if (knowledgeLevel === 'stranger' || knowledgeLevel === 'recognised' || knowledgeLevel === 'known') {
    return undefined;
  }

  const detail = getAgentDetail(graph, agentId, ascendantId);
  if (!detail) return undefined;

  const agentNode = graph.getNode(agentId);
  if (!agentNode) return undefined;

  const profile: AgentFullProfileData = {};

  const primarySphere = (agentNode.properties as Record<string, unknown>).primarySphere as string | undefined;
  const dominantValueLabels = detail.topValues
    .slice(0, 3)
    .map(tv => getValueWord(tv.pair, tv.value));

  // Intimate+: quotes and backstory paragraph 1
  if (knowledgeLevel === 'intimate' || knowledgeLevel === 'transparent') {
    const prng = mulberry32(agentId.charCodeAt(0) ^ (agentId.length * 37));
    profile.quotes = generateQuotes(
      {
        archetypeId: detail.archetype?.id ?? 'sage',
        dominantValues: dominantValueLabels,
        primarySphere: primarySphere ?? 'eye',
        name: detail.name,
      },
      prng,
    );

    const traitNames: string[] = [];
    const bondNames = detail.topBonds.map(b => b.targetName);
    const cultureName = 'The Forgotten Lands';

    const prng2 = mulberry32((agentId.charCodeAt(0) ^ 0xdeadbeef) * 17);
    const backstory = generateBackstory(
      {
        archetypeId: detail.archetype?.id ?? 'sage',
        cultureName,
        traitNames,
        bondNames,
        name: detail.name,
        primarySphere: primarySphere ?? 'eye',
      },
      prng2,
    );

    const paragraphs = backstory.split('\n\n');
    profile.backstoryParagraph1 = paragraphs[0];
  }

  // Transparent only: full backstory and history timeline
  if (knowledgeLevel === 'transparent') {
    const traitNames: string[] = [];
    const bondNames = detail.topBonds.map(b => b.targetName);
    const cultureName = 'The Forgotten Lands';

    const prng = mulberry32((agentId.charCodeAt(0) ^ 0xdeadbeef) * 17);
    const backstory = generateBackstory(
      {
        archetypeId: detail.archetype?.id ?? 'sage',
        cultureName,
        traitNames,
        bondNames,
        name: detail.name,
        primarySphere: primarySphere ?? 'eye',
      },
      prng,
    );
    profile.fullBackstory = backstory;

    // History timeline from interactions
    profile.historyTimeline = detail.recentInteractions.map(interaction => ({
      tick: interaction.tick,
      event: `${interaction.actorMove} → ${interaction.targetMove} (${interaction.context})`,
    }));

    profile.dispositionRecord = detail.recentInteractions;
  }

  return profile;
}
