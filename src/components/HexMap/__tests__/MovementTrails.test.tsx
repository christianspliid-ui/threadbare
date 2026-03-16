import { describe, it, expect } from 'vitest';
import { TRAIL_LINE_COLOR, TRAIL_LINE_WIDTH, TRAIL_OPACITY_MAX } from '../../../data/agent-visual-content';
import { TRAIL_HISTORY_TICKS } from '../../../data/movement-content';

describe('MovementTrails constants', () => {
  it('trail renders with dark ink color', () => {
    expect(TRAIL_LINE_COLOR).toBe('#1a1a1a');
  });

  it('trail history covers 12 ticks', () => {
    expect(TRAIL_HISTORY_TICKS).toBe(12);
  });

  it('trail opacity fades from max to min', () => {
    expect(TRAIL_OPACITY_MAX).toBeLessThanOrEqual(1);
    expect(TRAIL_OPACITY_MAX).toBeGreaterThan(0);
  });
});
