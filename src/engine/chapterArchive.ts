/**
 * Chapter Archive (THR-603).
 *
 * Distills each resolving encounter `UnifiedAction` into a compact, self-contained
 * `ChapterRecord` and appends it to `gameState.chapterArchive`, so a resolved
 * encounter stays fully readable in the Chapter Ledger for the whole run — long
 * after the heavyweight `UnifiedAction` is pruned (`RESOLVED_ACTION_RETENTION_TICKS`).
 *
 * Prose is snapshotted here exactly as the player read it (post-`enrichProse()`),
 * mirroring the live encounter stage adapter (`buildUnifiedEncounterStageModel`), so
 * the ledger never re-enriches on render.
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | CHAPTER_ARCHIVE_CAP        | 2000 | Max records per run before eviction |
 * | CHAPTER_ARCHIVE_EVICT_BATCH| 100  | Records dropped per overflow pass   |
 * | CHAPTER_LEDGER_PAGE_SIZE   | 25   | Ledger rows per page (UI-consumed)  |
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None — deterministic bookkeeping. Prose enrichment reuses the same deterministic
 * paths the UI uses.
 *
 * ─── Fail-soft ───────────────────────────────────────────────────
 * The whole build is wrapped; any failure yields a best-effort record with
 * placeholder prose rather than throwing. Resolution is never blocked.
 */

import type { WorldGraph } from './graph';
import type { GameState } from '../types/gameState';
import type { SimulationRuntime } from './simulationRuntime';
import type {
  ChapterRecord,
  ChapterStepRecord,
  ChapterParticipant,
} from '../types/chapterRecord';
import {
  afterimageForOutcome,
  isActionStepBranch,
  type UnifiedAction,
  type UnifiedActionTemplate,
} from '../types/unifiedAction';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { getAnyEncounterById } from '../data/encounter-content';
import { isBranchingTemplate } from './kpi/gameplayKpi';
import { enrichProse, gatherNarrativeContext } from './proseEnrichment';
import { resolveStepDefinition } from './unifiedActionLifecycle';
import { stepOutcomeToOutcomeBand } from '../data/outcome-band-content';
import { emitTrace } from './traceBuffer';
import type { ChapterArchivedTrace } from '../types/trace';

// ─── Constants (NFP #1) ───────────────────────────────────────────

/** Max archived chapter records per run; eviction begins above this. */
export const CHAPTER_ARCHIVE_CAP = 2000;
/** Records evicted per overflow pass (oldest non-threaded first, then oldest). */
export const CHAPTER_ARCHIVE_EVICT_BATCH = 100;
/** Ledger rows per page (consumed by the Chapter Ledger UI). */
export const CHAPTER_LEDGER_PAGE_SIZE = 25;

const FADED_STEP_PROSE = 'The record of this step has faded.';
const DEPARTED_MORTAL = 'a departed mortal';

// ─── Encounter-category predicate ─────────────────────────────────

/**
 * True when a resolved action is an *encounter* worth archiving as a chapter
 * (vs. a raw divine action). Encounters come from the encounter libraries, and
 * all branching quest templates are encounters. Divine actions are neither.
 */
export function isEncounterAction(templateId: string): boolean {
  return getAnyEncounterById(templateId) !== undefined || isBranchingTemplate(templateId);
}

/** Display name for an encounter template id — falls back to the id when unknown. */
export function getChapterTemplateName(templateId: string): string {
  return resolveTemplate(templateId)?.name ?? templateId;
}

// ─── Prose helpers (mirror buildUnifiedEncounterStageModel) ───────

// THR-1041: `afterimageForOutcome` moved to `types/unifiedAction` and is now
// shared with the encounter stage model builder — the ledger and Scene So Far
// resolve the same band from the same function instead of drifting apart.

function resolveTemplate(templateId: string): UnifiedActionTemplate | undefined {
  return getUnifiedTemplateById(templateId) ?? getAnyEncounterById(templateId);
}

function nodeName(graph: WorldGraph, id: string | undefined, fallback: string): string {
  if (!id) return fallback;
  return graph.getNode(id)?.name ?? fallback;
}

function isActorThreaded(graph: WorldGraph, actorId: string, ascendantId: string | undefined): boolean {
  if (!ascendantId) return false;
  try {
    return graph.getIncomingEdges(actorId, 'thread').some(e => e.source === ascendantId);
  } catch {
    return false;
  }
}

// ─── Record builder ───────────────────────────────────────────────

/**
 * Build a `ChapterRecord` from an encounter action — resolved (for the archive) or
 * active (for the ledger's live rows). Returns `null` if the action is not an
 * encounter. Never throws — degrades to placeholder prose.
 *
 * @param action  An encounter `UnifiedAction`. When resolved, `completedAtTick` is stamped.
 * @param state   Current game state (live graph + tick).
 * @param runtime Optional runtime — passed to `enrichProse` for outcome-band dedup fidelity.
 */
export function buildChapterRecord(
  action: UnifiedAction,
  state: GameState,
  runtime?: SimulationRuntime,
): ChapterRecord | null {
  if (!isEncounterAction(action.templateId)) return null;

  const graph = state.graph;
  const template = resolveTemplate(action.templateId);
  const actorName = nodeName(graph, action.actorId, DEPARTED_MORTAL);
  const targetName = nodeName(graph, action.targetId, 'a distant place');
  const resolvedTick = action.completedAtTick ?? state.tick;

  const participants: ChapterParticipant[] = (action.supportBindings ?? []).map(b => ({
    id: b.nodeId,
    name: nodeName(graph, b.nodeId, b.key),
    kind: b.kind,
  }));

  // Base record — populated even if template/prose is unavailable (fail-soft).
  const base = {
    actionId: action.actionId,
    templateId: action.templateId,
    templateName: template?.name ?? action.templateId,
    actorId: action.actorId,
    actorName,
    targetId: action.targetId,
    targetName,
    scale: action.scale,
    startTick: action.startTick,
    resolvedTick,
    resolved: action.resolved,
    outcome: action.outcome,
    threaded: isActorThreaded(graph, action.actorId, state.ascendantId),
    participants,
    eventNodeId: action.eventNodeId,
    aftermathProse: action.aftermathSummary?.overview,
    aftermathSummary: action.aftermathSummary,
  } satisfies Omit<ChapterRecord, 'openingProse' | 'steps'>;

  if (!template) {
    return { ...base, openingProse: FADED_STEP_PROSE, steps: [] };
  }

  try {
    const ctx = gatherNarrativeContext(
      graph,
      action.actorId,
      undefined,
      undefined,
      undefined,
      state,
      state.tick,
    );

    const openingProse = enrichProse(template.narrativeTemplates?.initiation ?? '', ctx);

    // Snapshot each step the encounter reached, as the player saw it. Resolved chapters
    // include every resolved step; an active chapter also includes its in-progress step.
    const reachedCount = action.resolved
      ? action.stepOutcomes.length
      : Math.min(action.currentStep + 1, template.steps.length);
    const steps: ChapterStepRecord[] = [];
    for (let index = 0; index < Math.max(reachedCount, 0); index++) {
      steps.push(buildStepRecord(template, action, index, ctx, runtime));
    }

    return { ...base, openingProse, steps };
  } catch {
    // Fail-soft: a malformed template/context must not block resolution or lose the chapter.
    return { ...base, openingProse: FADED_STEP_PROSE, steps: [] };
  }
}

function buildStepRecord(
  template: UnifiedActionTemplate,
  action: UnifiedAction,
  index: number,
  ctx: ReturnType<typeof gatherNarrativeContext>,
  runtime?: SimulationRuntime,
): ChapterStepRecord {
  const outcome = action.stepOutcomes[index];
  let label = `Step ${index + 1}`;
  let narrativeProse = FADED_STEP_PROSE;
  let afterimageProse: string | undefined;

  try {
    const resolved = resolveStepDefinition(template, index, action.choiceHistory);
    label = resolved.narrativeTemplate ? `Step ${index + 1}: ${resolved.reach}` : `Step ${index + 1}`;
    narrativeProse = enrichProse(resolved.narrativeTemplate ?? '', ctx) || FADED_STEP_PROSE;

    if (outcome) {
      const rawAfterimage = afterimageForOutcome(resolved, outcome);
      if (rawAfterimage) {
        const stepCtx = { ...ctx, outcomeBand: stepOutcomeToOutcomeBand(outcome) };
        afterimageProse = enrichProse(rawAfterimage, stepCtx, { runtime });
      }
    }
  } catch {
    // Placeholder already set; a single malformed step never sinks the whole chapter.
  }

  const rawStep = template.steps[index];
  if (rawStep && isActionStepBranch(rawStep) && label === `Step ${index + 1}`) {
    label = `Step ${index + 1} (branching)`;
  }

  const complicationProse = action.stepComplications?.[index]?.prose;
  const choiceText = action.choiceHistory?.find(c => c.stepIndex === index)?.choiceText;

  return {
    index,
    label,
    narrativeProse,
    afterimageProse,
    outcome,
    complicationProse,
    choiceText,
  };
}

// ─── Append + eviction ────────────────────────────────────────────

/**
 * Append new chapter records to the archive, evicting the oldest non-threaded
 * records first (then oldest overall) when the cap is exceeded. Pure — returns a
 * new array; never mutates its input.
 */
export function appendChapters(
  archive: readonly ChapterRecord[],
  newRecords: readonly ChapterRecord[],
  cap: number = CHAPTER_ARCHIVE_CAP,
  batch: number = CHAPTER_ARCHIVE_EVICT_BATCH,
): readonly ChapterRecord[] {
  const combined = [...archive, ...newRecords];
  if (combined.length <= cap) return combined;

  // Over cap: evict a batch (or the overflow, whichever is larger) to reduce churn.
  const overflow = combined.length - cap;
  const toEvict = Math.min(Math.max(overflow, batch), combined.length);

  // Prefer evicting oldest non-threaded chapters; keep player-invested (threaded) ones.
  const evictOrder = [...combined].sort((a, b) => {
    const at = a.threaded ? 1 : 0;
    const bt = b.threaded ? 1 : 0;
    if (at !== bt) return at - bt; // non-threaded (0) evicted first
    return a.resolvedTick - b.resolvedTick; // older first
  });
  const evictIds = new Set(evictOrder.slice(0, toEvict).map(r => r.actionId));

  return combined.filter(r => !evictIds.has(r.actionId));
}

// ─── Tracing (NFP #2) ─────────────────────────────────────────────

/** Emit an `encounter.chapter_archived` trace. No-op when tracing is disabled. */
export function emitChapterArchivedTrace(
  record: ChapterRecord,
  tick: number,
  archiveSize: number,
): void {
  // Typed local (not an inline object literal) so the union assignment does not
  // trip excess-property checks — the codebase's emitTrace(...) idiom for
  // category-discriminated traces carrying an agentId.
  const trace: Omit<ChapterArchivedTrace, 'id' | 'timestamp'> = {
    category: 'encounter.chapter_archived',
    tick,
    agentId: record.actorId,
    actionId: record.actionId,
    templateId: record.templateId,
    outcome: record.outcome ?? 'unknown',
    threaded: record.threaded,
    archiveSize,
    summary: `chapter archived: ${record.templateName} (${record.outcome ?? 'unknown'}) → archive ${archiveSize}`,
  };
  emitTrace(trace);
}
