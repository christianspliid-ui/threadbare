/**
 * Victory Mandate Evaluation — graph-state condition checking
 * and 3-stage progression tracking.
 */
import type { WorldGraph } from './graph';
import type {
  MandateDefinition,
  MandateState,
  MandateStage,
  MandateCondition,
} from '../types/mandate';

const STAGE_ORDER: MandateStage[] = ['setup', 'escalation', 'culmination'];

/**
 * Create initial mandate state.
 */
export function createMandateState(mandateId: string, tick: number): MandateState {
  return {
    mandateId,
    currentStage: 'setup',
    progress: 0,
    completed: false,
    failed: false,
    assignedTick: tick,
    stageCompletedTicks: {},
  };
}

/**
 * Evaluate a single mandate condition against the graph.
 *
 * Supported condition types:
 * - node_count: count nodes with specific edges matching criteria
 * - edge_count: count edges of a type
 * - sphere_weight: check cosmology sphere dominance (future)
 * - actor_tier: check an actor's influence tier (future)
 * - custom: always false (placeholder for narrative mandates)
 */
export function evaluateCondition(
  graph: WorldGraph,
  condition: MandateCondition,
  ascendantId: string,
): boolean {
  switch (condition.type) {
    case 'node_count': {
      const { edgeType, edgeTarget, minTier, minCount } = condition.params as {
        nodeType: string;
        edgeType: string;
        edgeTarget: string;
        minTier?: number;
        minCount: number;
      };

      // Find all edges of the specified type pointing to the target
      const targetNode = graph.getNode(edgeTarget as string);
      if (!targetNode) return false;

      const incomingEdges = graph.getIncomingEdges(edgeTarget as string)
        .filter(e => e.type === edgeType);

      // Filter by tier if specified
      const qualifying = minTier != null
        ? incomingEdges.filter(e => (e.properties.tier as number) >= minTier)
        : incomingEdges;

      return qualifying.length >= (minCount as number);
    }

    case 'edge_count': {
      const { edgeType, minCount } = condition.params as {
        edgeType: string;
        minCount: number;
      };
      const allEdges = graph.getAllEdges().filter(e => e.type === edgeType);
      return allEdges.length >= minCount;
    }

    case 'actor_tier': {
      const { minTier, minCount } = condition.params as {
        minTier: number;
        minCount: number;
      };
      const worshipEdges = graph.getIncomingEdges(ascendantId)
        .filter(e => e.type === 'worships' && (e.properties.tier as number) >= minTier);
      return worshipEdges.length >= minCount;
    }

    case 'sphere_weight': {
      const { sphere, minWeight, minRegions } = condition.params as {
        sphere: string;
        minWeight: number;
        minRegions: number;
      };
      const locations = graph.getNodesByType('location');
      let qualifyingRegions = 0;
      for (const loc of locations) {
        const sphereEdges = graph.getOutgoingEdges(loc.id, 'sphere_influence');
        const match = sphereEdges.find(e => {
          const targetNode = graph.getNode(e.target);
          return targetNode && targetNode.name.toLowerCase() === sphere;
        });
        if (match && (match.properties.weight as number) >= minWeight) {
          qualifyingRegions++;
        }
      }
      return qualifyingRegions >= minRegions;
    }

    case 'custom':
      // Narrative mandates require event-driven evaluation, not graph queries
      return false;

    default:
      return false;
  }
}

/**
 * Evaluate a mandate's current stage conditions and update progress.
 * Progress = fraction of conditions met in the current stage.
 */
export function evaluateMandate(
  graph: WorldGraph,
  mandate: MandateDefinition,
  state: MandateState,
  ascendantId: string,
  _tick: number,
): MandateState {
  if (state.completed || state.failed) return state;

  const stageIndex = STAGE_ORDER.indexOf(state.currentStage);
  const stageDef = mandate.stages[stageIndex];
  if (!stageDef || stageDef.conditions.length === 0) {
    // No conditions = auto-complete stage
    return { ...state, progress: 1.0 };
  }

  const results = stageDef.conditions.map(c => evaluateCondition(graph, c, ascendantId));
  const metCount = results.filter(Boolean).length;
  const progress = metCount / stageDef.conditions.length;

  return { ...state, progress };
}

/**
 * Advance the mandate to the next stage when current stage progress = 1.0.
 * If advancing from culmination, marks the mandate as completed.
 */
export function advanceMandateStage(state: MandateState, tick: number): MandateState {
  const stageIndex = STAGE_ORDER.indexOf(state.currentStage);
  const completedTicks = { ...state.stageCompletedTicks, [state.currentStage]: tick };

  if (stageIndex >= STAGE_ORDER.length - 1) {
    // Completing culmination = mandate complete
    return {
      ...state,
      completed: true,
      stageCompletedTicks: completedTicks,
    };
  }

  return {
    ...state,
    currentStage: STAGE_ORDER[stageIndex + 1],
    progress: 0,
    stageCompletedTicks: completedTicks,
  };
}
