/**
 * Linear API helpers shared between scripts/drift-scan/index.ts and
 * scripts/lint-worktree-orphan.ts.  Extracted so both callers use the same
 * GraphQL transport without duplicating the wire code.
 */

import process from "node:process";

export const LINEAR_API_URL = "https://api.linear.app/graphql";
export const LINEAR_PROJECT_ID = "42ac1815-135e-4efb-95d8-631a17dbc9df"; // Continuous Improvement
export const LINEAR_TEAM_ID = "290e931e-eb67-4565-9834-fd79c9466928"; // Threadbare
export const DRIFT_SCAN_LABEL_NAME = "drift-scan";

export const LINEAR_API_KEY = process.env.LINEAR_API_KEY?.trim() ?? "";

export async function linearGql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      Authorization: LINEAR_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Linear API HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { data?: T; errors?: Array<{ message?: string }> };
  if (payload.errors && payload.errors.length > 0) {
    const message = payload.errors.map((entry) => entry.message ?? "unknown error").join("; ");
    throw new Error(`Linear GraphQL error: ${message}`);
  }
  if (!payload.data) {
    throw new Error("Linear GraphQL returned no data payload");
  }
  return payload.data;
}

export async function ensureDriftScanLabelId(): Promise<string> {
  const existing = await linearGql<{
    issueLabels: { nodes: Array<{ id: string; name: string }> };
  }>(
    `query($name: String!) {
      issueLabels(filter: { name: { eq: $name } }) {
        nodes { id name }
      }
    }`,
    { name: DRIFT_SCAN_LABEL_NAME },
  );

  const existingLabel = existing.issueLabels.nodes[0];
  if (existingLabel) return existingLabel.id;

  const created = await linearGql<{
    issueLabelCreate: { issueLabel: { id: string } | null };
  }>(
    `mutation($teamId: String!, $name: String!, $color: String!) {
      issueLabelCreate(input: { teamId: $teamId, name: $name, color: $color }) {
        issueLabel { id }
      }
    }`,
    { teamId: LINEAR_TEAM_ID, name: DRIFT_SCAN_LABEL_NAME, color: "#F59E0B" },
  );

  const id = created.issueLabelCreate.issueLabel?.id;
  if (!id) throw new Error("unable to create drift-scan label");
  return id;
}

export async function resolveBacklogStateId(): Promise<string | null> {
  const data = await linearGql<{
    team: { states: { nodes: Array<{ id: string; name: string; type: string }> } } | null;
  }>(
    `query($teamId: String!) {
      team(id: $teamId) {
        states { nodes { id name type } }
      }
    }`,
    { teamId: LINEAR_TEAM_ID },
  );

  const states = data.team?.states.nodes ?? [];
  const preferred = states.find((state) => state.type === "backlog");
  if (preferred) return preferred.id;
  const triageLike = states.find((state) => state.name.toLowerCase().includes("triage"));
  return triageLike?.id ?? null;
}

/**
 * Upper bound on the open `drift-scan` issues fetched for signal-scoped dedup.
 * The scan emits at most one issue per signal (11 signals as of THR-756), so a
 * page this size covers the live set many times over; a larger backlog means
 * triage has stalled, which is a separate problem from duplicate filing.
 */
export const OPEN_DRIFT_ISSUE_LOOKUP_LIMIT = 100;

export interface OpenDriftIssue {
  id: string;
  identifier: string;
  title: string;
}

/**
 * Every open (neither completed nor canceled) issue carrying the `drift-scan`
 * label on the Threadbare team.
 *
 * Fetched once per run rather than once per signal: the scan needs to ask
 * "is there already an open issue for this signal?" up to 11 times, and the
 * answer comes from the same small set every time.
 */
export async function listOpenDriftIssues(): Promise<OpenDriftIssue[]> {
  const data = await linearGql<{
    issues: { nodes: Array<{ id: string; identifier: string; title: string }> };
  }>(
    // "Open" is asserted three ways on purpose. The state-type test is the
    // direct one, but Linear's *Duplicate* state — where the five THR-756
    // duplicates were parked — reports a `duplicate` status through some
    // surfaces while setting `canceledAt`. Testing the timestamps as well makes
    // exclusion independent of how any terminal state happens to be typed: an
    // issue that was closed in any manner is never a refresh target.
    `query($label: String!, $teamId: ID!, $limit: Int!) {
      issues(
        first: $limit
        filter: {
          labels: { name: { eq: $label } }
          team: { id: { eq: $teamId } }
          state: { type: { nin: ["completed", "canceled"] } }
          completedAt: { null: true }
          canceledAt: { null: true }
        }
      ) {
        nodes { id identifier title }
      }
    }`,
    { label: DRIFT_SCAN_LABEL_NAME, teamId: LINEAR_TEAM_ID, limit: OPEN_DRIFT_ISSUE_LOOKUP_LIMIT },
  );

  return data.issues.nodes;
}

/** Refresh an existing drift issue in place with the current run's title and body. */
export async function updateDriftIssue(params: {
  id: string;
  title: string;
  body: string;
}): Promise<void> {
  await linearGql<{ issueUpdate: { success: boolean } }>(
    `mutation($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
      }
    }`,
    { id: params.id, input: { title: params.title, description: params.body } },
  );
}

/**
 * Record one refresh on an existing drift issue.
 *
 * The description is overwritten by `updateDriftIssue`, so without this the
 * week-over-week movement in a signal's counts would be unrecoverable — the
 * issue would only ever show its latest state (NFP #2, inspectability).
 */
export async function commentOnDriftIssue(params: { id: string; body: string }): Promise<void> {
  await linearGql<{ commentCreate: { success: boolean } }>(
    `mutation($input: CommentCreateInput!) {
      commentCreate(input: $input) {
        success
      }
    }`,
    { input: { issueId: params.id, body: params.body } },
  );
}

export async function findIssueByExactTitle(title: string): Promise<string | null> {
  const data = await linearGql<{
    issues: { nodes: Array<{ id: string; identifier: string; title: string }> };
  }>(
    `query($title: String!) {
      issues(first: 5, filter: { title: { eq: $title } }) {
        nodes { id identifier title }
      }
    }`,
    { title },
  );

  const exact = data.issues.nodes.find((issue) => issue.title === title);
  return exact?.identifier ?? null;
}

export async function createDriftIssue(params: {
  title: string;
  body: string;
  labelId: string;
  stateId: string | null;
}): Promise<string> {
  const data = await linearGql<{
    issueCreate: { issue: { identifier: string } | null };
  }>(
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        issue { identifier }
      }
    }`,
    {
      input: {
        title: params.title,
        description: params.body,
        teamId: LINEAR_TEAM_ID,
        projectId: LINEAR_PROJECT_ID,
        labelIds: [params.labelId],
        stateId: params.stateId,
      },
    },
  );

  const identifier = data.issueCreate.issue?.identifier;
  if (!identifier) throw new Error("Linear issueCreate returned no identifier");
  return identifier;
}
