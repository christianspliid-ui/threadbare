/**
 * Insider Beat Detection.
 *
 * Determines which culture-gated narrative beats are available for a given actor
 * based on their cultural identity and cultural strength.
 *
 * Insider beats require specific culture tags (sphere/biome) and minimum strength.
 * Source: Docs/plans/2026-03-06-culture-bounded-context-design.md §5
 */

import type { WorldGraph } from './graph';
import type { CultureIdentity } from '../types/culture';
import type { InsiderBeat } from '../data/culture-content';
import { getBeatsForCultureTags } from '../data/culture-content';

/**
 * Extract culture tags (sphere names + biome) from a CultureIdentity.
 */
function getCultureTags(identity: CultureIdentity): string[] {
  const tags: string[] = [];
  // Venerated spheres are direct tags
  for (const sphere of identity.veneratedSpheres) {
    tags.push(sphere);
  }
  // Primary biome is a tag
  tags.push(identity.primaryBiome);
  // Foundation bias is a tag
  if (identity.foundationBias) {
    tags.push(identity.foundationBias);
  }
  return tags;
}

/**
 * Get all insider beats available to an actor based on their culture(s).
 *
 * Walks actor's belongs_to edges to find cultures, extracts culture tags,
 * matches against insider beat requirements, and filters by minimum strength.
 */
export function getAvailableInsiderBeats(
  graph: WorldGraph,
  actorId: string,
): InsiderBeat[] {
  const cultureEdges = graph.getOutgoingEdges(actorId, 'belongs_to')
    .filter(e => {
      const node = graph.getNode(e.target);
      return node?.type === 'actor' && (node.properties as any).actorType === 'culture';
    });

  if (cultureEdges.length === 0) return [];

  const availableBeats: InsiderBeat[] = [];
  const seenBeatIds = new Set<string>();

  for (const edge of cultureEdges) {
    const cultureNode = graph.getNode(edge.target);
    if (!cultureNode) continue;

    const identity = cultureNode.properties.cultureIdentity as CultureIdentity | undefined;
    if (!identity) continue;

    const culturalStrength = (edge.properties as any).culturalStrength ?? 0;
    const tags = getCultureTags(identity);
    const matchingBeats = getBeatsForCultureTags(tags);

    for (const beat of matchingBeats) {
      if (seenBeatIds.has(beat.id)) continue;
      if (culturalStrength >= beat.minStrength) {
        availableBeats.push(beat);
        seenBeatIds.add(beat.id);
      }
    }
  }

  return availableBeats;
}
