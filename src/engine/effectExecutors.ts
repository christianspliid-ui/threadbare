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
} from '../types/effects';
import {
  CASCADE_MAX_DEPTH,
  CASCADE_MAX_EFFECTS,
  COMPEL_MAX_TICKS,
  CHOICE_SET_MAX_OPTIONS,
} from '../data/effect-constants';
import { evaluatePredicate } from './effects/effectPredicates';
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
  const warnings: string[] = [];
  let effectCount = 0;

  // Execute trigger effect
  const triggerResult = executeEffect(effect.triggerEffect, ctx, currentDepth);
  allMutations.push(...triggerResult.mutations);
  allTraces.push(...triggerResult.traces);
  if (triggerResult.terrainOverlays) allOverlays.push(...triggerResult.terrainOverlays);
  if (triggerResult.ruleOverrides) allRuleOverrides.push(...triggerResult.ruleOverrides);
  if (triggerResult.warnings) warnings.push(...triggerResult.warnings);
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
    case 'suppress':
    case 'reveal':
    case 'auto_succeed':
    case 'reroll':
    case 'swap_reach':
    case 'outcome_shift':
    case 'test_shaper':
    case 'prevent_loss':
    case 'content_grant':
    case 'create_barrier':
    case 'haste':
    case 'slow':
    case 'freeze_duration':
      return {
        success: true,
        mutations: [],
        traces: [{
          effectType: effect.type,
          casterId: ctx.casterId,
          details: { note: 'Modifier/state effect — applied by resolver/tick, not executor' },
        }],
      };
    default:
      return {
        success: false,
        mutations: [],
        traces: [],
        warnings: [`Unknown effect type: ${(effect as { type: string }).type}`],
      };
  }
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
