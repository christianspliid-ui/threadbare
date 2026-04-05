/**
 * Tests for Soul Ferryman encounter template.
 *
 * Validates:
 * - Template structure (2 steps, step 0 concrete, step 1 ActionStepBranch)
 * - Branch resolution via resolveStepDefinition for break/steady/fallback
 * - Aftermath variant resolution for both paths
 * - Support bundle contract (Vesik, Diehl, Silt crossing)
 * - Authored choices exist for step 0
 * - Template has required metadata
 */

import { describe, it, expect } from 'vitest';
import { SOUL_FERRYMAN_TEMPLATE } from '../soul-ferryman';
import { isActionStepBranch } from '../../../types/unifiedAction';
import type { ActionStepBranch } from '../../../types/unifiedAction';
import type { EncounterChoiceMemory } from '../../../types/encounter';
import { resolveStepDefinition } from '../../../engine/unifiedActionLifecycle';

// ─── Helpers ──────────────────────────────────────────────────────

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

const template = SOUL_FERRYMAN_TEMPLATE;

// ─── Structure Tests ──────────────────────────────────────────────

describe('Soul Ferryman — template structure', () => {
  it('has exactly 2 steps', () => {
    expect(template.steps).toHaveLength(2);
  });

  it('step 0 is a concrete ActionStep (not a branch)', () => {
    expect(isActionStepBranch(template.steps[0])).toBe(false);
  });

  it('step 1 is an ActionStepBranch', () => {
    expect(isActionStepBranch(template.steps[1])).toBe(true);
  });

  it('has correct template metadata', () => {
    expect(template.id).toBe('liminal.quest.soul_ferryman');
    expect(template.name).toBe('Soul Ferryman');
    expect(template.reach).toBe('heart');
    expect(template.crudType).toBe('update');
    expect(template.scale).toBe('local');
    expect(template.apCost).toBe(1);
    expect(template.essenceCost).toBe(2);
    expect(template.rarityTier).toBe(2);
  });

  it('has narrative templates', () => {
    expect(template.narrativeTemplates.initiation).toBeTruthy();
    expect(template.narrativeTemplates.success).toBeTruthy();
    expect(template.narrativeTemplates.failure).toBeTruthy();
  });

  it('step 0 (The Crossing) has difficulty 0 — the choice is the point', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.difficulty).toBe(0);
    expect(step0.reach).toBe('eye');
    expect(step0.failBehavior).toBe('continue_weakened');
  });

  it('step 0 has a narrative template containing fog and ferryman prose', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.narrativeTemplate).toContain('fog sat on the river');
    expect(step0.narrativeTemplate).toContain('Vesik');
  });

  it('step 1 branch has break_the_bargain and steady_the_courier variants', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants).toHaveProperty('break_the_bargain');
    expect(step1.variants).toHaveProperty('steady_the_courier');
    expect(step1.fallback).toBeDefined();
  });

  it('break_the_bargain variant uses star reach at 0.50 difficulty', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const breakBargain = step1.variants['break_the_bargain'];
    expect(breakBargain.reach).toBe('star');
    expect(breakBargain.difficulty).toBe(0.50);
  });

  it('steady_the_courier variant uses heart reach at 0.35 difficulty', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const steadyCourier = step1.variants['steady_the_courier'];
    expect(steadyCourier.reach).toBe('heart');
    expect(steadyCourier.difficulty).toBe(0.35);
  });

  it('both branch variants have narrative templates', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants['break_the_bargain'].narrativeTemplate).toBeTruthy();
    expect(step1.variants['steady_the_courier'].narrativeTemplate).toBeTruthy();
  });

  it('break variant prose contains river-contract imagery', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants['break_the_bargain'].narrativeTemplate).toContain('The god cut it');
  });

  it('steady variant prose contains Vesik naming the toll', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants['steady_the_courier'].narrativeTemplate).toContain('Your certainty');
  });
});

// ─── Branch Resolution Tests ──────────────────────────────────────

describe('Soul Ferryman — branch resolution', () => {
  it('resolveStepDefinition returns break variant when choiceId is break_the_bargain', () => {
    const choiceHistory = [makeChoiceMemory(0, 'break_the_bargain')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('star');
    expect(resolved.difficulty).toBe(0.50);
  });

  it('resolveStepDefinition returns steady variant when choiceId is steady_the_courier', () => {
    const choiceHistory = [makeChoiceMemory(0, 'steady_the_courier')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('heart');
    expect(resolved.difficulty).toBe(0.35);
  });

  it('resolveStepDefinition returns fallback when no choice is recorded', () => {
    const resolved = resolveStepDefinition(template, 1, undefined);
    // Fallback is a copy of the break_the_bargain variant
    expect(resolved.reach).toBe('star');
    expect(resolved.difficulty).toBe(0.50);
  });

  it('resolveStepDefinition returns fallback for unknown choiceId', () => {
    const choiceHistory = [makeChoiceMemory(0, 'unknown_choice')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('star');
    expect(resolved.difficulty).toBe(0.50);
  });

  it('resolveStepDefinition returns step 0 directly (not a branch)', () => {
    const resolved = resolveStepDefinition(template, 0, undefined);
    expect(resolved.reach).toBe('eye');
    expect(resolved.difficulty).toBe(0);
  });
});

// ─── Aftermath Config Tests ───────────────────────────────────────

describe('Soul Ferryman — aftermath config', () => {
  const config = template.aftermathConfig!;

  it('has an aftermathConfig', () => {
    expect(config).toBeDefined();
  });

  it('branches on step 0', () => {
    expect(config.branchOnStep).toBe(0);
  });

  it('resolves to break variant for break_the_bargain choice', () => {
    const variant = config.variants['break_the_bargain'];
    expect(variant).toBeDefined();
    expect(variant.overview).toContain('fog had thinned');
  });

  it('resolves to steady variant for steady_the_courier choice', () => {
    const variant = config.variants['steady_the_courier'];
    expect(variant).toBeDefined();
    expect(variant.overview).toContain('far bank');
  });

  it('break aftermath has no reactions (consequence is clean)', () => {
    const variant = config.variants['break_the_bargain'];
    expect(variant.reactions).toBeUndefined();
  });

  it('steady aftermath has no reactions (consequence is clean)', () => {
    const variant = config.variants['steady_the_courier'];
    expect(variant.reactions).toBeUndefined();
  });

  it('break aftermath has changes covering key consequences', () => {
    const variant = config.variants['break_the_bargain'];
    const changeIds = variant.changes.map(c => c.id);
    expect(changeIds).toContain('break_crossing_closed');
    expect(changeIds).toContain('break_vesik_unbound');
    expect(changeIds).toContain('break_diehl_whole');
    expect(changeIds).toContain('break_fog_thinning');
  });

  it('steady aftermath has changes covering key consequences', () => {
    const variant = config.variants['steady_the_courier'];
    const changeIds = variant.changes.map(c => c.id);
    expect(changeIds).toContain('steady_crossing_persists');
    expect(changeIds).toContain('steady_diehl_diminished');
    expect(changeIds).toContain('steady_letters_delivered');
    expect(changeIds).toContain('steady_vesik_unchanged');
  });

  it('fallback matches the break_the_bargain variant structure', () => {
    expect(config.fallback.overview).toContain('fog had thinned');
  });
});

// ─── Support Bundle Tests ─────────────────────────────────────────

describe('Soul Ferryman — support bundle', () => {
  const bundle = template.supportBundle!;

  it('has a support bundle', () => {
    expect(bundle).toBeDefined();
  });

  it('has exactly 3 support specs', () => {
    expect(bundle).toHaveLength(3);
  });

  it('has actor spec for Vesik', () => {
    const vesik = bundle.find(s => s.key === 'vesik');
    expect(vesik).toBeDefined();
    expect(vesik!.kind).toBe('actor');
    if (vesik!.kind === 'actor') {
      expect(vesik.spawnName).toBe('Vesik');
      expect(vesik.persistence).toBe('must-persist');
      expect(vesik.delivery).toBe('lazy-materialize-on-trigger');
    }
  });

  it('has actor spec for Diehl', () => {
    const diehl = bundle.find(s => s.key === 'diehl');
    expect(diehl).toBeDefined();
    expect(diehl!.kind).toBe('actor');
    if (diehl!.kind === 'actor') {
      expect(diehl.spawnName).toBe('Diehl');
      expect(diehl.persistence).toBe('must-persist');
      expect(diehl.delivery).toBe('lazy-materialize-on-trigger');
    }
  });

  it('has location spec for silt crossing', () => {
    const siltCrossing = bundle.find(s => s.key === 'silt_crossing');
    expect(siltCrossing).toBeDefined();
    expect(siltCrossing!.kind).toBe('location');
    if (siltCrossing!.kind === 'location') {
      expect(siltCrossing.persistence).toBe('must-persist');
      expect(siltCrossing.delivery).toBe('lazy-materialize-on-trigger');
    }
  });
});

// ─── Authored Choices Tests ───────────────────────────────────────

describe('Soul Ferryman — authored choices', () => {
  it('has authored choices for step 0', () => {
    expect(template.authoredChoices).toBeDefined();
    expect(template.authoredChoices![0]).toBeDefined();
  });

  it('has exactly 2 choices at step 0', () => {
    expect(template.authoredChoices![0]).toHaveLength(2);
  });

  it('first choice is break_the_bargain', () => {
    const choice = template.authoredChoices![0][0];
    expect(choice.id).toBe('break_the_bargain');
    expect(choice.label).toBe('Break the Bargain');
    expect(choice.essenceCost).toBe(3);
    expect(choice.interventionType).toBe('coercive');
  });

  it('second choice is steady_the_courier', () => {
    const choice = template.authoredChoices![0][1];
    expect(choice.id).toBe('steady_the_courier');
    expect(choice.label).toBe('Steady the Courier');
    expect(choice.essenceCost).toBe(1);
    expect(choice.interventionType).toBe('supportive');
  });

  it('choice ids match step 1 branch variant keys', () => {
    const choiceIds = template.authoredChoices![0].map(c => c.id);
    const step1 = template.steps[1] as ActionStepBranch;
    const branchKeys = Object.keys(step1.variants);
    for (const id of choiceIds) {
      expect(branchKeys).toContain(id);
    }
  });

  it('all choices have intent and likelyBurden prose', () => {
    for (const choice of template.authoredChoices![0]) {
      expect(choice.intent).toBeTruthy();
      expect(choice.likelyBurden).toBeTruthy();
    }
  });
});

// ─── GraphOps Tests ───────────────────────────────────────────────

describe('Soul Ferryman — GraphOps', () => {
  it('step 0 has empty onSuccess and onFailure (choice step only)', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.onSuccess).toHaveLength(0);
    expect(step0.onFailure).toHaveLength(0);
  });

  it('break variant has onSuccess GraphOps', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const breakBargain = step1.variants['break_the_bargain'];
    expect(breakBargain.onSuccess.length).toBeGreaterThan(0);
  });

  it('steady variant has onSuccess GraphOps', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const steadyCourier = step1.variants['steady_the_courier'];
    expect(steadyCourier.onSuccess.length).toBeGreaterThan(0);
  });
});
