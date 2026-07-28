/**
 * Encounter image resolver — THR-777 (Nudge Model WS4).
 *
 * The lookup half of the image library. Implements the resolve chain the WS1
 * authoring spec and the WS2 shell both already document:
 *
 *   specific art  →  exact tag  →  tag query  →  category generic  →  null
 *
 * A `null` return is the contract's success case for "no art": the caller drops
 * to `EntityVisual`'s gradient+glyph tile, which is why missing art can never
 * block a render (NFP #4, and the plan's fail-soft row).
 *
 * **Determinism (NFP #3).** No randomness. Ties in the tag query break on `id`
 * ascending, so the same query returns the same image for the same manifest —
 * declaration order in the library is never load-bearing.
 *
 * **Performance (NFP #7).** Exact-tag lookups go through a module-level `Map`
 * built once from the frozen manifest. This is a static data structure, not
 * per-session state, so the "engine caches must be session-owned" rule does not
 * apply — there is nothing here a playthrough can invalidate. The tag query is a
 * linear scan over a manifest measured in tens of rows, at modal-open frequency.
 */

import {
  ENCOUNTER_IMAGE_CATEGORY_GENERIC,
  ENCOUNTER_IMAGE_LIBRARY,
  IMAGE_MATCH_MIN_SCORE,
  IMAGE_MATCH_WEIGHT_CONCEPT,
  IMAGE_MATCH_WEIGHT_MOOD,
  IMAGE_MATCH_WEIGHT_PLACE,
  IMAGE_MATCH_WEIGHT_REACH,
  IMAGE_MATCH_WEIGHT_SPHERE,
  type EncounterImageEntry,
  type EncounterImageKind,
  type EncounterImageMood,
  type EncounterImagePlace,
} from './encounter-image-library';
import type { SphereName } from '../types';
import type { ReachDomain } from '../types/traits';
import type { StepOutcome } from '../types/unifiedAction';

/** Exact-tag index. Built once; the manifest is static. */
const BY_ID: ReadonlyMap<string, EncounterImageEntry> = new Map(
  ENCOUNTER_IMAGE_LIBRARY.map((entry) => [entry.id, entry]),
);

export interface EncounterImageQuery {
  /**
   * An authored tag (`StepNudge.imageTag`, a scene tag). Tried as an exact hit
   * first — this is how encounter-specific art is reached, since specific rows
   * are excluded from the tag query.
   */
  readonly tag?: string;
  /** Art authored directly on the entity. Wins over everything. */
  readonly specificUrl?: string | null;
  readonly kind?: EncounterImageKind;
  readonly concepts?: readonly string[];
  readonly sphere?: SphereName;
  readonly reach?: ReachDomain;
  readonly place?: EncounterImagePlace;
  readonly mood?: EncounterImageMood;
  /** Fate lookups: restrict to rows serving this outcome band. */
  readonly band?: StepOutcome;
}

/** Which rung of the chain produced the result — surfaced for inspectability. */
export type EncounterImageSource =
  | 'specific'
  | 'exact_tag'
  | 'tag_query'
  | 'category_generic'
  | 'none';

export interface ResolvedEncounterImage {
  /** `null` ⇒ the caller falls back to EntityVisual. Never a broken path. */
  readonly path: string | null;
  readonly source: EncounterImageSource;
  /** The manifest row, when one was involved. Absent for `specific`/`none`. */
  readonly entry?: EncounterImageEntry;
}

const NOT_FOUND: ResolvedEncounterImage = { path: null, source: 'none' };

/**
 * Score one candidate against a query. Returns `-1` for a hard mismatch (wrong
 * kind, or a fate row that does not serve the asked-for band), which excludes
 * the row regardless of how well the soft axes agree.
 */
function scoreEntry(entry: EncounterImageEntry, query: EncounterImageQuery): number {
  if (query.kind && entry.kind !== query.kind) return -1;
  if (query.band && entry.bands && !entry.bands.includes(query.band)) return -1;

  let score = 0;

  if (query.concepts?.length) {
    for (const concept of query.concepts) {
      if (entry.concepts.includes(concept)) score += IMAGE_MATCH_WEIGHT_CONCEPT;
    }
  }
  if (query.sphere && entry.sphere === query.sphere) score += IMAGE_MATCH_WEIGHT_SPHERE;
  if (query.reach && entry.reach === query.reach) score += IMAGE_MATCH_WEIGHT_REACH;
  if (query.place && entry.places?.includes(query.place)) score += IMAGE_MATCH_WEIGHT_PLACE;
  if (query.mood && entry.mood === query.mood) score += IMAGE_MATCH_WEIGHT_MOOD;

  return score;
}

/**
 * Resolve art for an encounter surface.
 *
 * Fail-soft by construction: every rung either yields a path that the
 * `check:image-library` gate has proven exists, or falls to the next rung. The
 * terminal value is `null`, never a guess.
 */
export function resolveEncounterImage(
  query: EncounterImageQuery,
): ResolvedEncounterImage {
  // 1. Specific art authored on the entity.
  if (query.specificUrl) {
    return { path: query.specificUrl, source: 'specific' };
  }

  // 2. Exact tag. The only rung that can reach encounter-specific rows.
  if (query.tag) {
    const hit = BY_ID.get(query.tag);
    if (hit) return { path: hit.path, source: 'exact_tag', entry: hit };
  }

  // 3. Tag query over the generic pool. Specific rows (`genericity === null`)
  //    are excluded — an image made for one encounter must not be dealt out to
  //    an unrelated one just because it shares a concept word.
  let best: EncounterImageEntry | undefined;
  let bestScore = 0;
  for (const entry of ENCOUNTER_IMAGE_LIBRARY) {
    if (entry.genericity === null) continue;
    const score = scoreEntry(entry, query);
    if (score < IMAGE_MATCH_MIN_SCORE) continue;
    // Ties break on id ascending — deterministic across manifest reorderings.
    if (score > bestScore || (score === bestScore && best && entry.id < best.id)) {
      best = entry;
      bestScore = score;
    }
  }
  if (best) return { path: best.path, source: 'tag_query', entry: best };

  // 4. Category generic for the asked-for kind.
  if (query.kind) {
    const genericId = ENCOUNTER_IMAGE_CATEGORY_GENERIC[query.kind];
    const generic = genericId ? BY_ID.get(genericId) : undefined;
    if (generic) {
      return { path: generic.path, source: 'category_generic', entry: generic };
    }
  }

  // 5. Nothing. Caller renders the EntityVisual fallback tile.
  return NOT_FOUND;
}

/** Convenience wrapper for the common "just give me a path or nothing" call. */
export function resolveEncounterImagePath(
  query: EncounterImageQuery,
): string | null {
  return resolveEncounterImage(query).path;
}

/** Look a manifest row up by tag. Exposed for the designer view and tests. */
export function getEncounterImageEntry(
  tag: string,
): EncounterImageEntry | undefined {
  return BY_ID.get(tag);
}
