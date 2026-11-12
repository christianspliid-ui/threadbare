/**
 * THR-2198 item 2 — "She takes the trouble said to be waiting on because it fits how she
 * moves through the world" (round-7 cold playtest). Two faults: a clause that strands the
 * particle of "take on" after the matter, and a Crossroads row that named the place
 * ("at Sacred Grove") while its line fell back to the no-place matter pool.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PULL_CLAUSES,
  MATTER_NO_PLACE,
  MOTIVE_CLAUSES,
  MOTIVE_CLAUSES_BY_REACH,
  STAKE_CLAUSES,
  DEFAULT_STAKE_CLAUSES,
} from '../../../data/foreshadowing-content';
import { getEncounterForeshadowingById } from '../encounterForeshadowing';
import { createSimulationRuntime, type SimulationRuntime } from '../../simulationRuntime';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { MotiveReceipt } from '../../../types/foreshadowing';

const ALL_CLAUSES: string[] = [
  ...DEFAULT_PULL_CLAUSES,
  ...Object.values(MOTIVE_CLAUSES).flat(),
  ...Object.values(MOTIVE_CLAUSES_BY_REACH).flatMap(byReach => Object.values(byReach ?? {}).flat()),
  ...Object.values(STAKE_CLAUSES).flat(),
  ...DEFAULT_STAKE_CLAUSES,
] as string[];

describe('THR-2198 — no clause strands a particle after {matter}', () => {
  it('no authored clause reads "{matter} on"', () => {
    const offenders = ALL_CLAUSES.filter(c => /\{matter\} on\b/.test(c));
    expect(offenders).toEqual([]);
  });

  it('the personality clause reads "take on {matter}"', () => {
    expect(MOTIVE_CLAUSES.personality).toContain('{Subject} {v:take} on {matter} because it fits how {subject} {v:move} through the world.');
  });
});

describe('THR-2198 — the by-id resolver grounds the matter at a named place', () => {
  const ENCOUNTER = 'encounter.thr2198_no_template'; // no template → no authored variant
  let runtime: SimulationRuntime;
  beforeEach(() => { runtime = createSimulationRuntime(); });

  function stateFor(agentIds: string[]): GameState {
    const graph = new WorldGraph();
    for (const id of agentIds) {
      const receipt: MotiveReceipt = {
        templateId: ENCOUNTER,
        locationId: 'grove',
        contributions: [{ kind: 'personality', weight: 0.8 }],
        intelTier: 'briefed',
        expectation: 'perilous',
        dominantReach: 'iron',
        decidedAtTick: 12,
      };
      graph.addNode({ id, type: 'actor', name: `Seren ${id}`, properties: { gender: 'female', motiveReceipt: receipt } });
    }
    return { graph, intelligenceRecords: [], unifiedActions: [], tick: 20 } as unknown as GameState;
  }

  it('with a place name, no line falls to the no-place pool and some line names the place', () => {
    const ids = Array.from({ length: 24 }, (_, i) => `a${i}`);
    const state = stateFor(ids);
    const proses = ids.map(id => getEncounterForeshadowingById(state, id, ENCOUNTER, 20, runtime, 'Sacred Grove').prose);
    for (const p of proses) for (const phrase of MATTER_NO_PLACE) expect(p).not.toContain(phrase);
    expect(proses.some(p => p.includes('what stirs at Sacred Grove'))).toBe(true);
  });

  it('the place is part of the cache key — a grounded call is not served the ungrounded one', () => {
    const state = stateFor(['a0']);
    const bare = getEncounterForeshadowingById(state, 'a0', ENCOUNTER, 20, runtime);
    const grounded = getEncounterForeshadowingById(state, 'a0', ENCOUNTER, 20, runtime, 'Sacred Grove');
    expect(grounded).not.toBe(bare);
  });
});
