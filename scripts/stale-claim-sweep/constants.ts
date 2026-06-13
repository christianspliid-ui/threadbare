/**
 * Named constants for the stale-claim sweep (THR-250).
 * Change a number here — don't touch the algorithm in index.ts.
 */

/** Hours before an In Dev issue earns a warning comment. */
export const STALE_THRESHOLD_HOURS = 48;

/** Hours between warning and auto-release. */
export const GRACE_PERIOD_HOURS = 24;

/** Cron expression — twice daily. */
export const SWEEP_CRON = "0 */12 * * *";

/** Label name that opts an issue out of the sweep. Applied manually by humans. */
export const PARKED_LABEL_NAME = "Parked";

/** Color for the Parked label if auto-created. */
export const PARKED_LABEL_COLOR = "#95A2B3";

/** Hard cap on issues inspected per run to avoid runaway Linear API usage. */
export const MAX_ISSUES_PER_RUN = 50;

/** Scope sweep to Threadbare team only. */
export const LINEAR_TEAM_KEY = "THR";

/** Milliseconds per hour. */
export const HOUR_MS = 60 * 60 * 1000;

/** Default path for the cross-run tracked-list artifact. Override via env. */
export const DEFAULT_TRACKED_LIST_PATH = "stale-claim-tracked.json";

/**
 * Warning comment posted when a stale claim is first detected.
 * @param lastActivity ISO string of the issue's last updatedAt.
 * @param releaseAt   ISO string of when auto-release will fire if no activity.
 */
export function buildWarningComment(lastActivity: string, releaseAt: string): string {
  return `## ⚠️ Stale claim detected

This issue has been **In Dev** with no recorded activity since **${lastActivity}**.

If this is intentional (blocked on external, awaiting review, etc.) apply the \`Parked\` label to opt out of the auto-release sweep.

Otherwise, if this session is dead: **no action needed** — the issue will be automatically returned to **Ready for Dev** by **${releaseAt}** so another executor can pick it up.

_Posted by the stale-claim-sweep GitHub Action (THR-250). To suppress: add the \`Parked\` label._`;
}
