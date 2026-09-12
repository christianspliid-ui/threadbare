/**
 * The content-query gate, and the ratchet that lets it be fatal (THR-1487).
 *
 * Two things are pinned here:
 *
 * 1. **Coverage.** The sweep walks both routes a `RewardPoolRecipe` can be authored on.
 *    Measured when this file was written: 1 recipe on the `reward_draw` effect route,
 *    481 on the step route — so the pre-THR-1487 gate checked one recipe in 482 and
 *    reported the corpus clean. The assertion below is on the *shape* (both routes
 *    present, the step route dominant), not on the counts, which rot.
 *
 * 2. **The ratchet fails both ways** — the `undertakingContract.test.ts` rule. A listed
 *    entry that now resolves is stale and must be deleted; an unlisted entry that
 *    resolves empty is new rot and must be fixed or deliberately listed. A grandfather
 *    list checked in only one direction is a way to *add* rot quietly.
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
import { CONTENT_QUERY_RETROFIT_PENDING } from '../../data/content-eval/contentQueryRetrofitPending';
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

describe('content-query gate — the corpus is clean outside the ratchet', () => {
  const report = validateContentQueries(ALL);

  it('checks a non-trivial number of recipes (the sweep is not vacuous)', () => {
    expect(report.checkedRecipes).toBeGreaterThan(100);
  });

  it('no recipe resolves empty except the ones deliberately grandfathered', () => {
    const lines = report.empty.map(
      e => `${recipeKey(e.templateId, e.site)} [${e.categoryWeights.join('/')}] tags=${e.tagFilters.join(' ')}`,
    );
    expect(lines).toEqual([]);
  });
});

describe('the ratchet fails in both directions', () => {
  const report = validateContentQueries(ALL);

  it('every listed entry still resolves empty — a stale line must be deleted', () => {
    const stillEmpty = new Set(report.grandfathered.map(e => recipeKey(e.templateId, e.site)));
    const stale = CONTENT_QUERY_RETROFIT_PENDING.filter(key => !stillEmpty.has(key));
    expect(stale).toEqual([]);
  });

  it('the list is exactly the empty set, with nothing left over', () => {
    const listed = [...CONTENT_QUERY_RETROFIT_PENDING].sort();
    const actual = [...new Set(report.grandfathered.map(e => recipeKey(e.templateId, e.site)))].sort();
    expect(actual).toEqual(listed);
  });

  it('an unlisted empty recipe is reported as fatal, not forgiven', () => {
    // Falsification: a template the list does not name, whose recipe cannot resolve.
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
    expect(fabricated.grandfathered).toHaveLength(0);
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
    expect(fabricated.grandfathered).toEqual([]);
  });
});
