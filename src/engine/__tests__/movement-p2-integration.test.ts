import { describe, it, expect } from 'vitest';
import { ghostDotOpacity, updateGhostDots, type GhostDotEntry } from '../ghostDots';
import { GHOST_DOT_DECAY_TICKS, GHOST_DOT_INITIAL_OPACITY } from '../../data/agent-visual-content';
import { TRAIL_HISTORY_TICKS } from '../../types/movement';

describe('P2 integration', () => {
  it('ghost dot opacity decays linearly to zero', () => {
    const opacity0 = ghostDotOpacity(0, 0);
    expect(opacity0).toBeCloseTo(GHOST_DOT_INITIAL_OPACITY, 2);

    const opacityMid = ghostDotOpacity(0, GHOST_DOT_DECAY_TICKS / 2);
    expect(opacityMid).toBeCloseTo(GHOST_DOT_INITIAL_OPACITY / 2, 2);

    const opacityEnd = ghostDotOpacity(0, GHOST_DOT_DECAY_TICKS);
    expect(opacityEnd).toBe(0);
  });

  it('ghost dots are created and cleaned up correctly', () => {
    const prev = new Map<string, { hexCol: number; hexRow: number; agentName?: string }>();
    prev.set('a1', { hexCol: 1, hexRow: 2, agentName: 'Alice' });

    // Agent disappears
    const ghosts1 = updateGhostDots([], prev, new Set(), 10);
    expect(ghosts1.length).toBe(1);
    expect(ghosts1[0].agentName).toBe('Alice');

    // Agent reappears
    const ghosts2 = updateGhostDots(ghosts1, new Map(), new Set(['a1']), 15);
    expect(ghosts2.length).toBe(0);
  });

  it('trail history ticks matches design spec', () => {
    expect(TRAIL_HISTORY_TICKS).toBe(12);
  });

  it('ghost dot decay ticks matches design spec', () => {
    expect(GHOST_DOT_DECAY_TICKS).toBe(28);
  });

  it('ghost dot opacity never goes negative', () => {
    // Test well past decay window
    const opacity = ghostDotOpacity(0, 100);
    expect(opacity).toBe(0);
    expect(opacity).toBeGreaterThanOrEqual(0);
  });
});
