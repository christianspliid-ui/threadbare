/**
 * Revelation Hook Functions — pure, idempotent writers to AgentKnowledge facets.
 *
 * All functions are idempotent: calling with the same arguments a second time
 * is a no-op that returns false. Returns true only when a new piece of
 * information is genuinely added.
 *
 * Used by encounter resolution, dilemma phases, colocation detection, and
 * divine action resolution to record what the player has learned about an agent.
 */

import type { AgentKnowledge, BondRevelationSource } from '../types/agentKnowledge';
import {
  createEmptyAgentKnowledge,
  CHRONICLE_MAX_ENTRIES,
} from '../types/agentKnowledge';

// ─── Knowledge Map Utilities ──────────────────────────────────────

/**
 * Get an existing AgentKnowledge entry, or create and insert a fresh empty one.
 * Lazy-initializes entries on first access so callers never need null checks.
 */
export function getOrCreateKnowledge(
  map: Map<string, AgentKnowledge>,
  agentId: string,
): AgentKnowledge {
  let k = map.get(agentId);
  if (!k) {
    k = createEmptyAgentKnowledge();
    map.set(agentId, k);
  }
  return k;
}

// ─── Facet Revelation Functions ───────────────────────────────────

/**
 * Reveal an axiological pair the agent holds (e.g., 'mercy_ruthlessness').
 * @returns true if newly added, false if already known
 */
export function revealValue(knowledge: AgentKnowledge, pairId: string): boolean {
  if (knowledge.revealedValues.has(pairId)) return false;
  knowledge.revealedValues.add(pairId);
  return true;
}

/**
 * Reveal a ReachDomain the agent has demonstrated capability in (e.g., 'iron').
 * @returns true if newly added, false if already known
 */
export function revealDomain(knowledge: AgentKnowledge, domain: string): boolean {
  if (knowledge.revealedDomains.has(domain)) return false;
  knowledge.revealedDomains.add(domain);
  return true;
}

/**
 * Reveal a bond between the observed agent and a target agent.
 * @returns true if newly added, false if already known
 */
export function revealBond(
  knowledge: AgentKnowledge,
  targetAgentId: string,
  source: BondRevelationSource,
): boolean {
  if (knowledge.revealedBonds.has(targetAgentId)) return false;
  knowledge.revealedBonds.set(targetAgentId, source);
  return true;
}

/**
 * Reveal an ambition the agent is pursuing.
 * @returns true if newly added, false if already known
 */
export function revealAmbition(knowledge: AgentKnowledge, ambitionId: string): boolean {
  if (knowledge.revealedAmbitions.has(ambitionId)) return false;
  knowledge.revealedAmbitions.add(ambitionId);
  return true;
}

/**
 * Reveal a possession the agent carries.
 * @returns true if newly added, false if already known
 */
export function revealPossession(knowledge: AgentKnowledge, possessionId: string): boolean {
  if (knowledge.revealedPossessions.has(possessionId)) return false;
  knowledge.revealedPossessions.add(possessionId);
  return true;
}

/**
 * Reveal a power trait the agent possesses (observed being used).
 * @returns true if newly added, false if already known
 */
export function revealPower(knowledge: AgentKnowledge, powerId: string): boolean {
  if (knowledge.revealedPowers.has(powerId)) return false;
  knowledge.revealedPowers.add(powerId);
  return true;
}

/**
 * Reveal a condition affecting the agent (wound, disease, blessing, curse).
 * @returns true if newly added, false if already known
 */
export function revealCondition(knowledge: AgentKnowledge, conditionId: string): boolean {
  if (knowledge.revealedConditions.has(conditionId)) return false;
  knowledge.revealedConditions.add(conditionId);
  return true;
}

/**
 * Reveal an agreement the agent has entered (oath, contract, faction pledge).
 * @returns true if newly added, false if already known
 */
export function revealAgreement(knowledge: AgentKnowledge, agreementId: string): boolean {
  if (knowledge.revealedAgreements.has(agreementId)) return false;
  knowledge.revealedAgreements.add(agreementId);
  return true;
}

/**
 * Reveal that the agent is a threat to the ascendant's goals.
 * @returns true if newly revealed, false if already known
 */
export function revealThreat(knowledge: AgentKnowledge): boolean {
  if (knowledge.threatRevealed) return false;
  knowledge.threatRevealed = true;
  return true;
}

/**
 * Reveal the agent's disposition toward the player (cooperative vs adversarial).
 * @returns true if newly revealed, false if already known
 */
export function revealDisposition(knowledge: AgentKnowledge): boolean {
  if (knowledge.dispositionRevealed) return false;
  knowledge.dispositionRevealed = true;
  return true;
}

/**
 * Add a chronicle event to the agent's known events set.
 * Caps at CHRONICLE_MAX_ENTRIES: if full, evicts the oldest entry before adding.
 * @returns true if newly added, false if already present
 */
export function addChronicleEvent(knowledge: AgentKnowledge, eventId: string): boolean {
  if (knowledge.knownEvents.has(eventId)) return false;

  if (knowledge.knownEvents.size >= CHRONICLE_MAX_ENTRIES) {
    // Evict the oldest (first) entry
    const entries = Array.from(knowledge.knownEvents);
    knowledge.knownEvents = new Set(entries.slice(1));
  }

  knowledge.knownEvents.add(eventId);
  return true;
}
