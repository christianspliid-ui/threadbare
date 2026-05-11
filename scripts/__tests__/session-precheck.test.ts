import { describe, expect, it } from "vitest";
import {
  STALENESS_BEHIND_THRESHOLD,
  STALENESS_BRANCH_AGE_THRESHOLD_MS,
  probeBranchStaleness,
  type BranchStalenessResult,
} from "../session-precheck";

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

describe("probeBranchStaleness — freshness=detached", () => {
  it("returns detached when HEAD is detached", () => {
    const r = probe({ branch: "HEAD" });
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
