// @vitest-environment jsdom
/**
 * THR-1987 — name the three mortals before the first click.
 *
 * - with nothing focused, every portrait shows its name and epithet and the
 *   hint line reads "Look closer at one, then choose.";
 * - keyboard focus looks closer, the same as a first click; Enter then chooses;
 * - a mouse press still takes two clicks to choose (Law 48), even though the
 *   press focuses the button before its click lands.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SensingBeat, REST_POSITIONS, PORTRAIT_MAX_WIDTH_PX, PORTRAIT_WIDTH_VW } from '../SensingBeat';
import { SENSING_CHOOSE_HINT } from '../../../data/meeting-narrative-prose';
import type { NarrativeCandidate } from '../../../types/meetingEncounter';

const PICKS = [
  { tempId: 't0', name: 'Elara', epithet: 'merchant\'s daughter', vignetteText: 'She counts coins twice.', imageAssetPath: '', placeholderGradient: 'linear-gradient(#000,#111)' },
  { tempId: 't1', name: 'Bram', epithet: 'ferryman', vignetteText: 'He waits.', imageAssetPath: '', placeholderGradient: 'linear-gradient(#000,#111)' },
  { tempId: 't2', name: 'Ysolde', epithet: '', vignetteText: 'She listens.', imageAssetPath: '', placeholderGradient: 'linear-gradient(#000,#111)' },
] as unknown as NarrativeCandidate[];

function renderBeat(onSelect = vi.fn()) {
  render(<SensingBeat candidates={PICKS} openingProse="You sense them." onSelect={onSelect} />);
  return onSelect;
}

describe('THR-1987 — the resting picker names every mortal', () => {
  it('names and epithets render with focusedIdx === null, with the hint line', () => {
    renderBeat();
    expect(screen.getByTestId('sensing-rest-name-0').textContent).toBe('Elara');
    expect(screen.getByTestId('sensing-rest-epithet-0').textContent).toBe('merchant\'s daughter');
    expect(screen.getByTestId('sensing-rest-name-1').textContent).toBe('Bram');
    expect(screen.getByTestId('sensing-rest-epithet-1').textContent).toBe('ferryman');
    // Fail-soft: no epithet ⇒ the name alone, no dangling separator.
    expect(screen.getByTestId('sensing-rest-label-2').textContent).toBe('Ysolde');
    expect(screen.getByTestId('sensing-choose-hint').textContent).toBe(SENSING_CHOOSE_HINT);
    expect(SENSING_CHOOSE_HINT).toBe('Look closer at one, then choose.');
  });

  it('the resting line is not dimmed with its portrait; it hides on focus', () => {
    renderBeat();
    const label = screen.getByTestId('sensing-rest-label-0').parentElement!;
    expect(label.style.opacity).toBe('1');
    expect(label.style.filter).toBe('');
    fireEvent.click(screen.getByTestId('sensing-candidate-0'));
    expect(label.style.opacity).toBe('0');
    expect(screen.getByTestId('sensing-choose-hint').style.opacity).toBe('0');
  });

  it('the third portrait leaves room for its name line above a 1080px fold (Law 33)', () => {
    const vw = 1920, vh = 1080;
    const w = Math.min(PORTRAIT_MAX_WIDTH_PX, (PORTRAIT_WIDTH_VW / 100) * vw);
    const h = (w * 4) / 3;
    const worstFoot = Math.max(...REST_POSITIONS.map((r) => vh / 2 + (r.y / 100) * vh + (h / 2) * (r.scale + 0.06)));
    // Name line: a 0.5rem gap plus ~2 lines of xs type, generously 60px.
    expect(worstFoot + 60).toBeLessThan(vh);
  });
});

describe('THR-1987 — the keyboard looks closer, then chooses', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('Tab focus shows the vignette; Enter (a click on the focused button) chooses', () => {
    const onSelect = renderBeat();
    act(() => { screen.getByTestId('sensing-candidate-1').focus(); });
    expect(screen.getByTestId('sensing-candidate-name-1').textContent).toBe('Bram');
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByTestId('sensing-candidate-1'), { key: 'Enter' });
    fireEvent.click(screen.getByTestId('sensing-candidate-1'));
    act(() => { vi.advanceTimersByTime(1500); });
    expect(onSelect).toHaveBeenCalledWith(PICKS[1], 1);
  });

  it('a mouse press that focuses the button still takes a second click to choose (Law 48)', () => {
    const onSelect = renderBeat();
    const btn = screen.getByTestId('sensing-candidate-0');
    // Browser order: pointerdown → focus → click.
    fireEvent.pointerDown(btn);
    act(() => { btn.focus(); });
    fireEvent.click(btn);
    expect(screen.getByTestId('sensing-candidate-name-0').textContent).toBe('Elara');
    act(() => { vi.advanceTimersByTime(1500); });
    expect(onSelect).not.toHaveBeenCalled();

    // A press on another portrait blurs this one and focuses that one first.
    const other = screen.getByTestId('sensing-candidate-2');
    fireEvent.pointerDown(other);
    act(() => { other.focus(); });
    fireEvent.click(other);
    act(() => { vi.advanceTimersByTime(1500); });
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByTestId('sensing-candidate-name-2').textContent).toBe('Ysolde');

    fireEvent.pointerDown(other);
    fireEvent.click(other);
    act(() => { vi.advanceTimersByTime(1500); });
    expect(onSelect).toHaveBeenCalledWith(PICKS[2], 2);
  });
});
