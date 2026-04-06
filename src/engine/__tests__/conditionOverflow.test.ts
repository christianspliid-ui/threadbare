import { describe, it, expect } from 'vitest';
import { resolveConditionOverflow } from '../conditionOverflow';
import type { SlotInventoryEntry } from '../attachmentSlotResolver';

function makeCondItem(overrides: Partial<SlotInventoryEntry> = {}): SlotInventoryEntry {
  return {
    edgeId: `edge-${Math.random()}`,
    attachmentId: `cond-${Math.random()}`,
    name: 'Test Condition',
    slotTag: 'wound',
    tier: 1,
    acquiredTick: 0,
    active: true,
    isPinned: false,
    kind: 'condition',
    ...overrides,
  };
}

describe('resolveConditionOverflow', () => {
  it('wound overflow fires incapacitation check — passes on high roll', () => {
    const result = resolveConditionOverflow('wound', 4, 3, [], 'agent1', 0.9);
    expect(result).not.toBeNull();
    expect(result!.event).toBe('incapacitation_check');
    expect(result!.outcome).toBe('passed');
    expect(result!.consequenceTraitId).toBeUndefined();
  });

  it('wound overflow fires incapacitation check — fails on low roll', () => {
    const result = resolveConditionOverflow('wound', 4, 3, [], 'agent1', 0.1);
    expect(result).not.toBeNull();
    expect(result!.event).toBe('incapacitation_check');
    expect(result!.outcome).toBe('failed');
    expect(result!.consequenceTraitId).toBe('scar');
  });

  it('disease overflow fires mortality check', () => {
    const result = resolveConditionOverflow('disease', 3, 2, [], 'agent1', 0.9);
    expect(result!.event).toBe('mortality_check');
    expect(result!.outcome).toBe('passed');
  });

  it('curse overflow fires corruption check', () => {
    const result = resolveConditionOverflow('curse', 3, 2, [], 'agent1', 0.3);
    expect(result!.event).toBe('corruption_check');
    expect(result!.outcome).toBe('failed');
    expect(result!.consequenceTraitId).toBe('corruption');
  });

  it('blessing overflow — oldest blessing fades', () => {
    const items = [
      makeCondItem({ edgeId: 'oldest-edge', name: 'Old Blessing', acquiredTick: 5, slotTag: 'blessing' }),
      makeCondItem({ edgeId: 'newest-edge', name: 'New Blessing', acquiredTick: 20, slotTag: 'blessing' }),
    ];

    const result = resolveConditionOverflow('blessing', 3, 2, items, 'agent1', 0.5);
    expect(result!.event).toBe('transcendence_check');
    expect(result!.outcome).toBe('passed');
    expect(result!.removeEdgeId).toBe('oldest-edge');
  });

  it('bestowed overflow — newest power is rejected', () => {
    const items = [
      makeCondItem({ edgeId: 'old-edge', name: 'Old Power', acquiredTick: 5, slotTag: 'bestowed' }),
      makeCondItem({ edgeId: 'new-edge', name: 'New Power', acquiredTick: 20, slotTag: 'bestowed' }),
    ];

    const result = resolveConditionOverflow('bestowed', 3, 2, items, 'agent1', 0.5);
    expect(result!.event).toBe('rejection');
    expect(result!.outcome).toBe('failed');
    expect(result!.removeEdgeId).toBe('new-edge');
  });

  it('unknown condition slot returns null (fail-soft)', () => {
    const result = resolveConditionOverflow('unknown_slot', 5, 3, [], 'agent1', 0.5);
    expect(result).toBeNull();
  });

  it('missing items array handles gracefully', () => {
    const result = resolveConditionOverflow('blessing', 3, 2, [], 'agent1', 0.5);
    expect(result).not.toBeNull();
    expect(result!.event).toBe('transcendence_check');
    // No removeEdgeId when items is empty
    expect(result!.removeEdgeId).toBeUndefined();
  });

  it('trace payload has correct category and fields', () => {
    const result = resolveConditionOverflow('wound', 4, 3, [], 'agent1', 0.1);
    expect(result!.tracePayload.category).toBe('condition_overflow');
    expect(result!.tracePayload.agentId).toBe('agent1');
    expect(result!.tracePayload.conditionSlot).toBe('wound');
    expect(result!.tracePayload.currentCount).toBe(4);
    expect(result!.tracePayload.cap).toBe(3);
  });
});
