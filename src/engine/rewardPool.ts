/**
 * Reward Pool Assembly, Drawing, and Instantiation.
 *
 * Given a RewardPoolRecipe, queries the graph for matching attachment
 * candidates, applies tier curve weighting, and produces a weighted pool.
 * After drawing, instantiateReward clones the template node and creates
 * the appropriate edge (possesses or has_trait) for the recipient agent.
 *
 * Companion entries are registry-backed rather than graph nodes (THR-1096).
 * The recipient's `reward_tier_bonus` rule override slides the tier curve here,
 * at the single seeded draw path (THR-1241).
 */

import type { WorldGraph } from './graph';
import { readBonusOverride, type RuleOverrideContext } from './effects/ruleOverrideConsumers';
import { REWARD_TIER_BONUS_CAP } from '../data/effect-constants';
import type {
  ResolvedRewardRecipe,
  RewardPoolRecipe,
  AttachmentTier,
  AttachmentCategory,
} from '../types/attachments';
import type { OutcomeType } from '../types/resolution';
import type { UnifiedActionOutcome } from '../types/unifiedAction';
import type { AttachmentEffect, ContentGrantEffect } from '../types/effects';
import { mulberry32 } from '../lib/prng';
import { applyResourceDelta } from './effects/resourceDelta';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';
import { filterAgreementTemplates, type AgreementRewardTemplate } from '../data/agreement-reward-catalog';
import { filterCompanionTemplates, getCompanionTemplate } from '../data/companion-templates';
import { mintCompanion, isAtCompanionCap, isUniqueAlreadyInstanced } from './companions';

export interface PoolEntry {
  nodeId: string;
  weight: number;
  /** For agreement entries: the agreement template ID (nodeId will be the template ID). */
  isAgreement?: boolean;
  /** For companion entries: the companion template ID (THR-1096; registry-backed, not a graph node). */
  isCompanion?: boolean;
}

/**
 * Which node type (and subcategory) a reward category draws from, or `null` for
 * the categories that are not node-backed at all.
 *
 * Exported because the authoring-time gate (`validateRewardDrawPools`) has to
 * ask *exactly* this question against the seed catalogs. A recipe naming tags
 * that match nothing is a silently empty pool — the THR-844 rot class — and a
 * gate that reimplemented the mapping would drift from the runtime it guards,
 * which is the failure it exists to prevent (THR-1146).
 */
export function rewardCategoryNodeQuery(
  category: AttachmentCategory,
): { nodeType: 'artifact' | 'artifact_legendary' | 'trait'; subcategory?: string } | null {
  switch (category) {
    case 'possession':
    case 'spell':
      return { nodeType: 'artifact' };
    case 'condition':
    case 'blessing':
    case 'curse':
      return { nodeType: 'trait', subcategory: 'condition' };
    case 'bestowed_power':
      return { nodeType: 'trait', subcategory: 'bestowed' };
    // Holdings are NEVER drawn (THR-1297). A holding is earned by doing the
    // undertaking that takes or builds the place; it is not loot, and there is no
    // catalog of ownable towns to draw one from. The arm is explicit rather than
    // left to `default` so the *gate* understands the category — a recipe that
    // weights `holding` is an authoring error the liveness check can now name,
    // instead of a pool that silently comes up empty (the THR-844 rot class this
    // function exists to catch). `categoryWeights` stays holding-free.
    case 'holding':
      return null;
    // Agreements and companions are catalog/registry-backed, not graph nodes —
    // `assembleRewardPool` handles both before it ever reaches this mapping.
    default:
      return null;
  }
}

/**
 * Does a node-shaped candidate satisfy a recipe's tag filter?
 *
 * **Every** tag must be present, and tags carry their `#` in the library
 * (`'#weapon'`, not `'weapon'`) — the single most likely way for an author to
 * write a filter that matches nothing.
 */
export function rewardCandidateMatchesTags(
  nodeTags: unknown,
  tagFilters?: readonly string[],
): boolean {
  if (!tagFilters || tagFilters.length === 0) return true;
  const tags = nodeTags as string[] | undefined;
  if (!tags) return false;
  return tagFilters.every(t => tags.includes(t));
}

/**
 * Map category to graph node search.
 */
function getCandidateNodes(
  graph: WorldGraph,
  category: AttachmentCategory,
  tagFilters?: string[],
): Array<{ id: string; tier: number }> {
  const query = rewardCategoryNodeQuery(category);
  if (!query) return [];

  let nodes = graph.getNodesByType(query.nodeType);

  if (query.subcategory) {
    nodes = nodes.filter(n => n.properties.subcategory === query.subcategory);
  }

  nodes = nodes.filter(n => rewardCandidateMatchesTags(n.properties.tags, tagFilters));

  return nodes.map(n => ({
    id: n.id,
    tier: (n.properties.tier as number) ?? 1,
  }));
}

/**
 * Assemble a weighted pool. Each candidate's weight = categoryWeight × tierCurve[tier].
 * Agreement candidates come from the agreement catalog (edge-backed, not nodes).
 */
export function assembleRewardPool(
  graph: WorldGraph,
  recipe: ResolvedRewardRecipe,
  /**
   * The agent who would receive the reward. Required for companion candidates —
   * the cap and unique filters are per-bearer, so without it companions are
   * simply not offered rather than offered wrongly (THR-1096).
   */
  bearerId?: string,
): PoolEntry[] {
  const pool: PoolEntry[] = [];

  for (const [category, categoryWeight] of Object.entries(recipe.categoryWeights)) {
    if (!categoryWeight || categoryWeight <= 0) continue;

    // Companion candidates come from the template registry, not the graph, and
    // are filtered per-bearer: nothing is offered at the cap, and a unique that
    // already exists in the world is never offered again.
    if (category === 'companion') {
      if (!bearerId) continue;
      if (isAtCompanionCap(graph, bearerId)) continue;
      for (const template of filterCompanionTemplates(recipe.tagFilters)) {
        if (template.unique && isUniqueAlreadyInstanced(graph, template.id)) continue;
        const tierWeight = recipe.tierCurve[template.tier as AttachmentTier] ?? 0;
        const weight = categoryWeight * tierWeight;
        if (weight > 0) {
          pool.push({ nodeId: template.id, weight, isCompanion: true });
        }
      }
      continue;
    }

    // Agreement candidates come from the catalog, not the graph
    if (category === 'agreement') {
      const templates = filterAgreementTemplates(recipe.tagFilters);
      for (const template of templates) {
        const tierWeight = recipe.tierCurve[template.tier as AttachmentTier] ?? 0;
        const weight = categoryWeight * tierWeight;
        if (weight > 0) {
          pool.push({ nodeId: template.id, weight, isAgreement: true });
        }
      }
      continue;
    }

    const candidates = getCandidateNodes(
      graph,
      category as AttachmentCategory,
      recipe.tagFilters,
    );

    for (const candidate of candidates) {
      const tierWeight = recipe.tierCurve[candidate.tier as AttachmentTier] ?? 0;
      const weight = categoryWeight * tierWeight;
      if (weight > 0) {
        pool.push({ nodeId: candidate.id, weight });
      }
    }
  }

  return pool;
}

/**
 * Draw from weighted pool using deterministic roll (0.0–1.0).
 */
export function drawFromPool(
  pool: PoolEntry[],
  roll: number,
): string | null {
  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  if (totalWeight <= 0) return null;

  const target = roll * totalWeight;
  let cumulative = 0;

  for (const entry of pool) {
    cumulative += entry.weight;
    if (target < cumulative) {
      return entry.nodeId;
    }
  }

  return pool[pool.length - 1].nodeId;
}

// ─── Tier Curves by Resolution Outcome ─────────────────────────────────

export const TIER_CURVE_CRITICAL_SUCCESS: Record<AttachmentTier, number> = { 1: 0.10, 2: 0.40, 3: 0.40, 4: 0.10 };
export const TIER_CURVE_SUCCESS: Record<AttachmentTier, number> = { 1: 0.40, 2: 0.40, 3: 0.15, 4: 0.05 };
export const TIER_CURVE_FAILURE: Record<AttachmentTier, number> = { 1: 0.20, 2: 0.10, 3: 0.05, 4: 0.0 };
export const TIER_CURVE_CRITICAL_FAILURE: Record<AttachmentTier, number> = { 1: 0.05, 2: 0.05, 3: 0.05, 4: 0.0 };

export const BAD_OUTCOME_CHANCE_CRIT_SUCCESS = 0.0;
export const BAD_OUTCOME_CHANCE_SUCCESS = 0.05;
export const BAD_OUTCOME_CHANCE_FAILURE = 0.65;
export const BAD_OUTCOME_CHANCE_CRIT_FAILURE = 0.85;

/** Bad outcome category weights — harmful attachments for failed draws */
export const BAD_OUTCOME_CATEGORY_WEIGHTS: Partial<Record<AttachmentCategory, number>> = {
  condition: 0.60,
  curse: 0.30,
  blessing: 0.10,
};

/** Reward node ID prefix */
export const REWARD_INSTANTIATE_PREFIX = 'reward';

/** Source tag for reward-created edges */
export const REWARD_EDGE_SOURCE = 'encounter_reward';

/** Default ticks for condition duration when not specified on template */
export const REWARD_CONDITION_DEFAULT_TICKS = 15;
export const REWARD_SERVICE_MAX_DEPTH = 3;

/**
 * Map resolution outcome quality to tier curve and bad outcome chance.
 */
export function getTierCurveForOutcome(outcomeType: OutcomeType): {
  tierCurve: Record<AttachmentTier, number>;
  badOutcomeChance: number;
} {
  switch (outcomeType) {
    case 'critical_success':
      return { tierCurve: TIER_CURVE_CRITICAL_SUCCESS, badOutcomeChance: BAD_OUTCOME_CHANCE_CRIT_SUCCESS };
    case 'success':
      return { tierCurve: TIER_CURVE_SUCCESS, badOutcomeChance: BAD_OUTCOME_CHANCE_SUCCESS };
    case 'failure':
      return { tierCurve: TIER_CURVE_FAILURE, badOutcomeChance: BAD_OUTCOME_CHANCE_FAILURE };
    case 'critical_failure':
      return { tierCurve: TIER_CURVE_CRITICAL_FAILURE, badOutcomeChance: BAD_OUTCOME_CHANCE_CRIT_FAILURE };
  }
}

/**
 * Combine a template-level recipe with outcome-determined tier curve and bad outcome chance.
 */
export function resolveRewardRecipe(
  templateRecipe: RewardPoolRecipe,
  outcomeType: OutcomeType,
  tierBonus = 0,
): ResolvedRewardRecipe {
  const { tierCurve, badOutcomeChance } = getTierCurveForOutcome(outcomeType);
  return {
    ...templateRecipe,
    tierCurve: shiftTierCurve(tierCurve, tierBonus),
    badOutcomeChance,
  };
}

/**
 * Slide a tier curve's weight up (or down) the ladder by `bonus` bands (THR-1241).
 *
 * `reward_tier_bonus` is additive and the tiers are ordinal, so the honest
 * reading is "the same luck, aimed one rung higher" — the shape of the curve is
 * preserved and only where it sits moves. Weight pushed past the top band piles
 * onto the top band rather than vanishing, which is what keeps the curve summing
 * to what it summed to before (a curve that quietly lost mass would make a
 * blessed draw *less* likely to produce anything at all).
 *
 * Clamped to `REWARD_TIER_BONUS_CAP` so a stacked bonus cannot collapse every
 * draw into tier 4 and make the authored curves decorative.
 */
export function shiftTierCurve(
  curve: Record<AttachmentTier, number>,
  bonus: number,
): Record<AttachmentTier, number> {
  const shift = Math.round(
    Math.max(-REWARD_TIER_BONUS_CAP, Math.min(REWARD_TIER_BONUS_CAP, bonus)),
  );
  if (shift === 0) return curve;

  const tiers = Object.keys(curve).map(Number).sort((a, b) => a - b) as AttachmentTier[];
  const shifted = {} as Record<AttachmentTier, number>;
  for (const tier of tiers) shifted[tier] = 0;

  for (let i = 0; i < tiers.length; i++) {
    const destination = tiers[Math.min(tiers.length - 1, Math.max(0, i + shift))];
    shifted[destination] += curve[tiers[i]];
  }
  return shifted;
}

// ─── The single seeded draw path (THR-1146) ────────────────────────────

/**
 * Normalise any {@link OutcomeType} to one of the four bands the tier curves
 * are written for.
 *
 * `OutcomeType` carries a fifth member, `success_at_cost`, that
 * {@link getTierCurveForOutcome} has no arm for — it would return `undefined`
 * and the destructure in {@link resolveRewardRecipe} would throw, against
 * NFP #4. Both existing callers happen to map it away before they get here, so
 * the hole has never been reachable; closing it in the shared path means the
 * third caller cannot reopen it.
 */
function normaliseRewardOutcome(outcome: OutcomeType): OutcomeType {
  return outcome === 'success_at_cost' ? 'success' : outcome;
}

/**
 * Which tier curve an *action-level* outcome reads (THR-1146).
 *
 * The step route has {@link OutcomeType} already; an aftermath reaction has the
 * action's {@link UnifiedActionOutcome}, which additionally carries the two
 * contested bands. A contest won is a success and a contest lost is a failure —
 * the reward table has no third thing to say about them.
 */
export function mapActionOutcomeToRewardOutcome(
  outcome: UnifiedActionOutcome | undefined,
): OutcomeType {
  switch (outcome) {
    case 'critical_success': return 'critical_success';
    case 'critical_failure': return 'critical_failure';
    case 'failure':
    case 'contested_lost': return 'failure';
    case 'success':
    case 'success_at_cost':
    case 'contested_won': return 'success';
    // An aftermath always follows a resolved action, so this is unreachable in
    // practice; `success` keeps an unresolved one paying out rather than
    // throwing (NFP #4).
    default: return 'success';
  }
}

export interface SeededRewardDrawParams {
  readonly recipe: RewardPoolRecipe;
  /** The already-resolved outcome band. Sets the tier curve and bad-outcome chance. */
  readonly outcomeType: OutcomeType;
  readonly seed: number;
  readonly tick: number;
  /** Whose luck this is — part of the seed key. */
  readonly actorId: string;
  /** The encounter/action template — part of the seed key. */
  readonly templateId: string;
  /** Who receives the prize. Defaults to `actorId`. */
  readonly recipientId?: string;
  /**
   * THR-1241: rule-override context for the recipient's `reward_tier_bonus`.
   * Optional — omitted, the tier curve is the authored one.
   */
  readonly overrideCtx?: RuleOverrideContext;
}

export interface SeededRewardDraw {
  /** The draw flipped to the harmful table (failure bands mostly do). */
  readonly isBadOutcome: boolean;
  readonly poolSize: number;
  /** The draw roll, or null when the pool was empty and no draw happened. */
  readonly drawRoll: number | null;
  readonly drawnTemplateId: string | null;
  /** Null when the pool was empty or the template refused to instantiate. */
  readonly instantiation: InstantiateRewardResult | null;
  readonly tier: number | null;
  readonly templateName: string | null;
}

/**
 * Resolve a {@link RewardPoolRecipe} into an actual prize: pick the tier curve
 * from the outcome, roll the bad-outcome flip, assemble the pool, draw, and
 * instantiate onto the recipient.
 *
 * **This is the one draw path.** THR-1146 added `reward_draw` as an aftermath
 * effect kind, and the obvious way to build it — copy the twenty lines out of
 * `resolveUnifiedReward` — would have produced two draws that agreed until the
 * day one of them was tuned. So the step route was moved onto this function in
 * the same change, and the identity the ticket asks for is a property of the
 * code rather than a claim a test has to keep re-checking: there is only one
 * implementation to be identical to.
 *
 * Callers own their own telemetry. The pool being empty is a *result*, not an
 * error — it comes back as `poolSize: 0` with nulls, and each caller records it
 * the way its surface wants (NFP #4).
 */
export function drawSeededReward(
  graph: WorldGraph,
  params: SeededRewardDrawParams,
): SeededRewardDraw {
  const { recipe, seed, tick, actorId, templateId } = params;
  const recipientId = params.recipientId ?? actorId;

  const rng = mulberry32(seed + tick * 41 + hashString(actorId) + hashString(templateId));

  // THR-1241: `reward_tier_bonus` owns this site — the single seeded draw path
  // every reward in the game runs through (THR-1146). It is read against the
  // *recipient*, not the actor: the bonus is "what the world gives you", and a
  // gift routed to someone else is their luck, not yours. Read before the rng
  // draws so the number of draws never depends on whether a bonus is present
  // (NFP #3 — same seed, same world).
  const tierBonus = params.overrideCtx !== undefined
    ? readBonusOverride(params.overrideCtx, recipientId, 'reward_tier_bonus', 'rewardPool.draw')
    : 0;
  const resolved = resolveRewardRecipe(
    recipe, normaliseRewardOutcome(params.outcomeType), tierBonus,
  );

  // Roll order is load-bearing: bad-outcome flip first, then the draw. Both
  // routes consume the same stream in the same order, so the same inputs give
  // the same prize.
  const badRoll = rng();
  const isBadOutcome = badRoll < resolved.badOutcomeChance;
  const effectiveRecipe = isBadOutcome
    ? { ...resolved, categoryWeights: BAD_OUTCOME_CATEGORY_WEIGHTS, tagFilters: undefined }
    : resolved;

  // `recipientId` feeds the companion cap/unique filters (THR-1096); every other
  // category ignores it.
  const pool = assembleRewardPool(graph, effectiveRecipe, recipientId);
  if (pool.length === 0) {
    return {
      isBadOutcome, poolSize: 0, drawRoll: null,
      drawnTemplateId: null, instantiation: null, tier: null, templateName: null,
    };
  }

  const drawRoll = rng();
  const drawnTemplateId = drawFromPool(pool, drawRoll);
  if (!drawnTemplateId) {
    return {
      isBadOutcome, poolSize: pool.length, drawRoll,
      drawnTemplateId: null, instantiation: null, tier: null, templateName: null,
    };
  }

  const instantiation = instantiateReward(graph, drawnTemplateId, recipientId, tick);

  // Companion templates live in the registry, not the graph, so the node lookup
  // misses them — read the registry for name and tier (THR-1096).
  const companionTemplate = getCompanionTemplate(drawnTemplateId);
  const templateNode = graph.getNode(drawnTemplateId);
  const tier = companionTemplate?.tier ?? (templateNode?.properties?.tier as number) ?? 1;
  const templateName = companionTemplate?.profession ?? templateNode?.name ?? null;

  return {
    isBadOutcome, poolSize: pool.length, drawRoll,
    drawnTemplateId, instantiation, tier, templateName,
  };
}

// ─── Reward Instantiation ──────────────────────────────────────────────

export interface InstantiateRewardResult {
  instanceId: string;
  edgeId: string;
  /** 'possession' | 'condition' | 'bestowed' | 'service' | 'companion' — determines edge type/runtime handling */
  category: 'possession' | 'condition' | 'bestowed' | 'service' | 'companion';
  /** Human-readable reward name for timeline/debug surfaces */
  displayName: string;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return hash;
}

function selectGrantedTemplateId(
  effect: ContentGrantEffect,
  recipientAgentId: string,
  tick: number,
  sourceTemplateId: string,
): string | null {
  if (effect.templateIds.length === 0) return null;
  if (effect.selection !== 'random') return effect.templateIds[0];

  const rng = mulberry32(
    tick * 131 + hashString(recipientAgentId) + hashString(sourceTemplateId),
  );
  const index = Math.floor(rng() * effect.templateIds.length);
  return effect.templateIds[index] ?? effect.templateIds[0] ?? null;
}

function applyServiceReward(
  graph: WorldGraph,
  templateNodeId: string,
  recipientAgentId: string,
  tick: number,
  effects: AttachmentEffect[],
  depth: number,
): InstantiateRewardResult | null {
  let grantedResult: InstantiateRewardResult | null = null;

  for (const effect of effects) {
    if (effect.type !== 'content_grant') continue;

    const grantedTemplateId = selectGrantedTemplateId(effect, recipientAgentId, tick, templateNodeId);
    if (!grantedTemplateId || grantedTemplateId === templateNodeId) continue;

    const granted = instantiateRewardInternal(graph, grantedTemplateId, recipientAgentId, tick, depth + 1);
    if (!granted) continue;
    grantedResult = granted;
    break;
  }

  if (!grantedResult) return null;
  return {
    instanceId: grantedResult.instanceId,
    edgeId: grantedResult.edgeId,
    category: 'service',
    displayName: grantedResult.displayName,
  };
}

/**
 * Clone a template node and create the appropriate edge to the recipient agent.
 * Returns null if template or agent node is missing.
 *
 * Edge types:
 * - artifact → `possesses` edge with modifiers/grants/tags
 * - trait (subcategory: 'condition') → `has_trait` edge with ticksRemaining
 * - trait (subcategory: 'bestowed') → `has_trait` edge, permanent (no expiry)
 */
export function instantiateReward(
  graph: WorldGraph,
  templateNodeId: string,
  recipientAgentId: string,
  tick: number,
): InstantiateRewardResult | null {
  return instantiateRewardInternal(graph, templateNodeId, recipientAgentId, tick, 0);
}

function instantiateRewardInternal(
  graph: WorldGraph,
  templateNodeId: string,
  recipientAgentId: string,
  tick: number,
  depth: number,
): InstantiateRewardResult | null {
  if (depth > REWARD_SERVICE_MAX_DEPTH) return null;

  // Companion templates are registry-backed, not graph nodes — check the
  // registry before the node lookup, which would otherwise return null (THR-1096).
  if (getCompanionTemplate(templateNodeId)) {
    const prng = mulberry32(
      tick * 149 + hashString(recipientAgentId) + hashString(templateNodeId),
    );
    const minted = mintCompanion(graph, templateNodeId, recipientAgentId, tick, prng, {
      source: REWARD_EDGE_SOURCE,
      respectCap: true,
    });
    if (!minted) return null;
    return {
      instanceId: minted.companionId,
      edgeId: minted.edgeId,
      category: 'companion',
      displayName: minted.name,
    };
  }

  const template = graph.getNode(templateNodeId);
  if (!template) return null;

  const agent = graph.getNode(recipientAgentId);
  if (!agent) return null;

  if (
    (template.type === 'artifact' || template.type === 'artifact_legendary')
    && template.properties.rewardMode === 'service'
  ) {
    const serviceEffects = template.properties.effects as AttachmentEffect[] | undefined;
    if (!serviceEffects || serviceEffects.length === 0) return null;
    return applyServiceReward(
      graph,
      templateNodeId,
      recipientAgentId,
      tick,
      serviceEffects,
      depth,
    );
  }

  const instanceId = `${REWARD_INSTANTIATE_PREFIX}_${recipientAgentId}_${tick}_${templateNodeId}`;

  // Clone node with new ID and reward metadata
  graph.addNode({
    id: instanceId,
    type: template.type,
    name: template.name,
    properties: {
      ...template.properties,
      source: REWARD_EDGE_SOURCE,
      acquiredTick: tick,
    },
  });

  const edgeId = `${instanceId}_edge`;
  const subcategory = template.properties.subcategory as string | undefined;

  let rewardResult: InstantiateRewardResult | null = null;

  if (template.type === 'artifact' || template.type === 'artifact_legendary') {
    // Possession → possesses edge
    const reachBonus = template.properties.reachBonus as Record<string, number> | undefined;
    graph.addEdge({
      id: edgeId,
      source: recipientAgentId,
      target: instanceId,
      type: 'possesses',
      properties: {
        modifiers: reachBonus ?? {},
        tags: (template.properties.tags as string[]) ?? [],
      },
    });
    rewardResult = { instanceId, edgeId, category: 'possession', displayName: template.name };
  } else if (template.type === 'trait' && subcategory === 'bestowed') {
    // Bestowed power → has_trait edge, permanent
    const domainContributions = template.properties.domainContributions as Record<string, number> | undefined;
    graph.addEdge({
      id: edgeId,
      source: recipientAgentId,
      target: instanceId,
      type: 'has_trait',
      properties: {
        level: 1,
        acquiredTick: tick,
        ticksRemaining: null,
        source: REWARD_EDGE_SOURCE,
        visibility: template.properties.visibility ?? 'public',
        modifiers: domainContributions ?? {},
      },
    });
    rewardResult = { instanceId, edgeId, category: 'bestowed', displayName: template.name };
  } else if (template.type === 'trait') {
    // Condition (wound/blessing/curse/disease) → has_trait edge with expiry
    const domainContributions = template.properties.domainContributions as Record<string, number> | undefined;
    const totalTicks = (template.properties.ticksRemaining as number | undefined) ?? REWARD_CONDITION_DEFAULT_TICKS;
    graph.addEdge({
      id: edgeId,
      source: recipientAgentId,
      target: instanceId,
      type: 'has_trait',
      properties: {
        level: 1,
        acquiredTick: tick,
        ticksRemaining: totalTicks,
        totalTicks,
        source: REWARD_EDGE_SOURCE,
        visibility: template.properties.visibility ?? 'public',
        modifiers: domainContributions ?? {},
      },
    });
    rewardResult = { instanceId, edgeId, category: 'condition', displayName: template.name };
  }

  if (!rewardResult) {
    // Unknown node type — skip
    return null;
  }

  // Apply any resource_delta effects immediately (TB-104 Phase 1B)
  const rewardEffects = (template.properties.effects ?? []) as AttachmentEffect[];
  for (const eff of rewardEffects) {
    if (eff.type !== 'resource_delta') continue;
    const agentNode = graph.getNode(recipientAgentId);
    if (!agentNode) break;
    const agentProps = agentNode.properties as Record<string, unknown>;
    const deltaResult = applyResourceDelta(eff, {
      essence: (agentProps.essence as number) ?? 0,
      quintessence: (agentProps.quintessence as number) ?? 0,
      quintessenceMax: (agentProps.quintessenceMax as number) ?? Infinity,
      doom: (agentProps.doom as number) ?? 0,
      doomThreshold: (agentProps.doomThreshold as number) ?? 100,
    }, recipientAgentId, 'reward');
    if (deltaResult.applied) {
      agentProps[eff.resource] = deltaResult.after;
      graph.updateNode(recipientAgentId, { properties: agentProps });
      emitTrace({
        category: 'effect_reaction',
        tick,
        agentId: recipientAgentId,
        event: 'resource_delta_applied',
        ...deltaResult.trace,
      } as unknown as TraceEntry);
    }
  }

  return rewardResult;
}

// ─── Agreement Reward Instantiation ───────────────────────────────

export interface InstantiateAgreementResult {
  edgeId: string;
  displayName: string;
}

/**
 * Create a `relates_to` edge with agreement properties from a template.
 * Agreements are edge-backed — no node is cloned.
 *
 * @param graph - World graph
 * @param recipientId - Agent who receives the agreement
 * @param counterpartyId - The other party (can be a location, faction, or agent)
 * @param template - Agreement template from the catalog
 * @param tick - Current game tick
 */
export function instantiateAgreementReward(
  graph: WorldGraph,
  recipientId: string,
  counterpartyId: string,
  template: AgreementRewardTemplate,
  tick: number,
): InstantiateAgreementResult | null {
  const recipient = graph.getNode(recipientId);
  if (!recipient) return null;

  const edgeId = `agreement_${recipientId}_${counterpartyId}_${tick}_${template.id}`;

  graph.addEdge({
    id: edgeId,
    source: recipientId,
    target: counterpartyId,
    type: 'relates_to',
    properties: {
      agreement: true,
      agreementName: template.name,
      tier: template.tier,
      tags: template.tags,
      effects: template.effects,
      active: true,
      acquiredTick: tick,
      source: REWARD_EDGE_SOURCE,
      ticksRemaining: template.ticksRemaining,
      terms: template.terms,
      agreementType: template.agreementType,
    },
  });

  return { edgeId, displayName: template.name };
}
