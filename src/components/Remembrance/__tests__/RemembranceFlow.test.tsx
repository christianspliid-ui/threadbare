// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RemembranceFlow } from '../RemembranceFlow';

describe('RemembranceFlow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the Stirring beat initially', () => {
    const onComplete = vi.fn();
    render(<RemembranceFlow seed={42} onComplete={onComplete} />);
    expect(screen.getByText(/something stirs in the void/i)).toBeInTheDocument();
  });

  it('shows stirring images', () => {
    const onComplete = vi.fn();
    render(<RemembranceFlow seed={42} onComplete={onComplete} />);
    const images = screen.getAllByTestId(/^stirring-/);
    expect(images.length).toBeGreaterThanOrEqual(4);
  });

  it('transitions from stirring to origin on double-click (focus then confirm)', async () => {
    const onComplete = vi.fn();
    render(<RemembranceFlow seed={42} onComplete={onComplete} />);
    const firstImage = screen.getAllByTestId(/^stirring-/)[0];

    // First click = focus the image
    await act(async () => {
      fireEvent.click(firstImage);
    });
    expect(screen.getByText(/click again to choose/i)).toBeInTheDocument();

    // Second click = confirm selection
    await act(async () => {
      fireEvent.click(firstImage);
    });

    // StirringBeat uses setTimeout(800) before calling onSelect
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Also advance OriginBeat's entrance timers (200ms + 800ms)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // After transition to OriginBeat, verify origin fragments appear
    const fragments = screen.queryAllByTestId(/^origin-origin\./);
    expect(fragments.length).toBeGreaterThanOrEqual(1);
  });

  it('shows origin fragments after stirring selection', async () => {
    const onComplete = vi.fn();
    render(<RemembranceFlow seed={42} onComplete={onComplete} />);
    const firstImage = screen.getAllByTestId(/^stirring-/)[0];

    // Focus then confirm
    await act(async () => {
      fireEvent.click(firstImage);
    });
    await act(async () => {
      fireEvent.click(firstImage);
    });

    // Advance through StirringBeat timeout + OriginBeat entrance timers
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Wait for fragments to appear in DOM
    await waitFor(() => {
      const fragments = screen.queryAllByTestId(/^origin-/);
      expect(fragments.length).toBeGreaterThan(0);
    });
  });
});
