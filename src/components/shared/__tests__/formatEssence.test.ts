/**
 * THR-1006 — the formatter that keeps raw IEEE-754 floats off mortal-facing surfaces.
 *
 * The reported defect was `◆ 193.60000000000005 essence` on the nudge stage: not a
 * single bad value, but ordinary accumulation of fractional card costs interpolated
 * straight into a template literal. These tests pin the two properties that matter —
 * float noise collapses, and an authored fractional price survives — plus the
 * regression guard the ticket asked for by value.
 */

import { describe, it, expect } from 'vitest';
import {
  formatEssence,
  formatEssenceLabel,
  formatEssencePool,
  ESSENCE_DISPLAY_DECIMALS,
} from '../formatEssence';

describe('formatEssence', () => {
  it('collapses the exact float from THR-1006 to what a player would say', () => {
    // The value read off the commit button in THR-1004's browser verification.
    expect(formatEssence(193.60000000000005)).toBe('193.6');
    expect(formatEssenceLabel(193.60000000000005)).toBe('193.6 essence');
  });

  it('never emits more than ESSENCE_DISPLAY_DECIMALS decimal places', () => {
    // The property, not just the one reported value: no output may carry a
    // fractional tail longer than the constant allows, for any input.
    const inputs = [
      193.60000000000005,
      0.1 + 0.2, // 0.30000000000000004
      1 / 3,
      2 / 3,
      99.999,
      0.005,
      1234.56789,
    ];
    for (const n of inputs) {
      const decimals = formatEssence(n).split('.')[1]?.length ?? 0;
      expect(decimals).toBeLessThanOrEqual(ESSENCE_DISPLAY_DECIMALS);
    }
  });

  it('keeps an authored fractional price rather than flooring it away', () => {
    // Flooring would print `0 essence` and promise a free card — the reason this
    // rounds rather than floors, unlike the pool balance in NudgePhaseShell.
    expect(formatEssence(0.05)).toBe('0.05');
    expect(formatEssenceLabel(0.05)).toBe('0.05 essence');
  });

  it('shows a whole number whole, with no trailing zeros', () => {
    expect(formatEssence(193)).toBe('193');
    expect(formatEssence(0.5)).toBe('0.5');
    expect(formatEssence(2.0)).toBe('2');
    expect(formatEssenceLabel(3)).toBe('3 essence');
  });

  it('fails soft on a non-finite value instead of surfacing NaN (NFP #4)', () => {
    expect(formatEssence(Number.NaN)).toBe('0');
    expect(formatEssence(Number.POSITIVE_INFINITY)).toBe('0');
    expect(formatEssenceLabel(Number.NaN)).toBe('0 essence');
  });

  it('is falsifiable — a raw interpolation would fail these assertions', () => {
    // Guards against the test passing vacuously if the formatter degenerated to
    // `String(value)`: the two sides must differ for the reported value.
    expect(String(193.60000000000005)).not.toBe(formatEssence(193.60000000000005));
  });
});

describe('formatEssencePool — UI Law 13 pool balances', () => {
  it('renders a pool balance as a whole number, never a fraction', () => {
    // Law 13's ratified exception permits a pool balance as a *whole-number*
    // numeral. `191.2` would satisfy "no float noise" and still break the Law.
    expect(formatEssencePool(191.20000000000002)).toBe('191');
    expect(formatEssencePool(193.60000000000005)).toBe('193');
    expect(formatEssencePool(190)).toBe('190');
  });

  it('floors rather than rounds — a pool buys what its floor buys', () => {
    expect(formatEssencePool(191.9)).toBe('191');
    expect(formatEssencePool(0.9)).toBe('0');
  });

  it('agrees with the price formatter on whole values, and only there', () => {
    // The two readouts on the nudge screen quote the same pool. On a whole
    // value they must be identical; on a fractional one they deliberately
    // differ, because only the pool is bound by Law 13's whole-number rule.
    expect(formatEssencePool(190)).toBe(formatEssence(190));
    expect(formatEssencePool(191.2)).not.toBe(formatEssence(191.2));
  });

  it('fails soft on a non-finite value (NFP #4)', () => {
    expect(formatEssencePool(Number.NaN)).toBe('0');
    expect(formatEssencePool(Number.NEGATIVE_INFINITY)).toBe('0');
  });
});
