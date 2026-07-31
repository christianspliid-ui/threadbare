import { expect } from 'vitest';
import type {
  ActionStep,
  ActionStepBranch,
  ActionStepOrBranch,
  BranchPoleKey,
  BranchRoute,
  EncounterAftermathReactionEffect,
  UnifiedActionTemplate,
} from '../types/unifiedAction';
import { isActionStepBranch, isRouteDecision } from '../types/unifiedAction';
import { REACH_DOMAINS } from '../types/traits';
import { VALUE_PAIRS } from '../types/agent';
import { leansOnAxis, leansOnRoute } from '../engine/encounters/poleLean';
import { MAX_BRANCH_ROUTES } from '../data/nudge-constants';

const VALID_REACHES = new Set<string>(REACH_DOMAINS);
const VALID_VALUE_PAIRS = new Set<string>(VALUE_PAIRS);
/** The only two keys a `decidedBy` branch may carry, sorted for comparison. */
const BRANCH_POLE_KEYS: readonly BranchPoleKey[] = ['negative', 'positive'];
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
  'intel_referenced_prose',
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
  'axiological_mark_apply',
  'signature_warhost',
  'sphere_influence_amplify',
  'spawn_unique_location',
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


export function assertValidStep(step: ActionStepOrBranch, templateId: string): void {
  if (isActionStepBranch(step)) {
    for (const [choiceId, variantStep] of Object.entries(step.variants)) {
      assertConcreteStep(variantStep, `${templateId} branch variant:${choiceId}`);
    }
    assertConcreteStep(step.fallback, `${templateId} branch fallback`);
    assertValidBranchDecision(step, templateId);
    return;
  }

  assertConcreteStep(step, `${templateId} step`);
  assertValidPoleLeans(step, templateId);
}

/**
 * A `decidedBy` branch must key exactly the two poles (THR-894).
 *
 * This is an assert, not a warn, because the failure it catches is silent by
 * construction: a typo'd variant key does not throw, it makes that variant
 * permanently unreachable and sends every decision to `fallback` forever — the
 * THR-844 shape, where 66 of 138 entries were dead and nothing noticed.
 */
function assertValidBranchDecision(step: ActionStepBranch, templateId: string): void {
  if (!step.decidedBy) return;

  if (isRouteDecision(step.decidedBy)) {
    assertValidRouteDecision(step, step.decidedBy.routes, templateId);
    return;
  }

  expect(
    VALID_VALUE_PAIRS.has(step.decidedBy.axis),
    `${templateId} branch decidedBy names an unknown axis: ${step.decidedBy.axis}`,
  ).toBe(true);

  const keys = Object.keys(step.variants).sort();
  expect(
    keys.length === BRANCH_POLE_KEYS.length && keys.every((k, i) => k === BRANCH_POLE_KEYS[i]),
    `${templateId} decidedBy branch must key exactly ${BRANCH_POLE_KEYS.join(' + ')} (got: ${keys.join(', ') || 'none'})`,
  ).toBe(true);
}

/**
 * An N-route branch must declare a coherent, reachable set of courses (THR-898).
 *
 * Same reasoning as the two-pole key check, one step wider: a route key that
 * matches no variant is a course the mortal can score highest on and never
 * actually take, and a variant keyed to no route is dead content that reads as
 * live. Both fail here rather than at the fallback, forever.
 */
function assertValidRouteDecision(
  step: ActionStepBranch,
  routes: readonly BranchRoute[],
  templateId: string,
): void {
  expect(
    routes.length >= 2,
    `${templateId} route branch must declare at least 2 routes (got ${routes.length})`,
  ).toBe(true);

  expect(
    routes.length <= MAX_BRANCH_ROUTES,
    `${templateId} route branch declares ${routes.length} routes, over the MAX_BRANCH_ROUTES cap of ${MAX_BRANCH_ROUTES}`,
  ).toBe(true);

  const seen = new Set<string>();
  for (const route of routes) {
    expect(
      isNonEmptyString(route.key),
      `${templateId} route key must be a non-empty string`,
    ).toBe(true);
    expect(
      seen.has(route.key),
      `${templateId} declares duplicate route key: ${route.key}`,
    ).toBe(false);
    seen.add(route.key);

    assertValidReach(route.reach, `${templateId} route '${route.key}'`);

    if (route.axis !== undefined) {
      expect(
        VALID_VALUE_PAIRS.has(route.axis),
        `${templateId} route '${route.key}' names an unknown axis: ${route.axis}`,
      ).toBe(true);
      // Without `toward`, an axis cannot be signed and the axis term would read
      // one end of the pair as good on every route that shares it.
      expect(
        route.toward === 'positive' || route.toward === 'negative',
        `${templateId} route '${route.key}' declares an axis but no toward pole`,
      ).toBe(true);
    }
  }

  const routeKeys = [...seen].sort();
  const variantKeys = Object.keys(step.variants).sort();
  expect(
    routeKeys.length === variantKeys.length && routeKeys.every((k, i) => k === variantKeys[i]),
    `${templateId} route branch variants must key exactly its routes `
    + `(routes: ${routeKeys.join(', ') || 'none'}; variants: ${variantKeys.join(', ') || 'none'})`,
  ).toBe(true);
}

/**
 * A card's `poleLean`, where axis-explicit, must name a live `ValuePair`.
 *
 * A route-explicit lean (THR-898) is checked for shape only. Whether its route
 * key is *live* cannot be answered here — the routes live on the branch step,
 * the card on the deciding step — so that half is caught one layer up: a card
 * naming a route that does not exist leans nothing, and every route it failed to
 * back is reported by {@link collectUnleanableBranchWarnings}.
 */
function assertValidPoleLeans(step: ActionStep, templateId: string): void {
  for (const nudge of step.nudges ?? []) {
    const lean = nudge.poleLean;
    if (lean === undefined || lean === 'a' || lean === 'b') continue;

    if ('route' in lean) {
      expect(
        isNonEmptyString(lean.route),
        `${templateId} nudge '${nudge.id}' poleLean route must be a non-empty string`,
      ).toBe(true);
      continue;
    }

    expect(
      VALID_VALUE_PAIRS.has(lean.axis),
      `${templateId} nudge '${nudge.id}' poleLean names an unknown axis: ${lean.axis}`,
    ).toBe(true);
  }
}

/**
 * Steps whose fork the god has no lever on (THR-894 item 6).
 *
 * A deciding step carrying no card that argues on the branch's axis is **legal**
 * — the mortal decides alone, which is a real authorial choice — but it is worth
 * stating, because the far likelier cause is a card whose `poleLean` names the
 * wrong axis and therefore abstains silently. A warn, not an assert.
 *
 * Returns one line per such branch; empty means every decided fork is leanable.
 */
export function collectUnleanableBranchWarnings(
  template: UnifiedActionTemplate,
): string[] {
  const warnings: string[] = [];

  for (const step of template.steps) {
    if (!isActionStepBranch(step) || !step.decidedBy) continue;

    const decidingStep = template.steps[step.branchOnStep];
    if (decidingStep === undefined || isActionStepBranch(decidingStep)) continue;

    const decidedBy = step.decidedBy;
    const cards = decidingStep.nudges ?? [];

    if (isRouteDecision(decidedBy)) {
      // Route mode warns per *route*, not per branch: a fork where the god can
      // argue for two of three courses and not the third is exactly as steerable
      // as it looks on two of them, and silently unsteerable on the third.
      for (const route of decidedBy.routes) {
        if (!cards.some((n) => leansOnRoute(n.poleLean, route))) {
          warnings.push(
            `${template.id} step ${step.branchOnStep} offers route '${route.key}' `
            + 'but deals no card arguing for it — the god has no lever on that course.',
          );
        }
      }
      continue;
    }

    const leaning = cards.filter((n) => leansOnAxis(n.poleLean, decidedBy.axis));
    if (leaning.length === 0) {
      warnings.push(
        `${template.id} step ${step.branchOnStep} decides '${decidedBy.axis}' `
        + 'but deals no card leaning on that axis — the god has no lever on direction.',
      );
    }
  }

  return warnings;
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
