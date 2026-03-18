/**
 * Vignette Notification System — significance-gated notifications for encounters.
 *
 * Determines when the player sees agent encounters as interactive vignettes.
 * Three tiers: Tier 1 (prominent), Tier 2 (standard), Tier 3 (ambient/log-only).
 *
 * --- Constants ---
 * | Name                            | Default | Purpose                                   |
 * |---------------------------------|---------|-------------------------------------------|
 * | VIGNETTE_MAX_PER_TICK           | 3       | Max Tier 1 notifications per tick         |
 * | VIGNETTE_THREAT_THRESHOLD       | 'hard'  | Default min threat for Tier 1             |
 * | VIGNETTE_QUEST_PRIORITY_THRESHOLD | 2.0   | Min questPriority for Tier 1              |
 *
 * --- Fail-soft ---
 * | Failure                               | Fallback                          |
 * |----------------------------------------|-----------------------------------|
 * | Agent node missing                    | Tier 3                            |
 * | Bond check fails                     | Treat as non-bonded               |
 * | Divine attention data missing         | Treat as 'none'                   |
 * | More than MAX_PER_TICK Tier 1 events | Keep highest priority, demote rest |
 *
 * --- PRNG ---
 * None — classification is deterministic from graph state.
 */

import type { WorldGraph } from './graph';
import type { ThreatRating } from '../types/encounter';
import type { DivineAttention } from './divineAttention';
import { getDivineAttention } from './divineAttention';

// --- Constants ---

export const VIGNETTE_MAX_PER_TICK = 3;
export const VIGNETTE_THREAT_THRESHOLD: ThreatRating = 'hard';
export const VIGNETTE_QUEST_PRIORITY_THRESHOLD = 2.0;

/** Threat rating severity order for comparisons */
const THREAT_ORDER: Record<ThreatRating, number> = {
  trivial: 0,
  easy: 1,
  moderate: 2,
  hard: 3,
  deadly: 4,
};

// --- Types ---

export type VignetteTier = 1 | 2 | 3;

export interface VignetteNotification {
  tier: VignetteTier;
  agentId: string;
  encounterId: string;
  stepId: string;
  locationId: string;
  reason: string;
}

// --- Helpers ---

/**
 * Check if an agent is bonded (has a worships edge to any ascendant).
 * Fail-soft: returns false if agent not found or no edges.
 */
export function isAgentBonded(graph: WorldGraph, agentId: string): boolean {
  const worshipsEdges = graph.getOutgoingEdges(agentId, 'worships');
  return worshipsEdges.length > 0;
}

/**
 * Check if threat rating meets or exceeds the given threshold.
 */
function threatMeetsThreshold(rating: ThreatRating, threshold: ThreatRating): boolean {
  return THREAT_ORDER[rating] >= THREAT_ORDER[threshold];
}

// --- Core Functions ---

/**
 * Classify the vignette tier for an encounter event.
 *
 * Tier 1: threat >= hard AND bonded, OR has divine attention (attuned/focused), OR questPriority >= 2.0
 * Tier 2: threat >= moderate AND bonded, OR scried agent
 * Tier 3: everything else within awareness range
 */
export function classifyVignetteTier(
  graph: WorldGraph,
  agentId: string,
  encounterId: string,
  threatRating: ThreatRating,
  questPriority: number,
): VignetteTier {
  const bonded = isAgentBonded(graph, agentId);
  const attention = getDivineAttention(graph, agentId);

  // Tier 1 checks
  if (attention.level === 'focused') return 1;
  if (attention.level === 'attuned') return 1;
  if (questPriority >= VIGNETTE_QUEST_PRIORITY_THRESHOLD) return 1;
  if (threatMeetsThreshold(threatRating, VIGNETTE_THREAT_THRESHOLD) && bonded) return 1;

  // Tier 2 checks
  if (attention.level === 'scried') return 2;
  if (threatMeetsThreshold(threatRating, 'moderate') && bonded) return 2;

  // Everything else
  return 3;
}

/**
 * Gather and prioritize vignette notifications from a batch of encounter events.
 *
 * Classifies each event, enforces VIGNETTE_MAX_PER_TICK for Tier 1
 * (demoting excess to Tier 2 by threat/quest priority), returns all notifications.
 */
export function gatherVignetteNotifications(
  graph: WorldGraph,
  encounterEvents: Array<{
    agentId: string;
    encounterId: string;
    stepId: string;
    locationId: string;
    threatRating: ThreatRating;
    questPriority: number;
  }>,
): VignetteNotification[] {
  const notifications: VignetteNotification[] = [];

  for (const event of encounterEvents) {
    const tier = classifyVignetteTier(
      graph,
      event.agentId,
      event.encounterId,
      event.threatRating,
      event.questPriority,
    );

    const attention = getDivineAttention(graph, event.agentId);
    const bonded = isAgentBonded(graph, event.agentId);

    let reason: string;
    if (attention.level === 'focused') reason = 'focused';
    else if (attention.level === 'attuned') reason = 'attuned';
    else if (event.questPriority >= VIGNETTE_QUEST_PRIORITY_THRESHOLD) reason = 'quest_priority';
    else if (attention.level === 'scried') reason = 'scried';
    else if (bonded) reason = 'bonded';
    else reason = 'awareness_range';

    notifications.push({
      tier,
      agentId: event.agentId,
      encounterId: event.encounterId,
      stepId: event.stepId,
      locationId: event.locationId,
      reason,
    });
  }

  // Enforce VIGNETTE_MAX_PER_TICK for Tier 1
  const tier1 = notifications.filter(n => n.tier === 1);
  if (tier1.length > VIGNETTE_MAX_PER_TICK) {
    // Sort by priority: find matching events for threat/quest priority sorting
    const eventMap = new Map(encounterEvents.map(e => [`${e.agentId}:${e.encounterId}`, e]));
    tier1.sort((a, b) => {
      const ea = eventMap.get(`${a.agentId}:${a.encounterId}`);
      const eb = eventMap.get(`${b.agentId}:${b.encounterId}`);
      const pa = ea?.questPriority ?? 0;
      const pb = eb?.questPriority ?? 0;
      if (pb !== pa) return pb - pa;
      const ta = THREAT_ORDER[ea?.threatRating ?? 'trivial'];
      const tb = THREAT_ORDER[eb?.threatRating ?? 'trivial'];
      return tb - ta;
    });

    // Demote excess to Tier 2
    for (let i = VIGNETTE_MAX_PER_TICK; i < tier1.length; i++) {
      const demoted = notifications.find(
        n => n === tier1[i],
      );
      if (demoted) {
        demoted.tier = 2;
      }
    }
  }

  return notifications;
}
