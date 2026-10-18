// @vitest-environment jsdom
/**
 * THR-1894 — the god rail's hand and folded rows (frame plan § F6, Done when slice 2).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HandSection } from '../HandSection';
import { HandPressProvider } from '../HandPressContext';
import { HAND_FIT_HYSTERESIS_PX, handWholeHeight, nextHandFitMode, openHandGroup } from '../handFit';
import type { GodRailHand, HandCardVM } from '../../../../engine/views/godRail';
import { HAND_REST_LINES } from '../../../../data/frame-content';
import { GOD_RAIL_HAND_GROUP_KEY } from '../../../../data/frame-registry';

function card(id: string, paySphere: HandCardVM['paySphere'], name = id): HandCardVM {
  return {
    id, name, description: '', paySphere, paySphereWord: paySphere, parPriceLabel: '2 essence',
    line2: `${paySphere} · 2 essence`, priceTooltip: 'par', payable: true, reason: null, codexEntryId: id,
  };
}

const HAND: GodRailHand = {
  coreVerbs: ['move', 'investiture'],
  cards: [card('divine.self.focus', 'spirit', 'Focus'), card('divine.self.recede', 'spirit', 'Recede'), card('divine.inspire', 'life', 'Inspire')],
  sphereOrder: ['spirit', 'life'],
};

describe('the fit rule (handFit)', () => {
  it('whole while every row fits; grouped past it; back to whole only with the hysteresis to spare', () => {
    const need = handWholeHeight(8);
    expect(nextHandFitMode('whole', need, need)).toBe('whole');
    expect(nextHandFitMode('whole', need, need - 1)).toBe('grouped');
    expect(nextHandFitMode('grouped', need, need)).toBe('grouped');
    expect(nextHandFitMode('grouped', need, need + HAND_FIT_HYSTERESIS_PX)).toBe('whole');
  });

  it('with no measurement (no ResizeObserver) the hand stays whole', () => {
    expect(nextHandFitMode('grouped', 9999, null)).toBe('whole');
  });

  it('opens the armed card\'s group, else the remembered one, else the first', () => {
    expect(openHandGroup(['spirit', 'life'], 'life', 'spirit')).toBe('life');
    expect(openHandGroup(['spirit', 'life'], null, 'life')).toBe('life');
    expect(openHandGroup(['spirit', 'life'], null, 'gone')).toBe('spirit');
    expect(openHandGroup([], null, null)).toBeNull();
  });
});

describe('HandSection', () => {
  beforeEach(() => localStorage.clear());

  it('headed "Your cards" with the count; Move and Investiture lead; every card in whole mode', () => {
    render(<HandSection hand={HAND} showInvestiture rest={null} />);
    expect(screen.getByText('Your cards')).toBeTruthy();
    expect(screen.getByText('Move')).toBeTruthy();
    expect(screen.getByText('Investiture')).toBeTruthy();
    expect(screen.getAllByTestId('hand-card')).toHaveLength(3);
    expect(screen.getByTestId('god-rail-hand').dataset.handMode).toBe('whole');
  });

  it('Investiture waits for its reveal', () => {
    render(<HandSection hand={HAND} showInvestiture={false} rest={null} />);
    expect(screen.queryByText('Investiture')).toBeNull();
  });

  it('a press calls the provider\'s seam with the card id', () => {
    const press = vi.fn();
    render(
      <HandPressProvider value={{ press, armedActionId: null }}>
        <HandSection hand={HAND} showInvestiture rest={null} />
      </HandPressProvider>,
    );
    fireEvent.click(screen.getByText('Inspire'));
    expect(press).toHaveBeenCalledWith('divine.inspire');
  });

  it('while a moment is open the rows rest: the line reads as written and a press does nothing', () => {
    const press = vi.fn();
    const { rerender } = render(
      <HandPressProvider value={{ press, armedActionId: null }}>
        <HandSection hand={HAND} showInvestiture rest="moment" />
      </HandPressProvider>,
    );
    expect(screen.getByTestId('hand-rest-line').textContent).toBe(HAND_REST_LINES.moment);
    expect(HAND_REST_LINES.moment).toBe('Your cards wait while this moment is open.');
    fireEvent.click(screen.getByText('Inspire'));
    expect(press).not.toHaveBeenCalled();
    rerender(
      <HandPressProvider value={{ press, armedActionId: null }}>
        <HandSection hand={HAND} showInvestiture rest="encounter" />
      </HandPressProvider>,
    );
    expect(screen.getByTestId('hand-rest-line').textContent).toBe('Your cards wait. This encounter deals its own hand.');
  });

  it('an empty hand says where cards come from', () => {
    render(<HandSection hand={{ ...HAND, cards: [] }} showInvestiture rest={null} />);
    expect(screen.getByText("No cards yet. Your story's gifts bring them.")).toBeTruthy();
  });

  it('an unpayable card dims with its reason', () => {
    const dear = { ...card('divine.inspire', 'life', 'Inspire'), payable: false, reason: 'Not enough Life essence' };
    render(<HandSection hand={{ ...HAND, cards: [dear] }} showInvestiture rest={null} />);
    expect(screen.getByTestId('hand-card-reason').textContent).toBe('Not enough Life essence');
    expect(screen.getByTestId('hand-card').dataset.payable).toBe('false');
  });

  describe('at the rail\'s limit', () => {
    let restore: () => void;
    beforeEach(() => {
      // A 100 px hand region (three rows need ~198 px) and a ResizeObserver that measures once.
      const desc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return 100; } });
      const RO = globalThis.ResizeObserver;
      globalThis.ResizeObserver = class { constructor(_cb: ResizeObserverCallback) {} observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
      restore = () => {
        if (desc) Object.defineProperty(HTMLElement.prototype, 'clientHeight', desc);
        globalThis.ResizeObserver = RO;
      };
    });
    afterEach(() => restore());

    it('groups by paying sphere, headed "{Sphere} · {n}", one group open', () => {
      render(<HandSection hand={HAND} showInvestiture rest={null} />);
      const section = screen.getByTestId('god-rail-hand');
      expect(section.dataset.handMode).toBe('grouped');
      expect(screen.getByText('Spirit · 2')).toBeTruthy();
      expect(screen.getByText('Life · 1')).toBeTruthy();
      expect(section.dataset.handOpenGroup).toBe('spirit');
      expect(screen.getAllByTestId('hand-card')).toHaveLength(2);
    });

    it('the armed card\'s group stays open and the row shows the selected state', () => {
      render(
        <HandPressProvider value={{ press: vi.fn(), armedActionId: 'divine.inspire' }}>
          <HandSection hand={HAND} showInvestiture rest={null} />
        </HandPressProvider>,
      );
      expect(screen.getByTestId('god-rail-hand').dataset.handOpenGroup).toBe('life');
      expect(screen.getByTestId('hand-card').dataset.armed).toBe('true');
    });

    it('opening a group closes the others and is remembered', () => {
      render(<HandSection hand={HAND} showInvestiture rest={null} />);
      fireEvent.click(screen.getByText('Life · 1'));
      expect(screen.getByTestId('god-rail-hand').dataset.handOpenGroup).toBe('life');
      expect(localStorage.getItem(GOD_RAIL_HAND_GROUP_KEY)).toBe('life');
    });
  });
});
