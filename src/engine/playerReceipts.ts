/**
 * Phase: player_receipts — Divine Receipt (THR-727).
 *
 * The player's action card is the core verb, and until now it had no consequence
 * surface: when a player-sourced `UnifiedAction` resolves the engine assembles a full
 * `aftermathSummary` (prose overview, itemized changes, optional authored reactions)
 * in `unifiedActionResolution.ts` and then discards it for player actions — the
 * resolution events carry no `notification`, player successes score below the chronicle
 * threshold, and the encounter-aftermath modal path only fires for threaded agents.
 * This phase closes that gap: each tick it finds resolved player actions that have not
 * yet produced a receipt, builds a `PlayerActionReceipt` from the summary, and queues
 * it for the UI as either a band-accented completion toast (minor casts) or a full
 * receipt dialogue (multi-step / rare / world-shifting casts).
 *
 * ─── Slot ────────────────────────────────────────────────────────────────────────
 * `post-resolution`: runs after `phaseUnifiedActionProgress` has assembled
 * `aftermathSummary`. Shares the slot with `phaseAutonomousAftermath`, which filters to
 * non-player actors — the two scans are disjoint by construction, so no ordering
 * constraint is needed.
 *
 * ─── Idempotency ──────────────────────────────────────────────────────────────────
 * A resolved action is flagged `playerReceiptEmitted` once consumed (mirrors
 * `autonomousAftermathApplied`); the scan skips flagged actions until cleanup prunes
 * them, so a receipt is enqueued exactly once.
 *
 * ─── Determinism (NFP #3) ─────────────────────────────────────────────────────────
 * Candidate order is a stable sort (oldest startTick first, actionId tie-break). No
 * PRNG — the framing line is chosen by an action-id hash in `receipt-content.ts`.
 *
 * ─── Fail-soft (NFP #4) ───────────────────────────────────────────────────────────
 * | Failure case                              | Fallback                                  |
 * |-------------------------------------------|-------------------------------------------|
 * | Template not found for a resolved action  | Skip receipt, `fallback_receipt` trace, mark|
 * | `aftermathSummary` absent                 | Minimal receipt (outcome + name, no changes)|
 * | `enrichProse()` throws                    | Raw overview string                       |
 * | Queue at RECEIPT_QUEUE_MAX                | Drop oldest, `queue_capped` trace         |
 * | Ascendant Beat template reaches the scan  | Excluded (has its own AscendantBeatModal) |
 * | Headless / CLI (nothing acknowledges)     | Queue self-caps; never blocks the tick    |
 */
import type { GameState, TickEvent } from '../types/gameState';
import type {
  UnifiedAction,
  UnifiedActionOutcome,
  EncounterAftermathChange,
  EncounterAftermathReaction,
} from '../types/unifiedAction';
import type { EncounterSupportBundle } from '../types/encounter';
import type { SphereName } from '../types';
import type { OutcomeBand } from './outcomeConsequences';
import type { PlayerReceiptTrace } from '../types/trace';
import type { EnginePhase, PhaseContext, PhaseResult } from './phaseRegistry';
import { emitTrace } from './traceBuffer';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { ASCENDANT_POOL_BEAT_TEMPLATES } from '../data/ascendant-pool-beat-templates';
import { enrichProse, gatherNarrativeContext } from './proseEnrichment';
import { outcomeBandWord } from '../data/outcome-band-content';
import {
  RECEIPT_MODAL_MIN_STEPS,
  RECEIPT_MODAL_RARITY_FLOOR,
  RECEIPT_MODAL_CHANGE_KINDS,
  RECEIPT_QUEUE_MAX,
  RECEIPT_EVENT_SIGNIFICANCE_TOAST,
  RECEIPT_EVENT_SIGNIFICANCE_MODAL,
} from '../data/receipt-content';

// ─── Receipt type ────────────────────────────────────────────────────────────────

/**
 * A resolution-time outcome record for one player-sourced action. Transient
 * presentation state (not a graph node — the world-side record already exists as the
 * encounter event node). Lives on `GameState.playerActionReceipts`.
 */
export interface PlayerActionReceipt {
  readonly id: string;
  readonly actionId: string;
  readonly templateId: string;
  readonly templateName: string;
  readonly targetId: string;
  readonly targetName: string;
  readonly sphere?: SphereName;
  readonly essencePaid: number;
  readonly startTick: number;
  readonly resolvedTick: number;
  readonly outcome: UnifiedActionOutcome;
  readonly outcomeBand: OutcomeBand;
  readonly overview: string;
  readonly changes: readonly EncounterAftermathChange[];
  readonly reactions?: readonly EncounterAftermathReaction[];
  readonly presentation: 'modal' | 'toast';
  readonly acknowledged: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

/** Lazy set of Ascendant Beat template ids — beats keep their own AscendantBeatModal. */
let _beatTemplateIds: Set<string> | null = null;
function isBeatTemplate(templateId: string): boolean {
  if (!_beatTemplateIds) {
    _beatTemplateIds = new Set(ASCENDANT_POOL_BEAT_TEMPLATES.map((t) => t.id));
  }
  return _beatTemplateIds.has(templateId);
}

/** Fallback map from the final action outcome to an outcome band (used when the summary carries no narrativeTag). */
const ACTION_OUTCOME_TO_BAND: Record<UnifiedActionOutcome, OutcomeBand> = {
  critical_success: 'surge',
  success: 'neutral',
  success_at_cost: 'strained',
  contested_won: 'neutral',
  contested_lost: 'setback',
  failure: 'setback',
  critical_failure: 'catastrophe',
};

function outcomeBandForAction(action: UnifiedAction): OutcomeBand {
  const tag = action.aftermathSummary?.narrativeTag;
  if (tag) return tag as OutcomeBand;
  return ACTION_OUTCOME_TO_BAND[action.outcome ?? 'success'] ?? 'neutral';
}

/** Tier the receipt into a modal (major cast) or a toast (minor cast). */
function decidePresentation(
  templateSteps: number,
  rarityTier: number,
  changes: readonly EncounterAftermathChange[],
  reactionCount: number,
): 'modal' | 'toast' {
  if (templateSteps >= RECEIPT_MODAL_MIN_STEPS) return 'modal';
  if (rarityTier >= RECEIPT_MODAL_RARITY_FLOOR) return 'modal';
  if (changes.some((c) => RECEIPT_MODAL_CHANGE_KINDS.includes(c.kind))) return 'modal';
  if (reactionCount > 0) return 'modal';
  return 'toast';
}

/** True when the text carries a `{placeholder:...}` token worth enriching. */
function needsEnrichment(text: string | undefined): boolean {
  return !!text && text.includes('{');
}

/**
 * Gather the narrative context a receipt's authored prose resolves against.
 * Returns undefined when it cannot be built, so callers fall soft to the raw string.
 *
 * THR-1050 — `supportBundle` is required for `{cast:*}` to resolve at all:
 * `resolveSceneCastContext` returns undefined without it, so every cast token
 * stripped instead of naming its actor. The bundle supplies the declared keys,
 * the action's bindings supply who each key resolved to; the attended stage
 * adapter has threaded both since THR-696 and this path had only the bindings.
 */
function receiptNarrativeContext(
  state: GameState,
  action: UnifiedAction,
  supportBundle: EncounterSupportBundle | undefined,
) {
  try {
    return gatherNarrativeContext(
      state.graph,
      action.actorId,
      undefined,
      undefined,
      state.doomIdentityMatrix,
      state,
      state.tick,
      { targetId: action.targetId, supportBundle, supportBindings: action.supportBindings },
    );
  } catch {
    return undefined;
  }
}

/** Enrich one authored string against an already-gathered context; fail-soft to raw. */
function enrichReceiptText(
  raw: string,
  ctx: ReturnType<typeof receiptNarrativeContext>,
): string {
  if (!needsEnrichment(raw) || !ctx) return raw ?? '';
  try {
    return enrichProse(raw, ctx);
  } catch {
    return raw;
  }
}

function emitReceiptTrace(entry: Omit<PlayerReceiptTrace, 'id' | 'timestamp'>): void {
  emitTrace(entry as unknown as Parameters<typeof emitTrace>[0]);
}

// ─── Phase ───────────────────────────────────────────────────────────────────────

export function processPlayerReceipts(state: GameState, _ctx: PhaseContext): PhaseResult {
  const candidates = state.unifiedActions.filter(
    (a) =>
      a.resolved &&
      a.source === 'player' &&
      !a.playerReceiptEmitted &&
      !isBeatTemplate(a.templateId),
  );
  if (candidates.length === 0) return {};

  const sorted = [...candidates].sort((l, r) =>
    l.startTick !== r.startTick ? l.startTick - r.startTick : l.actionId.localeCompare(r.actionId),
  );

  let queue: PlayerActionReceipt[] = [...(state.playerActionReceipts ?? [])];
  const newEvents: TickEvent[] = [];
  const markedIds = new Set<string>();

  for (const action of sorted) {
    markedIds.add(action.actionId);
    const template = getUnifiedTemplateById(action.templateId);
    const band = outcomeBandForAction(action);

    if (!template) {
      emitReceiptTrace({
        tick: state.tick,
        category: 'player_receipt',
        event: 'fallback_receipt',
        actionId: action.actionId,
        templateId: action.templateId,
        presentation: 'toast',
        band,
        changeCount: 0,
        summary: `player_receipt: no template for ${action.actionId} (${action.templateId}) — skipped`,
      });
      continue;
    }

    const summary = action.aftermathSummary;
    const changes = summary?.changes ?? action.aftermathChanges ?? [];
    const reactions = summary?.reactions;
    const reactionCount = reactions?.length ?? 0;
    const isFallback = !summary;

    const targetNode =
      action.targetId && action.targetId !== action.actorId
        ? state.graph.getNode(action.targetId)
        : undefined;
    const targetName =
      action.targetId === action.actorId
        ? 'yourself'
        : targetNode?.name ?? action.targetId;

    const rawOverview = summary?.overview ?? `Your ${template.name} ${outcomeBandWord(band)}.`;
    // THR-1050 — the overview and every reaction label/intent share one context,
    // gathered at most once per receipt and only when some field actually carries a
    // placeholder (preserving the original overview-only fast path). Reactions used
    // to ship raw, putting `{cast:*}` on screen in DivineReceiptModal (Law 14).
    const anyPlaceholder =
      needsEnrichment(rawOverview) ||
      (reactions?.some((r) => needsEnrichment(r.label) || needsEnrichment(r.intent)) ?? false);
    const proseCtx = anyPlaceholder
      ? receiptNarrativeContext(state, action, template.supportBundle)
      : undefined;
    const overview = enrichReceiptText(rawOverview, proseCtx);
    const enrichedReactions = proseCtx
      ? reactions?.map((r) => ({
          ...r,
          label: enrichReceiptText(r.label, proseCtx),
          intent: r.intent != null ? enrichReceiptText(r.intent, proseCtx) : r.intent,
        }))
      : reactions;

    const rarityTier = action.effectiveRarityTier ?? template.rarityTier;
    const presentation = decidePresentation(template.steps?.length ?? 1, rarityTier, changes, reactionCount);

    const receipt: PlayerActionReceipt = {
      id: `receipt_${action.actionId}`,
      actionId: action.actionId,
      templateId: action.templateId,
      templateName: template.name,
      targetId: action.targetId,
      targetName,
      sphere: template.sphereAffinity,
      essencePaid: action.essencePaid ?? 0,
      startTick: action.startTick,
      resolvedTick: action.completedAtTick ?? state.tick,
      outcome: action.outcome ?? 'success',
      outcomeBand: band,
      overview,
      changes,
      reactions: reactionCount > 0 ? enrichedReactions : undefined,
      presentation,
      acknowledged: false,
    };

    queue.push(receipt);
    if (queue.length > RECEIPT_QUEUE_MAX) {
      queue = queue.slice(queue.length - RECEIPT_QUEUE_MAX);
      emitReceiptTrace({
        tick: state.tick,
        category: 'player_receipt',
        event: 'queue_capped',
        actionId: action.actionId,
        templateId: action.templateId,
        presentation,
        band,
        changeCount: changes.length,
        summary: `player_receipt: queue capped at ${RECEIPT_QUEUE_MAX}, dropped oldest`,
      });
    }

    const significance =
      presentation === 'modal' ? RECEIPT_EVENT_SIGNIFICANCE_MODAL : RECEIPT_EVENT_SIGNIFICANCE_TOAST;
    const event: TickEvent = {
      // id === receipt.id so the notification router can derive the receipt navigation
      // target directly from event.id (one toast event per action → unique).
      id: receipt.id,
      tick: state.tick,
      type: 'player_action_receipt',
      message: `Your ${template.name} ${outcomeBandWord(band)}.`,
      significance,
      sphere: template.sphereAffinity,
      band,
      actorId: action.actorId,
      // Toast tier surfaces as a completion toast; modal tier has no toast (the modal is
      // the surface) but still lands in the chronicle via its significance.
      ...(presentation === 'toast' ? { notification: { channel: 'toast' as const } } : {}),
    };
    newEvents.push(event);

    emitReceiptTrace({
      tick: state.tick,
      category: 'player_receipt',
      event: isFallback ? 'fallback_receipt' : 'enqueued',
      actionId: action.actionId,
      templateId: action.templateId,
      presentation,
      band,
      changeCount: changes.length,
      summary: `player_receipt: ${isFallback ? 'fallback ' : ''}${presentation} receipt for ${template.name} (${band})`,
    });
  }

  const nextActions = state.unifiedActions.map((a) =>
    markedIds.has(a.actionId) ? { ...a, playerReceiptEmitted: true } : a,
  );

  return {
    unifiedActions: nextActions,
    playerActionReceipts: queue,
    tickEvents: newEvents.length > 0 ? [...state.tickEvents, ...newEvents] : state.tickEvents,
  };
}

export const playerReceiptsPhase: EnginePhase = {
  id: 'player_receipts',
  slot: 'post-resolution',
  label: 'Divine Receipts',
  run: (state, ctx) => processPlayerReceipts(state, ctx),
};
