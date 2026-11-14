// @vitest-environment jsdom
/**
 * THR-2220 — the receipt dialog's verdict word. A dream that found no hold read
 * "Dream · held"; a plain success read "held", which is also a Dominion tier.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DivineReceiptModal } from '../DivineReceiptModal';
import { RECEIPT_BAND_WORD_NO_HOLD, RECEIPT_FRAME_LINES_NO_HOLD } from '../../../data/receipt-content';
import type { PlayerActionReceipt } from '../../../engine/playerReceipts';

function makeReceipt(overrides?: Partial<PlayerActionReceipt>): PlayerActionReceipt {
  return {
    id: 'receipt_ua-1',
    actionId: 'ua-1',
    templateId: 'divine.dream',
    templateName: 'Oneiric Sending',
    targetId: 'mortal-1',
    targetName: 'Kael',
    sphere: 'mind',
    essencePaid: 3,
    startTick: 4,
    resolvedTick: 7,
    outcome: 'success',
    outcomeBand: 'neutral',
    overview: 'The dream found nothing in Kael to take hold of.',
    changes: [],
    presentation: 'modal',
    acknowledged: false,
    ...overrides,
  };
}

describe('THR-2220 — DivineReceiptModal verdict word', () => {
  it('a no-hold cast reads "found no hold", never "held", with the no-hold frame and no chips', () => {
    render(<DivineReceiptModal open receipt={makeReceipt({ tookNoHold: true })} onAcknowledge={() => {}} />);
    const word = screen.getByTestId('divine-receipt-band-word').textContent ?? '';
    expect(word).toBe(RECEIPT_BAND_WORD_NO_HOLD);
    expect(word).not.toMatch(/\bheld\b/i);
    expect(RECEIPT_FRAME_LINES_NO_HOLD).toContain(screen.getByTestId('divine-receipt-framing').textContent);
    expect(screen.queryByTestId('divine-receipt-changes')).toBeNull();
  });

  it('a plain success reads "landed", and a success at cost "landed at a cost"', () => {
    const { unmount } = render(<DivineReceiptModal open receipt={makeReceipt()} onAcknowledge={() => {}} />);
    expect(screen.getByTestId('divine-receipt-band-word').textContent).toBe('landed');
    unmount();
    render(<DivineReceiptModal open receipt={makeReceipt({ outcomeBand: 'strained' })} onAcknowledge={() => {}} />);
    expect(screen.getByTestId('divine-receipt-band-word').textContent).toBe('landed at a cost');
  });
});
