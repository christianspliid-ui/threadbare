/**
 * Tests for The Broker's Ledger encounter template.
 *
 * Validates:
 * - Template structure (2 steps, step 0 concrete, step 1 ActionStepBranch)
 * - Branch resolution via resolveStepDefinition for accept/refuse/fallback
 * - Aftermath variant resolution for both paths
 * - Support bundle contract (Tessaly, Carin Harken, meeting point)
 * - Reaction effects completeness
 */

import { describe, it, expect } from 'vitest';
import { RIVAL_SHRINE_BETRAYAL_TEMPLATE } from '../rival-shrine-betrayal';
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

const template = RIVAL_SHRINE_BETRAYAL_TEMPLATE;

// ─── Structure Tests ──────────────────────────────────────────────

describe('The Broker\'s Ledger — template structure', () => {
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
    expect(template.id).toBe('broker.quest.rival_shrine_betrayal');
    expect(template.name).toBe("The Broker's Ledger");
    expect(template.reach).toBe('shadow');
    expect(template.crudType).toBe('read');
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

  it('step 0 (The Offer) has difficulty 0 — the choice is the point', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.difficulty).toBe(0);
    expect(step0.reach).toBe('shadow');
    expect(step0.failBehavior).toBe('continue_weakened');
  });

  it('step 1 branch has accept_trade and refuse_trade variants', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    expect(step1.variants).toHaveProperty('accept_trade');
    expect(step1.variants).toHaveProperty('refuse_trade');
    expect(step1.fallback).toBeDefined();
  });

  it('accept variant uses shadow reach at 0.45 difficulty', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const accept = step1.variants['accept_trade'];
    expect(accept.reach).toBe('shadow');
    expect(accept.difficulty).toBe(0.45);
  });

  it('refuse variant uses heart reach at 0.35 difficulty', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const refuse = step1.variants['refuse_trade'];
    expect(refuse.reach).toBe('heart');
    expect(refuse.difficulty).toBe(0.35);
  });
});

// ─── Branch Resolution Tests ──────────────────────────────────────

describe('The Broker\'s Ledger — branch resolution', () => {
  it('resolveStepDefinition returns accept variant when choiceId is accept_trade', () => {
    const choiceHistory = [makeChoiceMemory(0, 'accept_trade')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('shadow');
    expect(resolved.difficulty).toBe(0.45);
  });

  it('resolveStepDefinition returns refuse variant when choiceId is refuse_trade', () => {
    const choiceHistory = [makeChoiceMemory(0, 'refuse_trade')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('heart');
    expect(resolved.difficulty).toBe(0.35);
  });

  it('resolveStepDefinition returns fallback when no choice is recorded', () => {
    const resolved = resolveStepDefinition(template, 1, undefined);
    // Fallback is a copy of the refuse variant
    expect(resolved.reach).toBe('heart');
    expect(resolved.difficulty).toBe(0.35);
  });

  it('resolveStepDefinition returns fallback for unknown choiceId', () => {
    const choiceHistory = [makeChoiceMemory(0, 'unknown_choice')];
    const resolved = resolveStepDefinition(template, 1, choiceHistory);
    expect(resolved.reach).toBe('heart');
    expect(resolved.difficulty).toBe(0.35);
  });

  it('resolveStepDefinition returns step 0 directly (not a branch)', () => {
    const resolved = resolveStepDefinition(template, 0, undefined);
    expect(resolved.reach).toBe('shadow');
    expect(resolved.difficulty).toBe(0);
  });
});

// ─── Aftermath Config Tests ───────────────────────────────────────

describe('The Broker\'s Ledger — aftermath config', () => {
  const config = template.aftermathConfig!;

  it('has an aftermathConfig', () => {
    expect(config).toBeDefined();
  });

  it('branches on step 0', () => {
    expect(config.branchOnStep).toBe(0);
  });

  it('resolves to accept variant for accept_trade choice', () => {
    const variant = config.variants['accept_trade'];
    expect(variant).toBeDefined();
    expect(variant.overview).toContain('map arrived');
  });

  it('resolves to refuse variant for refuse_trade choice', () => {
    const variant = config.variants['refuse_trade'];
    expect(variant).toBeDefined();
    expect(variant.overview).toContain('shrine in the Vessen uplands');
  });

  it('accept aftermath has 2 reactions', () => {
    const variant = config.variants['accept_trade'];
    expect(variant.reactions).toHaveLength(2);
  });

  it('refuse aftermath has 2 reactions', () => {
    const variant = config.variants['refuse_trade'];
    expect(variant.reactions).toHaveLength(2);
  });

  it('all accept reactions have at least one effect', () => {
    const variant = config.variants['accept_trade'];
    for (const reaction of variant.reactions!) {
      expect(reaction.effects.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all refuse reactions have at least one effect', () => {
    const variant = config.variants['refuse_trade'];
    for (const reaction of variant.reactions!) {
      expect(reaction.effects.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('accept aftermath has changes covering the key consequences', () => {
    const variant = config.variants['accept_trade'];
    const changeIds = variant.changes.map(c => c.id);
    expect(changeIds).toContain('accept_intelligence_gained');
    expect(changeIds).toContain('accept_alliance_strained');
    expect(changeIds).toContain('accept_broker_relationship');
    expect(changeIds).toContain('accept_economic_countdown');
    expect(changeIds).toContain('accept_hidden_mark');
  });

  it('refuse aftermath has changes covering the key consequences', () => {
    const variant = config.variants['refuse_trade'];
    const changeIds = variant.changes.map(c => c.id);
    expect(changeIds).toContain('refuse_alliance_preserved');
    expect(changeIds).toContain('refuse_intelligence_gap');
    expect(changeIds).toContain('refuse_broker_relationship');
    expect(changeIds).toContain('refuse_threat_seeded');
    expect(changeIds).toContain('refuse_principle_established');
  });

  it('fallback matches the refuse variant structure', () => {
    expect(config.fallback.overview).toContain('shrine in the Vessen uplands');
    expect(config.fallback.reactions).toHaveLength(2);
  });
});

// ─── Support Bundle Tests ─────────────────────────────────────────

describe('The Broker\'s Ledger — support bundle', () => {
  const bundle = template.supportBundle!;

  it('has a support bundle', () => {
    expect(bundle).toBeDefined();
  });

  it('has actor spec for Tessaly', () => {
    const tessaly = bundle.find(s => s.key === 'tessaly');
    expect(tessaly).toBeDefined();
    expect(tessaly!.kind).toBe('actor');
    if (tessaly!.kind === 'actor') {
      expect(tessaly.spawnName).toBe('Tessaly');
      expect(tessaly.spawnNpcRole).toBe('broker');
      expect(tessaly.persistence).toBe('must-persist');
    }
  });

  it('has actor spec for Carin Harken', () => {
    const carin = bundle.find(s => s.key === 'carin_harken');
    expect(carin).toBeDefined();
    expect(carin!.kind).toBe('actor');
    if (carin!.kind === 'actor') {
      expect(carin.spawnName).toBe('Carin Harken');
      expect(carin.spawnNpcRole).toBe('elder');
      expect(carin.persistence).toBe('must-persist');
    }
  });

  it('has location spec for meeting point', () => {
    const meetingPoint = bundle.find(s => s.key === 'meeting_point');
    expect(meetingPoint).toBeDefined();
    expect(meetingPoint!.kind).toBe('location');
    if (meetingPoint!.kind === 'location') {
      expect(meetingPoint.sublocationTypeId).toBe('caravanserai');
      expect(meetingPoint.persistence).toBe('scene-only');
    }
  });

  it('has exactly 3 support specs', () => {
    expect(bundle).toHaveLength(3);
  });
});

// ─── GraphOps Tests ───────────────────────────────────────────────

describe('The Broker\'s Ledger — GraphOps', () => {
  it('accept variant step has onSuccess GraphOps for intelligence attachment', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const accept = step1.variants['accept_trade'];
    expect(accept.onSuccess.length).toBeGreaterThan(0);
    const addNodeOp = accept.onSuccess.find(op => op.op === 'add_node');
    expect(addNodeOp).toBeDefined();
  });

  it('refuse variant step has onSuccess GraphOps for trust boost', () => {
    const step1 = template.steps[1] as ActionStepBranch;
    const refuse = step1.variants['refuse_trade'];
    expect(refuse.onSuccess.length).toBeGreaterThan(0);
  });

  it('step 0 has empty onSuccess and onFailure (no ops on the offer itself)', () => {
    const step0 = template.steps[0];
    if (isActionStepBranch(step0)) throw new Error('step 0 should not be a branch');
    expect(step0.onSuccess).toHaveLength(0);
    expect(step0.onFailure).toHaveLength(0);
  });
});
