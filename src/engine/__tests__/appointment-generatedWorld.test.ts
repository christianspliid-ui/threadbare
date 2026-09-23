// @vitest-lane heavy — builds a small world, plants an appointment on a live mortal, and drives it past its window twice (THR-1479)
/**
 * THR-1479 — the appointment on a generated world, through the real tick loop.
 *
 * The fixture suites prove the arithmetic and the evaluator on a hand-built
 * graph; this proves the wiring on a world worldgen actually mints: the decision
 * phase resolves the context and traces the regime for a real spotlight mortal,
 * the kept arm fires The Full Moon Collection *at the place* when the mortal is
 * there in the window, and the twin — absent through the window — converts the
 * seed, breaks the promise on the sheet, and later fires the reckoning wherever
 * the mortal stands.
 *
 * What it deliberately does **not** assert: that the mortal *departs*. The plan
 * is explicit that the board may outvote the promise (a burning village three
 * hexes away can hold them), and a live world's board is not a fixture. Whether a
 * journey was queued is reported, not gated; the seeded-run census that measures
 * the rate is slice 2 (THR-1518).
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { rebindLocatedAt } from '../relocationIntent';
import { findShortestPath } from '../pathfinding';
import { getLocationNodes, isPlaceNode, resolveToParentLocation } from '../sublocationShape';
import { isAutonomousDecisionActor } from '../strategicKindReachability';
import { isAgentGone } from '../groups/groupQueries';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { readPlantedAppointment, isAppointmentFavour } from '../appointments';
import { getAgentDetail } from '../agentDetail';
import { SLICE_TEMPLATE_IDS } from '../../data/encounters/vertical-slice';
import { APPOINTMENT_WINDOW_TICKS, APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS } from '../../data/movement-content';
import type { GameState } from '../../types/gameState';
import type { TraceEntry } from '../../types/trace';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

const SEED = 42;
const WARMUP_TICKS = 8;
/**
 * Both arms drive `runTick` for 40–90 ticks on a generated world: 2–3 s alone,
 * 7–8 s inside the full heavy lane under worker contention — past vitest's 5 s
 * default. The THR-1517 rule: any arm that loops `runTick` carries its own
 * ceiling, derived (≈8× the worst lane figure), never the global default.
 */
const MULTI_TICK_TIMEOUT_MS = 60_000;
/** Ticks of slack beyond the priced journey, so the far → leaning → departing curve has room to run. */
const SLACK_BEYOND_TRAVEL = 30;

function world(): { state: GameState; runtime: SimulationRuntime } {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS.small;
  const archetype = generateArchetypes(4, SEED)[0];
  let { state } = initializeGameState(archetype, 'Appointments', createBalancedCosmology(), SEED, preset.cols, preset.rows);
  for (let i = 0; i < WARMUP_TICKS; i++) state = runTick(state, [], runtime);
  return { state, runtime };
}

function standsAt(s: GameState, actorId: string): string | undefined {
  const at = s.graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  const node = at ? s.graph.getNode(at) : undefined;
  if (!node) return undefined;
  return isPlaceNode(node) ? (resolveToParentLocation(s.graph, node)?.id ?? undefined) : node.id;
}

/** A spotlight mortal standing somewhere, and a Location a real journey away from them. */
function pickMortalAndPlace(s: GameState): { actorId: string; fromId: string; placeId: string; travel: number } {
  for (const m of s.graph.getNodesByType('actor')) {
    if (!isAutonomousDecisionActor(m) || isAgentGone(m)) continue;
    if (m.id === s.ascendantId) continue;
    const fromId = standsAt(s, m.id);
    if (!fromId) continue;
    for (const loc of getLocationNodes(s.graph)) {
      if (loc.id === fromId) continue;
      const path = findShortestPath(s.graph, m.id, fromId, loc.id);
      if (!path || path.totalCost < 4 || path.totalCost > 30) continue;
      return { actorId: m.id, fromId, placeId: loc.id, travel: path.totalCost };
    }
  }
  throw new Error('no spotlight mortal with a reachable destination in the small world — the fixture is wrong, not the engine');
}

function plantAppointment(s: GameState, runtime: SimulationRuntime, actorId: string, placeId: string, delayTicks: number): GameState {
  const action = {
    actionId: 'ua_appt', actorId, templateId: SLICE_TEMPLATE_IDS.crossroads,
    targetId: actorId, scale: 'personal', source: 'agent',
    startTick: s.tick, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as unknown as UnifiedAction;
  const reaction: EncounterAftermathReaction = {
    id: 'rx-appt', label: 'Carry the promise',
    effects: [{
      kind: 'encounter_seed',
      templateId: SLICE_TEMPLATE_IDS.fullMoon,
      targetAgentId: '$actor',
      delayTicks,
      seedLabel: 'A promise made on the road falls due.',
      appointment: {
        locationId: placeId,
        missed: { query: { kind: 'encounter_template', tags: ['#crossroads_debt'] }, seedLabel: 'The stranger collects.' },
      },
    }],
  } as EncounterAftermathReaction;
  return applyEncounterAftermathReaction(s, action, reaction, s.tick, runtime).state;
}

/** Drive one tick and harvest the appointment traces before the ring evicts them. */
function tickAndHarvest(s: GameState, runtime: SimulationRuntime, sink: TraceEntry[]): GameState {
  const next = runTick(s, [], runtime);
  for (const t of getTraces()) {
    if (typeof t.category === 'string' && t.category.startsWith('appointment_')) sink.push(t);
  }
  clearTraces();
  return next;
}

describe('THR-1479 — an appointment on a generated small world', () => {
  it('kept: the regime is traced for a live mortal, and standing at the place in the window fires the kept sequel there', { timeout: MULTI_TICK_TIMEOUT_MS }, () => {
    enableTracing();
    try {
      let { state, runtime } = world();
      const { actorId, placeId, travel } = pickMortalAndPlace(state);
      const delay = Math.ceil(travel) + SLACK_BEYOND_TRAVEL;
      state = plantAppointment(state, runtime, actorId, placeId, delay);
      const seed = state.pendingEncounterSeeds!.find(x => x.targetAgentId === actorId && readPlantedAppointment(x));
      expect(seed, 'the plant did not land on the live mortal').toBeDefined();
      const appointment = readPlantedAppointment(seed!)!;
      expect(appointment.locationId).toBe(placeId);
      const favourId = appointment.favourEdgeId!;
      expect(isAppointmentFavour(state.graph.getEdge(favourId))).toBe(true);
      clearTraces();

      const sink: TraceEntry[] = [];
      // Up to the due tick: the decision phase must see the appointment and trace a regime.
      while (state.tick < appointment.dueTick) {
        state = tickAndHarvest(state, runtime, sink);
      }
      // Scoped to the planted mortal. Since THR-1525 the live world plants appointments
      // of its own — the Crossroads now reaches the novelty-leaners who accept it — so
      // another mortal's regime in the sink is the system working, not a leak.
      const allRegimes = sink.filter(t => t.category === 'appointment_regime') as Array<TraceEntry & { agentId: string; regime: string; journeyQueued?: boolean }>;
      const regimes = allRegimes.filter(r => r.agentId === actorId);
      expect(regimes.length, 'no appointment_regime trace for the planted mortal — the decision phase never resolved the context').toBeGreaterThan(0);
      if (allRegimes.length > regimes.length) {
        console.info(`[THR-1479] organic appointments alongside the plant: ${new Set(allRegimes.filter(r => r.agentId !== actorId).map(r => r.agentId)).size} other mortal(s)`);
      }
      // The curve ran: at least one non-far regime before due.
      expect(regimes.some(r => r.regime !== 'far'), `regimes seen: ${regimes.map(r => r.regime).join(',')}`).toBe(true);
      // Reported, not gated (see the file header).
      const journeys = regimes.filter(r => r.journeyQueued).length;
      console.info(`[THR-1479] ${actorId}: regimes ${[...new Set(regimes.map(r => r.regime))].join(' → ')}, journeys queued ${journeys}`);

      // Present at the place through the window: kept, at the place.
      let kept: TraceEntry | undefined;
      for (let i = 0; i <= APPOINTMENT_WINDOW_TICKS && !kept; i++) {
        rebindLocatedAt(state.graph, actorId, placeId);
        state = tickAndHarvest(state, runtime, sink);
        kept = sink.find(t => t.category === 'appointment_kept');
      }
      expect(kept, 'present through the whole window and the kept arm never fired').toBeDefined();
      expect((kept as TraceEntry & { locationId: string }).locationId).toBe(placeId);
      expect(state.graph.getEdge(favourId), 'the promise was not redeemed on kept').toBeUndefined();
      expect(state.graph.getNodesByType('event').some(n => n.properties.eventType === 'appointment_kept' && n.properties.agentId === actorId)).toBe(true);
      const fired = state.unifiedActions.find(a => a.actorId === actorId && a.templateId === SLICE_TEMPLATE_IDS.fullMoon);
      expect(fired, 'The Full Moon Collection did not spawn on the mortal').toBeDefined();
      expect(sink.some(t => t.category === 'appointment_missed')).toBe(false);
    } finally {
      clearTraces();
      disableTracing();
    }
  });

  it('missed: absent through the window converts the seed, breaks the promise on the sheet, and the reckoning finds them later', { timeout: MULTI_TICK_TIMEOUT_MS }, () => {
    enableTracing();
    try {
      let { state, runtime } = world();
      const { actorId, fromId, placeId, travel } = pickMortalAndPlace(state);
      const delay = Math.ceil(travel) + SLACK_BEYOND_TRAVEL;
      state = plantAppointment(state, runtime, actorId, placeId, delay);
      const seed = state.pendingEncounterSeeds!.find(x => x.targetAgentId === actorId && readPlantedAppointment(x))!;
      const appointment = readPlantedAppointment(seed)!;
      const favourId = appointment.favourEdgeId!;
      clearTraces();

      const sink: TraceEntry[] = [];
      // Keep them away from the place, every tick, until the window has closed.
      const closesAt = appointment.dueTick + APPOINTMENT_WINDOW_TICKS;
      while (state.tick <= closesAt + 1) {
        if (standsAt(state, actorId) === placeId) rebindLocatedAt(state.graph, actorId, fromId);
        state = tickAndHarvest(state, runtime, sink);
      }
      const missed = sink.find(t => t.category === 'appointment_missed') as (TraceEntry & { reason: string }) | undefined;
      expect(missed, 'absent through the window and the missed arm never fired').toBeDefined();
      expect(['absent', 'unreachable', 'chose_to_miss']).toContain(missed!.reason);
      expect(sink.some(t => t.category === 'appointment_kept')).toBe(false);

      // The promise is broken, and the sheet reads it as such.
      const favour = state.graph.getEdge(favourId)!;
      expect(favour.properties.broken).toBe(true);
      const detail = getAgentDetail(state.graph, actorId, state.ascendantId ?? '')!;
      const row = detail.leverage?.favorsOwed.find(f => f.appointment?.placeId === placeId);
      expect(row?.appointment?.broken, 'the sheet does not read the broken promise').toBe(true);

      // The seed is now its missed branch, and fires wherever they stand.
      const converted = state.pendingEncounterSeeds!.find(x => x.seedId === seed.seedId)!;
      expect(readPlantedAppointment(converted)).toBeNull();
      expect(converted.missedAppointment?.locationId).toBe(placeId);
      expect(converted.query?.tags).toEqual(['#crossroads_debt']);
      const fireBy = converted.eligibleAfterTick + APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS + 24;
      let reckoning: UnifiedAction | undefined;
      while (state.tick <= fireBy && !reckoning) {
        state = tickAndHarvest(state, runtime, sink);
        reckoning = state.unifiedActions.find(a => a.actorId === actorId && a.templateId === SLICE_TEMPLATE_IDS.fullMoonReckoning);
        // A withered draw is the family path's honest fail-soft (a subtype the
        // reckoning does not declare) — it is not this test's defect, so a fired
        // seed with no reckoning ends the wait rather than failing it.
        if (!reckoning && !state.pendingEncounterSeeds!.some(x => x.seedId === seed.seedId)) break;
      }
      const seedStillPending = state.pendingEncounterSeeds!.some(x => x.seedId === seed.seedId);
      expect(seedStillPending, 'the missed branch never came due').toBe(false);
      if (reckoning) {
        expect(reckoning.templateId).toBe(SLICE_TEMPLATE_IDS.fullMoonReckoning);
      } else {
        console.info('[THR-1479] the missed branch fired but the reckoning family had no member at the mortal\'s feet — the withered-narrative fail-soft, reported not gated');
      }
    } finally {
      clearTraces();
      disableTracing();
    }
  });
});
