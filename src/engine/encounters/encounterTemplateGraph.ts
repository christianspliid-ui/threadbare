/**
 * Encounter Template Graph — traversal helpers for encounter_template nodes.
 *
 * Provides read-only access to the three encounter-arc edge types:
 *   gates_to  — hard unlock: completing source makes target eligible
 *   spawns_from — context sourcing: template originates from a location/actor
 *   enables   — soft prerequisite: completion boosts target eligibility score
 *
 * Design plan: Docs/plans/2026-05-04-encounter-experience-design-plan.md §3.8
 * THR-327 (Phase B5)
 *
 * All functions are pure read operations. Callers that mutate encounter_template
 * or relationship nodes must call touchWorld(runtime) (and touchStructure if
 * structural topology changed) after the mutation.
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';

// ─── Query helpers ────────────────────────────────────────────────────────────

/**
 * Returns all encounter_template nodes that `templateNodeId` directly gates
 * (i.e., targets of outgoing `gates_to` edges).
 * Completing `templateNodeId` hard-unlocks each returned node.
 */
export function getGatedDownstream(graph: WorldGraph, templateNodeId: string): GraphNode[] {
  const edges = graph.getOutgoingEdges(templateNodeId, 'gates_to');
  const results: GraphNode[] = [];
  for (const edge of edges) {
    const node = graph.getNode(edge.target);
    if (node && node.type === 'encounter_template') results.push(node);
  }
  return results;
}

/**
 * Returns all encounter_template nodes that gate `templateNodeId`
 * (i.e., sources of incoming `gates_to` edges).
 * All returned nodes must be completed before `templateNodeId` is eligible.
 */
export function getGatingPrerequisites(graph: WorldGraph, templateNodeId: string): GraphNode[] {
  const edges = graph.getIncomingEdges(templateNodeId, 'gates_to');
  const results: GraphNode[] = [];
  for (const edge of edges) {
    const node = graph.getNode(edge.source);
    if (node && node.type === 'encounter_template') results.push(node);
  }
  return results;
}

/**
 * Returns all encounter_template nodes that `templateNodeId` softly enables
 * (i.e., targets of outgoing `enables` edges).
 * Completing `templateNodeId` boosts eligibility of each returned node.
 */
export function getEnabledTemplates(graph: WorldGraph, templateNodeId: string): GraphNode[] {
  const edges = graph.getOutgoingEdges(templateNodeId, 'enables');
  const results: GraphNode[] = [];
  for (const edge of edges) {
    const node = graph.getNode(edge.target);
    if (node && node.type === 'encounter_template') results.push(node);
  }
  return results;
}

/**
 * Returns all nodes this encounter template spawns from
 * (i.e., targets of outgoing `spawns_from` edges).
 * These are locations or actors that contextually source this encounter.
 */
export function getSpawnSources(graph: WorldGraph, templateNodeId: string): GraphNode[] {
  const edges = graph.getOutgoingEdges(templateNodeId, 'spawns_from');
  const results: GraphNode[] = [];
  for (const edge of edges) {
    const node = graph.getNode(edge.target);
    if (node) results.push(node);
  }
  return results;
}

/**
 * Returns all encounter_template nodes that spawn from `sourceNodeId`
 * (i.e., templates with an outgoing `spawns_from` edge pointing to this node).
 * Used in candidate generation to find encounters available at a given context.
 */
export function getTemplatesSpawnedFrom(graph: WorldGraph, sourceNodeId: string): GraphNode[] {
  const edges = graph.getIncomingEdges(sourceNodeId, 'spawns_from');
  const results: GraphNode[] = [];
  for (const edge of edges) {
    const node = graph.getNode(edge.source);
    if (node && node.type === 'encounter_template') results.push(node);
  }
  return results;
}

/**
 * Returns true if all hard-gate prerequisites for `templateNodeId` are satisfied.
 *
 * A prerequisite is satisfied when its `template_id` appears in `completedTemplateIds`.
 * Templates with no incoming `gates_to` edges are always unlocked.
 */
export function isTemplateUnlocked(
  graph: WorldGraph,
  templateNodeId: string,
  completedTemplateIds: ReadonlySet<string>,
): boolean {
  const prerequisites = getGatingPrerequisites(graph, templateNodeId);
  if (prerequisites.length === 0) return true;

  for (const prereq of prerequisites) {
    const prereqTemplateId = prereq.properties.template_id as string | undefined;
    if (!prereqTemplateId || !completedTemplateIds.has(prereqTemplateId)) {
      return false;
    }
  }
  return true;
}
