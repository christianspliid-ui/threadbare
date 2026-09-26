/**
 * Appointments — a mortal keeps (or misses) a meeting at a place by a time (THR-1479).
 *
 * ## The one load-bearing decision: the seed is the appointment
 *
 * An appointment is a `PendingEncounterSeed` carrying an `appointment` block — the
 * place, the due tick (the seed's own `eligibleAfterTick`), the window, the
 * counterparty and the missed branch. Nothing is copied onto the mortal: the pull,
 * the chips, the sheet row and the debug readout all read `state.pendingEncounterSeeds`
 * filtered by target. The *promise* is a separate thing — an `owes_favor` edge from the
 * mortal to the counterparty carrying `properties.appointment` — and that edge is what
 * the sheet lists and what "broken" is written onto. Two facts, two records; one copy
 * of each.
 *
 * ## The curve, in regimes
 *
 * `slack = dueTick − tick − travelTicks(place)`. Far above the horizon, nothing; inside
 * it the mortal *leans* (the encounter board gets a second additive pull on the
 * relocation channel, and anything that would outlast the slack is discounted); under
 * the leave margin they *depart* (anything longer than the slack is dropped and a
 * journey candidate competes for the decision); at the place they *wait*; with no path
 * or negative slack they are *lost* and the seed converts when its window closes.
 *
 * The leave margin is where personality lives: a Watcher leaves a day early, a
 * Renegade cuts it fine, and at the defaults the margin can go negative — the mortal
 * chooses to miss. That is the director's *rare and personality-driven*, and it is where
 * a god's whisper belongs.
 *
 * ## No second movement path
 *
 * This module computes; it never moves anyone. The journey candidate is queued by the
 * decision phase through the same `initMovementState` writer every other departure uses,
 * and the pull is one term on the channel `computeRelocationIntentBonus` already adds
 * to. If the mortal does not go, the board outvoted the promise — trace it, do not force
 * it.
 *
 * ## Fail-soft (NFP #4)
 *
 * Every resolver returns `null` / `0` rather than throwing: a place with no hex, an
 * unplaced mortal, a malformed block on a saved world. A seed whose block does not
 * validate reads as a placeless seed, which is today's behaviour.
 *
 * Deliberately imports nothing from `encounterScoring` — that module imports the pull
 * from here, and a cycle would make the profile resolver's owner ambiguous.
 */

import type { GraphEdge, GraphNode } from '../types/graph';
import type { GameState } from '../types/gameState';
import type { AxiologicalProfile } from '../types/agent';
import type { AppointmentBlock, PendingEncounterSeed, PlantedAppointment } from '../types/unifiedAction';
import type { AppointmentPlantedTrace, AppointmentRegime } from '../types/trace';
import type { WorldGraph } from './graph';
import { hexDistance } from '../lib/hexMath';
import { emitTrace } from './traceBuffer';
import { resolveLocationToHex } from './encounterAwareness';
import { findShortestPath } from './pathfinding';
import { isPlaceNode } from './sublocationShape';
import { getAgentLocationId } from './graphQueries';
import {
  APPOINTMENT_AMBITION_MARGIN_TICKS,
  APPOINTMENT_FAVOUR_MAGNITUDE,
  APPOINTMENT_HEX_TICKS_PER_HEX,
  APPOINTMENT_LEAVE_MARGIN_TICKS,
  APPOINTMENT_MAX_PER_MORTAL,
  APPOINTMENT_PRUDENCE_MARGIN_TICKS,
  APPOINTMENT_PULL_HORIZON_TICKS,
  APPOINTMENT_PULL_WEIGHT,
  APPOINTMENT_WINDOW_TICKS,
} from '../data/movement-content';

/** Edge property key that marks an `owes_favor` edge as an appointment's promise. */
export const APPOINTMENT_FAVOUR_PROP = 'appointment';

/** Agent-node property holding the last traced regime, so the regime trace fires on change only. */
export const APPOINTMENT_REGIME_MEMO_PROP = 'appointmentRegimeMemo';

// ─── Readings ────────────────────────────────────────────────────────────────

/** Is this `owes_favor` edge the promise behind an appointment? */
export function isAppointmentFavour(edge: GraphEdge | undefined): boolean {
  if (!edge || edge.type !== 'owes_favor') return false;
  const raw = edge.properties?.[APPOINTMENT_FAVOUR_PROP];
  return !!raw && typeof raw === 'object';
}

/**
 * Shape-validating read of a seed's appointment block. A malformed block on a saved
 * world reads as absent — the `readRelocationIntent` idiom — so the seed behaves as
 * a placeless one rather than throwing in the tick loop.
 */
export function readPlantedAppointment(seed: PendingEncounterSeed | undefined): PlantedAppointment | null {
  const raw = seed?.appointment;
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.locationId !== 'string' || raw.locationId.length === 0) return null;
  if (typeof raw.dueTick !== 'number' || !Number.isFinite(raw.dueTick)) return null;
  if (typeof raw.windowTicks !== 'number' || !Number.isFinite(raw.windowTicks)) return null;
  if (!raw.missed || typeof raw.missed !== 'object') return null;
  return raw;
}

/** Every live appointment seed a mortal holds, nearest due first. */
export function agentAppointmentSeeds(
  // Widened to a readonly view (THR-1519) so a planter can count the seeds it has not
  // yet appended to state without copying them; every `GameState` still satisfies it.
  state: { readonly pendingEncounterSeeds?: readonly PendingEncounterSeed[] },
  agentId: string,
): PendingEncounterSeed[] {
  const seeds = state.pendingEncounterSeeds ?? [];
  return seeds
    .filter(s => s.targetAgentId === agentId && readPlantedAppointment(s) !== null)
    .sort((a, b) => a.appointment!.dueTick - b.appointment!.dueTick || a.seedId.localeCompare(b.seedId));
}

/**
 * The place tier a journey is priced to. A Place (inner tier) resolves up to its
 * Location for pathfinding — the movement graph walks the outer tier — while the hex
 * test below stays hex-granular either way.
 */
export function appointmentPlaceLocationId(graph: WorldGraph, locationId: string): string | null {
  const node = graph.getNode(locationId);
  if (!node) return null;
  if (isPlaceNode(node)) {
    const parentId = node.properties?.parentLocationId;
    return typeof parentId === 'string' && graph.getNode(parentId) ? parentId : null;
  }
  return node.id;
}

// ─── Slack and margin ────────────────────────────────────────────────────────

export interface AppointmentSlack {
  /** `dueTick − tick − travelTicks`; `-Infinity` when the place cannot be reached. */
  readonly slack: number;
  /** Priced by the movement graph; `Infinity` when unreachable; `0` at the place. */
  readonly travelTicks: number;
  /** Standing anywhere on the place's hex — the awareness rule. */
  readonly atPlace: boolean;
  readonly placeHex: { readonly col: number; readonly row: number };
}

/**
 * Slack for one appointment, from where the mortal stands now.
 *
 * `null` when the place has no hex (dissolved settlement, dangling id) or the mortal
 * is unplaced — the caller treats that as the world having lost the place, which is
 * not the mortal's fault.
 */
export function computeAppointmentSlack(
  graph: WorldGraph,
  agentId: string,
  appointment: PlantedAppointment,
  tick: number,
): AppointmentSlack | null {
  const placeHex = resolveLocationToHex(graph, appointment.locationId);
  if (!placeHex) return null;
  const hereId = getAgentLocationId(graph, agentId);
  if (!hereId) return null;
  const hereHex = resolveLocationToHex(graph, hereId);
  if (!hereHex) return null;

  if (hexDistance(hereHex, placeHex) === 0) {
    return { slack: appointment.dueTick - tick, travelTicks: 0, atPlace: true, placeHex };
  }

  const destinationId = appointmentPlaceLocationId(graph, appointment.locationId);
  if (!destinationId) return null;
  // The mortal's own tier may be a Place too; the path is priced between Locations.
  const fromId = appointmentPlaceLocationId(graph, hereId) ?? hereId;
  const path = findShortestPath(graph, agentId, fromId, destinationId);
  if (!path || !Number.isFinite(path.totalCost)) {
    // THR-1560: an off-graph place (a lair) is walked by the journey queuer's hex
    // fallback, so an appointment that says so is priced the same way. Every other
    // appointment keeps THR-1479's rule: no road is unreachable.
    if (appointment.pricedByHex) {
      const travelTicks = hexDistance(hereHex, placeHex) * APPOINTMENT_HEX_TICKS_PER_HEX;
      return { slack: appointment.dueTick - tick - travelTicks, travelTicks, atPlace: false, placeHex };
    }
    return { slack: -Infinity, travelTicks: Infinity, atPlace: false, placeHex };
  }
  const travelTicks = Math.max(0, path.totalCost);
  return { slack: appointment.dueTick - tick - travelTicks, travelTicks, atPlace: false, placeHex };
}

/**
 * How much slack a mortal leaves themselves before setting out.
 *
 * `base + prudence × clamp01(−courage_prudence) − ambition × clamp01(−loyalty_ambition)`.
 * Two existing axes, no new personality field. Can go negative at the defaults, which
 * is the point: a Renegade may choose to miss.
 */
export function leaveMargin(profile: Pick<AxiologicalProfile, 'courage_prudence' | 'loyalty_ambition'>): number {
  const prudence = clamp01(-(profile.courage_prudence ?? 0));
  const ambition = clamp01(-(profile.loyalty_ambition ?? 0));
  return APPOINTMENT_LEAVE_MARGIN_TICKS
    + APPOINTMENT_PRUDENCE_MARGIN_TICKS * prudence
    - APPOINTMENT_AMBITION_MARGIN_TICKS * ambition;
}

/** Which regime the mortal is in for this appointment, given its slack and their margin. */
export function appointmentRegime(slack: AppointmentSlack, margin: number): AppointmentRegime {
  if (slack.atPlace) return 'waiting';
  if (slack.slack < 0) return 'lost';
  if (slack.slack > APPOINTMENT_PULL_HORIZON_TICKS) return 'far';
  if (slack.slack < margin) return 'departing';
  return 'leaning';
}

// ─── The per-tick context the decision phase hands down ──────────────────────

/** Everything the decision phase needs about a mortal's nearest-due appointment, computed once per tick. */
export interface AppointmentContext {
  readonly seed: PendingEncounterSeed;
  readonly appointment: PlantedAppointment;
  readonly slack: AppointmentSlack;
  readonly leaveMargin: number;
  readonly regime: AppointmentRegime;
}

/**
 * Resolve the appointment that governs this tick's decision: the nearest-due seed
 * with non-negative slack, else the nearest-due one (which is then `lost`). `null`
 * when the mortal holds none, or every one of theirs has lost its place.
 */
export function resolveAppointmentContext(
  state: Pick<GameState, 'pendingEncounterSeeds'> & { graph: WorldGraph },
  agentId: string,
  tick: number,
  profile: Pick<AxiologicalProfile, 'courage_prudence' | 'loyalty_ambition'>,
): AppointmentContext | null {
  const seeds = agentAppointmentSeeds(state, agentId);
  if (seeds.length === 0) return null;
  const margin = leaveMargin(profile);
  let fallback: AppointmentContext | null = null;
  for (const seed of seeds) {
    const appointment = readPlantedAppointment(seed)!;
    const slack = computeAppointmentSlack(state.graph, agentId, appointment, tick);
    if (!slack) continue;
    const ctx: AppointmentContext = { seed, appointment, slack, leaveMargin: margin, regime: appointmentRegime(slack, margin) };
    if (slack.slack >= 0 || slack.atPlace) return ctx;
    if (!fallback) fallback = ctx;
  }
  return fallback;
}

/**
 * Additive pull toward the appointment's place for one candidate hex — the second
 * term on the relocation channel. `W × pullMult / (1 + hexDistance)`, the same shape
 * and fail-soft contract as `computeRelocationIntentBonus`. `0` outside the leaning
 * and departing regimes, so every pre-THR-1479 score is recovered term for term.
 * `pullMult` rides the planted appointment (THR-1560, the hunt's lever); an absent or
 * non-finite one reads as 1, so every other appointment is unchanged.
 */
export function computeAppointmentPull(
  context: AppointmentContext | null | undefined,
  entryCol: number | undefined,
  entryRow: number | undefined,
): number {
  if (!context || entryCol === undefined || entryRow === undefined) return 0;
  if (context.regime !== 'leaning' && context.regime !== 'departing') return 0;
  const dist = hexDistance(context.slack.placeHex, { col: entryCol, row: entryRow });
  const mult = context.appointment.pullMult;
  const pullMult = typeof mult === 'number' && Number.isFinite(mult) && mult >= 0 ? mult : 1;
  return APPOINTMENT_PULL_WEIGHT * pullMult / (1 + dist);
}

/** Read the memoised regime off the agent node; `null` when none traced yet. */
export function readRegimeMemo(agentNode: GraphNode | undefined): { seedId: string; regime: AppointmentRegime } | null {
  const raw = agentNode?.properties?.[APPOINTMENT_REGIME_MEMO_PROP];
  if (!raw || typeof raw !== 'object') return null;
  const memo = raw as { seedId?: unknown; regime?: unknown };
  if (typeof memo.seedId !== 'string' || typeof memo.regime !== 'string') return null;
  return { seedId: memo.seedId, regime: memo.regime as AppointmentRegime };
}

// ─── The one planter ─────────────────────────────────────────────────────────

/** What a planter hands in: refs already resolved to node ids — the binding is the caller's business. */
export interface PlantAppointmentInput {
  readonly graph: WorldGraph;
  /** The seeds already planted this pass and not yet on state — counted toward `APPOINTMENT_MAX_PER_MORTAL`. */
  readonly pendingSeeds: readonly PendingEncounterSeed[];
  readonly seedId: string;
  readonly targetAgentId: string;
  /** Resolved Location / Place node id, or `undefined` when the caller could not bind one. */
  readonly placeId: string | undefined;
  /** Resolved counterparty agent id, or `undefined`; the creditor is then the place itself. */
  readonly counterpartyId?: string;
  readonly tick: number;
  readonly dueTick: number;
  readonly windowTicks?: number;
  readonly missed: AppointmentBlock['missed'];
  /** For the trace: the label and, when there is one, the template behind the plant. */
  readonly seedLabel: string;
  readonly templateId?: string;
  /** The unresolved ref, for the refused trace — what the author wrote, not what failed to bind. */
  readonly authoredPlaceRef?: string;
  readonly source: NonNullable<AppointmentPlantedTrace['source']>;
  /** The payoff's flags (THR-1560), carried onto the planted appointment. */
  readonly inheritSiteAsTarget?: boolean;
  readonly pullMult?: number;
  readonly requirePlace?: boolean;
  readonly pricedByHex?: boolean;
}

export type PlantAppointmentResult =
  | { readonly planted: PlantedAppointment; readonly refused?: undefined }
  | { readonly planted?: undefined; readonly refused: NonNullable<AppointmentPlantedTrace['refused']> };

/**
 * The one planter (THR-1479, factored for THR-1519 so the undertaking grid and the
 * encounter aftermath cannot drift): checks the target is live and the place has a
 * hex, refuses a fourth, writes the promise — an `owes_favor` edge of a particular
 * shape — and traces. It does **not** build the seed and it does **not** bump
 * `worldVersion`: the caller owns the seed's other fields and the runtime, and this
 * module deliberately imports nothing that imports the scoring path.
 *
 * Every refusal is a plain result, never a throw (NFP #4); the caller plants today's
 * placeless seed and the trace says why.
 */
export function plantAppointmentPromise(input: PlantAppointmentInput): PlantAppointmentResult {
  const { graph, seedId, targetAgentId, tick, dueTick, missed, source } = input;
  const placeId = input.placeId && resolveLocationToHex(graph, input.placeId) ? input.placeId : undefined;
  const targetLive = !!graph.getNode(targetAgentId);
  const held = agentAppointmentSeeds({ pendingEncounterSeeds: input.pendingSeeds }, targetAgentId).length;
  const refused: NonNullable<AppointmentPlantedTrace['refused']> | undefined =
    !placeId || !targetLive ? 'place_unresolved'
      : held >= APPOINTMENT_MAX_PER_MORTAL ? 'over_max'
        : undefined;
  const windowTicks = input.windowTicks ?? APPOINTMENT_WINDOW_TICKS;

  let planted: PlantedAppointment | undefined;
  if (!refused && placeId) {
    const counterpartyId = input.counterpartyId && graph.getNode(input.counterpartyId)?.type === 'actor'
      ? input.counterpartyId
      : undefined;
    const favourEdgeId = `owes_favor_appt_${seedId}`;
    // Creditor is the counterparty when there is one, else the place itself — a
    // favour to a crossroads is what "I will be there" means. THR-1527: `redeemed` /
    // `broken` are in the schema's required set (`EDGE_SCHEMA.owes_favor`), written
    // `false` like every other favour writer — a kept meeting removes the edge, a
    // missed one flips `broken`.
    graph.addEdge({
      id: favourEdgeId,
      source: targetAgentId,
      target: counterpartyId ?? placeId,
      type: 'owes_favor',
      properties: {
        grantedTick: tick,
        magnitude: APPOINTMENT_FAVOUR_MAGNITUDE,
        context: 'appointment',
        redeemed: false,
        broken: false,
        [APPOINTMENT_FAVOUR_PROP]: { seedId, locationId: placeId, dueTick },
      },
    });
    planted = {
      locationId: placeId, dueTick, windowTicks, counterpartyId, missed, favourEdgeId,
      ...(input.inheritSiteAsTarget ? { inheritSiteAsTarget: true } : {}),
      ...(input.pullMult !== undefined ? { pullMult: input.pullMult } : {}),
      ...(input.requirePlace ? { requirePlace: true } : {}),
      ...(input.pricedByHex ? { pricedByHex: true } : {}),
    };
  }

  const placeName = placeId ? graph.getNode(placeId)?.name ?? placeId : input.authoredPlaceRef ?? input.placeId ?? '(unbound)';
  emitTrace({
    tick, category: 'appointment_planted', agentId: targetAgentId,
    seedId, locationId: placeId ?? input.authoredPlaceRef ?? input.placeId ?? '', dueTick, windowTicks,
    counterpartyId: planted?.counterpartyId,
    templateId: input.templateId,
    source,
    refused,
    ...(refused && input.requirePlace ? { seedWithheld: true } : {}),
    summary: refused
      ? input.requirePlace
        ? `Appointment refused (${refused}): "${input.seedLabel}" not planted for ${targetAgentId} — the meeting needs its place`
        : `Appointment refused (${refused}): "${input.seedLabel}" planted placeless for ${targetAgentId}`
      : `Appointment planted: ${targetAgentId} at ${placeName} by tick ${dueTick} (window ${windowTicks}) — "${input.seedLabel}"`,
  });

  return planted ? { planted } : { refused: refused! };
}

// ─── The promise and the record ──────────────────────────────────────────────

/** Kept, or the world lost the place: the promise is released. Fail-soft on a missing edge. */
export function redeemAppointmentFavour(graph: WorldGraph, edgeId: string | undefined): boolean {
  if (!edgeId) return false;
  const edge = graph.getEdge(edgeId);
  if (!isAppointmentFavour(edge)) return false;
  graph.removeEdge(edgeId);
  return true;
}

/**
 * Missed: the promise stays on the sheet, marked `broken`, until the reckoning's
 * aftermath retires it. `updateEdge` merges, so this only ever adds.
 */
export function breakAppointmentFavour(graph: WorldGraph, edgeId: string | undefined, tick: number): boolean {
  if (!edgeId) return false;
  const edge = graph.getEdge(edgeId);
  if (!isAppointmentFavour(edge)) return false;
  graph.updateEdge(edgeId, { properties: { ...edge!.properties, broken: true, brokenTick: tick } });
  return true;
}

/**
 * The Event kind records kept / missed — `world-objects.generated.md` counts them
 * under `EVENT_TYPES`. Mirrors `createEncounterEventNode`'s edges: the mortal
 * `participated_in` it, and it `occurred_at` the place. Fail-soft: a duplicate id
 * or a missing endpoint logs and returns `undefined` (NFP #4).
 */
export function writeAppointmentEvent(
  graph: WorldGraph,
  params: {
    readonly kind: 'appointment_kept' | 'appointment_missed';
    readonly agentId: string;
    readonly locationId: string;
    readonly tick: number;
    readonly seedId: string;
    readonly reason?: string;
  },
): string | undefined {
  const { kind, agentId, locationId, tick, seedId, reason } = params;
  const eventNodeId = `event_${kind}_${seedId}_${tick}`;
  const agentName = graph.getNode(agentId)?.name ?? agentId;
  const placeName = graph.getNode(locationId)?.name ?? locationId;
  try {
    graph.addNode({
      id: eventNodeId,
      type: 'event',
      name: kind === 'appointment_kept'
        ? `${agentName} keeps their word at ${placeName}`
        : `${agentName} misses the meeting at ${placeName}`,
      properties: {
        eventType: kind,
        tick,
        seedId,
        agentId,
        locationId,
        ...(reason ? { reason } : {}),
      },
    });
    // THR-1519: `EDGE_SCHEMA` requires `role` / `outcome` / `tick` on `participated_in`
    // and `tick` on `occurred_at` — written the way `createEncounterEventNode` writes
    // them. The first live kept meetings (seed 42, three of them) each cost the
    // heavy edge-integrity smoke four schema warnings while these were `{}`.
    if (graph.getNode(agentId)) {
      graph.addEdge({
        id: `participated_in_${eventNodeId}`, source: agentId, target: eventNodeId, type: 'participated_in',
        properties: { role: 'primary', outcome: kind === 'appointment_kept' ? 'kept' : 'missed', tick },
      });
    }
    if (graph.getNode(locationId)) {
      graph.addEdge({ id: `occurred_at_${eventNodeId}`, source: eventNodeId, target: locationId, type: 'occurred_at', properties: { tick } });
    }
    return eventNodeId;
  } catch (err) {
    console.warn(`[appointments] Failed to write ${kind} event ${eventNodeId}:`, err);
    return undefined;
  }
}

// ─── Readouts (debug bridge, CLI, UI) ────────────────────────────────────────

export interface AppointmentReadout {
  readonly agentId: string;
  readonly agentName: string;
  readonly seedId: string;
  readonly seedLabel: string;
  readonly placeId: string;
  readonly placeName: string;
  readonly dueTick: number;
  readonly windowTicks: number;
  /** `null` when the place cannot be resolved. */
  readonly slack: number | null;
  readonly travelTicks: number | null;
  readonly regime: AppointmentRegime | 'place_lost';
  readonly leaveMargin: number;
  readonly counterpartyId: string | null;
  readonly counterpartyName: string | null;
  readonly favourEdgeId: string | null;
  readonly broken: boolean;
}

/** Every live appointment in the world (or one mortal's), in readout shape. */
export function describeAppointments(
  state: Pick<GameState, 'pendingEncounterSeeds'> & { graph: WorldGraph; tick: number },
  profileFor: (agentId: string) => Pick<AxiologicalProfile, 'courage_prudence' | 'loyalty_ambition'>,
  agentId?: string,
): AppointmentReadout[] {
  const seeds = (state.pendingEncounterSeeds ?? []).filter(
    s => readPlantedAppointment(s) !== null && (!agentId || s.targetAgentId === agentId),
  );
  return seeds.map(seed => {
    const appointment = readPlantedAppointment(seed)!;
    const agentNode = state.graph.getNode(seed.targetAgentId);
    const place = state.graph.getNode(appointment.locationId);
    const counterparty = appointment.counterpartyId ? state.graph.getNode(appointment.counterpartyId) : undefined;
    const margin = leaveMargin(profileFor(seed.targetAgentId));
    const slack = computeAppointmentSlack(state.graph, seed.targetAgentId, appointment, state.tick);
    const favour = appointment.favourEdgeId ? state.graph.getEdge(appointment.favourEdgeId) : undefined;
    return {
      agentId: seed.targetAgentId,
      agentName: agentNode?.name ?? seed.targetAgentId,
      seedId: seed.seedId,
      seedLabel: seed.seedLabel,
      placeId: appointment.locationId,
      placeName: place?.name ?? appointment.locationId,
      dueTick: appointment.dueTick,
      windowTicks: appointment.windowTicks,
      slack: slack ? slack.slack : null,
      travelTicks: slack ? slack.travelTicks : null,
      regime: slack ? appointmentRegime(slack, margin) : 'place_lost',
      leaveMargin: margin,
      counterpartyId: appointment.counterpartyId ?? null,
      counterpartyName: counterparty?.name ?? null,
      favourEdgeId: appointment.favourEdgeId ?? null,
      broken: !!(favour?.properties?.broken),
    };
  });
}

/** The regime, in the words a hover reads (Laws 13/14 — never a number). */
export const APPOINTMENT_REGIME_WORDS: Readonly<Record<AppointmentRegime | 'place_lost', string>> = {
  far: 'far off',
  leaning: 'leaning toward it',
  departing: 'on the road',
  waiting: 'waiting there',
  lost: 'lost to it',
  place_lost: 'the place is gone',
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
