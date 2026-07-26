// src/engine/graphConditions.ts
// Pure evaluator for GraphCondition objects against a minimal graph interface.
// Used by milestone and abandonment checks in the ambition system.

import type { GraphCondition } from '../types/ambition';
import { collectBearerTraitRefs, bearerMatchesPredicate } from './traitRefIndex';

/**
 * Minimal graph interface — keeps this module testable without the full WorldGraph.
 *
 * `name` is optional and additive (THR-786): the shared trait-ref walk resolves a
 * trait by display name as well as by id/tag, and a node's display name lives at the
 * node level. Existing implementors that omit it keep working — a missing name simply
 * contributes no name ref.
 */
export interface ConditionGraph {
  getNode: (id: string) => { id: string; name?: string; properties: Record<string, unknown> } | undefined;
  getOutgoingEdges: (id: string, type?: string) => ReadonlyArray<{
    source: string;
    target: string;
    type: string;
    properties: Record<string, unknown>;
  }>;
  getIncomingEdges: (id: string, type?: string) => ReadonlyArray<{
    source: string;
    target: string;
    type: string;
    properties: Record<string, unknown>;
  }>;
}

/**
 * Evaluate a single GraphCondition against the world graph for a given agent.
 * Pure function — reads graph state, returns boolean, no side effects.
 * Fails soft: returns false for any missing data rather than throwing.
 */
export function evaluateGraphCondition(
  condition: GraphCondition,
  graph: ConditionGraph,
  agentId: string,
): boolean {
  switch (condition.type) {
    case 'agent_reach_above': {
      const agent = graph.getNode(agentId);
      if (!agent) return false;
      const caps = agent.properties.domainCapabilities as Record<string, number> | undefined;
      if (!caps) return false;
      const value = caps[condition.reach];
      return typeof value === 'number' && value >= condition.threshold;
    }

    case 'agent_reach_below': {
      const agent = graph.getNode(agentId);
      if (!agent) return false;
      const caps = agent.properties.domainCapabilities as Record<string, number> | undefined;
      if (!caps) return false;
      const value = caps[condition.reach];
      return typeof value === 'number' && value < condition.threshold;
    }

    // THR-786: both cases route through the one shared trait resolver. The
    // `trait.<key>` short-id form these conditions author keeps working (the ref walk
    // emits it for every trait node), and tag / display-name / full-id refs now
    // resolve too. The old `properties.traitId` comparison is preserved inside the
    // shared walk, though no producer has ever written that property.
    case 'agent_has_trait':
      return bearerMatchesPredicate(
        collectBearerTraitRefs(graph, agentId),
        { traitId: condition.trait },
      );

    case 'agent_lacks_trait':
      return !bearerMatchesPredicate(
        collectBearerTraitRefs(graph, agentId),
        { traitId: condition.trait },
      );

    case 'agent_has_bonds': {
      const edges = graph.getOutgoingEdges(agentId, 'relates_to');
      const count = edges.filter((e) => e.properties.basis === condition.basis).length;
      return count >= condition.minCount;
    }

    case 'agent_controls_location': {
      const edges = graph.getOutgoingEdges(agentId, 'controls');
      return edges.some((edge) => {
        const locNode = graph.getNode(edge.target);
        return locNode?.properties.locationType === condition.locationType;
      });
    }

    case 'agent_in_region': {
      const agent = graph.getNode(agentId);
      if (!agent) return false;
      const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
      const locationId = locEdges.length > 0 ? locEdges[0].target : undefined;
      if (!locationId) return false;
      const loc = graph.getNode(locationId);
      if (!loc) return false;
      return loc.properties.regionId === condition.region;
    }

    case 'agent_not_in_region': {
      const agent = graph.getNode(agentId);
      if (!agent) return false;
      const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
      const locationId = locEdges.length > 0 ? locEdges[0].target : undefined;
      if (!locationId) return false;
      const loc = graph.getNode(locationId);
      if (!loc) return false;
      return loc.properties.regionId !== condition.region;
    }

    case 'target_agent_eliminated': {
      const target = graph.getNode(condition.targetRef);
      if (!target) return true; // node gone = eliminated
      return target.properties.eliminated === true;
    }

    default: {
      // Exhaustive check — TypeScript will error if a condition type is unhandled
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}
