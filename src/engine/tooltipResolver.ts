/**
 * Tooltip Resolver — Zero-Duplication Content Router
 *
 * Routes tooltip IDs to their canonical content sources. Eliminates redundancy
 * by delegating to getUITooltip(), getArchetype(), doom-content, and world-model
 * lookup rather than duplicating content across the codebase.
 *
 * Routing table:
 * - ui.* → ui-content.ts (UI elements)
 * - sphere.* → world-model.json foundation + creation spheres
 * - reach.* → world-model.json reaches
 * - terrain.* → world-model.json terrain biomes
 * - archetype.* → archetype-content.ts
 * - doom.* → doom-content.ts stage names or hardcoded definitions
 */

import type { TooltipContent } from '../types/tooltip';
import type { FamiliarityMap } from '../types/familiarity';
import { getUITooltip } from '../data/ui-content';
import { getArchetype } from '../data/archetype-content';
import { ARCHETYPE_STAGE_NAMES } from '../data/doom-content';
import { getDomainWord } from '../data/domain-words';
import { getFamiliarity, getKnowledgeLevel } from './familiarity';
import { getAgentDetail } from './agentDetail';
import type { WorldGraph } from './graph';
import worldModel from '../data/world-model.json';

export interface TooltipResolverContext {
  graph: WorldGraph;
  familiarityMap: FamiliarityMap;
  ascendantId: string;
}

/**
 * Resolve a tooltip ID to its content.
 *
 * Routing by prefix:
 * - ui.* → UI tooltips from ui-content.ts
 * - sphere.* → Foundation or creation sphere from world-model.json
 * - reach.* → Reach domain from world-model.json
 * - terrain.* → Terrain biome from world-model.json
 * - archetype.* → Narrative archetype from archetype-content.ts
 * - doom.* → Doom stage or global doom definitions
 * - agent.* → Agent name + archetype/domain info, gated by familiarity (Tier 1)
 * - mandate.* → Reserved for future implementation
 *
 * World-model descriptions longer than ~120 chars are truncated at
 * sentence boundaries to fit tooltip width constraints.
 *
 * @param context Optional context for agent.* prefix — contains graph, familiarityMap, ascendantId
 */
export function resolveTooltip(id: string, context?: TooltipResolverContext): TooltipContent | null {
  // Empty string or invalid format
  if (!id || !id.includes('.')) {
    return null;
  }

  const [prefix, ...rest] = id.split('.');
  const suffix = rest.join('.'); // Handle nested ids like "ui.avatar_wheel"

  // ─── UI Tooltips ───────────────────────────────────────────────
  if (prefix === 'ui') {
    return getUITooltip(id);
  }

  // ─── World-Model Node Lookups ──────────────────────────────────
  // Build a lookup map of world-model nodes by id for fast access
  const nodeMap = new Map(
    worldModel.nodes.map(n => [n.id, n as any])
  );

  // Sphere lookup (foundation or creation)
  if (prefix === 'sphere') {
    // Try both "foundation.{suffix}" and "creation.{suffix}"
    const foundationId = `foundation.${suffix}`;
    const creationId = `creation.${suffix}`;

    const node = nodeMap.get(foundationId) || nodeMap.get(creationId);
    if (node) {
      return {
        label: node.name,
        desc: truncateDescription(node.description),
      };
    }
    return null;
  }

  // Reach lookup
  if (prefix === 'reach') {
    const reachId = `reach.${suffix}`;
    const node = nodeMap.get(reachId);
    if (node) {
      return {
        label: node.name,
        desc: truncateDescription(node.description),
      };
    }
    return null;
  }

  // Terrain lookup
  if (prefix === 'terrain') {
    const terrainId = `terrain.${suffix}`;
    const node = nodeMap.get(terrainId);
    if (node) {
      return {
        label: node.name,
        desc: truncateDescription(node.description),
      };
    }
    return null;
  }

  // ─── Archetype Lookup ──────────────────────────────────────────
  if (prefix === 'archetype') {
    const archetype = getArchetype(suffix);
    if (archetype) {
      return {
        label: archetype.name,
        desc: archetype.storyShape,
      };
    }
    return null;
  }

  // ─── Doom Lookup ──────────────────────────────────────────────
  if (prefix === 'doom') {
    // Special case: "unmaking" is a hardcoded global concept
    if (suffix === 'unmaking') {
      return {
        label: 'The Unmaking',
        desc: 'The final stage where all spheres collapse. Tracked by {{ui.doom_bar}}. The world returns to void.',
      };
    }

    // Special case: "clock" is the doom clock system itself
    if (suffix === 'clock') {
      return {
        label: 'Doom Clock',
        desc: 'A measure of how close the world draws to the Unmaking. Managed via {{ui.mandate_tracker}}.',
      };
    }

    // Otherwise, return null for future mandate/etc lookups
    return null;
  }

  // ─── Agent Tooltip (Tier 1 — Familiarity-Aware) ─────────────────
  if (prefix === 'agent') {
    // Requires context: graph, familiarityMap, ascendantId
    if (!context || !context.graph || !context.familiarityMap) {
      return null;
    }

    const agentId = suffix;
    const agentNode = context.graph.getNode(agentId);
    if (!agentNode) {
      return null;
    }

    const agentName = agentNode.name;

    // Get familiarity and derive knowledge level
    const familiarity = getFamiliarity(context.familiarityMap, agentId);
    const knowledgeLevel = getKnowledgeLevel(familiarity);

    // Stranger: just name + "A mysterious figure"
    if (knowledgeLevel === 'stranger') {
      return {
        label: agentName,
        desc: 'A mysterious figure.',
      };
    }

    // Recognised+: Get agent detail to fetch archetype and domains
    const detail = getAgentDetail(context.graph, agentId, context.ascendantId);
    if (!detail) {
      // Fallback if getAgentDetail fails
      return {
        label: agentName,
        desc: 'A mysterious figure.',
      };
    }

    // Recognised: archetype only
    if (knowledgeLevel === 'recognised') {
      const archetypeName = detail.archetype?.name ?? 'Unknown';
      return {
        label: agentName,
        desc: `${archetypeName}.`,
      };
    }

    // Known+: top domain word
    // Find the highest domain capability
    const domains = Object.entries(detail.domainCapabilities)
      .map(([domain, value]) => ({ domain, value }))
      .sort((a, b) => b.value - a.value);

    if (domains.length > 0) {
      const topDomain = domains[0].domain as any;
      const domainWord = getDomainWord(topDomain, domains[0].value);
      const archetypeName = detail.archetype?.name ?? 'Unknown';
      return {
        label: agentName,
        desc: `${archetypeName}. ${domainWord}.`,
      };
    }

    // Fallback if no domains
    const archetypeName = detail.archetype?.name ?? 'Unknown';
    return {
      label: agentName,
      desc: `${archetypeName}.`,
    };
  }

  // ─── Unknown prefix or mandate (not yet implemented) ───────────
  if (prefix === 'mandate') {
    // Future implementation
    return null;
  }

  // Unknown prefix
  return null;
}

/**
 * Truncate a long description to ~120 characters, breaking at sentence boundaries.
 *
 * If the description is already short (≤120 chars), return as-is.
 * Otherwise, find the last period/question mark/exclamation mark before 120 chars
 * and truncate there. If no sentence boundary found, truncate at 120 and add ellipsis.
 */
function truncateDescription(description: string): string {
  const MAX_LENGTH = 120;

  if (description.length <= MAX_LENGTH) {
    return description;
  }

  // Look for sentence boundaries (., ?, !) within the limit
  const truncated = description.substring(0, MAX_LENGTH);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('?'),
    truncated.lastIndexOf('!')
  );

  if (lastSentenceEnd > 60) {
    // Good sentence break found, use it
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  // No good break found, truncate at 120 and add ellipsis
  return truncated.trim() + '…';
}
