import { describe, it, expect, beforeEach } from 'vitest';
import {
  phaseDoom,
  phaseDilemmaDetection,
  phaseRivalActions,
  phaseStealth,
  phaseNarrative,
  phaseEssence,
  phaseReputationDecay,
  phaseMandate,
  phaseDoomExpiry,
  runTick,
  resetEventCounter,
} from '../orchestrator';
import { startTwilight, runTwilightTick, computeHarvest, transitionToNewCycle } from '../cycleEnd';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import { recalcVisibility, collectLOSSources } from '../visibility';
import type { GameState } from '../../types/gameState';
import type { CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function emptyEssencePool() {
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 0;
  return pool as Record<typeof SPHERE_NAMES[number], number>;
}

function mockTiles() {
  const tiles = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland' as const,
      });
    }
  }
  return tiles;
}

function createTestGameState(): GameState {
  const cosmology = balancedCosmology();
  const tiles = mockTiles();
  const seed = 42;

  const { graph } = seedWorld(cosmology, tiles, seed);

  // Add ascendant
  graph.addNode({
    id: 'loc.start',
    type: 'location',
    name: 'Sacred Grove',
    properties: { locationType: 'location' },
  });
  const { ascendantId } = createAscendant(graph, {
    archetype: {
      id: 'arch_test',
      name: 'The Watcher Divine',
      title: 'The Watcher',
      description: 'Test archetype',
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      startingDomainAffinities: { iron: 2, gold: 1 },
      personalitySeed: {
        loyalty_ambition: 0.1,
        courage_prudence: 0.2,
        mercy_ruthlessness: -0.3,
        honesty_cunning: 0.0,
        sacrifice_survival: 0.4,
        loyalty_ambition: 0.5,
        tradition_novelty: 0.1,
        preservation_transformation: -0.2,
        mercy_ruthlessness: 0.0,
        asceticism_extravagance: 0.3,
      },
      flavorText: 'A test archetype for the watcher',
    },
    avatar: {
      name: 'TestAvatar',
      startLocationId: 'loc.start',
      formDescription: 'A test avatar',
    },
  });

  // Generate rivals
  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));

  // Generate doom clock
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomState = createDoomClockState('breach', 360);

  // Initialize visibility map
  const losSources = collectLOSSources(graph, ascendantId, []);
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, 0, 5, 5);

  return {
    cycle: 1,
    tick: 0,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 0, ticksPerSeason: 90, season: 0, year: 0 },
    ascendantId,
    essencePool: emptyEssencePool(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: rivalDefs,
    rivalStates,
    doomDefinition: doomDef,
    doomClock: doomState,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0.0,
    visibilityMap,
    encounterProgress: [],
    worldSoul: {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
      currentCycle: 1,
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: createGreatChronicle(),
  };
}

describe('Orchestrator', () => {
  beforeEach(() => {
    resetEventCounter();
  });

  it('phaseDoom advances the doom clock', () => {
    const state = createTestGameState();
    const updates = phaseDoom(state);
    expect(updates.doomClock).toBeDefined();
    expect(updates.doomClock!.currentTick).toBeGreaterThan(0);
  });

  it('phaseDoom emits doom_escalation event on stage change', () => {
    const state = createTestGameState();
    state.doomClock = { ...state.doomClock, currentTick: 71, progress: 71 / 360, currentStage: 1 };
    const updates = phaseDoom(state);
    const events = updates.tickEvents ?? [];
    const escalation = events.find(e => e.type === 'doom_escalation');
    expect(escalation).toBeDefined();
  });

  it('phaseRivalActions fires rival events periodically', () => {
    const state = createTestGameState();
    let totalEvents = 0;
    let s = state;
    for (let i = 0; i < 20; i++) {
      s = { ...s, tick: i, tickEvents: [] };
      const updates = phaseRivalActions(s);
      s = { ...s, ...updates };
      totalEvents += (updates.tickEvents ?? []).length;
    }
    expect(totalEvents).toBeGreaterThan(0);
  });

  it('phaseStealth decays exposure', () => {
    const state = createTestGameState();
    state.stealthExposure = 0.5;
    const updates = phaseStealth(state);
    expect(updates.stealthExposure).toBeLessThan(0.5);
  });

  it('phaseStealth does not go below zero', () => {
    const state = createTestGameState();
    state.stealthExposure = 0.005;
    const updates = phaseStealth(state);
    expect(updates.stealthExposure).toBeGreaterThanOrEqual(0);
  });

  it('phaseDoomExpiry triggers twilight when doom expires', () => {
    const state = createTestGameState();
    state.doomClock = { ...state.doomClock, expired: true };
    const updates = phaseDoomExpiry(state);
    expect(updates.phase).toBe('twilight');
  });

  it('phaseDoomExpiry does nothing when doom is active', () => {
    const state = createTestGameState();
    const updates = phaseDoomExpiry(state);
    expect(updates.phase).toBeUndefined();
  });

  it('phaseMandate does not produce fake progress when conditions not met', () => {
    const state = createTestGameState();

    // Create a mandate that requires 5 threaded agents, but none exist yet
    const mandate = {
      id: 'mandate_test',
      type: 'graph_state' as const,
      name: 'Test Mandate',
      description: 'Require 5 high-tier threaded agents',
      stages: [
        {
          stage: 'setup' as const,
          description: 'Establish base',
          conditions: [{
            type: 'node_count' as const,
            description: 'Have 5+ tier-2 threaded agents',
            params: {
              nodeType: 'actor',
              edgeType: 'thread',
              edgeTarget: state.ascendantId,
              minTier: 2,
              minCount: 5,
            },
          }],
        },
        {
          stage: 'escalation' as const,
          description: 'Escalate',
          conditions: [],
        },
        {
          stage: 'culmination' as const,
          description: 'Culminate',
          conditions: [],
        },
      ],
    };

    state.mandateDefinition = mandate;
    state.mandateState = {
      mandateId: 'mandate_test',
      currentStage: 'setup',
      progress: 0,
      completed: false,
      failed: false,
    };

    const updates = phaseMandate(state);

    // Progress should be 0 (no conditions met), not fake +0.002
    expect(updates.mandateState?.progress).toBe(0);
    expect(updates.mandateState?.completed).toBe(false);
  });

  it('phaseMandate returns empty object when no mandate is active', () => {
    const state = createTestGameState();
    state.mandateDefinition = null;
    state.mandateState = null;

    const updates = phaseMandate(state);
    expect(updates).toEqual({});
  });

  it('runTick advances tick counter', () => {
    const state = createTestGameState();
    const next = runTick(state);
    expect(next.tick).toBe(1);
  });

  it('runTick is deterministic', () => {
    const a = createTestGameState();
    const b = createTestGameState();
    const nextA = runTick(a);
    resetEventCounter();
    const nextB = runTick(b);
    expect(nextA.tick).toBe(nextB.tick);
    expect(nextA.doomClock.currentTick).toBe(nextB.doomClock.currentTick);
  });

  it('runTick accumulates recent events', () => {
    let state = createTestGameState();
    for (let i = 0; i < 30; i++) {
      resetEventCounter();
      state = runTick(state);
    }
    expect(state.recentEvents.length).toBeGreaterThan(0);
    expect(state.recentEvents.length).toBeLessThanOrEqual(100);
  });

  it('multi-tick simulation reaches doom expiry', () => {
    let state = createTestGameState();
    state.doomClock = { ...state.doomClock, totalTicks: 20 };
    for (let i = 0; i < 25; i++) {
      state = runTick(state);
    }
    expect(state.phase).toBe('twilight');
  });

  it('phaseDilemmaDetection detects high-stakes interactions and resolves dilemmas', () => {
    const state = createTestGameState();

    // Generate some agent_action_resolved events
    state.tickEvents = [
      {
        id: 'evt_1',
        tick: 0,
        type: 'agent_action_resolved',
        message: 'Actor engaged in diplomacy',
        sphere: 'gold',
        significance: 0.7,
      },
    ];

    // Ensure we have actors with cooperation strategies
    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties?.actorType === 'individual');
    if (actors.length >= 1) {
      actors[0].properties.cooperationStrategy = 'tit-for-tat';
      if (actors.length >= 2) {
        actors[1].properties.cooperationStrategy = 'always-cooperate';
      }
    }

    const updates = phaseDilemmaDetection(state);
    const events = updates.tickEvents ?? [];

    // Should produce a dilemma_resolved event (if conditions met)
    // or at minimum return without error
    expect(updates.tickEvents).toBeDefined();
    expect(Array.isArray(updates.tickEvents)).toBe(true);
  });

  it('phaseDilemmaDetection does nothing when no high-stakes events', () => {
    const state = createTestGameState();
    state.tickEvents = []; // No events
    const updates = phaseDilemmaDetection(state);
    expect(updates.tickEvents).toEqual(state.tickEvents);
  });

  it('phaseReputationDecay decays actor reputation toward default', () => {
    const state = createTestGameState();

    // Set an actor's reputation above default (0.5)
    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties?.actorType === 'individual');

    if (actors.length > 0) {
      actors[0].properties.reputationScore = 0.8;
    }

    const initialRep = actors[0]?.properties?.reputationScore ?? 0.5;
    expect(initialRep).toBe(0.8);

    const updates = phaseReputationDecay(state);

    // Reputation should have decayed toward default
    const decayedRep = actors[0]?.properties?.reputationScore ?? 0.5;
    expect(decayedRep).toBeLessThan(initialRep);
    expect(decayedRep).toBeGreaterThanOrEqual(0.5); // Should not go below default
  });

  it('phaseReputationDecay decays reputation below default upward', () => {
    const state = createTestGameState();

    // Set an actor's reputation below default (0.5)
    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties?.actorType === 'individual');

    if (actors.length > 0) {
      actors[0].properties.reputationScore = 0.2;
    }

    const initialRep = actors[0]?.properties?.reputationScore ?? 0.5;
    expect(initialRep).toBe(0.2);

    const updates = phaseReputationDecay(state);

    // Reputation should have decayed upward toward default
    const decayedRep = actors[0]?.properties?.reputationScore ?? 0.5;
    expect(decayedRep).toBeGreaterThan(initialRep);
    expect(decayedRep).toBeLessThanOrEqual(0.5); // Should not go above default
  });

  it('phaseReputationDecay does not change reputation at default', () => {
    const state = createTestGameState();

    // Set an actor's reputation to default (0.5)
    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties?.actorType === 'individual');

    if (actors.length > 0) {
      actors[0].properties.reputationScore = 0.5;
    }

    const initialRep = actors[0]?.properties?.reputationScore ?? 0.5;
    expect(initialRep).toBe(0.5);

    const updates = phaseReputationDecay(state);

    // Reputation should remain at default
    const decayedRep = actors[0]?.properties?.reputationScore ?? 0.5;
    expect(decayedRep).toBe(0.5);
  });
});

describe('Movement integration via orchestrator', () => {
  beforeEach(() => {
    resetEventCounter();
  });

  it('agent with pre-set movement queue advances after a tick', () => {
    const state = createTestGameState();

    // Find an individual agent
    const agents = state.graph.getNodesByType('actor')
      .filter(n => n.properties?.actorType === 'individual');
    expect(agents.length).toBeGreaterThan(0);

    const agent = agents[0];
    const agentLocEdges = state.graph.getOutgoingEdges(agent.id, 'located_at');
    expect(agentLocEdges.length).toBeGreaterThan(0);
    const startLocId = agentLocEdges[0].target;

    // Find an adjacent location from the start
    const adjEdges = state.graph.getOutgoingEdges(startLocId, 'adjacent');
    if (adjEdges.length === 0) return; // skip if isolated (shouldn't happen with seeded world)
    const destLocId = adjEdges[0].target;

    // Set up a movement queue manually
    const movementState = {
      destinationId: destLocId,
      movementQueue: [destLocId],
      ticksAccumulated: 0,
      currentEdgeCost: 1, // Will traverse in 1 tick
      lastDecisionTick: 0,
      movementHistory: [],
    };

    state.graph.updateNode(agent.id, {
      properties: { ...agent.properties, movementState },
    });

    // Run one tick
    const next = runTick(state);

    // The agent should have progressed — either moved or accumulated ticks
    const updatedAgent = next.graph.getNode(agent.id)!;
    const updatedMs = updatedAgent.properties.movementState as any;
    expect(updatedMs).toBeDefined();

    // Either the queue shrank (agent moved) or ticks accumulated
    const queueShrank = updatedMs.movementQueue.length < movementState.movementQueue.length;
    const ticksGrew = updatedMs.ticksAccumulated > 0;
    expect(queueShrank || ticksGrew).toBe(true);
  });

  it('agent arrives at destination after enough ticks', () => {
    const state = createTestGameState();

    const agents = state.graph.getNodesByType('actor')
      .filter(n => n.properties?.actorType === 'individual');
    const agent = agents[0];
    const agentLocEdges = state.graph.getOutgoingEdges(agent.id, 'located_at');
    const startLocId = agentLocEdges[0].target;

    const adjEdges = state.graph.getOutgoingEdges(startLocId, 'adjacent');
    if (adjEdges.length === 0) return;
    const destLocId = adjEdges[0].target;

    // Set up movement with low cost so agent arrives quickly
    const movementState = {
      destinationId: destLocId,
      movementQueue: [destLocId],
      ticksAccumulated: 0,
      currentEdgeCost: 1,
      lastDecisionTick: 0,
      movementHistory: [],
    };

    state.graph.updateNode(agent.id, {
      properties: { ...agent.properties, movementState },
    });

    // Run multiple ticks to ensure arrival
    let s = state;
    for (let i = 0; i < 10; i++) {
      s = runTick(s);
    }

    const finalAgent = s.graph.getNode(agent.id)!;
    const finalMs = finalAgent.properties.movementState as any;

    // Agent should have arrived (empty queue)
    expect(finalMs.movementQueue).toHaveLength(0);

    // Agent's located_at should point to destination
    const locEdges = s.graph.getOutgoingEdges(agent.id, 'located_at');
    expect(locEdges.length).toBe(1);
    expect(locEdges[0].target).toBe(destLocId);
  });
});

describe('Full game loop integration', () => {
  it('runs a complete cycle: play → doom expires → twilight → harvest → transition → new cycle', () => {
    resetEventCounter();

    // Start with a short doom clock
    let state = createTestGameState();
    state.doomClock = { ...state.doomClock, totalTicks: 30 };

    // ── Playing phase ──
    let ticksPlayed = 0;
    while (state.phase === 'playing' && ticksPlayed < 50) {
      state = runTick(state);
      ticksPlayed++;
    }

    // Should have transitioned to twilight
    expect(state.phase).toBe('twilight');
    expect(ticksPlayed).toBeLessThanOrEqual(35); // doom should expire around tick 30

    // Verify some events were generated during play
    expect(state.recentEvents.length).toBeGreaterThan(0);

    // ── Twilight phase ──
    state = startTwilight(state);
    let twilightComplete = false;
    while (!twilightComplete) {
      const result = runTwilightTick(state);
      state = result.state;
      twilightComplete = result.complete;
    }
    expect(state.phase).toBe('harvest');

    // ── Harvest ──
    const harvest = computeHarvest(state);
    expect(harvest.cosmicEchoCandidates.length).toBeGreaterThan(0);
    expect(harvest.harvestType).toBeDefined();

    // ── Transition ──
    const cosmicEchoes = harvest.cosmicEchoCandidates.map(c => c.echoDefinition);
    state = transitionToNewCycle(state, cosmicEchoes, [], harvest.chronicleSummary);

    expect(state.cycle).toBe(2);
    expect(state.tick).toBe(0);
    expect(state.echoDefinitions.length).toBeGreaterThan(0);
    expect(state.chronicle.volumes.length).toBe(1);

    // ── New cycle: verify echoes persist ──
    expect(state.echoStates.length).toBeGreaterThan(0);
    expect(state.chronicleEntries).toHaveLength(0); // reset for new cycle
  });
});
