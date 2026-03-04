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
      {
        stage: 1,
        name: 'Whispers',
        tickThreshold: 0.0,
        events: [],
      },
      {
        stage: 2,
        name: 'Signs',
        tickThreshold: 0.2,
        events: [],
      },
      {
        stage: 3,
        name: 'Tremors',
        tickThreshold: 0.4,
        events: [],
      },
      {
        stage: 4,
        name: 'Crisis',
        tickThreshold: 0.6,
        events: [],
      },
      {
        stage: 5,
        name: 'Culmination',
        tickThreshold: 0.8,
        events: [],
      },
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

  it('renders archetype name', () => {
    render(<DoomBar definition={mockDefinition} state={mockState} />);
    expect(screen.getByText('breach')).toBeInTheDocument();
  });

  it('renders current stage name', () => {
    render(<DoomBar definition={mockDefinition} state={mockState} />);
    expect(screen.getByText(/Stage 2: Signs/)).toBeInTheDocument();
  });

  it('renders progress percentage', () => {
    render(<DoomBar definition={mockDefinition} state={mockState} />);
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('shows expired state', () => {
    const expiredState: DoomClockState = {
      ...mockState,
      expired: true,
    };
    render(<DoomBar definition={mockDefinition} state={expiredState} />);
    expect(screen.getByText('THE UNMAKING')).toBeInTheDocument();
  });

  it('uses correct archetype color', () => {
    const { container } = render(<DoomBar definition={mockDefinition} state={mockState} />);
    const archetypeSpan = screen.getByText('breach');
    expect(archetypeSpan).toHaveStyle({ color: '#dc2626' });
  });

  it('uses default color for unknown archetype', () => {
    const customDefinition: DoomClockDefinition = {
      ...mockDefinition,
      archetype: 'breach',
    };
    const { container } = render(<DoomBar definition={customDefinition} state={mockState} />);
    const archetypeSpan = screen.getByText('breach');
    expect(archetypeSpan).toHaveStyle({ color: '#dc2626' });
  });

  it('renders correct stage at different progress levels', () => {
    const stage4State: DoomClockState = {
      ...mockState,
      currentStage: 4,
      progress: 0.75,
    };
    render(<DoomBar definition={mockDefinition} state={stage4State} />);
    expect(screen.getByText(/Stage 4: Crisis/)).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders progress bar with correct width', () => {
    const { container } = render(<DoomBar definition={mockDefinition} state={mockState} />);
    const progressBar = container.querySelector('div[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '25%' });
  });
});
