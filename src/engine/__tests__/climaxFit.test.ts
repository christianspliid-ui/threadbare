/**
 * THR-2227 (plan THR-2204 slice 2) — the Apotheosis hand: earned slots, the stored
 * fit, the dealer's named exception, and the lines above the hand.
 */
import { describe, it, expect } from 'vitest';
import { apotheosisEarnedSlots } from '../climaxFit';
import { applyClimaxFit, resolveStepDefinition } from '../unifiedActionLifecycle';
import { dealHandMaxFor, dealHandMaxTotalDeltaFor } from '../encounters/dealHand';
import { apotheosisClimaxLine } from '../views/stage/buildNudgePhaseModel';
import { fillApotheosisLine } from '../apotheosisLines';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { APOTHEOSIS_ASCENSION_TEMPLATE } from '../../data/encounters/apotheosis-ascension';
import {
  APOTHEOSIS_ARRIVAL_LINE,
  APOTHEOSIS_EMPTY_PURSE_LINE,
} from '../../data/aspect-content';
import {
  APOTHEOSIS_EARNED_SLOTS_MAX,
  APOTHEOSIS_HAND_MAX,
  APOTHEOSIS_PAID_CHAPTERS_PER_SLOT,
  CLIMAX_BARE_FORECAST,
  DEAL_HAND_MAX,
  DEAL_HAND_MAX_TOTAL_DELTA,
} from '../../data/nudge-constants';
import type { ActionStep, ClimaxStepFit, UnifiedActionTemplate } from '../../types/unifiedAction';
import { isActionStepBranch } from '../../types/unifiedAction';

const FIRST = 'actor.first';

function paidChapters(n: number, actorId = FIRST) {
  return Array.from({ length: n }, () => ({ actorId, godPaid: true as const, resolved: true }));
}

/** Every concrete step of a template: plain steps, branch variants and fallbacks. */
function allSteps(template: UnifiedActionTemplate): ActionStep[] {
  return template.steps.flatMap((s) =>
    isActionStepBranch(s) ? [...Object.values(s.variants), s.fallback] : [s]);
}

describe('apotheosisEarnedSlots', () => {
  it('earns one card per paid-chapters block, capped', () => {
    expect(apotheosisEarnedSlots([], FIRST)).toBe(0);
    expect(apotheosisEarnedSlots(paidChapters(APOTHEOSIS_PAID_CHAPTERS_PER_SLOT - 1), FIRST)).toBe(0);
    expect(apotheosisEarnedSlots(paidChapters(APOTHEOSIS_PAID_CHAPTERS_PER_SLOT), FIRST)).toBe(1);
    expect(apotheosisEarnedSlots(paidChapters(APOTHEOSIS_PAID_CHAPTERS_PER_SLOT * 2), FIRST)).toBe(2);
    expect(apotheosisEarnedSlots(paidChapters(50), FIRST)).toBe(APOTHEOSIS_EARNED_SLOTS_MAX);
  });

  it("counts only this mortal's chapters the god paid into", () => {
    const archive = [
      ...paidChapters(APOTHEOSIS_PAID_CHAPTERS_PER_SLOT, 'actor.other'),
      ...Array.from({ length: 6 }, () => ({ actorId: FIRST, resolved: true })),
    ];
    expect(apotheosisEarnedSlots(archive, FIRST)).toBe(0);
    expect(apotheosisEarnedSlots(undefined, FIRST)).toBe(0);
  });
});

describe('the stored fit', () => {
  const step1 = resolveStepDefinition(APOTHEOSIS_ASCENSION_TEMPLATE, 1, [
    { stepIndex: 0, stepId: 's0', choiceId: 'positive', choiceText: '', interventionType: 'pole', essenceSpent: 0, probabilityBoost: 0, tick: 1 },
  ] as never);
  const fit: ClimaxStepFit = { stepIndex: 1, fittedDifficulty: 0.77, bareChance: 0.45, fitted: true, earnedSlots: 2 };

  it('replaces the difficulty and adds the earned slots on its own step', () => {
    const applied = applyClimaxFit(step1, 1, fit);
    expect(applied.difficulty).toBe(0.77);
    expect(applied.deal?.count).toBe((step1.deal?.count ?? 0) + 2);
  });

  it('leaves another step, and a step that asks for no fit, identical by reference', () => {
    expect(applyClimaxFit(step1, 0, fit)).toBe(step1);
    const plain = allSteps(UNIFIED_ACTION_TEMPLATES[0])[0];
    expect(applyClimaxFit(plain, 0, { ...fit, stepIndex: 0 })).toBe(plain);
    expect(applyClimaxFit(step1, 1, undefined)).toBe(step1);
  });

  it('reaches every reader through resolveStepDefinition', () => {
    const history = [{ stepIndex: 0, choiceId: 'negative' }] as never;
    const withFit = resolveStepDefinition(APOTHEOSIS_ASCENSION_TEMPLATE, 1, history, fit);
    expect(withFit.difficulty).toBe(0.77);
    const without = resolveStepDefinition(APOTHEOSIS_ASCENSION_TEMPLATE, 1, history);
    expect(without.difficulty).not.toBe(0.77);
  });
});

describe('the Apotheosis template carries the climax hand', () => {
  const step0 = APOTHEOSIS_ASCENSION_TEMPLATE.steps[0] as ActionStep;
  const fork = APOTHEOSIS_ASCENSION_TEMPLATE.steps[1];

  it('fits both steps to the climax forecast', () => {
    expect(step0.fitBareForecast).toBe(CLIMAX_BARE_FORECAST);
    for (const step of allSteps({ ...APOTHEOSIS_ASCENSION_TEMPLATE, steps: [fork] })) {
      expect(step.fitBareForecast).toBe(CLIMAX_BARE_FORECAST);
    }
  });

  it('gives both deciding poles the authored seven, a deal and the earned marker', () => {
    expect(isActionStepBranch(fork)).toBe(true);
    for (const step of allSteps({ ...APOTHEOSIS_ASCENSION_TEMPLATE, steps: [fork] })) {
      expect(step.nudges).toHaveLength(7);
      expect(step.deal?.count).toBe(1);
      expect(step.dealEarned).toBe('apotheosis');
      expect(dealHandMaxFor(step)).toBe(APOTHEOSIS_HAND_MAX);
      // 7 authored + 1 dealt + the earned cap fits the exception exactly.
      expect(7 + 1 + APOTHEOSIS_EARNED_SLOTS_MAX).toBeLessThanOrEqual(APOTHEOSIS_HAND_MAX);
    }
  });
});

describe('no other step changes', () => {
  it("every library step without handMax keeps the dealer's constants", () => {
    let withOwnCeiling = 0;
    let checked = 0;
    for (const template of UNIFIED_ACTION_TEMPLATES) {
      for (const step of allSteps(template)) {
        if (!step) continue;
        checked++;
        if (step.handMax !== undefined || step.handMaxTotalDelta !== undefined) {
          expect(template.id).toBe(APOTHEOSIS_ASCENSION_TEMPLATE.id);
          withOwnCeiling++;
          continue;
        }
        expect(dealHandMaxFor(step)).toBe(DEAL_HAND_MAX);
        expect(dealHandMaxTotalDeltaFor(step)).toBe(DEAL_HAND_MAX_TOTAL_DELTA);
        expect(step.fitBareForecast === undefined || template.id === APOTHEOSIS_ASCENSION_TEMPLATE.id).toBe(true);
      }
    }
    expect(checked).toBeGreaterThan(100);
    expect(withOwnCeiling).toBeGreaterThan(0);
  });
});

describe('the line above the hand', () => {
  const climax = { fitBareForecast: CLIMAX_BARE_FORECAST, dealEarned: 'apotheosis' as const };

  it('says the hand was earned only when it holds more than 8 cards', () => {
    expect(apotheosisClimaxLine(climax, DEAL_HAND_MAX + 1, 5, 'Kael', 'male')).toEqual({
      kind: 'arrival',
      text: fillApotheosisLine(APOTHEOSIS_ARRIVAL_LINE, 'Kael', 'male'),
    });
    expect(apotheosisClimaxLine(climax, DEAL_HAND_MAX, 5, 'Kael', 'male')).toBeUndefined();
  });

  it('gives an empty purse a line, not an empty tray', () => {
    const line = apotheosisClimaxLine(climax, DEAL_HAND_MAX + 2, 0, 'Kael Thornweaver', 'male');
    expect(line?.kind).toBe('empty_purse');
    expect(line?.text).toBe('Your purse is empty. Kael Thornweaver stands in this doorway on his own.');
  });

  it('says nothing on an ordinary step', () => {
    expect(apotheosisClimaxLine({}, 12, 0, 'Kael', 'male')).toBeUndefined();
  });

  it('fills an empty name as "your First", capitalised at the start', () => {
    expect(fillApotheosisLine(APOTHEOSIS_EMPTY_PURSE_LINE, '', undefined))
      .toBe('Your purse is empty. your First stands in this doorway on their own.');
    expect(fillApotheosisLine(APOTHEOSIS_ARRIVAL_LINE, undefined, 'female'))
      .toContain("in your First's earlier chapters");
  });
});
