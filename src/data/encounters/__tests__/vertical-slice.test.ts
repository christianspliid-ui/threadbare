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
  EncounterAftermathReactionEffect,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import { isActionStepBranch } from '../../../types/unifiedAction';
import {
  SLICE_TEMPLATE_IDS,
  VERTICAL_SLICE_TEMPLATES,
} from '../vertical-slice';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { expandSettings, validateSettingEnvelope } from '../../settingClasses';
import { checkNudgeHand, nudgeBearingSteps } from '../../content-eval/nudgeHandChecklist';
import { validateNudgeGrantRefs, formatDeadNudgeGrantRefs } from '../../../engine/nudgeGrantLiveness';

/** Every aftermath effect authored anywhere on a template. */
function allAftermathEffects(template: UnifiedActionTemplate): EncounterAftermathReactionEffect[] {
  const out: EncounterAftermathReactionEffect[] = [];
  const config = template.aftermathConfig;
  if (!config) return out;
  const variants = [...Object.values(config.variants), config.fallback];
  for (const variant of variants) {
    for (const reaction of variant.reactions ?? []) out.push(...reaction.effects);
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
    const directions = new Set(
      leans.map((l) => (typeof l.poleLean === 'string' ? l.poleLean : l.poleLean!.toward)),
    );
    expect(directions.has('positive'), `${template.id}: no card leans positive`).toBe(true);
    expect(directions.has('negative'), `${template.id}: no card leans negative`).toBe(true);
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
