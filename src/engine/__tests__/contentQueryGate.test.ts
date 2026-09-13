/**
 * The content-query gate, now simply fatal (THR-1487, emptied by THR-1496).
 *
 * Three things are pinned here:
 *
 * 1. **Coverage.** The sweep walks both routes a `RewardPoolRecipe` can be authored on.
 *    Measured when this file was written: 1 recipe on the `reward_draw` effect route,
 *    481 on the step route — so the pre-THR-1487 gate checked one recipe in 482 and
 *    reported the corpus clean. The assertion below is on the *shape* (both routes
 *    present, the step route dominant), not on the counts, which rot.
 *
 * 2. **No recipe resolves empty, with no forgiveness left.** THR-1487 shipped a
 *    `CONTENT_QUERY_RETROFIT_PENDING` ratchet because widening the sweep surfaced
 *    sixteen legacy rows that promised a prize and drew nothing. THR-1496 repaired all
 *    sixteen, so the list reached zero and — as its own header promised — it and the
 *    `grandfathered` report arm were deleted rather than left as an empty allowance.
 *
 * 3. **Every `categoryWeights` key is a real `AttachmentCategory`** — the second defect
 *    shape THR-1496 found, and the reason this arm exists. A key that is not a category
 *    (`mastery`, `tomes_scrolls` — the latter a possession *subcategory*) contributes no
 *    candidates and no weight, so the recipe quietly hands out less than it declares.
 *    The empty-pool gate cannot see it whenever the recipe's *other* categories resolve,
 *    which is how five of the nine shipped sites stayed invisible; `tsc` did flag all
 *    nine as TS2353, but inside a ~2870-error red baseline (THR-489) that is not a
 *    signal anyone reads. So it is asserted here, where it fails alone and by name.
 */
import { describe, it, expect } from 'vitest';
import {
  UNIFIED_ACTION_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
} from '../../data/unified-action-templates';
import {
  validateContentQueries,
  validateRewardDrawPools,
  allTemplateRewardRecipes,
  rewardRecipeHasCandidates,
  recipeKey,
} from '../nudgeGrantLiveness';
import { ATTACHMENT_CATEGORIES } from '../../types/attachments';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

const ALL: readonly UnifiedActionTemplate[] = [
  ...UNIFIED_ACTION_TEMPLATES,
  ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
];

describe('content-query gate — coverage (THR-1487)', () => {
  it('walks both routes, and the step route is the one that carries the corpus', () => {
    let effectRoute = 0;
    let stepRoute = 0;
    for (const template of ALL) {
      for (const { site } of allTemplateRewardRecipes(template)) {
        if (site.includes('Metadata.rewardPool')) stepRoute++;
        else effectRoute++;
      }
    }
    expect(stepRoute).toBeGreaterThan(100);
    expect(effectRoute).toBeGreaterThanOrEqual(1);
    // The finding this gate exists for: the step route is not a minor second path.
    expect(stepRoute).toBeGreaterThan(effectRoute);
  });

  it('the deprecated alias is the same sweep', () => {
    expect(validateRewardDrawPools).toBe(validateContentQueries);
  });
});

describe('content-query gate — the corpus is clean', () => {
  const report = validateContentQueries(ALL);

  it('checks a non-trivial number of recipes (the sweep is not vacuous)', () => {
    expect(report.checkedRecipes).toBeGreaterThan(100);
  });

  it('no recipe resolves empty', () => {
    const lines = report.empty.map(
      e => `${recipeKey(e.templateId, e.site)} [${e.categoryWeights.join('/')}] tags=${e.tagFilters.join(' ')}`,
    );
    expect(lines).toEqual([]);
  });
});

describe('the gate is fatal for every empty recipe (THR-1496)', () => {
  it('an empty recipe is reported as fatal, and nothing forgives it', () => {
    // Falsification: a template whose recipe cannot resolve.
    const rotted = {
      id: 'encounter.thr1487.fabricated_rot',
      steps: [{
        id: 'step1',
        successMetadata: {
          rewardPool: { categoryWeights: { possession: 1 }, tagFilters: ['#no-entry-carries-this-thr1487'] },
        },
      }],
    } as unknown as UnifiedActionTemplate;

    const fabricated = validateContentQueries([rotted]);
    expect(fabricated.empty).toHaveLength(1);
    expect(Object.keys(fabricated)).not.toContain('grandfathered');
    // And the underlying predicate agrees, so the fatal verdict is not a bookkeeping bug.
    expect(rewardRecipeHasCandidates({
      categoryWeights: { possession: 1 },
      tagFilters: ['#no-entry-carries-this-thr1487'],
    })).toBe(false);
  });

  it('a resolvable recipe on the same fabricated shape is not reported at all', () => {
    // The controlled arm: same template shape, a filter the corpus does carry. Without
    // this, the assertion above could be passing because the walker reports everything.
    const healthy = {
      id: 'encounter.thr1487.fabricated_ok',
      steps: [{
        id: 'step1',
        successMetadata: {
          rewardPool: { categoryWeights: { possession: 1 }, tagFilters: ['#weapon'] },
        },
      }],
    } as unknown as UnifiedActionTemplate;

    const fabricated = validateContentQueries([healthy]);
    expect(fabricated.checkedRecipes).toBe(1);
    expect(fabricated.empty).toEqual([]);

  });
});

describe('every categoryWeights key is a real AttachmentCategory (THR-1496)', () => {
  const VALID: ReadonlySet<string> = new Set<string>(ATTACHMENT_CATEGORIES);

  /** `templateId @ site :: badKey,badKey` for every shipped recipe naming a non-category. */
  function invalidKeySites(templates: readonly UnifiedActionTemplate[]): string[] {
    const out = new Set<string>();
    for (const template of templates) {
      for (const { recipe, site } of allTemplateRewardRecipes(template)) {
        const bad = Object.keys(recipe.categoryWeights).filter(k => !VALID.has(k));
        if (bad.length > 0) out.add(`${recipeKey(template.id, site)} :: ${bad.join(',')}`);
      }
    }
    return [...out].sort();
  }

  it('the shipped corpus names no key that is not a category', () => {
    // Measured at THR-1496: nine sites across two spellings — `mastery` (tavern.brawl,
    // tavern.drinking_contest, tavern.the_challenge ×4) and `tomes_scrolls`
    // (enc.letters_of_introduction ×3). Four were visible to the empty-pool gate; the
    // other five were not, because their remaining categories resolved.
    expect(invalidKeySites(ALL)).toEqual([]);
  });

  it('falsification — a fabricated bad key IS reported', () => {
    // The controlled arm. Without it, the assertion above passes just as happily when
    // the sweep walks nothing at all (the vacuous-probe failure this repo keeps hitting).
    const bad = {
      id: 'encounter.thr1496.fabricated_bad_key',
      steps: [{
        id: 'step1',
        successMetadata: {
          rewardPool: { categoryWeights: { possession: 1, tomes_scrolls: 1 } },
        },
      }],
    } as unknown as UnifiedActionTemplate;

    expect(invalidKeySites([bad])).toEqual([
      'encounter.thr1496.fabricated_bad_key @ step 0.successMetadata.rewardPool :: tomes_scrolls',
    ]);
  });

  it('the sweep that produced the green verdict is not vacuous', () => {
    let recipes = 0;
    for (const template of ALL) recipes += allTemplateRewardRecipes(template).length;
    expect(recipes).toBeGreaterThan(100);
  });
});
