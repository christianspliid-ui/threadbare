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

import {
  sweep,
  classifyInDesignItem,
  lastInDesignActivityMs,
  type GqlFn,
  type IssueDetail,
  type InDesignIssue,
} from "../stale-claim-sweep/index.ts";
import {
  GRACE_PERIOD_HOURS,
  HOUR_MS,
  DAY_MS,
  PARKED_LABEL_NAME,
  QUEUE_STATE_NAME,
  DESIGN_STATE_NAME,
  ORCH_IN_DESIGN_STALE_DAYS,
} from "../stale-claim-sweep/constants.ts";

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

function makeHarness(fresh: IssueDetail | null, inDesign: InDesignIssue[] = []): Harness {
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
    // Three list queries now select `issues(`. The queue and In Design queries
    // are textually near-identical — both filter `state: { name: { eq: $state } }`
    // — so they are disambiguated on the bound VARIABLE, not on query text.
    // Matching them by substring is how a stub silently answers the wrong
    // question: the In Design pass is fail-soft, so an unstubbed throw there
    // would be swallowed and its assertions would go vacuous.
    if (query.includes('state: { name: { eq: "In Dev" } }')) {
      return { issues: { nodes: [] } };
    }
    if (variables.state === QUEUE_STATE_NAME) {
      return { issues: { nodes: [] } };
    }
    if (variables.state === DESIGN_STATE_NAME) {
      return { issues: { nodes: inDesign } };
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

async function run(
  fresh: IssueDetail | null,
  dryRun = false,
  inDesign: InDesignIssue[] = [],
): Promise<Harness & { traces: Array<Record<string, unknown>> }> {
  const harness = makeHarness(fresh, inDesign);
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

// ---------------------------------------------------------------------------
// In Design liveness (THR-1382)
// ---------------------------------------------------------------------------

/**
 * `In Design` occupant, aged in whole days back from the harness clock.
 *
 * **`updatedAt` is deliberately set to `NOW` — not to the age.** That is the
 * real board's shape, not a convenience: Linear bumps `updatedAt` when another
 * issue merely links to this one, and filing THR-1382 bumped both real
 * occupants to the filing timestamp while they sat 14 and 18 days untouched. A
 * fixture that let `updatedAt` agree with the true age would verify a fiction
 * and pass whichever signal the predicate read. Here the two disagree
 * maximally, so only the correct signal produces the expected verdict.
 *
 * The age is carried by the state transition into the column, which is what
 * `lastInDesignActivityMs` actually reads.
 */
function inDesignStub(overrides: Partial<InDesignIssue> & { ageDays: number }): InDesignIssue {
  const { ageDays, ...rest } = overrides;
  const enteredAt = new Date(NOW_MS - ageDays * DAY_MS).toISOString();
  return {
    id: `in-design-${ageDays}`,
    identifier: `THR-${900 + ageDays}`,
    updatedAt: new Date(NOW_MS).toISOString(),
    assignee: null,
    labels: { nodes: [] },
    comments: { nodes: [] },
    history: { nodes: [{ createdAt: enteredAt, toState: { name: DESIGN_STATE_NAME } }] },
    ...rest,
  };
}

/**
 * The two occupants that actually jammed the column, at their measured ages.
 * Named after the real issues so a future reader can check the verdict against
 * the board rather than against the fixture.
 */
const THR_1002_UNASSIGNED_14D = inDesignStub({
  ageDays: 14,
  id: "0120265a-f645-4b91-9234-251bbf4db1af",
  identifier: "THR-1002",
  assignee: null,
});

const THR_790_ASSIGNED_18D = inDesignStub({
  ageDays: 18,
  id: "e62f1eeb-9e2b-4cdb-8f49-e45e028f6c47",
  identifier: "THR-790",
  assignee: { id: "user-1", displayName: "Christian Spliid" },
});

describe("In Design liveness predicate (THR-1382)", () => {
  it("REGRESSION: a fresh updatedAt does not make a 14-day-dead item look live", () => {
    // The trap this ticket nearly shipped. THR-1382 proposed `updatedAt` as the
    // activity signal; both real occupants came back carrying the ticket's own
    // filing timestamp, because Linear bumps updatedAt when another issue links
    // to it. Reading updatedAt would classify both as `live` on day one and the
    // whole feature would be a no-op — while passing any fixture whose
    // updatedAt was set to agree with its age.
    expect(THR_1002_UNASSIGNED_14D.updatedAt).toBe(new Date(NOW_MS).toISOString());

    const v = classifyInDesignItem(THR_1002_UNASSIGNED_14D, NOW_MS);
    expect(v.ageDays).toBe(14);
    expect(v.countsAgainstBound).toBe(false);
  });

  it("counts a real comment as activity, so a worked item stays live", () => {
    // The other half: the signal must not be "entered the column" alone, or an
    // item under active discussion would be excluded for not having moved.
    const discussedYesterday = inDesignStub({
      ageDays: 30,
      comments: { nodes: [{ createdAt: new Date(NOW_MS - 1 * DAY_MS).toISOString() }] },
    });

    expect(classifyInDesignItem(discussedYesterday, NOW_MS)).toMatchObject({
      reason: "live",
      countsAgainstBound: true,
    });
  });

  it("falls back to updatedAt when no activity signal exists at all", () => {
    const noSignals: InDesignIssue = {
      ...inDesignStub({ ageDays: 20 }),
      comments: { nodes: [] },
      history: { nodes: [] },
      updatedAt: new Date(NOW_MS - 20 * DAY_MS).toISOString(),
    };

    expect(lastInDesignActivityMs(noSignals)).toBeNull();
    expect(classifyInDesignItem(noSignals, NOW_MS).ageDays).toBe(20);
  });

  it("excludes an unassigned item that has gone stale — the arm that unjams T2", () => {
    const v = classifyInDesignItem(THR_1002_UNASSIGNED_14D, NOW_MS);

    expect(v).toMatchObject({ reason: "stale-unassigned", countsAgainstBound: false, warn: true });
    expect(v.ageDays).toBe(14);
  });

  it("FALSIFICATION: the same unassigned item one day INSIDE the threshold still counts", () => {
    // Sweeps the measured boundary rather than the type range: at exactly the
    // threshold the item is still live, and only strictly past it is excluded.
    // Without this arm the predicate could return `false` unconditionally and
    // the test above would not notice.
    const atThreshold = inDesignStub({ ageDays: ORCH_IN_DESIGN_STALE_DAYS, assignee: null });
    const v = classifyInDesignItem(atThreshold, NOW_MS);

    expect(v).toMatchObject({ reason: "live", countsAgainstBound: true, warn: false });
  });

  it("warns an ASSIGNED stale item but keeps counting it — someone is waiting on it", () => {
    const v = classifyInDesignItem(THR_790_ASSIGNED_18D, NOW_MS);

    expect(v).toMatchObject({ reason: "stale-assigned", countsAgainstBound: true, warn: true });
    expect(v.ageDays).toBe(18);
  });

  it("FALSIFICATION: the identical item with the assignee removed IS excluded", () => {
    // Exactly one field differs from the arm above. If assignment stopped
    // mattering, these two would agree and both would still pass their own
    // `countsAgainstBound` assertion in isolation — so they are asserted as a pair.
    const unassigned = { ...THR_790_ASSIGNED_18D, assignee: null };

    expect(classifyInDesignItem(unassigned, NOW_MS).countsAgainstBound).toBe(false);
    expect(classifyInDesignItem(THR_790_ASSIGNED_18D, NOW_MS).countsAgainstBound).toBe(true);
  });

  it("excludes a Parked item without warning it, assigned or not", () => {
    const parkedAssigned: InDesignIssue = {
      ...THR_790_ASSIGNED_18D,
      labels: { nodes: [{ name: PARKED_LABEL_NAME }] },
    };

    expect(classifyInDesignItem(parkedAssigned, NOW_MS)).toMatchObject({
      reason: "parked",
      countsAgainstBound: false,
      warn: false,
    });
  });

  it("reports a stale park as parked, not stale-assigned — the more specific diagnosis wins", () => {
    const bothArms: InDesignIssue = {
      ...THR_790_ASSIGNED_18D,
      labels: { nodes: [{ name: PARKED_LABEL_NAME }] },
    };

    expect(classifyInDesignItem(bothArms, NOW_MS).reason).toBe("parked");
  });
});

describe("In Design sweep pass — warn-only (THR-1382)", () => {
  it("NEVER mutates an In Design issue, in the same run that DOES release an In Dev claim", async () => {
    // The load-bearing test of this ticket, written to dodge the vacuous-probe
    // trap. "No issueUpdate fired" passes trivially when the mutation path is
    // unreachable for any unrelated reason, so this run deliberately arms the
    // In Dev release path too: `detail()` is a live stale claim. The assertion
    // is therefore not "nothing was written" but "exactly one thing was
    // written, and it was the OTHER issue" — which can only hold if the
    // mutation machinery is live and the In Design pass declined to use it.
    const { traces, mutations } = await run(detail(), false, [
      THR_1002_UNASSIGNED_14D,
      THR_790_ASSIGNED_18D,
    ]);

    // Guard against an empty population silently passing everything below.
    const classified = traces.filter((t) => t.kind === "in-design-classified");
    expect(classified).toHaveLength(2);

    const updates = mutations.filter((m) => m.kind === "issueUpdate");
    expect(updates).toHaveLength(1);
    expect(updates[0]!.variables.id).toBe(ISSUE_ID);

    const touchedIds = updates.map((m) => m.variables.id);
    expect(touchedIds).not.toContain(THR_1002_UNASSIGNED_14D.id);
    expect(touchedIds).not.toContain(THR_790_ASSIGNED_18D.id);
  });

  it("classifies the two real board occupants exactly as the ticket's Done-when states", async () => {
    const { traces } = await run(null, false, [THR_1002_UNASSIGNED_14D, THR_790_ASSIGNED_18D]);

    expect(traces.find((t) => t.identifier === "THR-1002" && t.kind === "in-design-classified")).toMatchObject({
      classification: "stale-unassigned",
      countsAgainstBound: false,
      ageDays: 14,
    });
    expect(traces.find((t) => t.identifier === "THR-790" && t.kind === "in-design-classified")).toMatchObject({
      classification: "stale-assigned",
      countsAgainstBound: true,
      ageDays: 18,
      assignee: "Christian Spliid",
    });
    expect(traces.find((t) => t.kind === "scan-end")).toMatchObject({
      inDesignLive: 1,
      inDesignExcluded: 1,
    });
  });

  it("names Parked as the exit for an assigned item, and never implies demotion", async () => {
    const { mutations } = await run(null, false, [THR_790_ASSIGNED_18D]);

    const comments = mutations.filter((m) => m.kind === "commentCreate");
    expect(comments).toHaveLength(1);
    const body = String(comments[0]!.variables.body);

    expect(body).toContain("Christian Spliid");
    expect(body).toContain("`Parked`");
    expect(body).toContain("18 days");
    // The whole of item 3: an assigned item must not be told to go back to Todo.
    expect(body).toContain("not a candidate for demotion");
  });

  it("offers BOTH exits for an unassigned item — Parked or back to Todo", async () => {
    const { mutations } = await run(null, false, [THR_1002_UNASSIGNED_14D]);

    const body = String(mutations.find((m) => m.kind === "commentCreate")!.variables.body);
    expect(body).toContain("`Parked`");
    expect(body).toContain("`Todo`");
  });

  it("does not re-warn an item it already warned — the tracked list is the memory", async () => {
    // Seed the warn-memory as a previous run would have left it.
    fs.writeFileSync(
      trackedListPath,
      JSON.stringify([
        {
          issueId: THR_1002_UNASSIGNED_14D.id,
          identifier: "THR-1002",
          firstSeenAt: FIRST_SEEN_MS,
          phase: "in-design",
        },
      ]),
      "utf8",
    );

    const { traces, mutations } = await run(null, false, [THR_1002_UNASSIGNED_14D]);

    expect(kinds(traces)).toContain("in-design-already-warned");
    expect(mutations.filter((m) => m.kind === "commentCreate")).toHaveLength(0);
  });

  it("an in-design tracked entry survives the grace pass instead of being released or dropped", async () => {
    // Regression pin: the grace pass reads the same tracked list. Before the
    // phase guard, an In Design entry reaching it would be dropped as a
    // "manual-release" — erasing the warn-memory and re-posting the same
    // comment every 12 hours forever.
    fs.writeFileSync(
      trackedListPath,
      JSON.stringify([
        {
          issueId: THR_1002_UNASSIGNED_14D.id,
          identifier: "THR-1002",
          firstSeenAt: FIRST_SEEN_MS,
          phase: "in-design",
        },
      ]),
      "utf8",
    );

    const { traces, mutations } = await run(null, false, [THR_1002_UNASSIGNED_14D]);

    expect(kinds(traces)).not.toContain("grace-dropped");
    expect(kinds(traces)).not.toContain("released");
    expect(mutations.filter((m) => m.kind === "issueUpdate")).toHaveLength(0);

    const persisted = JSON.parse(fs.readFileSync(trackedListPath, "utf8")) as Array<Record<string, unknown>>;
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({ identifier: "THR-1002", phase: "in-design" });
  });

  it("prunes warn-memory for an item that has left the column", async () => {
    fs.writeFileSync(
      trackedListPath,
      JSON.stringify([
        { issueId: "gone-from-column", identifier: "THR-999", firstSeenAt: FIRST_SEEN_MS, phase: "in-design" },
      ]),
      "utf8",
    );

    await run(null, false, []);

    const persisted = JSON.parse(fs.readFileSync(trackedListPath, "utf8")) as unknown[];
    expect(persisted).toHaveLength(0);
  });

  it("writes nothing in a dry run", async () => {
    const { traces, mutations } = await run(null, true, [THR_1002_UNASSIGNED_14D]);

    expect(kinds(traces)).toContain("dry-run-would-warn-in-design");
    expect(mutations).toHaveLength(0);
  });

  it("reports an empty column rather than staying silent about it", async () => {
    const { traces } = await run(null, false, []);

    expect(traces.find((t) => t.kind === "in-design-clean")).toMatchObject({ state: DESIGN_STATE_NAME });
  });

  it("asks Linear for In Design WITHOUT an updatedAt filter — the bound must see live occupants too", async () => {
    // A liveness count that only queries stale items is an occupancy count
    // wearing a liveness label: it can never observe the occupants that
    // legitimately hold the slot, so `inDesignLive` would be 0 by construction.
    const seen: Array<{ query: string; variables: Record<string, unknown> }> = [];
    const base = makeHarness(null, [THR_1002_UNASSIGNED_14D]);
    const gql = (async (query: string, variables: Record<string, unknown> = {}) => {
      seen.push({ query, variables });
      return base.gql(query, variables);
    }) as GqlFn;

    await sweep({ dryRun: true, trackedListPath, gql, nowMs: NOW_MS });

    const designQuery = seen.find((s) => s.variables.state === DESIGN_STATE_NAME);
    expect(designQuery).toBeDefined();

    // `updatedAt` must appear in the SELECTION set — the classifier reads it —
    // and must NOT appear as a filter clause. Asserting on the bare word would
    // fail on the selection and prove nothing about the filter, so this pins the
    // filter-clause form specifically: `updatedAt: { lt: $before }`, which is
    // exactly what the In Dev detection query does and this one must not.
    expect(designQuery!.query).toMatch(/\n\s+updatedAt\n/);
    expect(designQuery!.query).not.toMatch(/updatedAt:\s*\{/);
    expect(designQuery!.variables.state).toBe(DESIGN_STATE_NAME);
    expect(designQuery!.variables.state).not.toBe(QUEUE_STATE_NAME);

    // And the In Dev query in the same run DOES filter that way — so the
    // assertion above is a real distinction, not a property every query has.
    const inDevQuery = seen.find((s) => s.query.includes('eq: "In Dev"'));
    expect(inDevQuery!.query).toMatch(/updatedAt:\s*\{/);
  });
});
