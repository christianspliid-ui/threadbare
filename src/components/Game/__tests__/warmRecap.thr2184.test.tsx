// @vitest-environment jsdom
/**
 * THR-2184 — "While you were away": the warm-up card's recap state, and the hook's
 * fail-soft build (plan `Docs/plans/2026-11-06-thr-2173-while-you-were-away.md`).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WarmStartOverlay } from '../WarmStartOverlay';
import { buildArrivalRecap } from '../hooks/useWarmStart';
import type { WarmRecapVM } from '../../../engine/views/warmRecap';

const RECAP: WarmRecapVM = {
  ledgerKey: 'a1',
  cut: [],
  lines: [
    { kind: 'first_finished', segments: [{ text: 'Kael' }, { text: ' won ' }, { text: 'Bridge Toll' }, { text: ', at a price.' }] },
    {
      kind: 'slipped',
      segments: [
        { text: 'Iron Glade' }, { text: ' slipped from ' },
        { text: 'Held', tooltipId: 'ui.dominion.held' }, { text: ' to ' },
        { text: 'Touched', tooltipId: 'ui.dominion.touched' }, { text: '.' },
      ],
    },
  ],
};

function renderRecap(over: Partial<Parameters<typeof WarmStartOverlay>[0]> = {}) {
  const onBegin = vi.fn();
  const onOpenLedger = vi.fn();
  render(
    <WarmStartOverlay progress={null} firstName="Kael" recap={RECAP} onBegin={onBegin} onOpenLedger={onOpenLedger} {...over} />,
  );
  return { onBegin, onOpenLedger };
}

describe('WarmStartOverlay — the recap state (THR-2184)', () => {
  it('shows the title, one row per line, and the two buttons', () => {
    renderRecap();
    const card = screen.getByTestId('warm-recap');
    expect(card.textContent).toMatch(/While you were away/);
    expect(card.getAttribute('data-dialog-size')).toBe('m');
    expect(screen.getByTestId('warm-recap-line-first_finished').textContent).toBe('Kael won Bridge Toll, at a price.');
    expect(screen.getByTestId('warm-recap-line-slipped').textContent).toBe('Iron Glade slipped from Held to Touched.');
    expect(screen.getByTestId('warm-recap-begin').textContent).toBe('Begin');
    expect(screen.getByTestId('warm-recap-open-ledger').textContent).toBe('Read it in the Ledger');
    expect(screen.queryByTestId('warm-start-overlay')).toBeNull();
  });

  it('focuses Begin; Begin and Escape close it; the Ledger button opens the Ledger', () => {
    const { onBegin, onOpenLedger } = renderRecap();
    expect(document.activeElement).toBe(screen.getByTestId('warm-recap-begin'));
    fireEvent.click(screen.getByTestId('warm-recap-begin'));
    expect(onBegin).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onBegin).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByTestId('warm-recap-open-ledger'));
    expect(onOpenLedger).toHaveBeenCalledTimes(1);
  });

  it('says what happens next: the held decision, else the paused world', () => {
    renderRecap({ heldDecisionWaiting: true });
    expect(screen.getByTestId('warm-recap-next').textContent)
      .toBe('Anything that needs your choice has waited for you. It opens when you begin.');
  });

  it('names the paused clock when nothing waits', () => {
    renderRecap({ heldDecisionWaiting: false });
    expect(screen.getByTestId('warm-recap-next').textContent).toBe('The world is paused. Press play when you are ready.');
  });

  it('without a recap, is the waiting card exactly', () => {
    render(
      <WarmStartOverlay progress={{ startTick: 0, targetTick: 300, currentTick: 10, remainingMs: null }} firstName={null} />,
    );
    expect(screen.getByTestId('warm-start-overlay')).toBeTruthy();
    expect(screen.queryByTestId('warm-recap')).toBeNull();
  });
});

describe('buildArrivalRecap (fail-soft)', () => {
  it('builds from the snapshot when one was taken', () => {
    const buildRecap = vi.fn(() => RECAP);
    const snap = { startTick: 5, firstId: 'k', bands: { p: 'held' as const } };
    expect(buildArrivalRecap({ buildRecap }, snap, 0)).toBe(RECAP);
    expect(buildRecap).toHaveBeenCalledWith(snap);
  });

  it('falls back to the start tick and The First with no bands when the snapshot is missing', () => {
    const buildRecap = vi.fn(() => RECAP);
    buildArrivalRecap({ buildRecap, getFirstId: () => 'kael' }, null, 42);
    expect(buildRecap).toHaveBeenCalledWith({ startTick: 42, firstId: 'kael', bands: {} });
  });

  it('returns null (the card closes as before) when building throws', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(buildArrivalRecap({ buildRecap: () => { throw new Error('boom'); } }, null, 0)).toBeNull();
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it('returns null when no builder is wired', () => {
    expect(buildArrivalRecap({}, null, 0)).toBeNull();
  });
});
