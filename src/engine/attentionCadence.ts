/**
 * Attention cadence (THR-1715) — the small, tick-path-safe helpers behind
 * "The First asks": the daily-life classification, the effective attention
 * mode of a thread, and the story breath.
 *
 * **Daily life.** A routine template is a chore: a raw encounter authored
 * `threatRating: 'trivial'` (mending, foraging, resting, harvest, assessing
 * holdings). `toUnifiedTemplate` carries it as `routine: true`. Routine work
 * still happens, archives and has consequences, but it never raises an
 * encounter notification, never asks the god, never fills the Chapter
 * Ledger's default view or badge, and is the only encounter a pause-mode
 * mortal may start during her story breath.
 *
 * **Story breath.** After a pause-mode mortal's story chapter resolves, the
 * thread edge records `lastStoryChapterEndTick`; for
 * `PAUSED_STORY_BREATH_TICKS` after it she starts no new story chapter.
 *
 * Its own module, not `chapterArchive.ts` or `encounterVisibility.ts`: the
 * filter pipeline, the visibility phase and resolution all read it on the
 * tick path, and those modules would otherwise import each other.
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | PAUSED_STORY_BREATH_TICKS | 22        | types/encounterVisibility.ts |
 * | ROUTINE_THREAT_RATING     | 'trivial' | types/encounterVisibility.ts |
 *
 * ─── Fail-soft ───────────────────────────────────────────────────
 * | Template id unknown            | `false`: treated as story, so it asks |
 * | Thread missing `attentionMode` | court-position default               |
 * | Anchor missing or in the future | no breath                           |
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None.
 */

import type { WorldGraph } from './graph';
import type { ThreadEdgeProperties } from '../types/influence';
import { PAUSED_STORY_BREATH_TICKS, VISIBILITY_BY_POSITION } from '../types/encounterVisibility';
import { PAUSED_STORY_MAX_TELLINGS, STORY_DROUGHT_RELAX_TICKS } from '../data/agent-behavior-constants';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { getThreadTo } from './graphQueries';
import { emitTrace } from './traceBuffer';

/**
 * Is this template daily life? Unknown ids fail toward *asking* (`false`):
 * an unclassified template is story.
 */
export function isRoutineTemplate(templateId: string): boolean {
  try {
    return getUnifiedTemplateById(templateId)?.routine === true;
  } catch {
    return false;
  }
}

/**
 * A thread's effective attention mode: the stored value, or its court
 * position's default when the field is absent (an old save).
 */
export function resolveAttentionMode(props: ThreadEdgeProperties): 'pause' | 'auto_resolve' {
  if (props.attentionMode) return props.attentionMode;
  const position = props.courtPosition ?? 'retinue';
  return VISIBILITY_BY_POSITION[position]?.defaultAttentionMode ?? 'auto_resolve';
}

/**
 * The inbound thread's properties when the agent is a *paused mortal* — an
 * inbound thread, not dormant, whose effective mode is `pause` — else null.
 * One predicate for every paused-mortal rule (THR-1218 E1): the story breath,
 * the repeat floor, the tellings cap and the drought.
 */
function pausedThreadProps(graph: WorldGraph, agentId: string): ThreadEdgeProperties | null {
  const thread = getThreadTo(graph, agentId);
  if (!thread) return null;
  const props = thread.properties as unknown as ThreadEdgeProperties;
  // A dormant thread never halts, so it has nothing to pace.
  if (props.courtPosition === 'dormant') return null;
  if (resolveAttentionMode(props) !== 'pause') return null;
  return props;
}

/** Is this agent a paused mortal — the player asked to be stopped for her story (THR-1218 E1)? */
export function isPausedThreadActor(graph: WorldGraph, agentId: string): boolean {
  return pausedThreadProps(graph, agentId) !== null;
}

/**
 * Ticks since a paused mortal's latest story chapter started (THR-1218 E4), or
 * 0 when she is not a paused mortal. Before her first story chapter it counts
 * from the thread's `establishedTick`, else from 0. A future anchor (a save
 * edit) reads as no drought, fail-soft.
 */
export function storyDroughtTicks(graph: WorldGraph, agentId: string, tick: number): number {
  const props = pausedThreadProps(graph, agentId);
  if (!props) return 0;
  const anchor = typeof props.lastStoryChapterStartTick === 'number'
    ? props.lastStoryChapterStartTick
    : (typeof props.establishedTick === 'number' ? props.establishedTick : 0);
  if (anchor > tick) return 0;
  return tick - anchor;
}

/** Whether the tellings cap is relaxed for this agent: a drought of at least STORY_DROUGHT_RELAX_TICKS. */
export function isTellingsCapRelaxed(graph: WorldGraph, agentId: string, tick: number): boolean {
  return storyDroughtTicks(graph, agentId, tick) >= STORY_DROUGHT_RELAX_TICKS;
}

/**
 * The tellings cap (THR-1218 D5 / E3): drop a paused mortal's *story*
 * candidates she has already told PAUSED_STORY_MAX_TELLINGS times (counted from
 * `attemptCount`, so a failed telling counts). Chores are never touched, so the
 * cap never empties a list on its own unless it held only retellings — then
 * she lives her daily life, and after STORY_DROUGHT_RELAX_TICKS without a story
 * the cap relaxes. Pass-through for every agent who is not a paused mortal.
 * Emits `encounter.tellings_capped` when it drops anything.
 */
export function applyStoryTellingsCap<T extends { templateId: string }>(
  graph: WorldGraph,
  agentId: string,
  tick: number,
  candidates: T[],
  attemptCount: Record<string, number>,
): T[] {
  if (candidates.length === 0) return candidates;
  if (!isPausedThreadActor(graph, agentId)) return candidates;
  if (isTellingsCapRelaxed(graph, agentId, tick)) return candidates;
  const dropped = new Set<string>();
  const kept = candidates.filter(c => {
    if (isRoutineTemplate(c.templateId)) return true;
    if ((attemptCount[c.templateId] ?? 0) < PAUSED_STORY_MAX_TELLINGS) return true;
    dropped.add(c.templateId);
    return false;
  });
  if (dropped.size === 0) return candidates;
  const droppedTemplateIds = [...dropped].sort();
  const remainingStoryCandidates = kept.filter(c => !isRoutineTemplate(c.templateId)).length;
  emitTrace({
    category: 'encounter.tellings_capped',
    tick,
    agentId,
    droppedTemplateIds,
    remainingStoryCandidates,
    relaxed: false,
    summary: `${agentId}: tellings cap dropped ${droppedTemplateIds.join(', ')}; ${remainingStoryCandidates} story candidate(s) left`,
  });
  return kept;
}

/**
 * Tellings per story template for a paused mortal (THR-1218 debug field):
 * `attemptCount` filtered to non-routine templates. Empty for anyone else.
 */
export function storyTellings(
  graph: WorldGraph,
  agentId: string,
  attemptCount: Record<string, number> | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!attemptCount || !isPausedThreadActor(graph, agentId)) return out;
  for (const id of Object.keys(attemptCount).sort()) {
    if (!isRoutineTemplate(id)) out[id] = attemptCount[id];
  }
  return out;
}

/**
 * Write the drought anchor (THR-1218 E4): a paused mortal just started a story
 * chapter. Called at action creation in agent decision. Fail-soft: a routine
 * template, a missing or non-pause thread writes nothing. Returns whether it wrote.
 */
export function recordStoryChapterStart(
  graph: WorldGraph,
  actorId: string,
  templateId: string,
  tick: number,
): boolean {
  if (isRoutineTemplate(templateId)) return false;
  const thread = getThreadTo(graph, actorId);
  if (!thread) return false;
  if (!pausedThreadProps(graph, actorId)) return false;
  try {
    graph.updateEdge(thread.id, { properties: { lastStoryChapterStartTick: tick } });
  } catch {
    return false;
  }
  return true;
}

/**
 * Ticks of story breath left for an agent, or 0 when none applies.
 *
 * A breath applies only to a mortal whose inbound thread is in `pause` mode
 * and carries a `lastStoryChapterEndTick` no later than `tick` (a future
 * anchor — a save edit — means no breath, fail-soft).
 */
export function storyBreathRemaining(graph: WorldGraph, agentId: string, tick: number): number {
  const props = pausedThreadProps(graph, agentId);
  if (!props) return 0;
  const anchor = props.lastStoryChapterEndTick;
  if (typeof anchor !== 'number' || anchor > tick) return 0;
  return Math.max(0, anchor + PAUSED_STORY_BREATH_TICKS - tick);
}

/**
 * Write the story-breath anchor (THR-1715 E5): a pause-mode mortal's story
 * chapter (a non-routine encounter) just resolved, so her breath begins.
 *
 * Called twice per tick by the orchestrator, for actions that already passed
 * `isEncounterAction`: once just before agent decision (2b), for chapters the
 * progress phases resolved this tick, so the same tick's decision already sees
 * the breath; and again at the chapter-archive write, for anything resolved
 * after 2b. A relationship-internal datum, so it
 * lives on the thread edge. Returns whether an anchor was written. Fail-soft:
 * a missing thread, an auto-mode thread or a routine template writes nothing.
 */
export function recordStoryChapterEnd(
  graph: WorldGraph,
  actorId: string,
  actionId: string,
  templateId: string,
  tick: number,
): boolean {
  if (isRoutineTemplate(templateId)) return false;
  const thread = getThreadTo(graph, actorId);
  if (!thread) return false;
  const props = thread.properties as unknown as ThreadEdgeProperties;
  if (props.courtPosition === 'dormant') return false;
  if (resolveAttentionMode(props) !== 'pause') return false;
  // Idempotent per tick: the orchestrator records before agent decision and again
  // at the archive write, so a chapter resolved in either half of the tick anchors.
  if (props.lastStoryChapterEndTick === tick) return false;
  try {
    graph.updateEdge(thread.id, { properties: { lastStoryChapterEndTick: tick } });
  } catch {
    return false;
  }
  emitTrace({
    category: 'attention.story_breath_start',
    tick,
    agentId: actorId,
    actionId,
    templateId,
    breathUntilTick: tick + PAUSED_STORY_BREATH_TICKS,
    summary: `${actorId}: story chapter ${templateId} ended; breath until ${tick + PAUSED_STORY_BREATH_TICKS}`,
  });
  return true;
}
