/**
 * THR-1811 — god cards carry their progression as data, and the world offers them.
 * Plan: Docs/plans/2026-10-13-thr-1811-god-card-progression-and-offerings.md (Done when).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState } from '../../types/ascendantBeat';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import {
  godCards,
  rungForMarks,
  rungMarks,
  rungGiftsFor,
  offerableCards,
  offeringExpiresTurn,
  priceOf,
  payment,
  pricePhrase,
  spendable,
  drawOffering,
  offeringWeight,
  getGodProgressionReadout,
  isRungOpeningOffer,
  type OfferingIdentity,
} from '../godProgression';
import { phaseAscendantBeatDirector, resolvePendingBeat, forceOffering, computeIdentityBias } from '../ascendantBeat';
import { phaseAscendantProgression } from '../phaseAscendantProgression';
import { isWithinGodReaches } from '../targetActions';
import { checkGodCardProgression } from '../godCardProgressionCheck';
import { reportUnreachableActions } from '../content-eval/unreachableActions';
import { ASCENDANT_SPINE, ASCENDANT_BEAT_POOL } from '../../data/ascendant-beat-content';
import { ASCENDANT_MILESTONE_BEATS } from '../../data/ascendant-milestone-beats';
import { REACH_SIGNATURE_ID_BY_REACH } from '../../data/reach-signature-content';
import {
  PRICE_BY_TIER,
  OFF_SPHERE_PRICE_MULT,
  OFFERING_SIZE,
  OFFERING_MIN_TTL_TICKS,
  RUNG_GIFT_SPACING,
  OFFERING_BEAT_ID,
  RUNG_BEAT_PRESENTATION,
} from '../../data/god-progression-content';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The Shepherd: life/spirit, heart/stone/star. */
const SHEPHERD = {
  actorType: 'ascendant',
  domainAffinities: { heart: 4, stone: 3, star: 2 },
  sphereAlignment: { primary: 'life', secondary: 'spirit' },
};

function beatsAfterSpine(overrides: Partial<AscendantBeatState> = {}): AscendantBeatState {
  return { spineCursor: -1, pending: null, history: [], lastBeatTurn: 0, ...overrides };
}

function makeState(opts: {
  tick?: number;
  earned?: Partial<Record<string, number>>;
  spent?: Partial<Record<string, number>>;
  unlocked?: string[];
  rung?: number;
  beats?: AscendantBeatState;
} = {}): GameState {
  const graph = new WorldGraph();
  // Every milestone already fired, so the ladder is what fills the slot.
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'God', properties: { ...SHEPHERD, milestoneBeatsFired: ASCENDANT_MILESTONE_BEATS.map(b => b.beatId) } });
  return {
    graph,
    ascendantId: 'asc-1',
    tick: opts.tick ?? 100,
    ascendantBeats: opts.beats ?? beatsAfterSpine(),
    unlockedActionIds: opts.unlocked ?? [],
    essenceEarnedBySphere: opts.earned ?? {},
    offeringSpentBySphere: opts.spent,
    godProgression: opts.rung !== undefined
      ? { rung: opts.rung, rungOpenedTick: {}, rungGiftQueue: [], nextRungGiftTick: 0 }
      : undefined,
    chronicleEntries: [],
  } as unknown as GameState;
}

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); });

describe('THR-1811 — the data on the cards', () => {
  it('every god card carries a progression block, and the live catalog passes the gate', () => {
    const report = checkGodCardProgression(godCards(), {
      spine: new Set(ASCENDANT_SPINE.flatMap(b => b.grantsActionIds ?? [])),
      milestone: new Set(ASCENDANT_MILESTONE_BEATS.flatMap(b => b.grantsActionIds ?? [])),
      signature: new Set(Object.values(REACH_SIGNATURE_ID_BY_REACH) as string[]),
    });
    expect(report.failures).toEqual([]);
    // The THR-1794 first-pass table, copied onto the templates, plus THR-1969's three
    // tier-2 market rows (Fortune's Favour, Ruin, Bless the Holding), plus THR-2086's
    // two tier-1 energy market cards (Stoke the Forges, Kindle a Spark), plus THR-2089's
    // three tier-1 cheap place cards (Steel the Walls, Lay the Footings, Keep the Stores).
    expect(report.cardCount).toBe(151);
    expect(report.counts.market).toBe(101);
    expect(report.counts.gift).toBe(50);
    expect(report.counts.generic).toBe(32);
    expect(report.counts.byTier).toEqual({ 1: 49, 2: 63, 3: 28, 4: 11 });
  });

  describe('the gate fails on each kind of drift', () => {
    const card = (id: string, extra: Partial<UnifiedActionTemplate>) =>
      ({ id, name: id, sphereAffinity: 'life', ...extra }) as unknown as UnifiedActionTemplate;
    const none = { spine: new Set<string>(), milestone: new Set<string>(), signature: new Set<string>() };

    it('a god card without a block', () => {
      expect(checkGodCardProgression([card('a', {})], none).failures[0]).toMatch(/no progression block/);
    });
    it('a spine grant whose giftBy is not spine', () => {
      const r = checkGodCardProgression(
        [card('a', { progression: { tier: 1, offer: 'market', generic: false } })],
        { ...none, spine: new Set(['a']) },
      );
      expect(r.failures.some(f => /spine beat grants it/.test(f))).toBe(true);
    });
    it('a milestone giftBy with no milestone beat behind it', () => {
      const r = checkGodCardProgression(
        [card('a', { progression: { tier: 1, offer: 'gift', giftBy: 'milestone', generic: false } })],
        none,
      );
      expect(r.failures.some(f => /no milestone beat grants it/.test(f))).toBe(true);
    });
    it('a non-generic market card with no price sphere', () => {
      const r = checkGodCardProgression(
        [card('a', { sphereAffinity: undefined, progression: { tier: 2, offer: 'market', generic: false } })],
        none,
      );
      expect(r.failures.some(f => /no sphere to be priced in/.test(f))).toBe(true);
    });
  });
});

describe('THR-1811 — rungs', () => {
  it('rung 0 before the spine ends, then one rung per threshold reached', () => {
    expect(rungForMarks(10, false)).toBe(0);
    expect(rungForMarks(0, true)).toBe(1);
    expect(rungForMarks(3, true)).toBe(2);
    expect(rungForMarks(6, true)).toBe(3);
    expect(rungForMarks(99, true)).toBe(4);
  });

  it('sums marks over the bought spheres only', () => {
    // life 60 → 2 marks, spirit 20 → 1 mark, mind (unbought) 600 → 0.
    expect(rungMarks(makeState({ earned: { life: 60, spirit: 20, mind: 600 } }))).toBe(3);
  });

  it('crossing three marks opens rung 2: the secondary signature first, then the rung keys, RUNG_GIFT_SPACING apart', () => {
    let state = makeState({ tick: 200, earned: { life: 60, spirit: 20 } });
    let patch = phaseAscendantProgression(state);
    expect(patch.godProgression?.rung).toBe(2);
    const first = patch.ascendantBeats?.pending;
    expect(first?.kind).toBe('rung_gift');
    expect(first?.beatId).toBe('beat.rung.2.signature.secondary');
    expect(rungGiftsFor(2)).toEqual([
      'beat.rung.2.signature.secondary',
      'beat.rung.2.action.bestow',
      'beat.rung.2.hex.shift_dominion',
      'beat.rung.2.hex.attune_thread',
      'beat.rung.2.hex.strengthen_thread',
    ]);
    // Resolve the signature, then the next key waits RUNG_GIFT_SPACING.
    state = { ...state, ...patch } as GameState;
    state = resolvePendingBeat(state).state;
    patch = phaseAscendantProgression({ ...state, tick: 201 } as GameState);
    expect(patch.ascendantBeats?.pending).toBeUndefined();
    patch = phaseAscendantProgression({ ...state, tick: 200 + RUNG_GIFT_SPACING } as GameState);
    expect(patch.ascendantBeats?.pending?.beatId).toBe('beat.rung.2.action.bestow');
  });

  it('a held key is skipped, never offered (THR-647)', () => {
    const state = makeState({ tick: 200, earned: { life: 60, spirit: 20 }, unlocked: ['invest.heart.sworn_oath', 'invest.stone.great_work', 'action.bestow'] });
    const patch = phaseAscendantProgression(state);
    expect(patch.ascendantBeats?.pending?.beatId).toBe('beat.rung.2.hex.shift_dominion');
  });

  it('when the rung head is skipped, the next key carries the rung\'s opening words', () => {
    // The god already holds its secondary signature (an old save from the retired pool beat).
    const state = makeState({ tick: 200, earned: { life: 60, spirit: 20 }, unlocked: ['invest.stone.great_work'] });
    const patch = phaseAscendantProgression(state);
    expect(patch.ascendantBeats?.pending?.beatId).toBe('beat.rung.2.action.bestow');
    expect(isRungOpeningOffer(state, 'beat.rung.2.action.bestow')).toBe(true);
    expect(patch.chronicleEntries?.some(c => c.title === RUNG_BEAT_PRESENTATION[2].title)).toBe(true);
  });

  it('a rung-gift resolves with via: rung', () => {
    const state = makeState({ tick: 200, earned: { life: 60, spirit: 20 }, unlocked: ['invest.stone.great_work'] });
    const patch = phaseAscendantProgression(state);
    const next = resolvePendingBeat({ ...state, ...patch } as GameState);
    expect(next.resolved).toBe(true);
    expect(next.grantedActionIds.length).toBe(1);
    const grant = getTraces().find(t => t.category === 'action.unlock.granted') as unknown as { via: string };
    expect(grant.via).toBe('rung');
  });
});

describe('THR-1811 — the offering', () => {
  it('offers only market cards at or below the open rung, not held, inside the god\'s reaches', () => {
    const state = makeState({ rung: 1 });
    const offer = offerableCards(state, 1);
    expect(offer.length).toBeGreaterThan(OFFERING_SIZE);
    const affinities = SHEPHERD.domainAffinities;
    for (const t of offer) {
      expect(t.progression?.offer).toBe('market');
      expect(t.progression!.tier).toBeLessThanOrEqual(1);
      expect(isWithinGodReaches(t, affinities)).toBe(true);
    }
    expect(offerableCards(makeState({ rung: 0 }), 0)).toEqual([]);
  });

  it('the Director offers three cards with a day-boundary expiry once a rung is open', () => {
    let state = makeState({ tick: 100, rung: 1, earned: { life: 100 } });
    let offered = null as null | { ids: readonly string[]; expires?: number };
    const rng = mulberry32(1811);
    for (let t = 100; t < 400 && !offered; t++) {
      state = { ...state, tick: t } as GameState;
      const patch = phaseAscendantBeatDirector(state, rng);
      if (patch.ascendantBeats) state = { ...state, ascendantBeats: patch.ascendantBeats } as GameState;
      const p = state.ascendantBeats?.pending;
      if (p?.kind === 'offering') offered = { ids: p.offeredActionIds ?? [], expires: p.expiresTurn };
      else if (p) state = { ...state, ascendantBeats: { ...state.ascendantBeats!, pending: null } } as GameState;
    }
    expect(offered).not.toBeNull();
    expect(offered!.ids.length).toBe(OFFERING_SIZE);
    expect(new Set(offered!.ids).size).toBe(OFFERING_SIZE);
    expect(offered!.expires! % TICKS_PER_DAY).toBe(0);
    const trace = getTraces().find(t => t.category === 'offering.offered') as unknown as { offered: { actionId: string }[] };
    expect(trace.offered.map(o => o.actionId)).toEqual([...offered!.ids]);
  });

  it('an offering left alone passes at the first day boundary ≥ OFFERING_MIN_TTL_TICKS later, with no chronicle line', () => {
    const turn = 103;
    const expires = offeringExpiresTurn(turn);
    expect(expires % TICKS_PER_DAY).toBe(0);
    expect(expires - turn).toBeGreaterThanOrEqual(OFFERING_MIN_TTL_TICKS);
    expect(expires - turn).toBeLessThan(OFFERING_MIN_TTL_TICKS + TICKS_PER_DAY);

    const pending = { beatId: OFFERING_BEAT_ID, kind: 'offering' as const, offeredTurn: turn, boundNodeIds: [], trigger: { kind: 'cadence' as const }, offeredActionIds: ['divine.deceive'], expiresTurn: expires };
    const before = makeState({ tick: expires - 1, rung: 1, beats: beatsAfterSpine({ pending }) });
    expect(phaseAscendantBeatDirector(before, mulberry32(1)).ascendantBeats).toBeUndefined();
    const at = makeState({ tick: expires, rung: 1, beats: beatsAfterSpine({ pending }) });
    const patch = phaseAscendantBeatDirector(at, mulberry32(1));
    expect(patch.ascendantBeats?.pending).toBeNull();
    expect(patch.ascendantBeats?.history.at(-1)?.outcome).toBe('passed');
    expect(patch.chronicleEntries).toBeUndefined();
    const passed = getTraces().find(t => t.category === 'offering.passed') as unknown as { reason: string };
    expect(passed.reason).toBe('expired');
  });

  it('identity weighting uses the Director\'s bias rule; generic cards are unbiased', () => {
    const state = makeState({ rung: 1 });
    const bias = (identity: OfferingIdentity) =>
      computeIdentityBias({ beatId: 'x', kind: 'offering', trigger: { kind: 'cadence' }, identity }, state);
    const cards = offerableCards(state, 1);
    const generic = cards.find(t => t.progression?.generic);
    if (generic) expect(offeringWeight(generic, state, 2, bias)).toBe(1);
    const lifeCard = cards.find(t => !t.progression?.generic && t.sphereAffinity === 'life');
    const mindCard = cards.find(t => !t.progression?.generic && t.sphereAffinity === 'mind' && t.reach === lifeCard?.reach);
    if (lifeCard && mindCard) {
      expect(offeringWeight(lifeCard, state, 2, bias)).toBeGreaterThan(offeringWeight(mindCard, state, 2, bias));
    }
  });

  it('draws distinct cards, one rng call per pick', () => {
    const cards = offerableCards(makeState({ rung: 2 }), 2);
    let calls = 0;
    const rng = () => { calls++; return 0.5; };
    const picks = drawOffering(cards, () => 1, rng);
    expect(new Set(picks).size).toBe(OFFERING_SIZE);
    expect(calls).toBe(OFFERING_SIZE);
  });
});

describe('THR-1811 — prices and taking one up', () => {
  const card = () => getUnifiedTemplateById('divine.deceive')!; // tier 1 market, mind

  it('pays from the card\'s own sphere, else the primary at double, else beyond', () => {
    const price = PRICE_BY_TIER[1];
    expect(priceOf(card(), makeState())).toBe(price);
    expect(payment(card(), makeState({ earned: { mind: price } }))).toEqual({ sphere: 'mind', amount: price, word: 'paid_from' });
    expect(payment(card(), makeState({ earned: { life: price * OFF_SPHERE_PRICE_MULT } })))
      .toEqual({ sphere: 'life', amount: price * OFF_SPHERE_PRICE_MULT, word: 'at_double' });
    expect(payment(card(), makeState({ earned: { life: price } }))).toBeNull();
    expect(pricePhrase(card(), makeState({ earned: { mind: price } })).text).toBe('Paid from Mind');
    expect(pricePhrase(card(), makeState({ earned: { life: 999 } })).text).toBe('From Life, at double');
    expect(pricePhrase(card(), makeState()).text).toBe('Beyond you yet');
  });

  it('taking one up unlocks it, spends from the ledger, and never touches the earned counter', () => {
    const pending = { beatId: OFFERING_BEAT_ID, kind: 'offering' as const, offeredTurn: 100, boundNodeIds: [], trigger: { kind: 'cadence' as const }, offeredActionIds: ['divine.deceive'], expiresTurn: 108 };
    const earned = { mind: 50 };
    const state = makeState({ earned, rung: 1, beats: beatsAfterSpine({ pending }) });
    const r = resolvePendingBeat(state, { chosenActionId: 'divine.deceive' });
    expect(r.outcome).toBe('taken');
    expect(r.state.unlockedActionIds).toContain('divine.deceive');
    expect(r.state.essenceEarnedBySphere).toEqual({ mind: 50 });
    expect(r.state.offeringSpentBySphere).toEqual({ mind: PRICE_BY_TIER[1] });
    expect(spendable(r.state, 'mind')).toBe(50 - PRICE_BY_TIER[1]);
    expect(r.state.offeringBoughtByTier).toEqual({ 1: 1 });
    expect(r.state.chronicleEntries?.at(-1)?.prose).toBe('You took up Deceive.');
    // The next tier-1 card costs more (escalation counted per tier).
    expect(priceOf(card(), r.state)).toBeGreaterThan(PRICE_BY_TIER[1]);
    const taken = getTraces().find(t => t.category === 'offering.taken') as unknown as { price: number };
    expect(taken.price).toBe(PRICE_BY_TIER[1]);
  });

  it('letting them pass, an unoffered choice, or an unaffordable one moves no essence', () => {
    const pending = { beatId: OFFERING_BEAT_ID, kind: 'offering' as const, offeredTurn: 100, boundNodeIds: [], trigger: { kind: 'cadence' as const }, offeredActionIds: ['divine.deceive'], expiresTurn: 108 };
    const base = makeState({ earned: { mind: 50 }, rung: 1, beats: beatsAfterSpine({ pending }) });
    for (const [choice, state] of [
      [undefined, base],
      ['hex.smite', base],
      ['divine.deceive', makeState({ earned: {}, rung: 1, beats: beatsAfterSpine({ pending }) })],
    ] as const) {
      const r = resolvePendingBeat(state, { chosenActionId: choice });
      expect(r.outcome).toBe('passed');
      expect(r.state.offeringSpentBySphere ?? {}).toEqual({});
      expect(r.state.unlockedActionIds).not.toContain('divine.deceive');
      expect(r.state.chronicleEntries).toEqual([]);
    }
  });

  it('forceOffering and the readout agree', () => {
    const state = makeState({ rung: 1, earned: { mind: 100, life: 100 } });
    const beats = forceOffering(state, mulberry32(7));
    expect(beats?.pending?.kind).toBe('offering');
    const readout = getGodProgressionReadout({ ...state, ascendantBeats: beats! } as GameState);
    expect(readout.pendingOffering?.cardIds).toEqual(beats?.pending?.offeredActionIds);
    expect(readout.pendingOffering?.words.length).toBe(readout.pendingOffering?.cardIds.length);
  });
});

describe('THR-1811 — retirements', () => {
  it('the orphan report counts offered and rung-gifted cards as reachable', () => {
    const ids = reportUnreachableActions().entries.map(e => e.id);
    for (const id of ['action.secrets.reveal_secret', 'action.consecrate', 'action.bestow', 'action.anoint']) {
      expect(ids).not.toContain(id);
    }
  });

  it('no grant-bearing beat is left in the cadence pool', () => {
    for (const b of ASCENDANT_BEAT_POOL) {
      expect(b.grantsActionIds ?? []).toEqual([]);
      expect(b.grantsReachSignature).toBeUndefined();
    }
  });
});
