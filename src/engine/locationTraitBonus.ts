/**
 * The pool reads a place's traits (THR-790) — the reader that makes location traits
 * real, and the instrument of the parent plan's kill criterion.
 *
 * `scoreAndSelect` adds {@link computeLocationTraitBonus} beside the economic-context
 * term: for every `trait.condition.location.*` trait the candidate's place carries,
 * every tag the candidate template carries is looked up in
 * `LOCATION_TRAIT_ENCOUNTER_BONUS` and the hits are summed, clamped to
 * `LOCATION_TRAIT_ENCOUNTER_BONUS_CAP`. A place with no traits, a trait with no row,
 * a tag no row names — all read 0, so every pre-THR-790 score is unchanged.
 *
 * **Which tags a template "carries".** Its effective tags per the content model
 * (THR-1481/1486): the authored `tags` plus the projected `#<reach>` from its typed
 * `reach` field. The projection is what gives the term reach today — measured
 * 2026-09-22, all 236 shipped encounter templates carry a projected reach tag and
 * 16 carry an authored family word — and it is also why nothing here names a
 * template id: a new template joins a marked town's pool by being *about* the
 * right thing.
 *
 * **Cost (NFP #7).** The location node is the one `scoreAndSelect` has already
 * resolved for the rarity and economic terms; this module never walks the graph per
 * candidate beyond that node's own `has_trait` edges, and a place with none exits
 * before any template lookup. A template's effective tags are static data, memoised
 * per template id for the life of the module.
 *
 * Plan: Docs/plans/2026-09-21-thr-790-traits-wave-2.md § Reading — the pool.
 */
import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { effectiveTags, type ContentCatalogEntry } from '../data/contentEntryTags';
import { isPlaceNode, resolveToParentLocation } from './sublocationShape';
import { LOCATION_CONDITION_ID_PREFIX } from '../data/condition-trait-content';
import {
  LOCATION_TRAIT_ENCOUNTER_BONUS,
  LOCATION_TRAIT_ENCOUNTER_BONUS_CAP,
} from '../data/location-trait-constants';

/** Effective tags per template id — static data, so memoised for the module's life. */
const TEMPLATE_TAGS = new Map<string, readonly string[]>();

/** The tags a template carries, per the content model's projection rule; `[]` for an unknown id. */
export function templateEffectiveTags(templateId: string): readonly string[] {
  const cached = TEMPLATE_TAGS.get(templateId);
  if (cached) return cached;
  const template = getUnifiedTemplateById(templateId);
  const tags = template
    ? effectiveTags('encounter_template', template as unknown as ContentCatalogEntry)
    : [];
  TEMPLATE_TAGS.set(templateId, tags);
  return tags;
}

/**
 * The location-trait ids a candidate's place carries — the place tier's edges, with
 * a Place (sublocation) hopping to its parent Location, the way the step reader does.
 * Empty when the node is missing or carries none.
 */
export function locationTraitIdsAt(graph: WorldGraph, locationNode: GraphNode | undefined): string[] {
  if (!locationNode) return [];
  const place = isPlaceNode(locationNode)
    ? resolveToParentLocation(graph, locationNode)
    : locationNode;
  if (!place) return [];
  const out: string[] = [];
  for (const edge of graph.getOutgoingEdges(place.id, 'has_trait')) {
    if (edge.target.startsWith(LOCATION_CONDITION_ID_PREFIX)) out.push(edge.target);
  }
  return out;
}

/**
 * The additive pool bonus for `templateId` at a place carrying `traitIds` —
 * Σ over (trait, tag) of `LOCATION_TRAIT_ENCOUNTER_BONUS[trait][tag]`, clamped to
 * the cap. Pure; the graph-reading half is {@link locationTraitIdsAt}.
 */
export function locationTraitBonusFor(traitIds: readonly string[], templateId: string): number {
  if (traitIds.length === 0) return 0;
  let sum = 0;
  let any = false;
  for (const traitId of traitIds) {
    const row = LOCATION_TRAIT_ENCOUNTER_BONUS[traitId];
    if (!row) continue;
    // Tags are read lazily so a place whose traits have no rows never touches the template.
    for (const tag of templateEffectiveTags(templateId)) {
      const v = row[tag];
      if (typeof v === 'number' && Number.isFinite(v)) {
        sum += v;
        any = true;
      }
    }
  }
  if (!any) return 0;
  return Math.max(-LOCATION_TRAIT_ENCOUNTER_BONUS_CAP, Math.min(LOCATION_TRAIT_ENCOUNTER_BONUS_CAP, sum));
}

/**
 * The term `scoreAndSelect` adds: the bonus for `templateId` at `locationNode`.
 * 0 whenever the place carries no location trait, so the common case costs one
 * edge walk on an already-resolved node.
 */
export function computeLocationTraitBonus(
  graph: WorldGraph,
  locationNode: GraphNode | undefined,
  templateId: string,
): number {
  return locationTraitBonusFor(locationTraitIdsAt(graph, locationNode), templateId);
}
