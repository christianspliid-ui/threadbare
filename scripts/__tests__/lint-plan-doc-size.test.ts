/**
 * The plan-doc size cap (THR-1948): a slice plan warns above 250 lines and fails
 * above 400 — with or without `--strict` — unless it carries `Plan-size-exempt:`.
 * Docs dated before the cap only warn, so touching an old long doc never blocks.
 *
 * Same harness as lint-plan-doc-bare.test.ts: the REAL script is bundled into a
 * throwaway git repo, so the repo's own index is never touched.
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
  const root = mkdtempSync(path.join(tmpdir(), "lint-plan-size-"));
  sandboxes.push(root);
  execFileSync("git", ["init", "-q"], { cwd: root });
  mkdirSync(path.join(root, "Docs", "plans"), { recursive: true });
  copyFileSync(TEMPLATE, path.join(root, "Docs", "plans", "_template.md"));
  const bundle = path.join(root, ".cache", "lint-plan-doc.mjs");
  buildSync({ entryPoints: [SCRIPT], bundle: true, platform: "node", format: "esm", outfile: bundle, logLevel: "silent" });
  return { root, bundle };
}

function lint(root: string, bundle: string, name: string, body: string): { status: number | null; stdout: string } {
  writeFileSync(path.join(root, "Docs", "plans", name), body);
  const result = spawnSync(process.execPath, [bundle, `Docs/plans/${name}`], { cwd: root, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout };
}

function docOfLines(count: number, head = "# Plan"): string {
  const filler = Array.from({ length: count - 1 }, (_, i) => `line ${i}`);
  return `${[head, ...filler].join("\n")}\n`;
}

afterEach(() => {
  for (const dir of sandboxes.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("lint:plan-doc size cap (THR-1948)", () => {
  it(
    "a 250-line doc carries no size finding",
    () => {
      const { root, bundle } = makeSandbox();
      const { stdout } = lint(root, bundle, "2026-11-01-short.md", docOfLines(250));
      expect(stdout).not.toContain("plan-size");
    },
    SUBPROCESS_TEST_TIMEOUT_MS,
  );

  it(
    "a 300-line doc warns and still exits 0",
    () => {
      const { root, bundle } = makeSandbox();
      const { status, stdout } = lint(root, bundle, "2026-11-01-medium.md", docOfLines(300));
      expect(stdout).toMatch(/\[WARN\] plan-size .*300 lines/);
      expect(status).toBe(0);
    },
    SUBPROCESS_TEST_TIMEOUT_MS,
  );

  it(
    "a 401-line doc fails without --strict",
    () => {
      const { root, bundle } = makeSandbox();
      const { status, stdout } = lint(root, bundle, "2026-11-01-long.md", docOfLines(401));
      expect(stdout).toMatch(/\[ERROR\] plan-size .*401 lines \(cap 400\)/);
      expect(status).toBe(1);
    },
    SUBPROCESS_TEST_TIMEOUT_MS,
  );

  it(
    "the exempt marker lifts the cap",
    () => {
      const { root, bundle } = makeSandbox();
      const head = "# Programme\n\n> **Plan-size-exempt:** multi-slice programme doc";
      const { status, stdout } = lint(root, bundle, "2026-11-01-programme.md", docOfLines(600, head));
      expect(stdout).not.toContain("plan-size");
      expect(status).toBe(0);
    },
    SUBPROCESS_TEST_TIMEOUT_MS,
  );

  it(
    "a pipeline packet in a subdirectory is never size-capped",
    () => {
      const { root, bundle } = makeSandbox();
      mkdirSync(path.join(root, "Docs", "plans", "attachments"), { recursive: true });
      const { status, stdout } = lint(root, bundle, "attachments/upgrade-foo-final.md", docOfLines(450));
      expect(stdout).not.toContain("plan-size");
      expect(status).toBe(0);
    },
    SUBPROCESS_TEST_TIMEOUT_MS,
  );

  it(
    "a doc dated before the cap only warns",
    () => {
      const { root, bundle } = makeSandbox();
      const { status, stdout } = lint(root, bundle, "2026-10-14-old-long.md", docOfLines(1800));
      expect(stdout).toMatch(/\[WARN\] plan-size .*not blocking/);
      expect(status).toBe(0);
    },
    SUBPROCESS_TEST_TIMEOUT_MS,
  );
});
