// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { RemembranceFlow } from '../RemembranceFlow';
import { drawStirringBackdrop } from '../stirringBackdrop';
import { STIRRING_IMAGES, REMEMBRANCE_STIRRING_PICK_ENABLED } from '../../../data/stirring-images';
import { ORIGIN_FRAGMENTS } from '../../../data/remembrance-fragments';
import { filterOriginFragments } from '../../../engine/remembrance';

/** OriginBeat's entrance timers: 200 ms for the words, 800 ms for the row. */
const ORIGIN_ENTRANCE_MS = 1000;

function originIdsOnScreen(): string[] {
  return screen
    .queryAllByTestId(/^origin-origin\./)
    .map(el => el.getAttribute('data-testid') ?? '')
    .sort();
}

describe('RemembranceFlow — opens on Origin (THR-1989)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('ships with the stirring pick off', () => {
    expect(REMEMBRANCE_STIRRING_PICK_ENABLED).toBe(false);
  });

  it('the first screen is Origin, with the "What echoes?" line over a stirring backdrop', async () => {
    render(<RemembranceFlow seed={42} onComplete={vi.fn()} />);
    expect(screen.queryAllByTestId(/^stirring-stirring\./)).toHaveLength(0);
    expect(screen.getByTestId('origin-stirring-prompt').textContent).toMatch(/what echoes\?/i);
    expect(screen.getByText('You remember...')).toBeInTheDocument();

    const backdrop = drawStirringBackdrop(STIRRING_IMAGES, 42)!;
    expect(screen.getByTestId(`origin-backdrop-${backdrop.id}`)).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(ORIGIN_ENTRANCE_MS); });
    const expected = filterOriginFragments(backdrop, ORIGIN_FRAGMENTS, 42)
      .map(f => `origin-${f.id}`)
      .sort();
    expect(originIdsOnScreen()).toEqual(expected);
  });

  it('the same seed gives the same backdrop and the same three origins on two loads', async () => {
    const load = async () => {
      render(<RemembranceFlow seed={1234} onComplete={vi.fn()} />);
      await act(async () => { vi.advanceTimersByTime(ORIGIN_ENTRANCE_MS); });
      const backdrop = screen.getByTestId(/^origin-backdrop-/).getAttribute('data-testid');
      const origins = originIdsOnScreen();
      cleanup();
      return { backdrop, origins };
    };
    const first = await load();
    const second = await load();
    expect(first.origins).toHaveLength(3);
    expect(second).toEqual(first);
  });

  it('the account notice moves to the Origin screen', () => {
    render(<RemembranceFlow seed={42} onComplete={vi.fn()} accountNotice="Your past runs could not be read." />);
    expect(screen.getByTestId('stirring-account-notice').textContent).toMatch(/could not be read/);
  });

  it('the draw is fail-soft on an empty image list', () => {
    expect(drawStirringBackdrop([], 42)).toBeNull();
  });
});

describe('RemembranceFlow — the stirring pick restored (flag on)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders the Stirring beat initially', () => {
    render(<RemembranceFlow seed={42} onComplete={vi.fn()} stirringPickEnabled />);
    expect(screen.getByText(/something stirs in the void/i)).toBeInTheDocument();
    expect(screen.getAllByTestId(/^stirring-/).length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByTestId('origin-stirring-prompt')).toBeNull();
  });

  it('transitions from stirring to origin on one click (THR-1716), with no backdrop', async () => {
    render(<RemembranceFlow seed={42} onComplete={vi.fn()} stirringPickEnabled />);

    // One click chooses: the chosen picture holds, with "Choose again".
    await act(async () => {
      fireEvent.click(screen.getAllByTestId(/^stirring-/)[0]);
    });
    expect(screen.getByTestId('remembrance-choose-again')).toBeInTheDocument();

    // Past the stirring hold, then OriginBeat's entrance timers.
    await act(async () => { vi.advanceTimersByTime(1300); });
    await act(async () => { vi.advanceTimersByTime(ORIGIN_ENTRANCE_MS); });

    expect(screen.getByText('You remember...')).toBeInTheDocument();
    expect(originIdsOnScreen()).toHaveLength(3);
    expect(screen.queryByTestId(/^origin-backdrop-/)).toBeNull();
    expect(screen.queryByTestId('origin-stirring-prompt')).toBeNull();
  });
});
