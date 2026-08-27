/**
 * The `'live'` board mode is declared but not implemented — say so loudly.
 *
 * THR-1292 §4 ships `UNIFIED_DECISION_BOARD_MODE` as a three-value union
 * (`'off' | 'shadow' | 'live'`) and gates the flip to `'live'` on a measured
 * cutover census. Slice 6 ran that census and it **failed** on seed 99, so the
 * flip did not land and the `'live'` branch was deliberately not written: a
 * cutover path that nothing exercises is the fiction the interface-map rule and
 * slice 2's declined contract row both exist to prevent.
 *
 * That leaves one sharp edge, and this module is the guard rail on it. Because
 * the board block is entered on `MODE !== 'off'`, setting the constant to
 * `'live'` today **scores the board and then lets the legacy contests decide
 * anyway**. Nothing would report the discrepancy: the constant reads `'live'`,
 * the `decision_board_comparison` trace stamps `mode: 'live'` on every row, the
 * whole suite stays green, and the decision mix does not move. A future
 * executor could reasonably conclude the cutover had shipped.
 *
 * So the mode announces itself instead. Fail-soft per NFP #4 — the tick loop
 * must never crash, and a misconfigured constant is not worth a thrown
 * exception mid-tick — but never silent, per NFP #2. Once per process, because
 * this sits on the per-agent decision path and a warning that fires thousands of
 * times a run is noise that trains people to filter it.
 *
 * **When the cutover lands, delete this module**, along with its call in
 * `phaseAgentDecision.ts` and its test. It is scaffolding for a gap, not a
 * feature, and it should not outlive the gap.
 */

import { UNIFIED_DECISION_BOARD_MODE } from '../data/strategic-action-constants';

let warned = false;

/**
 * Warn once if the board mode is `'live'` while the cutover branch is absent.
 *
 * Exported `resetLiveBoardModeWarning` so a test can assert the once-only
 * behaviour without depending on module load order.
 */
export function warnLiveBoardModeUnimplemented(): void {
  if (warned) return;
  if (UNIFIED_DECISION_BOARD_MODE !== 'live') return;
  warned = true;
  console.warn(
    '[decisionBoard] UNIFIED_DECISION_BOARD_MODE is \'live\' but the cutover branch '
    + 'is not implemented — the board is scoring and the LEGACY contests are still '
    + 'deciding. This is shadow behaviour wearing a live label. See THR-1292 §4: the '
    + 'cutover gate failed on seed 99 and the flip is blocked on doc 2 authoring '
    + '`motivations` on the strategic templates.',
  );
}

/** Test seam: clear the once-only latch. */
export function resetLiveBoardModeWarning(): void {
  warned = false;
}
