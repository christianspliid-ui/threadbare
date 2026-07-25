/**
 * Action Trigger — fires payloads when the owning agent performs specific actions.
 *
 * Different from reactive effects (which fire on things happening *to* the agent).
 * This fires on things the agent *does*: encounter outcomes, movement, spells, rest.
 *
 * Eligibility: event matches + condition passes + not on cooldown + fires remaining.
 * Payload execution: resource_delta, content_grant, or trace_only.
 *
 * TB-104 Phase 1B
 */

import type {
  ActionTriggerEffect,
  ActionTriggerEvent,
  ActionTriggerFiredTraceDetails,
  EffectRuntimeState,
  PredicateContext,
} from '../../types/effects';
import type { ActionTriggerPayload } from '../../types/effects';
import type { StepOutcome } from '../../types/unifiedAction';
import type { AttachedEffect } from './effectWalker';
import { applyResourceDelta, type ResourceDeltaInput } from './resourceDelta';
import { evaluateOptionalCondition } from './effectPredicates';
import {
  ACTION_TRIGGER_DEFAULT_COOLDOWN,
  ACTION_TRIGGER_DEFAULT_PROBABILITY,
} from '../../data/effect-constants';

export interface ActionTriggerContext {
  agentId: string;
  tick: number;
  agentResources: ResourceDeltaInput;
  predicateContext?: PredicateContext;
  /**
   * Seeded roll source for `probability` guards — NEVER `Math.random()` (NFP #3).
   * Call sites thread their resolution `rng`, or a `mulberry32` seeded on
   * (seed, tick, agentId). Absent = probability guards fail OPEN (the trigger
   * fires). Fail-open is deliberate: this whole primitive exists because triggers
   * that silently never fired shipped for months (THR-719).
   */
  nextRoll?: () => number;
  /** Narrative substitution tokens. Missing tokens render empty, as the legacy resolver did. */
  actorName?: string;
  targetName?: string;
  locationName?: string;
}

/** A graph-affecting payload that fired and awaits application by the caller. */
export interface ActionTriggerPayloadIntent {
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly payload: ActionTriggerPayload;
  readonly narrative?: string;
}

export interface ActionTriggerResult {
  firedCount: number;
  resourceDeltas: Array<{ resource: string; before: number; after: number }>;
  traces: ActionTriggerFiredTraceDetails[];
  updatedStates: Map<string, EffectRuntimeState>;
  /**
   * Graph mutations the caller must apply (`condition_grant` / `condition_remove` /
   * `self_remove`). Kept out of this module so the resolver stays pure — the same
   * contract the retired `attachmentTriggers.ts` had, now on the live path.
   */
  payloadIntents: ActionTriggerPayloadIntent[];
  /** Substituted prose from fired triggers, for the narrative-event path. */
  narratives: string[];
}

/**
 * Map one six-band `StepOutcome` onto the events it fires.
 *
 * WIDENING, not partitioning: `critical_success` fires its own band AND
 * `encounter_success`, so content authored before the bands existed (e.g. the
 * shipped Battle Spoils Talisman on `encounter_success`) keeps its exact prior
 * behavior — which was `isStepSuccess(outcome) ? success : failure`. Removing the
 * coarse event from these lists would silently narrow shipped items (THR-719).
 */
export function ladderEventsFor(outcome: StepOutcome): readonly ActionTriggerEvent[] {
  switch (outcome) {
    case 'critical_success':
      return ['encounter_critical_success', 'encounter_success'];
    case 'success':
      return ['encounter_success'];
    // `near_miss` counts as a success to `isStepSuccess` but is a scraped one —
    // it earns the at-cost band alongside the coarse success it always fired.
    case 'success_at_cost':
    case 'near_miss':
      return ['encounter_at_cost', 'encounter_success'];
    case 'failure':
      return ['encounter_failure'];
    case 'critical_failure':
      return ['encounter_critical_failure', 'encounter_failure'];
  }
}

/** Substitute the legacy prose tokens. Unknown/missing tokens render empty. */
function substituteNarrative(template: string, ctx: ActionTriggerContext, itemName: string): string {
  return template
    .replace(/\{actor\}/g, ctx.actorName ?? '')
    .replace(/\{item_name\}/g, itemName)
    .replace(/\{target\}/g, ctx.targetName ?? '')
    .replace(/\{location\}/g, ctx.locationName ?? '');
}

export function checkAndFireActionTriggers(
  effects: readonly AttachedEffect[],
  event: ActionTriggerEvent,
  ctx: ActionTriggerContext,
  effectStates: ReadonlyMap<string, EffectRuntimeState>,
): ActionTriggerResult {
  const resourceDeltas: ActionTriggerResult['resourceDeltas'] = [];
  const traces: ActionTriggerFiredTraceDetails[] = [];
  const payloadIntents: ActionTriggerPayloadIntent[] = [];
  const narratives: string[] = [];
  const updatedStates = new Map(effectStates);
  let firedCount = 0;

  for (const entry of effects) {
    if (entry.effect.type !== 'action_trigger') continue;
    const trigger = entry.effect as ActionTriggerEffect;

    // Event match
    if (trigger.on !== event) continue;

    // Condition predicate check
    if (!evaluateOptionalCondition(trigger.condition, ctx.predicateContext)) continue;

    // State check: cooldown + fire count
    const state = updatedStates.get(entry.attachmentId) ?? {};
    const fireCount = state.actionTriggerFireCount ?? 0;
    const cooldownUntil = state.actionTriggerCooldownUntil ?? 0;

    // Fires exhausted
    if (trigger.maxFires !== undefined && fireCount >= trigger.maxFires) continue;

    // Still on cooldown
    if (cooldownUntil > ctx.tick) continue;

    // Probability guard (THR-719). Non-numeric/absent → the always-fires default.
    // Rolled LAST, after every cheap eligibility gate, so ineligible triggers never
    // consume a draw — otherwise cooldown state would perturb the seeded stream and
    // break same-seed reproducibility (NFP #3).
    const probability = typeof trigger.probability === 'number' && Number.isFinite(trigger.probability)
      ? trigger.probability
      : ACTION_TRIGGER_DEFAULT_PROBABILITY;
    if (probability < 1) {
      // Fail-open when no seeded roll source was threaded — see ActionTriggerContext.
      const roll = ctx.nextRoll ? ctx.nextRoll() : 0;
      if (roll >= probability) continue;
    }

    // Fire the payload
    const cooldownTicks = trigger.cooldownTicks ?? ACTION_TRIGGER_DEFAULT_COOLDOWN;
    const newFireCount = fireCount + 1;
    const newCooldownUntil = ctx.tick + cooldownTicks;

    // Execute payload
    if (trigger.payload.kind === 'resource_delta') {
      const deltaEffect = {
        type: 'resource_delta' as const,
        resource: trigger.payload.resource,
        amount: trigger.payload.amount,
      };
      const deltaResult = applyResourceDelta(
        deltaEffect,
        ctx.agentResources,
        ctx.agentId,
        'action_trigger',
        entry.attachmentId,
      );
      if (deltaResult.applied) {
        resourceDeltas.push({
          resource: trigger.payload.resource,
          before: deltaResult.trace.before,
          after: deltaResult.after,
        });
        // Update running resources for subsequent triggers in the same batch
        (ctx.agentResources as Record<string, number>)[trigger.payload.resource] = deltaResult.after;
      }
    }
    // content_grant and trace_only: no resource changes, just trace

    // Graph-affecting payloads are returned as intents — this resolver stays pure.
    const narrative = trigger.narrativeTemplate
      ? substituteNarrative(trigger.narrativeTemplate, ctx, entry.attachmentName)
      : undefined;

    if (
      trigger.payload.kind === 'condition_grant'
      || trigger.payload.kind === 'condition_remove'
      || trigger.payload.kind === 'self_remove'
    ) {
      payloadIntents.push({
        attachmentId: entry.attachmentId,
        attachmentName: entry.attachmentName,
        payload: trigger.payload,
        narrative,
      });
    }

    if (narrative) narratives.push(narrative);

    const firesRemaining = trigger.maxFires !== undefined
      ? trigger.maxFires - newFireCount
      : undefined;

    traces.push({
      actorId: ctx.agentId,
      attachmentId: entry.attachmentId,
      attachmentName: entry.attachmentName,
      event,
      payloadKind: trigger.payload.kind,
      firesRemaining,
      cooldownUntilTick: newCooldownUntil,
      probability: probability < 1 ? probability : undefined,
      narrative,
    });

    // Update state
    updatedStates.set(entry.attachmentId, {
      ...state,
      actionTriggerFireCount: newFireCount,
      actionTriggerCooldownUntil: newCooldownUntil,
    });

    firedCount++;
  }

  return { firedCount, resourceDeltas, traces, updatedStates, payloadIntents, narratives };
}
