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
import { CONDITION_DURATIONS } from '../data/condition-trait-content';
import { CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT } from '../data/attachment-slot-constants';

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
  };

  return { state: nextState, mutationSummary };
}
