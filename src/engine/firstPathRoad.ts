/**
 * The path's road (THR-2214).
 *
 * The path the god chose at the bond leans The First's chapters (`firstPath.ts`,
 * ×(1 + FIRST_PATH_PULL)), but a lean only works on what is near her. The census
 * on THR-2200 found a fitting scene missing from her reach on most decisions. So,
 * like the restless road (`restlessRoad.ts`), she walks to her work: when no
 * candidate of hers fits the path and her path has gone quiet, she sets out for
 * the nearest place whose stories fit it. It is her own drive (Law 9), told in
 * one Chronicle line with both names as links.
 *
 * This module holds the pure parts: the due check, the fit filter for the shared
 * destination search, the thread-edge write, the trace and the Chronicle event.
 * The decision phase (`phaseAgentDecision.ts`) supplies the candidates, the
 * "may still draw" filter and the travel, exactly as for the restless road, and
 * checks the restless road first: one road per decision.
 *
 * **Due** when all hold:
 * - `agentId` is The First (the god's `the_first` thread) and the bond recorded a path;
 * - no shared road check (`restlessRoadCheckTick`) in the last RESTLESS_ROAD_COOLDOWN_TICKS;
 * - her story breath is over (a paused First; auto mode has none);
 * - none of her candidates is a non-routine scene the path pulls;
 * - no non-routine chapter of hers has resolved since the bond, **or** her latest
 *   path-fitting chapter started FIRST_PATH_ROAD_DROUGHT_TICKS or more ago (with
 *   none since the bond, counted from the bond).
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | FIRST_PATH_ROAD_DROUGHT_TICKS | 36 | data/agent-behavior-constants.ts |
 * | RESTLESS_ROAD_COOLDOWN_TICKS  | 48 | data/agent-behavior-constants.ts (shared) |
 * | RESTLESS_ROAD_MAX_HEXES       | 12 | data/agent-behavior-constants.ts (shared) |
 *
 * ─── Fail-soft ───────────────────────────────────────────────────
 * | Not The First / no path / no bond         | not due: today's behaviour |
 * | Anchor in the future (save edit)          | no drought                 |
 * | No destination in reach, or no path       | `no_destination`, she stays |
 * | Name unresolvable                         | fallback words, no `{token}` (Law 43) |
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None. Nearest by hex distance; ties go to the lower location id (NFP #3).
 */

import type { WorldGraph } from './graph';
import type { GraphEdge } from '../types/graph';
import type { EncounterCacheEntry } from './encounterCache';
import type { TickEvent } from '../types/gameState';
import type { ChronicleSegment } from '../types/narrative';
import type { WorldRef } from '../types/worldRef';
import type { ChapterRecord } from '../types/chapterRecord';
import type { MeetingChoiceRecord } from '../types/meetingEncounter';
import type { ReachDomain } from '../types/traits';
import type { ValuePair } from '../types/agent';
import type { RestlessRoadDestination } from './restlessRoad';
import { firstPathFromRecord, firstPathInLine, firstPathPullFor, type FirstPath } from './firstPath';
import { isRoutineTemplate, storyBreathRemaining } from './attentionCadence';
import { isEncounterAction, isRoutineChapter } from './chapterArchive';
import { emitTrace } from './traceBuffer';
import { FIRST_PATH_ROAD_DROUGHT_TICKS, RESTLESS_ROAD_COOLDOWN_TICKS } from '../data/agent-behavior-constants';
import {
  FIRST_PATH_ROAD_LINE,
  RESTLESS_ROAD_FALLBACK_NAME,
  RESTLESS_ROAD_FALLBACK_PLACE,
} from '../data/attention-content';

export type FirstPathRoadOutcome = 'set_out' | 'no_destination';
export type FirstPathRoadReason = 'no_chapter_yet' | 'path_drought';

export interface FirstPathRoadDue {
  path: FirstPath;
  reason: FirstPathRoadReason;
  /** Ticks since her latest path-fitting chapter started, else since the bond. */
  droughtTicks: number;
}

/** The scene facts the path's pull reads: an encounter cache entry carries both. */
export interface PathScene {
  readonly reachPrimary?: ReachDomain;
  readonly motivations?: readonly ValuePair[];
}

/** A chapter of hers, archived or still open: template and start tick. */
export interface PathChapter {
  readonly templateId: string;
  readonly startTick: number;
}

/** The god's `the_first` thread edge when it points at `agentId`, else undefined. */
function firstThreadTo(graph: WorldGraph, ascendantId: string | undefined, agentId: string): GraphEdge | undefined {
  if (!ascendantId) return undefined;
  return graph.getOutgoingEdges(ascendantId, 'thread').find(e =>
    (e.properties.courtPosition as string) === 'the_first' && e.target === agentId,
  );
}

/** Whether the path pulls this scene (a non-routine template whose Reach and motivations fit). */
export function sceneFitsPath(path: FirstPath | null, templateId: string, scene: PathScene | null | undefined): boolean {
  if (!path || !scene || isRoutineTemplate(templateId)) return false;
  return firstPathPullFor(path, scene.reachPrimary, scene.motivations) > 1;
}

/**
 * Whether the path's road is due for The First at this decision, and why; else null.
 * Pure but for reads. `topCandidates` is the board's encounter shortlist after the
 * path's lean (`applyFirstPathPull`): the road waits while one of them carries
 * `firstPathPull > 1`, because the lean can work on that one. `history`
 * (`firstPathChapters`) gives her chapters since the bond and whether one has
 * resolved; `sceneOf` resolves a template's Reach and motivations (the encounter
 * cache's own entry). The cheap gates run first, so `history` runs only for The
 * First, past the cooldown and the breath.
 */
export function firstPathRoadDue(
  graph: WorldGraph,
  ascendantId: string | undefined,
  agentId: string,
  tick: number,
  topCandidates: readonly { readonly firstPathPull?: number; readonly entry: { readonly templateId: string } }[],
  history: () => { chapters: readonly PathChapter[]; resolvedSinceBond: boolean },
  sceneOf: (templateId: string) => PathScene | null | undefined,
): FirstPathRoadDue | null {
  try {
    const thread = firstThreadTo(graph, ascendantId, agentId);
    if (!thread) return null;
    const path = firstPathFromRecord(thread.properties.meetingChoiceRecord as MeetingChoiceRecord | undefined);
    if (!path) return null;
    const last = thread.properties.restlessRoadCheckTick;
    if (typeof last === 'number' && last <= tick && tick - last < RESTLESS_ROAD_COOLDOWN_TICKS) return null;
    // During her story breath every story is held back on purpose; wait it out (as the restless road).
    if (storyBreathRemaining(graph, agentId, tick) > 0) return null;
    // A pulled chore does not count: the path's work is a story, and the lean also
    // touches routine scenes (review-gate round 1).
    if (topCandidates.some(c => (c.firstPathPull ?? 1) > 1 && !isRoutineTemplate(c.entry.templateId))) return null;
    const { chapters, resolvedSinceBond } = history();
    const bondTick = typeof thread.properties.establishedTick === 'number' ? thread.properties.establishedTick : 0;
    let anchor = bondTick;
    for (const ch of chapters) {
      if (ch.startTick > anchor && sceneFitsPath(path, ch.templateId, sceneOf(ch.templateId))) anchor = ch.startTick;
    }
    const droughtTicks = anchor > tick ? 0 : tick - anchor;
    if (!resolvedSinceBond) return { path, reason: 'no_chapter_yet', droughtTicks };
    if (droughtTicks >= FIRST_PATH_ROAD_DROUGHT_TICKS) return { path, reason: 'path_drought', droughtTicks };
    return null;
  } catch {
    return null;
  }
}

/**
 * Her chapters since the bond, archived and open, and whether a non-routine one has
 * resolved — the two facts `firstPathRoadDue` reads. Never throws.
 */
export function firstPathChapters(
  graph: WorldGraph,
  ascendantId: string | undefined,
  agentId: string,
  archive: readonly ChapterRecord[] | undefined,
  actions: readonly { actionId?: string; actorId: string; templateId: string; startTick: number; resolved?: boolean }[] | undefined,
): { chapters: PathChapter[]; resolvedSinceBond: boolean } {
  const chapters: PathChapter[] = [];
  let resolvedSinceBond = false;
  try {
    const thread = firstThreadTo(graph, ascendantId, agentId);
    if (!thread) return { chapters, resolvedSinceBond };
    const bondTick = typeof thread.properties.establishedTick === 'number' ? thread.properties.establishedTick : 0;
    const archived = new Set<string>();
    for (const rec of archive ?? []) {
      if (rec.actorId !== agentId || isRoutineChapter(rec)) continue;
      archived.add(rec.actionId);
      if (rec.startTick >= bondTick) chapters.push({ templateId: rec.templateId, startTick: rec.startTick });
      if (rec.resolved && rec.resolvedTick >= bondTick) resolvedSinceBond = true;
    }
    // Live actions, open or resolved: a chapter that resolved this tick is archived only
    // at the end of the tick, after agent decision (review-gate round 1).
    for (const a of actions ?? []) {
      if (a.actorId !== agentId || (a.actionId && archived.has(a.actionId))) continue;
      if (!isEncounterAction(a.templateId) || isRoutineTemplate(a.templateId)) continue;
      if (a.startTick >= bondTick) {
        chapters.push({ templateId: a.templateId, startTick: a.startTick });
        if (a.resolved) resolvedSinceBond = true;
      }
    }
  } catch {
    // fail-soft: what was gathered stands
  }
  return { chapters, resolvedSinceBond };
}

/** Keep only the entries the path pulls — the destination filter beside "may still draw". */
export function fittingEntries(path: FirstPath, entries: readonly EncounterCacheEntry[]): EncounterCacheEntry[] {
  return entries.filter(e => sceneFitsPath(path, e.templateId, e));
}

/**
 * Record a path-road check on the thread edge: every outcome starts the shared
 * cooldown (`restlessRoadCheckTick`); `set_out` also stamps `lastFirstPathRoadTick`.
 * Fail-soft: no thread, no write.
 */
export function recordFirstPathRoad(
  graph: WorldGraph,
  ascendantId: string | undefined,
  agentId: string,
  tick: number,
  outcome: FirstPathRoadOutcome,
): void {
  const thread = firstThreadTo(graph, ascendantId, agentId);
  if (!thread) return;
  try {
    graph.updateEdge(thread.id, {
      properties: outcome === 'set_out'
        ? { restlessRoadCheckTick: tick, lastFirstPathRoadTick: tick }
        : { restlessRoadCheckTick: tick },
    });
  } catch {
    // fail-soft: the cooldown is a nicety; the next decision re-checks
  }
}

export function emitFirstPathRoadTrace(
  tick: number,
  agentId: string,
  due: FirstPathRoadDue,
  outcome: FirstPathRoadOutcome,
  fromLocationId: string,
  dest: RestlessRoadDestination | null,
): void {
  emitTrace({
    category: 'first_path_road',
    tick,
    agentId,
    visionId: due.path.visionId,
    dueReason: due.reason,
    droughtTicks: due.droughtTicks,
    outcome,
    fromLocationId,
    toLocationId: dest?.locationId ?? null,
    hexDistance: dest?.hexDistance ?? null,
    targetTemplateId: dest?.targetEntry.templateId ?? null,
    summary: outcome === 'set_out'
      ? `${agentId}: path "${due.path.title}" (${due.reason}, ${due.droughtTicks} ticks); takes the road to ${dest?.locationId} (${dest?.hexDistance} hexes) for ${dest?.targetEntry.templateId}`
      : `${agentId}: path "${due.path.title}" (${due.reason}, ${due.droughtTicks} ticks); no_destination`,
  });
}

/** The world reference for a place: a sublocation when it carries a parent, else a location. */
function placeRef(graph: WorldGraph, locationId: string, name: string): WorldRef {
  const node = graph.getNode(locationId);
  const isSub = typeof node?.properties?.parentLocationId === 'string';
  return { kind: isSub ? 'sublocation' : 'location', id: locationId, name };
}

/**
 * The Chronicle event for The First on the path's road (Law 45: pushed only after
 * the move is set). Both names are segments with references (Laws 2, 21); an
 * unresolvable name falls back to plain words (Law 43). No `notification`: like
 * the restless road, it is not a moment that raises a toast (Law 15).
 */
export function buildFirstPathRoadEvent(
  graph: WorldGraph,
  agentId: string,
  destinationId: string,
  path: Pick<FirstPath, 'title'>,
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
  for (const part of FIRST_PATH_ROAD_LINE.split(/(\{name\}|\{place\}|\{path\})/)) {
    if (part === '') continue;
    if (part === '{name}') segments.push(nameSeg);
    else if (part === '{place}') segments.push(placeSeg);
    else if (part === '{path}') segments.push({ text: firstPathInLine(path.title) });
    else segments.push({ text: part });
  }
  const refs = segments.flatMap(s => (s.ref ? [s.ref] : []));
  return {
    id: `first_path_road_${agentId}_${tick}`,
    tick,
    type: 'agent_movement',
    message: segments.map(s => s.text).join(''),
    significance: 0.8,
    actorId: agentId,
    chronicleGate: 'threaded_only',
    ...(refs.length > 0 ? { refs } : {}),
    segments,
  };
}
