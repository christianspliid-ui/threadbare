/**
 * THR-1560 — Hunts H2: the hunt (plan doc `Docs/plans/2026-09-23-hunts.md`).
 *
 * The slice's Done-when, on hand-built worlds whose one relevant fact is the thing
 * under test — every refusal paired with the arm that does fire, on the same fixture
 * with one field changed:
 *
 * - who may hunt: the three reason doors (a scar, a grievance, a den near home), and
 *   the mortal with none refused;
 * - who is offered one: the candidate walk, not just the gate — a vengeance mortal
 *   leaning Iron is offered `cell.destroy.monster`, a reasoned beast beyond the eight
 *   nearest is still offered, and a dead beast never is;
 * - tracking: the `hidden_weakness` mark and the revealed temper; a second tracking
 *   of one beast refused;
 * - the deferred payoff: completing a hunt under a grievance writes no outcome node and
 *   leaves the grievance open; the beast's death closes it; another vengeance project
 *   never closes a beast's grievance;
 * - the confront: planted at the lair, aimed at the beast, owed to the lair, passing
 *   every appointment reader; kept end to end through `evaluateEncounterSeeds`; missed
 *   into `hunt.trail_cold` where the hunter stands; dropped (favour released first)
 *   when the lair is gone; a refused plant pushes no seed;
 * - one confront per beast per hunter; a dead hunter refused; the encounter hunt hidden
 *   from a hunter waiting with a live appointment; M4 skips an appointment-keeper;
 *   `hunt.trail_cold` never drawn; a beast's mark never pressed into a favour;
 * - the two tags resolve their one template each through `resolveContentQuery`.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { StrategicActionCandidate, StrategicProjectRuntime } from '../../../types/strategicAction';
import type { PendingEncounterSeed } from '../../../types/unifiedAction';
import { huntReason, liveHuntFavourAt } from '../hunts';
import { checkLairArrival } from '../lairArrivalTrigger';
import {
  getUndertakingObjectType,
  eligibilityRefusal,
} from '../../../data/undertaking-objects';
import { getCellTemplate, UNDERTAKING_CELL_APPOINTMENTS } from '../../../data/undertaking-cells';
import { evaluateMotiveGate } from '../../undertakingMotive';
import { generateStrategicCandidates } from '../../strategicActionCandidates';
import { advanceStrategicProjects, maybePlantAppointmentPayoff } from '../../strategicActionLifecycle';
import { evaluateEncounterSeeds } from '../../encounterSeeding';
import {
  agentAppointmentSeeds,
  readPlantedAppointment,
  resolveAppointmentContext,
} from '../../appointments';
import { findActiveGrievanceEdge, grievanceClosesOnCompletion } from '../../grievance/grievanceLifecycle';
import { evaluateGraphCondition } from '../../graphConditions';
import { generateUnifiedCandidates } from '../../unifiedCandidates';
import { createSimulationRuntime } from '../../simulationRuntime';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { resolveContentQuery } from '../../contentQuery';
import { staticContentCatalogs } from '../../contentCatalogView';
import { mulberry32 } from '../../../lib/prng';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { FIGHT_LAIR_CONFRONT_ID } from '../../../data/encounters/fight-lair-confront';
import { HUNT_TRAIL_COLD_ID } from '../../../data/encounters/hunt-trail-cold';
import {
  APPOINTMENT_MAX_PER_MORTAL,
  APPOINTMENT_WINDOW_TICKS,
  APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS,
} from '../../../data/movement-content';
import {
  HUNT_APPOINTMENT_DELAY_TICKS,
  HUNT_TRACK_SECRET_TYPE,
  STRATEGIC_TARGET_SCAN_CAPS,
} from '../../../data/strategic-action-constants';

const HUNT = 'cell.destroy.monster';
const TRACK = 'cell.observe.monster';
const HUNTER = 'actor.hunter';
const BEAST = 'beast';
const LAIR = 'lair';
const TOWN = 'town';
const TICK = 50;

const FULL_CAPS = { iron: 60, shadow: 40, eye: 10, gold: 10, heart: 10, stone: 10, star: 10, veil: 10 };

function stateFor(graph: WorldGraph, over: Partial<GameState> = {}): GameState {
  return {
    cycle: 1, tick: TICK, phase: 'playing', seed: 42, graph,
    cosmology: { spheres: {} } as never, tiles: [], clock: { currentTick: TICK } as never,
    ascendantId: 'ascendant', ascendantIdentity: null, essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [], stealthExposure: 0,
    visibilityMap: new Map() as never, familiarityMap: new Map() as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
    pendingEncounterSeeds: [],
    effectStates: new Map(),
    strategicState: { projects: [], controls: [], history: [] },
    ...over,
  } as unknown as GameState;
}

/** A beast in its lair at `(col,row)`. */
function addBeast(graph: WorldGraph, id: string, lairId: string, col: number, row: number, opts: { dead?: boolean } = {}): void {
  graph.addNode({
    id: lairId, type: 'location', name: `Den of ${id}`,
    properties: { locationSubtype: 'lair', lairTier: 'major', hexCol: col, hexRow: row, namedEliteId: id },
  });
  graph.addNode({
    id, type: 'actor', name: `Beast ${id}`,
    properties: {
      actorType: 'individual', isMonsterElite: true, lairId,
      monsterState: { family: 'beast', dread: 'fair', might: 'steep', clockSize: 4, clockFilled: 0, clockUpdatedTick: 0, temperShown: false },
      ...(opts.dead ? { deceased: true } : {}),
    },
  });
  graph.addEdge({ id: `e.${id}.at`, source: id, target: lairId, type: 'located_at', properties: {} });
}

/**
 * A hunter living in a town at (0,0) and one beast in its lair at (6,0) — far from
 * home, so the den-near-home door is shut unless a test moves the town.
 */
function huntWorld(opts: { hunterProps?: Record<string, unknown>; lairCol?: number } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: TOWN, type: 'location', name: 'Ashford', properties: { locationSubtype: 'town', hexCol: 0, hexRow: 0 } });
  graph.addNode({
    id: HUNTER, type: 'actor', name: 'Maret',
    properties: {
      actorType: 'individual', spotlightTier: 'spotlight', domainCapabilities: FULL_CAPS,
      originLocationId: TOWN,
      ...opts.hunterProps,
    },
  });
  graph.addEdge({ id: 'e.hunter.at', source: HUNTER, target: TOWN, type: 'located_at', properties: {} });
  addBeast(graph, BEAST, LAIR, opts.lairCol ?? 6, 0);
  return graph;
}

function scar(graph: WorldGraph, from = HUNTER, to = BEAST): void {
  graph.addEdge({ id: `e.hostile.${from}.${to}`, source: from, target: to, type: 'hostile_to', properties: { cause: 'blood_drawn', since: 1 } });
}

/** An active grievance (`ambition_seek_revenge` by default) naming `culprit`. */
function grieve(graph: WorldGraph, culprit = BEAST, templateId = 'ambition_seek_revenge'): string {
  const nodeId = `ambition.${templateId}`;
  if (!graph.getNode(nodeId)) graph.addNode({ id: nodeId, type: 'ambition', name: templateId, properties: { templateId } });
  const edgeId = `pursues_${HUNTER}_${nodeId}`;
  graph.addEdge({
    id: edgeId, source: HUNTER, target: nodeId, type: 'pursues',
    properties: {
      priority: 'primary', status: 'active', assignedTick: 0, completedMilestones: [],
      grievance: true, culpritAgentId: culprit, harmMagnitude: 0.8, chainDepth: 0, heat: 1,
    },
  });
  return edgeId;
}

const monsterType = () => getUndertakingObjectType('monster')!;
const beastHandle = { kind: 'node' as const, nodeId: BEAST };

function candidate(over: Partial<StrategicActionCandidate> = {}): StrategicActionCandidate {
  return {
    candidateId: 'cand_hunt', templateId: HUNT, ambitionId: 'ambition_seek_revenge', actorId: HUNTER,
    verb: 'destroy', executionMode: 'multi_tick_project', behaviorFamily: 'warlord-expansion',
    displayName: 'Hunt a monster', targetNodeId: BEAST,
    objectHandle: beastHandle, objectTypeId: 'monster',
    ...over,
  } as StrategicActionCandidate;
}

function moveTo(graph: WorldGraph, actorId: string, locationId: string): void {
  for (const e of graph.getOutgoingEdges(actorId, 'located_at')) graph.removeEdge(e.id);
  graph.addEdge({ id: `e.${actorId}.at.${locationId}`, source: actorId, target: locationId, type: 'located_at', properties: {} });
}

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); });

// ─── Who may hunt: the three doors ──────────────────────────────────

describe('the reason doors', () => {
  const huntTemplate = () => getCellTemplate(HUNT)!;

  it('a scarred mortal (blood_drawn toward the beast) is admitted, and the board records why', () => {
    const graph = huntWorld();
    scar(graph);
    expect(huntReason(graph, HUNTER, BEAST)).toBe('blood_drawn');
    const gate = evaluateMotiveGate(graph, HUNTER, BEAST, huntTemplate(), beastHandle);
    expect(gate.allowed).toBe(true);
    expect(gate.exempt).toBe('blood_drawn');
  });

  it('a bereaved mortal (a pursues naming the beast) is admitted', () => {
    const graph = huntWorld();
    grieve(graph);
    expect(huntReason(graph, HUNTER, BEAST)).toBe('grievance');
    expect(evaluateMotiveGate(graph, HUNTER, BEAST, huntTemplate(), beastHandle).exempt).toBe('grievance');
  });

  it('a mortal living within two hexes of the lair is admitted', () => {
    const graph = huntWorld({ lairCol: 2 });
    expect(huntReason(graph, HUNTER, BEAST)).toBe('threat_radius');
    expect(evaluateMotiveGate(graph, HUNTER, BEAST, huntTemplate(), beastHandle).allowed).toBe(true);
  });

  it('a mortal with none of these is refused — the one field changed: the lair is three hexes further', () => {
    const graph = huntWorld({ lairCol: 6 });
    expect(huntReason(graph, HUNTER, BEAST)).toBeNull();
    const gate = evaluateMotiveGate(graph, HUNTER, BEAST, huntTemplate(), beastHandle);
    expect(gate.allowed).toBe(false);
    expect(gate.exempt).toBeUndefined();
  });

  it('a grievance against somebody else opens no door on the beast', () => {
    const graph = huntWorld();
    graph.addNode({ id: 'actor.other', type: 'actor', name: 'Other', properties: { actorType: 'individual' } });
    grieve(graph, 'actor.other');
    expect(huntReason(graph, HUNTER, BEAST)).toBeNull();
  });
});

// ─── Who is offered one: the candidate walk ─────────────────────────

describe('the candidate board', () => {
  /** An active ambition edge for the hunter (no grievance block). */
  function pursue(graph: WorldGraph, templateId: string): void {
    const nodeId = `ambition.${templateId}`;
    graph.addNode({ id: nodeId, type: 'ambition', name: templateId, properties: { templateId } });
    graph.addEdge({ id: `pursues_${HUNTER}_${nodeId}`, source: HUNTER, target: nodeId, type: 'pursues', properties: { priority: 'primary', status: 'active', assignedTick: 0, completedMilestones: [] } });
  }

  function board(graph: WorldGraph, ambitionIds: string[]) {
    return generateStrategicCandidates(graph, HUNTER, ambitionIds, { projects: [], controls: [], history: [] }, TICK, mulberry32(7), undefined, 'cells');
  }

  it('offers a hunt cell to a survival mortal leaning Iron — the division rule, not a hand list', () => {
    const graph = huntWorld();
    scar(graph);
    // `ambition_escape_cursed_land` (survival: observe, raise, destroy) names no hunt
    // cell in its hand list, so the offer below is the derivation: Iron × destroy.
    expect(getCellTemplate(HUNT)).toBeDefined();
    pursue(graph, 'ambition_escape_cursed_land');
    const result = board(graph, ['ambition_escape_cursed_land']);
    const hunts = result.candidates.filter(c => c.templateId === HUNT);
    expect(hunts.map(c => c.targetNodeId)).toContain(BEAST);
    expect(result.rejections.some(r => r.templateId === HUNT && r.reason === 'gate_exempt:blood_drawn')).toBe(true);
  });

  it('the same mortal with no reason is refused on the board by name', () => {
    const graph = huntWorld();
    pursue(graph, 'ambition_escape_cursed_land');
    const result = board(graph, ['ambition_escape_cursed_land']);
    expect(result.candidates.some(c => c.templateId === HUNT)).toBe(false);
    expect(result.rejections.some(r => r.templateId === HUNT && r.reason.startsWith('no_motive'))).toBe(true);
  });

  it('a reasoned beast beyond the eight nearest monsters is still offered (the monster scan cap)', () => {
    const graph = huntWorld({ lairCol: 30 });
    // Ten beasts nearer than the hunted one, none of them a reason to hunt.
    for (let i = 0; i < 10; i++) addBeast(graph, `near_${i}`, `lair_near_${i}`, 3 + i, 0);
    grieve(graph);
    expect(STRATEGIC_TARGET_SCAN_CAPS.monster).toBeGreaterThan(STRATEGIC_TARGET_SCAN_CAPS.object);
    const result = board(graph, ['ambition_seek_revenge']);
    expect(result.candidates.filter(c => c.templateId === HUNT).map(c => c.targetNodeId)).toContain(BEAST);
  });

  it('a hunt never forms against a dead beast, reason or not', () => {
    const graph = huntWorld();
    grieve(graph);
    graph.updateNode(BEAST, { properties: { ...graph.getNode(BEAST)!.properties, deceased: true } });
    const result = board(graph, ['ambition_seek_revenge']);
    expect(result.candidates.some(c => c.templateId === HUNT || c.templateId === TRACK)).toBe(false);
  });
});

// ─── Eligibility ────────────────────────────────────────────────────

describe('eligibility', () => {
  it('a dead hunter is refused (hunter_gone) — for both verbs', () => {
    const graph = huntWorld({ hunterProps: { deceased: true } });
    expect(eligibilityRefusal(graph, monsterType(), 'destroy', HUNTER, beastHandle, TICK)).toBe('hunter_gone');
    expect(eligibilityRefusal(graph, monsterType(), 'observe', HUNTER, beastHandle, TICK)).toBe('hunter_gone');
    const alive = huntWorld();
    expect(eligibilityRefusal(alive, monsterType(), 'destroy', HUNTER, beastHandle, TICK)).toBeNull();
  });

  it('tracking mints a hidden_weakness mark and reveals the temper; a second tracking is refused', () => {
    const graph = huntWorld();
    const state = stateFor(graph);
    const observe = monsterType().verbs.observe as (ctx: never) => { success: boolean; op: string };
    const result = observe({ state, graph, actorId: HUNTER, handle: beastHandle, tick: TICK } as never);
    expect(result.success).toBe(true);
    const mark = graph.getOutgoingEdges(HUNTER, 'knows_secret_of').find(e => e.target === BEAST);
    expect(mark?.properties.secretType).toBe(HUNT_TRACK_SECRET_TYPE);
    expect((graph.getNode(BEAST)!.properties.monsterState as { temperShown?: boolean }).temperShown).toBe(true);
    expect(getTraces().some(t => t.category === 'hunt.tracked')).toBe(true);
    expect(eligibilityRefusal(graph, monsterType(), 'observe', HUNTER, beastHandle, TICK)).toBe('already_tracked');
  });

  it('the beast\'s mark can never be pressed into a favour', () => {
    const graph = huntWorld();
    const observe = monsterType().verbs.observe as (ctx: never) => unknown;
    observe({ state: stateFor(graph), graph, actorId: HUNTER, handle: beastHandle, tick: TICK } as never);
    const mark = graph.getOutgoingEdges(HUNTER, 'knows_secret_of').find(e => e.target === BEAST)!;
    const agreement = getUndertakingObjectType('agreement')!;
    expect(eligibilityRefusal(graph, agreement, 'use', HUNTER, { kind: 'edge', edgeId: mark.id }, TICK)).toBe('no_favour_from_beasts');
  });
});

// ─── The deferred payoff ────────────────────────────────────────────

describe('completing a hunt defers its harm', () => {
  function project(templateId: string, over: Partial<StrategicProjectRuntime> = {}): StrategicProjectRuntime {
    return {
      projectId: 'proj_hunt', actorId: HUNTER, templateId,
      ambitionId: 'ambition_seek_revenge', verb: 'destroy', behaviorFamily: 'warlord-expansion',
      targetNodeId: BEAST, objectHandle: beastHandle, objectTypeId: 'monster', objectTier: 2,
      originLocationId: TOWN, progress: 7, progressRequired: 8, startedTick: 2, lastProgressTick: 9,
      status: 'active',
      ...over,
    } as StrategicProjectRuntime;
  }

  function run(p: StrategicProjectRuntime, seed: number) {
    const graph = huntWorld();
    grieve(graph);
    const state = stateFor(graph, { seed, tick: 10, strategicState: { projects: [p], controls: [], history: [] } });
    const result = advanceStrategicProjects(state, graph, 10, mulberry32(42));
    return { graph, state, result, status: result.strategicState.projects[0]!.status };
  }

  const outcomeNodes = (graph: WorldGraph) => graph.getNodesByType('event').filter(n => n.properties.eventType === 'undertaking_outcome');

  const COMPLETING_SEED = (() => {
    for (let s = 1; s <= 300; s++) if (run(project(HUNT), s * 977).status === 'completed') return s * 977;
    return undefined;
  })();

  it('the fixture completes at the searched seed', () => {
    expect(COMPLETING_SEED, 'no seed completes the hunt — the suite would be vacuous').toBeDefined();
  });

  it('writes no outcome node and leaves the grievance open; the history says the payoff was deferred', () => {
    const { graph, result, status } = run(project(HUNT), COMPLETING_SEED!);
    expect(status).toBe('completed');
    expect(outcomeNodes(graph)).toHaveLength(0);
    expect(findActiveGrievanceEdge(graph, HUNTER)).toBeDefined();
    const entry = result.strategicState.history.find(h => h.templateId === HUNT);
    expect(entry?.payoffDeferred).toBe(true);
    const done = getTraces().find(t => t.category === 'strategic_project_progress' && (t as { status?: string }).status === 'completed') as { payoffDeferred?: boolean } | undefined;
    expect(done?.payoffDeferred).toBe(true);
  });

  it('the beast\'s death closes the grievance through its own milestone', () => {
    const { graph } = run(project(HUNT), COMPLETING_SEED!);
    const edge = findActiveGrievanceEdge(graph, HUNTER)!;
    const cond = { type: 'grievance_culprit_eliminated' as const };
    expect(evaluateGraphCondition(cond, graph, HUNTER, { pursuesProperties: edge.properties })).toBe(false);
    graph.updateNode(BEAST, { properties: { ...graph.getNode(BEAST)!.properties, deceased: true } });
    expect(evaluateGraphCondition(cond, graph, HUNTER, { pursuesProperties: edge.properties })).toBe(true);
  });

  it('an avenger whose culprit is a beast keeps the grievance open after finishing another vengeance project', () => {
    const graph = huntWorld();
    const edgeId = grieve(graph);
    expect(grievanceClosesOnCompletion(graph, graph.getEdge(edgeId))).toBe(false);
    // One field changed: the culprit is a mortal, and completion may close it as before.
    graph.addNode({ id: 'actor.man', type: 'actor', name: 'Man', properties: { actorType: 'individual' } });
    graph.updateEdge(edgeId, { properties: { ...graph.getEdge(edgeId)!.properties, culpritAgentId: 'actor.man' } });
    expect(grievanceClosesOnCompletion(graph, graph.getEdge(edgeId))).toBe(true);
  });
});

// ─── The confront ───────────────────────────────────────────────────

describe('the confront appointment', () => {
  it('plants at the lair, aimed at the beast, owed to the lair — and passes every appointment reader', () => {
    const graph = huntWorld({ lairCol: 2 });
    const state = stateFor(graph);
    expect(maybePlantAppointmentPayoff(state, candidate(), TICK)).toBe(true);
    const seed = state.pendingEncounterSeeds![0];
    expect(seed.inheritedTargetId).toBe(BEAST);
    expect(seed.query).toEqual(UNDERTAKING_CELL_APPOINTMENTS[HUNT].meeting);
    const appointment = readPlantedAppointment(seed)!;
    expect(appointment).not.toBeNull();
    expect(appointment.locationId).toBe(LAIR);
    expect(appointment.dueTick).toBe(TICK + HUNT_APPOINTMENT_DELAY_TICKS);
    expect(appointment.counterpartyId).toBeUndefined();
    expect(appointment.inheritSiteAsTarget).toBe(true);
    expect(appointment.requirePlace).toBe(true);
    // No favour is owed to the monster: the creditor is the lair.
    const favour = graph.getEdge(appointment.favourEdgeId!)!;
    expect(favour.target).toBe(LAIR);
    expect(graph.getOutgoingEdges(HUNTER, 'owes_favor').some(e => e.target === BEAST)).toBe(false);
    expect(agentAppointmentSeeds(state, HUNTER).map(s => s.seedId)).toContain(seed.seedId);
    // Off the road graph, the lair is priced by hex, so the hunter is on their way, not lost.
    const ctx = resolveAppointmentContext(state, HUNTER, TICK, { courage_prudence: 0, loyalty_ambition: 0 })!;
    expect(['leaning', 'departing', 'far']).toContain(ctx.regime);
    moveTo(graph, HUNTER, LAIR);
    expect(resolveAppointmentContext(state, HUNTER, TICK, { courage_prudence: 0, loyalty_ambition: 0 })!.regime).toBe('waiting');
  });

  it('kept: the fight fires at the den with the beast as its opponent (plant → keep → evaluateEncounterSeeds)', () => {
    const graph = huntWorld({ lairCol: 2 });
    const state = stateFor(graph);
    maybePlantAppointmentPayoff(state, candidate(), TICK);
    const appointment = readPlantedAppointment(state.pendingEncounterSeeds![0])!;
    moveTo(graph, HUNTER, LAIR);
    const after = evaluateEncounterSeeds(state, appointment.dueTick, () => 0.5, createSimulationRuntime());
    const fight = after.unifiedActions.find(a => a.templateId === FIGHT_LAIR_CONFRONT_ID);
    expect(fight, 'the kept branch fired the confront').toBeDefined();
    expect(fight!.actorId).toBe(HUNTER);
    expect(fight!.targetId).toBe(BEAST);
    // The promise is kept, so it is retired — and a new hunt on this beast is allowed.
    expect(after.graph.getEdge(appointment.favourEdgeId!)).toBeUndefined();
    expect(liveHuntFavourAt(after.graph, HUNTER, LAIR)).toBe(false);
  });

  it('missed: trail_cold fires where the hunter stands, aimed at no beast — and the hunt can be taken up again', () => {
    const graph = huntWorld({ lairCol: 2 });
    const state = stateFor(graph);
    maybePlantAppointmentPayoff(state, candidate(), TICK);
    const appointment = readPlantedAppointment(state.pendingEncounterSeeds![0])!;
    expect(eligibilityRefusal(graph, monsterType(), 'destroy', HUNTER, beastHandle, TICK)).toBe('hunt_confront_pending');

    const closed = appointment.dueTick + APPOINTMENT_WINDOW_TICKS + 1;
    const missed = evaluateEncounterSeeds(state, closed, () => 0.5, createSimulationRuntime());
    const converted = missed.pendingEncounterSeeds![0] as PendingEncounterSeed;
    expect(converted.query).toEqual(UNDERTAKING_CELL_APPOINTMENTS[HUNT].missed.query);
    expect(converted.inheritedTargetId).toBeUndefined();
    expect(converted.missedAppointment?.locationId).toBe(LAIR);
    // The broken promise does not block a new hunt.
    expect(eligibilityRefusal(missed.graph, monsterType(), 'destroy', HUNTER, beastHandle, closed)).toBeNull();

    const later = evaluateEncounterSeeds(missed, closed + APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS, () => 0.5, createSimulationRuntime());
    const sequel = later.unifiedActions.find(a => a.templateId === HUNT_TRAIL_COLD_ID);
    expect(sequel, 'the missed branch fired the trail-cold sequel').toBeDefined();
    expect(sequel!.actorId).toBe(HUNTER);
    expect(sequel!.targetId).not.toBe(BEAST);
  });

  it('a seed whose lair is gone is dropped, its favour released first — never fired placeless', () => {
    const graph = huntWorld({ lairCol: 2 });
    const state = stateFor(graph);
    maybePlantAppointmentPayoff(state, candidate(), TICK);
    const seed = state.pendingEncounterSeeds![0];
    const appointment = readPlantedAppointment(seed)!;
    graph.removeNode(LAIR);
    const after = evaluateEncounterSeeds(state, appointment.dueTick, () => 0.5, createSimulationRuntime());
    expect(after.pendingEncounterSeeds!.some(s => s.seedId === seed.seedId)).toBe(false);
    expect(after.unifiedActions.some(a => a.templateId === FIGHT_LAIR_CONFRONT_ID)).toBe(false);
    expect(after.graph.getEdge(appointment.favourEdgeId!)).toBeUndefined();
    const trace = getTraces().find(t => t.category === 'appointment_missed') as { reason?: string; dropped?: boolean } | undefined;
    expect(trace?.reason).toBe('place_lost');
    expect(trace?.dropped).toBe(true);
  });

  it('a refused plant pushes no seed (over the appointment cap)', () => {
    const graph = huntWorld({ lairCol: 2 });
    const state = stateFor(graph);
    const filler = (i: number): PendingEncounterSeed => ({
      seedId: `filler_${i}`, sourceEncounterId: 'x', sourceReactionId: 'y', query: { kind: 'encounter_template', tags: ['#court_errand'] },
      targetAgentId: HUNTER, eligibleAfterTick: 999, priority: 1, seedLabel: 'x', plantedTick: 0,
      appointment: { locationId: TOWN, dueTick: 999, windowTicks: 12, missed: { query: { kind: 'encounter_template', tags: ['#court_errand'] }, seedLabel: 'x' } },
    } as PendingEncounterSeed);
    state.pendingEncounterSeeds = Array.from({ length: APPOINTMENT_MAX_PER_MORTAL }, (_, i) => filler(i));
    expect(maybePlantAppointmentPayoff(state, candidate(), TICK)).toBe(false);
    expect(state.pendingEncounterSeeds).toHaveLength(APPOINTMENT_MAX_PER_MORTAL);
    const trace = getTraces().find(t => t.category === 'appointment_planted') as { refused?: string; seedWithheld?: boolean } | undefined;
    expect(trace?.refused).toBe('over_max');
    expect(trace?.seedWithheld).toBe(true);
  });

  it('a beast dead by the time the hunt completes gets no confront', () => {
    const graph = huntWorld({ lairCol: 2 });
    graph.updateNode(BEAST, { properties: { ...graph.getNode(BEAST)!.properties, deceased: true } });
    const state = stateFor(graph);
    expect(maybePlantAppointmentPayoff(state, candidate(), TICK)).toBe(false);
    expect(state.pendingEncounterSeeds).toHaveLength(0);
  });

  it('a second hunt is refused while the promise stands, and allowed once it is retired', () => {
    const graph = huntWorld({ lairCol: 2 });
    const state = stateFor(graph);
    maybePlantAppointmentPayoff(state, candidate(), TICK);
    const appointment = readPlantedAppointment(state.pendingEncounterSeeds![0])!;
    expect(eligibilityRefusal(graph, monsterType(), 'destroy', HUNTER, beastHandle, TICK)).toBe('hunt_confront_pending');
    graph.removeEdge(appointment.favourEdgeId!);
    expect(eligibilityRefusal(graph, monsterType(), 'destroy', HUNTER, beastHandle, TICK)).toBeNull();
  });
});

// ─── The den: one fight, not two ────────────────────────────────────

describe('a hunter waiting at the den', () => {
  function waitingAtDen() {
    const graph = huntWorld({ lairCol: 2 });
    const state = stateFor(graph);
    maybePlantAppointmentPayoff(state, candidate(), TICK);
    moveTo(graph, HUNTER, LAIR);
    return { graph, state };
  }

  it('is not offered the encounter hunt (monster.hunt.named_elite) — the one field changed: no appointment', () => {
    const named = getUnifiedTemplateById('monster.hunt.named_elite')!;
    expect(named.requiresLiveMonster).toBe(true);
    const { graph } = waitingAtDen();
    const offered = generateUnifiedCandidates(graph, HUNTER, LAIR, [named]).map(c => c.templateId);
    expect(offered).not.toContain(named.id);

    const free = huntWorld({ lairCol: 2 });
    moveTo(free, HUNTER, LAIR);
    expect(generateUnifiedCandidates(free, HUNTER, LAIR, [named]).map(c => c.templateId)).toContain(named.id);
  });

  it('M4 does not double-spawn: the arrival is skipped as hunt_appointment', () => {
    const { state } = waitingAtDen();
    const result = checkLairArrival(state, HUNTER, { actions: [], fightCooldowns: undefined, rng: () => 0.5 });
    expect(result.skipped).toBe('hunt_appointment');
    expect(result.action).toBeUndefined();
  });
});

// ─── Content ────────────────────────────────────────────────────────

describe('the hunt content', () => {
  it('#lair_confront and #hunt_trail_cold each resolve their one template through resolveContentQuery', () => {
    const catalogs = staticContentCatalogs();
    const confront = resolveContentQuery({ kind: 'encounter_template', tags: ['#lair_confront'] }, catalogs).map(h => h.id);
    const cold = resolveContentQuery({ kind: 'encounter_template', tags: ['#hunt_trail_cold'] }, catalogs).map(h => h.id);
    expect(confront).toEqual([FIGHT_LAIR_CONFRONT_ID]);
    expect(cold).toEqual([HUNT_TRAIL_COLD_ID]);
  });

  it('hunt.trail_cold is never drawn', () => {
    const template = getUnifiedTemplateById(HUNT_TRAIL_COLD_ID)!;
    expect(template.drawable).toBe(false);
    expect(template.locationSubtypes ?? []).toHaveLength(0);
    const graph = huntWorld();
    const drawn = generateUnifiedCandidates(graph, HUNTER, TOWN, UNIFIED_ACTION_TEMPLATES).map(c => c.templateId);
    expect(drawn).not.toContain(HUNT_TRAIL_COLD_ID);
  });
});

