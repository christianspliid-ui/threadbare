/**
 * THR-1713 — the essence movement record (plan D3, Done-when 2).
 *
 * (a) a phase diff is filed under `causeForPhase(phaseId)`, rolls at the window,
 *     and keeps `previous`;
 * (b) the out-of-tick spend sites leave a negative `spend_nudge` / `spend_cast`
 *     entry equal to the amount spent;
 * (c) pools that never change leave the record reference-equal.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ESSENCE_MOVEMENT_WINDOW_TICKS,
  ESSENCE_MOVEMENT_TOP_CAUSES,
  ESSENCE_TREND_STEADY_EPSILON,
  applyEssenceMovement,
  causeForPhase,
  readEssenceMovement,
  recordEssenceMovement,
  withEssenceSpend,
  snapshotEssencePool,
} from '../essenceMovement';
import { commitPlayerCast, type PreparedPlayerCast } from '../playerCastDispatch';
import { spendNudgeEssence, spendAuthoredChoiceEssence } from '../../components/Game/encounter-stage/nudgeCommit';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import { SPHERE_NAMES } from '../../types';
import type { EssencePool } from '../../types/influence';
import type { GameState } from '../../types/gameState';

function pool(overrides: Partial<EssencePool> = {}): EssencePool {
  const p = Object.fromEntries(SPHERE_NAMES.map((s) => [s, 50])) as EssencePool;
  return { ...p, ...overrides };
}

function state(overrides: Partial<GameState> = {}): GameState {
  return { tick: 10, essencePool: pool(), tickEvents: [], unifiedActions: [], ...overrides } as unknown as GameState;
}

describe('causeForPhase', () => {
  it('maps the six named phases and files everything else as other', () => {
    expect(causeForPhase('essence')).toBe('income');
    expect(causeForPhase('essence_sources')).toBe('places');
    expect(causeForPhase('influence_maintenance')).toBe('upkeep');
    expect(causeForPhase('control_effects')).toBe('sustained');
    expect(causeForPhase('divine_premonition')).toBe('premonition');
    expect(causeForPhase('unified_action_progress')).toBe('acts');
    // Measured on a 150-tick run: the delve phases were the one unmapped mover.
    expect(causeForPhase('delve_emergence')).toBe('ruins');
    expect(causeForPhase('rival_actions')).toBe('other');
  });
});

describe('recordEssenceMovement — (a) attribution and rolling', () => {
  it('files a phase diff under its cause, per sphere, signed', () => {
    const rec = recordEssenceMovement(undefined, pool(), pool({ mind: 53, matter: 48 }), causeForPhase('essence'), 5);
    expect(rec?.mind?.current).toEqual({ fromTick: 5, byCause: { income: 3 } });
    expect(rec?.matter?.current.byCause).toEqual({ income: -2 });
    expect(rec?.force).toBeUndefined();
  });

  it('accumulates within a window and rolls at ESSENCE_MOVEMENT_WINDOW_TICKS, keeping previous', () => {
    let rec = recordEssenceMovement(undefined, pool(), pool({ mind: 52 }), 'income', 0);
    rec = recordEssenceMovement(rec, pool(), pool({ mind: 49 }), 'upkeep', 40);
    expect(rec?.mind?.current.byCause).toEqual({ income: 2, upkeep: -1 });
    expect(rec?.mind?.previous).toBeUndefined();

    const closed = rec!.mind!.current;
    rec = recordEssenceMovement(rec, pool(), pool({ mind: 51 }), 'income', ESSENCE_MOVEMENT_WINDOW_TICKS);
    expect(rec?.mind?.previous).toBe(closed);
    expect(rec?.mind?.current).toEqual({ fromTick: ESSENCE_MOVEMENT_WINDOW_TICKS, byCause: { income: 1 } });
  });

  it('drops a closing window older than two windows instead of keeping it as previous', () => {
    // +40 at tick 0, then a long quiet spell at the cap, then a spend at tick 300.
    let rec = recordEssenceMovement(undefined, pool(), pool({ mind: 90 }), 'income', 0);
    rec = recordEssenceMovement(rec, pool(), pool({ mind: 45 }), 'spend_nudge', 3 * ESSENCE_MOVEMENT_WINDOW_TICKS);
    expect(rec?.mind?.previous).toBeUndefined();
    const r = readEssenceMovement(rec!.mind, 3 * ESSENCE_MOVEMENT_WINDOW_TICKS + 1);
    expect(r.trend).toBe('ebbing');
    expect(r.feeds).toEqual([]);
  });

  it('(c) returns the same reference when no pool moved', () => {
    const rec = recordEssenceMovement(undefined, pool(), pool({ mind: 51 }), 'income', 1);
    const p = pool();
    expect(recordEssenceMovement(rec, p, p, 'income', 2)).toBe(rec);
    expect(recordEssenceMovement(rec, pool(), pool(), 'income', 2)).toBe(rec);
    expect(recordEssenceMovement(rec, undefined, pool(), 'income', 2)).toBe(rec);
  });

  it('skips a non-finite diff and keeps the last good state (fail-soft)', () => {
    const rec = recordEssenceMovement(undefined, pool(), pool({ mind: 51 }), 'income', 1);
    const next = recordEssenceMovement(rec, pool(), pool({ mind: Number.NaN }), 'income', 2);
    expect(next).toBe(rec);
  });
});

describe('readEssenceMovement — the row reading', () => {
  it('reads Steady with no causes when the record is absent', () => {
    expect(readEssenceMovement(undefined)).toEqual({ trend: 'steady', feeds: [], draws: [] });
  });

  it('gives the trend from the net and names feeds and draws by magnitude', () => {
    let rec = recordEssenceMovement(undefined, pool(), pool({ mind: 56 }), 'income', 0);
    rec = recordEssenceMovement(rec, pool(), pool({ mind: 48 }), 'upkeep', 1);
    rec = recordEssenceMovement(rec, pool(), pool({ mind: 51 }), 'places', 2);
    rec = recordEssenceMovement(rec, pool(), pool({ mind: 49.5 }), 'spend_nudge', 3);
    const r = readEssenceMovement(rec!.mind);
    expect(r.trend).toBe('rising'); // 6 - 2 + 1 - 0.5 = 4.5
    expect(r.feeds).toEqual(['income', 'places']);
    expect(r.draws).toEqual(['upkeep', 'spend_nudge']);
    expect(r.feeds.length).toBeLessThanOrEqual(ESSENCE_MOVEMENT_TOP_CAUSES);
  });

  it('reads Ebbing on a net drain and Steady inside the epsilon', () => {
    const drained = recordEssenceMovement(undefined, pool(), pool({ mind: 45 }), 'upkeep', 0);
    expect(readEssenceMovement(drained!.mind).trend).toBe('ebbing');
    const flat = recordEssenceMovement(undefined, pool(), pool({ mind: 50 + ESSENCE_TREND_STEADY_EPSILON / 2 }), 'income', 0);
    expect(readEssenceMovement(flat!.mind).trend).toBe('steady');
  });

  it('sums previous and current, and drops windows too old to be "lately"', () => {
    let rec = recordEssenceMovement(undefined, pool(), pool({ mind: 55 }), 'income', 0);
    rec = recordEssenceMovement(rec, pool(), pool({ mind: 47 }), 'upkeep', ESSENCE_MOVEMENT_WINDOW_TICKS);
    // Both windows inside the reading: +5 − 3 = +2.
    expect(readEssenceMovement(rec!.mind, ESSENCE_MOVEMENT_WINDOW_TICKS + 1).trend).toBe('rising');
    // A window later, the previous one has aged out: only −3 is left.
    expect(readEssenceMovement(rec!.mind, 2 * ESSENCE_MOVEMENT_WINDOW_TICKS).trend).toBe('ebbing');
    // Two windows on, nothing is "lately".
    expect(readEssenceMovement(rec!.mind, 3 * ESSENCE_MOVEMENT_WINDOW_TICKS).trend).toBe('steady');
  });
});

describe('(b) out-of-tick spend sites file a negative spend equal to the amount spent', () => {
  it('a played hand (spendNudgeEssence → withEssenceSpend)', () => {
    const prev = state();
    const spend = spendNudgeEssence(prev.essencePool, [{ sphere: undefined, cost: 3 }], 'mind');
    expect(spend.ok).toBe(true);
    const next = withEssenceSpend(prev, spend.pool, 'spend_nudge');
    expect(next.essencePool).toBe(spend.pool);
    expect(next.essenceMovement?.mind?.current.byCause).toEqual({ spend_nudge: -3 });
  });

  it('an authored choice (spendAuthoredChoiceEssence → withEssenceSpend)', () => {
    const prev = state();
    const spend = spendAuthoredChoiceEssence(prev.essencePool, 4, 'force');
    expect(spend.ok).toBe(true);
    const next = withEssenceSpend(prev, spend.pool, 'spend_nudge');
    expect(next.essenceMovement?.force?.current.byCause).toEqual({ spend_nudge: -4 });
  });

  it('a cast (commitPlayerCast)', () => {
    const cast = {
      essenceCost: 2,
      sphere: 'spirit',
      action: { actionId: 'a1' },
    } as unknown as PreparedPlayerCast;
    const next = commitPlayerCast(state(), { cast });
    expect(next.essencePool.spirit).toBe(48);
    expect(next.essenceMovement?.spirit?.current.byCause).toEqual({ spend_cast: -2 });
  });
});

describe('applyEssenceMovement — the phase-merge seam', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  it('returns next untouched when the phase left the pool alone', () => {
    const s = state();
    const next = { ...s };
    expect(applyEssenceMovement(s, next, 'essence')).toBe(next);
  });

  it('sees a phase that moves the pool on the state object itself (in place)', () => {
    // `phaseUnifiedActionProgress` reassigns / edits `state.essencePool` on the
    // very object the funnel passed in, so prev and next share the new pool.
    const s = state({ tick: 3 });
    const before = snapshotEssencePool(s.essencePool);
    s.essencePool.mind += 4; // in place, the elder-site reward's shape
    const merged = { ...s };
    expect(merged.essencePool).toBe(s.essencePool); // premise: a reference compare is blind
    const next = applyEssenceMovement(s, merged, 'unified_action_progress', before);
    expect(next.essenceMovement?.mind?.current.byCause).toEqual({ acts: 4 });
  });

  it('a by-value snapshot of an unmoved pool records nothing and returns next untouched', () => {
    const s = state();
    const next = { ...s };
    expect(applyEssenceMovement(s, next, 'essence', snapshotEssencePool(s.essencePool))).toBe(next);
  });

  it('still traces the close of a window dropped as too old', () => {
    const s0 = state({ tick: 0 });
    const s1 = applyEssenceMovement(s0, { ...s0, essencePool: pool({ mind: 52 }) }, 'essence');
    const s2base = { ...s1, tick: 5 * ESSENCE_MOVEMENT_WINDOW_TICKS };
    applyEssenceMovement(s2base, { ...s2base, essencePool: pool({ mind: 51 }) }, 'influence_maintenance');
    const rolls = getTraces().filter((t) => t.category === 'essence_movement_roll');
    expect(rolls).toHaveLength(1);
    expect(rolls[0]).toMatchObject({ sphere: 'mind', fromTick: 0, byCause: { income: 2 } });
  });

  it('records under the phase cause, and traces once per sphere when a window rolls', () => {
    const s0 = state({ tick: 0 });
    const s1 = applyEssenceMovement(s0, { ...s0, essencePool: pool({ mind: 52 }) }, 'essence');
    expect(s1.essenceMovement?.mind?.current.byCause).toEqual({ income: 2 });
    expect(getTraces().filter((t) => t.category === 'essence_movement_roll')).toHaveLength(0);

    const s2base = { ...s1, tick: ESSENCE_MOVEMENT_WINDOW_TICKS };
    const s2 = applyEssenceMovement(s2base, { ...s2base, essencePool: pool({ mind: 51 }) }, 'influence_maintenance');
    expect(s2.essenceMovement?.mind?.previous?.byCause).toEqual({ income: 2 });
    const rolls = getTraces().filter((t) => t.category === 'essence_movement_roll');
    expect(rolls).toHaveLength(1);
    expect(rolls[0]).toMatchObject({ sphere: 'mind', fromTick: 0, byCause: { income: 2 } });
  });
});
