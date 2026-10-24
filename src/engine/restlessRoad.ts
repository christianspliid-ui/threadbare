/**
 * The restless road (THR-1959, THR-1218 D6 / E5).
 *
 * A paused (followed) mortal who has had no story chapter for STORY_DROUGHT_TICKS
 * and has no story among her candidates sets out for the nearest place whose
 * encounters hold one she may still draw. It is her own drive (Law 9: the god
 * never commands), told in one Chronicle line with both names as links.
 *
 * This module holds the pure parts: the due check, the destination search, the
 * thread-edge writes, the trace and the Chronicle event. The decision phase
 * (`phaseAgentDecision.ts`) supplies the candidate list, the "may still draw"
 * filter (retirement, tellings cap, cooldown — the per-agent checks only, never
 * the full eligibility pipeline per remote entry) and the travel itself
 * (`startTravelTo`, shared with forced travel).
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | STORY_DROUGHT_TICKS          | 72 | data/agent-behavior-constants.ts |
 * | RESTLESS_ROAD_COOLDOWN_TICKS | 48 | data/agent-behavior-constants.ts |
 * | RESTLESS_ROAD_MAX_HEXES      | 12 | data/agent-behavior-constants.ts |
 *
 * ─── Fail-soft ───────────────────────────────────────────────────
 * | Not a paused mortal / dormant / auto thread | not due: today's behaviour |
 * | Anchor in the future (save edit)            | no drought, not due        |
 * | No destination in reach, or no path         | `no_destination`, she stays |
 * | Name unresolvable                           | fallback words, no `{token}` (Law 43) |
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None. Nearest by hex distance; ties go to the lower location id (NFP #3).
 */

import type { WorldGraph } from './graph';
import type { EncounterCacheEntry } from './encounterCache';
import type { TickEvent } from '../types/gameState';
import type { ChronicleSegment } from '../types/narrative';
import type { WorldRef } from '../types/worldRef';
import type { ThreadEdgeProperties } from '../types/influence';
import { getThreadTo } from './graphQueries';
import { isPausedThreadActor, isRoutineTemplate, storyDroughtTicks } from './attentionCadence';
import { resolveLocationToHex } from './encounterAwareness';
import { hexDistance } from '../lib/hexMath';
import { emitTrace } from './traceBuffer';
import {
  STORY_DROUGHT_TICKS,
  RESTLESS_ROAD_COOLDOWN_TICKS,
  RESTLESS_ROAD_MAX_HEXES,
} from '../data/agent-behavior-constants';
import {
  RESTLESS_ROAD_LINE,
  RESTLESS_ROAD_FALLBACK_PLACE,
  RESTLESS_ROAD_FALLBACK_NAME,
} from '../data/attention-content';

export type RestlessRoadOutcome = 'set_out' | 'story_at_home' | 'no_destination';

export interface RestlessRoadDestination {
  locationId: string;
  hexDistance: number;
  /** The story templates there she may still draw, sorted. */
  storyTemplateIds: string[];
}

function threadProps(graph: WorldGraph, agentId: string): ThreadEdgeProperties | null {
  const thread = getThreadTo(graph, agentId);
  return thread ? (thread.properties as unknown as ThreadEdgeProperties) : null;
}

/** Tick she last set out on the restless road, or null. */
export function lastRestlessRoadTick(graph: WorldGraph, agentId: string): number | null {
  const t = threadProps(graph, agentId)?.lastRestlessRoadTick;
  return typeof t === 'number' ? t : null;
}

/**
 * The drought, when the restless road is due for her this decision; else null.
 * Due = a paused mortal, a drought of at least STORY_DROUGHT_TICKS, and no road
 * check (of any outcome) in the last RESTLESS_ROAD_COOLDOWN_TICKS. A future
 * check tick (a save edit) reads as no cooldown.
 */
export function restlessRoadDue(graph: WorldGraph, agentId: string, tick: number): number | null {
  if (!isPausedThreadActor(graph, agentId)) return null;
  const drought = storyDroughtTicks(graph, agentId, tick);
  if (drought < STORY_DROUGHT_TICKS) return null;
  const last = threadProps(graph, agentId)?.restlessRoadCheckTick;
  if (typeof last === 'number' && last <= tick && tick - last < RESTLESS_ROAD_COOLDOWN_TICKS) return null;
  return drought;
}

/**
 * The nearest place, by hex distance from `fromLocationId`, whose cache entries
 * hold a story she may still draw — within RESTLESS_ROAD_MAX_HEXES and at least
 * one hex away (a story on her own hex is already in reach, so if it is not
 * among her candidates it is not hers to draw). Ties go to the lower location id.
 * `mayStillDraw` filters one place's story entries to the ones she may draw.
 */
export function findRestlessRoadDestination(
  graph: WorldGraph,
  fromLocationId: string,
  entries: readonly EncounterCacheEntry[],
  mayStillDraw: (storyEntries: EncounterCacheEntry[]) => EncounterCacheEntry[],
): RestlessRoadDestination | null {
  const fromHex = resolveLocationToHex(graph, fromLocationId);
  if (!fromHex) return null;
  const byLocation = new Map<string, { dist: number; entries: EncounterCacheEntry[] }>();
  const hexCache = new Map<string, number | null>();
  for (const entry of entries) {
    if (entry.locationId === fromLocationId) continue;
    if (isRoutineTemplate(entry.templateId)) continue;
    let dist = hexCache.get(entry.locationId);
    if (dist === undefined) {
      const hex = resolveLocationToHex(graph, entry.locationId);
      dist = hex ? hexDistance(fromHex, hex) : null;
      hexCache.set(entry.locationId, dist);
    }
    if (dist === null || dist < 1 || dist > RESTLESS_ROAD_MAX_HEXES) continue;
    const slot = byLocation.get(entry.locationId);
    if (slot) slot.entries.push(entry);
    else byLocation.set(entry.locationId, { dist, entries: [entry] });
  }
  const ordered = [...byLocation.entries()].sort((a, b) =>
    a[1].dist - b[1].dist || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  for (const [locationId, slot] of ordered) {
    const drawable = mayStillDraw(slot.entries);
    if (drawable.length === 0) continue;
    return {
      locationId,
      hexDistance: slot.dist,
      storyTemplateIds: [...new Set(drawable.map(e => e.templateId))].sort(),
    };
  }
  return null;
}

/**
 * Record a road check on the thread edge: every outcome starts the cooldown;
 * `set_out` also stamps `lastRestlessRoadTick`. Fail-soft: no thread, no write.
 */
export function recordRestlessRoad(
  graph: WorldGraph,
  agentId: string,
  tick: number,
  outcome: RestlessRoadOutcome,
): void {
  const thread = getThreadTo(graph, agentId);
  if (!thread) return;
  try {
    graph.updateEdge(thread.id, {
      properties: outcome === 'set_out'
        ? { restlessRoadCheckTick: tick, lastRestlessRoadTick: tick }
        : { restlessRoadCheckTick: tick },
    });
  } catch {
    // fail-soft: the cooldown is a nicety; the next decision re-checks
  }
}

export function emitRestlessRoadTrace(
  tick: number,
  agentId: string,
  droughtTicks: number,
  outcome: RestlessRoadOutcome,
  fromLocationId: string,
  dest: RestlessRoadDestination | null,
): void {
  emitTrace({
    category: 'agent.restless_road',
    tick,
    agentId,
    droughtTicks,
    outcome,
    fromLocationId,
    toLocationId: dest?.locationId ?? null,
    hexDistance: dest?.hexDistance ?? null,
    storyTemplateIds: dest?.storyTemplateIds ?? [],
    summary: outcome === 'set_out'
      ? `${agentId}: ${droughtTicks} ticks without a story; takes the road to ${dest?.locationId} (${dest?.hexDistance} hexes)`
      : `${agentId}: ${droughtTicks} ticks without a story; ${outcome}`,
  });
}

/** The world reference for a place: a sublocation when it carries a parent, else a location. */
function placeRef(graph: WorldGraph, locationId: string, name: string): WorldRef {
  const node = graph.getNode(locationId);
  const isSub = typeof node?.properties?.parentLocationId === 'string';
  return { kind: isSub ? 'sublocation' : 'location', id: locationId, name };
}

/**
 * The Chronicle event for a mortal who set out (Law 45: pushed only after the
 * move is set). Both names are declared as segments with references (Laws 2,
 * 21); an unresolvable name falls back to plain words (Law 43). No
 * `notification` directive: the restless road is not a moment that matters
 * (Law 15), so it raises no toast or alert.
 */
export function buildRestlessRoadEvent(
  graph: WorldGraph,
  agentId: string,
  destinationId: string,
  tick: number,
): TickEvent {
  const agentName = graph.getNode(agentId)?.name;
  const placeName = graph.getNode(destinationId)?.name;
  const nameSeg: ChronicleSegment = agentName
    ? { text: agentName, ref: { kind: 'agent', id: agentId, name: agentName } }
    : { text: RESTLESS_ROAD_FALLBACK_NAME };
  const placeSeg: ChronicleSegment = placeName
    ? { text: placeName, ref: placeRef(graph, destinationId, placeName) }
    : { text: RESTLESS_ROAD_FALLBACK_PLACE };
  const segments: ChronicleSegment[] = [];
  for (const part of RESTLESS_ROAD_LINE.split(/(\{name\}|\{place\})/)) {
    if (part === '') continue;
    if (part === '{name}') segments.push(nameSeg);
    else if (part === '{place}') segments.push(placeSeg);
    else segments.push({ text: part });
  }
  const refs = segments.flatMap(s => (s.ref ? [s.ref] : []));
  return {
    id: `restless_road_${agentId}_${tick}`,
    tick,
    type: 'agent_movement',
    message: segments.map(s => s.text).join(''),
    // The Chronicle's floor (phaseNarrative takes ≥ 0.8); a followed mortal only.
    significance: 0.8,
    actorId: agentId,
    chronicleGate: 'threaded_only',
    ...(refs.length > 0 ? { refs } : {}),
    segments,
  };
}
