/**
 * THR-1985 (plan E3, A3, A5) — a move inside a tier says the word held, or that
 * it is close to the next rung; the legend sentence names the ladder worst to
 * best; the card legend names the whole pip ladder.
 */
import { describe, it, expect } from 'vitest';
import { forecastMoveDetail, forecastMoveLine } from '../shells/NudgeStageHeader';
import {
  FORECAST_TIER_LADDER,
  FORECAST_TIER_WORDS,
  NUDGE_FORECAST_SHIFT_LINES,
  NUDGE_READING_LEGEND_ENTRIES,
  NUDGE_READING_LEGEND_SENTENCE,
} from '../../../../data/nudge-stage-content';
import { NUDGE_GLYPH_LEGEND } from '../../../../data/nudge-card-display';
import { FORECAST_NEAR_NEXT_TIER_MARGIN, FORECAST_TIER_DOOMED_MAX } from '../../../../data/encounter-experience-constants';

const f = (tier: string, probability: number) => ({ tier, probability }) as never;

describe('forecastMoveDetail', () => {
  it('held: a lift inside Doomed keeps the word', () => {
    const d = forecastMoveDetail(f('doomed', 0.05), f('doomed', 0.1));
    expect(d).toEqual({ direction: 'up', heldTier: 'doomed' });
    expect(forecastMoveLine(d)).toBe(`${NUDGE_FORECAST_SHIFT_LINES.up} — still Doomed`);
  });

  it('near: a lift that ends within the margin of the next rung says close to it', () => {
    const p = FORECAST_TIER_DOOMED_MAX - FORECAST_NEAR_NEXT_TIER_MARGIN / 2;
    const d = forecastMoveDetail(f('doomed', 0.05), f('doomed', p));
    expect(d.nearNext).toBe('perilous');
    expect(forecastMoveLine(d)).toBe(`${NUDGE_FORECAST_SHIFT_LINES.up} — close to Perilous`);
  });

  it('near on the way down names the rung below', () => {
    const d = forecastMoveDetail(f('perilous', 0.35), f('perilous', FORECAST_TIER_DOOMED_MAX + 0.01));
    expect(d).toEqual({ direction: 'down', heldTier: 'perilous', nearNext: 'doomed' });
  });

  it('an exact-margin distance reads the same both ways (hundredths are not exact floats)', () => {
    expect(forecastMoveDetail(f('doomed', 0.05), f('doomed', 0.15)).nearNext).toBe('perilous');
    expect(forecastMoveDetail(f('uncertain', 0.55), f('uncertain', 0.45)).nearNext).toBe('perilous');
    expect(forecastMoveDetail(f('favorable', 0.7), f('favorable', 0.75)).nearNext).toBe('fated');
    expect(forecastMoveDetail(f('doomed', 0.05), f('doomed', 0.14)).nearNext).toBeUndefined();
  });

  it('changed: a tier change carries no held word (the pill already says it)', () => {
    const d = forecastMoveDetail(f('doomed', 0.15), f('perilous', 0.3));
    expect(d).toEqual({ direction: 'up' });
    expect(forecastMoveLine(d)).toBe(NUDGE_FORECAST_SHIFT_LINES.up);
  });

  it('Fated has no rung above it, so a lift there only holds', () => {
    expect(forecastMoveDetail(f('fated', 0.9), f('fated', 0.99))).toEqual({ direction: 'up', heldTier: 'fated' });
  });

  it('fail-soft: an unknown tier reads as a plain direction', () => {
    expect(forecastMoveDetail(f('???', 0.1), f('???', 0.2))).toEqual({ direction: 'up' });
  });
});

describe('the odds legend sentence', () => {
  it('names the ladder worst to best, in ladder order, as one sentence', () => {
    const words = FORECAST_TIER_LADDER.map((t) => FORECAST_TIER_WORDS[t]);
    expect(words).toEqual(['Doomed', 'Perilous', 'Uncertain', 'Favorable', 'Fated']);
    expect(NUDGE_READING_LEGEND_SENTENCE).toBe(
      'The word is how it looks now, worst to best: Doomed, Perilous, Uncertain, Favorable, Fated. Green lines help, red lines hinder.',
    );
    expect(NUDGE_READING_LEGEND_ENTRIES.map((e) => e.label).join(' ')).toBe(NUDGE_READING_LEGEND_SENTENCE);
  });

  it('the card legend shows the whole pip ladder', () => {
    const odds = NUDGE_GLYPH_LEGEND.find((e) => e.id === 'odds')!;
    // THR-2061 — the weakest tier's hollow pip rides with it, so ○ is named.
    expect(odds.glyph).toBe('●○ ■ ◆ ★');
    expect(odds.label).toBe('odds: more filled is stronger');
  });
});
