/**
 * The catalog-backed halves of the content-query resolver (THR-1487).
 *
 * **Why this is separate from `contentQuery.ts`.** Reaching a catalog kind means
 * importing `contentCatalogs.ts`, which statically imports every catalog in the game so
 * it can count them. `src/data/undertaking-objects.ts` is *inside* that graph, and it
 * calls the resolver for its condition pool — so a resolver that imported the catalogs
 * closed an initialisation cycle (`undertaking-objects` → query → catalogs →
 * `undertaking-cells` → `undertaking-objects`) and `UNDERTAKING_CELL_TEMPLATES`
 * evaluated against a half-built registry, taking six test files down with it.
 *
 * The split is the fix and also the honest boundary: `contentQuery.ts` holds the *rule*
 * (what matches, in what order) and the graph carve, and needs nothing but the registry;
 * this module holds the *reach into the library*, and is imported only by things that
 * live outside the data layer — the debug bridge, the CLI, and slice 4's seeding sites.
 *
 * Nothing here re-implements matching. Both views produce `ContentQueryCandidate`s for
 * the one `resolveContentQuery`.
 */
import type { WorldGraph } from './graph';
import type { ContentObjectKindId } from '../data/content-objects';
import { entriesOfKind } from '../data/contentCatalogs';
import { effectiveTags, type ContentCatalogEntry } from '../data/contentEntryTags';
import type { RarityTier } from '../types/rarity';
import {
  graphContentCatalogs,
  isGraphBackedKind,
  type ContentCatalogs,
  type ContentQueryCandidate,
} from './contentQuery';

function readTier(value: unknown): RarityTier | null {
  return typeof value === 'number' && value >= 1 && value <= 4
    ? (Math.round(value) as RarityTier)
    : null;
}

/**
 * A catalog literal as a candidate.
 *
 * Reads `subcategory` and `tier` from either entry shape, because the corpus writes both:
 * an item is a `GraphNode` literal with a property bag, a companion is a flat template.
 */
function candidateFromEntry(
  kind: ContentObjectKindId,
  entry: ContentCatalogEntry,
): ContentQueryCandidate {
  const bag = (entry.properties ?? entry) as Record<string, unknown>;
  const flat = entry as unknown as Record<string, unknown>;
  const cls = bag.subcategory ?? flat.subcategory;
  return {
    kind,
    id: entry.id,
    cls: typeof cls === 'string' && cls.length > 0 ? cls : null,
    tier: readTier(bag.tier ?? flat.tier),
    tags: effectiveTags(kind, entry),
  };
}

function memoise(
  scan: (kind: ContentObjectKindId) => readonly ContentQueryCandidate[],
): ContentCatalogs {
  const memo = new Map<ContentObjectKindId, readonly ContentQueryCandidate[]>();
  return {
    candidates(kind) {
      const cached = memo.get(kind);
      if (cached) return cached;
      const built = scan(kind);
      memo.set(kind, built);
      return built;
    },
  };
}

/**
 * The authoring-time view: catalog literals only, no world.
 *
 * Same candidates on every seed, at every tick — which is what a script or a generator
 * wants. It differs from the live view exactly where a world differs from the library it
 * was seeded with (a world holds instantiated prizes the catalogs never shipped), and
 * that asymmetry is why the *gate* does not use this one: `validateContentQueries` asks
 * over the nodes the world seeds, because a recipe that resolves only against
 * `TREASURE_MAPS` — in the registry, never seeded — would read live and draw nothing.
 */
export function staticContentCatalogs(): ContentCatalogs {
  return memoise(kind => entriesOfKind(kind).map(entry => candidateFromEntry(kind, entry)));
}

/**
 * The complete session view: the world for what the world holds, the library for the
 * rest.
 *
 * What `window.__DEBUG.queryContent` and the CLI's `query` read, and what a caller
 * outside the data layer should reach for by default — it is the only view that can
 * answer a question about an encounter template *and* a question about a prize in one
 * shape.
 *
 * **Build one per call; do not cache it on `SimulationRuntime`.** THR-1481's plan asked
 * for a session-owned instance, and the rule behind that ask — *engine caches are owned
 * per session, never at module scope* — is satisfied better by building per call, which
 * owns nothing at all. Two things settled it. First, a session cache would have to
 * invalidate on `structuralCacheVersion`, which bumps nearly every tick, so it would
 * rebuild almost every time it was read and buy nothing. Second, `SimulationRuntime` is
 * reachable from `src/data/undertaking-objects.ts`, so importing this module there closes
 * the same initialisation cycle described in this file's header. The view is lazy per
 * kind: constructing it is free, and the scan is paid only by the kind you ask for.
 */
export function sessionContentCatalogs(graph: WorldGraph): ContentCatalogs {
  const world = graphContentCatalogs(graph);
  const library = staticContentCatalogs();
  return memoise(kind => (isGraphBackedKind(kind) ? world : library).candidates(kind));
}
