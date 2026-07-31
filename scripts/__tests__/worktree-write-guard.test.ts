/**
 * Regression suite for `.claude/hooks/worktree-write-guard.sh` (THR-685, THR-880).
 *
 * The guard blocks a linked-worktree session from writing into the HOME tree.
 * It must NOT block a linked-worktree session from writing into a *sibling*
 * linked worktree — but `.claude/worktrees/` lives inside the home tree's own
 * working copy, so every sibling path is lexically under the home tree and a
 * prefix test cannot tell the two apart (impediment #317).
 *
 * Both directions are asserted here on purpose: the fix must not degenerate
 * into a blanket disable.
 *
 * The tests drive the REAL hook script — `cwd` and `file_path` come from the
 * hook's stdin payload, not from the process, so pointing them at a throwaway
 * repo exercises the shipped file with no copying.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const HOOK = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.claude/hooks/worktree-write-guard.sh",
);

/** Exit 2 is the PreToolUse "block" contract; 0 is "allow". */
const BLOCK = 2;
const ALLOW = 0;

let homeTree: string;
let siblingA: string;
let siblingB: string;
let outside: string;

function git(cwd: string, ...args: string[]): void {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

/** Run the guard as the harness would: JSON on stdin, exit code as verdict. */
function runHook(cwd: string, filePath: string, toolName = "Edit") {
  const result = spawnSync("bash", [HOOK], {
    input: JSON.stringify({ tool_name: toolName, tool_input: { file_path: filePath }, cwd }),
    encoding: "utf8",
  });
  return { status: result.status, stderr: result.stderr ?? "" };
}

beforeAll(() => {
  // realpath: on Windows tmpdir() can hand back an 8.3 short path while git
  // reports the long one, which would break every prefix comparison below.
  homeTree = realpathSync(mkdtempSync(path.join(tmpdir(), "tb-guard-")));
  outside = realpathSync(mkdtempSync(path.join(tmpdir(), "tb-outside-")));

  git(homeTree, "init", "--initial-branch=main");
  git(homeTree, "config", "user.email", "test@example.com");
  git(homeTree, "config", "user.name", "Test");
  mkdirSync(path.join(homeTree, "src"), { recursive: true });
  writeFileSync(path.join(homeTree, "src", "foo.ts"), "export const foo = 1;\n");
  git(homeTree, "add", "-A");
  git(homeTree, "commit", "-m", "init");

  // Reproduce the harness geometry exactly: linked worktrees nested INSIDE the
  // home tree's working copy. This nesting is what makes a prefix test unsound.
  siblingA = path.join(homeTree, ".claude", "worktrees", "wt-a");
  siblingB = path.join(homeTree, ".claude", "worktrees", "wt-b");
  git(homeTree, "worktree", "add", "-b", "wt-a", siblingA);
  git(homeTree, "worktree", "add", "-b", "wt-b", siblingB);
});

afterAll(() => {
  for (const dir of [homeTree, outside]) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("worktree-write-guard — THR-685 protection is intact", () => {
  it("blocks a linked-worktree session writing a home-tree path", () => {
    const { status, stderr } = runHook(siblingA, path.join(homeTree, "src", "foo.ts"));
    expect(status).toBe(BLOCK);
    expect(stderr).toContain("blocked a write into the HOME worktree");
  });

  it("blocks Write as well as Edit", () => {
    const { status } = runHook(siblingA, path.join(homeTree, "src", "foo.ts"), "Write");
    expect(status).toBe(BLOCK);
  });

  it("names a corrected path that lives in the session worktree", () => {
    const { stderr } = runHook(siblingA, path.join(homeTree, "src", "foo.ts"));
    // The remediation must point at the session worktree's copy — never a
    // <worktree>/.claude/worktrees/<other>/… nesting, which cannot exist.
    expect(stderr).toContain(path.join(siblingA, "src", "foo.ts").replace(/\\/g, "/"));
    expect(stderr).not.toMatch(/worktrees[/\\]wt-a[/\\]\.claude[/\\]worktrees/);
  });
});

describe("worktree-write-guard — THR-880 false positive is fixed", () => {
  it("allows a linked-worktree session writing into a SIBLING linked worktree", () => {
    const { status, stderr } = runHook(siblingA, path.join(siblingB, "src", "foo.ts"));
    expect(stderr).toBe("");
    expect(status).toBe(ALLOW);
  });

  it("allows writing a not-yet-existing file in a sibling worktree", () => {
    const { status } = runHook(siblingA, path.join(siblingB, "docs", "brand-new.md"));
    expect(status).toBe(ALLOW);
  });
});

describe("worktree-write-guard — unaffected cases still allow", () => {
  it("allows a session writing inside its own worktree", () => {
    expect(runHook(siblingA, path.join(siblingA, "src", "foo.ts")).status).toBe(ALLOW);
  });

  it("allows a home-tree session writing a home-tree path", () => {
    expect(runHook(homeTree, path.join(homeTree, "src", "foo.ts")).status).toBe(ALLOW);
  });

  it("allows targets outside every registered tree", () => {
    expect(runHook(siblingA, path.join(outside, "notes.md")).status).toBe(ALLOW);
  });

  it("ignores tools other than Write/Edit", () => {
    const { status } = runHook(siblingA, path.join(homeTree, "src", "foo.ts"), "Bash");
    expect(status).toBe(ALLOW);
  });
});
