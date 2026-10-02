/**
 * THR-1691 — the automatic code-review gate.
 *
 * Two layers, both asserted: the pure verdict (`decideReviewGate` and its parsers),
 * and the REAL hook script driven end-to-end against a throwaway git repo — the six
 * Done-when cases (no receipt, stale receipt, open finding, docs-only, clean receipt,
 * exempt line) run through `.claude/hooks/review-gate.sh` exactly as the harness
 * would call it: hook JSON on stdin, exit code as verdict.
 *
 * `REVIEW_GATE_NO_GH=1` keeps the fixture hermetic — the gate's PR-comment fallback
 * would otherwise ask GitHub about a repo with no remote.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SUBPROCESS_TEST_TIMEOUT_MS } from "../../src/testing/testTimeouts";
import {
  decideReviewGate,
  extractMergeTarget,
  isMergeCommand,
  parseCommentMarker,
  parseExemptReason,
  renderReceiptComment,
  type GateInputs,
  type Receipt,
} from "../review-gate";

const HOOK = path
  .resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.claude/hooks/review-gate.sh")
  .replace(/\\/g, "/");

/** Same interpreter resolution as worktree-write-guard.test.ts (THR-1328): never WSL bash. */
function resolveBash(): string | null {
  if (process.platform !== "win32") return "bash";
  try {
    const execPath = execFileSync("git", ["--exec-path"], { encoding: "utf8" }).trim();
    const gitBash = path.join(path.dirname(path.dirname(path.dirname(execPath))), "bin", "bash.exe");
    if (existsSync(gitBash)) return gitBash;
  } catch {
    // fall through
  }
  return null;
}
const BASH = resolveBash();

const SHA = "a".repeat(40);
const base: GateInputs = {
  headSha: SHA,
  files: ["src/engine/foo.ts"],
  commitBodies: "feat: thing\n",
  exactReceipt: null,
  carriedReceipt: null,
  commentMarker: null,
};
const clean: Receipt = { sha: SHA, rounds: 1, findings: [], reviewedAt: "2026-10-02T00:00:00Z" };

describe("review gate — pure verdict", () => {
  it("recognises merge-arming commands and leaves disarming alone", () => {
    expect(isMergeCommand("gh pr merge --auto --merge")).toBe(true);
    expect(isMergeCommand("cd x && gh  pr merge 12 --auto")).toBe(true);
    expect(isMergeCommand("gh pr merge 12 --disable-auto")).toBe(false);
    expect(isMergeCommand("gh pr view 12")).toBe(false);
    expect(isMergeCommand("git merge origin/main")).toBe(false);
  });

  it("extracts a PR target past value-taking flags and quotes", () => {
    expect(extractMergeTarget("gh pr merge --auto --merge")).toEqual({ target: null, repo: null });
    expect(extractMergeTarget("gh pr merge 2164 --auto --merge")).toEqual({ target: "2164", repo: null });
    expect(extractMergeTarget('gh pr merge --subject "a b c" 77 -R o/r')).toEqual({ target: "77", repo: "o/r" });
    expect(extractMergeTarget("gh pr merge --auto && echo 5")).toEqual({ target: null, repo: null });
  });

  it("parses the exemption only when line-anchored with a reason", () => {
    expect(parseExemptReason("x\nReview-gate exempt: revert of a broken merge\n")).toBe("revert of a broken merge");
    expect(parseExemptReason("x\nReview-gate exempt:   \n")).toBeNull();
    expect(parseExemptReason("we never write Review-gate exempt: in prose\n")).toBeNull();
  });

  it("denies a code diff with no receipt", () => {
    expect(decideReviewGate(base).verdict).toBe("deny");
  });

  it("allows a docs-only diff without a receipt", () => {
    expect(decideReviewGate({ ...base, files: ["Docs/plans/x.md"] }).verdict).toBe("allow");
  });

  it("allows a clean exact receipt and a clean docs-only-carried receipt", () => {
    expect(decideReviewGate({ ...base, exactReceipt: clean }).verdict).toBe("allow");
    expect(decideReviewGate({ ...base, carriedReceipt: { ...clean, sha: "b".repeat(40) } }).verdict).toBe("allow");
  });

  it("denies a receipt with an open finding, naming it", () => {
    const decision = decideReviewGate({
      ...base,
      exactReceipt: {
        ...clean,
        findings: [{ severity: "high", file: "src/a.ts", line: 3, summary: "reads a dead field", disposition: "open" }],
      },
    });
    expect(decision.verdict).toBe("deny");
    expect(decision.reason).toContain("src/a.ts:3");
  });

  it("honors the exemption line", () => {
    expect(decideReviewGate({ ...base, commitBodies: "x\n\nReview-gate exempt: emergency revert\n" }).verdict).toBe("allow");
  });

  it("round-trips the PR-comment marker", () => {
    const comment = renderReceiptComment(clean);
    expect(parseCommentMarker(comment)).toEqual({ sha: SHA, open: 0 });
    expect(decideReviewGate({ ...base, commentMarker: { sha: SHA, open: 0 } }).verdict).toBe("allow");
    expect(decideReviewGate({ ...base, commentMarker: { sha: SHA, open: 2 } }).verdict).toBe("deny");
    expect(decideReviewGate({ ...base, commentMarker: { sha: "c".repeat(40), open: 0 } }).verdict).toBe("deny");
  });
});

const describeHook = describe.skipIf(!BASH);

describeHook("review gate — the real hook against a fixture repo", () => {
  let repo: string;

  const git = (...args: string[]) => execFileSync("git", args, { cwd: repo, stdio: "pipe", encoding: "utf8" }).trim();
  const head = () => git("rev-parse", "HEAD");
  const commit = (file: string, message: string) => {
    mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    writeFileSync(path.join(repo, file), `${message}\n`);
    git("add", "-A");
    git("commit", "-q", "-m", message);
  };
  const writeReceipt = (sha: string, disposition: "fixed" | "open" | null) => {
    const dir = path.join(repo, ".claude/review-receipts");
    mkdirSync(dir, { recursive: true });
    const findings = disposition
      ? [{ severity: "medium", file: "src/feature.ts", line: 1, summary: "example", disposition }]
      : [];
    writeFileSync(path.join(dir, `${sha}.json`), JSON.stringify({ sha, rounds: 1, findings, reviewedAt: "2026-10-02T00:00:00Z" }));
  };
  const clearReceipts = () => rmSync(path.join(repo, ".claude/review-receipts"), { recursive: true, force: true });
  const runHook = (command = "gh pr merge --auto --merge") => {
    const result = spawnSync(BASH as string, [HOOK], {
      input: JSON.stringify({ tool_name: "Bash", tool_input: { command }, cwd: repo }),
      encoding: "utf8",
      env: { ...process.env, REVIEW_GATE_NO_GH: "1" },
    });
    return { status: result.status, stderr: result.stderr ?? "" };
  };
  const resetTo = (ref: string) => git("reset", "-q", "--hard", ref);

  let baseSha: string;

  beforeAll(() => {
    repo = realpathSync(mkdtempSync(path.join(tmpdir(), "tb-review-gate-")));
    git("init", "-q", "--initial-branch=main");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "test");
    // Receipts are gitignored in the real repo; the fixture must match, or every
    // `git add -A` commits the receipt and turns a docs-only delta into a code one.
    writeFileSync(path.join(repo, ".gitignore"), ".claude/review-receipts/\n");
    commit("README.md", "base");
    baseSha = head();
    git("update-ref", "refs/remotes/origin/main", baseSha);
    git("checkout", "-q", "-b", "feature");
  });

  afterAll(() => {
    if (repo) rmSync(repo, { recursive: true, force: true });
  });

  it("allows a non-merge command without judging it", () => {
    expect(runHook("git status").status).toBe(0);
  }, SUBPROCESS_TEST_TIMEOUT_MS);

  it("denies gh pr merge --auto on a code diff with no receipt", () => {
    resetTo(baseSha);
    clearReceipts();
    commit("src/feature.ts", "feat: code");
    const r = runHook();
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("no review receipt");
  }, SUBPROCESS_TEST_TIMEOUT_MS);

  it("denies with a stale-SHA receipt (code changed since the review)", () => {
    resetTo(baseSha);
    clearReceipts();
    commit("src/feature.ts", "feat: code");
    writeReceipt(head(), null);
    commit("src/feature2.ts", "feat: more code after the review");
    expect(runHook().status).toBe(2);
  }, SUBPROCESS_TEST_TIMEOUT_MS);

  it("allows a receipt carried across a docs-only delta", () => {
    resetTo(baseSha);
    clearReceipts();
    commit("src/feature.ts", "feat: code");
    writeReceipt(head(), null);
    commit("Docs/status/note.md", "docs: closeout");
    expect(runHook().status).toBe(0);
  }, SUBPROCESS_TEST_TIMEOUT_MS);

  it("denies with an open finding", () => {
    resetTo(baseSha);
    clearReceipts();
    commit("src/feature.ts", "feat: code");
    writeReceipt(head(), "open");
    const r = runHook();
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("open finding");
  }, SUBPROCESS_TEST_TIMEOUT_MS);

  it("allows a docs-only diff with no receipt", () => {
    resetTo(baseSha);
    clearReceipts();
    commit("Docs/plans/x.md", "docs: plan");
    expect(runHook().status).toBe(0);
  }, SUBPROCESS_TEST_TIMEOUT_MS);

  it("allows with a matching clean receipt", () => {
    resetTo(baseSha);
    clearReceipts();
    commit("src/feature.ts", "feat: code");
    writeReceipt(head(), "fixed");
    expect(runHook().status).toBe(0);
  }, SUBPROCESS_TEST_TIMEOUT_MS);

  it("honors the exempt line", () => {
    resetTo(baseSha);
    clearReceipts();
    mkdirSync(path.join(repo, "src"), { recursive: true });
    writeFileSync(path.join(repo, "src/feature.ts"), "x\n");
    git("add", "-A");
    git("commit", "-q", "-m", "fix: emergency revert", "-m", "Review-gate exempt: reverting a broken merge on main");
    expect(runHook().status).toBe(0);
  }, SUBPROCESS_TEST_TIMEOUT_MS);

  it("fails soft (allows) when the gate itself errors", () => {
    // A cwd that is not a git repo makes every git call throw inside the gate.
    const notRepo = realpathSync(mkdtempSync(path.join(tmpdir(), "tb-review-gate-norepo-")));
    const result = spawnSync(BASH as string, [HOOK], {
      input: JSON.stringify({ tool_name: "Bash", tool_input: { command: "gh pr merge --auto" }, cwd: notRepo }),
      encoding: "utf8",
      env: { ...process.env, REVIEW_GATE_NO_GH: "1" },
    });
    rmSync(notRepo, { recursive: true, force: true });
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("ALLOWING fail-soft");
  }, SUBPROCESS_TEST_TIMEOUT_MS);
});
