import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  EXEMPTION_TOKEN,
  parseExemptionReason,
  collectChangedFilesWith,
  computeStaleWarnings,
  describeBase,
  globToRegExp,
  missingInputExitCode,
  resolveDiffBase,
  splitRemoteTrackingBase,
  type GitRunner,
  type ManifestPage,
} from "../check-wiki-freshness";

// ---------------------------------------------------------------------------
// parseExemptionReason — present / empty-reason / absent (THR-730 exemption token)
// ---------------------------------------------------------------------------

describe("parseExemptionReason", () => {
  it("returns the reason when the token carries a non-empty reason", () => {
    const body = ["feat: rename a symbol", "", `${EXEMPTION_TOKEN} pure rename, no documented behavior change`].join("\n");
    expect(parseExemptionReason(body)).toBe("pure rename, no documented behavior change");
  });

  it("returns null when the token is present but the reason is empty", () => {
    const body = ["chore: move files", "", `${EXEMPTION_TOKEN}   `].join("\n");
    expect(parseExemptionReason(body)).toBeNull();
  });

  it("returns null when the token is absent", () => {
    const body = "feat: a normal commit\n\nFixes THR-999";
    expect(parseExemptionReason(body)).toBeNull();
  });

  it("matches the token case-insensitively", () => {
    const body = "wiki-freshness-exempt: lowercased token still counts";
    expect(parseExemptionReason(body)).toBe("lowercased token still counts");
  });

  it("returns the first non-empty reason across multiple commit bodies", () => {
    const body = [
      `${EXEMPTION_TOKEN}`, // empty — skipped
      "some other line",
      `${EXEMPTION_TOKEN} type-only move`,
      `${EXEMPTION_TOKEN} a later reason that should be ignored`,
    ].join("\n");
    expect(parseExemptionReason(body)).toBe("type-only move");
  });

  it("returns null for an empty string (git log unavailable ⇒ no exemption)", () => {
    expect(parseExemptionReason("")).toBeNull();
  });

  // THR-755 row 2 — a hard-wrapped reason used to print truncated mid-sentence,
  // gutting the audit half of the escape hatch.
  it("joins a hard-wrapped reason across continuation lines", () => {
    const body = [
      "docs: rename a symbol",
      "",
      `${EXEMPTION_TOKEN} divine-actions-reference.html matches only on`,
      "a type-only import path, so no documented behavior changed.",
    ].join("\n");
    expect(parseExemptionReason(body)).toBe(
      "divine-actions-reference.html matches only on a type-only import path, so no documented behavior changed.",
    );
  });

  it("stops capturing at a blank line", () => {
    const body = [`${EXEMPTION_TOKEN} pure rename`, "", "An unrelated later paragraph."].join("\n");
    expect(parseExemptionReason(body)).toBe("pure rename");
  });

  it("stops capturing at a commit trailer rather than swallowing it", () => {
    const body = [`${EXEMPTION_TOKEN} type-only move`, "Fixes THR-999"].join("\n");
    expect(parseExemptionReason(body)).toBe("type-only move");
  });

  it("stops capturing at the next exemption token", () => {
    const body = [`${EXEMPTION_TOKEN} first reason`, `${EXEMPTION_TOKEN} second reason`].join("\n");
    expect(parseExemptionReason(body)).toBe("first reason");
  });
});

// ---------------------------------------------------------------------------
// missingInputExitCode — advisory skips soft (0), blocking fails loud (1)
// ---------------------------------------------------------------------------

describe("missingInputExitCode", () => {
  it("returns 0 in advisory mode (skip soft)", () => {
    expect(missingInputExitCode("advisory")).toBe(0);
  });

  it("returns 1 in blocking mode (fail loud — a disarmed gate must not pass)", () => {
    expect(missingInputExitCode("blocking")).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// computeStaleWarnings — core stale-page detection (pure)
// ---------------------------------------------------------------------------

describe("computeStaleWarnings", () => {
  const page = (over: Partial<ManifestPage> = {}): ManifestPage => ({
    id: "example-reference",
    file: "example-reference.html",
    sources: ["src/engine/example*.ts"],
    ...over,
  });

  it("warns when a source matches but neither the page shell nor payload changed", () => {
    const warnings = computeStaleWarnings([page()], new Set(["src/engine/exampleThing.ts"]));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("public/example-reference.html may be stale");
    expect(warnings[0]).toContain("src/engine/example*.ts");
  });

  it("does not warn when the page shell also changed", () => {
    const warnings = computeStaleWarnings(
      [page()],
      new Set(["src/engine/exampleThing.ts", "public/example-reference.html"]),
    );
    expect(warnings).toHaveLength(0);
  });

  it("does not warn when a declared payload changed (THR-690 shell+payload)", () => {
    const p = page({ payloads: ["public/example.generated.json"] });
    const warnings = computeStaleWarnings(
      [p],
      new Set(["src/engine/exampleThing.ts", "public/example.generated.json"]),
    );
    expect(warnings).toHaveLength(0);
  });

  it("does not warn when no changed file matches any source glob", () => {
    const warnings = computeStaleWarnings([page()], new Set(["src/engine/unrelated.ts"]));
    expect(warnings).toHaveLength(0);
  });

  it("warns about a malformed glob without crashing", () => {
    const p = page({ sources: ["", "src/engine/example*.ts"] });
    const warnings = computeStaleWarnings([p], new Set(["src/engine/exampleThing.ts"]));
    // one malformed-glob warning + one stale-page warning
    expect(warnings.some((w) => w.includes("malformed sources glob"))).toBe(true);
    expect(warnings.some((w) => w.includes("may be stale"))).toBe(true);
  });

  it("returns no warnings for an empty page list", () => {
    expect(computeStaleWarnings([], new Set(["src/engine/anything.ts"]))).toEqual([]);
  });

  // THR-755 row 2 — blocking mode exits 1 over this claim, so it must assert it.
  it("asserts staleness in blocking mode and hedges in advisory mode", () => {
    const changed = new Set(["src/engine/exampleThing.ts"]);
    expect(computeStaleWarnings([page()], changed, "blocking")[0]).toContain(
      "public/example-reference.html is stale",
    );
    expect(computeStaleWarnings([page()], changed, "advisory")[0]).toContain(
      "public/example-reference.html may be stale",
    );
  });
});

// ---------------------------------------------------------------------------
// splitRemoteTrackingBase — which bases can be refreshed at all (THR-819)
// ---------------------------------------------------------------------------

describe("splitRemoteTrackingBase", () => {
  it("splits the standard origin/main base", () => {
    expect(splitRemoteTrackingBase("origin/main", ["origin"])).toEqual({ remote: "origin", branch: "main" });
  });

  it("keeps slashes in the branch half", () => {
    expect(splitRemoteTrackingBase("origin/release/1.x", ["origin"])).toEqual({
      remote: "origin",
      branch: "release/1.x",
    });
  });

  // The reason the remote list is a parameter instead of "text before the first slash":
  // a local branch with a slash must not be mistaken for a remote-tracking ref.
  it("returns null for a local branch that merely contains a slash", () => {
    expect(splitRemoteTrackingBase("docs/plan-2026-07-27", ["origin"])).toBeNull();
  });

  it("returns null for a bare SHA or tag", () => {
    expect(splitRemoteTrackingBase("d7f9127d", ["origin"])).toBeNull();
    expect(splitRemoteTrackingBase("v1.2.3", ["origin"])).toBeNull();
  });

  it("returns null when the repo has no remotes", () => {
    expect(splitRemoteTrackingBase("origin/main", [])).toBeNull();
  });

  it("prefers the longest matching remote when remote names nest", () => {
    expect(splitRemoteTrackingBase("origin/mirror/main", ["origin", "origin/mirror"])).toEqual({
      remote: "origin/mirror",
      branch: "main",
    });
  });

  it("returns null when the base is exactly a remote name with no branch", () => {
    expect(splitRemoteTrackingBase("origin/", ["origin"])).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// describeBase — verdict lines must disclose whether the base was refreshed
// ---------------------------------------------------------------------------

describe("describeBase", () => {
  it("marks a refreshed base", () => {
    expect(describeBase("origin/main", "refreshed")).toBe("origin/main (refreshed)");
  });

  // The whole point of THR-819: a bare `OK` could not be distinguished from a false
  // PASS computed off a stale ref, so every verdict has to carry its provenance.
  it("marks an unfetchable base as unreliable rather than staying silent", () => {
    const out = describeBase("origin/main", "unfetchable");
    expect(out).toContain("could not refresh");
    expect(out).toContain("may be unreliable");
  });

  it("marks a deliberately unrefreshed base", () => {
    expect(describeBase("origin/main", "not-refreshed")).toBe("origin/main (not refreshed)");
  });

  it("never claims freshness it did not establish", () => {
    for (const outcome of ["unfetchable", "not-refreshed"] as const) {
      expect(describeBase("origin/main", outcome)).not.toContain("(refreshed)");
    }
  });
});

// ---------------------------------------------------------------------------
// globToRegExp — glob semantics (** across segments, * within one)
// ---------------------------------------------------------------------------

describe("globToRegExp", () => {
  it("matches `**` across path segments", () => {
    const re = globToRegExp("src/data/**/*-encounter-content.ts");
    expect(re.test("src/data/tavern/guild-encounter-content.ts")).toBe(true);
  });

  it("matches a single `*` within one segment only", () => {
    const re = globToRegExp("src/engine/encounter*.ts");
    expect(re.test("src/engine/encounterScoring.ts")).toBe(true);
    expect(re.test("src/engine/sub/encounterScoring.ts")).toBe(false);
  });

  it("escapes regex-special characters in the glob literally", () => {
    const re = globToRegExp("src/a.b.ts");
    expect(re.test("src/a.b.ts")).toBe(true);
    expect(re.test("src/aXbats")).toBe(false);
  });
});


// ---------------------------------------------------------------------------
// collectChangedFilesWith / resolveDiffBase — the changed set is scoped to the
// branch's OWN commits, not to everything `main` did since the branch point
// (THR-1191). Exercised against real throwaway git repos: the defect is a
// property of git's two-dot range semantics, so a mocked runner would only
// re-assert the fixture's own opinion of what git does.
//
// Every read-only assertion shares ONE fixture. Each repo costs ~11 git spawns,
// and process spawn is the contended resource once the full suite runs 1000+
// files: building a repo per test measurably starved a sibling git-shelling
// test into a 5s timeout that passed in 532ms alone. Share the fixture, and
// only pay for a fresh repo where a test actually mutates one.
// ---------------------------------------------------------------------------

/**
 * These tests shell git against a throwaway repo — well under a second alone, but
 * competing with every other worker in a full run. Budget the real cost rather than
 * shipping a test that goes red on machine load (THR-1191).
 */
const GIT_FIXTURE_TIMEOUT_MS = 60_000;

const tmpRepos: string[] = [];

afterAll(() => {
  while (tmpRepos.length) {
    try {
      fs.rmSync(tmpRepos.pop()!, { recursive: true, force: true });
    } catch {
      // Windows can hold a handle on a just-closed git index; leaking a temp dir
      // is not worth failing a green test over.
    }
  }
});

/** A throwaway git repo plus a GitRunner bound to it. */
function makeRepo(): { dir: string; run: GitRunner; git: (...args: string[]) => string } {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "wiki-fresh-")));
  tmpRepos.push(dir);

  const run: GitRunner = (args) => {
    try {
      return execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      return null;
    }
  };
  // Throwing variant for setup, so a broken fixture fails loudly instead of
  // silently producing an empty repo that passes every assertion vacuously.
  const g = (...args: string[]): string =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

  g("init", "-q");
  g("config", "user.email", "test@example.com");
  g("config", "user.name", "Test");
  g("config", "commit.gpgsign", "false");
  return { dir, run, git: g };
}

function writeFixtureFile(dir: string, rel: string, body: string): void {
  const abs = path.join(dir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body, "utf8");
}

/**
 * The THR-1191 repro: a `base` branch that has ADVANCED past the branch point by
 * touching a wiki-declared source, and a `feature` branch that never touched it.
 */
function makeAdvancedBaseRepo(): { dir: string; run: GitRunner; git: (...args: string[]) => string } {
  const repo = makeRepo();
  const { dir, git: g } = repo;

  writeFixtureFile(dir, "README.md", "start\n");
  g("add", "-A");
  g("commit", "-qm", "root");
  g("branch", "-M", "base");

  g("checkout", "-q", "-b", "feature");
  writeFixtureFile(dir, "src/components/Game/PremonitionModal.tsx", "feature work\n");
  g("add", "-A");
  g("commit", "-qm", "feature commit");

  // `base` moves on underneath the branch — the THR-1141-merged-during-CI shape.
  g("checkout", "-q", "base");
  writeFixtureFile(dir, "src/types/unifiedAction.ts", "someone else's change\n");
  g("add", "-A");
  g("commit", "-qm", "unrelated main commit touching a wiki source");

  g("checkout", "-q", "feature");
  return repo;
}

describe("collectChangedFilesWith / resolveDiffBase — advanced base (THR-1191)", () => {
  let shared: { dir: string; run: GitRunner; git: (...args: string[]) => string };

  beforeAll(() => {
    shared = makeAdvancedBaseRepo();
  }, GIT_FIXTURE_TIMEOUT_MS);

  it("excludes a file the base branch changed after the branch point", () => {
    const changed = collectChangedFilesWith(shared.run, "base");

    expect(changed).not.toBeNull();
    expect(changed!.has("src/components/Game/PremonitionModal.tsx")).toBe(true);
    expect(changed!.has("src/types/unifiedAction.ts")).toBe(false);
  });

  it("control arm: the old two-dot diff DOES pick up the base's own commit", () => {
    // Without this, the test above could pass for the wrong reason — e.g. a fixture
    // that never actually advanced `base`. Asserting the buggy behaviour on the same
    // repo proves the repro is real and that the fix is what removes it.
    const twoDot = (shared.run(["diff", "--name-only", "base", "--"]) ?? "").split("\n").map((l) => l.trim());

    expect(twoDot).toContain("src/types/unifiedAction.ts");
  });

  it("resolves the diff base to the merge base, not the base ref tip", () => {
    const resolved = resolveDiffBase(shared.run, "base");
    const baseTip = shared.run(["rev-parse", "base"])!.trim();
    const mergeBase = shared.run(["merge-base", "base", "HEAD"])!.trim();

    expect(resolved).toBe(mergeBase);
    expect(resolved).not.toBe(baseTip);
  });

  it("returns null when the base ref does not resolve (shallow clone, unfetched remote)", () => {
    expect(resolveDiffBase(shared.run, "origin/nonexistent")).toBeNull();
    expect(collectChangedFilesWith(shared.run, "origin/nonexistent")).toBeNull();
  });

  it("still reports a source the branch itself changed, so the gate can still fail", () => {
    // Adds a commit, so it gets its own repo rather than dirtying the shared one.
    const { dir, run, git: g } = makeAdvancedBaseRepo();

    writeFixtureFile(dir, "src/engine/encounterResolution.ts", "genuinely touched by this branch\n");
    g("add", "-A");
    g("commit", "-qm", "branch touches a declared source");

    const changed = collectChangedFilesWith(run, "base")!;
    expect(changed.has("src/engine/encounterResolution.ts")).toBe(true);

    // Compose with the detector: a touched source whose page did not change is stale.
    const page: ManifestPage = {
      id: "encounters",
      file: "encounters-reference.html",
      sources: ["src/engine/**"],
    };
    const warnings = computeStaleWarnings([page], changed, "blocking");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("is stale");
  }, GIT_FIXTURE_TIMEOUT_MS);

  it("counts uncommitted and untracked work, which `git diff A...B` would drop", () => {
    // Dirties the working tree, so it gets its own repo.
    const { dir, run } = makeAdvancedBaseRepo();

    writeFixtureFile(dir, "src/components/Game/PremonitionModal.tsx", "feature work\nedited, not committed\n");
    writeFixtureFile(dir, "src/components/Game/BrandNew.tsx", "untracked\n");

    const changed = collectChangedFilesWith(run, "base")!;

    expect(changed.has("src/components/Game/PremonitionModal.tsx")).toBe(true);
    expect(changed.has("src/components/Game/BrandNew.tsx")).toBe(true);
    // And the advanced-base exclusion still holds alongside the working tree.
    expect(changed.has("src/types/unifiedAction.ts")).toBe(false);
  }, GIT_FIXTURE_TIMEOUT_MS);

  it("falls back to the base ref when there is no common ancestor", () => {
    const { dir, run, git: g } = makeRepo();

    writeFixtureFile(dir, "README.md", "start\n");
    g("add", "-A");
    g("commit", "-qm", "root");
    g("branch", "-M", "base");

    // An orphan branch shares no history with `base`, so merge-base yields nothing.
    g("checkout", "-q", "--orphan", "feature");
    writeFixtureFile(dir, "other.txt", "unrelated\n");
    g("add", "-A");
    g("commit", "-qm", "orphan root");

    expect(resolveDiffBase(run, "base")).toBe("base");
  }, GIT_FIXTURE_TIMEOUT_MS);
});
