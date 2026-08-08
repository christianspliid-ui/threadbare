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
import { isActionStepBranch, resolveAftermathVariant } from '../../types/unifiedAction';
import type {
  UnifiedActionOutcome,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

/**
 * Every outcome band a resolved action can carry, listed exhaustively.
 *
 * The `Record` keyed on the union is the exhaustiveness guard: adding a member to
 * `UnifiedActionOutcome` without adding it here is a type error, so the sweep
 * below cannot silently stop covering a band (NFP #2).
 */
const ALL_OUTCOMES = Object.keys({
  success: true,
  failure: true,
  contested_won: true,
  contested_lost: true,
  critical_success: true,
  critical_failure: true,
  success_at_cost: true,
} satisfies Record<UnifiedActionOutcome, true>) as readonly UnifiedActionOutcome[];

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

/**
 * THR-1038: no shipped template may reach `resolveAftermathVariant` and throw.
 *
 * Run over the **real** corpus at **every** outcome band, because that is exactly
 * what a fixture-based test cannot do. 15 mercenary templates shipped an
 * `aftermathConfig` that was not a `BranchAwareAftermathConfig` at all — no
 * `fallback`, no `variants`, no `branchOnStep`, and an array of aftermath
 * *effects* sitting in a slot that expects *reactions*. `resolveAftermathVariant`
 * then read `byOutcome` off `undefined` and threw on every resolved action; the
 * tick loop's fail-soft envelope (NFP #4) swallowed it, so nothing was ever red
 * and the authored aftermath on all 15 reached nobody.
 *
 * The type system could not catch it: the literals are assigned to a declared
 * `UnifiedActionTemplate`, so it *is* a compile error — buried inside the red
 * baseline (THR-489) and therefore unreadable. Second instance of that pattern in
 * a week (impediment #489 / THR-992 is the first). A red baseline does not merely
 * defer type errors; it hides live defects under a working-looking annotation.
 * Until that baseline is green, a runtime sweep over the real corpus is the only
 * gate that actually reads this.
 */
describe('aftermath resolution across the real corpus (THR-1038)', () => {
  const withAftermath = UNIFIED_ACTION_TEMPLATES.filter((t) => t.aftermathConfig);

  it('every aftermathConfig carries the fallback its type declares required', () => {
    const missing = withAftermath
      .filter((t) => !t.aftermathConfig!.fallback)
      .map((t) => t.id);

    expect(
      missing,
      `${missing.length} template(s) carry an aftermathConfig with no fallback. `
      + 'Every authored ending on them is unreachable and the resolver has no base '
      + `to return: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('resolves without throwing for every template at every outcome band', () => {
    const threw: string[] = [];

    for (const template of withAftermath) {
      for (const outcome of [...ALL_OUTCOMES, undefined]) {
        try {
          const variant = resolveAftermathVariant(template.aftermathConfig!, undefined, outcome);
          expect(variant, `${template.id} @ ${outcome ?? 'no-outcome'}`).toBeDefined();
          expect(typeof variant.overview).toBe('string');
          expect(Array.isArray(variant.changes)).toBe(true);
        } catch (err) {
          threw.push(`${template.id} @ ${outcome ?? 'no-outcome'}: ${(err as Error).message}`);
        }
      }
    }

    expect(threw, `resolveAftermathVariant threw for:\n${threw.join('\n')}`).toEqual([]);
  });

  /**
   * Population guard. A sweep over an empty set passes vacuously — pin both that
   * the corpus is substantial and that the 15 templates the defect was found on
   * are actually in it, so a refactor that stopped exporting them cannot turn
   * this suite green by making it inspect nothing.
   */
  it('inspects a non-empty population including every repaired mercenary template', () => {
    expect(withAftermath.length).toBeGreaterThan(50);

    // Enumerated, not counted (THR-688 rule A): these are the exact templates the
    // defect was found on. A count would also be satisfied by `mc.army.raise`,
    // which lives in the army content set and was always well-formed.
    const repaired = [
      'mc.quest.patrol', 'mc.quest.guard_caravan', 'mc.quest.collect_bounty',
      'mc.quest.siege_work', 'mc.quest.escort_prisoner',
      'mc.senior.field_command', 'mc.senior.hostile_negotiation', 'mc.senior.extraction_op',
      'mc.elite.war_council', 'mc.elite.siege_contract',
      'mc.social.sparring_ring', 'mc.social.war_stories', 'mc.social.contract_negotiation',
      'mc.join', 'mc.promotion',
    ];

    const present = withAftermath.map((t) => t.id);
    expect(present).toEqual(expect.arrayContaining(repaired));

    // Each one resolves to an ending with prose, not merely to something non-null.
    for (const id of repaired) {
      const template = withAftermath.find((t) => t.id === id)!;
      const variant = resolveAftermathVariant(template.aftermathConfig!, undefined, 'success');
      expect(variant.overview.length, `${id} fallback overview is empty`).toBeGreaterThan(0);
      expect(variant.reactions?.length ?? 0, `${id} has no authored reactions`).toBeGreaterThan(0);
    }
  });

  /**
   * Falsification. A guard that cannot fail is not evidence — reconstruct the
   * exact shape that shipped and confirm the resolver no longer throws on it
   * (fail-soft, NFP #4) *and* that the structural check above would reject it.
   */
  it('fails soft rather than throwing on the malformed shape that shipped', () => {
    const malformed = {
      reactions: [{ kind: 'reputation_tally', domain: 'iron.positive', weight: 0.6 }],
    } as unknown as NonNullable<UnifiedActionTemplate['aftermathConfig']>;

    expect(() => resolveAftermathVariant(malformed, undefined, 'success')).not.toThrow();
    expect(resolveAftermathVariant(malformed, undefined, 'success').overview).toBe('');
    expect(malformed.fallback).toBeUndefined();
  });
});
