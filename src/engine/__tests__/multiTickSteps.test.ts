import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initiateEncounter,
  resolveEncounter,
  advanceEncounter,
  isEncounterOccupied,
} from '../encounter';
import type { GameState, EncounterProgress } from '../../types';
import type { EncounterTemplate } from '../../types/encounter';
import { WorldGraph } from '../graph';
import { enableTracing, disableTracing, clearTraces } from '../traceBuffer';
import * as encounterContent from '../../data/encounter-content';
import { vi } from 'vitest';

// ──────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────

/** Minimal 3-step encounter template with varied durations for testing. */
const MULTI_TICK_TEMPLATE: EncounterTemplate = {
  id: 'encounter.multi_tick_test',
  name: 'Multi-Tick Test',
  locationTypes: ['town'],
  reachPrimary: 'iron',
  reachSecondary: 'heart',
  encounterType: 'explore',
  threatRating: 'moderate',
  motivations: ['courage_prudence'],
  steps: [
    {
      id: 'mt.step1',
      name: 'Step One',
      reach: 'iron',
      difficulty: 30,
      duration: 3,
      narrative: 'A three-tick step.',
      onSuccess: { narrative: 'Step 1 success.' },
      onFailure: { narrative: 'Step 1 failure.' },
    },
    {
      id: 'mt.step2',
      name: 'Step Two',
      reach: 'heart',
      difficulty: 40,
      duration: 5,
      narrative: 'A five-tick step.',
      onSuccess: { narrative: 'Step 2 success.' },
      onFailure: { narrative: 'Step 2 failure.' },
    },
    {
      id: 'mt.step3',
      name: 'Step Three',
      reach: 'iron',
      difficulty: 50,
      // No duration field — should default to 1
      narrative: 'A default-duration step.',
      onSuccess: { narrative: 'Step 3 success.' },
      onFailure: { narrative: 'Step 3 failure.' },
    },
  ],
};

function buildTestState(): { state: GameState; actorId: string } {
  const graph = new WorldGraph();
  const actorId = 'actor.mt1';

  graph.addNode({
    id: 'asc.mt',
    type: 'actor',
    name: 'TestGod',
    properties: { actorType: 'ascendant' },
  });

  graph.addNode({
    id: actorId,
    type: 'actor',
    name: 'TestActor',
    properties: { actorType: 'individual' },
  });

  graph.addNode({
    id: 'loc.mt',
    type: 'location',
    name: 'TestTown',
    properties: { hexCol: 1, hexRow: 1, locationSubtype: 'town' },
  });

  graph.addEdge({
    id: 'e.mt_loc',
    source: actorId,
    target: 'loc.mt',
    type: 'located_at',
    properties: {},
  });

  // Give actor high capability so resolution succeeds with mid-range rolls
  // Contribution of 20 → sigmoid(20) ≈ 0.98, well above difficulty thresholds
  graph.addNode({
    id: 'trait.mt_iron',
    type: 'trait',
    name: 'IronTrait',
    properties: {
      category: 'test',
      domainContributions: {
        iron: 20, shadow: 0, gold: 0, eye: 0, veil: 0,
        heart: 20, stone: 0, star: 0, flesh: 0,
      },
    },
  });

  graph.addEdge({
    id: 'e.mt_trait',
    source: actorId,
    target: 'trait.mt_iron',
    type: 'has_trait',
    properties: { level: 1 },
  });

  const state: GameState = {
    cycle: 0,
    tick: 10,
    phase: 'playing',
    seed: 42,
    graph,
    cosmology: { foundation: { chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5 }, creation: [] },
    tiles: [],
    clock: { year: 1, season: 'spring', dayOfMonth: 1 },
    ascendantId: 'asc.mt',
    essencePool: { current: 100, max: 100, passiveTick: 0 },
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: { archetype: 'breach', customName: 'Doom', color: '#ff0000', narrative: 'Test' },
    doomClock: { currentTick: 0, totalTicks: 120, stage: 'escalation' },
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    encounterProgress: [],
    worldSoul: {
      fundament: { chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5 },
      resonance: [],
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: { entries: [] },
  };

  return { state, actorId };
}

// ──────────────────────────────────────────────────────────────────────
// TESTS
// ──────────────────────────────────────────────────────────────────────

describe('Multi-Tick Encounter Steps', () => {
  beforeEach(() => {
    enableTracing();
    // Mock getEncounterById to return our test template
    vi.spyOn(encounterContent, 'getEncounterById').mockImplementation((id: string) => {
      if (id === MULTI_TICK_TEMPLATE.id) return MULTI_TICK_TEMPLATE;
      return undefined;
    });
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
    vi.restoreAllMocks();
  });

  it('sets occupiedUntilTick to currentTick + step duration on initiation', () => {
    const { state, actorId } = buildTestState();
    const tick = 10;

    const progress = initiateEncounter(state, actorId, MULTI_TICK_TEMPLATE.id, tick);

    // First step has duration 3, so occupiedUntilTick = 10 + 3 = 13
    expect(progress.occupiedUntilTick).toBe(tick + 3);
  });

  it('reports agent as occupied when occupiedUntilTick > currentTick', () => {
    const { state, actorId } = buildTestState();
    const progress = initiateEncounter(state, actorId, MULTI_TICK_TEMPLATE.id, 10);

    // At tick 11, agent should still be occupied (occupiedUntilTick = 13)
    expect(isEncounterOccupied(progress, 11)).toBe(true);
    expect(isEncounterOccupied(progress, 12)).toBe(true);
  });

  it('reports agent as NOT occupied when currentTick >= occupiedUntilTick', () => {
    const { state, actorId } = buildTestState();
    const progress = initiateEncounter(state, actorId, MULTI_TICK_TEMPLATE.id, 10);

    // occupiedUntilTick = 13, so at tick 13 agent is ready
    expect(isEncounterOccupied(progress, 13)).toBe(false);
    expect(isEncounterOccupied(progress, 14)).toBe(false);
  });

  it('treats step with no duration field as duration 1 (backward compatible)', () => {
    const { state, actorId } = buildTestState();
    const progress = initiateEncounter(state, actorId, MULTI_TICK_TEMPLATE.id, 10);

    // Advance through step 1 (success) and step 2 (success) to reach step 3 (no duration)
    // Step 1: resolve at tick 13
    state.tick = 13;
    const result1 = resolveEncounter(state, progress, 30); // success
    advanceEncounter(state, progress, result1.success, 13);

    // Now at step 2 with duration 5 → occupiedUntilTick = 13 + 5 = 18
    expect(progress.occupiedUntilTick).toBe(18);

    // Step 2: resolve at tick 18
    state.tick = 18;
    const result2 = resolveEncounter(state, progress, 30); // success
    advanceEncounter(state, progress, result2.success, 18);

    // Now at step 3 with no duration → defaults to 1 → occupiedUntilTick = 18 + 1 = 19
    expect(progress.currentEncounterIndex).toBe(2);
    expect(progress.occupiedUntilTick).toBe(19);
  });

  it('treats missing occupiedUntilTick on active encounter as immediately resolvable', () => {
    // Build a progress object without occupiedUntilTick (legacy / undefined)
    const progress: EncounterProgress = {
      encounterId: MULTI_TICK_TEMPLATE.id,
      actorId: 'actor.mt1',
      currentEncounterIndex: 0,
      history: [],
      status: 'active',
      startedTick: 5,
      // occupiedUntilTick intentionally omitted
    };

    // Should not be considered occupied at any tick
    expect(isEncounterOccupied(progress, 5)).toBe(false);
    expect(isEncounterOccupied(progress, 0)).toBe(false);
    expect(isEncounterOccupied(progress, 100)).toBe(false);
  });

  it('updates occupiedUntilTick for new step after advancing on success', () => {
    const { state, actorId } = buildTestState();
    const progress = initiateEncounter(state, actorId, MULTI_TICK_TEMPLATE.id, 10);

    // First step: duration 3, occupiedUntilTick = 13
    expect(progress.occupiedUntilTick).toBe(13);

    // Resolve step 1 at tick 13 (success)
    state.tick = 13;
    const result = resolveEncounter(state, progress, 30);
    expect(result.success).toBe(true);

    advanceEncounter(state, progress, true, 13);

    // Moved to step 2 with duration 5 → occupiedUntilTick = 13 + 5 = 18
    expect(progress.currentEncounterIndex).toBe(1);
    expect(progress.occupiedUntilTick).toBe(18);
  });

  it('clears occupiedUntilTick when encounter is completed', () => {
    const { state, actorId } = buildTestState();
    const progress = initiateEncounter(state, actorId, MULTI_TICK_TEMPLATE.id, 10);

    // Walk through all steps successfully
    // Step 1 at tick 13
    state.tick = 13;
    advanceEncounter(state, progress, true, 13);

    // Step 2 at tick 18
    state.tick = 18;
    advanceEncounter(state, progress, true, 18);

    // Step 3 at tick 19
    state.tick = 19;
    advanceEncounter(state, progress, true, 19);

    expect(progress.status).toBe('completed');
    expect(progress.occupiedUntilTick).toBeUndefined();
  });

  it('clears occupiedUntilTick when encounter is abandoned on failure', () => {
    const { state, actorId } = buildTestState();
    const progress = initiateEncounter(state, actorId, MULTI_TICK_TEMPLATE.id, 10);

    // Fail step 1 at tick 13
    state.tick = 13;
    advanceEncounter(state, progress, false, 13);

    expect(progress.status).toBe('abandoned');
    expect(progress.occupiedUntilTick).toBeUndefined();
  });
});
