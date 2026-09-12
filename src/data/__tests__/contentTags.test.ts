/**
 * The closed tag vocabulary's contract (THR-1486, slice 2 of THR-1481).
 *
 * Three things are pinned here, in the order they fail most usefully:
 *
 * 1. **Every tag in every registered catalog is seated or ratcheted.** This is the one
 *    that makes the vocabulary closed rather than aspirational.
 * 2. **The ratchet fails both ways** — a listed entry that now passes is stale; an
 *    unlisted entry that fails is new debt. A one-way ratchet is a list that only grows.
 * 3. **Projection beats authoring.** An entry may not author a tag on an axis its kind
 *    projects when the projection says something else; a query would then match it under
 *    two contradictory descriptions and the author would never see which won.
 */
import { describe, it, expect } from 'vitest';

import {
  CONTENT_TAGS,
  CONTENT_TAG_MIN_BEARERS,
  TAG_DESCRIPTION_MAX_CHARS,
  contentTagTooltipId,
  contentTagsOnAxis,
  isContentTag,
  type ContentTagDef,
} from '../content-tags';
import { CONTENT_OBJECT_KINDS } from '../content-objects';
import {
  authoredTags,
  entriesOfKind,
  projectedTags,
  type ContentCatalogEntry,
} from '../contentCatalogs';
import {
  CONTENT_TAG_RETROFIT_PENDING,
  isContentTagRetrofitPending,
} from '../content-eval/contentTagRetrofitPending';
import { REACH_DOMAINS } from '../../types/traits';
import { SPHERE_NAMES } from '../../types/index';
import { resolveTooltip } from '../../engine/tooltipResolver';

/** Every `(kind, entry)` pair in the corpus, computed once. */
const CORPUS: ReadonlyArray<{ kindId: string; entry: ContentCatalogEntry }> = CONTENT_OBJECT_KINDS.flatMap(
  kind => entriesOfKind(kind.id).map(entry => ({ kindId: kind.id, entry })),
);

/** The entries whose authored tags are not all seated — the ratchet's own predicate. */
function entriesWithUnseatedTags(): ReadonlyArray<{ id: string; kindId: string; unseated: string[] }> {
  const out: Array<{ id: string; kindId: string; unseated: string[] }> = [];
  for (const { kindId, entry } of CORPUS) {
    const unseated = authoredTags(entry).filter(t => !isContentTag(t));
    if (unseated.length > 0) out.push({ id: entry.id, kindId, unseated });
  }
  return out;
}

describe('content tag vocabulary — shape', () => {
  it('every tag carries its # and is seated exactly once', () => {
    const bare = CONTENT_TAGS.filter(d => !d.tag.startsWith('#')).map(d => d.tag);
    expect(bare, `tags without a leading #: ${bare.join(', ')}`).toEqual([]);

    const seen = new Map<string, number>();
    for (const d of CONTENT_TAGS) seen.set(d.tag, (seen.get(d.tag) ?? 0) + 1);
    const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([t, n]) => `${t}×${n}`);
    expect(dupes, `duplicate tags: ${dupes.join(', ')}`).toEqual([]);
  });

  it('the reach and sphere axes are derived, not restated', () => {
    expect(contentTagsOnAxis('reach').map(d => d.tag)).toEqual(REACH_DOMAINS.map(r => `#${r}`));
    expect(contentTagsOnAxis('sphere').map(d => d.tag)).toEqual(SPHERE_NAMES.map(s => `#${s}`));
  });

  it('polarity is exactly the two words the condition classifier reads', () => {
    expect(contentTagsOnAxis('polarity').map(d => d.tag).sort()).toEqual(['#negative', '#positive']);
  });

  it('every tag description fits the tooltip ceiling and is plain prose', () => {
    const tooLong = CONTENT_TAGS.filter(d => d.description.length > TAG_DESCRIPTION_MAX_CHARS).map(
      d => `${d.tag}: ${d.description.length} chars`,
    );
    expect(tooLong, `descriptions too long:\n${tooLong.join('\n')}`).toEqual([]);

    const empty = CONTENT_TAGS.filter(d => d.description.trim().length === 0).map(d => d.tag);
    expect(empty, `tags with no description: ${empty.join(', ')}`).toEqual([]);
  });

  it('every tag resolves a tag.* tooltip through the one registry', () => {
    const unresolved: string[] = [];
    for (const d of CONTENT_TAGS) {
      const resolved = resolveTooltip(contentTagTooltipId(d.tag));
      if (!resolved?.label || !resolved.desc) unresolved.push(d.tag);
    }
    expect(unresolved, `tags with no tooltip: ${unresolved.join(', ')}`).toEqual([]);
  });

  it('a tooltip id for a spelling outside the vocabulary resolves to nothing', () => {
    // The falsifying arm of the test above: if `tag.*` resolved anything it was handed,
    // "every tag resolves" would pass on an empty vocabulary.
    expect(resolveTooltip('tag.not_a_seated_spelling')).toBeNull();
  });
});

describe('content tag vocabulary — the corpus is inside it', () => {
  it('the corpus is non-empty and tag-bearing, so the sweeps below are not vacuous', () => {
    expect(CORPUS.length).toBeGreaterThan(500);
    const tagged = CORPUS.filter(({ entry }) => authoredTags(entry).length > 0);
    expect(tagged.length).toBeGreaterThan(200);
  });

  it('every authored tag in every registered catalog is seated or ratcheted', () => {
    const offenders = entriesWithUnseatedTags()
      .filter(e => !isContentTagRetrofitPending(e.id))
      .map(e => `${e.kindId} ${e.id}: ${e.unseated.join(', ')}`);
    expect(
      offenders,
      `entries carrying unseated tags (seat them in content-tags.ts or list them in the ratchet):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('the ratchet is not stale — every listed entry still fails', () => {
    const stillFailing = new Set(entriesWithUnseatedTags().map(e => e.id));
    const stale = CONTENT_TAG_RETROFIT_PENDING.filter(id => !stillFailing.has(id));
    expect(
      stale,
      `ratchet entries that now pass and must be removed:\n${stale.join('\n')}`,
    ).toEqual([]);
  });

  it('the ratchet fails both ways — falsified by perturbation', () => {
    // Falsification arm 1: an entry carrying an unseated tag and NOT listed must fail.
    const perturbed: ContentCatalogEntry = { id: 'test.unlisted_entry', tags: ['#not_a_seated_tag'] };
    expect(authoredTags(perturbed).filter(t => !isContentTag(t))).toEqual(['#not_a_seated_tag']);
    expect(isContentTagRetrofitPending(perturbed.id)).toBe(false);

    // Falsification arm 2: an entry whose tags are all seated but which IS listed is
    // stale — the shape the staleness test above rejects.
    const retrofitted: ContentCatalogEntry = { id: 'test.listed_entry', tags: ['#weapon'] };
    expect(authoredTags(retrofitted).every(t => isContentTag(t))).toBe(true);
    const pretendRatchet = [retrofitted.id];
    const stillFailing = new Set(entriesWithUnseatedTags().map(e => e.id));
    expect(pretendRatchet.filter(id => !stillFailing.has(id))).toEqual([retrofitted.id]);
  });

  it('no authored tag contradicts the projection its kind declares', () => {
    const contradictions: string[] = [];
    for (const kind of CONTENT_OBJECT_KINDS) {
      const projectedAxes = Object.keys(kind.projections) as ContentTagDef['axis'][];
      if (projectedAxes.length === 0) continue;
      for (const entry of entriesOfKind(kind.id)) {
        const projected = projectedTags(kind.id, entry);
        if (projected.length === 0) continue;
        for (const axis of projectedAxes) {
          const axisTags = new Set<string>(contentTagsOnAxis(axis).map(d => d.tag));
          const authoredOnAxis = authoredTags(entry).filter(t => axisTags.has(t));
          const projectedOnAxis = projected.filter(t => axisTags.has(t));
          if (projectedOnAxis.length === 0) continue;
          const wrong = authoredOnAxis.filter(t => !projectedOnAxis.includes(t));
          if (wrong.length > 0) {
            contradictions.push(
              `${kind.id} ${entry.id}: authors ${wrong.join(', ')} on the ${axis} axis, but ${kind.projections[axis]} projects ${projectedOnAxis.join(', ')}`,
            );
          }
        }
      }
    }
    expect(contradictions, `authored tags contradicting a projection:\n${contradictions.join('\n')}`).toEqual([]);
  });
});

describe('content tag vocabulary — the seating rule held', () => {
  it('every seated authored tag has a bearer or is named as reader-only', () => {
    // Derived and polarity axes are seated by the cosmology, not by bearer count.
    const authoredAxisTags = CONTENT_TAGS.filter(d => d.axis === 'form' || d.axis === 'family');
    const bearers = new Map<string, number>();
    for (const { entry } of CORPUS) {
      for (const t of authoredTags(entry)) bearers.set(t, (bearers.get(t) ?? 0) + 1);
    }
    // Reader-only tags — seated on a `tagFilters` query site with no bearer yet. The
    // generated catalog badges these DEAD; the weekly retro deletes them. Named here so
    // the list cannot quietly grow without someone editing this test.
    const READER_ONLY = new Set([
      '#blackmail_evidence',
      '#community',
      '#contraband',
      '#military',
      '#stewardship',
      '#supply',
    ]);
    const orphans = authoredAxisTags
      .filter(d => (bearers.get(d.tag) ?? 0) === 0 && !READER_ONLY.has(d.tag))
      .map(d => d.tag);
    expect(
      orphans,
      `seated tags with no bearer and no declared reader — DEAD on arrival:\n${orphans.join(', ')}`,
    ).toEqual([]);
  });

  it('the seating threshold is a named constant, not a literal in the sweep', () => {
    expect(CONTENT_TAG_MIN_BEARERS).toBeGreaterThan(1);
  });
});
