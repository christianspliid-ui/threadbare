/**
 * THR-886: The Compulsion — per-agent decision urges.
 *
 * Covers the whole path the card actually travels: `plant_compulsion` applied
 * through the existing aftermath applier, the per-agent bias derived from it, and
 * the decay phase that lapses it. Every assertion here fails against the pre-fix
 * build, where `plant_compulsion` was not a member of the effect union and the
 * card resolved to nothing at all.
 *
 * The per-agent/per-hex distinction gets its own test deliberately: reusing the
 * omen carrier would have passed a naive "does the bias appear?" check while
 * silently tilting every mortal standing nearby, which is the card the design
 * explicitly rejected ("steer them, not the world").
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import {
  derivePlantedCompulsionEncounterBias,
  phasePlantedCompulsionDecay,
} from '../plantedCompulsion';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  PlantedCompulsion,
  UnifiedAction,
} from '../../types/unifiedAction';
import { COMPULSION_BIAS_CAP, COMPULSION_BIAS_WEIGHT, COMPULSION_DEFAULT_DURATION_TICKS } from '../../data/game-config';

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor-other', type: 'actor', name: 'Other', properties: { actorType: 'individual' } });
  return {
    tick: 50, seed: 42, cycle: 1, phase: 'playing', graph,
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
    // `as unknown as` rather than a bare `as GameState`: the fixture is a partial
    // world and the direct assertion is a type error the sibling aftermath test
    // files each carry into the baseline (THR-489). No reason to add one more.
  } as unknown as GameState;
}

function makeAction(actorId = 'actor-hero'): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId: 'enc.test', targetId: actorId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  };
}

function makeReaction(effects: EncounterAftermathReactionEffect[]): EncounterAftermathReaction {
  return { id: 'rx-test', label: 'The god’s hand', effects } as EncounterAftermathReaction;
}

function makeCompulsion(overrides: Partial<PlantedCompulsion> = {}): PlantedCompulsion {
  return {
    compulsionId: 'compulsion-1',
    targetAgentId: 'actor-hero',
    encounterBias: { duel: 1 },
    sourceEncounterId: 'enc.test',
    sourceReactionId: 'rx-test',
    plantedTick: 50,
    expiresTick: 53,
    ...overrides,
  };
}

// ─── plant_compulsion (the applier) ─────────────────────────────────────────

describe('plant_compulsion', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('plants an urge on the actor through the existing aftermath applier', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'plant_compulsion',
      encounterBias: { duel: 0.8, trade: -0.4 },
      narrativeHook: 'A dream of steel will not leave them.',
    }]);

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    expect(result.state.plantedCompulsions).toHaveLength(1);
    const planted = result.state.plantedCompulsions![0];
    expect(planted.targetAgentId).toBe('actor-hero');
    expect(planted.encounterBias).toEqual({ duel: 0.8, trade: -0.4 });
    expect(planted.expiresTick).toBe(50 + COMPULSION_DEFAULT_DURATION_TICKS);
    expect(result.mutationSummary.touchedWorld).toBe(true);
  });

  it('honours an explicit target and duration', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'plant_compulsion',
      encounterBias: { explore: 1 },
      targetAgentId: 'actor-other',
      durationTicks: 9,
    }]);

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    const planted = result.state.plantedCompulsions![0];
    expect(planted.targetAgentId).toBe('actor-other');
    expect(planted.expiresTick).toBe(59);
  });

  it('surfaces an authored hook in the chronicle, so the tilt is not silent', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'plant_compulsion',
      encounterBias: { duel: 1 },
      narrativeHook: 'A dream of steel will not leave them.',
    }]);

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    const event = result.state.tickEvents.find(e => e.message === 'A dream of steel will not leave them.');
    expect(event).toBeDefined();
    expect(event!.actorId).toBe('actor-hero');
  });

  it('emits a compulsion_planted trace naming the target and expiry', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'plant_compulsion', encounterBias: { duel: 1 } }]);

    applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    const trace = getTraces().find(t => t.category === 'compulsion_planted');
    expect(trace).toBeDefined();
    expect((trace as unknown as { agentId: string }).agentId).toBe('actor-hero');
  });

  it('skips an empty bias rather than planting an urge that pulls nowhere', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'plant_compulsion', encounterBias: {} }]);

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    expect(result.state.plantedCompulsions ?? []).toHaveLength(0);
  });

  it('drops a non-finite authored weight instead of poisoning the bias map', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'plant_compulsion',
      encounterBias: { duel: Number.NaN, explore: 0.5 },
    }]);

    const result = applyEncounterAftermathReaction(state, makeAction(), reaction, 50, runtime);

    expect(result.state.plantedCompulsions![0].encounterBias).toEqual({ explore: 0.5 });
  });
});

// ─── derivePlantedCompulsionEncounterBias ───────────────────────────────────

describe('derivePlantedCompulsionEncounterBias', () => {
  it('returns {} for no compulsions', () => {
    expect(derivePlantedCompulsionEncounterBias([], 'actor-hero', 50)).toEqual({});
    expect(derivePlantedCompulsionEncounterBias(undefined, 'actor-hero', 50)).toEqual({});
  });

  it('scales the authored weight by COMPULSION_BIAS_WEIGHT', () => {
    const bias = derivePlantedCompulsionEncounterBias(
      [makeCompulsion({ encounterBias: { duel: 0.4 } })],
      'actor-hero',
      50,
    );
    expect(bias.duel).toBeCloseTo(0.4 * COMPULSION_BIAS_WEIGHT, 5);
  });

  it('is addressed to a person, not a place — another mortal feels nothing', () => {
    const compulsions = [makeCompulsion({ targetAgentId: 'actor-hero' })];
    expect(derivePlantedCompulsionEncounterBias(compulsions, 'actor-hero', 50).duel).toBeGreaterThan(0);
    expect(derivePlantedCompulsionEncounterBias(compulsions, 'actor-other', 50)).toEqual({});
  });

  it('ignores an urge that has already lapsed', () => {
    const compulsions = [makeCompulsion({ expiresTick: 49 })];
    expect(derivePlantedCompulsionEncounterBias(compulsions, 'actor-hero', 50)).toEqual({});
  });

  it('stacks two urges on the same type but clamps at COMPULSION_BIAS_CAP', () => {
    const compulsions = [
      makeCompulsion({ compulsionId: 'c1', encounterBias: { duel: 1 } }),
      makeCompulsion({ compulsionId: 'c2', encounterBias: { duel: 1 } }),
    ];
    const bias = derivePlantedCompulsionEncounterBias(compulsions, 'actor-hero', 50);
    expect(bias.duel).toBe(COMPULSION_BIAS_CAP);
  });

  it('carries a negative pull through as a negative bias', () => {
    const bias = derivePlantedCompulsionEncounterBias(
      [makeCompulsion({ encounterBias: { trade: -0.6 } })],
      'actor-hero',
      50,
    );
    expect(bias.trade).toBeLessThan(0);
  });
});

// ─── phasePlantedCompulsionDecay ────────────────────────────────────────────

describe('phasePlantedCompulsionDecay', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('returns {} when there is nothing to sweep', () => {
    const state = buildState();
    expect(phasePlantedCompulsionDecay(state)).toEqual({});
  });

  it('returns {} when every urge is still live, so the orchestrator can skip a copy', () => {
    const state = { ...buildState(), plantedCompulsions: [makeCompulsion({ expiresTick: 60 })] };
    expect(phasePlantedCompulsionDecay(state)).toEqual({});
  });

  it('drops a lapsed urge and keeps a live one', () => {
    const state = {
      ...buildState(),
      plantedCompulsions: [
        makeCompulsion({ compulsionId: 'stale', expiresTick: 49 }),
        makeCompulsion({ compulsionId: 'fresh', expiresTick: 60 }),
      ],
    };

    const patch = phasePlantedCompulsionDecay(state);

    expect(patch.plantedCompulsions).toHaveLength(1);
    expect(patch.plantedCompulsions![0].compulsionId).toBe('fresh');
    expect(getTraces().some(t => t.category === 'compulsion_decayed')).toBe(true);
  });
});
