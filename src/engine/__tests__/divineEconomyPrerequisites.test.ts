/**
 * THR-1747 — divine economy shared prerequisites (Done-when 3, 4, 5, 7).
 *
 *  - The Wellspring is a milestone at bond + WELLSPRING_MILESTONE_TICKS_AFTER_BOND.
 *  - Investment beats retire once every card they grant is held.
 *  - Source upkeep is charged from the primary sphere; an unpaid source stalls.
 *  - The held-ground milestone grants the four orphaned income cards.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseAscendantProgression } from '../phaseAscendantProgression';
import { phaseEssenceSources } from '../phaseEssenceSources';
import { createInitialAscendantBeatState, isBeatEligible, resolvePendingBeat } from '../ascendantBeat';
import { chargeSourceUpkeep } from '../essenceSources';
import { computeEssenceIncome } from '../essenceIncome';
import { createEmptyEssencePool } from '../influence';
import { phaseEssence } from '../orchestrator';
import { phaseInfluenceMaintenance } from '../phaseInfluenceMaintenance';
import { applyEssenceEarned } from '../essenceEarned';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import {
  WELLSPRING_MILESTONE_BEAT_ID,
  WELLSPRING_MILESTONE_TICKS_AFTER_BOND,
  MILESTONE_HELD_GROUND_BEAT_ID,
  MILESTONE_HELD_GROUND_FLOWERING,
} from '../../data/player-progression';
import { getMilestoneBeatById } from '../../data/ascendant-milestone-beats';
import { ASCENDANT_ACTION_BUCKETS, ASCENDANT_BEAT_POOL } from '../../data/ascendant-beat-content';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { SOURCE_CONTROL_SUSTAIN } from '../../data/essence-sources';
import { SPHERE_NAMES } from '../../types/index';
import type { GameState } from '../../types/gameState';
import type { BeatDefinition } from '../../types/ascendantBeat';
import type { EssenceSource, SourceTier } from '../../types/essenceSource';
import type { DoomClockState } from '../../types/doomClock';
import type { SphereAlignment } from '../../types/influence';

const ASC = 'asc-1';
const SOURCE_VERBS = [
  'loc.find_source', 'loc.claim_source',
  'loc.consecrate_source', 'loc.sanctify_source', 'loc.defend_source',
];
const HELD_GROUND_CARDS = ['hex.tap_source', 'hex.claim_resource', 'hex.claim_dominion', 'loc.place_of_power'];

function addSource(graph: WorldGraph, id: string, tier: SourceTier, extra: Partial<EssenceSource> = {}): void {
  const src: EssenceSource = {
    kind: 'shrine',
    sphereAffinity: 'life',
    sanctity: tier === 'flowering' ? 1 : 0,
    tier,
    ...extra,
  };
  graph.addNode({ id, type: 'location', name: id, properties: { locationType: 'location', essenceSource: src } });
  graph.addEdge({ id: `edge.controls_${id}`, source: ASC, target: id, type: 'controls', properties: {} });
}

interface Opts {
  sources?: SourceTier[];
  /** `undefined` → no doomClock at all; `'nofield'` → a clock with no wokeAtTick field. */
  wokeAtTick?: number | null | 'nofield';
  unlocked?: string[];
  milestoneBeatsFired?: string[];
}

function makeState(tick: number, opts: Opts = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASC,
    type: 'actor',
    name: 'The God',
    properties: {
      actorType: 'ascendant',
      domainAffinities: { iron: 5, gold: 3 },
      reachTierSnapshot: { iron: 1, gold: 1 },
      sphereAlignment: { primary: 'life', secondary: 'spirit' } as SphereAlignment,
      // The source milestone is out of the way so these tests isolate the new ones.
      milestoneBeatsFired: opts.milestoneBeatsFired ?? ['beat.milestone.the_wellspring_flows'],
    },
  });
  (opts.sources ?? []).forEach((tier, i) => addSource(graph, `loc.src-${i}`, tier));
  const doomClock =
    opts.wokeAtTick === 'nofield'
      ? ({} as DoomClockState)
      : ({ wokeAtTick: opts.wokeAtTick === undefined ? 0 : opts.wokeAtTick } as unknown as DoomClockState);
  return {
    tick,
    seed: 42,
    ascendantId: ASC,
    graph,
    doomClock,
    unlockedActionIds: opts.unlocked ?? [],
    ascendantBeats: { ...createInitialAscendantBeatState(), spineCursor: -1 },
  } as unknown as GameState;
}

const fired = (s: GameState) =>
  (s.graph.getNode(ASC)!.properties as { milestoneBeatsFired?: string[] }).milestoneBeatsFired ?? [];

beforeEach(() => {
  enableTracing();
  clearTraces();
});
afterEach(() => {
  clearTraces();
  disableTracing();
});

// ─── Done-when 3: the Wellspring milestone ───────────────────────────────────

describe('Wellspring milestone (THR-1747 E2)', () => {
  it('is no longer in the cadence pool', () => {
    expect(ASCENDANT_BEAT_POOL.some(b => b.beatId === 'beat.pool.invest.the_wellspring')).toBe(false);
  });

  it('is enqueued at bond + 48, not at bond + 47', () => {
    const at47 = makeState(WELLSPRING_MILESTONE_TICKS_AFTER_BOND - 1, { wokeAtTick: 0 });
    expect(phaseAscendantProgression(at47).ascendantBeats?.pending?.beatId).toBeUndefined();
    const at48 = makeState(WELLSPRING_MILESTONE_TICKS_AFTER_BOND, { wokeAtTick: 0 });
    const r = phaseAscendantProgression(at48);
    expect(r.ascendantBeats?.pending?.beatId).toBe(WELLSPRING_MILESTONE_BEAT_ID);
    expect(r.ascendantBeats?.pending?.kind).toBe('milestone');
    expect(fired(at48)).toContain(WELLSPRING_MILESTONE_BEAT_ID);
    expect(r.chronicleEntries).toHaveLength(1);
  });

  it('counts from the bond, not from tick 0', () => {
    expect(phaseAscendantProgression(makeState(100, { wokeAtTick: 60 })).ascendantBeats).toBeUndefined();
    expect(phaseAscendantProgression(makeState(108, { wokeAtTick: 60 })).ascendantBeats?.pending?.beatId)
      .toBe(WELLSPRING_MILESTONE_BEAT_ID);
  });

  it('a clock with no wokeAtTick field reads as bonded at tick 0 (old saves still get the verbs)', () => {
    const r = phaseAscendantProgression(makeState(WELLSPRING_MILESTONE_TICKS_AFTER_BOND, { wokeAtTick: 'nofield' }));
    expect(r.ascendantBeats?.pending?.beatId).toBe(WELLSPRING_MILESTONE_BEAT_ID);
  });

  it('never fires while the clock still sleeps (wokeAtTick null)', () => {
    const s = makeState(500, { wokeAtTick: null });
    expect(phaseAscendantProgression(s).ascendantBeats).toBeUndefined();
    expect(fired(s)).not.toContain(WELLSPRING_MILESTONE_BEAT_ID);
  });

  it('does not wait for the onboarding spine to finish (it takes an empty slot between gifts)', () => {
    const s = makeState(WELLSPRING_MILESTONE_TICKS_AFTER_BOND, { wokeAtTick: 0 });
    s.ascendantBeats = { ...s.ascendantBeats!, spineCursor: 2 };
    expect(phaseAscendantProgression(s).ascendantBeats?.pending?.beatId).toBe(WELLSPRING_MILESTONE_BEAT_ID);
  });

  it('waits for an empty pending slot', () => {
    const s = makeState(60, { wokeAtTick: 0 });
    s.ascendantBeats = {
      ...s.ascendantBeats!,
      pending: { beatId: 'x', kind: 'investment', offeredTurn: 59, boundNodeIds: [], trigger: { kind: 'cadence' } },
    };
    expect(phaseAscendantProgression(s).ascendantBeats).toBeUndefined();
    expect(fired(s)).not.toContain(WELLSPRING_MILESTONE_BEAT_ID);
  });

  it('with all five verbs already held: recorded fired, not offered, trace says all_grants_held', () => {
    const s = makeState(60, { wokeAtTick: 0, unlocked: SOURCE_VERBS });
    const r = phaseAscendantProgression(s);
    expect(r.ascendantBeats).toBeUndefined();
    expect(r.chronicleEntries).toBeUndefined();
    expect(fired(s)).toContain(WELLSPRING_MILESTONE_BEAT_ID);
    const trace = getTraces().find(
      t => t.category === 'ascendant.progression.milestone_enqueued'
        && (t as unknown as { beatId: string }).beatId === WELLSPRING_MILESTONE_BEAT_ID,
    ) as unknown as { skipped?: string } | undefined;
    expect(trace?.skipped).toBe('all_grants_held');
  });

  it('resolving it puts all five source verbs in unlockedActionIds', () => {
    const s = makeState(60, { wokeAtTick: 0 });
    const withPending = { ...s, ...phaseAscendantProgression(s) } as GameState;
    const res = resolvePendingBeat(withPending, {}, id => getUnifiedTemplateById(id) !== undefined);
    expect(res.resolved).toBe(true);
    for (const id of SOURCE_VERBS) expect(res.state.unlockedActionIds).toContain(id);
  });
});

// ─── Done-when 7: the held-ground milestone ──────────────────────────────────

describe('held-ground milestone (THR-1747 E5)', () => {
  const firedBoth = ['beat.milestone.the_wellspring_flows', WELLSPRING_MILESTONE_BEAT_ID];

  it('is not enqueued below MILESTONE_HELD_GROUND_FLOWERING flowering sources', () => {
    const s = makeState(10, { sources: ['flowering', 'dormant'], milestoneBeatsFired: firedBoth });
    expect(MILESTONE_HELD_GROUND_FLOWERING).toBe(2);
    expect(phaseAscendantProgression(s).ascendantBeats).toBeUndefined();
  });

  it('is enqueued at two flowering sources and grants the four held-ground cards', () => {
    const s = makeState(10, { sources: ['flowering', 'flowering'], milestoneBeatsFired: firedBoth });
    const r = phaseAscendantProgression(s);
    expect(r.ascendantBeats?.pending?.beatId).toBe(MILESTONE_HELD_GROUND_BEAT_ID);
    const res = resolvePendingBeat({ ...s, ...r } as GameState, {}, id => getUnifiedTemplateById(id) !== undefined);
    expect(res.resolved).toBe(true);
    for (const id of HELD_GROUND_CARDS) {
      expect(res.state.unlockedActionIds).toContain(id);
      expect(ASCENDANT_ACTION_BUCKETS[id]?.bucket).toBe('unlockable-generic');
    }
  });

  it('is skipped (recorded, not offered) when all four are already held', () => {
    const s = makeState(10, { sources: ['flowering', 'flowering'], milestoneBeatsFired: firedBoth, unlocked: HELD_GROUND_CARDS });
    expect(phaseAscendantProgression(s).ascendantBeats).toBeUndefined();
    expect(fired(s)).toContain(MILESTONE_HELD_GROUND_BEAT_ID);
  });

  it('grants exactly the four orphans', () => {
    expect(getMilestoneBeatById(MILESTONE_HELD_GROUND_BEAT_ID)?.grantsActionIds).toEqual(HELD_GROUND_CARDS);
  });
});

// ─── Done-when 4: investment-beat retirement ─────────────────────────────────

describe('investment beats retire once their grants are held (THR-1747 E3)', () => {
  const stateWith = (unlocked: string[]) => makeState(10, { unlocked });
  const invest = (extra: Partial<BeatDefinition> = {}): BeatDefinition => ({
    beatId: 'beat.test.invest',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    eligibility: { kind: 'always' },
    grantsActionIds: ['a', 'b'],
    ...extra,
  } as BeatDefinition);

  it('every grant held → not eligible', () => {
    expect(isBeatEligible(invest(), stateWith(['a', 'b']))).toBe(false);
  });

  it('any grant missing → eligible', () => {
    expect(isBeatEligible(invest(), stateWith(['a']))).toBe(true);
  });

  it('an investment beat with no eligibility (the_unveiled_eye shape) also retires', () => {
    const eye = ASCENDANT_BEAT_POOL.find(b => b.beatId === 'beat.pool.invest.the_unveiled_eye')!;
    expect(eye.eligibility).toBeUndefined();
    expect(isBeatEligible(eye, stateWith([...(eye.grantsActionIds ?? [])]))).toBe(false);
    expect(isBeatEligible(eye, stateWith([]))).toBe(true);
  });

  it('an introduction beat with held grants is unaffected', () => {
    expect(isBeatEligible(invest({ kind: 'introduction' }), stateWith(['a', 'b']))).toBe(true);
  });

  it('a throwing grant read leaves the beat eligible (fail-open)', () => {
    const malformed = invest();
    Object.defineProperty(malformed, 'grantsActionIds', { get() { throw new Error('boom'); } });
    expect(isBeatEligible(malformed, stateWith(['a', 'b']))).toBe(true);
  });
});

// ─── Done-when 5: source upkeep ──────────────────────────────────────────────

describe('source upkeep (THR-1747 E4)', () => {
  function upkeepState(primaryAmount: number, sourceTier: SourceTier = 'dormant'): GameState {
    const s = makeState(10, { sources: [sourceTier] });
    const pool = createEmptyEssencePool();
    for (const sp of SPHERE_NAMES) pool[sp] = 10;
    pool.life = primaryAmount;
    return { ...s, essencePool: pool, controlEffects: [], tickEvents: [] } as unknown as GameState;
  }
  const srcOf = (s: GameState) => s.graph.getNode('loc.src-0')!.properties.essenceSource as EssenceSource;

  it('a full pool pays exactly SOURCE_CONTROL_SUSTAIN from the primary sphere, nothing elsewhere', () => {
    const s = upkeepState(10);
    const r = phaseEssenceSources(s);
    expect(r.essencePool!.life).toBeCloseTo(10 - SOURCE_CONTROL_SUSTAIN, 10);
    for (const sp of SPHERE_NAMES) if (sp !== 'life') expect(r.essencePool![sp]).toBe(10);
    expect(srcOf(s).upkeepCurrent).toBe(true);
  });

  it('a short pool charges nothing, marks the source unpaid, and never lapses it', () => {
    const s = upkeepState(SOURCE_CONTROL_SUSTAIN / 2);
    const r = phaseEssenceSources(s);
    expect(r.essencePool).toBeUndefined();
    const src = srcOf(s);
    expect(src.upkeepCurrent).toBe(false);
    expect(src.tier).toBe('dormant');
    expect(s.graph.getOutgoingEdges(ASC, 'controls').some(e => e.target === 'loc.src-0')).toBe(true);
  });

  // The stall itself (no upward drift while unpaid) is pinned in sourceUpkeepStall.test.ts,
  // which fixes the land's drift positive so the guard is what decides.

  it('a desecrated source owes no upkeep — it pays nothing and cannot be released', () => {
    const s = upkeepState(10);
    const host = s.graph.getNode('loc.src-0')!;
    host.properties.essenceSource = { ...(host.properties.essenceSource as EssenceSource), desecrated: true, tier: 'desecrated' };
    expect(phaseEssenceSources(s).essencePool).toBeUndefined();
    const readout = computeEssenceIncome(s.graph, ASC, []).life;
    host.properties.essenceSource = { ...(host.properties.essenceSource as EssenceSource), desecrated: false, tier: 'dormant' };
    // Restored, it is charged again (and earns again), so the two readouts differ.
    expect(computeEssenceIncome(s.graph, ASC, []).life).not.toBeCloseTo(readout, 6);
  });

  it('a consecrated home seat owes no upkeep, in the charge and the readout alike (review-gate, THR-1747)', () => {
    // The seat pays its flat ESSENCE_PER_SEAT whether or not it is consecrated, and
    // computeSourceIncome skips it — so charging it would be a pure drain.
    const s = upkeepState(10);
    s.graph.getNode(ASC)!.properties.homeSeatLocationId = 'loc.src-0';
    expect(phaseEssenceSources(s).essencePool).toBeUndefined();
    expect(chargeSourceUpkeep(s.graph, ASC, 'life', { ...s.essencePool }).sources).toBe(0);
    const withSeat = computeEssenceIncome(s.graph, ASC, []).life;
    s.graph.getNode(ASC)!.properties.homeSeatLocationId = undefined;
    const withoutSeat = computeEssenceIncome(s.graph, ASC, []).life;
    // Unseated, the same source is charged (and also earns as a typed source).
    expect(chargeSourceUpkeep(s.graph, ASC, 'life', { ...s.essencePool }).sources).toBe(1);
    expect(withSeat).not.toBeCloseTo(withoutSeat, 6);
  });

  it('chargeSourceUpkeep fails soft with no primary or pool', () => {
    const s = upkeepState(10);
    expect(chargeSourceUpkeep(s.graph, ASC, undefined, s.essencePool).charged).toBe(0);
    expect(chargeSourceUpkeep(s.graph, ASC, 'life', undefined).charged).toBe(0);
    expect(chargeSourceUpkeep(s.graph, 'nobody', 'life', { ...s.essencePool }).sources).toBe(0);
  });

  it('readout = ledger: computeEssenceIncome matches the pool change over one economy tick', () => {
    const s0 = upkeepState(20);
    const readout = computeEssenceIncome(s0.graph, ASC, []);
    let s = { ...s0, ...phaseEssenceSources(s0) } as GameState;
    s = { ...s, ...phaseEssence(s) } as GameState;
    s = { ...s, ...phaseInfluenceMaintenance(s) } as GameState;
    for (const sp of SPHERE_NAMES) {
      expect(s.essencePool[sp] - s0.essencePool[sp]).toBeCloseTo(readout[sp], 10);
    }
  });

  it('the essence-earned counter does not move on the debit', () => {
    const s0 = upkeepState(10);
    const r = phaseEssenceSources(s0);
    const earned = applyEssenceEarned(s0, { ...s0, ...r } as GameState);
    const life = earned.essenceEarnedBySphere?.life ?? 0;
    expect(life).toBe(0);
  });
});
