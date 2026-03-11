/**
 * Quest Visibility Filter
 *
 * Determines whether an encounter's visibleTo filter matches a given agent.
 * Supports: agent:<id>, faction:<id>, archetype:<id>, culture:<id>, "all".
 * Undefined visibleTo = visible to all (backward compatible).
 */

import type { WorldGraph } from './graph';

/**
 * Check whether an encounter with the given visibleTo filter is visible to an agent.
 * Returns true if any filter matches (OR logic) or if visibleTo is undefined/"all".
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

  for (const filter of visibleTo) {
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
