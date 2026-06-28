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
  BEAT_SPHERE_BIAS_PRIMARY,
  BEAT_SPHERE_BIAS_SECONDARY,
} from '../../data/ascendant-beat-content';
import { clearTraces, enableTracing, disableTracing } from '../traceBuffer';
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
    const state = stateWith(buildGraph({ ascendantProps: { domainAffinities: { veil: 0.5 } } }), emptyBeats());
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
    const props = { domainAffinities: { veil: 1 }, sphereAlignment: { primary: 'mind', secondary: 'spirit' } };
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
    const state = stateWith(buildGraph({ ascendantProps: { domainAffinities: { veil: 1 } } }), emptyBeats());

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
