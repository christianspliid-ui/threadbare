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
import { resetNarrativeEventCounter } from './narrative';
import type { NarrativeEvent, NarrativeEventType, ChronicleEntry } from '../types/narrative';
import {
  DILEMMA_STAKES_PROSE,
  DILEMMA_ADJ_POOL,
  DILEMMA_NOUN_POOL,
  DILEMMA_VERB_POOL,
} from '../data/narrative-content';
import { phaseAgentLifecycle } from './agentLifecycle';
import { emitTrace } from './traceBuffer';
import { tickEffects } from './effectTick';
import { processEffectEvent, applyEffectEventResult } from './effects/effectEvents';
import { executeEffect } from './effectExecutors';
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
import { phaseMovement, resetMovementEventCounter } from './phaseMovement';
import { checkAndFireActionTriggers, type ActionTriggerContext } from './effects/actionTrigger';
import { collectAttachmentEffects } from './effects/effectWalker';
import { phaseColocationDetection, resetColocationEventCounter } from './phaseColocationDetection';
import { phaseInteractionDepth } from './phaseInteractionDepth';
import { emitEncounterRevelations, emitDilemmaRevelations, emitColocationRevelations, resetRevEventCounter } from './revelationEmitter';
import { phaseUnifiedActionProgress } from './unifiedActionResolution';
import { phaseIdleSelection, resetPhaseEventCounter } from './unifiedActionPhases';
import { UNIFIED_ACTION_TEMPLATES } from '../data/unified-action-templates';
import { phaseAmbitionProgress, resetAmbitionEventCounter } from './ambitionTick';
import { phaseFactionAmbitions } from './factionAmbitions';
import { phaseArmyAttrition } from './armyAttrition';
import { phaseArmyMovement } from './armyMovement';
import { phaseBattleDetection, phaseBattleTick } from './battleResolution';
import { phaseLairEscalation } from './lairEscalation';
import { phaseArmyNotifications } from './armyNotifications';
import { phaseProsperity } from './phaseProsperity';
import { checkTierPromotion } from './influence';
import { phaseTradeRouteDecay } from './phaseTradeRouteDecay';
import { phaseSublocations } from './phaseSublocations';
import { phaseSettlementPromotion } from './phaseSettlementPromotion';
import { phaseSettlementReassessment } from './phaseSettlementReassessment';
import { phaseEconomicChronicle } from './phaseEconomicChronicle';
import { phaseHexState } from './phaseHexState';
import { revealLayer } from './revelationResolver';
import { phaseUnrest } from './phaseUnrest';
import { phaseMagicalSaturation } from './phaseMagicalSaturation';
import { phaseSpherePressure } from './phaseSpherePressure';
import { phaseSphereAggregation } from './phaseSphereAggregation';
import { phaseQuintessence } from './phaseQuintessence';
import { QUINTESSENCE_ENCOUNTER_FAILURE_EROSION } from '../types/quintessence';
import { phaseEconomicTraits } from './phaseEconomicTraits';
import { decayConditions } from './conditionDecay';
import { processTraitDecay } from './traits';
import { phaseReputationTraits, processReputationTally } from './phaseReputationTraits';
import { processEncounterMastery, processEncounterConditions } from './phaseEncounterTraits';
import { phaseAgentDecision } from './phaseAgentDecision';
import { phaseStrategicProjects } from './phaseStrategicProjects';
import { phaseDivinePremonition } from './phaseDivinePremonition';
import { phaseControlEffects, resetControlEffectsCounter } from './phaseControlEffects';
// phaseDoom and phaseMandate are extracted to their own files with sphere pressure wiring.
// Imported for internal runTick use; re-exported for backward compatibility (tests import from orchestrator).
import { phaseDoom, resetDoomCounter } from './phaseDoom';
export { phaseDoom } from './phaseDoom';
import { phaseMandate, resetMandateCounter } from './phaseMandate';
export { phaseMandate } from './phaseMandate';
import { resetInfluenceCounter } from './interventionEffects';
import { resetMeetingCounter } from './meetingEncounter';
import { phaseJourneyBeat } from './journeyEngine';
import { JOURNEY_BEAT_TEMPLATES } from '../data/journey-content';
import { phaseEncounterVisibility } from './encounterVisibility';
import { evaluateEncounterSeeds } from './encounterSeeding';
import { EncounterCacheManager, buildDangerMap } from './encounterCache';
import { decayAllTrust } from './trustMechanics';
import { phaseNpcGraduation } from './npcGraduation';
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
import { processFactionOutcome, resetFactionEventSeq } from './factionOutcome';
import type { DistanceMatrix } from './distanceMatrix';
import { clearTimelines, appendEvent } from './encounterTimeline';
import { recordReward, clearRewardHistory } from './rewardHistory';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { ENCOUNTER_PRESSURE_PER_STEP, RIVAL_PRESSURE_MAGNITUDE } from '../types/sphereAffinity';
import { ANOMALY_RESOURCE_MAP, RESOURCE_DEFINITIONS } from '../data/resource-content';
import type { ResourceInstance } from '../types/resource';
import { createEncounterEventNode } from './encounterEventNode';
import type { SimulationRuntime } from './simulationRuntime';
import { accumulateImportance, checkGraduationThreshold, graduateRarity, getImportanceDelta, getRarityTier } from './rarity';
import { RARITY_NOTIFICATION_THRESHOLD } from '../data/rarity-constants';
import { RARITY_TIER_NAMES } from '../types/rarity';
import {
  touchWorld,
  touchStructure,
  ensureEncounterCache,
  ensureDistanceMatrix,
} from './simulationRuntime';
import { recordBalanceEvent } from './balanceTelemetry';
import { checkMidEncounterPromotion, isNotableEntry } from './attentionTier';
import type { EncounterPromotionTrace, DigestEntry } from '../types/attention';
import { appendDigestEntry } from './digestBuffer';
import { phaseAttention } from './phaseAttention';
import { phaseSlotCaps, phaseDisposalTimeout } from './phaseSlotCaps';

// ─── Legacy Decision Cache (backward-compat shim for tests) ───────
//
// TB-087: Caches now live in SimulationRuntime (per-session, owned by useSimulation).
// These module-level pointers exist only so tests that call resetDecisionCache()
// and getEncounterCacheManager() keep working. Runtime code uses the runtime object.

let legacyEncounterCache: EncounterCacheManager | null = null;
let legacyDistanceMatrix: DistanceMatrix | null = null;
let legacyRuntime: SimulationRuntime | null = null;

/** Reset the encounter cache, distance matrix, and timeline (useful for game restart / tests). */
export function resetDecisionCache(): void {
  legacyEncounterCache = null;
  legacyDistanceMatrix = null;
  legacyRuntime = null;
  clearTimelines();
  clearRewardHistory();
}

/** Read-only access to the current encounter cache (for debug tooling). */
export function getEncounterCacheManager(): EncounterCacheManager | null {
  // Prefer runtime-owned cache, fall back to legacy pointer
  return legacyRuntime?.encounterCache ?? legacyEncounterCache;
}

// ─── State Cleanup Constants ──────────────────────────────────────

/** Trim encounterNotifications older than this many ticks */
const NOTIFICATION_RETENTION_TICKS = 50;

/** Prune resolved unifiedActions older than this many ticks.
 *  Cooldowns are 5–15 ticks; 20 gives headroom without unbounded growth.
 *  Was 100 — caused O(agents × actions) quadratic tick cost at scale. */
const RESOLVED_ACTION_RETENTION_TICKS = 20;

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
let currentTickForIds = 0;
function nextEventId(): string {
  return `evt_${currentTickForIds}_${++eventCounter}`;
}

// Reset for testing
export function resetEventCounter(): void {
  eventCounter = 0;
}

/**
 * Reset all per-tick module event counters.
 * Called at the start of each tick to ensure deterministic ID sequences.
 * NFP #3: Determinism — same seed + same tick must produce identical IDs across runs.
 *
 * ─── Scope ──────────────────────────────────────────────────────────
 * Only counters that generate ephemeral TickEvent.id values are reset here.
 * Counters that generate persistent graph node IDs (e.g. lifecycleCounter,
 * unifiedAction actionCounter) must NOT be reset per-tick — doing so would
 * cause duplicate node IDs when re-used across ticks.
 */
function resetEventCounters(): void {
  // orchestrator.ts own counter (evt_N tick events)
  eventCounter = 0;
  // Phase module counters (Plan 01 wiring — these encode tick in their IDs)
  resetMandateCounter();
  resetDoomCounter();
  resetControlEffectsCounter();
  resetInfluenceCounter();
  resetMeetingCounter();
  // Additional ephemeral-event counters (Plan 02 — complete DTRM-03 coverage)
  // Note: resetLifecycleCounter and resetUnifiedActionCounter are intentionally
  // excluded — those generate persistent graph node / action IDs, not tick events.
  resetMovementEventCounter();
  resetColocationEventCounter();
  resetNarrativeEventCounter();
  resetPhaseEventCounter();
  resetAmbitionEventCounter();
  resetRevEventCounter();
  resetFactionEventSeq();
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
export function phaseEncounterProgressionV2(state: GameState, runtime?: SimulationRuntime): Partial<GameState> {
  const events: TickEvent[] = [];
  const spherePressures: SpherePressureEvent[] = [];
  const graduationChronicles: ChronicleEntry[] = [];
  let updatedProgress = [...state.encounterProgress];
  // Digest buffer: accumulate background/invisible encounter outcomes for Read the Threads.
  const digestBuffer: DigestEntry[] = [...(state.digestBuffer ?? [])];
  // Running effectStates — updated as encounter events fire reactive/stacking/until_event effects
  let runningEffectStates = new Map(state.effectStates ?? new Map());

  const activeEncounters = updatedProgress.filter(p => p.status === 'active');
  for (const progress of activeEncounters) {
    // Skip if agent is still occupied (multi-tick step in progress)
    if (isEncounterOccupied(progress, state.tick)) continue;

    // Resolve current step (includes capability growth + tier promotion).
    // NFP #3: Determinism — derive per-encounter seeded roll from world seed + tick + actor ID.
    const encRng = mulberry32(state.seed + state.tick * 43 + hashString(progress.actorId));
    const result = resolveEncounter(state, progress, Math.floor(encRng() * 100) + 1);
    // Capture resolved step index before advance mutates it (TB-077)
    const resolvedStepIndex = progress.currentEncounterIndex;
    // Advance encounter (mutates progress in place)
    advanceEncounter(state, progress, result.success, state.tick, result.resolutionSnapshot);

    // Effect events — fire reactive/stacking/until_event effects for encounter outcome
    {
      const encounterForEvent = getAnyEncounterById(progress.encounterId);
      const stepForEvent = encounterForEvent?.steps[resolvedStepIndex];
      if (stepForEvent) {
        const eventResult = processEffectEvent(
          state.graph,
          progress.actorId,
          { type: 'encounter_outcome', reach: stepForEvent.reach, success: result.success },
          runningEffectStates,
          state.tick,
          encRng,
        );
        runningEffectStates = applyEffectEventResult(state.graph, eventResult);
        // Execute transform requests: old attachment already destroyed by applyEffectEventResult;
        // instantiate the new template and attach it to the agent.
        for (const req of eventResult.transformRequests) {
          instantiateReward(state.graph, req.intoTemplate, progress.actorId, state.tick);
        }
        // Execute reactive nested effects via the generic dispatcher
        for (const fired of eventResult.reactivesFired) {
          const execResult = executeEffect(fired.nestedEffect, {
            casterId: fired.agentId,
            tick: state.tick,
            graph: state.graph,
          });
          // Apply graph mutations from the nested effect
          for (const mut of execResult.mutations) {
            try {
              if (mut.type === 'add_node' && mut.data) state.graph.addNode(mut.data as import('../types/graph').GraphNode);
              else if (mut.type === 'remove_node' && mut.nodeId) state.graph.removeNode(mut.nodeId);
              else if (mut.type === 'add_edge' && mut.data) state.graph.addEdge(mut.data as import('../types/graph').GraphEdge);
              else if (mut.type === 'remove_edge' && mut.edgeId) state.graph.removeEdge(mut.edgeId);
            } catch { /* fail-soft: skip invalid mutations */ }
          }
          for (const trace of execResult.traces) {
            emitTrace(trace as unknown as TraceEntry);
          }
        }
        for (const trace of eventResult.traces) {
          emitTrace(trace as unknown as TraceEntry);
        }
      }
    }

    // ── Mid-encounter tier promotion ─────────────────────────────────
    // Only runs when effectiveTier is set (i.e. created after Task 15 wiring).
    // Never demotes — checkMidEncounterPromotion handles the ceiling logic.
    if (progress.effectiveTier && progress.effectiveTier !== 'invisible') {
      const promotionTriggers = {
        // Tier promotion: capability tier crossed during this step
        tierPromotion: !!result.growth?.tierCrossed,
        // Wound: encounter step failed (damage taken) — conservative proxy
        wound: !result.success,
      };
      const newTier = checkMidEncounterPromotion(
        progress.effectiveTier,
        promotionTriggers,
      );
      if (newTier !== null) {
        const fromTier = progress.effectiveTier;
        progress.effectiveTier = newTier;
        const promotionTrace: EncounterPromotionTrace = {
          type: 'encounter_promotion',
          tick: state.tick,
          encounterId: progress.encounterId,
          agentId: progress.actorId,
          fromTier,
          toTier: newTier,
          reason: promotionTriggers.tierPromotion ? 'tierPromotion' : 'wound',
        };
        emitTrace(promotionTrace as unknown as TraceEntry);
      }
    }

    // Balance telemetry: step_resolved (legacy encounter)
    if (runtime) {
      const encounter = getAnyEncounterById(progress.encounterId);
      const step = encounter?.steps[resolvedStepIndex];
      recordBalanceEvent(runtime, {
        tick: state.tick,
        kind: 'step_resolved',
        agentId: progress.actorId,
        sourceSystem: 'legacy_encounter',
        encounterId: progress.encounterId,
        stepIndex: resolvedStepIndex,
        reach: step?.reach,
        difficulty: step?.difficulty,
        capability: result.outcomeType === 'success' || result.outcomeType === 'critical_success' ? undefined : undefined,
        probability: undefined,
        roll: undefined,
        result: result.success ? 'success' : 'failure',
        threatBand: (encounter?.threatRating ?? 'unknown') as import('../types/balanceEval').BalanceThreatBand,
      });
    }

    // Phase 2: Balance telemetry for encounter failure quintessence erosion (per-band).
    // This lets the evaluator compute quintessence_loss_per_encounter scoped by threat band.
    if (runtime && !result.success) {
      const encounterForQ = getAnyEncounterById(progress.encounterId);
      recordBalanceEvent(runtime, {
        tick: state.tick,
        kind: 'quintessence_changed',
        agentId: progress.actorId,
        sourceSystem: 'legacy_encounter',
        quintessenceDelta: -QUINTESSENCE_ENCOUNTER_FAILURE_EROSION,
        quintessenceReason: 'encounter_failure_by_band',
        threatBand: (encounterForQ?.threatRating ?? 'unknown') as import('../types/balanceEval').BalanceThreatBand,
      });
    }

    // Balance telemetry: growth_applied (legacy encounter tier promotion)
    if (runtime && result.growth?.tierCrossed) {
      const encounter = getAnyEncounterById(progress.encounterId);
      const step = encounter?.steps[resolvedStepIndex];
      recordBalanceEvent(runtime, {
        tick: state.tick,
        kind: 'growth_applied',
        agentId: progress.actorId,
        sourceSystem: 'legacy_encounter',
        encounterId: progress.encounterId,
        growthReach: step?.reach,
        growthDelta: result.growth.delta,
        newTier: result.growth.newTier,
      });
    }

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

    // ── Reputation trait tally accumulation ──
    processReputationTally(
      state.graph,
      progress.actorId,
      progress.encounterId,
      result.success,
      progress.status === 'completed',
      state.tick,
    );

    // ── Encounter mastery + condition trait processing ──
    try {
      processEncounterMastery(
        state.graph,
        progress.actorId,
        progress.encounterId,
        result.success,
        progress.status === 'completed',
        state.tick,
      );
      processEncounterConditions(
        state.graph,
        progress.actorId,
        progress.encounterId,
        result.success,
        progress.status === 'completed',
        state.tick,
      );
    } catch {
      // fail-soft: encounter trait processing failure is non-fatal
    }

    // ── Faction join/promotion outcome processing (TB-061, TB-063 events) ──
    if (progress.status === 'completed') {
      const outcomeRng = mulberry32(state.seed + state.tick * 43 + hashString(progress.actorId));
      const factionEvents = processFactionOutcome(state.graph, progress, state.tick, outcomeRng);
      events.push(...factionEvents);
    }

    // ── Reward processing (runs on encounter completion/abandonment) ──
    let rewardName: string | undefined;
    let rewardInstanceId: string | undefined;
    if ((progress.status === 'completed' || progress.status === 'abandoned') && result.outcome.rewardPool) {
      const rng = mulberry32(state.seed + state.tick * 41 + hashString(progress.actorId));
      const resolved = resolveRewardRecipe(result.outcome.rewardPool, result.outcomeType);

      // Bad outcome check
      const badRoll = rng();
      const isBadOutcome = badRoll < resolved.badOutcomeChance;

      const effectiveRecipe = isBadOutcome
        ? { ...resolved, categoryWeights: BAD_OUTCOME_CATEGORY_WEIGHTS, tagFilters: undefined }
        : resolved;

      const pool = assembleRewardPool(state.graph, effectiveRecipe);
      const agentNameForReward = state.graph.getNode(progress.actorId)?.name ?? '?';

      if (pool.length > 0) {
        const drawRoll = rng();
        const templateId = drawFromPool(pool, drawRoll);

        if (templateId) {
          const instantiation = instantiateReward(state.graph, templateId, progress.actorId, state.tick);

          if (instantiation) {
            rewardInstanceId = instantiation.instanceId;
            rewardName = instantiation.displayName;
            const templateNode = state.graph.getNode(templateId);
            const tier = (templateNode?.properties?.tier as number) ?? 1;
            const traceRewardName = instantiation.displayName || templateNode?.name || '?';

            emitTrace({
              category: 'encounter',
              tick: state.tick,
              agentId: progress.actorId,
              agentName: agentNameForReward,
              event: isBadOutcome ? 'reward_bad_outcome' : 'reward_drawn',
              templateId,
              instanceId: instantiation.instanceId,
              templateName: templateNode?.name ?? '?',
              tier,
              attachmentCategory: instantiation.category,
              poolSize: pool.length,
              roll: drawRoll,
              summary: `${agentNameForReward} ${isBadOutcome ? 'suffered' : 'earned'} ${traceRewardName} (T${tier} ${instantiation.category})`,
            } as TraceEntry);

            recordReward({
              tick: state.tick,
              agentId: progress.actorId,
              agentName: agentNameForReward,
              encounterId: progress.encounterId,
              templateId,
              templateName: templateNode?.name ?? '?',
              instanceId: instantiation.instanceId,
              category: instantiation.category,
              tier,
              isBadOutcome,
              poolSize: pool.length,
              roll: drawRoll,
            });

            // Balance telemetry: reward_granted
            if (runtime) {
              recordBalanceEvent(runtime, {
                tick: state.tick,
                kind: 'reward_granted',
                agentId: progress.actorId,
                sourceSystem: 'legacy_encounter',
                encounterId: progress.encounterId,
                rewardTemplateId: templateId,
                rewardCategory: instantiation.category,
                rewardTier: tier,
                isBadOutcome,
                rewardPoolSize: pool.length,
              });
            }
          }
        }
      } else {
        emitTrace({
          category: 'encounter',
          tick: state.tick,
          agentId: progress.actorId,
          agentName: agentNameForReward,
          event: 'reward_pool_empty',
          encounterId: progress.encounterId,
          summary: `Reward pool empty for ${progress.encounterId} (${result.outcomeType})`,
        } as TraceEntry);

        recordReward({
          tick: state.tick,
          agentId: progress.actorId,
          agentName: agentNameForReward,
          encounterId: progress.encounterId,
          templateId: null,
          templateName: null,
          instanceId: null,
          category: null,
          tier: null,
          isBadOutcome,
          poolSize: 0,
          roll: null,
        });

        // Balance telemetry: reward_granted (empty pool — missed reward)
        if (runtime) {
          recordBalanceEvent(runtime, {
            tick: state.tick,
            kind: 'reward_granted',
            agentId: progress.actorId,
            sourceSystem: 'legacy_encounter',
            encounterId: progress.encounterId,
            rewardTemplateId: null,
            isBadOutcome,
            rewardPoolSize: 0,
          });
        }
      }
    }

    // ── Timeline: ENCOUNTER_END (here instead of advanceEncounter so reward name is available) ──
    if (progress.status === 'completed' || progress.status === 'abandoned') {
      appendEvent(progress.actorId, {
        phase: 'ENCOUNTER_END',
        tick: state.tick,
        encounter: progress.encounterId,
        status: progress.status,
        ...(rewardName !== undefined && { reward: rewardName }),
      });

      // Balance telemetry: encounter_resolved
      if (runtime) {
        const encounter = getAnyEncounterById(progress.encounterId);
        recordBalanceEvent(runtime, {
          tick: state.tick,
          kind: 'encounter_resolved',
          agentId: progress.actorId,
          sourceSystem: 'legacy_encounter',
          encounterId: progress.encounterId,
          finalStatus: progress.status,
          threatBand: (encounter?.threatRating ?? 'unknown') as import('../types/balanceEval').BalanceThreatBand,
        });
      }
    }

    // ── Action trigger check on encounter completion (TB-104 Phase 1B) ──
    if (progress.status === 'completed' || progress.status === 'abandoned') {
      const triggerEvent = result.success ? 'encounter_success' : 'encounter_failure';
      const agentNode = state.graph.getNode(progress.actorId);
      if (agentNode) {
        const agentProps = agentNode.properties as Record<string, unknown>;
        const triggerCtx: ActionTriggerContext = {
          agentId: progress.actorId,
          tick: state.tick,
          agentResources: {
            essence: (agentProps.essence as number) ?? 0,
            quintessence: (agentProps.quintessence as number) ?? 0,
            quintessenceMax: (agentProps.quintessenceMax as number) ?? Infinity,
            doom: (agentProps.doom as number) ?? 0,
            doomThreshold: (agentProps.doomThreshold as number) ?? 100,
          },
        };
        const attachedEffects = collectAttachmentEffects(
          state.graph,
          progress.actorId,
          runningEffectStates,
        );
        const triggerResult = checkAndFireActionTriggers(
          attachedEffects,
          triggerEvent as import('../types/effects').ActionTriggerEvent,
          triggerCtx,
          runningEffectStates,
        );
        if (triggerResult.firedCount > 0) {
          for (const delta of triggerResult.resourceDeltas) {
            (agentProps as Record<string, number>)[delta.resource] = delta.after;
          }
          if (triggerResult.resourceDeltas.length > 0) {
            state.graph.updateNode(progress.actorId, { properties: agentProps });
          }
          runningEffectStates = triggerResult.updatedStates;
        }
      }
    }

    // ── Anomaly discovery: on completion, seed resource + flip discovered flag ──
    if (progress.status === 'completed') {
      const locEdges = state.graph.getOutgoingEdges(progress.actorId, 'located_at');
      const locId = locEdges[0]?.target;
      if (locId) {
        const locNode = state.graph.getNode(locId);
        const locProps = locNode?.properties as Record<string, unknown> | undefined;
        const locSubtype = (locProps?.locationSubtype ?? locProps?.locationType) as string | undefined;

        if (locProps?.isAnomalyLocation === true && locProps?.discoveredByExploration !== true && locSubtype) {
          const resourceId = ANOMALY_RESOURCE_MAP[locSubtype];
          const resourceDef = resourceId ? RESOURCE_DEFINITIONS[resourceId] : undefined;

          // Flip discovered flag
          state.graph.updateNode(locId, {
            properties: { discoveredByExploration: true },
          });

          // Seed rare resource on the location
          if (resourceDef) {
            const resRng = mulberry32(state.seed + state.tick * 37 + hashString(locId));
            const [minQ, maxQ] = resourceDef.baseQuantity;
            const quantity = Math.round(minQ + resRng() * (maxQ - minQ));
            const existing = (locProps.resources as Record<string, ResourceInstance> | undefined) ?? {};
            existing[resourceDef.id] = {
              quantity,
              renewable: resourceDef.renewable,
              renewalRate: resourceDef.renewalRate,
            };
            state.graph.updateNode(locId, {
              properties: { resources: existing },
            });
          }

          // Emit discovery event
          const discovererName = state.graph.getNode(progress.actorId)?.name ?? 'An explorer';
          events.push({
            id: nextEventId(),
            tick: state.tick,
            type: 'anomaly_discovered',
            message: `${discovererName} discovered ${locNode?.name ?? 'a hidden site'} — ${resourceDef?.name ?? 'rare resources'} revealed!`,
            significance: 0.9,
            actorId: progress.actorId,
            notification: { channel: 'toast' as const },
            hexCoords: { col: locProps.hexCol as number, row: locProps.hexRow as number },
          });

          emitTrace({
            category: 'encounter',
            tick: state.tick,
            agentId: progress.actorId,
            agentName: discovererName,
            event: 'anomaly_discovered',
            locationId: locId,
            locationName: locNode?.name ?? '?',
            resourceId: resourceDef?.id,
            resourceQuantity: resourceDef ? Math.round(resourceDef.baseQuantity[0] + (resourceDef.baseQuantity[1] - resourceDef.baseQuantity[0]) / 2) : 0,
            summary: `${discovererName} discovered anomaly "${locNode?.name ?? '?'}" — ${resourceDef?.name ?? 'unknown'} seeded`,
          } as TraceEntry);
        }
      }
    }

    // ── TB-077: Create encounter event node in graph (Layer 1) ──
    {
      const encounter = getAnyEncounterById(progress.encounterId);
      if (encounter) {
        createEncounterEventNode({
          graph: state.graph,
          progress,
          template: encounter,
          stepIndex: resolvedStepIndex,
          outcomeType: result.outcomeType,
          tick: state.tick,
          rewardInstanceId,
          tierPromotionOccurred: !!(result.growth?.tierCrossed && result.promotion?.traitGranted),
        });
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
        actorId: progress.actorId,
      });
    }

    // ── Rarity: Importance accumulation on encounter step resolution ──
    // Only for individual actors. Fail-soft: missing node → skip.
    if (result.success) {
      const actorNodeForRarity = state.graph.getNode(progress.actorId);
      if (actorNodeForRarity && actorNodeForRarity.properties?.actorType === 'individual') {
        const actorDelta = getImportanceDelta('encounter_resolved');
        const actorNewImportance = accumulateImportance(actorNodeForRarity, actorDelta);
        // Emit importance trace
        emitTrace({
          category: 'rarity_importance',
          tick: state.tick,
          nodeId: actorNodeForRarity.id,
          nodeName: actorNodeForRarity.name ?? actorNodeForRarity.id,
          source: 'encounter_resolved',
          delta: actorDelta,
          newImportance: actorNewImportance,
          currentTier: getRarityTier(actorNodeForRarity),
          summary: `importance +${actorDelta} for ${actorNodeForRarity.name ?? actorNodeForRarity.id} (now ${actorNewImportance})`,
          agentId: actorNodeForRarity.id,
        } as import('../types/trace').RarityImportanceTrace);
        // Loop to handle rare multi-tier jumps
        let graduationTier = checkGraduationThreshold(actorNodeForRarity);
        while (graduationTier !== null) {
          const prevTierForGrad = getRarityTier(actorNodeForRarity);
          graduateRarity(actorNodeForRarity, graduationTier);
          // Emit graduation trace (Fix 1)
          emitTrace({
            category: 'rarity_graduation',
            tick: state.tick,
            nodeId: actorNodeForRarity.id,
            nodeCategory: 'actor',
            previousTier: prevTierForGrad,
            newTier: graduationTier,
            trigger: 'organic_threshold',
            cause: `importance reached graduation threshold`,
            summary: `${actorNodeForRarity.name ?? actorNodeForRarity.id} graduated from tier ${prevTierForGrad} to tier ${graduationTier}`,
            agentId: actorNodeForRarity.id,
          } as import('../types/trace').RarityGraduationTrace);
          // Emit graduation notification and chronicle for tiers at or above threshold (Fix 2)
          if (graduationTier >= RARITY_NOTIFICATION_THRESHOLD) {
            const nodeName = actorNodeForRarity.name ?? actorNodeForRarity.id;
            const message = graduationTier >= 4
              ? `${nodeName} has transcended mortal reckoning — a legend walks the realm.`
              : `${nodeName} has achieved ${RARITY_TIER_NAMES[graduationTier]} status.`;
            events.push({
              id: nextEventId(),
              tick: state.tick,
              type: 'tier_promotion',
              message,
              significance: 0.9,
              actorId: actorNodeForRarity.id,
              notification: { channel: 'toast' as const },
            });
            graduationChronicles.push({
              id: `rarity-grad-${actorNodeForRarity.id}-${state.tick}`,
              tier: 'chronicle',
              title: message,
              prose: message,
              promptContext: {
                actors: [actorNodeForRarity.id],
                location: '',
                sphere: 'spirit',
                mood: 'legendary',
              },
              tick: state.tick,
            });
          }
          graduationTier = checkGraduationThreshold(actorNodeForRarity);
        }
      }

      // Accumulate on target actor if present
      if (progress.targetAgentId) {
        const targetNode = state.graph.getNode(progress.targetAgentId);
        if (targetNode && targetNode.properties?.actorType === 'individual') {
          const targetDelta = getImportanceDelta('encounter_resolved');
          const targetNewImportance = accumulateImportance(targetNode, targetDelta);
          // Emit importance trace
          emitTrace({
            category: 'rarity_importance',
            tick: state.tick,
            nodeId: targetNode.id,
            nodeName: targetNode.name ?? targetNode.id,
            source: 'encounter_resolved',
            delta: targetDelta,
            newImportance: targetNewImportance,
            currentTier: getRarityTier(targetNode),
            summary: `importance +${targetDelta} for ${targetNode.name ?? targetNode.id} (now ${targetNewImportance})`,
            agentId: targetNode.id,
          } as import('../types/trace').RarityImportanceTrace);
          // Loop to handle rare multi-tier jumps
          let targetGradTier = checkGraduationThreshold(targetNode);
          while (targetGradTier !== null) {
            const prevTierForTargetGrad = getRarityTier(targetNode);
            graduateRarity(targetNode, targetGradTier);
            // Emit graduation trace (Fix 1)
            emitTrace({
              category: 'rarity_graduation',
              tick: state.tick,
              nodeId: targetNode.id,
              nodeCategory: 'actor',
              previousTier: prevTierForTargetGrad,
              newTier: targetGradTier,
              trigger: 'organic_threshold',
              cause: `importance reached graduation threshold`,
              summary: `${targetNode.name ?? targetNode.id} graduated from tier ${prevTierForTargetGrad} to tier ${targetGradTier}`,
              agentId: targetNode.id,
            } as import('../types/trace').RarityGraduationTrace);
            // Emit graduation notification and chronicle for tiers at or above threshold (Fix 2)
            if (targetGradTier >= RARITY_NOTIFICATION_THRESHOLD) {
              const targetName = targetNode.name ?? targetNode.id;
              const message = targetGradTier >= 4
                ? `${targetName} has transcended mortal reckoning — a legend walks the realm.`
                : `${targetName} has achieved ${RARITY_TIER_NAMES[targetGradTier]} status.`;
              events.push({
                id: nextEventId(),
                tick: state.tick,
                type: 'tier_promotion',
                message,
                significance: 0.9,
                actorId: targetNode.id,
                notification: { channel: 'toast' as const },
              });
              graduationChronicles.push({
                id: `rarity-grad-${targetNode.id}-${state.tick}`,
                tier: 'chronicle',
                title: message,
                prose: message,
                promptContext: {
                  actors: [targetNode.id],
                  location: '',
                  sphere: 'spirit',
                  mood: 'legendary',
                },
                tick: state.tick,
              });
            }
            targetGradTier = checkGraduationThreshold(targetNode);
          }
        }
      }
    }

    // ── Digest Buffer: accumulate background/invisible encounter outcomes ──
    // Only runs on completion or abandonment (not mid-step). Fail-soft: missing
    // template or agent node → use defaults. Only accumulates if effectiveTier
    // was set at initiation (encounters created before Task 15 have no tier).
    if (
      (progress.status === 'completed' || progress.status === 'abandoned') &&
      (progress.effectiveTier === 'background' || progress.effectiveTier === 'invisible')
    ) {
      const digestAgentNode = state.graph.getNode(progress.actorId);
      const digestTemplate = getAnyEncounterById(progress.encounterId);
      const digestEntry: DigestEntry = {
        agentId: progress.actorId,
        agentName: digestAgentNode?.properties?.name ?? digestAgentNode?.name ?? 'Unknown',
        encounterId: progress.encounterId,
        encounterName: digestTemplate?.name ?? 'Unknown Encounter',
        encounterType: digestTemplate?.encounterType ?? 'explore',
        reachPrimary: digestTemplate?.reachPrimary ?? 'iron',
        tick: state.tick,
        success: result.success,
        significantOutcomes: [],
        capabilityChanges: result.growth ? { [digestTemplate?.reachPrimary ?? 'iron']: result.growth.delta ?? 0 } : {},
        attachmentsGained: [],
        attachmentsLost: [],
        quintessenceDelta: 0,
        isNotable: false,
        wasCuratedOut: false,
        isDormantAgent: progress.effectiveTier === 'invisible',
        sourceType: 'agent',
      };
      digestEntry.isNotable = isNotableEntry({
        quintessenceDelta: digestEntry.quintessenceDelta,
        attachmentsLost: digestEntry.attachmentsLost,
        tierPromoted: !!result.promotion?.traitGranted,
      });
      appendDigestEntry(digestBuffer, digestEntry);
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
        actorId: progress.actorId,
      });
    }
  }

  return {
    tickEvents: [...state.tickEvents, ...events],
    encounterProgress: updatedProgress,
    effectStates: runningEffectStates,
    digestBuffer,
    ...(spherePressures.length > 0
      ? { pendingSpherePressures: [...(state.pendingSpherePressures ?? []), ...spherePressures] }
      : {}),
    ...(graduationChronicles.length > 0
      ? { chronicleEntries: [...state.chronicleEntries, ...graduationChronicles] }
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
      actorId: event.actorId ?? actor.id,
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
        actorId: event.actorId,
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

export function runTick(state: GameState, scryTargets: import('../types').HexCoord[] = [], runtime?: SimulationRuntime): GameState {
  try {
  // Start with clean tick events
  let s: GameState = { ...state, tick: state.tick + 1, tickEvents: [], prosperityShocks: [] };

  // Capture tick for ID generation before any phase runs
  currentTickForIds = s.tick;

  // Reset per-tick event counters for deterministic ID generation (NFP #3).
  // Must happen before any phase runs so all IDs use fresh sequences for this tick.
  resetEventCounters();

  // TB-087: Use runtime-owned caches when available, fall back to legacy module globals for tests
  let activeEncounterCache: EncounterCacheManager;
  let activeDistanceMatrix: DistanceMatrix;
  if (runtime) {
    activeEncounterCache = ensureEncounterCache(runtime, s.graph, s.tick, s.tiles);
    activeDistanceMatrix = ensureDistanceMatrix(runtime, s.graph);
    // Keep legacy pointer in sync for getEncounterCacheManager()
    legacyRuntime = runtime;
  } else {
    // Legacy path: module-global caches (tests that don't pass a runtime)
    if (!legacyEncounterCache) {
      legacyEncounterCache = new EncounterCacheManager();
      const dangerMap = buildDangerMap(s.tiles);
      legacyEncounterCache.buildFullCache(s.graph, s.tick, dangerMap);
    }
    if (!legacyDistanceMatrix) {
      legacyDistanceMatrix = buildDistanceMatrix(s.graph);
    }
    activeEncounterCache = legacyEncounterCache;
    activeDistanceMatrix = legacyDistanceMatrix;
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
  s = { ...s, ...phaseUnifiedActionProgress(s, UNIFIED_ACTION_TEMPLATES, uaRng, runtime) };
  phaseEventCounts['unified_action_progress'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2a.1: Thread-bind familiarity grant — when a bind_thread_* action resolves
  // successfully, grant the matching worship familiarity so knowledge level updates
  // immediately (mirrors the initial familiarity set in gameInit for existing threads).
  {
    const prevActions = state.unifiedActions ?? [];
    const nextActions = s.unifiedActions ?? [];
    let famMap = s.familiarityMap;
    for (const action of nextActions) {
      if (!action.resolved || action.outcome !== 'success') continue;
      if (!action.templateId.startsWith('bind_thread_')) continue;
      if (!action.targetId) continue;
      // Only grant if this action was just resolved this tick (wasn't resolved before)
      const wasResolved = prevActions.find(a => a.actionId === action.actionId)?.resolved ?? false;
      if (wasResolved) continue;
      // Determine tier from the resolved thread edge (add_edge may have set it)
      const threadEdges = s.graph.getIncomingEdges(action.targetId, 'thread');
      const threadEdge = threadEdges.find(e => e.source === s.ascendantId);
      const tier = (threadEdge?.properties as Record<string, unknown> | undefined)?.tier as number ?? 1;
      const gainKey = `worship_tier_${tier}` as keyof typeof FAMILIARITY_GAINS;
      const gain = FAMILIARITY_GAINS[gainKey] ?? FAMILIARITY_GAINS.worship_tier_1;
      famMap = addFamiliarity(famMap, action.targetId, gain);
    }
    if (famMap !== s.familiarityMap) {
      s = { ...s, familiarityMap: famMap };
    }
  }

  // Phase 2a.4: Effect Tick — per-agent effect bookkeeping (duration, cooldown, decay, stacking,
  //             axiological_drift, hex_effect, resource_manipulate)
  {
    const effectStates = s.effectStates ?? new Map();
    const agents = s.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual' || n.properties.actorType === 'ascendant');
    let updatedEffectStates = new Map(effectStates);
    const effectHexMutations: import('../types/hexMutation').HexMutation[] = [];
    for (const agent of agents) {
      const result = tickEffects(s.graph, agent.id, s.tick, updatedEffectStates);
      updatedEffectStates = result.updatedStates;
      // Collect hex mutations from hex_effect primitives — passed to phaseHexState below
      for (const mut of result.hexMutations) effectHexMutations.push(mut);
      // Remove destroyed attachments from graph
      for (const attachId of result.destroyedAttachments) {
        const edges = s.graph.getIncomingEdges(attachId);
        for (const edge of edges) {
          try { s.graph.removeEdge(edge.id); } catch { /* already removed */ }
        }
        try { s.graph.removeNode(attachId); } catch { /* already removed */ }
      }
      // Emit traces
      for (const trace of result.traces) {
        emitTrace(trace as unknown as TraceEntry);
      }
    }
    const existingHexMutations = s.pendingHexMutations ?? [];
    s = { ...s, effectStates: updatedEffectStates,
      pendingHexMutations: [...existingHexMutations, ...effectHexMutations] };
  }

  // Phase 2a.5: Encounter Progression — advance active encounters whose current step has elapsed
  s = { ...s, ...phaseEncounterProgressionV2(s, runtime) };
  phaseEventCounts['encounter_progression'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2a.55: Strategic Projects — advance multi-tick projects and tick control degradation
  {
    const stratProjRng = mulberry32(state.seed + state.tick * 59);
    s = { ...s, ...phaseStrategicProjects(s, stratProjRng) };
    phaseEventCounts['strategic_projects'] = s.tickEvents.length - prevEventCount;
    prevEventCount = s.tickEvents.length;
  }

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

  // Phase 2a.65: Attention Pool — regen pool, expire tugs, generate new tugs for shaping encounters
  {
    const attentionRng = mulberry32(state.seed + state.tick * 71);
    s = { ...s, ...phaseAttention(s, UNIFIED_ACTION_TEMPLATES, attentionRng) };
  }

  // Phase 2a.8: Evaluate encounter seeds planted by aftermath reactions
  {
    const seedRng = mulberry32(state.seed + state.tick * 53);
    s = evaluateEncounterSeeds(s, s.tick, seedRng);
    phaseEventCounts['encounter_seeding'] = s.tickEvents.length - prevEventCount;
    prevEventCount = s.tickEvents.length;
  }

  // Phase 2a.85: Slot Cap Enforcement — deactivate overflow possessions, handle condition overflow
  phaseSlotCaps(s);
  phaseDisposalTimeout(s);
  phaseEventCounts['slot_caps'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2a.9: Divine Premonition (Whisper) — subconscious nudges for idle threaded agents
  {
    const whisperRng = mulberry32(state.seed + state.tick * 67);
    s = { ...s, ...phaseDivinePremonition(s, whisperRng) };
    phaseEventCounts['divine_premonition'] = s.tickEvents.length - prevEventCount;
    prevEventCount = s.tickEvents.length;
  }

  // Phase 2b: Agent Decision — unified encounter-driven decision pipeline (replaces phaseIdleSelection)
  // @deprecated — phaseIdleSelection replaced by phaseAgentDecision
  const decisionRng = mulberry32(state.seed + state.tick * 37);
  s = { ...s, ...phaseAgentDecision(s, activeEncounterCache, activeDistanceMatrix, decisionRng, runtime) };
  const decisionEvents = s.tickEvents.length - prevEventCount;
  phaseEventCounts['agent_decision'] = decisionEvents;
  agentsProcessed += decisionEvents;
  prevEventCount = s.tickEvents.length;

  // Phase 2.35: Agent Movement (goal-directed pathfinding)

  s = { ...s, ...phaseMovement(s) };
  phaseEventCounts['agent_movement'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.352: Army Movement (TB-073 — armies advance toward objectives)
  phaseArmyMovement(s);

  // Phase 2.355: Army Attrition (TB-073 — Quintessence degradation during march)
  phaseArmyAttrition(s);

  // Phase 2.356: Battle Detection (TB-073 — hostile army colocation → battle node)
  phaseBattleDetection(s);

  // Phase 2.357: Battle Tick (TB-073 — process active battles: attrition, momentum, resolution)
  phaseBattleTick(s);

  // Phase 2.3575: Lair Escalation (M2.5 — tier upgrades, sphere feedback, spawn)
  phaseLairEscalation(s);

  // Phase 2.358: Army Notifications (TB-073 — convert army/battle traces to TickEvents)
  s = { ...s, ...phaseArmyNotifications(s, nextEventId) };

  // Phase 2.36: Colocation Detection (after movement, before sublocation dissolution)
  s = { ...s, ...phaseColocationDetection(s) };
  phaseEventCounts['colocation_detection'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.37: Colocation Revelations (first-sighting possession reveals, faction bond auto-reveals)
  emitColocationRevelations(s);
  phaseEventCounts['colocation_revelations'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.38: NPC Graduation ──
  const npcGradEvents = phaseNpcGraduation(s);
  if (npcGradEvents.length > 0) {
    s = { ...s, tickEvents: [...s.tickEvents, ...npcGradEvents] };
  }
  phaseEventCounts['npc_graduation'] = npcGradEvents.length;
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


  // ─── Resources & Divine ───────────────────────────────────────────────────────
  // What the player earns and spends this tick.

  // Phase 6: Essence
  s = { ...s, ...phaseEssence(s) };
  phaseEventCounts['essence'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.1: Control Effects (sustained divine effects — drain/income/threshold/lapse)
  s = { ...s, ...phaseControlEffects(s) };
  phaseEventCounts['control_effects'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // ─── Decay ─────────────────────────────────────────────────────────────────────
  // Entropy pulls everything toward zero. Reputation, influence, trade, and magic
  // all fade without reinforcement.

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

  // PHASE-D-DEFERRED: Wire accumulateImportance(node, getImportanceDelta('divine_proximity'))
  // for entities near active ascendant hex. Needs a per-tick spatial scan: find all actor/location
  // nodes within N hexes of the ascendant's current hex position, then call accumulateImportance
  // on each. Insert here, after divine influence decay and before trade route decay, so the
  // importance accumulation benefits from the same tick's divine influence values.
  // See rarity-constants.ts IMPORTANCE_DIVINE_PROXIMITY for the delta value.

  // Phase 6.62: Trade Route Decay (stale routes lose volume; dead routes removed)
  s = { ...s, ...phaseTradeRouteDecay(s) };
  phaseEventCounts['trade_route_decay'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.625: Condition Decay (tick-based removal of transient condition traits)
  try {
    decayConditions(s.graph, s.tick);
  } catch {
    // fail-soft: condition decay failure is non-fatal
  }

  // Phase 6.626: Mastery Trait Decay (mastery traits lose levels without reinforcement)
  try {
    const agents = s.graph.getNodesByType('actor');
    for (const agent of agents) {
      processTraitDecay(s.graph, agent.id, s.tick);
    }
  } catch {
    // fail-soft: trait decay failure is non-fatal
  }

  // ─── World State Evolution ──────────────────────────────────────────────────────
  // Dynamics that reshape the map: prosperity, settlement tiers, hex mutations,
  // sphere pressure resolution, quintessence, and sublocation lifecycle.

  // Phase 6.63: Settlement Prosperity (economic pulse for all settlements)
  s = { ...s, ...phaseProsperity(s) };
  phaseEventCounts['prosperity'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.632: Economic Traits (mastery/reputation/scar/condition traits from economic activity)
  s = { ...s, ...phaseEconomicTraits(s) };
  phaseEventCounts['economic_traits'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.64: Reputation Traits (reach-polarity reputation from encounter accumulation + power renown)
  s = { ...s, ...phaseReputationTraits(s) };
  phaseEventCounts['reputation_traits'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.635: Settlement Tier Promotion/Demotion (hamlet↔town↔city based on sustained prosperity)
  const prePromoEventCount = s.tickEvents.length;
  s = { ...s, ...phaseSettlementPromotion(s) };
  phaseEventCounts['settlement_tier_change'] = s.tickEvents.length - prePromoEventCount;
  // TB-086: locationSubtype changes affect encounter scoring via getLocationType() fallback
  if (runtime && s.tickEvents.length > prePromoEventCount) touchStructure(runtime);
  prevEventCount = s.tickEvents.length;

  // Phase 6.636: Settlement Genome Reassessment (re-evaluate genome on tier changes or reach shifts)
  s = { ...s, ...phaseSettlementReassessment(s) };
  phaseEventCounts['settlement_reassessment'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.638 (was 6.636): Hex State (divine influence + corruption decay, terrain transformation)
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

  // Phase 6.6396: Quintessence Tick (pending erosion/recovery events, passive regen, dissolution)
  // phaseQuintessence returns pendingQuintessenceEvents: [] — no need to clear separately.
  s = { ...s, ...phaseQuintessence(s, runtime) };
  phaseEventCounts['quintessence'] = s.tickEvents.length - prevEventCount;
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
  s = { ...s, ...phaseSublocations(s, activeEncounterCache) };
  phaseEventCounts['sublocations'] = s.tickEvents.length - prevEventCount;
  // TB-086: sublocation spawn/dissolve adds/removes nodes and edges
  if (runtime && s.tickEvents.length > prevEventCount) touchStructure(runtime);
  prevEventCount = s.tickEvents.length;

  // Phase 6.66: Economic Chronicle (generate chronicle entries for economic state changes)
  s = { ...s, ...phaseEconomicChronicle(s) };
  phaseEventCounts['economic_chronicle'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // ─── Long-term Progress ─────────────────────────────────────────────────────────
  // Slow-moving systems: ambitions, faction strategy, population dynamics.

  // Phase 6.65: Ambition Progress (milestones, completion, abandonment, re-evaluation)
  s = { ...s, ...phaseAmbitionProgress(s) };
  phaseEventCounts['ambition_progress'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.651: Faction Ambition Evaluation (TB-073 — faction-level ambition creation/update)
  phaseFactionAmbitions(s);

  // Phase 6.75: Agent Lifecycle (death, birth, migration)
  s = { ...s, ...phaseAgentLifecycle(s, nextEventId) };
  phaseEventCounts['agent_lifecycle'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // ─── Narrative ─────────────────────────────────────────────────────────────────
  // Runs after all event-generating phases so that deaths, mandate milestones,
  // economic changes, and ambition completions all get the full chronicle treatment.

  // Phase 5: Narrative (moved here from before economy — now captures ALL tick events)
  s = { ...s, ...phaseNarrative(s) };
  phaseEventCounts['narrative'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;


  // ─── Victory & Defeat ──────────────────────────────────────────────────────────

  // Phase 7: Mandate
  s = { ...s, ...phaseMandate(s) };
  phaseEventCounts['mandate'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 8: Doom Expiry
  s = { ...s, ...phaseDoomExpiry(s) };
  phaseEventCounts['doom_expiry'] = s.tickEvents.length - prevEventCount;

  // TB-086: Bump worldVersion at end of tick — catches all property mutations
  // from agent decision, movement, encounters, familiarity, etc.
  if (runtime) touchWorld(runtime);


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
      timestamp: s.tick,
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
      timestamp: state.tick,
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
