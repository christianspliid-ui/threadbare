// @vitest-environment jsdom
/**
 * THR-346 wiring contract: the Moment 1 beat clock and the Moment 2 landing
 * lifecycle actually dispatch sound cues.
 *
 * These are the tests that would have caught the failure mode this ticket
 * existed to fix — `onResolveBeat` and `onEffectLand` shipped in D1/D2 with
 * zero production consumers, so the seams were live but silent. Asserting the
 * cue module is *called* is the contract; the cue's own behaviour is covered
 * in `encounterSoundDesign.test.ts`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';

vi.mock('../encounterSoundDesign', () => ({
  beginTensionReveal: vi.fn(),
  endTensionReveal: vi.fn(),
  playResolveNote: vi.fn(),
  playRegistrationCue: vi.fn(),
}));

import {
  beginTensionReveal,
  endTensionReveal,
  playRegistrationCue,
  playResolveNote,
} from '../encounterSoundDesign';
import { useThreadReveal } from '../../hooks/useThreadReveal';
import { IntelligenceLanding } from '../../components/Game/Encounter/EffectRegistration/IntelligenceLanding';

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

describe('Moment 2 — landing lifecycle dispatches the registration cue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cues with the landing kind when the motion settles', () => {
    render(
      <IntelligenceLanding
        data={{ label: 'CLUE · NEW', name: 'A rumour', tail: 'about the road north' }}
        skipAnimation
      />,
    );
    expect(playRegistrationCue).toHaveBeenCalledWith('intelligence');
  });

  it('still fires onEffectLand alongside the cue', () => {
    const onEffectLand = vi.fn();
    render(
      <IntelligenceLanding
        data={{ label: 'CLUE · NEW', name: 'A rumour', tail: 'about the road north' }}
        skipAnimation
        onEffectLand={onEffectLand}
      />,
    );
    expect(onEffectLand).toHaveBeenCalledTimes(1);
    expect(playRegistrationCue).toHaveBeenCalledTimes(1);
  });
});
