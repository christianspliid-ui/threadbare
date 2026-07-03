/**
 * Cool-failure story-artifact guarantee (THR-571 C1).
 *
 * The outcome-ladder redesign's second half: *no failure reads as dead air*. Every resolved
 * `failure` / `critical_failure` action must leave at least one persistent story artifact —
 * a complication, an encounter seed, or a hidden mark — so the failure becomes a thread the
 * world can pick up later rather than a silent -0 to a probability.
 *
 * Most failures already leave something (a step complication, an authored aftermath hook, a
 * mark planted by a reaction). This post-pass *detects* that and, when a failure would leave
 * nothing, plants a scale-appropriate fallback hidden mark — a quiet consequence that future
 * social / investigation / same-family encounters can surface (systemic wiring guide,
 * Capability 3: Hidden Marks).
 *
 * It also maintains the two lifetime counters that back the KPI `failure_story_rate`
 * (denominator = every failure-band resolution; numerator = those that left an artifact),
 * mirroring the branchingFiresTotal pattern (THR-470) so the rate survives `unifiedActions`
 * pruning over a full run.
 *
 * NFP notes:
 * - #1 Tunability: severity/category/reveal-family tables are all named constants below.
 * - #2 Inspectability: emits `outcome_story_artifact` (+ `hidden_mark_placed` for fallbacks).
 * - #3 Determinism: no RNG — the fallback mark is placed unconditionally with a deterministic
 *   id derived from the actionId; same seed → same marks.
 * - #4 Fail-soft: the whole body is wrapped; if artifact placement throws, the failure still
 *   resolves (counted in the denominator) and a `source:'fallback', artifactKind:'none'` trace
 *   records the miss rather than crashing the tick.
 */

import type { GameState, TickEvent } from '../types/gameState';
import { MAX_RECENT_EVENTS } from '../types/gameState';
import type {
  UnifiedAction,
  UnifiedActionOutcome,
  ActionScale,
  HiddenMark,
  HiddenMarkCategory,
} from '../types/unifiedAction';
import { emitTrace } from './traceBuffer';

// ─── Constants (NFP #1) ───────────────────────────────────────────

/** Severity 0-1 of the fallback hidden mark by action scale — bigger stakes leave deeper marks.
 * Feeds reveal likelihood in future encounters (severity × REVEAL_PROBABILITY_MULT). */
export const FAILURE_ARTIFACT_SEVERITY_BY_SCALE: Record<ActionScale, number> = {
  personal: 0.3,
  local: 0.4,
  regional: 0.55,
  cosmic: 0.7,
};

/** Fallback mark category by outcome band. A plain failure is a quiet blemish on the record;
 * a critical failure is a botch the actor would rather keep buried. Both are discoverable. */
export const FAILURE_ARTIFACT_CATEGORY: Record<'failure' | 'critical_failure', HiddenMarkCategory> = {
  failure: 'reputation_note',
  critical_failure: 'concealed_action',
};

/** Default encounter families that can surface a fallback failure mark. The failing template's
 * own family is appended at placement so a similar future encounter can reveal it. */
export const FAILURE_ARTIFACT_REVEAL_FAMILIES: readonly string[] = ['social', 'investigation', 'faction'];

/** Human-readable label for the fallback mark, by outcome band. */
export const FAILURE_ARTIFACT_LABEL: Record<'failure' | 'critical_failure', string> = {
  failure: 'A misstep, quietly remembered',
  critical_failure: 'A grievous failure, concealed',
};

/** Chronicle significance for the fallback-mark placement event. Below the ~0.5 toast
 * threshold — the consequence is *hidden*, so it logs without raising a toast. */
export const FAILURE_ARTIFACT_EVENT_SIGNIFICANCE = 0.25;

// ─── Runtime counter view (avoids circular import with simulationRuntime.ts) ──

export interface FailureStoryCounters {
  failureOutcomesTotal: number;
  failureStoryArtifactsTotal: number;
}

// ─── Detection ────────────────────────────────────────────────────

type ExistingArtifact = { kind: 'complication' | 'seed' | 'mark'; refId?: string };

/**
 * Does this resolved action already carry a persistent story artifact? A bare reputation
 * delta does NOT count (systemic wiring guide: "if nothing persists except a reputation
 * number, the encounter is ephemeral") — only a complication, an encounter-seed hook, or a
 * hidden mark planted by this action's aftermath.
 */
export function detectExistingStoryArtifact(state: GameState, action: UnifiedAction): ExistingArtifact | null {
  // 1. A step complication (attached per-step by the resolution path).
  const complication = action.stepComplications?.find(c => c != null) ?? null;
  if (complication) return { kind: 'complication', refId: complication.templateId };

  // 2. A hidden mark this action's aftermath planted (markId format: `mark_${actionId}_...`).
  const markPrefix = `mark_${action.actionId}_`;
  const plantedMark = (state.hiddenMarks ?? []).find(m => m.markId.startsWith(markPrefix));
  if (plantedMark) return { kind: 'mark', refId: plantedMark.markId };

  // 3. An authored encounter-seed / future hook recorded on the aftermath changes.
  const hook = action.aftermathChanges?.find(c => c.kind === 'future_hook') ?? null;
  if (hook) return { kind: 'seed', refId: hook.id };

  return null;
}

// ─── Post-pass ────────────────────────────────────────────────────

const FAILURE_BAND: ReadonlySet<UnifiedActionOutcome> = new Set(['failure', 'critical_failure']);

/** Family prefix of a templateId (the segment before the first '.' or '-'), for reveal matching. */
function templateFamily(templateId: string): string {
  const m = /^[^.\-]+/.exec(templateId);
  return m ? m[0] : templateId;
}

/**
 * Guarantee a story artifact for one newly-resolved failure-band action, and maintain the
 * failure_story_rate counters. No-op (returns state unchanged) for non-failure outcomes.
 *
 * Call once per action at the newly-resolved transition (same site as branchingFiresTotal),
 * so the lifetime counters are honest and the fallback mark is placed exactly once.
 */
export function guaranteeFailureStoryArtifact(
  state: GameState,
  action: UnifiedAction,
  tick: number,
  runtime: FailureStoryCounters | undefined,
): GameState {
  const outcome = action.outcome;
  if (!outcome || !FAILURE_BAND.has(outcome)) return state;

  // Denominator: every failure-band resolution, counted here before pruning.
  if (runtime) runtime.failureOutcomesTotal++;

  try {
    const existing = detectExistingStoryArtifact(state, action);
    if (existing) {
      if (runtime) runtime.failureStoryArtifactsTotal++;
      emitTrace({
        tick,
        category: 'outcome_story_artifact',
        actionId: action.actionId,
        actorId: action.actorId,
        outcome,
        source: 'existing',
        artifactKind: existing.kind,
        refId: existing.refId,
        summary: `Failure story artifact (existing ${existing.kind}) for ${action.actorId} on ${action.templateId}`,
      });
      return state;
    }

    // Fallback: plant a scale-appropriate hidden mark so this failure is never dead air.
    const band: 'failure' | 'critical_failure' = outcome === 'critical_failure' ? 'critical_failure' : 'failure';
    const markId = `fail_artifact_${action.actionId}`;
    // Idempotency guard: never double-plant (the transition fires once, but be defensive).
    if ((state.hiddenMarks ?? []).some(m => m.markId === markId)) {
      if (runtime) runtime.failureStoryArtifactsTotal++;
      return state;
    }

    const severity = FAILURE_ARTIFACT_SEVERITY_BY_SCALE[action.scale] ?? 0.4;
    const category = FAILURE_ARTIFACT_CATEGORY[band];
    const label = FAILURE_ARTIFACT_LABEL[band];
    const family = templateFamily(action.templateId);
    const revealFamilies = FAILURE_ARTIFACT_REVEAL_FAMILIES.includes(family)
      ? FAILURE_ARTIFACT_REVEAL_FAMILIES
      : [...FAILURE_ARTIFACT_REVEAL_FAMILIES, family];

    const mark: HiddenMark = {
      markId,
      category,
      severity,
      label,
      sourceEncounterId: action.templateId,
      placedTick: tick,
      targetAgentId: action.actorId,
      revealFamilies,
    };

    const markEvent: TickEvent = {
      id: `${markId}_placed`,
      tick,
      type: 'narrative',
      message: 'A failure leaves its quiet residue, unseen.',
      significance: FAILURE_ARTIFACT_EVENT_SIGNIFICANCE,
      actorId: action.actorId,
    };

    const nextState: GameState = {
      ...state,
      hiddenMarks: [...(state.hiddenMarks ?? []), mark],
      tickEvents: [...state.tickEvents, markEvent],
      recentEvents: [...state.recentEvents, markEvent].slice(-MAX_RECENT_EVENTS),
    };

    if (runtime) runtime.failureStoryArtifactsTotal++;

    emitTrace({
      tick,
      category: 'hidden_mark_placed',
      agentId: action.actorId,
      markId,
      actorId: action.actorId,
      sourceEncounterId: action.templateId,
      sourceTemplateId: action.templateId,
      markCategory: category,
      severity,
      revealFamilies,
      label,
      summary: `Fallback failure mark placed: "${label}" on ${action.actorId} (reveals on: ${revealFamilies.join(', ')})`,
    });
    emitTrace({
      tick,
      category: 'outcome_story_artifact',
      actionId: action.actionId,
      actorId: action.actorId,
      outcome,
      source: 'fallback',
      artifactKind: 'mark',
      refId: markId,
      summary: `Failure story artifact (fallback mark) for ${action.actorId} on ${action.templateId}`,
    });

    return nextState;
  } catch (err) {
    // Fail-soft (NFP #4): the failure still resolved; record the miss, never crash the tick.
    emitTrace({
      tick,
      category: 'outcome_story_artifact',
      actionId: action.actionId,
      actorId: action.actorId,
      outcome,
      source: 'fallback',
      artifactKind: 'none',
      summary: `Failure story artifact skipped (fail-soft): ${(err as Error)?.message ?? 'unknown error'}`,
    });
    return state;
  }
}
