// src/engine/phaseInitiativeProgress.ts
// Advances active agent initiatives each tick: checkpoints, failure, completion (THR-51).
// Also expires temporary location boosts (festival ends) placed by initiative outcomes.
//
// NFP #4 (Fail-soft): Per-agent exceptions don't crash the phase.
// NFP #3 (Determinism): All probability rolls use the provided seeded RNG.

import type { GameState, TickEvent } from '../types/gameState';
import type { InitiativeProgress } from '../types/initiative';
import { INITIATIVE_TEMPLATES } from '../data/initiative-templates';
import {
  INITIATIVE_DELAY_ON_FAILED_CHECK,
  INITIATIVE_SABOTAGE_FAIL_CHANCE,
  INITIATIVE_SABOTAGE_EXTENSION,
  INITIATIVE_CHECKPOINT_BASE_PASS_CHANCE,
  INITIATIVE_CHECKPOINT_CAPABILITY_WEIGHT,
} from '../data/initiative-constants';
import { computeCapability } from './domainCapability';
import { getAgentLocationId } from './graphQueries';
import { executeInitiativeOutcomes } from './initiativeOutcomes';
import { emitTrace } from './traceBuffer';
import type { ReachDomain } from '../types/traits';

// ─── Checkpoint Domain Map ───────────────────────────────────────────
// Which capability domains to roll at each checkpoint, by template id.
// Index = checkpoint count at time of check (0-based).

const CHECKPOINT_DOMAINS: Record<string, readonly (readonly ReachDomain[])[]> = {
  'initiative.found-organization':   [['heart'], ['heart', 'gold'], ['gold']],
  'initiative.recruit-party':        [['heart'], ['heart', 'eye']],
  'initiative.organize-festival':    [['gold'], ['heart']],
  'initiative.consecrate-holy-site': [['veil'], ['star']],
  'initiative.commission-quest':     [['gold']],
  'initiative.establish-spy-network':[['eye'], ['shadow', 'gold'], ['shadow']],
};

// ─── Phase Entry ─────────────────────────────────────────────────────

export function phaseInitiativeProgress(
  state: GameState,
  rng: () => number,
): Partial<GameState> {
  const graph = state.graph;
  const newEvents: TickEvent[] = [];
  const newEncounterSeeds: import('../types/unifiedAction').PendingEncounterSeed[] = [];
  const newFactionDefinitions: Record<string, import('../types/faction').FactionDefinition> = {};

  // Collect all actors with an active initiative.
  const actorNodes = graph.getNodesByType('actor').filter(n => {
    const props = n.properties as Record<string, unknown>;
    return props.activeInitiative != null;
  });

  for (const actorNode of actorNodes) {
    try {
      const props = actorNode.properties as Record<string, unknown>;
      const progress = props.activeInitiative as InitiativeProgress;
      if (!progress || progress.status !== 'active') continue;

      const template = INITIATIVE_TEMPLATES.find(t => t.id === progress.templateId);
      if (!template) {
        // Template unknown — clean up orphaned progress
        actorNode.properties.activeInitiative = undefined;
        continue;
      }

      // ── Failure Condition Checks ─────────────────────────────────
      let failed = false;
      let failReason = '';

      for (const condition of template.failureConditions) {
        switch (condition.type) {
          case 'agent_dies': {
            const isDead = (actorNode.properties.status as string | undefined) === 'dead';
            if (isDead || !graph.getNode(actorNode.id)) {
              failed = true; failReason = 'agent_dies';
            }
            break;
          }
          case 'wealth_below': {
            const wealth = (actorNode.properties.wealth as number | undefined) ?? 0;
            if (wealth < condition.threshold) {
              failed = true; failReason = `wealth_below:${condition.threshold}`;
            }
            break;
          }
          case 'agent_leaves_location': {
            const currentLocId = getAgentLocationId(graph, actorNode.id);
            if (!currentLocId) break;
            // Resolve to parent if sublocation
            const currentLocNode = graph.getNode(currentLocId);
            const resolvedId = (currentLocNode?.properties.parentLocationId as string | undefined)
              ?? currentLocId;
            if (resolvedId !== progress.locationId) {
              failed = true; failReason = 'agent_leaves_location';
            }
            break;
          }
          case 'location_destroyed': {
            if (!graph.getNode(progress.locationId)) {
              failed = true; failReason = 'location_destroyed';
            }
            break;
          }
          case 'disrupted_by_encounter': {
            const agentEncounters = state.encounterProgress.filter(
              ep => (ep.actorId === actorNode.id || ep.targetAgentId === actorNode.id)
                && ep.status === 'active',
            );
            const encounterTypes = new Set(condition.encounterTypes);
            for (const ep of agentEncounters) {
              if (encounterTypes.has(ep.encounterId)) {
                failed = true; failReason = `disrupted_by_encounter:${ep.encounterId}`;
                break;
              }
            }
            break;
          }
        }
        if (failed) break;
      }

      if (failed) {
        failInitiative(actorNode.properties as Record<string, unknown>, progress, failReason, state.tick, newEvents, actorNode.name);
        continue;
      }

      // ── Checkpoint ───────────────────────────────────────────────
      if (state.tick >= progress.occupiedUntilTick) {
        // Sabotage check — may force-fail this checkpoint.
        // Sabotage is set either via divine action (top-level property)
        // or directly on the progress object.
        let checkpointFailed = false;

        const isSabotaged = !!(actorNode.properties.initiativeSabotaged || progress.sabotaged);
        if (isSabotaged) {
          if (rng() < INITIATIVE_SABOTAGE_FAIL_CHANCE) {
            checkpointFailed = true;
          }
          // Consume the sabotage flags and apply extension delay
          actorNode.properties.initiativeSabotaged = undefined;
          const sabotageProgress = actorNode.properties.activeInitiative as InitiativeProgress;
          sabotageProgress.sabotaged = false;
          sabotageProgress.targetCompletionTick += INITIATIVE_SABOTAGE_EXTENSION;
        }

        if (!checkpointFailed) {
          // Capability roll
          const domains = CHECKPOINT_DOMAINS[progress.templateId];
          const checkIndex = progress.checkpoints.length;
          const domainsForCheck: readonly ReachDomain[] =
            domains?.[Math.min(checkIndex, (domains?.length ?? 1) - 1)] ?? ['heart'];
          const avgCapability = domainsForCheck.reduce(
            (sum, d) => sum + computeCapability(graph, actorNode.id, d), 0,
          ) / domainsForCheck.length;
          const passProb = INITIATIVE_CHECKPOINT_BASE_PASS_CHANCE + avgCapability * INITIATIVE_CHECKPOINT_CAPABILITY_WEIGHT;
          checkpointFailed = rng() >= passProb;
        }

        const checkpoint = {
          tick: state.tick,
          passed: !checkpointFailed,
          reason: checkpointFailed ? 'capability_check_failed' : undefined,
        };

        // Append checkpoint record
        const mutableProgress = actorNode.properties.activeInitiative as InitiativeProgress;
        (mutableProgress.checkpoints as typeof mutableProgress.checkpoints).push(checkpoint);

        if (checkpointFailed) {
          // Delay completion
          (actorNode.properties.activeInitiative as InitiativeProgress).targetCompletionTick
            = mutableProgress.targetCompletionTick + INITIATIVE_DELAY_ON_FAILED_CHECK;
        }

        // Advance the next checkpoint window
        (actorNode.properties.activeInitiative as InitiativeProgress).occupiedUntilTick
          = state.tick + template.checkInterval;

        emitTrace({
          category: 'initiative_checkpoint',
          tick: state.tick,
          agentId: actorNode.id,
          initiativeId: progress.initiativeId,
          templateId: progress.templateId,
          passed: !checkpointFailed,
          checkpointIndex: progress.checkpoints.length - 1,
          summary: checkpointFailed
            ? `${actorNode.name} hits a snag in ${template.name}`
            : `${actorNode.name} makes progress on ${template.name}`,
        });
      }

      // ── Completion Check ─────────────────────────────────────────
      const currentProgress = actorNode.properties.activeInitiative as InitiativeProgress;
      if (state.tick >= currentProgress.targetCompletionTick) {
        const outcomes = executeInitiativeOutcomes(state, graph, currentProgress, template);
        newEvents.push(...outcomes.newEvents);
        newEncounterSeeds.push(...outcomes.newEncounterSeeds);
        Object.assign(newFactionDefinitions, outcomes.newFactionDefinitions);

        // Mark complete, record cooldown tick, clear active initiative
        actorNode.properties.activeInitiative = undefined;
        actorNode.properties.lastInitiativeCompletedTick = state.tick;

        emitTrace({
          category: 'initiative_completed',
          tick: state.tick,
          agentId: actorNode.id,
          initiativeId: currentProgress.initiativeId,
          templateId: currentProgress.templateId,
          locationId: currentProgress.locationId,
          summary: `${actorNode.name} completes ${template.name}`,
        });

        newEvents.push({
          id: `initiative_complete_${currentProgress.initiativeId}_${state.tick}`,
          tick: state.tick,
          type: 'agent_action',
          message: `${actorNode.name} has completed ${template.name}!`,
          significance: 0.8,
          actorId: actorNode.id,
        });
      }
    } catch {
      // Fail-soft: clear broken initiative, don't crash tick
      (actorNode.properties as Record<string, unknown>).activeInitiative = undefined;
    }
  }

  // ── Festival / Temporary Boost Expiry ────────────────────────────
  for (const node of graph.getNodesByType('location')) {
    const props = node.properties as Record<string, unknown>;
    const expiry = props.festivalBoostExpiresAtTick as number | undefined;
    if (expiry != null && state.tick >= expiry) {
      props.festivalBoost = undefined;
      props.festivalBoostExpiresAtTick = undefined;
      newEvents.push({
        id: `festival_end_${node.id}_${state.tick}`,
        tick: state.tick,
        type: 'world_change',
        message: `The festival at ${node.name} has ended.`,
        significance: 0.4,
      });
    }
  }

  const result: Partial<GameState> = {
    tickEvents: [...state.tickEvents, ...newEvents],
  };
  if (newEncounterSeeds.length > 0) {
    result.pendingEncounterSeeds = [...(state.pendingEncounterSeeds ?? []), ...newEncounterSeeds];
  }
  if (Object.keys(newFactionDefinitions).length > 0) {
    result.dynamicFactionDefinitions = { ...(state.dynamicFactionDefinitions ?? {}), ...newFactionDefinitions };
  }
  return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function failInitiative(
  props: Record<string, unknown>,
  progress: InitiativeProgress,
  reason: string,
  tick: number,
  events: TickEvent[],
  actorName: string,
): void {
  const template = INITIATIVE_TEMPLATES.find(t => t.id === progress.templateId);

  props.activeInitiative = undefined;
  props.lastInitiativeCompletedTick = tick;

  emitTrace({
    category: 'initiative_failed',
    tick,
    agentId: progress.actorId,
    initiativeId: progress.initiativeId,
    templateId: progress.templateId,
    locationId: progress.locationId,
    reason,
    summary: `${actorName}'s ${template?.name ?? progress.templateId} failed: ${reason}`,
  });

  events.push({
    id: `initiative_fail_${progress.initiativeId}_${tick}`,
    tick,
    type: 'agent_action',
    message: `${actorName}'s ${template?.name ?? 'initiative'} has failed.`,
    significance: 0.5,
    actorId: progress.actorId,
  });
}
