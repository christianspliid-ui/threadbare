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
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { createUnifiedAction } from './unifiedActionLifecycle';
import { appendRecentEvent } from './encounterAftermath';

export function evaluateEncounterSeeds(state: GameState, tick: number, rng: () => number): GameState {
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
          continue;
        }
        // Agent busy — keep seed for next tick
        remaining.push(seed);
        continue;
      }
      // Template not found — fall through to fail-soft
    }

    // Family matching (v1: emit narrative event, don't auto-spawn)
    if (seed.encounterFamily) {
      const familyEvent: TickEvent = {
        id: `${seed.seedId}_family_ready`,
        tick,
        type: 'narrative',
        message: `The consequences of ${seed.seedLabel} are stirring — a ${seed.encounterFamily} encounter may surface soon.`,
        significance: 0.55,
        actorId: seed.targetAgentId,
      };
      nextTickEvents = [...nextTickEvents, familyEvent];
      nextRecentEvents = appendRecentEvent(nextRecentEvents, familyEvent);
      // Seed consumed — family matching is best-effort narrative for v1
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
  }

  return {
    ...state,
    unifiedActions: nextActions,
    tickEvents: nextTickEvents,
    recentEvents: nextRecentEvents,
    pendingEncounterSeeds: remaining,
  };
}
