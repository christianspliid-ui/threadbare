/**
 * Tests for The Comet at the Turning encounter template (THR-466).
 *
 * Cosmic-scale branching encounter. Validates structure, scale honesty,
 * branch resolution, and aftermath completeness.
 */

import { describe, it, expect } from 'vitest';
import { COMET_AT_THE_TURNING_TEMPLATE } from '../the-comet-at-the-turning';
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
    interventionType: 'coercive',
    essenceSpent: 0,
    probabilityBoost: 0,
    tick: 1,
  };
}

const template = COMET_AT_THE_TURNING_TEMPLATE;

describe('The Comet at the Turning — structure & scale', () => {
  it('has exactly 2 steps', () => {
    expect(template.steps).toHaveLength(2);
  });

  it('is authored at COSMIC scale (the gap THR-466 closes)', () => {
    expect(template.scale).toBe('cosmic');
  });

  it('has correct metadata', () => {
    expect(template.id).toBe('star.turning.comet_omen');
    expect(template.name).toBe('The Comet at the Turning');
    expect(template.reach).toBe('star');
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
    expect(step0.reach).toBe('star');
  });

  it('step 1 is an ActionStepBranch with both poles + fallback', () => {
    const step1 = template.steps[1];
    expect(isActionStepBranch(step1)).toBe(true);
    const branch = step1 as ActionStepBranch;
    expect(branch.variants).toHaveProperty('proclaim_the_turning');
    expect(branch.variants).toHaveProperty('let_them_read_it');
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

  it('offers exactly two authored god-action choices on step 0', () => {
    expect(template.authoredChoices?.[0]).toHaveLength(2);
    const ids = template.authoredChoices![0].map(c => c.id);
    expect(ids).toContain('proclaim_the_turning');
    expect(ids).toContain('let_them_read_it');
  });
});

describe('The Comet at the Turning — branch & aftermath resolution', () => {
  it('resolves the turning variant for proclaim_the_turning', () => {
    const resolved = resolveStepDefinition(template, 1, [makeChoiceMemory(0, 'proclaim_the_turning')]);
    expect(resolved.reach).toBe('star');
    expect(resolved.difficulty).toBe(0.5);
  });

  it('resolves the anchored variant for let_them_read_it', () => {
    const resolved = resolveStepDefinition(template, 1, [makeChoiceMemory(0, 'let_them_read_it')]);
    expect(resolved.difficulty).toBe(0.35);
  });

  it('falls back to the anchored (restraint) variant for an unknown choice', () => {
    const resolved = resolveStepDefinition(template, 1, [makeChoiceMemory(0, 'nonsense')]);
    expect(resolved.difficulty).toBe(0.35);
  });

  it('aftermath branches on step 0 and covers both poles + fallback', () => {
    const cfg = template.aftermathConfig!;
    expect(cfg.branchOnStep).toBe(0);
    expect(cfg.variants['proclaim_the_turning']).toBeDefined();
    expect(cfg.variants['let_them_read_it']).toBeDefined();
    expect(cfg.fallback).toBeDefined();
  });

  it('both aftermath poles have 2 reactions, each with at least one effect', () => {
    const cfg = template.aftermathConfig!;
    for (const key of ['proclaim_the_turning', 'let_them_read_it']) {
      const variant = cfg.variants[key];
      expect(variant.reactions).toHaveLength(2);
      for (const r of variant.reactions!) {
        expect(r.effects.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
