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
import { getAgentAttachments, type AttachmentSummary, type AttachmentFullEntry } from './agentAttachments';
import type { ReachDomain } from '../types/traits';
import type { InfluenceTier } from '../types/influence';
import { TIER_NAMES } from '../types/influence';
import { getArchetype, type NarrativeArchetype } from '../data/archetype-content';
import type { CooperationStrategy, InteractionRecord } from '../types/disposition';
import { DEFAULT_REPUTATION } from '../types/disposition';
import type { KnowledgeLevel } from '../types/familiarity';
import { getDomainWord, getDomainTier, getValueWord, getReputationWord, getBondStrengthWord } from '../data/domain-words';
import { generateQuotes, generateBackstory } from './profileGenerator';
import type { AmbitionCategory, ReactiveAmbitionTemplate } from '../types/ambition';
import { generateTieredBackstory } from './backstoryGenerator';
import type { BackstoryResult } from '../types/prose';
import { AMBITION_TEMPLATES } from '../data/ambition-templates';
import { getPortraitUrl } from '../data/portrait-assets';
import { getDivineInfluences } from './interventionEffects';
import { getCurrentStrength } from './decayCurve';
import type { InterventionType, DivineInfluenceEntry } from '../types/dream';
import {
  getAgentLocationId,
  getAgentFaction,
  getAgentBonds,
  getIncomingBonds,
  getActorTraits,
  getActorCultures,
  getAgentAmbitions,
} from './graphQueries';
import type { SphereName } from '../types';
import type { MemberOfEdgeProperties } from '../types/disposition';
import { FACTION_DEFINITIONS } from '../data/faction-definitions';
import { computeRankFromReputation } from '../types/faction';

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
  mercy_ruthlessness: ['Merciful', 'Ruthless'],
  asceticism_extravagance: ['Ascetic', 'Extravagant'],
  honesty_cunning: ['Honest', 'Cunning'],
  tradition_novelty: ['Traditional', 'Innovative'],
  loyalty_ambition: ['Loyal', 'Ambitious'],
  revelation_discretion: ['Revealing', 'Discreet'],
  preservation_transformation: ['Preserving', 'Transforming'],
  sacrifice_survival: ['Self-Sacrificing', 'Self-Preserving'],
  courage_prudence: ['Courageous', 'Prudent'],
};

// ─── Prototype flag ──────────────────────────────────────────────
/** Set to false to gate intent visibility by familiarity tier */
export const PROTOTYPE_INTENT_VISIBLE = true;

// ─── Active Intent (aggregated for display) ───────────────────────

export interface ActiveIntent {
  templateId: string;
  displayName: string;
  category: AmbitionCategory;
  priority: 'primary' | 'secondary';
  completedMilestones: number;
  requiredMilestones: number;
  milestoneDescriptions?: string[];
  reachAffinity: Partial<Record<ReachDomain, number>>;
  reactiveTrigger?: string;
}

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
  /** Attachment data — populated by getAgentAttachments() when available */
  possessions?: import('./agentAttachments').AttachmentSummary[];
  conditions?: import('./agentAttachments').AttachmentSummary[];
  powersAndAgreements?: import('./agentAttachments').AttachmentSummary[];
  /** Active ambitions sorted primary-first. Always populated in prototype. */
  intents?: ActiveIntent[];
  /** Archetype-based portrait image path, or null if no portrait available */
  portraitUrl: string | null;
  /** Quintessence value (0–1.0) — existential health. Undefined if not yet initialized. */
  quintessence?: number;
}

// ─── Active Effects (divine influences visible on agent card) ────────

/** Display-friendly labels for each intervention type */
const INTERVENTION_LABELS: Record<InterventionType, string> = {
  dream: 'Dream',
  persuade: 'Persuaded',
  deceive: 'Deceived',
  intimidate: 'Intimidated',
  inspire_intervention: 'Inspired',
  coincidence: 'Coincidence',
  omen: 'Omen',
  afflict_bless: 'Blessed / Afflicted',
};

export interface ActiveEffect {
  /** Source intervention type or 'scry_court' for court positions */
  type: InterventionType | 'scry_court';
  /** Human-readable label */
  label: string;
  /** Sphere used for this effect (for color coding) */
  sphere?: SphereName;
  /** Current strength 0–1 (for divine influences with decay) */
  strength?: number;
  /** Ticks remaining before expiry */
  ticksRemaining?: number;
}

// ─── Familiarity-gated Info Card (Tier 2) ──────────────────────────

export interface AgentInfoCardData {
  id: string;
  name: string;
  locationId: string;
  locationName: string;
  primarySphere?: string;
  archetypeId?: string;
  archetypeLabel?: string;
  factionName?: string;
  /** Faction rank display name (e.g. 'Journeyman', 'Sergeant') — set when knowledge >= 'recognised' */
  factionRank?: string;
  /** Faction reputation 0–1 — set when knowledge >= 'known' */
  factionReputation?: number;
  /** Faction definition ID for lookups — set when factionName is set */
  factionDefId?: string;
  /** Faction icon glyph for UI display */
  factionIconGlyph?: string;
  /** Faction theme color for UI styling */
  factionThemeColor?: string;
  cultureName?: string;
  topValues?: { pair: ValuePair; word: string }[];
  domains?: { domain: ReachDomain; word: string; tier: number }[];
  /** Agent gender for pronoun resolution in prose (e.g. 'male', 'female'). Defaults to neutral. */
  gender?: string;
  topBonds?: { name: string; strengthWord: string; sentiment: string }[];
  quotes?: string[];
  cooperationStrategy?: string;
  reputationWord?: string;
  allTraits?: string[];
  backstoryParagraph1?: string;
  knowledgeLevel: KnowledgeLevel;
  /** Influence tier (0-4) for this agent — set when knowledge >= 'recognised' */
  influenceTier?: InfluenceTier;
  /** Tiered backstory — set when knowledge >= 'recognised' AND influenceTier >= 1 */
  backstory?: BackstoryResult;
  /** Attachment data for Tier 3 modal (intimate+ knowledge) */
  possessions?: AttachmentFullEntry[];
  afflictions?: AttachmentFullEntry[];
  giftsAndBurdens?: AttachmentFullEntry[];
  /** Full intent list for the character sheet modal (prototype: always visible) */
  intents?: ActiveIntent[];
  /** Primary intent summary for compact AgentInfoCard (prototype: always visible) */
  primaryIntentSummary?: { displayName: string; category: AmbitionCategory };
  /** Portrait URL — only present if knowledge >= recognised */
  portraitUrl?: string;
  /** Active divine effects on this agent (always visible — player's own actions) */
  activeEffects?: ActiveEffect[];
  /** Axiological profile — only populated at intimate+ knowledge (for archetype epithet) */
  axiologicalProfile?: AxiologicalProfile;
  /** Rarity tier for this agent (1–4). Populated from node.properties.rarityTier. */
  rarityTier?: number;
}

// ─── Familiarity-gated Full Profile (Tier 3) ──────────────────────

export interface AgentFullProfileData {
  quotes?: string[];
  backstoryParagraph1?: string;
  fullBackstory?: string;
  historyTimeline?: { tick: number; event: string }[];
  allTraits?: string[];
  dispositionRecord?: InteractionRecord[];
  /** Portrait URL — always present at intimate+ knowledge */
  portraitUrl?: string;
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

  const threadEdges = graph.getIncomingEdges(agentId, 'thread');
  const threadEdge = threadEdges.find(e => e.source === ascendantId);
  // tier defaults to 0 (Stranger) for non-retinue agents — all other detail data is still valid
  const tier: InfluenceTier = threadEdge
    ? (threadEdge.properties as Record<string, unknown>).tier as InfluenceTier
    : 0;
  const profile = (props.axiologicalProfile as AxiologicalProfile) || {} as AxiologicalProfile;
  const domainCapabilities = (props.domainCapabilities as Record<ReachDomain, number>) || {} as Record<ReachDomain, number>;
  // Resolve location via located_at edge (authoritative), fallback to legacy property
  const locationId = getAgentLocationId(graph, agentId) ?? ((props.locationId as string) || '');

  let locationName = '(unknown)';
  if (locationId) {
    const locNode = graph.getNode(locationId);
    if (locNode) locationName = locNode.name;
  }

  let factionName: string | null = null;
  const factionResult = getAgentFaction(graph, agentId);
  if (factionResult) factionName = factionResult.faction.name;

  const archetypeId = props.narrativeArchetype as string | undefined;
  const archetype = archetypeId ? getArchetype(archetypeId) ?? null : null;
  const portraitUrl = getPortraitUrl(archetypeId);

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

  const bondEntries = getAgentBonds(graph, agentId);
  const bonds: BondSummary[] = bondEntries
    .map(b => ({
      targetId: b.agent.id,
      targetName: b.agent.name ?? '(unknown)',
      sentiment: b.sentiment,
      strength: (b.edge.properties.strength as number) ?? 0,
      basis: (b.edge.properties.basis as string) ?? 'unknown',
    }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);

  // ─── Disposition data ───────────────────────────────────────────
  const cooperationStrategy = (props.cooperationStrategy as CooperationStrategy) ?? null;
  const reputationScore = (props.reputationScore as number) ?? DEFAULT_REPUTATION;

  // Gather interaction logs from all relates_to edges (both directions)
  const allInteractions: InteractionRecord[] = [];
  const outBonds = getAgentBonds(graph, agentId);
  const inBonds = getIncomingBonds(graph, agentId);
  for (const b of [...outBonds, ...inBonds]) {
    const log = b.edge.properties.interactionLog as InteractionRecord[] | undefined;
    if (log && Array.isArray(log)) {
      allInteractions.push(...log);
    }
  }

  // Sort by tick descending, take last 3
  allInteractions.sort((a, b) => b.tick - a.tick);
  const recentInteractions = allInteractions.slice(0, 3);

  // ─── Attachment data ────────────────────────────────────────────
  const attachments = getAgentAttachments(graph, agentId);

  const toSummary = (e: AttachmentFullEntry): AttachmentSummary => ({
    id: e.id,
    name: e.name,
    subcategory: e.subcategory,
    tier: e.tier,
    mechanicalSummary: e.mechanicalSummary,
    ticksRemaining: e.ticksRemaining,
    totalTicks: e.totalTicks,
    durationLabel: e.durationLabel,
  });

  const possessions = attachments.possessions.map(toSummary);
  const conditions = attachments.conditions.map(toSummary);
  const powersAndAgreements = [
    ...attachments.powers.map(toSummary),
    ...attachments.agreements.map(toSummary),
  ];

  // ─── Intent data ─────────────────────────────────────────────────
  const intents = getAgentIntents(graph, agentId);

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
    possessions: possessions.length > 0 ? possessions : undefined,
    conditions: conditions.length > 0 ? conditions : undefined,
    powersAndAgreements: powersAndAgreements.length > 0 ? powersAndAgreements : undefined,
    intents: intents.length > 0 ? intents : undefined,
    portraitUrl,
    quintessence: (props.quintessence as number | undefined),
  };
}

// ─── Familiarity-gated Aggregators ──────────────────────────────────

/**
 * Extract trait names from an agent's has_trait edges.
 * @private
 */
function getAgentTraitNames(graph: WorldGraph, agentId: string): string[] {
  return getActorTraits(graph, agentId).map(t => t.trait.name);
}

/**
 * Extract culture name from an agent's belongs_to edges.
 * Returns the first culture name found, or undefined if no culture edges exist.
 * @private
 */
function getAgentCultureName(graph: WorldGraph, agentId: string): string | undefined {
  const cultures = getActorCultures(graph, agentId);
  return cultures.length > 0 ? cultures[0].culture.name : undefined;
}

/**
 * Aggregate active ambitions into display-ready ActiveIntent objects.
 * Sorted primary-first. Always populated in prototype (PROTOTYPE_INTENT_VISIBLE = true).
 * @private
 */
function getAgentIntents(graph: WorldGraph, agentId: string): ActiveIntent[] {
  const ambitionEntries = getAgentAmbitions(graph, agentId)
    .filter(a => a.status === 'active');

  // TODO: gate by familiarity tier when PROTOTYPE_INTENT_VISIBLE = false
  const intents: ActiveIntent[] = [];

  for (const entry of ambitionEntries) {
    const templateId = entry.ambition.properties.templateId as string;
    if (!templateId) continue; // fail-soft

    const template = AMBITION_TEMPLATES.find(t => t.id === templateId);
    if (!template) continue; // fail-soft

    const completedMilestoneIds = (entry.edge.properties.completedMilestones as string[]) ?? [];
    const priority = (entry.edge.properties.priority as 'primary' | 'secondary') ?? 'secondary';

    // Detect reactive templates by presence of triggerEvent field
    const isReactive = 'triggerEvent' in template;

    intents.push({
      templateId,
      displayName: template.displayName,
      category: template.category,
      priority,
      completedMilestones: completedMilestoneIds.length,
      requiredMilestones: template.completion.requires,
      reachAffinity: { ...template.reachAffinity },
      reactiveTrigger: isReactive
        ? (template as ReactiveAmbitionTemplate).triggerEvent
        : undefined,
    });
  }

  // Sort: primary first, then secondary
  intents.sort((a, b) => {
    if (a.priority === 'primary' && b.priority !== 'primary') return -1;
    if (a.priority !== 'primary' && b.priority === 'primary') return 1;
    return 0;
  });

  return intents;
}

/**
 * Get info card data for an agent, filtered by knowledge level.
 * Returns null if agent not found or has no thread edge from ascendant.
 */
export function getAgentInfoCard(
  graph: WorldGraph,
  agentId: string,
  ascendantId: string,
  knowledgeLevel: KnowledgeLevel,
  seed = 0,
  tick = 0,
): AgentInfoCardData | null {
  const detail = getAgentDetail(graph, agentId, ascendantId);
  if (!detail) return null;

  const agentNode = graph.getNode(agentId);
  if (!agentNode) return null;

  const agentProps = agentNode.properties as Record<string, unknown>;
  const primarySphere = agentProps.primarySphere as string | undefined;
  const rarityTier = agentProps.rarityTier as number | undefined;
  const agentGender = agentProps.gender as string | undefined;
  const cultureName = getAgentCultureName(graph, agentId);
  const traitNames = getAgentTraitNames(graph, agentId);

  // Base card (always visible)
  const card: AgentInfoCardData = {
    id: detail.id,
    name: detail.name,
    locationId: detail.locationId,
    locationName: detail.locationName,
    primarySphere,
    cultureName,
    knowledgeLevel,
    rarityTier,
    gender: agentGender,
  };

  // Intent data — always visible in prototype
  // TODO: gate by familiarity tier when PROTOTYPE_INTENT_VISIBLE = false
  if (detail.intents && detail.intents.length > 0) {
    card.intents = detail.intents;
    const primary = detail.intents.find(i => i.priority === 'primary');
    if (primary) {
      card.primaryIntentSummary = {
        displayName: primary.displayName,
        category: primary.category,
      };
    }
  }

  // Recognised+: expose influence tier; gate backstory on tier >= 1
  if (knowledgeLevel !== 'stranger') {
    card.influenceTier = detail.tier;
    if (detail.tier >= 1) {
      // Read readBackstoryTier from the thread edge
      const threadEdges = graph.getIncomingEdges(agentId, 'thread');
      const threadEdge = threadEdges.find(e => e.source === ascendantId);
      const readBackstoryTier = ((threadEdge?.properties as Record<string, unknown>)?.readBackstoryTier as number) ?? 0;
      card.backstory = generateTieredBackstory(agentId, graph, seed, detail.tier, readBackstoryTier as 0 | 1 | 2 | 3 | 4);
    }
  }

  // Recognised+: archetype, faction, culture, 1 domain (vague), 1 value, portrait
  if (knowledgeLevel !== 'stranger') {
    if (detail.archetype) {
      card.archetypeId = detail.archetype.id;
      card.archetypeLabel = detail.archetype.name;
    }
    if (detail.portraitUrl) {
      card.portraitUrl = detail.portraitUrl;
    }
    if (detail.factionName) {
      card.factionName = detail.factionName;
      // Populate faction rank/reputation from member_of edge
      const factionResult = getAgentFaction(graph, agentId);
      if (factionResult) {
        const memberEdges = graph.getOutgoingEdges(agentId, 'member_of')
          .filter(e => e.target === factionResult.faction.id);
        if (memberEdges.length > 0) {
          const memberProps = memberEdges[0].properties as Partial<MemberOfEdgeProperties>;
          const factionDefId = memberProps.factionDefId;
          if (factionDefId) {
            card.factionDefId = factionDefId;
            const def = FACTION_DEFINITIONS.get(factionDefId);
            if (def) {
              const rep = memberProps.reputation ?? 0;
              const rank = computeRankFromReputation(rep, def);
              card.factionRank = rank.name;
              card.factionIconGlyph = def.iconGlyph;
              card.factionThemeColor = def.themeColor;
              // known+ gets reputation number
              if (knowledgeLevel !== 'recognised') {
                card.factionReputation = rep;
              }
            }
          }
        }
      }
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
        tier: getDomainTier(value),
      }));
    }
  }

  // Known+: key bonds and 1 quote
  if (knowledgeLevel !== 'stranger' && knowledgeLevel !== 'recognised') {
    if (detail.topBonds.length > 0) {
      card.topBonds = detail.topBonds.map(bond => ({
        name: bond.targetName,
        strengthWord: getBondStrengthWord(bond.strength),
        sentiment: bond.sentiment >= 0 ? 'positive' : 'negative',
      }));
    }

    // Known level: exactly 1 quote
    if (knowledgeLevel === 'known') {
      const dominantValueLabels = detail.topValues
        .slice(0, 3)
        .map(tv => getValueWord(tv.pair, tv.value));

      const prng = mulberry32(agentId.charCodeAt(0) ^ (agentId.length * 37));
      const allQuotes = generateQuotes(
        {
          archetypeId: detail.archetype?.id ?? 'sage',
          dominantValues: dominantValueLabels,
          primarySphere: primarySphere ?? 'eye',
          name: detail.name,
        },
        prng,
      );
      card.quotes = [allQuotes[0]];
    }
  }

  // Intimate+: full 9 domains, quotes, cooperation strategy, reputation, all traits, backstory paragraph 1
  if (knowledgeLevel === 'intimate' || knowledgeLevel === 'transparent') {
    // All 8 domains
    card.domains = Object.entries(detail.domainCapabilities)
      .map(([domain, value]) => ({
        domain: domain as ReachDomain,
        word: getDomainWord(domain as ReachDomain, value),
        tier: getDomainTier(value),
      }));

    // Generate all quotes
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

    // All traits
    if (traitNames.length > 0) {
      card.allTraits = traitNames;
    }

    // Generate backstory paragraph 1
    const bondNames = detail.topBonds.map(b => b.targetName);
    const cultureNameForBackstory = cultureName ?? 'The Forgotten Lands';

    const prng2 = mulberry32((agentId.charCodeAt(0) ^ 0xdeadbeef) * 17);
    const backstory = generateBackstory(
      {
        archetypeId: detail.archetype?.id ?? 'sage',
        cultureName: cultureNameForBackstory,
        traitNames,
        bondNames,
        name: detail.name,
        primarySphere: primarySphere ?? 'eye',
      },
      prng2,
    );

    const paragraphs = backstory.split('\n\n');
    card.backstoryParagraph1 = paragraphs[0];

    // Attachment data (intimate+)
    const attachments = getAgentAttachments(graph, agentId);
    if (attachments.possessions.length > 0) {
      card.possessions = attachments.possessions;
    }
    if (attachments.conditions.length > 0) {
      card.afflictions = attachments.conditions;
    }
    const giftsAndBurdens = [...attachments.powers, ...attachments.agreements];
    if (giftsAndBurdens.length > 0) {
      card.giftsAndBurdens = giftsAndBurdens;
    }

    // Expose axiological profile for archetype epithet derivation (intimate+)
    const axioProfile = (agentNode.properties as Record<string, unknown>).axiologicalProfile as AxiologicalProfile | undefined;
    if (axioProfile) {
      card.axiologicalProfile = axioProfile;
    }
  }

  // ─── Active Effects (always visible — player's own divine actions) ──
  const divineInfluences = getDivineInfluences(graph, agentId);
  const activeEffects: ActiveEffect[] = [];

  for (const influence of divineInfluences) {
    const strength = getCurrentStrength({
      initialStrength: influence.initialStrength,
      decayRate: influence.decayRate,
      minimumStrength: influence.minimumStrength,
      maxDuration: influence.maxDuration,
      tickApplied: influence.tickApplied,
    }, tick);

    if (strength <= 0) continue; // Expired — don't show

    const ticksRemaining = Math.max(0, (influence.tickApplied + influence.maxDuration) - tick);

    activeEffects.push({
      type: influence.interventionType,
      label: INTERVENTION_LABELS[influence.interventionType] ?? influence.interventionType,
      sphere: influence.sphere,
      strength,
      ticksRemaining,
    });
  }

  if (activeEffects.length > 0) {
    card.activeEffects = activeEffects;
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
  const traitNames = getAgentTraitNames(graph, agentId);
  const cultureName = getAgentCultureName(graph, agentId) ?? 'The Forgotten Lands';
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

    const bondNames = detail.topBonds.map(b => b.targetName);

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
    const bondNames = detail.topBonds.map(b => b.targetName);

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
