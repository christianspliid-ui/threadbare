/**
 * THR-2157 — the mortal decides Flawed Steel and the five sphere story beats.
 *
 * Each of these used to key its aftermath variants to the ids of the cards the
 * god clicked on step 0, so the click picked the ending. Five now fork on a
 * value axis (`decidedBy`, THR-894 pole mode); Flawed Steel, with three endings,
 * forks on three routes (THR-898). The god argues with a composed hand. This
 * suite pins the slice's Done-when over the **shipped** catalog
 * (`UNIFIED_ACTION_TEMPLATES`), not the module exports, so a template that is
 * converted in its file but registered from somewhere else still fails here.
 */

import { describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { isActionStepBranch, isRouteDecision } from '../../../types/unifiedAction';
import type { ActionStepBranch, UnifiedActionTemplate } from '../../../types/unifiedAction';
import {
  assertAftermathVariantsProducible,
  assertDecidedAftermathReachable,
} from '../../../testing/contentInvariants';
import { checkComposedHand, checkNudgeHand } from '../../content-eval/nudgeHandChecklist';
import { encounterStakesProblems } from '../../content-eval/encounterStakesRules';

/** Template id → the axis its endings disagree on (recorded in each file header). */
const POLE_SLICE: Readonly<Record<string, string>> = {
  'star.turning.comet_omen': 'tradition_novelty',
  'stone.permanence.mason_lord_wall': 'mercy_ruthlessness',
  'veil.truth.page_beneath_saint': 'honesty_cunning',
  'eye.reckoning.verdict_that_burns': 'mercy_ruthlessness',
  'gold.famine.merchant_granaries': 'asceticism_extravagance',
};

const FLAWED_STEEL = 'crafting.quest.flawed_steel';
const FLAWED_STEEL_ROUTES = ['forge_the_truth', 'keep_your_hand_folded', 'temper_the_narrative'];

const ALL = [...Object.keys(POLE_SLICE), FLAWED_STEEL];

function shipped(id: string): UnifiedActionTemplate {
  const found = UNIFIED_ACTION_TEMPLATES.filter(t => t.id === id);
  expect(found, `${id} is registered exactly once in UNIFIED_ACTION_TEMPLATES`).toHaveLength(1);
  return found[0];
}

function theFork(template: UnifiedActionTemplate): ActionStepBranch {
  const fork = template.steps.filter(isActionStepBranch) as ActionStepBranch[];
  expect(fork).toHaveLength(1);
  return fork[0];
}

describe('THR-2157 — the mortal decides Flawed Steel and the five story beats', () => {
  for (const id of ALL) {
    describe(id, () => {
      it('carries no authoredChoices on the shipped catalog', () => {
        expect(shipped(id).authoredChoices).toBeUndefined();
      });

      it('the deciding step deals a non-empty hand with pole- or route-leaning cards', () => {
        const template = shipped(id);
        const step = template.steps[template.aftermathConfig!.branchOnStep];
        if (isActionStepBranch(step)) throw new Error('deciding step must be concrete');
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
    it(`${id} forks on ${axis}, keyed to the poles, and argues both`, () => {
      const template = shipped(id);
      const cfg = template.aftermathConfig!;
      const fork = theFork(template);
      expect(fork.branchOnStep).toBe(cfg.branchOnStep);
      expect(fork.decidedBy).toEqual({ axis });
      expect(Object.keys(fork.variants).sort()).toEqual(['negative', 'positive']);
      expect(Object.keys(cfg.variants).sort()).toEqual(['negative', 'positive']);

      const step = template.steps[cfg.branchOnStep];
      if (isActionStepBranch(step)) throw new Error('deciding step must be concrete');
      const toward = new Set((step.nudges ?? [])
        .filter(n => n.poleLean && typeof n.poleLean === 'object' && 'axis' in n.poleLean && n.poleLean.axis === axis)
        .map(n => (n.poleLean as { toward: string }).toward));
      expect([...toward].sort()).toEqual(['negative', 'positive']);
    });
  }

  it('Flawed Steel forks on three routes keyed to its three endings', () => {
    const template = shipped(FLAWED_STEEL);
    const cfg = template.aftermathConfig!;
    const fork = theFork(template);
    expect(fork.branchOnStep).toBe(cfg.branchOnStep);
    expect(fork.decidedBy && isRouteDecision(fork.decidedBy)).toBe(true);
    const routes = fork.decidedBy && isRouteDecision(fork.decidedBy) ? fork.decidedBy.routes : [];
    expect(routes.map(r => r.key).sort()).toEqual(FLAWED_STEEL_ROUTES);
    expect(Object.keys(fork.variants).sort()).toEqual(FLAWED_STEEL_ROUTES);
    expect(Object.keys(cfg.variants).sort()).toEqual(FLAWED_STEEL_ROUTES);
    // The two routes the ruling names are each argued by a card.
    const step = template.steps[cfg.branchOnStep];
    if (isActionStepBranch(step)) throw new Error('deciding step must be concrete');
    const argued = new Set((step.nudges ?? [])
      .map(n => (n.poleLean && typeof n.poleLean === 'object' && 'route' in n.poleLean ? n.poleLean.route : undefined))
      .filter(Boolean));
    expect([...argued].sort()).toEqual(['forge_the_truth', 'temper_the_narrative']);
  });
});
