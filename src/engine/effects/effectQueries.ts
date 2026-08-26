/**
 * Effect Query Handler — read-only queries for capability checks.
 *
 * Provides the answer to "does this agent currently have X?" questions,
 * reading effect data from the attachment graph and optional runtime state.
 * All functions are pure/stateless and can be called from any engine system.
 *
 * Integration points (Phase 3):
 *   - action_gate     → unifiedCandidates.ts (block/unlock by reach)
 *   - behavior_weight → encounterScoring.ts (desire multiplier)
 *   - social_modifier → disposition.ts (cooperation bias)
 *   - range_modifier  → movementCost.ts, encounterAwareness.ts
 *   - tag_immunity    → condition application (block matching tags)
 *   - trait_grant     → hasGrantedTrait (standalone capability check)
 *   - modify_rules    → getActiveRuleOverrides (Phase 5 systems)
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                  | Fallback                       |
 * |-------------------------------|--------------------------------|
 * | Missing agent node            | Return safe empty/default      |
 * | No effectStates               | Treat all effects as active    |
 * | Suppressed effect             | Skip (isEffectActive = false)  |
 * | Unknown effect type           | Ignore silently                |
 * | No condition context          | Treat conditions as true       |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — all queries are deterministic.
 *
 * Design doc: Docs/plans/2026-04-05-effect-primitive-architecture.md
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { ReachDomain } from '../../types/traits';
import type {
  AttachmentEffect,
  EffectRuntimeState,
  PredicateContext,
} from '../../types/effects';
import { collectAttachmentEffects } from './effectWalker';
import type { GameState } from '../../types/gameState';
import { foldRuleOverrideValues } from './effectOverlayStore';
import { evaluateOptionalCondition } from './effectPredicates';

// ═══════════════════════════════════════════════════════════════════
// Return Types
// ═══════════════════════════════════════════════════════════════════

/** Resolved behavior weight for a reach domain */
export interface BehaviorWeight {
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly reach: ReachDomain;
  readonly multiplier: number;
}

/** Resolved social modifier from a single attachment */
export interface SocialModifier {
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly targetFilter: 'ally' | 'enemy' | 'any' | 'same_faction' | 'different_faction';
  readonly cooperationBias: number;
}

/** Resolved action gate entry */
export interface ActionGateEntry {
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly mode: 'block' | 'unlock';
  readonly reach: ReachDomain;
}

// ═══════════════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if an effect is active given its runtime state.
 * Mirrors the check in effectResolver — suppressed or expired = inactive.
 */
function isActive(runtimeState?: EffectRuntimeState): boolean {
  if (runtimeState?.suppressed) return false;
  if (runtimeState?.ticksRemaining !== undefined && runtimeState.ticksRemaining <= 0) return false;
  if (runtimeState?.cooldownActive === false) return false;
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// Stat Contributions (Domain Capability)
// ═══════════════════════════════════════════════════════════════════

/**
 * Sum the `stat_contribution` effects declared on a single node's `effects[]`.
 *
 * Pure, node-level read (no graph walk, no edges) — the caller decides which
 * nodes to sum (THR-718 feeds this from `computeRawScore`'s possesses/bonded_to
 * artifact walk). Returns the additive raw-score terms per Reach domain; `{}`
 * when the node carries no effects, a malformed `effects` value, or no
 * `stat_contribution` entries.
 *
 * Fail-soft (NFP #4): a non-array `effects`, a non-object `contributions`, or a
 * non-numeric/NaN value is skipped without throwing — other entries still sum.
 */
export function collectStatContributions(
  node: GraphNode | undefined,
): Partial<Record<ReachDomain, number>> {
  const totals: Partial<Record<ReachDomain, number>> = {};
  const effects = node?.properties.effects as AttachmentEffect[] | undefined;
  if (!effects || !Array.isArray(effects)) return totals;

  for (const effect of effects) {
    if (!effect || effect.type !== 'stat_contribution') continue;
    const contributions = effect.contributions;
    if (!contributions || typeof contributions !== 'object') continue;
    for (const [domain, value] of Object.entries(contributions)) {
      if (typeof value !== 'number' || Number.isNaN(value)) continue;
      const key = domain as ReachDomain;
      totals[key] = (totals[key] ?? 0) + value;
    }
  }

  return totals;
}

// ═══════════════════════════════════════════════════════════════════
// Trait Query
// ═══════════════════════════════════════════════════════════════════

/**
 * Effective level credited to a trait that an effect grants.
 *
 * `trait_grant` carries no level of its own, so a granted trait satisfies a
 * level-bearing requirement at this tier and no higher. Mirrors the
 * `grantedTraitLevel ?? 1` default the sibling `grantsTraitWhileHeld` path
 * already uses in `computeRuinsBonus` (encounterScoring.ts).
 */
export const GRANTED_TRAIT_EFFECTIVE_LEVEL = 1;

/**
 * Collect every trait id granted to this agent by an active `trait_grant` effect.
 *
 * This is the aggregate the production gates consume — an agent "has" a trait
 * when a `has_trait` edge says so **or** when a possession/bond grants it. Call
 * sites union this set with their edge-derived trait keys rather than replacing
 * them; the two sources are additive.
 *
 * Fail-soft (NFP #4): a throwing graph walk yields whatever was collected before
 * the failure rather than propagating — a malformed attachment must never take
 * down encounter filtering, ambition selection, or spell activation.
 */
export function collectGrantedTraits(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): Set<string> {
  const granted = new Set<string>();
  try {
    for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
      if (!isActive(entry.runtimeState)) continue;
      if (entry.effect.type !== 'trait_grant') continue;
      const traitId = entry.effect.grantedTrait;
      if (typeof traitId === 'string' && traitId.length > 0) granted.add(traitId);
    }
  } catch {
    // Fall through with the partial set — see fail-soft note above.
  }
  return granted;
}

/**
 * Check whether any active effect on this agent grants the named trait.
 */
export function hasGrantedTrait(
  graph: WorldGraph,
  agentId: string,
  traitId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): boolean {
  return collectGrantedTraits(graph, agentId, effectStates).has(traitId);
}

// ═══════════════════════════════════════════════════════════════════
// Action Gates
// ═══════════════════════════════════════════════════════════════════

/**
 * Collect all active action gate effects on this agent.
 *
 * Returns arrays of blocked and unlocked reach domains.
 * Blocked takes priority over unlocked for the same reach.
 */
export function getActionGates(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  ctx?: PredicateContext,
): { blocked: ReachDomain[]; unlocked: ReachDomain[] } {
  const blocked = new Set<ReachDomain>();
  const unlocked = new Set<ReachDomain>();

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'action_gate') continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    if (entry.effect.mode === 'block') {
      blocked.add(entry.effect.reach);
    } else {
      unlocked.add(entry.effect.reach);
    }
  }

  // Blocked takes priority — remove from unlocked
  for (const reach of blocked) {
    unlocked.delete(reach);
  }

  return {
    blocked: Array.from(blocked),
    unlocked: Array.from(unlocked),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Behavior Weights
// ═══════════════════════════════════════════════════════════════════

/**
 * Collect all active behavior weight effects on this agent.
 *
 * Each entry represents a multiplier on desire scores for that reach.
 * Multiple weights on the same reach stack multiplicatively (both apply).
 */
export function getBehaviorWeights(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  ctx?: PredicateContext,
): BehaviorWeight[] {
  const weights: BehaviorWeight[] = [];

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'behavior_weight') continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    weights.push({
      attachmentId: entry.attachmentId,
      attachmentName: entry.attachmentName,
      reach: entry.effect.reach,
      multiplier: entry.effect.multiplier,
    });
  }

  return weights;
}

/**
 * Compute the combined behavior weight multiplier for a specific reach.
 * Weights stack multiplicatively. Returns 1.0 (no change) when no weights apply.
 */
export function computeBehaviorWeightMultiplier(
  weights: BehaviorWeight[],
  reach: ReachDomain,
): number {
  let multiplier = 1.0;
  for (const w of weights) {
    if (w.reach === reach) {
      multiplier *= w.multiplier;
    }
  }
  return multiplier;
}

// ═══════════════════════════════════════════════════════════════════
// Social Modifiers
// ═══════════════════════════════════════════════════════════════════

/**
 * Collect all active social modifier effects on this agent.
 */
export function getSocialModifiers(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  ctx?: PredicateContext,
): SocialModifier[] {
  const modifiers: SocialModifier[] = [];

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'social_modifier') continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    modifiers.push({
      attachmentId: entry.attachmentId,
      attachmentName: entry.attachmentName,
      targetFilter: entry.effect.targetFilter,
      cooperationBias: entry.effect.cooperationBias,
    });
  }

  return modifiers;
}

/**
 * Compute the net cooperation bias from a list of social modifiers.
 * Filters to modifiers relevant to a given target relationship type,
 * then sums their cooperationBias. Clamped to [-1, +1].
 *
 * @param modifiers - pre-fetched from getSocialModifiers
 * @param targetRelationship - how the target relates to the agent
 */
export function computeSocialCooperationBias(
  modifiers: SocialModifier[],
  targetRelationship: 'ally' | 'enemy' | 'same_faction' | 'different_faction',
): number {
  let total = 0;
  for (const mod of modifiers) {
    if (mod.targetFilter === 'any' || mod.targetFilter === targetRelationship) {
      total += mod.cooperationBias;
    }
  }
  return Math.max(-1, Math.min(1, total));
}

// ═══════════════════════════════════════════════════════════════════
// Tag Immunity
// ═══════════════════════════════════════════════════════════════════

/**
 * The canonical tag namespace is `#`-prefixed (THR-1242).
 *
 * Condition trait definitions have always written `#`-prefixed tags
 * (`['#condition', '#combat', '#negative']`), and so do reward tag filters. Most
 * `tag_immunity` content wrote them bare (`['fear', 'intimidation']`) — so even
 * once the immunity had a caller, `'fear'` would never have matched `'#fear'`
 * and the primitive would have read as wired and blocked nothing. That is a
 * worse failure than being dead, because the trace shows the check running.
 *
 * Content is migrated to the `#` spelling, and comparison normalizes anyway:
 * the namespace is a convention, and a convention enforced only by every author
 * remembering it is not enforced.
 */
export function normalizeTag(tag: string): string {
  return tag.startsWith('#') ? tag.slice(1) : tag;
}

/**
 * Check whether the agent is currently immune to a condition tag.
 *
 * An agent is immune if any active tag_immunity effect covers the tag.
 * Called at condition-application time (`encounterAftermath`) to block unwanted
 * conditions — see {@link isImmuneToAnyTag} for the list form the call sites use.
 *
 * Both sides are normalized through {@link normalizeTag}, so `'#fear'` and
 * `'fear'` are the same tag whichever spelling the content happens to carry.
 */
export function isImmuneToTag(
  graph: WorldGraph,
  agentId: string,
  tag: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  ctx?: PredicateContext,
): boolean {
  const wanted = normalizeTag(tag);

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'tag_immunity') continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    if (entry.effect.tags.some(t => normalizeTag(t) === wanted)) {
      return true;
    }
  }
  return false;
}

/**
 * The first tag on this list the agent is immune to, or `null` if none.
 *
 * A condition carries a tag *list*, and immunity to any one of them blocks it —
 * a ward against `#fear` should stop a terror however many other tags that
 * condition also carries. Returning the matching tag rather than a boolean is
 * what lets the infliction site name it in the trace, which is the difference
 * between "the condition did not land" and an inspectable reason it did not.
 */
export function isImmuneToAnyTag(
  graph: WorldGraph,
  agentId: string,
  tags: readonly string[],
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  ctx?: PredicateContext,
): string | null {
  for (const tag of tags) {
    if (isImmuneToTag(graph, agentId, tag, effectStates, ctx)) return tag;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// Range Modifiers
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute the combined range modifier for this agent.
 *
 * - movementCostMultiplier: stacks multiplicatively (all × together), default 1.0
 * - awarenessRangeBonus: stacks additively (sum), default 0
 */
export function getRangeModifiers(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  ctx?: PredicateContext,
): { movementCostMultiplier: number; awarenessRangeBonus: number } {
  let movementCostMultiplier = 1.0;
  let awarenessRangeBonus = 0;

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'range_modifier') continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    if (entry.effect.movementCostMultiplier !== undefined) {
      movementCostMultiplier *= entry.effect.movementCostMultiplier;
    }
    if (entry.effect.awarenessRangeBonus !== undefined) {
      awarenessRangeBonus += entry.effect.awarenessRangeBonus;
    }
  }

  return { movementCostMultiplier, awarenessRangeBonus };
}

// ═══════════════════════════════════════════════════════════════════
// Reveal Ranges (THR-1242)
// ═══════════════════════════════════════════════════════════════════

/**
 * Hex range this agent can see past its ordinary limits, per reveal target.
 *
 * `reveal` shipped on 17 content refs with no consumer at all — a scrying lens
 * that revealed nothing. This is the read half; the two live consumers are
 * `phaseMovement` (the `hexes` range lifts fog on arrival) and
 * `encounterAwareness` (the `encounters` range widens awareness hops).
 *
 * **`agent` and `attachments` are collected but have no consumer yet, and this
 * comment is the place that says so.** Both name inspection surfaces — "see who
 * that is", "see what they carry" — which live in the UI's agent-detail path,
 * not in a tick phase. Returning them keeps the query honest about what content
 * declares; it would be worse to silently drop them and leave a future reader
 * believing the primitive only ever had two targets. 3 of the 17 refs use them.
 *
 * `'all'` is represented as `Infinity`, so a caller may `Math.min` it against
 * whatever bound it enforces without special-casing the literal.
 *
 * Highest wins per target rather than summing: two lenses do not see twice as
 * far as the better one, and additive stacking on a range that gates a hex scan
 * is how a performance budget gets spent by content (NFP #7).
 */
export function getRevealRanges(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): { hexes: number; encounters: number; agent: number; attachments: number } {
  const ranges = { hexes: 0, encounters: 0, agent: 0, attachments: 0 };

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'reveal') continue;

    const range = entry.effect.range === 'all' ? Infinity : entry.effect.range;
    if (!Number.isFinite(range) && range !== Infinity) continue;
    if (typeof range !== 'number' || range < 0) continue;

    const target = entry.effect.target;
    if (range > ranges[target]) ranges[target] = range;
  }

  return ranges;
}

// ═══════════════════════════════════════════════════════════════════
// Rule Override Query
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute the effective numeric rule override value for a given rule key.
 *
 * Two sources, one fold (THR-1240):
 *   1. `modify_rules` effects declared on the agent's active attachments, and
 *   2. `ActiveRuleOverride` entries an executor persisted onto GameState.
 *
 * Before this stage only (1) existed, because nothing persisted (2) — the
 * executor produced the override and every consumer dropped it. Passing
 * `persisted` folds both through `foldRuleOverrideValues`, so an override has
 * the same effective value whichever way it arrived. Omitting it reads
 * attachments only, which is the historical behaviour and keeps every existing
 * caller correct without an edit.
 *
 * Returns a **number**: the neutral value is 0 for additive keys and 1.0 for
 * `*_multiplier` keys, so callers must not assume 0-means-absent for a
 * multiplier. Non-numeric keys (`encounter_reach_override`, the reach-swap
 * struct) are not readable here — use `getPersistedRuleOverride` for those.
 */
export function getActiveRuleOverride(
  graph: WorldGraph,
  agentId: string,
  rule: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  persisted?: Pick<GameState, 'activeRuleOverrides'>,
): number {
  const values: (number | boolean | string | object)[] = [];

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'modify_rules') continue;
    if (entry.effect.rule !== rule) continue;
    values.push(entry.effect.value);
  }

  if (persisted) {
    for (const entry of persisted.activeRuleOverrides?.[agentId] ?? []) {
      if (entry.rule === rule) values.push(entry.value);
    }
  }

  const folded = foldRuleOverrideValues(rule, values);
  if (typeof folded === 'number') return folded;
  // A flag or struct key read through the numeric accessor: report the neutral
  // numeric rather than NaN, so a mis-keyed caller degrades to "no override"
  // instead of poisoning arithmetic downstream (NFP #4).
  if (typeof folded === 'boolean') return folded ? 1 : 0;
  return 0;
}
