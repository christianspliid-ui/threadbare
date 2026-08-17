/**
 * THR-1150 — `faction_reputation_gain` was dead in all shipped content.
 *
 * Authors write the faction **definition** id (`'adventuring_guild'`), because that
 * is what every faction content file carries. `factionSeeding` keys the seeded node
 * `faction_def_<definitionId><chapterSuffix>`, so the authored value matched no node
 * and no `member_of` edge target: the effect no-opped, and the no-op was silent.
 *
 * **Falsification note.** The pre-existing suite in `aftermathFactionReputation.test.ts`
 * passes today because its fixture is hand-keyed with a *node* id
 * (`'faction.adventuring-guild'`) and authors that same id on the effect — a world
 * shape `factionSeeding` never produces. Every fixture here is keyed the way a seeded
 * world keys it, and every effect authors the definition id, or the regression is not
 * covered.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { applyFactionReputationGain } from '../factionReputation';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** The definition id an author writes, and the node id `factionSeeding` mints from it. */
const DEF_ID = 'adventuring_guild';
const NODE_ID = `faction_def_${DEF_ID}_0`;

/** Add a seeded-shaped faction node: node id derived from the definition id. */
function addFactionNode(graph: WorldGraph, nodeId: string): void {
  graph.addNode({
    id: nodeId,
    type: 'actor',
    name: 'Adventurers Guild',
    properties: { actorType: 'faction', actorStatus: 'active', factionDefId: DEF_ID },
  });
}

/**
 * @param memberOf Faction node id the hero belongs to, or null for a non-member.
 */
function buildState(memberOf: string | null = NODE_ID, tick = 50): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  addFactionNode(graph, NODE_ID);

  if (memberOf) {
    graph.addEdge({
      id: `member_agent-hero_${memberOf}`,
      source: 'agent-hero',
      target: memberOf,
      type: 'member_of',
      properties: { factionDefId: DEF_ID, reputation: 0.1, role: 'journeyman', rank: 0, joinedTick: 1 },
    });
  }

  return {
    tick, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function makeAction(): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: 'agent-hero', templateId: 'enc.test', targetId: 'agent-hero',
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as UnifiedAction;
}

function apply(state: GameState, effects: EncounterAftermathReactionEffect[], runtime: SimulationRuntime) {
  const reaction = { id: 'rx-test', label: 'Test Reaction', effects } as EncounterAftermathReaction;
  return applyEncounterAftermathReaction(state, makeAction(), reaction, state.tick, runtime);
}

function membershipReputation(state: GameState, target: string): number | undefined {
  const edge = state.graph.getAllEdges().find(
    e => e.source === 'agent-hero' && e.target === target && e.type === 'member_of',
  );
  return edge?.properties?.reputation as number | undefined;
}

function effectTraces() {
  return getTraces().filter(
    t => t.category === 'encounter_aftermath_effect'
      && (t as { effectKind?: string }).effectKind === 'faction_reputation_gain',
  ) as unknown as Array<{ success?: boolean; failReason?: string }>;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('THR-1150 — faction_reputation_gain resolves an authored definition id', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('the authored definition id moves reputation on the seeded faction node', () => {
    const state = buildState();
    // Pre-state: the authored id names no node at all. This is the whole defect.
    expect(state.graph.getNode(DEF_ID)).toBeUndefined();

    const result = apply(state, [{
      kind: 'faction_reputation_gain',
      factionId: DEF_ID,
      amount: 0.15,
    }], runtime);

    expect(membershipReputation(result.state, NODE_ID)).toBeCloseTo(0.25, 5);
    expect(effectTraces().some(t => t.success === true)).toBe(true);
  });

  it('an explicit faction node id still works — the resolution is widening-only', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'faction_reputation_gain',
      factionId: NODE_ID,
      amount: 0.15,
    }], runtime);

    expect(membershipReputation(result.state, NODE_ID)).toBeCloseTo(0.25, 5);
    expect(effectTraces().some(t => t.success === true)).toBe(true);
  });

  it('prefers the chapter the agent already belongs to over the lowest-sorting one', () => {
    const state = buildState(null);
    const chapterOne = `faction_def_${DEF_ID}_1`;
    addFactionNode(state.graph, chapterOne);
    state.graph.addEdge({
      id: `member_agent-hero_${chapterOne}`,
      source: 'agent-hero',
      target: chapterOne,
      type: 'member_of',
      properties: { factionDefId: DEF_ID, reputation: 0.1, role: 'journeyman', rank: 0, joinedTick: 1 },
    });

    const result = apply(state, [{
      kind: 'faction_reputation_gain',
      factionId: DEF_ID,
      amount: 0.15,
    }], runtime);

    expect(membershipReputation(result.state, chapterOne)).toBeCloseTo(0.25, 5);
    expect(membershipReputation(result.state, NODE_ID)).toBeUndefined();
  });

  it('a non-member no-op now announces itself instead of breaking silently', () => {
    const state = buildState(null);

    apply(state, [{
      kind: 'faction_reputation_gain',
      factionId: DEF_ID,
      amount: 0.15,
    }], runtime);

    const skipped = effectTraces().filter(t => t.success === false);
    expect(skipped.length).toBe(1);
    expect(skipped[0].failReason).toBe('not_a_member');
  });

  it('an unresolvable faction id still reports faction_not_found', () => {
    const state = buildState();

    apply(state, [{
      kind: 'faction_reputation_gain',
      factionId: 'no_such_faction',
      amount: 0.15,
    }], runtime);

    const skipped = effectTraces().filter(t => t.success === false);
    expect(skipped.length).toBeGreaterThanOrEqual(1);
    expect(skipped.every(t => t.failReason === 'faction_not_found')).toBe(true);
    // Nothing moved.
    expect(membershipReputation(state, NODE_ID)).toBeCloseTo(0.1, 5);
  });
});

describe('THR-1150 — applyFactionReputationGain reports which no-op it took', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('distinguishes faction_not_found from not_a_member', () => {
    const member = buildState();
    const stranger = buildState(null);

    expect(
      applyFactionReputationGain(member.graph, 'agent-hero', 'no_such_faction', 0.1, 1, 'encounter_aftermath').reason,
    ).toBe('faction_not_found');

    expect(
      applyFactionReputationGain(stranger.graph, 'agent-hero', DEF_ID, 0.1, 1, 'encounter_aftermath').reason,
    ).toBe('not_a_member');

    // The success path carries no reason.
    expect(
      applyFactionReputationGain(member.graph, 'agent-hero', DEF_ID, 0.1, 1, 'encounter_aftermath').reason,
    ).toBeUndefined();
  });
});
