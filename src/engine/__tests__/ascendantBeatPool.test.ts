import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseAscendantBeatDirector,
  drawFromPool,
  resolveAscendantBeat,
} from '../ascendantBeat';
import {
  ASCENDANT_SPINE,
  ASCENDANT_BEAT_POOL,
  ASCENDANT_ACTION_BUCKETS,
  collectGrantedActionIds,
  BEAT_KIND_WEIGHTS,
} from '../../data/ascendant-beat-content';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState } from '../../types/ascendantBeat';

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

/**
 * Build a graph with enough world state for the pool's eligibility predicates (THR-516)
 * to pass: a few un-introduced culture/faction groups (so `introduction` beats are
 * eligible) and some unthreaded actors/locations (so `investment` beats are eligible).
 */
function seededGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc-1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'culture-1', type: 'actor', name: 'Culture A', properties: { actorType: 'culture' } });
  g.addNode({ id: 'culture-2', type: 'actor', name: 'Culture B', properties: { actorType: 'culture' } });
  g.addNode({ id: 'faction-1', type: 'actor', name: 'Faction A', properties: { actorType: 'faction' } });
  g.addNode({ id: 'faction-2', type: 'actor', name: 'Faction B', properties: { actorType: 'faction' } });
  g.addNode({ id: 'mortal-1', type: 'actor', name: 'Mortal A', properties: { actorType: 'individual' } });
  g.addNode({ id: 'mortal-2', type: 'actor', name: 'Mortal B', properties: { actorType: 'individual' } });
  g.addNode({ id: 'loc-1', type: 'location', name: 'Place A', properties: {} });
  g.addNode({ id: 'loc-2', type: 'location', name: 'Place B', properties: {} });
  return g;
}

function directorState(tick: number, beats: AscendantBeatState, graph: WorldGraph = seededGraph()): GameState {
  return {
    tick,
    seed: 42,
    ascendantId: 'asc-1',
    graph,
    ascendantBeats: beats,
  } as unknown as GameState;
}

/** A Director state with the scripted spine already exhausted, ready for pool draws. */
function spineExhausted(lastBeatTurn = -100): AscendantBeatState {
  return { spineCursor: -1, pending: null, history: [], lastBeatTurn };
}

const REAL_TEMPLATE_IDS = new Set(UNIFIED_ACTION_TEMPLATES.map(t => t.id));

describe('Ascendant Beat starter pool + unlock catalogue (THR-505)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('ships a non-empty starter pool in the ~12–20 range', () => {
    expect(ASCENDANT_BEAT_POOL.length).toBeGreaterThanOrEqual(12);
    expect(ASCENDANT_BEAT_POOL.length).toBeLessThanOrEqual(20);
  });

  it('every pool beat is drawable (cadence trigger + a weighted kind) with a unique id', () => {
    const ids = new Set<string>();
    for (const beat of ASCENDANT_BEAT_POOL) {
      expect(beat.trigger.kind).toBe('cadence');
      // Pool beats are introduction/investment/selection; delivery is THR-506's job.
      expect(['introduction', 'investment', 'selection']).toContain(beat.kind);
      // A weighted kind so drawFromPool never assigns weight 0 and skips it.
      expect(BEAT_KIND_WEIGHTS[beat.kind]).toBeGreaterThan(0);
      expect(ids.has(beat.beatId)).toBe(false);
      ids.add(beat.beatId);
    }
  });

  it('no beatId collides between the spine and the pool', () => {
    const spineIds = new Set(ASCENDANT_SPINE.map(b => b.beatId));
    for (const beat of ASCENDANT_BEAT_POOL) {
      expect(spineIds.has(beat.beatId)).toBe(false);
    }
  });

  it('drawFromPool yields broad variety across seeded rolls (≥3 distinct)', () => {
    const rng = mulberry32(42);
    const drawn = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const def = drawFromPool(ASCENDANT_BEAT_POOL, rng);
      if (def) drawn.add(def.beatId);
    }
    expect(drawn.size).toBeGreaterThanOrEqual(3);
  });

  it('Director draws ≥3 distinct pool beats across a 60-tick run (Done-when)', () => {
    // Mimic the runtime loop: spine exhausted, and each offered beat is resolved
    // (player enters + resolves) so the next cadence window can draw again.
    const rng = mulberry32(42);
    let beats = spineExhausted(-10);
    const drawn: string[] = [];

    for (let turn = 1; turn <= 60; turn++) {
      const result = phaseAscendantBeatDirector(directorState(turn, beats), rng);
      const next = result.ascendantBeats;
      if (next?.pending) {
        drawn.push(next.pending.beatId);
        // Resolve immediately to clear the max-one-pending gate for the next window.
        beats = resolveAscendantBeat(next, { outcome: 'success', turn });
      } else if (next) {
        beats = next;
      }
    }

    expect(drawn.length).toBeGreaterThanOrEqual(3);
    expect(new Set(drawn).size).toBeGreaterThanOrEqual(3);
    // Determinism: the same seed reproduces the same schedule.
    const rng2 = mulberry32(42);
    let beats2 = spineExhausted(-10);
    const drawn2: string[] = [];
    for (let turn = 1; turn <= 60; turn++) {
      const result = phaseAscendantBeatDirector(directorState(turn, beats2), rng2);
      const next = result.ascendantBeats;
      if (next?.pending) {
        drawn2.push(next.pending.beatId);
        beats2 = resolveAscendantBeat(next, { outcome: 'success', turn });
      } else if (next) {
        beats2 = next;
      }
    }
    expect(drawn2).toEqual(drawn);
  });

  it('the unlock catalogue covers every action any beat can grant', () => {
    const granted = collectGrantedActionIds();
    expect(granted.length).toBeGreaterThan(0);
    for (const id of granted) {
      expect(ASCENDANT_ACTION_BUCKETS[id], `missing bucket for granted action "${id}"`).toBeDefined();
    }
  });

  it('every granted action id resolves to a real UnifiedActionTemplate', () => {
    for (const id of collectGrantedActionIds()) {
      expect(REAL_TEMPLATE_IDS.has(id), `granted action "${id}" has no template`).toBe(true);
    }
  });

  it('every bucketed action id resolves to a real UnifiedActionTemplate', () => {
    for (const id of Object.keys(ASCENDANT_ACTION_BUCKETS)) {
      expect(REAL_TEMPLATE_IDS.has(id), `bucketed action "${id}" has no template`).toBe(true);
    }
  });

  it('reach-gated bucket entries (if any) declare requiresReach', () => {
    for (const [id, entry] of Object.entries(ASCENDANT_ACTION_BUCKETS)) {
      if (entry.bucket === 'reach-gated') {
        expect(entry.requiresReach, `reach-gated "${id}" needs requiresReach`).toBeDefined();
      }
    }
  });
});
