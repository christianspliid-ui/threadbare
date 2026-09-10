// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('renders archetype icon (SVG sphere icon for breach)', () => {
    const { container } = render(<DoomBar definition={mockDefinition} state={mockState} />);
    // breach maps to 'order' sphere — renders an SVG icon
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
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

  it('renders SVG sphere icon for breach (not Unicode glyph)', () => {
    // breach maps to 'order' sphere — the SVG stroke color uses the order sphere color (#fbbf24)
    const { container } = render(<DoomBar definition={mockDefinition} state={mockState} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // No raw Unicode glyph should appear for breach
    expect(container.textContent).not.toContain('◈');
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
});
