// src/engine/graphConditions.ts
// Pure evaluator for GraphCondition objects against a minimal graph interface.
// Used by milestone and abandonment checks in the ambition system.

import type { GraphCondition } from '../types/ambition';

/** Minimal graph interface — keeps this module testable without the full WorldGraph. */
export interface ConditionGraph {
  getNode: (id: string) => { id: string; properties: Record<string, unknown> } | undefined;
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

    case 'agent_has_trait': {
      const edges = graph.getOutgoingEdges(agentId, 'has_trait');
      return edges.some((edge) => {
        const targetNode = graph.getNode(edge.target);
        if (!targetNode) return false;
        return (
          targetNode.properties.traitId === condition.trait ||
          targetNode.id === `trait.${condition.trait}`
        );
      });
    }

    case 'agent_lacks_trait': {
      const edges = graph.getOutgoingEdges(agentId, 'has_trait');
      const hasTrait = edges.some((edge) => {
        const targetNode = graph.getNode(edge.target);
        if (!targetNode) return false;
        return (
          targetNode.properties.traitId === condition.trait ||
          targetNode.id === `trait.${condition.trait}`
        );
      });
      return !hasTrait;
    }

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
      const locationId = agent.properties.locationId as string | undefined;
      if (!locationId) return false;
      const loc = graph.getNode(locationId);
      if (!loc) return false;
      return loc.properties.regionId === condition.region;
    }

    case 'agent_not_in_region': {
      const agent = graph.getNode(agentId);
      if (!agent) return false;
      const locationId = agent.properties.locationId as string | undefined;
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
