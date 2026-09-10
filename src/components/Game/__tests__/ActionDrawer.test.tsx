// @vitest-environment jsdom
/**
 * ActionDrawer — the god's hand (THR-1002).
 *
 * Rewritten with the drawer. The retired suite's centre was the two-click
 * focus-then-activate flow and the overlay it opened — the focused card, its
 * backdrop, the Effect block, the wiring badge and the cast-risk line. None of
 * those exist: the card face is complete, so nothing expands, and the second click
 * moved to a **Cast** button in the footer (Law 48 — arm, then fire).
 *
 * The arms that carried over are the ones about *the hand*: which cards are in it,
 * how the layer filter narrows it, that locked cards stay collapsed until asked
 * for, and that Escape backs out one step at a time. Those questions survived the
 * rewrite; only the answers' shapes moved.
 *
 * Two arms are new and deliberately drawn at the whole-drawer level: the Law 13
 * numeral sweep and the emoji sweep. Both are the kind of regression that arrives
 * one zone at a time, so they are asserted over everything the drawer renders
 * rather than over a list of places someone remembered to look.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionDrawer } from '../ActionDrawer';
import type { WheelSlot } from '../../../engine/wheel';

function slot(overrides: Partial<WheelSlot> & Pick<WheelSlot, 'id' | 'label'>): WheelSlot {
  return {
    type: 'target_action',
    angleDeg: 0,
    available: true,
    lockedReason: null,
    essenceCost: 1,
    sphere: 'mind',
    interventionType: null,
    rangeStatus: 'in_range',
    hexDistance: null,
    description: '',
    effectsLine: 'Does a thing to a place.',
    crudType: 'update',
    reach: 'iron',
    scale: 'local',
    scaleWord: 'Local',
    forecastTier: 'uncertain',
    templateId: overrides.id,
    ...overrides,
  } as WheelSlot;
}

const mockSlots: WheelSlot[] = [
  slot({ id: 'scry', label: 'Scry', type: 'observation', essenceCost: 0, sphere: null }),
  slot({ id: 'dream', label: 'Dream', type: 'intervention', interventionType: 'dream' }),
  slot({ id: 'center', label: '', type: 'info', essenceCost: 0, sphere: null }),
];

function renderDrawer(props: Partial<React.ComponentProps<typeof ActionDrawer>> = {}) {
  return render(
    <ActionDrawer
      open
      slots={mockSlots}
      targetName="Kael"
      targetLabel="Devoted"
      onSlotClick={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />,
  );
}

describe('ActionDrawer — the hand', () => {
  it('renders when open', () => {
    renderDrawer();
    expect(screen.getByTestId('action-drawer')).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <ActionDrawer
        open={false}
        slots={mockSlots}
        targetName=""
        targetLabel=""
        onSlotClick={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('draws a card for every playable slot, and none for the centre slot', () => {
    renderDrawer();
    expect(screen.getByTestId('action-card-scry')).toBeTruthy();
    expect(screen.getByTestId('action-card-dream')).toBeTruthy();
    expect(screen.queryByTestId('action-card-center')).toBeNull();
  });

  it('lays the cards out in one row rather than a fan', () => {
    renderDrawer();
    const row = screen.getByTestId('action-card-row');
    expect(row.style.flexWrap).toBe('nowrap');
    // The row scrolls its own axis; the page never does (Law 33 / viewport contract).
    expect(row.style.overflowX).toBe('auto');
    expect(row.style.overflowY).toBe('hidden');
  });
});

describe('ActionDrawer — arm, then fire (Law 48)', () => {
  it('does not cast on the first click', () => {
    const onSlotClick = vi.fn();
    renderDrawer({ onSlotClick });
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(onSlotClick).not.toHaveBeenCalled();
    expect(screen.getByTestId('action-card-dream').getAttribute('aria-pressed')).toBe('true');
  });

  it('casts the armed card when Cast is pressed', () => {
    const onSlotClick = vi.fn();
    renderDrawer({ onSlotClick });
    fireEvent.click(screen.getByTestId('action-card-dream'));
    fireEvent.click(screen.getByTestId('action-cast-button'));
    expect(onSlotClick).toHaveBeenCalledWith('dream');
  });

  it('cannot fire with nothing armed, and says so (Law 25)', () => {
    renderDrawer();
    const cast = screen.getByTestId('action-cast-button') as HTMLButtonElement;
    expect(cast.disabled).toBe(true);
    expect(screen.getByTestId('action-cast-hint').textContent).toBe('Choose a card.');
  });

  it('disarms when the armed card is clicked again', () => {
    renderDrawer();
    fireEvent.click(screen.getByTestId('action-card-dream'));
    fireEvent.click(screen.getByTestId('action-card-dream'));
    expect(screen.getByTestId('action-card-dream').getAttribute('aria-pressed')).toBe('false');
    expect((screen.getByTestId('action-cast-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('drops the arm when the armed card leaves the hand', () => {
    // A stale arm surviving a layer switch would let Cast fire a card the player
    // can no longer see. The armed slot is re-resolved against the live hand, so
    // it cannot.
    const { rerender } = renderDrawer();
    fireEvent.click(screen.getByTestId('action-card-dream'));
    rerender(
      <ActionDrawer
        open
        slots={[mockSlots[0]]}
        targetName="Kael"
        targetLabel="Devoted"
        onSlotClick={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect((screen.getByTestId('action-cast-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('Escape disarms first, then closes', () => {
    const onClose = vi.fn();
    renderDrawer({ onClose });
    fireEvent.click(screen.getByTestId('action-card-dream'));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('action-card-dream').getAttribute('aria-pressed')).toBe('false');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ActionDrawer — locked cards (IA-003 progressive disclosure)', () => {
  const withLocked = [
    ...mockSlots,
    slot({ id: 'blight', label: 'Blight', available: false, lockedReason: 'Requires tier 2' }),
  ];

  it('keeps locked cards out of the hand until asked for', () => {
    render(
      <ActionDrawer open slots={withLocked} targetName="" targetLabel=""
        onSlotClick={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.queryByTestId('action-card-blight')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Show 1 locked action/ }));
    expect(screen.getByTestId('action-card-blight')).toBeTruthy();
  });

  it('offers no toggle when nothing is locked', () => {
    renderDrawer();
    expect(screen.queryByRole('button', { name: /locked action/ })).toBeNull();
  });
});

describe('ActionDrawer — layer filter', () => {
  const layered = [
    slot({ id: 'a', label: 'Quarry', narrativeLayer: 'land' }),
    slot({ id: 'b', label: 'Vigil', narrativeLayer: 'soul' }),
    slot({ id: 'c', label: 'Market', narrativeLayer: 'people' }),
    // A location template with no layer — hidden while layer tabs are active.
    slot({ id: 'd', label: 'Consecrate' }),
  ];

  function renderLayered() {
    return render(
      <ActionDrawer open slots={layered} targetName="" targetLabel=""
        onSlotClick={vi.fn()} onClose={vi.fn()} />,
    );
  }

  it('shows a tab per populated layer and selects the first', () => {
    renderLayered();
    expect(screen.getByTestId('layer-filter-tabs')).toBeTruthy();
    expect(screen.getByTestId('layer-tab-land')).toBeTruthy();
    expect(screen.getByTestId('layer-tab-soul')).toBeTruthy();
    expect(screen.queryByTestId('layer-tab-ruins')).toBeNull();
    expect(screen.getByTestId('action-card-a')).toBeTruthy();
    expect(screen.queryByTestId('action-card-b')).toBeNull();
  });

  it('switches the hand when a tab is chosen', () => {
    renderLayered();
    fireEvent.click(screen.getByTestId('layer-tab-soul'));
    expect(screen.getByTestId('action-card-b')).toBeTruthy();
    expect(screen.queryByTestId('action-card-a')).toBeNull();
  });

  it('hides layerless cards while the tabs are active', () => {
    renderLayered();
    expect(screen.queryByTestId('action-card-d')).toBeNull();
  });

  it('shows no tabs for an agent hand', () => {
    renderDrawer();
    expect(screen.queryByTestId('layer-filter-tabs')).toBeNull();
  });
});

describe('ActionDrawer — the surface as a whole', () => {
  it('renders no numeral anywhere (Law 13)', () => {
    // Every card, every chip, every tab label. The card's own suite guards the
    // face; this guards the chrome around it, which is where the tab counts and
    // the locked-card count live.
    const { container } = render(
      <ActionDrawer open slots={mockSlots} targetName="Kael" targetLabel="Devoted"
        onSlotClick={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container.textContent ?? '').not.toMatch(/\d/);
  });

  it('renders no emoji anywhere', () => {
    // The layer tabs carried four (⛰ ✨ 👤 🏛) plus a padlock. Emoji render in each
    // platform's own colour font, so they are the one element class guaranteed to
    // look like a different design system on every machine.
    const layered = [
      slot({ id: 'a', label: 'Quarry', narrativeLayer: 'land' }),
      slot({ id: 'b', label: 'Vigil', narrativeLayer: 'soul' }),
      slot({ id: 'c', label: 'Market', narrativeLayer: 'people' }),
      slot({ id: 'e', label: 'Delve', narrativeLayer: 'ruins' }),
    ];
    const { container } = render(
      <ActionDrawer open slots={layered} targetName="" targetLabel=""
        onSlotClick={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container.textContent ?? '').not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('carries the resolved band from the receipt queue onto the card that cast it', () => {
    // Law 37, wired: the drawer is a *reader* of `playerActionReceipts`, keyed by
    // template id, and never computes a band of its own.
    renderDrawer({ resolvedBands: { dream: 'setback' } });
    expect(screen.getByTestId('action-card-resolved-dream')).toBeTruthy();
    expect(screen.queryByTestId('action-card-resolved-scry')).toBeNull();
  });
});
