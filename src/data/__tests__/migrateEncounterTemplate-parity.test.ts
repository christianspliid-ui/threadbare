/**
 * Migration parity tests (THR-90 task 2).
 *
 * For 2 representative legacy templates (social, combat/duel), verify that
 * migrateEncounterTemplate() preserves all consequential fields:
 *   - difficulty correctly scaled 0–100 → 0–1
 *   - duration correctly converted to { min, max } range
 *   - encounterType correctly mapped to crudType via encounterTypeToCrud()
 *   - rewardPool, tierPromotionEligible, reputationDelta carried into
 *     successMetadata / failureMetadata on each step
 *   - failBehavior: 'continue_weakened' on non-final steps, 'fail_action' on final
 *   - top-level fields (id, name, reach, scale, actorAffinities) preserved
 *
 * Note: Thieves guild templates were migrated to UnifiedActionTemplate in THR-89.
 * They no longer go through migrateEncounterTemplate — they are pre-authored unified
 * templates. The guild section of this test was updated to verify the pre-migrated shape.
 */
import { describe, it, expect } from 'vitest';
import { migrateEncounterTemplate, encounterTypeToCrud } from '../unified-action-templates';
import {
  THIEVES_GUILD_ENCOUNTER_TEMPLATES,
  THIEVES_GUILD_SOCIAL_TEMPLATES,
  TG_JOIN_TEMPLATE,
  TG_PROMOTION_TEMPLATE,
} from '../thieves-guild-encounter-content';
import { SOCIAL_ENCOUNTER_TEMPLATES } from '../social-encounter-content';
import { MONSTER_ENCOUNTER_TEMPLATES } from '../monster-encounter-content';
import type { EncounterTemplate } from '../../types/encounter';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

// ─── Shared parity helper (F4 fix) ────────────────────────────────────────

function assertParity(legacy: EncounterTemplate, migrated: UnifiedActionTemplate): void {
  // Top-level identity
  expect(migrated.id).toBe(legacy.id);
  expect(migrated.name).toBe(legacy.name);
  expect(migrated.reach).toBe(legacy.reachPrimary);
  expect(migrated.crudType).toBe(encounterTypeToCrud(legacy.encounterType));
  expect(migrated.scale).toBe('local');
  expect(migrated.actorAffinities).toContain('individual');
  expect(migrated.steps).toHaveLength(legacy.steps.length);

  const lastIdx = legacy.steps.length - 1;

  for (let i = 0; i < legacy.steps.length; i++) {
    const legacyStep = legacy.steps[i];
    const migratedStep = migrated.steps[i];

    // Difficulty: 0–100 → 0–1
    expect(migratedStep.difficulty, `step ${i} difficulty`).toBeCloseTo(legacyStep.difficulty / 100, 10);
    expect(migratedStep.difficulty).toBeGreaterThanOrEqual(0);
    expect(migratedStep.difficulty).toBeLessThanOrEqual(1);

    // Duration: scalar → { min, max }
    const legacyDuration = legacyStep.duration ?? 1;
    expect(migratedStep.duration, `step ${i} duration`).toEqual({ min: legacyDuration, max: legacyDuration });

    // failBehavior: continue_weakened on non-final, fail_action on final
    if (i < lastIdx) {
      expect(migratedStep.failBehavior, `step ${i} failBehavior`).toBe('continue_weakened');
    } else {
      expect(migratedStep.failBehavior, `step ${i} failBehavior (final)`).toBe('fail_action');
    }

    // successMetadata: fields carried from onSuccess
    const onSuccess = legacyStep.onSuccess;
    if (onSuccess.rewardPool !== undefined || onSuccess.tierPromotionEligible !== undefined || onSuccess.reputationDelta !== undefined) {
      expect(migratedStep.successMetadata, `step ${i} successMetadata`).toBeDefined();
      if (onSuccess.rewardPool !== undefined) {
        expect(migratedStep.successMetadata?.rewardPool).toEqual(onSuccess.rewardPool);
      }
      if (onSuccess.tierPromotionEligible !== undefined) {
        expect(migratedStep.successMetadata?.tierPromotionEligible).toBe(onSuccess.tierPromotionEligible);
      }
      if (onSuccess.reputationDelta !== undefined) {
        expect(migratedStep.successMetadata?.reputationDelta).toBe(onSuccess.reputationDelta);
      }
    }

    // failureMetadata: fields carried from onFailure
    const onFailure = legacyStep.onFailure;
    if (onFailure.rewardPool !== undefined || onFailure.reputationDelta !== undefined) {
      expect(migratedStep.failureMetadata, `step ${i} failureMetadata`).toBeDefined();
      if (onFailure.rewardPool !== undefined) {
        expect(migratedStep.failureMetadata?.rewardPool).toEqual(onFailure.rewardPool);
      }
      if (onFailure.reputationDelta !== undefined) {
        expect(migratedStep.failureMetadata?.reputationDelta).toBe(onFailure.reputationDelta);
      }
    }
  }
}

// ─── Pick representative templates ────────────────────────────────────────

// TG templates are pre-migrated UnifiedActionTemplate (THR-89) — accessed directly
const guildTemplate = THIEVES_GUILD_ENCOUNTER_TEMPLATES.find(t => t.id === 'tg.quest.pocket_run')!;
const socialTemplate = SOCIAL_ENCOUNTER_TEMPLATES.find(t => t.id === 'social.forge_alliance')!;
const combatTemplate = MONSTER_ENCOUNTER_TEMPLATES.find(t => t.id === 'monster.hunt.minor')!;

describe('migrateEncounterTemplate parity (THR-90)', () => {
  it('all three source templates are found in their arrays', () => {
    expect(guildTemplate, 'tg.quest.pocket_run').toBeDefined();
    expect(socialTemplate, 'social.forge_alliance').toBeDefined();
    expect(combatTemplate, 'monster.hunt.minor').toBeDefined();
  });

  // ─── Guild: pre-migrated shape (THR-89) ───────────────────────────────

  it('tg.quest.pocket_run is a valid pre-migrated UnifiedActionTemplate', () => {
    // TG templates were hand-authored in unified format (THR-89) — no migration needed.
    expect(guildTemplate.id).toBe('tg.quest.pocket_run');
    expect(guildTemplate.crudType).toBe('read');
    expect(guildTemplate.reach).toBeDefined();
    expect(guildTemplate.steps.length).toBeGreaterThan(0);
    // All steps have duration as {min,max} (already unified)
    for (const step of guildTemplate.steps) {
      expect(step.duration).toMatchObject({ min: expect.any(Number), max: expect.any(Number) });
      expect(step.difficulty).toBeGreaterThanOrEqual(0);
      expect(step.difficulty).toBeLessThanOrEqual(1);
    }
    // aftermathConfig present
    expect(guildTemplate.aftermathConfig).toBeDefined();
    expect(guildTemplate.aftermathConfig.fallback).toBeDefined();
  });

  // ─── Social templates: pre-migrated shape (THR-100 Phase 3) ─────────────

  it('social.forge_alliance is a valid pre-migrated UnifiedActionTemplate', () => {
    // Social templates were hand-authored in unified format (THR-100 Phase 3) — no migration needed.
    expect(socialTemplate.id).toBe('social.forge_alliance');
    expect(socialTemplate.crudType).toBe('update');
    expect(socialTemplate.reach).toBeDefined();
    expect(socialTemplate.steps.length).toBeGreaterThanOrEqual(2);
    for (const step of socialTemplate.steps) {
      expect(step.duration).toMatchObject({ min: expect.any(Number), max: expect.any(Number) });
      expect(step.difficulty).toBeGreaterThanOrEqual(0);
      expect(step.difficulty).toBeLessThanOrEqual(1);
    }
    expect(socialTemplate.aftermathConfig).toBeDefined();
    expect(socialTemplate.aftermathConfig.fallback).toBeDefined();
  });

  // ─── Legacy migration: combat only (social now pre-migrated) ─────────────

  it('monster.hunt.minor (combat/duel / duel→delete) passes full parity check', () => {
    assertParity(combatTemplate, migrateEncounterTemplate(combatTemplate));
  });

  // ─── Cross-template invariants ─────────────────────────────────────────

  it('encounterTypeToCrud produces correct crudType for legacy representatives', () => {
    expect(encounterTypeToCrud(combatTemplate.encounterType)).toBe('delete'); // duel
  });

  it('legacy migrated templates compile as UnifiedActionTemplate (type check via usage)', () => {
    const c = migrateEncounterTemplate(combatTemplate);
    expect(c.id).toBeTruthy();
    // social.forge_alliance is already a UnifiedActionTemplate — verify directly
    expect(socialTemplate.id).toBeTruthy();
    expect(socialTemplate.crudType).toBeTruthy();
  });
});

// ─── Bulk shape assertions: all 15 TG templates (THR-89, Codex finding) ──────

describe('TG pre-migrated shape invariants (all 15 templates)', () => {
  const ALL_TG = [
    ...THIEVES_GUILD_ENCOUNTER_TEMPLATES,
    ...THIEVES_GUILD_SOCIAL_TEMPLATES,
    TG_JOIN_TEMPLATE,
    TG_PROMOTION_TEMPLATE,
  ];

  it('covers all 15 TG templates', () => {
    expect(ALL_TG).toHaveLength(15);
  });

  it('every template has duration {min,max} on all steps', () => {
    for (const t of ALL_TG) {
      for (const step of t.steps) {
        expect(step.duration, `${t.id} step duration`).toMatchObject({
          min: expect.any(Number),
          max: expect.any(Number),
        });
      }
    }
  });

  it('every template has difficulty 0-1 on all steps', () => {
    for (const t of ALL_TG) {
      for (const step of t.steps) {
        expect(step.difficulty, `${t.id} step difficulty`).toBeGreaterThanOrEqual(0);
        expect(step.difficulty, `${t.id} step difficulty`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('every template final step has failBehavior fail_action', () => {
    for (const t of ALL_TG) {
      const lastStep = t.steps[t.steps.length - 1];
      expect(lastStep.failBehavior, `${t.id} final step failBehavior`).toBe('fail_action');
    }
  });

  it('every template has aftermathConfig with a fallback', () => {
    for (const t of ALL_TG) {
      expect(t.aftermathConfig, `${t.id} aftermathConfig`).toBeDefined();
      expect(t.aftermathConfig.fallback, `${t.id} aftermathConfig.fallback`).toBeDefined();
    }
  });

  it('no template has rarityTier 4', () => {
    for (const t of ALL_TG) {
      expect(t.rarityTier, `${t.id} rarityTier`).toBeLessThanOrEqual(3);
    }
  });
});
