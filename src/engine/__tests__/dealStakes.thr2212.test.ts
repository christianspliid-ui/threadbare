/**
 * THR-2212 — a dealt hand reads how hard the step is.
 *
 * Plan: `Docs/plans/2026-11-13-thr-2203-stop-only-for-real-decisions.md` slice B.
 *
 * The census below is the proto branch's (`proto/thr-2203-deal-census`) kept as
 * a real test: every registry step that declares `deal`, dealt to a fresh god of
 * each hunger with two sphere pairs (24 gods). Before the change one hand was
 * dealt on 67% of dealing steps (8.1 distinct hands); census arm D measured
 * 0.27 / 25.1. The test pins the plan's floor, not the measurement, so tuning
 * inside the band does not break it.
 */

import { describe, expect, it } from 'vitest';
import {
  CACHE_REGISTERED_REGIONAL_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
} from '../../data/unified-action-templates';
import { buildRepertoire } from '../nudgeCardRepertoire';
import { dealHand, stakesBandFor, stakesTermFor } from '../encounters/dealHand';
import { HUNGER_IDS } from '../../types/hunger';
import { SPHERE_NAMES } from '../../types';
import type { SphereName } from '../../types';
import type { ActionStep } from '../../types/unifiedAction';
import { nudgeCardMember } from '../../data/nudge-card-library';
import {
  DEAL_STAKES_EASY_BELOW,
  DEAL_STAKES_HARD_FROM,
  DEAL_STAKES_WEIGHT,
} from '../../data/nudge-constants';

/** Census floor from the plan's Done-when (arm D measured 0.27 / 25.1). */
const CENSUS_MAX_MEAN_MODAL_SHARE = 0.35;
const CENSUS_MIN_MEAN_DISTINCT_HANDS = 20;
/** The witness Mind/Spirit god across the nine named steps (arm D: 5). */
const NAMED_STEPS_MIN_DISTINCT_HANDS = 3;
const NAMED_TEMPLATES = /Shrine|Shadow in the Night|Inheritance Wake|Refugee Aid/;

interface DealingStep {
  readonly templateName: string;
  readonly stepIndex: number;
  readonly step: ActionStep;
}

function collectDealingSteps(): DealingStep[] {
  const seen = new Set<string>();
  const templates = [
    ...UNIFIED_ACTION_TEMPLATES,
    ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
    ...CACHE_REGISTERED_REGIONAL_TEMPLATES,
  ].filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
  const out: DealingStep[] = [];
  for (const t of templates) {
    (t.steps ?? []).forEach((step, i) => {
      if (step?.deal) out.push({ templateName: t.name, stepIndex: i, step });
      const variants = (step as { variants?: Record<string, ActionStep> } | undefined)?.variants;
      for (const v of Object.values(variants ?? {})) {
        if (v?.deal) out.push({ templateName: t.name, stepIndex: i, step: v });
      }
    });
  }
  return out;
}

function handKey(step: ActionStep, primary: SphereName, secondary: SphereName, repertoire: ReturnType<typeof buildRepertoire>): string {
  const r = dealHand(step, repertoire, { primarySphere: primary, secondarySphere: secondary, tags: step.deal?.tags });
  return [...r.report.dealt].sort().join('|');
}

describe('THR-2212 stakes lean — the term itself', () => {
  const boost = nudgeCardMember('card.boost.core')!;
  const insurance = nudgeCardMember('card.insurance.core')!;
  const mercy = nudgeCardMember('card.mercy.core')!;
  const trait = nudgeCardMember('card.trait_card.core')!;

  it('the core cards exist (no vacuous pass)', () => {
    expect([boost, insurance, mercy, trait].every(Boolean)).toBe(true);
  });

  it('bands by authored difficulty', () => {
    expect(stakesBandFor(0)).toBe('easy');
    expect(stakesBandFor(DEAL_STAKES_EASY_BELOW - 0.01)).toBe('easy');
    expect(stakesBandFor(DEAL_STAKES_EASY_BELOW)).toBe('middle');
    expect(stakesBandFor(DEAL_STAKES_HARD_FROM - 0.01)).toBe('middle');
    expect(stakesBandFor(DEAL_STAKES_HARD_FROM)).toBe('hard');
    expect(stakesBandFor(undefined)).toBeUndefined();
    expect(stakesBandFor(Number.NaN)).toBeUndefined();
  });

  it('easy favours the guard cards, hard the odds cards, middle Draw On Character', () => {
    expect(stakesTermFor(insurance, 0.1)).toBe(DEAL_STAKES_WEIGHT);
    expect(stakesTermFor(mercy, 0.1)).toBe(DEAL_STAKES_WEIGHT);
    expect(stakesTermFor(boost, 0.1)).toBe(0);
    expect(stakesTermFor(trait, 0.4)).toBe(DEAL_STAKES_WEIGHT);
    expect(stakesTermFor(boost, 0.4)).toBe(0);
    expect(stakesTermFor(boost, 0.8)).toBe(DEAL_STAKES_WEIGHT);
    expect(stakesTermFor(trait, 0.8)).toBe(DEAL_STAKES_WEIGHT);
    expect(stakesTermFor(insurance, 0.8)).toBe(0);
  });

  it('a step with no numeric difficulty gets no lean (fail-soft: today\'s deal)', () => {
    expect(stakesTermFor(boost, undefined)).toBe(0);
  });

  it('signature cards never get the lean', () => {
    const sig = nudgeCardMember('card.boost.signature.mind');
    if (sig) expect(stakesTermFor(sig, 0.9)).toBe(0);
  });

  it('every candidate in the deal report carries stakesTerm', () => {
    const repertoire = buildRepertoire({ primary: 'mind', secondary: 'spirit', hunger: 'witness', unlockedActionIds: new Set() });
    const step = { nudges: [], deal: { count: 4 }, difficulty: 0.8 } as unknown as ActionStep;
    const r = dealHand(step, repertoire, { primarySphere: 'mind', secondarySphere: 'spirit' });
    expect(r.report.candidates.length).toBeGreaterThan(0);
    expect(r.report.candidates.every((c) => typeof c.stakesTerm === 'number')).toBe(true);
    expect(r.report.candidates.some((c) => c.stakesTerm > 0)).toBe(true);
  });
});

describe('THR-2212 deal census — hands vary with the step', () => {
  const dealingSteps = collectDealingSteps();

  it('the registry has dealing steps across all three bands (no vacuous pass)', () => {
    expect(dealingSteps.length).toBeGreaterThan(100);
    const bands = new Set(dealingSteps.map((d) => stakesBandFor(d.step.difficulty)));
    expect(bands).toEqual(new Set(['easy', 'middle', 'hard']));
  });

  it('the same god at the same step is dealt the same hand twice (Law 21)', () => {
    const repertoire = buildRepertoire({ primary: 'mind', secondary: 'spirit', hunger: 'witness', unlockedActionIds: new Set() });
    for (const d of dealingSteps.slice(0, 40)) {
      const a = dealHand(d.step, repertoire, { primarySphere: 'mind', secondarySphere: 'spirit', tags: d.step.deal?.tags });
      const b = dealHand(d.step, repertoire, { primarySphere: 'mind', secondarySphere: 'spirit', tags: d.step.deal?.tags });
      expect(b.report.dealt).toEqual(a.report.dealt);
    }
  });

  it(`across the 24 hunger × sphere gods: mean modal share ≤ ${CENSUS_MAX_MEAN_MODAL_SHARE}, mean distinct hands ≥ ${CENSUS_MIN_MEAN_DISTINCT_HANDS}`, () => {
    const spheres = SPHERE_NAMES as readonly SphereName[];
    let sumDistinct = 0;
    let sumModalShare = 0;
    let gods = 0;
    HUNGER_IDS.forEach((hunger, hi) => {
      for (const offset of [0, 3]) {
        const primary = spheres[(hi + offset) % spheres.length];
        const secondary = spheres[(hi + offset + 5) % spheres.length];
        const repertoire = buildRepertoire({ primary, secondary, hunger, unlockedActionIds: new Set() });
        const counts = new Map<string, number>();
        for (const d of dealingSteps) {
          const key = handKey(d.step, primary, secondary, repertoire);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        gods++;
        sumDistinct += counts.size;
        sumModalShare += Math.max(...counts.values()) / dealingSteps.length;
      }
    });
    expect(gods).toBe(24);
    const meanDistinct = sumDistinct / gods;
    const meanModal = sumModalShare / gods;
    console.log(`[THR-2212 census] dealingSteps=${dealingSteps.length} mean distinctHands=${meanDistinct.toFixed(1)} modalShare=${meanModal.toFixed(2)}`);
    expect(meanModal).toBeLessThanOrEqual(CENSUS_MAX_MEAN_MODAL_SHARE);
    expect(meanDistinct).toBeGreaterThanOrEqual(CENSUS_MIN_MEAN_DISTINCT_HANDS);
  });

  it(`the witness Mind/Spirit god gets ≥ ${NAMED_STEPS_MIN_DISTINCT_HANDS} hands across the named chapters' steps`, () => {
    const repertoire = buildRepertoire({ primary: 'mind', secondary: 'spirit', hunger: 'witness', unlockedActionIds: new Set() });
    const named = dealingSteps.filter((d) => NAMED_TEMPLATES.test(d.templateName));
    expect(named.length).toBeGreaterThanOrEqual(4);
    const hands = new Set(named.map((d) => handKey(d.step, 'mind', 'spirit', repertoire)));
    console.log(`[THR-2212 census] named steps=${named.length} distinct hands=${hands.size}`);
    expect(hands.size).toBeGreaterThanOrEqual(NAMED_STEPS_MIN_DISTINCT_HANDS);
  });
});
