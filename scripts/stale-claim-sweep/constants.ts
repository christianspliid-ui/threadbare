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

/**
 * Comments fetched when checking a tracked issue for activity (THR-1283).
 *
 * Read with `first:`, never `last:` — see the load-bearing note at the
 * `getIssueDetail` query in index.ts. Raised from the original 10 because
 * THR-1130 carried 12 comments at the moment it was mis-released, and a page
 * that a busy ticket outgrows is a silent correctness cliff, not a cost saving.
 */
export const ACTIVITY_COMMENT_PAGE_SIZE = 50;

/** History entries fetched for the state-transition activity signal (THR-1283). */
export const ACTIVITY_HISTORY_PAGE_SIZE = 50;

/** Scope sweep to Threadbare team only. */
export const LINEAR_TEAM_KEY = "THR";

/** Milliseconds per hour. */
export const HOUR_MS = 60 * 60 * 1000;

/** Default path for the cross-run tracked-list artifact. Override via env. */
export const DEFAULT_TRACKED_LIST_PATH = "stale-claim-tracked.json";

/**
 * Queue state whose assignee field is meaningless and must stay null (THR-845).
 *
 * A claim is `In Dev` — that is the only state where an assignee carries meaning.
 * An assignee on `Ready for Dev` is pure noise, and worse than noise: `pull-work`
 * Step 1 selects candidates with `assignee:null`, so any assigned queue item is
 * silently absent from pickup. Not bounced, not logged — absent.
 */
export const QUEUE_STATE_NAME = "Ready for Dev";

/** Hard cap on queue-assignee repairs per run. Bounds API usage if something floods. */
export const MAX_QUEUE_ASSIGNEE_REPAIRS_PER_RUN = 50;

/**
 * The design-staging state (THR-1382).
 *
 * **Warn-only. This sweep never mutates an issue in this state** — not its
 * state, not its assignee, not its labels. `In Design` has no claim to release,
 * and an unassigned item here is a *stage*, not a park, so the `In Dev` release
 * semantics must not be copied across. Copying them is precisely the inversion
 * THR-1283 had to undo for `In Dev`.
 */
export const DESIGN_STATE_NAME = "In Design";

/**
 * Days an unassigned `In Design` issue may sit without activity before it stops
 * counting against the orchestrator's design-staging budget (THR-1382).
 *
 * **Deliberately shares its name with the orchestrator's own constant table**
 * (`.claude/skills/orchestrator/SKILL.md` § Constants, and its prompt mirror
 * `Docs/ops/scheduled-task-prompts/tb-orchestrator.md`) rather than following
 * this file's unprefixed house style. One bound is applied by two different
 * kinds of reader — an LLM lane counting occupants of the column, and this
 * script classifying them — and a single greppable token across all three
 * surfaces is worth more than local naming consistency. Change it in one place
 * and the grep finds the other two.
 *
 * Why a bound was needed at all: `ORCH_MAX_IN_DESIGN` counted *occupancy*, so
 * two items that had not moved in 14 and 18 days barred the orchestrator's T2
 * staging every run — "jammed for twenty-one runs straight" — and nothing in
 * the machine could clear it, because the stale-claim sweep was hard-scoped to
 * `In Dev`. The build shelf reached zero on 2026-08-30 as a direct result.
 */
export const ORCH_IN_DESIGN_STALE_DAYS = 7;

/** Milliseconds per day. */
export const DAY_MS = 24 * HOUR_MS;

/** Hard cap on In Design issues inspected per run. Bounds API usage. */
export const MAX_IN_DESIGN_ISSUES_PER_RUN = 50;

/**
 * Staleness warning for an `In Design` issue (THR-1382).
 *
 * Names the age and the two exits, and **names the right exit for an assigned
 * item**. An assigned item is genuinely awaiting a person, so `Parked` is its
 * correct shape — the warning must not imply demotion to `Todo`, which would
 * throw away a human's staged work. An unassigned item has nobody waiting on
 * it, so both exits are open.
 *
 * @param ageDays      Whole days since the issue's last recorded activity.
 * @param assigneeName Display name of the assignee, or null when unassigned.
 */
export function buildInDesignStalenessComment(ageDays: number, assigneeName: string | null): string {
  const exits = assigneeName
    ? `This issue is assigned to **${assigneeName}**, so it is presumed to be genuinely awaiting a person rather than abandoned. The right exit is the \`Parked\` label — that records the wait explicitly and stops it consuming the staging budget. **It is not a candidate for demotion to \`Todo\`** while it is assigned.`
    : `This issue has no assignee, so nothing is known to be waiting on it. Two exits:

- Apply the \`Parked\` label if it is deliberately awaiting a human.
- Move it back to \`Todo\` if the design intent has gone cold, so it can be re-scoped.`;

  return `## 🕗 Stale \`In Design\` item — ${ageDays} days without activity

This issue has been in **In Design** with no recorded activity for **${ageDays} days** (threshold: ${ORCH_IN_DESIGN_STALE_DAYS}).

${exits}

**Nothing has been changed on this issue.** This sweep is warn-only in \`In Design\`: it never edits state, assignee, or labels here. Past ${ORCH_IN_DESIGN_STALE_DAYS} days an *unassigned* item stops counting against \`ORCH_MAX_IN_DESIGN\`, so the orchestrator's design staging is no longer barred by it either way — but the item itself still needs one of the exits above to leave the column.

_Posted by the stale-claim-sweep GitHub Action (THR-1382). Warn-only — no writes._`;
}

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
