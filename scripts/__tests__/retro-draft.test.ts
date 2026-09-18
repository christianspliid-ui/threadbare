import { describe, expect, it } from "vitest";

import {
  RETRO_REPORT_FILENAME,
  findLastRetroDate,
  findLatestRetroReportDate,
  resolvePeriodStart,
} from "../retro-draft";

/**
 * THR-1512 — the draft's period boundary is the newest committed retro report,
 * not the impediment-log footer THR-825 retired.
 *
 * The listing below mirrors a real `Design/retros/` directory: weekly reports,
 * the parallel workflow-retro cadence, and this script's own draft output.
 */
const RETRO_DIR_LISTING = [
  "retro-2026-08-28.md",
  "retro-2026-09-06.md",
  "retro-2026-09-12.md",
  "retro-2026-09-18.md",
  "workflow-retro-2026-09-09.md",
  "workflow-retro-2026-09-23.md",
  "retro-2026-09-25-draft.md",
  "README.md",
];

describe("RETRO_REPORT_FILENAME", () => {
  it("accepts only the committed weekly report shape", () => {
    expect(RETRO_REPORT_FILENAME.test("retro-2026-09-18.md")).toBe(true);
    expect(RETRO_REPORT_FILENAME.test("retro-2026-09-18-draft.md")).toBe(false);
    expect(RETRO_REPORT_FILENAME.test("workflow-retro-2026-09-18.md")).toBe(false);
    expect(RETRO_REPORT_FILENAME.test("retro-2026-09-18.md.bak")).toBe(false);
  });
});

describe("findLatestRetroReportDate", () => {
  it("returns the newest committed report date, ignoring drafts and workflow retros", () => {
    // A draft and a workflow retro both carry newer dates than every report;
    // neither may win, or the falsification arm is vacuous.
    expect(findLatestRetroReportDate(RETRO_DIR_LISTING)).toBe("2026-09-18");
  });

  it("is order-independent", () => {
    const reversed = [...RETRO_DIR_LISTING].reverse();
    expect(findLatestRetroReportDate(reversed)).toBe("2026-09-18");
  });

  it("returns null when no committed report exists", () => {
    expect(findLatestRetroReportDate([])).toBeNull();
    expect(
      findLatestRetroReportDate(["retro-2026-09-25-draft.md", "workflow-retro-2026-09-23.md"]),
    ).toBeNull();
  });
});

describe("resolvePeriodStart", () => {
  const staleFooterLog = [
    "| 1 | 1 | 2026-07-30 | tooling | x | y | S | Yes | z | s |",
    "",
    "**Retrospective conducted: 2026-07-31**",
    "",
  ].join("\n");

  it("prefers the committed report over the retired footer", () => {
    expect(
      resolvePeriodStart({
        retroDirFileNames: RETRO_DIR_LISTING,
        impedimentLogMarkdown: staleFooterLog,
      }),
    ).toEqual({ date: "2026-09-18", source: "retro-report" });
  });

  it("prefers the report even when a footer carries a newer date (the footer has no writer)", () => {
    const driftedFooterLog = "**Retrospective conducted: 2026-12-01**\n";
    expect(
      resolvePeriodStart({
        retroDirFileNames: RETRO_DIR_LISTING,
        impedimentLogMarkdown: driftedFooterLog,
      }),
    ).toEqual({ date: "2026-09-18", source: "retro-report" });
  });

  it("falls back to the footer only when no report exists", () => {
    expect(
      resolvePeriodStart({
        retroDirFileNames: ["workflow-retro-2026-09-09.md"],
        impedimentLogMarkdown: staleFooterLog,
      }),
    ).toEqual({ date: "2026-07-31", source: "impediment-log-footer" });
  });

  it("reports no boundary when neither exists", () => {
    expect(
      resolvePeriodStart({ retroDirFileNames: [], impedimentLogMarkdown: "| 1 | 1 | 2026-07-30 |" }),
    ).toEqual({ date: null, source: "none" });
  });
});

describe("findLastRetroDate (legacy footer)", () => {
  it("still reads the newest footer date so the fallback arm is live", () => {
    const log = "**Retrospective conducted: 2026-05-01**\n\n**Retrospective conducted: 2026-06-12**\n";
    expect(findLastRetroDate(log)).toBe("2026-06-12");
    expect(findLastRetroDate("no footer here")).toBeNull();
  });
});
