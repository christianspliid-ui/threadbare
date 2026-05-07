/**
 * Detail page showcase authoring — authored override prose for `node.showcase: true` entities.
 *
 * Design doc: Docs/plans/2026-05-06-detail-page-data-model.md §4.4
 *
 * THR-338 lands the contract. THR-318 Stream 2 fills this map for the playable arc's
 * named entities. Empty here is intentional — graph-walking resolvers cover the
 * long tail; authoring covers the loud entities.
 *
 * Schema: keyed by node id (or `node.properties.showcaseTemplate` id), value is
 * a per-typeId map of `AuthoredSection` overrides. The generator looks up
 * `SHOWCASE_AUTHORING[nodeId]` first, then falls through to the schema's default
 * resolver.
 */

import type { ChipDescriptor, ProseTier } from '../types/detailPage';

/**
 * One authored section override. The engine consumes only the fields relevant
 * to the section's `kind` (e.g., `prose` for ProseSection, `chips` for ChipsSection).
 *
 * Authored prose runs through the same placeholder enrichment pipeline as graph-derived
 * prose, so authors can write `{name}` / `{sphere}` and have them resolved at render time.
 */
export interface AuthoredSection {
  /** Override label. Default = schema's label. */
  label?: string;
  /** Static prose for ProseSection (with placeholders). */
  prose?: string;
  /** Hand-authored chips for ChipsSection. */
  chips?: ChipDescriptor[];
  /** Tier override; default 'notable' for authored sections. */
  tier?: ProseTier;
  /** Force gold-label primary styling on this section even if the schema is tertiary. */
  gold?: boolean;
}

/** Per-entity authoring: a sparse map of typeId → AuthoredSection. */
export interface ShowcaseAuthoring {
  sections: Partial<Record<string /* typeId */, AuthoredSection>>;
}

/**
 * Authored showcase entries. Keys are graph node ids OR `showcaseTemplate` ids
 * referenced from `node.properties.showcaseTemplate`. Empty at v1 — THR-318 fills.
 */
export const SHOWCASE_AUTHORING: Record<string, ShowcaseAuthoring> = {
  /* THR-318 content lands here — e.g.:
   *
   * 'agent-veiren': {
   *   sections: {
   *     what_she_is_to_him: {
   *       prose: 'Captain Veiren was the first to call you by name in the Iron Market.',
   *       tier: 'notable',
   *     },
   *   },
   * },
   */
};

/**
 * Look up authored sections for a node, by node id then by `showcaseTemplate` id.
 * Returns undefined if neither key is present.
 */
export function getShowcaseAuthoring(
  nodeId: string,
  templateId?: string,
): ShowcaseAuthoring | undefined {
  return SHOWCASE_AUTHORING[nodeId] ?? (templateId ? SHOWCASE_AUTHORING[templateId] : undefined);
}
