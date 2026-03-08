// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NarrativeLog } from '../NarrativeLog';
import type { TickEvent } from '../../../types/gameState';

// Mock TickEvent-like objects
const mockEvents: TickEvent[] = [
  {
    id: 'e1',
    tick: 1,
    type: 'agent_action',
    message: 'Kael hunts in the forest',
    significance: 0.5,
    sphere: 'life',
  },
  {
    id: 'e2',
    tick: 2,
    type: 'doom_escalation',
    message: 'The doom clock advances',
    significance: 0.8,
    sphere: 'entropy',
  },
  {
    id: 'e3',
    tick: 3,
    type: 'narrative',
    message: 'A strange wind blows',
    significance: 0.3,
    sphere: 'spirit',
  },
];

describe('NarrativeLog', () => {
  it('renders toggle pill button', () => {
    render(<NarrativeLog events={mockEvents} />);
    expect(screen.getByTestId('narrative-log-toggle')).toBeInTheDocument();
  });

  it('shows unread count badge', () => {
    render(<NarrativeLog events={mockEvents} />);
    expect(screen.getByTestId('narrative-log-badge')).toHaveTextContent('3');
  });

  it('expands panel when toggle is clicked', () => {
    render(<NarrativeLog events={mockEvents} />);
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    expect(screen.getByTestId('narrative-log-panel')).toBeInTheDocument();
    expect(screen.getByText('Kael hunts in the forest')).toBeInTheDocument();
  });

  it('collapses panel when toggle is clicked again', () => {
    render(<NarrativeLog events={mockEvents} />);
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    expect(screen.getByTestId('narrative-log-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    expect(screen.queryByTestId('narrative-log-panel')).not.toBeInTheDocument();
  });

  it('resets unread count when opened', () => {
    render(<NarrativeLog events={mockEvents} />);
    expect(screen.getByTestId('narrative-log-badge')).toHaveTextContent('3');
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    expect(screen.queryByTestId('narrative-log-badge')).not.toBeInTheDocument();
  });

  it('shows new unread count after new events arrive while closed', () => {
    const { rerender } = render(<NarrativeLog events={mockEvents} />);
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    const newEvents: TickEvent[] = [
      ...mockEvents,
      {
        id: 'e4',
        tick: 4,
        type: 'narrative',
        message: 'Thunder rolls',
        significance: 0.6,
        sphere: 'force',
      },
    ];
    rerender(<NarrativeLog events={newEvents} />);
    expect(screen.getByTestId('narrative-log-badge')).toHaveTextContent('1');
  });

  it('closes on Escape key', () => {
    render(<NarrativeLog events={mockEvents} />);
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    expect(screen.getByTestId('narrative-log-panel')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('narrative-log-panel')).not.toBeInTheDocument();
  });

  it('renders empty state when no events', () => {
    render(<NarrativeLog events={[]} />);
    fireEvent.click(screen.getByTestId('narrative-log-toggle'));
    expect(screen.getByText(/awaiting/i)).toBeInTheDocument();
  });
});
