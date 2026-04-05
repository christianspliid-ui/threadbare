/**
 * Effect System — barrel export.
 *
 * Five integration points, two shared infrastructure modules:
 *   effectWalker.ts      — shared attachment effect collector
 *   effectPredicates.ts  — shared condition evaluator + context builder
 *   effectResolver.ts    — integration point 1: resolution modifiers (in parent dir, re-exported)
 *   effectTick.ts        — integration point 2: per-tick lifecycle (in parent dir)
 *   effectEvents.ts      — integration point 3: event reactions (planned)
 *   effectQueries.ts     — integration point 4: capability queries (planned)
 *   effectExecutors.ts   — integration point 5: world mutations (in parent dir)
 *
 * Design doc: Docs/plans/2026-04-05-effect-primitive-architecture.md
 */

// Shared infrastructure
export {
  collectAttachmentEffects,
  hasEffectsFormat,
  ATTACHMENT_EDGE_TYPES,
  type AttachedEffect,
} from './effectWalker';

export {
  evaluatePredicate,
  evaluateOptionalCondition,
  buildPredicateContext,
} from './effectPredicates';

// Event handler — fires effects in response to game events
export {
  processEffectEvent,
  applyEffectEventResult,
  type EffectEvent,
  type EffectEventResult,
} from './effectEvents';

// Query handler — read-only capability queries for game systems
export {
  hasGrantedTrait,
  getActionGates,
  getBehaviorWeights,
  computeBehaviorWeightMultiplier,
  getSocialModifiers,
  computeSocialCoopeartionBias,
  isImmuneToTag,
  getRangeModifiers,
  getActiveRuleOverride,
  type BehaviorWeight,
  type SocialModifier,
  type ActionGateEntry,
} from './effectQueries';
