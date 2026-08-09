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
 *   - `global`   — world-scale news, or a beat with no threaded subject. Toasts as before.
 *   - `entity`   — a threaded entity's own beat. Diverted to that entity's row in the
 *                  Threads panel, alongside the encounter and tug badges. The routing
 *                  carries which row: a mortal's (THR-666) or a faction's (THR-667).
 *   - `suppress` — an unthreaded (or dormant-threaded) agent's beat. No player-facing
 *                  notification at all. The event still lands in the tick event log
 *                  and the chronicle, so nothing is lost — it just stops shouting.
 *
 * THR-667 added the faction anchor. THR-666 parked every faction type in
 * `ALWAYS_GLOBAL_EVENT_TYPES` with a note that anchoring was a follow-up; that
 * follow-up split them, keeping world-scale founding and collapse global while
 * routing beats inside a faction to the faction's own row.
 *
 * Pure and deterministic: same event + same threaded set in, same routing out.
 */

import type { TickEvent } from '../types/gameState';
import type { EntityNoticeAnchorKind } from '../types/notification';
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
  // Faction politics at world scale (THR-667). A faction appearing in the world
  // or collapsing out of it changes the map for everyone, so both stay loud even
  // when the player holds no thread to the faction. Beats *inside* a faction are
  // faction-scoped and anchor instead — see FACTION_ANCHORED_EVENT_TYPES.
  //
  // THR-862: `faction_founded` now means only what its name says. It used to carry
  // "an agent joined a faction" as well, which is faction-scoped and belonged on the
  // faction's row — but could not be routed there while it shared a type with genuine
  // founding, because this gate keys on `event.type` alone. Joining is now
  // `faction_member_joined` and sits in the anchored set below.
  'faction_founded', 'faction_dissolved',
  // War (TB-073) — army and battle news is world-scale
  'army_mobilization', 'army_disbanded', 'battle_started', 'battle_resolved',
  'siege_established', 'army_attrition',
  // Divine feedback and world scaffolding
  'intervention_effect', 'control_effect_established', 'control_effect_lapsed',
  'mandate_progress', 'essence_gain', 'divine_premonition', 'phase_change',
]);

/**
 * Event types that anchor to a *faction's* row rather than a mortal's (THR-667).
 *
 * A promotion, a demotion, someone joining, a shift in standing inside a faction —
 * the faction is the durable subject, so the news waits on the faction's card in the
 * Threads panel. The mortal named in the event is incidental to the beat: the
 * player following the Iron Guard wants its ranks in one place, not scattered
 * across whichever members happen to be threaded.
 *
 * A type listed here still falls back to the mortal path when the faction is not
 * threaded (see `resolveEventRouting`), so nothing is lost when the player holds
 * the member's thread but not the faction's.
 *
 * NFP #1: moving a type between this set and `ALWAYS_GLOBAL_EVENT_TYPES` retunes
 * where faction news lands without touching any routing logic.
 */
export const FACTION_ANCHORED_EVENT_TYPES: ReadonlySet<TickEvent['type']> = new Set([
  'faction_rank_changed',
  'faction_member_joined',
]);

/**
 * Channels the gate diverts to an entity row.
 *
 * Only toasts move to the row. An alert is an escalation the player is meant to
 * be interrupted by — the death of a threaded agent, for instance — and a popup
 * is a modal decision. Neither belongs on a badge, so both pass through.
 */
export const ENTITY_DIVERTED_CHANNELS: ReadonlySet<string> = new Set(['toast']);

// ─── Model ─────────────────────────────────────────────────────────

/**
 * Where one event's notification should go.
 *
 * The `entity` case carries its own anchor (THR-667). Before factions joined,
 * the router re-derived the row from `event.actorId`, which only worked while
 * "diverted" implied "about a mortal"; a faction beat carries both an `actorId`
 * and a `factionId`, so the decision and the anchor have to travel together.
 */
export type NotificationRouting =
  | { readonly kind: 'global' }
  | { readonly kind: 'suppress' }
  | { readonly kind: 'entity'; readonly anchorId: string; readonly anchorKind: EntityNoticeAnchorKind };

/** Shared immutable singletons — the anchorless cases carry no per-event data. */
export const ROUTE_GLOBAL: NotificationRouting = { kind: 'global' };
export const ROUTE_SUPPRESS: NotificationRouting = { kind: 'suppress' };

export interface ThreadingGate {
  /** Routing decision for one event. */
  resolveEventRouting(event: TickEvent): NotificationRouting;
}

// ─── Gate ──────────────────────────────────────────────────────────

/**
 * Routing decision for one event against a known threaded set.
 *
 * Exported separately from `buildThreadingGate` so tests can drive it with a
 * plain `Set` and no graph.
 *
 * Order matters: world-scale types win outright, then the faction anchor, then
 * the mortal path. A faction-scoped beat whose faction is unthreaded deliberately
 * falls through to the mortal branch rather than suppressing — the player may
 * hold the member's thread without holding the faction's, and that news is still
 * theirs.
 *
 * @param threadedIds Every node the ascendant holds a live thread to — mortals
 *   and factions alike. Dormant threads are already excluded upstream.
 * @param isMortalAgent Does this id belong to a mortal agent node? Ids that are
 *   not mortal agents (factions, locations, the ascendant) route global on the
 *   mortal path — that branch is about mortals only.
 * @param isFaction Does this id belong to a faction actor node? Guards the
 *   faction anchor against an event carrying a `factionId` that no longer
 *   resolves to a faction (fail-soft: falls through to the mortal path).
 */
export function resolveEventRouting(
  event: TickEvent,
  threadedIds: ReadonlySet<string>,
  isMortalAgent: (id: string) => boolean,
  isFaction: (id: string) => boolean = () => false,
): NotificationRouting {
  if (ALWAYS_GLOBAL_EVENT_TYPES.has(event.type)) return ROUTE_GLOBAL;

  // THR-667 — faction anchor, tried ahead of the mortal path.
  const factionId = event.factionId;
  if (
    factionId
    && FACTION_ANCHORED_EVENT_TYPES.has(event.type)
    && isFaction(factionId)
    && threadedIds.has(factionId)
  ) {
    return { kind: 'entity', anchorId: factionId, anchorKind: 'faction' };
  }

  if (!event.actorId) return ROUTE_GLOBAL;
  if (!isMortalAgent(event.actorId)) return ROUTE_GLOBAL;
  return threadedIds.has(event.actorId)
    ? { kind: 'entity', anchorId: event.actorId, anchorKind: 'agent' }
    : ROUTE_SUPPRESS;
}

/**
 * Build a gate bound to the current world.
 *
 * Reads the same threaded map the encounter-visibility phase uses, so the two
 * surfaces can never disagree about who the player is watching. That map is
 * keyed by thread *target*, which already includes factions — the gate simply
 * had no faction branch to spend them on until THR-667.
 */
export function buildThreadingGate(graph: WorldGraph, ascendantId: string): ThreadingGate {
  const threadedIds = new Set(collectThreadedAgents(graph, ascendantId).keys());

  return {
    resolveEventRouting: (event) => resolveEventRouting(
      event,
      threadedIds,
      (id) => isMortalAgentNode(graph, id),
      (id) => isFactionNode(graph, id),
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

/**
 * Is this id a faction? (THR-667)
 *
 * Factions are actor nodes carrying `actorType: 'faction'` — the same predicate
 * `getThreadedNodes` uses to bucket a thread into the panel's Factions section,
 * so a faction that can hold a notice is exactly a faction that has a row to
 * hold it on. Deliberately mirrors `isMortalAgentNode` rather than reading a
 * `category` field, which `GraphNode` does not have.
 */
export function isFactionNode(graph: WorldGraph, id: string): boolean {
  const node = graph.getNode(id);
  return node?.type === 'actor' && node.properties.actorType === 'faction';
}
