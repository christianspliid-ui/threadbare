/**
 * Universal Encounter Visibility — TB-035 Phase 4.
 *
 * All threaded agents have visible encounters. Thread thickness
 * and court position determine what the player sees and can do.
 *
 * Integration: called from orchestrator during encounter processing.
 * Produces EncounterNotification entries; UI consumes them.
 */

import type { WorldGraph } from './graph';
import type { GameState, TickEvent } from '../types/gameState';
import type { ThreadEdgeProperties, CourtPosition } from '../types/influence';
import type { SphereName } from '../types/index';
import type {
  EncounterNotification,
  EncounterInterventionChoice,
  EncounterVisibilityDepth,
} from '../types/encounterVisibility';
import {
  RETINUE_VIGNETTE_TIMEOUT,
  ENCOUNTER_PEEK_COST,
  ENCOUNTER_BOOST_MIN,
  ENCOUNTER_BOOST_MAX,
  BOOST_TO_PROBABILITY_RATIO,
  PAUSE_MODE_MIN_TIER,
  ATTENTION_MODE_CHANGE_COST,
  VISIBILITY_BY_POSITION,
} from '../types/encounterVisibility';
import { getThreadsFrom, getAgentLocation } from './graphQueries';
import { emitTrace } from './traceBuffer';
import { getAnyEncounterById } from '../data/encounter-content';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { resolveStepDefinition } from './unifiedActionLifecycle';

// ─── Notification Generation ───────────────────────────────────────

/**
 * Get the visibility depth for a threaded agent based on court position.
 */
export function getVisibilityDepth(courtPosition: CourtPosition | null): EncounterVisibilityDepth {
  if (!courtPosition) return 'none';
  return VISIBILITY_BY_POSITION[courtPosition]?.proseDepth ?? 'none';
}

/**
 * Generate encounter intervention choices based on court position.
 */
export function generateInterventionChoices(
  courtPosition: CourtPosition | null,
  encounterName: string,
): EncounterInterventionChoice[] {
  if (!courtPosition) return [];

  const config = VISIBILITY_BY_POSITION[courtPosition];
  if (!config || config.maxChoices === 0) return [];

  const choices: EncounterInterventionChoice[] = [];

  if (courtPosition === 'the_first' || courtPosition === 'retinue') {
    // Supportive intervention
    choices.push({
      id: 'intervene_support',
      text: 'Tip the scales in their favor',
      essenceCost: ENCOUNTER_BOOST_MIN,
      probabilityBoost: BOOST_TO_PROBABILITY_RATIO * ENCOUNTER_BOOST_MIN,
      interventionType: 'supportive',
      godVoice: 'The thread hums with divine purpose.',
    });

    if (courtPosition === 'the_first') {
      // Coercive intervention (First only)
      choices.push({
        id: 'intervene_force',
        text: 'Pour divine power into the encounter',
        essenceCost: ENCOUNTER_BOOST_MAX,
        probabilityBoost: BOOST_TO_PROBABILITY_RATIO * ENCOUNTER_BOOST_MAX,
        interventionType: 'coercive',
        godVoice: 'My will be done.',
      });
    }

    // Let it play out
    choices.push({
      id: 'intervene_withdraw',
      text: 'Let it play out',
      essenceCost: 0,
      probabilityBoost: 0,
      interventionType: 'withdrawn',
    });
  }

  return choices.slice(0, config.maxChoices);
}

/**
 * Generate an encounter prose snippet based on visibility depth.
 */
export function generateEncounterProse(
  depth: EncounterVisibilityDepth,
  agentName: string,
  encounterName: string,
  locationName: string,
): string {
  switch (depth) {
    case 'full':
      return `${agentName} faces a critical moment — ${encounterName} unfolds at ${locationName}. ` +
        `The thread between god and mortal hums with tension. Every detail is visible through the divine connection: ` +
        `the fear in their eyes, the resolve in their stance, the weight of what must be decided.`;
    case 'medium':
      return `${agentName} enters ${encounterName} at ${locationName}. ` +
        `Through the thread, you sense the stakes — enough to intervene, if you choose.`;
    case 'peek':
      return `${agentName} enters ${encounterName} at ${locationName}.`;
    case 'none':
    default:
      return '';
  }
}

/**
 * Build an EncounterNotification for a threaded agent entering an encounter.
 */
export function buildEncounterNotification(
  agentId: string,
  agentName: string,
  encounterId: string,
  encounterName: string,
  locationName: string,
  courtPosition: CourtPosition | null,
  attentionMode: 'pause' | 'auto_resolve',
  tick: number,
  metadata?: Partial<Pick<EncounterNotification, 'kind' | 'sourceSystem' | 'stepIndex' | 'actionId' | 'stepId'>>,
): EncounterNotification | null {
  const depth = getVisibilityDepth(courtPosition);
  if (depth === 'none') return null;

  const prose = generateEncounterProse(depth, agentName, encounterName, locationName);
  const choices = generateInterventionChoices(courtPosition, encounterName);

  const autoResolveTick = attentionMode === 'auto_resolve'
    ? tick + RETINUE_VIGNETTE_TIMEOUT
    : null;

  return {
    id: `enc_notif_${agentId}_${encounterId}_${tick}`,
    agentId,
    agentName,
    courtPosition,
    encounterId,
    encounterName,
    kind: metadata?.kind ?? 'encounter',
    ...metadata,
    prose,
    choices,
    createdTick: tick,
    autoResolveTick,
    viewed: false,
    resolved: false,
  };
}

// ─── Encounter Intervention ────────────────────────────────────────

/**
 * Apply an encounter intervention choice.
 * Returns essence cost and probability boost.
 */
export function applyEncounterIntervention(
  graph: WorldGraph,
  ascendantId: string,
  agentId: string,
  encounterId: string,
  choice: EncounterInterventionChoice,
  threadEdgeId: string,
  tick: number,
): { essenceSpent: number; probabilityBoost: number } {
  // Update intervention tracking on thread edge
  const edge = graph.getEdge(threadEdgeId);
  if (edge) {
    const props = edge.properties as ThreadEdgeProperties;
    const tracking = (props.interventionTracking ?? {}) as Record<string, number>;

    const totalVignettes = (tracking.totalVignettes ?? 0) + 1;
    const playerIntervened = (tracking.playerIntervened ?? 0) +
      (choice.interventionType !== 'withdrawn' ? 1 : 0);
    const playerWithdrew = (tracking.playerWithdrew ?? 0) +
      (choice.interventionType === 'withdrawn' ? 1 : 0);
    const supportiveCount = (tracking.supportiveCount ?? 0) +
      (choice.interventionType === 'supportive' ? 1 : 0);
    const coerciveCount = (tracking.coerciveCount ?? 0) +
      (choice.interventionType === 'coercive' ? 1 : 0);
    const essenceOnEncounters = (tracking.essenceSpentOnEncounters ?? 0) + choice.essenceCost;

    graph.updateEdge(threadEdgeId, {
      properties: {
        interventionTracking: {
          totalVignettes,
          playerIntervened,
          playerWithdrew,
          interventionRatio: playerIntervened / totalVignettes,
          supportiveCount,
          coerciveCount,
          essenceSpentOnEncounters: essenceOnEncounters,
        },
      },
    });
  }

  // Emit trace
  emitTrace({
    type: 'encounter_intervention',
    tick,
    agentId,
    encounterId,
    courtPosition: (edge?.properties as ThreadEdgeProperties)?.courtPosition ?? null,
    choiceId: choice.id,
    essenceSpent: choice.essenceCost,
    probabilityBoost: choice.probabilityBoost,
    interventionType: choice.interventionType,
  });

  return {
    essenceSpent: choice.essenceCost,
    probabilityBoost: choice.probabilityBoost,
  };
}

// ─── Attention Mode Toggle ─────────────────────────────────────────

/**
 * Toggle a thread's attention mode between pause and auto_resolve.
 * Returns the essence cost or null if the toggle is blocked.
 */
export function toggleAttentionMode(
  graph: WorldGraph,
  threadEdgeId: string,
  ascendantId: string,
  tick: number,
): { newMode: 'pause' | 'auto_resolve'; essenceCost: number } | null {
  const edge = graph.getEdge(threadEdgeId);
  if (!edge) return null;

  const props = edge.properties as ThreadEdgeProperties;
  const currentMode = props.attentionMode ?? 'auto_resolve';
  const newMode = currentMode === 'pause' ? 'auto_resolve' : 'pause';

  // Check tier requirement for pause mode
  if (newMode === 'pause' && props.tier < PAUSE_MODE_MIN_TIER) {
    return null; // Thread too thin for pause mode
  }

  graph.updateEdge(threadEdgeId, {
    properties: { attentionMode: newMode },
  });

  emitTrace({
    type: 'attention_mode_change',
    tick,
    ascendantId,
    agentId: edge.target,
    previousMode: currentMode,
    newMode,
    essenceCost: ATTENTION_MODE_CHANGE_COST,
  });

  return { newMode, essenceCost: ATTENTION_MODE_CHANGE_COST };
}

// ─── Orchestrator Phase ────────────────────────────────────────────

/**
 * Phase: check for encounter notifications for threaded agents.
 *
 * Scans all active encounters against threaded agents.
 * Produces EncounterNotification entries for the UI.
 */
export function phaseEncounterVisibility(
  state: GameState,
): { notifications: EncounterNotification[]; events: TickEvent[] } {
  const { graph, ascendantId, tick } = state;
  const notifications: EncounterNotification[] = [];
  const events: TickEvent[] = [];

  // Get all threads from the ascendant
  const threads = getThreadsFrom(graph, ascendantId);
  if (threads.length === 0) return { notifications, events };

  // Build a map of threaded agent IDs → thread info.
  // Include all threaded agents regardless of courtPosition;
  // agents without an explicit position default to 'retinue' behaviour.
  const threadedAgents = new Map<string, { threadEdgeId: string; props: ThreadEdgeProperties }>();
  for (const edge of threads) {
    const props = edge.properties as ThreadEdgeProperties;
    threadedAgents.set(edge.target, { threadEdgeId: edge.id, props });
  }

  // Build a set of already-pending notification keys to avoid duplicates
  const existingNotifKeys = new Set(
    (state.encounterNotifications ?? [])
      .filter(n => !n.resolved)
      .map(n => `${n.kind ?? 'encounter'}:${n.sourceSystem ?? 'legacy_encounter'}:${n.agentId}:${n.encounterId}:${n.actionId ?? 'legacy'}:${n.stepIndex ?? 0}`),
  );

  // Agent encounters live in encounterProgress (the old-style NPC encounter pipeline).
  for (const ep of state.encounterProgress) {
    if (ep.status !== 'active') continue;

    const threadInfo = threadedAgents.get(ep.actorId);
    if (!threadInfo) continue;

    // Skip if we already have a pending notification for this agent + encounter
    const stepIndex = ep.currentEncounterIndex;
    const notifKey = `encounter:legacy_encounter:${ep.actorId}:${ep.encounterId}:legacy:${stepIndex}`;
    if (existingNotifKeys.has(notifKey)) continue;

    // The First gets both journey beat vignettes (doom-clock) AND encounter-step notifications
    const agentNode = graph.getNode(ep.actorId);
    if (!agentNode) continue;

    const template = getAnyEncounterById(ep.encounterId);
    const templateName = template?.name ?? 'an encounter';

    const locationNode = getAgentLocation(graph, ep.actorId);
    const locationName = locationNode?.name ?? 'unknown location';

    // Agents without an explicit courtPosition default to retinue behaviour
    const courtPosition = threadInfo.props.courtPosition ?? 'retinue';
    const defaultMode = VISIBILITY_BY_POSITION[courtPosition]?.defaultAttentionMode ?? 'auto_resolve';

    const notification = buildEncounterNotification(
      ep.actorId,
      agentNode.name,
      ep.encounterId,
      templateName,
      locationName,
      courtPosition,
      threadInfo.props.attentionMode ?? defaultMode,
      tick,
      {
        sourceSystem: 'legacy_encounter',
        stepIndex,
      },
    );

    if (notification) {
      notifications.push(notification);

      events.push({
        id: `evt_enc_vis_${ep.actorId}_${tick}`,
        tick,
        type: 'journey_beat',
        message: `${agentNode.name} enters an encounter`,
        significance: courtPosition === 'retinue' ? 0.7 : 0.4,
        actorId: ep.actorId,
      });
    }
  }

  for (const action of state.unifiedActions ?? []) {
    if (action.resolved) continue;

    const encounter = getAnyEncounterById(action.templateId);
    const unifiedTemplate = getUnifiedTemplateById(action.templateId);
    if (!encounter || !unifiedTemplate) continue;

    const threadInfo = threadedAgents.get(action.actorId);
    if (!threadInfo) continue;

    const stepIndex = action.currentStep;
    const notifKey = `encounter:unified_action:${action.actorId}:${action.templateId}:${action.actionId}:${stepIndex}`;
    if (existingNotifKeys.has(notifKey)) continue;

    const agentNode = graph.getNode(action.actorId);
    if (!agentNode) continue;

    const locationNode = getAgentLocation(graph, action.actorId);
    const locationName = locationNode?.name ?? 'unknown location';
    const courtPosition = threadInfo.props.courtPosition ?? 'retinue';
    const defaultMode = VISIBILITY_BY_POSITION[courtPosition]?.defaultAttentionMode ?? 'auto_resolve';
    const currentStep = resolveStepDefinition(unifiedTemplate, stepIndex, action.choiceHistory);

    const notification = buildEncounterNotification(
      action.actorId,
      agentNode.name,
      action.templateId,
      encounter.name,
      locationName,
      courtPosition,
      threadInfo.props.attentionMode ?? defaultMode,
      tick,
      {
        sourceSystem: 'unified_action',
        stepIndex,
        actionId: action.actionId,
        stepId: currentStep.id,
      },
    );

    if (notification) {
      notifications.push(notification);
      events.push({
        id: `evt_enc_vis_unified_${action.actorId}_${stepIndex}_${tick}`,
        tick,
        type: 'journey_beat',
        message: `${agentNode.name} enters ${encounter.name} step ${stepIndex + 1}`,
        significance: courtPosition === 'retinue' ? 0.7 : 0.4,
        actorId: action.actorId,
      });
    }
  }

  for (const action of state.unifiedActions ?? []) {
    if (!action.resolved || !action.aftermathSummary) continue;

    const encounter = getAnyEncounterById(action.templateId);
    if (!encounter) continue;

    const threadInfo = threadedAgents.get(action.actorId);
    if (!threadInfo) continue;

    const notifKey = `aftermath:unified_action:${action.actorId}:${action.templateId}:${action.actionId}:${action.currentStep}`;
    if (existingNotifKeys.has(notifKey)) continue;

    const agentNode = graph.getNode(action.actorId);
    if (!agentNode) continue;

    const locationNode = getAgentLocation(graph, action.actorId);
    const locationName = locationNode?.name ?? 'unknown location';
    const courtPosition = threadInfo.props.courtPosition ?? 'retinue';
    const defaultMode = VISIBILITY_BY_POSITION[courtPosition]?.defaultAttentionMode ?? 'auto_resolve';

    const notification = buildEncounterNotification(
      action.actorId,
      agentNode.name,
      action.templateId,
      encounter.name,
      locationName,
      courtPosition,
      threadInfo.props.attentionMode ?? defaultMode,
      tick,
      {
        kind: 'aftermath',
        sourceSystem: 'unified_action',
        stepIndex: action.currentStep,
        actionId: action.actionId,
      },
    );

    if (notification) {
      notifications.push({
        ...notification,
        prose: action.aftermathSummary.overview,
        choices: [],
      });
      events.push({
        id: `evt_enc_aftermath_${action.actorId}_${tick}`,
        tick,
        type: 'journey_beat',
        message: `${agentNode.name} lives with the aftermath of ${encounter.name}`,
        significance: courtPosition === 'retinue' ? 0.7 : 0.4,
        actorId: action.actorId,
      });
    }
  }

  return { notifications, events };
}
