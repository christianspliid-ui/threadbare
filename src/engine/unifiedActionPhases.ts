/**
 * Unified Action Phases — orchestrator-level phase functions for the
 * unified action system.
 *
 * Phase 7: Idle Selection
 *   Iterates idle actors, generates unified candidates, runs the
 *   selection pipeline, and creates new UnifiedActions. Also handles
 *   routine flavor events and notable periodic events.
 *
 * Phase 1-6 (progress + resolution) lives in unifiedActionResolution.ts.
 *
 * Sprint 3E — Task 3E.2
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import { createUnifiedAction, isUnifiedAgentIdle } from './unifiedActionLifecycle';
import { generateUnifiedCandidates } from './unifiedCandidates';
import { UNIFIED_ACTION_TEMPLATES, getUnifiedTemplateById } from '../data/unified-action-templates';
import { runSelectionPipeline } from './agentSelection';
import { generateRoutineProse, generateNotableProse } from './narrative';
import { emitTrace } from './traceBuffer';

// ─── Constants ──────────────────────────────────────────────────

/** Combined probability of attempting any action (encounter + CRUD merged) */
export const ACTION_ATTEMPT_CHANCE = 0.55;

/** Probability of a routine flavor event (no state change) */
export const ROUTINE_EVENT_CHANCE = 0.10;

/** Generate a notable high-significance event every N ticks */
export const NOTABLE_EVENT_INTERVAL = 5;

/** Selection pipeline config */
const SELECTION_CONFIG = { topN: 5, survivalThreshold: 0.8 };

// ─── ID Generator ───────────────────────────────────────────────

let phaseEventCounter = 0;
function nextPhaseEventId(): string {
  return `ua_evt_${++phaseEventCounter}`;
}

/** Reset for testing */
export function resetPhaseEventCounter(): void {
  phaseEventCounter = 0;
}

// ─── Phase 7: Idle Selection ────────────────────────────────────

/**
 * Phase 7 of the unified pipeline — idle agent selection.
 *
 * For each idle individual actor:
 * 1. Roll for action attempt (55% = merged encounter 20% + CRUD 35%)
 * 2. Generate unified candidates
 * 3. Run selection pipeline (axiological scoring + disposition)
 * 4. Create UnifiedAction from selected candidate
 * 5. Or roll for routine event (10%)
 *
 * Also generates periodic notable events every NOTABLE_EVENT_INTERVAL ticks.
 *
 * Returns partial GameState with updated unifiedActions and tickEvents.
 */
export function phaseIdleSelection(
  state: GameState,
  rng: () => number,
): Partial<GameState> {
  const events: TickEvent[] = [];
  const newActions = [...(state.unifiedActions ?? [])];

  const actors = state.graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual',
  );

  for (const actor of actors) {
    // Skip if already has active unified action
    if (!isUnifiedAgentIdle(state.unifiedActions ?? [], actor.id)) continue;

    // Also skip if still has active legacy encounter or action
    // (during transition period — once old phases are fully replaced, this check goes away)
    if (state.encounterProgress?.some(p => p.actorId === actor.id && p.status === 'active')) continue;

    // Find actor's location
    const locEdges = state.graph.getOutgoingEdges(actor.id, 'located_at');
    if (locEdges.length === 0) continue;
    const locationId = locEdges[0].target;

    const roll = rng();

    // Action attempt
    if (roll < ACTION_ATTEMPT_CHANCE) {
      const candidates = generateUnifiedCandidates(
        state.graph, actor.id, locationId, UNIFIED_ACTION_TEMPLATES,
        state.unifiedActions ?? [],
      );

      if (candidates.length > 0) {
        try {
          // Run the full selection pipeline (axiological scoring, divine overlay, disposition)
          const result = runSelectionPipeline(
            state.graph,
            actor.id,
            candidates,
            SELECTION_CONFIG,
            state.tick,
            rng(),
          );

          const template = getUnifiedTemplateById(result.selected.templateId);
          if (template) {
            const action = createUnifiedAction({
              actorId: actor.id,
              templateId: template.id,
              targetId: result.selected.targetId,
              scale: template.scale,
              source: 'agent',
              tick: state.tick,
              template,
              rng,
            });

            newActions.push(action);

            const locationNode = state.graph.getNode(locationId);
            const locationName = locationNode?.name ?? 'the realm';

            // Emit trace for inspectability
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
              duration: action.stepDuration,
            } as any);

            events.push({
              id: nextPhaseEventId(),
              tick: state.tick,
              type: 'agent_action_resolved',
              message: `${actor.name} begins ${template.name} at ${locationName}.`,
              sphere: template.sphereAffinity ?? (SPHERE_NAMES[Math.floor(rng() * SPHERE_NAMES.length)] as SphereName),
              significance: template.steps.length > 1 ? 0.7 : 0.5,
            });
          }
        } catch {
          // Selection pipeline can fail if no axiological profile — skip
        }
      }
    }

    // Routine flavor event (no state change)
    else if (roll < ACTION_ATTEMPT_CHANCE + ROUTINE_EVENT_CHANCE) {
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
        id: nextPhaseEventId(),
        tick: state.tick,
        type: 'agent_action_resolved',
        message: prose.text,
        sphere,
        significance,
      });

      // Sphere influence on location
      const locNode = state.graph.getNode(locationId);
      if (locNode?.properties?.sphereInfluence) {
        const inf = locNode.properties.sphereInfluence as Record<string, number>;
        inf[sphere] = (inf[sphere] ?? 0) + 0.02;
      }
    }
  }

  // Notable event — every NOTABLE_EVENT_INTERVAL ticks
  if (actors.length > 0 && state.tick % NOTABLE_EVENT_INTERVAL === 0) {
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
      id: nextPhaseEventId(),
      tick: state.tick,
      type: 'agent_action_resolved',
      message: prose.text,
      sphere,
      significance: 0.85,
    });
  }

  return {
    unifiedActions: newActions,
    tickEvents: [...state.tickEvents, ...events],
  };
}
