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
import { getThreadsFrom, getAgentLocation, getAgentLocationId, getAvatarsOf } from './graphQueries';
import { emitTrace } from './traceBuffer';
import { getAnyEncounterById } from '../data/encounter-content';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { resolveStepDefinition } from './unifiedActionLifecycle';
import { resolveLocationToHex } from './encounterAwareness';
import { isForceFullEncounterVisibility } from './debugVisibilityOverride';
import { stepOutcomeToOutcomeBand } from '../data/outcome-band-content';

// ─── Notification Generation ───────────────────────────────────────

/**
 * Get the visibility depth for a threaded agent based on court position.
 */
export function getVisibilityDepth(courtPosition: CourtPosition | null): EncounterVisibilityDepth {
  if (!courtPosition) return 'none';
  if (isForceFullEncounterVisibility() && courtPosition !== 'dormant') return 'full';
  return VISIBILITY_BY_POSITION[courtPosition]?.proseDepth ?? 'none';
}

/**
 * Generate encounter intervention choices based on court position.
 *
 * THR-880: while the force-full-visibility debug override is active, every
 * threaded (non-dormant) position gets treated as `the_first` here — the
 * full 3-choice set — so testing sessions aren't limited to Watched's
 * observation-only view.
 */
export function generateInterventionChoices(
  courtPosition: CourtPosition | null,
  encounterName: string,
): EncounterInterventionChoice[] {
  if (!courtPosition) return [];

  const effectivePosition: CourtPosition =
    isForceFullEncounterVisibility() && courtPosition !== 'dormant' ? 'the_first' : courtPosition;

  const config = VISIBILITY_BY_POSITION[effectivePosition];
  if (!config || config.maxChoices === 0) return [];

  const choices: EncounterInterventionChoice[] = [];

  if (effectivePosition === 'the_first' || effectivePosition === 'retinue') {
    // Supportive intervention
    choices.push({
      id: 'intervene_support',
      text: 'Tip the scales in their favor',
      essenceCost: ENCOUNTER_BOOST_MIN,
      probabilityBoost: BOOST_TO_PROBABILITY_RATIO * ENCOUNTER_BOOST_MIN,
      interventionType: 'supportive',
      godVoice: 'The thread hums with divine purpose.',
    });

    if (effectivePosition === 'the_first') {
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
/**
 * Participants an encounter notification anchors to (THR-664).
 *
 * The actor is always a participant. An actor-typed target joins them, so one
 * notification can badge both threaded rows instead of being duplicated per agent.
 * Non-actor targets (locations, artifacts, resources) are ignored — they have no
 * thread row that renders encounter badges.
 */
export function resolveEncounterParticipantIds(
  graph: WorldGraph,
  actorId: string,
  targetId: string | undefined,
): string[] {
  if (!targetId || targetId === actorId) return [actorId];
  if (graph.getNode(targetId)?.type !== 'actor') return [actorId];
  return [actorId, targetId];
}

export function buildEncounterNotification(
  agentId: string,
  agentName: string,
  encounterId: string,
  encounterName: string,
  locationName: string,
  courtPosition: CourtPosition | null,
  attentionMode: 'pause' | 'auto_resolve',
  tick: number,
  metadata?: Partial<Pick<EncounterNotification, 'kind' | 'sourceSystem' | 'stepIndex' | 'actionId' | 'stepId' | 'narrativeTag' | 'totalSteps' | 'outcomeBand' | 'hexCol' | 'hexRow' | 'locationLabel' | 'participantIds'>>,
): EncounterNotification | null {
  const depth = getVisibilityDepth(courtPosition);
  if (depth === 'none') return null;

  const prose = generateEncounterProse(depth, agentName, encounterName, locationName);
  const choices = generateInterventionChoices(courtPosition, encounterName);

  // THR-880: forced full visibility always pops the modal immediately rather
  // than silently auto-resolving after RETINUE_VIGNETTE_TIMEOUT ticks —
  // `shouldAutoOpenEncounterNotification` treats `autoResolveTick === null`
  // as "open now."
  const forceFull = isForceFullEncounterVisibility() && courtPosition !== 'dormant';
  const autoResolveTick = !forceFull && attentionMode === 'auto_resolve'
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

/**
 * Retire `auto_resolve` step notifications whose deadline has passed (THR-1068).
 *
 * **The consumer `autoResolveTick` never had.** `buildEncounterNotification`
 * has stamped the deadline on every `auto_resolve` notification since TB-035,
 * and until now every reader treated it as a flag or a label — "do not open
 * now" (`shouldAutoOpenEncounterNotification`), a countdown
 * (`EncounterVeil`), a debug string. Nothing read it back as a deadline, so
 * `RETINUE_VIGNETTE_TIMEOUT` named a timeout that had never fired. Measured on
 * `?view=game&seeded&size=medium` at tick 113: three of Kael Thornweaver's
 * notifications sat 32, 36 and 37 ticks past their deadline, all
 * `viewed: false, resolved: false`, and the thread row's badge climbed 2 → 3
 * and never fell.
 *
 * **Expire, not queue — this is a technical verdict, not a design call.** The
 * intent is recorded in four places in the tree, and all four agree: the
 * attention mode is named `auto_resolve`; `RETINUE_VIGNETTE_TIMEOUT` is
 * documented "Ticks before retinue vignette auto-resolves"; `autoResolveTick`
 * is documented "Tick when auto-resolve fires (null for pause mode)"; and
 * THR-880's comment above describes forced visibility as popping the modal
 * "rather than silently auto-resolving after RETINUE_VIGNETTE_TIMEOUT ticks."
 * Nothing anywhere describes an unattended beat as queueing.
 *
 * **Flipping `resolved` IS the normal path — there is no consequence left to
 * fire.** A notification is a player-facing record, never the mechanism by
 * which an encounter resolves: the `UnifiedAction` advances and concludes in
 * the tick pipeline whether or not anyone ever looks. Every existing resolve
 * site — disregard, acknowledge-aftermath, intervention commit — writes this
 * same single flag and mutates nothing else. So expiry costs the player the
 * *offer to intervene* in a moment that has already passed, which is precisely
 * what choosing `auto_resolve` means, and costs the world nothing.
 *
 * **Aftermath notifications are deliberately exempt.** At this tier the badge
 * is the player's only route into a concluded beat (see `isBadgeWorthy`'s
 * THR-943 note), so expiring the conclusion record 8 ticks after it appears
 * would delete the only surface that reports what happened — narrative loss
 * (NFP #5) at the tier that opted out of interrupts precisely so outcomes
 * would be *reported* rather than shoved in front of them. An unread
 * conclusion badging its row is the badge doing its job. Aftermath records
 * still leave state via the orchestrator's `NOTIFICATION_RETENTION_TICKS`
 * trim, so their fate is deterministic too — it is just a different deadline.
 * They keep a non-null `autoResolveTick` because that field carries the
 * "do not auto-open" meaning as well, and nulling it would make every
 * aftermath interrupt at the one tier that must never be interrupted.
 *
 * **Scoped to `unified_action` because the legacy path's dedup would loop.**
 * `generateEncounterNotifications` keeps resolved records in its dedup key set
 * for `unified_action` and aftermath, so retiring one here is idempotent — the
 * record stays suppressed. Resolved *legacy* step records drop out of that set
 * by design, so expiring one while its `encounterProgress` is still active
 * would re-emit a fresh notification the next tick, which would expire, which
 * would re-emit: churn wearing a fix's clothes. THR-1069 tracks the legacy
 * half.
 *
 * Pure and deterministic: same notifications and tick in, same array out. The
 * input array is returned unchanged (by identity) when nothing expires, so the
 * caller can skip the state write.
 */
export function expireOverdueEncounterNotifications(
  notifications: readonly EncounterNotification[],
  tick: number,
): { notifications: readonly EncounterNotification[]; expiredIds: string[] } {
  const expiredIds: string[] = [];

  for (const notif of notifications) {
    if (isEncounterNotificationOverdue(notif, tick)) expiredIds.push(notif.id);
  }

  if (expiredIds.length === 0) return { notifications, expiredIds };

  const expired = new Set(expiredIds);
  return {
    notifications: notifications.map(notif =>
      expired.has(notif.id) ? { ...notif, resolved: true } : notif,
    ),
    expiredIds,
  };
}

/**
 * Has this notification's auto-resolve deadline passed?
 *
 * Exported so the badge/veil side can ask the same question the engine asks,
 * rather than re-deriving `tick >= autoResolveTick` with its own exemptions.
 */
export function isEncounterNotificationOverdue(
  notif: Pick<EncounterNotification, 'kind' | 'sourceSystem' | 'resolved' | 'autoResolveTick'>,
  tick: number,
): boolean {
  if (notif.resolved) return false;
  if (notif.autoResolveTick === null) return false;
  if (notif.kind === 'aftermath') return false;
  if (notif.sourceSystem !== 'unified_action') return false;
  return tick >= notif.autoResolveTick;
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
export interface ThreadedAgentEntry {
  threadEdgeId: string;
  props: ThreadEdgeProperties;
}

/**
 * Every agent the player currently holds a live thread to.
 *
 * Threading is the game's attention contract: an agent the ascendant is not
 * threaded to is not the player's business, and nothing about them should reach
 * a player-facing surface. Both the encounter-visibility phase and the
 * notification threading gate (THR-666) read this same map, so "who is threaded"
 * has exactly one definition.
 *
 * Includes all threaded agents regardless of court position — agents without an
 * explicit position default to 'retinue' behaviour. Dormant threads are excluded:
 * a dormant thread is a thread the player has deliberately set down.
 *
 * The ascendant's own avatar actor(s) are always included at 'the_first'. The
 * avatar is connected via `avatar_of`, not a thread edge, so it never appears in
 * the thread scan — but the player must always see their own character.
 */
export function collectThreadedAgents(
  graph: WorldGraph,
  ascendantId: string,
): Map<string, ThreadedAgentEntry> {
  const threadedAgents = new Map<string, ThreadedAgentEntry>();

  for (const edge of getThreadsFrom(graph, ascendantId)) {
    const props = edge.properties as ThreadEdgeProperties;
    if (props.courtPosition === 'dormant') continue; // dormant = no notifications
    threadedAgents.set(edge.target, { threadEdgeId: edge.id, props });
  }

  for (const avatarNode of getAvatarsOf(graph, ascendantId)) {
    if (!threadedAgents.has(avatarNode.id)) {
      threadedAgents.set(avatarNode.id, {
        threadEdgeId: '',
        props: {
          tier: 5,
          courtPosition: 'the_first',
          attentionMode: 'auto_resolve',
        } as ThreadEdgeProperties,
      });
    }
  }

  return threadedAgents;
}

export function phaseEncounterVisibility(
  state: GameState,
): { notifications: EncounterNotification[]; events: TickEvent[] } {
  const { graph, ascendantId, tick } = state;
  const notifications: EncounterNotification[] = [];
  const events: TickEvent[] = [];

  const threadedAgents = collectThreadedAgents(graph, ascendantId);

  if (threadedAgents.size === 0) return { notifications, events };

  // Agents with pending compulsions — suppress encounter notifications so
  // the Compulsion modal handles encounter selection instead of the legacy
  // tiered encounter modal. Without this, both modals stack on the same tick.
  const agentsWithPendingCompulsion = new Set(
    (state.premonitionQueue ?? [])
      .filter(p => p.type === 'compulsion' && p.eligibleUntilTick > tick)
      .map(p => p.agentId),
  );

  // Build a set of already-pending notification keys to avoid duplicates.
  // Include RESOLVED notifications for aftermath (otherwise dismissed aftermath modals
  // regenerate every tick) AND for unified_action steps (otherwise a player committing a
  // choice on an intermediate step resolves the notification, it drops out of the dedup
  // set, and the next tick generates a fresh notification for the same step — re-emitting
  // the modal on every tick until the step duration elapses).
  const existingNotifKeys = new Set(
    (state.encounterNotifications ?? [])
      .filter(n => !n.resolved || n.kind === 'aftermath' || n.sourceSystem === 'unified_action')
      .map(n => `${n.kind ?? 'encounter'}:${n.sourceSystem ?? 'legacy_encounter'}:${n.agentId}:${n.encounterId}:${n.actionId ?? 'legacy'}:${n.stepIndex ?? 0}`),
  );

  // Agent encounters live in encounterProgress (the old-style NPC encounter pipeline).
  for (const ep of state.encounterProgress) {
    if (ep.status !== 'active') continue;

    const threadInfo = threadedAgents.get(ep.actorId);
    if (!threadInfo) continue;

    // Skip agents with pending compulsions — compulsion modal handles their encounters
    if (agentsWithPendingCompulsion.has(ep.actorId)) continue;

    // Skip digest-only tiers — notifications are suppressed; outcome goes to digest buffer only.
    // Undefined effectiveTier (old records) preserves existing notification behavior.
    const epTier = ep.effectiveTier;
    if (epTier === 'invisible' || epTier === 'background') continue;

    // For shaping tier: only generate notification if the player attended the tug for this agent.
    // Without an attended tug the encounter auto-resolves silently into the digest buffer.
    if (epTier === 'shaping') {
      const tugs = state.activeThreadTugs ?? [];
      const attendedTug = tugs.find(
        t => t.agentId === ep.actorId && t.encounterId === ep.encounterId && t.attended,
      );
      if (!attendedTug) continue;
    }

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
    const epLocationId = getAgentLocationId(graph, ep.actorId);
    const epHex = epLocationId ? resolveLocationToHex(graph, epLocationId) : null;

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
        locationLabel: locationNode?.name,
        hexCol: epHex?.col,
        hexRow: epHex?.row,
        participantIds: resolveEncounterParticipantIds(graph, ep.actorId, ep.targetAgentId),
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
    if (!encounter && !unifiedTemplate) continue;

    const threadInfo = threadedAgents.get(action.actorId);
    if (!threadInfo) continue;

    // Skip agents with pending compulsions — compulsion modal handles their encounters
    if (agentsWithPendingCompulsion.has(action.actorId)) continue;

    // Skip digest-only tiers — notifications are suppressed; outcome goes to digest buffer only.
    // Undefined effectiveTier (old records) preserves existing notification behavior.
    const actionTier = action.effectiveTier;
    if (actionTier === 'invisible' || actionTier === 'background') continue;

    // For shaping tier: only generate notification if the player attended the tug for this agent.
    // Without an attended tug the encounter auto-resolves silently into the digest buffer.
    if (actionTier === 'shaping') {
      const tugs = state.activeThreadTugs ?? [];
      const attendedTug = tugs.find(
        t => t.agentId === action.actorId && (t.actionId === action.actionId || t.encounterId === action.templateId) && t.attended,
      );
      if (!attendedTug) continue;
    }

    const stepIndex = action.currentStep;
    const notifKey = `encounter:unified_action:${action.actorId}:${action.templateId}:${action.actionId}:${stepIndex}`;
    if (existingNotifKeys.has(notifKey)) continue;

    const agentNode = graph.getNode(action.actorId);
    if (!agentNode) continue;

    const locationNode = getAgentLocation(graph, action.actorId);
    const locationName = locationNode?.name ?? 'unknown location';
    const actionLocationId = getAgentLocationId(graph, action.actorId);
    const actionHex = actionLocationId ? resolveLocationToHex(graph, actionLocationId) : null;
    const courtPosition = threadInfo.props.courtPosition ?? 'retinue';
    const defaultMode = VISIBILITY_BY_POSITION[courtPosition]?.defaultAttentionMode ?? 'auto_resolve';
    const encounterName = encounter?.name ?? unifiedTemplate?.name ?? action.templateId;
    const resolvedTemplate = unifiedTemplate ?? undefined;
    const currentStep = resolvedTemplate
      ? resolveStepDefinition(resolvedTemplate, stepIndex, action.choiceHistory)
      : undefined;
    // The band of the step that just resolved (currentStep advanced past it).
    const lastResolvedOutcome = action.stepOutcomes.length > 0
      ? action.stepOutcomes[action.stepOutcomes.length - 1]
      : undefined;

    const notification = buildEncounterNotification(
      action.actorId,
      agentNode.name,
      action.templateId,
      encounterName,
      locationName,
      courtPosition,
      threadInfo.props.attentionMode ?? defaultMode,
      tick,
      {
        sourceSystem: 'unified_action',
        stepIndex,
        actionId: action.actionId,
        stepId: currentStep?.id,
        totalSteps: resolvedTemplate?.steps.length,
        outcomeBand: lastResolvedOutcome ? stepOutcomeToOutcomeBand(lastResolvedOutcome) : undefined,
        locationLabel: locationNode?.name,
        hexCol: actionHex?.col,
        hexRow: actionHex?.row,
        participantIds: resolveEncounterParticipantIds(graph, action.actorId, action.targetId),
      },
    );

    if (notification) {
      // Override with authored choices if the template defines them for this step
      const authoredForStep = resolvedTemplate?.authoredChoices?.[stepIndex];
      if (authoredForStep && authoredForStep.length > 0) {
        notification.choices = authoredForStep.map(card => ({
          id: card.id,
          text: card.label,
          essenceCost: card.essenceCost,
          probabilityBoost: 0,
          interventionType: card.interventionType,
          godVoice: card.likelyBurden,
        }));
      }

      notifications.push(notification);
      events.push({
        id: `evt_enc_vis_unified_${action.actorId}_${stepIndex}_${tick}`,
        tick,
        type: 'journey_beat',
        message: `${agentNode.name} enters ${encounterName} step ${stepIndex + 1}`,
        significance: courtPosition === 'retinue' ? 0.7 : 0.4,
        actorId: action.actorId,
      });
    }
  }

  for (const action of state.unifiedActions ?? []) {
    if (!action.resolved || !action.aftermathSummary) continue;

    const encounter = getAnyEncounterById(action.templateId);
    const unifiedTemplate = !encounter ? getUnifiedTemplateById(action.templateId) : undefined;
    if (!encounter && !unifiedTemplate) continue;
    const encounterName = encounter?.name ?? unifiedTemplate?.name ?? action.templateId;

    const threadInfo = threadedAgents.get(action.actorId);
    if (!threadInfo) continue;

    // Skip digest-only tiers — aftermath notifications suppressed for invisible/background.
    // Undefined effectiveTier (old records) preserves existing notification behavior.
    const aftermathTier = action.effectiveTier;
    if (aftermathTier === 'invisible' || aftermathTier === 'background') continue;

    const notifKey = `aftermath:unified_action:${action.actorId}:${action.templateId}:${action.actionId}:${action.currentStep}`;
    if (existingNotifKeys.has(notifKey)) continue;

    const agentNode = graph.getNode(action.actorId);
    if (!agentNode) continue;

    const locationNode = getAgentLocation(graph, action.actorId);
    const locationName = locationNode?.name ?? 'unknown location';
    const aftermathLocationId = getAgentLocationId(graph, action.actorId);
    const aftermathHex = aftermathLocationId ? resolveLocationToHex(graph, aftermathLocationId) : null;
    const courtPosition = threadInfo.props.courtPosition ?? 'retinue';
    const defaultMode = VISIBILITY_BY_POSITION[courtPosition]?.defaultAttentionMode ?? 'auto_resolve';
    const aftermathStepTemplate = getUnifiedTemplateById(action.templateId);
    const finalStepOutcome = action.stepOutcomes.length > 0
      ? action.stepOutcomes[action.stepOutcomes.length - 1]
      : undefined;

    const notification = buildEncounterNotification(
      action.actorId,
      agentNode.name,
      action.templateId,
      encounterName,
      locationName,
      courtPosition,
      threadInfo.props.attentionMode ?? defaultMode,
      tick,
      {
        kind: 'aftermath',
        sourceSystem: 'unified_action',
        stepIndex: action.currentStep,
        actionId: action.actionId,
        narrativeTag: action.aftermathSummary.narrativeTag,
        totalSteps: aftermathStepTemplate?.steps.length,
        outcomeBand: finalStepOutcome ? stepOutcomeToOutcomeBand(finalStepOutcome) : undefined,
        locationLabel: locationNode?.name,
        hexCol: aftermathHex?.col,
        hexRow: aftermathHex?.row,
        participantIds: resolveEncounterParticipantIds(graph, action.actorId, action.targetId),
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
        message: `${agentNode.name} lives with the aftermath of ${encounterName}`,
        significance: courtPosition === 'retinue' ? 0.7 : 0.4,
        actorId: action.actorId,
      });
    }
  }

  return { notifications, events };
}
