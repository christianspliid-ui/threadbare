import { describe, it, expect } from 'vitest';
import {
  generateDoomClock,
  createDoomClockState,
  advanceDoomClock,
  getDoomClockStage,
  accelerateDoomClock,
  decelerateDoomClock,
} from '../doomClock';
import type { DoomClockArchetype } from '../../types/doomClock';

describe('doom clock generator', () => {
  it('generates a doom clock with 5 stages for any archetype', () => {
    const archetypes: DoomClockArchetype[] = [
      'breach', 'convergence', 'changing', 'sundering',
      'failing', 'ascension', 'reckoning',
    ];
    for (const archetype of archetypes) {
      const clock = generateDoomClock(archetype, 120, 42);
      expect(clock.stages.length).toBe(5);
      expect(clock.archetype).toBe(archetype);
      expect(clock.totalTicks).toBe(120);
    }
  });

  it('stage thresholds increase monotonically to 1.0', () => {
    const clock = generateDoomClock('breach', 120, 42);
    for (let i = 1; i < clock.stages.length; i++) {
      expect(clock.stages[i].tickThreshold).toBeGreaterThan(
        clock.stages[i - 1].tickThreshold,
      );
    }
    expect(clock.stages[4].tickThreshold).toBe(1.0);
  });
});

describe('doom clock state machine', () => {
  it('createDoomClockState returns initial state at stage 1', () => {
    const state = createDoomClockState('breach', 120);
    expect(state.currentStage).toBe(1);
    expect(state.currentTick).toBe(0);
    expect(state.progress).toBe(0);
    expect(state.expired).toBe(false);
  });

  it('advanceDoomClock increments tick and updates progress', () => {
    let state = createDoomClockState('breach', 100);
    state = advanceDoomClock(state);
    expect(state.currentTick).toBe(1);
    expect(state.progress).toBeCloseTo(0.01);
  });

  it('advanceDoomClock transitions stages at thresholds', () => {
    let state = createDoomClockState('breach', 100);
    for (let i = 0; i < 20; i++) {
      state = advanceDoomClock(state);
    }
    expect(state.currentStage).toBeGreaterThanOrEqual(2);
  });

  it('doom clock expires when tick reaches totalTicks', () => {
    let state = createDoomClockState('breach', 10);
    for (let i = 0; i < 10; i++) {
      state = advanceDoomClock(state);
    }
    expect(state.expired).toBe(true);
    expect(state.currentStage).toBe(5);
  });

  it('getDoomClockStage returns correct stage for progress', () => {
    expect(getDoomClockStage(0.0)).toBe(1);
    expect(getDoomClockStage(0.19)).toBe(1);
    expect(getDoomClockStage(0.20)).toBe(2);
    expect(getDoomClockStage(0.39)).toBe(2);
    expect(getDoomClockStage(0.40)).toBe(3);
    expect(getDoomClockStage(0.80)).toBe(5);
    expect(getDoomClockStage(1.0)).toBe(5);
  });

  it('accelerateDoomClock increases tick modifier', () => {
    let state = createDoomClockState('breach', 100);
    state = accelerateDoomClock(state, 0.5);
    expect(state.tickModifier).toBeCloseTo(1.5);
    state = advanceDoomClock(state);
    expect(state.currentTick).toBeCloseTo(1.5);
  });

  it('decelerateDoomClock decreases tick modifier (min 0.1)', () => {
    let state = createDoomClockState('breach', 100);
    state = decelerateDoomClock(state, 0.5);
    expect(state.tickModifier).toBeCloseTo(0.5);
    state = decelerateDoomClock(state, 10.0);
    expect(state.tickModifier).toBeCloseTo(0.1);
  });

  it('all 5 stages are reachable within 120 ticks', () => {
    let state = createDoomClockState('breach', 120);
    const stagesReached = new Set<number>([state.currentStage]);

    for (let i = 0; i < 120; i++) {
      state = advanceDoomClock(state);
      stagesReached.add(state.currentStage);
    }

    expect(stagesReached.size).toBe(5);
    expect(stagesReached).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(state.expired).toBe(true);
    expect(state.currentStage).toBe(5);
  });
});
