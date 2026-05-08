/**
 * Graph-aware encounter candidate generation.
 *
 * Augments the array-scored candidate path (generateUnifiedCandidates) with
 * encounter_template graph node traversal. When encounter_template nodes exist
 * in the graph, this function returns candidates derived from graph topology:
 *   - Templates that spawn from the current location context
 *   - Filtered by hard-gate prerequisites (gates_to edges)
 *
 * When no encounter_template nodes are present, returns an empty array so the
 * caller falls back to the existing array-scored path. This is the backward-compat
 * guarantee per design plan §3.8.
 *
 * Design plan: Docs/plans/2026-05-04-encounter-experience-design-plan.md §3.8
 * THR-327 (Phase B5)
 */

import type { WorldGraph } from '../graph';
import { getTemplatesSpawnedFrom, isTemplateUnlocked } from './encounterTemplateGraph';

// ─── Public API ──────────────────────────────────────────────────────────────

export interface GraphEncounterCandidate {
  /** The graph node ID of the encounter_template node. */
  templateNodeId: string;
  /** The template_id property — reference to the EncounterContract id. */
  templateId: string;
  /** ID of the spawn-source node that matched (location or actor). */
  spawnSourceId: string;
}

/**
 * Generate encounter candidates from encounter_template graph nodes.
 *
 * Returns candidates for templates that:
 *   1. Have a `spawns_from` edge targeting `contextNodeId` (the current location or actor).
 *   2. Pass the hard-gate check: all incoming `gates_to` prerequisites are in `completedTemplateIds`.
 *
 * Returns an empty array when no encounter_template nodes exist in the graph,
 * signalling the caller to use the existing array-scored path as the full result.
 *
 * @param graph - The world graph.
 * @param contextNodeId - ID of the location (or actor) to find spawnable templates for.
 * @param completedTemplateIds - Set of `template_id` values from previously completed encounters.
 */
export function generateGraphEncounterCandidates(
  graph: WorldGraph,
  contextNodeId: string,
  completedTemplateIds: ReadonlySet<string> = new Set(),
): GraphEncounterCandidate[] {
  // Fast-path: no encounter_template nodes → use array path
  const allTemplateNodes = graph.getNodesByType('encounter_template');
  if (allTemplateNodes.length === 0) return [];

  const spawnable = getTemplatesSpawnedFrom(graph, contextNodeId);
  if (spawnable.length === 0) return [];

  const candidates: GraphEncounterCandidate[] = [];

  for (const node of spawnable) {
    const templateId = node.properties.template_id as string | undefined;
    if (!templateId) continue;

    if (!isTemplateUnlocked(graph, node.id, completedTemplateIds)) continue;

    candidates.push({
      templateNodeId: node.id,
      templateId,
      spawnSourceId: contextNodeId,
    });
  }

  return candidates;
}
