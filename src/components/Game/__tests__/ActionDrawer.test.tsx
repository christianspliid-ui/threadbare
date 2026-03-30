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

  it('two-click flow: first click focuses, second click activates', () => {
    const onSlotClick = vi.fn();
    render(
      <ActionDrawer open={true} slots={mockSlots} targetName="Kael" targetLabel="Tier 2 Zealot"
        onSlotClick={onSlotClick} onClose={vi.fn()} />
    );
    // First click — focuses card (shows backdrop + focused card)
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onSlotClick).not.toHaveBeenCalled();
    expect(screen.getByTestId('action-drawer-backdrop')).toBeInTheDocument();

    // Second click on the focused card — activates
    // There are now two 'Dream' cards (hand + focused), get the focused one
    const dreamCards = screen.getAllByTestId('action-card-dream');
    const focusedCard = dreamCards.find(el => el.closest('.anim-card-fly-up'));
    fireEvent.click(focusedCard || dreamCards[dreamCards.length - 1]);
    expect(onSlotClick).toHaveBeenCalledWith('dream');
  });

  it('clicking backdrop dismisses focused card', () => {
    render(
      <ActionDrawer open={true} slots={mockSlots} targetName="Kael" targetLabel="Tier 2 Zealot"
        onSlotClick={vi.fn()} onClose={vi.fn()} />
    );
    // Focus a card
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(screen.getByTestId('action-drawer-backdrop')).toBeInTheDocument();

    // Click backdrop
    fireEvent.click(screen.getByTestId('action-drawer-backdrop'));
    expect(screen.queryByTestId('action-drawer-backdrop')).not.toBeInTheDocument();
  });

  it('Escape dismisses focused card first, then closes drawer', () => {
    const onClose = vi.fn();
    render(
      <ActionDrawer open={true} slots={mockSlots} targetName="Kael" targetLabel="Tier 2 Zealot"
        onSlotClick={vi.fn()} onClose={onClose} />
    );
    // Focus a card
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(screen.getByTestId('action-drawer-backdrop')).toBeInTheDocument();

    // First Escape — dismisses focus
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('action-drawer-backdrop')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    // Second Escape — closes drawer
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  // ── Layer filter tabs ────────────────────────────────────────────────────

  it('shows layer filter tabs when slots have narrativeLayer', () => {
    const hexSlots: WheelSlot[] = [
      {
        id: 'ta:hex.bless_land', label: 'Bless Land', type: 'target_action', angleDeg: 0,
        available: true, lockedReason: null, essenceCost: 3, detectionRisk: 0,
        sphere: null, interventionType: null, rangeStatus: 'in_range', hexDistance: 1,
        description: 'Bless the land', narrativeLayer: 'land',
      },
      {
        id: 'ta:hex.attune_leyline', label: 'Attune Leyline', type: 'target_action', angleDeg: 0,
        available: true, lockedReason: null, essenceCost: 5, detectionRisk: 0,
        sphere: null, interventionType: null, rangeStatus: 'in_range', hexDistance: 1,
        description: 'Attune leyline', narrativeLayer: 'soul',
      },
    ];
    render(
      <ActionDrawer open={true} slots={hexSlots} targetName="Hex (3,7)" targetLabel="Desert"
        onSlotClick={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByTestId('layer-filter-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('layer-tab-land')).toBeInTheDocument();
    expect(screen.getByTestId('layer-tab-soul')).toBeInTheDocument();
    // People and ruins have 0 cards — tabs should not render
    expect(screen.queryByTestId('layer-tab-people')).not.toBeInTheDocument();
    expect(screen.queryByTestId('layer-tab-ruins')).not.toBeInTheDocument();
  });

  it('does not show layer tabs for agent intervention slots', () => {
    render(
      <ActionDrawer open={true} slots={mockSlots} targetName="Kael" targetLabel="Tier 2 Zealot"
        onSlotClick={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.queryByTestId('layer-filter-tabs')).not.toBeInTheDocument();
  });

  it('filters cards when switching layer tabs', () => {
    const hexSlots: WheelSlot[] = [
      {
        id: 'ta:hex.bless_land', label: 'Bless Land', type: 'target_action', angleDeg: 0,
        available: true, lockedReason: null, essenceCost: 3, detectionRisk: 0,
        sphere: null, interventionType: null, rangeStatus: 'in_range', hexDistance: 1,
        description: 'Bless the land', narrativeLayer: 'land',
      },
      {
        id: 'ta:hex.attune_leyline', label: 'Attune Leyline', type: 'target_action', angleDeg: 0,
        available: true, lockedReason: null, essenceCost: 5, detectionRisk: 0,
        sphere: null, interventionType: null, rangeStatus: 'in_range', hexDistance: 1,
        description: 'Attune leyline', narrativeLayer: 'soul',
      },
    ];
    render(
      <ActionDrawer open={true} slots={hexSlots} targetName="Hex (3,7)" targetLabel="Desert"
        onSlotClick={vi.fn()} onClose={vi.fn()} />
    );
    // Land is auto-selected — should show land card, hide soul card
    expect(screen.getByText('Bless Land')).toBeInTheDocument();
    expect(screen.queryByText('Attune Leyline')).not.toBeInTheDocument();

    // Switch to soul tab
    fireEvent.click(screen.getByTestId('layer-tab-soul'));
    expect(screen.queryByText('Bless Land')).not.toBeInTheDocument();
    expect(screen.getByText('Attune Leyline')).toBeInTheDocument();
  });

  it('hides location cards (no narrativeLayer) when layer tabs are active', () => {
    const mixedSlots: WheelSlot[] = [
      {
        id: 'ta:hex.bless_land', label: 'Bless Land', type: 'target_action', angleDeg: 0,
        available: true, lockedReason: null, essenceCost: 3, detectionRisk: 0,
        sphere: null, interventionType: null, rangeStatus: 'in_range', hexDistance: 1,
        description: 'Bless the land', narrativeLayer: 'land',
      },
      {
        id: 'ta:loc.ward', label: 'Ward', type: 'target_action', angleDeg: 0,
        available: true, lockedReason: null, essenceCost: 3, detectionRisk: 0,
        sphere: null, interventionType: null, rangeStatus: 'in_range', hexDistance: 1,
        description: 'Place a ward', // no narrativeLayer — location card
      },
    ];
    render(
      <ActionDrawer open={true} slots={mixedSlots} targetName="Hex (3,7)" targetLabel="Desert"
        onSlotClick={vi.fn()} onClose={vi.fn()} />
    );
    // Layer tabs active because hex cards present
    expect(screen.getByTestId('layer-filter-tabs')).toBeInTheDocument();
    // Hex card visible, location card hidden
    expect(screen.getByText('Bless Land')).toBeInTheDocument();
    expect(screen.queryByText('Ward')).not.toBeInTheDocument();
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
