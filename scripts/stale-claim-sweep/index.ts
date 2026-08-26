#!/usr/bin/env node

/**
 * Stale-claim sweep — releases dead In Dev claims after a warning + grace period.
 *
 * Run via: node --experimental-strip-types scripts/stale-claim-sweep/index.ts
 *
 * Algorithm (three passes per run):
 * 1. Detection: find In Dev issues stale for > STALE_THRESHOLD_HOURS, post warning.
 * 2. Grace check: for tracked issues past GRACE_PERIOD_HOURS, re-query Linear;
 *    release if no activity arrived; drop if activity found or state changed.
 * 3. Queue-assignee repair (THR-845): null the assignee on any Ready for Dev
 *    issue carrying one. No warning, no grace — an assignee on the queue is not
 *    a claim (claims are In Dev), it is an invisibility bug, because pull-work
 *    selects candidates with `assignee:null`.
 *
 * Persistence: tracked-list JSON file, cached between GitHub Action runs via
 * actions/cache@v4 (same pattern as drift-scan-baseline.json).
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// Explicit `.ts` extensions are mandatory: this script runs under Node's ESM
// resolver via `--experimental-strip-types`, which does not do extension
// resolution. An extensionless specifier throws ERR_MODULE_NOT_FOUND at import
// time — it cost this workflow 88 consecutive red runs (THR-804).
import { linearGql, LINEAR_API_KEY, LINEAR_TEAM_ID } from "../drift-scan/linear.ts";

import {
  STALE_THRESHOLD_HOURS,
  GRACE_PERIOD_HOURS,
  HOUR_MS,
  PARKED_LABEL_NAME,
  PARKED_LABEL_COLOR,
  MAX_ISSUES_PER_RUN,
  LINEAR_TEAM_KEY,
  DEFAULT_TRACKED_LIST_PATH,
  QUEUE_STATE_NAME,
  MAX_QUEUE_ASSIGNEE_REPAIRS_PER_RUN,
  ACTIVITY_COMMENT_PAGE_SIZE,
  ACTIVITY_HISTORY_PAGE_SIZE,
  buildWarningComment,
} from "./constants.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The GraphQL transport, injectable so the release path can be exercised by a
 * test (THR-1283).
 *
 * `LINEAR_API_KEY` is an Actions secret with no local equivalent, so before this
 * the only way to run the release path was to let a scheduled run do it against
 * the live board — which is precisely how the park destruction went four rounds
 * before anyone could falsify a guard against it.
 */
export type GqlFn = <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;

type TrackedEntry = {
  issueId: string;
  identifier: string;
  firstSeenAt: number; // unix ms — when warning was first posted
};

type SweepTrace =
  | { kind: "scan-start"; dryRun: boolean; now: string }
  | { kind: "candidate-found"; issueId: string; identifier: string; updatedAt: string; ageHours: number }
  | { kind: "warning-posted"; issueId: string; identifier: string; firstSeenAt: string }
  // `phase` disambiguates the two places the Parked label is now honoured
  // (THR-1283). Before, only the detection pass checked it, so a `skip-parked`
  // line could only ever mean "never warned" — and the release path, which is
  // the one that destroys parks, emitted nothing at all.
  | { kind: "skip-parked"; issueId: string; identifier: string; phase: "detect" | "release" }
  // No assignee means no claim, and this sweep releases *claims* (THR-1283).
  | { kind: "skip-no-claim"; issueId: string; identifier: string }
  | { kind: "skip-already-tracked"; issueId: string; identifier: string }
  | { kind: "grace-not-reached"; issueId: string; identifier: string; ageHours: number }
  | { kind: "grace-dropped"; issueId: string; identifier: string; reason: "activity" | "state-change" | "manual-release" }
  | { kind: "released"; issueId: string; identifier: string; previousAssignee: string | null }
  | { kind: "dry-run-would"; action: "comment" | "release" | "clear-queue-assignee"; issueId: string; identifier: string }
  | { kind: "queue-assignee-found"; issueId: string; identifier: string; assignee: string | null }
  | { kind: "queue-assignee-cleared"; issueId: string; identifier: string; previousAssignee: string | null }
  | { kind: "queue-assignee-clean"; state: string }
  | { kind: "scan-end"; warnedCount: number; releasedCount: number; trackedSurvivors: number; queueAssigneesCleared: number }
  | { kind: "error"; message: string };

function trace(t: SweepTrace): void {
  console.log(JSON.stringify(t));
}

// ---------------------------------------------------------------------------
// Linear API helpers
// ---------------------------------------------------------------------------

type IssueStub = {
  id: string;
  identifier: string;
  updatedAt: string;
  assignee: { id: string; displayName: string } | null;
  labels: { nodes: Array<{ name: string }> };
};

async function listStaleInDevIssues(gql: GqlFn, staleBefore: string): Promise<IssueStub[]> {
  const data = await gql<{
    issues: { nodes: IssueStub[] };
  }>(
    `query($teamKey: String!, $before: DateTimeOrDuration!, $first: Int!) {
      issues(
        first: $first,
        filter: {
          state: { name: { eq: "In Dev" } },
          team: { key: { eq: $teamKey } },
          updatedAt: { lt: $before }
        }
      ) {
        nodes {
          id
          identifier
          updatedAt
          assignee { id displayName }
          labels { nodes { name } }
        }
      }
    }`,
    { teamKey: LINEAR_TEAM_KEY, before: staleBefore, first: MAX_ISSUES_PER_RUN },
  );

  return data.issues.nodes;
}

/**
 * Every `Ready for Dev` issue carrying a non-null assignee (THR-845).
 *
 * This is the membership predicate the ticket states, expressed as a filter
 * rather than a snapshot count — the writer re-accumulates these one per hour,
 * so a count would rot before the next run reads it.
 */
async function listAssignedQueueIssues(gql: GqlFn): Promise<IssueStub[]> {
  const data = await gql<{
    issues: { nodes: IssueStub[] };
  }>(
    `query($teamKey: String!, $state: String!, $first: Int!) {
      issues(
        first: $first,
        filter: {
          state: { name: { eq: $state } },
          team: { key: { eq: $teamKey } },
          assignee: { null: false }
        }
      ) {
        nodes {
          id
          identifier
          updatedAt
          assignee { id displayName }
          labels { nodes { name } }
        }
      }
    }`,
    { teamKey: LINEAR_TEAM_KEY, state: QUEUE_STATE_NAME, first: MAX_QUEUE_ASSIGNEE_REPAIRS_PER_RUN },
  );

  return data.issues.nodes;
}

export type IssueDetail = {
  id: string;
  identifier: string;
  state: { name: string };
  assignee: { id: string; displayName: string } | null;
  labels: { nodes: Array<{ name: string }> };
  comments: { nodes: Array<{ createdAt: string }> };
  history: { nodes: Array<{ createdAt: string; toState: { name: string } | null }> };
};

/**
 * Re-read a tracked issue at grace expiry.
 *
 * **`first:`, not `last:` — this is load-bearing and it has already been wrong
 * once (THR-1283).** Linear orders these connections **descending by createdAt
 * (newest first)**, so Relay's `last: N` returns the N *oldest* nodes, not the
 * newest. The original query said `comments(last: 10)`, which on any issue
 * carrying more than ten comments returned a window that could not contain
 * recent activity by construction — the activity check was reading the wrong
 * end of the list and could only ever return false.
 *
 * Measured on THR-1130, released 2026-08-22T12:51:57Z despite `daily-backlog-
 * grooming` having commented and applied `Parked` at 07:14:14Z that morning:
 * the issue held 12 comments at that moment, the grooming comment was the
 * newest, and `last: 10` dropped exactly the two newest. Signal (a) therefore
 * saw nothing newer than the sweep's own warning and the release fired.
 *
 * `labels` is selected here for the release-path park guard below — the
 * detection pass had it and the release path did not, which is defect 1.
 */
async function getIssueDetail(gql: GqlFn, issueId: string): Promise<IssueDetail | null> {
  const data = await gql<{ issue: IssueDetail | null }>(
    `query($id: String!, $commentPage: Int!, $historyPage: Int!) {
      issue(id: $id) {
        id
        identifier
        state { name }
        assignee { id displayName }
        labels { nodes { name } }
        comments(first: $commentPage, orderBy: createdAt) {
          nodes { createdAt }
        }
        history(first: $historyPage) {
          nodes { createdAt toState { name } }
        }
      }
    }`,
    {
      id: issueId,
      commentPage: ACTIVITY_COMMENT_PAGE_SIZE,
      historyPage: ACTIVITY_HISTORY_PAGE_SIZE,
    },
  );

  return data.issue;
}

async function resolveReadyForDevStateId(gql: GqlFn): Promise<string> {
  const data = await gql<{
    team: { states: { nodes: Array<{ id: string; name: string }> } } | null;
  }>(
    `query($teamId: String!) {
      team(id: $teamId) {
        states { nodes { id name } }
      }
    }`,
    { teamId: LINEAR_TEAM_ID },
  );

  const state = data.team?.states.nodes.find((s) => s.name === "Ready for Dev");
  if (!state) throw new Error('No "Ready for Dev" state found in Threadbare team');
  return state.id;
}

async function ensureParkedLabelId(gql: GqlFn): Promise<string> {
  const existing = await gql<{
    issueLabels: { nodes: Array<{ id: string; name: string }> };
  }>(
    `query($name: String!) {
      issueLabels(filter: { name: { eq: $name } }) {
        nodes { id name }
      }
    }`,
    { name: PARKED_LABEL_NAME },
  );

  const found = existing.issueLabels.nodes[0];
  if (found) return found.id;

  const created = await gql<{
    issueLabelCreate: { issueLabel: { id: string } | null };
  }>(
    `mutation($teamId: String!, $name: String!, $color: String!, $description: String!) {
      issueLabelCreate(input: { teamId: $teamId, name: $name, color: $color, description: $description }) {
        issueLabel { id }
      }
    }`,
    {
      teamId: LINEAR_TEAM_ID,
      name: PARKED_LABEL_NAME,
      color: PARKED_LABEL_COLOR,
      description: "Intentional WIP parking — exempt from stale-claim sweep",
    },
  );

  const id = created.issueLabelCreate.issueLabel?.id;
  if (!id) throw new Error("Unable to create Parked label");
  return id;
}

async function postWarningComment(gql: GqlFn, issueId: string, lastActivity: string, releaseAt: string): Promise<void> {
  await gql(
    `mutation($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
      }
    }`,
    { issueId, body: buildWarningComment(lastActivity, releaseAt) },
  );
}

async function releaseClaim(gql: GqlFn, issueId: string, readyForDevStateId: string): Promise<void> {
  await gql(
    `mutation($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId, assigneeId: null }) {
        success
      }
    }`,
    { id: issueId, stateId: readyForDevStateId },
  );
}

/**
 * Clear the assignee on a queue issue, leaving its state untouched (THR-845).
 *
 * Deliberately a *separate* update mutation rather than something folded into a
 * create: passing `assigneeId: null` inline to `issueCreate` does not stick —
 * Linear defaults the field to the API actor and the create response simply
 * omits the key, which reads as "null" and is not. Only a follow-up
 * `issueUpdate` actually clears it.
 */
async function clearQueueAssignee(gql: GqlFn, issueId: string): Promise<void> {
  await gql(
    `mutation($id: String!) {
      issueUpdate(id: $id, input: { assigneeId: null }) {
        success
      }
    }`,
    { id: issueId },
  );
}

// ---------------------------------------------------------------------------
// Activity check
// ---------------------------------------------------------------------------

function hasActivitySince(issue: IssueDetail, firstSeenAtMs: number): boolean {
  const since = new Date(firstSeenAtMs).toISOString();

  // Signal (a): comment created after firstSeenAt (excludes the warning comment itself)
  // We check strictly greater than to avoid the warning comment triggering a false drop.
  // Adding a 1-minute buffer to account for the warning comment's createdAt timestamp.
  const sinceWithBuffer = new Date(firstSeenAtMs + 60_000).toISOString();
  const hasNewComment = issue.comments.nodes.some((c) => c.createdAt > sinceWithBuffer);
  if (hasNewComment) return true;

  // Signal (b): state transition in history after firstSeenAt
  const hasStateChange = issue.history.nodes.some(
    (h) => h.toState !== null && h.createdAt > since,
  );
  if (hasStateChange) return true;

  // Signal (c): commit reference (attachments) — skipped for v1 per plan doc grey zone.
  // The Linear `attachments` connection GraphQL surface for PR auto-links is fiddlier
  // to query reliably; comment + state-change covers the common case.

  return false;
}

// ---------------------------------------------------------------------------
// Artifact persistence
// ---------------------------------------------------------------------------

function readTrackedList(filePath: string): TrackedEntry[] {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as TrackedEntry[];
  } catch {
    // Missing or corrupted artifact — start fresh (fail-soft: first run or cache expiry).
    return [];
  }
}

function writeTrackedList(filePath: string, entries: TrackedEntry[]): void {
  const dir = path.dirname(path.resolve(filePath));
  if (dir !== ".") fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), "utf8");
}

// ---------------------------------------------------------------------------
// Main sweep
// ---------------------------------------------------------------------------

export type SweepOptions = {
  dryRun: boolean;
  trackedListPath: string;
  /** Injected transport for tests; production passes nothing and gets `linearGql`. */
  gql?: GqlFn;
  /** Injected clock for tests, unix ms. Production passes nothing and gets `Date.now()`. */
  nowMs?: number;
};

export async function sweep(opts: SweepOptions): Promise<void> {
  const gql: GqlFn = opts.gql ?? linearGql;
  const now = opts.nowMs ?? Date.now();
  const nowIso = new Date(now).toISOString();
  trace({ kind: "scan-start", dryRun: opts.dryRun, now: nowIso });

  // Only the real transport needs the secret. An injected transport is its own
  // credential, and aborting the process on a missing key would make the release
  // path untestable — the state this defect lived in for four rounds.
  if (!opts.gql && !LINEAR_API_KEY) {
    trace({ kind: "error", message: "LINEAR_API_KEY secret is missing — aborting" });
    process.exit(1);
  }

  const trackedList = readTrackedList(opts.trackedListPath);

  // Eagerly resolve the Parked label and Ready for Dev state ID so failures
  // surface at the top of the run, not mid-loop.
  await ensureParkedLabelId(gql);
  const readyForDevStateId = await resolveReadyForDevStateId(gql);

  // ---- Detection pass ----
  const staleBefore = new Date(now - STALE_THRESHOLD_HOURS * HOUR_MS).toISOString();
  const staleIssues = await listStaleInDevIssues(gql, staleBefore);

  let warnedCount = 0;
  for (const issue of staleIssues) {
    const ageHours = (now - new Date(issue.updatedAt).getTime()) / HOUR_MS;

    trace({ kind: "candidate-found", issueId: issue.id, identifier: issue.identifier, updatedAt: issue.updatedAt, ageHours: Math.round(ageHours) });

    if (issue.labels.nodes.some((l) => l.name === PARKED_LABEL_NAME)) {
      trace({ kind: "skip-parked", issueId: issue.id, identifier: issue.identifier, phase: "detect" });
      continue;
    }

    if (trackedList.find((t) => t.issueId === issue.id)) {
      trace({ kind: "skip-already-tracked", issueId: issue.id, identifier: issue.identifier });
      continue;
    }

    const releaseAt = new Date(now + GRACE_PERIOD_HOURS * HOUR_MS).toISOString();
    if (opts.dryRun) {
      trace({ kind: "dry-run-would", action: "comment", issueId: issue.id, identifier: issue.identifier });
    } else {
      await postWarningComment(gql, issue.id, issue.updatedAt, releaseAt);
      trace({ kind: "warning-posted", issueId: issue.id, identifier: issue.identifier, firstSeenAt: nowIso });
    }

    trackedList.push({ issueId: issue.id, identifier: issue.identifier, firstSeenAt: now });
    warnedCount++;
  }

  // ---- Grace check pass ----
  const survivors: TrackedEntry[] = [];
  let releasedCount = 0;

  for (const entry of trackedList) {
    const ageMs = now - entry.firstSeenAt;

    if (ageMs < GRACE_PERIOD_HOURS * HOUR_MS) {
      trace({ kind: "grace-not-reached", issueId: entry.issueId, identifier: entry.identifier, ageHours: Math.round(ageMs / HOUR_MS) });
      survivors.push(entry);
      continue;
    }

    const fresh = await getIssueDetail(gql, entry.issueId);
    if (!fresh) {
      // Issue deleted or moved — drop from tracking silently.
      continue;
    }

    if (fresh.state.name !== "In Dev") {
      trace({ kind: "grace-dropped", issueId: entry.issueId, identifier: entry.identifier, reason: "manual-release" });
      continue;
    }

    // ---- Park guards (THR-1283) ----
    //
    // Both of these were absent, and their absence is what let the sweep destroy
    // four parks in four days. The detection pass honoured `Parked`; the release
    // path — the pass that actually writes — did not re-read it, so applying the
    // label *in response to the sweep's own warning*, exactly as that warning
    // instructs, did not save the issue.
    //
    // Ordered Parked-first deliberately: a park satisfies both guards, and
    // `skip-parked` is the more specific diagnosis of the two.
    if (fresh.labels.nodes.some((l) => l.name === PARKED_LABEL_NAME)) {
      trace({ kind: "skip-parked", issueId: entry.issueId, identifier: entry.identifier, phase: "release" });
      continue;
    }

    // A null assignee means there is no claim to release, and a claim is the only
    // thing this sweep exists to release. The old code had this fact in hand at
    // the moment it acted — it wrote it into the trace as `previousAssignee: null`
    // — and did not use it. An unassigned `In Dev` issue is a deliberate park by
    // construction, and it is the sweep's prime target precisely because a park
    // never moves and so never looks like activity.
    if (fresh.assignee === null) {
      trace({ kind: "skip-no-claim", issueId: entry.issueId, identifier: entry.identifier });
      continue;
    }

    if (hasActivitySince(fresh, entry.firstSeenAt)) {
      trace({ kind: "grace-dropped", issueId: entry.issueId, identifier: entry.identifier, reason: "activity" });
      continue;
    }

    // No activity in grace window — release the claim.
    const previousAssignee = fresh.assignee?.displayName ?? null;
    if (opts.dryRun) {
      trace({ kind: "dry-run-would", action: "release", issueId: entry.issueId, identifier: entry.identifier });
    } else {
      await releaseClaim(gql, entry.issueId, readyForDevStateId);
      trace({ kind: "released", issueId: entry.issueId, identifier: entry.identifier, previousAssignee });
      releasedCount++;
    }
    // Either way, drop from tracking (released or dry-run).
  }

  // Persist before the repair pass below, not after: the tracked list is the only
  // cross-run state the first two passes produce, and losing it would re-warn every
  // issue next run. The repair pass must not be able to cost us that.
  writeTrackedList(opts.trackedListPath, survivors);

  // ---- Queue-assignee repair pass (THR-845) ----
  //
  // No warning and no grace period, unlike the two passes above. Those release a
  // *claim*, which is someone's in-flight work and deserves notice. This clears a
  // field that carries no meaning in this state and actively hides the issue from
  // the executor — repairing it immediately costs nothing and restores nothing but
  // visibility. Runs last so a release from the grace pass (which already nulls the
  // assignee on its way to Ready for Dev) is never double-handled.
  //
  // Wrapped: this pass is strictly additive to a job whose existing passes are the
  // load-bearing ones. Its filter (`assignee: { null: false }`) could not be
  // exercised against the live API before merge — LINEAR_API_KEY is an Actions
  // secret with no local equivalent — so a schema mismatch would surface here first.
  // Failing soft turns that into one logged line instead of a red run that also
  // takes the stale-claim release with it (NFP #4).
  let queueAssigneesCleared = 0;
  try {
    const assignedQueueIssues = await listAssignedQueueIssues(gql);

    if (assignedQueueIssues.length === 0) {
      trace({ kind: "queue-assignee-clean", state: QUEUE_STATE_NAME });
    }

    for (const issue of assignedQueueIssues) {
      const previousAssignee = issue.assignee?.displayName ?? null;
      trace({ kind: "queue-assignee-found", issueId: issue.id, identifier: issue.identifier, assignee: previousAssignee });

      if (opts.dryRun) {
        trace({ kind: "dry-run-would", action: "clear-queue-assignee", issueId: issue.id, identifier: issue.identifier });
        continue;
      }

      await clearQueueAssignee(gql, issue.id);
      trace({ kind: "queue-assignee-cleared", issueId: issue.id, identifier: issue.identifier, previousAssignee });
      queueAssigneesCleared++;
    }
  } catch (err: unknown) {
    trace({
      kind: "error",
      message: `queue-assignee pass failed (non-fatal, THR-845): ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  trace({ kind: "scan-end", warnedCount, releasedCount, trackedSurvivors: survivors.length, queueAssigneesCleared });
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

const dryRunEnv = process.env.DRY_RUN?.toLowerCase();
// Default to true on ambiguity — refuse to write on missing/garbled flag.
const dryRun = dryRunEnv === "false" ? false : true;
const trackedListPath = process.env.STALE_CLAIM_TRACKED_LIST_PATH ?? DEFAULT_TRACKED_LIST_PATH;

// Entry guard so the module can be imported by a test without running a sweep
// (THR-1283). Matches the house pattern in scripts/check-armed-prs.ts.
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  sweep({ dryRun, trackedListPath }).catch((err: unknown) => {
    trace({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });
}
