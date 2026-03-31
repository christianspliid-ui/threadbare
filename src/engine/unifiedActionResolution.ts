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
  UnifiedAction,
  UnifiedActionTemplate,
  StepOutcome,
} from '../types/unifiedAction';
import type { GraphOp } from '../types/graphOp';
import {
  progressUnifiedAction,
  isStepComplete,
  advanceStep,
  sortByPriority,
} from './unifiedActionLifecycle';
import { computeCapability } from './domainCapability';
import { resolveAction } from './resolution';
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
  opsToExecute: readonly GraphOp[];
  capability: number;
  probability: number;
  roll: number;
}

export function resolveUncontestedStep(
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  state: GameState,
  rng: () => number,
): StepResolutionResult {
  const step = template.steps[action.currentStep];
  if (!step) {
    // Defensive — should never happen if template is valid
    return { outcome: 'failure', opsToExecute: [], capability: 0, probability: 0, roll: 0 };
  }

  // Divine actions (difficulty 0) always succeed
  if (step.difficulty === 0) {
    return { outcome: 'success', opsToExecute: step.onSuccess, capability: 1, probability: 1, roll: 0 };
  }

  // Compute actor's domain capability for this step's reach
  const capability = computeCapability(state.graph, action.actorId, step.reach);

  // Sphere factor: small bonus if actor's location has sphere influence
  // (simplified — full implementation would check location sphere influence)
  const sphereFactor = 0;

  // Compute probability and resolve
  const probability = Math.min(0.95, Math.max(0.05,
    capability + sphereFactor - step.difficulty,
  ));

  // Use seeded RNG for the d100 roll (1-100 range)
  const roll = Math.floor(rng() * 100) + 1;
  const result = resolveAction(probability, roll);

  const isSuccess = result.outcome === 'success' || result.outcome === 'critical_success';
  const outcome: StepOutcome = isSuccess ? 'success' : 'failure';
  const ops = isSuccess ? step.onSuccess : step.onFailure;

  return { outcome, opsToExecute: ops, capability, probability, roll };
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
): { updatedAction: UnifiedAction; events: TickEvent[] } {
  const events: TickEvent[] = [];

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

  // Apply capability growth from step resolution
  const step = template.steps[action.currentStep];
  if (step) {
    // Unified action difficulty is 0-1; scale to 0-100 for growth computation
    const difficultyScaled = step.difficulty * 100;
    const isSuccess = outcome === 'success';
    const growthResult = applyEncounterGrowth(
      state.graph,
      action.actorId,
      step.reach,
      difficultyScaled,
      isSuccess,
      false, // Unified actions don't have tierPromotionEligible yet
    );

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
        events.push({
          id: `ua_${action.actionId}_promotion`,
          tick,
          type: 'tier_promotion',
          message: `${agentName} reached ${step.reach} tier ${growthResult.newTier}: "${promotion.traitGranted}"`,
          significance: 0.8,
          actorId: action.actorId,
        });
      }
    }
  }

  // Advance step or complete action
  const updatedAction = advanceStep(action, outcome, template, rng);

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
      result: outcome === 'success' ? 'PASS' : 'FAIL',
    });
  }

  // Timeline: ACTION_END event when action fully resolves
  if (updatedAction.resolved) {
    appendEvent(action.actorId, {
      phase: 'ACTION_END',
      tick,
      template: template.name,
      status: updatedAction.outcome ?? 'unknown',
      stepResults: updatedAction.stepOutcomes.map(o => o === 'success' ? 'P' : 'F').join(''),
    });
  }

  // Generate tick event
  const actorNode = state.graph.getNode(action.actorId);
  const actorName = actorNode?.name ?? 'An agent';

  if (updatedAction.resolved) {
    events.push({
      id: `ua_${action.actionId}_resolved`,
      tick,
      type: 'agent_action_resolved',
      message: `${actorName} ${updatedAction.outcome === 'success' ? 'completed' : 'failed'} ${template.name}.`,
      significance: updatedAction.outcome === 'success' ? 0.6 : 0.4,
      actorId: action.actorId,
    });
  } else {
    // Multi-step: report step progression
    const stepNum = action.currentStep + 1;
    const totalSteps = template.steps.length;
    events.push({
      id: `ua_${action.actionId}_step${stepNum}`,
      tick,
      type: 'agent_action_resolved',
      message: `${actorName} ${outcome === 'success' ? 'progresses' : 'stumbles'} in ${template.name} (step ${stepNum}/${totalSteps}).`,
      significance: 0.5,
      actorId: action.actorId,
    });
  }

  return { updatedAction, events };
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
): Partial<GameState> {
  const events: TickEvent[] = [];
  const hexMutations: HexMutation[] = [];
  const revelationMutations: RevelationMutation[] = [];
  const spawnedEffects: ControlEffect[] = [];
  const spherePressures: SpherePressureEvent[] = [];

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

    const atkTemplate = templates.find((t) => t.id === attacker.templateId);
    const defTemplate = templates.find((t) => t.id === defender.templateId);
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
    );

    // Apply defender outcome
    const defOps = contestResult.defenderOutcome === 'success'
      ? (defTemplate.steps[defender.currentStep]?.onSuccess ?? [])
      : (defTemplate.steps[defender.currentStep]?.onFailure ?? []);
    const { updatedAction: updDef, events: defEvents } = executeStepResult(
      defender, defTemplate, contestResult.defenderOutcome, defOps, state, rng, state.tick,
    );

    // Replace in actions array
    actions = actions.map((a) => {
      if (a.actionId === updAtk.actionId) return updAtk;
      if (a.actionId === updDef.actionId) return updDef;
      return a;
    });

    // Spawn ControlEffect for contested winners (TB-044)
    if (updAtk.resolved && updAtk.outcome === 'success' && atkTemplate.durationMode === 'sustained') {
      const spawnResult = spawnControlEffect(updAtk, atkTemplate, state.tick);
      if (spawnResult) {
        spawnedEffects.push(spawnResult.effect);
        events.push(spawnResult.event);
      }
    }
    if (updDef.resolved && updDef.outcome === 'success' && defTemplate.durationMode === 'sustained') {
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
        magnitude: updAtk.outcome === 'success' ? ACTION_PRESSURE_SUCCESS : ACTION_PRESSURE_FAILURE,
        source: 'divine_action',
        sourceId: attacker.actionId,
      });
    }
    if (updDef.resolved && defTemplate.sphereAffinity && defender.targetId) {
      spherePressures.push({
        targetEntityId: defender.targetId,
        sphere: defTemplate.sphereAffinity,
        magnitude: updDef.outcome === 'success' ? ACTION_PRESSURE_SUCCESS : ACTION_PRESSURE_FAILURE,
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
    const template = templates.find((t) => t.id === completing_action.templateId);
    if (!template) continue; // fail-soft: skip unknown template

    // Resolve step
    const { outcome, opsToExecute, capability, probability, roll } = resolveUncontestedStep(
      completing_action, template, state, rng,
    );

    // Execute and advance
    const { updatedAction, events: stepEvents } = executeStepResult(
      completing_action, template, outcome, opsToExecute, state, rng, state.tick,
      { capability, probability, roll },
    );

    // If this action targets a hex, route through hexActionBridge to get mutations
    if (
      completing_action.targetId &&
      isHexTargetId(completing_action.targetId) &&
      updatedAction.resolved
    ) {
      const coords = parseHexTargetId(completing_action.targetId);
      if (coords) {
        const finalOutcome = updatedAction.outcome === 'success' ? 'success' : 'failure';
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

    // Spawn ControlEffect for successful sustained actions (TB-044)
    if (updatedAction.resolved && updatedAction.outcome === 'success') {
      const spawnResult = spawnControlEffect(updatedAction, template, state.tick);
      if (spawnResult) {
        spawnedEffects.push(spawnResult.effect);
        events.push(spawnResult.event);
      }
    }

    // Revelation actions: if template has revelationAction metadata, dispatch
    // to resolveRevelationAction on successful resolution. Fail-soft wrapped.
    if (updatedAction.resolved && updatedAction.outcome === 'success' && template.revelationAction) {
      try {
        resolveRevelationAction(template.revelationAction, state, completing_action.targetId);
      } catch (revelationErr) {
        console.warn('[unifiedActionResolution] revelation action error:', revelationErr);
      }
    }

    // Sphere pressure: push pressure on action's target entity on resolution.
    // Fail-soft: skip if template has no sphereAffinity or action has no targetId.
    if (updatedAction.resolved && template.sphereAffinity && completing_action.targetId) {
      const magnitude = updatedAction.outcome === 'success'
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

    // Replace action in array
    actions = actions.map((a) =>
      a.actionId === updatedAction.actionId ? updatedAction : a,
    );

    events.push(...stepEvents);
  }

  return {
    unifiedActions: actions,
    tickEvents: [...state.tickEvents, ...events],
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
