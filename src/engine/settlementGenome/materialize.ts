import type { WorldGraph } from '../graph';
import type { GenomeResult } from './types';
import { hashString, mulberry32 } from '../../lib/prng';
import { generateTavernName } from '../../data/tavern-names';
import { SUBTYPE_SUBLOCATION_MAP, TAVERN_SUBLOCATION_TYPE_ID } from '../sublocation';

/**
 * THR-1857 — sublocation types whose instances get a generated house name ("The Drowned
 * Lantern") instead of the type label. The inn is a tavern with rooms; both read as a
 * place a person names, and the bare label "Inn" read as a town called Inn.
 */
const NAMED_HOUSE_TYPE_IDS: ReadonlySet<string> = new Set([
  TAVERN_SUBLOCATION_TYPE_ID,
  'sublocation-type.inn',
]);

/** Redraws allowed when a generated house name repeats one already in the settlement. */
const HOUSE_NAME_RETRIES = 5;

/** Type id → authored label, read from the one sublocation type table. */
let typeLabels: Map<string, string> | undefined;
function typeLabelFor(typeId: string): string {
  typeLabels ??= new Map(
    Object.values(SUBTYPE_SUBLOCATION_MAP).flat().map(def => [def.id, def.name] as const),
  );
  return typeLabels.get(typeId) ?? typeId
    .replace('sublocation-type.', '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Player-facing name for a genome sublocation. Mirrors `ensureSublocations`
 * (sublocation.ts): a tavern or inn gets a generated name; anything else reads
 * "<Type label> (<Settlement>)", never the bare type label, which reads as a place name.
 */
export function genomeSublocationName(
  typeId: string,
  settlementName: string,
  culture: string | undefined,
  rng: () => number,
): string {
  if (NAMED_HOUSE_TYPE_IDS.has(typeId)) return generateTavernName(rng, culture);
  return `${typeLabelFor(typeId)} (${settlementName})`;
}

/**
 * Convert a GenomeResult into actual graph nodes (sublocation instances + contains edges).
 * Idempotent: skips sublocations that already exist.
 */
export function materializeGenome(
  graph: WorldGraph,
  locationId: string,
  result: GenomeResult,
  seed: number,
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

  // Names already standing in this settlement: worldgen materializes twice with the same
  // seed (the second pass adds only what the first could not see), so a house named in
  // pass 2 must not repeat one named in pass 1.
  const takenNames = new Set(
    existingContains.map(e => graph.getNode(e.target)?.name).filter((n): n is string => !!n),
  );
  // A settlement's culture is its current `belongs_to` edge (the writer worldSeed reads);
  // the `culture` property is a legacy shape kept as the fallback.
  const culture = graph.getOutgoingEdges(locationId, 'belongs_to')
    .find(e => e.properties.cultureLayer === 'current')?.target
    ?? (typeof loc.properties.culture === 'string' ? loc.properties.culture : undefined);

  for (let i = 0; i < result.sublocations.length; i++) {
    const sub = result.sublocations[i];
    if (existingTypeIds.has(sub.id)) continue;

    const subId = `${locationId}_sub_${sub.id.replace('sublocation-type.', '')}_${i}`;
    // One stream per type, so the inn and a later tavern draw different words.
    const rng = mulberry32((seed ^ hashString(sub.id)) >>> 0);
    let subName = genomeSublocationName(sub.id, loc.name, culture, rng);
    for (let retry = 0; takenNames.has(subName) && retry < HOUSE_NAME_RETRIES; retry++) {
      subName = genomeSublocationName(sub.id, loc.name, culture, rng);
    }
    takenNames.add(subName);

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
        persistence: { type: 'permanent' },
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
