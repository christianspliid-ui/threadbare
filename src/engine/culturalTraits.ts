/**
 * Cultural Traits Engine
 *
 * Converts culture-content.ts trait seeds into real graph nodes (trait definitions)
 * and assigns them to agents via has_trait edges.
 *
 * Cultural traits scale with cultural strength: behavioral traits contribute more
 * (or less) depending on how strongly an agent identifies with their culture.
 */

import type { WorldGraph } from './graph';
import type { TraitDefinitionProperties, DomainContributions } from '../types/traits';
import type { CultureEdgeProperties } from '../types/culture';
import {
  getFormativeTraitSeed,
  getBehavioralTraitSeed,
  type CulturalStrengthRange,
} from '../data/culture-content';
import { REACH_DOMAINS } from '../types/traits';

// ─── Tunable Constants ──────────────────────────────────────────

/** Thresholds for cultural strength expression levels */
export const CULTURAL_STRENGTH_THRESHOLDS: Record<CulturalStrengthRange, number> = {
  fanatical: 0.8,  // Maximum cultural strength expression
  strong: 0.5,     // Clear cultural influence
  fading: 0.3,     // Weak cultural influence
  silent: 0.0,     // Below this, contributions are zero
};

// ─── Trait Instantiation ────────────────────────────────────────

/**
 * Create trait definition nodes from formative trait seed IDs.
 * Idempotent — will not duplicate existing nodes.
 *
 * Formative traits are permanent innate cultural skills with subcategory='innate'
 * and culturalOrigin=true flag.
 *
 * @param graph The world graph
 * @param seedIds Array of formative trait seed IDs
 * @returns Array of created/existing trait node IDs
 */
export function instantiateFormativeTraits(
  graph: WorldGraph,
  seedIds: string[],
): string[] {
  const nodeIds: string[] = [];

  for (const seedId of seedIds) {
    const seed = getFormativeTraitSeed(seedId);
    if (!seed) continue;

    const nodeId = `trait_formative_${seedId}`;

    // Check if already exists
    if (graph.getNode(nodeId)) {
      nodeIds.push(nodeId);
      continue;
    }

    // Create trait definition node
    const traitDef: TraitDefinitionProperties = {
      subcategory: 'innate',
      description: seed.description,
      importance: 0.7,  // Formative traits are important
      maxLevel: 1,      // Binary — either you have it or not
      visibility: 'public',
      domainContributions: seed.domainContributions,
      tags: seed.tags,
      flavorText: seed.name,
      culturalOrigin: true,
    };

    graph.addNode({
      id: nodeId,
      type: 'trait',
      name: seed.name,
      properties: traitDef as unknown as Record<string, unknown>,
    });

    nodeIds.push(nodeId);
  }

  return nodeIds;
}

/**
 * Create trait definition nodes from behavioral trait seed IDs.
 * Idempotent — will not duplicate existing nodes.
 *
 * Behavioral traits are cultural in nature with subcategory='cultural'
 * and include strengthThresholds for strength-gated expressions.
 *
 * @param graph The world graph
 * @param seedIds Array of behavioral trait seed IDs
 * @returns Array of created/existing trait node IDs
 */
export function instantiateBehavioralTraits(
  graph: WorldGraph,
  seedIds: string[],
): string[] {
  const nodeIds: string[] = [];

  for (const seedId of seedIds) {
    const seed = getBehavioralTraitSeed(seedId);
    if (!seed) continue;

    const nodeId = `trait_behavioral_${seedId}`;

    // Check if already exists
    if (graph.getNode(nodeId)) {
      nodeIds.push(nodeId);
      continue;
    }

    // Create trait definition node
    const traitDef: TraitDefinitionProperties = {
      subcategory: 'cultural',
      description: seed.description,
      importance: 0.6,  // Behavioral traits are moderately important
      maxLevel: 1,      // Binary assignment
      visibility: 'public',
      domainContributions: seed.domainContributions,
      strengthThresholds: seed.strengthThresholds,
      tags: seed.tags,
      flavorText: seed.name,
    };

    graph.addNode({
      id: nodeId,
      type: 'trait',
      name: seed.name,
      properties: traitDef as unknown as Record<string, unknown>,
    });

    nodeIds.push(nodeId);
  }

  return nodeIds;
}

// ─── Trait Assignment ──────────────────────────────────────────

/**
 * Grant formative trait nodes to an actor via has_trait edges.
 * Formative traits are permanent — no strength-gating.
 *
 * @param graph The world graph
 * @param actorId Target actor node ID
 * @param traitNodeIds Array of trait definition node IDs to assign
 * @param tick Current simulation tick
 */
export function grantFormativeTraits(
  graph: WorldGraph,
  actorId: string,
  traitNodeIds: string[],
  tick: number,
): void {
  for (const traitId of traitNodeIds) {
    const edgeId = `e.has_trait.${actorId}.${traitId}`;

    // Skip if already assigned
    if (graph.getEdge(edgeId)) continue;

    graph.addEdge({
      id: edgeId,
      source: actorId,
      target: traitId,
      type: 'has_trait',
      properties: {
        level: 1,
        acquiredTick: tick,
        lastReinforcedTick: tick,
        source: 'cultural_formative',
        visibility: 'public',
      },
    });
  }
}

/**
 * Grant behavioral trait nodes to an actor via has_trait edges.
 * Behavioral traits scale with cultural strength.
 *
 * @param graph The world graph
 * @param actorId Target actor node ID
 * @param traitNodeIds Array of trait definition node IDs to assign
 * @param tick Current simulation tick
 */
export function grantBehavioralTraits(
  graph: WorldGraph,
  actorId: string,
  traitNodeIds: string[],
  tick: number,
): void {
  for (const traitId of traitNodeIds) {
    const edgeId = `e.has_trait.${actorId}.${traitId}`;

    // Skip if already assigned
    if (graph.getEdge(edgeId)) continue;

    graph.addEdge({
      id: edgeId,
      source: actorId,
      target: traitId,
      type: 'has_trait',
      properties: {
        level: 1,
        acquiredTick: tick,
        lastReinforcedTick: tick,
        source: 'cultural_behavioral',
        visibility: 'public',
      },
    });
  }
}

// ─── Cultural Strength Queries ──────────────────────────────────

/**
 * Get the maximum cultural strength from belongs_to edges.
 * If actor belongs to multiple cultures, returns the strongest bond.
 *
 * @param graph The world graph
 * @param actorId Target actor node ID
 * @returns Cultural strength (0.0–1.0), or 0 if no culture
 */
export function getActorCulturalStrength(graph: WorldGraph, actorId: string): number {
  const edges = graph.getOutgoingEdges(actorId, 'belongs_to');
  let maxStrength = 0;

  for (const edge of edges) {
    const props = edge.properties as unknown as CultureEdgeProperties;
    if (props.culturalStrength > maxStrength) {
      maxStrength = props.culturalStrength;
    }
  }

  return maxStrength;
}

/**
 * Determine the strength range label for a cultural strength value.
 *
 * @param strength Cultural strength (0.0–1.0)
 * @returns Strength range label
 */
export function getStrengthRange(strength: number): CulturalStrengthRange {
  if (strength >= CULTURAL_STRENGTH_THRESHOLDS.fanatical) return 'fanatical';
  if (strength >= CULTURAL_STRENGTH_THRESHOLDS.strong) return 'strong';
  if (strength >= CULTURAL_STRENGTH_THRESHOLDS.fading) return 'fading';
  return 'silent';
}

// ─── Contributions Aggregation ──────────────────────────────────

/**
 * Compute effective domain contributions for an actor's cultural traits,
 * scaled by cultural strength.
 *
 * Below the silent threshold (0.3), contributions are zero.
 * At full strength (1.0), contributions are unscaled.
 * In between, contributions scale linearly.
 *
 * @param graph The world graph
 * @param actorId Target actor node ID
 * @returns Scaled domain contributions
 */
export function getEffectiveCulturalContributions(
  graph: WorldGraph,
  actorId: string,
): DomainContributions {
  const result: Record<string, number> = {};
  const culturalStrength = getActorCulturalStrength(graph, actorId);

  // Below silent threshold = zero contributions
  if (culturalStrength < CULTURAL_STRENGTH_THRESHOLDS.silent) {
    return {};
  }

  // Below fading threshold = zero contributions
  if (culturalStrength < CULTURAL_STRENGTH_THRESHOLDS.fading) {
    return {};
  }

  // Get behavioral traits
  const traitEdges = graph.getOutgoingEdges(actorId, 'has_trait');

  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;

    const traitDef = traitNode.properties as unknown as TraitDefinitionProperties;

    // Only process cultural traits
    if (traitDef.subcategory !== 'cultural') continue;

    const contributions = traitDef.domainContributions;

    // Scale contributions by cultural strength
    for (const domain of REACH_DOMAINS) {
      const base = contributions[domain] ?? 0;
      if (base !== 0) {
        const scaled = base * culturalStrength;
        result[domain] = (result[domain] ?? 0) + scaled;
      }
    }
  }

  return result as DomainContributions;
}
