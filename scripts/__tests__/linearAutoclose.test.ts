import { describe, expect, it } from "vitest";
import {
  extractCloseableIssueIds,
  isDocsFlushContext,
} from "../linearAutoclose.mjs";

describe("extractCloseableIssueIds", () => {
  it("extracts a single keyword reference", () => {
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
    const ids = extractCloseableIssueIds([
      "fixes thr-7",
      "Closes THR-7",
      "title: Resolves THR-7",
    ]);
    expect(ids).toEqual(["THR-7"]);
  });

  it("ignores bare identifiers with no closing keyword", () => {
    // The flush commit subject `docs(plan): THR-499 ...` must NOT trigger a close.
    expect(extractCloseableIssueIds(["docs(plan): THR-499 kickoff"])).toEqual([]);
  });

  it("ignores Linear issue URLs (the old flush PR body form)", () => {
    // `Closes https://linear.app/threadbare/issue/THR-499/...` is a URL, not `Closes THR-499`.
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

  it("extracts multiple distinct ids from one body", () => {
    const ids = extractCloseableIssueIds([
      "Fixes THR-1 and also Closes THR-2",
    ]);
    expect(ids.sort()).toEqual(["THR-1", "THR-2"]);
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
