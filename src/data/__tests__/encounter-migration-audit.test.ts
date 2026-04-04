import { describe, expect, it } from 'vitest';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';
import {
  ENCOUNTER_MIGRATION_AUDIT,
  ENCOUNTER_MIGRATION_AUDIT_SUMMARY,
  ENCOUNTER_MIGRATION_DEFERRED_TEMPLATES,
  ENCOUNTER_MIGRATION_THIN_PLACEHOLDERS,
} from '../encounter-migration-audit';

describe('encounter migration audit', () => {
  it('covers every encounter template exactly once', () => {
    expect(ENCOUNTER_MIGRATION_AUDIT).toHaveLength(ENCOUNTER_TEMPLATES.length);

    const ids = ENCOUNTER_MIGRATION_AUDIT.map((entry) => entry.templateId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('points each audit entry at the template final step', () => {
    for (const entry of ENCOUNTER_MIGRATION_AUDIT) {
      const template = ENCOUNTER_TEMPLATES.find((candidate) => candidate.id === entry.templateId);
      expect(template).toBeDefined();
      expect(entry.finalStepId).toBe(template!.steps[template!.steps.length - 1]?.id);
    }
  });

  it('summary partitions templates into live-signal vs thin-placeholder buckets', () => {
    expect(
      ENCOUNTER_MIGRATION_AUDIT_SUMMARY.templatesWithLiveSignals
      + ENCOUNTER_MIGRATION_AUDIT_SUMMARY.thinPlaceholderTemplates,
    ).toBe(ENCOUNTER_MIGRATION_AUDIT_SUMMARY.totalTemplates);

    expect(ENCOUNTER_MIGRATION_THIN_PLACEHOLDERS).toHaveLength(
      ENCOUNTER_MIGRATION_AUDIT_SUMMARY.thinPlaceholderTemplates,
    );
  });

  it('summary deferred-field counts match the deferred template projection', () => {
    const deferredTemplates = ENCOUNTER_MIGRATION_AUDIT.filter(
      (entry) => entry.deferredSuccessFields.length > 0 || entry.deferredFailureFields.length > 0,
    ).map((entry) => entry.templateId);

    expect(ENCOUNTER_MIGRATION_DEFERRED_TEMPLATES).toEqual(deferredTemplates);
    expect(ENCOUNTER_MIGRATION_AUDIT_SUMMARY.templatesWithDeferredFields).toBe(deferredTemplates.length);
  });

  it('counts live signals consistently', () => {
    const rewardPoolCount = ENCOUNTER_MIGRATION_AUDIT.reduce((sum, entry) => sum
      + Number(entry.finalSuccessSignals.includes('reward_pool'))
      + Number(entry.finalFailureSignals.includes('reward_pool')), 0);
    const reputationDeltaCount = ENCOUNTER_MIGRATION_AUDIT.reduce((sum, entry) => sum
      + Number(entry.finalSuccessSignals.includes('reputation_delta'))
      + Number(entry.finalFailureSignals.includes('reputation_delta')), 0);
    const tierPromotionCount = ENCOUNTER_MIGRATION_AUDIT.reduce((sum, entry) => sum
      + Number(entry.finalSuccessSignals.includes('tier_promotion'))
      + Number(entry.finalFailureSignals.includes('tier_promotion')), 0);

    expect(ENCOUNTER_MIGRATION_AUDIT_SUMMARY.liveSignalCounts.reward_pool).toBe(rewardPoolCount);
    expect(ENCOUNTER_MIGRATION_AUDIT_SUMMARY.liveSignalCounts.reputation_delta).toBe(reputationDeltaCount);
    expect(ENCOUNTER_MIGRATION_AUDIT_SUMMARY.liveSignalCounts.tier_promotion).toBe(tierPromotionCount);
  });
});
