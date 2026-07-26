import { describe, expect, it } from "vitest";
import {
  EXEMPTION_TOKEN,
  parseExemptionReason,
  computeStaleWarnings,
  globToRegExp,
  missingInputExitCode,
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
