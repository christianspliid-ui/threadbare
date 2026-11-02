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
  WARM_START_ALMOST_DONE_MS,
  WARM_START_ESTIMATE_MIN_TICKS,
} from '../hooks/useWarmStart';
import { formatRemainingLine, WarmStartOverlay } from '../WarmStartOverlay';

describe('estimateWarmRemainingMs', () => {
  const progress = (currentTick: number) => ({ startTick: 100, targetTick: 400, currentTick });

  it('waits for enough ticks before estimating', () => {
    expect(estimateWarmRemainingMs(progress(100), 0)).toBeNull();
    expect(estimateWarmRemainingMs(progress(100 + WARM_START_ESTIMATE_MIN_TICKS - 1), 4000)).toBeNull();
  });

  it('projects the measured pace over the ticks left', () => {
    // 10 ticks in 11 s → 1.1 s a tick, 290 left.
    expect(estimateWarmRemainingMs(progress(110), 11_000)).toBe(319_000);
  });

  it('is zero at the target and null on a nonsense clock', () => {
    expect(estimateWarmRemainingMs(progress(400), 5000)).toBe(0);
    expect(estimateWarmRemainingMs(progress(110), Number.NaN)).toBeNull();
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
