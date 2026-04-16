import type { GameState, TickEvent } from '../types/gameState';
import { MAX_RECENT_EVENTS } from '../types/gameState';
import { DEFAULT_REPUTATION } from '../types/disposition';
import type { EncounterAftermathReaction, HiddenMark, IntelligenceRecord, PendingEncounterSeed, UnifiedAction } from '../types/unifiedAction';
import { emitTrace } from './traceBuffer';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function appendRecentEvent(
  existing: readonly TickEvent[],
  event: TickEvent,
): TickEvent[] {
  return [...existing, event].slice(-MAX_RECENT_EVENTS);
}

export function applyEncounterAftermathReaction(
  state: GameState,
  action: UnifiedAction | undefined,
  reaction: EncounterAftermathReaction,
  tick: number,
): GameState {
  let nextRecentEvents = state.recentEvents;
  let nextTickEvents = state.tickEvents;
  let nextClearanceGateStates = state.clearanceGateStates
    ? new Map(state.clearanceGateStates)
    : undefined;
  let touchedClearanceGateStates = false;
  let nextSeeds: PendingEncounterSeed[] = [];
  let nextHiddenMarks: HiddenMark[] = [];
  let nextIntelligenceRecords: IntelligenceRecord[] = [];

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
    switch (effect.kind) {
      case 'reputation_score': {
        const actorId = effect.actorId ?? actorAgentId;
        if (!actorId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_score', effectDetail: { delta: effect.delta },
            success: false, failReason: 'no_actor_id',
            summary: `reputation_score[${i}] skipped: no actorId`,
          });
          break;
        }
        const actorNode = state.graph.getNode(actorId);
        if (!actorNode) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_score', effectDetail: { actorId, delta: effect.delta },
            success: false, failReason: 'actor_node_missing',
            summary: `reputation_score[${i}] skipped: actor node not found (${actorId})`,
          });
          break;
        }
        const current = (actorNode.properties?.reputationScore as number | undefined) ?? DEFAULT_REPUTATION;
        actorNode.properties.reputationScore = clamp01(current + effect.delta);
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'reputation_score',
          effectDetail: { actorId, delta: effect.delta, previous: current, result: actorNode.properties.reputationScore },
          success: true,
          summary: `reputation_score[${i}]: ${actorId} ${effect.delta >= 0 ? '+' : ''}${effect.delta.toFixed(2)}`,
        });
        break;
      }

      case 'reputation_tally': {
        const actorId = effect.actorId ?? actorAgentId;
        if (!actorId) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_tally', effectDetail: { key: effect.key, delta: effect.delta },
            success: false, failReason: 'no_actor_id',
            summary: `reputation_tally[${i}] skipped: no actorId`,
          });
          break;
        }
        const actorNode = state.graph.getNode(actorId);
        if (!actorNode) {
          emitTrace({
            tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
            encounterId, actionId, reactionId: reaction.id, effectIndex: i,
            effectKind: 'reputation_tally', effectDetail: { actorId, key: effect.key, delta: effect.delta },
            success: false, failReason: 'actor_node_missing',
            summary: `reputation_tally[${i}] skipped: actor node not found (${actorId})`,
          });
          break;
        }
        const tallies = {
          ...((actorNode.properties?.reputationTallies as Record<string, number> | undefined) ?? {}),
        };
        tallies[effect.key] = (tallies[effect.key] ?? 0) + effect.delta;
        actorNode.properties.reputationTallies = tallies;
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'reputation_tally',
          effectDetail: { actorId, key: effect.key, delta: effect.delta, newTally: tallies[effect.key] },
          success: true,
          summary: `reputation_tally[${i}]: ${actorId} [${effect.key}] ${effect.delta >= 0 ? '+' : ''}${effect.delta}`,
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
        };
        nextRecentEvents = appendRecentEvent(nextRecentEvents, event);
        nextTickEvents = [...nextTickEvents, event];
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'recent_event',
          effectDetail: { eventId: event.id, message: effect.message, significance: event.significance },
          success: true,
          summary: `recent_event[${i}]: "${effect.message.slice(0, 60)}"`,
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
        // Per-effect trace
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'encounter_seed',
          effectDetail: { seedId: seed.seedId, targetAgentId: seed.targetAgentId, seedLabel: effect.seedLabel, eligibleAfterTick: seed.eligibleAfterTick },
          success: true,
          summary: `encounter_seed[${i}]: "${effect.seedLabel}" → ${seed.targetAgentId} eligible at tick ${seed.eligibleAfterTick}`,
        });
        // Specific seed-planted trace for provenance queries
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
        const targetAgentId = actorAgentId ?? '';
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
        // Low-significance chronicle event — hidden from the player's perspective
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
        // Per-effect trace
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'hidden_mark',
          effectDetail: { markId: mark.markId, targetAgentId, category: effect.category, severity: effect.severity, label: effect.label },
          success: true,
          summary: `hidden_mark[${i}]: "${effect.label}" on ${targetAgentId} (${effect.category} sev=${effect.severity})`,
        });
        // Specific mark-placed trace for reveal-chain queries
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
        const agentId = actorAgentId ?? '';
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
        // Medium-significance chronicle event — intelligence is meant to be known to the player
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
        // Per-effect trace
        emitTrace({
          tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
          encounterId, actionId, reactionId: reaction.id, effectIndex: i,
          effectKind: 'intelligence',
          effectDetail: { recordId: record.recordId, agentId, category: effect.category, label: effect.label, reliability: record.reliability },
          success: true,
          summary: `intelligence[${i}]: "${effect.label}" → ${agentId}`,
        });
        // Specific intelligence-granted trace
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
    }
  }

  return {
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
}
