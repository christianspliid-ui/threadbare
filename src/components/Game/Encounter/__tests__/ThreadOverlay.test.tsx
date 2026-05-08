// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act, renderHook } from '@testing-library/react';
import { ThreadOverlay } from '../ThreadOverlay';
import { useThreadReveal } from '../../../../hooks/useThreadReveal';
import type { EncounterChoiceContract } from '../../../../types/encounter-contract';

// Three-card sample row used across render tests.
const sampleChoices: EncounterChoiceContract[] = [
  {
    reach: 'iron',
    cost: 'fuller_breath',
    god_verb: 'Stir her resolve.',
    agent_reaction: "She closes the distance.",
    tilts_toward: 'a wound earned',
    moral_axis_pole: 'conqueror',
    fail_forward: 'queue splinters',
  },
  {
    reach: 'veil',
    cost: 'small_breath',
    god_verb: 'Whisper a name.',
    agent_reaction: 'Her eyes sharpen.',
    tilts_toward: 'a memory surfaced',
    moral_axis_pole: 'archivist',
    fail_forward: 'the name is wrong',
  },
  {
    reach: 'heart',
    cost: 'deep_draught',
    god_verb: 'Bind her oath.',
    agent_reaction: 'She kneels in stillness.',
    tilts_toward: 'a vow taken',
    moral_axis_pole: 'sworn',
    fail_forward: 'she breaks faith',
  },
];

describe('useThreadReveal', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useThreadReveal());
    expect(result.current.state.phase).toBe('idle');
    expect(result.current.state.chosenReach).toBeNull();
    expect(result.current.state.outcomeBand).toBeNull();
  });

  it('transitions to committed immediately on commit()', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useThreadReveal());

    act(() => {
      result.current.commit('iron', 'likely-favourable');
    });

    expect(result.current.state.phase).toBe('committed');
    expect(result.current.state.chosenReach).toBe('iron');
    expect(result.current.state.outcomeBand).toBe('likely-favourable');
  });

  it('fires onResolveBeat with correct args when entering resolving phase', () => {
    vi.useFakeTimers();
    const onResolveBeat = vi.fn();
    const { result } = renderHook(() => useThreadReveal(onResolveBeat));

    act(() => {
      result.current.commit('veil', 'uncertain');
    });

    // Advance through commit + inhale + draw + taut to reach resolving.
    // 60 + 380 + 520 + 420 = 1380ms
    act(() => {
      vi.advanceTimersByTime(1380);
    });

    expect(result.current.state.phase).toBe('resolving');
    expect(onResolveBeat).toHaveBeenCalledTimes(1);
    expect(onResolveBeat).toHaveBeenCalledWith('veil', 'uncertain');
  });

  it('progresses through every phase in order', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useThreadReveal());

    act(() => {
      result.current.commit('heart', 'risky');
    });
    expect(result.current.state.phase).toBe('committed');

    // Advance into drawing: 60 + 380 = 440ms
    act(() => {
      vi.advanceTimersByTime(440);
    });
    expect(result.current.state.phase).toBe('drawing');

    // Advance into taut: + 520 = 960ms
    act(() => {
      vi.advanceTimersByTime(520);
    });
    expect(result.current.state.phase).toBe('taut');

    // Advance into resolving: + 420 = 1380ms
    act(() => {
      vi.advanceTimersByTime(420);
    });
    expect(result.current.state.phase).toBe('resolving');

    // Advance into settled: + 240 = 1620ms
    act(() => {
      vi.advanceTimersByTime(240);
    });
    expect(result.current.state.phase).toBe('settled');

    // Auto-reset to idle: + 600 = 2220ms
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.state.phase).toBe('idle');
  });

  it('resets to idle on reset()', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useThreadReveal());

    act(() => {
      result.current.commit('iron', 'likely');
    });
    expect(result.current.state.phase).toBe('committed');

    act(() => {
      result.current.reset();
    });
    expect(result.current.state.phase).toBe('idle');
    expect(result.current.state.chosenReach).toBeNull();
    expect(result.current.state.outcomeBand).toBeNull();
  });
});

describe('ThreadOverlay', () => {
  it('renders the SVG layer with no threads visible at phase=idle', () => {
    const { getByTestId } = render(
      <div style={{ position: 'relative', width: 800, height: 400 }}>
        <ThreadOverlay
          choices={sampleChoices}
          chosenReach={null}
          phase="idle"
          width={800}
          height={400}
        />
      </div>,
    );
    // Root mounts; SVG present; but no page-dim overlay.
    expect(getByTestId('thread-overlay-root')).toHaveAttribute('data-phase', 'idle');
    expect(getByTestId('thread-overlay-svg')).toBeInTheDocument();
    // No page dim at idle.
    expect(() => getByTestId('thread-overlay-page-dim')).toThrow();
  });

  it('renders SVG overlay and threads when phase=drawing', () => {
    const { getByTestId } = render(
      <div style={{ position: 'relative', width: 800, height: 400 }}>
        <ThreadOverlay
          choices={sampleChoices}
          chosenReach={null}
          phase="drawing"
          width={800}
          height={400}
        />
      </div>,
    );
    expect(getByTestId('thread-overlay-root')).toHaveAttribute(
      'data-phase',
      'drawing',
    );
    expect(getByTestId('thread-overlay-thread-iron')).toBeInTheDocument();
    expect(getByTestId('thread-overlay-thread-veil')).toBeInTheDocument();
    expect(getByTestId('thread-overlay-thread-heart')).toBeInTheDocument();
    // Page dim is active.
    expect(getByTestId('thread-overlay-page-dim')).toBeInTheDocument();
    // No motes at drawing.
    expect(() => getByTestId('thread-overlay-mote-0')).toThrow();
  });

  it('matches snapshot for phase=taut with 3 choices', () => {
    const { asFragment } = render(
      <div style={{ position: 'relative', width: 800, height: 400 }}>
        <ThreadOverlay
          choices={sampleChoices}
          chosenReach={null}
          phase="taut"
          width={800}
          height={400}
        />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot('taut-three-choices');
  });

  it('chosen thread has higher opacity than unchosen at phase=resolving', () => {
    const { getByTestId } = render(
      <div style={{ position: 'relative', width: 800, height: 400 }}>
        <ThreadOverlay
          choices={sampleChoices}
          chosenReach="veil"
          phase="resolving"
          width={800}
          height={400}
        />
      </div>,
    );

    const chosenCore = getByTestId('thread-overlay-thread-core-veil');
    const unchosenCore = getByTestId('thread-overlay-thread-core-iron');

    const chosenOpacity = parseFloat(
      chosenCore.getAttribute('opacity') ?? '0',
    );
    const unchosenOpacity = parseFloat(
      unchosenCore.getAttribute('opacity') ?? '0',
    );

    expect(chosenOpacity).toBeGreaterThan(unchosenOpacity);

    // Per spec: chosen is opacity 1.0 * 0.95 core, unchosen 0.15 * 0.95.
    expect(chosenOpacity).toBeCloseTo(0.95, 2);
    expect(unchosenOpacity).toBeCloseTo(0.1425, 2);

    // Chosen group flagged with data-chosen="true".
    expect(getByTestId('thread-overlay-thread-veil')).toHaveAttribute(
      'data-chosen',
      'true',
    );
    expect(getByTestId('thread-overlay-thread-iron')).toHaveAttribute(
      'data-chosen',
      'false',
    );
  });
});

describe('ThreadOverlay 1920×1080 snapshot grid', () => {
  const viewportWidth = 1920;
  const viewportHeight = 1080;

  const phaseCases: Array<{
    label: string;
    phase: 'idle' | 'committed' | 'drawing' | 'taut' | 'resolving' | 'settled';
    chosenReach: EncounterChoiceContract['reach'] | null;
  }> = [
    { label: 'phase-idle-1920x1080', phase: 'idle', chosenReach: null },
    {
      label: 'phase-committed-1920x1080',
      phase: 'committed',
      chosenReach: null,
    },
    { label: 'phase-drawing-1920x1080', phase: 'drawing', chosenReach: null },
    { label: 'phase-taut-1920x1080', phase: 'taut', chosenReach: null },
    {
      label: 'phase-resolving-1920x1080',
      phase: 'resolving',
      chosenReach: 'veil',
    },
    {
      label: 'phase-settled-1920x1080',
      phase: 'settled',
      chosenReach: 'veil',
    },
  ];

  for (const { label, phase, chosenReach } of phaseCases) {
    it(`matches snapshot for ${label}`, () => {
      const { asFragment } = render(
        <div
          style={{
            position: 'relative',
            width: viewportWidth,
            height: viewportHeight,
          }}
        >
          <ThreadOverlay
            choices={sampleChoices}
            chosenReach={chosenReach}
            phase={phase}
            width={viewportWidth}
            height={viewportHeight}
          />
        </div>,
      );

      expect(asFragment()).toMatchSnapshot(label);
    });
  }
});
