// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../useNarration', () => ({
  useNarration: () => ({
    enabled: true,
    isSpeaking: false,
    speak: vi.fn(async () => {}),
    stop: vi.fn(),
  }),
}));

import { useEncounterNarration } from '../encounterNarration';

describe('useEncounterNarration', () => {
  it('exposes the documented four-field narration contract', () => {
    const { result } = renderHook(() => useEncounterNarration());

    expect(typeof result.current.enabled).toBe('boolean');
    expect(typeof result.current.isSpeaking).toBe('boolean');
    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.stop).toBe('function');
  });
});