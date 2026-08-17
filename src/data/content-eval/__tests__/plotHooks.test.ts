/**
 * The Plot-Hook Draw — catalog health and draw behavior. THR-1147.
 *
 * Two of these tests measure rather than assert a shape, because the two things
 * most likely to be silently dead here are *distributional*: a reach affinity
 * that does not actually shift what gets drawn, and a reuse damping that decays
 * a number nothing reads. Both would pass every structural check while the table
 * behaved like a uniform shuffle — which is the whole failure this ticket exists
 * to prevent.
 *
 * Thresholds below are written as literals rather than imported from the module,
 * deliberately: a test that computes its expectation from the same constant it is
 * checking passes for any value of that constant, which is a tautology wearing a
 * threshold's clothes.
 */

import { describe, expect, it } from 'vitest';

import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { REACH_DOMAINS, type ReachDomain } from '../../../types/traits';
import {
  PLOT_HOOKS,
  PLOT_HOOK_DRAW_COUNT,
  PLOT_HOOK_THEMES,
  drawPlotHooks,
  plotHookById,
  plotHookCatalogViolations,
  plotHookWeight,
} from '../plotHooks';

/** Seeds used for the distribution measurements — arbitrary, fixed, plentiful. */
const SAMPLE_SEEDS = Array.from({ length: 400 }, (_, i) => `brief-sample-${i}`);

describe('the plot-hook catalog', () => {
  it('is populated — every other test here is vacuous on an empty table', () => {
    expect(PLOT_HOOKS.length).toBeGreaterThan(0);
  });

  it('carries at least the 40 hooks the ticket requires', () => {
    expect(PLOT_HOOKS.length).toBeGreaterThanOrEqual(40);
  });

  it('reports no health violations', () => {
    expect(plotHookCatalogViolations()).toEqual([]);
  });

  it('has no duplicate ids', () => {
    const ids = PLOT_HOOKS.map(hook => hook.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tags every hook and sources every hook', () => {
    for (const hook of PLOT_HOOKS) {
      expect(hook.hook.trim(), `${hook.id} hook line`).not.toBe('');
      expect(hook.source.trim(), `${hook.id} source`).not.toBe('');
      expect(hook.themes.length, `${hook.id} themes`).toBeGreaterThan(0);
      for (const theme of hook.themes) {
        expect(PLOT_HOOK_THEMES, `${hook.id} theme '${theme}'`).toContain(theme);
      }
    }
  });

  it('names only real reaches in its affinities', () => {
    for (const hook of PLOT_HOOKS) {
      for (const reach of hook.reaches) {
        expect(REACH_DOMAINS, `${hook.id} reach '${reach}'`).toContain(reach);
      }
    }
  });

  /**
   * The THR-844 rot guard. A `usedBy` naming a template that does not exist
   * damps a hook forever on the strength of an encounter nobody can open — the
   * exact "filter matching zero templates" class, one level down.
   */
  it('back-references only templates that exist', () => {
    const liveIds = new Set(UNIFIED_ACTION_TEMPLATES.map(template => template.id));
    const stamped = PLOT_HOOKS.flatMap(hook =>
      hook.usedBy.map(templateId => ({ hookId: hook.id, templateId })),
    );

    // Non-vacuous: if nothing is stamped, the loop below proves nothing.
    expect(stamped.length).toBeGreaterThan(0);

    for (const { hookId, templateId } of stamped) {
      expect(liveIds.has(templateId), `${hookId} → '${templateId}'`).toBe(true);
    }
  });

  it('preserves the four recoverable Hook #NNN numbers', () => {
    const numbered = PLOT_HOOKS.filter(hook => hook.catalogNumber !== undefined);
    expect(numbered.map(hook => hook.catalogNumber).sort()).toEqual([204, 205, 206, 207]);
  });

  it('resolves a known id and misses an unknown one', () => {
    expect(plotHookById('hook.unsafe_crossing')?.catalogNumber).toBe(205);
    expect(plotHookById('hook.does.not.exist')).toBeUndefined();
  });
});

describe('the weight floor', () => {
  /**
   * The same design law the consequence matrix is pinned to: any hook can
   * surface in any reach. A zero weight is invisible to `drawFromTable`, so a
   * hook that fell to zero in some reach would be undrawable there and nothing
   * else would ever say so.
   */
  it('keeps every hook eligible in every reach', () => {
    for (const hook of PLOT_HOOKS) {
      for (const reach of REACH_DOMAINS) {
        expect(plotHookWeight(hook, reach), `${hook.id} in ${reach}`).toBeGreaterThan(0);
      }
    }
  });

  it('weights an affinity reach above an off-reach one for the same hook', () => {
    const withAffinity = PLOT_HOOKS.find(
      hook => hook.reaches.length > 0 && hook.reaches.length < REACH_DOMAINS.length,
    );
    expect(withAffinity).toBeDefined();

    const on = withAffinity!.reaches[0];
    const off = REACH_DOMAINS.find(reach => !withAffinity!.reaches.includes(reach))!;
    expect(plotHookWeight(withAffinity!, on)).toBeGreaterThan(
      plotHookWeight(withAffinity!, off),
    );
  });

  it('damps a used hook below an unused one of the same affinity shape', () => {
    const used = PLOT_HOOKS.find(hook => hook.usedBy.length > 0);
    expect(used).toBeDefined();

    const reach = used!.reaches[0];
    const unusedSameShape = PLOT_HOOKS.find(
      hook => hook.usedBy.length === 0 && hook.reaches.includes(reach),
    );
    expect(unusedSameShape).toBeDefined();

    expect(plotHookWeight(used!, reach)).toBeLessThan(
      plotHookWeight(unusedSameShape!, reach),
    );
  });
});

describe('drawing', () => {
  it('is deterministic for a brief seed and reach', () => {
    const first = drawPlotHooks({ briefSeed: 'retrofit-batch-2-ward', reach: 'veil' });
    const second = drawPlotHooks({ briefSeed: 'retrofit-batch-2-ward', reach: 'veil' });
    expect(second.map(hook => hook.id)).toEqual(first.map(hook => hook.id));
  });

  it('rolls a different hand for a different brief', () => {
    // Not a guarantee for any *particular* pair, so measured across many: a
    // seed that did not reach the draw would make every brief identical.
    const hands = new Set(
      SAMPLE_SEEDS.slice(0, 50).map(seed =>
        drawPlotHooks({ briefSeed: seed, reach: 'iron' })
          .map(hook => hook.id)
          .join('|'),
      ),
    );
    expect(hands.size).toBeGreaterThan(10);
  });

  it('offers PLOT_HOOK_DRAW_COUNT hooks by default', () => {
    const rolled = drawPlotHooks({ briefSeed: 'default-count', reach: 'heart' });
    expect(rolled).toHaveLength(PLOT_HOOK_DRAW_COUNT);
  });

  it('draws without replacement', () => {
    for (const seed of SAMPLE_SEEDS.slice(0, 100)) {
      const rolled = drawPlotHooks({ briefSeed: seed, reach: 'star', count: 5 });
      expect(new Set(rolled.map(hook => hook.id)).size).toBe(rolled.length);
    }
  });

  it('returns everything rather than throwing when asked for more than it has', () => {
    const rolled = drawPlotHooks({
      briefSeed: 'greedy',
      reach: 'gold',
      count: PLOT_HOOKS.length + 25,
    });
    expect(rolled).toHaveLength(PLOT_HOOKS.length);
  });

  it('returns nothing for a non-positive count', () => {
    expect(drawPlotHooks({ briefSeed: 'zero', reach: 'gold', count: 0 })).toEqual([]);
  });
});

/**
 * The measurements. These are the tests that would catch the table silently
 * behaving like a uniform shuffle.
 */
describe('the draw actually respects the table', () => {
  /** How often each hook is drawn across the sample seeds, for one reach. */
  function drawCounts(reach: ReachDomain): ReadonlyMap<string, number> {
    const counts = new Map<string, number>();
    for (const seed of SAMPLE_SEEDS) {
      for (const hook of drawPlotHooks({ briefSeed: seed, reach })) {
        counts.set(hook.id, (counts.get(hook.id) ?? 0) + 1);
      }
    }
    return counts;
  }

  it('draws a reach-tagged hook far more often in its own reach than off it', () => {
    // `hook.trial_by_combat` is tagged iron/veil and not heart. If affinity
    // were dead, these two counts would be statistically indistinguishable.
    const inIron = drawCounts('iron').get('hook.trial_by_combat') ?? 0;
    const inHeart = drawCounts('heart').get('hook.trial_by_combat') ?? 0;

    expect(inIron).toBeGreaterThan(0);
    // A literal multiple, not a re-derivation of PLOT_HOOK_AFFINITY_WEIGHT:
    // the point is that the effect is large, whatever the constant becomes.
    expect(inIron).toBeGreaterThan(inHeart * 2);
  });

  it('draws a used hook markedly less than a comparable unused one', () => {
    const counts = drawCounts('iron');
    // Both are iron-affinity hooks; only the first carries a recorded use.
    const used = counts.get('hook.unsafe_crossing') ?? 0;
    const unused = counts.get('hook.standing_the_line') ?? 0;

    expect(unused).toBeGreaterThan(0);
    expect(used).toBeLessThan(unused);
  });

  it('reaches deep into the catalog rather than circling a favourite few', () => {
    // The variety guarantee, measured end to end: across 400 briefs in one
    // reach, most of the catalog should have surfaced at least once. A table
    // that concentrated on its top-weighted handful would fail here while
    // passing every structural test above.
    const distinct = drawCounts('star').size;
    expect(distinct).toBeGreaterThan(PLOT_HOOKS.length * 0.75);
  });

  it('gives every reach a different top hook than at least one other reach', () => {
    const tops = REACH_DOMAINS.map(reach => {
      const counts = [...drawCounts(reach).entries()];
      counts.sort((a, b) => b[1] - a[1]);
      return counts[0][0];
    });
    // If reach did not enter the draw at all, all eight would be identical.
    expect(new Set(tops).size).toBeGreaterThan(1);
  });
});
