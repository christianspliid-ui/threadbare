import { describe, expect, it } from "vitest";
import {
  evaluateFlushCloseGuard,
  extractCloseableIssueIds,
  extractNativeCloseableIssueIds,
  isDocsFlushContext,
} from "../linearAutoclose.mjs";

describe("extractCloseableIssueIds", () => {
  it("extracts a single keyword reference on its own line", () => {
    expect(extractCloseableIssueIds(["Fixes THR-12"])).toEqual(["THR-12"]);
  });

  it("matches Fixes / Closes / Resolves case-insensitively", () => {
    const ids = extractCloseableIssueIds([
      "closes THR-1",
      "RESOLVES THR-2",
      "Fixes THR-3",
    ]);
    expect(ids.sort()).toEqual(["THR-1", "THR-2", "THR-3"]);
  });

  it("de-duplicates and upper-cases identifiers across texts", () => {
    const ids = extractCloseableIssueIds(["fixes thr-7", "Closes THR-7"]);
    expect(ids).toEqual(["THR-7"]);
  });

  it("matches a deliberate close line inside a multi-line PR body", () => {
    // The Definition of Done shape: a summary line, a blank line, then the standalone keyword line.
    const body = "docs: update project-status for THR-8\n\nFixes THR-8";
    expect(extractCloseableIssueIds([body])).toEqual(["THR-8"]);
  });

  it("tolerates trailing whitespace and Windows CRLF line endings", () => {
    expect(extractCloseableIssueIds(["intro\r\nFixes THR-8  \r\nmore"])).toEqual([
      "THR-8",
    ]);
  });

  // --- THR-738 regression: the keyword buried in prose must NOT close ---

  it("ignores the keyword inside a prose sentence (the THR-74 recurrence)", () => {
    // PR #807 body: "`Fixes THR-74` still rides the final UI PR" — a negation that documents the
    // discipline. Line-anchoring makes it inert whether or not the backtick is stripped.
    expect(
      extractCloseableIssueIds(["Fixes THR-74 still rides the final UI PR"]),
    ).toEqual([]);
    expect(
      extractCloseableIssueIds(["`Fixes THR-74` still rides the final UI PR"]),
    ).toEqual([]);
  });

  it("ignores the keyword in a markdown bullet or indented line", () => {
    expect(extractCloseableIssueIds(["- Fixes THR-74 in a follow-up"])).toEqual([]);
    expect(extractCloseableIssueIds(["  Fixes THR-74"])).toEqual([]);
  });

  it("ignores a comma-joined inline list (must be one deliberate line each)", () => {
    // The old permissive behaviour matched both ids here; line-anchoring now rejects the prose list.
    expect(extractCloseableIssueIds(["Fixes THR-1 and also Closes THR-2"])).toEqual(
      [],
    );
  });

  it("extracts multiple distinct ids when each is its own deliberate line", () => {
    const ids = extractCloseableIssueIds(["Fixes THR-1\nCloses THR-2"]);
    expect(ids.sort()).toEqual(["THR-1", "THR-2"]);
  });

  it("ignores bare identifiers with no closing keyword", () => {
    // The commit subject `docs(plan): THR-499 ...` must NOT trigger a close.
    expect(extractCloseableIssueIds(["docs(plan): THR-499 kickoff"])).toEqual([]);
  });

  it("ignores Linear issue URLs", () => {
    // `Closes https://linear.app/threadbare/issue/THR-499/...` is a URL, not a `Closes THR-499` line.
    expect(
      extractCloseableIssueIds([
        "Auto-flush. Closes https://linear.app/threadbare/issue/THR-499/ascendant-beats",
      ]),
    ).toEqual([]);
  });

  it("ignores null / empty entries", () => {
    expect(extractCloseableIssueIds([null, undefined, "", "Fixes THR-9"])).toEqual([
      "THR-9",
    ]);
  });
});

describe("isDocsFlushContext", () => {
  it("flags the flush branch", () => {
    expect(isDocsFlushContext({ branch: "docs/plan-flush-2026-06-28-foo" })).toBe(true);
  });

  it("flags the flush PR title", () => {
    expect(isDocsFlushContext({ title: "docs(plan): batch flush 2026-06-28" })).toBe(true);
  });

  it("does not flag a feature branch", () => {
    expect(
      isDocsFlushContext({ branch: "christianspliid/thr-510-auto-close-sweep" }),
    ).toBe(false);
  });

  it("does not flag a legitimate docs closeout PR", () => {
    // `docs: closeout THR-458 ...` SHOULD still be allowed to close — only batch flush is exempt.
    expect(
      isDocsFlushContext({
        branch: "claude/wizardly-moore",
        title: "docs: closeout THR-458 — project-status, history, changelog",
      }),
    ).toBe(false);
  });

  it("returns false for empty context", () => {
    expect(isDocsFlushContext({})).toBe(false);
    expect(isDocsFlushContext()).toBe(false);
  });
});

describe("extractNativeCloseableIssueIds", () => {
  it("matches the bare-id form (same as the custom action)", () => {
    expect(extractNativeCloseableIssueIds(["Closes THR-12"])).toEqual(["THR-12"]);
  });

  it("matches the Linear issue-URL form (native integration closes from this)", () => {
    // The exact vector that falsely closed THR-525: `Closes <linear-issue-url>` in a flush PR body.
    expect(
      extractNativeCloseableIssueIds([
        "Closes https://linear.app/threadbare/issue/THR-525/canonical-axis-registry-scalar-unification",
      ]),
    ).toEqual(["THR-525"]);
  });

  it("de-dupes across bare-id and URL forms of the same issue", () => {
    expect(
      extractNativeCloseableIssueIds([
        "Fixes THR-7",
        "Closes https://linear.app/threadbare/issue/THR-7/foo",
      ]),
    ).toEqual(["THR-7"]);
  });

  it("ignores a plain issue URL with no closing keyword", () => {
    expect(
      extractNativeCloseableIssueIds([
        "See https://linear.app/threadbare/issue/THR-8/foo for context.",
      ]),
    ).toEqual([]);
  });

  it("ignores a bare THR identifier", () => {
    expect(extractNativeCloseableIssueIds(["docs(plan): THR-9 kickoff"])).toEqual([]);
  });
});

describe("evaluateFlushCloseGuard", () => {
  it("blocks: batch-flush title + `Closes THR-NNN` in body", () => {
    expect(
      evaluateFlushCloseGuard({
        title: "docs(plan): batch flush 2026-06-28",
        body: "Auto-flush of plan doc. Closes THR-501",
      }),
    ).toEqual({ blocked: true, isFlush: true, offendingIds: ["THR-501"] });
  });

  it("blocks: `docs/plan-flush-*` branch + `Closes <issue-url>` in body", () => {
    const verdict = evaluateFlushCloseGuard({
      branch: "docs/plan-flush-2026-06-28",
      body: "Closes https://linear.app/threadbare/issue/THR-525/canonical-axis",
    });
    expect(verdict.blocked).toBe(true);
    expect(verdict.offendingIds).toEqual(["THR-525"]);
  });

  it("blocks: flush PR carrying a closing keyword only in a commit message", () => {
    const verdict = evaluateFlushCloseGuard({
      branch: "docs/plan-flush-2026-06-28",
      commitMessages: ["docs(plan): flush", "Fixes THR-333"],
    });
    expect(verdict.blocked).toBe(true);
    expect(verdict.offendingIds).toEqual(["THR-333"]);
  });

  it("passes: flush PR with only a bare `THR-NNN` reference (no keyword)", () => {
    expect(
      evaluateFlushCloseGuard({
        title: "docs(plan): batch flush 2026-06-28",
        body: "Commits plan docs for THR-499 and THR-500.",
      }),
    ).toEqual({ blocked: false, isFlush: true, offendingIds: [] });
  });

  it("passes: legit `docs: closeout THR-NN` PR (not a flush) even with `Fixes THR-NN`", () => {
    // A real closeout SHOULD close its issue — the guard must not apply to non-flush PRs.
    expect(
      evaluateFlushCloseGuard({
        branch: "claude/wizardly-moore",
        title: "docs: closeout THR-458 — project-status, history, changelog",
        body: "Fixes THR-458",
      }),
    ).toEqual({ blocked: false, isFlush: false, offendingIds: [] });
  });

  it("passes: flush PR carrying only a plain issue URL (no keyword)", () => {
    expect(
      evaluateFlushCloseGuard({
        branch: "docs/plan-flush-2026-06-28",
        body: "See https://linear.app/threadbare/issue/THR-525/foo for context.",
      }).blocked,
    ).toBe(false);
  });

  it("returns a not-flush verdict for empty context", () => {
    expect(evaluateFlushCloseGuard({})).toEqual({
      blocked: false,
      isFlush: false,
      offendingIds: [],
    });
    expect(evaluateFlushCloseGuard()).toEqual({
      blocked: false,
      isFlush: false,
      offendingIds: [],
    });
  });
});
