/**
 * The forecast window — THR-1582 (forecast window S4), plan
 * `Docs/plans/2026-09-24-thr-1575-forecast-window.md` § Systems design 3.
 *
 * Director ruling (Christian, 2026-09-24): a mortal engages a challenge when its
 * own forecast says it can win about half the time — *"the 50–65% success rate is
 * what a mortal would deem acceptable as forecast in order to actually actively
 * engage with the challenge."* Who the mortal is decides which challenges those are.
 *
 * `computeEngagementFit` turns a candidate's engagement forecast `F` (the chance the
 * whole action ends in the success family) into a **multiplier** on its score. It
 * never replaces the score: desire, ambition, faction, reputation and resonance
 * still decide *which* in-window challenge a mortal picks (theme), and cooldowns,
 * familiarity and novelty still spread choices (variety).
 *
 * Shape of the fit:
 * - **in** — 1 inside `[low, high]`.
 * - **below** — linear from 1 at `low` down to `ENGAGE_BELOW_FIT_MIN` at
 *   `ENGAGE_REFUSE_BELOW`; mortals shy away from challenges above them.
 * - **refused** — 0 under `ENGAGE_REFUSE_BELOW`: the mortal will not engage on its own.
 * - **above** — linear from 1 at `high` down to `ENGAGE_TOO_EASY_FIT` at
 *   `ENGAGE_TOO_EASY_AT`, flat after; content beneath a mortal is allowed but
 *   unattractive, so masters never idle for lack of master content.
 *
 * The window moves: `[ENGAGE_WINDOW_LOW, ENGAGE_WINDOW_HIGH]
 *   − ENGAGE_PERSONALITY_SHIFT × courageLean + setbackShift`. A bold mortal accepts
 * slightly longer odds, a cautious one wants slightly better; a mortal that has
 * failed several times running looks for something it can win (the setback shift,
 * trap 2 — the stuck spiral), and the shift resets on its next success.
 *
 * Only a mortal's **free choice** passes through here. Appointments, seeded and
 * forced arrivals, lair fights, debug spawns and The First's meeting bypass it —
 * fate and promises are not choices.
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * | Failure                          | Behaviour                                   |
 * |----------------------------------|---------------------------------------------|
 * | `forecast` NaN / non-finite      | zone `in`, fit 1 — today's behaviour for that candidate |
 * | `forecast` outside 0..1          | clamped                                      |
 * | `courageLean` missing / NaN      | lean 0 (no shift)                            |
 * | `consecutiveFailures` NaN / < 0  | 0 (no setback shift)                         |
 *
 * Pure arithmetic, no PRNG, no graph access (NFP #3, #7).
 */

import {
  ENGAGE_WINDOW_LOW,
  ENGAGE_WINDOW_HIGH,
  ENGAGE_PERSONALITY_SHIFT,
  ENGAGE_REFUSE_BELOW,
  ENGAGE_BELOW_FIT_MIN,
  ENGAGE_TOO_EASY_AT,
  ENGAGE_TOO_EASY_FIT,
  SETBACK_WINDOW_SHIFT,
  SETBACK_WINDOW_SHIFT_MAX,
} from '../data/agent-behavior-constants';
import type { UnifiedAction } from '../types/unifiedAction';

export type EngagementZone = 'refused' | 'below' | 'in' | 'above';

export interface EngagementFit {
  /** Multiplier on the candidate's score, 0 when refused. */
  fit: number;
  zone: EngagementZone;
  /** Window edges after the personality and setback shifts. */
  windowLow: number;
  windowHigh: number;
  /** The setback shift that went into the window (0 with no recent failures). */
  setbackShift: number;
}

export interface EngagementFitOptions {
  /** Branching quests keep today's outgrowth exemption: never discounted as too easy. Still refused below `ENGAGE_REFUSE_BELOW`. */
  exemptTooEasy?: boolean;
}

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** `min(SETBACK_WINDOW_SHIFT × failures, SETBACK_WINDOW_SHIFT_MAX)`; 0 for a missing or negative count. */
export function computeSetbackShift(consecutiveFailures: number): number {
  const n = Math.max(0, Math.floor(finiteOr(consecutiveFailures, 0)));
  return Math.min(SETBACK_WINDOW_SHIFT * n, SETBACK_WINDOW_SHIFT_MAX);
}

export function computeEngagementFit(
  forecast: number,
  courageLean: number,
  consecutiveFailures: number,
  opts?: EngagementFitOptions,
): EngagementFit {
  const lean = Math.max(-1, Math.min(1, finiteOr(courageLean, 0)));
  const setbackShift = computeSetbackShift(consecutiveFailures);
  const shift = -ENGAGE_PERSONALITY_SHIFT * lean + setbackShift;
  const windowLow = ENGAGE_WINDOW_LOW + shift;
  const windowHigh = ENGAGE_WINDOW_HIGH + shift;
  const base = { windowLow, windowHigh, setbackShift };

  if (!Number.isFinite(forecast)) return { fit: 1, zone: 'in', ...base };
  const f = Math.max(0, Math.min(1, forecast));

  if (f < ENGAGE_REFUSE_BELOW) return { fit: 0, zone: 'refused', ...base };
  if (f < windowLow) {
    // A setback shift can push the window's low edge toward the refuse edge; the
    // ramp still spans refuse → low, so a zero-width span reads as in-window.
    const span = windowLow - ENGAGE_REFUSE_BELOW;
    const t = span > 0 ? (f - ENGAGE_REFUSE_BELOW) / span : 1;
    return { fit: ENGAGE_BELOW_FIT_MIN + (1 - ENGAGE_BELOW_FIT_MIN) * t, zone: 'below', ...base };
  }
  if (f <= windowHigh) return { fit: 1, zone: 'in', ...base };
  if (opts?.exemptTooEasy) return { fit: 1, zone: 'above', ...base };
  const span = ENGAGE_TOO_EASY_AT - windowHigh;
  const t = span > 0 ? Math.min(1, (f - windowHigh) / span) : 1;
  return { fit: 1 - (1 - ENGAGE_TOO_EASY_FIT) * t, zone: 'above', ...base };
}

const FAILURE_OUTCOMES = new Set(['failure', 'critical_failure', 'contested_lost']);
const SUCCESS_OUTCOMES = new Set(['critical_success', 'success', 'success_at_cost', 'contested_won']);

/**
 * The mortal's consecutive failed engagements since its last success-family
 * outcome, read from its resolved actions (most recent first). Outcomes that are
 * neither (abandoned, halted, no outcome) are skipped rather than counted, so they
 * neither extend nor reset the run.
 *
 * `isEngagement` narrows which actions count (the caller passes the encounter
 * predicate); fail-soft: no resolved history reads 0.
 */
export function countConsecutiveFailures(
  unifiedActions: readonly UnifiedAction[],
  agentId: string,
  isEngagement: (templateId: string) => boolean,
): number {
  const mine: UnifiedAction[] = [];
  for (const a of unifiedActions) {
    if (a.actorId !== agentId || !a.resolved || !a.outcome) continue;
    if (!isEngagement(a.templateId)) continue;
    mine.push(a);
  }
  if (mine.length === 0) return 0;
  // Most recent first; ties keep array order (later entries are newer), reversed.
  const indexed = mine.map((a, i) => ({ a, i }));
  indexed.sort((x, y) =>
    ((y.a.completedAtTick ?? y.a.startTick) - (x.a.completedAtTick ?? x.a.startTick)) || (y.i - x.i));
  let run = 0;
  for (const { a } of indexed) {
    const outcome = a.outcome as string;
    if (SUCCESS_OUTCOMES.has(outcome)) break;
    if (FAILURE_OUTCOMES.has(outcome)) run++;
  }
  return run;
}

/** True when an action's outcome is a failure (for the failure cooldown). */
export function isFailedOutcome(outcome: string | undefined): boolean {
  return outcome !== undefined && FAILURE_OUTCOMES.has(outcome);
}
