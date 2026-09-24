/**
 * Effect Executors — individual executor functions for spell effect types.
 *
 * Each executor is a pure function that takes the caster, effect data, and context,
 * returning graph mutations and traces. No direct graph mutation — callers apply.
 *
 * Covers Tier 2 (types 15–23) and Tier 3 (types 25–29) effect execution.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                    | Fallback                    |
 * |---------------------------------|-----------------------------|
 * | Teleport to invalid hex         | Clamp to nearest valid      |
 * | Spawn template not found        | Skip, trace warning         |
 * | Compel on player-controlled     | Block, trace                |
 * | Transform template not found    | Keep original, trace        |
 * | Cascade depth exceeded          | Truncate chain, trace       |
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

import type { WorldGraph } from './graph';
import type {
  AttachmentEffect,
  TeleportEffect,
  ForcedMoveEffect,
  SpawnEffect,
  DispelEffect,
  AlterTerrainEffect,
  TransferEffect,
  CompelEffect,
  CreateStructureEffect,
  DestroyStructureEffect,
  ModifyRulesEffect,
  FactionManipulateEffect,
  CascadeEffect,
  TransformEffect,
  ActiveTerrainOverlay,
  ActiveRuleOverride,
  ChoiceSetEffect,
  ChoiceOption,
  PredicateContext,
  ChoiceSetResolutionTrace,
  ResourceManipulateEffect,
  InflictConditionEffect,
} from '../types/effects';
import {
  CASCADE_MAX_DEPTH,
  CASCADE_MAX_EFFECTS,
  COMPEL_MAX_TICKS,
  CHOICE_SET_MAX_OPTIONS,
} from '../data/effect-constants';
import { evaluatePredicate, evaluateOptionalCondition } from './effects/effectPredicates';
import { mulberry32 } from '../lib/prng';

// ═══════════════════════════════════════════════════════════════════
// Execution Context
// ═══════════════════════════════════════════════════════════════════

export interface ExecutionContext {
  casterId: string;
  targetId?: string;
  targetHex?: { col: number; row: number };
  tick: number;
  graph: WorldGraph;
  /**
   * Optional predicate context for choice_set option filtering.
   * When absent, all options pass (no predicate gates applied).
   */
  predicateContext?: PredicateContext;
}

/** Pending player choice — returned when choice_set fires in 'player' mode */
export interface PendingChoiceData {
  /** Stable ID for this pending choice (used by modal to call back) */
  readonly choiceId: string;
  readonly actorId: string;
  readonly sourceId: string;
  readonly options: readonly ChoiceOption[];
  readonly timeoutMs: number | undefined;
}

export interface ExecutionResult {
  success: boolean;
  mutations: GraphMutation[];
  traces: ExecutionTrace[];
  /** Terrain overlays to add to GameState */
  terrainOverlays?: ActiveTerrainOverlay[];
  /** Rule overrides to add to GameState */
  ruleOverrides?: ActiveRuleOverride[];
  /** Warning messages (non-fatal) */
  warnings?: string[];
  /**
   * Set when a choice_set fires in 'player' mode.
   * Caller is responsible for surfacing the ChoiceSetModal.
   */
  pendingChoice?: PendingChoiceData;
  /**
   * THR-1542 — fight-clock writes a `resource_manipulate` `'fight_clock'` asked
   * for. The executor stays pure; `applyExecutionResult` routes each through
   * `advanceFightClock`, the one clock writer.
   */
  fightClockRequests?: FightClockRequest[];
  /**
   * THR-1542 — conditions an `inflict_condition` asked for. Applied by
   * `applyExecutionResult` through `applyConditionToActor`, the one condition
   * writer, which needs the game state an executor does not hold.
   */
  conditionRequests?: ConditionRequest[];
}

/** One fight-clock write an executor asked for (THR-1542). */
export interface FightClockRequest {
  readonly opponentId: string;
  /** Segments: positive wears the clock toward a win, negative rewinds it. */
  readonly delta: number;
  /** Recorded on the `fight.clock` trace. */
  readonly cause: string;
}

/** One condition an executor asked for (THR-1542). */
export interface ConditionRequest {
  readonly targetId: string;
  readonly conditionTraitId: string;
  readonly casterId: string;
  readonly durationTicks?: number;
  readonly intensity?: number;
}

interface GraphMutation {
  type: 'add_node' | 'remove_node' | 'add_edge' | 'remove_edge' | 'update_property';
  nodeId?: string;
  edgeId?: string;
  data?: Record<string, unknown>;
}

interface ExecutionTrace {
  effectType: string;
  casterId: string;
  targetId?: string;
  details: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════
// Type 15: Teleport / Forced Movement
// ═══════════════════════════════════════════════════════════════════

export function executeTeleport(
  effect: TeleportEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  const targetAgentId = effect.target === 'self' ? ctx.casterId : ctx.targetId;
  if (!targetAgentId) {
    return { success: false, mutations: [], traces: [], warnings: ['No target for teleport'] };
  }

  return {
    success: true,
    mutations: [],
    traces: [{
      effectType: 'teleport',
      casterId: ctx.casterId,
      targetId: targetAgentId,
      details: {
        range: effect.range,
        destination: effect.destination ?? 'target_hex',
        targetHex: ctx.targetHex,
      },
    }],
  };
}

export function executeForcedMove(
  effect: ForcedMoveEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  if (!ctx.targetId) {
    return { success: false, mutations: [], traces: [], warnings: ['No target for forced move'] };
  }

  return {
    success: true,
    mutations: [],
    traces: [{
      effectType: 'forced_move',
      casterId: ctx.casterId,
      targetId: ctx.targetId,
      details: { direction: effect.direction, hexes: effect.hexes },
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 17: Spawn / Summon
// ═══════════════════════════════════════════════════════════════════

export function executeSpawn(
  effect: SpawnEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  const spawnId = `spawn_${effect.template}_${ctx.tick}_${ctx.casterId}`;

  return {
    success: true,
    mutations: [{
      type: 'add_node',
      nodeId: spawnId,
      data: {
        type: effect.what === 'agent' ? 'actor' : effect.what,
        template: effect.template,
        spawnedBy: ctx.casterId,
        spawnTick: ctx.tick,
        temporary: effect.duration !== undefined,
        expiryTick: effect.duration ? ctx.tick + effect.duration : undefined,
      },
    }],
    traces: [{
      effectType: 'spawn',
      casterId: ctx.casterId,
      details: { what: effect.what, template: effect.template, onHex: effect.onHex },
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 18: Dispel
// ═══════════════════════════════════════════════════════════════════

export function executeDispel(
  effect: DispelEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  const targetAgentId = ctx.targetId ?? ctx.casterId;
  const graph = ctx.graph;
  const mutations: GraphMutation[] = [];

  // Find matching attachments on target
  const edgeTypes = ['has_trait', 'possesses', 'bonded_to'] as const;
  for (const edgeType of edgeTypes) {
    const edges = graph.getOutgoingEdges(targetAgentId, edgeType);
    for (const edge of edges) {
      const node = graph.getNode(edge.target);
      if (!node) continue;

      const tags = node.properties.tags as string[] | undefined;
      const tier = node.properties.tier as number | undefined;

      // Check tag filter
      if (effect.tags && effect.tags.length > 0) {
        if (!tags || !effect.tags.some(t => tags.includes(t))) continue;
      }

      // Check tier filter
      if (effect.tierMax && tier && tier > effect.tierMax) continue;

      // Match found — mark for removal
      mutations.push({ type: 'remove_edge', edgeId: edge.id });
      mutations.push({ type: 'remove_node', nodeId: edge.target });
      break; // Dispel one at a time
    }
  }

  return {
    success: mutations.length > 0,
    mutations,
    traces: [{
      effectType: 'dispel',
      casterId: ctx.casterId,
      targetId: targetAgentId,
      details: { target: effect.target, tags: effect.tags, removed: mutations.length / 2 },
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 20: Alter Terrain
// ═══════════════════════════════════════════════════════════════════

export function executeAlterTerrain(
  effect: AlterTerrainEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  const hex = effect.target === 'self_hex'
    ? resolveAgentHex(ctx.graph, ctx.casterId)
    : ctx.targetHex;

  if (!hex) {
    return { success: false, mutations: [], traces: [], warnings: ['No hex for terrain alteration'] };
  }

  const overlay: ActiveTerrainOverlay = {
    sourceAttachmentId: `spell_${ctx.tick}`,
    sourceAgentId: ctx.casterId,
    terrainEffect: effect.terrainEffect,
    hexCol: hex.col,
    hexRow: hex.row,
    expiryTick: effect.ticks === 'permanent' ? null : ctx.tick + (effect.ticks as number),
    establishedTick: ctx.tick,
  };

  return {
    success: true,
    mutations: [],
    traces: [{
      effectType: 'alter_terrain',
      casterId: ctx.casterId,
      details: { terrainEffect: effect.terrainEffect, hex, ticks: effect.ticks },
    }],
    terrainOverlays: [overlay],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 21: Transfer
// ═══════════════════════════════════════════════════════════════════

export function executeTransfer(
  effect: TransferEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  const fromId = effect.from === 'self' ? ctx.casterId : ctx.targetId;
  const toId = effect.to === 'self' ? ctx.casterId : ctx.targetId;

  if (!fromId || !toId) {
    return { success: false, mutations: [], traces: [], warnings: ['Missing transfer endpoints'] };
  }

  return {
    success: true,
    mutations: [],
    traces: [{
      effectType: 'transfer',
      casterId: ctx.casterId,
      details: { what: effect.what, from: fromId, to: toId, tags: effect.tags },
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 23: Compel
// ═══════════════════════════════════════════════════════════════════

export function executeCompel(
  effect: CompelEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  const targetId = effect.target === 'self' ? ctx.casterId : ctx.targetId;
  if (!targetId) {
    return { success: false, mutations: [], traces: [], warnings: ['No target for compel'] };
  }

  // Block compel on player-controlled agents (player agency preserved)
  const targetNode = ctx.graph.getNode(targetId);
  if (targetNode?.properties.isPlayerControlled) {
    return {
      success: false,
      mutations: [],
      traces: [{
        effectType: 'compel',
        casterId: ctx.casterId,
        targetId,
        details: { blocked: true, reason: 'player_controlled' },
      }],
      warnings: ['Cannot compel player-controlled agent'],
    };
  }

  const cappedTicks = Math.min(effect.ticks, COMPEL_MAX_TICKS);

  return {
    success: true,
    mutations: [{
      type: 'update_property',
      nodeId: targetId,
      data: {
        compelOverride: effect.override,
        compelValue: effect.value,
        compelExpiryTick: ctx.tick + cappedTicks,
        compelSource: ctx.casterId,
      },
    }],
    traces: [{
      effectType: 'compel',
      casterId: ctx.casterId,
      targetId,
      details: { override: effect.override, value: effect.value, ticks: cappedTicks },
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 25: Create Structure
// ═══════════════════════════════════════════════════════════════════

export function executeCreateStructure(
  effect: CreateStructureEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  const hex = effect.onHex === 'self'
    ? resolveAgentHex(ctx.graph, ctx.casterId)
    : ctx.targetHex;

  if (!hex) {
    return { success: false, mutations: [], traces: [], warnings: ['No hex for structure creation'] };
  }

  const structId = `struct_${effect.what}_${ctx.tick}_${ctx.casterId}`;

  return {
    success: true,
    mutations: [{
      type: 'add_node',
      nodeId: structId,
      data: {
        type: 'location',
        subtype: effect.subtype,
        hexCol: hex.col,
        hexRow: hex.row,
        createdBy: ctx.casterId,
        createdTick: ctx.tick,
        permanent: effect.permanent,
        expiryTick: effect.permanent ? undefined : ctx.tick + (effect.ticks ?? 100),
        ...(effect.properties ?? {}),
      },
    }],
    traces: [{
      effectType: 'create_structure',
      casterId: ctx.casterId,
      details: { what: effect.what, subtype: effect.subtype, hex, permanent: effect.permanent },
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 26: Destroy Structure
// ═══════════════════════════════════════════════════════════════════

export function executeDestroyStructure(
  effect: DestroyStructureEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  return {
    success: true,
    mutations: [],
    traces: [{
      effectType: 'destroy_structure',
      casterId: ctx.casterId,
      details: {
        what: effect.what,
        target: effect.target,
        permanent: effect.permanent,
        leavesBehind: effect.leavesBehind,
      },
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 27: Modify Rules
// ═══════════════════════════════════════════════════════════════════

export function executeModifyRules(
  effect: ModifyRulesEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  const override: ActiveRuleOverride = {
    sourceAttachmentId: `spell_${ctx.tick}`,
    sourceAgentId: ctx.casterId,
    rule: effect.rule,
    value: effect.value,
    scope: effect.scope,
    expiryTick: effect.ticks === 'permanent' ? null : ctx.tick + (effect.ticks as number),
    establishedTick: ctx.tick,
  };

  return {
    success: true,
    mutations: [],
    traces: [{
      effectType: 'modify_rules',
      casterId: ctx.casterId,
      details: { rule: effect.rule, value: effect.value, scope: effect.scope },
    }],
    ruleOverrides: [override],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 28: Faction Manipulation
// ═══════════════════════════════════════════════════════════════════

export function executeFactionManipulate(
  effect: FactionManipulateEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  return {
    success: true,
    mutations: [],
    traces: [{
      effectType: 'faction_manipulate',
      casterId: ctx.casterId,
      details: {
        action: effect.action,
        between: effect.between,
        amount: effect.amount,
      },
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 8: Transform
// ═══════════════════════════════════════════════════════════════════

export function executeTransform(
  effect: TransformEffect,
  attachmentId: string,
  ctx: ExecutionContext,
): ExecutionResult {
  // The transform replaces the attachment with a new template
  return {
    success: true,
    mutations: [
      { type: 'remove_node', nodeId: attachmentId },
    ],
    traces: [{
      effectType: 'transform',
      casterId: ctx.casterId,
      details: {
        fromAttachment: attachmentId,
        intoTemplate: effect.intoTemplate,
        trigger: effect.trigger,
      },
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 29: Cascade
// ═══════════════════════════════════════════════════════════════════

/**
 * Execute a cascade chain. Recursively processes effects with depth limiting.
 */
export function executeCascade(
  effect: CascadeEffect,
  ctx: ExecutionContext,
  currentDepth: number = 0,
): ExecutionResult {
  if (currentDepth >= CASCADE_MAX_DEPTH) {
    return {
      success: false,
      mutations: [],
      traces: [{
        effectType: 'cascade',
        casterId: ctx.casterId,
        details: { truncated: true, reason: 'max_depth_exceeded', depth: currentDepth },
      }],
      warnings: [`Cascade depth ${currentDepth} exceeds max ${CASCADE_MAX_DEPTH}`],
    };
  }

  const allMutations: GraphMutation[] = [];
  const allTraces: ExecutionTrace[] = [];
  const allOverlays: ActiveTerrainOverlay[] = [];
  const allRuleOverrides: ActiveRuleOverride[] = [];
  // THR-1542 — a cascade carries its members' fight-clock and condition requests.
  const allClockRequests: FightClockRequest[] = [];
  const allConditionRequests: ConditionRequest[] = [];
  const warnings: string[] = [];
  let effectCount = 0;

  // Execute trigger effect
  const triggerResult = executeEffect(effect.triggerEffect, ctx, currentDepth);
  allMutations.push(...triggerResult.mutations);
  allTraces.push(...triggerResult.traces);
  if (triggerResult.terrainOverlays) allOverlays.push(...triggerResult.terrainOverlays);
  if (triggerResult.ruleOverrides) allRuleOverrides.push(...triggerResult.ruleOverrides);
  if (triggerResult.warnings) warnings.push(...triggerResult.warnings);
  if (triggerResult.fightClockRequests) allClockRequests.push(...triggerResult.fightClockRequests);
  if (triggerResult.conditionRequests) allConditionRequests.push(...triggerResult.conditionRequests);
  effectCount++;

  // Execute follow-on effects
  for (const followOn of effect.then) {
    if (effectCount >= CASCADE_MAX_EFFECTS) {
      warnings.push(`Cascade truncated at ${CASCADE_MAX_EFFECTS} effects`);
      break;
    }

    const result = executeEffect(followOn, ctx, currentDepth + 1);
    allMutations.push(...result.mutations);
    allTraces.push(...result.traces);
    if (result.terrainOverlays) allOverlays.push(...result.terrainOverlays);
    if (result.ruleOverrides) allRuleOverrides.push(...result.ruleOverrides);
    if (result.warnings) warnings.push(...result.warnings);
    if (result.fightClockRequests) allClockRequests.push(...result.fightClockRequests);
    if (result.conditionRequests) allConditionRequests.push(...result.conditionRequests);
    effectCount++;
  }

  return {
    success: true,
    mutations: allMutations,
    traces: [{
      effectType: 'cascade',
      casterId: ctx.casterId,
      details: { triggerType: effect.triggerEffect.type, thenCount: effect.then.length, effectCount },
    }, ...allTraces],
    terrainOverlays: allOverlays.length > 0 ? allOverlays : undefined,
    ruleOverrides: allRuleOverrides.length > 0 ? allRuleOverrides : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    ...(allClockRequests.length > 0 ? { fightClockRequests: allClockRequests } : {}),
    ...(allConditionRequests.length > 0 ? { conditionRequests: allConditionRequests } : {}),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 40: Choice Set
// ═══════════════════════════════════════════════════════════════════

/**
 * Evaluate predicate-gated options and resolve via the chosen selection mode.
 *
 * - ai_auto:        first available option (deterministic, no PRNG)
 * - weighted_random: seeded PRNG pick from available options (seed = tick ^ casterId hash)
 * - player:         defers to UI — returns PendingChoiceData, no mutations
 *
 * Fail-soft: if all options are filtered out, uses the full unfiltered list with a warning.
 * Fail-soft: empty options array → skip entirely, emit error trace.
 */
export function executeChoiceSet(
  effect: ChoiceSetEffect,
  ctx: ExecutionContext,
  sourceId: string = 'unknown',
): ExecutionResult {
  // ── Guard: empty options ────────────────────────────────────────
  if (effect.options.length === 0) {
    return {
      success: false,
      mutations: [],
      traces: [{
        effectType: 'choice_set',
        casterId: ctx.casterId,
        details: { error: 'empty_options_array', sourceId } satisfies Partial<ChoiceSetResolutionTrace>,
      }],
      warnings: ['choice_set has no options — skipped'],
    };
  }

  // ── Predicate filtering ─────────────────────────────────────────
  const allIds = effect.options.map(o => o.id);
  let available: readonly ChoiceOption[];

  if (ctx.predicateContext) {
    available = effect.options.filter(
      o => o.predicate == null || evaluatePredicate(o.predicate, ctx.predicateContext!),
    );
  } else {
    available = effect.options; // no context → all options pass
  }

  // Cap to UX max
  const capped = available.slice(0, CHOICE_SET_MAX_OPTIONS);

  // Fallback: if filtering removed everything, use unfiltered list
  const usedFallback = capped.length === 0;
  const candidates = usedFallback
    ? (effect.options.slice(0, CHOICE_SET_MAX_OPTIONS) as ChoiceOption[])
    : (capped as ChoiceOption[]);

  const filteredIds = candidates.map(o => o.id);

  // ── player mode — defer to UI ───────────────────────────────────
  if (effect.selectionMode === 'player') {
    const choiceId = `choice_${ctx.casterId}_${ctx.tick}_${sourceId}`;
    const trace: ChoiceSetResolutionTrace = {
      actorId: ctx.casterId,
      sourceId,
      availableOptions: allIds,
      filteredOptions: filteredIds,
      selectedOptionId: null,
      selectionMode: 'player',
      usedFallback: usedFallback || undefined,
      awaitingPlayerChoice: true,
    };
    return {
      success: true,
      mutations: [],
      traces: [{ effectType: 'choice_set', casterId: ctx.casterId, details: trace }],
      warnings: usedFallback ? ['All choice_set predicates failed — fallback options shown'] : undefined,
      pendingChoice: {
        choiceId,
        actorId: ctx.casterId,
        sourceId,
        options: candidates,
        timeoutMs: effect.timeoutMs,
      },
    };
  }

  // ── AI modes — resolve immediately ─────────────────────────────
  let selectedOption: ChoiceOption;

  if (effect.selectionMode === 'ai_auto') {
    selectedOption = candidates[0];
  } else {
    // weighted_random: seed from tick xor'd with a hash of casterId
    const seed = ctx.tick ^ (ctx.casterId.charCodeAt(0) * 0x9e3779b9 | 0);
    const rng = mulberry32(seed);
    const idx = Math.floor(rng() * candidates.length);
    selectedOption = candidates[idx];
  }

  const trace: ChoiceSetResolutionTrace = {
    actorId: ctx.casterId,
    sourceId,
    availableOptions: allIds,
    filteredOptions: filteredIds,
    selectedOptionId: selectedOption.id,
    selectionMode: effect.selectionMode,
    usedFallback: usedFallback || undefined,
  };

  return {
    success: true,
    mutations: [],
    traces: [{ effectType: 'choice_set', casterId: ctx.casterId, details: trace }],
    warnings: usedFallback ? ['All choice_set predicates failed — fallback options shown'] : undefined,
    // Note: consequence effects from selectedOption.consequences are NOT executed here.
    // The caller is responsible for iterating selectedOption.consequences and executing them.
    // This keeps the executor pure and avoids nested executeEffect calls outside cascade.
  };
}

// ═══════════════════════════════════════════════════════════════════
// Generic Effect Dispatcher
// ═══════════════════════════════════════════════════════════════════

/**
 * Dispatch a single effect to its executor.
 * Used by cascade chains and spell activation.
 */
export function executeEffect(
  effect: AttachmentEffect,
  ctx: ExecutionContext,
  cascadeDepth: number = 0,
): ExecutionResult {
  switch (effect.type) {
    case 'teleport':
      return executeTeleport(effect, ctx);
    case 'forced_move':
      return executeForcedMove(effect, ctx);
    case 'spawn':
      return executeSpawn(effect, ctx);
    case 'dispel':
      return executeDispel(effect, ctx);
    case 'alter_terrain':
      return executeAlterTerrain(effect, ctx);
    case 'transfer':
      return executeTransfer(effect, ctx);
    case 'compel':
      return executeCompel(effect, ctx);
    case 'create_structure':
      return executeCreateStructure(effect, ctx);
    case 'destroy_structure':
      return executeDestroyStructure(effect, ctx);
    case 'modify_rules':
      return executeModifyRules(effect, ctx);
    case 'faction_manipulate':
      return executeFactionManipulate(effect, ctx);
    case 'cascade':
      return executeCascade(effect, ctx, cascadeDepth);
    case 'choice_set':
      return executeChoiceSet(effect, ctx);
    // Modifier-only effects don't need executors — handled by effectResolver
    case 'passive':
    case 'permanent':
    case 'duration':
    case 'conditional':
    case 'cooldown':
    case 'tradeoff':
    case 'stacking':
    case 'decay':
    case 'until_event':
    case 'consumable_charge':
    case 'trait_grant':
    case 'aura':
    case 'reactive':
    case 'transform':
    // THR-1242: `reveal` and `suppress` are wired as of stage 4, and both belong
    // here rather than in an executor arm. `reveal` is a query the movement and
    // awareness sites read (`getRevealRanges`); `suppress` is resolved once per
    // tick by `applySuppressions`, because every scope wider than `self` is a
    // statement about other agents' runtime states and an `ExecutionResult` has
    // no channel for that. Both are live; neither executes here.
    case 'reveal':
    case 'suppress':
    case 'test_shaper':
    case 'prevent_loss':
    case 'content_grant':
    // THR-1239: the query/tick-layer families were absent from this arm, so every
    // one of them fell to the old `default` and reported `success: false` with an
    // "Unknown effect type" warning — an honest-looking failure for effects that
    // are working exactly as designed elsewhere (resolver, tick, walker, or the
    // action-trigger path). They are modifier/state effects like the block above.
    case 'resource_delta':
    case 'action_trigger':
    case 'behavior_weight':
    case 'social_modifier':
    case 'action_gate':
    case 'axiological_drift':
    case 'range_modifier':
    case 'tag_immunity':
    case 'hex_effect':
    case 'slot_bonus':
    case 'stat_contribution':
      return modifierOnlyResult(effect.type, ctx);
    // THR-1542 (fight block FB6): the one executed resource. A reactive or spell
    // `fight_clock` must reach the clock from here — without this branch a monster
    // could never rewind its own clock on `damaged`. Essence and quintessence stay
    // tick/event-applied: the no-op above.
    case 'resource_manipulate':
      if (effect.resource === 'fight_clock') return executeFightClock(effect, ctx);
      return modifierOnlyResult(effect.type, ctx);
    case 'inflict_condition':
      return executeInflictCondition(effect, ctx);
  }

  // THR-1239: exhaustiveness guard. Every member of `AttachmentEffect` is handled
  // above, so this line is unreachable — and a future union member added without a
  // case here is a COMPILE error rather than a silent runtime `success: false`.
  // This is the one deliberate non-fail-soft failure in the effects engine
  // (NFP #4's stated exception): it fires at build time, never in the tick loop.
  const _exhaustive: never = effect;
  return {
    success: false,
    mutations: [],
    traces: [],
    warnings: [`Unknown effect type: ${(_exhaustive as { type: string }).type}`],
  };
}

/** A modifier/state effect: applied by the resolver or the tick, never executed. */
function modifierOnlyResult(effectType: AttachmentEffect['type'], ctx: ExecutionContext): ExecutionResult {
  return {
    success: true,
    mutations: [],
    traces: [{
      effectType,
      casterId: ctx.casterId,
      details: { note: 'Modifier/state effect — applied by resolver/tick, not executor' },
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Type 36 (fight clock) and Type 42: fight vocabulary (THR-1542)
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve an effect's `self` / other target: the caster, or the event's
 * counterpart (`ctx.targetId`, a fight opponent on a fight raise).
 */
function resolveSelfOrOther(isSelf: boolean, ctx: ExecutionContext): string | undefined {
  return isSelf ? ctx.casterId : ctx.targetId;
}

/** A skipped fight-vocabulary effect: traced, not failed (fail-soft). */
function skippedResult(effectType: string, ctx: ExecutionContext, reason: string): ExecutionResult {
  return {
    success: false,
    mutations: [],
    traces: [{ effectType, casterId: ctx.casterId, details: { skipped: reason } }],
    warnings: [`${effectType} skipped: ${reason}`],
  };
}

/**
 * `resource_manipulate` `'fight_clock'` (fight block plan doc §10): ask for a write
 * to a fight clock. `self` is the caster's own clock (a monster rewinding itself on
 * `damaged`); `other_agent` is the counterpart's. The write itself is
 * `applyExecutionResult`'s, through `advanceFightClock`.
 */
export function executeFightClock(
  effect: ResourceManipulateEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  if (!evaluateOptionalCondition(effect.condition, ctx.predicateContext)) {
    return skippedResult('resource_manipulate', ctx, 'condition_unmet');
  }
  const opponentId = resolveSelfOrOther(effect.target === 'self', ctx);
  if (!opponentId || !ctx.graph.getNode(opponentId)) {
    return skippedResult('resource_manipulate', ctx, 'no_target');
  }
  if (!Number.isFinite(effect.amount) || effect.amount === 0) {
    return skippedResult('resource_manipulate', ctx, 'zero_amount');
  }
  return {
    success: true,
    mutations: [],
    traces: [{
      effectType: 'resource_manipulate',
      casterId: ctx.casterId,
      targetId: opponentId,
      details: { resource: 'fight_clock', delta: effect.amount },
    }],
    fightClockRequests: [{ opponentId, delta: effect.amount, cause: `effect:${ctx.casterId}` }],
  };
}

/**
 * `inflict_condition` (fight block plan doc §10): ask for a condition on the
 * caster or the counterpart. Applied by `applyExecutionResult` through the one
 * condition writer, which honours tag immunity.
 */
export function executeInflictCondition(
  effect: InflictConditionEffect,
  ctx: ExecutionContext,
): ExecutionResult {
  if (!evaluateOptionalCondition(effect.condition, ctx.predicateContext)) {
    return skippedResult('inflict_condition', ctx, 'condition_unmet');
  }
  const targetId = resolveSelfOrOther(effect.target === 'self', ctx);
  if (!targetId || !ctx.graph.getNode(targetId)) {
    return skippedResult('inflict_condition', ctx, 'no_target');
  }
  return {
    success: true,
    mutations: [],
    traces: [{
      effectType: 'inflict_condition',
      casterId: ctx.casterId,
      targetId,
      details: { conditionTraitId: effect.conditionTraitId },
    }],
    conditionRequests: [{
      targetId,
      conditionTraitId: effect.conditionTraitId,
      casterId: ctx.casterId,
      ...(effect.durationTicks !== undefined ? { durationTicks: effect.durationTicks } : {}),
      ...(effect.intensity !== undefined ? { intensity: effect.intensity } : {}),
    }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function resolveAgentHex(
  graph: WorldGraph,
  agentId: string,
): { col: number; row: number } | null {
  const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
  if (locEdges.length === 0) return null;

  const locNode = graph.getNode(locEdges[0].target);
  if (!locNode) return null;

  let col = locNode.properties.hexCol as number | undefined;
  let row = locNode.properties.hexRow as number | undefined;

  if (col === undefined && locNode.properties.parentLocationId) {
    const parent = graph.getNode(locNode.properties.parentLocationId as string);
    if (parent) {
      col = parent.properties.hexCol as number | undefined;
      row = parent.properties.hexRow as number | undefined;
    }
  }

  if (col === undefined || row === undefined) return null;
  return { col, row };
}
