/**
 * Unrest as pressure (THR-1934 S1).
 *
 * Unrest is the pressure a town lives under, not a spike that decays. Once a day
 * (`tick % TICKS_PER_DAY === UNREST_TARGET_TICK_OFFSET`, and on any settlement not yet
 * measured) every settlement's **target** is summed from six inputs — hunger,
 * poverty, a siege, sickness, its recent dead, less its contentment
 * (`unrestPressure/inputs.ts`). Every tick `unrest` moves toward that target by at
 * most `UNREST_DRIFT_PER_DAY / TICKS_PER_DAY`, clamped 0–100. One-off pushes
 * (Incite Unrest, doom cards, complications) are unchanged and drift back at the
 * same rate, so an Incite Unrest now lasts about five days.
 *
 * The daily pass also runs the two S1 bands:
 * - **Restless** (`restless` trait): every `RESTLESS_LEAVE_DAYS` one person leaves for
 *   a fed, calm town nearby and the town's most recent arrival leans that way; when
 *   hunger is the largest input that mortal takes up *Flee the Ravaged Land*.
 * - **Lawless** (`lawless` trait): on the day a hungry town turns Lawless, a granary
 *   riot is seeded for a resident (at most once per `RIOT_SEED_COOLDOWN_DAYS`). The
 *   tax half lives in `factionPurse/income.ts` (`townTaxOf`).
 *
 * `phaseUnrest` calls in when `UNREST_PRESSURE_ENABLED`; off keeps the flat decay.
 *
 * NFP: #1 every number in `src/data/unrest-pressure-constants.ts`; #2 flat
 * `unrestTarget` / `unrestInputs` / `hungerDays` on every settlement and four trace
 * categories; #3 no draw, settlements in id order, argmax with id ties; #4 each
 * settlement's daily pass is caught on its own and the drift still runs.
 *
 * Plan: Docs/plans/2026-10-16-thr-1934-hunger-and-unrest.md.
 */
import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import type { RelocationIntent } from '../types/movement';
import { emitTrace } from './traceBuffer';
import { getLocationNodes } from './sublocationShape';
import { resolveLocationToHex } from './encounterAwareness';
import { setRelocationIntent } from './relocationIntent';
import { assignAmbitionToActor } from './ambitionAssignment';
import { pickTargetAgent } from './phases/routeEvents';
import { TICKS_PER_DAY } from '../data/attention-constants';
import { RELOCATION_INTENT_TTL_TICKS } from '../data/movement-content';
import { SCARCITY_ARC_SEED_DELAY_TICKS, SCARCITY_ARC_SEED_PRIORITY } from '../data/economic-power-config';
import {
  UNREST_DRIFT_PER_DAY,
  UNREST_TARGET_TICK_OFFSET,
  RESTLESS_LEAVE_DAYS,
  RIOT_SEED_COOLDOWN_DAYS,
  GRANARY_RIOT_TEMPLATE_ID,
} from '../data/unrest-pressure-constants';
import {
  computeUnrestInputs,
  targetOf,
  largestInput,
  isPressureSettlement,
  UNREST_TARGET_PROP,
  UNREST_INPUTS_PROP,
  HUNGER_DAYS_PROP,
  LAST_SIEGE_SEEN_PROP,
  RESTLESS_DAYS_PROP,
  LAST_LEAVE_TO_PROP,
  LAST_RIOT_SEED_PROP,
  type UnrestInputs,
} from './unrestPressure/inputs';
import { isHungryToday } from './unrestPressure/hunger';
import { unrestBand, isRestlessPlace, isLawlessPlace } from './unrestPressure/bands';
import { pickLeaveDestination, pickLeaningMortal } from './unrestPressure/leave';

export { homeIsRestless } from './unrestPressure/bands';

/** Ambition a hungry town's leaver takes up (the THR-1869 addendum). */
export const FLEE_AMBITION_TEMPLATE_ID = 'ambition_flee_the_ravaged_land';

/** Settlement flag: the town was Lawless at the last daily pass (to see the day it turns). */
const WAS_LAWLESS_PROP = 'unrestWasLawless';
/** Settlement flag: the "nobody to move before the settlement economy" trace was written. */
const LEAVE_SKIPPED_TRACED_PROP = 'unrestLeaveSkippedTraced';

/** Most the number moves in one tick. */
export const UNREST_DRIFT_PER_TICK = UNREST_DRIFT_PER_DAY / TICKS_PER_DAY;

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/** Settlement ids a siege actor names this tick. */
function besiegedSettlementIds(state: GameState): Set<string> {
  const out = new Set<string>();
  for (const actor of state.graph.getNodesByType('actor')) {
    const bs = actor.properties?.battleState as { battleType?: string; settlementId?: string } | undefined;
    if (bs && bs.battleType === 'siege' && typeof bs.settlementId === 'string') out.add(bs.settlementId);
  }
  return out;
}

export interface UnrestPressureResult {
  readonly seeds: PendingEncounterSeed[];
}

/** One settlement's daily pass: the counters, the target, Restless leaving and the Lawless riot. */
function dailyPass(
  state: GameState,
  town: GraphNode,
  besieged: ReadonlySet<string>,
  pendingSeedIds: ReadonlySet<string>,
  seeds: PendingEncounterSeed[],
): void {
  const graph = state.graph;
  const tick = state.tick;
  const props = town.properties;

  // Siege memory, then hunger.
  const besiegedNow = besieged.has(town.id);
  if (besiegedNow) props[LAST_SIEGE_SEEN_PROP] = tick;
  const hunger = isHungryToday(town);
  const hungerDays = hunger.hungry ? (num(props[HUNGER_DAYS_PROP]) ?? 0) + 1 : 0;
  props[HUNGER_DAYS_PROP] = hungerDays;

  const inputs = computeUnrestInputs(town, hungerDays, besiegedNow, tick);
  const target = targetOf(inputs);
  const prevTarget = num(props[UNREST_TARGET_PROP]);
  const unrest = num(props.unrest) ?? 0;
  const band = unrestBand(unrest);
  const prevBand = typeof props.unrestBand === 'string' ? props.unrestBand : undefined;
  props[UNREST_TARGET_PROP] = target;
  props[UNREST_INPUTS_PROP] = inputs;
  props.unrestBand = band;
  if (prevTarget !== target || prevBand !== band) {
    emitTrace({
      tick,
      category: 'unrest.target',
      summary: `Unrest target at ${town.name}: ${target.toFixed(1)} (${band}; hunger ${inputs.hunger.toFixed(0)}, hungry ${hungerDays}d)`,
      locationId: town.id,
      target,
      inputs: { ...inputs },
      hungerDays,
      hungerSource: hunger.source,
      band,
    });
  }

  // Restless — people leave.
  if (isRestlessPlace(graph, town.id)) {
    const restlessDays = (num(props[RESTLESS_DAYS_PROP]) ?? 0) + 1;
    props[RESTLESS_DAYS_PROP] = restlessDays;
    if (restlessDays % RESTLESS_LEAVE_DAYS === 0) leave(state, town, inputs);
  } else if (props[RESTLESS_DAYS_PROP] !== undefined) {
    props[RESTLESS_DAYS_PROP] = 0;
  }

  // Lawless — the day a hungry town turns, its anger becomes a granary riot.
  const lawless = isLawlessPlace(graph, town.id);
  const turnedLawless = lawless && props[WAS_LAWLESS_PROP] !== true;
  if (lawless !== (props[WAS_LAWLESS_PROP] === true)) props[WAS_LAWLESS_PROP] = lawless;
  if (turnedLawless && hungerDays > 0) {
    const lastRiot = num(props[LAST_RIOT_SEED_PROP]);
    if (lastRiot === undefined || tick - lastRiot >= RIOT_SEED_COOLDOWN_DAYS * TICKS_PER_DAY) {
      const seedId = `unrest_riot_${town.id}_${tick}`;
      const targetAgentId = pendingSeedIds.has(seedId) ? undefined : pickTargetAgent(state, [town.id]);
      if (targetAgentId) {
        seeds.push({
          seedId,
          sourceEncounterId: 'unrest_pressure',
          sourceReactionId: 'lawless',
          targetAgentId,
          eligibleAfterTick: tick + SCARCITY_ARC_SEED_DELAY_TICKS,
          priority: SCARCITY_ARC_SEED_PRIORITY,
          plantedTick: tick,
          templateId: GRANARY_RIOT_TEMPLATE_ID,
          seedLabel: `${town.name} turns lawless on an empty belly`,
        });
        props[LAST_RIOT_SEED_PROP] = tick;
      }
      emitTrace({
        tick,
        category: 'unrest.riot_seed',
        summary: targetAgentId
          ? `${town.name} turns lawless while hungry: granary riot seeded for ${targetAgentId}`
          : `${town.name} turns lawless while hungry: no one there to riot`,
        locationId: town.id,
        targetAgentId: targetAgentId ?? null,
        seeded: !!targetAgentId,
      });
    }
  }
}

/** A Restless town loses a person and its most recent arrival leans away (plan § Engine 6). */
function leave(state: GameState, town: GraphNode, inputs: UnrestInputs): void {
  const graph = state.graph;
  const tick = state.tick;
  const dest = pickLeaveDestination(state, town);
  if (!dest) {
    emitTrace({
      tick, category: 'unrest.leave.none',
      summary: `${town.name} is restless, but no fed, calm town lies near enough to go to`,
      fromId: town.id, toId: null, personMoved: false, leaningAgentId: null, fleeMinted: false,
    });
    return;
  }
  const destNode = graph.getNode(dest.id);
  town.properties[LAST_LEAVE_TO_PROP] = dest.id;

  // 1. A person — only once the settlement economy counts people.
  let personMoved = false;
  const fromPop = num(town.properties.population);
  const toPop = num(destNode?.properties.population);
  if (fromPop !== undefined && toPop !== undefined && destNode) {
    if (fromPop > 1) {
      town.properties.population = fromPop - 1;
      destNode.properties.population = toPop + 1;
      personMoved = true;
    }
  } else if (town.properties[LEAVE_SKIPPED_TRACED_PROP] !== true) {
    town.properties[LEAVE_SKIPPED_TRACED_PROP] = true;
    emitTrace({
      tick, category: 'unrest.leave.skipped',
      summary: `${town.name}: no population counted yet (settlement economy not built), so only a mortal leans away`,
      fromId: town.id, toId: dest.id, personMoved: false, leaningAgentId: null, fleeMinted: false,
    });
  }

  // 2. A mortal leans — a relocation intent the movement pull scores.
  const leaningAgentId = pickLeaningMortal(graph, town, tick);
  let fleeMinted = false;
  const destHex = leaningAgentId ? resolveLocationToHex(graph, dest.id) : null;
  if (leaningAgentId && destHex) {
    const intent: RelocationIntent = {
      destinationHex: { col: destHex.col, row: destHex.row },
      destinationNodeId: dest.id,
      expiresAtTick: tick + RELOCATION_INTENT_TTL_TICKS,
      setAtTick: tick,
      source: 'unrest',
      stampResidenceOnArrival: true,
    };
    setRelocationIntent(graph, leaningAgentId, intent);
    // 3. Flee the Ravaged Land — when hunger is what drives the town.
    if (largestInput(inputs) === 'hunger') {
      const assignment = assignAmbitionToActor(graph, leaningAgentId, FLEE_AMBITION_TEMPLATE_ID, tick, {
        mintedByLabel: `Hunger drove them from ${town.name}`,
        seed: state.seed,
        followedAgentIds: state.followedAgentIds ?? [],
        projects: state.strategicState?.projects ?? [],
      });
      fleeMinted = assignment.assigned;
    }
  }

  emitTrace({
    tick, category: 'unrest.leave',
    summary: `${town.name} is restless: ${personMoved ? 'one person leaves' : 'people talk of leaving'} for ${destNode?.name ?? dest.id} (${dest.distance} hexes)`
      + (leaningAgentId ? `; ${leaningAgentId} leans that way${fleeMinted ? ' and means to flee' : ''}` : ''),
    fromId: town.id, toId: dest.id, personMoved, leaningAgentId: leaningAgentId && destHex ? leaningAgentId : null, fleeMinted,
  });
}

/**
 * Run the pressure model for one tick: the daily pass where due, then the drift.
 * Mutates settlement properties in place; returns any riot seeds to plant.
 */
export function runUnrestPressure(state: GameState): UnrestPressureResult {
  const graph = state.graph;
  const tick = state.tick;
  const seeds: PendingEncounterSeed[] = [];
  const settlements = getLocationNodes(graph)
    .filter(isPressureSettlement)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const isDay = tick % TICKS_PER_DAY === UNREST_TARGET_TICK_OFFSET;
  let besieged: Set<string> | null = null;
  let pendingSeedIds: Set<string> | null = null;

  for (const town of settlements) {
    if (isDay || num(town.properties[UNREST_TARGET_PROP]) === undefined) {
      besieged ??= besiegedSettlementIds(state);
      pendingSeedIds ??= new Set((state.pendingEncounterSeeds ?? []).map(s => s.seedId));
      try {
        dailyPass(state, town, besieged, pendingSeedIds, seeds);
      } catch (err) {
        console.warn(`[unrest] daily pass failed at ${town.id}; drift still runs`, err);
      }
    }

    // The drift — every tick, clamped (graph-op writes are unclamped).
    const target = num(town.properties[UNREST_TARGET_PROP]) ?? 0;
    const prev = num(town.properties.unrest) ?? 0;
    let next = prev;
    if (prev < target) next = Math.min(target, prev + UNREST_DRIFT_PER_TICK);
    else if (prev > target) next = Math.max(target, prev - UNREST_DRIFT_PER_TICK);
    next = Math.max(0, Math.min(100, next));
    if (next === prev && town.properties.unrest !== undefined) continue;
    if (next === 0 && prev === 0) continue;
    town.properties.unrest = next;
    emitTrace({
      tick,
      category: 'unrest_tick',
      summary: `Unrest at ${town.name}: ${prev.toFixed(1)} → ${next.toFixed(1)} (target ${target.toFixed(1)})`,
      locationId: town.id,
      locationName: town.name,
      prevUnrest: prev,
      newUnrest: next,
      decayApplied: prev - next,
      prosperityDamper: 0,
      thresholdsCrossed: [],
      target,
    });
  }

  return { seeds };
}
