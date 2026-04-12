/**
 * Trait System Runtime.
 *
 * Trait definitions are nodes (type: 'trait') in the WorldGraph.
 * Trait assignments are 'has_trait' edges from actor/location to trait definition.
 * This module provides assignment, reinforcement, decay, and contribution queries.
 */
import type { WorldGraph } from './graph';
import type { GraphEdge } from '../types/graph';
import type {
  TraitDefinitionProperties,
  TraitAssignmentProperties,
  DomainContributions,
  ReachDomain,
} from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';

/**
 * Get the has_trait edge between a node and a trait, if it exists.
 */
function findTraitEdge(
  graph: WorldGraph,
  nodeId: string,
  traitId: string,
): GraphEdge | undefined {
  const edges = graph.getOutgoingEdges(nodeId, 'has_trait');
  return edges.find((e) => e.target === traitId);
}

/**
 * Assign a trait to a node. If the trait is already assigned, this is a no-op
 * (use reinforceTrait to level up).
 */
export function assignTrait(
  graph: WorldGraph,
  nodeId: string,
  traitId: string,
  opts: { tick: number; source: string },
): void {
  // Check if already assigned
  if (findTraitEdge(graph, nodeId, traitId)) return;

  const traitNode = graph.getNode(traitId);
  if (!traitNode) throw new Error(`Trait not found: ${traitId}`);

  const traitDef = traitNode.properties as unknown as TraitDefinitionProperties;

  const assignment: TraitAssignmentProperties = {
    level: 1,
    acquiredTick: opts.tick,
    lastReinforcedTick: opts.tick,
    source: opts.source,
    visibility: traitDef.visibility,
  };

  graph.addEdge({
    id: `e.has_trait.${nodeId}.${traitId}`,
    source: nodeId,
    target: traitId,
    type: 'has_trait',
    properties: assignment as unknown as Record<string, unknown>,
  });
}

/**
 * Remove a trait assignment from a node.
 */
export function removeTrait(
  graph: WorldGraph,
  nodeId: string,
  traitId: string,
): void {
  const edge = findTraitEdge(graph, nodeId, traitId);
  if (edge) {
    graph.removeEdge(edge.id);
  }
}

/**
 * Get all trait assignment edges for a node.
 */
export function getTraitsForNode(
  graph: WorldGraph,
  nodeId: string,
): GraphEdge[] {
  return graph.getOutgoingEdges(nodeId, 'has_trait');
}

/**
 * Reinforce a trait: increase level (up to maxLevel) and update lastReinforcedTick.
 */
export function reinforceTrait(
  graph: WorldGraph,
  nodeId: string,
  traitId: string,
  tick: number,
): void {
  const edge = findTraitEdge(graph, nodeId, traitId);
  if (!edge) throw new Error(`Trait not assigned: ${nodeId} → ${traitId}`);

  const traitNode = graph.getNode(traitId);
  if (!traitNode) throw new Error(`Trait not found: ${traitId}`);

  const traitDef = traitNode.properties as unknown as TraitDefinitionProperties;
  const assignment = edge.properties as unknown as TraitAssignmentProperties;

  const newLevel = Math.min(assignment.level + 1, traitDef.maxLevel);

  graph.updateEdge(edge.id, {
    properties: {
      ...edge.properties,
      level: newLevel,
      lastReinforcedTick: tick,
    },
  });
}

/**
 * Process trait decay for a single actor/node.
 * Only mastery traits decay (based on decayPeriod).
 * Reduces level by 1 for each decay period elapsed since lastReinforcedTick.
 * Removes the trait if level reaches 0.
 */
export function processTraitDecay(
  graph: WorldGraph,
  nodeId: string,
  currentTick: number,
): void {
  const traitEdges = getTraitsForNode(graph, nodeId);

  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;

    const traitDef = traitNode.properties as unknown as TraitDefinitionProperties;

    // Only mastery traits decay
    if (traitDef.subcategory !== 'mastery') continue;
    if (!traitDef.decayPeriod) continue;

    const assignment = edge.properties as unknown as TraitAssignmentProperties;
    const ticksSinceReinforced = currentTick - assignment.lastReinforcedTick;

    if (ticksSinceReinforced >= traitDef.decayPeriod) {
      // Calculate how many decay steps
      const decaySteps = Math.floor(ticksSinceReinforced / traitDef.decayPeriod);
      const newLevel = assignment.level - decaySteps;

      if (newLevel <= 0) {
        // Remove the trait entirely
        graph.removeEdge(edge.id);
      } else {
        graph.updateEdge(edge.id, {
          properties: {
            ...edge.properties,
            level: newLevel,
          },
        });
      }
    }
  }
}

/**
 * Compute the effective domain contributions for a node by walking all
 * has_trait edges and multiplying domainContributions by level.
 */
export function getEffectiveDomainContributions(
  graph: WorldGraph,
  nodeId: string,
): DomainContributions {
  const result: Record<string, number> = {};
  const traitEdges = getTraitsForNode(graph, nodeId);

  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;

    const traitDef = traitNode.properties as unknown as TraitDefinitionProperties;
    const assignment = edge.properties as unknown as TraitAssignmentProperties;

    const contributions = traitDef.domainContributions;
    for (const domain of REACH_DOMAINS) {
      const base = contributions[domain as ReachDomain] ?? 0;
      if (base !== 0) {
        result[domain] = (result[domain] ?? 0) + base * assignment.level;
      }
    }
  }

  return result as DomainContributions;
}

