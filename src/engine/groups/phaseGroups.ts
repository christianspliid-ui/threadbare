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
import {
  getAllGroups, getGroupCohesion, getCohesionState, isGroupThreaded, isGroupSundered,
} from './groupQueries';
import type { CohesionState } from './groupQueries';
import { runGroupUpkeep } from './groupDissolution';
import { runGroupMovement } from './groupMovement';
import { runFormationScan } from './groupFormation';
import { applyCohesionEvent } from './groupCohesion';
import { composePartingMoment } from './groupParting';
import { composeFrayMoment, crossedIntoFray } from './groupFray';
import { composeSeekingMoment } from './groupSeeking';
import { composeReunionMoment, reuniteWindowLapsed } from './groupReunion';
import {
  GROUP_PARTING_EVENT_SIGNIFICANCE,
  GROUP_FRAY_EVENT_SIGNIFICANCE,
  GROUP_SEEKING_EVENT_SIGNIFICANCE,
  GROUP_REUNION_EVENT_SIGNIFICANCE,
  GROUP_REUNION_LAPSE_EVENT_SIGNIFICANCE,
} from '../../data/group-constants';

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
  const partingRng = mulberry32(state.seed + state.tick * 71);
  const frayRng = mulberry32(state.seed + state.tick * 73);
  const seekingRng = mulberry32(state.seed + state.tick * 79);
  const reunionRng = mulberry32(state.seed + state.tick * 83);

  let dissents = 0;
  let cohesionDeltasApplied = 0;
  let leaveDecisions = 0;
  let movesExecuted = 0;
  let formationCandidateSets = 0;
  let frayMomentsFired = 0;
  let seekingMomentsFired = 0;
  let reunionMomentsFired = 0;
  let reunionLapsesFired = 0;
  let mutated = false;

  // One full scan, two slices: the active working set, and the disbanded companies a
  // Reunite window may still be open on (sub-step 4.5). Deriving both from a single
  // pass keeps this phase at one O(actors) walk rather than two.
  const allGroups = getAllGroups(state.graph);
  const active = allGroups.filter(
    n => (n.properties as Record<string, unknown>).groupStatus !== 'disbanded',
  );
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
        const { groupId, reason, finalCohesion, ticksActive, threaded } = upkeep.dissolved;
        emitTrace({
          category: 'group_dissolved',
          tick: state.tick,
          groupId,
          reason,
          finalCohesion,
          ticksActive,
          summary: `${group.name} disbands (${reason})`,
        } as GroupDissolvedTrace);

        // The Parting (THR-74): a threaded company's end is an authored moment —
        // bittersweet or bitter, chosen by reason + cohesion. An untethered
        // company's end stays the silent systemic line.
        let message = `${group.name} goes its separate ways.`;
        let significance = GROUP_EVENT_SIGNIFICANCE;
        let band: string | undefined;
        if (threaded) {
          const moment = composePartingMoment(
            group.name ?? 'the company',
            reason,
            finalCohesion,
            partingRng,
          );
          message = moment.message;
          band = moment.variant;
          significance = GROUP_PARTING_EVENT_SIGNIFICANCE;
        }
        events.push({
          id: nextGroupEventId(state.tick),
          tick: state.tick,
          type: 'group_dissolved',
          message,
          band,
          significance,
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

  // ── Sub-step 3.5: fray moment ──
  // A threaded company that crosses below the fray line this tick earns an authored
  // moment — The Shared Spoils or Old Wounds — the sibling of The Parting. An
  // untethered company's fray stays silent. Runs after movement so a dissent that
  // pushed the company over the edge is already counted. The stored band is seeded
  // silently on first sight, so the trigger is the transition, never the state.
  for (const group of survivors) {
    try {
      const current = state.graph.getNode(group.id);
      if (!current) continue;
      const trueState = getCohesionState(getGroupCohesion(current));
      // Sunder (THR-732) makes the drama pool treat the company as frayed regardless
      // of where cohesion actually sits — the god has cracked something the numbers
      // have not caught up with yet. Folding it into the *state* rather than adding a
      // parallel trigger means it rides the shipped transition discipline: the moment
      // fires once, on the tick the sundering lands, and the stored band below records
      // the effective state so it cannot re-fire every tick the window stays open.
      const nowState: CohesionState =
        isGroupSundered(current, state.tick) && (trueState === 'bound' || trueState === 'holding')
          ? 'frayed'
          : trueState;
      const prevState = (current.properties as Record<string, unknown>).lastCohesionState as
        | CohesionState
        | undefined;

      if (crossedIntoFray(prevState, nowState) && isGroupThreaded(state.graph, group.id, state.ascendantId)) {
        const moment = composeFrayMoment(group.name ?? 'the company', frayRng);
        events.push({
          id: nextGroupEventId(state.tick),
          tick: state.tick,
          type: 'group_frayed',
          message: moment.message,
          band: moment.kind,
          significance: GROUP_FRAY_EVENT_SIGNIFICANCE,
        });
        frayMomentsFired++;
      }

      if (prevState !== nowState) {
        state.graph.updateNode(group.id, {
          properties: { ...current.properties, lastCohesionState: nowState },
        });
        mutated = true;
      }
    } catch {
      // A bad company must not stop the fray scan for the rest.
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
        cause: formed.cause,
        startingCohesion: formed.cohesion,
        summary: `${formed.name} forms (${formed.memberIds.length} companions)`,
      } as GroupFormedTrace);

      // Seeking Companions (THR-74): a threaded company's founding is an authored
      // moment — eager or wary, chosen by its starting cohesion. An untethered
      // founding, or a divine-nudged one (Draw Together tells its own story at the
      // cast), keeps the silent systemic line.
      let message = `${formed.name} sets out together.`;
      let significance = GROUP_EVENT_SIGNIFICANCE;
      let band: string | undefined;
      if (formed.cause === 'seeking_companions') {
        const moment = composeSeekingMoment(formed.name, formed.cohesion, seekingRng);
        message = moment.message;
        band = moment.variant;
        significance = GROUP_SEEKING_EVENT_SIGNIFICANCE;
        seekingMomentsFired++;
      } else if (formed.cause === 'reunite') {
        // The Reunion (THR-732) — a company the player deliberately called back.
        // Unlike Seeking Companions this needs no threading check: the god cast
        // Reunite on this specific company, so the interest is established by the
        // cast itself rather than inferred from a thread.
        const moment = composeReunionMoment(formed.name, 'reunion', reunionRng);
        message = moment.message;
        band = moment.kind;
        significance = GROUP_REUNION_EVENT_SIGNIFICANCE;
        reunionMomentsFired++;
      }
      events.push({
        id: nextGroupEventId(state.tick),
        tick: state.tick,
        type: 'group_formed',
        message,
        band,
        significance,
      });
    }
  } catch {
    // A failed scan simply forms no companies this tick.
  }

  // ── Sub-step 4.5: Reunite window lapse (THR-732) ──
  // A reunion window that closed without the scan binding anyone gets its ending
  // told once — The Road Not Taken. Runs *after* formation so a reunion that landed
  // on the window's final tick is read as a reunion, not a lapse. Clearing the
  // timestamp is what makes this fire exactly once; the successful path clears it in
  // the formation scan for the same reason.
  for (const group of allGroups) {
    try {
      const current = state.graph.getNode(group.id);
      if (!current) continue;
      const props = current.properties as Record<string, unknown>;
      if (!reuniteWindowLapsed(props.reuniteUntilTick, state.tick)) continue;

      const moment = composeReunionMoment(group.name ?? 'the company', 'lapse', reunionRng);
      events.push({
        id: nextGroupEventId(state.tick),
        tick: state.tick,
        type: 'group_reunion_lapsed',
        message: moment.message,
        band: moment.kind,
        significance: GROUP_REUNION_LAPSE_EVENT_SIGNIFICANCE,
      });
      reunionLapsesFired++;

      state.graph.updateNode(group.id, {
        properties: { ...props, reuniteUntilTick: undefined, reuniteSphereFlavor: undefined },
      });
      mutated = true;
    } catch {
      // One bad node must not stop the lapse sweep for the rest.
    }
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
    frayMomentsFired,
    seekingMomentsFired,
    reunionMomentsFired,
    reunionLapsesFired,
    summary: `companies: ${activeGroups} active, ${movesExecuted} moved, ${dissents} dissents, ${frayMomentsFired} frayed, ${seekingMomentsFired} sought, ${reunionMomentsFired} reunited, ${reunionLapsesFired} lapsed, ${formationCandidateSets} sets scanned`,
  } as GroupPhaseTrace);

  return { tickEvents: [...state.tickEvents, ...events] };
}

/** Re-exported so callers can render the ladder without importing queries directly. */
export { getGroupCohesion, getCohesionState };
