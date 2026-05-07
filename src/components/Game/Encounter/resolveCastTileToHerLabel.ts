import type { RelationshipResult } from '../../../engine/encounters/relationshipResolver';

const ARC_PHRASES: Record<
  Exclude<RelationshipResult & { source: 'edge_sentiment' }, never>['arc'],
  string
> = {
  improving: 'a bond drawing closer',
  stable: 'a steady understanding',
  fraying: 'a thread under strain',
  severed: 'a line gone cold',
};

/**
 * Resolve a relationship result into the "to her: …" line shown on a CastTile.
 *
 * Priority: relationship-node tension_axis → edge-sentiment arc phrase →
 * authored fallback phrase → null.
 *
 * Returning null lets CastTile suppress the relationship line entirely
 * rather than rendering a placeholder, which would clutter cast tiles for
 * actors with no remembered history with the protagonist.
 */
export function resolveCastTileToHerLabel(
  relationship: RelationshipResult | null | undefined,
  fallbackPhrase?: string,
): string | null {
  if (relationship && relationship.source === 'node') {
    return relationship.data.tension_axis;
  }
  if (relationship && relationship.source === 'edge_sentiment') {
    return ARC_PHRASES[relationship.arc];
  }
  if (fallbackPhrase && fallbackPhrase.length > 0) {
    return fallbackPhrase;
  }
  return null;
}
