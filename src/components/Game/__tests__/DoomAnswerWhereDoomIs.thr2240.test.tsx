// @vitest-environment jsdom
/**
 * THR-2240 — the Doom panel's answer line and "Stay it" button by state, and the Doom
 * bar's hover carrying the same line.
 */
import { describe, it, expect, vi } from 'vitest';
import type React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DoomClockDetail } from '../DoomClockDetail';
import { DoomBar } from '../DoomBar';
import type { DoomClockDefinition, DoomClockState } from '../../../types/doomClock';
import { DOOM_STAY_ACTIVE_LINE, DOOM_STAY_BUTTON, DOOM_STAY_NOT_HELD_LINE, doomStayHint } from '../../../data/doom-stay-content';
import { getUITooltip } from '../../../data/ui-content';

// The Tooltip opens on a timed hover; expose its desc as an attribute instead.
vi.mock('../../shared/Tooltip', () => ({
  Tooltip: ({ id, desc, children }: { id?: string; desc?: string; children?: React.ReactNode }) => (
    <span data-tooltip-id={id} data-tooltip-desc={desc}>{children}</span>
  ),
}));

const definition: DoomClockDefinition = {
  archetype: 'breach',
  totalTicks: 100,
  stages: [
    { stage: 1, name: 'Reality Cracks', tickThreshold: 0.0, events: [] },
    { stage: 2, name: 'The Thinning', tickThreshold: 0.2, events: [] },
    { stage: 3, name: 'Tremors', tickThreshold: 0.4, events: [] },
    { stage: 4, name: 'Crisis', tickThreshold: 0.6, events: [] },
    { stage: 5, name: 'Culmination', tickThreshold: 0.8, events: [] },
  ],
};

function state(over: Partial<DoomClockState> = {}): DoomClockState {
  return {
    definitionArchetype: 'breach',
    currentTick: 25,
    totalTicks: 100,
    currentStage: 2,
    progress: 0.25,
    stageTransitions: [0, 20, 40, 60, 80],
    expired: false,
    tickModifier: 1.0,
    nextEscalationSeverityModifier: 0,
    counterOmens: 0,
    resolvedEvents: [],
    ...over,
  };
}

const HELD_LINE = doomStayHint('Mind');

describe('DoomClockDetail — the answer line (THR-2240)', () => {
  it('not held: the line, and no button', () => {
    render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state()} stayLine={DOOM_STAY_NOT_HELD_LINE} onStay={() => {}} />);
    expect(screen.getByTestId('doom-stay-answer').textContent).toBe(DOOM_STAY_NOT_HELD_LINE);
    expect(screen.queryByTestId('doom-stay-button')).toBeNull();
  });

  it('held, not active: the hint and a "Stay it" button that calls the handler', () => {
    const onStay = vi.fn();
    render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state()} stayLine={HELD_LINE} stayButton={DOOM_STAY_BUTTON} onStay={onStay} />);
    expect(screen.getByTestId('doom-stay-answer').textContent).toContain(HELD_LINE);
    const button = screen.getByTestId('doom-stay-button');
    expect(button.textContent).toBe('Stay it');
    fireEvent.click(button);
    expect(onStay).toHaveBeenCalledTimes(1);
  });

  it('active: "You are holding it back." and no button', () => {
    render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state()} stayLine={DOOM_STAY_ACTIVE_LINE} onStay={() => {}} />);
    expect(screen.getByTestId('doom-stay-answer').textContent).toBe(DOOM_STAY_ACTIVE_LINE);
    expect(screen.queryByTestId('doom-stay-button')).toBeNull();
  });

  it('sits under the current stage', () => {
    render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state()} stayLine={HELD_LINE} />);
    const stageRow = screen.getByText('The Thinning').closest('div[style]')?.parentElement;
    expect(stageRow?.querySelector('[data-testid="doom-stay-answer"]')).not.toBeNull();
  });

  it('is gone once the doom has landed', () => {
    render(<DoomClockDetail open onClose={() => {}} definition={definition} state={state({ expired: true })} stayLine={HELD_LINE} stayButton={DOOM_STAY_BUTTON} onStay={() => {}} />);
    expect(screen.queryByTestId('doom-stay-answer')).toBeNull();
  });
});

describe('DoomBar — the hover says what slows it (THR-2240)', () => {
  function hoverDesc(stayLine?: string): string {
    const { container } = render(<DoomBar definition={definition} state={state()} stayLine={stayLine} />);
    return container.querySelector('[data-tooltip-id="ui.doom_bar"]')?.getAttribute('data-tooltip-desc') ?? '';
  }

  it('carries the held line after the next-stage hint', () => {
    const text = hoverDesc(HELD_LINE);
    expect(text).toContain(`Next: Tremors. ${HELD_LINE}`);
  });

  it('carries the not-held line too, and nothing when no line is given', () => {
    expect(hoverDesc(DOOM_STAY_NOT_HELD_LINE)).toContain(`Next: Tremors. ${DOOM_STAY_NOT_HELD_LINE}`);
    expect(hoverDesc(undefined)).toMatch(/Next: Tremors.$/);
  });

  it('the static hover text stays within its 200-character check', () => {
    expect((getUITooltip('ui.doom_bar')?.desc ?? '').length).toBeLessThanOrEqual(200);
  });
});
