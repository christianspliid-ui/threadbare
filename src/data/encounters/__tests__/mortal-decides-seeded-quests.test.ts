/**
 * THR-2158 — the mortal decides the six seeded quests.
 *
 * Each of these used to key its two aftermath variants to the ids of the cards
 * the god clicked on step 0, so the click picked the ending. Each now forks on a
 * value axis (`decidedBy`, THR-894 pole mode) and the god argues with a composed
 * hand. This suite pins the slice's Done-when over the **shipped** catalog
 * (`UNIFIED_ACTION_TEMPLATES`), not the module exports, so a template that is
 * converted in its file but registered from somewhere else still fails here.
 */

import { describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { isActionStepBranch } from '../../../types/unifiedAction';
import type { ActionStepBranch, UnifiedActionTemplate } from '../../../types/unifiedAction';
import {
  assertAftermathVariantsProducible,
  assertDecidedAftermathReachable,
  assertNoRetiredPlayerPickField,
} from '../../../testing/contentInvariants';
import { checkComposedHand, checkNudgeHand } from '../../content-eval/nudgeHandChecklist';
import { encounterStakesProblems } from '../../content-eval/encounterStakesRules';

/** Template id → the axis its endings disagree on (recorded in each file header). */
const SLICE: Readonly<Record<string, string>> = {
  'broker.quest.rival_shrine_betrayal': 'loyalty_ambition',
  'liminal.quest.soul_ferryman': 'sacrifice_survival',
  'liminal.quest.road_ambush': 'mercy_ruthlessness',
  'enc.courtyard_duel': 'courage_prudence',
  'enc.brink_rescue': 'sacrifice_survival',
  'enc.letters_of_introduction': 'honesty_cunning',
};

function shipped(id: string): UnifiedActionTemplate {
  const found = UNIFIED_ACTION_TEMPLATES.filter(t => t.id === id);
  expect(found, `${id} is registered exactly once in UNIFIED_ACTION_TEMPLATES`).toHaveLength(1);
  return found[0];
}

describe('THR-2158 — the mortal decides the six seeded quests', () => {
  for (const [id, axis] of Object.entries(SLICE)) {
    describe(id, () => {
      it('carries no retired player-pick field on the shipped catalog', () => {
        assertNoRetiredPlayerPickField(shipped(id));
      });

      it(`forks on ${axis}, keyed to the poles`, () => {
        const template = shipped(id);
        const cfg = template.aftermathConfig!;
        const fork = template.steps.filter(isActionStepBranch) as ActionStepBranch[];
        expect(fork).toHaveLength(1);
        expect(fork[0].branchOnStep).toBe(cfg.branchOnStep);
        expect(fork[0].decidedBy).toEqual({ axis });
        expect(Object.keys(fork[0].variants).sort()).toEqual(['negative', 'positive']);
        expect(Object.keys(cfg.variants).sort()).toEqual(['negative', 'positive']);
      });

      it('the deciding step deals a non-empty hand arguing both poles', () => {
        const template = shipped(id);
        const step = template.steps[template.aftermathConfig!.branchOnStep];
        if (isActionStepBranch(step)) throw new Error('deciding step must be concrete');
        expect(step.nudges?.length ?? 0).toBeGreaterThan(0);
        const toward = new Set((step.nudges ?? [])
          .filter(n => n.poleLean && 'axis' in n.poleLean && n.poleLean.axis === axis)
          .map(n => (n.poleLean as { toward: string }).toward));
        expect([...toward].sort()).toEqual(['negative', 'positive']);
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
    });
  }
});
