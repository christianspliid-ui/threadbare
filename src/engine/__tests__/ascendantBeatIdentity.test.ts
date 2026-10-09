import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseAscendantBeatDirector,
  drawFromPool,
  isBeatEligible,
  computeIdentityBias,
  resolveAscendantBeat,
} from '../ascendantBeat';
import {
  BEAT_KIND_WEIGHTS,
  BEAT_REACH_BIAS_BASE,
  BEAT_REACH_BIAS_SLOPE,
  BEAT_REACH_AFFINITY_FULL_SCALE,
  BEAT_REACH_BIAS_CEILING,
  ASCENDANT_BEAT_POOL,
  BEAT_SPHERE_BIAS_PRIMARY,
  BEAT_SPHERE_BIAS_SECONDARY,
} from '../../data/ascendant-beat-content';
import { clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import {
  ALL_DELIVERY_BEATS,
  BASE_POOL_FIRST_DRAW_MASS,
  DELIVERY_BEAT_WEIGHT,
  DELIVERY_FIRST_DRAW_SHARE,
  deliveryBeatWeightFor,
} from '../deliveryBeatAdapter';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState, BeatDefinition } from '../../types/ascendantBeat';

// Deterministic PRNG (mulberry32) so draw sequences are seed-stable (NFP #3).
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

/** A graph with `groups` culture/faction actors, `mortals` individuals, `locations` places. */
function buildGraph(opts: {
  groups?: number;
  mortals?: number;
  locations?: number;
  ascendantProps?: Record<string, unknown>;
} = {}): WorldGraph {
  const { groups = 0, mortals = 0, locations = 0, ascendantProps } = opts;
  const g = new WorldGraph();
  g.addNode({
    id: 'asc-1',
    type: 'actor',
    name: 'God',
    properties: { actorType: 'ascendant', ...(ascendantProps ?? {}) },
  });
  for (let i = 0; i < groups; i++) {
    const actorType = i % 2 === 0 ? 'culture' : 'faction';
    g.addNode({ id: `group-${i}`, type: 'actor', name: `Group ${i}`, properties: { actorType } });
  }
  for (let i = 0; i < mortals; i++) {
    g.addNode({ id: `mortal-${i}`, type: 'actor', name: `Mortal ${i}`, properties: { actorType: 'individual' } });
  }
  for (let i = 0; i < locations; i++) {
    g.addNode({ id: `loc-${i}`, type: 'location', name: `Place ${i}`, properties: {} });
  }
  return g;
}

function stateWith(graph: WorldGraph, beats: AscendantBeatState, tick = 1): GameState {
  return {
    tick,
    seed: 42,
    ascendantId: 'asc-1',
    graph,
    ascendantBeats: beats,
  } as unknown as GameState;
}

function emptyBeats(): AscendantBeatState {
  return { spineCursor: -1, pending: null, history: [], lastBeatTurn: -100 };
}

const introBeat: BeatDefinition = {
  beatId: 'b.intro',
  kind: 'introduction',
  trigger: { kind: 'cadence' },
  eligibility: { kind: 'unintroduced_group' },
};
const investBeat: BeatDefinition = {
  beatId: 'b.invest',
  kind: 'investment',
  trigger: { kind: 'cadence' },
  eligibility: { kind: 'unthreaded_target' },
};
const selectBeat: BeatDefinition = {
  beatId: 'b.select',
  kind: 'selection',
  trigger: { kind: 'cadence' },
};

describe('Ascendant Beat eligibility predicates (THR-516)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('a beat with no eligibility (selection) is always eligible', () => {
    const state = stateWith(buildGraph(), emptyBeats());
    expect(isBeatEligible(selectBeat, state)).toBe(true);
  });

  it('unintroduced_group: eligible while un-introduced groups remain', () => {
    const state = stateWith(buildGraph({ groups: 3 }), emptyBeats());
    expect(isBeatEligible(introBeat, state)).toBe(true);
  });

  it('unintroduced_group: ineligible when no culture/faction exists', () => {
    const state = stateWith(buildGraph({ groups: 0, mortals: 5 }), emptyBeats());
    expect(isBeatEligible(introBeat, state)).toBe(false);
  });

  it('unintroduced_group: ineligible once introductions in history cover every group', () => {
    const beats: AscendantBeatState = {
      spineCursor: -1,
      pending: null,
      lastBeatTurn: 0,
      history: [
        { beatId: 'x', kind: 'introduction', resolvedTurn: 1, outcome: 'ok', grantedActionIds: [], seededNodeIds: [] },
        { beatId: 'y', kind: 'introduction', resolvedTurn: 2, outcome: 'ok', grantedActionIds: [], seededNodeIds: [] },
      ],
    };
    // 2 groups, 2 introductions already → none left.
    expect(isBeatEligible(introBeat, stateWith(buildGraph({ groups: 2 }), beats))).toBe(false);
    // 3 groups, 2 introductions → one still un-introduced.
    expect(isBeatEligible(introBeat, stateWith(buildGraph({ groups: 3 }), beats))).toBe(true);
  });

  it('unthreaded_target: eligible when a threadable actor/location is unthreaded', () => {
    const state = stateWith(buildGraph({ mortals: 2, locations: 1 }), emptyBeats());
    expect(isBeatEligible(investBeat, state)).toBe(true);
  });

  it('unthreaded_target: ineligible when every threadable node is threaded', () => {
    // Only the ascendant is threadable (1 actor); add a thread edge so threads >= threadable.
    const g = buildGraph();
    g.addEdge({ id: 'e1', type: 'thread', source: 'asc-1', target: 'asc-1', properties: {} });
    expect(isBeatEligible(investBeat, stateWith(g, emptyBeats()))).toBe(false);
  });

  it('fails open when the predicate evaluation throws (NFP #4)', () => {
    // A state with no usable graph makes the predicate throw; it must fail open (eligible).
    const broken = { tick: 1, ascendantId: 'asc-1', ascendantBeats: emptyBeats() } as unknown as GameState;
    expect(isBeatEligible(introBeat, broken)).toBe(true);
  });

  it('Director never offers an ineligible beat (0 groups → no introduction beat)', () => {
    // No culture/faction → introduction beats are ineligible; investment/selection remain.
    const rng = mulberry32(99);
    let beats = emptyBeats();
    const offered: string[] = [];
    for (let turn = 1; turn <= 80; turn++) {
      const graph = buildGraph({ groups: 0, mortals: 4, locations: 2 });
      const result = phaseAscendantBeatDirector(stateWith(graph, beats, turn), rng);
      const next = result.ascendantBeats;
      if (next?.pending) {
        offered.push(next.pending.beatId);
        beats = resolveAscendantBeat(next, { outcome: 'success', turn });
      } else if (next) {
        beats = next;
      }
    }
    expect(offered.length).toBeGreaterThan(0);
    expect(offered.some(id => id.startsWith('beat.pool.intro.'))).toBe(false);
  });
});

describe('Ascendant Beat identity bias (THR-516)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  const aligned = (reach?: string, sphere?: string): BeatDefinition => ({
    beatId: 'b.aligned',
    kind: 'investment',
    trigger: { kind: 'cadence' },
    ...(reach || sphere ? { identity: { ...(reach ? { reach: reach as never } : {}), ...(sphere ? { sphere: sphere as never } : {}) } } : {}),
  });

  it('a beat with no identity is unbiased (multiplier 1)', () => {
    const state = stateWith(buildGraph({ ascendantProps: { domainAffinities: { veil: 1 } } }), emptyBeats());
    expect(computeIdentityBias(aligned(), state)).toBe(1);
  });

  it('reach bias scales with the ascendant reach affinity', () => {
    // Raw affinity at half the full scale (THR-1771: affinities are stored raw, 2–5).
    const state = stateWith(buildGraph({ ascendantProps: { domainAffinities: { veil: BEAT_REACH_AFFINITY_FULL_SCALE / 2 } } }), emptyBeats());
    // base + slope × 0.5
    expect(computeIdentityBias(aligned('veil'), state)).toBeCloseTo(BEAT_REACH_BIAS_BASE + BEAT_REACH_BIAS_SLOPE * 0.5);
  });

  it('reach with no recorded affinity falls back to the base multiplier', () => {
    const state = stateWith(buildGraph({ ascendantProps: { domainAffinities: { iron: 1 } } }), emptyBeats());
    expect(computeIdentityBias(aligned('veil'), state)).toBeCloseTo(BEAT_REACH_BIAS_BASE);
  });

  it('sphere match applies primary/secondary bonuses', () => {
    const props = { sphereAlignment: { primary: 'mind', secondary: 'spirit' } };
    const state = stateWith(buildGraph({ ascendantProps: props }), emptyBeats());
    expect(computeIdentityBias(aligned(undefined, 'mind'), state)).toBeCloseTo(BEAT_SPHERE_BIAS_PRIMARY);
    expect(computeIdentityBias(aligned(undefined, 'spirit'), state)).toBeCloseTo(BEAT_SPHERE_BIAS_SECONDARY);
    expect(computeIdentityBias(aligned(undefined, 'force'), state)).toBeCloseTo(1);
  });

  it('reach and sphere combine multiplicatively', () => {
    const props = { domainAffinities: { veil: BEAT_REACH_AFFINITY_FULL_SCALE }, sphereAlignment: { primary: 'mind', secondary: 'spirit' } };
    const state = stateWith(buildGraph({ ascendantProps: props }), emptyBeats());
    const expected = (BEAT_REACH_BIAS_BASE + BEAT_REACH_BIAS_SLOPE * 1) * BEAT_SPHERE_BIAS_PRIMARY;
    expect(computeIdentityBias(aligned('veil', 'mind'), state)).toBeCloseTo(expected);
  });

  it('returns 1 when there is no ascendant node (fail-soft)', () => {
    const g = new WorldGraph();
    const state = { tick: 1, ascendantId: 'missing', graph: g, ascendantBeats: emptyBeats() } as unknown as GameState;
    expect(computeIdentityBias(aligned('veil'), state)).toBe(1);
  });

  it('drawFromPool draws an identity-aligned beat more often (Done-when, deterministic)', () => {
    const plain: BeatDefinition = { beatId: 'plain', kind: 'investment', trigger: { kind: 'cadence' } };
    const veil: BeatDefinition = { beatId: 'veil', kind: 'investment', trigger: { kind: 'cadence' }, identity: { reach: 'veil' } };
    const pool = [plain, veil];
    const state = stateWith(buildGraph({ ascendantProps: { domainAffinities: { veil: BEAT_REACH_AFFINITY_FULL_SCALE } } }), emptyBeats());

    const tally = (seed: number) => {
      const rng = mulberry32(seed);
      let veilCount = 0;
      for (let i = 0; i < 1000; i++) {
        const d = drawFromPool(pool, rng, b => computeIdentityBias(b, state));
        if (d?.beatId === 'veil') veilCount++;
      }
      return veilCount;
    };

    // Weights: plain = kind(investment) × 1; veil = kind × (base + slope) = ×3.
    // p(veil) = 3/(1+3) = 0.75 → expect a clear majority.
    const count = tally(7);
    expect(count).toBeGreaterThan(650);
    expect(BEAT_KIND_WEIGHTS.investment).toBeGreaterThan(0);
    // Determinism: same seed reproduces the same tally.
    expect(tally(7)).toBe(count);
  });

  it('unbiased draw (no ascendant identity) does not favour the aligned beat', () => {
    const plain: BeatDefinition = { beatId: 'plain', kind: 'investment', trigger: { kind: 'cadence' } };
    const veil: BeatDefinition = { beatId: 'veil', kind: 'investment', trigger: { kind: 'cadence' }, identity: { reach: 'veil' } };
    const pool = [plain, veil];
    // Ascendant with zero veil affinity → veil bias = base (1) → equal weights.
    const state = stateWith(buildGraph({ ascendantProps: { domainAffinities: {} } }), emptyBeats());
    const rng = mulberry32(7);
    let veilCount = 0;
    for (let i = 0; i < 1000; i++) {
      const d = drawFromPool(pool, rng, b => computeIdentityBias(b, state));
      if (d?.beatId === 'veil') veilCount++;
    }
    // ~50/50; allow a generous band.
    expect(veilCount).toBeGreaterThan(400);
    expect(veilCount).toBeLessThan(600);
  });
});

describe('THR-1771 — identity bias on the raw affinity scale; the delivery share is a named target', () => {
  // The two reference gods (audit 2026-10-06-thr-1769 § 3): the Shepherd (hunger
  // `gather`) and the showcase god (`DEV_ASCENDANT_IDENTITY`, hunger.witness).
  const SHEPHERD = { domainAffinities: { heart: 4, stone: 3, star: 2 }, sphereAlignment: { primary: 'life', secondary: 'spirit' } };
  const SHOWCASE = { domainAffinities: { eye: 4, veil: 3, shadow: 2 }, sphereAlignment: { primary: 'mind', secondary: 'spirit' } };
  const godState = (props: Record<string, unknown>) =>
    stateWith(buildGraph({ ascendantProps: props }), emptyBeats());
  const reachOnly = (reach: string): BeatDefinition => ({
    beatId: 'r', kind: 'investment', trigger: { kind: 'cadence' }, identity: { reach: reach as never },
  });

  it('a raw-affinity-4 reach draws at exactly the documented ceiling (base + slope)', () => {
    const state = godState({ domainAffinities: { eye: 4 } });
    expect(BEAT_REACH_AFFINITY_FULL_SCALE).toBe(4);
    expect(computeIdentityBias(reachOnly('eye'), state)).toBeCloseTo(BEAT_REACH_BIAS_CEILING);
    expect(BEAT_REACH_BIAS_CEILING).toBe(3);
  });

  it('a raw 5 from the random generator clamps to the ceiling; raw 2 sits halfway', () => {
    expect(computeIdentityBias(reachOnly('eye'), godState({ domainAffinities: { eye: 5 } })))
      .toBeCloseTo(BEAT_REACH_BIAS_CEILING);
    expect(computeIdentityBias(reachOnly('eye'), godState({ domainAffinities: { eye: 2 } })))
      .toBeCloseTo(BEAT_REACH_BIAS_BASE + BEAT_REACH_BIAS_SLOPE * 0.5);
  });

  it('the showcase god no longer draws the_unveiled_eye on 40% of first draws', () => {
    const eye = ASCENDANT_BEAT_POOL.find(b => b.beatId === 'beat.pool.invest.the_unveiled_eye')!;
    const state = godState(SHOWCASE);
    const bias = computeIdentityBias(eye, state);
    expect(bias).toBeCloseTo(BEAT_REACH_BIAS_CEILING * BEAT_SPHERE_BIAS_PRIMARY); // 4.5, was 13.5
    const pool = [...ASCENDANT_BEAT_POOL, ...ALL_DELIVERY_BEATS];
    const mass = (b: BeatDefinition) =>
      (BEAT_KIND_WEIGHTS[b.kind] ?? 1) * (b.weight ?? 1) * computeIdentityBias(b, state);
    const total = pool.reduce((sum, b) => sum + mass(b), 0);
    expect(mass(eye) / total).toBeLessThan(0.2);
  });

  it('the delivery share of an unbiased first draw equals DELIVERY_FIRST_DRAW_SHARE', () => {
    expect(ALL_DELIVERY_BEATS.length).toBeGreaterThan(0);
    const deliveryMass = ALL_DELIVERY_BEATS.reduce(
      (sum, b) => sum + (BEAT_KIND_WEIGHTS[b.kind] ?? 1) * (b.weight ?? 1), 0);
    const baseMass = ASCENDANT_BEAT_POOL.reduce(
      (sum, b) => sum + (BEAT_KIND_WEIGHTS[b.kind] ?? 1) * (b.weight ?? 1), 0);
    expect(baseMass).toBeCloseTo(BASE_POOL_FIRST_DRAW_MASS);
    expect(deliveryMass / (baseMass + deliveryMass)).toBeCloseTo(DELIVERY_FIRST_DRAW_SHARE, 6);
    expect(ALL_DELIVERY_BEATS.every(b => b.weight === DELIVERY_BEAT_WEIGHT)).toBe(true);
  });

  it('the delivery weight self-scales with the catalogue size (share holds at any count)', () => {
    for (const count of [23, 84, 200]) {
      const m = count * (BEAT_KIND_WEIGHTS.delivery ?? 1) * deliveryBeatWeightFor(count);
      expect(m / (BASE_POOL_FIRST_DRAW_MASS + m)).toBeCloseTo(DELIVERY_FIRST_DRAW_SHARE, 6);
    }
    expect(deliveryBeatWeightFor(0)).toBe(0); // fail-soft: nothing to weight
  });

  /**
   * The THR-1769 Monte Carlo, re-run in draw units (audit § 3 recipe: every predicate
   * holds, an investment beat retires once drawn — THR-1747 E3 — an introduction retires
   * one group per draw, a delivery beat dedups, a selection stays). Returns the mean draw
   * index at which each non-identity investment beat first arrives. Deterministic.
   */
  function meanInvestmentArrival(props: Record<string, unknown>, runs: number, seed: number): number {
    const state = godState(props);
    const rng = mulberry32(seed);
    const fullPool = [...ASCENDANT_BEAT_POOL, ...ALL_DELIVERY_BEATS];
    const tracked = ASCENDANT_BEAT_POOL
      .filter(b => b.kind === 'investment' && !b.identity)
      .map(b => b.beatId);
    const MAX_DRAWS = 400;
    let sum = 0;
    let n = 0;
    for (let r = 0; r < runs; r++) {
      let pool = fullPool.slice();
      const arrived = new Map<string, number>();
      for (let d = 1; d <= MAX_DRAWS && arrived.size < tracked.length; d++) {
        const pick = drawFromPool(pool, rng, b => computeIdentityBias(b, state));
        if (!pick) break;
        if (tracked.includes(pick.beatId) && !arrived.has(pick.beatId)) arrived.set(pick.beatId, d);
        if (pick.kind !== 'selection') pool = pool.filter(b => b !== pick);
      }
      for (const id of tracked) {
        sum += arrived.get(id) ?? MAX_DRAWS;
        n++;
      }
    }
    return sum / n;
  }

  it('Monte Carlo: the showcase god\'s investment beats arrive within 20% of the Shepherd\'s', () => {
    const shepherd = meanInvestmentArrival(SHEPHERD, 300, 1771);
    const showcase = meanInvestmentArrival(SHOWCASE, 300, 1771);
    expect(Math.abs(showcase - shepherd) / shepherd).toBeLessThan(0.2);
  });
});
