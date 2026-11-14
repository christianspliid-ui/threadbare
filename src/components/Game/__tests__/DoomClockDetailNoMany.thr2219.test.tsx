// @vitest-environment jsdom
/**
 * THR-2219 — the Doom panel read "Elapsed: four weeks of many weeks": `durationLabel`
 * spelled counts only to nine, so any doom of ten weeks or more had no total. A term is
 * a quantity, never "many".
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DoomClockDetail } from '../DoomClockDetail';
import { durationLabel, spelledCount } from '../../../engine/aftermathWords';
import { TICKS_PER_DAY } from '../../../data/attention-constants';
import type { DoomClockDefinition, DoomClockState } from '../../../types/doomClock';

const WEEK = TICKS_PER_DAY * 7;

function definition(totalTicks: number): DoomClockDefinition {
  return {
    archetype: 'breach',
    totalTicks,
    stages: [
      { stage: 1, name: 'Whispers', tickThreshold: 0.0, events: [] },
      { stage: 2, name: 'Signs', tickThreshold: 0.2, events: [] },
      { stage: 3, name: 'Tremors', tickThreshold: 0.4, events: [] },
      { stage: 4, name: 'Crisis', tickThreshold: 0.6, events: [] },
      { stage: 5, name: 'Culmination', tickThreshold: 0.8, events: [] },
    ],
  };
}

function state(currentTick: number, totalTicks: number): DoomClockState {
  return {
    definitionArchetype: 'breach',
    currentTick,
    totalTicks,
    currentStage: 1,
    progress: currentTick / totalTicks,
    stageTransitions: [0],
    expired: false,
    tickModifier: 1.0,
    nextEscalationSeverityModifier: 0,
    counterOmens: 0,
    resolvedEvents: [],
  };
}

describe('Doom panel durations never say "many" (THR-2219)', () => {
  for (const weeks of [10, 13, 24, 40]) {
    it(`a ${weeks}-week doom names its total`, () => {
      const total = weeks * WEEK;
      const { baseElement } = render(
        <DoomClockDetail open onClose={() => {}} definition={definition(total)} state={state(4 * WEEK, total)} />,
      );
      const text = baseElement.textContent ?? '';
      expect(text).toContain(`four weeks of ${spelledCount(weeks)} weeks`);
      expect(text).not.toMatch(/\bmany\b/);
    });
  }

  it('durationLabel spells weeks to ninety-nine, then steps up to years', () => {
    expect(durationLabel(10 * WEEK)).toBe('ten weeks');
    expect(durationLabel(21 * WEEK)).toBe('twenty-one weeks');
    expect(durationLabel(99 * WEEK)).toBe('ninety-nine weeks');
    expect(durationLabel(104 * WEEK)).toBe('two years');
    for (let w = 1; w < 400; w += 3) expect(durationLabel(w * WEEK)).not.toMatch(/many|\d/);
  });

  it('spelledCount reads tens and hyphenated compounds', () => {
    expect(spelledCount(0)).toBe('no');
    expect(spelledCount(15)).toBe('fifteen');
    expect(spelledCount(40)).toBe('forty');
    expect(spelledCount(73)).toBe('seventy-three');
    expect(spelledCount(500)).toBe('ninety-nine');
    expect(spelledCount(Number.NaN)).toBe('no');
  });
});
