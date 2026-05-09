import { describe, expect, it } from "vitest";

import { probeBranchStaleness } from "../session-precheck";

type MockCommandResult = {
  ok: boolean;
  timedOut: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
  error?: string;
};

const okResult = (stdout: string): MockCommandResult => ({
  ok: true,
  timedOut: false,
  durationMs: 10,
  stdout,
  stderr: "",
});

const failResult = (stderr: string): MockCommandResult => ({
  ok: false,
  timedOut: false,
  durationMs: 10,
  stdout: "",
  stderr,
});

function makeRunner(resultsByCommand: Record<string, MockCommandResult>) {
  return (command: string, args: string[]): MockCommandResult => {
    const key = `${command} ${args.join(" ")}`;
    const result = resultsByCommand[key];
    if (!result) {
      throw new Error(`Unexpected command in test: ${key}`);
    }
    return result;
  };
}

describe("probeBranchStaleness", () => {
  const nowMs = Date.parse("2026-05-09T12:00:00.000Z");

  it("returns current on main with no drift", () => {
    const result = probeBranchStaleness({
      nowMs,
      worktreeCheckout: false,
      runCommandFn: makeRunner({
        "git fetch origin --quiet": okResult(""),
        "git rev-parse --abbrev-ref HEAD": okResult("main"),
        "git rev-list --count HEAD..origin/main": okResult("0"),
        "git rev-list --count origin/main..HEAD": okResult("0"),
      }),
    });

    expect(result.status).toBe("yes");
    expect(result.freshness).toBe("current");
  });

  it("returns ahead:N when main is ahead", () => {
    const result = probeBranchStaleness({
      nowMs,
      worktreeCheckout: false,
      runCommandFn: makeRunner({
        "git fetch origin --quiet": okResult(""),
        "git rev-parse --abbrev-ref HEAD": okResult("main"),
        "git rev-list --count HEAD..origin/main": okResult("0"),
        "git rev-list --count origin/main..HEAD": okResult("3"),
      }),
    });

    expect(result.status).toBe("yes");
    expect(result.freshness).toBe("ahead:3");
  });

  it("returns behind:N when behind threshold is reached", () => {
    const result = probeBranchStaleness({
      nowMs,
      worktreeCheckout: true,
      runCommandFn: makeRunner({
        "git fetch origin --quiet": okResult(""),
        "git rev-parse --abbrev-ref HEAD": okResult("feature/thr-391"),
        "git rev-list --count HEAD..origin/main": okResult("7"),
        "git rev-list --count origin/main..HEAD": okResult("0"),
        "git log -1 --format=%cI origin/feature/thr-391": okResult("2026-05-09T11:00:00.000Z"),
      }),
    });

    expect(result.status).toBe("no");
    expect(result.freshness).toBe("behind:7");
  });

  it("returns stale-branch:Xh for old non-worktree branches", () => {
    const result = probeBranchStaleness({
      nowMs,
      worktreeCheckout: false,
      runCommandFn: makeRunner({
        "git fetch origin --quiet": okResult(""),
        "git rev-parse --abbrev-ref HEAD": okResult("docs/thr-356-closeout"),
        "git rev-list --count HEAD..origin/main": okResult("0"),
        "git rev-list --count origin/main..HEAD": okResult("0"),
        "git log -1 --format=%cI origin/docs/thr-356-closeout": okResult("2026-05-08T10:00:00.000Z"),
      }),
    });

    expect(result.status).toBe("no");
    expect(result.freshness).toBe("stale-branch:26h");
  });

  it("returns combined behind+stale freshness when both conditions are true", () => {
    const result = probeBranchStaleness({
      nowMs,
      worktreeCheckout: false,
      runCommandFn: makeRunner({
        "git fetch origin --quiet": okResult(""),
        "git rev-parse --abbrev-ref HEAD": okResult("docs/thr-356-closeout"),
        "git rev-list --count HEAD..origin/main": okResult("146"),
        "git rev-list --count origin/main..HEAD": okResult("0"),
        "git log -1 --format=%cI origin/docs/thr-356-closeout": okResult("2026-05-07T10:00:00.000Z"),
      }),
    });

    expect(result.status).toBe("no");
    expect(result.freshness).toBe("behind:146+stale-branch:50h");
  });

  it("falls back to HEAD timestamp when origin/<branch> is unavailable", () => {
    const result = probeBranchStaleness({
      nowMs,
      worktreeCheckout: false,
      runCommandFn: makeRunner({
        "git fetch origin --quiet": okResult(""),
        "git rev-parse --abbrev-ref HEAD": okResult("feature/local-only"),
        "git rev-list --count HEAD..origin/main": okResult("0"),
        "git rev-list --count origin/main..HEAD": okResult("0"),
        "git log -1 --format=%cI origin/feature/local-only": failResult("fatal: ambiguous argument 'origin/feature/local-only'"),
        "git log -1 --format=%cI HEAD": okResult("2026-05-08T10:00:00.000Z"),
      }),
    });

    expect(result.status).toBe("no");
    expect(result.freshness).toBe("stale-branch:26h");
  });

  it("returns detached on detached HEAD", () => {
    const result = probeBranchStaleness({
      nowMs,
      worktreeCheckout: false,
      runCommandFn: makeRunner({
        "git fetch origin --quiet": okResult(""),
        "git rev-parse --abbrev-ref HEAD": okResult("HEAD"),
      }),
    });

    expect(result.status).toBe("unknown");
    expect(result.freshness).toBe("detached");
  });

  it("returns unknown when fetch fails", () => {
    const result = probeBranchStaleness({
      nowMs,
      worktreeCheckout: false,
      runCommandFn: makeRunner({
        "git fetch origin --quiet": failResult("fatal: unable to access 'https://github.com/...': Could not resolve host"),
      }),
    });

    expect(result.status).toBe("unknown");
    expect(result.freshness).toBe("unknown");
  });
});
