// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionDrawer } from '../ActionDrawer';
import type { WheelSlot } from '../../../engine/wheel';

const mockSlots: WheelSlot[] = [
  {
    id: 'scry', label: 'Scry', type: 'observation', angleDeg: 0,
    available: true, lockedReason: null, essenceCost: 0, detectionRisk: 0,
    sphere: null, interventionType: null, rangeStatus: 'unknown', hexDistance: null,
    description: 'Observe agent psyche and situation',
  },
  {
    id: 'dream', label: 'Dream', type: 'intervention', angleDeg: 45,
    available: true, lockedReason: null, essenceCost: 1, detectionRisk: 0.1,
    sphere: 'mind', interventionType: 'dream', rangeStatus: 'unlimited', hexDistance: null,
    description: 'Manipulate selection probabilities during sleep',
  },
  {
    id: 'center', label: '', type: 'info', angleDeg: -1,
    available: true, lockedReason: null, essenceCost: 0, detectionRisk: 0,
    sphere: null, interventionType: null, rangeStatus: 'unknown', hexDistance: null,
    description: '',
  },
];

describe('ActionDrawer', () => {
  it('renders when open', () => {
    render(
      <ActionDrawer open={true} slots={mockSlots} targetName="Kael" targetLabel="Tier 2 Zealot"
        onSlotClick={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByTestId('action-drawer')).toBeInTheDocument();
  });

  it('does not render cards when closed', () => {
    render(
      <ActionDrawer open={false} slots={mockSlots} targetName="Kael" targetLabel="Tier 2 Zealot"
        onSlotClick={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.queryByText('Dream')).not.toBeInTheDocument();
  });

  it('renders action cards for non-center slots', () => {
    render(
      <ActionDrawer open={true} slots={mockSlots} targetName="Kael" targetLabel="Tier 2 Zealot"
        onSlotClick={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText('Scry')).toBeInTheDocument();
    expect(screen.getByText('Dream')).toBeInTheDocument();
    expect(screen.queryByTestId('action-card-center')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ActionDrawer open={true} slots={mockSlots} targetName="Kael" targetLabel="Tier 2 Zealot"
        onSlotClick={vi.fn()} onClose={onClose} />
    );
    fireEvent.click(screen.getByTestId('action-drawer-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSlotClick when an action card is clicked', () => {
    const onSlotClick = vi.fn();
    render(
      <ActionDrawer open={true} slots={mockSlots} targetName="Kael" targetLabel="Tier 2 Zealot"
        onSlotClick={onSlotClick} onClose={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onSlotClick).toHaveBeenCalledWith('dream');
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(
      <ActionDrawer open={true} slots={mockSlots} targetName="Kael" targetLabel="Tier 2 Zealot"
        onSlotClick={vi.fn()} onClose={onClose} />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('sorts cards: available first, locked last (IA-003 progressive disclosure)', () => {
    const mixedSlots: WheelSlot[] = [
      { ...mockSlots[0] },
      {
        id: 'coincidence', label: 'Coincidence', type: 'intervention', angleDeg: 225,
        available: false, lockedReason: 'Requires tier 3', essenceCost: 4,
        detectionRisk: 0.6, sphere: 'time', interventionType: 'coincidence',
        rangeStatus: 'unlimited', hexDistance: null, description: 'Alter environmental prerequisites',
      },
      { ...mockSlots[1] },
      mockSlots[2],
    ];
    render(
      <ActionDrawer open={true} slots={mixedSlots} targetName="Kael" targetLabel="Tier 2 Zealot"
        onSlotClick={vi.fn()} onClose={vi.fn()} />
    );
    // Available cards are visible immediately
    const availableCards = screen.getAllByRole('button').filter(el => el.getAttribute('data-testid')?.startsWith('action-card-'));
    expect(availableCards[0].getAttribute('data-testid')).toBe('action-card-scry');

    // Locked cards hidden by default — toggle reveals them
    expect(screen.queryByTestId('action-card-coincidence')).toBeNull();
    const toggleBtn = screen.getByRole('button', { name: /locked/i });
    fireEvent.click(toggleBtn);

    // After expanding, locked card is visible
    expect(screen.getByTestId('action-card-coincidence')).toBeInTheDocument();
  });
});
