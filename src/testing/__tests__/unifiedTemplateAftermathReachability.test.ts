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
import {
  assertAftermathVariantsProducible,
  assertDecidedAftermathReachable,
} from '../contentInvariants';
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
 * THR-989: an aftermath variant key nothing can produce is authored content
 * rendered to nobody — checked across the entire catalog, for the same reason
 * the suite above is.
 *
 * The sibling guard asks whether a decided fork points at the right step. This
 * one asks whether *any* writer can emit the key at all, which is the question
 * that went unasked while 30 of the 34 templates carrying aftermath variants sat
 * unreachable behind a click handler that discarded the player's pick.
 */
describe('aftermath variant producibility (catalog-wide, THR-989)', () => {
  it('every aftermath variant key is producible by a fork or an authored card', () => {
    for (const template of UNIFIED_ACTION_TEMPLATES) {
      assertAftermathVariantsProducible(template);
    }
  });

  /**
   * Population guard. A sweep over an empty set passes vacuously — pin that the
   * catalog really does contain templates keyed to `authoredChoices`, which is
   * the path the defect lived on and the one a refactor is most likely to drop.
   */
  it('inspects a non-empty population keyed on authoredChoices', () => {
    const authoredKeyed = UNIFIED_ACTION_TEMPLATES.filter((t) => {
      const cfg = t.aftermathConfig;
      const keys = Object.keys(cfg?.variants ?? {});
      if (!cfg || keys.length === 0) return false;
      const ids = new Set((t.authoredChoices?.[cfg.branchOnStep] ?? []).map((c) => c.id));
      return keys.every((k) => ids.has(k));
    });

    expect(authoredKeyed.length).toBeGreaterThanOrEqual(25);

    // Enumerated, not counted (THR-688 rule A): the three mentorship templates
    // are the set THR-989 was filed against under its literal predicate —
    // aftermath variants, no fork of any kind.
    expect(authoredKeyed.map((t) => t.id)).toEqual(
      expect.arrayContaining([
        'mentorship.graduation',
        'mentorship.the-offer',
        'mentorship.the-falling-out',
      ]),
    );
  });

  /**
   * Falsification. A guard that cannot fail is not evidence — reconstruct the
   * exact shape that shipped (variants keyed to ids no producer emits) and
   * confirm the invariant rejects it.
   */
  it('rejects a variant key no fork and no authored card can emit', () => {
    const real = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'mentorship.the-offer');
    expect(real).toBeDefined();

    const orphaned: UnifiedActionTemplate = {
      ...real!,
      authoredChoices: undefined,
    };

    expect(() => assertAftermathVariantsProducible(orphaned)).toThrow(
      /can be produced by nothing/,
    );
  });

  /** And passes the same template untouched, so the rejection is about the defect. */
  it('accepts the same template with its authored hand intact', () => {
    const real = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'mentorship.the-offer');
    expect(() => assertAftermathVariantsProducible(real!)).not.toThrow();
  });

  /**
   * End to end, and the assertion THR-989's Done-when actually asks for: a pick
   * the player can now make resolves to the ending that was authored for it,
   * rather than to the fallback every one of these returned before.
   *
   * Reproduces the recorded shape `recordUnifiedActionChoiceMemory` writes —
   * `{ stepIndex: aftermathConfig.branchOnStep, choiceId: <card id> }` — which is
   * exactly what was observed on the live build after the fix
   * (`choiceHistory: [{ stepIndex: 0, choiceId: 'accept_trade', essenceSpent: 1 }]`).
   */
  it('resolves each authored pick to its own ending, not the fallback', () => {
    const authoredKeyed = UNIFIED_ACTION_TEMPLATES.filter((t) => {
      const cfg = t.aftermathConfig;
      const keys = Object.keys(cfg?.variants ?? {});
      if (!cfg || keys.length === 0) return false;
      const ids = new Set((t.authoredChoices?.[cfg.branchOnStep] ?? []).map((c) => c.id));
      return keys.every((k) => ids.has(k));
    });

    expect(authoredKeyed.length).toBeGreaterThanOrEqual(25);

    let distinctFromFallback = 0;

    for (const template of authoredKeyed) {
      const cfg = template.aftermathConfig!;
      const base = resolveAftermathVariant(cfg, undefined, undefined);

      for (const [key, authored] of Object.entries(cfg.variants)) {
        const picked = resolveAftermathVariant(
          cfg,
          [{ stepIndex: cfg.branchOnStep, choiceId: key } as never],
          undefined,
        );

        // The precise claim: the recorded pick selects *the variant authored for
        // that key*. Deliberately not "differs from the fallback" — a template
        // may legitimately author `fallback` as a copy of one variant, which
        // `broker.quest.rival_shrine_betrayal` does (its refusal is both the
        // branch fallback and the aftermath fallback). Testing inequality there
        // would fail on correct content and teach the next author to pad prose.
        expect(
          picked.overview,
          `${template.id} pick '${key}' did not select its authored ending`,
        ).toBe(authored.overview);

        if (picked.overview !== base.overview) distinctFromFallback += 1;
      }
    }

    // …but the suite would still pass vacuously if every variant equalled its
    // fallback, so pin that picking genuinely changes the ending in the general
    // case. This is the property that was false for all 30 templates before.
    expect(distinctFromFallback).toBeGreaterThanOrEqual(25);
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

/**
 * THR-1054: every `variants` entry must actually BE an `AftermathVariant`.
 *
 * A third instance of the family this file already guards twice (THR-979's
 * wrong-index keying, THR-1038's wrong-shape config), and the one the other two
 * cannot see: the config is well-formed at the top level — `branchOnStep`,
 * `variants` and `fallback` all present — while the *values inside* `variants`
 * are a second nesting level the resolver has no reader for. Ten `hod.*`
 * templates authored `variants[<stepIndex>][<band>] = { overview, changes }`,
 * so `resolveAftermathVariant` looked up `variants[choiceId]`, never matched a
 * step index, and returned `fallback` — whose `changes: []` was empty on all ten.
 * Every authored per-band ending (the lost relic, the cleansed corruption, the
 * delivered judgment) was written, committed, and reachable by nobody.
 *
 * The predicate is structural, not a snapshot count (THR-688 rule A): an entry
 * fails when its `changes` is not an array, which is exactly what a nested
 * band-map produces. `assertDecidedAftermathReachable` cannot catch this — it
 * returns early on templates with no decided fork, and these have none.
 */
describe('aftermath variant shape across the real corpus (THR-1054)', () => {
  const withAftermath = UNIFIED_ACTION_TEMPLATES.filter((t) => t.aftermathConfig);

  /**
   * The ten templates the defect was found on, with the bands each authors.
   *
   * THR-1055 raised all ten to the Encounter Factory floor of three bands
   * (`COMPOSITION_BYOUTCOME_MIN_BANDS`) including one extreme. The extremes are
   * the reason this table is pinned rather than counted: `critical_success`,
   * `critical_failure` and `success_at_cost` are the bands a playthrough rolls
   * least often, so a regression that unhooked one would be invisible in play
   * for a long time and visible here immediately.
   */
  const REKEYED_HOD_BANDS: ReadonlyArray<readonly [string, readonly UnifiedActionOutcome[]]> = [
    ['hod.quest.temple_vigil', ['success', 'success_at_cost', 'failure']],
    ['hod.quest.purify_shrine', ['success', 'failure', 'critical_failure']],
    ['hod.quest.escort_pilgrims', ['success', 'critical_success', 'failure']],
    ['hod.quest.slay_abomination', ['success', 'failure', 'critical_failure']],
    ['hod.quest.deliver_judgment', ['success', 'success_at_cost', 'failure']],
    ['hod.senior.cleanse_corruption', ['success', 'failure', 'critical_failure']],
    ['hod.senior.lead_crusade', ['success', 'critical_success', 'failure']],
    ['hod.senior.inquisition', ['success', 'success_at_cost', 'failure']],
    ['hod.elite.holy_war', ['success', 'critical_failure', 'failure']],
    ['hod.elite.divine_trial', ['success', 'failure', 'critical_failure']],
  ];

  it('every variants entry is an AftermathVariant, not a nested band map', () => {
    const malformed: string[] = [];

    for (const template of withAftermath) {
      for (const [key, entry] of Object.entries(template.aftermathConfig!.variants ?? {})) {
        if (!entry || !Array.isArray((entry as { changes?: unknown }).changes)) {
          malformed.push(`${template.id} variants['${key}']`);
        }
      }
    }

    expect(
      malformed,
      `${malformed.length} variants entr(ies) are not an AftermathVariant. `
      + 'The resolver reads `variants[choiceId].changes`, so an entry that nests '
      + 'another level (a step index → band map) is unreachable and the ending '
      + `falls back forever (THR-1054): ${malformed.join(', ')}`,
    ).toEqual([]);
  });

  /**
   * Reachability, not merely well-formedness. The structural check above passes
   * for a config that simply deleted the authored bands — this pins that each
   * one still *resolves* to prose distinct from the un-banded fallback.
   */
  it('every re-keyed hod template resolves its authored bands to distinct prose', () => {
    for (const [id, bands] of REKEYED_HOD_BANDS) {
      const template = withAftermath.find((t) => t.id === id);
      expect(template, `${id} is not in the catalog`).toBeDefined();

      const config = template!.aftermathConfig!;
      const base = resolveAftermathVariant(config, undefined, undefined);

      for (const band of bands) {
        const banded = resolveAftermathVariant(config, undefined, band);
        expect(banded.overview.length, `${id} @ ${band} resolved to empty prose`).toBeGreaterThan(0);
        expect(
          banded.overview,
          `${id} @ ${band} resolved to the un-banded fallback — the authored ending is unreachable`,
        ).not.toBe(base.overview);
        expect(
          banded.changes.length,
          `${id} @ ${band} carries no changes; the fallback's empty list is still showing`,
        ).toBeGreaterThan(0);
      }
    }
  });

  /**
   * Falsification. A guard that cannot fail is not evidence — reconstruct the
   * exact shape that shipped and confirm the structural check rejects it, and
   * that the resolver silently falls back rather than reading through it.
   */
  it('rejects the nested step-index → band shape that shipped', () => {
    const nested = {
      branchOnStep: 1,
      variants: {
        1: { failure: { overview: 'Authored, unreachable.', changes: [{ id: 'x' }] } },
      },
      fallback: { overview: 'The base ending.', changes: [] },
    } as unknown as NonNullable<UnifiedActionTemplate['aftermathConfig']>;

    const entry = Object.values(nested.variants)[0];
    expect(Array.isArray((entry as { changes?: unknown }).changes)).toBe(false);

    // And the consequence the predicate stands in for: the authored band is invisible.
    expect(resolveAftermathVariant(nested, undefined, 'failure').overview).toBe('The base ending.');
  });
});
