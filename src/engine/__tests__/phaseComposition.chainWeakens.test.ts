/**
 * Integration test: Chain Weakens phase-5-reckoning activation.
 *
 * Verifies that the three-term `and` predicate (doom-clock + world-flag +
 * has-faction-of-archetype) activates phase-5-reckoning only when all conditions
 * are simultaneously true.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { phaseComposition } from '../phaseComposition';
import type { GameState, ActiveComposition } from '../../types/gameState';
import type { Phase } from '../../composition-dsl/schema';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { CHAIN_WEAKENS_EVENT_RECIPE } from '../../composition-dsl/examples/event-chain-weakens.recipe';

// ─── Factories ─────────────────────────────────────────────────────

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
    doomClock: makeDoomClock(4),
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

function makeChainWeakensComposition(
  activatedPhaseIds: string[] = []
): ActiveComposition & { phases: Phase[] } {
  return {
    compositionId: 'the-chain-weakens',
    firedAtTick: 1,
    activatedPhaseIds,
    phaseActivationTicks: Object.fromEntries(activatedPhaseIds.map((id) => [id, 5])),
    resolvedNodes: {},
    status: 'active',
    lastEvaluationTick: 1,
    phases: CHAIN_WEAKENS_EVENT_RECIPE.phases ?? [],
  };
}

function addFaction(graph: WorldGraph, id: string, factionDefId: string): void {
  const node: GraphNode = {
    id,
    type: 'actor',
    name: id,
    properties: { actorType: 'faction', factionDefId },
  };
  graph.addNode(node);
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('Chain Weakens — phase-5-reckoning integration', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress expected console.warn for unknown op in test isolation
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('phase-5-reckoning stays dormant when no divine_champion_order faction exists', () => {
    // Phases 1-4 already activated; doom-clock at 4; flag set; no faction
    const comp = makeChainWeakensComposition(['phase-1-rumor', 'phase-2-plague', 'phase-3-absorbing', 'phase-4-crack']);
    const state = makeState([comp], {
      worldFlags: { 'chain-weakens.plague-materialized': true },
    });
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'the-chain-weakens');
    expect(updated?.activatedPhaseIds).not.toContain('phase-5-reckoning');
  });

  it('phase-5-reckoning stays dormant when plague flag is not set', () => {
    const comp = makeChainWeakensComposition(['phase-1-rumor', 'phase-2-plague', 'phase-3-absorbing', 'phase-4-crack']);
    const state = makeState([comp]);
    addFaction(state.graph as WorldGraph, 'f1', 'divine_champion_order');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'the-chain-weakens');
    expect(updated?.activatedPhaseIds).not.toContain('phase-5-reckoning');
  });

  it('phase-5-reckoning activates when doom-clock ≥ 4, flag set, and faction present', () => {
    const comp = makeChainWeakensComposition(['phase-1-rumor', 'phase-2-plague', 'phase-3-absorbing', 'phase-4-crack']);
    const state = makeState([comp], {
      worldFlags: { 'chain-weakens.plague-materialized': true },
    });
    addFaction(state.graph as WorldGraph, 'f1', 'divine_champion_order');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'the-chain-weakens');
    expect(updated?.activatedPhaseIds).toContain('phase-5-reckoning');
  });

  it('emits composition.phase_activated trace when phase-5-reckoning activates', () => {
    // We verify via story beat queue: a story beat is enqueued when the phase activates
    const comp = makeChainWeakensComposition(['phase-1-rumor', 'phase-2-plague', 'phase-3-absorbing', 'phase-4-crack']);
    const state = makeState([comp], {
      worldFlags: { 'chain-weakens.plague-materialized': true },
    });
    addFaction(state.graph as WorldGraph, 'f1', 'divine_champion_order');
    const result = phaseComposition(state);
    // story beat queued means the phase fired
    const beatQueued = result.storyBeatQueue?.some((b) =>
      b.encounterId.includes('the-chain-weakens') && b.encounterId.includes('phase-5-reckoning')
    );
    expect(beatQueued).toBe(true);
  });

  it('phase-5-reckoning stays dormant when doom-clock is below tier 4', () => {
    const comp = makeChainWeakensComposition(['phase-1-rumor', 'phase-2-plague', 'phase-3-absorbing', 'phase-4-crack']);
    const state = makeState([comp], {
      worldFlags: { 'chain-weakens.plague-materialized': true },
      doomClock: makeDoomClock(3),
    });
    addFaction(state.graph as WorldGraph, 'f1', 'divine_champion_order');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'the-chain-weakens');
    expect(updated?.activatedPhaseIds).not.toContain('phase-5-reckoning');
  });
});
