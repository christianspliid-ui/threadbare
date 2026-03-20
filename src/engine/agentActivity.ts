/**
 * Agent Activity Label — derives a short activity string for each agent
 * based on movement state, unified actions, and legacy encounter progress.
 */

import type { WorldGraph } from './graph';
import type { MovementState } from '../types/movement';
import type { EncounterProgress } from '../types/encounter';
import type { UnifiedAction } from '../types/unifiedAction';
import type { RetinueAgent } from './retinue';
import { getAnyEncounterById } from '../data/encounter-content';
import { getUnifiedTemplateById } from '../data/unified-action-templates';

/** Derive a display label for what an agent is currently doing. */
export function getAgentActivityLabel(
  agentId: string,
  graph: WorldGraph,
  unifiedActions: readonly UnifiedAction[],
  encounterProgress: readonly EncounterProgress[],
): string {
  // 1. Check unified actions first (newer system, takes priority)
  const activeAction = unifiedActions.find(
    a => a.actorId === agentId && !a.resolved,
  );
  if (activeAction) {
    const template = getUnifiedTemplateById(activeAction.templateId);
    const name = template?.name ?? 'Action';
    const totalSteps = template?.steps.length ?? 1;
    if (totalSteps > 1) {
      return `${name} (${activeAction.currentStep + 1}/${totalSteps})`;
    }
    return name;
  }

  // 2. Check legacy encounter progress
  const activeEncounter = encounterProgress.find(
    p => p.actorId === agentId && p.status === 'active',
  );
  if (activeEncounter) {
    const encounter = getAnyEncounterById(activeEncounter.encounterId);
    const name = encounter?.name ?? 'Encounter';
    const totalSteps = encounter?.steps.length ?? 1;
    return `${name} (${activeEncounter.currentEncounterIndex + 1}/${totalSteps})`;
  }

  // 3. Check movement state
  const agentNode = graph.getNode(agentId);
  if (agentNode) {
    const movementState = (agentNode.properties as Record<string, unknown>).movementState as MovementState | undefined;
    if (movementState && movementState.movementQueue.length > 0) {
      const destNode = graph.getNode(movementState.destinationId);
      const destName = destNode?.name ?? 'somewhere';
      return `Going to ${destName}`;
    }
  }

  // 4. Default
  return 'Idling';
}

/** Enrich retinue agents with activity labels. Mutates the array in place for performance. */
export function enrichRetinueWithActivity(
  agents: RetinueAgent[],
  graph: WorldGraph,
  unifiedActions: readonly UnifiedAction[],
  encounterProgress: readonly EncounterProgress[],
): RetinueAgent[] {
  for (const agent of agents) {
    agent.activityLabel = getAgentActivityLabel(
      agent.id,
      graph,
      unifiedActions,
      encounterProgress,
    );
  }
  return agents;
}
