// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Narration adapter stub ───────────────────────────────────────────

const cancel = vi.fn();
const stop = vi.fn();
const enable = vi.fn(async () => {});
const speakEncounter = vi.fn(async () => ({ id: 1, done: Promise.resolve(), cancel }));

let narrationState: Record<string, unknown>;

vi.mock('../../../../services/narration/encounterNarration', () => ({
  useEncounterNarration: () => ({ ...narrationState, enable, speakEncounter, stop }),
}));

import { ProseTtsButton } from '../ProseTtsButton';

const BUTTON = 'prose-tts-button';

beforeEach(() => {
  vi.clearAllMocks();
  narrationState = {
    enabled: true,
    isSpeaking: false,
    isLoading: false,
    needsOptIn: false,
    canNarrate: true,
  };
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('ProseTtsButton', () => {
  it('renders a narrate control when narration can speak', () => {
    render(<ProseTtsButton text={['A scene.']} />);
    expect(screen.getByTestId(BUTTON)).toBeTruthy();
  });

  it('renders nothing when narration is disabled — the scene is unchanged', () => {
    narrationState = { ...narrationState, enabled: false, canNarrate: false };
    const { container } = render(<ProseTtsButton text={['A scene.']} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when there is no prose to narrate', () => {
    const { container } = render(<ProseTtsButton text={['   ', '']} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when no backend can ever speak', () => {
    narrationState = { ...narrationState, canNarrate: false, needsOptIn: false };
    const { container } = render(<ProseTtsButton text={['A scene.']} />);
    expect(container.innerHTML).toBe('');
  });

  it('offers the model download instead of playback when opt-in is pending', async () => {
    narrationState = { ...narrationState, canNarrate: false, needsOptIn: true };
    render(<ProseTtsButton text={['A scene.']} />);

    const btn = screen.getByTestId(BUTTON);
    expect(btn.getAttribute('title')).toContain('Download');

    await act(async () => { btn.click(); });
    expect(enable).toHaveBeenCalledTimes(1);
    expect(speakEncounter).not.toHaveBeenCalled();
  });

  it('dispatches the prose on click', async () => {
    render(<ProseTtsButton text={['First.', 'Second.']} context={{ encounterId: 'enc-1' }} />);

    await act(async () => { screen.getByTestId(BUTTON).click(); });

    await waitFor(() => expect(speakEncounter).toHaveBeenCalledTimes(1));
    const [text, options] = speakEncounter.mock.calls[0] as unknown as [string[], { context?: unknown }];
    expect(text).toEqual(['First.', 'Second.']);
    expect(options.context).toEqual({ encounterId: 'enc-1' });
  });

  it('cancels instead of re-dispatching while speaking', async () => {
    narrationState = { ...narrationState, isSpeaking: true };
    render(<ProseTtsButton text={['A scene.']} />);

    await act(async () => { screen.getByTestId(BUTTON).click(); });

    expect(stop).toHaveBeenCalledTimes(1);
    expect(speakEncounter).not.toHaveBeenCalled();
  });

  it('cancels its own utterance when the scene unmounts mid-sentence', async () => {
    const { unmount } = render(<ProseTtsButton text={['A scene.']} />);

    await act(async () => { screen.getByTestId(BUTTON).click(); });
    await waitFor(() => expect(speakEncounter).toHaveBeenCalled());

    unmount();
    expect(cancel).toHaveBeenCalled();
  });

  it('stays interactive when dispatch fails (fail-soft)', async () => {
    speakEncounter.mockRejectedValueOnce(new Error('backend down'));
    render(<ProseTtsButton text={['A scene.']} />);

    await act(async () => { screen.getByTestId(BUTTON).click(); });

    // Still rendered, still clickable — the failure never reaches the scene.
    expect(screen.getByTestId(BUTTON)).toBeTruthy();
  });
});
