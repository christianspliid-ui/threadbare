import { describe, it, expect } from 'vitest';
import { applyResourceDelta } from '../effects/resourceDelta';
import type { ResourceDeltaEffect } from '../../types/effects';

describe('applyResourceDelta', () => {
  it('adds essence and clamps to non-negative', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'essence', amount: 10 };
    const result = applyResourceDelta(effect, { essence: 5 }, 1, 'reward');
    expect(result.after).toBe(15);
    expect(result.applied).toBe(true);
    expect(result.trace.resource).toBe('essence');
    expect(result.trace.before).toBe(5);
    expect(result.trace.after).toBe(15);
  });

  it('subtracts essence and clamps to 0', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'essence', amount: -100 };
    const result = applyResourceDelta(effect, { essence: 30 }, 1, 'encounter');
    expect(result.after).toBe(0);
    expect(result.trace.amount).toBe(-100);
  });

  it('adds quintessence and clamps to max', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'quintessence', amount: 20 };
    const result = applyResourceDelta(effect, { quintessence: 90, quintessenceMax: 100 }, 1, 'reward');
    expect(result.after).toBe(100);
  });

  it('clamps amount to per-resource cap', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'essence', amount: 999 };
    const result = applyResourceDelta(effect, { essence: 0 }, 1, 'reward');
    // RESOURCE_DELTA_ESSENCE_CAP = 50
    expect(result.after).toBe(50);
    expect(result.trace.amount).toBe(999); // trace records original intent
  });

  it('adds doom and clamps to doomThreshold', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'doom', amount: 15 };
    const result = applyResourceDelta(effect, { doom: 80, doomThreshold: 100 }, 1, 'encounter');
    expect(result.after).toBe(95);
  });

  it('clamps doom delta to RESOURCE_DELTA_DOOM_CAP', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'doom', amount: 50 };
    const result = applyResourceDelta(effect, { doom: 0, doomThreshold: 100 }, 1, 'encounter');
    // RESOURCE_DELTA_DOOM_CAP = 20
    expect(result.after).toBe(20);
  });

  it('returns applied=false for unrecognized resource', () => {
    const effect = { type: 'resource_delta', resource: 'mana', amount: 10 } as any;
    const result = applyResourceDelta(effect, { essence: 0 }, 1, 'reward');
    expect(result.applied).toBe(false);
  });

  it('records source in trace', () => {
    const effect: ResourceDeltaEffect = { type: 'resource_delta', resource: 'essence', amount: 5 };
    const result = applyResourceDelta(effect, { essence: 0 }, 1, 'action_trigger', 'attachment_123');
    expect(result.trace.source).toBe('action_trigger');
    expect(result.trace.sourceAttachmentId).toBe('attachment_123');
  });
});
