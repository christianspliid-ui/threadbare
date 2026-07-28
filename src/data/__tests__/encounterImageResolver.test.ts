/**
 * THR-777 (Nudge Model WS4) — image library manifest + resolver contract.
 *
 * These tests pin the resolve chain's *rungs*, not just its outputs: a test that
 * only asserted "returns a path" would pass while the chain silently collapsed
 * to the category generic for everything. `source` is asserted alongside `path`
 * throughout so a regression that changes which rung fired is visible.
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ENCOUNTER_IMAGE_LIBRARY,
  ENCOUNTER_IMAGE_PLAN,
  ENCOUNTER_IMAGE_CATEGORY_GENERIC,
  FATE_REACH_METAPHORS,
  IMAGE_MATCH_MIN_SCORE,
} from '../encounter-image-library';
import {
  resolveEncounterImage,
  resolveEncounterImagePath,
  getEncounterImageEntry,
} from '../encounterImageResolver';
import { REACH_DOMAINS } from '../../types/traits';

describe('encounter image library — manifest integrity', () => {
  it('every library path exists on disk under public/', () => {
    const missing = ENCOUNTER_IMAGE_LIBRARY.filter(
      (entry) => !existsSync(join(process.cwd(), 'public', entry.path.slice(1))),
    ).map((entry) => `${entry.id} -> ${entry.path}`);
    // A row is a promise that the path renders. Listing the offenders (rather
    // than asserting a count) is what makes a failure actionable.
    expect(missing).toEqual([]);
  });

  it('library ids are unique', () => {
    const ids = ENCOUNTER_IMAGE_LIBRARY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no id appears in both the library and the generation plan', () => {
    const libraryIds = new Set(ENCOUNTER_IMAGE_LIBRARY.map((e) => e.id));
    const overlap = ENCOUNTER_IMAGE_PLAN.filter((s) => libraryIds.has(s.id)).map(
      (s) => s.id,
    );
    // Overlap means art shipped but its worklist entry survived — the next
    // batch would regenerate it.
    expect(overlap).toEqual([]);
  });

  it('plan slot ids are unique', () => {
    const ids = ENCOUNTER_IMAGE_PLAN.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every category generic names a real library row', () => {
    for (const [kind, id] of Object.entries(ENCOUNTER_IMAGE_CATEGORY_GENERIC)) {
      expect(getEncounterImageEntry(id!), `${kind} -> ${id}`).toBeDefined();
    }
  });

  it('every row carries a genericity note or an explicit null', () => {
    for (const entry of ENCOUNTER_IMAGE_LIBRARY) {
      if (entry.genericity !== null) {
        expect(entry.genericity.trim().length, entry.id).toBeGreaterThan(0);
      }
    }
  });

  it('fate metaphors cover all eight Reaches', () => {
    // Pinned as a set, not a count — a renamed Reach must fail here rather than
    // sliding through on arity.
    expect(Object.keys(FATE_REACH_METAPHORS).sort()).toEqual(
      [...REACH_DOMAINS].sort(),
    );
  });

  it('plans one fate slot per Reach × outcome band', () => {
    const fate = ENCOUNTER_IMAGE_PLAN.filter((s) => s.kind === 'fate');
    // Six bands, not the ticket's five: the five-valued axis is the forecast,
    // and fate art keys off the resolved outcome ladder.
    expect(fate).toHaveLength(REACH_DOMAINS.length * 6);
    for (const reach of REACH_DOMAINS) {
      expect(fate.filter((s) => s.reach === reach)).toHaveLength(6);
    }
  });

  it('every plan slot carries a non-empty generation brief', () => {
    const briefless = ENCOUNTER_IMAGE_PLAN.filter(
      (s) => !s.brief || s.brief.trim().length === 0,
    ).map((s) => s.id);
    expect(briefless).toEqual([]);
  });
});

describe('resolveEncounterImage — the resolve chain', () => {
  it('specific art wins over every other rung', () => {
    const result = resolveEncounterImage({
      specificUrl: '/concept-art/encounters/road-ambush.jpg',
      tag: 'scene.wilderness.hills',
      kind: 'scene',
    });
    expect(result.source).toBe('specific');
    expect(result.path).toBe('/concept-art/encounters/road-ambush.jpg');
  });

  it('an exact tag hit beats the tag query', () => {
    const result = resolveEncounterImage({ tag: 'encounter.road-ambush' });
    expect(result.source).toBe('exact_tag');
    expect(result.entry?.id).toBe('encounter.road-ambush');
  });

  it('an exact tag reaches encounter-specific art the query cannot', () => {
    // `encounter.*` rows are genericity:null, so they are excluded from the
    // query pool — but naming one directly must still work.
    const byTag = resolveEncounterImage({ tag: 'encounter.the-silent-chamber' });
    expect(byTag.source).toBe('exact_tag');

    const byQuery = resolveEncounterImage({
      concepts: ['silence', 'chamber', 'secret', 'vault'],
      kind: 'scene',
    });
    expect(byQuery.entry?.id).not.toBe('encounter.the-silent-chamber');
  });

  it('a concept match resolves through the tag query', () => {
    const result = resolveEncounterImage({
      concepts: ['swamp'],
      kind: 'scene',
    });
    expect(result.source).toBe('tag_query');
    expect(result.entry?.id).toBe('scene.wilderness.swamp');
  });

  it('a bare sphere/place coincidence does NOT clear the query bar', () => {
    // place(2) alone scores below IMAGE_MATCH_MIN_SCORE(10) — one concept
    // agreement is the entry price. This is the "an image about this" vs "an
    // image that shares a label" line.
    const result = resolveEncounterImage({
      place: 'wilderness',
      kind: 'scene',
    });
    expect(result.source).toBe('category_generic');
    expect(IMAGE_MATCH_MIN_SCORE).toBeGreaterThan(2);
  });

  it('falls to the category generic when nothing matches', () => {
    const result = resolveEncounterImage({
      concepts: ['no-such-concept-anywhere'],
      kind: 'scene',
    });
    expect(result.source).toBe('category_generic');
    expect(result.entry?.id).toBe(ENCOUNTER_IMAGE_CATEGORY_GENERIC.scene);
  });

  it('returns null — never a guess — for a kind with no generic yet', () => {
    // Nudge art is entirely un-generated (batch 2). The contract is that the
    // caller gets null and renders EntityVisual, not a stand-in image.
    const result = resolveEncounterImage({
      tag: 'generic.focus',
      kind: 'nudge',
      sphere: 'mind',
    });
    expect(result.path).toBeNull();
    expect(result.source).toBe('none');
  });

  it('an unknown tag degrades instead of throwing', () => {
    expect(() =>
      resolveEncounterImage({ tag: 'utter.nonsense.tag', kind: 'nudge' }),
    ).not.toThrow();
    expect(resolveEncounterImagePath({ tag: 'utter.nonsense.tag' })).toBeNull();
  });

  it('an empty query returns nothing rather than an arbitrary image', () => {
    expect(resolveEncounterImage({}).source).toBe('none');
  });

  it('is deterministic across repeated calls', () => {
    const query = { concepts: ['wilderness', 'travel'], kind: 'scene' as const };
    const first = resolveEncounterImage(query);
    for (let i = 0; i < 5; i += 1) {
      expect(resolveEncounterImage(query)).toEqual(first);
    }
  });

  it('kind mismatch excludes a row even on a perfect concept match', () => {
    const result = resolveEncounterImage({
      concepts: ['swamp'],
      kind: 'portrait',
    });
    expect(result.entry?.id).not.toBe('scene.wilderness.swamp');
  });
});
