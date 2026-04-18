import type { GameState, TickEvent } from '../types/gameState';
import { MAX_RECENT_EVENTS } from '../types/gameState';
import { DEFAULT_REPUTATION } from '../types/disposition';
import type {
  AftermathTarget,
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  HiddenMark,
  IntelligenceRecord,
  PendingEncounterSeed,
  UnifiedAction,
} from '../types/unifiedAction';
import { emitTrace } from './traceBuffer';
import type { SimulationRuntime } from './simulationRuntime';
import { touchWorld, touchStructure } from './simulationRuntime';
import { buildPredicateContext, evaluateOptionalCondition } from './effects/effectPredicates';
import {
  THREAD_STRENGTHEN_DEFAULT,
  THREAD_WEAKEN_DEFAULT,
  THREAD_BRANCH_INITIAL_STRENGTH,
  THREAD_STRENGTH_MAX,
  THREAD_STRENGTH_MIN,
} from '../data/effect-constants';
import { CONDITION_DURATIONS } from '../data/condition-trait-content';
import { CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT } from '../data/attachment-slot-constants';
import {
  SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_COMMON,
  SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_SHAPING,
  SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_LEGENDARY,
  EMITTED_OMEN_DEFAULT_DURATION_TICKS,
  EMITTED_OMEN_MAX_ACTIVE,
  EMITTED_OMEN_LOCAL_DEFAULT_RADIUS,
  FACTION_SPLINTER_DEFAULT_REPUTATION_SHARE,
  FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT,
  FACTION_PEACE_DEFAULT_SENTIMENT_BOOST,
  FACTION_PEACE_SENTIMENT_FLOOR,
  FACTION_WAR_SENTIMENT_FLOOR,
  FACTION_DRIFT_TO_RIVAL_INITIAL_REPUTATION,
  FACTION_MUTATION_CHRONICLE_SIGNIFICANCE,
} from '../data/game-config';
import type { EmittedOmen } from '../types/omen';
import type { ArtifactTier, FactionMemberSelection } from '../types/unifiedAction';
import { mulberry32 } from '../lib/prng';
import { generateSecret, createSecretEdge, createFavorEdge } from './secretGeneration';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Initial reputationScore on a faction node when first read (matches DEFAULT_REPUTATION for agents). */
export const DEFAULT_FACTION_REPUTATION = 0.5;

/** Default intensity on apply_condition when the effect omits it. */
export const CONDITION_DEFAULT_INTENSITY = 0.5;

/** Default durationTicks on apply_condition when omitted. 0 = indefinite (no auto-expiry). */
export const CONDITION_DEFAULT_DURATION_TICKS = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function appendRecentEvent(
  existing: readonly TickEvent[],
  event: TickEvent,
): TickEvent[] {
  return [...existing, event].slice(-MAX_RECENT_EVENTS);
}

/**
 * Resolve which target entity an aftermath effect should apply to.
 *
 * Priority: targetAgentId > targetFactionId > targetSublocationId > legacy actorId > action actor.
 * Returns { kind: 'actor_fallback' } when no explicit target is supplied.
 */
export function resolveAftermathTarget(
  effect: EncounterAftermathReactionEffect,
  action: UnifiedAction | undefined,
): AftermathTarget {
  const e = effect as Partial<{
    targetAgentId: string;
    targetFactionId: string;
    targetSublocationId: string;
    actorId: string; // legacy field on reputation_score / reputation_tally
  }>;
  if (e.targetAgentId) return { kind: 'agent', id: e.targetAgentId };
  if (e.targetFactionId) return { kind: 'faction', id: e.targetFactionId };
  if (e.targetSublocationId) return { kind: 'sublocation', id: e.targetSublocationId };
  if (e.actorId) return { kind: 'agent', id: e.actorId }; // legacy fallback
  if (action?.actorId) return { kind: 'agent', id: action.actorId };
  return { kind: 'actor_fallback' };
}

// ─── World-shaping helpers ────────────────────────────────────────────────────

interface FactionMemberCandidate {
  id: string;
  reputation: number;
}

function selectFactionMembers(
  allMembers: FactionMemberCandidate[],
  selection: FactionMemberSelection,
  state: import('../types/gameState').GameState,
  tick: number,
  encounterId: string,
  reactionId: string,
  effectIndex: number,
): FactionMemberCandidate[] {
  switch (selection.kind) {
    case 'explicit_ids':
      return allMembers.filter(m => selection.agentIds.includes(m.id));
    case 'by_reputation_above':
      return allMembers.filter(m => m.reputation > selection.threshold);
    case 'by_reputation_below':
      return allMembers.filter(m => m.reputation < selection.threshold);
    case 'within_radius': {
      const result: FactionMemberCandidate[] = [];
      for (const member of allMembers) {
        const node = state.graph.getNode(member.id);
        if (!node) continue;
        const hexCol = node.properties?.hexCol as number | undefined;
        const hexRow = node.properties?.hexRow as number | undefined;
        if (hexCol === undefined || hexRow === undefined) continue;
        const dist = Math.max(
          Math.abs(hexCol - selection.hexCol),
          Math.abs(hexRow - selection.hexRow),
          Math.abs((hexCol - hexRow) - (selection.hexCol - selection.hexRow)),
        );
        if (dist <= selection.radius) result.push(member);
      }
      return result;
    }
    case 'all_matching_trait':
      return allMembers.filter(m => {
        const traitEdges = state.graph.getOutgoingEdges(m.id, 'has_trait');
        return traitEdges.some(e => e.target === selection.traitId);
      });
    case 'random_sample': {
      const salt = `${encounterId}_${reactionId}_${effectIndex}`;
      let seed = state.seed;
      for (let c = 0; c < salt.length; c++) seed = (seed ^ salt.charCodeAt(c)) >>> 0;
      seed = (seed + tick * 31337) >>> 0;
      const rng = mulberry32(seed);
      return allMembers.filter(() => rng() < selection.fraction);
    }
    default:
      return allMembers;
  }
}

function mergeReputation(
  existing: number,
  absorbed: number,
  strategy: 'max' | 'sum_clamped' | 'weighted_avg',
): number {
  switch (strategy) {
    case 'max': return Math.max(existing, absorbed);
    case 'sum_clamped': return clamp01(existing + absorbed);
    case 'weighted_avg': return (existing + absorbed) / 2;
    default: return (existing + absorbed) / 2;
  }
}

// ─── Mutation summary ─────────────────────────────────────────────────────────

export interface AftermathMutationSummary {
  touchedWorld: boolean;
  touchedStructure: boolean;
  /** True when a condition_attachment effect applied a wound-subcategory condition to the actor. Drives mid-encounter tier promotion. */
  woundApplied: boolean;
}

// ─── Main function ────────────────────────────────────────────────────────────

export function applyEncounterAftermathReaction(
  state: GameState,
  action: UnifiedAction | undefined,
  reaction: EncounterAftermathReaction,
  tick: number,
  runtime: SimulationRuntime,
): { state: GameState; mutationSummary: AftermathMutationSummary } {
  if (!runtime) {
    throw new Error('[encounterAftermath] runtime is required — programming error, not a data error');
  }

  let nextRecentEvents = state.recentEvents;
  let nextTickEvents = state.tickEvents;
  let nextClearanceGateStates = state.clearanceGateStates
    ? new Map(state.clearanceGateStates)
    : undefined;
  let touchedClearanceGateStates = false;
  let nextSeeds: PendingEncounterSeed[] = [];
  let nextHiddenMarks: HiddenMark[] = [];
  let nextIntelligenceRecords: IntelligenceRecord[] = [];
  let nextEmittedOmens: EmittedOmen[] | undefined = undefined;

  let mutationSummary: AftermathMutationSummary = { touchedWorld: false, touchedStructure: false, woundApplied: false };

  const encounterId = action?.templateId ?? 'unknown';
  const actionId = action?.actionId ?? 'unknown';
  const actorAgentId = action?.actorId;

  // Top-level trace: one per reaction application — summary of which effect kinds will fire
  emitTrace({
    tick,
    category: 'encounter_aftermath_applied',
    agentId: actorAgentId,
    encounterId,
    actionId,
    actorId: actorAgentId ?? '',
    reactionId: reaction.id,
    effectKinds: reaction.effects.map(e => e.kind),
    summary: `Aftermath reaction ${reaction.id} (${encounterId}): ${reaction.effects.map(e => e.kind).join(', ')}`,
  });

  for (let i = 0; i < reaction.effects.length; i++) {
    const effect = reaction.effects[i];
    const target = resolveAftermathTarget(effect, action);

    // Check for ambiguous multi-target specification
    const e = effect as Partial<{ targetAgentId: string; targetFactionId: string; targetSublocationId: string }>;
    const targetFieldCount = [e.targetAgentId, e.targetFactionId, e.targetSublocationId].filter(Boolean).length;
    if (targetFieldCount > 1) {
      emitTrace({
        tick, category: 'aftermath_target_invalid',
        agentId: actorAgentId, encounterId, actionId: actionId, reactionId: reaction.id,
        effectIndex: i, effectKind: effect.kind,
        reason: 'multiple_targets_specified',
        summary: `aftermath[${i}] ${effect.kind}: multiple target fields set — using priority (agent>faction>sublocation)`,
      });
    }

    // Per-effect target resolution trace
    const effectiveTargetId = target.kind !== 'actor_fallback' ? target.id : (actorAgentId ?? '');
    const effectiveTargetKind = target.kind;
    emitTrace({
      tick, category: 'aftermath_target_resolved',
      agentId: actorAgentId, encounterId, actionId, reactionId: reaction.id,
      effectIndex: i, effectKind: effect.kind,
      effectiveTargetId,
      effectiveTargetKind,
      summary: `aftermath[${i}] ${effect.kind}: resolved target → ${effectiveTargetKind}:${effectiveTargetId}`,
    });

    // THR-116: evaluate optional `when` predicate before dispatching to handler
    // Every member of EncounterAftermathReactionEffect now includes when?, so direct access is safe.
    const whenPredicate = effect.when;
    if (whenPredicate !== undefined) {
      const whenTargetId = effectiveTargetId || actorAgentId || '';
      let whenCtx: import('../types/effects').PredicateContext | undefined;
      if (whenTargetId) {
        whenCtx = buildPredicateContext(
          state.graph,
          whenTargetId,
          undefined,
          action?.templateId,
          state.hiddenMarks,
          state.intelligenceRecords,
        );
      }
      const passed = evaluateOptionalCondition(whenPredicate, whenCtx);
      if (!passed) {
        emitTrace({
          tick, category: 'aftermath_effect_skipped_by_when',
          agentId: actorAgentId, encounterId, actionId, reactionId: reaction.id,
          effectIndex: i, effectKind: effect.kind,
          predicate: whenPredicate, targetEntityId: whenTargetId,
          summary: `aftermath[${i}] ${effect.kind}: skipped — when predicate '${whenPredicate}' false for ${whenTargetId}`,
        });
        continue;
      }
      // Verbose-tier only (gated to avoid trace flood): log successful pass
      emitTrace({
        tick, category: 'aftermath_effect_when_passed',
        agentId: actorAgentId, encounterId, actionId, reactionId: reaction.id,
        effectIndex: i, effectKind: effect.kind,
        predicate: whenPredicate, targetEntityId: whenTargetId,
        summary: `aftermath[${i}] ${effect.kind}: when predicate '${whenPredicate}' passed`,
      });
    }

    switch (effect.kind) {
      case 'reputation_score': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_score', effectDetail: { delta: effect.delta },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `reputation_score[${i}] skipped: no actorId`,
          });
          break;
        }
        const node = state.graph.getNode(resolvedId);
        if (!node) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_score', attemptedTargetId: resolvedId,
            attemptedTargetKind: target.kind !== 'actor_fallback' ? target.kind : 'agent',
            reason: 'target_node_missing',
            summary: `reputation_score[${i}] skipped: target node not found (${resolvedId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_score', effectDetail: { targetId: resolvedId, delta: effect.delta },
            success: false, failReason: 'target_node_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
            summary: `reputation_score[${i}] skipped: target node not found (${resolvedId})`,
          });
          break;
        }
        const isFaction = target.kind === 'faction';
        const current = (node.properties?.reputationScore as number | undefined)
          ?? (isFaction ? DEFAULT_FACTION_REPUTATION : DEFAULT_REPUTATION);
        const result = clamp01(current + effect.delta);
        node.properties.reputationScore = result;
        mutationSummary.touchedWorld = true;
        if (isFaction) {
          emitTrace({
            tick, category: 'faction_reputation_changed', agentId: actorAgentId,
            factionId: resolvedId, previous: current, result, delta: effect.delta,
            kind: 'reputation_score', encounterId, reactionId: reaction.id,
            summary: `faction_reputation_changed: ${resolvedId} ${effect.delta >= 0 ? '+' : ''}${effect.delta.toFixed(2)} → ${result.toFixed(2)}`,
          });
        }
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'reputation_score',
          effectDetail: { targetId: resolvedId, delta: effect.delta, previous: current, result },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
          summary: `reputation_score[${i}]: ${resolvedId} ${effect.delta >= 0 ? '+' : ''}${effect.delta.toFixed(2)}`,
        });
        break;
      }

      case 'reputation_tally': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_tally', effectDetail: { key: effect.key, delta: effect.delta },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `reputation_tally[${i}] skipped: no actorId`,
          });
          break;
        }
        const node = state.graph.getNode(resolvedId);
        if (!node) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_tally', attemptedTargetId: resolvedId,
            attemptedTargetKind: target.kind !== 'actor_fallback' ? target.kind : 'agent',
            reason: 'target_node_missing',
            summary: `reputation_tally[${i}] skipped: target node not found (${resolvedId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_tally', effectDetail: { targetId: resolvedId, key: effect.key, delta: effect.delta },
            success: false, failReason: 'target_node_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
            summary: `reputation_tally[${i}] skipped: target node not found (${resolvedId})`,
          });
          break;
        }
        const tallies = {
          ...((node.properties?.reputationTallies as Record<string, number> | undefined) ?? {}),
        };
        tallies[effect.key] = (tallies[effect.key] ?? 0) + effect.delta;
        node.properties.reputationTallies = tallies;
        mutationSummary.touchedWorld = true;
        if (target.kind === 'faction') {
          emitTrace({
            tick, category: 'faction_reputation_changed', agentId: actorAgentId,
            factionId: resolvedId, previous: tallies[effect.key] - effect.delta, result: tallies[effect.key],
            delta: effect.delta, kind: 'reputation_tally', encounterId, reactionId: reaction.id,
            summary: `faction_reputation_tally: ${resolvedId} [${effect.key}] ${effect.delta >= 0 ? '+' : ''}${effect.delta}`,
          });
        }
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'reputation_tally',
          effectDetail: { targetId: resolvedId, key: effect.key, delta: effect.delta, newTally: tallies[effect.key] },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
          summary: `reputation_tally[${i}]: ${resolvedId} [${effect.key}] ${effect.delta >= 0 ? '+' : ''}${effect.delta}`,
        });
        break;
      }

      case 'reputation_set': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', reason: 'no_actor_id',
            summary: `reputation_set[${i}] skipped: no actor id`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', effectDetail: { value: effect.value },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `reputation_set[${i}] skipped: no actorId`,
          });
          break;
        }
        if (target.kind === 'sublocation') {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', attemptedTargetKind: 'sublocation', attemptedTargetId: resolvedId,
            reason: 'target_kind_not_supported',
            summary: `reputation_set[${i}] skipped: sublocation target not supported`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', effectDetail: { targetId: resolvedId, value: effect.value },
            success: false, failReason: 'target_kind_not_supported',
            effectiveTargetId: resolvedId, effectiveTargetKind: 'sublocation',
            summary: `reputation_set[${i}] skipped: sublocation not supported`,
          });
          break;
        }
        const node = state.graph.getNode(resolvedId);
        if (!node) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', attemptedTargetId: resolvedId,
            attemptedTargetKind: target.kind !== 'actor_fallback' ? target.kind : 'agent',
            reason: 'target_node_missing',
            summary: `reputation_set[${i}] skipped: node not found (${resolvedId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_set', effectDetail: { targetId: resolvedId, value: effect.value },
            success: false, failReason: 'target_node_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
            summary: `reputation_set[${i}] skipped: node not found (${resolvedId})`,
          });
          break;
        }
        const isFaction = target.kind === 'faction';
        const previous = (node.properties?.reputationScore as number | undefined)
          ?? (isFaction ? DEFAULT_FACTION_REPUTATION : DEFAULT_REPUTATION);
        const clamped = clamp01(effect.value);
        node.properties.reputationScore = clamped;
        mutationSummary.touchedWorld = true;
        const targetKindForTrace = isFaction ? 'faction' as const : 'agent' as const;
        emitTrace({
          tick, category: 'reputation_set_applied', agentId: actorAgentId,
          targetId: resolvedId, targetKind: targetKindForTrace,
          value: clamped, previous, encounterId, reactionId: reaction.id,
          summary: `reputation_set[${i}]: ${resolvedId} set to ${clamped.toFixed(2)} (was ${previous.toFixed(2)})`,
        });
        if (isFaction) {
          emitTrace({
            tick, category: 'faction_reputation_changed', agentId: actorAgentId,
            factionId: resolvedId, previous, result: clamped, delta: clamped - previous,
            kind: 'reputation_set', encounterId, reactionId: reaction.id,
            summary: `faction_reputation_set: ${resolvedId} → ${clamped.toFixed(2)}`,
          });
        }
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'reputation_set',
          effectDetail: { targetId: resolvedId, value: clamped, previous },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
          summary: `reputation_set[${i}]: ${resolvedId} → ${clamped.toFixed(2)}`,
        });
        break;
      }

      case 'clearance_gate_tag': {
        const runtimeId = effect.runtimeId ?? action?.clearanceGateIds?.[0];
        if (!runtimeId || !nextClearanceGateStates) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'clearance_gate_tag', effectDetail: { runtimeId, tag: effect.tag },
            success: false, failReason: !runtimeId ? 'no_runtime_id' : 'no_clearance_gate_states',
            summary: `clearance_gate_tag[${i}] skipped: ${!runtimeId ? 'no runtimeId' : 'no clearanceGateStates'}`,
          });
          break;
        }
        const gate = nextClearanceGateStates.get(runtimeId);
        if (!gate) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'clearance_gate_tag', effectDetail: { runtimeId, tag: effect.tag },
            success: false, failReason: 'gate_not_found',
            summary: `clearance_gate_tag[${i}] skipped: gate ${runtimeId} not found`,
          });
          break;
        }
        nextClearanceGateStates.set(runtimeId, {
          ...gate,
          followOnTags: [...new Set([...gate.followOnTags, effect.tag])],
        });
        touchedClearanceGateStates = true;
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'clearance_gate_tag',
          effectDetail: { runtimeId, tag: effect.tag },
          success: true,
          summary: `clearance_gate_tag[${i}]: gate ${runtimeId} tagged '${effect.tag}'`,
        });
        break;
      }

      case 'recent_event': {
        const event: TickEvent = {
          id: `enc_after_${reaction.id}_${tick}_${nextRecentEvents.length}`,
          tick,
          type: effect.eventType ?? 'ripple_consequence',
          message: effect.message,
          significance: effect.significance ?? 0.55,
          actorId: actorAgentId,
          witnessAgentIds: effect.witnessAgentIds ? [...effect.witnessAgentIds] : undefined,
        };
        nextRecentEvents = appendRecentEvent(nextRecentEvents, event);
        nextTickEvents = [...nextTickEvents, event];
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'recent_event',
          effectDetail: {
            eventId: event.id,
            message: effect.message,
            significance: event.significance,
            witnessCount: effect.witnessAgentIds?.length ?? 0,
          },
          success: true,
          summary: `recent_event[${i}]: "${effect.message.slice(0, 60)}"${effect.witnessAgentIds?.length ? ` (${effect.witnessAgentIds.length} witnesses)` : ''}`,
        });
        break;
      }

      case 'encounter_seed': {
        const seed: PendingEncounterSeed = {
          seedId: `seed_${actionId}_${reaction.id}_${i}`,
          sourceEncounterId: encounterId,
          sourceReactionId: reaction.id,
          encounterFamily: effect.encounterFamily,
          templateId: effect.templateId,
          targetAgentId: effect.targetAgentId ?? actorAgentId ?? '',
          eligibleAfterTick: tick + effect.delayTicks,
          priority: effect.priority ?? 1.0,
          seedLabel: effect.seedLabel,
          plantedTick: tick,
          sourceEventNodeId: action?.eventNodeId,
        };
        nextSeeds = [...nextSeeds, seed];
        const seedEvent: TickEvent = {
          id: `${seed.seedId}_planted`,
          tick,
          type: 'narrative',
          message: `A thread has been planted: ${effect.seedLabel}`,
          significance: 0.5,
          actorId: seed.targetAgentId,
        };
        nextTickEvents = [...nextTickEvents, seedEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, seedEvent);
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'encounter_seed',
          effectDetail: { seedId: seed.seedId, targetAgentId: seed.targetAgentId, seedLabel: effect.seedLabel, eligibleAfterTick: seed.eligibleAfterTick },
          success: true,
          summary: `encounter_seed[${i}]: "${effect.seedLabel}" → ${seed.targetAgentId} eligible at tick ${seed.eligibleAfterTick}`,
        });
        emitTrace({
          tick, category: 'encounter_seed_planted',
          agentId: seed.targetAgentId,
          seedId: seed.seedId,
          targetAgentId: seed.targetAgentId,
          sourceEncounterId: encounterId,
          sourceReactionId: reaction.id,
          templateId: seed.templateId,
          encounterFamily: seed.encounterFamily,
          delayTicks: effect.delayTicks,
          eligibleAfterTick: seed.eligibleAfterTick,
          seedLabel: seed.seedLabel,
          priority: seed.priority,
          summary: `Seed planted: "${seed.seedLabel}" for ${seed.targetAgentId} (eligible tick ${seed.eligibleAfterTick})`,
        });
        break;
      }

      case 'hidden_mark': {
        // hidden_mark supports targetAgentId; faction/sublocation rejected in v1
        if (target.kind === 'faction' || target.kind === 'sublocation') {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'hidden_mark', attemptedTargetKind: target.kind, attemptedTargetId: target.id,
            reason: 'target_kind_not_supported',
            summary: `hidden_mark[${i}] skipped: ${target.kind} target not supported in v1`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'hidden_mark', effectDetail: { attemptedTargetKind: target.kind },
            success: false, failReason: 'target_kind_not_supported',
            effectiveTargetId: target.id, effectiveTargetKind: target.kind,
            summary: `hidden_mark[${i}] skipped: ${target.kind} target not supported`,
          });
          break;
        }
        const targetAgentId = target.kind === 'agent' ? target.id : (actorAgentId ?? '');
        const mark: HiddenMark = {
          markId: `mark_${actionId}_${reaction.id}_${i}`,
          category: effect.category,
          severity: effect.severity,
          label: effect.label,
          sourceEncounterId: encounterId,
          placedTick: tick,
          targetAgentId,
          revealFamilies: effect.revealFamilies,
        };
        nextHiddenMarks = [...nextHiddenMarks, mark];
        const markEvent: TickEvent = {
          id: `${mark.markId}_placed`,
          tick,
          type: 'narrative',
          message: 'A consequence has taken root, unseen.',
          significance: 0.3,
          actorId: targetAgentId,
        };
        nextTickEvents = [...nextTickEvents, markEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, markEvent);
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'hidden_mark',
          effectDetail: { markId: mark.markId, targetAgentId, category: effect.category, severity: effect.severity, label: effect.label },
          success: true,
          effectiveTargetId: targetAgentId,
          effectiveTargetKind: target.kind === 'agent' ? 'agent' : 'actor_fallback',
          summary: `hidden_mark[${i}]: "${effect.label}" on ${targetAgentId} (${effect.category} sev=${effect.severity})`,
        });
        emitTrace({
          tick, category: 'hidden_mark_placed',
          agentId: targetAgentId,
          markId: mark.markId,
          actorId: targetAgentId,
          sourceEncounterId: encounterId,
          sourceTemplateId: encounterId,
          markCategory: effect.category,
          severity: effect.severity,
          revealFamilies: effect.revealFamilies ?? [],
          label: effect.label,
          summary: `Hidden mark placed: "${effect.label}" on ${targetAgentId} (reveals on: ${(effect.revealFamilies ?? []).join(', ') || 'none'})`,
        });
        break;
      }

      case 'intelligence': {
        // intelligence supports targetAgentId; faction target rejected in v1
        if (target.kind === 'faction') {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'intelligence', attemptedTargetKind: 'faction', attemptedTargetId: target.id,
            reason: 'target_kind_not_supported',
            summary: `intelligence[${i}] skipped: faction target not supported in v1`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'intelligence', effectDetail: { attemptedTargetKind: 'faction' },
            success: false, failReason: 'target_kind_not_supported',
            effectiveTargetId: target.id, effectiveTargetKind: 'faction',
            summary: `intelligence[${i}] skipped: faction target not supported`,
          });
          break;
        }
        const agentId = target.kind === 'agent' ? target.id : (actorAgentId ?? '');
        const record: IntelligenceRecord = {
          recordId: `intel_${actionId}_${reaction.id}_${i}`,
          category: effect.category,
          label: effect.label,
          detail: effect.detail,
          targetRegion: effect.targetRegion,
          targetEntityId: effect.targetEntityId,
          sourceEncounterId: encounterId,
          agentId,
          acquiredTick: tick,
          reliability: effect.reliability ?? 0.8,
        };
        nextIntelligenceRecords = [...nextIntelligenceRecords, record];
        const intelEvent: TickEvent = {
          id: `${record.recordId}_acquired`,
          tick,
          type: 'narrative',
          message: `Intelligence acquired: ${effect.label}`,
          significance: 0.6,
          actorId: agentId,
        };
        nextTickEvents = [...nextTickEvents, intelEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, intelEvent);
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'intelligence',
          effectDetail: { recordId: record.recordId, agentId, category: effect.category, label: effect.label, reliability: record.reliability },
          success: true,
          effectiveTargetId: agentId,
          effectiveTargetKind: target.kind === 'agent' ? 'agent' : 'actor_fallback',
          summary: `intelligence[${i}]: "${effect.label}" → ${agentId}`,
        });
        emitTrace({
          tick, category: 'intelligence_granted',
          agentId,
          recordId: record.recordId,
          sourceEncounterId: encounterId,
          intelCategory: effect.category,
          label: effect.label,
          reliability: record.reliability,
          targetRegion: effect.targetRegion,
          targetEntityId: effect.targetEntityId,
          summary: `Intelligence granted: "${effect.label}" to ${agentId} (reliability ${record.reliability.toFixed(2)})`,
        });
        break;
      }

      case 'apply_condition': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', reason: 'no_actor_id',
            summary: `apply_condition[${i}] skipped: no actor id`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', effectDetail: { conditionTraitId: effect.conditionTraitId },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `apply_condition[${i}] skipped: no actorId`,
          });
          break;
        }
        const targetNode = state.graph.getNode(resolvedId);
        if (!targetNode) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', attemptedTargetId: resolvedId,
            attemptedTargetKind: target.kind !== 'actor_fallback' ? target.kind : 'agent',
            reason: 'target_node_missing',
            summary: `apply_condition[${i}] skipped: target node not found (${resolvedId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', effectDetail: { targetId: resolvedId, conditionTraitId: effect.conditionTraitId },
            success: false, failReason: 'target_node_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
            summary: `apply_condition[${i}] skipped: target node not found (${resolvedId})`,
          });
          break;
        }
        const conditionNode = state.graph.getNode(effect.conditionTraitId);
        if (!conditionNode) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', reason: 'condition_template_missing',
            summary: `apply_condition[${i}] skipped: condition trait not found (${effect.conditionTraitId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'apply_condition', effectDetail: { targetId: resolvedId, conditionTraitId: effect.conditionTraitId },
            success: false, failReason: 'condition_template_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
            summary: `apply_condition[${i}] skipped: condition node not found (${effect.conditionTraitId})`,
          });
          break;
        }
        const intensity = effect.intensity ?? CONDITION_DEFAULT_INTENSITY;
        const durationTicks = effect.durationTicks ?? CONDITION_DEFAULT_DURATION_TICKS;
        const edgeId = `has_trait_${resolvedId}_${effect.conditionTraitId}_${tick}_${i}`;
        state.graph.addEdge({
          id: edgeId,
          source: resolvedId,
          target: effect.conditionTraitId,
          type: 'has_trait',
          properties: {
            appliedAt: tick,
            durationTicks,
            intensity,
            sourceEncounterId: encounterId,
            sourceReactionId: reaction.id,
          },
        });
        mutationSummary.touchedStructure = true;
        const condKind = (target.kind === 'agent' || target.kind === 'faction' || target.kind === 'sublocation')
          ? target.kind
          : 'agent' as const;
        emitTrace({
          tick, category: 'condition_applied', agentId: actorAgentId,
          targetId: resolvedId, targetKind: condKind,
          conditionTraitId: effect.conditionTraitId, durationTicks, intensity,
          encounterId, reactionId: reaction.id,
          summary: `condition_applied[${i}]: ${effect.conditionTraitId} → ${resolvedId} (intensity=${intensity}, duration=${durationTicks || 'indefinite'})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'apply_condition',
          effectDetail: { targetId: resolvedId, conditionTraitId: effect.conditionTraitId, intensity, durationTicks },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
          summary: `apply_condition[${i}]: ${effect.conditionTraitId} → ${resolvedId}`,
        });
        break;
      }

      case 'remove_condition': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'remove_condition', reason: 'no_actor_id',
            summary: `remove_condition[${i}] skipped: no actor id`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'remove_condition', effectDetail: { conditionTraitId: effect.conditionTraitId },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `remove_condition[${i}] skipped: no actorId`,
          });
          break;
        }
        const matchingEdges = state.graph.getOutgoingEdges(resolvedId, 'has_trait')
          .filter(edge => edge.target === effect.conditionTraitId);

        let removedCount = 0;
        if (matchingEdges.length > 0) {
          const edgesToRemove = effect.removeAll
            ? matchingEdges
            : [matchingEdges.reduce((oldest, e) =>
                ((e.properties?.appliedAt as number) ?? 0) < ((oldest.properties?.appliedAt as number) ?? 0)
                  ? e : oldest
              )];
          for (const edge of edgesToRemove) {
            state.graph.removeEdge(edge.id);
            removedCount++;
          }
          if (removedCount > 0) mutationSummary.touchedStructure = true;
        }

        const removKind = (target.kind === 'agent' || target.kind === 'faction' || target.kind === 'sublocation')
          ? target.kind
          : 'agent' as const;
        emitTrace({
          tick, category: 'condition_removed', agentId: actorAgentId,
          targetId: resolvedId, targetKind: removKind,
          conditionTraitId: effect.conditionTraitId, removedCount,
          encounterId, reactionId: reaction.id,
          summary: `condition_removed[${i}]: ${effect.conditionTraitId} ← ${resolvedId} (removed ${removedCount})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'remove_condition',
          effectDetail: { targetId: resolvedId, conditionTraitId: effect.conditionTraitId, removedCount },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
          summary: `remove_condition[${i}]: removed ${removedCount} edge(s) of ${effect.conditionTraitId} from ${resolvedId}`,
        });
        break;
      }

      case 'condition_attachment': {
        const resolvedId = target.kind !== 'actor_fallback' ? target.id : actorAgentId;
        if (!resolvedId) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', reason: 'no_actor_id',
            summary: `condition_attachment[${i}] skipped: no actor id`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', effectDetail: { templateId: effect.templateId },
            success: false, failReason: 'no_actor_id',
            effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
            summary: `condition_attachment[${i}] skipped: no actorId`,
          });
          break;
        }
        const caTargetNode = state.graph.getNode(resolvedId);
        if (!caTargetNode) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', attemptedTargetId: resolvedId,
            attemptedTargetKind: target.kind !== 'actor_fallback' ? target.kind : 'agent',
            reason: 'target_node_missing',
            summary: `condition_attachment[${i}] skipped: target node not found (${resolvedId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', effectDetail: { targetId: resolvedId, templateId: effect.templateId },
            success: false, failReason: 'target_node_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
            summary: `condition_attachment[${i}] skipped: target node not found (${resolvedId})`,
          });
          break;
        }
        const caTraitNode = state.graph.getNode(effect.templateId);
        if (!caTraitNode) {
          emitTrace({
            tick, category: 'aftermath_target_invalid', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', reason: 'template_missing',
            summary: `condition_attachment[${i}] skipped: trait template not found (${effect.templateId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'condition_attachment', effectDetail: { targetId: resolvedId, templateId: effect.templateId },
            success: false, failReason: 'template_missing',
            effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
            summary: `condition_attachment[${i}] skipped: trait template not found (${effect.templateId})`,
          });
          break;
        }
        const caStackCount = Math.max(1, effect.stackCount ?? CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT);
        const caDuration = (() => {
          if (effect.durationOverride !== undefined) {
            if (effect.durationOverride <= 0) {
              emitTrace({
                tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
                encounterId, actionId, reactionId: reaction.id, effectIndex: i,
                effectKind: 'condition_attachment', effectDetail: { warn: 'duration_override_invalid', templateId: effect.templateId },
                success: true,
                effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
                summary: `condition_attachment[${i}]: duration_override_invalid — falling back to template default`,
              });
              return CONDITION_DURATIONS[effect.templateId] ?? CONDITION_DEFAULT_DURATION_TICKS;
            }
            return effect.durationOverride;
          }
          return CONDITION_DURATIONS[effect.templateId] ?? CONDITION_DEFAULT_DURATION_TICKS;
        })();
        // Apply the condition once per stack
        const caEdgeIds: string[] = [];
        for (let s = 0; s < caStackCount; s++) {
          const caEdgeId = `has_trait_${resolvedId}_${effect.templateId}_${tick}_${i}_s${s}`;
          state.graph.addEdge({
            id: caEdgeId,
            source: resolvedId,
            target: effect.templateId,
            type: 'has_trait',
            properties: {
              appliedAt: tick,
              durationTicks: caDuration,
              intensity: CONDITION_DEFAULT_INTENSITY,
              sourceEncounterId: encounterId,
              sourceReactionId: reaction.id,
            },
          });
          caEdgeIds.push(caEdgeId);
        }
        mutationSummary.touchedStructure = true;
        // Set woundApplied when wound condition targets the actor (drives mid-encounter promotion)
        const caIsWound = effect.templateId === 'trait.condition.wounded';
        const caTargetsActor = !effect.targetAgentId || effect.targetAgentId === actorAgentId;
        if (caIsWound && caTargetsActor) {
          mutationSummary.woundApplied = true;
        }
        const caKind = (target.kind === 'agent' || target.kind === 'faction' || target.kind === 'sublocation')
          ? target.kind
          : 'agent' as const;
        emitTrace({
          tick, category: 'condition_applied', agentId: actorAgentId,
          targetId: resolvedId, targetKind: caKind,
          conditionTraitId: effect.templateId, durationTicks: caDuration, intensity: CONDITION_DEFAULT_INTENSITY,
          encounterId, reactionId: reaction.id,
          summary: `condition_attachment[${i}]: ${effect.templateId} → ${resolvedId} ×${caStackCount} (duration=${caDuration || 'indefinite'})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'condition_attachment',
          effectDetail: { targetId: resolvedId, templateId: effect.templateId, stackCount: caStackCount, durationTicks: caDuration, edgeIds: caEdgeIds, woundApplied: mutationSummary.woundApplied },
          success: true,
          effectiveTargetId: resolvedId, effectiveTargetKind: effectiveTargetKind as 'agent' | 'faction' | 'sublocation' | 'actor_fallback',
          summary: `condition_attachment[${i}]: ${effect.templateId} → ${resolvedId} ×${caStackCount}${caIsWound && caTargetsActor ? ' [woundApplied]' : ''}`,
        });
        break;
      }

      // ─── World-shaping effects (THR-115) ───────────────────────────────────

      case 'spawn_artifact': {
        // Resolve placement target: explicit agent > explicit location > symbolic actor fallback
        const saAgentId = effect.targetAgentId
          ? (effect.targetAgentId.startsWith('$') ? actorAgentId : effect.targetAgentId)
          : (!effect.targetLocationId ? actorAgentId : undefined);
        const saLocationId = effect.targetLocationId;

        if (!saAgentId && !saLocationId) {
          emitTrace({
            tick, category: 'artifact_spawned', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            artifactId: '', artifactName: '', tier: 'common',
            templateId: effect.templateId, targetAgentId: undefined, targetLocationId: undefined,
            sourceEncounterId: encounterId, sourceReactionId: reaction.id,
            success: false, failReason: 'no_placement_target',
            summary: `spawn_artifact[${i}] skipped: no placement target`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'spawn_artifact', effectDetail: { templateId: effect.templateId },
            success: false, failReason: 'no_placement_target',
            summary: `spawn_artifact[${i}] skipped: no placement target`,
          });
          break;
        }

        // Validate placement node exists
        if (saAgentId && !state.graph.getNode(saAgentId)) {
          emitTrace({
            tick, category: 'artifact_spawned', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            artifactId: '', artifactName: '', tier: 'common',
            templateId: effect.templateId, targetAgentId: saAgentId,
            sourceEncounterId: encounterId, sourceReactionId: reaction.id,
            success: false, failReason: 'target_actor_missing',
            summary: `spawn_artifact[${i}] skipped: target actor ${saAgentId} not found`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'spawn_artifact', effectDetail: { targetAgentId: saAgentId },
            success: false, failReason: 'target_actor_missing',
            summary: `spawn_artifact[${i}] skipped: actor ${saAgentId} not found`,
          });
          break;
        }
        if (saLocationId && !state.graph.getNode(saLocationId)) {
          emitTrace({
            tick, category: 'artifact_spawned', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            artifactId: '', artifactName: '', tier: 'common',
            templateId: effect.templateId, targetLocationId: saLocationId,
            sourceEncounterId: encounterId, sourceReactionId: reaction.id,
            success: false, failReason: 'target_location_missing',
            summary: `spawn_artifact[${i}] skipped: target location ${saLocationId} not found`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'spawn_artifact', effectDetail: { targetLocationId: saLocationId },
            success: false, failReason: 'target_location_missing',
            summary: `spawn_artifact[${i}] skipped: location ${saLocationId} not found`,
          });
          break;
        }

        // Determine tier — template lookup is deferred until Phase 2+ content; fall back to 'common'
        const saTier: ArtifactTier = effect.tier ?? 'common';
        const saNodeType = saTier === 'legendary' ? 'artifact_legendary' : 'artifact';
        const saActorEdgeType = saTier === 'legendary' ? 'bonded_to' : 'possesses';

        // Derive artifact name: nameOverride > templateId-based > generic
        const saName = effect.nameOverride
          ?? (effect.templateId ? effect.templateId.split('.').pop() ?? 'artifact' : 'artifact');

        const saArtifactId = `artifact_spawned_${encounterId}_${reaction.id}_${i}_${tick}`;

        // Warn if templateId not found in graph (fail-soft: use fallback name)
        let saTemplateMissing = false;
        if (effect.templateId && !state.graph.getNode(effect.templateId)) {
          saTemplateMissing = true;
        }

        state.graph.addNode({
          id: saArtifactId,
          type: saNodeType,
          name: saName,
          properties: {
            category: effect.category,
            tier: saTier,
            tags: effect.tags ? [...effect.tags] : [],
            sourceEncounterId: encounterId,
            spawnedAtTick: tick,
          },
        });

        if (saAgentId) {
          state.graph.addEdge({
            id: `${saActorEdgeType}_${saAgentId}_${saArtifactId}`,
            source: saAgentId,
            target: saArtifactId,
            type: saActorEdgeType,
            properties: { spawnedAtTick: tick, sourceEncounterId: encounterId },
          });
        } else if (saLocationId) {
          state.graph.addEdge({
            id: `contains_${saLocationId}_${saArtifactId}`,
            source: saLocationId,
            target: saArtifactId,
            type: 'contains',
            properties: { spawnedAtTick: tick, sourceEncounterId: encounterId },
          });
        }

        mutationSummary.touchedWorld = true;
        touchWorld(runtime);

        const saSignificance = saTier === 'legendary'
          ? SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_LEGENDARY
          : saTier === 'shaping'
            ? SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_SHAPING
            : SPAWN_ARTIFACT_DEFAULT_SIGNIFICANCE_COMMON;

        const saMessage = effect.messageOverride ?? `${saName} has come into the world.`;
        const saEvent: TickEvent = {
          id: `${saArtifactId}_chronicle`,
          tick,
          type: 'narrative',
          message: saMessage,
          significance: saSignificance,
          actorId: saAgentId ?? actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, saEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, saEvent);

        emitTrace({
          tick, category: 'artifact_spawned', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          artifactId: saArtifactId, artifactName: saName, tier: saTier,
          templateId: effect.templateId,
          targetAgentId: saAgentId, targetLocationId: saLocationId,
          sourceEncounterId: encounterId, sourceReactionId: reaction.id,
          success: true,
          ...(saTemplateMissing ? { failReason: 'template_missing_used_fallback' } : {}),
          summary: `spawn_artifact[${i}]: "${saName}" (${saTier}) → ${saAgentId ?? saLocationId}`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'spawn_artifact',
          effectDetail: { artifactId: saArtifactId, name: saName, tier: saTier, targetAgentId: saAgentId, targetLocationId: saLocationId },
          success: true,
          summary: `spawn_artifact[${i}]: "${saName}" (${saTier})`,
        });
        break;
      }

      case 'emit_omen': {
        const eoId = `omen_${encounterId}_${reaction.id}_${i}_${tick}`;
        const eoDuration = effect.durationTicks ?? EMITTED_OMEN_DEFAULT_DURATION_TICKS;
        const eoExpiresTick = tick + eoDuration;

        // Normalize scope — degrade invalid scope to global
        let eoScope = effect.scope;
        let eoDegradedToGlobal = false;
        if (eoScope.kind === 'regional' && !eoScope.regionId) {
          eoScope = { kind: 'global' };
          eoDegradedToGlobal = true;
        }
        if (eoScope.kind === 'local' && (eoScope.hexCol === undefined || eoScope.hexRow === undefined)) {
          eoScope = { kind: 'global' };
          eoDegradedToGlobal = true;
        }
        // Apply default radius for local scope
        if (eoScope.kind === 'local' && eoScope.radius === undefined) {
          eoScope = { ...eoScope, radius: EMITTED_OMEN_LOCAL_DEFAULT_RADIUS };
        }

        const eoEntry: EmittedOmen = {
          omenId: eoId,
          sourceEncounterId: encounterId,
          sourceReactionId: reaction.id,
          category: effect.category,
          intensity: Math.max(0, Math.min(1, effect.intensity)),
          scope: eoScope,
          narrativeHook: effect.narrativeHook,
          sphereAlignment: effect.sphereAlignment,
          emittedTick: tick,
          expiresTick: eoExpiresTick,
        };

        // Build new emittedOmens list with cap enforcement
        const currentOmens = nextEmittedOmens ?? state.emittedOmens ?? [];
        let updatedOmens = [...currentOmens, eoEntry];
        if (updatedOmens.length > EMITTED_OMEN_MAX_ACTIVE) {
          // Evict oldest (smallest emittedTick)
          const evicted = updatedOmens.reduce((oldest, o) =>
            o.emittedTick < oldest.emittedTick ? o : oldest
          , updatedOmens[0]);
          emitTrace({
            tick, category: 'omen_decayed', agentId: actorAgentId,
            omenId: evicted.omenId, livedTicks: tick - evicted.emittedTick,
            failReason: 'cap_evicted',
            summary: `omen_decayed: ${evicted.omenId} evicted (cap_evicted)`,
          });
          updatedOmens = updatedOmens.filter(o => o !== evicted);
        }
        nextEmittedOmens = updatedOmens;
        mutationSummary.touchedWorld = true;
        touchWorld(runtime);

        const eoSignificance = Math.max(0.5, Math.min(0.85, 0.5 + eoEntry.intensity * 0.3));
        const eoEvent: TickEvent = {
          id: `${eoId}_chronicle`,
          tick,
          type: 'narrative',
          message: effect.narrativeHook,
          significance: eoSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, eoEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, eoEvent);

        emitTrace({
          tick, category: 'omen_emitted', agentId: actorAgentId,
          omenId: eoId, omenCategory: effect.category,
          intensity: eoEntry.intensity, scope: eoScope,
          expiresTick: eoExpiresTick,
          sourceEncounterId: encounterId, sourceReactionId: reaction.id,
          ...(eoDegradedToGlobal ? { degradedToGlobal: true } : {}),
          summary: `omen_emitted[${i}]: ${effect.category} intensity=${eoEntry.intensity.toFixed(2)} scope=${eoScope.kind} expires@${eoExpiresTick}`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'emit_omen',
          effectDetail: { omenId: eoId, category: effect.category, intensity: eoEntry.intensity, scope: eoScope, expiresTick: eoExpiresTick },
          success: true,
          summary: `emit_omen[${i}]: ${effect.category} ${eoEntry.intensity.toFixed(2)} (${eoScope.kind})`,
        });
        break;
      }

      case 'faction_splinter': {
        const fsSrc = state.graph.getNode(effect.sourceFactionId);
        if (!fsSrc || (fsSrc.properties?.actorStatus as string | undefined) === 'dissolved') {
          emitTrace({
            tick, category: 'faction_splintered', agentId: actorAgentId,
            sourceFactionId: effect.sourceFactionId, newFactionId: '',
            memberCount: 0, selectionKind: '', reputationShare: 0,
            success: false, failReason: 'source_faction_invalid',
            summary: `faction_splinter[${i}] skipped: source faction invalid (${effect.sourceFactionId})`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_splinter', effectDetail: { sourceFactionId: effect.sourceFactionId },
            success: false, failReason: 'source_faction_invalid',
            summary: `faction_splinter[${i}] skipped: source faction invalid`,
          });
          break;
        }

        // Select members from source faction
        const allMembers = state.graph.getIncomingEdges(effect.sourceFactionId, 'member_of')
          .map(e => ({ id: e.source, reputation: (e.properties?.reputation as number | undefined) ?? DEFAULT_FACTION_REPUTATION }));

        let selectedMembers = selectFactionMembers(allMembers, effect.memberSelection, state, tick, encounterId, reaction.id, i);

        const newFactionId = `faction_splinter_${encounterId}_${reaction.id}_${i}_${tick}`;
        state.graph.addNode({
          id: newFactionId,
          type: 'actor',
          name: effect.newFactionName,
          properties: {
            actorType: 'faction',
            actorStatus: 'active',
            sourceEncounterId: encounterId,
            foundedTick: tick,
          },
        });

        const repShare = effect.inheritReputationShare ?? FACTION_SPLINTER_DEFAULT_REPUTATION_SHARE;
        for (const member of selectedMembers) {
          // Remove old member_of edge
          const oldEdges = state.graph.getOutgoingEdges(member.id, 'member_of')
            .filter(e => e.target === effect.sourceFactionId);
          for (const e of oldEdges) state.graph.removeEdge(e.id);

          // Add new member_of edge to splinter
          state.graph.addEdge({
            id: `member_of_${member.id}_${newFactionId}`,
            source: member.id,
            target: newFactionId,
            type: 'member_of',
            properties: { reputation: clamp01(member.reputation * repShare), joinedTick: tick },
          });
        }

        // Copy relates_to edges from source to new faction (marked inherited)
        const srcRelations = state.graph.getOutgoingEdges(effect.sourceFactionId, 'relates_to');
        for (const rel of srcRelations) {
          if (rel.target !== newFactionId) {
            state.graph.addEdge({
              id: `relates_to_${newFactionId}_${rel.target}_inherited`,
              source: newFactionId,
              target: rel.target,
              type: 'relates_to',
              properties: { ...rel.properties, inherited: true },
            });
          }
        }

        // Splinter starts resentful toward parent
        state.graph.addEdge({
          id: `relates_to_${newFactionId}_${effect.sourceFactionId}`,
          source: newFactionId,
          target: effect.sourceFactionId,
          type: 'relates_to',
          properties: { sentiment: FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT, strength: 0.8, basis: 'splinter' },
        });

        mutationSummary.touchedWorld = true;
        mutationSummary.touchedStructure = true;
        touchWorld(runtime);
        touchStructure(runtime);

        const fsSignificance = FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.splinter;
        const fsMessage = effect.narrativeHook ?? `${fsSrc.name} fractures. ${effect.newFactionName} breaks away.`;
        const fsEvent: TickEvent = {
          id: `${newFactionId}_chronicle`,
          tick,
          type: 'narrative',
          message: fsMessage,
          significance: fsSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, fsEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, fsEvent);

        emitTrace({
          tick, category: 'faction_splintered', agentId: actorAgentId,
          sourceFactionId: effect.sourceFactionId, newFactionId,
          memberCount: selectedMembers.length,
          selectionKind: effect.memberSelection.kind,
          reputationShare: repShare,
          success: true,
          summary: `faction_splinter[${i}]: ${effect.sourceFactionId} → ${newFactionId} (${selectedMembers.length} members, sel=${effect.memberSelection.kind})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'faction_splinter',
          effectDetail: { sourceFactionId: effect.sourceFactionId, newFactionId, memberCount: selectedMembers.length },
          success: true,
          summary: `faction_splinter[${i}]: ${selectedMembers.length} members broke to ${newFactionId}`,
        });
        break;
      }

      case 'faction_absorb': {
        const faAbsorbing = state.graph.getNode(effect.absorbingFactionId);
        const faAbsorbed = state.graph.getNode(effect.absorbedFactionId);
        if (!faAbsorbing || !faAbsorbed
          || (faAbsorbing.properties?.actorStatus as string | undefined) === 'dissolved'
          || (faAbsorbed.properties?.actorStatus as string | undefined) === 'dissolved') {
          emitTrace({
            tick, category: 'faction_absorbed', agentId: actorAgentId,
            absorbingFactionId: effect.absorbingFactionId, absorbedFactionId: effect.absorbedFactionId,
            migratedMemberCount: 0, reputationMergeStrategy: '',
            success: false, failReason: 'faction_missing_or_dissolved',
            summary: `faction_absorb[${i}] skipped: faction missing or dissolved`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_absorb',
            effectDetail: { absorbingFactionId: effect.absorbingFactionId, absorbedFactionId: effect.absorbedFactionId },
            success: false, failReason: 'faction_missing_or_dissolved',
            summary: `faction_absorb[${i}] skipped: faction missing or dissolved`,
          });
          break;
        }

        const mergeStrategy = effect.reputationMerge ?? 'weighted_avg';
        const absorbedMembers = state.graph.getIncomingEdges(effect.absorbedFactionId, 'member_of');
        let migratedCount = 0;

        for (const memberEdge of absorbedMembers) {
          const absorbedRep = (memberEdge.properties?.reputation as number | undefined) ?? DEFAULT_FACTION_REPUTATION;
          // Check if already member of absorbing faction
          const existingEdge = state.graph.getOutgoingEdges(memberEdge.source, 'member_of')
            .find(e => e.target === effect.absorbingFactionId);

          const newRep = existingEdge
            ? mergeReputation(
                (existingEdge.properties?.reputation as number | undefined) ?? DEFAULT_FACTION_REPUTATION,
                absorbedRep,
                mergeStrategy,
              )
            : absorbedRep;

          state.graph.removeEdge(memberEdge.id);
          if (existingEdge) {
            existingEdge.properties.reputation = newRep;
          } else {
            state.graph.addEdge({
              id: `member_of_${memberEdge.source}_${effect.absorbingFactionId}`,
              source: memberEdge.source,
              target: effect.absorbingFactionId,
              type: 'member_of',
              properties: { reputation: newRep, joinedTick: tick },
            });
          }
          migratedCount++;
        }

        // Rewrite relates_to edges pointing at absorbed faction → absorbing
        const allRelatesTo = state.graph.getIncomingEdges(effect.absorbedFactionId, 'relates_to');
        for (const rel of allRelatesTo) {
          if (rel.source !== effect.absorbingFactionId) {
            state.graph.removeEdge(rel.id);
            // Avoid self-loop: skip if source is absorbing faction
            state.graph.addEdge({
              id: `${rel.id}_rewritten`,
              source: rel.source,
              target: effect.absorbingFactionId,
              type: 'relates_to',
              properties: { ...rel.properties },
            });
          }
        }

        // Mark absorbed faction dissolved
        faAbsorbed.properties.actorStatus = 'dissolved';
        mutationSummary.touchedWorld = true;
        mutationSummary.touchedStructure = true;
        touchWorld(runtime);
        touchStructure(runtime);

        const faSignificance = FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.absorb;
        const faMessage = effect.narrativeHook ?? `${faAbsorbed.name} is absorbed into ${faAbsorbing.name}.`;
        const faEvent: TickEvent = {
          id: `faction_absorb_${encounterId}_${reaction.id}_${i}_${tick}`,
          tick,
          type: 'narrative',
          message: faMessage,
          significance: faSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, faEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, faEvent);

        emitTrace({
          tick, category: 'faction_absorbed', agentId: actorAgentId,
          absorbingFactionId: effect.absorbingFactionId,
          absorbedFactionId: effect.absorbedFactionId,
          migratedMemberCount: migratedCount,
          reputationMergeStrategy: mergeStrategy,
          success: true,
          summary: `faction_absorb[${i}]: ${effect.absorbedFactionId} → ${effect.absorbingFactionId} (${migratedCount} members, merge=${mergeStrategy})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'faction_absorb',
          effectDetail: { absorbingFactionId: effect.absorbingFactionId, absorbedFactionId: effect.absorbedFactionId, migratedMemberCount: migratedCount },
          success: true,
          summary: `faction_absorb[${i}]: ${migratedCount} members migrated`,
        });
        break;
      }

      case 'faction_dissolve': {
        const fdNode = state.graph.getNode(effect.factionId);
        if (!fdNode) {
          emitTrace({
            tick, category: 'faction_dissolved', agentId: actorAgentId,
            factionId: effect.factionId, releasedMemberCount: 0, memberFallback: '',
            success: false, failReason: 'faction_missing',
            summary: `faction_dissolve[${i}] skipped: faction ${effect.factionId} not found`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_dissolve', effectDetail: { factionId: effect.factionId },
            success: false, failReason: 'faction_missing',
            summary: `faction_dissolve[${i}] skipped: faction not found`,
          });
          break;
        }

        const fdFallback = effect.memberFallback ?? 'independent';
        const fdMembers = state.graph.getIncomingEdges(effect.factionId, 'member_of');

        // Find top rival for drift_to_rival fallback (skip dissolved target factions)
        let fdRivalId: string | undefined;
        if (fdFallback === 'drift_to_rival') {
          const fdRelations = state.graph.getOutgoingEdges(effect.factionId, 'relates_to')
            .filter(e => (state.graph.getNode(e.target)?.properties?.actorStatus as string | undefined) !== 'dissolved')
            .sort((a, b) => ((b.properties?.strength as number | undefined) ?? 0) - ((a.properties?.strength as number | undefined) ?? 0));
          fdRivalId = fdRelations[0]?.target;
        }

        for (const memberEdge of fdMembers) {
          state.graph.removeEdge(memberEdge.id);
          if (fdFallback === 'drift_to_rival' && fdRivalId) {
            state.graph.addEdge({
              id: `member_of_${memberEdge.source}_${fdRivalId}_drift`,
              source: memberEdge.source,
              target: fdRivalId,
              type: 'member_of',
              properties: { reputation: FACTION_DRIFT_TO_RIVAL_INITIAL_REPUTATION, joinedTick: tick, basis: 'drift' },
            });
          }
        }

        fdNode.properties.actorStatus = 'dissolved';
        mutationSummary.touchedWorld = true;
        mutationSummary.touchedStructure = true;
        touchWorld(runtime);
        touchStructure(runtime);

        const fdSignificance = FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.dissolve;
        const fdMessage = effect.narrativeHook ?? `${fdNode.name} is no more.`;
        const fdEvent: TickEvent = {
          id: `faction_dissolve_${encounterId}_${reaction.id}_${i}_${tick}`,
          tick,
          type: 'narrative',
          message: fdMessage,
          significance: fdSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, fdEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, fdEvent);

        emitTrace({
          tick, category: 'faction_dissolved', agentId: actorAgentId,
          factionId: effect.factionId, releasedMemberCount: fdMembers.length,
          memberFallback: fdFallback,
          success: true,
          summary: `faction_dissolve[${i}]: ${effect.factionId} dissolved (${fdMembers.length} members released, fallback=${fdFallback})`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'faction_dissolve',
          effectDetail: { factionId: effect.factionId, releasedMemberCount: fdMembers.length, memberFallback: fdFallback },
          success: true,
          summary: `faction_dissolve[${i}]: ${fdMembers.length} members released`,
        });
        break;
      }

      case 'faction_declare_war': {
        const fdwA = state.graph.getNode(effect.factionA);
        const fdwB = state.graph.getNode(effect.factionB);
        if (!fdwA || !fdwB) {
          emitTrace({
            tick, category: 'faction_war_declared', agentId: actorAgentId,
            factionA: effect.factionA, factionB: effect.factionB, previousSentiment: 0,
            success: false, failReason: 'faction_missing',
            summary: `faction_declare_war[${i}] skipped: faction missing`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_declare_war',
            effectDetail: { factionA: effect.factionA, factionB: effect.factionB },
            success: false, failReason: 'faction_missing',
            summary: `faction_declare_war[${i}] skipped: faction missing`,
          });
          break;
        }

        const upsertWarRelation = (src: string, dst: string) => {
          const existing = state.graph.getOutgoingEdges(src, 'relates_to').find(e => e.target === dst);
          const prevSent = existing ? (existing.properties?.sentiment as number | undefined) ?? 0 : 0;
          if (existing) {
            existing.properties.sentiment = FACTION_WAR_SENTIMENT_FLOOR;
            existing.properties.strength = 1.0;
            existing.properties.basis = 'war';
          } else {
            state.graph.addEdge({
              id: `relates_to_${src}_${dst}_war`,
              source: src,
              target: dst,
              type: 'relates_to',
              properties: { sentiment: FACTION_WAR_SENTIMENT_FLOOR, strength: 1.0, basis: 'war' },
            });
          }
          return prevSent;
        };

        const fdwPrevSent = upsertWarRelation(effect.factionA, effect.factionB);
        upsertWarRelation(effect.factionB, effect.factionA);

        mutationSummary.touchedWorld = true;
        mutationSummary.touchedStructure = true;
        touchWorld(runtime);
        touchStructure(runtime);

        const fdwSignificance = FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.declare_war;
        const fdwMessage = effect.narrativeHook ?? `${fdwA.name} and ${fdwB.name} are now at war.`;
        const fdwEvent: TickEvent = {
          id: `faction_war_${encounterId}_${reaction.id}_${i}_${tick}`,
          tick,
          type: 'narrative',
          message: fdwMessage,
          significance: fdwSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, fdwEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, fdwEvent);

        emitTrace({
          tick, category: 'faction_war_declared', agentId: actorAgentId,
          factionA: effect.factionA, factionB: effect.factionB,
          previousSentiment: fdwPrevSent,
          success: true,
          summary: `faction_declare_war[${i}]: ${effect.factionA} ⚔ ${effect.factionB}`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'faction_declare_war',
          effectDetail: { factionA: effect.factionA, factionB: effect.factionB },
          success: true,
          summary: `faction_declare_war[${i}]: war between ${effect.factionA} and ${effect.factionB}`,
        });
        break;
      }

      case 'faction_force_peace': {
        const ffpA = state.graph.getNode(effect.factionA);
        const ffpB = state.graph.getNode(effect.factionB);
        if (!ffpA || !ffpB) {
          emitTrace({
            tick, category: 'faction_peace_forced', agentId: actorAgentId,
            factionA: effect.factionA, factionB: effect.factionB,
            previousSentiment: 0, newSentiment: 0,
            success: false, failReason: 'faction_missing',
            summary: `faction_force_peace[${i}] skipped: faction missing`,
          });
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'faction_force_peace',
            effectDetail: { factionA: effect.factionA, factionB: effect.factionB },
            success: false, failReason: 'faction_missing',
            summary: `faction_force_peace[${i}] skipped: faction missing`,
          });
          break;
        }

        const sentBoost = effect.sentimentBoost ?? FACTION_PEACE_DEFAULT_SENTIMENT_BOOST;
        const upsertPeaceRelation = (src: string, dst: string) => {
          const existing = state.graph.getOutgoingEdges(src, 'relates_to').find(e => e.target === dst);
          const prevSent = existing ? (existing.properties?.sentiment as number | undefined) ?? 0 : 0;
          const newSent = Math.max(FACTION_PEACE_SENTIMENT_FLOOR, prevSent + sentBoost);
          if (existing) {
            existing.properties.sentiment = newSent;
            existing.properties.basis = 'treaty';
          } else {
            state.graph.addEdge({
              id: `relates_to_${src}_${dst}_peace`,
              source: src,
              target: dst,
              type: 'relates_to',
              properties: { sentiment: newSent, strength: 0.6, basis: 'treaty' },
            });
          }
          return { prevSent, newSent };
        };

        const { prevSent: ffpPrevSent, newSent: ffpNewSent } = upsertPeaceRelation(effect.factionA, effect.factionB);
        upsertPeaceRelation(effect.factionB, effect.factionA);

        mutationSummary.touchedWorld = true;
        mutationSummary.touchedStructure = true;
        touchWorld(runtime);
        touchStructure(runtime);

        const ffpSignificance = FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.force_peace;
        const ffpMessage = effect.narrativeHook ?? `${ffpA.name} and ${ffpB.name} have made peace.`;
        const ffpEvent: TickEvent = {
          id: `faction_peace_${encounterId}_${reaction.id}_${i}_${tick}`,
          tick,
          type: 'narrative',
          message: ffpMessage,
          significance: ffpSignificance,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, ffpEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, ffpEvent);

        emitTrace({
          tick, category: 'faction_peace_forced', agentId: actorAgentId,
          factionA: effect.factionA, factionB: effect.factionB,
          previousSentiment: ffpPrevSent, newSentiment: ffpNewSent,
          success: true,
          summary: `faction_force_peace[${i}]: ${effect.factionA} ↔ ${effect.factionB} sentiment ${ffpPrevSent.toFixed(2)} → ${ffpNewSent.toFixed(2)}`,
        });
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'faction_force_peace',
          effectDetail: { factionA: effect.factionA, factionB: effect.factionB, previousSentiment: ffpPrevSent, newSentiment: ffpNewSent },
          success: true,
          summary: `faction_force_peace[${i}]: peace between ${effect.factionA} and ${effect.factionB}`,
        });
        break;
      }

      // ─── Thread mutation effects (THR-116) ─────────────────────────────────

      case 'thread_strengthen': {
        const tsEdges = state.graph.getOutgoingEdges(effect.ascendantId, 'thread')
          .filter(e => e.target === effect.mortalId);
        if (tsEdges.length === 0) {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_strengthen', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
            reason: 'edge_missing',
            summary: `thread_strengthen[${i}] skipped: no thread edge ${effect.ascendantId} → ${effect.mortalId}`,
          });
          break;
        }
        const tsEdge = tsEdges[0];
        const tsBefore = (tsEdge.properties.strength as number | undefined) ?? 0;
        const tsDelta = effect.delta ?? THREAD_STRENGTHEN_DEFAULT;
        const tsAfter = Math.min(THREAD_STRENGTH_MAX, tsBefore + tsDelta);
        tsEdge.properties.strength = tsAfter;
        if (effect.reason) tsEdge.properties.lastReason = effect.reason;
        mutationSummary.touchedWorld = true;
        touchWorld(runtime);
        emitTrace({
          tick, category: 'thread_mutation_applied', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'thread_strengthen', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
          before: { strength: tsBefore, existed: true }, after: { strength: tsAfter, existed: true },
          delta: tsDelta, reason: effect.reason,
          summary: `thread_strengthen[${i}]: ${effect.ascendantId}→${effect.mortalId} ${tsBefore.toFixed(2)}→${tsAfter.toFixed(2)}`,
        });
        break;
      }

      case 'thread_weaken': {
        const twEdges = state.graph.getOutgoingEdges(effect.ascendantId, 'thread')
          .filter(e => e.target === effect.mortalId);
        if (twEdges.length === 0) {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_weaken', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
            reason: 'edge_missing',
            summary: `thread_weaken[${i}] skipped: no thread edge ${effect.ascendantId} → ${effect.mortalId}`,
          });
          break;
        }
        const twEdge = twEdges[0];
        const twBefore = (twEdge.properties.strength as number | undefined) ?? 0;
        const twDelta = effect.delta ?? THREAD_WEAKEN_DEFAULT;
        const twAfter = Math.max(THREAD_STRENGTH_MIN, twBefore - twDelta);
        twEdge.properties.strength = twAfter;
        if (effect.reason) twEdge.properties.lastReason = effect.reason;
        mutationSummary.touchedWorld = true;
        touchWorld(runtime);
        emitTrace({
          tick, category: 'thread_mutation_applied', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'thread_weaken', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
          before: { strength: twBefore, existed: true }, after: { strength: twAfter, existed: true },
          delta: twDelta, reason: effect.reason,
          summary: `thread_weaken[${i}]: ${effect.ascendantId}→${effect.mortalId} ${twBefore.toFixed(2)}→${twAfter.toFixed(2)}`,
        });
        break;
      }

      case 'thread_break': {
        const tbEdges = state.graph.getOutgoingEdges(effect.ascendantId, 'thread')
          .filter(e => e.target === effect.mortalId);
        if (tbEdges.length === 0) {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_break', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
            reason: 'edge_missing',
            summary: `thread_break[${i}] skipped: no thread edge ${effect.ascendantId} → ${effect.mortalId}`,
          });
          break;
        }
        const tbEdge = tbEdges[0];
        const tbStrengthBefore = (tbEdge.properties.strength as number | undefined) ?? 0;
        state.graph.removeEdge(tbEdge.id);
        mutationSummary.touchedWorld = true;
        touchWorld(runtime);
        // Emit narrative event so the UI can surface the severance
        const tbEvent: import('../types/gameState').TickEvent = {
          id: `thread_break_${encounterId}_${reaction.id}_${i}_${tick}`,
          tick,
          type: 'narrative',
          message: effect.reason ?? 'A divine thread has been severed.',
          significance: 0.75,
          actorId: actorAgentId,
        };
        nextTickEvents = [...nextTickEvents, tbEvent];
        nextRecentEvents = appendRecentEvent(nextRecentEvents, tbEvent);
        emitTrace({
          tick, category: 'thread_mutation_applied', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'thread_break', ascendantId: effect.ascendantId, mortalId: effect.mortalId,
          before: { strength: tbStrengthBefore, existed: true }, after: { existed: false },
          reason: effect.reason,
          summary: `thread_break[${i}]: severed thread ${effect.ascendantId}→${effect.mortalId}`,
        });
        break;
      }

      case 'thread_branch': {
        // Verify source thread edge exists
        const tbrSrcEdges = state.graph.getOutgoingEdges(effect.ascendantId, 'thread')
          .filter(e => e.target === effect.sourceMortalId);
        if (tbrSrcEdges.length === 0) {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_branch', ascendantId: effect.ascendantId, mortalId: effect.newMortalId,
            reason: 'edge_missing',
            summary: `thread_branch[${i}] skipped: source thread ${effect.ascendantId}→${effect.sourceMortalId} not found`,
          });
          break;
        }
        // Verify new mortal node exists
        if (!state.graph.getNode(effect.newMortalId)) {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_branch', ascendantId: effect.ascendantId, mortalId: effect.newMortalId,
            reason: 'node_missing',
            summary: `thread_branch[${i}] skipped: new mortal node ${effect.newMortalId} not found`,
          });
          break;
        }
        const tbrStrength = effect.initialStrength ?? THREAD_BRANCH_INITIAL_STRENGTH;
        const tbrEdgeId = `thread_${effect.ascendantId}_${effect.newMortalId}_branch_${tick}`;
        try {
          state.graph.addEdge({
            id: tbrEdgeId,
            source: effect.ascendantId,
            target: effect.newMortalId,
            type: 'thread',
            properties: {
              strength: tbrStrength,
              branchedFromMortalId: effect.sourceMortalId,
              branchedAtTick: tick,
              reason: effect.reason,
            },
          });
        } catch {
          emitTrace({
            tick, category: 'thread_mutation_skipped', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'thread_branch', ascendantId: effect.ascendantId, mortalId: effect.newMortalId,
            reason: 'duplicate_edge',
            summary: `thread_branch[${i}] skipped: edge ${tbrEdgeId} already exists`,
          });
          break;
        }
        mutationSummary.touchedWorld = true;
        touchWorld(runtime);
        emitTrace({
          tick, category: 'thread_mutation_applied', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'thread_branch', ascendantId: effect.ascendantId, mortalId: effect.newMortalId,
          before: { existed: false }, after: { strength: tbrStrength, existed: true },
          reason: effect.reason,
          summary: `thread_branch[${i}]: ${effect.ascendantId}→${effect.newMortalId} (branched from ${effect.sourceMortalId}, strength ${tbrStrength.toFixed(2)})`,
        });
        break;
      }

      case 'secret_discovery': {
        // Explicit effect-level secret discovery (distinct from template-level secretDiscovery flag)
        const sdActorId = actorAgentId;
        const sdTargetId = action?.targetId;
        if (!sdActorId || !sdTargetId) {
          emitTrace({
            tick, category: 'secret_discovered', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'secret_discovery', success: false, failReason: 'missing_actor_or_target',
            summary: `secret_discovery[${i}] skipped: missing actor or target`,
          });
          break;
        }
        const sdTargetNode = state.graph.getNode(sdTargetId);
        if (!sdTargetNode) {
          emitTrace({
            tick, category: 'secret_discovered', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'secret_discovery', success: false, failReason: 'target_node_missing', targetId: sdTargetId,
            summary: `secret_discovery[${i}] skipped: target node ${sdTargetId} not found`,
          });
          break;
        }
        try {
          const sdSeed = (state.seed ^ tick * 53) >>> 0;
          const sdRng = mulberry32(sdSeed);
          const sdSecret = generateSecret(sdTargetNode, state.graph, effect.source, sdRng, effect.magnitudeBonus);
          const sdCreated = createSecretEdge(sdActorId, sdTargetId, sdSecret, effect.source, tick, state.graph);
          if (sdCreated) {
            touchWorld(runtime);
            mutationSummary.touchedWorld = true;
            emitTrace({
              tick, category: 'secret_discovered', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id, effectIndex: i,
              effectKind: 'secret_discovery', discovererId: sdActorId, subjectId: sdTargetId,
              secretType: sdCreated.secretType, magnitude: sdCreated.magnitude, source: sdCreated.source,
              summary: `secret_discovery[${i}]: ${sdActorId} learned (${sdCreated.secretType}) about ${sdTargetId} via ${effect.source} (mag ${sdCreated.magnitude.toFixed(2)})`,
            });
          }
        } catch {
          // fail-soft: secret discovery must not block encounter resolution
        }
        break;
      }

      case 'favor_creation': {
        // Explicit effect-level favor creation (distinct from template-level favorGeneration flag)
        const fcActorId = actorAgentId;
        const fcTargetId = action?.targetId;
        if (!fcActorId || !fcTargetId) {
          emitTrace({
            tick, category: 'favor_created', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'favor_creation', success: false, failReason: 'missing_actor_or_target',
            summary: `favor_creation[${i}] skipped: missing actor or target`,
          });
          break;
        }
        try {
          const [magMin, magMax] = effect.magnitudeRange;
          const fcSeed = (state.seed ^ tick * 61) >>> 0;
          const fcRng = mulberry32(fcSeed);
          const fcMagnitude = magMin + fcRng() * (magMax - magMin);
          // debtor = target (was helped), creditor = actor (did the helping)
          const fcCreated = createFavorEdge(fcTargetId, fcActorId, fcMagnitude, effect.context, tick, state.graph);
          if (fcCreated) {
            touchWorld(runtime);
            mutationSummary.touchedWorld = true;
            emitTrace({
              tick, category: 'favor_created', agentId: actorAgentId,
              encounterId, actionId, reactionId: reaction.id, effectIndex: i,
              effectKind: 'favor_creation', debtorId: fcTargetId, creditorId: fcActorId,
              magnitude: fcMagnitude, context: effect.context,
              summary: `favor_creation[${i}]: ${fcTargetId} owes ${fcActorId} (${effect.context}, mag ${fcMagnitude.toFixed(2)})`,
            });
          }
        } catch {
          // fail-soft
        }
        break;
      }
    }
  }

  const nextState: GameState = {
    ...state,
    tickEvents: nextTickEvents,
    recentEvents: nextRecentEvents,
    clearanceGateStates: touchedClearanceGateStates ? nextClearanceGateStates : state.clearanceGateStates,
    pendingEncounterSeeds: nextSeeds.length > 0
      ? [...(state.pendingEncounterSeeds ?? []), ...nextSeeds]
      : state.pendingEncounterSeeds,
    hiddenMarks: nextHiddenMarks.length > 0
      ? [...(state.hiddenMarks ?? []), ...nextHiddenMarks]
      : state.hiddenMarks,
    intelligenceRecords: nextIntelligenceRecords.length > 0
      ? [...(state.intelligenceRecords ?? []), ...nextIntelligenceRecords]
      : state.intelligenceRecords,
    emittedOmens: nextEmittedOmens !== undefined ? nextEmittedOmens : state.emittedOmens,
  };

  return { state: nextState, mutationSummary };
}
