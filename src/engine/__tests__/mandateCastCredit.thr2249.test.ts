/**
 * THR-2249 — a place the god tends fills the Mandate by what it cost (plan
 * 2026-11-19-thr-2245, Decisions 3–4).
 *
 * - `mandateCastCredit`: essence × MANDATE_CAST_POINTS_PER_ESSENCE × band factor on the
 *   cast's sphere when it is a Mandate sphere; nothing for another sphere, or for zero /
 *   non-finite essence.
 * - `mandateCastForPlace`: only the ascendant's own player cast on a place credits, with
 *   one aftermath row in words.
 * - `phaseMandate` folds the credit once: the ledger rises by it, it is keyed to the
 *   place, and the next tick adds nothing more. A cast never joins the mortals' deed list.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateRememberedMandate } from '../mandateGenerator';
import { createMandateStateWith } from '../mandate';
import { createDoomClockState } from '../doomClock';
import type { GameState } from '../../types/gameState';
import type { SphereAggregate } from '../../types/worldSoul';
import type { UnifiedAction } from '../../types/unifiedAction';
import { heldKey, mandateCastCredit } from '../mandateLedger';
import { mandateCastForPlace, mandateDeedForChapter } from '../unifiedActionResolution';
import { phaseMandate, resetMandateCounter } from '../phaseMandate';
import {
  MANDATE_BASELINE_SETTLE_TICK,
  MANDATE_CAST_POINTS_PER_ESSENCE,
  MANDATE_DEED_BAND_FACTOR,
} from '../../data/game-config';
import { MANDATE_CAST_PLACE_FALLBACK, MANDATE_DEED_TITLE, mandateCastDeedLine } from '../../data/ascendant-bar-content';

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

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael Thornweaver', properties: {} });
  graph.addNode({ id: 'town', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town' } });
  graph.addNode({ id: 'shrine', type: 'location', name: 'Shrine of Ash', properties: { parentLocationId: 'town' } });
  graph.addNode({ id: 'nameless', type: 'location', name: '', properties: {} });
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

function cast(over: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_cast',
    actorId: 'asc',
    templateId: 'divine.test_place',
    targetId: 'shrine',
    source: 'player',
    essencePaid: 3,
    resolved: true,
    outcome: 'success',
    ...over,
  } as unknown as UnifiedAction;
}

describe('THR-2249 — mandateCastCredit', () => {
  const base = { targetId: 'shrine', primary: 'mind', secondary: 'spirit' } as const;

  it('credits essence × per-essence × band factor on a Mandate sphere, keyed to the place', () => {
    for (const band of Object.keys(MANDATE_DEED_BAND_FACTOR) as (keyof typeof MANDATE_DEED_BAND_FACTOR)[]) {
      const credits = mandateCastCredit({ ...base, sphere: 'spirit', essencePaid: 4, band });
      expect(credits).toEqual([{
        entityId: 'shrine', sphere: 'spirit', cause: 'god', sources: ['divine_action'], source: 'cast',
        points: 4 * MANDATE_CAST_POINTS_PER_ESSENCE * MANDATE_DEED_BAND_FACTOR[band],
      }]);
    }
    const crit = mandateCastCredit({ ...base, sphere: 'mind', essencePaid: 2, band: 'critical_success' })[0].points;
    const cost = mandateCastCredit({ ...base, sphere: 'mind', essencePaid: 2, band: 'success_at_cost' })[0].points;
    expect(crit).toBeGreaterThan(cost);
  });

  it('a sphere outside the Mandate gets nothing', () => {
    expect(mandateCastCredit({ ...base, sphere: 'force', essencePaid: 4, band: 'success' })).toEqual([]);
    expect(mandateCastCredit({ ...base, essencePaid: 4, band: 'success' })).toEqual([]);
  });

  it('zero, negative or non-finite essence gets nothing', () => {
    for (const essencePaid of [0, -2, Number.NaN, Number.POSITIVE_INFINITY, undefined]) {
      expect(mandateCastCredit({ ...base, sphere: 'mind', essencePaid, band: 'success' })).toEqual([]);
    }
  });
});

describe('THR-2249 — mandateCastForPlace', () => {
  it('the god\'s cast on a sublocation credits and says so in one aftermath row', () => {
    const out = mandateCastForPlace(makeState(), cast(), { sphereAffinity: 'mind' }, 40);
    expect(out?.credits).toEqual([expect.objectContaining({ entityId: 'shrine', sphere: 'mind', points: 3, source: 'cast' })]);
    expect(out?.change.title).toBe(MANDATE_DEED_TITLE);
    expect(out?.change.detail).toBe('Your hand on Shrine of Ash raised your Mandate in Mind.');
    expect(out?.change.detail).not.toMatch(/\d/);
  });

  it('credits the sphere the cast was charged from, so a card with no sphere of its own counts', () => {
    // Claim Dominion has no sphereAffinity and pays from the god's primary.
    const out = mandateCastForPlace(makeState(), cast({ castSphere: 'mind' }), {}, 40);
    expect(out?.credits[0]).toMatchObject({ entityId: 'shrine', sphere: 'mind', points: 3 });
    expect(mandateCastForPlace(makeState(), cast(), {}, 40)).toBeUndefined();
    expect(mandateCastForPlace(makeState(), cast({ castSphere: 'force' }), { sphereAffinity: 'mind' }, 40)).toBeUndefined();
  });

  it('a place-tier location counts as a place too', () => {
    const out = mandateCastForPlace(makeState(), cast({ targetId: 'town' }), { sphereAffinity: 'spirit' }, 40);
    expect(out?.credits[0]).toMatchObject({ entityId: 'town', sphere: 'spirit' });
  });

  it('a nameless place reads the fallback', () => {
    const out = mandateCastForPlace(makeState(), cast({ targetId: 'nameless' }), { sphereAffinity: 'mind' }, 40);
    expect(out?.change.detail).toBe(`Your hand on ${MANDATE_CAST_PLACE_FALLBACK} raised your Mandate in Mind.`);
    expect(mandateCastDeedLine('  ', 'Order')).toBe('Your hand on a place you hold raised your Mandate in Order.');
  });

  it('credits nothing for a mortal target, a missing target, a non-player source, or another actor', () => {
    const s = makeState();
    expect(mandateCastForPlace(s, cast({ targetId: 'kael' }), { sphereAffinity: 'mind' }, 40)).toBeUndefined();
    expect(mandateCastForPlace(s, cast({ targetId: 'gone' }), { sphereAffinity: 'mind' }, 40)).toBeUndefined();
    expect(mandateCastForPlace(s, cast({ source: 'agent' as never }), { sphereAffinity: 'mind' }, 40)).toBeUndefined();
    expect(mandateCastForPlace(s, cast({ actorId: 'kael' }), { sphereAffinity: 'mind' }, 40)).toBeUndefined();
  });

  it('credits nothing outside the Mandate spheres, without essence, or with no sphere-growth Mandate', () => {
    const s = makeState();
    expect(mandateCastForPlace(s, cast(), { sphereAffinity: 'force' }, 40)).toBeUndefined();
    expect(mandateCastForPlace(s, cast({ essencePaid: 0 }), { sphereAffinity: 'mind' }, 40)).toBeUndefined();
    const noMandate = { ...s, mandateDefinition: undefined } as unknown as GameState;
    expect(mandateCastForPlace(noMandate, cast(), { sphereAffinity: 'mind' }, 40)).toBeUndefined();
  });

  it('never overlaps the chapter deed: the god\'s own action earns no deed credit', () => {
    expect(mandateDeedForChapter(makeState(), cast({ mandateSphereSpend: { mind: 3 } }), { sphereAffinity: 'mind' }, 'Ascendant', 40)).toBeUndefined();
  });
});

describe('THR-2249 — the Mandate folds a cast credit once', () => {
  beforeEach(() => resetMandateCounter());

  it('the ledger rises by the credit, keyed to the place, and the next tick adds nothing', () => {
    let state = step(makeState(), MANDATE_BASELINE_SETTLE_TICK);
    const before = state.mandateState?.godLedger?.primary ?? 0;
    const { credits } = mandateCastForPlace(state, cast(), { sphereAffinity: 'mind' }, 40)!;
    state = step(state, 40, { pendingMandateCredits: credits });
    const after = state.mandateState?.godLedger?.primary ?? 0;
    expect(after - before).toBeCloseTo(3 * MANDATE_CAST_POINTS_PER_ESSENCE, 9);
    expect(state.mandateState?.godHeld?.[heldKey('shrine', 'mind')]).toBeCloseTo(3 * MANDATE_CAST_POINTS_PER_ESSENCE, 9);
    expect(state.pendingMandateCredits ?? []).toEqual([]);
    // A cast is the god's own hand, not a mortal's deed: the "last deeds" list stays empty.
    expect(state.mandateState?.recentDeeds ?? []).toEqual([]);

    state = step(state, 41);
    expect(state.mandateState?.godLedger?.primary ?? 0).toBeCloseTo(after, 9);
  });
});
