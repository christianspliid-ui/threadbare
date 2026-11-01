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
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onWakeNewWorld={vi.fn()} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/bittersweet age/i);
  });

  it('renders harvest type heading for triumphant', () => {
    render(<HarvestScreen harvest={mockTriumphantHarvest} cycle={2} onWakeNewWorld={vi.fn()} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/triumphant age/i);
  });

  it('renders harvest type heading for somber', () => {
    render(<HarvestScreen harvest={mockSomberHarvest} cycle={3} onWakeNewWorld={vi.fn()} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/somber age/i);
  });

  it('renders cycle number', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={5} onWakeNewWorld={vi.fn()} />);
    expect(screen.getByText(/cycle 5 complete/i)).toBeInTheDocument();
  });

  it('renders chronicle summary', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onWakeNewWorld={vi.fn()} />);
    expect(screen.getByText('A bittersweet age. The Fallen King left a lasting mark.')).toBeInTheDocument();
  });

  it('renders echo candidate names, the one way every surface names an echo (THR-2102, PC-6)', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onWakeNewWorld={vi.fn()} />);
    expect(screen.getByText('the line of The Fallen King')).toBeInTheDocument();
    expect(screen.getByText('The Sunken Tower')).toBeInTheDocument();
  });

  it('renders echo summaries', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onWakeNewWorld={vi.fn()} />);
    expect(screen.getByText('A once-mighty ruler whose legacy shaped the age.')).toBeInTheDocument();
    expect(screen.getByText('An ancient structure bearing witness to countless eons.')).toBeInTheDocument();
  });

  it('renders sphere affinities for each echo', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onWakeNewWorld={vi.fn()} />);
    expect(screen.getByText('Spirit')).toBeInTheDocument();
    expect(screen.getByText('Mind')).toBeInTheDocument();
    expect(screen.getByText('Force')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  it('renders banded significance words for echoes, never a percentage (Law 13, THR-1357)', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onWakeNewWorld={vi.fn()} />);
    // scores 0.85 / 0.72 band to 'defining' (≥0.75) and 'resonant' (≥0.5)
    expect(screen.getByText(/a defining echo of the age/i)).toBeInTheDocument();
    expect(screen.getByText(/a resonant echo of the age/i)).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/significance:/i)).not.toBeInTheDocument();
  });

  it('names what the god leaves behind (THR-1813)', () => {
    const harvest: HarvestResult = {
      ...mockBitterSweetHarvest,
      divineEchoes: [
        { ...mockEchoDefinition2, id: 'echo_1_divine_loc_1', source: 'divine', name: 'The Long Barrow' },
        { ...mockEchoDefinition1, id: 'echo_1_divine_actor_9', source: 'divine', name: 'Maren Ashfold' },
      ],
    };
    render(<HarvestScreen harvest={harvest} cycle={1} onWakeNewWorld={vi.fn()} />);
    expect(screen.getByText('Your age leaves behind: The Long Barrow and the line of Maren Ashfold.')).toBeInTheDocument();
  });

  it('says the age leaves little when no divine echo was picked (THR-1813)', () => {
    render(<HarvestScreen harvest={mockSomberHarvest} cycle={3} onWakeNewWorld={vi.fn()} />);
    expect(screen.getByText('Your age leaves little the next world will remember.')).toBeInTheDocument();
    expect(screen.queryByText(/divine echo slot/i)).not.toBeInTheDocument();
  });

  it('shows the save-failure line only when the record was not kept (THR-1813)', () => {
    const { rerender } = render(<HarvestScreen harvest={mockSomberHarvest} cycle={3} onWakeNewWorld={vi.fn()} accountSaved={true} />);
    expect(screen.queryByTestId('harvest-save-failed')).not.toBeInTheDocument();
    rerender(<HarvestScreen harvest={mockSomberHarvest} cycle={3} onWakeNewWorld={vi.fn()} accountSaved={false} />);
    expect(screen.getByTestId('harvest-save-failed').textContent).toMatch(/could not be kept on this device/);
  });

  it('promises no echoes when the run is not carried — the Advanced path (THR-1813 review cycle 4)', () => {
    const harvest: HarvestResult = {
      ...mockSomberHarvest,
      divineEchoes: [{ ...mockEchoDefinition2, id: 'echo_1_divine_loc_1', source: 'divine', name: 'The Long Barrow' }],
    };
    render(<HarvestScreen harvest={harvest} cycle={3} onWakeNewWorld={vi.fn()} accountSaved={true} accountCarried={false} />);
    expect(screen.queryByTestId('harvest-leaves')).not.toBeInTheDocument();
    expect(screen.queryByText(/leaves behind/)).not.toBeInTheDocument();
    expect(screen.getByTestId('harvest-not-carried').textContent).toMatch(/will not remember it/);
  });

  it('names no preserved or left-behind echo when the save failed (THR-1813 review cycle 4)', () => {
    const harvest: HarvestResult = {
      ...mockBitterSweetHarvest,
      divineEchoes: [{ ...mockEchoDefinition2, id: 'echo_1_divine_loc_1', source: 'divine', name: 'The Long Barrow' }],
    };
    render(<HarvestScreen harvest={harvest} cycle={3} onWakeNewWorld={vi.fn()} accountSaved={false} />);
    expect(screen.queryByTestId('harvest-leaves')).not.toBeInTheDocument();
    expect(screen.queryByText(/Echoes preserved/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('harvest-not-carried')).not.toBeInTheDocument();
    expect(screen.getByTestId('harvest-save-failed')).toBeInTheDocument();
  });

  it('does not render echo candidates section when array is empty', () => {
    const harvestWithNoEchoes: HarvestResult = {
      ...mockBitterSweetHarvest,
      cosmicEchoCandidates: [],
    };
    render(<HarvestScreen harvest={harvestWithNoEchoes} cycle={1} onWakeNewWorld={vi.fn()} />);
    expect(screen.queryByText(/echoes preserved/i)).not.toBeInTheDocument();
    expect(screen.queryByText('The Fallen King')).not.toBeInTheDocument();
  });

  it('calls onWakeNewWorld when the button is clicked', () => {
    const onWakeNewWorld = vi.fn();
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onWakeNewWorld={onWakeNewWorld} />);

    const button = screen.getByRole('button', { name: /wake in a new world/i });
    fireEvent.click(button);

    expect(onWakeNewWorld).toHaveBeenCalledTimes(1);
  });

  it('renders cosmic echo count in heading as a word (Law 13)', () => {
    render(<HarvestScreen harvest={mockBitterSweetHarvest} cycle={1} onWakeNewWorld={vi.fn()} />);
    expect(screen.getByText(/echoes preserved — two cosmic/i)).toBeInTheDocument();
  });
});
