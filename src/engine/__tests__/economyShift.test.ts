/**
 * THR-1953 (mortal wealth S3) — money encounters change the world.
 *
 * Binds the plan's S3 Done-when (Docs/plans/2026-10-15-thr-1936-mortal-wealth.md): the
 * world rows write through the widened `economy_shift` (prosperity, unrest, stock, lane
 * volume), the purse rows through `applyTreasuryDelta`, and the debt rows count as debts
 * (`countDebts`). Also: an outcome table's world rows give the aftermath `economy` changes
 * in the town page's words, and every no-move writes nothing (Law 56).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { executeStepResult } from '../unifiedActionResolution';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { applyWorldEconomyShift, resolveShiftSettlement } from '../economyShift';
import { WorldGraph } from '../graph';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { countDebts } from '../phaseEconomicTraits';
import { FACTION_TREASURY_CAP } from '../../data/faction-purse-constants';
import { TRADE_ROUTE_MAX_VOLUME } from '../tradeRoute';
import {
  ENCOUNTER_LANE_VOLUME_FLOOR,
  HARVEST_BAND_SCALE,
  HARVEST_ENCOUNTER_BASE,
  W_LANE,
  W_PROSPERITY,
  W_PURSE,
  W_STOCK,
  W_UNREST,
  harvestStockAmount,
} from '../../data/economy-shift-constants';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

const TICK = 10;
const fixedRng = () => 0.5;

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual', wealth: 30 } });
  graph.addNode({
    id: 'town-1', type: 'location', name: 'Ashford',
    properties: {
      locationSubtype: 'town', prosperity: 50, unrest: 10,
      resources: { grain: { resourceId: 'grain', quantity: 40 }, ore: { resourceId: 'ore', quantity: 30 }, medicinal_herb: { resourceId: 'medicinal_herb', quantity: 20 } },
    },
  });
  graph.addNode({ id: 'square-1', type: 'location', name: 'Ashford Market', properties: { parentLocationId: 'town-1' } });
  graph.addNode({ id: 'town-2', type: 'location', name: 'Brennock', properties: { locationSubtype: 'town', prosperity: 40 } });
  graph.addNode({ id: 'town-3', type: 'location', name: 'Carrow', properties: { locationSubtype: 'town', prosperity: 40 } });
  graph.addEdge({ id: 'lane-busy', source: 'town-1', target: 'town-2', type: 'trades_with', properties: { volume: 5, lastTraded: 0 } });
  graph.addEdge({ id: 'lane-quiet', source: 'town-3', target: 'town-1', type: 'trades_with', properties: { volume: 2, lastTraded: 0 } });
  graph.addNode({ id: 'faction-1', type: 'actor', name: 'The Crown', properties: { actorType: 'faction', wealth: 20 } });
  graph.addNode({ id: 'lair-1', type: 'actor', name: 'The Brood', properties: { actorType: 'faction', factionType: 'monster', wealth: 0 } });
  graph.addEdge({ id: 'at-1', source: 'actor-1', target: 'square-1', type: 'located_at', properties: {} });
  return graph;
}

function buildState(): GameState {
  return {
    tick: TICK, seed: 42, cycle: 1, phase: 'playing', graph: buildGraph(),
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

function makeAction(templateId: string): UnifiedAction {
  return {
    actionId: 'ua_world', actorId: 'actor-1', templateId, targetId: 'actor-1',
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
  } as unknown as UnifiedAction;
}

describe('THR-1953 — applyWorldEconomyShift', () => {
  it('moves prosperity and unrest on the settlement a sublocation belongs to, clamped 0–100', () => {
    const graph = buildGraph();
    expect(resolveShiftSettlement(graph, 'square-1')?.id).toBe('town-1');
    const p = applyWorldEconomyShift(graph, { quantity: 'prosperity', amount: W_PROSPERITY.step, settlementId: 'square-1' }, TICK);
    expect(p).toMatchObject({ nodeId: 'town-1', before: 50, after: 50 + W_PROSPERITY.step });
    const u = applyWorldEconomyShift(graph, { quantity: 'unrest', amount: -50, settlementId: 'town-1' }, TICK);
    expect(u).toMatchObject({ before: 10, after: 0, amount: -10 });
    // At the floor nothing moves and nothing is reported (Law 56).
    expect(applyWorldEconomyShift(graph, { quantity: 'unrest', amount: -W_UNREST.step, settlementId: 'town-1' }, TICK)).toBeNull();
  });

  it('moves stock by good: the staples, the deposits, or one named good', () => {
    const graph = buildGraph();
    const staple = applyWorldEconomyShift(graph, { quantity: 'stock', amount: harvestStockAmount('success'), good: 'staple', settlementId: 'town-1' }, TICK);
    expect(staple?.goods).toEqual(['grain']);
    const res = () => graph.getNode('town-1')!.properties.resources as Record<string, { quantity: number }>;
    expect(res().grain.quantity).toBe(40 + HARVEST_ENCOUNTER_BASE);
    expect(res().ore.quantity).toBe(30);
    applyWorldEconomyShift(graph, { quantity: 'stock', amount: -W_STOCK.step, good: 'deposit', settlementId: 'town-1' }, TICK);
    expect(res().ore.quantity).toBe(30 - W_STOCK.step);
    // A deposit is what a mine holds: the herb garden is not touched.
    expect(res().medicinal_herb.quantity).toBe(20);
    // A gain brings a good the town lacks; a loss on one it lacks writes nothing.
    expect(applyWorldEconomyShift(graph, { quantity: 'stock', amount: -W_STOCK.small, good: 'timber', settlementId: 'town-1' }, TICK)).toBeNull();
    applyWorldEconomyShift(graph, { quantity: 'stock', amount: W_STOCK.small, good: 'timber', settlementId: 'town-1' }, TICK);
    expect(res().timber.quantity).toBe(W_STOCK.small);
  });

  it('scales a staple write by band from a third of the god harvest', () => {
    expect(harvestStockAmount('critical_success')).toBe(Math.round(HARVEST_ENCOUNTER_BASE * HARVEST_BAND_SCALE.critical_success));
    expect(harvestStockAmount('failure')).toBe(0);
    expect(harvestStockAmount('critical_failure')).toBeLessThan(0);
  });

  it('moves the busiest lane at the town and never thins it below the floor', () => {
    const graph = buildGraph();
    const up = applyWorldEconomyShift(graph, { quantity: 'lane_volume', amount: W_LANE.big, settlementId: 'town-1' }, TICK);
    expect(up).toMatchObject({ nodeId: 'lane-busy', before: 5, after: 5 + W_LANE.big });
    expect(graph.getEdge('lane-busy')!.properties.lastTraded).toBe(TICK);
    expect(graph.getEdge('lane-quiet')!.properties.volume).toBe(2);
    applyWorldEconomyShift(graph, { quantity: 'lane_volume', amount: 100, settlementId: 'town-1' }, TICK);
    expect(graph.getEdge('lane-busy')!.properties.volume).toBe(TRADE_ROUTE_MAX_VOLUME);
    applyWorldEconomyShift(graph, { quantity: 'lane_volume', amount: -100, settlementId: 'town-1' }, TICK);
    expect(graph.getEdge('lane-busy')!.properties.volume).toBe(ENCOUNTER_LANE_VOLUME_FLOOR);
    // Whole volumes only: the daily traffic settle steps by 1 toward an integer level.
    expect(Number.isInteger(W_LANE.small) && Number.isInteger(W_LANE.step) && Number.isInteger(W_LANE.big)).toBe(true);
    applyWorldEconomyShift(graph, { quantity: 'lane_volume', amount: 2.4, settlementId: 'town-1' }, TICK);
    expect(Number.isInteger(graph.getEdge('lane-busy')!.properties.volume)).toBe(true);
    // A town with no lane: nothing to write.
    expect(applyWorldEconomyShift(graph, { quantity: 'lane_volume', amount: 1, settlementId: 'town-2' }, TICK)).not.toBeNull();
    graph.removeEdge('lane-busy');
    expect(applyWorldEconomyShift(graph, { quantity: 'lane_volume', amount: 1, settlementId: 'town-2' }, TICK)).toBeNull();
  });

  it('moves a faction purse through applyTreasuryDelta, never a monster lair or a non-faction', () => {
    const graph = buildGraph();
    const r = applyWorldEconomyShift(graph, { quantity: 'purse', amount: W_PURSE.step, factionId: 'faction-1' }, TICK);
    expect(r).toMatchObject({ before: 20, after: 20 + W_PURSE.step });
    applyWorldEconomyShift(graph, { quantity: 'purse', amount: 10 * FACTION_TREASURY_CAP, factionId: 'faction-1' }, TICK);
    expect(graph.getNode('faction-1')!.properties.wealth).toBe(FACTION_TREASURY_CAP);
    expect(applyWorldEconomyShift(graph, { quantity: 'purse', amount: W_PURSE.step, factionId: 'lair-1' }, TICK)).toBeNull();
    expect(applyWorldEconomyShift(graph, { quantity: 'purse', amount: W_PURSE.step, factionId: 'actor-1' }, TICK)).toBeNull();
    expect(applyWorldEconomyShift(graph, { quantity: 'purse', amount: W_PURSE.step, factionId: '$realm' }, TICK)).toBeNull();
  });
});

describe('THR-1953 — world rows through the aftermath executor', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('lands a world row on where the actor stands by default and traces it', () => {
    const state = buildState();
    const reaction: EncounterAftermathReaction = {
      id: 'r1', label: 'r',
      effects: [
        { kind: 'economy_shift', quantity: 'prosperity', amount: -W_PROSPERITY.step },
        { kind: 'economy_shift', quantity: 'purse', amount: W_PURSE.step, targetFactionId: 'faction-1' },
      ],
    };
    const { state: next } = applyEncounterAftermathReaction(state, makeAction('encounter.x'), reaction, TICK, runtime);
    expect(next.graph.getNode('town-1')!.properties.prosperity).toBe(50 - W_PROSPERITY.step);
    expect(next.graph.getNode('faction-1')!.properties.wealth).toBe(20 + W_PURSE.step);
    const traces = getTraces().filter(t => t.category === 'economy.world.shift');
    expect(traces.map(t => (t as unknown as { quantity: string }).quantity)).toEqual(['prosperity', 'purse']);
  });

  it('gives the aftermath an economy change for a world row in the outcome table, and none for a no-move', () => {
    const state = buildState();
    const template = {
      id: 'encounter.world-test', rarityTier: 1, intrinsicTier: 'background', name: 'World Test',
      reach: 'gold', crudType: 'read', encounterType: 'trade', scale: 'personal',
      steps: [{ reach: 'gold', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' }],
      apCost: 1, actorAffinities: ['individual'], motivations: ['courage_prudence'],
      narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
      outcomeEffects: {
        // 50 → 70 crosses Modest into Prosperous: a crossed row naming the word.
        success: [{ kind: 'economy_shift', quantity: 'prosperity', amount: 20 }],
        failure: [{ kind: 'economy_shift', quantity: 'unrest', amount: -100 }, { kind: 'economy_shift', quantity: 'unrest', amount: -W_UNREST.step }],
      },
    } as unknown as UnifiedActionTemplate;
    const { updatedAction } = executeStepResult(makeAction(template.id), template, 'success', [], state, fixedRng, TICK, undefined, runtime);
    const economy = (updatedAction.aftermathSummary?.changes ?? []).filter(c => c.kind === 'economy');
    expect(economy).toHaveLength(1);
    expect(economy[0]).toMatchObject({ economyQuantity: 'prosperity', crossed: true });
    expect(economy[0].detail).toContain('Ashford');
    expect(economy[0].detail).not.toMatch(/\d/);
  });
});

describe('THR-1953 — the shipped rows', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { runtime = createSimulationRuntime(); });

  it('a failed granary riot empties the granary, stirs the town and costs it prosperity', () => {
    const template = getUnifiedTemplateById('encounter.town.granary_riot')!;
    expect(template).toBeDefined();
    const effects = template.outcomeEffects?.failure ?? [];
    const quantities = effects.filter(e => e.kind === 'economy_shift').map(e => (e as { quantity: string }).quantity);
    expect(quantities).toEqual(expect.arrayContaining(['stock', 'unrest', 'prosperity']));
    const state = buildState();
    const reaction: EncounterAftermathReaction = { id: 'riot', label: 'r', effects };
    const { state: next } = applyEncounterAftermathReaction(state, makeAction(template.id), reaction, TICK, runtime);
    const town = next.graph.getNode('town-1')!.properties;
    expect(town.unrest).toBe(10 + W_UNREST.step);
    expect(town.prosperity).toBe(50 - W_PROSPERITY.small);
    expect((town.resources as Record<string, { quantity: number }>).grain.quantity).toBe(40 - W_STOCK.step);
  });

  it('a debt row counts as a debt (countDebts)', () => {
    const template = getUnifiedTemplateById('encounter.town.tithe_barn_raid')!;
    const effects = template.outcomeEffects?.success_at_cost ?? [];
    const grant = effects.find(e => e.kind === 'attachment_grant');
    expect(grant).toBeDefined();
    const state = buildState();
    state.graph.addNode({ id: 'reeve-1', type: 'actor', name: 'Reeve Ost', properties: { actorType: 'individual' } });
    const action = { ...makeAction(template.id), supportBindings: [{ key: 'reeve', nodeId: 'reeve-1' }] } as unknown as UnifiedAction;
    expect(countDebts(state.graph, 'actor-1', TICK)).toBe(0);
    const { state: next } = applyEncounterAftermathReaction(state, action, { id: 'owed', label: 'r', effects: [grant!] }, TICK, runtime);
    expect(countDebts(next.graph, 'actor-1', TICK)).toBe(1);
  });
});
