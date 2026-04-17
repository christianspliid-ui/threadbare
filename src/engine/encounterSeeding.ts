/**
 * Encounter Seeding — evaluate pending encounter seeds and spawn encounters.
 *
 * Seeds are planted by encounter aftermath reactions (encounter_seed effect kind)
 * and become eligible when `tick >= eligibleAfterTick`.
 *
 * Evaluation paths:
 * - templateId set + template exists → create a unified action for the target agent
 * - encounterFamily set (no templateId) → emit a narrative event (v1 — full family matching is future work)
 * - Neither produces a result → fail-soft expired event, seed removed
 *
 * Non-eligible seeds remain in the pending array for future ticks.
 *
 * NFP #4 (Fail-soft): Every code path terminates with a narrative event — never throws.
 * NFP #2 (Inspectability): Narrative events trace seed lifecycle (planted, spawned, expired).
 * NFP #3 (Determinism): rng passed explicitly for action duration computation.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import type { SimulationRuntime } from './simulationRuntime';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { createUnifiedAction } from './unifiedActionLifecycle';
import { appendRecentEvent } from './encounterAftermath';
import { emitTrace } from './traceBuffer';
import { touchWorld } from './simulationRuntime';

export function evaluateEncounterSeeds(state: GameState, tick: number, rng: () => number, runtime?: SimulationRuntime): GameState {
  const seeds = state.pendingEncounterSeeds ?? [];
  if (seeds.length === 0) return state;

  const eligible: PendingEncounterSeed[] = [];
  const remaining: PendingEncounterSeed[] = [];

  for (const seed of seeds) {
    if (tick >= seed.eligibleAfterTick) {
      eligible.push(seed);
    } else {
      remaining.push(seed);
    }
  }

  if (eligible.length === 0) return state;

  let nextActions = [...state.unifiedActions];
  let nextTickEvents = [...state.tickEvents];
  let nextRecentEvents = [...state.recentEvents];

  for (const seed of eligible) {
    const ticksSincePlant = tick - (seed.plantedTick ?? tick);

    // Try direct template spawn
    if (seed.templateId) {
      const template = getUnifiedTemplateById(seed.templateId);
      if (template) {
        // Check if target agent is not already in an active action
        const agentBusy = nextActions.some(
          a => a.actorId === seed.targetAgentId && !a.resolved
        );
        if (!agentBusy) {
          const action = createUnifiedAction({
            actorId: seed.targetAgentId,
            templateId: seed.templateId,
            targetId: seed.targetAgentId, // self-targeting for seeded encounters
            scale: template.scale,
            source: 'system',
            tick,
            template,
            rng,
          });
          nextActions = [...nextActions, action];

          // THR-116: record causation edge — new encounter action caused by the seeding encounter
          // NOTE: addEdge throws if either endpoint is not a graph node. In production,
          // action IDs (e.g. "ua_42") and template IDs are NOT graph nodes, so this try
          // always falls through to causation_edge_creation_skipped. Full implementation
          // requires encounter history to create event nodes (see caused_by in edgeSchema.ts).
          // TODO(THR-???): wire encounter-history event nodes so causation edges can land.
          const causedBySourceId = seed.sourceEncounterId;
          const causedByNewId = action.actionId;
          if (causedBySourceId && causedByNewId) {
            try {
              state.graph.addEdge({
                id: `caused_by_${causedByNewId}_${seed.seedId}`,
                source: causedByNewId,
                target: causedBySourceId,
                type: 'caused_by',
                properties: {
                  seedId: seed.seedId,
                  seedLabel: seed.seedLabel,
                  sourceReactionId: seed.sourceReactionId,
                  plantedTick: seed.plantedTick,
                  firedTick: tick,
                  ticksBetween: ticksSincePlant,
                  templateId: seed.templateId,
                },
              });
              if (runtime) touchWorld(runtime);
              emitTrace({
                tick, category: 'causation_edge_created',
                sourceEventId: causedByNewId,
                causedByEventId: causedBySourceId,
                seedId: seed.seedId,
                seedLabel: seed.seedLabel,
                ticksBetween: ticksSincePlant,
                summary: `Causation edge: ${causedByNewId} caused_by ${causedBySourceId} (seed: "${seed.seedLabel}")`,
              });
            } catch {
              emitTrace({
                tick, category: 'causation_edge_creation_skipped',
                sourceEventId: causedByNewId,
                causedByEventId: causedBySourceId,
                seedId: seed.seedId,
                reason: 'edge_add_failed',
                summary: `Causation edge skipped: add failed for ${causedByNewId}→${causedBySourceId}`,
              });
            }
          }

          const spawnEvent: TickEvent = {
            id: `${seed.seedId}_spawned`,
            tick,
            type: 'narrative',
            message: `A planted thread bears fruit: ${seed.seedLabel}`,
            significance: 0.65,
            actorId: seed.targetAgentId,
          };
          nextTickEvents = [...nextTickEvents, spawnEvent];
          nextRecentEvents = appendRecentEvent(nextRecentEvents, spawnEvent);
          emitTrace({
            tick, category: 'encounter_seed_triggered',
            agentId: seed.targetAgentId,
            seedId: seed.seedId,
            targetAgentId: seed.targetAgentId,
            ticksBetweenPlantAndTrigger: ticksSincePlant,
            resolvedTemplateId: seed.templateId,
            outcome: 'fired',
            summary: `Seed fired: "${seed.seedLabel}" → ${seed.templateId} for ${seed.targetAgentId}`,
          });
          continue;
        }
        // Agent busy — keep seed for next tick (not triggered yet, no trace)
        remaining.push(seed);
        continue;
      }
      // Template not found — fall through to fail-soft
    }

    // Family matching (v1: emit narrative event, don't auto-spawn)
    if (seed.encounterFamily) {
      // THR-116: causation edge for family narrative fires (no actionId yet; use a synthetic event id)
      const familyEventId = `${seed.seedId}_family_ready`;
      if (seed.sourceEncounterId && familyEventId) {
        try {
          state.graph.addEdge({
            id: `caused_by_${familyEventId}_${seed.seedId}`,
            source: familyEventId,
            target: seed.sourceEncounterId,
            type: 'caused_by',
            properties: {
              seedId: seed.seedId,
              seedLabel: seed.seedLabel,
              sourceReactionId: seed.sourceReactionId,
              plantedTick: seed.plantedTick,
              firedTick: tick,
              ticksBetween: ticksSincePlant,
              family: seed.encounterFamily,
            },
          });
          if (runtime) touchWorld(runtime);
          emitTrace({
            tick, category: 'causation_edge_created',
            sourceEventId: familyEventId,
            causedByEventId: seed.sourceEncounterId,
            seedId: seed.seedId,
            seedLabel: seed.seedLabel,
            ticksBetween: ticksSincePlant,
            summary: `Causation edge (family): ${familyEventId} caused_by ${seed.sourceEncounterId} (seed: "${seed.seedLabel}")`,
          });
        } catch {
          emitTrace({
            tick, category: 'causation_edge_creation_skipped',
            sourceEventId: familyEventId,
            causedByEventId: seed.sourceEncounterId,
            seedId: seed.seedId,
            reason: 'edge_add_failed',
            summary: `Causation edge skipped (family): add failed for ${familyEventId}→${seed.sourceEncounterId}`,
          });
        }
      }

      const familyEvent: TickEvent = {
        id: familyEventId,
        tick,
        type: 'narrative',
        message: `The consequences of ${seed.seedLabel} are stirring — a ${seed.encounterFamily} encounter may surface soon.`,
        significance: 0.55,
        actorId: seed.targetAgentId,
      };
      nextTickEvents = [...nextTickEvents, familyEvent];
      nextRecentEvents = appendRecentEvent(nextRecentEvents, familyEvent);
      // Seed consumed — family matching is best-effort narrative for v1
      emitTrace({
        tick, category: 'encounter_seed_triggered',
        agentId: seed.targetAgentId,
        seedId: seed.seedId,
        targetAgentId: seed.targetAgentId,
        ticksBetweenPlantAndTrigger: ticksSincePlant,
        resolvedTemplateId: `family:${seed.encounterFamily}`,
        outcome: 'fired',
        summary: `Seed fired (family-only narrative): "${seed.seedLabel}" → ${seed.encounterFamily}`,
      });
      continue;
    }

    // Neither templateId nor family — fail-soft
    const expiredEvent: TickEvent = {
      id: `${seed.seedId}_expired`,
      tick,
      type: 'narrative',
      message: `A planted thread withered before it could take root: ${seed.seedLabel}`,
      significance: 0.3,
      actorId: seed.targetAgentId,
    };
    nextTickEvents = [...nextTickEvents, expiredEvent];
    nextRecentEvents = appendRecentEvent(nextRecentEvents, expiredEvent);
    emitTrace({
      tick, category: 'encounter_seed_triggered',
      agentId: seed.targetAgentId,
      seedId: seed.seedId,
      targetAgentId: seed.targetAgentId,
      ticksBetweenPlantAndTrigger: ticksSincePlant,
      resolvedTemplateId: 'none',
      outcome: 'discarded',
      discardReason: 'no_template_or_family',
      summary: `Seed discarded (no template or family): "${seed.seedLabel}"`,
    });
  }

  return {
    ...state,
    unifiedActions: nextActions,
    tickEvents: nextTickEvents,
    recentEvents: nextRecentEvents,
    pendingEncounterSeeds: remaining,
  };
}
