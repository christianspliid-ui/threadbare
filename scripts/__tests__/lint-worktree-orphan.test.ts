import { describe, expect, it } from "vitest";
import {
  parseWorktreeList,
  isStaleWorktree,
  getInScopeRelPaths,
  classifyPromotionTarget,
  buildOrphanIssueTitle,
  buildAggregateIssueTitle,
  buildOrphanIssueBody,
  buildAggregateIssueBody,
  WORKTREE_STALENESS_DAYS,
  ORPHAN_AGGREGATE_THRESHOLD,
  ORPHAN_SCOPE_PATTERNS,
} from "../lint-worktree-orphan";

// ---------------------------------------------------------------------------
// parseWorktreeList
// ---------------------------------------------------------------------------

describe("parseWorktreeList", () => {
  it("parses main worktree and one branch worktree", () => {
    const output = [
      "worktree /home/user/repo",
      "HEAD abc123",
      "branch refs/heads/main",
      "",
      "worktree /home/user/repo/.claude/worktrees/thr-123",
      "HEAD def456",
      "branch refs/heads/christianspliid/thr-123-some-feature",
      "",
    ].join("\n");

    const entries = parseWorktreeList(output);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ path: "/home/user/repo", isMain: true, branch: "main" });
    expect(entries[1]).toMatchObject({
      path: "/home/user/repo/.claude/worktrees/thr-123",
      isMain: false,
      branch: "christianspliid/thr-123-some-feature",
    });
  });

  it("handles detached HEAD worktrees (no branch line)", () => {
    const output = [
      "worktree /home/user/repo",
      "HEAD abc123",
      "branch refs/heads/main",
      "",
      "worktree /tmp/detached-worktree",
      "HEAD bbb999",
      "detached",
      "",
    ].join("\n");

    const entries = parseWorktreeList(output);
    expect(entries).toHaveLength(2);
    expect(entries[1]?.branch).toBeNull();
  });

  it("returns empty array for empty output", () => {
    expect(parseWorktreeList("")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// isStaleWorktree
// ---------------------------------------------------------------------------

describe("isStaleWorktree", () => {
  it("returns true for commits older than threshold", () => {
    expect(isStaleWorktree("2026-04-01", "2026-05-14", WORKTREE_STALENESS_DAYS)).toBe(true);
  });

  it("returns false for commits within threshold", () => {
    expect(isStaleWorktree("2026-05-13", "2026-05-14", WORKTREE_STALENESS_DAYS)).toBe(false);
  });

  it("returns false for null lastCommitDate (unknown — skip safely)", () => {
    expect(isStaleWorktree(null, "2026-05-14", WORKTREE_STALENESS_DAYS)).toBe(false);
  });

  it("returns true exactly at the threshold boundary", () => {
    // Exactly 7 days ago — should be considered stale
    expect(isStaleWorktree("2026-05-07", "2026-05-14", 7)).toBe(true);
  });

  it("returns false one day before threshold", () => {
    // 6 days ago — not yet stale
    expect(isStaleWorktree("2026-05-08", "2026-05-14", 7)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// classifyPromotionTarget
// ---------------------------------------------------------------------------

describe("classifyPromotionTarget", () => {
  it("returns vault for TheFantasyWorldSimulator/Vision paths", () => {
    expect(classifyPromotionTarget("TheFantasyWorldSimulator/Vision/world-soul.md")).toBe("vault");
  });

  it("returns vault for TheFantasyWorldSimulator/Brainstorms paths", () => {
    expect(classifyPromotionTarget("TheFantasyWorldSimulator/Brainstorms/2026-04-20-vision-layer.md")).toBe("vault");
  });

  it("returns repo for Docs/plans paths", () => {
    expect(classifyPromotionTarget("Docs/plans/2026-05-11-rulebook-canon-page.md")).toBe("repo");
  });

  it("returns repo for Docs/canon paths", () => {
    expect(classifyPromotionTarget("Docs/canon/encounters.md")).toBe("repo");
  });
});

// ---------------------------------------------------------------------------
// Title builders (idempotency — date-less)
// ---------------------------------------------------------------------------

describe("buildOrphanIssueTitle", () => {
  it("produces a stable, date-less title for dedup", () => {
    const title = buildOrphanIssueTitle("Docs/plans/my-plan.md", "thr-123");
    expect(title).toBe("worktree-orphan: Docs/plans/my-plan.md in thr-123");
    // No date component — title is stable week-over-week
    expect(title).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe("buildAggregateIssueTitle", () => {
  it("produces a stable title for worktrees with many orphans", () => {
    const title = buildAggregateIssueTitle("thr-456");
    expect(title).toBe("worktree-orphan (aggregate): thr-456");
    expect(title).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

// ---------------------------------------------------------------------------
// Body builders
// ---------------------------------------------------------------------------

describe("buildOrphanIssueBody", () => {
  it("mentions the file path, worktree, and promotion target", () => {
    const body = buildOrphanIssueBody({
      relPath: "Docs/plans/my-plan.md",
      worktreePath: "/worktrees/thr-123",
      worktreeName: "thr-123",
      lastCommitDate: "2026-04-01",
      promotionTarget: "repo",
    });
    expect(body).toContain("Docs/plans/my-plan.md");
    expect(body).toContain("thr-123");
    expect(body).toContain("2026-04-01");
    expect(body).toContain("main repo");
  });

  it("mentions vault for vault-targeted orphans", () => {
    const body = buildOrphanIssueBody({
      relPath: "TheFantasyWorldSimulator/Vision/world-soul.md",
      worktreePath: "/worktrees/thr-456",
      worktreeName: "thr-456",
      lastCommitDate: null,
      promotionTarget: "vault",
    });
    expect(body).toContain("canonical Obsidian vault");
  });
});

describe("buildAggregateIssueBody", () => {
  it("lists all orphan paths in a table", () => {
    const orphans = [
      { relPath: "Docs/plans/a.md", promotionTarget: "repo" as const },
      { relPath: "TheFantasyWorldSimulator/Vision/b.md", promotionTarget: "vault" as const },
    ];
    const body = buildAggregateIssueBody({
      orphans,
      worktreePath: "/worktrees/dead-branch",
      worktreeName: "dead-branch",
      lastCommitDate: "2026-03-01",
    });
    expect(body).toContain("Docs/plans/a.md");
    expect(body).toContain("TheFantasyWorldSimulator/Vision/b.md");
    expect(body).toContain("2 files not present");
  });
});

// ---------------------------------------------------------------------------
// Constants smoke
// ---------------------------------------------------------------------------

describe("constants", () => {
  it("WORKTREE_STALENESS_DAYS is positive", () => {
    expect(WORKTREE_STALENESS_DAYS).toBeGreaterThan(0);
  });

  it("ORPHAN_AGGREGATE_THRESHOLD is at least 1", () => {
    expect(ORPHAN_AGGREGATE_THRESHOLD).toBeGreaterThanOrEqual(1);
  });

  it("ORPHAN_SCOPE_PATTERNS covers Vision and Brainstorms", () => {
    expect(ORPHAN_SCOPE_PATTERNS.some((p) => p.includes("Vision"))).toBe(true);
    expect(ORPHAN_SCOPE_PATTERNS.some((p) => p.includes("Brainstorms"))).toBe(true);
  });
});
