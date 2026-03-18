// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationView } from '../LocationView';
import type { GraphNode } from '../../../types/graph';
import type { EncounterTemplate, EncounterProgress } from '../../../types/encounter';

const mockLocation: GraphNode = {
  id: 'loc.tavern',
  type: 'location',
  name: 'The Rusty Tankard',
  properties: { locationType: 'location', hexCol: 3, hexRow: 4, terrain: 'forest', locationSubtype: 'tavern' },
};

const mockAgents: GraphNode[] = [
  { id: 'a.1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } },
  { id: 'a.2', type: 'actor', name: 'Mirael', properties: { actorType: 'individual' } },
];

const mockEncounterTemplate: EncounterTemplate = {
  id: 'encounter.test_quest',
  name: 'Test Quest',
  locationTypes: ['tavern'],
  steps: [
    {
      id: 'step1',
      name: 'Enter',
      narrative: 'You approach the tavern...',
      reach: 'eye',
      difficulty: 35,
      onSuccess: { narrative: 'You succeed!' },
      onFailure: { narrative: 'You fail...' },
    },
    {
      id: 'step2',
      name: 'Explore',
      narrative: 'Deeper within...',
      reach: 'iron',
      difficulty: 45,
      onSuccess: { narrative: 'Victory!' },
      onFailure: { narrative: 'Defeat...' },
    },
  ],
  reachPrimary: 'eye',
  reachSecondary: 'iron',
  encounterType: 'explore',
  threatRating: 'moderate',
  motivations: ['courage_prudence'],
};

const mockEncounterProgress: EncounterProgress = {
  encounterId: 'encounter.test_quest',
  actorId: 'a.1',
  currentEncounterIndex: 0,
  history: [],
  status: 'active',
  startedTick: 10,
};

describe('LocationView', () => {
  const defaultProps = {
    location: mockLocation,
    agents: mockAgents,
    hexTerrain: 'forest',
    hexCol: 3,
    hexRow: 4,
    onAgentClick: vi.fn(),
    onBack: vi.fn(),
    availableEncounters: [] as EncounterTemplate[],
    activeEncounters: [] as EncounterProgress[],
    getAgentName: (id: string) => `Agent ${id}`,
    getEncounterTemplate: vi.fn(() => undefined),
  };

  it('renders location name', () => {
    render(<LocationView {...defaultProps} />);
    expect(screen.getByText('The Rusty Tankard')).toBeTruthy();
  });

  it('renders agents present', () => {
    render(<LocationView {...defaultProps} />);
    expect(screen.getByText('Kael')).toBeTruthy();
    expect(screen.getByText('Mirael')).toBeTruthy();
  });

  it('calls onAgentClick when agent clicked', () => {
    const onAgentClick = vi.fn();
    render(<LocationView {...defaultProps} onAgentClick={onAgentClick} />);
    fireEvent.click(screen.getByText('Kael'));
    expect(onAgentClick).toHaveBeenCalledWith('a.1');
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<LocationView {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows hex context label', () => {
    render(<LocationView {...defaultProps} />);
    expect(screen.getByText(/Forest Hex/)).toBeTruthy();
    expect(screen.getByText(/3, 4/)).toBeTruthy();
  });

  it('renders encounter section with no encounters', () => {
    render(<LocationView {...defaultProps} />);
    expect(screen.getByText(/the stillness here is unbroken/i)).toBeTruthy();
  });

  it('renders with empty agents list', () => {
    render(<LocationView {...defaultProps} agents={[]} />);
    expect(screen.getByText(/this place lies quiet/i)).toBeTruthy();
  });

  it('renders available encounters', () => {
    render(
      <LocationView
        {...defaultProps}
        availableEncounters={[mockEncounterTemplate]}
      />
    );
    expect(screen.getByText('Test Quest')).toBeTruthy();
    expect(screen.getByText(/moderate/)).toBeTruthy();
    expect(screen.getByText(/explore · eye/)).toBeTruthy();
  });

  it('renders multiple available encounters (shows all if <= 5)', () => {
    const encounters = Array.from({ length: 3 }, (_, i) => ({
      ...mockEncounterTemplate,
      id: `encounter.${i}`,
      name: `Quest ${i + 1}`,
    }));
    render(
      <LocationView
        {...defaultProps}
        availableEncounters={encounters}
      />
    );
    expect(screen.getByText('Quest 1')).toBeTruthy();
    expect(screen.getByText('Quest 2')).toBeTruthy();
    expect(screen.getByText('Quest 3')).toBeTruthy();
  });

  it('renders all available encounters in scrollable list', () => {
    const encounters = Array.from({ length: 7 }, (_, i) => ({
      ...mockEncounterTemplate,
      id: `encounter.${i}`,
      name: `Quest ${i + 1}`,
    }));
    render(
      <LocationView
        {...defaultProps}
        availableEncounters={encounters}
      />
    );
    expect(screen.getByText('Quest 1')).toBeTruthy();
    expect(screen.getByText('Quest 5')).toBeTruthy();
    expect(screen.getByText('Quest 6')).toBeTruthy();
    expect(screen.getByText('Quest 7')).toBeTruthy();
    expect(screen.queryByText(/more available/)).toBeFalsy();
  });

  it('renders active encounter with EncounterLog', () => {
    const getTemplate = vi.fn(() => mockEncounterTemplate);
    const getAgent = vi.fn(() => 'Kael');
    render(
      <LocationView
        {...defaultProps}
        activeEncounters={[mockEncounterProgress]}
        getEncounterTemplate={getTemplate}
        getAgentName={getAgent}
      />
    );
    expect(screen.getByText(/Kael faces Test Quest/)).toBeTruthy();
    expect(getTemplate).toHaveBeenCalledWith('encounter.test_quest');
    expect(getAgent).toHaveBeenCalledWith('a.1');
  });

  it('renders threat rating badge with correct color class', () => {
    render(
      <LocationView
        {...defaultProps}
        availableEncounters={[mockEncounterTemplate]}
      />
    );
    const badge = screen.getByText('moderate');
    expect(badge).toBeTruthy();
    expect(badge.style.backgroundColor).toBeTruthy();
  });
});
