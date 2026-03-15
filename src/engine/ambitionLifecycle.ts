/**
 * Ambition Lifecycle — evaluates milestone progress, completion, and abandonment.
 *
 * Pure evaluation functions: reads graph state and returns updated ambition status.
 * Does not modify graph — callers are responsible for applying changes.
 */
import type { AmbitionTemplate, ActiveAmbition, AmbitionStatus, GraphCondition } from '../types/ambition';
import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';

// ─── Graph Condition Evaluation ──────────────────────────────────

/**
 * Evaluate a single graph condition against the current graph state for an actor.
 * Returns true if the condition is met.
 */
export function evaluateGraphCondition(
  condition: GraphCondition,
  graph: WorldGraph,
  actorId: string,
): boolean {
  const actor = graph.getNode(actorId);
  if (!actor) return false;

  switch (condition.type) {
    case 'agent_reach_above': {
      const caps = actor.properties.domainCapabilities as Record<ReachDomain, number> | undefined;
      const value = caps?.[condition.reach] ?? 0;
      return value >= condition.threshold;
    }

    case 'agent_reach_below': {
      const caps = actor.properties.domainCapabilities as Record<ReachDomain, number> | undefined;
      const value = caps?.[condition.reach] ?? 0;
      return value <= condition.threshold;
    }

    case 'agent_has_bonds': {
      const edges = graph.getOutgoingEdges(actorId, 'relates_to');
      const matchCount = edges.filter(
        e => (e.properties.basis as string) === condition.basis,
      ).length;
      return matchCount >= condition.minCount;
    }

    case 'agent_controls_location': {
      const controlEdges = graph.getOutgoingEdges(actorId, 'controls');
      return controlEdges.some(e => {
        const targetNode = graph.getNode(e.target);
        return targetNode?.properties.locationType === condition.locationType;
      });
    }

    case 'agent_has_trait': {
      const traitEdges = graph.getOutgoingEdges(actorId, 'has_trait');
      return traitEdges.some(e => {
        const traitNode = graph.getNode(e.target);
        return traitNode?.name === condition.trait || traitNode?.id === condition.trait;
      });
    }

    case 'agent_lacks_trait': {
      const traitEdges = graph.getOutgoingEdges(actorId, 'has_trait');
      return !traitEdges.some(e => {
        const traitNode = graph.getNode(e.target);
        return traitNode?.name === condition.trait || traitNode?.id === condition.trait;
      });
    }

    case 'target_agent_eliminated': {
      // $-prefixed refs are symbolic — not evaluable without event context
      if (condition.targetRef.startsWith('$')) return false;
      const targetNode = graph.getNode(condition.targetRef);
      return !targetNode; // eliminated if node doesn't exist
    }

    case 'agent_in_region': {
      const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
      if (locEdges.length === 0) return false;
      const locNode = graph.getNode(locEdges[0].target);
      if (!locNode) return false;
      // Check if location is contained by the named region
      const regionEdges = graph.getIncomingEdges(locNode.id, 'contains');
      return regionEdges.some(e => {
        const regionNode = graph.getNode(e.source);
        return regionNode?.name === condition.region || regionNode?.properties.regionTag === condition.region;
      });
    }

    case 'agent_not_in_region': {
      const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
      if (locEdges.length === 0) return true; // not in any region
      const locNode = graph.getNode(locEdges[0].target);
      if (!locNode) return true;
      const regionEdges = graph.getIncomingEdges(locNode.id, 'contains');
      return !regionEdges.some(e => {
        const regionNode = graph.getNode(e.source);
        return regionNode?.name === condition.region || regionNode?.properties.regionTag === condition.region;
      });
    }
  }
}

// ─── Ambition Progress Evaluation ────────────────────────────────

export interface AmbitionEvaluationResult {
  readonly status: AmbitionStatus;
  readonly completedMilestones: readonly string[];
  readonly resolvedTick?: number;
}

/**
 * Evaluate an active ambition's progress against the current graph state.
 *
 * Checks:
 * 1. Abandonment triggers — if any fire, status becomes 'abandoned'
 * 2. Milestone conditions — newly completed milestones are added
 * 3. Completion rule — if enough milestones met, status becomes 'completed'
 *
 * Returns the updated status and milestone list (does not mutate anything).
 */
export function evaluateAmbitionProgress(
  template: AmbitionTemplate,
  active: ActiveAmbition,
  graph: WorldGraph,
  actorId: string,
  currentTick?: number,
): AmbitionEvaluationResult {
  // 1. Check abandonment triggers first
  for (const trigger of template.abandonmentTriggers) {
    if (evaluateGraphCondition(trigger.condition, graph, actorId)) {
      return {
        status: 'abandoned',
        completedMilestones: active.completedMilestones,
        resolvedTick: currentTick,
      };
    }
  }

  // 2. Evaluate milestones
  const completedMilestones = [...active.completedMilestones];
  for (const milestone of template.milestones) {
    if (completedMilestones.includes(milestone.id)) continue;
    if (evaluateGraphCondition(milestone.condition, graph, actorId)) {
      completedMilestones.push(milestone.id);
    }
  }

  // 3. Check completion rule
  const { requires, of: total } = template.completion;
  // Count how many of the template's milestones are completed
  const completedCount = template.milestones.filter(
    m => completedMilestones.includes(m.id),
  ).length;

  if (completedCount >= requires) {
    return {
      status: 'completed',
      completedMilestones,
      resolvedTick: currentTick,
    };
  }

  return {
    status: 'active',
    completedMilestones,
  };
}
