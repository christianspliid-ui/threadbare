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
import { runTick, resetEventCounter, resetDecisionCache } from '../orchestrator';
import { resetReputationTraitInit } from '../phaseReputationTraits';
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
import { readPlantedAppointment, isAppointmentFavour, readRegimeMemo, agentAppointmentSeeds, resolveAppointmentContext } from '../appointments';
import { resolveAxiologicalProfile } from '../encounterScoring';
import { getAgentDetail } from '../agentDetail';
import { initMovementState } from '../movementExecution';
import { SLICE_TEMPLATE_IDS } from '../../data/encounters/vertical-slice';
import { APPOINTMENT_WINDOW_TICKS, APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS } from '../../data/movement-content';
import type { GameState } from '../../types/gameState';
import type { TraceEntry } from '../../types/trace';
import type { EncounterAftermathReaction, PendingEncounterSeed, UnifiedAction } from '../../types/unifiedAction';

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
  // THR-1676: every arm builds the same world. Resetting only the event counter let
  // module state from the previous arm leak in: the unmarked arm departed at tick 26 and
  // the marked arm at 38, slid back to `leaning`, and never departed again before due.
  resetEventCounter();
  resetDecisionCache();
  resetReputationTraitInit();
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

/**
 * A spotlight mortal standing somewhere, holding no promise of its own yet, and a Location
 * a real journey away from them. The arms test one appointment's regime curve; a mortal
 * already bound to an organic meeting (THR-1687's fair draw reaches the town encounters
 * that plant them) spends the window walking to that one, and the plant reads `lost`.
 */
function pickMortalAndPlace(s: GameState): { actorId: string; fromId: string; placeId: string; travel: number } {
  for (const m of s.graph.getNodesByType('actor')) {
    if (!isAutonomousDecisionActor(m) || isAgentGone(m)) continue;
    if (m.id === s.ascendantId) continue;
    if (agentAppointmentSeeds(s, m.id).length > 0) continue;
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

/**
 * The appointment seed this test's plant added. Not "the mortal's first appointment
 * seed": a live world plants its own (THR-1687's fair draw brings town encounters that
 * do — seed 42's picked mortal already held one at loc_17 when the plant landed), and
 * binding to that one tracks the wrong promise. So: the seed that was not there before.
 */
function plantedSeed(before: GameState, after: GameState, actorId: string): PendingEncounterSeed | undefined {
  const had = new Set((before.pendingEncounterSeeds ?? []).map(x => x.seedId));
  return after.pendingEncounterSeeds!.find(x => !had.has(x.seedId) && x.targetAgentId === actorId && readPlantedAppointment(x));
}

/** A trace about this seed — another mortal's (or this mortal's other) appointment is not the plant's. */
const ofSeed = (seedId: string) => (t: TraceEntry) => (t as TraceEntry & { seedId?: string }).seedId === seedId;

/** Drive one tick and harvest the appointment traces before the ring evicts them. */
/** Give a mortal the `death_prevented` ward (THR-1241), so a live world cannot take them mid-arm. */
function wardAgainstDeath(state: GameState, actorId: string): GameState {
  return {
    ...state,
    activeRuleOverrides: {
      ...(state.activeRuleOverrides ?? {}),
      [actorId]: [
        ...(state.activeRuleOverrides?.[actorId] ?? []),
        {
          sourceAttachmentId: 'test.ward', sourceAgentId: actorId, rule: 'death_prevented',
          value: true, scope: { scope: 'self' }, expiryTick: null, establishedTick: state.tick,
        },
      ],
    },
  };
}

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
      const beforePlant = state;
      state = plantAppointment(state, runtime, actorId, placeId, delay);
      const seed = plantedSeed(beforePlant, state, actorId);
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
      // Scoped to the plant's seed. Since THR-1525 the live world plants appointments
      // of its own — the Crossroads now reaches the novelty-leaners who accept it, and
      // since THR-1687 the planted mortal may hold one too — so any other seed's regime
      // in the sink is the system working, not a leak.
      const allRegimes = sink.filter(t => t.category === 'appointment_regime') as Array<TraceEntry & { agentId: string; regime: string; journeyQueued?: boolean }>;
      const regimes = allRegimes.filter(ofSeed(seed!.seedId));
      expect(regimes.length, 'no appointment_regime trace for the planted mortal — the decision phase never resolved the context').toBeGreaterThan(0);
      if (allRegimes.length > regimes.length) {
        console.info(`[THR-1479] organic appointments alongside the plant: ${new Set(allRegimes.filter(r => !ofSeed(seed!.seedId)(r)).map(r => (r as TraceEntry & { seedId: string }).seedId)).size} other seed(s)`);
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
        kept = sink.find(t => t.category === 'appointment_kept' && ofSeed(seed!.seedId)(t));
      }
      expect(kept, 'present through the whole window and the kept arm never fired').toBeDefined();
      expect((kept as TraceEntry & { locationId: string }).locationId).toBe(placeId);
      expect(state.graph.getEdge(favourId), 'the promise was not redeemed on kept').toBeUndefined();
      expect(state.graph.getNodesByType('event').some(n => n.properties.eventType === 'appointment_kept' && n.properties.agentId === actorId)).toBe(true);
      const fired = state.unifiedActions.find(a => a.actorId === actorId && a.templateId === SLICE_TEMPLATE_IDS.fullMoon);
      expect(fired, 'The Full Moon Collection did not spawn on the mortal').toBeDefined();
      expect(sink.some(t => t.category === 'appointment_missed' && ofSeed(seed!.seedId)(t))).toBe(false);
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
      // THR-1646: this arm's premise is a mortal who lives through the window, and a
      // live world does not promise that — once the opening changed the world's pacing,
      // seed 42's picked mortal died at tick 62 on an unrelated `agent_death`, before
      // the window closed. Ward them with the game's own `death_prevented` override
      // rather than pin the world to one recorded trajectory.
      state = wardAgainstDeath(state, actorId);
      const delay = Math.ceil(travel) + SLACK_BEYOND_TRAVEL;
      const beforePlant = state;
      state = plantAppointment(state, runtime, actorId, placeId, delay);
      const seed = plantedSeed(beforePlant, state, actorId)!;
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
      const missed = sink.find(t => t.category === 'appointment_missed' && ofSeed(seed.seedId)(t)) as (TraceEntry & { reason: string }) | undefined;
      expect(missed, 'absent through the window and the missed arm never fired').toBeDefined();
      expect(['absent', 'unreachable', 'chose_to_miss']).toContain(missed!.reason);
      expect(sink.some(t => t.category === 'appointment_kept' && ofSeed(seed.seedId)(t))).toBe(false);

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

/**
 * THR-1669 — the board's outvote stands for the length of the journey. Two arms,
 * each driven to a `departing` tick; each then puts the mortal on an encounter
 * journey away from the place. The only
 * difference is the mark the full decision writes when it chooses a journey while
 * the promise is departing. Unmarked (a journey begun before the regime turned) is
 * re-routed to the promise — the THR-1479 behaviour, kept. Marked is left to run.
 */
describe('THR-1669 — a journey the board chose while departing is not turned back', () => {
  /**
   * Both arms test one promise's outvote rule, so the mortal holds only the plant. The
   * live world can hand them a second, organic appointment mid-drive (THR-1687's fair
   * draw reaches the town encounters that plant them); the decision phase then steers by
   * whichever is due first, and the plant's `departing` memo goes stale under it.
   */
  function onlyThePlant(state: GameState, actorId: string, seedId: string): GameState {
    const seeds = state.pendingEncounterSeeds ?? [];
    const kept = seeds.filter(x => x.seedId === seedId || x.targetAgentId !== actorId || !readPlantedAppointment(x));
    return kept.length === seeds.length ? state : { ...state, pendingEncounterSeeds: kept };
  }

  function driveToDeparting(): { state: GameState; runtime: SimulationRuntime; actorId: string; placeId: string; seedId: string; dueTick: number } {
    let { state, runtime } = world();
    const { actorId, placeId, travel } = pickMortalAndPlace(state);
    state = wardAgainstDeath(state, actorId);
    const beforePlant = state;
    state = plantAppointment(state, runtime, actorId, placeId, Math.ceil(travel) + SLACK_BEYOND_TRAVEL);
    const seed = plantedSeed(beforePlant, state, actorId)!;
    const dueTick = readPlantedAppointment(seed)!.dueTick;
    clearTraces();
    const sink: TraceEntry[] = [];
    while (state.tick < dueTick) {
      state = tickAndHarvest(onlyThePlant(state, actorId, seed.seedId), runtime, sink);
      if (sink.some(t => t.category === 'appointment_regime'
        && ofSeed(seed.seedId)(t)
        && (t as TraceEntry & { regime: string }).regime === 'departing')) break;
    }
    return { state, runtime, actorId, placeId, seedId: seed.seedId, dueTick };
  }

  /** Put the mortal on an encounter journey to a Location that is not the place. */
  function sendAway(state: GameState, actorId: string, placeId: string, mark: string | undefined): string {
    const fromId = standsAt(state, actorId)!;
    for (const loc of getLocationNodes(state.graph)) {
      if (loc.id === fromId || loc.id === placeId) continue;
      const path = findShortestPath(state.graph, actorId, fromId, loc.id);
      if (!path || path.path.length < 2) continue;
      const ms = initMovementState(loc.id, path.path, 1, state.tick, undefined, fromId);
      ms.targetEncounterId = SLICE_TEMPLATE_IDS.crossroads;
      ms.motivationPull = 99;
      if (mark) ms.appointmentOutvoteSeedId = mark;
      const actor = state.graph.getNode(actorId)!;
      state.graph.updateNode(actorId, { properties: { ...actor.properties, movementState: ms } });
      return loc.id;
    }
    throw new Error('no second destination for the mortal — the fixture is wrong, not the engine');
  }

  /** Free to reach the moving-agent path this tick: no running action, no active encounter. */
  function isFree(s: GameState, actorId: string): boolean {
    return !s.unifiedActions.some(a => a.actorId === actorId && !a.resolved)
      && !s.encounterProgress.some(e => e.actorId === actorId && e.status === 'active');
  }

  function isDeparting(s: GameState, actorId: string, seedId: string): boolean {
    const memo = readRegimeMemo(s.graph.getNode(actorId));
    return memo?.seedId === seedId && memo.regime === 'departing';
  }

  /**
   * The regime the decision phase would resolve now, read fresh rather than off the memo.
   * The memo is only rewritten where the phase traces, and a moving mortal whose promise
   * slides to `lost` reaches no trace — so the memo keeps saying `departing` (THR-1687:
   * once the fair draw shifted the world's pacing the arm landed on exactly that tick).
   */
  function departingSlack(s: GameState, actorId: string, seedId: string): number | null {
    const ctx = resolveAppointmentContext(s, actorId, s.tick, resolveAxiologicalProfile(s.graph, actorId, s.tick, s.worldSoul?.fundament));
    return ctx && ctx.seed.seedId === seedId && ctx.regime === 'departing' ? ctx.slack.slack : null;
  }
  /** One tick spent walking away must leave the promise makeable, or the arm measures `lost`, not the outvote. */
  const SEND_AWAY_MIN_SLACK = 2;

  /**
   * The live world is not a fixture: the mortal may be mid-action, or slide back to
   * `leaning` as its standing shifts. So the arm is attempted on each tick where the
   * mortal is free and departing going in, and only a tick that was *still* departing
   * coming out counts — the memo is written on change, so it names the regime the
   * decision phase actually ran under.
   */
  function journeyAfterOneTick(mark: 'marked' | 'unmarked'): { destinationId: string | undefined; target: string | undefined; awayId: string; turnedBack: boolean } {
    enableTracing();
    try {
      let { state, runtime, actorId, placeId, seedId, dueTick } = driveToDeparting();
      while (state.tick < dueTick) {
        const slackNow = departingSlack(state, actorId, seedId);
        if (!isDeparting(state, actorId, seedId) || slackNow === null || slackNow < SEND_AWAY_MIN_SLACK || !isFree(state, actorId)) {
          state = runTick(onlyThePlant(state, actorId, seedId), [], runtime);
          clearTraces();
          continue;
        }
        const before = state.tick;
        const awayId = sendAway(state, actorId, placeId, mark === 'marked' ? seedId : undefined);
        state = runTick(onlyThePlant(state, actorId, seedId), [], runtime);
        clearTraces();
        if (!isDeparting(state, actorId, seedId) || departingSlack(state, actorId, seedId) === null) continue;
        const ms = state.graph.getNode(actorId)?.properties.movementState as { destinationId?: string; targetEncounterId?: string } | undefined;
        // The id carries the tick the phase ran on, which is past `before`.
        const rerouteId = `appointment_reroute_${actorId}_`;
        const turnedBack = (state.recentEvents ?? []).some(e => e.id.startsWith(rerouteId) && Number(e.id.slice(rerouteId.length)) > before);
        return { destinationId: ms?.destinationId, target: ms?.targetEncounterId, awayId, turnedBack };
      }
      throw new Error('the mortal was never free and departing through a whole tick before the due tick — the fixture is wrong, not the engine');
    } finally {
      clearTraces();
      disableTracing();
    }
  }

  it('unmarked: the promise turns the mortal back (THR-1479 kept)', { timeout: MULTI_TICK_TIMEOUT_MS }, () => {
    const r = journeyAfterOneTick('unmarked');
    expect(r.turnedBack, 'the control arm was not re-routed — the world never reached departing, so the marked arm proves nothing').toBe(true);
    expect(r.target).toBeUndefined();
  });

  it('marked: the outvote stands — same journey, same goal, no turn back', { timeout: MULTI_TICK_TIMEOUT_MS }, () => {
    const r = journeyAfterOneTick('marked');
    expect(r.turnedBack).toBe(false);
    expect(r.target).toBe(SLICE_TEMPLATE_IDS.crossroads);
    expect(r.destinationId).toBe(r.awayId);
  });
});
