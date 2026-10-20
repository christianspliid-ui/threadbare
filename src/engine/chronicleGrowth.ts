/**
 * Chronicle growth — the player's line for a tier-up and the threaded-only gate
 * (THR-1986).
 *
 * The producer of a growth event declares `chronicleGate: 'threaded_only'` and
 * a `playerProse` line; the Chronicle intake (`phaseNarrative`) and the rarity
 * blocks' direct pushes ask `shouldSkipForChronicle` before writing an entry.
 * Pure apart from the trace; fail-soft (a missing actor reads as not threaded).
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { ReachDomain } from '../types/traits';
import type { WorldGraph } from './graph';
import type { ChronicleIntakeSkippedTrace } from '../types/trace';
import { getCapabilityWord, getDomainTierWordForm } from '../data/domain-words';
import { CHRONICLE_THREADED_GROWTH_ONLY, CHRONICLE_TIER_UP_LINE } from '../data/chronicle-growth-content';
import { computeCapability } from './domainCapability';
import { isThreadedByPlayer } from './notableAgendas';
import { emitTrace } from './traceBuffer';

/**
 * "Vara is now subtle in Shadow and is called Shadow Master." — read after the
 * growth landed, so the word is the one the mortal's card now prints. Returns
 * undefined when any part cannot be read, so the entry falls back to the
 * event's `message` and never shows a raw `{token}`.
 */
export function buildTierUpProse(
  graph: WorldGraph,
  actorId: string,
  name: string,
  domain: string,
  trait: string,
): string | undefined {
  try {
    if (!name || !domain || !trait) return undefined;
    const capability = computeCapability(graph, actorId, domain as ReachDomain);
    const word = getCapabilityWord(domain as ReachDomain, capability);
    if (!word) return undefined;
    const form = getDomainTierWordForm(word);
    const lower = word.toLowerCase();
    const articled = form === 'adjective' ? lower : `${form} ${lower}`;
    const reach = domain.charAt(0).toUpperCase() + domain.slice(1);
    return CHRONICLE_TIER_UP_LINE
      .replace('{name}', name)
      .replace('{word}', articled)
      .replace('{reach}', reach)
      .replace('{trait}', trait);
  } catch {
    return undefined;
  }
}

/**
 * True when the god follows this mortal: a thread from the god, or the god's own
 * avatar (linked by `avatar_of`, never by a thread — the same reason
 * `collectThreadedAgents` adds the avatar separately).
 */
export function isFollowedByGod(state: GameState, actorId: string): boolean {
  if (isThreadedByPlayer(state, actorId)) return true;
  const ascendantId = state.ascendantId;
  if (!ascendantId) return false;
  return state.graph.getOutgoingEdges(actorId, 'avatar_of').some((e) => e.target === ascendantId);
}

/**
 * True when the gate is on and the god does not follow `actorId` — the
 * entry stays out of the Chronicle, and a `chronicle.intake.skipped` trace says
 * so. A missing `actorId` reads as not threaded.
 */
export function shouldSkipForChronicle(
  state: GameState,
  actorId: string | undefined,
  eventId: string,
  eventType: ChronicleIntakeSkippedTrace['eventType'],
): boolean {
  if (!CHRONICLE_THREADED_GROWTH_ONLY) return false;
  let threaded = false;
  try {
    threaded = !!actorId && isFollowedByGod(state, actorId);
  } catch {
    threaded = false;
  }
  if (threaded) return false;
  emitTrace({
    category: 'chronicle.intake.skipped',
    tick: state.tick,
    eventId,
    eventType,
    actorId: actorId ?? '',
    reason: 'not_threaded',
    agentId: actorId,
    summary: `Chronicle left out ${eventType} ${eventId}: no thread to ${actorId ?? 'an unnamed actor'}`,
  } as ChronicleIntakeSkippedTrace);
  return true;
}

/** The gate for an event already on the tick: declared by its producer. */
export function eventSkipsChronicle(state: GameState, event: TickEvent): boolean {
  if (event.chronicleGate !== 'threaded_only') return false;
  const eventType: ChronicleIntakeSkippedTrace['eventType'] =
    event.type === 'agent_action_resolved' ? 'agent_action_resolved' : 'tier_promotion';
  return shouldSkipForChronicle(state, event.actorId, event.id, eventType);
}
