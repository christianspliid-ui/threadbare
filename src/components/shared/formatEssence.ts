/**
 * Essence, in display form (THR-1006).
 *
 * Essence is the one resource the nudge model shows the player as a **numeral**
 * on purpose — `ui.nudge_essence` calls it "Your reserve of divine power", and a
 * price you pay has to be countable. That exemption from the words-never-numerals
 * rule (THR-1004) is exactly why the number's *formatting* has to be owned in one
 * place: every surface that quotes essence is quoting the same pool, so any two of
 * them that format it differently are telling the player two different things.
 *
 * The defect this closes is a raw `${cost} essence` interpolation reaching a
 * mortal-facing surface as `193.60000000000005 essence` — seventeen significant
 * figures of IEEE-754 noise, produced by ordinary accumulation of fractional card
 * costs, not by any single bad value.
 *
 * **Rounding, not flooring.** Card costs are genuinely fractional (`0.05 essence`
 * is an authored price), so flooring would print `0 essence` and promise a free
 * card. The pool balance in `NudgePhaseShell` floors deliberately and separately —
 * that one is a balance the player spends from, not a price they pay.
 */

/**
 * Decimal places kept before trailing zeros are stripped.
 *
 * Two is the precision authored costs actually use (`0.05`), and it is the same
 * precision the three `.toFixed(2)` call sites already assumed — this constant
 * makes that assumption named and shared rather than repeated as a literal.
 */
export const ESSENCE_DISPLAY_DECIMALS = 2;

/**
 * Format an essence quantity for display — never the raw float.
 *
 * Rounds to {@link ESSENCE_DISPLAY_DECIMALS} and strips trailing zeros, so a
 * whole number reads whole (`193`), an authored fractional price keeps its
 * meaning (`0.05`), and accumulated float noise collapses to what the player
 * would have said themselves (`193.60000000000005` → `193.6`).
 *
 * Fail-soft (NFP #4): a non-finite input returns `'0'` rather than letting
 * `NaN essence` reach a surface — a missing cost is a cost of nothing, and no
 * display path is worth throwing from.
 */
export function formatEssence(value: number): string {
  if (!Number.isFinite(value)) return '0';
  // Number() re-parses so `toFixed`'s trailing zeros vanish: 193.60 -> 193.6,
  // 193.00 -> 193. Doing it in that order also absorbs the float noise, which
  // a bare `Number(value)` would preserve.
  return String(Number(value.toFixed(ESSENCE_DISPLAY_DECIMALS)));
}

/** Essence with its unit, as every cost label quotes it: `193.6 essence`. */
export function formatEssenceLabel(value: number): string {
  return `${formatEssence(value)} essence`;
}

/**
 * A **pool balance** for persistent chrome — whole numbers only (UI Law 13).
 *
 * Law 13 forbids raw magnitudes on mortal-facing surfaces, with one ratified
 * exception (2026-08-06): a resource-pool balance may render as a *whole-number*
 * numeral, because a pool is not a card face and forty pips would be unreadable.
 * A price is a different thing and keeps its fraction — use {@link formatEssence}
 * there; `0.05` is an authored cost and flooring it would promise a free card.
 *
 * Floors rather than rounds, matching what the player can actually spend: a pool
 * of `191.2` buys what `191` buys. This is the shared home for the rule the nudge
 * stage's budget line already applied inline as `Math.floor`, so the two pool
 * readouts on the same screen cannot drift apart again (THR-1006).
 */
export function formatEssencePool(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return String(Math.floor(value));
}
