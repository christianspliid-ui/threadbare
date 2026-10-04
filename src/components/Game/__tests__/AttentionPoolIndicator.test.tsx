// @vitest-environment jsdom
/**
 * AttentionPoolIndicator reads as a passive meter, not a tab (THR-1711 item 3).
 *
 * Two cold-playtest testers in two rounds clicked "Attention" expecting a
 * detail like Doom and Omen open, and nothing happened. The fix makes it say
 * what it is: a meter with a help cursor and a visible hover explanation,
 * rather than a tab-styled div with a native `title`.
 */

import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AttentionPoolIndicator } from '../AttentionPoolIndicator';

describe('AttentionPoolIndicator — a passive meter (THR-1711)', () => {
  it('announces itself as a meter with its balance, not as a control', () => {
    render(<AttentionPoolIndicator attentionPool={3} attentionCapacity={6} attentionRegen={0.4} />);
    const meter = screen.getByTestId('attention-pool-indicator');
    expect(meter.getAttribute('role')).toBe('meter');
    expect(meter.getAttribute('aria-valuenow')).toBe('3');
    expect(meter.getAttribute('aria-valuemax')).toBe('6');
    expect(meter.style.cursor).toBe('help');
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('drops the native title in favour of the shared Tooltip', () => {
    const { container } = render(
      <AttentionPoolIndicator attentionPool={3} attentionCapacity={6} attentionRegen={0.4} />,
    );
    // A native `title` is what made the hover late, unstyled and unexplained.
    expect(container.querySelector('[title]')).toBeNull();
  });

  it('explains itself on hover — what it measures and that there is nothing to click', () => {
    vi.useFakeTimers();
    try {
      render(<AttentionPoolIndicator attentionPool={3} attentionCapacity={6} attentionRegen={0.4} />);
      const trigger = screen.getByTestId('attention-pool-indicator').parentElement!;
      fireEvent.pointerEnter(trigger);
      act(() => { vi.advanceTimersByTime(2000); });
      expect(document.body.textContent).toMatch(/How much of your notice is free/);
      expect(document.body.textContent).toMatch(/Nothing to click/);
    } finally {
      vi.useRealTimers();
    }
  });
});
