/**
 * The bare `npm run lint:plan-doc` must lint something (THR-984, impediment #409).
 *
 * Its old default mode read only CLI paths, and the npm script passes none, so the
 * documented invocation linted zero files and printed `skipped (no candidate files
 * found)` whatever the tree held. With no arguments it now lints the staged plan
 * docs — the set the pre-commit hook lints.
 *
 * Both directions are asserted on purpose: a staged malformed doc is reported, and
 * a tree with nothing staged skips with a reason that names the mode, so an empty
 * set can never read as a clean run.
 *
 * The tests bundle the REAL script into a throwaway git repo (`repoRoot` resolves
 * from the bundle's location, exactly as the npm script's `.cache/` bundle does),
 * so the repo's own index is never touched.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";
import { afterEach, describe, expect, it } from "vitest";
import { SUBPROCESS_TEST_TIMEOUT_MS } from "../../src/testing/testTimeouts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "lint-plan-doc.ts");
const TEMPLATE = path.join(REPO_ROOT, "Docs", "plans", "_template.md");

const sandboxes: string[] = [];

function makeSandbox(): { root: string; bundle: string } {
  const root = mkdtempSync(path.join(tmpdir(), "lint-plan-doc-"));
  sandboxes.push(root);
  execFileSync("git", ["init", "-q"], { cwd: root });
  mkdirSync(path.join(root, "Docs", "plans"), { recursive: true });
  copyFileSync(TEMPLATE, path.join(root, "Docs", "plans", "_template.md"));
  const bundle = path.join(root, ".cache", "lint-plan-doc.mjs");
  buildSync({
    entryPoints: [SCRIPT],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: bundle,
    logLevel: "silent",
  });
  return { root, bundle };
}

function runBare(root: string, bundle: string): { status: number | null; stdout: string } {
  const result = spawnSync(process.execPath, [bundle], { cwd: root, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout };
}

afterEach(() => {
  for (const dir of sandboxes.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("bare lint:plan-doc (THR-984)", () => {
  it(
    "reports findings on a staged malformed plan doc",
    () => {
      const { root, bundle } = makeSandbox();
      writeFileSync(path.join(root, "Docs", "plans", "2026-01-01-malformed.md"), "# Malformed\n\nNo sections.\n");
      execFileSync("git", ["add", "Docs/plans/2026-01-01-malformed.md"], { cwd: root });

      const { status, stdout } = runBare(root, bundle);

      expect(stdout).toContain("no paths given — linting staged");
      expect(stdout).toMatch(/\[ERROR\] \S+ Docs\/plans\/2026-01-01-malformed\.md/);
      expect(stdout).not.toContain("skipped");
      // Advisory without --strict (verification-gates.md step 5): findings, exit 0.
      expect(status).toBe(0);
    },
    SUBPROCESS_TEST_TIMEOUT_MS,
  );

  it(
    "with nothing staged, skips with a reason that names the staged mode",
    () => {
      const { root, bundle } = makeSandbox();

      const { status, stdout } = runBare(root, bundle);

      expect(stdout).toContain("no paths given — linting staged");
      expect(stdout).toContain("lint:plan-doc skipped (no staged or changed plan docs).");
      expect(stdout).not.toContain("[ERROR]");
      expect(status).toBe(0);
    },
    SUBPROCESS_TEST_TIMEOUT_MS,
  );

  it(
    "explicit paths that hold no plan doc say so, distinct from the staged skip",
    () => {
      const { root, bundle } = makeSandbox();

      const result = spawnSync(process.execPath, [bundle, "README.md"], { cwd: root, encoding: "utf8" });

      expect(result.stdout).not.toContain("no paths given");
      expect(result.stdout).toContain("none of the 1 given path(s) is an existing Docs/plans/*.md file");
      expect(result.status).toBe(0);
    },
    SUBPROCESS_TEST_TIMEOUT_MS,
  );
});
