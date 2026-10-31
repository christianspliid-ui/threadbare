// @vitest-environment jsdom
/**
 * THR-2093 — the formative test's prose and its helps/hinders panel sit on a
 * dark backing, and the prose stops growing with the window.
 *
 * Drives the real `FormativeTestBeat` (the `showTheRoll.test.tsx` harness) and
 * reads the rendered DOM: the god voice and the setup share one backed block
 * capped at `--measure-prose`, and `nudge-test-panel` wears the same backing.
 * The backing alpha is pinned against Law 45 on pure-white art.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { FormativeTestBeat, type ConvertedTest } from '../FormativeTestBeat';
import { selectDilemmas } from '../../../engine/meetingEncounter';
import { ENRICHED_DILEMMA_LIBRARY } from '../../../data/meeting-dilemma-library';
import { READING_BACKING_ALPHA } from '../../shared/readingBacking';
import type { NarrativeCandidate } from '../../../types/meetingEncounter';

const TEMPLATE = ENRICHED_DILEMMA_LIBRARY.find((t) => t.test != null)!;
const CANDIDATE = { tempId: 'cand.0', name: 'Wren Ashdown', sphere: 'life' } as unknown as NarrativeCandidate;

function tests(): ConvertedTest[] {
  const instance = selectDilemmas([TEMPLATE], 'iron', 'gold', 'life', 'any-archetype', 'village', 42)
    .find((i) => i.templateId === TEMPLATE.id)!;
  return [{ instance, test: TEMPLATE.test! }];
}

function renderBeat() {
  render(
    <FormativeTestBeat
      candidate={CANDIDATE}
      tests={tests()}
      locationName="Hollowmere"
      essencePool={{ life: 500 }}
      seed={7}
      onComplete={() => {}}
    />,
  );
  act(() => { vi.advanceTimersByTime(2000); });
}

const BACKING_BG = `rgba(10, 10, 15, ${READING_BACKING_ALPHA})`;

/** WCAG relative luminance of an sRGB triple. */
function luminance(rgb: readonly number[]): number {
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}
const over = (fg: readonly number[], a: number, bg: readonly number[]) => fg.map((v, i) => v * a + bg[i] * (1 - a));
const contrast = (a: readonly number[], b: readonly number[]) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

describe('THR-2093 — the meeting test reads on a backing', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('the god voice and the setup sit in one backed block capped at the prose measure', () => {
    renderBeat();
    const block = screen.getByTestId('formative-reading-block');
    expect(block.style.background).toBe(BACKING_BG);
    expect(block.style.maxWidth).toBe('var(--measure-prose)');
    const paragraphs = block.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[1].textContent).toContain('Wren Ashdown');
  });

  it('the helps/hinders panel wears the same backing, outside the measured block', () => {
    renderBeat();
    const panel = screen.getByTestId('nudge-test-panel');
    expect(panel.style.background).toBe(BACKING_BG);
    expect(screen.getByTestId('formative-reading-block').contains(panel)).toBe(false);
  });

  it('every text tone on the backing holds 4.5:1 even over pure-white art (Law 45)', () => {
    const bg = over([10, 10, 15], READING_BACKING_ALPHA, [255, 255, 255]);
    const tones: Array<[string, number[], number]> = [
      ['god voice', [212, 168, 122], 0.7],
      ['setup', [200, 190, 170], 0.85],
      ['hinders (--negative)', [248, 113, 113], 1],
    ];
    for (const [name, rgb, alpha] of tones) {
      expect(contrast(over(rgb, alpha, bg), bg), name).toBeGreaterThanOrEqual(4.5);
    }
  });
});
