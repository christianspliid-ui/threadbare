/**
 * WIP-until-merged gate (2026-10-09). Two layers: the pure verdict, and the REAL hook
 * entry driven as the harness calls it (hook JSON on stdin, exit code as verdict), with
 * `WIP_GATE_PRS_JSON` standing in for `gh pr list`.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { SUBPROCESS_TEST_TIMEOUT_MS } from "../../src/testing/testTimeouts";
import {
  IN_DEV_STATE_ID,
  PIPELINE_MAX_WAITING_PRS,
  STALE_PR_IGNORE_HOURS,
  blockingPrs,
  closedIds,
  decideWipGate,
  isWaitingOnChecks,
  movesToInDev,
  type OpenPr,
} from "../wip-gate";

const NOW = new Date("2026-10-09T06:00:00Z");
const recent = "2026-10-09T05:30:00Z";

function pr(over: Partial<OpenPr> & { number: number }): OpenPr {
  return { title: `PR ${over.number}`, body: "", isDraft: false, updatedAt: recent, ...over };
}

describe("closedIds", () => {
  it("reads only line-anchored close lines, like linear-autoclose.yml", () => {
    expect(closedIds("Summary\n\nFixes THR-1771\n")).toEqual(["THR-1771"]);
    expect(closedIds("This Fixes THR-12 mid-sentence")).toEqual([]);
    expect(closedIds("Fixes THR-1\nCloses THR-2\nResolves THR-3")).toEqual(["THR-1", "THR-2", "THR-3"]);
  });
});

describe("movesToInDev", () => {
  it("matches the state by name or id, nothing else", () => {
    expect(movesToInDev({ state: "In Dev" })).toBe(true);
    expect(movesToInDev({ state: "in dev " })).toBe(true);
    expect(movesToInDev({ state: IN_DEV_STATE_ID })).toBe(true);
    expect(movesToInDev({ state: "Ready for Dev" })).toBe(false);
    expect(movesToInDev({ assignee: "me" })).toBe(false);
  });
});

describe("blockingPrs", () => {
  const armed = pr({ number: 10, body: "x\nFixes THR-100\n", autoMergeRequest: {} });
  it("an armed, unmerged ticket PR blocks a claim of a different ticket", () => {
    expect(blockingPrs([armed], "THR-200", NOW).map((p) => p.number)).toEqual([10]);
  });
  it("never blocks resuming the ticket the PR closes", () => {
    expect(blockingPrs([armed], "thr-100", NOW)).toEqual([]);
  });
  it("ignores drafts, held PRs, PRs without a close line, and stale PRs", () => {
    const stale = new Date(NOW.getTime() - (STALE_PR_IGNORE_HOURS + 1) * 3_600_000).toISOString();
    const prs = [
      pr({ number: 1, body: "Fixes THR-1", isDraft: true }),
      pr({ number: 2, body: "Hold: waiting on art\nFixes THR-2" }),
      pr({ number: 3, body: "docs(plan): no closer" }),
      pr({ number: 5, body: "**Hold:** waiting on art\nFixes THR-5" }),
      pr({ number: 4, body: "Fixes THR-4", updatedAt: stale }),
    ];
    expect(blockingPrs(prs, "THR-9", NOW)).toEqual([]);
  });
});

describe("decideWipGate", () => {
  const open = [pr({ number: 2275, body: "Fixes THR-1771", mergeStateStatus: "DIRTY", autoMergeRequest: {} })];
  it("denies a claim while a ticket PR is unmerged, naming the PR and the way out", () => {
    const d = decideWipGate({ id: "THR-1754", state: "In Dev", assignee: "me" }, open, NOW);
    expect(d.verdict).toBe("deny");
    expect(d.blocking).toEqual([2275]);
    expect(d.reason).toContain("PR #2275");
    expect(d.reason).toContain("Step 0.8");
  });
  it("allows every save_issue that is not a move to In Dev", () => {
    expect(decideWipGate({ id: "THR-1754", state: "Ready for Dev", assignee: null }, open, NOW).verdict).toBe("allow");
    expect(decideWipGate({ id: "THR-1754", description: "x" }, open, NOW).verdict).toBe("allow");
    expect(decideWipGate({ title: "new", team: "Threadbare", state: "In Dev" }, open, NOW).verdict).toBe("allow");
  });
  it("never gates the THR-1283 park-restore (In Dev with assignee null) or a stateless assign", () => {
    expect(decideWipGate({ id: "THR-1754", state: "In Dev", assignee: null, priority: 2 }, open, NOW).verdict).toBe("allow");
    expect(decideWipGate({ id: "THR-1754", state: "In Dev" }, open, NOW).verdict).toBe("allow");
    expect(decideWipGate({ id: "THR-1754", assignee: "me" }, open, NOW).verdict).toBe("allow");
  });
  it("allows a Step 0.8 hand-off claim of a ticket whose own PR is open, even beside other stuck PRs", () => {
    const stuck = [
      pr({ number: 1, body: "Fixes THR-1", mergeStateStatus: "DIRTY" }),
      pr({ number: 2, body: "Fixes THR-2", mergeStateStatus: "DIRTY" }),
    ];
    expect(decideWipGate({ id: "THR-1", state: "In Dev", assignee: "me" }, stuck, NOW).verdict).toBe("allow");
    expect(decideWipGate({ id: "THR-3", state: "In Dev", assignee: "me" }, stuck, NOW).verdict).toBe("deny");
  });
  it("allows the claim once nothing is unmerged", () => {
    expect(decideWipGate({ id: "THR-1754", state: "In Dev", assignee: "me" }, [], NOW).verdict).toBe("allow");
  });
});

describe("pipelining (2026-10-24): build beside one armed PR that is only waiting on checks", () => {
  const claim = { id: "THR-2020", state: "In Dev", assignee: "me" };
  const waiting = (number: number, mergeStateStatus?: string) =>
    pr({ number, body: `Fixes THR-${number}`, autoMergeRequest: { enabledAt: recent }, mergeStateStatus });

  it("isWaitingOnChecks: armed and not DIRTY, whatever else GitHub has computed", () => {
    expect(isWaitingOnChecks(waiting(1, "BLOCKED"))).toBe(true);
    expect(isWaitingOnChecks(waiting(1, "CLEAN"))).toBe(true);
    expect(isWaitingOnChecks(waiting(1, "UNKNOWN"))).toBe(true);
    expect(isWaitingOnChecks(waiting(1))).toBe(true);
    expect(isWaitingOnChecks(waiting(1, "DIRTY"))).toBe(false);
    expect(isWaitingOnChecks(waiting(1, "dirty"))).toBe(false);
    expect(isWaitingOnChecks(pr({ number: 1, body: "Fixes THR-1" }))).toBe(false);
  });

  it("allows the claim beside one waiting PR and records which", () => {
    const d = decideWipGate(claim, [waiting(2532, "BLOCKED")], NOW);
    expect(d.verdict).toBe("allow");
    expect(d.pipelinedBeside).toEqual([2532]);
    expect(d.reason).toContain("#2532");
  });

  it("still denies beside an unarmed PR: a review-gate park never merges by itself", () => {
    const d = decideWipGate(claim, [pr({ number: 2514, body: "Fixes THR-1965", mergeStateStatus: "CLEAN" })], NOW);
    expect(d.verdict).toBe("deny");
    expect(d.blocking).toEqual([2514]);
  });

  it("still denies beside an armed DIRTY PR", () => {
    expect(decideWipGate(claim, [waiting(2529, "DIRTY")], NOW).verdict).toBe("deny");
  });

  it(`denies beside more than ${PIPELINE_MAX_WAITING_PRS} waiting PR, and names them all`, () => {
    const prs = Array.from({ length: PIPELINE_MAX_WAITING_PRS + 1 }, (_, i) => waiting(100 + i, "BLOCKED"));
    const d = decideWipGate(claim, prs, NOW);
    expect(d.verdict).toBe("deny");
    expect(d.blocking).toEqual(prs.map((p) => p.number));
  });

  it("one waiting PR beside a stuck one still denies, naming both", () => {
    const d = decideWipGate(claim, [waiting(10, "BLOCKED"), pr({ number: 11, body: "Fixes THR-11" })], NOW);
    expect(d.verdict).toBe("deny");
    expect(d.blocking).toEqual([10, 11]);
  });
});

describe("hook entry (real script, stdin → exit code)", () => {
  const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../wip-gate.ts");
  const dir = mkdtempSync(path.join(tmpdir(), "wip-gate-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  function run(toolInput: Record<string, unknown>, prs: OpenPr[] | "broken") {
    const fixture = path.join(dir, `prs-${Math.random().toString(36).slice(2)}.json`);
    writeFileSync(fixture, prs === "broken" ? "{not json" : JSON.stringify(prs));
    const payload = JSON.stringify({ tool_name: "mcp__linear__save_issue", tool_input: toolInput, cwd: dir });
    return spawnSync(process.execPath, ["--no-warnings", "--experimental-strip-types", SCRIPT, "hook"], {
      input: payload,
      encoding: "utf8",
      env: { ...process.env, WIP_GATE_PRS_JSON: fixture },
    });
  }

  const fresh = new Date().toISOString();
  it("exits 2 with the reason on stderr when a ticket PR is unmerged", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
    const r = run({ id: "THR-9", state: "In Dev", assignee: "me" }, [pr({ number: 7, body: "Fixes THR-8", updatedAt: fresh })]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("PR #7");
  });
  it("exits 0 for a claim pipelined beside one armed PR waiting on checks", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
    const armed = pr({ number: 7, body: "Fixes THR-8", updatedAt: fresh, autoMergeRequest: {}, mergeStateStatus: "BLOCKED" });
    expect(run({ id: "THR-9", state: "In Dev", assignee: "me" }, [armed]).status).toBe(0);
  });
  it("exits 0 for a resume of the PR's own ticket", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
    expect(run({ id: "THR-8", state: "In Dev", assignee: "me" }, [pr({ number: 7, body: "Fixes THR-8", updatedAt: fresh })]).status).toBe(0);
  });
  it("fails soft (exit 0 + warning) when the PR list cannot be read", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
    const r = run({ id: "THR-9", state: "In Dev", assignee: "me" }, "broken");
    expect(r.status).toBe(0);
    expect(r.stderr).toContain("ALLOWING fail-soft");
  });
});
