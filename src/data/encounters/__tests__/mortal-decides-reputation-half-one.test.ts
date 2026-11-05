/**
 * THR-2159 — the mortal decides the reputation encounters, half one.
 *
 * Each of these used to key its aftermath variants to the ids of the cards the
 * god clicked on step 0, so the click picked the ending. Each now forks through
 * `decidedBy` — pole mode (THR-894) for the two-ending encounters, route mode
 * (THR-898) for the three-way Tribute and Consultation — and the god argues with
 * a composed hand. This suite pins the slice's Done-when over the **shipped**
 * catalog (`UNIFIED_ACTION_TEMPLATES`), not the module exports.
 */

import { describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { isActionStepBranch, isRouteDecision } from '../../../types/unifiedAction';
import type { ActionStepBranch, UnifiedActionTemplate } from '../../../types/unifiedAction';
import {
  assertAftermathVariantsProducible,
  assertDecidedAftermathReachable,
  assertNoRetiredPlayerPickField,
} from '../../../testing/contentInvariants';
import { checkComposedHand, checkNudgeHand } from '../../content-eval/nudgeHandChecklist';
import { encounterStakesProblems } from '../../content-eval/encounterStakesRules';

/** Pole-mode templates → the axis their endings disagree on (in each file header). */
const POLE_SLICE: Readonly<Record<string, string>> = {
  'reputation.shadow.shadow_court_audience': 'honesty_cunning',
  'reputation.heart.pilgrims_offering': 'tradition_novelty',
  'reputation.stone.the_stones_judgement': 'preservation_transformation',
  'reputation.gold.the_merchants_favor': 'asceticism_extravagance',
  'reputation.eye.the_oracle_consulted': 'revelation_discretion',
};

/** Route-mode templates → their route keys (the old variant keys, kept). */
const ROUTE_SLICE: Readonly<Record<string, readonly string[]>> = {
  'reputation.iron.warlords_tribute': ['accept_the_tribute', 'demand_the_oath', 'withdraw_your_hand'],
  'reputation.veil.the_veiled_consultation': ['interpret_plainly', 'refuse_the_reading', 'withhold_half_as_leverage'],
};

const ALL_IDS = [...Object.keys(POLE_SLICE), ...Object.keys(ROUTE_SLICE)];

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

describe('THR-2159 — the mortal decides the reputation encounters, half one', () => {
  for (const id of ALL_IDS) {
    describe(id, () => {
      it('carries no retired player-pick field on the shipped catalog', () => {
        assertNoRetiredPlayerPickField(shipped(id));
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
    });
  }

  for (const [id, axis] of Object.entries(POLE_SLICE)) {
    it(`${id} forks on ${axis}, keyed to the poles, and its hand argues both`, () => {
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
  }

  for (const [id, keys] of Object.entries(ROUTE_SLICE)) {
    it(`${id} is a route fork over ${keys.join(' / ')}, and every special argues a declared course`, () => {
      const template = shipped(id);
      const branch = fork(template);
      expect(branch.decidedBy && isRouteDecision(branch.decidedBy)).toBe(true);
      const routes = branch.decidedBy && isRouteDecision(branch.decidedBy) ? branch.decidedBy.routes : [];
      expect(routes.map(r => r.key).sort()).toEqual([...keys].sort());
      expect(Object.keys(branch.variants).sort()).toEqual([...keys].sort());
      expect(Object.keys(template.aftermathConfig!.variants).sort()).toEqual([...keys].sort());
      // Distinct reaches: the mortal's capability is what separates the courses.
      expect(new Set(routes.map(r => r.reach)).size).toBe(routes.length);
      for (const nudge of decidingStep(template).nudges ?? []) {
        const lean = nudge.poleLean;
        expect(lean && typeof lean === 'object', `${nudge.id} leans`).toBe(true);
        if (lean && typeof lean === 'object' && 'route' in lean) {
          expect(keys).toContain(lean.route);
        } else if (lean && typeof lean === 'object' && 'axis' in lean) {
          expect(routes.some(r => r.axis === lean.axis), `${nudge.id} argues an axis a route declares`).toBe(true);
        }
      }
    });
  }
});
