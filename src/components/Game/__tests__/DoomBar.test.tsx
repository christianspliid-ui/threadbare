// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DoomBar } from '../DoomBar';
import type { DoomClockDefinition, DoomClockState } from '../../../types/doomClock';

describe('DoomBar', () => {
  const mockDefinition: DoomClockDefinition = {
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

  const mockState: DoomClockState = {
    definitionArchetype: 'breach',
    currentTick: 25,
    totalTicks: 100,
    currentStage: 2,
    progress: 0.25,
    stageTransitions: [0, 20, 40, 60, 80],
    expired: false,
    tickModifier: 1.0,
  };

  // THR-1774: the sigil follows the doom's own cards. Breach presses no sphere, so it
  // shows its glyph; Reckoning's cards press Mind, so it shows the Mind sphere icon.
  it('renders the glyph for a doom that presses no sphere (breach)', () => {
    const { container } = render(<DoomBar definition={mockDefinition} state={mockState} />);
    const sigil = container.querySelector('[data-doom-sigil="breach"]');
    expect(sigil?.textContent).toBe('◈');
    expect(sigil?.querySelector('svg')).toBeNull();
    expect(sigil?.closest('[data-tooltip-id="doom.breach"]')).toBeTruthy();
  });

  it('renders current stage name (without Stage N: prefix)', () => {
    render(<DoomBar definition={mockDefinition} state={mockState} />);
    expect(screen.getByText('Signs')).toBeInTheDocument();
  });

  // THR-1424 (Law 15 ruling, 2026-09-10): doom progress is a unitless proportion and this tier
  // already renders it as the ProgressBar. The numeral is dropped, so the arm inverts — it
  // asserts no percentage reaches the surface, and that the bar still carries the reading.
  it('renders no percentage numeral — the progress bar is the reading', () => {
    const { container } = render(<DoomBar definition={mockDefinition} state={mockState} />);
    expect(container.textContent).not.toMatch(/%/);
    // Falsification: the bar must still be there, or this arm would pass on an empty render.
    expect(container.querySelector('div[style*="width: 25%"]')).toBeTruthy();
  });

  it('shows expired state as UNMADE', () => {
    const expiredState: DoomClockState = { ...mockState, expired: true };
    render(<DoomBar definition={mockDefinition} state={expiredState} />);
    expect(screen.getByText('UNMADE')).toBeInTheDocument();
  });

  it('renders the sphere icon for a doom whose cards press one (reckoning → mind)', () => {
    const definition: DoomClockDefinition = { ...mockDefinition, archetype: 'reckoning' };
    const { container } = render(<DoomBar definition={definition} state={{ ...mockState, definitionArchetype: 'reckoning' }} />);
    const sigil = container.querySelector('[data-doom-sigil="reckoning"]');
    expect(sigil?.querySelector('svg')).toBeTruthy();
    expect(sigil?.innerHTML).toContain('sphere-mind');
    expect(sigil?.getAttribute('aria-label')).toBe('Reckoning');
    expect(sigil?.textContent).not.toContain('⚔');
  });

  it('renders correct stage name at different progress levels', () => {
    const stage4State: DoomClockState = { ...mockState, currentStage: 4, progress: 0.75 };
    const { container } = render(<DoomBar definition={mockDefinition} state={stage4State} />);
    expect(screen.getByText('Crisis')).toBeInTheDocument();
    // THR-1424: the stage NAME is the reading at every progress level; the numeral is gone.
    expect(container.textContent).not.toMatch(/%/);
  });

  it('renders progress bar with correct width', () => {
    const { container } = render(<DoomBar definition={mockDefinition} state={mockState} />);
    // Find the inner fill div of ProgressBar (contains width: 25%)
    const progressBar = container.querySelector('div[style*="width: 25%"]');
    expect(progressBar).toBeTruthy();
  });

  // THR-1774: the sigil's tooltip sits inside the bar's trigger; the innermost trigger
  // wins, so hovering the sigil never stacks the bar's popup over it.
  it('hovering the sigil shows only the doom tooltip, not the bar tooltip on top of it', () => {
    vi.useFakeTimers();
    try {
      const definition: DoomClockDefinition = { ...mockDefinition, archetype: 'reckoning' };
      const { container } = render(<DoomBar definition={definition} state={{ ...mockState, definitionArchetype: 'reckoning' }} />);
      const sigil = container.querySelector('[data-doom-sigil="reckoning"]')!;
      act(() => { fireEvent.pointerOver(sigil); });
      act(() => { vi.advanceTimersByTime(2000); });
      const tips = Array.from(document.querySelectorAll('[role="tooltip"]')).map(t => t.textContent ?? '');
      expect(tips).toHaveLength(1);
      expect(tips[0]).toContain('Past debts coming due');
    } finally {
      vi.useRealTimers();
    }
  });
});
