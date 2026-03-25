/**
 * Agent Validation Utility — verifies agent nodes have all required data
 * for the tick loop to process them correctly.
 *
 * Called after world seed and after each birth event.
 * Returns structured results for tracing and debugging.
 */

import type { WorldGraph } from './graph';
import type { ValuePair } from '../types/agent';
import { VALUE_PAIRS } from '../types/agent';
import { REACH_DOMAINS } from '../types/traits';
import type { ReachDomain } from '../types/traits';
import type { MovementState } from '../types/movement';

// ─── Constants ────────────────────────────────────────────────────

export const CANONICAL_VALUE_PAIRS: readonly ValuePair[] = VALUE_PAIRS;

export const CANONICAL_REACHES: readonly ReachDomain[] = REACH_DOMAINS;

export const VALID_ACTOR_TYPES = [
  'individual', 'faction', 'culture', 'group', 'god', 'ascendant',
] as const;

export const VALID_COOPERATION_STRATEGIES = [
  'tit-for-tat', 'grudger', 'pavlov', 'always-cooperate', 'always-defect',
] as const;

// ─── Types ────────────────────────────────────────────────────────

export interface AgentValidationResult {
  agentId: string;
  valid: boolean;
  checks: {
    nodeIntegrity: boolean;
    axiologicalProfile: boolean;
    domainCapabilities: boolean;
    locationBinding: boolean;
    identityProperties: boolean;
    edgeRelationships: boolean;
    movementState: boolean;
    locationConsistency: boolean;
  };
  warnings: string[];
  errors: string[];
}

// ─── Validator ────────────────────────────────────────────────────

/**
 * Validate that an agent node has all required data for the tick loop.
 * Returns a structured result with per-check booleans and error/warning lists.
 */
export function validateAgentIntegrity(
  graph: WorldGraph,
  agentId: string,
): AgentValidationResult {
  const result: AgentValidationResult = {
    agentId,
    valid: true,
    checks: {
      nodeIntegrity: true,
      axiologicalProfile: true,
      domainCapabilities: true,
      locationBinding: true,
      identityProperties: true,
      edgeRelationships: true,
      movementState: true,
      locationConsistency: true,
    },
    warnings: [],
    errors: [],
  };

  // ── Check 1: Node Integrity ──────────────────────────────────
  const node = graph.getNode(agentId);
  if (!node) {
    result.checks.nodeIntegrity = false;
    result.errors.push(`Node ${agentId} does not exist in graph`);
    result.valid = false;
    return result;
  }

  if (node.type !== 'actor') {
    result.checks.nodeIntegrity = false;
    result.errors.push(`Node ${agentId} has type '${node.type}', expected 'actor'`);
    result.valid = false;
    return result;
  }

  const props = node.properties as Record<string, unknown>;
  const actorType = props.actorType as string | undefined;

  if (!actorType || !(VALID_ACTOR_TYPES as readonly string[]).includes(actorType)) {
    result.checks.nodeIntegrity = false;
    result.errors.push(`Invalid actorType: '${actorType}'`);
    result.valid = false;
  }

  if (!node.name || typeof node.name !== 'string' || node.name.trim() === '') {
    result.checks.nodeIntegrity = false;
    result.errors.push(`Agent has empty or missing name`);
    result.valid = false;
  }

  const isIndividual = actorType === 'individual';

  // ── Check 2: Axiological Profile ──────────────────────────────
  const profile = props.axiologicalProfile as Record<string, number> | undefined;
  if (!profile || typeof profile !== 'object' || Object.keys(profile).length === 0) {
    result.checks.axiologicalProfile = false;
    result.errors.push(`axiologicalProfile is missing or empty`);
    result.valid = false;
  } else {
    for (const pair of CANONICAL_VALUE_PAIRS) {
      const val = profile[pair];
      if (val === undefined || typeof val !== 'number') {
        result.checks.axiologicalProfile = false;
        result.errors.push(`axiologicalProfile missing pair: ${pair}`);
        result.valid = false;
      } else if (val < -1 || val > 1) {
        result.checks.axiologicalProfile = false;
        result.warnings.push(`axiologicalProfile.${pair} = ${val} is out of [-1, 1] range`);
      }
    }
  }

  // ── Check 3: Domain Capabilities ──────────────────────────────
  const caps = props.domainCapabilities as Record<string, number> | undefined;
  if (!caps || typeof caps !== 'object' || Object.keys(caps).length === 0) {
    result.checks.domainCapabilities = false;
    result.errors.push(`domainCapabilities is missing or empty`);
    result.valid = false;
  } else {
    for (const reach of CANONICAL_REACHES) {
      const val = caps[reach];
      if (val === undefined || typeof val !== 'number') {
        result.checks.domainCapabilities = false;
        result.errors.push(`domainCapabilities missing reach: ${reach}`);
        result.valid = false;
      } else if (val < 0) {
        result.checks.domainCapabilities = false;
        result.warnings.push(`domainCapabilities.${reach} = ${val} is negative`);
      }
    }
  }

  // ── Check 4: Location Binding (individuals only) ──────────────
  if (isIndividual) {
    const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
    if (locEdges.length === 0) {
      result.checks.locationBinding = false;
      result.errors.push(`Individual has no located_at edge`);
      result.valid = false;
    } else if (locEdges.length > 1) {
      result.checks.locationBinding = false;
      result.warnings.push(`Individual has ${locEdges.length} located_at edges (expected 1)`);
    }

    if (locEdges.length > 0) {
      const locTarget = graph.getNode(locEdges[0].target);
      if (!locTarget) {
        result.checks.locationBinding = false;
        result.errors.push(`located_at edge points to non-existent node: ${locEdges[0].target}`);
        result.valid = false;
      } else if (locTarget.type !== 'location') {
        result.checks.locationBinding = false;
        result.warnings.push(`located_at edge target has type '${locTarget.type}', expected 'location'`);
      }
    }

    // ── Check: Location Consistency ──────────────────────────────
    const locationId = props.locationId as string | undefined;
    if (locationId && locEdges.length > 0) {
      const edgeTarget = locEdges[0].target;
      if (locationId !== edgeTarget) {
        result.checks.locationConsistency = false;
        result.warnings.push(
          `properties.locationId (${locationId}) disagrees with located_at edge target (${edgeTarget})`,
        );
      }
    }
  }

  // ── Check 5: Identity Properties (individuals only) ────────────
  if (isIndividual) {
    const archetype = props.narrativeArchetype as string | undefined;
    if (!archetype || typeof archetype !== 'string') {
      result.checks.identityProperties = false;
      result.warnings.push(`Individual missing narrativeArchetype`);
    }

    const strategy = props.cooperationStrategy as string | undefined;
    if (strategy !== undefined && !(VALID_COOPERATION_STRATEGIES as readonly string[]).includes(strategy)) {
      result.checks.identityProperties = false;
      result.warnings.push(`Invalid cooperationStrategy: '${strategy}'`);
    }

    const rep = props.reputationScore as number | undefined;
    if (rep !== undefined && (typeof rep !== 'number' || rep < 0 || rep > 1)) {
      result.checks.identityProperties = false;
      result.warnings.push(`reputationScore ${rep} is out of [0, 1] range`);
    }
  }

  // ── Check 6: Edge Relationships ───────────────────────────────
  const edgeChecks: [string, string][] = [
    ['member_of', 'actor'],
    ['worships', 'actor'],
    ['belongs_to', 'actor'],
  ];

  for (const [edgeType, expectedNodeType] of edgeChecks) {
    const edges = graph.getOutgoingEdges(agentId, edgeType as any);
    for (const edge of edges) {
      const target = graph.getNode(edge.target);
      if (!target) {
        result.checks.edgeRelationships = false;
        result.warnings.push(`${edgeType} edge points to non-existent node: ${edge.target}`);
      } else if (target.type !== expectedNodeType) {
        result.checks.edgeRelationships = false;
        result.warnings.push(`${edgeType} edge target has type '${target.type}', expected '${expectedNodeType}'`);
      }
    }
  }

  // Check pursues edges point to ambition nodes
  const pursuesEdges = graph.getOutgoingEdges(agentId, 'pursues');
  for (const edge of pursuesEdges) {
    const target = graph.getNode(edge.target);
    if (!target) {
      result.checks.edgeRelationships = false;
      result.warnings.push(`pursues edge points to non-existent node: ${edge.target}`);
    } else if (target.type !== 'ambition') {
      result.checks.edgeRelationships = false;
      result.warnings.push(`pursues edge target has type '${target.type}', expected 'ambition'`);
    }
  }

  // ── Check 7: Movement State Integrity (if present) ─────────────
  const ms = props.movementState as MovementState | undefined;
  if (ms) {
    if (!ms.destinationId || !graph.getNode(ms.destinationId)) {
      result.checks.movementState = false;
      result.warnings.push(`movementState.destinationId points to invalid node: ${ms.destinationId}`);
    }

    if (!Array.isArray(ms.movementQueue)) {
      result.checks.movementState = false;
      result.errors.push(`movementState.movementQueue is not an array`);
      result.valid = false;
    }

    if (typeof ms.ticksAccumulated !== 'number' || ms.ticksAccumulated < 0) {
      result.checks.movementState = false;
      result.warnings.push(`movementState.ticksAccumulated is invalid: ${ms.ticksAccumulated}`);
    }

    if (typeof ms.currentEdgeCost !== 'number' || ms.currentEdgeCost <= 0) {
      result.checks.movementState = false;
      result.warnings.push(`movementState.currentEdgeCost is invalid: ${ms.currentEdgeCost}`);
    }

    if (ms.roadHexQueue) {
      for (const hex of ms.roadHexQueue) {
        if (typeof hex.col !== 'number' || typeof hex.row !== 'number') {
          result.checks.movementState = false;
          result.warnings.push(`roadHexQueue entry has invalid col/row`);
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Validate all agents in the graph and return results.
 * Useful for post-seed validation and debug console dumps.
 */
export function validateAllAgents(graph: WorldGraph): AgentValidationResult[] {
  const actors = graph.getNodesByType('actor');
  return actors.map(actor => validateAgentIntegrity(graph, actor.id));
}
