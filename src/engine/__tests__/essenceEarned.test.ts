/**
 * Sphere attunement — the essence-earned counter and the unlock it gates. THR-1180.
 *
 * Two halves, deliberately tested against literals rather than against the
 * constants the production code reads. `SPHERE_ATTUNEMENT_THRESHOLDS` appearing
 * on both sides of an assertion would make the threshold rows a tautology — the
 * test would pass for any table, including an empty one. So the arithmetic is
 * pinned with hand-written marks, and the *table itself* is checked separately:
 * ascending, non-empty, and naming every mark the library's members ask for.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { EssencePool } from '../../types/influence';
import type { SphereName } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import { SPHERE_ATTUNEMENT_THRESHOLDS } from '../../data/nudge-constants';
import { NUDGE_CARD_LIBRARY } from '../../data/nudge-card-library';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import {
  accrueEssenceEarned,
  applyEssenceEarned,
  attunementThresholdsCrossed,
  essenceEarnedIn,
} from '../essenceEarned';
import {
  attunementMemberIdsAt,
  buildRepertoire,
  isMemberUnlocked,
  resetRepertoireWarnings,
  validateRepertoire,
} from '../nudgeCardRepertoire';

function pool(overrides: Partial<Record<SphereName, number>> = {}): EssencePool {
  const p = {} as EssencePool;
  for (const s of SPHERE_NAMES) p[s] = overrides[s] ?? 0;
  return p;
}

beforeEach(() => {
  resetRepertoireWarnings();
});

// ─── The counter ─────────────────────────────────────────────────────

describe('essence-earned accrual', () => {
  it('banks a rise and returns a new counter', () => {
    const next = accrueEssenceEarned(undefined, pool({ chaos: 4 }), pool({ chaos: 11 }));
    expect(essenceEarnedIn(next, 'chaos')).toBe(7);
  });

  it('never decrements on a spend — the pool falls, the counter holds', () => {
    const afterEarning = accrueEssenceEarned(undefined, pool(), pool({ chaos: 30 }));
    expect(essenceEarnedIn(afterEarning, 'chaos')).toBe(30);

    // Spend 25 of the 30. Earned is a lifetime reading, not a balance.
    const afterSpending = accrueEssenceEarned(
      afterEarning,
      pool({ chaos: 30 }),
      pool({ chaos: 5 }),
    );
    expect(essenceEarnedIn(afterSpending, 'chaos')).toBe(30);
  });

  it('accumulates across many phases rather than overwriting', () => {
    let counter = accrueEssenceEarned(undefined, pool(), pool({ light: 3 }));
    counter = accrueEssenceEarned(counter, pool({ light: 3 }), pool({ light: 8 }));
    counter = accrueEssenceEarned(counter, pool({ light: 8 }), pool({ light: 9 }));
    expect(essenceEarnedIn(counter, 'light')).toBe(9);
  });

  it('returns the SAME reference when nothing rose — the phase-skip fast path', () => {
    // Not merely "equal": the seam reference-compares to decide whether to
    // rebuild state, so a fresh-but-identical object would silently make every
    // phase of every tick allocate a new GameState.
    const counter = { chaos: 5 };
    const unchanged = accrueEssenceEarned(counter, pool({ chaos: 2 }), pool({ chaos: 2 }));
    expect(unchanged).toBe(counter);

    const spent = accrueEssenceEarned(counter, pool({ chaos: 9 }), pool({ chaos: 1 }));
    expect(spent).toBe(counter);
  });

  it('leaves the counter alone when either pool is absent', () => {
    const counter = { chaos: 5 };
    expect(accrueEssenceEarned(counter, undefined, pool({ chaos: 40 }))).toBe(counter);
    expect(accrueEssenceEarned(counter, pool({ chaos: 40 }), undefined)).toBe(counter);
  });

  it('drops a NaN pool rather than poisoning the counter', () => {
    // `tickHealthMonitor` watches the pool for exactly this shape. A NaN that
    // reached the counter would be permanent — nothing ever decrements it back.
    const poisoned = pool({ chaos: 10 });
    poisoned.chaos = Number.NaN;
    const next = accrueEssenceEarned({ chaos: 5 }, pool(), poisoned);
    expect(essenceEarnedIn(next, 'chaos')).toBe(5);
  });

  it('absent counter reads as zero in every sphere', () => {
    for (const s of SPHERE_NAMES) expect(essenceEarnedIn(undefined, s)).toBe(0);
    expect(essenceEarnedIn({}, 'chaos')).toBe(0);
  });
});

// ─── Crossings ───────────────────────────────────────────────────────

describe('attunement threshold crossings', () => {
  it('reports a mark on the step that reaches it', () => {
    expect(attunementThresholdsCrossed({ chaos: 18 }, { chaos: 21 }, [20])).toEqual([
      { sphere: 'chaos', threshold: 20 },
    ]);
  });

  it('reports a mark landed on exactly — the window is half-open', () => {
    expect(attunementThresholdsCrossed({ chaos: 19 }, { chaos: 20 }, [20])).toEqual([
      { sphere: 'chaos', threshold: 20 },
    ]);
  });

  it('does NOT report a mark already behind — one trace per crossing, ever', () => {
    expect(attunementThresholdsCrossed({ chaos: 20 }, { chaos: 55 }, [20])).toEqual([]);
    expect(attunementThresholdsCrossed({ chaos: 40 }, { chaos: 41 }, [20])).toEqual([]);
  });

  it('reports both marks when one step vaults them', () => {
    expect(attunementThresholdsCrossed({ chaos: 0 }, { chaos: 100 }, [20, 60])).toEqual([
      { sphere: 'chaos', threshold: 20 },
      { sphere: 'chaos', threshold: 60 },
    ]);
  });

  it('reports nothing with an empty threshold table', () => {
    // Fail-soft row: an empty table means no attunement unlocks, not a throw.
    expect(attunementThresholdsCrossed({ chaos: 0 }, { chaos: 1000 }, [])).toEqual([]);
  });

  it('keeps spheres independent', () => {
    const crossings = attunementThresholdsCrossed(
      { chaos: 19, light: 19 },
      { chaos: 25, light: 19 },
      [20],
    );
    expect(crossings).toEqual([{ sphere: 'chaos', threshold: 20 }]);
  });
});

// ─── The constants table ─────────────────────────────────────────────

describe('SPHERE_ATTUNEMENT_THRESHOLDS', () => {
  it('is non-empty and strictly ascending', () => {
    // Ascending is assumed by the crossing scan; an out-of-order table would
    // report a mark twice on a single vault.
    expect(SPHERE_ATTUNEMENT_THRESHOLDS.length).toBeGreaterThan(0);
    for (let i = 1; i < SPHERE_ATTUNEMENT_THRESHOLDS.length; i++) {
      expect(SPHERE_ATTUNEMENT_THRESHOLDS[i]).toBeGreaterThan(
        SPHERE_ATTUNEMENT_THRESHOLDS[i - 1]!,
      );
    }
  });

  it('every mark has at least one member gated on it — no inert table row', () => {
    // The live-layer rule, applied to the table rather than the kind: a mark
    // nothing is waiting on fires a trace nobody can act on.
    for (const mark of SPHERE_ATTUNEMENT_THRESHOLDS) {
      const gated = NUDGE_CARD_LIBRARY.filter(
        (m) => m.unlock?.kind === 'sphere_attunement' && m.unlock.threshold === mark,
      );
      expect(gated.length, `no member gated on mark ${mark}`).toBeGreaterThan(0);
    }
  });

  it('no member asks for a mark the table does not contain', () => {
    // `threshold` is a plain `number`, so nothing but this check stands between
    // a typo and a card that can never unlock. The liveness sweep owns it.
    expect(validateRepertoire().unreachableAttunementMembers).toEqual([]);
  });
});

// ─── The unlock ──────────────────────────────────────────────────────

describe('sphere_attunement unlock', () => {
  const member = {
    id: 'card.test.attunement',
    typeId: 'gambit' as const,
    sphere: 'chaos' as const,
    unlock: { kind: 'sphere_attunement' as const, sphere: 'chaos' as const, threshold: 20 },
  };

  it('locks below the mark, unlocks at and above it', () => {
    expect(isMemberUnlocked(member, { essenceEarnedBySphere: { chaos: 19 } })).toBe(false);
    expect(isMemberUnlocked(member, { essenceEarnedBySphere: { chaos: 20 } })).toBe(true);
    expect(isMemberUnlocked(member, { essenceEarnedBySphere: { chaos: 999 } })).toBe(true);
  });

  it('locks with the counter absent — a legacy save does not fall open', () => {
    expect(isMemberUnlocked(member, {})).toBe(false);
    expect(isMemberUnlocked(member, { essenceEarnedBySphere: {} })).toBe(false);
  });

  it('reads only its own sphere', () => {
    expect(
      isMemberUnlocked(member, { essenceEarnedBySphere: { light: 500, darkness: 500 } }),
    ).toBe(false);
  });
});

// ─── Identity floor unchanged ────────────────────────────────────────

describe('attunement deepens, it does not re-key', () => {
  const ATTUNED_TO_EVERYTHING: Partial<Record<SphereName, number>> = Object.fromEntries(
    SPHERE_NAMES.map((s) => [s, 10_000]),
  );

  it('a god fully attuned to a sphere they do NOT hold gains nothing from it', () => {
    // THR-870's pivot stays parked: the sphere identity is still the door.
    // Falsification arm — if `memberAccess` stopped running before the unlock,
    // these ids would appear and this assertion is the only thing that notices.
    const held = buildRepertoire({
      primary: 'order',
      secondary: 'matter',
      essenceEarnedBySphere: ATTUNED_TO_EVERYTHING,
    }).map((e) => e.member.id);

    const offSphere = NUDGE_CARD_LIBRARY.filter(
      (m) =>
        m.unlock?.kind === 'sphere_attunement' &&
        m.sphere !== undefined &&
        m.sphere !== 'order' &&
        m.sphere !== 'matter',
    ).map((m) => m.id);

    expect(offSphere.length, 'no off-sphere attunement member to falsify with').toBeGreaterThan(
      0,
    );
    for (const id of offSphere) expect(held).not.toContain(id);
  });

  it('a god who holds the sphere gains the member only after the practice', () => {
    const chaosMembers = NUDGE_CARD_LIBRARY.filter(
      (m) => m.unlock?.kind === 'sphere_attunement' && m.sphere === 'chaos',
    );
    expect(chaosMembers.length).toBeGreaterThan(0);
    const mark = (chaosMembers[0]!.unlock as { threshold: number }).threshold;

    const before = buildRepertoire({
      primary: 'chaos',
      essenceEarnedBySphere: { chaos: mark - 1 },
    }).map((e) => e.member.id);
    const after = buildRepertoire({
      primary: 'chaos',
      essenceEarnedBySphere: { chaos: mark },
    }).map((e) => e.member.id);

    for (const m of chaosMembers) {
      expect(before, `${m.id} arrived early`).not.toContain(m.id);
      expect(after, `${m.id} never arrived`).toContain(m.id);
    }
    // Deepening, not re-keying: crossing a mark only ever ADDS.
    expect(after).toEqual(expect.arrayContaining(before));
  });

  it('an unattuned god still holds a full universal-core hand', () => {
    // The floor guarantee: attunement gates nothing the god already had. Asserted
    // by membership rather than by `access !== 'locked'` — since THR-1180 the
    // entry type is `HeldCardAccess`, so that comparison is a compile error, and
    // a runtime check for a state the type excludes was never evidence anyway.
    const held = new Set(buildRepertoire({ primary: 'chaos' }).map((e) => e.member.id));
    const core = NUDGE_CARD_LIBRARY.filter((m) => m.id.endsWith('.core')).map((m) => m.id);
    expect(core.length).toBeGreaterThan(0);
    for (const id of core) expect(held, `${id} missing from an unattuned hand`).toContain(id);
  });

  it('an attunement member reports its provenance as sphere_attunement, not signature', () => {
    // Both facts are true of the member (it is sphere-signed AND attunement
    // -gated); the one a surface has to explain is how it was *earned*.
    const entries = buildRepertoire({
      primary: 'chaos',
      essenceEarnedBySphere: ATTUNED_TO_EVERYTHING,
    });
    const attuned = entries.filter((e) => e.member.unlock?.kind === 'sphere_attunement');
    expect(attuned.length).toBeGreaterThan(0);
    for (const e of attuned) expect(e.source, e.member.id).toBe('sphere_attunement');
  });
});

// ─── Trace payload ───────────────────────────────────────────────────

describe('attunementMemberIdsAt', () => {
  it('names exactly the members gated on that (sphere, mark) pair', () => {
    const chaos = NUDGE_CARD_LIBRARY.filter(
      (m) => m.unlock?.kind === 'sphere_attunement' && m.unlock.sphere === 'chaos',
    );
    expect(chaos.length).toBeGreaterThan(0);
    const mark = (chaos[0]!.unlock as { threshold: number }).threshold;
    const named = attunementMemberIdsAt('chaos', mark);
    expect(named).toEqual(
      chaos.filter((m) => (m.unlock as { threshold: number }).threshold === mark).map((m) => m.id),
    );
  });

  it('returns empty for a mark nothing is gated on, rather than throwing', () => {
    expect(attunementMemberIdsAt('chaos', 999_999)).toEqual([]);
  });
});

// ─── Determinism ─────────────────────────────────────────────────────

describe('determinism', () => {
  it('same counter ⇒ same repertoire, every time', () => {
    const context = {
      primary: 'chaos' as const,
      secondary: 'light' as const,
      essenceEarnedBySphere: { chaos: 25, light: 61 },
    };
    expect(buildRepertoire(context).map((e) => e.member.id)).toEqual(
      buildRepertoire(context).map((e) => e.member.id),
    );
  });

  it('the same pool history accrues to the same counter regardless of step size', () => {
    // One 30-point phase and thirty 1-point phases must agree, or "same seed ⇒
    // same unlock tick" holds only for runs that happen to phase identically.
    let stepwise: Partial<Record<SphereName, number>> | undefined;
    for (let i = 0; i < 30; i++) {
      stepwise = accrueEssenceEarned(stepwise, pool({ chaos: i }), pool({ chaos: i + 1 }));
    }
    const oneShot = accrueEssenceEarned(undefined, pool(), pool({ chaos: 30 }));
    expect(essenceEarnedIn(stepwise, 'chaos')).toBe(essenceEarnedIn(oneShot, 'chaos'));
  });
});

// ─── The seam ────────────────────────────────────────────────────────

/**
 * A `GameState` stub carrying only what the seam reads. Cast rather than built:
 * a real one needs a world, and every field this touches is asserted below, so
 * an invented member could not hide here (the `as T`-on-a-fixture trap).
 */
function stateWith(
  essencePool: EssencePool,
  essenceEarnedBySphere?: Partial<Record<SphereName, number>>,
): GameState {
  return { tick: 7, essencePool, essenceEarnedBySphere } as unknown as GameState;
}

describe('applyEssenceEarned — the phase-merge seam', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  it('returns the SAME state object when the phase left the pool alone', () => {
    // The fast path every phase of every tick takes. Identity, not equality:
    // a fresh object here would mean ~40 pointless GameState allocations a tick.
    const p = pool({ chaos: 5 });
    const next = stateWith(p);
    expect(applyEssenceEarned(stateWith(p), next)).toBe(next);
  });

  it('banks the rise onto the returned state', () => {
    const out = applyEssenceEarned(stateWith(pool({ chaos: 2 })), stateWith(pool({ chaos: 9 })));
    expect(out.essenceEarnedBySphere?.chaos).toBe(7);
  });

  it('emits exactly one trace per crossing, carrying the members it unlocks', () => {
    applyEssenceEarned(
      stateWith(pool({ chaos: 0 })),
      stateWith(pool({ chaos: 25 }), { chaos: 0 }),
    );
    const traces = getTraces().filter((t) => t.category === 'nudge_attunement_unlock');
    expect(traces).toHaveLength(1);
    const trace = traces[0] as unknown as {
      sphere: string;
      threshold: number;
      unlockedCardIds: string[];
      earnedTotal: number;
    };
    expect(trace.sphere).toBe('chaos');
    expect(trace.threshold).toBe(20);
    expect(trace.earnedTotal).toBe(25);
    expect(trace.unlockedCardIds).toEqual([...attunementMemberIdsAt('chaos', 20)]);
    expect(trace.unlockedCardIds.length).toBeGreaterThan(0);
  });

  it('does not re-emit a mark already behind', () => {
    // Same mark, two consecutive phases past it. The second must be silent, or
    // the trace is a level reading rather than a progression log.
    let s = applyEssenceEarned(stateWith(pool({ chaos: 0 })), stateWith(pool({ chaos: 25 })));
    clearTraces();
    applyEssenceEarned(
      stateWith(pool({ chaos: 25 }), s.essenceEarnedBySphere),
      stateWith(pool({ chaos: 40 }), s.essenceEarnedBySphere),
    );
    expect(getTraces().filter((t) => t.category === 'nudge_attunement_unlock')).toHaveLength(0);
  });

  it('emits nothing on a spend, however large', () => {
    applyEssenceEarned(
      stateWith(pool({ chaos: 90 }), { chaos: 90 }),
      stateWith(pool({ chaos: 0 }), { chaos: 90 }),
    );
    expect(getTraces().filter((t) => t.category === 'nudge_attunement_unlock')).toHaveLength(0);
  });
});
