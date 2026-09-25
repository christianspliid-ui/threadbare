/**
 * Hunts — the readings the `monster` undertaking object type and its confront share
 * (THR-1560, plan doc `Docs/plans/2026-09-23-hunts.md` § Engine pillar).
 *
 * "Hunt" names two linked things: the **encounter hunt** at the den
 * (`monster.hunt.named_elite`, plan doc 3) and the **undertaking hunt**
 * (`cell.destroy.monster`), the long work whose payoff is a confront at the den,
 * planted as an appointment. This module holds what both, and the lair-arrival
 * trigger, need to ask:
 *
 * - {@link isLiveMonster} — the object type's discriminator: a monster that is not
 *   gone. The dead are never a hunt's object.
 * - {@link huntReason} — the three doors through the motive gate (a scar, a grievance,
 *   a den near home), returned as the word the board records (`gate_exempt:<reason>`).
 * - {@link liveHuntFavourAt} — whether a hunter holds a live appointment promise at a
 *   lair: the one-confront-per-beast refusal, the draw gate that hides the encounter
 *   hunt from a hunter waiting at the den, and M4's `hunt_appointment` skip all read it.
 *
 * Every reader is fail-soft (NFP #4): a missing node, edge or property reads as "no".
 * Nothing is cached — each answer changes as the world does and every question is a
 * handful of edge reads.
 */

import type { WorldGraph } from '../graph';
import type { GraphEdge, GraphNode } from '../../types/graph';
import { isMonster } from './isMonster';
import { isAgentGone } from '../groups/groupQueries';
import { readResidence } from '../agentResidence';
import { resolveToParentLocation } from '../sublocationShape';
import { resolveLocationToHex } from '../encounterAwareness';
import { hexDistance } from '../../lib/hexMath';
import { LOCATION_CLASSES } from '../../data/world-objects';
import { HUNT_THREAT_RADIUS_HEXES } from '../../data/strategic-action-constants';

/** Why a mortal may hunt a beast — the reason doors, recorded as `gate_exempt:<reason>`. */
export type HuntReason = 'blood_drawn' | 'grievance' | 'threat_radius';

/** The grudge causes that read as the beast's own wound on the hunter. */
const SCAR_CAUSES: ReadonlySet<string> = new Set(['blood_drawn', 'grievance_cooled']);

const SETTLEMENT_SUBTYPES: ReadonlySet<string> = new Set(LOCATION_CLASSES.settlement ?? []);

/** The hunt object's discriminator: a lair's monster that is still alive. */
export function isLiveMonster(node: GraphNode | undefined | null): boolean {
  return !!node && isMonster(node) && !isAgentGone(node);
}

/** The lair a monster belongs to (`lairId`), when it still names a node. */
export function monsterLairId(graph: WorldGraph, monsterId: string): string | undefined {
  const lairId = graph.getNode(monsterId)?.properties.lairId;
  return typeof lairId === 'string' && lairId.length > 0 && graph.getNode(lairId) ? lairId : undefined;
}

/** A settlement-class location, climbing from a place to its location first. */
function asSettlement(graph: WorldGraph, id: string | undefined): GraphNode | undefined {
  if (!id) return undefined;
  const loc = resolveToParentLocation(graph, graph.getNode(id));
  if (!loc || loc.type !== 'location') return undefined;
  return SETTLEMENT_SUBTYPES.has(loc.properties.locationSubtype as string) ? loc : undefined;
}

/**
 * The settlement a mortal calls home — plan doc 1's rule: the residence's origin,
 * climbed to its location, when that is a settlement; failing that, the last observed
 * position under the same test; failing both, none.
 */
export function huntHomeSettlement(graph: WorldGraph, mortalId: string): GraphNode | undefined {
  const residence = readResidence(graph, mortalId);
  return asSettlement(graph, residence.originLocationId) ?? asSettlement(graph, residence.positionId);
}

/** The hunter bears the beast's wound: a scar-provenance `hostile_to` toward it. */
function holdsScarToward(graph: WorldGraph, hunterId: string, monsterId: string): boolean {
  return graph.getOutgoingEdges(hunterId, 'hostile_to').some(
    e => e.target === monsterId && typeof e.properties?.cause === 'string' && SCAR_CAUSES.has(e.properties.cause as string),
  );
}

/** The hunter pursues an active grievance whose culprit is the beast (THR-1536). */
function holdsGrievanceAgainst(graph: WorldGraph, hunterId: string, monsterId: string): boolean {
  return graph.getOutgoingEdges(hunterId, 'pursues').some(
    e => e.properties?.grievance === true && e.properties.status === 'active' && e.properties.culpritAgentId === monsterId,
  );
}

/** The beast's lair lies within `HUNT_THREAT_RADIUS_HEXES` of the hunter's settlement home. */
function denNearHome(graph: WorldGraph, hunterId: string, monsterId: string): boolean {
  const home = huntHomeSettlement(graph, hunterId);
  const lairId = monsterLairId(graph, monsterId);
  if (!home || !lairId) return false;
  const homeHex = resolveLocationToHex(graph, home.id);
  const lairHex = resolveLocationToHex(graph, lairId);
  if (!homeHex || !lairHex) return false;
  return hexDistance(homeHex, lairHex) <= HUNT_THREAT_RADIUS_HEXES;
}

/**
 * Why this mortal may hunt this beast, or `null` to leave the motive gate to its
 * social motives. Checked in a fixed order — a scar, a grievance, a den near home —
 * so the recorded reason is reproducible (NFP #3). Fails closed: a read that throws
 * is no door.
 */
export function huntReason(graph: WorldGraph, hunterId: string, monsterId: string): HuntReason | null {
  try {
    if (hunterId === monsterId) return null;
    if (!isLiveMonster(graph.getNode(monsterId))) return null;
    if (holdsScarToward(graph, hunterId, monsterId)) return 'blood_drawn';
    if (holdsGrievanceAgainst(graph, hunterId, monsterId)) return 'grievance';
    if (denNearHome(graph, hunterId, monsterId)) return 'threat_radius';
  } catch {
    return null;
  }
  return null;
}

/** The lair a location (or a place inside one) belongs to, when it is a lair or a cleared one. */
function lairOfLocation(graph: WorldGraph, locationId: unknown): string | undefined {
  if (typeof locationId !== 'string') return undefined;
  const loc = resolveToParentLocation(graph, graph.getNode(locationId));
  return loc?.id;
}

/** Is this `owes_favor` edge a live (neither redeemed nor broken) appointment promise at the lair? */
function isLiveAppointmentFavourAt(graph: WorldGraph, edge: GraphEdge, lairId: string): boolean {
  const props = edge.properties ?? {};
  if (props.redeemed === true || props.broken === true) return false;
  const appointment = props.appointment as { locationId?: unknown } | undefined;
  if (!appointment || typeof appointment !== 'object') return false;
  return lairOfLocation(graph, appointment.locationId) === lairId;
}

/**
 * Whether `hunterId` holds a live appointment promise at `lairId` — the promise the
 * planter always writes (`appointments.ts`, an `owes_favor` edge carrying
 * `appointment: { seedId, locationId, dueTick }`). Exact because a kept appointment
 * removes the edge, a missed one marks it `broken`, a lost place releases it, and a
 * refused hunt plant writes no seed and no edge at all.
 */
export function liveHuntFavourAt(graph: WorldGraph, hunterId: string, lairId: string | undefined): boolean {
  if (!lairId) return false;
  try {
    return graph.getOutgoingEdges(hunterId, 'owes_favor').some(e => isLiveAppointmentFavourAt(graph, e, lairId));
  } catch {
    return false;
  }
}

/** The same question asked of a location: the lair it (or its parent) is. */
export function liveHuntFavourAtLocation(graph: WorldGraph, hunterId: string, locationId: string | undefined | null): boolean {
  const lairId = lairOfLocation(graph, locationId ?? undefined);
  if (!lairId) return false;
  const lair = graph.getNode(lairId);
  if (!lair || lair.properties.locationSubtype !== 'lair') return false;
  return liveHuntFavourAt(graph, hunterId, lairId);
}
