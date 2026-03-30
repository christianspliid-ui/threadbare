/**
 * Phase: Economic Traits — scans actors with wealth properties and assigns/removes
 * economic traits based on graph state and activity patterns.
 *
 * Runs after phaseProsperity. Assigns mastery/reputation/scar/condition traits
 * that emerge from economic activity. Uses existing has_trait edges.
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import { readWealth, WEALTH_TIER_WEALTHY, WEALTH_TIER_COMFORTABLE, WEALTH_TIER_GETTING_BY } from './wealth';
import { readTradeRouteProps } from './tradeRoute';
import { assignTrait, removeTrait, getTraitsForNode } from './traits';
import { emitTrace } from './traceBuffer';
import {
  ECON_TRAIT_TRADE_BARON_MIN_ROUTES,
  ECON_TRAIT_GUILD_SWORN_MIN_TICKS,
  ECON_TRAIT_BANKRUPT_WEALTH_FLOOR,
  ECON_TRAIT_SMUGGLER_MIN_ENCOUNTERS,
  ECON_TRAIT_DEBT_LADEN_MIN_DEBTS,
  ECON_TRAIT_PATRON_MIN_CONSTRUCTIONS,
  ECON_TRAIT_COIN_CURSED_MIN_LOSSES,
  ECONOMIC_TRAIT_DEFINITIONS,
} from '../data/economic-trait-content';

// ─── Trait IDs ──────────────────────────────────────────────────────────────

const TRAIT_TRADE_BARON = 'trait.mastery.trade-baron';
const TRAIT_GUILD_SWORN = 'trait.cultural.guild-sworn';
const TRAIT_BANKRUPT = 'trait.scar.bankrupt';
const TRAIT_MONOPOLIST = 'trait.reputation.monopolist';
const TRAIT_SMUGGLER = 'trait.mastery.smuggler';
const TRAIT_DEBT_LADEN = 'trait.condition.debt-laden';
const TRAIT_PATRON = 'trait.reputation.patron';
const TRAIT_COIN_CURSED = 'trait.scar.coin-cursed';

// ─── Smuggler's Den encounter IDs ───────────────────────────────────────────

const SMUGGLER_ENCOUNTER_IDS = new Set([
  'encounter.black_market_deal',
  'encounter.the_fence',
  'encounter.smuggler_pact',
]);

// ─── Fund Construction template ID ──────────────────────────────────────────

const FUND_CONSTRUCTION_TEMPLATE = 'action.gold.fund-construction';

// ─── Helpers ────────────────────────────────────────────────────────────────

function hasTrait(graph: WorldGraph, actorId: string, traitId: string): boolean {
  return getTraitsForNode(graph, actorId).some(e => e.target === traitId);
}

/**
 * Count trade routes controlled by this actor.
 * Walks all trades_with edges in the graph and counts those with controlledBy === actorId.
 */
function countControlledRoutes(graph: WorldGraph, actorId: string): number {
  let count = 0;
  // trades_with edges are between actors — scan all actors for routes controlled by this actor
  for (const actor of graph.getNodesByType('actor')) {
    const routes = graph.getOutgoingEdges(actor.id, 'trades_with');
    for (const edge of routes) {
      const props = readTradeRouteProps(edge.properties);
      if (props.controlledBy === actorId) count++;
    }
  }
  return count;
}

/**
 * Check if this actor is a member of a guild faction.
 * Returns the member_of edge if found, else undefined.
 */
function getGuildMemberEdge(graph: WorldGraph, actorId: string) {
  const memberEdges = graph.getOutgoingEdges(actorId, 'member_of');
  for (const edge of memberEdges) {
    const factionNode = graph.getNode(edge.target);
    if (factionNode && typeof factionNode.properties.guildType === 'string') {
      return edge;
    }
  }
  return undefined;
}

/**
 * Check if this actor controls a monopoly at any location.
 */
function hasMonopoly(graph: WorldGraph, actorId: string): boolean {
  for (const loc of graph.getNodesByType('location')) {
    if (loc.properties.monopolyControlledBy === actorId) {
      return true;
    }
  }
  return false;
}

/**
 * Count active debt agreements on an actor.
 * Debts are relates_to edges with agreement.type === 'debt'.
 */
function countDebts(graph: WorldGraph, actorId: string): number {
  let count = 0;
  // Check both outgoing and incoming relates_to — debts can be in either direction
  const outgoing = graph.getOutgoingEdges(actorId, 'relates_to');
  for (const edge of outgoing) {
    const agreement = edge.properties.agreement as Record<string, unknown> | undefined;
    if (agreement && agreement.type === 'debt') count++;
  }
  const incoming = graph.getIncomingEdges(actorId, 'relates_to');
  for (const edge of incoming) {
    const agreement = edge.properties.agreement as Record<string, unknown> | undefined;
    if (agreement && agreement.type === 'debt') count++;
  }
  return count;
}

/**
 * Count completed smuggler den encounters for an actor.
 */
function countSmugglerEncounters(state: GameState, actorId: string): number {
  // Check legacy encounterProgress
  let count = state.encounterProgress.filter(
    ep => ep.actorId === actorId && ep.status === 'completed' && SMUGGLER_ENCOUNTER_IDS.has(ep.encounterId),
  ).length;

  // Also check unified actions that match smuggler encounter template IDs
  count += state.unifiedActions.filter(
    a => a.actorId === actorId && a.resolved && a.templateId != null
      && SMUGGLER_ENCOUNTER_IDS.has(a.templateId)
      && (a.outcome === 'success' || a.outcome === 'critical_success'),
  ).length;

  return count;
}

/**
 * Count successful fund-construction actions for an actor.
 */
function countFundConstructions(state: GameState, actorId: string): number {
  return state.unifiedActions.filter(
    a => a.actorId === actorId
      && a.resolved
      && a.templateId === FUND_CONSTRUCTION_TEMPLATE
      && (a.outcome === 'success' || a.outcome === 'critical_success'),
  ).length;
}

function emitTraitTrace(tick: number, actorId: string, traitId: string, reason: string): void {
  emitTrace({
    tick,
    category: 'economic_trait_acquired',
    summary: `${actorId} acquired economic trait ${traitId}: ${reason}`,
    actorId,
    traitId,
    reason,
  });
}

function emitTraitLostTrace(tick: number, actorId: string, traitId: string, reason: string): void {
  emitTrace({
    tick,
    category: 'economic_trait_lost',
    summary: `${actorId} lost economic trait ${traitId}: ${reason}`,
    actorId,
    traitId,
    reason,
  });
}

// ─── Phase ──────────────────────────────────────────────────────────────────

/**
 * Ensure all economic trait definition nodes exist in the graph.
 * Idempotent — skips nodes that already exist.
 */
function ensureTraitNodes(graph: WorldGraph): void {
  for (const node of ECONOMIC_TRAIT_DEFINITIONS) {
    if (!graph.getNode(node.id)) {
      graph.addNode(node);
    }
  }
}

export function phaseEconomicTraits(state: GameState): Partial<GameState> {
  const { graph, tick } = state;

  // Ensure trait definition nodes are registered
  ensureTraitNodes(graph);

  // Collect all individual actors
  const actors = graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual',
  );

  for (const actor of actors) {
    const wealth = readWealth(actor.properties);
    const actorId = actor.id;

    // ─── Track peak wealth (for bankrupt detection) ─────────────────
    const peakWealth = typeof actor.properties.economicPeakWealth === 'number'
      ? actor.properties.economicPeakWealth
      : wealth;
    if (wealth > peakWealth || (peakWealth === 0 && wealth > 0)) {
      graph.updateNode(actorId, { properties: { economicPeakWealth: wealth } });
    }
    const effectivePeak = Math.max(peakWealth, wealth);

    // ─── Track guild membership start tick ───────────────────────────
    const guildEdge = getGuildMemberEdge(graph, actorId);
    if (guildEdge && typeof actor.properties.guildJoinedTick !== 'number') {
      graph.updateNode(actorId, { properties: { guildJoinedTick: tick } });
    }
    const guildJoinedTick = typeof actor.properties.guildJoinedTick === 'number'
      ? actor.properties.guildJoinedTick
      : tick;

    // ─── 1. Trade Baron ─────────────────────────────────────────────
    if (!hasTrait(graph, actorId, TRAIT_TRADE_BARON)) {
      const controlledRoutes = countControlledRoutes(graph, actorId);
      if (controlledRoutes >= ECON_TRAIT_TRADE_BARON_MIN_ROUTES && wealth >= WEALTH_TIER_WEALTHY) {
        assignTrait(graph, actorId, TRAIT_TRADE_BARON, {
          tick,
          source: `Controlled ${controlledRoutes} trade routes with wealth ${wealth}`,
        });
        emitTraitTrace(tick, actorId, TRAIT_TRADE_BARON, `${controlledRoutes} controlled routes, wealth ${wealth}`);
      }
    }

    // ─── 2. Guild-Sworn ─────────────────────────────────────────────
    if (!hasTrait(graph, actorId, TRAIT_GUILD_SWORN) && guildEdge) {
      const membershipDuration = tick - guildJoinedTick;
      if (membershipDuration >= ECON_TRAIT_GUILD_SWORN_MIN_TICKS) {
        assignTrait(graph, actorId, TRAIT_GUILD_SWORN, {
          tick,
          source: `Guild member for ${membershipDuration} ticks`,
        });
        emitTraitTrace(tick, actorId, TRAIT_GUILD_SWORN, `member for ${membershipDuration} ticks`);
      }
    }

    // ─── 3. Bankrupt ────────────────────────────────────────────────
    if (wealth < ECON_TRAIT_BANKRUPT_WEALTH_FLOOR && effectivePeak >= WEALTH_TIER_COMFORTABLE) {
      if (!hasTrait(graph, actorId, TRAIT_BANKRUPT)) {
        assignTrait(graph, actorId, TRAIT_BANKRUPT, {
          tick,
          source: `Wealth fell to ${wealth} from peak ${effectivePeak}`,
        });
        emitTraitTrace(tick, actorId, TRAIT_BANKRUPT, `wealth ${wealth}, peak was ${effectivePeak}`);
      }
    }
    // Bankrupt clears when wealth rises above GETTING_BY
    if (hasTrait(graph, actorId, TRAIT_BANKRUPT) && wealth >= WEALTH_TIER_GETTING_BY) {
      removeTrait(graph, actorId, TRAIT_BANKRUPT);
      emitTraitLostTrace(tick, actorId, TRAIT_BANKRUPT, `wealth recovered to ${wealth}`);
    }

    // ─── 4. Monopolist ──────────────────────────────────────────────
    if (!hasTrait(graph, actorId, TRAIT_MONOPOLIST)) {
      if (hasMonopoly(graph, actorId)) {
        assignTrait(graph, actorId, TRAIT_MONOPOLIST, {
          tick,
          source: 'Established a monopoly',
        });
        emitTraitTrace(tick, actorId, TRAIT_MONOPOLIST, 'monopoly established');
      }
    }

    // ─── 5. Smuggler ────────────────────────────────────────────────
    if (!hasTrait(graph, actorId, TRAIT_SMUGGLER)) {
      const smugglerCount = countSmugglerEncounters(state, actorId);
      if (smugglerCount >= ECON_TRAIT_SMUGGLER_MIN_ENCOUNTERS) {
        assignTrait(graph, actorId, TRAIT_SMUGGLER, {
          tick,
          source: `${smugglerCount} successful smuggler den encounters`,
        });
        emitTraitTrace(tick, actorId, TRAIT_SMUGGLER, `${smugglerCount} smuggler encounters`);
      }
    }

    // ─── 6. Debt-Laden ──────────────────────────────────────────────
    const debtCount = countDebts(graph, actorId);
    if (debtCount >= ECON_TRAIT_DEBT_LADEN_MIN_DEBTS) {
      if (!hasTrait(graph, actorId, TRAIT_DEBT_LADEN)) {
        assignTrait(graph, actorId, TRAIT_DEBT_LADEN, {
          tick,
          source: `${debtCount} active debt agreements`,
        });
        emitTraitTrace(tick, actorId, TRAIT_DEBT_LADEN, `${debtCount} debts`);
      }
    }
    // Debt-laden clears when debt count drops to 0
    if (hasTrait(graph, actorId, TRAIT_DEBT_LADEN) && debtCount === 0) {
      removeTrait(graph, actorId, TRAIT_DEBT_LADEN);
      emitTraitLostTrace(tick, actorId, TRAIT_DEBT_LADEN, 'all debts cleared');
    }

    // ─── 7. Patron ──────────────────────────────────────────────────
    if (!hasTrait(graph, actorId, TRAIT_PATRON)) {
      const constructions = countFundConstructions(state, actorId);
      if (constructions >= ECON_TRAIT_PATRON_MIN_CONSTRUCTIONS) {
        assignTrait(graph, actorId, TRAIT_PATRON, {
          tick,
          source: `${constructions} successful construction projects`,
        });
        emitTraitTrace(tick, actorId, TRAIT_PATRON, `${constructions} constructions funded`);
      }
    }

    // ─── 8. Coin-Cursed ─────────────────────────────────────────────
    // Track wealth loss events via a counter stored on the actor.
    // The counter is incremented when wealth decreased this tick (detected via previousTickWealth).
    const prevWealth = typeof actor.properties.previousTickWealth === 'number'
      ? actor.properties.previousTickWealth
      : wealth;
    const lossCount = typeof actor.properties.wealthLossCount === 'number'
      ? actor.properties.wealthLossCount
      : 0;

    let newLossCount = lossCount;
    if (wealth < prevWealth) {
      newLossCount = lossCount + 1;
    }

    // Update tracking properties (shallow-merged by updateNode)
    graph.updateNode(actorId, {
      properties: {
        previousTickWealth: wealth,
        wealthLossCount: newLossCount,
        economicPeakWealth: Math.max(effectivePeak, wealth),
      },
    });

    if (!hasTrait(graph, actorId, TRAIT_COIN_CURSED) && newLossCount >= ECON_TRAIT_COIN_CURSED_MIN_LOSSES) {
      assignTrait(graph, actorId, TRAIT_COIN_CURSED, {
        tick,
        source: `Lost wealth ${newLossCount} times`,
      });
      emitTraitTrace(tick, actorId, TRAIT_COIN_CURSED, `${newLossCount} wealth loss events`);
    }
  }

  // Graph is mutated in place; return empty partial (consistent with other phases)
  return {};
}
