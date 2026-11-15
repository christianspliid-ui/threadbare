/**
 * THR-2236 — the Mandate says what moves it: the fill line names the spend (in the
 * Mandate's spheres, joined with "or", on a bound mortal's chapters or on places), and
 * "Rising" lasts three days (`MANDATE_TREND_WINDOW_TICKS` = 36) so it survives the gap
 * between two playable chapters.
 */
import { describe, it, expect } from 'vitest';
import {
  mandateFillLine,
  MANDATE_FILL_LINE,
  MANDATE_DEED_MORTAL_FALLBACK,
} from '../../../data/ascendant-bar-content';
import { MANDATE_TREND_WINDOW_TICKS } from '../../../data/game-config';
import { rollLedgerWindow, mandateTrendOf } from '../../mandateLedger';

describe('mandateFillLine — THR-2236', () => {
  const SPHERES = ['Mind', 'Spirit'];

  it('none bound: places only', () => {
    expect(mandateFillLine(0, 'zero', SPHERES)).toBe('Rises when you spend Mind or Spirit essence on places.');
  });

  it("one bound: names the mortal's chapters", () => {
    expect(mandateFillLine(1, 'one', SPHERES, 'Aldric'))
      .toBe("Rises when you spend Mind or Spirit essence on Aldric's chapters, or on places.");
  });

  it('many bound: spelled-out count', () => {
    expect(mandateFillLine(3, 'three', SPHERES))
      .toBe('Rises when you spend Mind or Spirit essence on the chapters of the three mortals bound to you, or on places.');
  });

  it('the two sphere words join with "or", never "and"', () => {
    for (const n of [0, 1, 2]) {
      const line = mandateFillLine(n, 'two', SPHERES, 'Aldric');
      expect(line).toContain('Mind or Spirit');
      expect(line).not.toContain('Mind and Spirit');
    }
  });

  it('a missing or blank name falls back to MANDATE_DEED_MORTAL_FALLBACK', () => {
    const fallback = MANDATE_DEED_MORTAL_FALLBACK.toLowerCase();
    for (const name of [undefined, '', '   ']) {
      const line = mandateFillLine(1, 'one', SPHERES, name);
      expect(line.toLowerCase()).toContain(fallback);
      expect(line).toBe(`Rises when you spend Mind or Spirit essence on the chapters of ${fallback}, or on places.`);
    }
  });

  it('a name with a replacement pattern is inserted literally', () => {
    expect(mandateFillLine(1, 'one', SPHERES, '$& Vex')).toContain("$& Vex's chapters");
  });

  it('every template carries {spheres}', () => {
    for (const t of Object.values(MANDATE_FILL_LINE)) expect(t).toContain('{spheres}');
  });
});

describe('the trend window — THR-2236', () => {
  it('is three days', () => {
    expect(MANDATE_TREND_WINDOW_TICKS).toBe(36);
  });

  it('keeps a credit made 30 ticks ago and drops one made 36 ago', () => {
    const now = 100;
    const kept = rollLedgerWindow([{ tick: now - 30, points: 0.7 }], now, 0);
    expect(kept.moves).toHaveLength(1);
    expect(kept.delta).toBeCloseTo(0.7);
    const dropped = rollLedgerWindow([{ tick: now - 36, points: 0.7 }], now, 0);
    expect(dropped.moves).toHaveLength(0);
    expect(dropped.delta).toBe(0);
  });

  it('reads "rising" 30 ticks after a single deed', () => {
    // One deed at tick 10, then the window rolls on each tick with no further credit.
    let w = rollLedgerWindow(undefined, 10, 0.7);
    for (let t = 11; t <= 40; t++) w = rollLedgerWindow(w.moves, t, 0);
    expect(mandateTrendOf(w.delta)).toBe('rising');
    for (let t = 41; t <= 46; t++) w = rollLedgerWindow(w.moves, t, 0);
    expect(mandateTrendOf(w.delta)).toBe('steady');
  });
});
