/**
 * Milestone (breadth) beat contract tests — THR-613 Slice 2b, plan §4.2.
 *
 * The Done-when: the essence-source milestone fires exactly once per run, at
 * `MILESTONE_SOURCES_FOR_BEAT` controlled sources OR the first flowering source,
 * grants a real card, resolves through the catalogue (never `missing_template`),
 * and never steals the tick from a Deepening.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseAscendantProgression } from '../phaseAscendantProgression';
import { countControlledSources } from '../essenceSources';
import { createInitialAscendantBeatState, getBeatDefinitionById } from '../ascendantBeat';
import {
  MILESTONE_SOURCES_FOR_BEAT,
  MILESTONE_FLOWERING_FOR_BEAT,
  MILESTONE_SOURCE_BEAT_ID,
  deepeningBeatIdForReach,
} from '../../data/player-progression';
import { ASCENDANT_MILESTONE_BEATS } from '../../data/ascendant-milestone-beats';
import {
  ASCENDANT_ACTION_BUCKETS,
  ASCENDANT_SPINE,
  ASCENDANT_BEAT_POOL,
} from '../../data/ascendant-beat-content';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState } from '../../types/ascendantBeat';
import type { EssenceSource, SourceTier } from '../../types/essenceSource';
import type { ReachDomain } from '../../types/traits';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ASC = 'asc-1';

function addSource(graph: WorldGraph, id: string, tier: SourceTier): void {
  const src: EssenceSource = {
    kind: 'shrine',
    sphereAffinity: 'force',
    sanctity: tier === 'flowering' ? 1 : 0,
    tier,
  };
  graph.addNode({
    id,
    type: 'location',
    name: id,
    properties: { locationType: 'location', essenceSource: src },
  });
  graph.addEdge({
    id: `edge.controls_${id}`,
    source: ASC,
    target: id,
    type: 'controls',
    properties: {},
  });
}

interface StateOpts {
  /** Sources to attach, by tier. */
  sources?: SourceTier[];
  /** Pre-fired milestone ids (dedup bookkeeping). */
  milestoneBeatsFired?: string[];
  /** Snapshot — omit to let the phase seed it (which suppresses a Deepening). */
  reachTierSnapshot?: Partial<Record<ReachDomain, number>>;
  domainCapabilities?: Partial<Record<ReachDomain, number>>;
  beats?: AscendantBeatState;
}

function milestoneState(tick: number, opts: StateOpts = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASC,
    type: 'actor',
    name: 'The God',
    properties: {
      actorType: 'ascendant',
      domainAffinities: { iron: 5, gold: 3 },
      ...(opts.domainCapabilities ? { domainCapabilities: opts.domainCapabilities } : {}),
      // Seeded by default so the Deepening path is quiet and the milestone is isolated.
      reachTierSnapshot: opts.reachTierSnapshot ?? { iron: 1, gold: 1 },
      ...(opts.milestoneBeatsFired ? { milestoneBeatsFired: opts.milestoneBeatsFired } : {}),
    },
  });
  (opts.sources ?? []).forEach((tier, i) => addSource(graph, `loc.src-${i}`, tier));
  return {
    tick,
    seed: 42,
    ascendantId: ASC,
    graph,
    ascendantBeats: opts.beats ?? { ...createInitialAscendantBeatState(), spineCursor: -1 },
  } as unknown as GameState;
}

const props = (state: GameState) =>
  state.graph.getNode(ASC)!.properties as { milestoneBeatsFired?: readonly string[] };

// ─── countControlledSources ──────────────────────────────────────────────────

describe('countControlledSources', () => {
  it('counts controlled sources and splits out the flowering ones', () => {
    const state = milestoneState(10, { sources: ['dormant', 'flowering', 'contested'] });
    expect(countControlledSources(state.graph, ASC)).toEqual({ total: 3, flowering: 1 });
  });

  it('fail-soft: unknown ascendant → zero, never throws', () => {
    const state = milestoneState(10, { sources: ['flowering'] });
    expect(countControlledSources(state.graph, 'nobody')).toEqual({ total: 0, flowering: 0 });
  });

  it('ignores controlled hosts that carry no source bag', () => {
    const state = milestoneState(10);
    state.graph.addNode({
      id: 'loc.plain',
      type: 'location',
      name: 'plain',
      properties: { locationType: 'location' },
    });
    state.graph.addEdge({
      id: 'e1', source: ASC, target: 'loc.plain', type: 'controls', properties: {},
    });
    expect(countControlledSources(state.graph, ASC)).toEqual({ total: 0, flowering: 0 });
  });
});

// ─── Firing thresholds ───────────────────────────────────────────────────────

describe('essence-source milestone — thresholds', () => {
  it('does not fire below either threshold', () => {
    // Two dormant sources: under the count threshold, no flowering.
    const state = milestoneState(10, { sources: ['dormant', 'dormant'] });
    expect(MILESTONE_SOURCES_FOR_BEAT).toBeGreaterThan(2); // guards the fixture
    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats).toBeUndefined();
    expect(props(state).milestoneBeatsFired).toBeUndefined();
  });

  it('fires at MILESTONE_SOURCES_FOR_BEAT controlled sources', () => {
    const sources: SourceTier[] = Array(MILESTONE_SOURCES_FOR_BEAT).fill('dormant');
    const state = milestoneState(10, { sources });
    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats?.pending?.beatId).toBe(MILESTONE_SOURCE_BEAT_ID);
    expect(result.ascendantBeats?.pending?.kind).toBe('milestone');
  });

  it('fires on the first flowering source alone, below the count threshold', () => {
    const state = milestoneState(10, { sources: ['flowering'] });
    expect(MILESTONE_FLOWERING_FOR_BEAT).toBe(1);
    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats?.pending?.beatId).toBe(MILESTONE_SOURCE_BEAT_ID);
  });

  it('writes exactly one chronicle entry alongside the beat', () => {
    const state = milestoneState(10, { sources: ['flowering'] });
    const result = phaseAscendantProgression(state);
    expect(result.chronicleEntries).toHaveLength(1);
    expect(result.chronicleEntries![0].prose).not.toMatch(/\d/); // narrated, never counted
  });
});

// ─── Dedup ───────────────────────────────────────────────────────────────────

describe('essence-source milestone — fires once per run', () => {
  it('records the fired id at enqueue time', () => {
    const state = milestoneState(10, { sources: ['flowering'] });
    phaseAscendantProgression(state);
    expect(props(state).milestoneBeatsFired).toEqual([MILESTONE_SOURCE_BEAT_ID]);
  });

  it('does not re-fire once recorded, even with the threshold still met', () => {
    const state = milestoneState(10, {
      sources: ['flowering', 'flowering'],
      milestoneBeatsFired: [MILESTONE_SOURCE_BEAT_ID],
    });
    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats).toBeUndefined();
    expect(result.chronicleEntries).toBeUndefined();
  });

  it('does not re-fire on a later tick after firing (dedup survives the pending clearing)', () => {
    const state = milestoneState(10, { sources: ['flowering'] });
    phaseAscendantProgression(state);
    // Simulate the player resolving the beat: pending clears, threshold still met.
    state.ascendantBeats = { ...createInitialAscendantBeatState(), spineCursor: -1 };
    (state as { tick: number }).tick = 11;
    expect(phaseAscendantProgression(state).ascendantBeats).toBeUndefined();
  });
});

// ─── Priority vs. Deepening ──────────────────────────────────────────────────

describe('essence-source milestone — yields to a Deepening', () => {
  it('a Deepening wins the tick; the milestone does not fire and stays unrecorded', () => {
    // Snapshot below the live tier → a Deepening crossing is pending, and the
    // milestone threshold is met at the same time.
    const state = milestoneState(10, {
      sources: ['flowering'],
      domainCapabilities: { iron: 8, gold: 3 },
      reachTierSnapshot: { iron: 0, gold: 0 },
    });
    const result = phaseAscendantProgression(state);
    expect(result.ascendantBeats?.pending?.beatId).toBe(deepeningBeatIdForReach('iron'));
    // Not recorded → it re-detects next tick rather than being lost.
    expect(props(state).milestoneBeatsFired).toBeUndefined();
  });

  it('never enqueues while a beat is already pending', () => {
    const state = milestoneState(10, {
      sources: ['flowering'],
      beats: {
        ...createInitialAscendantBeatState(),
        spineCursor: -1,
        pending: {
          beatId: 'beat.pool.intro.first_stirring',
          kind: 'introduction',
          offeredTurn: 9,
          boundNodeIds: [],
          trigger: { kind: 'cadence' },
        },
      },
    });
    expect(phaseAscendantProgression(state).ascendantBeats).toBeUndefined();
    expect(props(state).milestoneBeatsFired).toBeUndefined();
  });

  it('never enqueues while the onboarding spine is still running', () => {
    const state = milestoneState(10, {
      sources: ['flowering'],
      beats: { ...createInitialAscendantBeatState(), spineCursor: 0 },
    });
    expect(phaseAscendantProgression(state).ascendantBeats).toBeUndefined();
  });
});

// ─── Catalogue + grant ───────────────────────────────────────────────────────

describe('milestone beat catalogue', () => {
  it('the enqueued beat resolves through the catalogue (never missing_template)', () => {
    // The exact bug Slice 2 fixed for Deepening: an enqueued beat with no catalogue
    // entry is skipped by resolvePendingBeat and the vignette is silently lost.
    expect(getBeatDefinitionById(MILESTONE_SOURCE_BEAT_ID)).not.toBeNull();
  });

  it('grants a real, bucketed UnifiedActionTemplate', () => {
    const granted = ASCENDANT_MILESTONE_BEATS.flatMap(b => b.grantsActionIds ?? []);
    expect(granted.length).toBeGreaterThan(0);
    const realIds = new Set(UNIFIED_ACTION_TEMPLATES.map(t => t.id));
    for (const id of granted) {
      expect(realIds.has(id), `granted "${id}" has no template`).toBe(true);
      expect(ASCENDANT_ACTION_BUCKETS[id], `granted "${id}" has no bucket`).toBeDefined();
    }
  });

  it('grants only cards no other beat already hands out (no fake reveal)', () => {
    // A milestone that re-offers a held card lies to the player — the reason the
    // Deepening beats grant nothing at all (see ascendant-milestone-beats.ts GRANT NOTE).
    const milestoneIds = ASCENDANT_MILESTONE_BEATS.flatMap(b => b.grantsActionIds ?? []);
    const otherIds = new Set(
      [...ASCENDANT_SPINE, ...ASCENDANT_BEAT_POOL].flatMap(b => b.grantsActionIds ?? []),
    );
    for (const id of milestoneIds) {
      expect(otherIds.has(id), `"${id}" is already granted by another beat`).toBe(false);
    }
  });
});
