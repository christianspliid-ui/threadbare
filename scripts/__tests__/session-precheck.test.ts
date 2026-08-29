import { describe, expect, it } from "vitest";
import {
  INSTALL_UNUSABLE_VERDICTS,
  STALENESS_BEHIND_THRESHOLD,
  STALENESS_BRANCH_AGE_THRESHOLD_MS,
  formatFingerprintTestValue,
  probeBranchStaleness,
  probeNpmSingleTestTiming,
  testProbeAbstentionReason,
  type BranchStalenessResult,
} from "../session-precheck";
import type { HealthReport, HealthVerdict, TreeHealth } from "../node-modules-health";

// Fixed "now" for deterministic age calculations
const NOW_MS = new Date("2026-05-09T12:00:00Z").getTime();

// 30h before NOW_MS — exceeds the 24h threshold
const STALE_DATE_ISO = new Date(NOW_MS - 30 * 3600 * 1000).toISOString();

// 2h before NOW_MS — well within the fresh window
const FRESH_DATE_ISO = new Date(NOW_MS - 2 * 3600 * 1000).toISOString();

type MockGitConfig = {
  fetchOk?: boolean;
  fetchStderr?: string;
  branch?: string; // "HEAD" for detached, undefined to simulate rev-parse failure
  behind?: number;
  behindFails?: boolean;
  ahead?: number;
  aheadFails?: boolean;
  branchDateISO?: string;
};

type CommandResult = {
  ok: boolean;
  timedOut: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
  error?: string;
};

function makeMockRunner(config: MockGitConfig) {
  return (_command: string, args: string[], _timeout: number): CommandResult => {
    const argsStr = args.join(" ");

    if (args[0] === "fetch") {
      return {
        ok: config.fetchOk !== false,
        timedOut: false,
        durationMs: 5,
        stdout: "",
        stderr: config.fetchStderr ?? "",
      };
    }

    if (args[0] === "rev-parse") {
      if (config.branch === undefined) {
        return { ok: false, timedOut: false, durationMs: 5, stdout: "", stderr: "not a git repo" };
      }
      return { ok: true, timedOut: false, durationMs: 5, stdout: config.branch, stderr: "" };
    }

    if (args[0] === "rev-list" && argsStr.includes("HEAD..origin/main")) {
      if (config.behindFails) {
        return { ok: false, timedOut: false, durationMs: 5, stdout: "", stderr: "no origin/main" };
      }
      return { ok: true, timedOut: false, durationMs: 5, stdout: String(config.behind ?? 0), stderr: "" };
    }

    if (args[0] === "rev-list" && argsStr.includes("origin/main..HEAD")) {
      if (config.aheadFails) {
        return { ok: false, timedOut: false, durationMs: 5, stdout: "", stderr: "no origin/main" };
      }
      return { ok: true, timedOut: false, durationMs: 5, stdout: String(config.ahead ?? 0), stderr: "" };
    }

    if (args[0] === "log") {
      if (!config.branchDateISO) {
        return { ok: false, timedOut: false, durationMs: 5, stdout: "", stderr: "no such ref" };
      }
      return { ok: true, timedOut: false, durationMs: 5, stdout: config.branchDateISO, stderr: "" };
    }

    return { ok: false, timedOut: false, durationMs: 0, stdout: "", stderr: `unexpected args: ${argsStr}` };
  };
}

const mainTree = () => null; // .git is a directory (main worktree)
const worktreeGit = () => "gitdir: /repo/.git/worktrees/foo\n"; // .git is a file (worktree)

function probe(config: MockGitConfig, dotGit = mainTree): BranchStalenessResult {
  return probeBranchStaleness(makeMockRunner(config), dotGit, NOW_MS);
}

describe("probeBranchStaleness — freshness=current", () => {
  it("returns current on main with 0 behind, 0 ahead", () => {
    const r = probe({ branch: "main", behind: 0, ahead: 0 });
    expect(r.freshnessKey).toBe("current");
    expect(r.status).toBe("yes");
  });

  it("returns current on a non-main branch with 0 behind and fresh date", () => {
    const r = probe({ branch: "feature/foo", behind: 0, ahead: 0, branchDateISO: FRESH_DATE_ISO });
    expect(r.freshnessKey).toBe("current");
    expect(r.status).toBe("yes");
  });
});

describe("probeBranchStaleness — freshness=ahead:N", () => {
  it("returns ahead:3 on main with 3 ahead and 0 behind", () => {
    const r = probe({ branch: "main", behind: 0, ahead: 3 });
    expect(r.freshnessKey).toBe("ahead:3");
    expect(r.status).toBe("yes");
  });
});

describe("probeBranchStaleness — freshness=behind:N (below threshold → yes)", () => {
  it(`returns behind:${STALENESS_BEHIND_THRESHOLD - 1} when N < threshold`, () => {
    const n = STALENESS_BEHIND_THRESHOLD - 1;
    const r = probe({ branch: "feature/x", behind: n, ahead: 0, branchDateISO: FRESH_DATE_ISO });
    expect(r.freshnessKey).toBe(`behind:${n}`);
    expect(r.status).toBe("yes");
  });
});

describe("probeBranchStaleness — freshness=behind:N (at/above threshold → no)", () => {
  it(`returns behind:${STALENESS_BEHIND_THRESHOLD} with status=no at threshold`, () => {
    const n = STALENESS_BEHIND_THRESHOLD;
    const r = probe({ branch: "feature/x", behind: n, ahead: 0, branchDateISO: FRESH_DATE_ISO });
    expect(r.freshnessKey).toBe(`behind:${n}`);
    expect(r.status).toBe("no");
  });

  it("returns behind:146 with status=no for severely stale main", () => {
    const r = probe({ branch: "main", behind: 146, ahead: 0 });
    expect(r.freshnessKey).toBe("behind:146");
    expect(r.status).toBe("no");
  });
});

describe("probeBranchStaleness — freshness=stale-branch:Xh", () => {
  it("warns on non-main branch 30h old in main worktree", () => {
    const r = probe({ branch: "docs/thr-356-closeout", behind: 0, ahead: 0, branchDateISO: STALE_DATE_ISO }, mainTree);
    expect(r.freshnessKey).toBe("stale-branch:30h");
    expect(r.status).toBe("no");
  });

  it("does NOT warn on a stale branch when running inside a worktree", () => {
    const r = probe(
      { branch: "pickup/thr-391", behind: 0, ahead: 0, branchDateISO: STALE_DATE_ISO },
      worktreeGit,
    );
    expect(r.freshnessKey).toBe("current");
    expect(r.status).toBe("yes");
  });
});

describe("probeBranchStaleness — freshness=behind:N+stale-branch:Xh", () => {
  it("combines both signals when branch is behind AND stale", () => {
    const r = probe(
      { branch: "docs/thr-356-closeout", behind: 146, ahead: 0, branchDateISO: STALE_DATE_ISO },
      mainTree,
    );
    expect(r.freshnessKey).toBe("behind:146+stale-branch:30h");
    expect(r.status).toBe("no");
  });
});

describe("probeBranchStaleness — detached HEAD (THR-671)", () => {
  it("returns parked-at-ancestor when nothing unique is stranded", () => {
    const r = probe({ branch: "HEAD", behind: 79, ahead: 0 });
    expect(r.freshnessKey).toBe("parked-at-ancestor");
    expect(r.status).toBe("no");
  });

  it("advertises the safe two-command repair on parked-at-ancestor", () => {
    const r = probe({ branch: "HEAD", ahead: 0 });
    expect(r.detail).toContain("git switch main");
    expect(r.detail).toContain("git stash push");
  });

  it("never reports a behind-count for a detached HEAD", () => {
    // The 79-commit "behind and climbing" alarm that caused the THR-671 escalation
    const r = probe({ branch: "HEAD", behind: 79, ahead: 0 });
    expect(r.freshnessKey).not.toContain("behind");
    expect(r.detail).not.toContain("79");
  });

  it("returns parked-with-unique-commits:N when commits are stranded off-branch", () => {
    const r = probe({ branch: "HEAD", behind: 79, ahead: 3 });
    expect(r.freshnessKey).toBe("parked-with-unique-commits:3");
    expect(r.status).toBe("no");
  });

  it("refuses to advertise a reset when unique commits exist", () => {
    const r = probe({ branch: "HEAD", ahead: 3 });
    expect(r.detail).toContain("do NOT reset");
    expect(r.detail).not.toContain("git switch main");
  });

  it("falls back to detached (unknown) when the unique-commit count cannot be read", () => {
    const r = probe({ branch: "HEAD", aheadFails: true });
    expect(r.freshnessKey).toBe("detached");
    expect(r.status).toBe("unknown");
  });
});

describe("probeBranchStaleness — freshness=unknown", () => {
  it("returns unknown when git fetch fails", () => {
    const r = probe({ fetchOk: false, fetchStderr: "Connection refused" });
    expect(r.freshnessKey).toBe("unknown");
    expect(r.status).toBe("unknown");
  });

  it("does not throw when git fetch fails — exits with status unknown", () => {
    expect(() => probe({ fetchOk: false })).not.toThrow();
    const r = probe({ fetchOk: false });
    expect(r.status).toBe("unknown");
  });

  it("returns unknown when rev-list (behind) fails", () => {
    const r = probe({ branch: "main", behindFails: true });
    expect(r.freshnessKey).toBe("unknown");
    expect(r.status).toBe("unknown");
  });
});

describe("probeBranchStaleness — constants", () => {
  it("STALENESS_BEHIND_THRESHOLD is 5", () => {
    expect(STALENESS_BEHIND_THRESHOLD).toBe(5);
  });

  it("STALENESS_BRANCH_AGE_THRESHOLD_MS is 24 hours in ms", () => {
    expect(STALENESS_BRANCH_AGE_THRESHOLD_MS).toBe(24 * 3600 * 1000);
  });
});

// ---------------------------------------------------------------------------
// test: probe abstention (THR-1326)
//
// The failure under test is a CONTRADICTION, not a crash: `test: yes (1.25s)` printed
// one line above `nm: no — session tree stub`, in the same run, both true in isolation.
// Node resolves vitest by walking up the directory tree, so a worktree at
// <repo>/.claude/worktrees/<name> finds <repo>/node_modules and times the donor's
// packages while its own tree holds no install.
// ---------------------------------------------------------------------------

function tree(verdict: HealthVerdict, role: TreeHealth["role"] = "session"): TreeHealth {
  return {
    root: role === "session" ? "/repo/.claude/worktrees/wt" : "/repo",
    role,
    verdict,
    packageCount: verdict === "healthy" ? 289 : 1,
    binCount: verdict === "healthy" ? 99 : 0,
    missingShims: verdict === "healthy" ? [] : ["esbuild", "vitest"],
    linked: false,
    mtimeMs: 0,
    detail: `${verdict} (fixture)`,
  };
}

/** Only the session verdict varies; the donor stays healthy, as in the real failure. */
function report(sessionVerdict: HealthVerdict): HealthReport {
  const session = tree(sessionVerdict);
  return {
    verdict: sessionVerdict,
    session,
    donor: tree("healthy", "donor"),
    degraded: sessionVerdict !== "healthy" && sessionVerdict !== "unknown",
    summary: `session tree ${sessionVerdict}`,
  };
}

describe("testProbeAbstentionReason — which verdicts silence the timing", () => {
  it("pins the unusable set — a new verdict must be classified deliberately", () => {
    expect([...INSTALL_UNUSABLE_VERDICTS]).toEqual(["stub", "absent", "shim-stripped"]);
  });

  for (const verdict of INSTALL_UNUSABLE_VERDICTS) {
    it(`abstains on session verdict "${verdict}"`, () => {
      const reason = testProbeAbstentionReason(report(verdict));
      expect(reason).not.toBeNull();
      expect(reason).toContain(verdict);
    });
  }

  it("does NOT abstain when the session tree is healthy", () => {
    expect(testProbeAbstentionReason(report("healthy"))).toBeNull();
  });

  it("does NOT abstain on `unknown` — an unreadable probe is not evidence of damage", () => {
    // Controlled pair: the two reports differ ONLY in the session verdict, so the
    // stub arm proves the fixture can produce an abstention at all — without it,
    // the null on `unknown` would pass even if abstention were dead code.
    expect(testProbeAbstentionReason(report("unknown"))).toBeNull();
    expect(testProbeAbstentionReason(report("stub"))).not.toBeNull();
  });

  it("does NOT abstain when health could not be resolved at all (null report)", () => {
    expect(testProbeAbstentionReason(null)).toBeNull();
  });

  it("ignores a damaged DONOR when the session tree itself is healthy", () => {
    // The donor is repaired by its own lane; it does not invalidate a timing taken
    // against a healthy session tree.
    const donorDamaged: HealthReport = {
      ...report("healthy"),
      donor: tree("stub", "donor"),
      degraded: true,
    };
    expect(testProbeAbstentionReason(donorDamaged)).toBeNull();
  });
});

describe("probeNpmSingleTestTiming — abstains instead of timing a donor", () => {
  it("returns status=unknown and abstained=true on a stub session tree", () => {
    const result = probeNpmSingleTestTiming(report("stub"));
    expect(result.status).toBe("unknown");
    expect(result.abstained).toBe(true);
  });

  it("does not shell out at all when abstaining", () => {
    // Structural proof that no command ran: every executed path stamps durationMs,
    // and only the abstention path returns without one. Asserting on elapsed time
    // would be a flake; asserting on the field is exact.
    const result = probeNpmSingleTestTiming(report("absent"));
    expect(result.durationMs).toBeUndefined();
  });

  it("names the repair route rather than blaming the suite", () => {
    const result = probeNpmSingleTestTiming(report("stub"));
    expect(result.detail).toContain("nm:");
    expect(result.status).not.toBe("no");
  });
});

describe("formatFingerprintTestValue — abstained is its own token", () => {
  it("renders `abstained`, distinct from the `unknown` of a probe that tried", () => {
    const abstained = probeNpmSingleTestTiming(report("stub"));
    expect(formatFingerprintTestValue(abstained)).toBe("abstained");
    // The discriminating half: before THR-1326 this same status would have rendered
    // `unknown`, which reads as "could not tell" rather than "declined on purpose".
    expect(formatFingerprintTestValue({ name: "test", status: "unknown", detail: "x" })).toBe(
      "unknown",
    );
  });

  it("never renders a duration for an unusable session tree", () => {
    // The exact regression: fingerprint read `test=1.25s nm=session:stub/donor:healthy`.
    const value = formatFingerprintTestValue(probeNpmSingleTestTiming(report("stub")));
    expect(value).not.toMatch(/^\d+\.\d+s$/);
  });

  it("still renders a duration for a probe that genuinely ran", () => {
    const ran = { name: "test", status: "yes" as const, detail: "ok", durationMs: 1250 };
    expect(formatFingerprintTestValue(ran)).toBe("1.25s");
  });
});
