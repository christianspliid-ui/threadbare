/**
 * Encounter Event Nodes (TB-077 Layer 1)
 *
 * Promotes encounter outcomes from ephemeral flat-array state to durable
 * `event` nodes in the world graph. Creates `participated_in` (agent -> event)
 * and `occurred_at` (event -> location) edges, enabling graph-queryable
 * encounter history for prose enrichment, location flavor, and agent biography.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { EncounterProgress } from '../types/encounter';
import type { OutcomeType } from '../types/resolution';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { isActionStepBranch } from '../types/unifiedAction';
import { RARITY_TO_THREAT, CRUD_TO_ENCOUNTER_TYPE } from './encounterCache';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';

// ─── Constants ───────────────────────────────────────────────────────

/** Feature flag for event node creation */
export const ENCOUNTER_EVENT_ENABLED = true;

/** Node count at which to investigate archival */
export const ENCOUNTER_EVENT_PROFILE_THRESHOLD = 5000;

/** Ring buffer cap per location (if archival enabled) */
export const EVENT_MAX_PER_LOCATION = 50;

/** Ticks before event is eligible for removal (if TTL archival enabled) */
export const EVENT_ARCHIVE_TTL = 200;

/** ID prefix for encounter event nodes */
export const EVENT_NODE_ID_PREFIX = 'evt_';

/** Max recent events to consider for prose enrichment */
export const EVENT_PROSE_HISTORY_DEPTH = 5;

/** PRNG chance of referencing a past encounter in current prose */
export const EVENT_PROSE_CALLBACK_CHANCE = 0.3;

/** Minimum ticks between an event and when it can be referenced */
export const EVENT_PROSE_MIN_TICK_GAP = 5;

// ─── Event Node Creation ─────────────────────────────────────────────

export interface CreateEncounterEventParams {
  graph: WorldGraph;
  progress: EncounterProgress;
  template: UnifiedActionTemplate;
  stepIndex: number;
  outcomeType: OutcomeType;
  tick: number;
  rewardInstanceId?: string;
  tierPromotionOccurred: boolean;
}

/**
 * Create an encounter event node in the graph after an encounter step resolves.
 * Adds `participated_in` edges (agent -> event, target -> event for social)
 * and `occurred_at` edge (event -> location).
 *
 * Fail-soft: logs warnings and returns undefined on any error.
 * Event node creation is a write-only side effect — encounter resolution
 * is unaffected if this fails.
 */
export function createEncounterEventNode(
  params: CreateEncounterEventParams,
): string | undefined {
  if (!ENCOUNTER_EVENT_ENABLED) return undefined;

  const { graph, progress, template, stepIndex, outcomeType, tick, rewardInstanceId, tierPromotionOccurred } = params;

  const stepOrBranch = template.steps[stepIndex];
  if (!stepOrBranch) return undefined;
  const step = isActionStepBranch(stepOrBranch) ? stepOrBranch.fallback : stepOrBranch;
  const stepLabel = `Step ${stepIndex + 1}`;

  const eventNodeId = `${EVENT_NODE_ID_PREFIX}${progress.actorId}_${tick}_${stepIndex}`;

  // ── Create event node ──
  try {
    graph.addNode({
      id: eventNodeId,
      type: 'event',
      name: `${template.name} (${stepLabel})`,
      properties: {
        eventType: 'encounter_outcome',
        templateId: template.id,
        templateName: template.name,
        encounterType: CRUD_TO_ENCOUNTER_TYPE[template.crudType] ?? 'explore',
        stepIndex,
        stepName: stepLabel,
        outcome: outcomeType,
        reachTested: step.reach,
        threatRating: RARITY_TO_THREAT[template.rarityTier] ?? 'moderate',
        ...(template.sphereAffinity && { sphereAffinity: template.sphereAffinity }),
        tick,
        tierPromotionOccurred,
        ...(rewardInstanceId && { rewardGranted: rewardInstanceId }),
        ...(progress.targetAgentId && { targetAgentId: progress.targetAgentId }),
      },
    });
  } catch (err) {
    // Fail-soft: duplicate ID or other graph error — skip node creation
    console.warn(`[EncounterEventNode] Failed to create event node ${eventNodeId}:`, err);
    return undefined;
  }

  // ── Add participated_in edge (primary actor -> event) ──
  try {
    graph.addEdge({
      id: `${progress.actorId}_participated_in_${eventNodeId}`,
      source: progress.actorId,
      target: eventNodeId,
      type: 'participated_in',
      properties: {
        role: 'primary',
        outcome: outcomeType,
        tick,
      },
    });
  } catch (err) {
    console.warn(`[EncounterEventNode] Failed to create participated_in edge for ${progress.actorId}:`, err);
  }

  // ── Add participated_in edge (target actor -> event, social encounters) ──
  if (progress.targetAgentId) {
    try {
      graph.addEdge({
        id: `${progress.targetAgentId}_participated_in_${eventNodeId}`,
        source: progress.targetAgentId,
        target: eventNodeId,
        type: 'participated_in',
        properties: {
          role: 'target',
          outcome: outcomeType,
          tick,
        },
      });
    } catch (err) {
      console.warn(`[EncounterEventNode] Failed to create participated_in edge for target ${progress.targetAgentId}:`, err);
    }
  }

  // ── Add occurred_at edge (event -> location) ──
  const locEdges = graph.getOutgoingEdges(progress.actorId, 'located_at');
  const locationId = locEdges[0]?.target;
  if (locationId) {
    try {
      const locationNode = graph.getNode(locationId);
      const sublocationId = locationNode?.properties?.parentLocationId as string | undefined;
      graph.addEdge({
        id: `${eventNodeId}_occurred_at_${locationId}`,
        source: eventNodeId,
        target: locationId,
        type: 'occurred_at',
        properties: {
          tick,
          ...(sublocationId && { sublocationId }),
        },
      });
    } catch (err) {
      console.warn(`[EncounterEventNode] Failed to create occurred_at edge for ${eventNodeId}:`, err);
    }
  }

  // ── Trace ──
  emitTrace({
    category: 'encounter_resolution',
    event: 'event_node_created',
    tick,
    agentId: progress.actorId,
    agentName: graph.getNode(progress.actorId)?.name ?? '?',
    eventNodeId,
    templateId: template.id,
    stepIndex,
    outcome: outcomeType,
    locationId: locationId ?? '?',
    summary: `Event node ${eventNodeId} created for ${template.name} step ${stepIndex} (${outcomeType})`,
  } as TraceEntry);

  return eventNodeId;
}

// ─── Unified Action Event Node Creation (THR-143) ────────────────────

export interface CreateUnifiedActionEventParams {
  graph: WorldGraph;
  actorId: string;
  targetAgentId?: string;
  templateId: string;
  templateName: string;
  stepIndex: number;
  stepReach?: string;
  outcome: string;
  tick: number;
  tierPromotionOccurred?: boolean;
}

/**
 * Create an encounter event node in the graph for a unified-action step resolution.
 * Mirrors createEncounterEventNode but accepts unified action data instead of
 * EncounterProgress+EncounterTemplate, since unified actions don't carry those types.
 *
 * Fail-soft: returns undefined on any error. Encounter resolution is unaffected.
 */
export function createUnifiedActionEventNode(
  params: CreateUnifiedActionEventParams,
): string | undefined {
  if (!ENCOUNTER_EVENT_ENABLED) return undefined;

  const { graph, actorId, targetAgentId, templateId, templateName, stepIndex, stepReach, outcome, tick, tierPromotionOccurred } = params;

  const eventNodeId = `${EVENT_NODE_ID_PREFIX}${actorId}_${tick}_${stepIndex}`;

  // ── Create event node ──
  try {
    graph.addNode({
      id: eventNodeId,
      type: 'event',
      name: `${templateName} (step ${stepIndex})`,
      properties: {
        eventType: 'encounter_outcome',
        templateId,
        templateName,
        stepIndex,
        outcome,
        ...(stepReach && { reachTested: stepReach }),
        tick,
        tierPromotionOccurred: tierPromotionOccurred ?? false,
        ...(targetAgentId && { targetAgentId }),
      },
    });
  } catch (err) {
    console.warn(`[EncounterEventNode] Failed to create unified event node ${eventNodeId}:`, err);
    return undefined;
  }

  // ── Add participated_in edge (primary actor -> event) ──
  try {
    graph.addEdge({
      id: `${actorId}_participated_in_${eventNodeId}`,
      source: actorId,
      target: eventNodeId,
      type: 'participated_in',
      properties: { role: 'primary', outcome, tick },
    });
  } catch (err) {
    console.warn(`[EncounterEventNode] Failed to add participated_in edge for ${actorId}:`, err);
  }

  // ── Add participated_in edge (target actor -> event, if different from actor) ──
  if (targetAgentId && targetAgentId !== actorId) {
    try {
      graph.addEdge({
        id: `${targetAgentId}_participated_in_${eventNodeId}`,
        source: targetAgentId,
        target: eventNodeId,
        type: 'participated_in',
        properties: { role: 'target', outcome, tick },
      });
    } catch (err) {
      console.warn(`[EncounterEventNode] Failed to add participated_in edge for target ${targetAgentId}:`, err);
    }
  }

  // ── Add occurred_at edge (event -> actor's current location) ──
  const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
  const locationId = locEdges[0]?.target;
  if (locationId) {
    try {
      graph.addEdge({
        id: `${eventNodeId}_occurred_at_${locationId}`,
        source: eventNodeId,
        target: locationId,
        type: 'occurred_at',
        properties: { tick },
      });
    } catch (err) {
      console.warn(`[EncounterEventNode] Failed to add occurred_at edge for ${eventNodeId}:`, err);
    }
  }

  emitTrace({
    category: 'encounter_resolution',
    event: 'event_node_created',
    tick,
    agentId: actorId,
    agentName: graph.getNode(actorId)?.name ?? '?',
    eventNodeId,
    templateId,
    stepIndex,
    outcome,
    locationId: locationId ?? '?',
    summary: `Unified event node ${eventNodeId} created for ${templateName} step ${stepIndex} (${outcome})`,
  } as TraceEntry);

  return eventNodeId;
}

// ─── Graph Query Utilities ───────────────────────────────────────────

/**
 * Get recent encounter events that occurred at a location.
 * Walks `occurred_at` incoming edges on the location node.
 */
export function getLocationEncounterHistory(
  graph: WorldGraph,
  locationId: string,
  maxResults: number = EVENT_PROSE_HISTORY_DEPTH,
): GraphNode[] {
  const edges = graph.getIncomingEdges(locationId, 'occurred_at');
  return edges
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => n != null && n.properties.eventType === 'encounter_outcome')
    .sort((a, b) => (b.properties.tick as number) - (a.properties.tick as number))
    .slice(0, maxResults);
}

/**
 * Get recent encounter events an agent participated in.
 * Walks `participated_in` outgoing edges on the agent node.
 */
export function getAgentEncounterHistory(
  graph: WorldGraph,
  agentId: string,
  maxResults: number = EVENT_PROSE_HISTORY_DEPTH,
): GraphNode[] {
  const edges = graph.getOutgoingEdges(agentId, 'participated_in');
  return edges
    .map(e => graph.getNode(e.target))
    .filter((n): n is GraphNode => n != null && n.properties.eventType === 'encounter_outcome')
    .sort((a, b) => (b.properties.tick as number) - (a.properties.tick as number))
    .slice(0, maxResults);
}
