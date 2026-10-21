// @vitest-environment jsdom
/**
 * THR-1988 — each "What will they become?" path is named at rest; Tab looks
 * closer and Enter chooses; a mouse still takes two clicks (Law 48).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SparkBeat } from '../SparkBeat';
import { SPARK_VISION_CATALOG } from '../../../data/spark-vision-catalog';

const VISIONS = SPARK_VISION_CATALOG.filter(v => v.requiredPrimaryReach === 'veil');

function renderBeat(onSelect = vi.fn()) {
  render(<SparkBeat visions={VISIONS} primarySphere="life" onSelect={onSelect} />);
  // The 2.5 s transition prose comes first; the cards arrive after it.
  act(() => { vi.advanceTimersByTime(2600); });
  return onSelect;
}

describe('THR-1988 — the paths are named before the first click', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('every card shows its title at rest, undimmed; titles hide on focus', () => {
    renderBeat();
    VISIONS.forEach((v, i) => {
      expect(screen.getByTestId(`spark-rest-title-${i}`).textContent).toBe(v.title);
    });
    const box = screen.getByTestId('spark-rest-title-0').parentElement!;
    expect(box.style.opacity).toBe('1');
    expect(box.style.filter).toBe('');
    fireEvent.click(screen.getByTestId('spark-vision-0'));
    expect(box.style.opacity).toBe('0');
  });

  it('a mouse takes two clicks to choose', () => {
    const onSelect = renderBeat();
    const card = screen.getByTestId('spark-vision-1');
    fireEvent.pointerDown(card);
    fireEvent.focus(card);
    fireEvent.click(card);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(card);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onSelect).toHaveBeenCalledWith(VISIONS[1], 1);
  });

  it('Tab looks closer, then Enter (a click on the focused card) chooses', () => {
    const onSelect = renderBeat();
    const card = screen.getByTestId('spark-vision-2');
    fireEvent.keyDown(window, { key: 'Tab' });
    fireEvent.focus(card);
    expect(screen.getByTestId('spark-rest-title-2').parentElement!.style.opacity).toBe('0');
    fireEvent.click(card);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onSelect).toHaveBeenCalledWith(VISIONS[2], 2);
  });
});
