// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationView } from '../LocationView';
import type { GraphNode } from '../../../types/graph';

const mockLocation: GraphNode = {
  id: 'loc.tavern',
  type: 'location',
  name: 'The Rusty Tankard',
  properties: { locationType: 'location', hexCol: 3, hexRow: 4, terrain: 'forest' },
};

const mockAgents: GraphNode[] = [
  { id: 'a.1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } },
  { id: 'a.2', type: 'actor', name: 'Mirael', properties: { actorType: 'individual' } },
];

describe('LocationView', () => {
  const defaultProps = {
    location: mockLocation,
    agents: mockAgents,
    hexTerrain: 'forest',
    hexCol: 3,
    hexRow: 4,
    onAgentClick: vi.fn(),
    onBack: vi.fn(),
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

  it('shows ordeal placeholder', () => {
    render(<LocationView {...defaultProps} />);
    expect(screen.getByText(/No active Ordeals/i)).toBeTruthy();
  });

  it('renders with empty agents list', () => {
    render(<LocationView {...defaultProps} agents={[]} />);
    expect(screen.getByText(/no agents present/i)).toBeTruthy();
  });
});
