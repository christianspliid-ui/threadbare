import { expect } from 'vitest';
import type {
  ActionStep,
  ActionStepOrBranch,
  EncounterAftermathReactionEffect,
  UnifiedActionTemplate,
} from '../types/unifiedAction';
import { isActionStepBranch } from '../types/unifiedAction';
import type { EncounterTemplate } from '../types/encounter';
import { REACH_DOMAINS } from '../types/traits';

const VALID_REACHES = new Set<string>(REACH_DOMAINS);
const VALID_RARITY_TIERS = new Set<number>([1, 2, 3, 4]);
const LEGACY_ENCOUNTER_REACHES = new Set<string>(['flesh', 'spirit', 'dominance']);

const KNOWN_AFTERMATH_EFFECT_KINDS = new Set<EncounterAftermathReactionEffect['kind']>([
  'reputation_score',
  'reputation_tally',
  'clearance_gate_tag',
  'recent_event',
  'encounter_seed',
  'hidden_mark',
  'intelligence',
  'reputation_set',
  'apply_condition',
  'remove_condition',
  'condition_attachment',
  'spawn_artifact',
  'emit_omen',
  'faction_splinter',
  'faction_absorb',
  'faction_dissolve',
  'faction_declare_war',
  'faction_force_peace',
  'thread_strengthen',
  'thread_weaken',
  'thread_break',
  'thread_branch',
  'spawn_clue',
  'secret_discovery',
  'favor_creation',
  'faction_reputation_gain',
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertValidReach(reach: string, context: string, allowLegacyEncounterReach = false): void {
  const isValidReach = VALID_REACHES.has(reach) || (allowLegacyEncounterReach && LEGACY_ENCOUNTER_REACHES.has(reach));
  expect(
    isValidReach,
    `${context} has invalid reach: ${reach}`,
  ).toBe(true);
}

function assertValidNarrative(narrative: string, context: string): void {
  expect(
    isNonEmptyString(narrative),
    `${context} narrative must be a non-empty string`,
  ).toBe(true);
  expect(
    narrative.trim().length,
    `${context} narrative should be longer than 10 characters`,
  ).toBeGreaterThan(10);
}

function assertConcreteStep(step: ActionStep, context: string): void {
  assertValidReach(step.reach, context);

  expect(
    typeof step.difficulty === 'number' && Number.isFinite(step.difficulty),
    `${context} difficulty must be a finite number`,
  ).toBe(true);
  expect(
    step.difficulty >= 0 && step.difficulty <= 1,
    `${context} difficulty out of range [0, 1]: ${step.difficulty}`,
  ).toBe(true);

  expect(step.duration.min, `${context} duration.min must be >= 1`).toBeGreaterThanOrEqual(1);
  expect(
    step.duration.min <= step.duration.max,
    `${context} duration min must be <= max (got ${step.duration.min} > ${step.duration.max})`,
  ).toBe(true);
}

function assertKnownAftermathKinds(template: UnifiedActionTemplate): void {
  const cfg = template.aftermathConfig;
  if (!cfg) {
    return;
  }

  const effects: EncounterAftermathReactionEffect[] = [];
  if (cfg.fallback?.reactions) {
    for (const reaction of cfg.fallback.reactions) {
      effects.push(...reaction.effects);
    }
  }

  for (const variant of Object.values(cfg.variants)) {
    for (const reaction of variant.reactions ?? []) {
      effects.push(...reaction.effects);
    }
  }

  for (const effect of effects) {
    expect(
      KNOWN_AFTERMATH_EFFECT_KINDS.has(effect.kind),
      `${template.id} uses unknown aftermath effect kind: ${effect.kind}`,
    ).toBe(true);
  }
}

export function assertValidUnifiedTemplate(template: UnifiedActionTemplate): void {
  expect(
    isNonEmptyString(template.id),
    'template.id must be a non-empty string',
  ).toBe(true);
  expect(
    isNonEmptyString(template.name),
    `${template.id} must have a non-empty name`,
  ).toBe(true);

  assertValidReach(template.reach, `${template.id} template reach`);

  expect(
    VALID_RARITY_TIERS.has(template.rarityTier),
    `${template.id} has invalid rarityTier: ${template.rarityTier}`,
  ).toBe(true);

  expect(
    template.steps.length >= 1,
    `${template.id} must have at least one step`,
  ).toBe(true);

  for (const step of template.steps) {
    assertValidStep(step, template.id);
  }

  assertKnownAftermathKinds(template);
}

export function assertValidEncounterTemplate(template: EncounterTemplate): void {
  expect(
    isNonEmptyString(template.id),
    'encounter template id must be a non-empty string',
  ).toBe(true);
  expect(
    isNonEmptyString(template.name),
    `${template.id} must have a non-empty name`,
  ).toBe(true);

  assertValidReach(template.reachPrimary, `${template.id} reachPrimary`, true);
  assertValidReach(template.reachSecondary, `${template.id} reachSecondary`, true);

  expect(
    template.steps.length >= 2 && template.steps.length <= 4,
    `${template.id} must have 2-4 steps (got ${template.steps.length})`,
  ).toBe(true);
  expect(
    template.locationTypes.length >= 1,
    `${template.id} must have at least one location type`,
  ).toBe(true);
  expect(
    template.motivations.length >= 1,
    `${template.id} must have at least one motivation`,
  ).toBe(true);

  for (const step of template.steps) {
    assertValidReach(step.reach, `${template.id}.${step.id} reach`, true);
    assertValidNarrative(step.onSuccess.narrative, `${template.id}.${step.id} onSuccess`);
    assertValidNarrative(step.onFailure.narrative, `${template.id}.${step.id} onFailure`);
  }
}

export function assertValidStep(step: ActionStepOrBranch, templateId: string): void {
  if (isActionStepBranch(step)) {
    for (const [choiceId, variantStep] of Object.entries(step.variants)) {
      assertConcreteStep(variantStep, `${templateId} branch variant:${choiceId}`);
    }
    assertConcreteStep(step.fallback, `${templateId} branch fallback`);
    return;
  }

  assertConcreteStep(step, `${templateId} step`);
}

export function assertNoDuplicateIds<T extends { readonly id: string }>(items: readonly T[]): void {
  const seen = new Set<string>();

  for (const item of items) {
    expect(
      isNonEmptyString(item.id),
      'item id must be a non-empty string',
    ).toBe(true);

    expect(
      seen.has(item.id),
      `duplicate id found: ${item.id}`,
    ).toBe(false);
    seen.add(item.id);
  }
}

export function assertAllValidReaches(templates: readonly UnifiedActionTemplate[]): void {
  for (const template of templates) {
    for (const step of template.steps) {
      assertValidStep(step, template.id);
    }
  }
}
