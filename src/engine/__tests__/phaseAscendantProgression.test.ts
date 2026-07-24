import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseAscendantProgression,
  accruePlayerReachPractice,
  getAscendantProgress,
} from '../phaseAscendantProgression';
import { computeCapability, computeTier } from '../domainCapability';
import { createInitialAscendantBeatState } from '../ascendantBeat';
import { deepeningBeatIdForReach, MILESTONE_COMPANY_BEAT_ID } from '../../data/player-progression';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState, PendingBeat } from '../../types/ascendantBeat';
import type { ReachDomain } from '../../types/traits';

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
  };
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

// ─── Company milestone (THR-74) ──────────────────────────────────────────────

describe('phaseAscendantProgression — company milestone', () => {
  /** Attach a company to the state's graph; thread one member when `threaded`. */
  function addCompany(state: GameState, threaded: boolean): void {
    const g = state.graph;
    g.addNode({
      id: 'grp-1',
      type: 'actor',
      name: 'The Watch of the Nameless Road',
      properties: { actorType: 'group', groupType: 'party', cohesion: 0.55 },
    });
    g.addNode({ id: 'm-1', type: 'actor', name: 'Nareth', properties: { actorType: 'individual' } });
    g.addEdge({ id: 'e.m1', source: 'm-1', target: 'grp-1', type: 'member_of', properties: { role: 'member', rank: 0, joinedTick: 0 } });
    if (threaded) {
      g.addEdge({ id: 'e.thread', source: 'asc-1', target: 'm-1', type: 'thread', properties: {} });
    }
  }

  it('enqueues the company milestone once a threaded company exists', () => {
    const state = progressionState(10, { domainCapabilities: { iron: 8, gold: 3 } });
    // First run seeds the reach snapshot and fires nothing (the seeding tick).
    phaseAscendantProgression(state);
    addCompany(state, true);

    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats?.pending?.beatId).toBe(MILESTONE_COMPANY_BEAT_ID);
    expect(result.ascendantBeats?.pending?.kind).toBe('milestone');
    expect(result.ascendantBeats?.pending?.boundNodeIds).toEqual(['asc-1']);
  });

  it('does not enqueue when the only company is unthreaded', () => {
    const state = progressionState(10, { domainCapabilities: { iron: 8, gold: 3 } });
    phaseAscendantProgression(state);
    addCompany(state, false);

    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats).toBeUndefined();
  });

  it('fires at most once — a second run does not re-enqueue', () => {
    const state = progressionState(10, { domainCapabilities: { iron: 8, gold: 3 } });
    phaseAscendantProgression(state);
    addCompany(state, true);
    phaseAscendantProgression(state); // fires + records in milestoneBeatsFired

    const again = phaseAscendantProgression(state);
    expect(again.ascendantBeats).toBeUndefined();
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
  });
});
