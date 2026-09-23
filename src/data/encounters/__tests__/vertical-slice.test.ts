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
import type { ValuePair } from '../../../types/agent';
import {
  authoredOutcomeBands,
  authoredOutcomeBandsOnVariant,
  reachableLosingBandsOnPath,
} from '../../../engine/debugOutcomePin';
import {
  SLICE_FULL_MOON_DELAY_TICKS,
  SLICE_KIN_WELCOME_DELTA,
  SLICE_KIN_WELCOME_DELTA_FUMBLED,
  SLICE_KIN_WELCOME_DELTA_WARM,
  SLICE_ROAD_REPUTE_KEY,
  SLICE_TABLE_DELAY_TICKS,
  SLICE_TABLE_GATE_BAND,
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
import { WorldGraph } from '../../../engine/graph';
import {
  applyReputationWithDelta,
  decayReputationWithEdges,
  getReputationWith,
  meetsReputationWithRequirement,
  REPUTATION_WITH_DECAY_PER_TICK,
  REPUTATION_WITH_DEFAULT,
  REPUTATION_WITH_PRUNE_EPSILON,
} from '../../../engine/reputation';

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

  it('every slice encounter carries a hand (THR-1131 closed the two opt-outs)', () => {
    // The Full Moon Collection and The Grateful Kin shipped hand-less by
    // design in the pre-contract era; Retrofit Batch 1 authored their hands
    // (KIN_HAND, FULL_MOON_HAND). Pin the population at zero so an edit that
    // accidentally drops a hand anywhere in the slice fails here by name.
    const handless = VERTICAL_SLICE_TEMPLATES.filter((t) => nudgeBearingSteps(t).length === 0);
    expect(handless.map((t) => t.id)).toEqual([]);
  });
});

describe('vertical slice — the Seeded Sequel rule', () => {
  it('every planted seed names a template that exists in the slice', () => {
    const sliceIds = new Set<string>(Object.values(SLICE_TEMPLATE_IDS));
    const planted: string[] = [];
    for (const template of VERTICAL_SLICE_TEMPLATES) {
      for (const effect of allAftermathEffects(template)) {
        if (effect.kind !== 'encounter_seed') continue;
        if (effect.templateId) planted.push(effect.templateId);
        // THR-1479 — an appointment's missed branch is a seed too, judged by the
        // same rule when it names a literal.
        if (effect.appointment?.missed.templateId) planted.push(effect.appointment.missed.templateId);
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
    const seededByTag = new Set<string>();
    for (const template of VERTICAL_SLICE_TEMPLATES) {
      for (const effect of allAftermathEffects(template)) {
        if (effect.kind !== 'encounter_seed') continue;
        if (effect.templateId) seeded.add(effect.templateId);
        // THR-1479 — a missed branch names a *family* by query; a sequel is
        // reachable when it carries a tag some missed branch draws from.
        for (const tag of effect.appointment?.missed.query?.tags ?? []) seededByTag.add(tag);
      }
    }
    for (const sequelId of [
      SLICE_TEMPLATE_IDS.fullMoon,
      SLICE_TEMPLATE_IDS.swindlerFound,
      SLICE_TEMPLATE_IDS.gratefulKin,
      // THR-1182 — the Kin's own sequel. Its parent is itself a sequel, so this
      // is the first two-deep chain in the slice.
      SLICE_TEMPLATE_IDS.tableThatHolds,
    ]) {
      expect(seeded.has(sequelId), `sequel ${sequelId} is planted by no parent`).toBe(true);
    }
    // THR-1479 — the reckoning is reached by family, never by literal id.
    const reckoning = VERTICAL_SLICE_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.fullMoonReckoning)!;
    expect(
      (reckoning.tags ?? []).some((tag) => seededByTag.has(tag)),
      `${reckoning.id} carries no tag any appointment's missed branch draws from`,
    ).toBe(true);
    expect(seeded.has(SLICE_TEMPLATE_IDS.fullMoonReckoning), 'the reckoning must be a family, not a literal').toBe(false);
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

  // THR-1182 added the fourth: The Table That Holds forks on courage_prudence.
  it('the slice designs four agent-decided forks', () => {
    expect(forked.length).toBe(4);
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

/**
 * THR-1524 → THR-1525 — a fork's planting arm must not be starved by selection.
 *
 * THR-1524 measured the Crossroads (Heretics accept and plant, Archivists refuse)
 * firing once in 1000 ticks on seed 42 / medium, refused, zero appointments
 * planted: under the then-signed desire score, naming the fork axis in
 * `motivations` drew only the positive pole. THR-1525 made an unpinned axis draw
 * **both** poles, so naming the fork axis is now safe. The starvation can only be
 * re-authored by *pinning* the fork axis (`motivationPoles`) to the pole opposite
 * the planting arm — which is what this guards.
 */
describe('vertical slice — a planting arm is never starved by a pole pin (THR-1524, THR-1525)', () => {
  const plantsSeed = (variant: AftermathVariant | undefined): boolean =>
    (variant?.reactions ?? []).some((r) =>
      (r.effects ?? []).some((e) => e.kind === 'encounter_seed'),
    );

  /** [name, template, fork axis, the one pole whose arm plants the sequel]. */
  const singlePoleForks = VERTICAL_SLICE_TEMPLATES.flatMap((t) =>
    (t.steps ?? [])
      .filter(isActionStepBranch)
      .filter((b): b is ActionStepBranch => b.decidedBy !== undefined && 'axis' in b.decidedBy)
      .flatMap((b) => {
        const variants = t.aftermathConfig?.variants ?? {};
        const pos = plantsSeed(variants.positive);
        const neg = plantsSeed(variants.negative);
        if (pos === neg) return [];
        const axis = (b.decidedBy as { axis: ValuePair }).axis;
        return [[t.name, t, axis, pos ? 'positive' : 'negative'] as const];
      }),
  );

  it('the Crossroads is one, planting on its negative pole (guards against a silent re-cut)', () => {
    const crossroads = singlePoleForks.find(([, t]) => t.id === SLICE_TEMPLATE_IDS.crossroads);
    expect(crossroads?.[3]).toBe('negative');
  });

  it.each(singlePoleForks)('%s does not pin its fork axis against the planting pole', (_name, template, axis, plantingPole) => {
    const pin = template.motivationPoles?.[axis];
    expect(pin === undefined || pin === plantingPole, `${template.id}: ${axis} pinned ${pin} starves the ${plantingPole} planting arm`)
      .toBe(true);
  });

  it('the Crossroads registers past the wayside class — 8 places on a medium world was no supply', () => {
    const crossroads = VERTICAL_SLICE_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.crossroads)!;
    expect(crossroads.settings).toContain('rural');
    // Envelope honesty holds for the wider envelope too: one opening per class.
    for (const cls of crossroads.settings ?? []) {
      expect(crossroads.openings?.[cls as keyof typeof crossroads.openings], `${cls}: no opening`).toBeTruthy();
    }
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

describe('vertical slice — the crossroads promise is a real claim (THR-1110, re-cut by THR-1479)', () => {
  const crossroads = VERTICAL_SLICE_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.crossroads)!;

  /** The accept path — the fork's `negative` pole, where the word is given. */
  const acceptVariant = crossroads.aftermathConfig?.variants?.negative;
  const acceptEffects = (acceptVariant?.reactions ?? []).flatMap((r) => r.effects);
  const acceptSeed = acceptEffects.find(
    (e) => e.kind === 'encounter_seed' && e.templateId === SLICE_TEMPLATE_IDS.fullMoon,
  ) as Extract<EncounterAftermathReactionEffect, { kind: 'encounter_seed' }> | undefined;

  it('the accept path plants an appointment, not a placeless seed', () => {
    // THR-1110 made the promise a claim the bearer holds (an attachment beside a
    // placeless seed). THR-1479 fused the two: the seed carries the place and the
    // time, and the planter writes the `owes_favor` edge that *is* the promise on
    // the sheet — one claim, not two.
    expect(acceptSeed, 'the accept path no longer plants The Full Moon Collection').toBeDefined();
    expect(acceptSeed?.appointment, 'the seed carries no appointment block — the place is a wish again').toBeDefined();
    expect(acceptSeed?.appointment?.locationId).toBe('$here');
  });

  it('the appointment names a counterparty — a promise needs someone on the other end', () => {
    expect(acceptSeed?.appointment?.counterpartyId).toBe('$cast:stranger');
  });

  it('the counterparty sentinel resolves against a cast member the template actually declares', () => {
    const key = acceptSeed!.appointment!.counterpartyId!.replace('$cast:', '');
    const cast = (crossroads.supportBundle ?? []).filter((s) => s.kind === 'actor');
    expect(
      cast.some((s) => s.key === key),
      `the appointment binds $cast:${key} but the template casts no such actor — the sentinel would `
      + 'stay unbound and the promise would be owed to the crossroads instead',
    ).toBe(true);
  });

  it('the stranger must persist — a promise whose holder is collected at scene end is not a promise', () => {
    const stranger = (crossroads.supportBundle ?? []).find((s) => s.kind === 'actor' && s.key === 'stranger');
    expect((stranger as { persistence?: string } | undefined)?.persistence).toBe('must-persist');
  });

  it('one promise on the sheet — the promise_given grant no longer rides beside the appointment', () => {
    const grant = acceptEffects.find(
      (e) => e.kind === 'attachment_grant' && (e as { templateId?: string }).templateId === 'agreement.bargain.promise_given',
    );
    expect(grant, 'two records of one promise drift; the favour edge the planter writes is the claim').toBeUndefined();
    expect(acceptSeed?.delayTicks).toBe(SLICE_FULL_MOON_DELAY_TICKS);
  });

  it('the missed branch is a family the reckoning carries, never an ungated id', () => {
    const missed = acceptSeed!.appointment!.missed;
    expect(missed.templateId).toBeUndefined();
    expect(missed.query?.kind).toBe('encounter_template');
    const reckoning = VERTICAL_SLICE_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.fullMoonReckoning)!;
    for (const tag of missed.query?.tags ?? []) {
      expect(reckoning.tags, `the reckoning does not carry ${tag}`).toContain(tag);
    }
    expect(missed.seedLabel.trim().length).toBeGreaterThan(0);
  });

  it('the chip names the promise as a resolvable concept rather than bare text', () => {
    const chip = (acceptVariant?.changes ?? []).find((c) => c.id === 'slice.crossroads.the_word_given');
    expect(chip?.stateNoun?.tooltipId).toBe('ui.agreement');
  });
});

/**
 * THR-1120 — a consequence chip that names a granted attachment must link it.
 *
 * The link is only honest if the id the chip declares is the id the *same band*
 * actually grants, and that pairing is the thing most likely to rot: an author
 * retunes a band's reaction to grant `exhausted` instead of `wounded` and the
 * chip goes on linking a condition nobody receives. Nothing else would catch it
 * — the link still opens a real sheet, so it looks correct on screen.
 *
 * Note the direction of the assertion. It is deliberately *not* "every grant has
 * a chip that links it": a band may grant a second condition it never claims in
 * prose (the pass's `come_down_hurt` grants both `wounded` and `exhausted` while
 * only one is a chip), and that is an authoring choice, not a defect.
 */
describe('vertical slice — a declared attachment grant is the one its band writes (THR-1120)', () => {
  it.each(VERTICAL_SLICE_TEMPLATES.map((t) => [t.name, t] as const))(
    '%s links only attachments its own band grants',
    (_name, template) => {
      const wrong: string[] = [];
      let declared = 0;

      const config = template.aftermathConfig;
      const variants = config ? [...Object.values(config.variants), config.fallback] : [];

      for (const variant of variants) {
        for (const [outcome, band] of Object.entries(variant.byOutcome ?? {})) {
          if (!band) continue;
          // A band with no reactions of its own inherits the variant's, which is
          // where its grants then live (the same rule the seed sweep uses).
          const reactions = band.reactions ?? variant.reactions ?? [];
          const granted = new Set(
            reactions
              .flatMap((r) => r.effects ?? [])
              .map((e) => (e as { templateId?: string }).templateId)
              .filter((id): id is string => Boolean(id)),
          );

          for (const change of band.changes ?? []) {
            const noun = change.stateNoun;
            if (noun?.visualKind !== 'attachment') continue;
            declared += 1;
            if (!noun.entityId) {
              wrong.push(`${template.id}::${outcome}::${change.id} declares visualKind attachment with no entityId`);
              continue;
            }
            if (!granted.has(noun.entityId)) {
              wrong.push(
                `${template.id}::${outcome}::${change.id} links ${noun.entityId}, `
                + `which that band does not grant (grants: ${[...granted].join(', ') || 'nothing'})`,
              );
            }
          }
        }
      }

      expect(wrong, wrong.join('\n')).toEqual([]);
      // Guards the vacuous pass: if the sweep stops finding declarations at all,
      // the loop above proves nothing and would go green on an empty file.
      if (template.id === SLICE_TEMPLATE_IDS.bridge) {
        expect(declared, 'the bridge declares no attachment grants').toBeGreaterThan(0);
      }
    },
  );

  it('every linked attachment template exists as a condition definition', () => {
    // The other rot direction: a live pairing that names a template nobody built
    // would open an empty sheet, which reads as a broken game.
    const known = new Set(CONDITION_TRAIT_DEFINITIONS.map((d) => d.id));
    const missing: string[] = [];

    for (const template of VERTICAL_SLICE_TEMPLATES) {
      const config = template.aftermathConfig;
      if (!config) continue;
      for (const variant of [...Object.values(config.variants), config.fallback]) {
        for (const band of Object.values(variant.byOutcome ?? {})) {
          for (const change of band?.changes ?? []) {
            const id = change.stateNoun?.visualKind === 'attachment'
              ? change.stateNoun.entityId
              : undefined;
            if (id && id.startsWith('trait.') && !known.has(id)) {
              missing.push(`${template.id}::${change.id} links unbuilt ${id}`);
            }
          }
        }
      }
    }

    expect(missing, missing.join('\n')).toEqual([]);
  });
});

describe('vertical slice — registration', () => {
  it('all ten templates are in the live pool', () => {
    const poolIds = new Set(UNIFIED_ACTION_TEMPLATES.map((t) => t.id));
    for (const id of Object.values(SLICE_TEMPLATE_IDS)) {
      expect(poolIds.has(id), `${id} is not registered`).toBe(true);
    }
  });
});

/**
 * THR-1153 — the Unsafe Bridge's folded PATH chip stays folded.
 *
 * Christian's 2026-08-17 ruling set the bar at anchoring: a chip's referent is an
 * existing graph object, resolvable in the live world, named by the chip's prose.
 * `slice.bridge.the_planking` claimed "the river crossing" / "the ford upstream" —
 * landscape fiction on a template that registers at `wayside` (`camp | oasis |
 * wilderness`), so it spawns where no river need exist. It was folded into the
 * band overview rather than re-pointed.
 *
 * The regression this pins is a *re-growth*, not a rendering detail: the cheapest
 * way to undo this fix is for a later authoring pass to put a chip back on the
 * base face because the ending "looks empty". These assertions fail if that
 * happens, and name the rule.
 */
describe('vertical slice — the bridge PATH chip stays folded (THR-1153)', () => {
  const bridge = VERTICAL_SLICE_TEMPLATES.find(
    (t) => t.id === 'encounter.slice.unsafe_bridge',
  );

  it('the template is present (guards the assertions below against a silent rename)', () => {
    expect(bridge, 'encounter.slice.unsafe_bridge is not in VERTICAL_SLICE_TEMPLATES').toBeDefined();
  });

  it('the fallback base face carries no chips, so a plain success renders none', () => {
    // Bands substitute `changes` WHOLESALE (`override.changes ?? baseChanges`),
    // and this variant authors no `success` override — so the base face is the
    // ending a plain success actually shows. That is the face the director was
    // looking at when he filed the bug.
    expect(bridge?.aftermathConfig?.fallback?.changes ?? []).toEqual([]);
  });

  it('no face anywhere in the template re-declares the folded chip id', () => {
    const config = bridge?.aftermathConfig;
    const offenders: string[] = [];
    for (const variant of [...Object.values(config?.variants ?? {}), config?.fallback]) {
      if (!variant) continue;
      const faces: (readonly EncounterAftermathChange[])[] = [
        variant.changes ?? [],
        ...Object.values(variant.byOutcome ?? {}).map((b) => b?.changes ?? []),
      ];
      for (const changes of faces) {
        for (const change of changes) {
          if (change.id === 'slice.bridge.the_planking') offenders.push(change.id);
        }
      }
    }
    expect(
      offenders,
      'slice.bridge.the_planking was folded (THR-1153) — its referent is landscape '
        + 'fiction, not a graph object. Re-anchor it to a real object or leave it folded.',
    ).toEqual([]);
  });

  it("the keeper's hidden mark survives the fold — it anchors to a real cast actor", () => {
    // The fold removed the `intelligence` record (filed about a ford that is not
    // in the game state) and kept this one, which targets a declared cast key the
    // world instantiates. Pinning it stops the fold from being widened into
    // "delete the whole reaction".
    const effects = bridge?.aftermathConfig?.fallback?.reactions?.[0]?.effects ?? [];
    const kinds = effects.map((e: EncounterAftermathReactionEffect) => e.kind);
    expect(kinds).toContain('hidden_mark');
    expect(kinds, 'the ford intelligence record left with the chip it backed').not.toContain(
      'intelligence',
    );
  });
});

/**
 * THR-1182 — The Table That Holds: the gate rejects, and the seed ripens in time.
 *
 * Two Done-whens, and both are written to be falsifiable rather than decorative.
 *
 * The gate half asserts **both polarities**, because a gate that never rejects
 * is not a gate — and on this particular gate that is a live hazard rather than
 * a slogan. `REPUTATION_WITH_DEFAULT` is 0.5, which `getReputationWord` bands as
 * `Accepted`, so the obvious-looking `{ atLeast: 'Accepted' }` is satisfied by
 * every stranger who has never been to the place. The third assertion below
 * pins exactly that: it shows the vacuous band passing at the town with no
 * standing, which is what makes the second assertion evidence about the band
 * this template chose rather than about reputation in general.
 *
 * The timing half drives the real decay phase rather than re-deriving its
 * arithmetic in the test. Literals are asserted on both sides on purpose (the
 * constant-as-fixture tautology): `12` and `20` are written out, so a change to
 * `REPUTATION_WITH_DECAY_PER_TICK`, `REPUTATION_WITH_PRUNE_EPSILON` or any Kin
 * delta breaks this loudly instead of silently stranding the sequel behind a
 * welcome that has already faded.
 */
describe('vertical slice — The Table That Holds (THR-1182)', () => {
  const HERO = 'agent.hero';
  const WELCOMING_TOWN = 'loc.welcoming';
  const STRANGE_TOWN = 'loc.strange';

  function worldWithTowns(): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({
      id: HERO, type: 'actor', name: 'Hero', properties: { actorType: 'individual' },
    });
    for (const id of [WELCOMING_TOWN, STRANGE_TOWN]) {
      graph.addNode({
        id, type: 'location', name: id, properties: { locationSubtype: 'hamlet' },
      });
    }
    return graph;
  }

  const table = VERTICAL_SLICE_TEMPLATES.find(
    (t) => t.id === SLICE_TEMPLATE_IDS.tableThatHolds,
  )!;

  it('gates on a reputation band, not on the deleted standing-welcome condition', () => {
    // THR-1206 left `trait.condition.location.standing_welcome` with zero writers,
    // so a `requiredTargetTraits` gate naming it would have been a dead gate.
    // THR-1483 then deleted the definition outright, which upgrades this from "a
    // gate that would never pass" to "a gate naming a trait that does not exist" —
    // so the assertion below guards something stricter than it used to.
    expect(table.requiredReputationWith?.atLeast).toBe(SLICE_TABLE_GATE_BAND);
    expect(table.requiredTargetTraits ?? []).not.toContain(
      'trait.condition.location.standing_welcome',
    );
  });

  it('opens where the welcome was earned and refuses where it was not', () => {
    const graph = worldWithTowns();
    // The warm band is the one that reaches `Respected` (0.5 + 0.12 = 0.62).
    applyReputationWithDelta(graph, HERO, WELCOMING_TOWN, SLICE_KIN_WELCOME_DELTA_WARM, 0, 'test');

    expect(
      meetsReputationWithRequirement(graph, HERO, WELCOMING_TOWN, SLICE_TABLE_GATE_BAND),
      'the town that kept a door open does not open the scene',
    ).toBe(true);

    expect(
      meetsReputationWithRequirement(graph, HERO, STRANGE_TOWN, SLICE_TABLE_GATE_BAND),
      'a town the traveler has never helped still opens the scene — the gate never rejects',
    ).toBe(false);

    // Anti-vacuity: the refusal above is a property of the band this template
    // picked, not of the machinery. At the neutral default, `Accepted` passes.
    expect(getReputationWith(graph, HERO, STRANGE_TOWN).band).toBe('Accepted');
    expect(meetsReputationWithRequirement(graph, HERO, STRANGE_TOWN, 'Accepted')).toBe(true);
  });

  it('is planted from every Grateful Kin site that authors its own reactions, at one delay', () => {
    const kin = VERTICAL_SLICE_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.gratefulKin)!;
    const seeds = allAftermathEffects(kin).filter(
      (e): e is Extract<EncounterAftermathReactionEffect, { kind: 'encounter_seed' }> =>
        e.kind === 'encounter_seed' && e.templateId === SLICE_TEMPLATE_IDS.tableThatHolds,
    );

    // THR-1468 — stated as a predicate over the planting *sites*, not as a
    // count of them. This assertion read `toBe(3)` ("base reaction plus the two
    // crit bands"), which was a snapshot of how many bands existed when
    // THR-1182 shipped: adding the `failure` band made it read 4 and fail while
    // the invariant it guards was perfectly intact. A count also could not
    // distinguish the case it exists to catch — one *particular* site forgetting
    // the seed — from a site being added or removed. The real rule is that
    // `applyAftermathOutcomeBand` substitutes `reactions` wholesale, so every
    // site that authors its own must restate the seed, and the base reaction
    // covers every band that does not (THR-688 rule A).
    const fallback = kin.aftermathConfig!.fallback;
    const plantingSites: { where: string; reactions: AftermathVariant['reactions'] }[] = [
      { where: 'base reaction', reactions: fallback.reactions },
      ...Object.entries(fallback.byOutcome ?? {}).map(([band, cfg]) => ({
        where: `band ${band}`,
        reactions: cfg?.reactions,
      })),
    ].filter((site) => (site.reactions ?? []).length > 0);

    // Anti-vacuity: the base reaction plus at least the bands that substitute
    // wholesale. Zero or one site here means the walker went blind.
    expect(plantingSites.length).toBeGreaterThanOrEqual(3);

    const sitesMissingSeed = plantingSites
      .filter(
        (site) =>
          !(site.reactions ?? [])
            .flatMap((r) => r.effects)
            .some(
              (e) =>
                e.kind === 'encounter_seed'
                && e.templateId === SLICE_TEMPLATE_IDS.tableThatHolds,
            ),
      )
      .map((site) => site.where);
    expect(
      sitesMissingSeed,
      `these Grateful Kin sites author their own reactions and so drop the table `
        + `seed by omission:\n${sitesMissingSeed.join('\n')}`,
    ).toEqual([]);

    expect(seeds.length).toBe(plantingSites.length);
    for (const seed of seeds) {
      expect(seed.delayTicks).toBe(SLICE_TABLE_DELAY_TICKS);
      // Without this the sequel would fire at a town-shaped place rather than
      // at the town whose regard the same reaction just moved.
      expect(seed.inheritContext).toBe(true);
    }
  });

  it('ripens while every band that planted it still has a welcome to call in', () => {
    // Literal on both sides — a constant read into its own expectation proves
    // nothing (the tautology this project keeps re-learning).
    expect(SLICE_TABLE_DELAY_TICKS).toBe(12);

    const fumbledWindow =
      (SLICE_KIN_WELCOME_DELTA_FUMBLED - REPUTATION_WITH_PRUNE_EPSILON)
      / REPUTATION_WITH_DECAY_PER_TICK;
    expect(Math.round(fumbledWindow)).toBe(20);
    expect(SLICE_TABLE_DELAY_TICKS).toBeLessThan(fumbledWindow);

    // Not arithmetic — the real decay phase, run for the seed's own delay.
    for (const [label, delta] of [
      ['warm', SLICE_KIN_WELCOME_DELTA_WARM],
      ['normal', SLICE_KIN_WELCOME_DELTA],
      ['fumbled', SLICE_KIN_WELCOME_DELTA_FUMBLED],
    ] as const) {
      const graph = worldWithTowns();
      applyReputationWithDelta(graph, HERO, WELCOMING_TOWN, delta, 0, 'test');
      for (let tick = 1; tick <= SLICE_TABLE_DELAY_TICKS; tick++) {
        decayReputationWithEdges(graph, tick);
      }
      const reading = getReputationWith(graph, HERO, WELCOMING_TOWN);
      expect(
        reading.source,
        `the ${label} band's welcome is already gone when its own seed ripens`,
      ).toBe('edge');
      expect(reading.score).toBeGreaterThan(REPUTATION_WITH_DEFAULT);
    }
  });

  it('still clears its own gate off the warm band when the seed ripens', () => {
    // The seeded path bypasses the filter (a `templateId` seed spawns directly),
    // so this is not what makes the sequel arrive. It is what keeps the seeded
    // and organic paths telling the player the same story about the same town.
    const graph = worldWithTowns();
    applyReputationWithDelta(graph, HERO, WELCOMING_TOWN, SLICE_KIN_WELCOME_DELTA_WARM, 0, 'test');
    for (let tick = 1; tick <= SLICE_TABLE_DELAY_TICKS; tick++) {
      decayReputationWithEdges(graph, tick);
    }
    expect(
      meetsReputationWithRequirement(graph, HERO, WELCOMING_TOWN, SLICE_TABLE_GATE_BAND),
    ).toBe(true);
  });
});

describe('vertical slice — the crossroads chain promises only what an effect performs (THR-1476, THR-1479)', () => {
  /**
   * Prose rule 7b: prose may not set a constraint on future world behaviour that
   * no effect enacts. THR-1476 made this chain true **by removal** — the seed had
   * no spatial field, so the stranger found them. THR-1479 makes it true **by
   * construction**: the accept path's seed carries an `appointment` block, so
   * "collect it here at the next full moon" is a sentence the engine performs,
   * and the *kept* sequel may say they kept the night they promised.
   *
   * The rule did not move; its one exception did. So this gate now has two arms:
   * the appointment seed is the only seed on the chain allowed to promise a
   * place, and the chain's *placeless* re-seeds (the refuse path's, and the Full
   * Moon's second-visit) still may not — nothing walks the mortal back to a tree
   * for those, and their labels stay in the truthful register.
   *
   * **What this gate is, honestly.** A regression pin on specific constructions,
   * not a general 7b enforcer: whether an effect enacts a sentence is a judgment,
   * and the enforcement surface is the authoring spec (rule 7b and its
   * exception), the critic's pass, and the systems auditor's Aftermath
   * Supportability question. This test stops *these* sentences coming back on
   * the seeds that cannot perform them.
   */
  const CHAIN_IDS: readonly string[] = [
    SLICE_TEMPLATE_IDS.crossroads,
    SLICE_TEMPLATE_IDS.fullMoon,
  ];

  /**
   * Every string on a template the player can read. Walks openings, the step
   * spine (including branch variants and their nudges), and the whole aftermath
   * tree down to band reactions and their seed labels — the five surfaces the
   * ticket's sweep predicate names.
   */
  function playerFacingStrings(
    template: UnifiedActionTemplate,
  ): { where: string; text: string }[] {
    const out: { where: string; text: string }[] = [];
    const push = (where: string, text: string | undefined): void => {
      if (typeof text === 'string' && text.length > 0) out.push({ where, text });
    };

    for (const [cls, opening] of Object.entries(template.openings ?? {})) {
      push(`openings.${cls}`, opening);
    }
    push('description', template.description);
    for (const [key, line] of Object.entries(template.narrativeTemplates ?? {})) {
      push(`narrativeTemplates.${key}`, line);
    }

    const walkStep = (step: ActionStep, where: string): void => {
      push(`${where}.purposeLine`, step.purposeLine);
      push(`${where}.narrativeTemplate`, step.narrativeTemplate);
      push(`${where}.successAfterimage`, step.successAfterimage);
      push(`${where}.failureAfterimage`, step.failureAfterimage);
      push(`${where}.successAtCostAfterimage`, step.successAtCostAfterimage);
      push(`${where}.criticalSuccessAfterimage`, step.criticalSuccessAfterimage);
      push(`${where}.criticalFailureAfterimage`, step.criticalFailureAfterimage);
      for (const nudge of step.nudges ?? []) {
        push(`${where}.${nudge.id}.effectLine`, nudge.effectLine);
        for (const [band, line] of Object.entries(nudge.bandProse ?? {})) {
          push(`${where}.${nudge.id}.bandProse.${band}`, line);
        }
      }
    };

    template.steps.forEach((entry, i) => {
      const branch = entry as ActionStepBranch;
      if (typeof branch.branchOnStep === 'number') {
        for (const [pole, variant] of Object.entries(branch.variants)) {
          walkStep(variant, `steps[${i}].${pole}`);
        }
        if (branch.fallback) walkStep(branch.fallback, `steps[${i}].fallback`);
        return;
      }
      walkStep(entry as ActionStep, `steps[${i}]`);
    });

    const config = template.aftermathConfig;
    if (config) {
      const variants: [string, AftermathVariant][] = [
        ...Object.entries(config.variants),
        ['fallback', config.fallback],
      ];
      for (const [vKey, variant] of variants) {
        const walkVariantBody = (body: Partial<AftermathVariant>, where: string): void => {
          push(`${where}.overview`, body.overview);
          for (const change of body.changes ?? []) {
            push(`${where}.${change.id}.causeClause`, change.causeClause);
            push(`${where}.${change.id}.detail`, change.detail);
          }
          for (const reaction of body.reactions ?? []) {
            push(`${where}.${reaction.id}.label`, reaction.label);
            push(`${where}.${reaction.id}.intent`, reaction.intent);
            for (const effect of reaction.effects) {
              if (effect.kind === 'encounter_seed') {
                push(`${where}.${reaction.id}.seedLabel`, effect.seedLabel);
              }
            }
          }
        };
        walkVariantBody(variant, `aftermath.${vKey}`);
        for (const [band, body] of Object.entries(variant.byOutcome ?? {})) {
          if (body) walkVariantBody(body, `aftermath.${vKey}.${band}`);
        }
      }
    }
    return out;
  }

  /**
   * The constructions a *placeless* seed cannot make true: a road that bends
   * the mortal back, an appointment they are credited with keeping. Applied to
   * the chain's placeless seeds' labels only — the appointment seed is allowed
   * (and expected) to promise the place.
   */
  const BANNED_ON_PLACELESS_SEEDS: readonly { pattern: RegExp; why: string }[] = [
    { pattern: /\bappointments?\b/i, why: 'a placeless seed schedules no meeting the mortal attends' },
    { pattern: /\bthe road bends back\b/i, why: 'a placeless re-seed does not bend the road back to the tree' },
    { pattern: /\bcollect it here\b/i, why: 'a placeless seed carries no location' },
  ];

  it('the walker still sees the whole chain (population guard)', () => {
    const chain = VERTICAL_SLICE_TEMPLATES.filter((t) => CHAIN_IDS.includes(t.id));
    // Both templates must be found. Zero or one here means the chain was renamed
    // and this gate went blind rather than clean.
    expect(chain.map((t) => t.id).sort()).toEqual([...CHAIN_IDS].sort());
    let inspected = 0;
    for (const template of chain) {
      const strings = playerFacingStrings(template);
      expect(strings.length, `${template.id}: walker found no prose`).toBeGreaterThan(20);
      inspected += strings.length;
    }
    expect(inspected).toBeGreaterThan(50);
  });

  it('exactly one seed on the chain promises a place, and it is the appointment', () => {
    const placed: string[] = [];
    const placeless: { where: string; label: string }[] = [];
    for (const template of VERTICAL_SLICE_TEMPLATES.filter((t) => CHAIN_IDS.includes(t.id))) {
      for (const effect of allAftermathEffects(template)) {
        if (effect.kind !== 'encounter_seed') continue;
        if (effect.appointment) placed.push(`${template.id} → ${effect.templateId}`);
        else placeless.push({ where: `${template.id} → ${effect.templateId ?? effect.encounterFamily ?? 'query'}`, label: effect.seedLabel });
      }
    }
    expect(placed).toEqual([`${SLICE_TEMPLATE_IDS.crossroads} → ${SLICE_TEMPLATE_IDS.fullMoon}`]);
    // The chain's re-seeds (refuse path, second visit) stay placeless and their
    // labels stay in the truthful register.
    expect(placeless.length).toBeGreaterThanOrEqual(2);
    const hits = placeless.flatMap(({ where, label }) =>
      BANNED_ON_PLACELESS_SEEDS.filter(({ pattern }) => pattern.test(label)).map(({ pattern, why }) =>
        `${where}: /${pattern.source}/ — ${why}`),
    );
    expect(hits, `prose rule 7b violations on placeless seeds:\n${hits.join('\n')}`).toEqual([]);
  });

  it('the place the opening promises is the place the appointment binds', () => {
    // "collect it here" is true only because the block says `$here` — the
    // crossroads the scene happens at. A literal id or `$target` here would let
    // the prose and the effect name two different places.
    const crossroads = VERTICAL_SLICE_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.crossroads)!;
    const opening = playerFacingStrings(crossroads).find((s) => /collect it here/i.test(s.text));
    expect(opening, 'the opening no longer makes the promise the appointment performs').toBeDefined();
    const seed = allAftermathEffects(crossroads).find(
      (e) => e.kind === 'encounter_seed' && e.appointment,
    ) as Extract<EncounterAftermathReactionEffect, { kind: 'encounter_seed' }>;
    expect(seed.appointment?.locationId).toBe('$here');
    expect(seed.delayTicks).toBe(SLICE_FULL_MOON_DELAY_TICKS);
  });

  it('the kept sequel fires only from the appointment, so its prose may say they kept the night', () => {
    // Every planter of The Full Moon Collection in the slice carries the block;
    // a second, placeless planter would make "They kept the night they promised"
    // false on the path it took.
    const planters = VERTICAL_SLICE_TEMPLATES.flatMap((t) =>
      allAftermathEffects(t)
        .filter((e) => e.kind === 'encounter_seed' && e.templateId === SLICE_TEMPLATE_IDS.fullMoon)
        .map((e) => ({ from: t.id, placed: !!(e as { appointment?: unknown }).appointment })),
    );
    expect(planters.length).toBeGreaterThan(0);
    expect(planters.every((p) => p.placed), `a placeless planter of the kept sequel: ${JSON.stringify(planters)}`).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════
// THR-1468 — every slice encounter authors the `failure` band
// ═════════════════════════════════════════════════════════════════════
//
// **The rule, stated for the next author.** A step whose `failBehavior` is
// `fail_action` can end its action on `failure`. If no aftermath variant
// authors that band, the player still reaches an ending — the *base* one —
// so the omission is silent by construction: nothing throws, nothing warns
// in play, and only a reviewer holding an `?outcome=failure` pin ever sees
// it. That is why it needs a gate rather than a convention.
//
// **What the sweep that filed this got wrong, recorded so it is not redone.**
// THR-1463 measured the five parents by hand and named two. The real
// membership was four (`bargain_at_crossroads`, `full_moon_collection`,
// `swindled_family`, `grateful_kin`), because the two sequels were never
// walked. The cheap correct measurement is not a browser pin per encounter —
// it is `authoredOutcomeBands()`, the same function the `[?outcome]` console
// line reports from. Sharing that function is deliberate: a gate that
// computed authorship its own way could pass while the diagnostic a reviewer
// reads says the opposite.
//
// **And the argument against authoring them, answered.** The ticket floated
// that a Personality Fork's refusal and an Opt-in Complication's decline are
// *branches*, not failures, so those shapes might deliberately have no
// `failure`. The structure says otherwise: the fork picks the branch, and
// then the branch's own step resolves on the full ladder. Every one of those
// steps already authored a distinct `failureAfterimage` — "The word came out
// hedged, and the stranger accepted the hedge with a smile that said it did
// not matter" — and same-shape siblings in this very file (The Swindler
// Found, The Table That Holds) author the band. Giving the word badly is not
// the same event as declining to give it.
// ═════════════════════════════════════════════════════════════════════
// THR-1509 — every PATH authors the losing bands it can reach
// ═════════════════════════════════════════════════════════════════════
//
// **What THR-1468's gate could not see.** It asks `authoredOutcomeBands()`,
// the per-template UNION, whether `failure` is authored anywhere. But a band
// is reached on one path: `resolveAftermathVariant` picks `variants[choiceId]`
// and layers `byOutcome` from that variant alone. The Swindler Found authored
// `failure` on its law arm and `critical_failure` on its alley arm — the
// union read as full coverage while a player on either arm was one band
// short, and the `[?outcome]` line said "Showing the authored ending" over
// the base one. THR-1509 made the verdict per-path; this gate is the
// authoring half, stated as the rule in the slice file's header (rule 3).
//
// **The rule.** A path owes `critical_failure` always — a critical step ends
// the action there whatever its `failBehavior` (`advanceStep`) — and owes
// `failure` when a step on that path is `fail_action`. Winning bands are
// optional per path: every base ending in the file is written as a win.
//
// **Which paths.** Every `variants` key, plus `fallback` only on a
// choice-less config. A fork's `fallback` is unreachable in play: the arm is
// decided by `applyAgentDecidedBranches` before `advanceStep` lands the
// deciding step's outcome, so even a step-0 critical failure resolves onto a
// decided arm. Gating an unreachable path would demand dead content.
//
// **Shared predicate, on purpose.** `authoredOutcomeBandsOnVariant` and
// `reachableLosingBandsOnPath` are the functions the `[?outcome]` verdict is
// built from, so this gate and the console line cannot disagree — the same
// reason THR-1468 shared `authoredOutcomeBands`.
describe('vertical slice — every path authors the losing bands it can reach (THR-1509)', () => {
  /** The paths a player can land on — see "Which paths" above. */
  function reachablePathKeys(template: UnifiedActionTemplate): string[] {
    const config = template.aftermathConfig;
    if (!config) return [];
    const keys = Object.keys(config.variants ?? {});
    return keys.length > 0 ? keys : ['fallback'];
  }

  function missingLosingBands(templates: readonly UnifiedActionTemplate[]): string[] {
    const missing: string[] = [];
    for (const template of templates) {
      for (const key of reachablePathKeys(template)) {
        const owed = reachableLosingBandsOnPath(template, key);
        const has = authoredOutcomeBandsOnVariant(template, key);
        for (const band of owed) {
          if (!has.includes(band)) missing.push(`${template.id}::${key} owes ${band}`);
        }
      }
    }
    return missing;
  }

  it('authors critical_failure on every path, and failure on every path with a fail_action step', () => {
    // Population guards: the predicate is worthless over a shrunken roster or
    // a roster with no forks (the case this gate exists for).
    expect(VERTICAL_SLICE_TEMPLATES.length).toBe(10);
    const forked = VERTICAL_SLICE_TEMPLATES.filter((t) => reachablePathKeys(t).length > 1);
    expect(forked.length, 'no forked template — the per-path gate proves nothing').toBeGreaterThan(0);
    // And the rule must actually ask for `failure` somewhere, or it collapses
    // to the critical_failure-only check.
    expect(
      VERTICAL_SLICE_TEMPLATES.some((t) =>
        reachablePathKeys(t).some((k) => reachableLosingBandsOnPath(t, k).includes('failure')),
      ),
    ).toBe(true);

    const missing = missingLosingBands(VERTICAL_SLICE_TEMPLATES);
    expect(
      missing,
      `these paths can end on a losing band and author no ending for it, so the ` +
        `player gets that path's base ending — written as a win:\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('the predicate actually detects an absence on ONE arm that the union would hide', () => {
    // Falsification arm, aimed at the exact defect: remove `failure` from the
    // swindler's alley arm only. The law arm still authors it, so the
    // per-template union (THR-1468's predicate) stays satisfied — and this
    // gate must reject the template anyway.
    const swindler = VERTICAL_SLICE_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.swindlerFound)!;
    expect(missingLosingBands([swindler])).toEqual([]);

    const negative = swindler.aftermathConfig!.variants.negative!;
    const { failure: _removed, ...withoutFailure } = negative.byOutcome!;
    expect(Object.keys(withoutFailure)).not.toContain('failure');
    const perturbed: UnifiedActionTemplate = {
      ...swindler,
      aftermathConfig: {
        ...swindler.aftermathConfig!,
        variants: {
          ...swindler.aftermathConfig!.variants,
          negative: { ...negative, byOutcome: withoutFailure },
        },
      },
    };

    // The union still says `failure` is authored — that is the laundering.
    expect(authoredOutcomeBands(perturbed)).toContain('failure');
    // The per-path gate does not.
    expect(missingLosingBands([perturbed])).toEqual([
      `${SLICE_TEMPLATE_IDS.swindlerFound}::negative owes failure`,
    ]);
  });

  it('the two new swindler bands do not inherit the base reactions their events contradict', () => {
    // `applyAftermathOutcomeBand` substitutes `reactions` WHOLESALE — a band
    // without its own inherits the base set. Both new bands must author their
    // own, because each base reaction pays a repute the band's event did not
    // earn: the law arm's base GAIN for using the town's law (the law arrived to
    // nothing), the alley arm's base ill-repute for a knife in the story (no
    // fight happened). Pinned so a later "tidy" that drops the reactions to
    // match the sibling bands does not silently re-pay them.
    const swindler = VERTICAL_SLICE_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.swindlerFound)!;
    const lawCritFail = swindler.aftermathConfig!.variants.positive!.byOutcome!.critical_failure;
    expect(lawCritFail?.reactions, 'the law arm critical_failure band must author its own reactions').toBeDefined();
    const lawEffects = (lawCritFail!.reactions ?? []).flatMap((r) => r.effects);
    expect(lawEffects.some((e) => e.kind === 'reputation_tally' && e.key === SLICE_ROAD_REPUTE_KEY)).toBe(false);
    expect(lawEffects.some((e) => e.kind === 'hidden_mark')).toBe(true);

    const alleyFail = swindler.aftermathConfig!.variants.negative!.byOutcome!.failure;
    expect(alleyFail?.reactions, 'the alley arm failure band must author its own reactions').toBeDefined();
    const alleyEffects = (alleyFail!.reactions ?? []).flatMap((r) => r.effects);
    expect(alleyEffects.some((e) => e.kind === 'reputation_tally')).toBe(false);
    expect(alleyEffects.some((e) => e.kind === 'hidden_mark')).toBe(true);
  });
});

describe('vertical slice — every encounter authors the failure band (THR-1468)', () => {
  it('authors `failure` on all ten templates', () => {
    // Population guard: the predicate is worthless over an empty or shrunken
    // roster, and a renamed export would make this gate pass by inspecting
    // nothing (the vacuous-probe shape).
    expect(VERTICAL_SLICE_TEMPLATES.length).toBe(10);

    const missing = VERTICAL_SLICE_TEMPLATES.filter(
      (t) => !authoredOutcomeBands(t).includes('failure'),
    ).map((t) => t.id);

    expect(
      missing,
      `these encounters end on \`failure\` and author no band for it, so the ` +
        `player gets the base ending:\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('the predicate actually detects an absence', () => {
    // Falsification arm. Without this, the assertion above passes identically
    // whether `authoredOutcomeBands` reads the band keys or returns a constant,
    // and a gate that cannot fail is not a gate. Perturb one template by
    // removing the band this suite exists to require, and confirm the
    // predicate rejects it.
    const kin = VERTICAL_SLICE_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.gratefulKin)!;
    expect(authoredOutcomeBands(kin)).toContain('failure');

    const { failure: _removed, ...withoutFailure } = kin.aftermathConfig!.fallback.byOutcome!;
    const perturbed: UnifiedActionTemplate = {
      ...kin,
      aftermathConfig: {
        ...kin.aftermathConfig!,
        fallback: { ...kin.aftermathConfig!.fallback, byOutcome: withoutFailure },
      },
    };

    // The arm is only meaningful if the perturbation actually changed something.
    expect(Object.keys(withoutFailure)).not.toContain('failure');
    expect(authoredOutcomeBands(perturbed)).not.toContain('failure');
  });

  it('the new failure bands do not drop the writes their paths exist to make', () => {
    // `applyAftermathOutcomeBand` substitutes `reactions` **wholesale**, so a
    // band that authors its own silently drops everything the variant's base
    // reaction wrote. Three of the four new bands therefore author
    // `overview`/`changes` only, and this pins that — the failure mode is
    // invisible in play and would read as "the sequel just never fired".
    const crossroads = VERTICAL_SLICE_TEMPLATES.find(
      (t) => t.id === SLICE_TEMPLATE_IDS.crossroads,
    )!;
    const acceptFailure = crossroads.aftermathConfig!.variants.negative!.byOutcome!.failure;
    expect(acceptFailure, 'the accept path lost its failure band').toBeDefined();
    expect(
      acceptFailure!.reactions,
      'the accept-path failure band authors reactions, which replaces the base ' +
        'reaction wholesale and drops the promise grant + the Full Moon seed',
    ).toBeUndefined();

    const fullMoon = VERTICAL_SLICE_TEMPLATES.find(
      (t) => t.id === SLICE_TEMPLATE_IDS.fullMoon,
    )!;
    const collectionFailure = fullMoon.aftermathConfig!.fallback.byOutcome!.failure;
    expect(collectionFailure, 'the collection lost its failure band').toBeDefined();
    expect(
      collectionFailure!.reactions,
      'the collection failure band authors reactions, which drops the gift the ' +
        'base reaction spawns — a badly stood exchange still hands over the parcel',
    ).toBeUndefined();

    // The Grateful Kin is the exception and must author its own: the base
    // reaction writes the plain-success door, so inheriting it would have a
    // fumbled thanks open the door exactly as wide as a well-stood one.
    const kin = VERTICAL_SLICE_TEMPLATES.find((t) => t.id === SLICE_TEMPLATE_IDS.gratefulKin)!;
    const kinFailure = kin.aftermathConfig!.fallback.byOutcome!.failure;
    expect(kinFailure?.reactions, 'the kin failure band must write its own door').toBeDefined();
    const kinEffects = (kinFailure!.reactions ?? []).flatMap((r) => r.effects);
    const door = kinEffects.find((e) => e.kind === 'reputation_with');
    expect(door && door.kind === 'reputation_with' ? door.delta : undefined).toBe(
      SLICE_KIN_WELCOME_DELTA_FUMBLED,
    );
    // Restated, not inherited — for the same wholesale-replacement reason.
    expect(
      kinEffects.some(
        (e) => e.kind === 'encounter_seed' && e.templateId === SLICE_TEMPLATE_IDS.tableThatHolds,
      ),
      'the kin failure band dropped the table seed by omission',
    ).toBe(true);
  });
});
