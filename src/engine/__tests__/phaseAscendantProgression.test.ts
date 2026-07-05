import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseAscendantProgression,
  accruePlayerReachPractice,
  getAscendantProgress,
} from '../phaseAscendantProgression';
import { computeCapability, computeTier } from '../domainCapability';
import {
  createInitialAscendantBeatState,
  getBeatDefinitionById,
  resolvePendingBeat,
} from '../ascendantBeat';
import {
  deepeningBeatIdForReach,
  SOURCE_MILESTONE_BEAT_ID,
  MILESTONE_SOURCES_FOR_BEAT,
} from '../../data/player-progression';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState, PendingBeat } from '../../types/ascendantBeat';
import type { ReachDomain } from '../../types/traits';
import type { SourceTier } from '../../types/essenceSource';

// ─── Fixtures ────────────────────────────────────────────────────────────────

interface AscendantOpts {
  domainAffinities?: Partial<Record<ReachDomain, number>>;
  domainCapabilities?: Partial<Record<ReachDomain, number>>;
  reachPractice?: Partial<Record<ReachDomain, number>>;
  reachTierSnapshot?: Partial<Record<ReachDomain, number>>;
}

/** Build a GameState with an ascendant node and a (spine-exhausted) beat state. */
function progressionState(
  tick: number,
  asc: AscendantOpts,
  beats?: AscendantBeatState,
): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'asc-1',
    type: 'actor',
    name: 'The God',
    properties: {
      actorType: 'ascendant',
      domainAffinities: asc.domainAffinities ?? { iron: 5, gold: 3 },
      ...(asc.domainCapabilities ? { domainCapabilities: asc.domainCapabilities } : {}),
      ...(asc.reachPractice ? { reachPractice: asc.reachPractice } : {}),
      ...(asc.reachTierSnapshot ? { reachTierSnapshot: asc.reachTierSnapshot } : {}),
    },
  });
  // Default beat state: spine exhausted, nothing pending → Deepening enqueue allowed.
  const beatState: AscendantBeatState =
    beats ?? { ...createInitialAscendantBeatState(), spineCursor: -1 };
  return {
    tick,
    seed: 42,
    ascendantId: 'asc-1',
    graph,
    ascendantBeats: beatState,
  } as unknown as GameState;
}

function ascProps(state: GameState) {
  return state.graph.getNode('asc-1')!.properties as {
    reachPractice?: Partial<Record<ReachDomain, number>>;
    reachTierSnapshot?: Partial<Record<ReachDomain, number>>;
    sourceMilestoneFired?: boolean;
  };
}

/** Add a controlled essence source (host + `controls` edge) to the ascendant's graph. */
function addControlledSource(state: GameState, id: string, tier: SourceTier = 'dormant'): void {
  state.graph.addNode({
    id,
    type: 'location',
    name: id,
    properties: {
      locationType: 'location',
      essenceSource: { kind: 'placeOfPower', sanctity: 0.1, tier, originTick: 0 },
    },
  });
  state.graph.addEdge({
    id: `edge.controls_${id}`,
    source: 'asc-1',
    target: id,
    type: 'controls',
    properties: {},
  });
}

/**
 * Snapshot the current derived tiers for the given reaches, so a milestone-focused
 * fixture never *also* fires a Deepening beat (the Deepening loop seeds/advances the
 * snapshot; pre-seeding it to the live tier keeps the milestone the only enqueue).
 */
function liveTierSnapshot(
  affinities: Partial<Record<ReachDomain, number>>,
  caps?: Partial<Record<ReachDomain, number>>,
): Partial<Record<ReachDomain, number>> {
  const probe = progressionState(0, { domainAffinities: affinities, domainCapabilities: caps });
  const snap: Partial<Record<ReachDomain, number>> = {};
  for (const reach of Object.keys(affinities) as ReachDomain[]) {
    snap[reach] = computeTier(computeCapability(probe.graph, 'asc-1', reach));
  }
  return snap;
}

// ─── Snapshot seeding ────────────────────────────────────────────────────────

describe('phaseAscendantProgression — snapshot seeding', () => {
  it('seeds reachTierSnapshot from the current tier on first run and fires no beat', () => {
    const state = progressionState(10, { domainCapabilities: { iron: 8, gold: 3 } });
    const result = phaseAscendantProgression(state);

    // No enqueue on the seeding tick.
    expect(result.ascendantBeats).toBeUndefined();
    // Both permanent reaches seeded to their live tier.
    const snap = ascProps(state).reachTierSnapshot!;
    expect(snap.iron).toBe(computeTier(computeCapability(state.graph, 'asc-1', 'iron')));
    expect(snap.gold).toBe(computeTier(computeCapability(state.graph, 'asc-1', 'gold')));
  });
});

// ─── Tier crossing → exactly one enqueue (the contract test) ─────────────────

describe('phaseAscendantProgression — tier crossing enqueues exactly one Deepening beat', () => {
  it('enqueues one Deepening beat for the crossed reach and advances its snapshot one step', () => {
    // iron sits at a high tier; snapshot lags at 1 → one upward crossing. gold does not move.
    const goldTierNow = (() => {
      const s = progressionState(20, { domainCapabilities: { iron: 12, gold: 3 } });
      return computeTier(computeCapability(s.graph, 'asc-1', 'gold'));
    })();
    const state = progressionState(20, {
      domainCapabilities: { iron: 12, gold: 3 },
      reachTierSnapshot: { iron: 1, gold: goldTierNow },
    });

    const result = phaseAscendantProgression(state);

    // Exactly one beat pending, and it is the iron Deepening beat.
    const pending = result.ascendantBeats?.pending as PendingBeat;
    expect(pending).toBeTruthy();
    expect(pending.beatId).toBe(deepeningBeatIdForReach('iron'));
    expect(pending.kind).toBe('deepening');
    expect(pending.boundNodeIds).toEqual(['asc-1']);

    // Snapshot advanced by ONE step (1 → 2), not straight to the live tier.
    const snap = ascProps(state).reachTierSnapshot!;
    expect(snap.iron).toBe(2);
    // gold did not cross → unchanged.
    expect(snap.gold).toBe(goldTierNow);
  });

  it('caps at one Deepening enqueue per tick even when both reaches cross', () => {
    const state = progressionState(20, {
      domainCapabilities: { iron: 12, gold: 12 },
      reachTierSnapshot: { iron: 1, gold: 1 },
      domainAffinities: { iron: 5, gold: 3 }, // iron ranked primary
    });

    const result = phaseAscendantProgression(state);

    // Only the primary (iron) enqueues; gold retries next tick (snapshot untouched).
    expect(result.ascendantBeats?.pending?.beatId).toBe(deepeningBeatIdForReach('iron'));
    const snap = ascProps(state).reachTierSnapshot!;
    expect(snap.iron).toBe(2);
    expect(snap.gold).toBe(1);
  });
});

// ─── Gating: spine active + pending occupied ─────────────────────────────────

describe('phaseAscendantProgression — enqueue gating', () => {
  it('does not enqueue while the onboarding spine is still active', () => {
    const state = progressionState(
      20,
      { domainCapabilities: { iron: 12, gold: 3 }, reachTierSnapshot: { iron: 1, gold: 1 } },
      { ...createInitialAscendantBeatState(), spineCursor: 0 }, // spine active
    );
    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats).toBeUndefined();
    // Snapshot left unchanged → the crossing is re-detected after the spine finishes.
    expect(ascProps(state).reachTierSnapshot!.iron).toBe(1);
  });

  it('does not overwrite an already-pending beat (max-one-pending invariant)', () => {
    const occupied: PendingBeat = {
      beatId: 'beat.spine.the_seat',
      kind: 'spine',
      offeredTurn: 19,
      boundNodeIds: [],
      trigger: { kind: 'turn' },
    };
    const state = progressionState(
      20,
      { domainCapabilities: { iron: 12, gold: 3 }, reachTierSnapshot: { iron: 1, gold: 1 } },
      { ...createInitialAscendantBeatState(), spineCursor: -1, pending: occupied },
    );
    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats).toBeUndefined();
    expect(ascProps(state).reachTierSnapshot!.iron).toBe(1);
  });
});

// ─── Fail-soft ───────────────────────────────────────────────────────────────

describe('phaseAscendantProgression — fail-soft', () => {
  it('no-ops when the ascendant has no permanent reaches', () => {
    const state = progressionState(20, { domainAffinities: {} });
    expect(phaseAscendantProgression(state)).toEqual({});
  });

  it('no-ops when the ascendant node is missing', () => {
    const state = progressionState(20, {});
    state.graph.removeNode('asc-1');
    expect(phaseAscendantProgression(state)).toEqual({});
  });
});

// ─── Practice accrual ────────────────────────────────────────────────────────

describe('accruePlayerReachPractice', () => {
  it('grows reachPractice for an in-domain reach and raises capability', () => {
    const state = progressionState(5, { domainAffinities: { iron: 5, gold: 3 } });
    const capBefore = computeCapability(state.graph, 'asc-1', 'iron');
    const total = accruePlayerReachPractice(state.graph, 'asc-1', 'iron', 0.5, 5);
    expect(total).not.toBeNull();
    expect(total!).toBeGreaterThan(0);
    expect(ascProps(state).reachPractice!.iron).toBeCloseTo(total!, 6);
    // Practice feeds the same sigmoid → capability strictly rises.
    expect(computeCapability(state.graph, 'asc-1', 'iron')).toBeGreaterThan(capBefore);
  });

  it('does not accrue for an off-domain reach (returns null, leaves the bag untouched)', () => {
    const state = progressionState(5, { domainAffinities: { iron: 5, gold: 3 } });
    const result = accruePlayerReachPractice(state.graph, 'asc-1', 'star', 0.5, 5);
    expect(result).toBeNull();
    expect(ascProps(state).reachPractice?.star).toBeUndefined();
  });

  it('accrues the secondary reach more slowly than the primary at equal difficulty', () => {
    const primary = progressionState(5, { domainAffinities: { iron: 5, gold: 3 } });
    const secondary = progressionState(5, { domainAffinities: { iron: 5, gold: 3 } });
    const ironGain = accruePlayerReachPractice(primary.graph, 'asc-1', 'iron', 0.5, 5)!;
    const goldGain = accruePlayerReachPractice(secondary.graph, 'asc-1', 'gold', 0.5, 5)!;
    expect(goldGain).toBeLessThan(ironGain);
  });
});

// ─── Axis-B source milestone (Slice 2b) ──────────────────────────────────────

describe('phaseAscendantProgression — essence-source breadth milestone', () => {
  const AFF = { iron: 5, gold: 3 };

  it('enqueues the milestone beat exactly once at MILESTONE_SOURCES_FOR_BEAT controlled sources', () => {
    const state = progressionState(30, { domainAffinities: AFF, reachTierSnapshot: liveTierSnapshot(AFF) });
    for (let i = 0; i < MILESTONE_SOURCES_FOR_BEAT; i++) addControlledSource(state, `src-${i}`);

    const result = phaseAscendantProgression(state);

    const pending = result.ascendantBeats?.pending as PendingBeat;
    expect(pending?.beatId).toBe(SOURCE_MILESTONE_BEAT_ID);
    expect(pending.kind).toBe('milestone');
    expect(pending.boundNodeIds).toEqual(['asc-1']);
    // One-shot latch set; a milestone chronicle line written.
    expect(ascProps(state).sourceMilestoneFired).toBe(true);
    expect(result.chronicleEntries?.some(e => e.id === 'milestone-sources-30')).toBe(true);
  });

  it('fires on the first flowering source even below the count threshold', () => {
    const state = progressionState(30, { domainAffinities: AFF, reachTierSnapshot: liveTierSnapshot(AFF) });
    addControlledSource(state, 'src-flower', 'flowering'); // 1 source < threshold, but flowering

    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats?.pending?.beatId).toBe(SOURCE_MILESTONE_BEAT_ID);
    expect(ascProps(state).sourceMilestoneFired).toBe(true);
  });

  it('does not re-fire once the latch is set', () => {
    const state = progressionState(30, {
      domainAffinities: AFF,
      reachTierSnapshot: liveTierSnapshot(AFF),
    });
    for (let i = 0; i < MILESTONE_SOURCES_FOR_BEAT; i++) addControlledSource(state, `src-${i}`);
    // Pre-latch: milestone already fired earlier this run.
    state.graph.getNode('asc-1')!.properties.sourceMilestoneFired = true;

    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats).toBeUndefined();
  });

  it('does not fire below the threshold with no flowering source', () => {
    const state = progressionState(30, { domainAffinities: AFF, reachTierSnapshot: liveTierSnapshot(AFF) });
    addControlledSource(state, 'src-0'); // 1 dormant source, threshold is 3
    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats).toBeUndefined();
    expect(ascProps(state).sourceMilestoneFired).toBeUndefined();
  });

  it('yields the tick to a Deepening beat when both fire, leaving the milestone latch unset', () => {
    // iron crosses a tier (snapshot lags) AND the source milestone is reached.
    const state = progressionState(30, {
      domainAffinities: AFF,
      domainCapabilities: { iron: 12, gold: 3 },
      reachTierSnapshot: { iron: 1, gold: computeTier(computeCapability(
        progressionState(0, { domainAffinities: AFF, domainCapabilities: { iron: 12, gold: 3 } }).graph,
        'asc-1', 'gold',
      )) },
    });
    for (let i = 0; i < MILESTONE_SOURCES_FOR_BEAT; i++) addControlledSource(state, `src-${i}`);

    const result = phaseAscendantProgression(state);
    // Deepening wins the single pending slot; the milestone waits (latch unset → retries next tick).
    expect(result.ascendantBeats?.pending?.beatId).toBe(deepeningBeatIdForReach('iron'));
    expect(ascProps(state).sourceMilestoneFired).toBeUndefined();
  });

  it('the enqueued milestone beat resolves through the catalogue, granting nothing', () => {
    const def = getBeatDefinitionById(SOURCE_MILESTONE_BEAT_ID);
    expect(def?.kind).toBe('milestone');
    expect(def?.grantsActionIds ?? []).toEqual([]);

    const pending: PendingBeat = {
      beatId: SOURCE_MILESTONE_BEAT_ID,
      kind: 'milestone',
      offeredTurn: 30,
      boundNodeIds: ['asc-1'],
      trigger: { kind: 'turn', minTurn: 30 },
    };
    const state = progressionState(
      31,
      { domainAffinities: AFF },
      { ...createInitialAscendantBeatState(), spineCursor: -1, pending },
    );
    const res = resolvePendingBeat(state);
    expect(res.resolved).toBe(true);
    expect(res.grantedActionIds).toEqual([]);
    expect(res.state.ascendantBeats?.pending).toBeNull();
    expect(res.state.ascendantBeats?.history.some(h => h.beatId === SOURCE_MILESTONE_BEAT_ID)).toBe(true);
  });
});

// ─── Debug readout ───────────────────────────────────────────────────────────

describe('getAscendantProgress', () => {
  it('reports per-reach practice, tier, snapshot, and the pending Deepening flag', () => {
    const pending: PendingBeat = {
      beatId: deepeningBeatIdForReach('iron'),
      kind: 'deepening',
      offeredTurn: 20,
      boundNodeIds: ['asc-1'],
      trigger: { kind: 'turn', minTurn: 20 },
    };
    const state = progressionState(
      20,
      {
        domainAffinities: { iron: 5, gold: 3 },
        reachPractice: { iron: 2 },
        reachTierSnapshot: { iron: 2, gold: 1 },
      },
      { ...createInitialAscendantBeatState(), spineCursor: -1, pending },
    );
    const report = getAscendantProgress(state)!;
    expect(report.pendingBeatId).toBe(deepeningBeatIdForReach('iron'));
    const iron = report.reaches.find(r => r.reach === 'iron')!;
    expect(iron.isPrimary).toBe(true);
    expect(iron.rawPractice).toBe(2);
    expect(iron.pendingDeepening).toBe(true);
    const gold = report.reaches.find(r => r.reach === 'gold')!;
    expect(gold.isPrimary).toBe(false);
    expect(gold.pendingDeepening).toBe(false);
    // Axis-B portfolio readout (Slice 2b): no sources controlled, milestone unfired.
    expect(report.controlledSources).toBe(0);
    expect(report.sourceMilestoneFired).toBe(false);
  });

  it('reports controlled sources and the milestone latch (Axis-B readout)', () => {
    const state = progressionState(30, { domainAffinities: { iron: 5, gold: 3 } });
    addControlledSource(state, 'src-a');
    addControlledSource(state, 'src-b');
    state.graph.getNode('asc-1')!.properties.sourceMilestoneFired = true;
    const report = getAscendantProgress(state)!;
    expect(report.controlledSources).toBe(2);
    expect(report.sourceMilestoneFired).toBe(true);
  });
});
