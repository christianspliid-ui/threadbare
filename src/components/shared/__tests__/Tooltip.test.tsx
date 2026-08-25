// @vitest-environment jsdom
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders children without tooltip initially', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip after hover delay', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('does not show tooltip before delay completes', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides tooltip on pointer leave', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.pointerLeave(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows description when provided', () => {
    render(
      <Tooltip label="Test Label" desc="Description text">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('resolves content from ID via resolveTooltip', () => {
    render(
      <Tooltip id="doom.clock">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText('Doom Clock')).toBeInTheDocument();
  });

  it('prefers explicit label/desc over id', () => {
    render(
      <Tooltip id="doom.clock" label="Override Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText('Override Label')).toBeInTheDocument();
    expect(screen.queryByText('Doom Clock')).not.toBeInTheDocument();
  });

  it('sets aria-describedby on trigger element', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const trigger = screen.getByText('Hover me').parentElement;
    expect(trigger).toHaveAttribute('aria-describedby');
    const tooltipId = trigger?.getAttribute('aria-describedby');
    expect(document.getElementById(tooltipId!)).toBeInTheDocument();
  });

  it('shows on focus and hides on blur', () => {
    render(
      <Tooltip label="Test Label">
        <button>Focus me</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByText('Focus me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.blur(screen.getByText('Focus me'));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides on Escape key', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does not render when label is empty and id resolves to null', () => {
    render(
      <Tooltip id="nonexistent.id">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('cancels show timer when pointer leaves before delay completes', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.pointerLeave(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('handles multiple show/hide cycles', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );

    // First cycle
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.pointerLeave(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Second cycle
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('cleans up timers on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount } = render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );

    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(50);
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('removes escape listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );

    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
    removeEventListenerSpy.mockRestore();
  });

  it('does not set aria-describedby when not visible', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    const trigger = screen.getByText('Hover me').parentElement;
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('renders tooltip in portal to document.body', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.parentElement).toBe(document.body);
  });

  it('applies correct styles to tooltip', () => {
    render(
      <Tooltip label="Test Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveStyle('position: fixed');
    expect(tooltip).toHaveStyle('max-width: 280px');
    expect(tooltip).toHaveStyle('z-index: 70');
  });

  it('only shows label when desc is not provided', () => {
    const { container } = render(
      <Tooltip label="Just Label">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(screen.getByText('Just Label')).toBeInTheDocument();

    // Check that the label div doesn't have bottom margin when no desc
    // tooltip > inner container > label div
    const innerContainer = tooltip.firstChild as HTMLElement;
    const labelDiv = innerContainer.firstChild as HTMLElement;
    const style = window.getComputedStyle(labelDiv);
    expect(style.marginBottom).toBe('0px');
  });

  it('handles focus events like hover', () => {
    render(
      <Tooltip label="Test Label">
        <input type="text" placeholder="Focus me" />
      </Tooltip>
    );
    fireEvent.focus(screen.getByPlaceholderText('Focus me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('respects depth prop (internal)', () => {
    const { container } = render(
      <Tooltip label="Test Label" depth={1}>
        <button>Hover me</button>
      </Tooltip>
    );
    // The depth prop is used by Task 5 for chain tracking
    // For now, just verify it doesn't break rendering
    fireEvent.pointerEnter(screen.getByText('Hover me'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  // ── Keyboard reachability of the trigger (THR-1095) ─────────────────────
  //
  // The trigger carried `onFocus`/`onBlur` and no `tabIndex`, so for any child
  // that was not itself focusable those two handlers were dead code: nothing
  // could receive focus, so they never fired. These pin the auto rule from
  // BOTH sides — a stop where one was missing, and no stop where one already
  // exists — because a rule tested only on the case it was written for is a
  // rule that has not been falsified.
  describe('keyboard reachability (THR-1095)', () => {
    it('LAW 23: a tooltip over plain prose is a tab stop, so its handlers are reachable', () => {
      render(<Tooltip label="Standing">standing</Tooltip>);
      const trigger = screen.getByText('standing');
      expect(trigger).toHaveAttribute('tabindex', '0');
      expect(trigger).toHaveClass('focus-ring');
    });

    it('LAW 50: focusing that trigger opens the tooltip — the handler is live, not just present', () => {
      render(<Tooltip label="Standing" desc="How the world reads you.">standing</Tooltip>);
      const trigger = screen.getByText('standing');
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      fireEvent.focus(trigger);
      act(() => { vi.advanceTimersByTime(200); });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('How the world reads you.')).toBeInTheDocument();
    });

    it('adds no second stop when the child is already focusable', () => {
      render(
        <Tooltip label="Standing">
          <button>Hover me</button>
        </Tooltip>
      );
      const wrapper = screen.getByText('Hover me').parentElement!;
      expect(wrapper).not.toHaveAttribute('tabindex');
      expect(wrapper).not.toHaveClass('focus-ring');
    });

    it('stands down for the sanctioned caller pattern — a hand-rolled tabIndex on an inner element', () => {
      // The THR-1033 shape in EncounterVeil.tsx: the caller puts the stop on the
      // word itself because the wrapper's box is the wrong thing to ring.
      render(
        <Tooltip label="Boon">
          <span className="focus-ring" tabIndex={0} data-testid="inner">boon</span>
        </Tooltip>
      );
      const inner = screen.getByTestId('inner');
      expect(inner).toHaveAttribute('tabindex', '0');
      expect(inner.parentElement!).not.toHaveAttribute('tabindex');
    });

    it('LAW 21: a tooltip that resolves nothing is not a stop that does nothing', () => {
      render(<Tooltip id="nonexistent.concept.id">standing</Tooltip>);
      const trigger = screen.getByText('standing');
      expect(trigger).not.toHaveAttribute('tabindex');
    });

    it('never adds a stop inside an open popup (depth > 0) — it would be unreachable anyway', () => {
      render(<Tooltip label="Standing" depth={1}>standing</Tooltip>);
      expect(screen.getByText('standing')).not.toHaveAttribute('tabindex');
    });

    it('never adds a stop to an SVG trigger — the hex-map tab-order storm', () => {
      const { container } = render(
        <svg>
          <Tooltip label="Standing" as="g"><text>tile</text></Tooltip>
        </svg>
      );
      expect(container.querySelector('g')).not.toHaveAttribute('tabindex');
    });

    it('focusable={false} suppresses a stop the auto rule would add', () => {
      render(<Tooltip label="Standing" focusable={false}>standing</Tooltip>);
      expect(screen.getByText('standing')).not.toHaveAttribute('tabindex');
    });

    // Focus is proven by where it LANDS, not by the attribute being present.
    // jsdom's `focus()` is a no-op on a non-focusable element — it consults the
    // same focusable-area rules the browser does — so `document.activeElement`
    // falsifies the attribute assertion rather than restating it. This is the
    // jsdom stand-in for the `__DEBUG`/activeElement read the browser route
    // would have done; see the substitution note in the commit body.
    it('LAW 50: focus actually lands on the trigger', () => {
      render(<Tooltip label="Standing">standing</Tooltip>);
      const trigger = screen.getByText('standing');
      trigger.focus();
      expect(document.activeElement).toBe(trigger);
    });

    it('...and does not land when the stop is suppressed', () => {
      // The other side of the same claim. Two independent renders rather than a
      // rerender: a node that has already held focus keeps `activeElement`
      // pointed at it after React withdraws the attribute, which would make the
      // negative arm pass or fail on React's attribute bookkeeping instead of on
      // whether the element is focusable.
      render(<Tooltip label="Standing" focusable={false}>standing</Tooltip>);
      const trigger = screen.getByText('standing');
      trigger.focus();
      expect(document.activeElement).not.toBe(trigger);
      expect(document.activeElement).toBe(document.body);
    });

    it('focusable forces a stop the auto rule declines', () => {
      render(
        <Tooltip label="Standing" focusable>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByText('Hover me').parentElement!).toHaveAttribute('tabindex', '0');
    });
  });
});
