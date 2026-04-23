import { beforeEach, describe, expect, it, vi } from 'vitest';
import { classifyEvent } from '../narrative';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';

describe('classifyEvent rarity floor bias', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  it('keeps base tier when rarity is undefined', () => {
    expect(classifyEvent('action_resolved', [], undefined)).toBe('routine');
    expect(getTraces().find((t) => t.category === 'prose_rarity_bias')).toBeUndefined();
  });

  it('promotes Storied routine events to notable', () => {
    expect(classifyEvent('action_resolved', [], 2, 'actor.storied')).toBe('notable');
    const biasTrace = getTraces().find((t) => t.category === 'prose_rarity_bias');
    expect(biasTrace).toBeDefined();
    expect(biasTrace?.summary).toContain('routine→notable');
  });

  it('promotes Legendary routine events to chronicle', () => {
    expect(classifyEvent('action_resolved', [], 4, 'actor.legendary')).toBe('chronicle');
  });

  it('keeps chronicle tier unchanged for Mythic if base tier is already chronicle', () => {
    expect(classifyEvent('doom_escalation', [], 3, 'actor.mythic')).toBe('chronicle');
    expect(getTraces().find((t) => t.category === 'prose_rarity_bias')).toBeUndefined();
  });

  it('falls back on invalid negative rarity and warns once', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(classifyEvent('action_resolved', [], -1)).toBe('routine');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});

