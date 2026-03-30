import { describe, it, expect } from 'vitest';
import {
  TRAIL_LINE_COLOR,
  TRAIL_LINE_WIDTH,
  TRAIL_OPACITY_MAX,
  TRAIL_OPACITY_MIN,
  GHOST_DOT_INITIAL_OPACITY,
  GHOST_DOT_DECAY_TICKS,
  GHOST_DOT_COLOR,
} from '../agent-visual-content';

describe('agent-visual trail + ghost constants', () => {
  it('trail constants are defined', () => {
    expect(TRAIL_LINE_COLOR).toBe('#1a1a1a');
    expect(TRAIL_LINE_WIDTH).toBeGreaterThan(0);
    expect(TRAIL_OPACITY_MAX).toBeLessThanOrEqual(1);
    expect(TRAIL_OPACITY_MIN).toBeGreaterThanOrEqual(0);
  });

  it('ghost dot constants are defined', () => {
    expect(GHOST_DOT_INITIAL_OPACITY).toBe(0.3);
    expect(GHOST_DOT_DECAY_TICKS).toBe(28);
    expect(GHOST_DOT_COLOR).toBeTruthy();
  });
});
