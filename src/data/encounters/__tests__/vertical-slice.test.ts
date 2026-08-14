/**
 * The vertical slice held to the locked THR-883 format.
 *
 * Four gates, each one a rule the authoring contract states in prose:
 *   1. Envelope honesty (THR-884) — declared settings, derived subtypes,
 *      one opening per class.
 *   2. The hand checklist (`checkNudgeHand`) — the shared WS1 lint, zero
 *      violations per template.
 *   3. Seed pair-liveness — the Seeded Sequel rule: every `encounter_seed`
 *      planted in the slice names a template that exists in the slice. A seed
 *      naming an unbuilt encounter is the THR-844 rot.
 *   4. Grant liveness (`validateNudgeGrantRefs`) — every id a card grants
 *      resolves against built content.
 * Plus fork sanity (THR-894 pole keys + at least one leaning card per
 * deciding hand) and pool registration.
 */

import { describe, expect, it } from 'vitest';
import type {
  ActionStep,
  ActionStepBranch,
  AftermathVariant,
  EncounterAftermathChange,
  EncounterAftermathChangeKind,
  EncounterAftermathReactionEffect,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import { isActionStepBranch } from '../../../types/unifiedAction';
import {
  SLICE_TEMPLATE_IDS,
  VERTICAL_SLICE_TEMPLATES,
} from '../vertical-slice';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { CONDITION_TRAIT_DEFINITIONS } from '../../condition-trait-content';
import { expandSettings, validateSettingEnvelope } from '../../settingClasses';
import { checkNudgeHand, nudgeBearingSteps } from '../../content-eval/nudgeHandChecklist';
import {
  EVASIVE_VAGUENESS_TERMS,
  NATURAL_INDEFINITE_TERMS,
} from '../../content-eval/nudgeAuditDetectors';
import { validateNudgeGrantRefs, formatDeadNudgeGrantRefs } from '../../../engine/nudgeGrantLiveness';

/**
 * The typed change vocabulary, exhaustively.
 *
 * Written as a `Record<EncounterAftermathChangeKind, true>` rather than a bare
 * `Set<string>` on purpose: adding a kind to the union without adding it here
 * is a compile error, so this gate cannot silently go blind the way a string
 * list would.
 */
const AFTERMATH_CHANGE_KIND_TABLE: Record<EncounterAftermathChangeKind, true> = {
  growth: true,
  trait: true,
  item: true,
  reputation: true,
  faction_reputation: true,
  reputation_tally: true,
  shell_state: true,
  future_hook: true,
};
const AFTERMATH_CHANGE_KINDS = new Set<string>(Object.keys(AFTERMATH_CHANGE_KIND_TABLE));

/**
 * Every aftermath effect authored anywhere on a template — including inside an
 * outcome band (THR-973). A band may author its own `reactions`, and those
 * reactions carry effects the pre-band sweep could not see; the family's
 * `critical_failure` band plants a seed that way.
 */
function allAftermathEffects(template: UnifiedActionTemplate): EncounterAftermathReactionEffect[] {
  const out: EncounterAftermathReactionEffect[] = [];
  const config = template.aftermathConfig;
  if (!config) return out;
  const variants = [...Object.values(config.variants), config.fallback];
  for (const variant of variants) {
    for (const reaction of variant.reactions ?? []) out.push(...reaction.effects);
    for (const band of Object.values(variant.byOutcome ?? {})) {
      for (const reaction of band?.reactions ?? []) out.push(...reaction.effects);
    }
  }
  return out;
}

describe('vertical slice — envelope honesty (THR-884)', () => {
  it.each(VERTICAL_SLICE_TEMPLATES.map((t) => [t.name, t] as const))(
    '%s declares an honest envelope with derived subtypes',
    (_name, template) => {
      expect(validateSettingEnvelope(template)).toEqual([]);
      expect(template.settings?.length ?? 0).toBeGreaterThan(0);
      expect(template.locationSubtypes).toEqual(expandSettings(template.settings ?? []));
    },
  );
});

describe('vertical slice — the hand checklist', () => {
  it.each(VERTICAL_SLICE_TEMPLATES.filter((t) => nudgeBearingSteps(t).length > 0).map(
    (t) => [t.name, t] as const,
  ))('%s passes checkNudgeHand with zero violations', (_name, template) => {
    expect(checkNudgeHand(template)).toEqual([]);
  });

  it('the two no-hand sequels are deliberate opt-outs, not omissions', () => {
    // The Full Moon Collection and The Grateful Kin are gentle scenes with no
    // hand by design (spec fail-soft contract: a step without nudges is a
    // supported authoring choice). Pin the population so a later edit that
    // *accidentally* drops a hand elsewhere cannot hide in this bucket.
    const handless = VERTICAL_SLICE_TEMPLATES.filter((t) => nudgeBearingSteps(t).length === 0);
    expect(handless.map((t) => t.id).sort()).toEqual(
      [SLICE_TEMPLATE_IDS.fullMoon, SLICE_TEMPLATE_IDS.gratefulKin].sort(),
    );
  });
});

describe('vertical slice — the Seeded Sequel rule', () => {
  it('every planted seed names a template that exists in the slice', () => {
    const sliceIds = new Set<string>(Object.values(SLICE_TEMPLATE_IDS));
    const planted: string[] = [];
    for (const template of VERTICAL_SLICE_TEMPLATES) {
      for (const effect of allAftermathEffects(template)) {
        if (effect.kind === 'encounter_seed' && effect.templateId) planted.push(effect.templateId);
      }
    }
    // Population guard: the slice designs three seeds; zero found means the
    // sweep is broken, not that the rule holds.
    expect(planted.length).toBeGreaterThanOrEqual(3);
    for (const id of planted) {
      expect(sliceIds.has(id), `seed names unbuilt template: ${id}`).toBe(true);
    }
  });

  it('every sequel is reachable — something in the slice seeds it', () => {
    const seeded = new Set<string>();
    for (const template of VERTICAL_SLICE_TEMPLATES) {
      for (const effect of allAftermathEffects(template)) {
        if (effect.kind === 'encounter_seed' && effect.templateId) seeded.add(effect.templateId);
      }
    }
    for (const sequelId of [
      SLICE_TEMPLATE_IDS.fullMoon,
      SLICE_TEMPLATE_IDS.swindlerFound,
      SLICE_TEMPLATE_IDS.gratefulKin,
    ]) {
      expect(seeded.has(sequelId), `sequel ${sequelId} is planted by no parent`).toBe(true);
    }
  });
});

describe('vertical slice — grant liveness (THR-885)', () => {
  it('every card grant resolves against built content', () => {
    const report = validateNudgeGrantRefs([...VERTICAL_SLICE_TEMPLATES]);
    expect(report.dead, formatDeadNudgeGrantRefs(report.dead)).toEqual([]);
    // Population guard: the slice authors at least one checked grant (Deep
    // Rest's remove_condition), so a zero here means the sweep went blind.
    expect(report.checkedRefs).toBeGreaterThan(0);
  });
});

describe('vertical slice — agent-decided forks (THR-894)', () => {
  const forked = VERTICAL_SLICE_TEMPLATES.flatMap((t) =>
    (t.steps ?? [])
      .filter(isActionStepBranch)
      .filter((b): b is ActionStepBranch => b.decidedBy !== undefined)
      .map((b) => [t.name, t, b] as const),
  );

  it('the slice designs three agent-decided forks', () => {
    expect(forked.length).toBe(3);
  });

  it.each(forked)('%s keys its variants on exactly the two poles', (_name, _t, branch) => {
    expect(Object.keys(branch.variants).sort()).toEqual(['negative', 'positive']);
  });

  it.each(forked)('%s gives the god a lever: leaning cards on the deciding step', (_name, template, branch) => {
    const deciding = template.steps[branch.branchOnStep];
    expect(isActionStepBranch(deciding)).toBe(false);
    const hand = (deciding as ActionStep).nudges ?? [];
    const leans = hand.filter((n) => n.poleLean !== undefined);
    // At least one argument in each direction — a fork the god can only push
    // one way is a lever with half a handle.
    // THR-898 widened object-form poleLean to {toward} | {route}; the slice's
    // forks are all two-pole, so a route-form lean here would itself be a bug.
    const directions = new Set(
      leans.map((l) => {
        const lean = l.poleLean!;
        if (typeof lean === 'string') return lean;
        return 'toward' in lean ? lean.toward : lean.route;
      }),
    );
    expect(directions.has('positive'), `${template.id}: no card leans positive`).toBe(true);
    expect(directions.has('negative'), `${template.id}: no card leans negative`).toBe(true);
  });
});

describe('vertical slice — the April migration bar (THR-973)', () => {
  /** Every authored variant on a template: the keyed ones and the fallback. */
  function allVariants(template: UnifiedActionTemplate): AftermathVariant[] {
    const config = template.aftermathConfig;
    if (!config) return [];
    return [...Object.values(config.variants), config.fallback];
  }

  /** A variant's own changes plus every change any of its outcome bands authors. */
  function allChanges(variant: AftermathVariant): EncounterAftermathChange[] {
    const banded = Object.values(variant.byOutcome ?? {}).flatMap((b) => b?.changes ?? []);
    return [...variant.changes, ...banded];
  }

  it.each(VERTICAL_SLICE_TEMPLATES.map((t) => [t.name, t] as const))(
    '%s bands at least one ending on outcome',
    (_name, template) => {
      // The finding this ticket implements: every variant shipped `changes: []`
      // and a single un-banded fallback, so "held" and "fell" read identically.
      const banded = allVariants(template).filter(
        (v) => Object.keys(v.byOutcome ?? {}).length > 0,
      );
      expect(banded.length, `${template.id}: no variant carries byOutcome`).toBeGreaterThan(0);
    },
  );

  it.each(VERTICAL_SLICE_TEMPLATES.map((t) => [t.name, t] as const))(
    '%s carries at least one typed consequence on every variant',
    (_name, template) => {
      for (const variant of allVariants(template)) {
        const changes = allChanges(variant);
        expect(
          changes.length,
          `${template.id}: a variant still ships changes: [] — the empty-aftermath rot`,
        ).toBeGreaterThan(0);
        for (const change of changes) {
          expect(
            AFTERMATH_CHANGE_KINDS.has(change.kind),
            `${template.id}: change ${change.id} has untyped kind "${change.kind}"`,
          ).toBe(true);
          expect(change.detail.trim().length, `${template.id}: change ${change.id} has no sentence`).toBeGreaterThan(0);
        }
      }
    },
  );

  it('every change id is unique across the slice — the chip key is derived from it', () => {
    const ids = VERTICAL_SLICE_TEMPLATES.flatMap((t) =>
      allVariants(t).flatMap((v) => allChanges(v).map((c) => c.id)),
    );
    // Population guard: a broken sweep reports zero duplicates trivially.
    expect(ids.length).toBeGreaterThanOrEqual(VERTICAL_SLICE_TEMPLATES.length);
    expect(ids.length - new Set(ids).size, `duplicate change ids: ${ids.join(', ')}`).toBe(0);
  });

  it('no band drops a seed its base variant plants, except the one that means to', () => {
    // `applyAftermathOutcomeBand` replaces `reactions` wholesale, so a band that
    // authors reactions silently un-plants whatever the base reaction seeded.
    // One band does this deliberately (the family's critical_failure drops the
    // Grateful Kin seed, because a failed day of guiding mints no word of a
    // kindness); every other band must preserve its base's full seed set.
    //
    // The waiver names the SEED, not just the band. Keyed on the band alone it
    // exempted every drop that band could make — including the swindler seed
    // the band is supposed to keep — so the gate passed a mutant that deleted
    // it. A waiver coarser than the thing it waives is a hole, not an exception.
    const deliberate = new Set([
      `${SLICE_TEMPLATE_IDS.family}::positive::critical_failure::${SLICE_TEMPLATE_IDS.gratefulKin}`,
    ]);
    const seedsOf = (v: { reactions?: readonly { effects: readonly EncounterAftermathReactionEffect[] }[] }) =>
      new Set(
        (v.reactions ?? []).flatMap((r) =>
          r.effects.filter((e) => e.kind === 'encounter_seed').map((e) => e.templateId),
        ),
      );

    const dropped: string[] = [];
    for (const template of VERTICAL_SLICE_TEMPLATES) {
      const config = template.aftermathConfig;
      if (!config) continue;
      const named: [string, AftermathVariant][] = [
        ...Object.entries(config.variants),
        ['fallback', config.fallback],
      ];
      for (const [variantKey, variant] of named) {
        const base = seedsOf(variant);
        if (base.size === 0) continue;
        for (const [outcome, band] of Object.entries(variant.byOutcome ?? {})) {
          if (!band?.reactions) continue; // no override ⇒ base reactions survive
          const kept = seedsOf(band);
          for (const seed of base) {
            if (kept.has(seed)) continue;
            const key = `${template.id}::${variantKey}::${outcome}::${seed}`;
            if (deliberate.has(key)) continue;
            dropped.push(`${template.id}::${variantKey}::${outcome} drops seed ${seed}`);
          }
        }
      }
    }
    expect(dropped, dropped.join('\n')).toEqual([]);
  });

  it.each(VERTICAL_SLICE_TEMPLATES.map((t) => [t.name, t] as const))(
    '%s declares the consequence structure on every authored change (THR-1097)',
    (_name, template) => {
      // THR-1082 shipped `category` / `stateNoun` / `direction` / `causeClause`
      // as optional so pre-existing content kept rendering; THR-1097 is the pass
      // that fills them in on the slice. Optional at the type level, mandatory
      // here — an undeclared chip falls back to deriving its category from
      // `kind` + `polarity`, which is the adapter guessing at what the author
      // knew, and it draws no icon tile because no state noun resolves.
      const undeclared: string[] = [];
      const changes = allVariants(template).flatMap(allChanges);
      // Population guard: zero changes means the sweep stopped seeing them and
      // the assertion below would pass vacuously.
      expect(changes.length, `${template.id}: no authored changes found`).toBeGreaterThan(0);
      for (const change of changes) {
        const missing: string[] = [];
        if (!change.category) missing.push('category');
        if (!change.stateNoun?.text) missing.push('stateNoun');
        if (!change.direction) missing.push('direction');
        if (!change.causeClause) missing.push('causeClause');
        if (missing.length > 0) undeclared.push(`${change.id} missing ${missing.join(', ')}`);
      }
      expect(undeclared, undeclared.join('\n')).toEqual([]);
    },
  );

  it('no authored consequence prose uses its field class’s banned lexicon (THR-1097)', () => {
    // The causality rule's machine-checkable half, enforced per half of the chip
    // — because the two halves are different field classes and THR-899 settled
    // that the lexicons are scoped, not flat:
    //
    //   `detail` is the CHANGE. Both lexicons are enforced at zero: "it cost
    //   them something" and "they lost a thing" are the writer declining to
    //   name the consequence, and the player has no other source for it.
    //
    //   `causeClause` is the SCENE beat that produced it. Only the evasive set
    //   applies. Natural indefinites are ordinary English here — "the master
    //   said nothing at the gates" is a concrete fact about a scene, and
    //   banning it is what produced the contortions THR-899 removed.
    const detailBanned = [...EVASIVE_VAGUENESS_TERMS, ...NATURAL_INDEFINITE_TERMS];
    const hits: string[] = [];
    let inspected = 0;
    for (const template of VERTICAL_SLICE_TEMPLATES) {
      for (const change of allVariants(template).flatMap(allChanges)) {
        inspected += 1;
        const scan = (prose: string, banned: readonly string[], field: string): void => {
          for (const term of banned) {
            if (new RegExp(`\\b${term}\\b`, 'i').test(prose)) {
              hits.push(`${change.id}.${field}: "${term}"`);
            }
          }
        };
        scan(change.detail, detailBanned, 'detail');
        if (change.causeClause) {
          scan(change.causeClause, EVASIVE_VAGUENESS_TERMS, 'causeClause');
        }
      }
    }
    expect(inspected, 'no consequence prose inspected').toBeGreaterThan(0);
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it('every condition a band applies names a real condition trait', () => {
    const known = new Set(CONDITION_TRAIT_DEFINITIONS.map((n) => n.id));
    const applied: string[] = [];
    for (const template of VERTICAL_SLICE_TEMPLATES) {
      for (const effect of allAftermathEffects(template)) {
        if (effect.kind === 'condition_attachment') applied.push(effect.templateId);
        if (effect.kind === 'apply_condition') applied.push(effect.conditionTraitId);
      }
    }
    // Population guard: the slice's fail and at-cost bands author conditions, so
    // zero here means the sweep stopped seeing banded reactions.
    expect(applied.length).toBeGreaterThan(0);
    for (const id of applied) {
      expect(known.has(id), `band applies unbuilt condition: ${id}`).toBe(true);
    }
  });
});

describe('vertical slice — the crossroads promise is a real claim (THR-1110)', () => {
  const crossroads = VERTICAL_SLICE_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.crossroads)!;

  /** The accept path — the fork's `negative` pole, where the word is given. */
  const acceptVariant = crossroads.aftermathConfig?.variants?.negative;
  const acceptEffects = (acceptVariant?.reactions ?? []).flatMap((r) => r.effects);

  it('the accept path grants an agreement attachment, not only an encounter seed', () => {
    const grant = acceptEffects.find((e) => e.kind === 'attachment_grant');
    expect(
      grant,
      'the promise shipped carried by its seed alone until THR-1110 — the seed is a scheduled '
      + 'encounter, not a thing the bearer holds',
    ).toBeDefined();
    expect((grant as { templateId?: string }).templateId).toBe('agreement.bargain.promise_given');
  });

  it('the agreement names a counterparty — a promise needs someone on the other end', () => {
    const grant = acceptEffects.find((e) => e.kind === 'attachment_grant') as
      { counterpartyId?: string } | undefined;
    expect(grant?.counterpartyId).toBe('$cast:stranger');
  });

  it('the counterparty sentinel resolves against a cast member the template actually declares', () => {
    const grant = acceptEffects.find((e) => e.kind === 'attachment_grant') as
      { counterpartyId?: string } | undefined;
    const key = grant!.counterpartyId!.replace('$cast:', '');
    const cast = (crossroads.supportBundle ?? []).filter((s) => s.kind === 'actor');
    expect(
      cast.some((s) => s.key === key),
      `the grant binds $cast:${key} but the template casts no such actor — the sentinel would `
      + 'stay unbound and the grant would silently no-op',
    ).toBe(true);
  });

  it('the stranger must persist — a promise whose holder is collected at scene end is not a promise', () => {
    const stranger = (crossroads.supportBundle ?? []).find((s) => s.kind === 'actor' && s.key === 'stranger');
    expect((stranger as { persistence?: string } | undefined)?.persistence).toBe('must-persist');
  });

  it('the bond and the collection fall due together', () => {
    const grant = acceptEffects.find((e) => e.kind === 'attachment_grant') as
      { durationOverride?: number | null } | undefined;
    const seed = acceptEffects.find((e) => e.kind === 'encounter_seed') as
      { delayTicks?: number } | undefined;
    expect(grant?.durationOverride).toBe(seed?.delayTicks);
  });

  it('the chip names the promise as a resolvable concept rather than bare text', () => {
    const chip = (acceptVariant?.changes ?? []).find((c) => c.id === 'slice.crossroads.the_word_given');
    expect(chip?.stateNoun?.tooltipId).toBe('ui.agreement');
  });
});

describe('vertical slice — registration', () => {
  it('all eight templates are in the live pool', () => {
    const poolIds = new Set(UNIFIED_ACTION_TEMPLATES.map((t) => t.id));
    for (const id of Object.values(SLICE_TEMPLATE_IDS)) {
      expect(poolIds.has(id), `${id} is not registered`).toBe(true);
    }
  });
});
