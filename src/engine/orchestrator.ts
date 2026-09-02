// src/engine/orchestrator.ts

/**
 * Game Loop Orchestrator — runs one tick of the simulation.
 *
 * Each tick phase is a pure function: takes GameState pieces in,
 * returns partial updates out. The orchestrator merges updates.
 */
import type { GameState, TickEvent, ActiveComposition } from '../types/gameState';
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
  selectRivalAction,
  computeRivalEscalationTier,
  selectRivalScheme,
  buildRivalScheme,
  schemeFlags,
  worldHasResourceStocks,
} from './rival';
import { getRivalSchemeFamily, type RivalSchemeFamily } from '../data/rival-schemes';
import {
  worldHasContestableSource,
  selectContestableSource,
  contestSource,
  desecrateSource,
  computeRivalDrainYield,
} from './rivalSourceContestation';
import { readEssenceSource } from './essenceSources';
import { phaseNotableAgendas } from './notableAgendas';
import type { RivalSchemeSummary, RivalDefinition, RivalState } from '../types/rival';
import {
  RIVAL_SCHEME_PHASE_INVEST_TICKS,
  RIVAL_SCHEME_STALL_TICKS,
  RIVAL_SCHEME_COUNTERS_TO_FAIL,
  RIVAL_SCHEME_SPHERE_PRESSURE_PER_PHASE,
  RIVAL_SCHEME_CRACK_PRESSURE_MULTIPLIER,
  RIVAL_SCHEME_HOSTILITY_PER_MOVE,
  RIVAL_SCHEME_STOCK_DRAIN_FRACTION,
  RIVAL_SCHEME_STOCK_DRAIN_FLOOR,
  RIVAL_SCHEME_MAX_ROUTES_SEVERED,
  RIVAL_SCHEME_ROUTE_CUT_INTEL_PENALTY,
} from '../data/rival-scheme-config';
import { readResources } from './resourceEconomy';
import { INTEL_RELIABILITY_FLOOR } from './intelligence';
import {
  computeStakes,
  resolveDilemma,
  applyDilemmaEffects,
  logInteraction,
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
import { pickWithRepetitionGuard } from './proseSelection';
import { phaseAgentLifecycle, resetLifecycleCounter } from './agentLifecycle';
import { emitTrace, emitTiming, emitPhaseTiming, getTimingTraces, isProfilingEnabled } from './traceBuffer';
import { runRegisteredPhases, type PhaseContext } from './phaseRegistry';
import { PHASE_PLAN } from './phases';
import { tickEffects } from './effectTick';
import { raiseEffectEvent } from './effects/effectEventDispatch';
import type {
  TraceEntry,
  TickPhaseProfileTrace,
  RivalSchemeLaunchedTrace,
  RivalSchemePhaseAdvancedTrace,
  RivalSchemeCounteredTrace,
  RivalSchemeCompletedTrace,
  RivalSchemeStockDrainedTrace,
  RivalSchemeRouteSeveredTrace,
  RivalSchemeSourceContestedTrace,
  RivalSchemeSourceDesecratedTrace,
} from '../types/trace';
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
import { buildHexActorIndex, getActorsOnHex } from './hexActorIndex';
import type { DivineInfluenceEntry } from '../types/dream';
import { getCurrentStrength } from './decayCurve';
import { checkDissolutions } from './sublocation';
import { installBindingRemovalHook, makeDissolutionHold } from './binding/bindingRegistry';
import { phaseMovement, resetMovementEventCounter } from './phaseMovement';
import { phaseGroups, resetGroupEventCounter } from './groups/phaseGroups';
import { checkAndFireActionTriggers, type ActionTriggerContext } from './effects/actionTrigger';
import { applyActionTriggerPayloads } from './effects/actionTriggerPayloads';
import { collectAttachmentEffects } from './effects/effectWalker';
import { phaseColocationDetection, resetColocationEventCounter } from './phaseColocationDetection';
import { aggregateColocationEvents } from './eventAggregation';
import { phaseInteractionDepth } from './phaseInteractionDepth';
import { emitEncounterRevelations, emitDilemmaRevelations, emitColocationRevelations, resetRevEventCounter } from './revelationEmitter';
import { phaseUnifiedActionProgress } from './unifiedActionResolution';
import { phaseIdleSelection, resetPhaseEventCounter } from './unifiedActionPhases';
import { UNIFIED_ACTION_TEMPLATES } from '../data/unified-action-templates';
import { resetAmbitionEventCounter } from './ambitionTick';
import { recomputeCalling } from './calling';
import { phaseArmyAttrition } from './armyAttrition';
import { phaseArmyMovement } from './armyMovement';
import { phaseBattleDetection, phaseBattleTick } from './battleResolution';
import { phaseLairEscalation, resetAdjacentLairCounter } from './lairEscalation';
import { resetSurveyEventCounter } from './surveyProseComposer';
import { resetQuestHookEventCounter } from './ruins/questHooks';
import { phaseArmyNotifications } from './armyNotifications';
import { phaseProsperity } from './phaseProsperity';
import { checkTierPromotion } from './influence';
import { phaseTradeRouteDecay } from './phaseTradeRouteDecay';
import { phaseSublocations } from './phaseSublocations';
import { phaseSettlementPromotion } from './phaseSettlementPromotion';
import { phaseSettlementReassessment } from './phaseSettlementReassessment';
import { phaseEconomicChronicle } from './phaseEconomicChronicle';
import { phaseHexState } from './phaseHexState';
import { revealLayer, resetDiscoveryEventCounter } from './revelationResolver';
import { phaseUnrest } from './phaseUnrest';
import { phaseMagicalSaturation } from './phaseMagicalSaturation';
import { phaseSpherePressure } from './phaseSpherePressure';
import { phaseSphereAggregation } from './phaseSphereAggregation';
import { phaseQuintessence } from './phaseQuintessence';
import { QUINTESSENCE_ENCOUNTER_FAILURE_EROSION } from '../types/quintessence';
import { phaseEconomicTraits } from './phaseEconomicTraits';
import { decayConditions } from './conditionDecay';
import { expireCompanions } from './companions';
import { getCompanionTemplate } from '../data/companion-templates';
import { processTraitDecay } from './traits';
import { phaseReputationTraits, processReputationTally } from './phaseReputationTraits';
import { processEncounterMastery, processEncounterConditions } from './phaseEncounterTraits';
import { phaseAgentDecision } from './phaseAgentDecision';
import { phaseStrategicProjects } from './phaseStrategicProjects';
import { phaseDivinePremonition } from './phaseDivinePremonition';
import { applyEssenceEarned } from './essenceEarned';
import { phaseControlEffects, resetControlEffectsCounter } from './phaseControlEffects';
import { phaseEssenceSources } from './phaseEssenceSources';
import { phaseEffectShells } from './phaseEffectShells';
// phaseDoom and phaseMandate are extracted to their own files with sphere pressure wiring.
// Imported for internal runTick use; re-exported for backward compatibility (tests import from orchestrator).
import { phaseDoom, resetDoomCounter } from './phaseDoom';
export { phaseDoom } from './phaseDoom';
import { phaseMandate, resetMandateCounter } from './phaseMandate';
export { phaseMandate } from './phaseMandate';
import { resetInfluenceCounter } from './interventionEffects';
import { resetMeetingCounter } from './meetingEncounter';
import { phaseJourneyBeat, getJourneyPhase } from './journeyEngine';
import { JOURNEY_BEAT_TEMPLATES } from '../data/journey-content';
import { CURATION_PHASE_MULTIPLIERS } from './encounter/branchingConstants';
import {
  buildChapterRecord,
  appendChapters,
  emitChapterArchivedTrace,
  isEncounterAction,
} from './chapterArchive';
import type { ChapterRecord } from '../types/chapterRecord';
import { phaseOmenAgenda, resetOmenCounter } from './phaseOmenAgenda';
import { phaseComposition } from './phaseComposition';
import { phaseAscendantBeatDirector } from './ascendantBeat';
import { phaseAscendantProgression } from './phaseAscendantProgression';
import { phaseEncounterVisibility, expireOverdueEncounterNotifications } from './encounterVisibility';
import { phaseAscendantHandFilter } from './orchestrator/phaseAscendantHandFilter';
import { phaseChoiceResolution } from './orchestrator/phaseChoiceResolution';
import { phaseDetectionPressure } from './orchestrator/phaseDetectionPressure';
import { phaseDriftDecay } from './orchestrator/phaseDriftDecay';
import { mulberry32 as libMulberry32 } from '../lib/prng';
import { evaluateEncounterSeeds } from './encounterSeeding';
import { seedApotheosisEncounters } from './aspects';
import { EncounterCacheManager, buildDangerMap } from './encounterCache';
import { resolveLocationToHex } from './encounterAwareness';
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
import { phaseChosenFactionPowers } from './chosenFactionPowers';
import { phaseHiddenMarkDecay } from './phaseHiddenMarkDecay';
import { phaseIntelligenceDecay } from './phaseIntelligenceDecay';
import { generateSecret, createSecretEdge, createFavorEdge } from './secretGeneration';
import { applySecretsFavorsFromResolvedAction } from './secretsFromResolution';
import { processFactionOutcome, resetFactionEventSeq } from './factionOutcome';
import type { DistanceMatrix } from './distanceMatrix';
import { clearTimelines, appendEvent } from './encounterTimeline';
import { recordReward, clearRewardHistory } from './rewardHistory';
import { clearDynamicFactionDefinitions } from '../data/faction-definition-lookup';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { ENCOUNTER_PRESSURE_PER_STEP, RIVAL_PRESSURE_MAGNITUDE, RIVAL_AWARENESS_HOSTILITY_WEIGHT } from '../types/sphereAffinity';
import { ANOMALY_RESOURCE_MAP, RESOURCE_DEFINITIONS } from '../data/resource-content';
import type { ResourceInstance } from '../types/resource';
import { createEncounterEventNode } from './encounterEventNode';
import type { SimulationRuntime } from './simulationRuntime';
import { isBranchingTemplate, isRichTemplate } from './kpi/gameplayKpi';
import { guaranteeFailureStoryArtifact } from './failureStoryArtifact';
import type { UnifiedAction, IntelligenceRecord } from '../types/unifiedAction';
import { accumulateImportance, checkGraduationThreshold, graduateRarity, getImportanceDelta, getRarityTier } from './rarity';
import {
  DIVINE_PROXIMITY_RADIUS_HEXES,
  DIVINE_PROXIMITY_TRACE_CAP,
  RARITY_NOTIFICATION_THRESHOLD,
} from '../data/rarity-constants';
import { RARITY_TIER_NAMES } from '../types/rarity';
import { hexDistance } from '../lib/hexMath';
import {
  touchWorld,
  touchStructure,
  ensureEncounterCache,
  ensureDistanceMatrix,
} from './simulationRuntime';
import { expireOverlays } from './effects/effectOverlayStore';
import { applySuppressions } from './effects/effectSuppression';
import { recordBalanceEvent } from './balanceTelemetry';
import { checkMidEncounterPromotion, isNotableEntry } from './attentionTier';
import type { EncounterPromotionTrace, DigestEntry } from '../types/attention';
import { appendDigestEntry } from './digestBuffer';
import { phaseAttention } from './phaseAttention';
import { phaseSlotCaps, phaseDisposalTimeout } from './phaseSlotCaps';
import { resetUnifiedActionCounter } from './unifiedActionLifecycle';
import { resetActionCounter } from './actionLifecycle';
import { resetEffectCounter } from './controlEffectSpawn';
import { resetOpCounter } from './graphOpExecutor';
import { _resetNpcCounter } from './npcSeeding';
import { resetConditionCounter } from './spellActivation';
import { resetPremonitionCounter } from './premonitionActions';

// ─── Legacy Decision Cache (backward-compat shim for tests) ───────
//
// TB-087: Caches now live in SimulationRuntime (per-session, owned by useSimulation).
// These module-level pointers exist only so tests that call resetDecisionCache()
// and getEncounterCacheManager() keep working. Runtime code uses the runtime object.

let legacyEncounterCache: EncounterCacheManager | null = null;
let legacyDistanceMatrix: DistanceMatrix | null = null;
let legacyRuntime: SimulationRuntime | null = null;

/**
 * Reset the encounter cache, distance matrix, timeline, and all persistent
 * module-level ID counters. Call this before starting a new game (tests and
 * game restarts). NFP #3: ensures same seed produces identical IDs and
 * behavior across independent runs.
 *
 * ─── Why counters here and not in resetEventCounters() ──────────────────
 * resetEventCounters() runs per-tick and only resets ephemeral event ID
 * counters. The counters reset here generate persistent graph-node / action
 * IDs that must NOT reset per-tick (duplicate IDs would corrupt the graph),
 * but MUST reset at game-start so run A and run B with the same seed produce
 * identical ID sequences.
 */
export function resetDecisionCache(): void {
  legacyEncounterCache = null;
  legacyDistanceMatrix = null;
  legacyRuntime = null;
  clearTimelines();
  clearRewardHistory();
  // The run-founded faction overlay is session-scoped state, not a cache: a run
  // that chartered an order must not leave it resolvable in the next run's
  // lookups (THR-1322). Same treatment as the two clears above.
  clearDynamicFactionDefinitions();
  // Persistent graph-node / action ID counters — reset for determinism across runs
  resetLifecycleCounter();
  resetUnifiedActionCounter();
  resetActionCounter();
  resetEffectCounter();
  resetOpCounter();
  resetDiscoveryEventCounter();
  resetConditionCounter();
  resetPremonitionCounter();
  _resetNpcCounter();
  // THR-817: names a persisted graph node, so it belongs here rather than per tick.
  resetAdjacentLairCounter();
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
 * cause duplicate node IDs when re-used across ticks; those are reset at the
 * session boundary by `resetDecisionCache()` instead.
 *
 * **This list is a membership claim, and it has been wrong (THR-817).** The scope
 * rule above says which counters belong here; it does not enforce it, and two that
 * qualified (`surveyEventCounter`, `questHookEventCounter`) sat outside the body for
 * as long as they had existed, each with a reset seam only their own tests called.
 * Nothing goes red when a counter is missing — the ids stay unique, they just stop
 * being *reproducible*, so the cost surfaces as a determinism failure somewhere far
 * from here. When adding a counter that mints a `TickEvent.id`, add it here in the
 * same commit; `bandOpposition` is the cautionary case, where a missing entry was
 * papered over with a per-test reset for weeks before the id was made derivable.
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
  resetOmenCounter();
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
  resetGroupEventCounter();
  // THR-817: both of these mint TickEvent ids from a module-scope counter and had a
  // reset seam with *zero* production callers — only their own tests called it. They
  // fell squarely inside this function's stated scope while sitting outside its body,
  // which is how the docstring above could claim complete coverage and be wrong.
  resetSurveyEventCounter();
  resetQuestHookEventCounter();
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
        // THR-1239: this block used to spell out the whole raise sequence inline
        // — process, apply, instantiate transforms, execute reactives, emit — and
        // it was the ONLY site in the engine that raised any EffectEvent at all.
        // Adding producers for movement and combat meant either pasting it twice
        // more or naming it once; `raiseEffectEvent` is that name, and this site
        // now goes through it too rather than keeping a second copy in step.
        //
        // `states` is passed explicitly because this pass threads
        // `runningEffectStates` across every active encounter and assigns it to
        // GameState once at the end of the tick — writing state.effectStates from
        // inside the loop would be overwritten by that assignment.
        const raised = raiseEffectEvent(
          state,
          progress.actorId,
          { type: 'encounter_outcome', reach: stepForEvent.reach, success: result.success },
          {
            site: 'encounter_outcome',
            rng: encRng,
            states: runningEffectStates,
            // The encounter counterpart, so a one_shot `resource_manipulate` with
            // `target: 'other_agent'` has someone to drain. Undefined on a solo
            // encounter, where that effect skips fail-soft rather than retrying.
            counterpartId: progress.targetAgentId,
          },
        );
        runningEffectStates = raised.states;
      }
    }

    // ── Mid-encounter tier promotion ─────────────────────────────────
    // Only runs when effectiveTier is set (i.e. created after Task 15 wiring).
    // Never demotes — checkMidEncounterPromotion handles the ceiling logic.
    if (progress.effectiveTier && progress.effectiveTier !== 'invisible') {
      const promotionTriggers = {
        // Tier promotion: capability tier crossed during this step
        tierPromotion: !!result.growth?.tierCrossed,
        // Wound: outcome explicitly declares appliesWound (precise; not a proxy)
        wound: result.woundApplied,
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

    // ── Secret discovery (THR-30): secretDiscovery template metadata ──
    if (progress.status === 'completed' && result.success) {
      const completedEncounter = getAnyEncounterById(progress.encounterId);
      if (completedEncounter?.secretDiscovery?.onSuccess && progress.targetAgentId) {
        const targetNode = state.graph.getNode(progress.targetAgentId);
        if (targetNode) {
          try {
            const secretRng = mulberry32(
              state.seed ^ state.tick * 53 ^ hashString(progress.actorId) ^ hashString(progress.targetAgentId)
            );
            const secret = generateSecret(targetNode, state.graph, completedEncounter.secretDiscovery.sourceName, secretRng);
            const created = createSecretEdge(
              progress.actorId,
              progress.targetAgentId,
              secret,
              completedEncounter.secretDiscovery.sourceName,
              state.tick,
              state.graph,
            );
            if (created) {
              emitTrace({
                tick: state.tick,
                category: 'secret_discovered',
                event: 'secret_discovered',
                discovererId: progress.actorId,
                subjectId: progress.targetAgentId,
                secretType: created.secretType,
                magnitude: created.magnitude,
                source: created.source,
                encounterContext: progress.encounterId,
                summary: `${progress.actorId} discovered secret (${created.secretType}) about ${progress.targetAgentId} via ${progress.encounterId}`,
              });
            }
          } catch {
            // fail-soft: secret discovery failure must not block encounter completion
          }
        }
      }
    }

    // ── Favor creation (THR-30): favorGeneration template metadata ──
    if (progress.status === 'completed' && result.success) {
      const completedEncounter = getAnyEncounterById(progress.encounterId);
      if (completedEncounter?.favorGeneration?.onSuccess && progress.targetAgentId) {
        try {
          const [magMin, magMax] = completedEncounter.favorGeneration.magnitudeRange;
          const favorRng = mulberry32(state.seed ^ state.tick * 61 ^ hashString(progress.actorId));
          const magnitude = magMin + favorRng() * (magMax - magMin);
          const created = createFavorEdge(
            progress.targetAgentId,
            progress.actorId,
            magnitude,
            completedEncounter.favorGeneration.context,
            state.tick,
            state.graph,
          );
          if (created) {
            emitTrace({
              tick: state.tick,
              category: 'favor_created',
              event: 'favor_created',
              debtorId: progress.targetAgentId,
              creditorId: progress.actorId,
              magnitude,
              context: completedEncounter.favorGeneration.context,
              encounterContext: progress.encounterId,
              summary: `${progress.targetAgentId} owes a favor to ${progress.actorId} (${completedEncounter.favorGeneration.context}, mag ${magnitude.toFixed(2)})`,
            });
          }
        } catch {
          // fail-soft
        }
      }
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

      // bearerId feeds the companion cap/unique filters (THR-1096); other
      // categories ignore it.
      const pool = assembleRewardPool(state.graph, effectiveRecipe, progress.actorId);
      const agentNameForReward = state.graph.getNode(progress.actorId)?.name ?? '?';

      if (pool.length > 0) {
        const drawRoll = rng();
        const templateId = drawFromPool(pool, drawRoll);

        if (templateId) {
          const instantiation = instantiateReward(state.graph, templateId, progress.actorId, state.tick);

          if (instantiation) {
            rewardInstanceId = instantiation.instanceId;
            rewardName = instantiation.displayName;
            // Companion templates live in the registry, not the graph, so the
            // node lookup misses them — read the registry for name and tier.
            const companionTemplate = getCompanionTemplate(templateId);
            const templateNode = state.graph.getNode(templateId);
            const tier = companionTemplate?.tier ?? (templateNode?.properties?.tier as number) ?? 1;
            const templateDisplayName = companionTemplate?.profession ?? templateNode?.name ?? '?';
            const traceRewardName = instantiation.displayName || templateDisplayName;

            emitTrace({
              category: 'encounter',
              tick: state.tick,
              agentId: progress.actorId,
              agentName: agentNameForReward,
              event: isBadOutcome ? 'reward_bad_outcome' : 'reward_drawn',
              templateId,
              instanceId: instantiation.instanceId,
              templateName: templateDisplayName,
              tier,
              attachmentCategory: instantiation.category,
              poolSize: pool.length,
              roll: drawRoll,
              summary: `${agentNameForReward} ${isBadOutcome ? 'suffered' : 'earned'} ${traceRewardName} (T${tier} ${instantiation.category})`,
            } as unknown as TraceEntry);

            recordReward({
              tick: state.tick,
              agentId: progress.actorId,
              agentName: agentNameForReward,
              encounterId: progress.encounterId,
              templateId,
              templateName: templateDisplayName,
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
        // THR-719: seeded roll for probability guards + name for narrative tokens.
        triggerCtx.nextRoll = mulberry32(
          state.seed + state.tick * 47 + hashString(progress.actorId),
        );
        triggerCtx.actorName = agentNode.name;
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
          for (const trace of triggerResult.traces) {
            emitTrace({ category: 'effect_reaction', tick: state.tick, event: 'action_trigger_fired', ...trace } as unknown as TraceEntry);
          }
          runningEffectStates = triggerResult.updatedStates;
          if (triggerResult.payloadIntents.length > 0) {
            // THR-1257: `states` is threaded explicitly, and the merged map is read
            // back, because this call sits inside the `runningEffectStates` loop whose
            // end-of-tick assignment to `state.effectStates` would otherwise discard
            // anything a `damaged` / `healed` raise wrote from in here. Ordering
            // matters too — `triggerResult.updatedStates` is applied *first* so the
            // raise builds on the trigger's own cooldown writes rather than replacing
            // them.
            const applied = applyActionTriggerPayloads(
              state,
              progress.actorId,
              triggerResult.payloadIntents,
              state.tick,
              { states: runningEffectStates },
            );
            if (applied.effectStates) runningEffectStates = applied.effectStates;
          }
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
      // A reach tier crossing can move the leading reach pair — the calling's
      // third event site (THR-1299 slice 5).
      const callingChange = recomputeCalling(state.graph, progress.actorId, state.tick, 'tier_promotion');
      if (callingChange?.event) events.push(callingChange.event);
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
            const poetProse = graduationTier >= 4
              ? `The weave folds around ${nodeName} like water around a stone that has always been there. What was mortal has become something else entirely.`
              : `The name ${nodeName} is spoken differently now — with something between reverence and quiet dread.`;
            graduationChronicles.push({
              id: `rarity-grad-${actorNodeForRarity.id}-${state.tick}`,
              tier: 'chronicle',
              title: message,
              prose: message,
              poetProse,
              witnessFacts: [message],
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
              const targetPoetProse = targetGradTier >= 4
                ? `The weave folds around ${targetName} like water around a stone that has always been there. What was mortal has become something else entirely.`
                : `The name ${targetName} is spoken differently now — with something between reverence and quiet dread.`;
              graduationChronicles.push({
                id: `rarity-grad-${targetNode.id}-${state.tick}`,
                tier: 'chronicle',
                title: message,
                prose: message,
                poetProse: targetPoetProse,
                witnessFacts: [message],
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
        // THR-664: the event still feeds the event log, but no longer raises a
        // toast — the encounter's conclusion surfaces as an aftermath badge on
        // the agent's thread row.
        ...(isRetinue && { actorId: progress.actorId }),
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
        // THR-664: event-log only; the failure surfaces as an aftermath badge.
        ...(isRetinue && { actorId: progress.actorId }),
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
// THR-1359: `life` mapped to `flesh`, the retired 9th Reach, so this live tick
// phase fed a non-`ReachDomain` into `computeStakes`. Remapped to `heart`, the
// pairing `SPHERE_DOMAIN_AFFINITY` in `scry.ts` already asserts (heart → life).
// Behaviour is unchanged today: `computeStakes` special-cases only gold and iron,
// so `flesh` and `heart` both fall through to the base floor.
const SPHERE_TO_DOMAIN = {
  force: 'iron',
  matter: 'gold',
  energy: 'veil',
  life: 'heart',
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

  // Within-tick deduplication guard for dilemma prose (THR-456)
  const dilemmaProseUsed = new Set<string>();

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
    // THR-1359: coerced. The edge property bag is untyped, so this read is `{}` —
    // an error that only became visible once the `flesh` domain above stopped being
    // the first bad argument to `computeStakes`. Numeric at runtime either way.
    const sentiment = Number(relationshipEdge?.properties?.sentiment ?? 0);
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

    // Generate varied dilemma message using prose templates (with repetition guard — THR-456)
    const stakesLevel = stakes > 0.6 ? 'high' : stakes > 0.3 ? 'medium' : 'low';
    const templateKey = `${dilemma.outcome}.${stakesLevel}`;
    const proseOptions = DILEMMA_STAKES_PROSE[templateKey];
    const picked = proseOptions && proseOptions.length > 0
      ? pickWithRepetitionGuard(proseOptions, rng, dilemmaProseUsed)
      : null;
    const template = picked?.text ?? null;

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

interface DivineProximityCandidate {
  node: import('../types/graph').GraphNode;
  distance: number;
}

interface DivineProximityPhaseResult {
  scanCount: number;
  accumulatedCount: number;
  skippedAscendantCount: number;
}

const DIVINE_PROXIMITY_NODE_TYPES: Array<'actor' | 'location' | 'sublocation'> = [
  'actor',
  'location',
  'sublocation',
];

let _divineProximityRadiusWarnedOnce = false;
let _divineProximityTraceCapWarnedOnce = false;

function getDivineProximityRadius(): number {
  if (Number.isInteger(DIVINE_PROXIMITY_RADIUS_HEXES) && DIVINE_PROXIMITY_RADIUS_HEXES > 0) {
    return DIVINE_PROXIMITY_RADIUS_HEXES;
  }
  if (!_divineProximityRadiusWarnedOnce) {
    _divineProximityRadiusWarnedOnce = true;
    console.warn(
      `[orchestrator] DIVINE_PROXIMITY_RADIUS_HEXES=${String(DIVINE_PROXIMITY_RADIUS_HEXES)} is invalid; falling back to 1.`,
    );
  }
  return 1;
}

function getDivineProximityTraceCap(): number {
  if (Number.isInteger(DIVINE_PROXIMITY_TRACE_CAP) && DIVINE_PROXIMITY_TRACE_CAP > 0) {
    return DIVINE_PROXIMITY_TRACE_CAP;
  }
  if (!_divineProximityTraceCapWarnedOnce) {
    _divineProximityTraceCapWarnedOnce = true;
    console.warn(
      `[orchestrator] DIVINE_PROXIMITY_TRACE_CAP=${String(DIVINE_PROXIMITY_TRACE_CAP)} is invalid; falling back to 1.`,
    );
  }
  return 1;
}

function resolveActorHex(graph: WorldGraph, actorId: string): { col: number; row: number } | null {
  const locatedAtEdges = graph.getOutgoingEdges(actorId, 'located_at');
  if (locatedAtEdges.length === 0) return null;
  return resolveLocationToHex(graph, locatedAtEdges[0].target);
}

function resolveNodeHexForDivineProximity(
  graph: WorldGraph,
  node: import('../types/graph').GraphNode,
): { col: number; row: number } | null {
  if (node.type === 'actor') return resolveActorHex(graph, node.id);
  if (node.type === 'location' || node.type === 'sublocation') return resolveLocationToHex(graph, node.id);
  return null;
}

function collectDivineProximityCandidates(
  graph: WorldGraph,
  centerHex: { col: number; row: number },
  radius: number,
): DivineProximityCandidate[] {
  const seen = new Set<string>();
  const matches: DivineProximityCandidate[] = [];
  for (const nodeType of DIVINE_PROXIMITY_NODE_TYPES) {
    const nodes = graph.getNodesByType(nodeType);
    for (const node of nodes) {
      if (seen.has(node.id)) continue;
      const nodeHex = resolveNodeHexForDivineProximity(graph, node);
      if (!nodeHex) continue;
      const distance = hexDistance(centerHex, nodeHex);
      if (distance > radius) continue;
      seen.add(node.id);
      matches.push({ node, distance });
    }
  }
  matches.sort((a, b) => a.node.id.localeCompare(b.node.id));
  return matches;
}

export function runDivineProximityPhase(state: GameState): DivineProximityPhaseResult {
  const ascendantId = state.ascendantId;
  const ascendantCount = ascendantId ? 1 : 0;
  const radius = getDivineProximityRadius();
  const traceCap = getDivineProximityTraceCap();
  const delta = getImportanceDelta('divine_proximity');

  let scanCount = 0;
  let accumulatedCount = 0;
  let skippedAscendantCount = 0;
  let emittedAccumulationTraces = 0;

  if (!ascendantId) {
    skippedAscendantCount = 1;
  } else {
    const ascendantHex = getAvatarHexPosition(state.graph, ascendantId);
    if (!ascendantHex) {
      skippedAscendantCount = 1;
    } else {
      const candidates = collectDivineProximityCandidates(state.graph, ascendantHex, radius);
      scanCount += candidates.length;

      for (const candidate of candidates) {
        const node = candidate.node;
        if (node.properties.rarityTracked === false) continue;
        try {
          const currentTier = getRarityTier(node);
          const newImportance = accumulateImportance(node, delta);
          accumulatedCount++;
          if (emittedAccumulationTraces < traceCap) {
            emitTrace({
              tick: state.tick,
              category: 'divine_proximity_accumulation',
              summary: `Divine proximity raised importance for ${node.name}`,
              ascendantId,
              nodeId: node.id,
              nodeName: node.name,
              hexDistance: candidate.distance,
              delta,
              newImportance,
              currentTier,
            });
            emittedAccumulationTraces++;
          }
        } catch {
          // fail-soft: continue processing remaining nearby nodes
          continue;
        }
      }
    }
  }

  emitTrace({
    tick: state.tick,
    category: 'divine_proximity_phase',
    summary: `divine_proximity: scanned ${scanCount}, accumulated ${accumulatedCount}`,
    ascendantCount,
    scanCount,
    accumulatedCount,
    skippedAscendantCount,
  });

  return { scanCount, accumulatedCount, skippedAscendantCount };
}

// ─── Phase 2.75: Familiarity Gain (Proximity) ────────────────────────

// Rate-limited warning flag: fires at most once per JS session (once per page load).
let _hexActorIndexWarnedOnce = false;

export function phaseFamiliarityGain(state: GameState): Partial<GameState> {
  const avatarHex = getAvatarHexPosition(state.graph, state.ascendantId);
  if (!avatarHex) return { familiarityMap: state.familiarityMap };

  const index = buildHexActorIndex(state.graph);

  if (index.unresolvedCount > 0 && !_hexActorIndexWarnedOnce) {
    _hexActorIndexWarnedOnce = true;
    emitTrace({
      tick: state.tick,
      category: 'engine_warning',
      source: 'hex_actor_index',
      unresolvedCount: index.unresolvedCount,
      summary: `hex_actor_index: ${index.unresolvedCount} actor(s) could not be resolved to a hex`,
    });
  }

  const nearbyActorIds = getActorsOnHex(index, avatarHex.col, avatarHex.row);

  let map = state.familiarityMap;
  let processedFamiliarityActors = 0;

  for (const actorId of nearbyActorIds) {
    const actor = state.graph.getNode(actorId);
    if (!actor) continue; // fail-soft: actor deleted between index build and read

    processedFamiliarityActors++;
    const familiarityModifier = state.doomIdentityMatrix?.familiarityGainModifier ?? 1.0;
    const proximityGain = FAMILIARITY_GAINS.proximity * familiarityModifier;
    const oldFamiliarity = getFamiliarity(map, actor.id);
    const newMap = addFamiliarity(map, actor.id, proximityGain);
    const newFamiliarity = getFamiliarity(newMap, actor.id);
    const levelChanged = checkThresholdCrossed(oldFamiliarity, newFamiliarity);

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
      amount: proximityGain,
      multiplier: 1.0,
    });

    map = newMap;
  }

  // THR-580: legacy actor-counter profile — routed to the timing ring alongside
  // the duration-based phase profiles (profiling-gated; single home for the category).
  emitTiming({
    tick: state.tick,
    category: 'tick_phase_profile',
    phase: 'familiarity_gain',
    totalActors: index.totalActors,
    processedActors: processedFamiliarityActors,
    skippedActors: index.totalActors - processedFamiliarityActors,
    summary: `familiarity_gain: ${processedFamiliarityActors}/${index.totalActors} actors processed`,
  });

  return { familiarityMap: map };
}

// ─── Phase 3: Rival Actions — multi-phase schemes (THR-66) ────────
//
// A rival, on its action tick, may launch a *scheme*: a four-phase arc
// (rumor → materialization → response → crack) riding the shipped THR-225
// composition phase runner. Between/instead of schemes, rivals make cheap
// *probe* moves (the legacy flat action). Scheme phases advance on world-flags
// the rival invests each tick; the runner activates armed phases; this phase
// executes each phase's concrete move on activation, attributes it, and runs
// the counter-play → stall → fail loop.

/**
 * Emit a rival-scheme trace with per-type field checking. `emitTrace`'s param
 * `Omit<TraceEntry, ...>` collapses a union to its common fields, so extra
 * fields (rivalId, move, …) can't be passed directly; this helper keeps the
 * discriminated-union shape and casts once at the boundary.
 */
type RivalTraceInput =
  | Omit<RivalSchemeLaunchedTrace, 'id' | 'timestamp'>
  | Omit<RivalSchemePhaseAdvancedTrace, 'id' | 'timestamp'>
  | Omit<RivalSchemeCounteredTrace, 'id' | 'timestamp'>
  | Omit<RivalSchemeCompletedTrace, 'id' | 'timestamp'>
  | Omit<RivalSchemeStockDrainedTrace, 'id' | 'timestamp'>
  | Omit<RivalSchemeRouteSeveredTrace, 'id' | 'timestamp'>
  | Omit<RivalSchemeSourceContestedTrace, 'id' | 'timestamp'>
  | Omit<RivalSchemeSourceDesecratedTrace, 'id' | 'timestamp'>;
function emitRivalTrace(trace: RivalTraceInput): void {
  emitTrace(trace as unknown as Omit<TraceEntry, 'id' | 'timestamp'>);
}

/** Read a numeric world-flag, defaulting to 0. */
function readSchemeNum(worldFlags: Record<string, unknown>, key: string): number {
  const v = worldFlags[key];
  return typeof v === 'number' ? v : 0;
}

/** Pick a top-level location to target with a scheme (fail-soft: undefined if none). */
function selectSchemeTarget(
  state: GameState,
  alreadyTargeted: Set<string>,
  rng: () => number,
): { id: string; name: string } | undefined {
  const locations = state.graph.getNodesByType('location').filter((loc) => {
    if (loc.properties.parentLocationId !== undefined) return false; // top-level only
    if (loc.properties.hexCol === undefined || loc.properties.hexRow === undefined) return false;
    return !alreadyTargeted.has(loc.id);
  });
  if (locations.length === 0) return undefined;
  const pick = locations[Math.floor(rng() * locations.length)];
  const name =
    (typeof pick.properties.name === 'string' && pick.properties.name) || pick.id;
  return { id: pick.id, name };
}

/**
 * `drain_stock` move (THR-619) — sour the target's richest resource.
 *
 * Reduces the highest-quantity resource's `quantity` by
 * `RIVAL_SCHEME_STOCK_DRAIN_FRACTION`, floored at `RIVAL_SCHEME_STOCK_DRAIN_FLOOR`
 * so the seam is soured, never exhausted. The shipped stock-tier phase
 * (THR-615) re-derives the tier downward on its next run — this move does not
 * write `stockTier` itself, keeping tier derivation single-owner.
 *
 * Mutates node properties in place (the graph's documented mutation model) and
 * relies on the caller to `touchWorld()`. Returns the drained resource id and
 * the before/after quantities for the trace, or `undefined` when the location
 * carries no stocks (fail-soft no-op).
 */
function drainTargetStock(
  state: GameState,
  targetId: string,
): { resourceId: string; before: number; after: number } | undefined {
  const node = state.graph.getNode(targetId);
  if (!node) return undefined;
  const resources = readResources(node.properties);

  let richestId: string | undefined;
  let richestQty = -1;
  for (const [resourceId, instance] of Object.entries(resources)) {
    const qty = instance?.quantity;
    if (typeof qty !== 'number') continue;
    if (qty > richestQty) {
      richestQty = qty;
      richestId = resourceId;
    }
  }
  if (!richestId || richestQty <= RIVAL_SCHEME_STOCK_DRAIN_FLOOR) return undefined;

  const after = Math.max(
    RIVAL_SCHEME_STOCK_DRAIN_FLOOR,
    richestQty * (1 - RIVAL_SCHEME_STOCK_DRAIN_FRACTION),
  );
  resources[richestId] = { ...resources[richestId], quantity: after };
  return { resourceId: richestId, before: richestQty, after };
}

/**
 * `sever_route` move (THR-619) — cut the target's trade conduits.
 *
 * Removes up to `RIVAL_SCHEME_MAX_ROUTES_SEVERED` `trades_with` edges touching
 * the target location (either direction). Returns the severed partner ids;
 * empty when the location has no routes (fail-soft no-op).
 *
 * The intelligence half of the coupling is applied by the caller, which owns
 * `state.intelligenceRecords` — this helper only touches the graph.
 */
function severTargetRoutes(state: GameState, targetId: string): string[] {
  const edges = [
    ...state.graph.getOutgoingEdges(targetId, 'trades_with'),
    ...state.graph.getIncomingEdges(targetId, 'trades_with'),
  ].slice(0, RIVAL_SCHEME_MAX_ROUTES_SEVERED);

  const severed: string[] = [];
  for (const edge of edges) {
    try {
      state.graph.removeEdge(edge.id);
      severed.push(edge.source === targetId ? edge.target : edge.source);
    } catch {
      /* fail-soft: edge already gone */
    }
  }
  return severed;
}

/**
 * The Flow Web nervous-system coupling (THR-619): a severed route makes a region
 * go dark. Degrades the reliability of every intelligence record about the
 * severed location's region by `RIVAL_SCHEME_ROUTE_CUT_INTEL_PENALTY`.
 *
 * Pure — returns the rewritten record array plus how many were degraded, or
 * `undefined` when nothing matched (so the caller can skip the state write).
 */
function degradeRegionIntelligence(
  state: GameState,
  targetId: string,
  records: readonly IntelligenceRecord[] | undefined,
): { records: IntelligenceRecord[]; degraded: number; region: string } | undefined {
  if (!records || records.length === 0) return undefined;

  const targetNode = state.graph.getNode(targetId);
  const region = targetNode?.properties.region;
  if (typeof region !== 'string' || region.length === 0) return undefined;

  let degraded = 0;
  const next = records.map((r) => {
    if (r.targetRegion !== region) return r;
    const reliability = Math.max(
      INTEL_RELIABILITY_FLOOR,
      r.reliability - RIVAL_SCHEME_ROUTE_CUT_INTEL_PENALTY,
    );
    if (reliability === r.reliability) return r;
    degraded++;
    return { ...r, reliability };
  });

  return degraded > 0 ? { records: next, degraded, region } : undefined;
}

/** True when the player has pushed back on a scheme's target (counter-play surface). */
function detectSchemeCounter(
  state: GameState,
  active: ActiveComposition,
  family?: RivalSchemeFamily,
): { countered: boolean; byActorId?: string } {
  const targetId = active.resolvedNodes.target;
  if (!targetId) return { countered: false };
  const targetNode = state.graph.getNode(targetId);
  if (!targetNode) return { countered: true }; // target destroyed → scheme loses its ground
  const ascendantId = state.ascendantId;
  if (!ascendantId) return { countered: false };

  // THR-621: a source-contesting scheme targets a host the player controls *by
  // definition* — that is the premise of the arc, not a counter. Reading the
  // generic `controls` signal here would fire on tick one and stall the scheme
  // forever, so the counter for these families is the shipped Defend leg
  // instead: the drain is countered exactly when the source no longer names this
  // rival in `contestedBy` after the drain was opened.
  if (family?.requiresPlayerSource) {
    const src = readEssenceSource(targetNode.properties);
    if (!src) return { countered: true }; // source bag gone → nothing left to bleed
    const drainOpened = active.activatedPhaseIds.some(
      (id) => family.beats.find((b) => b.phaseId === id)?.move === 'contest_source',
    );
    if (!drainOpened) return { countered: false }; // pre-drain beats have no counter surface
    const warded = src.contestedBy !== active.sponsorRivalId;
    return warded ? { countered: true, byActorId: ascendantId } : { countered: false };
  }

  // Player directly controls / holds the contested location.
  // THR-1297: 'owns' joins the tuple — a player who OWNS the contested place counters
  // just as surely as one who controls it. Omitting it would have made the new edge a
  // downgrade: taking title to a location would have lost you a counter you had before.
  for (const type of ['controls', 'holds_place_of_power', 'owns'] as const) {
    const inc = state.graph.getIncomingEdges(targetId, type);
    const hit = inc.find((e) => e.source === ascendantId);
    if (hit) return { countered: true, byActorId: ascendantId };
  }
  // Player has a thread to an actor standing at the target — they are present there.
  const occupants = state.graph.getIncomingEdges(targetId, 'located_at');
  for (const occ of occupants) {
    const threads = state.graph.getIncomingEdges(occ.source, 'thread');
    if (threads.some((e) => e.source === ascendantId)) {
      return { countered: true, byActorId: occ.source };
    }
  }
  return { countered: false };
}

/** Cool-failure chronicle beat — a half-thwarted scheme is canonically half-thwarted. */
function makeSchemeCoolFailure(
  rival: RivalDefinition,
  familyLabel: string,
  targetName: string | undefined,
  compositionId: string,
  sphere: SphereName,
  targetLocation: string,
  tick: number,
): ChronicleEntry {
  const where = targetName ?? 'the reach';
  return {
    id: `rival_scheme_failed_${compositionId}_${tick}`,
    tier: 'chronicle',
    title: `${rival.name}'s scheme unravels`,
    prose: `The ${familyLabel.toLowerCase()} ${rival.name} set against ${where} comes apart, half-finished. What it already broke stays broken; the rest never comes.`,
    promptContext: {
      actors: [rival.id],
      location: targetLocation,
      sphere,
      mood: 'grim',
    },
    tick,
  };
}

/** Legacy flat "probe" move — keeps rivals present between schemes. */
function rivalProbeMove(
  state: GameState,
  rival: RivalDefinition,
  rivalState: RivalState,
  rng: () => number,
  events: TickEvent[],
  spherePressures: SpherePressureEvent[],
): void {
  const identityRivalBias = state.doomIdentityMatrix?.rivalBehaviorBias;
  const awarenessValues = Object.values(rivalState.agentAwareness ?? {}).filter(
    (v): v is number => typeof v === 'number',
  );
  const maxAwareness = awarenessValues.length > 0 ? Math.max(...awarenessValues) : 0;
  const effectiveRivalState =
    maxAwareness > 0
      ? {
          ...rivalState,
          hostilityToPlayer: Math.min(
            1.0,
            rivalState.hostilityToPlayer + maxAwareness * RIVAL_AWARENESS_HOSTILITY_WEIGHT,
          ),
        }
      : rivalState;
  const rivalAction = selectRivalAction(rival, effectiveRivalState, rng(), identityRivalBias);
  const templates = RIVAL_ACTION_TEMPLATES[rivalAction.type] ?? ['{rival} acts against you'];
  const template = templates[Math.floor(rng() * templates.length)];
  events.push({
    id: nextEventId(),
    tick: state.tick,
    type: 'rival_action',
    message: template.replace(/{rival}/g, rival.name),
    significance: 0.7,
    notification: { channel: 'toast' },
  });
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

/** Denormalize active + recently-terminal schemes into UI summaries for RivalPanel. */
function buildSchemeSummaries(
  comps: ActiveComposition[],
  rivalId: string,
  worldFlags: Record<string, unknown>,
  escalationTier: number,
  tick: number,
): RivalSchemeSummary[] {
  return comps
    .filter((c) => c.sponsorRivalId === rivalId && c.schemeFamily)
    .map((c) => {
      const family = getRivalSchemeFamily(c.schemeFamily!);
      const phaseIndex = c.activatedPhaseIds.length;
      const lastPhase = c.activatedPhaseIds[c.activatedPhaseIds.length - 1] ?? 'pending';
      const contested =
        readSchemeNum(worldFlags, schemeFlags.stallUntil(c.compositionId)) > tick ||
        readSchemeNum(worldFlags, schemeFlags.counters(c.compositionId)) > 0;
      return {
        compositionId: c.compositionId,
        family: c.schemeFamily!,
        label: family?.label ?? c.schemeFamily!,
        phase: lastPhase,
        phaseIndex,
        totalPhases: family?.beats.length ?? 4,
        escalationTier,
        status: c.status,
        contested,
      };
    });
}

export function phaseRivalActions(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 37);
  const events: TickEvent[] = [];
  const spherePressures: SpherePressureEvent[] = [];
  const coolFailures: ChronicleEntry[] = [];
  const newRivalStates: RivalState[] = [...state.rivalStates];
  const worldFlags: Record<string, unknown> = { ...(state.worldFlags ?? {}) };
  let activeCompositions: ActiveComposition[] = [...(state.activeCompositions ?? [])];
  const escalationTier = computeRivalEscalationTier(state);
  // THR-619: economic family gates on the Mortal Economy stock substrate.
  // Measured once per tick, not per rival — the world does not change mid-phase.
  const hasStocks = worldHasResourceStocks(state);
  // THR-621: profane family gates on the player actually holding a source worth
  // bleeding. Measured once per tick for the same reason as `hasStocks`.
  const hasPlayerSource = worldHasContestableSource(state.graph, state.ascendantId);
  // Rewritten by `sever_route` (the intelligence-degradation coupling);
  // stays undefined when no route cut landed, so the phase returns no intel key.
  let intelligenceRecords: IntelligenceRecord[] | undefined;

  // Locations already under an active scheme — don't stack two on one place.
  const alreadyTargeted = new Set<string>();
  for (const c of activeCompositions) {
    if (c.sponsorRivalId && c.status === 'active' && c.resolvedNodes.target) {
      alreadyTargeted.add(c.resolvedNodes.target);
    }
  }

  for (let i = 0; i < state.rivalDefinitions.length; i++) {
    const rival = state.rivalDefinitions[i];
    let rivalState = newRivalStates[i];

    // ── 1. Maintain this rival's schemes (every tick) ──
    const myComps = activeCompositions.filter(
      (c) => c.sponsorRivalId === rival.id && c.schemeFamily && c.status !== 'failed',
    );
    for (const active of myComps) {
      const family = getRivalSchemeFamily(active.schemeFamily!);
      if (!family) continue; // fail-soft: unknown family
      const compId = active.compositionId;
      const targetId = active.resolvedNodes.target;
      const targetNode = targetId ? state.graph.getNode(targetId) : undefined;
      const targetName = targetNode
        ? ((targetNode.properties.name as string | undefined) ?? targetId)
        : undefined;
      const pressureTarget = targetNode && targetId ? targetId : rival.id;

      // 1a. Execute the concrete move for each activated-but-not-yet-moved phase.
      //     Runs even when the runner has flipped status to 'completed' (so the
      //     crack move still fires) — moveDone flags keep it idempotent.
      for (const phaseId of active.activatedPhaseIds) {
        const doneKey = schemeFlags.moveDone(compId, phaseId);
        if (worldFlags[doneKey] === true) continue;
        const beat = family.beats.find((b) => b.phaseId === phaseId);
        if (!beat) {
          worldFlags[doneKey] = true;
          continue;
        }
        try {
          switch (beat.move) {
            case 'rumor':
              break; // narration only — the runner emits the Chronicle beat
            case 'materialize': {
              if (targetNode && targetId) {
                const edgeId = `edge_sponsors_scheme_${rival.id}_${compId}`;
                const exists = state.graph
                  .getOutgoingEdges(rival.id, 'sponsors_scheme')
                  .some((e) => e.id === edgeId);
                if (!exists) {
                  state.graph.addEdge({
                    id: edgeId,
                    source: rival.id,
                    target: targetId,
                    type: 'sponsors_scheme',
                    properties: {
                      compositionId: compId,
                      family: family.id,
                      establishedTick: state.tick,
                    },
                  });
                }
              }
              if (rival.primarySphere) {
                spherePressures.push({
                  targetEntityId: pressureTarget,
                  sphere: rival.primarySphere,
                  magnitude: RIVAL_SCHEME_SPHERE_PRESSURE_PER_PHASE,
                  source: 'rival',
                  sourceId: rival.id,
                });
              }
              break;
            }
            case 'escalate':
              if (rival.primarySphere) {
                spherePressures.push({
                  targetEntityId: pressureTarget,
                  sphere: rival.primarySphere,
                  magnitude: RIVAL_SCHEME_SPHERE_PRESSURE_PER_PHASE,
                  source: 'rival',
                  sourceId: rival.id,
                });
              }
              break;
            case 'drain_stock': {
              // THR-619: sour the mine. No-op when the target carries no stocks.
              if (targetId) {
                const drained = drainTargetStock(state, targetId);
                if (drained) {
                  emitRivalTrace({
                    category: 'rival.scheme_stock_drained' as const,
                    tick: state.tick,
                    summary: `${rival.name} soured ${drained.resourceId} at ${targetName ?? targetId} (${drained.before.toFixed(1)} → ${drained.after.toFixed(1)})`,
                    rivalId: rival.id,
                    compositionId: compId,
                    targetNodeId: targetId,
                    resourceId: drained.resourceId,
                    quantityBefore: drained.before,
                    quantityAfter: drained.after,
                  });
                }
              }
              break;
            }
            case 'sever_route': {
              // THR-619: cut the conduits, and blind the region as a consequence.
              if (targetId) {
                const severed = severTargetRoutes(state, targetId);
                const blinded = degradeRegionIntelligence(
                  state,
                  targetId,
                  intelligenceRecords ?? state.intelligenceRecords,
                );
                if (blinded) {
                  intelligenceRecords = blinded.records;
                }
                if (severed.length > 0 || blinded) {
                  emitRivalTrace({
                    category: 'rival.scheme_route_severed' as const,
                    tick: state.tick,
                    summary: `${rival.name} severed ${severed.length} route(s) at ${targetName ?? targetId}; ${blinded?.degraded ?? 0} intel record(s) in ${blinded?.region ?? 'no region'} degraded`,
                    rivalId: rival.id,
                    compositionId: compId,
                    targetNodeId: targetId,
                    severedPartnerIds: severed,
                    ...(blinded ? { region: blinded.region } : {}),
                    intelRecordsDegraded: blinded?.degraded ?? 0,
                  });
                }
              }
              break;
            }
            case 'contest_source': {
              // THR-621: open the drain on the player's source at the target.
              if (targetId) {
                const before = readEssenceSource(state.graph.getNode(targetId)?.properties);
                if (contestSource(state.graph, targetId, rival.id)) {
                  // No touchWorld() here — see the phase-level note below: this is
                  // an in-place property mutation, and runTick bumps worldVersion
                  // at end of tick precisely to catch that class (TB-086).
                  const yieldNow = computeRivalDrainYield(state.graph, state.ascendantId, rival.id);
                  emitRivalTrace({
                    category: 'rival.scheme_source_contested' as const,
                    tick: state.tick,
                    summary: `${rival.name} opened a drain on ${targetName ?? targetId} (${before?.tier ?? 'unknown'} → contested)`,
                    rivalId: rival.id,
                    compositionId: compId,
                    targetNodeId: targetId,
                    sourceKind: before?.kind ?? 'unknown',
                    tierBefore: before?.tier ?? 'unknown',
                    drainPerTick: yieldNow.amount,
                  });
                  events.push({
                    id: nextEventId(),
                    tick: state.tick,
                    type: 'rival_action',
                    message: `${rival.name} has opened a drain on ${targetName ?? 'one of your sources'}.`,
                    significance: 0.8,
                    notification: { channel: 'toast' },
                  });
                }
              }
              break;
            }
            case 'desecrate_source': {
              // THR-621: the terminal beat. Lands on nothing if the player warded
              // the source first — which is the Defend leg doing its job.
              if (targetId) {
                const didDesecrate = desecrateSource(state.graph, targetId, rival.id);
                const yieldNow = computeRivalDrainYield(state.graph, state.ascendantId, rival.id);
                emitRivalTrace({
                  category: 'rival.scheme_source_desecrated' as const,
                  tick: state.tick,
                  summary: didDesecrate
                    ? `${rival.name} desecrated ${targetName ?? targetId}; ${yieldNow.amount.toFixed(2)}/tick redirected`
                    : `${rival.name}'s desecration of ${targetName ?? targetId} found the source warded`,
                  rivalId: rival.id,
                  compositionId: compId,
                  targetNodeId: targetId,
                  desecrated: didDesecrate,
                  drainPerTick: yieldNow.amount,
                });
                if (didDesecrate) {
                  events.push({
                    id: nextEventId(),
                    tick: state.tick,
                    type: 'rival_action',
                    message: `${rival.name} has desecrated ${targetName ?? 'one of your sources'}. Its yield is no longer yours.`,
                    significance: 0.9,
                    notification: { channel: 'toast' },
                  });
                }
              }
              break;
            }
            case 'crack': {
              if (rival.primarySphere) {
                spherePressures.push({
                  targetEntityId: pressureTarget,
                  sphere: rival.primarySphere,
                  magnitude:
                    RIVAL_SCHEME_SPHERE_PRESSURE_PER_PHASE * RIVAL_SCHEME_CRACK_PRESSURE_MULTIPLIER,
                  source: 'rival',
                  sourceId: rival.id,
                });
              }
              events.push({
                id: nextEventId(),
                tick: state.tick,
                type: 'rival_action',
                message: `${rival.name}'s ${family.label.toLowerCase()} breaks over ${targetName ?? 'the reach'}.`,
                significance: 0.85,
                notification: { channel: 'toast' },
              });
              break;
            }
          }
        } catch {
          emitTrace({
            category: 'engine_warning' as const,
            tick: state.tick,
            summary: `rival.scheme_move_failed ${compId}/${phaseId}`,
          });
        }
        rivalState = {
          ...rivalState,
          hostilityToPlayer: Math.min(
            1.0,
            rivalState.hostilityToPlayer + RIVAL_SCHEME_HOSTILITY_PER_MOVE,
          ),
        };
        worldFlags[doneKey] = true;
        emitRivalTrace({
          category: 'rival.scheme_phase_advanced' as const,
          tick: state.tick,
          summary: `${rival.name} advances ${family.id}/${phaseId} (${beat.move})`,
          rivalId: rival.id,
          compositionId: compId,
          phaseId,
          move: beat.move,
          targetNodeId: targetId,
        });
      }

      // Completion noting — runner marks status 'completed' when all phases fired.
      if (active.status === 'completed') {
        const notedKey = schemeFlags.completedNoted(compId);
        if (worldFlags[notedKey] !== true) {
          worldFlags[notedKey] = true;
          rivalState = {
            ...rivalState,
            activeSchemeIds: (rivalState.activeSchemeIds ?? []).filter((id) => id !== compId),
          };
          emitRivalTrace({
            category: 'rival.scheme_completed' as const,
            tick: state.tick,
            summary: `${rival.name}'s ${family.id} scheme completed`,
            rivalId: rival.id,
            compositionId: compId,
          });
        }
        continue; // no counter/invest on a finished scheme
      }

      // 1b. Counter-play detection (only while genuinely active).
      const stallUntil = readSchemeNum(worldFlags, schemeFlags.stallUntil(compId));
      if (stallUntil > state.tick) {
        continue; // still in a stall window — no invest
      }
      const counter = detectSchemeCounter(state, active, family);
      if (counter.countered) {
        const counters = readSchemeNum(worldFlags, schemeFlags.counters(compId)) + 1;
        worldFlags[schemeFlags.counters(compId)] = counters;
        if (counters >= RIVAL_SCHEME_COUNTERS_TO_FAIL) {
          activeCompositions = activeCompositions.map((c) =>
            c.compositionId === compId ? { ...c, status: 'failed' as const } : c,
          );
          try {
            state.graph.removeEdge(`edge_sponsors_scheme_${rival.id}_${compId}`);
          } catch {
            /* fail-soft: edge may not exist yet */
          }
          rivalState = {
            ...rivalState,
            activeSchemeIds: (rivalState.activeSchemeIds ?? []).filter((id) => id !== compId),
          };
          coolFailures.push(
            makeSchemeCoolFailure(
              rival,
              family.label,
              targetName,
              compId,
              rival.primarySphere ?? 'entropy',
              targetId ?? 'world',
              state.tick,
            ),
          );
          emitRivalTrace({
            category: 'rival.scheme_countered' as const,
            tick: state.tick,
            summary: `${rival.name}'s ${family.id} scheme failed`,
            rivalId: rival.id,
            compositionId: compId,
            outcome: 'failed' as const,
            byActorId: counter.byActorId,
          });
        } else {
          const nextBeat = family.beats.find((b) => !active.activatedPhaseIds.includes(b.phaseId));
          if (nextBeat) worldFlags[schemeFlags.ready(compId, nextBeat.phaseId)] = false;
          worldFlags[schemeFlags.invest(compId)] = 0;
          worldFlags[schemeFlags.stallUntil(compId)] = state.tick + RIVAL_SCHEME_STALL_TICKS;
          emitRivalTrace({
            category: 'rival.scheme_countered' as const,
            tick: state.tick,
            summary: `${rival.name}'s ${family.id} scheme stalled`,
            rivalId: rival.id,
            compositionId: compId,
            outcome: 'stalled' as const,
            byActorId: counter.byActorId,
          });
        }
        continue; // no invest on a countered scheme this tick
      }

      // 1c. Investment → arm the next phase once the previous one has fired.
      const readyCount = family.beats.filter(
        (b) => worldFlags[schemeFlags.ready(compId, b.phaseId)] === true,
      ).length;
      if (readyCount < family.beats.length) {
        const invest = readSchemeNum(worldFlags, schemeFlags.invest(compId)) + 1;
        const threshold =
          RIVAL_SCHEME_PHASE_INVEST_TICKS[
            Math.min(escalationTier, RIVAL_SCHEME_PHASE_INVEST_TICKS.length - 1)
          ] ?? 14;
        const nextBeat = family.beats[readyCount];
        const prevBeat = family.beats[readyCount - 1];
        const prevFired = prevBeat
          ? active.activatedPhaseIds.includes(prevBeat.phaseId) &&
            worldFlags[schemeFlags.moveDone(compId, prevBeat.phaseId)] === true
          : true;
        if (invest >= threshold && nextBeat && prevFired) {
          worldFlags[schemeFlags.ready(compId, nextBeat.phaseId)] = true;
          worldFlags[schemeFlags.invest(compId)] = 0;
        } else {
          worldFlags[schemeFlags.invest(compId)] = invest;
        }
      }
    }

    // ── 2. Action decision every ~10 ticks: launch a scheme or probe ──
    const ticksSince = (rivalState.ticksSinceAction ?? 0) + 1;
    rivalState = { ...rivalState, ticksSinceAction: ticksSince };
    if (ticksSince >= 8 + Math.floor(rng() * 5)) {
      rivalState = { ...rivalState, ticksSinceAction: 0 };
      const decision = selectRivalScheme(
        rival,
        rivalState,
        escalationTier,
        state.tick,
        rng,
        hasStocks,
        hasPlayerSource,
      );
      let launched = false;
      if (decision.family) {
        const family = decision.family;
        // THR-621: a source-contesting arc must target a host that actually
        // carries one of the player's sources — a random location would leave
        // every beat a no-op. Keystone-weighted, so rivals go for the richest.
        // Exactly one selector runs, so exactly one draw leaves the rng stream.
        let target: { id: string; name: string } | undefined;
        if (family.requiresPlayerSource) {
          const pick = state.ascendantId
            ? selectContestableSource(state.graph, state.ascendantId, alreadyTargeted, rng)
            : undefined;
          target = pick ? { id: pick.hostId, name: pick.name } : undefined;
        } else if (family.requiresTarget) {
          target = selectSchemeTarget(state, alreadyTargeted, rng);
        }
        if (!family.requiresTarget || target) {
          const plan = buildRivalScheme(
            rival,
            rivalState,
            family,
            escalationTier,
            state.tick,
            target?.id,
            target?.name,
            rng,
          );
          activeCompositions = [...activeCompositions, plan.composition];
          Object.assign(worldFlags, plan.worldFlagUpdates);
          rivalState = { ...plan.updatedRivalState, interventionCount: rivalState.interventionCount + 1 };
          if (target) alreadyTargeted.add(target.id);
          const launchMsg = `${rival.name} sets a ${family.label.toLowerCase()} in motion${target ? ` against ${target.name}` : ''}.`;
          events.push({
            id: nextEventId(),
            tick: state.tick,
            type: 'rival_action',
            message: launchMsg,
            significance: 0.75,
            notification: { channel: 'toast' },
          });
          emitRivalTrace({
            category: 'rival.scheme_launched' as const,
            tick: state.tick,
            summary: launchMsg,
            rivalId: rival.id,
            compositionId: plan.composition.compositionId,
            family: family.id,
            escalationTier,
            targetNodeId: target?.id,
          });
          launched = true;
        }
      }
      if (!launched) {
        // Probe fallback (probe roll, no eligible family, at capacity, or no target).
        rivalState = { ...rivalState, interventionCount: rivalState.interventionCount + 1 };
        rivalProbeMove(state, rival, rivalState, rng, events, spherePressures);
      }
    }

    // ── 3. Accrue the source drain (THR-621) ──
    // Rivals hold no essence pool of their own (they are not graph nodes), so the
    // income redirected off the player's contested/desecrated sources accrues on
    // the rival state. Every unit the player stops receiving is credited here, so
    // the redirect is an inspectable number rather than a claim in prose (NFP #2).
    // O(controlled sources) per rival, and sources are few.
    const drain = computeRivalDrainYield(state.graph, state.ascendantId, rival.id);
    if (drain.amount > 0 || (rivalState.drainedSourceIds?.length ?? 0) > 0) {
      rivalState = {
        ...rivalState,
        drainedEssence: (rivalState.drainedEssence ?? 0) + drain.amount,
        drainedSourceIds: [...drain.contestedHostIds, ...drain.desecratedHostIds],
      };
    }

    // ── 4. Rebuild UI scheme summaries + persist ──
    rivalState = {
      ...rivalState,
      schemes: buildSchemeSummaries(activeCompositions, rival.id, worldFlags, escalationTier, state.tick),
    };
    newRivalStates[i] = rivalState;
  }

  // THR-619 / THR-621 note: the economic and profane moves mutate node properties
  // / edges in place, which does not change graph object identity. No
  // `touchWorld()` is needed here — `runTick` bumps `worldVersion` at end of tick
  // (TB-086) precisely to catch this class of property mutation. (It also could
  // not be called: `touchWorld` takes the SimulationRuntime, which a phase
  // function does not receive.)

  return {
    rivalStates: newRivalStates,
    activeCompositions,
    worldFlags,
    tickEvents: [...state.tickEvents, ...events],
    ...(intelligenceRecords ? { intelligenceRecords } : {}),
    ...(coolFailures.length > 0
      ? { chronicleEntries: [...(state.chronicleEntries ?? []), ...coolFailures] }
      : {}),
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
    // Omen start/expire events use a lower chronicle threshold (THR-19)
    const omenEvent = event.type === 'omen_started' || event.type === 'omen_expired';
    const chronicleThreshold = omenEvent ? 0.65 : 0.8;
    if (event.significance >= chronicleThreshold) {
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
        witnessFacts: [event.message],
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
    omen_started: 'action_resolved',
    omen_expired: 'action_resolved',
    omen_beat: 'action_resolved',
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

/**
 * THR-580: cached per-tick profiling flag. Set once at the top of `runTick` from
 * `isProfilingEnabled()` so the ~65 inline-phase calls per tick don't each pay a
 * module round-trip. When false, `runInlinePhase` adds only one boolean check.
 */
let tickProfilingEnabled = false;

/**
 * THR-580: wrap an inline phase so it gets the same `tick_phase_profile` timing the
 * registered phases already emit — without restructuring `runTick`. Mirrors the legacy
 * `{ ...s, ...phaseX(s) }` merge and returns the event delta so callers keep populating
 * `phaseEventCounts` unchanged (additive — NFP #6). Timing is measured around the thunk
 * only; it never feeds a seed/branch/state (determinism — NFP #3). Crash semantics are
 * unchanged: inline phases are not try/caught today, and this helper does not add one.
 */
function runInlinePhase(
  phaseId: string,
  s: GameState,
  run: () => Partial<GameState>,
): { next: GameState; eventDelta: number } {
  const start = tickProfilingEnabled ? performance.now() : 0;
  const prevEvents = s.tickEvents.length;
  const delta = run();
  // THR-1180 — the essence-earned accrual seam. Every grant site in the divine
  // economy lands in some phase's returned pool, so diffing here counts them
  // all, including the site nobody has written yet. Reference-compares out on
  // every phase that leaves the pool alone, which is nearly all of them.
  const next = applyEssenceEarned(s, { ...s, ...delta } as GameState);
  const eventDelta = next.tickEvents.length - prevEvents;
  if (tickProfilingEnabled) {
    const durationMs = performance.now() - start;
    emitPhaseTiming({
      tick: next.tick,
      phase: phaseId,
      summary: `${phaseId}: ${eventDelta} events in ${durationMs.toFixed(2)}ms`,
      durationMs,
      eventDelta,
    });
  }
  return { next, eventDelta };
}

/**
 * THR-582: companion to `runInlinePhase` for the inline phases that do NOT follow the
 * `s = { ...s, ...phaseX(s) }` merge shape — the in-place mutators (`phaseSlotCaps`,
 * `emitColocationRevelations`, the TB-073 army/battle cluster) and the phases that
 * return a bespoke result object the caller destructures itself (`phaseEncounterVisibility`,
 * `phaseDetectionPressure`, `phaseChoiceResolution`). Those cannot be expressed as a
 * `Partial<GameState>` thunk, so before this helper they were the phases `tick_profile`
 * could not see at all.
 *
 * Times the thunk and passes its return value straight through, so the call site keeps
 * its own state handling and its own `phaseEventCounts` expression **unchanged** — this
 * helper never touches `s` and never changes accounting (additive — NFP #6). `eventDelta`
 * in the emitted trace is measured off the same `s.tickEvents` reference, so it is exact
 * for in-place mutators and 0 for phases that merge their events after the thunk returns.
 * Timing never feeds a seed or a branch (determinism — NFP #3), and no try/catch is added
 * (crash semantics unchanged, matching `runInlinePhase`).
 */
function timeInlinePhase<T>(phaseId: string, s: GameState, run: () => T): T {
  if (!tickProfilingEnabled) return run();
  const start = performance.now();
  const prevEvents = s.tickEvents.length;
  const result = run();
  const durationMs = performance.now() - start;
  const eventDelta = s.tickEvents.length - prevEvents;
  emitPhaseTiming({
    tick: s.tick,
    phase: phaseId,
    summary: `${phaseId}: ${eventDelta} events in ${durationMs.toFixed(2)}ms`,
    durationMs,
    eventDelta,
  });
  return result;
}

export function runTick(state: GameState, scryTargets: import('../types').HexCoord[] = [], runtime?: SimulationRuntime): GameState {
  try {
  // Start with clean tick events
  let s: GameState = { ...state, tick: state.tick + 1, tickEvents: [], prosperityShocks: [] };

  // Capture tick for ID generation before any phase runs
  currentTickForIds = s.tick;

  // ── The binder's severance hook (THR-1296 §4) ──
  // `WorldGraph.removeNode` is the sole funnel all ~25 deleting call sites pass
  // through, so one hook covers every reaper — including the two that bypass the
  // lifecycle entirely (battle commander kill, battle sublocation destruction) and
  // any reaper not yet written. Re-registered each tick rather than once per session
  // because the closure must read *this* tick's state: `s` is a `let`, and a closure
  // over it reads the current binding, so the hook never observes a frozen world.
  //
  // Cost is one assignment per tick plus one Map lookup per node removal, and
  // removals are rare events rather than per-tick work.
  if (runtime) {
    installBindingRemovalHook(s.graph, runtime.bindingIndex, () => s.strategicState, () => s.tick);
  }

  // Reset per-tick event counters for deterministic ID generation (NFP #3).
  // Must happen before any phase runs so all IDs use fresh sequences for this tick.
  resetEventCounters();

  // THR-580: cache the profiling flag once per tick (avoid a module round-trip in the
  // hot inline-phase loop) and bracket the whole tick body for the `tick_profile`
  // rollup. Snapshot cache-rebuild counters BEFORE the ensure* calls below so the
  // rollup can report whether a rebuild fired this tick. All gated on profiling —
  // zero cost when off (NFP #7).
  tickProfilingEnabled = isProfilingEnabled();
  const tickStart = tickProfilingEnabled ? performance.now() : 0;
  const ecRebuildsBefore = runtime?.encounterCacheRebuildCount ?? 0;
  const dmRebuildsBefore = runtime?.distanceMatrixRebuildCount ?? 0;

  // TB-087: Use runtime-owned caches when available, fall back to legacy module globals for tests
  let activeEncounterCache: EncounterCacheManager;
  let activeDistanceMatrix: DistanceMatrix;
  if (runtime) {
    activeEncounterCache = ensureEncounterCache(runtime, s.graph, s.tick, s.tiles);
    activeDistanceMatrix = ensureDistanceMatrix(runtime, s.graph, s.tick);
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

  // THR-603: recompute the doom-phase curation-generosity multiplier once per tick,
  // before agent decisions score encounters. A gentle world-pressure lean — encounter
  // density stays player-authored; this only nudges branching-quest surfacing as doom climbs.
  if (runtime) {
    const phase = getJourneyPhase(s.doomClock.progress);
    runtime.curationPhaseMultiplier = CURATION_PHASE_MULTIPLIERS[phase];
  }

  // Track events per phase for trace
  const phaseEventCounts: Record<string, number> = {};
  let agentsProcessed = 0;


  // Track initial event count
  let prevEventCount = s.tickEvents.length;

  // Shared context passed to declaratively-registered phases (THR-238).
  const phaseCtx: PhaseContext = { runtime };

  // Slot anchor: pre-doom — registered phases include `doom` (THR-238 Land 3,
  // moved here from inline; was at the same byte position as this anchor so the
  // migration is byte-equivalent).
  s = runRegisteredPhases(s, phaseCtx, 'pre-doom', PHASE_PLAN);
  prevEventCount = s.tickEvents.length;

  // Phase 1.5: Journey Beat — check if doom clock crossed a beat threshold for The First
  {
    const r = runInlinePhase('journey_beat', s, () => phaseJourneyBeat(s, JOURNEY_BEAT_TEMPLATES));
    s = r.next;
    phaseEventCounts['journey_beat'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 1.7: Omen Agenda — select/rotate atmospheric pressure tracks, emit beats (THR-19)
  {
    const r = runInlinePhase('omen_agenda', s, () => phaseOmenAgenda(s));
    s = r.next;
    phaseEventCounts['omen_agenda'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Slot anchor: post-doom — fires between phaseOmenAgenda and phaseComposition.
  // Placement preserves byte-equivalent ordering for phaseEmittedOmenDecay (THR-238 Land 2).
  // Future post-doom phases run AFTER phaseDoom/Journey/Omen and BEFORE phaseComposition.
  s = runRegisteredPhases(s, phaseCtx, 'post-doom', PHASE_PLAN);
  prevEventCount = s.tickEvents.length;

  // Phase 1.7: Ascendant Progression — god-side tier-crossing detection (THR-613).
  // Runs immediately before the Beat Director: on an upward Domain Capability crossing
  // it sets `ascendantBeats.pending` to a Deepening beat, so the Director (which skips
  // when `pending` is set) yields the turn to it — Deepening beats take priority over
  // the cadence draw without any change to the Director itself.
  {
    const r = runInlinePhase('ascendant_progression', s, () => phaseAscendantProgression(s));
    s = r.next;
    phaseEventCounts['ascendant_progression'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 1.75: Ascendant Beat Director — decide which beat (if any) to OFFER this
  // turn (spine-first, then cadence-gated pool). Runs after the world settles and
  // before encounter resolution; only offers, never resolves. (THR-500)
  const beatRng = mulberry32(state.seed + state.tick * 59 + 503);
  {
    const r = runInlinePhase('ascendant_beat_director', s, () => phaseAscendantBeatDirector(s, beatRng));
    s = r.next;
    phaseEventCounts['ascendant_beat_director'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 1.8: Composition phase runner — advance phased event recipes tied to doom clock (THR-225)
  {
    const r = runInlinePhase('composition', s, () => phaseComposition(s));
    s = r.next;
    phaseEventCounts['composition'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // ─── Unified Action Pipeline (replaces old phaseAgentActions + phaseEncounterProgression + phaseActionProgress) ───
  // Phase 2a: Progress + resolve existing unified actions (Phases 1-6 of unified pipeline)
  const uaRng = mulberry32(state.seed + state.tick * 31);
  {
    const r = runInlinePhase('unified_action_progress', s, () =>
      phaseUnifiedActionProgress(s, UNIFIED_ACTION_TEMPLATES, uaRng, runtime));
    s = r.next;
    phaseEventCounts['unified_action_progress'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 2a.1: Thread-bind familiarity grant — when a bind_thread_* action resolves
  // successfully, grant the matching worship familiarity so knowledge level updates
  // immediately (mirrors the initial familiarity set in gameInit for existing threads).
  timeInlinePhase('thread_bind_familiarity', s, () => {
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
  });

  // Phase 2a.4: Effect Tick — per-agent effect bookkeeping (duration, cooldown, decay, stacking,
  //             axiological_drift, hex_effect, resource_manipulate)
  {
    // THR-582: the legacy actor-counter emitters (`effect_tick`, `mastery_decay`) already
    // land in the `tick_phase_profile` ring but carried no `durationMs`, so the `tick_profile`
    // rollup read them as 0ms and they could never surface as `slowestPhase`. Time them too.
    const effectStart = tickProfilingEnabled ? performance.now() : 0;
    const effectStates = s.effectStates ?? new Map();
    const agents = s.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual' || n.properties.actorType === 'ascendant');
    let updatedEffectStates = new Map(effectStates);

    // THR-1242: resolve `suppress` before anything ticks, so an attachment
    // silenced this tick does not also get to act this tick. This is the only
    // writer of `EffectRuntimeState.suppressed`, a flag four readers have
    // honoured since the primitive architecture landed and nothing ever set —
    // so four shipped artifacts promised to silence magic and silenced nothing.
    // Runs over the same `agents` list the tick loop uses rather than re-walking
    // `getNodesByType('actor')`.
    {
      const suppression = applySuppressions(
        s.graph, updatedEffectStates, s.tick, agents.map(a => a.id),
      );
      updatedEffectStates = suppression.states;
    }

    const effectHexMutations: import('../types/hexMutation').HexMutation[] = [];
    let processedEffectActors = 0;
    for (const agent of agents) {
      // THR-186: skip agents with no effect-bearing edges — avoids O(N_all) work for ambient NPCs
      if (
        s.graph.getOutgoingEdges(agent.id, 'possesses').length === 0 &&
        s.graph.getOutgoingEdges(agent.id, 'bonded_to').length === 0 &&
        s.graph.getOutgoingEdges(agent.id, 'has_trait').length === 0
      ) continue;
      processedEffectActors++;
      const result = tickEffects(s.graph, agent.id, s.tick, updatedEffectStates, {
        // THR-1241: gives `cooldown_multiplier` its owning-site read.
        graph: s.graph, effectStates: updatedEffectStates, persisted: s, tick: s.tick,
      });
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
    emitTiming({
      tick: s.tick,
      category: 'tick_phase_profile',
      phase: 'effect_tick',
      totalActors: agents.length,
      processedActors: processedEffectActors,
      skippedActors: agents.length - processedEffectActors,
      durationMs: tickProfilingEnabled ? performance.now() - effectStart : undefined,
      summary: `effect_tick: ${processedEffectActors}/${agents.length} actors processed`,
    });
    // THR-1240: expire persisted terrain overlays and rule overrides, then bump
    // the version counters if anything changed this tick — either here, or at a
    // producing site earlier in the tick that had no runtime in scope and left
    // the `overlayStateDirty` flag instead.
    //
    // Expiry runs even when no actor bore an effect this tick: the collections
    // are keyed by hex and agent, not walked per bearer, so an overlay outlives
    // the agent that cast it and must still lift on schedule.
    const overlayDelta = expireOverlays(s, s.tick);
    const overlayDirty = overlayDelta.changed || s.overlayStateDirty === true;
    const overlayStructural = overlayDelta.structural || s.overlayStateStructural === true;
    if (overlayDirty && runtime) {
      // `runTick` already bumps `worldVersion` at end of tick (TB-086), so this
      // call is belt-and-braces rather than load-bearing. Kept deliberately: it
      // makes the overlay collections' visibility a property of this phase
      // instead of an inherited invariant from another file.
      touchWorld(runtime);
      // This one IS load-bearing — nothing else invalidates the distance matrix,
      // and terrain overlays change the hex character it is built from.
      if (overlayStructural) touchStructure(runtime);
    }

    const existingHexMutations = s.pendingHexMutations ?? [];
    s = { ...s, effectStates: updatedEffectStates,
      pendingHexMutations: [...existingHexMutations, ...effectHexMutations],
      // Cleared unconditionally: the flag's whole job is to survive from a
      // runtime-less producing site to this phase, and it has now been read.
      overlayStateDirty: false,
      overlayStateStructural: false };
  }

  // Phase 2a.5: Encounter Progression — advance active encounters whose current step has elapsed
  {
    const r = runInlinePhase('encounter_progression', s, () => phaseEncounterProgressionV2(s, runtime));
    s = r.next;
    phaseEventCounts['encounter_progression'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 2a.52: Effect Shells — process non-step-outcome flip_table triggers (THR-53)
  // step_outcome triggers are handled inline in executeStepResult; this phase handles the rest.
  {
    const r = runInlinePhase('effect_shells', s, () => phaseEffectShells(s));
    s = r.next;
    phaseEventCounts['effect_shells'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 2a.55: Strategic Projects — advance multi-tick projects and tick control degradation
  {
    const stratProjRng = mulberry32(state.seed + state.tick * 59);
    {
      const r = runInlinePhase('strategic_projects', s, () => phaseStrategicProjects(s, stratProjRng, runtime));
      s = r.next;
      phaseEventCounts['strategic_projects'] = r.eventDelta;
    }
    prevEventCount = s.tickEvents.length;
  }

  // Phase 2a.7: Encounter Revelations (knowledge facets from encounter observations)
  timeInlinePhase('encounter_revelations', s, () => emitEncounterRevelations(s));
  phaseEventCounts['encounter_revelations'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2a.6: Encounter Visibility — generate notifications for threaded agents in encounters
  const encVisResult = timeInlinePhase('encounter_visibility', s, () => phaseEncounterVisibility(s));
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

  // Phase 2a.605: Detection Pressure — regional escalation from committed choices + passive decay
  {
    const detectionResult = timeInlinePhase('detection_pressure', s, () => phaseDetectionPressure(s));
    s = {
      ...s,
      regionalDetectionPressure: detectionResult.regionalDetectionPressure,
      regionDetection: detectionResult.regionDetection,
      pendingEncounterSeeds: detectionResult.pendingEncounterSeeds,
    };
    phaseEventCounts['detection_pressure'] = detectionResult.updatedRegions;
  }

  // Phase 2a.61: Choice Resolution — process pending player choice commits (THR-323)
  {
    const choiceRng = libMulberry32(state.seed + state.tick * 89);
    const choiceResult = timeInlinePhase('choice_resolution', s, () => phaseChoiceResolution(s, choiceRng));
    s = {
      ...s,
      archetypeDrift: choiceResult.archetypeDrift,
      pendingChoiceCommits: choiceResult.pendingChoiceCommits,
    };
    phaseEventCounts['choice_resolution'] = choiceResult.resolvedCount;
  }

  // Phase 2a.62: Ascendant Hand Filter — encounter-scoped hand partitioning
  const handFilterStats = timeInlinePhase('ascendant_hand_filter', s, () => phaseAscendantHandFilter(s));
  phaseEventCounts['ascendant_hand_filter'] = handFilterStats.filteredCount;

  // Phase 2a.65: Attention Pool — regen pool, expire tugs, generate new tugs for shaping encounters
  {
    const attentionRng = mulberry32(state.seed + state.tick * 71);
    const r = runInlinePhase('attention', s, () => phaseAttention(s, UNIFIED_ACTION_TEMPLATES, attentionRng));
    s = r.next;
    phaseEventCounts['attention'] = r.eventDelta;
  }

  // Phase 2a.78: Apotheosis Eligibility — seed the capstone onto tier-4 mortals
  // that have held the top rung long enough (THR-479). Runs before seed
  // evaluation so a freshly-seeded apotheosis is picked up the same tick.
  {
    {
      const r = runInlinePhase('apotheosis_seeding', s, () => seedApotheosisEncounters(s, s.tick, runtime));
      s = r.next;
      phaseEventCounts['apotheosis_seeding'] = r.eventDelta;
    }
    prevEventCount = s.tickEvents.length;
  }

  // Phase 2a.8: Evaluate encounter seeds planted by aftermath reactions
  {
    const seedRng = mulberry32(state.seed + state.tick * 53);
    // `evaluateEncounterSeeds` returns a whole GameState rather than a Partial; spreading it
    // over `s` inside runInlinePhase yields the identical object it used to be assigned to.
    const r = runInlinePhase('encounter_seeding', s, () => evaluateEncounterSeeds(s, s.tick, seedRng, runtime));
    s = r.next;
    phaseEventCounts['encounter_seeding'] = r.eventDelta;
    prevEventCount = s.tickEvents.length;
  }

  // Phase 2a.85: Slot Cap Enforcement — deactivate overflow possessions, handle condition overflow
  timeInlinePhase('slot_caps', s, () => { phaseSlotCaps(s); phaseDisposalTimeout(s); });
  phaseEventCounts['slot_caps'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2a.9: Divine Premonition (Whisper) — subconscious nudges for idle threaded agents
  {
    const whisperRng = mulberry32(state.seed + state.tick * 67);
    {
      const r = runInlinePhase('divine_premonition', s, () => phaseDivinePremonition(s, whisperRng));
      s = r.next;
      phaseEventCounts['divine_premonition'] = r.eventDelta;
    }
    prevEventCount = s.tickEvents.length;
  }

  // Slot anchor: post-resolution — after the Phase 2a unified-action cluster.
  s = runRegisteredPhases(s, phaseCtx, 'post-resolution', PHASE_PLAN);
  prevEventCount = s.tickEvents.length;

  // Phase 2b: Agent Decision — unified encounter-driven decision pipeline (replaces phaseIdleSelection)
  // @deprecated — phaseIdleSelection replaced by phaseAgentDecision
  const decisionRng = mulberry32(state.seed + state.tick * 37);
  const decisionResult = runInlinePhase('agent_decision', s, () =>
    phaseAgentDecision(s, activeEncounterCache, activeDistanceMatrix, decisionRng, runtime));
  s = decisionResult.next;
  const decisionEvents = decisionResult.eventDelta;
  phaseEventCounts['agent_decision'] = decisionEvents;
  agentsProcessed += decisionEvents;
  prevEventCount = s.tickEvents.length;

  // Phases 2.32 (Initiative Progress) and 2.33 (Mentorship Lifecycle) were deleted with
  // the initiative retirement (THR-1292 §3). Both folded into the undertaking checkpoint
  // pass at 2a.55: `phaseStrategicProjects` now expires the festival boost 2.32 owned and
  // drives the mentorship arc 2.33 owned. Removing 2.33 also removes the fragile
  // 2.32→2.33 same-tick ordering contract the mentorship bond drift depended on.
  //
  // `prevEventCount` is re-stitched here rather than left dangling: the following phase
  // measures its own event delta from this line.
  prevEventCount = s.tickEvents.length;

  // Phase 2.34: Companies (THR-74) — dissolution/leave, cohesion, shared movement,
  // formation. Must sit between agent decision and movement execution: it overwrites
  // members' movementState so a company's shared heading supersedes the personal
  // destinations picked above, and phaseMovement below then executes those queues.
  {
    const r = runInlinePhase('groups', s, () => phaseGroups(s, runtime));
    s = r.next;
    phaseEventCounts['groups'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 2.35: Agent Movement (goal-directed pathfinding)
  {
    const r = runInlinePhase('agent_movement', s, () => phaseMovement(s));
    s = r.next;
    phaseEventCounts['agent_movement'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 2.352: Army Movement (TB-073 — armies advance toward objectives)
  timeInlinePhase('army_movement', s, () => phaseArmyMovement(s));

  // Phase 2.355: Army Attrition (TB-073 — cohesion degradation during march)
  timeInlinePhase('army_attrition', s, () => phaseArmyAttrition(s));

  // Phase 2.356: Battle Detection (TB-073 — hostile army colocation → battle node)
  timeInlinePhase('battle_detection', s, () => phaseBattleDetection(s));

  // Phase 2.357: Battle Tick (TB-073 — process active battles: attrition, momentum, resolution)
  timeInlinePhase('battle_tick', s, () => phaseBattleTick(s));

  // Phase 2.3575: Lair Escalation (M2.5 — tier upgrades, sphere feedback, spawn)
  timeInlinePhase('lair_escalation', s, () => phaseLairEscalation(s, runtime));

  // Phase 2.358: Army Notifications (TB-073 — convert army/battle traces to TickEvents)
  {
    const r = runInlinePhase('army_notifications', s, () => phaseArmyNotifications(s, nextEventId));
    s = r.next;
    phaseEventCounts['army_notifications'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 2.36: Colocation Detection (after movement, before sublocation dissolution)
  {
    const r = runInlinePhase('colocation_detection', s, () => phaseColocationDetection(s));
    s = r.next;
    phaseEventCounts['colocation_detection'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 2.361: Colocation Aggregation — collapse same-hex same-tick encounter storms (THR-456)
  timeInlinePhase('colocation_aggregation', s, () => {
    const aggRng = mulberry32(s.seed + s.tick * 59);
    const locationNodes = s.graph.getNodesByType('location');
    const hexLocationIndex = new Map<string, string>();
    for (const n of locationNodes) {
      const col = n.properties?.hexCol;
      const row = n.properties?.hexRow;
      if (col != null && row != null) {
        const k = `${col},${row}`;
        if (!hexLocationIndex.has(k)) hexLocationIndex.set(k, n.name);
      }
    }
    const aggregated = aggregateColocationEvents(
      s.tickEvents,
      aggRng,
      s.tick,
      (col, row) => hexLocationIndex.get(`${col},${row}`) ?? null,
    );
    if (aggregated !== s.tickEvents) {
      s = { ...s, tickEvents: aggregated };
    }
  });
  prevEventCount = s.tickEvents.length;

  // Phase 2.37: Colocation Revelations (first-sighting possession reveals, faction bond auto-reveals)
  timeInlinePhase('colocation_revelations', s, () => emitColocationRevelations(s));
  phaseEventCounts['colocation_revelations'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.38: NPC Graduation ──
  const npcGradEvents = timeInlinePhase('npc_graduation', s, () => phaseNpcGraduation(s));
  if (npcGradEvents.length > 0) {
    s = { ...s, tickEvents: [...s.tickEvents, ...npcGradEvents] };
  }
  phaseEventCounts['npc_graduation'] = npcGradEvents.length;
  prevEventCount = s.tickEvents.length;

  // Phase 2.4: Sublocation Dissolution
  // Housekeeping *defers* on a bound stage; narrative reapers proceed loudly and
  // break the binding (THR-1296 §4). A dissolving sublocation is a chore, so it waits
  // — the node is made busy, never immortal, and dissolution resumes on release.
  const boundStageHold = runtime
    ? makeDissolutionHold(
      runtime.bindingIndex,
      () => s.strategicState?.bindings ?? [],
      () => s.tick,
    )
    : undefined;
  const dissolutions = timeInlinePhase('sublocation_dissolution', s, () =>
    checkDissolutions(s.graph, s.tick, s.encounterProgress, boundStageHold));
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

  {
    const r = runInlinePhase('dilemma_detection', s, () => phaseDilemmaDetection(s));
    s = r.next;
    phaseEventCounts['dilemma_detection'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 2.55: Dilemma Revelations (knowledge facets from witnessed dilemmas)
  timeInlinePhase('dilemma_revelations', s, () => emitDilemmaRevelations(s));
  phaseEventCounts['dilemma_revelations'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.75: Familiarity Gain (Proximity)
  {
    const r = runInlinePhase('familiarity_gain', s, () => phaseFamiliarityGain(s));
    s = r.next;
    phaseEventCounts['familiarity_gain'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 2.76: Interaction Depth (agent knowledge accumulator)
  timeInlinePhase('interaction_depth', s, () => phaseInteractionDepth(s));
  phaseEventCounts['interaction_depth'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Slot anchor: post-decision — after agent decision, movement, colocation, social.
  s = runRegisteredPhases(s, phaseCtx, 'post-decision', PHASE_PLAN);
  prevEventCount = s.tickEvents.length;

  // Phase 3: Rival Actions

  {
    const r = runInlinePhase('rival_actions', s, () => phaseRivalActions(s));
    s = r.next;
    phaseEventCounts['rival_actions'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 3b: Notable Agendas (THR-630) — living-world autonomy on the same runner
  {
    const r = runInlinePhase('notable_agendas', s, () => phaseNotableAgendas(s));
    s = r.next;
    phaseEventCounts['notable_agendas'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 4: Stealth
  {
    const r = runInlinePhase('stealth', s, () => phaseStealth(s));
    s = r.next;
    phaseEventCounts['stealth'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;


  // ─── Resources & Divine ───────────────────────────────────────────────────────
  // What the player earns and spends this tick.

  // Phase 5.9: Essence Sources (THR-611) — migrate/recompute source tiers before
  // income so typed source yields and tier multipliers are fresh this tick.
  {
    const r = runInlinePhase('essence_sources', s, () => phaseEssenceSources(s));
    s = r.next;
    phaseEventCounts['essence_sources'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6: Essence
  {
    const r = runInlinePhase('essence', s, () => phaseEssence(s));
    s = r.next;
    phaseEventCounts['essence'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.1: Control Effects (sustained divine effects — drain/income/threshold/lapse)
  {
    const r = runInlinePhase('control_effects', s, () => phaseControlEffects(s));
    s = r.next;
    phaseEventCounts['control_effects'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // ─── Decay ─────────────────────────────────────────────────────────────────────
  // Entropy pulls everything toward zero. Reputation, influence, trade, and magic
  // all fade without reinforcement.

  // Slot anchor: pre-economy — fires between the rival/stealth/essence/control cluster
  // and the decay/settlement work. Placement preserves byte-equivalent ordering for
  // phaseReputationDecay (THR-238 Land 2).
  s = runRegisteredPhases(s, phaseCtx, 'pre-economy', PHASE_PLAN);
  prevEventCount = s.tickEvents.length;

  // Phase 6.55: Faction Reputation Decay (TB-060)
  {
    const r = runInlinePhase('faction_reputation_decay', s, () => phaseFactionReputationDecay(s));
    s = r.next;
    phaseEventCounts['faction_reputation_decay'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.56: Chosen Faction Powers (THR-513) — the consumer for `anoint`.
  // Runs right after decay so a chosen faction's members net upward: members
  // gain a power-keyed reputation bonus each tick from `faction.chosen.power`.
  {
    const r = runInlinePhase('chosen_faction_powers', s, () => phaseChosenFactionPowers(s));
    s = r.next;
    phaseEventCounts['chosen_faction_powers'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.6: Divine Influence Decay
  {
    const r = runInlinePhase('divine_influence_decay', s, () => phaseDivineInfluenceDecay(s));
    s = r.next;
    phaseEventCounts['divine_influence_decay'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.7: Hidden Mark Decay (THR-112)
  {
    const r = runInlinePhase('hidden_mark_decay', s, () => phaseHiddenMarkDecay(s));
    s = r.next;
    phaseEventCounts['hidden_mark_decay'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.71: Intelligence Reliability Decay (THR-137)
  {
    const r = runInlinePhase('intelligence_decay', s, () => phaseIntelligenceDecay(s));
    s = r.next;
    phaseEventCounts['intelligence_decay'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.715: Divine Proximity Importance (THR-25)
  const divineProximityStats = timeInlinePhase('divine_proximity', s, () => runDivineProximityPhase(s));
  phaseEventCounts['divineProximityScanned'] = divineProximityStats.scanCount;
  phaseEventCounts['divineProximityAccumulated'] = divineProximityStats.accumulatedCount;

  // Phase 6.62: Trade Route Decay (stale routes lose volume; dead routes removed)
  {
    const r = runInlinePhase('trade_route_decay', s, () => phaseTradeRouteDecay(s));
    s = r.next;
    phaseEventCounts['trade_route_decay'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.625: Condition Decay (tick-based removal of transient condition traits)
  try {
    timeInlinePhase('condition_decay', s, () => decayConditions(s.graph, s.tick, {
      // THR-1241: gives `healing_multiplier` its owning-site read.
      graph: s.graph, effectStates: s.effectStates, persisted: s, tick: s.tick,
    }));
  } catch {
    // fail-soft: condition decay failure is non-fatal
  }

  // Phase 6.625b: Companion expiry (THR-1096). Rides the condition-expiry beat
  // rather than adding a phase — permanent companions carry no counter, so this
  // costs nothing for them.
  try {
    timeInlinePhase('companion_expiry', s, () => expireCompanions(s.graph, s.tick));
  } catch {
    // fail-soft: a departing companion must never take the tick loop with them
  }

  // Phase 6.626: Mastery Trait Decay (mastery traits lose levels without reinforcement)
  try {
    const masteryStart = tickProfilingEnabled ? performance.now() : 0;
    const masteryAgents = s.graph.getNodesByType('actor');
    let processedMasteryActors = 0;
    for (const agent of masteryAgents) {
      // THR-186: skip agents with no traits — avoids O(N_all) work for ambient NPCs
      if (s.graph.getOutgoingEdges(agent.id, 'has_trait').length === 0) continue;
      processedMasteryActors++;
      processTraitDecay(s.graph, agent.id, s.tick);
    }
    emitTiming({
      tick: s.tick,
      category: 'tick_phase_profile',
      phase: 'mastery_decay',
      totalActors: masteryAgents.length,
      processedActors: processedMasteryActors,
      skippedActors: masteryAgents.length - processedMasteryActors,
      durationMs: tickProfilingEnabled ? performance.now() - masteryStart : undefined,
      summary: `mastery_decay: ${processedMasteryActors}/${masteryAgents.length} actors processed`,
    });
  } catch {
    // fail-soft: trait decay failure is non-fatal
  }

  // ─── World State Evolution ──────────────────────────────────────────────────────
  // Dynamics that reshape the map: prosperity, settlement tiers, hex mutations,
  // sphere pressure resolution, quintessence, and sublocation lifecycle.

  // Phase 6.63: Settlement Prosperity (economic pulse for all settlements)
  {
    const r = runInlinePhase('prosperity', s, () => phaseProsperity(s));
    s = r.next;
    phaseEventCounts['prosperity'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.632: Economic Traits (mastery/reputation/scar/condition traits from economic activity)
  {
    const r = runInlinePhase('economic_traits', s, () => phaseEconomicTraits(s));
    s = r.next;
    phaseEventCounts['economic_traits'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.634: Reputation Traits (reach-polarity reputation from encounter accumulation + power renown)
  {
    const r = runInlinePhase('reputation_traits', s, () => phaseReputationTraits(s));
    s = r.next;
    phaseEventCounts['reputation_traits'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.635: Settlement Tier Promotion/Demotion (hamlet↔town↔city based on sustained prosperity)
  {
    const r = runInlinePhase('settlement_tier_change', s, () => phaseSettlementPromotion(s, runtime));
    s = r.next;
    phaseEventCounts['settlement_tier_change'] = r.eventDelta;
  }
  // touchStructure removed (THR-187): phaseSettlementPromotion now calls applyEncounterCacheUpdate
  // per-promotion inside the phase, which syncs encounterCacheBuiltAt to prevent full rebuilds.
  prevEventCount = s.tickEvents.length;

  // Phase 6.636: Settlement Genome Reassessment (re-evaluate genome on tier changes or reach shifts)
  {
    const r = runInlinePhase('settlement_reassessment', s, () => phaseSettlementReassessment(s));
    s = r.next;
    phaseEventCounts['settlement_reassessment'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.638 (was 6.636): Hex State (divine influence + corruption decay, terrain transformation)
  {
    const r = runInlinePhase('hex_state', s, () => ({
      ...phaseHexState(s, s.pendingHexMutations ?? []),
      pendingHexMutations: [],
    }));
    s = r.next;
    phaseEventCounts['hex_state'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.637: Unrest (decay, prosperity damper, threshold events)
  {
    const r = runInlinePhase('unrest', s, () => phaseUnrest(s));
    s = r.next;
    phaseEventCounts['unrest'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.638: Magical Saturation (decay)
  {
    const r = runInlinePhase('magical_saturation', s, () => phaseMagicalSaturation(s));
    s = r.next;
    phaseEventCounts['magical_saturation'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.639: Sphere Pressure Resolution (consumes pendingSpherePressures accumulated by upstream phases)
  {
    const r = runInlinePhase('sphere_pressure', s, () => ({
      ...phaseSpherePressure(s),
      pendingSpherePressures: [],
    }));
    s = r.next;
    phaseEventCounts['sphere_pressure'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.6396: Quintessence Tick (pending erosion/recovery events, passive regen, dissolution)
  // phaseQuintessence returns pendingQuintessenceEvents: [] — no need to clear separately.
  {
    const r = runInlinePhase('quintessence', s, () => phaseQuintessence(s, runtime));
    s = r.next;
    phaseEventCounts['quintessence'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.6395: Sphere Aggregation (computes global World-Soul from entity sphere scores)
  {
    const r = runInlinePhase('sphere_aggregation', s, () => phaseSphereAggregation(s));
    s = r.next;
    phaseEventCounts['sphere_aggregation'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.64: Influence Tier Promotion (backstory unlock events)
  {
    const r = runInlinePhase('influence_tier_promotion', s, () => phaseInfluenceTierPromotion(s));
    s = r.next;
    phaseEventCounts['influence_tier_promotion'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Phase 6.65: Gold Sublocations (conditional spawn/dissolve based on prosperity and wealth)
  {
    const r = runInlinePhase('sublocations', s, () => phaseSublocations(s, activeEncounterCache, runtime));
    s = r.next;
    phaseEventCounts['sublocations'] = r.eventDelta;
  }
  // touchStructure removed (THR-187): phaseSublocations now calls applyEncounterCacheUpdate
  // per spawn/dissolve when runtime is present, syncing encounterCacheBuiltAt incrementally.
  prevEventCount = s.tickEvents.length;

  // Phase 6.66: Economic Chronicle (generate chronicle entries for economic state changes)
  {
    const r = runInlinePhase('economic_chronicle', s, () => phaseEconomicChronicle(s));
    s = r.next;
    phaseEventCounts['economic_chronicle'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Slot anchor: post-economy — after settlement/prosperity/economic chronicle.
  s = runRegisteredPhases(s, phaseCtx, 'post-economy', PHASE_PLAN);
  prevEventCount = s.tickEvents.length;

  // ─── Long-term Progress ─────────────────────────────────────────────────────────
  // Migrated to the post-economy slot in THR-238 Land 3 (registry-driven now):
  //   ambition_progress → faction_ambitions → faction_actions → secrets_favors →
  //   clue_decay → ruin_quest_hooks → delve_admission → delve_progression →
  //   delve_emergence → pop_streams. afterPhase chain in the descriptors
  //   preserves the inline order. delve_emergence reads ctx.runtime for cache
  //   invalidation on ruin transformation.

  // Slot anchor: pre-lifecycle — after the ruin/delve cluster, before death/birth.
  s = runRegisteredPhases(s, phaseCtx, 'pre-lifecycle', PHASE_PLAN);
  prevEventCount = s.tickEvents.length;

  // Phase 6.75: Agent Lifecycle (death, birth, migration)
  {
    // `runtime` reaches the phase so the binder's mint valve can bump the structural
    // cache version when it bears someone (THR-1296 §5) — a new actor invalidates the
    // encounter cache, the distance matrix, and the UI's structural memo. Optional:
    // the legacy no-runtime test path still works, it simply has no cache to touch.
    // THR-1304 #6: the third argument is the births block's content-rich siting cache, and
    // it was passed `undefined` from the only production call site — so
    // `BORN_LATER_PREFER_CONTENT_LOCATIONS` (shipped `true`) gated a branch nothing could
    // enter, and born-later mortals were sited across every location in the graph rather
    // than the ones carrying encounters for them. Read off `runtime`, not the module-level
    // legacy pointer, so the cache stays session-owned (CLAUDE.md § engine caches).
    const r = runInlinePhase('agent_lifecycle', s, () => phaseAgentLifecycle(
      s, nextEventId, runtime?.encounterCache ?? undefined, runtime,
    ));
    s = r.next;
    phaseEventCounts['agent_lifecycle'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // ─── Narrative ─────────────────────────────────────────────────────────────────
  // Runs after all event-generating phases so that deaths, mandate milestones,
  // economic changes, and ambition completions all get the full chronicle treatment.

  // Phase 5: Narrative (moved here from before economy — now captures ALL tick events)
  {
    const r = runInlinePhase('narrative', s, () => phaseNarrative(s));
    s = r.next;
    phaseEventCounts['narrative'] = r.eventDelta;
  }
  prevEventCount = s.tickEvents.length;

  // Slot anchor: post-narrative — registered phases include `mandate` (THR-238
  // Land 3, migrated here). `doom_expiry` stays inline because phaseDoomExpiry
  // is defined in this file and depends on module-local `nextEventId`.
  s = runRegisteredPhases(s, phaseCtx, 'post-narrative', PHASE_PLAN);
  prevEventCount = s.tickEvents.length;


  // ─── Victory & Defeat ──────────────────────────────────────────────────────────

  // Phase 8: Doom Expiry (kept inline — depends on module-local nextEventId)
  {
    const r = runInlinePhase('doom_expiry', s, () => phaseDoomExpiry(s));
    s = r.next;
    phaseEventCounts['doom_expiry'] = r.eventDelta;
  }

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

  // Merge tick events into recent events (ring buffer). Phases that need their
  // events visible to same-tick readers (omen beats, marks, seeds, encounter
  // aftermath) already appendRecentEvent at emission — skip those here by id,
  // or the feed holds the same event twice and React keys collide (THR-682).
  const MAX = 100;
  const seenRecentIds = new Set(s.recentEvents.map(e => e.id));
  const combined = [...s.recentEvents, ...s.tickEvents.filter(e => !seenRecentIds.has(e.id))];
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

  // THR-1068: retire auto_resolve step notifications past their deadline, BEFORE
  // the retention trim below. Order matters only for the trace: expiring first
  // means a record that is both overdue and beyond retention is reported as
  // expired rather than silently vanishing, which is the difference between a
  // deadline that fires and one that is merely outlived. `RETINUE_VIGNETTE_TIMEOUT`
  // (8) is far inside NOTIFICATION_RETENTION_TICKS (50), so in practice every
  // expiry happens here and the trim only ever sees already-retired records.
  if (s.encounterNotifications && s.encounterNotifications.length > 0) {
    const { notifications: afterExpiry, expiredIds } = expireOverdueEncounterNotifications(
      s.encounterNotifications,
      s.tick,
    );
    if (expiredIds.length > 0) {
      s = { ...s, encounterNotifications: [...afterExpiry] };
      // One aggregate trace per tick, never one per notification (trace-volume budget).
      emitTrace({
        category: 'encounter_notification',
        type: 'encounter_notification_expiry',
        tick: s.tick,
        event: 'auto_resolve_deadline_passed',
        expiredCount: expiredIds.length,
        expiredIds,
      } as unknown as TraceEntry);
    }
  }

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
    // THR-603: distil each newly-resolved encounter into a persistent ChapterRecord
    // here — BEFORE the prune below discards its steps/choices/aftermath. This decouples
    // "always readable" from `RESOLVED_ACTION_RETENTION_TICKS` (which stays unchanged).
    const newlyArchived: ChapterRecord[] = [];
    // THR-571 C1: collect newly-resolved actions so the failure→story-artifact guarantee
    // runs at the same transition, before the prune.
    const newlyResolved: UnifiedAction[] = [];
    const stamped = s.unifiedActions.map(a => {
      if (a.resolved && a.completedAtTick == null) {
        // THR-470: count each branching fire exactly once, here at the newly-resolved
        // transition — BEFORE the prune below drops it. The KPI rate reads this lifetime
        // counter instead of the pruned snapshot, which otherwise undercounts long runs.
        if (runtime && isBranchingTemplate(a.templateId)) runtime.branchingFiresTotal++;
        // THR-541: same pattern for threaded beats (rich = multi-step or branching).
        if (runtime && isRichTemplate(a.templateId)) runtime.threadedBeatsTotal++;
        // THR-571 U1 re-band: lifetime denominator + clean/crit-success numerators for the
        // rare-signal tail bands (windowed rates are too noisy at ~72 resolved/window).
        if (runtime) {
          runtime.resolvedActionsTotal++;
          if (a.outcome === 'success') runtime.cleanSuccessTotal++;
          else if (a.outcome === 'critical_success') runtime.critSuccessTotal++;
        }
        const stampedAction = { ...a, completedAtTick: s.tick };
        if (isEncounterAction(a.templateId)) {
          const record = buildChapterRecord(stampedAction, s, runtime);
          if (record) newlyArchived.push(record);
        }
        newlyResolved.push(stampedAction);
        return stampedAction;
      }
      return a;
    });
    const nextArchive =
      newlyArchived.length > 0 ? appendChapters(s.chapterArchive ?? [], newlyArchived) : s.chapterArchive;
    // One trace per archived chapter — bounded by the resolution rate, not agent count,
    // so this cannot flood the ring buffer the way a per-agent burst would.
    for (const rec of newlyArchived) {
      emitChapterArchivedTrace(rec, s.tick, nextArchive?.length ?? 0);
    }
    s = { ...s, chapterArchive: nextArchive, unifiedActions: stamped };
    // THR-571 C1: every newly-resolved failure/critical_failure must leave ≥1 story artifact
    // (a fallback hidden mark when none is present) and count toward failure_story_rate.
    // Runs at the same newly-resolved transition as the branching counter, before the prune,
    // so the lifetime counters are honest and each fallback mark is placed exactly once.
    for (const a of newlyResolved) {
      s = guaranteeFailureStoryArtifact(s, a, s.tick, runtime);
      // THR-724: births knows_secret_of / owes_favor edges from template metadata.
      // This is the *live* read site — the legacy one in phaseEncounterProgressionV2
      // walks `encounterProgress`, which is empty for the whole of a standard run.
      try {
        applySecretsFavorsFromResolvedAction(s, a, runtime);
      } catch {
        // fail-soft: a secret that cannot be born must not stop the tick
      }
    }
    s = {
      ...s,
      unifiedActions: s.unifiedActions.filter(a =>
        !a.resolved || a.completedAtTick == null || s.tick - a.completedAtTick < RESOLVED_ACTION_RETENTION_TICKS,
      ),
    };
  }



  // Phase end: Drift Decay — passive per-tick decay toward zero (THR-323)
  {
    const decayResult = phaseDriftDecay(s);
    s = { ...s, archetypeDrift: decayResult.archetypeDrift };
    phaseEventCounts['drift_decay'] = decayResult.decayedCount;
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

  // THR-580: per-tick rollup — "which tick got slow and why". Profiling-gated, so
  // zero cost on the default path. `slowestPhase` is derived from the `tick_phase_profile`
  // entries this tick already emitted to the timing ring (registered + inline).
  if (tickProfilingEnabled) {
    const totalMs = performance.now() - tickStart;
    const tickTimings = getTimingTraces().filter(
      (t): t is TickPhaseProfileTrace =>
        t.category === 'tick_phase_profile' && t.tick === s.tick,
    );
    let slowestPhase = 'none';
    let slowestPhaseMs = 0;
    for (const t of tickTimings) {
      const d = t.durationMs ?? 0;
      if (d > slowestPhaseMs) {
        slowestPhaseMs = d;
        slowestPhase = t.phase;
      }
    }
    emitTiming({
      category: 'tick_profile',
      tick: s.tick,
      totalMs,
      phaseCount: tickTimings.length,
      slowestPhase,
      slowestPhaseMs,
      agentCount: s.graph.getNodesByType('actor').length,
      encounterCacheRebuilt: (runtime?.encounterCacheRebuildCount ?? 0) > ecRebuildsBefore,
      distanceMatrixRebuilt: (runtime?.distanceMatrixRebuildCount ?? 0) > dmRebuildsBefore,
      summary: `tick ${s.tick}: ${totalMs.toFixed(1)}ms total, slowest ${slowestPhase} ${slowestPhaseMs.toFixed(1)}ms`,
    });
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
