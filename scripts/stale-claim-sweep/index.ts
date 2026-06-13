#!/usr/bin/env node

/**
 * Stale-claim sweep — releases dead In Dev claims after a warning + grace period.
 *
 * Run via: node --experimental-strip-types scripts/stale-claim-sweep/index.ts
 *
 * Algorithm (two passes per run):
 * 1. Detection: find In Dev issues stale for > STALE_THRESHOLD_HOURS, post warning.
 * 2. Grace check: for tracked issues past GRACE_PERIOD_HOURS, re-query Linear;
 *    release if no activity arrived; drop if activity found or state changed.
 *
 * Persistence: tracked-list JSON file, cached between GitHub Action runs via
 * actions/cache@v4 (same pattern as drift-scan-baseline.json).
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { linearGql, LINEAR_API_KEY, LINEAR_TEAM_ID } from "../drift-scan/linear";

import {
  STALE_THRESHOLD_HOURS,
  GRACE_PERIOD_HOURS,
  HOUR_MS,
  PARKED_LABEL_NAME,
  PARKED_LABEL_COLOR,
  MAX_ISSUES_PER_RUN,
  LINEAR_TEAM_KEY,
  DEFAULT_TRACKED_LIST_PATH,
  buildWarningComment,
} from "./constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TrackedEntry = {
  issueId: string;
  identifier: string;
  firstSeenAt: number; // unix ms — when warning was first posted
};

type SweepTrace =
  | { kind: "scan-start"; dryRun: boolean; now: string }
  | { kind: "candidate-found"; issueId: string; identifier: string; updatedAt: string; ageHours: number }
  | { kind: "warning-posted"; issueId: string; identifier: string; firstSeenAt: string }
  | { kind: "skip-parked"; issueId: string; identifier: string }
  | { kind: "skip-already-tracked"; issueId: string; identifier: string }
  | { kind: "grace-not-reached"; issueId: string; identifier: string; ageHours: number }
  | { kind: "grace-dropped"; issueId: string; identifier: string; reason: "activity" | "state-change" | "manual-release" }
  | { kind: "released"; issueId: string; identifier: string; previousAssignee: string | null }
  | { kind: "dry-run-would"; action: "comment" | "release"; issueId: string; identifier: string }
  | { kind: "scan-end"; warnedCount: number; releasedCount: number; trackedSurvivors: number }
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

async function listStaleInDevIssues(staleBefore: string): Promise<IssueStub[]> {
  const data = await linearGql<{
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

type IssueDetail = {
  id: string;
  identifier: string;
  state: { name: string };
  assignee: { id: string; displayName: string } | null;
  comments: { nodes: Array<{ createdAt: string }> };
  history: { nodes: Array<{ createdAt: string; toState: { name: string } | null }> };
};

async function getIssueDetail(issueId: string): Promise<IssueDetail | null> {
  const data = await linearGql<{ issue: IssueDetail | null }>(
    `query($id: String!) {
      issue(id: $id) {
        id
        identifier
        state { name }
        assignee { id displayName }
        comments(last: 10, orderBy: createdAt) {
          nodes { createdAt }
        }
        history(last: 20) {
          nodes { createdAt toState { name } }
        }
      }
    }`,
    { id: issueId },
  );

  return data.issue;
}

async function resolveReadyForDevStateId(): Promise<string> {
  const data = await linearGql<{
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

async function ensureParkedLabelId(): Promise<string> {
  const existing = await linearGql<{
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

  const created = await linearGql<{
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

async function postWarningComment(issueId: string, lastActivity: string, releaseAt: string): Promise<void> {
  await linearGql(
    `mutation($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
      }
    }`,
    { issueId, body: buildWarningComment(lastActivity, releaseAt) },
  );
}

async function releaseClaim(issueId: string, readyForDevStateId: string): Promise<void> {
  await linearGql(
    `mutation($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId, assigneeId: null }) {
        success
      }
    }`,
    { id: issueId, stateId: readyForDevStateId },
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

async function sweep(opts: { dryRun: boolean; trackedListPath: string }): Promise<void> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  trace({ kind: "scan-start", dryRun: opts.dryRun, now: nowIso });

  if (!LINEAR_API_KEY) {
    trace({ kind: "error", message: "LINEAR_API_KEY secret is missing — aborting" });
    process.exit(1);
  }

  const trackedList = readTrackedList(opts.trackedListPath);

  // Eagerly resolve the Parked label and Ready for Dev state ID so failures
  // surface at the top of the run, not mid-loop.
  await ensureParkedLabelId();
  const readyForDevStateId = await resolveReadyForDevStateId();

  // ---- Detection pass ----
  const staleBefore = new Date(now - STALE_THRESHOLD_HOURS * HOUR_MS).toISOString();
  const staleIssues = await listStaleInDevIssues(staleBefore);

  let warnedCount = 0;
  for (const issue of staleIssues) {
    const ageHours = (now - new Date(issue.updatedAt).getTime()) / HOUR_MS;

    trace({ kind: "candidate-found", issueId: issue.id, identifier: issue.identifier, updatedAt: issue.updatedAt, ageHours: Math.round(ageHours) });

    if (issue.labels.nodes.some((l) => l.name === PARKED_LABEL_NAME)) {
      trace({ kind: "skip-parked", issueId: issue.id, identifier: issue.identifier });
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
      await postWarningComment(issue.id, issue.updatedAt, releaseAt);
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

    const fresh = await getIssueDetail(entry.issueId);
    if (!fresh) {
      // Issue deleted or moved — drop from tracking silently.
      continue;
    }

    if (fresh.state.name !== "In Dev") {
      trace({ kind: "grace-dropped", issueId: entry.issueId, identifier: entry.identifier, reason: "manual-release" });
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
      await releaseClaim(entry.issueId, readyForDevStateId);
      trace({ kind: "released", issueId: entry.issueId, identifier: entry.identifier, previousAssignee });
      releasedCount++;
    }
    // Either way, drop from tracking (released or dry-run).
  }

  writeTrackedList(opts.trackedListPath, survivors);
  trace({ kind: "scan-end", warnedCount, releasedCount, trackedSurvivors: survivors.length });
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

const dryRunEnv = process.env.DRY_RUN?.toLowerCase();
// Default to true on ambiguity — refuse to write on missing/garbled flag.
const dryRun = dryRunEnv === "false" ? false : true;
const trackedListPath = process.env.STALE_CLAIM_TRACKED_LIST_PATH ?? DEFAULT_TRACKED_LIST_PATH;

sweep({ dryRun, trackedListPath }).catch((err: unknown) => {
  trace({ kind: "error", message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
