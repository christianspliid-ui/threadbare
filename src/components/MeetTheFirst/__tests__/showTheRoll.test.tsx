// @vitest-environment jsdom
/**
 * THR-1714 — show the roll, on the composed meeting surface.
 *
 * Drives the real `FormativeTestBeat` (the same harness shape as
 * `meetingEssenceSpend.test.tsx`) and asserts what the player reads:
 * - the commit names silence until a card is staged, then names the hand (Law 47);
 * - a leaning card wears its lean as a sheet word;
 * - the moved forecast reads "your hand: X → Y", never "was X";
 * - the reveal opens with the fate line, above the band prose, and its forecast
 *   word is the word the header showed at commit.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { FormativeTestBeat, type ConvertedTest } from '../FormativeTestBeat';
import { selectDilemmas } from '../../../engine/meetingEncounter';
import { leanTagFor } from '../../../engine/meetingFateLine';
import { ENRICHED_DILEMMA_LIBRARY } from '../../../data/meeting-dilemma-library';
import {
  NUDGE_COMMIT_LABEL,
  NUDGE_COMMIT_LABEL_SILENT,
} from '../../../data/nudge-stage-content';
import type { FormativeTest, NarrativeCandidate } from '../../../types/meetingEncounter';

const CONVERTED = ENRICHED_DILEMMA_LIBRARY.filter((t) => t.test != null);

/**
 * A test whose leaning card moves the forecast tier on its own, so the shift
 * line has something to show. Found by scan rather than pinned by id, so the
 * fixture survives content edits; the guard below fails loudly if none exists.
 */
function pickFixture() {
  for (const template of CONVERTED) {
    const test = template.test as FormativeTest;
    const card = test.nudges.find((n) => n.poleLean && n.essenceCost <= 50 && n.forecastDelta > 0.1);
    if (card) return { template, test, card };
  }
  return undefined;
}
const FIXTURE = pickFixture();

const CANDIDATE = { tempId: 'cand.0', name: 'Wren Ashdown', sphere: 'life' } as unknown as NarrativeCandidate;
const POOL = { life: 500 };

function tests(): ConvertedTest[] {
  const { template, test } = FIXTURE!;
  const instance = selectDilemmas([template], 'iron', 'gold', 'life', 'any-archetype', 'village', 42)
    .find((i) => i.templateId === template.id)!;
  return [{ instance, test }];
}

function renderBeat() {
  render(
    <FormativeTestBeat
      candidate={CANDIDATE}
      tests={tests()}
      locationName="Hollowmere"
      essencePool={POOL}
      seed={7}
      onComplete={() => {}}
    />,
  );
  act(() => { vi.advanceTimersByTime(2000); });
}

describe('THR-1714 — show the roll in the meeting', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fixture holds a leaning card that moves the odds', () => {
    expect(FIXTURE, 'a converted test with a leaning, odds-moving card').toBeDefined();
  });

  it('the commit names silence, then the hand, the instant a card is staged', () => {
    renderBeat();
    const commit = screen.getByTestId('nudge-commit');
    expect(commit.textContent).toBe(NUDGE_COMMIT_LABEL_SILENT);
    fireEvent.click(screen.getByTestId(`nudge-card-${FIXTURE!.card.id}`));
    expect(commit.textContent).toBe(NUDGE_COMMIT_LABEL);
    expect(document.body.textContent).not.toContain('Let fate decide');
  });

  it('a leaning card wears its lean; the shift line names the hand, never "was"', () => {
    renderBeat();
    const { test, card } = FIXTURE!;
    expect(screen.getByTestId(`nudge-card-lean-${card.id}`).textContent).toBe(
      leanTagFor(test.valuePair, card.poleLean),
    );
    for (const n of test.nudges.filter((x) => !x.poleLean)) {
      expect(screen.queryByTestId(`nudge-card-lean-${n.id}`)).toBeNull();
    }

    fireEvent.click(screen.getByTestId(`nudge-card-${card.id}`));
    const moved = screen.queryByTestId('nudge-forecast-moved');
    if (moved) {
      expect(moved.textContent).toMatch(/^your hand: \w+ → \w+$/);
      expect(moved.textContent).not.toMatch(/\bwas\b/);
    }
  });

  it('the reveal opens with the fate line, quoting the word the header showed at commit', () => {
    renderBeat();
    fireEvent.click(screen.getByTestId(`nudge-card-${FIXTURE!.card.id}`));
    const shownWord = screen.getByTestId('nudge-forecast-pill').textContent ?? '';
    fireEvent.click(screen.getByTestId('nudge-commit'));

    const line = screen.getByTestId('formative-fate-line');
    expect(line.getAttribute('data-fate-key')).toMatch(/^leaned\./);
    expect(line.textContent?.toLowerCase()).toContain(shownWord.toLowerCase());
    expect(line.textContent).toContain('Wren Ashdown');
    expect(line.textContent).not.toMatch(/[{}]/);

    // Fate → Outcome (Law 38): the line sits above the band prose.
    const prose = screen.getByTestId('formative-fate-prose');
    expect(line.compareDocumentPosition(prose) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('a silent commit says so', () => {
    renderBeat();
    fireEvent.click(screen.getByTestId('nudge-commit'));
    const line = screen.getByTestId('formative-fate-line');
    expect(line.getAttribute('data-fate-key')).toMatch(/^silent\./);
    expect(line.textContent).toMatch(/^You stayed silent\./);
  });
});
