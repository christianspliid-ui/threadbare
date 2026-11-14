/**
 * THR-2208 — a bound mortal's deeds fill the Mandate (plan 2026-11-13-thr-2202, slice 1).
 *
 * - `mandateDeedCredit`: a base in a Mandate sphere, plus spend in the Mandate's spheres,
 *   scaled by band; a Doom-sphere-only spend credits 0.
 * - `mandateDeedForChapter`: only a threaded mortal's chapter credits, with one aftermath row.
 * - `phaseMandate` folds deed credits: the ledger rises, the one-day window reads Rising,
 *   and the Mandate block's last deeds list the line. The window empties a day later.
 * - The commit's per-sphere split (`spendNudgeEssence.bySphere`) sums across commits.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateRememberedMandate } from '../mandateGenerator';
import { createMandateStateWith } from '../mandate';
import { createDoomClockState } from '../doomClock';
import type { GameState } from '../../types/gameState';
import type { SphereAggregate } from '../../types/worldSoul';
import type { UnifiedAction } from '../../types/unifiedAction';
import {
  addMandateSphereSpend,
  deedBandOf,
  mandateDeedCredit,
  mandateDeedSpheres,
  mandateTrendOf,
  rollLedgerWindow,
} from '../mandateLedger';
import { mandateDeedForChapter } from '../unifiedActionResolution';
import { phaseMandate, resetMandateCounter } from '../phaseMandate';
import { selectMandateRow } from '../views/subjects/godSheet';
import { spendNudgeEssence } from '../../components/Game/encounter-stage/nudgeCommit';
import {
  MANDATE_BASELINE_SETTLE_TICK,
  MANDATE_DEED_BAND_FACTOR,
  MANDATE_DEED_BASE_POINTS,
  MANDATE_DEED_POINTS_PER_ESSENCE,
  MANDATE_TREND_WINDOW_TICKS,
} from '../../data/game-config';
import { MANDATE_CARD_HINT, MANDATE_TREND_WORD, mandateDeedLine } from '../../data/ascendant-bar-content';
import { INSPECTOR_WORDS } from '../../data/view-content';

function aggregate(): SphereAggregate {
  const base = 100;
  return {
    totalBySphere: {
      force: base, matter: base, energy: base, life: base, mind: base, spirit: base,
      time: base, entropy: base, order: base, chaos: base, light: base, darkness: base,
    },
    dominantSphere: 'mind',
    entityCount: 12,
  };
}

function makeState(opts: { threaded?: boolean } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael Thornweaver', properties: {} });
  if (opts.threaded !== false) graph.addEdge({ id: 'e1', source: 'asc', target: 'kael', type: 'thread', properties: {} } as never);
  const mandateDefinition = generateRememberedMandate({
    alignment: { primary: 'mind', secondary: 'spirit' },
    aggregate: aggregate(),
  });
  return {
    graph,
    ascendantId: 'asc',
    tick: 0,
    mandateDefinition,
    mandateState: createMandateStateWith(mandateDefinition.id, 0, {
      checkpointResults: [],
      counterOmensEarned: 0,
      doomSeverityPenalties: 0,
    }),
    tickEvents: [],
    pendingSpherePressures: [],
    doomClock: { ...createDoomClockState('breach', 200), currentTick: 0, progress: 0 },
    worldSoul: { aggregate: aggregate() },
  } as unknown as GameState;
}

function step(state: GameState, tick: number, extra: Partial<GameState> = {}): GameState {
  const at = { ...state, tick, ...extra } as GameState;
  return { ...at, ...phaseMandate(at) } as GameState;
}

function chapter(over: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_1',
    actorId: 'kael',
    templateId: 'enc.test',
    resolved: true,
    outcome: 'success',
    ...over,
  } as unknown as UnifiedAction;
}

describe('THR-2208 — mandateDeedCredit', () => {
  it('credits the base when the chapter is in a Mandate sphere, with nothing paid', () => {
    const credits = mandateDeedCredit({ actorId: 'kael', chapterSphere: 'mind', band: 'success', primary: 'mind', secondary: 'spirit' });
    expect(credits).toEqual([
      expect.objectContaining({ entityId: 'kael', sphere: 'mind', points: MANDATE_DEED_BASE_POINTS, cause: 'god', source: 'deed' }),
    ]);
  });

  it('adds the spend paid in each Mandate sphere, scaled by band', () => {
    const credits = mandateDeedCredit({
      actorId: 'kael', chapterSphere: 'mind', band: 'near_miss',
      mandateSphereSpend: { mind: 2, spirit: 3 }, primary: 'mind', secondary: 'spirit',
    });
    const f = MANDATE_DEED_BAND_FACTOR.near_miss;
    expect(credits.find(c => c.sphere === 'mind')?.points).toBeCloseTo((MANDATE_DEED_BASE_POINTS + 2 * MANDATE_DEED_POINTS_PER_ESSENCE) * f, 9);
    expect(credits.find(c => c.sphere === 'spirit')?.points).toBeCloseTo(3 * MANDATE_DEED_POINTS_PER_ESSENCE * f, 9);
  });

  it('a Doom-sphere-only spend credits 0', () => {
    const credits = mandateDeedCredit({
      actorId: 'kael', chapterSphere: 'entropy', band: 'critical_success',
      mandateSphereSpend: { entropy: 5 }, primary: 'mind', secondary: 'spirit',
    });
    expect(credits).toEqual([]);
  });

  it('every band credits something (the card hint is never an empty promise)', () => {
    for (const factor of Object.values(MANDATE_DEED_BAND_FACTOR)) expect(factor).toBeGreaterThan(0);
  });

  it('reads a chapter outcome as a band; a contest won is a success', () => {
    expect(deedBandOf('contested_won')).toBe('success');
    expect(deedBandOf('contested_lost')).toBe('failure');
    expect(deedBandOf(undefined)).toBe('failure');
    expect(deedBandOf('critical_success')).toBe('critical_success');
  });
});

describe('THR-2208 — mandateDeedForChapter', () => {
  it('a threaded mortal\'s closed chapter credits and says so in one aftermath row', () => {
    const state = makeState();
    const deed = mandateDeedForChapter(state, chapter({ mandateSphereSpend: { mind: 2 } }), { sphereAffinity: 'mind' }, 'Kael Thornweaver', 40);
    expect(deed?.credits[0]).toMatchObject({ sphere: 'mind', points: MANDATE_DEED_BASE_POINTS + 2 });
    expect(deed?.change.detail).toBe("Kael Thornweaver's deed raised your Mandate in Mind.");
    expect(deed?.change.detail).not.toMatch(/\d/);
  });

  it('an unthreaded mortal credits nothing', () => {
    const state = makeState({ threaded: false });
    expect(mandateDeedForChapter(state, chapter(), { sphereAffinity: 'mind' }, 'Kael', 40)).toBeUndefined();
    expect(mandateDeedSpheres(state, state.graph, 'kael').size).toBe(0);
  });

  it('a chapter outside the Mandate spheres with nothing paid credits nothing', () => {
    expect(mandateDeedForChapter(makeState(), chapter(), { sphereAffinity: 'force' }, 'Kael', 40)).toBeUndefined();
  });

  it('a chapter with no sphereAffinity still credits the spend part', () => {
    const deed = mandateDeedForChapter(makeState(), chapter({ mandateSphereSpend: { spirit: 1 } }), {}, 'Kael', 40);
    expect(deed?.credits).toEqual([expect.objectContaining({ sphere: 'spirit', points: 1 })]);
  });
});

describe('THR-2208 — the Mandate folds deeds and reads the last day', () => {
  beforeEach(() => resetMandateCounter());

  it('a deed raises the ledger, the word reads Rising, and the deed line is listed; a day later it Holds', () => {
    let state = step(makeState(), MANDATE_BASELINE_SETTLE_TICK);
    expect(selectMandateRow(state)?.trend).toBe('steady');

    const credits = mandateDeedCredit({ actorId: 'kael', chapterSphere: 'mind', band: 'success', primary: 'mind', secondary: 'spirit' });
    state = step(state, 40, { pendingMandateCredits: credits });
    expect(state.mandateState?.godLedger?.primary).toBeCloseTo(MANDATE_DEED_BASE_POINTS, 9);
    expect(state.mandateState?.recentLedgerDelta).toBeGreaterThan(0);
    const row = selectMandateRow(state)!;
    expect(row.trend).toBe('rising');
    expect(MANDATE_TREND_WORD[row.trend]).toBe('Rising');
    expect(INSPECTOR_WORDS.mandateTrend[row.trend]).toBe('Rising');
    expect(row.recentDeedLines).toEqual(["Kael Thornweaver's deed raised your Mandate in Mind."]);

    state = step(state, 40 + MANDATE_TREND_WINDOW_TICKS);
    expect(state.mandateState?.recentLedgerDelta).toBe(0);
    expect(selectMandateRow(state)?.trend).toBe('steady');
    // The deed stays listed after the window: it is history, not trend.
    expect(selectMandateRow(state)?.recentDeedLines).toHaveLength(1);
  });

  it('a strong deed reads "far"', () => {
    let state = step(makeState(), MANDATE_BASELINE_SETTLE_TICK);
    const credits = mandateDeedCredit({ actorId: 'kael', chapterSphere: 'mind', band: 'critical_success', mandateSphereSpend: { mind: 4 }, primary: 'mind', secondary: 'spirit' });
    state = step(state, 40, { pendingMandateCredits: credits });
    expect(selectMandateRow(state)?.recentDeedLines[0]).toBe("Kael Thornweaver's deed raised your Mandate far in Mind.");
  });
});

describe('THR-2208 — trend, window and lines', () => {
  it('the trend word sets match on the rail and the inspector', () => {
    for (const t of ['rising', 'steady', 'ebbing'] as const) {
      expect(MANDATE_TREND_WORD[t]).toBe(INSPECTOR_WORDS.mandateTrend[t]);
    }
  });

  it('rollLedgerWindow keeps one day of moves and sums them', () => {
    let w = rollLedgerWindow(undefined, 10, 2);
    w = rollLedgerWindow(w.moves, 15, -0.5);
    expect(w.delta).toBeCloseTo(1.5, 9);
    w = rollLedgerWindow(w.moves, 22, 0);
    expect(w.delta).toBeCloseTo(-0.5, 9);
    expect(mandateTrendOf(w.delta)).toBe('ebbing');
    expect(mandateTrendOf(undefined)).toBe('steady');
  });

  it('an empty mortal slot reads "A mortal bound to you"', () => {
    expect(mandateDeedLine(undefined, 'Mind', false)).toMatch(/^A mortal bound to you/);
    expect(mandateDeedLine('', 'Mind', false)).toMatch(/^A mortal bound to you/);
  });

  it('the card hint is the plan\'s exact text', () => {
    expect(MANDATE_CARD_HINT).toBe('Counts toward your Mandate.');
  });
});

describe('THR-2208 — the commit reports what each sphere paid', () => {
  const pool = { force: 0, matter: 0, energy: 0, life: 0, mind: 2, spirit: 5, time: 0, entropy: 3, order: 0, chaos: 0, light: 0, darkness: 0 };

  it('splits a gated card and a spilling common card by sphere', () => {
    const r = spendNudgeEssence(pool, [{ sphere: 'entropy', cost: 1 }, { sphere: undefined, cost: 3 }], 'mind', ['mind', 'spirit']);
    expect(r.ok).toBe(true);
    expect(r.bySphere).toEqual({ entropy: 1, mind: 2, spirit: 1 });
  });

  it('a rejection reports nothing paid', () => {
    expect(spendNudgeEssence(pool, [{ sphere: 'force', cost: 1 }], 'mind').bySphere).toEqual({});
  });

  it('commits sum on the chapter, and an empty hand writes nothing', () => {
    const once = addMandateSphereSpend(undefined, { mind: 2 });
    const twice = addMandateSphereSpend(once, { mind: 1, spirit: 1 });
    expect(twice).toEqual({ mind: 3, spirit: 1 });
    expect(addMandateSphereSpend(undefined, {})).toBeUndefined();
  });
});
