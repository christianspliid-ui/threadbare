// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Chip, readCountChips, shownCount } from '../Chip';
import { IconButton } from '../IconButton';
import { RefRouterProvider } from '../../../contexts/RefRouterContext';
import type { RefRouter } from '../../../hooks/useRefRouter';
import type { AnyRef } from '../../../types/contentRef';

function stubRouter() {
  const router = {
    open: vi.fn(),
    canOpen: () => true,
    armHover: vi.fn(),
    disarmHover: vi.fn(),
    closeHover: vi.fn(),
    hoverCard: null,
  };
  return { router, asRouter: router as unknown as RefRouter };
}

const AGENT: AnyRef = { kind: 'agent', id: 'ind_0' };

describe('Chip role="identity"', () => {
  it('opens its target through the router (Law 21)', () => {
    const { router, asRouter } = stubRouter();
    render(
      <RefRouterProvider router={asRouter}>
        <Chip role="identity" target={AGENT} label="Shutash" />
      </RefRouterProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Shutash' }));
    expect(router.open).toHaveBeenCalledWith(AGENT, 'card', { via: 'chip' });
  });

  it('a dead target renders plain text, never a link', () => {
    const { asRouter } = stubRouter();
    const { container } = render(
      <RefRouterProvider router={asRouter}>
        <Chip role="identity" target={null} label="The Drowned Abbot" />
      </RefRouterProvider>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('The Drowned Abbot')).toBeInTheDocument();
    expect(container.querySelector('[data-chip-role="identity"]')).toHaveAttribute('data-chip-routes', 'false');
  });

  it('with no router in scope it renders text (fail-open)', () => {
    render(<Chip role="identity" target={AGENT} label="Shutash" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Shutash')).toBeInTheDocument();
  });
});

describe('Chip role="state"', () => {
  it('always shows the word, whatever the tint', () => {
    render(<Chip role="state" label="Wounded" tint="negative" />);
    expect(screen.getByText('Wounded')).toBeInTheDocument();
  });

  it('is a button only when it opens something', () => {
    const onOpen = vi.fn();
    const { rerender } = render(<Chip role="state" label="Calm" />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<Chip role="state" label="Calm" onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Calm' }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});

describe('Chip role="count"', () => {
  it('renders nothing at zero, negative or non-finite (Laws 25, 53)', () => {
    for (const count of [0, -2, Number.NaN, Number.POSITIVE_INFINITY]) {
      const { container, unmount } = render(<Chip role="count" count={count} of="x" icon="fallback" label="none" />);
      expect(container.innerHTML).toBe('');
      unmount();
    }
    expect(shownCount(0)).toBeNull();
    expect(shownCount(2.7)).toBe(2);
  });

  it('shows the number at 1', () => {
    render(<Chip role="count" count={1} of="needs-you" icon="fallback" label="1 thing needs you" />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 thing needs you' })).toBeInTheDocument();
  });

  it('opening the list never clears the count (Law 40)', () => {
    function Owner() {
      const [opens, setOpens] = useState(0);
      return (
        <>
          <Chip role="count" count={3} of="needs-you" icon="fallback" label="3 things need you" onOpen={() => setOpens((n) => n + 1)} />
          <span data-testid="opens">{opens}</span>
        </>
      );
    }
    render(<Owner />);
    fireEvent.click(screen.getByRole('button', { name: '3 things need you' }));
    fireEvent.click(screen.getByRole('button', { name: '3 things need you' }));
    expect(screen.getByTestId('opens')).toHaveTextContent('2');
    expect(readCountChips()).toEqual([{ of: 'needs-you', count: 3 }]);
  });

  it('the badge form is aria-hidden and carries its owner key', () => {
    render(<IconButton icon="N" badge={4} badgeOf="notables" aria-label="4 notables" />);
    const badge = screen.getByText('4');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(badge).toHaveAttribute('data-chip-form', 'badge');
    expect(screen.getByRole('button', { name: '4 notables' })).toBeInTheDocument();
    expect(readCountChips()).toEqual([{ of: 'notables', count: 4 }]);
  });

  it('an IconButton badge of zero draws nothing; a string badge keeps the legacy text', () => {
    const { container, rerender } = render(<IconButton icon="N" badge={0} badgeOf="notables" aria-label="0 notables" />);
    expect(container.querySelector('[data-chip-role="count"]')).toBeNull();
    rerender(<IconButton icon="N" badge="2+" aria-label="more" />);
    expect(screen.getByText('2+')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[data-chip-role="count"]')).toBeNull();
  });
});

describe('Chip role="keyword"', () => {
  it('toggles with aria-pressed when it is a filter', () => {
    const onToggle = vi.fn();
    render(<Chip role="keyword" keyword="Boost" pressed={false} onToggle={onToggle} />);
    const btn = screen.getByRole('button', { name: 'Boost' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('is plain text without a toggle', () => {
    render(<Chip role="keyword" keyword="Ward" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Ward').closest('[data-chip-role]')).toHaveAttribute('data-chip-role', 'keyword');
  });
});
