/**
 * Tests for The Healer at the Ward-Gate encounter template.
 *
 * Validates:
 * - Template structure (1 step, plain ActionStep — no branching)
 * - Step difficulty, reach, duration
 * - Support bundle contract (Maret, Jorik)
 * - Aftermath config with fallback-only resolution
 * - Template metadata (id, name, scale, costs, motivations)
 */

import { describe, it, expect } from 'vitest';
import { WANDERING_HEALER_SHRINE_ACCESS_TEMPLATE } from '../wandering-healer-shrine-access';
import { isActionStepBranch } from '../../../types/unifiedAction';

const template = WANDERING_HEALER_SHRINE_ACCESS_TEMPLATE;

// ─── Structure Tests ──────────────────────────────────────────────

describe('The Healer at the Ward-Gate — template structure', () => {
  it('has exactly 1 step', () => {
    expect(template.steps).toHaveLength(1);
  });

  it('step 0 is a plain ActionStep (not a branch)', () => {
    expect(isActionStepBranch(template.steps[0])).toBe(false);
  });

  it('has correct template metadata', () => {
    expect(template.id).toBe('healer.quest.wandering_healer_shrine_access');
    expect(template.name).toBe('The Healer at the Ward-Gate');
    expect(template.reach).toBe('heart');
    expect(template.crudType).toBe('update');
    expect(template.scale).toBe('local');
    expect(template.apCost).toBe(1);
    expect(template.essenceCost).toBe(1);
    expect(template.rarityTier).toBe(1);
  });

  it('has correct motivations', () => {
    expect(template.motivations).toContain('mercy_ruthlessness');
  });

  it('has narrative templates', () => {
    expect(template.narrativeTemplates.initiation).toBeTruthy();
    expect(template.narrativeTemplates.success).toBeTruthy();
    expect(template.narrativeTemplates.failure).toBeTruthy();
  });
});

// ─── Step Tests ──────────────────────────────────────────────────

describe('The Healer at the Ward-Gate — step definition', () => {
  it('step 0 uses heart reach', () => {
    const step = template.steps[0];
    if (isActionStepBranch(step)) throw new Error('step 0 should not be a branch');
    expect(step.reach).toBe('heart');
  });

  it('step 0 has difficulty 0.35 (moderate social resistance)', () => {
    const step = template.steps[0];
    if (isActionStepBranch(step)) throw new Error('step 0 should not be a branch');
    expect(step.difficulty).toBe(0.35);
  });

  it('step 0 duration is 2-3 ticks', () => {
    const step = template.steps[0];
    if (isActionStepBranch(step)) throw new Error('step 0 should not be a branch');
    expect(step.duration.min).toBe(2);
    expect(step.duration.max).toBe(3);
  });

  it('step 0 uses fail_action behavior', () => {
    const step = template.steps[0];
    if (isActionStepBranch(step)) throw new Error('step 0 should not be a branch');
    expect(step.failBehavior).toBe('fail_action');
  });

  it('step 0 has empty onSuccess and onFailure (aftermath handles effects)', () => {
    const step = template.steps[0];
    if (isActionStepBranch(step)) throw new Error('step 0 should not be a branch');
    expect(step.onSuccess).toHaveLength(0);
    expect(step.onFailure).toHaveLength(0);
  });

  it('step 0 has a narrative template', () => {
    const step = template.steps[0];
    if (isActionStepBranch(step)) throw new Error('step 0 should not be a branch');
    expect(step.narrativeTemplate).toBeTruthy();
  });
});

// ─── Support Bundle Tests ─────────────────────────────────────────

describe('The Healer at the Ward-Gate — support bundle', () => {
  const bundle = template.supportBundle!;

  it('has a support bundle', () => {
    expect(bundle).toBeDefined();
  });

  it('has exactly 2 support specs', () => {
    expect(bundle).toHaveLength(2);
  });

  it('has actor spec for Maret (healer)', () => {
    const maret = bundle.find(s => s.key === 'maret');
    expect(maret).toBeDefined();
    expect(maret!.kind).toBe('actor');
    if (maret!.kind === 'actor') {
      expect(maret.spawnName).toBe('Maret');
      expect(maret.spawnNpcRole).toBe('healer');
      expect(maret.persistence).toBe('must-persist');
      expect(maret.delivery).toBe('lazy-materialize-on-trigger');
    }
  });

  it('has actor spec for Jorik (warden)', () => {
    const jorik = bundle.find(s => s.key === 'jorik');
    expect(jorik).toBeDefined();
    expect(jorik!.kind).toBe('actor');
    if (jorik!.kind === 'actor') {
      expect(jorik.spawnName).toBe('Jorik');
      expect(jorik.spawnNpcRole).toBe('guard');
      expect(jorik.persistence).toBe('must-persist');
      expect(jorik.delivery).toBe('lazy-materialize-on-trigger');
    }
  });
});

// ─── Aftermath Config Tests ───────────────────────────────────────

describe('The Healer at the Ward-Gate — aftermath config', () => {
  const config = template.aftermathConfig!;

  it('has an aftermathConfig', () => {
    expect(config).toBeDefined();
  });

  it('branches on step 0 with empty variants (linear — always uses fallback)', () => {
    expect(config.branchOnStep).toBe(0);
    expect(Object.keys(config.variants)).toHaveLength(0);
  });

  it('fallback has overview text', () => {
    expect(config.fallback.overview).toBeTruthy();
    expect(config.fallback.overview.length).toBeGreaterThan(50);
  });

  it('fallback has curated visible changes', () => {
    const changeIds = config.fallback.changes.map(c => c.id);
    expect(changeIds).toContain('healer_departs');
    expect(changeIds).toContain('ward_policy_tested');
    expect(changeIds).toContain('child_recovers');
  });

  // Repointed by THR-1141. This assertion used to read `reactions` must be
  // `undefined` — "clean consequence" — and it was the codified form of exactly
  // the defect UI Law 56 was ratified to kill: three chips claiming a
  // disposition, a community memory and a recovery, with no write anywhere on
  // the template to make any of them true. A test asserting the dead side of a
  // retired contract is worse than no test, so it is inverted rather than
  // deleted: the encounter now owes its chips a write, and this is where that
  // is held.
  it('each authored chip is backed by a write on the same ending (Law 56)', () => {
    const effects = (config.fallback.reactions ?? []).flatMap(r => r.effects);
    const kinds = effects.map(e => e.kind);
    // `healer_departs` — Maret's disposition is an edge, not a sentence.
    expect(kinds).toContain('bond_change');
    // `ward_policy_tested` — carried by the man who holds the ward's gate.
    // Thornwall Ward is fiction, not a faction node, so there is no
    // `targetFactionId` to move here.
    expect(kinds).toContain('reputation_score');
    // `child_recovers` is a `future_hook`, and a hook is backed by a seed.
    expect(kinds).toContain('encounter_seed');
  });

  it('every effect names a cast key the template actually declares', () => {
    // The THR-844 rot class: a `$cast:` sentinel naming a key outside the
    // support bundle no-ops silently, so the write never lands and the chip is
    // back to claiming nothing.
    const declared = new Set(
      (WANDERING_HEALER_SHRINE_ACCESS_TEMPLATE.supportBundle ?? []).map(s => s.key),
    );
    const sentinels = (config.fallback.reactions ?? [])
      .flatMap(r => r.effects)
      .flatMap(e => [
        (e as { targetAgentId?: string }).targetAgentId,
        (e as { withAgentId?: string }).withAgentId,
      ])
      .filter((id): id is string => typeof id === 'string' && id.startsWith('$cast:'));

    expect(sentinels.length).toBeGreaterThan(0);
    for (const sentinel of sentinels) {
      expect(declared).toContain(sentinel.slice('$cast:'.length));
    }
  });
});
