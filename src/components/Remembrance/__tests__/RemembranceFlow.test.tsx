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

    // First click = focus the image (grid buttons become a full-bleed div)
    const gridButton = screen.getAllByTestId(/^stirring-/)[0];
    await act(async () => {
      fireEvent.click(gridButton);
    });
    expect(screen.getByText(/click again to choose/i)).toBeInTheDocument();

    // Re-query: the focused image is now a different DOM element (full-bleed div)
    const focusedImage = screen.getAllByTestId(/^stirring-/)[0];

    // Second click = confirm selection. Schedules setTimeout(1200).
    await act(async () => {
      fireEvent.click(focusedImage);
    });

    // Advance past StirringBeat's 1200ms timer to trigger the beat transition.
    await act(async () => {
      vi.advanceTimersByTime(1300);
    });

    // OriginBeat is now mounted. Its useEffect schedules:
    // - 200ms for textVisible
    // - 800ms for cardsVisible
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // After transition to OriginBeat, verify we see OriginBeat content.
    // OriginBeat renders "You remember..." prompt text (may appear multiple times in fragments).
    const originMatches = screen.queryAllByText(/You remember/);
    const originTestIds = screen.queryAllByTestId(/^origin-/);
    expect(originMatches.length + originTestIds.length).toBeGreaterThan(0);
  });

  it('shows origin fragments after stirring selection', async () => {
    const onComplete = vi.fn();
    render(<RemembranceFlow seed={42} onComplete={onComplete} />);

    // Focus
    const gridButton = screen.getAllByTestId(/^stirring-/)[0];
    await act(async () => {
      fireEvent.click(gridButton);
    });

    // Re-query after focus changes the DOM, then confirm
    const focusedImage = screen.getAllByTestId(/^stirring-/)[0];
    await act(async () => {
      fireEvent.click(focusedImage);
    });

    // Advance past StirringBeat 1200ms timer
    await act(async () => {
      vi.advanceTimersByTime(1300);
    });

    // Advance past OriginBeat entrance timers (200ms + 800ms)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // OriginBeat should now be rendered with origin content
    const originMatches = screen.queryAllByText(/You remember/);
    const originTestIds = screen.queryAllByTestId(/^origin-/);
    expect(originMatches.length + originTestIds.length).toBeGreaterThan(0);
  });
});
