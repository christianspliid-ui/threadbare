import type { EncounterProgress, EncounterResolutionSnapshot } from '../../types/encounter';
import type { EncounterNotification } from '../../types/encounterVisibility';
import { isStepSuccess, type EncounterAftermathSummary, type UnifiedAction } from '../../types/unifiedAction';

export interface ActiveEncounterDisplay {
  encounterId: string;
  actorId: string;
  currentStepIndex: number;
  status: EncounterProgress['status'];
  history: EncounterProgress['history'];
  startedTick: number;
  occupiedUntilTick?: number;
  choiceHistory?: EncounterProgress['choiceHistory'];
  disregardRemaining?: boolean;
  resolutionHistory?: EncounterResolutionSnapshot[];
  sourceSystem: 'legacy_encounter' | 'unified_action';
  actionId?: string;
  aftermathSummary?: EncounterAftermathSummary;
}

export interface EncounterRuntimeSelection {
  encounter: ActiveEncounterDisplay | null;
  activeAction: UnifiedAction | undefined;
}

export function buildActiveEncounterDisplayFromLegacyProgress(
  progress: EncounterProgress,
): ActiveEncounterDisplay {
  return {
    encounterId: progress.encounterId,
    actorId: progress.actorId,
    currentStepIndex: progress.currentEncounterIndex,
    status: progress.status,
    history: progress.history,
    startedTick: progress.startedTick,
    occupiedUntilTick: progress.occupiedUntilTick,
    choiceHistory: progress.choiceHistory,
    disregardRemaining: progress.disregardRemaining,
    resolutionHistory: progress.resolutionHistory,
    sourceSystem: 'legacy_encounter',
  };
}

export function buildActiveEncounterDisplayFromUnifiedAction(
  action: UnifiedAction,
  currentTick: number,
): ActiveEncounterDisplay {
  const remainingDuration = Math.max(0, action.stepDuration - action.stepProgress);
  return {
    encounterId: action.templateId,
    actorId: action.actorId,
    currentStepIndex: action.currentStep,
    status: action.resolved ? 'completed' : 'active',
    history: action.stepOutcomes.map((outcome, index) => ({
      encounterId: `step-${index + 1}`,
      success: isStepSuccess(outcome),
      tick: action.completedAtTick ?? currentTick,
    })),
    startedTick: action.startTick,
    occupiedUntilTick: action.resolved ? undefined : currentTick + remainingDuration,
    choiceHistory: action.choiceHistory ? [...action.choiceHistory] : [],
    disregardRemaining: action.disregardRemaining,
    sourceSystem: 'unified_action',
    actionId: action.actionId,
    aftermathSummary: action.aftermathSummary,
  };
}

export function selectEncounterRuntimeForNotification(
  notif: EncounterNotification,
  legacyProgresses: EncounterProgress[],
  unifiedActions: UnifiedAction[],
  currentTick: number,
): EncounterRuntimeSelection {
  const legacyProgress = legacyProgresses.find(
    p => p.actorId === notif.agentId && p.encounterId === notif.encounterId && p.status === 'active',
  );
  const activeAction = (notif.actionId
    ? unifiedActions.find(action => action.actionId === notif.actionId)
    : undefined)
    ?? unifiedActions.find(action =>
      !action.resolved
      && action.actorId === notif.agentId
      && action.templateId === notif.encounterId,
    );
  const legacyEncounter = legacyProgress
    ? buildActiveEncounterDisplayFromLegacyProgress(legacyProgress)
    : null;
  const unifiedEncounter = activeAction
    ? buildActiveEncounterDisplayFromUnifiedAction(activeAction, currentTick)
    : null;
  const prefersUnified = notif.sourceSystem === 'unified_action' || Boolean(notif.actionId);
  const encounter = prefersUnified
    ? (unifiedEncounter ?? legacyEncounter ?? null)
    : (legacyEncounter ?? unifiedEncounter ?? null);
  return { encounter, activeAction };
}

export function shouldAutoOpenEncounterNotification(
  notif: Pick<EncounterNotification, 'resolved' | 'autoResolveTick'>,
): boolean {
  return !notif.resolved && notif.autoResolveTick === null;
}

/**
 * Has this step notification been superseded by its own encounter's aftermath?
 *
 * The blocker THR-1005 actually reports, and the one the auto-open scan alone
 * could not clear. `runEncounterAutoOpenScan` walks past a notification that
 * *declines*; a spent step notification only declines because THR-664 compares
 * `stepIndex` against the action's `currentStep`. That comparison catches every
 * walked-past step except the last one: when an action resolves, `currentStep`
 * **freezes at the final index** rather than advancing past it, so the final
 * step's notification still reports `stepIndex === currentStepIndex` and opens
 * happily — forever, since nothing marks a spent step notification `resolved`.
 *
 * The aftermath is appended last of all (`encounterVisibility.ts`), so it sits
 * directly behind that one perpetually openable record. The scan reaches the
 * final step, opens it, consumes the single auto-interrupt slot, and stops —
 * and the aftermath never interrupts on its own. Measured live at
 * `?spawn=tg.senior.jewel_heist`: queue `[step0, step1, step2, aftermath]`,
 * action resolved with `currentStep === 2`; steps 0 and 1 declined on the
 * stepIndex mismatch, step 2 did not, and the aftermath was never reached.
 *
 * Scoped deliberately to "an aftermath for *this action* is still pending"
 * rather than the broader "a resolved action cannot open any step". A resolved
 * action with no aftermath notification — a digest-tier record, or one whose
 * aftermath the player has already acknowledged — keeps today's behaviour, so
 * this can never strand a beat with nothing left to show.
 */
export function isStepNotificationSupersededByAftermath(
  notif: Pick<EncounterNotification, 'kind'>,
  activeAction: Pick<UnifiedAction, 'actionId' | 'resolved'> | undefined,
  notifications: readonly Pick<EncounterNotification, 'kind' | 'actionId' | 'resolved'>[],
): boolean {
  if (notif.kind === 'aftermath') return false;
  if (!activeAction?.resolved) return false;
  return notifications.some(
    candidate => candidate.kind === 'aftermath'
      && !candidate.resolved
      && candidate.actionId === activeAction.actionId,
  );
}

/**
 * Drive the one auto-interrupt slot down the notification queue until a surface
 * actually opens (investigated under THR-1005).
 *
 * `tryOpen` is `handleOpenEncounterFromNotification`, which *declines* — returns
 * false — for a stale notification: a missing template, no live runtime, or a
 * step the encounter has already moved past (THR-664). Only a return of `true`
 * consumes the slot. `handleOpenEncounterBadge` has always respected that return
 * value; this scan is what brings the auto-interrupt path in line with it.
 *
 * Why this is a scan and not "take the first eligible one": eligibility
 * (`shouldAutoOpenEncounterNotification`) is a property of the notification
 * record, while openability is a property of the *world* it points at, and the
 * two diverge. Nothing marks a spent step notification `resolved`, so a step an
 * encounter has walked past can leave an eligible-but-unopenable record in the
 * queue ahead of a beat that *can* open — and the aftermath notification is
 * appended last of all (`encounterVisibility.ts`), so it sits behind every one
 * of them. Breaking on the first *attempt* spent the slot on the stale record
 * and opened nothing, on that render and on every later one, because the stale
 * record never leaves the queue.
 *
 * Scope of what is proven, so nobody over-reads this (THR-1005): the starvation
 * above is demonstrated by unit test, and it is the only known way a pause-tier
 * aftermath that *has* a notification and *has* a working badge can fail to
 * interrupt. It is NOT confirmed to be the cause of the aftermath-does-not-pop
 * report that prompted the investigation — on the `?spawn=` review route the
 * aftermath auto-opens with or without this change (checked both arms, 1-step
 * and 3-step templates, veil open and veil closed). Treat this as hardening on
 * the suspected path, not as that ticket's fix.
 *
 * Returns the id of the notification that opened, or null when none could.
 */
export function runEncounterAutoOpenScan(
  notifications: readonly EncounterNotification[],
  suppressedNotificationId: string | null,
  tryOpen: (notif: EncounterNotification) => boolean,
): string | null {
  for (const notif of notifications) {
    if (!shouldAutoOpenEncounterNotification(notif)) continue;
    if (suppressedNotificationId === notif.id) continue;
    // Only one auto-interrupt at a time — but a decline opened nothing, so it
    // has not used the slot up.
    if (tryOpen(notif)) return notif.id;
  }
  return null;
}

export function selectEncounterRuntimeForDisplay(
  encounter: ActiveEncounterDisplay,
  legacyProgresses: EncounterProgress[],
  unifiedActions: UnifiedAction[],
  currentTick: number,
): EncounterRuntimeSelection {
  const legacyProgress = legacyProgresses.find(
    progress => progress.actorId === encounter.actorId
      && progress.encounterId === encounter.encounterId
      && progress.status === 'active',
  );
  const activeAction = (encounter.actionId
    ? unifiedActions.find(action => action.actionId === encounter.actionId)
    : undefined)
    ?? unifiedActions.find(action =>
      !action.resolved
      && action.actorId === encounter.actorId
      && action.templateId === encounter.encounterId,
    );
  const legacyEncounter = legacyProgress
    ? buildActiveEncounterDisplayFromLegacyProgress(legacyProgress)
    : null;
  const unifiedEncounter = activeAction
    ? buildActiveEncounterDisplayFromUnifiedAction(activeAction, currentTick)
    : null;
  const prefersUnified = encounter.sourceSystem === 'unified_action' || Boolean(encounter.actionId);
  const selectedEncounter = prefersUnified
    ? (unifiedEncounter ?? legacyEncounter ?? null)
    : (legacyEncounter ?? unifiedEncounter ?? null);
  return { encounter: selectedEncounter, activeAction };
}
