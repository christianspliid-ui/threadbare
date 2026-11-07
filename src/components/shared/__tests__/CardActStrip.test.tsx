// @vitest-environment jsdom
/**
 * THR-1928 — the act strip on a cards section (the Crossroads row).
 *
 * Arm-then-fire (Law 48): a lean button arms its tile and shows the forecast, the price
 * as pips and the confirm sentence before paying (Law 17); "Lean" fires once; "Not now"
 * and Escape disarm (Law 23); an unpayable price dims "Lean" with its reason (Law 25).
 * With no handlers (the lab, a hover card) the strip draws its words and no controls.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { CardActOffer, CardsSection } from '../../../types/detailPage';
import { Section } from '../Section';
import { CardActContext, type CardActHandlers } from '../CardActStrip';

function offer(optionIndex: number, direction: CardActOffer['direction'], extra: Partial<CardActOffer> = {}): CardActOffer {
  return {
    optionIndex, direction,
    label: direction === 'toward' ? 'Lean toward' : 'Lean away',
    forecast: 'It may tip Kael.',
    confirm: 'Lean Kael toward the Feast, paid now in Life essence, whatever Kael chooses.',
    cost: 3, sphere: 'life', blockedReason: null,
    ...extra,
  };
}

function section(extra: Partial<CardsSection> = {}): CardsSection {
  return {
    kind: 'cards', typeId: 'crossroads', label: 'Next, Kael weighs', gold: false, tier: 'routine', source: 'test',
    tiles: [
      { title: 'The Duel', kindWord: 'A chance', lines: [], offers: [offer(0, 'toward'), offer(0, 'away')] },
      { title: 'The Feast', kindWord: 'A chance', lines: [], offers: [offer(1, 'toward')] },
    ],
    act: { kind: 'crossroads', subjectId: 'ind_kael', intro: [{ text: 'Kael is torn.' }], fireLabel: 'Lean', cancelLabel: 'Not now' },
    ...extra,
  };
}

function withHandlers(node: React.ReactNode, handlers: Partial<CardActHandlers> = {}) {
  const value: CardActHandlers = { fire: vi.fn(() => ({ ok: true })), lift: vi.fn(() => ({ ok: true })), ...handlers };
  return { value, ...render(<CardActContext.Provider value={value}>{node}</CardActContext.Provider>) };
}

describe('CardActStrip (THR-1928)', () => {
  it('draws the intro and the arming buttons, nothing armed', () => {
    withHandlers(<Section section={section()} />);
    expect(screen.getByText('Kael is torn.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Lean toward' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Lean away' })).toHaveLength(1);
    expect(document.querySelector('[data-act-armed]')).toBeNull();
  });

  it('arming shows forecast, pips and confirm before paying; "Lean" fires once', () => {
    const { value } = withHandlers(<Section section={section()} />);
    fireEvent.click(document.querySelector('[data-act-offer="1:toward"]')!);
    expect(document.querySelector('[data-act-armed="1:toward"]')).not.toBeNull();
    expect(screen.getByText('It may tip Kael.')).toBeInTheDocument();
    expect(screen.getByTestId('act-cost')).toBeInTheDocument();
    expect(screen.getByText(/paid now in Life essence/)).toBeInTheDocument();
    expect(value.fire).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Lean' }));
    expect(value.fire).toHaveBeenCalledTimes(1);
    expect((value.fire as ReturnType<typeof vi.fn>).mock.calls[0][1]).toMatchObject({ optionIndex: 1, direction: 'toward' });
    expect(document.querySelector('[data-act-armed]')).toBeNull();
  });

  it('one armed tile at a time; "Not now" and Escape disarm', () => {
    withHandlers(<Section section={section()} />);
    fireEvent.click(document.querySelector('[data-act-offer="0:away"]')!);
    fireEvent.click(document.querySelector('[data-act-offer="1:toward"]')!);
    expect(document.querySelectorAll('[data-act-armed]')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(document.querySelector('[data-act-armed]')).toBeNull();
    fireEvent.click(document.querySelector('[data-act-offer="0:toward"]')!);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('[data-act-armed]')).toBeNull();
  });

  it('an unpayable price dims "Lean" and says why', () => {
    const s = section();
    s.tiles[1].offers = [offer(1, 'toward', { blockedReason: 'Not enough Life essence.' })];
    const { value } = withHandlers(<Section section={s} />);
    fireEvent.click(document.querySelector('[data-act-offer="1:toward"]')!);
    expect(screen.getByText('Not enough Life essence.')).toBeInTheDocument();
    const lean = screen.getByRole('button', { name: 'Lean' });
    expect(lean).toBeDisabled();
    fireEvent.click(lean);
    expect(value.fire).not.toHaveBeenCalled();
  });

  it('a refusal at fire time stays armed and shows the reason', () => {
    withHandlers(<Section section={section()} />, { fire: () => ({ ok: false, message: 'Kael no longer weighs that road.' }) });
    fireEvent.click(document.querySelector('[data-act-offer="1:toward"]')!);
    fireEvent.click(screen.getByRole('button', { name: 'Lean' }));
    expect(screen.getByText('Kael no longer weighs that road.')).toBeInTheDocument();
    expect(document.querySelector('[data-act-armed]')).not.toBeNull();
  });

  it('held: the held line and "Lift your hand" only; the leaned tile is marked', () => {
    const s = section({
      act: { kind: 'crossroads', subjectId: 'ind_kael', fireLabel: 'Lean', cancelLabel: 'Not now', held: { line: 'Your hand rests on Kael, toward the Feast.', liftLabel: 'Lift your hand' } },
      tiles: [{ title: 'The Duel', kindWord: 'A chance', lines: [] }, { title: 'The Feast', kindWord: 'A chance', lines: [], marked: true }],
    });
    const { value } = withHandlers(<Section section={s} />);
    expect(screen.getByText('Your hand rests on Kael, toward the Feast.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lean toward' })).toBeNull();
    expect(document.querySelectorAll('[data-tile-marked]')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Lift your hand' }));
    expect(value.lift).toHaveBeenCalledTimes(1);
  });

  it('no handlers → words only, no control (Law 25)', () => {
    render(<Section section={section()} />);
    expect(screen.getByText('Kael is torn.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lean toward' })).toBeNull();
  });
});
