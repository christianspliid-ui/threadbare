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
import { existsSync, mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SUBPROCESS_TEST_TIMEOUT_MS } from "../../src/testing/testTimeouts";

const HOOK = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.claude/hooks/worktree-write-guard.sh",
);

/**
 * Which `bash` can actually run the hook (THR-1328).
 *
 * Bare `"bash"` is not a safe spawn target on Windows. `C:\Windows\System32\bash.exe`
 * — the **WSL** launcher — ships with the OS and sits ahead of Git Bash on the PATH
 * of a PowerShell session, which is how the scheduled lanes invoke vitest. WSL's
 * bash resolves paths against a Linux root, so it cannot open a `C:\…` script at
 * all: it reports `/bin/bash: C:UserschrisDevProjectsThe…` (the backslashes eaten
 * as escapes) and exits 127. That turned all 9 cases red on every PowerShell-side
 * local run while CI stayed green — a permanent local red teaching red-blindness
 * at exactly the moment a red decides whether a diff ships (impediment #756).
 *
 * The green/red split was never about the guard: it is which interpreter answered.
 * Under the Bash tool (Git Bash first on PATH) the same commit passes 9/9. So the
 * fix is to name the interpreter rather than trust PATH order — and Git Bash is
 * the *correct* one to name, because it is what the Claude Code harness itself
 * uses to run these hooks. Verifying the guard under WSL would assert the wrong
 * interpreter's behaviour even if the path resolved.
 *
 * Derived from `git --exec-path` (`<root>/mingw64/libexec/git-core` → `<root>/bin/bash.exe`)
 * rather than hardcoding an install location, so it follows a non-default Git install.
 */
function resolveBash(): string | null {
  if (process.platform !== "win32") return "bash";

  try {
    const execPath = execFileSync("git", ["--exec-path"], { encoding: "utf8" }).trim();
    // …/mingw64/libexec/git-core → …/mingw64/libexec → …/mingw64 → the install root.
    const gitBash = path.join(path.dirname(path.dirname(path.dirname(execPath))), "bin", "bash.exe");
    if (existsSync(gitBash)) return gitBash;
  } catch {
    // No git on PATH — fall through to the skip below.
  }
  return null;
}

const BASH = resolveBash();

/**
 * Git Bash accepts a `C:\…` argv path, but the hook is passed forward-slashed
 * anyway: it is the form the script's own comparisons and messages use, so the
 * fixture and the shipped hook agree on one spelling.
 */
const HOOK_ARG = HOOK.replace(/\\/g, "/");

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
  const result = spawnSync(BASH as string, [HOOK_ARG], {
    input: JSON.stringify({ tool_name: toolName, tool_input: { file_path: filePath }, cwd }),
    encoding: "utf8",
  });
  // A spawn that never reached the script (127) is an environment fault, not a
  // verdict — surface it as itself instead of as a failed guard assertion.
  if (result.status === 127) {
    throw new Error(
      `could not execute the hook via ${BASH}: ${result.stderr?.trim() || "exit 127"}`,
    );
  }
  return { status: result.status, stderr: result.stderr ?? "" };
}

/**
 * No Git Bash on a Windows box: skip loudly rather than fail. The guard is a
 * bash script, so "there is no bash that can run it here" is an environment
 * fact about the machine, not a defect in the hook (impediment #756 names both
 * this route and the path fix; THR-1328 ships both).
 */
const describeGuard = describe.skipIf(!BASH);

beforeAll(() => {
  if (!BASH) return; // suites are skipped; do not pay for the fixture.
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
}, SUBPROCESS_TEST_TIMEOUT_MS);

afterAll(() => {
  // Skipped run: `beforeAll` returned before minting either dir.
  for (const dir of [homeTree, outside].filter(Boolean)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Timeout raised off vitest's 5000 ms default (THR-853): every case shells out to
// bash, and process-startup cost is what degrades under a loaded vitest pool —
// these ran 558–866 ms standalone and blew the default in-suite. Hang detector,
// not a performance budget; see src/testing/testTimeouts.ts.
describeGuard("worktree-write-guard — THR-685 protection is intact", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
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

describeGuard("worktree-write-guard — THR-880 false positive is fixed", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
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

describeGuard("worktree-write-guard — unaffected cases still allow", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
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
