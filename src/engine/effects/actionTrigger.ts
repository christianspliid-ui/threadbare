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
} from '../../types/effects';
import type { AttachedEffect } from './effectWalker';
import { applyResourceDelta, type ResourceDeltaInput } from './resourceDelta';
import { ACTION_TRIGGER_DEFAULT_COOLDOWN } from '../../data/effect-constants';

export interface ActionTriggerContext {
  agentId: string;
  tick: number;
  agentResources: ResourceDeltaInput;
}

export interface ActionTriggerResult {
  firedCount: number;
  resourceDeltas: Array<{ resource: string; before: number; after: number }>;
  traces: ActionTriggerFiredTraceDetails[];
  updatedStates: Map<string, EffectRuntimeState>;
}

export function checkAndFireActionTriggers(
  effects: readonly AttachedEffect[],
  event: ActionTriggerEvent,
  ctx: ActionTriggerContext,
  effectStates: ReadonlyMap<string, EffectRuntimeState>,
): ActionTriggerResult {
  const resourceDeltas: ActionTriggerResult['resourceDeltas'] = [];
  const traces: ActionTriggerFiredTraceDetails[] = [];
  const updatedStates = new Map(effectStates);
  let firedCount = 0;

  for (const entry of effects) {
    if (entry.effect.type !== 'action_trigger') continue;
    const trigger = entry.effect as ActionTriggerEffect;

    // Event match
    if (trigger.on !== event) continue;

    // State check: cooldown + fire count
    const state = updatedStates.get(entry.attachmentId) ?? {};
    const fireCount = state.actionTriggerFireCount ?? 0;
    const cooldownUntil = state.actionTriggerCooldownUntil ?? 0;

    // Fires exhausted
    if (trigger.maxFires !== undefined && fireCount >= trigger.maxFires) continue;

    // Still on cooldown
    if (cooldownUntil > ctx.tick) continue;

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
        ctx.tick,
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
    });

    // Update state
    updatedStates.set(entry.attachmentId, {
      ...state,
      actionTriggerFireCount: newFireCount,
      actionTriggerCooldownUntil: newCooldownUntil,
    });

    firedCount++;
  }

  return { firedCount, resourceDeltas, traces, updatedStates };
}
