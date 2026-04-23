// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecentEventsView } from '../RecentEventsView';
import type { TickEvent } from '../../../../types/gameState';

const events: TickEvent[] = [
  {
    id: 'evt-1',
    tick: 12,
    type: 'narrative',
    message: 'A cold wind crosses Ashvale',
    significance: 0.4,
    sphere: 'spirit',
  },
  {
    id: 'evt-2',
    tick: 13,
    type: 'narrative',
    message: 'Intervention beat',
    significance: 0.9,
    sphere: 'mind',
    isInterventionBeat: true,
  },
];

describe('RecentEventsView', () => {
  it('does not subscribe while stream is off', () => {
    const getRecentEvents = vi.fn(() => events);
    render(<RecentEventsView getRecentEvents={getRecentEvents} />);

    expect(getRecentEvents).not.toHaveBeenCalled();
    expect(screen.queryByTestId('recent-event-row')).toBeNull();
    expect(screen.queryByTestId('intervention-beat')).toBeNull();
  });

  it('renders rows after stream is enabled', () => {
    const getRecentEvents = vi.fn(() => events);
    render(<RecentEventsView getRecentEvents={getRecentEvents} />);

    fireEvent.click(screen.getByLabelText('Stream recent events'));

    expect(getRecentEvents).toHaveBeenCalled();
    expect(screen.getByText('A cold wind crosses Ashvale')).toBeInTheDocument();
    expect(screen.getByText('Intervention beat')).toBeInTheDocument();
  });

  it('marks intervention beats for styling hooks', () => {
    render(<RecentEventsView getRecentEvents={() => events} />);

    fireEvent.click(screen.getByLabelText('Stream recent events'));

    expect(screen.getByTestId('intervention-beat')).toBeInTheDocument();
  });
});
