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
import { getReputationWith, REPUTATION_WITH_DEFAULT } from './reputation';
import { emitTrace } from './traceBuffer';

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
  // Agent stands poorly with a party that is not one of their own factions.
  //
  // THR-1211 item 1: this branch could never fire. It read
  // `relates_to.properties.reputation`, and nothing writes that property — the
  // `relates_to` edge carries `sentiment`, `strength`, `basis`, and `trust`
  // (`RelatesToEdgeProperties`, and the `EDGE_SCHEMA` description says the same).
  // So `rep` was always `?? 0`, `0 < 0` is false, and no agent has ever been dealt a
  // `past_crime` secret since the read was written. Verified on the assignment side,
  // not the read side, per the standing trap.
  //
  // Pointed at `getReputationWith`, which is what the branch was reaching for: the one
  // social score between two parties (THR-1206). It returns the neutral default when
  // nothing covers the pair, so an agent with no standing anywhere still does not
  // qualify — the branch stays selective rather than becoming always-true.
  const memberFactionIds = memberEdges.map(e => e.target);
  const relationEdges = graph.getOutgoingEdges(agentId, 'relates_to');
  for (const edge of relationEdges) {
    if (memberFactionIds.includes(edge.target)) continue;
    const standing = getReputationWith(graph, agentId, edge.target);
    if (standing.score < REPUTATION_WITH_DEFAULT) {
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

// ─── Subject selection (THR-724) ───────────────────────────────────────────

/**
 * Pick the agent a secret is *about* when the encounter did not name one.
 *
 * Most live encounters target a location, not an agent (`targetId` resolves to a
 * location node), so a `secretDiscovery` template that required an explicit agent
 * target could never fire in an ordinary run — that was break 1 of THR-724. Social
 * play is still where secrets come from: an agent listening for rumors in a town
 * learns something about *someone who is there*.
 *
 * Co-location is read off the shared `located_at` target, so this works at every
 * tier of the three-tier position model (hex / location / sublocation) without
 * resolving upward — two agents on the same sublocation are co-located, two on the
 * same hex but different locations are not.
 *
 * @returns the subject's node id, or undefined when the discoverer stands alone
 */
export function pickSecretSubject(
  discovererId: string,
  graph: WorldGraph,
  rng: () => number,
): string | undefined {
  const placement = graph.getOutgoingEdges(discovererId, 'located_at')[0];
  if (!placement) return undefined;

  const candidates = graph.getIncomingEdges(placement.target, 'located_at')
    .map(e => e.source)
    .filter(id => id !== discovererId)
    .filter(id => graph.getNode(id)?.type === 'actor');

  if (candidates.length === 0) return undefined;
  return candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))];
}

// ─── Graph Edge Creation ───────────────────────────────────────────────────

/**
 * Create a `knows_secret_of` edge from discoverer → subject.
 * Returns the edge properties on success, undefined if capped or duplicate.
 */
// ─── Endpoint enforcement (THR-1175) ──────────────────────────────────────

/**
 * The two social-leverage edge families are declared `actor → actor` in
 * `edgeSchema.ts`, and until THR-1175 that declaration was **advisory**: the
 * schema layer only warns in dev mode, so `createFavorEdge` and
 * `createSecretEdge` would edge from any node id handed to them. The measured
 * consequence (director probe, 2026-08-18) was Sacred Grove — a *location* —
 * becoming the debtor of a social favour in The Grateful Kin, because
 * `favor_creation` passes `action.targetId` through unchecked and that
 * encounter targets a place.
 *
 * A location debtor is not merely off-schema, it is **uncollectable by
 * construction**. Every consumer of `owes_favor` is person-shaped: social
 * leverage reads favours only when the creditor targets the debtor in a deep
 * social scene, tension drift moves sentiment on the debtor's `relates_to`
 * edge, and call-in/break fire from person-to-person interactions. A place
 * participates in none of them, so the only code that will ever touch such an
 * edge is the expiry sweep that silently deletes it ~80 ticks later. The write
 * is real, well-formed, anchored — and inert. That is the class this check
 * exists to refuse: not a malformed edge, a **consumerless** one.
 *
 * Debtors are held to `individual` specifically, not merely `actor`. The
 * consumers above are individual-shaped; a faction, culture or god owing a
 * social favour has no reader today, so allowing it would mint the same inert
 * edge one node type over. Widening that is a design extension with its own
 * consumers, not a default.
 *
 * Fail-soft, never throws (NFP #4) — a refusal returns the caller's
 * "didn't happen" value and emits one loud trace, so the tick loop is
 * unaffected and the refusal is inspectable (NFP #2) instead of silent.
 */

/** Actor subtypes that may sit on either end of a social-leverage edge. */
const SOCIAL_EDGE_ENDPOINT_NODE_TYPE = 'actor';

/** Actor subtype that may *owe* — the one shape every favour consumer reads. */
const FAVOR_DEBTOR_ACTOR_TYPE = 'individual';

type SocialEdgeRole = 'debtor' | 'creditor' | 'discoverer' | 'subject';

interface EndpointVerdict {
  readonly ok: boolean;
  /** Why it was refused — absent when `ok`. */
  readonly reason?: 'node_missing' | 'not_an_actor' | 'not_an_individual';
  /** What the node actually was, for the trace. */
  readonly foundNodeType?: string;
  readonly foundActorType?: string;
}

/**
 * Check one endpoint of a social-leverage edge.
 *
 * `requireIndividual` is the debtor-side rule; creditors, discoverers and
 * subjects need only be actors, because their consumers read them as parties
 * rather than as people with sentiment to move.
 */
function checkSocialEdgeEndpoint(
  nodeId: string,
  graph: WorldGraph,
  requireIndividual: boolean,
): EndpointVerdict {
  const node = graph.getNode(nodeId);
  if (!node) return { ok: false, reason: 'node_missing' };
  if (node.type !== SOCIAL_EDGE_ENDPOINT_NODE_TYPE) {
    return { ok: false, reason: 'not_an_actor', foundNodeType: node.type };
  }
  const actorType = node.properties.actorType;
  // Refuse a *known-wrong* subtype, not an unknown one. Every real producer sets
  // `actorType` — `ActorNodeProperties` requires it — so a faction, culture, god
  // or ascendant debtor is caught here by what it says it is. An actor node with
  // the field absent is malformed data rather than the wrong kind of thing, and
  // refusing it would have this guard invent a defect it was not written to find:
  // the first casualty was a `secretsFavors` fixture that builds `properties: {}`
  // and is testing something else entirely. Node type is the unambiguous half and
  // is checked strictly above; a location can never reach this line.
  if (requireIndividual && typeof actorType === 'string' && actorType !== FAVOR_DEBTOR_ACTOR_TYPE) {
    return {
      ok: false,
      reason: 'not_an_individual',
      foundNodeType: node.type,
      foundActorType: actorType,
    };
  }
  return { ok: true };
}

/**
 * Refuse-and-trace for a bad endpoint. Returns `true` when the edge may
 * proceed, `false` when it was refused (and a trace has been emitted).
 */
function socialEdgeEndpointsPermit(
  edgeType: 'owes_favor' | 'knows_secret_of',
  endpoints: readonly { id: string; role: SocialEdgeRole; requireIndividual: boolean }[],
  tick: number,
  graph: WorldGraph,
): boolean {
  for (const endpoint of endpoints) {
    const verdict = checkSocialEdgeEndpoint(endpoint.id, graph, endpoint.requireIndividual);
    if (verdict.ok) continue;
    emitTrace({
      tick,
      category: edgeType === 'owes_favor' ? 'favor_created' : 'secret_discovered',
      agentId: endpoint.id,
      success: false,
      failReason: `endpoint_refused_${verdict.reason}`,
      edgeType,
      refusedRole: endpoint.role,
      refusedNodeId: endpoint.id,
      foundNodeType: verdict.foundNodeType,
      foundActorType: verdict.foundActorType,
      summary:
        `${edgeType} refused: ${endpoint.role} ${endpoint.id} is `
        + `${verdict.reason === 'node_missing'
          ? 'not in the graph'
          : `a ${verdict.foundNodeType}${verdict.foundActorType ? `/${verdict.foundActorType}` : ''}`}`
        + `, and ${edgeType} consumers only read `
        + `${endpoint.requireIndividual ? 'individual actors' : 'actors'}.`,
    });
    return false;
  }
  return true;
}

export function createSecretEdge(
  discovererId: string,
  subjectId: string,
  secret: GeneratedSecret,
  source: SecretSource,
  tick: number,
  graph: WorldGraph,
): KnowsSecretOfEdgeProperties | undefined {
  // THR-1175 — the schema declares `knows_secret_of` actor→actor and only warned.
  // The THR-1176 audit measured one shipped `individual→faction` secret already
  // partly inert against the leverage reader; this refuses the class at source.
  if (!socialEdgeEndpointsPermit('knows_secret_of', [
    { id: discovererId, role: 'discoverer', requireIndividual: false },
    { id: subjectId, role: 'subject', requireIndividual: false },
  ], tick, graph)) {
    return undefined;
  }

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
 * Returns true on success, false if capped, refused (THR-1175) or invalid.
 *
 * The debtor must be an **individual** actor — see the endpoint-enforcement
 * note above for why a place or a faction owing a favour is an edge no
 * consumer can ever collect.
 */
export function createFavorEdge(
  debtorId: string,
  creditorId: string,
  magnitude: number,
  context: string,
  tick: number,
  graph: WorldGraph,
): boolean {
  if (!socialEdgeEndpointsPermit('owes_favor', [
    { id: debtorId, role: 'debtor', requireIndividual: true },
    { id: creditorId, role: 'creditor', requireIndividual: false },
  ], tick, graph)) {
    return false;
  }

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
