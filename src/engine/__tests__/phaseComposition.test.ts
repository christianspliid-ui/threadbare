import { describe, it, expect } from 'vitest';
import { phaseComposition } from '../phaseComposition';
import type { GameState, ActiveComposition } from '../../types/gameState';
import type { Phase } from '../../composition-dsl/schema';
import { WorldGraph } from '../graph';
import { PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK } from '../../data/composition-config';

// ─── Minimal GameState factory ──────────────────────────────────────

function makeDoomClock(stage: number) {
  return {
    currentStage: stage,
    currentTick: stage * 20,
    totalTicks: 100,
    progress: stage * 0.2,
    stageTransitions: [0, 20, 40, 60, 80],
    expired: false,
  } as unknown as GameState['doomClock'];
}

function makeState(
  compositions: (ActiveComposition & { phases?: Phase[] })[],
  doomStage: number,
  extra: Partial<GameState> = {}
): GameState {
  return {
    tick: 10,
    cycle: 0,
    seed: 42,
    graph: new WorldGraph() as WorldGraph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: 'asc-1',
    essencePool: new Map(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as GameState['doomDefinition'],
    doomClock: makeDoomClock(doomStage),
    doomIdentityMatrix: null,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as GameState['worldSoul'],
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
    activeCompositions: compositions as ActiveComposition[],
    worldFlags: {},
    firedCompositions: [],
    storyBeatQueue: [],
    ...extra,
  } as unknown as GameState;
}

function makeActiveComposition(
  id: string,
  phases: Phase[]
): ActiveComposition & { phases: Phase[] } {
  return {
    compositionId: id,
    firedAtTick: 1,
    activatedPhaseIds: [],
    phaseActivationTicks: {},
    resolvedNodes: {},
    status: 'active',
    lastEvaluationTick: 1,
    phases,
  };
}

function makePhase(id: string, tier: number, activates: string[] = []): Phase {
  return {
    id,
    activatesAt: { op: 'doom-clock', comparator: 'gte', tier },
    activates,
    rationale: `Phase ${id} at tier ${tier}`,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('phaseComposition', () => {
  describe('phase activation order', () => {
    it('activates a phase when doom-clock tier meets the threshold', () => {
      const comp = makeActiveComposition('comp-1', [
        makePhase('p1', 2, ['nodeA']),
        makePhase('p2', 3, ['nodeB']),
      ]);
      const state = makeState([comp], 2);
      const result = phaseComposition(state);
      const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');

      expect(updated?.activatedPhaseIds).toContain('p1');
      expect(updated?.activatedPhaseIds).not.toContain('p2');
    });

    it('activates multiple phases when tier crosses multiple thresholds at once', () => {
      const comp = makeActiveComposition('comp-1', [
        makePhase('p1', 1),
        makePhase('p2', 2),
        makePhase('p3', 4),
      ]);
      const state = makeState([comp], 3);
      const result = phaseComposition(state);
      const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');

      expect(updated?.activatedPhaseIds).toContain('p1');
      expect(updated?.activatedPhaseIds).toContain('p2');
      expect(updated?.activatedPhaseIds).not.toContain('p3');
    });

    it('marks composition completed when all phases are activated', () => {
      const comp = makeActiveComposition('comp-1', [
        makePhase('p1', 1),
        makePhase('p2', 2),
      ]);
      const state = makeState([comp], 3);
      const result = phaseComposition(state);
      const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');

      expect(updated?.status).toBe('completed');
    });

    it('records activation tick on phaseActivationTicks', () => {
      const comp = makeActiveComposition('comp-1', [makePhase('p1', 1)]);
      const state = makeState([comp], 2);
      const result = phaseComposition(state);
      const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');

      expect(updated?.phaseActivationTicks['p1']).toBe(10);
    });

    it('does not re-activate an already-activated phase', () => {
      const comp: ActiveComposition & { phases: Phase[] } = {
        ...makeActiveComposition('comp-1', [makePhase('p1', 1), makePhase('p2', 2)]),
        activatedPhaseIds: ['p1'],
        phaseActivationTicks: { p1: 5 },
      };
      const state = makeState([comp], 2);
      const result = phaseComposition(state);
      const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');

      // p1 should not appear twice
      const count = updated?.activatedPhaseIds.filter((id) => id === 'p1').length ?? 0;
      expect(count).toBe(1);
    });
  });

  describe('per-tick cap', () => {
    it('only evaluates up to PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK compositions', () => {
      // Create more compositions than the cap
      const count = PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK + 5;
      const compositions = Array.from({ length: count }, (_, i) =>
        makeActiveComposition(`comp-${i.toString().padStart(3, '0')}`, [makePhase('p1', 1)])
      );
      const state = makeState(compositions, 2);
      const result = phaseComposition(state);

      // Compositions are sorted by id and capped; first N get evaluated and activate p1,
      // last 5 get skipped (lastEvaluationTick stays as firedAtTick = 1)
      const updatedAll = result.activeCompositions ?? [];
      const activated = updatedAll.filter((c) => c.activatedPhaseIds.includes('p1'));
      expect(activated.length).toBe(PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK);
    });
  });

  describe('fail-soft behavior', () => {
    it('returns empty partial when no activeCompositions exist', () => {
      const state = makeState([], 2);
      const result = phaseComposition(state);
      expect(result).toEqual({});
    });

    it('skips phases with no matching predicate op gracefully', () => {
      const comp = makeActiveComposition('comp-1', [
        {
          id: 'p-unknown',
          activatesAt: { op: 'world-flag' as any, key: 'foo', value: true },
          activates: [],
        },
      ]);
      const state = makeState([comp], 2);
      // Should not throw
      expect(() => phaseComposition(state)).not.toThrow();
      const result = phaseComposition(state);
      const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
      expect(updated?.activatedPhaseIds).not.toContain('p-unknown');
    });

    it('skips compositions with status !== active', () => {
      const comp: ActiveComposition & { phases: Phase[] } = {
        ...makeActiveComposition('comp-completed', [makePhase('p1', 1)]),
        status: 'completed',
      };
      const state = makeState([comp], 2);
      const result = phaseComposition(state);
      const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-completed');
      expect(updated?.activatedPhaseIds).not.toContain('p1');
    });
  });

  describe('world flags and composition-fired effects', () => {
    it('applies set-world-flag effects on phase activation', () => {
      const comp = makeActiveComposition('comp-1', [
        {
          id: 'p1',
          activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 1 },
          activates: [],
          effects: [{ op: 'set-world-flag', key: 'test.flag', value: true }],
        },
      ]);
      const state = makeState([comp], 2);
      const result = phaseComposition(state);
      expect(result.worldFlags?.['test.flag']).toBe(true);
    });

    it('marks composition fired via mark-composition-fired effect', () => {
      const comp = makeActiveComposition('comp-1', [
        {
          id: 'p1',
          activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 1 },
          activates: [],
          effects: [{ op: 'mark-composition-fired', id: 'comp-1' }],
        },
      ]);
      const state = makeState([comp], 2);
      const result = phaseComposition(state);
      expect(result.firedCompositions).toContain('comp-1');
    });
  });

  describe('chronicle entries', () => {
    it('emits a chronicle entry when a phase activates', () => {
      const comp = makeActiveComposition('comp-1', [makePhase('p1', 1)]);
      const state = makeState([comp], 2);
      const result = phaseComposition(state);
      expect(result.chronicleEntries?.length).toBeGreaterThan(0);
      const entry = result.chronicleEntries?.find((e) =>
        e.id.includes('comp-1') && e.id.includes('p1')
      );
      expect(entry).toBeDefined();
      expect(entry?.tier).toBe('chronicle');
    });
  });
});
