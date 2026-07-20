// @vitest-environment jsdom
/**
 * ThreadTugBadge tests — THR-665
 *
 * The badge is the only place a tug can be attended, so the click contract and
 * the stated cost are what matter here.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadTugBadge } from '../ThreadTugBadge';
import { selectThreadTugBadges, tugAttendCost } from '../threadTugBadgeModel';
import type { ThreadTug } from '../../../types/attention';

function makeTug(overrides: Partial<ThreadTug> = {}): ThreadTug {
  return {
    id: 'tug-1',
    agentId: 'agent-1',
    encounterId: 'enc-1',
    reachPrimary: 'might',
    threatLevel: 'hard',
    courtPosition: 'retinue',
    createdTick: 10,
    expiresTick: 20,
    attended: false,
    curationScore: 1,
    ...overrides,
  } as ThreadTug;
}

function badgeFor(tug: ThreadTug, pool: number) {
  return selectThreadTugBadges([tug], pool).get(tug.agentId)!;
}

describe('ThreadTugBadge', () => {
  it('renders the tug glyph with a testid distinct from the encounter badge', () => {
    render(<ThreadTugBadge badge={badgeFor(makeTug(), 9999)} onAttend={vi.fn()} />);

    const el = screen.getByTestId('thread-tug-badge');
    expect(el).toBeTruthy();
    expect(el.getAttribute('data-tug-badge-threat')).toBe('hard');
  });

  it('names the attention cost in its aria-label', () => {
    const tug = makeTug();
    render(<ThreadTugBadge badge={badgeFor(tug, 9999)} onAttend={vi.fn()} />);

    expect(
      screen.getByTestId('thread-tug-badge').getAttribute('aria-label'),
    ).toContain(`${tugAttendCost(tug)} attention`);
  });

  it('calls onAttend with its badge when clicked', () => {
    const onAttend = vi.fn();
    const badge = badgeFor(makeTug(), 9999);
    render(<ThreadTugBadge badge={badge} onAttend={onAttend} />);

    fireEvent.click(screen.getByTestId('thread-tug-badge'));

    expect(onAttend).toHaveBeenCalledTimes(1);
    expect(onAttend).toHaveBeenCalledWith(badge);
  });

  it('does not bubble the click to the row — attending must not double as row selection', () => {
    const onRowClick = vi.fn();
    render(
      <div onClick={onRowClick}>
        <ThreadTugBadge badge={badgeFor(makeTug(), 9999)} onAttend={vi.fn()} />
      </div>,
    );

    fireEvent.click(screen.getByTestId('thread-tug-badge'));

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('marks itself aria-disabled when the pool cannot cover the cost', () => {
    const tug = makeTug();
    const poor = badgeFor(tug, tugAttendCost(tug) - 1);
    render(<ThreadTugBadge badge={poor} onAttend={vi.fn()} />);

    const el = screen.getByTestId('thread-tug-badge');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('data-tug-badge-affordable')).toBe('false');
  });

  it('shows a count only when several tugs stack on the row', () => {
    const single = selectThreadTugBadges([makeTug()], 9999).get('agent-1')!;
    const { rerender } = render(<ThreadTugBadge badge={single} onAttend={vi.fn()} />);
    expect(screen.getByTestId('thread-tug-badge').getAttribute('data-tug-badge-count')).toBe('1');

    const stacked = selectThreadTugBadges(
      [makeTug({ id: 'a' }), makeTug({ id: 'b' })],
      9999,
    ).get('agent-1')!;
    rerender(<ThreadTugBadge badge={stacked} onAttend={vi.fn()} />);

    expect(screen.getByTestId('thread-tug-badge').getAttribute('data-tug-badge-count')).toBe('2');
    expect(screen.getByText('2')).toBeTruthy();
  });
});
