/**
 * Phase Doom — advance the doom clock, resolve authored doom beats, and push
 * world-scale pressure when each chapter lands.
 */

import type { GameState, ProsperityShock, TickEvent } from '../types/gameState';
import type { DoomEscalationEvent, DoomResolvedEvent } from '../types/doomClock';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { DOOM_PRESSURE_PER_TIER } from '../types/sphereAffinity';
import type { HexMutation } from '../types/hexMutation';
import { advanceDoomClock } from './doomClock';
import { evaluateIdentityMilestones } from './doomIdentityMilestones';
import { processEffectEvent, applyEffectEventResult } from './effects/effectEvents';
import { executeEffect } from './effectExecutors';
import { instantiateReward } from './rewardPool';
import { collectAttachmentEffects } from './effects/effectWalker';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';
import { getProsperityTier } from './phaseProsperity';
import {
  DOOM_COUNTER_OMEN_SOFTENING,
  DOOM_MIN_SEVERITY,
} from '../data/game-config';

const SETTLEMENT_SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);
const HEX_TARGET_EXCLUDED_TERRAINS = new Set(['ocean', 'coastal_shallows']);
const PROSPEROUS_TIERS = new Set(['Prosperous', 'Flourishing']);

let eventCounter = 0;
export function resetDoomCounter(): void {
  eventCounter = 0;
}

function nextEventId(tick: number): string {
  return `doom_evt_${tick}_${eventCounter++}`;
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return hash;
}

function shuffled<T extends { id: string }>(items: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const result = [...items].sort((a, b) => a.id.localeCompare(b.id));
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickHexTargets(state: GameState, event: DoomEscalationEvent): Array<{ col: number; row: number }> {
  const targetCount = Math.max(1, Math.round(event.targetCount ?? 1));
  const candidates = state.tiles
    .filter((tile) => !HEX_TARGET_EXCLUDED_TERRAINS.has(tile.terrain))
    .map((tile) => ({ id: `${tile.coord.col},${tile.coord.row}`, col: tile.coord.col, row: tile.coord.row }));
  return shuffled(candidates, state.seed + state.tick * 1543 + hashString(event.id)).slice(0, targetCount);
}

function pickLocationTargets(state: GameState, event: DoomEscalationEvent) {
  const allLocations = state.graph.getNodesByType('location');
  let candidates = allLocations;

  if (event.targetKind === 'settlements' || event.targetKind === 'prosperous_settlements') {
    candidates = allLocations.filter((node) =>
      SETTLEMENT_SUBTYPES.has((node.properties.locationSubtype as string | undefined) ?? ''),
    );
  }

  if (event.targetKind === 'prosperous_settlements') {
    const prosperous = candidates.filter((node) =>
      PROSPEROUS_TIERS.has(getProsperityTier((node.properties.prosperity as number | undefined) ?? 0)),
    );
    candidates = prosperous.length > 0 ? prosperous : candidates;
  }

  if (event.targetKind === 'all_locations') {
    return candidates.sort((a, b) => a.id.localeCompare(b.id));
  }

  const targetCount = Math.max(1, Math.round(event.targetCount ?? 1));
  return shuffled(candidates, state.seed + state.tick * 2081 + hashString(event.id)).slice(0, targetCount);
}

function pickThreadedAgents(state: GameState, event: DoomEscalationEvent) {
  const threadEdges = state.graph.getOutgoingEdges(state.ascendantId, 'thread');
  const candidates = threadEdges
    .map((edge) => state.graph.getNode(edge.target))
    .filter((node): node is NonNullable<typeof node> => node != null)
    .filter((node) => node.type === 'actor' && node.properties.actorType === 'individual');
  const targetCount = Math.max(1, Math.round(event.targetCount ?? 1));
  return shuffled(candidates, state.seed + state.tick * 2713 + hashString(event.id)).slice(0, targetCount);
}

function applyStageEvent(
  state: GameState,
  event: DoomEscalationEvent,
  stage: number,
  severity: number,
  pendingHexMutations: HexMutation[],
  pendingSpherePressures: SpherePressureEvent[],
  prosperityShocks: ProsperityShock[],
): DoomResolvedEvent {
  const magnitude = (event.magnitude ?? 0) * severity;
  let resolvedTargetCount = 0;

  switch (event.effectType) {
    case 'hex_corruption':
    case 'hex_divine_drain': {
      const field = event.effectType === 'hex_corruption' ? 'corruption' : 'divineInfluence';
      const delta = event.effectType === 'hex_corruption' ? magnitude : -magnitude;
      const targets = pickHexTargets(state, event);
      resolvedTargetCount = targets.length;
      for (const target of targets) {
        pendingHexMutations.push({
          col: target.col,
          row: target.row,
          field,
          delta,
          source: event.id,
        });
      }
      break;
    }

    case 'location_unrest': {
      const targets = pickLocationTargets(state, event);
      resolvedTargetCount = targets.length;
      for (const target of targets) {
        const previous = typeof target.properties.unrest === 'number' ? target.properties.unrest : 0;
        target.properties.unrest = Math.max(0, Math.min(100, previous + magnitude));
      }
      break;
    }

    case 'prosperity_shock': {
      const targets = pickLocationTargets(state, event);
      resolvedTargetCount = targets.length;
      for (const target of targets) {
        prosperityShocks.push({
          locationId: target.id,
          delta: magnitude,
          causeType: 'doom_card',
          causeId: event.id,
          description: event.effectSummary ?? event.description,
        });
      }
      break;
    }

    case 'location_pressure': {
      const targets = pickLocationTargets(state, event);
      resolvedTargetCount = targets.length;
      for (const target of targets) {
        pendingSpherePressures.push({
          targetEntityId: target.id,
          sphere: event.sphere ?? 'entropy',
          magnitude,
          source: 'doom',
          sourceId: event.id,
        });
      }
      break;
    }

    case 'agent_pressure': {
      const targets = pickThreadedAgents(state, event);
      resolvedTargetCount = targets.length;
      for (const target of targets) {
        pendingSpherePressures.push({
          targetEntityId: target.id,
          sphere: event.sphere ?? 'spirit',
          magnitude,
          source: 'doom',
          sourceId: event.id,
        });
      }
      break;
    }

    default:
      break;
  }

  emitTrace({
    category: 'doom_card',
    tick: state.tick,
    summary: `${event.title ?? event.description} resolves at severity ${severity.toFixed(2)} across ${resolvedTargetCount} targets.`,
    stage,
    archetype: state.doomDefinition.archetype,
    cardId: event.id,
    cardTitle: event.title ?? event.description,
    severity,
    effectType: event.effectType,
    targetCount: resolvedTargetCount,
  });

  return {
    id: event.id,
    stage,
    title: event.title ?? event.description,
    description: event.description,
    severity,
    resolvedTick: state.tick,
    sphere: event.sphere,
    effectType: event.effectType,
    effectSummary: event.effectSummary,
  };
}

function computeEscalationSeverity(state: GameState): { severity: number; counterOmensSpent: number } {
  const penalty = state.doomClock.nextEscalationSeverityModifier;
  const maxSpend = penalty > 0 ? penalty * 2 : Math.min(1, state.doomClock.counterOmens);
  const counterOmensSpent = Math.min(state.doomClock.counterOmens, maxSpend);
  const severity = Math.max(
    DOOM_MIN_SEVERITY,
    1 + penalty - counterOmensSpent * DOOM_COUNTER_OMEN_SOFTENING,
  );
  return { severity, counterOmensSpent };
}

function fireDoomThresholdEffects(
  state: GameState,
  stage: number,
  runningEffectStates: Map<string, import('../types/effects').EffectRuntimeState>,
): Map<string, import('../types/effects').EffectRuntimeState> {
  let states = runningEffectStates;
  const agents = state.graph.getNodesByType('actor')
    .filter((n) => n.properties.actorType === 'individual' || n.properties.actorType === 'ascendant');

  for (const agent of agents) {
    const agentEffectRng = mulberry32(state.seed + state.tick * 97 + hashString(agent.id));
    const eventResult = processEffectEvent(
      state.graph,
      agent.id,
      { type: 'doom_threshold', stage },
      states,
      state.tick,
      agentEffectRng,
    );
    states = applyEffectEventResult(state.graph, eventResult);

    for (const req of eventResult.transformRequests) {
      instantiateReward(state.graph, req.intoTemplate, agent.id, state.tick);
    }

    for (const fired of eventResult.reactivesFired) {
      const execResult = executeEffect(fired.nestedEffect, {
        casterId: fired.agentId,
        tick: state.tick,
        graph: state.graph,
      });
      for (const mut of execResult.mutations) {
        try {
          if (mut.type === 'add_node' && mut.data) state.graph.addNode(mut.data as import('../types/graph').GraphNode);
          else if (mut.type === 'remove_node' && mut.nodeId) state.graph.removeNode(mut.nodeId);
          else if (mut.type === 'add_edge' && mut.data) state.graph.addEdge(mut.data as import('../types/graph').GraphEdge);
          else if (mut.type === 'remove_edge' && mut.edgeId) state.graph.removeEdge(mut.edgeId);
        } catch { /* fail-soft */ }
      }
      for (const trace of execResult.traces) {
        emitTrace(trace as unknown as TraceEntry);
      }
    }

    for (const trace of eventResult.traces) {
      emitTrace(trace as unknown as TraceEntry);
    }
  }

  return states;
}

export function phaseDoom(state: GameState): Partial<GameState> {
  const oldStage = state.doomClock.currentStage;

  let doomRateMultiplier = 1.0;
  const agents = state.graph.getNodesByType('actor')
    .filter((n) => n.properties.actorType === 'individual' || n.properties.actorType === 'ascendant');
  for (const agent of agents) {
    for (const entry of collectAttachmentEffects(state.graph, agent.id, state.effectStates)) {
      if (entry.runtimeState?.suppressed) continue;
      if (entry.effect.type !== 'modify_rules') continue;
      if (entry.effect.rule !== 'doom_rate_multiplier') continue;
      const val = entry.effect.value;
      if (typeof val === 'number' && val > 0) {
        doomRateMultiplier *= val;
      }
    }
  }

  const clockForAdvance = doomRateMultiplier !== 1.0
    ? { ...state.doomClock, tickModifier: state.doomClock.tickModifier * doomRateMultiplier }
    : state.doomClock;

  const newDoom = advanceDoomClock(clockForAdvance);
  evaluateIdentityMilestones(state, newDoom.progress);
  const newStage = newDoom.currentStage;
  const events: TickEvent[] = [];
  const pressures: SpherePressureEvent[] = [...(state.pendingSpherePressures ?? [])];
  const prosperityShocks: ProsperityShock[] = [...(state.prosperityShocks ?? [])];
  const hexMutations: HexMutation[] = [...(state.pendingHexMutations ?? [])];
  const resolvedEvents: DoomResolvedEvent[] = [...(state.doomClock.resolvedEvents ?? [])];
  let runningEffectStates = new Map(state.effectStates ?? new Map());

  if (newStage > oldStage) {
    const { severity, counterOmensSpent } = computeEscalationSeverity(state);

    for (let stage = oldStage + 1; stage <= newStage; stage++) {
      const stageDef = state.doomDefinition.stages[stage - 1];
      const stageName = stageDef?.name ?? `Stage ${stage}`;
      const stageCards = stageDef?.events ?? [];

      events.push({
        id: nextEventId(state.tick),
        tick: state.tick,
        type: 'doom_escalation',
        message: `The ${state.doomDefinition.archetype} intensifies — ${stageName}`,
        significance: 0.9,
        notification: {
          channel: 'popup',
          popup: {
            title: stageName,
            body: stageCards.length > 0
              ? stageCards.map((card) => card.title ?? card.description).join(' • ')
              : `The ${state.doomDefinition.archetype} intensifies — ${stageName}`,
          },
        },
      });

      const locationNodes = state.graph.getNodesByType('location');
      for (const locNode of locationNodes) {
        pressures.push({
          targetEntityId: locNode.id,
          sphere: 'entropy',
          magnitude: DOOM_PRESSURE_PER_TIER,
          source: 'doom',
          sourceId: `doom-tier-${stage}`,
        });
      }

      for (const stageEvent of stageCards) {
        resolvedEvents.push(
          applyStageEvent(
            state,
            stageEvent,
            stage,
            severity,
            hexMutations,
            pressures,
            prosperityShocks,
          ),
        );
      }

      runningEffectStates = fireDoomThresholdEffects(state, stage, runningEffectStates);
    }

    return {
      doomClock: {
        ...newDoom,
        nextEscalationSeverityModifier: 0,
        counterOmens: Math.max(0, state.doomClock.counterOmens - counterOmensSpent),
        resolvedEvents,
      },
      tickEvents: [...state.tickEvents, ...events],
      pendingSpherePressures: pressures,
      prosperityShocks,
      pendingHexMutations: hexMutations,
      effectStates: runningEffectStates,
    };
  }

  return {
    doomClock: {
      ...newDoom,
      resolvedEvents,
    },
    tickEvents: [...state.tickEvents, ...events],
    pendingSpherePressures: pressures,
    prosperityShocks,
    pendingHexMutations: hexMutations,
  };
}
