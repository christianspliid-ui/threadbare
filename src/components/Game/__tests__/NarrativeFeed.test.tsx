// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NarrativeFeed } from '../NarrativeFeed';
import type { TickEvent } from '../../../types/gameState';

const mockEvents: TickEvent[] = [
  { id: 'evt_1', tick: 10, type: 'agent_action', message: 'Kael marched east.', significance: 0.3 },
  { id: 'evt_2', tick: 11, type: 'doom_escalation', message: 'The breach widened.', significance: 0.8, sphere: 'entropy' },
  { id: 'evt_3', tick: 12, type: 'essence_gain', message: '+2.3 essence flows.', significance: 0.2, sphere: 'force' },
];

describe('NarrativeFeed', () => {
  beforeEach(() => {
    // Mock scrollIntoView since jsdom doesn't implement it
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders all events', () => {
    render(<NarrativeFeed events={mockEvents} />);
    expect(screen.getByText(/Kael marched east/)).toBeTruthy();
    expect(screen.getByText(/breach widened/)).toBeTruthy();
    expect(screen.getByText(/essence flows/)).toBeTruthy();
  });

  it('shows tick numbers', () => {
    render(<NarrativeFeed events={mockEvents} />);
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('11')).toBeTruthy();
  });

  it('renders empty state when no events', () => {
    render(<NarrativeFeed events={[]} />);
    expect(screen.getByText(/awaiting/i)).toBeTruthy();
  });
});
