import { ENCOUNTER_TEMPLATES } from './encounter-content';
import type { EncounterOutcome, EncounterTemplate } from '../types/encounter';

export type EncounterMigrationLiveSignal =
  | 'reward_pool'
  | 'reputation_delta'
  | 'tier_promotion';

export type EncounterMigrationDeferredField =
  | 'traitModifiers'
  | 'traitChanges';

export interface EncounterMigrationAuditEntry {
  templateId: string;
  encounterType: EncounterTemplate['encounterType'];
  reachPrimary: EncounterTemplate['reachPrimary'];
  finalStepId: string;
  finalSuccessSignals: EncounterMigrationLiveSignal[];
  finalFailureSignals: EncounterMigrationLiveSignal[];
  deferredSuccessFields: EncounterMigrationDeferredField[];
  deferredFailureFields: EncounterMigrationDeferredField[];
  hasAnyLiveSignals: boolean;
  isThinPlaceholder: boolean;
}

export interface EncounterMigrationAuditSummary {
  totalTemplates: number;
  templatesWithLiveSignals: number;
  thinPlaceholderTemplates: number;
  templatesWithDeferredFields: number;
  liveSignalCounts: Record<EncounterMigrationLiveSignal, number>;
  deferredFieldCounts: Record<EncounterMigrationDeferredField, number>;
}

function getOutcomeSignals(outcome: EncounterOutcome): EncounterMigrationLiveSignal[] {
  const signals: EncounterMigrationLiveSignal[] = [];
  if (outcome.rewardPool) signals.push('reward_pool');
  if ((outcome.reputationDelta ?? 0) !== 0) signals.push('reputation_delta');
  if (outcome.tierPromotionEligible) signals.push('tier_promotion');
  return signals;
}

function getDeferredFields(outcome: EncounterOutcome): EncounterMigrationDeferredField[] {
  const fields: EncounterMigrationDeferredField[] = [];
  if (outcome.traitModifiers && Object.keys(outcome.traitModifiers).length > 0) {
    fields.push('traitModifiers');
  }
  if (outcome.traitChanges && outcome.traitChanges.length > 0) {
    fields.push('traitChanges');
  }
  return fields;
}

function toAuditEntry(template: EncounterTemplate): EncounterMigrationAuditEntry {
  const finalStep = template.steps[template.steps.length - 1];
  const finalSuccessSignals = getOutcomeSignals(finalStep.onSuccess);
  const finalFailureSignals = getOutcomeSignals(finalStep.onFailure);
  const deferredSuccessFields = getDeferredFields(finalStep.onSuccess);
  const deferredFailureFields = getDeferredFields(finalStep.onFailure);
  const hasAnyLiveSignals = finalSuccessSignals.length > 0 || finalFailureSignals.length > 0;

  return {
    templateId: template.id,
    encounterType: template.encounterType,
    reachPrimary: template.reachPrimary,
    finalStepId: finalStep.id,
    finalSuccessSignals,
    finalFailureSignals,
    deferredSuccessFields,
    deferredFailureFields,
    hasAnyLiveSignals,
    isThinPlaceholder: !hasAnyLiveSignals,
  };
}

export const ENCOUNTER_MIGRATION_AUDIT: EncounterMigrationAuditEntry[] = ENCOUNTER_TEMPLATES
  .map(toAuditEntry)
  .sort((a, b) => a.templateId.localeCompare(b.templateId));

function countLiveSignals(signal: EncounterMigrationLiveSignal): number {
  return ENCOUNTER_MIGRATION_AUDIT.reduce((sum, entry) => sum
    + Number(entry.finalSuccessSignals.includes(signal))
    + Number(entry.finalFailureSignals.includes(signal)), 0);
}

function countDeferredFields(field: EncounterMigrationDeferredField): number {
  return ENCOUNTER_MIGRATION_AUDIT.reduce((sum, entry) => sum
    + Number(entry.deferredSuccessFields.includes(field))
    + Number(entry.deferredFailureFields.includes(field)), 0);
}

export const ENCOUNTER_MIGRATION_AUDIT_SUMMARY: EncounterMigrationAuditSummary = {
  totalTemplates: ENCOUNTER_MIGRATION_AUDIT.length,
  templatesWithLiveSignals: ENCOUNTER_MIGRATION_AUDIT.filter((entry) => entry.hasAnyLiveSignals).length,
  thinPlaceholderTemplates: ENCOUNTER_MIGRATION_AUDIT.filter((entry) => entry.isThinPlaceholder).length,
  templatesWithDeferredFields: ENCOUNTER_MIGRATION_AUDIT.filter(
    (entry) => entry.deferredSuccessFields.length > 0 || entry.deferredFailureFields.length > 0,
  ).length,
  liveSignalCounts: {
    reward_pool: countLiveSignals('reward_pool'),
    reputation_delta: countLiveSignals('reputation_delta'),
    tier_promotion: countLiveSignals('tier_promotion'),
  },
  deferredFieldCounts: {
    traitModifiers: countDeferredFields('traitModifiers'),
    traitChanges: countDeferredFields('traitChanges'),
  },
};

export const ENCOUNTER_MIGRATION_THIN_PLACEHOLDERS = ENCOUNTER_MIGRATION_AUDIT
  .filter((entry) => entry.isThinPlaceholder)
  .map((entry) => entry.templateId);

export const ENCOUNTER_MIGRATION_DEFERRED_TEMPLATES = ENCOUNTER_MIGRATION_AUDIT
  .filter((entry) => entry.deferredSuccessFields.length > 0 || entry.deferredFailureFields.length > 0)
  .map((entry) => entry.templateId);
