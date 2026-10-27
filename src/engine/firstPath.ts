/**
 * The path you chose comes back (THR-1988).
 *
 * The "What will they become?" pick is a real choice — the vision's Reach gets
 * the investment and sets The First's mark — but nothing named it afterwards.
 * This module is the one reader of that choice: `getFirstPath` resolves the
 * stored `meetingChoiceRecord.sparkVisionId` against the catalog (no new graph
 * data), and the first chapter after the bond opens with one recall line.
 *
 * **First chapter.** The same test `openingReveal.ts` uses: The First's open,
 * non-routine encounter, while no non-routine chapter of hers has resolved since
 * the bond. `noteFirstPathRecall` runs once per tick (orchestrator 2b.1a) and
 * pins that chapter's action id on the thread edge (`firstPathRecalledActionId`),
 * so the stage model only reads it and a later chapter never repeats the line.
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None.
 *
 * ─── Fail-soft ───────────────────────────────────────────────────
 * | No bond / no record / unknown vision id | `getFirstPath` → null; no line |
 * | Vision without a title                  | null; no line                  |
 * | Any throw                               | null / false                   |
 */

import type { WorldGraph } from './graph';
import type { GameState } from '../types/gameState';
import type { ReachDomain } from '../types/traits';
import type { MeetingChoiceRecord } from '../types/meetingEncounter';
import type { UnifiedAction } from '../types/unifiedAction';
import { SPARK_VISION_CATALOG } from '../data/spark-vision-catalog';
import { FIRST_PATH_BOND_LINE, FIRST_PATH_RECALL_LINE } from '../data/meeting-narrative-prose';
import { FIRST_PATH_PULL } from '../data/premonition-constants';
import { FIRST_PATH_FIT_LINE } from '../data/premonition-content';
import { isEncounterAction, isRoutineChapter } from './chapterArchive';
import { isRoutineTemplate } from './attentionCadence';
import { emitTrace } from './traceBuffer';

export interface FirstPath {
  readonly visionId: string;
  /** Sentence case, as the card shows it: "Warden of the walls". */
  readonly title: string;
  /** The Reach the path strengthened (and The First's mark). */
  readonly reach: ReachDomain;
  /**
   * THR-2068 — the vision's `requiredPrimaryReach`: who she is, beside `reach`, what
   * she becomes. A path is these two Reaches. Falls back to `reach` when the vision
   * names none.
   */
  readonly requiredReach: ReachDomain;
}

/** The god's `the_first` thread edge, or undefined before the bond. */
function firstThread(graph: WorldGraph, ascendantId: string) {
  return graph.getOutgoingEdges(ascendantId, 'thread').find(e =>
    (e.properties.courtPosition as string) === 'the_first',
  );
}

/** The path a meeting record chose, or null when the record or its vision has none. */
export function firstPathFromRecord(record: MeetingChoiceRecord | null | undefined): FirstPath | null {
  if (!record?.sparkVisionId) return null;
  const vision = SPARK_VISION_CATALOG.find(v => v.id === record.sparkVisionId);
  if (!vision?.title) return null;
  return {
    visionId: vision.id,
    title: vision.title,
    reach: vision.reachInvestment,
    requiredReach: vision.requiredPrimaryReach ?? vision.reachInvestment,
  };
}

/** The path the god chose for The First at the bond, or null. Pure. */
export function getFirstPathFromGraph(graph: WorldGraph, ascendantId: string): FirstPath | null {
  try {
    const record = firstThread(graph, ascendantId)?.properties.meetingChoiceRecord as MeetingChoiceRecord | undefined;
    return firstPathFromRecord(record);
  } catch {
    return null;
  }
}

/** The path, only when `agentId` is The First (the sheet row). */
export function getFirstPathFor(graph: WorldGraph, ascendantId: string | undefined, agentId: string): FirstPath | null {
  if (!ascendantId) return null;
  try {
    const thread = firstThread(graph, ascendantId);
    if (!thread || thread.target !== agentId) return null;
    return firstPathFromRecord(thread.properties.meetingChoiceRecord as MeetingChoiceRecord | undefined);
  } catch {
    return null;
  }
}

export function getFirstPath(state: GameState): FirstPath | null {
  if (!state.ascendantId) return null;
  return getFirstPathFromGraph(state.graph, state.ascendantId);
}

/** The title inside a sentence: "Warden of the walls" → "the warden of the walls". */
export function firstPathInLine(title: string): string {
  return `the ${title.charAt(0).toLowerCase()}${title.slice(1)}`;
}

/** "{name} will become the warden of the walls." */
export function formatFirstPathBondLine(name: string, title: string): string {
  return FIRST_PATH_BOND_LINE.replace('{name}', name).replace('{path}', firstPathInLine(title));
}

export function formatFirstPathRecallLine(name: string, title: string): string {
  return FIRST_PATH_RECALL_LINE.replace('{name}', name).replace('{path}', firstPathInLine(title));
}

/** The First's open, non-routine chapter — the first in action order — or null. */
function openFirstChapter(state: GameState, firstId: string): UnifiedAction | null {
  for (const a of state.unifiedActions ?? []) {
    if (a.resolved || a.actorId !== firstId) continue;
    if (!isEncounterAction(a.templateId) || isRoutineTemplate(a.templateId)) continue;
    return a;
  }
  return null;
}

function hasResolvedChapterSince(state: GameState, firstId: string, bondTick: number): boolean {
  return (state.chapterArchive ?? []).some(rec =>
    rec.resolved && rec.actorId === firstId && !isRoutineChapter(rec) && rec.resolvedTick >= bondTick,
  );
}

/**
 * Pin The First's first chapter after the bond for the recall line (tick path).
 * Writes `firstPathRecalledActionId` once per bond and traces `first_path_recalled`.
 * Returns whether it wrote. Never throws.
 */
export function noteFirstPathRecall(state: GameState): boolean {
  try {
    if (!state.ascendantId) return false;
    const thread = firstThread(state.graph, state.ascendantId);
    if (!thread || thread.properties.firstPathRecalledActionId) return false;
    const path = firstPathFromRecord(thread.properties.meetingChoiceRecord as MeetingChoiceRecord | undefined);
    if (!path) return false;
    const firstId = thread.target;
    const bondTick = typeof thread.properties.establishedTick === 'number' ? thread.properties.establishedTick : 0;
    if (hasResolvedChapterSince(state, firstId, bondTick)) return false;
    const chapter = openFirstChapter(state, firstId);
    if (!chapter) return false;
    state.graph.updateEdge(thread.id, { properties: { firstPathRecalledActionId: chapter.actionId } });
    emitTrace({
      category: 'first_path_recalled',
      tick: state.tick,
      agentId: firstId,
      visionId: path.visionId,
      actionId: chapter.actionId,
      templateId: chapter.templateId,
      summary: `${firstId}: first chapter ${chapter.templateId} opens by recalling the path "${path.title}"`,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * The recall line for this action, or null: only The First's pinned first chapter,
 * only on its opening step. Read-only — the stage model calls it on every render.
 */
export function firstPathRecallFor(
  graph: WorldGraph,
  ascendantId: string | undefined,
  action: Pick<UnifiedAction, 'actionId' | 'actorId' | 'currentStep' | 'resolved'>,
): string | null {
  try {
    if (!ascendantId || action.resolved || action.currentStep !== 0) return null;
    const thread = firstThread(graph, ascendantId);
    if (!thread || thread.target !== action.actorId) return null;
    if (thread.properties.firstPathRecalledActionId !== action.actionId) return null;
    const path = firstPathFromRecord(thread.properties.meetingChoiceRecord as MeetingChoiceRecord | undefined);
    if (!path) return null;
    const name = graph.getNode(action.actorId)?.name ?? 'The First';
    return formatFirstPathRecallLine(name, path.title);
  } catch {
    return null;
  }
}

// ─── The path leans (THR-2068) ───────────────────────────────────

/** ×(1 + FIRST_PATH_PULL) when the scene's main Reach is one of the path's two; else 1. Pure. */
export function firstPathPullFor(path: FirstPath | null, entryReach: ReachDomain | undefined): number {
  if (!path || !entryReach) return 1;
  return entryReach === path.reach || entryReach === path.requiredReach ? 1 + FIRST_PATH_PULL : 1;
}

/** "Fits the unseen blade." — the God's Will option line for a scene that fits the path. */
export function formatFirstPathFitLine(title: string): string {
  return FIRST_PATH_FIT_LINE.replace('{path}', () => firstPathInLine(title));
}

interface PathPullCandidate {
  readonly entry: { readonly reachPrimary: ReachDomain };
  finalScore: number;
  firstPathPull?: number;
}

interface PathPullDecision<C extends PathPullCandidate> {
  rankedCandidates: C[];
  topCandidates: C[];
  selected: C | null;
}

/**
 * Fold the path's lean into The First's decision, in place — the same steps
 * `applyWhisperPull` takes: matching candidates get `firstPathPull` and a scaled
 * `finalScore`, the ranked list is re-sorted and the top list re-cut at its size, and
 * a legacy selection follows the new leader when it clears `idleThreshold`. The live
 * board multiplies `firstPathPull` in (it never reads `finalScore`).
 * Returns how many candidates were pulled; 0 with no path.
 */
export function applyFirstPathPull<C extends PathPullCandidate>(
  decision: PathPullDecision<C>,
  path: FirstPath | null,
  idleThreshold: number,
): number {
  if (!path) return 0;
  let pulled = 0;
  const reweigh = (c: C): C => {
    const pull = firstPathPullFor(path, c.entry.reachPrimary);
    if (pull <= 1) return c;
    pulled++;
    return { ...c, finalScore: c.finalScore * pull, firstPathPull: pull };
  };
  const ranked = decision.rankedCandidates.map(reweigh).sort((a, b) => b.finalScore - a.finalScore);
  if (pulled === 0) return 0;
  const topSize = decision.topCandidates.length;
  decision.rankedCandidates = ranked;
  decision.topCandidates = ranked.slice(0, topSize);
  if (decision.selected) {
    const top = ranked[0] ?? null;
    decision.selected = top && top.finalScore >= idleThreshold ? top : decision.selected;
  }
  return pulled;
}
