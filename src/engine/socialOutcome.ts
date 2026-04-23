/**
 * Social Outcome Processing — handles post-encounter effects for social
 * (agent-to-agent) encounters: trust updates and agreement edge creation.
 *
 * Called from the orchestrator after a social encounter completes or fails.
 *
 * ─── Constants ────────────────────────────────────────────────
 * | Name                            | Default | Purpose                                    |
 * |---------------------------------|---------|--------------------------------------------|
 * | SOCIAL_COOPERATE_TRUST_BONUS    | 0.05    | Trust gain on cooperative completion       |
 * | SOCIAL_DESTRUCTIVE_TRUST_PENALTY| -0.10   | Trust loss on destructive completion       |
 * | AGREEMENT_DEFAULT_TICKS         | 30      | Default duration for agreement edges       |
 * | AGREEMENT_MIN_TRUST             | -0.5    | Floor trust for agreement creation         |
 *
 * ─── Tracing ─────────────────────────────────────────────────
 * Emits 'social_outcome' trace per social encounter completion.
 *
 * ─── Fail-soft ───────────────────────────────────────────────
 * | Failure case                     | Fallback                        |
 * |----------------------------------|---------------------------------|
 * | No targetAgentId on progress     | Return early (not a social enc) |
 * | Target agent node missing        | Skip agreement, apply trust only|
 * | relates_to edge already exists   | Update properties, don't dupe   |
 * | Unknown encounter template       | Skip agreement creation         |
 *
 * ─── PRNG ────────────────────────────────────────────────────
 * None — outcomes are deterministic from encounter result.
 */

import type { WorldGraph } from './graph';
import type { EncounterProgress } from '../types/encounter';
import { getAnyEncounterById } from '../data/encounter-content';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { CRUD_TO_ENCOUNTER_TYPE } from './encounterCache';
import { getTrust } from './trustMechanics';
import { emitTrace } from './traceBuffer';
import {
  SOCIAL_COOPERATE_TRUST_BONUS,
  SOCIAL_DESTRUCTIVE_TRUST_PENALTY,
  AGREEMENT_DEFAULT_TICKS,
  AGREEMENT_MIN_TRUST,
} from '../data/agent-behavior-constants';

// ─── Agreement Types ────────────────────────────────────────────

/** Types of agreements that can form between agents */
export type AgreementType = 'pact' | 'debt' | 'favour' | 'oath' | 'treaty' | 'bargain';

/** Maps social encounter template IDs to agreement types (only encounters that create agreements) */
const ENCOUNTER_AGREEMENT_MAP: Record<string, AgreementType> = {
  'social.forge_alliance': 'pact',
  'social.negotiate_deal': 'bargain',
  'social.establish_patronage': 'oath',
  'social.political_leverage': 'debt',
  'social.recruit_faction': 'oath',
  'social.found_group': 'pact',
};

/** Maps social encounter template IDs to fulfillment condition descriptions */
const ENCOUNTER_FULFILLMENT_MAP: Record<string, string> = {
  'social.forge_alliance': 'Maintain mutual aid and cooperation',
  'social.negotiate_deal': 'Exchange agreed goods or services',
  'social.establish_patronage': 'Provide ongoing support and loyalty',
  'social.political_leverage': 'Repay the debt of influence',
  'social.recruit_faction': 'Serve the faction with loyalty',
  'social.found_group': 'Uphold the founding charter',
};

/** Encounter types classified as cooperative (trust boost on completion) */
const COOPERATIVE_ENCOUNTER_TYPES = new Set(['assist', 'hire', 'trade', 'build', 'lead']);
/** Encounter types classified as destructive (trust penalty on completion) */
const DESTRUCTIVE_ENCOUNTER_TYPES = new Set(['steal', 'duel']);

// ─── Result Type ────────────────────────────────────────────────

export interface SocialOutcomeResult {
  /** Whether this was a social encounter at all */
  isSocial: boolean;
  /** Trust change applied (0 if not social or no change) */
  trustDelta: number;
  /** Agreement type created, if any */
  agreementType?: AgreementType;
  /** Edge ID of created/updated agreement */
  agreementEdgeId?: string;
}

// ─── Core Function ──────────────────────────────────────────────

/**
 * Process social outcome after an encounter completes or is abandoned.
 *
 * On success:
 * - Apply trust change (cooperative → bonus, destructive → penalty)
 * - Create agreement edge if this encounter type produces one
 *
 * On failure:
 * - Apply a smaller negative trust change (failed social attempts damage trust slightly)
 */
export function processSocialOutcome(
  graph: WorldGraph,
  progress: EncounterProgress,
  success: boolean,
  tick: number,
): SocialOutcomeResult {
  // Guard: not a social encounter if no targetAgentId
  if (!progress.targetAgentId) {
    return { isSocial: false, trustDelta: 0 };
  }

  const agentId = progress.actorId;
  const targetAgentId = progress.targetAgentId;

  // Guard: target agent must still exist
  if (!graph.getNode(targetAgentId)) {
    return { isSocial: true, trustDelta: 0 };
  }

  // Look up the encounter template — check UnifiedActionTemplate first (migrated social templates)
  const unifiedTemplate = getUnifiedTemplateById(progress.encounterId);
  const legacyTemplate = unifiedTemplate ? undefined : getAnyEncounterById(progress.encounterId);
  const encounterType = unifiedTemplate
    ? (CRUD_TO_ENCOUNTER_TYPE[unifiedTemplate.crudType] ?? undefined)
    : legacyTemplate?.encounterType;

  // Determine trust delta
  let trustDelta = 0;
  if (success) {
    if (encounterType && COOPERATIVE_ENCOUNTER_TYPES.has(encounterType)) {
      trustDelta = SOCIAL_COOPERATE_TRUST_BONUS;
    } else if (encounterType && DESTRUCTIVE_ENCOUNTER_TYPES.has(encounterType)) {
      trustDelta = SOCIAL_DESTRUCTIVE_TRUST_PENALTY;
    }
  } else {
    // Failed attempts cause a small trust loss
    trustDelta = SOCIAL_DESTRUCTIVE_TRUST_PENALTY * 0.3;
  }

  // Apply trust change on relates_to edge (create if needed)
  if (trustDelta !== 0) {
    applyOrCreateTrust(graph, agentId, targetAgentId, trustDelta);
  }

  // Create agreement edge on successful cooperative encounters
  let agreementType: AgreementType | undefined;
  let agreementEdgeId: string | undefined;

  if (success) {
    agreementType = ENCOUNTER_AGREEMENT_MAP[progress.encounterId];
    if (agreementType) {
      const currentTrust = getTrust(graph, agentId, targetAgentId);
      if (currentTrust >= AGREEMENT_MIN_TRUST) {
        agreementEdgeId = createOrUpdateAgreement(
          graph,
          agentId,
          targetAgentId,
          agreementType,
          progress.encounterId,
          tick,
        );
      }
    }
  }

  // Emit trace
  emitTrace({
    tick,
    category: 'social_outcome',
    agentId,
    targetAgentId,
    encounterId: progress.encounterId,
    success,
    trustDelta,
    agreementType,
    agreementEdgeId,
    summary: success
      ? `Social outcome: ${agentId} → ${targetAgentId} (${agreementType ?? 'trust only'}, trust Δ${trustDelta >= 0 ? '+' : ''}${trustDelta.toFixed(3)})`
      : `Social outcome failed: ${agentId} → ${targetAgentId} (trust Δ${trustDelta.toFixed(3)})`,
  });

  return {
    isSocial: true,
    trustDelta,
    agreementType,
    agreementEdgeId,
  };
}

// ─── Internal Helpers ───────────────────────────────────────────

/**
 * Apply trust delta on the relates_to edge between two agents.
 * Creates the edge if it doesn't exist.
 */
function applyOrCreateTrust(
  graph: WorldGraph,
  sourceId: string,
  targetId: string,
  delta: number,
): void {
  // Check if relates_to edge exists (either direction)
  const existingEdge = findRelatesTo(graph, sourceId, targetId);

  if (existingEdge) {
    const oldTrust = (existingEdge.properties.trust as number) ?? 0;
    const newTrust = clamp(oldTrust + delta, -1, 1);
    graph.updateEdge(existingEdge.id, {
      properties: { ...existingEdge.properties, trust: newTrust },
    });
  } else {
    // Create a new relates_to edge
    const newTrust = clamp(delta, -1, 1);
    graph.addEdge({
      id: `edge_relates_${sourceId}_${targetId}`,
      source: sourceId,
      target: targetId,
      type: 'relates_to',
      properties: {
        trust: newTrust,
        sentiment: 0,
        strength: 0.1,
        basis: 'encounter',
      },
    });
  }
}

/**
 * Create or update an agreement on the relates_to edge between two agents.
 * Returns the edge ID.
 */
function createOrUpdateAgreement(
  graph: WorldGraph,
  sourceId: string,
  targetId: string,
  agreementType: AgreementType,
  encounterId: string,
  tick: number,
): string {
  const existingEdge = findRelatesTo(graph, sourceId, targetId);

  const agreementProps = {
    agreementType,
    agreementEncounterId: encounterId,
    fulfillmentCondition: ENCOUNTER_FULFILLMENT_MAP[encounterId] ?? 'Fulfill the terms of the agreement',
    ticksRemaining: AGREEMENT_DEFAULT_TICKS,
    agreementCreatedTick: tick,
  };

  if (existingEdge) {
    // Update existing edge with agreement properties
    graph.updateEdge(existingEdge.id, {
      properties: {
        ...existingEdge.properties,
        ...agreementProps,
        // Bump strength — an agreement strengthens the bond
        strength: Math.min(1, ((existingEdge.properties.strength as number) ?? 0) + 0.2),
      },
    });
    return existingEdge.id;
  } else {
    // Create new relates_to edge with agreement
    const edgeId = `edge_relates_${sourceId}_${targetId}`;
    graph.addEdge({
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: 'relates_to',
      properties: {
        trust: SOCIAL_COOPERATE_TRUST_BONUS,
        sentiment: 0.2,
        strength: 0.3,
        basis: 'agreement',
        ...agreementProps,
      },
    });
    return edgeId;
  }
}

/** Find relates_to edge between source and target (either direction). */
function findRelatesTo(graph: WorldGraph, sourceId: string, targetId: string) {
  const outgoing = graph.getOutgoingEdges(sourceId, 'relates_to');
  for (const edge of outgoing) {
    if (edge.target === targetId) return edge;
  }
  const incoming = graph.getIncomingEdges(sourceId, 'relates_to');
  for (const edge of incoming) {
    if (edge.source === targetId) return edge;
  }
  return undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
