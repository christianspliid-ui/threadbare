/**
 * Essence movement — *why* a sphere's pool moved lately (THR-1713).
 *
 * Round-2 testers saw "Matter 50 → 42, Mind 50 → 55 with no explanation". The
 * pool says what the god has; nothing said what fed it or drew on it. This
 * module keeps a small rolling ledger per sphere, filed by cause, which the
 * essence row's trend arrow and hover read.
 *
 * ## Where it is written
 *
 * The same seam as `essenceEarned.ts`: the phase merge in `runInlinePhase`
 * diffs the pool a phase returned against the one it was given, and the phase
 * id names the cause. Spends the player makes outside the tick (a played hand,
 * an authored choice, a cast, a boost or peek) never cross a phase, so their
 * sites call {@link withEssenceSpend} in the same state update that writes the
 * new pool.
 *
 * ## What it is not
 *
 * It observes only. Nothing here writes `essencePool`, scores, rolls or
 * branches on randomness (NFP #3). It is bounded by construction: two windows
 * per sphere, at most one entry per cause per window.
 *
 * Plan: `Docs/plans/2026-10-05-thr-1713-readable-on-hover.md` (D2, D3)
 */

import type { SphereName } from '../types/index';
import type {
  EssenceMovementBySphere,
  EssenceMovementCause,
  EssenceMovementRecord,
  EssenceMovementWindow,
  EssencePool,
} from '../types/influence';
import type { GameState } from '../types/gameState';
import { emitTrace } from './traceBuffer';

export type {
  EssenceMovementBySphere,
  EssenceMovementCause,
  EssenceMovementRecord,
  EssenceMovementWindow,
};

// ─── Tunables ────────────────────────────────────────────────────────

/** Length of one movement window; the reading spans this window and the one before. */
export const ESSENCE_MOVEMENT_WINDOW_TICKS = 100;

/** Net movement (essence) inside the reading below which a row reads *Steady*. */
export const ESSENCE_TREND_STEADY_EPSILON = 0.5;

/** Most feeds and most draws one row's tooltip names. */
export const ESSENCE_MOVEMENT_TOP_CAUSES = 2;

/**
 * A cause whose net inside the reading is smaller than this is not named as a
 * feed or a draw — it is noise next to the causes that actually moved the row.
 */
export const ESSENCE_MOVEMENT_CAUSE_FLOOR = 0.05;

/** Phase id (`runInlinePhase`) → cause. Unknown ids read `other`. */
export const ESSENCE_MOVEMENT_CAUSE_BY_PHASE: Readonly<Record<string, EssenceMovementCause>> = {
  essence: 'income',
  essence_sources: 'places',
  influence_maintenance: 'upkeep',
  control_effects: 'sustained',
  divine_premonition: 'premonition',
  unified_action_progress: 'acts',
  // Measured, not guessed (plan § Systems design): on a 150-tick seed-42 medium
  // run the only unmapped phase that moved a pool was `delve_emergence` — 100%
  // of that sphere's inflow, past the plan's one-third bar — so the delve
  // phases (registered, `phases/delve*.ts`) get their own cause.
  delve_admission: 'ruins',
  delve_progression: 'ruins',
  delve_emergence: 'ruins',
};

// ─── Pure core ───────────────────────────────────────────────────────

/** The cause for a phase id; `'other'` when the table does not name it. */
export function causeForPhase(phaseId: string): EssenceMovementCause {
  return ESSENCE_MOVEMENT_CAUSE_BY_PHASE[phaseId] ?? 'other';
}

/**
 * Fold one pool diff into the record under `cause`.
 *
 * Pure. Returns the *same* `record` reference when no sphere moved, so the seam
 * churns no state on the phases that leave the pool alone. A non-finite diff
 * (a poisoned pool) is skipped for that sphere; the record keeps its last good
 * state.
 *
 * Rolling: when `tick - current.fromTick >= ESSENCE_MOVEMENT_WINDOW_TICKS`, the
 * current window becomes `previous` and a fresh one opens at `tick`.
 */
export function recordEssenceMovement(
  record: EssenceMovementBySphere | undefined,
  prevPool: EssencePool | undefined,
  nextPool: EssencePool | undefined,
  cause: EssenceMovementCause,
  tick: number,
): EssenceMovementBySphere | undefined {
  if (!prevPool || !nextPool || prevPool === nextPool) return record;

  let next: Partial<Record<SphereName, EssenceMovementRecord>> | undefined;
  for (const sphere of Object.keys(nextPool) as SphereName[]) {
    const delta = (nextPool[sphere] ?? 0) - (prevPool[sphere] ?? 0);
    if (!Number.isFinite(delta) || delta === 0) continue;
    next ??= { ...record };
    next[sphere] = foldInto(next[sphere], cause, delta, tick);
  }
  return next ?? record;
}

function foldInto(
  rec: EssenceMovementRecord | undefined,
  cause: EssenceMovementCause,
  delta: number,
  tick: number,
): EssenceMovementRecord {
  if (!rec) return { current: { fromTick: tick, byCause: { [cause]: delta } } };
  const age = tick - rec.current.fromTick;
  if (age >= ESSENCE_MOVEMENT_WINDOW_TICKS) {
    const current = { fromTick: tick, byCause: { [cause]: delta } };
    // A window only rolls when its sphere next moves, so after a long quiet
    // spell the closing window can be hundreds of ticks old. Kept as
    // `previous` it would read as "lately" beside the fresh one; past two
    // windows it is dropped (its roll is still traced — see rolledWindows).
    return age >= 2 * ESSENCE_MOVEMENT_WINDOW_TICKS ? { current } : { previous: rec.current, current };
  }
  const byCause = { ...rec.current.byCause, [cause]: (rec.current.byCause[cause] ?? 0) + delta };
  return { ...rec, current: { fromTick: rec.current.fromTick, byCause } };
}

/** What the essence row shows: a direction and the top feeds and draws, by magnitude. */
export interface EssenceMovementReading {
  readonly trend: 'rising' | 'steady' | 'ebbing';
  readonly feeds: readonly EssenceMovementCause[];
  readonly draws: readonly EssenceMovementCause[];
}

const STEADY_READING: EssenceMovementReading = { trend: 'steady', feeds: [], draws: [] };

/**
 * Read one sphere's record. Sums `previous` and `current`; with `tick` given,
 * windows too old to be "lately" are dropped (a sphere untouched for two
 * windows reads *Steady* rather than replaying ancient history).
 */
export function readEssenceMovement(
  rec: EssenceMovementRecord | undefined,
  tick?: number,
): EssenceMovementReading {
  if (!rec) return STEADY_READING;
  const windows: EssenceMovementWindow[] = [];
  const age = tick === undefined ? 0 : tick - rec.current.fromTick;
  if (age < 2 * ESSENCE_MOVEMENT_WINDOW_TICKS) windows.push(rec.current);
  if (rec.previous && age < ESSENCE_MOVEMENT_WINDOW_TICKS) windows.push(rec.previous);
  if (windows.length === 0) return STEADY_READING;

  const sums = new Map<EssenceMovementCause, number>();
  for (const w of windows) {
    for (const [cause, v] of Object.entries(w.byCause) as [EssenceMovementCause, number][]) {
      if (!Number.isFinite(v)) continue;
      sums.set(cause, (sums.get(cause) ?? 0) + v);
    }
  }
  let net = 0;
  for (const v of sums.values()) net += v;

  const ranked = [...sums.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]) || a[0].localeCompare(b[0]));
  const feeds = ranked.filter(([, v]) => v >= ESSENCE_MOVEMENT_CAUSE_FLOOR).map(([c]) => c).slice(0, ESSENCE_MOVEMENT_TOP_CAUSES);
  const draws = ranked.filter(([, v]) => v <= -ESSENCE_MOVEMENT_CAUSE_FLOOR).map(([c]) => c).slice(0, ESSENCE_MOVEMENT_TOP_CAUSES);
  const trend = net > ESSENCE_TREND_STEADY_EPSILON ? 'rising' : net < -ESSENCE_TREND_STEADY_EPSILON ? 'ebbing' : 'steady';
  return { trend, feeds, draws };
}

/** Spheres whose window rolled between two records, with the window that closed. */
export function rolledWindows(
  before: EssenceMovementBySphere | undefined,
  after: EssenceMovementBySphere | undefined,
): readonly { sphere: SphereName; closed: EssenceMovementWindow }[] {
  if (!after || before === after) return [];
  const out: { sphere: SphereName; closed: EssenceMovementWindow }[] = [];
  for (const sphere of Object.keys(after) as SphereName[]) {
    const was = before?.[sphere];
    const now = after[sphere];
    // A new window opened ⇒ the old current closed, whether it was kept as
    // `previous` or dropped as too old.
    if (was && now && now.current.fromTick !== was.current.fromTick) out.push({ sphere, closed: was.current });
  }
  return out;
}

// ─── Seams ───────────────────────────────────────────────────────────

/**
 * A by-value copy of the pool, taken *before* a phase runs.
 *
 * Some phases move essence without returning a new pool: `phaseUnifiedActionProgress`
 * reassigns `state.essencePool` on the very state object the funnel handed it
 * (self-casts) and edits it in place (the elder-site reward). After such a phase
 * `prev.essencePool === next.essencePool` holds although the balance moved, so a
 * reference compare would file nothing. Twelve numbers per phase is the price of
 * seeing every mover.
 */
export function snapshotEssencePool(pool: EssencePool | undefined): EssencePool | undefined {
  return pool ? { ...pool } : undefined;
}

/**
 * The phase-merge seam (both funnels: `runInlinePhase` and
 * `runRegisteredPhases`, beside `applyEssenceEarned`). Pass `poolBefore` —
 * {@link snapshotEssencePool} taken before the phase ran — so an in-place move
 * is diffed by value; without it the seam falls back to `prev.essencePool`
 * and reference-compares. Emits one `essence_movement_roll` trace per sphere
 * whose window closed — never per phase. Fail-soft: cannot throw into the tick loop.
 */
export function applyEssenceMovement(
  prev: GameState,
  next: GameState,
  phaseId: string,
  poolBefore: EssencePool | undefined = prev.essencePool,
): GameState {
  if (poolBefore === next.essencePool) return next;
  const recorded = recordEssenceMovement(
    next.essenceMovement, poolBefore, next.essencePool, causeForPhase(phaseId), next.tick,
  );
  if (recorded === next.essenceMovement) return next;
  for (const { sphere, closed } of rolledWindows(next.essenceMovement, recorded)) {
    const parts = Object.entries(closed.byCause)
      .map(([c, v]) => `${(v as number) >= 0 ? '+' : ''}${(v as number).toFixed(1)} ${c}`)
      .join(', ');
    emitTrace({
      tick: next.tick,
      category: 'essence_movement_roll',
      summary: `${sphere}: ${parts || 'no movement'} over ${next.tick - closed.fromTick} ticks`,
      sphere,
      fromTick: closed.fromTick,
      byCause: { ...closed.byCause },
    });
  }
  return { ...next, essenceMovement: recorded };
}

/**
 * The out-of-tick seam: the movement record after a spend that replaced
 * `prev.essencePool` with `nextPool`. Pure — callers spread the result into the
 * same state update that writes the pool.
 */
export function withEssenceSpend(
  prev: Pick<GameState, 'essencePool' | 'essenceMovement' | 'tick'>,
  nextPool: EssencePool,
  cause: EssenceMovementCause,
): { essencePool: EssencePool; essenceMovement: EssenceMovementBySphere | undefined } {
  return {
    essencePool: nextPool,
    essenceMovement: recordEssenceMovement(prev.essenceMovement, prev.essencePool, nextPool, cause, prev.tick),
  };
}
