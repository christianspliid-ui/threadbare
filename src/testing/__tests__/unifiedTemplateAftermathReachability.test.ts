/**
 * THR-979: every decided fork's aftermath must read the step the decision is
 * actually written to — checked across the **entire** template catalog.
 *
 * Catalog-wide on purpose. `assertValidUnifiedTemplate` is wired to exactly
 * three content sets (builders-fellowship, encounter-content, monster-encounter
 * -content), and the templates that carried this bug — the vertical slice — are
 * in none of them. An invariant that only ran where the existing harness already
 * looked would have passed on the day the defect shipped, which is the whole
 * failure mode being closed here.
 */

import { describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { assertDecidedAftermathReachable } from '../contentInvariants';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

describe('decided-fork aftermath reachability (catalog-wide)', () => {
  it('every template with a decided fork points its aftermath at the deciding step', () => {
    for (const template of UNIFIED_ACTION_TEMPLATES) {
      assertDecidedAftermathReachable(template);
    }
  });

  /**
   * The population guard. A sweep over an empty set passes vacuously, so pin the
   * fact that the catalog actually contains templates this invariant inspects —
   * otherwise a refactor that stopped exporting the slice templates would turn
   * the test above green by making it check nothing.
   */
  it('inspects a non-empty population of decided forks', () => {
    const inspected = UNIFIED_ACTION_TEMPLATES.filter((t) => {
      const variants = Object.keys(t.aftermathConfig?.variants ?? {});
      return variants.length > 0
        && t.steps.filter(isActionStepBranch).some((s) => s.decidedBy);
    });

    expect(inspected.length).toBeGreaterThanOrEqual(3);
    expect(inspected.map((t) => t.id)).toEqual(
      expect.arrayContaining([
        'encounter.slice.bargain_at_crossroads',
        'encounter.slice.swindled_family',
        'encounter.slice.swindler_found',
      ]),
    );
  });

  /**
   * Falsification. The invariant must reject the exact shape that shipped — an
   * aftermath naming the fork's own index instead of the index it decides on.
   */
  it('rejects an aftermath keyed to the fork position rather than the deciding step', () => {
    const real = UNIFIED_ACTION_TEMPLATES.find(
      (t) => t.id === 'encounter.slice.bargain_at_crossroads',
    );
    expect(real).toBeDefined();

    const broken: UnifiedActionTemplate = {
      ...real!,
      aftermathConfig: { ...real!.aftermathConfig!, branchOnStep: 1 },
    };

    expect(() => assertDecidedAftermathReachable(broken)).toThrow(
      /names a step no decision is recorded at/,
    );
  });

  it('rejects an aftermath variant the decision can never produce', () => {
    const real = UNIFIED_ACTION_TEMPLATES.find(
      (t) => t.id === 'encounter.slice.bargain_at_crossroads',
    );
    const config = real!.aftermathConfig!;

    const misKeyed: UnifiedActionTemplate = {
      ...real!,
      aftermathConfig: {
        ...config,
        variants: { struck_the_bargain: Object.values(config.variants)[0] },
      },
    };

    expect(() => assertDecidedAftermathReachable(misKeyed)).toThrow(/is unreachable/);
  });
});
