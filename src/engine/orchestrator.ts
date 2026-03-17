// src/engine/orchestrator.ts

/**
 * Game Loop Orchestrator — runs one tick of the simulation.
 *
 * Each tick phase is a pure function: takes GameState pieces in,
 * returns partial updates out. The orchestrator merges updates.
 */
import type { GameState, TickEvent } from '../types/gameState';
import type { WorldGraph } from './graph';
import { STEALTH_DECAY_PER_TICK } from '../types/gameState';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import { advanceDoomClock } from './doomClock';
import {
  computeEssenceGeneration,
  generateEssence,
  computeMaxEssence,
} from './influence';
import { evaluateMandate, advanceMandateStage } from './mandate';
import { recalcVisibility, collectLOSSources } from './visibility';
import { RIVAL_ACTION_TEMPLATES } from '../data/rival-content';
import {
  computeStakes,
  resolveDilemma,
  applyDilemmaEffects,
  logInteraction,
  decayReputation,
} from './disposition';
import {
  DILEMMA_STAKES_THRESHOLD,
  DEFAULT_REPUTATION,
} from '../types/disposition';
import { buildNarrativeContext } from './contextBuilder';
import type { NarrativeEvent, NarrativeEventType } from '../types/narrative';
import { generateRoutineProse, generateNotableProse } from './narrative';
import {
  DILEMMA_STAKES_PROSE,
  DILEMMA_ADJ_POOL,
  DILEMMA_NOUN_POOL,
  DILEMMA_VERB_POOL,
} from '../data/narrative-content';
import { phaseAgentLifecycle } from './agentLifecycle';
import { emitTrace } from './traceBuffer';
import {
  getAvailableEncounters,
  initiateEncounter,
  resolveEncounter,
  advanceEncounter,
} from './encounter';
import { getAvatarHexPosition } from './visibility';
import { generateEncounterCandidates } from './encounterCandidates';
import { runSelectionPipeline } from './agentSelection';
import { getEncounterById } from '../data/encounter-content';
import { getFamiliarity, addFamiliarity, checkThresholdCrossed } from './familiarity';
import { FAMILIARITY_GAINS } from '../types/familiarity';
import type { DivineInfluenceEntry } from '../types/dream';
import { getCurrentStrength } from './decayCurve';
import { createAction, progressAction, isActionComplete, completeAction, isAgentIdle } from './actionLifecycle';
import { getActionTemplateById, ACTION_TEMPLATES } from '../data/action-template-content';
import { executeGraphOps } from './graphOpExecutor';
import { generateActionCandidates } from './actionCandidates';
import { checkDissolutions } from './sublocation';
import { phaseMovement } from './phaseMovement';
import { phaseColocationDetection } from './phaseColocationDetection';
import { phaseUnifiedActionProgress } from './unifiedActionResolution';
import { phaseIdleSelection } from './unifiedActionPhases';
import { UNIFIED_ACTION_TEMPLATES } from '../data/unified-action-templates';
import { phaseAmbitionProgress } from './ambitionTick';
import { phaseProsperity } from './phaseProsperity';
import { checkTierPromotion } from './influence';
import { phaseTradeRouteDecay } from './phaseTradeRouteDecay';
import { phaseSublocations } from './phaseSublocations';

// ─── Seeded PRNG ──────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── ID Generator ─────────────────────────────────────────────────

let eventCounter = 0;
function nextEventId(): string {
  return `evt_${++eventCounter}`;
}

// Reset for testing
export function resetEventCounter(): void {
  eventCounter = 0;
}

// ─── Phase 1: Advance Doom Clock ──────────────────────────────────

export function phaseDoom(state: GameState): Partial<GameState> {
  const oldStage = state.doomClock.currentStage;
  const newDoom = advanceDoomClock(state.doomClock);
  const newStage = newDoom.currentStage;
  const events: TickEvent[] = [];

  if (newStage > oldStage) {
    const stageName = state.doomDefinition.stages[newStage - 1]?.name ?? `Stage ${newStage}`;
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'doom_escalation',
      message: `The ${state.doomDefinition.archetype} intensifies — ${stageName}`,
      significance: 0.9,
      notification: {
        channel: 'popup',
        popup: {
          title: stageName,
          body: `The ${state.doomDefinition.archetype} intensifies — ${stageName}`,
        },
      },
    });
  }

  return { doomClock: newDoom, tickEvents: [...state.tickEvents, ...events] };
}

// ─── Phase 2: Agent Actions ────────────────────────────────────

/** Chance per tick that an agent considers an encounter */
const ENCOUNTER_ATTEMPT_CHANCE = 0.20;

/** Chance of a non-encounter routine action */
const ROUTINE_ACTION_CHANCE = 0.10;

/** Chance of starting a CRUD action when not encountering */
const CRUD_ACTION_CHANCE = 0.35;

/** Notable action interval — every N ticks, force one high-significance event */
const NOTABLE_ACTION_INTERVAL = 5;

function getActorHexCoords(graph: WorldGraph, actorId: string): { col: number; row: number } | undefined {
  const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
  if (locEdges.length === 0) return undefined;
  const locNode = graph.getNode(locEdges[0].target);
  if (!locNode?.properties?.hexCol) return undefined;
  return { col: locNode.properties.hexCol as number, row: locNode.properties.hexRow as number };
}

/** @deprecated Replaced by phaseIdleSelection + phaseUnifiedActionProgress. No longer called in the tick pipeline. */
export function phaseAgentActions(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 31);
  const events: TickEvent[] = [];
  const newActions = [...(state.actionsInProgress ?? [])];

  const actors = state.graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual'
  );

  for (const actor of actors) {
    // Skip if already in an active encounter or action
    if (state.encounterProgress.some(p => p.actorId === actor.id && p.status === 'active')) continue;
    if (!isAgentIdle(state.actionsInProgress ?? [], actor.id)) continue;

    // Encounter attempt
    if (rng() < ENCOUNTER_ATTEMPT_CHANCE) {
      // Find actor's location
      const locEdges = state.graph.getOutgoingEdges(actor.id, 'located_at');
      if (locEdges.length === 0) continue;
      const locationId = locEdges[0].target;

      // Generate candidates from available encounters
      const candidates = generateEncounterCandidates(state.graph, actor.id, locationId);

      if (candidates.length > 0) {
        try {
          const result = runSelectionPipeline(
            state.graph,
            actor.id,
            candidates,
            { topN: 5, survivalThreshold: 0.8 },
            state.tick,
            rng(),
          );

          // Initiate the selected encounter
          const template = getEncounterById(result.selected.templateId);
          if (template) {
            initiateEncounter(state, actor.id, template.id, state.tick);

            const locationNode = state.graph.getNode(locationId);
            const locationName = locationNode?.name ?? 'the realm';
            events.push({
              id: nextEventId(),
              tick: state.tick,
              type: 'agent_action_resolved',
              message: `${actor.name} begins ${template.name} at ${locationName}.`,
              sphere: template.sphereAffinity ?? (SPHERE_NAMES[Math.floor(rng() * SPHERE_NAMES.length)] as SphereName),
              significance: 0.7,
              hexCoords: getActorHexCoords(state.graph, actor.id),
            });
          }
        } catch {
          // Selection pipeline can fail if no valid profile — fall through to routine action
        }
      }
    }

    // CRUD action attempt (non-encounter, creates ActionInProgress)
    else if (rng() < CRUD_ACTION_CHANCE) {
      const locEdges = state.graph.getOutgoingEdges(actor.id, 'located_at');
      if (locEdges.length > 0) {
        const locationId = locEdges[0].target;
        const actionCandidates = generateActionCandidates(state.graph, actor.id, locationId);

        if (actionCandidates.length > 0) {
          try {
            // Pick a candidate — use selection pipeline if agent has profile, else random
            let selectedCandidate = actionCandidates[Math.floor(rng() * actionCandidates.length)];

            try {
              const result = runSelectionPipeline(
                state.graph,
                actor.id,
                actionCandidates,
                { topN: 5, survivalThreshold: 0.8 },
                state.tick,
                rng(),
              );
              selectedCandidate = result.selected;
            } catch {
              // Selection pipeline can fail if no valid profile — use random fallback
            }

            const template = getActionTemplateById(selectedCandidate.templateId);
            if (template) {
              // Compute duration from template range
              const durRange = template.durationRange;
              const duration = durRange.min + Math.floor(rng() * (durRange.max - durRange.min + 1));

              // NOTE: createAction mutates the graph (adds performing edge).
              // In React StrictMode dev builds, runTick executes twice per tick,
              // causing duplicate edges. This is benign — production builds run once.
              // Future: make graph immutable via copy-on-write if this becomes an issue.
              const action = createAction(state.graph, {
                actorId: actor.id,
                templateId: template.id,
                targetId: selectedCandidate.targetId,
                domain: template.reach,
                duration,
                tick: state.tick,
              });

              newActions.push(action);

              const locationNode = state.graph.getNode(locationId);
              const locationName = locationNode?.name ?? 'the realm';

              // Emit trace for action start (inspectability)
              emitTrace({
                id: 0,
                category: 'action_execution',
                tick: state.tick,
                timestamp: Date.now(),
                summary: `${actor.name} begins ${template.name}`,
                agentId: actor.id,
                templateId: template.id,
                actorId: actor.id,
                outcome: 'started',
                opsApplied: 0,
                opsFailed: 0,
                duration: duration,
              });

              events.push({
                id: nextEventId(),
                tick: state.tick,
                type: 'agent_action_resolved',
                message: `${actor.name} begins ${template.name} at ${locationName}.`,
                sphere: (SPHERE_NAMES.includes(template.reach as any) ? template.reach : SPHERE_NAMES[Math.floor(rng() * SPHERE_NAMES.length)]) as SphereName,
                significance: 0.5,
                hexCoords: getActorHexCoords(state.graph, actor.id),
              });
            }
          } catch {
            // Fail-soft: template node may not exist in graph yet — skip CRUD action
          }
        }
      }
    }

    // Routine action (non-encounter flavor text)
    else if (rng() < ROUTINE_ACTION_CHANCE) {
      const spheres: SphereName[] = [...SPHERE_NAMES];
      const sphere = spheres[Math.floor(rng() * spheres.length)];
      const significance = 0.3 + rng() * 0.4;

      const prose = generateRoutineProse('action_resolved', {
        actorName: actor.name,
        actorId: actor.id,
        sphere,
        locationName: 'the realm',
      }, state.seed + state.tick * 100 + actors.indexOf(actor), state.graph);

      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'agent_action_resolved',
        message: prose.text,
        sphere,
        significance,
        hexCoords: getActorHexCoords(state.graph, actor.id),
      });

      // Sphere influence
      const locEdges = state.graph.getOutgoingEdges(actor.id, 'located_at');
      if (locEdges.length > 0) {
        const locNode = state.graph.getNode(locEdges[0].target);
        if (locNode?.properties?.sphereInfluence) {
          const inf = locNode.properties.sphereInfluence as Record<string, number>;
          inf[sphere] = (inf[sphere] ?? 0) + 0.02;
        }
      }
    }
  }

  // Keep notable action interval
  if (actors.length > 0 && state.tick % NOTABLE_ACTION_INTERVAL === 0) {
    const notableActor = actors[Math.floor(rng() * actors.length)];
    const spheres: SphereName[] = [...SPHERE_NAMES];
    const sphere = spheres[Math.floor(rng() * spheres.length)];

    const prose = generateNotableProse('action_critical', {
      actorName: notableActor.name,
      actorId: notableActor.id,
      sphere,
      locationName: 'the realm',
    }, state.seed + state.tick * 200, state.graph);

    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'agent_action_resolved',
      message: prose.text,
      sphere,
      significance: 0.85,
      hexCoords: getActorHexCoords(state.graph, notableActor.id),
    });
  }

  return { tickEvents: [...state.tickEvents, ...events], actionsInProgress: newActions };
}

// ─── Phase 2.25: Encounter Progression ────────────────────────────────────

/** @deprecated Replaced by phaseUnifiedActionProgress. No longer called in the tick pipeline. */
export function phaseEncounterProgression(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 43);
  const events: TickEvent[] = [];

  // 1. Progress active encounters
  const activeEncounters = state.encounterProgress.filter(p => p.status === 'active');
  for (const progress of activeEncounters) {
    // Resolve current step
    const result = resolveEncounter(state, progress);
    // Advance encounter (mutates progress)
    advanceEncounter(state, progress, result.success, state.tick);

    // Generate event based on outcome
    const eventType = result.success ? 'encounter_step_success' : 'encounter_step_failure';
    if (progress.status === 'completed') {
      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'encounter_completed',
        message: `An agent has completed their encounter.`,
        significance: 0.8,
      });
    } else if (progress.status === 'abandoned') {
      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'encounter_step_failure',
        message: `An agent failed their encounter step.`,
        significance: 0.5,
      });
    } else {
      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: eventType,
        message: `An agent ${result.success ? 'succeeded' : 'struggled'} in their encounter.`,
        significance: 0.6,
      });
    }
  }

  // 2. Initiate new encounters for eligible agents (small chance per tick)
  const actors = state.graph.getNodesByType('actor').filter(n => n.properties.actorType === 'individual');
  for (const actor of actors) {
    // Skip if already has active encounter
    if (state.encounterProgress.some(p => p.actorId === actor.id && p.status === 'active')) continue;

    // 3% chance per tick to initiate
    if (rng() < 0.03) {
      const available = getAvailableEncounters(state, actor.id);
      if (available.length > 0) {
        const encounter = available[Math.floor(rng() * available.length)];
        initiateEncounter(state, actor.id, encounter.id, state.tick);
        events.push({
          id: nextEventId(),
          tick: state.tick,
          type: 'encounter_step_success',
          message: `${actor.name} begins a new encounter: ${encounter.name}.`,
          significance: 0.7,
        });
      }
    }
  }

  return {
    tickEvents: [...state.tickEvents, ...events],
    encounterProgress: [...state.encounterProgress],
  };
}

// ─── Phase 2.3: Action Progress ────────────────────────────────────────

/** @deprecated Replaced by phaseUnifiedActionProgress. No longer called in the tick pipeline. */
export function phaseActionProgress(state: GameState): Partial<GameState> {
  const events: TickEvent[] = [];
  const rng = mulberry32(state.seed + state.tick * 47);

  // Progress and resolve active actions
  const updatedActions = state.actionsInProgress.map((action) => {
    // Skip already resolved actions
    if (action.resolved) return action;

    // Increment progress
    let updated = progressAction(action);

    // Check if completed
    if (isActionComplete(updated)) {
      // Resolve the action
      const template = getActionTemplateById(updated.templateId);
      const isSuccess = rng() < (1 - (template?.difficulty ?? 0.5));
      const outcome = isSuccess ? 'success' : 'failure';

      // Apply GraphOps
      if (template) {
        const ops = isSuccess ? template.onSuccess : template.onFailure;
        const ctx = {
          actorId: updated.actorId,
          targetId: updated.targetId,
          locationId: updated.targetId,
        };

        try {
          executeGraphOps(state.graph, ops, ctx);
        } catch {
          // Silently fail graph ops for now
        }
      }

      // Mark as resolved
      updated = completeAction(state.graph, updated, outcome);

      // Emit trace
      emitTrace({
        id: 0,
        category: 'action_execution',
        tick: state.tick,
        timestamp: Date.now(),
        summary: `${updated.templateId} resolved`,
        agentId: updated.actorId,
        templateId: updated.templateId,
        actorId: updated.actorId,
        outcome,
        opsApplied: isSuccess ? (template?.onSuccess.length ?? 0) : 0,
        opsFailed: isSuccess ? 0 : (template?.onFailure.length ?? 0),
        duration: updated.duration,
      });

      // Emit event
      const actorNode = state.graph.getNode(updated.actorId);
      const templateNode = state.graph.getNode(updated.templateId);
      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'agent_action_resolved',
        message: `${actorNode?.name ?? 'An agent'} ${isSuccess ? 'completed' : 'failed'} ${templateNode?.name ?? 'an action'}.`,
        sphere: SPHERE_NAMES[Math.floor(rng() * SPHERE_NAMES.length)] as SphereName,
        significance: isSuccess ? 0.6 : 0.4,
        hexCoords: getActorHexCoords(state.graph, updated.actorId),
      });
    }

    return updated;
  });

  return {
    actionsInProgress: updatedActions,
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 2.5: Dilemma Detection ──────────────────────────────────────

/** Map Creation Sphere to Reach Domain for dilemma stakes computation */
const SPHERE_TO_DOMAIN = {
  force: 'iron',
  matter: 'gold',
  energy: 'veil',
  life: 'flesh',
  mind: 'shadow',
  spirit: 'heart',
  time: 'star',
  entropy: 'shadow',
} as const;

export function phaseDilemmaDetection(state: GameState): Partial<GameState> {
  const events: TickEvent[] = [];
  const graph = state.graph;

  // Scan tick events for agent_action_resolved events
  const resolvedEvents = state.tickEvents.filter(e => e.type === 'agent_action_resolved');

  for (const event of resolvedEvents) {
    // Get all individual actors from the graph
    const allActors = graph.getNodesByType('actor')
      .filter(node => node.properties?.actorType === 'individual');

    if (allActors.length < 2) continue;

    // Find the actor whose name matches the event message
    const rng = mulberry32(state.seed + state.tick * 41 + resolvedEvents.indexOf(event));
    const actor = allActors.find(a => event.message.includes(a.name)) ?? allActors[Math.floor(rng() * allActors.length)];

    // Pick a different actor as target
    const otherActors = allActors.filter(a => a.id !== actor.id);
    if (otherActors.length === 0) continue;
    const targetActor = otherActors[Math.floor(rng() * otherActors.length)];

    // Get cooperation strategies
    const actorStrategy = (actor.properties?.cooperationStrategy ?? 'tit-for-tat') as any;
    const targetStrategy = (targetActor.properties?.cooperationStrategy ?? 'tit-for-tat') as any;

    // Look up relationship edge
    let relationshipEdge = graph.getOutgoingEdges(actor.id, 'relates_to')
      .find(e => e.target === targetActor.id);

    if (!relationshipEdge) {
      relationshipEdge = graph.getIncomingEdges(actor.id, 'relates_to')
        .find(e => e.source === targetActor.id);
    }

    // Get interaction history from edge
    const actorHistory = relationshipEdge?.properties?.interactionLog ?? [];
    const targetHistory = relationshipEdge?.properties?.interactionLog ?? [];

    // Map sphere to reach domain for stakes computation
    const sphere = event.sphere ?? 'force';
    const domain = SPHERE_TO_DOMAIN[sphere as keyof typeof SPHERE_TO_DOMAIN] ?? 'stone';
    const sentiment = relationshipEdge?.properties?.sentiment ?? 0;
    const isFactionLeader = actor.properties?.isFactionLeader === true || targetActor.properties?.isFactionLeader === true;
    const isTerritory = false; // Simplified

    const stakes = computeStakes(domain, sentiment, isFactionLeader, isTerritory);

    // Only resolve as dilemma if stakes >= threshold
    if (stakes < DILEMMA_STAKES_THRESHOLD) continue;

    // Resolve the dilemma
    const dilemma = resolveDilemma(
      actor.id,
      targetActor.id,
      actorStrategy,
      targetStrategy,
      actorHistory,
      targetHistory,
      state.tick,
      event.sphere ?? 'iron',
      stakes,
    );

    // Apply effects to graph
    const effects = applyDilemmaEffects(dilemma.outcome);

    // Update relationship edge (sentiment and strength)
    if (relationshipEdge) {
      const newSentiment = Math.max(-1, Math.min(1, (relationshipEdge.properties?.sentiment ?? 0) + effects.sentimentDelta));
      const newStrength = Math.max(0, (relationshipEdge.properties?.strength ?? 0.5) + effects.strengthDelta);
      relationshipEdge.properties.sentiment = newSentiment;
      relationshipEdge.properties.strength = newStrength;

      // Log the interaction
      const newLog = logInteraction(
        relationshipEdge.properties?.interactionLog ?? [],
        state.tick,
        dilemma.actorMove,
        dilemma.targetMove,
        dilemma.context,
        stakes,
      );
      relationshipEdge.properties.interactionLog = newLog;
    }

    // Update actor reputations
    const actorNode = graph.getNode(actor.id);
    if (actorNode) {
      const newRep = Math.max(0, Math.min(1, (actorNode.properties?.reputationScore ?? DEFAULT_REPUTATION) + effects.actorRepDelta));
      actorNode.properties.reputationScore = newRep;
    }

    const targetNode = graph.getNode(targetActor.id);
    if (targetNode) {
      const newRep = Math.max(0, Math.min(1, (targetNode.properties?.reputationScore ?? DEFAULT_REPUTATION) + effects.targetRepDelta));
      targetNode.properties.reputationScore = newRep;
    }

    // Generate varied dilemma message using prose templates
    const stakesLevel = stakes > 0.6 ? 'high' : stakes > 0.3 ? 'medium' : 'low';
    const templateKey = `${dilemma.outcome}.${stakesLevel}`;
    const proseOptions = DILEMMA_STAKES_PROSE[templateKey];
    const template = Array.isArray(proseOptions)
      ? proseOptions[Math.floor(rng() * proseOptions.length)]
      : proseOptions;

    let message = template || `${actor.name} and ${targetActor.name}: ${dilemma.outcome.replace(/_/g, ' ')}`;

    if (template) {
      // Use word pools from narrative-content package
      const adjPool = DILEMMA_ADJ_POOL;
      const nounPool = DILEMMA_NOUN_POOL;
      const verbPool = DILEMMA_VERB_POOL;

      const adjIndex = Math.floor(rng() * adjPool.length);
      const nounIndex = Math.floor(rng() * nounPool.length);
      const verbIndex = Math.floor(rng() * verbPool.length);

      message = template
        .replace(/{actor}/g, actor.name)
        .replace(/{target}/g, targetActor.name)
        .replace(/{adj}/g, adjPool[adjIndex])
        .replace(/{noun}/g, nounPool[nounIndex])
        .replace(/{verb}/g, verbPool[verbIndex]);
    }

    // Emit dilemma_resolved event
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'dilemma_resolved',
      message,
      sphere: event.sphere,
      significance: Math.max(0.3, stakes),
    });
  }

  return { tickEvents: [...state.tickEvents, ...events] };
}

// ─── Phase 2.75: Familiarity Gain (Proximity) ────────────────────────

export function phaseFamiliarityGain(state: GameState): Partial<GameState> {
  // Get avatar's hex position
  const avatarHex = getAvatarHexPosition(state.graph, state.ascendantId);
  if (!avatarHex) return { familiarityMap: state.familiarityMap };

  let map = state.familiarityMap;

  // Find all agents in the avatar's hex
  const actors = state.graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual');

  for (const actor of actors) {
    // Get actor's location via locationId property
    const locationId = actor.properties?.locationId as string | undefined;
    if (!locationId) continue;

    const location = state.graph.getNode(locationId);
    if (!location || location.type !== 'location') continue;

    const actorHexCol = location.properties?.hexCol as number | undefined;
    const actorHexRow = location.properties?.hexRow as number | undefined;

    // Check if actor is in the same hex as avatar
    if (actorHexCol === avatarHex.col && actorHexRow === avatarHex.row) {
      const oldFamiliarity = getFamiliarity(map, actor.id);
      const newMap = addFamiliarity(map, actor.id, FAMILIARITY_GAINS.proximity);
      const newFamiliarity = getFamiliarity(newMap, actor.id);
      const levelChanged = checkThresholdCrossed(oldFamiliarity, newFamiliarity);

      // Emit trace for this familiarity gain
      const gain = FAMILIARITY_GAINS.proximity;
      emitTrace({
        tick: state.tick,
        category: 'familiarity_change',
        agentId: actor.id,
        summary: `${actor.name} familiarity: ${oldFamiliarity.toFixed(2)} → ${newFamiliarity.toFixed(2)}`,
        actorId: actor.id,
        actorName: actor.name,
        source: 'proximity',
        oldFamiliarity,
        newFamiliarity,
        levelChanged: levelChanged !== null,
        newLevel: levelChanged ?? undefined,
        amount: gain,
        multiplier: 1.0,
      });

      map = newMap;
    }
  }

  return { familiarityMap: map };
}

// ─── Phase 3: Rival Actions (simplified for vertical slice) ───────

export function phaseRivalActions(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 37);
  const events: TickEvent[] = [];
  const newRivalStates = [...state.rivalStates];

  for (let i = 0; i < state.rivalDefinitions.length; i++) {
    const rival = state.rivalDefinitions[i];
    const rivalState = newRivalStates[i];

    // Rivals act every ~10 ticks
    const ticksSince = (rivalState.ticksSinceAction ?? 0) + 1;
    newRivalStates[i] = { ...rivalState, ticksSinceAction: ticksSince };

    if (ticksSince >= 8 + Math.floor(rng() * 5)) {
      newRivalStates[i] = {
        ...newRivalStates[i],
        ticksSinceAction: 0,
        interventionCount: rivalState.interventionCount + 1,
      };

      // Map behavior to action type, then pick a template variant
      let actionType: 'recruit' | 'intervene' | 'expand' | 'attack' | 'wait';
      if (rival.behavior === 'aggressive') {
        actionType = 'attack';
      } else if (rival.behavior === 'subtle') {
        actionType = 'intervene';
      } else if (rival.behavior === 'territorial') {
        actionType = 'expand';
      } else {
        actionType = 'expand';
      }

      const templates = RIVAL_ACTION_TEMPLATES[actionType] ?? ['{rival} acts against you'];
      const templateIdx = Math.floor(rng() * templates.length);
      const template = templates[templateIdx];
      const actionDesc = template.replace(/{rival}/g, rival.name);

      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'rival_action',
        message: actionDesc,
        significance: 0.7,
        notification: { channel: 'toast' },
      });
    }
  }

  return {
    rivalStates: newRivalStates,
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 4: Stealth Decay ───────────────────────────────────────

export function phaseStealth(state: GameState): Partial<GameState> {
  const newExposure = Math.max(0, state.stealthExposure - STEALTH_DECAY_PER_TICK);
  return { stealthExposure: newExposure };
}

// ─── Phase 5: Narrative (assign tier, generate prose) ─────────────

export function phaseNarrative(state: GameState): Partial<GameState> {
  const newChronicleEntries = [...state.chronicleEntries];

  for (const event of state.tickEvents) {
    if (event.significance >= 0.8) {
      // Build narrative context for notable/chronicle events
      const narrativeEvent: NarrativeEvent = {
        id: event.id,
        tier: event.significance >= 0.9 ? 'chronicle' : 'notable',
        eventType: tickEventTypeToNarrativeType(event.type),
        description: event.message,
        tick: event.tick,
        sphere: event.sphere,
        // TODO: extract actorId from event once TickEvent carries it
      };

      const context = buildNarrativeContext(narrativeEvent, state.graph);

      newChronicleEntries.push({
        id: event.id,
        tier: 'chronicle',
        title: event.message.slice(0, 50),
        prose: event.message,
        promptContext: {
          actors: context.contextObjects
            .filter(co => co.category === 'character')
            .map(co => co.name),
          location: context.contextObjects
            .find(co => co.category === 'location')?.name ?? '',
          sphere: event.sphere ?? 'force',
          mood: context.oppositionSummary.dominantTension ?? 'dramatic',
          previousEvents: context.historicalFragments,
        },
        tick: event.tick,
      });
    }
  }

  return { chronicleEntries: newChronicleEntries };
}

/** Map TickEvent.type to NarrativeEventType */
function tickEventTypeToNarrativeType(type: string): NarrativeEventType {
  const mapping: Record<string, NarrativeEventType> = {
    agent_action: 'action_resolved',
    agent_action_resolved: 'action_resolved',
    doom_escalation: 'doom_escalation',
    rival_action: 'contested_action',
    mandate_progress: 'mandate_stage',
    narrative: 'action_resolved',
    dilemma_resolved: 'contested_action',
  };
  return mapping[type] ?? 'action_resolved';
}

// ─── Phase 6: Essence Generation ──────────────────────────────────

export function phaseEssence(state: GameState): Partial<GameState> {
  const ascNode = state.graph.getNode(state.ascendantId);
  if (!ascNode) return {};

  const pool = { ...state.essencePool };
  const max = computeMaxEssence(state.graph, state.ascendantId);
  const gen = computeEssenceGeneration(state.graph, state.ascendantId);
  generateEssence(pool, gen, max);

  const events: TickEvent[] = [];
  const totalGen = SPHERE_NAMES.reduce((s, sp) => s + gen[sp], 0);
  if (state.tick % 10 === 0 && totalGen > 0) {
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'essence_gain',
      message: `+${totalGen.toFixed(1)} essence flows from the cosmos`,
      significance: 0.1,
    });
  }

  return {
    essencePool: pool,
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 6.5: Reputation Decay ──────────────────────────────────────

export function phaseReputationDecay(state: GameState): Partial<GameState> {
  const graph = state.graph;

  // Iterate all individual actors
  const actors = graph.getNodesByType('actor')
    .filter(node => node.properties?.actorType === 'individual');

  for (const actor of actors) {
    const currentRep = actor.properties?.reputationScore ?? DEFAULT_REPUTATION;
    const decayedRep = decayReputation(currentRep);
    actor.properties.reputationScore = decayedRep;
  }

  return {};
}

// ─── Phase 6.6: Divine Influence Decay ────────────────────────────

export function phaseDivineInfluenceDecay(state: GameState): Partial<GameState> {
  const graph = state.graph;

  // Iterate all individual actors
  const actors = graph.getNodesByType('actor')
    .filter(node => node.properties?.actorType === 'individual');

  for (const actor of actors) {
    const influences = (actor.properties?.divineInfluences ?? []) as DivineInfluenceEntry[];

    if (influences.length === 0) continue;

    // Filter out expired influences based on decay curve
    const updated: DivineInfluenceEntry[] = [];

    for (const influence of influences) {
      const strength = getCurrentStrength(influence, state.tick);

      // Emit trace for expired influences
      if (strength <= 0) {
        emitTrace({
          category: 'intervention_effect',
          tick: state.tick,
          agentId: actor.id,
          summary: `Divine influence expired: ${influence.interventionType} (${influence.sphere})`,
          interventionType: influence.interventionType,
          targetAgentId: actor.id,
          targetAgentName: actor.name,
          sphere: influence.sphere,
          effects: ['expired'],
          consequenceMessage: `The ${influence.sphere} influence from ${influence.interventionType} fades.`,
          initialStrength: influence.initialStrength,
          maxDuration: influence.maxDuration,
        });
      } else {
        // Keep influence if still active
        updated.push(influence);
      }
    }

    // Update actor's divine influences array
    actor.properties.divineInfluences = updated;
  }

  return {};
}

// ─── Phase 6.64: Influence Tier Promotion ─────────────────────────

export function phaseInfluenceTierPromotion(
  state: GameState,
): Partial<GameState> {
  const promoted = checkTierPromotion(state.graph, state.ascendantId);
  if (promoted.length === 0) return {};

  // Look up ascendant's primary sphere for event coloring
  const ascendantNode = state.graph.getNode(state.ascendantId);
  const primarySphere = (ascendantNode?.properties?.sphereAlignment?.primary ?? undefined) as SphereName | undefined;

  const events: TickEvent[] = promoted.map(agentId => {
    const agentNode = state.graph.getNode(agentId);
    const agentName = agentNode?.name ?? agentId;
    return {
      id: nextEventId(),
      tick: state.tick,
      type: 'backstory_unlock' as const,
      message: `${agentName}'s story deepens`,
      significance: 0.6,
      sphere: primarySphere,
      actorId: agentId,
      notification: {
        channel: 'alert' as const,
        icon: 'revelation' as const,
      },
    };
  });

  return {
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 7: Mandate Check ───────────────────────────────────────

export function phaseMandate(state: GameState): Partial<GameState> {
  if (!state.mandateState || !state.mandateDefinition || state.mandateState.completed || state.mandateState.failed) {
    return {};
  }

  const evaluated = evaluateMandate(
    state.graph,
    state.mandateDefinition as any,
    state.mandateState,
    state.ascendantId,
    state.tick,
  );

  const advanced = evaluated.progress >= 1.0
    ? advanceMandateStage(evaluated, state.tick)
    : evaluated;

  const events: TickEvent[] = [];

  // Only emit visible narrative event when mandate is fulfilled (not for intermediate stage transitions)
  if (advanced.completed && !state.mandateState.completed) {
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'mandate_progress',
      message: `Victory! Mandate "${state.mandateDefinition.name}" fulfilled!`,
      significance: 1.0,
      notification: {
        channel: 'alert',
        icon: 'mandate',
      },
    });
  }

  return {
    mandateState: advanced,
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 8: Doom Expiry Check ───────────────────────────────────

export function phaseDoomExpiry(state: GameState): Partial<GameState> {
  if (state.doomClock.expired && state.phase === 'playing') {
    return {
      phase: 'twilight' as const,
      tickEvents: [...state.tickEvents, {
        id: nextEventId(),
        tick: state.tick,
        type: 'phase_change',
        message: 'The Unmaking begins. The world trembles.',
        significance: 1.0,
        notification: {
          channel: 'popup',
          popup: {
            title: 'The Unmaking',
            body: 'The Unmaking begins. The world trembles.',
          },
        },
      }],
    };
  }
  return {};
}

// ─── Master Tick ──────────────────────────────────────────────────

export function runTick(state: GameState, scryTargets: import('../types').HexCoord[] = []): GameState {
  // Start with clean tick events
  let s: GameState = { ...state, tick: state.tick + 1, tickEvents: [] };

  // Advance clock
  const newSeason = Math.floor(s.tick / 90) % 4;
  const newYear = Math.floor(s.tick / 360);
  s = { ...s, clock: { ...s.clock, currentTick: s.tick, season: newSeason, year: newYear } };

  // Track events per phase for trace
  const phaseEventCounts: Record<string, number> = {};
  let agentsProcessed = 0;

  // Track initial event count
  let prevEventCount = s.tickEvents.length;

  // Phase 1: Doom
  s = { ...s, ...phaseDoom(s) };
  phaseEventCounts['doom'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // ─── Unified Action Pipeline (replaces old phaseAgentActions + phaseEncounterProgression + phaseActionProgress) ───
  // Phase 2a: Progress + resolve existing unified actions (Phases 1-6 of unified pipeline)
  const uaRng = mulberry32(state.seed + state.tick * 31);
  s = { ...s, ...phaseUnifiedActionProgress(s, UNIFIED_ACTION_TEMPLATES, uaRng) };
  phaseEventCounts['unified_action_progress'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2b: Idle selection — agents pick new unified actions (Phase 7 of unified pipeline)
  const idleRng = mulberry32(state.seed + state.tick * 37);
  s = { ...s, ...phaseIdleSelection(s, idleRng) };
  const idleSelectionEvents = s.tickEvents.length - prevEventCount;
  phaseEventCounts['idle_selection'] = idleSelectionEvents;
  agentsProcessed += idleSelectionEvents;
  prevEventCount = s.tickEvents.length;

  // Phase 2.35: Agent Movement (goal-directed pathfinding)
  s = { ...s, ...phaseMovement(s) };
  phaseEventCounts['agent_movement'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.36: Colocation Detection (after movement, before sublocation dissolution)
  s = { ...s, ...phaseColocationDetection(s) };
  phaseEventCounts['colocation_detection'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.4: Sublocation Dissolution
  const dissolutions = checkDissolutions(s.graph, s.tick, s.encounterProgress);
  for (const dissolution of dissolutions) {
    s = {
      ...s,
      tickEvents: [
        ...s.tickEvents,
        {
          id: nextEventId(),
          tick: s.tick,
          type: 'sublocation_dissolved' as const,
          message: `${dissolution.sublocationName} at ${dissolution.parentLocationId} dissolved: ${dissolution.reason}`,
          significance: 0.6,
        },
      ],
    };
    // Mark encounters at dissolved sublocation as abandoned
    s = {
      ...s,
      encounterProgress: s.encounterProgress.map(ep => {
        if (dissolution.displacedAgentIds.includes(ep.actorId) && ep.status === 'active') {
          return { ...ep, status: 'abandoned' as const };
        }
        return ep;
      }),
    };
  }
  phaseEventCounts['sublocation_dissolution'] = dissolutions.length;
  prevEventCount = s.tickEvents.length;

  // Phase 2.5: Dilemma Detection
  s = { ...s, ...phaseDilemmaDetection(s) };
  phaseEventCounts['dilemma_detection'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 2.75: Familiarity Gain (Proximity)
  s = { ...s, ...phaseFamiliarityGain(s) };
  phaseEventCounts['familiarity_gain'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 3: Rival Actions
  s = { ...s, ...phaseRivalActions(s) };
  phaseEventCounts['rival_actions'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 4: Stealth
  s = { ...s, ...phaseStealth(s) };
  phaseEventCounts['stealth'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 5: Narrative
  s = { ...s, ...phaseNarrative(s) };
  phaseEventCounts['narrative'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6: Essence
  s = { ...s, ...phaseEssence(s) };
  phaseEventCounts['essence'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.5: Reputation Decay
  s = { ...s, ...phaseReputationDecay(s) };
  phaseEventCounts['reputation_decay'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.6: Divine Influence Decay
  s = { ...s, ...phaseDivineInfluenceDecay(s) };
  phaseEventCounts['divine_influence_decay'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.62: Trade Route Decay (stale routes lose volume; dead routes removed)
  s = { ...s, ...phaseTradeRouteDecay(s) };
  phaseEventCounts['trade_route_decay'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.63: Settlement Prosperity (economic pulse for all settlements)
  s = { ...s, ...phaseProsperity(s) };
  phaseEventCounts['prosperity'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.64: Influence Tier Promotion (backstory unlock events)
  s = { ...s, ...phaseInfluenceTierPromotion(s) };
  phaseEventCounts['influence_tier_promotion'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.65: Gold Sublocations (conditional spawn/dissolve based on prosperity and wealth)
  s = { ...s, ...phaseSublocations(s) };
  phaseEventCounts['sublocations'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.65: Ambition Progress (milestones, completion, abandonment, re-evaluation)
  s = { ...s, ...phaseAmbitionProgress(s) };
  phaseEventCounts['ambition_progress'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 6.75: Agent Lifecycle (death, birth, migration)
  s = { ...s, ...phaseAgentLifecycle(s, nextEventId) };
  phaseEventCounts['agent_lifecycle'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 7: Mandate
  s = { ...s, ...phaseMandate(s) };
  phaseEventCounts['mandate'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;

  // Phase 8: Doom Expiry
  s = { ...s, ...phaseDoomExpiry(s) };
  phaseEventCounts['doom_expiry'] = s.tickEvents.length - prevEventCount;

  // Recalculate visibility
  const losSources = collectLOSSources(s.graph, s.ascendantId, scryTargets);
  const gridSize = {
    cols: Math.max(...s.tiles.map(t => t.coord.col)) + 1,
    rows: Math.max(...s.tiles.map(t => t.coord.row)) + 1,
  };
  const visibilityMap = recalcVisibility(s.visibilityMap, losSources, s.graph, s.tick, gridSize.cols, gridSize.rows);
  s = { ...s, visibilityMap };

  // Merge tick events into recent events (ring buffer)
  const MAX = 100;
  const combined = [...s.recentEvents, ...s.tickEvents];
  s = { ...s, recentEvents: combined.slice(-MAX) };

  // Emit tick summary trace
  const essenceTotal = Object.values(s.essencePool).reduce((sum, val) => sum + val, 0);
  const mandateProgress = s.mandateState?.progress ?? 0;

  emitTrace({
    tick: s.tick,
    category: 'tick_summary',
    summary: `Tick ${s.tick}: ${s.tickEvents.length} events, ${agentsProcessed} agents processed, doom stage ${s.doomClock.currentStage}`,
    phaseEventCounts,
    agentsProcessed,
    doomStage: s.doomClock.currentStage,
    essenceTotal,
    mandateProgress,
  });

  return s;
}
