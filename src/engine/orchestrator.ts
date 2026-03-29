// src/engine/orchestrator.ts

/**
 * Game Loop Orchestrator — runs one tick of the simulation.
 *
 * Each tick phase is a pure function: takes GameState pieces in,
 * returns partial updates out. The orchestrator merges updates.
 */
import type { GameState, TickEvent } from '../types/gameState';
import type { WorldGraph } from './graph';
import { STEALTH_DECAY_PER_TICK } from '../types/gameState';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import {
  computeEssenceGeneration,
  generateEssence,
  computeMaxEssence,
} from './influence';
import { recalcVisibility, collectLOSSources } from './visibility';
import { RIVAL_ACTION_TEMPLATES } from '../data/rival-content';
import {
  computeStakes,
  resolveDilemma,
  applyDilemmaEffects,
  logInteraction,
  decayReputation,
} from './disposition';
import {
  DILEMMA_STAKES_THRESHOLD,
  DEFAULT_REPUTATION,
} from '../types/disposition';
import { buildNarrativeContext } from './contextBuilder';
import type { NarrativeEvent, NarrativeEventType } from '../types/narrative';
import {
  DILEMMA_STAKES_PROSE,
  DILEMMA_ADJ_POOL,
  DILEMMA_NOUN_POOL,
  DILEMMA_VERB_POOL,
} from '../data/narrative-content';
import { phaseAgentLifecycle } from './agentLifecycle';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';
import {
  resolveEncounter,
  advanceEncounter,
  isEncounterOccupied,
} from './encounter';
import { getAvatarHexPosition } from './visibility';
import { getAnyEncounterById } from '../data/encounter-content';
import type { EncounterOutcome } from '../types/encounter';
import { getFamiliarity, addFamiliarity, checkThresholdCrossed } from './familiarity';
import { FAMILIARITY_GAINS } from '../types/familiarity';
import type { DivineInfluenceEntry } from '../types/dream';
import { getCurrentStrength } from './decayCurve';
import { checkDissolutions } from './sublocation';
import { phaseMovement } from './phaseMovement';
import { phaseColocationDetection } from './phaseColocationDetection';
import { phaseInteractionDepth } from './phaseInteractionDepth';
import { emitEncounterRevelations, emitDilemmaRevelations, emitColocationRevelations } from './revelationEmitter';
import { phaseUnifiedActionProgress } from './unifiedActionResolution';
import { phaseIdleSelection } from './unifiedActionPhases';
import { UNIFIED_ACTION_TEMPLATES } from '../data/unified-action-templates';
import { phaseAmbitionProgress } from './ambitionTick';
import { phaseFactionAmbitions } from './factionAmbitions';
import { phaseArmyAttrition } from './armyAttrition';
import { phaseBattleDetection, phaseBattleTick } from './battleResolution';
import { phaseProsperity } from './phaseProsperity';
import { checkTierPromotion } from './influence';
import { phaseTradeRouteDecay } from './phaseTradeRouteDecay';
import { phaseSublocations } from './phaseSublocations';
import { phaseSettlementPromotion } from './phaseSettlementPromotion';
import { phaseEconomicChronicle } from './phaseEconomicChronicle';
import { phaseHexState } from './phaseHexState';
import { revealLayer } from './revelationResolver';
import { phaseUnrest } from './phaseUnrest';
import { phaseMagicalSaturation } from './phaseMagicalSaturation';
import { phaseSpherePressure } from './phaseSpherePressure';
import { phaseSphereAggregation } from './phaseSphereAggregation';
import { phaseEconomicTraits } from './phaseEconomicTraits';
import { phaseAgentDecision } from './phaseAgentDecision';
import { phaseControlEffects } from './phaseControlEffects';
// phaseDoom and phaseMandate are extracted to their own files with sphere pressure wiring.
// Imported for internal runTick use; re-exported for backward compatibility (tests import from orchestrator).
import { phaseDoom } from './phaseDoom';
export { phaseDoom } from './phaseDoom';
import { phaseMandate } from './phaseMandate';
export { phaseMandate } from './phaseMandate';
import { phaseJourneyBeat } from './journeyEngine';
import { JOURNEY_BEAT_TEMPLATES } from '../data/journey-content';
import { phaseEncounterVisibility } from './encounterVisibility';
import { EncounterCacheManager, selectDifficultyTier } from './encounterCache';
import { decayAllTrust } from './trustMechanics';
import { buildDistanceMatrix } from './distanceMatrix';
import {
  assembleRewardPool,
  drawFromPool,
  instantiateReward,
  resolveRewardRecipe,
  BAD_OUTCOME_CATEGORY_WEIGHTS,
} from './rewardPool';
import { validateTickOutput, appendCrashLog } from './tickHealthMonitor';
import { phaseFactionReputationDecay, processFactionEncounterReputation } from './factionReputation';
import { processFactionOutcome } from './factionOutcome';
import { recordChainStageCompletion, getChainProgress, CHAIN_COMPLETION_CAPABILITY_BONUS } from './encounterChains';
import type { DistanceMatrix } from './distanceMatrix';
import { clearTimelines } from './encounterTimeline';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { ENCOUNTER_PRESSURE_PER_STEP, RIVAL_PRESSURE_MAGNITUDE } from '../types/sphereAffinity';

// ─── Decision Cache (lazy-initialized) ────────────────────────────

let encounterCache: EncounterCacheManager | null = null;
let distanceMatrix: DistanceMatrix | null = null;

/** Reset the encounter cache, distance matrix, and timeline (useful for game restart). */
export function resetDecisionCache(): void {
  encounterCache = null;
  distanceMatrix = null;
  clearTimelines();
}

/** Read-only access to the current encounter cache (for debug tooling). */
export function getEncounterCacheManager(): EncounterCacheManager | null {
  return encounterCache;
}

// ─── State Cleanup Constants ──────────────────────────────────────

/** Trim encounterNotifications older than this many ticks */
const NOTIFICATION_RETENTION_TICKS = 50;

/** Prune resolved unifiedActions older than this many ticks */
const RESOLVED_ACTION_RETENTION_TICKS = 100;

// ─── Seeded PRNG ──────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── ID Generator ─────────────────────────────────────────────────

let eventCounter = 0;
function nextEventId(): string {
  return `evt_${++eventCounter}`;
}

// Reset for testing
export function resetEventCounter(): void {
  eventCounter = 0;
}

// ─── Phase 1: Advance Doom Clock ──────────────────────────────────
// Delegated to phaseDoom.ts — imported at top of file and re-exported via that import.
// phaseDoom also wires entropy sphere pressure on doom tier escalation.

// ─── Helpers ──────────────────────────────────────────────────────

function getActorHexCoords(graph: WorldGraph, actorId: string): { col: number; row: number } | undefined {
  const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
  if (locEdges.length === 0) return undefined;
  const locNode = graph.getNode(locEdges[0].target);
  if (!locNode?.properties?.hexCol) return undefined;
  return { col: locNode.properties.hexCol as number, row: locNode.properties.hexRow as number };
}

/** Simple string hash for deterministic PRNG seeding */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Build a short suffix describing encounter outcome rewards/penalties.
 * Returns empty string if nothing notable, or " — gained X, learned Y" etc.
 */
function summarizeOutcome(outcome: EncounterOutcome, success: boolean, rewardName?: string): string {
  const parts: string[] = [];
  if (outcome.reputationDelta && outcome.reputationDelta !== 0) {
    parts.push(outcome.reputationDelta > 0 ? 'gained reputation' : 'lost reputation');
  }
  if (outcome.traitChanges && outcome.traitChanges.length > 0) {
    parts.push(outcome.traitChanges.join(', '));
  }
  if (rewardName) {
    parts.push(success ? `earned ${rewardName}` : `suffered ${rewardName}`);
  } else if (outcome.rewardPool) {
    parts.push(success ? 'earned a reward' : 'lost equipment');
  }
  if (outcome.tierPromotionEligible) {
    parts.push('eligible for promotion');
  }
  return parts.length > 0 ? ` — ${parts.join(', ')}` : '';
}

// ─── Phase 2a.5: Encounter Progression (v2 — progression only, no initiation) ───

/**
 * Advances active encounters whose current step has elapsed.
 * Resolves the step, advances to the next (or completes/abandons), and emits events.
 * Initiation is handled separately by phaseAgentDecision.
 */
export function phaseEncounterProgressionV2(state: GameState): Partial<GameState> {
  const events: TickEvent[] = [];
  const spherePressures: SpherePressureEvent[] = [];
  let updatedProgress = [...state.encounterProgress];

  const activeEncounters = updatedProgress.filter(p => p.status === 'active');
  for (const progress of activeEncounters) {
    // Skip if agent is still occupied (multi-tick step in progress)
    if (isEncounterOccupied(progress, state.tick)) continue;

    // Resolve current step (includes capability growth + tier promotion)
    const result = resolveEncounter(state, progress);
    // Advance encounter (mutates progress in place)
    advanceEncounter(state, progress, result.success, state.tick);

    // Sphere pressure: push pressure on the actor's location for each encounter step.
    // Fail-soft: skip if encounter has no sphere or actor has no location.
    {
      const encounter = getAnyEncounterById(progress.encounterId);
      const encounterSphere = encounter?.sphereAffinity;
      if (encounterSphere) {
        const locEdges = state.graph.getOutgoingEdges(progress.actorId, 'located_at');
        const locationId = locEdges[0]?.target;
        if (locationId) {
          spherePressures.push({
            targetEntityId: locationId,
            sphere: encounterSphere,
            magnitude: ENCOUNTER_PRESSURE_PER_STEP,
            source: 'encounter',
            sourceId: progress.encounterId,
          });
        }
      }
    }

    // ── Faction reputation processing (TB-060) ──
    processFactionEncounterReputation(
      state.graph,
      progress.actorId,
      progress.encounterId,
      result.success,
      progress.status === 'completed',
      state.tick,
    );

    // ── Faction join/promotion outcome processing (TB-061, TB-063 events) ──
    if (progress.status === 'completed') {
      const outcomeRng = mulberry32(state.seed + state.tick * 43 + hashString(progress.actorId));
      const factionEvents = processFactionOutcome(state.graph, progress, state.tick, outcomeRng);
      events.push(...factionEvents);

      // ── C.2: Encounter chain progression ──
      const actorNode = state.graph.getNode(progress.actorId);
      if (actorNode) {
        const currentProgress = getChainProgress(actorNode.properties as Record<string, unknown>);
        const chainResult = recordChainStageCompletion(progress.encounterId, currentProgress);

        // Update chain progress on the agent
        if (JSON.stringify(chainResult.updatedProgress) !== JSON.stringify(currentProgress)) {
          state.graph.updateNode(progress.actorId, {
            properties: { ...actorNode.properties, chainProgress: chainResult.updatedProgress },
          });

          // Emit trace for chain progression
          emitTrace({
            category: 'chain_progress',
            tick: state.tick,
            agentId: progress.actorId,
            templateId: progress.encounterId,
            isChainComplete: chainResult.completedChains.length > 0,
            summary: chainResult.completedChains.length > 0
              ? `${actorNode.name} completed chain: ${chainResult.completedChains.map(c => c.chainId).join(', ')}`
              : `${actorNode.name} progressed in encounter chain via ${progress.encounterId}`,
          } as any);
        }

        // Apply capability bonus for completed chains
        for (const completed of chainResult.completedChains) {
          const caps = (actorNode.properties?.domainCapabilities ?? {}) as Record<string, number>;
          const currentCap = caps[completed.primaryReach] ?? 0;
          state.graph.updateNode(progress.actorId, {
            properties: {
              ...state.graph.getNode(progress.actorId)!.properties,
              domainCapabilities: {
                ...caps,
                [completed.primaryReach]: currentCap + CHAIN_COMPLETION_CAPABILITY_BONUS,
              },
            },
          });
        }
      }
    }

    // ── Reward processing (runs on encounter completion/abandonment) ──
    let rewardName: string | undefined;
    if ((progress.status === 'completed' || progress.status === 'abandoned') && result.outcome.rewardPool) {
      const rng = mulberry32(state.seed + state.tick * 41 + hashString(progress.actorId));
      const resolved = resolveRewardRecipe(result.outcome.rewardPool, result.outcomeType);

      // Bad outcome check
      const badRoll = rng();
      const isBadOutcome = badRoll < resolved.badOutcomeChance;

      const effectiveRecipe = isBadOutcome
        ? { ...resolved, categoryWeights: BAD_OUTCOME_CATEGORY_WEIGHTS }
        : resolved;

      const pool = assembleRewardPool(state.graph, effectiveRecipe);

      if (pool.length > 0) {
        const drawRoll = rng();
        const templateId = drawFromPool(pool, drawRoll);

        if (templateId) {
          const instantiation = instantiateReward(state.graph, templateId, progress.actorId, state.tick);

          if (instantiation) {
            const instanceNode = state.graph.getNode(instantiation.instanceId);
            rewardName = instanceNode?.name;
            const templateNode = state.graph.getNode(templateId);
            const tier = (templateNode?.properties?.tier as number) ?? 1;

            emitTrace({
              category: 'encounter',
              tick: state.tick,
              agentId: progress.actorId,
              agentName: state.graph.getNode(progress.actorId)?.name ?? '?',
              event: isBadOutcome ? 'reward_bad_outcome' : 'reward_drawn',
              templateId,
              instanceId: instantiation.instanceId,
              templateName: templateNode?.name ?? '?',
              tier,
              attachmentCategory: instantiation.category,
              poolSize: pool.length,
              roll: drawRoll,
              summary: `${state.graph.getNode(progress.actorId)?.name ?? '?'} ${isBadOutcome ? 'suffered' : 'earned'} ${templateNode?.name ?? '?'} (T${tier} ${instantiation.category})`,
            } as TraceEntry);
          }
        }
      } else {
        emitTrace({
          category: 'encounter',
          tick: state.tick,
          agentId: progress.actorId,
          agentName: state.graph.getNode(progress.actorId)?.name ?? '?',
          event: 'reward_pool_empty',
          encounterId: progress.encounterId,
          summary: `Reward pool empty for ${progress.encounterId} (${result.outcomeType})`,
        } as TraceEntry);
      }
    }

    // Return agent to parent location if encounter ended and they're at a sublocation
    if (progress.status === 'completed' || progress.status === 'abandoned') {
      const locEdges = state.graph.getOutgoingEdges(progress.actorId, 'located_at');
      if (locEdges.length > 0) {
        const currentLoc = state.graph.getNode(locEdges[0].target);
        if (currentLoc) {
          const locProps = currentLoc.properties as Record<string, unknown>;
          if (locProps.parentLocationId && typeof locProps.parentLocationId === 'string') {
            // Agent is at a sublocation — return to parent
            state.graph.removeEdge(locEdges[0].id);
            state.graph.addEdge({
              id: `${progress.actorId}_located_at_${locProps.parentLocationId}`,
              source: progress.actorId,
              target: locProps.parentLocationId as string,
              type: 'located_at',
              properties: {},
            });

            // Trace: return to parent after encounter
            const parentLoc = state.graph.getNode(locProps.parentLocationId as string);
            const actorForTrace = state.graph.getNode(progress.actorId);
            emitTrace({
              category: 'movement',
              tick: state.tick,
              agentId: progress.actorId,
              agentName: actorForTrace?.name ?? '?',
              event: 'sublocation_return',
              fromLocationId: currentLoc.id,
              fromLocationName: currentLoc.name,
              toLocationId: locProps.parentLocationId as string,
              toLocationName: parentLoc?.name ?? '?',
              summary: `${actorForTrace?.name ?? '?'} returns from ${currentLoc.name} to ${parentLoc?.name ?? '?'} (encounter ${progress.status})`,
            } as TraceEntry);
          }
        }
      }
    }

    // Emit tier promotion event if a tier was crossed
    if (result.growth?.tierCrossed && result.promotion?.traitGranted) {
      const actorNode = state.graph.getNode(progress.actorId);
      const agentName = actorNode?.name ?? 'An agent';
      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'tier_promotion',
        message: `${agentName} reached ${result.growth.domain} tier ${result.growth.newTier}: "${result.promotion.traitGranted}"`,
        significance: 0.8,
      });
    }

    // Generate event based on outcome
    const actorNode = state.graph.getNode(progress.actorId);
    const agentName = actorNode?.name ?? 'An agent';
    const encounter = getAnyEncounterById(progress.encounterId);
    const encounterName = encounter?.name ?? 'an encounter';

    // Check if actor is in the player's retinue (has thread from ascendant)
    const isRetinue = state.graph.getIncomingEdges(progress.actorId, 'thread')
      .some(e => e.source === state.ascendantId);

    if (progress.status === 'completed') {
      const details = summarizeOutcome(result.outcome, true, rewardName);
      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'encounter_completed',
        message: isRetinue
          ? `${agentName} completed '${encounterName}'${details}`
          : `${agentName} has completed their encounter.`,
        significance: 0.8,
        ...(isRetinue && {
          actorId: progress.actorId,
          notification: { channel: 'toast' as const },
        }),
      });
    } else if (progress.status === 'abandoned') {
      const details = summarizeOutcome(result.outcome, false, rewardName);
      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'encounter_step_failure',
        message: isRetinue
          ? `${agentName} failed '${encounterName}'${details}`
          : `${agentName} failed their encounter step.`,
        significance: 0.5,
        ...(isRetinue && {
          actorId: progress.actorId,
          notification: { channel: 'toast' as const },
        }),
      });
    } else {
      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: result.success ? 'encounter_step_success' : 'encounter_step_failure',
        message: `${agentName} ${result.success ? 'succeeded' : 'struggled'} in their encounter.`,
        significance: 0.6,
      });
    }
  }

  return {
    tickEvents: [...state.tickEvents, ...events],
    encounterProgress: updatedProgress,
    ...(spherePressures.length > 0
      ? { pendingSpherePressures: [...(state.pendingSpherePressures ?? []), ...spherePressures] }
      : {}),
  };
}


// ─── Phase 2.5: Dilemma Detection ──────────────────────────────────────

/** Map Creation Sphere to Reach Domain for dilemma stakes computation */
const SPHERE_TO_DOMAIN = {
  force: 'iron',
  matter: 'gold',
  energy: 'veil',
  life: 'flesh',
  mind: 'shadow',
  spirit: 'heart',
  time: 'star',
  entropy: 'shadow',
} as const;

export function phaseDilemmaDetection(state: GameState): Partial<GameState> {
  const events: TickEvent[] = [];
  const graph = state.graph;

  // Scan tick events for agent_action_resolved events
  const resolvedEvents = state.tickEvents.filter(e => e.type === 'agent_action_resolved');

  for (const event of resolvedEvents) {
    // Get all individual actors from the graph
    const allActors = graph.getNodesByType('actor')
      .filter(node => node.properties?.actorType === 'individual');

    if (allActors.length < 2) continue;

    // Find the actor whose name matches the event message
    const rng = mulberry32(state.seed + state.tick * 41 + resolvedEvents.indexOf(event));
    const actor = allActors.find(a => event.message.includes(a.name)) ?? allActors[Math.floor(rng() * allActors.length)];

    // Pick a different actor as target
    const otherActors = allActors.filter(a => a.id !== actor.id);
    if (otherActors.length === 0) continue;
    const targetActor = otherActors[Math.floor(rng() * otherActors.length)];

    // Get cooperation strategies
    const actorStrategy = (actor.properties?.cooperationStrategy ?? 'tit-for-tat') as any;
    const targetStrategy = (targetActor.properties?.cooperationStrategy ?? 'tit-for-tat') as any;

    // Look up relationship edge
    let relationshipEdge = graph.getOutgoingEdges(actor.id, 'relates_to')
      .find(e => e.target === targetActor.id);

    if (!relationshipEdge) {
      relationshipEdge = graph.getIncomingEdges(actor.id, 'relates_to')
        .find(e => e.source === targetActor.id);
    }

    // Get interaction history from edge
    const actorHistory = relationshipEdge?.properties?.interactionLog ?? [];
    const targetHistory = relationshipEdge?.properties?.interactionLog ?? [];

    // Map sphere to reach domain for stakes computation
    const sphere = event.sphere ?? 'force';
    const domain = SPHERE_TO_DOMAIN[sphere as keyof typeof SPHERE_TO_DOMAIN] ?? 'stone';
    const sentiment = relationshipEdge?.properties?.sentiment ?? 0;
    const isFactionLeader = actor.properties?.isFactionLeader === true || targetActor.properties?.isFactionLeader === true;
    const isTerritory = false; // Simplified

    const stakes = computeStakes(domain, sentiment, isFactionLeader, isTerritory);

    // Only resolve as dilemma if stakes >= threshold
    if (stakes < DILEMMA_STAKES_THRESHOLD) continue;

    // Resolve the dilemma
    const dilemma = resolveDilemma(
      actor.id,
      targetActor.id,
      actorStrategy,
      targetStrategy,
      actorHistory,
      targetHistory,
      state.tick,
      event.sphere ?? 'iron',
      stakes,
    );

    // Apply effects to graph
    const effects = applyDilemmaEffects(dilemma.outcome);

    // Update relationship edge (sentiment and strength)
    if (relationshipEdge) {
      const newSentiment = Math.max(-1, Math.min(1, (relationshipEdge.properties?.sentiment ?? 0) + effects.sentimentDelta));
      const newStrength = Math.max(0, (relationshipEdge.properties?.strength ?? 0.5) + effects.strengthDelta);
      relationshipEdge.properties.sentiment = newSentiment;
      relationshipEdge.properties.strength = newStrength;

      // Log the interaction
      const newLog = logInteraction(
        relationshipEdge.properties?.interactionLog ?? [],
        state.tick,
        dilemma.actorMove,
        dilemma.targetMove,
        dilemma.context,
        stakes,
      );
      relationshipEdge.properties.interactionLog = newLog;
    }

    // Update actor reputations
    const actorNode = graph.getNode(actor.id);
    if (actorNode) {
      const newRep = Math.max(0, Math.min(1, (actorNode.properties?.reputationScore ?? DEFAULT_REPUTATION) + effects.actorRepDelta));
      actorNode.properties.reputationScore = newRep;
    }

    const targetNode = graph.getNode(targetActor.id);
    if (targetNode) {
      const newRep = Math.max(0, Math.min(1, (targetNode.properties?.reputationScore ?? DEFAULT_REPUTATION) + effects.targetRepDelta));
      targetNode.properties.reputationScore = newRep;
    }

    // Generate varied dilemma message using prose templates
    const stakesLevel = stakes > 0.6 ? 'high' : stakes > 0.3 ? 'medium' : 'low';
    const templateKey = `${dilemma.outcome}.${stakesLevel}`;
    const proseOptions = DILEMMA_STAKES_PROSE[templateKey];
    const template = Array.isArray(proseOptions)
      ? proseOptions[Math.floor(rng() * proseOptions.length)]
      : proseOptions;

    let message = template || `${actor.name} and ${targetActor.name}: ${dilemma.outcome.replace(/_/g, ' ')}`;

    if (template) {
      // Use word pools from narrative-content package
      const adjPool = DILEMMA_ADJ_POOL;
      const nounPool = DILEMMA_NOUN_POOL;
      const verbPool = DILEMMA_VERB_POOL;

      const adjIndex = Math.floor(rng() * adjPool.length);
      const nounIndex = Math.floor(rng() * nounPool.length);
      const verbIndex = Math.floor(rng() * verbPool.length);

      message = template
        .replace(/{actor}/g, actor.name)
        .replace(/{target}/g, targetActor.name)
        .replace(/{adj}/g, adjPool[adjIndex])
        .replace(/{noun}/g, nounPool[nounIndex])
        .replace(/{verb}/g, verbPool[verbIndex]);
    }

    // Emit dilemma_resolved event
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'dilemma_resolved',
      message,
      sphere: event.sphere,
      significance: Math.max(0.3, stakes),
    });
  }

  return { tickEvents: [...state.tickEvents, ...events] };
}

// ─── Phase 2.75: Familiarity Gain (Proximity) ────────────────────────

export function phaseFamiliarityGain(state: GameState): Partial<GameState> {
  // Get avatar's hex position
  const avatarHex = getAvatarHexPosition(state.graph, state.ascendantId);
  if (!avatarHex) return { familiarityMap: state.familiarityMap };

  let map = state.familiarityMap;

  // Find all agents in the avatar's hex
  const actors = state.graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual');

  for (const actor of actors) {
    // Get actor's location via locationId property
    const locationId = actor.properties?.locationId as string | undefined;
    if (!locationId) continue;

    const location = state.graph.getNode(locationId);
    if (!location || location.type !== 'location') continue;

    const actorHexCol = location.properties?.hexCol as number | undefined;
    const actorHexRow = location.properties?.hexRow as number | undefined;

    // Check if actor is in the same hex as avatar
    if (actorHexCol === avatarHex.col && actorHexRow === avatarHex.row) {
      const oldFamiliarity = getFamiliarity(map, actor.id);
      const newMap = addFamiliarity(map, actor.id, FAMILIARITY_GAINS.proximity);
      const newFamiliarity = getFamiliarity(newMap, actor.id);
      const levelChanged = checkThresholdCrossed(oldFamiliarity, newFamiliarity);

      // Emit trace for this familiarity gain
      const gain = FAMILIARITY_GAINS.proximity;
      emitTrace({
        tick: state.tick,
        category: 'familiarity_change',
        agentId: actor.id,
        summary: `${actor.name} familiarity: ${oldFamiliarity.toFixed(2)} → ${newFamiliarity.toFixed(2)}`,
        actorId: actor.id,
        actorName: actor.name,
        source: 'proximity',
        oldFamiliarity,
        newFamiliarity,
        levelChanged: levelChanged !== null,
        newLevel: levelChanged ?? undefined,
        amount: gain,
        multiplier: 1.0,
      });

      map = newMap;
    }
  }

  return { familiarityMap: map };
}

// ─── Phase 3: Rival Actions (simplified for vertical slice) ───────

export function phaseRivalActions(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 37);
  const events: TickEvent[] = [];
  const spherePressures: SpherePressureEvent[] = [];
  const newRivalStates = [...state.rivalStates];

  for (let i = 0; i < state.rivalDefinitions.length; i++) {
    const rival = state.rivalDefinitions[i];
    const rivalState = newRivalStates[i];

    // Rivals act every ~10 ticks
    const ticksSince = (rivalState.ticksSinceAction ?? 0) + 1;
    newRivalStates[i] = { ...rivalState, ticksSinceAction: ticksSince };

    if (ticksSince >= 8 + Math.floor(rng() * 5)) {
      newRivalStates[i] = {
        ...newRivalStates[i],
        ticksSinceAction: 0,
        interventionCount: rivalState.interventionCount + 1,
      };

      // Map behavior to action type, then pick a template variant
      let actionType: 'recruit' | 'intervene' | 'expand' | 'attack' | 'wait';
      if (rival.behavior === 'aggressive') {
        actionType = 'attack';
      } else if (rival.behavior === 'subtle') {
        actionType = 'intervene';
      } else if (rival.behavior === 'territorial') {
        actionType = 'expand';
      } else {
        actionType = 'expand';
      }

      const templates = RIVAL_ACTION_TEMPLATES[actionType] ?? ['{rival} acts against you'];
      const templateIdx = Math.floor(rng() * templates.length);
      const template = templates[templateIdx];
      const actionDesc = template.replace(/{rival}/g, rival.name);

      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'rival_action',
        message: actionDesc,
        significance: 0.7,
        notification: { channel: 'toast' },
      });

      // Sphere pressure: rival acts push pressure in their primary sphere.
      // Target: rival's own node (their sphere of influence in the world).
      // Fail-soft: skip if rival has no primarySphere.
      if (rival.primarySphere) {
        spherePressures.push({
          targetEntityId: rival.id,
          sphere: rival.primarySphere,
          magnitude: RIVAL_PRESSURE_MAGNITUDE,
          source: 'rival',
          sourceId: rival.id,
        });
      }
    }
  }

  return {
    rivalStates: newRivalStates,
    tickEvents: [...state.tickEvents, ...events],
    ...(spherePressures.length > 0
      ? { pendingSpherePressures: [...(state.pendingSpherePressures ?? []), ...spherePressures] }
      : {}),
  };
}

// ─── Phase 4: Stealth Decay ───────────────────────────────────────

export function phaseStealth(state: GameState): Partial<GameState> {
  const newExposure = Math.max(0, state.stealthExposure - STEALTH_DECAY_PER_TICK);
  return { stealthExposure: newExposure };
}

// ─── Phase 5: Narrative (assign tier, generate prose) ─────────────

export function phaseNarrative(state: GameState): Partial<GameState> {
  const newChronicleEntries = [...state.chronicleEntries];

  for (const event of state.tickEvents) {
    if (event.significance >= 0.8) {
      // Build narrative context for notable/chronicle events
      const narrativeEvent: NarrativeEvent = {
        id: event.id,
        tier: event.significance >= 0.9 ? 'chronicle' : 'notable',
        eventType: tickEventTypeToNarrativeType(event.type),
        description: event.message,
        tick: event.tick,
        sphere: event.sphere,
        // TODO: extract actorId from event once TickEvent carries it
      };

      const context = buildNarrativeContext(narrativeEvent, state.graph);

      newChronicleEntries.push({
        id: event.id,
        tier: 'chronicle',
        title: event.message.slice(0, 50),
        prose: event.message,
        promptContext: {
          actors: context.contextObjects
            .filter(co => co.category === 'character')
            .map(co => co.name),
          location: context.contextObjects
            .find(co => co.category === 'location')?.name ?? '',
          sphere: event.sphere ?? 'force',
          mood: context.oppositionSummary.dominantTension ?? 'dramatic',
          previousEvents: context.historicalFragments,
        },
        tick: event.tick,
      });
    }
  }

  return { chronicleEntries: newChronicleEntries };
}

/** Map TickEvent.type to NarrativeEventType */
function tickEventTypeToNarrativeType(type: string): NarrativeEventType {
  const mapping: Record<string, NarrativeEventType> = {
    agent_action: 'action_resolved',
    agent_action_resolved: 'action_resolved',
    doom_escalation: 'doom_escalation',
    rival_action: 'contested_action',
    mandate_progress: 'mandate_stage',
    narrative: 'action_resolved',
    dilemma_resolved: 'contested_action',
  };
  return mapping[type] ?? 'action_resolved';
}

// ─── Phase 6: Essence Generation ──────────────────────────────────

export function phaseEssence(state: GameState): Partial<GameState> {
  const ascNode = state.graph.getNode(state.ascendantId);
  if (!ascNode) return {};

  const pool = { ...state.essencePool };
  const max = computeMaxEssence(state.graph, state.ascendantId);
  const gen = computeEssenceGeneration(state.graph, state.ascendantId, state.controlEffects);
  generateEssence(pool, gen, max);

  const events: TickEvent[] = [];
  const totalGen = SPHERE_NAMES.reduce((s, sp) => s + gen[sp], 0);
  if (state.tick % 10 === 0 && totalGen > 0) {
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'essence_gain',
      message: `+${Math.round(totalGen)} essence flows from the cosmos`,
      significance: 0.1,
    });
  }

  return {
    essencePool: pool,
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 6.5: Reputation Decay ──────────────────────────────────────

export function phaseReputationDecay(state: GameState): Partial<GameState> {
  const graph = state.graph;

  // Iterate all individual actors — decay legacy reputationScore
  const actors = graph.getNodesByType('actor')
    .filter(node => node.properties?.actorType === 'individual');

  for (const actor of actors) {
    const currentRep = actor.properties?.reputationScore ?? DEFAULT_REPUTATION;
    const decayedRep = decayReputation(currentRep);
    actor.properties.reputationScore = decayedRep;
  }

  // Decay trust on all relates_to edges (social fabric)
  decayAllTrust(graph);

  return {};
}

// ─── Phase 6.6: Divine Influence Decay ────────────────────────────

export function phaseDivineInfluenceDecay(state: GameState): Partial<GameState> {
  const graph = state.graph;

  // Iterate all individual actors
  const actors = graph.getNodesByType('actor')
    .filter(node => node.properties?.actorType === 'individual');

  for (const actor of actors) {
    const influences = (actor.properties?.divineInfluences ?? []) as DivineInfluenceEntry[];

    if (influences.length === 0) continue;

    // Filter out expired influences based on decay curve
    const updated: DivineInfluenceEntry[] = [];

    for (const influence of influences) {
      const strength = getCurrentStrength(influence, state.tick);

      // Emit trace for expired influences
      if (strength <= 0) {
        emitTrace({
          category: 'intervention_effect',
          tick: state.tick,
          agentId: actor.id,
          summary: `Divine influence expired: ${influence.interventionType} (${influence.sphere})`,
          interventionType: influence.interventionType,
          targetAgentId: actor.id,
          targetAgentName: actor.name,
          sphere: influence.sphere,
          effects: ['expired'],
          consequenceMessage: `The ${influence.sphere} influence from ${influence.interventionType} fades.`,
          initialStrength: influence.initialStrength,
          maxDuration: influence.maxDuration,
        });
      } else {
        // Keep influence if still active
        updated.push(influence);
      }
    }

    // Update actor's divine influences array
    actor.properties.divineInfluences = updated;
  }

  return {};
}

// ─── Phase 6.64: Influence Tier Promotion ─────────────────────────

export function phaseInfluenceTierPromotion(
  state: GameState,
): Partial<GameState> {
  const promoted = checkTierPromotion(state.graph, state.ascendantId);
  if (promoted.length === 0) return {};

  // Look up ascendant's primary sphere for event coloring
  const ascendantNode = state.graph.getNode(state.ascendantId);
  const primarySphere = (ascendantNode?.properties?.sphereAlignment?.primary ?? undefined) as SphereName | undefined;

  const events: TickEvent[] = promoted.map(agentId => {
    const agentNode = state.graph.getNode(agentId);
    const agentName = agentNode?.name ?? agentId;
    return {
      id: nextEventId(),
      tick: state.tick,
      type: 'backstory_unlock' as const,
      message: `${agentName}'s story deepens`,
      significance: 0.6,
      sphere: primarySphere,
      actorId: agentId,
      notification: {
        channel: 'alert' as const,
        icon: 'revelation' as const,
      },
    };
  });

  return {
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 7: Mandate Check ───────────────────────────────────────
// Delegated to phaseMandate.ts — imported at top of file and re-exported via that import.
// phaseMandate also wires sphere pressure on mandate milestones and completion.

// ─── Phase 8: Doom Expiry Check ───────────────────────────────────

export function phaseDoomExpiry(state: GameState): Partial<GameState> {
  if (state.doomClock.expired && state.phase === 'playing') {
    return {
      phase: 'twilight' as const,
      tickEvents: [...state.tickEvents, {
        id: nextEventId(),
        tick: state.tick,
        type: 'phase_change',
        message: 'The Unmaking begins. The world trembles.',
        significance: 1.0,
        notification: {
          channel: 'popup',
          popup: {
            title: 'The Unmaking',
            body: 'The Unmaking begins. The world trembles.',
          },
        },
      }],
    };
  }
  return {};
}

// ─── Master Tick ──────────────────────────────────────────────────

export function runTick(state: GameState, scryTargets: import('../types').HexCoord[] = []): GameState {
  try {
  // Start with clean tick events
  let s: GameState = { ...state, tick: state.tick + 1, tickEvents: [], prosperityShocks: [] };

  // Lazy-init encounter cache and distance matrix
  if (!encounterCache) {
    encounterCache = new EncounterCacheManager();
    encounterCache.buildFullCache(s.graph, s.tick);
  } else {
    // C.1: Rebuild cache when difficulty tier advances (tick thresholds crossed)
    const newTier = selectDifficultyTier(s.tick);
    const oldTier = encounterCache.getCurrentTier();
    if (newTier !== oldTier) {
      encounterCache.buildFullCache(s.graph, s.tick);
      emitTrace({
        category: 'difficulty_tier_change',
        tick: s.tick,
        oldTier,
        newTier,
        summary: `Difficulty tier advanced to ${newTier} at tick ${s.tick}`,
      } as any);
    }
  }
  if (!distanceMatrix) {
    distanceMatrix = buildDistanceMatrix(s.graph);
  }

  // Advance clock
  const newSeason = Math.floor(s.tick / 90) % 4;
  const newYear = Math.floor(s.tick / 360);
  s = { ...s, clock: { ...s.clock, currentTick: s.tick, season: newSeason, year: newYear } };

  // Track events per phase for trace
  const phaseEventCounts: Record<string, number> = {};
  let agentsProcessed = 0;

  // Track initial event count
  let prevEventCount = s.tickEvents.length;

  // Phase 1: Doom
  s = { ...s, ...phaseDoom(s) };
  phaseEventCounts['doom'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 1.5: Journey Beat — check if doom clock crossed a beat threshold for The First
  s = { ...s, ...phaseJourneyBeat(s, JOURNEY_BEAT_TEMPLATES) };
  phaseEventCounts['journey_beat'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // ─── Unified Action Pipeline (replaces old phaseAgentActions + phaseEncounterProgression + phaseActionProgress) ───
  // Phase 2a: Progress + resolve existing unified actions (Phases 1-6 of unified pipeline)
  const uaRng = mulberry32(state.seed + state.tick * 31);
  s = { ...s, ...phaseUnifiedActionProgress(s, UNIFIED_ACTION_TEMPLATES, uaRng) };
  phaseEventCounts['unified_action_progress'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2a.5: Encounter Progression — advance active encounters whose current step has elapsed
  s = { ...s, ...phaseEncounterProgressionV2(s) };
  phaseEventCounts['encounter_progression'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2a.7: Encounter Revelations (knowledge facets from encounter observations)
  emitEncounterRevelations(s);
  phaseEventCounts['encounter_revelations'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2a.6: Encounter Visibility — generate notifications for threaded agents in encounters
  const encVisResult = phaseEncounterVisibility(s);
  s = {
    ...s,
    tickEvents: [...s.tickEvents, ...encVisResult.events],
    encounterNotifications: [
      ...(s.encounterNotifications ?? []),
      ...encVisResult.notifications,
    ],
  };
  phaseEventCounts['encounter_visibility'] = encVisResult.notifications.length;
  prevEventCount = s.tickEvents.length;

  // Phase 2b: Agent Decision — unified encounter-driven decision pipeline (replaces phaseIdleSelection)
  // @deprecated — phaseIdleSelection replaced by phaseAgentDecision
  const decisionRng = mulberry32(state.seed + state.tick * 37);
  s = { ...s, ...phaseAgentDecision(s, encounterCache!, distanceMatrix!, decisionRng) };
  const decisionEvents = s.tickEvents.length - prevEventCount;
  phaseEventCounts['agent_decision'] = decisionEvents;
  agentsProcessed += decisionEvents;
  prevEventCount = s.tickEvents.length;

  // Phase 2.35: Agent Movement (goal-directed pathfinding)
  s = { ...s, ...phaseMovement(s) };
  phaseEventCounts['agent_movement'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.355: Army Attrition (TB-073 — Quintessence degradation during march)
  phaseArmyAttrition(s);

  // Phase 2.356: Battle Detection (TB-073 — hostile army colocation → battle node)
  phaseBattleDetection(s);

  // Phase 2.357: Battle Tick (TB-073 — process active battles: attrition, momentum, resolution)
  phaseBattleTick(s);

  // Phase 2.36: Colocation Detection (after movement, before sublocation dissolution)
  s = { ...s, ...phaseColocationDetection(s) };
  phaseEventCounts['colocation_detection'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.37: Colocation Revelations (first-sighting possession reveals, faction bond auto-reveals)
  emitColocationRevelations(s);
  phaseEventCounts['colocation_revelations'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.4: Sublocation Dissolution
  const dissolutions = checkDissolutions(s.graph, s.tick, s.encounterProgress);
  for (const dissolution of dissolutions) {
    s = {
      ...s,
      tickEvents: [
        ...s.tickEvents,
        {
          id: nextEventId(),
          tick: s.tick,
          type: 'sublocation_dissolved' as const,
          message: `${dissolution.sublocationName} at ${dissolution.parentLocationId} dissolved: ${dissolution.reason}`,
          significance: 0.6,
        },
      ],
    };
    // Mark encounters at dissolved sublocation as abandoned
    s = {
      ...s,
      encounterProgress: s.encounterProgress.map(ep => {
        if (dissolution.displacedAgentIds.includes(ep.actorId) && ep.status === 'active') {
          return { ...ep, status: 'abandoned' as const };
        }
        return ep;
      }),
    };
  }
  phaseEventCounts['sublocation_dissolution'] = dissolutions.length;
  prevEventCount = s.tickEvents.length;

  // Phase 2.5: Dilemma Detection
  s = { ...s, ...phaseDilemmaDetection(s) };
  phaseEventCounts['dilemma_detection'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.55: Dilemma Revelations (knowledge facets from witnessed dilemmas)
  emitDilemmaRevelations(s);
  phaseEventCounts['dilemma_revelations'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.75: Familiarity Gain (Proximity)
  s = { ...s, ...phaseFamiliarityGain(s) };
  phaseEventCounts['familiarity_gain'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.76: Interaction Depth (agent knowledge accumulator)
  phaseInteractionDepth(s);
  phaseEventCounts['interaction_depth'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 3: Rival Actions
  s = { ...s, ...phaseRivalActions(s) };
  phaseEventCounts['rival_actions'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 4: Stealth
  s = { ...s, ...phaseStealth(s) };
  phaseEventCounts['stealth'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 5: Narrative
  s = { ...s, ...phaseNarrative(s) };
  phaseEventCounts['narrative'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6: Essence
  s = { ...s, ...phaseEssence(s) };
  phaseEventCounts['essence'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.1: Control Effects (sustained divine effects — drain/income/threshold/lapse)
  s = { ...s, ...phaseControlEffects(s) };
  phaseEventCounts['control_effects'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.5: Reputation Decay
  s = { ...s, ...phaseReputationDecay(s) };
  phaseEventCounts['reputation_decay'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.55: Faction Reputation Decay (TB-060)
  s = { ...s, ...phaseFactionReputationDecay(s) };
  phaseEventCounts['faction_reputation_decay'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.6: Divine Influence Decay
  s = { ...s, ...phaseDivineInfluenceDecay(s) };
  phaseEventCounts['divine_influence_decay'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.62: Trade Route Decay (stale routes lose volume; dead routes removed)
  s = { ...s, ...phaseTradeRouteDecay(s) };
  phaseEventCounts['trade_route_decay'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.63: Settlement Prosperity (economic pulse for all settlements)
  s = { ...s, ...phaseProsperity(s) };
  phaseEventCounts['prosperity'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.632: Economic Traits (mastery/reputation/scar/condition traits from economic activity)
  s = { ...s, ...phaseEconomicTraits(s) };
  phaseEventCounts['economic_traits'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.635: Settlement Tier Promotion/Demotion (hamlet↔town↔city based on sustained prosperity)
  s = { ...s, ...phaseSettlementPromotion(s) };
  phaseEventCounts['settlement_tier_change'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.636: Hex State (divine influence + corruption decay, terrain transformation)
  s = { ...s, ...phaseHexState(s, s.pendingHexMutations ?? []), pendingHexMutations: [] };
  phaseEventCounts['hex_state'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.637: Unrest (decay, prosperity damper, threshold events)
  s = { ...s, ...phaseUnrest(s) };
  phaseEventCounts['unrest'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.638: Magical Saturation (decay)
  s = { ...s, ...phaseMagicalSaturation(s) };
  phaseEventCounts['magical_saturation'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.639: Sphere Pressure Resolution (consumes pendingSpherePressures accumulated by upstream phases)
  s = { ...s, ...phaseSpherePressure(s), pendingSpherePressures: [] };
  phaseEventCounts['sphere_pressure'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.6395: Sphere Aggregation (computes global World-Soul from entity sphere scores)
  s = { ...s, ...phaseSphereAggregation(s) };
  phaseEventCounts['sphere_aggregation'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.64: Influence Tier Promotion (backstory unlock events)
  s = { ...s, ...phaseInfluenceTierPromotion(s) };
  phaseEventCounts['influence_tier_promotion'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.65: Gold Sublocations (conditional spawn/dissolve based on prosperity and wealth)
  s = { ...s, ...phaseSublocations(s, encounterCache) };
  phaseEventCounts['sublocations'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.66: Economic Chronicle (generate chronicle entries for economic state changes)
  s = { ...s, ...phaseEconomicChronicle(s) };
  phaseEventCounts['economic_chronicle'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.65: Ambition Progress (milestones, completion, abandonment, re-evaluation)
  s = { ...s, ...phaseAmbitionProgress(s) };
  phaseEventCounts['ambition_progress'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.651: Faction Ambition Evaluation (TB-073 — faction-level ambition creation/update)
  phaseFactionAmbitions(s);

  // Phase 6.75: Agent Lifecycle (death, birth, migration)
  s = { ...s, ...phaseAgentLifecycle(s, nextEventId, encounterCache ?? undefined) };
  phaseEventCounts['agent_lifecycle'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 7: Mandate
  s = { ...s, ...phaseMandate(s) };
  phaseEventCounts['mandate'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 8: Doom Expiry
  s = { ...s, ...phaseDoomExpiry(s) };
  phaseEventCounts['doom_expiry'] = s.tickEvents.length - prevEventCount;

  // Recalculate visibility
  const losSources = collectLOSSources(s.graph, s.ascendantId, scryTargets);
  const gridSize = {
    cols: Math.max(...s.tiles.map(t => t.coord.col)) + 1,
    rows: Math.max(...s.tiles.map(t => t.coord.row)) + 1,
  };
  const visibilityMap = recalcVisibility(s.visibilityMap, losSources, s.graph, s.tick, gridSize.cols, gridSize.rows);

  // Auto-reveal land layer for any hex that is now visible (fog of war lifted).
  // Simpler: any hex with state === 'visible' should have land revealed.
  {
    let rev = s.hexRevelation;
    for (const [key, entry] of visibilityMap) {
      if (entry.state === 'visible' && !rev?.[key]?.land) {
        const commaIdx = key.indexOf(',');
        const col = Number(key.slice(0, commaIdx));
        const row = Number(key.slice(commaIdx + 1));
        rev = revealLayer(rev, col, row, 'land');
      }
    }
    s = { ...s, visibilityMap, hexRevelation: rev };
  }

  // Merge tick events into recent events (ring buffer)
  const MAX = 100;
  const combined = [...s.recentEvents, ...s.tickEvents];
  s = { ...s, recentEvents: combined.slice(-MAX) };

  // Emit tick summary trace
  const essenceTotal = Object.values(s.essencePool).reduce((sum, val) => sum + val, 0);
  const mandateProgress = s.mandateState?.progress ?? 0;

  emitTrace({
    tick: s.tick,
    category: 'tick_summary',
    summary: `Tick ${s.tick}: ${s.tickEvents.length} events, ${agentsProcessed} agents processed, doom stage ${s.doomClock.currentStage}`,
    phaseEventCounts,
    agentsProcessed,
    doomStage: s.doomClock.currentStage,
    essenceTotal,
    mandateProgress,
  });

  // ─── State Cleanup ─────────────────────────────────────────────

  // Trim encounterNotifications older than NOTIFICATION_RETENTION_TICKS
  if (s.encounterNotifications && s.encounterNotifications.length > 0) {
    s = {
      ...s,
      encounterNotifications: s.encounterNotifications.filter(
        n => n.createdTick >= s.tick - NOTIFICATION_RETENTION_TICKS,
      ),
    };
  }

  // Stamp completedAtTick on newly-resolved actions, then prune old resolved ones
  if (s.unifiedActions && s.unifiedActions.length > 0) {
    const stamped = s.unifiedActions.map(a =>
      a.resolved && a.completedAtTick == null ? { ...a, completedAtTick: s.tick } : a,
    );
    s = {
      ...s,
      unifiedActions: stamped.filter(a =>
        !a.resolved || a.completedAtTick == null || s.tick - a.completedAtTick < RESOLVED_ACTION_RETENTION_TICKS,
      ),
    };
  }

  // ─── Health Validation ─────────────────────────────────────────

  const report = validateTickOutput(state, s);
  if (!report.healthy) {
    appendCrashLog({
      type: 'health_check_failed',
      tick: s.tick,
      timestamp: Date.now(),
      findings: report.findings,
    });
    emitTrace({
      tick: s.tick,
      category: 'tick_health',
      summary: `Health check failed: ${report.findings.map(f => f.check).join(', ')}`,
      findings: report.findings,
    } as TraceEntry);
  }

  return s;

  } catch (err) {
    // Fail-soft: crashed tick is a no-op, not a corruption
    const entry = {
      type: 'tick_exception' as const,
      tick: state.tick,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: Date.now(),
    };
    appendCrashLog(entry);
    emitTrace({
      tick: state.tick,
      category: 'tick_crash',
      summary: entry.error,
      ...entry,
    } as TraceEntry);
    console.error('[Orchestrator] Tick crashed, returning previous state:', err);
    return state; // fail-soft: return unchanged state
  }
}
