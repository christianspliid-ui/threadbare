/**
 * Phase: Economic Chronicle
 *
 * Scans TickEvents from the current tick for economic triggers and generates
 * chronicle entries for significant economic state changes. Runs AFTER all
 * action resolution and economic phases have completed.
 *
 * This phase converts action-outcome TickEvents (agent_action_resolved) and
 * economic traces into persistent chronicle entries that the player can
 * review in the Great Chronicle.
 *
 * Supported triggers from action outcomes:
 * - Trade route established (action.gold.establish-trade)
 * - Guild founded (guild seeding at world gen, or future dynamic guilds)
 * - Monopoly established (action.gold.establish-monopoly)
 * - Mercenary hire (action.gold.hire-mercenaries)
 * - Assassination commissioned (action.gold.commission-assassination)
 * - Agreement broken (action.gold.break-agreement)
 * - Wealth tier changes (detected by comparing previous/current tier)
 *
 * NFP compliance:
 * - Tunability: significance values from economic-chronicle-content.ts
 * - Inspectability: economic_chronicle traces emitted per entry
 * - Determinism: PRNG for template variant selection
 * - Fail-soft: missing names → generic descriptors
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { ChronicleEntry } from '../types/narrative';
import { resolveEconomicChronicle, resolveNamesFromGraph } from './economicChronicle';
import { getAgentLocation, getAgentLocationId } from './graphQueries';
import type { EconomicChronicleContext } from './economicChronicle';
import type { EconomicChronicleTrigger } from '../data/economic-chronicle-content';
import { getWealthTier, type WealthTier } from './wealth';

// ─── Action template ID → chronicle trigger mapping ─────────────────────────

const ACTION_TRIGGER_MAP: Record<string, EconomicChronicleTrigger> = {
  'action.gold.establish-trade': 'trade_route_established',
  'action.gold.establish-monopoly': 'monopoly_established',
  'action.gold.hire-mercenaries': 'mercenary_hire',
  'action.gold.commission-assassination': 'assassination_commissioned',
  'action.gold.break-agreement': 'agreement_broken',
};

// ─── Wealth tier tracking ───────────────────────────────────────────────────

/** Map of actorId → previous wealth tier, persisted across ticks via node properties */
const WEALTH_TIER_PROPERTY = 'previousWealthTier';

// ─── Phase function ─────────────────────────────────────────────────────────

/**
 * Scan current tick events for economic triggers and generate chronicle entries.
 * Called once per tick AFTER all action resolution and economic phases.
 */
export function phaseEconomicChronicle(state: GameState): Partial<GameState> {
  const { graph, tick, seed } = state;
  const newEvents: TickEvent[] = [];
  const newChronicleEntries: ChronicleEntry[] = [];

  // ── 1. Scan action-outcome events for economic triggers ───────────────
  for (const event of state.tickEvents) {
    if (event.type !== 'agent_action_resolved') continue;

    // Extract action template ID from the event message or id
    // Action events use the pattern: evt_{actionTemplateId}_{tick}
    const actionId = extractActionTemplateId(event);
    if (!actionId) continue;

    const trigger = ACTION_TRIGGER_MAP[actionId];
    if (!trigger) continue;

    // Build context from graph state
    const context = buildContextFromEvent(event, graph, trigger);

    const result = resolveEconomicChronicle(trigger, context, tick, seed + event.id.charCodeAt(0));
    if (result) {
      newEvents.push(result.tickEvent);
      newChronicleEntries.push({
        id: result.chronicleChapter.id,
        tier: 'chronicle',
        title: result.chronicleChapter.title,
        prose: result.chronicleChapter.prose,
        promptContext: {
          actors: result.chronicleChapter.actorIds,
          location: '',
          sphere: result.chronicleChapter.spheres[0] ?? 'gold',
          mood: 'economic',
        },
        tick,
      });
    }
  }

  // ── 2. Check for wealth tier changes on all agents ────────────────────
  const agents = graph.getNodesByType('agent');
  for (const agent of agents) {
    const currentWealth = typeof agent.properties?.wealth === 'number'
      ? agent.properties.wealth : 0;
    const currentTier = getWealthTier(currentWealth);
    const previousTier = agent.properties?.[WEALTH_TIER_PROPERTY] as WealthTier | undefined;

    // Skip if no previous tier recorded (first tick) or no change
    if (!previousTier || previousTier === currentTier) {
      // Record current tier for next tick comparison
      agent.properties[WEALTH_TIER_PROPERTY] = currentTier;
      continue;
    }

    // Determine direction
    const tierOrder: WealthTier[] = ['Destitute', 'Getting by', 'Comfortable', 'Wealthy', 'Magnate'];
    const prevIndex = tierOrder.indexOf(previousTier);
    const currIndex = tierOrder.indexOf(currentTier);
    const trigger: EconomicChronicleTrigger = currIndex > prevIndex
      ? 'wealth_tier_up'
      : 'wealth_tier_down';

    // Resolve location name for context
    const locationNode = getAgentLocation(graph, agent.id);
    const locationId = locationNode?.id;

    const result = resolveEconomicChronicle(
      trigger,
      {
        actor: agent.name,
        actorId: agent.id,
        tierLabel: currentTier,
        settlement: locationNode?.name,
        locationId,
      },
      tick,
      seed + agent.id.charCodeAt(0) + 777,
    );

    if (result) {
      newEvents.push(result.tickEvent);
      newChronicleEntries.push({
        id: result.chronicleChapter.id,
        tier: 'chronicle',
        title: result.chronicleChapter.title,
        prose: result.chronicleChapter.prose,
        promptContext: {
          actors: result.chronicleChapter.actorIds,
          location: locationNode?.name ?? '',
          sphere: 'gold',
          mood: 'economic',
        },
        tick,
      });
    }

    // Update stored tier
    agent.properties[WEALTH_TIER_PROPERTY] = currentTier;
  }

  return {
    ...(newEvents.length > 0 ? { tickEvents: [...state.tickEvents, ...newEvents] } : {}),
    ...(newChronicleEntries.length > 0
      ? { chronicleEntries: [...state.chronicleEntries, ...newChronicleEntries] }
      : {}),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract the action template ID from a TickEvent.
 * Events from action resolution typically embed the template ID in their id or message.
 * Fail-soft: returns undefined if not extractable.
 */
function extractActionTemplateId(event: TickEvent): string | undefined {
  // Pattern: event.id often contains the action template ID
  // e.g. "evt_action.gold.establish-trade_42" or similar
  const match = event.id.match(/action\.[a-z]+\.[a-z-]+/);
  if (match) return match[0];

  // Fallback: check message for known action keywords
  const messagePatterns: [RegExp, string][] = [
    [/trade route.*between/i, 'action.gold.establish-trade'],
    [/monopoly|seizes? control/i, 'action.gold.establish-monopoly'],
    [/mercenari|sellsword|hired.*band/i, 'action.gold.hire-mercenaries'],
    [/assassinat|paid for blood/i, 'action.gold.commission-assassination'],
    [/breaks? .*pact|breaks? .*agreement|betrays/i, 'action.gold.break-agreement'],
  ];

  for (const [pattern, id] of messagePatterns) {
    if (pattern.test(event.message)) return id;
  }

  return undefined;
}

/**
 * Build an EconomicChronicleContext from a TickEvent and graph state.
 * Fail-soft: missing nodes → generic descriptors via undefined fields.
 */
function buildContextFromEvent(
  event: TickEvent,
  graph: import('./graph').WorldGraph,
  trigger: EconomicChronicleTrigger,
): EconomicChronicleContext {
  const context: EconomicChronicleContext = {
    hexCoords: event.hexCoords,
    sphere: event.sphere,
  };

  // Resolve actor from event
  if (event.actorId) {
    const actorResolved = resolveNamesFromGraph(graph, event.actorId);
    context.actor = actorResolved.name;
    context.actorId = event.actorId;
    if (actorResolved.hexCoords) context.hexCoords = actorResolved.hexCoords;

    // For location-based triggers, resolve the actor's location
    const locNode = getAgentLocation(graph, event.actorId);
    if (locNode) {
      context.settlement = locNode.name;
      context.locationId = locNode.id;
    }
  }

  // Trigger-specific context enrichment
  if (trigger === 'trade_route_established') {
    // Try to extract trade partner from the message
    const tradeEdges = event.actorId
      ? graph.getOutgoingEdges(event.actorId, 'trades_with')
      : [];
    if (tradeEdges.length > 0) {
      const latestEdge = tradeEdges[tradeEdges.length - 1];
      const targetNode = graph.getNode(latestEdge.target);
      if (targetNode) {
        context.target = targetNode.name;
        context.targetId = targetNode.id;
      }
      const goodsType = (latestEdge.properties as Record<string, unknown>)?.goodsType;
      if (typeof goodsType === 'string') {
        context.goodsType = goodsType;
      }
    }
  }

  if (trigger === 'monopoly_established') {
    // Try to extract resource from location's monopoly properties
    if (context.locationId) {
      const locNode = graph.getNode(context.locationId);
      const resource = locNode?.properties?.monopolyResource;
      if (typeof resource === 'string') {
        context.resource = resource;
      }
    }
  }

  return context;
}
