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

  it('renders intervention events with sphere-colored left border', () => {
    const events = [{
      id: 'evt_1', tick: 1, type: 'narrative' as const,
      message: 'Test narrative beat', significance: 0.8,
      sphere: 'mind' as const,
      isInterventionBeat: true,
    }];
    render(<NarrativeLog events={events} />);
    // Panel auto-opens when intervention beat is present
    expect(screen.getByTestId('narrative-log-panel')).toBeInTheDocument();
    const entry = screen.getByText(/Test narrative beat/);
    expect(entry.closest('[data-testid="intervention-beat"]')).toBeDefined();
  });

  it('auto-opens when intervention beat arrives', () => {
    const normalEvents = [{
      id: 'evt_1', tick: 1, type: 'narrative' as const,
      message: 'Normal event', significance: 0.5,
    }];
    const { rerender } = render(<NarrativeLog events={normalEvents} />);
    expect(screen.queryByTestId('narrative-log-panel')).not.toBeInTheDocument();

    const withBeat = [...normalEvents, {
      id: 'evt_2', tick: 2, type: 'narrative' as const,
      message: 'Intervention beat', significance: 0.8,
      sphere: 'mind' as const,
      isInterventionBeat: true,
    }];
    rerender(<NarrativeLog events={withBeat} />);
    expect(screen.getByTestId('narrative-log-panel')).toBeInTheDocument();
  });

  describe('click-to-select agent', () => {
    const eventsWithActor: TickEvent[] = [
      {
        id: 'e_with_actor',
        tick: 5,
        type: 'agent_movement',
        message: 'Kael moves to the forest',
        significance: 0.6,
        actorId: 'actor_kael_1',
      },
      {
        id: 'e_no_actor',
        tick: 6,
        type: 'doom_escalation',
        message: 'Doom rises in the land',
        significance: 0.8,
      },
    ];

    it('renders event with actorId as a button when onSelectAgent is provided', () => {
      const onSelectAgent = vi.fn();
      render(<NarrativeLog events={eventsWithActor} onSelectAgent={onSelectAgent} />);
      fireEvent.click(screen.getByTestId('narrative-log-toggle'));

      const actorEntry = screen.getByText('Kael moves to the forest').closest('button');
      expect(actorEntry).not.toBeNull();
    });

    it('renders event without actorId as a non-button div', () => {
      const onSelectAgent = vi.fn();
      render(<NarrativeLog events={eventsWithActor} onSelectAgent={onSelectAgent} />);
      fireEvent.click(screen.getByTestId('narrative-log-toggle'));

      const nonActorEntry = screen.getByText('Doom rises in the land').closest('button');
      expect(nonActorEntry).toBeNull();
    });

    it('calls onSelectAgent with the correct agentId when clicked', () => {
      const onSelectAgent = vi.fn();
      render(<NarrativeLog events={eventsWithActor} onSelectAgent={onSelectAgent} />);
      fireEvent.click(screen.getByTestId('narrative-log-toggle'));

      const actorEntry = screen.getByText('Kael moves to the forest');
      fireEvent.click(actorEntry);
      expect(onSelectAgent).toHaveBeenCalledOnce();
      expect(onSelectAgent).toHaveBeenCalledWith('actor_kael_1');
    });

    it('does not make event clickable when onSelectAgent is not provided', () => {
      render(<NarrativeLog events={eventsWithActor} />);
      fireEvent.click(screen.getByTestId('narrative-log-toggle'));

      // Even event with actorId should render as div when no handler
      const actorEntry = screen.getByText('Kael moves to the forest').closest('button');
      expect(actorEntry).toBeNull();
    });

    it('adds cursor-pointer class to clickable entries', () => {
      const onSelectAgent = vi.fn();
      render(<NarrativeLog events={eventsWithActor} onSelectAgent={onSelectAgent} />);
      fireEvent.click(screen.getByTestId('narrative-log-toggle'));

      const actorEntry = screen.getByText('Kael moves to the forest').closest('button');
      expect(actorEntry?.className).toContain('cursor-pointer');
    });
  });
});
