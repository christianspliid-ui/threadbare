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
    expect(tooltip).toHaveStyle('max-width: 220px');
    expect(tooltip).toHaveStyle('z-index: 50');
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
});
