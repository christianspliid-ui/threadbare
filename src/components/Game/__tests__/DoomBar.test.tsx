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

  it('renders archetype glyph', () => {
    render(<DoomBar definition={mockDefinition} state={mockState} />);
    // DoomBar now shows a glyph (◈ for breach) instead of the archetype text
    expect(screen.getByText('◈')).toBeInTheDocument();
  });

  it('renders current stage name (without Stage N: prefix)', () => {
    render(<DoomBar definition={mockDefinition} state={mockState} />);
    expect(screen.getByText('Signs')).toBeInTheDocument();
  });

  it('renders progress percentage', () => {
    render(<DoomBar definition={mockDefinition} state={mockState} />);
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('shows expired state as UNMADE', () => {
    const expiredState: DoomClockState = { ...mockState, expired: true };
    render(<DoomBar definition={mockDefinition} state={expiredState} />);
    expect(screen.getByText('UNMADE')).toBeInTheDocument();
  });

  it('applies correct archetype color to glyph', () => {
    render(<DoomBar definition={mockDefinition} state={mockState} />);
    const glyphSpan = screen.getByText('◈');
    expect(glyphSpan).toHaveStyle({ color: '#dc2626' });
  });

  it('renders correct stage name at different progress levels', () => {
    const stage4State: DoomClockState = { ...mockState, currentStage: 4, progress: 0.75 };
    render(<DoomBar definition={mockDefinition} state={stage4State} />);
    expect(screen.getByText('Crisis')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders progress bar with correct width', () => {
    const { container } = render(<DoomBar definition={mockDefinition} state={mockState} />);
    // Find the inner fill div of ProgressBar (contains width: 25%)
    const progressBar = container.querySelector('div[style*="width: 25%"]');
    expect(progressBar).toBeTruthy();
  });
});
