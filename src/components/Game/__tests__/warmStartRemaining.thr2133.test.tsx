// @vitest-environment jsdom
/**
 * THR-2133 — the warm start states the wait it will actually keep.
 *
 * The overlay promised "a minute or two" while 300 ticks took five and a half
 * minutes. It now states time left from the pace measured so far. The properties a
 * later edit could break: no estimate before enough ticks have run, minutes round up
 * (the wait never overruns its words), and no fixed duration survives in the copy.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  estimateWarmRemainingMs,
  formatWarmRemaining,
  smoothWarmRemainingMs,
  WARM_START_ALMOST_DONE_MS,
  WARM_START_ESTIMATE_MIN_TICKS,
} from '../hooks/useWarmStart';
import { formatRemainingLine, WarmStartOverlay } from '../WarmStartOverlay';

describe('estimateWarmRemainingMs', () => {
  const progress = (currentTick: number) => ({ startTick: 100, targetTick: 400, currentTick });

  it('waits for enough ticks before estimating', () => {
    expect(estimateWarmRemainingMs(progress(100), 0, null)).toBeNull();
    expect(estimateWarmRemainingMs(progress(100 + WARM_START_ESTIMATE_MIN_TICKS - 1), 4000, 200)).toBeNull();
  });

  it('projects a steady pace flat over the ticks left', () => {
    // 30 ticks at 1.1 s each, recent pace the same → 270 left × 1.1 s.
    expect(estimateWarmRemainingMs(progress(130), 33_000, 1100, undefined, 1)).toBe(297_000);
  });

  it('projects a growing pace as a ramp, longer than the flat average', () => {
    // Cost c(d) = 10·d ms: after 100 ticks the elapsed is 10·100²/2 = 50 s and the
    // recent pace 1000 ms. The 200 ticks left cost 10·(300² − 100²)/2 = 400 s.
    const ramp = estimateWarmRemainingMs(progress(200), 50_000, 1000, undefined, 1);
    expect(ramp).toBe(400_000);
    // The flat average (0.5 s a tick) would have said 100 s.
    expect(ramp!).toBeGreaterThan(200 * 500);
  });

  it('falls back to the mean when the first ticks were the heavy ones', () => {
    // Mean 2 s a tick, recent 1 s: no negative slope, and the safer mean carries.
    expect(estimateWarmRemainingMs(progress(150), 100_000, 1000, undefined, 1)).toBe(500_000);
  });

  it('is zero at the target and null on a nonsense clock or pace', () => {
    expect(estimateWarmRemainingMs(progress(400), 5000, 100)).toBe(0);
    expect(estimateWarmRemainingMs(progress(130), Number.NaN, 100)).toBeNull();
    expect(estimateWarmRemainingMs(progress(130), 5000, null)).toBeNull();
  });
});

describe('smoothWarmRemainingMs', () => {
  it('passes the first estimate through', () => {
    expect(smoothWarmRemainingMs(null, 0, null)).toBeNull();
    expect(smoothWarmRemainingMs(null, 0, 120_000)).toBe(120_000);
  });

  it('never falls faster than real time', () => {
    // Shown 120 s, 500 ms later a quick window says 50 s: the line holds at 119.5 s.
    expect(smoothWarmRemainingMs(120_000, 500, 50_000)).toBe(119_500);
  });

  it('rises at once, and counts down through a missing estimate', () => {
    expect(smoothWarmRemainingMs(120_000, 500, 200_000)).toBe(200_000);
    expect(smoothWarmRemainingMs(120_000, 500, null)).toBe(119_500);
  });
});

describe('formatWarmRemaining', () => {
  it('rounds up to whole minutes', () => {
    expect(formatWarmRemaining(1)).toBe('a minute');
    expect(formatWarmRemaining(60_000)).toBe('a minute');
    expect(formatWarmRemaining(60_001)).toBe('2 minutes');
    expect(formatWarmRemaining(319_000)).toBe('6 minutes');
  });
});

describe('formatRemainingLine', () => {
  it('reads measuring, then minutes, then almost there', () => {
    expect(formatRemainingLine(null)).toMatch(/how long/i);
    expect(formatRemainingLine(319_000)).toBe('About 6 minutes left.');
    expect(formatRemainingLine(WARM_START_ALMOST_DONE_MS - 1)).toBe('Almost there.');
  });
});

describe('WarmStartOverlay — the wait line', () => {
  it('shows the live estimate and no fixed duration', () => {
    render(
      <WarmStartOverlay
        progress={{ startTick: 0, targetTick: 300, currentTick: 10, remainingMs: 319_000 }}
        firstName={null}
      />,
    );
    expect(screen.getByTestId('warm-start-remaining').textContent).toBe('About 6 minutes left.');
    expect(screen.getByTestId('warm-start-overlay').textContent).not.toMatch(/minute or two/);
  });
});
