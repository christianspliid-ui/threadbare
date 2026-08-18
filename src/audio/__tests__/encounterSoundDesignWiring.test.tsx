// @vitest-environment jsdom
/**
 * THR-346 wiring contract: the Moment 1 beat clock actually dispatches sound cues.
 *
 * These are the tests that would have caught the failure mode that ticket
 * existed to fix — `onResolveBeat` shipped in D1 with zero production
 * consumers, so the seam was live but silent. Asserting the cue module is
 * *called* is the contract; the cue's own behaviour is covered in
 * `encounterSoundDesign.test.ts`.
 *
 * The Moment 2 half (landing lifecycle → `playRegistrationCue`) was removed in
 * THR-1049 with the `EffectRegistration` prototype cluster it exercised, and the
 * cue itself was retired in THR-1168 — its pitch map was keyed by the engine
 * effect vocabulary that no player surface still speaks. Only Moment 1 remains.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('../encounterSoundDesign', () => ({
  beginTensionReveal: vi.fn(),
  endTensionReveal: vi.fn(),
  playResolveNote: vi.fn(),
}));

import {
  beginTensionReveal,
  endTensionReveal,
  playResolveNote,
} from '../encounterSoundDesign';
import { useThreadReveal } from '../../hooks/useThreadReveal';

describe('Moment 1 — useThreadReveal drives the tension-reveal cues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules the cue bed at commit', () => {
    const { result } = renderHook(() => useThreadReveal());
    act(() => {
      result.current.commit('iron', 'uncertain');
    });
    expect(beginTensionReveal).toHaveBeenCalledTimes(1);
  });

  it('plays the sphere-tinted resolve note at the resolving beat', () => {
    const { result } = renderHook(() => useThreadReveal());
    act(() => {
      result.current.commit('eye', 'uncertain');
    });

    expect(playResolveNote).not.toHaveBeenCalled();

    // commit(60) + inhale(380) + draw(520) + taut(420) = 1380ms → resolving
    act(() => {
      vi.advanceTimersByTime(1380);
    });

    expect(playResolveNote).toHaveBeenCalledTimes(1);
    expect(playResolveNote).toHaveBeenCalledWith('eye');
  });

  it('stops in-flight cues on reset', () => {
    const { result } = renderHook(() => useThreadReveal());
    act(() => {
      result.current.commit('heart', 'uncertain');
    });
    act(() => {
      result.current.reset();
    });
    expect(endTensionReveal).toHaveBeenCalled();
  });

  it('stops in-flight cues on unmount', () => {
    const { result, unmount } = renderHook(() => useThreadReveal());
    act(() => {
      result.current.commit('heart', 'uncertain');
    });
    unmount();
    expect(endTensionReveal).toHaveBeenCalled();
  });

  it('stays silent when audio is disabled', () => {
    const { result } = renderHook(() =>
      useThreadReveal(undefined, { enableAudio: false }),
    );
    act(() => {
      result.current.commit('iron', 'uncertain');
    });
    act(() => {
      vi.advanceTimersByTime(1380);
    });

    expect(beginTensionReveal).not.toHaveBeenCalled();
    expect(playResolveNote).not.toHaveBeenCalled();
  });

  it('still fires onResolveBeat for non-audio consumers', () => {
    const onResolveBeat = vi.fn();
    const { result } = renderHook(() => useThreadReveal(onResolveBeat));
    act(() => {
      result.current.commit('veil', 'uncertain');
    });
    act(() => {
      vi.advanceTimersByTime(1380);
    });
    expect(onResolveBeat).toHaveBeenCalledWith('veil', 'uncertain');
  });
});

