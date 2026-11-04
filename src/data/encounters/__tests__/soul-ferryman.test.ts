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
    expect(step0.narrativeTemplate).toContain('{cast:vesik}');
  });

  it('step 1 branch has break_the_bargain and steady_the_courier variants', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants).toHaveProperty('negative');
    expect(step1.variants).toHaveProperty('positive');
    expect(step1.fallback).toBeDefined();
  });

  it('break_the_bargain variant uses star reach at 0.50 difficulty', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const breakBargain = step1.variants['negative'];
    expect(breakBargain.reach).toBe('star');
    expect(breakBargain.difficulty).toBe(0.50);
  });

  it('steady_the_courier variant uses heart reach at 0.35 difficulty', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const steadyCourier = step1.variants['positive'];
    expect(steadyCourier.reach).toBe('heart');
    expect(steadyCourier.difficulty).toBe(0.35);
  });

  it('both branch variants have narrative templates', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants['negative'].narrativeTemplate).toBeTruthy();
    expect(step1.variants['positive'].narrativeTemplate).toBeTruthy();
  });

  it('break variant prose contains river-contract imagery', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants['negative'].narrativeTemplate).toContain('The god cut it');
  });

  it('steady variant prose contains Vesik naming the toll', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants['positive'].narrativeTemplate).toContain('Your certainty');
  });
});

// ─── Branch Resolution Tests ──────────────────────────────────────

describe('Soul Ferryman — branch resolution', () => {
  it('resolveStepDefinition returns break variant when choiceId is break_the_bargain', () => {
    const choiceHistory = [makeChoiceMemory(0, 'negative')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('star');
    expect(resolved.difficulty).toBe(0.50);
  });

  it('resolveStepDefinition returns steady variant when choiceId is steady_the_courier', () => {
    const choiceHistory = [makeChoiceMemory(0, 'positive')];
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
    const variant = config.variants['negative'];
    expect(variant).toBeDefined();
    expect(variant.overview).toContain('fog had thinned');
  });

  it('resolves to steady variant for steady_the_courier choice', () => {
    const variant = config.variants['positive'];
    expect(variant).toBeDefined();
    expect(variant.overview).toContain('far bank');
  });

  it('break aftermath has no reactions (consequence is clean)', () => {
    const variant = config.variants['negative'];
    expect(variant.reactions).toBeUndefined();
  });

  it('steady aftermath has no reactions (consequence is clean)', () => {
    const variant = config.variants['positive'];
    expect(variant.reactions).toBeUndefined();
  });

  it('break aftermath has changes covering key consequences', () => {
    const variant = config.variants['negative'];
    const changeIds = variant.changes.map(c => c.id);
    expect(changeIds).toContain('break_crossing_closed');
    expect(changeIds).toContain('break_vesik_unbound');
    expect(changeIds).toContain('break_diehl_whole');
    expect(changeIds).toContain('break_fog_thinning');
  });

  it('steady aftermath has changes covering key consequences', () => {
    const variant = config.variants['positive'];
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

// ─── The mortal decides (THR-2158) ────────────────────────────────

describe('Soul Ferryman — the mortal decides the fork', () => {
  it('authors no authoredChoices — the god never picks the ending', () => {
    expect(template.authoredChoices).toBeUndefined();
  });

  it('step 1 is decided by the mortal on sacrifice_survival', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.decidedBy).toEqual({ axis: 'sacrifice_survival' });
    expect(Object.keys(step1.variants).sort()).toEqual(['negative', 'positive']);
  });

  it('step 0 deals a hand that argues both poles of the fork', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.deal?.count).toBeGreaterThan(0);
    const leans = (step0.nudges ?? []).map(n => n.poleLean).filter(Boolean);
    expect(leans).toEqual(expect.arrayContaining([
      { axis: 'sacrifice_survival', toward: 'positive' },
      { axis: 'sacrifice_survival', toward: 'negative' },
    ]));
  });

  it('both step 1 arms deal an ordinary hand from the Repertoire', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    for (const arm of Object.values(step1.variants)) {
      expect(arm.deal?.count).toBeGreaterThan(0);
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
    const breakBargain = step1.variants['negative'];
    expect(breakBargain.onSuccess.length).toBeGreaterThan(0);
  });

  it('steady variant has onSuccess GraphOps', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const steadyCourier = step1.variants['positive'];
    expect(steadyCourier.onSuccess.length).toBeGreaterThan(0);
  });
});
