/**
 * THR-1875 (frame plan § F3) — the top bar's fit: yield steps apply in
 * `TOP_BAR_YIELD_ORDER` while the bar overflows, and undo in reverse once the bar has the
 * room each step needed plus the hysteresis.
 */
import { describe, it, expect } from 'vitest';
import {
  INITIAL_TOP_BAR_YIELD,
  TOP_BAR_YIELD_HYSTERESIS_PX,
  stepTopBarYield,
  yieldedSteps,
  type TopBarYieldState,
} from '../topBarYield';
import { TOP_BAR_YIELD_ORDER } from '../../../../data/frame-registry';

/** A bar whose content shrinks by `saves[i]` px for each applied step. */
function settle(start: TopBarYieldState, clientWidth: number, natural: number, saves: number[]): TopBarYieldState {
  let s = start;
  for (let i = 0; i < 20; i++) {
    const used = natural - saves.slice(0, s.applied).reduce((a, b) => a + b, 0);
    const next = stepTopBarYield(s, { scrollWidth: Math.max(used, clientWidth), clientWidth });
    if (next === s) return s;
    s = next;
  }
  return s;
}

const SAVES = [240, 80, 110, 80, 120];

describe('the top bar yield order', () => {
  it('is the plan’s five steps, in order', () => {
    expect([...TOP_BAR_YIELD_ORDER]).toEqual(['centre', 'time_status', 'doom_name', 'omen_name', 'direction_short']);
  });

  it('applies nothing when the bar fits', () => {
    expect(settle(INITIAL_TOP_BAR_YIELD, 1920, 1787, SAVES).applied).toBe(0);
  });

  it('applies steps in order until the bar fits (the worst reachable state at 1920)', () => {
    const s = settle(INITIAL_TOP_BAR_YIELD, 1888, 2103 + 240, SAVES);
    expect(yieldedSteps(s)).toEqual(['centre', 'time_status', 'doom_name', 'omen_name']);
  });

  it('stops after all five when nothing more can give', () => {
    const s = settle(INITIAL_TOP_BAR_YIELD, 1000, 4000, SAVES);
    expect(s.applied).toBe(5);
  });

  it('undoes in reverse only with the room each step needed plus the hysteresis', () => {
    const tight = settle(INITIAL_TOP_BAR_YIELD, 1888, 2103 + 240, SAVES);
    expect(tight.applied).toBe(4);
    const need = tight.needAt[3];
    // One pixel short of the hysteresis: nothing flips.
    expect(stepTopBarYield(tight, { scrollWidth: 1700, clientWidth: need + TOP_BAR_YIELD_HYSTERESIS_PX - 1 })).toBe(tight);
    // Enough room: the last step undoes first.
    const undone = stepTopBarYield(tight, { scrollWidth: 1700, clientWidth: need + TOP_BAR_YIELD_HYSTERESIS_PX });
    expect(yieldedSteps(undone)).toEqual(['centre', 'time_status', 'doom_name']);
  });
});
