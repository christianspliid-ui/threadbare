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
  collectGrantedTraits,
  GRANTED_TRAIT_EFFECTIVE_LEVEL,
  getActionGates,
  getBehaviorWeights,
  computeBehaviorWeightMultiplier,
  getSocialModifiers,
  computeSocialCooperationBias,
  isImmuneToTag,
  isImmuneToAnyTag,
  normalizeTag,
  getRangeModifiers,
  getRevealRanges,
  getActiveRuleOverride,
  type BehaviorWeight,
  type SocialModifier,
  type ActionGateEntry,
} from './effectQueries';

// Overlay / rule-override persistence (THR-1240)
export {
  applyExecutionOverlays,
  expireOverlays,
  getTerrainOverlaysAt,
  hasTerrainOverlay,
  getPersistedRuleOverride,
  foldRuleOverrideValues,
  neutralRuleOverrideValue,
  type OverlayStoreDelta,
} from './effectOverlayStore';

// Rule-override consumers — the one read path the owning sites share (THR-1241)
export {
  readMultiplierOverride,
  readBonusOverride,
  readFlagOverride,
  readReachOverride,
  type RuleOverrideContext,
} from './ruleOverrideConsumers';

// Suppression — the writer for `EffectRuntimeState.suppressed` (THR-1242)
export {
  applySuppressions,
  type SuppressionResult,
} from './effectSuppression';

// Resource delta — one-shot resource mutation (TB-104 Phase 1B)
export {
  applyResourceDelta,
  type ResourceDeltaInput,
  type ResourceDeltaResult,
} from './resourceDelta';

// Action trigger — event-driven effect firing (TB-104 Phase 1B)
export {
  checkAndFireActionTriggers,
  type ActionTriggerContext,
  type ActionTriggerResult,
} from './actionTrigger';
