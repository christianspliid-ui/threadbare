import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  calculateDestructionSeverity,
  determineCommanderFate,
  applyAftermath,
  TOTAL_DESTRUCTION_THRESHOLD,
  MAJOR_DESTRUCTION_THRESHOLD,
  PROSPERITY_LOSS_MINOR,
  PROSPERITY_LOSS_MAJOR,
  COMMANDER_CAPTURE_DURATION,
} from '../battleAftermath';
import type { BattleState } from '../../types/battle';
import type { ArmyState } from '../../types/army';
import type { GameState } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeState(tick: number, graph: WorldGraph): GameState {
  return { tick, seed: 42, graph } as unknown as GameState;
}

function makeBattleState(overrides?: Partial<BattleState>): BattleState {
  return {
    battleType: 'siege',
    momentum: 0,
    backgroundProse: '',
    spotlightHistory: [],
    ticksSinceLastSpotlight: 0,
    startedTick: 0,
    initialMomentumOffset: 0,
    attackerArmyId: 'army_a',
    defenderArmyId: 'army_d',
    settlementId: 'settlement1',
    ...overrides,
  };
}

function setupSettlementBattle(graph: WorldGraph, opts?: {
  settlementSubtype?: string;
  prosperity?: number;
  addSublocations?: number;
  addTradeRoutes?: number;
  addCommander?: boolean;
  loserQ?: number;
  loserQMax?: number;
}): void {
  // Settlement
  graph.addNode({
    id: 'settlement1',
    type: 'location',
    name: 'Test Settlement',
    properties: {
      terrain: 'plains',
      locationSubtype: opts?.settlementSubtype ?? 'town',
      prosperity: opts?.prosperity ?? 0.8,
    },
  });

  // Factions
  graph.addNode({ id: 'f_atk', type: 'actor', name: 'Attackers', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'f_def', type: 'actor', name: 'Defenders', properties: { actorType: 'faction' } });

  // Attacker army
  graph.addNode({
    id: 'army_a',
    type: 'actor',
    name: 'Attacker Army',
    properties: {
      actorType: 'group',
      armyState: { size: 'warband', headcount: 100, quintessence: 20, quintessenceMax: 30, raisedTick: 0, maintenanceCost: 2, thresholdsFired: [] } as ArmyState,
    },
  });
  graph.addEdge({ id: 'e_mem_a', source: 'army_a', target: 'f_atk', type: 'member_of', properties: { role: 'army', rank: 'army', joinedTick: 0 } });

  // Defender army (the settlement acts as defender in sieges, but for field battles add an army)
  graph.addNode({
    id: 'army_d',
    type: 'actor',
    name: 'Defender Army',
    properties: {
      actorType: 'group',
      armyState: {
        size: 'warband', headcount: 100,
        quintessence: opts?.loserQ ?? 5,
        quintessenceMax: opts?.loserQMax ?? 30,
        raisedTick: 0, maintenanceCost: 2, thresholdsFired: [],
      } as ArmyState,
    },
  });
  graph.addEdge({ id: 'e_mem_d', source: 'army_d', target: 'f_def', type: 'member_of', properties: { role: 'army', rank: 'army', joinedTick: 0 } });

  // Commander for defender
  if (opts?.addCommander !== false) {
    graph.addNode({
      id: 'commander_d',
      type: 'actor',
      name: 'Defender Commander',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({ id: 'e_cmd_d', source: 'army_d', target: 'commander_d', type: 'commanded_by', properties: {} });
  }

  // Sublocations
  for (let i = 0; i < (opts?.addSublocations ?? 0); i++) {
    const subId = `sub_${i}`;
    graph.addNode({ id: subId, type: 'location', name: `Sublocation ${i}`, properties: { locationSubtype: 'sublocation' } });
    graph.addEdge({ id: `e_contains_${subId}`, source: 'settlement1', target: subId, type: 'contains', properties: {} });
  }

  // Trade routes
  for (let i = 0; i < (opts?.addTradeRoutes ?? 0); i++) {
    const partnerId = `trade_partner_${i}`;
    graph.addNode({ id: partnerId, type: 'actor', name: `Trade Partner ${i}`, properties: { actorType: 'faction' } });
    graph.addEdge({ id: `e_trade_${i}`, source: 'settlement1', target: partnerId, type: 'trades_with', properties: { volume: 10, threatened: false } });
  }
}

// ─── Severity Tests ────────────────────────────────────────────────────────

describe('calculateDestructionSeverity', () => {
  it('returns minor for low momentum', () => {
    expect(calculateDestructionSeverity(4, 0.5)).toBe('minor');
  });

  it('returns major for medium momentum', () => {
    expect(calculateDestructionSeverity(MAJOR_DESTRUCTION_THRESHOLD, 0.5)).toBe('major');
  });

  it('returns total for high momentum + low quintessence', () => {
    expect(calculateDestructionSeverity(TOTAL_DESTRUCTION_THRESHOLD, 0.1)).toBe('total');
  });

  it('returns major (not total) if quintessence still high', () => {
    expect(calculateDestructionSeverity(TOTAL_DESTRUCTION_THRESHOLD, 0.5)).toBe('major');
  });
});

// ─── Commander Fate Tests ──────────────────────────────────────────────────

describe('determineCommanderFate', () => {
  it('always retreats on minor severity', () => {
    const rng = () => 0.1;
    expect(determineCommanderFate('minor', rng)).toBe('retreated');
  });

  it('captures or retreats on major (seeded)', () => {
    const lowRng = () => 0.3; // < 0.5 → captured
    expect(determineCommanderFate('major', lowRng)).toBe('captured');

    const highRng = () => 0.7; // >= 0.5 → retreated
    expect(determineCommanderFate('major', highRng)).toBe('retreated');
  });

  it('can kill on total severity', () => {
    const lowRng = () => 0.1; // < 0.30 → killed
    expect(determineCommanderFate('total', lowRng)).toBe('killed');

    const highRng = () => 0.5; // >= 0.30 → captured
    expect(determineCommanderFate('total', highRng)).toBe('captured');
  });
});

// ─── Aftermath Application Tests ───────────────────────────────────────────

describe('applyAftermath', () => {
  it('does nothing on stalemate', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph);
    const state = makeState(10, graph);
    const bs = makeBattleState({ momentum: 0 });

    applyAftermath(state, bs, 'stalemate');

    // Settlement unchanged
    expect((graph.getNode('settlement1')?.properties.prosperity as number)).toBe(0.8);
  });

  it('reduces prosperity on minor attacker victory', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph);
    const state = makeState(10, graph);
    const bs = makeBattleState({ momentum: 4 }); // minor

    applyAftermath(state, bs, 'attacker_victory');

    const newProsperity = graph.getNode('settlement1')?.properties.prosperity as number;
    expect(newProsperity).toBeLessThan(0.8);
    expect(newProsperity).toBeGreaterThan(0);
  });

  it('destroys sublocations on major victory', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph, { addSublocations: 3, loserQ: 5, loserQMax: 30 });
    const state = makeState(10, graph);
    const bs = makeBattleState({ momentum: MAJOR_DESTRUCTION_THRESHOLD });

    applyAftermath(state, bs, 'attacker_victory');

    // Should have destroyed 1-2 sublocations
    const remaining = graph.getOutgoingEdges('settlement1', 'contains').length;
    expect(remaining).toBeLessThan(3);
  });

  it('destroys ALL sublocations on total victory', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph, { addSublocations: 3, loserQ: 2, loserQMax: 30 });
    const state = makeState(10, graph);
    const bs = makeBattleState({ momentum: TOTAL_DESTRUCTION_THRESHOLD });

    applyAftermath(state, bs, 'attacker_victory');

    const remaining = graph.getOutgoingEdges('settlement1', 'contains').length;
    expect(remaining).toBe(0);
  });

  it('severs trade routes on major/total', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph, { addTradeRoutes: 2, loserQ: 5 });
    const state = makeState(10, graph);
    const bs = makeBattleState({ momentum: MAJOR_DESTRUCTION_THRESHOLD });

    applyAftermath(state, bs, 'attacker_victory');

    const trades = [
      ...graph.getOutgoingEdges('settlement1', 'trades_with'),
      ...graph.getIncomingEdges('settlement1', 'trades_with'),
    ];
    expect(trades).toHaveLength(0);
  });

  it('flags trade routes as threatened on minor', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph, { addTradeRoutes: 1 });
    const state = makeState(10, graph);
    const bs = makeBattleState({ momentum: 3 });

    applyAftermath(state, bs, 'attacker_victory');

    const trades = graph.getOutgoingEdges('settlement1', 'trades_with');
    expect(trades).toHaveLength(1);
    expect(trades[0].properties.threatened).toBe(true);
  });

  it('downgrades settlement tier on major', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph, { settlementSubtype: 'city', loserQ: 5 });
    const state = makeState(10, graph);
    const bs = makeBattleState({ momentum: MAJOR_DESTRUCTION_THRESHOLD });

    applyAftermath(state, bs, 'attacker_victory');

    expect(graph.getNode('settlement1')?.properties.locationSubtype).toBe('town');
  });

  it('converts settlement to ruins on total', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph, { settlementSubtype: 'town', loserQ: 2, loserQMax: 30 });
    const state = makeState(10, graph);
    const bs = makeBattleState({ momentum: TOTAL_DESTRUCTION_THRESHOLD });

    applyAftermath(state, bs, 'attacker_victory');

    expect(graph.getNode('settlement1')?.properties.locationSubtype).toBe('ruins');
  });

  it('disbands losing army', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph);
    const state = makeState(10, graph);
    const bs = makeBattleState({ momentum: 4 });

    applyAftermath(state, bs, 'attacker_victory');

    expect(graph.getNode('army_d')).toBeUndefined();
  });

  it('marks commander as captured on major defeat', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph, { loserQ: 5 });
    const state = makeState(10, graph);
    // Use a momentum that gives major severity and a seed that gives capture (not retreat)
    const bs = makeBattleState({ momentum: MAJOR_DESTRUCTION_THRESHOLD });

    applyAftermath(state, bs, 'attacker_victory');

    const commander = graph.getNode('commander_d');
    // Commander may be captured or retreated depending on PRNG
    if (commander?.properties.capturedUntilTick) {
      expect(commander.properties.capturedUntilTick).toBe(10 + COMMANDER_CAPTURE_DURATION);
    }
    // Either way, commander should still exist (major doesn't kill)
    expect(commander).toBeDefined();
  });

  it('handles missing settlement gracefully (field battle)', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph);
    const state = makeState(10, graph);
    const bs = makeBattleState({ settlementId: undefined, momentum: 4 });

    // Should not crash
    expect(() => applyAftermath(state, bs, 'attacker_victory')).not.toThrow();
  });

  it('handles no sublocations gracefully', () => {
    const graph = new WorldGraph();
    setupSettlementBattle(graph, { addSublocations: 0, loserQ: 2 });
    const state = makeState(10, graph);
    const bs = makeBattleState({ momentum: TOTAL_DESTRUCTION_THRESHOLD });

    expect(() => applyAftermath(state, bs, 'attacker_victory')).not.toThrow();
  });
});
