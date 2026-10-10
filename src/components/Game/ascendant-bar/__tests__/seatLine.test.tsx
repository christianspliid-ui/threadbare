// @vitest-environment jsdom
/**
 * THR-1792 — the god's seat is named and findable on the bar.
 *
 * The bar shows no seat line before the Seat beat sets `homeSeatLocationId`, and
 * `Seat: <name>` after; clicking the name calls the centre handler with the seat's
 * place-tier id (a sublocation seat climbs to its settlement).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import { SeatLine } from '../SeatLine';
import { selectHomeSeat } from '../selectors';
import { resolveTooltip } from '../../../../engine/tooltipResolver';

const ASC = 'asc-1';

function stateWithSeat(seatId?: string): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASC,
    type: 'actor',
    name: 'The God',
    properties: seatId ? { homeSeatLocationId: seatId } : {},
  });
  graph.addNode({
    id: 'loc-haven',
    type: 'location',
    name: 'Haven',
    properties: { locationSubtype: 'town', hexCol: 4, hexRow: 5 },
  });
  graph.addNode({
    id: 'sub-hall',
    type: 'location',
    name: 'The Hall',
    properties: { parentLocationId: 'loc-haven' },
  });
  return { ascendantId: ASC, graph } as unknown as GameState;
}

function renderLine(state: GameState, onCenter = vi.fn()) {
  render(<SeatLine seat={selectHomeSeat(state)} onCenter={onCenter} />);
  return onCenter;
}

describe('SeatLine (THR-1792)', () => {
  it('renders nothing before the seat is placed', () => {
    renderLine(stateWithSeat());
    expect(screen.queryByTestId('ascendant-bar-seat')).toBeNull();
  });

  it('shows "Seat: <name>" after placement and centres on the place-tier id', () => {
    const onCenter = renderLine(stateWithSeat('loc-haven'));
    const line = screen.getByTestId('ascendant-bar-seat');
    expect(line.textContent).toBe('Seat:Haven');
    fireEvent.click(screen.getByRole('button', { name: /Haven/ }));
    expect(onCenter).toHaveBeenCalledWith('loc-haven');
  });

  it('a sublocation seat names and centres on its settlement', () => {
    const onCenter = renderLine(stateWithSeat('sub-hall'));
    fireEvent.click(screen.getByRole('button', { name: /Haven/ }));
    expect(onCenter).toHaveBeenCalledWith('loc-haven');
  });

  it('a dangling seat id reads as no seat (fail-soft)', () => {
    renderLine(stateWithSeat('loc-gone'));
    expect(screen.queryByTestId('ascendant-bar-seat')).toBeNull();
  });

  it('the hover comes from the registry and carries no numbers (Laws 13, 17)', () => {
    const tip = resolveTooltip('ui.home_seat');
    expect(tip?.label).toBe('Seat');
    expect(tip?.desc ?? '').not.toMatch(/\d/);
  });
});
