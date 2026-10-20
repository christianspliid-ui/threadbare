// @vitest-environment jsdom
/**
 * THR-1858 item 2 — a card that lifts the odds inside one tier still shows it.
 *
 * Warm round 2 (skimmer): "Press the Odds didn't change the odds label." The
 * card adds +0.10, and "Uncertain" spans 0.40–0.60, so the tier held and the
 * "your hand lifts the odds" note — gated on a tier change — never rendered.
 * The note now follows the probability; the row still carries one tier word.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NudgeReadingMarks, forecastMoveDirection } from '../shells/NudgeStageHeader';
import { forecastHasMoved } from '../useNudgeHand';
import { FORECAST_TIER_WORDS, NUDGE_FORECAST_SHIFT_LINES } from '../../../../data/nudge-stage-content';

const BASE = { tier: 'uncertain', word: FORECAST_TIER_WORDS.uncertain, probability: 0.45 } as const;
const LIFTED = { tier: 'uncertain', word: FORECAST_TIER_WORDS.uncertain, probability: 0.55 } as const;

const PANEL = {
  reach: 'star',
  reachLabel: 'Star',
  difficultyWord: 'hard',
  difficultyValue: 0.5,
  factors: [],
} as const;

describe('THR-1858 — intra-tier forecast move', () => {
  it('a shift inside one tier counts as a move; an unchanged forecast does not', () => {
    expect(forecastHasMoved(BASE, LIFTED)).toBe(true);
    expect(forecastHasMoved(BASE, { ...BASE })).toBe(false);
    expect(forecastHasMoved(BASE, { ...BASE, tier: 'favorable' })).toBe(true);
  });

  it('the direction inside a tier follows the probability', () => {
    expect(forecastMoveDirection(BASE, LIFTED)).toBe('up');
    expect(forecastMoveDirection(LIFTED, BASE)).toBe('down');
    // A tier change still decides on the ladder.
    expect(forecastMoveDirection(BASE, { tier: 'perilous', probability: 0.3 })).toBe('down');
  });

  it('renders the direction mark beside the one tier word when the tier holds', () => {
    render(
      <NudgeReadingMarks
        testPanel={PANEL as never}
        forecast={LIFTED}
        baseForecast={BASE}
        forecastMoved={forecastHasMoved(BASE, LIFTED)}
        designerView={false}
      />,
    );
    // THR-1985 — the line then says the word held (or is close to the next rung).
    expect(screen.getByTestId('nudge-forecast-moved').textContent).toMatch(
      new RegExp(`^${NUDGE_FORECAST_SHIFT_LINES.up} — (still|close to) `),
    );
    expect(screen.getByTestId('nudge-forecast-pill').textContent?.toLowerCase())
      .toBe(FORECAST_TIER_WORDS.uncertain.toLowerCase());
  });
});
