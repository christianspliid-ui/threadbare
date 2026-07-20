/**
 * Notification threading gate — THR-666.
 *
 * The player's attention is spent on threads. An agent the ascendant has no live
 * thread to is not the player's business, and a beat about that agent has no
 * business interrupting them: before this gate, any producer that attached
 * `notification: { channel: 'toast' }` to a per-agent event toasted globally, so
 * strangers announced their personality changes and their misfortunes to a god
 * who had never met them.
 *
 * Three outcomes per event:
 *
 *   - `global`   — world-scale news, or a beat with no mortal actor. Toasts as before.
 *   - `entity`   — a threaded agent's own beat. Diverted to that agent's row in the
 *                  Threads panel, alongside the encounter and tug badges.
 *   - `suppress` — an unthreaded (or dormant-threaded) agent's beat. No player-facing
 *                  notification at all. The event still lands in the tick event log
 *                  and the chronicle, so nothing is lost — it just stops shouting.
 *
 * Pure and deterministic: same event + same threaded set in, same routing out.
 */

import type { TickEvent } from '../types/gameState';
import type { WorldGraph } from './graph';
import { collectThreadedAgents } from './encounterVisibility';

// ─── Constants ─────────────────────────────────────────────────────

/**
 * Event types that stay global no matter whose name is on them.
 *
 * These are world-scale: the doom clock, omens over the whole map, settlement and
 * economic drift, discoveries that change the map, faction politics, and army
 * movements. Several carry an incidental `actorId` (the agent who happened to
 * trigger them), and gating on that actor would silently bury news the player
 * needs. Faction anchoring is a separate follow-up; until then factions stay loud.
 *
 * NFP #1: adding or removing a type here retunes what interrupts the player
 * without touching any routing logic.
 */
export const ALWAYS_GLOBAL_EVENT_TYPES: ReadonlySet<TickEvent['type']> = new Set([
  // Doom and world pressure
  'doom_escalation', 'dissolution_event', 'rival_action',
  // Omens (THR-19)
  'omen_started', 'omen_expired', 'omen_beat', 'omen_forced_shift',
  // Settlement / economy drift
  'settlement_tier_change', 'economic_chronicle',
  // Discovery — changes the map, not one agent's day
  'hidden_site_discovered', 'elder_site_discovered', 'anomaly_discovered',
  'survey_completed', 'domain_revealed',
  // Faction politics (faction anchoring is a follow-up ticket)
  'faction_founded', 'faction_dissolved', 'faction_rank_changed',
  // War (TB-073) — army and battle news is world-scale
  'army_mobilization', 'army_disbanded', 'battle_started', 'battle_resolved',
  'siege_established', 'army_attrition',
  // Divine feedback and world scaffolding
  'intervention_effect', 'control_effect_established', 'control_effect_lapsed',
  'mandate_progress', 'essence_gain', 'divine_premonition', 'phase_change',
]);

/**
 * Channels the gate diverts for a threaded agent.
 *
 * Only toasts move to the row. An alert is an escalation the player is meant to
 * be interrupted by — the death of a threaded agent, for instance — and a popup
 * is a modal decision. Neither belongs on a badge, so both pass through.
 */
export const ENTITY_DIVERTED_CHANNELS: ReadonlySet<string> = new Set(['toast']);

// ─── Model ─────────────────────────────────────────────────────────

/** Where a per-agent notification should go. */
export type ActorRouting = 'global' | 'entity' | 'suppress';

export interface ThreadingGate {
  /** Routing decision for one event. */
  resolveEventRouting(event: TickEvent): ActorRouting;
}

// ─── Gate ──────────────────────────────────────────────────────────

/**
 * Routing decision for one event against a known threaded set.
 *
 * Exported separately from `buildThreadingGate` so tests can drive it with a
 * plain `Set` and no graph.
 *
 * @param isMortalAgent Does this id belong to a mortal agent node? Ids that are
 *   not mortal agents (factions, locations, the ascendant) route global — the
 *   gate is about mortals only.
 */
export function resolveEventRouting(
  event: TickEvent,
  threadedAgentIds: ReadonlySet<string>,
  isMortalAgent: (id: string) => boolean,
): ActorRouting {
  if (!event.actorId) return 'global';
  if (ALWAYS_GLOBAL_EVENT_TYPES.has(event.type)) return 'global';
  if (!isMortalAgent(event.actorId)) return 'global';
  return threadedAgentIds.has(event.actorId) ? 'entity' : 'suppress';
}

/**
 * Build a gate bound to the current world.
 *
 * Reads the same threaded-agent map the encounter-visibility phase uses, so the
 * two surfaces can never disagree about who the player is watching.
 */
export function buildThreadingGate(graph: WorldGraph, ascendantId: string): ThreadingGate {
  const threadedAgentIds = new Set(collectThreadedAgents(graph, ascendantId).keys());

  return {
    resolveEventRouting: (event) => resolveEventRouting(
      event,
      threadedAgentIds,
      (id) => isMortalAgentNode(graph, id),
    ),
  };
}

/**
 * Is this id a mortal agent?
 *
 * Mortals are actor nodes carrying `actorType: 'individual'` — the same
 * predicate the lifecycle, ambition and expression phases use. Gods, ascendants,
 * factions, cultures and groups are all actor nodes too, and all of them route
 * globally: the gate is about people the player might hold a thread to.
 */
export function isMortalAgentNode(graph: WorldGraph, id: string): boolean {
  const node = graph.getNode(id);
  return node?.type === 'actor' && node.properties.actorType === 'individual';
}
