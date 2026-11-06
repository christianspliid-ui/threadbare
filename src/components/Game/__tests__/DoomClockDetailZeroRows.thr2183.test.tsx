// @vitest-environment jsdom
/**
 * THR-2183 U5 — the Doom panel hides Counter-omens and Doom debt while they are 0,
 * as it already hides Speed modifier at ×1.00. Each row comes back, with its hover,
 * the moment it is not zero.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoomClockDetail } from '../DoomClockDetail';
import type { DoomClockDefinition, DoomClockState } from '../../../types/doomClock';

const definition: DoomClockDefinition = {
  archetype: 'breach',
  totalTicks: 100,
  stages: [
    { stage: 1, name: 'Whispers', tickThreshold: 0.0, events: [] },
    { stage: 2, name: 'Signs', tickThreshold: 0.2, events: [] },
    { stage: 3, name: 'Tremors', tickThreshold: 0.4, events: [] },
    { stage: 4, name: 'Crisis', tickThreshold: 0.6, events: [] },
    { stage: 5, name: 'Culmination', tickThreshold: 0.8, events: [] },
  ],
};

function stateWith(counterOmens: number, debt: number): DoomClockState {
  return {
    definitionArchetype: 'breach',
    currentTick: 25,
    totalTicks: 100,
    currentStage: 2,
    progress: 0.25,
    stageTransitions: [0, 20, 40, 60, 80],
    expired: false,
    tickModifier: 1.0,
    nextEscalationSeverityModifier: debt,
    counterOmens,
    resolvedEvents: [],
  };
}

describe('DoomClockDetail — zero counters are not drawn (THR-2183)', () => {
  it('draws neither row while both are 0', () => {
    const { baseElement } = render(<DoomClockDetail open onClose={() => {}} definition={definition} state={stateWith(0, 0)} />);
    expect(baseElement.textContent).not.toContain('Counter-omens');
    expect(baseElement.textContent).not.toContain('Doom debt');
  });

  it('draws Counter-omens with its hover once there are some', () => {
    const { baseElement } = render(<DoomClockDetail open onClose={() => {}} definition={definition} state={stateWith(2, 0)} />);
    expect(screen.getByText('Counter-omens')).toBeTruthy();
    expect(baseElement.querySelector('[data-tooltip-id="ui.counter_omens"]')).toBeTruthy();
    expect(baseElement.textContent).not.toContain('Doom debt');
  });

  it('draws Doom debt once it is above 0', () => {
    const { baseElement } = render(<DoomClockDetail open onClose={() => {}} definition={definition} state={stateWith(0, 1.5)} />);
    expect(baseElement.textContent).toContain('Doom debt');
    expect(baseElement.textContent).toContain('+1.5');
  });
});
