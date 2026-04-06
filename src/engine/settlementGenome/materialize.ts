import type { WorldGraph } from '../graph';
import type { GenomeResult } from './types';

/**
 * Convert a GenomeResult into actual graph nodes (sublocation instances + contains edges).
 * Idempotent: skips sublocations that already exist.
 */
export function materializeGenome(
  graph: WorldGraph,
  locationId: string,
  result: GenomeResult,
  _seed: number,
): void {
  const loc = graph.getNode(locationId);
  if (!loc) return;

  // Store genome metadata on location
  loc.properties.archetypeId = result.archetypeId;
  loc.properties.archetypeName = result.archetypeName;
  loc.properties.archetypeProseFlavor = result.archetypeProseFlavor;
  loc.properties.genomeResult = result;

  // Check existing sublocations to avoid duplicates
  const existingContains = graph.getOutgoingEdges(locationId, 'contains');
  const existingTypeIds = new Set(
    existingContains
      .map(e => {
        const node = graph.getNode(e.target);
        return node?.properties.sublocationTypeId as string | undefined;
      })
      .filter(Boolean),
  );

  for (let i = 0; i < result.sublocations.length; i++) {
    const sub = result.sublocations[i];
    if (existingTypeIds.has(sub.id)) continue;

    const subId = `${locationId}_sub_${sub.id.replace('sublocation-type.', '')}_${i}`;
    const subName = sub.id
      .replace('sublocation-type.', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    graph.addNode({
      id: subId,
      type: 'location',
      name: subName,
      properties: {
        sublocationTypeId: sub.id,
        parentLocationId: locationId,
        hexCol: loc.properties.hexCol,
        hexRow: loc.properties.hexRow,
        genomeSourcePass: sub.sourcePass,
        genomeTags: sub.tags,
      },
    });

    graph.addEdge({
      id: `edge_contains_${locationId}_${subId}`,
      type: 'contains',
      source: locationId,
      target: subId,
      properties: {},
    });
  }
}
