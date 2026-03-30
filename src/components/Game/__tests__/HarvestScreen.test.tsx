// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HarvestScreen } from '../HarvestScreen';
import type { HarvestResult, HarvestEchoCandidate } from '../../../engine/cycleEnd';
import type { EchoDefinition } from '../../../types/echo';

describe('HarvestScreen', () => {
  const mockEchoDefinition1: EchoDefinition = {
    id: 'echo_1_actor_1',
    echoType: 'legacy',
    source: 'cosmic',
    originNodeId: 'actor_1',
    originCycle: 0,
    name: 'The Fallen King',
    summary: 'A once-mighty ruler whose legacy shaped the age.',
    sphereAffinities: ['Spirit', 'Mind'],
    significance: 0.85,
    injection: {
      injectionType: 'cultural_template',
      description: 'Echoes of royal court structures',
    },
  };

  const mockEchoDefinition2: EchoDefinition = {
    id: 'echo_1_artifact_5',
    echoType: 'monument',
    source: 'cosmic',
    originNodeId: 'artifact_5',
    originCycle: 0,
    name: 'The Sunken Tower',
    summary: 'An ancient structure bearing witness to countless eons.',
    sphereAffinities: ['Force', 'Time'],
    significance: 0.72,
    injection: {
      injectionType: 'location_feature',
      description: 'Mysterious tower ruins appear in new cycles',
    },
  };

  const mockCandidate1: HarvestEchoCandidate = {
    node: {
      id: 'actor_1',
      type: 'actor',
      name: 'The Fallen King',
      properties: { actorType: 'individual' },
    },
    score: 0.85,
    echoDefinition: mockEchoDefinition1,
  };

  const mockCandidate2: HarvestEchoCandidate = {
    node: {
      id: 'artifact_5',
      type: 'artifact',
      name: 'The Sunken Tower',
      properties: {},
    },
    score: 0.72,
    echoDefinition: mockEchoDefinition2,
  };

  const mockBitterSweetHarvest: HarvestResult = {
    harvestType: 'bittersweet',
    cosmicEchoCandidates: [mockCandidate1, mockCandidate2],
    divineEchoSlots: 2,
    chronicleSummary: 'A bittersweet age. The Fallen King left a lasting mark.',
  };

  const mockTriumphantHarvest: HarvestResult = {
    harvestType: 'triumphant',
    cosmicEchoCandidates: [mockCandidate1],
    divineEchoSlots: 3,
    chronicleSummary: 'A triumphant age. The Fallen King shone brightest among the echoes.',
  };

  const mockSomberHarvest: HarvestResult = {
    harvestType: 'somber',
    cosmicEchoCandidates: [mockCandidate2],
    divineEchoSlots: 1,
    chronicleSummary: 'A somber age. The Sunken Tower faded into memory.',
  };

  it('renders harvest type heading for bittersweet', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onBeginNextCycle={vi.fn()} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/bittersweet age/i);
  });

  it('renders harvest type heading for triumphant', () => {
    render(<HarvestScreen harvest={mockTriumphantHarvest} cycle={2} onBeginNextCycle={vi.fn()} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/triumphant age/i);
  });

  it('renders harvest type heading for somber', () => {
    render(<HarvestScreen harvest={mockSomberHarvest} cycle={3} onBeginNextCycle={vi.fn()} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/somber age/i);
  });

  it('renders cycle number', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={5} onBeginNextCycle={vi.fn()} />);
    expect(screen.getByText(/cycle 5 complete/i)).toBeInTheDocument();
  });

  it('renders chronicle summary', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onBeginNextCycle={vi.fn()} />);
    expect(screen.getByText('A bittersweet age. The Fallen King left a lasting mark.')).toBeInTheDocument();
  });

  it('renders echo candidate names', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onBeginNextCycle={vi.fn()} />);
    expect(screen.getByText('The Fallen King')).toBeInTheDocument();
    expect(screen.getByText('The Sunken Tower')).toBeInTheDocument();
  });

  it('renders echo summaries', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onBeginNextCycle={vi.fn()} />);
    expect(screen.getByText('A once-mighty ruler whose legacy shaped the age.')).toBeInTheDocument();
    expect(screen.getByText('An ancient structure bearing witness to countless eons.')).toBeInTheDocument();
  });

  it('renders sphere affinities for each echo', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onBeginNextCycle={vi.fn()} />);
    expect(screen.getByText('Spirit')).toBeInTheDocument();
    expect(screen.getByText('Mind')).toBeInTheDocument();
    expect(screen.getByText('Force')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  it('renders significance scores for echoes', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onBeginNextCycle={vi.fn()} />);
    expect(screen.getByText(/significance: 85/i)).toBeInTheDocument();
    expect(screen.getByText(/significance: 72/i)).toBeInTheDocument();
  });

  it('renders divine echo slot count', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onBeginNextCycle={vi.fn()} />);
    expect(screen.getByText(/2 divine echo slots available/i)).toBeInTheDocument();
  });

  it('renders singular slot text when divineEchoSlots is 1', () => {
    render(<HarvestScreen harvest={mockSomberHarvest} cycle={3} onBeginNextCycle={vi.fn()} />);
    expect(screen.getByText(/1 divine echo slot available/i)).toBeInTheDocument();
  });

  it('does not render divine slots section when divineEchoSlots is 0', () => {
    const harvestWithNoDivineSlots: HarvestResult = {
      ...mockBitterSweetHarvest,
      divineEchoSlots: 0,
    };
    render(<HarvestScreen harvest={harvestWithNoDivineSlots} cycle={1} onBeginNextCycle={vi.fn()} />);
    expect(screen.queryByText(/divine echo slot/i)).not.toBeInTheDocument();
  });

  it('does not render echo candidates section when array is empty', () => {
    const harvestWithNoEchoes: HarvestResult = {
      ...mockBitterSweetHarvest,
      cosmicEchoCandidates: [],
    };
    render(<HarvestScreen harvest={harvestWithNoEchoes} cycle={1} onBeginNextCycle={vi.fn()} />);
    expect(screen.queryByText(/echoes preserved/i)).not.toBeInTheDocument();
    expect(screen.queryByText('The Fallen King')).not.toBeInTheDocument();
  });

  it('calls onBeginNextCycle when button is clicked', () => {
    const onBeginNextCycle = vi.fn();
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onBeginNextCycle={onBeginNextCycle} />);

    const button = screen.getByRole('button', { name: /begin next cycle/i });
    fireEvent.click(button);

    expect(onBeginNextCycle).toHaveBeenCalledTimes(1);
  });

  it('renders cosmic echo count in heading', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onBeginNextCycle={vi.fn()} />);
    expect(screen.getByText(/echoes preserved \(2 cosmic\)/i)).toBeInTheDocument();
  });
});
