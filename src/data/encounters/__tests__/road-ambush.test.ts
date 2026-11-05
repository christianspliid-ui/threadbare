/**
 * Tests for Road Ambush encounter template.
 *
 * Validates:
 * - Template structure (2 steps, step 0 concrete, step 1 ActionStepBranch)
 * - Branch resolution via resolveStepDefinition for shield/chaos/fallback
 * - Aftermath variant resolution for both paths
 * - Support bundle actors (Soraya, Dragan, lead driver, trade road)
 * - The mortal decides the fork (THR-2158): decidedBy, composed hands
 * - Template has required metadata
 */

import { describe, it, expect } from 'vitest';
import { ROAD_AMBUSH_TEMPLATE } from '../road-ambush';
import { isActionStepBranch } from '../../../types/unifiedAction';
import type { ActionStepBranch } from '../../../types/unifiedAction';
import type { EncounterChoiceMemory } from '../../../types/encounter';
import { resolveStepDefinition } from '../../../engine/unifiedActionLifecycle';
import { assertNoRetiredPlayerPickField } from '../../../testing/contentInvariants';

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

const template = ROAD_AMBUSH_TEMPLATE;

// ─── Structure Tests ──────────────────────────────────────────────

describe('Road Ambush — template structure', () => {
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
    expect(template.id).toBe('liminal.quest.road_ambush');
    expect(template.name).toBe('Road Ambush');
    expect(template.reach).toBe('iron');
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

  it('step 0 has difficulty 0 — the choice is the point', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.difficulty).toBe(0);
    expect(step0.reach).toBe('eye');
    expect(step0.failBehavior).toBe('continue_weakened');
  });

  it('step 0 has narrative template containing the ambush opening prose', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.narrativeTemplate).toContain('{cast:soraya}');
    expect(step0.narrativeTemplate).toContain('waymarker stones');
  });

  it('step 0 opening prose contains the crossbow bolt detail', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.narrativeTemplate).toContain('crossbow bolt standing from his left shoulder');
  });

  it('step 1 branch has shield_the_road and turn_the_chaos variants', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants).toHaveProperty('positive');
    expect(step1.variants).toHaveProperty('negative');
    expect(step1.fallback).toBeDefined();
  });

  it('shield_the_road variant uses iron reach at 0.45 difficulty', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const shield = step1.variants['positive'];
    expect(shield.reach).toBe('iron');
    expect(shield.difficulty).toBe(0.45);
  });

  it('turn_the_chaos variant uses iron reach at 0.40 difficulty', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const chaos = step1.variants['negative'];
    expect(chaos.reach).toBe('iron');
    expect(chaos.difficulty).toBe(0.40);
  });

  it('both branch variants have narrative templates', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants['positive'].narrativeTemplate).toBeTruthy();
    expect(step1.variants['negative'].narrativeTemplate).toBeTruthy();
  });

  it('shield variant prose contains Dragan withdrawing', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants['positive'].narrativeTemplate).toContain('{cast:dragan} was the last to go');
  });

  it('chaos variant prose contains the manufactured pause', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants['negative'].narrativeTemplate).toContain('manufactured stillness');
  });
});

// ─── Branch Resolution Tests ──────────────────────────────────────

describe('Road Ambush — branch resolution', () => {
  it('resolveStepDefinition returns shield variant when choiceId is shield_the_road', () => {
    const choiceHistory = [makeChoiceMemory(0, 'positive')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('iron');
    expect(resolved.difficulty).toBe(0.45);
  });

  it('resolveStepDefinition returns chaos variant when choiceId is turn_the_chaos', () => {
    const choiceHistory = [makeChoiceMemory(0, 'negative')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('iron');
    expect(resolved.difficulty).toBe(0.40);
  });

  it('resolveStepDefinition returns fallback when no choice is recorded', () => {
    const resolved = resolveStepDefinition(template, 1, undefined);
    // Fallback is a copy of the shield_the_road variant
    expect(resolved.reach).toBe('iron');
    expect(resolved.difficulty).toBe(0.45);
  });

  it('resolveStepDefinition returns fallback for unknown choiceId', () => {
    const choiceHistory = [makeChoiceMemory(0, 'unknown_choice')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('iron');
    expect(resolved.difficulty).toBe(0.45);
  });

  it('resolveStepDefinition returns step 0 directly (not a branch)', () => {
    const resolved = resolveStepDefinition(template, 0, undefined);
    expect(resolved.reach).toBe('eye');
    expect(resolved.difficulty).toBe(0);
  });
});

// ─── Aftermath Config Tests ───────────────────────────────────────

describe('Road Ambush — aftermath config', () => {
  const config = template.aftermathConfig!;

  it('has an aftermathConfig', () => {
    expect(config).toBeDefined();
  });

  it('branches on step 0', () => {
    expect(config.branchOnStep).toBe(0);
  });

  it('resolves to shield variant for shield_the_road choice', () => {
    const variant = config.variants['positive'];
    expect(variant).toBeDefined();
    expect(variant.overview).toContain('{cast:soraya}');
  });

  it('resolves to chaos variant for turn_the_chaos choice', () => {
    const variant = config.variants['negative'];
    expect(variant).toBeDefined();
    expect(variant.overview).toContain('spider-silk');
  });

  it('shield aftermath has changes covering key consequences', () => {
    const variant = config.variants['positive'];
    const changeIds = variant.changes.map(c => c.id);
    expect(changeIds).toContain('shield_soraya_grateful');
    expect(changeIds).toContain('shield_driver_surviving');
    expect(changeIds).toContain('shield_dragan_retreated');
    expect(changeIds).toContain('shield_road_safer');
  });

  it('chaos aftermath has changes covering key consequences', () => {
    const variant = config.variants['negative'];
    const changeIds = variant.changes.map(c => c.id);
    expect(changeIds).toContain('chaos_soraya_unsettled');
    expect(changeIds).toContain('chaos_dragan_touched');
    expect(changeIds).toContain('chaos_goods_extracted');
    expect(changeIds).toContain('chaos_road_unchanged');
  });

  it('shield aftermath has reaction choices', () => {
    const variant = config.variants['positive'];
    expect(variant.reactions).toBeDefined();
    expect(variant.reactions!.length).toBeGreaterThan(0);
  });

  it('chaos aftermath has reaction choices', () => {
    const variant = config.variants['negative'];
    expect(variant.reactions).toBeDefined();
    expect(variant.reactions!.length).toBeGreaterThan(0);
  });

  it('fallback matches the shield_the_road variant structure', () => {
    expect(config.fallback.overview).toContain('{cast:soraya}');
  });
});

// ─── Support Bundle Tests ─────────────────────────────────────────

describe('Road Ambush — support bundle', () => {
  const bundle = template.supportBundle!;

  it('has a support bundle', () => {
    expect(bundle).toBeDefined();
  });

  it('has exactly 4 support specs', () => {
    expect(bundle).toHaveLength(4);
  });

  it('has actor spec for Soraya Kelk', () => {
    const soraya = bundle.find(s => s.key === 'soraya');
    expect(soraya).toBeDefined();
    expect(soraya!.kind).toBe('actor');
    if (soraya!.kind === 'actor') {
      expect(soraya.spawnName).toBe('Soraya Kelk');
      expect(soraya.persistence).toBe('must-persist');
      expect(soraya.delivery).toBe('lazy-materialize-on-trigger');
    }
  });

  it('has actor spec for Dragan Halfmast', () => {
    const dragan = bundle.find(s => s.key === 'dragan');
    expect(dragan).toBeDefined();
    expect(dragan!.kind).toBe('actor');
    if (dragan!.kind === 'actor') {
      expect(dragan.spawnName).toBe('Dragan Halfmast');
      expect(dragan.persistence).toBe('must-persist');
      expect(dragan.delivery).toBe('lazy-materialize-on-trigger');
    }
  });

  it('has actor spec for lead driver', () => {
    const driver = bundle.find(s => s.key === 'lead_driver');
    expect(driver).toBeDefined();
    expect(driver!.kind).toBe('actor');
    if (driver!.kind === 'actor') {
      expect(driver.persistence).toBe('must-persist');
      expect(driver.delivery).toBe('lazy-materialize-on-trigger');
    }
  });

  it('has location spec for trade road', () => {
    const road = bundle.find(s => s.key === 'trade_road');
    expect(road).toBeDefined();
    expect(road!.kind).toBe('location');
    if (road!.kind === 'location') {
      expect(road.persistence).toBe('must-persist');
      expect(road.delivery).toBe('lazy-materialize-on-trigger');
    }
  });
});

// ─── The mortal decides (THR-2158) ────────────────────────────────

describe('Road Ambush — the mortal decides the fork', () => {
  it('carries no retired player-pick field — the god never picks the ending', () => {
    assertNoRetiredPlayerPickField(template);
  });

  it('step 1 is decided by the mortal on mercy_ruthlessness', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.decidedBy).toEqual({ axis: 'mercy_ruthlessness' });
    expect(Object.keys(step1.variants).sort()).toEqual(['negative', 'positive']);
  });

  it('step 0 deals a hand that argues both poles of the fork', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.nudges?.length).toBeGreaterThan(0);
    expect(step0.deal?.count).toBeGreaterThan(0);
    const leans = (step0.nudges ?? []).map(n => n.poleLean).filter(Boolean);
    expect(leans).toEqual(expect.arrayContaining([
      { axis: 'mercy_ruthlessness', toward: 'positive' },
      { axis: 'mercy_ruthlessness', toward: 'negative' },
    ]));
  });

  it('both step 1 arms deal an ordinary hand from the Repertoire', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    for (const arm of Object.values(step1.variants)) {
      expect(arm.deal?.count).toBeGreaterThan(0);
    }
  });

  it('the turn-the-chaos stakes arm is keyed to the pole', () => {
    expect(Object.keys(template.stakes?.arms ?? {})).toEqual(['negative']);
  });
});

// ─── GraphOps Tests ───────────────────────────────────────────────

describe('Road Ambush — GraphOps', () => {
  it('step 0 has empty onSuccess and onFailure (choice step only)', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.onSuccess).toHaveLength(0);
    expect(step0.onFailure).toHaveLength(0);
  });

  it('shield variant has onSuccess GraphOps', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const shield = step1.variants['positive'];
    expect(shield.onSuccess.length).toBeGreaterThan(0);
  });

  it('chaos variant has onSuccess GraphOps', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const chaos = step1.variants['negative'];
    expect(chaos.onSuccess.length).toBeGreaterThan(0);
  });
});
