/**
 * Release-path tests for the stale-claim sweep (THR-1283).
 *
 * These drive the real `sweep()` through a stubbed GraphQL transport with a
 * seeded tracked-list, so the **release path itself** runs — the pass that
 * writes to Linear, and the pass that destroyed four parks in four days
 * (impediments #703, #706, #752, #755).
 *
 * The guards are falsified in both directions on purpose. A test that only
 * asserts "Parked issue is skipped" is a vacuous guard: it passes just as well
 * when the release path is unreachable for some unrelated reason. So every
 * skip arm is paired with an arm that removes exactly one fixture field and
 * asserts the release *does* fire. If the release arms ever stop firing, the
 * skip arms stop meaning anything and these tests say so.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sweep, type GqlFn, type IssueDetail } from "../stale-claim-sweep/index.ts";
import { GRACE_PERIOD_HOURS, HOUR_MS, PARKED_LABEL_NAME } from "../stale-claim-sweep/constants.ts";

const NOW_MS = new Date("2026-08-22T12:51:18.000Z").getTime();

/** Warned 25h ago — one hour past the 24h grace window, so the release path runs. */
const FIRST_SEEN_MS = NOW_MS - (GRACE_PERIOD_HOURS + 1) * HOUR_MS;

const ISSUE_ID = "92c0e3da-958d-4fbb-8a6b-5faab1fc0432";
const IDENTIFIER = "THR-1130";

type Mutation = { kind: "issueUpdate" | "commentCreate"; variables: Record<string, unknown> };

type Harness = {
  gql: GqlFn;
  mutations: Mutation[];
  detailQueries: string[];
};

function detail(overrides: Partial<IssueDetail> = {}): IssueDetail {
  return {
    id: ISSUE_ID,
    identifier: IDENTIFIER,
    state: { name: "In Dev" },
    assignee: { id: "user-1", displayName: "Christian Spliid" },
    labels: { nodes: [{ name: "Content" }] },
    comments: { nodes: [] },
    history: { nodes: [] },
    ...overrides,
  };
}

function parked(base: IssueDetail = detail()): IssueDetail {
  return { ...base, labels: { nodes: [...base.labels.nodes, { name: PARKED_LABEL_NAME }] } };
}

function makeHarness(fresh: IssueDetail | null): Harness {
  const mutations: Mutation[] = [];
  const detailQueries: string[] = [];

  const gql = (async (query: string, variables: Record<string, unknown> = {}) => {
    if (query.includes("issueUpdate")) {
      mutations.push({ kind: "issueUpdate", variables });
      return { issueUpdate: { success: true } };
    }
    if (query.includes("commentCreate")) {
      mutations.push({ kind: "commentCreate", variables });
      return { commentCreate: { success: true } };
    }
    if (query.includes("issueLabels(filter:")) {
      return { issueLabels: { nodes: [{ id: "label-parked", name: PARKED_LABEL_NAME }] } };
    }
    if (query.includes("team(id: $teamId)")) {
      return { team: { states: { nodes: [{ id: "state-rfd", name: "Ready for Dev" }] } } };
    }
    // Both list queries select `issues(` — the filter clause disambiguates them.
    if (query.includes('state: { name: { eq: "In Dev" } }')) {
      return { issues: { nodes: [] } };
    }
    if (query.includes("assignee: { null: false }")) {
      return { issues: { nodes: [] } };
    }
    if (query.includes("issue(id: $id)")) {
      detailQueries.push(query);
      return { issue: fresh };
    }
    throw new Error(`unstubbed query: ${query.slice(0, 120)}`);
  }) as GqlFn;

  return { gql, mutations, detailQueries };
}

let tmpDir: string;
let trackedListPath: string;
let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stale-claim-sweep-"));
  trackedListPath = path.join(tmpDir, "tracked.json");
  fs.writeFileSync(
    trackedListPath,
    JSON.stringify([{ issueId: ISSUE_ID, identifier: IDENTIFIER, firstSeenAt: FIRST_SEEN_MS }]),
    "utf8",
  );
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function tracesFrom(spy: ReturnType<typeof vi.spyOn>): Array<Record<string, unknown>> {
  return spy.mock.calls
    .map((call) => String(call[0]))
    .filter((line) => line.startsWith("{"))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

async function run(fresh: IssueDetail | null, dryRun = false): Promise<Harness & { traces: Array<Record<string, unknown>> }> {
  const harness = makeHarness(fresh);
  await sweep({ dryRun, trackedListPath, gql: harness.gql, nowMs: NOW_MS });
  return { ...harness, traces: tracesFrom(logSpy) };
}

function kinds(traces: Array<Record<string, unknown>>): string[] {
  return traces.map((t) => String(t.kind));
}

describe("stale-claim sweep — release-path park guards (THR-1283)", () => {
  it("skips a Parked issue instead of releasing it", async () => {
    const { traces, mutations } = await run(parked());

    expect(kinds(traces)).toContain("skip-parked");
    expect(traces.find((t) => t.kind === "skip-parked")).toMatchObject({
      identifier: IDENTIFIER,
      phase: "release",
    });
    expect(kinds(traces)).not.toContain("released");
    expect(mutations.filter((m) => m.kind === "issueUpdate")).toHaveLength(0);
  });

  it("FALSIFICATION: the same fixture without the Parked label IS released", async () => {
    // Removing exactly one field — the label — must flip the outcome. Without
    // this arm the test above would pass even if the release path never ran.
    const { traces, mutations } = await run(detail());

    expect(kinds(traces)).toContain("released");
    expect(traces.find((t) => t.kind === "released")).toMatchObject({
      identifier: IDENTIFIER,
      previousAssignee: "Christian Spliid",
    });
    expect(mutations.filter((m) => m.kind === "issueUpdate")).toHaveLength(1);
  });

  it("skips an issue whose assignee is already null — there is no claim to release", async () => {
    const { traces, mutations } = await run(detail({ assignee: null }));

    expect(kinds(traces)).toContain("skip-no-claim");
    expect(kinds(traces)).not.toContain("released");
    expect(mutations.filter((m) => m.kind === "issueUpdate")).toHaveLength(0);
  });

  it("FALSIFICATION: the same fixture with an assignee IS released", async () => {
    const { traces, mutations } = await run(detail());

    expect(kinds(traces)).toContain("released");
    expect(mutations.filter((m) => m.kind === "issueUpdate")).toHaveLength(1);
  });

  it("reports a park as skip-parked, not skip-no-claim — the more specific diagnosis wins", async () => {
    // The real park shape satisfies both guards at once. Which trace it emits
    // decides what a human reading the run log concludes, so it is pinned.
    const { traces } = await run(parked(detail({ assignee: null })));

    expect(kinds(traces)).toContain("skip-parked");
    expect(kinds(traces)).not.toContain("skip-no-claim");
    expect(kinds(traces)).not.toContain("released");
  });

  // One sweep per test: `sweep()` persists its survivor list back over the
  // seeded fixture, so a second run in the same test finds nothing tracked and
  // trivially "passes" whatever it is asked. (It cost this file one red run.)
  it("still drops on real activity rather than releasing", async () => {
    const activeAt = new Date(FIRST_SEEN_MS + 2 * HOUR_MS).toISOString();
    const { traces, mutations } = await run(detail({ comments: { nodes: [{ createdAt: activeAt }] } }));

    expect(traces.find((t) => t.kind === "grace-dropped")).toMatchObject({ reason: "activity" });
    expect(mutations.filter((m) => m.kind === "issueUpdate")).toHaveLength(0);
  });

  it("writes nothing in a dry run", async () => {
    const { traces, mutations } = await run(detail(), true);

    expect(traces.find((t) => t.kind === "dry-run-would")).toMatchObject({ action: "release" });
    expect(mutations).toHaveLength(0);
  });
});

describe("stale-claim sweep — activity window reads the newest comments (THR-1283)", () => {
  it("requests the FIRST page of comments and history, never the LAST", async () => {
    // The THR-1130 mis-release traced to `comments(last: 10)`. Linear orders
    // these connections newest-first, so `last: N` returns the N *oldest* nodes
    // — on a 12-comment issue the activity check could not see the grooming
    // comment posted five hours earlier, and reported "no activity" correctly
    // for the window it was given and wrongly for the question being asked.
    //
    // The wrong end of a connection is invisible in behaviour when the stub
    // supplies the nodes, so this pins the query shape, which is where the
    // defect lived.
    const { detailQueries } = await run(detail());

    expect(detailQueries).toHaveLength(1);
    const query = detailQueries[0]!;
    expect(query).toMatch(/comments\(first: \$commentPage/);
    expect(query).toMatch(/history\(first: \$historyPage/);
    expect(query).not.toMatch(/\blast:\s*\d/);
    expect(query).not.toMatch(/comments\(last:/);
  });

  it("selects labels on the detail query — the release-path guard cannot read what is not fetched", async () => {
    const { detailQueries } = await run(detail());

    expect(detailQueries[0]!).toMatch(/labels \{ nodes \{ name \} \}/);
  });
});
