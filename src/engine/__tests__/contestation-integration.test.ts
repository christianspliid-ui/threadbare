/**
 * Contestation integration test — end-to-end scenario where two actions
 * contest at the same location through the unified pipeline.
 *
 * Sprint 4 — Task 4.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { phaseUnifiedActionProgress } from '../unifiedActionResolution';
import { generateUnifiedCandidates, THREAT_REACTION_BONUS } from '../unifiedCandidates';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { resetOpCounter } from '../graphOpExecutor';
import { clearTraces } from '../traceBuffer';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';

// ─── Templates ──────────────────────────────────────────────────

const SIEGE_TEMPLATE: UnifiedActionTemplate = {
  id: 'warfare.siege_city',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'Siege City',
  reach: 'iron',
  crudType: 'update',
  scale: 'local',
  steps: [{
    reach: 'iron',
    duration: { min: 3, max: 3 },
    difficulty: 0.4,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'fail_action',
  }],
  apCost: 1,
  actorAffinities: ['individual', 'faction'],
  contestsWith: ['warfare.defend_city'],
  motivations: ['loyalty_ambition'],
  narrativeTemplates: {
    initiation: 'lays siege to the city',
    success: 'breaches the walls',
    failure: 'is repelled',
    contested: 'clashes with the defenders',
  },
};

const DEFEND_TEMPLATE: UnifiedActionTemplate = {
  id: 'warfare.defend_city',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'Defend City',
  reach: 'iron',
  crudType: 'update',
  scale: 'local',
  steps: [{
    reach: 'iron',
    duration: { min: 3, max: 3 },
    difficulty: 0.3,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'fail_action',
  }],
  apCost: 1,
  actorAffinities: ['individual', 'faction'],
  contestsWith: ['warfare.siege_city'],
  motivations: ['courage_prudence'],
  narrativeTemplates: {
    initiation: 'rallies the defense',
    success: 'holds the walls',
    failure: 'defense crumbles',
    contested: 'clashes with the besiegers',
  },
};

const TRADE_TEMPLATE: UnifiedActionTemplate = {
  id: 'economy.trade',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'Trade Goods',
  reach: 'gold',
  crudType: 'update',
  scale: 'personal',
  steps: [{
    reach: 'gold',
    duration: { min: 2, max: 2 },
    difficulty: 0.2,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'fail_action',
  }],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition'],
  narrativeTemplates: {
    initiation: 'begins trading',
    success: 'profits from trade',
    failure: 'trade falls through',
  },
};

const ALL_TEMPLATES = [SIEGE_TEMPLATE, DEFEND_TEMPLATE, TRADE_TEMPLATE];

// ─── Helpers ────────────────────────────────────────────────────

function createTestState(): GameState {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'loc-city', type: 'location', name: 'Iron Keep',
    properties: { locationType: 'town', locationSubtype: 'town' },
  });

  graph.addNode({
    id: 'actor-attacker', type: 'actor', name: 'Warlord',
    properties: { actorType: 'individual' },
  });
  graph.addEdge({
    id: 'e-atk', source: 'actor-attacker', target: 'loc-city',
    type: 'located_at', properties: {},
  });

  graph.addNode({
    id: 'actor-defender', type: 'actor', name: 'Captain',
    properties: { actorType: 'individual' },
  });
  graph.addEdge({
    id: 'e-def', source: 'actor-defender', target: 'loc-city',
    type: 'located_at', properties: {},
  });

  return {
    tick: 1,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc-1',
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
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('contestation integration', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
    clearTraces();
  });

  it('threat-reactive scoring boosts defend when siege is active', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'Defender', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc', type: 'location', name: 'City', properties: { locationType: 'town', locationSubtype: 'town' } });
    graph.addEdge({ id: 'e1', source: 'a1', target: 'loc', type: 'located_at', properties: {} });

    // Siege is active at the location
    const siegeAction: UnifiedAction = {
      actionId: 'siege-1',
      actorId: 'actor-enemy',
      templateId: 'warfare.siege_city',
      targetId: 'loc',
      scale: 'local',
      source: 'agent',
      startTick: 1,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 3,
      resolved: false,
      stepOutcomes: [],
    };

    const candidates = generateUnifiedCandidates(
      graph, 'a1', 'loc', ALL_TEMPLATES, [siegeAction],
    );

    const defend = candidates.find(c => c.templateId === 'warfare.defend_city');
    const trade = candidates.find(c => c.templateId === 'economy.trade');

    expect(defend).toBeDefined();
    expect(defend!.score).toBe(THREAT_REACTION_BONUS);
    expect(trade).toBeDefined();
    expect(trade!.score).toBe(0);
  });

  it('two opposing actions completing on same tick trigger contestation', () => {
    const state = createTestState();

    // Create siege action (attacker) — 3 ticks, starting at tick 1
    const siege = createUnifiedAction({
      actorId: 'actor-attacker',
      templateId: 'warfare.siege_city',
      targetId: 'loc-city',
      scale: 'local',
      source: 'agent',
      tick: 1,
      template: SIEGE_TEMPLATE,
      rng: () => 0.5,
    });

    // Create defend action (defender) — 3 ticks, starting at tick 1
    const defend = createUnifiedAction({
      actorId: 'actor-defender',
      templateId: 'warfare.defend_city',
      targetId: 'loc-city',
      scale: 'local',
      source: 'agent',
      tick: 1,
      template: DEFEND_TEMPLATE,
      rng: () => 0.5,
    });

    // Both have duration 3. Progress them 2 ticks so stepProgress=2.
    // On the next phaseUnifiedActionProgress call, they'll hit stepProgress=3 (=duration).
    state.unifiedActions = [
      { ...siege, stepProgress: 2 },
      { ...defend, stepProgress: 2 },
    ];
    state.tick = 4;

    // Run the unified pipeline — both complete this tick, contestation should fire
    const rng = () => 0.5; // mid-range roll
    const result = phaseUnifiedActionProgress(state, ALL_TEMPLATES, rng);

    // Both actions should be resolved
    const updatedActions = result.unifiedActions!;
    expect(updatedActions.every(a => a.resolved)).toBe(true);

    // Events should mention resolution
    const events = result.tickEvents!;
    expect(events.length).toBeGreaterThan(0);
    expect(events.some(e => e.message.includes('Warlord'))).toBe(true);
    expect(events.some(e => e.message.includes('Captain'))).toBe(true);
  });

  it('contested pair produces one winner and one loser (or mutual failure)', () => {
    const state = createTestState();

    const siege = createUnifiedAction({
      actorId: 'actor-attacker',
      templateId: 'warfare.siege_city',
      targetId: 'loc-city',
      scale: 'local',
      source: 'agent',
      tick: 1,
      template: SIEGE_TEMPLATE,
      rng: () => 0.5,
    });

    const defend = createUnifiedAction({
      actorId: 'actor-defender',
      templateId: 'warfare.defend_city',
      targetId: 'loc-city',
      scale: 'local',
      source: 'agent',
      tick: 1,
      template: DEFEND_TEMPLATE,
      rng: () => 0.5,
    });

    state.unifiedActions = [
      { ...siege, stepProgress: 2 },
      { ...defend, stepProgress: 2 },
    ];
    state.tick = 4;

    // Use low roll (both succeed → stalemate → defender wins due to stability bias)
    const rng = () => 0.01;
    const result = phaseUnifiedActionProgress(state, ALL_TEMPLATES, rng);

    const siegeResult = result.unifiedActions!.find(a => a.templateId === 'warfare.siege_city')!;
    const defendResult = result.unifiedActions!.find(a => a.templateId === 'warfare.defend_city')!;

    // Stalemate → defender wins (stability bias)
    expect(siegeResult.resolved).toBe(true);
    expect(defendResult.resolved).toBe(true);
    expect(siegeResult.outcome).toBe('failure');
    expect(defendResult.outcome).toBe('success');
  });

  it('uncontested actions at same location resolve normally alongside contested ones', () => {
    const state = createTestState();

    // Add a trader at the same location
    state.graph.addNode({
      id: 'actor-trader', type: 'actor', name: 'Merchant',
      properties: { actorType: 'individual' },
    });
    state.graph.addEdge({
      id: 'e-trader', source: 'actor-trader', target: 'loc-city',
      type: 'located_at', properties: {},
    });

    const siege = createUnifiedAction({
      actorId: 'actor-attacker',
      templateId: 'warfare.siege_city',
      targetId: 'loc-city',
      scale: 'local',
      source: 'agent',
      tick: 1,
      template: SIEGE_TEMPLATE,
      rng: () => 0.5,
    });

    const defend = createUnifiedAction({
      actorId: 'actor-defender',
      templateId: 'warfare.defend_city',
      targetId: 'loc-city',
      scale: 'local',
      source: 'agent',
      tick: 1,
      template: DEFEND_TEMPLATE,
      rng: () => 0.5,
    });

    // Trader has a 2-tick action completing this tick
    const trade = createUnifiedAction({
      actorId: 'actor-trader',
      templateId: 'economy.trade',
      targetId: 'loc-city',
      scale: 'personal',
      source: 'agent',
      tick: 2,
      template: TRADE_TEMPLATE,
      rng: () => 0.5,
    });

    state.unifiedActions = [
      { ...siege, stepProgress: 2 },
      { ...defend, stepProgress: 2 },
      { ...trade, stepProgress: 1 }, // trade is 2-tick, needs 1 more
    ];
    state.tick = 4;

    const rng = () => 0.01;
    const result = phaseUnifiedActionProgress(state, ALL_TEMPLATES, rng);

    // All three should be resolved
    const resolved = result.unifiedActions!.filter(a => a.resolved);
    expect(resolved.length).toBe(3);

    // Trade completes independently (low roll, easy difficulty).
    // With near-miss detection, a very low roll (0.01) on difficulty 0.2 may yield
    // 'success_at_cost' instead of clean 'success' — both are valid success outcomes.
    const tradeResult = result.unifiedActions!.find(a => a.templateId === 'economy.trade')!;
    expect(['success', 'success_at_cost']).toContain(tradeResult.outcome);
  });

  it('deterministic: same seed produces same contestation outcome', () => {
    function runScenario(): { siegeOutcome: string; defendOutcome: string } {
      resetUnifiedActionCounter();
      resetOpCounter();
      clearTraces();

      const state = createTestState();
      const siege = createUnifiedAction({
        actorId: 'actor-attacker',
        templateId: 'warfare.siege_city',
        targetId: 'loc-city',
        scale: 'local',
        source: 'agent',
        tick: 1,
        template: SIEGE_TEMPLATE,
        rng: () => 0.5,
      });
      const defend = createUnifiedAction({
        actorId: 'actor-defender',
        templateId: 'warfare.defend_city',
        targetId: 'loc-city',
        scale: 'local',
        source: 'agent',
        tick: 1,
        template: DEFEND_TEMPLATE,
        rng: () => 0.5,
      });

      state.unifiedActions = [
        { ...siege, stepProgress: 2 },
        { ...defend, stepProgress: 2 },
      ];
      state.tick = 4;

      const rng = () => 0.42;
      const result = phaseUnifiedActionProgress(state, ALL_TEMPLATES, rng);

      return {
        siegeOutcome: result.unifiedActions!.find(a => a.templateId === 'warfare.siege_city')!.outcome!,
        defendOutcome: result.unifiedActions!.find(a => a.templateId === 'warfare.defend_city')!.outcome!,
      };
    }

    const run1 = runScenario();
    const run2 = runScenario();
    expect(run1).toEqual(run2);
  });
});
