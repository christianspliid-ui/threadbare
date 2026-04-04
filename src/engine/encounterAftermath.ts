import type { GameState, TickEvent } from '../types/gameState';
import { MAX_RECENT_EVENTS } from '../types/gameState';
import { DEFAULT_REPUTATION } from '../types/disposition';
import type { EncounterAftermathReaction, HiddenMark, IntelligenceRecord, PendingEncounterSeed, UnifiedAction } from '../types/unifiedAction';

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

  for (let i = 0; i < reaction.effects.length; i++) {
    const effect = reaction.effects[i];
    switch (effect.kind) {
      case 'reputation_score': {
        const actorId = effect.actorId ?? action?.actorId;
        if (!actorId) break;
        const actorNode = state.graph.getNode(actorId);
        if (!actorNode) break;
        const current = (actorNode.properties?.reputationScore as number | undefined) ?? DEFAULT_REPUTATION;
        actorNode.properties.reputationScore = clamp01(current + effect.delta);
        break;
      }

      case 'reputation_tally': {
        const actorId = effect.actorId ?? action?.actorId;
        if (!actorId) break;
        const actorNode = state.graph.getNode(actorId);
        if (!actorNode) break;
        const tallies = {
          ...((actorNode.properties?.reputationTallies as Record<string, number> | undefined) ?? {}),
        };
        tallies[effect.key] = (tallies[effect.key] ?? 0) + effect.delta;
        actorNode.properties.reputationTallies = tallies;
        break;
      }

      case 'clearance_gate_tag': {
        const runtimeId = effect.runtimeId ?? action?.clearanceGateIds?.[0];
        if (!runtimeId || !nextClearanceGateStates) break;
        const gate = nextClearanceGateStates.get(runtimeId);
        if (!gate) break;
        nextClearanceGateStates.set(runtimeId, {
          ...gate,
          followOnTags: [...new Set([...gate.followOnTags, effect.tag])],
        });
        touchedClearanceGateStates = true;
        break;
      }

      case 'recent_event': {
        const event: TickEvent = {
          id: `enc_after_${reaction.id}_${tick}_${nextRecentEvents.length}`,
          tick,
          type: effect.eventType ?? 'ripple_consequence',
          message: effect.message,
          significance: effect.significance ?? 0.55,
          actorId: action?.actorId,
        };
        nextRecentEvents = appendRecentEvent(nextRecentEvents, event);
        nextTickEvents = [...nextTickEvents, event];
        break;
      }

      case 'encounter_seed': {
        const seed: PendingEncounterSeed = {
          seedId: `seed_${action?.actionId ?? 'unknown'}_${reaction.id}_${i}`,
          sourceEncounterId: action?.templateId ?? 'unknown',
          sourceReactionId: reaction.id,
          encounterFamily: effect.encounterFamily,
          templateId: effect.templateId,
          targetAgentId: effect.targetAgentId ?? action?.actorId ?? '',
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
        break;
      }

      case 'hidden_mark': {
        const targetAgentId = action?.actorId ?? '';
        const mark: HiddenMark = {
          markId: `mark_${action?.actionId ?? 'unknown'}_${reaction.id}_${i}`,
          category: effect.category,
          severity: effect.severity,
          label: effect.label,
          sourceEncounterId: action?.templateId ?? 'unknown',
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
        break;
      }

      case 'intelligence': {
        const agentId = action?.actorId ?? '';
        const record: IntelligenceRecord = {
          recordId: `intel_${action?.actionId ?? 'unknown'}_${reaction.id}_${i}`,
          category: effect.category,
          label: effect.label,
          detail: effect.detail,
          targetRegion: effect.targetRegion,
          targetEntityId: effect.targetEntityId,
          sourceEncounterId: action?.templateId ?? 'unknown',
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
