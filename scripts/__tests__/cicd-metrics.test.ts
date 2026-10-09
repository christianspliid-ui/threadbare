/**
 * Weekly CI/CD flow metrics (2026-10-09). The aggregation is pure; these fixtures pin the
 * definitions the weekly lane compares week over week, so a refactor can't quietly
 * change what "slow" or "catch-up" means.
 */
import { describe, expect, it } from "vitest";
import {
  TSV_COLUMNS,
  computeMetrics,
  isMainCatchup,
  isTicketPr,
  peakConcurrent,
  quantile,
  toTsvRow,
  type PrRecord,
} from "../cicd-metrics";

const start = new Date("2026-10-03T00:00:00Z");
const end = new Date("2026-10-10T00:00:00Z");

function pr(n: number, created: string, merged: string | null, body = `x\nFixes THR-${n}\n`): PrRecord {
  return { number: n, createdAt: created, mergedAt: merged, closedAt: merged, state: merged ? "MERGED" : "OPEN", body };
}

describe("definitions", () => {
  it("a ticket PR carries a line-anchored close line; a plan PR does not", () => {
    expect(isTicketPr({ body: "Summary\n\nFixes THR-1\n" })).toBe(true);
    expect(isTicketPr({ body: "docs(plan): mentions Fixes THR-1 in prose" })).toBe(false);
  });
  it("a main catch-up is a merge of main into the branch", () => {
    expect(isMainCatchup("Merge remote-tracking branch 'origin/main' into claude/x")).toBe(true);
    expect(isMainCatchup("Merge branch 'main' into x")).toBe(true);
    expect(isMainCatchup("Merge pull request #1 from x")).toBe(false);
  });
  it("quantile is nearest-rank on the sorted values", () => {
    expect(quantile([30, 10, 20], 0.5)).toBe(20);
    expect(quantile([], 0.5)).toBeNull();
  });
  it("peakConcurrent counts overlapping open intervals; open PRs run to the window end", () => {
    const prs = [
      pr(1, "2026-10-04T00:00:00Z", "2026-10-04T02:00:00Z"),
      pr(2, "2026-10-04T01:00:00Z", "2026-10-04T03:00:00Z"),
      pr(3, "2026-10-05T00:00:00Z", null),
    ];
    expect(peakConcurrent(prs, end)).toBe(2);
  });
});

describe("computeMetrics", () => {
  const prs = [
    pr(1, "2026-10-04T00:00:00Z", "2026-10-04T00:10:00Z"),
    pr(2, "2026-10-04T00:05:00Z", "2026-10-04T03:05:00Z"),
    pr(3, "2026-10-05T00:00:00Z", null),
    pr(4, "2026-10-05T00:00:00Z", "2026-10-05T00:04:00Z", "docs(plan): a plan"),
  ];
  const m = computeMetrics({
    start, end, prs,
    catchupByPr: new Map([[1, false], [2, true], [3, false]]),
    openNow: [{ ...pr(3, "2026-10-05T00:00:00Z", null), mergeStateStatus: "DIRTY" }],
    ciPrRuns: [
      { createdAt: "2026-10-04T00:00:00Z", updatedAt: "2026-10-04T00:12:00Z", conclusion: "success", event: "pull_request", headBranch: "a" },
      { createdAt: "2026-10-04T01:00:00Z", updatedAt: "2026-10-04T01:14:00Z", conclusion: "failure", event: "pull_request", headBranch: "b" },
      { createdAt: "2026-10-04T02:00:00Z", updatedAt: "2026-10-04T02:01:00Z", conclusion: "cancelled", event: "pull_request", headBranch: "c" },
    ],
    heavyMainRuns: [
      { createdAt: "2026-10-04T00:00:00Z", updatedAt: "2026-10-04T00:14:00Z", conclusion: "failure", event: "push", headBranch: "main" },
      { createdAt: "2026-10-05T00:00:00Z", updatedAt: "2026-10-05T00:14:00Z", conclusion: "success", event: "push", headBranch: "main" },
    ],
    gateLog: [{ at: "2026-10-09T05:00:00Z", verdict: "deny" }, { at: "2026-09-01T00:00:00Z", verdict: "deny" }],
    lane: { runs: 100, idle: 40 },
    errors: [],
  });

  it("counts ticket PRs apart from docs PRs", () => {
    expect(m.ticket_prs_opened).toBe(3);
    expect(m.ticket_prs_merged).toBe(2);
    expect(m.docs_prs_merged).toBe(1);
  });
  it("measures flow time, the slow share and the catch-up share", () => {
    expect(m.open_to_merge_median_min).toBe(180);
    expect(m.pct_slow_gt60m).toBe(50);
    expect(m.pct_main_catchup).toBe(33.3);
    expect(m.peak_concurrent_ticket_prs).toBe(2);
    expect(m.dirty_prs_now).toBe(1);
  });
  it("measures CI without cancelled runs and counts red heavy runs on main", () => {
    expect(m.ci_pr_runs).toBe(2);
    expect(m.ci_pr_fail_pct).toBe(50);
    expect(m.heavy_main_fail_pct).toBe(50);
  });
  it("counts only in-window gate denials and passes lane numbers through", () => {
    expect(m.wip_gate_denials).toBe(1);
    expect(m.lane_runs).toBe(100);
    expect(m.lane_failed_runs).toBeNull();
  });
  it("renders one TSV cell per column, empty for unknown", () => {
    const cells = toTsvRow(m).split("\t");
    expect(cells).toHaveLength(TSV_COLUMNS.length);
    expect(cells[TSV_COLUMNS.indexOf("lane_failed_runs")]).toBe("");
  });
  it("leaves a failed source's columns empty and keeps the rest", () => {
    const partial = computeMetrics({ start, end, prs: null, catchupByPr: null, openNow: null, ciPrRuns: null, heavyMainRuns: null, gateLog: [], lane: {}, errors: ["prs: boom"] });
    expect(partial.ticket_prs_opened).toBeNull();
    expect(partial.errors).toBe("prs: boom");
  });
});
