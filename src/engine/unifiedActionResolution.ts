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
  UnifiedActionTemplate,
  StepOutcome,
} from '../types/unifiedAction';
import type { ActionStepOutcomeMetadata } from '../types/unifiedAction';
import type { GraphOp } from '../types/graphOp';
import {
  progressUnifiedAction,
  isStepComplete,
  advanceStep,
  sortByPriority,
  resolveStepDefinition,
} from './unifiedActionLifecycle';
import { isStepSuccess, isStepFailure } from '../types/unifiedAction';
import { computeCapability } from './domainCapability';
import { resolveAction as resolveActionLegacy } from './resolution';
import { resolveAction as resolveActionShared, isSuccessOutcome } from './resolutionService';
import type { OutcomeType } from '../types/resolution';
import type { ResolutionInput } from '../types/resolution';
import { executeGraphOps } from './graphOpExecutor';
import { emitTrace } from './traceBuffer';
import {
  detectContestations,
  resolveContestationPair,
} from './contestation';
import { resolveHexActionFull, isHexTargetId, parseHexTargetId } from './hexActionBridge';
import { buildDiscoveryTickEvent } from './revelationResolver';
import { computeElderEssenceReward } from './elderEssenceReward';
import { consumeTreasureMapsAtHex } from './treasureMapConsumption';
import { appendEvent } from './encounterTimeline';
import type { HexMutation } from '../types/hexMutation';
import type { RevelationMutation } from './revelationResolver';
import { applyRevelationMutations } from './revelationResolver';
import { applyEncounterGrowth } from './capabilityGrowth';
import { handleTierPromotion } from './tierPromotion';
import type { ControlEffect } from '../types/controlEffect';
import { spawnControlEffect } from './controlEffectSpawn';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { ACTION_PRESSURE_SUCCESS, ACTION_PRESSURE_FAILURE } from '../types/sphereAffinity';
import { resolveRevelationAction } from './revelationEmitter';
import { accumulateImportance, getImportanceDelta, getRarityTier } from './rarity';
import type { TraceEntry } from '../types/trace';
import type { SimulationRuntime } from './simulationRuntime';
import type { BalanceEvent } from '../types/balanceEval';
import { DEFAULT_REPUTATION } from '../types/disposition';
import { recordBalanceEvent } from './balanceTelemetry';
import { computeOutcomeConsequence } from './outcomeConsequences';
import { processFactionEncounterReputation } from './factionReputation';
import { processReputationTally } from './phaseReputationTraits';
import {
  canSpendQuintessence,
  getPushModifier,
  spendQuintessence,
  canResistOutcome,
  applyResistOutcome,
  RESIST_DOWNGRADE_CHANCE,
} from './quintessenceActions';
import { isProvingSliceTemplate } from './outcomeConsequences';
import {
  assembleRewardPool,
  BAD_OUTCOME_CATEGORY_WEIGHTS,
  drawFromPool,
  instantiateReward,
  resolveRewardRecipe,
} from './rewardPool';
import { recordReward } from './rewardHistory';
import { mulberry32 } from '../lib/prng';
import { buildPredicateContext, collectTestShapers } from './effectResolver';
import { applyClearanceGateStepOutcome, summarizeClearanceGateUpdates } from './clearanceGate';
import { getEffectiveUnifiedActionChoiceMemory } from './encounterChoiceMemory';
import type { EncounterChoiceMemory } from '../types/encounter';
import type { ClearanceGateRuntimeState, ClearanceGateState } from '../types/contentShells';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { appendDigestEntry } from './digestBuffer';
import { isNotableEntry } from './attentionTier';
import type { DigestEntry } from '../types/attention';
import { checkAndFireActionTriggers, type ActionTriggerContext } from './effects/actionTrigger';
import { collectAttachmentEffects } from './effects/effectWalker';

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
 * Phase 3: Map the shared resolver's OutcomeType to a StepOutcome.
 * Preserves the full outcome ladder instead of collapsing to binary.
 *
 * `success_at_cost` is generated when a roll succeeds but lands in the
 * near-miss zone (margin <= NEAR_MISS_MARGIN). This represents scraping
 * through with complications — the step proceeds but carries a cost.
 */
export function mapResolverOutcomeToStep(resolverOutcome: OutcomeType, nearMiss: boolean): StepOutcome {
  switch (resolverOutcome) {
    case 'critical_success': return 'critical_success';
    case 'success':
      // Near-miss success → success_at_cost (barely made it, complications follow)
      return nearMiss ? 'success_at_cost' : 'success';
    case 'success_at_cost': return 'success_at_cost';
    case 'failure': return 'failure';
    case 'critical_failure': return 'critical_failure';
  }
}

export function resolveUncontestedStep(
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  state: GameState,
  rng: () => number,
): StepResolutionResult {
  const step = resolveStepDefinition(template, action.currentStep, action.choiceHistory);
  const noPushResist = { pushAttempted: false, pushCost: 0, resistAttempted: false, resistSucceeded: false, resistCost: 0 };

  if (!step) {
    return { outcome: 'failure', rawOutcome: 'failure', opsToExecute: [], capability: 0, probability: 0, roll: 0, ...noPushResist };
  }

  // Divine actions (difficulty 0) always succeed
  if (step.difficulty === 0) {
    return { outcome: 'success', rawOutcome: 'success', opsToExecute: step.onSuccess, capability: 1, probability: 1, roll: 0, ...noPushResist };
  }

  // Ascendant (player) actions always succeed — their only gate is essence cost,
  // which is already paid at dispatch time. Capability rolls apply to NPC agents only.
  if (action.source === 'player') {
    return { outcome: 'success', rawOutcome: 'success', opsToExecute: step.onSuccess, capability: 1, probability: 1, roll: 0, ...noPushResist };
  }

  // Compute actor's domain capability for this step's reach
  const capability = computeCapability(state.graph, action.actorId, step.reach);

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
  const rememberedChoice = getEffectiveUnifiedActionChoiceMemory(
    action,
    action.currentStep,
    step.id,
  );
  const interventionBoost = rememberedChoice?.probabilityBoost ?? 0;
  let pushEvent: import('../types/quintessence').QuintessenceEvent | null = null;
  if (isPushEligible(action.templateId) && step.difficulty >= 0.3) {
    const actorNode = state.graph.getNode(action.actorId);
    if (actorNode && canSpendQuintessence(actorNode, 'push')) {
      pushModifier = getPushModifier(actorNode);
      pushEvent = spendQuintessence(actorNode, 'push', `action_push_${action.templateId}`, state.tick);
    }
  }

  // Phase 2: Use shared resolution service.
  // Unified action difficulty is already normalized (0..1) — pass through directly.
  const resolutionInput: ResolutionInput = {
    actorId: action.actorId,
    domain: step.reach,
    capability,
    difficulty: step.difficulty,
    sphereFactor,
    actionModifiers: pushModifier + interventionBoost,
    testShapers,
  };

  const result = resolveActionShared(resolutionInput, rng, undefined, 'unified_action');

  // Phase 3: If push was attempted, queue the spend event
  if (pushEvent && state.pendingQuintessenceEvents) {
    state.pendingQuintessenceEvents.push(pushEvent);
  }

  // Phase 3: Preserve the full outcome ladder
  const nearMiss = result.rollBreakdown?.nearMiss ?? false;
  let outcome = mapResolverOutcomeToStep(result.outcome, nearMiss);

  // Phase 3: Resist — social/influence actions attempt to downgrade negative outcomes.
  // After a failure or critical_failure, the actor can spend Q for a chance to soften it.
  let resistEvent: import('../types/quintessence').QuintessenceEvent | null = null;
  if (isStepFailure(outcome) && isResistEligible(action.templateId)) {
    const actorNode = state.graph.getNode(action.actorId);
    if (actorNode && canResistOutcome(actorNode)) {
      resistEvent = applyResistOutcome(actorNode, `action_resist_${action.templateId}`, state.tick);
      if (resistEvent) {
        // Deterministic resist check using seeded PRNG
        const resistRoll = rng();
        if (resistRoll < RESIST_DOWNGRADE_CHANCE) {
          // Downgrade: critical_failure → failure, failure → success_at_cost
          if (outcome === 'critical_failure') {
            outcome = 'failure';
          } else if (outcome === 'failure') {
            outcome = 'success_at_cost';
          }
        }
        if (state.pendingQuintessenceEvents) {
          state.pendingQuintessenceEvents.push(resistEvent);
        }
      }
    }
  }

  const ops = isStepSuccess(outcome) ? step.onSuccess : step.onFailure;

  return {
    outcome,
    rawOutcome: result.outcome,
    opsToExecute: ops,
    capability,
    probability: result.probability,
    roll: result.roll,
    pushAttempted: pushEvent !== null,
    pushCost: pushEvent ? Math.abs(pushEvent.delta) : 0,
    resistAttempted: resistEvent !== null,
    resistSucceeded: resistEvent !== null && outcome !== mapResolverOutcomeToStep(result.outcome, nearMiss),
    resistCost: resistEvent ? Math.abs(resistEvent.delta) : 0,
    preResistOutcome: resistEvent ? mapResolverOutcomeToStep(result.outcome, nearMiss) : undefined,
  };
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return hash;
}

function titleCaseWords(raw: string): string {
  return raw
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(part => part[0] ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ');
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
  for (const edge of state.graph.getOutgoingEdges(action.actorId, 'member_of')) {
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
 * Resolve branch-aware aftermath variant from template config and choice history.
 * Returns undefined if the template has no aftermathConfig.
 */
function resolveAftermathVariant(
  template: UnifiedActionTemplate,
  choiceHistory?: readonly EncounterChoiceMemory[],
): AftermathVariant | undefined {
  const config = template.aftermathConfig;
  if (!config) return undefined;

  const branchChoice = choiceHistory?.find(c => c.stepIndex === config.branchOnStep);
  if (!branchChoice) return config.fallback;

  return config.variants[branchChoice.choiceId] ?? config.fallback;
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
  const highlightParts: string[] = [];
  if (traitCount > 0) highlightParts.push(`${traitCount} trait change${traitCount === 1 ? '' : 's'}`);
  if (rewardCount > 0) highlightParts.push(`${rewardCount} reward${rewardCount === 1 ? '' : 's'}`);
  if (growthCount > 0) highlightParts.push(`${growthCount} skill shift${growthCount === 1 ? '' : 's'}`);
  if (hookCount > 0) highlightParts.push(`${hookCount} lasting consequence${hookCount === 1 ? '' : 's'}`);
  const outcomeText = describeActionOutcome(outcome);
  if (highlightParts.length === 0) {
    return `${actorName} ${outcomeText} ${templateName}. The scene moved on quietly, but the world still bent a little around it.`;
  }
  return `${actorName} ${outcomeText} ${templateName}. Your nudge left ${highlightParts.join(', ')} behind in the world.`;
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
        { kind: 'reputation_tally', key: 'gate_duty.witness_story_followed', delta: 1 },
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
        { kind: 'reputation_tally', key: 'gate_duty.captain_marked', delta: 1 },
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
        { kind: 'reputation_tally', key: 'gate_duty.left_to_settle', delta: 1 },
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

type GateDutyBranch = 'supportive' | 'coercive' | 'withdrawn';

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

const GATE_DUTY_BRANCH_CONSEQUENCES: Record<number, Record<GateDutyBranch, GateDutyBranchConsequence>> = {
  0: {
    supportive: {
      successTags: ['#courier_steadied'],
      failureTags: ['#borrowed_calm_slipped'],
      successDelta: 0.01,
      failureDelta: -0.005,
      successNarrative: 'The courier keeps moving as though held together by borrowed calm.',
      failureNarrative: 'The borrowed calm slips, and the line notices how close the panic was to breaking loose.',
    },
    coercive: {
      successTags: ['#captain_forced'],
      failureTags: ['#captain_shoved_too_hard'],
      successDelta: -0.005,
      failureDelta: -0.015,
      successNarrative: 'The captain acts quickly, but the line can taste the shove behind the order.',
      failureNarrative: 'The captain moves under pressure that no longer feels entirely her own.',
    },
    withdrawn: {
      successTags: ['#witness_primed'],
      failureTags: ['#witness_claimed_scene'],
      successDelta: 0,
      failureDelta: -0.01,
      successNarrative: 'The witness begins shaping the tale before the watch can settle on its own version.',
      failureNarrative: 'You preserve your strength, but the story starts leaving the gate without your hand on it.',
    },
  },
  1: {
    supportive: {
      successTags: ['#measured_seizure'],
      failureTags: ['#discipline_turned_strange'],
      successDelta: 0.02,
      failureDelta: -0.01,
      successNarrative: 'The seizure lands as discipline rather than appetite.',
      failureNarrative: 'The restraint feels strange enough that the crowd mistrusts it anyway.',
    },
    coercive: {
      successTags: ['#public_break'],
      failureTags: ['#courier_shattered_publicly'],
      successDelta: -0.02,
      failureDelta: -0.03,
      successNarrative: 'The watch gains a harsher legitimacy by stepping through the courier’s public breaking.',
      failureNarrative: 'The courier’s collapse stains the checkpoint more deeply than the cargo ever could.',
    },
    withdrawn: {
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
    supportive: {
      successTags: ['#watch_trusted', '#mercy_remembered'],
      failureTags: ['#mercy_failed_to_land'],
      successDelta: 0.03,
      failureDelta: -0.01,
      successNarrative: 'The line leaves remembering restraint.',
      failureNarrative: 'Mercy arrives too late to keep the checkpoint from feeling wounded.',
    },
    coercive: {
      successTags: ['#watch_feared', '#authority_consecrated'],
      failureTags: ['#authority_overreached'],
      successDelta: -0.03,
      failureDelta: -0.04,
      successNarrative: 'Order holds, but what remains of the evening tastes of dread.',
      failureNarrative: 'Authority wins the posture of command and loses the district’s confidence in the same breath.',
    },
    withdrawn: {
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

  const currentStep = resolveStepDefinition(template, action.currentStep, action.choiceHistory);
  if (!currentStep) {
    return { clearanceGateStates: nextStates, reputationDelta: 0, suffix: '' };
  }

  const rememberedChoice = getEffectiveUnifiedActionChoiceMemory(
    action,
    action.currentStep,
    currentStep.id,
  );
  if (!rememberedChoice) {
    return { clearanceGateStates: nextStates, reputationDelta: 0, suffix: '' };
  }

  const branch = rememberedChoice.interventionType as GateDutyBranch;
  const branchConfig = GATE_DUTY_BRANCH_CONSEQUENCES[action.currentStep]?.[branch];
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
      return 'success';
  }
}

function resolveUnifiedReward(
  action: UnifiedAction,
  outcome: StepOutcome,
  metadata: ActionStepOutcomeMetadata | undefined,
  state: GameState,
  tick: number,
  runtime?: SimulationRuntime,
): string | undefined {
  if (!metadata?.rewardPool) return undefined;

  const rng = mulberry32(
    state.seed + tick * 41 + hashString(action.actorId) + hashString(action.templateId),
  );
  const resolved = resolveRewardRecipe(
    metadata.rewardPool,
    mapStepOutcomeToRewardOutcome(outcome),
  );

  const badRoll = rng();
  const isBadOutcome = badRoll < resolved.badOutcomeChance;
  const effectiveRecipe = isBadOutcome
    ? { ...resolved, categoryWeights: BAD_OUTCOME_CATEGORY_WEIGHTS, tagFilters: undefined }
    : resolved;
  const pool = assembleRewardPool(state.graph, effectiveRecipe);
  const actorName = state.graph.getNode(action.actorId)?.name ?? '?';

  if (pool.length === 0) {
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

  const drawRoll = rng();
  const templateId = drawFromPool(pool, drawRoll);
  if (!templateId) return undefined;

  const instantiation = instantiateReward(state.graph, templateId, action.actorId, tick);
  if (!instantiation) return undefined;

  const templateNode = state.graph.getNode(templateId);
  const tier = (templateNode?.properties?.tier as number) ?? 1;

  recordReward({
    tick,
    agentId: action.actorId,
    agentName: actorName,
    encounterId: action.templateId,
    templateId,
    templateName: templateNode?.name ?? '?',
    instanceId: instantiation.instanceId,
    category: instantiation.category,
    tier,
    isBadOutcome,
    poolSize: pool.length,
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
      rewardTier: tier,
      isBadOutcome,
      rewardPoolSize: pool.length,
    });
  }

  return instantiation.displayName;
}

/**
 * Execute the resolution result for a completed step:
 * 1. Execute the step's GraphOps
 * 2. Advance the action to the next step or mark resolved
 * 3. Generate tick events and traces
 *
 * Returns the updated action and any events generated.
 */
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

  // Execute GraphOps (fail-soft)
  if (ops.length > 0) {
    const ctx = {
      actorId: action.actorId,
      targetId: action.targetId,
      locationId: action.targetId, // default — caller can override
      tick,
    };

    try {
      executeGraphOps(state.graph, [...ops], ctx);
    } catch {
      // Fail-soft: log but don't crash
    }
  }

  // Phase 3: Compute differentiated consequences for the proving slice
  const consequence = computeOutcomeConsequence(
    action.templateId, outcome, action.actorId, tick,
  );

  // Phase 3: Queue quintessence effect from outcome consequence
  if (consequence.quintessenceEvent && state.pendingQuintessenceEvents) {
    state.pendingQuintessenceEvents.push(consequence.quintessenceEvent);
  }

  // Apply capability growth from step resolution
  const step = resolveStepDefinition(template, action.currentStep, action.choiceHistory);
  const stepMetadata = getStepOutcomeMetadata(step, outcome);
  const metadataReputationDelta = applyOutcomeReputationDelta(state, action.actorId, stepMetadata);
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
          id: `ua_${action.actionId}_promotion`,
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

  // Advance step or complete action
  let finalAction = advanceStep(action, outcome, template, rng);
  const rewardName = finalAction.resolved
    ? resolveUnifiedReward(action, outcome, stepMetadata, state, tick, runtime)
    : undefined;

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
  }

  const aftermathChanges: EncounterAftermathChange[] = [];
  const actorName = beforeSnapshot.actorName;
  if (growthApplied > 0 && growthDomain) {
    const tierShift = growthTierFrom != null && growthTierTo != null && growthTierTo > growthTierFrom
      ? ` Tier ${growthTierFrom} -> ${growthTierTo}.`
      : '';
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:growth:${growthDomain}`,
      kind: 'growth',
      title: `${titleCaseWords(growthDomain)} grew`,
      detail: `${actorName} gained ${growthApplied.toFixed(2)} ${growthDomain} growth.${tierShift}`,
      polarity: 'gain',
      actorId: action.actorId,
      actorName,
    });
  }
  if (promotionTraitGranted) {
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:trait:${promotionTraitGranted}`,
      kind: 'trait',
      title: 'A new trait surfaced',
      detail: `${actorName} gained the trait "${promotionTraitGranted}".`,
      polarity: 'gain',
      actorId: action.actorId,
      actorName,
    });
  }

  // Add explicit authored reputation shifts before we collapse to the final snapshot.
  if (Math.abs(metadataReputationDelta) > 0.0001) {
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:reputation:authored`,
      kind: 'reputation',
      title: 'Your standing shifted',
      detail: `${actorName}'s authored reputation moved by ${metadataReputationDelta > 0 ? '+' : ''}${metadataReputationDelta.toFixed(3)}.`,
      polarity: metadataReputationDelta > 0 ? 'gain' : 'loss',
      actorId: action.actorId,
      actorName,
    });
  }
  if (Math.abs(branchConsequence.reputationDelta) > 0.0001) {
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:reputation:branch`,
      kind: 'reputation',
      title: 'The checkpoint judged the intervention',
      detail: `${actorName}'s standing bent by ${branchConsequence.reputationDelta > 0 ? '+' : ''}${branchConsequence.reputationDelta.toFixed(3)} as the branch consequences landed.`,
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

      // Fire action_complete for any completed action
      const acResult = checkAndFireActionTriggers(attachedEffects, 'action_complete', triggerCtx, effectStates);

      // Also fire encounter_success/encounter_failure for multi-step (encounter-like) templates
      const isEncounterTemplate = template.steps.length > 1;
      let finalTriggerResult = acResult;
      if (isEncounterTemplate) {
        const encEvent = isStepSuccess(outcome) ? 'encounter_success' : 'encounter_failure';
        finalTriggerResult = checkAndFireActionTriggers(
          attachedEffects,
          encEvent,
          { ...triggerCtx, agentResources: { ...triggerCtx.agentResources } },
          acResult.updatedStates,
        );
      }

      if (finalTriggerResult.firedCount > 0 || acResult.firedCount > 0) {
        const allDeltas = [...acResult.resourceDeltas, ...finalTriggerResult.resourceDeltas];
        for (const delta of allDeltas) {
          (tProps as Record<string, number>)[delta.resource] = delta.after;
        }
        if (allDeltas.length > 0) {
          state.graph.updateNode(action.actorId, { properties: tProps });
        }
        const allTraces = [...acResult.traces, ...finalTriggerResult.traces];
        for (const trace of allTraces) {
          emitTrace({ category: 'effect_reaction', tick: state.tick, event: 'action_trigger_fired', ...trace } as unknown as TraceEntry);
        }
        if (!state.effectStates) state.effectStates = new Map();
        for (const [k, v] of finalTriggerResult.updatedStates) {
          state.effectStates.set(k, v);
        }
      }
    }
  }

  // Generate tick event
  const actorNode = state.graph.getNode(action.actorId);
  const currentActorName = actorNode?.name ?? actorName;
  if (rewardName) {
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:item:${rewardName}`,
      kind: 'item',
      title: isStepSuccess(outcome) ? 'A reward changed hands' : 'The scene cost something tangible',
      detail: isStepSuccess(outcome)
        ? `${currentActorName} gained ${rewardName}.`
        : `${currentActorName} came away marked by ${rewardName}.`,
      polarity: isStepSuccess(outcome) ? 'gain' : 'loss',
      actorId: action.actorId,
      actorName: currentActorName,
    });
  }

  const finalSnapshot = snapshotEncounterResolutionContext(state, action);
  const reputationDelta = finalSnapshot.reputationScore - beforeSnapshot.reputationScore;
  if (Math.abs(reputationDelta) > 0.0001 && Math.abs(reputationDelta - metadataReputationDelta - branchConsequence.reputationDelta) > 0.0001) {
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:reputation`,
      kind: 'reputation',
      title: 'Personal reputation shifted',
      detail: `${currentActorName}'s standing changed by ${reputationDelta > 0 ? '+' : ''}${reputationDelta.toFixed(3)}.`,
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
    const rankText = rankChanged
      ? ` Rank: ${beforeMembership.role ?? 'member'} -> ${afterMembership.role ?? 'member'}.`
      : '';
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:faction:${factionId}`,
      kind: 'faction_reputation',
      title: `${afterMembership.factionName} changed its measure`,
      detail: `${currentActorName}'s standing with ${afterMembership.factionName} shifted by ${delta > 0 ? '+' : ''}${delta.toFixed(3)}.${rankText}`,
      polarity: delta > 0 ? 'gain' : delta < 0 ? 'loss' : 'mixed',
      actorId: action.actorId,
      actorName: currentActorName,
    });
  }

  const tallyKeys = new Set([
    ...Object.keys(beforeSnapshot.reputationTallies),
    ...Object.keys(finalSnapshot.reputationTallies),
  ]);
  for (const key of tallyKeys) {
    const beforeValue = beforeSnapshot.reputationTallies[key] ?? 0;
    const afterValue = finalSnapshot.reputationTallies[key] ?? 0;
    const delta = afterValue - beforeValue;
    if (Math.abs(delta) <= 0.0001) continue;
    aftermathChanges.push({
      id: `${action.actionId}:step:${action.currentStep}:tally:${key}`,
      kind: 'reputation_tally',
      title: 'Reputation memory deepened',
      detail: `${currentActorName}'s ${key} tally shifted by ${delta > 0 ? '+' : ''}${delta.toFixed(2)}.`,
      polarity: delta > 0 ? 'gain' : 'loss',
      actorId: action.actorId,
      actorName: currentActorName,
    });
  }

  for (const [runtimeId, afterGate] of finalSnapshot.clearanceGates.entries()) {
    const beforeGate = beforeSnapshot.clearanceGates.get(runtimeId);
    if (!beforeGate) continue;
    if (afterGate.state !== beforeGate.state) {
      aftermathChanges.push({
        id: `${action.actionId}:step:${action.currentStep}:gate:${runtimeId}:state`,
        kind: 'shell_state',
        title: 'The checkpoint changed state',
        detail: `The gate shifted from ${titleCaseWords(beforeGate.state)} to ${titleCaseWords(afterGate.state)}.`,
        polarity: 'info',
      });
    }
    const newTags = afterGate.followOnTags.filter(tag => !beforeGate.followOnTags.includes(tag));
    for (const tag of newTags) {
      aftermathChanges.push({
        id: `${action.actionId}:step:${action.currentStep}:gate:${runtimeId}:tag:${tag}`,
        kind: 'future_hook',
        title: 'A follow-on thread was seeded',
        detail: `The gate leaves behind ${tag.replace(/^#/, '').replace(/_/g, ' ')}.`,
        polarity: 'info',
      });
    }
  }

  finalAction = appendAftermathChanges(finalAction, aftermathChanges);
  if (finalAction.resolved && finalAction.outcome) {
    const changes = finalAction.aftermathChanges ?? [];

    // Branch-aware aftermath: if the template has an aftermathConfig,
    // resolve the variant from choice history and use its authored content.
    const aftermathVariant = resolveAftermathVariant(template, finalAction.choiceHistory);

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
      reactionPrompt: aftermathVariant?.reactionPrompt
        ?? (reactions && reactions.length > 0
          ? 'Choose which consequence thread you keep alive now that the encounter itself is over.'
          : changes.length > 0
            ? 'Take stock of what shifted. The encounter is over, but the consequences are now loose in the world.'
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
    events.push({
      id: `ua_${action.actionId}_resolved`,
      tick,
      type: 'agent_action_resolved',
      message: `${currentActorName} ${outcomeMsg} ${template.name}${metadataSuffix}${clearanceSuffix}.`,
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
    events.push({
      id: `ua_${action.actionId}_step${stepNum}`,
      tick,
      type: 'agent_action_resolved',
      message: `${actorName} ${stepVerb} in ${template.name} (step ${stepNum}/${totalSteps})${metadataSuffix}${clearanceSuffix}.`,
      significance: stepSignificance,
      actorId: action.actorId,
    });
  }

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
    case 'failure': return 'stumbles';
    case 'critical_failure': return 'falters badly';
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
  const contestPairs = detectContestations(completing, templates);
  const contestedIds = new Set<string>();

  for (const pair of contestPairs) {
    const attacker = actions.find((a) => a.actionId === pair.attackerActionId);
    const defender = actions.find((a) => a.actionId === pair.defenderActionId);
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

    // Replace in actions array
    actions = actions.map((a) => {
      if (a.actionId === updAtk.actionId) return updAtk;
      if (a.actionId === updDef.actionId) return updDef;
      return a;
    });

    // Spawn ControlEffect for contested winners (TB-044)
    if (updAtk.resolved && isActionSuccess(updAtk.outcome) && atkTemplate.durationMode === 'sustained') {
      const spawnResult = spawnControlEffect(updAtk, atkTemplate, state.tick);
      if (spawnResult) {
        spawnedEffects.push(spawnResult.effect);
        events.push(spawnResult.event);
      }
    }
    if (updDef.resolved && isActionSuccess(updDef.outcome) && defTemplate.durationMode === 'sustained') {
      const spawnResult = spawnControlEffect(updDef, defTemplate, state.tick);
      if (spawnResult) {
        spawnedEffects.push(spawnResult.effect);
        events.push(spawnResult.event);
      }
    }

    // Sphere pressure: contested action resolutions also push pressure
    if (updAtk.resolved && atkTemplate.sphereAffinity && attacker.targetId) {
      spherePressures.push({
        targetEntityId: attacker.targetId,
        sphere: atkTemplate.sphereAffinity,
        magnitude: isActionSuccess(updAtk.outcome) ? ACTION_PRESSURE_SUCCESS : ACTION_PRESSURE_FAILURE,
        source: 'divine_action',
        sourceId: attacker.actionId,
      });
    }
    if (updDef.resolved && defTemplate.sphereAffinity && defender.targetId) {
      spherePressures.push({
        targetEntityId: defender.targetId,
        sphere: defTemplate.sphereAffinity,
        magnitude: isActionSuccess(updDef.outcome) ? ACTION_PRESSURE_SUCCESS : ACTION_PRESSURE_FAILURE,
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

    // Spawn ControlEffect for successful sustained actions (TB-044)
    if (updatedAction.resolved && isActionSuccess(updatedAction.outcome)) {
      const spawnResult = spawnControlEffect(updatedAction, template, state.tick);
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
