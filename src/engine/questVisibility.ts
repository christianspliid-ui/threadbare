/**
 * Quest Visibility Filter
 *
 * Determines whether an encounter's visibleTo filter matches a given agent.
 * Supports:
 *   - agent:<id>          — visible only to specific agent
 *   - faction:<id>        — visible to members of faction
 *   - not_faction:<id>    — visible ONLY to non-members (TB-061: join encounters)
 *   - archetype:<id>      — visible to agents with matching narrative archetype
 *   - culture:<id>        — visible to agents in culture group
 *   - "all"               — visible to everyone
 *
 * Positive filters use OR logic (any match → visible).
 * Negative filters (not_*) use AND logic (ALL must pass → visible).
 * Undefined visibleTo = visible to all (backward compatible).
 */

import type { WorldGraph } from './graph';
import type { MemberOfEdgeProperties } from '../types/disposition';

/**
 * Check whether an encounter with the given visibleTo filter is visible to an agent.
 * Returns true if any positive filter matches AND all negative filters pass.
 */
export function isEncounterVisibleToAgent(
  graph: WorldGraph,
  agentId: string,
  visibleTo: string[] | undefined,
): boolean {
  // No filter = visible to all
  if (!visibleTo || visibleTo.length === 0) return true;
  if (visibleTo.includes('all')) return true;

  const agentNode = graph.getNode(agentId);
  if (!agentNode) return false;

  // Separate positive and negative filters
  const positiveFilters: string[] = [];
  const negativeFilters: string[] = [];

  for (const filter of visibleTo) {
    if (filter.startsWith('not_')) {
      negativeFilters.push(filter);
    } else {
      positiveFilters.push(filter);
    }
  }

  // Check negative filters first (ALL must pass)
  for (const filter of negativeFilters) {
    // Remove 'not_' prefix, then split on ':'
    const rest = filter.slice(4); // 'not_faction:xyz' → 'faction:xyz'
    const [prefix, targetId] = rest.split(':');

    switch (prefix) {
      case 'faction': {
        // Exclude if agent IS a member of this faction (by factionDefId)
        const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
        const isMember = memberEdges.some(e => {
          const props = e.properties as Partial<MemberOfEdgeProperties>;
          return props.factionDefId === targetId;
        });
        if (isMember) return false; // Agent is a member → excluded
        break;
      }
      default:
        // Unknown negative filter prefix — skip (fail-soft)
        break;
    }
  }

  // If only negative filters exist (no positive ones), agent passes if negatives passed
  if (positiveFilters.length === 0) return true;

  // Check positive filters (ANY match → visible)
  for (const filter of positiveFilters) {
    const [prefix, targetId] = filter.split(':');

    switch (prefix) {
      case 'agent':
        if (agentId === targetId) return true;
        break;

      case 'faction': {
        // Check if agent has member_of edge to this faction
        const factionEdges = graph.getOutgoingEdges(agentId, 'member_of');
        if (factionEdges.some(e => e.target === targetId)) return true;
        break;
      }

      case 'archetype': {
        const archetype = agentNode.properties?.narrativeArchetype;
        if (archetype === targetId) return true;
        break;
      }

      case 'culture': {
        const cultureEdges = graph.getOutgoingEdges(agentId, 'belongs_to');
        if (cultureEdges.some(e => e.target === targetId)) return true;
        break;
      }

      default:
        // Unknown filter prefix — skip (fail-soft)
        break;
    }
  }

  return false;
}
