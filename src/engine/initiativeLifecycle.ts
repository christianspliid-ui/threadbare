// src/engine/initiativeLifecycle.ts
// Initiative start/stop helpers used by phaseAgentDecision and phaseInitiativeProgress (THR-51).
// Functions here mutate the graph — callers are responsible for fail-soft wrapping.

import type { WorldGraph } from './graph';
import type { InitiativeCandidate, InitiativeProgress } from '../types/initiative';
import { emitTrace } from './traceBuffer';

/**
 * Start an initiative: deducts wealthCost, sets activeInitiative on agent node,
 * consumes any one-time inspire bonus, emits initiative_started trace.
 *
 * @returns The created InitiativeProgress record (also stored on node).
 */
export function startInitiative(
  graph: WorldGraph,
  candidate: InitiativeCandidate,
  tick: number,
  rng: () => number,
): InitiativeProgress {
  const { agentId, locationId, template } = candidate;
  const agentNode = graph.getNode(agentId);
  if (!agentNode) throw new Error(`Agent ${agentId} not found`);

  // Deduct wealth cost
  const currentWealth = (agentNode.properties.wealth as number | undefined) ?? 0;
  agentNode.properties.wealth = Math.max(0, currentWealth - template.wealthCost);

  // Consume one-time inspire bonus
  if (agentNode.properties.initiativeInspireBonus != null) {
    agentNode.properties.initiativeInspireBonus = undefined;
  }

  // Compute duration with variance: baseDuration + random(0, durationVariance)
  const variance = template.durationVariance > 0
    ? Math.floor(rng() * (template.durationVariance + 1))
    : 0;
  const duration = template.baseDuration + variance;
  const targetCompletionTick = tick + duration;
  const occupiedUntilTick = tick + template.checkInterval;

  // Generate a short deterministic ID
  const initiativeId = `init-${agentId.slice(-6)}-${tick}-${Math.floor(rng() * 65536).toString(16)}`;

  const progress: InitiativeProgress = {
    templateId: template.id,
    initiativeId,
    actorId: agentId,
    locationId,
    startedTick: tick,
    targetCompletionTick,
    occupiedUntilTick,
    status: 'active',
    wealthInvested: template.wealthCost,
    checkpoints: [],
    sphereColoring: template.sphereAffinity,
  };

  agentNode.properties.activeInitiative = progress;

  emitTrace({
    category: 'initiative_started',
    tick,
    agentId,
    initiativeId,
    templateId: template.id,
    locationId,
    targetCompletionTick,
    finalScore: candidate.finalScore,
    summary: `${agentNode.name} begins initiative: ${template.name}`,
  });

  return progress;
}
