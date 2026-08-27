/**
 * Unified Action Resolution — progress, collect, resolve, and execute
 * unified actions during the tick pipeline.
 *
 * These functions implement Phases 1-6 of the unified action pipeline:
 *   Phase 1: Progress all active actions (+1 stepProgress)
 *   Phase 2: Collect actions whose current step completed this tick
 *   Phase 3: Contestation detection and resolution (Sprint 4)
 *   Phase 4+5: Resolve and execute GraphOps
 *   Phase 6: Advance completed steps or mark action resolved
 *
 * Phase 7 (idle selection) is in a separate module (Sprint 3E).
 *
 * All functions are pure or take explicit state — no hidden globals.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { SphereName } from '../types/index';
import type {
  AftermathVariant,
  EncounterAftermathChange,
  EncounterAftermathReaction,
  EncounterAftermathSummary,
  UnifiedAction,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
  StepOutcome,
} from '../types/unifiedAction';
import type { ActionStepOutcomeMetadata } from '../types/unifiedAction';
import { applyEncounterAftermathReaction } from './encounterAftermath';
import {
  type DerivedChange,
  factionStandingSentence,
  gateFollowOnSentence,
  gateStateSentence,
  growthSentence,
  overviewHighlightPhrase,
  reachDisplayName,
  reputationSentence,
  rewardSentence,
  traitGrantedSentence,
} from './aftermathWords';
import type { GraphOp } from '../types/graphOp';
import {
  progressUnifiedAction,
  isStepComplete,
  advanceStep,
  sortByPriority,
  resolveStepDefinition,
} from './unifiedActionLifecycle';
import {
  isStepSuccess,
  isActionStepBranch,
  resolveAftermathVariant,
} from '../types/unifiedAction';
import { applyAgentDecidedBranches } from './encounters/branchDecision';
import { computeCapability, computeCapabilityWithRawBonus } from './domainCapability';
import { getAscendantDomainAffinities } from './ascendant';
import { getGroupOf } from './groups/groupQueries';
import { resolveGroupStep } from './groups/groupResolution';
import {
  collectBandOppositions,
  applyContestConsequences,
  contestedOutcomeFor,
} from './groups/bandOpposition';
import { outcomePinFor, recordOutcomePinVerdict } from './debugOutcomePin';
import type { OutcomeType } from '../types/resolution';
import type { ResolutionInput } from '../types/resolution';
import { executeGraphOps } from './graphOpExecutor';
import { applyFactionGovernanceVerb } from './factionGovernanceVerbs';
import { applyPlantSchism } from './schismPlant';
import { applyAnointSuccessor } from './anointSuccessor';
import { applyImbueItem, applyBestowPower, applyAnointFaction, applyPlantTrap, applyCurseMark } from './ascendantExpression';
import { applyQuintessenceRestore } from './rekindleThread';
import { revealBestSecret } from './secretsFavorsConsequences';
import { SCHISM_PENDING_DURATION_TICKS } from '../data/game-config';
import { GATE_DUTY_NUDGE_IDS } from '../data/civic-guard-encounter-content';
import { emitTrace } from './traceBuffer';
import { enrichProse, gatherNarrativeContext } from './proseEnrichment';
import { stepOutcomeToOutcomeBand } from '../data/outcome-band-content';
import { STEP_PROSE_HISTORY_MAX, type StepProseRecord } from '../types/stepProseRecord';
import {
  detectContestations,
  resolveContestationPair,
} from './contestation';
import { resolveHexActionFull, isHexTargetId, parseHexTargetId } from './hexActionBridge';
import { buildDiscoveryTickEvent } from './revelationResolver';
import { composeSurveyPeopleProse, buildSurveyCompletedTickEvent } from './surveyProseComposer';
import { computeElderEssenceReward } from './elderEssenceReward';
import { consumeTreasureMapsAtHex } from './treasureMapConsumption';
import { appendEvent } from './encounterTimeline';
import type { HexMutation } from '../types/hexMutation';
import type { RevelationMutation } from './revelationResolver';
import { applyRevelationMutations } from './revelationResolver';
import { applyEncounterGrowth } from './capabilityGrowth';
import { applyChainStageCompletion } from './encounterChains';
import { handleTierPromotion } from './tierPromotion';
import { accruePlayerReachPractice } from './phaseAscendantProgression';
import type { ControlEffect } from '../types/controlEffect';
import { spawnControlEffect } from './controlEffectSpawn';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { ACTION_PRESSURE_SUCCESS, ACTION_PRESSURE_FAILURE } from '../types/sphereAffinity';
import { resolveRevelationAction } from './revelationEmitter';
import { resolvePerceiveRelayAction, PERCEIVE_RELAY_TEMPLATE_IDS } from './ruins/perceiveRelay';
import { getAvatarsOf, getFactionMembershipEdges } from './graphQueries';
import {
  STILLNESS_ESSENCE_REGEN,
  RECEDE_DISCOUNT_FRACTION,
  FOCUS_TIER_BOOST,
  REVEAL_DEVOTION_DELTA,
  REVEAL_FEAR_DELTA,
  REVEAL_AWE_DELTA,
  REVEAL_WAKE_MARK_DURATION,
} from '../data/self-action-constants';
import type { SelfActionTrace, ResolutionInputTrace } from '../types/trace';
import { resolveCritFailureSeverity } from './resolutionScaleAdjust';
// THR-1292 slice 2 — the shared step-resolution library. `resolveUncontestedStep`
// derives its inputs and applies its returns; the ladder itself lives there.
import { resolveStepCore } from './stepResolutionCore';
import type { AscendantProperties } from '../types/influence';
import { accumulateImportance, getImportanceDelta, getRarityTier } from './rarity';
import type { TraceEntry } from '../types/trace';
import type { SimulationRuntime } from './simulationRuntime';
import { touchWorld, touchStructure } from './simulationRuntime';
import { createUnifiedActionEventNode } from './encounterEventNode';
import type { BalanceEvent } from '../types/balanceEval';
import { DEFAULT_REPUTATION } from '../types/disposition';
import { recordBalanceEvent } from './balanceTelemetry';
// THR-1284: the encounter-category predicate and the rarity→threat mapping the
// rest of the encounter stack already shares. Imported rather than re-derived so
// the balance instrument cannot drift from what the game calls an encounter.
import { isEncounterAction } from './chapterArchive';
import { RARITY_TO_THREAT } from './encounterCache';
import { computeOutcomeConsequence } from './outcomeConsequences';
import type { ComplicationContext } from '../types/complication';
import { applyComplicationEffects } from './complicationEffects';
import { getAgentLocationId, getAgentsAtLocation } from './graphQueries';
import { processFactionEncounterReputation } from './factionReputation';
import { processReputationTally } from './phaseReputationTraits';
import {
  canSpendQuintessence,
  getPushModifier,
  spendQuintessence,
} from './quintessenceActions';
import { isProvingSliceTemplate } from './outcomeConsequences';
import { LOCATION_ACTION_POST_EFFECT_TEMPLATE_IDS } from '../data/unified-action-templates';
import {
  LOC_BLESS_HARVEST_DURATION_TICKS,
  LOC_SICKEN_WELLS_DURATION_TICKS,
  LOC_CURSE_ROADS_DURATION_TICKS,
} from '../data/location-action-constants';
import { INTEL_DIFFICULTY_BONUS } from '../data/agent-behavior-constants';
import {
  emitIntelligenceReferenced,
  findActionableIntelligence,
  reliabilityDescriptor,
} from './intelligence';
import { drawSeededReward } from './rewardPool';
import { recordReward } from './rewardHistory';
import { mulberry32 } from '../lib/prng';
import { mintCompanion } from './companions';
import { buildPredicateContext, collectTestShapers } from './effectResolver';
import { applyClearanceGateStepOutcome, summarizeClearanceGateUpdates } from './clearanceGate';
import { applyFlipTableTriggerWithConfig, matchesStepOutcomeTrigger } from './effectShellRuntime';
import { getEffectiveUnifiedActionChoiceMemory } from './encounterChoiceMemory';
// THR-773 (Nudge Model WS0): named forecast modifiers + pure band riders.
import {
  collectHeldTraitIds,
  collectNudgeModifiers,
  priorStepOutcome,
  resolveTraitVariants,
  selectActiveRider,
  sumModifiers,
  sumVariantDifficultyDelta,
} from './encounters/nudges';
import { composeDealtStepFromState, isDealtNudgeId } from './encounters/dealHand';
import type { EncounterChoiceMemory } from '../types/encounter';
import type { ClearanceGateRuntimeState, ClearanceGateState } from '../types/contentShells';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { appendDigestEntry } from './digestBuffer';
import { isNotableEntry } from './attentionTier';
import type { DigestEntry } from '../types/attention';
import {
  checkAndFireActionTriggers,
  ladderEventsFor,
  type ActionTriggerContext,
  type ActionTriggerResult,
} from './effects/actionTrigger';
import { applyActionTriggerPayloads } from './effects/actionTriggerPayloads';
import type { ActionTriggerEvent, EffectRuntimeState } from '../types/effects';
import { collectAttachmentEffects } from './effects/effectWalker';
import { spendConsumableCharges } from './effects/consumableCharges';
import { tierScaledDifficulty } from './targetTierScaling';
import { resolveToParentLocation } from './sublocationShape';
import {
  PLAYER_CAST_VARIANCE_ENABLED,
  PLAYER_CAST_PUSH_ENABLED,
  ascendantCastRawBonus,
} from '../data/player-cast-constants';

// ─── Phase 1: Progress ──────────────────────────────────────────

/**
 * Increment stepProgress by 1 for all active (unresolved) unified actions.
 * Returns a new array — no mutation.
 */
export function progressAllActions(
  actions: readonly UnifiedAction[],
): UnifiedAction[] {
  return actions.map((a) => progressUnifiedAction(a));
}

// ─── Phase 2: Collect Completions ───────────────────────────────

/**
 * Find all actions whose current step completed this tick
 * (stepProgress >= stepDuration after progression).
 */
export function collectCompletions(
  actions: readonly UnifiedAction[],
): UnifiedAction[] {
  return actions.filter((a) => !a.resolved && isStepComplete(a));
}

// ─── Phase 4+5: Resolve and Execute ─────────────────────────────

/**
 * Resolve a single uncontested action step.
 *
 * Uses the existing resolution system: computes domain capability
 * for the step's reach, then resolves via sigmoid → d100.
 *
 * Returns the step outcome and which GraphOps to execute.
 */
export interface StepResolutionResult {
  outcome: StepOutcome;
  /** Phase 3: The raw outcome from the shared resolver, before any mapping. */
  rawOutcome: OutcomeType;
  opsToExecute: readonly GraphOp[];
  capability: number;
  probability: number;
  roll: number;
  /** Phase 3: Whether a push was attempted and the Q cost */
  pushAttempted: boolean;
  pushCost: number;
  /** Phase 3: Whether a resist was attempted, succeeded, and the Q cost */
  resistAttempted: boolean;
  resistSucceeded: boolean;
  resistCost: number;
  /** Phase 3: The outcome before resist downgrade, if resist happened */
  preResistOutcome?: StepOutcome;
}

/**
 * Phase 3: map the shared resolver's `OutcomeType` to a `StepOutcome`.
 *
 * THR-1292 slice 2 — the implementation moved to `stepResolutionCore.ts` so that
 * the band ladder has exactly one definition across both callers. Re-exported
 * from here because `encounter.ts` and `meetingEncounter.ts` already import it at
 * this path; re-exporting keeps that additive (NFP #6) while leaving one
 * implementation, which is what the slice's contract test pins.
 */
export { mapResolverOutcomeToStep } from './stepResolutionCore';

export function resolveUncontestedStep(
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  state: GameState,
  rng: () => number,
): StepResolutionResult {
  // THR-1247 — re-derive the dealt fill before anything reads the hand.
  //
  // `resolveStepDefinition` returns the *authored* nudges only, and every reader
  // below (`collectNudgeModifiers`, `selectActiveRider`, `dispatchNudgeCommitments`,
  // `collectNudgeBandProse`) resolves a committed id against that list, skipping
  // what it cannot find. Without this line a dealt card the player paid for would
  // contribute no delta, no rider, no cost channel, no grant and no band prose —
  // shown, charged, and inert.
  //
  // Sound because dealing is pure and zero-PRNG: the same repertoire and the
  // same declaration yield the same cards here as they did on the render path.
  // A step with no `deal` comes back by reference, so this is a no-op for every
  // shipped template.
  const step = composeDealtStepFromState(
    resolveStepDefinition(template, action.currentStep, action.choiceHistory),
    state,
  ).step;
  const noPushResist = { pushAttempted: false, pushCost: 0, resistAttempted: false, resistSucceeded: false, resistCost: 0 };

  if (!step) {
    return { outcome: 'failure', rawOutcome: 'failure', opsToExecute: [], capability: 0, probability: 0, roll: 0, ...noPushResist };
  }

  // THR-1030 — the outcome-band review pin (`?outcome=<band>`). Read once here so
  // the two auto-success early returns below honour it too; a reviewer asking for
  // `critical_failure` on a divine action must not be handed a silent success.
  // In the main path it is applied at the *tail*, after the roll and every floor,
  // so the resolution genuinely runs and the trace stays honest.
  const pinnedBand = outcomePinFor(action.templateId);

  // Divine actions (difficulty 0) always succeed
  if (step.difficulty === 0) {
    const outcome = pinnedBand ?? 'success';
    const ops = isStepSuccess(outcome) ? step.onSuccess : step.onFailure;
    return { outcome, rawOutcome: 'success', opsToExecute: ops, capability: 1, probability: 1, roll: 0, ...noPushResist };
  }

  // THR-728: player casts roll the same ladder mortals do — but never below the
  // floor applied at the tail of this function. With the master switch off, the
  // pre-THR-728 auto-success early-return is restored verbatim (one-flag revert).
  if (!PLAYER_CAST_VARIANCE_ENABLED && action.source === 'player') {
    const outcome = pinnedBand ?? 'success';
    const ops = isStepSuccess(outcome) ? step.onSuccess : step.onFailure;
    return { outcome, rawOutcome: 'success', opsToExecute: ops, capability: 1, probability: 1, roll: 0, ...noPushResist };
  }

  let effectiveDifficulty = step.difficulty;
  // THR-1073: a step may price its difficulty from the target's attachment tier,
  // so advancing Mythic→Legendary rolls against the authored hard number rather
  // than the tier-1 one every advancement used to share. The table lives in
  // `attachment-tier-content.ts` (NFP #1) — nothing numeric is decided here.
  if (step.difficultyContext === 'target_tier_scaled') {
    effectiveDifficulty = tierScaledDifficulty(step, state.graph.getNode(action.targetId)?.properties);
  }
  if (step.difficultyContext === 'intel_sensitive') {
    const targetNode = state.graph.getNode(action.targetId);
    const locationId = targetNode?.type === 'location'
      ? action.targetId
      : (getAgentLocationId(state.graph, action.actorId) ?? action.targetId);
    const locationNode = state.graph.getNode(locationId);
    const region = typeof locationNode?.properties?.region === 'string'
      ? locationNode.properties.region
      : typeof locationNode?.properties?.regionId === 'string'
        ? locationNode.properties.regionId
        : undefined;
    const intelMatch = findActionableIntelligence(state, action.actorId, {
      templateId: action.templateId,
      locationId,
      targetAgentId: targetNode?.type === 'actor' ? action.targetId : undefined,
      region,
    });
    if (intelMatch) {
      const band = reliabilityDescriptor(intelMatch.reliability);
      const weight = band === 'reliable' ? 1 : band === 'uncertain' ? 0.5 : 0;
      if (weight > 0) {
        effectiveDifficulty = Math.max(0, step.difficulty + INTEL_DIFFICULTY_BONUS * weight);
        emitIntelligenceReferenced(state.tick, action.actorId, intelMatch.recordId, 'difficulty_modifier', {
          templateId: action.templateId,
          intelCategory: intelMatch.category,
        });
      }
    }
  }

  // THR-74: Company substitution. When the actor belongs to an active company
  // and the template is group-eligible, the companion best suited to *this
  // step's* reach steps forward, and the rest of the company contributes a
  // capped assist. The nominal actor stays the action's owner throughout —
  // encounter/awareness systems never meet a positionless group node, and every
  // downstream consumer of `action.actorId` is unaffected.
  //
  // Fail-soft: `resolveGroupStep` returns undefined for a disbanded or emptied
  // company, and the whole lookup is skipped for a template without the 'group'
  // affinity, so the individual path below is the default in every other case.
  const groupNode = getGroupOf(state.graph, action.actorId);
  const groupStep = groupNode && (template.actorAffinities ?? []).includes('group')
    ? resolveGroupStep(state.graph, groupNode.id, step.reach, action.actorId)
    : undefined;

  // Compute domain capability for this step's reach — the acting member's when a
  // company answered, the actor's own otherwise.
  //
  // THR-728: a player cast adds the ascendant's innate divine aptitude, which is
  // not a term the shared raw score walks (see `ascendantCastRawBonus` for the
  // measured why). Player-path only — the mortal branch is untouched.
  const capabilityNodeId = groupStep?.actingMemberId ?? action.actorId;
  const capability = action.source === 'player'
    ? computeCapabilityWithRawBonus(
      state.graph,
      capabilityNodeId,
      step.reach,
      ascendantCastRawBonus(
        getAscendantDomainAffinities(state.graph, capabilityNodeId)?.[step.reach],
      ),
    )
    : computeCapability(state.graph, capabilityNodeId, step.reach);

  // Sphere factor: small bonus if actor's location has sphere influence
  // (simplified — full implementation would check location sphere influence)
  const sphereFactor = 0;
  const predicateContext = buildPredicateContext(state.graph, action.actorId, step.reach);
  const testShapers = collectTestShapers(
    state.graph,
    action.actorId,
    step.reach,
    predicateContext,
    state.effectStates,
  );

  // Phase 3: Push — risky actions attempt to spend quintessence for better odds.
  // The actor node must be resolvable and the template must be push-eligible.
  let pushModifier = 0;
  // THR-1121 — the step's choice memory is **no longer read here**. It was
  // the application site of the paid RNG modifier: a choice priced in essence
  // bought a flat addition to the roll's odds, on the same additive channel as
  // push and the company assist. The Nudge Model pivot (THR-773/WS0) rejects
  // exactly that trade — the god nudges the fiction, fate picks the outcome — so
  // there is no longer any surface that sells odds, and this was the last thing
  // reading the price as one.
  //
  // The choice memory itself stays: `resolveInterveneChoice` writes it, and
  // `resolveAftermathVariant` keys authored endings off `choiceId` via
  // `aftermathConfig.branchOnStep` (THR-989 — 30 of 34 variant-carrying templates
  // depend on it). An authored choice therefore still costs essence and still
  // decides which ending is reached; what it no longer does is move the roll.
  // Per-card forecast movement now lives on the *named* `nudge:<id>` channel
  // below, which the stage renders as words rather than percentages.
  let pushEvent: import('../types/quintessence').QuintessenceEvent | null = null;
  // THR-728: push is mortal-only. It spends the actor's quintessence pre-roll, and
  // the ascendant has no place in that economy.
  const pushAllowed = PLAYER_CAST_PUSH_ENABLED || action.source !== 'player';
  if (pushAllowed && isPushEligible(action.templateId) && step.difficulty >= 0.3) {
    const actorNode = state.graph.getNode(action.actorId);
    if (actorNode && canSpendQuintessence(actorNode, 'push')) {
      pushModifier = getPushModifier(actorNode);
      pushEvent = spendQuintessence(actorNode, 'push', `action_push_${action.templateId}`, state.tick);
    }
  }

  // Phase 2: Use shared resolution service.
  // Unified action difficulty is already normalized (0..1) — pass through directly.

  // THR-773: nudges the player committed to this step, plus any trait variants
  // the acting agent's traits switch on, contribute *named* forecast modifiers
  // (`nudge:<id>` / `trait:<id>`). They ride the same additive channel as push
  // and the company assist, so one modifier total feeds scale adjustment, the
  // probability floor, and the trace. Absent `activeNudges` and absent
  // `traitVariants` both sum to 0, leaving the pre-nudge path byte-equivalent.
  const nudgeTraitVariants = template.traitVariants?.length
    ? resolveTraitVariants(template, collectHeldTraitIds(state.graph, action.actorId))
    : [];
  // THR-892 — a carryover line declared for the band the *previous* step landed on
  // rides the same named channel as `carryover:<outcome>`. Zero new rng: the draw
  // it reads happened last step.
  const nudgeModifiers = collectNudgeModifiers(
    step,
    action.activeNudges,
    nudgeTraitVariants,
    priorStepOutcome(action),
    // THR-1179 — a Stumble attributes its delta to the cast member it works
    // against, which is only resolvable from this action's own bindings.
    action.supportBindings,
  );
  const nudgeModifierTotal = sumModifiers(nudgeModifiers);
  // A trait variant may also ease (or steepen) the step itself, before the
  // scale adjustment below reads the difficulty.
  const variantDifficultyDelta = sumVariantDifficultyDelta(nudgeTraitVariants);
  if (variantDifficultyDelta !== 0) {
    effectiveDifficulty = Math.max(0, Math.min(1, effectiveDifficulty + variantDifficultyDelta));
  }

  // THR-74: the company's assist + cohesion bonus rides the same additive
  // channel as push, so scale adjustment, the probability floor, and the trace
  // all see one consistent modifier total. (THR-1121 removed the intervention
  // boost from this sum — see the note at `rememberedChoice` above.)
  const totalActionModifiers = pushModifier + (groupStep?.totalBonus ?? 0)
    + nudgeModifierTotal;

  // ── THR-1292 slice 2: the band ladder is no longer implemented here ──
  //
  // Everything above derives the core's inputs from the action, the template and
  // the graph. Everything below applies what the core hands back. The core owns
  // scale adjustment → d100 → floors → band mapping → resist → rider → debug pin,
  // and it owns them for the undertaking caller too, so there is exactly one
  // implementation of the six-band ladder in the engine.
  //
  // It mutates nothing: quintessence comes back as `spendIntents` for this
  // function to queue, and telemetry comes back as `tracePayload` for this
  // function to emit. Push stays here because it is pre-roll and draws no rng —
  // see the asymmetry note in `stepResolutionCore.ts`'s header.
  const core = resolveStepCore({
    actorId: action.actorId,
    reach: step.reach,
    capability,
    difficulty: effectiveDifficulty,
    scale: template.scale,
    actionModifiers: totalActionModifiers,
    testShapers,
    sphereFactor,
    variancePolicy: action.source === 'player' ? 'player' : 'agent',
    quintessencePolicy: 'spend-intent',
    resistEligible: isResistEligible(action.templateId),
    resistActor: state.graph.getNode(action.actorId) ?? undefined,
    resistSourceLabel: action.templateId,
    pushIntent: pushEvent,
    // Rider *selection* reads the nudge registry, so it stays caller-side; the
    // core owns only where in the order the rider is applied.
    bandRider: selectActiveRider(step, action.activeNudges, action.templateId),
    bandOverride: pinnedBand,
    tick: state.tick,
    sourceLabel: 'unified_action',
  }, rng);

  const trace = core.tracePayload;

  // THR-451 Phase A: full resolution input telemetry. Emitted here rather than in
  // the library, per the returns-only contract shared with `resolutionService`.
  emitTrace({
    category: 'resolution.input',
    tick: state.tick,
    actorId: action.actorId,
    templateId: action.templateId,
    scale: template.scale ?? 'regional',
    capability: trace.capability,
    difficulty: trace.difficulty,
    rawDifficulty: trace.rawDifficulty,
    scaleOffsetApplied: trace.scaleOffsetApplied,
    sphereFactor: trace.sphereFactor,
    actionModifiers: trace.actionModifiers,
    influenceNudge: trace.influenceNudge,
    probability: trace.probability,
    scaleFloorApplied: trace.scaleFloorApplied,
    probabilityFloorApplied: trace.probabilityFloorApplied,
    roll: trace.roll,
    outcome: trace.outcome,
    rawOutcome: trace.rawOutcome,
    critClassification: trace.critClassification,
    floorUpgradeApplied: trace.floorUpgradeApplied,
    playerFloorApplied: trace.playerFloorApplied,
    // THR-74: present only when a company answered this step.
    groupId: groupNode?.id,
    actingMemberId: groupStep?.actingMemberId,
    groupAssistCount: groupStep?.assistCount,
    groupBonus: groupStep?.totalBonus,
    summary: `resolution.input: ${action.templateId} scale=${template.scale ?? 'regional'} cap=${trace.capability.toFixed(2)} diff=${trace.difficulty.toFixed(2)} P=${trace.probability.toFixed(2)} roll=${trace.roll} raw=${trace.rawOutcome}${trace.floorUpgradeApplied ? ' [floor↑]' : ''}${trace.playerFloorApplied ? ' [player-floor↑]' : ''} → ${trace.outcome}${groupStep ? ` [company ${groupStep.actingMemberName} +${groupStep.totalBonus.toFixed(2)} assists=${groupStep.assistCount}]` : ''}`,
  } as ResolutionInputTrace);

  // Phase 3: the library returned spend intents; this caller queues them. Order is
  // push then resist, the order they were incurred — preserved from when both were
  // queued inline.
  if (state.pendingQuintessenceEvents) {
    for (const intent of core.spendIntents) {
      state.pendingQuintessenceEvents.push(intent);
    }
  }

  const ops = isStepSuccess(core.outcome) ? step.onSuccess : step.onFailure;

  return {
    outcome: core.outcome,
    // Historically named `rawOutcome`, but it is the POST-floor resolver verdict;
    // the genuinely pre-floor one is `trace.rawOutcome`, emitted above. The two
    // disagree exactly on floored rows, and both have downstream readers.
    rawOutcome: core.resolverOutcome,
    opsToExecute: ops,
    capability,
    probability: core.probability,
    roll: core.roll,
    pushAttempted: pushEvent !== null,
    pushCost: pushEvent ? Math.abs(pushEvent.delta) : 0,
    resistAttempted: core.resistAttempted,
    resistSucceeded: core.resistSucceeded,
    resistCost: core.resistCost,
    preResistOutcome: core.preResistOutcome,
  };
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return hash;
}


interface EncounterResolutionSnapshot {
  actorName: string;
  reputationScore: number;
  factionMemberships: ReadonlyMap<string, {
    factionName: string;
    reputation: number;
    role?: string;
  }>;
  reputationTallies: Readonly<Record<string, number>>;
  clearanceGates: ReadonlyMap<string, {
    state: ClearanceGateState;
    followOnTags: readonly string[];
  }>;
}

function snapshotEncounterResolutionContext(
  state: GameState,
  action: UnifiedAction,
): EncounterResolutionSnapshot {
  const actorNode = state.graph.getNode(action.actorId);
  const actorName = actorNode?.name ?? 'Unknown agent';
  const reputationScore = (actorNode?.properties?.reputationScore as number | undefined) ?? DEFAULT_REPUTATION;

  const factionMemberships = new Map<string, {
    factionName: string;
    reputation: number;
    role?: string;
  }>();
  for (const edge of getFactionMembershipEdges(state.graph, action.actorId)) {
    const factionNode = state.graph.getNode(edge.target);
    factionMemberships.set(edge.target, {
      factionName: factionNode?.name ?? edge.target,
      reputation: (edge.properties?.reputation as number | undefined) ?? 0,
      role: edge.properties?.role as string | undefined,
    });
  }

  const reputationTallies = {
    ...((actorNode?.properties?.reputationTallies as Record<string, number> | undefined) ?? {}),
  };

  const clearanceGates = new Map<string, {
    state: ClearanceGateState;
    followOnTags: readonly string[];
  }>();
  for (const runtimeId of action.clearanceGateIds ?? []) {
    const gate = state.clearanceGateStates?.get(runtimeId);
    if (!gate) continue;
    clearanceGates.set(runtimeId, {
      state: gate.state,
      followOnTags: [...gate.followOnTags],
    });
  }

  return {
    actorName,
    reputationScore,
    factionMemberships,
    reputationTallies,
    clearanceGates,
  };
}

function appendAftermathChanges(
  action: UnifiedAction,
  newChanges: readonly EncounterAftermathChange[],
): UnifiedAction {
  if (newChanges.length === 0) return action;
  return {
    ...action,
    aftermathChanges: [...(action.aftermathChanges ?? []), ...newChanges],
  };
}

/**
 * Resolve branch-aware aftermath variant from template config, choice history, and
 * final outcome. Returns undefined if the template has no aftermathConfig.
 *
 * The lookup itself lives in `types/unifiedAction` (THR-969) so the stage adapter
 * resolves through the identical code path; this wrapper only adds the
 * "no config ⇒ no authored variant" case the engine call site wants.
 */
function resolveTemplateAftermathVariant(
  template: UnifiedActionTemplate,
  choiceHistory?: readonly EncounterChoiceMemory[],
  outcome?: UnifiedActionOutcome,
): AftermathVariant | undefined {
  const config = template.aftermathConfig;
  if (!config) return undefined;
  return resolveAftermathVariant(config, choiceHistory, outcome);
}

function buildEncounterAftermathOverview(
  actorName: string,
  templateName: string,
  outcome: UnifiedAction['outcome'],
  changes: readonly EncounterAftermathChange[],
): string {
  const rewardCount = changes.filter(change => change.kind === 'item').length;
  const traitCount = changes.filter(change => change.kind === 'trait').length;
  const growthCount = changes.filter(change => change.kind === 'growth').length;
  const hookCount = changes.filter(change => change.kind === 'future_hook' || change.kind === 'shell_state').length;
  // THR-1004 — counts are spelled out. A numeral on the overview line is the
  // same violation as a numeral on a chip, and this is the line Christian
  // quoted first ("Your nudge left 1 reward, 3 skill shifts behind…").
  const highlightPhrase = overviewHighlightPhrase({
    traits: traitCount,
    rewards: rewardCount,
    growth: growthCount,
    hooks: hookCount,
  });
  const outcomeText = describeActionOutcome(outcome);
  if (!highlightPhrase) {
    return `${actorName} ${outcomeText} ${templateName}. The scene moved on quietly, but the world still bent a little around it.`;
  }
  return `${actorName} ${outcomeText} ${templateName}. Your nudge left ${highlightPhrase} behind in the world.`;
}

function buildEncounterAftermathReactions(
  action: UnifiedAction,
  template: UnifiedActionTemplate,
): readonly EncounterAftermathReaction[] | undefined {
  if (template.id !== 'cg.quest.gate_duty') return undefined;

  const gateRuntimeId = action.clearanceGateIds?.[0];
  return [
    {
      id: 'follow_witness_story',
      label: "Follow the witness's telling",
      intent: 'Keep one thread of your attention on the mortal version of the night that will travel furthest, so the story leaves the gate carrying your pressure inside it.',
      closeAfterSelection: true,
      effects: [
        { kind: 'clearance_gate_tag', runtimeId: gateRuntimeId, tag: '#witness_story_followed' },
        // THR-1206 — was `gate_duty.witness_story_followed`, an off-axis key the
        // aftermath handler rejects: `isValidReputationTallyKey` accepts only
        // `<reach>.positive|negative`, so this write was traced and discarded on
        // every resolution since it shipped. Following a mortal's telling of the
        // night is Heart work, which is the reach the tally machinery can actually
        // carry. (`SUGGESTED_TALLY_REPLACEMENT` names it `hearth.positive`; the
        // reach is spelled `heart` — the hint's typo, not a ninth reach.)
        { kind: 'reputation_tally', key: 'heart.positive', delta: 1 },
        {
          kind: 'recent_event',
          eventType: 'ripple_consequence',
          message: 'You keep a finger on the witness’s version of the night as it begins to spread through the district.',
          significance: 0.58,
        },
      ],
    },
    {
      id: 'mark_captain_for_later',
      label: 'Keep your eye on the captain',
      intent: 'Remember exactly how the captain held or lost the line, preserving the moment as leverage, omen, or future favor when the watch comes into your hands again.',
      closeAfterSelection: true,
      effects: [
        { kind: 'clearance_gate_tag', runtimeId: gateRuntimeId, tag: '#captain_marked_for_later' },
        // THR-1206 — was `gate_duty.captain_marked`, discarded for the same reason.
        // The fiction is standing inside the watch whose gate this is, which is what
        // `faction_reputation_gain` exists to carry — the replacement
        // `SUGGESTED_TALLY_REPLACEMENT` has named since the leak was first traced.
        { kind: 'faction_reputation_gain', factionId: 'civic_guard', amount: 0.05 },
        {
          kind: 'recent_event',
          eventType: 'narrative',
          message: 'You do not follow the cargo or the crowd — you follow the captain, and how she wore authority under pressure.',
          significance: 0.52,
        },
      ],
    },
    {
      id: 'let_it_settle',
      label: 'Let the district carry it',
      intent: 'Take the lesson, but leave the aftermath in mortal hands. You do not tighten the thread further; you let the district decide what sort of memory it wants to keep.',
      closeAfterSelection: true,
      effects: [
        { kind: 'clearance_gate_tag', runtimeId: gateRuntimeId, tag: '#district_left_to_carry_it' },
        // THR-1206 — was `gate_duty.left_to_settle`, discarded for the same reason.
        // Declining to press is not a reach the tallies score; it is a quiet note
        // about how this god handles a district, which is what a hidden mark is for.
        {
          kind: 'hidden_mark',
          category: 'reputation_note',
          severity: 0.2,
          label: 'Left the district to carry it',
        },
        {
          kind: 'recent_event',
          eventType: 'ripple_consequence',
          message: 'You leave the gate to the living and let the district carry the taste of the evening without further divine pressure.',
          significance: 0.48,
        },
      ],
    },
  ];
}

function getStepOutcomeMetadata(
  step: UnifiedActionTemplate['steps'][number] | undefined,
  outcome: StepOutcome,
): ActionStepOutcomeMetadata | undefined {
  if (!step) return undefined;
  return isStepSuccess(outcome) ? step.successMetadata : step.failureMetadata;
}

function applyOutcomeReputationDelta(
  state: GameState,
  actorId: string,
  metadata: ActionStepOutcomeMetadata | undefined,
): number {
  const delta = metadata?.reputationDelta ?? 0;
  return applyReputationScoreDelta(state, actorId, delta);
}

/**
 * Reaction-id prefix stamped on the synthetic reaction that carries a step's
 * `successMetadata.effects` / `failureMetadata.effects` into the aftermath
 * dispatcher. Every effect trace records `reactionId`, so this prefix is what
 * distinguishes a step-outcome effect from an author-picked aftermath reaction
 * when reading a trace dump (NFP #2).
 */
const STEP_OUTCOME_EFFECTS_REACTION_PREFIX = 'step_outcome_effects';

/**
 * THR-783 — apply a step outcome's authored aftermath effects.
 *
 * The step-metadata effect list is dispatched through the *same*
 * {@link applyEncounterAftermathReaction} the reaction path uses, by wrapping it
 * in a synthetic single-use reaction. That is deliberate: it means the whole
 * effect vocabulary (conditions, marks, seeds, intel, bonds, reach signatures …)
 * is authorable per step for free, and no effect kind can be live on one path and
 * dead on the other — the failure mode this ticket exists to close.
 *
 * The dispatcher is state-returning while `executeStepResult` mutates `state` in
 * place, so the changed fields are copied back onto the caller's object. The
 * returned `nextState` is a shallow spread of `state`, so assigning its own
 * enumerable properties back writes exactly the fields the dispatcher replaced
 * and leaves every untouched field pointing at the identical reference.
 *
 * Fail-soft (NFP #4): no effects, no runtime, or a throw from any effect resolver
 * leaves `state` untouched and the step resolution continues. The tick loop must
 * never crash on content.
 */
function applyStepOutcomeEffects(
  state: GameState,
  action: UnifiedAction,
  metadata: ActionStepOutcomeMetadata | undefined,
  outcome: StepOutcome,
  tick: number,
  runtime: SimulationRuntime | undefined,
): { woundApplied: boolean } {
  const effects = metadata?.effects;
  if (!effects || effects.length === 0) return { woundApplied: false };

  if (!runtime) {
    // Production always threads a runtime; tests may not. Skipping loudly beats
    // throwing from the dispatcher's own runtime guard.
    emitTrace({
      tick,
      category: 'encounter_aftermath_effect',
      agentId: action.actorId,
      encounterId: action.templateId,
      actionId: action.actionId,
      reactionId: STEP_OUTCOME_EFFECTS_REACTION_PREFIX,
      effectIndex: 0,
      effectKind: 'step_outcome_effects',
      success: false,
      failReason: 'no_runtime',
      effectiveTargetId: action.actorId,
      effectiveTargetKind: 'actor_fallback',
      summary: `step_outcome_effects skipped: no runtime (${action.templateId} step ${action.currentStep} ${outcome})`,
    } as unknown as Parameters<typeof emitTrace>[0]);
    return { woundApplied: false };
  }

  const reaction: EncounterAftermathReaction = {
    id: `${STEP_OUTCOME_EFFECTS_REACTION_PREFIX}_${action.currentStep}_${outcome}`,
    label: 'Step outcome',
    effects,
  };

  try {
    const { state: next, mutationSummary } = applyEncounterAftermathReaction(
      state, action, reaction, tick, runtime,
    );
    Object.assign(state, next);
    // Same invalidation contract phaseAutonomousAftermath honours: the effect
    // resolvers mutate the graph in place, so nothing downstream re-reads it
    // without an explicit version bump (CLAUDE.md § Load-Bearing Decisions).
    // `condition_attachment` sets touchedStructure and does *not* touch itself.
    if (mutationSummary.touchedStructure) touchStructure(runtime);
    else if (mutationSummary.touchedWorld) touchWorld(runtime);
    emitTrace({
      tick,
      category: 'encounter_aftermath_effect',
      agentId: action.actorId,
      encounterId: action.templateId,
      actionId: action.actionId,
      reactionId: reaction.id,
      effectIndex: 0,
      effectKind: 'step_outcome_effects',
      effectDetail: {
        step: action.currentStep,
        outcome,
        effectKinds: effects.map(e => e.kind),
        woundApplied: mutationSummary.woundApplied,
      },
      success: true,
      effectiveTargetId: action.actorId,
      effectiveTargetKind: 'actor_fallback',
      summary: `step_outcome_effects: ${action.templateId} step ${action.currentStep} ${outcome} → ${effects.map(e => e.kind).join(', ')}`,
    } as unknown as Parameters<typeof emitTrace>[0]);
    return { woundApplied: mutationSummary.woundApplied };
  } catch (err) {
    emitTrace({
      tick,
      category: 'encounter_aftermath_effect',
      agentId: action.actorId,
      encounterId: action.templateId,
      actionId: action.actionId,
      reactionId: reaction.id,
      effectIndex: 0,
      effectKind: 'step_outcome_effects',
      success: false,
      failReason: err instanceof Error ? err.message : 'unknown_error',
      effectiveTargetId: action.actorId,
      effectiveTargetKind: 'actor_fallback',
      summary: `step_outcome_effects errored: ${err instanceof Error ? err.message : 'unknown'}`,
    } as unknown as Parameters<typeof emitTrace>[0]);
    return { woundApplied: false };
  }
}

function applyReputationScoreDelta(
  state: GameState,
  actorId: string,
  delta: number,
): number {
  if (delta === 0) return 0;

  const actorNode = state.graph.getNode(actorId);
  if (!actorNode) return 0;

  const current = (actorNode.properties?.reputationScore as number | undefined) ?? DEFAULT_REPUTATION;
  actorNode.properties.reputationScore = Math.max(0, Math.min(1, current + delta));
  return delta;
}

/**
 * Gate duty's per-step consequences, keyed by the **nudge card id** the god
 * played (THR-1123).
 *
 * This used to key on `EncounterChoiceMemory.interventionType` — the generic
 * supportive/coercive/withdrawn triple `generateInterventionChoices` produced
 * for every encounter that authored nothing. THR-1121 retired that producer,
 * and gate duty now authors its own hand, so the key is the card.
 *
 * Read off `action.activeNudges` rather than `choiceHistory`: the hand is
 * committed to the action's *current* step and this runs at that step's
 * resolution, which is exactly the window where `activeNudges` is the played
 * hand. `choiceHistory` still carries the same id for the stage adapter's
 * retrospective prose (see `recordUnifiedActionChoiceMemory` at commit), but
 * reading it here would add a second lookup path to one fact.
 */
type GateDutyCardId = string;

interface GateDutyBranchConsequence {
  successTags?: readonly string[];
  failureTags?: readonly string[];
  successDelta?: number;
  failureDelta?: number;
  successNarrative?: string;
  failureNarrative?: string;
  successState?: ClearanceGateState;
  failureState?: ClearanceGateState;
}

const GATE_DUTY_BRANCH_CONSEQUENCES: Record<number, Record<GateDutyCardId, GateDutyBranchConsequence>> = {
  0: {
    [GATE_DUTY_NUDGE_IDS[0].steady]: {
      successTags: ['#courier_steadied'],
      failureTags: ['#borrowed_calm_slipped'],
      successDelta: 0.01,
      failureDelta: -0.005,
      successNarrative: 'The courier keeps moving as though held together by borrowed calm.',
      failureNarrative: 'The borrowed calm slips, and the line notices how close the panic was to breaking loose.',
    },
    [GATE_DUTY_NUDGE_IDS[0].force]: {
      successTags: ['#captain_forced'],
      failureTags: ['#captain_shoved_too_hard'],
      successDelta: -0.005,
      failureDelta: -0.015,
      successNarrative: 'The captain acts quickly, but the line can taste the shove behind the order.',
      failureNarrative: 'The captain moves under pressure that no longer feels entirely her own.',
    },
    [GATE_DUTY_NUDGE_IDS[0].withhold]: {
      successTags: ['#witness_primed'],
      failureTags: ['#witness_claimed_scene'],
      successDelta: 0,
      failureDelta: -0.01,
      successNarrative: 'The witness begins shaping the tale before the watch can settle on its own version.',
      failureNarrative: 'You preserve your strength, but the story starts leaving the gate without your hand on it.',
    },
  },
  1: {
    [GATE_DUTY_NUDGE_IDS[1].steady]: {
      successTags: ['#measured_seizure'],
      failureTags: ['#discipline_turned_strange'],
      successDelta: 0.02,
      failureDelta: -0.01,
      successNarrative: 'The seizure lands as discipline rather than appetite.',
      failureNarrative: 'The restraint feels strange enough that the crowd mistrusts it anyway.',
    },
    [GATE_DUTY_NUDGE_IDS[1].force]: {
      successTags: ['#public_break'],
      failureTags: ['#courier_shattered_publicly'],
      successDelta: -0.02,
      failureDelta: -0.03,
      successNarrative: 'The watch gains a harsher legitimacy by stepping through the courier’s public breaking.',
      failureNarrative: 'The courier’s collapse stains the checkpoint more deeply than the cargo ever could.',
    },
    [GATE_DUTY_NUDGE_IDS[1].withhold]: {
      successTags: ['#crowd_authored'],
      failureTags: ['#checkpoint_story_escaped'],
      successDelta: -0.01,
      failureDelta: -0.02,
      successNarrative: 'The crowd now owns part of the scene the watch wanted to contain.',
      failureNarrative: 'The gatehouse loses the right to narrate itself before the seizure is even finished.',
      successState: 'compromised',
      failureState: 'compromised',
    },
  },
  2: {
    [GATE_DUTY_NUDGE_IDS[2].steady]: {
      successTags: ['#watch_trusted', '#mercy_remembered'],
      failureTags: ['#mercy_failed_to_land'],
      successDelta: 0.03,
      failureDelta: -0.01,
      successNarrative: 'The line leaves remembering restraint.',
      failureNarrative: 'Mercy arrives too late to keep the checkpoint from feeling wounded.',
    },
    [GATE_DUTY_NUDGE_IDS[2].force]: {
      successTags: ['#watch_feared', '#authority_consecrated'],
      failureTags: ['#authority_overreached'],
      successDelta: -0.03,
      failureDelta: -0.04,
      successNarrative: 'Order holds, but what remains of the evening tastes of dread.',
      failureNarrative: 'Authority wins the posture of command and loses the district’s confidence in the same breath.',
    },
    [GATE_DUTY_NUDGE_IDS[2].withhold]: {
      successTags: ['#witness_story_spreads', '#official_story_thins'],
      failureTags: ['#story_escaped_the_gate'],
      successDelta: -0.01,
      failureDelta: -0.02,
      successNarrative: 'The official account survives, but the witness carries the sharper story beyond the gate.',
      failureNarrative: 'You keep your distance, and the story slips beyond recall in mortal mouths.',
    },
  },
};

function applyGateDutyBranchConsequences(
  state: GameState,
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  outcome: StepOutcome,
): {
  clearanceGateStates: Map<string, ClearanceGateRuntimeState>;
  reputationDelta: number;
  suffix: string;
} {
  const nextStates = new Map(state.clearanceGateStates ?? []);
  if (template.id !== 'cg.quest.gate_duty') {
    return { clearanceGateStates: nextStates, reputationDelta: 0, suffix: '' };
  }

  if (!resolveStepDefinition(template, action.currentStep, action.choiceHistory)) {
    return { clearanceGateStates: nextStates, reputationDelta: 0, suffix: '' };
  }

  const stepConsequences = GATE_DUTY_BRANCH_CONSEQUENCES[action.currentStep];
  if (!stepConsequences) {
    return { clearanceGateStates: nextStates, reputationDelta: 0, suffix: '' };
  }

  // The god may commit several cards; gate duty's consequence table names one
  // per step, so the first *committed* card that the table knows about is the
  // branch. Playing no card at all — fate alone, or a disregarded encounter —
  // is a real state, not a missing one: the step resolves with no branch
  // consequence, exactly as an unchosen stance did before THR-1123.
  const playedCardId = (action.activeNudges ?? []).find(id => id in stepConsequences);
  if (!playedCardId) {
    return { clearanceGateStates: nextStates, reputationDelta: 0, suffix: '' };
  }

  const branchConfig = stepConsequences[playedCardId];
  if (!branchConfig) {
    return { clearanceGateStates: nextStates, reputationDelta: 0, suffix: '' };
  }

  const success = isStepSuccess(outcome);
  const delta = success ? (branchConfig.successDelta ?? 0) : (branchConfig.failureDelta ?? 0);
  const appliedDelta = applyReputationScoreDelta(state, action.actorId, delta);
  const tags = success ? (branchConfig.successTags ?? []) : (branchConfig.failureTags ?? []);
  const nextState = success ? branchConfig.successState : branchConfig.failureState;

  if ((tags.length > 0 || nextState) && action.clearanceGateIds?.length) {
    for (const runtimeId of action.clearanceGateIds) {
      const current = nextStates.get(runtimeId);
      if (!current) continue;
      nextStates.set(runtimeId, {
        ...current,
        state: nextState ?? current.state,
        followOnTags: [...new Set([...current.followOnTags, ...tags])],
      });
    }
  }

  const narrative = success ? branchConfig.successNarrative : branchConfig.failureNarrative;
  return {
    clearanceGateStates: nextStates,
    reputationDelta: appliedDelta,
    suffix: narrative ? ` — ${narrative}` : '',
  };
}

function resolveUnifiedTemplate(
  templates: readonly UnifiedActionTemplate[],
  templateId: string,
): UnifiedActionTemplate | undefined {
  return templates.find((template) => template.id === templateId)
    ?? getUnifiedTemplateById(templateId);
}

function summarizeMetadataConsequences(
  metadata: ActionStepOutcomeMetadata | undefined,
  success: boolean,
  rewardName?: string,
): string {
  const parts: string[] = [];
  if (metadata?.reputationDelta && metadata.reputationDelta !== 0) {
    parts.push(metadata.reputationDelta > 0 ? 'gained reputation' : 'lost reputation');
  }
  if (rewardName) {
    parts.push(success ? `earned ${rewardName}` : `suffered ${rewardName}`);
  } else if (metadata?.rewardPool) {
    parts.push(success ? 'earned a reward' : 'lost equipment');
  }
  if (success && metadata?.tierPromotionEligible) {
    parts.push('eligible for promotion');
  }
  return parts.length > 0 ? ` — ${parts.join(', ')}` : '';
}

function mapStepOutcomeToRewardOutcome(outcome: StepOutcome): OutcomeType {
  switch (outcome) {
    case 'critical_success':
      return 'critical_success';
    case 'critical_failure':
      return 'critical_failure';
    case 'failure':
      return 'failure';
    case 'success':
    case 'success_at_cost':
    case 'near_miss':
      return 'success';
  }
}

/**
 * A resolved reward: what to call it, and the graph node it became.
 *
 * THR-1004 widened this from a bare display name. The instantiated node id is
 * what lets the aftermath chip honour the UI Law — the item's own art and a
 * link to its page, rather than a name-hashed fallback tile and no link.
 */
interface ResolvedUnifiedReward {
  readonly displayName: string;
  /** Instantiated reward node id — the entity the prize chip pictures and links. */
  readonly instanceId: string;
}

function resolveUnifiedReward(
  action: UnifiedAction,
  outcome: StepOutcome,
  metadata: ActionStepOutcomeMetadata | undefined,
  state: GameState,
  tick: number,
  runtime?: SimulationRuntime,
): ResolvedUnifiedReward | undefined {
  if (!metadata?.rewardPool) return undefined;

  // THR-1146 moved the draw itself into `drawSeededReward`, which the
  // `reward_draw` aftermath effect also calls. Same seed key, same roll order,
  // same pool assembly — one implementation, so the two routes cannot drift.
  const draw = drawSeededReward(state.graph, {
    recipe: metadata.rewardPool,
    outcomeType: mapStepOutcomeToRewardOutcome(outcome),
    seed: state.seed,
    tick,
    actorId: action.actorId,
    templateId: action.templateId,
    // THR-1241: the recipient's `reward_tier_bonus` reads here.
    overrideCtx: { graph: state.graph, effectStates: state.effectStates, persisted: state, tick },
  });
  const { isBadOutcome } = draw;
  const actorName = state.graph.getNode(action.actorId)?.name ?? '?';

  if (draw.poolSize === 0) {
    recordReward({
      tick,
      agentId: action.actorId,
      agentName: actorName,
      encounterId: action.templateId,
      templateId: null,
      templateName: null,
      instanceId: null,
      category: null,
      tier: null,
      isBadOutcome,
      poolSize: 0,
      roll: null,
    });

    if (runtime) {
      recordBalanceEvent(runtime, {
        tick,
        kind: 'reward_granted',
        agentId: action.actorId,
        sourceSystem: 'unified_action',
        encounterId: action.templateId,
        rewardTemplateId: null,
        isBadOutcome,
        rewardPoolSize: 0,
      });
    }
    return undefined;
  }

  const { drawnTemplateId: templateId, instantiation, tier, drawRoll } = draw;
  if (!templateId || !instantiation) return undefined;

  recordReward({
    tick,
    agentId: action.actorId,
    agentName: actorName,
    encounterId: action.templateId,
    templateId,
    templateName: draw.templateName ?? '?',
    instanceId: instantiation.instanceId,
    category: instantiation.category,
    tier,
    isBadOutcome,
    poolSize: draw.poolSize,
    roll: drawRoll,
  });

  if (runtime) {
    recordBalanceEvent(runtime, {
      tick,
      kind: 'reward_granted',
      agentId: action.actorId,
      sourceSystem: 'unified_action',
      encounterId: action.templateId,
      rewardTemplateId: templateId,
      rewardCategory: instantiation.category,
      // Always set alongside a non-null instantiation; `?? undefined` narrows
      // the shared helper's `number | null` without inventing a tier.
      rewardTier: tier ?? undefined,
      isBadOutcome,
      rewardPoolSize: draw.poolSize,
    });
  }

  return { displayName: instantiation.displayName, instanceId: instantiation.instanceId };
}

/**
 * Execute the resolution result for a completed step:
 * 1. Execute the step's GraphOps
 * 2. Advance the action to the next step or mark resolved
 * 3. Generate tick events and traces
 *
 * Returns the updated action and any events generated.
 */
/**
 * THR-401: apply tick-bounded countdown properties and emit the
 * location_action_resolved trace for the six new location-action templates.
 * GraphOps cannot reference currentTick at template-author time, so these
 * effects run after the static GraphOps batch in executeStepResult.
 */
function applyLocationActionPostEffects(
  state: GameState,
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  tick: number,
): void {
  const target = state.graph.getNode(action.targetId);
  if (!target || target.type !== 'location') return;

  const effects: string[] = [];
  switch (template.id) {
    case 'loc.bless_harvest':
      target.properties.migrationPullUntilTick = tick + LOC_BLESS_HARVEST_DURATION_TICKS;
      effects.push(`migrationPullUntilTick=${target.properties.migrationPullUntilTick}`);
      break;
    case 'loc.sicken_wells':
      target.properties.wellsSickenedUntilTick = tick + LOC_SICKEN_WELLS_DURATION_TICKS;
      effects.push(`wellsSickenedUntilTick=${target.properties.wellsSickenedUntilTick}`);
      break;
    case 'loc.curse_roads':
      target.properties.routesCursedUntilTick = tick + LOC_CURSE_ROADS_DURATION_TICKS;
      effects.push(`routesCursedUntilTick=${target.properties.routesCursedUntilTick}`);
      break;
    case 'loc.awaken_spirit':
      target.properties.placeSpiritAwakenedAtTick = tick;
      effects.push(`placeSpiritAwakenedAtTick=${tick}`);
      break;
    default:
      // Other location actions need no tick-bounded post-effect — only
      // static GraphOps in the template's onSuccess apply.
      break;
  }

  emitTrace({
    category: 'location_action_resolved',
    tick,
    agentId: action.actorId,
    summary: `${template.name} → ${target.name}: ${effects.join(', ') || 'static effects only'}`,
    templateId: template.id,
    locationId: target.id,
    locationName: target.name,
    actorId: action.actorId,
    success: true,
    effectsApplied: effects,
  } as any);
}

export function executeStepResult(
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  outcome: StepOutcome,
  ops: readonly GraphOp[],
  state: GameState,
  rng: () => number,
  tick: number,
  resolutionStats?: { capability: number; probability: number; roll: number },
  runtime?: SimulationRuntime,
): { updatedAction: UnifiedAction; events: TickEvent[] } {
  const events: TickEvent[] = [];
  const beforeSnapshot = snapshotEncounterResolutionContext(state, action);
  const clearanceGateResult = applyClearanceGateStepOutcome(
    state.clearanceGateStates,
    action,
    template,
    outcome,
    tick,
  );
  state.clearanceGateStates = clearanceGateResult.clearanceGateStates;
  let clearanceSuffix = summarizeClearanceGateUpdates(clearanceGateResult.updates);

  // Flip table step_outcome triggers (THR-53)
  if (template.flipTables && template.flipTables.length > 0) {
    for (const config of template.flipTables) {
      if (config.flipTrigger.kind !== 'step_outcome') continue;
      if (!matchesStepOutcomeTrigger(config.flipTrigger, action.currentStep, outcome)) continue;
      const runtimeId = `flip_table_${template.id}_${config.id}_${action.actorId}`;
      const flipResult = applyFlipTableTriggerWithConfig(
        state.flipTableStates,
        runtimeId,
        config,
        state.seed,
        tick,
      );
      state.flipTableStates = flipResult.flipTableStates;
      if (flipResult.transition) {
        const { previousState, nextState, variantKey } = flipResult.transition;
        emitTrace({
          category: 'effect_shell',
          subkind: 'flip_revealed',
          tick,
          actorId: action.actorId,
          runtimeId,
          templateId: action.templateId,
          flipId: config.id,
          variantKey,
          previousState,
          nextState,
          summary: `flip_table ${config.id}: ${previousState} → ${nextState} (variant: ${variantKey})`,
        } as import('../types/trace').EffectShellFlipRevealedTrace);
      }
    }
  }

  // Execute GraphOps (fail-soft)
  if (ops.length > 0) {
    // THR-400 — intercept `faction_verb` ops before the graph executor sees
    // them. Faction governance verbs need full GameState (not just graph) to
    // mutate `pendingEncounterSeeds` and read `ascendantId`. Dispatch them
    // here, then forward the remainder to executeGraphOps as usual.
    // THR-430 — same dispatch pattern for `plant_schism`: needs state.tick and
    // the live runtime for touchWorld/touchStructure invalidation.
    const factionVerbOps: GraphOp[] = [];
    const plantSchismOps: GraphOp[] = [];
    const anointSuccessorOps: GraphOp[] = [];
    const imbueItemOps: GraphOp[] = [];
    const bestowPowerOps: GraphOp[] = [];
    // THR-1096: companions are minted through the engine module (name generation,
    // single-bearer invariant, trace) rather than by the generic node executor,
    // which has no way to do any of those.
    const grantCompanionOps: GraphOp[] = [];
    const anointFactionOps: GraphOp[] = [];
    const plantTrapOps: GraphOp[] = [];
    // THR-724: `reveal_secret` needs full GameState (chronicle events + tick), not just
    // the graph, so it routes here instead of through executeGraphOps — which flipped
    // the edge's `revealed` flag and applied no social consequence at all.
    const revealSecretOps: GraphOp[] = [];
    // THR-773: `quintessence_restore` routes here for the same reason — the
    // restore must leave the mortal a `recent_event` receipt naming the god who
    // mended them, and the graph executor has no GameState to append it to.
    const quintessenceRestoreOps: GraphOp[] = [];
    // THR-661: `curse_artifact` is the one op that routes BOTH ways. The graph
    // executor still binds the concealed quintessence drain into the artifact
    // (THR-605 Slice 2, unchanged) — so the op is forwarded to graphOnlyOps as
    // well — while this intercept adds the half the executor cannot reach: a
    // hidden mark on the bearer, which lives on GameState, not the graph.
    const curseArtifactOps: GraphOp[] = [];
    const graphOnlyOps: GraphOp[] = [];
    for (const op of ops) {
      if (op.op === 'reveal_secret') revealSecretOps.push(op);
      else if (op.op === 'faction_verb') factionVerbOps.push(op);
      else if (op.op === 'plant_schism') plantSchismOps.push(op);
      else if (op.op === 'anoint_successor') anointSuccessorOps.push(op);
      else if (op.op === 'imbue_item') imbueItemOps.push(op);
      else if (op.op === 'bestow_power') bestowPowerOps.push(op);
      else if (op.op === 'grant_companion') grantCompanionOps.push(op);
      else if (op.op === 'anoint_faction') anointFactionOps.push(op);
      else if (op.op === 'plant_trap') plantTrapOps.push(op);
      else if (op.op === 'quintessence_restore') quintessenceRestoreOps.push(op);
      else if (op.op === 'curse_artifact') {
        curseArtifactOps.push(op);
        graphOnlyOps.push(op); // drain stays on the executor path
      } else graphOnlyOps.push(op);
    }

    if (quintessenceRestoreOps.length > 0) {
      // THR-773 — Rekindle the Thread. Raises the target mortal back to
      // REKINDLE_RESTORE_TO_RATIO, clears the broken stamp so the predicate
      // releases immediately, and appends the receipt. The acting ascendant is
      // action.actorId; the mortal is action.targetId unless the op names one.
      for (const op of quintessenceRestoreOps) {
        const ref = op.nodeId ?? op.target ?? '$target';
        const resolvedTargetId = ref === '$target' ? action.targetId
          : ref === '$actor' ? action.actorId
            : ref;
        try {
          applyQuintessenceRestore(state, action.actorId, resolvedTargetId, tick, runtime);
        } catch {
          // Fail-soft per NFP #4: never crash the tick.
        }
      }
    }

    if (factionVerbOps.length > 0) {
      const factionId = action.targetId;
      for (const op of factionVerbOps) {
        const kind = op.factionVerbKind as
          | 'stir_dissent' | 'whisper_leader' | 'recover_doctrine' | 'surface_doubter'
          | 'kindle_a_calling'
          | undefined;
        if (!kind) continue;
        try {
          applyFactionGovernanceVerb(state, kind, factionId, {
            preferredPole: op.factionVerbPreferredPole as
              | 'protector' | 'conqueror' | 'sworn' | 'renegade' | undefined,
          });
        } catch {
          // Fail-soft per NFP #4: log nothing, never crash the tick.
        }
      }
    }

    if (plantSchismOps.length > 0) {
      const factionId = action.targetId;
      for (const op of plantSchismOps) {
        const delay = typeof op.schismResolutionDelay === 'number'
          ? op.schismResolutionDelay
          : SCHISM_PENDING_DURATION_TICKS;
        try {
          applyPlantSchism(state, runtime, factionId, action.actorId, delay, tick);
        } catch {
          // Fail-soft per NFP #4: log nothing, never crash the tick.
        }
      }
    }

    if (anointSuccessorOps.length > 0) {
      // THR-432 — Anoint Successor targets an agent; the helper resolves the
      // agent's faction from their `member_of` edges. Needs full GameState
      // (for state.tick stamping and ascendantId attribution).
      const targetAgentId = action.targetId;
      for (let i = 0; i < anointSuccessorOps.length; i++) {
        try {
          applyAnointSuccessor(state, targetAgentId, state.ascendantId);
        } catch {
          // Fail-soft per NFP #4: log nothing, never crash the tick.
        }
      }
    }

    if (imbueItemOps.length > 0) {
      // THR-508 — Imbue targets an artifact; the helper reads the ascendant's
      // primary sphere, picks a sphere-flavored effect (seeded PRNG), and
      // appends it to the artifact's `effects`. The acting ascendant is the
      // player-god (action.actorId). A locally-derived seeded PRNG keeps the
      // pick deterministic without disturbing the resolution rng stream.
      const imbueRng = mulberry32(
        state.seed + tick * 53 + hashString(action.actorId) + hashString(action.targetId),
      );
      for (const op of imbueItemOps) {
        const artifactId = op.nodeId ? op.nodeId : action.targetId;
        const resolvedArtifactId = artifactId === '$target' ? action.targetId : artifactId;
        try {
          applyImbueItem(state.graph, action.actorId, resolvedArtifactId, imbueRng, tick);
        } catch {
          // Fail-soft per NFP #4: log nothing, never crash the tick.
        }
      }
    }

    if (bestowPowerOps.length > 0) {
      // THR-512 — Bestow targets a threaded agent; the helper gates on the
      // thread's awareness, reads the ascendant's primary reach, and mints a
      // "divine gift" artifact (reach bonus + per-tick quintessence regen) the
      // agent possesses. Deterministic — no PRNG. The acting ascendant is the
      // player-god (action.actorId).
      for (const op of bestowPowerOps) {
        const agentRef = op.nodeId ? op.nodeId : action.targetId;
        const resolvedAgentId = agentRef === '$target' ? action.targetId : agentRef;
        try {
          applyBestowPower(state.graph, action.actorId, resolvedAgentId, tick);
        } catch {
          // Fail-soft per NFP #4: log nothing, never crash the tick.
        }
      }
    }

    if (grantCompanionOps.length > 0) {
      // THR-1096 — the hire-mercenaries migration and any later action that
      // brings a person along. The bearer is the acting agent unless the op
      // names a target. Seeded from the action id + tick so a replay of the same
      // seed hires the same captain.
      for (const op of grantCompanionOps) {
        const bearerRef = op.nodeId ?? op.target ?? '$actor';
        const resolvedBearerId = bearerRef === '$actor' ? action.actorId
          : bearerRef === '$target' ? action.targetId
            : bearerRef;
        const templateId = op.companionTemplateId;
        if (!templateId || !resolvedBearerId) continue;
        try {
          mintCompanion(
            state.graph,
            templateId,
            resolvedBearerId,
            tick,
            mulberry32((state.seed + tick * 977 + hashString(action.actionId)) >>> 0),
            { source: action.templateId, respectCap: false },
          );
        } catch {
          // Fail-soft per NFP #4: never crash the tick over a companion.
        }
      }
    }

    if (anointFactionOps.length > 0) {
      // THR-513 — Anoint targets a faction node; the helper reads the
      // ascendant's primary reach (two-domain lock) and stamps a `chosen` status
      // carrying a domain-keyed power (THR-509 primitive). The per-tick consumer
      // phaseChosenFactionPowers then grants that faction's members reputation —
      // so the chosen status is no longer dead content. Deterministic — no PRNG.
      // The acting ascendant is the player-god (action.actorId).
      for (const op of anointFactionOps) {
        const factionRef = op.nodeId ? op.nodeId : action.targetId;
        const resolvedFactionId = factionRef === '$target' ? action.targetId : factionRef;
        try {
          applyAnointFaction(state.graph, action.actorId, resolvedFactionId, tick);
        } catch {
          // Fail-soft per NFP #4: log nothing, never crash the tick.
        }
      }
    }

    if (plantTrapOps.length > 0) {
      // THR-605 Slice 4 — Plant Trap targets a sublocation; the helper resolves
      // the intended victim currently present there (or on its hex) and plants a
      // PendingEncounterSeed that spawns the authored trap beat against them.
      // Needs full GameState to mutate `pendingEncounterSeeds`, so it lives here
      // in the resolution-intercept path (not the graph-executor case like the
      // other THR-605 slices). The acting ascendant is the player-god
      // (action.actorId); the target sublocation is action.targetId.
      for (const op of plantTrapOps) {
        const subRef = op.nodeId ? op.nodeId : action.targetId;
        const resolvedSublocationId = subRef === '$target' ? action.targetId : subRef;
        try {
          applyPlantTrap(state, action.actorId, resolvedSublocationId, tick);
        } catch {
          // Fail-soft per NFP #4: log nothing, never crash the tick.
        }
      }
    }

    if (curseArtifactOps.length > 0) {
      // THR-661 — the deferred half of THR-605 Slice 2. The executor binds the
      // drain to the object; this leaves the matching residue on whoever is
      // carrying it, so an investigation/veil draw can surface the curse later.
      // Fail-soft: an unpossessed artifact marks nobody and the curse still lands.
      for (const op of curseArtifactOps) {
        const artifactRef = op.nodeId ?? op.target ?? '$target';
        const resolvedArtifactId = artifactRef === '$target' ? action.targetId
          : artifactRef === '$actor' ? action.actorId
            : artifactRef;
        try {
          applyCurseMark(state, action.actorId, resolvedArtifactId, tick);
        } catch {
          // Fail-soft per NFP #4: log nothing, never crash the tick.
        }
      }
    }

    if (revealSecretOps.length > 0) {
      // THR-724 — Divine Whisper. `revealBestSecret` picks the same edge the graph op
      // did (heaviest unrevealed secret about the target) and then applies the fallout
      // the op never had access to: trust and sentiment deltas plus a chronicle line.
      // The patch's event arrays are copies of state's, so the delta is spliced back in
      // place rather than reassigned — this intercept mutates like `applyPlantTrap`.
      for (const _op of revealSecretOps) {
        try {
          const patch = revealBestSecret(state, action.actorId, action.targetId);
          if (patch.tickEvents) {
            state.tickEvents.push(...patch.tickEvents.slice(state.tickEvents.length));
          }
          if (patch.recentEvents) {
            const added = patch.recentEvents.filter(e => !state.recentEvents.includes(e));
            state.recentEvents.push(...added);
          }
        } catch {
          // Fail-soft per NFP #4: a reveal with no secret behind it is a no-op.
        }
      }
    }

    if (graphOnlyOps.length > 0) {
      const ctx = {
        actorId: action.actorId,
        targetId: action.targetId,
        locationId: action.targetId, // default — caller can override
        tick,
      };

      try {
        executeGraphOps(state.graph, graphOnlyOps, ctx);
      } catch {
        // Fail-soft: log but don't crash
      }
    }
  }

  // Location action post-effects (THR-401) — apply tick-bounded countdowns
  // and emit the location_action_resolved trace. Static deltas are handled
  // by the template's GraphOps above; only properties that depend on
  // currentTick are set here.
  if (LOCATION_ACTION_POST_EFFECT_TEMPLATE_IDS.has(template.id) && isStepSuccess(outcome)) {
    applyLocationActionPostEffects(state, action, template, tick);
  }

  // Phase 3: Assemble ComplicationContext for failure-tier outcome enrichment (THR-20)
  const locationId = getAgentLocationId(state.graph, action.actorId) ?? null;
  const locationNode = locationId ? state.graph.getNode(locationId) : undefined;
  const locationSubtype = (locationNode?.properties?.locationSubtype
    ?? locationNode?.properties?.locationType) as string | undefined;
  const atSettlement = !!(locationSubtype &&
    ['hamlet', 'town', 'city', 'capital'].includes(locationSubtype));
  const presentAgentIds = locationId
    ? getAgentsAtLocation(state.graph, locationId)
        .map(n => n.id)
        .filter(id => id !== action.actorId)
    : [];
  const factionIds = getFactionMembershipEdges(state.graph, action.actorId)
    .map(e => e.target);
  const activeOmenCategory = state.omenState?.primary?.category ?? null;
  const doomStage = state.doomClock?.currentStage ?? 0;
  const existingAttachments = (
    state.graph.getNode(action.actorId)?.properties?.activeAttachmentIds as string[] | undefined
  ) ?? [];
  const locationUnrest = typeof locationNode?.properties?.unrest === 'number'
    ? locationNode.properties.unrest : 0;

  const complicationContext: ComplicationContext = {
    action,
    template,
    stepIndex: action.currentStep,
    locationId,
    atSettlement,
    presentAgentIds,
    factionIds,
    activeOmenCategory,
    doomStage,
    existingAttachments,
    locationUnrest,
    rng,
    graph: state.graph,
    doomIdentityComplicationBias: state.doomIdentityMatrix?.complicationBias,
    // THR-571 E2: scale-appropriate consequence tier for critical_failure.
    critFailureSeverity: resolveCritFailureSeverity(template.scale),
  };

  // Phase 3: Compute differentiated consequences (all templates for failure tiers; THR-20)
  // Phase 6: Gate removed for success tiers — all templates receive band-differentiated consequences
  const consequence = computeOutcomeConsequence(
    action.templateId, outcome, action.actorId, tick, complicationContext,
  );

  // Phase 6: Emit consequence_applied trace (NFP #2 inspectability)
  emitTrace({
    category: 'consequence_applied',
    summary: `consequence:${outcome} t=${tick} actor=${action.actorId}`,
    tick,
    actorId: action.actorId,
    templateId: action.templateId,
    band: outcome,
    qDelta: consequence.quintessenceEvent?.delta ?? 0,
    growthMultiplier: consequence.growthMultiplier,
    progressCounterDelta: consequence.progressCounterDelta,
    dropIntent: consequence.attachmentDropIntent
      ? { tierHint: consequence.attachmentDropIntent.tierHint, weight: consequence.attachmentDropIntent.weight }
      : null,
    complicationId: consequence.complication?.templateId ?? null,
  });

  // Phase 3: Queue quintessence effect from outcome consequence
  if (consequence.quintessenceEvent && state.pendingQuintessenceEvents) {
    state.pendingQuintessenceEvents.push(consequence.quintessenceEvent);
  }

  // Phase 3: Apply complication effects and generate complication tick event (THR-20)
  if (consequence.complication) {
    const complicationEvents = applyComplicationEffects(
      consequence.complication.effects,
      complicationContext,
      state,
      tick,
      consequence.complication.name,
    );
    events.push(...complicationEvents);

    // Emit a 'complication' tick event for narrative visibility
    const severity = consequence.complication.severity;
    const complicationNotification: import('../types/notification').NotificationDirective | undefined =
      severity === 'severe'
        ? { channel: 'alert', icon: 'discovery' }
        : severity === 'standard'
          ? { channel: 'toast' }
          : undefined; // minor complications: no toast
    events.push({
      id: `complication_${tick}_${action.actionId}`,
      tick,
      type: 'complication',
      message: `⊘ ${consequence.complication.name} — ${consequence.complication.prose}`,
      significance: 0.3 + consequence.complication.significanceBoost,
      actorId: action.actorId,
      sphere: undefined,
      notification: complicationNotification,
    });
  }

  // Apply capability growth from step resolution
  //
  // THR-1247 — composed for the same reason the resolution site above is, and
  // for one more: this `step` is what `applyAgentDecidedBranches` reads
  // `nudges` off to weigh the hand's pole lean. No shipped play profile carries
  // a `poleLean` yet, so today this changes nothing — but the two derivations
  // of the same step must not be allowed to disagree about what was in the
  // hand, which is precisely the kind of drift that only surfaces once the
  // corpus lands (THR-1248) and then reads as a branch bug.
  const step = composeDealtStepFromState(
    resolveStepDefinition(template, action.currentStep, action.choiceHistory),
    state,
  ).step;
  const stepMetadata = getStepOutcomeMetadata(step, outcome);
  const metadataReputationDelta = applyOutcomeReputationDelta(state, action.actorId, stepMetadata);
  // THR-783: authored step-outcome effects (conditions, marks, seeds …). No-ops for
  // every template that declares none; the helper owns its own tracing and cache
  // invalidation, so the result is intentionally unbound here.
  applyStepOutcomeEffects(state, action, stepMetadata, outcome, tick, runtime);
  const branchConsequence = applyGateDutyBranchConsequences(
    state,
    action,
    template,
    outcome,
  );
  state.clearanceGateStates = branchConsequence.clearanceGateStates;
  clearanceSuffix += branchConsequence.suffix;
  let promotionTraitGranted: string | undefined;
  let growthApplied = 0;
  let growthDomain: string | undefined;
  let growthTierFrom: number | undefined;
  let growthTierTo: number | undefined;
  if (step) {
    // Unified action difficulty is 0-1; scale to 0-100 for growth computation
    const difficultyScaled = step.difficulty * 100;
    const isSuccess = isStepSuccess(outcome);
    const tierPromotionEligible = Boolean(isSuccess && stepMetadata?.tierPromotionEligible);
    const growthResult = applyEncounterGrowth(
      state.graph,
      action.actorId,
      step.reach,
      difficultyScaled,
      isSuccess,
      tierPromotionEligible,
      consequence.growthMultiplier, // Phase 3: outcome-differentiated growth (1.5 crit, 0.5 at-cost)
      // THR-1241: `tier_advancement_cost_multiplier` reads here.
      { graph: state.graph, effectStates: state.effectStates, persisted: state, tick },
    );
    growthApplied = growthResult.growthApplied;
    growthDomain = growthResult.domain;
    growthTierFrom = growthResult.previousTier;
    growthTierTo = growthResult.newTier;

    // Handle tier promotion if crossed
    if (growthResult.tierCrossed) {
      const promotion = handleTierPromotion(
        state.graph,
        action.actorId,
        step.reach,
        growthResult.newTier,
      );

      const actorNode = state.graph.getNode(action.actorId);
      const agentName = actorNode?.name ?? 'An agent';
      if (promotion.traitGranted) {
        promotionTraitGranted = promotion.traitGranted;
        events.push({
          // Tick embedded (THR-853): the action id alone is not unique here — a
          // multi-step action resolves one step per tick and can cross a tier on
          // more than one of them, so `ua_12_promotion` was minted on ticks 26
          // and 28 of a seed-42 run. Only one step of an action resolves per
          // tick, so the tick is a sufficient discriminator.
          id: `ua_${action.actionId}_promotion_${tick}`,
          tick,
          type: 'tier_promotion',
          message: `${agentName} reached ${step.reach} tier ${growthResult.newTier}: "${promotion.traitGranted}"`,
          significance: 0.8,
          actorId: action.actorId,
        });
      }

      // Balance telemetry: growth_applied
      if (runtime) {
        recordBalanceEvent(runtime, {
          tick,
          kind: 'growth_applied',
          agentId: action.actorId,
          sourceSystem: 'unified_action',
          templateId: action.templateId,
          reach: step.reach,
          growthReach: step.reach,
          growthDelta: growthResult.growthApplied,
          newTier: growthResult.newTier,
        });
      }
    }
  }

  // THR-894: agent-decided branches. Any `decidedBy` fork keying off the step
  // that just resolved is decided here — the last moment a choice can land and
  // still be visible when `advanceStep` resolves the next step's definition.
  // No-op for every template with no such branch, which is every template
  // shipped today.
  const branchDecision = applyAgentDecidedBranches(state, action, template, step, tick, rng);
  state.archetypeDrift = branchDecision.archetypeDrift;
  const decidedAction = branchDecision.action;

  // Advance step or complete action. THR-1100: the next step's duration ramps
  // off the target's tier under the same marker that scaled `effectiveDifficulty`
  // above, so a multi-step tier-scaled template stays scaled past step 0.
  let finalAction = advanceStep(
    decidedAction, outcome, template, rng,
    state.graph.getNode(action.targetId)?.properties,
  );

  // Partial_progress complication: give the next step a head start (THR-119).
  // Read fraction directly from the ComplicationResult effects — no transient node property needed.
  if (!finalAction.resolved && consequence.complication) {
    const ppEffect = consequence.complication.effects.find(
      (e): e is { type: 'partial_progress'; fraction: number } => e.type === 'partial_progress',
    );
    if (ppEffect) {
      const fraction = Math.min(1, Math.max(0, ppEffect.fraction));
      // Never allow the head start to complete the step immediately (cap at duration - 1).
      const headStart = Math.min(
        Math.floor(fraction * finalAction.stepDuration),
        Math.max(0, finalAction.stepDuration - 1),
      );
      if (headStart > 0) {
        finalAction = { ...finalAction, stepProgress: headStart };
        emitTrace({
          tick,
          category: 'complication_partial_progress',
          agentId: action.actorId,
          templateId: action.templateId,
          stepIndex: action.currentStep,
          fraction,
          headStart,
          stepDuration: finalAction.stepDuration,
          summary: `partial_progress: next step gets ${headStart}/${finalAction.stepDuration} ticks head start`,
        } as any);
      }
    }
  }

  // Accumulate per-step complication result (THR-20)
  if (consequence.complication !== undefined) {
    const prevComplications = action.stepComplications ?? [];
    finalAction = {
      ...finalAction,
      stepComplications: [...prevComplications, consequence.complication],
    };
  }

  // THR-636: freeze the enriched prose the player saw for this just-resolved
  // step so the encounter step-navigator can replay it exactly. Placeholders
  // ({ally}, {artifact}) resolve against live world state, so re-rendering later
  // could show a *different* past — capture-at-resolution is the design. The
  // seeded resolution `rng` is threaded into enrichProse (NEVER Math.random) so
  // the same seed + same tick stores the same record (NFP #3). Fail-soft: any
  // throw stores the raw template prose and never crashes the tick loop.
  if (step) {
    const resolvedStepIndex = action.currentStep;
    let narrativeProse = step.narrativeTemplate ?? '';
    let afterimageProse: string | undefined;
    try {
      const proseCtx = gatherNarrativeContext(
        state.graph,
        action.actorId,
        undefined,
        undefined,
        state.doomIdentityMatrix,
        state,
        tick,
        {
          targetId: action.targetId, // THR-694 — name the scene's other party in prose
          // THR-696 — name the scene's cast in the frozen step prose, so the replayed
          // record shows the same people the player was shown at resolution time.
          supportBundle: template.supportBundle,
          supportBindings: action.supportBindings,
          // THR-573 — the template's context fragments, so `{frag:*}` in this step's
          // prose binds to the scene's place/counterpart axes at render time.
          contextFragments: template.contextFragments,
          contextFragmentTemplateId: template.id,
        },
      );
      narrativeProse = enrichProse(step.narrativeTemplate ?? '', proseCtx, { runtime, rng }) || narrativeProse;
      const rawAfterimage = isStepSuccess(outcome) ? step.successAfterimage : step.failureAfterimage;
      if (rawAfterimage) {
        const stepCtx = { ...proseCtx, outcomeBand: stepOutcomeToOutcomeBand(outcome) };
        afterimageProse = enrichProse(rawAfterimage, stepCtx, { runtime, rng });
      }
    } catch {
      // narrativeProse already holds the raw template; a malformed step never sinks the tick.
    }
    const choiceMemory = action.choiceHistory?.find(c => c.stepIndex === resolvedStepIndex);
    const record: StepProseRecord = {
      index: resolvedStepIndex,
      label: step.narrativeTemplate
        ? `Step ${resolvedStepIndex + 1}: ${step.reach}`
        : `Step ${resolvedStepIndex + 1}`,
      narrativeProse,
      afterimageProse,
      outcome,
      reach: step.reach,
      choiceId: choiceMemory?.choiceId,
      choiceText: choiceMemory?.choiceText,
      complicationProse: consequence.complication?.prose,
      tick,
    };
    const priorRecords = (finalAction.stepProseHistory ?? []) as readonly StepProseRecord[];
    const mergedRecords = [...priorRecords, record];
    const cappedRecords =
      mergedRecords.length > STEP_PROSE_HISTORY_MAX
        ? mergedRecords.slice(mergedRecords.length - STEP_PROSE_HISTORY_MAX)
        : mergedRecords;
    finalAction = { ...finalAction, stepProseHistory: cappedRecords };
    emitTrace({
      category: 'encounter_step_prose_recorded',
      tick,
      actionId: action.actionId,
      actorId: action.actorId,
      stepIndex: resolvedStepIndex,
      outcomeBand: stepOutcomeToOutcomeBand(outcome),
      reach: step.reach,
      proseLength: narrativeProse.length,
      summary: `step_prose_recorded: ${template.name} step ${resolvedStepIndex + 1} ${outcome}`,
    } as any);
  }

  const resolvedReward = finalAction.resolved
    ? resolveUnifiedReward(action, outcome, stepMetadata, state, tick, runtime)
    : undefined;
  const rewardName = resolvedReward?.displayName;

  // Phase 5: migrated encounter templates should carry forward the real
  // faction reputation and reputation-tally progression they already had in
  // the legacy runtime. Non-encounter unified actions naturally no-op here.
  if (isStepSuccess(outcome)) {
    const encounterCompleted = finalAction.resolved && isActionSuccess(finalAction.outcome);
    processFactionEncounterReputation(
      state.graph,
      action.actorId,
      action.templateId,
      true,
      encounterCompleted,
      tick,
    );
    processReputationTally(
      state.graph,
      action.actorId,
      action.templateId,
      true,
      encounterCompleted,
      tick,
    );

    // THR-803: the production write half of encounter chains. This is the site that
    // owns graph writes for a just-resolved encounter, which is why the call lives
    // here and not in `unifiedActionLifecycle.ts` (pure, no graph access). Gated on
    // the *whole encounter* landing successfully — a chain stage is a completed
    // narrative beat, not a passed step — matching `encounterCompleted` above.
    // No-ops for the ~all templates that belong to no chain.
    if (encounterCompleted) {
      applyChainStageCompletion(
        state.graph,
        action.actorId,
        action.templateId,
        tick,
        runtime,
      );
    }
  }

  const aftermathChanges: EncounterAftermathChange[] = [];
  const actorName = beforeSnapshot.actorName;
  // THR-1004 — every derived sentence below is built by `engine/aftermathWords.ts`,
  // never assembled here. That is what keeps the words-never-numerals rule
  // testable at one address instead of at eleven template literals.
  //
  // THR-1082 — and every builder now returns the *structure* it spent on that
  // sentence too. `derivedFields` copies it onto the change verbatim, so the
  // chip surface can draw an icon, a direction and a cluster instead of parsing
  // English back out of a finished string. One helper rather than four repeated
  // property lists, so a builder gaining a field cannot reach some call sites
  // and miss others.
  const derivedFields = (sentence: DerivedChange) => ({
    stateNoun: sentence.stateNoun,
    direction: sentence.direction,
    magnitude: sentence.magnitude,
    storyWeight: sentence.storyWeight,
  });
  if (growthApplied > 0 && growthDomain) {
    const sentence = growthSentence({
      actorName,
      domain: growthDomain,
      applied: growthApplied,
      tierCrossed: growthTierFrom != null && growthTierTo != null && growthTierTo > growthTierFrom,
    });
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:growth:${growthDomain}`,
      kind: 'growth',
      title: `${reachDisplayName(growthDomain)} grew`,
      detail: sentence.detail,
      concepts: sentence.concepts,
      ...derivedFields(sentence),
      polarity: 'gain',
      actorId: action.actorId,
      actorName,
    });
  }
  if (promotionTraitGranted) {
    const sentence = traitGrantedSentence({ actorName, traitLabel: promotionTraitGranted });
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:trait:${promotionTraitGranted}`,
      kind: 'trait',
      title: 'A new trait surfaced',
      detail: sentence.detail,
      concepts: sentence.concepts,
      ...derivedFields(sentence),
      polarity: 'gain',
      actorId: action.actorId,
      actorName,
    });
  }

  // Add explicit authored reputation shifts before we collapse to the final snapshot.
  if (Math.abs(metadataReputationDelta) > 0.0001) {
    const sentence = reputationSentence({
      actorName,
      delta: metadataReputationDelta,
      flavour: 'authored',
    });
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:reputation:authored`,
      kind: 'reputation',
      title: 'Your standing shifted',
      detail: sentence.detail,
      concepts: sentence.concepts,
      ...derivedFields(sentence),
      polarity: metadataReputationDelta > 0 ? 'gain' : 'loss',
      actorId: action.actorId,
      actorName,
    });
  }
  if (Math.abs(branchConsequence.reputationDelta) > 0.0001) {
    const sentence = reputationSentence({
      actorName,
      delta: branchConsequence.reputationDelta,
      flavour: 'branch',
    });
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:reputation:branch`,
      kind: 'reputation',
      title: 'The checkpoint judged the intervention',
      detail: sentence.detail,
      concepts: sentence.concepts,
      ...derivedFields(sentence),
      polarity: branchConsequence.reputationDelta > 0 ? 'gain' : 'loss',
      actorId: action.actorId,
      actorName,
    });
  }

  // Emit trace
  emitTrace({
    id: 0,
    category: 'action_execution',
    tick,
    timestamp: tick,
    summary: `${template.name} step ${action.currentStep} ${outcome}`,
    agentId: action.actorId,
    templateId: action.templateId,
    actorId: action.actorId,
    outcome,
    opsApplied: outcome === 'success' ? ops.length : 0,
    opsFailed: outcome === 'failure' ? ops.length : 0,
    duration: action.stepDuration,
  } as any);

  // ── Consumable charges: spend one on a matching-reach step (THR-1239) ──
  //
  // Placed at STEP completion, not action completion: a charge is a use of the
  // item, and a five-step encounter uses a matching item five times. The
  // action-trigger block further down is gated on `finalAction.resolved`, which
  // is the wrong granularity for this.
  //
  // `chargesRemaining` had no decrement anywhere before this, so the tick
  // handler's destroy-at-0 branch was unreachable and every charged item was
  // effectively unlimited.
  if (step) {
    const chargeStates = state.effectStates ?? new Map<string, EffectRuntimeState>();
    const chargeResult = spendConsumableCharges(
      state.graph,
      action.actorId,
      step.reach,
      chargeStates,
      tick,
    );
    if (chargeResult.spent > 0) {
      state.effectStates = chargeResult.updatedStates;
    }
  }

  // Timeline: ACTION_STEP event
  if (step && resolutionStats) {
    // Phase 3: map rich step outcome to timeline result label
    const timelineResult = isStepSuccess(outcome) ? 'PASS' : 'FAIL';
    const costSuffix = outcome === 'success_at_cost' ? '_COST' : '';
    const critPrefix = outcome === 'critical_success' ? 'CRIT_' : outcome === 'critical_failure' ? 'CRIT_' : '';
    appendEvent(action.actorId, {
      phase: 'ACTION_STEP',
      tick,
      template: template.name,
      step: `${action.currentStep + 1}/${template.steps.length}`,
      reach: step.reach,
      diff: step.difficulty,
      cap: resolutionStats.capability,
      prob: resolutionStats.probability,
      roll: resolutionStats.roll,
      result: `${critPrefix}${timelineResult}${costSuffix}`,
      // THR-1247 — how many cards the Repertoire supplied. `step` here is the
      // composed step, so this counts what the player was actually dealt.
      // Omitted entirely on a fully-authored hand (every shipped template), so
      // the column stays absent rather than reading as a meaningful zero.
      ...(step.deal
        ? { dealt: (step.nudges ?? []).filter((n) => isDealtNudgeId(n.id)).length }
        : {}),
    });

    // Balance telemetry: step_resolved — Phase 3: preserves rich outcome type
    if (runtime) {
      recordBalanceEvent(runtime, {
        tick,
        kind: 'step_resolved',
        agentId: action.actorId,
        sourceSystem: 'unified_action',
        templateId: action.templateId,
        stepIndex: action.currentStep,
        reach: step.reach,
        difficulty: step.difficulty,
        capability: resolutionStats.capability,
        probability: resolutionStats.probability,
        roll: resolutionStats.roll,
        result: outcome as BalanceEvent['result'],
      });
    }
  }

  // Timeline: ACTION_END event when action fully resolves
  if (finalAction.resolved) {
    appendEvent(action.actorId, {
      phase: 'ACTION_END',
      tick,
      template: template.name,
      status: finalAction.outcome ?? 'unknown',
      stepResults: finalAction.stepOutcomes.map(o => o === 'success' ? 'P' : 'F').join(''),
    });

    // Balance telemetry: action_resolved — Phase 3: rich outcome type
    if (runtime) {
      const actionResult = mapActionOutcomeToBalanceResult(finalAction.outcome);
      const actionFinalStatus = isActionSuccess(finalAction.outcome) ? 'completed' : 'abandoned';
      recordBalanceEvent(runtime, {
        tick,
        kind: 'action_resolved',
        agentId: action.actorId,
        sourceSystem: 'unified_action',
        templateId: action.templateId,
        result: actionResult,
        finalStatus: actionFinalStatus,
      });

      // Balance telemetry: encounter_resolved (THR-1284)
      //
      // `action_resolved` counts every unified action — divine interventions and
      // strategic verbs included — so it cannot serve as the encounter counter.
      // The encounter half was only ever emitted from the legacy progress path in
      // `orchestrator.ts`, which no live decision reaches: `start_local` builds a
      // *unified* action from the encounter template, so `balance summary` read
      // "Encounters: 0 attempted" on a run that had recorded 398 `start_local`
      // decisions. That legacy emit is left exactly as it is — this is the missing
      // unified half, not a replacement (NFP #6).
      //
      // `isEncounterAction` is the same predicate the chapter archive uses to
      // decide what is worth archiving as a chapter, so the instrument and the
      // ledger agree on what an encounter *is* rather than drifting apart behind
      // two hand-rolled id tests.
      if (isEncounterAction(action.templateId)) {
        recordBalanceEvent(runtime, {
          tick,
          kind: 'encounter_resolved',
          agentId: action.actorId,
          sourceSystem: 'unified_action',
          encounterId: action.templateId,
          finalStatus: actionFinalStatus,
          // Derived from `rarityTier` the way the encounter cache, the event node
          // and the stage model all derive it. `UnifiedActionTemplate` carries no
          // `threatRating` field at all — which is why the legacy emit's read of
          // one banded every legacy encounter as 'unknown' and left
          // `completionByBand` a single dead row.
          threatBand: RARITY_TO_THREAT[template.rarityTier] ?? 'unknown',
        });
      }
    }
  }

  // ── Action trigger: action_complete / encounter_success / encounter_failure (TB-104 Phase 1B) ──
  if (finalAction.resolved) {
    const triggerActorNode = state.graph.getNode(action.actorId);
    if (triggerActorNode) {
      const tProps = triggerActorNode.properties as Record<string, unknown>;
      const triggerCtx: ActionTriggerContext = {
        agentId: action.actorId,
        tick,
        agentResources: {
          essence: (tProps.essence as number) ?? 0,
          quintessence: (tProps.quintessence as number) ?? 0,
          quintessenceMax: (tProps.quintessenceMax as number) ?? Infinity,
          doom: (tProps.doom as number) ?? 0,
          doomThreshold: (tProps.doomThreshold as number) ?? 100,
        },
      };
      const effectStates = state.effectStates ?? new Map();
      const attachedEffects = collectAttachmentEffects(state.graph, action.actorId, effectStates);

      // THR-719: on-use item behavior rides this path. Narrative substitution needs
      // the actor's name, and probability guards need the seeded resolution stream —
      // never Math.random (NFP #3).
      triggerCtx.nextRoll = rng;
      triggerCtx.actorName = triggerActorNode.name;

      // Fire action_complete for any completed action, then the outcome bands.
      // `ladderEventsFor` widens rather than partitions, so a trigger authored on
      // `encounter_success` still fires on every outcome `isStepSuccess` accepted
      // before the bands existed — shipped content keeps its exact behavior.
      const isEncounterTemplate = template.steps.length > 1;
      const triggerEvents: ActionTriggerEvent[] = [
        'action_complete',
        ...(isEncounterTemplate ? ladderEventsFor(outcome) : []),
      ];

      const allResults: ActionTriggerResult[] = [];
      let runningStates: ReadonlyMap<string, EffectRuntimeState> = effectStates;
      for (const evt of triggerEvents) {
        const res = checkAndFireActionTriggers(
          attachedEffects,
          evt,
          { ...triggerCtx, agentResources: { ...triggerCtx.agentResources } },
          runningStates,
        );
        allResults.push(res);
        runningStates = res.updatedStates;
      }

      const totalFired = allResults.reduce((n, r) => n + r.firedCount, 0);
      if (totalFired > 0) {
        const allDeltas = allResults.flatMap(r => r.resourceDeltas);
        for (const delta of allDeltas) {
          (tProps as Record<string, number>)[delta.resource] = delta.after;
        }
        if (allDeltas.length > 0) {
          state.graph.updateNode(action.actorId, { properties: tProps });
        }
        for (const trace of allResults.flatMap(r => r.traces)) {
          emitTrace({ category: 'effect_reaction', tick: state.tick, event: 'action_trigger_fired', ...trace } as unknown as TraceEntry);
        }
        if (!state.effectStates) state.effectStates = new Map();
        for (const [k, v] of runningStates) {
          state.effectStates.set(k, v);
        }

        // Apply the graph-affecting payloads (condition grant/remove, breakage).
        const intents = allResults.flatMap(r => r.payloadIntents);
        if (intents.length > 0) {
          // `state`, not `state.graph`, since THR-1257: the condition payloads now
          // raise `damaged` / `healed`. This site already merged `runningStates` into
          // `state.effectStates` just above and does not thread its own map onward,
          // so the raise writes `state.effectStates` directly and no map is threaded.
          const applied = applyActionTriggerPayloads(state, action.actorId, intents, state.tick);
          if (applied.touchedStructure && runtime) touchStructure(runtime);

          // Surface the authored prose as player-visible aftermath — the whole point
          // of the ticket is that item drama stops being invisible.
          for (let ti = 0; ti < intents.length; ti++) {
            const intent = intents[ti];
            if (!intent.narrative) continue;
            const isLoss = intent.payload.kind === 'self_remove'
              || intent.payload.kind === 'condition_grant';
            aftermathChanges.push({
              id: `${action.actionId}:step:${action.currentStep}:trigger:${intent.attachmentId}:${ti}`,
              kind: intent.payload.kind === 'self_remove' ? 'item' : 'trait',
              title: intent.payload.kind === 'self_remove'
                ? 'Something broke'
                : intent.payload.kind === 'condition_remove'
                  ? 'Something mended'
                  : 'The item exacted its price',
              detail: intent.narrative,
              polarity: intent.payload.kind === 'condition_remove' ? 'gain' : isLoss ? 'loss' : 'mixed',
              actorId: action.actorId,
              actorName: triggerActorNode.name,
            });
          }
        }
      }
    }
  }

  // Generate tick event
  const actorNode = state.graph.getNode(action.actorId);
  const currentActorName = actorNode?.name ?? actorName;
  if (resolvedReward) {
    const sentence = rewardSentence({
      actorName: currentActorName,
      rewardName: resolvedReward.displayName,
      rewardId: resolvedReward.instanceId,
      gained: isStepSuccess(outcome),
    });
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:item:${rewardName}`,
      kind: 'item',
      title: isStepSuccess(outcome) ? 'A reward changed hands' : 'The scene cost something tangible',
      detail: sentence.detail,
      concepts: sentence.concepts,
      ...derivedFields(sentence),
      polarity: isStepSuccess(outcome) ? 'gain' : 'loss',
      actorId: action.actorId,
      actorName: currentActorName,
    });
  }

  const finalSnapshot = snapshotEncounterResolutionContext(state, action);
  const reputationDelta = finalSnapshot.reputationScore - beforeSnapshot.reputationScore;
  if (Math.abs(reputationDelta) > 0.0001 && Math.abs(reputationDelta - metadataReputationDelta - branchConsequence.reputationDelta) > 0.0001) {
    const sentence = reputationSentence({
      actorName: currentActorName,
      delta: reputationDelta,
      flavour: 'residual',
    });
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:reputation`,
      kind: 'reputation',
      title: 'Personal reputation shifted',
      detail: sentence.detail,
      concepts: sentence.concepts,
      ...derivedFields(sentence),
      polarity: reputationDelta > 0 ? 'gain' : 'loss',
      actorId: action.actorId,
      actorName: currentActorName,
    });
  }

  for (const [factionId, afterMembership] of finalSnapshot.factionMemberships.entries()) {
    const beforeMembership = beforeSnapshot.factionMemberships.get(factionId);
    if (!beforeMembership) continue;
    const delta = afterMembership.reputation - beforeMembership.reputation;
    const rankChanged = afterMembership.role !== beforeMembership.role;
    if (Math.abs(delta) <= 0.0001 && !rankChanged) continue;
    const sentence = factionStandingSentence({
      actorName: currentActorName,
      factionId,
      factionName: afterMembership.factionName,
      delta: Math.abs(delta) <= 0.0001 ? 0 : delta,
      beforeRole: beforeMembership.role,
      afterRole: afterMembership.role,
    });
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:faction:${factionId}`,
      kind: 'faction_reputation',
      title: `${afterMembership.factionName} changed its measure`,
      detail: sentence.detail,
      concepts: sentence.concepts,
      ...derivedFields(sentence),
      polarity: delta > 0 ? 'gain' : delta < 0 ? 'loss' : 'mixed',
      actorId: action.actorId,
      actorName: currentActorName,
    });
  }

  // THR-1136 §5 — the snapshot diff no longer reports reputation *tallies* to
  // the player. Director ruling, 2026-08-16: a quantity the aftermath reports
  // must be inspectable on some player surface, and the per-Reach tallies are
  // on none — they were invisible on the character sheet and reported here,
  // and that asymmetry was the defect. Each ending carried two or three
  // one-line "their record in Eye deepened" chips that told the player nothing
  // they could act on and crowded out the changes that did.
  //
  // Only the *reporting* stopped. `finalSnapshot.reputationTallies` is still
  // written by the tally effects, still steers scoring and gating, still emits
  // its traces (NFP #2 — inspectability lives in the traces and the designer
  // view, not on a mortal-facing chip), and the Whispered/Known/Legendary
  // threshold mints in `phaseReputationTraits.ts` are untouched. A minted trait
  // is a real, sheet-visible change and still reports as one.

  for (const [runtimeId, afterGate] of finalSnapshot.clearanceGates.entries()) {
    const beforeGate = beforeSnapshot.clearanceGates.get(runtimeId);
    if (!beforeGate) continue;
    if (afterGate.state !== beforeGate.state) {
      const sentence = gateStateSentence({
        beforeState: beforeGate.state,
        afterState: afterGate.state,
      });
      aftermathChanges.push({
        id: `${action.actionId}:step:${action.currentStep}:gate:${runtimeId}:state`,
        kind: 'shell_state',
        title: 'The checkpoint changed state',
        detail: sentence.detail,
        ...derivedFields(sentence),
        polarity: 'info',
      });
    }
    const newTags = afterGate.followOnTags.filter(tag => !beforeGate.followOnTags.includes(tag));
    for (const tag of newTags) {
      const sentence = gateFollowOnSentence(tag);
      aftermathChanges.push({
        id: `${action.actionId}:step:${action.currentStep}:gate:${runtimeId}:tag:${tag}`,
        kind: 'future_hook',
        title: 'A follow-on thread was seeded',
        detail: sentence.detail,
        ...derivedFields(sentence),
        polarity: 'info',
      });
    }
  }

  finalAction = appendAftermathChanges(finalAction, aftermathChanges);
  if (finalAction.resolved && finalAction.outcome) {
    const changes = finalAction.aftermathChanges ?? [];

    // Branch-aware aftermath: if the template has an aftermathConfig,
    // resolve the variant from choice history and use its authored content.
    const aftermathVariant = resolveTemplateAftermathVariant(
      template,
      finalAction.choiceHistory,
      finalAction.outcome,
    );

    // THR-1030 — the anti-vacuity half of the `?outcome=` review pin. A pinned band
    // that no variant authors would otherwise render the *base* ending while the URL
    // claimed a band, which is precisely the defect THR-989 and THR-973 exist to
    // find. No-ops entirely when no pin is armed for this template.
    recordOutcomePinVerdict(template, finalAction.outcome);

    const reactions = aftermathVariant?.reactions
      ?? buildEncounterAftermathReactions(finalAction, template);
    const finalSummary: EncounterAftermathSummary = {
      encounterId: action.templateId,
      outcome: finalAction.outcome,
      overview: aftermathVariant?.overview ?? buildEncounterAftermathOverview(
        currentActorName,
        template.name,
        finalAction.outcome,
        changes,
      ),
      changes: aftermathVariant
        ? [...changes, ...aftermathVariant.changes]
        : changes,
      narrativeTag: consequence.narrativeTag,
      // THR-1029 §3 — these two defaults are player-facing prose and were written
      // in system register. "Consequence thread" is a schema noun, not a game noun,
      // and the second line was mood rather than mechanism — both fail Law 42
      // ("UI microcopy explains mechanism, not mood"). The director quoted the
      // first back verbatim, which is the tell: a default the player notices is a
      // default that is wrong.
      //
      // The choose-framing is also gated on there being more than one reaction, so
      // the engine never manufactures a question the player cannot answer (Law 25).
      // The veil suppresses a one-option prompt independently; gating here means
      // every other surface reading `reactionPrompt` inherits the same honesty.
      reactionPrompt: aftermathVariant?.reactionPrompt
        ?? (reactions && reactions.length > 1
          ? 'Choose what to carry forward.'
          : changes.length > 0
            ? 'What this changed.'
          : undefined),
      reactions,
    };
    finalAction = {
      ...finalAction,
      aftermathSummary: finalSummary,
    };
  }
  if (finalAction.resolved) {
    // Phase 3: outcome-differentiated event messages
    const outcomeMsg = describeActionOutcome(finalAction.outcome);
    const baseSignificance = isActionSuccess(finalAction.outcome) ? 0.6 : 0.4;
    // Phase 3: critical_success gets hardcoded 0.8; other tiers get base + consequence boost
    const significance = finalAction.outcome === 'critical_success'
      ? 0.8
      : baseSignificance + consequence.significanceBoost;
    const metadataSuffix = summarizeMetadataConsequences(
      stepMetadata,
      isActionSuccess(finalAction.outcome),
      rewardName,
    );
    // Phase 6: Q delta annotation for chronicle/toast visibility
    const qDelta = consequence.quintessenceEvent?.delta ?? 0;
    const qSuffix = qDelta !== 0
      ? ` (${qDelta > 0 ? '+' : ''}${qDelta.toFixed(2)}Q)`
      : '';
    events.push({
      id: `ua_${action.actionId}_resolved`,
      tick,
      type: 'agent_action_resolved',
      message: `${currentActorName} ${outcomeMsg} ${template.name}${metadataSuffix}${clearanceSuffix}${qSuffix}.`,
      significance,
      actorId: action.actorId,
    });
  } else {
    // Multi-step: report step progression with rich outcome
    const stepNum = action.currentStep + 1;
    const totalSteps = template.steps.length;
    const stepVerb = describeStepOutcome(outcome);
    // Phase 3: critical_success gets 0.7; other tiers get base 0.5 + consequence boost
    const stepSignificance = outcome === 'critical_success' ? 0.7 : 0.5 + consequence.significanceBoost;
    const metadataSuffix = summarizeMetadataConsequences(stepMetadata, isStepSuccess(outcome), rewardName);
    // Phase 6: Q delta annotation for chronicle/toast visibility
    const stepQDelta = consequence.quintessenceEvent?.delta ?? 0;
    const stepQSuffix = stepQDelta !== 0
      ? ` (${stepQDelta > 0 ? '+' : ''}${stepQDelta.toFixed(2)}Q)`
      : '';
    events.push({
      id: `ua_${action.actionId}_step${stepNum}`,
      tick,
      type: 'agent_action_resolved',
      message: `${actorName} ${stepVerb} in ${template.name} (step ${stepNum}/${totalSteps})${metadataSuffix}${clearanceSuffix}${stepQSuffix}.`,
      significance: stepSignificance,
      actorId: action.actorId,
    });
  }

  // ── THR-143: Create encounter event node for this unified action step ──
  // Uses the input action's step index (pre-advance) to generate a stable ID.
  // Only propagate targetAgentId for actor-typed targets; unified actions can target
  // locations, artifacts, and other non-actor nodes that must not get participated_in edges.
  const targetNodeType = action.targetId !== action.actorId
    ? state.graph.getNode(action.targetId)?.type
    : undefined;
  const unifiedEventNodeId = createUnifiedActionEventNode({
    graph: state.graph,
    actorId: action.actorId,
    targetAgentId: targetNodeType === 'actor' ? action.targetId : undefined,
    templateId: template.id,
    templateName: template.name,
    stepIndex: action.currentStep,
    stepReach: template.steps[action.currentStep]?.reach,
    outcome,
    tick,
    tierPromotionOccurred: !!(promotionTraitGranted),
  });

  // ── THR-143: Emit caused_by edge if this is a seed-spawned action ──
  if (action.pendingCausationSourceEventId) {
    if (unifiedEventNodeId) {
      try {
        state.graph.addEdge({
          id: `caused_by_${unifiedEventNodeId}_${action.pendingCausationSourceEventId}`,
          source: unifiedEventNodeId,
          target: action.pendingCausationSourceEventId,
          type: 'caused_by',
          properties: {
            seedId: action.spawnedFromSeedId,
            seedLabel: action.spawnedFromSeedLabel,
            firedTick: tick,
          },
        });
        if (runtime) touchWorld(runtime);
        emitTrace({
          tick,
          category: 'causation_edge_created',
          sourceEventId: unifiedEventNodeId,
          causedByEventId: action.pendingCausationSourceEventId,
          seedId: action.spawnedFromSeedId,
          seedLabel: action.spawnedFromSeedLabel,
          summary: `Causation edge: ${unifiedEventNodeId} caused_by ${action.pendingCausationSourceEventId} (seed: "${action.spawnedFromSeedLabel}")`,
        } as TraceEntry);
      } catch {
        emitTrace({
          tick,
          category: 'causation_edge_creation_skipped',
          sourceEventId: unifiedEventNodeId,
          causedByEventId: action.pendingCausationSourceEventId,
          seedId: action.spawnedFromSeedId,
          reason: 'graph_add_edge_failed',
          summary: `Causation edge skipped: add failed for ${unifiedEventNodeId}→${action.pendingCausationSourceEventId}`,
        } as TraceEntry);
      }
    } else {
      emitTrace({
        tick,
        category: 'causation_edge_creation_skipped',
        causedByEventId: action.pendingCausationSourceEventId,
        seedId: action.spawnedFromSeedId,
        reason: 'no_new_event_node',
        summary: `Causation edge skipped: event node creation failed for ${template.id} step ${action.currentStep}`,
      } as TraceEntry);
    }
  }

  // Persist event node ID; clear pending causation marker after first use.
  finalAction = {
    ...finalAction,
    ...(unifiedEventNodeId !== undefined && { eventNodeId: unifiedEventNodeId }),
    ...(action.pendingCausationSourceEventId !== undefined && { pendingCausationSourceEventId: undefined }),
  };

  return { updatedAction: finalAction, events };
}

// ─── Phase 3: Push/Resist Template Sets ────────────────────────

/**
 * Risky/coercive actions where agents will attempt to push (spend Q for better odds).
 * Phase 3 proving slice: narrow seam, not all actions.
 */
const PUSH_ELIGIBLE_PREFIXES = [
  'action.shadow.assassinate',
  'action.iron.conquer',
  'action.gold.commission-assassination',
];

/**
 * Social/influence actions where agents will attempt to resist negative outcomes.
 * Phase 3 proving slice: narrow seam, not all actions.
 */
const RESIST_ELIGIBLE_PREFIXES = [
  'action.heart.',
  'action.shadow.recruit',
];

function isPushEligible(templateId: string): boolean {
  return PUSH_ELIGIBLE_PREFIXES.some(p => templateId.startsWith(p));
}

function isResistEligible(templateId: string): boolean {
  return RESIST_ELIGIBLE_PREFIXES.some(p => templateId.startsWith(p));
}

// ─── Phase 3: Outcome Helpers ──────────────────────────────────

/** Check if an action outcome is any form of success (including success_at_cost). */
function isActionSuccess(outcome?: UnifiedActionOutcome): boolean {
  return outcome === 'success' || outcome === 'critical_success' || outcome === 'success_at_cost' || outcome === 'contested_won';
}

/** Map UnifiedActionOutcome to BalanceEvent result field. */
function mapActionOutcomeToBalanceResult(outcome?: UnifiedActionOutcome): BalanceEvent['result'] {
  switch (outcome) {
    case 'critical_success': return 'critical_success';
    case 'success': return 'success';
    case 'success_at_cost': return 'success_at_cost';
    case 'critical_failure': return 'critical_failure';
    case 'contested_won': return 'success';
    case 'contested_lost': return 'failure';
    default: return 'failure';
  }
}

/** Human-readable verb for action-level outcomes. */
function describeActionOutcome(outcome?: UnifiedActionOutcome): string {
  switch (outcome) {
    case 'critical_success': return 'masterfully completed';
    case 'success': return 'completed';
    case 'success_at_cost': return 'completed at great cost';
    case 'contested_won': return 'won contested';
    case 'contested_lost': return 'lost contested';
    case 'critical_failure': return 'catastrophically failed';
    default: return 'failed';
  }
}

/** Human-readable verb for step-level outcomes. */
function describeStepOutcome(outcome: StepOutcome): string {
  switch (outcome) {
    case 'critical_success': return 'excels';
    case 'success': return 'progresses';
    case 'success_at_cost': return 'pushes through at cost';
    case 'near_miss': return 'nearly has it';
    case 'failure': return 'stumbles';
    case 'critical_failure': return 'falters badly';
  }
}

// ─── Self-Action Post-Processor (THR-399) ───────────────────────

/** Exported additively (THR-604) so engineEffectRegistry can aggregate the ids
 *  the engine post-processes for self-actions. Runtime behavior unchanged. */
export const SELF_ACTION_TEMPLATE_IDS = new Set([
  'divine.self.stillness',
  'divine.self.recede',
  'divine.self.focus',
  'divine.self.reveal',
]);

/**
 * Applies side-effects that require engine access beyond GraphOps:
 *   - Stillness: regenerate essence on primary sphere
 *   - Reveal: push divineInfluences onto every individual actor on the avatar's hex
 *
 * Recede and Focus write their buffs via onSuccess GraphOps in the template definition.
 * Fail-soft: any error logs a warning and returns without crashing.
 */
function resolveSelfActionEffect(
  templateId: string,
  state: GameState,
  tick: number,
): void {
  const ascendantNode = state.graph.getNode(state.ascendantId);
  const props = ascendantNode?.properties as AscendantProperties | undefined;

  if (templateId === 'divine.self.stillness') {
    if (!props?.essencePool || !props.sphereAlignment) return;
    const primarySphere = props.sphereAlignment.primary as SphereName;
    const current = props.essencePool[primarySphere] ?? 0;
    const max = props.maxEssence ?? Infinity;
    const newTotal = Math.min(current + STILLNESS_ESSENCE_REGEN, max);
    state.graph.updateNode(state.ascendantId, {
      properties: { essencePool: { ...props.essencePool, [primarySphere]: newTotal } },
    });
    emitTrace({
      category: 'self_action',
      tick,
      templateId,
      ascendantId: state.ascendantId,
      essenceRegen: { sphere: primarySphere, delta: newTotal - current, newTotal },
      summary: `Stillness: +${newTotal - current} ${primarySphere} essence (now ${newTotal})`,
    } as SelfActionTrace);
    return;
  }

  if (templateId === 'divine.self.recede') {
    const discount = props?.nextActionDiscount ?? RECEDE_DISCOUNT_FRACTION;
    emitTrace({
      category: 'self_action',
      tick,
      templateId,
      ascendantId: state.ascendantId,
      discountStored: discount,
      summary: `Recede: ${Math.round(discount * 100)}% discount stored for next action`,
    } as SelfActionTrace);
    return;
  }

  if (templateId === 'divine.self.focus') {
    const boost = props?.nextActionTierBoost ?? FOCUS_TIER_BOOST;
    emitTrace({
      category: 'self_action',
      tick,
      templateId,
      ascendantId: state.ascendantId,
      tierBoostStored: boost,
      summary: `Focus: +${boost} tier boost stored for next action`,
    } as SelfActionTrace);
    return;
  }

  if (templateId === 'divine.self.reveal') {
    const avatars = getAvatarsOf(state.graph, state.ascendantId);
    if (avatars.length === 0) return;

    // Resolve avatar hex
    const avatar = avatars[0];
    const avatarLocationId = avatar.properties?.locationId as string | undefined;
    if (!avatarLocationId) return;
    // THR-1183: resolve through the shared discriminator so both sublocation mint
    // shapes reach the parent location the same way.
    const locNode = resolveToParentLocation(state.graph, state.graph.getNode(avatarLocationId));
    if (!locNode) return;
    const hexCol = locNode.properties?.hexCol as number | undefined;
    const hexRow = locNode.properties?.hexRow as number | undefined;
    if (hexCol === undefined || hexRow === undefined) return;

    // Apply reveal influence to all individual actors on the avatar's hex
    let mortalsAffected = 0;
    const allActors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');

    for (const actor of allActors) {
      const actorLocationId = actor.properties?.locationId as string | undefined;
      if (!actorLocationId) continue;
      const actorLoc = resolveToParentLocation(state.graph, state.graph.getNode(actorLocationId));
      if (!actorLoc) continue;
      const aCol = actorLoc.properties?.hexCol as number | undefined;
      const aRow = actorLoc.properties?.hexRow as number | undefined;
      if (aCol !== hexCol || aRow !== hexRow) continue;

      const existing: unknown[] = (actor.properties?.divineInfluences as unknown[]) ?? [];
      state.graph.updateNode(actor.id, {
        properties: {
          divineInfluences: [
            ...existing,
            {
              id: `reveal_${actor.id}_${tick}`,
              interventionType: 'reveal',
              devotionDelta: REVEAL_DEVOTION_DELTA,
              fearDelta: REVEAL_FEAR_DELTA,
              aweDelta: REVEAL_AWE_DELTA,
              expiresAtTick: tick + REVEAL_WAKE_MARK_DURATION,
              tickApplied: tick,
            },
          ],
        },
      });
      mortalsAffected++;
    }

    emitTrace({
      category: 'self_action',
      tick,
      templateId,
      ascendantId: state.ascendantId,
      mortalsAffected,
      revealHex: { col: hexCol, row: hexRow },
      summary: `Reveal: divine presence shown at (${hexCol},${hexRow}), ${mortalsAffected} mortals affected`,
    } as SelfActionTrace);
  }
}

// ─── Orchestrator Phase: Unified Action Progress ────────────────

/**
 * Combined orchestrator phase that replaces phaseActionProgress and
 * phaseEncounterProgression for actions in state.unifiedActions.
 *
 * Executes Phases 1-6 of the unified pipeline:
 * 1. Progress all active actions
 * 2. Collect completing actions
 * 3. Sort by priority (scale → FIFO)
 * 4-5. Resolve and execute each
 * 6. Advance or complete
 *
 * Returns partial GameState with updated unifiedActions and tickEvents.
 */
export function phaseUnifiedActionProgress(
  state: GameState,
  templates: readonly UnifiedActionTemplate[],
  rng: () => number,
  runtime?: SimulationRuntime,
): Partial<GameState> {
  const events: TickEvent[] = [];
  const hexMutations: HexMutation[] = [];
  const revelationMutations: RevelationMutation[] = [];
  const spawnedEffects: ControlEffect[] = [];
  const spherePressures: SpherePressureEvent[] = [];
  // Digest buffer: accumulate background/invisible action outcomes for Read the Threads.
  const digestBuffer: DigestEntry[] = [...(state.digestBuffer ?? [])];

  // Phase 1: Progress all (defensive: state may not have unifiedActions yet)
  let actions = progressAllActions(state.unifiedActions ?? []);

  // Phase 2: Collect completions
  const completing = collectCompletions(actions);

  // Phase 3: Contestation detection and resolution
  //
  // THR-731: before detection, give any band standing against a completing company
  // action its side of the fight. The synthesized counters are transient — they are
  // resolved in this loop and never enter `state.unifiedActions` — so they are held
  // in a local pool rather than pushed onto `actions`.
  const bandOppositions = collectBandOppositions(completing, state);
  const counterPool = new Map<string, UnifiedAction>(
    bandOppositions.map((o) => [o.counter.actionId, o.counter]),
  );
  const oppositionByInitiator = new Map(
    bandOppositions.map((o) => [o.initiator.actionId, o]),
  );

  const contestPairs = detectContestations(
    completing,
    templates,
    bandOppositions.map((o) => ({
      initiatorActionId: o.initiator.actionId,
      counterActionId: o.counter.actionId,
      targetId: o.initiator.targetId,
      initiatorGroupId: o.initiatorGroupId,
      bandGroupId: o.bandGroupId,
    })),
  );
  const contestedIds = new Set<string>();

  for (const pair of contestPairs) {
    const attacker = actions.find((a) => a.actionId === pair.attackerActionId)
      ?? counterPool.get(pair.attackerActionId);
    const defender = actions.find((a) => a.actionId === pair.defenderActionId)
      ?? counterPool.get(pair.defenderActionId);
    if (!attacker || !defender) continue;

    const atkTemplate = resolveUnifiedTemplate(templates, attacker.templateId);
    const defTemplate = resolveUnifiedTemplate(templates, defender.templateId);
    if (!atkTemplate || !defTemplate) continue;

    const contestResult = resolveContestationPair(
      attacker, defender, atkTemplate, defTemplate, state, rng,
    );

    // Apply attacker outcome
    const atkOps = contestResult.attackerOutcome === 'success'
      ? (atkTemplate.steps[attacker.currentStep]?.onSuccess ?? [])
      : (atkTemplate.steps[attacker.currentStep]?.onFailure ?? []);
    const { updatedAction: updAtk, events: atkEvents } = executeStepResult(
      attacker, atkTemplate, contestResult.attackerOutcome, atkOps, state, rng, state.tick,
      undefined, runtime,
    );

    // Apply defender outcome
    const defOps = contestResult.defenderOutcome === 'success'
      ? (defTemplate.steps[defender.currentStep]?.onSuccess ?? [])
      : (defTemplate.steps[defender.currentStep]?.onFailure ?? []);
    const { updatedAction: updDef, events: defEvents } = executeStepResult(
      defender, defTemplate, contestResult.defenderOutcome, defOps, state, rng, state.tick,
      undefined, runtime,
    );

    // THR-731: a group contest is the one contested shape that carries consequences
    // beyond the step's own ops — cohesion swings on both sides, a possible casualty
    // on the losing one, and a standing `hostile_to` grudge between the two groups.
    // Applied before the outcome is stamped so the trace records the cohesion the
    // engagement actually produced.
    let atkResolved = updAtk;
    let defResolved = updDef;
    const opposition = pair.groupOpposition
      ? oppositionByInitiator.get(pair.attackerActionId)
      : undefined;
    if (opposition) {
      applyContestConsequences(
        state, opposition,
        contestResult.attackerOutcome === 'success' ? 'success' : 'failure',
        contestResult.defenderOutcome === 'success' ? 'success' : 'failure',
        rng,
      );
      // Stamp the contested outcome band on any side that resolved. Until now
      // `contested_won`/`contested_lost` had display strings and a receipt mapping
      // but no producer — a company that lost a fight read as one that merely failed.
      if (atkResolved.resolved) {
        atkResolved = {
          ...atkResolved,
          outcome: contestedOutcomeFor(contestResult.attackerOutcome === 'success' ? 'success' : 'failure'),
        };
      }
      if (defResolved.resolved) {
        defResolved = {
          ...defResolved,
          outcome: contestedOutcomeFor(contestResult.defenderOutcome === 'success' ? 'success' : 'failure'),
        };
      }
    }

    // Replace in actions array. A synthesized band counter is not in `actions` —
    // it is transient by design, so the map simply never matches it.
    actions = actions.map((a) => {
      if (a.actionId === atkResolved.actionId) return atkResolved;
      if (a.actionId === defResolved.actionId) return defResolved;
      return a;
    });

    // Spawn ControlEffect for contested winners (TB-044)
    if (atkResolved.resolved && isActionSuccess(atkResolved.outcome) && atkTemplate.durationMode === 'sustained') {
      const spawnResult = spawnControlEffect(atkResolved, atkTemplate, state.tick, state.graph);
      if (spawnResult) {
        spawnedEffects.push(spawnResult.effect);
        events.push(spawnResult.event);
      }
    }
    if (defResolved.resolved && isActionSuccess(defResolved.outcome) && defTemplate.durationMode === 'sustained') {
      const spawnResult = spawnControlEffect(defResolved, defTemplate, state.tick, state.graph);
      if (spawnResult) {
        spawnedEffects.push(spawnResult.effect);
        events.push(spawnResult.event);
      }
    }

    // Sphere pressure: contested action resolutions also push pressure
    if (atkResolved.resolved && atkTemplate.sphereAffinity && attacker.targetId) {
      spherePressures.push({
        targetEntityId: attacker.targetId,
        sphere: atkTemplate.sphereAffinity,
        magnitude: isActionSuccess(atkResolved.outcome) ? ACTION_PRESSURE_SUCCESS : ACTION_PRESSURE_FAILURE,
        source: 'divine_action',
        sourceId: attacker.actionId,
      });
    }
    if (defResolved.resolved && defTemplate.sphereAffinity && defender.targetId) {
      spherePressures.push({
        targetEntityId: defender.targetId,
        sphere: defTemplate.sphereAffinity,
        magnitude: isActionSuccess(defResolved.outcome) ? ACTION_PRESSURE_SUCCESS : ACTION_PRESSURE_FAILURE,
        source: 'divine_action',
        sourceId: defender.actionId,
      });
    }

    events.push(...atkEvents, ...defEvents);
    contestedIds.add(pair.attackerActionId);
    contestedIds.add(pair.defenderActionId);
  }

  // Phase 3b: Sort remaining (uncontested) completions by priority
  const uncontested = completing.filter((a) => !contestedIds.has(a.actionId));
  const sorted = sortByPriority(uncontested);

  // Phase 4-6: Resolve and execute uncontested actions
  for (const completing_action of sorted) {
    const template = resolveUnifiedTemplate(templates, completing_action.templateId);
    if (!template) continue; // fail-soft: skip unknown template

    // Resolve step
    const stepResult = resolveUncontestedStep(
      completing_action, template, state, rng,
    );
    const { outcome, opsToExecute, capability, probability, roll } = stepResult;

    // Phase 3: Emit push/resist telemetry
    if (runtime && stepResult.pushAttempted) {
      recordBalanceEvent(runtime, {
        tick: state.tick,
        kind: 'quintessence_push',
        agentId: completing_action.actorId,
        sourceSystem: 'unified_action',
        templateId: completing_action.templateId,
        spendKind: 'push',
        quintessenceDelta: -stepResult.pushCost,
      });
    }
    if (runtime && stepResult.resistAttempted) {
      recordBalanceEvent(runtime, {
        tick: state.tick,
        kind: 'quintessence_resist',
        agentId: completing_action.actorId,
        sourceSystem: 'unified_action',
        templateId: completing_action.templateId,
        spendKind: 'resist',
        resistSucceeded: stepResult.resistSucceeded,
        preResistOutcome: stepResult.preResistOutcome,
        postResistOutcome: stepResult.outcome,
        quintessenceDelta: -stepResult.resistCost,
      });
    }

    // Execute and advance
    const { updatedAction, events: stepEvents } = executeStepResult(
      completing_action, template, outcome, opsToExecute, state, rng, state.tick,
      { capability, probability, roll }, runtime,
    );

    // If this action targets a hex, route through hexActionBridge to get mutations
    if (
      completing_action.targetId &&
      isHexTargetId(completing_action.targetId) &&
      updatedAction.resolved
    ) {
      const coords = parseHexTargetId(completing_action.targetId);
      if (coords) {
        const finalOutcome = isActionSuccess(updatedAction.outcome) ? 'success' : 'failure';
        const result = resolveHexActionFull(
          completing_action.templateId,
          coords.col,
          coords.row,
          finalOutcome,
          state.tick,
          state.graph,
        );
        hexMutations.push(...result.hexMutations);
        revelationMutations.push(...result.revelationMutations);
        // Execute graph ops for hex actions that produce graph mutations (e.g., forge artifacts, spawn agents)
        if (result.graphOps.length > 0) {
          executeGraphOps(state.graph, result.graphOps, {
            actorId: state.ascendantId,
            targetId: completing_action.targetId,
            locationId: completing_action.targetId,
            tick: state.tick,
          }, { tick: state.tick, emitTrace: true });
        }
        // Emit discovery TickEvents and essence rewards for hidden site reveals
        if (result.hiddenSiteReveals.length > 0) {
          for (const reveal of result.hiddenSiteReveals) {
            events.push(buildDiscoveryTickEvent(reveal, state.tick));
            // Grant essence reward for discovery
            const reward = computeElderEssenceReward(reveal, state.tick);
            if (state.essencePool) {
              for (const [sphere, delta] of Object.entries(reward.deltas)) {
                const s = sphere as SphereName;
                if (state.essencePool[s] !== undefined) {
                  state.essencePool[s] += delta;
                }
              }
              events.push({
                id: `evt_essence_discovery_${reveal.sublocationId}_${state.tick}`,
                tick: state.tick,
                type: 'essence_gain',
                message: `Gained ${reward.totalReward.toFixed(1)} essence from ${reveal.sublocationName}`,
                significance: reveal.hasElderMagic ? 0.7 : 0.4,
                sphere: reveal.hasElderMagic ? 'spirit' : undefined,
                hexCoords: { col: reveal.hexCol, row: reveal.hexRow },
              });
            }
          }
          // Consume treasure maps held by agents at this hex
          const mapEvents = consumeTreasureMapsAtHex(
            state.graph, coords.col, coords.row, state.tick, 'hidden_site_discovered',
          );
          events.push(...mapEvents);
        }
        // THR-415: Survey people-layer prose band — emit on Survey success
        if (completing_action.templateId === 'hex.survey' && finalOutcome === 'success') {
          try {
            const band = composeSurveyPeopleProse(state.graph, coords.col, coords.row, rng, state.tick);
            if (band) {
              events.push(buildSurveyCompletedTickEvent(band, coords.col, coords.row, state.tick));
            }
          } catch (err) {
            console.warn('[THR-415] survey prose composer error — skipping event', err);
          }
        }
      }
    }

    // PHASE-D (Fix 4): Player action importance accumulation.
    // When the ascendant fires an action that resolves successfully against an individual actor
    // target, accumulate importance on that target node.
    // Fail-soft: missing targetId, hex targets, missing node, non-individual nodes → skip silently.
    if (
      updatedAction.resolved &&
      isActionSuccess(updatedAction.outcome) &&
      completing_action.actorId === state.ascendantId &&
      completing_action.targetId &&
      !isHexTargetId(completing_action.targetId)
    ) {
      const targetNodeForRarity = state.graph.getNode(completing_action.targetId);
      if (targetNodeForRarity && targetNodeForRarity.properties?.actorType === 'individual') {
        const playerActionDelta = getImportanceDelta('player_action');
        const playerActionNewImportance = accumulateImportance(targetNodeForRarity, playerActionDelta);
        emitTrace({
          category: 'rarity_importance',
          tick: state.tick,
          nodeId: targetNodeForRarity.id,
          nodeName: targetNodeForRarity.name ?? targetNodeForRarity.id,
          source: 'player_action',
          delta: playerActionDelta,
          newImportance: playerActionNewImportance,
          currentTier: getRarityTier(targetNodeForRarity),
          summary: `importance +${playerActionDelta} for ${targetNodeForRarity.name ?? targetNodeForRarity.id} (now ${playerActionNewImportance})`,
          agentId: targetNodeForRarity.id,
        } as import('../types/trace').RarityImportanceTrace);
      }
    }

    // Player reach-practice accrual (THR-613, plan §3.1): god-side Domain Capability
    // growth. When the ascendant resolves an action carrying an in-domain reach, accrue
    // practice into `reachPractice[reach]` — the additive raw-score term the
    // progression phase reads to detect tier crossings. Fail-soft: off-domain reach or
    // non-ascendant actor → no-op inside the helper.
    if (updatedAction.resolved && completing_action.actorId === state.ascendantId) {
      const resolvedStep = template.steps[completing_action.currentStep];
      const stepDifficulty =
        resolvedStep && !isActionStepBranch(resolvedStep) ? resolvedStep.difficulty : 0;
      accruePlayerReachPractice(
        state.graph,
        state.ascendantId,
        template.reach,
        stepDifficulty,
        state.tick,
      );
    }

    // Spawn ControlEffect for successful sustained actions (TB-044)
    if (updatedAction.resolved && isActionSuccess(updatedAction.outcome)) {
      const spawnResult = spawnControlEffect(updatedAction, template, state.tick, state.graph);
      if (spawnResult) {
        spawnedEffects.push(spawnResult.effect);
        events.push(spawnResult.event);
      }
    }

    // Revelation actions: if template has revelationAction metadata, dispatch
    // to resolveRevelationAction on successful resolution. Fail-soft wrapped.
    if (updatedAction.resolved && isActionSuccess(updatedAction.outcome) && template.revelationAction) {
      try {
        resolveRevelationAction(template.revelationAction, state, completing_action.targetId);
      } catch (revelationErr) {
        console.warn('[unifiedActionResolution] revelation action error:', revelationErr);
      }
    }

    // Perceive/Relay divine actions (THR-151): dispatch to ruins resolver on success.
    if (
      updatedAction.resolved &&
      isActionSuccess(updatedAction.outcome) &&
      PERCEIVE_RELAY_TEMPLATE_IDS.has(completing_action.templateId)
    ) {
      try {
        resolvePerceiveRelayAction(
          completing_action.templateId,
          state,
          completing_action.targetId,
          rng,
        );
      } catch (perceiveRelayErr) {
        console.warn('[unifiedActionResolution] perceive/relay action error:', perceiveRelayErr);
      }
    }

    // Self-targeting divine actions (THR-399): apply essence regen and hex influence.
    if (
      updatedAction.resolved &&
      isActionSuccess(updatedAction.outcome) &&
      completing_action.actorId === state.ascendantId &&
      SELF_ACTION_TEMPLATE_IDS.has(completing_action.templateId)
    ) {
      try {
        resolveSelfActionEffect(completing_action.templateId, state, state.tick);
      } catch (selfActionErr) {
        console.warn('[unifiedActionResolution] self-action post-processor error:', selfActionErr);
      }
    }

    // Sphere pressure: push pressure on action's target entity on resolution.
    // Fail-soft: skip if template has no sphereAffinity or action has no targetId.
    if (updatedAction.resolved && template.sphereAffinity && completing_action.targetId) {
      const magnitude = isActionSuccess(updatedAction.outcome)
        ? ACTION_PRESSURE_SUCCESS
        : ACTION_PRESSURE_FAILURE;
      spherePressures.push({
        targetEntityId: completing_action.targetId,
        sphere: template.sphereAffinity,
        magnitude,
        source: 'divine_action',
        sourceId: completing_action.actionId,
      });
    }

    // ── Digest Buffer: accumulate background/invisible unified action outcomes ──
    // Only runs when the action is fully resolved. Fail-soft: missing template or
    // agent node → use defaults. Only accumulates if effectiveTier was set at creation.
    if (
      updatedAction.resolved &&
      (completing_action.effectiveTier === 'background' || completing_action.effectiveTier === 'invisible')
    ) {
      const digestAgentNode = state.graph.getNode(completing_action.actorId);
      const digestEntry: DigestEntry = {
        agentId: completing_action.actorId,
        agentName: digestAgentNode?.properties?.name ?? digestAgentNode?.name ?? 'Unknown',
        encounterId: completing_action.templateId,
        encounterName: template.name ?? 'Unknown Action',
        encounterType: 'explore',
        reachPrimary: template.reach ?? 'iron',
        tick: state.tick,
        success: isActionSuccess(updatedAction.outcome),
        significantOutcomes: [],
        capabilityChanges: {},
        attachmentsGained: [],
        attachmentsLost: [],
        quintessenceDelta: 0,
        isNotable: false,
        wasCuratedOut: false,
        isDormantAgent: completing_action.effectiveTier === 'invisible',
        sourceType: 'agent',
      };
      digestEntry.isNotable = isNotableEntry({
        quintessenceDelta: digestEntry.quintessenceDelta,
        attachmentsLost: digestEntry.attachmentsLost,
      });
      appendDigestEntry(digestBuffer, digestEntry);
    }

    // Replace action in array
    actions = actions.map((a) =>
      a.actionId === updatedAction.actionId ? updatedAction : a,
    );

    events.push(...stepEvents);
  }

  return {
    unifiedActions: actions,
    tickEvents: [...state.tickEvents, ...events],
    digestBuffer,
    pendingHexMutations: [
      ...(state.pendingHexMutations ?? []),
      ...hexMutations,
    ],
    ...(revelationMutations.length > 0
      ? { hexRevelation: applyRevelationMutations(state.hexRevelation, revelationMutations) }
      : {}),
    // TB-044: Append spawned control effects from successful sustained actions
    ...(spawnedEffects.length > 0
      ? { controlEffects: [...(state.controlEffects ?? []), ...spawnedEffects] }
      : {}),
    // Sphere pressure: accumulate events for phaseSpherePressure to consume
    ...(spherePressures.length > 0
      ? { pendingSpherePressures: [...(state.pendingSpherePressures ?? []), ...spherePressures] }
      : {}),
  };
}
