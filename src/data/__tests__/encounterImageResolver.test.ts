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
  FATE_BAND_DIRECTION,
  IMAGE_MATCH_MIN_SCORE,
} from '../encounter-image-library';
import {
  resolveEncounterImage,
  resolveEncounterImagePath,
  getEncounterImageEntry,
} from '../encounterImageResolver';
import { REACH_DOMAINS } from '../../types/traits';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import { ENRICHED_DILEMMA_LIBRARY } from '../meeting-dilemma-library';
import {
  isActionStepBranch,
  type ActionStepOrBranch,
  type StepNudge,
} from '../../types/unifiedAction';

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

  it('ships one fate image per Reach × outcome band, with none left planned', () => {
    // Batch 1 shipped the whole fate set, so the contract moved from the plan to
    // the library. Six bands, not the ticket's five: the five-valued axis is the
    // forecast, and fate art keys off the resolved outcome ladder.
    const bands = Object.keys(FATE_BAND_DIRECTION).sort();
    expect(bands).toHaveLength(6);

    // Pinned as an exact set rather than a count — a renamed Reach or band must
    // fail here rather than sliding through on arity.
    const expected = REACH_DOMAINS.flatMap((reach) =>
      bands.map((band) => `fate.${reach}.${band}`),
    ).sort();
    // Non-vacuity floor: without this, an empty REACH_DOMAINS would make both
    // sides [] and the set comparison would pass while asserting nothing.
    expect(expected).toHaveLength(48);
    const shipped = ENCOUNTER_IMAGE_LIBRARY.filter((e) => e.kind === 'fate')
      .map((e) => e.id)
      .sort();
    expect(shipped).toEqual(expected);

    // No fate slot may linger in the worklist, or the next batch regenerates it.
    expect(ENCOUNTER_IMAGE_PLAN.filter((s) => s.kind === 'fate')).toEqual([]);
  });

  it('every fate row declares the single band it serves', () => {
    for (const entry of ENCOUNTER_IMAGE_LIBRARY.filter((e) => e.kind === 'fate')) {
      // `bands` is a list so a taste pass can collapse bands without a schema
      // change; today each image serves exactly the band its id names.
      expect(entry.bands, entry.id).toBeDefined();
      expect(entry.bands, entry.id).toEqual([entry.id.split('.')[2]]);
    }
  });

  it('the generation plan is empty — every planned slot has shipped', () => {
    // Batch 4 (2026-07-28) emptied the worklist. This is asserted explicitly
    // because it is what makes the *next* test vacuous: a filter over an empty
    // array passes by matching nothing. Pinning the population here means that
    // if a future batch adds slots, the brief guard below starts doing real work
    // again and this test is the one that announces the change.
    expect(ENCOUNTER_IMAGE_PLAN.map((s) => s.id)).toEqual([]);
  });

  it('every plan slot carries a non-empty generation brief', () => {
    // Guards future batches. Currently vacuous by construction — see above.
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

  it('a built place resolves to its own art, not to a wilderness plate', () => {
    // What batch 3 bought. Before it, the only registered scene rows were the 12
    // outdoor terrain plates, so every built/social place missed the query bar
    // and fell to the `scene` category generic — serving a hillside for a guild
    // hall interior. Pinned per place so deleting a row is a test failure rather
    // than a silent downgrade to scenery.
    // Every batch-3 row whose concept names its own place. `scene.rebuild` and
    // `scene.aftermath` are the two that do not (both sit at `settlement`) and
    // are covered by the trio test below.
    const builtPlaces = [
      'guild_hall',
      'tavern',
      'market',
      'court',
      'shrine',
      'ruin',
      'siege',
      'road',
      'river',
      'settlement',
      'underground',
      'wilds_camp',
    ] as const;

    for (const place of builtPlaces) {
      const result = resolveEncounterImage({ concepts: [place], kind: 'scene' });
      expect(result.source).toBe('tag_query');
      expect(result.entry?.id).toBe(`scene.${place}`);
      expect(result.entry?.places).toContain(place);
    }
  });

  it('the settlement trio is three states of one place, not three places', () => {
    // `settlement` / `rebuild` / `aftermath` were generated as a coherent unit
    // against a shared architecture vocabulary, and all three carry the same
    // `settlement` place so a query on the place can reach any of them.
    for (const id of ['scene.settlement', 'scene.rebuild', 'scene.aftermath']) {
      const result = resolveEncounterImage({ tag: id });
      expect(result.source).toBe('exact_tag');
      expect(result.entry?.places).toEqual(['settlement']);
    }
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

  it('returns null — never a guess — for a kind with no category generic', () => {
    // `fate` has no category generic by design and never will: the set is
    // complete on ReachDomain x StepOutcome, so a fallback could only ever serve
    // the *wrong band* — a shattered blade for a success. The contract is that
    // the caller gets null and renders EntityVisual, not a stand-in image.
    //
    // This test used to use `nudge`, which was un-generated until batch 2
    // (THR-832) gave it both art and a generic. `fate` is the durable example.
    const result = resolveEncounterImage({
      tag: 'fate.iron.no-such-band',
      kind: 'fate',
      concepts: ['no-such-concept-anywhere'],
    });
    expect(result.path).toBeNull();
    expect(result.source).toBe('none');
  });

  it('a shipped nudge concept resolves by exact tag (batch 2)', () => {
    const result = resolveEncounterImage({
      tag: 'generic.focus',
      kind: 'nudge',
      sphere: 'mind',
    });
    expect(result.source).toBe('exact_tag');
    expect(result.path).toBe('/concept-art/nudge/focus.jpg');
  });

  it('every archetype portrait resolves to its own row, not the traveler generic', () => {
    // What batch 4 bought. Before it, `portrait.traveler` was the only portrait
    // row, so every role query missed the bar and fell to the category generic —
    // serving one hooded traveler for a soldier, a child and a noble alike.
    // The list is the measured resolution set, probed before the assertion was
    // written, rather than the role list copied from the manifest.
    const roles = [
      'soldier',
      'merchant',
      'priest',
      'scholar',
      'labourer',
      'noble',
      'outlaw',
      'healer',
      'crafter',
      'sailor',
      'farmer',
      'guard',
      'beggar',
      'elder',
      'child',
    ];
    const resolved = roles.map((role) => {
      const r = resolveEncounterImage({ concepts: [role], kind: 'portrait' });
      return `${role}: ${r.source} -> ${r.entry?.id}`;
    });
    expect(resolved).toEqual(
      roles.map((role) => `${role}: tag_query -> portrait.${role}`),
    );
  });

  it('an unlisted role falls to the traveler generic, not to a wrong archetype', () => {
    // The genericity guarantee runs both ways: an archetype must win its own
    // query (above) and must NOT be served for a role nobody generated. A
    // near-miss here would put a beggar's rags on a tinker.
    const result = resolveEncounterImage({
      concepts: ['tinker', 'wanderer'],
      kind: 'portrait',
    });
    expect(result.source).toBe('category_generic');
    expect(result.entry?.id).toBe('portrait.traveler');
  });

  it('an unmatched nudge tag falls to the blessing generic, not to null', () => {
    // Batch 2 replaced the honest `null` with a generic that asserts only what
    // every nudge card has in common — that a god helped here.
    const result = resolveEncounterImage({
      concepts: ['no-such-concept-anywhere'],
      kind: 'nudge',
    });
    expect(result.source).toBe('category_generic');
    expect(result.entry?.id).toBe(ENCOUNTER_IMAGE_CATEGORY_GENERIC.nudge);
    expect(result.entry?.id).toBe('generic.blessing');
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

describe('authored imageTags resolve against the manifest (THR-1052)', () => {
  /**
   * The direction `check:image-library` does not guard. That gate proves the
   * library's own rows are honest — every path exists, nothing sits in both
   * tables — but says nothing about whether *authored content* names a row that
   * exists. THR-1052 is what that gap costs: 42 cards across 14 hands named a
   * tag with no row, and because `NudgePhaseShell` passes only `{tag, kind,
   * sphere}`, the tag-query rung (min score 10) could never fire on sphere
   * alone (weight 4). Every one of them landed on `generic.blessing`, so whole
   * hands rendered the same plate — fail-soft by design, and invisible for it.
   *
   * Asserted on `source === 'exact_tag'` rather than on a non-null path, for
   * the reason this file's header already gives: a path assertion passes while
   * the chain silently collapses to the category generic, which is precisely
   * the failure being pinned.
   *
   * `check:encounter --all` covers most of this, but not all of it — see the
   * branch-variant test below for the hole it leaves and how it was measured.
   */
  const nudgesOf = (step: ActionStepOrBranch): readonly StepNudge[] =>
    isActionStepBranch(step)
      ? [...Object.values(step.variants), step.fallback].flatMap((s) => s.nudges ?? [])
      : (step.nudges ?? []);

  const authored = UNIFIED_ACTION_TEMPLATES.flatMap((template) =>
    (template.steps ?? []).flatMap((step) =>
      nudgesOf(step)
        .filter((nudge) => nudge.imageTag)
        .map((nudge) => ({
          where: `${template.id} / ${nudge.id}`,
          tag: nudge.imageTag as string,
        })),
    ),
  );

  it('reaches nudges nested in branch variants', () => {
    // History, kept because it is the second half of a two-part lesson.
    //
    // THR-1052 measured this blindness here first: of 42 dead tags, the gate
    // reported 41 and silently missed `slice.family.sure_marker`, sitting in a
    // branch `fallback` of `encounter.slice.swindled_family` — a template the
    // gate *did* check and pass. The response then was to sweep around the gate
    // from this test rather than to fix the walk, so the gate stayed blind and
    // the same structural defect was re-found from scratch on the factory's
    // first `personality_fork` (THR-1273), that time with three editorial
    // defects riding in the unchecked half.
    //
    // `check:encounter` now walks branch arms itself (`runnableStepSites`), so
    // this is no longer a *substitute* for the gate. It stays as a corpus-wide
    // sweep — it covers surfaces outside `UNIFIED_ACTION_TEMPLATES` too, see the
    // Meet-The-First extension below — and as the regression pin for the walk.
    const branchNested = UNIFIED_ACTION_TEMPLATES.flatMap((template) =>
      (template.steps ?? [])
        .filter(isActionStepBranch)
        .flatMap((step) => [...Object.values(step.variants), step.fallback])
        .flatMap((s) => s.nudges ?? [])
        .filter((nudge) => nudge.imageTag),
    );
    expect(branchNested.length).toBeGreaterThan(0);
    expect(authored.length).toBeGreaterThan(100);
  });

  /**
   * The Meet-The-First corpus, swept by the same assertion (THR-1170).
   *
   * This is an *extension* of the walk above rather than a second guard, because
   * a second guard is what let this recur: THR-1052's sweep walked
   * `UNIFIED_ACTION_TEMPLATES` only, and `meeting-dilemma-library.ts` is not in
   * that collection — so all 424 of its nudges named three tags (`crowd`,
   * `mercy`, `blade`) that had no library row, and the identical defect sat
   * undetected on the game's *opening* beat while the template corpus was clean.
   *
   * `BondBeat`/`FormativeTestBeat` consume `NudgePhaseShell` whole, so these
   * cards resolve through exactly the same `{tag, kind: 'nudge', sphere}` query
   * as the template corpus — which is why one assertion is correct for both.
   */
  const meetingAuthored = ENRICHED_DILEMMA_LIBRARY.flatMap((template) =>
    (template.test?.nudges ?? [])
      .filter((nudge) => nudge.imageTag)
      .map((nudge) => ({
        where: `${template.id} / ${nudge.id}`,
        tag: nudge.imageTag as string,
      })),
  );

  it('walks a non-empty corpus on both sides', () => {
    // Both polarities, pinned as literals. Every assertion below is satisfied by
    // an empty population, so without this the whole sweep is vacuous — and the
    // meeting half is the half that was missing, so its count is the one that
    // matters. Literals rather than a re-derived constant: keying the expectation
    // off the same expression under test would make it a tautology.
    expect(authored.length).toBeGreaterThan(100);
    expect(meetingAuthored.length).toBe(424);
    expect(new Set(meetingAuthored.map((n) => n.tag)).size).toBe(3);
  });

  it('every authored nudge imageTag hits a real library row', () => {
    const dead = [...authored, ...meetingAuthored]
      .filter(({ tag }) => resolveEncounterImage({ tag, kind: 'nudge' }).source !== 'exact_tag')
      .map(({ where, tag }) => `${where} -> ${tag}`);
    // Listing offenders rather than asserting a count keeps a failure
    // actionable, and matches the manifest-integrity tests above.
    expect(dead).toEqual([]);
  });
});
