import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { createSimulationRuntime } from '../../simulationRuntime';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import { processAutonomousAftermath } from '../phaseAutonomousAftermath';
import type { GameState } from '../../../types/gameState';
import type { EncounterAftermathReaction, UnifiedAction } from '../../../types/unifiedAction';

const HEART_VICE: EncounterAftermathReaction = {
  id: 'betray',
  label: 'Betray the oath',
  effects: [{ kind: 'reputation_tally', key: 'heart.negative', delta: 1 }],
};
const HEART_VIRTUE: EncounterAftermathReaction = {
  id: 'keep',
  label: 'Keep the oath',
  effects: [{ kind: 'reputation_tally', key: 'heart.positive', delta: 1 }],
};

function makeAction(reactions: readonly EncounterAftermathReaction[]): UnifiedAction {
  return {
    actionId: 'ua-1',
    actorId: 'mortal-1',
    templateId: 'enc.test',
    targetId: 'mortal-1',
    scale: 'personal',
    source: 'agent',
    startTick: 1,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    stepOutcomes: [],
    aftermathSummary: {
      encounterId: 'enc.test',
      outcome: 'success',
      overview: 'o',
      changes: [],
      reactions,
    },
  };
}

function makeState(opts?: { profile?: Record<string, number>; threaded?: boolean }): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'God', properties: { actorType: 'individual' } });
  graph.addNode({
    id: 'mortal-1',
    type: 'actor',
    name: 'Kael',
    properties: {
      actorType: 'individual',
      ...(opts?.profile ? { axiologicalProfile: opts.profile } : {}),
    },
  });
  if (opts?.threaded) {
    graph.addEdge({ id: 't1', source: 'asc-1', target: 'mortal-1', type: 'thread', properties: { courtPosition: 'watched' } });
  }

  return {
    tick: 12,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as never,
    tiles: [],
    clock: {} as never,
    ascendantId: 'asc-1',
    essencePool: {} as never,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as never,
    doomClock: {} as never,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as never,
    familiarityMap: {} as never,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [makeAction([HEART_VICE, HEART_VIRTUE])],
    archetypeDrift: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function tally(state: GameState, key: string): number {
  const t = state.graph.getNode('mortal-1')?.properties?.reputationTallies as Record<string, number> | undefined;
  return t?.[key] ?? 0;
}

describe('phaseAutonomousAftermath', () => {
  let runtime: ReturnType<typeof createSimulationRuntime>;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('applies the profile-aligned reaction for a non-hero agent (not index 0)', () => {
    const state = makeState({ profile: { loyalty_ambition: 0.8 } }); // virtuous-heart
    const next = processAutonomousAftermath(state, { runtime }) as GameState;

    // Chooser picked HEART_VIRTUE (index 1), so the virtue tally fires, not the vice one.
    expect(tally(next, 'heart.positive')).toBe(1);
    expect(tally(next, 'heart.negative')).toBe(0);

    const sel = getTraces().find(t => (t.category as string) === 'reaction_selected') as
      | Record<string, unknown>
      | undefined;
    expect(sel).toBeTruthy();
    expect(sel!.reactionId).toBe('keep');
    expect(sel!.aligned).toBe(true);
  });

  it('applies drift toward the chosen pole', () => {
    const state = makeState({ profile: { loyalty_ambition: 0.8 } });
    const next = processAutonomousAftermath(state, { runtime }) as GameState;
    const drift = next.archetypeDrift.find(d => d.agentId === 'mortal-1' && d.axisId === 'heart_axis');
    expect(drift).toBeTruthy();
    expect(drift!.toPosition).toBeGreaterThan(0); // pushed toward virtue
  });

  it('marks the action applied so it is not re-applied next tick (idempotent)', () => {
    const state = makeState({ profile: { loyalty_ambition: 0.8 } });
    const after1 = processAutonomousAftermath(state, { runtime }) as GameState;
    expect(after1.unifiedActions[0].autonomousAftermathApplied).toBe(true);
    expect(tally(after1, 'heart.positive')).toBe(1);

    const after2 = processAutonomousAftermath(after1, { runtime });
    // No new candidates → phase no-ops (returns empty delta), tally unchanged.
    expect(Object.keys(after2).length).toBe(0);
    expect(tally(after1, 'heart.positive')).toBe(1);
  });

  it('falls back to reactions[0] when the agent has no profile', () => {
    const state = makeState(); // no profile
    const next = processAutonomousAftermath(state, { runtime }) as GameState;
    expect(tally(next, 'heart.negative')).toBe(1); // reactions[0] = HEART_VICE
    expect(tally(next, 'heart.positive')).toBe(0);
  });

  it('skips threaded (hero) agents — their aftermath waits for the player', () => {
    const state = makeState({ profile: { loyalty_ambition: 0.8 }, threaded: true });
    const next = processAutonomousAftermath(state, { runtime });
    expect(Object.keys(next).length).toBe(0); // no-op
    expect(tally(state, 'heart.positive')).toBe(0);
  });

  it('no-ops without a runtime (fail-soft)', () => {
    const state = makeState({ profile: { loyalty_ambition: 0.8 } });
    const next = processAutonomousAftermath(state, {});
    expect(Object.keys(next).length).toBe(0);
  });
});
