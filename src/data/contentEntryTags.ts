/**
 * How to read the tags off one piece of content (THR-1486 rules, THR-1487 module).
 *
 * **Why this is its own file and not part of `contentCatalogs.ts`.** These three
 * functions need only the *registry* — `CONTENT_OBJECT_KINDS`, for the `projections`
 * column — while `contentCatalogs.ts` statically imports every catalog in the game so it
 * can count them. Co-locating them meant that anything wanting to read an entry's tags
 * also loaded thirty data modules, and `src/data/undertaking-objects.ts` is one of those
 * modules: the content query's condition pool closed a cycle
 * (`undertaking-objects` → query → catalogs → `undertaking-cells` → `undertaking-objects`)
 * and `UNDERTAKING_CELL_TEMPLATES` evaluated against a half-initialised registry.
 *
 * Splitting the readers out is the fix, and it is the right shape anyway: reading an
 * entry's tags is a property of the *entry and its kind*, and has nothing to do with how
 * many entries exist. `contentCatalogs.ts` re-exports all three, so every existing caller
 * is unaffected.
 */
import { CONTENT_OBJECT_KINDS, type ContentObjectKindId } from './content-objects';

/**
 * The fields every catalog entry shares. `id` is the only one guaranteed; `tags` and
 * `properties.tags` are the two shapes the corpus actually writes tags in — a template
 * type carries them at the top level, a `GraphNode` literal carries them in its property
 * bag — and both are optional because three kinds carry none at all (slice 2, THR-1486).
 *
 * Read them through {@link authoredTags}, never directly: an entry may legally use
 * either shape and a caller that picks one silently halves the corpus.
 */
export interface ContentCatalogEntry {
  readonly id: string;
  /** Template-shaped entries (`ArtifactTemplate`, `CompanionTemplate`, …). */
  readonly tags?: readonly string[];
  /** `GraphNode`-shaped entries (items, conditions, powers). */
  readonly properties?: {
    readonly tags?: readonly string[];
    readonly [key: string]: unknown;
  };
}

/**
 * The tags an author wrote on the entry, from whichever of the two shapes it uses.
 * De-duplicated, order preserved. Never projected — see {@link effectiveTags}.
 */
export function authoredTags(entry: ContentCatalogEntry): readonly string[] {
  const out: string[] = [];
  for (const t of entry.tags ?? []) if (!out.includes(t)) out.push(t);
  for (const t of entry.properties?.tags ?? []) if (!out.includes(t)) out.push(t);
  return out;
}

/**
 * The tags derived from an entry's typed fields, per the kind's `projections` column —
 * `reach: 'iron'` yields `#iron`, `sphereAffinity: 'entropy'` yields `#entropy`.
 *
 * **Projection beats authoring** (THR-1481): where a typed field exists the tag is never
 * double-authored, and `contentTags.test.ts` fails an authored tag on a projected axis
 * that contradicts the field. Only the fields the registry names are read, so a kind
 * with an empty `projections` column projects nothing — which is the honest answer for
 * items (no entry carries `sphereAffinity`) and omens (the field is nested and
 * conditional), both measured in slice 1 and recorded on those rows.
 */
export function projectedTags(kindId: ContentObjectKindId, entry: ContentCatalogEntry): readonly string[] {
  const kind = CONTENT_OBJECT_KINDS.find(k => k.id === kindId);
  if (!kind) return [];
  const bag = entry.properties ?? (entry as unknown as Record<string, unknown>);
  const out: string[] = [];
  for (const field of Object.values(kind.projections)) {
    if (!field) continue;
    const value = (bag as Record<string, unknown>)[field] ?? (entry as unknown as Record<string, unknown>)[field];
    if (typeof value !== 'string' || value.length === 0) continue;
    const tag = `#${value}`;
    if (!out.includes(tag)) out.push(tag);
  }
  return out;
}

/** `authored ∪ projected` — what a query actually matches against. */
export function effectiveTags(kindId: ContentObjectKindId, entry: ContentCatalogEntry): readonly string[] {
  const out = [...authoredTags(entry)];
  for (const t of projectedTags(kindId, entry)) if (!out.includes(t)) out.push(t);
  return out;
}
