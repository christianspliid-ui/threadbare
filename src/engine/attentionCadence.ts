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
 * Ticks of story breath left for an agent, or 0 when none applies.
 *
 * A breath applies only to a mortal whose inbound thread is in `pause` mode
 * and carries a `lastStoryChapterEndTick` no later than `tick` (a future
 * anchor — a save edit — means no breath, fail-soft).
 */
export function storyBreathRemaining(graph: WorldGraph, agentId: string, tick: number): number {
  const thread = getThreadTo(graph, agentId);
  if (!thread) return 0;
  const props = thread.properties as unknown as ThreadEdgeProperties;
  // A dormant thread never halts, so it has nothing to pace.
  if (props.courtPosition === 'dormant') return 0;
  if (resolveAttentionMode(props) !== 'pause') return 0;
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
