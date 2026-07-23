// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DivineReceiptModal } from '../DivineReceiptModal';
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
    overview: 'The dream took root in the sleeping mind.',
    changes: [
      { id: 'c1', kind: 'reputation', title: 'Kael trusts you more', detail: 'Reverence deepened.', polarity: 'gain' },
    ],
    presentation: 'modal',
    acknowledged: false,
    ...overrides,
  };
}

describe('DivineReceiptModal', () => {
  it('renders template name, overview, changes, and a woven technical sentence', () => {
    render(<DivineReceiptModal open receipt={makeReceipt()} onAcknowledge={() => {}} />);
    expect(screen.getByText('Oneiric Sending')).toBeTruthy();
    expect(screen.getByText('The dream took root in the sleeping mind.')).toBeTruthy();
    expect(screen.getByText('Kael trusts you more')).toBeTruthy();
    // Technical sentence weaves essence + target + ticks (3 ticks: 7 − 4), no key:value chips.
    const tech = screen.getByTestId('divine-receipt-technical').textContent ?? '';
    expect(tech).toContain('3 Mind essence');
    expect(tech).toContain('Kael');
    expect(tech).toContain('3 ticks');
  });

  it('renders a band-keyed outcome word and a framing line', () => {
    render(<DivineReceiptModal open receipt={makeReceipt({ outcomeBand: 'surge' })} onAcknowledge={() => {}} />);
    // 'surge' → 'triumphed'
    expect(screen.getByTestId('divine-receipt-band-word').textContent).toBe('triumphed');
    expect(screen.getByTestId('divine-receipt-framing').textContent?.length).toBeGreaterThan(0);
  });

  it('calls onAcknowledge when Acknowledge is clicked', () => {
    const onAck = vi.fn();
    render(<DivineReceiptModal open receipt={makeReceipt()} onAcknowledge={onAck} />);
    fireEvent.click(screen.getByTestId('divine-receipt-acknowledge'));
    expect(onAck).toHaveBeenCalledTimes(1);
  });

  it('renders reaction buttons and fires onReaction', () => {
    const onReaction = vi.fn();
    const receipt = makeReceipt({
      reactions: [{ id: 'keep', label: 'Keep the thread', effects: [] }],
    });
    render(<DivineReceiptModal open receipt={receipt} onAcknowledge={() => {}} onReaction={onReaction} />);
    fireEvent.click(screen.getByText('Keep the thread'));
    expect(onReaction).toHaveBeenCalledWith('keep');
  });

  it('renders without changes gracefully', () => {
    render(<DivineReceiptModal open receipt={makeReceipt({ changes: [] })} onAcknowledge={() => {}} />);
    expect(screen.queryByTestId('divine-receipt-changes')).toBeNull();
    expect(screen.getByTestId('divine-receipt-acknowledge')).toBeTruthy();
  });
});
