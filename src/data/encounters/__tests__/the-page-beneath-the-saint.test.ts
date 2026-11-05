/**
 * Tests for The Page Beneath the Saint encounter template (THR-466).
 *
 * Regional-scale branching encounter. Validates structure, scale honesty,
 * branch resolution, and aftermath completeness.
 *
 * THR-2157: the fork is decided by the mortal (pole mode); the variant keys are
 * the poles, not the ids of the cards the god used to click.
 */

import { describe, it, expect } from 'vitest';
import { PAGE_BENEATH_THE_SAINT_TEMPLATE } from '../the-page-beneath-the-saint';
import { isActionStepBranch } from '../../../types/unifiedAction';
import type { ActionStepBranch } from '../../../types/unifiedAction';
import type { EncounterChoiceMemory } from '../../../types/encounter';
import { resolveStepDefinition } from '../../../engine/unifiedActionLifecycle';

function makeChoiceMemory(stepIndex: number, choiceId: string): EncounterChoiceMemory {
  return {
    stepIndex,
    stepId: `step-${stepIndex}`,
    choiceId,
    choiceText: `Test choice: ${choiceId}`,
    interventionType: 'supportive',
    essenceSpent: 0,
    probabilityBoost: 0,
    tick: 1,
  };
}

const template = PAGE_BENEATH_THE_SAINT_TEMPLATE;

describe('The Page Beneath the Saint — structure & scale', () => {
  it('has exactly 2 steps', () => {
    expect(template.steps).toHaveLength(2);
  });

  it('is authored at REGIONAL scale (the gap THR-466 closes)', () => {
    expect(template.scale).toBe('regional');
  });

  it('has correct metadata', () => {
    expect(template.id).toBe('veil.truth.page_beneath_saint');
    expect(template.name).toBe('The Page Beneath the Saint');
    expect(template.reach).toBe('veil');
    expect(template.rarityTier).toBe(4);
    expect(template.intrinsicTier).toBe('story_beat');
  });

  it('declares locationSubtypes so it can surface via the encounter cache', () => {
    expect(template.locationSubtypes && template.locationSubtypes.length).toBeGreaterThan(0);
  });

  it('step 0 is a concrete ActionStep at difficulty 0 (the choice is the point)', () => {
    const step0 = template.steps[0];
    expect(isActionStepBranch(step0)).toBe(false);
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.difficulty).toBe(0);
    expect(step0.reach).toBe('veil');
  });

  it('step 1 is an ActionStepBranch with both poles + fallback', () => {
    const step1 = template.steps[1];
    expect(isActionStepBranch(step1)).toBe(true);
    const branch = step1 as ActionStepBranch;
    expect(branch.variants).toHaveProperty('negative');
    expect(branch.variants).toHaveProperty('positive');
    expect(branch.fallback).toBeDefined();
  });

  it('every branch has both a success and a failure afterimage (cool failure)', () => {
    const branch = template.steps[1] as ActionStepBranch;
    for (const key of Object.keys(branch.variants)) {
      const v = branch.variants[key];
      expect(v.successAfterimage).toBeTruthy();
      expect(v.failureAfterimage).toBeTruthy();
    }
  });

  // THR-2157 — the player no longer picks; the mortal decides on honesty_cunning.
  it('carries no authored choices; the mortal decides the fork on honesty_cunning', () => {
    expect(template.authoredChoices).toBeUndefined();
    const branch = template.steps[1] as ActionStepBranch;
    expect(branch.decidedBy).toEqual({ axis: 'honesty_cunning' });
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.nudges?.length ?? 0).toBeGreaterThan(0);
  });
});

describe('The Page Beneath the Saint — branch & aftermath resolution', () => {
  it('resolves the manipulator variant for the negative pole (bury_it_deeper)', () => {
    const resolved = resolveStepDefinition(template, 1, [makeChoiceMemory(0, 'negative')]);
    expect(resolved.reach).toBe('veil');
    expect(resolved.difficulty).toBe(0.45);
  });

  it('resolves the restraint (seer) variant for the positive pole (let_the_truth_surface)', () => {
    const resolved = resolveStepDefinition(template, 1, [makeChoiceMemory(0, 'positive')]);
    expect(resolved.difficulty).toBe(0.4);
  });

  it('falls back to the restraint variant for an unknown choice', () => {
    const resolved = resolveStepDefinition(template, 1, [makeChoiceMemory(0, 'nonsense')]);
    expect(resolved.difficulty).toBe(0.4);
  });

  it('aftermath branches on step 0 and covers both poles + fallback', () => {
    const cfg = template.aftermathConfig!;
    expect(cfg.branchOnStep).toBe(0);
    expect(cfg.variants['negative']).toBeDefined();
    expect(cfg.variants['positive']).toBeDefined();
    expect(cfg.fallback).toBeDefined();
  });

  it('both aftermath poles have 2 reactions, each with at least one effect', () => {
    const cfg = template.aftermathConfig!;
    for (const key of ['negative', 'positive']) {
      const variant = cfg.variants[key];
      expect(variant.reactions).toHaveLength(2);
      for (const r of variant.reactions!) {
        expect(r.effects.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
