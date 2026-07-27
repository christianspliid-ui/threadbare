import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEPLOY_STALE_GRACE_MINUTES,
  classifyDeployHealth,
  parseBuildRelevantPaths,
  type DeployHealthInput,
  type DeploymentRecord,
  type DeploymentState,
} from "../check-deploy-health";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const NOW_MS = new Date("2026-07-27T12:00:00Z").getTime();
const GRACE_MS = DEPLOY_STALE_GRACE_MINUTES * 60 * 1000;

const HEAD = "a9c3307853b9fe60e542df7a48b371d0a0607642";
const OLDER = "1a9e4cd567a8b9efa1e93751783ddd1bcc22ba58";
const OLDEST = "a406dc8324a066bca69a8d11b9e80b5106abd692";

function deployment(
  sha: string,
  state: DeploymentState,
  ageMinutes = 30,
  id = 1,
): DeploymentRecord {
  return { id, sha, state, createdAtMs: NOW_MS - ageMinutes * 60 * 1000 };
}

/**
 * `headAgeMinutes` past the grace window by default — the interesting failure
 * verdicts only fire once a build has had time to happen.
 */
function input(overrides: Partial<DeployHealthInput> = {}): DeployHealthInput {
  return {
    headSha: HEAD,
    headCommittedAtMs: NOW_MS - 60 * 60 * 1000,
    nowMs: NOW_MS,
    deployments: [],
    buildIrrelevantSince: () => false,
    ...overrides,
  };
}

describe("classifyDeployHealth", () => {
  it("reports deployed when a successful Production deployment exists for HEAD", () => {
    const result = classifyDeployHealth(
      input({ deployments: [deployment(HEAD, "success")] }),
    );

    expect(result.verdict).toBe("deployed");
    expect(result.needsChristian).toBe(false);
    expect(result.deployedSha).toBe(HEAD);
  });

  it("reports failed and asks for a human when the newest deployment errored", () => {
    for (const state of ["failure", "error"] as const) {
      const result = classifyDeployHealth(
        input({ deployments: [deployment(HEAD, state), deployment(OLDER, "success", 90)] }),
      );

      expect(result.verdict).toBe("failed");
      expect(result.needsChristian).toBe(true);
    }
  });

  it("reports failed when every deployment in the lookback window failed", () => {
    const result = classifyDeployHealth(
      input({
        // HEAD itself has no deployment; the ones that exist all failed.
        deployments: [
          deployment(OLDER, "failure", 30, 1),
          deployment(OLDEST, "error", 90, 2),
        ],
      }),
    );

    expect(result.verdict).toBe("failed");
    expect(result.needsChristian).toBe(true);
  });

  // This is the THR-785 case: a green `Vercel` commit status, no deployment,
  // and real code changes sitting undeployed. Nothing else surfaces it.
  it("reports stale when HEAD has build-relevant changes no successful deployment covers", () => {
    const result = classifyDeployHealth(
      input({
        deployments: [deployment(OLDER, "success")],
        buildIrrelevantSince: () => false,
      }),
    );

    expect(result.verdict).toBe("stale");
    expect(result.needsChristian).toBe(true);
    expect(result.deployedSha).toBe(OLDER);
  });

  it("reports skipped (benign) when nothing build-relevant changed since the last success", () => {
    const result = classifyDeployHealth(
      input({
        deployments: [deployment(OLDER, "success")],
        buildIrrelevantSince: () => true,
      }),
    );

    expect(result.verdict).toBe("skipped");
    expect(result.needsChristian).toBe(false);
    expect(result.deployedSha).toBe(OLDER);
  });

  it("passes the last SUCCESSFUL sha to the comparison, not merely the newest", () => {
    const seen: string[] = [];
    classifyDeployHealth(
      input({
        deployments: [
          deployment(OLDER, "inactive", 10, 1),
          deployment(OLDEST, "success", 90, 2),
        ],
        buildIrrelevantSince: (sha) => {
          seen.push(sha);
          return true;
        },
      }),
    );

    expect(seen).toEqual([OLDEST]);
  });

  describe("grace window", () => {
    it("holds fire on undeployed build-relevant changes inside the window", () => {
      const result = classifyDeployHealth(
        input({
          headCommittedAtMs: NOW_MS - (GRACE_MS - 60_000),
          deployments: [deployment(OLDER, "success")],
          buildIrrelevantSince: () => false,
        }),
      );

      expect(result.verdict).toBe("pending");
      expect(result.needsChristian).toBe(false);
    });

    it("escalates the same state to stale once the window has passed", () => {
      const result = classifyDeployHealth(
        input({
          headCommittedAtMs: NOW_MS - (GRACE_MS + 60_000),
          deployments: [deployment(OLDER, "success")],
          buildIrrelevantSince: () => false,
        }),
      );

      expect(result.verdict).toBe("stale");
      expect(result.needsChristian).toBe(true);
    });

    it("treats an in-flight build on HEAD as quiet inside the window", () => {
      for (const state of ["pending", "queued", "in_progress"] as const) {
        const result = classifyDeployHealth(
          input({
            headCommittedAtMs: NOW_MS - 60_000,
            deployments: [deployment(HEAD, state)],
          }),
        );

        expect(result.verdict).toBe("pending");
        expect(result.needsChristian).toBe(false);
      }
    });

    it("flags an in-flight build on HEAD that has outrun the window", () => {
      const result = classifyDeployHealth(
        input({
          headCommittedAtMs: NOW_MS - (GRACE_MS + 60_000),
          deployments: [deployment(HEAD, "in_progress")],
        }),
      );

      expect(result.verdict).toBe("pending");
      expect(result.needsChristian).toBe(true);
    });
  });

  describe("fail-soft (NFP #4)", () => {
    it("returns unknown, not an alarm, when no deployments are visible", () => {
      const result = classifyDeployHealth(input({ deployments: [] }));

      expect(result.verdict).toBe("unknown");
      expect(result.needsChristian).toBe(false);
    });

    it("returns unknown, not an alarm, when the diff comparison is unavailable", () => {
      const result = classifyDeployHealth(
        input({
          deployments: [deployment(OLDER, "success")],
          buildIrrelevantSince: () => null,
        }),
      );

      expect(result.verdict).toBe("unknown");
      expect(result.needsChristian).toBe(false);
    });

    it("returns unknown for an uninterpretable state on HEAD's own deployment", () => {
      const result = classifyDeployHealth(
        input({ deployments: [deployment(HEAD, "inactive")] }),
      );

      expect(result.verdict).toBe("unknown");
      expect(result.needsChristian).toBe(false);
    });
  });

  it("writes plain-language summaries with no bare SHAs-as-jargon or diff-speak (THR-608)", () => {
    const cases = [
      input({ deployments: [deployment(HEAD, "success")] }),
      input({ deployments: [deployment(HEAD, "failure")] }),
      input({ deployments: [deployment(OLDER, "success")], buildIrrelevantSince: () => false }),
    ];

    for (const c of cases) {
      const { summary } = classifyDeployHealth(c);
      expect(summary.length).toBeGreaterThan(20);
      expect(summary).toMatch(/[.!]$/);
      // No raw API vocabulary leaking into Christian's brief.
      expect(summary).not.toMatch(/\b(api|jq|gh |mergeStateStatus|statuses\[)\b/i);
    }
  });
});

describe("parseBuildRelevantPaths", () => {
  it("extracts the path list after the -- separator", () => {
    expect(parseBuildRelevantPaths("git diff --quiet HEAD^ HEAD -- src public index.html")).toEqual([
      "src",
      "public",
      "index.html",
    ]);
  });

  it("returns null rather than an empty list when the shape is unrecognised", () => {
    expect(parseBuildRelevantPaths(undefined)).toBeNull();
    expect(parseBuildRelevantPaths("")).toBeNull();
    expect(parseBuildRelevantPaths("git diff --quiet HEAD^ HEAD")).toBeNull();
    expect(parseBuildRelevantPaths("git diff --quiet HEAD^ HEAD --")).toBeNull();
  });

  // The anti-drift property: the probe must judge "was this change build-relevant?"
  // with the same path list Vercel itself used, so the two cannot disagree.
  it("parses the live vercel.json ignoreCommand and finds src among the paths", () => {
    const config = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "vercel.json"), "utf8")) as {
      ignoreCommand?: string;
    };
    const paths = parseBuildRelevantPaths(config.ignoreCommand);

    expect(paths).not.toBeNull();
    expect(paths).toContain("src");
    expect(paths).toContain("package.json");
  });
});
