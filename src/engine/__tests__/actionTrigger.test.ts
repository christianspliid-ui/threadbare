import { describe, it, expect } from 'vitest';
import { checkAndFireActionTriggers, type ActionTriggerContext } from '../effects/actionTrigger';
import type { ActionTriggerEffect, EffectRuntimeState } from '../../types/effects';
import type { AttachedEffect } from '../effects/effectWalker';

function makeAttachedTrigger(
  attachmentId: string,
  trigger: ActionTriggerEffect,
  runtimeState?: EffectRuntimeState,
): AttachedEffect {
  return {
    attachmentId,
    attachmentName: `Test ${attachmentId}`,
    attachmentTier: 1,
    effect: trigger,
    runtimeState,
  };
}

describe('checkAndFireActionTriggers', () => {
  const baseCtx: ActionTriggerContext = {
    agentId: 'agent-1',
    tick: 10,
    agentResources: { essence: 50, quintessence: 80, quintessenceMax: 100, doom: 20, doomThreshold: 100 },
  };

  it('fires a matching trigger and returns resource_delta result', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'encounter_success',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
    };
    const effects = [makeAttachedTrigger('att-1', trigger)];
    const states = new Map<string, EffectRuntimeState>();

    const result = checkAndFireActionTriggers(effects, 'encounter_success', baseCtx, states);

    expect(result.firedCount).toBe(1);
    expect(result.resourceDeltas).toHaveLength(1);
    expect(result.resourceDeltas[0].resource).toBe('essence');
    expect(result.resourceDeltas[0].after).toBe(55);
    expect(result.traces).toHaveLength(1);
  });

  it('does not fire when event does not match', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'movement_complete',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
    };
    const effects = [makeAttachedTrigger('att-1', trigger)];
    const states = new Map<string, EffectRuntimeState>();

    const result = checkAndFireActionTriggers(effects, 'encounter_success', baseCtx, states);

    expect(result.firedCount).toBe(0);
    expect(result.resourceDeltas).toHaveLength(0);
  });

  it('respects cooldown — does not fire if cooldown has not expired', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'encounter_success',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
      cooldownTicks: 6,
    };
    const effects = [makeAttachedTrigger('att-1', trigger, {
      actionTriggerCooldownUntil: 15,
      actionTriggerFireCount: 1,
    })];
    const states = new Map<string, EffectRuntimeState>([
      ['att-1', { actionTriggerCooldownUntil: 15, actionTriggerFireCount: 1 }],
    ]);

    const result = checkAndFireActionTriggers(effects, 'encounter_success', { ...baseCtx, tick: 10 }, states);
    expect(result.firedCount).toBe(0);
  });

  it('fires when cooldown has expired', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'encounter_success',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
      cooldownTicks: 6,
    };
    const effects = [makeAttachedTrigger('att-1', trigger, {
      actionTriggerCooldownUntil: 8,
      actionTriggerFireCount: 1,
    })];
    const states = new Map<string, EffectRuntimeState>([
      ['att-1', { actionTriggerCooldownUntil: 8, actionTriggerFireCount: 1 }],
    ]);

    const result = checkAndFireActionTriggers(effects, 'encounter_success', { ...baseCtx, tick: 10 }, states);
    expect(result.firedCount).toBe(1);
  });

  it('respects maxFires — does not fire when exhausted', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'encounter_success',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
      maxFires: 3,
    };
    const effects = [makeAttachedTrigger('att-1', trigger, { actionTriggerFireCount: 3 })];
    const states = new Map<string, EffectRuntimeState>([
      ['att-1', { actionTriggerFireCount: 3 }],
    ]);

    const result = checkAndFireActionTriggers(effects, 'encounter_success', baseCtx, states);
    expect(result.firedCount).toBe(0);
  });

  it('updates state with new fire count and cooldown', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'encounter_success',
      payload: { kind: 'resource_delta', resource: 'essence', amount: 5 },
      cooldownTicks: 10,
      maxFires: 5,
    };
    const effects = [makeAttachedTrigger('att-1', trigger)];
    const states = new Map<string, EffectRuntimeState>();

    const result = checkAndFireActionTriggers(effects, 'encounter_success', baseCtx, states);

    const updated = result.updatedStates.get('att-1');
    expect(updated?.actionTriggerFireCount).toBe(1);
    expect(updated?.actionTriggerCooldownUntil).toBe(20); // tick 10 + cooldown 10
  });

  it('fires trace_only payload without resource changes', () => {
    const trigger: ActionTriggerEffect = {
      type: 'action_trigger',
      on: 'movement_complete',
      payload: { kind: 'trace_only', message: 'The stone hums' },
    };
    const effects = [makeAttachedTrigger('att-1', trigger)];
    const states = new Map<string, EffectRuntimeState>();

    const result = checkAndFireActionTriggers(effects, 'movement_complete', baseCtx, states);
    expect(result.firedCount).toBe(1);
    expect(result.resourceDeltas).toHaveLength(0);
    expect(result.traces).toHaveLength(1);
  });

  it('skips non-action_trigger effects', () => {
    const passive = { type: 'passive', reach: 'iron', value: 0.03 } as any;
    const effects: AttachedEffect[] = [{
      attachmentId: 'att-1',
      attachmentName: 'Sword',
      attachmentTier: 1,
      effect: passive,
    }];
    const states = new Map<string, EffectRuntimeState>();

    const result = checkAndFireActionTriggers(effects, 'encounter_success', baseCtx, states);
    expect(result.firedCount).toBe(0);
  });
});
