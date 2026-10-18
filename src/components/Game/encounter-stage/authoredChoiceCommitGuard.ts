/**
 * THR-1976 — an authored-choice step is committed once.
 *
 * The veil's Play button used to call the bare commit handler, which charged
 * the choice and recorded it but left the veil on the same step with the same
 * live button. Every further press charged again, and `upsertChoiceHistory` is
 * last-write-wins, so a later press of another option replaced the recorded
 * choice. The veil now commits through the handler that closes it (or turns it
 * into the answering card), and this guard refuses a second commit on a step
 * that is already decided.
 *
 * The committed set is a ref written synchronously by the commit, so it also
 * catches a double-click that lands in the same render frame, before the veil
 * has moved on. It deliberately does not read `notification.resolved`: the
 * watched tier's boost resolves the notification without deciding a choice.
 */
export function isAuthoredChoiceStepCommitted(
  notificationId: string,
  committedIds: ReadonlySet<string>,
): boolean {
  return committedIds.has(notificationId);
}

/**
 * Claim the step for one commit. Returns `false` (and changes nothing) when it
 * was already committed; otherwise records it and returns `true`. `release`
 * undoes a claim whose commit was then rejected (the pool could not pay), so
 * the player can pick a cheaper option.
 */
export function claimAuthoredChoiceCommit(
  notificationId: string,
  committedIds: Set<string>,
): { claimed: boolean; release: () => void } {
  if (isAuthoredChoiceStepCommitted(notificationId, committedIds)) {
    return { claimed: false, release: () => {} };
  }
  committedIds.add(notificationId);
  return { claimed: true, release: () => { committedIds.delete(notificationId); } };
}
