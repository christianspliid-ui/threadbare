/**
 * Secret Generation (THR-30)
 *
 * Generates a plausible secret type for an agent at discovery time by reading
 * their actual graph state. Secrets are grounded: an agent can only have a
 * `hidden_allegiance` secret if they actually have conflicting memberships.
 *
 * Called from encounter aftermath when a secret_discovery effect fires,
 * or from divine action handling (Plant Secret, Reveal Secret).
 *
 * ─── Determinism ──────────────────────────────────────────────────
 * All generation is deterministic via the provided rng (mulberry32 seed mix).
 * Same agent state + same seed → same output.
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * If no plausible secret type is found, falls back to 'hidden_weakness'
 * (always applicable — every agent has vulnerabilities).
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { SecretType, SecretSource, KnowsSecretOfEdgeProperties } from '../types/secretsFavors';
import { MAX_SECRETS_PER_AGENT, MAX_FAVORS_PER_AGENT } from '../types/secretsFavors';

// ─── Score thresholds ─────────────────────────────────────────────────────

/** High-ambition score cutoff for secret_ambition detection. */
const AMBITION_CONFLICT_THRESHOLD = 0.6;

/** Wealth score cutoff for financial_secret detection. */
const WEALTH_THRESHOLD = 0.5;

// ─── Types ────────────────────────────────────────────────────────────────

export interface GeneratedSecret {
  secretType: SecretType;
  /** 0.0–1.0 — scaled by source quality and roll */
  magnitude: number;
  /** Human-readable detail for UI display and prose enrichment */
  detail: string;
}

// ─── Source quality modifiers ─────────────────────────────────────────────

const SOURCE_QUALITY: Record<SecretSource, number> = {
  confession: 0.80,        // Volunteered — high magnitude potential
  observation: 0.50,       // Noticed — moderate magnitude potential
  spy_debrief: 0.65,       // Gathered intelligence — good but filtered
  tavern_gossip: 0.35,     // Heard secondhand — lower reliability → lower magnitude
  encounter_outcome: 0.55,
  divine_revelation: 0.70,
};

// ─── Main API ──────────────────────────────────────────────────────────────

/**
 * Generate a plausible secret for `targetAgent` based on their graph state.
 *
 * @param targetAgent  The agent the secret is about
 * @param graph        World graph (read-only for traversal)
 * @param source       How the secret was discovered (affects magnitude range)
 * @param rng          Seeded PRNG — call: mulberry32(seed ^ targetId.charCodeAt(0) * tick)
 * @param magnitudeBonus  Additional magnitude bonus (0.0–1.0, from effect spec)
 */
export function generateSecret(
  targetAgent: GraphNode,
  graph: WorldGraph,
  source: SecretSource,
  rng: () => number,
  magnitudeBonus = 0,
): GeneratedSecret {
  const candidates = buildCandidates(targetAgent, graph);

  const qualityMultiplier = SOURCE_QUALITY[source] ?? 0.5;

  if (candidates.length === 0) {
    // Fallback: always applicable
    const magnitude = clampMagnitude(rng() * qualityMultiplier * 0.6 + magnitudeBonus);
    return {
      secretType: 'hidden_weakness',
      magnitude,
      detail: `${targetAgent.name} has a private vulnerability that few know of.`,
    };
  }

  // Weight selection by plausibility score, pick via rng
  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let pick = rng() * totalWeight;
  let chosen = candidates[candidates.length - 1];
  for (const c of candidates) {
    pick -= c.weight;
    if (pick <= 0) { chosen = c; break; }
  }

  const baseMagnitude = chosen.baseMagnitude * qualityMultiplier;
  const jitter = (rng() - 0.5) * 0.15;
  const magnitude = clampMagnitude(baseMagnitude + jitter + magnitudeBonus);

  return { secretType: chosen.secretType, magnitude, detail: chosen.detail };
}

// ─── Candidate builder ────────────────────────────────────────────────────

interface Candidate {
  secretType: SecretType;
  baseMagnitude: number;
  weight: number;
  detail: string;
}

function buildCandidates(agent: GraphNode, graph: WorldGraph): Candidate[] {
  const candidates: Candidate[] = [];
  const agentId = agent.id;

  // ─── hidden_allegiance ──────────────────────────────────────────────────
  // Agent belongs to factions with conflicting interests (rival factions)
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  if (memberEdges.length >= 2) {
    // Two or more faction memberships — plausible hidden allegiance
    candidates.push({
      secretType: 'hidden_allegiance',
      baseMagnitude: 0.55,
      weight: 3,
      detail: `${agent.name}'s loyalty to one faction may conceal a private allegiance to another.`,
    });
  }

  // ─── betrayal_planned ───────────────────────────────────────────────────
  // Agent has a hostile relates_to edge to someone they publicly ally with
  const relatesEdges = graph.getOutgoingEdges(agentId, 'relates_to');
  for (const edge of relatesEdges) {
    const sentiment = (edge.properties.sentiment as number) ?? 0;
    const trust = (edge.properties.trust as number) ?? 0;
    if (sentiment < -0.3 && trust > 0.4) {
      // Secretly hostile toward someone they appear to trust
      candidates.push({
        secretType: 'betrayal_planned',
        baseMagnitude: 0.65,
        weight: 4,
        detail: `${agent.name} harbors resentment toward someone they outwardly support.`,
      });
      break;
    }
  }

  // ─── financial_secret ───────────────────────────────────────────────────
  // Agent has high wealth but limited visible income (no trades_with edges)
  const wealthScore = (agent.properties.goldCapability as number) ?? 0;
  const tradeEdges = graph.getOutgoingEdges(agentId, 'trades_with');
  if (wealthScore > WEALTH_THRESHOLD && tradeEdges.length === 0) {
    candidates.push({
      secretType: 'financial_secret',
      baseMagnitude: 0.45,
      weight: 2,
      detail: `${agent.name}'s resources exceed what their visible dealings would account for.`,
    });
  }

  // ─── secret_ambition ────────────────────────────────────────────────────
  // Agent has an ambition that conflicts with their faction's goals
  const ambitionEdges = graph.getOutgoingEdges(agentId, 'pursues');
  if (ambitionEdges.length > 0) {
    const topAmbition = ambitionEdges.reduce((best, e) => {
      const p = (e.properties.priority as number) ?? 0;
      return p > ((best.properties.priority as number) ?? 0) ? e : best;
    });
    const ambitionPriority = (topAmbition.properties.priority as number) ?? 0;
    if (ambitionPriority > AMBITION_CONFLICT_THRESHOLD && memberEdges.length > 0) {
      candidates.push({
        secretType: 'secret_ambition',
        baseMagnitude: 0.40,
        weight: 2,
        detail: `${agent.name} pursues a private goal that their allies know nothing of.`,
      });
    }
  }

  // ─── past_crime ─────────────────────────────────────────────────────────
  // Agent has a negative reputation with a neutral or allied faction
  const memberFactionIds = memberEdges.map(e => e.target);
  const reputationEdges = graph.getOutgoingEdges(agentId, 'relates_to');
  for (const edge of reputationEdges) {
    const rep = (edge.properties.reputation as number) ?? 0;
    if (rep < 0 && !memberFactionIds.includes(edge.target)) {
      candidates.push({
        secretType: 'past_crime',
        baseMagnitude: 0.50,
        weight: 2,
        detail: `${agent.name} has reason to keep certain past actions hidden.`,
      });
      break;
    }
  }

  // ─── hidden_weakness ────────────────────────────────────────────────────
  // Always a fallback candidate with low weight
  candidates.push({
    secretType: 'hidden_weakness',
    baseMagnitude: 0.30,
    weight: 1,
    detail: `${agent.name} has a private vulnerability that few know of.`,
  });

  return candidates;
}

function clampMagnitude(v: number): number {
  return Math.max(0.05, Math.min(1.0, v));
}

// ─── Graph Edge Creation ───────────────────────────────────────────────────

/**
 * Create a `knows_secret_of` edge from discoverer → subject.
 * Returns the edge properties on success, undefined if capped or duplicate.
 */
export function createSecretEdge(
  discovererId: string,
  subjectId: string,
  secret: GeneratedSecret,
  source: SecretSource,
  tick: number,
  graph: WorldGraph,
): KnowsSecretOfEdgeProperties | undefined {
  const existing = graph.getOutgoingEdges(discovererId, 'knows_secret_of')
    .filter(e => e.target === subjectId && !(e.properties.revealed as boolean));
  if (existing.length >= MAX_SECRETS_PER_AGENT) return undefined;

  const props: KnowsSecretOfEdgeProperties = {
    secretType: secret.secretType,
    magnitude: secret.magnitude,
    discoveredTick: tick,
    source,
    revealed: false,
    detail: secret.detail,
  };

  const edgeId = `secret_${discovererId}_${subjectId}_${tick}_${secret.secretType}`;
  try {
    graph.addEdge({
      id: edgeId,
      type: 'knows_secret_of',
      source: discovererId,
      target: subjectId,
      properties: props as unknown as Record<string, unknown>,
    });
  } catch {
    return undefined;
  }

  return props;
}

/**
 * Create an `owes_favor` edge from debtor → creditor.
 * Returns true on success, false if capped or invalid.
 */
export function createFavorEdge(
  debtorId: string,
  creditorId: string,
  magnitude: number,
  context: string,
  tick: number,
  graph: WorldGraph,
): boolean {
  const existing = graph.getOutgoingEdges(debtorId, 'owes_favor')
    .filter(e => !(e.properties.redeemed as boolean) && !(e.properties.broken as boolean));
  if (existing.length >= MAX_FAVORS_PER_AGENT) return false;

  const edgeId = `favor_${debtorId}_${creditorId}_${tick}`;
  try {
    graph.addEdge({
      id: edgeId,
      type: 'owes_favor',
      source: debtorId,
      target: creditorId,
      properties: {
        magnitude: clampMagnitude(magnitude),
        context,
        grantedTick: tick,
        redeemed: false,
        broken: false,
      },
    });
    return true;
  } catch {
    return false;
  }
}
