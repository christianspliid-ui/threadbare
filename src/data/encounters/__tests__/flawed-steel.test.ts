/**
 * Tests for the Flawed Steel encounter template.
 *
 * Validates:
 * - Template structure (2 steps, step 0 concrete, step 1 ActionStepBranch)
 * - Branch resolution via resolveStepDefinition for all 3 variants
 * - Aftermath variant resolution for all 3 paths
 * - The mortal decides the fork (THR-2157: route mode; no authored choices)
 * - Support bundle contract (Maren, Dalla, Torve, forge)
 */

import { describe, it, expect } from 'vitest';
import { FLAWED_STEEL_TEMPLATE } from '../flawed-steel';
import { isActionStepBranch, isRouteDecision } from '../../../types/unifiedAction';
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

const template = FLAWED_STEEL_TEMPLATE;

// ─── Structure Tests ──────────────────────────────────────────────

describe('Flawed Steel — template structure', () => {
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
    expect(template.id).toBe('crafting.quest.flawed_steel');
    expect(template.name).toBe('Flawed Steel');
    expect(template.reach).toBe('heart');
    expect(template.crudType).toBe('update');
    expect(template.scale).toBe('local');
    expect(template.apCost).toBe(1);
    expect(template.essenceCost).toBe(2);
    expect(template.rarityTier).toBe(2);
  });

  it('has correct motivations', () => {
    expect(template.motivations).toContain('loyalty_ambition');
    expect(template.motivations).toContain('honesty_cunning');
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
    expect(step0.reach).toBe('heart');
    expect(step0.failBehavior).toBe('continue_weakened');
  });

  it('step 1 branch has forge_the_truth, temper_the_narrative, and keep_your_hand_folded variants', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants).toHaveProperty('forge_the_truth');
    expect(step1.variants).toHaveProperty('temper_the_narrative');
    expect(step1.variants).toHaveProperty('keep_your_hand_folded');
    expect(step1.fallback).toBeDefined();
  });

  it('forge_the_truth variant uses heart reach at 0.45 difficulty', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const variant = step1.variants['forge_the_truth'];
    expect(variant.reach).toBe('heart');
    expect(variant.difficulty).toBe(0.45);
  });

  it('temper_the_narrative variant uses shadow reach at 0.40 difficulty', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const variant = step1.variants['temper_the_narrative'];
    expect(variant.reach).toBe('shadow');
    expect(variant.difficulty).toBe(0.40);
  });

  it('keep_your_hand_folded variant uses heart reach at 0.25 difficulty', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const variant = step1.variants['keep_your_hand_folded'];
    expect(variant.reach).toBe('heart');
    expect(variant.difficulty).toBe(0.25);
  });
});

// ─── Branch Resolution Tests ──────────────────────────────────────

describe('Flawed Steel — branch resolution', () => {
  it('resolveStepDefinition returns forge_the_truth variant when choiceId matches', () => {
    const choiceHistory = [makeChoiceMemory(0, 'forge_the_truth')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('heart');
    expect(resolved.difficulty).toBe(0.45);
  });

  it('resolveStepDefinition returns temper_the_narrative variant when choiceId matches', () => {
    const choiceHistory = [makeChoiceMemory(0, 'temper_the_narrative')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('shadow');
    expect(resolved.difficulty).toBe(0.40);
  });

  it('resolveStepDefinition returns keep_your_hand_folded variant when choiceId matches', () => {
    const choiceHistory = [makeChoiceMemory(0, 'keep_your_hand_folded')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('heart');
    expect(resolved.difficulty).toBe(0.25);
  });

  it('resolveStepDefinition returns fallback when no choice is recorded', () => {
    const resolved = resolveStepDefinition(template, 1, undefined);
    // Fallback is a copy of forge_the_truth
    expect(resolved.reach).toBe('heart');
    expect(resolved.difficulty).toBe(0.45);
  });

  it('resolveStepDefinition returns fallback for unknown choiceId', () => {
    const choiceHistory = [makeChoiceMemory(0, 'unknown_choice')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('heart');
    expect(resolved.difficulty).toBe(0.45);
  });

  it('resolveStepDefinition returns step 0 directly (not a branch)', () => {
    const resolved = resolveStepDefinition(template, 0, undefined);
    expect(resolved.reach).toBe('heart');
    expect(resolved.difficulty).toBe(0);
  });
});

// ─── The mortal decides (THR-2157) ───────────────────────────────

describe('Flawed Steel — the mortal decides the fork', () => {
  it('carries no authored choices — the player never picks the ending', () => {
    expect(template.authoredChoices).toBeUndefined();
  });

  it('forks on three routes, one per ending, each tied to a reach', () => {
    const branch = template.steps[1] as ActionStepBranch;
    const decision = branch.decidedBy;
    expect(decision && isRouteDecision(decision)).toBe(true);
    const routes = decision && isRouteDecision(decision) ? decision.routes : [];
    expect(routes.map(r => [r.key, r.reach])).toEqual([
      ['forge_the_truth', 'heart'],
      ['temper_the_narrative', 'shadow'],
      ['keep_your_hand_folded', 'stone'],
    ]);
  });

  it('step 0 deals a composed hand arguing the two courses the ruling names', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    const routes = (step0.nudges ?? []).map(n =>
      n.poleLean && typeof n.poleLean === 'object' && 'route' in n.poleLean ? n.poleLean.route : undefined);
    expect(routes).toEqual(['forge_the_truth', 'temper_the_narrative']);
    expect(step0.deal?.count ?? 0).toBeGreaterThan(0);
  });

  it('each arm deals an ordinary Repertoire hand in place of the old approach cards', () => {
    const branch = template.steps[1] as ActionStepBranch;
    for (const arm of Object.values(branch.variants)) {
      expect(arm.deal?.count ?? 0).toBeGreaterThan(0);
      expect(arm.purposeLine).toBeTruthy();
    }
  });
});

// ─── Aftermath Config Tests ───────────────────────────────────────

describe('Flawed Steel — aftermath config', () => {
  const config = template.aftermathConfig!;

  it('has an aftermathConfig', () => {
    expect(config).toBeDefined();
  });

  it('branches on step 0', () => {
    expect(config.branchOnStep).toBe(0);
  });

  it('resolves to forge_the_truth variant', () => {
    const variant = config.variants['forge_the_truth'];
    expect(variant).toBeDefined();
    expect(variant.overview).toBeTruthy();
  });

  it('resolves to temper_the_narrative variant', () => {
    const variant = config.variants['temper_the_narrative'];
    expect(variant).toBeDefined();
    expect(variant.overview).toBeTruthy();
  });

  it('resolves to keep_your_hand_folded variant', () => {
    const variant = config.variants['keep_your_hand_folded'];
    expect(variant).toBeDefined();
    expect(variant.overview).toBeTruthy();
  });

  it('all aftermath variants have 2 reactions', () => {
    for (const key of ['forge_the_truth', 'temper_the_narrative', 'keep_your_hand_folded']) {
      const variant = config.variants[key];
      expect(variant.reactions).toHaveLength(2);
    }
  });

  it('all aftermath reactions have at least one effect', () => {
    for (const key of ['forge_the_truth', 'temper_the_narrative', 'keep_your_hand_folded']) {
      const variant = config.variants[key];
      for (const reaction of variant.reactions!) {
        expect(reaction.effects.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('forge_the_truth aftermath has changes covering key consequences', () => {
    const variant = config.variants['forge_the_truth'];
    const changeIds = variant.changes.map(c => c.id);
    expect(changeIds).toContain('truth_maren_reputation');
    expect(changeIds).toContain('truth_dalla_exiled');
    expect(changeIds).toContain('truth_torve_positive');
    expect(changeIds).toContain('truth_guild_audit');
  });

  it('temper_the_narrative aftermath has changes covering key consequences', () => {
    const variant = config.variants['temper_the_narrative'];
    const changeIds = variant.changes.map(c => c.id);
    expect(changeIds).toContain('temper_maren_reputation');
    expect(changeIds).toContain('temper_dalla_disappeared');
    expect(changeIds).toContain('temper_hidden_truth');
  });

  it('keep_your_hand_folded aftermath has changes covering key consequences', () => {
    const variant = config.variants['keep_your_hand_folded'];
    const changeIds = variant.changes.map(c => c.id);
    expect(changeIds).toContain('withdrawn_maren_reputation');
    expect(changeIds).toContain('withdrawn_dalla_expelled');
    expect(changeIds).toContain('withdrawn_messy_resolution');
  });

  it('fallback matches the forge_the_truth variant structure', () => {
    expect(config.fallback.overview).toBeTruthy();
    expect(config.fallback.reactions).toHaveLength(2);
  });
});

// ─── Support Bundle Tests ─────────────────────────────────────────

describe('Flawed Steel — support bundle', () => {
  const bundle = template.supportBundle!;

  it('has a support bundle', () => {
    expect(bundle).toBeDefined();
  });

  it('has exactly 4 support specs', () => {
    expect(bundle).toHaveLength(4);
  });

  it('has actor spec for Maren Ironhewn', () => {
    const maren = bundle.find(s => s.key === 'maren_ironhewn');
    expect(maren).toBeDefined();
    expect(maren!.kind).toBe('actor');
    if (maren!.kind === 'actor') {
      expect(maren.spawnName).toBe('Maren Ironhewn');
      expect(maren.spawnNpcRole).toBe('smith');
      expect(maren.persistence).toBe('must-persist');
    }
  });

  it('has actor spec for Dalla', () => {
    const dalla = bundle.find(s => s.key === 'dalla');
    expect(dalla).toBeDefined();
    expect(dalla!.kind).toBe('actor');
    if (dalla!.kind === 'actor') {
      expect(dalla.spawnName).toBe('Dalla');
      expect(dalla.spawnNpcRole).toBe('apprentice');
      expect(dalla.persistence).toBe('must-persist');
    }
  });

  it('has actor spec for Torve Ashgrip', () => {
    const torve = bundle.find(s => s.key === 'torve_ashgrip');
    expect(torve).toBeDefined();
    expect(torve!.kind).toBe('actor');
    if (torve!.kind === 'actor') {
      expect(torve.spawnName).toBe('Torve Ashgrip');
      expect(torve.spawnNpcRole).toBe('mercenary');
      expect(torve.persistence).toBe('must-persist');
    }
  });

  it('has location spec for forge', () => {
    const forge = bundle.find(s => s.key === 'forge');
    expect(forge).toBeDefined();
    expect(forge!.kind).toBe('location');
    if (forge!.kind === 'location') {
      expect(forge.sublocationTypeId).toBe('workshop');
      expect(forge.persistence).toBe('must-persist');
    }
  });
});
