// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailBreadcrumb } from '../DetailBreadcrumb';
import { FOCUSABLE_SELECTOR } from '../focusableSelector';
import { DETAIL_BREADCRUMB_COLLAPSE_AT } from '../../../types/detailPage';

/**
 * Law 23 on the breadcrumb (THR-1504).
 *
 * The membership predicate is the `clickable` branch: every crumb but the last, with a
 * non-null `stackIndex`. Those are controls and must be reachable by keyboard. The last
 * crumb and the collapsed `…` are not controls and must gain no affordance — both
 * directions are asserted, because a fix that made *every* crumb a tab stop would read
 * as done while making the trail noisier to Tab through than it is to use.
 */

const SHORT_TRAIL = ['ENCOUNTER', 'Captain Veiren', 'The Iron Gate'];

function crumb(label: string): HTMLElement {
  return screen.getByText(label.toUpperCase());
}

describe('DetailBreadcrumb — navigable crumbs are controls (Law 23)', () => {
  it('a clickable crumb carries role="button" and a tab stop', () => {
    render(<DetailBreadcrumb trail={SHORT_TRAIL} onNavigate={() => {}} />);
    const first = crumb('ENCOUNTER');
    expect(first).toHaveAttribute('role', 'button');
    expect(first).toHaveAttribute('tabindex', '0');
  });

  it('a clickable crumb matches the focus trap’s selector, so the panel’s Tab cycle reaches it', () => {
    const { container } = render(<DetailBreadcrumb trail={SHORT_TRAIL} onNavigate={() => {}} />);
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    expect(focusable).toContain(crumb('ENCOUNTER'));
    expect(focusable).toContain(crumb('Captain Veiren'));
    // Exactly the two navigable crumbs — nothing else in the trail is a tab stop.
    expect(focusable).toHaveLength(2);
  });

  it('a clickable crumb takes focus', () => {
    render(<DetailBreadcrumb trail={SHORT_TRAIL} onNavigate={() => {}} />);
    const first = crumb('ENCOUNTER');
    first.focus();
    expect(document.activeElement).toBe(first);
  });

  it('activates on Enter with the crumb’s stack index', () => {
    const onNavigate = vi.fn();
    render(<DetailBreadcrumb trail={SHORT_TRAIL} onNavigate={onNavigate} />);
    fireEvent.keyDown(crumb('Captain Veiren'), { key: 'Enter' });
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it('activates on Space and swallows the default page scroll', () => {
    const onNavigate = vi.fn();
    render(<DetailBreadcrumb trail={SHORT_TRAIL} onNavigate={onNavigate} />);
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    crumb('ENCOUNTER').dispatchEvent(event);
    expect(onNavigate).toHaveBeenCalledWith(-1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores other keys', () => {
    const onNavigate = vi.fn();
    render(<DetailBreadcrumb trail={SHORT_TRAIL} onNavigate={onNavigate} />);
    fireEvent.keyDown(crumb('ENCOUNTER'), { key: 'ArrowRight' });
    fireEvent.keyDown(crumb('ENCOUNTER'), { key: 'Escape' });
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('still activates on click', () => {
    const onNavigate = vi.fn();
    render(<DetailBreadcrumb trail={SHORT_TRAIL} onNavigate={onNavigate} />);
    fireEvent.click(crumb('Captain Veiren'));
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it('does not suppress the focus ring — it wears the sanctioned focus-ring class', () => {
    render(<DetailBreadcrumb trail={SHORT_TRAIL} onNavigate={() => {}} />);
    const first = crumb('ENCOUNTER');
    expect(first).toHaveClass('focus-ring');
    expect(first.style.outline).toBe('');
  });
});

describe('DetailBreadcrumb — inert crumbs stay inert', () => {
  it('the last crumb gains no role, no tab stop and no handler', () => {
    const onNavigate = vi.fn();
    render(<DetailBreadcrumb trail={SHORT_TRAIL} onNavigate={onNavigate} />);
    const last = crumb('The Iron Gate');
    expect(last).not.toHaveAttribute('role');
    expect(last).not.toHaveAttribute('tabindex');
    expect(last).not.toHaveClass('focus-ring');
    fireEvent.click(last);
    fireEvent.keyDown(last, { key: 'Enter' });
    fireEvent.keyDown(last, { key: ' ' });
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('the collapsed … crumb gains no role, no tab stop and no handler', () => {
    const onNavigate = vi.fn();
    const longTrail = Array.from(
      { length: DETAIL_BREADCRUMB_COLLAPSE_AT + 2 },
      (_, i) => `Page ${i}`,
    );
    render(<DetailBreadcrumb trail={longTrail} onNavigate={onNavigate} />);
    const ellipsis = screen.getByText('…');
    expect(ellipsis).not.toHaveAttribute('role');
    expect(ellipsis).not.toHaveAttribute('tabindex');
    fireEvent.click(ellipsis);
    fireEvent.keyDown(ellipsis, { key: 'Enter' });
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('a single-crumb trail has no controls at all', () => {
    const { container } = render(<DetailBreadcrumb trail={['Only']} onNavigate={() => {}} />);
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
    expect(container.querySelectorAll(FOCUSABLE_SELECTOR)).toHaveLength(0);
  });

  it('over the collapse threshold, exactly the visible non-last crumbs are controls', () => {
    const longTrail = Array.from(
      { length: DETAIL_BREADCRUMB_COLLAPSE_AT + 2 },
      (_, i) => `Page ${i}`,
    );
    const { container } = render(<DetailBreadcrumb trail={longTrail} onNavigate={() => {}} />);
    // Rendered: `…` + the last (COLLAPSE_AT - 1) entries; the final one is inert.
    const expectedControls = DETAIL_BREADCRUMB_COLLAPSE_AT - 2;
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(expectedControls);
    expect(container.querySelectorAll(FOCUSABLE_SELECTOR)).toHaveLength(expectedControls);
  });
});
