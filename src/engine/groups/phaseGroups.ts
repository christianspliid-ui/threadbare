/**
 * Phase: Companies — THR-74
 *
 * Runs once per tick, after agent decision and before individual movement
 * execution, so a company's shared heading supersedes whatever its members
 * decided for themselves earlier in the tick.
 *
 * Sub-step order (each independently caught — NFP #4, the tick loop never crashes):
 *
 *   1. Dissolution & leave checks — cheapest, and frees members before anything
 *      else spends work on a company that is already over.
 *   2. Cohesion threshold effects — fray-state bookkeeping.
 *   3. Group movement — decide + write member `MovementState`s.
 *   4. Formation scan — mint new companies from colocated, compatible agents.
 *
 * Emits exactly **one** `group_phase` aggregate trace per tick regardless of how
 * many companies exist (all-agents phases must never emit per-entity traces),
 * plus event-scale `group_formed` / `group_dissolved` traces, which are rare.
 */

import type { GameState, TickEvent } from '../../types/gameState';
import type { SimulationRuntime } from '../simulationRuntime';
import { emitTrace } from '../traceBuffer';
import { touchWorld } from '../simulationRuntime';
import { mulberry32 } from '../../lib/prng';
import type { GroupPhaseTrace, GroupFormedTrace, GroupDissolvedTrace } from '../../types/trace';
import { getActiveGroups, getGroupCohesion, getCohesionState } from './groupQueries';
import { runGroupUpkeep } from './groupDissolution';
import { runGroupMovement } from './groupMovement';
import { runFormationScan } from './groupFormation';
import { applyCohesionEvent } from './groupCohesion';

/** Significance of company chronicle events in the event feed. */
const GROUP_EVENT_SIGNIFICANCE = 0.55;

let groupEventCounter = 0;

function nextGroupEventId(tick: number): string {
  return `evt_group_${tick}_${++groupEventCounter}`;
}

/** Reset the event-id counter. Call in test `beforeEach` for isolation. */
export function resetGroupEventCounter(): void {
  groupEventCounter = 0;
}

/**
 * Advance the company layer by one tick.
 *
 * Mutates the graph in place (company nodes, membership edges, member movement
 * state) and returns the usual partial-state delta carrying new tick events.
 */
export function phaseGroups(state: GameState, runtime?: SimulationRuntime): Partial<GameState> {
  const events: TickEvent[] = [];

  // Distinct PRNG streams per concern, all seeded from (seed, tick) so a replay of
  // the same state produces the same companies (NFP #3).
  const leaveRng = mulberry32(state.seed + state.tick * 61);
  const formationRng = mulberry32(state.seed + state.tick * 67);

  let dissents = 0;
  let cohesionDeltasApplied = 0;
  let leaveDecisions = 0;
  let movesExecuted = 0;
  let formationCandidateSets = 0;
  let mutated = false;

  const active = getActiveGroups(state.graph);
  const activeGroups = active.length;

  // ── Sub-steps 1 & 2: upkeep (dissolution, leaves, cohesion reconciliation) ──
  const survivors: typeof active = [];
  for (const group of active) {
    try {
      const upkeep = runGroupUpkeep(state, group, leaveRng);
      leaveDecisions += upkeep.leaveDecisions;
      cohesionDeltasApplied += upkeep.cohesionDeltas;
      if (upkeep.cohesionDeltas > 0 || upkeep.leaveDecisions > 0) mutated = true;

      if (upkeep.dissolved) {
        mutated = true;
        const { groupId, reason, finalCohesion, ticksActive } = upkeep.dissolved;
        emitTrace({
          category: 'group_dissolved',
          tick: state.tick,
          groupId,
          reason,
          finalCohesion,
          ticksActive,
          summary: `${group.name} disbands (${reason})`,
        } as GroupDissolvedTrace);
        events.push({
          id: nextGroupEventId(state.tick),
          tick: state.tick,
          type: 'group_dissolved',
          message: `${group.name} goes its separate ways.`,
          significance: GROUP_EVENT_SIGNIFICANCE,
        });
        continue;
      }
      survivors.push(group);
    } catch {
      // One bad company must not stop the rest — skip it this tick.
      survivors.push(group);
    }
  }

  // ── Sub-step 3: movement ──
  for (const group of survivors) {
    try {
      const move = runGroupMovement(state, group);
      if (move.moved) {
        movesExecuted++;
        mutated = true;
      }
      for (const _dissenter of move.dissenters) {
        const delta = applyCohesionEvent(state.graph, group.id, 'dissent', state.tick);
        if (delta !== 0) {
          cohesionDeltasApplied++;
          mutated = true;
        }
        dissents++;
      }
    } catch {
      // Movement failure leaves the company where it is — narratable, not fatal.
    }
  }

  // ── Sub-step 4: formation ──
  try {
    const scan = runFormationScan(state, formationRng);
    formationCandidateSets = scan.candidateSets;
    for (const formed of scan.formed) {
      mutated = true;
      emitTrace({
        category: 'group_formed',
        tick: state.tick,
        groupId: formed.groupId,
        groupType: formed.groupType,
        name: formed.name,
        memberIds: formed.memberIds,
        cause: 'systemic',
        startingCohesion: formed.cohesion,
        summary: `${formed.name} forms (${formed.memberIds.length} companions)`,
      } as GroupFormedTrace);
      events.push({
        id: nextGroupEventId(state.tick),
        tick: state.tick,
        type: 'group_formed',
        message: `${formed.name} sets out together.`,
        significance: GROUP_EVENT_SIGNIFICANCE,
      });
    }
  } catch {
    // A failed scan simply forms no companies this tick.
  }

  // The graph mutates in place, so UI selectors keyed on graph identity would
  // serve stale data without an explicit version bump.
  if (mutated && runtime) touchWorld(runtime);

  emitTrace({
    category: 'group_phase',
    tick: state.tick,
    activeGroups,
    movesExecuted,
    dissents,
    cohesionDeltasApplied,
    leaveDecisions,
    formationCandidateSets,
    summary: `companies: ${activeGroups} active, ${movesExecuted} moved, ${dissents} dissents, ${formationCandidateSets} sets scanned`,
  } as GroupPhaseTrace);

  return { tickEvents: [...state.tickEvents, ...events] };
}

/** Re-exported so callers can render the ladder without importing queries directly. */
export { getGroupCohesion, getCohesionState };
