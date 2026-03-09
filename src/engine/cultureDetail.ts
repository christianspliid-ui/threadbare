/**
 * Culture Detail Aggregator — Combines graph data into culture-specific objects
 * for UI display with knowledge-level gating.
 *
 * Three aggregator functions:
 * 1. getCultureDetail: Raw data (internal use)
 * 2. getCultureInfoCard: Sidebar card data gated by insight level
 * 3. getCultureCodexData: Codex sections gated by insight level
 */

import type { WorldGraph } from './graph';
import type { CultureIdentity } from '../types/culture';
import type { KnowledgeLevel } from '../types/familiarity';
import { KNOWLEDGE_LEVELS } from '../types/familiarity';
import type { EntitySection } from '../types/entityDetail';

// ─── Type Definitions ───────────────────────────────────────────

export interface CultureDetailData {
  name: string;
  identity: CultureIdentity;
  flagSvg: string;
  members: Array<{ id: string; name: string; strength: number }>;
  territoryLocations: Array<{ id: string; name: string; terrain: string }>;
}

export interface CultureInfoCardData {
  name: string;
  cultureId: string;
  flagSvg: string;
  foundationBias: string;
  veneratedSpheres: string[];
  knowledgeLevel: KnowledgeLevel;
  socialStructure?: string;
  accountability?: string;
  materialVocabulary?: string[];
  metaphorPalette?: string[];
  behavioralKeywords?: string[];
  memberCount?: number;
}

export interface CultureCodexData {
  name: string;
  cultureId: string;
  flagSvg: string;
  sections: EntitySection[];
}

// ─── Core Aggregator ────────────────────────────────────────────

/**
 * Extract raw culture detail data from graph.
 * Returns null if culture not found or not actorType==='culture'.
 */
export function getCultureDetail(
  graph: WorldGraph,
  cultureId: string,
): CultureDetailData | null {
  const cultureNode = graph.getNode(cultureId);
  if (!cultureNode) return null;

  const props = cultureNode.properties as Record<string, unknown>;
  const actorType = props.actorType as string | undefined;
  if (actorType !== 'culture') return null;

  const identity = (props.cultureIdentity as CultureIdentity) || ({} as CultureIdentity);
  const flagSvg = (props.flagSvg as string) || '';

  // ─── Find members (actors with belongs_to edges to this culture) ───
  const members: Array<{ id: string; name: string; strength: number }> = [];
  const allEdges = graph.getAllEdgesForNode(cultureId);

  for (const edge of allEdges) {
    if (edge.target === cultureId && edge.type === 'belongs_to') {
      const sourceNode = graph.getNode(edge.source);
      if (sourceNode && sourceNode.type === 'actor') {
        const sourceProps = sourceNode.properties as Record<string, unknown>;
        const sourceActorType = sourceProps.actorType as string | undefined;
        // Only include individual actors as members
        if (sourceActorType === 'individual') {
          const edgeProps = edge.properties as Record<string, unknown>;
          const strength = (edgeProps.culturalStrength as number) ?? 0.5;
          members.push({
            id: edge.source,
            name: sourceNode.name,
            strength,
          });
        }
      }
    }
  }

  // ─── Find territory locations (location nodes with belongs_to edges) ───
  const territoryLocations: Array<{ id: string; name: string; terrain: string }> = [];

  for (const edge of allEdges) {
    if (edge.target === cultureId && edge.type === 'belongs_to') {
      const sourceNode = graph.getNode(edge.source);
      if (sourceNode && sourceNode.type === 'location') {
        const sourceProps = sourceNode.properties as Record<string, unknown>;
        const terrain = (sourceProps.terrain as string) ?? 'unknown';
        territoryLocations.push({
          id: edge.source,
          name: sourceNode.name,
          terrain,
        });
      }
    }
  }

  return {
    name: cultureNode.name,
    identity,
    flagSvg,
    members,
    territoryLocations,
  };
}

// ─── Knowledge-Level Gating ─────────────────────────────────────

/**
 * Map KnowledgeLevel to numeric tier for easy comparison.
 */
function getKnowledgeTier(level: KnowledgeLevel): number {
  return KNOWLEDGE_LEVELS.indexOf(level);
}

/**
 * Get culture info card data, gated by knowledge level.
 * Returns null if culture not found.
 */
export function getCultureInfoCard(
  graph: WorldGraph,
  cultureId: string,
  knowledgeLevel: KnowledgeLevel,
): CultureInfoCardData | null {
  const detail = getCultureDetail(graph, cultureId);
  if (!detail) return null;

  // Base card (always visible)
  const card: CultureInfoCardData = {
    name: detail.name,
    cultureId,
    flagSvg: detail.flagSvg,
    foundationBias: detail.identity.foundationBias,
    veneratedSpheres: detail.identity.veneratedSpheres,
    knowledgeLevel,
  };

  // Recognised+: social structure, accountability
  if (knowledgeLevel !== 'stranger') {
    card.socialStructure = detail.identity.socialStructure;
    card.accountability = detail.identity.accountability;
  }

  // Known+: material vocabulary, member count
  if (getKnowledgeTier(knowledgeLevel) >= getKnowledgeTier('known')) {
    card.materialVocabulary = detail.identity.materialVocabulary;
    card.memberCount = detail.members.length;
  }

  // Intimate+: metaphor palette
  if (getKnowledgeTier(knowledgeLevel) >= getKnowledgeTier('intimate')) {
    card.metaphorPalette = detail.identity.metaphorPalette;
  }

  // Transparent: all of above + behavioral keywords
  if (knowledgeLevel === 'transparent') {
    card.behavioralKeywords = detail.identity.behavioralKeywords;
  }

  return card;
}

// ─── Codex Section Generation ───────────────────────────────────

/**
 * Get codex data with sections gated by knowledge level.
 * Returns null if culture not found.
 */
export function getCultureCodexData(
  graph: WorldGraph,
  cultureId: string,
  knowledgeLevel: KnowledgeLevel,
): CultureCodexData | null {
  const detail = getCultureDetail(graph, cultureId);
  if (!detail) return null;

  const knowledgeTier = getKnowledgeTier(knowledgeLevel);
  const sections: EntitySection[] = [];

  // Define all possible sections with their insight tiers
  const allSections: Array<{
    id: string;
    title: string;
    insightTier: KnowledgeLevel;
    proseVoice: 'chronicle' | 'oral';
    proseTemplate: string;
  }> = [
    {
      id: 'origins',
      title: 'Origins',
      insightTier: 'stranger',
      proseVoice: 'chronicle',
      proseTemplate: `The ${detail.name} trace their origins to the ${detail.identity.primaryBiome}. Their society is built around ${detail.identity.socialStructure}, with accountability enforced through ${detail.identity.accountability}.`,
    },
    {
      id: 'social_order',
      title: 'The Social Order',
      insightTier: 'recognised',
      proseVoice: 'chronicle',
      proseTemplate: `Power flows through ${detail.identity.socialStructure}. Justice is dispensed through ${detail.identity.accountability}. The people understand their place within this structure, and most accept it without question.`,
    },
    {
      id: 'ways_materials',
      title: 'Ways & Materials',
      insightTier: 'known',
      proseVoice: 'chronicle',
      proseTemplate: `The material culture of ${detail.name} centers on ${detail.identity.materialVocabulary.slice(0, 2).join(' and ')}. These objects carry meaning beyond their utility—they are vessels of tradition, memory, and identity. Craftspeople are honored for their precision and dedication.`,
    },
    {
      id: 'figures_of_note',
      title: 'Figures of Note',
      insightTier: 'known',
      proseVoice: 'chronicle',
      proseTemplate: `${detail.members.length > 0 ? `Among the most prominent are: ${detail.members.slice(0, 3).map(m => m.name).join(', ')}.` : 'Many notable figures have shaped this culture over time.'}`,
    },
    {
      id: 'living_history',
      title: 'Living History',
      insightTier: 'intimate',
      proseVoice: 'oral',
      proseTemplate: `The people speak of recent events with pride and sorrow in equal measure. Stories pass from tongue to tongue, each telling adding layers of meaning. What happened last season becomes myth by the next.`,
    },
    {
      id: 'inner_voice',
      title: 'The Inner Voice',
      insightTier: 'transparent',
      proseVoice: 'oral',
      proseTemplate: `We are the children of the ${detail.identity.metaphorPalette[0]}. Our ${detail.identity.materialVocabulary[0]} carry the memories of our ancestors. To know us is to know that we are ${detail.identity.behavioralKeywords.join(', ')}.`,
    },
  ];

  // Filter and add sections based on knowledge level
  for (const section of allSections) {
    const sectionTier = getKnowledgeTier(section.insightTier);
    if (sectionTier <= knowledgeTier) {
      sections.push({
        id: section.id,
        title: section.title,
        insightTier: section.insightTier,
        proseVoice: section.proseVoice,
        prose: section.proseTemplate,
      });
    }
  }

  return {
    name: detail.name,
    cultureId,
    flagSvg: detail.flagSvg,
    sections,
  };
}
