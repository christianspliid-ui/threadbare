import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseEconomicTraits } from '../phaseEconomicTraits';
import { getTraitsForNode } from '../traits';
import type { GameState } from '../../types/gameState';
import {
  ECON_TRAIT_TRADE_BARON_MIN_ROUTES,
  ECON_TRAIT_GUILD_SWORN_MIN_TICKS,
  ECON_TRAIT_BANKRUPT_WEALTH_FLOOR,
  ECON_TRAIT_SMUGGLER_MIN_ENCOUNTERS,
  ECON_TRAIT_DEBT_LADEN_MIN_DEBTS,
  ECON_TRAIT_PATRON_MIN_CONSTRUCTIONS,
  ECON_TRAIT_COIN_CURSED_MIN_LOSSES,
} from '../../data/economic-trait-content';
import {
  WEALTH_TIER_WEALTHY,
  WEALTH_TIER_COMFORTABLE,
  WEALTH_TIER_GETTING_BY,
} from '../wealth';

// ─── Test helpers ───────────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function makeActor(graph: WorldGraph, id: string, wealth: number, extras: Record<string, unknown> = {}): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Actor ${id}`,
    properties: { actorType: 'individual', wealth, ...extras },
  });
}

function makeGuildFaction(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Guild ${id}`,
    properties: { actorType: 'faction', guildType: 'merchants' },
  });
}

function makeMinimalState(graph: WorldGraph, tick: number, overrides: Partial<GameState> = {}): GameState {
  return {
    graph,
    tick,
    tickEvents: [],
    recentEvents: [],
    encounterProgress: [],
    unifiedActions: [],
    actionsInProgress: [],
    ...overrides,
  } as unknown as GameState;
}

function hasTraitOnActor(graph: WorldGraph, actorId: string, traitId: string): boolean {
  return getTraitsForNode(graph, actorId).some(e => e.target === traitId);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('phaseEconomicTraits', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = makeGraph();
  });

  describe('trade-baron', () => {
    it('assigns trade-baron when actor controls enough routes and is wealthy', () => {
      makeActor(graph, 'a1', WEALTH_TIER_WEALTHY);
      // Create trade partners and routes controlled by a1
      for (let i = 0; i < ECON_TRAIT_TRADE_BARON_MIN_ROUTES; i++) {
        makeActor(graph, `partner${i}`, 30);
        graph.addEdge({
          id: `route${i}`,
          source: `partner${i}`,
          target: 'a1',
          type: 'trades_with',
          properties: { volume: 5, controlledBy: 'a1' },
        });
      }

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.mastery.trade-baron')).toBe(true);
    });

    it('does not assign trade-baron when wealth is below threshold', () => {
      makeActor(graph, 'a1', WEALTH_TIER_WEALTHY - 1);
      for (let i = 0; i < ECON_TRAIT_TRADE_BARON_MIN_ROUTES; i++) {
        makeActor(graph, `partner${i}`, 30);
        graph.addEdge({
          id: `route${i}`,
          source: `partner${i}`,
          target: 'a1',
          type: 'trades_with',
          properties: { volume: 5, controlledBy: 'a1' },
        });
      }

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.mastery.trade-baron')).toBe(false);
    });

    it('does not assign trade-baron when routes are below threshold', () => {
      makeActor(graph, 'a1', WEALTH_TIER_WEALTHY);
      makeActor(graph, 'partner0', 30);
      graph.addEdge({
        id: 'route0',
        source: 'partner0',
        target: 'a1',
        type: 'trades_with',
        properties: { volume: 5, controlledBy: 'a1' },
      });

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.mastery.trade-baron')).toBe(false);
    });
  });

  describe('guild-sworn', () => {
    it('assigns guild-sworn after sufficient membership duration', () => {
      makeActor(graph, 'a1', 30, { guildJoinedTick: 0 });
      makeGuildFaction(graph, 'guild1');
      graph.addEdge({
        id: 'mem1',
        source: 'a1',
        target: 'guild1',
        type: 'member_of',
        properties: { role: 'member' },
      });

      const state = makeMinimalState(graph, ECON_TRAIT_GUILD_SWORN_MIN_TICKS);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.cultural.guild-sworn')).toBe(true);
    });

    it('does not assign guild-sworn before sufficient duration', () => {
      makeActor(graph, 'a1', 30, { guildJoinedTick: 0 });
      makeGuildFaction(graph, 'guild1');
      graph.addEdge({
        id: 'mem1',
        source: 'a1',
        target: 'guild1',
        type: 'member_of',
        properties: { role: 'member' },
      });

      const state = makeMinimalState(graph, ECON_TRAIT_GUILD_SWORN_MIN_TICKS - 1);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.cultural.guild-sworn')).toBe(false);
    });

    it('sets guildJoinedTick on first observation of guild membership', () => {
      makeActor(graph, 'a1', 30);
      makeGuildFaction(graph, 'guild1');
      graph.addEdge({
        id: 'mem1',
        source: 'a1',
        target: 'guild1',
        type: 'member_of',
        properties: { role: 'member' },
      });

      const state = makeMinimalState(graph, 5);
      phaseEconomicTraits(state);

      const node = graph.getNode('a1')!;
      expect(node.properties.guildJoinedTick).toBe(5);
    });
  });

  describe('bankrupt', () => {
    it('assigns bankrupt when wealth drops below floor from comfortable peak', () => {
      makeActor(graph, 'a1', ECON_TRAIT_BANKRUPT_WEALTH_FLOOR - 1, {
        economicPeakWealth: WEALTH_TIER_COMFORTABLE,
      });

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.scar.bankrupt')).toBe(true);
    });

    it('does not assign bankrupt if peak was never comfortable', () => {
      makeActor(graph, 'a1', ECON_TRAIT_BANKRUPT_WEALTH_FLOOR - 1, {
        economicPeakWealth: WEALTH_TIER_COMFORTABLE - 1,
      });

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.scar.bankrupt')).toBe(false);
    });

    it('clears bankrupt when wealth rises above GETTING_BY', () => {
      makeActor(graph, 'a1', WEALTH_TIER_GETTING_BY, {
        economicPeakWealth: WEALTH_TIER_COMFORTABLE,
      });

      // First, assign bankrupt manually by running with low wealth
      makeActor(graph, 'a1_setup', 2, { economicPeakWealth: WEALTH_TIER_COMFORTABLE });
      const setupState = makeMinimalState(graph, 8);
      phaseEconomicTraits(setupState);
      expect(hasTraitOnActor(graph, 'a1_setup', 'trait.scar.bankrupt')).toBe(true);

      // Now update wealth to above GETTING_BY
      graph.updateNode('a1_setup', { properties: { wealth: WEALTH_TIER_GETTING_BY } });
      const state2 = makeMinimalState(graph, 9);
      phaseEconomicTraits(state2);

      expect(hasTraitOnActor(graph, 'a1_setup', 'trait.scar.bankrupt')).toBe(false);
    });
  });

  describe('monopolist', () => {
    it('assigns monopolist when actor controls a monopoly', () => {
      makeActor(graph, 'a1', 50);
      graph.addNode({
        id: 'loc1',
        type: 'location',
        name: 'Testville',
        properties: { locationSubtype: 'town', monopolyControlledBy: 'a1' },
      });

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.reputation.monopolist')).toBe(true);
    });

    it('does not assign monopolist when no monopoly exists', () => {
      makeActor(graph, 'a1', 50);
      graph.addNode({
        id: 'loc1',
        type: 'location',
        name: 'Testville',
        properties: { locationSubtype: 'town' },
      });

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.reputation.monopolist')).toBe(false);
    });
  });

  describe('smuggler', () => {
    it('assigns smuggler after enough completed smuggler encounters', () => {
      makeActor(graph, 'a1', 30);

      const encounters = [];
      for (let i = 0; i < ECON_TRAIT_SMUGGLER_MIN_ENCOUNTERS; i++) {
        encounters.push({
          encounterId: 'encounter.black_market_deal',
          actorId: 'a1',
          currentEncounterIndex: 2,
          history: [],
          status: 'completed' as const,
          sublocationId: `subloc${i}`,
        });
      }

      const state = makeMinimalState(graph, 10, { encounterProgress: encounters });
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.mastery.smuggler')).toBe(true);
    });

    it('counts unified actions with smuggler encounter template IDs', () => {
      makeActor(graph, 'a1', 30);

      const actions = [];
      for (let i = 0; i < ECON_TRAIT_SMUGGLER_MIN_ENCOUNTERS; i++) {
        actions.push({
          actionId: `act${i}`,
          actorId: 'a1',
          templateId: 'encounter.the_fence',
          targetId: 'loc1',
          scale: 'local' as const,
          source: 'agent' as const,
          startTick: 1,
          currentStep: 0,
          stepProgress: 0,
          stepDuration: 1,
          resolved: true,
          outcome: 'success' as const,
          stepOutcomes: ['success' as const],
        });
      }

      const state = makeMinimalState(graph, 10, { unifiedActions: actions });
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.mastery.smuggler')).toBe(true);
    });

    it('does not assign smuggler with insufficient encounters', () => {
      makeActor(graph, 'a1', 30);
      const state = makeMinimalState(graph, 10, {
        encounterProgress: [{
          encounterId: 'encounter.black_market_deal',
          actorId: 'a1',
          currentEncounterIndex: 2,
          history: [],
          status: 'completed' as const,
          sublocationId: 'subloc0',
        }],
      });
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.mastery.smuggler')).toBe(false);
    });
  });

  describe('debt-laden', () => {
    it('assigns debt-laden with enough active debt agreements', () => {
      makeActor(graph, 'a1', 30);
      makeActor(graph, 'creditor1', 50);
      makeActor(graph, 'creditor2', 50);

      for (let i = 0; i < ECON_TRAIT_DEBT_LADEN_MIN_DEBTS; i++) {
        graph.addEdge({
          id: `debt${i}`,
          source: 'a1',
          target: `creditor${i + 1}`,
          type: 'relates_to',
          properties: { agreement: { type: 'debt', tier: 1, terms: 'owes gold' } },
        });
      }

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.condition.debt-laden')).toBe(true);
    });

    it('clears debt-laden when all debts are paid', () => {
      makeActor(graph, 'a1', 30);
      makeActor(graph, 'creditor1', 50);
      makeActor(graph, 'creditor2', 50);

      // Create debts
      graph.addEdge({
        id: 'debt0',
        source: 'a1',
        target: 'creditor1',
        type: 'relates_to',
        properties: { agreement: { type: 'debt', tier: 1, terms: 'owes gold' } },
      });
      graph.addEdge({
        id: 'debt1',
        source: 'a1',
        target: 'creditor2',
        type: 'relates_to',
        properties: { agreement: { type: 'debt', tier: 1, terms: 'owes gold' } },
      });

      // Assign debt-laden
      const state1 = makeMinimalState(graph, 10);
      phaseEconomicTraits(state1);
      expect(hasTraitOnActor(graph, 'a1', 'trait.condition.debt-laden')).toBe(true);

      // Remove all debts
      graph.removeEdge('debt0');
      graph.removeEdge('debt1');

      const state2 = makeMinimalState(graph, 11);
      phaseEconomicTraits(state2);
      expect(hasTraitOnActor(graph, 'a1', 'trait.condition.debt-laden')).toBe(false);
    });

    it('does not assign debt-laden with insufficient debts', () => {
      makeActor(graph, 'a1', 30);
      makeActor(graph, 'creditor1', 50);
      graph.addEdge({
        id: 'debt0',
        source: 'a1',
        target: 'creditor1',
        type: 'relates_to',
        properties: { agreement: { type: 'debt', tier: 1, terms: 'owes gold' } },
      });

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.condition.debt-laden')).toBe(false);
    });
  });

  describe('patron', () => {
    it('assigns patron after enough successful fund-construction actions', () => {
      makeActor(graph, 'a1', 50);

      const actions = [];
      for (let i = 0; i < ECON_TRAIT_PATRON_MIN_CONSTRUCTIONS; i++) {
        actions.push({
          actionId: `build${i}`,
          actorId: 'a1',
          templateId: 'action.gold.fund-construction',
          targetId: 'loc1',
          scale: 'local' as const,
          source: 'agent' as const,
          startTick: 1,
          currentStep: 0,
          stepProgress: 0,
          stepDuration: 1,
          resolved: true,
          outcome: 'success' as const,
          stepOutcomes: ['success' as const],
        });
      }

      const state = makeMinimalState(graph, 10, { unifiedActions: actions });
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.reputation.patron')).toBe(true);
    });

    it('does not assign patron with failed constructions', () => {
      makeActor(graph, 'a1', 50);

      const actions = [];
      for (let i = 0; i < ECON_TRAIT_PATRON_MIN_CONSTRUCTIONS; i++) {
        actions.push({
          actionId: `build${i}`,
          actorId: 'a1',
          templateId: 'action.gold.fund-construction',
          targetId: 'loc1',
          scale: 'local' as const,
          source: 'agent' as const,
          startTick: 1,
          currentStep: 0,
          stepProgress: 0,
          stepDuration: 1,
          resolved: true,
          outcome: 'failure' as const,
          stepOutcomes: ['failure' as const],
        });
      }

      const state = makeMinimalState(graph, 10, { unifiedActions: actions });
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.reputation.patron')).toBe(false);
    });
  });

  describe('coin-cursed', () => {
    it('assigns coin-cursed after enough wealth loss events', () => {
      makeActor(graph, 'a1', 20, {
        previousTickWealth: 25,
        wealthLossCount: ECON_TRAIT_COIN_CURSED_MIN_LOSSES - 1,
      });

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.scar.coin-cursed')).toBe(true);
    });

    it('does not assign coin-cursed with insufficient loss events', () => {
      makeActor(graph, 'a1', 20, {
        previousTickWealth: 25,
        wealthLossCount: 0,
      });

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      expect(hasTraitOnActor(graph, 'a1', 'trait.scar.coin-cursed')).toBe(false);
    });

    it('increments wealthLossCount when wealth decreases', () => {
      makeActor(graph, 'a1', 30, { previousTickWealth: 35, wealthLossCount: 0 });

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      const node = graph.getNode('a1')!;
      expect(node.properties.wealthLossCount).toBe(1);
    });

    it('does not increment wealthLossCount when wealth is stable', () => {
      makeActor(graph, 'a1', 30, { previousTickWealth: 30, wealthLossCount: 0 });

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      const node = graph.getNode('a1')!;
      expect(node.properties.wealthLossCount).toBe(0);
    });
  });

  describe('fail-soft', () => {
    it('skips actors without wealth property', () => {
      graph.addNode({
        id: 'a1',
        type: 'actor',
        name: 'Pauper',
        properties: { actorType: 'individual' },
      });

      const state = makeMinimalState(graph, 10);
      // Should not throw
      expect(() => phaseEconomicTraits(state)).not.toThrow();
    });

    it('skips non-individual actors', () => {
      graph.addNode({
        id: 'fac1',
        type: 'actor',
        name: 'Some Faction',
        properties: { actorType: 'faction', wealth: 80 },
      });

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      // Should not assign any traits to factions
      expect(getTraitsForNode(graph, 'fac1')).toHaveLength(0);
    });

    it('ensures trait definition nodes are added to graph', () => {
      makeActor(graph, 'a1', 30);

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);

      // All 8 economic trait definition nodes should exist
      expect(graph.getNode('trait.mastery.trade-baron')).toBeDefined();
      expect(graph.getNode('trait.cultural.guild-sworn')).toBeDefined();
      expect(graph.getNode('trait.scar.bankrupt')).toBeDefined();
      expect(graph.getNode('trait.reputation.monopolist')).toBeDefined();
      expect(graph.getNode('trait.mastery.smuggler')).toBeDefined();
      expect(graph.getNode('trait.condition.debt-laden')).toBeDefined();
      expect(graph.getNode('trait.reputation.patron')).toBeDefined();
      expect(graph.getNode('trait.scar.coin-cursed')).toBeDefined();
    });

    it('is idempotent — running twice does not duplicate traits', () => {
      makeActor(graph, 'a1', WEALTH_TIER_WEALTHY);
      for (let i = 0; i < ECON_TRAIT_TRADE_BARON_MIN_ROUTES; i++) {
        makeActor(graph, `p${i}`, 30);
        graph.addEdge({
          id: `r${i}`,
          source: `p${i}`,
          target: 'a1',
          type: 'trades_with',
          properties: { volume: 5, controlledBy: 'a1' },
        });
      }

      const state = makeMinimalState(graph, 10);
      phaseEconomicTraits(state);
      phaseEconomicTraits(state);

      const traits = getTraitsForNode(graph, 'a1').filter(
        e => e.target === 'trait.mastery.trade-baron',
      );
      expect(traits).toHaveLength(1);
    });
  });

  describe('trait definition properties', () => {
    it('trade-baron has correct domain contributions', () => {
      makeActor(graph, 'a1', 30);
      const state = makeMinimalState(graph, 1);
      phaseEconomicTraits(state);

      const traitNode = graph.getNode('trait.mastery.trade-baron')!;
      expect(traitNode.properties.domainContributions).toEqual({ gold: 0.15 });
      expect(traitNode.properties.subcategory).toBe('mastery');
    });

    it('monopolist has gold bonus and heart penalty', () => {
      makeActor(graph, 'a1', 30);
      const state = makeMinimalState(graph, 1);
      phaseEconomicTraits(state);

      const traitNode = graph.getNode('trait.reputation.monopolist')!;
      expect(traitNode.properties.domainContributions).toEqual({ gold: 0.20, heart: -0.10 });
      expect(traitNode.properties.visibility).toBe('public');
    });

    it('smuggler has discoverable visibility and decay period', () => {
      makeActor(graph, 'a1', 30);
      const state = makeMinimalState(graph, 1);
      phaseEconomicTraits(state);

      const traitNode = graph.getNode('trait.mastery.smuggler')!;
      expect(traitNode.properties.visibility).toBe('discoverable');
      expect(traitNode.properties.decayPeriod).toBe(30);
    });
  });
});
