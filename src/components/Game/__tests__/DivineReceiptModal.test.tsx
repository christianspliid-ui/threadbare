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
    // Technical sentence weaves essence + target + the elapsed term, no key:value chips.
    const tech = screen.getByTestId('divine-receipt-technical').textContent ?? '';
    expect(tech).toContain('3 Mind essence');
    expect(tech).toContain('Kael');
    // THR-1425: this arm used to read `toContain('3 ticks')`. Its intent — that the sentence
    // still weaves the elapsed span in, rather than dropping the clause — survives the
    // rewording, so it is replaced rather than deleted. 7 − 4 = 3 ticks, under a day.
    expect(tech).toContain('the working took less than a day to resolve');
  });

  it('the elapsed clause carries no numeral and never names the engine unit', () => {
    // Scoped to the clause rather than the whole sentence: the essence spend is a
    // resource-pool balance, which Law 13's 2026-08-06 amendment permits as a numeral.
    // Asserting the whole sentence digit-free would fail on that exception and tempt a
    // later reader to weaken the arm rather than scope it.
    const elapsedClause = (text: string): string => {
      const m = text.match(/the working took (.*?) to resolve/);
      expect(m, `no elapsed clause in: ${text}`).toBeTruthy();
      return m![1];
    };

    // Under a day — the floor case `durationLabel` would have read as `one day`.
    const { unmount } = render(
      <DivineReceiptModal open receipt={makeReceipt()} onAcknowledge={() => {}} />,
    );
    const short = screen.getByTestId('divine-receipt-technical').textContent ?? '';
    expect(elapsedClause(short)).toBe('less than a day');
    expect(elapsedClause(short)).not.toMatch(/\d/);
    expect(short).not.toMatch(/tick/i);
    unmount();

    // Over a day — proves the clause is not hardcoded to the floor, which is the way this
    // arm would otherwise pass while the days/weeks half of the ladder was broken.
    render(
      <DivineReceiptModal
        open
        receipt={makeReceipt({ startTick: 0, resolvedTick: 48 })}
        onAcknowledge={() => {}}
      />,
    );
    const long = screen.getByTestId('divine-receipt-technical').textContent ?? '';
    expect(elapsedClause(long)).toBe('four days');
    expect(elapsedClause(long)).not.toMatch(/\d/);
    expect(long).not.toMatch(/tick/i);
  });

  it('an instantaneous working keeps its own clause rather than reading as a span', () => {
    // 0 ticks is not `less than a day` — it is no time at all, and collapsing the two would
    // lose a distinction the player can feel. Pinned so a later simplification cannot quietly
    // fold the branch into the span reading.
    render(
      <DivineReceiptModal
        open
        receipt={makeReceipt({ startTick: 9, resolvedTick: 9 })}
        onAcknowledge={() => {}}
      />,
    );
    const tech = screen.getByTestId('divine-receipt-technical').textContent ?? '';
    expect(tech).toContain('resolving at once');
    expect(tech).not.toContain('less than a day');
    expect(tech).not.toMatch(/tick/i);
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
