// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HexZoomView } from '../HexZoomView';
import type { GraphNode, GraphEdge } from '../../../types/graph';

const mockLocations: GraphNode[] = [
  { id: 'loc.1', type: 'location', name: 'Tavern', properties: { hexCol: 3, hexRow: 4, terrain: 'grassland' } },
  { id: 'loc.2', type: 'location', name: 'Temple', properties: { hexCol: 3, hexRow: 4, terrain: 'grassland' } },
  { id: 'loc.3', type: 'location', name: 'Market', properties: { hexCol: 3, hexRow: 4, terrain: 'grassland' } },
];

const mockAgentsByLocation: Record<string, GraphNode[]> = {
  'loc.1': [{ id: 'a.1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } }],
  'loc.2': [],
  'loc.3': [
    { id: 'a.2', type: 'actor', name: 'Mirael', properties: { actorType: 'individual' } },
    { id: 'a.3', type: 'actor', name: 'Thorne', properties: { actorType: 'individual' } },
  ],
};

const mockConnections: GraphEdge[] = [
  { id: 'e.1', source: 'loc.1', target: 'loc.2', type: 'adjacent', properties: {} },
];

describe('HexZoomView', () => {
  const defaultProps = {
    locations: mockLocations,
    agentsByLocation: mockAgentsByLocation,
    connections: mockConnections,
    lineOfSight: 'full' as const,
    onLocationClick: vi.fn(),
  };

  it('renders location names', () => {
    render(<HexZoomView {...defaultProps} />);
    expect(screen.getByText('Tavern')).toBeTruthy();
    expect(screen.getByText('Temple')).toBeTruthy();
    expect(screen.getByText('Market')).toBeTruthy();
  });

  it('renders agent initials near locations', () => {
    render(<HexZoomView {...defaultProps} />);
    expect(screen.getByText('K')).toBeTruthy();  // Kael
    expect(screen.getByText('M')).toBeTruthy();  // Mirael
    expect(screen.getByText('T')).toBeTruthy();  // Thorne
  });

  it('calls onLocationClick on single click', () => {
    const onLocationClick = vi.fn();
    render(<HexZoomView {...defaultProps} onLocationClick={onLocationClick} />);
    fireEvent.click(screen.getByText('Tavern'));
    expect(onLocationClick).toHaveBeenCalledWith('loc.1');
  });

  it('dims locations when line of sight is none', () => {
    render(<HexZoomView {...defaultProps} lineOfSight="none" />);
    // When lineOfSight is 'none', all location names should show as "?"
    const questionMarks = screen.getAllByText('?');
    expect(questionMarks.length).toBe(3);  // 3 locations all showing "?"
  });

  it('renders with zero locations without crashing', () => {
    render(<HexZoomView {...defaultProps} locations={[]} agentsByLocation={{}} connections={[]} />);
    // Should render the hex outline but no location circles
    // Just verify it renders without error
    expect(true).toBe(true);
  });
});
