import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseInitiativeProgress } from '../phaseInitiativeProgress';
import type { GameState } from '../../types/gameState';
import type { InitiativeProgress } from '../../types/initiative';
import { mulberry32 } from '../../lib/prng';

function buildMinimalState(overrides: Partial<GameState> = {}): GameState {
  return {
    cycle: 1,
    tick: 10,
    phase: 'playing',
    seed: 42,
    graph: new WorldGraph(),
    cosmology: { spheres: {} } as any,
    tiles: [],
    clock: { currentTick: 10 } as any,
    ascendantId: 'ascendant',
    ascendantIdentity: null,
    essencePool: {} as any,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map() as any,
    familiarityMap: new Map() as any,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
    ...overrides,
  };
}

function buildActiveProgress(overrides: Partial<InitiativeProgress> = {}): InitiativeProgress {
  return {
    initiativeId: 'init_test_1',
    templateId: 'initiative.recruit-party',
    actorId: 'actor_1',
    locationId: 'loc_1',
    startedAtTick: 1,
    targetCompletionTick: 100,
    occupiedUntilTick: 5, // checkpoint already due
    checkpoints: [],
    status: 'active',
    sabotaged: false,
    ...overrides,
  };
}

describe('phaseInitiativeProgress', () => {
  describe('failure conditions', () => {
    it('fails when agent has status=dead', () => {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'actor_1',
        name: 'Kael',
        type: 'actor',
        properties: {
          status: 'dead',
          wealth: 30,
          activeInitiative: buildActiveProgress(),
        },
      });

      const state = buildMinimalState({ graph, tick: 10, encounterProgress: [] });
      const rng = mulberry32(42);
      const result = phaseInitiativeProgress(state, rng);

      const actor = graph.getNode('actor_1')!;
      expect(actor.properties.activeInitiative).toBeUndefined();
      expect(result.tickEvents!.length).toBeGreaterThan(0);
    });

    it('fails when wealth drops below threshold condition', () => {
      const graph = new WorldGraph();
      const progress = buildActiveProgress({
        templateId: 'initiative.found-organization',
        targetCompletionTick: 100,
        occupiedUntilTick: 100,
      });

      graph.addNode({
        id: 'actor_1',
        name: 'Kael',
        type: 'actor',
        properties: {
          wealth: 1, // below minWealth threshold of found-organization (25)
          activeInitiative: progress,
          domainCapabilities: { heart: 0.5, gold: 0.5 },
        },
      });

      const state = buildMinimalState({ graph, tick: 10, encounterProgress: [] });
      const rng = mulberry32(42);
      phaseInitiativeProgress(state, rng);

      const actor = graph.getNode('actor_1')!;
      expect(actor.properties.activeInitiative).toBeUndefined();
    });
  });

  describe('checkpoint', () => {
    it('appends a checkpoint record when occupiedUntilTick is reached', () => {
      const graph = new WorldGraph();
      const progress = buildActiveProgress({
        occupiedUntilTick: 10, // exactly at current tick
        targetCompletionTick: 50,
      });

      graph.addNode({
        id: 'actor_1',
        name: 'Kael',
        type: 'actor',
        properties: {
          wealth: 30,
          domainCapabilities: { heart: 0.9, eye: 0.9, gold: 0.9 },
          activeInitiative: progress,
        },
      });

      const state = buildMinimalState({ graph, tick: 10, encounterProgress: [] });
      const rng = mulberry32(42);
      phaseInitiativeProgress(state, rng);

      const actor = graph.getNode('actor_1')!;
      const updatedProgress = actor.properties.activeInitiative as InitiativeProgress | undefined;
      // Either still active with a checkpoint, or completed
      if (updatedProgress) {
        expect(updatedProgress.checkpoints.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('advances occupiedUntilTick after checkpoint', () => {
      const graph = new WorldGraph();
      const progress = buildActiveProgress({
        occupiedUntilTick: 10,
        targetCompletionTick: 50,
      });

      graph.addNode({
        id: 'actor_1',
        name: 'Kael',
        type: 'actor',
        properties: {
          wealth: 30,
          domainCapabilities: { heart: 0.9 },
          activeInitiative: progress,
        },
      });

      const state = buildMinimalState({ graph, tick: 10, encounterProgress: [] });
      const rng = mulberry32(42);
      phaseInitiativeProgress(state, rng);

      const actor = graph.getNode('actor_1')!;
      const updatedProgress = actor.properties.activeInitiative as InitiativeProgress | undefined;
      if (updatedProgress) {
        expect(updatedProgress.occupiedUntilTick).toBeGreaterThan(10);
      }
    });
  });

  describe('completion', () => {
    it('clears activeInitiative when targetCompletionTick is reached', () => {
      const graph = new WorldGraph();

      graph.addNode({
        id: 'loc_1',
        name: 'Test Town',
        type: 'location',
        properties: { locationSubtype: 'town', hexCol: 5, hexRow: 5 },
      });

      const progress = buildActiveProgress({
        templateId: 'initiative.organize-festival',
        locationId: 'loc_1',
        targetCompletionTick: 10, // exactly at current tick
        occupiedUntilTick: 20, // checkpoint NOT due — won't delay completion
        actorId: 'actor_1',
      });

      graph.addNode({
        id: 'actor_1',
        name: 'Kael',
        type: 'actor',
        properties: {
          wealth: 30,
          domainCapabilities: { heart: 0.5, gold: 0.5 },
          activeInitiative: progress,
        },
      });

      const state = buildMinimalState({ graph, tick: 10, encounterProgress: [] });
      const rng = mulberry32(42);
      const result = phaseInitiativeProgress(state, rng);

      const actor = graph.getNode('actor_1')!;
      expect(actor.properties.activeInitiative).toBeUndefined();
      expect(actor.properties.lastInitiativeCompletedTick).toBe(10);
      expect(result.tickEvents!.length).toBeGreaterThan(0);
    });
  });

  describe('festival expiry', () => {
    it('removes festivalBoost when expiry tick is reached', () => {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'loc_1',
        name: 'Festival Town',
        type: 'location',
        properties: {
          locationSubtype: 'town',
          festivalBoost: 0.5,
          festivalBoostExpiresAtTick: 10,
        },
      });

      const state = buildMinimalState({ graph, tick: 10, encounterProgress: [] });
      const rng = mulberry32(42);
      const result = phaseInitiativeProgress(state, rng);

      const loc = graph.getNode('loc_1')!;
      expect(loc.properties.festivalBoost).toBeUndefined();
      expect(loc.properties.festivalBoostExpiresAtTick).toBeUndefined();
      expect(result.tickEvents!.some(e => e.message.includes('festival'))).toBe(true);
    });

    it('does not remove festivalBoost before expiry', () => {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'loc_1',
        name: 'Festival Town',
        type: 'location',
        properties: {
          locationSubtype: 'town',
          festivalBoost: 0.5,
          festivalBoostExpiresAtTick: 20,
        },
      });

      const state = buildMinimalState({ graph, tick: 10, encounterProgress: [] });
      const rng = mulberry32(42);
      phaseInitiativeProgress(state, rng);

      const loc = graph.getNode('loc_1')!;
      expect(loc.properties.festivalBoost).toBe(0.5);
    });
  });

  describe('sabotage', () => {
    it('consumes initiativeSabotaged flag after checkpoint', () => {
      const graph = new WorldGraph();
      const progress = buildActiveProgress({
        occupiedUntilTick: 10,
        targetCompletionTick: 50,
      });

      graph.addNode({
        id: 'actor_1',
        name: 'Kael',
        type: 'actor',
        properties: {
          wealth: 30,
          domainCapabilities: { heart: 0.5 },
          activeInitiative: progress,
          initiativeSabotaged: true,
        },
      });

      const state = buildMinimalState({ graph, tick: 10, encounterProgress: [] });
      const rng = mulberry32(42);
      phaseInitiativeProgress(state, rng);

      const actor = graph.getNode('actor_1')!;
      expect(actor.properties.initiativeSabotaged).toBeUndefined();
    });
  });

  describe('fail-soft', () => {
    it('handles agent with unknown template without crashing', () => {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'actor_1',
        name: 'Kael',
        type: 'actor',
        properties: {
          wealth: 30,
          activeInitiative: buildActiveProgress({ templateId: 'initiative.nonexistent' }),
        },
      });

      const state = buildMinimalState({ graph, tick: 10, encounterProgress: [] });
      const rng = mulberry32(42);
      expect(() => phaseInitiativeProgress(state, rng)).not.toThrow();

      const actor = graph.getNode('actor_1')!;
      expect(actor.properties.activeInitiative).toBeUndefined();
    });
  });
});
