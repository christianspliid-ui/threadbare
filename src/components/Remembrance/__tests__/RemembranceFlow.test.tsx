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

  it('transitions from stirring to origin on image click', async () => {
    const onComplete = vi.fn();
    render(<RemembranceFlow seed={42} onComplete={onComplete} />);
    const firstImage = screen.getAllByTestId(/^stirring-/)[0];
    fireEvent.click(firstImage);

    // StirringBeat uses setTimeout(600) before calling onSelect
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // The OriginBeat heading is "You remember..." — use a precise text match
    expect(screen.getByText('You remember...')).toBeInTheDocument();
  });

  it('shows origin fragments after stirring selection', async () => {
    const onComplete = vi.fn();
    render(<RemembranceFlow seed={42} onComplete={onComplete} />);
    const firstImage = screen.getAllByTestId(/^stirring-/)[0];
    fireEvent.click(firstImage);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    // origin-continue is the Continue button; exclude it — fragment cards use pattern origin-origin.*
    const fragments = screen.getAllByTestId(/^origin-origin\./);
    // With min-score filtering, we get 1-3 fragments (only those with positive cluster overlap)
    expect(fragments.length).toBeGreaterThanOrEqual(1);
    expect(fragments.length).toBeLessThanOrEqual(3);
  });
});
