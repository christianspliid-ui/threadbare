// @vitest-environment jsdom
/**
 * THR-1913 (Inspector plan § D9 way 2) — card counts on world-ref rows and the inline tray.
 *
 * - A row the god can act on shows "N cards"; a row with none shows nothing (Law 25).
 * - Counts are computed only for rendered rows: a folded group never reads its hidden rows.
 * - The tray: one open at a time, a second press or Esc closes it, a card arms with the
 *   row's target and "Cast on <row>" casts it (Law 48) — and the page never navigates.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import type { ActOnCardVM, ConnectionsVM, LinkRowVM } from '../../../../engine/views/subjects/subjectTypes';
import type { WorldRef } from '../../../../types/worldRef';
import { ConnectionsBlock } from '../InspectorParts';
import { RowCardsProvider } from '../RowCards';
import { RefRouterProvider } from '../../../../contexts/RefRouterContext';

function row(kind: WorldRef['kind'], id: string, name: string): LinkRowVM {
  return { ref: { kind, id } as WorldRef, name, fact: '', mapLocated: false, hexKey: null, staleFact: null };
}

const SACRED: ActOnCardVM = { actionId: 'ta_sacred_ground', name: 'Sacred Ground', sphere: 'spirit', available: true, reason: null };
const WHISPER: ActOnCardVM = { actionId: 'ta_whisper', name: 'Whisper', sphere: 'mind', available: true, reason: null };

function connections(rows: LinkRowVM[], foldAfter = rows.length): ConnectionsVM {
  return {
    title: 'Connections',
    groups: [{ id: 'places', label: 'Places', total: rows.length, foldAfter, rows }],
  } as unknown as ConnectionsVM;
}

function mount(opts: { rows: LinkRowVM[]; folded?: boolean; foldAfter?: number; cardsFor?: (ref: WorldRef) => ActOnCardVM[] }) {
  const cardsFor = vi.fn(opts.cardsFor ?? ((ref: WorldRef) => (ref.id === 'quarter' ? [SACRED, WHISPER] : ref.id === 'docks' ? [WHISPER] : [])));
  const cast = vi.fn(() => ({ cast: true, reason: null }));
  const open = vi.fn();
  const router = { open, peek: vi.fn(), close: vi.fn() } as unknown as Parameters<typeof RefRouterProvider>[0]['router'];
  const utils = render(
    <RefRouterProvider router={router}>
      <RowCardsProvider cardsFor={cardsFor} cast={cast}>
        <ConnectionsBlock
          connections={connections(opts.rows, opts.foldAfter)}
          folded={new Set(opts.folded ? ['places'] : [])}
          onShowAll={() => {}}
        />
      </RowCardsProvider>
    </RefRouterProvider>,
  );
  return { ...utils, cardsFor, cast, navigate: open };
}

const ROWS = [row('location', 'quarter', 'Temple Quarter'), row('location', 'docks', 'The Docks'), row('location', 'well', 'Old Well')];

describe('RowCards (THR-1913)', () => {
  it('counts a row the god can act on, and draws nothing on a row with no card', () => {
    const { container } = mount({ rows: ROWS });
    const quarter = container.querySelector('[data-row-cards="location:quarter"]');
    expect(quarter?.querySelector('[data-count]')?.getAttribute('data-count')).toBe('2');
    expect(quarter?.querySelector('[data-chip-role="count"]')?.getAttribute('aria-label')).toBe('2 cards');
    expect(container.querySelector('[data-row-cards="location:docks"] [data-chip-role="count"]')?.getAttribute('aria-label')).toBe('1 card');
    expect(container.querySelector('[data-row-cards="location:well"]')).toBeNull();
  });

  it('computes counts only for rendered rows: a folded group never reads its hidden rows', () => {
    const many = Array.from({ length: 12 }, (_, i) => row('location', `p${i}`, `Place ${i}`));
    const { cardsFor, container } = mount({ rows: many, folded: true, foldAfter: 4 });
    expect(container.querySelectorAll('[data-link-row]').length).toBe(4);
    expect(cardsFor).toHaveBeenCalledTimes(4);
    expect(cardsFor.mock.calls.map(([ref]) => ref.id)).toEqual(['p0', 'p1', 'p2', 'p3']);
  });

  it('opens one tray at a time; a second press closes it', () => {
    const { container } = mount({ rows: ROWS });
    const press = (id: string) => fireEvent.click(container.querySelector(`[data-row-cards="location:${id}"] [data-chip-role="count"]`)!);
    press('quarter');
    expect(container.querySelectorAll('[data-row-tray]').length).toBe(1);
    expect(container.querySelector('[data-row-tray]')?.getAttribute('data-row-tray')).toBe('location:quarter');
    press('docks');
    expect(container.querySelectorAll('[data-row-tray]').length).toBe(1);
    expect(container.querySelector('[data-row-tray]')?.getAttribute('data-row-tray')).toBe('location:docks');
    press('docks');
    expect(container.querySelector('[data-row-tray]')).toBeNull();
  });

  it('Esc closes the open tray', () => {
    const { container } = mount({ rows: ROWS });
    fireEvent.click(container.querySelector('[data-row-cards="location:quarter"] [data-chip-role="count"]')!);
    expect(container.querySelector('[data-row-tray]')).not.toBeNull();
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(container.querySelector('[data-row-tray]')).toBeNull();
  });

  it('arms a card with the row as its target, then casts it in a second press — without navigating', () => {
    const { container, cast, navigate } = mount({ rows: ROWS });
    fireEvent.click(container.querySelector('[data-row-cards="location:quarter"] [data-chip-role="count"]')!);
    const tray = container.querySelector('[data-row-tray="location:quarter"]')!;
    const card = tray.querySelector('[data-act-card="ta_sacred_ground"]')!;
    fireEvent.click(card.querySelector('button')!);
    expect(tray.querySelector('[data-act-card="ta_sacred_ground"]')?.getAttribute('data-armed')).toBe('true');
    const castButton = tray.querySelector('[data-act-cast="ta_sacred_ground"]')!;
    expect(castButton.textContent).toBe('Cast on Temple Quarter');
    expect(cast).not.toHaveBeenCalled();
    fireEvent.click(castButton);
    expect(cast).toHaveBeenCalledWith('ta_sacred_ground', { kind: 'location', id: 'quarter' });
    expect(container.querySelector('[data-row-tray]')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('draws nothing without a provider (the lab, every other surface)', () => {
    const { container } = render(
      <ConnectionsBlock connections={connections(ROWS)} folded={new Set()} onShowAll={() => {}} />,
    );
    expect(container.querySelector('[data-row-cards]')).toBeNull();
  });
});
