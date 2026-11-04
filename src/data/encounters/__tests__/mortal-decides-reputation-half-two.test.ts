/**
 * THR-2160 — the mortal decides the reputation encounters, half two.
 *
 * Each of these used to key its aftermath variants to the ids of the cards the
 * god clicked on step 0, so the click picked the ending. Each now forks through
 * `decidedBy` in pole mode (THR-894) on the value axis its two endings disagree
 * on, and the god argues with a composed hand. This suite pins the slice's
 * Done-when over the **shipped** catalog (`UNIFIED_ACTION_TEMPLATES`), not the
 * module exports.
 */

import { describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { isActionStepBranch } from '../../../types/unifiedAction';
import type { ActionStepBranch, UnifiedActionTemplate } from '../../../types/unifiedAction';
import {
  assertAftermathVariantsProducible,
  assertDecidedAftermathReachable,
} from '../../../testing/contentInvariants';
import { checkComposedHand, checkNudgeHand } from '../../content-eval/nudgeHandChecklist';
import { encounterStakesProblems } from '../../content-eval/encounterStakesRules';

/** Template → the axis its two endings disagree on (recorded in each file header). */
const POLE_SLICE: Readonly<Record<string, string>> = {
  'reputation.star.the_star_pilgrim': 'sacrifice_survival',
  'reputation.shadow.the_infiltrators_approach': 'honesty_cunning',
  'reputation.power.the_renowned_duel': 'courage_prudence',
  'reputation.iron.the_executioners_commission': 'mercy_ruthlessness',
  'reputation.gold.the_unmarked_crossing': 'asceticism_extravagance',
  'reputation.veil.the_silent_chamber': 'revelation_discretion',
  'reputation.stone.the_jury_of_the_ruined': 'loyalty_ambition',
  'reputation.eye.the_blinded_oracle': 'revelation_discretion',
};

function shipped(id: string): UnifiedActionTemplate {
  const found = UNIFIED_ACTION_TEMPLATES.filter(t => t.id === id);
  expect(found, `${id} is registered exactly once in UNIFIED_ACTION_TEMPLATES`).toHaveLength(1);
  return found[0];
}

function fork(template: UnifiedActionTemplate): ActionStepBranch {
  const forks = template.steps.filter(isActionStepBranch) as ActionStepBranch[];
  expect(forks).toHaveLength(1);
  expect(forks[0].branchOnStep).toBe(template.aftermathConfig!.branchOnStep);
  return forks[0];
}

function decidingStep(template: UnifiedActionTemplate) {
  const step = template.steps[template.aftermathConfig!.branchOnStep];
  if (isActionStepBranch(step)) throw new Error('deciding step must be concrete');
  return step;
}

describe('THR-2160 — the mortal decides the reputation encounters, half two', () => {
  for (const [id, axis] of Object.entries(POLE_SLICE)) {
    describe(id, () => {
      it('carries no authoredChoices on the shipped catalog', () => {
        expect(shipped(id).authoredChoices).toBeUndefined();
      });

      it('the deciding step deals a non-empty hand', () => {
        const step = decidingStep(shipped(id));
        expect(step.nudges?.length ?? 0).toBeGreaterThan(0);
        expect(step.deal?.count ?? 0).toBeGreaterThan(0);
      });

      it('passes the aftermath-reachability and producibility invariants', () => {
        const template = shipped(id);
        expect(() => assertDecidedAftermathReachable(template)).not.toThrow();
        expect(() => assertAftermathVariantsProducible(template)).not.toThrow();
      });

      it('passes the hand checklist and the composed-hand rules', () => {
        const template = shipped(id);
        expect(checkNudgeHand(template)).toEqual([]);
        expect(checkComposedHand(template)).toEqual([]);
      });

      it('its stakes arms name real fork arms', () => {
        expect(encounterStakesProblems(shipped(id))).toEqual([]);
      });

      it(`forks on ${axis}, keyed to the poles, and its hand argues both`, () => {
        const template = shipped(id);
        const branch = fork(template);
        expect(branch.decidedBy).toEqual({ axis });
        expect(Object.keys(branch.variants).sort()).toEqual(['negative', 'positive']);
        expect(Object.keys(template.aftermathConfig!.variants).sort()).toEqual(['negative', 'positive']);
        const toward = new Set((decidingStep(template).nudges ?? [])
          .filter(n => n.poleLean && typeof n.poleLean === 'object' && 'axis' in n.poleLean && n.poleLean.axis === axis)
          .map(n => (n.poleLean as { toward: string }).toward));
        expect([...toward].sort()).toEqual(['negative', 'positive']);
      });

      it('step-1 prose has the mortal act, never the god choosing for them', () => {
        const branch = fork(shipped(id));
        for (const variant of Object.values(branch.variants)) {
          expect(variant.narrativeTemplate ?? '').not.toMatch(/\bThe god\b/);
        }
      });
    });
  }
});
