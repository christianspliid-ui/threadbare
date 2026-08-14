import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import {
  applyEncounterAftermathReaction,
  resolveAftermathContextForAgent,
} from '../encounterAftermath';
import { createSimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type { EncounterNotification } from '../../types/encounterVisibility';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

function createMinimalState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1',
    type: 'actor',
    name: 'Ashara',
    properties: { actorType: 'individual' },
  });

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
    unifiedActions: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as GameState;
}

function makeAction(
  actionId: string,
  templateId: string,
  startTick: number,
  reactions: readonly EncounterAftermathReaction[],
): UnifiedAction {
  return {
    actionId,
    actorId: 'actor-1',
    templateId,
    targetId: 'actor-1',
    scale: 'personal',
    source: 'agent',
    startTick,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    stepOutcomes: [],
    aftermathSummary: {
      encounterId: templateId,
      outcome: 'success',
      overview: 'Aftermath summary',
      changes: [],
      reactions,
    },
  };
}

function makeNotification(
  actionId: string,
  encounterId: string,
  resolved = false,
): EncounterNotification {
  return {
    id: `${actionId}-notif`,
    agentId: 'actor-1',
    agentName: 'Ashara',
    courtPosition: null,
    encounterId,
    encounterName: encounterId,
    kind: 'aftermath',
    sourceSystem: 'unified_action',
    stepIndex: 0,
    actionId,
    stepId: 'step-1',
    prose: 'Aftermath available',
    choices: [],
    createdTick: 12,
    autoResolveTick: null,
    viewed: true,
    resolved,
  };
}

const REACTION_A: EncounterAftermathReaction = {
  id: 'reaction-a',
  label: 'Take the safer route',
  effects: [{ kind: 'reputation_score', delta: 0.05 }],
  closeAfterSelection: true,
};

const REACTION_B: EncounterAftermathReaction = {
  id: 'reaction-b',
  label: 'Take the risky route',
  effects: [{ kind: 'reputation_tally', key: 'heart.positive', delta: 1 }],
  closeAfterSelection: true,
};

describe('resolveAftermathContextForAgent', () => {
  it('returns error when no candidate aftermath action exists', () => {
    const state = createMinimalState();
    const result = resolveAftermathContextForAgent(state, 'actor-1');
    expect(result).toEqual({ error: "No pending aftermath for agent 'actor-1'." });
  });

  it('returns error when notifications exist but are already resolved', () => {
    const state = createMinimalState();
    state.unifiedActions = [makeAction('ua-1', 'enc.alpha', 1, [REACTION_A])];
    state.encounterNotifications = [makeNotification('ua-1', 'enc.alpha', true)];

    const result = resolveAftermathContextForAgent(state, 'actor-1');
    expect(result).toEqual({ error: "No unresolved aftermath notification for agent 'actor-1'." });
  });

  it('returns error when authored reactions are empty', () => {
    const state = createMinimalState();
    state.unifiedActions = [makeAction('ua-1', 'enc.alpha', 1, [])];
    state.encounterNotifications = [makeNotification('ua-1', 'enc.alpha')];

    const result = resolveAftermathContextForAgent(state, 'actor-1');
    expect(result).toEqual({ error: "Pending aftermath for agent 'actor-1' has no authored reactions." });
  });

  it('returns error for unknown explicit reaction id', () => {
    const state = createMinimalState();
    state.unifiedActions = [makeAction('ua-1', 'enc.alpha', 1, [REACTION_A, REACTION_B])];
    state.encounterNotifications = [makeNotification('ua-1', 'enc.alpha')];

    const result = resolveAftermathContextForAgent(state, 'actor-1', 'missing-reaction-id');
    expect(result).toEqual({
      error: "Unknown aftermath reaction 'missing-reaction-id' for agent 'actor-1'. Available: reaction-a, reaction-b.",
    });
  });

  it('returns the explicit reaction when reaction id is provided', () => {
    const state = createMinimalState();
    const action = makeAction('ua-1', 'enc.alpha', 1, [REACTION_A, REACTION_B]);
    state.unifiedActions = [action];
    state.encounterNotifications = [makeNotification('ua-1', 'enc.alpha')];

    const result = resolveAftermathContextForAgent(state, 'actor-1', 'reaction-b');
    expect(result).toEqual({ action, reaction: REACTION_B });
  });

  it('auto-picks the first authored reaction when reaction id is omitted', () => {
    const state = createMinimalState();
    const action = makeAction('ua-1', 'enc.alpha', 1, [REACTION_A, REACTION_B]);
    state.unifiedActions = [action];
    state.encounterNotifications = [makeNotification('ua-1', 'enc.alpha')];

    const result = resolveAftermathContextForAgent(state, 'actor-1');
    expect(result).toEqual({ action, reaction: REACTION_A });
  });

  it('prefers the unresolved notification action over fallback sorting', () => {
    const state = createMinimalState();
    const first = makeAction('ua-1', 'enc.alpha', 4, [REACTION_A]);
    const second = makeAction('ua-2', 'enc.beta', 3, [REACTION_B]);
    state.unifiedActions = [first, second];
    state.encounterNotifications = [makeNotification('ua-2', 'enc.beta')];

    const result = resolveAftermathContextForAgent(state, 'actor-1');
    expect(result).toEqual({ action: second, reaction: REACTION_B });
  });

  // ─── THR-1112: pick-after-auto-resolve ──────────────────────────────────────
  //
  // `phaseAutonomousAftermath` flags an action once it applies the aftermath, but
  // that flag used to be read only by the phase's own re-scan. A later manual pick
  // (CLI `aftermath pick`, the debug bridge) resolved the same action again and
  // re-ran every effect — duplicate agreement edges, duplicate seeds with
  // byte-identical ids (impediments #553, #577), in exactly the runs that hunt real
  // engine defects.
  describe('refuses an aftermath the tick loop already applied (THR-1112)', () => {
    it('refuses on the notification path, naming the tick it was applied at', () => {
      const state = createMinimalState();
      const action = {
        ...makeAction('ua-1', 'enc.alpha', 1, [REACTION_A, REACTION_B]),
        autonomousAftermathApplied: true,
        autonomousAftermathAppliedTick: 7,
      };
      state.unifiedActions = [action];
      state.encounterNotifications = [makeNotification('ua-1', 'enc.alpha')];

      const result = resolveAftermathContextForAgent(state, 'actor-1', 'reaction-b');
      expect(result).toEqual({
        error: "Aftermath for 'enc.alpha' (action ua-1, agent 'actor-1') was already applied autonomously at tick 7. Nothing to apply.",
        alreadyApplied: { tick: 7 },
      });
    });

    it('refuses on the no-notification fallback path — the path the CLI repro takes', () => {
      const state = createMinimalState();
      state.unifiedActions = [{
        ...makeAction('ua-1', 'enc.alpha', 1, [REACTION_A]),
        autonomousAftermathApplied: true,
        autonomousAftermathAppliedTick: 2,
      }];
      state.encounterNotifications = [];

      const result = resolveAftermathContextForAgent(state, 'actor-1');
      expect(result).toEqual({
        error: "Aftermath for 'enc.alpha' (action ua-1, agent 'actor-1') was already applied autonomously at tick 2. Nothing to apply.",
        alreadyApplied: { tick: 2 },
      });
    });

    // Fail-soft (NFP #4): a flag written before `autonomousAftermathAppliedTick`
    // existed still refuses — it just cannot say when.
    it('still refuses when the applied-tick was never recorded', () => {
      const state = createMinimalState();
      state.unifiedActions = [{
        ...makeAction('ua-1', 'enc.alpha', 1, [REACTION_A]),
        autonomousAftermathApplied: true,
      }];
      state.encounterNotifications = [makeNotification('ua-1', 'enc.alpha')];

      const result = resolveAftermathContextForAgent(state, 'actor-1');
      expect(result).toEqual({
        error: "Aftermath for 'enc.alpha' (action ua-1, agent 'actor-1') was already applied autonomously. Nothing to apply.",
        alreadyApplied: { tick: undefined },
      });
    });

    // The guard must not swallow live work: a flagged action alongside an unflagged
    // one leaves the unflagged one pickable.
    it('still resolves an unflagged action when a sibling action is flagged', () => {
      const state = createMinimalState();
      const applied = {
        ...makeAction('ua-1', 'enc.alpha', 4, [REACTION_A]),
        autonomousAftermathApplied: true,
        autonomousAftermathAppliedTick: 3,
      };
      const pending = makeAction('ua-2', 'enc.beta', 3, [REACTION_B]);
      state.unifiedActions = [applied, pending];
      state.encounterNotifications = [makeNotification('ua-2', 'enc.beta')];

      const result = resolveAftermathContextForAgent(state, 'actor-1');
      expect(result).toEqual({ action: pending, reaction: REACTION_B });
    });

    // The defect as the impediments recorded it: the second application re-ran the
    // effects. Proven by state, not by the error string.
    it('leaves the world untouched where a second application would have mutated it', () => {
      const state = createMinimalState();
      const action = makeAction('ua-1', 'enc.alpha', 1, [REACTION_A]);
      state.unifiedActions = [action];
      state.encounterNotifications = [makeNotification('ua-1', 'enc.alpha')];

      // First application — the tick loop's, standing in for phaseAutonomousAftermath.
      const firstRun = applyEncounterAftermathReaction(
        state, action, REACTION_A, state.tick, createSimulationRuntime(),
      );
      const afterFirst: GameState = {
        ...firstRun.state,
        unifiedActions: firstRun.state.unifiedActions.map(a =>
          a.actionId === 'ua-1'
            ? { ...a, autonomousAftermathApplied: true, autonomousAftermathAppliedTick: firstRun.state.tick }
            : a),
      };

      // The manual pick that used to re-apply.
      const second = resolveAftermathContextForAgent(afterFirst, 'actor-1', 'reaction-a');
      expect('error' in second).toBe(true);
      expect((second as { alreadyApplied?: unknown }).alreadyApplied).toBeDefined();
    });
  });

  it('resolver selection produces the same aftermath mutation as direct reaction application', () => {
    const fromResolverState = createMinimalState();
    const directState = createMinimalState();
    const actionFromResolver = makeAction('ua-1', 'enc.alpha', 1, [REACTION_A, REACTION_B]);
    const actionDirect = makeAction('ua-1', 'enc.alpha', 1, [REACTION_A, REACTION_B]);
    fromResolverState.unifiedActions = [actionFromResolver];
    directState.unifiedActions = [actionDirect];
    fromResolverState.encounterNotifications = [makeNotification('ua-1', 'enc.alpha')];
    directState.encounterNotifications = [makeNotification('ua-1', 'enc.alpha')];

    const resolvedContext = resolveAftermathContextForAgent(fromResolverState, 'actor-1', 'reaction-a');
    if ('error' in resolvedContext) {
      throw new Error(`expected resolver success, got error: ${resolvedContext.error}`);
    }

    const resolverRun = applyEncounterAftermathReaction(
      fromResolverState,
      resolvedContext.action,
      resolvedContext.reaction,
      fromResolverState.tick,
      createSimulationRuntime(),
    );
    const directRun = applyEncounterAftermathReaction(
      directState,
      actionDirect,
      REACTION_A,
      directState.tick,
      createSimulationRuntime(),
    );

    expect(resolverRun.mutationSummary).toEqual(directRun.mutationSummary);
    expect(resolverRun.state.graph.getNode('actor-1')?.properties.reputationScore).toBe(
      directRun.state.graph.getNode('actor-1')?.properties.reputationScore,
    );
  });
});
