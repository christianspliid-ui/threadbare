// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../useNarration', () => ({
  useNarration: () => ({
    enabled: true,
    status: 'ready',
    backendType: 'server' as const,
    loadProgress: 1,
    error: null,
    isSpeaking: false,
    isLoading: false,
    isAvailable: false,
    init: async () => {},
    initWorker: async () => {},
    speak: async (_text: string) => {},
    speakSections: async (_sections: string[]) => {},
    stop: () => {},
    narrateChronicle: async (_el: HTMLElement | null) => {},
  }),
}));

import { useEncounterNarration } from '../encounterNarration';

describe('useEncounterNarration', () => {
  it('exposes the four documented fields with the right typeof', () => {
    const { result } = renderHook(() => useEncounterNarration());

    expect(typeof result.current.enabled).toBe('boolean');
    expect(typeof result.current.isSpeaking).toBe('boolean');
    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.stop).toBe('function');
  });

  it('passes through values from useNarration', () => {
    const { result } = renderHook(() => useEncounterNarration());

    expect(result.current.enabled).toBe(true);
    expect(result.current.isSpeaking).toBe(false);
  });

  it('returns only the four documented keys (no extra surface leaked)', () => {
    const { result } = renderHook(() => useEncounterNarration());

    expect(Object.keys(result.current).sort()).toEqual(
      ['enabled', 'isSpeaking', 'speak', 'stop'].sort(),
    );
  });
});
