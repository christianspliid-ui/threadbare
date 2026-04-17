/**
 * Migration parity tests (THR-90 task 2).
 *
 * For 3 representative legacy templates (guild, social, combat/duel), verify
 * that migrateEncounterTemplate() preserves all consequential fields:
 *   - difficulty correctly scaled 0–100 → 0–1
 *   - duration correctly converted to { min, max } range
 *   - encounterType correctly mapped to crudType via encounterTypeToCrud()
 *   - rewardPool, tierPromotionEligible, reputationDelta carried into
 *     successMetadata / failureMetadata on each step
 *   - failBehavior: 'continue_weakened' on non-final steps, 'fail_action' on final
 *   - top-level fields (id, name, reach, scale, actorAffinities) preserved
 */
import { describe, it, expect } from 'vitest';
import { migrateEncounterTemplate, encounterTypeToCrud } from '../unified-action-templates';
import { THIEVES_GUILD_ENCOUNTER_TEMPLATES } from '../thieves-guild-encounter-content';
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

const guildTemplate = THIEVES_GUILD_ENCOUNTER_TEMPLATES.find(t => t.id === 'tg.quest.pocket_run')!;
const socialTemplate = SOCIAL_ENCOUNTER_TEMPLATES.find(t => t.id === 'social.forge_alliance')!;
const combatTemplate = MONSTER_ENCOUNTER_TEMPLATES.find(t => t.id === 'monster.hunt.minor')!;

describe('migrateEncounterTemplate parity (THR-90)', () => {
  it('all three source templates are found in their arrays', () => {
    expect(guildTemplate, 'tg.quest.pocket_run').toBeDefined();
    expect(socialTemplate, 'social.forge_alliance').toBeDefined();
    expect(combatTemplate, 'monster.hunt.minor').toBeDefined();
  });

  it('tg.quest.pocket_run (guild / steal→read) passes full parity check', () => {
    assertParity(guildTemplate, migrateEncounterTemplate(guildTemplate));
  });

  it('social.forge_alliance (social / assist→update) passes full parity check', () => {
    assertParity(socialTemplate, migrateEncounterTemplate(socialTemplate));
  });

  it('monster.hunt.minor (combat/duel / duel→delete) passes full parity check', () => {
    assertParity(combatTemplate, migrateEncounterTemplate(combatTemplate));
  });

  // ─── Cross-template invariants ─────────────────────────────────────────

  it('encounterTypeToCrud produces the correct crudType for each representative', () => {
    expect(encounterTypeToCrud(guildTemplate.encounterType)).toBe('read');    // steal
    expect(encounterTypeToCrud(socialTemplate.encounterType)).toBe('update'); // assist
    expect(encounterTypeToCrud(combatTemplate.encounterType)).toBe('delete'); // duel
  });

  it('all three migrated templates compile as UnifiedActionTemplate (type check via usage)', () => {
    const g = migrateEncounterTemplate(guildTemplate);
    const s = migrateEncounterTemplate(socialTemplate);
    const c = migrateEncounterTemplate(combatTemplate);
    // If this compiles without error, the return type is correct
    expect(g.id).toBeTruthy();
    expect(s.id).toBeTruthy();
    expect(c.id).toBeTruthy();
  });
});
